import { readFileSync } from 'fs';
import { resolve, sep } from 'path';
import { ConfigService } from '@nestjs/config';
import * as ExcelJS from 'exceljs';
import { DbService } from '@app/global/db/pg/db.service';
import { DataExportRenderer } from './renderers.service';
import { fetchDatasets } from './type-source';

describe('DocLink data export', () => {
  it('projects source and destination document references instead of internal ids', async () => {
    const db = {
      executeRef: jest.fn().mockResolvedValue({
        success: true,
        data: [[{
          dCreateDt: '2026-07-21T06:12:33.093Z',
          nDocid: 'a5c42c72-5a75-4862-9775-a5d13606ee44',
          cSourceTab: 'A1.4',
          cSourceDocument: 'Witness statement of Alex Smith.pdf',
          cDestinationTab: 'B2.7',
          cDestinationDocument: 'Email correspondence.pdf',
          cCreateby: 'Alok Jha',
          cType: 'S',
          jLinktype: null,
          nPage: 17,
          nLine: 0,
          jTexts: '["this is my notes"]',
          nLinkedBundledetailid: '4a38306d-4ca7-42c3-9476-1c5faf6b5be5',
        }]],
      }),
    } as unknown as DbService;

    const datasets = await fetchDatasets(db, 'doclinks', 'case-1', 'user-1');

    expect(datasets).toEqual([{
      name: 'DocLinks',
      rows: [{
        Created: '21 Jul 2026',
        'Source Tab Reference': 'A1.4',
        'Source Document Name': 'Witness statement of Alex Smith.pdf',
        'Destination Tab Reference': 'B2.7',
        'Destination Document Name': 'Email correspondence.pdf',
        Page: 17,
        Line: 0,
        Notes: 'this is my notes',
        'Created By': 'Alok Jha',
      }],
    }]);

    const config = {
      get: jest.fn().mockReturnValue(`${resolve('assets')}${sep}`),
    } as unknown as ConfigService;
    const rendered = await new DataExportRenderer(config).render(datasets, 'xlsx', 'DocLinks');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(rendered.buffer as any);
    const sheet = workbook.getWorksheet('DocLinks')!;

    expect((sheet.getRow(1).values as unknown[]).slice(1)).toEqual([
      'Created',
      'Source Tab Reference',
      'Source Document Name',
      'Destination Tab Reference',
      'Destination Document Name',
      'Page',
      'Line',
      'Notes',
      'Created By',
    ]);
    expect(JSON.stringify(sheet.getRow(2).values)).not.toContain('a5c42c72-5a75');
    expect(JSON.stringify(sheet.getRow(2).values)).not.toContain('4a38306d-4ca7');
  });

  it('joins both bundle documents in the deployed case-DocLink function', () => {
    const sql = readFileSync(
      resolve('assets/sql-migrations/2026-07-21_case_doclinks_readable_references.up.sql'),
      'utf8',
    );

    expect(sql).toContain('source."cTab" AS "cSourceTab"');
    expect(sql).toContain('source."cFilename" AS "cSourceDocument"');
    expect(sql).toContain('destination."cTab" AS "cDestinationTab"');
    expect(sql).toContain('destination."cFilename" AS "cDestinationDocument"');
    expect(sql).not.toContain('l."nBundledetailid" AS "nLinkedBundledetailid"');
  });
});
