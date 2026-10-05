import * as http from 'http';
import * as os from 'os';

import { isVirtualAdapter } from '../ops/network';
import { EdgePortError } from '../ports';
import { BoxConsoleServer, consoleMessage, lanIpv4Addresses } from './box-console.server';
import { CONSOLE_HTML, CONSOLE_JS } from './console-page';
import { consoleCookie, ConsoleSessions, CONSOLE_SESSION_TTL_MS, findConsolePerson } from './console-signin';
import { buildConsoleSnapshot, CONSOLE_ENDED_SHOWN } from './console-snapshot';

const NOW = Date.UTC(2026, 9, 2, 9, 0, 0);

const CASES = [
    { nCaseid: 'case-a', cCasename: 'Alpha v Beta', cCaseno: 'A/1', assignedAtMs: 1 },
    { nCaseid: 'case-b', cCasename: 'Gamma v Delta', cCaseno: 'B/2', assignedAtMs: 1 },
];
const member = (nUserid: string, name: string, email: string | null, nCaseid: string, active = true) => ({
    nUserid, name, email, nCaseid, nSesid: null, role: null, isCaseAdmin: false, active, source: 'team' as const,
});
const ROSTER: Record<string, ReturnType<typeof member>[]> = {
    'case-a': [member('u1', 'Ann Lee', 'Ann@Firm.com', 'case-a'), member('u3', 'Old Hand', 'old@firm.com', 'case-a', false)],
    'case-b': [member('u1', 'Ann Lee', 'ann@firm.com', 'case-b'), member('u2', 'Bob Roy', 'bob@firm.com', 'case-b')],
};
const assignments = { cases: () => CASES, case: (id: string) => CASES.find(c => c.nCaseid === id) ?? null };
const roster = { forCase: (id: string) => ROSTER[id] ?? [], superAdmins: () => [{ nUserid: 'sa', name: 'Root Admin', email: 'root@etabella.com' }] };

const record = (nSesid: string, nCaseid: string, over: Record<string, unknown> = {}) => ({
    nSesid, nCaseid, cName: `Session ${nSesid}`, dStartDt: '2026-10-02T09:30:00.000Z', tz: 'Europe/London', nLines: 25,
    protocol: null, epoch: 1, rebaseSeq: null, parserVer: '1', fmt: 1, route: { user: `rep-${nSesid}`, salt: 's', hash: 'h', scryptN: 1 },
    hearingOperator: null, nPartNo: 1, nPrevPartSesid: null, next: null, cloudOp: 'upsert', deleted: false, reporter: null,
    localState: 'armed', listed: true, assignedAtMs: 1, updatedAtMs: 1, firstLineAtMs: null, endRequestedAtMs: null,
    endedAtMs: null, sealedAtMs: null, sealState: null, purgedAtMs: null, ...over,
});

const txState = (over: Record<string, unknown> = {}) => ({
    stateVersion: 4,
    settings: null,
    applied: null,
    link: { state: 'waiting', mode: 'listen', protocol: null, sinceMs: null, attempt: null, quietLevel: null, peer: null, bytesIn: 0, lastLineAtMs: null, receivingSesid: null, heldPeers: 0, lockout: false },
    sessions: [],
    listen: { boxTransmitterAddress: null, port: 2600 },
    actions: { connect: false, testOnly: true, reconnect: false },
    ...over,
});

const config = {
    box: { name: 'Hall A', venueLabel: '', label: 'VB-1', roomWifiSsid: null, timeZone: 'Europe/London', domain: 'etabella-edge.net' },
    release: { version: '1.0.0', backendCommit: null, feCommit: null },
    transmitter: { listenPort: 2600, bindAddress: null, networkCidr: null },
    console: { port: 0 },
};

describe('findConsolePerson (email-only sign-in)', () => {
    it('finds a case member by email, whatever the letter case, with every box case they are on', () => {
        const found = findConsolePerson('  ANN@firm.com ', assignments as never, roster as never);
        expect(found.reason).toBeNull();
        expect(found.person).toEqual({ nUserid: 'u1', name: 'Ann Lee', email: 'ann@firm.com', isSuperAdmin: false, caseIds: ['case-a', 'case-b'] });
    });

    it('a super-admin gets every box case', () => {
        const found = findConsolePerson('root@etabella.com', assignments as never, roster as never);
        expect(found.person).toMatchObject({ isSuperAdmin: true, caseIds: ['case-a', 'case-b'] });
    });

    it('refuses an email that is on no case of this box, and a member who is no longer active', () => {
        expect(findConsolePerson('eve@else.com', assignments as never, roster as never)).toEqual({ person: null, reason: 'unknown' });
        expect(findConsolePerson('old@firm.com', assignments as never, roster as never)).toEqual({ person: null, reason: 'unknown' });
    });

    it('says so when the box has no people list yet, and when the text is not an email', () => {
        const empty = { forCase: () => [], superAdmins: () => [] };
        expect(findConsolePerson('ann@firm.com', { cases: () => [] } as never, empty as never).reason).toBe('no-roster');
        expect(findConsolePerson('not-an-email', assignments as never, roster as never).reason).toBe('invalid');
        expect(findConsolePerson(undefined, assignments as never, roster as never).reason).toBe('invalid');
    });
});

