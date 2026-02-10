import { Test, TestingModule } from '@nestjs/testing';
import { MovetoS3Service } from './moveto-s3.service';

describe('MovetoS3Service', () => {
  let service: MovetoS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MovetoS3Service],
    }).compile();

    service = module.get<MovetoS3Service>(MovetoS3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
