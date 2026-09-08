import { Injectable } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { hyperlinkFiles, hyperlinkProcess, hyperlinkScanResult, searchedResult } from '../../interfaces/hyperlink.interface';
import { promises as fs } from 'fs';
import * as fs_original from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/** Registry entry of an in-flight python scan (so a cancel can kill it). */
interface runningScan {
  batchId: string;
  nBundledetailid: string;
  /** run token of the batch attempt that spawned it (cancel kills per run) */
  run?: string;
  proc: ChildProcess;
  /** set by killBatch() before the SIGKILL so the close handler can tell a cancel from a genuine exit */
  cancelled: boolean;
}

@Injectable()
export class HyperlinksearchService {
  /** `<batchId>:<run>:<nBundledetailid>` -> in-flight python of the v2 file jobs (one file may run in two batches / two runs) */
  private readonly running = new Map<string, runningScan>();

  constructor(private readonly config: ConfigService) { }

  private regKey(batchId: string | undefined, nBundledetailid: string, run?: string): string {
    return `${batchId || ''}:${run || ''}:${nBundledetailid}`;
  }

  /** Track a spawned python so cancelhyperlink can kill it. */
  register(batchId: string, nBundledetailid: string, proc: ChildProcess, run?: string): void {
    this.running.set(this.regKey(batchId, nBundledetailid, run), { batchId, nBundledetailid, run, proc, cancelled: false });
  }

  unregister(nBundledetailid: string, batchId?: string, run?: string): void {
    this.running.delete(this.regKey(batchId, nBundledetailid, run));
  }

  /** Kill every registered python of a batch -- of one run when given, else any run;
   *  returns how many were signalled. The close handler unregisters them. */
  killBatch(batchId: string, run?: string): number {
    let n = 0;
    for (const entry of this.running.values()) {
      if (entry.batchId !== batchId || entry.cancelled) continue;
      if (run && entry.run && entry.run !== run) continue;
      entry.cancelled = true;
      try { entry.proc.kill('SIGKILL'); n++; } catch (error) { /* already gone */ }
    }
    return n;
  }

  /** Kill the registered python of ONE file job (cancel / restart noticed by the job's own poll); true when signalled. */
  killFile(batchId: string, nBundledetailid: string, run?: string): boolean {
    const entry = this.running.get(this.regKey(batchId, nBundledetailid, run));
    if (!entry || entry.cancelled) return false;
    entry.cancelled = true;
    try { entry.proc.kill('SIGKILL'); return true; } catch (error) { return false; }
  }

  /** Number of registered in-flight pythons (all batches). */
  get inFlight(): number { return this.running.size; }

  /**
   * Short filesystem-safe tag of a batch RUN (batchId contains ':'), '' for
   * the legacy path. The run token is part of it so a python that survived a
   * cancel race never shares its CSV / temp file with the restarted run.
   */
  batchTag(batchId?: string, run?: string): string {
    return batchId ? '_' + createHash('sha1').update(`${batchId}:${run || ''}`).digest('hex').slice(0, 10) : '';
  }

  /**
   * CSV written by the python and read by the stored procedure. Batch
   * specific in v2: the same file scanned by two batches at once (a
   * single-file job and its bundle) must not share the result file.
   */
  csvPathFor(file: hyperlinkFiles, batchId: string | undefined, dir: string, run?: string): string {
    return path.join(dir || '', `search_results${file.nBundledetailid}${this.batchTag(batchId, run)}.csv`);
  }

  /** Temp download of the PDF, batch specific for the same reason. */
  tempPathFor(file: hyperlinkFiles, batchId: string | undefined, dir: string, run?: string): string {
    return path.join(dir || '', `temp_${(file.nBundledetailid || new Date().getTime().toString())}${this.batchTag(batchId, run)}.pdf`);
  }

