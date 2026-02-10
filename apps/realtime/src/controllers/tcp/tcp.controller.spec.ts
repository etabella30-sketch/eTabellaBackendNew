import { Test, TestingModule } from '@nestjs/testing';
import { TcpController } from './tcp.controller';

describe('TcpController', () => {
  let controller: TcpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TcpController],
    }).compile();

    controller = module.get<TcpController>(TcpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
