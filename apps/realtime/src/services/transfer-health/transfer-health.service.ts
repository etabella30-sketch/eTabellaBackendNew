import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as pm2 from 'pm2';
import { Cron } from '@nestjs/schedule';
import { Server } from 'socket.io';

@Injectable()
export class TransferHealthService implements OnModuleInit {

    private server: Server;
    public setServer(server: Server) {
        this.server = server;
    }
    transferServiceStatus: 'online' | 'offline' = 'offline'
    private readonly logger = new Logger(TransferHealthService.name);

    onModuleInit() {
        pm2.connect(err => {
            if (err) {
                this.logger.error(`PM2 connect error: ${err.message}`);
                // Depending on your needs you could process.exit(1) here
            } else {
                this.logger.log('Connected to PM2');
            }
        });
    }

    @Cron('*/3 * * * * *')  // every 3 seconds
    async handleCron() {
        const ts = new Date().toISOString();
        let line: string;

        try {
            const list = await new Promise<pm2.ProcessDescription[]>((res, rej) =>
                pm2.list((err, procs) => (err ? rej(err) : res(procs))),
            );
            const proc = list.find(p => p.name === 'search-api');
            if (proc && proc.pm2_env.status === 'online') {
                if (this.transferServiceStatus != 'online') {
                    this.transferServiceStatus = 'online'
                    if (this.server) {
                        this.server.emit("transfer-service-status", { status: this.transferServiceStatus });
                    }
                }

                // line = `${ts} — search-api is RUNNING (pid: ${proc.pm2_env["pid"]})`;
            } else {

                if (this.transferServiceStatus != 'offline') {
                    this.transferServiceStatus = 'offline'
                    if (this.server) {
                        this.server.emit("transfer-service-status", { status: this.transferServiceStatus });
                    }
                }
                // line = `${ts} — search-api is NOT running`;
            }
        } catch (err: any) {
            line = `${ts} — Error retrieving PM2 list: ${err.message}`;
        }

        // 1) print to console
        // this.logger.log(line);

        // 2) append to file
        try {
            // await fs.appendFile(this.logFile, line + '\n');
        } catch (writeErr) {
            this.logger.error(`Failed writing to log file: ${writeErr.message}`);
        }
    }
}
