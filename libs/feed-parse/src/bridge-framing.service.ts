/**
 * BridgeFramingService — the Bridge ('B') protocol STX/ETX framing state
 * machine, ported VERBATIM from
 * apps/realtime/src/services/parse-command/parse-command.service.ts
 * (algorithm lines 109-377: setStartCMD / setCmdType / manageEndCmd /
 * pushData / parseGlobalReplace / refreshCmd / handleEndRefresh /
 * commandsControl + CMD_TYPES) for Phase 2 of docs/eclipse-wss-ingest-plan.md.
 *
 * SINGLETON-FREE: every piece of framing carry-over state that lived on the
 * legacy service instance (mdl / previousCmd / cmdLength / isCmdEnded /
 * isData / isRefresh / commands — parse-command.service.ts:18-51, THE
 * cross-session contamination vector) now lives in ctx.framing. A command
 * split across chunk boundaries therefore reassembles per-session exactly as
 * the instance fields did, and N sessions parse concurrently without
 * contamination. 0x02/0x03 bytes INSIDE command data cannot confuse framing:
 * per-command fixed lengths (CMD_TYPES[..].l) decide the end, not delimiter
 * scanning — 0x03 only terminates when cmdLength === mdl.data.length, and
 * 0x02 only starts a command when no type/data is pending.
 *
 * Framed-command handoff: legacy sendForParsing called
 * bridgeParseService.SendToParseData(hex, data, session, job, sessions)
 * directly; here the downstream is injected per call as `onCommand`, invoked
 * synchronously at the same points the legacy call sites sat.
 *
 * Quarantined (docs/feed-parse-quarantine.md — intentionally NOT ported):
 *  - isComplete>0 silent-drop guard (legacy :78-79) — a lib parser must never
 *    drop input silently
 *  - data1 remap + full-array commands.json rewrite (legacy :160-169) — the
 *    per-command journal lives in ctx.framing.commands instead
 *  - @OnEvent('command.parser.value') global-state handler (legacy :55-59)
 *  - BridgeService dead-prototype call (legacy :437, commented out)
 *  - logs/s_<id>/cmds.txt raw-chunk file append (addToLocalFile) — replaced
 *    with ctx.sink.log
 */
import { Injectable, Logger } from '@nestjs/common';
import { SessionContext } from './session-context';
import { mapWinByte } from './win-char-map';

/** Downstream consumer of each completed framed command (replaces the legacy
 *  hard-wired bridgeParseService.SendToParseData call). */
export type FramedCommandHandler = (
  ctx: SessionContext,
  hexBuffer: Buffer,
  cmdData: any,
) => void;

/**
 * EXACT legacy shape of the partial-command accumulator (legacy `this.mdl`,
 * parse-command.service.ts:21-32). Richer than the sketch declared on
 * BridgeFramingState.mdl — accessed via an internal cast plus a one-time,
 * idempotent normalization of the createFramingState() defaults.
 */
interface FramingMdl {
  cmdType: string | null;
  data: number[];
  hexCmd: string;
  startlength: number;
  endlength: number;
  searchString: string;
  replaceString: string;
  rStart: number[];
  rEnd: number[];
  isRefresh: number;
  /** D12: explicit "length byte consumed" flags so a ZERO-length search or
   *  replace (e.g. a global-delete "replace X with nothing") terminates.
   *  The legacy `startlength === 0` / `!endlength` sentinels stalled on a
   *  0-valued length byte. */
  startLenRead: boolean;
  endLenRead: boolean;
}

/** Legacy-typed view over ctx.framing (BridgeFramingState). */
interface FramingStateInternal {
  mdl: FramingMdl;
  /** legacy held the raw byte (0x02) or null, not a string */
  previousCmd: number | null;
  /** null for 'G' (variable-length) commands */
  cmdLength: number | null;
  isCmdEnded: boolean;
  isData: boolean;
  /** legacy used 0/1, not boolean */
  isRefresh: number;
  commands: any[];
}

@Injectable()
export class BridgeFramingService {
  private readonly logger = new Logger(BridgeFramingService.name);

