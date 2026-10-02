/**
 * @app/edge-sync — the pure sync library shared by the venue box
 * (apps/rt-edge) and the cloud (realtime-server RS/edge, cut-mode ingest).
 * Spec: docs/rt-local-edge-spec.md §3.2, §5.2–§5.8, §6.2 (revision 3).
 *
 * HARD RULE (edge-sync.purity.spec.ts): the sources import only each other and
 * node:crypto. No fs, net, socket.io, ioredis, pg, @app/global or apps/; no
 * clock and no unseeded randomness. Everything with side effects is the
 * caller's.
 */
export * from './canonical';
export * from './fingerprint';
export * from './digest';
export * from './protocol';
export * from './cutter';
export * from './round';
export * from './broadcast-plan';
export * from './snapshot';
