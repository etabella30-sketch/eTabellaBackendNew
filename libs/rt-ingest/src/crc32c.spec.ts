import { crc32c } from './crc32c';

describe('crc32c', () => {
    it('matches the Castagnoli check value for "123456789"', () => {
        expect(crc32c(Buffer.from('123456789', 'ascii'))).toBe(0xe3069283);
    });

    it('is 0 for empty input and differs from IEEE crc32', () => {
        expect(crc32c(Buffer.alloc(0))).toBe(0);
        // IEEE CRC-32 of "123456789" is 0xCBF43926
        expect(crc32c(Buffer.from('123456789', 'ascii'))).not.toBe(0xcbf43926);
    });

    it('chains: crc32c(b, crc32c(a)) === crc32c(a ++ b)', () => {
        const a = Buffer.from('hello ');
        const b = Buffer.from('world');
        expect(crc32c(b, crc32c(a))).toBe(crc32c(Buffer.concat([a, b])));
    });
});
