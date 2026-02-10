import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileproviderService {
  pathToTranscript: string = this.config.get('ASSETS');
  constructor(private config: ConfigService) {

  }
  provideFile(query: any, res: Response) {
    console.log('\n\rDownloadFileToLocal', query);
    const filename = `s_${query.nSesid}.json`;
    const filePath = join(this.pathToTranscript, 'realtime-transcripts',  filename);

    // Check if the file exists 
    console.log('\n\r\n\r\n\r\n\r\n\rFile path:', filePath);
    if (!existsSync(filePath)) {
      return res.status(404).json({ msg: -1, value: 'File not found',filePath }); // Return -1 if file not found
    }
    const fileStream = createReadStream(filePath);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    fileStream.pipe(res);
  }
}
