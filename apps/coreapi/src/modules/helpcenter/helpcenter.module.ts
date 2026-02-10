import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { HelpcenterController } from '../../controllers/helpcenter/helpcenter.controller';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { HelpcenterService } from '../../services/helpcenter/helpcenter.service';


@Module({
    imports: [SharedModule],
    controllers: [HelpcenterController],
    providers: [HelpcenterService]
})
export class HelpcenterModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(HelpcenterController);

    }
}