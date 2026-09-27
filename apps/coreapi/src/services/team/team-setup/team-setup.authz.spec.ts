import { ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TeamSetupService } from './team-setup.service';
import { UserBuilderReq, UserDeleteReq } from 'apps/coreapi/src/interfaces/team-setup.interface';

const CASE = '11111111-1111-4111-8111-111111111111';
const OTHER_CASE = '22222222-2222-4222-8222-222222222222';
const CALLER = '33333333-3333-4333-8333-333333333333';
const MEMBER = '44444444-4444-4444-8444-444444444444';
const OUTSIDER = '55555555-5555-4555-8555-555555555555';
const GLOBAL_ADMIN = '66666666-6666-4666-8666-666666666666';
const TEAM = '77777777-7777-4777-8777-777777777777';
const FOREIGN_TEAM = '88888888-8888-4888-8888-888888888888';
const ROLE = '99999999-9999-4999-8999-999999999999';
const OTHER_ROLE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const NOBODY = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

/** et_case_user_info rows: MEMBER and GLOBAL_ADMIN are in CASE, OUTSIDER is not, NOBODY does not exist. */
const USERS: Record<string, any> = {
    [MEMBER]: { nUserid: MEMBER, cFname: 'Mia', cLname: 'Member', cEmail: 'mia@example.test', nTeamid: TEAM, nRoleid: ROLE, isAdmin: false },
    [GLOBAL_ADMIN]: { nUserid: GLOBAL_ADMIN, cFname: 'Gil', cLname: 'Admin', cEmail: 'gil@example.test', nTeamid: TEAM, nRoleid: ROLE, isAdmin: true },
    [OUTSIDER]: { nUserid: OUTSIDER, cFname: 'Oli', cLname: 'Out', cEmail: 'oli@example.test', nTeamid: null, nRoleid: null, isAdmin: false },
};

