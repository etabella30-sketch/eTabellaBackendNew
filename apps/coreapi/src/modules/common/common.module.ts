import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { CommonController } from '../../controllers/common/common.controller';
import { CommonService } from '../../services/common/common.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { EmailService } from '../../services/email/email/email.service';
import { EmailController } from '../../controllers/email/email/email.controller';
import { ConfigService } from '@nestjs/config';
import { CoreTeamUsersController, TeamUsersCoreHttpModule, TeamUsersService } from '@app/rt-features/team-users';
import { CodeTableCoreHttpModule, CodeTableService, CoreCodeTableController } from '@app/rt-features/code-tables';

/**
 * GET common/myteamusers is the shared team-users feature since Phase 5 of the shared-libraries plan: the
 * TeamUsersCoreHttpModule mounts @app/rt-features' CoreTeamUsersController over TeamUsersService (the SP through
 * the kernel ports CloudPlatformModule binds in the app root). GET common/getcode is the shared code-tables feature
 * since Phase 10 (CodeTableCoreHttpModule, CoreCodeTableController over CodeTableService). The middleware binding
 * stays by controller class, as for every other route here; download and export import this module too, and their
 * roots bind the same ports and the same legacy shapes.
 */
@Module({
  imports: [SharedModule, TeamUsersCoreHttpModule.register({ operations: TeamUsersService }), CodeTableCoreHttpModule.register({ operations: CodeTableService })],
  controllers: [CommonController,EmailController],
  providers: [CommonService,EmailService,ConfigService]
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(CommonController,EmailController,CoreTeamUsersController,CoreCodeTableController);

  }

}
