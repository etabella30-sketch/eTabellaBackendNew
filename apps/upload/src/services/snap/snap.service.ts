import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';

@Injectable()
export class SnapService {

  constructor(private readonly config: ConfigService) { }

 async snapPdf(filepath: any, snapPath: any):Promise<any> {
    try {
      const pythonProcess = spawn(this.config.get('pythonV'), [
        this.config.get('PY_SCREENSHOT'),
        filepath,
        snapPath,
      ]);


      pythonProcess.stdout.on('data', (data: Buffer) => {
        console.log('DATA:', data.toString());
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        console.log('ERROR:', data.toString());
        console.error('ERROR:', data.toString());
      });

      return new Promise((resolve, reject) => {
        pythonProcess.on('error', (err) => {
          console.error('ERROR:', err);
          reject(err);
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`Python process exited with code ${code}`);
            resolve(0);
            return;
          }

          resolve(1);
        });
      });
    } catch (error) {
      console.error('ERROR:', error);
      return 0;
    }
  }

}
