import { Logger } from '@nestjs/common';
import type { Request } from 'express';
import {
  EDGE_REVOCATION_REDIS_KEYS,
  EdgeKeyCache,
  EdgeKeyResolver,
  EdgeTokenClaims,
  edgeBearerFamily,
  edgeTokenCovers,
  isEdgeTokenError,
  verifyEdgeToken,
} from '@app/edge-token';

import { isUuid } from '../services/utility/safe-path';
import { CASE_OF_BUNDLE_DETAIL_SQL } from '../services/session/session-access-gate';

/**
 * D22 (spec §7 `realtime-auth.middleware.ts` "Edge-token branch", §8.4 "Where the edge token works"): the cloud
 * realtime-server accepts a venue box's EDGE TOKEN (the "room sign-in": ES256, `typ: edge+jwt`, issued by authapi)
 * on exactly the routes the box proxies to the cloud, and only for that box's cases.
 *
 *  - Routes: EDGE_TOKEN_ROUTES, the cloud paths of apps/rt-edge `rt-routes.ts` (`local-or-cloud`, `cloud-read`,
 *    `cloud-write`; realtime-edge-token.spec.ts checks the two lists are the same). Any other route refuses an edge
 *    token (403), whatever its own auth. Box-signed tokens (room code / operator, `typ: edge-box+jwt`, issuer
 *    `box:<id>`) are never valid here (401): only the box that minted one may read it.
 *  - Verification (libs/edge-token verifyEdgeToken): ES256 only, a `kid` of the published JWKS (authapi
 *    `GET edge/jwks`, configured as EDGE_TOKEN_JWKS and optionally fetched from EDGE_TOKEN_JWKS_URL), issuer, audience
 *    `edge:<edge>`, every claim, the 12 h / 24 h lifetime rules, `exp` with no skew, and the revocation list
 *    (authapi's Redis `edge:revoked:<jti>`; a failed lookup refuses).
 *  - Case scope: every case the request names, directly (nCaseid) or through what it names (a session, fact,
 *    highlight, DocLink, issue, category, issue detail or bundle file), must be in the token's `cases` claim AND be
 *    assigned (RtEdgeCase) to that box while the box is active. A request that names no case refuses (403).
 *  - The verified user is `sub`, never an admin (`isAdmin: false`); the caller then overwrites the request's identity
 *    keys with it exactly as for a cookie JWT. The browser binding (`user/<id>` in Redis) is not consulted.
 *  - The user's account must still be active (UserMaster.cStatus = 'A', the rule et_signin and authapi's edge sign-in
 *    apply), checked per request with a 60 s cache (review #10): a deactivated account loses the RT allowlist within a
 *    minute instead of keeping it for the rest of the token's 12 h. A failed lookup refuses (503) unless a fresh
 *    answer is cached.
 *
 * Everything else, the cookie / Bearer JWT of the web app above all, is untouched: a token whose JWS header is not an
 * edge family never reaches this file.
 */

const get = (path: string) => ({ method: 'GET', path });
const post = (path: string) => ({ method: 'POST', path });
const put = (path: string) => ({ method: 'PUT', path });
const del = (path: string) => ({ method: 'DELETE', path });

