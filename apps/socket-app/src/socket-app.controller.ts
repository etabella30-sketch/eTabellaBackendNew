import { Controller, Get } from '@nestjs/common';
import { SocketAppService } from './socket-app.service';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';
import { OnEvent } from '@nestjs/event-emitter';

@Controller()
export class SocketAppController {
  constructor(private readonly socketAppService: SocketAppService) {}

  @Get()
  getHello(): string {
    return this.socketAppService.getHello();
  }

  // @MessagePattern('my-topic')
  // consumeMessage(@Payload() message: KafkaMessage) {
  //   console.log('Message received at controller: ', message.value.toString());
  // }

  // @MessagePattern('my-topic')
  // handleCoreNotification(@Payload() message: any, @Ctx() context: KafkaContext) {
  //   console.log(`Received message from core: `,message);
  //   // handle message
  // }

  @OnEvent('message.received')
  handleMessage(data: string) {
    console.log('Handling received message in controller:', data);
    // Process the data as required
  }


  @OnEvent('my-topic')
  handleSomeEvent(payload: any) {
    // Make sure this does not inadvertently affect Kafka operations
    console.log('Event received:', payload);
  }



    
  // @MessagePattern('upload-response')
  // handeAuth2(@Payload() message: any, @Ctx() context: KafkaContext) {
  //   console.log(`Received message for topic2: `,message);
  //   // handle notification
  // }

}
