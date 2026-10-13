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
import { conversionOutputPath } from './conversion-resource';


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
      // Metadata may have created a document before Redis/storage became unavailable. Resume
      // the saved resource instead of converting again and inserting another BundleDetail.
      if (job.data.documentCopy) return await this.completeDocumentCopy(job, job.data.documentCopy);
      const { identifier, nCaseid, name, nUDid, nUPid } = job.data.data;
      console.log('Processing convert job:', job.data);
      try {
        let nBundledetailid = job.data.nBundledetailid;

        const nMasterid = job.data.data;

        const dirPath = `${this.saveDir}case${nCaseid}`;
        const input = job.data.cPath;
        const output = conversionOutputPath(job, 'convert', dirPath, name);
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
              // The native resource already belongs to this UploadDetail. Recover that exact row
              // rather than creating another document when an unsuccessful conversion is retried.
              nBundledetailid = nBundledetailid ?? await this.fileInfo.findUploadDocument(nUDid, nUPid, nCaseid, job.data.data.nMasterid);
              const metadata = { ...job.data.data, nUserid: job.data.data.nMasterid, nParentbundleid: job.data.data.nBundleid };
              const saved = await this.convertService.filedataProcess(job.data, metadata, nBundledetailid, inputPath, input, true, false);
              if (saved !== true) throw new Error('Original upload metadata has not completed');
              const documentCopy = { output: input, inputPath, outputPath: inputPath, filename: job.data.data.cFilename,
                res: { msg: 1, nBundledetailid: job.data.nNewBundledetailid ?? nBundledetailid }, nativeFallback: true };
              const savedData = { ...job.data, documentCopy };
              await job.update(savedData);
              job.data = savedData;
              return await this.completeDocumentCopy(job, documentCopy);
            } else {
              this.utility.emit({ event: 'CONVERTING-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: job.data.data.nCaseid } });
            }
            return result;
          }
          console.log('File has been converted successfully');
          // console.log(job.data.data)



          // Check if the output file exists before verifying
          if (!await fs.access(outputPath).then(() => true).catch(() => false)) {
            throw new Error('Converted document output is unavailable');
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

          let res = !fileInfo.nBundledetailid ? await this.fileInfo.findConvertedDocument(fileInfo, nCaseid) : null;
          if (!res) {
            res = fileInfo.nUDid ? await this.fileInfo.updateFileInfo(fileInfo) : await this.fileInfo.updateConvertFileInfo(fileInfo);
          }
          // console.log('result 3', res);
          let isComplete = false;
          if (res.msg == 1) {
            isComplete = true;
            const documentCopy = { output, inputPath, outputPath, filename, res };
            const savedData = { ...job.data, documentCopy };
            await job.update(savedData);
            job.data = savedData;
            return await this.completeDocumentCopy(job, documentCopy);
            // if (job.data.bisTranscript) {
            //   this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
            // }
          } else {
            isComplete = false;

            this.logService.info(`Task processed - FILE-PATH-UPDATED Failed in DB ${inputPath} to ${outputPath}`, `upload/${nUPid ? nUPid : null}/${identifier}`);

            this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, msg: -1 } });
            throw new Error('Converted document metadata has not completed');
            // if (job.data.bisTranscript) {
            //   this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { ...res, identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
            // }
          }

          // this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, cFiletype: 'PDF', cFilename: filename, converttype: job.data.data.converttype, msg: 1 } });

          return result;
        } catch (error) {
          console.error(`Error converting file: ${error.message}`);
          throw error;
        }
      } catch (error) {
        console.log(error)
        throw error;
      }
    } catch (error) {
      console.error('Error processing convert job:', error);
      throw error;
    }
  }

  private async completeDocumentCopy(job: Job, pending: { output: string; inputPath: string; outputPath: string; filename: string; res: any; storageComplete?: boolean; nativeFallback?: boolean }): Promise<boolean> {
    const { identifier, nCaseid, nUPid, nMasterid, converttype } = job.data.data;
    const { output, inputPath, filename, res } = pending;
    if (!pending.storageComplete) {
      if (await this.filecopyService.copyFile(output, '', '', res.nBundledetailid, null, null, null, nUPid, null, null, true) !== true) {
        throw new Error('Converted document storage has not completed');
      }
      const completed = { ...pending, storageComplete: true };
      const savedData = { ...job.data, documentCopy: completed };
      await job.update(savedData);
      job.data = savedData;
    }
    if (pending.nativeFallback) {
      await this.convertToPDFFailed(job.data.data.nUDid, identifier, job);
      await fs.rm(pending.outputPath, { force: true });
      return false;
    }
    // Source cleanup and success signals happen only after storage and its notification job are durable.
    if (res.cOldpath && res.cOldpath !== output) await this.fileDeleteQueue.add({ jFiles: [res.cOldpath] });
    if (job.data.data.bIsocr) {
      const data = { ...job.data.data, filetype: 'pdf', nBundledetailid: res.nBundledetailid };
      await this.fileocrQueue.add({ cPath: output, data, nBundledetailid: res.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60, attempts: 3, backoff: 1000 * 60 * 5 });
    }
    if (converttype === 'C') await fs.rm(inputPath, { force: true });
    await fs.rm(pending.outputPath, { force: true });
    this.utility.emit({ event: 'CONVERTING-SUCCESS', data: { identifier, nMasterid, nCaseid } });
    this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nCaseid, nMasterid, cFiletype: 'PDF', cFilename: filename, converttype, msg: 1 } });
    return true;
  }

  async convertToPDFFailed(nUDid, identifier, job) {
    console.log('Conversion failed');

    let mdl: replaceMDL = { nUDid: nUDid, cStatus: 'CF', nMasterid: job.data.data.nMasterid, cName: job.data.data.name, cSize: job.data.data.size, cType: job.data.data.filetype };
    const result = await this.fileInfo.replaceFIleDetail(mdl);
    if (result?.msg !== 1) throw new Error('Original upload conversion status has not completed');
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
