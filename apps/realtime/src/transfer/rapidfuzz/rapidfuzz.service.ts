import { Injectable, Logger } from '@nestjs/common';
import { spawn, SpawnOptions } from 'child_process';
import { fuzzyPyResult } from '../../interfaces/transfer.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RapidfuzzService {
    private readonly filePath = `${this.config.get('ASSETS')}search.py`;
    private readonly logger = new Logger(RapidfuzzService.name);
    constructor(private readonly config: ConfigService) { }

    runCommand(contxct: string[], term: string[]): Promise<fuzzyPyResult> {
        // const args: any[] = [this.filePath, contxct, term];
        const args = [
            this.filePath,
            JSON.stringify(contxct),
            JSON.stringify(term),
        ];
        return new Promise((resolve, reject) => {
            try {
                const child = spawn('py', args, { shell: false });

                let stdout = '';
                let stderr = '';

                // Capture stdout data
                child.stdout.on('data', (data: Buffer) => {
                    const chunk = data.toString();
                    stdout += chunk;
                    this.logger.debug(`stdout: ${chunk}`);
                });

                // Capture stderr data
                child.stderr.on('data', (data: Buffer) => {
                    const chunk = data.toString();
                    stderr += chunk;
                    this.logger.error(`stderr: ${chunk}`);
                });

                // Handle process exit
                child.on('close', (code: number) => {
                    this.logger.log(`Process exited with code ${code}`);
                    if (code === 0) {
                        resolve(JSON.parse(stdout));
                    } else {
                        const error = new Error(`Exit code ${code}: ${stderr}`);
                        reject(error);
                    }
                });

                // Handle spawn errors (e.g., ENOENT)
                child.on('error', (err) => {
                    this.logger.error(`Spawn error: ${err.message}`);
                    reject(err);
                });
            } catch (error) {
                this.logger.error(`Unexpected error: ${error.message}`);
                reject(error);
            }

        });
    }

}
