import { Test, TestingModule } from '@nestjs/testing';
import { GeneratehyperlinkService } from './generatehyperlink.service';
import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';

describe('GeneratehyperlinkService', () => {
  let service: GeneratehyperlinkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneratehyperlinkService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<GeneratehyperlinkService>(GeneratehyperlinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
