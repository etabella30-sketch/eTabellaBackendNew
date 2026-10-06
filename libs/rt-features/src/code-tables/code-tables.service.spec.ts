import { Caller, SpExecutor, SpOutcome } from '@app/api-kernel';

import { CODE_TABLE_FAILED, CODE_TABLE_SP, CodeTableService } from './code-tables.service';
import { CODE_ROWS, CONFORMANCE_CATEGORY, expectConformantCodes } from './testing/conformance';

/*
 * The live executor against a fake of the SP port: the one call it makes (the category only, on public; nothing of
 * the caller or the request's identity fields), the rows answered as listed, and the one DomainError every failure
 * becomes (a failed call, a missing cursor), which the hosts' legacy shapes render as the `Failed to fetch` row.
 */

const caller: Caller = { userId: '11111111-1111-4111-8111-111111111111', family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' };

function world(outcome: SpOutcome<unknown>) {
  const calls: unknown[][] = [];
  const sp: SpExecutor = { call: async (...args) => { calls.push(args); return outcome as unknown as SpOutcome<never>; } };
  return { service: new CodeTableService(sp), calls };
}

describe('CodeTableService (the live executor)', () => {
  it('calls public.et_combo_codemaster with the category only, never the request\'s ids, and answers the rows as listed', async () => {
    const w = world({ ok: true, cursors: [CODE_ROWS] });
    const answer = await w.service.list(caller, { nCategoryid: CONFORMANCE_CATEGORY, nMasterid: 'forged', nUserid: 'forged' });
    expect(w.calls).toEqual([[CODE_TABLE_SP, { nCategoryid: CONFORMANCE_CATEGORY }, 'public']]);
    expectConformantCodes(answer);
  });

  it('an empty table answers []', async () => {
    expect(await world({ ok: true, cursors: [[]] }).service.list(caller, { nCategoryid: 99 })).toEqual([]);
  });

  it('a failed call is upstream with what the SP said; a missing cursor too', async () => {
    await expect(world({ ok: false, error: 'db said no' }).service.list(caller, { nCategoryid: 4 }))
      .rejects.toMatchObject({ code: 'upstream', message: CODE_TABLE_FAILED, detail: { error: 'db said no' } });
    await expect(world({ ok: true, cursors: [] }).service.list(caller, { nCategoryid: 4 }))
      .rejects.toMatchObject({ code: 'upstream', detail: { error: 'no_cursor' } });
  });
});
