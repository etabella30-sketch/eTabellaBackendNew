import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
// import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class RealtimeServerService  implements OnModuleInit {

  // constructor(@Inject('KAFKA_SERVICE') private readonly clientKafka: ClientKafka) { }

  async onModuleInit() {
    // await this.clientKafka.connect();
  }

  public async handleMessage(topic: string, message: any) {
    console.log(`Received message on ${topic}:`, message);
    // Handle the message
  }
  getHello(): string {
    return 'Hello World!';
  }
}
