import { Body, Controller, Get, Post } from '@nestjs/common';
import { CoreapiService } from './coreapi.service';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
// import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
// import { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';

@Controller()
export class CoreapiController {
  constructor(private readonly coreapiService: CoreapiService) { }

  @ApiExcludeEndpoint()
  @Get()
  getHello(): string {
    return this.coreapiService.getHello();
  }


  // @MessagePattern('my-topic')
  // handleCoreNotification(@Payload() message: any, @Ctx() context: KafkaContext) {
  //   console.log(`Received message from core: `, message);
  //   // handle message 2
  // test comment
  // }

  @Post('/send')
  async sendMessage(@Body() data: any) {
    return await this.coreapiService.sendMessage(data);
  }



}
