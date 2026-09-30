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
  HttpHeaders,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  __async,
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/batchfile/batchfile.service.ts
var BatchfileService = class _BatchfileService {
  constructor(sStore, http, tost) {
    this.sStore = sStore;
    this.http = http;
    this.tost = tost;
  }
  downloadBatchfile(mdl) {
    return __async(this, null, function* () {
      try {
        let res = yield firstValueFrom(this.http.post(`${environment.batchfileservice}/batch/getbatchfile`, mdl));
        if (res && res.msg == 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        console.error(err);
        return false;
      }
    });
  }
  uploadBatchfile(mdl) {
    return __async(this, null, function* () {
      try {
        let res = yield firstValueFrom(this.http.post(`${environment.batchfileservice}/batch/uploadbatchfile`, mdl));
        if (res && res.msg == 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        console.error(err);
        return false;
      }
    });
  }
  downloadFile(cPath) {
    let params = new HttpParams();
    params = params.set("cPath", cPath);
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return this.http.get(`${environment.batchfileservice}/batch/download`, {
      params,
      headers,
      responseType: "blob"
      // Important to specify blob as the response type
    });
  }
  getBatchcolumns(nCaseid, nSectionid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        params = params.set("nSectionid", nSectionid);
        params = params.set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.batchfileservice}/batch/filecolumns`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  getFilecolumn(filepath) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("cPath", filepath);
        const res = yield firstValueFrom(this.http.get(`${environment.batchfileservice}/batch/uploadedfilecols`, { params }));
        return res;
      } catch (err) {
        return { msg: -1 };
      }
    });
  }
  getBatchLog(nCaseid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.batchfileservice}/batch/getbatchlog`, { params }));
        return res[0];
      } catch (err) {
        return { msg: -1 };
      }
    });
  }
  getBatchLogDetail(nBlogid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nBlogid", nBlogid);
        const res = yield firstValueFrom(this.http.get(`${environment.batchfileservice}/batch/getbatchlogdetail`, { params }));
        return res;
      } catch (err) {
        return { msg: -1 };
      }
    });
  }
  static {
    this.\u0275fac = function BatchfileService_Factory(t) {
      return new (t || _BatchfileService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _BatchfileService, factory: _BatchfileService.\u0275fac, providedIn: "root" });
  }
};

export {
  BatchfileService
};
//# sourceMappingURL=chunk-JNLZBNDU.js.map
