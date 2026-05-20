import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import {
  RolepermitService
} from "./chunk-TECZMXLZ.js";
import {
  AuthValidationService
} from "./chunk-ZDDERD6Z.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  Router
} from "./chunk-FNSUDMGC.js";
import {
  __async,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/core/guard/permission/permission.guard.ts
var PermissionGuard = class _PermissionGuard {
  constructor(rolePermission, router, userPermissions, ss, authValidation) {
    this.rolePermission = rolePermission;
    this.router = router;
    this.userPermissions = userPermissions;
    this.ss = ss;
    this.authValidation = authValidation;
  }
  canActivate(route, state) {
    return __async(this, null, function* () {
      const validation = yield this.authValidation.validate();
      this.userdetail = validation.userDetail || (yield this.ss.getUserInfo());
      return this.checkPermission(route);
    });
  }
  canActivateChild(childRoute, state) {
    return __async(this, null, function* () {
      const validation = yield this.authValidation.validate();
      this.userdetail = validation.userDetail || (yield this.ss.getUserInfo());
      return this.checkPermission(childRoute);
    });
  }
  checkPermission(route) {
    return __async(this, null, function* () {
      if (this.userdetail?.isAdmin) {
        return true;
      }
      const requiredPermission = route.data["permission"];
      const encoded = route.params["id"];
      let nCaseid;
      try {
        let decoded;
        if (requiredPermission == "PT") {
          decoded = JSON.parse(decodeURIComponent(encoded));
        } else {
          decoded = JSON.parse(atob(encoded));
        }
        nCaseid = decoded["c"] || decoded["id"] || decoded["nCaseid"];
      } catch (err) {
        console.error("[PermissionGuard] Invalid route param (id):", err);
        this.router.navigate(["/"]);
        return false;
      }
      try {
        yield this.userPermissions.userPermissionList(nCaseid);
        if (requiredPermission && this.rolePermission.verifyPermission(requiredPermission)) {
          return true;
        }
      } catch (error) {
        console.error("[PermissionGuard] Permission fetch failed:", error);
      }
      this.router.navigate(["/"]);
      return false;
    });
  }
  static {
    this.\u0275fac = function PermissionGuard_Factory(t) {
      return new (t || _PermissionGuard)(\u0275\u0275inject(RolepermitService), \u0275\u0275inject(Router), \u0275\u0275inject(UserPermissionService), \u0275\u0275inject(SecureStorageService), \u0275\u0275inject(AuthValidationService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PermissionGuard, factory: _PermissionGuard.\u0275fac, providedIn: "root" });
  }
};

export {
  PermissionGuard
};
//# sourceMappingURL=chunk-J7M4OPHK.js.map
