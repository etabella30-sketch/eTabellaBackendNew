import { captureLiveQfact } from './live-qfact-capture';
import { FactService } from './fact.service';

jest.mock('./live-qfact-capture', () => ({ captureLiveQfact: jest.fn(), liveQfactContext: jest.fn() }));

const ME = '11111111-1111-4111-8111-111111111111';
const SES = '44444444-4444-4444-8444-444444444444';
const user = { userId: ME, isAdmin: false } as any;
const body = { nSesid: SES, nPrivateGroupid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as any;

/** /fact/captureline with a Private Group: the notice the capture hands the service, and the mark event only for a saved capture. */
describe('captureLiveLine with a Private Group', () => {
  const kafka = { sendMessage: jest.fn(async () => true) };
  const markEvents = { changed: jest.fn() };
  const service = () => new FactService({} as any, {} as any, undefined, markEvents as any, kafka as any);
  beforeEach(() => { jest.clearAllMocks(); });

  it('the notice handed to the capture is private-groups-changed with the user id only', async () => {
    jest.mocked(captureLiveQfact).mockImplementation(async (_db, _feed, _req, _user, _now, _timing, assigned) => {
      await assigned?.(ME);
      return { msg: 1, nFSid: 'F1', groups: [], removedIds: [] };
    });
    await service().captureLiveLine(body, user);
    expect(kafka.sendMessage).toHaveBeenCalledTimes(1);
    expect(kafka.sendMessage).toHaveBeenCalledWith('private-groups-changed', { userId: ME });
    expect(markEvents.changed).toHaveBeenCalledTimes(1);
  });

  it('a refused group publishes no mark event, and the failure is answered as is', async () => {
    const refused = { msg: -1, value: 'Private Group could not be saved', error: 'private_group_refused' };
    jest.mocked(captureLiveQfact).mockResolvedValue(refused as any);
    await expect(service().captureLiveLine(body, user)).resolves.toEqual(refused);
    expect(markEvents.changed).not.toHaveBeenCalled();
  });

  it('works without a Kafka service (a box or a test container)', async () => {
    jest.mocked(captureLiveQfact).mockImplementation(async (_db, _feed, _req, _user, _now, _timing, assigned) => {
      await assigned?.(ME);
      return { msg: 1, nFSid: 'F1', groups: [], removedIds: [] };
    });
    await expect(new FactService({} as any, {} as any, undefined, markEvents as any).captureLiveLine(body, user)).resolves.toMatchObject({ msg: 1 });
  });
});
