/**
 * CliPort (ports/cli.port.ts): the console commands of the box (spec §3.2 `cli`, §3.4 install, §10 #9; runbook §11.6,
 * §13). Runs in a 'cli' application context: nothing listens, dials or connects unless the command needs it.
 *
 * - `enroll --code <code> [--cloud <url>] [--rekey]`: `UplinkPort.enrol` (device key → cloud → identity); prints the
 *   key fingerprint the admin compares in Venue boxes. The only key material ever printed is that fingerprint.
 * - `status [--json]`: identity, sessions (unsealed ones called out: a box must go back online to seal them), link,
 *   transmitter, disk, held captures, the LAN certificate (`UplinkPort.certificate()`), state health and release.
 * - `recover --journal <dir> [--out <file>]`: rebuild a session's transcript from a surviving journal directory
 *   (`journal/<nSesid>/`, copied off a dead box's disk) by deterministic replay under this build's parser (rt-ingest
 *   `recoverSession`, no checkpoints, nothing written into the journal) and one edge-sync cut; writes JSON with the
 *   canonical pages (digest-comparable with the cloud's Part 1), the plain text and the root. Never prints transcript
 *   text to the console.
 * - `capture list` / `capture upload [--id <id>]`: held second-connection captures (orphan kind 'C'); an upload uses
 *   a one-shot uplink connection (no hello), and is refused while the box service looks connected (it uploads held
 *   captures itself, and a second connection with another boot id would be refused as a duplicate identity, MR-6).
 * - `cert install --key <file> --chain <file>`: the v1 manual path for the LAN certificate while the cloud issues none
 *   (review 5; parsed by ports/cli.port.ts like every command). The pair is checked (it loads, the key matches, it
 *   names `<slug>.<domain>`, it is valid now, the key is not the device key) before anything is written, then
 *   installed atomically (uplink/cert-install.ts) under the cert directory's install lock, which the running box's
 *   own installs take too, so the two never interleave (a held lock → "try again", nothing changed). Every attempt
 *   that reaches the check is audited (`cert-install`, `via: 'console'`; outcome ok / refused / busy). The running box
 *   hot-reloads the pair. Prints the host, fingerprint and expiry, never key text.
 * Expected failures print on `out.error` and exit `failed`; programming errors propagate (main.ts: exit 70).
 */
import * as fs from 'fs';
import * as path from 'path';

import { Inject, Injectable, Optional } from '@nestjs/common';

import { PageCutter, rootDigest } from '@app/edge-sync';
import { FEED_PARSE_VERSION } from '@app/feed-parse';
import { chainSeed, JournalCorruptError, ParserVersionMismatchError, recoverSession, RebaseNotSupportedError } from '@app/rt-ingest';

import {
    BOX_CONFIG,
    BoxConfig,
    boxHostname,
    CliOutput,
    CliPort,
    EDGE_CLOCK,
    EDGE_EXIT,
    EdgeCliCommand,
    EdgeClock,
    isEdgePortError,
    isNotImplemented,
    EdgeTlsError,
    STATE_PORT,
    StatePort,
    UPLINK_PORT,
    UplinkPort,
} from '../ports';
import { CertificateInstallBusyError, CertificateRefusedError, checkCertificatePair, installCertificatePair } from '../uplink/cert-install';

/** Optional DI token of spec seams (cli.module.ts provides nothing for it by default). */
export const CLI_OPTIONS = 'RT_EDGE_CLI_OPTIONS';

export interface CliOptions {
    /** Free MiB on the filesystem of `dir` (default fs.statfs); null when unknown. */
    readonly diskFreeMb?: (dir: string) => Promise<number | null>;
    /** The box service counts as running when the cloud heard from it this recently (default 90 s). */
    readonly serviceActiveWithinMs?: number;
}

const SERVICE_ACTIVE_WITHIN_MS = 90_000;

/** The JSON `recover` writes (`format` versions the shape). */
export interface RecoveredTranscript {
    readonly format: 'rt-edge-recover/1';
    readonly nSesid: string;
    readonly nCaseid: string | null;
    readonly parserVer: string;
    readonly tz: string | null;
    readonly nLines: number;
    readonly fmt: number;
    readonly protocol: 'B' | 'C' | null;
    readonly recoveredAtMs: number;
    readonly journal: { readonly dir: string; readonly headSeq: number; readonly headHash: string; readonly dataBytes: number; readonly tailTruncated: boolean };
    /** SESSION_END, when the journal holds it. */
    readonly ended: { readonly endedBy: string; readonly atMs: number; readonly seq: number } | null;
    readonly incidents: ReadonlyArray<Record<string, unknown>>;
    readonly totalLines: number;
    /** edge-sync root over the canonical pages (spec §5.2): equal to the cloud's for the same state. */
    readonly root: string;
    /** Canonical pages, page p at index p-1 (spec §6.2 canonical line). */
    readonly pages: ReadonlyArray<ReadonlyArray<readonly unknown[]>>;
    /** One plain-text line per transcript line, for reading. */
    readonly text: readonly string[];
}

