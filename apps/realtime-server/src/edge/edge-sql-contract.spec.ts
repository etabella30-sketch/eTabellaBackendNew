/**
 * The edge module's SQL against assets/sql-migrations/2026-10-01_rt_edge_*.sql (security review: SQL only through the
 * migrations' SPs and parameterised direct reads):
 * - every `et_*` function the migrations create is parsed (name, cursor count, the parameter keys its body reads);
 * - every `callSp(this.db, '<name>', params, ref)` site in the module (static scan) names one of them, fetches its
 *   cursor count and passes only keys the SP reads;
 * - a run of every SP-calling service method goes through FakeEdgeDb, which rejects any call off the contract (the
 *   same check guards every other edge suite, edge-test-kit.spec.ts), and the run covers every SP the module names;
 * - the direct reads are `$n`-parameterised, read-only constants whose identifiers exist in the migrations (or are
 *   columns the existing schema already has), every write goes through an SP (O-8 "Use direct cloud instead" is
 *   et_rtedge_session_rebind_direct, file 09), and nothing else in the module reaches the database.
 */
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { resumeFromHello } from '@app/edge-sync';

import { EdgeRawStoreService } from './edge-raw-store.service';
import { EdgeLink, EdgeRegistryService } from './edge-registry.service';
import { EdgeSyncService } from './edge-sync.service';
import * as T from './edge.types';
import {
    asSpParameter,
    BoxSim,
    deviceKey,
    edgeSpContracts,
    FakeConfig,
    FakeEdgeDb,
    FakeRedis,
    IDS,
    MemoryApplyPort,
    PARSER_VER,
    rmTemp,
    spContractProblems,
    SQL_MIGRATIONS_DIR,
    tempDir,
} from './edge-test-kit.spec';

const EDGE_DIR = __dirname;
const sources = fs
    .readdirSync(EDGE_DIR)
    .filter(f => f.endsWith('.ts') && !f.endsWith('.spec.ts'))
    .map(f => ({ file: f, text: fs.readFileSync(path.join(EDGE_DIR, f), 'utf8') }));

/** The text between the parenthesis at `open` and its partner (strings and template literals skipped). */
function balanced(text: string, open: number): string {
    let depth = 0;
    let quote: string | null = null;
    for (let i = open; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            if (c === '\\') i += 1;
            else if (c === quote) quote = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') quote = c;
        else if (c === '(' || c === '{' || c === '[') depth += 1;
        else if (c === ')' || c === '}' || c === ']') {
            depth -= 1;
            if (depth === 0) return text.slice(open + 1, i);
        }
    }
    throw new Error('unbalanced call');
}

/** Top-level comma split (nested brackets and strings kept together). */
function topLevel(args: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let quote: string | null = null;
    let cur = '';
    for (let i = 0; i < args.length; i++) {
        const c = args[i];
        cur += c;
        if (quote) {
            if (c === '\\') cur += args[++i] ?? '';
            else if (c === quote) quote = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') quote = c;
        else if ('({['.includes(c)) depth += 1;
        else if (')}]'.includes(c)) depth -= 1;
        else if (c === ',' && depth === 0) {
            out.push(cur.slice(0, -1).trim());
            cur = '';
        }
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
}

/** Keys of an object literal `{ a: 1, b, ...x }` (top level; spreads are reported as `...`). */
function literalKeys(obj: string): string[] {
    const inner = obj.trim().replace(/^\{/, '').replace(/\}$/, '');
    return topLevel(inner)
        .filter(Boolean)
        .map(e => (e.startsWith('...') ? '...' : (/^([A-Za-z_$][\w$]*)\s*(?::|$)/.exec(e)?.[1] ?? e)));
}

interface CallSite {
    file: string;
    line: number;
    name: string;
    ref: number;
    /** null: the params come from the caller (checked at run time) */
    keys: string[] | null;
}

/** Every callSp(this.db, '<name>', <params>[, <ref>]) in the module, with the keys its params can hold. */
function callSites(): CallSite[] {
    const out: CallSite[] = [];
    for (const { file, text } of sources) {
        const re = /callSp\(/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text))) {
            if (/function\s+$/.test(text.slice(Math.max(0, m.index - 20), m.index))) continue; // the helper itself
            const args = topLevel(balanced(text, m.index + 'callSp'.length));
            const name = /^'([a-z0-9_]+)'$/.exec(args[1] ?? '')?.[1];
            if (!name) throw new Error(`${file}: callSp without a literal SP name: ${args[1]}`);
            const ref = args[3] === undefined ? 1 : Number(args[3]);
            let keys: string[] | null;
            const params = args[2];
            if (params.startsWith('{')) keys = literalKeys(params);
            else {
                // A `params` variable: its literal plus every `params.X = …` of the same method (the code before the
                // call). A method PARAMETER (recordOrphan(params)) is checked at run time instead (last test).
                const before = text.slice(0, m.index);
                const decl = before.lastIndexOf(`const ${params}`);
                const asArg = Math.max(before.lastIndexOf(`(${params}:`), before.lastIndexOf(`, ${params}:`));
                if (decl < 0 && asArg < 0) throw new Error(`${file}: cannot find the declaration of ${params}`);
                if (asArg > decl) keys = null;
                else {
                    const open = before.indexOf('{', decl);
                    keys = literalKeys(`{${balanced(before, open)}}`);
                    const set = new RegExp(`\\b${params}\\.([A-Za-z_]\\w*)\\s*=(?!=)`, 'g');
                    let s: RegExpExecArray | null;
                    while ((s = set.exec(before.slice(decl)))) keys.push(s[1]);
                }
            }
            out.push({ file, line: text.slice(0, m.index).split('\n').length, name, ref, keys: keys ? [...new Set(keys)] : null });
        }
    }
    return out;
}

