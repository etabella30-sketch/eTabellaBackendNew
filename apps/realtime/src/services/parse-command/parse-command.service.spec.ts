import { Test, TestingModule } from '@nestjs/testing';
import { ParseCommandService } from './parse-command.service';

describe('ParseCommandService', () => {
  let service: ParseCommandService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseCommandService],
    }).compile();

    service = module.get<ParseCommandService>(ParseCommandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
