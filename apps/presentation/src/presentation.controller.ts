import { Controller, Get } from '@nestjs/common';
import { PresentationService } from './presentation.service';

@Controller()
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Get()
  getHello(): string {
    return this.presentationService.getHello();
  }
}
