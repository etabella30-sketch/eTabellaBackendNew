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

// src/app/shared/services/casedetail/casedetail.service.ts
var CasedetailService = class _CasedetailService {
  constructor(http) {
    this.http = http;
  }
  getCaseInfo(nCaseid) {
    return __async(this, null, function* () {
      if (this.CaseDetail && this.CaseDetail.nCaseid && this.CaseDetail.nCaseid == nCaseid) {
        return this.CaseDetail;
      } else {
        try {
          var params = new HttpParams().set("nCaseid", nCaseid);
          const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/case/caseinfo`, { params }));
          this.CaseDetail = res[0];
          return res;
        } catch (err) {
          return {};
        }
      }
    });
  }
  resetState() {
    this.CaseDetail = null;
  }
  static {
    this.\u0275fac = function CasedetailService_Factory(t) {
      return new (t || _CasedetailService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CasedetailService, factory: _CasedetailService.\u0275fac, providedIn: "root" });
  }
};

export {
  CasedetailService
};
//# sourceMappingURL=chunk-XYPEOTVH.js.map
