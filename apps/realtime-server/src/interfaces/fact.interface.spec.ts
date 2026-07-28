import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { InsertDoc } from './doc.interface';

/**
 * Issue 063 regression: a page/range/document-scoped DocLink from the Angular 21
 * reader stamps the scope kind INSIDE each jAn rect ({x,y,width,height,scope}).
 * jRects must whitelist `scope` or the global ValidationPipe (whitelist +
 * forbidNonWhitelisted) rejects the insert with
 * "jAn.0.rects.0.property scope should not exist" — text-selection DocLinks
 * (no scope) keep working, which made the failure look page-range-specific.
 */
describe('InsertDoc jAn rects (doclink/insertdoc)', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

  const base = {
    nBundledetailid: 'ea14bc11-0a1d-4f26-a720-02cdeeeef955',
    nCaseid: 'ca881056-8ae4-4a66-a793-47d9347d4de4',
    nMasterid: '11111111-2222-4333-8444-555555555555',
    cType: 'S',
    cDFrom: 'I',
    nPage: 1,
    nLine: 0,
    jDl: JSON.stringify([['aaaabbbb-cccc-4ddd-8eee-ffff00001111', 'D', [], []]]),
    jT: '[]',
    jOT: JSON.stringify(['G1.1-1 to G1.1-9']),
    jUsers: '[]',
  };

  const transform = (body: unknown) =>
    pipe.transform(body, { type: 'body', metatype: InsertDoc });

  it('accepts a page-range DocLink and preserves the scope kind inside the rect', async () => {
    const out = (await transform({
      ...base,
      jAn: [{
        uuid: 'f1e2d3c4-0000-4000-8000-123456789abc',
        type: 'page-marker',
        lines: [],
        page: 1,
        width: 595,
        rects: [{ x: 529, y: 26, width: 20, height: 20, scope: 'P' }],
      }],
    })) as InsertDoc;
    expect(out.jAn[0].rects[0]).toMatchObject({ x: 529, y: 26, scope: 'P' });
  });

  it('accepts current-page (C) and entire-document (D) scope kinds', async () => {
    for (const scope of ['C', 'D']) {
      await expect(transform({
        ...base,
        jAn: [{
          uuid: 'f1e2d3c4-0000-4000-8000-123456789abc',
          type: 'page-marker',
          page: 1,
          width: 595,
          rects: [{ x: 529, y: 26, width: 20, height: 20, scope }],
        }],
      })).resolves.toBeDefined();
    }
  });

  it('still accepts a plain text-selection DocLink rect (no scope)', async () => {
    await expect(transform({
      ...base,
      jAn: [{
        uuid: 'f1e2d3c4-0000-4000-8000-123456789abc',
        type: 'highlight',
        lines: [],
        color: '#80EBFF',
        borderColor: '#2F6BFF',
        strokeWidth: 1,
        opacity: 0.4,
        page: 3,
        width: 595,
        rects: [{ x: 100, y: 200, width: 300, height: 14 }],
      }],
    })).resolves.toBeDefined();
  });

  it('rejects an unknown scope kind', async () => {
    await expect(transform({
      ...base,
      jAn: [{
        uuid: 'f1e2d3c4-0000-4000-8000-123456789abc',
        type: 'page-marker',
        page: 1,
        rects: [{ x: 529, y: 26, width: 20, height: 20, scope: 'X' }],
      }],
    })).rejects.toMatchObject({ status: 400 });
  });

  it('still rejects a truly unknown rect property', async () => {
    await expect(transform({
      ...base,
      jAn: [{
        uuid: 'f1e2d3c4-0000-4000-8000-123456789abc',
        type: 'page-marker',
        page: 1,
        rects: [{ x: 529, y: 26, width: 20, height: 20, evil: 1 }],
      }],
    })).rejects.toMatchObject({ status: 400 });
  });
});
