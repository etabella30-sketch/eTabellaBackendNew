import { Test, TestingModule } from '@nestjs/testing';
import { NativefileconvertService } from './nativefileconvert.service';

describe('NativefileconvertService', () => {
  let service: NativefileconvertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NativefileconvertService],
    }).compile();

    service = module.get<NativefileconvertService>(NativefileconvertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
