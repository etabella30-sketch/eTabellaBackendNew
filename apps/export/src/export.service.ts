import { Inject, Injectable } from '@nestjs/common';
// import { ClientKafka } from '@nestjs/microservices';
import { DownloadpathReq } from './inerfaces/export.interface';
const path = require('path');
import * as fs from 'fs';
const FILEPATH = './assets';

@Injectable()
export class ExportService {
  constructor(
    // @Inject('KAFKA_SERVICE') private readonly clientKafka: ClientKafka

  ) { }

  async onModuleInit() {
    // await this.clientKafka.connect();
  }
  getHello(): string {
    return 'Hello World!';
  }



  async downloadFile(query: DownloadpathReq, res: any) {
    try {
      const fileuri: string = query.cPath;
      const filename: any = query.cFilename ? query.cFilename : query.cPath;
      console.log('fileuri', fileuri);

      const filePath = path.join(FILEPATH, fileuri);

      // Check if the file exists before attempting to download
      if (!fs.existsSync(filePath)) {
        return res.status(404).send({
          message: 'File not found.',
        });
      }

      // Set headers before sending the file
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filename)}`);

      // Use createReadStream to pipe the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Handle errors during file streaming
      fileStream.on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).send({
            message: 'Could not download the file. ' + err,
          });
        }
      });

    } catch (err) {
      if (!res.headersSent) {
        res.status(500).send({
          message: 'Could not download the file. ' + err,
        });
      }
    }
  }

}
