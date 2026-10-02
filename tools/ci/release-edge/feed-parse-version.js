'use strict';
/**
 * Reads FEED_PARSE_VERSION from libs/feed-parse/src/version.ts as text.
 *
 * The release tools are plain node scripts, so they parse the literal rather
 * than compile the lib. version.ts keeps it a plain string for that reason.
 */

const VERSION_FILE = 'libs/feed-parse/src/version.ts';

/** Same width as the planned RSessionMaster."cParserVer" varchar(60). */
const MAX_LENGTH = 60;

const DECLARATION_RE = /^export\s+const\s+FEED_PARSE_VERSION\s*(?::\s*string\s*)?=\s*(['"])([^'"\r\n]*)\1\s*;?/gm;

/** Returns the version string, or throws an Error saying what is wrong. */
function parseFeedParseVersion(source) {
  const found = [...String(source).matchAll(DECLARATION_RE)];
  if (found.length === 0) throw new Error('no `export const FEED_PARSE_VERSION = \'…\'` declaration');
  if (found.length > 1) throw new Error('FEED_PARSE_VERSION is declared ' + found.length + ' times');
  const value = found[0][2];
  if (!value.trim()) throw new Error('FEED_PARSE_VERSION is empty');
  if (/\s/.test(value)) throw new Error('FEED_PARSE_VERSION contains whitespace: "' + value + '"');
  if (value.length > MAX_LENGTH) throw new Error('FEED_PARSE_VERSION is longer than ' + MAX_LENGTH + ' characters');
  return value;
}

/** Reads and parses a version.ts file; errors name the file. */
function readFeedParseVersion(fs, file) {
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error('cannot read ' + file + ': ' + err.message);
  }
  try {
    return parseFeedParseVersion(source);
  } catch (err) {
    throw new Error(file + ': ' + err.message);
  }
}

module.exports = { VERSION_FILE, parseFeedParseVersion, readFeedParseVersion };
