/**
 * A PKCS#10 certificate request for the box's LAN certificate (spec §8.3, uplink.port.ts `ensureCertificate` step 2),
 * built with node:crypto and a minimal DER encoder (Node has no CSR builder and no dependency may be added):
 *
 *   CertificationRequest ::= SEQUENCE { certificationRequestInfo, signatureAlgorithm (ecdsa-with-SHA256), signature }
 *   CertificationRequestInfo ::= SEQUENCE { version 0, subject (CN=<host>), subjectPKInfo, attributes [0] {
 *       extensionRequest { subjectAltName { dNSName <host> } } } }
 *
 * The TLS key is a fresh P-256 key per issuance, never the device key.
 */
import { KeyObject, sign } from 'crypto';

export function der(tag: number, content: Buffer): Buffer {
    const len = content.length;
    if (len < 0x80) return Buffer.concat([Buffer.from([tag, len]), content]);
    const bytes: number[] = [];
    for (let n = len; n > 0; n = Math.floor(n / 256)) bytes.unshift(n & 0xff);
    return Buffer.concat([Buffer.from([tag, 0x80 | bytes.length, ...bytes]), content]);
}

export const derSeq = (...items: Buffer[]): Buffer => der(0x30, Buffer.concat(items));
export const derSet = (...items: Buffer[]): Buffer => der(0x31, Buffer.concat(items));

export function derOid(dotted: string): Buffer {
    const [a, b, ...rest] = dotted.split('.').map(Number);
    const out = [40 * a + b];
    for (const n of rest) {
        const group = [n & 0x7f];
        for (let v = Math.floor(n / 128); v > 0; v = Math.floor(v / 128)) group.unshift((v & 0x7f) | 0x80);
        out.push(...group);
    }
    return der(0x06, Buffer.from(out));
}

export const OID = Object.freeze({
    commonName: '2.5.4.3',
    subjectAltName: '2.5.29.17',
    extensionRequest: '1.2.840.113549.1.9.14',
    ecdsaWithSha256: '1.2.840.10045.4.3.2',
});

/** Name ::= SEQUENCE { SET { SEQUENCE { CN, UTF8String } } } */
export function derNameCn(cn: string): Buffer {
    return derSeq(derSet(derSeq(derOid(OID.commonName), der(0x0c, Buffer.from(cn, 'utf8')))));
}

/** GeneralNames with one dNSName per host. */
export function derSanDns(hosts: readonly string[]): Buffer {
    return derSeq(...hosts.map(h => der(0x82, Buffer.from(h, 'ascii'))));
}

export interface CsrResult {
    readonly der: Buffer;
    readonly pem: string;
}

export function buildCsr(host: string, privateKey: KeyObject, publicKey: KeyObject): CsrResult {
    const spki = publicKey.export({ type: 'spki', format: 'der' });
    const extensions = derSeq(derSeq(derOid(OID.subjectAltName), der(0x04, derSanDns([host]))));
    const attributes = der(0xa0, derSeq(derOid(OID.extensionRequest), derSet(extensions)));
    const info = derSeq(der(0x02, Buffer.from([0])), derNameCn(host), spki, attributes);
    const signature = sign('sha256', info, privateKey);
    const csr = derSeq(info, derSeq(derOid(OID.ecdsaWithSha256)), der(0x03, Buffer.concat([Buffer.from([0]), signature])));
    return { der: csr, pem: toPem('CERTIFICATE REQUEST', csr) };
}

export function toPem(label: string, body: Buffer): string {
    const b64 = body.toString('base64').replace(/(.{64})/g, '$1\n').trim();
    return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----\n`;
}

export function fromPem(pem: string, label: string): Buffer {
    const m = new RegExp(`-----BEGIN ${label}-----([\\s\\S]*?)-----END ${label}-----`).exec(pem);
    if (!m) throw new Error(`no ${label} in PEM`);
    return Buffer.from(m[1].replace(/\s+/g, ''), 'base64');
}

// ---- a minimal DER reader (the CSR's own check in specs, and the fake cloud) ---------------------------------------

export interface DerNode {
    readonly tag: number;
    /** The whole TLV. */
    readonly raw: Buffer;
    readonly content: Buffer;
}

export function readDer(buf: Buffer, offset = 0): DerNode & { readonly next: number } {
    const tag = buf[offset];
    let len = buf[offset + 1];
    let hdr = 2;
    if (len & 0x80) {
        const n = len & 0x7f;
        len = 0;
        for (let i = 0; i < n; i++) len = len * 256 + buf[offset + 2 + i];
        hdr = 2 + n;
    }
    const start = offset + hdr;
    return { tag, raw: buf.subarray(offset, start + len), content: buf.subarray(start, start + len), next: start + len };
}

export function derChildren(node: DerNode): DerNode[] {
    const out: DerNode[] = [];
    let off = 0;
    while (off < node.content.length) {
        const child = readDer(node.content, off);
        out.push(child);
        off = child.next;
    }
    return out;
}
