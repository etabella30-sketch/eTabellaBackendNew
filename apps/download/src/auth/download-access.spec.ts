import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import {
    assertCanReadObject, assertCaseAccess, assertFilesInCase, CASE_ACCESS_SQL, FILES_IN_CASE_SQL, KEY_CASE_ACCESS_SQL,
    KEY_DOCUMENT_ACCESS_SQL, parseDocumentKey, presentReportCase, selectionDocumentIds,
} from './download-access';
import { attachmentDisposition } from '../utility/content-disposition';
import { stripQueryParam } from './download-auth.middleware';
import { DOWNLOAD_TICKET_TTL_SECONDS, issueDownloadTicket, verifyDownloadTicket } from './download-ticket';

const USER = '11111111-1111-4111-8111-111111111111';
const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SECTION = 'a5a5a5a5-a5a5-4a5a-8a5a-a5a5a5a5a5a5';

const dbAnswering = (...answers: boolean[]) => ({
    rowQuery: jest.fn(async () => ({ success: true, data: [{ bAllowed: answers.shift() ?? false }] })),
});

describe('parseDocumentKey', () => {
    it.each([
        [`doc/case${CASE}/dc_1.pdf`, { nCaseid: CASE, nZnCaseid: null }],
        [`doc/case${CASE.toUpperCase()}/dc_1.pdf`, { nCaseid: CASE, nZnCaseid: null }],
        ['doc/case1131/dc_366495011.pdf', { nCaseid: null, nZnCaseid: 1131 }],
        ["doc/case1131/dc_1. 2 - Letter (A & B), v1~2 O'Neil.pdf", { nCaseid: null, nZnCaseid: 1131 }],
        ['doc/case999999999/x', { nCaseid: null, nZnCaseid: 999999999 }],
    ])('reads %s', (key, expected) => {
        expect(parseDocumentKey(key)).toEqual(expected);
    });

    it.each([
        '', 'doc', 'doc/', `doc/case${CASE}`, `doc/case${CASE}/`, `doc/case${CASE}/a/b.pdf`, `doc/case${CASE}/.`,
        `doc/case${CASE}/..`, `doc/case${CASE}/a\\b.pdf`, `doc/case${CASE}/a\u0000.pdf`, `doc/case${CASE}/a\n.pdf`,
        `doc/case${CASE}/a\u007f.pdf`, `/doc/case${CASE}/a.pdf`, `doc/case${CASE}/a.pdf/`, 'doc/case0/a.pdf', 'doc/case012/a.pdf',
        'doc/case1234567890/a.pdf', 'doc/case-1/a.pdf', 'doc/case1.5/a.pdf', 'doc/caseabc/a.pdf', 'Doc/case12/a.pdf',
        'profile/users/a.png', 'downloads/x.zip', `doc/case${CASE}/${'a'.repeat(513)}`,
    ])('refuses %j', (key) => {
        expect(parseDocumentKey(key)).toBeNull();
    });

    it('refuses anything that is not a string', () => {
        for (const key of [undefined, null, 12, ['doc/case12/a.pdf'], { toString: () => 'doc/case12/a.pdf' }]) {
            expect(parseDocumentKey(key)).toBeNull();
        }
    });
});

describe('assertCanReadObject', () => {
    it('asks the case rule with the uuid or the legacy integer case, and stops there when it allows', async () => {
        const db = dbAnswering(true, true);
        await assertCanReadObject(db, USER, `doc/case${CASE.toUpperCase()}/a.pdf`);
        await assertCanReadObject(db, USER, 'doc/case1131/a.pdf');
        expect(db.rowQuery.mock.calls).toEqual([
            [KEY_CASE_ACCESS_SQL, [USER, CASE, null]],
            [KEY_CASE_ACCESS_SQL, [USER, null, 1131]],
        ]);
    });

    it('falls back to the documents that store the exact key, only after the case rule refuses', async () => {
        const db = dbAnswering(false, true);
        await assertCanReadObject(db, USER, 'doc/case1154/dc_77.pdf');
        expect(db.rowQuery.mock.calls).toEqual([
            [KEY_CASE_ACCESS_SQL, [USER, null, 1154]],
            [KEY_DOCUMENT_ACCESS_SQL, [USER, 'doc/case1154/dc_77.pdf']],
        ]);
        await expect(assertCanReadObject(dbAnswering(false, false), USER, 'doc/case1154/dc_77.pdf')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses a bad key or caller without asking the database', async () => {
        const db = dbAnswering(true);
        await expect(assertCanReadObject(db, USER, 'profile/users/a.png')).rejects.toBeInstanceOf(ForbiddenException);
        await expect(assertCanReadObject(db, undefined as any, 'doc/case12/a.pdf')).rejects.toBeInstanceOf(ForbiddenException);
        await expect(assertCanReadObject(db, '59', 'doc/case12/a.pdf')).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).not.toHaveBeenCalled();
    });

    it('answers 500 when a lookup fails or throws', async () => {
        await expect(assertCanReadObject({ rowQuery: jest.fn(async () => ({ success: false, error: 'x' })) }, USER, 'doc/case12/a.pdf'))
            .rejects.toBeInstanceOf(InternalServerErrorException);
        await expect(assertCanReadObject({ rowQuery: jest.fn(async () => { throw new Error('x'); }) }, USER, 'doc/case12/a.pdf'))
            .rejects.toBeInstanceOf(InternalServerErrorException);
    });
});

