import {
  UserdashboardService
} from "./chunk-RXCKHUOJ.js";
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

// src/app/userpanel/modules/userdashboard/userdashboard-routing.module.ts
var routes = [
  { path: "", redirectTo: "dashboard", pathMatch: "full" },
  { path: "dashboard", loadComponent: () => import("./chunk-EOQHZSUS.js").then((m) => m.UserdashboardComponent) }
];
var userdashboardRoutingModule = class _userdashboardRoutingModule {
  static {
    this.\u0275fac = function userdashboardRoutingModule_Factory(t) {
      return new (t || _userdashboardRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _userdashboardRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/userpanel/modules/userdashboard/userdashboard.module.ts
var userdashboardModule = class _userdashboardModule {
  static {
    this.\u0275fac = function userdashboardModule_Factory(t) {
      return new (t || _userdashboardModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _userdashboardModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, UserdashboardService, TicketService], imports: [
      CommonModule,
      userdashboardRoutingModule,
      HttpClientModule
    ] });
  }
};
export {
  userdashboardModule
};
//# sourceMappingURL=chunk-JAV6NYOV.js.map
