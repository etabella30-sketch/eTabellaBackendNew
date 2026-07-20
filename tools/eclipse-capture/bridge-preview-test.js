#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { BridgePreviewDecoder } = require('./bridge-preview');

function command(name, data = []) {
  return Buffer.from([0x02, name.charCodeAt(0), ...data, 0x03]);
}

function globalReplacement(search, replacement) {
  const searchBytes = Buffer.from(search, 'ascii');
  const replacementBytes = Buffer.from(replacement, 'ascii');
  return Buffer.concat([
    Buffer.from([0x02, 0x47, searchBytes.length]),
    searchBytes,
    Buffer.from([replacementBytes.length]),
    replacementBytes,
    Buffer.from([0x03]),
  ]);
}

const source = Buffer.concat([
  globalReplacement('{FILENAME}', 'PRIVATE-NAME'),
  command('P', [0x1d, 0x02]),
  command('N', [18]),
  command('F', [1]),
  command('T', [17, 5, 12, 4]),
  Buffer.from('What is your name?', 'ascii'),
  command('D'),
  Buffer.from('.', 'ascii'),
  command('R', [17, 5, 0, 0, 17, 5, 12, 4]),
  command('E'),
  command('K'),
]);

const decoder = new BridgePreviewDecoder();
const operations = [];
// Deliberately split inside commands and text to prove transport chunking does
// not leak control bytes into the transcript.
for (let offset = 0; offset < source.length; offset += 3) {
  operations.push(...decoder.push(source.subarray(offset, offset + 3)));
}

const text = operations.filter((operation) => operation.type === 'text').map((operation) => operation.text).join('');
const commands = operations.filter((operation) => operation.type === 'command');

assert.strictEqual(text, 'What is your name?.');
assert.deepStrictEqual(commands.map((operation) => operation.command), ['G', 'P', 'N', 'F', 'T', 'D', 'R', 'E', 'K']);
assert.strictEqual(commands.find((operation) => operation.command === 'G').filenameMarker, true);
assert.strictEqual(commands.find((operation) => operation.command === 'P').page, 541);
assert.strictEqual(commands.find((operation) => operation.command === 'N').line, 18);
assert.strictEqual(commands.find((operation) => operation.command === 'F').format, 1);
assert.strictEqual(operations.some((operation) => operation.type === 'warning'), false);

const metadataDecoder = new BridgePreviewDecoder();
const metadataOperations = [
  ...metadataDecoder.push(Buffer.from([0xf9, 0x46])),
  ...metadataDecoder.push(Buffer.from([0x32, 0x38, 0x35, 0xfa])),
  ...metadataDecoder.push(Buffer.from('SP01', 'ascii')),
  ...metadataDecoder.push(Buffer.from('RT0716260001', 'ascii')),
  ...metadataDecoder.push(Buffer.from('Visible words', 'ascii')),
];
assert.strictEqual(
  metadataOperations.filter((operation) => operation.type === 'text').map((operation) => operation.text).join(''),
  'Visible words',
);
assert(metadataOperations.some((operation) => operation.command === 'VENDOR_META'));

console.log('BRIDGE PREVIEW TEST PASSED');
