/**
 * CliPort (token CLI_PORT, module cli/) and the command line of the rt-edge binary (spec §3.2 `cli`, §3.4 install,
 * §10 #9 `recover --journal`):
 *
 * ```
 * rt-edge [--config <file.json>]                          serve (the box process)
 * rt-edge enroll --code <code> [--cloud <url>] [--rekey]   enrol; prints the key fingerprint
 * rt-edge status [--json]                                 identity, sessions, link, disk, certificate
 *                                                         (`UplinkPort.certificate()`: state, days left, host)
 * rt-edge recover --journal <dir> [--out <file>]          rebuild a session's transcript from a surviving journal
 * rt-edge capture list                                    held captures (pending upload first)
 * rt-edge capture upload [--id <id>]                      upload one (or every pending) held capture
 * rt-edge cert install --key <file> --chain <file>        install the LAN certificate pair issued at the office
 * rt-edge help
 * ```
 * `--config` may appear anywhere (BoxConfig: `--config` wins over `RT_EDGE_CONFIG`). CLI commands run in an
 * application context with run mode 'cli' (nothing listens or dials unless the command needs it).
 *
 * `cert install` is the v1 manual path for the box's LAN certificate (review 5): the cloud's issuer (`edge/v1/cert`,
 * ACME DNS-01) is Phase 3 and answers 501 in this build, so the pair for `<slug>.etabella-edge.net` is issued at the
 * office and installed on the box console (docs/rt-edge/install.md step 11). EdgeCli checks and installs it
 * (cli/edge-cli.ts, uplink/cert-install.ts); the running box hot-reloads it.
 */

/** Exit codes (BSD sysexits where one fits). */
export const EDGE_EXIT = {
    ok: 0,
    failed: 1,
    usage: 64,
    /** internal error, or a command whose implementation is a stub */
    software: 70,
    /** the box config is missing or invalid */
    config: 78,
} as const;

export type EdgeCliCommand =
    | { readonly name: 'enroll'; readonly code: string; readonly cloud: string | null; readonly rekey: boolean }
    | { readonly name: 'status'; readonly json: boolean }
    | { readonly name: 'recover'; readonly journal: string; readonly out: string | null }
    | { readonly name: 'capture-list' }
    | { readonly name: 'capture-upload'; readonly id: string | null }
    /**
     * `key`: the PEM private key file (unencrypted); `chain`: the PEM certificate chain file (the box's certificate
     * first, then the intermediates). Both as given, resolved against the working directory.
     */
    | { readonly name: 'cert-install'; readonly key: string; readonly chain: string };

export type EdgeCommand = { readonly name: 'serve' } | { readonly name: 'help' } | EdgeCliCommand;

/** Where a command writes (stdout / stderr in the binary, arrays in specs). */
export interface CliOutput {
    log(line: string): void;
    error(line: string): void;
}

export interface CliPort {
    /**
     * Run one command; resolve its exit code (`EDGE_EXIT`). Expected failures (offline, refused code, unknown capture
     * id) are reported on `out.error` with exit `failed`; the CLI never prints a token, code value or key material
     * except the enrolment fingerprint.
     */
    run(command: EdgeCliCommand, out: CliOutput): Promise<number>;
}

export class EdgeUsageError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EdgeUsageError';
    }
}

export const EDGE_USAGE = [
    'usage: rt-edge [--config <file.json>] [command]',
    '  (no command)                               run the box',
    '  enroll --code <code> [--cloud <url>] [--rekey]',
    '  status [--json]',
    '  recover --journal <dir> [--out <file>]',
    '  capture list',
    '  capture upload [--id <id>]',
    '  cert install --key <file> --chain <file>',
    '  help',
].join('\n');

/** Flags that take a value (`--code K7Q4M2` or `--code=K7Q4M2`); every other flag is a boolean switch. */
const VALUE_FLAGS: ReadonlySet<string> = new Set(['config', 'code', 'cloud', 'journal', 'out', 'id', 'key', 'chain']);

