import { Test, TestingModule } from '@nestjs/testing';
import { VerifypdfService } from './verifypdf.service';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });


describe('VerifypdfService', () => {
  let service: VerifypdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifypdfService],
    }).useMocker(autoMock).compile();

    service = module.get<VerifypdfService>(VerifypdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
