// Audit a CaseView capture against the Eclipse packed hearing-time format.
// Only counts/metadata leave this tool; captured transcript text stays on disk.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

function inspectWire(bytes) {
  const markerLengths = new Map();
  let markers = 0, incompleteMarkers = 0, rawLineBreaks = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 10) rawLineBreaks++;
    if (bytes[i] !== 0xf9) continue;
    const end = bytes.indexOf(0xfa, i + 1);
    if (end < 0) { incompleteMarkers++; break; }
    const length = end - i - 1;
    const hex = bytes.subarray(i + 1, end).toString('latin1');
    const shape = /^[0-9a-f]+$/i.test(hex) ? `${length} hex digits` : `${length} other bytes`;
    markerLengths.set(shape, (markerLengths.get(shape) || 0) + 1);
    markers++;
    i = end;
  }
  return { bytes: bytes.length, markers, markerShapes: Object.fromEntries(markerLengths),
    incompleteMarkers, rawLineBreaks };
}

async function auditCapture(directory) {
  const payload = fs.readFileSync(path.join(directory, 'payload.bin'));
  const frames = fs.readFileSync(path.join(directory, 'frames.ndjson'), 'utf8')
    .trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
    .filter(frame => ['tcp-data','text','binary'].includes(frame.kind));
  assert.deepEqual(Buffer.concat(frames.map(frame => Buffer.from(frame.hex, 'hex'))), payload,
    'Capture is still being written or its frame journal differs from the raw payload');
  require('ts-node').register({ transpileOnly: true });
  require('tsconfig-paths/register');
  const { CaseviewParserService, createSessionContext } = require('../../libs/feed-parse/src');
  const { hearingTimecode, HEARING_TIME_SLOT } = require('../../libs/api-contracts/src');
  const parser = new CaseviewParserService();
  const noop = async () => 1;
  const ctx = createSessionContext({ nSesid: 'caseview-wire-audit', protocol: 'C', cTimezone: 'UTC',
    sink: { emitLocal() {}, emitDelivery() {}, log() {}, saveLine: noop,
      saveMetaData: noop, removeLines: noop, savePageData: noop, runAnnotTransfer: noop } });
  for (const frame of frames) {
    await parser.parseData(ctx, Buffer.from(frame.hex, 'hex'), Date.parse(frame.ts));
    await new Promise(resolve => ctx.parseQueue.addTask(resolve));
  }
  const nonempty = ctx.job.lineBuffer.filter(line => Array.isArray(line?.[1]) && line[1].length);
  const verified = nonempty.filter(line => hearingTimecode(line[HEARING_TIME_SLOT]));
  return { ...inspectWire(payload), chunks: frames.length, parsedNonemptyLines: nonempty.length,
    verifiedSourceHearingLines: verified.length,
    sourceHearingMetadataPresent: nonempty.length > 0 && verified.length === nonempty.length,
    receiptTimesUsedAsHearingTimes: false,
    recognizedHearingFormat: verified.length ? 'Eclipse CaseView F9/FA, little-endian packed time, two-second precision' : null,
    uniqueSourceIdentities: new Set(nonempty.map(line => line[6])).size,
    nextStep: verified.length ? 'Use a new session with the matching cloud and venue parser release.'
      : 'This capture has no valid source hearing clock; capture stays instant and lines remain separate.' };
}

if (require.main === module) {
  const directory = process.argv[2];
  if (!directory) { console.error('Usage: node tools/eclipse-capture/caseview-audit.cjs <CaseView capture directory>'); process.exitCode = 2; }
  else auditCapture(directory).then(report => console.log(JSON.stringify(report,null,2)))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { inspectWire, auditCapture };
