import { Injectable } from '@nestjs/common';

@Injectable()
export class PresentationService {
  getHello(): string {
    return 'Hello World! ';
  }
}
