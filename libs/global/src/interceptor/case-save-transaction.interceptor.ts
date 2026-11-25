import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { from, lastValueFrom, mergeMap, Observable } from 'rxjs';
import { DbService } from '../db/pg/db.service';
import { callerOf, isUuidText } from '@app/api-kernel';
import { failedSaveRow } from '../db/pg/save-transaction';
import { savePrivateGroup } from '../db/pg/private-group-save';
import { auditQfactWorksheetSave, guardQfactWorksheetSave, qfactWorksheetDetail } from '../db/pg/qfact-worksheet-save';
import { KafkaGlobalService } from '../utility/kafka/kafka.shared.service';

/** These routes compose one user save from multiple SP writes. Keep its mode
 * lock until every stage has succeeded, including a Full Fact's share list. */
export const CASE_SAVE_ROUTE = /\/(?:fact\/(?:insert(?:quick)?fact(?:\/v2)?|factupdate|quickfactupdate)|task\/taskBuilder(?:\/v2)?|factsheet\/save|doclink\/insertdoc|individual\/locationshare\/sharetousers|bundles-creations\/sharesectionbundle|comments\/(?:add|manage))\/?$/i;

/** Only these routes' DTOs declare jPrivateGroupids / nPrivateGroupid (coreapi InsertFact, InsertFactV2, InsertQuickFact,
 * InsertQuickFactV2; realtime-server quickfactUpdate, InsertQuickFact, InsertFact, InsertFactGlobalV2; FactsheetSaveBody).
 * On every other case-save route the group keys are ignored as if absent. */
export const PRIVATE_GROUP_SAVE_ROUTE = /\/(?:fact\/(?:insert(?:quick)?fact(?:\/v2)?|quickfactupdate)|factsheet\/save)\/?$/i;

@Injectable()
export class CaseSaveTransactionInterceptor implements NestInterceptor {
  constructor(private readonly modules: ModuleRef) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method: string; path?: string; url?: string; body?: Record<string, unknown>; headers?: Record<string, string | string[] | undefined> }>();
    if (request.method === 'GET' && /\/factsheet\/detail\/?$/.test((request.path ?? request.url ?? '').split('?')[0])) {
      const db = this.modules.get(DbService, { strict: false });
      return next.handle().pipe(mergeMap(result => qfactWorksheetDetail(db, callerOf(request)?.userId, result)));
    }
    if (request.method !== 'POST' || !CASE_SAVE_ROUTE.test((request.path ?? request.url ?? '').split('?')[0])) return next.handle();
    const db = this.modules.get(DbService, { strict: false });
    return from(db.saveAtomically(async () => {
      const worksheet = request.headers?.['x-qfact-worksheet'];
      if (worksheet && (worksheet !== '1' || !/\/fact\/quickfactupdate\/?$/i.test((request.path ?? request.url ?? '').split('?')[0]))) throw new Error('Invalid worksheet save route');
      const audit = worksheet && request.body ? await guardQfactWorksheetSave(db, callerOf(request)?.userId, request.body) : null;
      const result = await lastValueFrom(next.handle());
      if (audit && !failedSaveRow(result)) {
        await auditQfactWorksheetSave(db, audit);
        const confirmed = Array.isArray(result) ? result.flat(Infinity).find(row => row && Number(row.msg) === 1) : result;
        if (!confirmed || Number(confirmed.msg) !== 1) throw new Error('Worksheet save was not acknowledged');
        confirmed.worksheetVerified = true;
      }
      if (request.body && PRIVATE_GROUP_SAVE_ROUTE.test((request.path ?? request.url ?? '').split('?')[0]) && (Object.prototype.hasOwnProperty.call(request.body, 'nPrivateGroupid') || Object.prototype.hasOwnProperty.call(request.body, 'jPrivateGroupids')) && !failedSaveRow(result)) {
        const actor = callerOf(request)?.userId;
        await savePrivateGroup(db, actor, request.body, result);
        // KafkaGlobalService queues inside saveAtomically and publishes only
        // after COMMIT. No case, Fact, group name or membership crosses the wire.
        if (isUuidText(actor)) {
          try {
            const kafka = this.modules.get(KafkaGlobalService, { strict: false });
            if (typeof kafka?.sendMessage === 'function') await kafka.sendMessage('private-groups-changed', { userId: actor });
          } catch { /* Do not fail the save; reconnect and periodic refetch recover missed notices. */ }
        }
      }
      return result;
    }));
  }
}
