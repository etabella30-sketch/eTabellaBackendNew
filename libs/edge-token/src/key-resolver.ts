import { importJWK, KeyLike } from 'jose';
import { EDGE_TOKEN_ALG } from './constants';
import { EDGE_JWK_COORD_RE, EDGE_KID_RE, EdgeJwks, EdgePublicJwk } from './jwks';

/**
 * Key resolution for verifiers that hold only public keys: a venue box (the JWKS from `e.hello`'s `edgeTokenKeys`,
 * cached so it verifies offline) and realtime-server (authapi's published JWKS).
 */

/** Resolves a token's `kid` to its verification key; null for an unknown kid. */
export type EdgeKeyResolver = (kid: string | undefined) => KeyLike | null | Promise<KeyLike | null>;

/**
 * What a JWKS may arrive as: `{keys:[…]}` (`GET authapi/edge/jwks`), a bare key list (`e.hello` `edgeTokenKeys`,
 * `Array<Record<string, unknown>>`), or nothing yet.
 */
export type EdgeJwksInput = EdgeJwks | { keys?: readonly unknown[] | null } | readonly unknown[] | null | undefined;

/** The usable public keys of a JWKS and how many entries were skipped as unusable. */
export interface EdgeUsableKeys {
    keys: EdgePublicJwk[];
    /** Entries that were not an EC P-256 ES256 signing key with a kid, or repeated an earlier kid. */
    ignored: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** The usable public part of one JWKS entry, or null. Private parts are never kept. */
function usableKey(k: unknown): EdgePublicJwk | null {
    if (!isRecord(k)) return null;
    if (k.kty !== 'EC' || k.crv !== 'P-256') return null;
    if (typeof k.x !== 'string' || !EDGE_JWK_COORD_RE.test(k.x) || typeof k.y !== 'string' || !EDGE_JWK_COORD_RE.test(k.y)) return null;
    if (k.alg !== undefined && k.alg !== EDGE_TOKEN_ALG) return null;
    if (k.use !== undefined && k.use !== 'sig') return null;
    if (typeof k.kid !== 'string' || !EDGE_KID_RE.test(k.kid)) return null;
    return { kty: 'EC', crv: 'P-256', x: k.x, y: k.y, kid: k.kid, alg: 'ES256', use: 'sig' };
}

/**
 * The usable keys of a JWKS, in order. An entry that is not an EC P-256 key for ES256 signatures with a `kid` (an
 * RSA key, `alg` other than ES256, `use: enc`, malformed coordinates) is skipped, never trusted. A repeated `kid` keeps
 * the first entry (publishers list the active key first and refuse duplicates anyway).
 */
export function usableEdgeKeys(jwks: EdgeJwksInput): EdgeUsableKeys {
    const list: readonly unknown[] = Array.isArray(jwks) ? jwks : isRecord(jwks) && Array.isArray(jwks.keys) ? jwks.keys : [];
    const keys: EdgePublicJwk[] = [];
    let ignored = 0;
    for (const entry of list) {
        const k = usableKey(entry);
        if (!k || keys.some(p => p.kid === k.kid)) ignored++;
        else keys.push(k);
    }
    return { keys, ignored };
}

const importPublic = (k: EdgePublicJwk): Promise<KeyLike | null> =>
    importJWK({ kty: k.kty, crv: k.crv, x: k.x, y: k.y }, EDGE_TOKEN_ALG).then(key => key as KeyLike, () => null);

/** A key resolver over a published JWKS (what a box or realtime-server holds). Keys are imported once, on first use. */
export function edgeKeyResolverFromJwks(jwks: EdgeJwksInput): EdgeKeyResolver {
    const cache = new Map<string, Promise<KeyLike | null>>();
    const byKid = new Map(usableEdgeKeys(jwks).keys.map(k => [k.kid, k] as const));
    return (kid) => {
        if (typeof kid !== 'string' || !byKid.has(kid)) return null;
        if (!cache.has(kid)) cache.set(kid, importPublic(byKid.get(kid)));
        return cache.get(kid);
    };
}

/** What `EdgeKeyCache.update` did. */
export interface EdgeKeyCacheUpdate {
    /** False when the new set had no usable key: the cache kept its previous keys. */
    ok: boolean;
    /** The kids now in the cache, in published order (active first). */
    kids: string[];
    added: string[];
    removed: string[];
    /** Entries of the new set that were skipped as unusable. */
    ignored: number;
}

/**
 * The verification keys a verifier currently trusts, replaced as a whole whenever a fresh JWKS arrives (each
 * `e.hello`, or a periodic `GET edge/jwks`). During a rotation the set carries two kids and tokens signed by either
 * verify; once the old kid is dropped from the published set, tokens it signed stop verifying here too.
 *
 * An update without any usable key is refused (the previous keys stay): an empty `edgeTokenKeys` means authapi's keys
 * are not configured, and dropping every key would sign out every online room reader at once. Persist `jwks()` (the
 * box keeps it in its store) and pass it back to the constructor at boot, so verification works offline after a
 * restart.
 */
export class EdgeKeyCache {
    private keys: EdgePublicJwk[] = [];
    private imported = new Map<string, Promise<KeyLike | null>>();

    constructor(initial?: EdgeJwksInput) {
        if (initial !== undefined && initial !== null) this.update(initial);
    }

    /** Replaces the trusted set with the usable keys of `jwks` (see the class comment for the empty-set rule). */
    update(jwks: EdgeJwksInput): EdgeKeyCacheUpdate {
        const { keys, ignored } = usableEdgeKeys(jwks);
        const before = this.keys.map(k => k.kid);
        if (!keys.length) return { ok: false, kids: before, added: [], removed: [], ignored };
        const imported = new Map<string, Promise<KeyLike | null>>();
        for (const k of keys) {
            const id = cacheId(k);
            if (this.imported.has(id)) imported.set(id, this.imported.get(id));
        }
        this.keys = keys;
        this.imported = imported;
        const kids = keys.map(k => k.kid);
        return { ok: true, kids, added: kids.filter(k => !before.includes(k)), removed: before.filter(k => !kids.includes(k)), ignored };
    }

    /** The verification key for `kid` in the current set, or null. Stable: pass it once as a verifier's resolver. */
    readonly resolve: EdgeKeyResolver = (kid) => {
        if (typeof kid !== 'string') return null;
        const k = this.keys.find(p => p.kid === kid);
        if (!k) return null;
        const id = cacheId(k);
        if (!this.imported.has(id)) this.imported.set(id, importPublic(k));
        return this.imported.get(id);
    };

    /** The trusted kids, active first. */
    kids(): string[] {
        return this.keys.map(k => k.kid);
    }

    /** The trusted set as a JWKS (a fresh copy), for persisting. */
    jwks(): EdgeJwks {
        return { keys: this.keys.map(k => ({ ...k })) };
    }

    get size(): number {
        return this.keys.length;
    }
}

/** A kid whose coordinates change is a different key; never reuse its old import. */
const cacheId = (k: EdgePublicJwk): string => `${k.kid}|${k.x}|${k.y}`;