describe('assertCaseAccess', () => {
    it('passes caller, case and section (or null) to CASE_ACCESS_SQL', async () => {
        const db = dbAnswering(true, true, true);
        await assertCaseAccess(db, USER, CASE, SECTION);
        await assertCaseAccess(db, USER, CASE, '');
        await assertCaseAccess(db, USER, CASE, null);
        expect(db.rowQuery.mock.calls).toEqual([
            [CASE_ACCESS_SQL, [USER, CASE, SECTION]],
            [CASE_ACCESS_SQL, [USER, CASE, null]],
            [CASE_ACCESS_SQL, [USER, CASE, null]],
        ]);
        await expect(assertCaseAccess(dbAnswering(false), USER, CASE, SECTION)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses a missing or malformed case, section or caller without asking', async () => {
        const db = dbAnswering(true);
        for (const [user, c, s] of [[USER, null, SECTION], [USER, '', null], [USER, '1131', null], [USER, CASE, '92'],
            [USER, CASE, ['x']], ['', CASE, null], [USER, [CASE], null]] as any[]) {
            await expect(assertCaseAccess(db, user, c, s)).rejects.toBeInstanceOf(ForbiddenException);
        }
        expect(db.rowQuery).not.toHaveBeenCalled();
    });
});

describe('selectionDocumentIds / assertFilesInCase', () => {
    const DOC = 'd0c0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0';

    it('reads the top-level uuid strings of a JSON array, as the SPs match them', () => {
        expect(selectionDocumentIds(JSON.stringify([DOC.toUpperCase(), DOC, 'x', 7, [DOC], { id: DOC }]))).toEqual([DOC]);
        for (const none of [undefined, null, '', '[]', 'null']) expect(selectionDocumentIds(none)).toEqual([]);
        for (const bad of [`{${DOC}}`, `"${DOC}"`, '{}', 'not json', 5, [DOC]]) expect(selectionDocumentIds(bad)).toBeNull();
    });

    it('asks FILES_IN_CASE_SQL with the case and the named ids, and refuses when it says no', async () => {
        const db = dbAnswering(true);
        await assertFilesInCase(db, CASE, JSON.stringify([DOC]));
        expect(db.rowQuery.mock.calls).toEqual([[FILES_IN_CASE_SQL, [CASE, [DOC]]]]);
        await expect(assertFilesInCase(dbAnswering(false), CASE, JSON.stringify([DOC]))).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('does not ask for an empty pick, and refuses a non-array pick or a bad case without asking', async () => {
        const db = dbAnswering(true);
        await assertFilesInCase(db, CASE, '[]');
        await expect(assertFilesInCase(db, CASE, `{${DOC}}`)).rejects.toBeInstanceOf(ForbiddenException);
        await expect(assertFilesInCase(db, null, JSON.stringify([DOC]))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).not.toHaveBeenCalled();
    });

    it("scopes by the document's section, or its bundle's section when it has none", () => {
        expect(FILES_IN_CASE_SQL).toContain('COALESCE(bd."nSectionid", bm."nSectionid")');
        expect(FILES_IN_CASE_SQL).toContain('s."nCaseid" IS DISTINCT FROM $1::uuid');
    });
});

describe('access SQL', () => {
    it('uses the case-membership rule: global admin or a TeamRelation row', () => {
        for (const sql of [KEY_CASE_ACCESS_SQL, CASE_ACCESS_SQL]) {
            expect(sql).toContain('u."isAdmin" = true');
            expect(sql).toContain('"TeamRelation" tr');
        }
        expect(KEY_DOCUMENT_ACCESS_SQL).toContain('"TeamRelation" tr');
        expect(KEY_DOCUMENT_ACCESS_SQL).not.toContain('isAdmin'); // admins pass the first query already
        expect(CASE_ACCESS_SQL).toContain('s."nCaseid" = $2::uuid'); // the section must belong to the case
    });
});

describe('presentReportCase', () => {
    it('reads nCaseid the way PresentReportService decodes params', () => {
        expect(presentReportCase(btoa(JSON.stringify({ nCaseid: CASE, cPname: 'x' })))).toBe(CASE);
        for (const bad of [undefined, '', '%%%', btoa('not json'), btoa('null'), btoa(JSON.stringify({ nCaseid: 5 })), btoa('[]')]) {
            expect(presentReportCase(bad)).toBeNull();
        }
    });
});

describe('stripQueryParam', () => {
    it('drops every spelling qs files under the name and keeps the rest byte for byte', () => {
        const rest = 'nCaseid=a&jFiles=%5B%22x%22%5D&cFilename=A+B%20C&empty=&flag';
        for (const spelled of ['dlt=T', '%64lt=T', 'dlt[]=T', 'dlt[x]=T', '[dlt]=T', 'dlt', 'dlt[a=b]=T']) {
            expect(stripQueryParam(`/download/x?${spelled}&${rest}&${spelled}`, 'dlt')).toBe(`/download/x?${rest}`);
        }
        expect(stripQueryParam('/download/x?dlt=T', 'dlt')).toBe('/download/x');
        expect(stripQueryParam('/download/x', 'dlt')).toBe('/download/x');
        expect(stripQueryParam('/download/x?dltx=1&xdlt=2', 'dlt')).toBe('/download/x?dltx=1&xdlt=2');
    });
});

describe('download tickets', () => {
    it('round-trips a session and expires after the TTL', () => {
        const ticket = issueDownloadTicket('secret', { userId: USER, broweserId: 'b1' });
        expect(verifyDownloadTicket('secret', ticket)).toEqual({ userId: USER, broweserId: 'b1' });
        expect(verifyDownloadTicket('other', ticket)).toBeNull();
        const now = Date.now();
        const clock = jest.spyOn(Date, 'now').mockReturnValue(now + (DOWNLOAD_TICKET_TTL_SECONDS + 1) * 1000);
        expect(verifyDownloadTicket('secret', ticket)).toBeNull();
        clock.mockRestore();
    });

    it('refuses to work without a secret, user or browser', () => {
        expect(() => issueDownloadTicket('', { userId: USER, broweserId: 'b1' })).toThrow();
        expect(() => issueDownloadTicket('secret', { broweserId: 'b1' })).toThrow();
        expect(() => issueDownloadTicket('secret', { userId: USER })).toThrow();
        expect(verifyDownloadTicket('', issueDownloadTicket('secret', { userId: USER, broweserId: 'b1' }))).toBeNull();
        expect(verifyDownloadTicket('secret', 'x'.repeat(3000))).toBeNull();
    });
});

describe('attachmentDisposition', () => {
    it.each([
        ['Exhibit_A-1.pdf', 'attachment; filename="Exhibit_A-1.pdf"'],
        ['My Case.zip', 'attachment; filename="My Case.zip"'],
        ['a"b\\c.pdf', `attachment; filename="a_b_c.pdf"; filename*=UTF-8''a%22b%5Cc.pdf`],
        ['a\r\nSet-Cookie: x=1.pdf', 'attachment; filename="aSet-Cookie: x=1.pdf"'],
        ['報告.pdf', `attachment; filename="__.pdf"; filename*=UTF-8''%E5%A0%B1%E5%91%8A.pdf`],
        ["it's (1)*.pdf", `attachment; filename="it's (1)*.pdf"`],
        ['é\ud800.pdf', `attachment; filename="__.pdf"; filename*=UTF-8''%C3%A9_.pdf`],
        ['', 'attachment; filename="download"'],
        [undefined, 'attachment; filename="download"'],
    ])('%j -> %s', (name, header) => {
        expect(attachmentDisposition(name)).toBe(header);
    });
});
