import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { expectRouteInventory } from '@app/global/utility/http-surface/route-inventory';
import { AppModule } from './app.module';
import { parseBoxConfig } from './ports/box-config';

/** Every Nest route the venue box serves in `serve` mode (the /edge controllers; the /realtimeapi and /coreapi table
 *  is RtDataMiddleware, pinned by rt-routes.spec.ts), Phase 0 baseline of the shared-libraries plan (2026-10-06).
 *  Phase 4 adds the /authapi, /coreapi and /realtimeapi prefixes here. Update: ROUTE_INVENTORY_WRITE=1. */
describe('rt-edge route inventory', () => {
  let dir: string;
  beforeAll(() => { dir = fs.mkdtempSync(join(os.tmpdir(), 'rt-edge-routes-')); });
  afterAll(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('matches the committed route-inventory.json', () => {
    // The same minimal dev config the AppModule spec registers with; nothing is started, only module metadata is read.
    const config = parseBoxConfig(
      {
        mode: 'dev',
        box: { name: 'Court 3', label: 'VB-014', timeZone: 'Europe/London' },
        cloud: { origin: 'https://cloud.invalid' },
        http: { host: '127.0.0.1', port: 0, tls: null },
        transmitter: { bindAddress: '192.168.20.2', networkCidr: '192.168.20.0/24' },
        paths: { dataDir: './data' },
        shutdownTimeoutMs: 100,
      },
      join(dir, 'rt-edge.json'),
    );
    expectRouteInventory('rt-edge', AppModule.register({ config, mode: 'serve' }), join(__dirname, 'route-inventory.json'));
  });
});
