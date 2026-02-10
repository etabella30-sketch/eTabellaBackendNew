import {
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

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const caseId = req.body.caseid; // Retrieve caseid from the request body
          const uploadPath = `./assets/doc/case${caseId}`;
          // Ensure the directory exists
          mkdirp.sync(uploadPath);
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const customName = req.body.filename || file.originalname; // Use provided filename or fallback to original
          const fileExtension = extname(file.originalname);
          callback(null, `${customName}${fileExtension?.toUpperCase()}`); // Save with custom name
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype === 'text/plain') {
          callback(null, true);
        } else {
          callback(new Error('Unsupported file type. Only .txt files are allowed.'), false);
        }
      },
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
        filename: (req, file, callback) => {
          console.log('file', req.body, file);
          const customName = req.body.filename || file.originalname; // Use provided filename or fallback to original
          const fileExtension = extname(file.originalname);
          callback(null, `${customName}${fileExtension?.toUpperCase()}`); // Save with custom name
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype === 'text/plain') {
          callback(null, true);
        } else {
          callback(new Error('Unsupported file type. Only .txt files are allowed.'), false);
        }
      },
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
