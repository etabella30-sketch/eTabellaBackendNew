import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceService } from './workspace.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspaceService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
