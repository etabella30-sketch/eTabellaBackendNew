/**
 * A minimal ZIP writer (PKZIP APPNOTE 6.3: local file headers, central directory, end record; DEFLATE or STORE,
 * UTF-8 names, no ZIP64) for the diagnostics download. Node built-ins only (zlib.deflateRawSync, zlib.crc32).
 */
import * as zlib from 'zlib';

export interface ZipEntry {
    /** Path inside the archive ('/' separators, no leading '/', no '..'). */
    readonly name: string;
    readonly data: Buffer | string;
    /** Modification time (epoch ms); written as an MS-DOS date/time in UTC. */
    readonly mtimeMs: number;
}

const MAX_ZIP32 = 0xffffffff;
const UTF8_FLAG = 0x0800;

function crc32(data: Buffer): number {
    const fn = (zlib as unknown as { crc32?: (d: Buffer) => number }).crc32;
    if (typeof fn === 'function') return fn(data) >>> 0;
    let crc = 0xffffffff;
    for (const byte of data) {
        crc ^= byte;
        for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS date/time (UTC, 2-second resolution; clamped to 1980–2107). */
export function dosDateTime(ms: number): { readonly time: number; readonly date: number } {
    const d = new Date(Number.isFinite(ms) ? ms : 0);
    const year = Math.min(2107, Math.max(1980, d.getUTCFullYear()));
    const clamped = year !== d.getUTCFullYear();
    const time = clamped ? 0 : (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | Math.floor(d.getUTCSeconds() / 2);
    const date = clamped ? ((year - 1980) << 9) | (1 << 5) | 1 : ((year - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
    return { time, date };
}

function checkName(name: string): void {
    if (!name || name.startsWith('/') || name.includes('\\') || name.split('/').some(p => p === '..' || p === '')) {
        throw new Error(`zip: invalid entry name "${name}"`);
    }
}

/** Build the archive. Entries keep their order; duplicate names are refused. */
export function buildZip(entries: readonly ZipEntry[]): Buffer {
    const locals: Buffer[] = [];
    const centrals: Buffer[] = [];
    const names = new Set<string>();
    let offset = 0;
    for (const entry of entries) {
        checkName(entry.name);
        if (names.has(entry.name)) throw new Error(`zip: duplicate entry "${entry.name}"`);
        names.add(entry.name);
        const raw = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
        const deflated = zlib.deflateRawSync(raw, { level: 9 });
        const useDeflate = deflated.length < raw.length;
        const body = useDeflate ? deflated : raw;
        const method = useDeflate ? 8 : 0;
        const crc = crc32(raw);
        const name = Buffer.from(entry.name, 'utf8');
        const { time, date } = dosDateTime(entry.mtimeMs);
        if (raw.length > MAX_ZIP32 || offset > MAX_ZIP32) throw new Error('zip: archive too large (no ZIP64)');

        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4); // version needed: 2.0 (deflate)
        local.writeUInt16LE(UTF8_FLAG, 6);
        local.writeUInt16LE(method, 8);
        local.writeUInt16LE(time, 10);
        local.writeUInt16LE(date, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(body.length, 18);
        local.writeUInt32LE(raw.length, 22);
        local.writeUInt16LE(name.length, 26);
        local.writeUInt16LE(0, 28);
        locals.push(local, name, body);

        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(0x0314, 4); // made by: UNIX, 2.0
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(UTF8_FLAG, 8);
        central.writeUInt16LE(method, 10);
        central.writeUInt16LE(time, 12);
        central.writeUInt16LE(date, 14);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(body.length, 20);
        central.writeUInt32LE(raw.length, 24);
        central.writeUInt16LE(name.length, 28);
        central.writeUInt16LE(0, 30); // extra
        central.writeUInt16LE(0, 32); // comment
        central.writeUInt16LE(0, 34); // disk
        central.writeUInt16LE(0, 36); // internal attrs
        central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // external attrs: regular file, rw-r--r--
        central.writeUInt32LE(offset, 42);
        centrals.push(central, name);

        offset += local.length + name.length + body.length;
    }
    const centralSize = centrals.reduce((n, b) => n + b.length, 0);
    if (entries.length > 0xffff || offset > MAX_ZIP32) throw new Error('zip: archive too large (no ZIP64)');
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(centralSize, 12);
    end.writeUInt32LE(offset, 16);
    end.writeUInt16LE(0, 20);
    return Buffer.concat([...locals, ...centrals, end]);
}
