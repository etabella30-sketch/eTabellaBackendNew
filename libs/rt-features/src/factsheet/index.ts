/**
 * @app/rt-features/factsheet: the Full Fact editor, one implementation for realtime-server `factsheet/*` and the
 * venue box's eight relayed rows (plan Phase 7a). Hosts import this folder alias, never the lib root.
 */
export * from './dto/factsheet.dto';
export * from './factsheet.operations';
export * from './share-recipients';
export * from './factsheet.service';
export * from './http/factsheet.controller';
export * from './http/factsheet-live.controller';
export * from './http/factsheet.http.module';
export * from './http/legacy-shapes';
