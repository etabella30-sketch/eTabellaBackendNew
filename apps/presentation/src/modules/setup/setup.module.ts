import { MiddlewareConsumer, Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { SetupController } from '../../controllers/setup/setup.controller';
import { UtilityService } from '../../utility/utility.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { SetupService } from '../../services/setup/setup.service';
@Module({
    imports: [
        SharedModule
    ],
    controllers: [
        SetupController
    ],
    providers: [
        UtilityService, SetupService
    ],
})
export class SetupModule {

    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(SetupController);
    }

}