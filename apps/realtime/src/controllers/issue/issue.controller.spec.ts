import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { IssueController } from './issue.controller';

describe('IssueController', () => {
  let controller: IssueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssueController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<IssueController>(IssueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
