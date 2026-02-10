import { DbService } from '@app/global/db/pg/db.service';
import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import async from 'async';
import { notificationReq, notificationRes } from '../../interfaces/notification.interface';
import { Server } from 'socket.io';

const serviceAccount = require('../../../../../etabella-firebase.json');
@Injectable()
export class NotificationService {
  private readonly queue;
  private server: Server;
  public setServer(server: Server) {
    this.server = server;
  }

  constructor(private db: DbService) {
    try {
      // @Inject('WEB_SOCKET_SERVER') private ios: Server,
      console.log('\n\r\n\rFIrebase Service Initiated', serviceAccount)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: "https://etabella-fcm.firebaseio.com"
      });
    } catch (error) {
    }

    this.queue = async.queue(async (task, callback) => {
      await task();
      callback();
    }, 1);

    this.queue.drain(() => {
      // console.warn("\n All tasks have been processed", new Date());
    });
  }


  emit(x: notificationReq) {
    debugger;
    this.queue.push(async () => {
      await this.sendNotification(x);
    });
  }


  async sendNotification(x: notificationReq): Promise<boolean> {
    try {

      try {
        this.server.to(`U${x.nUserid}`).emit("user-notification", { ...x });
      } catch (error) {
      }
      const res = await this.notification(x.cTitle, x.cMsg, x.cToken, x.nCaseid, x.action, x.nPresentid, x.cType);
      x.cStatus = res.msg == 1 ? 'C' : 'F';
      await this.insertNotifacation(x);
    } catch (error) {
    }
    return true;
  }

  async insertNotifacation(x: notificationReq): Promise<any> {
    try {
      let res = await this.db.executeRef('notification_insert', { nUserid: x.nUserid, cTitle: x.cTitle, cMsg: x.cMsg, cStatus: x.cStatus, nFSid: x.nFSid, nDocid: x.nDocid, nWebid: x.nWebid, nBundledetailid: x.nBundledetailid, cType: x.cType, nCaseid: x.nCaseid, nUPid: x.nUPid, nRefuserid: x.nRefuserid, nPresentid: x.nPresentid });
      if (res.success) {
        return res.data[0][0];
      } else {
        return { msg: -1, value: 'Failed to fetch', error: res.error }
      }
    } catch (error) {
      return { msg: -1, value: 'Failed to fetch' }
    }
  }


  async notification(title: string, message: string, tokenkey: string, nCaseid: string, action?: string, nPresentid?: string, cType?: string): Promise<notificationRes> {
    console.log('Notification to ', title, message, tokenkey, action, nCaseid);
    if (!tokenkey) {
      return { msg: -1, res: 'Token not found' };
    }
    const strMap = (o: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(o)
          .filter(([, v]) => v !== undefined && v !== null) // drop undefined/null
          .map(([k, v]) => [k, typeof v === 'string' ? v : String(v)]) // force strings
      ) as Record<string, string>;

    const messagePayload: admin.messaging.Message = {
      notification: {
        title: title,
        body: message,
      },
      token: tokenkey,
      android: {
        priority: "high",
        ttl: 60 * 60 * 24 * 1000, // 1 day in milliseconds
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      data: strMap({
        link: action ?? 'https://etabella.tech',
        nCaseid,       // could be number -> becomes "123"
        nPresentid,    // undefined? dropped
        cType,         // undefined? dropped
      })
    };

    //  {
    //     link: action || 'https://etabella.tech', // Use data payload for custom fields
    //     nCaseid: nCaseid,
    //     nPresentid: nPresentid,
    //     cType: cType
    //   },

    try {
      console.log('\n\r\n\rNOTIFICATION SEND', message, tokenkey);
      const response = await admin.messaging().send(messagePayload);
      console.log("Successfully sent message:", response);
      return { msg: 1, res: response };
    } catch (error) {
      console.error("Error sending message:", error);
      return { msg: -1, res: error };
    }
  }


}