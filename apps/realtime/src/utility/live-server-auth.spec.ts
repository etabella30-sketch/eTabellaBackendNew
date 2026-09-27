import { liveServerHeaders, liveServerHeadersFor, SERVICE_KEY_HEADER } from './live-server-auth';

const configOf = (env: Record<string, string | undefined>) => ({ get: (k: string) => env[k] }) as any;

describe('live server auth headers', () => {
  const live = 'https://cloud.example.test/realtimeapi';

  it('sends the service key when REALTIME_SERVICE_KEY is set', () => {
    expect(liveServerHeaders(configOf({ REALTIME_SERVICE_KEY: 'k1' }))).toEqual({ [SERVICE_KEY_HEADER]: 'k1' });
    expect(SERVICE_KEY_HEADER).toBe('x-etabella-service-key');
  });

  it('sends nothing when no key is configured', () => {
    expect(liveServerHeaders(configOf({}))).toEqual({});
  });

  it('only attaches the key to LIVE_SERVER URLs', () => {
    const config = configOf({ REALTIME_SERVICE_KEY: 'k1', LIVE_SERVER: live });
    expect(liveServerHeadersFor(config, `${live}/session/sessiondata?nSesid=1`)).toEqual({ [SERVICE_KEY_HEADER]: 'k1' });
    expect(liveServerHeadersFor(config, 'http://127.0.0.1:5001/match')).toEqual({});
    expect(liveServerHeadersFor(config, 'https://cloud.example.test/realtimeapi.evil.test/x')).toEqual({});
  });
});
