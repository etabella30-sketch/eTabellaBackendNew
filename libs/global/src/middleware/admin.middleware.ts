import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isAdmin = req['isAdmin'];

    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin rights required' });
    }
    next();
  }
}