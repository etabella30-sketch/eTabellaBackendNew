/**
 * The box config file (token BOX_CONFIG): one JSON document, path from `--config <file.json>` or the
 * `RT_EDGE_CONFIG` environment variable. NEVER a `.env` file: the backend's env files can point at the production
 * database, and the box holds no database credentials at all (spec §3.3). `loadBoxConfig` refuses any path that is
 * not a `.json` file or whose name starts with `.env`.
 *
 * What lives here: static facts about this box and where things are on disk. What does NOT: the box identity
 * (`nEdgeid`, slug, key fingerprint, enrolment status: `StatePort.identity`, written by `rt-edge enroll`), session
 * data, codes, tokens or any secret. The edge build reads the identity at runtime from `/edge-config.json` (D8),
 * which the LAN layer builds from this config + `StatePort.identity`.
 *
 * Every relative path is resolved against the config file's directory. The parsed object is deep-frozen.
 *
 * Example (box image, production):
 * ```json
 * { "mode": "production",
 *   "box": { "name": "Court 3", "label": "VB-014", "timeZone": "Europe/London", "roomWifiSsid": "Court3-Transcript" },
 *   "cloud": { "origin": "https://etabella.net" },
 *   "http": { "port": 443 },
 *   "transmitter": { "bindAddress": "192.168.20.2", "networkCidr": "192.168.20.0/24" },
 *   "paths": { "dataDir": "/var/lib/etabella-edge", "publicDir": "/app/public" },
 *   "release": { "version": "1.0.3", "backendCommit": "abc1234", "feCommit": "def5678" } }
 * ```
 * Dev (plain HTTP): `{ "mode": "dev", "box": {...}, "cloud": {...}, "http": { "port": 8080, "tls": null },
 * "paths": { "dataDir": "./data" } }`.
 */
import * as fs from 'fs';
import * as path from 'path';

import { EdgeFeatureFlags, isIpv4, TRANSMITTER_LISTEN_PORT } from '../contracts';
import { isTimeZone } from './time';

/** `production`: TLS is mandatory and cloud URLs must be https. `dev`: plain HTTP allowed (`http.tls: null`). */
export type BoxEnvironment = 'production' | 'dev';

export const BOX_CONFIG_ENV = 'RT_EDGE_CONFIG';
/** Default port of the localhost box console (`console.port`). */
export const BOX_CONSOLE_DEFAULT_PORT = 2601;
export const BOX_CONFIG_FLAG = '--config';

/**
 * The shutdown budget (app.module.ts): five steps one after another (lan, ops, uplink, kernel — journals flushed, the
 * final checkpoint and rev floor — and state), each bounded by `shutdownTimeoutMs`, after a service start in flight
 * finished its current step (EDGE_START_STEP_BUDGET_MS, 10 s). All of it must end before the container's
 * `stop_grace_period` (docker/edge/docker-compose.yml, 120 s) turns SIGTERM into SIGKILL, with room left to exit.
 */
export const EDGE_STOP_GRACE_MS = 120_000;
export const EDGE_SHUTDOWN_STEPS = 5;
/** Kept free inside the stop grace: a start step in flight (10 s) and the process exit (10 s). */
export const EDGE_SHUTDOWN_RESERVE_MS = 20_000;
/** Largest `shutdownTimeoutMs`: 5 × 20 000 ms + 20 000 ms reserve = the 120 s stop grace. Also the default. */
export const EDGE_SHUTDOWN_STEP_MAX_MS = Math.floor((EDGE_STOP_GRACE_MS - EDGE_SHUTDOWN_RESERVE_MS) / EDGE_SHUTDOWN_STEPS);

/**
 * v1 feature defaults (CONTRACTS.md §5.1). Room codes and the operator code are OFF by default (build decision
 * 2026-10-01 "email sign-in only for v1"): their code stays, switched off; a box config may turn them on.
 */
export const DEFAULT_EDGE_FEATURES: Readonly<EdgeFeatureFlags> = Object.freeze({
    roomCodes: false,
    operatorCode: false,
    transmitterDialMode: true,
    offlineMarks: false,
    reporterPasswordOnBox: false,
    documentsOnBox: false,
});

