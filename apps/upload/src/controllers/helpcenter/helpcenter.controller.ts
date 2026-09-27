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
import { HELP_IMAGE_EXTENSIONS, imageDestination, imageFilename } from '../../utility/upload-paths';

@ApiBearerAuth('JWT')
@ApiTags('helpcenterupdate')
@Controller('helpcenter')
export class HelpcenterController {
  constructor(private readonly helpCenterService: HelpcenterService) { }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        // `<ASSETS><HELPCENTER_FILE_PATH><rootPath>`: rootPath must be one plain segment ('help');
        // the stored name is `module<timestamp><ext>`, ext one of png/jpg/jpeg/gif/webp.
        destination: imageDestination(() => `${process.env.ASSETS}${process.env.HELPCENTER_FILE_PATH}`, true, HELP_IMAGE_EXTENSIONS),
        filename: imageFilename('module', HELP_IMAGE_EXTENSIONS),
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
        // `<ASSETS><TICKET_FILE_PATH>`, no client part; `ticket_<timestamp><ext>`, ext as above.
        destination: imageDestination(() => `${process.env.ASSETS}${process.env.TICKET_FILE_PATH}`, false, HELP_IMAGE_EXTENSIONS),
        filename: imageFilename('ticket_', HELP_IMAGE_EXTENSIONS),
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