describe('ConsoleSessions / consoleCookie', () => {
    it('a sign-in lasts 12 hours and ends on sign-out', () => {
        const s = new ConsoleSessions();
        const person = { nUserid: 'u1', name: 'Ann', email: 'ann@firm.com', isSuperAdmin: false, caseIds: [] };
        const token = s.open(person, NOW);
        expect(s.get(token, NOW + CONSOLE_SESSION_TTL_MS - 1)).toBe(person);
        expect(s.get(token, NOW + CONSOLE_SESSION_TTL_MS)).toBeNull();
        const again = s.open(person, NOW);
        s.close(again);
        expect(s.get(again, NOW)).toBeNull();
        expect(s.get('made-up', NOW)).toBeNull();
    });

    it('reads only a well-formed console cookie', () => {
        const token = 'a'.repeat(43);
        expect(consoleCookie(`x=1; box_console=${token}; y=2`)).toBe(token);
        expect(consoleCookie('box_console=short')).toBeNull();
        expect(consoleCookie(undefined)).toBeNull();
    });
});

describe('buildConsoleSnapshot', () => {
    const base = {
        nowMs: NOW,
        config: config as never,
        identity: { slug: 'hall-a', status: 'active' } as never,
        views: [],
        caseOf: (id: string) => assignments.case(id),
        transmitter: txState() as never,
        cloud: { state: 'synced', sinceMs: null, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: NOW } as never,
        addresses: ['192.168.1.50'],
    };

    it('lists live sessions first, then upcoming, then a few ended; hides unlisted, deleted and purged ones', () => {
        const ended = Array.from({ length: CONSOLE_ENDED_SHOWN + 3 }, (_, i) => record(`e${i}`, 'case-a', { endedAtMs: NOW - 1000, firstLineAtMs: 1 }));
        const snap = buildConsoleSnapshot({
            ...base,
            records: [
                record('up', 'case-a'),
                record('live', 'case-b', { firstLineAtMs: NOW - 5000 }),
                record('gone', 'case-a', { listed: false }),
                record('del', 'case-a', { deleted: true }),
                ...ended,
            ] as never,
            views: [{ nSesid: 'live', phase: 'live', totalLines: 120, lastLineAtMs: NOW - 100 }] as never,
        });
        expect(snap.sessions.slice(0, 2).map(s => s.nSesid)).toEqual(['live', 'up']);
        expect(snap.sessions[0]).toMatchObject({ phaseLabel: 'Live', lines: 120, caseName: 'Gamma v Delta', eclipseUser: 'rep-live' });
        expect(snap.sessions[1].phaseLabel).toBe('Waiting for the reporter');
        expect(snap.sessions).toHaveLength(2 + CONSOLE_ENDED_SHOWN);
        expect(snap.sessions.some(s => s.nSesid === 'gone' || s.nSesid === 'del')).toBe(false);
    });

    it('shows a person only the sessions of their cases', () => {
        const snap = buildConsoleSnapshot({
            ...base,
            records: [record('a1', 'case-a'), record('b1', 'case-b')] as never,
            visibleCaseIds: new Set(['case-b']),
            me: { name: 'Bob Roy', email: 'bob@firm.com' },
        });
        expect(snap.sessions.map(s => s.nSesid)).toEqual(['b1']);
        expect(snap.me).toEqual({ name: 'Bob Roy', email: 'bob@firm.com' });
    });

    it('tells the reporter where to connect, and says when the box keeps lines for later', () => {
        const snap = buildConsoleSnapshot({
            ...base,
            records: [],
            cloud: { state: 'internet-unavailable', sinceMs: null, lagSec: 30, lagLines: 12, pendingPages: 1, lastSyncedAtMs: null } as never,
        });
        expect(snap.transmitter.listen).toEqual({ addresses: ['192.168.1.50'], port: 2600 });
        expect(snap.transmitter.label).toBe("Waiting for the reporter's Eclipse to connect");
        expect(snap.cloud.ok).toBe(false);
        expect(snap.cloud.label).toContain('kept on this box');
        expect(snap.box.host).toBe('hall-a.etabella-edge.net');
    });

    it('an unconfirmed or unenrolled box says what to do', () => {
        expect(buildConsoleSnapshot({ ...base, records: [], identity: null }).box.problem).toContain('Not enrolled');
        expect(buildConsoleSnapshot({ ...base, records: [], identity: { slug: 'x', status: 'pending-confirm' } as never }).box.problem).toContain('confirm this box');
        expect(buildConsoleSnapshot({ ...base, records: [] }).box.problem).toBeNull();
    });

    it('the Reporter column: the address set on etabella.net, else that the reporter connects to this box', () => {
        const snap = buildConsoleSnapshot({
            ...base,
            records: [record('dial', 'case-a', { reporter: { host: '192.168.1.20', port: 1337 } }), record('listen', 'case-a', { dStartDt: '2026-10-02T11:00:00.000Z' })] as never,
        });
        expect(snap.sessions.map(s => [s.nSesid, s.reporter])).toEqual([
            ['dial', '192.168.1.20:1337'],
            ['listen', 'Connects to this box'],
        ]);
    });

    it('"My cases": the cases the signed-in person is on, by name; a super-admin gets every box case', () => {
        const unnamed = { nCaseid: 'case-c', cCasename: '', cCaseno: 'C/3', assignedAtMs: 1 };
        const all = [CASES[1], CASES[0], unnamed];
        expect(buildConsoleSnapshot({ ...base, records: [], cases: all, visibleCaseIds: new Set(['case-b']) }).cases).toEqual([{ nCaseid: 'case-b', name: 'Gamma v Delta' }]);
        expect(buildConsoleSnapshot({ ...base, records: [], cases: all, visibleCaseIds: null }).cases).toEqual([
            { nCaseid: 'case-a', name: 'Alpha v Beta' },
            { nCaseid: 'case-c', name: 'C/3' },
            { nCaseid: 'case-b', name: 'Gamma v Delta' },
        ]);
        expect(buildConsoleSnapshot({ ...base, records: [] }).cases).toEqual([]);
    });

    describe('the reporter address set on etabella.net (cloudReporterStatus)', () => {
        const records = [record('a1', 'case-a', { cName: 'Day 3 — Morning', reporter: { host: '192.168.1.20', port: 1337 } }), record('b1', 'case-b')] as never;
        const note = (cloudReporter: Record<string, unknown> | null, over: Record<string, unknown> = {}) =>
            buildConsoleSnapshot({ ...base, records, cloudReporter: cloudReporter as never, ...over }).transmitter.cloud;
        const status = (state: string, reason: string | null = null, host = '192.168.1.20') => ({ nSesid: 'a1', host, port: 1337, state, reason });

        it('says nothing when no session carries one', () => {
            expect(note(null)).toBeNull();
            expect(buildConsoleSnapshot({ ...base, records }).transmitter.cloud).toBeNull();
        });

        it('applied: "Set on etabella.net for <session name>"', () => {
            expect(note(status('applied'))).toEqual({ nSesid: 'a1', state: 'applied', tone: 'ok', text: 'Set on etabella.net for Day 3 — Morning' });
        });

        it('refused: the reason in plain words, with what to do', () => {
            const networked = { ...config, transmitter: { ...config.transmitter, networkCidr: '192.168.20.0/24' } };
            expect(note(status('refused', 'outside-network', '10.0.0.5'), { config: networked as never })).toEqual({
                nSesid: 'a1',
                state: 'refused',
                tone: 'warn',
                text: "Reporter IP 10.0.0.5 is outside this box's reporter network (192.168.20.0/24). Change it on etabella.net or set the connection here.",
            });
            expect(note(status('refused', 'dial-mode-off'))!.text).toBe(
                "etabella.net set 192.168.1.20:1337 for Day 3 — Morning, but connecting to the reporter is switched off on this box. The reporter's Eclipse connects to this box instead.",
            );
            expect(note(status('refused', 'protocol-unknown'))!.text).toBe('etabella.net set 192.168.1.20:1337 for Day 3 — Morning, but not whether the feed is Bridge or CaseView. Set the connection here.');
        });

        it('waiting for a live feed to stop, and overridden at the box', () => {
            expect(note(status('waiting', 'feed-live'))).toMatchObject({ tone: null, text: 'etabella.net set 192.168.1.20:1337 for Day 3 — Morning. This box switches to it when the feed that is live now stops.' });
            expect(note(status('waiting'))!.text).toBe('etabella.net set 192.168.1.20:1337 for Day 3 — Morning. This box is switching to it.');
            expect(note(status('overridden'))).toMatchObject({ tone: null, text: 'etabella.net set 192.168.1.20:1337 for Day 3 — Morning. The connection was changed on this box since, and stays as set here.' });
        });

        it('waiting behind another open session: names the session that holds the reporter connection', () => {
            const held = { ...status('waiting', 'held-by-session'), heldBy: 'b1' };
            const holder = (records as unknown as Array<{ nSesid: string; cName: string }>).find(r => r.nSesid === 'b1')!.cName;
            expect(note(held)).toMatchObject({
                state: 'waiting',
                tone: null,
                text: `etabella.net set 192.168.1.20:1337 for Day 3 — Morning. Waiting: ${holder} is still open and holds the reporter connection. End it on etabella.net, or set the connection here.`,
            });
            // The holder belongs to a case this person is not on: it is not named.
            expect(note(held, { visibleCaseIds: new Set(['case-a']) })!.text).toContain('Waiting: A session of another case is still open and holds the reporter connection.');
            expect(note(held)!.text).not.toContain('This box is switching to it');
        });

        it('never names a session of a case the person is not on', () => {
            const seen = note(status('applied'), { visibleCaseIds: new Set(['case-b']) })!;
            expect(seen.text).toBe('Set on etabella.net for a session of another case');
            expect(note({ ...status('applied'), nSesid: 'gone' })!.text).toBe('Set on etabella.net for a session of another case');
        });
    });
});

