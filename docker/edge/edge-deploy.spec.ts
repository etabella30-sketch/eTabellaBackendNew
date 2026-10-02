/**
 * The venue box deploy artifacts (docker/edge, docs/rt-edge) agree with each other and with the rt-edge code they
 * deploy: the compose file, the systemd units, the box config template, the preflight, the CLI wrapper, the host
 * snippets and the docs.
 *
 * Run: npx jest -c docker/edge/jest.config.js (the repo's jest roots are apps/ and libs/ only).
 * Nothing here talks to Docker or systemd; the only sockets are loopback HTTPS servers on port 0.
 */
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as https from 'https';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import { READINESS_KEYS } from '../../apps/rt-edge/src/contracts/readiness';
import { EDGE_ROUTES } from '../../apps/rt-edge/src/contracts/routes';
import {
    BOX_CONFIG_ENV,
    BoxConfig,
    BoxConfigError,
    DEFAULT_EDGE_FEATURES,
    EDGE_SHUTDOWN_RESERVE_MS,
    EDGE_SHUTDOWN_STEP_MAX_MS,
    EDGE_SHUTDOWN_STEPS,
    EDGE_STOP_GRACE_MS,
    parseBoxConfig,
} from '../../apps/rt-edge/src/ports/box-config';
import { EDGE_EXIT, EDGE_USAGE, parseEdgeArgs } from '../../apps/rt-edge/src/ports/cli.port';
import { selfSignedCertificate } from '../../apps/rt-edge/src/ports/testing/self-signed';

/** The command an argv names, as main.ts decides it (ports/cli.port.ts `parseEdgeArgs`, `cert install` included). */
const commandName = (words: readonly string[]): string => parseEdgeArgs(words).name;

// js-yaml (already in node_modules, no new dependency) and the release tooling are plain CommonJS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml: { load(text: string): unknown } = require('js-yaml');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const releaseEdge: {
    FE_IMAGE_DIR: string;
    IMAGE_REPO: string;
    SERVICE_DOCKERFILE: string;
    layerDockerfile(ctx: Record<string, string>, fe: { bundleDir: string } | null): string;
} = require('../../tools/ci/release-edge/components.js');

const ROOT = path.resolve(__dirname, '..', '..');
const read = (rel: string): string => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Box-side paths every artifact must agree on. */
const DATA_DIR = '/var/lib/etabella-edge';
const CONFIG_FILE = '/etc/etabella-edge/box-config.json';
const HOST_STATUS_DIR = '/run/etabella-edge/host';
const COMPOSE_ON_BOX = '/opt/etabella-edge/docker-compose.yml';
const PREFLIGHT_ON_BOX = '/usr/local/lib/etabella-edge/edge-preflight.sh';
const CHECK_JS_ON_BOX = '/usr/local/lib/etabella-edge/preflight-check.js';
const HOSTSTATUS_ON_BOX = '/usr/local/lib/etabella-edge/etabella-edge-hoststatus.sh';
const MAIN_IN_IMAGE = '/usr/src/app/main.js';

/** Files in docker/edge that only serve the repo (not copied to a box). */
const REPO_ONLY = new Set(['edge-deploy.spec.ts', 'jest.config.js', '.gitattributes']);

// ---------------------------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------------------------

type Service = Record<string, any>;
interface Compose {
    readonly name?: string;
    readonly services: Record<string, Service>;
}

const compose = yaml.load(read('docker/edge/docker-compose.yml')) as Compose;
const service = compose.services['rt-edge'];
const exampleRaw = JSON.parse(read('docker/edge/box-config.example.json')) as Record<string, any>;
const example: BoxConfig = parseBoxConfig(exampleRaw, CONFIG_FILE);

type Unit = Map<string, Array<[string, string]>>;

/** A systemd unit / drop-in: sections of key=value lines (keys may repeat). */
function parseUnit(text: string): Unit {
    const unit: Unit = new Map();
    let current: Array<[string, string]> | null = null;
    for (const raw of text.split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#') || line.startsWith(';')) continue;
        const header = /^\[(.+)\]$/.exec(line);
        if (header) {
            current = unit.get(header[1]) ?? [];
            unit.set(header[1], current);
            continue;
        }
        const eq = line.indexOf('=');
        if (!current || eq <= 0) throw new Error(`not a unit line: ${line}`);
        current.push([line.slice(0, eq).trim(), line.slice(eq + 1).trim()]);
    }
    return unit;
}

const unitValues = (unit: Unit, section: string, key: string): string[] =>
    (unit.get(section) ?? []).filter(([k]) => k === key).map(([, v]) => v);

function unitValue(unit: Unit, section: string, key: string): string {
    const values = unitValues(unit, section, key);
    if (values.length !== 1) throw new Error(`[${section}] ${key}: expected one value, got ${JSON.stringify(values)}`);
    return values[0];
}

/** systemd / compose durations used here: `120s`, `2m`, `150`. */
function seconds(value: string): number {
    const m = /^(\d+)\s*(s|m|min)?$/.exec(String(value).trim());
    if (!m) throw new Error(`not a duration: ${value}`);
    return Number(m[1]) * (m[2] && m[2].startsWith('m') ? 60 : 1);
}

/** A shell variable assignment at the start of a line: `NAME=value`. */
function shellVar(script: string, name: string): string {
    const m = new RegExp(`^${name}=(.*)$`, 'm').exec(script);
    if (!m) throw new Error(`${name}= not found`);
    return m[1].trim();
}

function bindVolume(target: string): Record<string, any> {
    const volume = (service.volumes as Array<Record<string, any>>).find(v => v.target === target);
    if (!volume) throw new Error(`no volume with target ${target}`);
    return volume;
}

/** True when absolute `p` is `dir` or inside it (platform rules, like box-config.ts). */
function isUnder(dir: string, p: string): boolean {
    const rel = path.relative(path.resolve(dir), path.resolve(p));
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

interface RunResult {
    readonly code: number;
    readonly stdout: string;
    readonly stderr: string;
}

/** Run node asynchronously (an in-process HTTPS server must keep answering meanwhile). */
function runNode(args: readonly string[], env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
    return new Promise(resolve => {
        execFile(process.execPath, [...args], { env: { ...process.env, ...env }, timeout: 30_000, cwd: ROOT }, (err, stdout, stderr) => {
            // A non-zero exit puts the status in err.code (a number); a kill by timeout leaves no number.
            const status = err ? (err as unknown as { code?: unknown }).code : 0;
            resolve({ code: typeof status === 'number' ? status : -1, stdout: String(stdout), stderr: String(stderr) });
        });
    });
}

/** Every file under docker/edge that goes onto a box, as POSIX paths relative to docker/edge. */
function deployableFiles(): string[] {
    const base = path.join(ROOT, 'docker', 'edge');
    const out: string[] = [];
    const walk = (dir: string): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else out.push(path.relative(base, full).split(path.sep).join('/'));
        }
    };
    walk(base);
    return out.filter(f => !REPO_ONLY.has(f)).sort();
}

