import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { CommonController } from '../../controllers/common/common.controller';
import { CommonService } from '../../services/common/common.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { ComboCodeReq } from '../../interfaces/common';
import { EmailService } from '../../services/email/email/email.service';
import { EmailController } from '../../controllers/email/email/email.controller';
import { ConfigService } from '@nestjs/config';
import { CoreTeamUsersController, TeamUsersCoreHttpModule, TeamUsersService } from '@app/rt-features/team-users';

/**
 * GET common/myteamusers is the shared team-users feature since Phase 5 of the shared-libraries plan: the
 * TeamUsersCoreHttpModule mounts @app/rt-features' CoreTeamUsersController over TeamUsersService (the SP through
 * the kernel ports CloudPlatformModule binds in the app root). The middleware binding stays by controller class,
 * as for every other route here; download and export import this module too, and their roots bind the same ports.
 */
@Module({
  imports: [SharedModule, TeamUsersCoreHttpModule.register({ operations: TeamUsersService })],
  controllers: [CommonController,EmailController],
  providers: [CommonService,EmailService,ConfigService]
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(CommonController,EmailController,CoreTeamUsersController);

  }

}
