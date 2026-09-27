import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { RtDemoController } from '../../controllers/rt-demo/rt-demo.controller';
import { RtDemoService } from '../../services/rt-demo/rt-demo.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';

/**
 * RT Simulation document links. Sign-in only - deliberately NO case-member or
 * case-admin middleware: nobody is a member of the source case, and the service
 * never lets the caller choose which case is read.
 */
@Module({
    imports: [SharedModule],
    controllers: [RtDemoController],
    providers: [RtDemoService]
})
export class RtDemoModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(RtDemoController);
    }
}
