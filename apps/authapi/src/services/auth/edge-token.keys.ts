import { JWK, KeyLike } from 'jose';
import {
    EDGE_TOKEN_KEY_LABELS, EdgeJwks, EdgeSigningKeyConfig, EdgeSigningKeyRing, generateEdgeSigningKey, parseEdgeJwkList,
} from '@app/edge-token';

/**
 * Edge-token signing keys (spec §7 "Key rotation with two active kids", §8.4).
 *
 * The active key signs; previous keys stay accepted and published until every token they signed has expired
 * (≤ 12 h), so a rotation never signs anyone out. realtime-server hands the public set to boxes in `e.hello`
 * (`edgeTokenKeys`), and boxes verify offline. Private material never leaves authapi.
 *
 * Config (never committed, never logged):
 *   EDGE_TOKEN_KEY           the active private EC P-256 JWK, as JSON or base64(JSON); `kid` optional
 *                            (the RFC 7638 thumbprint is used when absent)
 *   EDGE_TOKEN_KEY_PREVIOUS  optional: the previous key(s), public or private, as a JWK or a JSON array of JWKs
 *
 * The JWK checks, the public JWKS shape and the key ring itself are `@app/edge-token`'s (the venue box signs its own
 * room-code tokens with the same ring); this file keeps authapi's configuration names.
 */

export { buildEdgeJwks, parseEdgeJwkList } from '@app/edge-token';
export type { EdgeJwks, EdgePublicJwk } from '@app/edge-token';

export type EdgeTokenKeyConfig = EdgeSigningKeyConfig;

/** authapi's edge-token key ring: `@app/edge-token`'s `EdgeSigningKeyRing` with the EDGE_TOKEN_KEY names in its errors. */
export class EdgeTokenKeyRing {
    private constructor(private readonly ring: EdgeSigningKeyRing) { }

    /**
     * Imports and checks the configured keys: EC P-256 only, unique kids, and the active private key must match its
     * own public coordinates (a sign-then-verify probe), so a mis-pasted `d` fails at load, not at the first box.
     */
    static async create(config: EdgeTokenKeyConfig): Promise<EdgeTokenKeyRing> {
        return new EdgeTokenKeyRing(await EdgeSigningKeyRing.create(config, EDGE_TOKEN_KEY_LABELS));
    }

    /** `kid` of the active signing key. */
    get kid(): string {
        return this.ring.kid;
    }

    get signingKey(): KeyLike {
        return this.ring.signingKey;
    }

    /** The public JWKS, active key first. A fresh copy each call. */
    jwks(): EdgeJwks {
        return this.ring.jwks();
    }

    /** The verification key for a token's `kid`, or null for an unknown kid. */
    verificationKey(kid: unknown): KeyLike | null {
        return this.ring.verificationKey(kid);
    }
}

/**
 * Reads EDGE_TOKEN_KEY / EDGE_TOKEN_KEY_PREVIOUS. Null when EDGE_TOKEN_KEY is unset (edge sign-in then answers
 * `edge_unavailable`, and the rest of authapi runs as before). Throws on a malformed value.
 */
export function edgeTokenKeyConfigFromEnv(get: (name: string) => string | undefined | null): EdgeTokenKeyConfig | null {
    const active = get('EDGE_TOKEN_KEY');
    if (typeof active !== 'string' || !active.trim()) return null;
    const signing = parseEdgeJwkList(active, 'EDGE_TOKEN_KEY');
    if (signing.length !== 1) throw new Error('EDGE_TOKEN_KEY: exactly one key expected');
    const prev = get('EDGE_TOKEN_KEY_PREVIOUS');
    const previousKeys = typeof prev === 'string' && prev.trim() ? parseEdgeJwkList(prev, 'EDGE_TOKEN_KEY_PREVIOUS') : [];
    return { signingKey: signing[0], previousKeys };
}

/** A new private EC P-256 JWK with `alg`, `use` and `kid` set: for key generation by ops, and for tests. */
export function generateEdgeTokenKey(kid?: string): Promise<JWK> {
    return generateEdgeSigningKey(kid);
}
