/**
 * The audience reads of live mark sync (user decision 2026-10-05) against the schema and the read rule they mirror,
 * in the style of edge/edge-sql-contract.spec.ts:
 * - one read per mark kind (Q Quick Mark, F Fact / QFact, D DocLink), each a read-only, `$1`-parameterised constant
 *   that compares the mark's uuid primary key with a uuid parameter (never a column cast to text, so the key's index
 *   serves it), with no interpolation;
 * - every table and column it names exists in the schema dump every database matches (sp-audit/schema-dump-output.txt,
 *   section S5), and the column it filters on is that table's primary key (section S6);
 * - who it names is who the reads show the mark to (assets/sql-migrations/2026-07-07_marks_private_by_default.up.sql,
 *   realtime.et_marks): Facts and DocLinks the author plus their share rows, Quick Marks the author only, and the
 *   session column is the one et_marks filters on;
 * - readMarkAudience sends exactly that constant with the id, and nothing else in the mark-sync code reaches the
 *   database.
 */
import * as fs from 'fs';
import * as path from 'path';

import { MARK_AUDIENCE_SQL, readMarkAudience } from './mark-audience.sql';

const ROOT = path.resolve(__dirname, '../../../../..');
const SCHEMA_DUMP = path.join(ROOT, 'sp-audit', 'schema-dump-output.txt');
const MARKS_MIGRATION = path.join(ROOT, 'assets', 'sql-migrations', '2026-07-07_marks_private_by_default.up.sql');

const MARK = '55555555-5555-4555-8555-555555555555';
const SES = '33333333-3333-4333-8333-333333333333';
const OWNER = '11111111-1111-4111-8111-111111111111';
const FRIEND = '22222222-2222-4222-8222-222222222222';

/** public table → column → type, from section S5 of the schema dump. */
function schemaColumns(): Map<string, Map<string, string>> {
    const out = new Map<string, Map<string, string>>();
    const text = fs.readFileSync(SCHEMA_DUMP, 'utf8');
    for (const m of text.matchAll(/^\s*public\s*\|\s*(\w+)\s*\|\s*\d+\s*\|\s*(\w+)\s*\|\s*([^|]+?)\s*\|/gm)) {
        if (!out.has(m[1])) out.set(m[1], new Map());
        out.get(m[1]).set(m[2], m[3]);
    }
    return out;
}

/** public table → its primary key column, from section S6 of the schema dump (single-column keys). */
function primaryKeys(): Map<string, string> {
    const out = new Map<string, string>();
    const text = fs.readFileSync(SCHEMA_DUMP, 'utf8');
    for (const m of text.matchAll(/^\s*public\s*\|\s*(\w+)\s*\|\s*\w+\s*\|\s*PRIMARY KEY \("(\w+)"\)\s*$/gm)) out.set(m[1], m[2]);
    return out;
}

/** alias → table for every `FROM "Table" a` / `JOIN "Table" a` of a read. */
function aliases(sql: string): Map<string, string> {
    return new Map([...sql.matchAll(/\b(?:FROM|JOIN)\s+"([A-Za-z]\w*)"\s+([a-z]\w*)/g)].map(m => [m[2], m[1]]));
}

const KINDS = ['Q', 'F', 'D'] as const;
/** The mark table, its key and its session column, per kind (the same columns et_marks reads). */
const MARK_TABLE = { Q: ['RHighlights', 'nHid', 'nSessionId'], F: ['FactMaster', 'nFSid', 'nSesid'], D: ['DocMaster', 'nDocid', 'nSesid'] } as const;

function fakeDb(answer: { success: boolean; data?: any[]; error?: string }) {
    return { rowQuery: jest.fn(async (_text: string, _params?: any[]) => answer) };
}

