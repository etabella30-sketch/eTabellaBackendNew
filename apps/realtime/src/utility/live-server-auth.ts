import { ConfigService } from '@nestjs/config';

/** Header the cloud realtime-server checks on the venue routes (/sync/* and the session sync routes). */
export const SERVICE_KEY_HEADER = 'x-etabella-service-key';

/** Headers for a request to LIVE_SERVER: the shared REALTIME_SERVICE_KEY when one is configured. */
export function liveServerHeaders(config: ConfigService): Record<string, string> {
  const key = config.get<string>('REALTIME_SERVICE_KEY');
  return key ? { [SERVICE_KEY_HEADER]: key } : {};
}

/** Same as liveServerHeaders, but only when `url` points at LIVE_SERVER, so the key never reaches another host. */
export function liveServerHeadersFor(config: ConfigService, url: string): Record<string, string> {
  const live = config.get<string>('LIVE_SERVER');
  if (!live || !url) return {};
  const prefix = live.endsWith('/') ? live : `${live}/`;
  return url === live || url.startsWith(prefix) ? liveServerHeaders(config) : {};
}
