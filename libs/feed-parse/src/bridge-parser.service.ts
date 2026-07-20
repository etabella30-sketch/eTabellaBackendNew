/**
 * BridgeParserService — singleton-free port of the LIVE Bridge ('B' protocol)
 * command-handler + refresh pipeline from
 * apps/realtime/src/bridge-parse/bridge-parse.service.ts (Phase 2 of
 * docs/eclipse-wss-ingest-plan.md).
 *
 * PORT PROVENANCE (legacy line numbers refer to the apps/realtime source):
 *  - SendToParseData entry (144-166)          -> sendToParseData(ctx, ...) on ctx.bridgeQueue
 *  - startProcess/getParseCMDS/parseDataBridge (172-226)
 *  - handleCommand/handleText/finalizeLine/updateLineBuffer/refreshReplaceData (272-748)
 *  - sortArray/convertSortTimestamp (229-270), removeTimestampsInRange (801-927)
 *  - convertToFrame/convertToFrameWithoutNanoSec (929-943)
 *  - onRefreshEnd (945-1245) incl. identity reassignment + finalNewLines re-insert
 *  - SendRefreshDataToUser (2211-2253), emitToLocalUser (2545-2601)
 *  - IdentityFixService (apps/realtime/src/services/identity-fix/identity-fix.service.ts)
 *    copied verbatim below as `IdentityFix` (pure computation, zero app deps)
 *  - VerifyTabsService.verify (services/verify-tabs/verify-tabs.service.ts:28-62)
 *    copied as the pure helper `verifyTabs` — the case-tab list itself is
 *    session state and is read from the context (see CtxWithTabs note).
 *
 * NOT PORTED (quarantine list, docs/feed-parse-quarantine.md):
 *  - debugger statements (59, 118, 948, 1315)
 *  - @OnEvent handlers + fetchSessionFeedToLocal (57-68, 116-141) — Phase-3 ingest wiring
 *  - setServer/server field, getCurrentServerSocket — delivery lives behind ctx.sink
 *  - commands_replace.txt / logs/s_<id> file writes — routed to ctx.sink.log
 *  - handleAnnotTransfer python/SP block (1263-2117) — collapsed to ONE
 *    ctx.sink.runAnnotTransfer(...) call; the implementation stays out of the lib
 *  - removeExtraLines (597-620) — dead code, its only call site is commented out
 *  - fetchPreviousData/getPageData (725-787) — client-history serving, not parsing
 *  - this.cmds / isChecked / isContinue / isComplete instance counters — CLI-stat
 *    instance state; isContinue's log message now reports ctx.refreshCounter
 *
 * HARD RULE: this service is STATELESS. No session state on `this` — only a
 * Logger, the pure `formates` table, the pure IdentityFix helper and the
 * currentSessionHaveRefresh constant (hardcoded `true` in the legacy
 * SessionService, session.service.ts:39). Every method takes a SessionContext.
 *
 * The algorithm is otherwise VERBATIM — same branch structure, same tuple
 * shapes, same arithmetic. The Phase-2 exit test is byte-identical output vs
 * the legacy parser; do not "improve" logic here.
 */
import { Injectable, Logger } from '@nestjs/common';
import { SessionContext } from './session-context';
import { mapWinByte } from './win-char-map';

/** Local re-declaration of apps/realtime/src/interfaces/transfer.interface.ts:1
 *  (the lib must not import from apps/). */
export type FeedFormate =
  | 'FL'
  | 'QES'
  | 'ANS'
  | 'SPKR'
  | 'QES-CONTINUE'
  | 'ANS-CONTINUE'
  | 'SPKR-CONTINUE'
  | 'PRNTH'
  | 'CNTRD'
  | 'RHT-FLS'
  | 'BY-LINE'
  | 'BY-LINE-CONTINUE'
  | 'USR-DEFIND';

/**
 * The legacy VerifyTabsService keeps the case-tab list as DB-backed singleton
 * state. That list is per-session/case configuration, so the host app supplies
 * it on the context. Structural extension because the contract file
 * (session-context.ts) is owned by the orchestrator; when absent the behavior
 * matches the legacy "tabs not fetched yet" state (empty list -> no matches).
 */
type CtxWithTabs = SessionContext & { caseTabs?: string[] };

/**
 * Verbatim copy of apps/realtime/src/services/identity-fix/identity-fix.service.ts.
 * Pure computation — validates/repairs the strictly-ascending identity sequence
 * assigned to refresh replacement lines.
 */
export class IdentityFix {
  /**
   * values: Array<[number, boolean?]>
   * Example: [[807607293607200],[807607308664300],[807607331119500,true],...]
   */

  /** Validate: numbers, unique, strictly ascending. Never mutates. */
  validateValues(values) {
    const errors = [];
    const seen = new Set();

    for (let i = 0; i < values.length; i++) {
      const entry = values[i];
      if (!Array.isArray(entry) || entry.length === 0) {
        errors.push(`Index ${i}: entry must be [identity, optionalBoolean]`);
        continue;
      }
      const [id] = entry;

      if (typeof id !== 'number' || !Number.isFinite(id)) {
        errors.push(`Index ${i}: identity must be a finite number`);
        continue;
      }
      if (!Number.isSafeInteger(id)) {
        errors.push(`Index ${i}: identity ${id} is not a safe integer`);
      }
      if (seen.has(id)) {
        errors.push(`Index ${i}: duplicate identity ${id}`);
      }
      seen.add(id);

      if (i > 0) {
        const [prevId] = values[i - 1];
        if (!(id > prevId)) {
          errors.push(
            `Index ${i}: identity ${id} is not greater than previous ${prevId}`
          );
        }
      }
    }

    return { ok: errors.length === 0, errors };
  }

