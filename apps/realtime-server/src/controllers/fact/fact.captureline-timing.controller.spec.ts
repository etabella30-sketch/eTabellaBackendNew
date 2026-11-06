import { CaptureTiming } from '../../services/fact/live-qfact-timing';
import { FactController } from './fact.controller';

/** /fact/captureline answers as before and carries where its time went (Server-Timing, 2026-11-04). */
const req = () => ({ user: { userId: 'u' }, res: { headersSent: false, setHeader: jest.fn() } }) as any;

describe('captureline timing', () => {
  it('passes a timing to the capture and sends it with the unchanged reply', async () => {
    const svc = { captureLiveLine: jest.fn(async (_body, _user, timing: CaptureTiming) => { timing.phase('work'); return { msg: 1, groups: [] }; }) };
    const r = req();
    await expect(new FactController(svc as any).captureLine({ identity: '1' } as any, r)).resolves.toEqual({ msg: 1, groups: [] });
    expect(svc.captureLiveLine).toHaveBeenCalledWith({ identity: '1' }, r.user, expect.any(CaptureTiming));
    expect(r.res.setHeader).toHaveBeenCalledWith('Server-Timing', expect.stringMatching(/^work;dur=[\d.]+, db;.*total;dur=[\d.]+$/));
  });

  it('a refused capture still says where its time went', async () => {
    const svc = { captureLiveLine: jest.fn(async () => { throw new Error('This transcript line has changed.'); }) };
    const r = req();
    await expect(new FactController(svc as any).captureLine({} as any, r)).rejects.toThrow('changed');
    expect(r.res.setHeader).toHaveBeenCalledWith('Server-Timing', expect.stringContaining('total;dur='));
  });
});
