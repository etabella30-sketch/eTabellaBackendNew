import { Test, TestingModule } from '@nestjs/testing';
import { OpenFgaClient } from '@openfga/sdk';
import { OpenFgaService } from './open-fga.service';

jest.mock('@openfga/sdk', () => ({ OpenFgaClient: jest.fn() }));

describe('OpenFgaService', () => {
  let service: OpenFgaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenFgaService],
    }).compile();

    service = module.get<OpenFgaService>(OpenFgaService);
  });

  it('constructs the client without contacting an OpenFGA server', () => {
    expect(service).toBeDefined();
    expect(OpenFgaClient).toHaveBeenCalledWith(expect.objectContaining({ apiUrl: process.env.OPENFGA_API_URL }));
  });
});
