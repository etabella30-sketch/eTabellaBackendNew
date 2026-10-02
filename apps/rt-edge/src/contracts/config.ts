/**
 * Runtime box identity and reachability: `GET /edge-config.json` (D8) and `GET /edge/ping` (DR5, O-16).
 */

/**
 * Per-box feature switches. Static build flags stay in `environment.edge.ts` (D8); these are the ones that can
 * differ between boxes or flip without a new FE bundle.
 */
export interface EdgeFeatureFlags {
    /** One-time room codes on the login screen and in Box settings (D33, DR10). v1: true. */
    readonly roomCodes: boolean;
    /** "Operator? Use today's operator code" (DR7). v1: true. */
    readonly operatorCode: boolean;
    /** "Box connects to transmitter" mode in Transmitter settings (D34). v1: true. */
    readonly transmitterDialMode: boolean;
    /** Offline Quick Marks / QFacts (S-D6, Phase 4). v1: false, so DR9 uses "Marking is paused …". */
    readonly offlineMarks: boolean;
    /** "Show to reporter" may show the Eclipse password (O-12, ask user). v1: false. */
    readonly reporterPasswordOnBox: boolean;
    /** Documents served from the box (Phase 5). v1: false, so the dock links to etabella.net (S-D19). */
    readonly documentsOnBox: boolean;
}

/** What the box page needs for the etabella.net PKCE sign-in (spec §8.4). */
export interface EdgePkceClient {
    /** etabella.net page that signs the person in and returns a one-time code: `https://etabella.net/auth/edge`. */
    readonly authorizeUrl: string;
    /** authapi code exchange, called by the box page directly: `https://etabella.net/authapi/edge/token`. */
    readonly tokenUrl: string;
    /** authapi renewal, called by the box page directly: `https://etabella.net/authapi/edge/refresh`. */
    readonly refreshUrl: string;
    /** Box page the authorize page returns to (the cloud derives the full URL from the box slug, never the query). */
    readonly callbackPath: '/auth/callback';
    readonly codeChallengeMethod: 'S256';
    /** `aud` of this box's edge tokens: `edge:<nEdgeid>`. */
    readonly audience: string;
}

/**
 * `GET /edge-config.json` — served by the box, no token, `Cache-Control: no-store`. The edge build loads it in an
 * APP_INITIALIZER before bootstrap; missing or unreadable (see `isEdgeConfig`) → "Box not configured" (§10 #22).
 * No `msg` field: it is a config document, not an API reply.
 */
export interface EdgeConfig {
    /** `EDGE_CONTRACT_VERSION` of the box software. */
    readonly contractVersion: string;
    readonly nEdgeid: string;
    /** Short room name used in sentences: "Venue box · Court 3", "assigns them to Court 3". */
    readonly boxName: string;
    /** Brand-panel line: "Live transcript · Court 3". */
    readonly venueLabel: string;
    /** The trusted hostname printed on the table card (DR14), e.g. `k7q2m9x4.etabella-edge.net`. */
    readonly boxHost: string;
    /** The room Wi-Fi name for the wrong-network message ("Make sure you're on the … Wi-Fi"); null if unknown. */
    readonly roomWifiSsid: string | null;
    /** IANA zone of the venue; every HH:MM on the box screens is formatted in it. */
    readonly timeZone: string;
    /** `https://etabella.net`. Links out ("Open on etabella.net", Part 2) are built on it. */
    readonly cloudOrigin: string;
    /**
     * Device → etabella.net reachability probe (DR5, O-16): the login page fetches it with
     * `{mode:'no-cors', cache:'no-store'}` and `EDGE_TIMING.pingTimeoutMs`; a resolved fetch means reachable.
     */
    readonly cloudPingUrl: string;
    readonly pkce: EdgePkceClient;
    readonly features: EdgeFeatureFlags;
}

/** True when `value` has every field an `EdgeConfig` needs (the APP_INITIALIZER's "configured" test). */
export function isEdgeConfig(value: unknown): value is EdgeConfig {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    const str = (key: string): boolean => typeof v[key] === 'string' && (v[key] as string).trim().length > 0;
    if (!['contractVersion', 'nEdgeid', 'boxName', 'venueLabel', 'boxHost', 'timeZone', 'cloudOrigin', 'cloudPingUrl'].every(str)) {
        return false;
    }
    if (v['roomWifiSsid'] !== null && typeof v['roomWifiSsid'] !== 'string') return false;
    const pkce = v['pkce'] as Record<string, unknown> | null | undefined;
    if (!pkce || typeof pkce !== 'object') return false;
    if (!['authorizeUrl', 'tokenUrl', 'refreshUrl', 'audience'].every(k => typeof pkce[k] === 'string' && (pkce[k] as string).length > 0)) {
        return false;
    }
    if (pkce['callbackPath'] !== '/auth/callback' || pkce['codeChallengeMethod'] !== 'S256') return false;
    const features = v['features'] as Record<string, unknown> | null | undefined;
    if (!features || typeof features !== 'object') return false;
    return ['roomCodes', 'operatorCode', 'transmitterDialMode', 'offlineMarks', 'reporterPasswordOnBox', 'documentsOnBox']
        .every(k => typeof features[k] === 'boolean');
}

/** The box's own view of its internet (WAN) link, with the UI hysteresis of `EDGE_TIMING`. */
export type EdgeInternetState = 'up' | 'down' | 'unknown';

export interface EdgeInternetStatus {
    readonly state: EdgeInternetState;
    /** When the current state began ("Internet unavailable since 10:42"); null when unknown. */
    readonly sinceMs: number | null;
}

/**
 * `GET /edge/ping` — no token, `Cache-Control: no-store`. Device → box reachability, box clock, and the box's
 * internet state, so the login page can tell "your device can't reach etabella.net" (box online, device on room
 * Wi-Fi only) from "Internet unavailable since 10:42" (box offline too) (DR5, DR14, O-16). A failed or slow ping,
 * or an `nEdgeid` that differs from the loaded config, is the VPN / wrong-network signal.
 */
export interface EdgePingResponse {
    readonly msg: 1;
    readonly nEdgeid: string;
    /** Box clock (chrony-disciplined); the FE may use it to correct countdowns. */
    readonly nowMs: number;
    readonly timeZone: string;
    readonly internet: EdgeInternetStatus;
    /** The box holds a confirmed device identity with the cloud (enrolled, not revoked or quarantined). */
    readonly cloudLinked: boolean;
}
