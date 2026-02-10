import { Injectable } from '@nestjs/common';
import { filecopyService } from '../filecopy/filecopy.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class HelpcenterService {
  helpcenterPath: string = '';
  ticketPath: string = '';

  constructor(
    private fileService: filecopyService,
    private config: ConfigService,
  ) {
    this.helpcenterPath = this.config.get<string>('HELPCENTER_FILE_PATH');
    this.ticketPath = this.config.get<string>('TICKET_FILE_PATH');
  }

  async uploadImage(file: Express.Multer.File, body: any) {
    try {
      if (!file) {
        return { msg: -1, error: 'File not uploaded' };
      }

      const inputFilePath = path.join(file.destination, file.filename); // Ensure the path is correct

      const fileName = path.parse(inputFilePath).base;

      const s3Path = `${this.helpcenterPath}${body.rootPath}/${fileName}`;

      console.log('Processing file:', s3Path);

      await this.fileService.copyFile(s3Path, 'C');
      return { msg: 1, value: fileName };
    } catch (error) {
      return { msg: -1, error: error.message };
    }
  }


  async uploadTicketImage(file: Express.Multer.File, body: any) {
    try {
      if (!file) {
        return { msg: -1, error: 'File not uploaded' };
      }

      const inputFilePath = path.join(file.destination, file.filename); // Ensure the path is correct

      const fileName = path.parse(inputFilePath).base;

      const s3Path = `${this.ticketPath}${fileName}`;

      console.log('Processing file:', s3Path);

      await this.fileService.copyFile(s3Path, 'C');
      return { msg: 1, value: fileName };
    } catch (error) {
      return { msg: -1, error: error.message };
    }
  }
}
