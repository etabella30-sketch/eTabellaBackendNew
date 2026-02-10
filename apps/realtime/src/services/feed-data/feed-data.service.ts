import { Inject, Injectable, Logger } from '@nestjs/common';
import { SessionService } from '../../session/session.service';
import { feedPage } from '../../interfaces/feed.interface';


@Injectable()
export class FeedDataService {

  private logger = new Logger(FeedDataService.name);
  constructor(private readonly sessionService: SessionService) {
  }

  checkSessionExists(nSesid: string): boolean {
    return nSesid == this.sessionService.currentSessionid;
  }


  sessionTotalPages(nSesid: string): number {
    if(this.sessionService.currentSessionid != nSesid) return 0;
    const feeddata = this.sessionService.CurrentJob?.lineBuffer || []
    const pageDataLength = (this.sessionService.currentSessionLines || 25);
    return Math.ceil(feeddata.length / pageDataLength);
  }



  async getSessionPagesData(nSesid: string, reqPages: number[]): Promise<{ total: number, feed: feedPage[] }> {
    debugger;

    try {
      const feeddata = this.sessionService.CurrentJob?.lineBuffer || []
      const pageDataLength = (this.sessionService.currentSessionLines || 25);

      const totalpages = Math.ceil(feeddata.length / pageDataLength);
      const result = [];
      for (let x of reqPages) {
        const page = Number(x);
        const pageData = this.getPageData(feeddata, page, pageDataLength) || [];
        result.push({ page, data: pageData });
      }


      return { total: totalpages, feed: result };

    } catch (error) {
      this.logger.error(`Error`, error?.message)
      return { total: 0, feed: [] };
    }

/*    for (let i = totalpages; i >= 1; i--) {
      const pageData = this.getPageData(feeddata, i, pageDataLength);
    }
    const feeddata = this.sessionService.CurrentJob?.lineBuffer || []
    const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b))
    if (!pages?.length) return { total: 0, feed: [] };
    const finalPages = pages.filter(a => reqPages.includes(Number(a[0])))
    const result = [];
    for (let x of finalPages) {
      const page = Number(x[0]);
      const data = x[1] || [];
      result.push({ page, data });
    }
    return { total: pages?.length, feed: result };
*/

  }


  getPageData(data, pageNumber, linesPerPage = 25) {
    const startIndex = (pageNumber - 1) * linesPerPage;
    const endIndex = pageNumber * linesPerPage;
    return data.slice(startIndex, endIndex);
  }

}