  /**
   * Run the hyperlink scan for one file.
   *
   * Success contract (strict): python exit code 0 AND no stdout line matching
   * /^(Error|ERROR)\b/ AND no "Error inserting data into PostgreSQL" AND no
   * stderr line matching /^(Traceback|Error|ERROR)\b/ (the legacy scripts can
   * die with a traceback on stderr and still exit 0). Anything else is
   * {ok:false} with `reason` = exit code + first error line (<= 300 chars). A
   * scan running longer than HYPERLINK_FILE_TIMEOUT_MIN is killed (code -1);
   * a python that cannot be spawned REJECTS (spawn 'error' event) so the file
   * job can retry it once (Bull attempts 2) -- no scan work has happened at
   * that point.
   *
   * `batchId` / `run` are optional: when given the child is registered so
   * that cancelhyperlink (or the file job's own poll) can kill it, and the
   * CSV / temp names are specific to that batch run.
   */
  async createHyperlinkFile(fileinfo: hyperlinkFiles, jobData: hyperlinkProcess, searchTermsPath: string, batchId?: string, run?: string): Promise<hyperlinkScanResult> {

    const outputPath = this.config.get('HYPERLINK_OUTPUT_PATH')

    try {
      await fs.access(outputPath);
    } catch (error) {
      await fs.mkdir(outputPath, { recursive: true });
    }

    const csvFilepath = this.csvPathFor(fileinfo, batchId, outputPath, run);
    // const pdfPath = path.join(this.config.get('ASSETS'), fileinfo.cPath);
    const pdfPath = (fileinfo.cPath);

    try {

      try {
        await fs.access(this.config.get('TEMP_PATH'));
      } catch (error) {
        await fs.mkdir(this.config.get('TEMP_PATH'), { recursive: true });
      }

      const tempPath = this.tempPathFor(fileinfo, batchId, this.config.get('TEMP_PATH'), run);
      // Script selection. Smart scan wins over deep scan: it is bracket-driven
      // like the default script (same argv), but tolerant of references broken
      // across lines, pages and table cells. Deep scan is term-list driven.
      const scriptKey = jobData.isSmartscan ? 'PY_HYPERLINK_SMART' : (jobData.isDeepscan ? 'PY_HYPERLINK_DEEP' : 'PY_HYPERLINK');
      const scriptPath = this.config.get(scriptKey);
      if (!scriptPath) {
        console.error('ERROR:', `${scriptKey} is not configured; cannot run hyperlink search`);
        return { ok: false, code: -2, reason: `${scriptKey} is not configured` };
      }
      const params = [
        scriptPath,
        pdfPath,
        (jobData.isDeepscan && !jobData.isSmartscan ? searchTermsPath : fileinfo.nBundledetailid),
        csvFilepath,
        fileinfo.nBundledetailid,
        this.config.get('DO_SPACES_BUCKET_NAME'),
        this.config.get('DO_SPACES_KEY'),
        this.config.get('DO_SPACES_SECRET'),
        this.config.get('DO_SPACES_ENDPOINT'),
        tempPath
      ];
      console.log('INFO:', 'Python command:', this.config.get('pythonV'), params.join(' '));
      const pythonProcess = spawn(this.config.get('pythonV'), params,
        {
          env: {
            ...process.env,
            PYTHONIOENCODING: "UTF-8",
            DB_DATABASE: this.config.get('DB_DATABASE'),
            DB_USERNAME: this.config.get('DB_USERNAME'),
            DB_PASSWORD: this.config.get('DB_PASSWORD'),
            DB_HOST: this.config.get('DB_HOST'),
            DB_PORT: this.config.get('DB_PORT')
          },
        });
      if (batchId) this.register(batchId, fileinfo.nBundledetailid, pythonProcess, run);

      // stdout is scanned for error lines (the legacy scripts exit 0 on
      // errors); stderr for tracebacks / "Error" lines (exit 0 as well when
      // the exception is swallowed by the script's own handler)
      const debugLog = String(this.config.get('HYPERLINK_DEBUG_LOG')) === 'true';
      let stdoutTail = '';
      let stderrTail = '';
      let firstErrorLine: string | null = null;
      const errorLine = /^(Error|ERROR)\b/;
      const stderrErrorLine = /^(Traceback|Error|ERROR)\b/;
      const noteLines = (chunk: string) => {
        stdoutTail += chunk;
        const parts = stdoutTail.split(/\r?\n/);
        stdoutTail = parts.pop() || '';                       // keep the unterminated remainder
        for (const line of parts) {
          const l = line.trim();
          if (firstErrorLine === null && (errorLine.test(l) || l.includes('Error inserting data into PostgreSQL'))) firstErrorLine = l;
        }
      };
      const noteStderr = (chunk: string) => {
        stderrTail += chunk;
        const parts = stderrTail.split(/\r?\n/);
        stderrTail = parts.pop() || '';
        for (const line of parts) {
          const l = line.trim();
          if (firstErrorLine === null && stderrErrorLine.test(l)) firstErrorLine = `stderr: ${l}`;
        }
      };
      pythonProcess.stdout.on('data', (data: Buffer) => {
        console.log('\n\r\n\r\n\r\n\rINFO:', data.toString());
        const log_msg = data.toString();
        noteLines(log_msg);
        if (debugLog) {
          fs_original.appendFile('hyperlink_test.txt', log_msg + '\n', (err) => {
            if (err) console.error('Error appending to file:', err);
          });
        }
      });
      pythonProcess.stderr.on('data', (data: Buffer) => {
        console.log('\n\r\n\r\n\r\n\rERROR:', data.toString());
        noteStderr(data.toString());
      });
      // Per-file guard: a scan that runs longer than HYPERLINK_FILE_TIMEOUT_MIN
      // (default 45 min; drawing-heavy 300 MB files take ~1 min after the
      // bracket fast-path) is killed and the file marked failed, so one bad
      // file can never stall the batch. Fractional minutes are honoured down
      // to one second (tests use 0.05 = 3 s).
      const timeoutMin = Number(this.config.get('HYPERLINK_FILE_TIMEOUT_MIN')) || 45;
      const fileTimeoutMs = Math.max(1000, Math.round(timeoutMin * 60 * 1000));
      let timedOut = false;
      const killTimer = setTimeout(() => {
        timedOut = true;
        console.error('ERROR:', `hyperlink scan of ${fileinfo.nBundledetailid} exceeded ${fileTimeoutMs / 60000} min, killing python`);
        try { pythonProcess.kill('SIGKILL'); } catch (e) { /* already gone */ }
      }, fileTimeoutMs);
      return new Promise((resolve, reject) => {
        pythonProcess.on('error', (err) => {
          clearTimeout(killTimer);
          if (batchId) this.unregister(fileinfo.nBundledetailid, batchId, run);
          console.error('ERROR:', err);
          reject(err);
        });
        pythonProcess.on('close', (code, signal) => {
          clearTimeout(killTimer);
          // killBatch() / killFile() flag the registry entry before the SIGKILL
          const entry = batchId ? this.running.get(this.regKey(batchId, fileinfo.nBundledetailid, run)) : undefined;
          const killedByCancel = !!entry && entry.cancelled && !timedOut && code !== 0;
          if (batchId) this.unregister(fileinfo.nBundledetailid, batchId, run);
          noteLines('\n');                                      // flush the last unterminated line
          noteStderr('\n');
          if (timedOut) {
            console.error(`Python process killed after ${fileTimeoutMs / 60000} min (timeout)`);
            resolve({ ok: false, code: -1, reason: `timeout after ${fileTimeoutMs / 60000} min` });
            return;
          }
          if (code !== 0) {
            console.error(`Python process exited with code ${code}`);
            const why = killedByCancel ? 'cancelled' : (firstErrorLine || (signal ? `signal ${signal}` : 'no error line'));
            resolve({ ok: false, code: code === null ? -1 : code, reason: `exit ${code}: ${why}`.slice(0, 300) });
            return;
          }
          if (firstErrorLine !== null) {
            console.error(`Python reported an error with exit code 0: ${firstErrorLine}`);
            resolve({ ok: false, code: 0, reason: `exit 0: ${firstErrorLine}`.slice(0, 300) });
            return;
          }
          resolve({ ok: true, code: 0 });
        });
      });
    } catch (error) {
      console.error('ERROR:', error);
      return { ok: false, code: -2, reason: String(error?.message || error).slice(0, 300) };
    }
  }


