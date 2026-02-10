import { Inject, Injectable } from '@nestjs/common';
// import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class BatchfileService {
  constructor(
    // @Inject('KAFKA_SERVICE') private readonly clientKafka: ClientKafka
  ) { }

  async onModuleInit() {
    // await this.clientKafka.connect();
  }
  getHello(): string {
    return 'Hello World!';
  }
}