type Pad = (label: string, value: unknown) => string;
const pad: Pad = (label, value) => `  ${`${label}:`.padEnd(22)} ${value === null || value === undefined || value === '' ? '-' : String(value)}`;
const iso = (ms: number | null | undefined): string | null => (typeof ms === 'number' && Number.isFinite(ms) ? new Date(ms).toISOString() : null);
const errText = (err: unknown): string => (err instanceof Error ? err.message : String(err));

@Injectable()
export class EdgeCli implements CliPort {
    private readonly opts: CliOptions;

    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(UPLINK_PORT) private readonly uplink: UplinkPort,
        @Optional() @Inject(CLI_OPTIONS) opts?: CliOptions,
    ) {
        this.opts = opts ?? {};
    }

    async run(command: EdgeCliCommand, out: CliOutput): Promise<number> {
        try {
            switch (command.name) {
                case 'enroll':
                    return await this.enroll(command, out);
                case 'status':
                    return await this.status(command.json, out);
                case 'recover':
                    return await this.recover(command.journal, command.out, out);
                case 'capture-list':
                    return this.captureList(out);
                case 'capture-upload':
                    return await this.captureUpload(command.id, out);
                case 'cert-install':
                    return this.certInstall(command, out);
                default:
                    out.error(`rt-edge: unknown command ${(command as { name?: unknown }).name}`);
                    return EDGE_EXIT.usage;
            }
        } catch (err) {
            if (isNotImplemented(err)) throw err;
            if (isEdgePortError(err)) {
                out.error(`rt-edge: ${command.name} failed: ${this.explain(err.code, err.message)}`);
                return EDGE_EXIT.failed;
            }
            throw err;
        }
    }

    // ---- enroll ------------------------------------------------------------------------------------------------------

    private async enroll(command: Extract<EdgeCliCommand, { name: 'enroll' }>, out: CliOutput): Promise<number> {
        const res = await this.uplink.enrol({ code: command.code, cloudOrigin: command.cloud ?? undefined, rekey: command.rekey });
        out.log(`Enrolled with ${this.config.cloud.origin} as box ${res.nEdgeid} (${boxHostname(res.slug, this.config.box.domain)})`);
        out.log(`Key fingerprint: ${res.keyFingerprint}`);
        out.log(
            res.status === 'active'
                ? 'Status: active (the cloud already confirmed this key)'
                : 'Status: waiting for an admin to confirm this fingerprint in Venue boxes; start the box service and it links on the first accepted connection',
        );
        return EDGE_EXIT.ok;
    }

    // ---- status ------------------------------------------------------------------------------------------------------

    private async status(asJson: boolean, out: CliOutput): Promise<number> {
        const now = this.clock();
        const identity = this.state.identity.get();
        const sessions = this.state.sessions.list();
        const journalBytes = await dirBytes(this.config.paths.journalDir);
        const captureBytes = await dirBytes(this.config.paths.captureDir);
        const diskFreeMB = await (this.opts.diskFreeMb ?? statfsFreeMb)(this.config.paths.dataDir).catch(() => null);
        const cert = this.uplink.certificate();
        const tx = this.state.transmitter.get();
        const held = this.state.heldCaptures.list();
        const health = this.state.health();
        const perSession = await Promise.all(
            sessions.map(async s => ({
                nSesid: s.nSesid,
                name: s.cName,
                localState: s.localState,
                cloudOp: s.cloudOp,
                firstLineAt: iso(s.firstLineAtMs),
                endRequestedAt: iso(s.endRequestedAtMs),
                endedAt: iso(s.endedAtMs),
                sealedAt: iso(s.sealedAtMs),
                sealState: s.sealState,
                journalBytes: await dirBytes(path.join(this.config.paths.journalDir, s.nSesid)),
            })),
        );
        const unsealed = sessions.filter(s => s.sealedAtMs === null);
        const report = {
            box: { name: this.config.box.name, label: this.config.box.label, timeZone: this.config.box.timeZone, mode: this.config.mode },
            release: { version: this.config.release.version, parserVer: FEED_PARSE_VERSION },
            identity: identity
                ? {
                      nEdgeid: identity.nEdgeid,
                      host: boxHostname(identity.slug, this.config.box.domain),
                      status: identity.status,
                      keyFingerprint: identity.keyFingerprint,
                      cloudOrigin: identity.cloudOrigin,
                      enrolledAt: iso(identity.enrolledAtMs),
                      confirmedAt: iso(identity.confirmedAtMs),
                      lastCloudContactAt: iso(identity.lastCloudContactAtMs),
                      linkFailure: identity.linkFailure,
                  }
                : null,
            link: {
                linked: !!identity && identity.status === 'active' && !identity.linkFailure,
                lastCloudContactAgoSec: identity?.lastCloudContactAtMs ? Math.max(0, Math.floor((now - identity.lastCloudContactAtMs) / 1000)) : null,
                assignmentsSyncedAt: iso(this.state.assignments.syncedAtMs()),
            },
            sessions: perSession,
            unsealed: { count: unsealed.length, ending: unsealed.filter(s => s.endedAtMs === null && (s.cloudOp === 'end' || s.localState === 'ending')).length, endedAwaitingSeal: unsealed.filter(s => s.endedAtMs !== null).length },
            transmitter: { mode: tx.settings?.mode ?? 'listen', host: tx.settings?.host ?? null, port: tx.settings?.port ?? null, protocol: tx.settings?.protocol ?? null, ...(tx.settings?.mode === 'serial' ? { serialPath: tx.settings.serialPath ?? null, baudRate: tx.settings.baudRate ?? null } : {}), stateVersion: this.state.transmitter.version() },
            disk: { dataDir: this.config.paths.dataDir, freeMB: diskFreeMB, journalBytes, captureBytes },
            heldCaptures: { total: held.length, pendingUpload: held.filter(c => c.sha256 !== null && c.uploadedAtMs === null).length, open: held.filter(c => c.toMs === null).length },
            certificate: {
                state: cert.state,
                host: identity ? boxHostname(identity.slug, this.config.box.domain) : null,
                coversHost: cert.coversHost,
                daysLeft: cert.daysLeft,
                notAfter: iso(cert.info?.notAfterMs ?? null),
                problem: cert.problem?.message ?? null,
            },
            state: { ok: health.ok, file: health.file, schemaVersion: health.schemaVersion, sizeBytes: health.sizeBytes, walBytes: health.walBytes },
        };
        if (asJson) {
            out.log(JSON.stringify(report, null, 2));
            return EDGE_EXIT.ok;
        }
        out.log(`rt-edge ${report.release.version} (parser ${report.release.parserVer}) · ${report.box.name} [${report.box.label}] · ${report.box.mode}`);
        out.log('Identity');
        if (!report.identity) {
            out.log('  not enrolled: run "rt-edge enroll --code <code>" (Venue boxes → Add)');
        } else {
            out.log(pad('box', `${report.identity.nEdgeid} (${report.identity.host})`));
            out.log(pad('status', report.identity.status));
            out.log(pad('key fingerprint', report.identity.keyFingerprint));
            out.log(pad('cloud', report.identity.cloudOrigin));
            out.log(pad('last cloud contact', report.identity.lastCloudContactAt ? `${report.identity.lastCloudContactAt} (${report.link.lastCloudContactAgoSec} s ago)` : null));
            out.log(pad('link problem', report.identity.linkFailure));
        }
        out.log(`Sessions (${report.sessions.length}; ${report.unsealed.count} not sealed)`);
        for (const s of report.sessions) {
            const what = s.sealedAt ? `sealed ${s.sealState ?? ''}`.trim() : s.endedAt ? 'ended, awaiting the seal' : s.cloudOp === 'end' || s.localState === 'ending' ? 'ending' : s.localState;
            out.log(`  ${s.nSesid}  ${s.name || '-'}  ${what}  journal ${formatBytes(s.journalBytes)}`);
        }
        if (report.unsealed.count) out.log('  ! sessions not sealed: bring the box back online so it can upload and seal them before it is switched off or re-imaged');
        out.log('Transmitter');
        const t = report.transmitter;
        out.log(pad('mode', t.mode === 'dial'
            ? `dial ${t.host ?? '?'}:${t.port ?? '?'} (${t.protocol ?? '?'})`
            : t.mode === 'serial'
                ? `COM port ${t.serialPath ?? '?'} @ ${t.baudRate ?? '?'} (${t.protocol ?? '?'})`
                : `listen :${this.config.transmitter.listenPort}`));
        out.log('Disk');
        out.log(pad('free', report.disk.freeMB === null ? null : `${report.disk.freeMB} MiB`));
        out.log(pad('journals', formatBytes(report.disk.journalBytes)));
        out.log(pad('held captures', `${formatBytes(report.disk.captureBytes)} (${report.heldCaptures.total}, ${report.heldCaptures.pendingUpload} waiting to upload)`));
        out.log('Certificate');
        out.log(pad('state', report.certificate.state + (report.certificate.problem ? ` (${report.certificate.problem})` : '')));
        out.log(pad('host', report.certificate.host));
        out.log(pad('days left', report.certificate.daysLeft));
        out.log(pad('covers host', report.certificate.coversHost));
        out.log('State database');
        out.log(pad('integrity', report.state.ok ? 'ok' : 'FAILED quick_check'));
        out.log(pad('schema', report.state.schemaVersion));
        return EDGE_EXIT.ok;
    }

    // ---- recover -----------------------------------------------------------------------------------------------------

    private async recover(journal: string, outFile: string | null, out: CliOutput): Promise<number> {
        const dir = path.resolve(journal);
        let names: string[];
        try {
            if (!(await fs.promises.stat(dir)).isDirectory()) throw new Error('not a directory');
            names = await fs.promises.readdir(dir);
        } catch (err) {
            out.error(`rt-edge: recover failed: ${dir} is not a readable journal directory (${errText(err)})`);
            return EDGE_EXIT.failed;
        }
        if (!names.some(n => /^seg-\d{5,}\.ej$/.test(n))) {
            out.error(`rt-edge: recover failed: no journal segments (seg-*.ej) in ${dir}; pass the session's journal directory (journal/<nSesid>)`);
            return EDGE_EXIT.failed;
        }
        const nSesid = path.basename(dir);
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(nSesid)) {
            out.error(`rt-edge: recover failed: the directory name "${nSesid}" is not a session id; copy the journal to a directory named after the session`);
            return EDGE_EXIT.failed;
        }
        const target = path.resolve(outFile ?? `${dir}.transcript.json`);
        if (target.startsWith(`${dir}${path.sep}`)) {
            out.error('rt-edge: recover failed: --out must be outside the journal directory (the journal is never written)');
            return EDGE_EXIT.failed;
        }
        if (fs.existsSync(target)) {
            out.error(`rt-edge: recover failed: ${target} exists; remove it or pass another --out`);
            return EDGE_EXIT.failed;
        }
        let res;
        try {
            res = await recoverSession({ nSesid, journalRoot: path.dirname(dir), useCheckpoint: false, parserVer: FEED_PARSE_VERSION, stayInReplay: true });
        } catch (err) {
            if (err instanceof ParserVersionMismatchError) out.error(`rt-edge: recover failed: the journal is pinned to parser ${err.pinned}; this build runs ${err.running}. Use an image of that release (DET-10).`);
            else if (err instanceof JournalCorruptError) out.error(`rt-edge: recover failed: the journal is corrupt at ${err.segment}:${err.offset} (expected seq ${err.expectSeq}); the records before it are intact but replay stops (MR-4)`);
            else if (err instanceof RebaseNotSupportedError) out.error(`rt-edge: recover failed: ${err.message}`);
            else out.error(`rt-edge: recover failed: ${errText(err)}`);
            return EDGE_EXIT.failed;
        }
        const applier = res.applier;
        const header = res.header;
        const nLines = header?.nLines ?? 25;
        const fmt = Number(header?.fmt ?? 1) || 1;
        const headHash = res.head.hash ? res.head.hash.toString('hex') : chainSeed(nSesid).toString('hex');
        const cutter = new PageCutter({ nSesid, nLines, fmt, rawSeqThrough: 0, rawHashThrough: chainSeed(nSesid).toString('hex') });
        const lane = applier.lane;
        if (lane) {
            await lane.idle();
            await lane.inLane(() => cutter.boundaryFromContext(lane.ctx as never, res.head.seq, headHash));
        }
        const view = cutter.view();
        const pages = view.pages;
        const transcript: RecoveredTranscript = {
            format: 'rt-edge-recover/1',
            nSesid,
            nCaseid: header?.nCaseid ?? null,
            parserVer: res.parserVer,
            tz: header?.tz ?? null,
            nLines,
            fmt,
            protocol: applier.protocol,
            recoveredAtMs: this.clock(),
            journal: { dir, headSeq: res.head.seq, headHash, dataBytes: applier.dataBytes, tailTruncated: !!res.tailTruncated },
            ended: applier.ended ? { endedBy: applier.ended.endedBy, atMs: applier.ended.at, seq: applier.ended.seq } : null,
            incidents: applier.incidents.map(i => ({ ...i })),
            totalLines: view.totalLines,
            root: view.totalLines ? view.root : rootDigest(nSesid, 0, []),
            pages,
            text: pages.flatMap(page => page.map(line => (Array.isArray(line[1]) ? String.fromCharCode(...(line[1] as number[])) : ''))),
        };
        await fs.promises.mkdir(path.dirname(target), { recursive: true });
        await fs.promises.writeFile(target, JSON.stringify(transcript), { flag: 'wx', mode: 0o600 });
        out.log(`Recovered session ${nSesid} from ${res.head.seq} journal record(s) (${formatBytes(applier.dataBytes)} of transmitter data)`);
        out.log(`  ${transcript.totalLines} line(s) on ${pages.length} page(s); root ${transcript.root}`);
        out.log(`  ${transcript.ended ? `ended (${transcript.ended.endedBy}) at ${iso(transcript.ended.atMs)}` : 'NOT ended: the box stopped mid-session'}; ${transcript.incidents.length} incident(s)${transcript.journal.tailTruncated ? '; a torn tail was ignored' : ''}`);
        out.log(`  written to ${target}`);
        return EDGE_EXIT.ok;
    }

    // ---- cert install ------------------------------------------------------------------------------------------------

    private certInstall(command: Extract<EdgeCliCommand, { name: 'cert-install' }>, out: CliOutput): number {
        const fail = (why: string): number => {
            out.error(`rt-edge: cert install failed: ${why}`);
            return EDGE_EXIT.failed;
        };
        /** The audit row (never key or certificate text): who is the console, so `actor` is null. */
        const audit = (outcome: 'ok' | 'refused' | 'busy', target: string, data: Record<string, unknown>): void => {
            try {
                this.state.audit.append({ atMs: this.clock(), action: 'cert-install', actor: null, outcome, nSesid: null, target, ip: null, deviceHash: null, data: { via: 'console', ...data } });
            } catch {
                /* the install itself is done (or refused); an audit write failure must not change the exit code */
            }
        };
        const tls = this.config.http.tls;
        if (!tls) return fail('this box serves plain HTTP (dev mode, http.tls is null): there is no certificate to install');
        const identity = this.state.identity.get();
        if (!identity) return fail('the box is not enrolled: the certificate must name the box host <slug>.' + this.config.box.domain + ' (rt-edge enroll first)');
        const host = boxHostname(identity.slug, this.config.box.domain);
        const read = (flag: string, file: string): string | null => {
            try {
                return fs.readFileSync(path.resolve(file), 'utf8');
            } catch (err) {
                out.error(`rt-edge: cert install failed: cannot read --${flag} ${path.resolve(file)} (${errText(err)}); inside the box container only ${this.config.paths.dataDir} is shared with the host`);
                return null;
            }
        };
        const keyPem = read('key', command.key);
        if (keyPem === null) return EDGE_EXIT.failed;
        const chainPem = read('chain', command.chain);
        if (chainPem === null) return EDGE_EXIT.failed;
        let checked;
        try {
            checked = checkCertificatePair({ keyPem, chainPem, host, nowMs: this.clock(), deviceKeySpkiB64: identity.publicKeySpki });
        } catch (err) {
            if (err instanceof CertificateRefusedError) {
                audit('refused', host, { stage: 'check' });
                return fail(`refused: ${err.message}; nothing was changed`);
            }
            throw err;
        }
        try {
            installCertificatePair(tls, { keyPem, chainPem });
        } catch (err) {
            if (err instanceof CertificateInstallBusyError) {
                // The running box is installing (or finishing an interrupted install) right now: never interleave.
                audit('busy', host, {});
                return fail(`${err.message}; nothing was changed`);
            }
            if (err instanceof EdgeTlsError) {
                audit('refused', host, { stage: 'load' });
                return fail(`refused: the pair does not load (${err.message}); nothing was changed`);
            }
            throw err;
        }
        audit('ok', host, { notAfterMs: checked.info.notAfterMs, daysLeft: checked.daysLeft });
        out.log(`Installed the LAN certificate for ${host}`);
        out.log(pad('certificate', tls.certFile));
        out.log(pad('fingerprint', checked.info.fingerprint256));
        out.log(pad('valid until', `${iso(checked.info.notAfterMs)} (${checked.daysLeft} days)`));
        if (checked.daysLeft <= 30) out.log('  ! 30 days or fewer left: a box ships with more than 30 (install.md step 16)');
        out.log(`The running box loads it within ${tls.reloadPollMs} ms; nothing needs a restart. Delete the copies you installed from.`);
        return EDGE_EXIT.ok;
    }

    // ---- held captures -----------------------------------------------------------------------------------------------

    private captureList(out: CliOutput): number {
        const rows = [...this.state.heldCaptures.list()];
        const rank = (c: (typeof rows)[number]): number => (c.sha256 !== null && c.uploadedAtMs === null ? 0 : c.toMs === null ? 1 : 2);
        rows.sort((a, b) => rank(a) - rank(b) || a.fromMs - b.fromMs);
        if (!rows.length) {
            out.log('No held captures.');
            return EDGE_EXIT.ok;
        }
        for (const c of rows) {
            const status = c.toMs === null ? 'held (connection still open)' : c.uploadedAtMs !== null ? `uploaded ${iso(c.uploadedAtMs)} (orphan ${c.nOrphanid})` : 'waiting to upload';
            out.log(`${c.id}  session ${c.nSesid}  peer ${c.peer}${c.user ? `  login ${c.user}` : ''}  ${iso(c.fromMs)} → ${iso(c.toMs) ?? 'now'}  ${formatBytes(c.bytes)}  ${status}`);
        }
        return EDGE_EXIT.ok;
    }

    private async captureUpload(id: string | null, out: CliOutput): Promise<number> {
        const identity = this.state.identity.get();
        const within = this.opts.serviceActiveWithinMs ?? SERVICE_ACTIVE_WITHIN_MS;
        if (identity?.lastCloudContactAtMs && this.clock() - identity.lastCloudContactAtMs < within) {
            out.error(
                `rt-edge: capture upload refused: the box service talked to the cloud ${Math.floor((this.clock() - identity.lastCloudContactAtMs) / 1000)} s ago; it uploads held captures itself. Stop it first (systemctl stop rt-edge) to upload from the console.`,
            );
            return EDGE_EXIT.failed;
        }
        const ids = id ? [id] : this.state.heldCaptures.list({ pendingUpload: true }).map(c => c.id);
        if (!ids.length) {
            out.log('No held capture is waiting to upload.');
            return EDGE_EXIT.ok;
        }
        let failed = 0;
        for (const one of ids) {
            try {
                const res = await this.uplink.uploadCapture(one);
                out.log(`${one}: uploaded (orphan ${res.nOrphanid})`);
            } catch (err) {
                if (!isEdgePortError(err)) throw err;
                failed += 1;
                out.error(`rt-edge: ${one}: ${this.explain(err.code, err.message)}`);
            }
        }
        return failed ? EDGE_EXIT.failed : EDGE_EXIT.ok;
    }

    private explain(code: string, message: string): string {
        switch (code) {
            case 'offline':
                return `cannot reach ${this.config.cloud.origin} (${message})`;
            case 'cloud_refused':
                return `the cloud refused: ${message}`;
            case 'box_not_configured':
                return 'the box is not enrolled (rt-edge enroll --code <code>)';
            case 'box_not_linked':
                return `the cloud does not accept this box (${message})`;
            case 'not_found':
                return message;
            default:
                return message;
        }
    }
}

async function statfsFreeMb(dir: string): Promise<number | null> {
    const statfs = (fs.promises as unknown as { statfs?: (p: string) => Promise<{ bavail: number | bigint; bsize: number | bigint }> }).statfs;
    if (!statfs) return null;
    try {
        const st = await statfs(dir);
        return Math.floor((Number(st.bavail) * Number(st.bsize)) / (1024 * 1024));
    } catch {
        return null;
    }
}

async function dirBytes(dir: string): Promise<number> {
    let total = 0;
    let entries: fs.Dirent[];
    try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
        return 0;
    }
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) total += await dirBytes(p);
        else if (e.isFile()) total += (await fs.promises.stat(p).catch(() => ({ size: 0 }))).size;
    }
    return total;
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
}