  async createIndexHyperlinkFile(fileinfo: hyperlinkFiles, jobData: hyperlinkProcess, tempFilePath: string, searchResults: any[], search_termsWithbundle: any[]): Promise<boolean> {
    console.log('CREATING INDEX')
    const filterdata: any[] = [];



    // const pdfPath = path.join(this.config.get('ASSETS'), fileinfo.cPath);
    const pdfPath = fileinfo.cPath;

    // try {
    //   await fs.access(pdfPath);
    // } catch (error) {
    //   console.log('ERROR:', `File not found: ${pdfPath}`);
    //   return false;
    // }

    try {

      const tempPath = path.join(this.config.get('TEMP_PATH'), `temp_${(fileinfo.nBundledetailid || new Date().getTime().toString())}.pdf`);
      const params = [
        this.config.get('PY_HYPERLINK_INDEX'),
        pdfPath,
        tempFilePath,
        'A',
        'B',
        this.config.get('DO_SPACES_BUCKET_NAME'),
        this.config.get('DO_SPACES_KEY'),
        this.config.get('DO_SPACES_SECRET'),
        this.config.get('DO_SPACES_ENDPOINT'),
        tempPath
      ];
      // [
      //   this.config.get('PY_HYPERLINK_INDEX'),
      //   pdfPath,
      //   tempFilePath
      // ]
      console.log(params)
      console.log('INFO:', 'Python command:', this.config.get('pythonV'), params.join(' '));
      const pythonProcess = spawn(this.config.get('pythonV'), params,
        {
          env: {
            ...process.env,
            PYTHONIOENCODING: "UTF-8",
            DB_DATABASE: this.config.get('DB_DATABASE'),
            DB_USERNAME: this.config.get('DB_USERNAME'),
            DB_PASSWORD: this.config.get('DB_PASSWORD'),
            DB_HOST: this.config.get('DB_HOST'),
            DB_PORT: this.config.get('DB_PORT')
          },
        });

      pythonProcess.stdout.on('data', (data: Buffer) => {
        try {

          let rows = data.toString("utf8").split("TOEND");
          l1: for (let x of rows) {
            let obj: searchedResult = {} as searchedResult;

            if (x.includes("PAGENO")) {
              let array = x.split(",");
              l2: for (let y of array) {
                if (y.includes("PAGENO")) {
                  obj.page = parseInt(y.split(":")[1]);
                } else if (y.includes("Term:")) {
                  obj.cTerm = y.split(":")[1].trim();
                } else if (y.includes("x:")) {
                  obj.x = parseFloat(y.split(":")[1]);
                } else if (y.includes("y:")) {
                  obj.y = parseFloat(y.split(":")[1]);
                } else if (y.includes("x1:")) {
                  obj.width = parseFloat(y.split(":")[1]) - obj.x;
                } else if (y.includes("y1:")) {
                  obj.height = parseFloat(y.split(":")[1]) - obj.y;
                  obj.y = obj.y + obj.height;
                } else if (y.includes("pref:")) {
                  obj.prefix = y.split(":")[1].trim();
                } else if (y.includes("Hword:")) {
                  try {
                    if (y.includes("-")) {
                      obj.redirectpage = parseInt(
                        y
                          .split(":")[1]
                          .split("-")
                        [y.split(":")[1].split("-").length - 1].trim()
                      );
                    }
                  } catch (error) { }
                } else if (y.includes("TOEND")) {
                  break l2;
                }
              }
            }

            if (Object.keys(obj).length) {
              if (
                filterdata.findIndex(
                  (a) => a.x == obj.x && a.y == obj.y && a.page == obj.page
                ) == -1
              ) {
                filterdata.push(obj);
              }
            }
          }
        } catch (error) {
          console.log('ERROR:', error);
        }




      });

      return new Promise((resolve, reject) => {

        pythonProcess.stderr.on('data', (data: Buffer) => {
          console.log(`stderr: ${data}`);
          searchResults = [];
          resolve(false);

        });

        pythonProcess.on('error', (err) => {
          console.log('ERROR:', err);
          reject(err);
        });
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.log(`Python process exited with code ${code}`);
            resolve(false);
            return;
          }


          if (filterdata && filterdata.length) {
            for (let rowobject of filterdata) {
              try {
                if (rowobject) {
                  if (!rowobject.cTerm) {
                    rowobject.cTerm = ''
                  }
                  if (!rowobject.cTerm.includes("ALPHA$-")) {
                    let bd_id = null;
                    try {
                      let ls_obj = search_termsWithbundle.find(
                        (a) => a.cTerm == rowobject.cTerm
                      );
                      if (ls_obj) {
                        bd_id = ls_obj.nBundledetailid;
                      }
                      if (rowobject.prefix && rowobject.prefix != 'None') {
                        let neid = rowobject.prefix.replace(`ALPHA$-${rowobject.cTerm}-`, '')
                        if (neid) {
                          bd_id = neid;
                        }
                      }
                    } catch (error) { }
                    let ojs = {
                      page: rowobject.page,
                      type: "strikeout",
                      uuid: uuidv4(),
                      tab: rowobject.cTerm,
                      rects: [
                        {
                          x: rowobject.x,
                          y: rowobject.y,
                          width: rowobject.width,
                          height: rowobject.height,
                          bundledetailid: bd_id,
                          redirectpage: rowobject.redirectpage || 1,
                        },
                      ]
                    };
                    searchResults.push(ojs);
                  } else {
                    if (searchResults.length) {
                      try {
                        let neid = rowobject.cTerm.split("-")[rowobject.cTerm.split("-").length - 1];
                        if (neid) {
                          searchResults[searchResults.length - 1]["bundledetailid"] = neid;
                        }
                      } catch (error) { }
                    }
                  }
                }
              } catch (error) {
              }
            }
          }

          resolve(true);
        });
      });
    } catch (error) {
      console.log('ERROR:', error);
      return false;
    }
  }
}
