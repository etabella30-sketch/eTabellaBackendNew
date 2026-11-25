import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { PresentReportService } from './present-report.service';

describe('PresentReportService', () => {
  let service: PresentReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PresentReportService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<PresentReportService>(PresentReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