// ---------------------------------------------------------------------------------------------------------------
// docker-compose.yml
// ---------------------------------------------------------------------------------------------------------------

describe('docker/edge/docker-compose.yml', () => {
    it('defines exactly one service, rt-edge, in project etabella-edge', () => {
        expect(compose.name).toBe('etabella-edge');
        expect(Object.keys(compose.services)).toEqual(['rt-edge']);
        expect(service.container_name).toBe('rt-edge');
    });

    it('runs only the released image, named by a required RT_EDGE_IMAGE, never built or pulled', () => {
        expect(String(service.image)).toMatch(/^\$\{RT_EDGE_IMAGE:\?[^}]+\}$/);
        expect(service.build).toBeUndefined();
        expect(service.pull_policy).toBe('never');
    });

    it('interpolates nothing but RT_EDGE_IMAGE (no stray $ in values)', () => {
        const valueLines = read('docker/edge/docker-compose.yml')
            .split('\n')
            .filter(l => !l.trim().startsWith('#'));
        const dollars = valueLines.join('\n').match(/\$+\{?[A-Za-z_]*/g) ?? [];
        expect(dollars).toEqual(['${RT_EDGE_IMAGE']);
    });

    it('uses the host network and publishes nothing (ufw and the app decide who reaches 443 and 2500)', () => {
        expect(service.network_mode).toBe('host');
        expect(service.ports).toBeUndefined();
        expect(service.expose).toBeUndefined();
        expect(service.networks).toBeUndefined();
        expect(service.hostname).toBeUndefined();
        expect(example.http.port).toBe(443);
        expect(example.transmitter.listenPort).toBe(2500);
    });

    it('reads the JSON box config only, mounted read-only at RT_EDGE_CONFIG', () => {
        expect(BOX_CONFIG_ENV).toBe('RT_EDGE_CONFIG');
        // The only other variable is not configuration: libuv's threadpool size (review 28).
        expect(Object.keys(service.environment)).toEqual([BOX_CONFIG_ENV, 'UV_THREADPOOL_SIZE']);
        expect(service.environment[BOX_CONFIG_ENV]).toBe(CONFIG_FILE);
        const config = bindVolume(CONFIG_FILE);
        expect(config).toMatchObject({ type: 'bind', source: CONFIG_FILE, read_only: true, bind: { create_host_path: false } });
        expect(service.env_file).toBeUndefined();
        for (const v of service.volumes as Array<Record<string, any>>) expect(String(v.source)).not.toMatch(/(^|\/)\.env/);
    });

    it('does not override TZ (the image keeps the same zone as realtime-server)', () => {
        expect(service.environment.TZ).toBeUndefined();
    });

    it('raises libuv\'s threadpool so DNS lookups with the WAN down cannot queue the journal\'s fdatasyncs (review 28)', () => {
        // A string (compose environment values are strings); the same value main.ts uses when it is unset.
        expect(service.environment.UV_THREADPOOL_SIZE).toBe('16');
        expect(read('apps/rt-edge/src/main.ts')).toMatch(/EDGE_UV_THREADPOOL_SIZE = 16;/);
    });

    it('mounts the data DIRECTORY at the same path, never the SQLite file, and never creates it', () => {
        expect(bindVolume(DATA_DIR)).toEqual({ type: 'bind', source: DATA_DIR, target: DATA_DIR, bind: { create_host_path: false } });
        for (const v of service.volumes as Array<Record<string, any>>) {
            expect(String(v.target)).not.toMatch(/\.sqlite(-wal|-shm)?$/);
        }
        expect(example.paths.dataDir).toBe(path.resolve(DATA_DIR));
    });

    it('mounts the host status directory read-only at the same path', () => {
        expect(bindVolume(HOST_STATUS_DIR)).toMatchObject({ type: 'bind', source: HOST_STATUS_DIR, read_only: true });
    });

    it('keeps every path the box writes on the data mount (the container root is read-only)', () => {
        expect(service.read_only).toBe(true);
        expect((service.tmpfs as string[]).some(t => t.startsWith('/tmp:'))).toBe(true);
        const written = [
            example.paths.dataDir,
            example.paths.stateDb,
            example.paths.journalDir,
            example.paths.captureDir,
            example.paths.certDir,
            example.paths.deviceKeyFile,
            example.http.tls!.certFile,
            example.http.tls!.keyFile,
        ];
        for (const p of written) expect({ p, under: isUnder(DATA_DIR, p) }).toEqual({ p, under: true });
    });

    it('drops every capability except NET_BIND_SERVICE (443) and SYS_TIME (cloud-time fallback)', () => {
        expect(service.cap_drop).toEqual(['ALL']);
        expect([...service.cap_add].sort()).toEqual(['NET_BIND_SERVICE', 'SYS_TIME']);
        expect(service.security_opt).toContain('no-new-privileges:true');
        expect(service.privileged).toBeUndefined();
        expect(service.devices).toBeUndefined();
        expect(service.init).toBe(true);
    });

    it('stops gracefully: SIGTERM and a grace period longer than the five shutdown steps', () => {
        expect(service.stop_signal).toBe('SIGTERM');
        const grace = seconds(service.stop_grace_period);
        expect(grace).toBeGreaterThanOrEqual((5 * example.shutdownTimeoutMs) / 1000 + 10);
    });

    it('restarts a crashed container and caps its logs at json-file 50m x 3', () => {
        expect(service.restart).toBe('unless-stopped');
        expect(service.logging).toEqual({ driver: 'json-file', options: { 'max-size': '50m', 'max-file': '3' } });
    });

    it('replaces the image healthcheck with an HTTPS probe of the unauthenticated /edge/ping on loopback', () => {
        const test = service.healthcheck.test as string[];
        expect(test.slice(0, 3)).toEqual(['CMD', 'node', '-e']);
        expect(test).toHaveLength(4);
        expect(EDGE_ROUTES.ping).toEqual({ method: 'GET', path: '/edge/ping', auth: 'none' });
        expect(test[3]).toContain(`path:'${EDGE_ROUTES.ping.path}'`);
        expect(test[3]).toContain(`port:${example.http.port}`);
        expect(test[3]).toContain(`host:'127.0.0.1'`);
        expect(example.http.host).toBe('0.0.0.0');
        expect(seconds(service.healthcheck.timeout)).toBeGreaterThan(4);
    });

    it('agrees with the image: the Dockerfile the release builds from runs /usr/src/app/main.js', () => {
        expect(releaseEdge.SERVICE_DOCKERFILE).toBe('docker/microservices/service.Dockerfile');
        expect(read(releaseEdge.SERVICE_DOCKERFILE)).toContain(`CMD ["node", "${MAIN_IN_IMAGE}"]`);
    });
});

