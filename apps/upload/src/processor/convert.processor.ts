import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { promises as fs } from 'fs';
import { ConfigService } from '@nestjs/config';

import { spawn } from 'child_process';
import { join, resolve } from 'path';
import { UtilityService } from '../services/utility/utility.service';
import { LogService } from '@app/global/utility/log/log.service';
import { VerifypdfService } from '../services/verifypdf/verifypdf.service';
import { FileValidateResponse } from '../interfaces/chunk.interface';
import { saveFileInfoReq } from '../interfaces/upload.interface';
import { UpdatefileinfoService } from '../services/updatefileinfo/updatefileinfo.service';
import { replaceMDL } from 'apps/coreapi/src/interfaces/upload.interface';
// import * as AWS from 'aws-sdk';
import { ConvertService } from '../services/convert/convert.service';
import { filecopyService } from '../services/filecopy/filecopy.service';


@Processor('convert')
export class ConvertProcessor {
  private ports = ['2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011',
    '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021',
    '2022', '2023', '2024', '2025', '2026'
  ]; // Array of listener ports
  private currentPortIndex = 0;
  private readonly logApp: string = 'convert';
  private readonly convertFilePath: string = this.config.get('PY_CONVERT');
  pythonV = this.config.get('pythonV')
  saveDir = 'doc/';
  domainPath = this.config.get('ATTACHMENT_URL');

  constructor(
    private readonly config: ConfigService,
    private readonly utility: UtilityService,
    private readonly logService: LogService,
    private readonly fileVerificationService: VerifypdfService,
    private readonly fileInfo: UpdatefileinfoService,
    private readonly convertService: ConvertService,
    private readonly filecopyService: filecopyService,
    // @InjectQueue('filecopy-process') private fileCopyQueue: Queue,
    @InjectQueue('fileocr-process') private fileocrQueue: Queue,
    @InjectQueue('delete-files') private fileDeleteQueue: Queue,
  ) {

    const msgLibPath = this.config.get<string>('MSGLIB_PATH');
    // this.MsgReader = require(`${msgLibPath}`);

  }

