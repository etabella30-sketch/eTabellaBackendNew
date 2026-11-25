import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SHARED_VALIDATION } from '@app/api-kernel';
import { ISSUES_SP, IssuesService } from './issues.service';
import { QFactSequenceBody } from './dto/issues.dto';
import { CALLER, happyScript, scriptedExecutor } from './testing/conformance';

/**
 * The minimised Pre-selected Issues card's own order (user 2026-11-06): each `jIssues` row of POST issue/qfact/sequence
 * may carry `nPinSequence` (RUserQFactPref."nQFactPinSequence"). Omitted = the stored value is kept (Manage's Save);
 * null = cleared; otherwise a whole number >= 0. Validated with the routes' own SHARED_VALIDATION (whitelist +
 * forbidNonWhitelisted), so an unknown key is still refused.
 */
const ISSUE = '550e8400-e29b-41d4-a716-446655440000';
const CASE_ID = '660e8400-e29b-41d4-a716-446655440000';
const errorsOf = (row: Record<string, unknown>) =>
  validateSync(plainToInstance(QFactSequenceBody, { nCaseid: CASE_ID, jIssues: [{ nIid: ISSUE, nQFactSequence: 0, bVisible: true, ...row }] }),
    { whitelist: SHARED_VALIDATION.whitelist, forbidNonWhitelisted: SHARED_VALIDATION.forbidNonWhitelisted });

describe('issue/qfact/sequence: nPinSequence (quick-list order)', () => {
  it('accepts a whole number, null, or no key at all', () => {
    expect(errorsOf({ nPinSequence: 0 })).toEqual([]);
    expect(errorsOf({ nPinSequence: 7 })).toEqual([]);
    expect(errorsOf({ nPinSequence: null })).toEqual([]);
    expect(errorsOf({})).toEqual([]);
  });

  it('refuses a negative, fractional or string position', () => {
    expect(errorsOf({ nPinSequence: -1 }).length).toBeGreaterThan(0);
    expect(errorsOf({ nPinSequence: 1.5 }).length).toBeGreaterThan(0);
    expect(errorsOf({ nPinSequence: '3' }).length).toBeGreaterThan(0);
  });

  it('still refuses an unknown key on a row', () => {
    expect(errorsOf({ nOther: 1 }).length).toBeGreaterThan(0);
  });

  it('reaches the SP untouched, for the CALLER only (a forged nUserid is replaced)', async () => {
    const { sp, calls } = scriptedExecutor(happyScript());
    const svc = new IssuesService(sp, { rows: async () => [] } as never);
    const jIssues = [{ nIid: ISSUE, nQFactSequence: 0, bVisible: true, nPinSequence: 2 }, { nIid: CASE_ID, nQFactSequence: 1, bVisible: false, nPinSequence: null }];
    await svc.qfactSequence(CALLER, { nCaseid: CASE_ID, jIssues, nUserid: 'forged-by-client' });
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe(ISSUES_SP.qfactSequence);
    expect(calls[0].params.jIssues).toEqual(jIssues);
    expect(calls[0].params.nUserid).toBe(CALLER.userId);
  });
});
