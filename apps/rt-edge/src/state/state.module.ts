import { Module } from '@nestjs/common';

import { BOX_CONFIG, BoxConfig, EdgeStateUnavailableError, STATE_PORT } from '../ports';
import { SqliteEdgeState } from './sqlite-state';

/**
 * Open and migrate `BoxConfig.paths.stateDb`. A database that cannot be opened or migrated is a fatal boot
 * condition (ports/boot.ts, condition 2): the failure is rethrown as `EdgeStateUnavailableError` naming the file,
 * so main.ts reports it as its own class instead of an anonymous provider error.
 */
export function openBoxState(config: BoxConfig): SqliteEdgeState {
    try {
        return SqliteEdgeState.open({ file: config.paths.stateDb, timeZone: config.box.timeZone });
    } catch (err) {
        throw new EdgeStateUnavailableError(config.paths.stateDb, err);
    }
}

/**
 * state/ (spec §3.2): the node:sqlite `edge.sqlite` repositories behind STATE_PORT (ports/state.port.ts).
 * The provider factory opens and migrates the database before the port is handed out, so a resolved StatePort is
 * always migrated. Depends on nothing but the global core (BOX_CONFIG). The lifecycle closes it last
 * (app.module.ts EdgeLifecycle).
 */
@Module({
    providers: [
        {
            provide: STATE_PORT,
            useFactory: openBoxState,
            inject: [BOX_CONFIG],
        },
    ],
    exports: [STATE_PORT],
})
export class StateModule {}
