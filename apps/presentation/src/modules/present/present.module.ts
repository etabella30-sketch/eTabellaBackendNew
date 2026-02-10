import { MiddlewareConsumer, Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { PresentController } from '../../controllers/present/present.controller';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { PresentService } from '../../services/present/present.service';
import { UtilityService } from '../../utility/utility.service';

@Module({
  imports: [SharedModule],
  controllers: [PresentController],
  providers: [PresentService,UtilityService],
})
export class PresentModule {

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(PresentController);
  }

}