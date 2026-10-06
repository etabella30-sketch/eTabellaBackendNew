import { join } from 'path';
import { expectRouteInventory } from '@app/global/utility/http-surface/route-inventory';
import { DownloadModule } from './download.module';

/** Every route download serves, pinned (Phase 0 baseline, shared-libraries plan 2026-10-06). It imports coreapi's
 *  CommonModule, so a change there (common/myteamusers moving to a shared library) shows up here. Update: ROUTE_INVENTORY_WRITE=1. */
describe('download route inventory', () => {
  it('matches the committed route-inventory.json', () => {
    expectRouteInventory('download', DownloadModule, join(__dirname, 'route-inventory.json'));
  });
});
