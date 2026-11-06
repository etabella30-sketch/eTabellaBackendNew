import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { assertCaseModeWrite } from '@app/permissions';
import { PgRowQuery } from '@app/platform-cloud';
import { LiveQfactCaptureRequest } from '../../interfaces/live-qfact-capture.dto';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { FeedDataService } from '../feed-data/feed-data.service';
import { assertCanCreateFact } from './fact-create-gate';
import {
  CaptureSession, captureStepByStep, decideCapture, IssueTuples, lineAt, LiveQfactCaptureIo, LiveQfactInsert, LiveQfactReceipt,
  LiveQfactResult, rows, runKey, session, sourceLine, StoredGroup,
} from './live-qfact-capture';
import type { CaptureTiming } from './live-qfact-timing';
import { LiveQfactCoordinate } from './live-qfact-rules';
import { assertIssuesInCase, markIssueIds } from './mark-write-guards';

/**
 * LIVE_QFACT_SINGLE_CALL=1: an instant QFACT capture makes three database calls instead of 12-19 (2026-11-04: each
 * costs ~64 ms on etabella.net — a new QFACT took ~1.5 s, a join ~0.9 s). Off by default: a database without the
 * 2026-11-04_live_qfact_single_call migration keeps the step-by-step path. Read per capture, so a restart switches it.
 */
export function liveQfactSingleCall(): boolean {
  return process.env.LIVE_QFACT_SINGLE_CALL === '1';
}

/**
 * Everything the capture rules may read about the clicked line and the lines directly above and below it, in one
 * query: the user's live QFACTs holding each line (with their issues), the lines a historical QFACT holds, this
 * request's receipt, and the case's Unassigned issue. $1 user, $2 session, $3 request, $4 case, $5 run, $6 identities.
 */
export const LIVE_QFACT_SNAPSHOT_SQL = `SELECT realtime.live_qfact_owners($2::uuid,$1::uuid,$5,$6::text[]) AS "owners",
  (SELECT jsonb_build_object('cRun',r."cRun",'cIdentity',r."cIdentity",'cAction',r."cAction") FROM "LiveQfactRequest" r
    WHERE r."nUserid"=$1::uuid AND r."nSesid"=$2::uuid AND r."nRequestid"=$3::uuid) AS "receipt",
  ARRAY(SELECT ident FROM unnest($6::text[]) ident WHERE EXISTS (SELECT 1 FROM "FactMaster" m
    JOIN "FactDetail" d ON d."nFSid"=m."nFSid" JOIN "QfactLegacyConversion" legacy ON legacy."nFSid"=m."nFSid" AND legacy."bActive"
    WHERE m."nSesid"=$2::uuid AND m."nUserid"=$1::uuid AND m."cFType"='QF'
      AND (d."jCordinates" @> jsonb_build_array(jsonb_build_object('identity',ident)) OR legacy."jLegacyRow"->>'identity'=ident))) AS "legacy",
  (SELECT "nIid"::text FROM "RIssueMaster" WHERE "nCaseid"=$4::uuid AND "nUserid" IS NULL AND lower(btrim("cIName"))='unassigned'
    ORDER BY "nIid" LIMIT 1) AS "unassigned"`;
/** The writes, in one transaction: realtime.live_qfact_capture_apply (migration 2026-11-04_live_qfact_single_call). */
export const LIVE_QFACT_APPLY_SQL = 'SELECT realtime.live_qfact_capture_apply($1::jsonb) AS "answer"';

/** A stored group as the snapshot holds it: its issue rows as [id, impact, relevance]. */
export type SnapshotGroup = { nFSid: string; dCreateDt?: string; jCordinates: unknown; bLiveCapturePristine: boolean; issues: unknown[][] };
export type LiveQfactSnapshot = {
  owners: Record<string, SnapshotGroup[]>; receipt: Omit<LiveQfactReceipt, 'jResult'> | null; legacy: string[]; unassigned: string | null;
};
export type LiveQfactOp =
  | { op: 'create'; ref: string; body: Record<string, unknown> }
  | { op: 'update'; id: string; jOT: string[]; coordinates: LiveQfactCoordinate[]; nPage: number; nLine: number }
  | { op: 'remove'; id: string };
export type LiveQfactApplyAnswer = { status: 'ok'; result: LiveQfactResult } | { status: 'stale' } | { status: 'gone' };

/** The snapshot misses a read the rules made: the step-by-step path takes the capture. */
class SnapshotMiss extends Error {}
const STALE_RETRIES = 2;
const builder = new QueryBuilderService();
/** A new QFACT's id until the database gives it one; the apply call swaps it in everywhere. */
const placeholder = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;

