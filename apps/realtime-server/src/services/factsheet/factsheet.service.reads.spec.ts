import { Logger } from '@nestjs/common';
import { FactsheetService } from './factsheet.service';

const ME = '11111111-1111-4111-8111-111111111111';
const FACT = '55555555-5555-4555-8555-555555555555';
const PERMITTED = { success: true, data: [[{ nFSid: FACT, nUserid: ME, bCanView: true, bCanEdit: true }]] };

function build(answer: (sp: string) => any) {
  const db = {
    executeRef: jest.fn(async (name: string) => {
      if (name === 'fact_permissions') return PERMITTED;
      const a = answer(name);
      if (a instanceof Error) throw a;
      return a;
    }),
  };
  return new FactsheetService(db as any, {} as any);
}
const query = () => ({ nFSid: FACT, nMasterid: ME }) as any;
const readers = ['getFactIssues', 'getFactContacts', 'getFactTasks', 'getFactLinks'] as const;

// Reader code review 2026-09-30: these answered `[]` with 200 when the SP failed; the Full Fact
// editor then took "no participants / tasks / links" for the truth and its save deleted them.
describe('FactsheetService association reads', () => {
  beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it.each(readers)('%s answers the failure shape, not an empty list, when the SP fails', async (reader) => {
    const svc = build(() => ({ success: false, error: { message: 'relation missing' } }));
    await expect(svc[reader](query())).resolves.toEqual({ msg: -1, value: 'Fetch failed', error: 'relation missing' });
  });

  it.each(readers)('%s answers the failure shape when the query throws', async (reader) => {
    const svc = build(() => new Error('connection reset'));
    await expect(svc[reader](query())).resolves.toEqual({ msg: -1, value: 'Fetch failed', error: 'connection reset' });
  });

  it('still answers the rows when the read works', async () => {
    const svc = build((sp) => sp === 'factsheet_tasks' ? { success: true, data: [[{ nTaskid: 't1' }], [], []] } : { success: true, data: [[{ nContactid: 'c1' }]] });
    await expect(svc.getFactContacts(query())).resolves.toEqual([{ nContactid: 'c1' }]);
    await expect(svc.getFactTasks(query())).resolves.toEqual([[{ nTaskid: 't1' }], [], []]);
  });
});