  /** Pure constant — per-command fixed data lengths (legacy :39-49).
   *  F:1, P:2, N:1, T:4, D:0, K:0, G:variable(null), E:0, R:8 */
  private readonly CMD_TYPES: { [key: number]: { t: string; l: number | null } } = {
    0x46: { t: 'F', l: 1 },
    0x50: { t: 'P', l: 2 },
    0x4e: { t: 'N', l: 1 },
    0x54: { t: 'T', l: 4 },
    0x44: { t: 'D', l: 0 },
    0x48: { t: 'K', l: 0 },
    0x47: { t: 'G', l: null },
    0x45: { t: 'E', l: 0 },
    0x52: { t: 'R', l: 8 },
  };

  /**
   * Entry point — enqueue one raw inbound chunk on this session's parse lane.
   * (Legacy splitCommands minus the quarantined isComplete>0 silent-drop
   * guard; the service-level taskQueue became ctx.parseQueue.)
   */
  splitCommands(
    ctx: SessionContext,
    incomingBuffer: Buffer,
    onCommand: FramedCommandHandler,
  ): void {
    ctx.parseQueue.addTask(async () => {
      await this.parseCMD(ctx, incomingBuffer, onCommand);
    });
  }

  private async parseCMD(
    ctx: SessionContext,
    data: Buffer,
    onCommand: FramedCommandHandler,
  ): Promise<any> {
    // was addToLocalFile → logs/s_<currentSessionid>/cmds.txt append
    try {
      ctx.sink.log(data.toString('hex'));
    } catch (error) {}

    try {
      this.parseCommand(ctx, data, onCommand);
    } catch (error) {}
  }

  // Main function to parse command data (legacy :109-175, verbatim minus the
  // quarantined data1 remap + commands.json full-array rewrite)
  private parseCommand(
    ctx: SessionContext,
    data: Buffer,
    onCommand: FramedCommandHandler,
  ): void {
    const st = this.framingState(ctx);
    try {
      data.forEach((element) => {
        // Start new command
        if (element === 0x02 && !st.mdl.cmdType && !st.mdl.data.length) {
          this.setStartCMD(st, element);
          st.previousCmd = element;
          return;
        }

        // Global replace command handling
        if (st.mdl.cmdType === 'G') {
          this.parseGlobalReplace(ctx, st, element, onCommand);
          return;
        }

        // Refresh command handling
        if (st.mdl.cmdType === 'R') {
          this.refreshCmd(ctx, st, element, onCommand);
          return;
        }

        // End refresh command handling
        if (st.mdl.cmdType === 'E') {
          this.handleEndRefresh(ctx, st, element, onCommand);
          return;
        }

        // Set command type
        if (!st.mdl.cmdType && st.previousCmd === 0x02) {
          st.previousCmd = null;
          const typeSet = this.setCmdType(st, element);
          if (typeSet) return;
        }

        // Handle end of command
        if (element === 0x03 && st.cmdLength === st.mdl.data.length) {
          this.manageEndCmd(st, element);
        } else {
          this.pushData(st, element);
        }

        this.commandsControl(ctx, st, onCommand);
      });

      // quarantined here in the legacy source: commands data1 remap + full
      // commands.json rewrite (parse-command.service.ts:160-169). The framed
      // command journal is ctx.framing.commands.
    } catch (error) {
      this.logger.error('Error during parsing:', error as any);
    }
  }

  // legacy :177-228
  private parseGlobalReplace(
    ctx: SessionContext,
    st: FramingStateInternal,
    element: number,
    onCommand: FramedCommandHandler,
  ) {
    try {
      st.mdl.hexCmd += this.decimalToHexString(element);
      // D12: completion keys off the explicit length-read flags (not truthy
      // lengths), so a zero-length search or replace still terminates.
      if (
        st.mdl.startLenRead &&
        st.mdl.searchString.length === st.mdl.startlength &&
        st.mdl.endLenRead &&
        st.mdl.replaceString.length === st.mdl.endlength
      ) {
        st.commands.push({
          cmdType: 'G',
          data: [],
          hexCmd: st.mdl.hexCmd,
          searchString: st.mdl.searchString,
          replaceString: st.mdl.replaceString,
          isRefresh: st.isRefresh,
        });

        this.sendForParsing(
          ctx,
          {
            cmdType: 'G',
            data: [],
            hexCmd: st.mdl.hexCmd,
            searchString: st.mdl.searchString,
            replaceString: st.mdl.replaceString,
            isRefresh: st.isRefresh,
          },
          onCommand,
        );
        this.clearMdl(st);
        st.isCmdEnded = true;
        return;
      }

      // Consume, in order: search-length byte, search chars, replace-length
      // byte, replace chars. D12 flags make a 0-valued length byte advance
      // instead of stalling; D2/7c maps high bytes so a global-replace on
      // extended characters matches the now-CP1252-remapped line text.
      if (!st.mdl.startLenRead) {
        st.mdl.startlength = element;
        st.mdl.startLenRead = true;
      } else if (st.mdl.searchString.length < st.mdl.startlength) {
        st.mdl.searchString += String.fromCharCode(mapWinByte(element));
      } else if (!st.mdl.endLenRead) {
        st.mdl.endlength = element;
        st.mdl.endLenRead = true;
      } else if (st.mdl.replaceString.length < st.mdl.endlength) {
        st.mdl.replaceString += String.fromCharCode(mapWinByte(element));
      }
    } catch (error) {
      this.logger.error('Error in global replace parsing:', error as any);
    }
  }

