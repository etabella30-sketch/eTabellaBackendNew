import {
  WorkspaceService
} from "./chunk-PR7CQFYY.js";
import {
  PaginationService
} from "./chunk-3FBNC3RN.js";
import {
  BundlemanageService
} from "./chunk-TR5DVTEU.js";
import {
  PermissionGuard
} from "./chunk-J7M4OPHK.js";
import {
  CasedetailService
} from "./chunk-XYPEOTVH.js";
import {
  AuthInterceptor
} from "./chunk-A3PZ3JQ2.js";
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
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-OLJKHPOW.js";

// src/app/shared/guards/confirm-exit.guard.ts
var ConfirmExitGuard = class _ConfirmExitGuard {
  canDeactivate(component) {
    return component.canDeactivate ? component.canDeactivate() : true;
  }
  static {
    this.\u0275fac = function ConfirmExitGuard_Factory(t) {
      return new (t || _ConfirmExitGuard)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ConfirmExitGuard, factory: _ConfirmExitGuard.\u0275fac, providedIn: "root" });
  }
};

// src/app/userpanel/modules/myfiles/myfiles-routing.module.ts
var routes = [
  { path: "", redirectTo: "filesaction", pathMatch: "full" },
  {
    path: "filesaction/:id",
    loadComponent: () => import("./chunk-CWSRZWN2.js").then((m) => m.FilesactionComponent),
    canDeactivate: [ConfirmExitGuard],
    data: { permission: "VC" },
    canActivate: [PermissionGuard]
  },
  {
    path: "workspace/:id",
    loadComponent: () => import("./chunk-RDDQS4BV.js").then((m) => m.WorkspaceComponent),
    data: { permission: "WS" },
    canActivate: [PermissionGuard]
  },
  {
    path: "task/:id",
    loadComponent: () => import("./chunk-72D6OQW2.js").then((m) => m.TaskComponent),
    data: { permission: "TS" },
    canActivate: [PermissionGuard]
  },
  {
    path: "factcontact/:id",
    loadComponent: () => import("./chunk-V4YE6C37.js").then((m) => m.FactcontactComponent),
    data: { permission: "CT" },
    canActivate: [PermissionGuard]
  },
  {
    path: "export/:id",
    loadComponent: () => import("./chunk-FIJZEC5G.js").then((m) => m.ExportComponent),
    data: { permission: "ED" },
    canActivate: [PermissionGuard]
  },
  { path: "download/:id", loadComponent: () => import("./chunk-FEXIIBLW.js").then((m) => m.DownloadComponent) }
];
var MyfilesRoutingModule = class _MyfilesRoutingModule {
  static {
    this.\u0275fac = function MyfilesRoutingModule_Factory(t) {
      return new (t || _MyfilesRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _MyfilesRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/userpanel/modules/myfiles/myfiles.module.ts
var MyfilesModule = class _MyfilesModule {
  static {
    this.\u0275fac = function MyfilesModule_Factory(t) {
      return new (t || _MyfilesModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _MyfilesModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [
      { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      BundlemanageService,
      PaginationService,
      CasedetailService,
      WorkspaceService
    ], imports: [CommonModule, MyfilesRoutingModule, HttpClientModule] });
  }
};

export {
  MyfilesModule
};
//# sourceMappingURL=chunk-VVKVB7IH.js.map
