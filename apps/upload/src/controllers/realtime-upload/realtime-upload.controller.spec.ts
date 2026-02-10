import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeUploadController } from './realtime-upload.controller';

describe('RealtimeUploadController', () => {
  let controller: RealtimeUploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RealtimeUploadController],
    }).compile();

    controller = module.get<RealtimeUploadController>(RealtimeUploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
