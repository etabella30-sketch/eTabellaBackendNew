import { calculateJwkThumbprint, exportJWK, generateKeyPair, JWK } from 'jose';
import { EDGE_TOKEN_ALG } from './constants';

/**
 * Public verification keys (spec §7 "Key rotation with two active kids", §8.4): the JWK checks, the public JWKS shape
 * `GET authapi/edge/jwks` serves and `e.hello` carries as `edgeTokenKeys`, and key generation. Never logs or echoes
 * key material.
 */

/** A published verification key: exactly these fields, never private material. */
export interface EdgePublicJwk {
    kty: 'EC';
    crv: 'P-256';
    x: string;
    y: string;
    kid: string;
    alg: 'ES256';
    use: 'sig';
}

/** The public JWKS (RFC 7517). */
export interface EdgeJwks {
    keys: EdgePublicJwk[];
}

/** base64url of a P-256 coordinate or private scalar: 32 bytes, 43 characters. */
export const EDGE_JWK_COORD_RE = /^[A-Za-z0-9_-]{43}$/;
/** A `kid`: 1-128 URL-safe characters (plus `:`). */
export const EDGE_KID_RE = /^[A-Za-z0-9._~:-]{1,128}$/;

/** Throws (without echoing key material) unless `jwk` is an EC P-256 key usable for ES256 (`needPrivate`: with `d`). */
export function checkEdgeJwk(jwk: unknown, needPrivate: boolean, label: string): JWK {
    if (!jwk || typeof jwk !== 'object' || Array.isArray(jwk)) throw new Error(`${label}: not a JWK object`);
    const k = jwk as JWK;
    if (k.kty !== 'EC' || k.crv !== 'P-256') throw new Error(`${label}: must be an EC P-256 key (ES256)`);
    if (typeof k.x !== 'string' || !EDGE_JWK_COORD_RE.test(k.x) || typeof k.y !== 'string' || !EDGE_JWK_COORD_RE.test(k.y)) {
        throw new Error(`${label}: x / y coordinates are missing or malformed`);
    }
    if (needPrivate && (typeof k.d !== 'string' || !EDGE_JWK_COORD_RE.test(k.d))) throw new Error(`${label}: the private part (d) is missing`);
    if (k.alg !== undefined && k.alg !== EDGE_TOKEN_ALG) throw new Error(`${label}: alg must be ${EDGE_TOKEN_ALG}`);
    if (k.use !== undefined && k.use !== 'sig') throw new Error(`${label}: use must be sig`);
    if (k.kid !== undefined && (typeof k.kid !== 'string' || !EDGE_KID_RE.test(k.kid))) throw new Error(`${label}: kid is malformed`);
    return k;
}

/** The public half of a checked key, with its `kid` (the RFC 7638 thumbprint when the JWK has none). */
export async function edgePublicJwk(k: JWK): Promise<EdgePublicJwk> {
    const bare = { kty: 'EC', crv: 'P-256', x: k.x, y: k.y };
    const kid = k.kid ?? await calculateJwkThumbprint(bare, 'sha256');
    return { kty: 'EC', crv: 'P-256', x: k.x as string, y: k.y as string, kid, alg: 'ES256', use: 'sig' };
}

/**
 * The public JWKS for a list of keys, public or private (private parts are dropped), in the given order. For a
 * publisher that holds only public keys, e.g. realtime-server filling `edgeTokenKeys` in `e.hello`.
 */
export async function buildEdgeJwks(keys: JWK[]): Promise<EdgeJwks> {
    if (!Array.isArray(keys) || !keys.length) throw new Error('edge token keys: empty key list');
    const out: EdgePublicJwk[] = [];
    for (const [i, k] of keys.entries()) {
        const pub = await edgePublicJwk(checkEdgeJwk(k, false, `edge token key [${i}]`));
        if (out.some(p => p.kid === pub.kid)) throw new Error(`edge token keys: duplicate kid ${pub.kid}`);
        out.push(pub);
    }
    return { keys: out };
}

/** Decodes one config value: a JWK, or an array of JWKs, as JSON or base64(JSON). Never echoes the value. */
export function parseEdgeJwkList(raw: string, label: string): JWK[] {
    const text = String(raw ?? '').trim();
    let json = text;
    if (!text.startsWith('{') && !text.startsWith('[')) {
        json = Buffer.from(text.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8').trim();
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error(`${label}: not JSON or base64(JSON)`);
    }
    const list = Array.isArray(parsed) ? parsed : [parsed];
    if (!list.length) throw new Error(`${label}: empty key list`);
    return list as JWK[];
}

/**
 * A new private EC P-256 JWK with `alg`, `use` and `kid` set (`kid` defaults to the RFC 7638 thumbprint). For ops
 * generating `EDGE_TOKEN_KEY`, and for tests.
 */
export async function generateEdgeSigningKey(kid?: string): Promise<JWK> {
    const { privateKey } = await generateKeyPair(EDGE_TOKEN_ALG, { extractable: true });
    const jwk = await exportJWK(privateKey);
    const id = kid ?? await calculateJwkThumbprint({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, 'sha256');
    return { ...jwk, kid: id, alg: EDGE_TOKEN_ALG, use: 'sig' };
}
