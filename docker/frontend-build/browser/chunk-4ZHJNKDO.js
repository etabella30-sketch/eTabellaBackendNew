import {
  PermissionService
} from "./chunk-6UNV36RS.js";
import {
  UserService
} from "./chunk-E4U5AV5T.js";
import {
  AuthInterceptor
} from "./chunk-A3PZ3JQ2.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-42T75ZKA.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  RouterModule
} from "./chunk-FNSUDMGC.js";
import {
  HTTP_INTERCEPTORS,
  HttpClientModule
} from "./chunk-EVEACXQX.js";
import {
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/modules/permission/permission-routing.module.ts
var routes = [
  { path: "", redirectTo: "casecreation", pathMatch: "full" },
  { path: "rolepermission/:id", loadComponent: () => import("./chunk-4V6JTWIK.js").then((m) => m.RolepermissionComponent) },
  { path: "userpermission/:id", loadComponent: () => import("./chunk-AURY3EZ4.js").then((m) => m.UserpermissionComponent) },
  { path: "editpermission/:id", loadComponent: () => import("./chunk-HTYPDPN7.js").then((m) => m.EditpermissionsComponent) }
];
var PermissionRoutingModule = class _PermissionRoutingModule {
  static {
    this.\u0275fac = function PermissionRoutingModule_Factory(t) {
      return new (t || _PermissionRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _PermissionRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/adminpanel/modules/permission/permission.module.ts
var PermissionModule = class _PermissionModule {
  static {
    this.\u0275fac = function PermissionModule_Factory(t) {
      return new (t || _PermissionModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _PermissionModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, PermissionService, UserService], imports: [
      CommonModule,
      PermissionRoutingModule,
      HttpClientModule
    ] });
  }
};
export {
  PermissionModule
};
//# sourceMappingURL=chunk-4ZHJNKDO.js.map
