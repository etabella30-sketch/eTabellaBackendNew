import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  __async,
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/services/factsheet/factsheet.service.ts
var FactsheetService = class _FactsheetService {
  constructor(http) {
    this.http = http;
    this.cloudUrl = `${environment.cloudUrl2}${environment.realtimeserive}`;
    this.baseUrl = `${this.cloudUrl}/factsheet`;
  }
  buildParams(nFSid) {
    return new HttpParams().set("nFSid", nFSid);
  }
  /** GET /factsheet/detail?nFSid=... */
  getFactDetail(nFSid) {
    return __async(this, null, function* () {
      const params = this.buildParams(nFSid);
      try {
        const res = yield firstValueFrom(this.http.get(`${this.baseUrl}/detail`, { params }));
        if (res?.msg === -1)
          return null;
        return res;
      } catch {
        return null;
      }
    });
  }
  /** GET /factsheet/issues?nFSid=... */
  getFactShared(nFSid) {
    return __async(this, null, function* () {
      const params = this.buildParams(nFSid);
      try {
        const res = yield firstValueFrom(this.http.get(`${this.baseUrl}/shared`, { params }));
        if (res?.msg === -1)
          return null;
        return res;
      } catch {
        return null;
      }
    });
  }
  /** GET /factsheet/issues?nFSid=... */
  getFactIssues(nFSid) {
    return __async(this, null, function* () {
      const params = this.buildParams(nFSid);
      try {
        const res = yield firstValueFrom(this.http.get(`${this.baseUrl}/issues`, { params }));
        if (res?.msg === -1)
          return null;
        return res;
      } catch {
        return null;
      }
    });
  }
  /** GET /factsheet/contacts?nFSid=... */
  getFactContacts(nFSid) {
    return __async(this, null, function* () {
      const params = this.buildParams(nFSid);
      try {
        const res = yield firstValueFrom(this.http.get(`${this.baseUrl}/contacts`, { params }));
        if (res?.msg === -1)
          return null;
        return res;
      } catch {
        return null;
      }
    });
  }
  /** GET /factsheet/tasks?nFSid=... */
  getFactTasks(nFSid) {
    return __async(this, null, function* () {
      const params = this.buildParams(nFSid);
      try {
        const res = yield firstValueFrom(this.http.get(`${this.baseUrl}/tasks`, { params }));
        if (res?.msg === -1)
          return null;
        return res;
      } catch {
        return null;
      }
    });
  }
  /** GET /factsheet/tasks?nFSid=... */
  getFactLinks(nFSid) {
    return __async(this, null, function* () {
      const params = this.buildParams(nFSid);
      try {
        const res = yield firstValueFrom(this.http.get(`${this.baseUrl}/links`, { params }));
        if (res?.msg === -1)
          return null;
        return res;
      } catch {
        return null;
      }
    });
  }
  saveFact(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.baseUrl}/save`, mdl));
        return res;
      } catch (err) {
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  unshare(nFSid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.baseUrl}/unshare`, { nFSid }));
        return res;
      } catch (err) {
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  delete(nFSid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.baseUrl}/delete`, { nFSid }));
        return res;
      } catch (err) {
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  static {
    this.\u0275fac = function FactsheetService_Factory(t) {
      return new (t || _FactsheetService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FactsheetService, factory: _FactsheetService.\u0275fac, providedIn: "root" });
  }
};

export {
  FactsheetService
};
//# sourceMappingURL=chunk-BQHPVQEY.js.map
