/**
 * What the localhost box console shows (console/box-console.server.ts `GET /api/state`), built from the ports in one
 * pass. Pure: every input is passed in, so specs need no box. Sentences live here, not in the page script, so the
 * page stays a thin renderer.
 *
 * The console is the simple face of the box for whoever sits at it: the sessions etabella.net sent, the reporter
 * connection (Eclipse "Connect to server" → this box, or this box → Eclipse "Wait for connection"), and the cloud
 * link. No transcript text and no password ever appear here: the box holds only the scrypt hash of the Eclipse
 * password, so the page points to the one shown on etabella.net when the session was created.
 */
import type { BoxConfig } from '../ports/box-config';
import type { CloudReporterStatus, KernelSessionView, KernelTransmitterState } from '../ports/kernel.port';
import type { BoxCaseRecord, BoxIdentityRecord, BoxSessionRecord } from '../ports/state.port';
import type { CloudLinkState, CloudLinkStatus, EdgeSessionPhase, TransmitterLinkState, TransmitterMode, TransmitterProtocol } from '../contracts';

export interface ConsoleSessionRow {
    readonly nSesid: string;
    readonly name: string;
    readonly caseName: string;
    /** Scheduled start as sent by etabella.net (ISO), or null. */
    readonly startsAt: string | null;
    readonly phase: EdgeSessionPhase;
    /** "Waiting for the reporter" / "Live" / "Ended". */
    readonly phaseLabel: string;
    readonly lines: number;
    readonly lastLineAtMs: number | null;
    /** The session's Eclipse username (the reporter logs in with it in "Connect to server" mode). */
    readonly eclipseUser: string;
    /** "192.168.1.20:1337" when etabella.net set the reporter machine for this session, else "Connects to this box". */
    readonly reporter: string;
    /** The transmitter feeds this session now. */
    readonly receiving: boolean;
}

/** What became of the reporter address set on etabella.net (the "Reporter connection" card shows `text`). */
export interface ConsoleCloudReporter {
    readonly nSesid: string;
    readonly state: CloudReporterStatus['state'];
    /** `ok`: in use; `warn`: the box could not use it; null: neutral. */
    readonly tone: 'ok' | 'warn' | null;
    readonly text: string;
}

export interface ConsoleSnapshot {
    readonly nowMs: number;
    /** Who is signed in at the console. */
    readonly me: { readonly name: string; readonly email: string } | null;
    /** The signed-in person may change the reporter connection here (super-admins only). */
    readonly canChangeSettings: boolean;
    /** "My cases": the box cases the signed-in person is on (a super-admin: every box case), by name. */
    readonly cases: readonly { readonly nCaseid: string; readonly name: string }[];
    readonly box: {
        readonly name: string;
        readonly timeZone: string;
        readonly version: string;
        /** Address people in the room use (`<slug>.<domain>`), null before enrolment. */
        readonly host: string | null;
        readonly enrolled: boolean;
        /** Plain words for the enrolment state, null when all is well. */
        readonly problem: string | null;
    };
    readonly cloud: {
        readonly state: CloudLinkState;
        readonly ok: boolean;
        readonly label: string;
        readonly lagLines: number;
        readonly lastSyncedAtMs: number | null;
    };
    readonly transmitter: {
        readonly stateVersion: number;
        readonly mode: TransmitterMode;
        readonly protocol: TransmitterProtocol | null;
        /** Dial mode: the reporter machine's address. */
        readonly host: string | null;
        readonly port: number | null;
        readonly state: TransmitterLinkState;
        readonly ok: boolean;
        readonly label: string;
        /** "192.168.20.31:51842": who is connected now. */
        readonly peer: string | null;
        readonly lastLineAtMs: number | null;
        readonly bytesIn: number;
        readonly lockout: boolean;
        /** Listen mode: what the reporter types into Eclipse ("Connect to server"). */
        readonly listen: { readonly addresses: readonly string[]; readonly port: number };
        readonly canConnect: boolean;
        readonly canReconnect: boolean;
        /** Null when no session carries a reporter address from etabella.net. */
        readonly cloud: ConsoleCloudReporter | null;
    };
    readonly sessions: readonly ConsoleSessionRow[];
}

export interface ConsoleSnapshotInput {
    readonly nowMs: number;
    readonly config: Pick<BoxConfig, 'box' | 'release' | 'transmitter'>;
    readonly identity: BoxIdentityRecord | null;
    readonly records: readonly BoxSessionRecord[];
    readonly views: readonly KernelSessionView[];
    readonly caseOf: (nCaseid: string) => BoxCaseRecord | null;
    readonly transmitter: KernelTransmitterState | null;
    readonly cloud: CloudLinkStatus | null;
    /** This machine's IPv4 addresses (non-internal), for the "Connect to server" address. */
    readonly addresses: readonly string[];
    /** Who is signed in (shown in the header); omitted in specs that do not care. */
    readonly me?: { readonly name: string; readonly email: string } | null;
    /** Super-admins only; omitted = false. */
    readonly canChangeSettings?: boolean;
    /** Only sessions of these cases are listed; null or omitted = every case (a super-admin). */
    readonly visibleCaseIds?: ReadonlySet<string> | null;
    /** The box's cases (for "My cases", filtered like the sessions); omitted in specs that do not care. */
    readonly cases?: readonly BoxCaseRecord[];
    /** `KernelPort.cloudReporterStatus()`; omitted or null = no session carries a reporter address. */
    readonly cloudReporter?: CloudReporterStatus | null;
}

