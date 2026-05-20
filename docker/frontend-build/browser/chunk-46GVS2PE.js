import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
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

// src/app/adminpanel/services/case-builder/case-builder.service.ts
var CaseBuilderService = class _CaseBuilderService {
  constructor(sStore, http, tost) {
    this.sStore = sStore;
    this.http = http;
    this.tost = tost;
  }
  caseBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/case/casebuilder`, mdl));
        if (res?.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case creation failed ${ErrorHandlerUtil.getErrorMessage(err)}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  getCaseDetail(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/case/casedetail`, { params }));
        return res;
      } catch (err) {
        console.error(`Failed to get case detail: ${ErrorHandlerUtil.getErrorMessage(err)}`);
        return {};
      }
    });
  }
  caseDelete(nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/case/casedelete`, { nCaseid }));
        if (res?.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case delete failed ${ErrorHandlerUtil.getErrorMessage(err)}`, "E");
        return false;
      }
    });
  }
  updateCaseTuples(nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/case-tuple/updates`, { nCaseid }));
        if (res?.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case creation failed ${ErrorHandlerUtil.getErrorMessage(err)}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  static {
    this.\u0275fac = function CaseBuilderService_Factory(t) {
      return new (t || _CaseBuilderService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CaseBuilderService, factory: _CaseBuilderService.\u0275fac, providedIn: "root" });
  }
};

export {
  CaseBuilderService
};
//# sourceMappingURL=chunk-46GVS2PE.js.map
