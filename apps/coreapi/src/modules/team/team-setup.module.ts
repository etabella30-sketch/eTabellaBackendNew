import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { TeamSetupController } from '../../controllers/team/team-setup.controller';
import { TeamSetupService } from '../../services/team/team-setup/team-setup.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { TeamDataController } from '../../controllers/team/team-data.controller';
import { TeamDataService } from '../../services/team/team-data/team-data.service';
import { PasswordHashService } from '@app/global/utility/cryptography/password-hash.service';
import { CaseAdminMiddleware } from '@app/global/middleware/case.admin.middleware';

@Module({
    imports: [SharedModule],
    controllers: [TeamDataController, TeamSetupController],
    providers: [TeamSetupService, TeamDataService, PasswordHashService],
})
export class TeamSetupModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(TeamSetupController, TeamDataController),
            consumer
                .apply(CaseAdminMiddleware)
                .forRoutes(
                    { path: 'team-setup/teambuilder', method: RequestMethod.ALL },
                    { path: 'team-setup/teamdelete', method: RequestMethod.ALL },
                    // { path: 'team-setup/userbuilder', method: RequestMethod.ALL },
                    { path: 'team-setup/assignteam', method: RequestMethod.ALL },
                    { path: 'team-data/teamlist', method: RequestMethod.ALL },
                );
    }
}