  // legacy :230-252
  private refreshCmd(
    ctx: SessionContext,
    st: FramingStateInternal,
    element: number,
    onCommand: FramedCommandHandler,
  ) {
    st.mdl.hexCmd += this.decimalToHexString(element);
    if (st.mdl.rStart.length < 4) {
      st.mdl.rStart.push(...[element]);
    } else if (st.mdl.rStart.length === 4 && st.mdl.rEnd.length < 4) {
      st.mdl.rEnd.push(...[element]);
    } else if (st.mdl.rStart.length === 4 && st.mdl.rEnd.length === 4) {
      st.isRefresh = 1;
      st.mdl.rStart = [...st.mdl.rStart];
      st.mdl.rEnd = [...st.mdl.rEnd];

      this.sendForParsing(ctx, { ...st.mdl }, onCommand);

      st.commands.push({ ...st.mdl });

      st.isCmdEnded = true;
      this.clearMdl(st);
    }
  }

  // legacy :254-266
  private handleEndRefresh(
    ctx: SessionContext,
    st: FramingStateInternal,
    element: number,
    onCommand: FramedCommandHandler,
  ) {
    st.mdl.hexCmd += this.decimalToHexString(element);
    st.mdl.rStart = [...st.mdl.rStart];
    st.mdl.rEnd = [...st.mdl.rEnd];
    st.commands.push({ ...st.mdl });

    this.sendForParsing(ctx, { ...st.mdl }, onCommand);
    st.isCmdEnded = true;
    this.clearMdl(st);
  }

  // legacy :268-275
  private setStartCMD(st: FramingStateInternal, element: number) {
    if (st.isData) {
      this.clearMdl(st);
    }
    st.isData = false;
    st.isCmdEnded = false;
    st.mdl.hexCmd = this.decimalToHexString(element);
  }

  // legacy :277-312
  private setCmdType(st: FramingStateInternal, element: number): boolean {
    let isType = true;
    if (this.CMD_TYPES[element]) {
      st.mdl.cmdType = this.CMD_TYPES[element].t;
      st.cmdLength = this.CMD_TYPES[element].l;
      st.mdl.hexCmd += this.decimalToHexString(element);
      if (st.mdl.cmdType == 'R') {
        st.isRefresh = 1;
        st.mdl.isRefresh = 1;
      } else if (st.mdl.cmdType == 'E') {
        st.isRefresh = 0;
      }

      if (st.mdl.cmdType == 'N') {
        // legacy no-op (the isComplete++ here was already commented out)
      }
    } else {
      isType = false;
    }
    return isType || ['R', 'E'].includes(st.mdl.cmdType as string);
  }

  // legacy :314-318
  private manageEndCmd(st: FramingStateInternal, element: number) {
    st.mdl.hexCmd += this.decimalToHexString(element);
    st.isCmdEnded = true;
    st.isData = false;
  }

  // legacy :320-327
  private pushData(st: FramingStateInternal, element: number) {
    if (!st.mdl.cmdType) {
      st.isData = true;
    }
    st.mdl.hexCmd += this.decimalToHexString(element);
    st.mdl.data.push(element);
  }

