import { Test, TestingModule } from '@nestjs/testing';
import { FileproviderService } from './fileprovider.service';

describe('FileproviderService', () => {
  let service: FileproviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileproviderService],
    }).compile();

    service = module.get<FileproviderService>(FileproviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
