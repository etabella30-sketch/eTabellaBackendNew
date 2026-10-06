/**
 * The operations port of the Mark Navigator's box rows (plan §3.3, Phase 8): what the shared controller asks for.
 * realtime-server and coreapi bind MarkNavigatorService (the SPs over SP_EXECUTOR); the venue box binds a relay
 * adapter over CLOUD_RELAY. Every answer is the legacy wire body: the SP's cursors, or the `[{ msg: -1, value: 'Failed ',
 * error }]` failure list both hosts answered with 200.
 */
import type { Caller } from '@app/api-kernel';

import type { MarkNavigatorListFields } from './dto/marknav.dto';

export const MARK_NAVIGATOR_OPS = 'RT_MARK_NAVIGATOR_OPS';

export interface MarkNavigatorOperations {
  /** `marknav/all`: the three cursors of realtime.et_navigate_get_all (marks, issues, links). */
  all(caller: Caller, query: MarkNavigatorListFields): Promise<unknown>;
  /** `marknav/quickmarklist`: the rows of realtime.et_navigate_quick_mark. */
  quickMarks(caller: Caller, query: MarkNavigatorListFields): Promise<unknown>;
}
