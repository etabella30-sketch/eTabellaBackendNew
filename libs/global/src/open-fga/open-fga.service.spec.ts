import { Test, TestingModule } from '@nestjs/testing';
import { OpenFgaService } from './open-fga.service';

describe('OpenFgaService', () => {
  let service: OpenFgaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenFgaService],
    }).compile();

    service = module.get<OpenFgaService>(OpenFgaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