/** The RT allowlist: method and cloud path (as the cloud declares it, no leading slash). */
export const EDGE_TOKEN_ROUTES: ReadonlyArray<{ readonly method: string; readonly path: string }> = Object.freeze([
  // one session's transcript (local on the box while it holds the session, else proxied)
  get('session/activesession/detail'),
  get('session/realtimedatabysesid'),
  get('feed/pages/total'),
  get('feed/pages/data'),
  // allowlisted reads
  get('marknav/all'),
  get('marknav/quickmarklist'),
  get('feed/annotations'),
  get('doclink/docdetail'),
  get('issue/issuelist_V2'),
  get('factsheet/detail'),
  get('factsheet/issues'),
  get('factsheet/contacts'),
  get('factsheet/links'),
  get('factsheet/shared'),
  get('factsheet/tasks'),
  get('factsheet/teamusers'),
  // allowlisted writes (marks, issues; v1 online only)
  post('fact/insertHighlights'),
  post('fact/deleteHighlights'),
  post('fact/insertquickfact'),
  post('fact/quickfactupdate'),
  post('fact/insertfact'),
  post('fact/addhighlight'),
  post('factsheet/save'),
  post('factsheet/delete'),
  post('doclink/insertdoc'),
  post('doclink/docdelete'),
  put('issue/updateIssue'),
  post('issue/insertIssue'),
  del('issue/deleteIssue'),
  del('issue/delete/multi/issue'),
  post('issue/insertCategory'),
  post('issue/qfact/sequence'),
  post('issue/qfact/claim/sequence'),
  put('issue/updateClaimDetail'),
].map((r) => Object.freeze(r)));

const ROUTE_KEYS: ReadonlySet<string> = new Set(EDGE_TOKEN_ROUTES.map((r) => `${r.method} /${r.path.toLowerCase()}`));

/**
 * Is `METHOD url` on the RT allowlist? Express matches routes case-insensitively and with one optional trailing
 * slash, so the path is compared the same way. A percent-escape, backslash, dot or empty segment never matches.
 */
export function isEdgeTokenRoute(method: unknown, url: unknown): boolean {
  if (typeof method !== 'string' || typeof url !== 'string') return false;
  const raw = url.split('?')[0];
  if (!raw.startsWith('/') || raw.length > 512 || /[%\\\0\s]/.test(raw)) return false;
  const segments = raw.slice(1).split('/');
  if (segments[segments.length - 1] === '') segments.pop();
  if (!segments.length || segments.some((s) => s === '' || s === '.' || s === '..')) return false;
  return ROUTE_KEYS.has(`${method.toUpperCase()} /${segments.join('/').toLowerCase()}`);
}

// ------------------------------------------------------------------------------------------------ case scope reads

/** The case of each session named (deleted sessions are not found). */
export const EDGE_SCOPE_SESSIONS_SQL =
  'SELECT "nSesid"::text AS "nSesid", "nCaseid"::text AS "nCaseid" FROM "RSessionMaster" WHERE "nSesid" = ANY($1::uuid[]) AND "dDelDt" IS NULL';

/** The cases of rows a request acts on, by the id key it names them with. */
export const EDGE_SCOPE_ENTITY_SQL: Readonly<Record<string, string>> = Object.freeze({
  fact: 'SELECT "nCaseid"::text AS "nCaseid" FROM "FactMaster" WHERE "nFSid" = ANY($1::uuid[])',
  highlight: 'SELECT "nCaseid"::text AS "nCaseid" FROM "RHighlights" WHERE "nHid" = ANY($1::uuid[])',
  doclink: 'SELECT "nCaseid"::text AS "nCaseid" FROM "DocMaster" WHERE "nDocid" = ANY($1::uuid[])',
  issue: 'SELECT "nCaseid"::text AS "nCaseid" FROM "RIssueMaster" WHERE "nIid" = ANY($1::uuid[])',
  category: 'SELECT "nCaseid"::text AS "nCaseid" FROM "IssueCategory" WHERE "nICid" = ANY($1::uuid[])',
  issueDetail: 'SELECT "nCaseid"::text AS "nCaseid" FROM "RIssueDetail" WHERE "nIDid" = ANY($1::uuid[])',
});

/** The request keys that name a row, and the read that finds its case. */
const ENTITY_KEYS: ReadonlyArray<readonly [string, keyof typeof EDGE_SCOPE_ENTITY_SQL | 'bundleDetail']> = [
  ['nFSid', 'fact'],
  ['nHid', 'highlight'],
  ['nDocid', 'doclink'],
  ['jDocids', 'doclink'],
  ['nIid', 'issue'],
  ['jIids', 'issue'],
  ['nICid', 'category'],
  ['nIDid', 'issueDetail'],
  ['nBundledetailid', 'bundleDetail'],
];

