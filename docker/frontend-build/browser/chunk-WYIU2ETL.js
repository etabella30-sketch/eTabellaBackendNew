import {
  v4_default
} from "./chunk-3B3MCZKM.js";
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

// src/app/presentation/services/presentsetup/presentsetup.service.ts
var PresentsetupService = class _PresentsetupService {
  constructor(http, sStore) {
    this.http = http;
    this.sStore = sStore;
    this.presentSession = {};
  }
  ///////////// TEMPERORY
  setRvalue(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        this.presentSession = Object.assign(this.presentSession, mdl);
        res = yield firstValueFrom(this.http.post(`${environment.presentationservice}/present/setup/setsetup`, mdl));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getRvalue(nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", nCaseid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/getsetup`, { params }));
        this.presentSession = res;
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  ////////// CODE
  getTypes() {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/getType`));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getSTypes(nCaseid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/getsubType`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  //////////////
  getTeam(cType, nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        const params = new HttpParams().set("cType", cType).set("nCaseid", nCaseid);
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/teams/users`, { params }));
      } catch (err) {
        console.error(err);
        res = [];
      }
      return yield this.userPermissionArrenge(res);
    });
  }
  userPermissionArrenge(res) {
    return __async(this, null, function* () {
      if (!res) {
        return [];
      }
      let teamList = res[0];
      for (let x of res[0]) {
        x.users = [];
        x.users = res[1].filter((a) => a.nTeamid == x.nTeamid);
      }
      return teamList;
    });
  }
  generateRandomId() {
    return v4_default();
  }
  getPresentationList(nCaseid, nTypeid, nSubtypeid = 0) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", nCaseid).set("nTypeid", nTypeid).set("nSubtypeid", nSubtypeid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/list`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  caseDetail(nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", nCaseid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/caseDetails`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getcontactList(nCaseid, cType) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", nCaseid).set("cType", cType);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/contactList`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  scheduleList(nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", nCaseid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/scheduleList`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  deleteSchedule(nPCid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.delete(`${environment.presentationservice}/present/setup/scheduleDelete`, { body: { nPCid } }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  ongoing(nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", nCaseid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/ongoinglist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  insert(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.presentationservice}/present/setup/insert`, mdl));
      } catch (error) {
        console.error(error);
        res = { msg: -1 };
      }
      return res;
    });
  }
  getFiles(nPresentid, cSortby, cSorttype) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nPresentid", nPresentid);
      params = params.set("cSortby", cSortby);
      params = params.set("cSorttype", cSorttype);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/files`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  detail(nPresentid) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nPresentid", nPresentid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/detail`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  clearSchedule(nPresentid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.delete(`${environment.presentationservice}/present/setup/clearSchedule`, { body: { nPresentid } }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getPresentHomeDetail(nCaseid) {
    return __async(this, null, function* () {
      let res = {};
      const params = new HttpParams().set("nCaseid", nCaseid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/homedetail`, {
          params
        }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  recentFiles(args) {
    return __async(this, null, function* () {
      let res = [];
      var params = new HttpParams();
      for (const key in args) {
        if (args.hasOwnProperty(key)) {
          params = params.set(key, args[key]);
        }
      }
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/recentFiles`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  files_serial_update(args) {
    return __async(this, null, function* () {
      let res = {};
      try {
        res = yield firstValueFrom(this.http.post(`${environment.presentationservice}/present/setup/files_serial_update`, args));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  update_status(args) {
    return __async(this, null, function* () {
      let res = {};
      try {
        res = yield firstValueFrom(this.http.post(`${environment.presentationservice}/present/setup/update_status`, args));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  downloadFiles(args) {
    return __async(this, null, function* () {
      let nUserid = yield this.sStore.getUserId();
      var link = document.createElement("a");
      let params = btoa(JSON.stringify(args));
      link.href = `${environment.downloadservice}/download/downloadPresentReport?nMasterid=${nUserid}&params=${params}`;
      link.setAttribute("download", "folder");
      link.addEventListener("load", function() {
        console.log("Download started");
      });
      link.addEventListener("error", function() {
        console.error("Error downloading file");
      });
      link.addEventListener("click", function() {
        console.log("Download link clicked");
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
  recentFilesIDS(args) {
    return __async(this, null, function* () {
      let res = [];
      var params = new HttpParams();
      for (const key in args) {
        if (args.hasOwnProperty(key)) {
          params = params.set(key, args[key]);
        }
      }
      try {
        res = yield firstValueFrom(this.http.get(`${environment.presentationservice}/present/setup/recentFilesIds`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function PresentsetupService_Factory(t) {
      return new (t || _PresentsetupService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(SecureStorageService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PresentsetupService, factory: _PresentsetupService.\u0275fac, providedIn: "root" });
  }
};

export {
  PresentsetupService
};
//# sourceMappingURL=chunk-WYIU2ETL.js.map
