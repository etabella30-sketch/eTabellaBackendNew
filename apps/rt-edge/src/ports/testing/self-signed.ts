/**
 * SPEC HELPER (imported by *.spec.ts only; nothing in the box imports it): a self-signed P-256 X.509 certificate
 * built at test time with node:crypto and a minimal DER encoder, so no fixture key is committed and no dependency is
 * added. Not for production use: the box's certificate comes from the cloud (ports/certificate.ts).
 */
import * as crypto from 'crypto';

function der(tag: number, content: Buffer): Buffer {
    const len = content.length;
    if (len < 0x80) return Buffer.concat([Buffer.from([tag, len]), content]);
    const bytes: number[] = [];
    for (let n = len; n > 0; n >>= 8) bytes.unshift(n & 0xff);
    return Buffer.concat([Buffer.from([tag, 0x80 | bytes.length, ...bytes]), content]);
}

const derSeq = (...items: Buffer[]): Buffer => der(0x30, Buffer.concat(items));

function derOid(dotted: string): Buffer {
    const [a, b, ...rest] = dotted.split('.').map(Number);
    const out = [40 * a + b];
    for (const n of rest) {
        const group = [n & 0x7f];
        for (let v = n >> 7; v > 0; v >>= 7) group.unshift((v & 0x7f) | 0x80);
        out.push(...group);
    }
    return der(0x06, Buffer.from(out));
}

/** UTCTime (1950–2049), else GeneralizedTime, to the second. */
function derTime(ms: number): Buffer {
    const iso = new Date(Math.floor(ms / 1000) * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const year = Number(iso.slice(0, 4));
    return year >= 1950 && year < 2050 ? der(0x17, Buffer.from(`${iso.slice(2)}Z`)) : der(0x18, Buffer.from(`${iso}Z`));
}

export interface SelfSignedOptions {
    /** Subject and issuer CN. */
    readonly cn: string;
    /** subjectAltName DNS names; none = no SAN extension. */
    readonly hosts?: readonly string[];
    /** Default: now − 1 h. */
    readonly notBeforeMs?: number;
    /** Default: now + 1 day. */
    readonly notAfterMs?: number;
}

export interface SelfSigned {
    /** PEM certificate. */
    readonly cert: string;
    /** PEM PKCS#8 private key. */
    readonly key: string;
}

export function selfSignedCertificate(opts: SelfSignedOptions): SelfSigned {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const now = Date.now();
    const sigAlg = derSeq(derOid('1.2.840.10045.4.3.2')); // ecdsa-with-SHA256
    const name = derSeq(der(0x31, derSeq(derOid('2.5.4.3'), der(0x0c, Buffer.from(opts.cn, 'utf8')))));
    const serial = crypto.randomBytes(8);
    serial[0] = (serial[0] & 0x7f) | 0x01;
    const parts: Buffer[] = [
        der(0xa0, der(0x02, Buffer.from([2]))), // v3
        der(0x02, serial),
        sigAlg,
        name,
        derSeq(derTime(opts.notBeforeMs ?? now - 3_600_000), derTime(opts.notAfterMs ?? now + 86_400_000)),
        name,
        publicKey.export({ type: 'spki', format: 'der' }),
    ];
    if (opts.hosts && opts.hosts.length) {
        const san = derSeq(...opts.hosts.map(h => der(0x82, Buffer.from(h, 'ascii'))));
        parts.push(der(0xa3, derSeq(derSeq(derOid('2.5.29.17'), der(0x04, san)))));
    }
    const tbs = derSeq(...parts);
    const signature = crypto.sign('sha256', tbs, privateKey);
    const certDer = derSeq(tbs, sigAlg, der(0x03, Buffer.concat([Buffer.from([0]), signature])));
    const b64 = certDer.toString('base64').replace(/(.{64})/g, '$1\n').trim();
    return {
        cert: `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----\n`,
        key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    };
}
