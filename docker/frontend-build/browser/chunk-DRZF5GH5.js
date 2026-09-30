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

// src/app/presentation/services/present/present.service.ts
var PresentService = class _PresentService {
  constructor(http) {
    this.http = http;
    this.url = environment.presentationservice;
  }
  getPresentDetail(nPresentid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/individual/detail`, { params }));
        res = res[0];
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getTabinfo(nPresentid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/nav/tabs`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  addHighlight(annot, nBundledetailid, nPresentid) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        nPresentid,
        uuid: annot.uuid,
        type: annot.type,
        rects: JSON.stringify(annot.rects || []),
        lines: JSON.stringify(annot.lines || []),
        width: annot.width,
        page: annot.page,
        nBundledetailid
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/highlight/save`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  deleteHighlight(uuid, page, nPresentid) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        nPresentid,
        uuid,
        page
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/highlight/delete`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  requestToJoin(nPresentid) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        nPresentid
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/individual/request/join`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  userJoined(nPresentid) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        nPresentid
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/individual/joined`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  endPresentation(nPresentid) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        nPresentid,
        cStatus: "C"
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/end`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  getPresentPosition(nPresentid, nBundledetailid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid).set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/doc/position`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  changeAnnotsColor(uuid, cColor, nPresentid) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        nPresentid,
        uuid,
        cColor
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/highlight/color/change`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  presentMangeDocs(jBd, cPermission, nPresentid) {
    return __async(this, null, function* () {
      let res = {};
      const obj = {
        jBd,
        nPresentid,
        cPermission
      };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/manage/docs`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  getPresentHighlights(nBundledetailid, nPresentid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid).set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/highlight/list`, { params }));
        if (res.length) {
          res = res.map((a) => {
            return { annots: a, text: "" };
          });
        }
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getOnlineUsers(nPresentid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/online/users`, { params }));
        if (res.msg == 1) {
          return res.users || [];
        }
      } catch (error) {
        console.error(error);
      }
      return [];
    });
  }
  getPresentLinksSharedBy(nPresentid, nBundledetailid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid).set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/share/links/sharedbypresenter`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getRemarks() {
    return __async(this, null, function* () {
      const params = new HttpParams();
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/remark/list`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  manageLinkShare(nPresentid, nAId, nBundledetailid, isWithLink, cPermission) {
    return __async(this, null, function* () {
      let res = {};
      const obj = { nPresentid, nAId, nBundledetailid, cPermission, bIsWithLink: isWithLink };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/share/links`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  getPresentSharedHighlights(nBundledetailid, nPresentid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid).set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/share/links/list`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  setRemarkToLink(nPresentid, nAId, nBundledetailid, nRemarkid) {
    return __async(this, null, function* () {
      let res = {};
      const obj = { nPresentid, nAId, nBundledetailid, nRemarkid };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/remark/insert`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  getRunningScreenShare(nPresentid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/running/screenshare`, { params }));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  getCurrentDetail(nPresentid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nPresentid", nPresentid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/detail`, { params }));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  unsaveHighlights(nPresentid) {
    return __async(this, null, function* () {
      let res = {};
      const obj = { nPresentid };
      try {
        res = yield firstValueFrom(this.http.post(`${this.url}/present/highlight/unsave`, obj));
      } catch (error) {
        console.error(error);
        res = { msg: -1, error };
      }
      return res;
    });
  }
  getTrunConfig() {
    return __async(this, null, function* () {
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${this.url}/present/turn/config`));
      } catch (error) {
        console.error(error);
        res = { msg: -1 };
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function PresentService_Factory(t) {
      return new (t || _PresentService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PresentService, factory: _PresentService.\u0275fac, providedIn: "root" });
  }
};

export {
  PresentService
};
//# sourceMappingURL=chunk-DRZF5GH5.js.map
