import { ValidationPipe } from '@nestjs/common';
import { BundleDetailQuery } from '@app/rt-features/documents';
import { BundleDetailReq } from '../../interfaces/bundle.interface';

/*
 * R4-012 (RT QA 2026-10-28): GET bundles/bundledetail without cSortby / cSorttype (the harness probe) answered
 * "SQL query is NULL": public.et_bundledetail builds its SQL text by `||` concatenation of cFiletype, cSortby and
 * cSorttype, and one NULL operand nulls the whole text. The request DTOs (coreapi's BundleDetailReq on etabella.net,
 * the shared BundleDetailQuery on the venue box route) now carry the Evidence page's own defaults for the three, so
 * the SP never sees a NULL there; what a client sends is kept as sent.
 */
const SECTION = '11111111-1111-4111-8111-111111111111';
const BUNDLE = '22222222-2222-4222-8222-222222222222';

const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const parse = (metatype: any, query: Record<string, unknown>) => pipe.transform(query, { type: 'query', metatype });

describe.each([
  ['coreapi BundleDetailReq (etabella.net)', BundleDetailReq],
  ['shared BundleDetailQuery (box route)', BundleDetailQuery],
])('bundledetail request defaults: %s', (_label, metatype) => {
  it('fills cFiletype ALL, cSortby cTab and cSorttype ASC when the request leaves them out', async () => {
    const query = await parse(metatype, { nSectionid: SECTION, nBundleid: BUNDLE, pageNumber: '1' });
    expect(query).toMatchObject({ nSectionid: SECTION, nBundleid: BUNDLE, pageNumber: 1, cFiletype: 'ALL', cSortby: 'cTab', cSorttype: 'ASC' });
  });

  it('keeps what the client sends', async () => {
    const query = await parse(metatype, { nSectionid: SECTION, pageNumber: '2', cFiletype: 'PDF', cSortby: 'cName', cSorttype: 'DESC' });
    expect(query).toMatchObject({ cFiletype: 'PDF', cSortby: 'cName', cSorttype: 'DESC', pageNumber: 2 });
  });

  it('still refuses a field the DTO does not declare', async () => {
    await expect(parse(metatype, { nSectionid: SECTION, pageNumber: '1', smuggled: 'x' })).rejects.toThrow();
  });
});