describe('the compose healthcheck probe (run against a loopback HTTPS server)', () => {
    const probe = service.healthcheck.test[3] as string;
    const { cert, key } = selfSignedCertificate({ cn: 'k7q2m9x4.etabella-edge.net', hosts: ['k7q2m9x4.etabella-edge.net'] });
    let status = 200;
    const seen: string[] = [];
    const server = https.createServer({ cert, key }, (req, res) => {
        seen.push(`${req.method} ${req.url}`);
        res.statusCode = status;
        res.setHeader('content-type', 'application/json');
        res.end('{"msg":1}');
    });
    let port = 0;

    beforeAll(async () => {
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
        port = (server.address() as net.AddressInfo).port;
    });
    afterAll(async () => {
        await new Promise<void>(resolve => server.close(() => resolve()));
    });

    const probeOn = (p: number): string => {
        expect(probe.split('port:443').length).toBe(2);
        return probe.replace('port:443', `port:${p}`);
    };

    it('is healthy (exit 0) on 200, although the certificate names the slug, not 127.0.0.1', async () => {
        status = 200;
        seen.length = 0;
        const res = await runNode(['-e', probeOn(port)]);
        expect(res.code).toBe(0);
        expect(seen).toEqual(['GET /edge/ping']);
    });

    it('is unhealthy (exit 1) on any other status', async () => {
        status = 503;
        const res = await runNode(['-e', probeOn(port)]);
        expect(res.code).toBe(1);
    });

    it('is unhealthy (exit 1) when nothing listens (no certificate yet, port taken, process down)', async () => {
        const closed = net.createServer();
        await new Promise<void>(resolve => closed.listen(0, '127.0.0.1', () => resolve()));
        const freePort = (closed.address() as net.AddressInfo).port;
        await new Promise<void>(resolve => closed.close(() => resolve()));
        const res = await runNode(['-e', probeOn(freePort)]);
        expect(res.code).toBe(1);
    });
});

// ---------------------------------------------------------------------------------------------------------------
// box-config.example.json
// ---------------------------------------------------------------------------------------------------------------

describe('docker/edge/box-config.example.json', () => {
    it('is accepted by the app parser as a production config with TLS', () => {
        expect(example.mode).toBe('production');
        expect(example.http.tls).not.toBeNull();
        expect(example.http.tls!.certFile).toBe(path.join(example.paths.certDir, 'fullchain.pem'));
        expect(example.http.tls!.keyFile).toBe(path.join(example.paths.certDir, 'privkey.pem'));
        expect(example.cloud.origin).toBe('https://etabella.net');
    });

    it('binds the CAT listener to an address inside the CAT network (S-D14)', () => {
        expect(example.transmitter.bindAddress).toBe('192.168.20.2');
        expect(example.transmitter.networkCidr).toBe('192.168.20.0/24');
    });

    it('ships the v1 feature defaults', () => {
        expect(example.features).toEqual(DEFAULT_EDGE_FEATURES);
    });

    it('serves the FE bundle from where release-edge bakes it (not the parser default /app/public)', () => {
        expect(example.paths.publicDir).toBe(path.resolve(releaseEdge.FE_IMAGE_DIR));
        expect(releaseEdge.FE_IMAGE_DIR).toBe('/usr/src/app/fe-edge');
    });

    it('keeps comments only in the top-level $comment (sections refuse unknown keys)', () => {
        expect(Array.isArray(exampleRaw.$comment)).toBe(true);
        for (const line of exampleRaw.$comment) expect(typeof line).toBe('string');
        for (const [key, value] of Object.entries(exampleRaw)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) expect(Object.keys(value).some(k => k.startsWith('$'))).toBe(false);
            expect(key === '$comment' || !key.startsWith('$')).toBe(true);
        }
    });

    it('holds nothing secret', () => {
        const text = read('docker/edge/box-config.example.json').toLowerCase();
        for (const word of ['password', 'secret', 'token"', 'pghost', 'database', 'jwt']) {
            expect({ word, found: text.includes(`"${word}`) }).toEqual({ word, found: false });
        }
    });

    it('carries placeholder commits that the preflight will refuse until copied from the manifest', () => {
        expect(example.release.version).toBe('1.0.0');
        expect(example.release.backendCommit).toMatch(/^REPLACE-/);
        expect(example.release.feCommit).toMatch(/^REPLACE-/);
    });
});

// ---------------------------------------------------------------------------------------------------------------
// systemd units and drop-ins
// ---------------------------------------------------------------------------------------------------------------