describe('the console page', () => {
    it('has the Reporter column, the "My cases" line and the etabella.net note, and renders with textContent only', () => {
        expect(CONSOLE_HTML).toContain('<th>Reporter</th>');
        expect(CONSOLE_HTML).toContain('id="my-cases"');
        expect(CONSOLE_HTML).toContain('id="tx-cloud"');
        expect(CONSOLE_JS).toContain("$('tx-cloud')");
        expect(CONSOLE_JS).toContain("'My cases: '");
        expect(CONSOLE_JS).toContain('cell(r.reporter');
        expect(CONSOLE_JS).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(/);
        expect(CONSOLE_HTML).not.toMatch(/<script>|\son[a-z]+=|javascript:/i);
        // The script parses (a syntax error would leave the page blank).
        expect(() => new Function(CONSOLE_JS)).not.toThrow();
    });

    /** Just enough DOM for the page script: elements by id that remember what was set on them. */
    class FakeElement {
        className = '';
        hidden = false;
        disabled = false;
        value = '';
        children: FakeElement[] = [];
        elements: Record<string, FakeElement> = {};
        private text = '';
        private readonly classes = new Set<string>();
        readonly classList = {
            add: (c: string) => void this.classes.add(c),
            remove: (...cs: string[]) => cs.forEach(c => this.classes.delete(c)),
            toggle: (c: string, on: boolean) => void (on ? this.classes.add(c) : this.classes.delete(c)),
            contains: (c: string) => this.classes.has(c),
        };
        get textContent(): string {
            return this.text;
        }
        set textContent(value: string) {
            this.text = value;
            this.children = []; // as in a browser: setting the text drops the children
        }
        appendChild(child: FakeElement): FakeElement {
            this.children.push(child);
            return child;
        }
        readonly listeners: Record<string, (e: unknown) => void> = {};
        addEventListener(type: string, fn: (e: unknown) => void): void {
            this.listeners[type] = fn; // a spec may fire one (the console's Save)
        }
        focus(): void {
            /* nothing to focus */
        }
    }

    /** Requests the page script sent (path and JSON body). */
    let posted: { path: string; body: unknown }[] = [];
    async function renderPage(snapshot: unknown): Promise<(id: string) => FakeElement> {
        const byId = new Map<string, FakeElement>();
        const $ = (id: string): FakeElement => byId.get(id) ?? byId.set(id, new FakeElement()).get(id)!;
        for (const name of ['mode', 'host', 'port', 'protocol', 'serialPath', 'baudRate', 'serialProtocol']) $('tx-form').elements[name] = new FakeElement();
        const document = { getElementById: $, createElement: () => new FakeElement() };
        posted = [];
        const fetch = async (path: string, init?: { body?: string }) => {
            if (init?.body) posted.push({ path, body: JSON.parse(init.body) });
            return { status: 200, ok: true, json: async () => snapshot };
        };
        new Function('document', 'window', 'fetch', 'setInterval', CONSOLE_JS)(document, {}, fetch, () => 0);
        for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve));
        return $;
    }

    const pageBase = {
        nowMs: NOW,
        config: config as never,
        identity: { slug: 'hall-a', status: 'active' } as never,
        views: [],
        caseOf: (id: string) => assignments.case(id),
        transmitter: txState() as never,
        cloud: { state: 'synced', sinceMs: null, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: NOW } as never,
        addresses: ['192.168.1.50'],
        me: { name: 'Ann Lee', email: 'ann@firm.com' },
        cases: CASES,
    };

    // Regression: ISSUE-007 — the console form only knew listen/dial: Save on a COM port box switched it to listen.
    // Found by /qa on 2026-10-03
    // Report: eTabella angular 21/.gstack/qa-reports/run-20261003T122856Z/qa-report-192.168.1.5-2026-10-03.md
    it('a box on its COM port shows that COM port in the form, and Save keeps it', async () => {
        const serial = txState({
            settings: { mode: 'serial', protocol: 'caseview', host: null, port: null, serialPath: 'COM13', baudRate: 9600, autoReconnect: true, receivingSesid: null },
            link: { ...txState().link, state: 'waiting', mode: 'serial' },
        });
        const snapshot = buildConsoleSnapshot({ ...pageBase, transmitter: serial as never, records: [] });
        expect(snapshot.transmitter).toMatchObject({ mode: 'serial', serialPath: 'COM13', baudRate: 9600, protocol: 'caseview' });

        const $ = await renderPage(JSON.parse(JSON.stringify(snapshot)));
        const form = $('tx-form');
        expect(form.elements['mode'].value).toBe('serial');
        expect(form.elements['serialPath'].value).toBe('COM13');
        expect(form.elements['baudRate'].value).toBe('9600');
        expect(form.elements['serialProtocol'].value).toBe('caseview');

        form.elements['baudRate'].value = '19200';
        form.listeners['input']?.({});
        form.listeners['submit']!({ preventDefault: () => undefined });
        for (let i = 0; i < 3; i++) await new Promise(resolve => setImmediate(resolve));
        expect(posted.find(p => p.path === '/api/transmitter')?.body).toMatchObject({
            settings: { mode: 'serial', protocol: 'caseview', host: null, port: null, serialPath: 'COM13', baudRate: 19200 },
        });
    });

    // Review 2026-10-04: the serial peer is the configured port in every state, so "Connected: COM13 @ 9600" showed while
    // the port was missing or closed.
    it('words the COM port by state: "Connected:" only while the port is open, else "Trying …" or "COM port: …"', async () => {
        const COM13 = { mode: 'serial', protocol: 'caseview', host: null, port: null, serialPath: 'COM13', baudRate: 9600, autoReconnect: true, receivingSesid: null };
        const sub = async (link: Record<string, unknown>): Promise<string> => {
            const tx = txState({ settings: COM13, link: { ...txState().link, mode: 'serial', peer: 'COM13 @ 9600', ...link } });
            const snapshot = buildConsoleSnapshot({ ...pageBase, transmitter: tx as never, records: [] });
            return (await renderPage(JSON.parse(JSON.stringify(snapshot))))('tx-sub').textContent;
        };
        expect(await sub({ state: 'connecting', attempt: 3 })).toBe('Trying COM13 @ 9600');
        expect(await sub({ state: 'waiting' })).toBe('COM port: COM13 @ 9600');
        const disconnected = await sub({ state: 'disconnected', lastLineAtMs: NOW - 60_000 });
        expect(disconnected).toMatch(/^COM port: COM13 @ 9600 · Last line /);
        expect(disconnected).not.toContain('Connected');
        expect(await sub({ state: 'live', lastLineAtMs: NOW - 1_000, bytesIn: 4_096 })).toMatch(/^Connected: COM13 @ 9600 · Last line .* · 4 KB received$/);
        expect(await sub({ state: 'quiet', lastLineAtMs: NOW - 700_000 })).toMatch(/^Connected: COM13 @ 9600/);
        expect(await sub({ state: 'connected-no-session' })).toBe('Connected: COM13 @ 9600');
        // A socket connection names its peer only while connected (as before).
        const listen = txState({ link: { ...txState().link, state: 'live', mode: 'listen', peer: '192.168.1.20:51000', lastLineAtMs: NOW - 1_000 } });
        const $ = await renderPage(JSON.parse(JSON.stringify(buildConsoleSnapshot({ ...pageBase, transmitter: listen as never, records: [] }))));
        expect($('tx-sub').textContent).toMatch(/^Connected: 192\.168\.1\.20:51000/);
    });

    // 2026-10-03: the reporter reaches the box by a socket connection or a COM port; dialing the reporter is off.
    it('offers two ways in, Socket connection and COM port; dialing the reporter shows only where it is switched on', async () => {
        expect(CONSOLE_HTML.indexOf('id="opt-listen"')).toBeLessThan(CONSOLE_HTML.indexOf('id="opt-serial"'));
        expect(CONSOLE_HTML.indexOf('id="opt-serial"')).toBeLessThan(CONSOLE_HTML.indexOf('id="opt-dial"'));
        expect(CONSOLE_HTML).toContain('<div class="option-title">Socket connection</div>');
        expect(CONSOLE_HTML).toContain('<div class="option-title">COM port</div>');
        expect(CONSOLE_HTML).toContain('<label class="option" id="opt-dial" hidden>');

        const off = buildConsoleSnapshot({ ...pageBase, records: [] });
        expect(off.transmitter.dialAllowed).toBe(false);
        const two = await renderPage(JSON.parse(JSON.stringify(off)));
        expect(two('opt-dial').hidden).toBe(true);
        expect(two('mode-dial').disabled).toBe(true);
        expect(two('form-msg').textContent).toBe('');

        const on = buildConsoleSnapshot({ ...pageBase, records: [], config: { ...config, features: { transmitterDialMode: true } } as never });
        expect(on.transmitter.dialAllowed).toBe(true);
        const three = await renderPage(JSON.parse(JSON.stringify(on)));
        expect(three('opt-dial').hidden).toBe(false);
        expect(three('dial-off').hidden).toBe(true);
        expect(three('mode-dial').disabled).toBe(false);
        expect(three('tx-form').elements['host'].disabled).toBe(false);
    });

    // Review 2026-10-04: the lock is timed and lifts by itself (libs/rt-ingest lockout.ts, 5 min); nothing on etabella.net
    // unlocks it.
    it('a locked Eclipse login says it unlocks by itself after the lock time, never "unlock on etabella.net"', async () => {
        const locked = txState({ link: { ...txState().link, lockout: true } });
        const snapshot = buildConsoleSnapshot({ ...pageBase, transmitter: locked as never, records: [] });
        expect(snapshot.transmitter.lockoutText).toBe('Eclipse login locked after wrong passwords · unlocks by itself after 5 min');
        const $ = await renderPage(JSON.parse(JSON.stringify(snapshot)));
        expect($('tx-label').textContent).toBe("Waiting for the reporter's Eclipse to connect · Eclipse login locked after wrong passwords · unlocks by itself after 5 min");
        expect(CONSOLE_JS).not.toContain('unlock on etabella.net');
        // Not locked: the status alone.
        const free = buildConsoleSnapshot({ ...pageBase, records: [] });
        expect(free.transmitter.lockoutText).toBeNull();
        expect((await renderPage(JSON.parse(JSON.stringify(free))))('tx-label').textContent).toBe("Waiting for the reporter's Eclipse to connect");
    });

    it('a box still set to dial the reporter shows that setting, locked, until another way is chosen', async () => {
        const dial = txState({
            settings: { mode: 'dial', protocol: 'bridge', host: '192.168.1.20', port: 1337, autoReconnect: true, receivingSesid: null },
            link: { ...txState().link, state: 'connecting', mode: 'dial' },
        });
        const $ = await renderPage(JSON.parse(JSON.stringify(buildConsoleSnapshot({ ...pageBase, transmitter: dial as never, records: [] }))));
        const form = $('tx-form');
        expect(form.elements['mode'].value).toBe('dial');
        expect($('opt-dial').hidden).toBe(false);
        expect($('dial-off').hidden).toBe(false);
        expect($('mode-dial').disabled).toBe(true);
        expect(form.elements['host']).toMatchObject({ value: '192.168.1.20', disabled: true });
        expect(form.elements['port'].disabled).toBe(true);
    });

    it('the script renders the snapshot it is served: my cases, the Reporter cells and the etabella.net note, as text', async () => {
        const hostile = '<img src=x onerror=alert(1)>';
        const snapshot = buildConsoleSnapshot({
            ...pageBase,
            records: [record('a1', 'case-a', { cName: hostile, reporter: { host: '192.168.1.20', port: 1337 } }), record('b1', 'case-b', { dStartDt: '2026-10-02T11:00:00.000Z' })] as never,
            cloudReporter: { nSesid: 'a1', host: '192.168.1.20', port: 1337, state: 'applied', reason: null },
        });
        const $ = await renderPage(JSON.parse(JSON.stringify(snapshot)));
        expect($('form-msg').textContent).toBe(''); // the render did not throw
        expect($('app').hidden).toBe(false);
        expect($('my-cases')).toMatchObject({ hidden: false, textContent: 'My cases: Alpha v Beta · Gamma v Delta' });
        const rows = $('sessions').children;
        expect(rows.map(tr => tr.children.map(td => td.textContent)[5])).toEqual(['192.168.1.20:1337', 'Connects to this box']);
        expect(rows[0].children).toHaveLength(7);
        expect(rows[0].children[5].className).toBe('mono');
        expect(rows[1].children[5].className).toBe('');
        // A session name is whatever the cloud sent: it lands in textContent, never in markup.
        expect(rows[0].children[0].textContent).toBe(hostile);
        expect($('tx-cloud')).toMatchObject({ hidden: false, className: 'note ok', textContent: `Set on etabella.net for ${hostile}` });
    });

    it('the script hides the "My cases" line and the note when there is nothing to say, and marks a refusal', async () => {
        const none = await renderPage(JSON.parse(JSON.stringify(buildConsoleSnapshot({ ...pageBase, cases: [], records: [] }))));
        expect(none('form-msg').textContent).toBe('');
        expect(none('my-cases')).toMatchObject({ hidden: true, textContent: '' });
        expect(none('tx-cloud')).toMatchObject({ hidden: true, textContent: '', className: 'note' });
        expect(none('sessions-empty').hidden).toBe(false);

        const refused = await renderPage(
            JSON.parse(
                JSON.stringify(
                    buildConsoleSnapshot({
                        ...pageBase,
                        records: [record('a1', 'case-a', { reporter: { host: '10.0.0.5', port: 1337 } })] as never,
                        cloudReporter: { nSesid: 'a1', host: '10.0.0.5', port: 1337, state: 'refused', reason: 'outside-network' },
                    }),
                ),
            ),
        );
        expect(refused('tx-cloud')).toMatchObject({ hidden: false, className: 'note warn' });
        expect(refused('tx-cloud').textContent).toContain('Reporter IP 10.0.0.5 is outside');
    });
});

