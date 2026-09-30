import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
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

// src/app/adminpanel/services/pagination/pagination.service.ts
var PaginationService = class _PaginationService {
  constructor(sStore, http, tost) {
    this.sStore = sStore;
    this.http = http;
    this.tost = tost;
  }
  getPagination(nBundledetailid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nBundledetailid", nBundledetailid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/paginationdata`, { params }));
        return res[0];
      } catch (err) {
        return null;
      }
    });
  }
  submitPagination(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(
          `${environment.paginationservice}/paginationdata/pagination`,
          //${environment.cloudUrl}
          mdl
        ));
        if (res && res.msg == 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Pagination failed ${err}`, "E");
        return false;
      }
    });
  }
  stopPagination(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(
          `${environment.paginationservice}/paginationdata/stoppagination`,
          //${environment.cloudUrl}
          mdl
        ));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Pagination failed ${err}`, "E");
        return false;
      }
    });
  }
  getPaginationData(nCaseid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        params = params.set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(
          `${environment.paginationservice}/paginationdata/getpagination`,
          //${environment.cloudUrl}
          { params }
        ));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  paginateNonPaginated(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(
          `${environment.paginationservice}/paginationdata/paginationNonPaginated`,
          //${environment.cloudUrl}
          mdl
        ));
        if (res && res.msg == 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Pagination failed ${err}`, "E");
        return false;
      }
    });
  }
  static {
    this.\u0275fac = function PaginationService_Factory(t) {
      return new (t || _PaginationService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PaginationService, factory: _PaginationService.\u0275fac, providedIn: "root" });
  }
};

export {
  PaginationService
};
//# sourceMappingURL=chunk-3FBNC3RN.js.map