  /**
   * Attempt to fix only non-fixed entries by minimally bumping them up so the
   * sequence is strictly increasing. Never changes fixed ones. Never reorders.
   * Returns { ok, values, error? }
   */
  attemptFix(values) {
    // shallow copy and normalize the fixed flag to boolean
    const out = values.map(v => [v[0], v[1] === true]);
    const n = out.length;

    // Precompute the next fixed identity to the right for each index
    const nextFixedId = new Array(n).fill(Infinity);
    let next = Infinity;
    for (let i = n - 1; i >= 0; i--) {
      const [id, fixed] = out[i];
      if (fixed) next = id;
      nextFixedId[i] = next;
    }

    // Forward pass: enforce strictly increasing, only bump non-fixed
    for (let i = 0; i < n; i++) {
      const [id, fixed] = out[i];
      const prevId = i === 0 ? -Infinity : out[i - 1][0];

      if (fixed) {
        // If a fixed entry violates order vs previous, we cannot fix.
        if (!(id > prevId)) {
          return {
            ok: false,
            error: `Fixed id at index ${i} (${id}) is not greater than previous (${prevId}). Cannot change a fixed id.`,
            values: out
          };
        }
        continue;
      }

      // Non-fixed: minimally bump to be > prevId
      let newId = Math.max(id, (Number.isFinite(prevId) ? prevId : -Infinity) + 1);

      // Must remain below the next fixed anchor (if any)
      if (!(newId < nextFixedId[i])) {
        return {
          ok: false,
          error: `Cannot assign a valid id at index ${i} without reaching or exceeding next fixed id ${nextFixedId[i]}.`,
          values: out
        };
      }
      // Ensure safe integer
      if (!Number.isSafeInteger(newId)) {
        return {
          ok: false,
          error: `Computed id ${newId} at index ${i} is not a safe integer.`,
          values: out
        };
      }
      out[i][0] = newId;
    }

    // Final sanity check
    const { ok, errors } = this.validateValues(out);
    if (!ok) {
      return { ok: false, error: errors.join('; '), values: out };
    }
    return { ok: true, values: out };
  }
}

@Injectable()
export class BridgeParserService {
  private logger = new Logger('bridge-viewer');

  /** Pure constant — legacy bridge-parse.service.ts:35-47. */
  formates: { key: any; value: FeedFormate }[] = [
    { key: `0x00`, value: 'FL' },
    { key: 0x01, value: 'QES' },
    { key: 0x02, value: 'ANS' },
    { key: 0x03, value: 'SPKR' },
    { key: 0x04, value: 'QES-CONTINUE' },
    { key: 0x05, value: 'ANS-CONTINUE' },
    { key: 0x06, value: 'SPKR-CONTINUE' },
    { key: 0x07, value: 'PRNTH' },
    { key: 0x08, value: 'CNTRD' },
    { key: 0x09, value: 'RHT-FLS' },
    { key: 0x0A, value: 'BY-LINE' },
    { key: 0x0B, value: 'BY-LINE-CONTINUE' },
    { key: 0x0C, value: 'USR-DEFIND' },
  ];

  /** Legacy SessionService.currentSessionHaveRefresh (session.service.ts:39) is
   *  hardcoded `true` and never set false in the live path — pure constant. */
  private readonly currentSessionHaveRefresh = true;

  /** Pure helper — see IdentityFix above. */
  private readonly identityFixService = new IdentityFix();

  // ---------------------------------------------------------------------------
  // Entry point (legacy SendToParseData, 144-166)
  // ---------------------------------------------------------------------------

  /** Enqueue one framed bridge command for this session. Ordering is preserved
   *  per session via ctx.bridgeQueue (was the service-level this.taskQueue). */
  public sendToParseData(ctx: SessionContext, hexBuffer: Buffer, cmdData: any): void {
    ctx.bridgeQueue.addTask(async () => {
      try {
        await this.startProcess(ctx, hexBuffer, cmdData);
      } catch (error) {
      }
    });
  }

  private async startProcess(ctx: SessionContext, incomingBuffer: Buffer, CMD_DATA: any): Promise<boolean> {
    try {
      await this.getParseCMDS(ctx, incomingBuffer, CMD_DATA);
      return true;
    } catch (error) {
      console.error('Error processing buffer:', error);
      return false;
    }
  }

  private async getParseCMDS(ctx: SessionContext, incomingBuffer: Buffer, CMD_DATA: any): Promise<any> {
    try {
      try {
        const buffer = Buffer.from(CMD_DATA['hexCmd'], 'hex');
        const CMDdata = CMD_DATA;

        await this.parseDataBridge(ctx, buffer, CMDdata);
      } catch (error) {
        console.log('ERROR', error);
      }
    } catch (error) {
      console.log('ERROR', error);
    }

    return true;
  }

