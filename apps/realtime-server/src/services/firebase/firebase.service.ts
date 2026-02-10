
import { DbService } from '@app/global/db/pg/db.service';
import { SchedulerService } from '@app/global/utility/scheduler/scheduler.service';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Server } from 'socket.io';
// import serviceAccount from './../../../../../etabella-firebase.json'; //

class notificationRes {
  msg: number;
  res: any;
  nNTid: any;
}

const serviceAccount = require('../../../../../etabella-firebase.json');
@Injectable()
export class FirebaseService implements OnApplicationBootstrap {
  private notificationList: any = [];
  constructor(private db: DbService, @Inject('WEB_SOCKET_SERVER') private ios: Server, private schedulerService: SchedulerService) {
    console.log('\n\r\n\rFIrebase Service Initiated', serviceAccount)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: "https://etabella-fcm.firebaseio.com"
    });
  }

  async onApplicationBootstrap() {
    // fetch Pending Notification

    try {
      let res = await this.db.executeRef('realtime_notification_pending', {});
      if (res.data[0].length) {
        // console.log('\n\r\n\rNotification res', res.data[0])
        for (let x of res.data[0]) {
          this.emit(x);
        }
      }

    } catch (error) {

    }

  }

  async emit(x): Promise<void> {

    if (x.isScheduled) {
      this.setSchedular(x);
    } else {
      this.fireNotification(x);
    }

  }

  async setSchedular(mdl) {
    // console.log('Setting schedular', mdl);
    const jobId = this.schedulerService.scheduleTask(mdl.nNTid, mdl.dDate, async () => {
      if (mdl.isRealtime) {
        // try {
        //   this.ios["server"].emit('on-notification', { msg: 1 });

        // } catch (error) {

        // }
      }
      this.fireNotification(mdl);
    });
  }


  async fireNotification(x) {

    let res = await this.sendNotification(x.nNTid, x.title, x.message, x.cToken, x.cAction);
    this.updateNotificationToServer(res);
  }


  async updateNotificationToServer(x) {
    if (x)
      await this.db.executeRef('realtime_notification_status_update', { nNTid: x.nNTid, nMsg: x.msg });

  }


  async sendNotification(nNTid: number, title: string, message: string, tokenkey: string, action?: string): Promise<notificationRes> {
    console.log('Notification to ', title, message, tokenkey, action);
    if (!tokenkey) {
      return { msg: -1, res: 'Token not found', nNTid: nNTid };
    }

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
      data: {
        link: action || 'https://etabella.legal', // Use data payload for custom fields
      },
    };

    try {
      console.log('\n\r\n\rNOTIFICATION SEND', message, tokenkey);
      const response = await admin.messaging().send(messagePayload);
      console.log("Successfully sent message:", response);
      return { msg: 1, res: response, nNTid: nNTid };
    } catch (error) {
      console.error("Error sending message:", error);
      return { msg: -1, res: error, nNTid: nNTid };
    }
    /*  console.log('Notification to ', nNTid, title, message, tokenkey, action);
  
      if (!tokenkey) {
        return { msg: -1, res: 'Token not found', nNTid: nNTid };
      }
      const payload = {
        notification: {
          title: title,
          body: message,
          click_action: action ? action : 'https://etabella.legal',
        }
      };
      const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
      };
      const token = tokenkey;
      if (token) {
        console.log('\n\r\n\rNOTIFICATION SEND', message, tokenkey)
        try {
          const response = await admin.messaging().sendToDevice(token, payload, options);
          if (response.successCount > 0) {
            console.log("Successfully sent message:", response);
            return { msg: 1, res: response, nNTid: nNTid };
          } else {
            console.log("Failed to sent message:", JSON.stringify(response));
            return { msg: -1, res: response, nNTid: nNTid };
          }
        } catch (error) {
          console.log("Error sending message:", error);
          return { msg: -1, res: error, nNTid: nNTid };
        }
      }*/
  }
}