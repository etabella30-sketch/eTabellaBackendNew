import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from '../../services/notification/notification.service';
import { notificationReq } from '../../interfaces/notification.interface';

@Controller()
export class NotificationController {

  constructor(private readonly notificationService: NotificationService) {

  }

  @MessagePattern('notification')
  handeAuth2(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for notification: `, message);
    this.notificationService.emit(message);
  }

}