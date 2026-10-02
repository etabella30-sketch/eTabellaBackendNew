import { importJWK, JWK, jwtVerify, KeyLike, SignJWT } from 'jose';
import { EDGE_TOKEN_ALG } from './constants';
import { checkEdgeJwk, EdgeJwks, EdgePublicJwk, edgePublicJwk } from './jwks';
import { EdgeKeyResolver } from './key-resolver';

/**
 * An ES256 signing key ring with rotation (spec §7 "Key rotation with two active kids"): the active key signs; the
 * previous keys stay accepted and published until every token they signed has expired, so a rotation never signs
 * anyone out. authapi holds one for edge tokens (`EDGE_TOKEN_KEY`); tests and tools use it to sign edge tokens the way
 * authapi does. Private material is never published or logged.
 */

export interface EdgeSigningKeyConfig {
    /** The active signing key: a private EC P-256 JWK (`d` present). */
    signingKey: JWK;
    /** Keys still accepted and published during a rotation; public or private JWKs. */
    previousKeys?: JWK[];
}

/** Names the configuration in error messages (never the key itself). */
export interface EdgeKeyLabels {
    /** The active key, e.g. `EDGE_TOKEN_KEY`. */
    active: string;
    /** The previous keys; the index is appended (`EDGE_TOKEN_KEY_PREVIOUS[0]`). */
    previous: string;
    /** The set as a whole, e.g. `edge token keys`. */
    set: string;
}

/** authapi's labels (its config variable names), the default. */
export const EDGE_TOKEN_KEY_LABELS: Readonly<EdgeKeyLabels> = { active: 'EDGE_TOKEN_KEY', previous: 'EDGE_TOKEN_KEY_PREVIOUS', set: 'edge token keys' };

export class EdgeSigningKeyRing {
    private constructor(
        /** `kid` of the active signing key. */
        readonly kid: string,
        readonly signingKey: KeyLike,
        private readonly verifyKeys: Map<string, KeyLike>,
        private readonly published: EdgePublicJwk[],
    ) { }

    /**
     * Imports and checks the configured keys: EC P-256 only, unique kids, and the active private key must match its
     * own public coordinates (a sign-then-verify probe), so a mis-pasted `d` fails at load, not at the first verifier.
     */
    static async create(config: EdgeSigningKeyConfig, labels: EdgeKeyLabels = EDGE_TOKEN_KEY_LABELS): Promise<EdgeSigningKeyRing> {
        if (!config || typeof config !== 'object') throw new Error(`${labels.set}: no configuration`);
        const active = checkEdgeJwk(config.signingKey, true, labels.active);
        const prevList = config.previousKeys ?? [];
        if (!Array.isArray(prevList)) throw new Error(`${labels.previous}: not a key list`);
        const previous = prevList.map((k, i) => checkEdgeJwk(k, false, `${labels.previous}[${i}]`));

        const published: EdgePublicJwk[] = [];
        const verifyKeys = new Map<string, KeyLike>();
        for (const k of [active, ...previous]) {
            const pub = await edgePublicJwk(k);
            if (verifyKeys.has(pub.kid)) throw new Error(`${labels.set}: duplicate kid ${pub.kid}`);
            verifyKeys.set(pub.kid, await importJWK({ kty: 'EC', crv: 'P-256', x: pub.x, y: pub.y }, EDGE_TOKEN_ALG) as KeyLike);
            published.push(pub);
        }
        const kid = published[0].kid;
        const signingKey = await importJWK({ kty: 'EC', crv: 'P-256', x: active.x, y: active.y, d: active.d }, EDGE_TOKEN_ALG) as KeyLike;

        const probe = await new SignJWT({ probe: true }).setProtectedHeader({ alg: EDGE_TOKEN_ALG, kid }).sign(signingKey);
        try {
            await jwtVerify(probe, verifyKeys.get(kid), { algorithms: [EDGE_TOKEN_ALG] });
        } catch {
            throw new Error(`${labels.active}: the private key does not match its public coordinates`);
        }
        return new EdgeSigningKeyRing(kid, signingKey, verifyKeys, published);
    }

    /** The public JWKS, active key first. A fresh copy each call. */
    jwks(): EdgeJwks {
        return { keys: this.published.map(k => ({ ...k })) };
    }

    /** The verification key for a token's `kid`, or null for an unknown kid. */
    verificationKey(kid: unknown): KeyLike | null {
        return typeof kid === 'string' ? this.verifyKeys.get(kid) ?? null : null;
    }

    /** A key resolver over this ring (active and previous keys), for `verifyEdgeToken`. */
    resolver(): EdgeKeyResolver {
        return kid => this.verificationKey(kid);
    }
}
