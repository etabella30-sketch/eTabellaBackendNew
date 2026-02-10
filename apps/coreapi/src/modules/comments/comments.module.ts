import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { CommentsController } from '../../controllers/comments/comments.controller';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { CommentsService } from '../../services/comments/comments.service';

@Module({
    imports: [SharedModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(CommentsController);

    }
}



