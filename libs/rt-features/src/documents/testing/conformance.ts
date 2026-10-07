/**
 * Gate G2 of the documents feature: the same fixtures and the same expectations on every host that serves the reads
 * (coreapi's own surface, realtime-server's shared controller, the box's relay). A host spec feeds `SECTION_ROWS` to
 * its storage fake (or its fake cloud) for CONFORMANCE_CASE and asserts `expectConformantSections(answer)`: the
 * sections come back in the Evidence page's type order (Master Bundle, Private Bundle, Core Assigned, Transcript,
 * My Folders, Team Folders, User Files, unknown types last), nothing added, nothing dropped. Test code only: never
 * imported by a source file.
 */
export const CONFORMANCE_CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
export const CONFORMANCE_CALLER = '11111111-1111-4111-8111-111111111111';
export const CONFORMANCE_SECTION = '5ec70000-0000-4000-8000-000000000001';
export const CONFORMANCE_BUNDLE = 'b0d10000-0000-4000-8000-000000000001';
export const CONFORMANCE_FILE = 'f11e0000-0000-4000-8000-000000000001';

/** et_admin_sections as the SP lists them: not in display order. */
export const SECTION_ROWS: readonly Readonly<Record<string, unknown>>[] = Object.freeze([
  Object.freeze({ nSectionid: '5ec70000-0000-4000-8000-000000000004', cSectionname: 'Team Folders', cFoldertype: 'TF' }),
  Object.freeze({ nSectionid: CONFORMANCE_SECTION, cSectionname: 'Master Bundle', cFoldertype: 'MB' }),
  Object.freeze({ nSectionid: '5ec70000-0000-4000-8000-000000000009', cSectionname: 'Odd', cFoldertype: 'ZZ' }),
  Object.freeze({ nSectionid: '5ec70000-0000-4000-8000-000000000003', cSectionname: 'Transcript', cFoldertype: 'TS' }),
  Object.freeze({ nSectionid: '5ec70000-0000-4000-8000-000000000002', cSectionname: 'Private Bundle', cFoldertype: 'cb' }),
]);

/** What every host must answer for SECTION_ROWS. */
export const EXPECTED_SECTIONS: readonly Readonly<Record<string, unknown>>[] = Object.freeze([
  SECTION_ROWS[1], // MB
  SECTION_ROWS[4], // CB (compared upper-cased)
  SECTION_ROWS[3], // TS
  SECTION_ROWS[0], // TF
  SECTION_ROWS[2], // unknown type last
]);

/** et_get_filedata's row for CONFORMANCE_FILE. */
export const FILE_ROW = Object.freeze({ nBundledetailid: CONFORMANCE_FILE, cFilename: 'Yard log.pdf', cPath: 'cases/c1/yard-log.pdf', cFiletype: 'pdf', cTab: 'D-14', nSectionid: CONFORMANCE_SECTION });

/** Throws with the difference when a sections answer is not the conformant one. */
export function expectConformantSections(answer: unknown): void {
  const got = JSON.stringify(answer);
  const want = JSON.stringify(EXPECTED_SECTIONS);
  if (got !== want) throw new Error(`documents conformance: expected ${want}\n   got ${got}`);
}
