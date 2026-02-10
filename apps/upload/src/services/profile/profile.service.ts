import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { filecopyService } from '../filecopy/filecopy.service';
import { ConfigService } from '@nestjs/config';

const pipelineAsync = promisify(pipeline);
@Injectable()
export class ProfileService {
  profilePath: string = '';

  supportedExtensions = ['.jpg', '.jpeg', '.png'];

  constructor(
    private fileService: filecopyService,
    private config: ConfigService,
  ) {
    this.profilePath = this.config.get<string>('USER_PROFILE_PATH');
  }
  async uploadImage(file: Express.Multer.File, body: any) {

    try {
      if (!file) {
        return { msg: -1, error: 'File not uploaded' };
      }

      // const inputFilePath = path.resolve(file.path); // Ensure the path is correct
      const inputFilePath = path.join(file.destination, file.filename); // Ensure the path is correct

      const outputFilePath = path.join(
        file.destination,
        `${path.parse(file.filename).name}.webp`,
      );

      console.log('Processing file:', inputFilePath);

      // Supported image extensions that need conversion

      const fileExtension = path.extname(file.originalname).toLowerCase();

      let res;

      if (this.supportedExtensions.includes(fileExtension)) {
        // Otherwise, convert the image
        res = await this.imageConversion(inputFilePath, outputFilePath);
      } else {
        // If the file is already a .webp, skip conversion
        res = { msg: 1, success: true };
      }

      if (res.msg === 1) {

        const fileName = path.parse(outputFilePath).base;

        const s3Path = `${this.profilePath}${body.rootPath}/${fileName}`;

        console.log('s3Path', s3Path);

        await this.fileService.copyFile(s3Path, 'C');
        return { msg: 1, value: fileName };
      } else {
        await this.deleteFile(inputFilePath);
        return { msg: -1, error: res.error };
      }
    } catch (error) {
      return { msg: -1, error: error.message };
    }
  }

  async imageConversion(inputFilePath: string, outputFilePath: string) {
    try {
      if (!fs.existsSync(inputFilePath)) {
        return { msg: -1, error: 'File does not exist' };
      }
      const inputStream = fs.createReadStream(inputFilePath);
      const outputStream = fs.createWriteStream(outputFilePath);

      await pipelineAsync(
        inputStream,
        sharp().resize(500, 500).webp({ quality: 80 }),
        outputStream,
      );

      console.log('Image processed successfully');

      // Delete the original file after conversion
      await this.deleteFile(inputFilePath);

      return { msg: 1, sucess: true };
    } catch (error) {
      return { msg: -1, error: 'File Converions error' };
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          reject(err);
        } else {
          console.log('File deleted successfully:', filePath);
          resolve();
        }
      });
    });
  }
}
