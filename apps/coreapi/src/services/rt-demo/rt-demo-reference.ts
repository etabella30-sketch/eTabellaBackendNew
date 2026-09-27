/**
 * Picks the index row a transcript link such as {A2-3} means. A port of the RT
 * page's findDocumentRowForReference (eTabella angular realtime-page.component.ts)
 * so the RT Simulation opens the same document a real session would:
 * exact tab, then exhibit number, then folder tag + tab, then a contains match.
 */
export interface RtDemoIndexRow {
  nBundledetailid?: string | null;
  cTab?: string | null;
  cExhibitno?: string | null;
  cFolderTag?: string | null;
  cBundletag?: string | null;
  cFolder?: string | null;
  cName?: string | null;
  cFilename?: string | null;
  cFiletype?: string | null;
  [key: string]: unknown;
}

export function findDocumentRowForReference<T extends RtDemoIndexRow>(rows: readonly T[], tabRef: string): T | null {
  const wanted = normalizeDocumentToken(tabRef);
  if (!wanted) return null;
  const candidates = documentReferenceCandidates(tabRef);
  const openable = rows.filter(row => !!cleanDocumentField(row.nBundledetailid));

  return openable.find(row => candidates.has(normalizeDocumentToken(row.cTab)))
    ?? openable.find(row => candidates.has(normalizeDocumentToken(row.cExhibitno)))
    ?? openable.find(row => rowMatchesBundleTab(row, wanted))
    ?? openable.find(row => rowContainsDocumentToken(row, wanted))
    ?? null;
}

function documentReferenceCandidates(tabRef: string): ReadonlySet<string> {
  const clean = cleanDocumentField(tabRef).toUpperCase();
  const out = new Set<string>([normalizeDocumentToken(clean)]);
  const split = /^([A-Z]+)([0-9].*)$/.exec(clean.replace(/\s+/g, ''));
  if (split) {
    out.add(normalizeDocumentToken(split[2]));
    out.add(normalizeDocumentToken(`${split[1]}.${split[2]}`));
    out.add(normalizeDocumentToken(`${split[1]}-${split[2]}`));
  }
  return out;
}

function rowMatchesBundleTab(row: RtDemoIndexRow, wanted: string): boolean {
  const rowTab = normalizeDocumentToken(row.cTab);
  const folderTag = normalizeDocumentToken(row.cFolderTag);
  const bundleTag = normalizeDocumentToken(row.cBundletag);
  return !!rowTab && (
    (!!folderTag && `${folderTag}${rowTab}` === wanted)
    || (!!bundleTag && `${bundleTag}${rowTab}` === wanted)
  );
}

function rowContainsDocumentToken(row: RtDemoIndexRow, wanted: string): boolean {
  return [
    row.cTab,
    row.cFolderTag,
    row.cBundletag,
    row.cFolder,
    row.cName,
    row.cFilename,
  ].some(value => normalizeDocumentToken(value).includes(wanted));
}

export function normalizeDocumentToken(value: unknown): string {
  return cleanDocumentField(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function cleanDocumentField(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/** "1-20" -> 20 pages; anything else -> unknown. */
export function pageCountFromRange(cPage: unknown): number | null {
  const m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(cleanDocumentField(cPage));
  if (!m) return null;
  const count = Number(m[2]) - Number(m[1]) + 1;
  return count > 0 ? count : null;
}