/**
 * Where the LAN certificate lives. The config names the PATHS only; the files are written by the uplink
 * (`UplinkPort.ensureCertificate`, spec §8.3) and may not exist yet — a freshly enrolled box has none. Missing,
 * unreadable or invalid files are a runtime state (the box records and links, and the HTTPS listener binds once a
 * loadable pair is there, ports/certificate.ts), never a config error.
 */
export interface BoxTlsConfig {
    /** PEM certificate chain of `<slug>.<domain>`, leaf first (fetched from the cloud, spec §8.3). */
    readonly certFile: string;
    /** PEM private key; generated on the box, never leaves it. */
    readonly keyFile: string;
    /** Optional extra CA bundle; null when absent. */
    readonly caFile: string | null;
    /**
     * How often the files are polled: for a change once the listener serves them (hot reload, spec §3.4), and for a
     * loadable pair while it waits for one.
     */
    readonly reloadPollMs: number;
}

export interface BoxConfig {
    /** Absolute path the config was loaded from. */
    readonly configPath: string;
    readonly mode: BoxEnvironment;
    readonly box: {
        /** Short room name used in sentences ("Venue box · Court 3"): `EdgeConfig.boxName`. */
        readonly name: string;
        /** Brand-panel line: `EdgeConfig.venueLabel`. Default `Live transcript · <name>`. */
        readonly venueLabel: string;
        /** Label printed on the box ("VB-014"): `BoxDetailsResponse.boxLabel`, diagnostics file name. Default `name`. */
        readonly label: string;
        /** Room Wi-Fi name for the wrong-network message (DR14); null when unknown. */
        readonly roomWifiSsid: string | null;
        /** IANA zone of the venue; every box-local day and HH:MM uses it. */
        readonly timeZone: string;
        /** Box hostnames are `<slug>.<domain>` (S-D3). Default `etabella-edge.net`. */
        readonly domain: string;
        /**
         * Who may open Box settings (status, transmitter, logs) besides an operator-code session: `super-admin`
         * (default: super-admins only) or `case-admin` (also a case admin of a case on this box, the D34 rule).
         */
        readonly settingsAccess: 'super-admin' | 'case-admin';
        /**
         * How people sign in on the box page: `cloud` (default: the email here, the password on etabella.net, then
         * back) or `password` (email and password typed on the box page, as the legacy RT local did; the box hands
         * them to etabella.net itself, lan/cloud-signin.ts, and never stores them).
         */
        readonly signIn: 'cloud' | 'password';
    };
    readonly cloud: {
        /** `https://etabella.net` (origin only, no trailing slash). */
        readonly origin: string;
        /** socket.io-client URL of the uplink (spec §5.3). Default `origin`. */
        readonly uplinkUrl: string;
        /** Default `/edge`. */
        readonly uplinkNamespace: string;
        /** Default `/socket.io`. */
        readonly uplinkPath: string;
        /** Base of the cloud realtime API (challenge, enrol, the LAN `/realtimeapi` proxy). Default `<origin>/realtimeapi`. */
        readonly realtimeApiUrl: string;
        /** `EdgePkceClient.authorizeUrl`. Default `<origin>/auth/edge`. */
        readonly authorizeUrl: string;
        /** `EdgePkceClient.tokenUrl`. Default `<origin>/authapi/edge/token`. */
        readonly tokenUrl: string;
        /** `EdgePkceClient.refreshUrl`. Default `<origin>/authapi/edge/refresh`. */
        readonly refreshUrl: string;
        /** Password mode (`box.signIn: 'password'`): where the box hands the email and password. Default `<origin>/authapi/edge/password`. */
        readonly passwordUrl: string;
        /**
         * The sign-in service's public edge-token keys (authapi `GET edge/jwks`). The box reads them here when the
         * cloud's hello carries none (uplink `fetchTokenKeys`). Default `<origin>/authapi/edge/jwks`. Optional in the
         * type only so hand-built fixtures stay valid (the uplink then derives it from `tokenUrl`); the parser always
         * sets it.
         */
        readonly jwksUrl?: string;
        /** `EdgeConfig.cloudPingUrl` (device reachability probe, DR5). Default `<origin>/favicon.ico`. */
        readonly pingUrl: string;
    };
    readonly http: {
        /** Bind address of the HTTPS server (hearing network). Default `0.0.0.0`. */
        readonly host: string;
        /** Default 443. 0 = any free port (tests). */
        readonly port: number;
        /** Null = plain HTTP (dev only). Production default: `<certDir>/fullchain.pem` + `<certDir>/privkey.pem`. */
        readonly tls: BoxTlsConfig | null;
    };
    readonly transmitter: {
        /** Listen-mode port for Eclipse "Connect to server" (D34). Default 2500. */
        readonly listenPort: number;
        /**
         * The box's IPv4 on the transmitter (CAT) network: listener bind address and "Server address" on the
         * reporter card. REQUIRED in production (spec §3.2 "binds only to the CAT network", S-D14), must lie inside
         * `networkCidr` and may not be 0.0.0.0. Null = all interfaces, dev only.
         */
        readonly bindAddress: string | null;
        /**
         * IPv4 CIDR of the CAT network; dial mode refuses a transmitter host outside it (S-D14: a dialed transmitter
         * is trusted by network position and has no login, §11). REQUIRED in production, prefix /8 or longer.
         * Null = no check, dev only.
         */
        readonly networkCidr: string | null;
    };
    readonly paths: {
        /** Default `/var/lib/etabella-edge` (spec §3.4 volume). */
        readonly dataDir: string;
        /** node:sqlite WAL database. Default `<dataDir>/edge.sqlite`. */
        readonly stateDb: string;
        /** Raw journals, `<journalDir>/<nSesid>/seg-*.ej`. Default `<dataDir>/journal`. */
        readonly journalDir: string;
        /** Held captures (orphan kind 'C'). Default `<dataDir>/capture`. */
        readonly captureDir: string;
        /** TLS key + certificate. Default `<dataDir>/certs`. */
        readonly certDir: string;
        /** Device signing key (pilot: TPM-sealed software key, D2). Default `<dataDir>/device-key.pem`. */
        readonly deviceKeyFile: string;
        /** The FE `edge` bundle served at `/` (D23). Default `/app/public`. */
        readonly publicDir: string;
    };
    readonly features: Readonly<EdgeFeatureFlags>;
    /**
     * The box console: a plain-HTTP page on THIS machine only (always bound to 127.0.0.1, no sign-in), where whoever
     * sits at the box sees the sessions sent from etabella.net and sets up the reporter connection. `port` 0 = off,
     * default `BOX_CONSOLE_DEFAULT_PORT`. Optional in the type only so hand-built fixtures stay valid (absent = off
     * there); the parser always sets it.
     */
    readonly console?: { readonly port: number };
    readonly release: {
        /** rt-edge release ("1.0.3"). Default `0.0.0-dev`. */
        readonly version: string;
        /** Release manifest commits (D6); null when unknown. */
        readonly backendCommit: string | null;
        readonly feCommit: string | null;
    };
    /**
     * Upper bound for each shutdown step (LAN, ops, uplink, kernel, state). Default and maximum 20 000
     * (`EDGE_SHUTDOWN_STEP_MAX_MS`: the five steps must end inside the container's 120 s stop grace period).
     */
    readonly shutdownTimeoutMs: number;
}

