import { CaseviewParserService } from './caseview-parser.service';
import { createSessionContext, FeedSink } from './session-context';
import { serialize, deserialize } from 'node:v8';

const sink: FeedSink = { emitLocal() {}, emitDelivery() {}, log() {},
  saveLine: async () => 1, saveMetaData: async () => 1, removeLines: async () => 1,
  savePageData: async () => 1, runAnnotTransfer: async () => 1 };
const marker = (hex: string) => Buffer.concat([Buffer.from([0xf9]), Buffer.from(hex), Buffer.from([0xfa])]);
const clock = (h: number, m: number, s: number) => {
  const bytes = Buffer.alloc(2); bytes.writeUInt16LE((h << 11) | (m << 5) | (s / 2));
  return marker(bytes.toString('hex'));
};
const setup = () => ({ parser: new CaseviewParserService(), ctx: createSessionContext({
  nSesid: 'caseview-source-clock', protocol: 'C', cTimezone: 'UTC', sink }) });
async function feed(f: ReturnType<typeof setup>, bytes: Buffer) {
  await f.parser.parseData(f.ctx, bytes, Date.UTC(2026,9,13,2,55,0));
  await new Promise<void>(resolve => f.ctx.parseQueue.addTask(async () => resolve()));
}
const lines = (f: ReturnType<typeof setup>) => f.ctx.job.lineBuffer.filter(row => row[1]?.length);

describe('CaseView genuine source hearing clock', () => {
  it('decodes a captured Eclipse marker separately from the identical arrival/display time', async () => {
    const f = setup();
    await feed(f, Buffer.concat([marker('3843'),Buffer.from('First line.'),marker('3A43'),Buffer.from('Second line.')]));
    expect(lines(f).map(row => row[10])).toEqual([
      {source:'hearing-timecode',frames:((8*60+25)*60+48)*30},
      {source:'hearing-timecode',frames:((8*60+25)*60+52)*30},
    ]);
    expect(lines(f).map(row => row[0])).toEqual(['02:55:00','02:55:00']);
    expect(new Set(lines(f).map(row => row[6])).size).toBe(2);
  });
  it('handles every chunk split of a timestamp without consuming ordinary names', async () => {
    const raw = Buffer.concat([clock(8,20,0),Buffer.from('Mr Fayez is here.')]);
    for (let split = 0; split <= raw.length; split++) {
      const f = setup(); await feed(f,raw.subarray(0,split)); await feed(f,raw.subarray(split));
      expect(lines(f).map(row => String.fromCharCode(...row[1]))).toEqual(['Mr Fayez is here.']);
      expect(lines(f)[0][10]).toEqual({source:'hearing-timecode',frames:30000*30});
    }
  });
  it('retains line identity and source time while words arrive or a backspace edits them', async () => {
    const f = setup(); await feed(f,Buffer.concat([clock(8,20,0),Buffer.from('from the')]));
    const original = structuredClone(lines(f)[0]);
    await feed(f,Buffer.from(' governmentX\b'));
    expect(String.fromCharCode(...lines(f)[0][1])).toBe('from the government');
    expect(lines(f)[0][6]).toBe(original[6]); expect(lines(f)[0][10]).toEqual(original[10]);
  });
  it('resumes a partial hearing marker and an open line from checkpointed job state', async () => {
    const first = setup();
    const raw = Buffer.concat([clock(8,20,0),Buffer.from('First.'),clock(8,20,10),Buffer.from('Second.')]);
    const split = clock(8,20,0).length + Buffer.byteLength('First.') + 3;
    await feed(first,raw.subarray(0,split));
    const id = lines(first)[0][6];
    const resumed = setup(); resumed.ctx.job = deserialize(serialize(first.ctx.job));
    await feed(resumed,raw.subarray(split));
    expect(lines(resumed).map(row => String.fromCharCode(...row[1]))).toEqual(['First.','Second.']);
    expect(lines(resumed)[0][6]).toBe(id);
    expect(lines(resumed)[1][10]).toEqual({source:'hearing-timecode',frames:30010*30});
    expect(new Set(lines(resumed).map(row => row[6])).size).toBe(2);
  });
  it('does not invent source clocks for invalid markers, plain line breaks or marker-like words', async () => {
    const f = setup(); await feed(f,Buffer.concat([clock(0,0,0),Buffer.from('Midnight.'),marker('FFFF'),
      Buffer.from('Unknown.\nReceipt only. y3843z is plain text.')]));
    expect(lines(f)[0][10]).toEqual({source:'hearing-timecode',frames:0});
    expect(lines(f).slice(1).every(row => !row[10])).toBe(true);
    expect(String.fromCharCode(...lines(f).at(-1)[1])).toContain('y3843z');
  });
});
