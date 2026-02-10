import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { PermissionController } from '../../controllers/permission/permission.controller';
import { PermissionService } from '../../services/permission/permission/permission.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';

@Module({
    imports: [SharedModule],
    controllers: [PermissionController],
    providers: [PermissionService],
})
export class PermissionModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(PermissionController);
    }
}

