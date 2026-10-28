import { DbService } from '@app/global/db/pg/db.service';
import { notificationCopy, notificationTarget, notificationUuid } from '@app/global/utility/notifications/notification-message';
import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { notificationReq, notificationRes } from '../../interfaces/notification.interface';
import { Server } from 'socket.io';

const serviceAccount = require('../../../../../etabella-firebase.json');

export const NOTIFICATION_INSERT_SQL = `
WITH permitted AS (
 SELECT public.nt_resolve_target($1::uuid,$14::jsonb,$9::uuid) AS target
), inserted AS (
 INSERT INTO public."Notifications" (
  "nUserid","cTitle","cMsg","dDate","cStatus","nFSid","nDocid","nWebid",
  "nBundledetailid","cType","nCaseid","nUPid","nRefuserid","nPresentid","cEventKey","jTarget"
 ) SELECT $1::uuid,$2,$3,now(),'P',$4::uuid,$5::uuid,$6::uuid,$7::uuid,$8,$9::uuid,
  $10::uuid,$11::uuid,$12::uuid,$13,target FROM permitted WHERE target IS NOT NULL
 ON CONFLICT ("nUserid","cEventKey") WHERE "cEventKey" IS NOT NULL DO NOTHING
 RETURNING "nNTid"
)
SELECT p.target, i."nNTid" FROM permitted p LEFT JOIN inserted i ON true`;

export const NOTIFICATION_DUPLICATE_SQL = `SELECT "nNTid" FROM public."Notifications"
 WHERE "nUserid"=$1::uuid AND "cEventKey"=$2 LIMIT 1`;

@Injectable()
export class NotificationService {
  private queueTail: Promise<unknown> = Promise.resolve();
  private server: Server;
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly db: DbService) {
    try {
      if (!admin.apps.length) admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: 'https://etabella-fcm.firebaseio.com',
      });
    } catch { this.logger.warn('Push notifications are unavailable; the inbox remains enabled'); }
  }

  setServer(server: Server): void { this.server = server; }

  /** A failed database write rejects this promise, so Kafka does not acknowledge an unsaved notice. */
  emit(message: notificationReq): Promise<boolean> {
    const snapshot = JSON.parse(JSON.stringify(message));
    const pending = this.queueTail.then(() => this.sendNotification(snapshot));
    this.queueTail = pending.catch(() => undefined);
    return pending;
  }

  async sendNotification(message: notificationReq): Promise<boolean> {
    message = { ...message, ...notificationCopy(notificationTarget(message), message.cType, message as unknown as Record<string, unknown>) };
    const stored = await this.insertNotifacation(message);
    if (!stored.allowed || !stored.inserted) return true;
    const notice = {
      nNTid: stored.nNTid, nUserid: message.nUserid, cTitle: message.cTitle, cMsg: message.cMsg,
      cType: message.cType, cStatus: 'P', nCaseid: message.nCaseid, nFSid: message.nFSid,
      nDocid: message.nDocid, nWebid: message.nWebid, nBundledetailid: message.nBundledetailid,
      nUPid: message.nUPid, nRefuserid: message.nRefuserid, nPresentid: message.nPresentid,
      cEventKey: message.cEventKey, jTarget: stored.target,
    };
    try { this.server?.to(`U${message.nUserid}`).emit('user-notification', notice); }
    catch { this.logger.warn('A saved notification could not be announced over the socket'); }
    // Delivery failure changes only the push outcome, never the saved/read state.
    let push: notificationRes;
    try { push = await this.notification(message.cTitle, message.cMsg, message.cToken, message.nCaseid, message.action, message.nPresentid, message.cType); }
    catch { push = { msg: -1, res: 'Push unavailable' }; }
    const updated = await this.db.rowQuery(`UPDATE public."Notifications" SET "cStatus"=$3
      WHERE "nNTid"=$1::uuid AND "nUserid"=$2::uuid`, [stored.nNTid, message.nUserid, push.msg === 1 ? 'C' : 'F']);
    if (!updated.success) this.logger.warn('A notification was saved but its push outcome could not be updated');
    return true;
  }

  async insertNotifacation(message: notificationReq): Promise<any> {
    if (!notificationUuid(message.nUserid) || typeof message.cEventKey !== 'string' || !message.cEventKey || message.cEventKey.length > 240) {
      throw new Error('Notification recipient or event key is invalid');
    }
    const id = (value: unknown) => notificationUuid(value) ?? null;
    const target = notificationTarget(message);
    const params = [message.nUserid, message.cTitle, message.cMsg, id(message.nFSid), id(message.nDocid),
      id(message.nWebid), id(message.nBundledetailid), message.cType, id(message.nCaseid),
      id(message.nUPid), id(message.nRefuserid), id(message.nPresentid), message.cEventKey, JSON.stringify(target)];
    const saved = await this.db.rowQuery(NOTIFICATION_INSERT_SQL, params);
    if (!saved.success) throw new Error('Notification persistence is unavailable');
    const row = saved.data?.[0];
    if (!row) throw new Error('Notification persistence returned no result');
    if (!row.target) return { allowed: false, inserted: false };
    if (row.nNTid) return { ...row, allowed: true, inserted: true };
    // A concurrent insert may commit after the INSERT statement's snapshot; the next statement sees it.
    const existing = await this.db.rowQuery(NOTIFICATION_DUPLICATE_SQL, [message.nUserid, message.cEventKey]);
    if (!existing.success || !existing.data?.[0]?.nNTid) throw new Error('Notification deduplication is unavailable');
    return { ...existing.data[0], target: row.target, allowed: true, inserted: false };
  }

  async notification(title: string, message: string, token: string, caseId: string, action?: string, presentationId?: string, type?: string): Promise<notificationRes> {
    if (!token) return { msg: -1, res: 'No push token' };
    const data = Object.fromEntries(Object.entries({ link: action ?? 'https://etabella.tech', nCaseid: caseId, nPresentid: presentationId, cType: type })
      .filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]));
    try {
      const result = await admin.messaging().send({
        token, notification: { title, body: message }, data,
        android: { priority: 'high', ttl: 86400000 },
        apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } },
      });
      return { msg: 1, res: result };
    } catch { return { msg: -1, res: 'Push unavailable' }; }
  }
}
