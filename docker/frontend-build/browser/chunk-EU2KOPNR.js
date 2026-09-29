import {
  RolepermitService
} from "./chunk-TECZMXLZ.js";
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

// src/app/shared/services/user-permission/user-permission.service.ts
var UserPermissionService = class _UserPermissionService {
  constructor(http, rolePermit) {
    this.http = http;
    this.rolePermit = rolePermit;
    this._lastRoleId = null;
  }
  userPermissionList(nCaseid) {
    return __async(this, null, function* () {
      if (!nCaseid || this.rolePermit.permissionCaseid == nCaseid)
        return;
      var params = new HttpParams().set("nCaseid", nCaseid);
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/permission/permissionlist`, { params }));
        if (res.msg == 1) {
          this.rolePermit.setUserPermissionArray(res?.jPermission);
          this.rolePermit.permissionCaseid = nCaseid;
          return res?.jPermission;
        }
        return [];
      } catch (err) {
        console.error("Error", err);
        return [];
      }
    });
  }
  getUserRoleId(nCaseid, nUserid) {
    return __async(this, null, function* () {
      if (this._lastRoleId)
        return this._lastRoleId;
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/team-data/assignedusers`, { params }));
        console.log("[Presenter Debug] assignedusers response:", res);
        if (Array.isArray(res)) {
          const entry = res.find((item) => item.u === nUserid);
          console.log("[Presenter Debug] found entry for user:", entry);
          this._lastRoleId = entry?.r || null;
        }
        console.log("[Presenter Debug] extracted roleId:", this._lastRoleId);
        return this._lastRoleId;
      } catch (err) {
        console.error("[Presenter Debug] Error fetching user role", err);
        return null;
      }
    });
  }
  userCasePermission(nCaseid) {
    return __async(this, null, function* () {
      if (!nCaseid || this.rolePermit.permissionCaseid == nCaseid)
        return;
      var params = new HttpParams().set("nCaseid", nCaseid);
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/permission/casepermission`, { params }));
        this._lastRoleId = res?.nRoleid || null;
        console.log("casepermission response:", res, "extracted nRoleid:", this._lastRoleId);
        return res;
      } catch (err) {
        console.error("Error", err);
        return [];
      }
    });
  }
  static {
    this.\u0275fac = function UserPermissionService_Factory(t) {
      return new (t || _UserPermissionService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(RolepermitService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _UserPermissionService, factory: _UserPermissionService.\u0275fac, providedIn: "root" });
  }
};

export {
  UserPermissionService
};
//# sourceMappingURL=chunk-EU2KOPNR.js.map
