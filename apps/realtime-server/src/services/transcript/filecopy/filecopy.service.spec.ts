import { Test, TestingModule } from '@nestjs/testing';
import { filecopyService } from './filecopy.service';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });


describe('FilecopyService', () => {
  let service: filecopyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [filecopyService],
    }).useMocker(autoMock).compile();

    service = module.get<filecopyService>(filecopyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
