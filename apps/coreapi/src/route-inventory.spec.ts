import { join } from 'path';
import { expectRouteInventory } from '@app/global/utility/http-surface/route-inventory';
import { CoreapiModule } from './coreapi.module';

/** Every route coreapi serves, pinned (Phase 0 baseline, shared-libraries plan 2026-10-06). Update: ROUTE_INVENTORY_WRITE=1. */
describe('coreapi route inventory', () => {
  it('matches the committed route-inventory.json', () => {
    expectRouteInventory('coreapi', CoreapiModule, join(__dirname, 'route-inventory.json'));
  });
});
