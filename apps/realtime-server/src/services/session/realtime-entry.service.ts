import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { isUuid } from '../utility/safe-path';

export const ENTRY_CASE_SQL = `SELECT c."nCaseid"::text AS "caseId", c."cHearingTimezone" AS timezone,
 c."dHearingDt"::date::text AS "scheduleStart", c."nHearingDays" AS "scheduleDays",
 CASE WHEN z.name IS NOT NULL THEN (now() AT TIME ZONE z.name)::date::text END AS today,
 COALESCE((SELECT json_agg(json_build_object('date',h."dDate"::text,'hearingDay',h."nDay") ORDER BY h."dDate")
 FROM public."RealtimeHearingDay" h WHERE h."nCaseid"=c."nCaseid"),'[]') AS days
 FROM "CaseMaster" c JOIN "UserMaster" u ON u."nUserid"=$2
 LEFT JOIN pg_timezone_names z ON z.name=c."cHearingTimezone"
 WHERE c."nCaseid"=$1 AND (u."isAdmin" IS TRUE
 OR EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid"=c."nCaseid" AND t."nUserid"=$2 AND t."cStatus"='A')
 OR EXISTS (SELECT 1 FROM "RSessionMaster" r WHERE r."nCaseid"=c."nCaseid" AND public.rt_entry_eligible(r."nSesid",$2)))`;

export const ENTRY_SESSIONS_SQL = `SELECT r."nSesid"::text AS "sessionId", r."nEntryEventid"::text AS "eventId",
 r."cStatus" AS status, r."dHearingDay"::text AS date, h."nDay" AS "hearingDay",
 ((r."dEntryStartedAt" IS NOT NULL AND r."dEntryEndedAt" IS NOT NULL)
   OR (r."cStatus" IN ('C','P') AND (r."nAppliedRawSeq">0 OR r."nFinalLines">0))) AS completed,
 public.rt_entry_eligible(r."nSesid",$2) AS eligible
 FROM "RSessionMaster" r LEFT JOIN public."RealtimeHearingDay" h ON h."nCaseid"=r."nCaseid" AND h."dDate"=r."dHearingDay"
 WHERE r."nCaseid"=$1 AND r."dDelDt" IS NULL
 ORDER BY COALESCE(r."dEntryEndedAt",r."dUpdatedt" AT TIME ZONE 'UTC',r."dStartDt" AT TIME ZONE 'UTC') DESC NULLS LAST,r."nSesid"`;

export const ENTRY_NOTIFICATIONS_SQL = `SELECT n."nNotificationid"::text AS "notificationId",e."nEventid"::text AS "eventId",
 e."nCaseid"::text AS "caseId",e."nSesid"::text AS "sessionId",n."dAt" AS at,n."bSeen" AS seen,c."cCasename" AS "caseName"
 FROM public."RealtimeAvailabilityNotification" n JOIN public."RealtimeAvailabilityEvent" e ON e."nEventid"=n."nEventid"
 JOIN "CaseMaster" c ON c."nCaseid"=e."nCaseid"
 WHERE n."nUserid"=$1 AND NOT n."bDismissed" AND ($2::uuid IS NULL OR e."nCaseid"=$2)
 AND public.rt_entry_eligible(e."nSesid",$1) ORDER BY n."dAt" DESC,n."nNotificationid" LIMIT 200`;

// During a rolling schema upgrade, existing sessions remain available through
// the same database-backed case/team/session authorization rules. These reads
// cannot establish a hearing-day or availability-event identity.
export const LEGACY_ENTRY_CASE_SQL = `SELECT c."nCaseid"::text AS "caseId"
 FROM "CaseMaster" c JOIN "UserMaster" u ON u."nUserid"=$2
 WHERE c."nCaseid"=$1 AND (u."isAdmin" IS TRUE
 OR EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid"=c."nCaseid" AND t."nUserid"=$2 AND t."cStatus"='A')
 OR EXISTS (SELECT 1 FROM "RSessionMaster" r JOIN "RSessionDetail" d ON d."nSesid"=r."nSesid"
 WHERE r."nCaseid"=c."nCaseid" AND r."dDelDt" IS NULL AND d."nUserid"=$2 AND d."dDelDt" IS NULL))`;

