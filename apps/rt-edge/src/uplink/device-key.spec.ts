import { createHash, createPublicKey, generateKeyPairSync, verify, X509Certificate } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { buildCsr, derChildren, fromPem, OID, readDer, toPem } from './csr';
import { archiveUrlPayload, certRequestPayload, DeviceKey, edgeAuthPayload, formatFingerprint, verifyDeviceSignature } from './device-key';
import { signCsr } from './testing/fake-cloud';

describe('uplink device key and CSR (spec §3.4, §5.3, §8.3)', () => {
    let dir: string;
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-key-'));
    });
    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    it('generates a P-256 software key, saves it atomically (0600) and loads the same key back', async () => {
        const key = DeviceKey.generate();
        const file = path.join(dir, 'sub', 'device-key.pem');
        expect(DeviceKey.exists(file)).toBe(false);
        await key.save(file);
        expect(DeviceKey.exists(file)).toBe(true);
        expect(fs.readdirSync(path.dirname(file))).toEqual(['device-key.pem']); // no temp file left
        if (process.platform !== 'win32') expect(fs.statSync(file).mode & 0o777).toBe(0o600);
        const loaded = await DeviceKey.load(file);
        expect(loaded.fingerprintHex()).toBe(key.fingerprintHex());
        expect(loaded.spkiB64()).toBe(key.spkiB64());
    });

    it('the fingerprint is sha256 of the DER SPKI, printed as colon-separated upper-case pairs', () => {
        const key = DeviceKey.generate();
        const hex = createHash('sha256').update(Buffer.from(key.spkiB64(), 'base64')).digest('hex');
        expect(key.fingerprintHex()).toBe(hex);
        expect(key.fingerprint()).toBe(formatFingerprint(hex));
        expect(key.fingerprint()).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
        expect(formatFingerprint('ab01')).toBe('AB:01');
    });

    it('signs the spec payloads (DER ECDSA-SHA256, base64) and the cloud verifies them with the SPKI only', () => {
        const key = DeviceKey.generate();
        expect(edgeAuthPayload('n1', 'e1', 'b1')).toBe('n1e1b1');
        expect(archiveUrlPayload('n1', 'e1', 'ses-1', 'ff')).toBe('n1e1ses-1ff');
        const der = Buffer.from('csr-bytes');
        expect(certRequestPayload('n1', 'e1', der)).toBe(`n1e1${createHash('sha256').update(der).digest('hex')}`);
        const sig = key.sign(edgeAuthPayload('n1', 'e1', 'b1'));
        expect(verifyDeviceSignature(key.spkiB64(), 'n1e1b1', sig)).toBe(true);
        expect(verifyDeviceSignature(key.spkiB64(), 'n1e1b2', sig)).toBe(false);
        expect(verifyDeviceSignature(DeviceKey.generate().spkiB64(), 'n1e1b1', sig)).toBe(false);
        expect(verifyDeviceSignature('not-a-key', 'n1e1b1', sig)).toBe(false);
        // Node's verify with the public key object agrees (the cloud's middleware path).
        expect(verify('sha256', Buffer.from('n1e1b1'), createPublicKey({ key: Buffer.from(key.spkiB64(), 'base64'), format: 'der', type: 'spki' }), Buffer.from(sig, 'base64'))).toBe(true);
    });

    it('refuses a key that is not EC P-256, and a missing file', async () => {
        const rsa = generateKeyPairSync('rsa', { modulusLength: 1024 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
        expect(() => DeviceKey.fromPem(rsa)).toThrow(/P-256/);
        const p384 = generateKeyPairSync('ec', { namedCurve: 'P-384' }).privateKey.export({ type: 'pkcs8', format: 'pem' });
        expect(() => DeviceKey.fromPem(p384)).toThrow(/P-256/);
        await expect(DeviceKey.load(path.join(dir, 'missing.pem'))).rejects.toThrow(/ENOENT/);
    });

    it('builds a PKCS#10 CSR (CN + one SAN dNSName, signed by the NEW key) that a CA turns into a certificate for that key', () => {
        const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
        const csr = buildCsr('k7q2m9x4.etabella-edge.net', privateKey, publicKey);
        expect(csr.pem).toMatch(/^-----BEGIN CERTIFICATE REQUEST-----\n/);
        expect(fromPem(csr.pem, 'CERTIFICATE REQUEST').equals(csr.der)).toBe(true);
        const [info, alg, sig] = derChildren(readDer(csr.der));
        const [version, subject, spki, attrs] = derChildren(info);
        expect(version.content).toEqual(Buffer.from([0]));
        expect(subject.raw.includes(Buffer.from('k7q2m9x4.etabella-edge.net'))).toBe(true);
        expect(spki.raw.equals(publicKey.export({ type: 'spki', format: 'der' }))).toBe(true);
        expect(attrs.tag).toBe(0xa0);
        expect(attrs.raw.includes(Buffer.from('k7q2m9x4.etabella-edge.net'))).toBe(true);
        expect(alg.raw.includes(Buffer.from([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02]))).toBe(true); // ecdsa-with-SHA256 (OID.ecdsaWithSha256)
        expect(OID.ecdsaWithSha256).toBe('1.2.840.10045.4.3.2');
        // The signature covers the info, by the CSR's own key.
        expect(verify('sha256', info.raw, publicKey, sig.content.subarray(1))).toBe(true);

        const ca = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey;
        const chain = signCsr(csr.pem, 'k7q2m9x4.etabella-edge.net', ca);
        const cert = new X509Certificate(chain);
        expect(cert.checkPrivateKey(privateKey)).toBe(true);
        expect(cert.subjectAltName).toBe('DNS:k7q2m9x4.etabella-edge.net');
        expect(toPem('X', Buffer.from('ab'))).toBe('-----BEGIN X-----\nYWI=\n-----END X-----\n');
        expect(() => fromPem('nothing', 'X')).toThrow(/no X/);
    });
});
