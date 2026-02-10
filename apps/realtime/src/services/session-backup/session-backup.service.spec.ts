import { Test, TestingModule } from '@nestjs/testing';
import { SessionBackupService } from './session-backup.service';

describe('SessionBackupService', () => {
  let service: SessionBackupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionBackupService],
    }).compile();

    service = module.get<SessionBackupService>(SessionBackupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
