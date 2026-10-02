import { Test, TestingModule } from '@nestjs/testing';
import { ExporttranscriptService } from './exporttranscript.service';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });


describe('ExporttranscriptService', () => {
  let service: ExporttranscriptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExporttranscriptService],
    }).useMocker(autoMock).compile();

    service = module.get<ExporttranscriptService>(ExporttranscriptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
