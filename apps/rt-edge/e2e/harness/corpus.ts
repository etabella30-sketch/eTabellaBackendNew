/**
 * The morning test feed (spec §12.3): the recorded Bridge hearing of tcp-server-main (`commands.json`), read IN PLACE
 * from its own folder and converted exactly as tcp-server-main/tcp.js `jsonToHex` + `emitData` do (one socket write
 * per entry: an entry without `cmdType` is the 2-digit ASCII hex of `data1`, any other its `hexCmd`).
 *
 * The file holds real hearing text: nothing here copies, logs or prints it. Only counts and digests leave this module,
 * and the golden it is checked against (tools/ci/golden-replay/extended/tcp-server-commands) is digest-only.
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export const TCP_SERVER_DIR = process.env.RT_EDGE_TCP_SERVER_DIR || 'D:/etabella tech/tcp-server-main';
export const TCP_SERVER_SCRIPT = path.join(TCP_SERVER_DIR, 'tcp.js');
export const COMMANDS_FILE = path.join(TCP_SERVER_DIR, 'commands.json');

const BACKEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const GOLDEN_DIR = path.join(BACKEND_ROOT, 'tools', 'ci', 'golden-replay', 'extended', 'tcp-server-commands');

export function corpusAvailable(): boolean {
    return fs.existsSync(COMMANDS_FILE) && fs.existsSync(TCP_SERVER_SCRIPT);
}

/** One socket write of tcp.js: its bytes and the entry kind ('TEXT' or the Bridge command letter). */
export interface CorpusEntry {
    readonly bytes: Buffer;
    readonly kind: string;
}

export interface Corpus {
    readonly entries: readonly CorpusEntry[];
    /** Every entry concatenated (what a faithful transport delivers, in order). */
    readonly stream: Buffer;
    readonly sha256: string;
}

/** tcp.js stringToAsciiHex: 2-digit lowercase hex per UTF-16 code unit (kept byte-for-byte, quirks included). */
function stringToAsciiHex(str: string): string {
    return str
        .split('')
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
}

let cached: Corpus | null = null;

export function loadCorpus(): Corpus {
    if (cached) return cached;
    const raw = JSON.parse(fs.readFileSync(COMMANDS_FILE).toString('utf-8')) as Array<{ cmdType?: string; data1?: string; hexCmd?: string }>;
    const entries = raw.map(a => ({
        bytes: Buffer.from(!a.cmdType ? stringToAsciiHex(String(a.data1 ?? '')) : String(a.hexCmd ?? ''), 'hex'),
        kind: a.cmdType ? String(a.cmdType) : 'TEXT',
    }));
    const stream = Buffer.concat(entries.map(e => e.bytes));
    cached = Object.freeze({ entries: Object.freeze(entries), stream, sha256: createHash('sha256').update(stream).digest('hex') });
    return cached;
}

/** The digest-only golden of this hearing (committed in the repo; no text). */
export interface Golden {
    readonly nSesid: string;
    readonly nLines: number;
    readonly tz: string;
    readonly chunks: number;
    readonly bytes: number;
    readonly sha256: string;
    readonly lineCount: number;
    readonly pages: number;
    readonly root: string;
    readonly protocol: string;
}

export function loadGolden(): Golden {
    const corpus = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, 'corpus.json'), 'utf8'));
    const golden = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, 'golden.json'), 'utf8'));
    return Object.freeze({
        nSesid: String(corpus.nSesid),
        nLines: Number(corpus.nLines),
        tz: String(corpus.cTimezone),
        chunks: Number(golden.input.chunks),
        bytes: Number(golden.input.bytes),
        sha256: String(golden.input.sha256),
        lineCount: Number(golden.lineCount),
        pages: Number(golden.canonical.pages),
        root: String(golden.canonical.root),
        protocol: String(golden.detectedProtocol),
    });
}

/** Index of the first entry at or after `from` whose first byte is text (not STX): a stream that starts mid-page. */
export function firstTextEntryFrom(corpus: Corpus, from: number): number {
    for (let i = from; i < corpus.entries.length; i++) {
        const e = corpus.entries[i];
        if (e.kind === 'TEXT' && e.bytes.length && e.bytes[0] !== 0x02) return i;
    }
    return -1;
}
