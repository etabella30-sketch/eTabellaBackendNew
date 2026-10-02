import * as path from 'path';
import {
  readFrames,
  stripEclipseLogin,
  validateCorpus,
  listCorpora,
  listExtended,
  loadCorpus,
  inputSummary,
  replayInput,
  tcpServerJsonChunks,
  stringToAsciiHex,
  extendedSourceDir,
  EXTENDED_ENV,
  TCP_SERVER_BASE_MS,
  TCP_SERVER_GAP_MS,
} from './corpora';
import { memoryFs, framesNdjson, corpusFiles, extendedFiles } from './spec-fakes';

const REPO = path.resolve('/work/backend');
const chunk = (s: string, tRecv = 1000) => ({ bytes: Buffer.from(s, 'latin1'), tRecv });
const text = (chunks: Array<{ bytes: Buffer }>) => chunks.map((c) => c.bytes.toString('latin1'));

describe('stripEclipseLogin (mirrors EclipseTcpIngestService.handleConnection)', () => {
  it('drops a login that fills the first chunk and passes later chunks through unchanged', () => {
    const out = stripEclipseLogin([chunk('user\r\npass\r\n', 1), chunk(' SP01', 2), chunk('\x02N\x01\x03', 3)], 'spec');
    expect(text(out)).toEqual([' SP01', '\x02N\x01\x03']);
    expect(out.map((c: any) => c.tRecv)).toEqual([2, 3]);
  });

  it('feeds the bytes after the login as one chunk, with that chunk\'s receive time', () => {
    const out = stripEclipseLogin([chunk('us', 1), chunk('er\r\npa', 2), chunk('ss\r\nfirst words', 3), chunk(' more', 4)], 'spec');
    expect(text(out)).toEqual(['first words', ' more']);
    expect(out[0].tRecv).toBe(3);
  });

  it('never lets a credential byte through', () => {
    const out = stripEclipseLogin([chunk('secret-user\r\nsecret-pass\r\ntext')], 'spec');
    expect(Buffer.concat(out.map((c: any) => c.bytes)).toString('latin1')).toBe('text');
  });

  it('refuses a stream with no login within 512 bytes, as the ingest drops that socket', () => {
    expect(() => stripEclipseLogin([chunk('x'.repeat(513))], 'spec')).toThrow('no Eclipse login within 512 bytes');
  });

  it('refuses a capture that ends inside the login, and accepts an empty capture', () => {
    expect(() => stripEclipseLogin([chunk('user\r\npa')], 'spec')).toThrow('ends before the Eclipse login is complete');
    expect(stripEclipseLogin([], 'spec')).toEqual([]);
  });
});

describe('readFrames', () => {
  const file = path.join(REPO, 'frames.ndjson');

  it('reads the data chunks in order with their receive times, skipping other records', () => {
    const lines = framesNdjson(['ab', 'c']).trim().split('\n');
    lines.splice(1, 0, JSON.stringify({ i: 2, ts: '2026-01-05T10:00:00.060Z', kind: 'error', hex: '' }));
    const third = JSON.parse(lines[2]);
    lines[2] = JSON.stringify({ ...third, i: 3 });
    const fs = memoryFs({ [file]: lines.join('\n') + '\n' });
    const chunks = readFrames(fs, file);
    expect(text(chunks)).toEqual(['ab', 'c']);
    expect(chunks[0].tRecv).toBe(Date.UTC(2026, 0, 5, 10, 0, 0) + 40);
  });

  it('rejects frame numbers that do not increase, a byte count that disagrees with hex, and bad JSON', () => {
    const one = JSON.parse(framesNdjson(['a']).trim());
    const twice = JSON.stringify(one) + '\n' + JSON.stringify(one) + '\n';
    expect(() => readFrames(memoryFs({ [file]: twice }), file)).toThrow(':2: frame numbers must increase');
    expect(() => readFrames(memoryFs({ [file]: JSON.stringify({ ...one, bytes: 5 }) }), file)).toThrow('"bytes" says 5, hex holds 1');
    expect(() => readFrames(memoryFs({ [file]: '{"i":1,' }), file)).toThrow(':1: not JSON');
  });
});

