import { Test, TestingModule } from '@nestjs/testing';
import { GenerateWordIndexService } from './generate_word_index.service';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });


describe('GenerateWordIndexService', () => {
  let service: GenerateWordIndexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateWordIndexService],
    }).useMocker(autoMock).compile();

    service = module.get<GenerateWordIndexService>(GenerateWordIndexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
