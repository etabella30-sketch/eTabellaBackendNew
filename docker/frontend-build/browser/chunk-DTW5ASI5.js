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

// src/app/presentation/services/present-tool/present-tool.service.ts
var PresentToolService = class _PresentToolService {
  constructor(http) {
    this.http = http;
    this.url = environment.presentationservice;
  }
  getPresentInfo(nPresentid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/tool/detail`, { params }));
        res = res[0];
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getPresentUsers(nPresentid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/tool/users`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  managePresentUsers(nPresentid, nUserid, cPermission, cStatus) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        nPresentid,
        nUserid,
        cPermission,
        cStatus: cStatus || "A"
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/tool/manage/user`, obj));
        res[0];
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  manageUserRequest(nPresentid, nUserid, cStatus) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        nPresentid,
        nUserid,
        cStatus: cStatus || "A"
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/tool/manage/request`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  managePresentStatus(nPresentid, cStatus) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        nPresentid,
        cStatus
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/tool/manage/status`, obj));
        res = res[0];
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function PresentToolService_Factory(t) {
      return new (t || _PresentToolService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PresentToolService, factory: _PresentToolService.\u0275fac, providedIn: "root" });
  }
};

export {
  PresentToolService
};
//# sourceMappingURL=chunk-DTW5ASI5.js.map
