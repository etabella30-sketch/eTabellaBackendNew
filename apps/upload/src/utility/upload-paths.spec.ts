import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
    HELP_IMAGE_EXTENSIONS, PROFILE_IMAGE_EXTENSIONS,
    UPLOAD_CHUNK_ROOT, chunkDestination, chunkDirFor, chunkFileFor, chunkFilename, imageDestination, imageFilename,
    isChunkNumber, isOptionalIdSegment, isSafeChunkIdentifier, isSafeIdSegment, isUploadFileType, isUploadName,
    resolveInside, resolveUploadDocPath, safeImageExtension,
} from './upload-paths';
import { UPLOAD_CHUNK_GATE } from '../auth/upload-access';

const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('upload-paths', () => {
    it('isSafeChunkIdentifier: real file-name identifiers pass, anything that names another folder does not', () => {
        for (const ok of [
            'Report.pdf_2b8c7a9e-4f1d-4c3a-9d2e-7a6b5c4d3e2f',
            `Exhibit 12 (final) – Smith & Co's [v2] #3 +50%.pdf_uuid`,
            'مستند.pdf_uuid',
            '.hidden_uuid',
            'x'.repeat(255),
        ]) expect([ok, isSafeChunkIdentifier(ok)]).toEqual([ok, true]);
        for (const bad of [
            '', '.', '..', '../x', 'a/b', 'a\\b', '..\\x', 'a..b', 'x\u0000y', 'x\ny', 'x\u007fy',
            'x'.repeat(256), 'é'.repeat(128), undefined, null, 5, ['id'], { id: 'x' },
        ]) expect([bad, isSafeChunkIdentifier(bad)]).toEqual([bad, false]);
    });

    it('isChunkNumber: digits only', () => {
        for (const ok of ['0', '12', 999999999, 0]) expect(isChunkNumber(ok)).toBe(true);
        for (const bad of ['', '-1', '1.js', '1e3', ' 1', '../1', 1.5, -1, 1e21, '1234567890', undefined, ['1']]) {
            expect([bad, isChunkNumber(bad)]).toEqual([bad, false]);
        }
    });

    it('id segments, names and file types', () => {
        expect(isSafeIdSegment(CASE)).toBe(true);
        expect(isSafeIdSegment('1091')).toBe(true);
        expect(isSafeIdSegment(1091)).toBe(true);
        for (const bad of ['', '../x', 'a/b', 'a.b', -1, 1.5, null, undefined]) expect([bad, isSafeIdSegment(bad)]).toEqual([bad, false]);
        for (const ok of [undefined, null, '', 0, '0', 'null', 'undefined', CASE]) expect([ok, isOptionalIdSegment(ok)]).toEqual([ok, true]);
        expect(isOptionalIdSegment('../../x')).toBe(false);
        for (const ok of ['file_123456789', 's_9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f']) expect(isUploadName(ok)).toBe(true);
        for (const bad of ['', '../x', 'a b', 'a;b', '$(x)', 'a.b']) expect([bad, isUploadName(bad)]).toEqual([bad, false]);
        for (const ok of ['PDF', 'docx', 'README', 'BACKUP_2024', 'TAR-GZ', 'ÉTUDE']) expect([ok, isUploadFileType(ok)]).toEqual([ok, true]);
        for (const bad of ['', 'PDF;x', 'MY FILE', 'a/b', 'a\\b', 'a.b', '$(x)', 'x'.repeat(33)]) expect([bad, isUploadFileType(bad)]).toEqual([bad, false]);
    });

    it('resolveInside stays strictly inside the base', () => {
        expect(resolveInside('/base', 'a/b')).toBe(path.resolve('/base', 'a/b'));
        for (const bad of ['', '.', '..', '../x', 'a/../../x', path.resolve('/elsewhere'), 'x\u0000']) {
            expect([bad, resolveInside('/base', bad)]).toEqual([bad, null]);
        }
    });

    it('chunk paths live under the chunk root', () => {
        expect(chunkDirFor('abc_1')).toBe(path.resolve(UPLOAD_CHUNK_ROOT, 'abc_1'));
        expect(chunkFileFor('abc_1', 3)).toBe(path.resolve(UPLOAD_CHUNK_ROOT, 'abc_1', '3'));
        expect(chunkDirFor('..')).toBeNull();
        expect(chunkFileFor('abc_1', '../3')).toBeNull();
    });

    it('resolveUploadDocPath accepts only doc/case<id>/<name>.<type> for the given case', () => {
        expect(resolveUploadDocPath('./assets/', `doc/case${CASE}/file_1.PDF`, CASE)).toBe(path.resolve(`assets/doc/case${CASE}/file_1.PDF`));
        expect(resolveUploadDocPath('./assets/', 'doc/case1091/dc_12.pdf', 1091)).toBe(path.resolve('assets/doc/case1091/dc_12.pdf'));
        expect(resolveUploadDocPath('./assets/', 'doc/case1091/dc_12.pdf')).toBe(path.resolve('assets/doc/case1091/dc_12.pdf'));
        for (const bad of [
            `doc/case${CASE}/../x.PDF`, `doc/case${CASE}/sub/file_1.PDF`, `/doc/case${CASE}/file_1.PDF`, `doc/case${CASE}/file_1`,
            `doc/case${CASE}/file_1.PDF;x`, `doc/case${CASE}/file 1.PDF`, `doc/case${CASE}/.PDF`, 'doc/case/file_1.PDF', `../doc/case${CASE}/file_1.PDF`,
        ]) expect([bad, resolveUploadDocPath('./assets/', bad)]).toEqual([bad, null]);
        expect(resolveUploadDocPath('./assets/', `doc/case${CASE}/file_1.PDF`, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')).toBeNull();
        expect(resolveUploadDocPath(undefined, `doc/case${CASE}/file_1.PDF`)).toBeNull();
    });

    it('safeImageExtension keeps plain extensions only', () => {
        expect(safeImageExtension('a.png')).toBe('.png');
        expect(safeImageExtension('Screenshot 2024-01-01 at 10.00.00.JPEG')).toBe('.JPEG');
        expect(safeImageExtension('noext')).toBe('');
        for (const bad of ['x.png;id', 'x.$(id)', 'x.p ng', 'x.' + 'a'.repeat(11), undefined]) expect([bad, safeImageExtension(bad)]).toEqual([bad, null]);
    });

    it('safeImageExtension with an allow-list keeps only those image types (any case)', () => {
        expect(safeImageExtension('Photo.JPG', PROFILE_IMAGE_EXTENSIONS)).toBe('.JPG');
        expect(safeImageExtension('a.jpeg', PROFILE_IMAGE_EXTENSIONS)).toBe('.jpeg');
        expect(safeImageExtension('a.webp', PROFILE_IMAGE_EXTENSIONS)).toBe('.webp');
        expect(safeImageExtension('a.gif', HELP_IMAGE_EXTENSIONS)).toBe('.gif');
        for (const bad of ['page.html', 'x.htm', 'x.svg', 'x.SVG', 'x.js', 'x.xhtml', 'x.pdf', 'noext', 'x.png;id']) {
            expect([bad, safeImageExtension(bad, PROFILE_IMAGE_EXTENSIONS), safeImageExtension(bad, HELP_IMAGE_EXTENSIONS)]).toEqual([bad, null, null]);
        }
        expect(safeImageExtension('a.gif', PROFILE_IMAGE_EXTENSIONS)).toBeNull(); // no webp would ever be made for it
    });

    describe('multer callbacks refuse before touching the disk', () => {
        let mkdir: jest.SpyInstance;
        beforeEach(() => { mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined); });
        afterEach(() => mkdir.mockRestore());

        const run = (fn: (req: any, file: any, cb: (e: Error | null, v: string) => void) => void, body: any, file: any = { originalname: 'blob' }, req: any = {}) =>
            new Promise<[Error | null, string]>((resolve) => fn({ ...req, body }, file, (e, v) => resolve([e, v])));
        const opened = { [UPLOAD_CHUNK_GATE]: jest.fn(async () => undefined) };

        it.each([
            [{}],                                                              // file part sent before the fields
            [{ identifier: 'ok', chunkNumber: '1', nUPid: '../x' }],
            [{ identifier: ['ok', '../x'], chunkNumber: '1' }],                // duplicate field -> array
            [{ identifier: 'ok', chunkNumber: ['1', '2'] }],
            [{ identifier: '../x', chunkNumber: '1' }],
        ])('chunkDestination refuses %j', async (body) => {
            const [err] = await run(chunkDestination, body, undefined, opened);
            expect(err).toBeInstanceOf(BadRequestException);
            expect(mkdir).not.toHaveBeenCalled();
            expect(opened[UPLOAD_CHUNK_GATE]).not.toHaveBeenCalled();
        });

        it('chunkDestination asks the chunk gate before mkdir, and refuses without one', async () => {
            const body = { identifier: 'Report.pdf_uuid', chunkNumber: '4' };
            expect((await run(chunkDestination, body))[0]).toBeInstanceOf(ForbiddenException);
            const closed = { [UPLOAD_CHUNK_GATE]: jest.fn(async () => { throw new ForbiddenException('not yours'); }) };
            const [err] = await run(chunkDestination, body, undefined, closed);
            expect(err).toBeInstanceOf(ForbiddenException);
            expect(closed[UPLOAD_CHUNK_GATE]).toHaveBeenCalledWith('Report.pdf_uuid');
            expect(mkdir).not.toHaveBeenCalled();
        });

        it('chunkDestination / chunkFilename accept a legit chunk', async () => {
            const body = { identifier: 'Report.pdf_uuid', chunkNumber: '4', nUPid: 'null' };
            expect(await run(chunkDestination, body, undefined, opened)).toEqual([null, path.resolve(UPLOAD_CHUNK_ROOT, 'Report.pdf_uuid')]);
            expect(opened[UPLOAD_CHUNK_GATE]).toHaveBeenCalledWith('Report.pdf_uuid');
            expect(await run(chunkFilename, body)).toEqual([null, '4']);
            expect((await run(chunkFilename, { identifier: 'ok', chunkNumber: '../4' }))[0]).toBeInstanceOf(BadRequestException);
        });

        it('imageDestination / imageFilename check rootPath and extension before mkdir', async () => {
            const dest = imageDestination(() => './assets/profile/', true, PROFILE_IMAGE_EXTENSIONS);
            expect((await run(dest, { rootPath: '../x' }, { originalname: 'a.png' }))[0]).toBeInstanceOf(BadRequestException);
            expect((await run(dest, { rootPath: ['users', 'x'] }, { originalname: 'a.png' }))[0]).toBeInstanceOf(BadRequestException);
            expect((await run(dest, { rootPath: 'users' }, { originalname: 'a.png;id' }))[0]).toBeInstanceOf(BadRequestException);
            expect((await run(dest, { rootPath: 'users' }, { originalname: 'a.svg' }))[0]).toBeInstanceOf(BadRequestException);
            expect((await run(dest, { rootPath: 'users' }, { originalname: 'a.html' }))[0]).toBeInstanceOf(BadRequestException);
            expect((await run(dest, { rootPath: 'users' }, { originalname: 'blob' }))[0]).toBeInstanceOf(BadRequestException);
            expect(mkdir).not.toHaveBeenCalled();
            expect(await run(dest, { rootPath: 'users' }, { originalname: 'a.png' })).toEqual([null, './assets/profile/users']);
            const [, name] = await run(imageFilename('user', PROFILE_IMAGE_EXTENSIONS), {}, { originalname: 'a.png' });
            expect(name).toMatch(/^user\d+\.png$/);
            expect((await run(imageFilename('user', PROFILE_IMAGE_EXTENSIONS), {}, { originalname: 'a.png;id' }))[0]).toBeInstanceOf(BadRequestException);
            expect((await run(imageFilename('ticket_', HELP_IMAGE_EXTENSIONS), {}, { originalname: 'a.svg' }))[0]).toBeInstanceOf(BadRequestException);
        });
    });
});
