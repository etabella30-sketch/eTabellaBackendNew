import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProfileService } from '../../services/profile/profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PROFILE_IMAGE_EXTENSIONS, imageDestination, imageFilename } from '../../utility/upload-paths';

@ApiBearerAuth('JWT')
@ApiTags('update')
@Controller('profile')
export class ProfileController {

  constructor(private readonly profileService: ProfileService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file',  {
    storage: diskStorage({
        // `<ASSETS><USER_PROFILE_PATH><rootPath>`: rootPath must be one plain segment ('users',
        // 'contacts'); the stored name is `user<timestamp><ext>`, ext one of jpg/jpeg/png/webp.
        destination: imageDestination(() => `${process.env.ASSETS}${process.env.USER_PROFILE_PATH}`, true, PROFILE_IMAGE_EXTENSIONS),
        filename: imageFilename('user', PROFILE_IMAGE_EXTENSIONS),
    })
    }))

    async uploadImage(@UploadedFile() file: Express.Multer.File, @Body() body: any): Promise<any> {
      return await this.profileService.uploadImage(file, body);
  }

}
