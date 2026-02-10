import { Injectable, Inject } from '@nestjs/common';
import { OpenFgaService } from '../open-fga/open-fga.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';

type Consistency = 'fully-consistent' | 'fully-consistent' | 'best-effort';

interface PermissionCacheEntry {
  issueId: string;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

@Injectable()
export class IssueFgaService {
  // Env controls:
  // - FGA_CACHE_TTL_SECONDS: TTL for per-user issue permissions cache (seconds)
  // - FGA_ISSUE_IN_FACT_TTL_SECONDS: TTL for cached set of issue IDs that are in any fact (seconds)
  // - FGA_DEFAULT_CONSISTENCY: 'fully-consistent' | 'fully-consistent' | 'best-effort' (used when a method doesn't override)
  private readonly CACHE_TTL = parseInt(process.env.FGA_CACHE_TTL_SECONDS ?? '3000', 10); // seconds (default 300)
  private readonly BATCH_SIZE = 100; // Process issues in batches

  constructor(
    private readonly openFgaService: OpenFgaService,
    @Inject(RedisDbService) private readonly redisDb: RedisDbService,
  ) {}

  // Helper: JSON get/set/del via RedisDbService with logging-friendly null handling
  private async redisGetJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redisDb.getValue(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async redisSetJSON(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.redisDb.setValue(key, JSON.stringify(value), ttlSeconds);
  }

  private async redisDel(key: string): Promise<void> {
    await this.redisDb.deleteValue(key);
  }

  /**
   * Batch check if multiple issues are in any fact
   * Much more efficient than individual checks
   */
  async batchCheckIssuesInFact(issueIds: string[]): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    
    // Initialize all as false
    issueIds.forEach(id => result.set(id, false));
    
    if (issueIds.length === 0) return result;

    try {
      // Get all in_fact tuples in one query
      const allFactTuples = await this.openFgaService.readAllTuples({
        relation: 'in_fact',
      });

      // Create a Set for O(1) lookup
      const issuesInFacts = new Set<string>();
      allFactTuples.forEach(tuple => {
        if (tuple.object.startsWith('issue:')) {
          const issueId = tuple.object.replace('issue:', '');
          issuesInFacts.add(issueId);
        }
      });

      // Update result map
      issueIds.forEach(id => {
        result.set(id, issuesInFacts.has(id));
      });
    } catch (error) {
      console.error('Error batch checking issues in facts:', error);
      // On error, fall back to conservative approach (all false)
    }

    return result;
  }

  /**
   * Build and cache the set of issueIds that are in any fact.
   * Cached for a short TTL to avoid repeated heavy scans.
   */
  private async getInFactIssueSet(): Promise<Set<string>> {
    try {
      const cacheKey = 'in_fact_issue_ids';
      const cached = await this.redisGetJSON<string[]>(cacheKey);
      if (cached && cached.length) {
        return new Set(cached);
      }

      const tuples = await this.openFgaService.readAllTuples({
        relation: 'in_fact',
        pageSize: 1000,
      });

      const set = new Set<string>();
      tuples.forEach((t) => {
        if (t.object.startsWith('issue:')) {
          set.add(t.object.replace('issue:', ''));
        }
      });

      await this.redisSetJSON(cacheKey, Array.from(set), parseInt(process.env.FGA_ISSUE_IN_FACT_TTL_SECONDS ?? '60', 10));
      return set;
    } catch (e) {
      console.error('Error building in_fact issue set:', e);
      return new Set<string>();
    }
  }

  /**
   * Single issue check - kept for backward compatibility
   */
  async isIssueInAnyFact(issueId: string): Promise<boolean> {
    const tuples = await this.openFgaService.readTuples({
      relation: 'in_fact',
      object: `issue:${issueId}`,
    });
    return tuples.length > 0;
  }

