import { Controller, Get } from '@nestjs/common';
import { PaginationService } from './pagination.service';

@Controller()
export class PaginationController {
  constructor(private readonly paginationService: PaginationService) { }

  // @Get()
  getHello(): string {
    return this.paginationService.getHello();
  }
}
