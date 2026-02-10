import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { UploadController } from '../../controllers/upload/upload.controller';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { UploadService } from '../../services/upload/upload.service';
import { OcrqueueController } from '../../controllers/ocrqueue/ocrqueue.controller';
import { OcrqueueService } from '../../services/ocrqueue/ocrqueue.service';
@Module({
    imports: [SharedModule],
    controllers: [UploadController, OcrqueueController],
    providers: [UploadService, OcrqueueService],
})
export class UploadModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(UploadController, OcrqueueController);
    }
}
