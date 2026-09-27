import { Inject, Injectable } from '@nestjs/common';
// import { ClientKafka } from '@nestjs/microservices';
import { DownloadpathReq } from './inerfaces/export.interface';
import { attachmentDisposition } from 'apps/download/src/utility/content-disposition';
const path = require('path');
import * as fs from 'fs';
const FILEPATH = './assets';

/**
 * The file `rel` names under ./assets, or null when it would leave that folder (`..`, an absolute
 * path, a NUL). ExportController only lets recorded export paths through; this is the second line.
 */
export function resolveUnderAssets(rel: unknown): string | null {
  if (typeof rel !== 'string' || !rel || rel.includes('\0') || path.isAbsolute(rel)) return null;
  const root = path.resolve(FILEPATH);
  const resolved = path.resolve(root, rel);
  return resolved.startsWith(root + path.sep) ? resolved : null;
}

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

      const filePath = resolveUnderAssets(fileuri);
      if (!filePath) {
        return res.status(400).send({ message: 'Invalid file path.' });
      }

      // Check if the file exists before attempting to download
      if (!fs.existsSync(filePath)) {
        return res.status(404).send({
          message: 'File not found.',
        });
      }

      // Set headers before sending the file
      res.setHeader('Content-Type', 'application/octet-stream');
      // cFilename comes from the query: quoted, ASCII-safe, RFC 5987 for other names (a `;` or `"`
      // could add parameters, and a name above U+00FF made Node refuse the header with a 500).
      res.setHeader('Content-Disposition', attachmentDisposition(path.basename(filename)));
      // The download URL is deterministic (cPath is keyed by export id), so a
      // Regenerate overwrites the SAME path — without this a browser/proxy serves the
      // cached OLD bytes and the export "still shows" the previous version. Never cache.
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

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
