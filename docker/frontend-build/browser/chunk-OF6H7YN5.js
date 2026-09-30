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

// src/app/adminpanel/services/teamsetup/teamsetup.service.ts
var TeamsetupService = class _TeamsetupService {
  constructor(sStore, http, tost) {
    this.sStore = sStore;
    this.http = http;
    this.tost = tost;
  }
  teamList(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/teamlist`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  teamColor(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/teamcolor`, {
          params
        }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  assignedUsers(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/assignedusers`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  userList(mdl) {
    return __async(this, null, function* () {
      try {
        var params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/userlist`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  teamBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/team-setup/teambuilder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`team creation failed ${err}`, "");
        return false;
      }
    });
  }
  teamDelete(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/team-setup/teamdelete`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`team deletion failed ${err}`, "E");
        return false;
      }
    });
  }
  timezoneCombo() {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/timezone`));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  assignTeam(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/team-setup/assignteam`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Team setup failed ${err}`, "E");
        return false;
      }
    });
  }
  static {
    this.\u0275fac = function TeamsetupService_Factory(t) {
      return new (t || _TeamsetupService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TeamsetupService, factory: _TeamsetupService.\u0275fac, providedIn: "root" });
  }
};

export {
  TeamsetupService
};
//# sourceMappingURL=chunk-OF6H7YN5.js.map