/** Parse argv (without the node binary and script). Throws EdgeUsageError for anything it does not understand. */
export function parseEdgeArgs(argv: readonly string[]): EdgeCommand {
    const words: string[] = [];
    const flags = new Map<string, string | true>();
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') return { name: 'help' };
        if (arg.startsWith('--')) {
            const eq = arg.indexOf('=');
            const key = eq > 0 ? arg.slice(2, eq) : arg.slice(2);
            if (!key) throw new EdgeUsageError(`bad flag ${arg}`);
            if (flags.has(key)) throw new EdgeUsageError(`--${key} given twice`);
            if (eq > 0) {
                flags.set(key, arg.slice(eq + 1));
            } else if (VALUE_FLAGS.has(key)) {
                const value = argv[i + 1];
                if (value === undefined || value.startsWith('--')) throw new EdgeUsageError(`--${key} needs a value`);
                flags.set(key, value);
                i++;
            } else {
                flags.set(key, true);
            }
            continue;
        }
        words.push(arg);
    }
    flags.delete('config');

    const [cmd, sub] = words;
    const take = (allowed: readonly string[]): void => {
        for (const key of flags.keys()) if (!allowed.includes(key)) throw new EdgeUsageError(`unknown flag --${key} for ${cmd ?? 'serve'}`);
    };
    const value = (key: string, required: boolean): string | null => {
        const v = flags.get(key);
        if (v === undefined) {
            if (required) throw new EdgeUsageError(`${cmd} needs --${key}`);
            return null;
        }
        if (v === true || v === '') throw new EdgeUsageError(`--${key} needs a value`);
        return v;
    };
    const certValue = (key: 'key' | 'chain'): string => {
        const v = flags.get(key);
        if (v === undefined) throw new EdgeUsageError(`cert install needs --${key}`);
        if (v === true || v === '') throw new EdgeUsageError(`--${key} needs a value`);
        return v;
    };
    const noExtraWords = (count: number): void => {
        if (words.length > count) throw new EdgeUsageError(`unexpected argument ${words[count]}`);
    };

    switch (cmd) {
        case undefined:
        case 'serve':
            take([]);
            noExtraWords(cmd === undefined ? 0 : 1);
            return { name: 'serve' };
        case 'help':
            return { name: 'help' };
        case 'enroll': {
            take(['code', 'cloud', 'rekey']);
            noExtraWords(1);
            const rekey = flags.get('rekey');
            if (rekey !== undefined && rekey !== true) throw new EdgeUsageError('--rekey takes no value');
            return { name: 'enroll', code: value('code', true), cloud: value('cloud', false), rekey: rekey === true };
        }
        case 'status': {
            take(['json']);
            noExtraWords(1);
            const json = flags.get('json');
            if (json !== undefined && json !== true) throw new EdgeUsageError('--json takes no value');
            return { name: 'status', json: json === true };
        }
        case 'recover':
            take(['journal', 'out']);
            noExtraWords(1);
            return { name: 'recover', journal: value('journal', true), out: value('out', false) };
        case 'capture':
            if (sub === 'list') {
                take([]);
                noExtraWords(2);
                return { name: 'capture-list' };
            }
            if (sub === 'upload') {
                take(['id']);
                noExtraWords(2);
                return { name: 'capture-upload', id: value('id', false) };
            }
            throw new EdgeUsageError(`capture needs "list" or "upload"${sub ? `, not "${sub}"` : ''}`);
        case 'cert':
            if (sub !== 'install') throw new EdgeUsageError(`cert needs "install"${sub ? `, not "${sub}"` : ''}`);
            noExtraWords(2);
            for (const key of flags.keys()) if (key !== 'key' && key !== 'chain') throw new EdgeUsageError(`unknown flag --${key} for cert install`);
            return { name: 'cert-install', key: certValue('key'), chain: certValue('chain') };
        default:
            throw new EdgeUsageError(`unknown command "${cmd}"`);
    }
}
