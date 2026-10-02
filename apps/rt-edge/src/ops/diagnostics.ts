/**
 * "Download diagnostics" (D34; CONTRACTS.md §8.6; spec §12 runbook step 7): a zip of JSON sections (versions, status,
 * readiness / network / verdict results, box details, boot and certificate state, the last 24 h of the Connectivity
 * Log, recent alerts and audit rows). NEVER transcript text, tokens, codes, passwords, hashes or Eclipse logins:
 * ops never puts those in a section in the first place, and `redactForDiagnostics` scrubs every section on top
 * (keys and values) before it is written. Specs beside.
 */
import { EDGE_DIAGNOSTICS_CONTENT_TYPE, EDGE_DIAGNOSTICS_FILE_PREFIX } from '../contracts';
import type { EdgeDiagnosticsFile } from '../ports';
import { buildZip } from './zip';

export const REDACTED = '[redacted]';

/** Keys whose values never leave the box (compared lower-case, exact). */
const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
    'token',
    'accesstoken',
    'refreshtoken',
    'idtoken',
    'jwt',
    'bearer',
    'authorization',
    'cookie',
    'devicecookie',
    'password',
    'passwd',
    'pass',
    'passwordenc',
    'secret',
    'salt',
    'hash',
    'codehash',
    'devicehash',
    'sha256',
    'privatekey',
    'publickeyspki',
    'keyfingerprint',
    'fingerprint',
    'fingerprint256',
    'root',
    'cloudroot',
    'cloudrootshort',
    'headhash',
    'durablehash',
    'rawhash',
    'prevhash',
    'tohash',
    'appliedrawhash',
    'rawhashthrough',
    'route',
    'user',
    'username',
    'code_value',
    'display',
    'roomcode',
    'operatorcode',
    'enrollcode',
    'enrolcode',
    'plaintext',
    'otp',
]);

/** A room code (6 Crockford characters, `K7Q-4M2`) or an operator code (`OPR-6Z3K-91`) as a whole value. */
const CODE_VALUE_RE = /^(?:OPR-?[0-9A-HJKMNP-TV-Z]{4}-?[0-9A-HJKMNP-TV-Z]{2}|[0-9A-HJKMNP-TV-Z]{3}-?[0-9A-HJKMNP-TV-Z]{3})$/i;

/** Keys that could carry transcript text: arrays and strings under them are dropped. */
const TRANSCRIPT_KEYS: ReadonlySet<string> = new Set(['text', 'lines', 'pages', 'allpages', 'transcript', 'note', 'notes', 'jtexts', 'jot']);