/** Review #10: is the token user's account still active (et_signin's rule)? $1 nUserid. No row: not active. */
export const EDGE_USER_ACTIVE_SQL = `SELECT ("cStatus" = 'A') AS "bActive" FROM "UserMaster" WHERE "nUserid" = $1::uuid`;

/** How long one user's account state is trusted (one lookup per user per minute on the hot RT routes). */
export const EDGE_USER_ACTIVE_CACHE_MS = 60_000;
const USER_ACTIVE_CACHE_MAX = 10_000;

/** D22: the active box's assigned cases among $2 (spec README "Direct reads": RtEdgeCase of an active box). */
export const EDGE_BOX_CASES_SQL = `SELECT c."nCaseid"::text AS "nCaseid" FROM "RtEdgeCase" c
  JOIN "RtEdgeNode" n ON n."nEdgeid" = c."nEdgeid"
 WHERE c."nEdgeid" = $1 AND c."nCaseid" = ANY($2::uuid[]) AND n."cStatus" = 'A' AND n."dDelDt" IS NULL`;

const UUID_G = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Every UUID in a request value: a string (a JSON list included), an array or an object (3 levels deep). */
export function uuidsIn(value: unknown, depth = 0): string[] {
  if (value === null || value === undefined || depth > 3) return [];
  if (typeof value === 'string') return (value.match(UUID_G) ?? []).map((id) => id.toLowerCase());
  if (Array.isArray(value)) return value.flatMap((v) => uuidsIn(v, depth + 1));
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap((v) => uuidsIn(v, depth + 1));
  return [];
}

/**
 * An id value that means "no id": the ones the DTOs' IsItUUID turns into null before the controller runs (falsy,
 * 'null', 'undefined', '0'). The RT page sends nIDid='null', nSessionid='null' and nIid=0 for "none" (issue 03).
 */
export function absentId(value: unknown): boolean {
  return !value || value === 'null' || value === 'undefined' || value == '0';
}

/** A request id value that is present but not usable (not "no id" and not a UUID): the request is refused. */
function badId(value: unknown): boolean {
  return !absentId(value) && !isUuid(value);
}

export interface RowQueryDb {
  rowQuery(text: string, params: any[]): Promise<any>;
}

export type EdgeScopeResult =
  | { ok: true; cases: string[] }
  | { ok: false; reason: 'NO_CASE' | 'BAD_ID' | 'UNKNOWN_SESSION' | 'UNKNOWN_CASE'; message: string }
  | { ok: false; reason: 'LOOKUP_FAILED'; message: string };

async function rows(db: RowQueryDb, text: string, params: any[]): Promise<any[]> {
  const res: any = await db.rowQuery(text, params);
  if (!res?.success || !Array.isArray(res.data)) throw new Error(String(res?.error ?? 'no rows'));
  return res.data;
}

/**
 * Every case the request names: its nCaseid, the case of each session it names (nSesid / nSessionid; an unknown or
 * deleted session refuses), and the case of each row it acts on (a row that does not exist names no case; a row
 * whose case is unknown refuses). Body and query both count. Never throws.
 */
