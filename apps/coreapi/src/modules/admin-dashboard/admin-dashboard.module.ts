import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { AdminDashboardController } from '../../controllers/admin-dashboard/admin-dashboard.controller';
import { AdminDashboardService } from '../../services/admin-dashboard/admin-dashboard.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { AdminMiddleware } from '@app/global/middleware/admin.middleware';

@Module({
    imports: [SharedModule],
    controllers: [AdminDashboardController],
    providers: [AdminDashboardService]
})
export class AdminDashboardModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(AdminDashboardController);
        consumer
            .apply(AdminMiddleware)
            .forRoutes(AdminDashboardController);
    }
}