describe('docker/edge/rt-edge.service', () => {
    const unit = parseUnit(read('docker/edge/rt-edge.service'));

    const dependencyNames = (key: string): string[] => unitValues(unit, 'Unit', key).join(' ').split(/\s+/).filter(Boolean);

    it('starts after Docker and the encrypted data directory, without waiting for the internet', () => {
        expect(unitValue(unit, 'Unit', 'After').split(/\s+/)).toEqual(expect.arrayContaining(['docker.service', 'local-fs.target']));
        expect(unitValue(unit, 'Unit', 'RequiresMountsFor').split(/\s+/)).toEqual(expect.arrayContaining([DATA_DIR, '/etc/etabella-edge', '/opt/etabella-edge']));
        expect(unitValue(unit, 'Unit', 'After')).not.toContain('time-sync.target');
        expect(dependencyNames('Requires')).not.toContain('network-online.target');
    });

    it('only Wants docker.service, so a dockerd restart is not passed on and live-restore keeps the CAT socket', () => {
        // systemd.unit(5): Requires=/BindsTo=/PartOf= stop or restart this unit when docker.service is explicitly
        // restarted (systemctl restart docker, a docker-ce postinst); ExecStop would then stop the container.
        expect(dependencyNames('Wants')).toContain('docker.service');
        for (const key of ['Requires', 'Requisite', 'BindsTo', 'PartOf', 'Upholds']) {
            expect({ key, docker: dependencyNames(key).some(n => n.startsWith('docker.')) }).toEqual({ key, docker: false });
        }
        expect(JSON.parse(read('docker/edge/host/daemon.json'))['live-restore']).toBe(true);
    });

    it('runs the preflight as its main process, which execs compose up; stops with compose stop (never down)', () => {
        expect(unitValue(unit, 'Service', 'Type')).toBe('oneshot');
        expect(unitValue(unit, 'Service', 'RemainAfterExit')).toBe('yes');
        expect(unitValue(unit, 'Service', 'ExecStart')).toBe(
            `${PREFLIGHT_ON_BOX} /usr/bin/docker compose --file ${COMPOSE_ON_BOX} up --detach --remove-orphans`,
        );
        expect(unitValue(unit, 'Service', 'ExecStop')).toBe(`/usr/bin/docker compose --file ${COMPOSE_ON_BOX} stop`);
        expect(read('docker/edge/rt-edge.service')).not.toMatch(/^Exec[A-Za-z]*=.*\bdown\b/m);
        expect(unitValue(unit, 'Service', 'Environment')).toBe(`COMPOSE_PROJECT_NAME=${compose.name}`);
    });

    it('retries transient failures but not a preflight refusal (exit 78 = EDGE_EXIT.config)', () => {
        expect(unitValue(unit, 'Service', 'Restart')).toBe('on-failure');
        expect(unitValue(unit, 'Service', 'RestartPreventExitStatus')).toBe(String(EDGE_EXIT.config));
        expect(EDGE_EXIT.config).toBe(78);
        // systemd.service(5) applies RestartPreventExitStatus= to the MAIN process's exit status only. A preflight
        // in ExecStartPre= (or any other control process) would be retried every RestartSec, forever, so the
        // preflight must be the first word of ExecStart and nothing may run before it.
        for (const key of ['ExecStartPre', 'ExecCondition', 'ExecStartPost']) {
            expect({ key, values: unitValues(unit, 'Service', key) }).toEqual({ key, values: [] });
        }
        expect(unitValue(unit, 'Service', 'ExecStart').split(/\s+/)[0]).toBe(PREFLIGHT_ON_BOX);
        expect(read('docker/edge/edge-preflight.sh')).toMatch(/^if \[ "\$#" -gt 0 \]; then exec "\$@"; fi$/m);
    });

    it('waits longer to stop than the container grace period', () => {
        expect(seconds(unitValue(unit, 'Service', 'TimeoutStopSec'))).toBeGreaterThan(seconds(service.stop_grace_period));
    });

    it('takes no EnvironmentFile (the image is named in a drop-in; never a .env)', () => {
        expect(unitValues(unit, 'Service', 'EnvironmentFile')).toEqual([]);
        expect(unitValue(unit, 'Install', 'WantedBy')).toBe('multi-user.target');
    });
});

describe('docker/edge/release.conf.example', () => {
    const unit = parseUnit(read('docker/edge/release.conf.example'));

    it('names a released rt-edge image whose tag matches the example config version', () => {
        const env = unitValues(unit, 'Service', 'Environment');
        expect(env).toHaveLength(1);
        const m = /^RT_EDGE_IMAGE=(.+):(rt-edge-v(\d+\.\d+\.\d+))$/.exec(env[0]);
        expect(m).not.toBeNull();
        expect(m![1]).toBe(releaseEdge.IMAGE_REPO);
        expect(m![3]).toBe(example.release.version);
    });

    it('mentions no variable but RT_EDGE_IMAGE and the lab switch', () => {
        const names = [...read('docker/edge/release.conf.example').matchAll(/Environment=([A-Z_]+)=/g)].map(m => m[1]);
        expect(names.sort()).toEqual(['ETABELLA_EDGE_LAB', 'RT_EDGE_IMAGE']);
    });
});

describe('docker/edge/host units and snippets', () => {
    it('hoststatus: runs the installed script in a loop and keeps /run/etabella-edge across restarts', () => {
        const unit = parseUnit(read('docker/edge/host/etabella-edge-hoststatus.service'));
        expect(unitValue(unit, 'Service', 'ExecStart')).toBe(`${HOSTSTATUS_ON_BOX} --loop`);
        expect(unitValue(unit, 'Service', 'RuntimeDirectory')).toBe('etabella-edge');
        expect(unitValue(unit, 'Service', 'RuntimeDirectoryPreserve')).toBe('yes');
        expect(unitValue(unit, 'Unit', 'Before')).toBe('rt-edge.service');
        const script = read('docker/edge/host/etabella-edge-hoststatus.sh');
        expect(script).toContain(`DIR=\${ETABELLA_EDGE_HOST_STATUS_DIR:-${HOST_STATUS_DIR}}`);
    });

    it('docker drop-in: dockerd waits for the data mount', () => {
        const unit = parseUnit(read('docker/edge/host/docker-etabella-edge.conf'));
        expect(unitValue(unit, 'Unit', 'RequiresMountsFor').split(/\s+/)).toContain(DATA_DIR);
    });

    it('daemon.json: live-restore, the same log caps as compose, no Docker iptables', () => {
        const daemon = JSON.parse(read('docker/edge/host/daemon.json'));
        expect(daemon['live-restore']).toBe(true);
        expect(daemon['log-driver']).toBe(service.logging.driver);
        expect(daemon['log-opts']).toEqual(service.logging.options);
        expect(daemon.iptables).toBe(false);
        expect(daemon['no-new-privileges']).toBe(true);
    });

    it('journald: SystemMaxUse=500M', () => {
        expect(unitValue(parseUnit(read('docker/edge/host/journald-etabella-edge.conf')), 'Journal', 'SystemMaxUse')).toBe('500M');
    });

    it('chrony: NTS sources only', () => {
        const servers = read('docker/edge/host/chrony-etabella-edge.conf')
            .split('\n')
            .filter(l => /^(server|pool)\s/.test(l));
        expect(servers.length).toBeGreaterThanOrEqual(2);
        for (const s of servers) expect(s).toMatch(/^server \S+ iburst nts$/);
    });

    it('apt: every periodic job off', () => {
        const text = read('docker/edge/host/apt-20auto-upgrades');
        const settings = [...text.matchAll(/^APT::Periodic::([\w-]+) "(\d+)";$/gm)].map(m => [m[1], m[2]]);
        expect(settings.map(([k]) => k)).toEqual(expect.arrayContaining(['Update-Package-Lists', 'Unattended-Upgrade']));
        for (const [, v] of settings) expect(v).toBe('0');
    });
});

