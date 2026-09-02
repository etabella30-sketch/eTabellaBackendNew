import { Test, TestingModule } from '@nestjs/testing';
import { QueryBuilderService } from './query-builder.service';

describe('QueryBuilderService', () => {
  let service: QueryBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService],
    }).compile();

    service = module.get<QueryBuilderService>(QueryBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('serializes JSON coordinate text without persisting SQL-escaped apostrophes', () => {
    const cleaned = service.setNullValues({
      jCordinates: [{ text: "tomorrowfor . it's the same problem to" }],
    });

    expect(cleaned.jCordinates).toBe(
      `[{"text":"tomorrowfor . it's the same problem to"}]`,
    );
  });

  it('escapes apostrophes only at the final SQL literal boundary', () => {
    const query = service.buildQuery(
      { jCordinates: [{ text: "it's ready" }] },
      'fact_insert',
      1,
      'realtime',
    );
    const sqlLiteral = query.match(/\('(.*)','r1'\)/)?.[1];

    expect(sqlLiteral).toBeDefined();
    const request = JSON.parse(sqlLiteral!.replace(/''/g, "'"));
    expect(JSON.parse(request.jCordinates)).toEqual([{ text: "it's ready" }]);
  });
});