  /**
   * Get issue permissions for a specific user with caching and batch optimization
   */
  async getIssuePermissionsJson(
    userId: string,
    consistency: Consistency = 'fully-consistent',
    issueIds?: string[],
  ): Promise<Array<PermissionCacheEntry>> {
    // Resolve effective consistency: param > env FGA_DEFAULT_CONSISTENCY > fully-consistent
    const envConsistency = (process.env.FGA_DEFAULT_CONSISTENCY || '').trim() as any;
    const defaultConsistency: Consistency =
      envConsistency === 'fully-consistent' || envConsistency === 'fully-consistent' || envConsistency === 'best-effort'
        ? envConsistency
        : 'fully-consistent';
    const effectiveConsistency = (consistency ?? defaultConsistency) as Consistency;

    // Base path with caching (Redis, shared across processes)
    const cacheKey = `issue_perms:${userId}:${effectiveConsistency}`;
    const cached = await this.redisGetJSON<PermissionCacheEntry[]>(cacheKey);
    if (cached) {
      const pid = process.pid;
      console.log(`[base] pid=${pid} key=${cacheKey} hit len=${cached.length}`);
      return cached;
    }
    {
      const pid = process.pid;
      console.log(`[base] pid=${pid} key=${cacheKey} miss`);
    }

    // Fetch base permission id arrays (cached separately)
    const { viewIds, editIds, deleteIds } = await this.getBasePermissionIds(userId, effectiveConsistency);

    const viewSet = new Set(viewIds);
    const editSet = new Set(editIds);
    const deleteSet = new Set(deleteIds);

    // Logical closure: if user can edit/delete, they can view
    for (const id of editSet) viewSet.add(id);
    for (const id of deleteSet) viewSet.add(id);

    const resultIds = Array.from(new Set<string>([...viewSet, ...editSet, ...deleteSet]));

    const result = resultIds.map((id) => ({
      issueId: id,
      view: viewSet.has(id),
      edit: editSet.has(id),
      delete: deleteSet.has(id),
    }));

    // Cache assembled permissions
    await this.redisSetJSON(cacheKey, result, this.CACHE_TTL);
    {
      const pid = process.pid;
      console.log(`[base] pid=${pid} key=${cacheKey} set ttl=${this.CACHE_TTL} len=${result.length}`);
    }

    return result;
  }

  // Targeted check for whether given issue IDs are in any fact, with small per-issue cache
  private async getInFactIssueSetFor(issueIds: string[]): Promise<Set<string>> {
    const out = new Set<string>();
    if (!issueIds?.length) return out;

    const ttlSeconds = parseInt(process.env.FGA_ISSUE_IN_FACT_TTL_SECONDS ?? '60', 10);
    const CONCURRENCY = 10;

    const checkOne = async (issueId: string): Promise<void> => {
      const cacheKey = `issue_in_fact:${issueId}`;
      const cached = await this.redisGetJSON<boolean>(cacheKey);
      if (typeof cached === 'boolean') {
        if (cached) out.add(issueId);
        return;
      }

      let inFact = false;
      try {
        const tuples = await this.openFgaService.readTuples({
          relation: 'in_fact',
          object: `issue:${issueId}`,
        });
        inFact = (tuples?.length ?? 0) > 0;
      } catch (err) {
        // On error, assume not in fact to avoid over-restricting
        inFact = false;
        console.error('in_fact check error for issue', issueId, err);
      }

      if (inFact) out.add(issueId);
      await this.redisSetJSON(`issue_in_fact:${issueId}`, inFact, ttlSeconds);
    };

    // Concurrency limiter
    const queue = [...new Set(issueIds)];
    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
      workers.push((async () => {
        while (queue.length) {
          const id = queue.shift()!;
          await checkOne(id);
        }
      })());
    }
    await Promise.all(workers);

    return out;
  }

