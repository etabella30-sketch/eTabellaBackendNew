import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { get } from 'http';

@Injectable()
export class DownloadfileService {
  livePath = this.config.get('LIVE_SERVER');
  constructor(private config: ConfigService) {

  }

  // async DownloadFileToLocal(body: { nSesid: string; nCaseid: string }): Promise<any> {
  //   console.log('DownloadFileToLocal', body);
  //   const filename = `s_${body.nSesid}.json`;
  //   const downloadsDir = path.join('assets','transcripts');
  //   const localFilePath = path.join(downloadsDir, filename);

  //   // Ensure that the downloads directory exists
  //   if (!fs.existsSync(downloadsDir)) {
  //     fs.mkdirSync(downloadsDir, { recursive: true }); // Create the directory if it does not exist
  //   }

  //   // Construct the URL for the file using the query parameters
  //   const url = `${this.livePath}/session/synctranscriptfile?query[nSesid]=${body.nSesid}&query[nCaseid]=${body.nCaseid}`;
  //   console.log('URL:', url);
  //   try {
  //     // Fetch the file from Service 1
  //     const response = await axios({
  //       url,
  //       method: 'GET',
  //       responseType: 'stream', // Stream to handle large files
  //       validateStatus: function (status) {
  //         return status >= 200 && status < 300 || status === 404; // Accept 404 for custom handling
  //       },
  //     });
  //     console.log(response.status)
  //     // Handle file not found case (-1 returned by Service 1)
  //     if (response.status === 404 ) {
  //       return { msg: -1 } //'-1'; // Return -1 if file was not found on Service 1
  //     }

  //     // Pipe the response data into a local file if the file exists
  //     response.data.pipe(fs.createWriteStream(localFilePath));

  //     return new Promise((resolve, reject) => {
  //       response.data.on('end', () => {
  //         resolve(`File downloaded successfully: ${localFilePath}`);
  //       });

  //       response.data.on('error', (err: Error) => {
  //         reject(`File download failed: ${err.message}`);
  //       });
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     return `Error downloading file: ${err.message}`;
  //   }
  // }
  async DownloadFileToLocal(body: { nSesid: string; nCaseid: string }): Promise<any> {
    console.log('DownloadFileToLocal', body);

    const filename = `s_${body.nSesid}.json`;
    const downloadsDir = path.join('assets', 'transcripts');
    const localFilePath = path.join(downloadsDir, filename);

    // Ensure that the downloads directory exists
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true }); // Create the directory if it does not exist
    }

    const url = `${this.livePath}/session/synctranscriptfile?query[nSesid]=${body.nSesid}&query[nCaseid]=${body.nCaseid}`;
    console.log('URL:', url);

    return new Promise((resolve, reject) => {
      get(url, (res) => {
        const statusCode = res.statusCode as number;  // Explicitly type statusCode as number

        // Check if the request was successful
        if (statusCode !== 200) {
          reject({msg:-1});
          res.resume(); // Consume response to free up memory
          return;
        }

        // // Check for file existence at the server-side
        // if (statusCode === 404) {
        //   reject(new Error('File not found'));
        //   return;
        // }

        // Stream the file to the local file path
        const fileStream = fs.createWriteStream(localFilePath);
        res.pipe(fileStream);

        // Resolve when the file is fully written
        fileStream.on('finish', () => {
          fileStream.close();
          resolve({msg:1});
        });

        // Handle stream errors
        fileStream.on('error', (err) => {
          fs.unlink(localFilePath, () => reject(err)); // Delete the file if error occurs
        });

      }).on('error', (err) => {
        console.error('Error:', err.message);
        reject({msg:-1});
      });
    });
  }

}
