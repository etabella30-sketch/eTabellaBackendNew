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

// src/app/pdf/service/pdf-data.service.ts
var PdfDataService = class _PdfDataService {
  constructor(http) {
    this.http = http;
    this.linkMode = { "IF": "incomming/factlinks", "OF": "outgoing/factlinks", "ID": "incomming/doclinks", "OD": "outgoing/doclinks" };
  }
  fetchDocInfo(nBundledetailid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/individual/getdocinfo`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getGlobalAnnotats(nBundledetailid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/individual/globannots`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getAnnotation(nBundledetailid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/common/getannotations`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  updateRotation(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/individual/updaterotation`, mdl));
        if (res && res.msg == 1) {
          return res;
        } else {
          return res;
        }
      } catch (err) {
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  downloadFile(filePath) {
    return this.http.get(filePath, { responseType: "blob" });
  }
  deleteAnnoatation(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/fact/deletehighlight`, mdl));
        if (res) {
          return res[0];
        } else {
          return res;
        }
      } catch (err) {
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  addAnnotation(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/fact/addhighlight`, mdl));
        if (res) {
          return res[0];
        } else {
          return res;
        }
      } catch (err) {
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  getLinks(nBundledetailid, apilink) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/individual/${this.linkMode[apilink]}`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getHyperLinkFile(nBundledetailid, nDocid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("nDocid", nDocid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/individual/gethyperlinkfile`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getToolbarData(nBundledetailid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nBundledetailid", nBundledetailid);
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/individual/toolbar/data`, { params }));
        if (res.msg !== 1) {
          return null;
        }
        return res;
      } catch (error) {
        console.error(error);
        return null;
      }
    });
  }
  static {
    this.\u0275fac = function PdfDataService_Factory(t) {
      return new (t || _PdfDataService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PdfDataService, factory: _PdfDataService.\u0275fac, providedIn: "root" });
  }
};

export {
  PdfDataService
};
//# sourceMappingURL=chunk-F3YHE7Z5.js.map
