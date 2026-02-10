import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { UserDashboardController } from '../../controllers/user-dashboard/user-dashboard.controller';
import { UserDashboardService } from '../../services/user-dashboard/user-dashboard.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { EventLogService } from '@app/global/utility/event-log/event-log.service';

@Module({
    imports: [SharedModule],
    controllers: [UserDashboardController],
    providers: [UserDashboardService]
})
export class UserDashboardModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(UserDashboardController);
    }
}
