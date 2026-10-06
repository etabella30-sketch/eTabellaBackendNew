/**
 * @app/rt-features/marknav: the Mark Navigator's two box rows (marknav/all, marknav/quickmarklist), one implementation
 * for realtime-server, coreapi and the venue box's relay (plan Phase 8). Hosts import this folder alias, never the lib
 * root. The hosts' other marknav/* routes stay host-local.
 */
export * from './dto/marknav.dto';
export * from './marknav.operations';
export * from './marknav.service';
export * from './http/marknav.controller';
export * from './http/marknav.http.module';
