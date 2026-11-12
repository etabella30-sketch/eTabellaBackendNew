import { ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { HEARING_TIME_SLOT, hearingTimecode } from '@app/api-contracts';
import { DbService } from '@app/global/db/pg/db.service';
import { assertSaveStage } from '@app/global/db/pg/save-transaction';
import { assertCaseModeWrite } from '@app/permissions';
import { PgRowQuery } from '@app/platform-cloud';
import { codesToText } from '@app/rt-features/transcript-shape';
import { LiveQfactCaptureRequest, LiveQfactContextRequest } from '../../interfaces/live-qfact-capture.dto';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { FeedDataService } from '../feed-data/feed-data.service';
import { assertCanCreateFact } from './fact-create-gate';
import { captureInOneCall, liveQfactSingleCall } from './live-qfact-single-call';
import type { CaptureTiming } from './live-qfact-timing';
import { LIVE_QFACT_MAX_SKIPPED_LINES, liveCoordinates, LiveQfactCoordinate, liveQfactIssueKey, LiveQfactNotJoined, splitLiveQfactLines, withinLiveQfactCaptureWindow } from './live-qfact-rules';
import { assertIssuesInCase, markIssueIds } from './mark-write-guards';

export const LIVE_QFACT_SESSION_SQL = `SELECT "nSesid", "cStatus", "isUploaded", "dDelDt", "dEntryEndedAt", "nLines",
  "nEntryEventid"::text AS "nEntryEventid" FROM "RSessionMaster"
  WHERE "nSesid"=$1::uuid AND "nCaseid"=$2::uuid FOR SHARE`;
/** The user's QFACT holding a line, with its issue ids (read here, not by a query per neighbour: one round trip less per
 *  side of every mark — live test 2026-11-04, ~20 round trips of ~50 ms each made a mark take 1.1-1.8 s). */
export const LIVE_QFACT_FIND_SQL = `SELECT m."nFSid"::text AS "nFSid", m."dCreateDt", d."jCordinates", d."bLiveCapturePristine",
  (SELECT coalesce(array_agg(i."nIssueid"::text), '{}') FROM "FMIssue" i WHERE i."nFSid"=m."nFSid") AS "issueIds"
  FROM "FactMaster" m JOIN "FactDetail" d ON d."nFSid"=m."nFSid"
  WHERE m."nSesid"=$1::uuid AND m."nUserid"=$2::uuid AND m."cFType"='QF'
    AND d."jCordinates" @> $3::jsonb FOR UPDATE OF m,d`;
export const LIVE_QFACT_LEGACY_SQL = `SELECT m."nFSid" FROM "FactMaster" m
 JOIN "FactDetail" d ON d."nFSid"=m."nFSid" JOIN "QfactLegacyConversion" legacy ON legacy."nFSid"=m."nFSid" AND legacy."bActive"
 WHERE m."nSesid"=$1::uuid AND m."nUserid"=$2::uuid AND m."cFType"='QF'
 AND (d."jCordinates" @> $3::jsonb OR legacy."jLegacyRow"->>'identity'=$4) LIMIT 1`;

/** The case's Unassigned issue: the system row (no creator) a QFACT without an issue carries. */
export const LIVE_QFACT_UNASSIGNED_SQL = `SELECT "nIid"::text AS id FROM "RIssueMaster"
  WHERE "nCaseid"=$1::uuid AND "nUserid" IS NULL AND lower(btrim("cIName"))='unassigned' ORDER BY "nIid" LIMIT 1`;
/** A QFACT's issue rows, so a segment split off by an unmark keeps them. */
export const LIVE_QFACT_ISSUES_SQL = `SELECT "nIssueid"::text AS id, "nImpactid", "nRelevanceid" FROM "FMIssue" WHERE "nFSid"=$1::uuid`;
/**
 * The Private Group a QFACT is filed in, by the primary key of FactPrivateGroup (no row: none). Same rule as the list: a group
 * counts only while it is not deleted and the mark has no substantive Team Issue (a leftover membership is "no group").
 */
export const LIVE_QFACT_GROUP_SQL = `SELECT a."nGroupid"::text AS "nGroupid" FROM public."FactPrivateGroup" a
  JOIN public."PrivateFactGroup" g ON g."nGroupid"=a."nGroupid" AND g."dDeletedDt" IS NULL
 WHERE a."nFSid"=$1::uuid
   AND NOT EXISTS (SELECT 1 FROM public."FMIssue" i WHERE i."nFSid"=$1::uuid AND NOT public.et_is_system_unassigned(i."nIssueid"))`;
/**
 * A split-off piece inherits its original's membership: one guarded copy, not the stored procedure (which answers a refusal
 * as a failure row and so fails the whole save transaction). $1 the new piece, $2 the QFACT it was split from. No row back:
 * nothing to inherit, or not eligible (deleted group, a substantive Issue); the piece simply stays ungrouped.
 */
export const LIVE_QFACT_INHERIT_SQL = `INSERT INTO public."FactPrivateGroup" ("nFSid", "nGroupid")
  SELECT $1::uuid, a."nGroupid" FROM public."FactPrivateGroup" a
    JOIN public."PrivateFactGroup" g ON g."nGroupid" = a."nGroupid" AND g."dDeletedDt" IS NULL
   WHERE a."nFSid" = $2::uuid
     AND NOT EXISTS (SELECT 1 FROM public."FMIssue" i WHERE i."nFSid" = $1::uuid AND NOT public.et_is_system_unassigned(i."nIssueid"))
  ON CONFLICT ("nFSid") DO NOTHING
  RETURNING "nFSid"`;
export const LIVE_QFACT_RECEIPT_SQL = 'SELECT "cRun","cIdentity","cAction","jResult" FROM "LiveQfactRequest" WHERE "nUserid"=$1::uuid AND "nSesid"=$2::uuid AND "nRequestid"=$3::uuid';
export const LIVE_QFACT_RECEIPT_INSERT_SQL = `INSERT INTO "LiveQfactRequest" ("nUserid","nSesid","nRequestid","cRun","cIdentity","cAction","jResult") VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7::jsonb)`;
export const LIVE_QFACT_UPDATE_SQL = `UPDATE "FactDetail" SET "jOT"=$2::jsonb,"jCordinates"=$3::jsonb,"nPage"=$4,"nLine"=$5,"bLiveCapturePristine"=true WHERE "nFSid"=$1::uuid`;
/** Its issue rows go with it (a merged-away or fully unmarked QFact left them pointing at nothing). */
export const LIVE_QFACT_REMOVE_SQLS = ['DELETE FROM "FMIssue" WHERE "nFSid"=$1::uuid', 'DELETE FROM "FactDetail" WHERE "nFSid"=$1::uuid', 'DELETE FROM "FactMaster" WHERE "nFSid"=$1::uuid'] as const;

export type IssueTuples = unknown[][];
export type CaptureSession = { nSesid: string; cStatus: string; isUploaded?: boolean; dDelDt?: unknown; dEntryEndedAt?: unknown; nLines: number; nEntryEventid?: string };
export type StoredGroup = { nFSid: string; dCreateDt?: string; jCordinates: unknown; bLiveCapturePristine: boolean; issueIds?: string[] };
export interface LiveQfactGroup { nFSid: string; coordinates: readonly LiveQfactCoordinate[]; pristine: boolean }
/** `notJoined`: the click started its own QFACT although one of the user's sits on the next line — why (user 2026-11-04). */
export interface LiveQfactResult {
  msg: 1; nFSid?: string; groups: readonly LiveQfactGroup[]; removedIds: readonly string[]; replayed?: boolean; notJoined?: LiveQfactNotJoined;
  /** Internal, never answered: the QFACTs this capture created (`from`: the QFACT a split-off piece came from). Decides the group work. */
  filed?: readonly { id: string; from?: string }[];
}
export type LiveQfactReceipt = { cRun: string; cIdentity: string; cAction: string; jResult: LiveQfactResult };
/** What `fact_insert` and its detail and issue steps take for a new QFACT. */
export type LiveQfactInsert = Record<string, unknown> & { jIssues: string; jCordinates: LiveQfactCoordinate[] };

/**
 * What the capture rules read and write (2026-11-04: one database call per mark). The step-by-step path reads and
 * writes the database as it goes; the one-call path (live-qfact-single-call.ts) answers the reads from one snapshot
 * and sends the writes in one call. The rules in `decideCapture` are the same for both.
 */
export interface LiveQfactCaptureIo {
  /** The per-user lock, the write flag and the case-mode check. */
  lock(): Promise<void>;
  receipt(): Promise<LiveQfactReceipt | undefined>;
  replay(receipt: LiveQfactReceipt): Promise<LiveQfactResult>;
  /** A QFACT converted from a historical row holds this line. */
  legacy(identity: string): Promise<boolean>;
  find(coordinate: LiveQfactCoordinate): Promise<StoredGroup[]>;
  unassignedId(): Promise<string | null>;
  /** The picked issues belong to the case (throws when not). */
  checkIssues(): Promise<void>;
  groupIssues(nFSid: string): Promise<IssueTuples>;
  /** The Private Group the QFACT is filed in (null: none). Read only when the capture names a group. */
  groupOf(nFSid: string): Promise<string | null>;
  /** A new QFACT (fact, detail, issues); its id. */
  insert(body: LiveQfactInsert): Promise<string>;
  update(id: string, sorted: LiveQfactCoordinate[]): Promise<void>;
  remove(id: string): Promise<void>;
  saveReceipt(result: LiveQfactResult): Promise<void>;
}

export async function rows<T>(db: DbService, sql: string, params: unknown[]): Promise<T[]> {
  const result = await db.rowQuery(sql,params);
  if (!result.success) throw new InternalServerErrorException('QFACT capture could not be saved. Please retry.');
  return result.data;
}

export async function session(db: DbService, target: LiveQfactContextRequest): Promise<CaptureSession> {
  const [record] = await rows<CaptureSession>(db,LIVE_QFACT_SESSION_SQL,[target.nSesid,target.nCaseid]);
  if (!record || record.cStatus !== 'R' || record.isUploaded || record.dDelDt || record.dEntryEndedAt) {
    throw new ConflictException('Instant QFACT capture is only available on a live Realtime transcript.');
  }
  return record;
}

export const runKey = (record: CaptureSession) => record.nEntryEventid || `session:${record.nSesid}`;

export async function liveQfactContext(db: DbService, target: LiveQfactContextRequest, user: RealtimeUser) {
  await assertCanCreateFact(db,user,target);
  const record = await session(db,target);
  return { msg: 1, cRun: runKey(record) };
}

export async function sourceLine(feed: FeedDataService, record: CaptureSession, page: number, line: number): Promise<LiveQfactCoordinate | null> {
  if (page<1 || line<1) return null;
  const data = await feed.getPage(record.nSesid,page);
  const tuple = data?.[line-1];
  if (!Array.isArray(tuple)) return null;
  const text = codesToText(tuple[1]);
  if (!text) return null;
  const stable = tuple[6] !== undefined && tuple[6] !== null && String(tuple[6]).trim() !== '';
  return { identity: stable ? String(tuple[6]) : `${page}:${line}`, p:page,l:line,
    oP: Number(tuple[4]) || page, oL: Number(tuple[5]) || line,
    text,otext:text,t: typeof tuple[0] === 'string' ? tuple[0] : '',capture:'live-instant',run:runKey(record),
    order:(page-1)*(Number(record.nLines)||25)+line,
    // Legacy/receipt-only rows stay individual QFACTs. Genuine midnight has explicit provenance.
    hearing: stable && record.nEntryEventid ? hearingTimecode(tuple[HEARING_TIME_SLOT]) : null };
}

/** The feed line at a transcript order (page-major, `nLines` to a page). */
export function lineAt(feed: FeedDataService, record: CaptureSession, order: number): Promise<LiveQfactCoordinate | null> {
  const nLines = Number(record.nLines)||25;
  return order<1 ? Promise.resolve(null) : sourceLine(feed,record,Math.floor((order-1)/nLines)+1,(order-1)%nLines+1);
}

/**
 * The user's own group `line` belongs to, with its lines refreshed from the feed, when it may still grow: untouched
 * (pristine — the user has not edited it; the DB freeze trigger guards that), only Express lines, every line still
 * the same transcript line in place and clock. The words may have changed: the writer's backspace or retranslation
 * of a live line rewrites it in place (same identity and clock), and the QFact takes the corrected words (user
 * 2026-11-04 — a corrected line could never be joined again, and the toast blamed "edited"). A changed identity,
 * clock or location (re-pagination) is not silently rewritten.
 */
async function growableGroup(feed: FeedDataService, record: CaptureSession, group: StoredGroup, line: LiveQfactCoordinate): Promise<LiveQfactCoordinate[] | null> {
  const lines = liveCoordinates(group.jCordinates);
  const captured = lines.find(item=>item.identity===line.identity);
  if (!group.bLiveCapturePristine || !captured || captured.order!==line.order || captured.hearing?.frames!==line.hearing?.frames
    || lines.length !== (Array.isArray(group.jCordinates) ? group.jCordinates.length : 0)) return null;
  const refreshed: LiveQfactCoordinate[]=[];
  for (const item of lines) {
    const current=await sourceLine(feed,record,item.p,item.l);
    if (!current || current.identity!==item.identity || current.order!==item.order
      || current.hearing?.frames!==item.hearing?.frames) return null;
    refreshed.push({...item,text:current.text});
  }
  return refreshed;
}

/** The step-by-step reads and writes, inside the capture's transaction. */
function directIo(db: DbService, request: LiveQfactCaptureRequest, actor: string): LiveQfactCaptureIo {
  let unassigned: string | null | undefined;
  return {
    async lock() {
      // The write flag rides on the lock query: both are transaction-local, so no "off" is needed afterwards.
      await rows(db,"SELECT pg_advisory_xact_lock(hashtextextended($1,0)), set_config('etabella.live_qfact_write','on',true)",[`${actor}:${request.nSesid}`]);
      await assertCaseModeWrite(new PgRowQuery(db),'fact_insert',{nCaseid:request.nCaseid,nMasterid:actor,cFtype:'QF'});
    },
    async receipt() {
      const [receipt] = await rows<LiveQfactReceipt>(db,LIVE_QFACT_RECEIPT_SQL,[actor,request.nSesid,request.nRequestid]);
      return receipt;
    },
    async replay(receipt) {
      const current: LiveQfactGroup[] = [];
      for (const group of receipt.jResult.groups) {
        const [row] = await rows<StoredGroup>(db,`SELECT d."jCordinates",d."bLiveCapturePristine" FROM "FactDetail" d JOIN "FactMaster" m ON m."nFSid"=d."nFSid"
          WHERE d."nFSid"=$1::uuid AND m."nUserid"=$2::uuid AND m."nSesid"=$3::uuid`,[group.nFSid,actor,request.nSesid]);
        if (row) current.push({nFSid:group.nFSid,coordinates:liveCoordinates(row.jCordinates),pristine:row.bLiveCapturePristine});
      }
      return {...receipt.jResult,nFSid:current[0]?.nFSid,groups:current,replayed:true};
    },
    async legacy(identity) {
      return (await rows(db,LIVE_QFACT_LEGACY_SQL,[request.nSesid,actor,JSON.stringify([{identity}]),identity])).length>0;
    },
    find(coordinate) {
      return rows<StoredGroup>(db,LIVE_QFACT_FIND_SQL,[request.nSesid,actor,
        JSON.stringify([{capture:'live-instant',run:coordinate.run,identity:coordinate.identity}])]);
    },
    // The case's Unassigned issue, read at most once per mark.
    async unassignedId() {
      return unassigned !== undefined ? unassigned
        : (unassigned = (await rows<{ id: string }>(db,LIVE_QFACT_UNASSIGNED_SQL,[request.nCaseid]))[0]?.id ?? null);
    },
    async checkIssues() { await assertIssuesInCase(db, { nCaseid: request.nCaseid, jIssues: request.jIssues }); },
    async groupIssues(nFSid) {
      const list = await rows<{ id: string; nImpactid?: number; nRelevanceid?: number }>(db, LIVE_QFACT_ISSUES_SQL, [nFSid]);
      return list.map(row => [row.id, Number(row.nImpactid) || 0, Number(row.nRelevanceid) || 0]);
    },
    async groupOf(nFSid) {
      return (await rows<{ nGroupid: string }>(db,LIVE_QFACT_GROUP_SQL,[nFSid]))[0]?.nGroupid ?? null;
    },
    async insert(body) {
      const inserted = await db.executeRef('fact_insert',{...body},'realtime');
      if (!inserted.success) throw new InternalServerErrorException('QFACT could not be saved.');
      const fact = assertSaveStage(inserted.data[0][0]);
      if (!fact.nFSid) throw new InternalServerErrorException('QFACT could not be saved.');
      const detail = await db.executeRef('fact_insert_detail',{...body,nFSid:fact.nFSid},'realtime');
      if (!detail.success) throw new InternalServerErrorException('QFACT could not be saved.');
      assertSaveStage(detail.data[0]);
      if (JSON.parse(body.jIssues).length) {
        const linked = await db.executeRef('fact_insert_issues',{...body,nFSid:fact.nFSid},'realtime');
        if (!linked.success) throw new InternalServerErrorException('QFACT could not be saved.');
      }
      return fact.nFSid;
    },
    async update(id, sorted) {
      await rows(db,LIVE_QFACT_UPDATE_SQL,[id,JSON.stringify([sorted.map(line=>line.text).join('\n')]),JSON.stringify(sorted),sorted[0].p,sorted[0].l]);
    },
    async remove(id) {
      for (const sql of LIVE_QFACT_REMOVE_SQLS) await rows(db,sql,[id]);
    },
    async saveReceipt(result) {
      await rows(db,LIVE_QFACT_RECEIPT_INSERT_SQL,
        [actor,request.nSesid,request.nRequestid,request.cRun,request.identity,request.action,JSON.stringify(result)]);
    },
  };
}

/**
 * The capture rules: what a mark or unmark of one live line does to the user's QFACTs, read and written through `io`.
 * The same for the step-by-step path and the one-call path.
 */
export async function decideCapture(io: LiveQfactCaptureIo, feed: FeedDataService, record: CaptureSession, request: LiveQfactCaptureRequest,
  actor: string, now: number): Promise<LiveQfactResult> {
  if (request.cRun !== runKey(record)) throw new ConflictException('The Realtime session has restarted. Reload the live transcript before capturing.');
  await io.lock();
  const receipt = await io.receipt();
  if (receipt) {
    if (receipt.cRun!==request.cRun || receipt.cIdentity!==request.identity || receipt.cAction!==request.action) throw new ConflictException('This capture request has already been used.');
    return io.replay(receipt);
  }
  const target = await sourceLine(feed,record,request.page,request.line);
  if (!target || target.identity!==request.identity) throw new ConflictException('This transcript line has changed. Please capture the current line.');
  if (await io.legacy(target.identity)) throw new ConflictException('This line already belongs to a QFACT. Open it in MarkNav to edit it.');
  const existing = await io.find(target);
  const groups: LiveQfactGroup[] = [];
  const removedIds: string[] = [];

  const update = async (id: string, coordinates: LiveQfactCoordinate[]) => {
    const sorted = [...coordinates].sort((a,b)=>a.order-b.order);
    await io.update(id,sorted);
    groups.push({nFSid:id,coordinates:sorted,pristine:true});
  };
  /**
   * The issues a new QFACT gets: the ones the user picked (checked against the case), else the case's Unassigned
   * issue. RT QA 2026-10-29 (F-19): every Express QFACT was stored with none, so no issue filter (Unassigned
   * included) found it.
   */
  const requestIssues = async (): Promise<IssueTuples> => {
    const picked = markIssueIds({ jIssues: request.jIssues });
    if (picked.length) {
      await io.checkIssues();
      return picked.map(id => [id, 0, 0]);
    }
    const unassigned = await io.unassignedId();
    return unassigned ? [[unassigned, 0, 0]] : [];
  };
  let pickedIssues: IssueTuples | null = null;
  const filed: { id: string; from?: string }[] = [];
  const create = async (coordinates: LiveQfactCoordinate[], inherited?: IssueTuples, from?: string) => {
    const first = coordinates[0];
    const issues = inherited ?? (pickedIssues ??= await requestIssues());
    const id = await io.insert({nCaseid:request.nCaseid,nSesid:request.nSesid,nMasterid:actor,cFtype:'QF',cFFrom:'RT',
      nColorid:issues.length ? String(issues[issues.length-1][0]) : null,
      jOT:JSON.stringify([coordinates.map(line=>line.text).join('\n')]),jT:'[]',jIssues:JSON.stringify(issues),jUsers:'[]',
      cIsNote:'N',bIsHighlighted:false,jCordinates:coordinates,nPage:first.p,nLine:first.l});
    filed.push(from ? {id,from} : {id});
    await update(id,coordinates);
  };
  const remove = async (id: string) => {
    await io.remove(id);
    removedIds.push(id);
  };

  let markNotJoined: LiveQfactNotJoined | undefined;
  if (request.action==='unmark') {
    if (existing.some(group=>!group.bLiveCapturePristine)) throw new ConflictException('This QFACT has been edited. Use the QFACT editor to change it.');
    for (const group of existing) {
      const remaining = liveCoordinates(group.jCordinates).filter(line=>line.identity!==target.identity);
      const pieces = splitLiveQfactLines(remaining);
      if (!pieces.length) await remove(group.nFSid);
      else {
        // Earliest surviving segment retains the original ordinary QFACT id.
        await update(group.nFSid,pieces[0]);
        const inherited = pieces.length>1 ? await io.groupIssues(group.nFSid) : [];
        for (const piece of pieces.slice(1)) await create(piece,inherited,group.nFSid);
      }
    }
  } else if (existing.length) {
    for (const group of existing) groups.push({nFSid:group.nFSid,coordinates:liveCoordinates(group.jCordinates),pristine:group.bLiveCapturePristine});
  } else {
    // The click joins the user's own untouched QFACT whose LAST line is the line directly above it
    // (LIVE_QFACT_MAX_SKIPPED_LINES = 0: any break starts a new QFACT, user 2026-11-04) when the two belong together:
    // clicked within 30 s of that QFACT's last capture, or the two lines' transcript times within 30 s
    // (withinLiveQfactCaptureWindow), and marked with the same issues. A click directly above a QFACT joins it the
    // same way, and one between two merges them (below). Lines without hearing provenance (legacy or receipt-only
    // feeds) stay individual QFACTs.
    const clicked: LiveQfactCoordinate = {...target,at:now};
    // Same issues only (user 2026-11-04): a line joins or merges a QFACT only when the issues it is marked with are
    // that QFACT's ("A + Unassigned" counts as "A"). The click's issues are checked against the case here, for
    // every mark, not only for a new QFACT.
    const clickKey = liveQfactIssueKey((pickedIssues ??= await requestIssues()).map(tuple=>tuple[0]),await io.unassignedId());
    // The neighbour's issue ids come with the query that found it (LIVE_QFACT_FIND_SQL).
    const sameIssues = async (group: StoredGroup) =>
      liveQfactIssueKey(group.issueIds ?? (await io.groupIssues(group.nFSid)).map(tuple=>tuple[0]),await io.unassignedId())===clickKey;
    // The group the click files its QFACT in; absent (undefined) leaves groups out of the joining rule.
    const sameGroup = async (group: StoredGroup) =>
      request.nPrivateGroupid===undefined || ((await io.groupOf(group.nFSid))?.toLowerCase() ?? null)===(request.nPrivateGroupid?.toLowerCase() ?? null);
    // Why a QFACT on the next line was not joined, for the toast (the first reason found, above before below).
    let notJoined: LiveQfactNotJoined | undefined;
    const neighbour = async (group: StoredGroup, edge: LiveQfactCoordinate, side: 'last' | 'first') => {
      const lines = await growableGroup(feed,record,group,edge);
      const facing = side==='last' ? lines?.[lines.length-1] : lines?.[0];
      // "Edited" only when the user edited it; a QFact whose lines moved in the feed just stays apart, unexplained.
      if (!lines || facing?.identity!==edge.identity) { if (!group.bLiveCapturePristine) notJoined ??= 'edited'; return null; }
      if (!withinLiveQfactCaptureWindow(lines,facing,clicked,now)) { notJoined ??= 'time'; return null; }
      if (!(await sameIssues(group))) { notJoined ??= 'issues'; return null; }
      // A line joins a QFACT only when it is filed where the click files it (none and none count as the same).
      if (!(await sameGroup(group))) { notJoined ??= 'group'; return null; }
      return lines;
    };
    let joined: { nFSid: string; lines: LiveQfactCoordinate[] } | null = null;
    const between: LiveQfactCoordinate[] = [];
    if (clicked.hearing) for (let step=1; step<=LIVE_QFACT_MAX_SKIPPED_LINES+1; step++) {
      const above = await lineAt(feed,record,clicked.order-step);
      if (!above || above.run!==clicked.run || !above.hearing) break;
      const owners = await io.find(above);
      if (owners.length) {
        // The nearest owned line above ends the search: join its group or start a new QFACT.
        for (const group of owners) {
          const lines = await neighbour(group,above,'last');
          if (lines) { joined={nFSid:group.nFSid,lines}; break; }
        }
        break;
      }
      // A skipped line converted from a historical QFACT is never absorbed.
      if (await io.legacy(above.identity)) break;
      between.push({...above,at:now,filled:true});
    }
    // In either order (user 2026-11-04): a click directly above the user's untouched QFACT that belongs with it (same
    // test) joins it too — "16, then 15" is one QFACT. A click that joins the QFACT above AND lands directly above
    // another merges the two, however much later it comes when the lines were spoken within 30 s — "5, 6, then 8,
    // then 7" is one QFACT of 5-8. The upper (earlier) QFACT keeps its id; both carry the same issues.
    let lower: { nFSid: string; lines: LiveQfactCoordinate[] } | null = null;
    if (clicked.hearing) {
      const below = await lineAt(feed,record,clicked.order+1);
      if (below && below.run===clicked.run && below.hearing) {
        for (const group of await io.find(below)) {
          if (group.nFSid===joined?.nFSid) continue;
          const lines = await neighbour(group,below,'first');
          if (lines) { lower={nFSid:group.nFSid,lines}; break; }
        }
      }
    }
    if (!joined && lower) {
      const unique = [clicked,...lower.lines].sort((a,b)=>a.order-b.order);
      if (splitLiveQfactLines(unique).length!==1) await create([clicked]);
      else await update(lower.nFSid,unique);
    } else if (!joined) await create([clicked]);
    else {
      const unique = [...new Map([...joined.lines,...between,clicked,...(lower?.lines ?? [])].map(line=>[line.identity,line])).values()].sort((a,b)=>a.order-b.order);
      if (splitLiveQfactLines(unique).length!==1) await create([clicked]);
      else {
        await update(joined.nFSid,unique);
        if (lower) await remove(lower.nFSid);
      }
    }
    // The reason is said only when the click stood alone: a join on one side needs no excuse for the other.
    if (!joined && !lower && notJoined) markNotJoined = notJoined;
  }
  const result: LiveQfactResult = {msg:1,nFSid:groups[0]?.nFSid,groups,removedIds,...(markNotJoined ? {notJoined:markNotJoined} : {}),...(filed.length ? {filed} : {})};
  await io.saveReceipt(result);
  return result;
}

/** The answer when the chosen Private Group is refused: the capture has been rolled back (the existing failure shape, msg -1). */
export const PRIVATE_GROUP_REFUSED = Object.freeze({ msg: -1 as const, value: 'Private Group could not be saved', error: 'private_group_refused' });
export class PrivateGroupRefused extends Error {}
/** Called inside the capture's transaction after the group is assigned; the notice is sent after COMMIT (KafkaGlobalService). */
export type GroupAssigned = (userId: string) => Promise<unknown>;

/**
 * Whether a capture has group work: a mark that CREATED a new QFACT and names a group (a UUID; null has nothing to assign,
 * a join already matches the group, a line already held is left as it is), or an unmark that split a piece off a QFACT
 * (the piece inherits the group of the QFACT it came from).
 */
export function hasGroupWork(request: LiveQfactCaptureRequest, result: LiveQfactResult): boolean {
  const filed = result.filed ?? [];
  if (result.replayed || !filed.length) return false;
  return request.action==='mark' ? typeof request.nPrivateGroupid==='string' : filed.some(piece=>piece.from);
}

/**
 * One `private_group_assign`. True: assigned. False: the database refused (it answered msg -1; nothing it said is kept).
 * A database error is thrown as the ordinary capture failure, never taken for a refusal.
 */
async function assignOne(db: DbService, actor: string, nFSid: string | undefined, nPrivateGroupid: string | null): Promise<boolean> {
  if (!nFSid) throw new InternalServerErrorException('QFACT capture could not be saved. Please retry.');
  const saved = await db.executeRef('private_group_assign',{nMasterid:actor,nFSid,nPrivateGroupid});
  if (!saved.success) throw new InternalServerErrorException('QFACT capture could not be saved. Please retry.');
  const row = saved.data?.[0]?.[0];
  return !!row && row.msg===1;
}

/** The groups of the QFACTs an unmark split pieces off (one lookup each), so a capture of ungrouped QFACTs opens no extra transaction. */
export async function splitOrigins(db: DbService, result: LiveQfactResult): Promise<Map<string, string | null>> {
  const origins = new Map<string, string | null>();
  for (const piece of result.filed ?? []) {
    if (piece.from && !origins.has(piece.from)) origins.set(piece.from,(await rows<{ nGroupid: string }>(db,LIVE_QFACT_GROUP_SQL,[piece.from]))[0]?.nGroupid ?? null);
  }
  return origins;
}

/**
 * Files what `hasGroupWork` found in its Private Group, inside the capture's own transaction (the caller opens it): a
 * refusal rolls the whole capture back. Nothing the database says about a group reaches the client, and the notice (one,
 * when something was assigned) carries the user id only.
 */
export async function assignCaptureGroup(db: DbService, actor: string, request: LiveQfactCaptureRequest, result: LiveQfactResult,
  assigned?: GroupAssigned, known?: ReadonlyMap<string, string | null>): Promise<void> {
  if (!hasGroupWork(request,result)) return;
  let any = false;
  if (request.action==='mark') {
    // A new QFACT the user chose a group for: the database's refusal (msg -1) fails the capture; a database fault is the ordinary failure.
    for (const piece of result.filed!) {
      if (!(await assignOne(db,actor,piece.id,request.nPrivateGroupid!))) throw new PrivateGroupRefused(PRIVATE_GROUP_REFUSED.value);
      any = true;
    }
  } else {
    // A piece split off a grouped QFACT inherits its group by one guarded copy (never the stored procedure: it answers a refusal
    // as a failure row, which fails the whole save transaction). Nothing to copy or not eligible: the piece stays ungrouped and
    // the unmark stands. A database error is thrown by `rows` and rolls everything back as the ordinary capture failure.
    const origins = new Map<string, string | null>(known);
    for (const piece of result.filed!) {
      if (!piece.from) continue;
      if ((await rows(db,LIVE_QFACT_INHERIT_SQL,[piece.id,piece.from])).length) { any = true; continue; }
      if (!origins.has(piece.from)) origins.set(piece.from,(await rows<{ nGroupid: string }>(db,LIVE_QFACT_GROUP_SQL,[piece.from]))[0]?.nGroupid ?? null);
      if (origins.get(piece.from)) new Logger('LiveQfactGroup').warn(`private_group_inherit_skipped request=${request.nRequestid}`);
    }
  }
  if (any) try { await assigned?.(actor); } catch { /* a missed notice is recovered by the client's refetch; never fail the capture */ }
}

/** The step-by-step capture: one transaction, each read and write its own database call. */
export async function captureStepByStep(db: DbService, feed: FeedDataService, request: LiveQfactCaptureRequest, user: RealtimeUser,
  now: number, timing?: CaptureTiming, assigned?: GroupAssigned): Promise<LiveQfactResult> {
  await assertCanCreateFact(db,user,request);
  timing?.phase('gate');
  if (!feed) throw new InternalServerErrorException('Live transcript data is unavailable. Please retry.');
  const capture = async () => {
    const result = await decideCapture(directIo(db,request,user.userId),feed,await session(db,request),request,user.userId,now);
    await assignCaptureGroup(db,user.userId,request,result,assigned);
    return result;
  };
  const saved = await db.saveAtomically(() => { timing?.phase('begin'); return capture().finally(() => timing?.phase('work')); });
  timing?.phase('commit');
  return saved as LiveQfactResult;
}

/**
 * One live line marked or unmarked. LIVE_QFACT_SINGLE_CALL=1 (2026-11-04: each database call costs ~64 ms on
 * etabella.net, a mark made 12-19): three calls — the checks side by side, one read, one write
 * (live-qfact-single-call.ts). Off, or on a database without that migration's function: step by step.
 */
export async function captureLiveQfact(untimedDb: DbService, untimedFeed: FeedDataService, request: LiveQfactCaptureRequest, user: RealtimeUser,
  now: number = Date.now(), timing?: CaptureTiming, assigned?: GroupAssigned): Promise<LiveQfactResult | typeof PRIVATE_GROUP_REFUSED> {
  const db = timing ? timing.db(untimedDb) : untimedDb;
  const feed = timing && untimedFeed ? timing.feed(untimedFeed) : untimedFeed;
  try {
    const result = liveQfactSingleCall() ? await captureInOneCall(db,feed,request,user,now,timing,assigned)
      : await captureStepByStep(db,feed,request,user,now,timing,assigned);
    const { filed, ...answered } = result;   // the group work is done; the client never sees it
    return answered;
  } catch (error) {
    if (error instanceof PrivateGroupRefused) {
      // One line, no group id, group name or procedure text: a reason code and the request only.
      new Logger('LiveQfactGroup').warn(`private_group_refused request=${request.nRequestid}`);
      return PRIVATE_GROUP_REFUSED;
    }
    throw error;
  }
}