  @Process({ concurrency: 6 })
  async handleConvert(job: Job) {
    try {
      const { identifier, nCaseid, name, nUDid, nUPid } = job.data.data;
      console.log('Processing convert job:', job.data);
      try {
        let nBundledetailid = job.data.nBundledetailid;

        const nMasterid = job.data.data;

        const dirPath = `${this.saveDir}case${nCaseid}`;
        const input = job.data.cPath;
        const output = `${dirPath}/${name}.pdf`;
        const inputPath = resolve(this.config.get('ASSETS'), input);
        const outputPath = resolve(this.config.get('ASSETS'), output);
        console.log('path ', inputPath, outputPath)
        if (!await fs.access(inputPath).then(() => true).catch(() => false)) {
          console.log('File not exists')
          let result = await this.convertService.downloadFileToDisk('etabella', input, inputPath);
          // return false;
          //throw new Error(`Input file does not exist: ${inputPath}`);
        }

        try {
          // console.log(`Task processed - Convert Start for single ${inputPath} to ${outputPath}`, `upload/${nUPid ? nUPid : null}/${identifier}`)
          this.logService.info(`Task processed - Convert Start for single ${inputPath} to ${outputPath}`, `upload/${nUPid ? nUPid : null}/${identifier}`);
          this.utility.emit({ event: 'CONVERTING-START', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });

          this.convertService.convertLog(job.data.data.nMasterid, nBundledetailid, nUDid, 'P');
          const result = await this.convertToPdf(nBundledetailid, inputPath, outputPath, identifier, job.data.data.nMasterid, nCaseid, job.data.data);
          this.logService.info(`Task processed - Convert end for single ${inputPath} to ${outputPath} result = ${result}`, `upload/${nUPid ? nUPid : null}/${identifier}`);
          if (!result) {
            if (nUDid) {

              await this.convertService.filedataProcess(job.data, job.data.data, nBundledetailid, inputPath, input, true);
              // await this.fileCopyQueue.add({ cPath: input }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
              await this.filecopyService.copyFile(input, '', '', nBundledetailid);
              this.convertToPDFFailed(nUDid, identifier, job)
            } else {
              this.utility.emit({ event: 'CONVERTING-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: job.data.data.nCaseid } });
            }
            return result;
          }
          if (job.data.data.converttype == 'C') {
            await fs.rm(inputPath, { recursive: true });
          }
          this.utility.emit({ event: 'CONVERTING-SUCCESS', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });
          console.log('File has been converted successfully');
          // console.log(job.data.data)



          // Check if the output file exists before verifying
          if (!await fs.access(outputPath).then(() => true).catch(() => false)) {
            return false;
          }


          // console.log('All chunks merged, now verifying...');
          const verificationResult: FileValidateResponse = await this.fileVerificationService.verifyFile(outputPath);

          console.log('Verification complete');
          this.utility.emit({ event: 'VERIFY-CPOMPLETE', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });

          this.logService.info(`Task processed - VERIFY-CPOMPLETE ${inputPath} to ${outputPath} \n ${JSON.stringify(job.data)}`, `upload/${nUPid ? nUPid : null}/${identifier}`);

          // Get the file size
          const stats = await fs.stat(outputPath);
          const fileSize = stats.size;


          let filename = job.data.data.cFilename || job.data.data.name;
          // console.log('\n\n\n\nfilename ', filename)

          this.logService.info(`FILENAME ${filename}`, `upload/${nUPid ? nUPid : null}/${identifier}`);
          filename = filename.replace(/\.[^/.]+$/, '.pdf');

          const fileInfo: saveFileInfoReq = {
            nUDid: nUDid,
            nMasterid: job.data.data.nMasterid,
            cFilename: filename,
            nSectionid: job.data.data.nSectionid,
            nBundleid: job.data.data.nBundleid,
            nBundledetailid: job.data.data.converttype == 'C' ? nBundledetailid : null,
            cFiletype: 'PDF',
            isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
            cPath: output,
            cFilesize: fileSize.toString(),
            nPagerotation: verificationResult.pagerotation,
            cPage: `1-${verificationResult.totalpages}`,
            bisTranscript: (job.data.data.bisTranscript ? job.data.data.bisTranscript : false),
            bMetadata: (job.data.data?.bMetadata ? job.data.data?.bMetadata : false),
            nBaseBDid: nBundledetailid
          };

          // console.log('\n\r\n\r Update file info', fileInfo)

          let res;
          if (fileInfo.nUDid) {
            res = await this.fileInfo.updateFileInfo(fileInfo)
          } else {
            res = await this.fileInfo.updateConvertFileInfo(fileInfo)
          }
          // console.log('result 3', res);
          let isComplete = false;
          if (res.msg == 1) {
            isComplete = true;
            try {
              if (res && res['cOldpath'] && res['cOldpath'] != '') {
                this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] })
              }
            } catch (error) {
              console.log('Error in fileDeleteQueue:', error)
            }
            // await this.fileCopyQueue.add({ cPath: output }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
            await this.filecopyService.copyFile(output, '', '', res.nBundledetailid);
            // success responce



            if (job.data.data && job.data.data.bIsocr) {
              console.log('OCR ', job.data.data, res)

              job.data.data.filetype = 'pdf';
              if (!nBundledetailid) {
                nBundledetailid = res.nBundledetailid;
                job.data.data.nBundledetailid = res.nBundledetailid
              }
              await this.fileocrQueue.add({ cPath: output, data: job.data.data, nBundledetailid: nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
              // return true;
            }

            this.logService.info(`Task processed - FILE-PATH-UPDATED in DB ${inputPath} to ${outputPath}`, `upload/${nUPid ? nUPid : null}/${identifier}`);

            this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, cFiletype: 'PDF', cFilename: filename, converttype: job.data.data.converttype, msg: 1 } });
            // if (job.data.bisTranscript) {
            //   this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
            // }
          } else {
            isComplete = false;

            this.logService.info(`Task processed - FILE-PATH-UPDATED Failed in DB ${inputPath} to ${outputPath}`, `upload/${nUPid ? nUPid : null}/${identifier}`);

            this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, msg: -1 } });
            // if (job.data.bisTranscript) {
            //   this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { ...res, identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
            // }
          }

          // this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, cFiletype: 'PDF', cFilename: filename, converttype: job.data.data.converttype, msg: 1 } });

          return result;
        } catch (error) {
          console.error(`Error converting file: ${error.message}`);
          return false;
        }
      } catch (error) {
        console.log(error)
        return false;
      }
    } catch (error) {
      console.error('Error processing convert job:', error);
      return false;
    }
  }

  async convertToPDFFailed(nUDid, identifier, job) {
    console.log('Conversion failed');

    let mdl: replaceMDL = { nUDid: nUDid, cStatus: 'CF', nMasterid: job.data.data.nMasterid, cName: job.data.data.name, cSize: job.data.data.size, cType: job.data.data.filetype };
    await this.fileInfo.replaceFIleDetail(mdl);
    this.utility.emit({ event: 'CONVERTING-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: job.data.data.nCaseid } });
  }


  async convertToPdf(nBundledetailid: string, inputFile: string, outputFile: string, identifier: string, nMasterid: string, nCaseid: string, filedata: any): Promise<boolean> {
    if (!(/\.(msg)$/i.test(inputFile.toLowerCase()))) {
      const res = await this.convertService.convertToPdf(inputFile, outputFile, identifier, nMasterid, filedata.cFilename, filedata.nUPid, { nBundledetailid, nUDid: filedata.nUDid });
      return res;
    }
    else {
      let res = await this.convertService.convertEmail(nCaseid, nBundledetailid, inputFile, outputFile, filedata)
      return res;
    }


    // const port = this.getNextPort();
    // return new Promise(async (resolve, reject) => {
    //   if (!(/\.(msg)$/i.test(inputFile.toLowerCase()))) {
    //     const pythonProcess = spawn(this.pythonV, [this.convertFilePath, inputFile, outputFile, port]);

    //     pythonProcess.stdout.on('data', (data) => {
    //       const message = data.toString().trim();
    //       console.log('STDOUT:', message);
    //       if (message.startsWith('Progress:')) {
    //         this.utility.emit({ event: 'CONVERTING-PROGRESS', data: { identifier, nMasterid, nProgress: message.split(' ')[1] } });
    //       }
    //     });

    //     pythonProcess.stderr.on('data', (data) => {
    //       console.error('STDERR:', data.toString());
    //     });

    //     pythonProcess.on('close', (code) => {
    //       if (code === 0) {
    //         resolve(true);
    //       } else {
    //         this.logService.error(`CONVERTING-FAILED ${identifier}`, this.logApp)
    //         console.log(new Error(`Python process exited with code ${code}`));
    //         resolve(false);
    //       }
    //     });

    //     pythonProcess.on('error', (error) => {
    //       this.logService.error(`CONVERTING-FAILED ${identifier}`, this.logApp)
    //       console.log(new Error(`Failed to start Python process: ${error.message}`));
    //       resolve(false);
    //     });

    //   } else {
    //     let res = await this.convertService.convertEmail(nCaseid, nBundledetailid, inputFile, outputFile, filedata)
    //     resolve(res);
    //   }
    // });
  }


  private getNextPort(): string {
    const port = this.ports[this.currentPortIndex];
    this.currentPortIndex = (this.currentPortIndex + 1) % this.ports.length;
    return port;
  }
}