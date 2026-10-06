/**
 * Runs the team-scope contract against the library's own helpers over an in-memory RowQuery, which answers the two
 * SQL texts from a TeamRelation table the way Postgres would. It proves the contract template and the helpers agree
 * before any host runs the template against a real lister.
 */
import type { RowQuery } from '@app/api-kernel';
import { isUuidText } from './case-membership';
import {
  assertSameTeamRecipients,
  CALLER_TEAMS_SQL,
  callerTeamsOf,
  keepSameTeamRows,
  OUTSIDE_CALLER_TEAMS_SQL,
} from './team-scope';
import { buildTeamScopeFixture, describeTeamScopeContract, TEAM_SCOPE_IDS, type TeamScopeFixture, type TeamScopeMember } from './team-scope.contract';

/** A TeamRelation table of one case, answering CALLER_TEAMS_SQL and OUTSIDE_CALLER_TEAMS_SQL by their exact text. */
class MemoryTeamRelation implements RowQuery {
  readonly calls: Array<{ sql: string; params: readonly unknown[] }> = [];

  constructor(private readonly nCaseid: string, private readonly members: readonly TeamScopeMember[]) { }

  async rows<R = Record<string, unknown>>(sql: string, params: readonly unknown[]): Promise<readonly R[]> {
    this.calls.push({ sql, params });
    if (sql === CALLER_TEAMS_SQL) {
      const [nCaseid, nUserid] = params as [string, string];
      return this.teamsOf(nCaseid, nUserid).map((nTeamid) => ({ nTeamid })) as unknown as R[];
    }
    if (sql === OUTSIDE_CALLER_TEAMS_SQL) {
      const [nCaseid, callerId, ids] = params as [string, string, readonly string[]];
      // Postgres would refuse a non-uuid element of $3; the helper must have filtered them out.
      for (const id of ids) if (!isUuidText(id)) throw new Error(`invalid input syntax for type uuid: "${id}"`);
      const callerTeams = new Set(this.teamsOf(nCaseid, callerId));
      const outside = [...new Set(ids)].filter((id) => !this.teamsOf(nCaseid, id).some((t) => callerTeams.has(t)));
      return outside.map((nUserid) => ({ nUserid })) as unknown as R[];
    }
    throw new Error(`unexpected sql: ${sql}`);
  }

  private teamsOf(nCaseid: string, nUserid: string): string[] {
    if (nCaseid !== this.nCaseid) return [];
    return this.members.filter((m) => m.nUserid === nUserid).map((m) => m.nTeamid);
  }
}

interface TeamUserRow extends TeamScopeMember {
  readonly cFname: string;
}

describe('team-scope.contract fixture', () => {
  const fx = buildTeamScopeFixture();

  it('has two teams on one case, a member each with a role, a role-less member of team A, and a user off the case', () => {
    expect(fx.alice.nTeamid).toBe(fx.teamA);
    expect(fx.carol.nTeamid).toBe(fx.teamA);
    expect(fx.bob.nTeamid).toBe(fx.teamB);
    expect(fx.teamA).not.toBe(fx.teamB);
    expect(fx.alice.nRoleid).not.toBeNull();
    expect(fx.bob.nRoleid).not.toBeNull();
    expect(fx.carol.nRoleid).toBeNull();
    expect(fx.members.map((m) => m.nUserid)).not.toContain(fx.dave);
    expect(fx.members).toHaveLength(3);
  });

  it('uses distinct lower-case uuids so every host uuid check accepts them', () => {
    const ids = Object.values(TEAM_SCOPE_IDS);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(isUuidText(id)).toBe(true);
      expect(id).toBe(id.toLowerCase());
    }
  });
});

describeTeamScopeContract<TeamUserRow>({
  name: 'keepSameTeamRows + assertSameTeamRecipients over an in-memory TeamRelation',
  fixture: () => buildTeamScopeFixture(),
  list: async (fx: TeamScopeFixture, callerId: string) => {
    const db = new MemoryTeamRelation(fx.nCaseid, fx.members);
    const everyone: TeamUserRow[] = fx.members.map((m) => ({ ...m, cFname: m.nUserid.slice(0, 8) }));
    return keepSameTeamRows(await callerTeamsOf(db, fx.nCaseid, callerId), everyone, callerId);
  },
  share: (fx: TeamScopeFixture, callerId: string, recipientIds: readonly string[]) =>
    assertSameTeamRecipients(new MemoryTeamRelation(fx.nCaseid, fx.members), fx.nCaseid, callerId, recipientIds),
});
