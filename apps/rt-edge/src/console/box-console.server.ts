/**
 * The localhost box console (`console.port`, default 2601): a plain-HTTP page for whoever sits at the box. They type
 * their email (console-signin.ts: looked up in the people list etabella.net sent, no password), see their cases and
 * the sessions etabella.net sent for them, and set up the reporter connection (the same TransmitterControl the Box
 * settings → Transmitter page uses, so every check and audit row is the same). A session that carries the reporter
 * machine's address from etabella.net sets that connection by itself (KernelPort.cloudReporterStatus); the page says
 * so, or why the box could not use it. The box sends to etabella.net by itself.
 *
 * What keeps strangers out is where the page opens, not the email: the server binds 127.0.0.1 only. On top of that:
 * - the peer must be a loopback address (defence in depth if the bind ever changes);
 * - the Host header must name this console (`localhost:<port>` / `127.0.0.1:<port>`), which defeats DNS rebinding:
 *   a web page on another site that rebinds its name to 127.0.0.1 still sends its own Host;
 * - every API call needs the `X-Box-Console: 1` header. A web page on another origin cannot add a custom header
 *   without a CORS preflight, and this server never answers one, so other sites cannot drive the console from the
 *   user's browser (CSRF). A POST must also be JSON and, when it carries an Origin, come from this console;
 * - the sign-in cookie is HttpOnly and SameSite=Strict;
 * - strict CSP (no inline script), no framing, no caching.
 * Nothing secret is served: the box holds only the scrypt hash of each Eclipse password.
 *
 * Starts on application bootstrap in 'serve' mode only (never for a CLI command); the server is unref'd so it never
 * keeps the process alive on its own, and closes on shutdown. A port in use is logged, not fatal: the box keeps
 * recording without its console.
 */
import * as http from 'http';
import * as os from 'os';

