import { Body, Controller, Get, Post } from '@nestjs/common';
import { backupReq } from '../../interfaces/backup.interface';
import { BackupService } from '../../backup.service';
import { PgbackupService } from '../../services/pgbackup/pgbackup.service';

@Controller('pgbackup')
export class PgbackupController {

  constructor(private readonly pgBackup: PgbackupService, private readonly backup: BackupService) {

  }
  @Post('backup')
  async setBackup(@Body() body: backupReq): Promise<any> {
    this.pgBackup.startProcess(body);
    return { msg: 1, "status": "success", value: 'backup process started' };
  }



  @Get('backup')
  async getBackup(): Promise<any> {
    return await this.pgBackup.getBackupInfo();
  }



}
