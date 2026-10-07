import { Caller, SpExecutor, SpOutcome } from '@app/api-kernel';

import { DOCUMENTS_FAILED, DOCUMENTS_SP, DocumentsService, FILE_NOT_ACCESSIBLE, sortSections, withSearchBundleScope } from './documents.service';
import { CONFORMANCE_BUNDLE, CONFORMANCE_CALLER, CONFORMANCE_CASE, CONFORMANCE_FILE, CONFORMANCE_SECTION, expectConformantSections, FILE_ROW, SECTION_ROWS } from './testing/conformance';

/*
 * The live executor against a fake of the SP port, call for call coreapi's BundleCreationService of 2026-10-07: the
 * SP each read calls with the caller under both identity keys, the sections sorted, user sections with both cursors,
 * the elastic schema for an elastic folder read, the folder scope mirrored into jFilter for a search, the file access
 * gate when the host switches it on, and the one DomainError every failed call becomes.
 */

const caller: Caller = { userId: CONFORMANCE_CALLER, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' };

function world(answers: Record<string, SpOutcome<unknown>> = {}, options?: { fileAccessGuard: boolean }) {
  const calls: unknown[][] = [];
  const sp: SpExecutor = {
    call: async (fn, params, schema) => {
      calls.push([fn, params, schema]);
      return (answers[fn] ?? { ok: true, cursors: [[]] }) as never;
    },
  };
  return { service: new DocumentsService(sp, options), calls };
}

describe('DocumentsService (the live executor)', () => {
  it('sections: et_admin_sections with the caller under both keys, the rows in the Evidence type order (G2 conformance)', async () => {
    const w = world({ [DOCUMENTS_SP.sections]: { ok: true, cursors: [SECTION_ROWS] } });
    expectConformantSections(await w.service.sections(caller, { nCaseid: CONFORMANCE_CASE, nMasterid: 'forged' }));
    expect(w.calls).toEqual([[DOCUMENTS_SP.sections, { nCaseid: CONFORMANCE_CASE, nMasterid: CONFORMANCE_CALLER, nUserid: CONFORMANCE_CALLER }, undefined]]);
    expect(sortSections([])).toEqual([]);
  });

  it('userSections: et_user_sections with ref 2, both cursors answered as they came', async () => {
    const cursors = [[{ nSectionid: CONFORMANCE_SECTION }], [{ cType: 'TF' }]];
    const w = world({ [DOCUMENTS_SP.userSections]: { ok: true, cursors } });
    await expect(w.service.userSections(caller, { nCaseid: CONFORMANCE_CASE })).resolves.toEqual(cursors);
    expect(w.calls[0]).toEqual([DOCUMENTS_SP.userSections, { nCaseid: CONFORMANCE_CASE, nMasterid: CONFORMANCE_CALLER, nUserid: CONFORMANCE_CALLER, ref: 2 }, undefined]);
  });

  it('bundles: et_bundles on public, on the elastic schema when the body carries jElasticBundles', async () => {
    const rows = [{ nBundleid: CONFORMANCE_BUNDLE, cBundlename: 'Correspondence' }];
    const w = world({ [DOCUMENTS_SP.bundles]: { ok: true, cursors: [rows] } });
    await expect(w.service.bundles(caller, { nSectionid: CONFORMANCE_SECTION, pageNumber: 1 })).resolves.toEqual(rows);
    await w.service.bundles(caller, { nSectionid: CONFORMANCE_SECTION, pageNumber: 1, jElasticBundles: '["x"]' });
    expect(w.calls.map((c) => c[2])).toEqual([undefined, 'elastic']);
    expect(w.calls[1][1]).toMatchObject({ jElasticBundles: '["x"]', nMasterid: CONFORMANCE_CALLER });
  });

  it('bundleDetail and bundleDetailSearch: the search mirrors a top-level nBundleid into jFilter (cLocation T) unless jFilter already scopes', async () => {
    const w = world();
    await w.service.bundleDetail(caller, { nSectionid: CONFORMANCE_SECTION, nBundleid: CONFORMANCE_BUNDLE, pageNumber: 2 });
    expect(w.calls[0]).toEqual([DOCUMENTS_SP.bundleDetail, { nSectionid: CONFORMANCE_SECTION, nBundleid: CONFORMANCE_BUNDLE, pageNumber: 2, nMasterid: CONFORMANCE_CALLER, nUserid: CONFORMANCE_CALLER }, undefined]);
    await w.service.bundleDetailSearch(caller, { nSectionid: CONFORMANCE_SECTION, nBundleid: CONFORMANCE_BUNDLE, pageNumber: 1, cSearch: 'yard' });
    expect(w.calls[1][0]).toBe(DOCUMENTS_SP.bundleDetailSearch);
    expect(JSON.parse((w.calls[1][1] as { jFilter: string }).jFilter)).toEqual({ cLocation: 'T', nBundleid: CONFORMANCE_BUNDLE });
    expect(withSearchBundleScope({ nSectionid: CONFORMANCE_SECTION, pageNumber: 1 })).toEqual({ nSectionid: CONFORMANCE_SECTION, pageNumber: 1 });
    expect(withSearchBundleScope({ nSectionid: CONFORMANCE_SECTION, nBundleid: CONFORMANCE_BUNDLE, pageNumber: 1, jFilter: '{"cLocation":"S"}' }).jFilter).toBe('{"cLocation":"S"}');
    expect(JSON.parse(withSearchBundleScope({ nSectionid: CONFORMANCE_SECTION, nBundleid: CONFORMANCE_BUNDLE, pageNumber: 1, jFilter: '{"cFiletype":"pdf"}' }).jFilter!)).toEqual({ cFiletype: 'pdf', cLocation: 'T', nBundleid: CONFORMANCE_BUNDLE });
    expect(JSON.parse(withSearchBundleScope({ nSectionid: CONFORMANCE_SECTION, nBundleid: CONFORMANCE_BUNDLE, pageNumber: 1, jFilter: 'not json' }).jFilter!)).toEqual({ cLocation: 'T', nBundleid: CONFORMANCE_BUNDLE });
  });

  it('folderSearch and bundleIndex call their SPs with the caller', async () => {
    const w = world();
    await w.service.folderSearch(caller, { nCaseid: CONFORMANCE_CASE, cSearch: 'yard' });
    await w.service.bundleIndex(caller, { nSectionid: CONFORMANCE_SECTION, nCaseid: CONFORMANCE_CASE, pageNumber: 1, perPage: 80, cSearch: 'D-14' });
    expect(w.calls.map((c) => c[0])).toEqual([DOCUMENTS_SP.folderSearch, DOCUMENTS_SP.bundleIndex]);
    expect(w.calls[1][1]).toMatchObject({ nSectionid: CONFORMANCE_SECTION, cSearch: 'D-14', nMasterid: CONFORMANCE_CALLER });
  });

  it('fileData: et_get_filedata; with the access gate on, et_can_access_filedata first and the refusal row when it says no', async () => {
    const off = world({ [DOCUMENTS_SP.fileData]: { ok: true, cursors: [[FILE_ROW]] } });
    await expect(off.service.fileData(caller, { nBundledetailid: CONFORMANCE_FILE })).resolves.toEqual([FILE_ROW]);
    expect(off.calls.map((c) => c[0])).toEqual([DOCUMENTS_SP.fileData]);
    const allowed = world({ [DOCUMENTS_SP.fileAccess]: { ok: true, cursors: [[{ allowed: true }]] }, [DOCUMENTS_SP.fileData]: { ok: true, cursors: [[FILE_ROW]] } }, { fileAccessGuard: true });
    await expect(allowed.service.fileData(caller, { nBundledetailid: CONFORMANCE_FILE })).resolves.toEqual([FILE_ROW]);
    expect(allowed.calls[0]).toEqual([DOCUMENTS_SP.fileAccess, { nMasterid: CONFORMANCE_CALLER, nBundledetailid: CONFORMANCE_FILE }, undefined]);
    const refused = world({ [DOCUMENTS_SP.fileAccess]: { ok: true, cursors: [[{ allowed: false }]] } }, { fileAccessGuard: true });
    await expect(refused.service.fileData(caller, { nBundledetailid: CONFORMANCE_FILE })).resolves.toEqual({ msg: -1, value: FILE_NOT_ACCESSIBLE });
    expect(refused.calls.map((c) => c[0])).toEqual([DOCUMENTS_SP.fileAccess]);
    const failedGate = world({ [DOCUMENTS_SP.fileAccess]: { ok: false, error: 'db down' } }, { fileAccessGuard: true });
    await expect(failedGate.service.fileData(caller, { nBundledetailid: CONFORMANCE_FILE })).resolves.toEqual({ msg: -1, value: FILE_NOT_ACCESSIBLE });
  });

  it('a failed call is upstream with what the SP said', async () => {
    const w = world({ [DOCUMENTS_SP.folderSearch]: { ok: false, error: 'db said no' } });
    await expect(w.service.folderSearch(caller, { nCaseid: CONFORMANCE_CASE, cSearch: 'x' })).rejects.toMatchObject({ code: 'upstream', message: DOCUMENTS_FAILED, detail: { error: 'db said no' } });
    const sections = world({ [DOCUMENTS_SP.userSections]: { ok: false, error: 'db said no' } });
    await expect(sections.service.userSections(caller, { nCaseid: CONFORMANCE_CASE })).rejects.toMatchObject({ code: 'upstream' });
  });
});
