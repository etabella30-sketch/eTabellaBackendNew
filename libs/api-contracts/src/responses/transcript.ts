/**
 * Wire shapes of the RT session and transcript reads (shared-libraries plan Phase 6): what realtime-server answers
 * on `session/getSessionsByCaseId`, `session/activesession(/detail)` and `session/realtimedatabysesid`, and what
 * the venue box answers on the same routes from its own state and pages (apps/rt-edge lan/rt-data/rt-local.ts).
 * Interfaces only: the FE edge build and both hosts agree on them without a framework.
 */

/** `cStatus` as the cloud and the FE read it: R live, C complete (sealed), E ended, D not started (not recording). */
export type RtSessionStatus = 'R' | 'C' | 'E' | 'D';
/** `cSyncState` of a venue session: L live, S end requested / awaiting the seal, K / W sealed (W with warnings). */
export type RtSyncState = 'L' | 'S' | 'K' | 'W';

/** One session row (`session/getSessionsByCaseId`, `getlivesessionbycaseid`, `activesession`), venue fields included. */
export interface RtSessionRow {
  readonly nSesid: string;
  readonly nCaseid: string;
  readonly cName: string;
  readonly dStartDt: string | null;
  readonly cStatus: RtSessionStatus;
  readonly isTranscript: false;
  readonly isUploaded: false;
  readonly cProtocol: 'B' | 'C';
  readonly nLines: number;
  readonly cCaseno: string;
  readonly cCasename: string;
  readonly bRefresh: false;
  readonly nRTSid: null;
  readonly nLSesid: string;
  readonly cUrl: null;
  readonly nPort: null;
  readonly cTimezone: string;
  readonly cFeedSource: 'E';
  readonly nEdgeid: string | null;
  readonly cSyncState: RtSyncState;
  readonly nPartNo: number;
  readonly nPrevPartSesid: string | null;
  readonly nNextPartSesid: string | null;
}

/** `session/activesession/detail`: `realtime.et_realtime_sessiondata` plus the two keys getActiveSessionDetail adds. */
export interface RtSessionDetail {
  readonly nCaseid: string;
  readonly nSesid: string;
  readonly nRTSid: null;
  readonly cName: string;
  readonly dStartDt: string | null;
  readonly nDays: number;
  readonly nLines: number;
  readonly nPageno: number;
  readonly cUnicuserid: null;
  readonly cStatus: RtSessionStatus;
  readonly cNotifytype: null;
  readonly dCreatedt: null;
  readonly cCaseno: string;
  readonly cUrl: null;
  readonly nPort: null;
  readonly cCasename: string;
  readonly totaIssues: number;
  readonly cDefHIssues: readonly unknown[];
  readonly nLID: null;
  readonly cColor: null;
  readonly cDefIssues: readonly unknown[];
  readonly nLIid: null;
  readonly cAColor: null;
  readonly isTrans: false;
  readonly nDemoid: number;
  readonly cProtocol: 'B' | 'C';
  readonly maxNumber: number;
  /** The last page's tuples as JSON text (the cloud reads the draft page file as text); null before the first line. */
  readonly pageRes: string | null;
}

/** One transcript line of `session/realtimedatabysesid` (`{msg:1, data: RtTranscriptPage[]}`). */
export interface RtTranscriptLine {
  readonly time: unknown;
  readonly lineIndex: number;
  readonly lines: readonly string[];
  readonly formate?: unknown;
  readonly unicid?: unknown;
}

export interface RtTranscriptPage {
  readonly msg: number;
  readonly page: number;
  readonly data: readonly RtTranscriptLine[];
}