export async function requestCases(db: RowQueryDb, req: Pick<Request, 'query' | 'body'>): Promise<EdgeScopeResult> {
  const sources = [req?.query, req?.body].filter((s): s is Record<string, any> => !!s && typeof s === 'object' && !Array.isArray(s));
  const cases = new Set<string>();
  const sessions = new Set<string>();
  const entities = new Map<string, Set<string>>();
  for (const src of sources) {
    for (const key of ['nCaseid']) {
      if (badId(src[key])) return { ok: false, reason: 'BAD_ID', message: `${key} is not an id` };
      if (isUuid(src[key])) cases.add(String(src[key]).toLowerCase());
    }
    for (const key of ['nSesid', 'nSessionid']) {
      if (badId(src[key])) return { ok: false, reason: 'BAD_ID', message: `${key} is not an id` };
      if (isUuid(src[key])) sessions.add(String(src[key]).toLowerCase());
    }
    for (const [key, kind] of ENTITY_KEYS) {
      const value = src[key];
      if (absentId(value)) continue;
      if (key.startsWith('n') && badId(value)) return { ok: false, reason: 'BAD_ID', message: `${key} is not an id` };
      const ids = uuidsIn(value);
      if (!ids.length) continue;
      if (!entities.has(kind)) entities.set(kind, new Set());
      ids.forEach((id) => entities.get(kind)!.add(id));
    }
  }
  try {
    if (sessions.size) {
      const found = await rows(db, EDGE_SCOPE_SESSIONS_SQL, [[...sessions]]);
      const byId = new Map(found.map((r) => [String(r?.nSesid ?? '').toLowerCase(), r?.nCaseid]));
      for (const id of sessions) {
        const nCaseid = byId.get(id);
        if (!isUuid(nCaseid)) return { ok: false, reason: 'UNKNOWN_SESSION', message: 'The session is not known' };
        cases.add(String(nCaseid).toLowerCase());
      }
    }
    for (const [kind, ids] of entities) {
      if (kind === 'bundleDetail') {
        for (const id of ids) {
          const found = await rows(db, CASE_OF_BUNDLE_DETAIL_SQL, [id]);
          for (const r of found) {
            if (!isUuid(r?.nCaseid)) return { ok: false, reason: 'UNKNOWN_CASE', message: 'The bundle file has no case' };
            cases.add(String(r.nCaseid).toLowerCase());
          }
        }
        continue;
      }
      const found = await rows(db, EDGE_SCOPE_ENTITY_SQL[kind], [[...ids]]);
      for (const r of found) {
        if (!isUuid(r?.nCaseid)) return { ok: false, reason: 'UNKNOWN_CASE', message: 'The item has no case' };
        cases.add(String(r.nCaseid).toLowerCase());
      }
    }
  } catch (error) {
    return { ok: false, reason: 'LOOKUP_FAILED', message: (error as Error)?.message ?? String(error) };
  }
  if (!cases.size) return { ok: false, reason: 'NO_CASE', message: 'The request names no case or session' };
  return { ok: true, cases: [...cases].sort() };
}

// ------------------------------------------------------------------------------------------------ the authenticator

/** What a request authenticated by an edge token carries (beside req.user). */
export interface EdgeRequestAuth {
  nEdgeid: string;
  jti: string;
  /** the cases this request reaches (all within the token's claim and the box's assignment) */
  cases: string[];
}

export type EdgeAuthOutcome =
  | { ok: true; userId: string; edge: EdgeRequestAuth; claims: EdgeTokenClaims }
  | { ok: false; status: number; cCode: string; message: string };

export interface EdgeTokenAuthDeps {
  config: { get(key: string): any };
  /** authapi's revocation keys live in the shared Redis */
  redis: { keyExists(key: string): Promise<any> };
  db: RowQueryDb;
  now?: () => number;
  /** GET the JWKS at a URL (default: global fetch, 5 s timeout) */
  fetchJson?: (url: string) => Promise<unknown>;
}

/** Config keys this branch reads. */
export const EDGE_TOKEN_CONFIG = Object.freeze({
  enabled: 'EDGE_ENABLED',
  /** Public JWKS of authapi's edge-token signer (`GET authapi/edge/jwks`), JSON. Also what boxes get in hello. */
  jwks: 'EDGE_TOKEN_JWKS',
  /** Optional: authapi's `edge/jwks` URL, fetched every JWKS_REFRESH_MS (the configured JWKS stays the fallback). */
  jwksUrl: 'EDGE_TOKEN_JWKS_URL',
});

export const JWKS_REFRESH_MS = 10 * 60 * 1000;
const JWKS_FETCH_TIMEOUT_MS = 5000;

const refuse = (status: number, cCode: string, message: string): EdgeAuthOutcome => ({ ok: false, status, cCode, message });

