import { Logger } from '@nestjs/common';
import { DomainError, SpExecutor, SpOutcome } from '@app/api-kernel';
import {
  assertCanEditFact,
  assertCanViewFact,
  callerCanViewFact,
  FACT_ACCESS_CHECK_FAILED,
  FACT_NOT_EDITABLE,
  FACT_NOT_FOUND,
  FACT_NOT_VIEWABLE,
  FACT_PERMISSIONS_SP,
  readFactPermission,
} from './fact-visibility';

/*
 * The fact visibility rule as realtime-server's fact-view-gate applied it: one SP call with the verified caller,
 * a fault is 'unavailable' (never a refusal), an unknown fact 'not_found', a flag not set 'forbidden' or false.
 */

const ME = '11111111-1111-4111-8111-111111111111';
const FACT = '55555555-5555-4555-8555-555555555555';

function executor(outcome: SpOutcome<unknown>): { sp: SpExecutor; call: jest.Mock } {
  const call = jest.fn(async () => outcome);
  return { sp: { call } as unknown as SpExecutor, call };
}
const row = (flags: Record<string, unknown>): SpOutcome<unknown> => ({ ok: true, cursors: [[{ nFSid: FACT, nUserid: ME, ...flags }]] });
const code = async (p: Promise<unknown>): Promise<string> => p.then(() => 'resolved', (e: DomainError) => `${e.code}:${e.message}`);

describe('permissions fact-visibility', () => {
  beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('asks public.et_fact_permissions with the caller as nUserid, no schema (the call fact-view-gate made)', async () => {
    const { sp, call } = executor(row({ bCanView: true }));
    await expect(readFactPermission(sp, ME, FACT)).resolves.toEqual({ nFSid: FACT, nUserid: ME, bCanView: true });
    expect(call).toHaveBeenCalledWith(FACT_PERMISSIONS_SP, { nUserid: ME, nFSid: FACT });
    expect(call.mock.calls[0]).toHaveLength(2);
  });

  it('a failed lookup is unavailable (a fault, not a refusal); an unknown fact (or no id) is not_found', async () => {
    expect(await code(readFactPermission(executor({ ok: false, error: 'db down' }).sp, ME, FACT))).toBe(`unavailable:${FACT_ACCESS_CHECK_FAILED}`);
    expect(await code(readFactPermission(executor({ ok: true, cursors: [[]] }).sp, ME, FACT))).toBe(`not_found:${FACT_NOT_FOUND}`);
    expect(await code(readFactPermission(executor({ ok: true, cursors: [] }).sp, ME, null))).toBe(`not_found:${FACT_NOT_FOUND}`);
    expect(Logger.prototype.error).toHaveBeenCalledWith(`fact_permissions lookup failed for ${FACT}: db down`);
  });

  it.each([false, null, undefined])('callerCanViewFact: an existing fact with bCanView %p is not viewable, true is', async (bCanView) => {
    await expect(callerCanViewFact(executor(row({ bCanView })).sp, ME, FACT)).resolves.toBe(false);
    await expect(callerCanViewFact(executor(row({ bCanView: true })).sp, ME, FACT)).resolves.toBe(true);
  });

  it('the assert gates refuse with forbidden and the legacy messages, and pass when the flag is set', async () => {
    expect(await code(assertCanViewFact(executor(row({ bCanView: false })).sp, ME, FACT))).toBe(`forbidden:${FACT_NOT_VIEWABLE}`);
    expect(await code(assertCanViewFact(executor(row({ bCanView: true })).sp, ME, FACT))).toBe('resolved');
    expect(await code(assertCanEditFact(executor(row({ bCanView: true, bCanEdit: false })).sp, ME, FACT))).toBe(`forbidden:${FACT_NOT_EDITABLE}`);
    expect(await code(assertCanEditFact(executor(row({ bCanEdit: true })).sp, ME, FACT))).toBe('resolved');
    // A fault or an unknown fact reaches the assert gates unchanged.
    expect(await code(assertCanEditFact(executor({ ok: false, error: 'x' }).sp, ME, FACT))).toBe(`unavailable:${FACT_ACCESS_CHECK_FAILED}`);
    expect(await code(assertCanViewFact(executor({ ok: true, cursors: [[]] }).sp, ME, FACT))).toBe(`not_found:${FACT_NOT_FOUND}`);
  });
});
