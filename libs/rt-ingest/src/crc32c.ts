/**
 * CRC32C (Castagnoli, reflected polynomial 0x82F63B78), the checksum of every
 * raw-journal record (spec §5.1). Node's zlib.crc32 is the IEEE polynomial,
 * so the table lives here. Chainable: crc32c(b, crc32c(a)) === crc32c(a ++ b).
 */
const TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0x82f63b78 : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

export function crc32c(data: Uint8Array, seed = 0): number {
    let c = (seed ^ 0xffffffff) >>> 0;
    for (let i = 0; i < data.length; i++) c = TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}
