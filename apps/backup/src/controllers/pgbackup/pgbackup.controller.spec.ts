import { Test } from '@nestjs/testing';
import { PgbackupController } from './pgbackup.controller';
import { PgTechbackupService } from '../../services/pgbackup/pgbackup.service';
import { BackupService } from '../../backup.service';

describe('PgbackupController', () => {
  let controller: PgbackupController;
  const pgBackup = { startProcess: jest.fn(), getBackupInfo: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [PgbackupController],
      providers: [
        { provide: PgTechbackupService, useValue: pgBackup },
        { provide: BackupService, useValue: {} },
      ],
    }).compile();

    controller = module.get<PgbackupController>(PgbackupController);
  });

  it('starts a backup with the submitted request', async () => {
    const body = { nUserid: 'user-1' };
    await expect(controller.setBackup(body)).resolves.toMatchObject({ msg: 1, value: 'backup process started' });
    expect(pgBackup.startProcess).toHaveBeenCalledWith(body);
  });

  it('returns the backup status from the service', async () => {
    pgBackup.getBackupInfo.mockResolvedValue({ msg: 'STEP-C' });
    await expect(controller.getBackup()).resolves.toEqual({ msg: 'STEP-C' });
  });
});
