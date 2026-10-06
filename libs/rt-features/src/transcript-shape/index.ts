/**
 * @app/rt-features/transcript-shape: the transcript shaping both the cloud (realtime-server ConversionJsService) and
 * the venue box (lan/rt-data/rt-local.ts) execute. Pure functions over the parser's line tuples; the response types
 * are @app/api-contracts (responses/transcript.ts). Hosts import this folder alias, never the lib root.
 */
export * from './transcript-shape';
