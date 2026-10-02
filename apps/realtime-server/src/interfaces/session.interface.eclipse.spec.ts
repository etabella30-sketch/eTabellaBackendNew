import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EclipseSessionCreateReq } from './session.interface';

/** The global pipe of main.ts: a key the DTO does not declare is a 400. */
const PIPE = { whitelist: true, forbidNonWhitelisted: true };

async function errorsOf(body: object): Promise<Record<string, string[]>> {
  const errors = await validate(plainToInstance(EclipseSessionCreateReq, body) as object, PIPE);
  return Object.fromEntries(errors.map((e) => [e.property, Object.keys(e.constraints ?? {})]));
}

/**
 * POST session/eclipse (spec §4.2 step 2): the feed-path keys cFeedSource, nEdgeid and nHearingOpid are declared
 * (forbidNonWhitelisted would 400 them otherwise), and cEclipsePassword becomes optional ONLY for a venue-box session
 * (the server generates one, S-D17). A direct-cloud request is validated exactly as before.
 */
describe('EclipseSessionCreateReq', () => {
  const base = {
    nCaseid: 'ca5e0000-0000-4000-8000-00000000000e',
    nUserid: '11111111-1111-4111-8111-111111111111',
    cCaseno: 'CASE 1',
    cName: 'Hearing day 1',
    dStartDt: '2026-10-05T10:00:00',
    nDays: 1,
    nLines: 25,
    nPageno: 1,
    permission: 'I',
    cUnicuserid: 'browser-1',
    cProtocol: 'B',
    bRefresh: false,
    cEclipseUsername: 'court3',
  };
  const BOX = 'b0c5b0c5-0000-4000-8000-0000000000b1';

  it("today's direct request passes, and still needs its password", async () => {
    expect(await errorsOf({ ...base, cEclipsePassword: 'secret' })).toEqual({});
    expect(Object.keys(await errorsOf(base))).toEqual(['cEclipsePassword']);
    expect(Object.keys(await errorsOf({ ...base, cFeedSource: 'D' }))).toEqual(['cEclipsePassword']);
    expect(Object.keys(await errorsOf({ ...base, cEclipsePassword: '' }))).toEqual(['cEclipsePassword']);
  });

  it('a venue-box request may leave the password out, and carries its box and hearing operator', async () => {
    expect(await errorsOf({ ...base, cFeedSource: 'E', nEdgeid: BOX, nHearingOpid: '22222222-2222-4222-8222-222222222222' })).toEqual({});
    expect(await errorsOf({ ...base, cFeedSource: 'E', nEdgeid: BOX, cEclipsePassword: 'a-long-typed-password' })).toEqual({});
  });

  it('a typed venue password is still checked (no line break)', async () => {
    expect(Object.keys(await errorsOf({ ...base, cFeedSource: 'E', nEdgeid: BOX, cEclipsePassword: 'two\nlines-password' }))).toEqual(['cEclipsePassword']);
  });

  it('refuses an unknown feed source and a box id that is not an id', async () => {
    expect(Object.keys(await errorsOf({ ...base, cEclipsePassword: 'secret', cFeedSource: 'W' }))).toEqual(['cFeedSource']);
    expect(Object.keys(await errorsOf({ ...base, cFeedSource: 'E', nEdgeid: 'box-1' }))).toEqual(['nEdgeid']);
  });

  /*
   * The reporter connection of a venue-box session: cReporterIp (IPv4 dotted quad) with nReporterPort (1-65535).
   * Both are optional and go together; the service refuses them on a direct-cloud session (like nEdgeid).
   */
  describe('reporter connection (cReporterIp + nReporterPort)', () => {
    const venue = { ...base, cFeedSource: 'E', nEdgeid: BOX };
    const parsed = (body: object) => plainToInstance(EclipseSessionCreateReq, body);

    it('are declared (forbidNonWhitelisted would 400 them) and pass together', async () => {
      expect(await errorsOf({ ...venue, cReporterIp: '192.168.1.20', nReporterPort: 2500 })).toEqual({});
      expect(await errorsOf({ ...venue, cReporterIp: '0.0.0.0', nReporterPort: 1 })).toEqual({});
      expect(await errorsOf({ ...venue, cReporterIp: '255.255.255.255', nReporterPort: 65535 })).toEqual({});
    });

    it('a request without them is validated exactly as before, and an empty form field counts as not sent', async () => {
      expect(await errorsOf(venue)).toEqual({});
      expect(await errorsOf({ ...venue, cReporterIp: '', nReporterPort: '' })).toEqual({});
      expect(await errorsOf({ ...venue, cReporterIp: null, nReporterPort: null })).toEqual({});
      expect(await errorsOf({ ...venue, cReporterIp: '   ' })).toEqual({});
      const empty = parsed({ ...venue, cReporterIp: '', nReporterPort: null });
      expect([empty.cReporterIp, empty.nReporterPort]).toEqual([undefined, undefined]);
    });

    it('reads a port sent as a string of digits as its number, and trims the address', async () => {
      expect(await errorsOf({ ...venue, cReporterIp: ' 10.0.0.7 ', nReporterPort: '2500' })).toEqual({});
      const dto = parsed({ ...venue, cReporterIp: ' 10.0.0.7 ', nReporterPort: ' 2500 ' });
      expect([dto.cReporterIp, dto.nReporterPort]).toEqual(['10.0.0.7', 2500]);
    });

    it('one without the other is refused, with a message that says they go together', async () => {
      expect(await errorsOf({ ...venue, cReporterIp: '192.168.1.20' })).toEqual({ cReporterIp: ['withReporterKey'] });
      expect(await errorsOf({ ...venue, nReporterPort: 2500 })).toEqual({ nReporterPort: ['withReporterKey'] });
      expect(await errorsOf({ ...venue, cReporterIp: '', nReporterPort: 2500 })).toEqual({ nReporterPort: ['withReporterKey'] });
      expect(await errorsOf({ ...venue, cReporterIp: '192.168.1.20', nReporterPort: null })).toEqual({ cReporterIp: ['withReporterKey'] });
      const [error] = await validate(parsed({ ...venue, cReporterIp: '192.168.1.20' }) as object, PIPE);
      expect(error.constraints).toEqual({ withReporterKey: 'cReporterIp and nReporterPort go together: send both, or neither' });
    });

    // The box connects to a reporter address only for a session that pins its protocol; it refuses the address otherwise.
    it("with an address a venue request pins its protocol ('B' or 'C'); without one cProtocol stays optional", async () => {
      const { cProtocol: _protocol, ...noProtocol } = venue;
      const reporter = { cReporterIp: '192.168.1.20', nReporterPort: 2500 };
      expect(await errorsOf({ ...noProtocol, ...reporter, cProtocol: 'B' })).toEqual({});
      expect(await errorsOf({ ...noProtocol, ...reporter, cProtocol: 'C' })).toEqual({});
      expect(await errorsOf({ ...noProtocol, ...reporter })).toEqual({ cReporterIp: ['withReporterProtocol'] });
      for (const cProtocol of ['', 'X', 'b', ' B']) {
        expect(await errorsOf({ ...noProtocol, ...reporter, cProtocol })).toEqual({ cReporterIp: ['withReporterProtocol'] });
      }
      const [error] = await validate(parsed({ ...noProtocol, ...reporter }) as object, PIPE);
      expect(error.constraints).toEqual({ withReporterProtocol: 'Choose the protocol (Case view or Bridge) when a reporter address is given.' });

      // No reporter address (or empty form fields): validated exactly as before, whatever the protocol.
      expect(await errorsOf(noProtocol)).toEqual({});
      expect(await errorsOf({ ...noProtocol, cProtocol: 'X' })).toEqual({});
      expect(await errorsOf({ ...noProtocol, cReporterIp: '', nReporterPort: null })).toEqual({});
      // A direct-cloud request: the service refuses the reporter keys themselves, with its own message.
      const { cFeedSource: _feedSource, nEdgeid: _box, ...directNoProtocol } = noProtocol;
      expect(await errorsOf({ ...directNoProtocol, cEclipsePassword: 'secret', ...reporter })).toEqual({});
    });

    it.each([
      '192.168.1', '192.168.1.20.5', '192.168.1.256', '192.168.01.20', '00.1.2.3', '192.168.1.20:2500', '192.168.1.20/24',
      'reporter-laptop', 'fe80::1', '1.2.3.4 5', '１９２.168.1.20', 19216812,
    ])('refuses the address %p (IPv4 dotted quad only, no leading zeros)', async (cReporterIp) => {
      expect(Object.keys(await errorsOf({ ...venue, cReporterIp, nReporterPort: 2500 }))).toEqual(['cReporterIp']);
    });

    it.each([0, -1, 65536, 2500.5, '0', '65536', '2500.5', '25e2', '0x50', '2500abc', 'abc', true, [2500]].map((v) => [v]))(
      'refuses the port %p (a whole number from 1 to 65535)',
      async (nReporterPort) => {
        expect(Object.keys(await errorsOf({ ...venue, cReporterIp: '192.168.1.20', nReporterPort }))).toEqual(['nReporterPort']);
      },
    );
  });
});
