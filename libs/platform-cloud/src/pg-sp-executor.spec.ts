import { Logger } from '@nestjs/common';
import { errorText, PgSpExecutor, SP_CALL_FAILED, SP_UNKNOWN_ERROR } from './pg-sp-executor';

const ROWS = [{ nUserid: '11111111-1111-4111-8111-111111111111', cFname: 'Me' }];

describe('PgSpExecutor', () => {
  let executeRef: jest.Mock;
  let executor: PgSpExecutor;
  let logError: jest.SpyInstance;

  beforeEach(() => {
    executeRef = jest.fn(async () => ({ success: true, data: [ROWS] }));
    executor = new PgSpExecutor({ executeRef });
    logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('maps a successful executeRef answer to ok:true with its cursors', async () => {
    await expect(executor.call('common_my_team_user', { nCaseid: 'c', nMasterid: 'm' }, 'public')).resolves.toEqual({
      ok: true,
      cursors: [ROWS],
    });
    expect(executeRef).toHaveBeenCalledTimes(1);
    expect(executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: 'c', nMasterid: 'm' }, 'public');
  });

  it('forwards the schema only when given, so a schema-less call reaches executeRef as two arguments', async () => {
    await executor.call('issue_list', { nCaseid: 'c' });
    expect(executeRef.mock.calls[0]).toEqual(['issue_list', { nCaseid: 'c' }]);
    expect(executeRef.mock.calls[0]).toHaveLength(2);
  });

  it('copies the params: executeRef deletes `ref` from what it is given, the caller keeps its object intact', async () => {
    executeRef.mockImplementation(async (_fn: string, params: Record<string, unknown>) => {
      expect(params.ref).toBe(2);
      delete params.ref;
      params.nMasterid = 'mutated';
      return { success: true, data: [[], []] };
    });
    const params = Object.freeze({ nCaseid: 'c', nMasterid: 'm', ref: 2 });
    await expect(executor.call('two_cursors', params)).resolves.toEqual({ ok: true, cursors: [[], []] });
    expect(params).toEqual({ nCaseid: 'c', nMasterid: 'm', ref: 2 });
    expect(executeRef.mock.calls[0][1]).not.toBe(params);
  });

  it('answers no cursors when a successful answer carries no array', async () => {
    executeRef.mockResolvedValue({ success: true });
    await expect(executor.call('x', {})).resolves.toEqual({ ok: true, cursors: [] });
  });

  it.each([
    ['a message string', 'db said no', 'db said no'],
    ['an Error (what executeRef stores from its own catch)', new Error('relation missing'), 'relation missing'],
    ['an object with a message', { message: 'pool closed', code: 'X' }, 'pool closed'],
    ['nothing at all', undefined, SP_UNKNOWN_ERROR],
    ['an empty string', '', SP_UNKNOWN_ERROR],
  ])('maps a failed answer whose error is %s to ok:false with that text', async (_label, error, text) => {
    executeRef.mockResolvedValue({ success: false, error });
    await expect(executor.call('x', {})).resolves.toEqual({ ok: false, error: text });
    expect(logError).not.toHaveBeenCalled();
  });

  it('treats an answer without success:true as a failure, never as empty cursors', async () => {
    executeRef.mockResolvedValue(undefined);
    await expect(executor.call('x', {})).resolves.toEqual({ ok: false, error: SP_UNKNOWN_ERROR });
    executeRef.mockResolvedValue({ success: 'yes', data: [[]] });
    await expect(executor.call('x', {})).resolves.toEqual({ ok: false, error: SP_UNKNOWN_ERROR });
  });

  it('never throws: a throwing executeRef becomes ok:false with a fixed message and the real error logged', async () => {
    executeRef.mockRejectedValue(new Error('private database diagnostic'));
    const outcome = await executor.call('fact_insert', { nCaseid: 'c' }, 'realtime');
    expect(outcome).toEqual({ ok: false, error: SP_CALL_FAILED });
    expect(JSON.stringify(outcome)).not.toContain('private database diagnostic');
    expect(logError).toHaveBeenCalledTimes(1);
    expect(String(logError.mock.calls[0][0])).toContain('realtime.et_fact_insert');
    expect(String(logError.mock.calls[0][0])).toContain('private database diagnostic');
  });

  it('errorText reads every shape the host uses', () => {
    expect(errorText('x')).toBe('x');
    expect(errorText(new Error('e'))).toBe('e');
    expect(errorText({ message: 'm' })).toBe('m');
    expect(errorText(null)).toBe(SP_UNKNOWN_ERROR);
    expect(errorText(42)).toBe('42');
  });
});
