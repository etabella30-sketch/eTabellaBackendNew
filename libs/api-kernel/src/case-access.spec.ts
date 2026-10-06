import { Caller } from './caller';
import { CASE_ACCESS, CaseAccess } from './case-access';
import { DomainError } from './errors';

const ME = '11111111-1111-4111-8111-111111111111';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';

/** The shape every host adapter (PgCaseAccess, EdgeCaseAccess) must satisfy: a list-scoped caller as the box sees it. */
class ListCaseAccess implements CaseAccess {
  async assertMember(caller: Caller, nCaseid: string): Promise<void> {
    if (caller.caseScope === 'membership' || !caller.caseScope.includes(nCaseid)) {
      throw new DomainError('forbidden', 'This sign-in does not cover this case.');
    }
  }
}

describe('CaseAccess port', () => {
  it('pins the token', () => {
    expect(CASE_ACCESS).toBe('ET_CASE_ACCESS');
  });

  it('an adapter resolves for a member and throws forbidden otherwise', async () => {
    const access: CaseAccess = new ListCaseAccess();
    const edge: Caller = { userId: ME, family: 'edge-online', isPlatformAdmin: false, caseScope: [CASE] };
    await expect(access.assertMember(edge, CASE)).resolves.toBeUndefined();
    await expect(access.assertMember(edge, 'ca5e0000-0000-4000-8000-0000000000c2')).rejects.toMatchObject({ code: 'forbidden' });
  });
});
