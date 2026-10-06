import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { MarknavController } from '../../controllers/marknav/marknav.controller';
import { MarknavService } from '../../services/marknav/marknav.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { MarkNavigatorController, MarkNavigatorHttpModule, MarkNavigatorService } from '@app/rt-features/marknav';

@Module({
    // GET marknav/all and marknav/quickmarklist are the shared Mark Navigator feature (shared-libraries plan Phase 8):
    // @app/rt-features' MarkNavigatorController over MarkNavigatorService, the actor from the stamped Caller (the IDOR of
    // the client-sent nUserid is closed for good here); the other marknav/* routes stay in this app's controller.
    imports: [SharedModule, MarkNavigatorHttpModule.register({ operations: MarkNavigatorService })],
    controllers: [MarknavController],
    providers: [MarknavService],
})
export class MarknevModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(MarknavController, MarkNavigatorController);
    }
}
