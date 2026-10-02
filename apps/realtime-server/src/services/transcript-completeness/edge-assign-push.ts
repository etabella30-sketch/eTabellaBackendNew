import type { CAssign } from '@app/edge-sync';

/*
 * The seam through which SessionService pushes c.assign{op:'end'} to a venue box when RT Production
 * ends a venue session (spec 4.4). It lowers latency only: the box also learns of the end from its
 * assignment pull (et_rtedge_assignments r3, cOp 'end') on its next hello, which is the guarantee.
 *
 * The edge module (apps/realtime-server/src/edge, another workflow) provides it, for example
 *   { provide: EDGE_ASSIGN_PUSH, useFactory: (registry) => (nEdgeid, assign) => registry.push(nEdgeid, assign), inject: [...] }
 * and exports it to the module that holds SessionService. Until then it is absent and nothing is pushed.
 */
export const EDGE_ASSIGN_PUSH = 'RT_EDGE_ASSIGN_PUSH';

export type EdgeEndAssign = Extract<CAssign, { op: 'end' }>;

export type EdgeAssignPush = (nEdgeid: string, assign: EdgeEndAssign) => unknown;
