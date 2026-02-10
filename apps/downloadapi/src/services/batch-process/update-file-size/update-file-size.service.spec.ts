import { Test, TestingModule } from '@nestjs/testing';
import { UpdateFileSizeService } from './update-file-size.service';

describe('UpdateFileSizeService', () => {
  let service: UpdateFileSizeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateFileSizeService],
    }).compile();

    service = module.get<UpdateFileSizeService>(UpdateFileSizeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