export const LEGACY_ENTRY_SESSIONS_SQL = `SELECT r."nSesid"::text AS "sessionId",r."cStatus" AS status,
 (u."isAdmin" IS TRUE
 OR EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid"=r."nCaseid" AND t."nUserid"=$2 AND t."cStatus"='A')
 OR EXISTS (SELECT 1 FROM "RSessionDetail" d WHERE d."nSesid"=r."nSesid" AND d."nUserid"=$2 AND d."dDelDt" IS NULL)) AS eligible
 FROM "RSessionMaster" r JOIN "UserMaster" u ON u."nUserid"=$2
 WHERE r."nCaseid"=$1 AND r."dDelDt" IS NULL`;

export const ENTRY_SCHEMA_READY_SQL = `SELECT
 to_regclass('public."RealtimeHearingDay"') IS NOT NULL
 AND to_regprocedure('public.rt_entry_eligible(uuid,uuid)') IS NOT NULL
 AND (SELECT count(*)=4 FROM pg_attribute
 WHERE attrelid=to_regclass('public."RSessionMaster"') AND NOT attisdropped
 AND attname=ANY(ARRAY['nEntryEventid','dEntryStartedAt','dEntryEndedAt','dHearingDay'])) AS ready`;

class MissingEntrySchemaError extends Error {}

function missingEntrySchema(error: unknown): boolean {
  const message = typeof error === 'string' ? error : (error as { message?: unknown })?.message;
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  if (typeof message !== 'string') return false;
  const rules: [string, RegExp][] = [
    ['42P01', /^relation "(?:public\.)?(?:RealtimeHearingDay|RealtimeAvailabilityEvent|RealtimeAvailabilityNotification)" does not exist$/],
    ['42883', /^function (?:public\.)?rt_entry_eligible\([^)]*\) does not exist$/],
    ['42703', /^column (?:r\.)?"?(?:nEntryEventid|dEntryStartedAt|dEntryEndedAt|dHearingDay)"? does not exist$/],
  ];
  return rules.some(([expectedCode, pattern]) => (code === undefined || code === expectedCode) && pattern.test(message));
}

/** Uses the case's date, supplied by PostgreSQL in the configured hearing timezone. */
export function nextHearingDay(row: any): { hearingDay: number; date: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row?.today ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(row?.scheduleStart ?? '')) return null;
  const count = Number(row.scheduleDays);
  if (!Number.isInteger(count) || count < 1 || count > 3660) return null;
  const known: Map<string, number> = new Map((row.days ?? []).map((d: any) => [d.date, Number(d.hearingDay)]));
  const number = Math.max(0, ...known.values());
  const lastDate = [...known.keys()].sort().at(-1);
  let pendingDays = 0;
  let unknownDays = 0;
  const start = Date.parse(row.scheduleStart + 'T00:00:00Z');
  for (let i = 0; i < count; i++) {
    const date = new Date(start + i * 86400000).toISOString().slice(0, 10);
    if (!lastDate || date > lastDate) pendingDays++;
    if (!known.has(date)) unknownDays++;
    // Historical rows keep their identity even if the schedule start or duration changes.
    const hearingDay = known.get(date) ?? number + Math.max(lastDate && date < lastDate ? unknownDays : pendingDays, 1);
    if (date >= row.today) return { hearingDay, date };
  }
  return null;
}

@Injectable()
export class RealtimeEntryService {
  // Only schema capability is remembered. Every entry still reads current access
  // and sessions, and a catalog probe detects an installed migration immediately.
  private legacySchema = false;
  constructor(private readonly db: DbService) {}

  private caller(user: RealtimeUser | undefined): string {
    if (!isUuid(user?.userId)) throw new ForbiddenException('A signed-in user is required');
    return user.userId;
  }

  private async rows(sql: string, params: any[], allowLegacySchema = false): Promise<any[]> {
    const result = await this.db.rowQuery(sql, params);
    if (!result?.success || !Array.isArray(result.data)) {
      if (allowLegacySchema && !result?.success && missingEntrySchema(result?.error)) throw new MissingEntrySchemaError();
      throw new ServiceUnavailableException('Realtime status could not be verified. Please try again.');
    }
    return result.data;
  }