// ---------------------------------------------------------------------------------------------------------------
// scripts
// ---------------------------------------------------------------------------------------------------------------

describe('docker/edge scripts', () => {
    const scripts: Array<[string, RegExp]> = [
        ['docker/edge/edge-preflight.sh', /^#!\/usr\/bin\/env bash\n/],
        ['docker/edge/etabella-edge', /^#!\/usr\/bin\/env bash\n/],
        ['docker/edge/host/etabella-edge-hoststatus.sh', /^#!\/bin\/sh\n/],
    ];

    it.each(scripts)('%s has a shebang, strict mode and LF line endings', (file, shebang) => {
        const text = read(file);
        expect(text).toMatch(shebang);
        expect(text.includes('\r')).toBe(false);
        expect(text).toMatch(file.endsWith('hoststatus.sh') ? /^set -eu$/m : /^set -euo pipefail$/m);
    });

    it('every file copied to a box has LF line endings (scripts, units, compose, JSON, conf)', () => {
        for (const file of deployableFiles()) {
            expect({ file, crlf: fs.readFileSync(path.join(ROOT, 'docker', 'edge', file)).includes('\r') }).toEqual({ file, crlf: false });
        }
        expect(read('docker/edge/.gitattributes')).toMatch(/^\* text=auto eol=lf$/m);
    });

    describe('edge-preflight.sh', () => {
        const script = read('docker/edge/edge-preflight.sh');

        it('checks the same paths the compose file mounts (host paths under the harness-only $R prefix)', () => {
            expect(shellVar(script, 'R')).toBe('${EDGE_PREFLIGHT_ROOT:-}');
            expect(shellVar(script, 'CONFIG')).toBe(`$R${CONFIG_FILE}`);
            expect(shellVar(script, 'CONTAINER_CONFIG_DIR')).toBe(path.posix.dirname(service.environment[BOX_CONFIG_ENV]));
            expect(shellVar(script, 'DATA_DIR')).toBe(`$R${DATA_DIR}`);
            expect(shellVar(script, 'CONTAINER_DATA_DIR')).toBe(bindVolume(DATA_DIR).target);
            expect(shellVar(script, 'HOST_STATUS_DIR')).toBe(`$R${HOST_STATUS_DIR}`);
            expect(shellVar(script, 'COMPOSE_DIR')).toBe(`$R${path.posix.dirname(COMPOSE_ON_BOX)}`);
            expect(shellVar(script, 'CHECK_JS')).toBe(`$R${CHECK_JS_ON_BOX}`);
            expect(shellVar(script, 'DOCKER')).toBe('$R/usr/bin/docker');
            // Every host path goes through $R, so the spec's fake box can never touch the real one.
            for (const line of script.split('\n').filter(l => /^[A-Z_]+=\//.test(l))) {
                expect({ line, containerSide: /^CONTAINER_/.test(line) }).toEqual({ line, containerSide: true });
            }
        });

        it('refuses with 78 and treats an unanswering Docker as transient (1)', () => {
            expect(script).toMatch(/^\s*exit 78$/m);
            expect(script).toMatch(/Docker is not answering[^\n]*\n\s*exit 1$/m);
            expect(script).toContain('"$COMPOSE_DIR/.env"');
        });

        it('runs the in-image check with the image node, offline and locked down', () => {
            expect(script).toMatch(/run --rm --pull never --network none --read-only --cap-drop ALL/);
            expect(script).toContain('--entrypoint node');
            expect(script).toContain('"$IMAGE" --no-warnings /preflight/check.js');
        });

        it('passes exactly the variables preflight-check.js reads (except the spec-only sqlite hook)', () => {
            const passed = [...script.matchAll(/--env "?([A-Z_]+)=/g)].map(m => m[1]).sort();
            const readByCheck = [...read('docker/edge/preflight-check.js').matchAll(/env\.([A-Z_]+)|label\('([A-Z_]+)'\)/g)]
                .map(m => m[1] ?? m[2])
                .filter(v => v !== 'PREFLIGHT_SQLITE_MODULE');
            expect(passed).toEqual([...new Set(readByCheck)].sort());
        });

        it('compares the image labels release-edge writes', () => {
            const layer = releaseEdge.layerDockerfile(
                { tag: 'rt-edge-v1.0.0', backendCommit: 'b'.repeat(40), feCommit: 'f'.repeat(40), feedParseVersion: '1.0.0' },
                { bundleDir: 'fe-edge/browser' },
            );
            const labels = [...script.matchAll(/\$\(label ([a-z.-]+)\)/g)].map(m => m[1]);
            expect(labels.sort()).toEqual(['com.etabella.fe-commit', 'org.opencontainers.image.revision', 'org.opencontainers.image.version']);
            for (const name of labels) expect(layer).toContain(`${name}="`);
            expect(layer).toContain(`COPY fe-edge/browser/ ${releaseEdge.FE_IMAGE_DIR}/`);
        });
    });

    describe('etabella-edge (CLI wrapper)', () => {
        const script = read('docker/edge/etabella-edge');

        it('drives the compose file, service and container the unit uses', () => {
            expect(shellVar(script, 'COMPOSE_FILE')).toBe(COMPOSE_ON_BOX);
            expect(shellVar(script, 'SERVICE')).toBe(Object.keys(compose.services)[0]);
            expect(shellVar(script, 'CONTAINER')).toBe(service.container_name);
            expect(shellVar(script, 'UNIT')).toBe('rt-edge.service');
            expect(shellVar(script, 'MAIN')).toBe(MAIN_IN_IMAGE);
        });

        it('execs into a running box, else runs a one-off container; refuses enroll while running', () => {
            expect(script).toContain('exec docker compose --file "$COMPOSE_FILE" exec -T "$SERVICE" node "$MAIN" "$@"');
            expect(script).toContain('exec docker compose --file "$COMPOSE_FILE" run --rm --no-deps -T "$SERVICE" node "$MAIN" "$@"');
            expect(script).toMatch(/"\$1" = "enroll" \] && \[ "\$running" = "true" \][\s\S]*?exit 75/);
        });

        it('documents exactly the commands of EDGE_USAGE (cert install included), each a valid rt-edge command line', () => {
            const documented = [...script.matchAll(/^#\s+etabella-edge ([^\n]+)$/gm)].map(m =>
                m[1].replace(/\s+\(.*\)\s*$/, '').replace(/<[^>]*>/g, 'X').replace(/[[\]]/g, ' ').trim().split(/\s+/),
            );
            const names = documented.map(words => {
                const cmd = commandName(words);
                expect(cmd).not.toBe('serve');
                return cmd;
            });
            const usage = EDGE_USAGE.split('\n')
                .slice(1)
                .map(l => l.trim())
                .filter(l => !l.startsWith('('))
                .map(l => commandName(l.replace(/<[^>]*>/g, 'X').replace(/[[\]]/g, ' ').trim().split(/\s+/)));
            expect([...new Set(names)].sort()).toEqual([...new Set(usage)].sort());
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------
// preflight-check.js (run with this node, like the box runs it with the image's node)
// ---------------------------------------------------------------------------------------------------------------

describe('docker/edge/preflight-check.js', () => {
    const CHECK = path.join(ROOT, 'docker', 'edge', 'preflight-check.js');
    const COMMIT = '0123456789abcdef0123456789abcdef01234567';
    const FE_COMMIT = 'fedcba9876543210fedcba9876543210fedcba98';
    const LABELS = { LABEL_VERSION: 'rt-edge-v1.0.0', LABEL_REVISION: COMMIT, LABEL_FE_COMMIT: FE_COMMIT };
    let tmp = '';
    let publicDir = '';
    let good: Record<string, any>;

    beforeAll(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-preflight-'));
        publicDir = path.join(tmp, 'fe-edge');
        fs.mkdirSync(publicDir);
        fs.writeFileSync(path.join(publicDir, 'index.html'), '<!doctype html>');
        good = {
            ...exampleRaw,
            paths: { ...exampleRaw.paths, publicDir },
            release: { version: '1.0.0', backendCommit: COMMIT, feCommit: FE_COMMIT },
        };
    });
    afterAll(() => {
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    const BLANK_ENV = { PREFLIGHT_LAB: '', PREFLIGHT_SQLITE_MODULE: '', PREFLIGHT_CONFIG_DIR: '', PREFLIGHT_DATA_MOUNT: '', LABEL_VERSION: '', LABEL_REVISION: '', LABEL_FE_COMMIT: '' };

    /** Run the check on `config` (an object, raw text, or null = no file) and return its finding lines. */
    async function check(config: unknown, env: Record<string, string> = {}): Promise<string[]> {
        const file = path.join(tmp, `cfg-${Math.random().toString(36).slice(2)}.json`);
        if (config !== null) fs.writeFileSync(file, typeof config === 'string' ? config : JSON.stringify(config));
        // Same flags as edge-preflight.sh runs it with (node:sqlite prints an ExperimentalWarning otherwise).
        const res = await runNode(['--no-warnings', CHECK], { ...BLANK_ENV, PREFLIGHT_CONFIG: file, PREFLIGHT_DATA_MOUNT: DATA_DIR, ...env });
        expect({ code: res.code, stderr: res.stderr }).toEqual({ code: 0, stderr: '' });
        const lines = res.stdout.split('\n').filter(Boolean);
        for (const line of lines) expect(line).toMatch(/^(REFUSE|WARN) /);
        return lines;
    }
    const refusals = (lines: string[]): string[] => lines.filter(l => l.startsWith('REFUSE '));
    const warnings = (lines: string[]): string[] => lines.filter(l => l.startsWith('WARN '));

    it('passes a release-matched production config with no finding', async () => {
        expect(await check(good, LABELS)).toEqual([]);
    });

    it('accepts the tag, v-prefixed or bare semver, and 7+ hex commit prefixes', async () => {
        const short = { ...good, release: { version: 'v1.0.0', backendCommit: COMMIT.slice(0, 7), feCommit: FE_COMMIT.slice(0, 12).toUpperCase() } };
        expect(await check(short, LABELS)).toEqual([]);
        expect(await check({ ...good, release: { ...good.release, version: 'rt-edge-v1.0.0' } }, LABELS)).toEqual([]);
    });

    it('refuses the example as shipped (placeholder commits, no FE bundle at /usr/src/app/fe-edge here)', async () => {
        const lines = refusals(await check(exampleRaw, LABELS));
        expect(lines.some(l => l.includes('release.backendCommit'))).toBe(true);
        expect(lines.some(l => l.includes('release.feCommit'))).toBe(true);
        expect(lines.some(l => l.includes('no FE edge bundle at paths.publicDir'))).toBe(true);
    });

    it('refuses a version or commit that does not match the image', async () => {
        const lines = refusals(await check(good, { ...LABELS, LABEL_VERSION: 'rt-edge-v1.0.1' }));
        expect(lines).toEqual([expect.stringContaining('release.version "1.0.0" does not match the image (rt-edge-v1.0.1)')]);
        const commit = refusals(await check({ ...good, release: { ...good.release, backendCommit: 'abcdef1' } }, LABELS));
        expect(commit).toEqual([expect.stringContaining('release.backendCommit "abcdef1" does not match')]);
        const tooShort = refusals(await check({ ...good, release: { ...good.release, feCommit: FE_COMMIT.slice(0, 6) } }, LABELS));
        expect(tooShort).toEqual([expect.stringContaining('release.feCommit')]);
    });

    it('refuses a missing release.version when the image is labelled; warns on missing commits', async () => {
        const lines = await check({ ...good, release: { backendCommit: null } }, LABELS);
        expect(refusals(lines)).toEqual([expect.stringContaining('release.version is not set; the image is rt-edge-v1.0.0')]);
        expect(warnings(lines)).toEqual([
            expect.stringContaining('release.backendCommit is not set'),
            expect.stringContaining('release.feCommit is not set'),
        ]);
    });

    it('only warns for an image without release labels (docker prints <no value>)', async () => {
        const lines = await check(good, { LABEL_VERSION: '<no value>', LABEL_REVISION: '', LABEL_FE_COMMIT: '<no value>' });
        expect(refusals(lines)).toEqual([]);
        expect(warnings(lines)).toEqual([expect.stringContaining('not built by tools/ci/release-edge.js')]);
    });

    it('refuses a written path outside the data mount, absolute or relative to the config directory', async () => {
        const outside = await check({ ...good, paths: { ...good.paths, stateDb: '/tmp/edge.sqlite' } }, LABELS);
        expect(refusals(outside)).toEqual([expect.stringContaining('paths.stateDb resolves to')]);
        const relative = await check({ ...good, paths: { ...good.paths, journalDir: 'journal' } }, { ...LABELS, PREFLIGHT_CONFIG_DIR: '/etc/etabella-edge' });
        expect(refusals(relative)).toEqual([expect.stringContaining('paths.journalDir resolves to')]);
        const dataDir = await check({ ...good, paths: { publicDir } }, LABELS);
        expect(dataDir).toEqual([]);
        const moved = await check({ ...good, paths: { dataDir: '/srv/edge', publicDir } }, LABELS);
        expect(refusals(moved).map(l => l.split(' ')[1])).toEqual([
            'paths.dataDir',
            'paths.stateDb',
            'paths.journalDir',
            'paths.captureDir',
            'paths.certDir',
            'paths.deviceKeyFile',
        ]);
        const tls = await check({ ...good, http: { ...good.http, tls: { certFile: '/etc/ssl/box.pem', keyFile: `${DATA_DIR}/certs/privkey.pem` } } }, LABELS);
        expect(refusals(tls)).toEqual([expect.stringContaining('http.tls.certFile resolves to')]);
    });

    it('refuses dev mode and plain HTTP on a venue box; a lab box only warns', async () => {
        const dev = { ...good, mode: 'dev', http: { ...good.http, tls: null } };
        const venue = refusals(await check(dev, LABELS));
        expect(venue).toEqual([expect.stringContaining('dev mode'), expect.stringContaining('http.tls is null')]);
        const lab = await check(dev, { ...LABELS, PREFLIGHT_LAB: '1' });
        expect(refusals(lab)).toEqual([]);
        expect(warnings(lab).filter(l => l.includes('(allowed on a lab box)'))).toHaveLength(2);
    });

    it('lets a lab box run without the FE bundle, with a warning', async () => {
        const lines = await check({ ...good, paths: { ...good.paths, publicDir: path.join(tmp, 'nothing-here') } }, { ...LABELS, PREFLIGHT_LAB: '1' });
        expect(refusals(lines)).toEqual([]);
        expect(warnings(lines)).toEqual([expect.stringContaining('no FE edge bundle')]);
    });

    it('warns when the healthcheck target (0.0.0.0:443) is not what the box listens on', async () => {
        const lines = await check({ ...good, http: { host: '192.168.10.2', port: 8443 } }, LABELS);
        expect(refusals(lines)).toEqual([]);
        expect(warnings(lines)).toEqual([expect.stringContaining('http.host'), expect.stringContaining('http.port is 8443')]);
    });

    it('refuses an image whose node has no working node:sqlite', async () => {
        const lines = await check(good, { ...LABELS, PREFLIGHT_SQLITE_MODULE: 'node:no-such-builtin' });
        expect(refusals(lines)).toEqual([expect.stringContaining(`runs Node ${process.version} without a working node:no-such-builtin`)]);
    });

    it('this repo runtime has node:sqlite (the image must match it)', async () => {
        expect(await check(good, LABELS)).toEqual([]);
        const [major, minor] = process.versions.node.split('.').map(Number);
        expect(major > 22 || (major === 22 && minor >= 13)).toBe(true);
    });

    it('refuses a missing, unreadable or malformed config', async () => {
        expect(refusals(await check(null, LABELS))).toEqual([expect.stringContaining('cannot read the box config')]);
        expect(refusals(await check('{ not json', LABELS))).toEqual([expect.stringContaining('not valid JSON')]);
        expect(refusals(await check('[1,2]', LABELS))).toEqual([expect.stringContaining('must be a JSON object')]);
    });

    it('reads a config saved with a UTF-8 byte-order mark', async () => {
        expect(await check(`﻿${JSON.stringify(good)}`, LABELS)).toEqual([]);
    });

    it("refuses a shutdownTimeoutMs the stop grace period cannot hold, with box-config.ts's own rule and words", async () => {
        // The same numbers as box-config.ts and the compose file: 5 x 20 000 ms + 20 000 ms reserve = 120 s.
        const text = read('docker/edge/preflight-check.js');
        const constant = (name: string): number => Number(new RegExp(`^const ${name} = (\\d+);$`, 'm').exec(text)?.[1]);
        expect([constant('STOP_GRACE_MS'), constant('SHUTDOWN_STEPS'), constant('SHUTDOWN_RESERVE_MS')]).toEqual([EDGE_STOP_GRACE_MS, EDGE_SHUTDOWN_STEPS, EDGE_SHUTDOWN_RESERVE_MS]);
        expect(seconds(service.stop_grace_period) * 1000).toBe(EDGE_STOP_GRACE_MS);
        const appProblem = (value: unknown): string[] => {
            try {
                parseBoxConfig({ ...good, shutdownTimeoutMs: value }, CONFIG_FILE);
                return [];
            } catch (err) {
                if (!(err instanceof BoxConfigError)) throw err;
                return err.problems.filter(p => p.startsWith('shutdownTimeoutMs'));
            }
        };
        for (const value of [0, -1, EDGE_SHUTDOWN_STEP_MAX_MS + 1, 60_000, 1.5, '20000', true]) {
            const app = appProblem(value);
            expect({ value, app: app.length }).toEqual({ value, app: 1 });
            expect({ value, preflight: refusals(await check({ ...good, shutdownTimeoutMs: value }, LABELS)) }).toEqual({ value, preflight: [`REFUSE ${app[0]}`] });
        }
        // Inside the budget (both ends), absent or null (the default): accepted by both.
        for (const value of [1, 5_000, EDGE_SHUTDOWN_STEP_MAX_MS, null, undefined]) {
            expect({ value, app: appProblem(value) }).toEqual({ value, app: [] });
            expect({ value, preflight: await check({ ...good, shutdownTimeoutMs: value }, LABELS) }).toEqual({ value, preflight: [] });
        }
        expect(EDGE_SHUTDOWN_STEPS * EDGE_SHUTDOWN_STEP_MAX_MS + EDGE_SHUTDOWN_RESERVE_MS).toBeLessThanOrEqual(seconds(service.stop_grace_period) * 1000);
    });
});

// ---------------------------------------------------------------------------------------------------------------
// docs
// ---------------------------------------------------------------------------------------------------------------

describe('docs/rt-edge and docker/edge/README.md', () => {
    const DOCS = ['docs/rt-edge/install.md', 'docs/rt-edge/host-hardening.md', 'docs/rt-edge/runbook.md', 'docker/edge/README.md'];
    const docs = Object.fromEntries(DOCS.map(f => [f, read(f)])) as Record<string, string>;

    it('every etabella-edge command they show is a valid rt-edge command line', () => {
        const re = /(?:^|[\s`(])(?:sudo\s+)?etabella-edge[ \t]+((?:enroll|status|recover|capture|cert|help)\b[^`\n|;#]*)/gm;
        const found: string[] = [];
        for (const [file, text] of Object.entries(docs)) {
            for (const m of text.matchAll(re)) {
                const words = m[1].replace(/<[^>]*>/g, 'X').replace(/[[\]]/g, ' ').trim().split(/\s+/);
                let name: string;
                try {
                    name = commandName(words);
                } catch (err) {
                    throw new Error(`${file}: "etabella-edge ${m[1].trim()}": ${(err as Error).message}`);
                }
                expect(name).not.toBe('serve');
                found.push(name);
            }
        }
        expect(found.length).toBeGreaterThanOrEqual(10);
        expect(new Set(found)).toEqual(new Set(['enroll', 'status', 'recover', 'capture-list', 'capture-upload', 'cert-install']));
    });

    it('install.md step 11 and the acceptance tests use the manual certificate path, not a cloud issuer this build lacks (review 5)', () => {
        const install = docs['docs/rt-edge/install.md'];
        const step11 = install.slice(install.indexOf('### 11.'), install.indexOf('### 12.'));
        expect(step11).toContain('etabella-edge cert install --key');
        expect(step11).toMatch(/501/);
        expect(step11).not.toMatch(/fetches its LAN certificate/);
        expect(install).toMatch(/\| 1 \| `etabella-edge status` \|[^\n]*certificate `ok` \(installed with `cert install`, step 11\)/);
    });

    it('the runbook promises nothing v1 does not have (review 21, 22, 29)', () => {
        const text = docs['docs/rt-edge/runbook.md'];
        // O-2: no c.cmd in v1, so RT Production has no Unlock and no "Make this the active feed".
        expect(text).not.toMatch(/\bUnlock\b/);
        expect(text).not.toMatch(/\*\*Make\s+this\s+the\s+active\s+feed\*\*/);
        expect(text).toMatch(/lock clears by itself/);
        expect(text).toMatch(/not in v1 \(O-2\)/);
        // The kernel never reports a recovery percentage (review 29).
        expect(text).not.toMatch(/Recovering … %/);
        // 'W' and force-closed sessions are not purged by v1 boxes (review 22): say so, with the remedy.
        expect(text).toMatch(/`W`\s+session stays on the box/);
        expect(text).toMatch(/re-image/);
    });

    it('every box route they name exists (CONTRACTS.md routes, plus the LAN metrics page)', () => {
        const known = new Set<string>([...Object.values(EDGE_ROUTES).map(r => r.path), '/edge/local/metrics']);
        const named = new Set<string>();
        for (const text of Object.values(docs)) for (const m of text.matchAll(/(?<![\w-])\/edge(?:\/[a-z][a-z0-9-]*)+/g)) named.add(m[0]);
        expect(named.size).toBeGreaterThan(0);
        for (const p of named) expect({ p, known: known.has(p) }).toEqual({ p, known: true });
    });

    it('the runbook covers every section the hearing day needs', () => {
        const headings = docs['docs/rt-edge/runbook.md'].split('\n').filter(l => l.startsWith('#'));
        for (const title of [
            'Hearing-day morning checklist (DR15)',
            'Operator code (DR7)',
            'Room codes',
            'Feed stopped',
            'Internet down',
            'Box failure: Split to direct cloud',
            'End, seal and publish',
            'Split rehearsal (D9',
            'Collecting diagnostics',
        ]) {
            expect({ title, present: headings.some(h => h.includes(title)) }).toEqual({ title, present: true });
        }
    });

    it('the morning checklist lists the seven default readiness checks in the box order (DR23)', () => {
        const text = docs['docs/rt-edge/runbook.md'];
        // DR23: the operator code is off by default, so its check is not on the default list; the runbook still
        // names it for a box that turns the operator code on.
        const keys = READINESS_KEYS.filter(key => key !== 'operator-code-issued');
        expect(keys).toHaveLength(7);
        const at = keys.map(key => text.indexOf(`(\`${key}\`)`));
        for (const [i, key] of keys.entries()) expect({ key, listed: at[i] >= 0 }).toEqual({ key, listed: true });
        expect([...at].sort((a, b) => a - b)).toEqual(at);
        expect(text).toContain('`operator-code-issued`');
        expect(text).toContain('The seven checks');
    });

    it('the split tells the reporter what to do in both Eclipse modes (listen, and dial per O-5)', () => {
        const text = docs['docs/rt-edge/runbook.md'];
        const split = text.slice(text.indexOf('## 8. Box failure'), text.indexOf('## 9.'));
        expect(split).toContain('**Listen mode** (Eclipse "Connect to server")');
        expect(split).toContain('**Dial mode** (Eclipse "Wait for connection")');
        expect(split).toContain('port **2500**');
        expect(split).toContain('O-5');
    });

    it('the README maps every deploy file, and install.md or host-hardening.md installs each one', () => {
        const readme = docs['docker/edge/README.md'];
        const install = docs['docs/rt-edge/install.md'] + docs['docs/rt-edge/host-hardening.md'];
        const files = deployableFiles();
        expect(files.length).toBeGreaterThanOrEqual(15);
        for (const file of files) {
            expect({ file, mapped: readme.includes(`| \`${file}\` |`) }).toEqual({ file, mapped: true });
            expect({ file, installed: install.includes(`docker/edge/${file}`) }).toEqual({ file, installed: true });
        }
    });

    it('the install guide copies the preflight pieces to the paths the unit and the script use', () => {
        const install = docs['docs/rt-edge/install.md'];
        expect(install).toContain(`docker/edge/edge-preflight.sh ${PREFLIGHT_ON_BOX}`);
        expect(install).toContain(`docker/edge/preflight-check.js ${CHECK_JS_ON_BOX}`);
        expect(install).toContain('docker/edge/docker-compose.yml docker/edge/README.md /opt/etabella-edge/');
        expect(install).toContain('install -d -m 0700 /var/lib/etabella-edge');
    });
});