const JWT_RE = /\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const BEARER_RE = /\b(Bearer)\s+[^\s"',;]+/gi;
const LONG_HEX_RE = /\b[0-9a-fA-F]{32,}\b/g;
const COLON_HEX_RE = /\b(?:[0-9A-Fa-f]{2}:){15,}[0-9A-Fa-f]{2}\b/g;
const LONG_B64_RE = /[A-Za-z0-9+/]{43,}={0,2}/g;
/** Codes as people read them out: `OPR-6Z3K-91` / `OPR6Z3K91`, and room codes in their shown form `K7Q-4M2`. */
const OPERATOR_CODE_TEXT_RE = /\bOPR-?[0-9A-HJKMNP-TV-Z]{4}-?[0-9A-HJKMNP-TV-Z]{2}\b/gi;
const ROOM_CODE_TEXT_RE = /\b[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}\b/g;

/** Scrub secrets out of free text (developer messages, alert data). */
export function scrubString(value: string): string {
    return value
        .replace(BEARER_RE, `$1 ${REDACTED}`)
        .replace(JWT_RE, REDACTED)
        .replace(COLON_HEX_RE, REDACTED)
        .replace(LONG_HEX_RE, REDACTED)
        .replace(LONG_B64_RE, REDACTED)
        .replace(OPERATOR_CODE_TEXT_RE, REDACTED)
        .replace(ROOM_CODE_TEXT_RE, REDACTED);
}

/**
 * A deep, JSON-safe copy of `value` with sensitive keys replaced by REDACTED, transcript-like arrays/strings dropped,
 * and secrets scrubbed out of every string. Buffers become '[binary]'; functions and undefined are dropped; depth is
 * capped (deeper values become '[truncated]').
 */
export function redactForDiagnostics(value: unknown, depth = 0): unknown {
    if (value === null || value === undefined) return null;
    if (depth > 24) return '[truncated]';
    if (typeof value === 'string') return scrubString(value);
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'bigint') return value.toString();
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) return '[binary]';
    if (typeof value !== 'object') return null;
    if (Array.isArray(value)) return value.map(v => redactForDiagnostics(v, depth + 1));
    if (value instanceof Map) return redactForDiagnostics(Object.fromEntries(value), depth);
    if (value instanceof Set) return redactForDiagnostics([...value], depth);
    if (value instanceof Error) return { name: value.name, message: scrubString(value.message) };
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        if (v === undefined || typeof v === 'function') continue;
        const lower = key.toLowerCase();
        if (SENSITIVE_KEYS.has(lower)) {
            out[key] = v === null ? null : REDACTED;
            continue;
        }
        // `code` is a machine code on log rows ('tx-refused') and must stay; a room / operator code value never does.
        if (lower === 'code' && typeof v === 'string' && CODE_VALUE_RE.test(v.trim())) {
            out[key] = REDACTED;
            continue;
        }
        if (TRANSCRIPT_KEYS.has(lower) && (Array.isArray(v) || typeof v === 'string' || (v && typeof v === 'object'))) {
            out[key] = REDACTED;
            continue;
        }
        out[key] = redactForDiagnostics(v, depth + 1);
    }
    return out;
}

const fileTimeFormatters = new Map<string, Intl.DateTimeFormat>();

/** `YYYYMMDD-HHmm` of `ms` in `timeZone`. */
export function diagnosticsStamp(ms: number, timeZone: string): string {
    let fmt = fileTimeFormatters.get(timeZone);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        fileTimeFormatters.set(timeZone, fmt);
    }
    const parts = fmt.formatToParts(new Date(ms));
    const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find(p => p.type === type)?.value ?? '';
    return `${get('year')}${get('month')}${get('day')}-${String(Number(get('hour')) % 24).padStart(2, '0')}${get('minute')}`;
}

/** `etabella-box-<boxLabel>-<YYYYMMDD-HHmm>.zip` (box-local time); the label is made safe for a file name. */
export function diagnosticsFileName(boxLabel: string, nowMs: number, timeZone: string): string {
    const label = String(boxLabel ?? '')
        .trim()
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^[-.]+|[-.]+$/g, '') || 'box';
    return `${EDGE_DIAGNOSTICS_FILE_PREFIX}${label}-${diagnosticsStamp(nowMs, timeZone)}.zip`;
}

const README = [
    'eTabella venue box diagnostics',
    '',
    'Each .json file is one section, written by the box at the time in manifest.json.',
    'Never included: transcript text, sign-in tokens, room or operator codes, passwords, hashes, Eclipse logins.',
    '',
].join('\n');

/** The zip: README.txt, then one `<section>.json` per entry (redacted), in the given order. */
export function buildDiagnosticsFile(sections: ReadonlyArray<readonly [name: string, value: unknown]>, fileName: string, nowMs: number): EdgeDiagnosticsFile {
    const entries = [{ name: 'README.txt', data: README, mtimeMs: nowMs }];
    for (const [name, value] of sections) {
        entries.push({ name: `${name}.json`, data: `${JSON.stringify(redactForDiagnostics(value), null, 2)}\n`, mtimeMs: nowMs });
    }
    return { fileName, contentType: EDGE_DIAGNOSTICS_CONTENT_TYPE, body: buildZip(entries) };
}
