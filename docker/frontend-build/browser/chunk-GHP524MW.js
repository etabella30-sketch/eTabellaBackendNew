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

// src/app/shared/services/common/common.service.ts
var CommonService = class _CommonService {
  constructor(http) {
    this.http = http;
  }
  getCode(nId) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCategoryid", nId);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/common/getcode`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getMyTeamUsers(nCaseid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/common/myteamusers`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getcolorid(data) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("jIids", JSON.stringify(data));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/common/getcolorid`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  get_dts(sdt, endt) {
    try {
      var day_count = sdt.getDate() - endt.getDate();
      var crnt_count = sdt.getDate() - (/* @__PURE__ */ new Date()).getDate();
      var pg = crnt_count / day_count * 100;
      pg = pg > 0 ? pg.toFixed(0) : 0;
    } catch (error) {
    }
    return pg;
  }
  downloadFile(filePath) {
    return this.http.get(filePath, { responseType: "blob" });
  }
  static {
    this.\u0275fac = function CommonService_Factory(t) {
      return new (t || _CommonService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CommonService, factory: _CommonService.\u0275fac, providedIn: "root" });
  }
};

export {
  CommonService
};
//# sourceMappingURL=chunk-GHP524MW.js.map