  private async parseDataBridge(ctx: SessionContext, incomingBuffer: Buffer, CMDdata: any): Promise<boolean> {
    const currentJob = ctx.job;

    if (CMDdata.cmdType) {
      await this.handleCommand(ctx, CMDdata.cmdType, CMDdata, incomingBuffer);
    } else {
      for (let i = 0; incomingBuffer.length > i; i++) {
        await this.handleText(ctx, incomingBuffer[i]);
      }
    }

    try {
      currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
    } catch (error) {
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Sorting / timestamp helpers (pure — legacy 229-270, 929-943)
  // ---------------------------------------------------------------------------

  convertSortTimestamp(timestamp) {
    if (!timestamp) return '';
    // Convert the timestamp into frames (assuming 30 frames per second)
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
  }

  // [crTm, [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null, null, null, null];
  sortArray(array) {
    array.sort((a, b) => {
      const frameA: any = this.convertSortTimestamp(a?.[0] ?? 0);
      const frameB: any = this.convertSortTimestamp(b?.[0] ?? 0);
      if (frameA !== frameB) return frameA - frameB;

      const valA2 = a?.[6] ?? 0;
      const valB2 = b?.[6] ?? 0;
      if (valA2 !== valB2) return valA2 - valB2;
    });

    try {
      array.map((line, index) => line[2] = index);
    } catch (error) {
    }
  }

  convertToFrame(timestamp) {
    if (!timestamp) return '';
    // Convert the timestamp into frames (assuming 30 frames per second)
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
  }

  convertToFrameWithoutNanoSec(timestamp) {
    if (!timestamp) return '';
    // Convert the timestamp into frames (assuming 30 frames per second)
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30);
  }

  /**
   * D3: inverse of convertToFrame — reconstruct the HH:MM:SS:FF string (30 fps,
   * with rollover) from a total-frame count. Produces the SAME zero-padded
   * format sliceDate emits, so a bumped timestamp round-trips through
   * convertToFrame and string-compares equal to a normally-decoded one.
   */
  frameToTimestamp(totalFrames: number): string {
    const frames = totalFrames % 30;
    const totalSeconds = Math.floor(totalFrames / 30);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    return `${this.sliceDate(hours)}:${this.sliceDate(minutes)}:${this.sliceDate(seconds)}:${this.sliceDate(frames)}`;
  }

  sliceDate(date: any) {
    try {
      return ('0000' + date.toString()).slice(-2);
    } catch (error) {
      return date;
    }
  }

  /** Legacy UtilityService.getIndianTM (utility.service.ts:64-71) — pure. */
  private getIndianTM(): string {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  /** Port of VerifyTabsService.verify (verify-tabs.service.ts:28-62) with the
   *  case-tab list read from the context instead of singleton DB state. */
  private async verifyTabs(ctx: SessionContext, charcodes: any[]): Promise<string[]> {
    try {
      const caseTabs = (ctx as CtxWithTabs).caseTabs || [];
      // Convert character codes to a string efficiently
      const data = String.fromCharCode(...charcodes);

      // Initialize an array to collect matches
      const matches: string[] = [];

      // Use a regular expression to find matches one by one
      const regex = /\{(.*?)\}/g;
      let match;

      // Process each match incrementally to save memory
      while ((match = regex.exec(data)) !== null) {
        const value = match[1];

        // Check if the value exists in caseTabs and add to results if true
        const key = value.split(/[\s-]/)[0]; // Split by space or hyphen and take the first part
        if (caseTabs.includes(key)) {
          matches.push(`{${value}}`);
        }
      }

      return matches; // Return the filtered and formatted matches
    } catch (error) {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Command handling (legacy handleCommand, 272-500)
  // ---------------------------------------------------------------------------

  async handleCommand(ctx: SessionContext, command: string, CMDdata: any, data: Buffer): Promise<boolean> {
    const currentJob = ctx.job;
    try {
      switch (command) {
        case 'P': // Page Number Command
          await this.finalizeLine(ctx);
          if (data.length >= 2) {
            currentJob.currentPage = data.readUInt16LE(2); // Little-endian
            ctx.sink.saveMetaData(ctx.nSesid, currentJob);
          }
          break;
        case 'N': // Line Number Command
          await this.finalizeLine(ctx);
          if (data.length >= 1) {
            const receivedLineNumber = data.readUInt8(2);

            currentJob.currentLineNumber = receivedLineNumber;
            // Calculate the actual line count based on the page number
            if (!currentJob.lineCount) {
              currentJob.lineCount = 0;
            }

            if (currentJob.isRefresh) {
              return;
            }
            currentJob.lineCount++;
            currentJob.lineBuffer[currentJob.lineCount] = ['', [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null];
            currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
            ctx.sink.saveMetaData(ctx.nSesid, currentJob);
          }
          break;
        case 'F':
          if (data.length >= 1) {
            const formatCode = data.readUInt8(2);
            const format = this.formates.find(f => parseInt(f.key, 16) === formatCode);
            if (format) {
              currentJob.currentFormat = format.value; // Store the format in currentJob
              // D9: vendor 'F' is inert on the line model. Do NOT clear crLine
              // here — a mid-line format change must not drop already-typed
              // characters (Bridge Mobile keeps them; legacy dropped them).
              ctx.sink.saveMetaData(ctx.nSesid, currentJob);
            }
          }
          break;
        case 'T': // Timecode Command
          await this.finalizeLine(ctx);
          if (data.length >= 4) {
            const hours = this.sliceDate(data.readUInt8(2));
            const minutes = this.sliceDate(data.readUInt8(3));
            const seconds = this.sliceDate(data.readUInt8(4));
            const frames = this.sliceDate(data.readUInt8(5));
            currentJob.currentTimestamp = `${hours}:${minutes}:${seconds}:${frames}`; // Store the timestamp in currentJob

            // D3: monotonic-timecode guard (vendor Protocol 'T'). A backward or
            // equal-lower live timecode corrupts later refresh range math, since
            // applyRefresh/removeTimestampsInRange key entirely off timecodes.
            // Bump to prev+1 frame. Live-only; strict-greater (equal passes).
            // Our 'N' seeds slot [0] with '', so fall back to the previous line's
            // timecode (mirrors the vendor's inherited line(-1).timecode).
            if (!currentJob.isRefresh) {
              const curTs = currentJob.lineBuffer[currentJob.lineCount]?.[0];
              const prevTs = (curTs && curTs !== '0:0:0:0')
                ? curTs
                : currentJob.lineBuffer[currentJob.lineCount - 1]?.[0];
              const prevFrame = prevTs ? this.convertToFrame(prevTs) : '';
              const newFrame = this.convertToFrame(currentJob.currentTimestamp);
              if (prevFrame !== '' && newFrame !== '' && prevFrame > newFrame) {
                currentJob.currentTimestamp = this.frameToTimestamp(prevFrame + 1);
              }
            }

            this.refreshReplaceData(ctx);
            if (!currentJob.isRefresh) {
              try {
                currentJob.lineBuffer[currentJob.lineCount][0] = currentJob.currentTimestamp;
              } catch (error) {
              }
            }
            await this.updateLineBuffer(ctx); // Update after deletion
            ctx.sink.saveMetaData(ctx.nSesid, currentJob);
          }
          break;
        case 'G': // Global Replace Command
          if (CMDdata.searchString) {
            await this.replaceGlobal(ctx, CMDdata.searchString, CMDdata.replaceString);
          }
          break;

        case 'R': // Refresh Command
          // D7: a second 'R' before 'E' commits the pending refresh window
          // first (vendor Protocol 'R' calls applyRefresh with the prior
          // start/end, THEN re-enters refresh). refreshTimeStamp + relaceLines
          // still hold the prior window here, so onRefreshEnd commits it; the
          // reset below then starts the new window. Without this the first
          // window's replacement lines are silently dropped.
          if (currentJob.isRefresh && currentJob.relaceLines?.length) {
            await this.onRefreshEnd(ctx);
          }
          ctx.refreshCounter++;

          this.printCommands(ctx, `Replace : ${ctx.refreshCounter} \n ${data.toString('hex')}`);

          currentJob.relaceLines = [];
          currentJob.isRefresh = true;

          if (this.currentSessionHaveRefresh) {
            currentJob.oldLineData = [currentJob.lineCount, currentJob.currentLineNumber, currentJob.currentTimestamp, currentJob.currentFormat, currentJob.currentPage, currentJob.crLine];

            try {
              currentJob.refreshTimeStamp = [`${this.sliceDate(data.readUInt8(2))}:${this.sliceDate(data.readUInt8(3))}:${this.sliceDate(data.readUInt8(4))}:${this.sliceDate(data.readUInt8(5))}`, `${this.sliceDate(data.readUInt8(6))}:${this.sliceDate(data.readUInt8(7))}:${this.sliceDate(data.readUInt8(8))}:${this.sliceDate(data.readUInt8(9))}`];
              this.printCommands(ctx, `Time : ${JSON.stringify(currentJob.refreshTimeStamp)}`);

              await this.RefreshLog(ctx, `_${ctx.refreshCounter}`, `BEFORE-- (refresh on ${new Date().toISOString()}) \n ${currentJob.refreshTimeStamp}`);
            } catch (error) {
            }
          }

          ctx.sink.saveMetaData(ctx.nSesid, currentJob);
          break;
        case 'E': // End Refresh Command
          if (this.currentSessionHaveRefresh) {
            await this.refreshLogsLines(ctx, `_${ctx.refreshCounter}`);

            await this.removedLog(ctx, `_${ctx.refreshCounter}`, `Refreshing end executing onRefreshEnd-- \n ${currentJob.refreshTimeStamp}`, []);
            if (currentJob.relaceLines?.length) {
              this.printCommands(ctx, `refresh ${ctx.refreshCounter} End  \n ${JSON.stringify(currentJob.relaceLines)}`);

              await this.onRefreshEnd(ctx);

              this.logger.debug(`Refresh End ${ctx.refreshCounter}`);
            }

            try {
              if (currentJob.oldLineData.length) {
                const lastData = currentJob.lineBuffer[currentJob.lineBuffer.length - 1];
                currentJob.lineCount = currentJob.lineBuffer.length - 1;
                currentJob.currentLineNumber = lastData[5];
                currentJob.currentTimestamp = lastData[0];
                currentJob.currentFormat = lastData[3];
                currentJob.currentPage = lastData[4];
                currentJob.crLine = lastData[1];
              }
            } catch (error) {
            }
          }

          currentJob.oldLineData = [];
          currentJob.relaceLines = [];
          currentJob.isRefresh = false;

          ctx.sink.saveMetaData(ctx.nSesid, currentJob);

          let timedeff = '';
          try {
            timedeff = `${currentJob.refreshTimeStamp} ${currentJob.refreshTimeStamp?.length ? currentJob.refreshTimeStamp?.map(this.convertToFrame) : null}`;
          } catch (error) {
          }

          await this.RefreshLog(ctx, `_${ctx.refreshCounter}`, `After--(On ${new Date().toISOString()}) \n ${timedeff}`);
          break;
        case 'D': // Delete (Backspace) Command
          try {
            if (!currentJob.crLine.length) {
              // D10: backspace at a line boundary. Vendor deleteLine(-1) drops
              // the empty tail line; legacy left an orphan and used Math.abs
              // (which jumps to 1 at lineCount 0). Pop the orphan, drop its
              // persisted id, clamp the cursor, adopt the previous line.
              const dead = currentJob.lineBuffer[currentJob.lineCount];
              if (dead && dead[6]) {
                try { await ctx.sink.removeLines(ctx.nSesid, [dead[6]]); } catch (e) {}
              }
              currentJob.lineBuffer.pop();
              currentJob.lineCount = Math.max(0, currentJob.lineBuffer.length - 1);
              currentJob.crLine = currentJob.lineBuffer.length
                ? (currentJob.lineBuffer[currentJob.lineCount][1] || []).slice()
                : [];
            } else {
              currentJob.crLine.pop(); // Remove last character
            }
          } catch (error) {
          }

          // D10: if the last remaining line was just deleted, do NOT re-run
          // updateLineBuffer — it would recreate a phantom empty line at
          // lineCount 0. The vendor's line(-1) returns null and no-ops. Other
          // paths (incl. T-on-empty-doc seeding) are unaffected.
          if (currentJob.lineBuffer.length) {
            this.refreshReplaceData(ctx);
            await this.updateLineBuffer(ctx);
          }
          break;
        default:
          console.warn(`\n\r\n\rUnknown command: ${command}`);
      }
    } catch (err) {
      console.error('Error handling command:', err.message);
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Text / line-buffer handling (legacy 511-595)
  // ---------------------------------------------------------------------------

  async handleText(ctx: SessionContext, byte: number): Promise<boolean> {
    const currentJob = ctx.job;
    try {
      if (byte !== 0x08) {
        if (!currentJob.crLine) {
          currentJob.crLine = [];
        }
        // D2: vendor CP1252 high-byte remap at the single text-ingress point
        // (mirrors Bridge Mobile Protocol.addText). Bytes <128 pass identity.
        currentJob.crLine.push(mapWinByte(byte));
      }
      this.refreshReplaceData(ctx);
      await this.updateLineBuffer(ctx);
      if (byte === 0x0A) {
        await this.finalizeLine(ctx);
      }
    } catch (error) {
      console.log('ERROR', error);
    }
    return true;
  }

  async finalizeLine(ctx: SessionContext): Promise<boolean> {
    const currentJob = ctx.job;
    if (currentJob.crLine.length > 0) {
      await this.updateLineBuffer(ctx);
      currentJob.crLine = [];
    }
    return true;
  }

  async updateLineBuffer(ctx: SessionContext): Promise<boolean> {
    const currentJob = ctx.job;
    if (currentJob.isRefresh) return;

    const crTm = currentJob.currentTimestamp || '0:0:0:0';
    currentJob.customTimestamp = this.getIndianTM();
    if (!currentJob.lineBuffer[currentJob.lineCount]) {
      currentJob.lineBuffer[currentJob.lineCount] = [crTm, [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null, null, null, null];
    }
    currentJob.lineBuffer[currentJob.lineCount][1] = currentJob.crLine.slice();
    if (currentJob.crLine?.length > 0) {
      if (!currentJob.globalBuffer) {
        currentJob.globalBuffer = [];
      }
      currentJob.globalBuffer.push([currentJob.crLine[currentJob.crLine.length - 1], currentJob.lineCount]);
    }
    currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
    let nId;
    try {
      nId = currentJob.lineBuffer[currentJob.lineCount][6] || null;
    } catch (error) {
      nId = null;
    }

    try {
      const tabs = await this.verifyTabs(ctx, currentJob.lineBuffer[currentJob.lineCount][1]);
      if (tabs?.length) {
        currentJob.lineBuffer[currentJob.lineCount][7] = tabs;
      }
      if (currentJob.lineBuffer[currentJob.lineCount][0])
        currentJob.lineBuffer[currentJob.lineCount][8] = this.convertToFrame(currentJob.lineBuffer[currentJob.lineCount][0]);
    } catch (error) {
    }

    const id = await ctx.sink.saveLine(ctx.nSesid, nId, currentJob.lineBuffer[currentJob.lineCount]);
    try {
      if (currentJob.lineBuffer && currentJob.lineBuffer[currentJob.lineCount]?.length) {
        currentJob.lineBuffer[currentJob.lineCount][6] = id;
      }
    } catch (error) {
    }
    this.emitToLocalUser(ctx);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Global replace (legacy 623-723)
  // ---------------------------------------------------------------------------

  async replaceGlobal(ctx: SessionContext, searchString: string, replaceString: string): Promise<boolean> {
    const currentJob = ctx.job;
    try {
      const lg_dt2 = new Date();
      for (let index = 0; currentJob.lineBuffer.length > index; index++) {
        const line = currentJob.lineBuffer[index];
        if (line && line.length) {
          if (line[1].length > 0) {
            const lineStr = line[1].map(char => String.fromCharCode(char)).join('');
            // D12: escape the search string — Bridge search text is literal, so
            // a '.', '(', '*', etc. must not be interpreted as regex.
            const escaped = searchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const newLineStr = lineStr.replace(new RegExp(escaped, 'g'), replaceString);
            if (lineStr !== newLineStr) { // If there's a change in the line
              const newLine = newLineStr.split('').map(char => char.charCodeAt(0));
              currentJob.lineBuffer[index][1] = newLine;
              // Calculate the page number for the current line and mark it as modified
              const pageNo = Math.floor(index / (ctx.nLines || 25)) + 1;
              const relativeLineIndex = index % (ctx.nLines || 25);
              await this.sendGlobalReplace(ctx, currentJob.lineBuffer[index], pageNo, relativeLineIndex, index, ctx.nSesid);
            }
          }
        }
      }
      console.log('    Global replace', new Date().getTime() - lg_dt2.getTime());
    } catch (error) {
    }
    return true;
  }

  async sendGlobalReplace(ctx: SessionContext, lineData: any, pageNo: number, lineno: number, globalIndex: number, sessionId: string): Promise<boolean> {
    const currentjob = ctx.job;
    const sendData = {
      line: lineData,
      nSesid: sessionId,
      page: pageNo,
      lineno: lineno,
    };

    try {
      const tabs = await this.verifyTabs(ctx, lineData[1]);
      if (tabs?.length) {
        lineData[7] = tabs;
      }
      if (lineData[0])
        lineData[8] = this.convertToFrame(lineData[0]);
    } catch (error) {
    }

    try {
      const id = await ctx.sink.saveLine(ctx.nSesid, (currentjob.lineBuffer[globalIndex][6] || null), lineData);
      if (!currentjob.lineBuffer[globalIndex][6]) {
        currentjob.lineBuffer[globalIndex][6] = id;
      }
    } catch (error) {
    }

    try {
      ctx.sink.emitLocal('line-replace', sendData);

      try {
        ctx.sink.emitDelivery('line-replace', sendData);
      } catch (error) {
      }
    } catch (error) {
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Refresh bookkeeping (legacy refreshReplaceData, 731-748)
  // ---------------------------------------------------------------------------

  refreshReplaceData(ctx: SessionContext) {
    const currentJob = ctx.job;
    if (currentJob.isRefresh) {
      if (!currentJob.relaceLines) {
        currentJob.relaceLines = [];
      }
      // [crTm, [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null];
      const ind = currentJob.relaceLines.findIndex(a => a[5] == currentJob.currentLineNumber && a[0] == currentJob.currentTimestamp);
      if (ind > -1) {
        currentJob.relaceLines[ind] = [currentJob.currentTimestamp, currentJob.crLine, 0, currentJob.currentFormat, currentJob.currentPage, currentJob.currentLineNumber, null];
      } else {
        currentJob.relaceLines.push([currentJob.currentTimestamp, currentJob.crLine, 0, currentJob.currentFormat, currentJob.currentPage, currentJob.currentLineNumber, null]);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Refresh range removal (legacy removeTimestampsInRange, 801-927 — live variant)
  // ---------------------------------------------------------------------------

  removeTimestampsInRange(timestamps, range) {
    const [startRange, endRange] = range.map(this.convertToFrame);
    let startIndex = -1;
    let endIndex = -1;
    const removedData: any = []; // Array to store removed elements

    // D5: strict HALF-OPEN [start, end) — matches vendor BridgeDoc.applyRefresh
    // (endLine walks while timecode < end, so the line sitting exactly ON the
    // end timecode is KEPT). The old closed range + index==lInd/sInd carve-outs
    // approximated this and broke on edge cases (single-line ranges, multiple
    // lines sharing the start timecode). Lines with timecode 0 are excluded for
    // any positive start (0 >= startRange is false), mirroring the tc==0 skip.
    const newData = timestamps.filter(([timestamp], index) => {
      const currentFrame = this.convertToFrame(timestamp);
      const isInRange = currentFrame >= startRange && currentFrame < endRange;

      if (isInRange) {
        try {
          if (timestamps[index][6])
            removedData.push(timestamps[index]); // Assuming unicid is at index 6
        } catch (error) {
          console.log(error);
        }
        if (startIndex === -1) startIndex = index;
        endIndex = index;
      }

      return !isInRange;
    });

    return {
      newData,
      removedData,
      startIndex,
      endIndex,
    };
  }

  // ---------------------------------------------------------------------------
  // Refresh end pipeline (legacy onRefreshEnd, 945-1245)
  // ---------------------------------------------------------------------------

  async onRefreshEnd(ctx: SessionContext): Promise<boolean> {
    const currentJob = ctx.job;
    try {
      this.sortArray(currentJob.lineBuffer);
      if (currentJob.refreshTimeStamp?.length) {
        const start = currentJob.refreshTimeStamp[0];
        const end = currentJob.refreshTimeStamp[1];

        const OldLineBuffer = [...currentJob.lineBuffer];

        const { newData, startIndex, endIndex, removedData } = this.removeTimestampsInRange(currentJob.lineBuffer, [start, end]);

        try {
          if (removedData?.length) {
            await this.removedLog(ctx, `_${ctx.refreshCounter}`, `Removed lines -- \n ${currentJob.refreshTimeStamp}`, removedData);
            const removedDataString = removedData.map(line => line[6]);
            await ctx.sink.removeLines(ctx.nSesid, removedDataString);
          }
        } catch (error) {
          console.log(error);
        }

        this.printFeedInTxt(ctx, `total = ${currentJob.lineBuffer?.length}, new = ${currentJob.relaceLines?.length} , replaced count = ${currentJob.lineBuffer?.length - newData?.length}`);
        currentJob.lineBuffer = newData;

        const oldLength = currentJob.lineBuffer?.length;
        currentJob.relaceLines.map((line, index) => line[2] = currentJob.lineBuffer.length + index);

        let mainStartId;
        try {
          mainStartId = currentJob.lineBuffer[startIndex - 1][6];
        } catch (error) {
          mainStartId = 0;
          try {
            await this.refreshLogs(ctx, `_Transfer`, 'annot', `\n "refresh":"${ctx.refreshCounter}", "error": ${error?.message} `);
          } catch (error) {
          }
        }

        try {
          if (!mainStartId && currentJob.relaceLines?.length) {
            const firstTime = currentJob.relaceLines[0][0];
            const startLine = currentJob.lineBuffer.findLast(a => this.convertToFrame(firstTime) >= this.convertToFrame(a[0]));
            if (startLine)
              mainStartId = startLine[6];
          }
        } catch (error) {
          try {
            await this.refreshLogs(ctx, `_Transfer`, 'annot', `\n "refresh":"${ctx.refreshCounter}", "Condition":2,"error": ${error?.message} `);
          } catch (error) {
          }
          mainStartId = 0;
        }

        const newValues = [];
        const finalNewLines = [];
        if (currentJob.relaceLines) {
          const rmLines: any = [...removedData];
          for (let [index, a] of currentJob.relaceLines.entries()) {
            const randomNo = Math.floor(Math.random() * (1000 - 200 + 1)) + 200;
            try {
              const tabs = await this.verifyTabs(ctx, a[1]);
              if (tabs?.length) {
                a[7] = tabs;
              }
              if (a[0])
                a[8] = this.convertToFrame(a[0]);
            } catch (error) {
            }

            try {
              a[9] = index;
            } catch (error) {
            }

            let nId = null;

            const previousId = rmLines.findLastIndex(z => this.convertToFrame(z[0]) == this.convertToFrame(a[0])); // OR CONDITION z[5] == a[5];

            if (previousId > -1) {
              nId = rmLines[previousId][6] || (mainStartId + randomNo);
              newValues.push([nId, true]);
              rmLines.splice(previousId, 1);
            } else {
              nId = (mainStartId + randomNo);
              newValues.push([nId]);
            }
            mainStartId = nId;

            const id = await ctx.sink.saveLine(ctx.nSesid, nId, a);
            a[6] = id;

            finalNewLines.push(a);
          }
        }

        try {
          await this.removedLog(ctx, `_${ctx.refreshCounter}`, `New lines -- \n ${currentJob.refreshTimeStamp}`, currentJob.relaceLines);
        } catch (error) {
        }

        try {
          if (newValues?.length) {
            const check = this.identityFixService.validateValues(newValues);
            if (!check.ok) {
              try {
                await this.logForFixing(ctx, `_${ctx.refreshCounter}`, `Duplicate identity found in new lines -- \n ${currentJob.refreshTimeStamp}`, check?.errors || []);
              } catch (error) {
              }
              const fixed = this.identityFixService.attemptFix(newValues);
              if (fixed?.values?.length) {
                const newArray = fixed?.values || [];

                if (finalNewLines.length == newArray?.length) {
                  try {
                    await this.logForFixing(ctx, `_${ctx.refreshCounter}`, `Fixing Duplicate Lines  -- \n ${currentJob.refreshTimeStamp}`, newArray);
                  } catch (error) {
                  }

                  for (let [index, x] of finalNewLines.entries()) {
                    if (newArray[index]) {
                      if (newArray[index][0]) {
                        x[6] = newArray[index][0];
                      }
                    }
                  }

                  try {
                    await this.removedLog(ctx, `_${ctx.refreshCounter}`, `Final FIxing -- \n ${currentJob.refreshTimeStamp}`, finalNewLines);
                  } catch (error) {
                  }
                } else {
                  try {
                    await this.logForFixing(ctx, `_${ctx.refreshCounter}`, `Duplicate Fixing lenght not match with new (New = ${finalNewLines?.length}) (Fixed = ${(newArray as any)?.lenght}) -- \n ${currentJob.refreshTimeStamp}`, fixed?.error || []);
                  } catch (error) {
                  }
                }
              }
            }
          }
        } catch (error) {
          try {
            await this.logForFixing(ctx, `_${ctx.refreshCounter}`, `Fixing Failed -- \n ${error?.message}`, []);
          } catch (error) {
          }
        }

        if (finalNewLines?.length) {
          currentJob.lineBuffer.push(...finalNewLines);
        }

        this.sortArray(currentJob.lineBuffer);

        const startPage = Math.ceil((startIndex + 1) / (ctx.nLines || 25));

        const relaceLines = [...(currentJob?.relaceLines || [])];

        await this.SendRefreshDataToUser(ctx, startIndex, endIndex, currentJob.relaceLines, start, end, startPage);

        await this.handleAnnotTransfer(ctx, relaceLines, startPage, start, end, removedData, OldLineBuffer);
      }
    } catch (error) {
      console.log(error);
    }
    try {
      currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
    } catch (error) {
    }
    return true;
  }

  /**
   * Legacy handleAnnotTransfer (1310-1575) + its python fuzzy-search /
   * annottransfer_* SP helpers collapsed to a single sink call. The whole
   * annotation/highlight re-anchor implementation lives OUTSIDE the lib
   * (apps/feed-ingest supplies it; it must respect the process-wide
   * PythonSemaphore). Args mirror the legacy call site verbatim.
   */
  private async handleAnnotTransfer(ctx: SessionContext, relaceLines: any[], startPage: number, start: any, end: any, removedData: any, oldLineBuffer: any[]): Promise<void> {
    try {
      await ctx.sink.runAnnotTransfer({
        nSesid: ctx.nSesid,
        refreshCounter: ctx.refreshCounter,
        lineBuffer: ctx.job.lineBuffer,
        relaceLines,
        startPage,
        start,
        end,
        removedData,
        oldLineBuffer,
        totalLines: (ctx.nLines || 25),
      });
    } catch (error) {
      this.logger.error(`Error in handleAnnotTransfer:`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Emission (legacy SendRefreshDataToUser 2211-2253, emitToLocalUser 2545-2601)
  // ---------------------------------------------------------------------------

  async SendRefreshDataToUser(ctx: SessionContext, startInd, endInd, newLines, start, end, startPage) {
    const sendData = {
      nSesid: ctx.nSesid,
      startInd: startInd,
      refreshType: ctx.refreshType,
      endInd: endInd,
      newLines: newLines || [],
      start: start,
      end: end,
      startPage,
      current_refresh: ctx.refreshCounter || 0,
    };

    try {
      this.printRefSendCmd(ctx, `Refresh ${ctx.refreshCounter} send to user \n ${JSON.stringify(sendData)}`);
      await ctx.sink.emitLocal('feed-refresh-data', sendData);

      // was: sendData.nSesid = sessionService.getLiveId(id) || id — the live-id
      // aliasing now lives inside the sink's emitDelivery implementation.
      sendData.nSesid = ctx.nSesid;

      try {
        ctx.sink.emitDelivery('feed-refresh-data', sendData);
      } catch (error) {
      }
    } catch (error) {
      this.printRefSendCmd(ctx, `Refresh ${ctx.refreshCounter} Failed to send`);
    }
  }

  emitToLocalUser(ctx: SessionContext) {
    const currentJob = ctx.job;
    try {
      const total_lines = (ctx.nLines ? ctx.nLines : 25);
      if (currentJob.lineBuffer?.length) {
        const array = currentJob.lineBuffer.slice(currentJob.lineBuffer.length - 2, currentJob.lineBuffer.length) || [];
        try {
          array.map((a, index) => a[2] = (index == 0 ? currentJob.lineBuffer.length - 2 : currentJob.lineBuffer.length - 1));
        } catch (error) {
          console.log('\n\r\n\r\n\rERROR', error);
        }

        const calculatedPage = Math.floor((currentJob.lineBuffer?.length ? (currentJob.lineBuffer?.length - 1) : 0) / total_lines) + 1;

        if (array.length) {
          const sendData = {
            i: currentJob.lineCount,
            d: array,
            date: ctx.nSesid,
            l: total_lines,
            p: calculatedPage,
          };
          ctx.sink.emitLocal('message', sendData);

          // was: sendData.date = sessionService.getLiveId(id) || id — the
          // live-id aliasing now lives inside the sink's emitDelivery impl.
          sendData.date = ctx.nSesid;

          try {
            ctx.sink.emitDelivery('TCP-DATA', sendData);
          } catch (error) {
          }
        }
      }
    } catch (error) {
    }
  }

  // ---------------------------------------------------------------------------
  // Logging shims — every legacy logs/s_<id>/... file write goes through
  // ctx.sink.log (quarantine rule). The sortArray() calls inside RefreshLog /
  // removedLog are LOAD-BEARING side effects on the line buffer and are kept.
  // ---------------------------------------------------------------------------

  /** was printCommands -> commands_replace.txt append (legacy 2529-2543). */
  private printCommands(ctx: SessionContext, logdata: string) {
    try {
      ctx.sink.log(logdata);
    } catch (error) {
    }
  }

  /** was RefreshLog -> logs/s_<id>/refresh/refreshlog_<key>.txt (legacy 2384-2406).
   *  KEEPS the legacy sortArray(lineBuffer) side effect. */
  private async RefreshLog(ctx: SessionContext, key, val): Promise<boolean> {
    const currentJob = ctx.job;
    try {
      this.sortArray(currentJob.lineBuffer);

      const allDts = currentJob.lineBuffer.map((a, index) => (a && a.length ? `  page = ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]}) : ${a[0]} (${a[8]}) (${a[6]}) :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`);
      const log_msg = `${val}  \n ${allDts} \n\n\n replacing with condition ${ctx.refreshType}`;

      ctx.sink.log(`[refresh${key}] ${log_msg}\n length = ${currentJob.lineBuffer?.length}`);
    } catch (error) {
      console.log(error);
    }
    return true;
  }

  /** was removedLog -> logs/s_<id>/refresh/refreshlog_<key>.txt (legacy 2421-2449).
   *  KEEPS the legacy sortArray(lineBuffer) side effect. */
  private async removedLog(ctx: SessionContext, key, val, removedLines): Promise<boolean> {
    const currentJob = ctx.job;
    try {
      this.sortArray(currentJob.lineBuffer);

      const allDts = removedLines.map((a, index) => (a && a.length ? `  page = ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]}) : ${a[0]} (${a[8]}) (${a[6]})  :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`);
      const log_msg = `${val}  \n ${allDts}`;

      ctx.sink.log(`[refresh${key}] ${log_msg}`);
    } catch (error) {
      console.log(error);
    }
    return true;
  }

  /** was logForFixing -> logs/s_<id>/refresh/refreshlog_<key>.txt (legacy 2409-2419). */
  private async logForFixing(ctx: SessionContext, key, val, arrayELement): Promise<boolean> {
    try {
      const allDts = arrayELement.map((a, index) => (a && a.length ? `  identity = (${a[0]})  : IsPrevious = ${a[1] ? 'True' : 'False'}` + `\n` : ''));
      const log_msg = `${val}  \n ${allDts}`;
      ctx.sink.log(`[refresh${key}] ${log_msg}`);
    } catch (error) {
      console.log(error);
    }
    return true;
  }

  /** was refreshLogs -> logs/s_<id>/refresh-log/<type>_<key>.txt (legacy 2348-2362). */
  private async refreshLogs(ctx: SessionContext, key, type, log): Promise<void> {
    try {
      ctx.sink.log(`[refresh-log/${type}${key}] ${log}`);
    } catch (error) {
      console.log(error);
    }
  }

  /** was printRefSendCmd -> logs/s_<id>/refreshcmd.txt (legacy 2505-2527). */
  private async printRefSendCmd(ctx: SessionContext, data: any) {
    try {
      ctx.sink.log(`[refreshcmd] ${data}`);
    } catch (error) {
    }
  }

  /** Legacy printFeedInTxt (2477-2491) — body fully commented out upstream;
   *  the summary line is worth keeping as a structured log. */
  private printFeedInTxt(ctx: SessionContext, log) {
    try {
      ctx.sink.log(`[feed-refresh] ${log}`);
    } catch (error) {
    }
  }

  /** Legacy refreshLogsLines (2451-2475) — body fully commented out upstream;
   *  kept as a no-op so the 'E' handler structure diffs cleanly. */
  private async refreshLogsLines(ctx: SessionContext, key): Promise<boolean> {
    return true;
  }
}
