import { join } from 'path';
import { expectRouteInventory } from '@app/global/utility/http-surface/route-inventory';
import { ExportModule } from './export.module';

/** Every route export serves, pinned (Phase 0 baseline, shared-libraries plan 2026-10-06). It imports coreapi's
 *  CommonModule, so a change there (common/myteamusers moving to a shared library) shows up here. Update: ROUTE_INVENTORY_WRITE=1. */
describe('export route inventory', () => {
  it('matches the committed route-inventory.json', () => {
    expectRouteInventory('export', ExportModule, join(__dirname, 'route-inventory.json'));
  });
});
