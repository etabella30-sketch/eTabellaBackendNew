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

// src/app/adminpanel/services/bundle-manage/bundlemanage.service.ts
var BundlemanageService = class _BundlemanageService {
  constructor(http, tost) {
    this.http = http;
    this.tost = tost;
    this.coreServiceUrl = `${environment.cloudUrl}${environment.coreservice}`;
  }
  notifyRequestError(action, err) {
    const message = ErrorHandlerUtil.getErrorMessage(err);
    this.tost.error(message && message !== "Unknown error" ? `${action} failed: ${message}` : `${action} failed`);
  }
  getSections(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        return yield firstValueFrom(this.http.get(`${this.coreServiceUrl}/bundles/sections`, { params }));
      } catch (err) {
        this.notifyRequestError("Get sections", err);
        return [];
      }
    });
  }
  sectionBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.coreServiceUrl}/bundles-creations/sectionbuilder`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, "");
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.notifyRequestError("Section creation", err);
        return false;
      }
    });
  }
  getUserSections(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        return yield firstValueFrom(this.http.get(`${this.coreServiceUrl}/bundles/usersections`, { params }));
      } catch (err) {
        this.notifyRequestError("Get user sections", err);
        return [];
      }
    });
  }
  getUploadSections(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        return yield firstValueFrom(this.http.get(`${this.coreServiceUrl}/bundles/uploadsections`, { params }));
      } catch (err) {
        this.notifyRequestError("Get upload sections", err);
        return [];
      }
    });
  }
  usersectionBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.coreServiceUrl}/bundles-creations/usersectionbuilder`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, "");
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.notifyRequestError("User section creation", err);
        return false;
      }
    });
  }
  getConvertingLength(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.uploadservice}/fileconvert/convertlength`, { params }));
        return res;
      } catch (err) {
        this.notifyRequestError("Get converting length", err);
        return { queueLength: 0 };
      }
    });
  }
  static {
    this.\u0275fac = function BundlemanageService_Factory(t) {
      return new (t || _BundlemanageService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _BundlemanageService, factory: _BundlemanageService.\u0275fac, providedIn: "root" });
  }
};

export {
  BundlemanageService
};
//# sourceMappingURL=chunk-TR5DVTEU.js.map
