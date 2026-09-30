import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class hyperlinkReq {
  @ApiProperty({ example: '', description: 'nBundledetailid must be a UUID string', required: true })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: '', description: 'nBundleid must be a UUID string', required: false })
  @IsOptional()
  @IsItUUID()
  nBundleid: string;

  @ApiProperty({ example: '', description: 'nSectionid must be a UUID string', required: true })
  @IsItUUID()
  nSectionid: string;


  @ApiProperty({ example: '', description: 'nCaseid must be a UUID string', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: '', description: 'Tab or Exhibitno', required: true })
  @IsString()
  cType: string;

  @ApiProperty({ example: '', description: 'Keeptype', required: true })
  @IsString()
  cKeeptype: string;


  @ApiProperty({ example: '', description: 'Without {}', required: false })
  @IsOptional()
  @IsBoolean()
  isDeepscan: boolean;

  @ApiProperty({ example: false, description: 'Smart scan: [ ] and { } references, tolerant of line / page / table-cell breaks', required: false })
  @IsOptional()
  @IsBoolean()
  isSmartscan?: boolean;

  @IsItUUID()
  nMasterid?: string;
}


export class gethyperlinkReq {

  @ApiProperty({ example: '', description: 'nCaseid must be a UUID string', required: true })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}



/** Body of POST /cancelhyperlink: the same scope rule as starthyperlink. */
export class cancelhyperlinkReq {
  @ApiProperty({ example: '', description: 'nCaseid must be a UUID string', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: '', description: 'nSectionid must be a UUID string', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: '', description: 'nBundleid (bundle scope)', required: false })
  @IsOptional()
  @IsItUUID()
  nBundleid?: string;

  @ApiProperty({ example: '', description: 'nBundledetailid (single-file scope)', required: false })
  @IsOptional()
  @IsItUUID()
  nBundledetailid?: string;

  @IsItUUID()
  nMasterid?: string;
}

/** One entry of hyperlinkProcess.jFailed (capped at 200 entries per batch). */
export interface hyperlinkFailedEntry {
  nBundledetailid: string;
  cFilename: string;
  cReason: string;
}

/**
 * Progress snapshot stored under the HYPERLINK/<master>/<case>/<section>/<scope>
 * key and pushed to the frontend as the HYPERLINK-RESPONCE socket event. The
 * legacy fields keep their names/types; the fields marked "v2" are additive.
 */
export class hyperlinkProcess {
  queueName: string;
  nCaseid: string;
  nSectionid: string;
  nMasterid: string;
  nBundledetailid: string;
  nBundleid: string;
  cKeeptype: string;
  cType: string;
  nTotal: number;
  nCompleted: number;
  nFailed: number;
  /** P running, C completed, F completed with failures / failed to start, X cancelled */
  cStatus: 'P' | 'C' | 'F' | 'X';
  isDeepscan: boolean;
  isSmartscan?: boolean;
  /** v2: <nCaseid>:<nSectionid>:<scope> */
  batchId?: string;
  /** v2: ISO timestamps */
  dStart?: string;
  dUpdate?: string;
  /** v2: failed files with the reason (first 200) */
  jFailed?: hyperlinkFailedEntry[];
  nFailedTruncated?: boolean;
}

/** Result contract of HyperlinksearchService.createHyperlinkFile (v2, strict). */
export interface hyperlinkScanResult {
  ok: boolean;
  /** python exit code; -1 killed by the per-file timer, -2 could not spawn */
  code: number;
  reason?: string;
}

/**
 * Data of the orchestrator job on hyperlink-queue: the batch's snapshot plus
 * the run token of the batch run that queued it (a cancel + restart creates a
 * new run; the orchestrator of an old run must do nothing).
 */
export type hyperlinkBundleJob = hyperlinkProcess & { run?: string };

/** Data of one job on hyperlink-file-queue (one per file of a batch). */
export interface hyperlinkFileJob {
  batchId: string;
  /** random token of this run of the batch; a stale job of an earlier run is ignored */
  run: string;
  /** the progress key (== hyperlinkProcess.queueName) */
  progressKey: string;
  file: hyperlinkFiles;
  /** the batch's hyperlinkProcess minus the counters */
  jobData: hyperlinkProcess;
  searchTermsPath: string;
}




export class hyperlinkFiles {
  nBundledetailid: string;
  cFilename: string;
  cPath: string;
}

export class searchedResult {
  page: number;
  cTerm: string;
  height: number;
  width: number;
  x: number;
  y: number;
  prefix: string;
  redirectpage: number;
}