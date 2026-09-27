import { ForbiddenException } from '@nestjs/common';
import { TeamDataService } from './team-data.service';

const CASE = '11111111-1111-4111-8111-111111111111';
const CALLER = '33333333-3333-4333-8333-333333333333';
const TEAMMATE = '44444444-4444-4444-8444-444444444444';
const STRANGER = '55555555-5555-4555-8555-555555555555';

describe('TeamDataService getuserdetail / checkemail authorization', () => {
    let service: TeamDataService;
    let executeRef: jest.Mock;
    let rowQuery: jest.Mock;
    let inCase: string[];
    let caseAdmins: string[];

    const detailCalls = () => executeRef.mock.calls.filter(([sp, p]) => sp === 'case_user_info' && p.nMasterid);
    const asAdmin = { isAdmin: true } as any;
    const asUser = { isAdmin: false } as any;

    async function expectForbidden(promise: Promise<unknown>) {
        const err = await promise.then(() => null, (e) => e);
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({ msg: -1 });
    }

    beforeEach(() => {
        inCase = [CALLER, TEAMMATE];
        caseAdmins = [];
        executeRef = jest.fn(async (sp: string, p: any) => {
            if (sp === 'case_user_info') {
                const member = p.nCaseid === CASE && inCase.includes(p.nUserid);
                return { success: true, data: [[{ nUserid: p.nUserid, nTeamid: member ? 'team' : null, nRoleid: member ? 'role' : null }]] };
            }
            if (sp === 'checkemail') return { success: true, data: [[{ nUserid: TEAMMATE, cEmail: p.cEmail }]] };
            return { success: false };
        });
        rowQuery = jest.fn(async (_sql: string, [nCaseid, nUserid]: string[]) =>
            ({ success: true, data: nCaseid === CASE && caseAdmins.includes(nUserid) ? [{}] : [] }));
        service = new TeamDataService({ executeRef, rowQuery } as any);
    });

    describe('getuserdetail', () => {
        it('returns the caller their own details without a membership check', async () => {
            await service.getUserDetail({ nUserid: CALLER, nMasterid: CALLER }, asUser);
            expect(executeRef).toHaveBeenCalledTimes(1);
            expect(detailCalls()).toHaveLength(1);
        });

        it('lets a global admin read anyone', async () => {
            await service.getUserDetail({ nUserid: STRANGER, nCaseid: CASE, nMasterid: CALLER }, asAdmin);
            expect(executeRef).toHaveBeenCalledTimes(1);
        });

        it('lets two members of the same case read each other', async () => {
            const res: any = await service.getUserDetail({ nUserid: TEAMMATE, nCaseid: CASE, nMasterid: CALLER }, asUser);
            expect(res[0]).toMatchObject({ nUserid: TEAMMATE });
            expect(detailCalls()).toHaveLength(1);
        });

        it('refuses a user outside the case', async () => {
            await expectForbidden(service.getUserDetail({ nUserid: STRANGER, nCaseid: CASE, nMasterid: CALLER }, asUser));
            expect(detailCalls()).toHaveLength(0);
        });

        it('refuses when the caller is not in the case', async () => {
            inCase = [TEAMMATE];
            await expectForbidden(service.getUserDetail({ nUserid: TEAMMATE, nCaseid: CASE, nMasterid: CALLER }, asUser));
            expect(detailCalls()).toHaveLength(0);
        });

        it('refuses another user when no case is named', async () => {
            await expectForbidden(service.getUserDetail({ nUserid: TEAMMATE, nMasterid: CALLER }, asUser));
            expect(executeRef).not.toHaveBeenCalled();
        });
    });

    describe('checkemail', () => {
        const q = { cEmail: 'someone@example.test', nCaseid: CASE, nMasterid: CALLER };

        it('is open to a global admin', async () => {
            await expect(service.getCheckEmail(q, asAdmin)).resolves.toMatchObject({ nUserid: TEAMMATE });
            expect(rowQuery).not.toHaveBeenCalled();
        });

        it('is open to a case admin of nCaseid', async () => {
            caseAdmins = [CALLER];
            await expect(service.getCheckEmail(q, asUser)).resolves.toMatchObject({ nUserid: TEAMMATE });
        });

        it('is refused to everyone else', async () => {
            await expectForbidden(service.getCheckEmail(q, asUser));
            expect(executeRef).not.toHaveBeenCalled();
        });
    });
});
