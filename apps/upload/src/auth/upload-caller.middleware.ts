import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { ChunksUploadService } from '../services/chunks-upload/chunks-upload.service';
import { ChunkWriteGate, UPLOAD_CALLER, UPLOAD_CHUNK_GATE, UploadCaller, isUuid } from './upload-access';

/**
 * Runs after JwtMiddleware on every upload route and records who the caller is, from the token
 * JwtMiddleware has just accepted (same lookup: the bearer header, else the access_token cookie).
 *
 * JwtMiddleware writes the token user into req.body.nMasterid, but on the multipart routes multer
 * then replaces req.body with the form's fields, so a form field `nMasterid` would name anyone. The
 * services read the caller from here instead (AuthCaller).
 *
 * It also hands multer a chunk gate: the chunk routes' destination callback (upload-paths
 * chunkDestination) calls it with the form's identifier before anything is written, so only the
 * caller who opened that upload with /status can add chunks to it.
 */
@Injectable()
export class UploadCallerMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService, private readonly chunks: ChunksUploadService) { }

  use(req: any, res: any, next: () => void): void {
    const token = req.headers?.authorization?.split(' ')[1] || req.cookies?.access_token;
    let userId: unknown;
    try {
      userId = (jwt.verify(token, this.config.get('JWT_SECRET')) as any)?.userId;
    } catch {
      userId = undefined;
    }
    if (!isUuid(userId)) {
      res.status(401).json({ message: 'Invalid Token' });
      return;
    }
    const caller: UploadCaller = { userId: userId.toLowerCase() };
    const gate: ChunkWriteGate = (identifier: unknown) => this.chunks.assertChunkWriter(caller, identifier);
    req[UPLOAD_CALLER] = caller;
    req[UPLOAD_CHUNK_GATE] = gate;
    next();
  }
}
