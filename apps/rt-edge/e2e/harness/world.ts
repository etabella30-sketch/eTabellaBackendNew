/**
 * One end-to-end world per test: the stand-in cloud (cloud.ts), the box's internet (tcp-proxy.ts), the real box
 * (box.ts) enrolled and confirmed exactly as the install runbook does it (Venue boxes → Add, `rt-edge enroll`,
 * confirm the console fingerprint), one venue session bound to the box (cloud-first, D27), and the readers.
 *
 * Every check compares DIGESTS and COUNTS: box canonical pages, cloud page store, cloud meta, the room's and the
 * remote reader's reconstructed transcripts, the box journal and the cloud raw store. No line text is printed.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { pageDigests, rootDigest } from '@app/edge-sync';
import { readJournal, StoredRecord } from '@app/rt-ingest';

import { cloudKeys, CloudKeys, onlineToken } from '../../src/auth/testing/edge-world';
import type { KernelOptions } from '../../src/kernel/kernel-options';
import { ChildBox, enrollBox, freePorts, InProcessBox, writeBoxConfig, BoxPorts } from './box';
import { CloudStandIn, IDS, silenceNest } from './cloud';
import { Corpus, Golden, loadCorpus, loadGolden } from './corpus';
import { EclipseSender, EclipseSenderOptions } from './eclipse-sender';
import { waitFor } from './pacer';
import { TcpProxy } from './tcp-proxy';
import { TcpServerChild } from './tcp-server-child';
import { CloudViewer, RoomDevice } from './viewers';

export const ECLIPSE_USER = 'eclipse-court3';
export const ECLIPSE_PASS = 'pw-court3-7Q';

export interface Digests {
    box: { totalLines: number; root: string | null; rev: number; headSeq: number; durableSeq: number; protocol: string | null } | null;
    cloudMeta: { totalLines: number; root: string; appliedRev: number; appliedRawSeq: number | null; frozen: boolean } | null;
    cloudStore: { totalLines: number; pages: number; root: string } | null;
    cloudRaw: { seq: number } | null;
    room: { totalLines: number; root: string; holes: number } | null;
    viewer: { totalLines: number; root: string; holes: number } | null;
}

export class World {
    readonly corpus: Corpus = loadCorpus();
    readonly golden: Golden = loadGolden();
    readonly nSesid: string;
    readonly dir: string;
    cloud!: CloudStandIn;
    proxy!: TcpProxy;
    keys!: CloudKeys;
    ports!: BoxPorts;
    configFile!: string;
    nEdgeid!: string;
    box: InProcessBox | null = null;
    childBox: ChildBox | null = null;
    room: RoomDevice | null = null;
    viewer: CloudViewer | null = null;
    tcp: TcpServerChild | null = null;
    readonly senders: EclipseSender[] = [];
    private readonly readers: Array<RoomDevice | CloudViewer> = [];

    private constructor() {
        this.nSesid = this.golden.nSesid;
        this.dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-e2e-box-'));
    }

    /** Cloud up, proxy up, the box enrolled + confirmed + serving (in-process unless `child`), online. */
    static async create(opts: { child?: boolean } = {}): Promise<World> {
        silenceNest();
        const w = new World();
        w.keys = await cloudKeys('e2e-2026-10');
        w.cloud = new CloudStandIn(w.keys.ring.jwks() as never);
        await w.cloud.start();
        w.proxy = new TcpProxy(w.cloud.port);
        await w.proxy.start();
        const [http, cat] = await freePorts(2);
        w.ports = { http, cat };
        w.configFile = writeBoxConfig(w.dir, `http://127.0.0.1:${w.proxy.port}`, w.ports);
        const { nEdgeid, code } = await w.cloud.createBox();
        w.nEdgeid = nEdgeid;
        const enrolled = await enrollBox(w.configFile, code);
        if (enrolled.exit !== 0 || !enrolled.fingerprint) throw new Error(`rt-edge enroll exited ${enrolled.exit}`);
        await w.cloud.confirmKey(nEdgeid, enrolled.fingerprint);
        if (opts.child) await w.startChildBox();
        else await w.startBox();
        return w;
    }

    /** Serve the box in-process and (unless `waitOnline: false`) wait until its uplink is online. */
    async startBox(opts: { readonly kernel?: KernelOptions; readonly waitOnline?: boolean } = {}): Promise<InProcessBox> {
        this.box = await InProcessBox.start(this.configFile, { kernel: opts.kernel });
        if (opts.waitOnline !== false) await waitFor(() => !!this.box?.uplink.status().online, 20_000, 'the box online', () => this.dump());
        return this.box;
    }

    async startChildBox(): Promise<ChildBox> {
        this.childBox = await ChildBox.start(this.configFile);
        await waitFor(() => this.cloud.app !== null && this.cloud.gateway.connection(this.nEdgeid) !== null, 20_000, 'the child box online');
        return this.childBox;
    }

    /** Bind the session cloud-first and wait until the box armed it and both sides passed hello. */
    async bindSession(): Promise<void> {
        const res = await this.cloud.bindSession(this.nEdgeid, this.nSesid, { user: ECLIPSE_USER, password: ECLIPSE_PASS, tz: this.golden.tz });
        if (!res.delivered) throw new Error(`c.assign upsert not delivered: ${res.reason}`);
        await waitFor(() => this.cloud.db.eventsOf('ready').some(e => e.nSesid === this.nSesid), 20_000, 'e.ready from the box', () => this.dump());
        if (this.box) {
            await waitFor(
                () => this.box!.kernel.session(this.nSesid)?.localState === 'armed' && this.box!.uplink.session(this.nSesid)?.verdict === 'continue' && this.box!.uplink.status().online,
                20_000,
                'armed and helloed',
                () => this.dump(),
            );
        }
    }

    /** An etabella.net edge token for this box (ES256, D22 cases), as authapi mints it after the PKCE sign-in. */
    token(userId: string): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        return onlineToken(this.keys, {
            sub: userId,
            userId,
            aud: `edge:${this.nEdgeid}`,
            edge: this.nEdgeid,
            cases: [IDS.caseA.toLowerCase()],
            jti: `e2e-${userId.slice(0, 8)}-${now}-${Math.random().toString(36).slice(2, 8)}`,
            iat: now - 5,
            exp: now + 11 * 3600,
            auth_time: now - 60,
        });
    }

    async openRoom(): Promise<RoomDevice> {
        const room = new RoomDevice(`http://127.0.0.1:${this.ports.http}`, this.nSesid, await this.token(IDS.user));
        this.readers.push(room);
        await room.connect();
        this.room = room;
        return room;
    }

    async openViewer(): Promise<CloudViewer> {
        const viewer = new CloudViewer(this.cloud.origin, this.nSesid);
        this.readers.push(viewer);
        await viewer.connect();
        this.viewer = viewer;
        return viewer;
    }

    /** The listen-mode transmitter (Eclipse "Connect to server") on the box's CAT port. */
    sender(o: Partial<EclipseSenderOptions> = {}): EclipseSender {
        const s = new EclipseSender({
            port: this.ports.cat,
            user: ECLIPSE_USER,
            password: ECLIPSE_PASS,
            entries: this.corpus.entries.map(e => e.bytes),
            msPerEntry: 2,
            reconnectMs: 100,
            ...o,
        });
        this.senders.push(s);
        return s;
    }

    /** A box HTTP call with a signed-in identity (the LAN API, CONTRACTS.md §4). */
    async boxApi(method: 'GET' | 'PUT' | 'POST', route: string, userId: string, body?: unknown): Promise<{ status: number; body: any }> {
        const res = await fetch(`http://127.0.0.1:${this.ports.http}${route}`, {
            method,
            headers: { Authorization: `Bearer ${await this.token(userId)}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const text = await res.text();
        let json: unknown = null;
        try {
            json = JSON.parse(text);
        } catch {
            json = null;
        }
        return { status: res.status, body: json };
    }

    // ---- digests ------------------------------------------------------------------------------------------------

    cloudStoreRoot(): { totalLines: number; pages: number; root: string } {
        const pages = this.cloud.feed.pages(this.nSesid);
        const totalLines = pages.reduce((n, p) => n + p.length, 0);
        return { totalLines, pages: pages.length, root: rootDigest(this.nSesid, totalLines, pageDigests(pages)) };
    }

    digests(): Digests {
        const k = this.box?.kernel;
        const view = k?.view(this.nSesid) ?? null;
        const head = k?.rawHead(this.nSesid) ?? null;
        const meta = this.cloud.app ? this.cloud.sync.peekMeta(this.nSesid) : null;
        return {
            box: view && head ? { totalLines: view.totalLines, root: view.root, rev: view.rev, headSeq: head.headSeq, durableSeq: head.durableSeq, protocol: k!.session(this.nSesid)?.protocol ?? null } : null,
            cloudMeta: meta ? { totalLines: meta.totalLines, root: meta.root, appliedRev: meta.appliedRev, appliedRawSeq: meta.appliedRawSeq ?? null, frozen: !!meta.frozen } : null,
            cloudStore: this.cloudStoreRoot(),
            cloudRaw: this.cloud.app ? { seq: this.cloud.raw.head(this.nSesid).seq } : null,
            room: this.room ? { totalLines: this.room.model.totalLines, root: this.room.model.root(this.nSesid), holes: this.room.model.holes() } : null,
            viewer: this.viewer ? { totalLines: this.viewer.model.totalLines, root: this.viewer.model.root(this.nSesid), holes: this.viewer.model.holes() } : null,
        };
    }

    /** Box, cloud meta, cloud page store and cloud raw store agree, nothing undurable or in flight. */
    converged(): boolean {
        if (!this.box || !this.cloud.app) return false;
        const view = this.box.kernel.view(this.nSesid);
        const head = this.box.kernel.rawHead(this.nSesid);
        const meta = this.cloud.sync.peekMeta(this.nSesid);
        if (!view || !head || !meta || head.durableSeq !== head.headSeq) return false;
        const raw = this.cloud.raw.head(this.nSesid);
        const store = this.cloudStoreRoot();
        return meta.root === view.root && meta.totalLines === view.totalLines && store.root === view.root && raw.seq === head.headSeq && raw.hash === head.headHash;
    }

    async waitConverged(what: string, ms = 30_000, extra: () => boolean = () => true): Promise<void> {
        await waitFor(() => this.converged() && extra(), ms, what, () => this.dump());
    }

    /** The room's transcript equals the box's (after its live follow, or a fresh fetch). */
    async waitRoomMatchesBox(what: string, ms = 15_000): Promise<void> {
        await waitFor(() => !!this.room && !!this.box && this.room.model.root(this.nSesid) === this.box.kernel.view(this.nSesid)?.root, ms, what, () => this.dump());
    }

    async journals(): Promise<{ box: StoredRecord[]; cloud: StoredRecord[] }> {
        const box = await readJournal({ root: path.join(this.dir, 'journal'), nSesid: this.nSesid, repair: false });
        const cloud = await readJournal({ root: this.cloud.journalDir, nSesid: this.nSesid, repair: false });
        return { box: box.records, cloud: cloud.records };
    }

    /** Counts and digests only (attached to a timeout). */
    dump(): unknown {
        const sync = this.box?.uplink.session(this.nSesid) ?? null;
        return {
            digests: this.digests(),
            boxLink: this.box ? { online: this.box.uplink.status().online, link: this.box.uplink.cloudLink().state, internet: this.box.uplink.internet().state } : null,
            boxSession: this.box?.kernel.session(this.nSesid) ? { localState: this.box.kernel.session(this.nSesid)!.localState, feed: this.box.kernel.session(this.nSesid)!.feed, bytesIn: this.box.kernel.session(this.nSesid)!.bytesIn, parseErrors: this.box.kernel.session(this.nSesid)!.parseErrors } : null,
            sync: sync && { uplinkState: sync.uplinkState, verdict: sync.verdict, dirtyPages: sync.dirtyPages, lagBytes: sync.lagBytes, rawAckedSeq: sync.rawAckedSeq, sealState: sync.sealState, frozenReason: sync.frozenReason },
            cloudApplied: this.cloud.applied.length,
            proxy: { cut: this.proxy?.isCut, accepted: this.proxy?.accepted },
            senders: this.senders.map(s => ({ next: s.next, connects: s.connects, paused: s.isPaused, done: s.done })),
            alerts: this.cloud.app ? this.cloud.registry.recentAlerts().filter(a => a.tier !== 'info').map(a => a.kind) : null,
            contract: this.cloud.db.contractViolations.length,
        };
    }

    async close(): Promise<void> {
        for (const s of this.senders.splice(0)) await s.stop().catch(() => undefined);
        for (const r of this.readers.splice(0)) r.close();
        await this.tcp?.kill().catch(() => undefined);
        await this.childBox?.kill().catch(() => undefined);
        await this.box?.stop().catch(() => undefined);
        await this.proxy?.close().catch(() => undefined);
        await this.cloud?.dispose().catch(() => undefined);
        fs.rmSync(this.dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
}
