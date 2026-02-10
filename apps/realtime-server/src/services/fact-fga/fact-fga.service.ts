import { Injectable, Inject, Logger } from '@nestjs/common';
import { OpenFgaService } from '../open-fga/open-fga.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';

type Consistency = 'fully-consistent' | 'fully-consistent' | 'best-effort';

@Injectable()
export class FactFgaService {
  private readonly CACHE_TTL = parseInt(process.env.FGA_CACHE_TTL_SECONDS ?? '3000', 10); // seconds (default 300)
  // ---------- helpers ----------
  private ensureSafeId(id: string) {
    if (/[:#"\s]/.test(id)) {
      throw new Error(
        `Invalid id "${id}". With unquoted FGA subjects/objects, IDs must not contain colon (:), hash (#), quotes ("), or whitespace.`,
      );
    }
    return id;
  }
  private toObject(type: string, id: string) {
    return `${type}:${this.ensureSafeId(id)}`;
  }
  private toTypeOnly(type: string) {
    return `${type}:`; // e.g., "issue:" or "task:"
  }
  private chunk<T>(arr: T[], size = 100): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  private logger = new Logger(FactFgaService.name)
  constructor(
    private readonly openFgaService: OpenFgaService,
    @Inject(RedisDbService) private readonly redisDb: RedisDbService,
  ) { }

  /**
   * Get fact permissions for a specific user
   * Returns an array of fact permissions with view, edit, delete, share flags
   */
  async getFactPermissionsJson(
    userId: string,
    consistency: Consistency = 'fully-consistent',
  ): Promise<
    Array<{
      factId: string;
      view: boolean;
      edit: boolean;
      delete: boolean;
      share: boolean;
      comment: boolean;
    }>
  > {
    // Cache lookup
    const effectiveConsistency = (consistency ?? (process.env.FGA_DEFAULT_CONSISTENCY as Consistency) ?? 'fully-consistent') as Consistency;
    const cacheKey = `fact_perms:${userId}:${effectiveConsistency}`;
    {
      const raw = await this.redisDb.getValue(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw);
        const pid = process.pid;
        console.log(`[fact] pid=${pid} key=${cacheKey} hit len=${Array.isArray(cached) ? cached.length : 0}`);
        return cached;
      }
      {
        const pid = process.pid;
        console.log(`[fact] pid=${pid} key=${cacheKey} miss`);
      }
    }

    const [viewIds, editIds, deleteIds, shareIds, commentIds] = await Promise.all([
      this.listFactIdsByRelation(userId, 'can_view', effectiveConsistency),
      this.listFactIdsByRelation(userId, 'can_edit', effectiveConsistency),
      this.listFactIdsByRelation(userId, 'can_delete', effectiveConsistency),
      this.listFactIdsByRelation(userId, 'can_share', effectiveConsistency),
      this.listFactIdsByRelation(userId, 'can_comment', effectiveConsistency),
    ]);

    const viewSet = new Set(viewIds);
    const editSet = new Set(editIds);
    const deleteSet = new Set(deleteIds);
    const shareSet = new Set(shareIds);
    const commentSet = new Set(commentIds);

    // Logical closure: if user can edit/delete, they can view
    for (const id of editSet) viewSet.add(id);
    for (const id of deleteSet) viewSet.add(id);

    // Combine all fact IDs
    const allFactIds = new Set<string>([
      ...viewSet,
      ...editSet,
      ...deleteSet,
      ...shareSet,
      ...commentSet
    ]);

    const result = [...allFactIds].map((id) => ({
      factId: id,
      view: viewSet.has(id),
      edit: editSet.has(id),
      delete: deleteSet.has(id),
      share: shareSet.has(id),
      comment: commentSet.has(id),
    }));

    await this.redisDb.setValue(cacheKey, JSON.stringify(result), this.CACHE_TTL);
    {
      const pid = process.pid;
      console.log(`[fact] pid=${pid} key=${cacheKey} set ttl=${this.CACHE_TTL} len=${result.length}`);
    }
    return result;
  }

