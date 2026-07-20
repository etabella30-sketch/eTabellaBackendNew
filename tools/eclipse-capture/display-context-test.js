#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { contextualizeDisplayOperations, resetDisplayProtocolStates } = require('./server');

function command(name, fields = {}) {
  return { type: 'command', command: name, ...fields };
}

const t1 = { hour: 17, minute: 17, second: 32, frame: 16 };
const t2 = { hour: 17, minute: 17, second: 35, frame: 0 };

resetDisplayProtocolStates();

let context = contextualizeDisplayOperations('ws-test', [
  command('P', { page: 2 }),
  command('N', { line: 11 }),
  command('T', { timecode: t1 }),
]);
assert.deepStrictEqual(context.cursor, { page: 2, line: 11, format: 0, timecode: t1 });
assert.strictEqual(context.inRefresh, false);

// Thousands of following word events can evict the original P/N/T operations
// from the viewer ring; every later event must still carry the same context.
context = contextualizeDisplayOperations('ws-test', [{ type: 'text', text: 'word' }]);
assert.strictEqual(context.cursor.page, 2);
assert.strictEqual(context.cursor.line, 11);
assert.deepStrictEqual(context.cursor.timecode, t1);

context = contextualizeDisplayOperations('ws-test', [
  command('R', { start: t1, end: t2 }),
]);
assert.strictEqual(context.inRefresh, true);
assert.deepStrictEqual(context.refreshBase, { page: 2, line: 11, format: 0, timecode: t1 });

context = contextualizeDisplayOperations('ws-test', [
  command('P', { page: 1 }),
  command('N', { line: 3 }),
  command('T', { timecode: t1 }),
  { type: 'text', text: 'corrected' },
]);
assert.strictEqual(context.inRefresh, true);
assert.strictEqual(context.cursor.page, 1);
assert.strictEqual(context.cursor.line, 3);
assert.deepStrictEqual(context.refreshStart, t1);
assert.deepStrictEqual(context.refreshEnd, t2);

// E exits refresh while restoring the untouched live cursor. Replacement
// positioning must never move the point where new realtime text is appended.
context = contextualizeDisplayOperations('ws-test', [command('E')]);
assert.strictEqual(context.inRefresh, false);
assert.strictEqual(context.cursor.page, 2);
assert.strictEqual(context.cursor.line, 11);
assert.deepStrictEqual(context.cursor.timecode, t1);

console.log('DISPLAY CONTEXT TEST PASSED');
