import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FileMergeProcessor } from './file.specify.merge.processor';
import { MergeProcessor } from './merge.processor';
import { UploadService } from '../upload.service';

// The two Bull processors that turn the upload's identifier / cPath / name / filetype into disk
// work: FileMergeProcessor appends chunk files to the document (and unlinks the chunks);
// MergeProcessor makes the case folder, verifies and records the document, queues it for s3cmd and
// removes the chunk folder recursively. Each test runs in its own empty temp working directory
// (the chunk root and ASSETS are relative to it, as in production).

const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const UPID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const ID = `Exhibit 12 (final) & Co.pdf_2b8c7a9e-4f1d-4c3a-9d2e-7a6b5c4d3e2f`;
const config = { get: (k: string) => ({ ASSETS: './assets/' } as Record<string, string>)[k] };
const logs = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), report: jest.fn() };
const utility = { emit: jest.fn() };

const put = (rel: string, text: string) => {
    fs.mkdirSync(path.dirname(rel), { recursive: true });
    fs.writeFileSync(rel, text);
};

describe('merge processors keep every read, append and delete in place', () => {
    let home: string;
    let work: string;

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        home = process.cwd();
    });
    afterAll(() => jest.restoreAllMocks());

    beforeEach(() => {
        jest.clearAllMocks();
        work = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-merge-'));
        process.chdir(work);
    });
    afterEach(() => {
        process.chdir(home);
        fs.rmSync(work, { recursive: true, force: true });
    });

    describe('FileMergeProcessor.mergeChunks', () => {
        const processor = () => new FileMergeProcessor(new UploadService(config as any), {} as any, utility as any, { add: jest.fn() } as any, config as any, logs as any);
        const doc = `doc/case${CASE}/file_123.PDF`;

        it('still appends the chunks, in order, to the document and removes them', async () => {
            put(`assets/upload-chunks/${ID}/0`, 'aa');
            put(`assets/upload-chunks/${ID}/1`, 'bb');
            fs.mkdirSync(`assets/doc/case${CASE}`, { recursive: true });
            await processor().mergeChunks(0, 1, ID, doc);
            expect(fs.readFileSync(`assets/${doc}`, 'utf8')).toBe('aabb');
            expect(fs.readdirSync(`assets/upload-chunks/${ID}`)).toEqual([]);
        });

        it.each([
            '../escaped.txt',
            `doc/case${CASE}/../../../escaped.PDF`,
            'doc/../escaped.PDF',
            `doc/case${CASE}/file_1.PDF;touch pwned`,
        ])('refuses to append to %j and leaves the chunks alone', async (savePath) => {
            put(`assets/upload-chunks/${ID}/0`, 'aa');
            await expect(processor().mergeChunks(0, 0, ID, savePath)).rejects.toThrow();
            expect(fs.existsSync('escaped.txt')).toBe(false);
            expect(fs.existsSync('escaped.PDF')).toBe(false);
            expect(fs.existsSync('assets/escaped.PDF')).toBe(false);
            expect(fs.readFileSync(`assets/upload-chunks/${ID}/0`, 'utf8')).toBe('aa');
        });

        it('refuses a traversal identifier: nothing outside the chunk root is read or unlinked', async () => {
            put('victim/0', 'secret');
            fs.mkdirSync(`assets/doc/case${CASE}`, { recursive: true });
            await expect(processor().mergeChunks(0, 0, '../../victim', doc)).rejects.toThrow();
            expect(fs.readFileSync('victim/0', 'utf8')).toBe('secret');
            expect(fs.existsSync(`assets/${doc}`)).toBe(false);
        });
    });

    describe('MergeProcessor.handleMerge / deleteChunks', () => {
        let fileInfo: any;
        let queues: Record<string, { add: jest.Mock }>;
        let fsService: { createDirectoryHierarchy: jest.Mock };
        let verify: { verifyFile: jest.Mock };
        const rds = { deleteList: jest.fn(), deleteChunks: jest.fn() };

        const processor = () => {
            fileInfo = {
                updateFileInfo: jest.fn(async () => ({ msg: 1, nBundledetailid: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' })),
                jobStart: jest.fn(async () => ({ msg: -1 })),
                convertLog: jest.fn(),
            };
            queues = Object.fromEntries(['unzip', 'copy', 'snap', 'ocr', 'convert', 'email', 'delete'].map((k) => [k, { add: jest.fn(async () => ({})) }]));
            fsService = { createDirectoryHierarchy: jest.fn(async () => true) };
            verify = { verifyFile: jest.fn(async () => ({ isValidate: true, totalpages: 1, pagerotation: 0 })) };
            return new MergeProcessor(
                new UploadService(config as any), verify as any, fsService as any, config as any, fileInfo, rds as any, logs as any,
                queues.unzip as any, utility as any, queues.copy as any, queues.snap as any, queues.ocr as any,
                queues.convert as any, queues.email as any, queues.delete as any,
            );
        };
        const job = (data: Record<string, unknown>) => ({
            data: { identifier: ID, nUPid: UPID, nCaseid: CASE, name: 'file_123', filetype: 'PDF', filesize: 11, nUDid: null, ...data },
        }) as any;

        it('a legit merge still records the document, queues it for S3 and removes its chunk folder', async () => {
            put(`assets/upload-chunks/${ID}/0`, 'aa');
            await processor().handleMerge(job({}));
            expect(fsService.createDirectoryHierarchy).toHaveBeenCalledWith(`doc/case${CASE}`);
            expect(verify.verifyFile).toHaveBeenCalledWith(path.resolve(`assets/doc/case${CASE}/file_123.PDF`));
            expect(queues.copy.add).toHaveBeenCalledWith(expect.objectContaining({ cPath: `doc/case${CASE}/file_123.PDF` }), expect.anything());
            expect(fs.existsSync(`assets/upload-chunks/${ID}`)).toBe(false);
        });

        it.each([
            [{ identifier: '../../victim' }],
            [{ identifier: '..' }],
            [{ name: '../../../victim/escaped' }],
            [{ filetype: 'PDF;touch pwned' }],
            [{ nCaseid: '../../victim' }],
        ])('refuses %j: no folder made, nothing recorded or queued, nothing deleted', async (override) => {
            put('victim/keep.txt', 'keep');
            put(`assets/upload-chunks/${ID}/0`, 'aa');
            await processor().handleMerge(job(override));
            expect(fsService.createDirectoryHierarchy).not.toHaveBeenCalled();
            expect(verify.verifyFile).not.toHaveBeenCalled();
            expect(fileInfo.updateFileInfo).not.toHaveBeenCalled();
            for (const q of Object.values(queues)) expect(q.add).not.toHaveBeenCalled();
            expect(utility.emit).toHaveBeenCalledWith(expect.objectContaining({ event: 'MERGING-FAILED' }));
            expect(fs.readFileSync('victim/keep.txt', 'utf8')).toBe('keep');
            expect(fs.existsSync(`assets/upload-chunks/${ID}/0`)).toBe(true);
        });

        it('deleteChunks removes only the identifier\'s own folder inside the chunk root', async () => {
            put('victim/keep.txt', 'keep');
            put('assets/upload-chunks/ok-id/0', 'aa');
            const p = processor();
            await p.deleteChunks(path.resolve('victim'), 'ok-id');
            await p.deleteChunks('victim', '../../victim');
            expect(fs.readFileSync('victim/keep.txt', 'utf8')).toBe('keep');
            await p.deleteChunks('./assets/upload-chunks/ok-id', 'ok-id');
            expect(fs.existsSync('assets/upload-chunks/ok-id')).toBe(false);
        });
    });
});