  /**
   * Single issue check - kept for backward compatibility
   */
  async invalidateUserCache(userId: string): Promise<void> {
    // delete per-user assembled caches across consistencies
    const permKeys = [
      `issue_perms:${userId}:fully-consistent`,
      `issue_perms:${userId}:fully-consistent`,
      `issue_perms:${userId}:best-effort`,
    ];
    for (const k of permKeys) {
      await this.redisDel(k);
    }

    // delete base-sets caches across consistencies as well
    const baseKeys = [
      `issue_base_sets:${userId}:fully-consistent`,
      `issue_base_sets:${userId}:fully-consistent`,
      `issue_base_sets:${userId}:best-effort`,
    ];
    for (const k of baseKeys) {
      await this.redisDel(k);
    }

    const pid = process.pid;
    console.log(`[invalidate] pid=${pid} user=${userId} cleared ${permKeys.length + baseKeys.length} keys`);
  }

  // Invalidate caches related to "issue in fact" membership
  async invalidateIssuesInFactCaches(issueIds: string[]): Promise<void> {
    try {
      // Clear the global snapshot cache
      await this.redisDel('in_fact_issue_ids');
      // Clear per-issue membership caches
      const unique = Array.from(new Set(issueIds || []));
      await Promise.all(unique.map((id) => this.redisDel(`issue_in_fact:${id}`)));
      const pid = process.pid;
      console.log(`[invalidate-in_fact] pid=${pid} cleared ${unique.length} per-issue keys + snapshot`);
    } catch (e) {
      console.error('invalidateIssuesInFactCaches error', e);
    }
  }

  // Invalidate all impacted users' assembled/base caches for a given issue
  async invalidateUserCachesForIssue(issueId: string): Promise<void> {
    try {
      const tuples = await this.openFgaService.readTuples({ object: `issue:${issueId}` });
      const userIds = Array.from(
        new Set(
          (tuples || [])
            .map((t) => t.key.user)
            .map((u) => u.match(/^user:(.+)$/)?.[1])
            .filter(Boolean) as string[],
        ),
      );
      await Promise.all(userIds.map((u) => this.invalidateUserCache(u)));
      const pid = process.pid;
      console.log(`[invalidate-users-for-issue] pid=${pid} issue=${issueId} users=${userIds.length}`);
    } catch (e) {
      console.error('invalidateUserCachesForIssue error', e);
    }
  }

  /*
    async listTeamIssuesUserCanView(
      userId: string,
      teamId: string,
      opts?: { fullyConsistent?: boolean }
    ): Promise<string[]> {
      const ensureSafeId = (s: string) => {
        if (/[:#"\s]/.test(s)) throw new Error(`Invalid id ${s}`);
        return s;
      };
      const consistency = opts?.fullyConsistent ? ('fully-consistent' as const) : undefined;
  
      const [teamIssuesRes, userViewRes] = await Promise.all([
        this.openFgaService.listObjects({
          user: `team:${ensureSafeId(teamId)}`,   // issues linked via in_team
          relation: 'in_team',
          type: 'issue',
          ...(consistency ? { consistency } : {}),
        }),
        this.openFgaService.listObjects({
          user: `user:${ensureSafeId(userId)}`,   // issues this user can view
          relation: 'can_view',
          type: 'issue',
          ...(consistency ? { consistency } : {}),
        }),
      ]);
  
      const extractId = (typed: string) => {
        const m = /^issue:(?:"(.+)"|(.+))$/.exec(typed);
        return m ? (m[1] ?? m[2]) : typed;
      };
  
      const teamIds = new Set((teamIssuesRes.objects ?? []).map(extractId));
      const viewIds = new Set((userViewRes.objects ?? []).map(extractId));
  
      const out: string[] = [];
      for (const id of teamIds) if (viewIds.has(id)) out.push(id);
      return out;
    }*/

