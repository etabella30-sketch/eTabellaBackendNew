import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import { isSafeBasename, isUuid } from '../../services/utility/safe-path';

// Uploads land under ./assets, which ServeStatic serves publicly, so the client-supplied caseid and
// filename are path segments that must not climb out, and only .txt files are stored (as .TXT).

/** `./assets/doc/case<caseid>`; caseid must be a UUID. */
export function caseUploadDestination(req: any, file: any, callback: (error: Error | null, destination: string) => void) {
  const caseId = req.body?.caseid;
  if (!isUuid(caseId)) return callback(new BadRequestException('Invalid caseid'), undefined);
  const uploadPath = `./assets/doc/case${caseId}`;
  mkdirp.sync(uploadPath);
  callback(null, uploadPath);
}

/** `<filename or original name><EXT>`; the name must be one plain file-name segment. */
export function uploadFilename(req: any, file: any, callback: (error: Error | null, filename: string) => void) {
  const customName = req.body?.filename || file.originalname; // Use provided filename or fallback to original
  if (!isSafeBasename(customName)) return callback(new BadRequestException('Invalid filename'), undefined);
  const fileExtension = extname(file.originalname);
  callback(null, `${customName}${fileExtension?.toUpperCase()}`); // Save with custom name
}

export function txtOnlyFilter(req: any, file: any, callback: (error: Error | null, acceptFile: boolean) => void) {
  if (file.mimetype === 'text/plain' && extname(file.originalname || '').toLowerCase() === '.txt') {
    callback(null, true);
  } else {
    callback(new Error('Unsupported file type. Only .txt files are allowed.'), false);
  }
}

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: caseUploadDestination,
        filename: uploadFilename,
      }),
      fileFilter: txtOnlyFilter,
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('caseid') caseId: string, // Capture caseid from request body
    @Body('filename') filename: string, // Capture filename from request body
  ) {
    return {
      originalname: file.originalname,
      filename: file.filename,
      path: `assets/doc/case${caseId}/${file.filename}`,
    };
  }
  

  @Post('transcript-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = `./assets/realtime-transcripts`;
          // Ensure the directory exists
          mkdirp.sync(uploadPath);
          callback(null, uploadPath);
        },
        filename: uploadFilename,
      }),
      fileFilter: txtOnlyFilter,
    }),
  )
  uploadTranscriptFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('filename') filename: string, // Capture filename from request body
  ) {
    console.log('file', file, filename);
    return {
      originalname: file.originalname,
      filename: filename,
      path: `${file.filename}`,
    };
  }
}
