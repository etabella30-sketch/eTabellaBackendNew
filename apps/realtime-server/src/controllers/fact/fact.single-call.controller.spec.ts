import { FactController } from './fact.controller';

/** FACT_SAVE_SINGLE_CALL switches insertquickfact / insertfact to one database call; off = the step-by-step path. */
const req = () => ({ user: { userId: 'u' }, res: { headersSent: false, setHeader: jest.fn() } }) as any;
const service = () => ({
  saveFactSingleCall: jest.fn(async () => ({ msg: 1, nFSid: 'F1', color: 'c' })),
  insertQuickFact: jest.fn(async () => ({ nFSid: 'F2', color: 'c' })),
  insertFact: jest.fn(async () => ({ nFSid: 'F2', color: 'c' })),
  insertFactDetail: jest.fn(async () => [{ msg: 1 }]),
  insertFactissues: jest.fn(async () => [{ msg: 1 }]),
  insertFactcontact: jest.fn(async () => [{ msg: 1 }]),
  insertFactteam: jest.fn(async () => true),
  insertFactlink: jest.fn(async () => [{ msg: 1 }]),
  insertFacttask: jest.fn(async () => [{ msg: 1 }]),
  saveReviewStatus: jest.fn(async () => undefined),
  markAsTranscriptIfPublished: jest.fn(async () => undefined),
});

afterEach(() => { delete process.env.FACT_SAVE_SINGLE_CALL; });

describe('FACT_SAVE_SINGLE_CALL on', () => {
  beforeEach(() => { process.env.FACT_SAVE_SINGLE_CALL = '1'; });

  it('insertquickfact is one call; the reply is as before', async () => {
    const svc = service();
    const r = req();
    await expect((new FactController(svc as any) as any).insertQuickfactOnce({}, r)).resolves.toEqual(
      { msg: 1, value: 'Quick fact inserted successfully', nFSid: 'F1', color: 'c' });
    expect(svc.saveFactSingleCall).toHaveBeenCalledWith('quick', {}, r.user);
    expect(svc.insertQuickFact).not.toHaveBeenCalled();
    expect(svc.insertFactDetail).not.toHaveBeenCalled();
    expect(r.res.setHeader).toHaveBeenCalledWith('Server-Timing', expect.stringContaining('save;dur='));
  });

  it('insertfact is one call; a team-rule refusal answers its own words', async () => {
    const svc = service();
    await expect((new FactController(svc as any) as any).insertfactOnce({}, req())).resolves.toEqual(
      expect.objectContaining({ msg: 1, nFSid: 'F1' }));
    expect(svc.saveFactSingleCall).toHaveBeenCalledWith('full', {}, expect.anything());
    svc.saveFactSingleCall.mockResolvedValueOnce({ msg: -1, value: 'You can only share with your team' } as any);
    await expect((new FactController(svc as any) as any).insertfactOnce({}, req())).resolves.toEqual(
      expect.objectContaining({ msg: -1 }));
  });

  it('a failed save is msg -1 (nothing was written: one transaction)', async () => {
    const svc = service();
    svc.saveFactSingleCall.mockResolvedValueOnce({ msg: -1, value: 'Fact insert failed' } as any);
    await expect((new FactController(svc as any) as any).insertQuickfactOnce({}, req())).resolves.toEqual(
      expect.objectContaining({ msg: -1 }));
  });
});

describe('FACT_SAVE_SINGLE_CALL off (default)', () => {
  it('keeps the step-by-step path', async () => {
    const svc = service();
    await (new FactController(svc as any) as any).insertQuickfactOnce({}, req());
    expect(svc.saveFactSingleCall).not.toHaveBeenCalled();
    expect(svc.insertQuickFact).toHaveBeenCalled();
    expect(svc.insertFactDetail).toHaveBeenCalled();
  });
});
