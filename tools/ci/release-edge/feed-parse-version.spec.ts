import * as fs from 'fs';
import * as path from 'path';
// version.ts itself, not the lib index: the index pulls in every parser
// service, and this spec should not fail on someone else's work in progress.
import { FEED_PARSE_VERSION } from '../../../libs/feed-parse/src/version';
import { parseFeedParseVersion, readFeedParseVersion, VERSION_FILE } from './feed-parse-version';
import { memoryFs } from './spec-fakes';

describe('parseFeedParseVersion', () => {
  it('reads a single-quoted, double-quoted or typed declaration', () => {
    expect(parseFeedParseVersion("export const FEED_PARSE_VERSION = '1.2.3';")).toBe('1.2.3');
    expect(parseFeedParseVersion('export const FEED_PARSE_VERSION = "2.0.0-det.1"')).toBe('2.0.0-det.1');
    expect(parseFeedParseVersion("export const FEED_PARSE_VERSION: string = '3.0.0';")).toBe('3.0.0');
  });

  it('ignores the name inside a comment line', () => {
    const src = [
      '/**',
      " * e.g. FEED_PARSE_VERSION = '0.0.0' in older notes",
      ' */',
      "export const FEED_PARSE_VERSION = '1.0.0';",
    ].join('\n');
    expect(parseFeedParseVersion(src)).toBe('1.0.0');
  });

  it.each([
    ['', 'no `export const FEED_PARSE_VERSION'],
    ['export const FEED_PARSE_VERSION = VERSION_FROM_ELSEWHERE;', 'no `export const FEED_PARSE_VERSION'],
    ["export const FEED_PARSE_VERSION = '';", 'is empty'],
    ["export const FEED_PARSE_VERSION = '1.0 beta';", 'contains whitespace'],
    ["export const FEED_PARSE_VERSION = '" + 'x'.repeat(61) + "';", 'longer than 60'],
    ["export const FEED_PARSE_VERSION = '1';\nexport const FEED_PARSE_VERSION = '2';", 'declared 2 times'],
  ])('refuses %j', (src, message) => {
    expect(() => parseFeedParseVersion(src)).toThrow(message);
  });

  it('names the file when it cannot be read', () => {
    expect(() => readFeedParseVersion(memoryFs(), '/nowhere/version.ts')).toThrow(/cannot read .*version\.ts/);
  });
});

describe('libs/feed-parse/src/version.ts', () => {
  const libSrc = path.resolve(__dirname, '..', '..', '..', 'libs', 'feed-parse', 'src');

  it('is readable by the release tools and matches the compiled constant', () => {
    // Reads the real file (read-only) so the text parser and the compiled export cannot drift apart.
    const file = path.resolve(__dirname, '..', '..', '..', ...VERSION_FILE.split('/'));
    expect(readFeedParseVersion(fs, file)).toBe(FEED_PARSE_VERSION);
    expect(FEED_PARSE_VERSION).toBe('1.0.0');
  });

  it('is re-exported from @app/feed-parse', () => {
    const index = fs.readFileSync(path.join(libSrc, 'index.ts'), 'utf8');
    expect(index.split(/\r?\n/)).toContain("export * from './version';");
  });
});
