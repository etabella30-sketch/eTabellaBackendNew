import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { Caller, isUuidText } from '@app/api-kernel';
import { NotificationTarget } from '@app/permissions';
import { DISMISS_SQL, INBOX_SQL, SEEN_SQL, TARGET_SQL } from './notifications.query';

export type NotificationKind = 'shared-document' | 'shared-folder' | 'shared-annotation' | 'file-upload' | 'comment' | 'task' | 'presentation' | 'case-update' | 'information';
export interface InboxQuery { limit?: number | string; before?: string; beforeId?: string; }
export interface InboxMutation { notificationIds?: string[]; all?: boolean; }
export interface InboxItem { id: string; kind: NotificationKind; title: string; body?: string; caseId?: string; caseName?: string; occurredAt: string; seen: boolean; documentId?: string; }
interface InboxRow { id: string; seen?: boolean; sourceType?: string; occurredAt: string | Date; target: NotificationTarget; caseId?: string; caseName?: string; }

const TITLES: Record<NotificationKind,string> = {
  'shared-document': 'Document shared with you', 'shared-folder': 'Folder shared with you',
  'shared-annotation': 'Annotation shared with you', 'file-upload': 'Files uploaded to your case',
  comment: 'New comment on an annotation', task: 'Task update', presentation: 'Presentation update',
  'case-update': 'Case update', information: 'Information',
};

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
  if (target.type==='document') return source==='U' || source.includes('UPLOAD') ? 'file-upload' : 'shared-document';
  if (target.type==='workspace') return target.taskId ? 'task' : 'case-update';
  if (target.type==='presentation') return 'presentation';
  if (target.type==='evidence') return target.uploadId || source==='U' || source.includes('UPLOAD') ? 'file-upload' : 'shared-folder';
  return 'information';
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
      // Old stored messages can mention private files/folders without source IDs. Use verified metadata and safe copy.
      return { id:row.id,kind,title:TITLES[kind],occurredAt:typeof row.occurredAt==='string' ? row.occurredAt : row.occurredAt.toISOString(),seen:!!row.seen,
        ...(row.caseId ? {caseId:row.caseId,caseName:row.caseName} : {}),
        ...(row.target.type==='document' ? {documentId:row.target.documentId, ...(row.target.name ? {body:row.target.name} : {})} : {}) };
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
