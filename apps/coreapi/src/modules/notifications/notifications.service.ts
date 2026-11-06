import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { Caller, isUuidText } from '@app/api-kernel';
import { NotificationTarget } from '@app/permissions';
import { DISMISS_SQL, INBOX_SQL, SEEN_SQL, TARGET_SQL } from './notifications.query';

export type NotificationKind = 'shared-document' | 'document-update' | 'shared-folder' | 'shared-annotation' | 'file-upload' | 'comment' | 'task' | 'presentation' | 'case-update' | 'information';
/** What a Mark share notice reports (R4-004): shared with the recipient, shared onward from the creator, re-levelled, dropped, commented on, or deleted by a colleague (R4-002). */
export type ShareAction = 'shared' | 'reshared' | 'level' | 'removed' | 'comment' | 'deleted';
export type MarkLevel = NonNullable<NotificationTarget['level']>;
export interface InboxQuery { limit?: number | string; before?: string; beforeId?: string; }
export interface InboxMutation { notificationIds?: string[]; all?: boolean; }
export interface InboxItem {
  id: string; kind: NotificationKind; title: string; body?: string; caseId?: string; caseName?: string; occurredAt: string; seen: boolean; documentId?: string;
  /** Mark share notices only (R4-004): the kind of Mark, its place, who shared it, the recipient's level, and what happened. */
  markKind?: string; page?: number; line?: number; sharerName?: string; level?: MarkLevel; action?: ShareAction;
}
interface InboxRow { id: string; seen?: boolean; sourceType?: string; occurredAt: string | Date; target: NotificationTarget; caseId?: string; caseName?: string; sharerId?: string; sharerName?: string; }

const TITLES: Record<NotificationKind,string> = {
  'shared-document': 'Document shared with you', 'document-update': 'Document update', 'shared-folder': 'Folder shared with you',
  'shared-annotation': 'Mark shared with you', 'file-upload': 'Files uploaded to your case',
  comment: 'New comment on your Mark', task: 'Task update', presentation: 'Presentation update',
  'case-update': 'Case update', information: 'Information',
};

/** The templates that share a document (individual.service LS, bundle-creation CS); any other document-target notice is a document update (R3-003). */
const DOCUMENT_SHARE_TEMPLATES = ['LS', 'CS'];
const MARK_KIND_LABEL: Record<string, string> = { F: 'Fact', QF: 'QFact', D: 'DocLink', W: 'Weblink' };
const LEVEL_LABEL: Record<string, string> = { read: 'Read only', comment: 'Can comment', edit: 'Can edit', share: 'Can share' };

function validCursorTime(value: unknown): value is string {
  if (typeof value!=='string' || !/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)) return false;
  const year=Number(value.slice(0,4)),month=Number(value.slice(5,7)),day=Number(value.slice(8,10));
  const leap=year%4===0 && (year%100!==0 || year%400===0);
  return year>0 && day<=[31,leap ? 29 : 28,31,30,31,30,31,31,30,31,30,31][month-1] && Number.isFinite(Date.parse(value));
}

export function notificationKind(row: Pick<InboxRow,'sourceType'|'target'>): NotificationKind {
  const target=row.target; const source=(row.sourceType || '').toUpperCase();
  if (target.type==='case') return 'case-update';
  if (target.type==='annotation') return source.includes('COMMENT') ? 'comment' : 'shared-annotation';
  if (target.type==='document') {
    if (source==='U' || source.includes('UPLOAD')) return 'file-upload';
    return DOCUMENT_SHARE_TEMPLATES.includes(source) ? 'shared-document' : 'document-update';
  }
  if (target.type==='workspace') return target.taskId ? 'task' : 'case-update';
  if (target.type==='presentation') return 'presentation';
  if (target.type==='evidence') return target.uploadId || source==='U' || source.includes('UPLOAD') ? 'file-upload' : 'shared-folder';
  return 'information';
}

/**
 * What a Mark share template reports (R4-004): FS to the Mark's owner is the creator's "shared onward" notice
 * (R4-001; the owner's level is resolved live), FS to anyone else a share, FS-LEVEL a re-level, FS-REMOVED a drop
 * (its target is the case, since the recipient may no longer open the Mark), DS a DocLink share, COMMENT-ADDED a
 * comment, FD the creator's Fact deleted by a colleague (R4-002; the case again, the Mark is gone). Null for every
 * other template.
 */
export function shareAction(row: Pick<InboxRow,'sourceType'|'target'>): ShareAction | null {
  const source=(row.sourceType || '').toUpperCase();
  if (source==='FS-LEVEL') return 'level';
  if (source==='FS-REMOVED') return 'removed';
  if (source==='FD') return 'deleted';
  if (source==='COMMENT-ADDED') return 'comment';
  if (source==='FS') return row.target.type==='annotation' && row.target.level==='owner' ? 'reshared' : 'shared';
  if (source==='DS') return 'shared';
  return null;
}

const SHARE_TITLES: Record<ShareAction,string> = {
  shared: 'Mark shared with you', reshared: 'Mark shared onward', level: 'Mark access changed', removed: 'Mark no longer shared', comment: 'New comment on your Mark',
  deleted: 'Fact deleted',
};

