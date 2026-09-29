import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
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

// src/app/userpanel/services/individual/individual.service.ts
var IndividualService = class _IndividualService {
  constructor(http, store) {
    this.http = http;
    this.store = store;
    this.isAdjustDoc = false;
  }
  getTabinfo(data) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("jFiles", JSON.stringify(data));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/individual/tabinfo`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  fetchPreNextDocs(nBundledetailid, cFlag, jAvoid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("cFlag", cFlag);
      params = params.set("jAvoid", JSON.stringify(jAvoid));
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/individual/gettab`, { params }));
        if (res.msg == -1) {
          return null;
        }
      } catch (error) {
        res = null;
      }
      return res;
    });
  }
  updateUrl(documents, nCaseid, nPresentid, nIndexid) {
    const tabs = documents.map((a) => [a.nBundledetailid, a.onPage || 1, a.jFSids || null, a.nRFSid || null, a.nRDocid || null, a.nRWebid || null, a.jFilter, null, a.isActivate ? true : false, a.nSesid || null]);
    const url = [tabs, nCaseid];
    if (nPresentid)
      url.push(nPresentid);
    if (nIndexid)
      url.push(nIndexid);
    const path = `/individual/doc/${encodeURIComponent(JSON.stringify(url))}`;
    this.store.setStorage(`INDIVIDUAL:${nCaseid}`, 1);
    window.history.pushState("", "Individual Doc - Etabella", path);
  }
  sharedusers(nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/individual/locationshare/sharedusers`, { params }));
        if (res.msg == -1) {
          return null;
        }
      } catch (error) {
        res = null;
      }
      return res;
    });
  }
  update_sharelink(mdl) {
    return __async(this, null, function* () {
      let res;
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/individual/updatesharelink`, mdl));
        if (res[0].msg == -1) {
          return null;
        }
      } catch (error) {
        res = null;
      }
      return res;
    });
  }
  shared_to_users(mdl) {
    return __async(this, null, function* () {
      let res;
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/individual/locationshare/sharetousers`, mdl));
        if (res.msg != 1) {
          return null;
        }
      } catch (error) {
        res = null;
      }
      return res;
    });
  }
  fetchAllDocs(ids) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("jDocids", JSON.stringify(ids));
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/doclink/docdetail`, { params }));
        if (res.msg == -1) {
          return null;
        }
      } catch (error) {
        res = null;
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function IndividualService_Factory(t) {
      return new (t || _IndividualService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(SecureStorageService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _IndividualService, factory: _IndividualService.\u0275fac, providedIn: "root" });
  }
};

export {
  IndividualService
};
//# sourceMappingURL=chunk-GNZXOHZW.js.map
