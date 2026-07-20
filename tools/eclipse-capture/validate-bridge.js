#!/usr/bin/env node
/**
 * Privacy-safe validator for Eclipse Bridge Mobile WebSocket captures.
 *
 * It validates command framing and fields from the supplied Bridge
 * Communication Protocol PDF. It deliberately never prints transcript bytes,
 * filenames, frame hex, or UTF-8 previews.
 *
 * Usage:
 *   node tools/eclipse-capture/validate-bridge.js <capture-dir|frames.ndjson>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const STX = 0x02;
const ETX = 0x03;

const COMMANDS = new Map([
  [0x50, { name: 'P', length: 5 }],
  [0x4e, { name: 'N', length: 4 }],
  [0x46, { name: 'F', length: 4 }],
  [0x54, { name: 'T', length: 7 }],
  [0x44, { name: 'D', length: 3 }],
  [0x4b, { name: 'K', length: 3 }],
  [0x47, { name: 'G', length: null }],
  [0x52, { name: 'R', length: 11 }],
  [0x45, { name: 'E', length: 3 }],
]);

function emptyCounts() {
  return Object.fromEntries([...COMMANDS.values()].map((command) => [command.name, 0]));
}

function addIssue(result, severity, frameNumber, message) {
  result[severity].push({ frame: frameNumber, message });
}

function validTimecode(buf, offset) {
  const hour = buf[offset];
  const minute = buf[offset + 1];
  const second = buf[offset + 2];
  const frame = buf[offset + 3];
  return hour <= 23 && minute <= 59 && second <= 59 && frame <= 29;
}

function isObservedEclipseRefreshEndMarker(buf, offset) {
  // Eclipse 12 repeatedly emits this value as the ending field of an R
  // command. It is outside the clock range documented by the PDF, so retain it
  // as an explicit, warned vendor observation—not as a generally valid time.
  return buf.subarray(offset, offset + 4).equals(Buffer.from([0x54, 0x1f, 0x17, 0x13]));
}

function validateGlobalReplacement(buf) {
  // STX, G, search-length, search, replacement-length, replacement, ETX
  if (buf.length < 6 || buf[buf.length - 1] !== ETX) {
    return { valid: false, reason: 'G command is truncated or missing ETX' };
  }
  const searchLength = buf[2];
  const replacementLengthOffset = 3 + searchLength;
  if (replacementLengthOffset >= buf.length - 1) {
    return { valid: false, reason: 'G search length exceeds command boundary' };
  }
  const replacementLength = buf[replacementLengthOffset];
  const expectedLength = 5 + searchLength + replacementLength;
  if (buf.length !== expectedLength) {
    return {
      valid: false,
      reason: `G length fields require ${expectedLength} bytes but message has ${buf.length}`,
    };
  }
  const search = buf.subarray(3, 3 + searchLength);
  return {
    valid: true,
    filenameMarker: search.equals(Buffer.from('{FILENAME}', 'ascii')),
  };
}

function validateCommand(buf, frameNumber, result, state) {
  if (buf.length < 2) {
    addIssue(result, 'errors', frameNumber, 'STX message has no command byte');
    return;
  }

  const commandByte = buf[1];
  const command = COMMANDS.get(commandByte);
  if (!command) {
    if (commandByte === 0x48) {
      addIssue(
        result,
        'errors',
        frameNumber,
        'H command is not defined by the PDF; the legacy parser labels 0x48 as K, while the PDF defines K as 0x4B',
      );
    } else {
      addIssue(result, 'errors', frameNumber, `unknown Bridge command byte 0x${commandByte.toString(16).padStart(2, '0')}`);
    }
    return;
  }

  result.commands[command.name] += 1;
  result.commandMessages += 1;

  if (command.name === 'G') {
    const globalResult = validateGlobalReplacement(buf);
    if (!globalResult.valid) {
      addIssue(result, 'errors', frameNumber, globalResult.reason);
      return;
    }
    if (globalResult.filenameMarker) result.filenameMarkers += 1;
    return;
  }

  if (buf.length !== command.length) {
    addIssue(
      result,
      'errors',
      frameNumber,
      `${command.name} command must be ${command.length} bytes but message has ${buf.length}`,
    );
    return;
  }
  if (buf[buf.length - 1] !== ETX) {
    addIssue(result, 'errors', frameNumber, `${command.name} command is missing ETX`);
    return;
  }

  switch (command.name) {
    case 'P': {
      const page = buf.readUInt16LE(2);
      result.ranges.pageMin = Math.min(result.ranges.pageMin, page);
      result.ranges.pageMax = Math.max(result.ranges.pageMax, page);
      break;
    }
    case 'N': {
      const line = buf[2];
      result.ranges.lineMin = Math.min(result.ranges.lineMin, line);
      result.ranges.lineMax = Math.max(result.ranges.lineMax, line);
      break;
    }
    case 'F': {
      const format = buf[2];
      if (format > 0x0b) result.userDefinedFormatCommands += 1;
      break;
    }
    case 'T':
      if (!validTimecode(buf, 2)) {
        addIssue(result, 'errors', frameNumber, 'T command has an out-of-range timecode');
      }
      break;
    case 'R':
      if (!validTimecode(buf, 2)) {
        addIssue(result, 'errors', frameNumber, 'R command has an out-of-range starting timecode');
      }
      if (!validTimecode(buf, 6)) {
        if (isObservedEclipseRefreshEndMarker(buf, 6)) {
          result.undocumentedRefreshEndMarkers += 1;
          result.firstUndocumentedRefreshEndMarkerFrame ??= frameNumber;
        } else {
          addIssue(result, 'errors', frameNumber, 'R command has an out-of-range ending timecode');
        }
      }
      if (state.refreshOpen) {
        addIssue(result, 'errors', frameNumber, 'R command starts a nested refresh before the previous E');
      }
      state.refreshOpen = true;
      state.refreshStartFrame = frameNumber;
      break;
    case 'E':
      if (!state.refreshOpen) {
        addIssue(result, 'errors', frameNumber, 'E command appears without an open R refresh');
      }
      state.refreshOpen = false;
      state.refreshStartFrame = null;
      break;
    default:
      break;
  }
}

function normalizeRanges(ranges) {
  return {
    pageMin: Number.isFinite(ranges.pageMin) ? ranges.pageMin : null,
    pageMax: Number.isFinite(ranges.pageMax) ? ranges.pageMax : null,
    lineMin: Number.isFinite(ranges.lineMin) ? ranges.lineMin : null,
    lineMax: Number.isFinite(ranges.lineMax) ? ranges.lineMax : null,
  };
}

function resolveInput(input) {
  const absolute = path.resolve(input);
  const stat = fs.statSync(absolute);
  if (stat.isDirectory()) {
    return {
      captureDir: absolute,
      framesPath: path.join(absolute, 'frames.ndjson'),
      closed: fs.existsSync(path.join(absolute, 'summary.json')),
    };
  }
  return {
    captureDir: path.dirname(absolute),
    framesPath: absolute,
    closed: fs.existsSync(path.join(path.dirname(absolute), 'summary.json')),
  };
}

async function validateCapture(input) {
  const source = resolveInput(input);
  if (!fs.existsSync(source.framesPath)) throw new Error(`frames.ndjson not found: ${source.framesPath}`);

  const result = {
    protocol: 'Bridge Communication Protocol',
    source: source.framesPath,
    captureClosed: source.closed,
    status: 'PASS',
    recordsRead: 0,
    dataMessages: 0,
    dataBytes: 0,
    commandMessages: 0,
    transcriptMessages: 0,
    transcriptBytes: 0,
    commands: emptyCounts(),
    filenameMarkers: 0,
    userDefinedFormatCommands: 0,
    undocumentedRefreshEndMarkers: 0,
    firstUndocumentedRefreshEndMarkerFrame: null,
    ranges: {
      pageMin: Number.POSITIVE_INFINITY,
      pageMax: Number.NEGATIVE_INFINITY,
      lineMin: Number.POSITIVE_INFINITY,
      lineMax: Number.NEGATIVE_INFINITY,
    },
    errors: [],
    warnings: [],
  };
  const state = { refreshOpen: false, refreshStartFrame: null };

  const inputStream = fs.createReadStream(source.framesPath, { encoding: 'utf8' });
  const lines = readline.createInterface({ input: inputStream, crlfDelay: Infinity });
  let lineNumber = 0;

  for await (const line of lines) {
    lineNumber += 1;
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch (_) {
      // A capture that is still being written can expose only its final line
      // before the write completes. Treat only that live-tail case as a warning.
      if (!source.closed) {
        addIssue(result, 'warnings', lineNumber, 'ignored an incomplete live-capture tail record');
        continue;
      }
      addIssue(result, 'errors', lineNumber, 'invalid JSON record in frames.ndjson');
      continue;
    }

    result.recordsRead += 1;
    if (record.kind !== 'binary' && record.kind !== 'text') continue;
    result.dataMessages += 1;

    if (typeof record.hex !== 'string' || record.hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(record.hex)) {
      addIssue(result, 'errors', record.i || lineNumber, 'data record has invalid or missing hex payload');
      continue;
    }
    const buf = Buffer.from(record.hex, 'hex');
    result.dataBytes += buf.length;
    if (Number.isInteger(record.bytes) && record.bytes !== buf.length) {
      addIssue(result, 'errors', record.i || lineNumber, 'record byte count does not match captured payload length');
    }

    if (buf.length > 0 && buf[0] === STX) {
      validateCommand(buf, record.i || lineNumber, result, state);
    } else {
      result.transcriptMessages += 1;
      result.transcriptBytes += buf.length;
    }
  }

  if (state.refreshOpen) {
    const severity = source.closed ? 'errors' : 'warnings';
    addIssue(result, severity, state.refreshStartFrame, 'capture ends while an R refresh is still open (no E yet)');
  }
  if (result.commandMessages === 0) {
    addIssue(result, 'errors', null, 'no Bridge command messages were found');
  }
  if (result.filenameMarkers === 0) {
    addIssue(result, 'warnings', null, 'no G/{FILENAME} job-name marker was found');
  }
  if (result.undocumentedRefreshEndMarkers > 0) {
    addIssue(
      result,
      'warnings',
      result.firstUndocumentedRefreshEndMarkerFrame,
      `${result.undocumentedRefreshEndMarkers} R command(s) use a repeatable Eclipse ending marker that is not documented as a valid timecode in the PDF`,
    );
  }
  if (!source.closed) {
    addIssue(result, 'warnings', null, 'capture is still active; this result is a point-in-time snapshot');
  }

  result.ranges = normalizeRanges(result.ranges);
  result.status = result.errors.length > 0 ? 'FAIL' : result.warnings.length > 0 ? 'PASS_WITH_WARNINGS' : 'PASS';
  return result;
}

function printResult(result) {
  // JSON is intentional: it is machine-readable and contains only counts,
  // protocol fields, and validation messages—never transcript content.
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { validateCapture, validateGlobalReplacement, validTimecode, isObservedEclipseRefreshEndMarker };

if (require.main === module) {
  const input = process.argv[2];
  if (!input || input === '--help' || input === '-h') {
    console.log('usage: node validate-bridge.js <capture-dir|frames.ndjson>');
    process.exit(input ? 0 : 2);
  }
  validateCapture(input)
    .then((result) => {
      printResult(result);
      process.exitCode = result.errors.length > 0 ? 1 : 0;
    })
    .catch((err) => {
      console.error(`Bridge validation failed to run: ${err.message}`);
      process.exitCode = 2;
    });
}
