import { DbService } from '@app/global/db/pg/db.service';
import type { Dataset, DataExportType } from './types';

/** Coerce an executeRef result's first cursor into a flat rows array. */
function rowsOf(res: any): Record<string, any>[] {
  if (!res?.success) return [];
  const first = res.data?.[0];
  return Array.isArray(first) ? first : [];
}

/**
 * Fetch the dataset(s) for a case-data export. Case-wide SPs are called
 * directly; evidence_index resolves the Master-Bundle section first;
 * full_workspace aggregates the individual datasets into a multi-table export.
 *
 * Column shapes are whatever each (partly live-only) SP returns — the renderers
 * are generic, so unknown/added columns flow through without code changes.
 *
 * Shared by the export app (Export Data card) and the downloadapi package
 * builder (Download Case Package include-flags).
 */
export async function fetchDatasets(
  db: DbService,
  cType: DataExportType,
  nCaseid: string,
  nMasterid: string,
): Promise<Dataset[]> {
  switch (cType) {
    case 'facts':
      return [{ name: 'Facts', rows: rowsOf(await db.executeRef('workspace_fact_list', { nCaseid, cFacttype: 'F' })) }];
    case 'qfacts':
      return [{ name: 'QFacts', rows: rowsOf(await db.executeRef('workspace_fact_list', { nCaseid, cFacttype: 'QF' })) }];
    case 'tags':
      return [{ name: 'Tags', rows: rowsOf(await db.executeRef('tag_list', { nCaseid, nMasterid, ref: 2 })) }];
    case 'tasks':
      return [{ name: 'Tasks', rows: rowsOf(await db.executeRef('task_list', { nCaseid, nMasterid, cTasktype: 'F', ref: 3 })) }];
    case 'doclinks':
      return [{ name: 'DocLinks', rows: rowsOf(await db.executeRef('case_doclinks', { nCaseid })) }];
    case 'evidence_index':
      return [{ name: 'Evidence Index', rows: await fetchEvidenceIndex(db, nCaseid, nMasterid) }];
    case 'transcript_index':
      return [{ name: 'Transcript Index', rows: await fetchTranscriptIndex(db, nCaseid) }];
    case 'full_workspace':
      return fetchFullWorkspace(db, nCaseid, nMasterid);
    default:
      return [];
  }
}

/** evidence_index: resolve the case's Master-Bundle section, then page the index. */
async function fetchEvidenceIndex(db: DbService, nCaseid: string, nMasterid: string): Promise<Record<string, any>[]> {
  const sectionsRes = await db.executeRef('admin_sections', { nCaseid, nMasterid });
  const sections = rowsOf(sectionsRes);
  // Prefer the Master Bundle section (cFoldertype 'MB'); fall back to the first.
  const section = sections.find((s) => (s.cFoldertype ?? s.cFolderType) === 'MB') ?? sections[0];
  const nSectionid = section?.nSectionid;
  if (!nSectionid) return [];
  const idxRes = await db.executeRef('bundle_index', {
    nSectionid, nCaseid, nMasterid, pageNumber: 1, perPage: 10000, bOutline: false,
  });
  return rowsOf(idxRes);
}

/**
 * transcript_index: `list_transcripts` returns ALL transcripts and ignores
 * nCaseid, and its `nSesid` is a different id space from RSessionMaster — so the
 * only reliable case scope is the case NUMBER, which each transcript row carries
 * as `cCCaseno`. Resolve the case's number, then keep matching transcripts.
 */
async function fetchTranscriptIndex(db: DbService, nCaseid: string): Promise<Record<string, any>[]> {
  const all = rowsOf(await db.executeRef('list_transcripts', {}, 'transcript'));
  let caseNo = '';
  try {
    const cr = await db.rowQuery('SELECT "cCaseno" FROM "CaseMaster" WHERE "nCaseid" = $1', [nCaseid]);
    caseNo = String(cr?.data?.[0]?.cCaseno ?? '').trim();
  } catch { /* fall through — no case number resolved */ }
  if (!caseNo) return [];
  return all.filter((t) => String(t.cCCaseno ?? '').trim() === caseNo);
}

/** full_workspace: aggregate every case-wide dataset into one multi-table export. */
async function fetchFullWorkspace(db: DbService, nCaseid: string, nMasterid: string): Promise<Dataset[]> {
  const [facts, qfacts, tags, tasks, doclinks] = await Promise.all([
    db.executeRef('workspace_fact_list', { nCaseid, cFacttype: 'F' }),
    db.executeRef('workspace_fact_list', { nCaseid, cFacttype: 'QF' }),
    db.executeRef('tag_list', { nCaseid, nMasterid, ref: 2 }),
    db.executeRef('task_list', { nCaseid, nMasterid, cTasktype: 'F', ref: 3 }),
    db.executeRef('case_doclinks', { nCaseid }),
  ]);
  return [
    { name: 'Facts', rows: rowsOf(facts) },
    { name: 'QFacts', rows: rowsOf(qfacts) },
    { name: 'Tags', rows: rowsOf(tags) },
    { name: 'Tasks', rows: rowsOf(tasks) },
    { name: 'DocLinks', rows: rowsOf(doclinks) },
  ];
}