import { BeforeApplicationShutdown, Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { rankAddresses } from '../ops/network';
import { OPS_DEFAULT_ROUTE_TIMEOUT_MS } from '../ops/ops.constants';
import { defaultRouteIpv4, OpsInterfaceAddress } from '../ops/ops-host';
import { TransmitterControl } from '../ops/transmitter';
import {
    BOX_CONFIG,
    BoxConfig,
    EDGE_CLOCK,
    EDGE_RUN_MODE,
    EdgeClock,
    EdgePortError,
    EdgeRequestContext,
    EdgeRunMode,
    KERNEL_PORT,
    KernelPort,
    STATE_PORT,
    StatePort,
    UPLINK_PORT,
    UplinkPort,
} from '../ports';
import { CONSOLE_CSS, CONSOLE_HTML, CONSOLE_JS } from './console-page';
import {
    CONSOLE_COOKIE,
    CONSOLE_SESSION_TTL_MS,
    consoleCookie,
    ConsoleLookup,
    ConsolePerson,
    consolePrincipal,
    ConsoleSessions,
    consoleSignInMessage,
    findConsolePerson,
} from './console-signin';
import { buildConsoleSnapshot, ConsoleSnapshot } from './console-snapshot';

/** Largest request body the console reads (its JSON bodies are a few hundred bytes). */
export const CONSOLE_MAX_BODY_BYTES = 4096;
/** The header every console API call carries (forces a CORS preflight from any other origin). */
export const CONSOLE_HEADER = 'x-box-console';
/** The default-route address is looked up again at most this often (it only orders the "Server address" list). */
export const CONSOLE_DEFAULT_ROUTE_EVERY_MS = 60_000;

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy':
        "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

const STATIC: Readonly<Record<string, { readonly type: string; readonly body: string }>> = {
    '/': { type: 'text/html; charset=utf-8', body: CONSOLE_HTML },
    '/console.css': { type: 'text/css; charset=utf-8', body: CONSOLE_CSS },
    '/console.js': { type: 'text/javascript; charset=utf-8', body: CONSOLE_JS },
};

@Injectable()
export class BoxConsoleServer implements OnApplicationBootstrap, BeforeApplicationShutdown {
    private readonly logger = new Logger('BoxConsole');
    private readonly signIns = new ConsoleSessions();
    private server: http.Server | null = null;
    private boundPort: number | null = null;
    /** The default-route address that leads `lanIpv4Addresses` (null = none / not looked up yet), and when it was asked. */
    private defaultRoute: string | null = null;
    private defaultRouteAskedAtMs: number | null = null;
    /** How the default-route address is found (ops-host `defaultRouteIpv4`; specs replace it). */
    defaultRouteLookup: (timeoutMs: number) => Promise<string | null> = defaultRouteIpv4;

    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_RUN_MODE) private readonly mode: EdgeRunMode,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(KERNEL_PORT) private readonly kernel: KernelPort,
        @Inject(UPLINK_PORT) private readonly uplink: UplinkPort,
        private readonly transmitter: TransmitterControl,
    ) {}

    /** The configured port; 0 = the console is off (also for a hand-built config without a `console` section). */
    get port(): number {
        return this.config.console?.port ?? 0;
    }

    /** The port actually bound (differs from `port` only when 0 was asked in a spec); null when not listening. */
    address(): number | null {
        return this.boundPort;
    }

    async onApplicationBootstrap(): Promise<void> {
        if (this.mode !== 'serve' || this.port === 0) return;
        await this.listen(this.port);
    }

    async beforeApplicationShutdown(): Promise<void> {
        const server = this.server;
        this.server = null;
        this.boundPort = null;
        if (!server) return;
        server.closeAllConnections?.();
        await new Promise<void>(resolve => server.close(() => resolve()));
    }

    /** Bind 127.0.0.1:`port` (0 = any free port, specs). Never rejects. */
    async listen(port: number): Promise<void> {
        if (this.server) return;
        const server = http.createServer((req, res) => {
            this.handle(req, res).catch(err => {
                this.logger.error(`console request failed: ${err instanceof Error ? err.message : String(err)}`);
                if (!res.headersSent) this.json(res, 500, { error: 'server_error', message: 'The box could not answer.' });
                else res.end();
            });
        });
        server.headersTimeout = 10_000;
        server.requestTimeout = 15_000;
        await new Promise<void>(resolve => {
            server.once('error', (err: NodeJS.ErrnoException) => {
                this.logger.warn(`box console not started on 127.0.0.1:${port} (${err.code ?? err.message}); the box keeps recording without it`);
                resolve();
            });
            server.listen(port, '127.0.0.1', () => {
                server.unref();
                this.server = server;
                const addr = server.address();
                this.boundPort = typeof addr === 'object' && addr ? addr.port : port;
                this.logger.log(`box console on http://localhost:${this.boundPort} (this computer only)`);
                this.refreshDefaultRoute();
                resolve();
            });
        });
    }

    /** The console's state for one signed-in person (what `GET /api/state` answers). */
    snapshot(person: ConsolePerson): ConsoleSnapshot {
        this.refreshDefaultRoute();
        return buildConsoleSnapshot({
            nowMs: this.clock(),
            config: this.config,
            identity: safe(() => this.state.identity.get(), null),
            records: safe(() => this.state.sessions.list(), []),
            views: safe(() => this.kernel.sessions(), []),
            caseOf: id => safe(() => this.state.assignments.case(id), null),
            transmitter: safe(() => this.transmitter.state(), null),
            cloud: safe(() => this.uplink.cloudLink(), null),
            addresses: safe(() => lanIpv4Addresses(this.defaultRoute), []),
            me: { name: person.name, email: person.email },
            canChangeSettings: person.isSuperAdmin,
            visibleCaseIds: person.isSuperAdmin ? null : new Set(person.caseIds),
            cases: safe(() => this.state.assignments.cases(), []),
            cloudReporter: safe(() => this.kernel.cloudReporterStatus(), null),
        });
    }

    private async handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const refusal = this.refusal(req);
        if (refusal) return this.json(res, 403, { error: 'forbidden', message: refusal });
        const url = new URL(req.url ?? '/', 'http://localhost');
        const method = req.method ?? 'GET';
        const token = consoleCookie(headerText(req.headers.cookie) ?? undefined);
        const person = this.signIns.get(token, this.clock());

        if (method === 'GET' || method === 'HEAD') {
            const file = STATIC[url.pathname];
            if (file) {
                res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': file.type });
                res.end(method === 'HEAD' ? undefined : file.body);
                return;
            }
            if (url.pathname === '/api/state') {
                if (!this.fromConsole(req)) return this.json(res, 403, { error: 'forbidden', message: 'Missing the console header.' });
                if (!person) return this.json(res, 401, { error: 'signin_required', message: 'Enter your email to continue.', boxName: this.config.box.name });
                return this.json(res, 200, this.snapshot(person));
            }
            return this.json(res, 404, { error: 'not_found', message: 'Not found.' });
        }

        if (method !== 'POST') return this.json(res, 405, { error: 'method_not_allowed', message: 'Not allowed.' });
        if (!this.fromConsole(req)) return this.json(res, 403, { error: 'forbidden', message: 'Missing the console header.' });
        if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
            return this.json(res, 415, { error: 'unsupported_media_type', message: 'Send JSON.' });
        }
        const body = await readJson(req);
        if (body === TOO_LARGE) return this.json(res, 413, { error: 'too_large', message: 'The request is too large.' });
        if (body === BAD_JSON) return this.json(res, 400, { error: 'invalid_request', message: 'The request is not valid JSON.' });

        if (url.pathname === '/api/signin') return this.signIn(body, res);
        if (url.pathname === '/api/signout') {
            this.signIns.close(token);
            return this.json(res, 200, { ok: true }, { 'Set-Cookie': `${CONSOLE_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
        }
        if (!person) return this.json(res, 401, { error: 'signin_required', message: 'Enter your email to continue.', boxName: this.config.box.name });

        // The reporter connection is a box setting: super-admins only. Everyone else reads the sessions of their cases.
        if (!person.isSuperAdmin) return this.json(res, 403, { error: 'not_box_admin', message: 'Only a super admin can change the reporter connection.' });
        const principal = consolePrincipal(person, this.clock(), token ?? '');
        const ctx: EdgeRequestContext = { ip: '127.0.0.1', userAgent: headerText(req.headers['user-agent']), deviceCookie: null };
        try {
            switch (url.pathname) {
                case '/api/transmitter':
                    await this.transmitter.apply(body, principal, ctx);
                    break;
                case '/api/transmitter/connect':
                    await this.transmitter.connect(body, principal, ctx);
                    break;
                case '/api/transmitter/reconnect':
                    await this.transmitter.reconnect(body, principal, ctx);
                    break;
                default:
                    return this.json(res, 404, { error: 'not_found', message: 'Not found.' });
            }
        } catch (err) {
            if (err instanceof EdgePortError) return this.json(res, err.status || 400, { error: err.code, message: consoleMessage(err) });
            throw err;
        }
        return this.json(res, 200, this.snapshot(person));
    }

    private signIn(body: unknown, res: http.ServerResponse): void {
        const email = body && typeof body === 'object' ? (body as Record<string, unknown>)['email'] : undefined;
        const found = safe<ConsoleLookup>(() => findConsolePerson(email, this.state.assignments, this.state.roster), { person: null, reason: 'no-roster' });
        const who = found.person;
        const outcome = who ? 'ok' : found.reason ?? 'unknown';
        safe(
            () =>
                this.state.audit.append({
                    atMs: this.clock(),
                    action: 'sign-in-start',
                    actor: who ? { nUserid: null, name: `${who.name} (box console)`, via: 'operator', operatorName: null } : null,
                    outcome: `console-${outcome}`,
                    nSesid: null,
                    target: null,
                    ip: '127.0.0.1',
                    deviceHash: null,
                    data: null,
                }),
            undefined,
        );
        if (!who) return this.json(res, outcome === 'invalid' ? 400 : 403, { error: `signin_${outcome}`, message: consoleSignInMessage(found.reason ?? 'unknown') });
        const token = this.signIns.open(who, this.clock());
        const maxAge = Math.floor(CONSOLE_SESSION_TTL_MS / 1000);
        this.json(res, 200, { ok: true, name: who.name }, { 'Set-Cookie': `${CONSOLE_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}` });
    }

    /** Why a request may not reach the console at all (peer, Host, Origin); null when it may. */
    refusal(req: Pick<http.IncomingMessage, 'headers' | 'socket'>): string | null {
        const peer = req.socket?.remoteAddress ?? '';
        if (!LOOPBACK.has(peer)) return 'The box console opens only on this computer.';
        const port = this.boundPort ?? this.port;
        const host = headerText(req.headers.host)?.toLowerCase() ?? '';
        if (host !== `localhost:${port}` && host !== `127.0.0.1:${port}`) return 'Open the console at http://localhost:' + port + '.';
        const origin = headerText(req.headers.origin);
        if (origin !== null && origin !== `http://localhost:${port}` && origin !== `http://127.0.0.1:${port}`) return 'Requests from other sites are refused.';
        return null;
    }

    private fromConsole(req: http.IncomingMessage): boolean {
        return headerText(req.headers[CONSOLE_HEADER]) === '1';
    }

    /** Look the default-route address up again in the background (at most once per CONSOLE_DEFAULT_ROUTE_EVERY_MS). */
    private refreshDefaultRoute(): void {
        const now = this.clock();
        if (this.defaultRouteAskedAtMs !== null && now - this.defaultRouteAskedAtMs < CONSOLE_DEFAULT_ROUTE_EVERY_MS) return;
        this.defaultRouteAskedAtMs = now;
        void Promise.resolve()
            .then(() => this.defaultRouteLookup(OPS_DEFAULT_ROUTE_TIMEOUT_MS))
            .then(
                ip => (this.defaultRoute = ip),
                () => undefined,
            );
    }

    private json(res: http.ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}): void {
        const text = JSON.stringify(body);
        res.writeHead(status, { ...SECURITY_HEADERS, ...extra, 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text) });
        res.end(text);
    }
}

