import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnnotMarks, FeedPageReq, feedTotalPage } from '../../interfaces/feed.interface';
import { FeedService } from '../../feed/feed.service';
import { MarksService } from '../../services/marks/marks.service';


@ApiTags('feed')
@Controller('feed')
export class FeedController {

  constructor(private feed: FeedService, private readonly marksService: MarksService) {

  }

  @Get('annotations')
  async getAnnotations(@Query() query: AnnotMarks): Promise<any> {
    return await this.marksService.getMarks(query);
  }


  @Get('pages/total')
  async getTotalPages(@Query() query: feedTotalPage): Promise<{ msg: 1 | -1, total: number, error?: any }> {
    return await this.feed.getTotalPages(query);
  }

  @Get('pages/data')
  async getList(@Query() query: FeedPageReq): Promise<any> {
    return await this.feed.getFeedData(query);
  }

}