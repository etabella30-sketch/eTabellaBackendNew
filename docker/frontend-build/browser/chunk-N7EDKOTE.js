import {
  IndividualService
} from "./chunk-GNZXOHZW.js";
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

// src/app/userpanel/modules/individual/individual-routing.module.ts
var routes = [
  { path: "", redirectTo: "doc", pathMatch: "full" },
  { path: "doc/:id", loadComponent: () => import("./chunk-VYQ4KTSL.js").then((m) => m.IndividualDocComponent) }
];
var IndividualRoutingModule = class _IndividualRoutingModule {
  static {
    this.\u0275fac = function IndividualRoutingModule_Factory(t) {
      return new (t || _IndividualRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _IndividualRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/userpanel/modules/individual/individual.module.ts
var IndividualModule = class _IndividualModule {
  static {
    this.\u0275fac = function IndividualModule_Factory(t) {
      return new (t || _IndividualModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _IndividualModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, IndividualService], imports: [
      CommonModule,
      IndividualRoutingModule,
      HttpClientModule
    ] });
  }
};
export {
  IndividualModule
};
//# sourceMappingURL=chunk-N7EDKOTE.js.map
