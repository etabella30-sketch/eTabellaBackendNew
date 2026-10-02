/**
 * A strict little ZIP reader for the specs: walks the end record and the central directory, checks every local
 * header against it, inflates, and verifies sizes and CRC-32. Throws on anything malformed.
 */
import * as zlib from 'zlib';

export interface UnzippedEntry {
    readonly name: string;
    readonly data: Buffer;
    readonly method: number;
    readonly dosTime: number;
    readonly dosDate: number;
}

function crc32(data: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of data) {
        crc ^= byte;
        for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    return (crc ^ 0xffffffff) >>> 0;
}

export function unzip(zip: Buffer): UnzippedEntry[] {
    const eocd = zip.length - 22;
    if (eocd < 0 || zip.readUInt32LE(eocd) !== 0x06054b50) throw new Error('unzip: no end of central directory record');
    const count = zip.readUInt16LE(eocd + 10);
    if (zip.readUInt16LE(eocd + 8) !== count) throw new Error('unzip: entry counts differ');
    const cdSize = zip.readUInt32LE(eocd + 12);
    const cdOffset = zip.readUInt32LE(eocd + 16);
    if (cdOffset + cdSize !== eocd) throw new Error('unzip: central directory does not end at the end record');
    const out: UnzippedEntry[] = [];
    let p = cdOffset;
    for (let i = 0; i < count; i++) {
        if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error(`unzip: bad central header ${i}`);
        const flags = zip.readUInt16LE(p + 8);
        const method = zip.readUInt16LE(p + 10);
        const dosTime = zip.readUInt16LE(p + 12);
        const dosDate = zip.readUInt16LE(p + 14);
        const crc = zip.readUInt32LE(p + 16);
        const compSize = zip.readUInt32LE(p + 20);
        const size = zip.readUInt32LE(p + 24);
        const nameLen = zip.readUInt16LE(p + 28);
        const extraLen = zip.readUInt16LE(p + 30);
        const commentLen = zip.readUInt16LE(p + 32);
        const local = zip.readUInt32LE(p + 42);
        const name = zip.subarray(p + 46, p + 46 + nameLen).toString(flags & 0x0800 ? 'utf8' : 'latin1');
        p += 46 + nameLen + extraLen + commentLen;

        if (zip.readUInt32LE(local) !== 0x04034b50) throw new Error(`unzip: bad local header for ${name}`);
        if (zip.readUInt16LE(local + 8) !== method || zip.readUInt32LE(local + 14) !== crc) throw new Error(`unzip: local header of ${name} differs`);
        if (zip.readUInt32LE(local + 18) !== compSize || zip.readUInt32LE(local + 22) !== size) throw new Error(`unzip: sizes of ${name} differ`);
        const lNameLen = zip.readUInt16LE(local + 26);
        const lExtraLen = zip.readUInt16LE(local + 28);
        if (zip.subarray(local + 30, local + 30 + lNameLen).toString('utf8') !== name) throw new Error(`unzip: name of ${name} differs`);
        const start = local + 30 + lNameLen + lExtraLen;
        const body = zip.subarray(start, start + compSize);
        const data = method === 8 ? zlib.inflateRawSync(body) : method === 0 ? Buffer.from(body) : (() => { throw new Error(`unzip: method ${method}`); })();
        if (data.length !== size) throw new Error(`unzip: size of ${name} is wrong`);
        if (crc32(data) !== crc) throw new Error(`unzip: CRC of ${name} is wrong`);
        out.push({ name, data, method, dosTime, dosDate });
    }
    if (p !== eocd) throw new Error('unzip: trailing bytes in the central directory');
    return out;
}
