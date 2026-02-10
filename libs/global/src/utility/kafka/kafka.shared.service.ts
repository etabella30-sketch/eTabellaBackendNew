import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
@Injectable()
export class KafkaGlobalService
  implements OnModuleInit {

  constructor(@Inject('KAFKA_SERVICE') private readonly kafka: ClientKafka) { }

  async onModuleInit() {
    console.log('Connected to kafka service')
    await this.kafka.connect();
  }

  async sendMessage(topic: string, data: any) {
    // console.log('Emited to kafka',topic,data)
    // this.kafka.emit('my-topic2',data);
    this.kafka.emit(topic, data);
    return true;
  }

}