  /**
   * Get all users who have permissions on a specific fact
   * Returns an array of users with their permission levels for the given fact
   */
  async getFactUserPermissions(factId: string): Promise<
    Array<{
      userId: string;
      view: boolean;
      bCanEdit: boolean;
      bCanReshare: boolean;
      bCanComment: boolean;
    }>
  > {
    // 1. Get all direct tuples for this fact
    // console.log(`Getting user permissions for fact: ${factId}`);
    const allTuples = await this.getAllFactTuples(factId);
    // console.log(`All tuples for fact ${factId}:`, allTuples);

    // 2. Extract unique user IDs (filter out non-user relations like fact:x)
    const userIds = [
      ...new Set(
        allTuples
          .map((tuple) => tuple.user)
          .filter((user) => user.startsWith('user:'))
          .map((user) => user.match(/^user:(.+)$/)?.[1])
          .filter(Boolean),
      ),
    ];

    const consistency = 'fully-consistent';

    // 3. For each user, check if the specific factId is in their permission sets
    const userPermissions = await Promise.all(
      userIds.map(async (userId) => {
        const [viewIds, editIds, shareIds, commentIds] = await Promise.all([
          this.listFactIdsByRelation(userId, 'can_view', consistency),
          this.listFactIdsByRelation(userId, 'can_edit', consistency),
          this.listFactIdsByRelation(userId, 'can_share', consistency),
          this.listFactIdsByRelation(userId, 'can_comment', consistency),
        ]);

        return {
          userId,
          view: viewIds.includes(factId),
          bCanEdit: editIds.includes(factId),
          bCanReshare: shareIds.includes(factId),
          bCanComment: commentIds.includes(factId),
        };
      }),
    );

    return userPermissions;
  }

