import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { CommonController } from '../../controllers/common/common.controller';
import { CommonService } from '../../services/common/common.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { ComboCodeReq } from '../../interfaces/common';
import { EmailService } from '../../services/email/email/email.service';
import { EmailController } from '../../controllers/email/email/email.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [SharedModule],
  controllers: [CommonController,EmailController],
  providers: [CommonService,EmailService,ConfigService]
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(CommonController,EmailController);

  }

}
