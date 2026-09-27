import { Controller, Get, NotFoundException, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { DbService } from '@app/global/db/pg/db.service';
import { AnnotMarks, FeedPageReq, feedTotalPage } from '../../interfaces/feed.interface';
import { FeedService } from '../../feed/feed.service';
import { MarksService } from '../../services/marks/marks.service';
import { callerCanSeeSession } from '../../services/session/session-access-gate';
import type { RealtimeRequest } from '../../middleware/realtime-auth.middleware';


@ApiTags('feed')
@Controller('feed')
export class FeedController {

  constructor(private feed: FeedService, private readonly marksService: MarksService,
    private readonly db: DbService) {

  }

  @Get('annotations')
  async getAnnotations(@Query() query: AnnotMarks): Promise<any> {
    return await this.marksService.getMarks(query);
  }


  /*
   * pages/total and pages/data return a session's feed text, the same content the socket
   * fetch-data event and transcript/annothighlightexport serve, so they apply the same
   * session-membership rule (RSessionDetail assignment, TeamRelation on the session's case, or a
   * global admin). A caller who may not see the session gets the route's normal "no session data"
   * answer rather than a 403: the legacy feed display also runs on /individual/doc and the file
   * explorer, where its interceptor turns a 403 into a redirect to /user/dashboard.
   */
  @Get('pages/total')
  async getTotalPages(@Query() query: feedTotalPage, @Req() req: Request): Promise<{ msg: 1 | -1, total: number, error?: any }> {
    if (!(await callerCanSeeSession(this.db, (req as RealtimeRequest).user, query?.nSesid))) return { msg: -1, total: 0 };
    return await this.feed.getTotalPages(query);
  }

  @Get('pages/data')
  async getList(@Query() query: FeedPageReq, @Req() req: Request): Promise<any> {
    if (!(await callerCanSeeSession(this.db, (req as RealtimeRequest).user, query?.nSesid))) {
      throw new NotFoundException('No session data found');
    }
    return await this.feed.getFeedData(query);
  }

}