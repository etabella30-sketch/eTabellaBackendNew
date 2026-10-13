import { durableNotification, notificationTarget, notificationSourceFields } from './notification-message';
import { KafkaGlobalService } from '../kafka/kafka.shared.service';
import { Subject, throwError } from 'rxjs';
const CASE = '11111111-1111-4111-8111-111111111111';
const DOC = '22222222-2222-4222-8222-222222222222';

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
