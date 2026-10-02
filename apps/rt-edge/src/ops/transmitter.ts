/**
 * Box settings → Transmitter (D34, DR13, DR16; CONTRACTS.md §8.7), the HTTP side: body parsing, the contract's
 * check order, the DR13 button rules and the guard, in front of the kernel (which owns the link, persists the
 * settings, bumps the state version and re-checks everything atomically, ports/kernel.port.ts).
 *
 * Checks made here before the kernel is called, in the contract's order (the kernel repeats them, so a race between
 * the two reads is refused there):
 * - apply:     invalid_request (malformed body) → state_changed {stateVersion} → invalid_settings {fields} (IPv4,
 *              port 1–65535, protocol, known receiving session, the transmitter-network allowlist S-D14, dial mode
 *              switched off for this box) → confirm_required {guard} (link up, an interrupting change, no confirm);
 * - connect:   state_changed → not_dial_mode → not_configured → already_connected;
 * - reconnect: state_changed → not_dial_mode → link_up;
 * - test:      test_refused_busy {linkState} (connected, connecting / retrying, or capturing) → invalid_settings.
 * The kernel audits the writes it performs; a refusal decided here is audited here (outcome = the error code).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
    EdgeActor,
    TransmitterActions,
    TransmitterApplyRequest,
    TransmitterField,
    TransmitterFieldErrors,
    TransmitterGuard,
    TransmitterLinkStatus,
    TransmitterProtocol,
    TransmitterSettings,
    TransmitterTestRequest,
    transmitterInterruptingChanges,
    validateTransmitterSettings,
} from '../contracts';
import {
    BOX_CONFIG,
    BoxConfig,
    EDGE_CLOCK,
    EdgeAuditAction,
    EdgeClock,
    EdgePortError,
    EdgePrincipal,
    EdgeRequestContext,
    ipv4InCidr,
    isEdgePortError,
    KERNEL_PORT,
    KernelPort,
    KernelTransmitterState,
    KernelTransmitterTest,
    STATE_PORT,
    StatePort,
} from '../ports';
import { isLinkUp, normalizeTransmitterLink } from './status';

/** Who acted, for audit rows and "Applied 09:12 by P. Shah" (operator sessions: the minting admin's name). */
export function actorOf(principal: EdgePrincipal): EdgeActor {
    return {
        nUserid: principal.kind === 'operator' ? null : principal.userId,
        name: principal.kind === 'operator' ? principal.mintedBy?.name ?? principal.name : principal.name,
        via: principal.kind,
        operatorName: null,
    };
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const PROTOCOLS: readonly TransmitterProtocol[] = ['bridge', 'caseview'];

function invalid(message: string): EdgePortError<'invalid_request'> {
    return new EdgePortError('invalid_request', message);
}

/** `{stateVersion}`: a non-negative safe integer. */
export function parseVersionRequest(body: unknown): number {
    if (!isPlainObject(body)) throw invalid('the body must be an object');
    const v = body['stateVersion'];
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) throw invalid('stateVersion must be a non-negative integer');
    return v;
}

/**
 * `TransmitterApplyRequest` by shape (types only; values are validated after the version check). Unknown keys are
 * dropped; a missing `confirmInterrupt` reads false; an empty `receivingSesid` reads null (automatic).
 */
