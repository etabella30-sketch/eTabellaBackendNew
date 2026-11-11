import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ExportFilewithAnnot } from './export.interface';

// The Reader "Export with Marks" body, as the global ValidationPipe of apps/export checks it
// (main.ts: whitelist + forbidNonWhitelisted). jFGroup / jQFGroup are the exporter's own Private
// Group ids for Facts / QFacts (et_export_insert_data_1 stores them on ExportMaster).
const G1 = '10000000-0000-4000-8000-000000000041';
const G2 = '10000000-0000-4000-8000-000000000042';
const base = {
  cPdftype: 'S', bPagination: true, bDoc: true, bFact: true, bQfact: true, bCoverpg: true, bFitpg: true,
  cDsize: 'S', cFsize: 'S', cQFsize: 'S', cOrientation: 'A', cPgsize: 'A4', cTranscript: 'N',
  jFContact: [], jFIssue: [], jQFContact: [], jQFIssue: [],
  nCaseid: '10000000-0000-4000-8000-000000000011',
  nMasterid: '10000000-0000-4000-8000-000000000001',
};
const errorsFor = (extra: Record<string, unknown>) =>
  validateSync(plainToInstance(ExportFilewithAnnot, { ...base, ...extra }), { whitelist: true, forbidNonWhitelisted: true });
const constraintsOf = (extra: Record<string, unknown>, property: string) =>
  errorsFor(extra).filter(e => e.property === property).map(e => Object.keys(e.constraints ?? {})).flat();

describe('ExportFilewithAnnot jFGroup / jQFGroup', () => {
  it('accepts a body without either key (today\'s clients)', () => {
    expect(errorsFor({})).toEqual([]);
  });

  it('accepts arrays of group ids for Facts and QFacts', () => {
    expect(errorsFor({ jFGroup: [G1], jQFGroup: [G1, G2] })).toEqual([]);
  });

  it('accepts empty arrays and null', () => {
    expect(errorsFor({ jFGroup: [], jQFGroup: null })).toEqual([]);
  });

  it.each(['jFGroup', 'jQFGroup'])('%s refuses a value that is not an array', key => {
    expect(constraintsOf({ [key]: G1 }, key)).toContain('isArray');
  });

  it.each([
    ['jFGroup', ['not-a-uuid']],
    ['jQFGroup', [G1, 'x']],
    ['jQFGroup', [41]],
    ['jFGroup', [{ id: G1 }]],
  ])('%s refuses an element that is not a uuid: %j', (key, value) => {
    expect(constraintsOf({ [key]: value }, key)).toContain('isUuid');
  });
});
