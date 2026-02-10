import { Controller, Get } from '@nestjs/common';
import { AuthapiService } from './authapi.service';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthapiController {
  constructor(private readonly authapiService: AuthapiService) {}

  @ApiExcludeEndpoint()
  @Get()
  getHello(): string {
    return this.authapiService.getHello();
  }

  @MessagePattern('my-topic')
  handleNotification(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for notification: `,message);
    // handle notification
  }

  
  @MessagePattern('my-topic2')
  handeAuth2(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for topic2: `,message);
    // handle notification
  }
}
