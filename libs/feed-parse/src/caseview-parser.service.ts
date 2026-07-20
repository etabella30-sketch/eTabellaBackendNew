/**
 * CaseviewParserService — singleton-free port of the CaseView ('C') lane
 * (apps/realtime/src/parse-data/parse-data.service.ts) for Phase 2 of
 * docs/eclipse-wss-ingest-plan.md.
 *
 * The byte-loop algorithm is VERBATIM (same branch structure, same tuple
 * shapes); all session state comes from the passed SessionContext and all
 * side effects leave through ctx.sink. In particular, sendToUsers — which in
 * legacy IGNORED its currentJob parameter and read
 * sessionService.CurrentJob/currentSessionid/currentSessionLines/
 * currentSessionDetail (the known 'C'-lane singleton leak,
 * docs/feed-parse-quarantine.md "PORT WITH fix") — now consumes ctx only.
 *
 * NOT PORTED (quarantined):
 *  - logs/s_<id>/cmds.txt + logs/<date>_file<sess>_all.txt appends -> ctx.sink.log
 *  - utilityService.saveData JSON snapshot dumps (data/sessions<id>/linebuffer|
 *    globalbuffer|allsession.json) — debug file writes; durable persistence is
 *    the ingest app's job via the sink
 *  - getCurrentServerSocket / socketService.sockets URL routing + the
 *    "Server not found" branch — delivery-socket choice lives behind
 *    ctx.sink.emitDelivery now
 */
import { Injectable, Logger } from '@nestjs/common';
import { FeedJob, SessionContext } from './session-context';

/**
 * Legacy VerifyTabsService.verify() filtered detected {TAB} tokens against a
 * DB-fetched per-case tab list held on that (singleton) service. The lib
 * cannot fetch it; until SessionContext formally declares the field, accept it
 * as an optional extension. Absent list == legacy "tabs not fetched yet"
 * behavior (every line gets x[7] = []).
 */
type TabAwareContext = SessionContext & { caseTabs?: string[] };

@Injectable()
export class CaseviewParserService {
  private readonly logger = new Logger('caseview-parser');

  /** verbatim UtilityService.pattern — page-number frame \x0F...\x0C.... */
  private readonly pattern = /\x0F.*?\x0C[^\s]*/; // /\x0F\d{8}\x0C\d{4}/;
  /** verbatim UtilityService.customPattern — yHEXz timecode markers. */
  private readonly customPattern = /y([0-9A-Fa-f]+)z/g;

  /**
   * Entry point — enqueues the chunk onto the per-session parse lane
   * (was the service-level this.taskQueue).
   */
  public async parseData(ctx: SessionContext, incomingBuffer: Buffer): Promise<void> {
    ctx.parseQueue.addTask(async () => {
      try {
        await this.parseDataQueue(ctx, incomingBuffer);
      } catch (error) {
        this.logger.error('Error parsing data:', error);
      }
    });
  }

  private async parseDataQueue(ctx: SessionContext, incomingBuffer: Buffer): Promise<void> {

    await this.addToLocalFile(ctx, incomingBuffer);

    const currentJob: FeedJob = ctx.job;

    try {
      const strBuffer = incomingBuffer.toString('ascii');
      // was utilityService.fileLog(currentSession, ..., "all") — file append
      ctx.sink.log('\n' + Array.from(incomingBuffer).toString() + ' - ' + strBuffer);

      let str = this.replaceCustomPattern(strBuffer);

      if (this.matchPattern(str)) {
        str = this.pageNoReplace(str);
      }

      const modifiedBuffer = Buffer.from(str, 'ascii');

      for (let byte of modifiedBuffer) {
        if (byte !== 0x08 && byte !== 10) {
          currentJob.crLine.push(byte);
        }

        if (!currentJob.lineBuffer[currentJob.lineCount]) {
          currentJob.lineBuffer[currentJob.lineCount] = [];
        }

        let crTm = this.getIndianTM();
        if (currentJob.lineBuffer[currentJob.lineCount] && currentJob.lineBuffer[currentJob.lineCount].length && currentJob.lineBuffer[currentJob.lineCount][0]) {
          crTm = currentJob.lineBuffer[currentJob.lineCount][0];
        }

        currentJob.lineBuffer[currentJob.lineCount] = [crTm, currentJob.crLine, currentJob.lineCount];
        this.removeExtraLines(currentJob);

        if (byte === 0x08) {
          try {
            if (currentJob.globalBuffer[currentJob.globalBuffer.length - 1][1] != currentJob.lineCount) {
              currentJob.lineCount = currentJob.globalBuffer[currentJob.globalBuffer.length - 1][1];
              currentJob.crLine = currentJob.lineBuffer[currentJob.lineCount][1];
            }
            this.removeExtraLines(currentJob);
          } catch (error) {
            this.logger.error('Error handling backspace:', error);
          }
          currentJob.crLine.pop();
          try {
            currentJob.globalBuffer.pop();
          } catch (error) {
            this.logger.error('Error ', error);
          }
        } else {
          try {
            currentJob.globalBuffer.push([byte, currentJob.lineCount]);
          } catch (error) {
            this.logger.error('Error ', error);
          }
        }

        if (byte == 10) {
          currentJob.crLine = [];
          currentJob.lineCount++;
        }
      }

      // QUARANTINED — legacy wrote three debug JSON snapshots here via
      // utilityService.saveData (data/sessions<id>/linebuffer.json,
      // globalbuffer.json, allsession.json). File I/O is forbidden in the lib;
      // durable state persistence belongs to the ingest app through the sink.
    } catch (error) {
      this.logger.error('Error in parseDataQueue:', error);
    }
    await this.sendToUsers(ctx);
  }