  async status(caseId: unknown, referencedSession: unknown, user: RealtimeUser | undefined, referencedEvent?: unknown): Promise<any> {
    const userId = this.caller(user);
    if (!isUuid(caseId) || (referencedSession != null && !isUuid(referencedSession)) || (referencedEvent != null && !isUuid(referencedEvent))) throw new BadRequestException('A valid case and session are required');
    if (this.legacySchema) {
      const [schema] = await this.rows(ENTRY_SCHEMA_READY_SQL, []);
      if (typeof schema?.ready !== 'boolean') throw new ServiceUnavailableException('Realtime status could not be verified. Please try again.');
      if (!schema.ready) return this.legacyStatus(caseId, userId, referencedSession, referencedEvent);
      this.legacySchema = false;
    }
    try {
      const [row] = await this.rows(ENTRY_CASE_SQL, [caseId, userId], true);
      if (!row) throw new ForbiddenException('This case is no longer available to you');
      const sessions = await this.rows(ENTRY_SESSIONS_SQL, [caseId, userId], true);
      return this.statusResult(row, sessions, referencedSession, referencedEvent, false);
    } catch (error) {
      if (!(error instanceof MissingEntrySchemaError)) throw error;
      this.legacySchema = true;
    }
    return this.legacyStatus(caseId, userId, referencedSession, referencedEvent);
  }

  private async legacyStatus(caseId: unknown, userId: string, referencedSession: unknown, referencedEvent: unknown): Promise<any> {
    const [row] = await this.rows(LEGACY_ENTRY_CASE_SQL, [caseId, userId]);
    if (!row) throw new ForbiddenException('This case is no longer available to you');
    const sessions = await this.rows(LEGACY_ENTRY_SESSIONS_SQL, [caseId, userId]);
    return this.statusResult(row, sessions, referencedSession, referencedEvent, true);
  }

  private statusResult(row: any, sessions: any[], referencedSession: unknown, referencedEvent: unknown, legacy: boolean): any {
    const live = sessions.filter(s => s.status === 'R');
    if (live.length > 1) throw new ServiceUnavailableException('This case has conflicting active sessions. Please contact the hearing operator.');
    const current = live.find(s => s.eligible === true);
    // Technical updates can reorder older completions. Last session follows the
    // actual hearing date, retaining the query's completion order within one day.
    const last = legacy ? null : sessions.reduce((latest, s) => {
      if (s.status === 'R' || s.completed !== true || s.eligible !== true
        || typeof s.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.date)) return latest;
      return !latest || s.date > latest.date ? s : latest;
    }, null);
    const identity = (s: any) => s ? legacy ? { sessionId: s.sessionId, hearingDay: null, date: null }
      : { sessionId: s.sessionId, eventId: s.eventId, hearingDay: s.hearingDay ?? null, date: s.date ?? null } : null;
    const reference = referencedSession ? sessions.find(s => s.sessionId.toLowerCase() === String(referencedSession).toLowerCase()) : null;
    const requestedSession = referencedSession ? !reference || reference.eligible !== true ? 'forbidden'
      : current?.sessionId === reference.sessionId && (!referencedEvent || (!legacy && String(current.eventId).toLowerCase() === String(referencedEvent).toLowerCase())) ? 'available' : current ? 'changed' : 'ended' : undefined;
    return { caseId: row.caseId, timezone: !legacy && row.today ? row.timezone : null, current: identity(current),
      lastSession: identity(last), nextHearingDay: legacy ? null : nextHearingDay(row), ...(requestedSession ? { requestedSession } : {}) };
  }

  async notifications(caseId: unknown, user: RealtimeUser | undefined): Promise<any[]> {
    const userId = this.caller(user);
    if (caseId != null && !isUuid(caseId)) throw new BadRequestException('Invalid case');
    return this.rows(ENTRY_NOTIFICATIONS_SQL, [userId, caseId ?? null]);
  }

  async updateNotification(id: unknown, dismiss: boolean, user: RealtimeUser | undefined): Promise<{ ok: true }> {
    const userId = this.caller(user);
    if (!isUuid(id)) throw new BadRequestException('Invalid notification');
    const rows = await this.rows(`UPDATE public."RealtimeAvailabilityNotification" SET ${dismiss ? '"bDismissed"' : '"bSeen"'}=true
      WHERE "nNotificationid"=$1 AND "nUserid"=$2 RETURNING "nNotificationid"`, [id, userId]);
    if (!rows.length) throw new ForbiddenException('Notification is not available');
    return { ok: true };
  }
}
