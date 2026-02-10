import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { promises as fs, readFileSync as readFileSync, unlinkSync, writeFileSync as writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';
import { UtilityService } from '../services/utility/utility.service';
import { LogService } from '@app/global/utility/log/log.service';
import { VerifypdfService } from '../services/verifypdf/verifypdf.service';
import { FileValidateResponse } from '../interfaces/chunk.interface';
import { saveFileInfoReq } from '../interfaces/upload.interface';
import { UpdatefileinfoService } from '../services/updatefileinfo/updatefileinfo.service';
import { replaceMDL } from 'apps/coreapi/src/interfaces/upload.interface';
import { ConvertService } from '../services/convert/convert.service';
import { EmailService } from '../services/convert/email/email.service';
import { filecopyService } from '../services/filecopy/filecopy.service';

@Processor('convert-email')
export class ConvertEmailProcessor {
  saveDir = 'doc/';
  constructor(
    private readonly config: ConfigService,
    private readonly utility: UtilityService,
    private readonly logService: LogService,
    private readonly fileVerificationService: VerifypdfService,
    private readonly fileInfo: UpdatefileinfoService,
    private readonly convertService: ConvertService,
    private readonly emailS: EmailService,
    private readonly filecopyService: filecopyService,
    @InjectQueue('fileocr-process') private fileocrQueue: Queue,
    @InjectQueue('delete-files') private fileDeleteQueue: Queue,
  ) {
    const msgLibPath = this.config.get<string>('MSGLIB_PATH');
  }

  @Process({ concurrency: 4 })
  async handleConvert(job: Job) {
    try {
      const { identifier, nCaseid, name, nUDid, nUPid, nMasterid } = job.data.data;
      const isConvert = job.data.data.converttype != 'N';
      const nBundledetailid = job.data.nBundledetailid;

      const dirPath = `${this.saveDir}case${nCaseid}`;
      const input = job.data.cPath;
      const output = `${dirPath}/${name}.pdf`;
      const inputPath = resolve(this.config.get('ASSETS'), input);
      const outputPath = resolve(this.config.get('ASSETS'), output);

      if (!await fs.access(inputPath).then(() => true).catch(() => false)) {
        console.log('File not exists')
        let result = await this.convertService.downloadFileToDisk('etabella', input, inputPath);
        // return false;
        //throw new Error(`Input file does not exist: ${inputPath}`);
      }

      try {
        this.logService.info(`Task processed - Convert for ${JSON.stringify(job.data)}`, `email/${identifier}`);
        if (isConvert) {
          this.utility.emit({ event: 'CONVERTING-START', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });
        }
        if (isConvert) {
          this.convertService.convertLog(job.data.data.nMasterid, nBundledetailid, nUDid, 'P');
        }

        const result = await this.convertEmail(dirPath, nCaseid, nBundledetailid, inputPath, outputPath, job.data.cPath, job.data.data, isConvert)
        this.logService.info(`Task processed - Convert end for single ${inputPath} to ${outputPath} result = ${result}`, `email/${identifier}`);
        if (!isConvert && result) {
          if (nUDid) {
            await this.convertService.filedataProcess(job.data, job.data.data, nBundledetailid, inputPath, input, true, false);
            if (isConvert && !result) {
              this.convertToPDFFailed(nUDid, identifier, job)
            }
          }
          return result;
        }


        if (job.data.data.converttype == 'C' || job.data.data.converttype == 'C') {
          await fs.rm(inputPath, { recursive: true });
        }
        if (isConvert) {
          this.utility.emit({ event: 'CONVERTING-SUCCESS', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });
        }

        console.log('File has been converted successfully');
        if (!isConvert) {
          return true
        }
        // console.log(job.data.data)
        if (job.data.data && job.data.data.bIsocr) {
          job.data.data.filetype = 'pdf';
          await this.fileocrQueue.add({ cPath: output, data: job.data.data, nBundledetailid: nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
          // return true;
        }


        // Check if the output file exists before verifying
        if (!await fs.access(outputPath).then(() => true).catch(() => false)) {
          return false;
        }


        // console.log('All chunks merged, now verifying...');
        const verificationResult: FileValidateResponse = await this.fileVerificationService.verifyFile(outputPath);

        console.log('Verification complete:', verificationResult);
        this.utility.emit({ event: 'VERIFY-CPOMPLETE', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });

        this.logService.info(`Task processed - VERIFY-CPOMPLETE ${inputPath} to ${outputPath}`, `email/${identifier}`);

        const stats = await fs.stat(outputPath);
        const fileSize = stats.size;


        let filename = job.data.data.cFilename || job.data.data.name;
        console.log('\n\n\n\nfilename ', filename)
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

        console.log('\n\r\n\r Update file info', fileInfo)

        let res;
        if (fileInfo.nUDid) {
          res = await this.fileInfo.updateFileInfo(fileInfo)
        } else {
          res = await this.fileInfo.updateConvertFileInfo(fileInfo)
        }
        let isComplete = false;
        console.log('result 3', res);
        if (res.msg == 1) {
          try {
            if (res && res['cOldpath'] && res['cOldpath'] != '') {
              this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] })
            }
          } catch (error) {
            console.log('Error in fileDeleteQueue:', error)
          }
          isComplete = true;
          console.log('ADD to copy file queue', output);
          await this.filecopyService.copyFile(output, '', '', res.nBundledetailid);
          this.logService.info(`Task processed - FILE-PATH-UPDATED in DB ${inputPath} to ${outputPath}`, `email/${identifier}`);

          this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid, cFiletype: 'PDF', cFilename: filename, converttype: job.data.data.converttype, msg: 1 } });
          // if (job.data.bisTranscript) {
          //   this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
          // }
        } else {
          isComplete = false;

          this.logService.info(`Task processed - FILE-PATH-UPDATED Failed in DB ${inputPath} to ${outputPath}`, `email/${identifier}`);

          this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid, msg: -1 } });
          // if (job.data.bisTranscript) {
          //   this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { ...res, identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
          // }
        }

        // this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid, cFiletype: 'PDF', cFilename: filename, converttype: job.data.data.converttype, msg: 1 } });

        return result;
      } catch (error) {
        console.error(`Error converting file: ${error.message}`);
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




  async convertEmail(
    dirPath: string,
    nCaseid: string,
    nId: string,
    inputFile: string,
    outputFile: string,
    cPath: string,
    filedata: any,
    isConvert: boolean
  ): Promise<boolean> {
    console.log('Step 2');

    this.convertService.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'S');

    this.logService.info(`Task processed - convert Email ${inputFile} to ${outputFile}`, `email/${filedata.identifier}`);

    // const data = { dirPath: dirPath, cPath: cPath, cOutputpath: outputFile, nId: nId, nCaseid: nCaseid, nSectionid: filedata.nSectionid, nMasterid: filedata.nMasterid };
    const data = { dirPath: dirPath, cPath: cPath, cOutputpath: outputFile, nId: nId, nCaseid: nCaseid, nSectionid: filedata.nSectionid, nBundleid: filedata.nBundleid, nMasterid: filedata.nMasterid };
    const result = await this.emailS.getemailparse(data, filedata.converttype);
    console.log(`Task processed - convert Email ${inputFile} to ${outputFile} status ${result}`)
    this.logService.info(`Task processed - convert Email ${inputFile} to ${outputFile} status ${result}`, `email/${filedata.identifier}`);
    // Check if parsing was successful
    if (result) {
      try {
        const dirPath = ``; // `${this.upld.docPath}/case${nCaseid}/`;
        console.log('Step 4.2')
        this.convertService.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'C');

      } catch (error) {
        console.error('convertEmail error:', error);
        this.convertService.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'F', error);
        this.logService.info(`Task processed - convert Email error ${inputFile} to ${outputFile}  ${error}`, `email/${filedata.identifier}`);

      }
    } else {
      console.log('Step 4.3')
      this.utility.emit({ event: 'CONVERTING-FAILED', data: { identifier: filedata.identifier, nMasterid: filedata.nUserid, nProgress: 0, filename: filedata.cFilename } });
      // Return false if no files or parsing was unsuccessful

    }
    return result
  }



  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }


}