import {
  AdmindashboardService
} from "./chunk-M6VP2S2H.js";
import {
  AuthInterceptor
} from "./chunk-A3PZ3JQ2.js";
import "./chunk-ZDDERD6Z.js";
import {
  TicketService
} from "./chunk-WQBUN4X6.js";
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

// src/app/adminpanel/modules/admindashboard/admindashboard-routing.module.ts
var routes = [
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full"
  },
  {
    path: "dashboard",
    loadComponent: () => import("./chunk-V733UOTZ.js").then((m) => m.AdmindashboardComponent)
  },
  {
    path: "tickets/:id",
    loadComponent: () => import("./chunk-ECBNXSZO.js").then((m) => m.TicketsComponent)
  },
  {
    path: "archivecases",
    loadComponent: () => import("./chunk-262L73L6.js").then((m) => m.ArchivecaseComponent)
  },
  { path: "batchlog/:id", loadComponent: () => import("./chunk-2LZGC5JX.js").then((m) => m.BatchlogComponent) }
];
var AdmindashboardRoutingModule = class _AdmindashboardRoutingModule {
  static {
    this.\u0275fac = function AdmindashboardRoutingModule_Factory(t) {
      return new (t || _AdmindashboardRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _AdmindashboardRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/adminpanel/modules/admindashboard/admindashboard.module.ts
var AdmindashboardModule = class _AdmindashboardModule {
  static {
    this.\u0275fac = function AdmindashboardModule_Factory(t) {
      return new (t || _AdmindashboardModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _AdmindashboardModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, AdmindashboardService, TicketService], imports: [
      CommonModule,
      AdmindashboardRoutingModule,
      HttpClientModule
    ] });
  }
};
export {
  AdmindashboardModule
};
//# sourceMappingURL=chunk-5L57OCR7.js.map
