import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { CaseactivityController } from '../../controllers/caseactivity/caseactivity.controller';
import { CaseactivityService } from '../../services/caseactivity/caseactivity.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { DownloadexcelService } from '../../services/caseactivity/downloadexcel/downloadexcel.service';

@Module({
    imports: [SharedModule],
    controllers: [CaseactivityController],
    providers: [CaseactivityService, DownloadexcelService]
})
export class CaseactivityModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(CaseactivityController);

    }
}