/** Ended sessions shown below the live and upcoming ones. */
export const CONSOLE_ENDED_SHOWN = 10;

const CLOUD_LABEL: Readonly<Record<CloudLinkState, string>> = {
    'not-linked': 'Not linked to etabella.net yet',
    synced: 'Up to date with etabella.net',
    behind: 'Sending to etabella.net',
    'internet-unavailable': 'No internet. Lines are kept on this box and sent when it is back',
    'cant-reach-etabella': "Can't reach etabella.net. Lines are kept on this box and sent when it is back",
    'sync-refused': 'etabella.net refused this box. Check it under Admin › Venue boxes',
};

const TX_LABEL: Readonly<Record<TransmitterLinkState, string>> = {
    'not-set-up': 'Not set up',
    waiting: "Waiting for the reporter's Eclipse to connect",
    connecting: "Connecting to the reporter's machine",
    'connected-no-session': 'Connected, but no live session to receive the lines',
    live: 'Receiving lines',
    quiet: 'Connected, no new lines for a while',
    disconnected: 'Disconnected',
};

const PHASE_LABEL: Readonly<Record<EdgeSessionPhase, string>> = {
    'not-started': 'Waiting for the reporter',
    live: 'Live',
    ended: 'Ended',
};

const IDENTITY_PROBLEM: Readonly<Record<string, string>> = {
    'pending-confirm': 'Waiting for an admin to confirm this box on etabella.net (Admin › Venue boxes)',
    quarantined: 'etabella.net paused this box (Admin › Venue boxes)',
    revoked: 'This box was revoked on etabella.net',
};

/** A session row's "Reporter" cell when etabella.net set no reporter machine: the reporter's Eclipse logs in here. */
export const CONSOLE_REPORTER_CONNECTS = 'Connects to this box';

/**
 * The sentence under the reporter connection status. The session is named only to a person who may see it (their
 * cases); the address is box-wide, like the connection itself.
 */
function cloudReporterNote(status: CloudReporterStatus, input: ConsoleSnapshotInput): ConsoleCloudReporter {
    const record = input.records.find(r => r.nSesid === status.nSesid);
    const visible = !!record && (!input.visibleCaseIds || input.visibleCaseIds.has(record.nCaseid));
    const session = visible && record.cName ? record.cName : 'a session of another case';
    const address = `${status.host}:${status.port}`;
    const set = `etabella.net set ${address} for ${session}`;
    let text: string;
    if (status.state === 'applied') text = `Set on etabella.net for ${session}`;
    else if (status.state === 'overridden') text = `${set}. The connection was changed on this box since, and stays as set here.`;
    else if (status.state === 'waiting' && status.reason === 'held-by-session') {
        // Another open session owns the box's one reporter connection (kernel.port.ts: the owner rule).
        const holder = input.records.find(r => r.nSesid === status.heldBy);
        const holderVisible = !!holder && (!input.visibleCaseIds || input.visibleCaseIds.has(holder.nCaseid));
        const holderName = holderVisible && holder.cName ? holder.cName : 'A session of another case';
        text = `${set}. Waiting: ${holderName} is still open and holds the reporter connection. End it on etabella.net, or set the connection here.`;
    } else if (status.state === 'waiting') text = status.reason === 'feed-live' ? `${set}. This box switches to it when the feed that is live now stops.` : `${set}. This box is switching to it.`;
    else if (status.reason === 'outside-network') {
        const cidr = input.config.transmitter.networkCidr;
        text = `Reporter IP ${status.host} is outside this box's reporter network${cidr ? ` (${cidr})` : ''}. Change it on etabella.net or set the connection here.`;
    } else if (status.reason === 'dial-mode-off') text = `${set}, but connecting to the reporter is switched off on this box. The reporter's Eclipse connects to this box instead.`;
    else text = `${set}, but not whether the feed is Bridge or CaseView. Set the connection here.`;
    return { nSesid: status.nSesid, state: status.state, tone: status.state === 'applied' ? 'ok' : status.state === 'refused' ? 'warn' : null, text };
}