export class BoxConfigError extends Error {
    constructor(readonly problems: readonly string[], readonly configPath: string | null = null) {
        super(`rt-edge: box config${configPath ? ` ${configPath}` : ''} is invalid: ${problems.join('; ')}`);
        this.name = 'BoxConfigError';
    }
}

/**
 * The config file path: `--config <path>` / `--config=<path>` wins over `RT_EDGE_CONFIG`. There is no default
 * path; neither given → BoxConfigError.
 */
export function resolveConfigPath(argv: readonly string[], env: Readonly<Record<string, string | undefined>>): string {
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === BOX_CONFIG_FLAG) {
            const value = argv[i + 1];
            if (!value || value.startsWith('--')) throw new BoxConfigError([`${BOX_CONFIG_FLAG} needs a file path`]);
            return value;
        }
        if (arg.startsWith(`${BOX_CONFIG_FLAG}=`)) {
            const value = arg.slice(BOX_CONFIG_FLAG.length + 1);
            if (!value) throw new BoxConfigError([`${BOX_CONFIG_FLAG} needs a file path`]);
            return value;
        }
    }
    const fromEnv = env[BOX_CONFIG_ENV];
    if (fromEnv && fromEnv.trim()) return fromEnv.trim();
    throw new BoxConfigError([`no box config: pass ${BOX_CONFIG_FLAG} <file.json> or set ${BOX_CONFIG_ENV}`]);
}