describe('inputSummary', () => {
  const meta = { protocol: 'B', nSesid: 's', nLines: 25, cTimezone: 'UTC' };
  const base = [chunk('abc', 1), chunk('def', 2)];

  it('is stable for the same input', () => {
    expect(inputSummary(meta, base)).toEqual(inputSummary(meta, [chunk('abc', 1), chunk('def', 2)]));
    expect(inputSummary(meta, base)).toMatchObject({ chunks: 2, bytes: 6 });
  });

  it('changes with a moved chunk boundary, a receive time, or a session setting the parser sees', () => {
    const digest = inputSummary(meta, base).sha256;
    expect(inputSummary(meta, [chunk('ab', 1), chunk('cdef', 2)]).sha256).not.toBe(digest);
    expect(inputSummary(meta, [chunk('abc', 1), chunk('def', 3)]).sha256).not.toBe(digest);
    expect(inputSummary({ ...meta, cTimezone: 'Asia/Kolkata' }, base).sha256).not.toBe(digest);
    expect(inputSummary({ ...meta, protocol: 'C' }, base).sha256).not.toBe(digest);
  });
});

describe('validateCorpus', () => {
  const good = { id: 'x', title: 't', protocol: 'B', origin: 'real', handshake: 'none', nSesid: 's', nLines: 25, source: { type: 'frames', file: 'f' } };

  it('accepts a complete corpus.json', () => {
    expect(() => validateCorpus(good, 'x')).not.toThrow();
  });

  it.each([
    [{ id: 'y' }, '"id" must equal the folder name'],
    [{ protocol: 'X' }, '"protocol" must be one of B, C'],
    [{ origin: 'made-up' }, '"origin" must be one of real, synthetic'],
    [{ handshake: 'telnet' }, '"handshake" must be one of none, eclipse-login'],
    [{ nLines: 0 }, '"nLines" must be a positive integer'],
    [{ source: { type: 'eclipse-capture' } }, '"source.dir" is required'],
    [{ source: { type: 'ftp' } }, '"source.type" must be'],
  ])('rejects %j', (patch, message) => {
    expect(() => validateCorpus({ ...good, ...patch }, 'x')).toThrow(message);
  });
});

describe('listCorpora / loadCorpus', () => {
  it('lists corpus folders in id order and loads a frames corpus', () => {
    const fs = memoryFs({ ...corpusFiles(REPO, 'zeta'), ...corpusFiles(REPO, 'alpha', { chunks: ['hi', ' there'] }) });
    expect(listCorpora(fs, REPO)).toEqual(['alpha', 'zeta']);
    const corpus = loadCorpus(fs, REPO, 'alpha');
    expect(text(corpus.chunks)).toEqual(['hi', ' there']);
    expect(corpus.goldenFile).toBe(path.join(REPO, 'tools', 'ci', 'golden-replay', 'corpora', 'alpha', 'golden.json'));
    expect(replayInput(corpus)).toMatchObject({ id: 'alpha', protocol: 'B', nLines: 25, cTimezone: 'UTC' });
  });

  it('reads an eclipse-capture source in place, strips the login and cross-checks payload.bin', () => {
    const cap = path.join(REPO, 'tools', 'eclipse-capture', 'authtest', 'tcp_x');
    const files = {
      ...corpusFiles(REPO, 'cap', { extra: { origin: 'real', handshake: 'eclipse-login', source: { type: 'eclipse-capture', dir: 'tools/eclipse-capture/authtest/tcp_x' } } }),
      [path.join(cap, 'frames.ndjson')]: framesNdjson(['u\r\np\r\n', ' text']),
      [path.join(cap, 'payload.bin')]: 'u\r\np\r\n text',
    };
    expect(text(loadCorpus(memoryFs(files), REPO, 'cap').chunks)).toEqual([' text']);

    files[path.join(cap, 'payload.bin')] = 'u\r\np\r\n tex';
    expect(() => loadCorpus(memoryFs(files), REPO, 'cap')).toThrow('frames.ndjson does not concatenate to payload.bin');
  });

  it('names the file when corpus.json is not valid', () => {
    const files = corpusFiles(REPO, 'bad');
    files[path.join(REPO, 'tools', 'ci', 'golden-replay', 'corpora', 'bad', 'corpus.json')] = '{';
    expect(() => loadCorpus(memoryFs(files), REPO, 'bad')).toThrow('tools/ci/golden-replay/corpora/bad/corpus.json');
  });

  it('accepts legacyMisroute as a boolean only', () => {
    const good = { id: 'x', title: 't', protocol: 'C', origin: 'real', handshake: 'none', nSesid: 's', nLines: 25, source: { type: 'frames', file: 'f' } };
    expect(() => validateCorpus({ ...good, legacyMisroute: true }, 'x')).not.toThrow();
    expect(() => validateCorpus({ ...good, legacyMisroute: 'yes' }, 'x')).toThrow('"legacyMisroute" must be a boolean');
  });
});