  // legacy :329-377
  private commandsControl(
    ctx: SessionContext,
    st: FramingStateInternal,
    onCommand: FramedCommandHandler,
  ) {
    if (st.isCmdEnded && !st.isData) {
      st.mdl.isRefresh = st.isRefresh;
      st.mdl.rStart = [...st.mdl.rStart];
      st.mdl.rEnd = [...st.mdl.rEnd];
      st.commands.push({ ...st.mdl });
      this.sendForParsing(ctx, { ...st.mdl }, onCommand);
      st.mdl.data = [];
      st.mdl.cmdType = null;
      st.mdl.hexCmd = '';
    } else if (st.isData) {
      st.mdl.isRefresh = st.isRefresh;
      st.isData = false;
      try {
        if (st.commands[st.commands.length - 1].cmdType) {
          st.commands.push({
            cmdType: null,
            data: [],
            hexCmd: '',
          });
        }
        const ForCmdnewObj = {
          data: [...st.commands[st.commands.length - 1]['data'], ...st.mdl.data],
          hexCmd: st.mdl.hexCmd,
          isRefresh: st.mdl.isRefresh,
        };
        st.commands[st.commands.length - 1] = { ...ForCmdnewObj };
      } catch (error) {}
      const newObj = {
        data: [...st.mdl.data],
        hexCmd: st.mdl.hexCmd,
        isRefresh: st.mdl.isRefresh,
      };
      this.sendForParsing(ctx, { ...newObj }, onCommand);

      st.mdl.data = [];
      st.mdl.cmdType = null;
      st.mdl.hexCmd = '';
    }
  }

  // legacy :379-382
  private decimalToHexString(number: number): string {
    const hexString = number.toString(16).toUpperCase();
    return hexString.length === 1 ? '0' + hexString : hexString;
  }

  // legacy :384-397
  private clearMdl(st: FramingStateInternal) {
    st.mdl = {
      cmdType: null,
      data: [],
      hexCmd: '',
      startlength: 0,
      endlength: 0,
      searchString: '',
      replaceString: '',
      rStart: [],
      rEnd: [],
      isRefresh: 0,
      startLenRead: false,
      endLenRead: false,
    };
  }

  // legacy :431-440 — the downstream call is injected instead of hard-wired
  // (the commented-out this.bridge.SendToParseData BridgeService call is
  // quarantined dead code and was not ported)
  private sendForParsing(
    ctx: SessionContext,
    data: any,
    onCommand: FramedCommandHandler,
  ) {
    const hex = Buffer.from(data['hexCmd'], 'hex');
    onCommand(ctx, hex, data);
  }

  /**
   * View ctx.framing through the exact legacy field types and upgrade the
   * createFramingState() defaults to the legacy initial values (the
   * session-context sketch omits the G/R bookkeeping fields and types
   * previousCmd/isRefresh differently than the legacy code used them).
   * Idempotent: only pristine defaults are touched — carry-over framing
   * state between chunks is NEVER clobbered, which is the whole point of
   * hoisting it into the context.
   */
  private framingState(ctx: SessionContext): FramingStateInternal {
    const st = ctx.framing as unknown as FramingStateInternal;
    const m = st.mdl as any;
    if (m.cmd === '') delete m.cmd; // stray sketch-only field — keep {...mdl} spreads shape-identical to legacy commands
    if (m.cmdType === 0) m.cmdType = null; // legacy initial: null
    if (m.hexCmd === undefined) m.hexCmd = '';
    if (m.startlength === undefined) m.startlength = 0;
    if (m.endlength === undefined) m.endlength = 0;
    if (m.searchString === undefined) m.searchString = '';
    if (m.replaceString === undefined) m.replaceString = '';
    if (m.startLenRead === undefined) m.startLenRead = false;
    if (m.endLenRead === undefined) m.endLenRead = false;
    if (m.rStart === undefined) m.rStart = [];
    if (m.rEnd === undefined) m.rEnd = [];
    if (m.isRefresh === undefined) m.isRefresh = 0;
    if ((st.previousCmd as any) === '') st.previousCmd = null; // legacy initial: null
    if ((st.isRefresh as any) === false) st.isRefresh = 0; // legacy used 0/1
    else if ((st.isRefresh as any) === true) st.isRefresh = 1;
    if (st.cmdLength === undefined) st.cmdLength = 0;
    return st;
  }
}
