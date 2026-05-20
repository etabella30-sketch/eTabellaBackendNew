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

// src/app/shared/services/issues/issue.service.ts
var IssueService = class _IssueService {
  constructor(http) {
    this.http = http;
  }
  fetchIssueList(nCaseid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/common/getissuelist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function IssueService_Factory(t) {
      return new (t || _IssueService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _IssueService, factory: _IssueService.\u0275fac, providedIn: "root" });
  }
};

export {
  IssueService
};
//# sourceMappingURL=chunk-ZD7ZVGXK.js.map
