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

// src/app/adminpanel/services/admin-dashboard/admindashboard.service.ts
var AdmindashboardService = class _AdmindashboardService {
  constructor(http, sStore) {
    this.http = http;
    this.sStore = sStore;
  }
  getDashboardlist(nPageNumber, cSearch) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("pageNumber", nPageNumber);
      params = params.append("cSearch", cSearch || "");
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/admin-dashboard/caselist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return yield this.dashBoardArrenge(res);
    });
  }
  getArchivelist(nPageNumber) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("pageNumber", nPageNumber);
      params = params.append("cSearch", "");
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/admin-dashboard/archiveCase`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return yield this.dashBoardArrenge(res);
    });
  }
  dashBoardArrenge(res) {
    return __async(this, null, function* () {
      if (!res || res.length != 3) {
        return [];
      }
      let caseList = res[0];
      for (let x of res[1]) {
        x.users = [];
        x.users = res[2].filter((a) => a.teams.includes(x.nTeamid));
      }
      for (let x of caseList) {
        x.teams = [];
        x.teams = res[1].filter((a) => a.nCaseid == x.nCaseid);
      }
      return caseList;
    });
  }
  update_archivecase(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/admin-dashboard/updatearchiveCase`, mdl));
        if (res && res.msg == 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        return false;
      }
    });
  }
  static {
    this.\u0275fac = function AdmindashboardService_Factory(t) {
      return new (t || _AdmindashboardService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(SecureStorageService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AdmindashboardService, factory: _AdmindashboardService.\u0275fac, providedIn: "root" });
  }
};

export {
  AdmindashboardService
};
//# sourceMappingURL=chunk-M6VP2S2H.js.map
