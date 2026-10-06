/**
 * @app/rt-features/comments: the fact comments, one implementation for coreapi `comments/*`, realtime-server
 * `comments/grid` + `comments/add` and the venue box's /coreapi relay of those two (plan Phase 10, D12). Hosts import
 * this folder alias, never the lib root.
 */
export * from './dto/comments.dto';
export * from './comments.operations';
export * from './comments.service';
export * from './http/comments.controllers';
export * from './http/legacy-shapes';
export * from './http/comments.http.module';
