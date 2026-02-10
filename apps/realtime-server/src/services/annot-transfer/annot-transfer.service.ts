import { LogService } from '@app/global/utility/log/log.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';

@Injectable()
export class AnnotTransferService {
    private readonly logApplication: string = 'realtime/annot-transfer';
    constructor(private readonly config: ConfigService,private logService:LogService) {

    }


    async startTransfer(nSesid: string, filePath: string, cProtocol: string): Promise<any> {
        console.log('VERIFYING FILE...');

        try {
            const res = await this.transferAnnotations(nSesid, filePath, cProtocol);
            if (res) {
                console.log('TRANSFER SUCCESSFUL');
                return { msg: 1, status: 'success' };
            } else {
                throw new Error('Transfer failed');
            }
        } catch (error) {
            console.log('ERROR:', error);
            throw new Error(error.message);
        }

    }



    async transferAnnotations(nSesid: string, filePath: string, cProtocol: string): Promise<boolean> {

        console.log('\n\r\n\rANNOT TRANSFER STARTED...', this.config.get('PY_ANNOT_TRANSFER'),
            nSesid,
            filePath,
            this.config.get('REALTIME_PATH'));

        try {

            const pythonProcess = spawn(this.config.get('pythonV'), [
                this.config.get('PY_ANNOT_TRANSFER'),
                nSesid,
                filePath,
                this.config.get('REALTIME_PATH'),

                this.config.get('DB_DATABASE'),
                this.config.get('DB_USERNAME'),
                this.config.get('DB_PASSWORD'),
                this.config.get('DB_HOST'),
                this.config.get('DB_PORT'),
                cProtocol
            ]);

            let dataBuffer = '';

            pythonProcess.stdout.on('data', (data: Buffer) => {
                dataBuffer += data.toString();
                console.log('DATA:', data.toString());
                this.logService.info(`DATA: ${data.toString()}`, `${this.logApplication}/${nSesid}`);
            });

            pythonProcess.stderr.on('data', (data: Buffer) => {
                console.log('ERROR:', data.toString());
                this.logService.info(`DATA: ${data.toString()}`, `${this.logApplication}/${nSesid}`);
            });

            return new Promise((resolve, reject) => {
                pythonProcess.on('error', (err) => {
                    console.log('ERROR:', err);
                    this.logService.error(`ERROR: ${err}`, `${this.logApplication}/${nSesid}`);
                    reject(err);
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.log(`Python process exited with code ${code}`);
                        this.logService.error(`Python process exited with code ${code}`, `${this.logApplication}/${nSesid}`);
                        resolve(false);
                        return;
                    }

                    resolve(true);
                });
            });
        } catch (error) {
            console.log('ERROR:', error);
            return false;
        }

    }

}