import { Test, TestingModule } from '@nestjs/testing';
import { HelpcenterService } from './helpcenter.service';

describe('HelpcenterService', () => {
  let service: HelpcenterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelpcenterService],
    }).compile();

    service = module.get<HelpcenterService>(HelpcenterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