/** Column names the migrations create (file 01 tables, file 02 RSessionMaster columns). */
function migrationColumns(): Set<string> {
    const cols = new Set<string>();
    for (const f of ['2026-10-01_rt_edge_01_tables.sql', '2026-10-01_rt_edge_02_session_columns.sql']) {
        const text = fs.readFileSync(path.join(SQL_MIGRATIONS_DIR, f), 'utf8');
        for (const m of text.matchAll(/^\s*(?:ADD COLUMN IF NOT EXISTS\s+)?"([A-Za-z]\w*)"\s+(?:uuid|varchar|char|text|boolean|integer|smallint|bigint|bigserial|timestamptz|timestamp|jsonb|inet)\b/gm)) cols.add(m[1]);
    }
    return cols;
}

/** Tables and columns of the existing schema the direct reads use (not created by the migrations). */
const EXISTING_SCHEMA = new Set(['RSessionMaster', 'UserMaster', 'RtEdgeOrphan', 'RtEdgeEvent', 'nSesid', 'nCaseid', 'cName', 'cStatus', 'nLines', 'cTimezone', 'dDelDt', 'dUpdatedt', 'nUserid', 'isAdmin', 'cEmail', 'cFname', 'cLname']);

const FILE_10 = '2026-10-01_rt_edge_10_review_fixes.sql';
/** The body of `public.<fn>` as file 10 creates it. */
function file10Body(fn: string): string {
    const text = fs.readFileSync(path.join(SQL_MIGRATIONS_DIR, FILE_10), 'utf8');
    const head = text.indexOf(`CREATE OR REPLACE FUNCTION public.${fn}(`);
    if (head < 0) throw new Error(`${fn} is not in ${FILE_10}`);
    const start = text.indexOf('$function$', head);
    return text.slice(start, text.indexOf('$function$', start + 10));
}

const DIRECT_SQL: Record<string, string> = Object.fromEntries(Object.entries(T).filter(([k, v]) => /^EDGE_[A-Z_]+_SQL$/.test(k) && typeof v === 'string')) as Record<string, string>;