  private removeExtraLines(currentJob: FeedJob): void {
    try {
      if ((currentJob.lineBuffer.length - 1) > currentJob.lineCount) {
        currentJob.lineBuffer.splice(currentJob.lineCount + 1);
      }
    } catch (error) {
      this.logger.error('Error removing extra lines:', error);
    }
  }

  /** was an append to logs/s_<sessionService.currentSessionid>/cmds.txt */
  private async addToLocalFile(ctx: SessionContext, incomingBuffer: Buffer): Promise<void> {
    try {
      const log_msg = (incomingBuffer.toString('hex'));
      ctx.sink.log(log_msg);
    } catch (error) {
      this.logger.error('Error adding to local file:', error);
    }
  }

  /**
   * Legacy sendToUsers ignored its currentJob parameter and read the
   * SessionService singleton throughout — rewritten to consume ctx.
   * Emission payload shapes are preserved EXACTLY ({i,d,date} local,
   * {i,d,date,l,p} delivery).
   */
  private async sendToUsers(ctx: SessionContext): Promise<void> {
    const currentJob: FeedJob = ctx.job;

    try {
      if (currentJob?.lineBuffer?.length) {
        let array = currentJob.lineBuffer.slice(currentJob.lineBuffer.length - 2, currentJob.lineBuffer.length) || [];
        try {
          for (let x of array) {
            let tabs = this.verifyTabs(ctx, x[1]);
            x[7] = tabs;
          }
        } catch (error) {

        }
        if (array?.length) {
          // was this.server.emit("message", ...)
          ctx.sink.emitLocal("message", {
            i: currentJob.lineCount,
            d: array,
            date: ctx.nSesid
          });
        }
      }

    } catch (error) {
      this.logger.error('Error sending to local users:', error);
    }

    try {

      // was sessionService.getLiveId(currentSessionid) || currentSessionid —
      // the live-id aliasing moves into the sink implementation.
      const sessionLiveId = ctx.nSesid;

      if (currentJob.lineBuffer.length) {
        let array = currentJob.lineBuffer.slice(currentJob.lineBuffer.length - 2, currentJob.lineBuffer.length) || [];
        if (array.length) {

          try {
            for (let x of array) {
              let tabs = this.verifyTabs(ctx, x[1]);
              x[7] = tabs;
            }
          } catch (error) {

          }

          try {
            let calculatedPage = Math.floor(array[array.length - 1][2] / (ctx.nLines ? ctx.nLines : 25)) + 1;
            let datas = {// message
              i: currentJob.lineCount,
              d: array,
              date: sessionLiveId,
              l: ctx.nLines ? ctx.nLines : 25,
              p: calculatedPage
            }
            let localdatas = {// message
              i: currentJob.lineCount,
              d: array,
              date: ctx.nSesid,
              l: ctx.nLines ? ctx.nLines : 25,
              p: calculatedPage
            }
            // was liveServer.emit("TCP-DATA", datas) behind
            // getCurrentServerSocket() URL routing — sink owns delivery now.
            try {
              ctx.sink.emitDelivery("TCP-DATA", datas);
            } catch (error) {
            }

            // was savedataService.saveDataFinal(localdatas, sessions, 'localdata', page, lines)
            await ctx.sink.savePageData(localdatas, calculatedPage, ctx.nLines);
          } catch (error) {
            // console.log('Error sending data to socket', error);

          }
        }
      }

    } catch (error) {
      this.logger.error('Error in sendToUsers:', error);
    }


  }

  /**
   * Pure port of apps/realtime VerifyTabsService.verify() (regex scan for
   * {TAB} tokens, filtered against the per-case tab list). The DB fetch that
   * populated caseTabs on the legacy singleton stays in the ingest app; the
   * list rides in on the context (absent == legacy unfetched == no matches).
   */
  private verifyTabs(ctx: TabAwareContext, charcodes: any[]): string[] {
    try {
      const caseTabs: string[] = ctx.caseTabs || [];

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
        ctx.sink.log('Tab in line ' + value);

        // Check if the value exists in caseTabs and add to results if true
        const key = value.split(/[\s-]/)[0]; // Split by space or hyphen and take the first part
        if (caseTabs.includes(key)) {
          matches.push(`{${value}}`);
        } else {
          ctx.sink.log(`Tab {${key}} Found But not exists in caseTabs total ${caseTabs.length}`);
        }
      }

      return matches; // Return the filtered and formatted matches
    } catch (error) {
      this.logger.error('Error in verify method:', error);
      return [];
    }
  }

  // ------------------------------------------------------------------
  // Pure helpers — verbatim from apps/realtime UtilityService (regex/time
  // computation only; the file-writing members of that service were NOT
  // ported).
  // ------------------------------------------------------------------

  private pageNoReplace(str: string): string {
    return str.replace(this.pattern, "");
  }

  private matchPattern(str: string): boolean {
    return this.pattern.test(str);
  }

  private replaceCustomPattern(input: string): string {
    return input.replace(this.customPattern, "\n");
  }

  private getIndianTM(): string {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

}
