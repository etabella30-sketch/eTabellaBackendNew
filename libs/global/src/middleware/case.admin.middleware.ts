import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CASE_ADMIN_ROLE_ID } from '@app/permissions';
import { DbService } from '../db/pg/db.service';

/** RoleMaster id of the per-case "Case Admin" role: defined once in @app/permissions, re-exported for today's importers. */
export { CASE_ADMIN_ROLE_ID };

/** True when nUserid holds the Case Admin role in nCaseid; false on a missing id or a DB error. */
export async function isCaseAdmin(db: DbService, nCaseid: string, nUserid: string): Promise<boolean> {
  if (!nCaseid || !nUserid) return false;
  const lng: any = await db.rowQuery(
    `SELECT 1 FROM "TeamRelation" where "nCaseid" = $1 and "nUserid" = $2 and "nRoleid" = $3`,
    [nCaseid, nUserid, CASE_ADMIN_ROLE_ID],
  );
  return !!(lng?.success && lng?.data?.length);
}

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
    if (!isAdmin && !(await isCaseAdmin(this.db, nCaseid, nMasterid))) {
      return res.status(403).json({ message: 'Case Admin rights required' });
    }
    next();
  }
}