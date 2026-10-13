const { test } = require('node:test');
const assert = require('node:assert/strict');
const { inspectWire, auditCapture } = require('./caseview-audit.cjs');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('inspects real byte delimiters separately from ordinary transcript text', () => {
  const bytes = Buffer.concat([Buffer.from('Mr Fayez at 10:00:00'),
    Buffer.from([0xf9]),Buffer.from('0001'),Buffer.from([0xfa,10]),
    Buffer.from([0xf9]),Buffer.from('0002'),Buffer.from([0xfa])]);
  assert.deepEqual(inspectWire(bytes), { bytes: bytes.length, markers: 2,
    markerShapes: { '4 hex digits': 2 }, incompleteMarkers: 0, rawLineBreaks: 1 });
});

test('observes a marker across captured TCP chunks and flags a truncated tail', () => {
  const chunks = [Buffer.from([0xf9,0x30]),Buffer.from('001'),Buffer.from([0xfa,0xf9,0x30])];
  assert.deepEqual(inspectWire(Buffer.concat(chunks)), { bytes: 8, markers: 1,
    markerShapes: { '4 hex digits': 1 }, incompleteMarkers: 1, rawLineBreaks: 0 });
});

test('replays CaseView and reports arrival timestamps without claiming source hearing times', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'qfact-caseview-audit-'));
  const bytes = Buffer.concat([Buffer.from('Q. First line.'),Buffer.from([0xf9]),
    Buffer.from('FFFF'),Buffer.from([0xfa]),Buffer.from('A. Second line.')]);
  fs.writeFileSync(path.join(directory,'payload.bin'),bytes);
  fs.writeFileSync(path.join(directory,'frames.ndjson'),JSON.stringify({kind:'tcp-data',
    ts:'2026-10-13T10:00:00Z',hex:bytes.toString('hex')})+'\n');
  try {
    const report = await auditCapture(directory);
    assert.equal(report.parsedNonemptyLines,2);
    assert.equal(report.verifiedSourceHearingLines,0);
    assert.equal(report.sourceHearingMetadataPresent,false);
    assert.equal(report.recognizedHearingFormat,null);
    assert.equal(report.receiptTimesUsedAsHearingTimes,false);
  } finally {
    // Remove only the three files/directory created by this test; no recursive delete.
    fs.unlinkSync(path.join(directory,'payload.bin'));
    fs.unlinkSync(path.join(directory,'frames.ndjson'));
    fs.rmdirSync(directory);
  }
});

test('recognizes captured Eclipse hearing markers independently of receipt time', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'qfact-caseview-audit-'));
  const bytes = Buffer.concat([Buffer.from([0xf9]),Buffer.from('3843'),Buffer.from([0xfa]),
    Buffer.from('First.'),Buffer.from([0xf9]),Buffer.from('3A43'),Buffer.from([0xfa]),Buffer.from('Second.')]);
  fs.writeFileSync(path.join(directory,'payload.bin'),bytes);
  fs.writeFileSync(path.join(directory,'frames.ndjson'),JSON.stringify({kind:'tcp-data',
    ts:'2026-10-13T02:55:00Z',hex:bytes.toString('hex')})+'\n');
  try {
    const report = await auditCapture(directory);
    assert.equal(report.verifiedSourceHearingLines,2);
    assert.equal(report.sourceHearingMetadataPresent,true);
    assert.equal(report.uniqueSourceIdentities,2);
    assert.match(report.recognizedHearingFormat,/two-second precision/);
    assert.equal(report.receiptTimesUsedAsHearingTimes,false);
  } finally {
    fs.unlinkSync(path.join(directory,'payload.bin'));
    fs.unlinkSync(path.join(directory,'frames.ndjson'));
    fs.rmdirSync(directory);
  }
});
