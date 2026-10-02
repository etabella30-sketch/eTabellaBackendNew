import { spawn } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import type { AddressInfo } from 'net';
import * as os from 'os';
import * as path from 'path';
import type { TLSSocket } from 'tls';

import { Body, Controller, DynamicModule, INestApplication, INestApplicationContext, Injectable, Module, NestApplicationOptions, OnModuleInit, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { CliStub } from './cli/cli.stub';
import { DEFAULT_RT_DATA_OPTIONS } from './lan/rt-data/rt-data.options';
import {
    buildHttpsOptions,
    EDGE_BODY_LIMIT_BYTES,
    EDGE_HSTS_MAX_AGE_SEC,
    EDGE_HSTS_VALUE,
    EdgeAppFactory,
    EdgeContextFactory,
    EdgeLanListener,
    EdgeLanListenerDeps,
    fatalExit,
    holdProcessOpen,
    main,
    reloadTlsContext,
    runCli,
    startServer,
    startTlsReloader,
    TlsWatchDeps,
} from './main';
import {
    BoxConfig,
    BoxConfigError,
    BoxTlsConfig,
    CLI_PORT,
    CliOutput,
    CliPort,
    EDGE_BOOT_STATUS,
    EDGE_EVENT_BUS,
    EDGE_EXIT,
    EDGE_RUN_MODE,
    EdgeAlert,
    EdgeBootError,
    EdgeBootPhase,
    EdgeBootRecorder,
    EdgeBootStatus,
    EdgeEventBus,
    EdgeStateUnavailableError,
    EdgeTlsError,
    InMemoryEdgeEventBus,
    KERNEL_PORT,
    LAN_PORT,
    notImplemented,
    OPS_PORT,
    parseBoxConfig,
    STATE_PORT,
    UPLINK_PORT,
} from './ports';
import { bareBox, lifecyclePorts } from './ports/testing/bare-box';
import { selfSignedCertificate } from './ports/testing/self-signed';
import { openBoxState, StateModule } from './state/state.module';

/** `.invalid` never resolves (RFC 2606): nothing a later wave adds can reach a real cloud from these specs. */
const CLOUD = 'https://cloud.invalid';

const DEV_RAW = {
    mode: 'dev',
    box: { name: 'Court 3', label: 'VB-014', timeZone: 'Europe/London' },
    cloud: { origin: CLOUD },
    http: { host: '127.0.0.1', port: 0, tls: null },
    transmitter: { bindAddress: '127.0.0.1', networkCidr: '127.0.0.0/8', listenPort: 0 },
    paths: { dataDir: 'data' },
    shutdownTimeoutMs: 1000,
};

const silentLogger = { log: () => undefined, error: () => undefined, warn: () => undefined, debug: () => undefined, verbose: () => undefined };

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor(condition: () => boolean, timeoutMs = 10_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
        if (Date.now() > deadline) throw new Error('condition not met in time');
        await sleep(10);
    }
}

const flush = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve));
};

function capture(): { out: CliOutput; logs: string[]; errors: string[] } {
    const logs: string[] = [];
    const errors: string[] = [];
    return { out: { log: l => logs.push(l), error: l => errors.push(l) }, logs, errors };
}

function get(port: number, urlPath: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
        const req = http.get({ host: '127.0.0.1', port, path: urlPath, agent: false }, res => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => (body += chunk));
            res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
        });
        req.on('error', reject);
    });
}

function getTls(port: number): Promise<{ status: number; protocol: string | null; cn: string | undefined; headers: http.IncomingHttpHeaders }> {
    return new Promise((resolve, reject) => {
        const req = https.get({ host: '127.0.0.1', port, path: '/edge/not-a-route', agent: false, rejectUnauthorized: false }, res => {
            const socket = res.socket as TLSSocket;
            const protocol = socket.getProtocol();
            const subject = socket.getPeerCertificate().subject as unknown as Record<string, string> | undefined;
            res.resume();
            res.on('end', () => resolve({ status: res.statusCode ?? 0, protocol, cn: subject?.CN, headers: res.headers }));
        });
        req.on('error', reject);
    });
}

const portOf = (app: INestApplication): number => ((app.getHttpServer() as http.Server).address() as AddressInfo).port;

// ---- the box without its feature modules (ports/testing/bare-box.ts): main.ts is tested against recording fakes of
// ---- the five lifecycle ports, never against what state/, kernel/, uplink/, auth/, ops/, lan/ or cli/ provide --------

type Fake = { start: jest.Mock; close: jest.Mock };
type Fakes = Record<'state' | 'kernel' | 'uplink' | 'ops' | 'lan', Fake> & { calls: string[] };

function lifecycleFakes(): Fakes {
    const calls: string[] = [];
    const make = (name: string): Fake => ({
        start: jest.fn(async () => {
            calls.push(`${name}.start`);
        }),
        close: jest.fn(async () => {
            calls.push(`${name}.close`);
        }),
    });
    return { calls, state: make('state'), kernel: make('kernel'), uplink: make('uplink'), ops: make('ops'), lan: make('lan') };
}

const CLOSE_ORDER = ['lan.close', 'ops.close', 'uplink.close', 'kernel.close', 'state.close'];

const fakePorts = (fakes: Fakes) =>
    lifecyclePorts({ [STATE_PORT]: fakes.state, [KERNEL_PORT]: fakes.kernel, [UPLINK_PORT]: fakes.uplink, [OPS_PORT]: fakes.ops, [LAN_PORT]: fakes.lan });

/** `createApp` that builds the bare box main.ts registered, with the lifecycle ports faked; `seen` gets each app built. */
function fakeApp(fakes: Fakes, seen: (app: INestApplication) => void = () => undefined): EdgeAppFactory {
    return async (module: DynamicModule, options: NestApplicationOptions) => {
        const ref = await Test.createTestingModule({ imports: [bareBox(module, fakePorts(fakes))] })
            .setLogger(silentLogger)
            .compile();
        const app = ref.createNestApplication(options);
        seen(app);
        return app;
    };
}

/**
 * `createContext` that builds the bare box main.ts registered, initialised, with the lifecycle ports faked and
 * CLI_PORT = `cli`. `seen` gets each context built; `closed()` counts its closes.
 */
function cliContext(cli: CliPort, fakes: Fakes = lifecycleFakes(), seen: (ctx: INestApplicationContext) => void = () => undefined): { createContext: EdgeContextFactory; closed: () => number } {
    let closes = 0;
    const createContext: EdgeContextFactory = async module => {
        const ref = await Test.createTestingModule({ imports: [bareBox(module, [...fakePorts(fakes), { provide: CLI_PORT, useValue: cli }])] })
            .setLogger(silentLogger)
            .compile();
        await ref.init();
        const close = ref.close.bind(ref);
        ref.close = async () => {
            closes++;
            await close();
        };
        seen(ref);
        return ref;
    };
    return { createContext, closed: () => closes };
}

/** A recording process hold (`StartServerOptions.holdProcess`). */
function recordingHold(log: string[] = []): { holdProcess: jest.Mock<() => void, []>; release: jest.Mock; log: string[] } {
    const release = jest.fn(() => {
        log.push('release');
    });
    const holdProcess = jest.fn(() => {
        log.push('hold');
        return release;
    });
    return { holdProcess, release, log };
}

/** Records, per start, whether the HTTP server already listened. */
function recordListening(fakes: Fakes, app: () => INestApplication | undefined): Record<string, boolean> {
    const at: Record<string, boolean> = {};
    for (const name of ['kernel', 'uplink', 'ops', 'lan'] as const) {
        fakes[name].start.mockImplementation(async () => {
            fakes.calls.push(`${name}.start`);
            at[name] = (app()!.getHttpServer() as http.Server).listening;
        });
    }
    return at;
}

