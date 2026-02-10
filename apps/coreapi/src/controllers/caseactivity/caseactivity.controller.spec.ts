import { Test, TestingModule } from '@nestjs/testing';
import { CaseactivityController } from './caseactivity.controller';

describe('CaseactivityController', () => {
  let controller: CaseactivityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaseactivityController],
    }).compile();

    controller = module.get<CaseactivityController>(CaseactivityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
