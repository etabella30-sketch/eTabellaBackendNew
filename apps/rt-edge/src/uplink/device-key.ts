/**
 * The box's device key (spec §3.4 install, §5.3, D2): ECDSA P-256. Pilot boxes keep a software key in
 * `paths.deviceKeyFile` (PKCS#8 PEM, mode 0600, on the TPM-unlocked encrypted disk) and report `bTpmKey=false`; the
 * full chain (Phase 5) moves the key into the TPM behind the same interface.
 *
 * - `fingerprintHex` = sha256 of the DER SubjectPublicKeyInfo, lowercase hex (`RtEdgeNode.cKeyFpr`, what
 *   `et_rtedge_enroll` computes); `fingerprint` is the same digest as colon-separated upper-case pairs, printed on
 *   the box console and compared by the admin (`et_rtedge_confirm_key` ignores colons and case).
 * - Signatures are DER ECDSA-SHA256, base64 (Node's default encoding for EC keys).
 * - The signed payloads are plain concatenations, exactly as the spec writes them with "‖".
 */
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, KeyObject, sign, verify } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export class DeviceKey {
    private constructor(
        readonly privateKey: KeyObject,
        readonly publicKey: KeyObject,
    ) {}

    static generate(): DeviceKey {
        const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
        return new DeviceKey(privateKey, publicKey);
    }

    static fromPem(pem: string | Buffer): DeviceKey {
        const privateKey = createPrivateKey(pem);
        if (privateKey.asymmetricKeyType !== 'ec' || (privateKey.asymmetricKeyDetails as { namedCurve?: string } | undefined)?.namedCurve !== 'prime256v1') {
            throw new Error('rt-edge: the device key must be an EC P-256 private key');
        }
        return new DeviceKey(privateKey, createPublicKey(privateKey));
    }

    /** Read the key file; throws ENOENT when the box was never enrolled. */
    static async load(file: string): Promise<DeviceKey> {
        return DeviceKey.fromPem(await fs.promises.readFile(file));
    }

    static exists(file: string): boolean {
        try {
            return fs.statSync(file).isFile();
        } catch {
            return false;
        }
    }

    /** Write the private key atomically (tmp 0600 + fsync + rename); the directory is created 0700. */
    async save(file: string): Promise<void> {
        await fs.promises.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
        const tmp = `${file}.next-${process.pid}`;
        const handle = await fs.promises.open(tmp, 'w', 0o600);
        try {
            await handle.writeFile(this.pem(), 'utf8');
            await handle.sync();
        } finally {
            await handle.close();
        }
        await fs.promises.rename(tmp, file);
        await fs.promises.chmod(file, 0o600).catch(() => undefined);
    }

    pem(): string {
        return this.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    }

    spkiDer(): Buffer {
        return this.publicKey.export({ type: 'spki', format: 'der' });
    }

    /** Standard base64 DER SPKI (`cPubKey`). */
    spkiB64(): string {
        return this.spkiDer().toString('base64');
    }

    fingerprintHex(): string {
        return createHash('sha256').update(this.spkiDer()).digest('hex');
    }

    fingerprint(): string {
        return formatFingerprint(this.fingerprintHex());
    }

    /** base64 DER ECDSA-P256-SHA256 over the UTF-8 payload. */
    sign(payload: string): string {
        return sign('sha256', Buffer.from(payload, 'utf8'), this.privateKey).toString('base64');
    }
}

/** `ab12…` → `AB:12:…`. */
export function formatFingerprint(hex: string): string {
    return (hex.toUpperCase().match(/.{2}/g) ?? []).join(':');
}

/** §5.3 socket auth: the box signs `nonce‖edgeId‖bootId`. */
export function edgeAuthPayload(nonce: string, edgeId: string, bootId: string): string {
    return `${nonce}${edgeId}${bootId}`;
}

/** uplink.port.ts `ensureCertificate` step 3: `nonce‖edgeId‖sha256hex(csrDer)`. */
export function certRequestPayload(nonce: string, edgeId: string, csrDer: Buffer): string {
    return `${nonce}${edgeId}${createHash('sha256').update(csrDer).digest('hex')}`;
}

/**
 * archive-url (held capture upload): `nonce‖edgeId‖nSesid‖sha256` — the cloud's `edgeArchiveSigningPayload`
 * (realtime-server edge-auth.middleware.ts; its `EdgeArchiveUrlReq` is `{edgeId, nonce, sig, nSesid, sha256, bytes}`).
 */
export function archiveUrlPayload(nonce: string, edgeId: string, nSesid: string, sha256: string): string {
    return `${nonce}${edgeId}${nSesid}${sha256}`;
}

/** Verify a device signature against a base64 SPKI (the cloud's check; specs and the fake cloud use it). */
export function verifyDeviceSignature(spkiB64: string, payload: string, sigB64: string): boolean {
    try {
        const key = createPublicKey({ key: Buffer.from(spkiB64, 'base64'), format: 'der', type: 'spki' });
        return verify('sha256', Buffer.from(payload, 'utf8'), key, Buffer.from(sigB64, 'base64'));
    } catch {
        return false;
    }
}
