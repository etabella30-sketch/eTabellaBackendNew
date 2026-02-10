import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HelpcenterService } from '../../services/helpcenter/helpcenter.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@ApiBearerAuth('JWT')
@ApiTags('helpcenterupdate')
@Controller('helpcenter')
export class HelpcenterController {
  constructor(private readonly helpCenterService: HelpcenterService) { }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // const destPath = './assets/users/profile';
          const destPath =
            process.env.ASSETS +
            process.env.HELPCENTER_FILE_PATH +
            req.body?.rootPath;

          console.log('destPath', destPath);
          fs.promises
            .mkdir(destPath, { recursive: true })
            .then(() => cb(null, destPath))
            .catch((err) => cb(err, destPath));
        },
        filename: (req, file, cb) => {
          // cb(null, file.originalname);
          const fileExt = path.extname(file.originalname); // Get file extension
          const timestamp = Date.now(); // Get current timestamp
          const uniqueName = `module${timestamp}${fileExt}`; // Append timestamp
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ): Promise<any> {
    return await this.helpCenterService.uploadImage(file, body);
  }



  @Post('upload-image-ticket')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // const destPath = './assets/users/profile';
          const destPath =
            process.env.ASSETS +
            process.env.TICKET_FILE_PATH
          console.log('destPath', destPath);
          fs.promises
            .mkdir(destPath, { recursive: true })
            .then(() => cb(null, destPath))
            .catch((err) => cb(err, destPath));
        },
        filename: (req, file, cb) => {
          // cb(null, file.originalname);
          const fileExt = path.extname(file.originalname); // Get file extension
          const timestamp = Date.now(); // Get current timestamp
          const uniqueName = `ticket_${timestamp}${fileExt}`; // Append timestamp
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadTicketImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ): Promise<any> {
    return await this.helpCenterService.uploadTicketImage(file, body);
  }
}
