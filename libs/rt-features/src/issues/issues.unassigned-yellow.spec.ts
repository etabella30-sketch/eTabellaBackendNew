import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { RowQuery } from '@app/api-kernel';
import { RESERVED_UNASSIGNED_COLOR_MESSAGE } from '@app/api-kernel';
import { CLAIM_STORED_COLOR_SQL, ISSUE_STORED_COLOR_SQL, ISSUES_SP, IssuesService } from './issues.service';
import { ClaimUpdateBody, IssueBody, IssueCategoryBody } from './dto/issues.dto';
import { CALLER, CLAIM_UPDATE_BODY, happyScript, ISSUE_BODY, scriptedExecutor } from './testing/conformance';

/**
 * The yellow kept for Unassigned (user 2026-11-06), on the server: a new issue / claim in it is refused (400 on the
 * body); an update may not change a colour INTO it, but an issue or claim that already had such a colour keeps it
 * (the user chose to keep them, the app flags them); the Unassigned record itself may be FFFF00.
 */
const ID = '550e8400-e29b-41d4-a716-446655440000';
const CASE_ID = '660e8400-e29b-41d4-a716-446655440000';
const messages = (cls: new () => object, body: object) =>
  validateSync(plainToInstance(cls, body)).flatMap(e => Object.values(e.constraints ?? {}));

function build(stored: string | null | 'none' | 'throws') {
  const { sp, calls } = scriptedExecutor(happyScript());
  const reads: string[] = [];
  const rows: RowQuery = { async rows<R>(sql: string) {
    reads.push(sql);
    if (stored === 'throws') throw new Error('db down');
    return (stored === 'none' ? [] : [{ cColor: stored }]) as unknown as R[];
  } };
  return { svc: new IssuesService(sp, rows), calls, reads };
}

describe('the yellow kept for Unassigned — server', () => {
  it('a new issue or claim in the yellow is refused on the body; Unassigned itself and other colours pass', () => {
    expect(messages(IssueBody, { cIName: 'Delay', cColor: 'FFFF00', nICid: ID, nCaseid: CASE_ID })).toContain(RESERVED_UNASSIGNED_COLOR_MESSAGE);
    expect(messages(IssueCategoryBody, { cCategory: 'Quantum', cColor: 'fcff64', nCaseid: CASE_ID })).toContain(RESERVED_UNASSIGNED_COLOR_MESSAGE);
    expect(messages(IssueBody, { cIName: 'Unassigned', cColor: 'FFFF00', nICid: ID, nCaseid: CASE_ID })).not.toContain(RESERVED_UNASSIGNED_COLOR_MESSAGE);
    expect(messages(IssueBody, { cIName: 'Delay', cColor: '2a6fdb', nICid: ID, nCaseid: CASE_ID })).not.toContain(RESERVED_UNASSIGNED_COLOR_MESSAGE);
    // An update body (it names the record) is left to the service, which knows the stored colour.
    expect(messages(IssueBody, { nIid: ID, cIName: 'battery', cColor: 'fcff64', nICid: ID, nCaseid: CASE_ID })).not.toContain(RESERVED_UNASSIGNED_COLOR_MESSAGE);
    expect(messages(ClaimUpdateBody, { nICid: ID, cCategory: 'Quantum', cColor: 'fcff64' })).not.toContain(RESERVED_UNASSIGNED_COLOR_MESSAGE);
  });

  it('renaming an issue that already has a pale yellow keeps working (its colour does not change)', async () => {
    const { svc, calls, reads } = build('FCFF64');
    await svc.update(CALLER, { ...ISSUE_BODY, nIid: ID, cIName: 'battery renamed', cColor: 'fcff64' });
    expect(reads).toEqual([ISSUE_STORED_COLOR_SQL]);
    expect(calls.map(c => c.name)).toContain(ISSUES_SP.issue);
  });

  it('changing an issue or claim INTO the yellow is refused with the app\'s words and nothing is written', async () => {
    const issue = build('2A6FDB');
    expect(await issue.svc.update(CALLER, { ...ISSUE_BODY, nIid: ID, cIName: 'Delay', cColor: 'FFFF00' }))
      .toMatchObject({ msg: -1, value: RESERVED_UNASSIGNED_COLOR_MESSAGE });
    expect(issue.calls).toEqual([]);
    const claim = build('C83A3A');
    expect(await claim.svc.updateClaim(CALLER, { ...CLAIM_UPDATE_BODY, nICid: ID, cCategory: 'Quantum', cColor: 'fdff6e' }))
      .toMatchObject({ msg: -1, value: RESERVED_UNASSIGNED_COLOR_MESSAGE });
    expect(claim.reads).toEqual([CLAIM_STORED_COLOR_SQL]);
    expect(claim.calls).toEqual([]);
  });

  it('a colour outside the band costs no read; a failed read or a missing row does not block an edit', async () => {
    const plain = build('throws');
    await plain.svc.update(CALLER, { ...ISSUE_BODY, nIid: ID, cColor: '2a6fdb' });
    expect(plain.reads).toEqual([]);
    for (const stored of ['throws', 'none'] as const) {
      const { svc, calls } = build(stored);
      await svc.update(CALLER, { ...ISSUE_BODY, nIid: ID, cIName: 'Delay', cColor: 'FFFF00' });
      expect(calls.map(c => c.name)).toContain(ISSUES_SP.issue);
    }
  });
});
