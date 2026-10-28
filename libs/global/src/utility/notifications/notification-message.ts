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

/**
 * The Mark share templates (R4-004, 2026-10-28; the list is @app/permissions MARK_SHARE_TEMPLATES, repeated here so
 * this lib keeps its dependency direction): their producers are ours (share-notifications.ts, realtime.et_doc_insert)
 * and write names and page numbers only, so their copy is kept for the push and the socket event. Every other
 * template still gets the generic copy below.
 */
const MARK_SHARE_TEMPLATES = ['FS', 'FS-LEVEL', 'FS-REMOVED', 'DS'];
/** The templates that share a document (individual.service LS, bundle-creation CS); mirrored by the coreapi inbox (R3-003). */
const DOCUMENT_SHARE_TEMPLATES = ['LS', 'CS'];
const producerCopy = (message: Record<string, unknown>): { cTitle: string; cMsg: string } | null =>
  typeof message.cTitle === 'string' && message.cTitle.trim() && typeof message.cMsg === 'string' && message.cMsg.trim()
    ? { cTitle: message.cTitle.trim(), cMsg: message.cMsg.trim() } : null;

/** A legacy producer may have included private labels in its text without retaining a verifiable ID. */
export function notificationCopy(target: Record<string, unknown>, type: string, message: Record<string, unknown> = {}): { cTitle: string; cMsg: string } {
  if (MARK_SHARE_TEMPLATES.includes(String(type).toUpperCase())) {
    const kept = producerCopy(message);
    if (kept) return kept;
  }
  if (type === 'COMMENT-ADDED') return { cTitle: 'New comment on your Mark', cMsg: 'A comment was added to a Mark shared with you.' };
  if (type === 'FS-LEVEL') return { cTitle: 'Mark access changed', cMsg: 'Your access to a shared Mark was changed.' };
  if (type === 'FS-REMOVED') return { cTitle: 'Mark no longer shared', cMsg: 'A Mark is no longer shared with you.' };
  if (type === 'U') return { cTitle: 'File uploaded', cMsg: 'A file is now available in your case.' };
  // R3-003: only the document-share templates (LS, CS; the coreapi inbox's DOCUMENT_SHARE_TEMPLATES) are a share.
  // A document-target notice of any other template, or none (a hyperlink/index job result addressed to its own
  // author), is a document update for the push and the socket event too, as the inbox already titles it.
  if (target.type === 'document') {
    return DOCUMENT_SHARE_TEMPLATES.includes(String(type).toUpperCase())
      ? { cTitle: 'Document shared', cMsg: 'A document was shared with you.' }
      : { cTitle: 'Document update', cMsg: 'A document in your case was updated.' };
  }
  if (target.type === 'annotation') return { cTitle: 'Mark shared with you', cMsg: 'A Mark was shared with you.' };
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
