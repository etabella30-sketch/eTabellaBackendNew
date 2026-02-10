import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CaseController } from '../../controllers/case/case.controller';
import { CaseService } from '../../services/case/case.service';
import { SharedModule } from '../../shared/shared.module';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { FilesystemService } from '@app/global/utility/filesystem/filesystem.service';
import { AdminMiddleware } from '@app/global/middleware/admin.middleware';
import { CaseAdminMiddleware } from '@app/global/middleware/case.admin.middleware';

@Module({
    imports: [SharedModule],
    controllers: [CaseController],
    providers: [CaseService, FilesystemService],
})
export class CaseModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(CaseController),
            consumer
                .apply(CaseAdminMiddleware)
                .forRoutes(
                    { path: 'case/casedetail', method: RequestMethod.ALL },
                    { path: 'case/casedelete', method: RequestMethod.ALL });
    }
}