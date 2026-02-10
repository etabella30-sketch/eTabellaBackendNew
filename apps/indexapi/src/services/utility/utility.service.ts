import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilityService {
    constructor(private readonly kafka: KafkaGlobalService) { }


    emit(data: any, topic?: string) {
        console.log('Emited to kafka', data)
        this.kafka.sendMessage((topic ? topic : 'index-response'), data);
    }
}
