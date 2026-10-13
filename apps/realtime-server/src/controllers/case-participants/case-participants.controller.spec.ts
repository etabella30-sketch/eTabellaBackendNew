import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CALLER_RESOLVER, CASE_ACCESS, Caller, DomainError } from '@app/api-kernel';
import { DbService } from '@app/global/db/pg/db.service';
import { CaseParticipantsController } from './case-participants.controller';

const USER = '10000000-0000-4000-8000-000000000001';
const CASE = '20000000-0000-4000-8000-000000000001';
const caller: Caller = { userId: USER, family: 'edge-online', isPlatformAdmin: false, caseScope: [CASE] };

describe('case participants for Edge', () => {
  let app: INestApplication;
  let currentCaller: Caller | null;
  const executeRef = jest.fn();
  const requireCase = jest.fn();
  beforeEach(async () => {
    currentCaller = caller;
    executeRef.mockReset().mockResolvedValue({ success: true, data: [[{ nContactid: 'p1', cFname: 'Ada' }, { nContactid: 'p2', cFname: 'Ken' }]] });
    requireCase.mockReset().mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      controllers: [CaseParticipantsController],
      providers: [{ provide: DbService, useValue: { executeRef } }, { provide: CASE_ACCESS, useValue: { assertMember: requireCase } },
        { provide: CALLER_RESOLVER, useValue: { resolve: async () => currentCaller } }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterEach(async () => { await app.close(); });

  it('returns all contacts and replaces client actor fields with the verified caller', async () => {
    const res = await request(app.getHttpServer()).get(`/contact/getcontactlist?nCaseid=${CASE}&nMasterid=forged&nUserid=forged`);
    expect(res.status).toBe(200);
    expect(res.body.map(row => row.cFname)).toEqual(['Ada', 'Ken']);
    expect(executeRef).toHaveBeenCalledWith('contact_list', { nCaseid: CASE, nMasterid: USER });
  });
  it('returns an actual empty list when the case has no contacts', async () => {
    executeRef.mockResolvedValue({ success: true, data: [[]] });
    const res = await request(app.getHttpServer()).get(`/contact/getcontactlist?nCaseid=${CASE}`);
    expect([res.status, res.body]).toEqual([200, []]);
  });
  it.each([{ success: false }, { success: true, data: [] }, { success: true, data: [[{ msg: -1 }]] }])('reports storage failure without caching a fake empty list: %j', async result => {
    executeRef.mockResolvedValue(result);
    const res = await request(app.getHttpServer()).get(`/contact/getcontactlist?nCaseid=${CASE}`);
    expect(res.status).toBe(503);
    expect(res.body.message).toContain('Could not load case participants');
  });
  it('rejects callers without case access before reading contacts', async () => {
    requireCase.mockRejectedValue(new DomainError('forbidden', 'Case not allowed'));
    expect((await request(app.getHttpServer()).get(`/contact/getcontactlist?nCaseid=${CASE}`)).status).toBe(403);
    expect(executeRef).not.toHaveBeenCalled();
  });
  it('rejects missing authentication and malformed case IDs', async () => {
    currentCaller = null;
    expect((await request(app.getHttpServer()).get(`/contact/getcontactlist?nCaseid=${CASE}`)).status).toBe(401);
    currentCaller = caller;
    expect((await request(app.getHttpServer()).get('/contact/getcontactlist?nCaseid=wrong')).status).toBe(403);
    expect(executeRef).not.toHaveBeenCalled();
  });
});
