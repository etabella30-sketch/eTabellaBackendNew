import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isUuidText } from '@app/api-kernel';
import { assertSaveStage } from './save-transaction';
import type { DbService } from './db.service';

/** Apply only an explicitly supplied group edit, after all Fact stages, inside the save transaction. */
export async function savePrivateGroup(db: DbService, actor: string | undefined, body: Record<string, unknown>, result: unknown): Promise<void> {
  const group = body.nPrivateGroupid;
  if (group !== null && !isUuidText(group)) throw new BadRequestException('Choose a valid Private Group');
  if (!isUuidText(actor)) throw new ForbiddenException('Sign in to update Private Groups');
  const row = Array.isArray(result) ? result.flat(Infinity).find(r => r && typeof r === 'object' && 'nFSid' in r) : result;
  const factId = body.nFSid ?? (row as Record<string, unknown> | null)?.nFSid;
  if (!isUuidText(factId)) throw new BadRequestException('The Fact could not be identified');
  const saved = await db.executeRef('private_group_assign', { nMasterid: actor, nFSid: factId, nPrivateGroupid: group });
  if (!saved.success || !saved.data?.[0]?.length || saved.data[0][0]?.msg !== 1) throw new Error('Private Group could not be saved');
  assertSaveStage(saved.data);
}