export function buildConsoleSnapshot(input: ConsoleSnapshotInput): ConsoleSnapshot {
    const { config, identity, transmitter: tx, cloud } = input;
    const viewOf = new Map(input.views.map(v => [v.nSesid, v]));
    const receivingSesid = tx?.link.receivingSesid ?? null;
    const cases = (input.cases ?? [])
        .filter(c => !input.visibleCaseIds || input.visibleCaseIds.has(c.nCaseid))
        .map(c => ({ nCaseid: c.nCaseid, name: c.cCasename || c.cCaseno || 'Unnamed case' }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const rows: ConsoleSessionRow[] = input.records
        .filter(r => r.listed && !r.deleted && r.localState !== 'purged' && r.purgedAtMs === null)
        .filter(r => !input.visibleCaseIds || input.visibleCaseIds.has(r.nCaseid))
        .map(r => {
            const view = viewOf.get(r.nSesid) ?? null;
            const phase: EdgeSessionPhase = view?.phase ?? (r.endedAtMs !== null ? 'ended' : r.firstLineAtMs !== null ? 'live' : 'not-started');
            return {
                nSesid: r.nSesid,
                name: r.cName,
                caseName: input.caseOf(r.nCaseid)?.cCasename ?? '',
                startsAt: r.dStartDt,
                phase,
                phaseLabel: PHASE_LABEL[phase],
                lines: view?.totalLines ?? 0,
                lastLineAtMs: view?.lastLineAtMs ?? null,
                eclipseUser: r.route?.user ?? '',
                reporter: r.reporter ? `${r.reporter.host}:${r.reporter.port}` : CONSOLE_REPORTER_CONNECTS,
                receiving: receivingSesid === r.nSesid,
            };
        });
    const order: Record<EdgeSessionPhase, number> = { live: 0, 'not-started': 1, ended: 2 };
    rows.sort((a, b) => order[a.phase] - order[b.phase] || startKey(a, b));
    const ended = rows.filter(r => r.phase === 'ended');
    const sessions = [...rows.filter(r => r.phase !== 'ended'), ...ended.slice(0, CONSOLE_ENDED_SHOWN)];

    const cloudState: CloudLinkState = cloud?.state ?? 'not-linked';
    const lagLines = cloud?.lagLines ?? 0;
    const linkState: TransmitterLinkState = tx?.link.state ?? 'not-set-up';
    const mode: TransmitterMode = tx?.settings?.mode ?? tx?.link.mode ?? 'listen';

    return {
        nowMs: input.nowMs,
        me: input.me ?? null,
        canChangeSettings: input.canChangeSettings === true,
        cases,
        box: {
            name: config.box.name,
            timeZone: config.box.timeZone,
            version: config.release.version,
            host: identity ? `${identity.slug}.${config.box.domain}` : null,
            enrolled: !!identity,
            problem: !identity ? 'Not enrolled yet: run "rt-edge enroll --code <code>" with a code from Admin › Venue boxes' : IDENTITY_PROBLEM[identity.status] ?? null,
        },
        cloud: {
            state: cloudState,
            ok: cloudState === 'synced' || cloudState === 'behind',
            label: cloudState === 'behind' && lagLines > 0 ? `${CLOUD_LABEL.behind} (${lagLines} line${lagLines === 1 ? '' : 's'} to go)` : CLOUD_LABEL[cloudState],
            lagLines,
            lastSyncedAtMs: cloud?.lastSyncedAtMs ?? null,
        },
        transmitter: {
            stateVersion: tx?.stateVersion ?? 0,
            mode,
            protocol: tx?.settings?.protocol ?? null,
            host: tx?.settings?.host ?? null,
            port: tx?.settings?.port ?? null,
            state: linkState,
            ok: linkState === 'live' || linkState === 'quiet',
            label: linkState === 'connecting' && tx?.link.attempt ? `${TX_LABEL.connecting} (try ${tx.link.attempt})` : TX_LABEL[linkState],
            peer: tx?.link.peer ?? null,
            lastLineAtMs: tx?.link.lastLineAtMs ?? null,
            bytesIn: tx?.link.bytesIn ?? 0,
            lockout: tx?.link.lockout ?? false,
            listen: {
                addresses: tx?.listen.boxTransmitterAddress ? [tx.listen.boxTransmitterAddress] : config.transmitter.bindAddress ? [config.transmitter.bindAddress] : [...input.addresses],
                port: tx?.listen.port || config.transmitter.listenPort,
            },
            canConnect: tx?.actions.connect ?? false,
            canReconnect: tx?.actions.reconnect ?? false,
            cloud: input.cloudReporter ? cloudReporterNote(input.cloudReporter, input) : null,
        },
        sessions,
    };
}

/** Upcoming: soonest first; ended: latest first; unknown starts last. */
function startKey(a: ConsoleSessionRow, b: ConsoleSessionRow): number {
    const ta = a.startsAt ? Date.parse(a.startsAt) : NaN;
    const tb = b.startsAt ? Date.parse(b.startsAt) : NaN;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return a.name.localeCompare(b.name);
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return a.phase === 'ended' ? tb - ta : ta - tb;
}
