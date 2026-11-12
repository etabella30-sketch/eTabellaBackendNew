import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isUuidText } from '@app/api-kernel';
import { assertSaveStage } from './save-transaction';
import type { DbService } from './db.service';

/**
 * The groups a save asks for, or undefined when it carries neither key (leave the mark's groups alone).
 * jPrivateGroupids (the replace-set) wins; the legacy single nPrivateGroupid maps null/'' to [] and a uuid to [uuid].
 * The request body is read raw, so every shape is checked here. Ids are lower-cased and de-duplicated, first-seen order.
 */
export function requestedPrivateGroups(body: Record<string, unknown>): string[] | undefined {
  const has = (key: string): boolean => Object.prototype.hasOwnProperty.call(body, key);
  const refuse = (): never => { throw new BadRequestException('Choose a valid Private Group'); };
  if (has('jPrivateGroupids')) {
    const list = body.jPrivateGroupids;
    if (!Array.isArray(list)) return refuse();
    const seen = new Set<string>();
    for (const id of list) {
      if (!isUuidText(id)) return refuse();
      seen.add(id.toLowerCase());
    }
    return [...seen];
  }
  if (!has('nPrivateGroupid')) return undefined;
  const group = body.nPrivateGroupid;
  if (group === null || group === '') return [];
  return isUuidText(group) ? [group.toLowerCase()] : refuse();
}

/** Apply only an explicitly supplied group edit, after all Fact stages, inside the save transaction. */
export async function savePrivateGroup(db: DbService, actor: string | undefined, body: Record<string, unknown>, result: unknown): Promise<void> {
  const jPrivateGroupids = requestedPrivateGroups(body);
  if (jPrivateGroupids === undefined) throw new BadRequestException('Choose a valid Private Group');
  if (!isUuidText(actor)) throw new ForbiddenException('Sign in to update Private Groups');
  const row = Array.isArray(result) ? result.flat(Infinity).find(r => r && typeof r === 'object' && 'nFSid' in r) : result;
  const factId = body.nFSid ?? (row as Record<string, unknown> | null)?.nFSid;
  if (!isUuidText(factId)) throw new BadRequestException('The mark could not be identified');
  const saved = await db.executeRef('private_group_assign', { nMasterid: actor, nFSid: factId, jPrivateGroupids });
  if (!saved.success || !saved.data?.[0]?.length || saved.data[0][0]?.msg !== 1) throw new Error('Private Group could not be saved');
  assertSaveStage(saved.data);
}
