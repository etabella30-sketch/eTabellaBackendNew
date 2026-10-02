/**
 * E2E FIXTURE, run as a CHILD PROCESS by harness/box.ts (ChildBox) so the box can be hard-killed at process level:
 *
 *   node -r ts-node/register/transpile-only -r tsconfig-paths/register box-child.ts <rt-edge.json>
 *
 * Serves the real box exactly as InProcessBox does (startServer + the suite's tuning) and prints one line,
 * `E2E_BOX_READY <httpPort>`, once `startServer` resolved. Nest's logger is off: nothing else is printed.
 */
import { Logger } from '@nestjs/common';

import { startServer } from '../../src/main';
import { loadBoxConfig } from '../../src/ports';
import { e2eCreateApp } from './tuning';

async function run(): Promise<void> {
    Logger.overrideLogger(false);
    const config = loadBoxConfig(process.argv[2]);
    const app = await startServer(config, { logger: false, shutdownHooks: true, createApp: e2eCreateApp(), listenRetryMs: 100 });
    const addr = app.getHttpServer().address();
    process.stdout.write(`E2E_BOX_READY ${addr && typeof addr === 'object' ? addr.port : 0}\n`);
}

run().catch(err => {
    process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    process.exitCode = 1;
});