describe('extended corpora (tcp-server-main JSON, read in place)', () => {
  const SRC = path.resolve('/work/tcp-server-main');

  it('converts entries exactly like tcp.js jsonToHex: no cmdType -> ASCII hex of data1, else hexCmd; one chunk per entry', () => {
    const entries = [
      { data1: 'Q.  ' },
      { cmdType: 'N', hexCmd: '024e0103', data1: 'ignored' },
      { cmdType: 'G', hexCmd: '024703746568037468650' }, // odd hex: Buffer.from(hex, 'hex') drops the half byte, as tcp.js does
      { data1: '' },
    ];
    const chunks = tcpServerJsonChunks(JSON.stringify(entries), 'spec');
    expect(chunks.map((c: any) => c.bytes.toString('hex'))).toEqual(['512e2020', '024e0103', '02470374656803746865', '']);
    expect(chunks.map((c: any) => c.tRecv)).toEqual([1, 2, 3, 4].map((n) => TCP_SERVER_BASE_MS + TCP_SERVER_GAP_MS * n));
    // a code unit above 0xFF gives more than 2 hex digits, exactly as tcp.js does
    // (the two corpora hold none: every data1 code unit is <= 0x7D)
    expect(stringToAsciiHex('AĀ')).toBe('41100');
  });

  it('refuses entries tcp.js would throw on, and a file that is not a JSON array', () => {
    expect(() => tcpServerJsonChunks('{', 'f')).toThrow('f: not JSON');
    expect(() => tcpServerJsonChunks('{}', 'f')).toThrow('not a JSON array');
    expect(() => tcpServerJsonChunks('[{}]', 'f')).toThrow('entry 0 has no cmdType and no string data1');
    expect(() => tcpServerJsonChunks('[{"cmdType":"N"}]', 'f')).toThrow('entry 0 (cmdType N) has no string hexCmd');
  });

  it('lists the extended folders (none when the folder is missing) and finds the source folder', () => {
    const fs = memoryFs({ ...extendedFiles(REPO, 'ext-b', SRC), ...extendedFiles(REPO, 'ext-a', SRC) });
    expect(listExtended(fs, REPO)).toEqual(['ext-a', 'ext-b']);
    expect(listExtended(memoryFs({}), REPO)).toEqual([]);
    expect(extendedSourceDir({}, REPO)).toBe(SRC);
    expect(extendedSourceDir({ [EXTENDED_ENV]: '/elsewhere' }, REPO)).toBe(path.resolve('/elsewhere'));
    expect(extendedSourceDir({ [EXTENDED_ENV]: '/elsewhere' }, REPO, '/cli')).toBe(path.resolve('/cli'));
  });

  it('loads an extended corpus from its source folder, never from the repo', () => {
    const fs = memoryFs(extendedFiles(REPO, 'ext-a', SRC, { entries: [{ data1: 'hi' }, { cmdType: 'D', hexCmd: '024403' }] }));
    const corpus = loadCorpus(fs, REPO, 'ext-a', { extended: true, extendedDir: SRC });
    expect(corpus.extended).toBe(true);
    expect(corpus.chunks.map((c: any) => c.bytes.toString('hex'))).toEqual(['6869', '024403']);
    expect(corpus.goldenFile).toBe(path.join(REPO, 'tools', 'ci', 'golden-replay', 'extended', 'ext-a', 'golden.json'));
    expect(corpus.input).toMatchObject({ chunks: 2, bytes: 5 });
    expect(() => loadCorpus(fs, REPO, 'ext-a', { extended: true, extendedDir: path.resolve('/nowhere') })).toThrow('not found');
  });

  it('validates an extended corpus.json: a tcp-server-json source with a bare file name', () => {
    const meta = { id: 'e', title: 't', protocol: 'B', origin: 'real', handshake: 'none', nSesid: 's', nLines: 25, source: { type: 'tcp-server-json', file: 'cmd.json' } };
    expect(() => validateCorpus(meta, 'e', { extended: true })).not.toThrow();
    expect(() => validateCorpus({ ...meta, source: { type: 'frames', file: 'x' } }, 'e', { extended: true })).toThrow('needs "source.type": "tcp-server-json"');
    expect(() => validateCorpus({ ...meta, source: { type: 'tcp-server-json', file: '../cmd.json' } }, 'e', { extended: true })).toThrow('a file name inside the extended folder');
  });
});