describe('edge SQL contract (2026-10-01 rt_edge migrations)', () => {
    beforeAll(() => Logger.overrideLogger(false));

    it('parses every et_* function of the migrations, all in the executeRef shape (parameter json, ref refcursor…)', () => {
        const contracts = edgeSpContracts();
        expect([...contracts.keys()].sort()).toEqual([
            'et_rt_transcript_completeness',
            'et_rtedge_anchor_ids',
            'et_rtedge_applied',
            'et_rtedge_assignments',
            'et_rtedge_case_set',
            'et_rtedge_confirm_key',
            'et_rtedge_create',
            'et_rtedge_enroll',
            'et_rtedge_enroll_code',
            'et_rtedge_event_insert',
            'et_rtedge_get',
            'et_rtedge_heartbeat',
            'et_rtedge_list',
            'et_rtedge_orphan_insert',
            'et_rtedge_orphan_resolve',
            'et_rtedge_quarantine',
            'et_rtedge_revoke',
            'et_rtedge_session_bind',
            'et_rtedge_session_direct',
            'et_rtedge_session_end',
            'et_rtedge_session_forceseal',
            'et_rtedge_session_parser_pin',
            'et_rtedge_session_rebind_direct',
            'et_rtedge_session_seal',
            'et_rtedge_session_split',
            'et_rtedge_warn_ack',
        ]);
        for (const c of contracts.values()) expect(c.signature).toMatch(/^parameter json(, \w+ refcursor)+$/);
        // O-8 (file 09, re-created by file 10 with a row lock): one cursor, the session and its box, nothing else.
        expect(contracts.get('et_rtedge_session_rebind_direct')).toMatchObject({ file: FILE_10, cursors: 1 });
        expect([...contracts.get('et_rtedge_session_rebind_direct').keys].sort()).toEqual(['nEdgeid', 'nSesid']);
        // File 10 re-creates four functions with their contracts unchanged and adds the parser pin (G5).
        expect(contracts.get('et_rtedge_session_bind')).toMatchObject({ file: FILE_10, cursors: 1 });
        expect([...contracts.get('et_rtedge_session_bind').keys].sort()).toEqual(['cParserVer', 'nEdgeid', 'nHearingOpid', 'nMasterid', 'nSesid']);
        expect(contracts.get('et_rtedge_orphan_insert')).toMatchObject({ file: FILE_10, cursors: 1 });
        expect(contracts.get('et_rtedge_orphan_insert').keys.size).toBe(16);
        expect(contracts.get('et_rtedge_enroll')).toMatchObject({ file: FILE_10, cursors: 1 });
        expect([...contracts.get('et_rtedge_enroll').keys].sort()).toEqual(['bTpmKey', 'cEnrollHash', 'cLanIp', 'cParserVer', 'cPubKey', 'cVersion']);
        expect(contracts.get('et_rtedge_session_parser_pin')).toMatchObject({ file: FILE_10, cursors: 1 });
        expect([...contracts.get('et_rtedge_session_parser_pin').keys].sort()).toEqual(['cParserVer', 'nEdgeid', 'nSesid']);
        expect(contracts.get('et_rtedge_get').cursors).toBe(2);
        expect(contracts.get('et_rtedge_assignments').cursors).toBe(5);
        expect(contracts.get('et_rt_transcript_completeness').cursors).toBe(2);
        // The README's input list of the seal SP, read back from its body.
        expect([...contracts.get('et_rtedge_session_seal').keys].sort()).toEqual(
            ['cFinalDigest', 'cRawFinalHash', 'cSealNote', 'jIncidents', 'jSeal', 'nEdgeid', 'nEpoch', 'nFinalLines', 'nFinalRev', 'nRawFinalSeq', 'nRebaseSeq', 'nSesid'].sort(),
        );
        expect(spContractProblems('rtedge_get', { nEdgeid: IDS.box, ref: 1 })).toEqual(['et_rtedge_get opens 2 cursor(s), the call fetches 1']);
        expect(spContractProblems('rtedge_get', { nEdgid: IDS.box, ref: 2 })).toEqual(['et_rtedge_get never reads parameter "nEdgid"']);
        expect(spContractProblems('rtedge_nope', {})).toEqual(['et_rtedge_nope is not created by the 2026-10-01 rt_edge migrations']);
    });

    it('every callSp site of the module names a migration SP, fetches its cursor count and passes only keys it reads', () => {
        const contracts = edgeSpContracts();
        const sites = callSites();
        expect(sites.length).toBeGreaterThanOrEqual(20);
        const problems: string[] = [];
        for (const s of sites) {
            const c = contracts.get(`et_${s.name}`);
            if (!c) {
                problems.push(`${s.file}:${s.line} et_${s.name} does not exist`);
                continue;
            }
            if (s.ref !== c.cursors) problems.push(`${s.file}:${s.line} et_${s.name} fetches ${s.ref} of ${c.cursors} cursors`);
            for (const k of s.keys ?? []) if (k === '...' || !c.keys.has(k)) problems.push(`${s.file}:${s.line} et_${s.name} gets "${k}" it never reads`);
        }
        expect(problems).toEqual([]);
        // Only the orphan insert takes its parameters from its callers (capture, held streams): run-time checked.
        expect(sites.filter(s => s.keys === null).map(s => s.name)).toEqual(['rtedge_orphan_insert']);
        expect([...new Set(sites.map(s => s.name))].sort()).toEqual([
            'rtedge_applied',
            'rtedge_assignments',
            'rtedge_case_set',
            'rtedge_confirm_key',
            'rtedge_create',
            'rtedge_enroll',
            'rtedge_enroll_code',
            'rtedge_event_insert',
            'rtedge_get',
            'rtedge_heartbeat',
            'rtedge_list',
            'rtedge_orphan_insert',
            'rtedge_orphan_resolve',
            'rtedge_quarantine',
            'rtedge_revoke',
            'rtedge_session_forceseal',
            'rtedge_session_parser_pin',
            'rtedge_session_rebind_direct',
            'rtedge_session_seal',
            'rtedge_session_split',
            'rtedge_warn_ack',
        ]);
    });

    it('compares uuid columns with uuid parameters in every direct read, never a column cast to text (review #14: indexes serve them)', () => {
        const offenders: string[] = [];
        for (const [name, sql] of Object.entries(DIRECT_SQL)) {
            // `"col"::text = ANY($n…)` / `"col"::text = $n`: a btree on the uuid column cannot serve its text cast.
            if (/"[A-Za-z]\w*"::text\s*=\s*(ANY\s*\(\s*)?\$\d/.test(sql)) offenders.push(name);
        }
        expect(offenders).toEqual([]);
        expect(T.EDGE_BINDING_SQL).toContain(`r."nSesid" = ANY($1::uuid[])`);
        expect(T.EDGE_SUCCESSOR_SQL).toContain(`r."nPrevPartSesid" = $1::uuid`);
    });

    it('file 10 locks what reviews #11, #12 and #13 found unlocked, in the documented order (session, box, orphans)', () => {
        const bind = file10Body('et_rtedge_session_bind');
        const sessionLock = bind.indexOf(`FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE`);
        const boxShare = bind.indexOf(`FROM public."RtEdgeNode" WHERE "nEdgeid" = v_edge AND "dDelDt" IS NULL FOR SHARE`);
        expect({ sessionLock: sessionLock >= 0, boxShare: boxShare >= 0, order: sessionLock < boxShare }).toEqual({ sessionLock: true, boxShare: true, order: true });
        // G5: no refusal for an unknown parser version any more; the pending state is reported.
        expect(bind).not.toContain('The parser version is unknown');
        expect(bind).toContain(`AS "bParserPending"`);

        const orphan = file10Body('et_rtedge_orphan_insert');
        const rowLock = orphan.indexOf(`WHERE "nSesid" = v_ses FOR NO KEY UPDATE`);
        expect(rowLock).toBeGreaterThan(0);
        expect(rowLock).toBeLessThan(orphan.indexOf(`v_row."bEverEdge" OR`));
        expect(rowLock).toBeLessThan(orphan.indexOf(`WHERE "nOrphanid" = v_oid FOR UPDATE`));

        const rebind = file10Body('et_rtedge_session_rebind_direct');
        const lock = rebind.indexOf(`WHERE "nSesid" = v_ses FOR UPDATE`);
        const orphanCheck = rebind.indexOf(`EXISTS (SELECT 1 FROM public."RtEdgeOrphan" o WHERE o."nSesid" = v_ses)`);
        const update = rebind.indexOf(`UPDATE public."RSessionMaster" r`);
        expect({ lock: lock > 0, order: lock < orphanCheck && orphanCheck < update }).toEqual({ lock: true, order: true });
        // File 09's guards are all still there, bEverEdge cleared as documented.
        const where = rebind.slice(update, rebind.indexOf('RETURNING r."nCaseid"'));
        for (const guard of [`r."nEdgeid" = v_edge`, `r."cFeedSource" = 'E'`, `r."cSyncState" = 'L'`, `r."dDelDt" IS NULL`, `r."nAppliedRawSeq" IS NULL`]) {
            expect({ guard, present: where.includes(guard) }).toEqual({ guard, present: true });
        }
        expect(where).toMatch(/"bEverEdge"\s*= false/);

        // #15: the replaced key survives a re-enrol.
        expect(file10Body('et_rtedge_enroll')).toContain(`'cPrevPubKey', v_node."cPubKey"`);
        const text = fs.readFileSync(path.join(SQL_MIGRATIONS_DIR, FILE_10), 'utf8');
        expect(text).toContain(`IF current_database() <> 'etabella_tech_uuid' THEN`);
        // The rollback drops the function file 10 adds.
        expect(fs.readFileSync(path.join(SQL_MIGRATIONS_DIR, '2026-10-01_rt_edge_99_rollback.sql'), 'utf8')).toContain(
            'DROP FUNCTION IF EXISTS public.et_rtedge_session_parser_pin(json, refcursor);',
        );
    });

    it('reaches the database only through callSp (executeRef) and readRows over $n-parameterised EDGE_*_SQL constants', () => {
        const offenders: string[] = [];
        for (const { file, text } of sources) {
            text.split('\n').forEach((l, i) => {
                if (/\.executeRef\(/.test(l) && !(file === 'edge.types.ts' && /db\.executeRef\(name, \{ \.\.\.params, ref \}\)/.test(l))) offenders.push(`${file}:${i + 1} ${l.trim()}`);
                if (/\.rowQuery\(/.test(l) && !(file === 'edge.types.ts' && /db\.rowQuery\(sql, params\)/.test(l))) offenders.push(`${file}:${i + 1} ${l.trim()}`);
                if (/\.query\(/.test(l)) offenders.push(`${file}:${i + 1} ${l.trim()}`);
            });
            for (const m of text.matchAll(/readRows\(this\.db,\s*'[^']*',\s*([^,]+),/g)) {
                if (!/^EDGE_[A-Z_]+_SQL$/.test(m[1].trim())) offenders.push(`${file}: readRows with ${m[1].trim()}`);
            }
        }
        expect(offenders).toEqual([]);
        for (const [name, sql] of Object.entries(DIRECT_SQL)) {
            expect({ name, interpolated: sql.includes('${') }).toEqual({ name, interpolated: false });
            const placeholders = [...sql.matchAll(/\$(\d+)/g)].map(m => Number(m[1]));
            if (placeholders.length) expect({ name, max: Math.max(...placeholders), distinct: new Set(placeholders).size }).toEqual({ name, max: new Set(placeholders).size, distinct: new Set(placeholders).size });
        }
    });

    it('names only identifiers the migrations create, or that the existing schema has, in the direct reads', () => {
        const known = new Set([...migrationColumns(), ...EXISTING_SCHEMA, 'RtEdgeNode', 'RtEdgeCase']);
        const unknown: string[] = [];
        for (const [name, sql] of Object.entries(DIRECT_SQL)) {
            for (const m of sql.matchAll(/(?<!AS )"([A-Za-z]\w*)"/g)) if (!known.has(m[1])) unknown.push(`${name}: "${m[1]}"`);
        }
        expect(unknown).toEqual([]);
        // The helper the case-admin read calls exists with that signature.
        const helpers = fs.readFileSync(path.join(SQL_MIGRATIONS_DIR, '2026-10-01_rt_edge_04_helpers.sql'), 'utf8');
        expect(helpers).toContain('CREATE OR REPLACE FUNCTION public.rtedge_is_case_admin(p_case uuid, p_user uuid)');
        // Every write is an SP: no direct constant writes (O-8 "Use direct cloud instead" moved into file 09).
        const writers = Object.entries(DIRECT_SQL).filter(([, sql]) => /\b(UPDATE|INSERT|DELETE)\b/i.test(sql)).map(([k]) => k);
        expect(writers).toEqual([]);
        expect(Object.keys(T)).not.toContain('EDGE_REBIND_DIRECT_SQL');
        // The SP keeps the guards of the UPDATE it replaced: on that box, still 'E' and live, not deleted, never fed, no orphan.
        const rebind = fs.readFileSync(path.join(SQL_MIGRATIONS_DIR, '2026-10-01_rt_edge_09_session_rebind_direct.sql'), 'utf8');
        const where = rebind.slice(rebind.indexOf('UPDATE public."RSessionMaster" r'), rebind.indexOf('RETURNING r."nCaseid"'));
        for (const guard of [
            `r."nSesid" = v_ses`,
            `r."nEdgeid" = v_edge`,
            `r."cFeedSource" = 'E'`,
            `r."cSyncState" = 'L'`,
            `r."dDelDt" IS NULL`,
            `r."nAppliedRawSeq" IS NULL`,
            `NOT EXISTS (SELECT 1 FROM public."RtEdgeOrphan" o WHERE o."nSesid" = r."nSesid")`,
        ]) expect({ guard, present: where.includes(guard) }).toEqual({ guard, present: true });
        expect(where).toMatch(/"bEverEdge"\s*= false/);
        expect(rebind).toContain(`IF current_database() <> 'etabella_tech_uuid' THEN`);
    });

    it('runs every SP the module calls through the contract check, with the parameters as executeRef sends them', async () => {
        const dir = tempDir('sqlc');
        const routeFile = path.join(dir, 'routes.json');
        fs.writeFileSync(routeFile, JSON.stringify([{ nSesid: IDS.ses, nCaseid: IDS.caseA, user: 'courtroom-1', passwordSalt: 'c2FsdA==', passwordHash: 'aGFzaA==', feedSource: 'E', nEdgeid: IDS.box, epoch: 1 }]));
        const config = new FakeConfig({ EDGE_ENABLED: '1', EDGE_JOURNAL_DIR: path.join(dir, 'journal'), EDGE_CAPTURE_DIR: path.join(dir, 'captures'), ECLIPSE_SESSION_CONFIG: routeFile });
        const db = new FakeEdgeDb();
        const redis = new FakeRedis();
        const apply = new MemoryApplyPort();
        const key = deviceKey();
        db.addNode({ nEdgeid: IDS.box, cPubKey: key.spkiB64, cKeyFpr: key.fpr });
        db.assignCase(IDS.box, IDS.caseA);
        db.addSession({ nSesid: IDS.ses });
        const opts = { timings: { viewerOnlineAfterMs: 5, viewerOfflineAfterMs: 5, silentPageAfterMs: 5 } };
        const registry = new EdgeRegistryService(db as any, redis as any, config as any, { server: null }, { issue: jest.fn(), revoke: jest.fn(async () => undefined) } as any, async () => 'AS64500', async () => undefined, opts);
        const link: EdgeLink = { push: async () => ({ delivered: true, reply: { ok: true } }), disconnect: () => undefined, connection: () => null, setStatus: () => undefined };
        registry.bindLink(link);
        const raw = new EdgeRawStoreService(db as any, config as any, registry, undefined, opts);
        const sync = new EdgeSyncService(db as any, redis as any, config as any, registry, raw, apply, opts);
        const ADMIN = { userId: IDS.admin, isAdmin: true };
        try {
            const created = await registry.createNode(ADMIN, { cName: 'Court 3', cVenue: 'RCJ', nCatPort: 2500, nScopeAdmin: IDS.admin });
            await registry.issueEnrollCode(ADMIN, created.node.nEdgeid);
            const code = (await registry.issueEnrollCode(ADMIN, created.node.nEdgeid)).code;
            const enrolled = await registry.enroll({ code, cPubKey: deviceKey().spkiB64, bTpmKey: false, cVersion: '1.0.0', cParserVer: PARSER_VER, cLanIp: '10.0.0.5' });
            await registry.confirmKey(ADMIN, enrolled.nEdgeid, enrolled.keyFingerprint);
            await registry.getNode(IDS.box);
            await registry.listNodes({ nCaseid: IDS.caseA, bAll: true });
            await registry.setCase(ADMIN, IDS.box, IDS.caseB, 'I');
            await registry.assignments(IDS.box);
            await registry.heartbeat(IDS.box, { ip: '198.51.100.7', health: { sw: '1' }, cVersion: '1.0.0', cParserVer: PARSER_VER, force: true });
            await registry.event('online', { nEdgeid: IDS.box, nSesid: IDS.ses, jData: { a: 1 }, nMasterid: IDS.admin });
            const box = new BoxSim(IDS.ses, key).arm().connOpen();
            box.addLines(30);
            const conn = { nEdgeid: IDS.box, bootId: box.bootId, status: 'A' as const, pubKey: key.spkiB64, ip: '127.0.0.1', helloed: new Map() };
            const capture = await sync.capture(conn, { kind: 'C', nSesid: IDS.ses, user: 'u', peer: '10.0.0.9', fromMs: 1, toMs: 2, bytes: 3, sha256: 'a'.repeat(64) });
            await registry.resolveOrphan(ADMIN, capture.nOrphanid, 'A', 'addendum');
            // The held direct stream (orphan 'H') records itself at open and at close.
            const held = await raw.openHeldStream({ nSesid: IDS.ses, user: 'courtroom-1', peer: '203.0.113.9', connId: 'c-1', nEdgeid: IDS.box });
            held.write(Buffer.from('post-handshake bytes'));
            await held.close('test');
            const m = await sync.feedStatus(IDS.ses);
            expect(m.msg).toBe(1);
            await sync.split(IDS.ses, ADMIN, { cName: 'Part 2', cNote: 'box died' });
            await sync.persistApplied({ ...(sync.peekMeta(IDS.ses) as any), appliedRawSeq: 1, appliedRawHash: 'a'.repeat(64), nEdgeid: IDS.box }, true);
            db.sessions.get(IDS.ses).cSyncState = 'W';
            await sync.warnAck(ADMIN, IDS.ses, 'read');
            db.sessions.get(IDS.ses).cSyncState = 'S';
            await sync.forceSeal(ADMIN, IDS.ses, 'venue data missing');
            await registry.quarantine(ADMIN, IDS.box, 'Q', 'test');
            await registry.revokeNode(ADMIN, IDS.box, 'gone');
            // The seal SP, from a second session sealed by its box (bound before the box reported a parser version:
            // its hello pins it, G5).
            db.nodes.get(IDS.box).cStatus = 'A';
            db.addSession({ nSesid: IDS.ses2, cParserVer: null });
            const b2 = new BoxSim(IDS.ses2, key).arm().connOpen();
            b2.addLines(10);
            const hello: any = await sync.hello(conn, { proto: 1, protoMin: 1, fmt: 1, sw: '1', parserVer: PARSER_VER, bootId: b2.bootId, sessions: [b2.helloSession()] });
            expect(hello.sessions[0].verdict).toBe('continue');
            const resume = resumeFromHello(hello.sessions[0], b2.journal());
            b2.cutter.advanceRev(resume.appliedRev);
            await sync.raw(conn, b2.rawBatch(1));
            const built = b2.round(resume.cloud, resume.lineage);
            const applied: any = await sync.round(conn, built.parts[0]);
            expect(applied).toMatchObject({ ok: true });
            b2.end();
            await sync.raw(conn, b2.rawBatch(b2.headSeq));
            expect(await sync.seal(conn, b2.seal(applied.appliedRev, built.afterAck.cloud))).toMatchObject({ complete: true });
            // O-8 through file 09: a never-fed session of a revoked box re-binds to direct cloud.
            db.addSession({ nSesid: IDS.ses3 });
            expect(await sync.useDirectCloud(IDS.ses3, ADMIN, { boxRevoked: true })).toMatchObject({ msg: 1, cFeedSource: 'D' });
            expect(db.callsOf('rtedge_session_rebind_direct')).toEqual([{ nSesid: IDS.ses3, nEdgeid: IDS.box }]);
            expect(db.sessions.get(IDS.ses3)).toMatchObject({ cFeedSource: 'D', cApply: 'L', nEdgeid: null, bEverEdge: false, cSyncState: null });
            await new Promise(r => setTimeout(r, 20));

            expect(db.contractViolations).toEqual([]);
            const called = new Set(db.calls.map(c => c[0]));
            const named = new Set(callSites().map(s => s.name));
            expect([...named].filter(n => !called.has(n))).toEqual([]);
            // What the SPs receive: j* values as JSON text (their bodies parse ->> with rtedge_jsonb / rtedge_text).
            const seal = db.calls.find(c => c[0] === 'rtedge_session_seal')[1];
            const sent = asSpParameter(seal);
            expect(typeof sent.jSeal).toBe('string');
            expect(typeof sent.jIncidents).toBe('string');
            expect(JSON.parse(sent.jSeal)).toMatchObject({ nSesid: IDS.ses2 });
        } finally {
            sync.onModuleDestroy();
            await sync.flushMetaWrites();
            rmTemp(dir);
        }
    });
});
