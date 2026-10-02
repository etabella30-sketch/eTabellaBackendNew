import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { EDGE_START_STEP_BUDGET_MS } from './boot';
import {
    BoxConfigError,
    EDGE_SHUTDOWN_RESERVE_MS,
    EDGE_SHUTDOWN_STEP_MAX_MS,
    EDGE_SHUTDOWN_STEPS,
    EDGE_STOP_GRACE_MS,
    ipv4InCidr,
    isIpv4Cidr,
    loadBoxConfig,
    parseBoxConfig,
    resolveConfigPath,
} from './box-config';

const CONFIG_PATH = path.join(os.tmpdir(), 'rt-edge-cfg', 'box', 'rt-edge.json');
const BASE = path.dirname(CONFIG_PATH);

/** `.invalid` never resolves (RFC 2606); the parser never connects anyway. */
const CLOUD = 'https://cloud.invalid';
const TX = { bindAddress: '192.168.20.2', networkCidr: '192.168.20.0/24' };

const minimal = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    box: { name: 'Court 3', timeZone: 'Europe/London' },
    cloud: { origin: CLOUD },
    transmitter: TX,
    ...extra,
});

function problemsOf(raw: unknown, file = CONFIG_PATH): string[] {
    try {
        parseBoxConfig(raw, file);
    } catch (err) {
        expect(err).toBeInstanceOf(BoxConfigError);
        return [...(err as BoxConfigError).problems];
    }
    throw new Error('expected BoxConfigError');
}

