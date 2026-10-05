import { Logger, Module } from '@nestjs/common';

import { BOX_CONFIG, BoxConfig, EDGE_SERVER_TIME, EdgeStateUnavailableError, ServerTime, STATE_PORT, StatePort } from '../ports';
import { SqliteEdgeState } from './sqlite-state';

/**
 * Open and migrate `BoxConfig.paths.stateDb`. A database that cannot be opened or migrated is a fatal boot
 * condition (ports/boot.ts, condition 2): the failure is rethrown as `EdgeStateUnavailableError` naming the file,
 * so main.ts reports it as its own class instead of an anonymous provider error.
 *
 * With `serverTime` (EDGE_SERVER_TIME), the saved etabella.net time correction is restored as the database opens —
 * before the kernel stamps a line, so a box that restarts offline keeps stamping lines with etabella.net time — and
 * every later correction is saved there (user decision 2026-10-05). Saving is best effort: a failed write is logged
 * and the correction stays in use.
 */
export function openBoxState(config: BoxConfig, serverTime?: ServerTime | null): SqliteEdgeState {
    let state: SqliteEdgeState;
    try {
        state = SqliteEdgeState.open({ file: config.paths.stateDb, timeZone: config.box.timeZone });
    } catch (err) {
        throw new EdgeStateUnavailableError(config.paths.stateDb, err);
    }
    if (serverTime) attachServerTime(serverTime, state);
    return state;
}

/** Restore the saved etabella.net time correction from `state` into `serverTime` and save every later one there. */
export function attachServerTime(serverTime: ServerTime, state: Pick<StatePort, 'clockCorrection'>): void {
    const logger = new Logger('EdgeServerTime');
    serverTime.attach({ load: () => state.clockCorrection.get(), save: saved => state.clockCorrection.save(saved) }, err =>
        logger.warn(`the etabella.net time correction could not be read or saved: ${err instanceof Error ? err.message : String(err)}`),
    );
}

/**
 * state/ (spec §3.2): the node:sqlite `edge.sqlite` repositories behind STATE_PORT (ports/state.port.ts).
 * The provider factory opens and migrates the database before the port is handed out, so a resolved StatePort is
 * always migrated. Depends on nothing but the global core (BOX_CONFIG, and EDGE_SERVER_TIME for the saved
 * etabella.net time correction). The lifecycle closes it last (app.module.ts EdgeLifecycle).
 */
@Module({
    providers: [
        {
            provide: STATE_PORT,
            useFactory: openBoxState,
            inject: [BOX_CONFIG, { token: EDGE_SERVER_TIME, optional: true }],
        },
    ],
    exports: [STATE_PORT],
})
export class StateModule {}
