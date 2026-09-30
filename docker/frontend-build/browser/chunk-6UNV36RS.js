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

// src/app/adminpanel/services/permission/permission.service.ts
var PermissionService = class _PermissionService {
  constructor(sStore, http, tost) {
    this.sStore = sStore;
    this.http = http;
    this.tost = tost;
  }
  rolePermission(nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/permission/rolepermission`, { params }));
      } catch (err) {
        console.error(err);
        res = [];
      }
      return yield this.rolePermissionArrenge(res);
    });
  }
  rolePermissionArrenge(res) {
    return __async(this, null, function* () {
      if (!res || res.length != 2) {
        return [];
      }
      let roleList = res[0];
      for (let x of res[0]) {
        x.users = [];
        x.users = res[1].filter((a) => a.nRoleid == x.nRoleid);
      }
      return roleList;
    });
  }
  permissionRoleModule(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        var params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/permission/rolemodules`, { params }));
        return res;
      } catch (err) {
        console.error(err);
        return [];
      }
    });
  }
  permissionUserModule(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        var params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/permission/usermodules`, { params }));
        return res;
      } catch (err) {
        console.error(err);
        return [];
      }
    });
  }
  updatePermission(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/permission/updatemodule`, mdl));
        if (res && res.msg == 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        console.error(err);
        return false;
      }
    });
  }
  resetRoleModule(nCaseid, nRoleid, nUserid) {
    return __async(this, null, function* () {
      try {
        const mdl = {
          nCaseid,
          nRoleid,
          nUserid
        };
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/permission/resetpermission`, mdl));
        if (res && res.msg == 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        console.error(err);
        return false;
      }
    });
  }
  userpermissionList(nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/permission/userpermission`, { params }));
      } catch (err) {
        console.error(err);
        res = [];
      }
      return yield this.userPermissionArrenge(res);
    });
  }
  userPermissionArrenge(res) {
    return __async(this, null, function* () {
      if (!res || res.length != 2) {
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
  manageRole(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/permission/rolestatus`, mdl));
        if (res && res.msg == 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        console.error(err);
        return false;
      }
    });
  }
  manageUser(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/permission/usermanage`, mdl));
        if (res && res.msg == 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        console.error(err);
        return false;
      }
    });
  }
  manageQuota(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/permission/updatequota`, mdl));
        if (res && res.msg == 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        console.error(err);
        return false;
      }
    });
  }
  static {
    this.\u0275fac = function PermissionService_Factory(t) {
      return new (t || _PermissionService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PermissionService, factory: _PermissionService.\u0275fac, providedIn: "root" });
  }
};

export {
  PermissionService
};
//# sourceMappingURL=chunk-6UNV36RS.js.map