describe('rt-edge main', () => {
    let dir: string;
    let devConfigFile: string;

    const writeConfig = (name: string, raw: unknown): string => {
        const file = path.join(dir, name);
        fs.writeFileSync(file, JSON.stringify(raw));
        return file;
    };

    beforeAll(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-main-'));
        devConfigFile = writeConfig('dev.json', DEV_RAW);
    });

    afterAll(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    describe('main()', () => {
        it('prints the usage for help', async () => {
            const io = capture();
            await expect(main(['help'], {}, { out: io.out })).resolves.toBe(EDGE_EXIT.ok);
            expect(io.logs.join('\n')).toContain('usage: rt-edge');
        });

        it('answers a usage error with 64 and the usage', async () => {
            const io = capture();
            await expect(main(['frobnicate'], {}, { out: io.out })).resolves.toBe(EDGE_EXIT.usage);
            expect(io.errors[0]).toBe('rt-edge: unknown command "frobnicate"');
            expect(io.errors[1]).toContain('usage: rt-edge');
        });

        it('refuses to start without a config (78), never falling back to .env', async () => {
            const io = capture();
            await expect(main([], {}, { out: io.out })).resolves.toBe(EDGE_EXIT.config);
            expect(io.errors.join('\n')).toContain('no box config');
        });

        it('refuses a .env file and an invalid config (78)', async () => {
            const envFile = path.join(dir, '.env');
            fs.writeFileSync(envFile, 'DB_HOST=prod');
            const io = capture();
            await expect(main(['--config', envFile], {}, { out: io.out })).resolves.toBe(EDGE_EXIT.config);
            expect(io.errors.join('\n')).toContain('refusing a .env file');

            const bad = writeConfig('bad.json', { box: { name: 'C3' } });
            const io2 = capture();
            await expect(main([], { RT_EDGE_CONFIG: bad }, { out: io2.out })).resolves.toBe(EDGE_EXIT.config);
            expect(io2.errors.join('\n')).toContain('box.timeZone is required');
        });

        it('refuses a structurally invalid TLS config (78) before building anything', async () => {
            const io = capture();
            const createApp = jest.fn();
            const hold = recordingHold();
            const config = { ...parseBoxConfig(DEV_RAW, devConfigFile), mode: 'production' } as BoxConfig; // plain HTTP in production
            await expect(
                main(['--config', devConfigFile], {}, { out: io.out, logger: false, shutdownHooks: false, createApp, loadConfig: () => config, holdProcess: hold.holdProcess }),
            ).resolves.toBe(EDGE_EXIT.config);
            expect(io.errors.join('\n')).toContain('http.tls is required outside dev mode');
            expect(createApp).not.toHaveBeenCalled();
            expect(hold.holdProcess).not.toHaveBeenCalled();
        });

        it("runs a CLI command in a 'cli' context that starts nothing (the skeleton stub → 70)", async () => {
            const io = capture();
            const fakes = lifecycleFakes();
            let mode: unknown;
            const { createContext, closed } = cliContext(new CliStub(), fakes, ctx => (mode = ctx.get(EDGE_RUN_MODE, { strict: false })));
            await expect(main(['status', '--config', devConfigFile], {}, { out: io.out, logger: false, createContext })).resolves.toBe(EDGE_EXIT.software);
            expect(io.errors).toEqual(['rt-edge: "status" is not available in this build yet']);
            expect(mode).toBe('cli');
            // 'serve' would start the kernel (CAT listener, dialer, journal recovery) next to the running box service.
            expect(fakes.kernel.start).not.toHaveBeenCalled();
            expect(fakes.calls).toEqual(CLOSE_ORDER);
            expect(closed()).toBe(1);
        });

        it('routes "cert install" (the v1 manual certificate path) to the CLI and lists it in the usage (review 5)', async () => {
            const help = capture();
            await expect(main(['help'], {}, { out: help.out })).resolves.toBe(EDGE_EXIT.ok);
            expect(help.logs.join('\n')).toContain('cert install --key <file> --chain <file>');
            const cli: CliPort = { run: jest.fn(async () => EDGE_EXIT.ok) };
            const { createContext } = cliContext(cli);
            await expect(main(['cert', 'install', '--key', 'k.pem', '--chain', 'c.pem', '--config', devConfigFile], {}, { out: capture().out, logger: false, createContext })).resolves.toBe(EDGE_EXIT.ok);
            expect(cli.run).toHaveBeenCalledWith({ name: 'cert-install', key: 'k.pem', chain: 'c.pem' }, expect.anything());
            const bad = capture();
            await expect(main(['cert', 'renew'], {}, { out: bad.out })).resolves.toBe(EDGE_EXIT.usage);
            expect(bad.errors[0]).toBe('rt-edge: cert needs "install", not "renew"');
            expect(bad.errors[1]).toContain('cert install --key <file> --chain <file>');
        });

        it('passes createContext and the process hold through to the CLI', async () => {
            const cli: CliPort = { run: jest.fn(async () => EDGE_EXIT.failed) };
            const hold = recordingHold();
            const { createContext } = cliContext(cli);
            await expect(
                main(['capture', 'list', '--config', devConfigFile], {}, { out: capture().out, logger: false, createContext, holdProcess: hold.holdProcess }),
            ).resolves.toBe(EDGE_EXIT.failed);
            expect(cli.run).toHaveBeenCalledWith({ name: 'capture-list' }, expect.anything());
            expect(hold.log).toEqual(['hold', 'release']);
        });

        it('keeps recording when the HTTP port is taken: alerts, retries, and binds once the port is free (spec §10 #1)', async () => {
            const blocker = http.createServer();
            await new Promise<void>(resolve => blocker.listen(0, '127.0.0.1', resolve));
            const { port } = blocker.address() as AddressInfo;
            const fakes = lifecycleFakes();
            const alerts: EdgeAlert[] = [];
            let blockerOpen = true;
            const busy = writeConfig('busy.json', { ...DEV_RAW, http: { host: '127.0.0.1', port, tls: null } });
            const app = (await main(['--config', busy], {}, {
                out: capture().out,
                logger: false,
                shutdownHooks: false,
                listenRetryMs: 20,
                createApp: fakeApp(fakes, a => a.get<EdgeEventBus>(EDGE_EVENT_BUS).subscribe('alert', x => alerts.push(x))),
            })) as INestApplication;
            const server = app.getHttpServer() as http.Server;
            try {
                expect(fakes.calls).toEqual(['kernel.start', 'uplink.start', 'ops.start', 'lan.start']);
                expect(server.listening).toBe(false);
                expect(app.get<EdgeBootStatus>(EDGE_BOOT_STATUS).lanListener()).toMatchObject({ state: 'listen-failed', plainHttp: true, error: 'EADDRINUSE', certificate: null });
                await sleep(80); // several retries with the same error: one alert
                expect(alerts.map(a => [a.source, a.tier, a.kind])).toEqual([['lan', 'P1', 'LISTEN_FAILED']]);
                expect(fakes.kernel.close).not.toHaveBeenCalled();

                await new Promise<void>(resolve => blocker.close(() => resolve()));
                blockerOpen = false;
                await waitFor(() => server.listening);
                expect(app.get<EdgeBootStatus>(EDGE_BOOT_STATUS).lanListener()).toMatchObject({ state: 'listening', plainHttp: true, error: null });
                expect((await get(port, '/edge/x')).status).toBe(404);
            } finally {
                fakes.calls.length = 0;
                await app.close();
                if (blockerOpen) await new Promise<void>(resolve => blocker.close(() => resolve()));
            }
            expect(fakes.calls).toEqual(CLOSE_ORDER);
            expect(server.listening).toBe(false);
        });

        it('rejects and closes everything once when recording cannot start (kernel.start fails)', async () => {
            const fakes = lifecycleFakes();
            fakes.kernel.start.mockImplementation(async () => {
                fakes.calls.push('kernel.start');
                throw new Error('journal dir is a file');
            });
            let server: http.Server | undefined;
            const hold = recordingHold();
            const err: unknown = await main(['--config', devConfigFile], {}, {
                out: capture().out,
                logger: false,
                shutdownHooks: false,
                holdProcess: hold.holdProcess,
                createApp: fakeApp(fakes, app => (server = app.getHttpServer())),
            }).then(
                () => undefined,
                e => e,
            );
            expect(err).toBeInstanceOf(EdgeBootError);
            expect((err as EdgeBootError).stage).toBe('recording');
            expect((err as EdgeBootError).message).toBe('the box cannot start: recording could not start: journal dir is a file');
            expect(((err as EdgeBootError).cause as Error).message).toBe('journal dir is a file');
            expect(fakes.calls).toEqual(['kernel.start', ...CLOSE_ORDER]);
            expect(server?.listening).toBe(false);
            expect(hold.log).toEqual(['hold', 'release']); // nothing keeps the failed process alive
        });

        it('serves plain HTTP in dev mode: recording before listen, services after, graceful close', async () => {
            const fakes = lifecycleFakes();
            let app: INestApplication | undefined;
            const listeningAt = recordListening(fakes, () => app);
            const result = await main(['--config', devConfigFile], {}, { out: capture().out, logger: false, shutdownHooks: false, createApp: fakeApp(fakes, a => (app = a)) });
            expect(result).toBe(app);
            const server = app!.getHttpServer() as http.Server;
            try {
                expect(fakes.calls).toEqual(['kernel.start', 'uplink.start', 'ops.start', 'lan.start']);
                expect(listeningAt).toEqual({ kernel: false, uplink: true, ops: true, lan: true });
                expect(app!.get<EdgeBootStatus>(EDGE_BOOT_STATUS).lanListener()).toMatchObject({ state: 'listening', plainHttp: true });
                const port = portOf(app!);
                expect(port).toBeGreaterThan(0);
                const res = await get(port, '/edge/not-a-route');
                expect(res.status).toBe(404);
                expect(res.headers['x-powered-by']).toBeUndefined();
                expect(res.headers['strict-transport-security']).toBeUndefined(); // never over plain HTTP
                const stack = (app!.getHttpAdapter().getInstance() as { _router?: { stack: Array<{ name: string }> } })._router?.stack ?? [];
                expect(stack.some(layer => layer.name === 'cookieParser')).toBe(true);
            } finally {
                fakes.calls.length = 0;
                await app!.close();
            }
            expect(server.listening).toBe(false);
            expect(fakes.calls).toEqual(CLOSE_ORDER);
        });

        it('keeps serving when a service fails to start (spec §10 #1)', async () => {
            const fakes = lifecycleFakes();
            fakes.uplink.start.mockRejectedValue(new Error('device key unreadable'));
            const app = (await main(['--config', devConfigFile], {}, { out: capture().out, logger: false, shutdownHooks: false, createApp: fakeApp(fakes) })) as INestApplication;
            try {
                expect((await get(portOf(app), '/edge/x')).status).toBe(404);
                expect(fakes.kernel.close).not.toHaveBeenCalled();
                expect(fakes.ops.start).toHaveBeenCalled();
                expect(fakes.lan.start).toHaveBeenCalled();
            } finally {
                await app.close();
            }
        });
    });

    describe('production box without a usable certificate (spec §8.3: the box fetches its own; never exit 78)', () => {
        const prodConfig = (name: string, certFile: string, keyFile: string, reloadPollMs: number): string =>
            writeConfig(name, { ...DEV_RAW, mode: 'production', http: { host: '127.0.0.1', port: 0, tls: { certFile, keyFile, reloadPollMs } } });

        it('records, starts uplink/ops/lan, alerts once, and binds HTTPS as soon as the certificate is installed', async () => {
            const certDir = fs.mkdtempSync(path.join(dir, 'certs-'));
            const certFile = path.join(certDir, 'fullchain.pem');
            const keyFile = path.join(certDir, 'privkey.pem');
            const fakes = lifecycleFakes();
            const alerts: EdgeAlert[] = [];
            let app: INestApplication | undefined;
            const listeningAt = recordListening(fakes, () => app);
            const watched = new Set<string>();
            const tlsWatch: TlsWatchDeps = {
                watchFile: (file, opts, listener) => {
                    watched.add(file);
                    return fs.watchFile(file, opts, listener);
                },
                unwatchFile: (file, listener) => {
                    watched.delete(file);
                    fs.unwatchFile(file, listener);
                },
                readFile: file => fs.readFileSync(file),
            };
            const result = await main(['--config', prodConfig('prod-nocert.json', certFile, keyFile, 10)], {}, {
                out: capture().out,
                logger: false,
                shutdownHooks: false,
                tlsWatch,
                createApp: fakeApp(fakes, a => {
                    app = a;
                    a.get<EdgeEventBus>(EDGE_EVENT_BUS).subscribe('alert', x => alerts.push(x));
                }),
            });
            expect(result).toBe(app);
            const server = app!.getHttpServer() as https.Server;
            const boot = app!.get<EdgeBootStatus>(EDGE_BOOT_STATUS);
            try {
                expect(fakes.calls).toEqual(['kernel.start', 'uplink.start', 'ops.start', 'lan.start']);
                expect(listeningAt).toEqual({ kernel: false, uplink: false, ops: false, lan: false });
                expect(server.listening).toBe(false);
                expect(boot.phase()).toBe('started');
                expect(boot.lanListener()).toMatchObject({ state: 'waiting-certificate', plainHttp: false, error: null, certificate: { reason: 'missing', file: certFile, message: 'ENOENT' } });
                expect(alerts).toHaveLength(1);
                expect(alerts[0]).toMatchObject({ source: 'lan', tier: 'P1', critical: false, kind: 'CERTIFICATE_UNAVAILABLE', nSesid: null, data: { reason: 'missing', file: certFile, certFile, keyFile } });
                expect(watched.size).toBe(0); // nothing to hot-reload yet
                await sleep(60); // several polls, same problem: no new alert
                expect(alerts).toHaveLength(1);

                const pair = selfSignedCertificate({ cn: 'rt-edge-first' });
                fs.writeFileSync(keyFile, pair.key);
                fs.writeFileSync(certFile, pair.cert);
                await waitFor(() => server.listening);
                expect(boot.lanListener()).toMatchObject({ state: 'listening', certificate: null, error: null });
                const res = await getTls(portOf(app!));
                expect(res.status).toBe(404);
                expect(res.cn).toBe('rt-edge-first');
                expect(res.headers['strict-transport-security']).toBe(EDGE_HSTS_VALUE);
                expect(['TLSv1.2', 'TLSv1.3']).toContain(res.protocol);
                expect(watched).toEqual(new Set([certFile, keyFile]));
                expect(fakes.kernel.close).not.toHaveBeenCalled();
            } finally {
                fakes.calls.length = 0;
                await app!.close();
            }
            expect(fakes.calls).toEqual(CLOSE_ORDER);
            expect(watched.size).toBe(0);
        }, 20_000);

        it('refuses a key that does not match (reason invalid), and binds at once on certificate-installed without waiting for the poll', async () => {
            const certDir = fs.mkdtempSync(path.join(dir, 'certs-'));
            const certFile = path.join(certDir, 'fullchain.pem');
            const keyFile = path.join(certDir, 'privkey.pem');
            const a = selfSignedCertificate({ cn: 'rt-edge-installed' });
            const b = selfSignedCertificate({ cn: 'other' });
            fs.writeFileSync(certFile, a.cert);
            fs.writeFileSync(keyFile, b.key);
            const fakes = lifecycleFakes();
            const app = (await main(['--config', prodConfig('prod-mismatch.json', certFile, keyFile, 3_600_000)], {}, {
                out: capture().out,
                logger: false,
                shutdownHooks: false,
                createApp: fakeApp(fakes),
            })) as INestApplication;
            const server = app.getHttpServer() as https.Server;
            const boot = app.get<EdgeBootStatus>(EDGE_BOOT_STATUS);
            try {
                expect(server.listening).toBe(false);
                const waiting = boot.lanListener();
                expect(waiting.state).toBe('waiting-certificate');
                expect(waiting.certificate).toMatchObject({ reason: 'invalid', file: null });
                expect(waiting.certificate!.message).toMatch(/key values mismatch/i);

                fs.writeFileSync(keyFile, a.key);
                app.get<EdgeEventBus>(EDGE_EVENT_BUS).publish('certificate-installed', { atMs: Date.now(), notAfterMs: Date.now() + 86_400_000, fingerprint256: 'AA', first: true });
                await waitFor(() => server.listening, 5_000); // the poll is an hour: only the event can have done this
                expect((await getTls(portOf(app))).cn).toBe('rt-edge-installed');
            } finally {
                await app.close();
            }
        }, 20_000);
    });

    describe('request bodies (review 23)', () => {
        @Controller('echo')
        class EchoController {
            @Post()
            echo(@Body() body: { text?: string }): { length: number } {
                return { length: String(body?.text ?? '').length };
            }
        }
        @Module({ controllers: [EchoController] })
        class EchoModule {}

        function post(port: number, body: string): Promise<{ status: number; body: string }> {
            return new Promise((resolve, reject) => {
                const req = http.request({ host: '127.0.0.1', port, path: '/echo', method: 'POST', agent: false, headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, res => {
                    let text = '';
                    res.setEncoding('utf8');
                    res.on('data', c => (text += c));
                    res.on('end', () => resolve({ status: res.statusCode ?? 0, body: text }));
                });
                req.on('error', reject);
                req.end(body);
            });
        }

        it('the box parses JSON up to the rt-data write limit (1 MB), not Nest\'s 100 KB default; beyond it is 413', async () => {
            expect(EDGE_BODY_LIMIT_BYTES).toBeGreaterThanOrEqual(DEFAULT_RT_DATA_OPTIONS.maxRequestBodyBytes);
            const fakes = lifecycleFakes();
            const createApp: EdgeAppFactory = async (module, options) => {
                const ref = await Test.createTestingModule({ imports: [bareBox(module, fakePorts(fakes), [EchoModule])] })
                    .setLogger(silentLogger)
                    .compile();
                return ref.createNestApplication(options);
            };
            const app = await startServer(parseBoxConfig(DEV_RAW, devConfigFile), { logger: false, shutdownHooks: false, createApp });
            try {
                const port = portOf(app);
                const small = await post(port, JSON.stringify({ text: 'x'.repeat(10) }));
                expect(small.status).toBe(201);
                // A 200 KB mark payload (a pen drawing): refused with 413 by the 100 KB default before the fix.
                const mid = await post(port, JSON.stringify({ text: 'x'.repeat(200 * 1024) }));
                expect(mid.status).toBe(201);
                expect(JSON.parse(mid.body)).toEqual({ length: 200 * 1024 });
                const big = await post(port, JSON.stringify({ text: 'x'.repeat(1536 * 1024) }));
                expect(big.status).toBe(413);
            } finally {
                await app.close();
            }
        });
    });

    describe('startServer shutdown wiring', () => {
        const dev = (): BoxConfig => parseBoxConfig(DEV_RAW, path.join(dir, 'dev.json'));

        it('registers the SIGTERM/SIGINT shutdown hooks by default and removes them on close', async () => {
            const before = { term: process.listenerCount('SIGTERM'), int: process.listenerCount('SIGINT') };
            const app = await startServer(dev(), { logger: false, createApp: fakeApp(lifecycleFakes()) });
            try {
                expect(process.listenerCount('SIGTERM')).toBe(before.term + 1);
                expect(process.listenerCount('SIGINT')).toBe(before.int + 1);
            } finally {
                await app.close();
            }
            expect(process.listenerCount('SIGTERM')).toBe(before.term);
            expect(process.listenerCount('SIGINT')).toBe(before.int);
        });

        it('registers no signal handler with shutdownHooks: false', async () => {
            const before = process.listenerCount('SIGTERM');
            const app = await startServer(dev(), { logger: false, shutdownHooks: false, createApp: fakeApp(lifecycleFakes()) });
            try {
                expect(process.listenerCount('SIGTERM')).toBe(before);
            } finally {
                await app.close();
            }
        });

        it('stops retrying and unsubscribes when the app closes while still waiting', async () => {
            const blocker = http.createServer();
            await new Promise<void>(resolve => blocker.listen(0, '127.0.0.1', resolve));
            const { port } = blocker.address() as AddressInfo;
            const intervals: Array<{ cleared: boolean }> = [];
            const timers = {
                setInterval: () => {
                    const h = { cleared: false };
                    intervals.push(h);
                    return h;
                },
                clearInterval: (h: unknown) => {
                    (h as { cleared: boolean }).cleared = true;
                },
            };
            let bus: EdgeEventBus | undefined;
            try {
                const config = parseBoxConfig({ ...DEV_RAW, http: { host: '127.0.0.1', port, tls: null } }, path.join(dir, 'busy2.json'));
                const app = await startServer(config, { logger: false, shutdownHooks: false, timers, createApp: fakeApp(lifecycleFakes(), a => (bus = a.get(EDGE_EVENT_BUS))) });
                expect(intervals).toHaveLength(1);
                expect(bus!.listenerCount('certificate-installed')).toBe(1);
                await app.close();
                await flush();
                expect(intervals[0].cleared).toBe(true);
                expect(bus!.listenerCount('certificate-installed')).toBe(0);
            } finally {
                await new Promise<void>(resolve => blocker.close(() => resolve()));
            }
        });
    });

    describe('default factories', () => {
        it("builds the app with NestFactory.create in run mode 'serve', with abortOnError: false so a boot failure rejects instead of exiting", async () => {
            const fakes = lifecycleFakes();
            let mode: unknown;
            const build = fakeApp(fakes, a => (mode = a.get(EDGE_RUN_MODE, { strict: false })));
            const spy = jest.spyOn(NestFactory, 'create').mockImplementation(((module: DynamicModule, options: NestApplicationOptions) => build(module, options)) as never);
            try {
                const app = await startServer(parseBoxConfig(DEV_RAW, path.join(dir, 'dev.json')), { logger: false, shutdownHooks: false });
                try {
                    expect(spy).toHaveBeenCalledTimes(1);
                    expect(spy.mock.calls[0][1]).toEqual({ httpsOptions: undefined, logger: false, abortOnError: false });
                    expect(mode).toBe('serve');
                    expect(fakes.calls).toEqual(['kernel.start', 'uplink.start', 'ops.start', 'lan.start']);
                } finally {
                    await app.close();
                }
            } finally {
                spy.mockRestore();
            }
        });
    });

    describe('the process hold (every timer of the box is unref\'d: main.ts keeps the serving process alive)', () => {
        const dev = (raw: Record<string, unknown> = {}): BoxConfig => parseBoxConfig({ ...DEV_RAW, ...raw }, path.join(dir, 'dev.json'));

        it("holdProcessOpen keeps one ref'd timer until it is released (idempotent)", () => {
            const set = jest.spyOn(global, 'setInterval');
            const clear = jest.spyOn(global, 'clearInterval');
            try {
                const release = holdProcessOpen();
                expect(set).toHaveBeenCalledTimes(1);
                expect(set.mock.calls[0][1]).toBe(2_147_483_647); // the longest delay Node takes; a longer one would fire at once
                const handle = set.mock.results[0].value as NodeJS.Timeout;
                expect(handle.hasRef()).toBe(true);
                expect(clear).not.toHaveBeenCalled();
                release();
                release();
                expect(clear).toHaveBeenCalledTimes(1);
                expect(clear).toHaveBeenCalledWith(handle);
            } finally {
                set.mockRestore();
                clear.mockRestore();
            }
        });

        it('is taken before the module graph is built, kept while the LAN listener is not bound, and released when the HTTP server closed', async () => {
            const blocker = http.createServer();
            await new Promise<void>(resolve => blocker.listen(0, '127.0.0.1', resolve));
            const { port } = blocker.address() as AddressInfo;
            const hold = recordingHold();
            const build = fakeApp(lifecycleFakes());
            const timers = { setInterval: () => ({}), clearInterval: () => undefined };
            try {
                const app = await startServer(dev({ http: { host: '127.0.0.1', port, tls: null } }), {
                    logger: false,
                    shutdownHooks: false,
                    timers,
                    holdProcess: hold.holdProcess,
                    createApp: (module, options) => {
                        hold.log.push('createApp');
                        return build(module, options);
                    },
                });
                expect(hold.log).toEqual(['hold', 'createApp']);
                expect(app.get<EdgeBootStatus>(EDGE_BOOT_STATUS).lanListener().state).toBe('listen-failed');
                expect((app.getHttpServer() as http.Server).listening).toBe(false);
                await sleep(30);
                expect(hold.release).not.toHaveBeenCalled(); // nothing is bound, and the box is still held open
                await app.close();
                await flush();
                expect(hold.log).toEqual(['hold', 'createApp', 'release']);
            } finally {
                await new Promise<void>(resolve => blocker.close(() => resolve()));
            }
        });

        it('is released once when a bound server closes', async () => {
            const hold = recordingHold();
            const app = await startServer(dev(), { logger: false, shutdownHooks: false, holdProcess: hold.holdProcess, createApp: fakeApp(lifecycleFakes()) });
            expect((app.getHttpServer() as http.Server).listening).toBe(true);
            expect(hold.release).not.toHaveBeenCalled();
            await app.close();
            await flush();
            expect(hold.log).toEqual(['hold', 'release']);
        });
    });

    describe('the serving process stays alive while the LAN listener is not bound (child process)', () => {
        const root = path.resolve(__dirname, '..', '..', '..');
        const fixture = path.join(__dirname, 'ports', 'testing', 'serve-child.ts');

        /** Run ports/testing/serve-child.ts under plain Node (ts-node, transpile only) and collect what it printed. */
        function runChild(cwd: string, args: string[], timeoutMs: number): Promise<{ code: number | null; lines: string[]; stderr: string; timedOut: boolean }> {
            return new Promise((resolve, reject) => {
                const child = spawn(
                    process.execPath,
                    [
                        '-r',
                        path.join(root, 'node_modules', 'ts-node', 'register', 'transpile-only.js'),
                        '-r',
                        path.join(root, 'node_modules', 'tsconfig-paths', 'register.js'),
                        fixture,
                        ...args,
                    ],
                    // An empty temp cwd: nothing the child loads can pick up a file of the checkout by a relative path.
                    { cwd, env: { ...process.env, TS_NODE_PROJECT: path.join(root, 'tsconfig.json') }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
                );
                let stdout = '';
                let stderr = '';
                let timedOut = false;
                child.stdout.setEncoding('utf8').on('data', chunk => (stdout += chunk));
                child.stderr.setEncoding('utf8').on('data', chunk => (stderr += chunk));
                const timer = setTimeout(() => {
                    timedOut = true;
                    child.kill();
                }, timeoutMs);
                child.on('error', err => {
                    clearTimeout(timer);
                    reject(err);
                });
                child.on('close', code => {
                    clearTimeout(timer);
                    resolve({ code, lines: stdout.split(/\r?\n/).filter(Boolean), stderr: code === 0 ? '' : stderr, timedOut });
                });
            });
        }

        it('keeps retrying on the unref\'d timer with no socket open, and exits 0 on its own once the box closed', async () => {
            const cwd = fs.mkdtempSync(path.join(dir, 'child-cwd-'));
            const certDir = path.join(dir, 'child-certs-never-created');
            const config = writeConfig('child.json', {
                ...DEV_RAW,
                mode: 'production',
                http: { host: '127.0.0.1', port: 0, tls: { certFile: path.join(certDir, 'fullchain.pem'), keyFile: path.join(certDir, 'privkey.pem'), reloadPollMs: 60_000 } },
            });
            const [held, control] = await Promise.all([runChild(cwd, [config, '40', '5'], 150_000), runChild(cwd, [config, '40', '5', '--no-hold'], 150_000)]);

            // Five retry periods after `startServer` resolved the process is still there; it ends by itself after the close.
            expect(held).toEqual({ code: 0, lines: ['started waiting-certificate', 'retried 5', 'closed'], stderr: '', timedOut: false });
            // The control proves the fixture: without the hold the same box simply ends (exit 0) before any retry.
            expect(control).toEqual({ code: 0, lines: ['started waiting-certificate'], stderr: '', timedOut: false });
        }, 180_000);
    });

    describe('fatal boot conditions (ports/boot.ts)', () => {
        const dev = (raw: Record<string, unknown> = {}): BoxConfig => parseBoxConfig({ ...DEV_RAW, ...raw }, path.join(dir, 'dev.json'));
        const rejection = (work: Promise<unknown>): Promise<unknown> =>
            work.then(
                () => undefined,
                err => err,
            );

        /** The bare box plus the REAL StateModule (its factory opens `paths.stateDb`); the other lifecycle ports are faked. */
        const withRealState =
            (fakes: Fakes, extra: Array<{ provide: string; useValue: unknown }> = []) =>
            async (module: DynamicModule, options?: NestApplicationOptions): Promise<INestApplication> => {
                const ports = lifecyclePorts({ [KERNEL_PORT]: fakes.kernel, [UPLINK_PORT]: fakes.uplink, [OPS_PORT]: fakes.ops, [LAN_PORT]: fakes.lan }, [STATE_PORT]);
                const ref = await Test.createTestingModule({ imports: [bareBox(module, [...ports, ...extra], [StateModule])] })
                    .setLogger(silentLogger)
                    .compile();
                return ref.createNestApplication(options);
            };

        it('a module graph that cannot be built rejects with EdgeBootError (module-graph) and releases the hold', async () => {
            const hold = recordingHold();
            const err = await rejection(
                startServer(dev(), { logger: false, shutdownHooks: false, holdProcess: hold.holdProcess, createApp: async () => Promise.reject(new Error('provider X exploded')) }),
            );
            expect(err).toBeInstanceOf(EdgeBootError);
            expect(err).toMatchObject({ name: 'EdgeBootError', stage: 'module-graph', message: 'the box cannot start: the module graph could not be built: provider X exploded' });
            expect(hold.log).toEqual(['hold', 'release']);
        });

        it('passes a BoxConfigError thrown while the graph is built through unwrapped (exit 78)', async () => {
            const io = capture();
            const hold = recordingHold();
            const createApp: EdgeAppFactory = async () => Promise.reject(new BoxConfigError(['paths.dataDir is not usable'], devConfigFile));
            await expect(main(['--config', devConfigFile], {}, { out: io.out, logger: false, shutdownHooks: false, createApp, holdProcess: hold.holdProcess })).resolves.toBe(EDGE_EXIT.config);
            expect(io.errors.join('\n')).toContain('paths.dataDir is not usable');
            expect(hold.log).toEqual(['hold', 'release']);
        });

        it('an init hook that throws is module-graph too: recording never started, every port is closed, the hold is released', async () => {
            @Injectable()
            class Boom implements OnModuleInit {
                onModuleInit(): void {
                    throw new Error('init hook boom');
                }
            }
            const fakes = lifecycleFakes();
            const hold = recordingHold();
            const createApp: EdgeAppFactory = async (module, options) => {
                const ref = await Test.createTestingModule({ imports: [bareBox(module, [...fakePorts(fakes), Boom])] })
                    .setLogger(silentLogger)
                    .compile();
                return ref.createNestApplication(options);
            };
            const err = await rejection(startServer(dev(), { logger: false, shutdownHooks: false, holdProcess: hold.holdProcess, createApp }));
            expect(err).toMatchObject({ name: 'EdgeBootError', stage: 'module-graph', message: 'the box cannot start: the module graph could not be built: init hook boom' });
            expect(fakes.kernel.start).not.toHaveBeenCalled();
            expect(fakes.calls).toEqual(CLOSE_ORDER);
            expect(hold.log).toEqual(['hold', 'release']);
        });

        describe('the state database cannot be opened (condition 2)', () => {
            /** A config whose `paths.stateDb` is a DIRECTORY: SQLite cannot open it. */
            const unopenable = (): BoxConfig => dev({ paths: { dataDir: 'data', stateDb: fs.mkdtempSync(path.join(dir, 'state-is-a-dir-')) } });

            it('serve: startServer rejects with EdgeBootError (module-graph) naming the file; nothing starts, the hold is released', async () => {
                const config = unopenable();
                const fakes = lifecycleFakes();
                const hold = recordingHold();
                const err = (await rejection(startServer(config, { logger: false, shutdownHooks: false, holdProcess: hold.holdProcess, createApp: withRealState(fakes) }))) as EdgeBootError;

                expect(err).toBeInstanceOf(EdgeBootError);
                expect(err.stage).toBe('module-graph');
                expect(err.cause).toBeInstanceOf(EdgeStateUnavailableError);
                const cause = err.cause as EdgeStateUnavailableError;
                expect(cause.file).toBe(config.paths.stateDb);
                expect((cause.cause as Error).message).toMatch(/unable to open database file/i);
                expect(err.message).toBe(`the box cannot start: the state database ${config.paths.stateDb} cannot be opened or migrated: ${(cause.cause as Error).message}`);
                expect(fakes.calls).toEqual([]); // no port was started, so none needs closing
                expect(hold.log).toEqual(['hold', 'release']);

                // The entry point logs it as its own class and exits 70.
                const logger = { error: jest.fn() };
                expect(fatalExit(err, logger)).toBe(EDGE_EXIT.software);
                expect(logger.error).toHaveBeenCalledTimes(1);
                expect(logger.error.mock.calls[0][0]).toBe(`fatal boot (module-graph): ${err.message}`);
                expect(logger.error.mock.calls[0][1]).toContain('EdgeStateUnavailableError');
            });

            it('serve: main() rejects with the same error (not a config problem: no exit 78)', async () => {
                const config = unopenable();
                const io = capture();
                const err = await rejection(main(['--config', devConfigFile], {}, { out: io.out, logger: false, shutdownHooks: false, loadConfig: () => config, createApp: withRealState(lifecycleFakes()) }));
                expect(err).toMatchObject({ name: 'EdgeBootError', stage: 'module-graph' });
                expect(io.errors).toEqual([]);
            });

            it('cli: the command prints the reason and exits 70 without running', async () => {
                const config = unopenable();
                const io = capture();
                const cli: CliPort = { run: jest.fn(async () => EDGE_EXIT.ok) };
                const build = withRealState(lifecycleFakes(), [{ provide: CLI_PORT, useValue: cli }]);
                const createContext: EdgeContextFactory = async module => (await build(module)).init();
                await expect(runCli(config, { name: 'status', json: false }, { logger: false, out: io.out, createContext })).resolves.toBe(EDGE_EXIT.software);
                expect(io.errors).toHaveLength(1);
                expect(io.errors[0]).toMatch(/^rt-edge: status failed: the state database .+ cannot be opened or migrated: .*unable to open database file/i);
                expect(io.errors[0]).toContain(config.paths.stateDb);
                expect(cli.run).not.toHaveBeenCalled();
            });

            it('openBoxState wraps a corrupt file the same way and leaves it untouched (no automatic rebuild in this wave)', () => {
                const stateDir = fs.mkdtempSync(path.join(dir, 'state-corrupt-'));
                const stateDb = path.join(stateDir, 'edge.sqlite');
                const garbage = Buffer.alloc(8192, 0x5a);
                fs.writeFileSync(stateDb, garbage);
                let caught: unknown;
                try {
                    openBoxState(dev({ paths: { dataDir: 'data', stateDb } }));
                } catch (err) {
                    caught = err;
                }
                expect(caught).toBeInstanceOf(EdgeStateUnavailableError);
                expect((caught as EdgeStateUnavailableError).file).toBe(stateDb);
                expect(((caught as EdgeStateUnavailableError).cause as Error).message).toMatch(/not a database/i);
                expect(fs.readFileSync(stateDb).equals(garbage)).toBe(true);
                expect(fs.readdirSync(stateDir)).toEqual(['edge.sqlite']);
            });

            it('openBoxState hands out an opened, migrated database when the file is usable', async () => {
                const stateDir = fs.mkdtempSync(path.join(dir, 'state-ok-'));
                const state = openBoxState(dev({ paths: { dataDir: 'data', stateDb: path.join(stateDir, 'edge.sqlite') } }));
                try {
                    expect(state.health()).toMatchObject({ ok: true, file: path.join(stateDir, 'edge.sqlite') });
                    expect(state.health().schemaVersion).toBeGreaterThan(0);
                } finally {
                    await state.close();
                }
            });
        });

        describe('fatalExit', () => {
            it('logs a boot failure as its own class, with the cause stack when there is one', () => {
                const logger = { error: jest.fn() };
                expect(fatalExit(new EdgeBootError('recording', new Error('journal dir is a file')), logger)).toBe(EDGE_EXIT.software);
                expect(logger.error.mock.calls[0][0]).toBe('fatal boot (recording): the box cannot start: recording could not start: journal dir is a file');
                expect(logger.error.mock.calls[0][1]).toContain('journal dir is a file');

                const plain = { error: jest.fn() };
                expect(fatalExit(new EdgeBootError('module-graph', 'no stack here'), plain)).toBe(EDGE_EXIT.software);
                expect(plain.error.mock.calls).toEqual([['fatal boot (module-graph): the box cannot start: the module graph could not be built: no stack here']]);
            });

            it('logs anything else as fatal with its stack', () => {
                const logger = { error: jest.fn() };
                const err = new Error('unexpected');
                expect(fatalExit(err, logger)).toBe(EDGE_EXIT.software);
                expect(fatalExit('a string', logger)).toBe(EDGE_EXIT.software);
                expect(logger.error.mock.calls).toEqual([[`fatal: ${err.stack}`], ['fatal: a string']]);
            });
        });
    });

    describe('HTTPS serve (production, loopback)', () => {
        it('serves TLS ≥ 1.2 with the configured certificate, hot-reloads a new one, and unwatches on close', async () => {
            const a = selfSignedCertificate({ cn: 'rt-edge-a' });
            const b = selfSignedCertificate({ cn: 'rt-edge-spec-b' });
            const certFile = path.join(dir, 'fullchain.pem');
            const keyFile = path.join(dir, 'privkey.pem');
            fs.writeFileSync(certFile, a.cert);
            fs.writeFileSync(keyFile, a.key);
            const prod = parseBoxConfig(
                { ...DEV_RAW, mode: 'production', http: { host: '127.0.0.1', port: 0, tls: { certFile, keyFile, reloadPollMs: 10 } } },
                path.join(dir, 'prod-tls.json'),
            );
            const watched = new Set<string>();
            const tlsWatch: TlsWatchDeps = {
                watchFile: (file, opts, listener) => {
                    watched.add(file);
                    return fs.watchFile(file, opts, listener);
                },
                unwatchFile: (file, listener) => {
                    watched.delete(file);
                    fs.unwatchFile(file, listener);
                },
                readFile: file => fs.readFileSync(file),
            };
            const app = await startServer(prod, { logger: false, shutdownHooks: false, createApp: fakeApp(lifecycleFakes()), tlsWatch });
            try {
                expect(watched).toEqual(new Set([certFile, keyFile]));
                expect(app.get<EdgeBootStatus>(EDGE_BOOT_STATUS).lanListener()).toMatchObject({ state: 'listening', plainHttp: false });
                const port = portOf(app);
                const first = await getTls(port);
                expect(first.status).toBe(404);
                expect(['TLSv1.2', 'TLSv1.3']).toContain(first.protocol);
                expect(first.cn).toBe('rt-edge-a');
                // HSTS on every HTTPS response, an unanswered route included (spec §8.3): at least six months.
                expect(first.headers['strict-transport-security']).toBe('max-age=31536000');
                expect(EDGE_HSTS_VALUE).toBe(`max-age=${EDGE_HSTS_MAX_AGE_SEC}`);
                expect(EDGE_HSTS_MAX_AGE_SEC).toBeGreaterThanOrEqual(183 * 86_400);

                await sleep(100); // let the pollers take their first stat
                fs.writeFileSync(certFile, b.cert);
                fs.writeFileSync(keyFile, b.key);
                const deadline = Date.now() + 10_000;
                let cn = first.cn;
                while (cn !== 'rt-edge-spec-b' && Date.now() < deadline) {
                    await sleep(50);
                    cn = (await getTls(port)).cn;
                }
                expect(cn).toBe('rt-edge-spec-b');
            } finally {
                await app.close();
            }
            expect(watched.size).toBe(0);
        }, 20_000);
    });

    describe('buildHttpsOptions', () => {
        const dev = (): BoxConfig => parseBoxConfig(DEV_RAW, path.join(os.tmpdir(), 'x', 'dev.json'));
        const withTls = (): BoxConfig =>
            parseBoxConfig({ ...DEV_RAW, mode: 'production', http: { port: 443, tls: { certFile: '/certs/c.pem', keyFile: '/certs/k.pem', caFile: '/certs/ca.pem' } } }, path.join(os.tmpdir(), 'x', 'prod.json'));

        it('is undefined (plain HTTP) for dev with tls: null', () => {
            expect(buildHttpsOptions(dev())).toBeUndefined();
        });

        it('refuses plain HTTP outside dev even if a config object slipped through (structural: 78)', () => {
            const config = { ...dev(), mode: 'production' } as BoxConfig;
            expect(() => buildHttpsOptions(config)).toThrow(BoxConfigError);
        });

        it('creates the HTTPS server with TLS ≥ 1.2 and no certificate, reading no file (the listener installs the pair)', () => {
            const spy = jest.spyOn(fs, 'readFileSync');
            try {
                expect(buildHttpsOptions(withTls())).toEqual({ minVersion: 'TLSv1.2' });
                expect(spy).not.toHaveBeenCalled();
            } finally {
                spy.mockRestore();
            }
        });
    });

    describe('TLS hot reload', () => {
        const tls: BoxTlsConfig = { certFile: '/certs/c.pem', keyFile: '/certs/k.pem', caFile: null, reloadPollMs: 1234 };
        const stats = (mtimeMs: number, size: number) => ({ mtimeMs, size }) as fs.Stats;
        const pair = selfSignedCertificate({ cn: 'reload' });
        const other = selfSignedCertificate({ cn: 'other' });
        const pemFiles: Record<string, string> = { 'c.pem': pair.cert, 'k.pem': pair.key, 'ca.pem': other.cert };
        const readPem = (file: string): Buffer => Buffer.from(pemFiles[path.basename(file)]);

        function fakeDeps(read: (file: string) => Buffer = readPem) {
            const listeners = new Map<string, (curr: fs.Stats, prev: fs.Stats) => void>();
            const watchOpts: Array<{ interval: number; persistent: boolean }> = [];
            const unref = jest.fn();
            const deps: TlsWatchDeps = {
                watchFile: (file, opts, listener) => {
                    listeners.set(file, listener);
                    watchOpts.push(opts);
                    return { unref };
                },
                unwatchFile: jest.fn((file: string) => {
                    listeners.delete(file);
                }),
                readFile: jest.fn(read),
            };
            return { deps, listeners, watchOpts, unref };
        }

        it('reloadTlsContext swaps in the pair with TLS ≥ 1.2 (setSecureContext would reset it), or throws and keeps the old one', () => {
            const server = { setSecureContext: jest.fn() };
            reloadTlsContext(server, tls, readPem);
            expect(server.setSecureContext).toHaveBeenCalledWith({ cert: Buffer.from(pair.cert), key: Buffer.from(pair.key), minVersion: 'TLSv1.2' });
            const failing = { setSecureContext: jest.fn() };
            expect(() =>
                reloadTlsContext(failing, tls, () => {
                    throw Object.assign(new Error('gone'), { code: 'ENOENT' });
                }),
            ).toThrow(EdgeTlsError);
            expect(failing.setSecureContext).not.toHaveBeenCalled();
        });

        it('watches both files without keeping the process alive and reloads on a change', () => {
            const server = { setSecureContext: jest.fn() };
            const logger = { log: jest.fn(), error: jest.fn() };
            const { deps, listeners, watchOpts, unref } = fakeDeps();
            startTlsReloader(server, tls, logger, deps);
            expect([...listeners.keys()]).toEqual(['/certs/c.pem', '/certs/k.pem']);
            expect(watchOpts).toEqual([
                { interval: 1234, persistent: false },
                { interval: 1234, persistent: false },
            ]);
            expect(unref).toHaveBeenCalledTimes(2);

            listeners.get('/certs/c.pem')!(stats(1, 10), stats(1, 10)); // nothing changed
            listeners.get('/certs/c.pem')!(stats(2, 0), stats(1, 10)); // truncated mid-write
            expect(server.setSecureContext).not.toHaveBeenCalled();

            listeners.get('/certs/k.pem')!(stats(2, 11), stats(1, 10));
            expect(server.setSecureContext).toHaveBeenCalledTimes(1);
            expect(logger.log).toHaveBeenCalledWith('TLS certificate reloaded');
        });

        it('keeps the current certificate when a reload fails to read', () => {
            const server = { setSecureContext: jest.fn() };
            const logger = { log: jest.fn(), error: jest.fn() };
            const { deps, listeners } = fakeDeps(() => {
                throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
            });
            startTlsReloader(server, tls, logger, deps);
            expect(() => listeners.get('/certs/c.pem')!(stats(2, 10), stats(1, 10))).not.toThrow();
            expect(server.setSecureContext).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('TLS certificate reload failed'));
        });

        it('refuses a mismatched pair on disk before touching the server (renewal half-installed)', () => {
            const server = { setSecureContext: jest.fn() };
            const logger = { log: jest.fn(), error: jest.fn() };
            const { deps, listeners } = fakeDeps(file => Buffer.from(path.basename(file) === 'k.pem' ? other.key : pair.cert));
            startTlsReloader(server, tls, logger, deps);
            listeners.get('/certs/c.pem')!(stats(2, 10), stats(1, 10));
            expect(server.setSecureContext).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalledWith(expect.stringMatching(/key values mismatch/i));
        });

        it('keeps the current certificate when setSecureContext itself throws', () => {
            const server = {
                setSecureContext: jest.fn(() => {
                    throw new Error('context refused');
                }),
            };
            const logger = { log: jest.fn(), error: jest.fn() };
            const { deps, listeners } = fakeDeps();
            startTlsReloader(server, tls, logger, deps);
            expect(() => listeners.get('/certs/c.pem')!(stats(2, 10), stats(1, 10))).not.toThrow();
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('context refused'));
            expect(logger.log).not.toHaveBeenCalled();
        });

        it('watches the CA bundle too and stops once', () => {
            const server = { setSecureContext: jest.fn() };
            const { deps, listeners } = fakeDeps();
            const stop = startTlsReloader(server, { ...tls, caFile: '/certs/ca.pem' }, { log: jest.fn(), error: jest.fn() }, deps);
            expect(listeners.size).toBe(3);
            stop();
            stop();
            expect(listeners.size).toBe(0);
            expect(deps.unwatchFile).toHaveBeenCalledTimes(3);
        });
    });

    describe('EdgeLanListener', () => {
        const NOW = Date.UTC(2026, 9, 1, 9, 30);
        const tls: BoxTlsConfig = { certFile: '/certs/c.pem', keyFile: '/certs/k.pem', caFile: null, reloadPollMs: 1234 };
        const pair = selfSignedCertificate({ cn: 'unit' });
        const other = selfSignedCertificate({ cn: 'other' });

        type Interval = { fn: () => void; ms: number; cleared: boolean };

        function harness(opts: { files?: Record<string, string>; tls?: BoxTlsConfig | null; phase?: EdgeBootPhase; listen?: jest.Mock<Promise<unknown>, []>; recover?: (tls: BoxTlsConfig) => void } = {}) {
            const files: Record<string, string> = { ...(opts.files ?? {}) };
            const boot = new EdgeBootRecorder();
            boot.setPhase(opts.phase ?? 'recording', 1);
            const bus = new InMemoryEdgeEventBus();
            const alerts: EdgeAlert[] = [];
            bus.subscribe('alert', a => alerts.push(a));
            const intervals: Interval[] = [];
            const timers = {
                setInterval: jest.fn((fn: () => void, ms: number) => {
                    const h: Interval = { fn, ms, cleared: false };
                    intervals.push(h);
                    return h;
                }),
                clearInterval: jest.fn((h: unknown) => {
                    (h as Interval).cleared = true;
                }),
            };
            const server = { setSecureContext: jest.fn(), close: jest.fn() };
            const watched = new Set<string>();
            const watch: TlsWatchDeps = {
                watchFile: file => {
                    watched.add(file);
                },
                unwatchFile: jest.fn((file: string) => {
                    watched.delete(file);
                }),
                readFile: file => {
                    const v = files[path.basename(file)];
                    if (v === undefined) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
                    return Buffer.from(v);
                },
            };
            const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
            const listen = opts.listen ?? jest.fn<Promise<unknown>, []>(async () => undefined);
            const deps: EdgeLanListenerDeps = {
                server,
                tls: opts.tls === undefined ? tls : opts.tls,
                listen,
                address: '0.0.0.0:443',
                boot,
                bus,
                clock: () => NOW,
                logger,
                watch,
                timers,
                retryMs: 1234,
                ...(opts.recover ? { recoverCertificate: opts.recover } : {}),
            };
            return { listener: new EdgeLanListener(deps), files, boot, bus, alerts, intervals, timers, server, watched, logger, listen };
        }

        it('finishes a certificate install a crash interrupted before it reads the pair, and binds (review 24)', async () => {
            // On disk: the new key and the old chain (a power cut between the two renames of uplink/cert-install.ts).
            const order: string[] = [];
            let disk: Record<string, string> = {};
            const h = harness({
                files: { 'c.pem': other.cert, 'k.pem': pair.key },
                recover: t => {
                    order.push(`recover:${t.certFile}`);
                    disk['c.pem'] = pair.cert; // completeCertificateInstall renamed the staged chain in
                },
            });
            disk = h.files;
            h.listen.mockImplementation(async () => order.push('listen'));
            await h.listener.check();
            expect(order).toEqual(['recover:/certs/c.pem', 'listen']);
            expect(h.boot.lanListener().state).toBe('listening');
            // A recovery that throws is logged; the listener still reads what is there.
            const failing = harness({
                files: { 'c.pem': pair.cert, 'k.pem': pair.key },
                recover: () => {
                    throw new Error('EIO');
                },
            });
            await failing.listener.check();
            expect(failing.logger.error).toHaveBeenCalledWith(expect.stringContaining('interrupted certificate install'));
            expect(failing.boot.lanListener().state).toBe('listening');
        });

        it('binds at once with a loadable pair: TLS ≥ 1.2 context before listen, files watched, no timer, no alert', async () => {
            const h = harness({ files: { 'c.pem': pair.cert, 'k.pem': pair.key } });
            const order: string[] = [];
            h.server.setSecureContext.mockImplementation(() => order.push('context'));
            h.listen.mockImplementation(async () => order.push('listen'));
            await h.listener.check();
            h.listener.announce();
            expect(order).toEqual(['context', 'listen']);
            expect(h.server.setSecureContext).toHaveBeenCalledWith({ cert: Buffer.from(pair.cert), key: Buffer.from(pair.key), minVersion: 'TLSv1.2' });
            expect(h.boot.lanListener()).toEqual({ state: 'listening', sinceMs: NOW, plainHttp: false, certificate: null, error: null });
            expect(h.watched).toEqual(new Set(['/certs/c.pem', '/certs/k.pem']));
            expect(h.intervals).toHaveLength(0);
            expect(h.alerts).toEqual([]);
        });

        it('waits for a missing certificate: records it, logs and alerts once (held until announce), polls every retryMs', async () => {
            const h = harness();
            await h.listener.check();
            expect(h.listen).not.toHaveBeenCalled();
            expect(h.boot.lanListener()).toEqual({
                state: 'waiting-certificate',
                sinceMs: NOW,
                plainHttp: false,
                certificate: { reason: 'missing', file: '/certs/c.pem', message: 'ENOENT' },
                error: null,
            });
            expect(h.logger.warn).toHaveBeenCalledTimes(1);
            expect(h.alerts).toEqual([]); // held: the services that forward alerts are not subscribed yet
            expect(h.intervals.map(i => i.ms)).toEqual([1234]);

            h.listener.announce();
            expect(h.alerts).toHaveLength(1);
            expect(h.alerts[0]).toMatchObject({ source: 'lan', tier: 'P1', critical: false, kind: 'CERTIFICATE_UNAVAILABLE', atMs: NOW, nSesid: null });
            expect(h.alerts[0].message).toContain('TLS missing /certs/c.pem (ENOENT)');
            expect(h.alerts[0].message).toContain('keeps recording');

            h.intervals[0].fn(); // the same problem: nothing new
            await flush();
            expect(h.logger.warn).toHaveBeenCalledTimes(1);
            expect(h.alerts).toHaveLength(1);
            expect(h.intervals).toHaveLength(1);

            h.files['c.pem'] = pair.cert;
            h.files['k.pem'] = other.key; // a different problem: logged and alerted again
            h.intervals[0].fn();
            await flush();
            expect(h.boot.lanListener().certificate).toMatchObject({ reason: 'invalid', file: null });
            expect(h.alerts).toHaveLength(2);
            expect(h.server.setSecureContext).not.toHaveBeenCalled();
            expect(h.listen).not.toHaveBeenCalled();
        });

        it('binds on a later check once the pair loads: timer cleared, held alert dropped, files watched', async () => {
            const h = harness();
            await h.listener.check();
            h.files['c.pem'] = pair.cert;
            h.files['k.pem'] = pair.key;
            await h.listener.check();
            h.listener.announce();
            expect(h.listen).toHaveBeenCalledTimes(1);
            expect(h.alerts).toEqual([]); // resolved before anyone was told
            expect(h.intervals[0].cleared).toBe(true);
            expect(h.boot.lanListener().state).toBe('listening');
            expect(h.watched.size).toBe(2);
            expect(h.logger.log).toHaveBeenCalledWith(expect.stringContaining('the earlier problem is resolved'));
        });

        it('a failed bind is listen-failed: alerted once with its code, retried, then listening', async () => {
            const listen = jest.fn<Promise<unknown>, []>(async () => {
                throw Object.assign(new Error('listen EADDRINUSE: address already in use'), { code: 'EADDRINUSE' });
            });
            const h = harness({ files: { 'c.pem': pair.cert, 'k.pem': pair.key }, listen });
            h.listener.announce();
            await h.listener.check();
            await h.listener.check();
            expect(h.boot.lanListener()).toEqual({ state: 'listen-failed', sinceMs: NOW, plainHttp: false, certificate: null, error: 'EADDRINUSE' });
            expect(h.alerts.map(a => [a.kind, a.data])).toEqual([['LISTEN_FAILED', { error: 'EADDRINUSE', address: '0.0.0.0:443' }]]);
            expect(h.logger.error).toHaveBeenCalledTimes(1);
            expect(h.intervals).toHaveLength(1);

            listen.mockImplementation(async () => undefined);
            h.intervals[0].fn();
            await flush();
            expect(h.boot.lanListener().state).toBe('listening');
            expect(h.intervals[0].cleared).toBe(true);
        });

        it('serves plain HTTP (dev) without any certificate', async () => {
            const h = harness({ tls: null });
            await h.listener.check();
            expect(h.server.setSecureContext).not.toHaveBeenCalled();
            expect(h.listen).toHaveBeenCalledTimes(1);
            expect(h.boot.lanListener()).toMatchObject({ state: 'listening', plainHttp: true });
            expect(h.watched.size).toBe(0);
            expect(h.logger.warn).toHaveBeenCalledWith(expect.stringContaining('plain HTTP'));
            await h.listener.check(); // listening + plain HTTP: nothing to reload
            expect(h.listen).toHaveBeenCalledTimes(1);
        });

        it('never binds before recording started, once the shutdown began, or after a failed boot', async () => {
            for (const phase of ['booting', 'stopping', 'stopped', 'failed'] as const) {
                const h = harness({ files: { 'c.pem': pair.cert, 'k.pem': pair.key }, phase });
                await h.listener.check();
                expect(h.listen).not.toHaveBeenCalled();
                expect(h.boot.lanListener().state).toBe('not-started');
            }
            const started = harness({ files: { 'c.pem': pair.cert, 'k.pem': pair.key }, phase: 'started' });
            await started.listener.check();
            expect(started.listen).toHaveBeenCalledTimes(1);
        });

        it('stop() during a bind closes the server once the bind completes, stops the timer, and ends all checks', async () => {
            let finishBind!: () => void;
            const listen = jest.fn<Promise<unknown>, []>(() => new Promise<void>(resolve => (finishBind = resolve)));
            const h = harness({ listen });
            await h.listener.check(); // waiting: starts the timer
            h.files['c.pem'] = pair.cert;
            h.files['k.pem'] = pair.key;
            const binding = h.listener.check();
            await flush();
            h.listener.stop();
            h.listener.stop();
            expect(h.intervals[0].cleared).toBe(true);
            finishBind();
            await binding;
            expect(h.server.close).toHaveBeenCalledTimes(1);
            expect(h.boot.lanListener().state).toBe('waiting-certificate');
            await h.listener.check();
            expect(listen).toHaveBeenCalledTimes(1);
            h.listener.announce();
            expect(h.alerts).toEqual([]); // stopped: the held alert is dropped
        });

        it('coalesces checks that arrive during a run into one more run', async () => {
            let finishBind!: () => void;
            const listen = jest.fn<Promise<unknown>, []>(() => new Promise<void>(resolve => (finishBind = resolve)));
            const h = harness({ files: { 'c.pem': pair.cert, 'k.pem': pair.key }, listen });
            const first = h.listener.check();
            await flush();
            const second = h.listener.check();
            const third = h.listener.check();
            expect(second).toBe(first);
            expect(third).toBe(first);
            finishBind();
            await first;
            expect(listen).toHaveBeenCalledTimes(1);
            // The coalesced re-run found the listener bound and reloaded the pair (certificate-installed semantics).
            expect(h.server.setSecureContext).toHaveBeenCalledTimes(2);
        });

        it('once listening, check() hot-reloads the pair (TLS ≥ 1.2 kept) and keeps the served one when the new pair does not load', async () => {
            const h = harness({ files: { 'c.pem': pair.cert, 'k.pem': pair.key } });
            await h.listener.check();
            const fresh = selfSignedCertificate({ cn: 'renewed' });
            h.files['c.pem'] = fresh.cert;
            h.files['k.pem'] = fresh.key;
            await h.listener.check();
            expect(h.server.setSecureContext).toHaveBeenLastCalledWith({ cert: Buffer.from(fresh.cert), key: Buffer.from(fresh.key), minVersion: 'TLSv1.2' });
            expect(h.logger.log).toHaveBeenCalledWith('TLS certificate reloaded');

            h.files['k.pem'] = other.key;
            await h.listener.check();
            expect(h.server.setSecureContext).toHaveBeenCalledTimes(2);
            expect(h.logger.error).toHaveBeenCalledWith(expect.stringMatching(/reload failed, keeping the current one: .*key values mismatch/i));
            expect(h.boot.lanListener().state).toBe('listening');
            expect(h.listen).toHaveBeenCalledTimes(1);
        });

        it('a throwing alert subscriber or an unexpected error never rejects a check', async () => {
            const h = harness();
            h.bus.subscribe('alert', () => {
                throw new Error('listener boom');
            });
            h.listener.announce();
            await expect(h.listener.check()).resolves.toBeUndefined();
            expect(h.boot.lanListener().state).toBe('waiting-certificate');

            const broken = harness({ files: { 'c.pem': pair.cert, 'k.pem': pair.key } });
            (broken.server as { setSecureContext?: unknown }).setSecureContext = undefined;
            await expect(broken.listener.check()).resolves.toBeUndefined();
            expect(broken.logger.error).toHaveBeenCalledWith(expect.stringContaining('cannot take a certificate'));
            expect(broken.listen).not.toHaveBeenCalled();
        });
    });

    describe('runCli', () => {
        const config = (): BoxConfig => parseBoxConfig(DEV_RAW, path.join(dir, 'dev.json'));

        it("builds the default context with NestFactory.createApplicationContext, in run mode 'cli', and holds the process for the command", async () => {
            const io = capture();
            const fakes = lifecycleFakes();
            const hold = recordingHold();
            let mode: unknown;
            const cli: CliPort = {
                run: jest.fn(async () => {
                    hold.log.push('run');
                    return EDGE_EXIT.ok;
                }),
            };
            const { createContext, closed } = cliContext(cli, fakes, ctx => (mode = ctx.get(EDGE_RUN_MODE, { strict: false })));
            const spy = jest.spyOn(NestFactory, 'createApplicationContext').mockImplementation(((module: DynamicModule, options: never) => createContext(module, options)) as never);
            try {
                await expect(runCli(config(), { name: 'capture-list' }, { out: io.out, holdProcess: hold.holdProcess })).resolves.toBe(EDGE_EXIT.ok);
                expect(spy).toHaveBeenCalledTimes(1);
                expect(spy.mock.calls[0][1]).toEqual({ logger: ['error', 'warn'], abortOnError: false });
            } finally {
                spy.mockRestore();
            }
            expect(mode).toBe('cli');
            expect(fakes.kernel.start).not.toHaveBeenCalled(); // 'serve' would start the kernel beside the running box
            expect(fakes.uplink.start).not.toHaveBeenCalled();
            expect(closed()).toBe(1);
            expect(hold.log).toEqual(['hold', 'run', 'release']);
            expect(io.errors).toEqual([]);
        });

        it('resolves the command exit code and closes the context', async () => {
            const cli: CliPort = {
                run: jest.fn(async (_cmd: unknown, out: CliOutput) => {
                    out.log('ok');
                    return EDGE_EXIT.ok;
                }),
            };
            const { createContext, closed } = cliContext(cli);
            const io = capture();
            await expect(runCli(config(), { name: 'status', json: true }, { logger: false, out: io.out, createContext })).resolves.toBe(EDGE_EXIT.ok);
            expect(io.logs).toEqual(['ok']);
            expect(closed()).toBe(1);
        });

        it('maps a thrown error to 70, prints it and still closes the context', async () => {
            const { createContext, closed } = cliContext({ run: jest.fn(async () => Promise.reject(new Error('disk gone'))) });
            const io = capture();
            await expect(runCli(config(), { name: 'status', json: false }, { logger: false, out: io.out, createContext })).resolves.toBe(EDGE_EXIT.software);
            expect(io.errors).toEqual(['rt-edge: status failed: disk gone']);
            expect(closed()).toBe(1);
        });

        it('maps NotImplemented to 70 and closes the context', async () => {
            const { createContext, closed } = cliContext({ run: jest.fn(async () => notImplemented('CliPort', 'run')) });
            const io = capture();
            await expect(runCli(config(), { name: 'recover', journal: '/j', out: null }, { logger: false, out: io.out, createContext })).resolves.toBe(EDGE_EXIT.software);
            expect(io.errors).toEqual(['rt-edge: "recover" is not available in this build yet']);
            expect(closed()).toBe(1);
        });

        it('answers 70 when the context cannot be built (nothing to close) and still releases the hold', async () => {
            const io = capture();
            const hold = recordingHold();
            const createContext: EdgeContextFactory = async () => Promise.reject(new Error('module graph broken'));
            await expect(runCli(config(), { name: 'capture-list' }, { logger: false, out: io.out, createContext, holdProcess: hold.holdProcess })).resolves.toBe(EDGE_EXIT.software);
            expect(io.errors).toEqual(['rt-edge: capture-list failed: module graph broken']);
            expect(hold.log).toEqual(['hold', 'release']);
        });
    });
});
