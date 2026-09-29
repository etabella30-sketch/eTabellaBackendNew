import {
  RouterModule
} from "./chunk-FNSUDMGC.js";
import {
  HttpClientModule
} from "./chunk-EVEACXQX.js";
import {
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-OLJKHPOW.js";

// src/app/core/core-routing.module.ts
var routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  { path: "login", loadComponent: () => import("./chunk-U7QRKJI7.js").then((m) => m.LoginComponent) },
  { path: "forgotpassword", loadComponent: () => import("./chunk-DO77XFXY.js").then((m) => m.ForgotpasswordComponent) }
  // { path: 'casecard', loadComponent: () => import('./../shared/components/casecard/casecard.component').then(m => m.CasecardComponent) }
];
var CoreRoutingModule = class _CoreRoutingModule {
  static {
    this.\u0275fac = function CoreRoutingModule_Factory(t) {
      return new (t || _CoreRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _CoreRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/core/core.module.ts
var CoreModule = class _CoreModule {
  static {
    this.\u0275fac = function CoreModule_Factory(t) {
      return new (t || _CoreModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _CoreModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [
      CommonModule,
      CoreRoutingModule,
      HttpClientModule
    ] });
  }
};
export {
  CoreModule
};
//# sourceMappingURL=chunk-HXZ7CUXH.js.map
