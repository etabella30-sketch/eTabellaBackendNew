import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { SharedModule } from '../../shared/shared.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({imports:[SharedModule],controllers:[NotificationsController],providers:[NotificationsService],exports:[NotificationsService]})
export class NotificationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(JwtMiddleware).forRoutes(NotificationsController); }
}