function safe<T>(read: () => T, fallback: T): T {
    try {
        return read();
    } catch {
        return fallback;
    }
}

/**
 * This machine's usable IPv4 addresses, best first — what the reporter types as "Server address". The same ranking as
 * the Network card's room address (ops/network.ts `rankAddresses`, user decision 2026-10-04): the default-route
 * address (while a listed, non-VPN adapter holds it), then private ranges, VPN / virtual adapters last
 * (os.networkInterfaces() lists Radmin VPN and Hamachi before the Wi-Fi on the box PC). Loopback and link-local
 * addresses are left out.
 */
export function lanIpv4Addresses(defaultRoute: string | null = null, interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = os.networkInterfaces()): string[] {
    const list: OpsInterfaceAddress[] = [];
    for (const [name, infos] of Object.entries(interfaces)) {
        for (const a of infos ?? []) {
            if (a.family === 'IPv4' || (a.family as unknown) === 4) list.push({ name, address: a.address, internal: a.internal });
        }
    }
    return rankAddresses(list, defaultRoute);
}

/** Plain words for the refusals a person at the box can act on. */
export function consoleMessage(err: EdgePortError): string {
    const fields = err.extra['fields'] as Record<string, string> | undefined;
    switch (err.code) {
        case 'invalid_settings':
            if (fields?.['host']) return "Enter the reporter machine's IP address, like 192.168.1.20.";
            if (fields?.['port']) return 'Enter a port between 1 and 65535.';
            if (fields?.['protocol']) return 'Choose Bridge or CaseView.';
            if (fields?.['mode']) return 'Connecting to the reporter is switched off on this box.';
            return 'Check the connection details.';
        case 'state_changed':
            return 'The connection changed meanwhile. Check it and save again.';
        case 'confirm_required':
            return 'Lines are coming in now. Save again to confirm the change.';
        case 'not_configured':
            return 'Save the reporter machine address first.';
        case 'already_connected':
            return 'Already connected.';
        case 'link_up':
            return 'The reporter is connected; nothing to reconnect.';
        case 'not_dial_mode':
            return 'Connect applies only when this box connects to the reporter.';
        default:
            return err.message || 'The box refused the change.';
    }
}

const TOO_LARGE = Symbol('too-large');
const BAD_JSON = Symbol('bad-json');

function readJson(req: http.IncomingMessage): Promise<unknown> {
    return new Promise(resolve => {
        const chunks: Buffer[] = [];
        let size = 0;
        let done = false;
        const finish = (value: unknown) => {
            if (!done) {
                done = true;
                resolve(value);
            }
        };
        req.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > CONSOLE_MAX_BODY_BYTES) {
                finish(TOO_LARGE);
                req.resume();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            if (done) return;
            try {
                finish(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'));
            } catch {
                finish(BAD_JSON);
            }
        });
        req.on('error', () => finish(BAD_JSON));
    });
}

function headerText(value: string | string[] | undefined): string | null {
    const v = Array.isArray(value) ? value[0] : value;
    return typeof v === 'string' && v !== '' ? v : null;
}
