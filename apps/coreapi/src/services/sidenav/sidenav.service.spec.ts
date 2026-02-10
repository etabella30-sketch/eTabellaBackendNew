import { Test, TestingModule } from '@nestjs/testing';
import { SidenavService } from './sidenav.service';

describe('SidenavService', () => {
  let service: SidenavService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SidenavService],
    }).compile();

    service = module.get<SidenavService>(SidenavService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
