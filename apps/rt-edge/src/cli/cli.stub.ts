/**
 * SKELETON STUB of CliPort: every command throws NotImplementedPortError (main.ts maps it to exit code 70).
 * Replace with the real commands (keep CLI_PORT; change `useClass` in cli.module.ts).
 */
import { Injectable } from '@nestjs/common';

import { CliOutput, CliPort, EdgeCliCommand, notImplemented } from '../ports';

@Injectable()
export class CliStub implements CliPort {
    async run(command: EdgeCliCommand, _out: CliOutput): Promise<number> {
        return notImplemented('CliPort', command.name);
    }
}
