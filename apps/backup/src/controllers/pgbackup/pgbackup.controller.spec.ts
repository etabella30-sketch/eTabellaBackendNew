import { Test, TestingModule } from '@nestjs/testing';
import { PgbackupController } from './pgbackup.controller';

describe('PgbackupController', () => {
  let controller: PgbackupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PgbackupController],
    }).compile();

    controller = module.get<PgbackupController>(PgbackupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
