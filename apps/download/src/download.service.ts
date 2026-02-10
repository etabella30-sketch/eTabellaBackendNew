import { Injectable } from '@nestjs/common';

@Injectable()
export class DownloadService {
  getHello(): string {
    return 'Hello World!';
  }
}
