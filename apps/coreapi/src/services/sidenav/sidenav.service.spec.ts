import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { SidenavService } from './sidenav.service';

describe('SidenavService', () => {
  let service: SidenavService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SidenavService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<SidenavService>(SidenavService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