describe('TeamSetupService userbuilder / userdelete authorization', () => {
    let service: TeamSetupService;
    let executeRef: jest.Mock;
    let rowQuery: jest.Mock;
    let hashPassword: jest.Mock;
    let deleteValue: jest.Mock;
    let caseAdminOf: string[];

    const spCalls = (name: string) => executeRef.mock.calls.filter(([sp]) => sp === name);
    const asAdmin = { isAdmin: true } as any;
    const asUser = { isAdmin: false } as any;

    async function expectForbidden(promise: Promise<unknown>) {
        const err = await promise.then(() => null, (e) => e);
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({ msg: -1 });
    }

    beforeEach(() => {
        caseAdminOf = [CASE];
        executeRef = jest.fn(async (sp: string, params: any) => {
            switch (sp) {
                case 'userbuilder': return { success: true, data: [[{ msg: 1, value: 'Saved', nUserid: params.nUserid ?? 'new-id' }]] };
                case 'user_team_management': return { success: true, data: [[{ msg: 1, value: 'Success' }]] };
                case 'combo_teams': return { success: true, data: [params.nCaseid === CASE ? [{ nTeamid: TEAM }] : [{ nTeamid: FOREIGN_TEAM }]] };
                case 'case_user_info': return { success: true, data: [USERS[params.nUserid] ? [USERS[params.nUserid]] : []] };
                default: return { success: false, error: `unexpected ${sp}` };
            }
        });
        // isCaseAdmin(): TeamRelation row with the Case Admin role
        rowQuery = jest.fn(async (_sql: string, [nCaseid, nUserid]: string[]) =>
            ({ success: true, data: nUserid === CALLER && caseAdminOf.includes(nCaseid) ? [{ '?column?': 1 }] : [] }));
        hashPassword = jest.fn(async (p: string) => `hashed:${p}`);
        deleteValue = jest.fn();
        service = new TeamSetupService({ executeRef, rowQuery } as any, { hashPassword } as any, { deleteValue } as any);
    });

    /** A legacy-style edit of MEMBER by CALLER: current name/email re-sent, team change. */
    const memberEdit = (patch: Partial<UserBuilderReq> = {}): UserBuilderReq => ({
        nUserid: MEMBER, cFname: 'Mia', cLname: 'Member', cEmail: 'mia@example.test' as any, cPassword: '',
        cProfile: '', nTZid: 1, nRoleid: ROLE, nCaseid: CASE, nTeamid: TEAM, permission: 'E', nMasterid: CALLER,
        ...patch,
    } as UserBuilderReq);

    describe('global admin', () => {
        it('creates a user and assigns the team, as before', async () => {
            const body = { ...memberEdit({ nUserid: undefined, permission: 'N', cPassword: 'Secret#1' }), nMasterid: GLOBAL_ADMIN } as UserBuilderReq;
            const res = await service.userBuilder(body, asAdmin);
            expect(res).toMatchObject({ msg: 1 });
            expect(spCalls('userbuilder')).toHaveLength(1);
            expect(spCalls('userbuilder')[0][1].cPassword).toBe('hashed:Secret#1');
            expect(spCalls('user_team_management')).toHaveLength(1);
            expect(rowQuery).not.toHaveBeenCalled();
        });

        it("changes another user's name, email and password", async () => {
            const body = { ...memberEdit({ cEmail: 'new@example.test' as any, cPassword: 'Reset#2' }), nMasterid: GLOBAL_ADMIN } as UserBuilderReq;
            await service.userBuilder(body, asAdmin);
            expect(spCalls('userbuilder')[0][1]).toMatchObject({ nUserid: MEMBER, cEmail: 'new@example.test', cPassword: 'hashed:Reset#2' });
        });
    });

    describe('self edit', () => {
        it('saves the own profile but drops case, team and role', async () => {
            const body = memberEdit({ nUserid: CALLER, cFname: 'New', cPassword: 'Mine#3' });
            const res = await service.userBuilder(body, asUser);
            expect(res).toMatchObject({ msg: 1 });
            const sent = spCalls('userbuilder')[0][1];
            expect(sent).toMatchObject({ nUserid: CALLER, cFname: 'New', cPassword: 'hashed:Mine#3', permission: 'E' });
            expect(sent).not.toHaveProperty('nTeamid');
            expect(sent).not.toHaveProperty('nRoleid');
            expect(sent).not.toHaveProperty('nCaseid');
            expect(spCalls('user_team_management')).toHaveLength(0);
        });

        it('matches the caller id case-insensitively', async () => {
            await service.userBuilder(memberEdit({ nUserid: CALLER.toUpperCase(), nTeamid: undefined }), asUser);
            expect(spCalls('userbuilder')).toHaveLength(1);
        });
    });

    describe('case admin (non-global)', () => {
        it("moves a member of their case to one of the case's teams without touching UserMaster", async () => {
            const res = await service.userBuilder(memberEdit(), asUser);
            expect(res).toMatchObject({ msg: 1, nUserid: MEMBER, nTeamid: TEAM });
            expect(spCalls('userbuilder')).toHaveLength(0);
            expect(spCalls('user_team_management')).toHaveLength(1);
            expect(spCalls('user_team_management')[0][1]).toEqual({ nUserid: MEMBER, nTeamid: TEAM, nRoleid: ROLE, nCaseid: CASE, nMasterid: CALLER });
            expect(rowQuery).toHaveBeenCalledWith(expect.stringContaining('"TeamRelation"'), [CASE, CALLER, '8632ee5c-e854-411c-b83d-c21656ad39ac']);
        });

        it('keeps the current role when nRoleid is omitted (legacy dialog disables the control)', async () => {
            await service.userBuilder(memberEdit({ nRoleid: undefined }), asUser);
            expect(spCalls('user_team_management')[0][1]).toEqual({ nUserid: MEMBER, nTeamid: TEAM, nRoleid: ROLE, nCaseid: CASE, nMasterid: CALLER });
        });

        it('keeps the current role when nRoleid arrives null (IsItUUID maps empty to null)', async () => {
            await service.userBuilder(memberEdit({ nRoleid: null as any }), asUser);
            expect(spCalls('user_team_management')[0][1].nRoleid).toBe(ROLE);
        });

        it('still applies an explicitly sent role', async () => {
            await service.userBuilder(memberEdit({ nRoleid: OTHER_ROLE }), asUser);
            expect(spCalls('user_team_management')[0][1].nRoleid).toBe(OTHER_ROLE);
        });

        /** The legacy "Add user" dialog: an existing org user found by email, not yet in CASE. */
        const outsiderAdd = (patch: Partial<UserBuilderReq> = {}) =>
            memberEdit({ nUserid: OUTSIDER, cFname: 'Oli', cLname: 'Out', cEmail: 'oli@example.test' as any, ...patch });

        it('adds an existing user who is not yet in the case to one of its teams', async () => {
            const res = await service.userBuilder(outsiderAdd(), asUser);
            expect(res).toMatchObject({ msg: 1, nUserid: OUTSIDER, nTeamid: TEAM });
            expect(spCalls('userbuilder')).toHaveLength(0);
            expect(spCalls('user_team_management')).toHaveLength(1);
            expect(spCalls('user_team_management')[0][1]).toEqual({ nUserid: OUTSIDER, nTeamid: TEAM, nRoleid: ROLE, nCaseid: CASE, nMasterid: CALLER });
        });

        it.each([
            ['changes the email', { cEmail: 'takeover@example.test' as any }],
            ['changes the name', { cFname: 'Renamed' }],
            ['sets a password', { cPassword: 'Owned#4' }],
            ['creates a user', { permission: 'N' }],
            ['sends no team', { nTeamid: undefined }],
            ['sends no case', { nCaseid: undefined }],
            ["uses another case's team", { nTeamid: FOREIGN_TEAM }],
            ['targets a global admin', { nUserid: GLOBAL_ADMIN, cFname: 'Gil', cLname: 'Admin', cEmail: 'gil@example.test' as any }],
            ['targets a user id that does not exist', { nUserid: NOBODY }],
            ['changes the email of a user outside the case', { nUserid: OUTSIDER, cFname: 'Oli', cLname: 'Out', cEmail: 'takeover@example.test' as any }],
            ['changes the name of a user outside the case', { nUserid: OUTSIDER, cFname: 'Renamed', cLname: 'Out', cEmail: 'oli@example.test' as any }],
            ['sets a password for a user outside the case', { nUserid: OUTSIDER, cFname: 'Oli', cLname: 'Out', cEmail: 'oli@example.test' as any, cPassword: 'Owned#4' }],
            ["puts a user outside the case on another case's team", { nUserid: OUTSIDER, cFname: 'Oli', cLname: 'Out', cEmail: 'oli@example.test' as any, nTeamid: FOREIGN_TEAM }],
        ])('is refused when it %s', async (_label, patch) => {
            await expectForbidden(service.userBuilder(memberEdit(patch as Partial<UserBuilderReq>), asUser));
            expect(spCalls('userbuilder')).toHaveLength(0);
            expect(spCalls('user_team_management')).toHaveLength(0);
        });

        it('is refused for a case it does not administer', async () => {
            caseAdminOf = [OTHER_CASE];
            await expectForbidden(service.userBuilder(memberEdit(), asUser));
            expect(spCalls('user_team_management')).toHaveLength(0);
        });
    });

    describe('everyone else', () => {
        it('cannot edit another user', async () => {
            caseAdminOf = [];
            await expectForbidden(service.userBuilder(memberEdit({ cEmail: 'takeover@example.test' as any, cPassword: 'x' }), asUser));
            expect(executeRef).not.toHaveBeenCalled();
        });

        it('cannot create a user', async () => {
            await expectForbidden(service.userBuilder(memberEdit({ nUserid: undefined, permission: 'N' }), asUser));
            expect(executeRef).not.toHaveBeenCalled();
        });

        it('fails closed when the case-admin lookup errors', async () => {
            rowQuery.mockResolvedValue({ success: false, error: 'db down' });
            await expectForbidden(service.userBuilder(memberEdit(), asUser));
            expect(executeRef).not.toHaveBeenCalled();
        });

        it('treats a missing request context as non-admin', async () => {
            await expectForbidden(service.userBuilder(memberEdit({ nUserid: undefined, permission: 'N' }), undefined as any));
            expect(executeRef).not.toHaveBeenCalled();
        });
    });

    describe('userdelete', () => {
        it('is global-admin only', async () => {
            await expectForbidden(service.deleteUser({ nUserid: MEMBER, permission: 'D', nMasterid: CALLER }, asUser));
            expect(executeRef).not.toHaveBeenCalled();
            expect(deleteValue).not.toHaveBeenCalled();
        });

        it('deletes via et_userbuilder D and ends the Redis session for an admin', async () => {
            await service.deleteUser({ nUserid: MEMBER, permission: 'D', nMasterid: GLOBAL_ADMIN }, asAdmin);
            expect(spCalls('userbuilder')[0][1]).toMatchObject({ nUserid: MEMBER, permission: 'D' });
            expect(deleteValue).toHaveBeenCalledWith(`user/${MEMBER}`);
        });
    });

    describe('request validation', () => {
        const errorsFor = async (cls: any, plain: any) =>
            (await validate(plainToInstance(cls, plain) as object)).map((e) => e.property);
        const base = { cFname: 'A', cLname: 'B', cEmail: 'a@example.test', nTZid: 1 };

        it("userbuilder accepts only 'N' / 'E'", async () => {
            expect(await errorsFor(UserBuilderReq, { ...base, permission: 'E' })).toEqual([]);
            expect(await errorsFor(UserBuilderReq, { ...base, permission: 'N', cPassword: 'x' })).toEqual([]);
            expect(await errorsFor(UserBuilderReq, { ...base, permission: 'D' })).toContain('permission');
        });

        it('userbuilder no longer requires cPassword (own profile saves omit it)', async () => {
            expect(await errorsFor(UserBuilderReq, { ...base, permission: 'E' })).not.toContain('cPassword');
        });

        it("userdelete accepts only 'D'", async () => {
            expect(await errorsFor(UserDeleteReq, { nUserid: MEMBER, permission: 'D' })).toEqual([]);
            expect(await errorsFor(UserDeleteReq, { nUserid: MEMBER, permission: 'E' })).toContain('permission');
        });
    });
});
