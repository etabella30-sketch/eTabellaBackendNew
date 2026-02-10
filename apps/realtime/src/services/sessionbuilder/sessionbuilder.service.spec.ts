import { Test, TestingModule } from '@nestjs/testing';
import { SessionbuilderService } from './sessionbuilder.service';

describe('SessionbuilderService', () => {
  let service: SessionbuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionbuilderService],
    }).compile();

    service = module.get<SessionbuilderService>(SessionbuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