describe('BoxConsoleServer (http://localhost only)', () => {
    let server: BoxConsoleServer;
    let port: number;
    let transmitter: { state: jest.Mock; apply: jest.Mock; connect: jest.Mock; reconnect: jest.Mock };
    let audit: jest.Mock;
    let cloudReporter: Record<string, unknown> | null = null;

    function build(mode: 'serve' | 'cli' = 'serve'): BoxConsoleServer {
        transmitter = { state: jest.fn(() => txState()), apply: jest.fn(async () => txState()), connect: jest.fn(async () => txState()), reconnect: jest.fn(async () => txState()) };
        audit = jest.fn();
        const state = {
            identity: { get: () => ({ slug: 'hall-a', status: 'active' }) },
            sessions: { list: () => [record('a1', 'case-a'), record('b1', 'case-b')] },
            assignments,
            roster,
            audit: { append: audit },
        };
        const kernel = { sessions: () => [], cloudReporterStatus: () => cloudReporter };
        const uplink = { cloudLink: () => ({ state: 'synced', sinceMs: null, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: NOW }) };
        return new BoxConsoleServer(config as never, mode, () => NOW, state as never, kernel as never, uplink as never, transmitter as never);
    }

    interface Reply { status: number; headers: http.IncomingHttpHeaders; text: string; json: any }

    function call(method: string, path: string, opts: { headers?: Record<string, string>; body?: unknown; host?: string } = {}): Promise<Reply> {
        return new Promise((resolve, reject) => {
            const payload = opts.body === undefined ? undefined : typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
            const req = http.request(
                { host: '127.0.0.1', port, method, path, headers: { Host: opts.host ?? `localhost:${port}`, ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}), ...opts.headers } },
                res => {
                    const chunks: Buffer[] = [];
                    res.on('data', c => chunks.push(c));
                    res.on('end', () => {
                        const text = Buffer.concat(chunks).toString('utf8');
                        let json: unknown = null;
                        try { json = JSON.parse(text); } catch { /* html */ }
                        resolve({ status: res.statusCode ?? 0, headers: res.headers, text, json });
                    });
                },
            );
            req.on('error', reject);
            req.end(payload);
        });
    }
    const api = { 'X-Box-Console': '1' };

    async function signIn(email: string): Promise<string> {
        const res = await call('POST', '/api/signin', { headers: api, body: { email } });
        expect(res.status).toBe(200);
        const cookie = String(res.headers['set-cookie']?.[0] ?? '');
        expect(cookie).toMatch(/^box_console=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Strict; Path=\/; Max-Age=43200$/);
        return cookie.split(';')[0];
    }

    beforeEach(async () => {
        cloudReporter = null;
        server = build();
        await server.listen(0);
        port = server.address()!;
    });
    afterEach(async () => {
        await server.beforeApplicationShutdown();
    });

    it('serves the page with a strict policy and no inline script', async () => {
        const res = await call('GET', '/');
        expect(res.status).toBe(200);
        expect(res.headers['content-security-policy']).toContain("script-src 'self'");
        expect(res.headers['x-frame-options']).toBe('DENY');
        expect(res.headers['cache-control']).toBe('no-store');
        expect(res.text).toContain('<script src="/console.js"></script>');
        expect(res.text).not.toMatch(/<script>|onclick=|javascript:/i);
        expect((await call('GET', '/console.js')).headers['content-type']).toContain('text/javascript');
    });

    it('refuses another site: a foreign Host (DNS rebinding), a foreign Origin, a call without the console header', async () => {
        expect((await call('GET', '/', { host: 'evil.example.com' })).status).toBe(403);
        expect((await call('GET', '/api/state', { headers: { ...api, Origin: 'https://evil.example.com' } })).status).toBe(403);
        expect((await call('GET', '/api/state')).status).toBe(403);
        expect((await call('POST', '/api/signin', { body: { email: 'ann@firm.com' } })).status).toBe(403);
        expect((await call('POST', '/api/signin', { headers: { ...api, 'Content-Type': 'text/plain' }, body: '{"email":"ann@firm.com"}' })).status).toBe(415);
    });

    it('asks for the email first, and refuses one that is on no case of the box', async () => {
        const res = await call('GET', '/api/state', { headers: api });
        expect(res.status).toBe(401);
        expect(res.json).toMatchObject({ error: 'signin_required', boxName: 'Hall A' });

        const unknown = await call('POST', '/api/signin', { headers: api, body: { email: 'eve@else.com' } });
        expect(unknown.status).toBe(403);
        expect(unknown.json.message).toContain("isn't on any case of this box");
        expect(unknown.headers['set-cookie']).toBeUndefined();
        expect((await call('POST', '/api/signin', { headers: api, body: { email: 'nope' } })).status).toBe(400);
        expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'sign-in-start', outcome: 'console-unknown', actor: null }));
    });

    it('email only: signs in, shows that person their sessions, and signs out', async () => {
        const cookie = await signIn('bob@firm.com');
        const res = await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } });
        expect(res.status).toBe(200);
        expect(res.json.me).toEqual({ name: 'Bob Roy', email: 'bob@firm.com' });
        expect(res.json.sessions.map((s: { nSesid: string }) => s.nSesid)).toEqual(['b1']);
        expect(res.text).not.toContain('"hash"');
        expect(audit).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'console-ok', actor: expect.objectContaining({ name: 'Bob Roy (box console)' }) }));

        const out = await call('POST', '/api/signout', { headers: { ...api, Cookie: cookie }, body: {} });
        expect(out.status).toBe(200);
        expect((await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } })).status).toBe(401);
    });

    it('a super-admin sees every case', async () => {
        const cookie = await signIn('root@etabella.com');
        const res = await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } });
        expect(res.json.sessions.map((s: { nSesid: string }) => s.nSesid).sort()).toEqual(['a1', 'b1']);
        expect(res.json.cases.map((c: { name: string }) => c.name)).toEqual(['Alpha v Beta', 'Gamma v Delta']);
    });

    it('shows "My cases", the Reporter column and what the kernel says about the address set on etabella.net', async () => {
        const cookie = await signIn('bob@firm.com');
        const before = await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } });
        expect(before.json.cases).toEqual([{ nCaseid: 'case-b', name: 'Gamma v Delta' }]);
        expect(before.json.sessions.map((s: { reporter: string }) => s.reporter)).toEqual(['Connects to this box']);
        expect(before.json.transmitter.cloud).toBeNull();

        cloudReporter = { nSesid: 'b1', host: '10.0.0.5', port: 1337, state: 'refused', reason: 'outside-network' };
        const refused = await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } });
        expect(refused.json.transmitter.cloud).toEqual({
            nSesid: 'b1',
            state: 'refused',
            tone: 'warn',
            text: "Reporter IP 10.0.0.5 is outside this box's reporter network. Change it on etabella.net or set the connection here.",
        });
        cloudReporter = { nSesid: 'b1', host: '192.168.1.20', port: 1337, state: 'applied', reason: null };
        const applied = await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } });
        expect(applied.json.transmitter.cloud).toMatchObject({ tone: 'ok', text: 'Set on etabella.net for Session b1' });
    });

    it('a kernel that cannot say (the status throws) just shows no note', async () => {
        await server.beforeApplicationShutdown();
        const state = { identity: { get: () => null }, sessions: { list: () => [] }, assignments, roster, audit: { append: jest.fn() } };
        const kernel = {
            sessions: () => [],
            cloudReporterStatus: () => {
                throw new Error('boom');
            },
        };
        server = new BoxConsoleServer(config as never, 'serve', () => NOW, state as never, kernel as never, { cloudLink: () => null } as never, { state: () => txState() } as never);
        await server.listen(0);
        port = server.address()!;
        const cookie = await signIn('ann@firm.com');
        const res = await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } });
        expect(res.status).toBe(200);
        expect(res.json.transmitter.cloud).toBeNull();
    });

    it('the reporter connection needs a sign-in and goes through TransmitterControl as that person', async () => {
        const body = { stateVersion: 4, settings: { mode: 'dial', protocol: 'bridge', host: '192.168.1.20', port: 1337, autoReconnect: true, receivingSesid: null }, confirmInterrupt: false };
        expect((await call('POST', '/api/transmitter', { headers: api, body })).status).toBe(401);
        expect(transmitter.apply).not.toHaveBeenCalled();

        // A case member reads only: the reporter connection is for super-admins.
        const member = await signIn('ann@firm.com');
        const refused = await call('POST', '/api/transmitter', { headers: { ...api, Cookie: member }, body });
        expect(refused.status).toBe(403);
        expect(refused.json).toEqual({ error: 'not_box_admin', message: 'Only a super admin can change the reporter connection.' });
        expect((await call('POST', '/api/transmitter/connect', { headers: { ...api, Cookie: member }, body: { stateVersion: 4 } })).status).toBe(403);
        expect((await call('POST', '/api/transmitter/reconnect', { headers: { ...api, Cookie: member }, body: { stateVersion: 4 } })).status).toBe(403);
        expect(transmitter.apply).not.toHaveBeenCalled();
        expect(transmitter.connect).not.toHaveBeenCalled();
        expect(transmitter.reconnect).not.toHaveBeenCalled();
        expect((await call('GET', '/api/state', { headers: { ...api, Cookie: member } })).json.canChangeSettings).toBe(false);

        const cookie = await signIn('root@etabella.com');
        expect((await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } })).json.canChangeSettings).toBe(true);
        const res = await call('POST', '/api/transmitter', { headers: { ...api, Cookie: cookie }, body });
        expect(res.status).toBe(200);
        expect(transmitter.apply).toHaveBeenCalledWith(body, expect.objectContaining({ kind: 'operator', name: 'Root Admin (box console)', isBoxAdmin: true, isSuperAdmin: true, forwardable: false, token: '' }), expect.objectContaining({ ip: '127.0.0.1' }));

        await call('POST', '/api/transmitter/connect', { headers: { ...api, Cookie: cookie }, body: { stateVersion: 4 } });
        await call('POST', '/api/transmitter/reconnect', { headers: { ...api, Cookie: cookie }, body: { stateVersion: 4 } });
        expect(transmitter.connect).toHaveBeenCalledTimes(1);
        expect(transmitter.reconnect).toHaveBeenCalledTimes(1);
    });

    it('a refused change answers in plain words with the box status', async () => {
        const cookie = await signIn('root@etabella.com');
        transmitter.apply.mockRejectedValueOnce(new EdgePortError('invalid_settings', 'bad', { fields: { host: 'ipv4' } } as never));
        const res = await call('POST', '/api/transmitter', { headers: { ...api, Cookie: cookie }, body: { stateVersion: 4, settings: {} } });
        expect(res.status).toBe(400);
        expect(res.json).toEqual({ error: 'invalid_settings', message: "Enter the reporter machine's IP address, like 192.168.1.20." });
    });

    it('refuses a body that is too large or not JSON', async () => {
        const cookie = await signIn('ann@firm.com');
        expect((await call('POST', '/api/transmitter', { headers: { ...api, Cookie: cookie }, body: 'x'.repeat(5000) })).status).toBe(413);
        expect((await call('POST', '/api/transmitter', { headers: { ...api, Cookie: cookie }, body: '{oops' })).status).toBe(400);
    });

    it('does not start for a CLI command, or when the port is 0', async () => {
        const cli = build('cli');
        await cli.onApplicationBootstrap();
        expect(cli.address()).toBeNull();
        const off = build('serve');
        await off.onApplicationBootstrap();
        expect(off.address()).toBeNull();
    });

    it('"Connect to server" lists the default-route address first (looked up in the background, at most once a minute)', async () => {
        // The default route leads only as an address of a real (not VPN / virtual) adapter of this machine: take the
        // last such one, so it would not lead by the ranking alone on a machine with several.
        const real = Object.entries(os.networkInterfaces()).flatMap(([name, infos]) =>
            (infos ?? []).filter(a => a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.') && !isVirtualAdapter({ name, address: a.address })).map(a => a.address),
        );
        const route = real.length ? real[real.length - 1] : null;
        await server.beforeApplicationShutdown();
        server = build();
        const lookup = jest.fn(async () => route);
        server.defaultRouteLookup = lookup;
        await server.listen(0);
        port = server.address()!;
        await new Promise(resolve => setImmediate(resolve));
        const cookie = await signIn('root@etabella.com');
        const res = await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } });
        expect(res.json.transmitter.listen.addresses[0]).toBe(route ?? lanIpv4Addresses(null)[0]);
        await call('GET', '/api/state', { headers: { ...api, Cookie: cookie } });
        expect(lookup).toHaveBeenCalledTimes(1);
    });
});

