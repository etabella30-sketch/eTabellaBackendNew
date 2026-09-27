import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { isUuid } from '../utility/safe-path';

@Injectable()
export class FileproviderService {
  pathToTranscript: string = this.config.get('ASSETS');
  constructor(private config: ConfigService) {

  }
  provideFile(query: any, res: Response) {
    console.log('\n\rDownloadFileToLocal', query);
    // nSesid is joined into the file path, so only a UUID is accepted.
    if (!isUuid(query?.nSesid)) {
      return res.status(400).json({ msg: -1, value: 'Invalid session id' });
    }
    const filename = `s_${query.nSesid}.json`;
    const filePath = join(this.pathToTranscript, 'realtime-transcripts',  filename);

    // Check if the file exists 
    console.log('\n\r\n\r\n\r\n\r\n\rFile path:', filePath);
    if (!existsSync(filePath)) {
      return res.status(404).json({ msg: -1, value: 'File not found' }); // Return -1 if file not found
    }
    const fileStream = createReadStream(filePath);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    fileStream.pipe(res);
  }
}
