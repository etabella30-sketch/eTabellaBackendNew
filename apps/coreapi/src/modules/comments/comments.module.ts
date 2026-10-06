import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { CommentsController, CommentsHttpModule, CommentsLiveController, CommentsService } from '@app/rt-features/comments';
import { SharedModule } from '../../shared/shared.module';

/**
 * The fact comments are the shared comments feature since Phase 10 of the shared-libraries plan: CommentsHttpModule
 * mounts @app/rt-features' CommentsController (grid, add: the two rows the venue box relays) and CommentsLiveController
 * (users, edit, delete) over CommentsService (the realtime SPs through the kernel ports CloudPlatformModule binds in
 * the app root; the broadcast on `factsheet-comments` through EVENT_DELIVERY, this app's KafkaGlobalService). The
 * middleware binding stays by controller class, as for every other route here.
 */
@Module({
    imports: [SharedModule, CommentsHttpModule.register({ operations: CommentsService, mount: 'live' })],
})
export class CommentsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(CommentsController, CommentsLiveController);
    }
}