/** Read, parse and validate a box config file. Refuses `.env*` files and anything that is not `.json`. */
export function loadBoxConfig(file: string, readFile: (p: string) => string = p => fs.readFileSync(p, 'utf8')): BoxConfig {
    const abs = path.resolve(file);
    const base = path.basename(abs).toLowerCase();
    if (base.startsWith('.env')) throw new BoxConfigError(['refusing a .env file: the box config is a JSON file'], abs);
    if (path.extname(base) !== '.json') throw new BoxConfigError(['the box config must be a .json file'], abs);
    let text: string;
    try {
        text = readFile(abs);
    } catch (err) {
        throw new BoxConfigError([`cannot read the file (${(err as NodeJS.ErrnoException)?.code ?? String(err)})`], abs);
    }
    let raw: unknown;
    try {
        raw = JSON.parse(text.replace(/^﻿/, ''));
    } catch (err) {
        throw new BoxConfigError([`not valid JSON (${(err as Error).message})`], abs);
    }
    return parseBoxConfig(raw, abs);
}

type Raw = Record<string, unknown>;

const TOP_KEYS = ['$schema', '$comment', 'mode', 'box', 'cloud', 'http', 'transmitter', 'paths', 'features', 'console', 'release', 'shutdownTimeoutMs'];
const DNS_NAME_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/**
 * Validate a parsed config object and apply the defaults. `configPath` anchors relative paths. Collects every
 * problem and throws one BoxConfigError listing them all.
 */
