import {
  BehaviorSubject,
  ɵɵdefineInjectable
} from "./chunk-OLJKHPOW.js";

// src/app/core/services/permission/rolepermit.service.ts
var RolepermitService = class _RolepermitService {
  constructor() {
    this.roles = {
      1: "8632ee5c-e854-411c-b83d-c21656ad39ac",
      // 2
      2: "acbac68b-0921-457d-8a6a-543197cfa312",
      // 3
      3: "b1316999-8cc8-44e1-973c-04febcdc782b",
      // 4
      4: "e286a210-e979-4491-a537-c8021976f657",
      // 5
      5: "dd234aaf-82bb-475c-a5e4-777f6a347039"
      // 6
    };
    this._userPermission$ = new BehaviorSubject([]);
    this.userPermission$ = this._userPermission$.asObservable();
  }
  isAdmin(roleid) {
    return !roleid ? false : roleid == this.roles["1"];
  }
  isPresenter(roleid) {
    return !roleid ? false : roleid == this.roles[5];
  }
  isCanPresent(roleid, jPermission) {
    return !roleid ? false : roleid != this.roles["3"] && roleid != this.roles["4"] && !jPermission?.includes("PT");
  }
  isHaveRealtime(jPermission) {
    return !jPermission?.includes("RT");
  }
  isHaveView(jPermission) {
    return !jPermission?.includes("VC");
  }
  setUserPermissionArray(value) {
    this._userPermission$.next(value);
  }
  isUserHavePermission(jPermission, type) {
    return !jPermission?.includes(type);
  }
  verifyPermission(type) {
    const value = this._userPermission$.getValue() || [];
    return !value.includes(type);
  }
  static {
    this.\u0275fac = function RolepermitService_Factory(t) {
      return new (t || _RolepermitService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RolepermitService, factory: _RolepermitService.\u0275fac, providedIn: "root" });
  }
};

export {
  RolepermitService
};
//# sourceMappingURL=chunk-TECZMXLZ.js.map
