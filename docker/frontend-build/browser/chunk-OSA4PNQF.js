import {
  TeamsetupService
} from "./chunk-OF6H7YN5.js";
import {
  CaseBuilderService
} from "./chunk-46GVS2PE.js";
import {
  CasedetailService
} from "./chunk-XYPEOTVH.js";
import {
  UserService
} from "./chunk-E4U5AV5T.js";
import {
  AuthInterceptor
} from "./chunk-A3PZ3JQ2.js";
import "./chunk-ZDDERD6Z.js";
import {
  MatDialogModule
} from "./chunk-UVEQGFJV.js";
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

// src/app/adminpanel/modules/casebuilder/casebuilder-routing.module.ts
var routes = [
  { path: "", redirectTo: "casecreation", pathMatch: "full" },
  { path: "casecreation/:id", loadComponent: () => import("./chunk-E2MKSLLA.js").then((m) => m.CasecreationComponent) },
  { path: "teamsetup/:id", loadComponent: () => import("./chunk-IVI7NLYG.js").then((m) => m.TeamsetupComponent) }
];
var CasebuilderRoutingModule = class _CasebuilderRoutingModule {
  static {
    this.\u0275fac = function CasebuilderRoutingModule_Factory(t) {
      return new (t || _CasebuilderRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _CasebuilderRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/adminpanel/modules/casebuilder/casebuilder.module.ts
var CasebuilderModule = class _CasebuilderModule {
  static {
    this.\u0275fac = function CasebuilderModule_Factory(t) {
      return new (t || _CasebuilderModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _CasebuilderModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, CaseBuilderService, TeamsetupService, UserService, CasedetailService], imports: [
      CommonModule,
      CasebuilderRoutingModule,
      HttpClientModule,
      MatDialogModule
    ] });
  }
};
export {
  CasebuilderModule
};
//# sourceMappingURL=chunk-OSA4PNQF.js.map