  // Invalidate per-user fact permission caches across consistency modes
  private async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      `fact_perms:${userId}:fully-consistent`,
      `fact_perms:${userId}:fully-consistent`,
      `fact_perms:${userId}:best-effort`,
    ];
    for (const k of keys) {
      await this.redisDb.deleteValue(k);
    }
    {
      const pid = process.pid;
      console.log(`[fact-invalidate] pid=${pid} user=${userId} cleared ${keys.length} keys`);
    }
  }

  /**
   * Create permission tuples for a new fact
   */
  async createFactPermissions(factId: string, userId: string): Promise<any> {
    const tuples = [
      {
        user: `user:${userId}`,
        relation: 'owner',
        object: `fact:${factId}`,
      },
    ];

    const res = await this.openFgaService.writeTuplesSafe(tuples);
    await this.invalidateUserCache(userId);
    return res;
  }

  /**
   * Delete all fact permissions - comprehensive cleanup
   */
  async deleteAllFactPermissions(factId: string): Promise<any> {
    console.log(`Deleting all permissions for fact: ${factId}`);

    try {
      // Get all existing tuples for this fact by reading them first
      const allTuples = await this.getAllFactTuples(factId);

      if (allTuples.length > 0) {
        const res = await this.openFgaService.deleteTuplesSafe(allTuples);

        {
          const impactedUserIds = Array.from(new Set(
            allTuples.map((t) => {
              const m = t.user?.match(/^user:(.+)$/);
              return m ? m[1] : null;
            }).filter(Boolean)
          ));
          await Promise.all(impactedUserIds.map((u) => this.invalidateUserCache(u as string)));
        }

        return res;
      } else {
        console.log(`No tuples found for fact: ${factId}`);
        return { success: true, message: 'No tuples to delete' };
      }
    } catch (error) {
      console.error(`Error deleting permissions for fact ${factId}:`, error);
      throw error;
    }
  }

  /**
   * Add editor permission to a fact
   */
  async addFactEditor(factId: string, userId: string): Promise<any> {
    const tuple = {
      user: `user:${userId}`,
      relation: 'editor',
      object: `fact:${factId}`,
    };

    const res = await this.openFgaService.writeTuplesSafe([tuple]);
    await this.invalidateUserCache(userId);
    return res;
  }

  /**
   * Add sharer permission to a fact
   */
  async addFactSharer(factId: string, userId: string): Promise<any> {
    const tuple = {
      user: `user:${userId}`,
      relation: 'sharer',
      object: `fact:${factId}`,
    };

    const res = await this.openFgaService.writeTuplesSafe([tuple]);
    await this.invalidateUserCache(userId);
    return res;
  }

  /**
   * Remove editor permission from a fact
   */
  async removeFactEditor(factId: string, userId: string): Promise<any> {
    const tuple = {
      user: `user:${userId}`,
      relation: 'editor',
      object: `fact:${factId}`,
    };

    const res = await this.openFgaService.deleteTuplesSafe([tuple]);
    await this.invalidateUserCache(userId);
    return res;
  }

  /**
   * Remove sharer permission from a fact
   */
  async removeFactSharer(factId: string, userId: string): Promise<any> {
    const tuple = {
      user: `user:${userId}`,
      relation: 'sharer',
      object: `fact:${factId}`,
    };

    const res = await this.openFgaService.deleteTuplesSafe([tuple]);
    await this.invalidateUserCache(userId);
    return res;
  }

  /**
   * Helper method to get all existing tuples for a fact
   * Reads all tuples from OpenFGA that reference this specific fact
   */
  private async getAllFactTuples(factId: string): Promise<any[]> {
    console.log(`Reading all existing tuples for fact: ${factId}`);

    try {
      // Read all tuples for this specific fact object
      const tuples = await this.openFgaService.readTuples({
        object: `fact:${factId}`,
      });

      console.log(`Found ${tuples.length} tuples for fact ${factId}:`, tuples);

      // Convert tuples to the format expected by deleteTuples
      const formattedTuples = tuples.map((tuple) => ({
        user: tuple.key.user,
        relation: tuple.key.relation,
        object: tuple.key.object,
      }));

      return formattedTuples;
    } catch (error) {
      console.error(`Error reading tuples for fact ${factId}:`, error);
      // Fallback: return empty array and let deleteTuplesSafe handle it
      return [];
    }
  }

  /**
   * Private helper method to list fact IDs by relation
   */
  private async listFactIdsByRelation(
    userId: string,
    relation: 'can_view' | 'can_edit' | 'can_delete' | 'can_share' | 'can_comment',
    consistency: Consistency = 'fully-consistent',
  ): Promise<string[]> {
    const res = await this.openFgaService.listObjects({
      user: `user:${userId}`,
      relation,
      type: 'fact',
      consistency,
    });

    const FACT_RE = /^fact:(.+)$/;
    const parseFactIds = (objs: string[] = []) =>
      objs.map((o) => FACT_RE.exec(o)?.[1] ?? o);

    return parseFactIds(res.objects ?? []);
  }

  async revokeViewEditShareForFact(
    factId: string,
    excludeUserIds: string[] = [], // new param
  ): Promise<{ success: boolean; removed: number; message: string }> {
    const TARGET_RELATIONS = new Set(['viewer', 'editor', 'sharer', 'commentor']);

    try {
      // Read all tuples for this fact
      const allTuples = await this.getAllFactTuples(factId);

      // Keep only user-based viewer/editor/sharer tuples
      const tuplesToDelete = allTuples.filter((t) => {
        const isTargetRelation =
          t.user?.startsWith('user:') && TARGET_RELATIONS.has(t.relation);

        if (!isTargetRelation) return false;

        // Extract userId from user:someUserId
        const match = t.user.match(/^user:(.+)$/);
        const userId = match ? match[1] : null;

        // Exclude if userId is in excludeUserIds
        return userId && !excludeUserIds.includes(userId);
      });

      if (tuplesToDelete.length === 0) {
        return {
          success: true,
          removed: 0,
          message: `No viewer/editor/sharer tuples to delete for fact: ${factId}`,
        };
      }

      await this.openFgaService.deleteTuplesSafe(tuplesToDelete);

      {
        const impactedUserIds = Array.from(new Set(
          tuplesToDelete.map((t) => {
            const m = t.user?.match(/^user:(.+)$/);
            return m ? m[1] : null;
          }).filter(Boolean)
        ));
        await Promise.all(impactedUserIds.map((u) => this.invalidateUserCache(u as string)));
      }

      return {
        success: true,
        removed: tuplesToDelete.length,
        message: `Removed ${tuplesToDelete.length} viewer/editor/sharer tuples for fact: ${factId}`,
      };
    } catch (error) {
      console.error(`Error revoking view/edit/share for fact ${factId}:`, error);
      throw error;
    }
  }
  /**
   * Get all can_* permissions for a specific user on a specific fact.
   * nUserid => user id, nFSid => fact id
   */
  async getUserFactPermissionsOnFact(
    nUserid: string,
    nFSid: string,
    consistency: Consistency = 'fully-consistent',
  ): Promise<{
    userId: string;
    factId: string;
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_share: boolean;
    can_comment: boolean;
  }> {
    const user = `user:${nUserid}`;
    const object = `fact:${nFSid}`;

    // Helper to run a single relation check, with fallback to listObjects+includes
    const checkRelation = async (
      relation: 'can_view' | 'can_edit' | 'can_delete' | 'can_share' | 'can_comment',
    ): Promise<boolean> => {
      // Preferred path: OpenFGA check
      if (typeof (this.openFgaService as any).check === 'function') {
        const allowed = await (this.openFgaService as any).check(
          { user, relation, object },
          consistency,
        );
        // Many wrappers return { allowed: boolean }, some return boolean directly
        return typeof allowed === 'boolean' ? allowed : !!allowed?.allowed;
      }

      // Fallback path: list-objects for the user+relation and see if this fact is present
      const ids = await this.listFactIdsByRelation(nUserid, relation, consistency);
      return ids.includes(nFSid);
    };

    const [can_edit, can_delete, can_share, can_comment, can_viewRaw] = await Promise.all([
      checkRelation('can_edit'),
      checkRelation('can_delete'),
      checkRelation('can_share'),
      checkRelation('can_comment'),
      checkRelation('can_view'),
    ]);

    // Logical closure: edit/delete imply view
    const can_view = can_viewRaw || can_edit || can_delete;

    return {
      userId: nUserid,
      factId: nFSid,
      can_view,
      can_edit,
      can_delete,
      can_share,
      can_comment,
    };
  }





  async revokeUserAccessForFact(
    factId: string,
    userId: string,
  ): Promise<{ success: boolean; removed: number; value: string }> {
    try {
      // Read all tuples for this fact
      const allTuples = await this.getAllFactTuples(factId);

      // Match only tuples for this user
      const tuplesToDelete = allTuples.filter((t) => {
        const match = t.user?.match(/^user:(.+)$/);
        const tupleUserId = match ? match[1] : null;
        return tupleUserId === userId;
      });

      if (tuplesToDelete.length === 0) {
        return {
          success: true,
          removed: 0,
          value: `No tuples found for user ${userId} in fact: ${factId}`,
        };
      }

      await this.openFgaService.deleteTuplesSafe(tuplesToDelete);

      await this.invalidateUserCache(userId);

      return {
        success: true,
        removed: tuplesToDelete.length,
        value: `Removed ${tuplesToDelete.length} tuples for user ${userId} in fact: ${factId}`,
      };
    } catch (error) {
      console.error(`Error revoking access for user ${userId} in fact ${factId}:`, error);
      throw error;
    }
  }




  /**
   * Deep-delete all tuples related to a fact:
   *  - Any tuple whose OBJECT is fact:<factId> (owner/viewer/editor/sharer/commentor/freeze_issues/…)
   *  - Any tuple of the form <objectType>:*  -[in_fact]-> fact:<factId>
   *
   * @param factId         the raw fact id (no quotes, no type prefix)
   * @param opts.objectTypesWithInFact which object types have an in_fact relation to fact (default ['issue'])
   * @param opts.dryRun    if true, returns the would-be-deleted tuples but does not delete
   * @returns              { deleted: number, details: {objectTuples: number, inboundInFact: Record<string, number>} }
   */
  async deleteFactGraph(
    factId: string,
    opts?: {
      objectTypesWithInFact?: string[]; // e.g., ['issue', 'task']
      dryRun?: boolean;
      batchSize?: number;               // OpenFGA write/delete limit per request; 100 is safe
    }
  ): Promise<{ deleted: number; details: { objectTuples: number; inboundInFact: Record<string, number> }; tuples?: Array<{ user: string; relation: string; object: string }> }> {
    try {
      const factObj = this.toObject('fact', factId);
      const types = opts?.objectTypesWithInFact ?? ['issue'];
      const batchSize = Math.max(1, Math.min(opts?.batchSize ?? 100, 1000));

      // 1) All tuples whose OBJECT is the fact (owner/viewer/editor/sharer/commentor/freeze_issues/etc.)
      const factObjectTuples = await this.openFgaService.readAllTuples({ object: factObj });

      // 2) All inbound in_fact edges from each object type to this fact:
      //    (<type>:*) -[in_fact]-> fact:<id>
      const inbound: Record<string, Array<{ user: string; relation: string; object: string }>> = {};
      for (const t of types) {
        // IMPORTANT: when filtering by relation+user in /read, include a type-only object filter (e.g., "issue:")
        const rows = await this.openFgaService.readAllTuples({
          relation: 'in_fact',
          user: factObj,
          object: this.toTypeOnly(t),
        });
        inbound[t] = rows;
      }

      // 3) Combine & dedupe (just in case)
      const toDeleteMap = new Map<string, { user: string; relation: string; object: string }>();
      const put = (x: { user: string; relation: string; object: string }) =>
        toDeleteMap.set(`${x.user}|${x.relation}|${x.object}`, x);

      factObjectTuples.forEach(put);
      Object.values(inbound).forEach(arr => arr.forEach(put));

      const toDelete = Array.from(toDeleteMap.values());
      const details = {
        objectTuples: factObjectTuples.length,
        inboundInFact: Object.fromEntries(Object.entries(inbound).map(([k, v]) => [k, v.length])),
      };

      if (opts?.dryRun) {
        return { deleted: 0, details, tuples: toDelete };
      }

      if (toDelete.length === 0) {
        return { deleted: 0, details };
      }

      // 4) Delete in batches
      const chunks = this.chunk(toDelete, batchSize);
      for (const c of chunks) {
        await this.openFgaService.deleteTuples(c);
      }

      return { deleted: toDelete.length, details };
    } catch (error) {
      this.logger.error(error)
      return null;
    }

  }

}
