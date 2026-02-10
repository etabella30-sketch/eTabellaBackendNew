import { Test, TestingModule } from '@nestjs/testing';
import { TransformNameService } from './transform-name.service';

describe('TransformNameService', () => {
  let service: TransformNameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformNameService],
    }).compile();

    service = module.get<TransformNameService>(TransformNameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
