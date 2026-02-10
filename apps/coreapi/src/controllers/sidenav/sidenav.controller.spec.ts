import { Test, TestingModule } from '@nestjs/testing';
import { SidenavController } from './sidenav.controller';

describe('SidenavController', () => {
  let controller: SidenavController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SidenavController],
    }).compile();

    controller = module.get<SidenavController>(SidenavController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
