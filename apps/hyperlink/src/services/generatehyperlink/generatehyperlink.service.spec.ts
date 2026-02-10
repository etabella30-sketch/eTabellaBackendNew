import { Test, TestingModule } from '@nestjs/testing';
import { GeneratehyperlinkService } from './generatehyperlink.service';

describe('GeneratehyperlinkService', () => {
  let service: GeneratehyperlinkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneratehyperlinkService],
    }).compile();

    service = module.get<GeneratehyperlinkService>(GeneratehyperlinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