export function parseBoxConfig(raw: unknown, configPath: string): BoxConfig {
    const problems: string[] = [];
    const absConfig = path.resolve(configPath);
    const baseDir = path.dirname(absConfig);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new BoxConfigError(['the config must be a JSON object'], absConfig);
    const top = raw as Raw;
    unknownKeys(top, TOP_KEYS, '', problems);

    const mode = top['mode'] === undefined ? 'production' : top['mode'];
    if (mode !== 'production' && mode !== 'dev') problems.push(`mode must be "production" or "dev"`);
    const env: BoxEnvironment = mode === 'dev' ? 'dev' : 'production';

    // box
    const boxRaw = section(top, 'box', ['name', 'venueLabel', 'label', 'roomWifiSsid', 'timeZone', 'domain', 'settingsAccess', 'signIn'], problems);
    const name = text(boxRaw, 'box.name', 'name', problems, { required: true, max: 80 });
    const timeZone = text(boxRaw, 'box.timeZone', 'timeZone', problems, { required: true });
    if (timeZone && !isTimeZone(timeZone)) problems.push(`box.timeZone "${timeZone}" is not an IANA time zone`);
    const domain = (text(boxRaw, 'box.domain', 'domain', problems, {}) ?? 'etabella-edge.net').toLowerCase();
    if (!DNS_NAME_RE.test(domain)) problems.push('box.domain must be a DNS name');
    const settingsAccess = text(boxRaw, 'box.settingsAccess', 'settingsAccess', problems, {}) ?? 'super-admin';
    if (settingsAccess !== 'super-admin' && settingsAccess !== 'case-admin') problems.push('box.settingsAccess must be "super-admin" or "case-admin"');
    const signIn = text(boxRaw, 'box.signIn', 'signIn', problems, {}) ?? 'cloud';
    if (signIn !== 'cloud' && signIn !== 'password') problems.push('box.signIn must be "cloud" or "password"');
    const box = {
        name: name ?? '',
        venueLabel: text(boxRaw, 'box.venueLabel', 'venueLabel', problems, { max: 120 }) ?? `Live transcript · ${name ?? ''}`,
        label: text(boxRaw, 'box.label', 'label', problems, { max: 40 }) ?? name ?? '',
        roomWifiSsid: nullableText(boxRaw, 'box.roomWifiSsid', 'roomWifiSsid', problems),
        timeZone: timeZone ?? '',
        domain,
        settingsAccess: settingsAccess === 'case-admin' ? ('case-admin' as const) : ('super-admin' as const),
        signIn: signIn === 'password' ? ('password' as const) : ('cloud' as const),
    };

    // cloud
    const cloudRaw = section(top, 'cloud', ['origin', 'uplinkUrl', 'uplinkNamespace', 'uplinkPath', 'realtimeApiUrl', 'authorizeUrl', 'tokenUrl', 'refreshUrl', 'passwordUrl', 'jwksUrl', 'pingUrl'], problems);
    const originText = text(cloudRaw, 'cloud.origin', 'origin', problems, { required: true });
    const origin = originText ? urlOrigin(originText, 'cloud.origin', env, problems) : '';
    const cloudUrl = (key: string, def: string): string => {
        const value = text(cloudRaw, `cloud.${key}`, key, problems, {});
        if (value === null) return def;
        return absoluteUrl(value, `cloud.${key}`, env, problems) ?? def;
    };
    const nsp = (key: string, def: string): string => {
        const value = text(cloudRaw, `cloud.${key}`, key, problems, {}) ?? def;
        if (!value.startsWith('/')) problems.push(`cloud.${key} must start with "/"`);
        return value;
    };
    const cloud = {
        origin,
        uplinkUrl: cloudUrl('uplinkUrl', origin),
        uplinkNamespace: nsp('uplinkNamespace', '/edge'),
        uplinkPath: nsp('uplinkPath', '/socket.io'),
        realtimeApiUrl: cloudUrl('realtimeApiUrl', `${origin}/realtimeapi`),
        authorizeUrl: cloudUrl('authorizeUrl', `${origin}/auth/edge`),
        tokenUrl: cloudUrl('tokenUrl', `${origin}/authapi/edge/token`),
        refreshUrl: cloudUrl('refreshUrl', `${origin}/authapi/edge/refresh`),
        passwordUrl: cloudUrl('passwordUrl', `${origin}/authapi/edge/password`),
        jwksUrl: cloudUrl('jwksUrl', `${origin}/authapi/edge/jwks`),
        pingUrl: cloudUrl('pingUrl', `${origin}/favicon.ico`),
    };

    // paths (before http: the TLS defaults live in certDir)
    const pathsRaw = section(top, 'paths', ['dataDir', 'stateDb', 'journalDir', 'captureDir', 'certDir', 'deviceKeyFile', 'publicDir'], problems);
    const p = (key: string, def: string): string => path.resolve(baseDir, text(pathsRaw, `paths.${key}`, key, problems, {}) ?? def);
    const dataDir = p('dataDir', '/var/lib/etabella-edge');
    const certDir = p('certDir', path.join(dataDir, 'certs'));
    const paths = {
        dataDir,
        stateDb: p('stateDb', path.join(dataDir, 'edge.sqlite')),
        journalDir: p('journalDir', path.join(dataDir, 'journal')),
        captureDir: p('captureDir', path.join(dataDir, 'capture')),
        certDir,
        deviceKeyFile: p('deviceKeyFile', path.join(dataDir, 'device-key.pem')),
        publicDir: p('publicDir', '/app/public'),
    };

    // http
    const httpRaw = section(top, 'http', ['host', 'port', 'tls'], problems);
    const host = text(httpRaw, 'http.host', 'host', problems, {}) ?? '0.0.0.0';
    const port = int(httpRaw, 'http.port', 'port', problems, { def: 443, min: 0, max: 65535 });
    let tls: BoxTlsConfig | null;
    if (!('tls' in httpRaw) || httpRaw['tls'] === undefined) {
        tls = env === 'dev' ? null : { certFile: path.join(certDir, 'fullchain.pem'), keyFile: path.join(certDir, 'privkey.pem'), caFile: null, reloadPollMs: 30_000 };
    } else if (httpRaw['tls'] === null) {
        if (env !== 'dev') problems.push('http.tls: null (plain HTTP) is allowed only in dev mode');
        tls = null;
    } else {
        const tlsRaw = section(httpRaw, 'tls', ['certFile', 'keyFile', 'caFile', 'reloadPollMs'], problems, 'http.tls');
        const certFile = text(tlsRaw, 'http.tls.certFile', 'certFile', problems, { required: true });
        const keyFile = text(tlsRaw, 'http.tls.keyFile', 'keyFile', problems, { required: true });
        const caFile = nullableText(tlsRaw, 'http.tls.caFile', 'caFile', problems);
        tls = {
            certFile: certFile ? path.resolve(baseDir, certFile) : '',
            keyFile: keyFile ? path.resolve(baseDir, keyFile) : '',
            caFile: caFile ? path.resolve(baseDir, caFile) : null,
            reloadPollMs: int(tlsRaw, 'http.tls.reloadPollMs', 'reloadPollMs', problems, { def: 30_000, min: 10, max: 3_600_000 }),
        };
    }

    // transmitter
    const txRaw = section(top, 'transmitter', ['listenPort', 'bindAddress', 'networkCidr'], problems);
    const absent = (key: string): boolean => txRaw[key] === undefined || txRaw[key] === null;
    const bindAddress = nullableText(txRaw, 'transmitter.bindAddress', 'bindAddress', problems);
    const bindOk = bindAddress !== null && isIpv4(bindAddress);
    if (bindAddress !== null && !bindOk) problems.push('transmitter.bindAddress must be an IPv4 address');
    const networkCidr = nullableText(txRaw, 'transmitter.networkCidr', 'networkCidr', problems);
    const cidrOk = networkCidr !== null && isIpv4Cidr(networkCidr);
    if (networkCidr !== null && !cidrOk) problems.push('transmitter.networkCidr must be an IPv4 CIDR like 192.168.20.0/24');
    // S-D14 / §3.2 / §11: the CAT listener binds only to the transmitter network and dial mode reaches only it.
    if (env === 'production') {
        if (absent('bindAddress')) problems.push('transmitter.bindAddress is required in production (the CAT listener binds only to the transmitter network)');
        if (absent('networkCidr')) problems.push('transmitter.networkCidr is required in production (dial mode reaches only the transmitter network)');
        if (bindOk && bindAddress!.trim() === '0.0.0.0') problems.push('transmitter.bindAddress must be the box address on the transmitter network, not 0.0.0.0');
        if (cidrOk && Number(networkCidr!.split('/')[1]) < 8) problems.push('transmitter.networkCidr is too wide for the transmitter network (use /8 or longer)');
    }
    if (bindOk && cidrOk && !ipv4InCidr(bindAddress!, networkCidr!)) problems.push('transmitter.bindAddress must lie inside transmitter.networkCidr');
    const transmitter = {
        listenPort: int(txRaw, 'transmitter.listenPort', 'listenPort', problems, { def: TRANSMITTER_LISTEN_PORT, min: 0, max: 65535 }),
        bindAddress,
        networkCidr,
    };

    // features
    const featuresRaw = section(top, 'features', Object.keys(DEFAULT_EDGE_FEATURES), problems);
    const features = { ...DEFAULT_EDGE_FEATURES } as Record<keyof EdgeFeatureFlags, boolean>;
    for (const key of Object.keys(DEFAULT_EDGE_FEATURES) as Array<keyof EdgeFeatureFlags>) {
        if (featuresRaw[key] === undefined) continue;
        if (typeof featuresRaw[key] !== 'boolean') problems.push(`features.${key} must be true or false`);
        else features[key] = featuresRaw[key] as boolean;
    }

    // console (localhost only; 0 = off)
    const consoleRaw = section(top, 'console', ['port'], problems);
    const consolePort = int(consoleRaw, 'console.port', 'port', problems, { def: BOX_CONSOLE_DEFAULT_PORT, min: 0, max: 65535 });

    // release
    const releaseRaw = section(top, 'release', ['version', 'backendCommit', 'feCommit'], problems);
    const release = {
        version: text(releaseRaw, 'release.version', 'version', problems, { max: 40 }) ?? '0.0.0-dev',
        backendCommit: nullableText(releaseRaw, 'release.backendCommit', 'backendCommit', problems),
        feCommit: nullableText(releaseRaw, 'release.feCommit', 'feCommit', problems),
    };

    const shutdownTimeoutMs = int(top, 'shutdownTimeoutMs', 'shutdownTimeoutMs', problems, {
        def: EDGE_SHUTDOWN_STEP_MAX_MS,
        min: 1,
        max: EDGE_SHUTDOWN_STEP_MAX_MS,
        why: `the ${EDGE_SHUTDOWN_STEPS} shutdown steps run one after another and must end inside the container's ${EDGE_STOP_GRACE_MS / 1000} s stop_grace_period`,
    });

    if (problems.length) throw new BoxConfigError(problems, absConfig);
    return deepFreeze<BoxConfig>({
        configPath: absConfig,
        mode: env,
        box,
        cloud,
        http: { host, port, tls },
        transmitter,
        paths,
        features,
        console: { port: consolePort },
        release,
        shutdownTimeoutMs,
    });
}

