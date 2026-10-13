import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from '../../services/notification/notification.service';
import { notificationReq } from '../../interfaces/notification.interface';

@Controller()
export class NotificationController {

  constructor(private readonly notificationService: NotificationService) {

  }

  @MessagePattern('notification')
  async handeAuth2(@Payload() message: any, @Ctx() context: KafkaContext) {
    // Pre-release messages may have no producer key. A Kafka record's identity survives redelivery.
    const cEventKey = message.cEventKey || `legacy-kafka:${context.getTopic()}:${context.getPartition()}:${context.getMessage().offset}`;
    return await this.notificationService.emit({ ...message, cEventKey });
  }

}
