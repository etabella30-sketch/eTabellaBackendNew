import { Test, TestingModule } from '@nestjs/testing';
import { ScaleannotsService } from './scaleannots.service';

describe('ScaleannotsService', () => {
  let service: ScaleannotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScaleannotsService],
    }).compile();

    service = module.get<ScaleannotsService>(ScaleannotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
