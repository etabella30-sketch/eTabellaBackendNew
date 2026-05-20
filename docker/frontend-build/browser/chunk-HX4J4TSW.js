import {
  PermissionGuard
} from "./chunk-J7M4OPHK.js";
import "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  TranslateModule
} from "./chunk-DWVFAK3Q.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-42T75ZKA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import {
  RouterModule
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import "./chunk-YBHDQMOW.js";
import {
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-OLJKHPOW.js";

// src/app/rt/modules/rt/rt-routing.module.ts
var routes = [
  { path: "", redirectTo: "feed", pathMatch: "full" },
  // { path: 'feed/:id', loadComponent: () => import('../../components/feed-display/feed-display.component').then(m => m.FeedDisplayComponent) }
  {
    path: "feed/:id",
    loadComponent: () => import("./chunk-6NSBLL6J.js").then((m) => m.RealtimeShellComponent),
    data: { permission: "RT" },
    canActivate: [PermissionGuard]
  },
  {
    path: "dashboard/:id",
    loadComponent: () => import("./chunk-JRLR7KDU.js").then((m) => m.DashboardComponent),
    data: { permission: "RT" },
    canActivate: [PermissionGuard]
  }
];
var rtRoutingModule = class _rtRoutingModule {
  static {
    this.\u0275fac = function rtRoutingModule_Factory(t) {
      return new (t || _rtRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _rtRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/rt/modules/rt/rt.module.ts
var RtModule = class _RtModule {
  static {
    this.\u0275fac = function RtModule_Factory(t) {
      return new (t || _RtModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _RtModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [
      rtRoutingModule,
      TranslateModule.forChild()
    ] });
  }
};
export {
  RtModule
};
//# sourceMappingURL=chunk-HX4J4TSW.js.map
