'use strict';

/**
 * Stateful Bridge byte-stream decoder used only by the diagnostic viewer.
 * Capture files remain byte-for-byte raw; this decoder produces safe display
 * operations so STX/ETX commands are not rendered as transcript dots.
 */

const STX = 0x02;
const ETX = 0x03;
const VENDOR_META_START = 0xf9;
const VENDOR_META_END = 0xfa;
const MAX_COMMAND_BYTES = 4096;

const FIXED_LENGTHS = new Map([
  [0x50, 5], // P + uint16 LE page
  [0x4e, 4], // N + line
  [0x46, 4], // F + format
  [0x54, 7], // T + HH MM SS FF
  [0x44, 3], // D
  [0x4b, 3], // K (documented)
  [0x48, 3], // legacy Eclipse/parser K byte; kept visibly distinguishable
  [0x52, 11], // R + start/end timecodes
  [0x45, 3], // E
]);

const COMMAND_NAMES = new Map([
  [0x50, 'P'],
  [0x4e, 'N'],
  [0x46, 'F'],
  [0x54, 'T'],
  [0x44, 'D'],
  [0x4b, 'K'],
  [0x48, 'K_LEGACY'],
  [0x47, 'G'],
  [0x52, 'R'],
  [0x45, 'E'],
]);

function safeAscii(bytes) {
  return Buffer.from(bytes)
    .toString('latin1')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function suppressStandaloneMetadata(text) {
  // Observed Eclipse additions outside the published Bridge protocol. They
  // arrive as standalone chunks and describe the job/speaker, not spoken text.
  if (/^\s*SP\d{2}\s*$/.test(text)) return '';
  if (/^\s*RT[0-9A-Za-z_-]{6,}\s*$/.test(text)) return '';
  return text;
}

function timecode(buf, offset) {
  return {
    hour: buf[offset],
    minute: buf[offset + 1],
    second: buf[offset + 2],
    frame: buf[offset + 3],
  };
}

function describeCommand(buf) {
  const commandByte = buf[1];
  const command = COMMAND_NAMES.get(commandByte) || 'UNKNOWN';
  const operation = { type: 'command', command };

  switch (command) {
    case 'P':
      operation.page = buf.readUInt16LE(2);
      break;
    case 'N':
      operation.line = buf[2];
      break;
    case 'F':
      operation.format = buf[2];
      break;
    case 'T':
      operation.timecode = timecode(buf, 2);
      break;
    case 'G': {
      const searchLength = buf[2];
      const search = buf.subarray(3, 3 + searchLength);
      operation.filenameMarker = search.equals(Buffer.from('{FILENAME}', 'ascii'));
      break;
    }
    case 'R':
      operation.start = timecode(buf, 2);
      operation.end = timecode(buf, 6);
      break;
    default:
      break;
  }
  return operation;
}

class BridgePreviewDecoder {
  constructor() {
    this.commandBytes = null;
    this.expectedLength = null;
    this.unknownCommand = false;
    this.vendorMetaBytes = null;
  }

  push(chunk) {
    const input = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk || []);
    const operations = [];
    let textBytes = [];

    const flushText = () => {
      if (textBytes.length === 0) return;
      const text = suppressStandaloneMetadata(safeAscii(textBytes));
      if (text) operations.push({ type: 'text', text });
      textBytes = [];
    };

    for (const byte of input) {
      if (this.vendorMetaBytes !== null) {
        this.vendorMetaBytes.push(byte);
        if (byte === VENDOR_META_END) {
          operations.push({ type: 'command', command: 'VENDOR_META' });
          this.vendorMetaBytes = null;
        } else if (this.vendorMetaBytes.length >= MAX_COMMAND_BYTES) {
          operations.push({ type: 'warning', message: 'Oversized Eclipse metadata record hidden from transcript preview' });
          this.vendorMetaBytes = null;
        }
        continue;
      }

      if (this.commandBytes === null) {
        if (byte === VENDOR_META_START) {
          flushText();
          this.vendorMetaBytes = [byte];
        } else if (byte === STX) {
          flushText();
          this.commandBytes = [byte];
          this.expectedLength = null;
          this.unknownCommand = false;
        } else {
          textBytes.push(byte);
        }
        continue;
      }

      this.commandBytes.push(byte);

      if (this.commandBytes.length === 2) {
        if (byte === 0x47) {
          // G is variable length: STX,G,searchLen,search,replacementLen,
          // replacement,ETX (the form emitted by the live Eclipse capture).
          this.expectedLength = null;
        } else if (FIXED_LENGTHS.has(byte)) {
          this.expectedLength = FIXED_LENGTHS.get(byte);
        } else {
          this.unknownCommand = true;
        }
      }

      if (this.commandBytes[1] === 0x47 && this.commandBytes.length >= 4) {
        const searchLength = this.commandBytes[2];
        const replacementLengthOffset = 3 + searchLength;
        if (this.commandBytes.length > replacementLengthOffset) {
          const replacementLength = this.commandBytes[replacementLengthOffset];
          this.expectedLength = 5 + searchLength + replacementLength;
        }
      }

      const reachedKnownEnd = this.expectedLength !== null && this.commandBytes.length === this.expectedLength;
      const reachedUnknownEnd = this.unknownCommand && byte === ETX;
      const tooLong = this.commandBytes.length >= MAX_COMMAND_BYTES;
      if (!reachedKnownEnd && !reachedUnknownEnd && !tooLong) continue;

      const commandBuffer = Buffer.from(this.commandBytes);
      if ((reachedKnownEnd || reachedUnknownEnd) && commandBuffer[commandBuffer.length - 1] === ETX) {
        operations.push(describeCommand(commandBuffer));
      } else {
        operations.push({ type: 'warning', message: 'Malformed Bridge command hidden from transcript preview' });
      }
      this.commandBytes = null;
      this.expectedLength = null;
      this.unknownCommand = false;
    }

    flushText();
    return operations;
  }
}

module.exports = { BridgePreviewDecoder };
