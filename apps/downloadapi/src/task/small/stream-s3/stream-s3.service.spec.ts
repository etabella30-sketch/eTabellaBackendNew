import { Test, TestingModule } from '@nestjs/testing';
import { StreamS3Service } from './stream-s3.service';

describe('StreamS3Service', () => {
  let service: StreamS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StreamS3Service],
    }).compile();

    service = module.get<StreamS3Service>(StreamS3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
