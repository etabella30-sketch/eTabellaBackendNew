import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { SessionService } from '../../session/session.service';
import { ParseCommandService } from '../parse-command/parse-command.service';
import { TcpService } from '../../tcp/tcp.service';

@Injectable()
export class FeedStartService {
  totalChunks: number = 0;
  constructor(private config: ConfigService, private tcp: TcpService, private readonly session: SessionService, private CommandParserService: ParseCommandService) {

  }
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async startFeed(body: any) {

    try {
      const { file, batch } = body;
      const chunks = await this.readLawFile(file, batch)
      let sesid = this.session.getCurrentSession();
      this.session.protocol = this.session.getCurrentSessionProtocol(sesid);
      this.session.CurrentJob = this.session.reInitVariables();
      this.session.checkForSessionChange(sesid);
      if (chunks.length) {
        console.log('Emiting');
        // this.CommandParserService.splitMultipleCmds()
        for (let x of chunks) {
          await this.delay(body.nDelay); // Delay of 200ms

          const chunk = Buffer.from(x, 'hex')
          this.CommandParserService.splitCommands(chunk, this.session.currentSessionid, this.session.CurrentJob, this.tcp.sessions);
        }
        
      }
    } catch (error) {
    }
    return { msg: 1 }
  }

  async readLawFile(file, batch): Promise<any[]> {
    return new Promise((resolve) => {
      const array = [];
      try {

        const lawFilePath = `${this.config.get<string>('ASSETS')}law/${file}`;
        fs.readFile(lawFilePath, async (err, data) => {
          if (err) {
            console.error('Error reading file:', err);
            return [];
          }
          this.totalChunks = data.length;
          console.log('data length:', data.length);
          // Loop through each byte and convert it to hex
          // for (let i = 0; i < data.length; i++) {
          //   const byte = data[i].toString(16).padStart(2, '0'); // Convert byte to hex string
          //   array.push(byte); // Push each hex value directly into chunks
          // }


          let currentGroup = '';


          for (let i = 0; i < data.length; i++) {
            const byte = data[i].toString(16).padStart(2, '0'); // Convert byte to hex string
            currentGroup += byte;

            // If we have 16 characters (8 hex values), push to chunks
            if (currentGroup.length === batch) {
              array.push(currentGroup);
              currentGroup = ''; // Reset the group
            }
          }

          // Push the remaining group if there are leftover bytes
          if (currentGroup.length > 0) {
            array.push(currentGroup);
          }

          console.log('Bytes', array.length)
          resolve(array);
        });
      } catch (error) {
        console.log(error);
      }

    })
  }


}