describe('lanIpv4Addresses (user decision 2026-10-04: ranked like the Network card)', () => {
    const nic = (address: string, internal = false) => ({ address, netmask: '255.255.255.0', family: 'IPv4', mac: '00:00:00:00:00:00', internal, cidr: `${address}/24` });
    /** The box PC: os.networkInterfaces() lists two VPNs and a virtual switch before the Wi-Fi. */
    const THIS_PC = {
        'Loopback Pseudo-Interface 1': [nic('127.0.0.1', true)],
        'Radmin VPN': [nic('26.118.179.38')],
        Hamachi: [nic('25.27.55.98'), { ...nic('fe80::1'), family: 'IPv6' }],
        'vEthernet (Default Switch)': [nic('172.18.64.1')],
        'Wi-Fi 2': [nic('192.168.1.5'), nic('169.254.3.3')],
    };

    it('puts private ranges first and VPN / virtual adapters last; the default-route address leads when known', () => {
        expect(lanIpv4Addresses(null, THIS_PC as never)).toEqual(['192.168.1.5', '26.118.179.38', '25.27.55.98', '172.18.64.1']);
        expect(lanIpv4Addresses('192.168.1.5', THIS_PC as never)).toEqual(['192.168.1.5', '26.118.179.38', '25.27.55.98', '172.18.64.1']);
        // Review 2026-10-04: a default route on a VPN / virtual adapter, or on no adapter listed now, never leads.
        expect(lanIpv4Addresses('172.18.64.1', THIS_PC as never)[0]).toBe('192.168.1.5');
        expect(lanIpv4Addresses('192.168.1.77', THIS_PC as never)).toEqual(['192.168.1.5', '26.118.179.38', '25.27.55.98', '172.18.64.1']);
        expect(lanIpv4Addresses('10.0.0.9', { ...THIS_PC, Ethernet: [nic('10.0.0.9')] } as never)[0]).toBe('10.0.0.9');
        expect(lanIpv4Addresses(null, {} as never)).toEqual([]);
    });
});

describe('consoleMessage', () => {
    it('keeps the server sentence for a refusal it has no words for', () => {
        expect(consoleMessage(new EdgePortError('state_changed', 'x', { stateVersion: 5 } as never))).toContain('changed meanwhile');
    });
});
