import { durableNotification, notificationCopy, notificationTarget, notificationSourceFields } from './notification-message';
import { KafkaGlobalService } from '../kafka/kafka.shared.service';
import { Subject, throwError } from 'rxjs';
const CASE = '11111111-1111-4111-8111-111111111111';
const DOC = '22222222-2222-4222-8222-222222222222';

describe('notificationCopy (R3-003 / R4-004, RT QA 2026-10-28)', () => {
  const document = { type: 'document', caseId: CASE, documentId: DOC };

  it('a document-target notice is "Document shared" only for the share templates LS and CS; a job result (no template, hyperlink/index) is a document update', () => {
    expect(notificationCopy(document, 'LS')).toEqual({ cTitle: 'Document shared', cMsg: 'A document was shared with you.' });
    expect(notificationCopy(document, 'CS')).toEqual({ cTitle: 'Document shared', cMsg: 'A document was shared with you.' });
    expect(notificationCopy(document, undefined as never)).toEqual({ cTitle: 'Document update', cMsg: 'A document in your case was updated.' });
    expect(notificationCopy(document, 'HL')).toEqual({ cTitle: 'Document update', cMsg: 'A document in your case was updated.' });
    // The producer's own text (a file name, "Hyperlink completed") is still never kept for these.
    expect(notificationCopy(document, undefined as never, { cTitle: 'Hyperlink completed', cMsg: 'private.pdf' })).toEqual({ cTitle: 'Document update', cMsg: 'A document in your case was updated.' });
    expect(notificationCopy(document, 'U')).toEqual({ cTitle: 'File uploaded', cMsg: 'A file is now available in your case.' });
  });

  it('the Mark share templates keep the producer copy; the generic copy says Mark, never annotation', () => {
    const annotation = { type: 'annotation', caseId: CASE, annotationId: DOC, sourceType: 'F' };
    expect(notificationCopy(annotation, 'FS', { cTitle: 'Mark shared with you', cMsg: 'Jane Doe shared a Fact with you (p12:4) · Can edit' }))
      .toEqual({ cTitle: 'Mark shared with you', cMsg: 'Jane Doe shared a Fact with you (p12:4) · Can edit' });
    expect(notificationCopy(annotation, 'FS', { cTitle: ' ', cMsg: '' })).toEqual({ cTitle: 'Mark shared with you', cMsg: 'A Mark was shared with you.' });
    expect(notificationCopy({ type: 'case', caseId: CASE }, 'FS-REMOVED')).toEqual({ cTitle: 'Mark no longer shared', cMsg: 'A Mark is no longer shared with you.' });
    expect(notificationCopy(annotation, 'COMMENT-ADDED', { cTitle: 'Secret', cMsg: 'Private' })).toEqual({ cTitle: 'New comment on your Mark', cMsg: 'A comment was added to a Mark shared with you.' });
    for (const type of ['FS', 'FS-LEVEL', 'FS-REMOVED', 'DS', 'COMMENT-ADDED', 'LS', 'HL', undefined]) {
      expect(JSON.stringify(notificationCopy(annotation, type as never))).not.toMatch(/annotation/i);
    }
  });
});

it('allocates a serializable immutable producer key and preserves it on redelivery', async () => {
  const kafka = { emit: jest.fn() };
  const source = { nCaseid: CASE, nBundledetailid: DOC, cType: 'LS' };
  await new KafkaGlobalService(kafka as never).sendMessage('notification', source);
  const emitted = kafka.emit.mock.calls[0][1];
  source.nBundledetailid = CASE;
  expect(emitted.jTarget).toEqual({ type: 'document', caseId: CASE, documentId: DOC });
  expect(durableNotification(JSON.parse(JSON.stringify(emitted))).cEventKey).toBe(emitted.cEventKey);
});

it('retains resource IDs but excludes arbitrary URLs, labels and body text from target metadata', () => {
  const jTarget = { type: 'annotation', caseId: CASE, annotationId: DOC, sourceType: 'F', name: 'private', body: 'secret', url: 'javascript:bad', page: 4 };
  expect(notificationTarget({ jTarget })).toEqual({ type: 'annotation', caseId: CASE, annotationId: DOC, sourceType: 'F', page: 4 });
  expect(notificationSourceFields({ nTaskid: DOC, nUPid: CASE, cEventKey: 'task:one', jTarget, unknown: true })).not.toHaveProperty('unknown');
});

it('waits for notification broker acknowledgement and propagates publish failures to retryable workers', async () => {
  const acknowledgement = new Subject();
  const kafka = { emit: jest.fn().mockReturnValue(acknowledgement) };
  let complete = false;
  const pending = new KafkaGlobalService(kafka as never).sendMessage('notification', { nCaseid: CASE }).then(() => { complete = true; });
  await Promise.resolve(); expect(complete).toBe(false);
  acknowledgement.next('accepted'); acknowledgement.complete(); await pending;
  expect(complete).toBe(true);
  kafka.emit.mockReturnValueOnce(throwError(() => new Error('broker unavailable')));
  await expect(new KafkaGlobalService(kafka as never).sendMessage('notification', { nCaseid: CASE })).rejects.toThrow('broker unavailable');
});
