/**
 * SPEC FIXTURE, run as a CHILD PROCESS by main.spec.ts ("stays alive while the LAN listener is not bound"):
 *
 *   node -r ts-node/register/transpile-only -r tsconfig-paths/register serve-child.ts <config.json> <retryMs> <retries> [--no-hold]
 *
 * Serves the bare box (ports/testing/bare-box.ts: no feature module, inert lifecycle ports, so no socket, database or
 * cloud) from a config whose certificate files do not exist. The LAN listener therefore waits and retries on its
 * unref'd timer, and nothing but main.ts's process hold (`holdProcessOpen`) keeps Node alive. One line per step goes
 * to stdout:
 *
 *   started <lan listener state>     `startServer` resolved
 *   retried <n>                      the retry timer ran `<retries>` times
 *   closed                           `app.close()` resolved
 *
 * The fixture never calls `process.exit` and holds no handle of its own: it ends with code 0 only when the hold was
 * released by the shutdown. With `--no-hold` the hold is a no-op (the control run): the process then ends right after
 * `started`, which is the defect the hold exists for.
 */
import * as fs from 'fs';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { startServer } from '../../main';
import { EDGE_BOOT_STATUS, EdgeBootStatus, loadBoxConfig } from '..';
import { bareBox, lifecyclePorts } from './bare-box';

const silent = { log: () => undefined, error: () => undefined, warn: () => undefined, debug: () => undefined, verbose: () => undefined };
const say = (line: string): void => void process.stdout.write(`${line}\n`);

async function run(): Promise<void> {
    const [configFile, retryMsArg, retriesArg, flag] = process.argv.slice(2);
    const config = loadBoxConfig(configFile);
    const retries = Number(retriesArg);
    const certFile = config.http.tls?.certFile;
    let app: INestApplication | undefined;
    let checks = 0;
    let closing = false;

    app = await startServer(config, {
        logger: false,
        shutdownHooks: false,
        listenRetryMs: Number(retryMsArg),
        ...(flag === '--no-hold' ? { holdProcess: () => () => undefined } : {}),
        createApp: async (module, options) => {
            const ref = await Test.createTestingModule({ imports: [bareBox(module, lifecyclePorts())] })
                .setLogger(silent)
                .compile();
            return ref.createNestApplication(options);
        },
        tlsWatch: {
            watchFile: (file, opts, listener) => fs.watchFile(file, opts, listener),
            unwatchFile: (file, listener) => fs.unwatchFile(file, listener),
            // One read of the certificate file per listener check: the first is startServer's own, the rest are retries.
            readFile: file => {
                if (file === certFile) {
                    checks += 1;
                    if (checks - 1 === retries && !closing) {
                        closing = true;
                        say(`retried ${retries}`);
                        void Promise.resolve()
                            .then(() => app?.close())
                            .then(() => say('closed'));
                    }
                }
                return fs.readFileSync(file);
            },
        },
    });
    say(`started ${app.get<EdgeBootStatus>(EDGE_BOOT_STATUS).lanListener().state}`);
}

run().catch(err => {
    process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    process.exitCode = 1;
});
