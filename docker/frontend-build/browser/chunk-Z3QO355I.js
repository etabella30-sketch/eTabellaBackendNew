import {
  AuthInterceptor
} from "./chunk-A3PZ3JQ2.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-42T75ZKA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
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

// src/app/presentation/modules/present/present-routing.module.ts
var routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  {
    path: "home/:id",
    loadComponent: () => import("./chunk-LIPEGWYE.js").then((m) => m.PresenthomeComponent)
  },
  {
    path: "subtype/:id",
    loadComponent: () => import("./chunk-RAXH5ZWI.js").then((m) => m.SubtypeComponent)
  },
  {
    path: "setup/:id",
    loadComponent: () => import("./chunk-HZQB2TTD.js").then((m) => m.FormComponent)
  },
  {
    path: "createWitness/:id",
    loadComponent: () => import("./chunk-SHSKAJ5E.js").then((m) => m.CreateScheduleComponent)
  },
  {
    path: "schedule-list/:id",
    loadComponent: () => import("./chunk-IWN5HFRX.js").then((m) => m.ScheduleListComponent)
  },
  {
    path: "choose-docs/:id",
    loadComponent: () => import("./chunk-OHPCJ2OJ.js").then((m) => m.ChooseDocsComponent)
  },
  {
    path: "core-case/:id",
    loadComponent: () => import("./chunk-PCBRKTOV.js").then((m) => m.CoreCaseComponent)
  }
];
var PresentRoutingModule = class _PresentRoutingModule {
  static {
    this.\u0275fac = function PresentRoutingModule_Factory(t) {
      return new (t || _PresentRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _PresentRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/presentation/modules/present/present.module.ts
var PresentModule = class _PresentModule {
  static {
    this.\u0275fac = function PresentModule_Factory(t) {
      return new (t || _PresentModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _PresentModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }], imports: [
      CommonModule,
      PresentRoutingModule,
      HttpClientModule
    ] });
  }
};
export {
  PresentModule
};
//# sourceMappingURL=chunk-Z3QO355I.js.map
