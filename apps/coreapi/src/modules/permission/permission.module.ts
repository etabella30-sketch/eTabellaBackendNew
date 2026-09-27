import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { PermissionController } from '../../controllers/permission/permission.controller';
import { PermissionService } from '../../services/permission/permission/permission.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { CaseAdminMiddleware } from '@app/global/middleware/case.admin.middleware';

@Module({
    imports: [SharedModule],
    controllers: [PermissionController],
    providers: [PermissionService],
})
export class PermissionModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(PermissionController);
        // Managing a case's roles and user permissions needs case-admin rights in that
        // nCaseid. The two excluded reads return only the caller's own permissions
        // (et_pm_get_case_permission / et_pm_get_user_permission key on nMasterid) and
        // every user's UI calls them.
        consumer
            .apply(CaseAdminMiddleware)
            .exclude(
                { path: 'permission/casepermission', method: RequestMethod.GET },
                { path: 'permission/permissionlist', method: RequestMethod.GET },
            )
            .forRoutes(PermissionController);
    }
}