/** True for `a.b.c.d/n` with a valid IPv4 and 0 ≤ n ≤ 32. */
export function isIpv4Cidr(value: string): boolean {
    const m = /^([^/]+)\/(\d{1,2})$/.exec(String(value ?? '').trim());
    return !!m && isIpv4(m[1]) && Number(m[2]) <= 32;
}

/** True when IPv4 `ip` lies inside `cidr` (S-D14 dial-mode host check). False for malformed input. */
export function ipv4InCidr(ip: string, cidr: string): boolean {
    if (!isIpv4(ip) || !isIpv4Cidr(cidr)) return false;
    const [net, bitsText] = cidr.trim().split('/');
    const bits = Number(bitsText);
    const toInt = (a: string): number => a.trim().split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return ((toInt(ip) & mask) >>> 0) === ((toInt(net) & mask) >>> 0);
}

function unknownKeys(obj: Raw, allowed: readonly string[], prefix: string, problems: string[]): void {
    for (const key of Object.keys(obj)) {
        if (!allowed.includes(key)) problems.push(`unknown key ${prefix}${key}`);
    }
}

function section(parent: Raw, key: string, allowed: readonly string[], problems: string[], label = key): Raw {
    const value = parent[key];
    if (value === undefined || value === null) return {};
    if (typeof value !== 'object' || Array.isArray(value)) {
        problems.push(`${label} must be an object`);
        return {};
    }
    unknownKeys(value as Raw, allowed, `${label}.`, problems);
    return value as Raw;
}

