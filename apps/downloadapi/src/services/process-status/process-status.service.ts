import { DbService } from '@app/global/db/pg/db.service';
import { schemaType } from '@app/global/interfaces/db.interface';
import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../../util/kafka/kafka.service';
import { payloadEvents } from '../../interfaces/kafka.interface';

@Injectable()
export class ProcessStatusService {


    schema: schemaType = 'download';
    private readonly logger = new Logger('process-status');
    constructor(private readonly db: DbService, private readonly kafkaService: KafkaService) { }



    async updateStatus(nDPid: string, cStatus: 'Q' | 'F' | 'C' | 'A' | 'W'): Promise<void> {
        this.logger.log(`updating job ${nDPid} status ${cStatus}`);

        const res = await this.db.executeRef('update_process_status', { nDPid, cStatus }, this.schema);
        if (res.success) {
            try {
                if (res.data[0][0]["msg"] == 1) {
                    this.logger.log(`updated job ${nDPid} status ${cStatus}`);
                    const obj = {
                        nDPid,
                        cStatus,
                        nMasterid: res.data[0][0]["nMasterid"]
                    };
                    if (cStatus == 'A') {
                        obj["dStartDt"] = res.data[0][0]["dStartDt"];
                    }
                    this.kafkaService.emit({ event: 'DOWNLOAD-STATUS', data: obj });
                } else {
                    this.logger.error('Failed to insert download job', res.data[0]);

                }
            } catch (error) {
                this.logger.error('Error processing insert download job response', error);
            }
        } else {
            this.logger.error('Database error while inserting download job', res.error);
        }
    }

    async progressReport(event: payloadEvents, nDPid: string, data: { completedParts?: number, totalParts?: number, nMasterid: string }): Promise<void> {
        this.kafkaService.emit({ event, data: { nDPid, ...data } });
    }

}
