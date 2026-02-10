import { Processor, Process } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import * as fse from 'fs-extra';
import { SnapService } from '../services/snap/snap.service';

@Processor('snap-process')
export class SnapProcessor {
  private snap_path = this.config.get('SCREENSHOT_PATH');
  private ASSETS_PATH = this.config.get('ASSETS');
  constructor(private readonly config: ConfigService, private readonly snapService: SnapService) {
  }


  @Process({ concurrency: 2 })
  async handleSnap(job: Job) {
    const filepath = `${this.ASSETS_PATH}${job.data.cPath || ''}`;
    const snapPath = `${this.snap_path}case${job.data.nCaseid}/${job.data.nBundledetailid}.png`;

    // Ensure the directory exists
    console.log('filepath', filepath);
    console.log('snapPath', snapPath);
    try {
      await fse.ensureDir(`${this.snap_path}case${job.data.nCaseid}`);
      const extnstion = filepath.split('.').pop().toUpperCase();
      if (extnstion === 'PDF') {
        await this.snapService.snapPdf(filepath, snapPath);
      }
    } catch (error) {
    }

  }




}