describe('box config', () => {
    describe('parseBoxConfig defaults (production)', () => {
        const config = parseBoxConfig(minimal(), CONFIG_PATH);

        it('is production with derived cloud URLs', () => {
            expect(config.mode).toBe('production');
            expect(config.configPath).toBe(path.resolve(CONFIG_PATH));
            expect(config.cloud).toEqual({
                origin: CLOUD,
                uplinkUrl: CLOUD,
                uplinkNamespace: '/edge',
                uplinkPath: '/socket.io',
                realtimeApiUrl: `${CLOUD}/realtimeapi`,
                authorizeUrl: `${CLOUD}/auth/edge`,
                tokenUrl: `${CLOUD}/authapi/edge/token`,
                refreshUrl: `${CLOUD}/authapi/edge/refresh`,
                pingUrl: `${CLOUD}/favicon.ico`,
            });
        });

        it('fills the box section', () => {
            expect(config.box).toEqual({
                name: 'Court 3',
                venueLabel: 'Live transcript · Court 3',
                label: 'Court 3',
                roomWifiSsid: null,
                timeZone: 'Europe/London',
                domain: 'etabella-edge.net',
            });
        });

        it('requires TLS with files under the cert dir by default', () => {
            const dataDir = path.resolve(BASE, '/var/lib/etabella-edge');
            expect(config.http).toEqual({
                host: '0.0.0.0',
                port: 443,
                tls: {
                    certFile: path.join(dataDir, 'certs', 'fullchain.pem'),
                    keyFile: path.join(dataDir, 'certs', 'privkey.pem'),
                    caFile: null,
                    reloadPollMs: 30_000,
                },
            });
        });

        it('lays out the data directory (spec §3.4 volume)', () => {
            const dataDir = path.resolve(BASE, '/var/lib/etabella-edge');
            expect(config.paths).toEqual({
                dataDir,
                stateDb: path.join(dataDir, 'edge.sqlite'),
                journalDir: path.join(dataDir, 'journal'),
                captureDir: path.join(dataDir, 'capture'),
                certDir: path.join(dataDir, 'certs'),
                deviceKeyFile: path.join(dataDir, 'device-key.pem'),
                publicDir: path.resolve(BASE, '/app/public'),
            });
        });

        it('uses the v1 transmitter, feature and release defaults', () => {
            expect(config.transmitter).toEqual({ listenPort: 2500, ...TX });
            // Build decision 2026-10-01 "email sign-in only for v1": room codes and the operator code ship switched off.
            expect(config.features).toEqual({
                roomCodes: false,
                operatorCode: false,
                transmitterDialMode: true,
                offlineMarks: false,
                reporterPasswordOnBox: false,
                documentsOnBox: false,
            });
            expect(config.release).toEqual({ version: '0.0.0-dev', backendCommit: null, feCommit: null });
            expect(config.shutdownTimeoutMs).toBe(20_000);
        });

        it('is deep-frozen', () => {
            expect(Object.isFrozen(config)).toBe(true);
            expect(Object.isFrozen(config.http.tls)).toBe(true);
            expect(Object.isFrozen(config.features)).toBe(true);
            expect(() => {
                (config.box as { name: string }).name = 'x';
            }).toThrow();
        });
    });

    describe('parseBoxConfig explicit values', () => {
        it('takes every documented field, resolving relative paths against the config file', () => {
            const config = parseBoxConfig(
                {
                    $comment: 'Court 3 box',
                    mode: 'production',
                    box: { name: ' Court 3 ', venueLabel: 'Live · C3', label: 'VB-014', roomWifiSsid: 'C3-Wifi', timeZone: 'Asia/Kolkata', domain: 'Staging-Edge.Example.net' },
                    cloud: { origin: 'https://staging.etabella.net/', uplinkUrl: 'wss://up.etabella.net/', pingUrl: 'https://staging.etabella.net/ping' },
                    http: { host: '10.0.0.5', port: 8443, tls: { certFile: 'certs/c.pem', keyFile: 'certs/k.pem', caFile: 'certs/ca.pem', reloadPollMs: 5000 } },
                    transmitter: { listenPort: 2600, bindAddress: '192.168.20.2', networkCidr: '192.168.20.0/24' },
                    paths: { dataDir: 'data', stateDb: 'db/edge.sqlite', publicDir: 'public' },
                    features: { offlineMarks: true, roomCodes: true },
                    release: { version: '1.0.3', backendCommit: 'abc1234', feCommit: 'def5678' },
                    shutdownTimeoutMs: 5000,
                },
                CONFIG_PATH,
            );
            expect(config.box).toEqual({ name: 'Court 3', venueLabel: 'Live · C3', label: 'VB-014', roomWifiSsid: 'C3-Wifi', timeZone: 'Asia/Kolkata', domain: 'staging-edge.example.net' });
            expect(config.cloud.origin).toBe('https://staging.etabella.net');
            expect(config.cloud.uplinkUrl).toBe('wss://up.etabella.net');
            expect(config.cloud.tokenUrl).toBe('https://staging.etabella.net/authapi/edge/token');
            expect(config.cloud.pingUrl).toBe('https://staging.etabella.net/ping');
            expect(config.http).toEqual({
                host: '10.0.0.5',
                port: 8443,
                tls: { certFile: path.join(BASE, 'certs', 'c.pem'), keyFile: path.join(BASE, 'certs', 'k.pem'), caFile: path.join(BASE, 'certs', 'ca.pem'), reloadPollMs: 5000 },
            });
            expect(config.transmitter).toEqual({ listenPort: 2600, bindAddress: '192.168.20.2', networkCidr: '192.168.20.0/24' });
            expect(config.paths.dataDir).toBe(path.join(BASE, 'data'));
            expect(config.paths.stateDb).toBe(path.join(BASE, 'db', 'edge.sqlite'));
            expect(config.paths.journalDir).toBe(path.join(BASE, 'data', 'journal'));
            expect(config.paths.publicDir).toBe(path.join(BASE, 'public'));
            expect(config.features.offlineMarks).toBe(true);
            expect(config.features.roomCodes).toBe(true);
            expect(config.release.version).toBe('1.0.3');
            expect(config.shutdownTimeoutMs).toBe(5000);
        });

        it('dev mode defaults to plain HTTP and accepts http cloud URLs', () => {
            const config = parseBoxConfig(minimal({ mode: 'dev', cloud: { origin: 'http://localhost:3000' } }), CONFIG_PATH);
            expect(config.mode).toBe('dev');
            expect(config.http.tls).toBeNull();
            expect(config.cloud.realtimeApiUrl).toBe('http://localhost:3000/realtimeapi');
        });

        it('dev mode may leave the transmitter network open (listener on every interface, no dial-host check)', () => {
            const config = parseBoxConfig(minimal({ mode: 'dev', transmitter: undefined }), CONFIG_PATH);
            expect(config.transmitter).toEqual({ listenPort: 2500, bindAddress: null, networkCidr: null });
        });

        it('dev mode may still configure TLS', () => {
            const config = parseBoxConfig(minimal({ mode: 'dev', http: { tls: { certFile: 'c.pem', keyFile: 'k.pem' } } }), CONFIG_PATH);
            expect(config.http.tls?.certFile).toBe(path.join(BASE, 'c.pem'));
            expect(config.http.tls?.caFile).toBeNull();
        });
    });

    describe('parseBoxConfig refusals (all problems at once)', () => {
        it('refuses a non-object', () => {
            expect(problemsOf(null)).toEqual(['the config must be a JSON object']);
            expect(problemsOf([])).toEqual(['the config must be a JSON object']);
        });

        it('requires the box name, time zone and cloud origin (and, in production, the transmitter network)', () => {
            expect(problemsOf({})).toEqual([
                'box.name is required',
                'box.timeZone is required',
                'cloud.origin is required',
                'transmitter.bindAddress is required in production (the CAT listener binds only to the transmitter network)',
                'transmitter.networkCidr is required in production (dial mode reaches only the transmitter network)',
            ]);
            expect(problemsOf({ mode: 'dev' })).toEqual(['box.name is required', 'box.timeZone is required', 'cloud.origin is required']);
        });

        it('pins the CAT listener and dial mode to the transmitter network in production (spec §3.2, S-D14, §11)', () => {
            const req = (key: string) => (key === 'bindAddress' ? 'transmitter.bindAddress is required in production (the CAT listener binds only to the transmitter network)' : 'transmitter.networkCidr is required in production (dial mode reaches only the transmitter network)');
            expect(problemsOf(minimal({ transmitter: undefined }))).toEqual([req('bindAddress'), req('networkCidr')]);
            expect(problemsOf(minimal({ transmitter: { networkCidr: '192.168.20.0/24' } }))).toEqual([req('bindAddress')]);
            expect(problemsOf(minimal({ transmitter: { bindAddress: '192.168.20.2', networkCidr: null } }))).toEqual([req('networkCidr')]);
            expect(problemsOf(minimal({ transmitter: { bindAddress: '0.0.0.0', networkCidr: '0.0.0.0/0' } }))).toEqual([
                'transmitter.bindAddress must be the box address on the transmitter network, not 0.0.0.0',
                'transmitter.networkCidr is too wide for the transmitter network (use /8 or longer)',
            ]);
            expect(problemsOf(minimal({ transmitter: { bindAddress: '192.168.20.2', networkCidr: '10.0.0.0/7' } }))).toEqual([
                'transmitter.networkCidr is too wide for the transmitter network (use /8 or longer)',
                'transmitter.bindAddress must lie inside transmitter.networkCidr',
            ]);
            expect(problemsOf(minimal({ transmitter: { bindAddress: '192.168.21.2', networkCidr: '192.168.20.0/24' } }))).toEqual([
                'transmitter.bindAddress must lie inside transmitter.networkCidr',
            ]);
            // A malformed value is reported once, not also as "required".
            expect(problemsOf(minimal({ transmitter: { bindAddress: '', networkCidr: '192.168.20.0/24' } }))).toEqual(['transmitter.bindAddress must be a non-empty string']);
            expect(parseBoxConfig(minimal({ transmitter: { bindAddress: '10.20.0.2', networkCidr: '10.0.0.0/8' } }), CONFIG_PATH).transmitter.networkCidr).toBe('10.0.0.0/8');
        });

        it('checks bindAddress against networkCidr in dev mode too when both are set', () => {
            expect(problemsOf(minimal({ mode: 'dev', transmitter: { bindAddress: '127.0.0.1', networkCidr: '192.168.20.0/24' } }))).toEqual([
                'transmitter.bindAddress must lie inside transmitter.networkCidr',
            ]);
            expect(parseBoxConfig(minimal({ mode: 'dev', transmitter: { bindAddress: '0.0.0.0', networkCidr: '0.0.0.0/0' } }), CONFIG_PATH).transmitter.bindAddress).toBe('0.0.0.0');
        });

        it('rejects unknown keys, a bad mode and a bad time zone', () => {
            const problems = problemsOf(minimal({ mode: 'staging', htttp: {}, box: { name: 'C3', timeZone: 'Mars/Olympus', colour: 'red' } }));
            expect(problems).toEqual(
                expect.arrayContaining(['unknown key htttp', 'mode must be "production" or "dev"', 'unknown key box.colour', 'box.timeZone "Mars/Olympus" is not an IANA time zone']),
            );
        });

        it('refuses plain HTTP outside dev mode', () => {
            expect(problemsOf(minimal({ http: { tls: null } }))).toEqual(['http.tls: null (plain HTTP) is allowed only in dev mode']);
        });

        it('refuses http and credentialed cloud URLs in production, and an origin with a path', () => {
            expect(problemsOf(minimal({ cloud: { origin: 'http://etabella.net' } }))).toEqual(['cloud.origin must use https']);
            expect(problemsOf(minimal({ cloud: { origin: 'https://u:p@etabella.net' } }))).toEqual(['cloud.origin must not carry credentials']);
            expect(problemsOf(minimal({ cloud: { origin: 'https://etabella.net/app' } }))).toEqual(['cloud.origin must be an origin (no path, query or fragment)']);
            expect(problemsOf(minimal({ cloud: { origin: 'not a url' } }))).toEqual(['cloud.origin must be an absolute URL']);
            expect(problemsOf(minimal({ cloud: { origin: 'https://etabella.net', tokenUrl: 'ftp://x' } }))).toEqual(['cloud.tokenUrl must use https or wss']);
            expect(problemsOf(minimal({ cloud: { origin: 'https://etabella.net', uplinkNamespace: 'edge' } }))).toEqual(['cloud.uplinkNamespace must start with "/"']);
        });

        it('validates ports, TLS fields, addresses and numbers', () => {
            const problems = problemsOf(
                minimal({
                    http: { port: 70000, tls: { certFile: '', reloadPollMs: 1 } },
                    transmitter: { listenPort: 'x', bindAddress: '192.168.20.256', networkCidr: '192.168.20.0/33' },
                    shutdownTimeoutMs: 0,
                    features: { roomCodes: 'yes', telepathy: true },
                    release: { version: 3 },
                }),
            );
            expect(problems).toEqual(
                expect.arrayContaining([
                    'http.port must be an integer 0-65535',
                    'http.tls.certFile must be a non-empty string',
                    'http.tls.keyFile is required',
                    'http.tls.reloadPollMs must be an integer 10-3600000',
                    'transmitter.listenPort must be an integer 0-65535',
                    'transmitter.bindAddress must be an IPv4 address',
                    'transmitter.networkCidr must be an IPv4 CIDR like 192.168.20.0/24',
                    "shutdownTimeoutMs must be an integer 1-20000 (the 5 shutdown steps run one after another and must end inside the container's 120 s stop_grace_period)",
                    'unknown key features.telepathy',
                    'features.roomCodes must be true or false',
                    'release.version must be a non-empty string',
                ]),
            );
        });

        it('rejects a section that is not an object and an over-long name', () => {
            const problems = problemsOf({ box: 'Court 3', cloud: { origin: 'https://etabella.net' }, paths: [] });
            expect(problems).toEqual(expect.arrayContaining(['box must be an object', 'paths must be an object']));
            expect(problemsOf(minimal({ box: { name: 'x'.repeat(81), timeZone: 'UTC' } }))).toEqual(['box.name must be at most 80 characters']);
            expect(problemsOf(minimal({ box: { name: 'C3', timeZone: 'UTC', domain: 'not a domain' } }))).toEqual(['box.domain must be a DNS name']);
        });

        it('names the file in the error message', () => {
            expect(() => parseBoxConfig({}, CONFIG_PATH)).toThrow(path.resolve(CONFIG_PATH));
        });

        it('keeps the five sequential shutdown steps inside the container stop grace period (120 s)', () => {
            expect(EDGE_SHUTDOWN_STEPS * EDGE_SHUTDOWN_STEP_MAX_MS + EDGE_SHUTDOWN_RESERVE_MS).toBeLessThanOrEqual(EDGE_STOP_GRACE_MS);
            expect(EDGE_SHUTDOWN_RESERVE_MS).toBeGreaterThanOrEqual(EDGE_START_STEP_BUDGET_MS); // a start step in flight finishes first
            expect(parseBoxConfig(minimal({ shutdownTimeoutMs: 20_000 }), CONFIG_PATH).shutdownTimeoutMs).toBe(20_000);
            for (const value of [20_001, 25_000, 600_000]) {
                expect(problemsOf(minimal({ shutdownTimeoutMs: value }))).toEqual([
                    "shutdownTimeoutMs must be an integer 1-20000 (the 5 shutdown steps run one after another and must end inside the container's 120 s stop_grace_period)",
                ]);
            }
        });

        it('accepts the shipped docker/edge/box-config.example.json shutdown budget', () => {
            const example = path.resolve(__dirname, '../../../../docker/edge/box-config.example.json');
            const raw = JSON.parse(fs.readFileSync(example, 'utf8')) as { shutdownTimeoutMs?: unknown };
            expect(typeof raw.shutdownTimeoutMs).toBe('number');
            expect(parseBoxConfig(minimal({ shutdownTimeoutMs: raw.shutdownTimeoutMs }), CONFIG_PATH).shutdownTimeoutMs).toBe(raw.shutdownTimeoutMs);
        });
    });

    describe('resolveConfigPath', () => {
        it('takes --config <path> and --config=<path>, ahead of RT_EDGE_CONFIG', () => {
            expect(resolveConfigPath(['--config', 'a.json'], { RT_EDGE_CONFIG: 'b.json' })).toBe('a.json');
            expect(resolveConfigPath(['status', '--config=a.json'], {})).toBe('a.json');
            expect(resolveConfigPath(['status'], { RT_EDGE_CONFIG: ' b.json ' })).toBe('b.json');
        });

        it('refuses a missing value and a missing config', () => {
            expect(() => resolveConfigPath(['--config'], {})).toThrow(BoxConfigError);
            expect(() => resolveConfigPath(['--config', '--json'], {})).toThrow('--config needs a file path');
            expect(() => resolveConfigPath(['--config='], {})).toThrow('--config needs a file path');
            expect(() => resolveConfigPath([], { RT_EDGE_CONFIG: '  ' })).toThrow('no box config');
        });
    });

    describe('loadBoxConfig', () => {
        let dir: string;

        beforeAll(() => {
            dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-cfg-'));
        });

        afterAll(() => {
            fs.rmSync(dir, { recursive: true, force: true });
        });

        it('loads a JSON file (BOM tolerated) and anchors paths on its directory', () => {
            const file = path.join(dir, 'box.json');
            fs.writeFileSync(file, '﻿' + JSON.stringify(minimal({ mode: 'dev', paths: { dataDir: 'data' } })));
            const config = loadBoxConfig(file);
            expect(config.configPath).toBe(file);
            expect(config.paths.dataDir).toBe(path.join(dir, 'data'));
        });

        it('never reads a .env file or a non-JSON file', () => {
            const read = jest.fn(() => '{}');
            expect(() => loadBoxConfig(path.join(dir, '.env'), read)).toThrow('refusing a .env file');
            expect(() => loadBoxConfig(path.join(dir, '.env.production.json'), read)).toThrow('refusing a .env file');
            expect(() => loadBoxConfig(path.join(dir, 'box.yaml'), read)).toThrow('must be a .json file');
            expect(read).not.toHaveBeenCalled();
        });

        it('reports a missing file and invalid JSON as BoxConfigError', () => {
            expect(() => loadBoxConfig(path.join(dir, 'missing.json'))).toThrow(/cannot read the file \(ENOENT\)/);
            const bad = path.join(dir, 'bad.json');
            fs.writeFileSync(bad, '{ not json');
            expect(() => loadBoxConfig(bad)).toThrow(/not valid JSON/);
        });
    });

    describe('IPv4 CIDR helpers (S-D14)', () => {
        it('validates CIDRs', () => {
            expect(isIpv4Cidr('192.168.20.0/24')).toBe(true);
            expect(isIpv4Cidr('0.0.0.0/0')).toBe(true);
            expect(isIpv4Cidr('192.168.20.0/33')).toBe(false);
            expect(isIpv4Cidr('192.168.20.0')).toBe(false);
            expect(isIpv4Cidr('fe80::/64')).toBe(false);
        });

        it('tests membership', () => {
            expect(ipv4InCidr('192.168.20.31', '192.168.20.0/24')).toBe(true);
            expect(ipv4InCidr('192.168.21.31', '192.168.20.0/24')).toBe(false);
            expect(ipv4InCidr('10.1.2.3', '0.0.0.0/0')).toBe(true);
            expect(ipv4InCidr('192.168.20.31', '192.168.20.31/32')).toBe(true);
            expect(ipv4InCidr('192.168.20.32', '192.168.20.31/32')).toBe(false);
            expect(ipv4InCidr('255.255.255.255', '255.255.255.0/24')).toBe(true);
            expect(ipv4InCidr('host', '192.168.20.0/24')).toBe(false);
        });
    });
});
