import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { Injectable, Logger } from '@nestjs/common';
import { KafkaPayload } from '../../interfaces/kafka.interface';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class KafkaService {
    private readonly logger = new Logger('kafka');

    constructor(private readonly kafka: KafkaGlobalService, private readonly redis: RedisService) { }

    async emit(data: KafkaPayload, topic?: string) {
        try {
            if (data?.data?.nDPid) {
                const users = await this.redis.getSubscribers(data?.data?.nDPid);
                data.data.users = users;
                this.logger.fatal('Emited to kafka', data)
                this.kafka.sendMessage((topic ? topic : 'download-message'), data);
            }
        } catch (error) {

        }
    }

}