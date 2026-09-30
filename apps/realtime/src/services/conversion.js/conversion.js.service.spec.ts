import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ConversionJsService } from './conversion.js.service';

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

  describe('processDirectory', () => {
    let dir: string;
    // Raw feed tuple: [time, charCodes, lineIndex, formate, oPage, oLine, unicid]
    const line = (time: string, text: string, li: number, unicid: number) =>
      [time, Array.from(text, c => c.charCodeAt(0)), li, 'FL', null, null, unicid];
    const writePage = (page: number, lines: any[]) =>
      fs.writeFileSync(path.join(dir, `page_${page}.json`), JSON.stringify(lines));

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dt_'));
    });

    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    // Regression: a line the live feed never saved is stored as null, and one
    // such line emptied its whole page out of the export.
    it('keeps a blank slot for a line the feed never saved', () => {
      writePage(1, [line('16:57:37', 'first', 1, 11), null, line('16:57:41', 'third', 3, 13)]);

      const [page] = service.processDirectory(dir);

      expect(page.data.map(l => l.lineIndex)).toEqual([1, 2, 3]);
      expect(page.data[1]).toEqual({ time: '16:57:37', lineIndex: 2, lines: [''], unicid: null });
      expect(page.data[2]).toEqual({ time: '16:57:41', lineIndex: 3, lines: ['third'], unicid: 13 });
    });

    it('gives a leading blank slot the time of the first saved line', () => {
      writePage(1, [null, line('09:00:05', 'second', 2, 12)]);

      const [page] = service.processDirectory(dir);

      expect(page.data[0]).toEqual({ time: '09:00:05', lineIndex: 1, lines: [''], unicid: null });
    });

    it('leaves pages without a missing line unchanged', () => {
      writePage(1, [line('10:00:00', 'only', 1, 1)]);

      const [page] = service.processDirectory(dir);

      expect(page.data).toEqual([{ time: '10:00:00', lineIndex: 1, lines: ['only'], unicid: 1 }]);
    });
  });
});
