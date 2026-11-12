import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'crypto';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { draftRecoveryRecordKey } from '@app/global/db/redis-db/draft-recovery-keys';
import { ATTENTION_ACCESS, ATTENTION_RECOVERY_DOCUMENT_ACCESS } from '../caseactivity/attention-documents.query';

type SourceKind = 'pdf' | 'transcript';
export interface DraftSource { caseId: string; sourceKind: SourceKind; sourceId: string; }
interface WrappedPayload extends DraftSource { key: string; epoch: string; expiresAt: number; }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TTL_SECONDS = 3600;
export const TRANSCRIPT_RECOVERY_ACCESS = `SELECT EXISTS (
  SELECT 1 FROM "RSessionMaster" r WHERE r."nSesid" = $3::uuid AND r."nCaseid" = $1::uuid
    AND r."dDelDt" IS NULL AND (EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = r."nCaseid"
      AND t."nUserid" = $2::uuid AND t."cStatus" = 'A')
      OR EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $2::uuid AND u."isAdmin" = true))
) AS allowed`;

/**
 * Recovery is limited to a new single-source draft. The browser keeps the
 * encrypted draft; Redis stores only a wrapped data key, never draft text or
 * the data key itself. A positive access result is never cached.
 */
@Injectable()
export class DraftRecoveryService {
  constructor(private readonly db: DbService, private readonly redis: RedisDbService, private readonly config: ConfigService) {}

  private masterKey(): Buffer {
    const encoded = this.config.get<string>('DRAFT_RECOVERY_MASTER_KEY');
    if (typeof encoded !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(encoded)) {
      throw new ServiceUnavailableException('Draft recovery is not configured');
    }
    const key = Buffer.from(encoded, 'base64');
    if (key.length !== 32 || key.toString('base64') !== encoded) throw new ServiceUnavailableException('Draft recovery is not configured');
    return key;
  }

  private validate(userId: string, source: DraftSource): void {
    if (!UUID.test(userId ?? '') || !source || !UUID.test(source.caseId ?? '') || !UUID.test(source.sourceId ?? '')
      || (source.sourceKind !== 'pdf' && source.sourceKind !== 'transcript')) throw new BadRequestException('Invalid draft source');
  }

  private async allowed(userId: string, source: DraftSource): Promise<boolean> {
    try {
      const membership = await this.db.rowQuery(ATTENTION_ACCESS, [source.caseId, userId]);
      if (!membership?.success || membership.data?.[0]?.allowed !== true) return false;
      const sql = source.sourceKind === 'pdf' ? ATTENTION_RECOVERY_DOCUMENT_ACCESS : TRANSCRIPT_RECOVERY_ACCESS;
      const doc = await this.db.rowQuery(sql, [source.caseId, userId, source.sourceId]);
      return !!(doc?.success && doc.data?.[0]?.allowed === true);
    } catch { return false; }
  }

  private wrap(master: Buffer, userId: string, draftId: string, payload: WrappedPayload): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', master, iv);
    cipher.setAAD(Buffer.from(`draft-recovery-v1:${userId}:${draftId}`));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
    return JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: ciphertext.toString('base64') });
  }

  private unwrap(master: Buffer, userId: string, draftId: string, envelope: string): WrappedPayload {
    try {
      const e = JSON.parse(envelope);
      if (e.v !== 1 || typeof e.iv !== 'string' || typeof e.tag !== 'string' || typeof e.data !== 'string') throw new Error();
      const decipher = createDecipheriv('aes-256-gcm', master, Buffer.from(e.iv, 'base64'));
      decipher.setAAD(Buffer.from(`draft-recovery-v1:${userId}:${draftId}`));
      decipher.setAuthTag(Buffer.from(e.tag, 'base64'));
      const p = JSON.parse(Buffer.concat([decipher.update(Buffer.from(e.data, 'base64')), decipher.final()]).toString('utf8')) as WrappedPayload;
      this.validate(userId, p);
      if (typeof p.key !== 'string' || Buffer.from(p.key, 'base64').length !== 32 || !/^\d+$/.test(p.epoch)
        || !Number.isSafeInteger(p.expiresAt) || p.expiresAt <= Date.now()) throw new Error();
      return p;
    } catch { throw new ForbiddenException('Draft recovery unavailable'); }
  }

  async issue(userId: string, browserId: string, tokenHash: string, source: DraftSource): Promise<{ draftId: string; key: string; expiresAt: number }> {
    this.validate(userId, source);
    if (!browserId || browserId === 'undefined' || !/^[a-f0-9]{64}$/.test(tokenHash ?? '')) throw new ForbiddenException('Draft recovery unavailable');
    const master = this.masterKey();
    const epoch = await this.redis.getDraftRecoveryEpoch(userId);
    if (!(await this.allowed(userId, source))) throw new ForbiddenException('Draft recovery unavailable for this source');
    const draftId = randomUUID();
    const key = randomBytes(32).toString('base64');
    const expiresAt = Date.now() + TTL_SECONDS * 1000;
    const envelope = this.wrap(master, userId, draftId, { ...source, key, epoch, expiresAt });
    if (!(await this.redis.putDraftRecoveryIfEpoch(userId, browserId, tokenHash, draftId, epoch, envelope, TTL_SECONDS))) {
      throw new ForbiddenException('Draft recovery unavailable');
    }
    return { draftId, key, expiresAt };
  }

  async recover(userId: string, browserId: string, tokenHash: string, draftId: string): Promise<DraftSource & { draftId: string; key: string; expiresAt: number }> {
    if (!UUID.test(userId ?? '') || !UUID.test(draftId ?? '') || !browserId || browserId === 'undefined' || !/^[a-f0-9]{64}$/.test(tokenHash ?? '')) throw new BadRequestException('Invalid draft');
    const master = this.masterKey();
    const envelope = await this.redis.getValue(draftRecoveryRecordKey(userId, draftId));
    if (typeof envelope !== 'string') throw new ForbiddenException('Draft recovery unavailable');
    const p = this.unwrap(master, userId, draftId, envelope);
    if (!(await this.allowed(userId, p))) throw new ForbiddenException('Draft recovery unavailable');
    if (await this.redis.getDraftRecoveryIfEpoch(userId, browserId, tokenHash, draftId, p.epoch) !== envelope) throw new ForbiddenException('Draft recovery unavailable');
    return { draftId, key: p.key, expiresAt: p.expiresAt, caseId: p.caseId, sourceKind: p.sourceKind, sourceId: p.sourceId };
  }

  async remove(userId: string, browserId: string, tokenHash: string, draftId: string): Promise<void> {
    if (!UUID.test(userId ?? '') || !UUID.test(draftId ?? '') || !browserId || browserId === 'undefined'
      || !/^[a-f0-9]{64}$/.test(tokenHash ?? '')) throw new BadRequestException('Invalid draft');
    const envelope = await this.redis.getValue(draftRecoveryRecordKey(userId, draftId));
    if (typeof envelope !== 'string') return;
    const payload = this.unwrap(this.masterKey(), userId, draftId, envelope);
    // Do not let a prior login in the same browser erase a newer session's
    // recovery key, or race an explicit signout or record replacement.
    if (!(await this.redis.deleteDraftRecoveryIfEpoch(userId, browserId, tokenHash, draftId, payload.epoch, envelope))) {
      throw new ForbiddenException('Draft recovery unavailable');
    }
  }
}
