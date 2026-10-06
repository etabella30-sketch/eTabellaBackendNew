/**
 * The HTTP modules of the team-users feature, one per URL family because a Nest module class mounts under one
 * RouterModule prefix only (plan §3.4): coreapi (and the box's /coreapi) mount TeamUsersCoreHttpModule,
 * realtime-server mounts TeamUsersRealtimeHttpModule. Each `register({ operations })` binds the operations port to
 * the host's implementation: TeamUsersService on live, the relay adapter on the box. No middleware, no global
 * providers, no lifecycle (R3): the host binds its own auth middleware by controller class and provides the kernel
 * ports (CALLER_RESOLVER, CASE_ACCESS, ERROR_ENVELOPE) the guards and the filter resolve.
 */
import { DynamicModule, Module, Type } from '@nestjs/common';

import { TEAM_USERS_OPS, TeamUsersOperations } from '../team-users.operations';
import { CoreTeamUsersController } from './core-team-users.controller';
import { RealtimeTeamUsersController } from './realtime-team-users.controller';

export interface TeamUsersHttpOptions {
  /** The class bound to TEAM_USERS_OPS (resolved with the host's injector). */
  readonly operations: Type<TeamUsersOperations>;
}

@Module({})
export class TeamUsersCoreHttpModule {
  static register(options: TeamUsersHttpOptions): DynamicModule {
    return {
      module: TeamUsersCoreHttpModule,
      controllers: [CoreTeamUsersController],
      providers: [{ provide: TEAM_USERS_OPS, useClass: options.operations }],
    };
  }
}

@Module({})
export class TeamUsersRealtimeHttpModule {
  static register(options: TeamUsersHttpOptions): DynamicModule {
    return {
      module: TeamUsersRealtimeHttpModule,
      controllers: [RealtimeTeamUsersController],
      providers: [{ provide: TEAM_USERS_OPS, useClass: options.operations }],
    };
  }
}
