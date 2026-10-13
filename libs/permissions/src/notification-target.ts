import { isUuidText, RowQuery } from '@app/api-kernel';

/** Metadata only; labels are resolved from accessible resources by the database, never accepted from publishers. */
export interface NotificationTarget {
  type: 'document' | 'annotation' | 'evidence' | 'workspace' | 'presentation' | 'case' | 'information';
  caseId?: string;
  documentId?: string;
  sessionId?: string;
  annotationId?: string;
  sourceType?: string;
  folderId?: string;
  sectionId?: string;
  uploadId?: string;
  taskId?: string;
  presentationId?: string;
  page?: number;
  tab?: string;
  name?: string;
  exhibit?: string;
}

export const NOTIFICATION_TARGET_SQL = 'SELECT public.nt_resolve_target($1::uuid,$2::jsonb,$3::uuid) AS target';
export const NOTIFICATION_FILE_ACCESS_SQL = 'SELECT public.nt_file_visible($1::uuid,$2::uuid) AS "bAllowed"';

/** Throws on a failed lookup; null means that delivery/resolution must be refused. */
export async function resolveNotificationTarget(db: RowQuery, recipient: string, target: NotificationTarget, caseId?: string): Promise<NotificationTarget | null> {
  if (!isUuidText(recipient) || (caseId!==undefined && !isUuidText(caseId))) return null;
  const rows = await db.rows<{ target: NotificationTarget | null }>(NOTIFICATION_TARGET_SQL, [recipient, JSON.stringify(target), caseId ?? null]);
  return rows[0]?.target ?? null;
}
