import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { SharedModule } from '../../shared/shared.module';
import { DraftRecoveryController } from '../../controllers/draft-recovery/draft-recovery.controller';
import { DraftRecoveryService } from '../../services/draft-recovery/draft-recovery.service';

@Module({ imports: [SharedModule], controllers: [DraftRecoveryController], providers: [DraftRecoveryService] })
export class DraftRecoveryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(JwtMiddleware).forRoutes(DraftRecoveryController); }
}
