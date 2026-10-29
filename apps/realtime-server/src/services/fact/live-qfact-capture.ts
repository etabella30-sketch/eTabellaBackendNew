import { ConflictException, InternalServerErrorException } from '@nestjs/common';
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
import { adjacentLiveQfactLines, liveCoordinates, LiveQfactCoordinate, splitLiveQfactLines } from './live-qfact-rules';
import { assertIssuesInCase, markIssueIds } from './mark-write-guards';

export const LIVE_QFACT_SESSION_SQL = `SELECT "nSesid", "cStatus", "isUploaded", "dDelDt", "dEntryEndedAt", "nLines",
  "nEntryEventid"::text AS "nEntryEventid" FROM "RSessionMaster"
  WHERE "nSesid"=$1::uuid AND "nCaseid"=$2::uuid FOR SHARE`;
export const LIVE_QFACT_FIND_SQL = `SELECT m."nFSid"::text AS "nFSid", m."dCreateDt", d."jCordinates", d."bLiveCapturePristine"
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

type IssueTuples = unknown[][];
export type CaptureSession = { nSesid: string; cStatus: string; isUploaded?: boolean; dDelDt?: unknown; dEntryEndedAt?: unknown; nLines: number; nEntryEventid?: string };
type StoredGroup = { nFSid: string; dCreateDt?: string; jCordinates: unknown; bLiveCapturePristine: boolean };
export interface LiveQfactGroup { nFSid: string; coordinates: readonly LiveQfactCoordinate[]; pristine: boolean }
export interface LiveQfactResult { msg: 1; nFSid?: string; groups: readonly LiveQfactGroup[]; removedIds: readonly string[]; replayed?: boolean }

async function rows<T>(db: DbService, sql: string, params: unknown[]): Promise<T[]> {
  const result = await db.rowQuery(sql,params);
  if (!result.success) throw new InternalServerErrorException('QFACT capture could not be saved. Please retry.');
  return result.data;
}

async function session(db: DbService, target: LiveQfactContextRequest): Promise<CaptureSession> {
  const [record] = await rows<CaptureSession>(db,LIVE_QFACT_SESSION_SQL,[target.nSesid,target.nCaseid]);
  if (!record || record.cStatus !== 'R' || record.isUploaded || record.dDelDt || record.dEntryEndedAt) {
    throw new ConflictException('Instant QFACT capture is only available on a live Realtime transcript.');
  }
  return record;
}

const runKey = (record: CaptureSession) => record.nEntryEventid || `session:${record.nSesid}`;

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

/**
 * The issues a new QFACT gets: the ones the user picked (checked against the case), else the case's Unassigned issue.
 * RT QA 2026-10-29 (F-19): every Express QFACT was stored with none, so no issue filter (Unassigned included) found it.
 */
async function requestIssues(db: DbService, request: LiveQfactCaptureRequest): Promise<IssueTuples> {
  const picked = markIssueIds({ jIssues: request.jIssues });
  if (picked.length) {
    await assertIssuesInCase(db, { nCaseid: request.nCaseid, jIssues: request.jIssues });
    return picked.map(id => [id, 0, 0]);
  }
  const [unassigned] = await rows<{ id: string }>(db, LIVE_QFACT_UNASSIGNED_SQL, [request.nCaseid]);
  return unassigned ? [[unassigned.id, 0, 0]] : [];
}

async function groupIssues(db: DbService, nFSid: string): Promise<IssueTuples> {
  const list = await rows<{ id: string; nImpactid?: number; nRelevanceid?: number }>(db, LIVE_QFACT_ISSUES_SQL, [nFSid]);
  return list.map(row => [row.id, Number(row.nImpactid) || 0, Number(row.nRelevanceid) || 0]);
}

async function find(db: DbService, request: LiveQfactCaptureRequest, actor: string, coordinate: LiveQfactCoordinate): Promise<StoredGroup[]> {
  return rows<StoredGroup>(db,LIVE_QFACT_FIND_SQL,[request.nSesid,actor,
    JSON.stringify([{capture:'live-instant',run:coordinate.run,identity:coordinate.identity}])]);
}

export async function captureLiveQfact(db: DbService, feed: FeedDataService, request: LiveQfactCaptureRequest, user: RealtimeUser) {
  await assertCanCreateFact(db,user,request);
  if (!feed) throw new InternalServerErrorException('Live transcript data is unavailable. Please retry.');
  return db.saveAtomically(async () => {
    const record = await session(db,request);
    if (request.cRun !== runKey(record)) throw new ConflictException('The Realtime session has restarted. Reload the live transcript before capturing.');
    const actor = user.userId;
    await rows(db,'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${actor}:${request.nSesid}`]);
    await assertCaseModeWrite(new PgRowQuery(db),'fact_insert',{nCaseid:request.nCaseid,nMasterid:actor,cFtype:'QF'});
    const [receipt] = await rows<{cRun:string;cIdentity:string;cAction:string;jResult:LiveQfactResult}>(db,
      'SELECT "cRun","cIdentity","cAction","jResult" FROM "LiveQfactRequest" WHERE "nUserid"=$1::uuid AND "nSesid"=$2::uuid AND "nRequestid"=$3::uuid',
      [actor,request.nSesid,request.nRequestid]);
    if (receipt) {
      if (receipt.cRun!==request.cRun || receipt.cIdentity!==request.identity || receipt.cAction!==request.action) throw new ConflictException('This capture request has already been used.');
      const current: LiveQfactGroup[] = [];
      for (const group of receipt.jResult.groups) {
        const [row] = await rows<StoredGroup>(db,`SELECT d."jCordinates",d."bLiveCapturePristine" FROM "FactDetail" d JOIN "FactMaster" m ON m."nFSid"=d."nFSid"
          WHERE d."nFSid"=$1::uuid AND m."nUserid"=$2::uuid AND m."nSesid"=$3::uuid`,[group.nFSid,actor,request.nSesid]);
        if (row) current.push({nFSid:group.nFSid,coordinates:liveCoordinates(row.jCordinates),pristine:row.bLiveCapturePristine});
      }
      return {...receipt.jResult,nFSid:current[0]?.nFSid,groups:current,replayed:true};
    }
    const target = await sourceLine(feed,record,request.page,request.line);
    if (!target || target.identity!==request.identity) throw new ConflictException('This transcript line has changed. Please capture the current line.');
    const priorLegacy=await rows(db,LIVE_QFACT_LEGACY_SQL,[request.nSesid,actor,JSON.stringify([{identity:target.identity}]),target.identity]);
    if(priorLegacy.length) throw new ConflictException('This line already belongs to a QFACT. Open it in MarkNav to edit it.');
    const existing = await find(db,request,actor,target);
    const groups: LiveQfactGroup[] = [];
    const removedIds: string[] = [];

    const update = async (id: string, coordinates: LiveQfactCoordinate[]) => {
      const sorted = [...coordinates].sort((a,b)=>a.order-b.order);
      await rows(db,`UPDATE "FactDetail" SET "jOT"=$2::jsonb,"jCordinates"=$3::jsonb,"nPage"=$4,"nLine"=$5,"bLiveCapturePristine"=true WHERE "nFSid"=$1::uuid`,
        [id,JSON.stringify([sorted.map(line=>line.text).join('\n')]),JSON.stringify(sorted),sorted[0].p,sorted[0].l]);
      groups.push({nFSid:id,coordinates:sorted,pristine:true});
    };
    let pickedIssues: IssueTuples | null = null;
    const create = async (coordinates: LiveQfactCoordinate[], inherited?: IssueTuples) => {
      const first = coordinates[0];
      const issues = inherited ?? (pickedIssues ??= await requestIssues(db,request));
      const body = {nCaseid:request.nCaseid,nSesid:request.nSesid,nMasterid:actor,cFtype:'QF',cFFrom:'RT',
        nColorid:issues.length ? String(issues[issues.length-1][0]) : null,
        jOT:JSON.stringify([coordinates.map(line=>line.text).join('\n')]),jT:'[]',jIssues:JSON.stringify(issues),jUsers:'[]',
        cIsNote:'N',bIsHighlighted:false,jCordinates:coordinates,nPage:first.p,nLine:first.l};
      const inserted = await db.executeRef('fact_insert',{...body},'realtime');
      if (!inserted.success) throw new InternalServerErrorException('QFACT could not be saved.');
      const fact = assertSaveStage(inserted.data[0][0]);
      if (!fact.nFSid) throw new InternalServerErrorException('QFACT could not be saved.');
      const detail = await db.executeRef('fact_insert_detail',{...body,nFSid:fact.nFSid},'realtime');
      if (!detail.success) throw new InternalServerErrorException('QFACT could not be saved.');
      assertSaveStage(detail.data[0]);
      if (issues.length) {
        const linked = await db.executeRef('fact_insert_issues',{...body,nFSid:fact.nFSid},'realtime');
        if (!linked.success) throw new InternalServerErrorException('QFACT could not be saved.');
      }
      await update(fact.nFSid,coordinates);
    };
    const remove = async (id: string) => {
      await rows(db,'DELETE FROM "FactDetail" WHERE "nFSid"=$1::uuid',[id]);
      await rows(db,'DELETE FROM "FactMaster" WHERE "nFSid"=$1::uuid',[id]);
      removedIds.push(id);
    };

    await rows(db,"SELECT set_config('etabella.live_qfact_write','on',true)",[]);
    try {
      if (request.action==='unmark') {
        if (existing.some(group=>!group.bLiveCapturePristine)) throw new ConflictException('This QFACT has been edited. Use the QFACT editor to change it.');
        for (const group of existing) {
          const remaining = liveCoordinates(group.jCordinates).filter(line=>line.identity!==target.identity);
          const pieces = splitLiveQfactLines(remaining);
          if (!pieces.length) await remove(group.nFSid);
          else {
            // Earliest surviving segment retains the original ordinary QFACT id.
            await update(group.nFSid,pieces[0]);
            const inherited = pieces.length>1 ? await groupIssues(db,group.nFSid) : [];
            for (const piece of pieces.slice(1)) await create(piece,inherited);
          }
        }
      } else if (existing.length) {
        for (const group of existing) groups.push({nFSid:group.nFSid,coordinates:liveCoordinates(group.jCordinates),pristine:group.bLiveCapturePristine});
      } else {
        const nLines = Number(record.nLines)||25;
        const neighbours = [
          await sourceLine(feed,record,request.line===1 ? request.page-1 : request.page,request.line===1 ? nLines : request.line-1),
          await sourceLine(feed,record,request.line===nLines ? request.page+1 : request.page,request.line===nLines ? 1 : request.line+1),
        ];
        const eligible = new Map<string,StoredGroup>();
        for (const neighbour of neighbours) {
          if (!neighbour || !(neighbour.order<target.order ? adjacentLiveQfactLines(neighbour,target) : adjacentLiveQfactLines(target,neighbour))) continue;
          for (const group of await find(db,request,actor,neighbour)) {
            const lines = liveCoordinates(group.jCordinates);
            const captured = lines.find(line=>line.identity===neighbour.identity);
            if (group.bLiveCapturePristine && captured && captured.order===neighbour.order
              && captured.hearing?.frames===neighbour.hearing?.frames && neighbour.text.startsWith(captured.text)
              && lines.length === (Array.isArray(group.jCordinates) ? group.jCordinates.length : 0)) {
              const refreshed: LiveQfactCoordinate[]=[];
              for (const line of lines) {
                const current=await sourceLine(feed,record,line.p,line.l);
                // Normal streaming append completes a whole-line capture. A
                // correction, changed identity/clock or changed location is not
                // silently rewritten. Edited/enriched groups never enter here.
                if (!current || current.identity!==line.identity || current.order!==line.order
                  || current.hearing?.frames!==line.hearing?.frames || !current.text.startsWith(line.text)) break;
                refreshed.push({...line,text:current.text});
              }
              if (refreshed.length===lines.length) eligible.set(group.nFSid,{...group,jCordinates:refreshed});
            }
          }
        }
        const candidates = [...eligible.values()].sort((a,b)=>String(a.dCreateDt).localeCompare(String(b.dCreateDt))||a.nFSid.localeCompare(b.nFSid));
        if (!candidates.length) await create([target]);
        else {
          const coordinates = [...candidates.flatMap(group=>liveCoordinates(group.jCordinates)),target];
          const unique = [...new Map(coordinates.map(line=>[line.identity,line])).values()].sort((a,b)=>a.order-b.order);
          if (splitLiveQfactLines(unique).length!==1) await create([target]);
          else {
            await update(candidates[0].nFSid,unique);
            for (const group of candidates.slice(1)) await remove(group.nFSid);
          }
        }
      }
      const result: LiveQfactResult = {msg:1,nFSid:groups[0]?.nFSid,groups,removedIds};
      await rows(db,`INSERT INTO "LiveQfactRequest" ("nUserid","nSesid","nRequestid","cRun","cIdentity","cAction","jResult") VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7::jsonb)`,
        [actor,request.nSesid,request.nRequestid,request.cRun,request.identity,request.action,JSON.stringify(result)]);
      return result;
    } finally { await rows(db,"SELECT set_config('etabella.live_qfact_write','off',true)",[]); }
  });
}
