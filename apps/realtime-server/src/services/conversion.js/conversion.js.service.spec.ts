import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { EXPECTED_MAP_PAGES, EXPECTED_PAGES, expectConformantPages, SESSION_MAP, SESSION_PAGES } from '@app/rt-features/transcript-shape/testing/conformance';
import { ConversionJsService } from './conversion.js.service';

/*
 * realtime-server's page shaping is the shared transcript-shape feature (Phase 6 of the shared-libraries plan):
 * the in-memory map and the page files on disk both shape to the conformance fixture the box asserts too (G2).
 */
describe('ConversionJsService', () => {
  let service: ConversionJsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversionJsService],
    }).compile();

    service = module.get<ConversionJsService>(ConversionJsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('shapes an in-memory session map to the conformance pages (G2), real page numbers sorted numerically', () => {
    expectConformantPages(service.pagesFromSessionMap(SESSION_MAP as any), EXPECTED_MAP_PAGES);
  });

  it('shapes the page files of a session folder the same way, renumbering sequentially unless asked to keep the real numbers', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-conversion-'));
    try {
      fs.writeFileSync(path.join(dir, 'page_1.json'), JSON.stringify(SESSION_PAGES[0]));
      fs.writeFileSync(path.join(dir, 'page_3.json'), JSON.stringify(SESSION_PAGES[1]));
      fs.writeFileSync(path.join(dir, 'page_2.json'), '{not json');
      fs.writeFileSync(path.join(dir, 'notes.txt'), 'ignored');
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const renumbered = service.processDirectory(dir);
      expect(renumbered.map((p) => [p.msg, p.page, p.data.length])).toEqual([[1, 1, 5], [2, 2, 0], [3, 3, 1]]);
      expect(renumbered[0].data).toEqual(EXPECTED_PAGES[0].data);
      expect(renumbered[2].data).toEqual(EXPECTED_PAGES[1].data);
      const real = service.processDirectory(dir, true);
      expect(real.map((p) => [p.msg, p.page])).toEqual([[1, 1], [2, 2], [3, 3]]);
    } finally {
      jest.restoreAllMocks();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
