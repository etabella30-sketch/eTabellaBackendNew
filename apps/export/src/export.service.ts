import { Inject, Injectable } from '@nestjs/common';
// import { ClientKafka } from '@nestjs/microservices';
import { DownloadpathReq } from './inerfaces/export.interface';
const path = require('path');
import * as fs from 'fs';
const FILEPATH = './assets';
/** Absolute, normalized root that every served file MUST stay under (SEC2). */
const FILEROOT = path.resolve(FILEPATH);

/**
 * Resolve a client-supplied relative path against the assets root and REFUSE
 * anything that escapes it (SEC2 — the old code did `path.join(FILEPATH,
 * cPath)` with no check, so `cPath=../../etc/passwd` read arbitrary files).
 * Returns the safe absolute path, or null if the input tries to break out.
 */
function safeResolveUnderAssets(rel: string | undefined): string | null {
  if (!rel || typeof rel !== 'string') return null;
  // Reject NUL and absolute inputs outright; normalize collapses `..` runs.
  if (rel.indexOf('\0') !== -1 || path.isAbsolute(rel)) return null;
  const resolved = path.resolve(FILEROOT, rel);
  if (resolved !== FILEROOT && !resolved.startsWith(FILEROOT + path.sep)) return null;
  return resolved;
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

      // SEC2: never trust cPath — resolve it under ./assets and reject escapes.
      const filePath = safeResolveUnderAssets(fileuri);
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
