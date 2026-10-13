import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { currentSaveTransaction } from '../../db/pg/save-transaction';
import { durableNotification } from '../notifications/notification-message';
import { isObservable, lastValueFrom } from 'rxjs';
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
    const payload = topic === 'notification' ? durableNotification(data) : data;
    const transaction = currentSaveTransaction();
    const deliver = async () => {
      const pending = this.kafka.emit(topic, payload);
      if (topic === 'notification' && isObservable(pending)) await lastValueFrom(pending);
      else if (topic === 'notification') await pending;
    };
    if (transaction) transaction.afterCommit.push(deliver);
    else await deliver();
    return true;
  }

}
