import { Module } from '@nestjs/common';
import { CoreapiController } from './coreapi.controller';
import { CoreapiService } from './coreapi.service';
import { CaseModule } from './modules/case/case.module';
import { GlobalModule } from '@app/global';
import { TeamSetupModule } from './modules/team/team-setup.module';
import { BundleCreationModule } from './modules/bundle/bundle-creation.module';
import { PermissionModule } from './modules/permission/permission.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { UserDashboardModule } from './modules/user-dashboard/user-dashboard.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { UploadModule } from './modules/upload/upload.module';
import { IndividualModule } from './modules/individual/individual.module';
import { CommonModule } from './modules/common/common.module';
import { ContactModule } from './modules/contact/contact.module';
import { NavigationModule } from './modules/navigation/navigation.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
// import { UtilityService } from './services/utility/utility.service';
// import { EmailService } from './services/email/email/email.service';
// import { EmailController } from './controllers/email/email/email.controller';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { RedisCacheService } from './services/redis-cache/redis-cache/redis-cache.service';
import { CaseactivityModule } from './modules/caseactivity/caseactivity.module';
import { HelpcenterModule } from './modules/helpcenter/helpcenter.module';
import { MarknevModule } from './modules/marknev/marknev.module';
import { CommentsModule } from './modules/comments/comments.module';
@Module({
  imports: [
    // KafkaSharedModule,
    // KafkaModule.register('etabella-batch', 'batch-group'),
    UserDashboardModule, AdminDashboardModule, GlobalModule, CaseModule, TeamSetupModule, BundleCreationModule, PermissionModule, TicketModule, UploadModule,
    IndividualModule, CommonModule, ContactModule, NavigationModule, WorkspaceModule, CaseactivityModule, HelpcenterModule, MarknevModule, CommentsModule],
  controllers: [CoreapiController],
  providers: [CoreapiService],
})
export class CoreapiModule { }
