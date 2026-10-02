import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptController } from './transcript.controller';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });


describe('TranscriptController', () => {
  let controller: TranscriptController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscriptController],
    }).useMocker(autoMock).compile();

    controller = module.get<TranscriptController>(TranscriptController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
