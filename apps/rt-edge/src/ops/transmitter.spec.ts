import { Logger } from '@nestjs/common';

import { TransmitterSettings } from '../contracts';
import { EdgePortError } from '../ports';
import { DIAL, FakeKernel, FakeState, LISTEN, linkOf, NOW, principalOf, sessionRecord, testConfig } from './testing/ops-fakes';
import {
    actorOf,
    buildGuard,
    hasDialAddress,
    isTestBusy,
    parseApplyRequest,
    parseTestRequest,
    parseVersionRequest,
    TransmitterControl,
    transmitterActions,
    validateTransmitterDraft,
} from './transmitter';

beforeAll(() => Logger.overrideLogger(false));
afterAll(() => Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']));

async function refusal(work: () => unknown): Promise<EdgePortError> {
    try {
        await work();
    } catch (err) {
        expect(err).toBeInstanceOf(EdgePortError);
        return err as EdgePortError;
    }
    throw new Error('expected a refusal');
}

describe('transmitter request parsing', () => {
    it('reads the version request: a non-negative integer', () => {
        expect(parseVersionRequest({ stateVersion: 0 })).toBe(0);
        expect(parseVersionRequest({ stateVersion: 12, extra: true })).toBe(12);
        for (const body of [null, [], 'x', {}, { stateVersion: -1 }, { stateVersion: 1.5 }, { stateVersion: '3' }, { stateVersion: Number.MAX_SAFE_INTEGER + 2 }]) {
            expect(() => parseVersionRequest(body)).toThrow(EdgePortError);
        }
    });

    it('reads an apply request by shape; values are left for validation', () => {
        expect(parseApplyRequest({ stateVersion: 3, settings: { ...DIAL, host: ' 192.168.20.31 ', junk: 1 }, confirmInterrupt: true })).toEqual({
            stateVersion: 3,
            settings: DIAL,
            confirmInterrupt: true,
        });
        expect(parseApplyRequest({ stateVersion: 3, settings: { mode: 'listen', autoReconnect: false } })).toEqual({
            stateVersion: 3,
            settings: { mode: 'listen', protocol: null, host: null, port: null, autoReconnect: false, receivingSesid: null },
            confirmInterrupt: false,
        });
        expect(parseApplyRequest({ stateVersion: 3, settings: { ...DIAL, host: '', receivingSesid: '  ' } }).settings).toMatchObject({ host: null, receivingSesid: null });
        // Values that fail validation still parse (the version check comes first).
        expect(parseApplyRequest({ stateVersion: 3, settings: { ...DIAL, host: '999.1.1.1', port: 70_000.5 } }).settings).toMatchObject({ host: '999.1.1.1', port: 70_000.5 });
    });

    it('refuses malformed apply bodies with invalid_request', async () => {
        const bad: unknown[] = [
            { stateVersion: 3 },
            { stateVersion: 3, settings: [] },
            { stateVersion: 3, settings: { ...DIAL, mode: 'both' } },
            { stateVersion: 3, settings: { ...DIAL, protocol: 'telnet' } },
            { stateVersion: 3, settings: { ...DIAL, host: 192 } },
            { stateVersion: 3, settings: { ...DIAL, port: '8080' } },
            { stateVersion: 3, settings: { ...DIAL, port: Number.NaN } },
            { stateVersion: 3, settings: { ...DIAL, autoReconnect: 'yes' } },
            { stateVersion: 3, settings: { ...DIAL, receivingSesid: 5 } },
            { stateVersion: 3, settings: DIAL, confirmInterrupt: 'true' },
        ];
        for (const body of bad) expect((await refusal(() => parseApplyRequest(body))).code).toBe('invalid_request');
    });

    it('reads a test request; unknown protocol and missing values are left for field errors', () => {
        expect(parseTestRequest({ protocol: 'caseview', host: ' 192.168.20.31 ', port: 8080 })).toEqual({ protocol: 'caseview', host: '192.168.20.31', port: 8080 });
        expect(parseTestRequest({ protocol: 'telnet' })).toEqual({ protocol: null, host: null, port: null });
        for (const body of [null, [], { host: 1 }, { port: '8080' }, { protocol: 3 }]) expect(() => parseTestRequest(body)).toThrow(EdgePortError);
    });
});

describe('transmitter rules (D34, DR13, S-D14)', () => {
    const config = testConfig();

    it('validates IPv4, port 1–65535, protocol, receiving session, and the transmitter-network allowlist', () => {
        expect(validateTransmitterDraft(DIAL, ['s1'], config)).toEqual({});
        expect(validateTransmitterDraft({ ...DIAL, host: '192.168.20.300' }, undefined, config)).toEqual({ host: 'ipv4' });
        expect(validateTransmitterDraft({ ...DIAL, host: '10.1.1.1' }, undefined, config)).toEqual({ host: 'ipv4' });
        expect(validateTransmitterDraft({ ...DIAL, host: null, port: null, protocol: null }, undefined, config)).toEqual({ host: 'required', port: 'required', protocol: 'required' });
        expect(validateTransmitterDraft({ ...DIAL, port: 0 }, undefined, config)).toEqual({ port: 'port-range' });
        expect(validateTransmitterDraft({ ...DIAL, port: 65_536 }, undefined, config)).toEqual({ port: 'port-range' });
        expect(validateTransmitterDraft({ ...DIAL, port: 1 }, undefined, config)).toEqual({});
        expect(validateTransmitterDraft({ ...DIAL, port: 65_535 }, undefined, config)).toEqual({});
        expect(validateTransmitterDraft({ ...DIAL, receivingSesid: 'sX' }, ['s1'], config)).toEqual({ receivingSesid: 'unknown-session' });
        // Listen mode needs nothing else; the dial fields are unused there.
        expect(validateTransmitterDraft({ ...LISTEN, host: 'garbage', port: -1 }, ['s1'], config)).toEqual({});
        // Dev box without a CIDR: no allowlist.
        expect(validateTransmitterDraft({ ...DIAL, host: '10.1.1.1' }, undefined, testConfig({ transmitter: { bindAddress: null, networkCidr: null } }))).toEqual({});
        // Dial mode switched off for this box.
        expect(validateTransmitterDraft(DIAL, undefined, testConfig({ features: { transmitterDialMode: false } }))).toEqual({ mode: 'required' });
    });

    it('DR13 buttons: one Connect, Test only while nothing is connected or retrying, Reconnect while down', () => {
        expect(transmitterActions(DIAL, linkOf({ state: 'disconnected', mode: 'dial' }))).toEqual({ connect: true, testOnly: false, reconnect: true });
        expect(transmitterActions({ ...DIAL, autoReconnect: false }, linkOf({ state: 'disconnected', mode: 'dial' }))).toEqual({ connect: true, testOnly: true, reconnect: true });
        expect(transmitterActions(DIAL, linkOf({ state: 'connecting', mode: 'dial', attempt: 3 }))).toEqual({ connect: false, testOnly: false, reconnect: true });
        expect(transmitterActions(DIAL, linkOf({ state: 'live', mode: 'dial' }))).toEqual({ connect: false, testOnly: false, reconnect: false });
        expect(transmitterActions(DIAL, linkOf({ state: 'waiting', mode: 'dial', heldPeers: 1 }))).toEqual({ connect: true, testOnly: false, reconnect: true });
        expect(transmitterActions(null, linkOf({ state: 'not-set-up', mode: 'dial' }))).toEqual({ connect: false, testOnly: true, reconnect: false });
        expect(transmitterActions(LISTEN, linkOf({ state: 'waiting' }))).toEqual({ connect: false, testOnly: true, reconnect: false });
        expect(hasDialAddress({ ...DIAL, port: null })).toBe(false);
        expect(isTestBusy(LISTEN, linkOf({ state: 'quiet' }))).toBe(true);
    });

    it('builds the guard from the live connection', () => {
        const kernel = new FakeKernel();
        kernel.settings = DIAL;
        kernel.link = linkOf({ state: 'live', mode: 'dial', receivingSesid: 's1', peer: '192.168.20.31:8080', lastLineAtMs: NOW - 3_000 });
        const after: TransmitterSettings = { ...DIAL, port: 8081 };
        expect(buildGuard(kernel.state(), after, ['port'], () => null)).toEqual({
            session: { nSesid: 's1', sessionName: 'Day 3 — Morning', caseName: 'Acme v Beta' },
            lastLineAtMs: NOW - 3_000,
            peer: '192.168.20.31:8080',
            now: DIAL,
            after,
            changes: ['port'],
            stateVersion: 7,
        });
        kernel.link = linkOf({ state: 'connected-no-session', receivingSesid: 'sZ' });
        expect(buildGuard(kernel.state(), after, ['port'], id => (id === 'sZ' ? { sessionName: 'Z', caseName: 'Case Z' } : null)).session).toEqual({ nSesid: 'sZ', sessionName: 'Z', caseName: 'Case Z' });
        kernel.link = linkOf({ state: 'connected-no-session', receivingSesid: null });
        expect(buildGuard(kernel.state(), after, ['port'], () => null).session).toBeNull();
    });

    it('actor: the person, or for an operator session the minting admin', () => {
        expect(actorOf(principalOf('online'))).toEqual({ nUserid: 'u1', name: 'Priya Shah', via: 'online', operatorName: null });
        expect(actorOf(principalOf('operator'))).toEqual({ nUserid: null, name: 'Maria Admin', via: 'operator', operatorName: null });
    });
});

describe('TransmitterControl (contract check order in front of the kernel)', () => {
    let kernel: FakeKernel;
    let state: FakeState;
    let control: TransmitterControl;
    const admin = principalOf('online');
    const ctx = { ip: '10.40.1.77', userAgent: 'Safari', deviceCookie: null };

    beforeEach(() => {
        kernel = new FakeKernel();
        state = new FakeState();
        state.sessionsData = [sessionRecord()];
        control = new TransmitterControl(kernel.asPort(), state.asPort(), testConfig(), () => NOW);
    });

    it('GET: the kernel state with derived DR13 buttons and the DR6 quiet level', () => {
        kernel.settings = DIAL;
        kernel.link = linkOf({ state: 'quiet', mode: 'dial', lastLineAtMs: NOW - 700_000 });
        const s = control.state();
        expect(s.stateVersion).toBe(7);
        expect(s.settings).toEqual(DIAL);
        expect(s.link.quietLevel).toBe('warn');
        expect(s.actions).toEqual({ connect: false, testOnly: false, reconnect: false });
        expect(s.listen).toEqual({ boxTransmitterAddress: '192.168.20.2', port: 2500 });
    });

    it('GET: a button is offered only when the kernel (which knows the dialer is retrying) offers it too; no extra keys', () => {
        kernel.settings = DIAL;
        kernel.link = linkOf({ state: 'disconnected', mode: 'dial' });
        const port = kernel.asPort();
        const base = port.transmitterState;
        (port as { transmitterState: unknown }).transmitterState = () => ({ ...base(), actions: { connect: false, testOnly: true, reconnect: true }, internalOnly: 'x' });
        const c = new TransmitterControl(port, state.asPort(), testConfig(), () => NOW);
        const s = c.state();
        // Derived: connect + reconnect (applied address, link down), test busy (auto-reconnect retrying); kernel: no connect.
        expect(s.actions).toEqual({ connect: false, testOnly: false, reconnect: true });
        expect(Object.keys(s).sort()).toEqual(['actions', 'applied', 'link', 'listen', 'sessions', 'settings', 'stateVersion']);
    });

    it('apply: a stale version is refused with the current one, before anything else (and audited)', async () => {
        const err = await refusal(() => control.apply({ stateVersion: 6, settings: { ...DIAL, host: 'bad' } }, admin, ctx));
        expect(err.code).toBe('state_changed');
        expect(err.extra).toEqual({ stateVersion: 7 });
        expect(err.status).toBe(409);
        expect(kernel.calls).toEqual([]);
        expect(state.auditRows).toEqual([expect.objectContaining({ action: 'transmitter-apply', outcome: 'state_changed', ip: '10.40.1.77', actor: actorOf(admin) })]);
    });

    it('apply: then field errors, including the allowlist and unknown receiving session', async () => {
        const err = await refusal(() => control.apply({ stateVersion: 7, settings: { ...DIAL, host: '10.9.9.9', port: 0, receivingSesid: 'sX' } }, admin));
        expect(err.code).toBe('invalid_settings');
        expect(err.extra).toEqual({ fields: { host: 'ipv4', port: 'port-range', receivingSesid: 'unknown-session' } });
        expect(err.status).toBe(400);
        expect(kernel.calls).toEqual([]);
    });

    it('apply: an interrupting change on a live link needs the guard; the confirm re-checks with the same version', async () => {
        kernel.settings = DIAL;
        kernel.link = linkOf({ state: 'live', mode: 'dial', receivingSesid: 's1' });
        const next = { ...DIAL, host: '192.168.20.40' };
        const err = await refusal(() => control.apply({ stateVersion: 7, settings: next, confirmInterrupt: false }, admin));
        expect(err.code).toBe('confirm_required');
        expect(err.extra).toEqual({
            guard: expect.objectContaining({ changes: ['host'], now: DIAL, after: next, stateVersion: 7, session: { nSesid: 's1', sessionName: 'Day 3 — Morning', caseName: 'Acme v Beta' } }),
        });
        expect(kernel.calls).toEqual([]);

        // The connection changed meanwhile: the confirm with the old version is refused.
        kernel.stateVersion = 8;
        expect((await refusal(() => control.apply({ stateVersion: 7, settings: next, confirmInterrupt: true }, admin))).code).toBe('state_changed');

        const applied = await control.apply({ stateVersion: 8, settings: next, confirmInterrupt: true }, admin);
        expect(kernel.calls).toEqual([['applyTransmitter', [{ stateVersion: 8, settings: next, confirmInterrupt: true }, actorOf(admin)]]]);
        expect(applied.stateVersion).toBe(9);
        expect(applied.settings).toEqual(next);
    });

    it('apply: non-interrupting edits (or a link that is down) go straight through', async () => {
        kernel.settings = DIAL;
        kernel.link = linkOf({ state: 'live', mode: 'dial' });
        await control.apply({ stateVersion: 7, settings: { ...DIAL, autoReconnect: true } }, admin);
        kernel.link = linkOf({ state: 'disconnected', mode: 'dial' });
        await control.apply({ stateVersion: 8, settings: { ...DIAL, port: 9000 } }, admin);
        expect(kernel.calls.map(c => c[0])).toEqual(['applyTransmitter', 'applyTransmitter']);
        // A refusal the kernel decides is the kernel's to audit.
        kernel.failNext = new EdgePortError('state_changed', 'raced', { stateVersion: 99 });
        expect((await refusal(() => control.apply({ stateVersion: 9, settings: DIAL }, admin))).extra).toEqual({ stateVersion: 99 });
        expect(state.auditRows).toEqual([]);
    });

    it('connect: state_changed → not_dial_mode → not_configured → already_connected', async () => {
        kernel.settings = LISTEN;
        expect((await refusal(() => control.connect({ stateVersion: 1 }, admin))).code).toBe('state_changed');
        expect((await refusal(() => control.connect({ stateVersion: 7 }, admin))).code).toBe('not_dial_mode');
        kernel.settings = { ...DIAL, host: null };
        expect((await refusal(() => control.connect({ stateVersion: 7 }, admin))).code).toBe('not_configured');
        kernel.settings = DIAL;
        kernel.link = linkOf({ state: 'connected-no-session', mode: 'dial' });
        expect((await refusal(() => control.connect({ stateVersion: 7 }, admin))).code).toBe('already_connected');
        kernel.link = linkOf({ state: 'waiting', mode: 'dial' });
        const s = await control.connect({ stateVersion: 7 }, admin);
        expect(s.link.state).toBe('connecting');
        expect(kernel.calls).toEqual([['connectTransmitter', [7, actorOf(admin)]]]);
        expect(state.auditRows.map(a => a.outcome)).toEqual(['state_changed', 'not_dial_mode', 'not_configured', 'already_connected']);
        expect((await refusal(() => control.connect([], admin))).code).toBe('invalid_request');
    });

    it('reconnect: state_changed → not_dial_mode → link_up; only while down', async () => {
        kernel.settings = LISTEN;
        kernel.link = linkOf({ state: 'disconnected' });
        expect((await refusal(() => control.reconnect({ stateVersion: 3 }, admin))).code).toBe('state_changed');
        expect((await refusal(() => control.reconnect({ stateVersion: 7 }, admin))).code).toBe('not_dial_mode');
        kernel.settings = DIAL;
        kernel.link = linkOf({ state: 'quiet', mode: 'dial' });
        expect((await refusal(() => control.reconnect({ stateVersion: 7 }, admin))).code).toBe('link_up');
        kernel.link = linkOf({ state: 'disconnected', mode: 'dial' });
        await control.reconnect({ stateVersion: 7 }, admin);
        expect(kernel.calls.map(c => c[0])).toEqual(['reconnectTransmitter']);
    });

    it('test only: refused while connected, connecting, retrying or capturing; then the draft is validated', async () => {
        const draft = { protocol: 'bridge', host: '192.168.20.31', port: 8080 };
        for (const link of [linkOf({ state: 'live' }), linkOf({ state: 'connected-no-session' }), linkOf({ state: 'connecting', mode: 'dial' }), linkOf({ state: 'waiting', heldPeers: 1 })]) {
            kernel.link = link;
            const err = await refusal(() => control.test(draft, admin));
            expect(err.code).toBe('test_refused_busy');
            expect(err.extra).toEqual({ linkState: link.state });
        }
        kernel.settings = DIAL;
        kernel.link = linkOf({ state: 'disconnected', mode: 'dial' });
        expect((await refusal(() => control.test(draft, admin))).extra).toEqual({ linkState: 'disconnected' });

        kernel.settings = LISTEN;
        kernel.link = linkOf({ state: 'waiting' });
        const bad = await refusal(() => control.test({ protocol: 'telnet', host: '10.1.1.1', port: 70_000 }, admin));
        expect(bad.code).toBe('invalid_settings');
        expect(bad.extra).toEqual({ fields: { protocol: 'required', host: 'ipv4', port: 'port-range' } });
        expect(kernel.calls).toEqual([]);

        await expect(control.test(draft, admin)).resolves.toEqual(kernel.testResult);
        expect(kernel.calls).toEqual([['testTransmitter', [draft, actorOf(admin)]]]);
        expect(state.auditRows.every(a => a.action === 'transmitter-test')).toBe(true);
    });

    it('an audit failure never changes the answer', async () => {
        const broken = new FakeState();
        const port = broken.asPort();
        (port.audit as { append: unknown }).append = () => {
            throw new Error('disk full');
        };
        const c = new TransmitterControl(kernel.asPort(), port, testConfig(), () => NOW);
        expect((await refusal(() => c.connect({ stateVersion: 1 }, admin))).code).toBe('state_changed');
    });
});
