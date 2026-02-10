import { Test, TestingModule } from '@nestjs/testing';
import { ChunkManagementController } from './chunk-management.controller';

describe('ChunkManagementController', () => {
  let controller: ChunkManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChunkManagementController],
    }).compile();

    controller = module.get<ChunkManagementController>(ChunkManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
