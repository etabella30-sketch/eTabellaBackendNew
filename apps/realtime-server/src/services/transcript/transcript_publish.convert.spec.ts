import { TranscriptpublishService } from './transcript_publish.service';

describe('TranscriptpublishService convertTranscript', () => {
  // Pure method: no injected dependency is touched.
  const convert = (pages: any[]) => TranscriptpublishService.prototype.convertTranscript.call({}, pages);

  it('drops the frames part and pads the timestamp', () => {
    const [line] = convert([{ page: 3, data: [{ time: '9:5:7:12', lineIndex: 4, lines: ['text'], unicid: 7 }] }]);

    expect(line).toEqual({
      lineno: 4, timestamp: '09:05:07', linetext: 'text', pageno: 3,
      tab_references: [], isIndex: false, unicid: 7,
    });
  });

  // Regression: a line without a time threw and failed the whole export.
  it('gives a line without a time an empty timestamp', () => {
    const lines = convert([{
      page: 1,
      data: [
        { time: '16:57:37', lineIndex: 1, lines: ['first'], unicid: 11 },
        { time: null, lineIndex: 2, lines: [''], unicid: null },
      ],
    }]);

    expect(lines.map(l => l.timestamp)).toEqual(['16:57:37', '']);
    expect(lines.map(l => l.lineno)).toEqual([1, 2]);
  });
});
