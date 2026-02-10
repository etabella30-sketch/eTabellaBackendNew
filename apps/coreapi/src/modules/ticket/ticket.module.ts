import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { TicketController } from '../../controllers/ticket/ticket.controller';
import { TicketService } from '../../services/ticket/ticket.service';
import { AdminMiddleware } from '@app/global/middleware/admin.middleware';

@Module({
    imports: [SharedModule],
    controllers: [TicketController],
    providers: [TicketService]
})
export class TicketModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(TicketController);

        consumer
            .apply(AdminMiddleware)
            .forRoutes(
                { path: 'ticket/casetickets', method: RequestMethod.ALL },
                { path: 'ticket/resolved', method: RequestMethod.ALL },
                { path: 'ticket/adminclearticket', method: RequestMethod.ALL });
    }
}
