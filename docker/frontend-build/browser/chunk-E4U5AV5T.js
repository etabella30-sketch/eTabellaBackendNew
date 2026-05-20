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

// src/app/adminpanel/services/user/user.service.ts
var UserService = class _UserService {
  constructor(sStore, http, tost) {
    this.sStore = sStore;
    this.http = http;
    this.tost = tost;
  }
  userBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/team-setup/userbuilder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`User creation failed ${err}`, "E");
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
  userDetail(mdl) {
    return __async(this, null, function* () {
      try {
        var params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/getuserdetail`, { params }));
        return res && res.length > 0 ? res[0] : null;
      } catch (err) {
        return false;
      }
    });
  }
  teamCombo(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/teamcombo`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  roleCombo() {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/rolelist`));
        return res;
      } catch (err) {
        return [];
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
  userDelete(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/team-setup/userdelete`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`User deletion failed ${err}`, "E");
        return false;
      }
    });
  }
  checkEmailexists(cEmail, nCaseid) {
    return __async(this, null, function* () {
      var params = new HttpParams().set("cEmail", cEmail);
      params = params.set("nCaseid", nCaseid);
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/checkemail`, { params }));
        return res;
      } catch (err) {
        console.error(err);
        this.tost.openSnackBar(`User Fatching failed`, "E");
        return {};
      }
    });
  }
  userProfileUpload(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.uploadservice}/profile/upload-image`, mdl));
        if (res.msg == -1) {
          this.tost.openSnackBar(`Profile Upload failed ${res.error}`, "E");
          return { msg: -1, error: res.error, value: "" };
        } else {
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Profile Upload failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  static {
    this.\u0275fac = function UserService_Factory(t) {
      return new (t || _UserService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _UserService, factory: _UserService.\u0275fac, providedIn: "root" });
  }
};

export {
  UserService
};
//# sourceMappingURL=chunk-E4U5AV5T.js.map
