import { Test, TestingModule } from '@nestjs/testing';
import { UploadS3Service } from './upload-s3.service';

describe('UploadS3Service', () => {
  let service: UploadS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadS3Service],
    }).compile();

    service = module.get<UploadS3Service>(UploadS3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