  /*  async listIssuesViewableByTeamMembers(teamId: string, opts?: { fullyConsistent?: boolean }): Promise<string[]> {
      const ensureSafeId = (s: string) => {
        if (/[:#"\s]/.test(s)) throw new Error(`Invalid id ${s}`);
        return s;
      };
      const res = await this.openFgaService.listObjects({
        user: `team:${ensureSafeId(teamId)}#member`, // subject is the team’s member set
        relation: 'can_view',
        type: 'issue',
        ...(opts?.fullyConsistent ? { consistency: 'fully-consistent' as const } : {}),
      });
      return (res.objects ?? []).map(o => {
        const m = /^issue:(?:"(.+)"|(.+))$/.exec(o);
        return m ? (m[1] ?? m[2]) : o;
      });
    }*/
  async listIssuesViewableByTeamMembersWithUserPerms(
    teamId: string,
    userId: string,
    opts?: { fullyConsistent?: boolean }
  ): Promise<Array<{ issueId: string; can_edit: boolean; can_delete: boolean }>> {
    const ensureSafeId = (s: string) => {
      if (/[:#"\s]/.test(s)) throw new Error(`Invalid id ${s}`);
      return s;
    };
    const extractIssueId = (o: string) => {
      const m = /^issue:(?:"(.+)"|(.+))$/.exec(o);
      return m ? (m[1] ?? m[2]) : o;
    };
    const consistency = opts?.fullyConsistent ? ('fully-consistent' as const) : undefined;

    // 1) Issues viewable by team members (your existing call)
    const teamViewableRes = await this.openFgaService.listObjects({
      user: `team:${ensureSafeId(teamId)}#member`,
      relation: 'can_view',
      type: 'issue',
      ...(consistency ? { consistency } : {}),
    });
    const teamIssueIds = (teamViewableRes.objects ?? []).map(extractIssueId);
    if (teamIssueIds.length === 0) return [];

    // 2) Issues this user can edit & delete (global to all issues)
    const [canEditRes, canDeleteRes] = await Promise.all([
      this.openFgaService.listObjects({
        user: `user:${ensureSafeId(userId)}`,
        relation: 'can_edit',
        type: 'issue',
        ...(consistency ? { consistency } : {}),
      }),
      this.openFgaService.listObjects({
        user: `user:${ensureSafeId(userId)}`,
        relation: 'can_delete',
        type: 'issue',
        ...(consistency ? { consistency } : {}),
      }),
    ]);

    const canEditSet = new Set((canEditRes.objects ?? []).map(extractIssueId));
    const canDeleteSet = new Set((canDeleteRes.objects ?? []).map(extractIssueId));

    // 3) Annotate only the team-scope issues
    return teamIssueIds.map((issueId) => ({
      issueId,
      can_edit: canEditSet.has(issueId),
      can_delete: canDeleteSet.has(issueId),
    }));
  }
  /**
   * Create permission tuples for a new issue
   */
  async createIssuePermissions(
    issueId: string,
    userId: string,
    caseId: string,
    teamId: string,
  ): Promise<any> {
    const tuples = [
      {
        user: `user:${userId}`,
        relation: 'owner',
        object: `issue:${issueId}`,
      },
      {
        user: `team:${teamId}`,
        relation: 'in_team',
        object: `issue:${issueId}`,
      },
    ];

    const result = await this.openFgaService.writeTuplesSafe(tuples);
    
    // Invalidate cache after permission change
    await this.invalidateUserCache(userId);
    
    return result;
  }

  /**
   * Delete all issue permissions - comprehensive cleanup
   */
  async deleteAllIssuePermissions(issueId: string): Promise<any> {
    console.log(`Deleting all permissions for issue: ${issueId}`);

    try {
      // Get all existing tuples for this issue by reading them first
      const allTuples = await this.getAllIssueTuples(issueId);

      if (allTuples.length > 0) {
        const result = await this.openFgaService.deleteTuplesSafe(allTuples);
        
        // Clear in_fact scan cache because issue membership may have changed
        await this.redisDel('in_fact_issue_ids');
        console.log('Cleared in_fact cache after issue deletion');
        
        return result;
      } else {
        console.log(`No tuples found for issue: ${issueId}`);
        return { success: true, message: 'No tuples to delete' };
      }
    } catch (error) {
      console.error(`Error deleting permissions for issue ${issueId}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to get all existing tuples for an issue
   */
  private async getAllIssueTuples(issueId: string): Promise<any[]> {
    console.log(`Reading all existing tuples for issue: ${issueId}`);

    try {
      const tuples = await this.openFgaService.readTuples({
        object: `issue:${issueId}`,
      });

      console.log(
        `Found ${tuples.length} tuples for issue ${issueId}`,
      );

      const formattedTuples = tuples.map((tuple) => ({
        user: tuple.key.user,
        relation: tuple.key.relation,
        object: tuple.key.object,
      }));

      return formattedTuples;
    } catch (error) {
      console.error(`Error reading tuples for issue ${issueId}:`, error);
      return [];
    }
  }

  // Cached base permission id arrays (no in_fact restriction applied here)
  private async getBasePermissionIds(
    userId: string,
    consistency: Consistency,
  ): Promise<{ viewIds: string[]; editIds: string[]; deleteIds: string[] }> {
    const baseKey = `issue_base_sets:${userId}:${consistency}`;

    const cached = await this.redisGetJSON<{ viewIds: string[]; editIds: string[]; deleteIds: string[] }>(baseKey);
    if (cached) {
      const pid = process.pid;
      const v = cached.viewIds?.length ?? 0;
      const e = cached.editIds?.length ?? 0;
      const d = cached.deleteIds?.length ?? 0;
      console.log(`[base-sets] pid=${pid} key=${baseKey} hit v/e/d=${v}/${e}/${d}`);
      return cached;
    }

    const [viewIds, editIds, deleteIds] = await Promise.all([
      this.listIssueIdsByRelation(userId, 'can_view', consistency),
      this.listIssueIdsByRelation(userId, 'can_edit', consistency),
      this.listIssueIdsByRelation(userId, 'can_delete', consistency),
    ]);

    const payload = { viewIds, editIds, deleteIds };
    await this.redisSetJSON(baseKey, payload, this.CACHE_TTL);
    {
      const pid = process.pid;
      console.log(`[base-sets] pid=${pid} key=${baseKey} set ttl=${this.CACHE_TTL} v/e/d=${payload.viewIds.length}/${payload.editIds.length}/${payload.deleteIds.length}`);
    }
    return payload;
  }

  /**
   * Private helper method to list issue IDs by relation with batching
   */
  private async listIssueIdsByRelation(
    userId: string,
    relation: 'can_view' | 'can_edit' | 'can_delete' | 'issue_assigned' | 'in_fact',
    consistency: Consistency = 'fully-consistent',
  ): Promise<string[]> {
    const res = await this.openFgaService.listObjects({
      user: `user:${userId}`,
      relation,
      type: 'issue',
      consistency, // Pass consistency parameter for performance optimization
    });

    const ISSUE_RE = /^issue:(.+)$/;
    const parseIssueIds = (objs: string[] = []) => objs.map((o) => ISSUE_RE.exec(o)?.[1] ?? o);

    return parseIssueIds(res.objects ?? []);
  }

  /**
   * Batch get permissions for multiple users (useful for team views)
   */
  async batchGetIssuePermissions(
    userIds: string[],
    consistency: Consistency = 'fully-consistent',
  ): Promise<Map<string, PermissionCacheEntry[]>> {
    const result = new Map<string, PermissionCacheEntry[]>();
    
    // Process users in parallel but with concurrency limit
    const CONCURRENCY_LIMIT = 5;
    for (let i = 0; i < userIds.length; i += CONCURRENCY_LIMIT) {
      const batch = userIds.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map(userId => 
          this.getIssuePermissionsJson(userId, consistency)
            .then(perms => ({ userId, perms }))
        )
      );
      
      batchResults.forEach(({ userId, perms }) => {
        result.set(userId, perms);
      });
    }
    
    return result;
  }
}
