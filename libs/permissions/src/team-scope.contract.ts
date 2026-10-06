/**
 * The team-scope contract, as a reusable spec (shared-libraries plan §3.6, gate G4). Every slice that lists users or
 * writes to recipients runs it against its own lister and writer on every host, so the one rule in team-scope.ts
 * cannot be bypassed by a feature-local shortcut. The fixture is fixed on purpose: two teams on one case, one member
 * each with a role, plus a member of team A who has no role (the role-less case of plan §6.2, which used to vanish
 * from every list).
 *
 * This is a test template, not library code: it is reached as '@app/permissions/team-scope.contract' and is kept out
 * of index.ts so no app bundle carries jest globals. Still R2: it imports only @app/api-kernel and a sibling.
 */
import { DomainError } from '@app/api-kernel';

/** One TeamRelation row of the fixture case. */
export interface TeamScopeMember {
  readonly nUserid: string;
  readonly nTeamid: string;
  /** null = a member without a role on the case; they still belong to their team. */
  readonly nRoleid: string | null;
}

/** Two teams on one case: alice and carol (role-less) on team A, bob on team B; dave is a user not on the case. */
export interface TeamScopeFixture {
  readonly nCaseid: string;
  readonly teamA: string;
  readonly teamB: string;
  readonly alice: TeamScopeMember;
  readonly bob: TeamScopeMember;
  readonly carol: TeamScopeMember;
  /** A real user id with no TeamRelation row on the case. */
  readonly dave: string;
  /** Every TeamRelation row of the case, for in-memory fakes and seeders alike. */
  readonly members: readonly TeamScopeMember[];
}

/** Version-4-shaped, lower-case, and distinct, so a host's uuid checks and Postgres both accept them. */
export const TEAM_SCOPE_IDS = {
  nCaseid: 'f54bdcb9-0000-4000-8000-00000000c0de',
  teamA: 'aaaaaaaa-0000-4000-8000-00000000000a',
  teamB: 'bbbbbbbb-0000-4000-8000-00000000000b',
  alice: '11111111-0000-4000-8000-000000000001',
  bob: '22222222-0000-4000-8000-000000000002',
  carol: '33333333-0000-4000-8000-000000000003',
  dave: '44444444-0000-4000-8000-000000000004',
  role: '55555555-0000-4000-8000-000000000005',
} as const;

/** The default fixture; a host that seeds a database can pass its own ids through `ids`. */
export function buildTeamScopeFixture(ids: typeof TEAM_SCOPE_IDS = TEAM_SCOPE_IDS): TeamScopeFixture {
  const alice: TeamScopeMember = { nUserid: ids.alice, nTeamid: ids.teamA, nRoleid: ids.role };
  const bob: TeamScopeMember = { nUserid: ids.bob, nTeamid: ids.teamB, nRoleid: ids.role };
  const carol: TeamScopeMember = { nUserid: ids.carol, nTeamid: ids.teamA, nRoleid: null };
  return { nCaseid: ids.nCaseid, teamA: ids.teamA, teamB: ids.teamB, alice, bob, carol, dave: ids.dave, members: [alice, bob, carol] };
}

export interface TeamScopeContractOptions<Row extends { nUserid: string }> {
  /** Names the describe block, e.g. 'TeamUsersService (live)' or 'TeamUsersRelay (box)'. */
  readonly name: string;
  /** Builds (or seeds) the fixture; runs once per describe block. */
  readonly fixture: () => TeamScopeFixture | Promise<TeamScopeFixture>;
  /** The slice's user list as `callerId` sees it on the fixture case. */
  readonly list: (fx: TeamScopeFixture, callerId: string) => Promise<readonly Row[]>;
  /** The slice's recipient check: resolves when every recipient is allowed, throws the shared refusal otherwise. */
  readonly share: (fx: TeamScopeFixture, callerId: string, recipientIds: readonly string[]) => Promise<void>;
}

const userIds = (rows: readonly { nUserid: string }[]): string[] => rows.map((r) => r.nUserid.toLowerCase()).sort();

/** The shared refusal, and nothing of the recipients in it: a refusal must not tell who is on the case. */
async function expectCrossTeamRefusal(run: () => Promise<void>, hiddenIds: readonly string[]): Promise<void> {
  let caught: unknown = null;
  try {
    await run();
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(DomainError);
  const err = caught as DomainError;
  expect(err.code).toBe('forbidden');
  expect(err.message).toBe('cross_team_recipient');
  const echoed = `${err.message} ${JSON.stringify(err.detail ?? {})}`.toLowerCase();
  for (const id of hiddenIds) expect(echoed).not.toContain(id.toLowerCase());
  expect(Object.keys(err.detail ?? {})).toEqual(['count']);
}

/** Registers the describe/it blocks of the contract; call it from a *.spec.ts on each host. */
export function describeTeamScopeContract<Row extends { nUserid: string }>(opts: TeamScopeContractOptions<Row>): void {
  describe(`team scope contract: ${opts.name}`, () => {
    let fx: TeamScopeFixture;

    beforeAll(async () => {
      fx = await opts.fixture();
    });

    it('a member sees their own team only: alice gets alice and role-less carol, never bob', async () => {
      expect(userIds(await opts.list(fx, fx.alice.nUserid))).toEqual(userIds([fx.alice, fx.carol]));
    });

    it('the other team is just as closed: bob sees only bob', async () => {
      expect(userIds(await opts.list(fx, fx.bob.nUserid))).toEqual(userIds([fx.bob]));
    });

    it('a member without a role still sees their team: carol gets alice and carol', async () => {
      expect(userIds(await opts.list(fx, fx.carol.nUserid))).toEqual(userIds([fx.alice, fx.carol]));
    });

    it('a user off the case sees nobody', async () => {
      expect(await opts.list(fx, fx.dave)).toEqual([]);
    });

    it('sharing inside the team is allowed, role or not', async () => {
      await expect(opts.share(fx, fx.alice.nUserid, [fx.carol.nUserid])).resolves.toBeUndefined();
      await expect(opts.share(fx, fx.carol.nUserid, [fx.alice.nUserid])).resolves.toBeUndefined();
    });

    it('an empty recipient list is not a cross-team share', async () => {
      await expect(opts.share(fx, fx.alice.nUserid, [])).resolves.toBeUndefined();
    });

    it('a recipient on another team is refused as cross_team_recipient without echoing the ids', async () => {
      await expectCrossTeamRefusal(() => opts.share(fx, fx.alice.nUserid, [fx.bob.nUserid]), [fx.bob.nUserid]);
    });

    it('one cross-team recipient refuses the whole share, same-team ones included', async () => {
      await expectCrossTeamRefusal(
        () => opts.share(fx, fx.alice.nUserid, [fx.carol.nUserid, fx.bob.nUserid]),
        [fx.carol.nUserid, fx.bob.nUserid],
      );
    });

    it('a recipient who is not on the case at all is refused the same way', async () => {
      await expectCrossTeamRefusal(() => opts.share(fx, fx.alice.nUserid, [fx.dave]), [fx.dave]);
    });

    it('a caller who is not on the case may share with nobody', async () => {
      await expectCrossTeamRefusal(() => opts.share(fx, fx.dave, [fx.alice.nUserid]), [fx.alice.nUserid]);
    });
  });
}
