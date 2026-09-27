import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import {
    UPLOAD_CASE_ACCESS_SQL, UPLOAD_DOCUMENT_ACCESS_SQL, assertCanReadObjectKey, assertDocumentAccess, assertUploadCaseAccess,
    caseOfObjectKey, uploadRowIdsOf,
} from './upload-access';

const USER = '11111111-1111-4111-8111-111111111111';
const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SECTION = 'aaaaaaaa-0000-4000-8000-000000000001';
const DOC = 'aaaaaaaa-0000-4000-8000-000000000003';
const ALL_TRUE = { bCase: true, bAllowed: true, bSectionInCase: true, bBundleInCase: true, bDocumentsInCase: true, bUploadsInCase: true, bUploadRowsInCase: true };

const dbAnswering = (row: Record<string, unknown>) => ({ rowQuery: jest.fn(async () => ({ success: true, data: [row] })) });

describe('upload-access', () => {
    beforeAll(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterAll(() => jest.restoreAllMocks());

    it('the SQL is the fleet rule: a global admin, or an ACTIVE (cStatus A) team member of the case', () => {
        for (const sql of [UPLOAD_CASE_ACCESS_SQL, UPLOAD_DOCUMENT_ACCESS_SQL]) {
            expect(sql).toContain('u."isAdmin" = true');
            expect(sql).toContain('"TeamRelation" tr');
            expect(sql).toContain(`tr."cStatus" = 'A'`);
        }
        // a document's case is its section's, or its bundle's section's
        expect(UPLOAD_CASE_ACCESS_SQL).toContain('COALESCE(bd."nSectionid", bm."nSectionid")');
        expect(UPLOAD_DOCUMENT_ACCESS_SQL).toContain('COALESCE(bd."nSectionid", bm."nSectionid")');
    });

    describe('assertUploadCaseAccess', () => {
        it('sends the caller, the case and every id (lower-cased, de-duplicated; empty values dropped) in one query', async () => {
            const db = dbAnswering(ALL_TRUE);
            await assertUploadCaseAccess(db, USER, {
                nCaseid: CASE.toUpperCase(), nSectionid: SECTION, nBundleid: '00000000-0000-0000-0000-000000000000',
                nBundledetailids: [DOC, DOC.toUpperCase(), 0, '0', null, 'null', undefined, ''], nUPids: ['undefined'], nUDids: [],
            });
            expect(db.rowQuery).toHaveBeenCalledWith(UPLOAD_CASE_ACCESS_SQL, [USER, CASE, SECTION, null, [DOC], [], []]);
        });

        it.each([
            ['a caller that is not a uuid', 'x', { nCaseid: CASE }],
            ['no case', USER, {}],
            ['case "0"', USER, { nCaseid: '0' }],
            ['a legacy integer case', USER, { nCaseid: 1091 }],
            ['a case that is not a uuid', USER, { nCaseid: '../case' }],
            ['a section that is not a uuid', USER, { nCaseid: CASE, nSectionid: '1' }],
            ['a document list with a non-uuid', USER, { nCaseid: CASE, nBundledetailids: [DOC, 'x'] }],
            ['an upload row that is an object', USER, { nCaseid: CASE, nUDids: [{}] }],
        ] as Array<[string, unknown, any]>)('refuses %s without a query', async (_what, user, targets) => {
            const db = dbAnswering(ALL_TRUE);
            await expect(assertUploadCaseAccess(db, user, targets)).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.rowQuery).not.toHaveBeenCalled();
        });

        it.each(Object.keys(ALL_TRUE))('refuses when %s is not true', async (flag) => {
            await expect(assertUploadCaseAccess(dbAnswering({ ...ALL_TRUE, [flag]: false }), USER, { nCaseid: CASE }))
                .rejects.toBeInstanceOf(ForbiddenException);
            await expect(assertUploadCaseAccess(dbAnswering({ ...ALL_TRUE, [flag]: null }), USER, { nCaseid: CASE }))
                .rejects.toBeInstanceOf(ForbiddenException);
        });

        it('answers 500 when the lookup fails, throws or returns no rows array', async () => {
            for (const rowQuery of [
                jest.fn(async () => ({ success: false, error: 'down' })),
                jest.fn(async () => { throw new Error('down'); }),
                jest.fn(async () => ({ success: true, data: null })),
            ]) {
                await expect(assertUploadCaseAccess({ rowQuery } as any, USER, { nCaseid: CASE })).rejects.toBeInstanceOf(InternalServerErrorException);
            }
            await expect(assertUploadCaseAccess(dbAnswering(undefined as any) as any, USER, { nCaseid: CASE })).rejects.toBeInstanceOf(ForbiddenException);
        });
    });

    describe('assertDocumentAccess (ocr/ocrfile)', () => {
        it('asks for the caller and the document; refuses a false answer, a missing or malformed id', async () => {
            const yes = dbAnswering({ bAllowed: true });
            await assertDocumentAccess(yes, USER, DOC.toUpperCase());
            expect(yes.rowQuery).toHaveBeenCalledWith(UPLOAD_DOCUMENT_ACCESS_SQL, [USER, DOC]);
            await expect(assertDocumentAccess(dbAnswering({ bAllowed: false }), USER, DOC)).rejects.toBeInstanceOf(ForbiddenException);
            for (const bad of [undefined, null, '', '0', 'x']) {
                const db = dbAnswering({ bAllowed: true });
                await expect(assertDocumentAccess(db, USER, bad)).rejects.toBeInstanceOf(ForbiddenException);
                expect(db.rowQuery).not.toHaveBeenCalled();
            }
        });
    });

    describe('caseOfObjectKey / assertCanReadObjectKey (get-file-url)', () => {
        it.each([
            [`doc/case${CASE}/file_1.PDF`, CASE],
            [`doc/case${CASE.toUpperCase()}/file_1.PDF`, CASE],
            [`doc/case${CASE}/${DOC}/Re: minutes (final).html`, CASE],
        ])('%j belongs to %s', (key, nCaseid) => expect(caseOfObjectKey(key)).toBe(nCaseid));

        it.each([
            'profile/users/a.webp', 'doc/case1091/file_1.PDF', `doc/case${CASE}`, `doc/case${CASE}/`, `doc/case${CASE}//a`,
            `doc/case${CASE}/../x`, `doc/case${CASE}/a/./b`, `doc/case${CASE}/a\\b`, `doc/case${CASE}/a\u0000b`, `doc/case${CASE}/a\nb`,
            `/doc/case${CASE}/a`, `xdoc/case${CASE}/a`, `doc/case${CASE}/${'a'.repeat(1024)}`, undefined, 42,
        ])('%j is not a case document key', (key) => expect(caseOfObjectKey(key)).toBeNull());

        it('checks the key\'s case, and refuses any other key without a query', async () => {
            const db = dbAnswering(ALL_TRUE);
            await assertCanReadObjectKey(db, USER, `doc/case${CASE}/file_1.PDF`);
            expect(db.rowQuery).toHaveBeenCalledWith(UPLOAD_CASE_ACCESS_SQL, [USER, CASE, null, null, [], [], []]);
            const untouched = dbAnswering(ALL_TRUE);
            await expect(assertCanReadObjectKey(untouched, USER, 'profile/users/a.webp')).rejects.toBeInstanceOf(ForbiddenException);
            expect(untouched.rowQuery).not.toHaveBeenCalled();
        });
    });

    describe('uploadRowIdsOf (exports/delete-files jFiles, read as et_upload_deletefiles reads it)', () => {
        it.each([
            [JSON.stringify([DOC, SECTION]), [DOC, SECTION]],   // the legacy app sends the array JSON-encoded
            [[DOC], [DOC]],
            [JSON.stringify(DOC), [DOC]],
            [JSON.stringify([DOC, [SECTION], { x: SECTION }, 1]), [DOC]], // only top-level strings can match a row
            ['[]', []],
        ])('%j -> %j', (jFiles, ids) => expect(uploadRowIdsOf(jFiles)).toEqual(ids));

        it.each(['not json', JSON.stringify({ x: DOC }), '1', 'null', undefined, 7])('%j is refused (null)', (jFiles) => {
            expect(uploadRowIdsOf(jFiles)).toBeNull();
        });
    });
});
