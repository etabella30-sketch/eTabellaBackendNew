import { LogService } from '@app/global/utility/log/log.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';

@Injectable()
export class AnnotTransferService {
    private readonly logApplication: string = 'realtime/annot-transfer';
    // Assigned by EventsGateway.afterInit() — mirrors the SyncService.server pattern
    // (see events.gateway.ts:41). We can't @Inject the WebSocketServer directly from a
    // service without creating a circular dep back through the gateway, so the gateway
    // hands us the Server instance once Socket.io is up.
    server: any;
    constructor(private readonly config: ConfigService,private logService:LogService) {

    }


    async startTransfer(nSesid: string, filePath: string, cProtocol: string): Promise<any> {
        console.log('VERIFYING FILE...');

        try {
            const res = await this.transferAnnotations(nSesid, filePath, cProtocol);
            if (res) {
                console.log('TRANSFER SUCCESSFUL');
                this.notifyTransferComplete(nSesid);
                return { msg: 1, status: 'success' };
            } else {
                throw new Error('Transfer failed');
            }
        } catch (error) {
            console.log('ERROR:', error);
            throw new Error(error.message);
        }

    }

    /**
     * Broadcast a publish-complete signal to every client currently viewing this
     * session. Emitted AFTER the Python transfer has committed — so clients are
     * guaranteed to read the remapped cTPageno/cTLineno/jTCordinates when they
     * react.
     *
     * Uses the `realtime-events` channel with `{ type: 'SD' }` (matches the
     * SyncService.scyncDataForAnnotations pattern at sync.service.ts:179). The
     * frontend subscribes to this channel in feed-display.service.ts:163-167
     * and, on `SD`, dispatches `REFRESH-SESSION-V2` which reloads session detail
     * and re-fetches annotations — the annotation re-fetch picks up the
     * transferred coords because et_marks already switches columns on bTranscript.
     *
     * Emitted to the session room `S${nSesid}` (joined by every client that has
     * opened this session — see events.gateway.ts:220 `client.join(data.room)`)
     * so both the annotating user and any other users viewing the session refresh.
     * Offline users don't need the push — they'll get the transferred coords
     * from the SP on next fetch (persistence-driven recovery).
     */
    notifyTransferComplete(nSesid: string): void {
        try {
            if (!this.server) {
                console.warn('[annot-transfer] Socket server not wired yet; skipping push. Transferred coords will still be picked up on next fetch.');
                return;
            }
            this.server.to(`S${nSesid}`).emit('realtime-events', { type: 'SD', nSesid });
            this.logService.info(`Emitted SD to room S${nSesid} after successful transfer`, `${this.logApplication}/${nSesid}`);
        } catch (err) {
            // Never let a notification failure block the transfer's success.
            console.log('[annot-transfer] notifyTransferComplete error:', err);
            this.logService.error(`notifyTransferComplete failed: ${err?.message || err}`, `${this.logApplication}/${nSesid}`);
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