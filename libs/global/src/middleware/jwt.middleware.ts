import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { RedisDbService } from '../db/redis-db/redis-db.service';
import { ConfigService } from '@nestjs/config';
import { DbService } from '../db/pg/db.service';
@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private rds: RedisDbService, private config: ConfigService,
    private db: DbService
  ) {
  }
  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1]; // Assumes "Bearer <token>"

    if (!token) {
      return res.status(403).json({ message: 'A token is required for authentication' });
    }
    let decoded: any
    try {
      decoded = jwt.verify(token, this.config.get('JWT_SECRET'));
      // req['nMasterid'] = decoded;
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
        req.body.nMasterid = decoded.userId;
      } else if (req.method === 'GET') {
        req.query.nMasterid = decoded.userId;
      }

    } catch (err) {
      if (err && err.name == 'TokenExpiredError') {
        try {
          let origin = this.config.get('ORIGIN');
          let jOther = { O: origin };
          decoded = jwt.decode(token);
          let mdl = {
            "nLCatid": 4, "nMasterid": decoded.userId, cRemark: `${err?.message} at ${err?.expiredAt}`, "cType": 'O',
            "jData": jOther
          }
          await this.db.executeRef('log_insert', mdl);
          this.rds.deleteValue(`user/${decoded.userId}`);
        } catch (error) {
          console.log(`User logout ${error}`);
        }
      } else {
        try {
          let origin = this.config.get('ORIGIN');
          let jOther = { O: origin };
          decoded = jwt.decode(token);
          let log_data = { "nLCatid": 4, "nMasterid": decoded.userId, cRemark: err && err.message ? err.message : `${JSON.stringify(err).substring(0, 200)}`, "cType": 'O', "jData": jOther }
          await this.db.executeRef('log_insert', log_data);
          this.rds.deleteValue(`user/${decoded.userId}`);
        } catch (error) {
          console.log(`User logout ${error}`);
          // this.logservice.info(`User logout ${error}`, this.logApp)
        }
      }
      return res.status(401).json({ message: 'Invalid Token' });
    }

    try {
      let dataUSR = await this.rds.getValue(`user/${decoded.userId}`);
      let objs = JSON.parse(dataUSR);
      if (objs.id != decoded.broweserId) {
        let origin = this.config.get('ORIGIN');
        let jOther = { O: origin };
        let log_data = { "nLCatid": 3, "nMasterid": decoded.userId, cRemark: 'Browser id not Match', "cType": 'O', "jData": jOther }
        await this.db.executeRef('log_insert', log_data);
        return res.status(401).json({ message: 'Old Token' });
      }
      // Attach isAdmin directly to the request object
      req['isAdmin'] = objs.a || false;

    } catch (error) {
      return res.status(401).json({ message: 'Old Token' });
    }
    next();
  }
}
