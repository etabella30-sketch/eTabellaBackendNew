import { Test, TestingModule } from '@nestjs/testing';
import { TaskfgaService } from './taskfga.service';

describe('TaskfgaService', () => {
  let service: TaskfgaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskfgaService],
    }).compile();

    service = module.get<TaskfgaService>(TaskfgaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
