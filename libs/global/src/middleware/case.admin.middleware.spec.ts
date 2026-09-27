import { CASE_ADMIN_ROLE_ID, CaseAdminMiddleware, isCaseAdmin } from './case.admin.middleware';

const CASE = '11111111-1111-4111-8111-111111111111';
const USER = '33333333-3333-4333-8333-333333333333';

describe('CaseAdminMiddleware', () => {
    let rowQuery: jest.Mock;
    let middleware: CaseAdminMiddleware;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
        rowQuery = jest.fn().mockResolvedValue({ success: true, data: [] });
        middleware = new CaseAdminMiddleware({ rowQuery } as any);
        res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        next = jest.fn();
    });

    it('lets a global admin through without a lookup', async () => {
        await middleware.use({ method: 'POST', body: { nCaseid: CASE, nMasterid: USER }, isAdmin: true } as any, res, next);
        expect(next).toHaveBeenCalled();
        expect(rowQuery).not.toHaveBeenCalled();
    });

    it('lets a case admin of the named case through (GET reads the query)', async () => {
        rowQuery.mockResolvedValue({ success: true, data: [{}] });
        await middleware.use({ method: 'GET', query: { nCaseid: CASE, nMasterid: USER } } as any, res, next);
        expect(rowQuery).toHaveBeenCalledWith(expect.any(String), [CASE, USER, CASE_ADMIN_ROLE_ID]);
        expect(next).toHaveBeenCalled();
    });

    it.each([
        ['not a case admin', { success: true, data: [] }],
        ['the lookup fails', { success: false, error: 'db' }],
    ])('returns 403 when the caller is %s', async (_label, result) => {
        rowQuery.mockResolvedValue(result);
        await middleware.use({ method: 'POST', body: { nCaseid: CASE, nMasterid: USER } } as any, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 without a lookup when no case is named', async () => {
        await middleware.use({ method: 'POST', body: { nMasterid: USER } } as any, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(rowQuery).not.toHaveBeenCalled();
    });

    it('isCaseAdmin is false for a missing id', async () => {
        await expect(isCaseAdmin({ rowQuery } as any, CASE, undefined)).resolves.toBe(false);
        expect(rowQuery).not.toHaveBeenCalled();
    });
});
