import { join } from 'path';
import { expectRouteInventory } from '@app/global/utility/http-surface/route-inventory';
import { RealtimeServerModule } from './realtime-server.module';

/** Every route realtime-server serves, pinned (Phase 0 baseline, shared-libraries plan 2026-10-06). Update: ROUTE_INVENTORY_WRITE=1. */
describe('realtime-server route inventory', () => {
  it('matches the committed route-inventory.json', () => {
    expectRouteInventory('realtime-server', RealtimeServerModule, join(__dirname, 'route-inventory.json'));
  });
});