async function defaultFetchJson(url: string): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), JWKS_FETCH_TIMEOUT_MS);
  (timer as any).unref?.();
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export class EdgeTokenAuthenticator {
  private readonly logger = new Logger('RealtimeEdgeToken');
  private readonly now: () => number;
  private readonly fetchJson: (url: string) => Promise<unknown>;
  private readonly configured = new EdgeKeyCache();
  private configuredRaw: unknown = undefined;
  private readonly fetched = new EdgeKeyCache();
  private fetchedAt = 0;
  private fetching: Promise<void> | null = null;
  private readonly userActive = new Map<string, { active: boolean; atMs: number }>();

  constructor(private readonly deps: EdgeTokenAuthDeps) {
    this.now = deps.now ?? (() => Date.now());
    this.fetchJson = deps.fetchJson ?? defaultFetchJson;
  }

  private enabled(): boolean {
    const raw = String(this.deps.config.get(EDGE_TOKEN_CONFIG.enabled) ?? '').trim().toLowerCase();
    return raw === '1' || raw === 'true';
  }

  /** The keys to verify with: authapi's fetched JWKS when configured and fetched, else the configured JWKS. */
  async keys(): Promise<EdgeKeyResolver | null> {
    const raw = this.deps.config.get(EDGE_TOKEN_CONFIG.jwks);
    if (raw !== this.configuredRaw) {
      this.configuredRaw = raw;
      if (raw) {
        try {
          this.configured.update(typeof raw === 'string' ? JSON.parse(raw) : raw);
        } catch {
          this.logger.error(`${EDGE_TOKEN_CONFIG.jwks} is not valid JSON; edge tokens cannot be verified from it`);
        }
      }
    }
    const url = String(this.deps.config.get(EDGE_TOKEN_CONFIG.jwksUrl) ?? '').trim();
    if (url && this.now() - this.fetchedAt >= JWKS_REFRESH_MS) {
      const refresh = this.refresh(url);
      // Wait only when nothing at all can verify yet; otherwise refresh in the background.
      if (!this.fetched.size && !this.configured.size) await refresh;
    }
    if (this.fetched.size) return this.fetched.resolve;
    if (this.configured.size) return this.configured.resolve;
    return null;
  }

  private refresh(url: string): Promise<void> {
    if (this.fetching) return this.fetching;
    this.fetchedAt = this.now();
    this.fetching = this.fetchJson(url)
      .then((jwks) => {
        const update = this.fetched.update(jwks as any);
        if (!update.ok) this.logger.warn(`${url} returned no usable edge-token key; keeping the previous keys`);
      })
      .catch((error) => this.logger.warn(`edge-token JWKS fetch from ${url} failed: ${(error as Error)?.message ?? error}`))
      .finally(() => {
        this.fetching = null;
      });
    return this.fetching;
  }

  /**
   * Review #10: whether `nUserid`'s account is active, cached EDGE_USER_ACTIVE_CACHE_MS (both answers). Null when it
   * cannot be told: the lookup failed and nothing fresh is cached (the caller refuses, fail closed).
   */
  private async userIsActive(nUserid: string): Promise<boolean | null> {
    const id = String(nUserid ?? '').toLowerCase();
    if (!isUuid(id)) return false;
    const now = this.now();
    const hit = this.userActive.get(id);
    if (hit && now - hit.atMs < EDGE_USER_ACTIVE_CACHE_MS) return hit.active;
    let active: boolean;
    try {
      const found = await rows(this.deps.db, EDGE_USER_ACTIVE_SQL, [id]);
      active = found[0]?.bActive === true;
    } catch (error) {
      this.logger.warn(`edge-token user status lookup failed: ${(error as Error)?.message ?? error}`);
      return null;
    }
    if (this.userActive.size >= USER_ACTIVE_CACHE_MAX) {
      for (const [k, v] of this.userActive) if (now - v.atMs >= EDGE_USER_ACTIVE_CACHE_MS) this.userActive.delete(k);
      if (this.userActive.size >= USER_ACTIVE_CACHE_MAX) this.userActive.delete(this.userActive.keys().next().value);
    }
    this.userActive.set(id, { active, atMs: now });
    return active;
  }

  /**
   * The D22 decision for one request carrying an edge-family token. Never throws. Order: box-signed refused, edge off,
   * route allowlist, keys, signature and claims (+ expiry, revocation), the user's account still active (#10), case
   * scope (claim), box assignment.
   */
  async authenticate(req: Pick<Request, 'method' | 'originalUrl' | 'url' | 'query' | 'body'>, token: string): Promise<EdgeAuthOutcome> {
    const family = edgeBearerFamily(token);
    if (family === 'box') {
      return refuse(401, 'box_token_refused', 'Room-code and operator sign-ins work only on the venue box.');
    }
    if (family !== 'online') return refuse(401, 'token_invalid', 'This room sign-in is not valid.');
    if (!this.enabled()) return refuse(503, 'edge_disabled', 'Venue boxes are switched off on this server.');
    if (!isEdgeTokenRoute(req.method, req.originalUrl || req.url)) {
      return refuse(403, 'route_not_allowed', 'A room sign-in cannot be used for this request. Open it on etabella.net.');
    }
    let keys: EdgeKeyResolver | null;
    try {
      keys = await this.keys();
    } catch {
      keys = null;
    }
    if (!keys) return refuse(503, 'keys_unavailable', 'Room sign-ins cannot be checked right now.');

    let claims: EdgeTokenClaims;
    try {
      claims = await verifyEdgeToken(token, keys, {
        nowMs: this.now(),
        revocation: {
          isRevoked: async (jti) => Number(await this.deps.redis.keyExists(EDGE_REVOCATION_REDIS_KEYS.jti(jti))) > 0,
        },
      });
    } catch (error) {
      if (isEdgeTokenError(error)) return refuse(error.status, error.code, error.message);
      this.logger.warn(`edge-token check failed: ${(error as Error)?.message ?? error}`);
      return refuse(503, 'check_unavailable', 'Room sign-ins cannot be checked right now.');
    }

    const active = await this.userIsActive(claims.sub);
    if (active === null) return refuse(503, 'check_unavailable', 'Room sign-ins cannot be checked right now.');
    if (!active) return refuse(401, 'user_inactive', 'This account is no longer active. Sign in on etabella.net again.');

    const scope = await requestCases(this.deps.db, req);
    if (scope.ok === false) {
      if (scope.reason === 'LOOKUP_FAILED') {
        this.logger.warn(`edge-token case scope lookup failed: ${scope.message}`);
        return refuse(503, 'check_unavailable', 'Room sign-ins cannot be checked right now.');
      }
      return refuse(403, 'case_not_allowed', 'This room sign-in does not cover this case.');
    }
    if (!edgeTokenCovers(claims, scope.cases)) {
      return refuse(403, 'case_not_allowed', 'This room sign-in does not cover this case.');
    }
    let assigned: Set<string>;
    try {
      const found = await rows(this.deps.db, EDGE_BOX_CASES_SQL, [claims.edge, scope.cases]);
      assigned = new Set(found.map((r) => String(r?.nCaseid ?? '').toLowerCase()));
    } catch (error) {
      this.logger.warn(`edge-token box assignment lookup failed: ${(error as Error)?.message ?? error}`);
      return refuse(503, 'check_unavailable', 'Room sign-ins cannot be checked right now.');
    }
    if (!scope.cases.every((id) => assigned.has(id))) {
      return refuse(403, 'case_not_allowed', 'This room sign-in does not cover this case.');
    }
    return { ok: true, userId: claims.sub, claims, edge: { nEdgeid: claims.edge, jti: claims.jti, cases: scope.cases } };
  }
}

/** True for a token whose JWS header names an edge family (an edge token or a box-signed token). */
export function isEdgeFamilyToken(token: unknown): boolean {
  return edgeBearerFamily(token) !== null;
}