/** The share notice's fields and copy from verified metadata only: the resolved target and the sharer's verified name. */
function shareFields(row: InboxRow, action: ShareAction): Partial<InboxItem> {
  const target=row.target;
  const annotation=target.type==='annotation';
  const markKind=annotation ? target.sourceType : row.sourceType?.toUpperCase()==='DS' ? 'D' : 'F';
  const page=annotation && Number.isInteger(target.page) && target.page>0 ? target.page : undefined;
  const line=page!==undefined && Number.isInteger(target.line) && target.line>0 ? target.line : undefined;
  const level=annotation && target.level ? target.level : undefined;
  const sharerName=typeof row.sharerName==='string' && row.sharerName.trim() ? row.sharerName.trim() : undefined;
  const place=page!==undefined ? (line!==undefined ? `p${page}:${line}` : `p${page}`) : undefined;
  const levelLabel=action!=='reshared' && action!=='comment' && action!=='removed' && action!=='deleted' && level ? LEVEL_LABEL[level] : undefined;
  const body=[MARK_KIND_LABEL[markKind ?? ''] ?? 'Mark', place, sharerName ? `by ${sharerName}` : undefined, levelLabel].filter(Boolean).join(' · ');
  return { title: SHARE_TITLES[action], body, action,
    ...(markKind ? {markKind} : {}), ...(page!==undefined ? {page} : {}), ...(line!==undefined ? {line} : {}),
    ...(sharerName ? {sharerName} : {}), ...(level ? {level} : {}) };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DbService) {}

  private actor(caller: Caller): string {
    if (!caller || !isUuidText(caller.userId)) throw new UnauthorizedException('Authentication required');
    return caller.userId;
  }

  private async rows(sql: string, params: unknown[]): Promise<any[]> {
    const result=await this.db.rowQuery(sql,params);
    if (!result?.success || !Array.isArray(result.data)) throw new InternalServerErrorException('Notifications could not be refreshed');
    return result.data;
  }

  async inbox(caller: Caller, query: InboxQuery={}) {
    const actor=this.actor(caller);
    const limit=query.limit===undefined ? 30 : Number(query.limit);
    if (!Number.isInteger(limit) || limit<1 || limit>100) throw new BadRequestException('limit must be an integer from 1 to 100');
    if ((query.before!==undefined) !== (query.beforeId!==undefined)) throw new BadRequestException('before and beforeId must be supplied together');
    if (query.before!==undefined && (!validCursorTime(query.before) || !isUuidText(query.beforeId))) {
      throw new BadRequestException('Invalid notification cursor');
    }
    const result=(await this.rows(INBOX_SQL,[actor,limit+1,query.before ?? null,query.beforeId ?? null]))[0];
    const page: InboxRow[]=Array.isArray(result?.items) ? result.items : [];
    const items: InboxItem[]=page.slice(0,limit).map(row=>{
      const kind=notificationKind(row);
      const action=shareAction(row);
      // Old stored messages can mention private files/folders without source IDs. Use verified metadata and safe copy.
      return { id:row.id,kind,title:TITLES[kind],occurredAt:typeof row.occurredAt==='string' ? row.occurredAt : row.occurredAt.toISOString(),seen:!!row.seen,
        ...(row.caseId ? {caseId:row.caseId,caseName:row.caseName} : {}),
        ...(row.target.type==='document' ? {documentId:row.target.documentId, ...(row.target.name ? {body:row.target.name} : {})} : {}),
        ...(action ? shareFields(row,action) : {}) };
    });
    const last=items[items.length-1];
    return { items,unseenCount:Number(result?.unseenCount || 0),
      ...(page.length>limit && last ? {nextCursor:{before:last.occurredAt,beforeId:last.id}} : {}) };
  }

  async target(caller: Caller, id: string): Promise<NotificationTarget> {
    const actor=this.actor(caller);
    if (!isUuidText(id)) throw new BadRequestException('Invalid notification ID');
    const row=(await this.rows(TARGET_SQL,[actor,id]))[0];
    if (!row?.target) throw new NotFoundException('Notification is no longer available');
    return row.target;
  }

  async change(caller: Caller, body: InboxMutation, action: 'seen'|'dismiss') {
    const actor=this.actor(caller);
    const hasIds=Object.prototype.hasOwnProperty.call(body ?? {},'notificationIds');
    if (!body || (body.all!==undefined && typeof body.all!=='boolean') || (hasIds === (body.all===true))) {
      throw new BadRequestException('Supply notificationIds or all:true');
    }
    if (hasIds && (!Array.isArray(body.notificationIds) || body.notificationIds.length<1 || body.notificationIds.length>100 || !body.notificationIds.every(isUuidText))) {
      throw new BadRequestException('Supply between 1 and 100 valid notification IDs');
    }
    const ids=hasIds ? [...new Set(body.notificationIds.map(id=>id.toLowerCase()))] : null;
    const rows=await this.rows(action==='seen' ? SEEN_SQL : DISMISS_SQL,[actor,ids]);
    return {ok:true,updated:rows.length};
  }
}
