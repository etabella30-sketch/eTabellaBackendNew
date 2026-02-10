// import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
@Injectable()
export class CoreapiService {
  // constructor(private readonly kafka: KafkaGlobalService){

  // }

  async sendMessage(data: any) {
    // return this.kafka.sendMessage(data);
  }
  getHello(): string {
    return 'Hello World! 1';
  }
}
