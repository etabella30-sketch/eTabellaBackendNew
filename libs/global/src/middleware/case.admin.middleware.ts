import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DbService } from '../db/pg/db.service';

@Injectable()
export class CaseAdminMiddleware implements NestMiddleware {
  body: string[] = ['POST', 'PUT', 'DELETE'];
  query: string[] = ['GET']
  getParams = (req: Request) => {
    if (this.body.includes(req.method))
      return req.body;
    else
      return req.query;

  }
  constructor(private db: DbService) {

  }

  async use(req: Request, res: Response, next: NextFunction) {
    const mdl = this.getParams(req);
    const nCaseid = mdl['nCaseid'], nMasterid = mdl['nMasterid'], isAdmin = req['isAdmin'];
    if (!isAdmin) {
      const lng: any = await this.db.rowQuery(`SELECT 1 FROM "TeamRelation" where "nCaseid" = '${nCaseid}' and "nUserid" = '${nMasterid}' and "nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'`);
      if (!lng?.success || !lng?.data?.length) {
        return res.status(403).json({ message: 'Case Admin rights required' });
      }
    }
    next();
  }
}