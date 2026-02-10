import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { PgbackupController } from './controllers/pgbackup/pgbackup.controller';
import { PgbackupService } from './services/pgbackup/pgbackup.service';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { S3Service } from './services/s3/s3.service';

@Module({
  imports: [
    WinstonConfigModule.forRoot('backup')
  ],
  controllers: [BackupController, PgbackupController],
  providers: [BackupService, PgbackupService, ConfigService,LogService, S3Service],
})
export class BackupModule {

}

