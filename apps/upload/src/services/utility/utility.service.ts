import { DbService } from '@app/global/db/pg/db.service';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilityService {
    constructor(private readonly kafka: KafkaGlobalService, private db: DbService) { }


    emit(data: any, topic?: string) {
        // console.log('Emited to kafka', data)
        this.kafka.sendMessage((topic ? topic : 'upload-response'), data);
    }


    async getUploadUser(nUPid: string): Promise<any[]> {
        try {
            let res = await this.db.executeRef('upload_job_notifications', { nUPid: nUPid })
            if (res.success) {
                return res.data[0];
            } else {
                return [];
            };
        } catch (error) {

        }

    }
}
