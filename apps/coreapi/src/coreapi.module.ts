import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { TEAM_USERS_LEGACY_SHAPES } from '@app/rt-features/team-users';
import { DOCLINK_LEGACY_SHAPES } from '@app/rt-features/doclink';
import { CODE_TABLE_LEGACY_SHAPES } from '@app/rt-features/code-tables';
import { COMMENTS_LEGACY_SHAPES } from '@app/rt-features/comments';
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
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { RtDemoModule } from './modules/rt-demo/rt-demo.module';
@Module({
  imports: [
    // KafkaSharedModule,
    // KafkaModule.register('etabella-batch', 'batch-group'),
    ScheduleModule.forRoot(),
    // The kernel ports of the shared features (@app/rt-features) over this app's DbService; failures of a moved
    // route keep its old body through the legacy shapes (shared-libraries plan Phase 5, D7).
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: { ...TEAM_USERS_LEGACY_SHAPES, ...DOCLINK_LEGACY_SHAPES, ...CODE_TABLE_LEGACY_SHAPES, ...COMMENTS_LEGACY_SHAPES } }) }),
    UserDashboardModule, AdminDashboardModule, GlobalModule, CaseModule, TeamSetupModule, BundleCreationModule, PermissionModule, TicketModule, UploadModule,
    IndividualModule, CommonModule, ContactModule, NavigationModule, WorkspaceModule, CaseactivityModule, HelpcenterModule, MarknevModule, CommentsModule,
    MaintenanceModule, RtDemoModule],
  controllers: [CoreapiController],
  providers: [CoreapiService],
})
export class CoreapiModule { }
