import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { IndividualController } from '../../controllers/individual/individual.controller';
import { IndividualService } from '../../services/individual/individual.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { FactController } from '../../controllers/fact/fact.controller';
import { FactService } from '../../services/fact/fact.service';
import { DoclinkController } from '../../controllers/doclink/doclink.controller';
import { WeblinkController } from '../../controllers/weblink/weblink.controller';
import { DoclinkService } from '../../services/doclink/doclink.service';
import { WeblinkService } from '../../services/weblink/weblink.service';
import { HttpModule } from '@nestjs/axios';
import { TaskController } from '../../controllers/task/task.controller';
import { TaskService } from '../../services/task/task.service';
import { TagController } from '../../controllers/tag/tag.controller';
import { TagService } from '../../services/tag/tag.service';
// import { TaskfgaService } from '../../services/fga/taskfga/taskfga.service';
// import { FactFgaService } from '../../services/fact-fga/fact-fga.service';

@Module({
    imports: [SharedModule, HttpModule],
    controllers: [IndividualController, FactController, DoclinkController, WeblinkController, TaskController, TagController],
    providers: [IndividualService, FactService, DoclinkService, WeblinkService, TaskService, TagService
        // ,TaskfgaService
        // ,FactFgaService
    ],
})
export class IndividualModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(IndividualController, FactController, DoclinkController, WeblinkController, TaskController, TagController);

    }
}
