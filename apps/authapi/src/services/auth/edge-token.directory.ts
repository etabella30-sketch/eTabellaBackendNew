import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import {
    EDGE_UUID_RE, EdgeBoxRecord, EdgeBoxRegistry, EdgeCloudSession, EdgeCloudSessionInfo, EdgeUserDirectory, EdgeUserRecord,
} from './edge-token.types';

/**
 * DB- and Redis-backed providers for edge sign-in: the box registry, the user directory and the cloud-session resolver.
 *
 * RtEdgeNode / RtEdgeCase come from the Phase-2 migration `2026-10-19_rt_edge_core.up.sql` (spec §4.8); until it is
 * applied the box query fails and edge sign-in answers `server_error`. A failed query always throws: the service maps
 * it to `server_error`, so a database outage never reads as "no such box" or "not on any of the box's cases".
 */

type RowDb = Pick<DbService, 'rowQuery'>;

/** $1 nEdgeid → the box, its status and its assigned cases. Soft-deleted boxes are not found. */
export const EDGE_BOX_SQL = `SELECT n."nEdgeid"::text AS "nEdgeid", n."cSlug", n."cStatus",
       COALESCE(array_agg(c."nCaseid"::text) FILTER (WHERE c."nCaseid" IS NOT NULL), '{}') AS "caseIds"
  FROM "RtEdgeNode" n
  LEFT JOIN "RtEdgeCase" c ON c."nEdgeid" = n."nEdgeid"
 WHERE n."nEdgeid" = $1::uuid AND n."dDelDt" IS NULL
 GROUP BY n."nEdgeid", n."cSlug", n."cStatus"`;

/** $1 nUserid → email and whether the account is active (the rule et_signin applies: cStatus = 'A'). */
export const EDGE_USER_SQL = `SELECT u."nUserid"::text AS "nUserid", u."cEmail", (u."cStatus" = 'A') AS "bActive"
  FROM "UserMaster" u
 WHERE u."nUserid" = $1::uuid`;

/**
 * $1 nUserid, $2 uuid[] candidate cases → the candidates the user may open: an active case-team row (TeamRelation,
 * cStatus 'A'), or an assignment to one of the case's live sessions (RSessionDetail), the two ways SESSION_ACCESS_SQL
 * lets a user into a session.
 */
export const EDGE_MEMBER_CASES_SQL = `SELECT DISTINCT t."nCaseid"::text AS "nCaseid"
  FROM "TeamRelation" t
 WHERE t."nUserid" = $1::uuid AND t."cStatus" = 'A' AND t."nCaseid" = ANY($2::uuid[])
UNION
SELECT DISTINCT r."nCaseid"::text AS "nCaseid"
  FROM "RSessionDetail" d
  JOIN "RSessionMaster" r ON r."nSesid" = d."nSesid" AND r."dDelDt" IS NULL
 WHERE d."nUserid" = $1::uuid AND r."nCaseid" = ANY($2::uuid[])`;

/** The rows of a successful `rowQuery`; throws (without echoing the SQL or parameters) when the query failed. */
function rows(res: any, what: string): any[] {
    if (res?.success && Array.isArray(res.data)) return res.data;
    throw new Error(`${what} failed`);
}

/** Postgres text[] may arrive as a JS array (pg parses it) or, through some drivers, as '{a,b}'. */
function idList(value: unknown): string[] {
    const list = Array.isArray(value)
        ? value
        : typeof value === 'string' ? value.replace(/^\{|\}$/g, '').split(',').filter(Boolean) : [];
    return [...new Set(list.map(v => String(v).trim().toLowerCase()).filter(v => EDGE_UUID_RE.test(v)))];
}

@Injectable()
export class DbEdgeBoxRegistry implements EdgeBoxRegistry {
    constructor(private readonly db: DbService) { }

    async getBox(nEdgeid: string): Promise<EdgeBoxRecord | null> {
        return edgeBoxFromDb(this.db, nEdgeid);
    }
}

