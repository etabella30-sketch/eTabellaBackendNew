import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { NavigationController } from '../../controllers/navigation/navigation.controller';
import { NavigationService } from '../../services/navigation/navigation.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { FilterService } from '../../services/filter/filter.service';

@Module({
    imports: [SharedModule],
    controllers: [NavigationController],
    providers: [NavigationService,FilterService],
})
export class NavigationModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(NavigationController);
    }
}