export function parseApplyRequest(body: unknown): TransmitterApplyRequest {
    const stateVersion = parseVersionRequest(body);
    const raw = (body as Record<string, unknown>)['settings'];
    if (!isPlainObject(raw)) throw invalid('settings must be an object');
    const confirm = (body as Record<string, unknown>)['confirmInterrupt'];
    if (confirm !== undefined && typeof confirm !== 'boolean') throw invalid('confirmInterrupt must be true or false');
    const mode = raw['mode'];
    if (mode !== 'listen' && mode !== 'dial') throw invalid('settings.mode must be "listen" or "dial"');
    const protocol = raw['protocol'] ?? null;
    if (protocol !== null && !PROTOCOLS.includes(protocol as TransmitterProtocol)) throw invalid('settings.protocol must be "bridge", "caseview" or null');
    const host = raw['host'] ?? null;
    if (host !== null && typeof host !== 'string') throw invalid('settings.host must be a string or null');
    const port = raw['port'] ?? null;
    if (port !== null && (typeof port !== 'number' || !Number.isFinite(port))) throw invalid('settings.port must be a number or null');
    const autoReconnect = raw['autoReconnect'];
    if (typeof autoReconnect !== 'boolean') throw invalid('settings.autoReconnect must be true or false');
    const receiving = raw['receivingSesid'] ?? null;
    if (receiving !== null && typeof receiving !== 'string') throw invalid('settings.receivingSesid must be a string or null');
    const trimmedHost = host === null ? null : (host as string).trim();
    const settings: TransmitterSettings = {
        mode,
        protocol: protocol as TransmitterProtocol | null,
        host: trimmedHost === '' ? null : trimmedHost,
        port: port as number | null,
        autoReconnect,
        receivingSesid: receiving === null || (receiving as string).trim() === '' ? null : (receiving as string).trim(),
    };
    return { stateVersion, settings, confirmInterrupt: confirm === true };
}

/**
 * `TransmitterTestRequest` by shape. Missing or unknown values are left for validation (`required`), so the FE gets
 * field errors for an incomplete draft; wrong JSON types are `invalid_request`.
 */
export function parseTestRequest(body: unknown): { readonly protocol: TransmitterProtocol | null; readonly host: string | null; readonly port: number | null } {
    if (!isPlainObject(body)) throw invalid('the body must be an object');
    const protocol = body['protocol'] ?? null;
    if (protocol !== null && typeof protocol !== 'string') throw invalid('protocol must be a string');
    const host = body['host'] ?? null;
    if (host !== null && typeof host !== 'string') throw invalid('host must be a string');
    const port = body['port'] ?? null;
    if (port !== null && (typeof port !== 'number' || !Number.isFinite(port))) throw invalid('port must be a number');
    const trimmedHost = host === null ? null : (host as string).trim();
    return {
        protocol: PROTOCOLS.includes(protocol as TransmitterProtocol) ? (protocol as TransmitterProtocol) : null,
        host: trimmedHost === '' ? null : trimmedHost,
        port: port as number | null,
    };
}

/**
 * The contract validation plus the box rules: a dial host must lie inside `transmitter.networkCidr` (S-D14; the
 * contract has no separate code, so `ipv4`), and dial mode must be enabled for this box (`features.transmitterDialMode`;
 * refused as `mode: 'required'`).
 */
export function validateTransmitterDraft(
    settings: TransmitterSettings,
    knownSessionIds: readonly string[] | undefined,
    config: Pick<BoxConfig, 'transmitter' | 'features'>,
): TransmitterFieldErrors {
    const errors: { [K in TransmitterField]?: TransmitterFieldErrors[K] } = { ...validateTransmitterSettings(settings, knownSessionIds) };
    if (settings.mode === 'dial') {
        if (!config.features.transmitterDialMode) errors.mode = 'required';
        const cidr = config.transmitter.networkCidr;
        if (!errors.host && settings.host && cidr && !ipv4InCidr(settings.host, cidr)) errors.host = 'ipv4';
    }
    return errors;
}

/** Applied dial settings with an address. */
export function hasDialAddress(settings: TransmitterSettings | null): boolean {
    return !!settings && settings.mode === 'dial' && !!settings.host && settings.port !== null && settings.port !== undefined;
}

/**
 * "Test only" must never take over a live socket (DR13): busy while connected, connecting, retrying (dial mode
 * with auto-reconnect after a drop), or capturing a held second connection.
 */
export function isTestBusy(settings: TransmitterSettings | null, link: TransmitterLinkStatus): boolean {
    if (isLinkUp(link.state) || link.state === 'connecting' || link.heldPeers > 0) return true;
    return !!settings && settings.mode === 'dial' && settings.autoReconnect && link.state === 'disconnected';
}

