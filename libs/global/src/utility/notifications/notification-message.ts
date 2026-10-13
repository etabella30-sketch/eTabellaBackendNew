import { randomUUID } from 'crypto';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const notificationUuid = (value: unknown): string | undefined =>
  typeof value === 'string' && uuid.test(value) ? value.toLowerCase() : undefined;

/** Source metadata contains IDs, never an action URL or unverified resource labels. */
export function notificationTarget(message: Record<string, any>): Record<string, unknown> {
  const supplied = message.jTarget;
  const source = supplied && typeof supplied === 'object' && !Array.isArray(supplied) ? supplied : {};
  const target: Record<string, unknown> = {};
  const types = ['document', 'annotation', 'evidence', 'workspace', 'presentation', 'case', 'information'];
  if (types.includes(source.type)) target.type = source.type;
  const aliases = {
    caseId: 'nCaseid', documentId: 'nBundledetailid', annotationId: 'nFSid', sessionId: 'nSesid',
    folderId: 'nBundleid', sectionId: 'nSectionid', uploadId: 'nUPid', taskId: 'nTaskid', presentationId: 'nPresentid',
  };
  for (const [key, alias] of Object.entries(aliases)) {
    const id = notificationUuid(source[key] ?? message[alias]);
    if (id) target[key] = id;
  }
  if (['F', 'QF', 'D', 'W'].includes(source.sourceType)) target.sourceType = source.sourceType;
  if (Number.isInteger(source.page) && source.page > 0) target.page = source.page;
  if (!target.type) {
    if (target.annotationId || ['FS', 'COMMENT-ADDED'].includes(message.cType)) { target.type = 'annotation'; target.sourceType ??= 'F'; }
    else if (notificationUuid(message.nDocid) || notificationUuid(message.nWebid)) {
      target.type = 'annotation'; target.annotationId = notificationUuid(message.nDocid ?? message.nWebid);
      target.sourceType = message.nDocid ? 'D' : 'W';
    } else if (target.documentId || message.cType === 'LS') target.type = 'document';
    else if (target.presentationId || String(message.cType).startsWith('PRESENT-')) target.type = 'presentation';
    else if (target.taskId) target.type = 'workspace';
    else if (target.uploadId || target.folderId || target.sectionId) target.type = 'evidence';
    else target.type = target.caseId ? 'case' : 'information';
  }
  return target;
}

/** A legacy producer may have included private labels in its text without retaining a verifiable ID. */
export function notificationCopy(target: Record<string, unknown>, type: string): { cTitle: string; cMsg: string } {
  if (type === 'COMMENT-ADDED') return { cTitle: 'New annotation comment', cMsg: 'A comment was added to a shared annotation.' };
  if (type === 'U') return { cTitle: 'File uploaded', cMsg: 'A file is now available in your case.' };
  if (target.type === 'document') return { cTitle: 'Document shared', cMsg: 'A document was shared with you.' };
  if (target.type === 'annotation') return { cTitle: 'Annotation shared', cMsg: 'An annotation was shared with you.' };
  if (target.type === 'evidence') return { cTitle: 'Evidence shared', cMsg: 'Evidence was shared with you.' };
  if (target.type === 'workspace') return { cTitle: 'Workspace update', cMsg: 'There is a new update in your workspace.' };
  if (target.type === 'presentation') return { cTitle: type === 'PRESENT-START' ? 'Presentation started' : 'Presentation invitation', cMsg: 'A presentation is available in your case.' };
  return { cTitle: 'Case update', cMsg: 'There is a new update in your case.' };
}

/** Allocate the operation key before serialization/commit; retries carry this exact key. */
export function durableNotification(message: Record<string, any>): Record<string, any> {
  const copy = JSON.parse(JSON.stringify(message));
  const key = typeof copy.cEventKey === 'string' && copy.cEventKey.length > 0 && copy.cEventKey.length <= 240
    ? copy.cEventKey : `notification:${randomUUID()}`;
  return { ...copy, cEventKey: key, jTarget: notificationTarget(copy) };
}

/** Existing utility adapters retain all typed source IDs when they cross the Kafka boundary. */
export function notificationSourceFields(source: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of ['cEventKey', 'jTarget', 'nUPid', 'nPresentid', 'nTaskid', 'nSesid', 'nSectionid', 'nBundleid', 'action']) {
    if (source[key] !== undefined) result[key] = source[key];
  }
  return result;
}
