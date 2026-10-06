import { join } from 'path';
import { expectRouteInventory } from '@app/global/utility/http-surface/route-inventory';
import { AuthapiModule } from './authapi.module';

/** Every route authapi serves, pinned (Phase 0 baseline, shared-libraries plan 2026-10-06). Update: ROUTE_INVENTORY_WRITE=1. */
describe('authapi route inventory', () => {
  it('matches the committed route-inventory.json', () => {
    expectRouteInventory('authapi', AuthapiModule, join(__dirname, 'route-inventory.json'));
  });
});
