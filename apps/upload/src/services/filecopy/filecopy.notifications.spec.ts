jest.mock('child_process', () => ({ exec: jest.fn() }));
jest.mock('fs/promises', () => ({ unlink: jest.fn(async () => undefined) }));
import { exec } from 'child_process';
import * as fsp from 'fs/promises';
import { filecopyService } from './filecopy.service';
import { FileCopyProcessor } from '../../processor/copy-file.processor';
import { DOCUMENT_NOTIFICATION_USERS_SQL } from '@app/permissions/share-notifications';

const DOCUMENT = '11111111-1111-4111-8111-111111111111';
const UPLOAD = '22222222-2222-4222-8222-222222222222';
const ACTOR = '33333333-3333-4333-8333-333333333333';
const RECIPIENT = '44444444-4444-4444-8444-444444444444';
const CASE = '55555555-5555-4555-8555-555555555555';
function fixture(queue?: any) {
  const db = { rowQuery: jest.fn().mockImplementation(async (sql) => ({ success: true, data: sql === DOCUMENT_NOTIFICATION_USERS_SQL
    ? [{ nUserid: RECIPIENT, nCaseid: CASE, nBundledetailid: DOCUMENT, cToken: null }]
    : [{ nBundledetailid: DOCUMENT, nCaseid: CASE, actor: ACTOR }] })) };
  const utility = { emit: jest.fn() };
  const config = { get: (key: string) => ({ S3_SYNC_PATH: '/fixtures/', S3_BUCKET_PATH: 's3://fixtures/', S3_EXC_PATH: 's3cmd' }[key]) };
  const service = new filecopyService({} as never, config as never, { info: jest.fn(), error: jest.fn() } as never, db as never, {} as never, {} as never, utility as never, queue);
  jest.spyOn(service, 'removeUpdateVersion').mockResolvedValue(undefined);
  return { service, db, utility };
}
beforeEach(() => {
  jest.clearAllMocks();
  (exec as unknown as jest.Mock).mockImplementation((_cmd, callback) => callback(null, 'ok', ''));
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

it('notifies tokenless eligible case users only after final storage success, with a stable resource/upload key', async () => {
  const f = fixture();
  await expect(f.service.copyFile('doc/final.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD)).resolves.toBe(true);
  const notice = f.utility.emit.mock.calls[0][0];
  expect(notice).toMatchObject({ nUserid: RECIPIENT, cType: 'U', cEventKey: `file-upload:${DOCUMENT}:${UPLOAD}`, jTarget: { type: 'document', documentId: DOCUMENT, caseId: CASE } });
  expect(f.db.rowQuery.mock.calls[1][1]).toEqual([DOCUMENT, null, ACTOR]);
  expect(DOCUMENT_NOTIFICATION_USERS_SQL).toContain('"cStatus"=\'A\'');
  expect(DOCUMENT_NOTIFICATION_USERS_SQL).toContain('nt_file_visible');
  expect(DOCUMENT_NOTIFICATION_USERS_SQL).not.toContain('"cToken" IS NOT NULL');
  await f.service.copyFile('doc/final.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD);
  expect(f.utility.emit.mock.calls[1][0].cEventKey).toBe(notice.cEventKey);
});

it('never announces a failed copy, and rejects the Bull job so its configured retry runs', async () => {
  const f = fixture();
  (exec as unknown as jest.Mock).mockImplementation((_cmd, callback) => callback(new Error('storage unavailable')));
  await expect(new FileCopyProcessor(f.service).handleCopyFile({ data: { cPath: 'doc/final.pdf', converttype: 'C', nBundledetailid: DOCUMENT, nUPid: UPLOAD } } as never)).rejects.toThrow('storage copy failed');
  expect(f.utility.emit).not.toHaveBeenCalled(); expect(f.db.rowQuery).not.toHaveBeenCalled();
});

it('keeps a successfully stored conversion source until its owning worker checkpoints completion', async () => {
  const queue = { add: jest.fn().mockResolvedValue({ id: 'durable-job' }) };
  const f = fixture(queue);
  await expect(f.service.copyFile('doc/final.pdf', 'C', 'doc/native.docx', DOCUMENT, null, null, null, UPLOAD, null, null, true)).resolves.toBe(true);
  expect(queue.add).toHaveBeenCalledTimes(1);
  expect(fsp.unlink).not.toHaveBeenCalled();
});

it('does not announce native intermediate files, profile assets, or an unverified/current-path-mismatched resource', async () => {
  const f = fixture();
  await f.service.copyFile('doc/native.docx', 'B', null, DOCUMENT, null, null, null, UPLOAD);
  await f.service.copyFile('profile/avatar.png', 'C');
  expect(f.utility.emit).not.toHaveBeenCalled();
  f.db.rowQuery.mockResolvedValueOnce({ success: true, data: [] });
  await f.service.copyFile('doc/outdated.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD);
  expect(f.utility.emit).not.toHaveBeenCalled();
  expect(f.db.rowQuery.mock.calls[0][0]).toContain('d."cPath"=$3');
});

it('retains the source and retries when current permissions cannot be verified; later success has the same key', async () => {
  const f = fixture();
  f.db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ nBundledetailid: DOCUMENT, nCaseid: CASE, actor: ACTOR }] })
    .mockResolvedValueOnce({ success: false, error: 'permissions unavailable' });
  await expect(f.service.copyFile('doc/final.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD)).resolves.toBe(false);
  expect(f.utility.emit).not.toHaveBeenCalled();
  expect(fsp.unlink).not.toHaveBeenCalled();
  await expect(f.service.copyFile('doc/final.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD)).resolves.toBe(true);
  expect(f.utility.emit).toHaveBeenCalledTimes(1);
  expect(f.utility.emit.mock.calls[0][0].cEventKey).toBe(`file-upload:${DOCUMENT}:${UPLOAD}`);
});

it('retains the source on metadata or broker failure so the saved event is retryable', async () => {
  const f = fixture();
  f.db.rowQuery.mockResolvedValueOnce({ success: false, error: 'metadata down' });
  await expect(f.service.copyFile('doc/final.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD)).resolves.toBe(false);
  expect(fsp.unlink).not.toHaveBeenCalled();
  f.utility.emit.mockRejectedValueOnce(new Error('broker down'));
  await expect(f.service.copyFile('doc/final.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD)).resolves.toBe(false);
  expect(fsp.unlink).not.toHaveBeenCalled();
  await expect(f.service.copyFile('doc/final.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD)).resolves.toBe(true);
  expect(f.utility.emit.mock.calls[0][0].cEventKey).toBe(f.utility.emit.mock.calls[1][0].cEventKey);
});

it('durably queues notification work before cleanup and independently retries lookup/publish with one key', async () => {
  const queue = { add: jest.fn().mockResolvedValue({ id: 'durable-job' }) };
  const f = fixture(queue);
  await expect(f.service.copyFile('doc/final.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD)).resolves.toBe(true);
  expect(queue.add).toHaveBeenCalledWith('document-notification', { documentId: DOCUMENT, uploadId: UPLOAD, path: 'doc/final.pdf' },
    expect.objectContaining({ jobId: expect.stringMatching(/^document-notification-/), attempts: 8, removeOnFail: false }));
  expect(queue.add.mock.invocationCallOrder[0]).toBeLessThan((fsp.unlink as jest.Mock).mock.invocationCallOrder[0]);
  expect(f.db.rowQuery).not.toHaveBeenCalled();
  const data = { ...queue.add.mock.calls[0][1], actor: 'forged-actor', nMasterid: 'forged-actor', nCaseid: 'forged-case' };
  const processor = new FileCopyProcessor(f.service);
  f.db.rowQuery.mockResolvedValueOnce({ success: false, error: 'temporarily unavailable' });
  await expect(processor.handleDocumentNotification({ data } as never)).rejects.toThrow('metadata');
  f.utility.emit.mockRejectedValueOnce(new Error('broker unavailable'));
  await expect(processor.handleDocumentNotification({ data } as never)).rejects.toThrow('broker unavailable');
  await expect(processor.handleDocumentNotification({ data } as never)).resolves.toBeUndefined();
  expect(f.utility.emit.mock.calls[0][0].cEventKey).toBe(f.utility.emit.mock.calls[1][0].cEventKey);
  expect(f.utility.emit.mock.calls[1][0]).toMatchObject({ nRefuserid: ACTOR, nCaseid: CASE, nUserid: RECIPIENT });
  expect(f.db.rowQuery.mock.calls[0][0]).toContain('u."nCaseid"=s."nCaseid"');
});

it('keeps the source when the durable queue cannot accept the job', async () => {
  const f = fixture({ add: jest.fn().mockRejectedValue(new Error('queue unavailable')) });
  await expect(f.service.copyFile('doc/final.pdf', 'C', null, DOCUMENT, null, null, null, UPLOAD)).resolves.toBe(false);
  expect(fsp.unlink).not.toHaveBeenCalled();
});