describe('mark audience reads (live mark sync SQL contract)', () => {
    it('has one read per mark kind, frozen', () => {
        expect(Object.keys(MARK_AUDIENCE_SQL).sort()).toEqual(['D', 'F', 'Q']);
        expect(Object.isFrozen(MARK_AUDIENCE_SQL)).toBe(true);
    });

    it.each(KINDS)('%s: read-only, $1 only, no interpolation, the uuid key against a uuid parameter', kind => {
        const sql = MARK_AUDIENCE_SQL[kind];
        expect(sql.trimStart().startsWith('SELECT')).toBe(true);
        expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE|GRANT)\b/i);
        expect(sql).not.toContain('${');
        expect(sql).not.toContain(';');
        expect([...new Set([...sql.matchAll(/\$(\d+)/g)].map(m => m[1]))]).toEqual(['1']);
        // review #14 (edge-sql-contract): a btree on the uuid column cannot serve its text cast.
        expect(sql).not.toMatch(/"[A-Za-z]\w*"::text\s*=\s*(ANY\s*\(\s*)?\$\d/);
        const [table, key] = MARK_TABLE[kind];
        const alias = [...aliases(sql)].find(([, t]) => t === table)?.[0];
        expect(alias).toBeDefined();
        expect(sql).toContain(`WHERE ${alias}."${key}" = $1::uuid`);
        // One row per mark, with the three columns readMarkAudience reads.
        for (const col of ['nSesid', 'nOwner', 'aShared']) expect(sql).toContain(`AS "${col}"`);
    });

    it('names only tables and columns the schema has; the filtered column is the uuid primary key', () => {
        const schema = schemaColumns();
        const pks = primaryKeys();
        const unknown: string[] = [];
        for (const kind of KINDS) {
            const sql = MARK_AUDIENCE_SQL[kind];
            const map = aliases(sql);
            for (const [, table] of map) if (!schema.has(table)) unknown.push(`${kind}: table "${table}"`);
            for (const m of sql.matchAll(/\b([a-z]\w*)\."([A-Za-z]\w*)"/g)) {
                const table = map.get(m[1]);
                if (!table || !schema.get(table)?.has(m[2])) unknown.push(`${kind}: ${m[1]}."${m[2]}"`);
            }
            // Every other quoted name is an output column (AS "x") or a table (FROM / JOIN "T").
            for (const m of sql.matchAll(/(?<![.\w])"([A-Za-z]\w*)"/g)) {
                const before = sql.slice(Math.max(0, m.index - 6), m.index);
                if (!/AS\s+$/.test(before) && !schema.has(m[1])) unknown.push(`${kind}: "${m[1]}"`);
            }
            const [table, key, session] = MARK_TABLE[kind];
            expect({ kind, pk: pks.get(table) }).toEqual({ kind, pk: key });
            expect({ kind, type: schema.get(table)?.get(key) }).toEqual({ kind, type: 'uuid' });
            expect({ kind, type: schema.get(table)?.get(session) }).toEqual({ kind, type: 'uuid' });
            expect({ kind, type: schema.get(table)?.get('nUserid') }).toEqual({ kind, type: 'uuid' });
        }
        expect(unknown).toEqual([]);
    });

    it('names who et_marks shows the mark to: Facts and DocLinks author + share rows, Quick Marks the author only', () => {
        const reads = fs.readFileSync(MARKS_MIGRATION, 'utf8');
        // The read rule this mirrors (2026-07-07, private by default; no team or admin bypass).
        expect(reads).toContain('left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid');
        expect(reads).toContain('and (f."nUserid" = nUserid or s."nUserid" = nUserid)');
        expect(reads).toContain('AND (h."nUserid"  = nUserid)');
        expect(reads).toContain('left join "DMShared" s on s."nDocid" = m."nDocid" and s."nUserid" = nUserid');
        expect(reads).toContain('and (m."nUserid" = nUserid or s."nUserid" = nUserid)');
        expect(reads).toContain('where f."nSesid" = nSessionid');
        expect(reads).toContain('WHERE h."nSessionId" = nSessionid');
        expect(reads).toContain('where m."nSesid" = nSessionid');

        const { Q, F, D } = MARK_AUDIENCE_SQL;
        expect(F).toMatch(/f\."nSesid"::text AS "nSesid", f\."nUserid"::text AS "nOwner"/);
        expect(F).toMatch(/SELECT s\."nUserid"::text FROM "FMShared" s WHERE s\."nFSid" = f\."nFSid"/);
        expect(D).toMatch(/m\."nSesid"::text AS "nSesid", m\."nUserid"::text AS "nOwner"/);
        expect(D).toMatch(/SELECT s\."nUserid"::text FROM "DMShared" s WHERE s\."nDocid" = m\."nDocid"/);
        expect(Q).toMatch(/h\."nSessionId"::text AS "nSesid", h\."nUserid"::text AS "nOwner"/);
        // Quick Marks cannot be shared: no share table, an empty share list.
        expect(Q).not.toMatch(/"(FMShared|DMShared)"/);
        expect(Q).toContain(`'{}'::text[] AS "aShared"`);
    });

    describe('readMarkAudience', () => {
        it.each(KINDS)('%s: sends the constant with the id, and answers the session and the author + share recipients', async kind => {
            const db = fakeDb({ success: true, data: [{ nSesid: SES.toUpperCase(), nOwner: OWNER, aShared: [FRIEND, OWNER, null, 'junk', FRIEND.toUpperCase()] }] });
            expect(await readMarkAudience(db, kind, MARK.toUpperCase())).toEqual({ nSesid: SES, users: [OWNER, FRIEND] });
            expect(db.rowQuery.mock.calls).toEqual([[MARK_AUDIENCE_SQL[kind], [MARK]]]);
        });

        it('a mark with no session (a Document Reader PDF mark) keeps its audience with nSesid null', async () => {
            const db = fakeDb({ success: true, data: [{ nSesid: null, nOwner: OWNER, aShared: [] }] });
            expect(await readMarkAudience(db, 'F', MARK)).toEqual({ nSesid: null, users: [OWNER] });
        });

        it('null when the mark does not exist; no query for an id that is not a uuid or an unknown kind', async () => {
            const db = fakeDb({ success: true, data: [] });
            expect(await readMarkAudience(db, 'D', MARK)).toBeNull();
            expect(await readMarkAudience(db, 'D', 'not-a-uuid')).toBeNull();
            expect(await readMarkAudience(db, 'X' as any, MARK)).toBeNull();
            expect(db.rowQuery).toHaveBeenCalledTimes(1);
        });

        it('throws when the read fails (the caller logs it and sends no notice from it)', async () => {
            const db = fakeDb({ success: false, error: 'db down' });
            await expect(readMarkAudience(db, 'Q', MARK)).rejects.toThrow(/db down/);
        });
    });

    it('nothing else in the mark-sync code reaches the database', () => {
        const files = [
            ...fs.readdirSync(__dirname).filter(f => /^mark-.*\.ts$/.test(f) && !f.endsWith('.spec.ts')).map(f => path.join(__dirname, f)),
            path.join(__dirname, '..', '..', 'interceptors', 'mark-write.interceptor.ts'),
        ];
        expect(files.map(f => path.basename(f)).sort()).toEqual(['mark-audience.sql.ts', 'mark-events.module.ts', 'mark-events.port.ts', 'mark-events.service.ts', 'mark-write.interceptor.ts']);
        const offenders: string[] = [];
        for (const file of files) {
            fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
                const where = `${path.basename(file)}:${i + 1} ${line.trim()}`;
                if (/\.(executeRef|query)\(/.test(line)) offenders.push(where);
                if (/\.rowQuery\(/.test(line) && !(path.basename(file) === 'mark-audience.sql.ts' && /db\.rowQuery\(MARK_AUDIENCE_SQL\[kind\], \[id\]\)/.test(line))) offenders.push(where);
            });
        }
        expect(offenders).toEqual([]);
    });
});