function text(obj: Raw, label: string, key: string, problems: string[], opts: { required?: boolean; max?: number }): string | null {
    const value = obj[key];
    if (value === undefined || value === null) {
        if (opts.required) problems.push(`${label} is required`);
        return null;
    }
    if (typeof value !== 'string' || value.trim() === '') {
        problems.push(`${label} must be a non-empty string`);
        return null;
    }
    if (opts.max && value.trim().length > opts.max) problems.push(`${label} must be at most ${opts.max} characters`);
    return value.trim();
}

function nullableText(obj: Raw, label: string, key: string, problems: string[]): string | null {
    if (obj[key] === undefined || obj[key] === null) return null;
    return text(obj, label, key, problems, {});
}

function int(obj: Raw, label: string, key: string, problems: string[], opts: { def: number; min: number; max: number; why?: string }): number {
    const value = obj[key];
    if (value === undefined || value === null) return opts.def;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < opts.min || value > opts.max) {
        problems.push(`${label} must be an integer ${opts.min}-${opts.max}${opts.why ? ` (${opts.why})` : ''}`);
        return opts.def;
    }
    return value;
}

function urlOrigin(value: string, label: string, env: BoxEnvironment, problems: string[]): string {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        problems.push(`${label} must be an absolute URL`);
        return '';
    }
    if (!checkScheme(url, label, env, problems, env === 'dev' ? ['https:', 'http:'] : ['https:'])) return '';
    if ((url.pathname && url.pathname !== '/') || url.search || url.hash) problems.push(`${label} must be an origin (no path, query or fragment)`);
    return url.origin;
}

function absoluteUrl(value: string, label: string, env: BoxEnvironment, problems: string[]): string | null {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        problems.push(`${label} must be an absolute URL`);
        return null;
    }
    if (!checkScheme(url, label, env, problems)) return null;
    return value.replace(/\/+$/, '');
}

function checkScheme(
    url: URL,
    label: string,
    env: BoxEnvironment,
    problems: string[],
    allowed: readonly string[] = env === 'dev' ? ['https:', 'http:', 'wss:', 'ws:'] : ['https:', 'wss:'],
): boolean {
    if (!allowed.includes(url.protocol)) {
        problems.push(`${label} must use ${allowed.map(s => s.slice(0, -1)).join(' or ')}`);
        return false;
    }
    if (url.username || url.password) {
        problems.push(`${label} must not carry credentials`);
        return false;
    }
    return true;
}

function deepFreeze<T>(value: T): T {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const key of Object.keys(value as Raw)) deepFreeze((value as Raw)[key]);
    }
    return value;
}