/** DR13 buttons: one primary Connect; Test only while nothing is connected or retrying; Reconnect while down. */
export function transmitterActions(settings: TransmitterSettings | null, link: TransmitterLinkStatus): TransmitterActions {
    const address = hasDialAddress(settings);
    const up = isLinkUp(link.state);
    return {
        connect: address && !up && link.state !== 'connecting',
        testOnly: !isTestBusy(settings, link),
        reconnect: address && !up,
    };
}

/** The guard dialog (DR13): the session receiving lines now, the current connection and the change. */
export function buildGuard(current: KernelTransmitterState, after: TransmitterSettings, changes: readonly TransmitterField[], sessionLookup: (nSesid: string) => { readonly sessionName: string; readonly caseName: string } | null): TransmitterGuard {
    const link = current.link;
    const receiving = link.receivingSesid;
    const option = receiving ? current.sessions.find(s => s.nSesid === receiving) : undefined;
    const known = receiving ? option ?? sessionLookup(receiving) : null;
    return {
        session: receiving ? { nSesid: receiving, sessionName: known?.sessionName ?? '', caseName: known?.caseName ?? '' } : null,
        lastLineAtMs: link.lastLineAtMs,
        peer: link.peer,
        now: current.settings as TransmitterSettings,
        after,
        changes: [...changes],
        stateVersion: current.stateVersion,
    };
}

@Injectable()
export class TransmitterControl {
    private readonly logger = new Logger('EdgeTransmitter');

    constructor(
        @Inject(KERNEL_PORT) private readonly kernel: KernelPort,
        @Inject(STATE_PORT) private readonly store: StatePort,
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
    ) {}

    /** `GET /edge/local/ops/transmitter`: the kernel's state with the DR6 quiet level and the DR13 buttons. */
    state(): KernelTransmitterState {
        return this.normalize(this.kernel.transmitterState());
    }

    /** `PUT /edge/local/ops/transmitter`. */
    async apply(body: unknown, principal: EdgePrincipal, ctx: EdgeRequestContext | null = null): Promise<KernelTransmitterState> {
        const req = this.precheck('transmitter-apply', principal, ctx, () => {
            const parsed = parseApplyRequest(body);
            const current = this.kernel.transmitterState();
            this.checkVersion(parsed.stateVersion, current);
            const fields = validateTransmitterDraft(parsed.settings, current.sessions.map(s => s.nSesid), this.config);
            if (Object.keys(fields).length) throw new EdgePortError('invalid_settings', 'the transmitter settings are not valid', { fields });
            const changes = transmitterInterruptingChanges(current.settings, parsed.settings);
            if (isLinkUp(current.link.state) && changes.length && !parsed.confirmInterrupt) {
                const guard = buildGuard(current, parsed.settings, changes, id => this.sessionLookup(id));
                throw new EdgePortError('confirm_required', 'this change interrupts the live feed; confirm it', { guard });
            }
            return parsed;
        });
        return this.normalize(await this.kernel.applyTransmitter(req, actorOf(principal)));
    }

    /** `POST …/transmitter/connect`. */
    async connect(body: unknown, principal: EdgePrincipal, ctx: EdgeRequestContext | null = null): Promise<KernelTransmitterState> {
        const stateVersion = this.precheck('transmitter-connect', principal, ctx, () => {
            const version = parseVersionRequest(body);
            const current = this.kernel.transmitterState();
            this.checkVersion(version, current);
            if (current.settings?.mode !== 'dial') throw new EdgePortError('not_dial_mode', 'connect is a dial-mode action');
            if (!hasDialAddress(current.settings)) throw new EdgePortError('not_configured', 'no transmitter address has been applied');
            if (isLinkUp(current.link.state)) throw new EdgePortError('already_connected', 'the transmitter is already connected');
            return version;
        });
        return this.normalize(await this.kernel.connectTransmitter(stateVersion, actorOf(principal)));
    }

