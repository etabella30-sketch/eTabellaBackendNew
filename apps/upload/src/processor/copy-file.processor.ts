import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { filecopyService } from '../services/filecopy/filecopy.service';


@Processor('filecopy-process')
export class FileCopyProcessor {

  constructor(private readonly fileService: filecopyService) { }

  @Process({ concurrency: 2 })
  async handleCopyFile(job: Job) {


    const { cPath, converttype, nBundledetailid, nUPid } = job.data;
    const copied = await this.fileService.copyFile(cPath, converttype, null, nBundledetailid, null, null, null, nUPid);
    if (copied !== true) throw new Error('File storage copy failed');

  }

  @Process({ name: 'document-notification', concurrency: 2 })
  async handleDocumentNotification(job: Job) {
    const { documentId, uploadId, path } = job.data;
    await this.fileService.publishDocumentUploaded(documentId, uploadId, path);
  }



}
