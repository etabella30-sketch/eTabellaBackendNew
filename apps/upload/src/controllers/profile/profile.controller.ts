import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProfileService } from '../../services/profile/profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@ApiBearerAuth('JWT')
@ApiTags('update')
@Controller('profile')
export class ProfileController {

  constructor(private readonly profileService: ProfileService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file',  {
    storage: diskStorage({
        destination: (req, file, cb) => {
          // const destPath = './assets/users/profile';
          const destPath = process.env.ASSETS + process.env.USER_PROFILE_PATH + req.body?.rootPath;

          console.log('destPath', destPath);
          fs.promises.mkdir(destPath, { recursive: true })
          .then(() => cb(null, destPath))
          .catch(err => cb(err, destPath));
        }, 
        filename: (req, file, cb) => {
          // cb(null, file.originalname);
          const fileExt = path.extname(file.originalname); // Get file extension
        const timestamp = Date.now(); // Get current timestamp
        // const sanitizedFilename = file.originalname
        //   .replace(/\s+/g, '_') // Replace spaces with underscores
        //   .replace(/[^\w.-]/g, ''); // Remove special characters except dot and hyphen
        const uniqueName = `user${timestamp}${fileExt}`; // Append timestamp
        cb(null, uniqueName);
        }
    })
    }))

    async uploadImage(@UploadedFile() file: Express.Multer.File, @Body() body: any): Promise<any> {
      return await this.profileService.uploadImage(file, body);
  }

}