    /** `POST …/transmitter/reconnect` (verdict, link down only). */
    async reconnect(body: unknown, principal: EdgePrincipal, ctx: EdgeRequestContext | null = null): Promise<KernelTransmitterState> {
        const stateVersion = this.precheck('transmitter-reconnect', principal, ctx, () => {
            const version = parseVersionRequest(body);
            const current = this.kernel.transmitterState();
            this.checkVersion(version, current);
            if (current.settings?.mode !== 'dial') throw new EdgePortError('not_dial_mode', 'reconnect is a dial-mode action');
            if (isLinkUp(current.link.state)) throw new EdgePortError('link_up', 'the transmitter link is up');
            return version;
        });
        return this.normalize(await this.kernel.reconnectTransmitter(stateVersion, actorOf(principal)));
    }

    /** `POST …/transmitter/test` ("Test only" with the draft address; nothing is applied). */
    async test(body: unknown, principal: EdgePrincipal, ctx: EdgeRequestContext | null = null): Promise<KernelTransmitterTest> {
        const req = this.precheck('transmitter-test', principal, ctx, (): TransmitterTestRequest => {
            const draft = parseTestRequest(body);
            const current = this.kernel.transmitterState();
            if (isTestBusy(current.settings, current.link)) {
                throw new EdgePortError('test_refused_busy', 'the transmitter link is busy', { linkState: current.link.state });
            }
            const settings: TransmitterSettings = { mode: 'dial', protocol: draft.protocol, host: draft.host, port: draft.port, autoReconnect: true, receivingSesid: null };
            const fields = validateTransmitterDraft(settings, undefined, this.config);
            if (Object.keys(fields).length) throw new EdgePortError('invalid_settings', 'the test address is not valid', { fields });
            return { protocol: draft.protocol as TransmitterProtocol, host: draft.host as string, port: draft.port as number };
        });
        return this.kernel.testTransmitter(req, actorOf(principal));
    }

    private checkVersion(stateVersion: number, current: KernelTransmitterState): void {
        if (stateVersion !== current.stateVersion) {
            throw new EdgePortError('state_changed', 'the transmitter changed since it was read', { stateVersion: current.stateVersion });
        }
    }

    /**
     * The reply exactly as `TransmitterStateResponse` (minus `msg`): the DR6 quiet level, the listen info, and the DR13
     * buttons = the kernel's own (it knows whether the dialer is retrying) AND this module's rules (never offer a
     * button that either side would refuse).
     */
    private normalize(state: KernelTransmitterState): KernelTransmitterState {
        const link = normalizeTransmitterLink(state.link, this.clock());
        const derived = transmitterActions(state.settings, link);
        const kernel = state.actions;
        return {
            stateVersion: state.stateVersion,
            settings: state.settings,
            applied: state.applied,
            link,
            sessions: state.sessions,
            listen: {
                boxTransmitterAddress: state.listen.boxTransmitterAddress ?? this.config.transmitter.bindAddress,
                port: state.listen.port || this.config.transmitter.listenPort,
            },
            actions: {
                connect: derived.connect && kernel?.connect !== false,
                testOnly: derived.testOnly && kernel?.testOnly !== false,
                reconnect: derived.reconnect && kernel?.reconnect !== false,
            },
        };
    }

    private sessionLookup(nSesid: string): { sessionName: string; caseName: string } | null {
        try {
            const record = this.store.sessions.get(nSesid);
            if (!record) return null;
            return { sessionName: record.cName, caseName: this.store.assignments.case(record.nCaseid)?.cCasename ?? '' };
        } catch {
            return null;
        }
    }

    /** The checks made before the kernel is called; a refusal decided here is audited here (the kernel audits its own). */
    private precheck<T>(action: EdgeAuditAction, principal: EdgePrincipal, ctx: EdgeRequestContext | null, checks: () => T): T {
        try {
            return checks();
        } catch (err) {
            this.auditRefusal(action, principal, ctx, isEdgePortError(err) ? err.code : 'server_error');
            throw err;
        }
    }

    private auditRefusal(action: EdgeAuditAction, principal: EdgePrincipal, ctx: EdgeRequestContext | null, outcome: string): void {
        try {
            this.store.audit.append({
                atMs: this.clock(),
                action,
                actor: actorOf(principal),
                outcome,
                nSesid: null,
                target: null,
                ip: ctx?.ip ?? null,
                deviceHash: null,
                data: null,
            });
        } catch (err) {
            this.logger.error(`could not audit a refused ${action}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
}
