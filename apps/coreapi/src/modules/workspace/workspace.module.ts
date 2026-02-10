import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { WorkspaceController } from '../../controllers/workspace/workspace.controller';
import { WorkspaceService } from '../../services/workspace/workspace.service';
import { SidenavController } from '../../controllers/sidenav/sidenav.controller';
import { SidenavService } from '../../services/sidenav/sidenav.service';
// import { ContactFgaService } from '../../services/contact-fga/contact-fga.service';
// import { TaskfgaService } from '../../services/fga/taskfga/taskfga.service';

@Module({
  imports: [SharedModule],
  controllers: [WorkspaceController, SidenavController],
  providers: [WorkspaceService, SidenavService, 
    // ContactFgaService,
    // TaskfgaService
  ]
})
export class WorkspaceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(WorkspaceController, SidenavController);
  }
}
