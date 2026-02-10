import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { MarknavController } from '../../controllers/marknav/marknav.controller';
import { MarknavService } from '../../services/marknav/marknav.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';

@Module({
    imports: [SharedModule],
    controllers: [MarknavController],
    providers: [MarknavService],
})
export class MarknevModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(MarknavController);
    }
}
