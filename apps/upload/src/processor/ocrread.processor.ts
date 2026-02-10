import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { promises as fs } from 'fs';
import { UploadService } from '../upload.service';
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
import { promises } from 'dns';
import { OcrService } from '../services/ocr/ocr.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';

@Processor('fileocr-process')
export class OcrProcessor {
  private readonly logApp: string = 'upload';
  private readonly ocrFilePath: string = this.config.get('PY_OCR');
  pythonV = this.config.get('pythonV')

  constructor(
    private readonly upld: UploadService,
    private readonly config: ConfigService,
    private readonly utility: UtilityService,
    private readonly logService: LogService,
    private readonly fileVerificationService: VerifypdfService,
    private readonly fileInfo: UpdatefileinfoService,
    private readonly ocrService: OcrService,
    private rds: RedisDbService,
    @InjectQueue('filecopy-process') private fileCopyQueue: Queue,
  ) { }

  @Process({ concurrency: 8 })
  async handleOCR(job: Job) {
    try {
      const { nBundledetailid, cPath } = job.data;
      const { identifier, nCaseid, filetype, name, nUDid, nUPid, cFilename, nMasterid } = job.data.data;
      let data = { "nMasterid": nMasterid, "nBundledetailid": nBundledetailid, "nUDid": nUDid, cStatus: 'P' };
      try {
        await this.fileInfo.OcrUpdate(data)
      } catch (error) {

      }
      await this.rds.rpush(`ocr`, nMasterid);
      await this.rds.rpush(`ocr:${nMasterid}`, nBundledetailid);
      // await this.rds.setValue(`ocr:${nMasterid}:${nBundledetailid}`, JSON.stringify({ path: cPath, nOcrtype: job.data.data.nOcrtype, identifier: identifier }), 24 * 3600);
      // this.utility.emit({ event: 'OCR-JOB', data: { id: `ocr:${nMasterid}:${nBundledetailid}` } });
      await this.rds.setValue(`ocr:${nMasterid}:${nBundledetailid}`, JSON.stringify({ path: cPath, nOcrtype: job.data.data.nOcrtype, identifier: identifier, nUDid: nUDid }), 24 * 3600);
      this.utility.emit({ event: 'OCR-JOB', data: { identifier: identifier, nMasterid: nMasterid, id: `ocr:${nMasterid}:${nBundledetailid}`, "nUDid": nUDid } });

      return;
      // const { identifier, nCaseid, filetype, name, nUDid, nUPid, cFilename } = job.data.data;
      // console.log('Processing ocr job:', job.data);
      // const nBundledetailid = job.data.nBundledetailid;

      const dirPath = `${this.upld.docPath}/case${nCaseid}`;
      const input = `${dirPath}/${name}.${filetype}`;
      const output = `${dirPath}/${name}.${filetype}`;
      const inputPath = resolve(this.config.get('ASSETS'), input);
      const outputPath = resolve(this.config.get('ASSETS'), output);

      console.log('Step 1');
      if (!await fs.access(inputPath).then(() => true).catch(() => false)) {
        console.log(`Input file does not exist: ${inputPath}`);
        return false;
      }

      try {

        this.utility.emit({ event: 'OCR-START', data: { identifier, nMasterid: job.data.data.nMasterid } });
        if (nUPid)
          this.logService.info(`Task processed - OCR Start for single ${inputPath} to ${outputPath}`, `upload/${nUPid}/${identifier}`);
        const result = await this.ocrService.ocrToPdf(inputPath, outputPath, job.data.data.nOcrtype, identifier, job.data.data.nMasterid, cFilename, nUPid);
        this.logService.info(`Task processed - OCR end for single ${inputPath} to ${outputPath} result = ${result}`, `upload/${nUPid}/${identifier}`);
        if (!result) {
          if (nUDid) {
            this.ocrToPDFFailed(input, nUDid, identifier, job)
          }
          return result;
        }
        this.utility.emit({ event: 'OCR-SUCCESS', data: { identifier, nMasterid: job.data.data.nMasterid } });
        console.log('File has been ocr successfully');


        // Check if the output file exists before verifying
        if (!await fs.access(outputPath).then(() => true).catch(() => false)) {
          return false;
        }


        // console.log('All chunks merged, now verifying...');
        const verificationResult: FileValidateResponse = await this.fileVerificationService.verifyFile(outputPath);

        console.log('Verification complete:', verificationResult);
        this.utility.emit({ event: 'VERIFY-CPOMPLETE', data: { identifier, nMasterid: job.data.data.nMasterid } });
        if (nUPid)
          this.logService.info(`Task processed - VERIFY-CPOMPLETE ${inputPath} to ${outputPath}`, `upload/${nUPid}/${identifier}`);

        // Get the file size
        const stats = await fs.stat(outputPath);
        const fileSize = stats.size;


        let filename = job.data.data.cFilename;
        filename = filename.replace(/\.[^/.]+$/, '.pdf');

        const fileInfo: saveFileInfoReq = {
          nUDid: nUDid,
          nMasterid: job.data.data.nMasterid,
          cFilename: filename,
          nSectionid: job.data.data.nSectionid,
          nBundleid: job.data.data.nBundleid,
          nBundledetailid: nBundledetailid,
          cFiletype: 'PDF',
          isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
          cPath: output,
          cFilesize: fileSize.toString(),
          nPagerotation: verificationResult.pagerotation,
          cPage: `1-${verificationResult.totalpages}`,
          bisTranscript: (job.data.data.bisTranscript ? job.data.data.bisTranscript : false),
        };

        console.log('\n\r\n\r Update file info', fileInfo)

        let res = await this.fileInfo.updateFileInfo(fileInfo)
        let isComplete = false;
        if (res.msg == 1) {
          isComplete = true;
          await this.fileCopyQueue.add({ cPath: output }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
          // success responce
          if (nUPid)
            this.logService.info(`Task processed - FILE-PATH-UPDATED in DB ${inputPath} to ${outputPath}`, `upload/${nUPid}/${identifier}`);

          this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } });
          if (job.data.bisTranscript) {
            this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
          }
        } else {
          isComplete = false;

          this.ocrToPDFFailed(input, nUDid, identifier, job)
          if (nUPid)
            this.logService.info(`Task processed - FILE-OCR-Failed ${inputPath} to ${outputPath}`, `upload/${nUPid}/${identifier}`);

          this.ocrToPDFFailed(input, nUDid, identifier, job)

          this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, msg: -1 } });
          if (job.data.bisTranscript) {
            this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
          }
        }

        this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.data.nMasterid, msg: 1 } });

        return result;
      } catch (error) {
        // console.error(`Error ocr file: ${error.message}`);
        if (nUPid)
          this.logService.info(`Task processed - FILE-OCR-Catch Error  ${inputPath} to ${outputPath} Error ${error.message}`, `upload/${nUPid}/${identifier}`);

        console.error(`FILE-OCR-Catch Error ${error.message}`, error);
        this.ocrToPDFFailed(input, nUDid, identifier, job)
        return false;
      }
    } catch (error) {
      console.error('Error processing ocr job:', error);
      return false;
    }
  }

  async ocrToPDFFailed(input, nUDid, identifier, job) {
    console.log('OCR failed');
    let mdl: replaceMDL = { nUDid: nUDid, cStatus: 'OF', nMasterid: job.data.data.nMasterid, cName: job.data.data.name, cSize: job.data.data.size, cType: job.data.data.filetype };
    await this.fileInfo.replaceFIleDetail(mdl);
    await this.fileCopyQueue.add({ cPath: input }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //

    this.utility.emit({ event: 'OCR-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid } });
  }


  phrases = ['Scanning contents', 'Linearizing', 'PDF/A conversion', 'Deflating JPEGs', 'OCR', 'Recompressing JPEGs'];


  handleData(resulttype, data, identifier, nMasterid, utility) {

    try {
      const dataString = data.toString().trim();
      console.log('dataString', this.phrases.some(phrase => dataString.includes(phrase)));
      if (this.phrases.some(phrase => dataString.trim().includes(phrase))) {
        resulttype = this.phrases.find(phrase => dataString.includes(phrase));
      }
      console.log('resulttype', resulttype);
      const trimmedData = dataString.trim();
      if (resulttype && trimmedData.match(/\d+%/)) {
        console.log('OCR Progress:', trimmedData);
        let text = trimmedData.replace(/ {2}/g, ' ').replace(/[---━]+/g, ' ');
        if (!text.includes(resulttype)) {
          text = resulttype + ' ' + text;
        }
        text = text.split(`\r`)[0];
        utility.emit({ event: 'OCR-PROGRESS', data: { identifier, nMasterid, message: text } });
      }

      return resulttype;
    } catch (error) {
    }
  }


  ocrToPdf(inputFile: string, outputFile: string, sharp_image, identifier: string, nMasterid: string, nUDid: string): Promise<boolean> {

    return new Promise((resolve, reject) => {
      let resulttype;
      console.log('OCR cmd ', this.pythonV, this.ocrFilePath, inputFile, outputFile, sharp_image);
      const pythonProcess = spawn(this.pythonV, [this.ocrFilePath, inputFile, outputFile, sharp_image], {
        env: {
          ...process.env,
          PYTHONIOENCODING: "UTF-8",
          TMP_PATH: this.config.get('TMP_PATH')
        }
      });

      pythonProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        console.log('STDOUT:', message);
      });

      pythonProcess.stderr.on('data', async (data) => {
        console.error('STDERR:', data.toString());
        resulttype = this.handleData(resulttype, data, identifier, nMasterid, this.utility);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          resolve(false);
          // reject(new Error(`Python process exited with code ${code}`));
        }
      });

      pythonProcess.on('error', (error) => {
        resolve(false);
        // reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

}