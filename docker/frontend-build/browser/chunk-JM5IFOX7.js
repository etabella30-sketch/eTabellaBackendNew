import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  BehaviorSubject,
  __async,
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/shared/services/notifications.service.ts
var NotificationsService = class _NotificationsService {
  // isNotification: boolean = false;
  constructor(http) {
    this.http = http;
    this._isNotification = new BehaviorSubject(false);
    this.isNotification$ = this._isNotification.asObservable();
    this._clientNotifications = new BehaviorSubject([]);
    this.clientNotifications$ = this._clientNotifications.asObservable();
  }
  addClientNotification(n) {
    const list = this._clientNotifications.getValue();
    if (n.nNTid && list.some((x) => x.nNTid === n.nNTid))
      return;
    this._clientNotifications.next([n, ...list]);
    this._isNotification.next(true);
  }
  removeClientNotification(nNTid) {
    const list = this._clientNotifications.getValue();
    this._clientNotifications.next(list.filter((x) => x.nNTid !== nNTid));
  }
  clearClientNotifications() {
    this._clientNotifications.next([]);
  }
  getNotifcationList(nCaseid) {
    return __async(this, null, function* () {
      try {
        var params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/case/notifications`, { params }));
        if (res.length && res.filter((e) => !e.bIsseen).length) {
          console.log("isNotification", true);
          this._isNotification.next(true);
        } else {
          this._isNotification.next(false);
        }
        return res;
      } catch (err) {
        return {};
      }
    });
  }
  deleteNotification(nCaseid, nNTid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/case/notification/delete`, { nNTid: nNTid || null, nCaseid }));
        return res;
      } catch (err) {
        return {};
      }
    });
  }
  syncNotifcation(nCaseid) {
    return __async(this, null, function* () {
      try {
        var params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/case/syncnotifications`, { params }));
        this._isNotification.next(false);
        return res;
      } catch (err) {
        return {};
      }
    });
  }
  static {
    this.\u0275fac = function NotificationsService_Factory(t) {
      return new (t || _NotificationsService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _NotificationsService, factory: _NotificationsService.\u0275fac, providedIn: "root" });
  }
};

export {
  NotificationsService
};
//# sourceMappingURL=chunk-JM5IFOX7.js.map
