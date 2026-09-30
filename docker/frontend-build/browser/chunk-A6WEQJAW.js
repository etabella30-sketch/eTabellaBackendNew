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

// src/app/shared/services/helpcenter/helpcenter.service.ts
var HelpcenterService = class _HelpcenterService {
  constructor(http, tost) {
    this.http = http;
    this.tost = tost;
  }
  getCommonTopics() {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/helpcenter/getcommontopics`));
      } catch (error) {
        console.error("error", error);
        res = [];
      }
      return res;
    });
  }
  getModuleList(nKeyid = 0) {
    return __async(this, null, function* () {
      let res = [];
      const params = new HttpParams().set("nKeyid", nKeyid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/helpcenter/getmodulelist`, {
          params
        }));
      } catch (error) {
        console.error("error", error);
        res = [];
      }
      return res;
    });
  }
  getSubModuleList(nMainid, nKeyid = 0) {
    return __async(this, null, function* () {
      let res = [];
      const params = new HttpParams().set("nMainid", nMainid).set("nKeyid", nKeyid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/helpcenter/getsubmodulelist`, {
          params
        }));
      } catch (error) {
        console.error("error", error);
        res = [];
      }
      return res;
    });
  }
  getfaqlist(cQType) {
    return __async(this, null, function* () {
      let res = [];
      const params = new HttpParams().set("cQType", cQType);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/helpcenter/getfaqlist`, {
          params
        }));
      } catch (error) {
        console.error("error", error);
        res = [];
      }
      return res;
    });
  }
  insertFeedback(args) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.uploadservice}/fileconvert/insertfeedback`, args));
        return res;
      } catch (err) {
        console.error("error", err);
        this.tost.openSnackBar(err.message, "E");
        return { msg: -1, value: "failed" };
      }
    });
  }
  getkeywords(cKey) {
    return __async(this, null, function* () {
      let res = [];
      const params = new HttpParams().set("cKey", cKey);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/helpcenter/getkeywords`, {
          params
        }));
      } catch (error) {
        console.error("error", error);
        res = [];
      }
      return res;
    });
  }
  module_iu(args) {
    return __async(this, null, function* () {
      try {
        return yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/helpcenter/module_iu`, args));
      } catch (error) {
        console.error("error", error);
        return { msg: -1, value: error.message };
      }
    });
  }
  // send submodule id & parent id as parmaerers
  sub_module_iu(args) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/helpcenter/sub_module_iu`, args));
      } catch (error) {
        console.error("error", error);
        res = [];
      }
      return res;
    });
  }
  //sub_module_detail//
  getsubmodule_detail(nSMid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/helpcenter/sub_module_detail`, {
          params: { nSMid }
        }));
      } catch (error) {
        console.error("error", error);
        res = [];
      }
      return res;
    });
  }
  moduleimageUpload(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.uploadservice}/helpcenter/upload-image`, mdl));
        if (res.msg == -1) {
          this.tost.openSnackBar(`Image Upload failed ${res.error}`, "E");
          return { msg: -1, error: res.error, value: "" };
        } else {
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Image Upload failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  searchSMid(nSMid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/helpcenter/search_key`, { nSMid }));
      } catch (error) {
        console.error("error", error);
        res = [];
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function HelpcenterService_Factory(t) {
      return new (t || _HelpcenterService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _HelpcenterService, factory: _HelpcenterService.\u0275fac, providedIn: "root" });
  }
};

export {
  HelpcenterService
};
//# sourceMappingURL=chunk-A6WEQJAW.js.map