/** The reads answered from the snapshot; the writes recorded, in order, for the apply call. */
function snapshotIo(snapshot: LiveQfactSnapshot, issueError: unknown, ops: LiveQfactOp[]): LiveQfactCaptureIo {
  const owners = (identity: string) => {
    const list = snapshot.owners[identity];
    if (!list) throw new SnapshotMiss(identity);
    return list;
  };
  let created = 0;
  return {
    async lock() { /* the apply call takes the lock and checks the case mode (here: before the read) */ },
    async receipt() { if (snapshot.receipt) throw new SnapshotMiss('receipt'); return undefined; },
    async replay() { throw new SnapshotMiss('receipt'); },
    async legacy(identity) {
      if (!(identity in snapshot.owners)) throw new SnapshotMiss(identity);
      return snapshot.legacy.includes(identity);
    },
    async find(coordinate: LiveQfactCoordinate): Promise<StoredGroup[]> {
      return owners(coordinate.identity).map(group => ({...group,issueIds:group.issues.map(issue=>String(issue[0]))}));
    },
    async unassignedId() { return snapshot.unassigned; },
    async checkIssues() { if (issueError) throw issueError; },
    async groupIssues(nFSid): Promise<IssueTuples> {
      const group = Object.values(snapshot.owners).flat().find(item=>item.nFSid===nFSid);
      if (!group) throw new SnapshotMiss(nFSid);
      return group.issues.map(issue => [String(issue[0]), Number(issue[1]) || 0, Number(issue[2]) || 0]);
    },
    async insert(body: LiveQfactInsert) {
      const ref = placeholder(++created);
      // What executeRef hands fact_insert / _detail / _issues (QueryBuilderService), so the same procedures get the same input.
      ops.push({op:'create',ref,body:builder.setNullValues({...body})});
      return ref;
    },
    async update(id, sorted) {
      ops.push({op:'update',id,jOT:[sorted.map(line=>line.text).join('\n')],coordinates:sorted,nPage:sorted[0].p,nLine:sorted[0].l});
    },
    async remove(id) { ops.push({op:'remove',id}); },
    async saveReceipt() { /* the apply call stores it, with the new ids */ },
  };
}

/** The lines the rules may look at: the clicked line, and for a mark the lines directly above and below. */
async function linesInPlay(feed: FeedDataService, record: CaptureSession, request: LiveQfactCaptureRequest): Promise<string[]> {
  const target = await sourceLine(feed,record,request.page,request.line);
  if (!target) return [request.identity];
  const around = request.action==='mark' && target.hearing
    ? [await lineAt(feed,record,target.order-1), await lineAt(feed,record,target.order+1)] : [];
  return [...new Set([target.identity, ...around.filter(line=>line?.run===target.run).map(line=>line!.identity)])];
}

/** The checks, side by side (each its own call, all at once): the first failure in the step-by-step order is thrown. */
async function checks(db: DbService, request: LiveQfactCaptureRequest, user: RealtimeUser) {
  const [gate, record, mode, issues] = await Promise.allSettled([
    assertCanCreateFact(db,user,request),
    session(db,request),
    assertCaseModeWrite(new PgRowQuery(db),'fact_insert',{nCaseid:request.nCaseid,nMasterid:user.userId,cFtype:'QF'}),
    markIssueIds({ jIssues: request.jIssues }).length ? assertIssuesInCase(db,{ nCaseid: request.nCaseid, jIssues: request.jIssues }) : Promise.resolve(),
  ]);
  for (const settled of [gate, record, mode]) if (settled.status === 'rejected') throw settled.reason;
  // An unknown picked issue refuses only a capture that uses the picked issues, as step by step.
  return { record: (record as PromiseFulfilledResult<CaptureSession>).value, issueError: issues.status === 'rejected' ? issues.reason : undefined };
}

/**
 * The capture in three database calls: the checks (side by side), one read (LIVE_QFACT_SNAPSHOT_SQL), the rules
 * (decideCapture, no database), one write (LIVE_QFACT_APPLY_SQL — lock, re-read, writes and receipt in one
 * transaction). A read made stale by another write in between is read again; a capture the snapshot cannot answer
 * (a retried request, a line it did not cover) goes step by step.
 */
export async function captureInOneCall(db: DbService, feed: FeedDataService, request: LiveQfactCaptureRequest, user: RealtimeUser,
  now: number, timing?: CaptureTiming): Promise<LiveQfactResult> {
  const { record, issueError } = await checks(db,request,user);
  timing?.phase('checks');
  if (!feed) throw new InternalServerErrorException('Live transcript data is unavailable. Please retry.');
  const actor = user.userId;
  const identities = await linesInPlay(feed,record,request);
  for (let attempt = 0; attempt <= STALE_RETRIES; attempt++) {
    const [snapshot] = await rows<LiveQfactSnapshot>(db,LIVE_QFACT_SNAPSHOT_SQL,
      [actor,request.nSesid,request.nRequestid,request.nCaseid,runKey(record),identities]);
    timing?.phase('read');
    const ops: LiveQfactOp[] = [];
    let result: LiveQfactResult;
    try {
      result = await decideCapture(snapshotIo(snapshot,issueError,ops),feed,record,request,actor,now);
    } catch (error) {
      if (error instanceof SnapshotMiss) break;
      throw error;
    }
    const [{ answer }] = await rows<{ answer: LiveQfactApplyAnswer }>(db,LIVE_QFACT_APPLY_SQL,[JSON.stringify({
      nUserid:actor,nSesid:request.nSesid,nCaseid:request.nCaseid,nRequestid:request.nRequestid,cRun:request.cRun,
      cIdentity:request.identity,cAction:request.action,run:runKey(record),identities,owners:snapshot.owners,ops,result,
    })]);
    timing?.phase('apply');
    if (answer.status === 'ok') return answer.result;
    if (answer.status === 'gone') throw new ConflictException('Instant QFACT capture is only available on a live Realtime transcript.');
  }
  // Stale twice over, or a retried request: step by step, as before this path existed.
  return captureStepByStep(db,feed,request,user,now,timing);
}
