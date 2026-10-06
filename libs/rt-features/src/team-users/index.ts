/**
 * @app/rt-features/team-users: the team-users lookup, one implementation for coreapi `common/myteamusers`,
 * realtime-server `factsheet/teamusers` and the venue box's /coreapi alias (plan Phase 5, the first fix-once
 * feature). Hosts import this folder alias, never the lib root.
 */
export * from './dto/team-users.query';
export * from './team-users.operations';
export * from './team-users.service';
export * from './http/core-team-users.controller';
export * from './http/realtime-team-users.controller';
export * from './http/legacy-shapes';
export * from './http/team-users.http.modules';
