import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { from, lastValueFrom, Observable } from 'rxjs';
import { DbService } from '../db/pg/db.service';
import { callerOf } from '@app/api-kernel';
import { failedSaveRow } from '../db/pg/save-transaction';
import { savePrivateGroup } from '../db/pg/private-group-save';

/** These routes compose one user save from multiple SP writes. Keep its mode
 * lock until every stage has succeeded, including a Full Fact's share list. */
export const CASE_SAVE_ROUTE = /\/(?:fact\/(?:insert(?:quick)?fact(?:\/v2)?|factupdate|quickfactupdate)|task\/taskBuilder(?:\/v2)?|factsheet\/save|doclink\/insertdoc|individual\/locationshare\/sharetousers|bundles-creations\/sharesectionbundle|comments\/(?:add|manage))\/?$/i;

@Injectable()
export class CaseSaveTransactionInterceptor implements NestInterceptor {
  constructor(private readonly modules: ModuleRef) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method: string; path?: string; url?: string; body?: Record<string, unknown> }>();
    if (request.method !== 'POST' || !CASE_SAVE_ROUTE.test((request.path ?? request.url ?? '').split('?')[0])) return next.handle();
    const db = this.modules.get(DbService, { strict: false });
    return from(db.saveAtomically(async () => {
      const result = await lastValueFrom(next.handle());
      if (request.body && Object.prototype.hasOwnProperty.call(request.body, 'nPrivateGroupid') && !failedSaveRow(result)) {
        await savePrivateGroup(db, callerOf(request)?.userId, request.body, result);
      }
      return result;
    }));
  }
}
