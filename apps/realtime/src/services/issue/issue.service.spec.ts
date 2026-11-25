import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { IssueService } from './issue.service';

describe('IssueService', () => {
  let service: IssueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IssueService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<IssueService>(IssueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