@Injectable()
export class DbEdgeUserDirectory implements EdgeUserDirectory {
    constructor(private readonly db: DbService) { }

    async getUser(nUserid: string): Promise<EdgeUserRecord | null> {
        return edgeUserFromDb(this.db, nUserid);
    }

    async memberCaseIds(nUserid: string, caseIds: string[]): Promise<string[]> {
        return edgeMemberCasesFromDb(this.db, nUserid, caseIds);
    }
}

export async function edgeBoxFromDb(db: RowDb, nEdgeid: string): Promise<EdgeBoxRecord | null> {
    if (!EDGE_UUID_RE.test(String(nEdgeid))) return null;
    const row = rows(await db.rowQuery(EDGE_BOX_SQL, [nEdgeid]), 'box lookup')[0];
    if (!row) return null;
    return {
        nEdgeid: String(row.nEdgeid).toLowerCase(),
        cSlug: typeof row.cSlug === 'string' ? row.cSlug.trim() : '',
        cStatus: typeof row.cStatus === 'string' ? row.cStatus.trim() : '',
        caseIds: idList(row.caseIds),
    };
}

export async function edgeUserFromDb(db: RowDb, nUserid: string): Promise<EdgeUserRecord | null> {
    if (!EDGE_UUID_RE.test(String(nUserid))) return null;
    const row = rows(await db.rowQuery(EDGE_USER_SQL, [nUserid]), 'user lookup')[0];
    if (!row) return null;
    return {
        nUserid: String(row.nUserid).toLowerCase(),
        cEmail: typeof row.cEmail === 'string' ? row.cEmail : null,
        bActive: row.bActive === true,
    };
}

export async function edgeMemberCasesFromDb(db: RowDb, nUserid: string, caseIds: string[]): Promise<string[]> {
    const candidates = idList(caseIds);
    if (!EDGE_UUID_RE.test(String(nUserid)) || !candidates.length) return [];
    const list = rows(await db.rowQuery(EDGE_MEMBER_CASES_SQL, [nUserid, candidates]), 'membership lookup');
    // Only ever a subset of the candidates, whatever the query returns.
    return idList(list.map(r => r?.nCaseid)).filter(id => candidates.includes(id));
}

/**
 * The etabella.net sign-in behind a cloud token, under the same rules as JwtMiddleware and `auth/validate`: an HS256
 * signature with JWT_SECRET, not expired, and the user's Redis browser binding (`user/<id>`) still naming the token's
 * browser (a signed-out or replaced session's token stays signature-valid until expiry). `authTime` is the token's
 * `iat`: authapi mints a cloud token only at sign-in. Never throws; never logs the token.
 */
@Injectable()
export class JwtCloudSession implements EdgeCloudSession {
    constructor(private readonly config: ConfigService, private readonly rds: RedisDbService) { }

    async resolve(cloudToken: string | null | undefined): Promise<EdgeCloudSessionInfo | null> {
        return resolveCloudSession(cloudToken, this.config.get('JWT_SECRET'), key => this.rds.getValue(key));
    }
}

export async function resolveCloudSession(
    cloudToken: string | null | undefined,
    secret: string | undefined,
    getValue: (key: string) => Promise<string | null>,
): Promise<EdgeCloudSessionInfo | null> {
    if (typeof cloudToken !== 'string' || !cloudToken || typeof secret !== 'string' || !secret) return null;
    let payload: any;
    try {
        payload = jwt.verify(cloudToken, secret, { algorithms: ['HS256'] });
    } catch {
        return null;
    }
    const userId = typeof payload?.userId === 'string' ? payload.userId.toLowerCase() : '';
    if (!EDGE_UUID_RE.test(userId) || payload.broweserId == null || !Number.isFinite(payload.iat)) return null;
    try {
        const session = JSON.parse(await getValue(`user/${payload.userId}`));
        if (!session || session.id == null || session.id != payload.broweserId) return null;
    } catch {
        return null;
    }
    return { nUserid: userId, authTime: Math.floor(payload.iat) };
}
