import { Injectable } from '@nestjs/common';
import { FileValidateResponse } from '../../interfaces/chunk.interface';
import { jobDetail } from '../../interfaces/unzip.interface';
import { filecopyService } from '../filecopy/filecopy.service';
import { LogService } from '@app/global/utility/log/log.service';
import { VerifypdfService } from '../verifypdf/verifypdf.service';
import { ConvertService } from '../convert/convert.service';
import { OcrService } from '../ocr/ocr.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../convert/email/email.service';

@Injectable()
export class MovetoS3Service {

    fTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff', 'zip', 'msg'];
    constructor(private fileService: filecopyService, private readonly fileVerificationService: VerifypdfService,
        private readonly logService: LogService,
        private convertService: ConvertService, private ocrService: OcrService,
        private emailS: EmailService,
        private config: ConfigService) {

    }


    async MovingToS3(jobDetail: jobDetail, converttype: string, item: any, Fpath, nativePath?: string, isNewFile?: boolean): Promise<any> {
        // filecopy-process
        converttype = converttype == 'N' ? null : converttype;



        try {
            let c_status = false;
            if (converttype == 'C' && !this.isPdfFile(item.cSavepath)) {
                console.log('Call convert', item.cSavepath);
                c_status = await this.convert(jobDetail, item);
                if (!c_status) {
                    jobDetail.cStatus = 'CF';
                } else {
                    Fpath = `${this.config.get('ASSETS')}${item.cSavepath}`;
                }
            }


            const verificationResult: FileValidateResponse = await this.fileVerificationService.verifyFile(Fpath, true);
            console.log('Verification complete:', verificationResult);
            jobDetail.verificationResult = verificationResult;
            try {
                this.logService.info(`Verification : ${JSON.stringify(verificationResult)} `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
            } catch (error) {
            }

            item = Object.assign(item, verificationResult)


            if (jobDetail.bIsocr && converttype !='B') { // if PDF
                let ocritem = Object.assign({...item})
                console.log(ocritem)
                ocritem.nBundledetailid = item.nNewBundledetailid ? item.nNewBundledetailid : ocritem.nBundledetailid;
                const status = await this.ocr(jobDetail, ocritem)
                if (!status) {
                    jobDetail.cStatus = 'OF';
                } else {
                    Fpath = `${this.config.get('ASSETS')}${item.cSavepath}`;
                }
            }

            await this.fileService.copyFile(item.cSavepath, converttype, nativePath, item.nBundledetailid, null, null, null, jobDetail.nUPid);

            // if(isNewFile) // insert into db

        } catch (error) {

        }


        return true;
    }




    async convert(jobDetail: jobDetail, item): Promise<boolean> {
        // console.log('Step 1 Convert', item.cSavepath)
        try {
            // console.log('item - ', item, jobDetail);
            let filetype = item.cSavepath.split('.').pop()?.toLowerCase();
            this.convertService.convertLog(jobDetail.nUserid, jobDetail.converttype == 'B' ? null : item.nBundledetailid, jobDetail.nUDid, 'P');
            if (filetype && this.fTypes.includes(filetype)) {
                const newPath = item.cSavepath?.toLowerCase().replace(`.${filetype}`, '.pdf');
                // convertToPdf(inputFile: string, outputFile: string, identifier, nMasterid, cFilename): Promise<boolean> {

                this.logService.info(`Task processed - Convert start ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                const status = await this.convertService.convertToPdf(`${this.config.get('ASSETS')}${item.cSavepath}`, `${this.config.get('ASSETS')}${newPath}`, jobDetail.identifier, jobDetail.nUserid, item.name || item.filename, jobDetail.nUPid, { nBundledetailid: item.nBundledetailid, nUDid: jobDetail.nUDid });
                this.logService.info(`Task processed - Convert end ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} status - ${status}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                if (status) {
                    item.cSavepath = newPath;
                    // this.fileService();
                    let data = Object.assign(item, jobDetail)
                    let isValidUpdate = true;
                    item.nNewBundledetailid = null;
                    this.logService.info(`Task processed - confert update to db  new path ${this.config.get('ASSETS')}${newPath} for ${jobDetail.converttype == 'B' ? null : item.nBundledetailid}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);

                    let res = await this.convertService.filedataProcess(item, data, jobDetail.converttype == 'B' ? null : item.nBundledetailid, `${this.config.get('ASSETS')}${newPath}`, newPath, isValidUpdate)
                    return true;
                } else {
                    return false;
                }
            }
            if ((/\.(msg)$/i.test(item.cSavepath))) {
                const newPath = item.cSavepath?.toLowerCase().replace(`.${filetype}`, '.pdf');
                let data = Object.assign(item, jobDetail);
                this.logService.info(`Task processed - Convert start ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                // const statusE = await this.convertService.convertEmail(jobDetail.nCaseid, item.nBundledetailid, `${this.config.get('ASSETS')}${item.cSavepath}`, `${this.config.get('ASSETS')}${newPath}`, data)

                const dirPath = `/doc/case${jobDetail.nCaseid}`;
                const dataf = { dirPath: dirPath, cPath: `${this.config.get('ASSETS')}${item.cSavepath}`, cOutputpath: `${this.config.get('ASSETS')}${newPath}`, nId: item.nBundledetailid, nCaseid: jobDetail.nCaseid };
                const statusE = await this.emailS.getemailparse(dataf, data.converttype);
                this.logService.info(`Task processed - Convert end ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} status - ${statusE}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                if (statusE) {
                    item.cSavepath = newPath;
                    // this.fileService();
                    let data = Object.assign(item, jobDetail)
                    let isValidUpdate = true;
                    item.nNewBundledetailid = null;
                    this.logService.info(`Task processed - confert update to db  new path ${this.config.get('ASSETS')}${newPath} for ${jobDetail.converttype == 'B' ? null : item.nBundledetailid}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                    let res = await this.convertService.filedataProcess(item, data, jobDetail.converttype == 'B' ? null : item.nBundledetailid, `${this.config.get('ASSETS')}${newPath}`, newPath, isValidUpdate)
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    }



    async ocr(jobDetail: jobDetail, item): Promise<boolean> {
        try {
            console.log('\n\n\n\Call ocr', item.cSavepath);
            if ((/\.(pdf)$/i.test(item.cSavepath))) {
                // await this.ocrToPdf(inputPath, outputPath, job.data.nOcrtype, identifier, nMasterid, cFilename);
                // console.log('\n\n\n\nStart ocr', jobDetail, item);
                let path = item.cSavepath.split('/')
                let newPath = item.cSavepath.replace(path[path.length - 1], 'ocr_' + path[path.length - 1]);
                this.logService.info(`Task processed - ocr start ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} type ${jobDetail.nOcrtype}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                let ocrdata = { identifier: jobDetail.identifier, nMasterid: jobDetail.nUserid, nBundledetailid: item.nBundledetailid, nOcrtype: jobDetail.nOcrtype, cPath: item.cSavepath, nUDid: jobDetail.nUDid }

                this.ocrService.ocrQueue(ocrdata);
                // const status = await this.ocrService.ocrToPdf(`${this.config.get('ASSETS')}${item.cSavepath}`, `${this.config.get('ASSETS')}${newPath}`, jobDetail.nOcrtype, jobDetail.identifier, jobDetail.nUserid, item.name || item.filename, jobDetail.nUPid.toString());
                // this.logService.info(`Task processed - ocr end ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} status - ${status}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                // if (status) {
                // item.cSavepath = newPath;
                // let data = Object.assign(item, jobDetail)
                // this.logService.info(`Task processed - ocr update  new path ${this.config.get('ASSETS')}${newPath} for ${item.nNewBundledetailid ? item.nNewBundledetailid : item.nBundledetailid}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                // this.convertService.filedataProcess(item, data, item.nNewBundledetailid ? item.nNewBundledetailid : item.nBundledetailid, `${this.config.get('ASSETS')}${newPath}`, newPath, true)
                return true;
                // } else {
                //     return false;
                // }
            }
        } catch (error) {

        }
        return
    }



    isPdfFile(path) {
        try {
            return path.split('.').pop().toLowerCase() == 'pdf';
        }
        catch (error) {
            return false;
        }
    }
}
