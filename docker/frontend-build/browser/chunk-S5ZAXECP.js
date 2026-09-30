import {
  IndexingService
} from "./chunk-2UGN5HX6.js";
import {
  PaginationService
} from "./chunk-3FBNC3RN.js";
import {
  BundlemanageService
} from "./chunk-TR5DVTEU.js";
import {
  BatchfileService
} from "./chunk-JNLZBNDU.js";
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

// src/app/adminpanel/modules/bundlemanagement/bundlemanagement-routing.module.ts
var routes = [
  { path: "", redirectTo: "bundlemanagement", pathMatch: "full" },
  { path: "bundlemanagement/:id", loadComponent: () => import("./chunk-MQAKSGMK.js").then((m) => m.BundlemanagementComponent) }
];
var BundlemanagementRoutingModule = class _BundlemanagementRoutingModule {
  static {
    this.\u0275fac = function BundlemanagementRoutingModule_Factory(t) {
      return new (t || _BundlemanagementRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _BundlemanagementRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/adminpanel/modules/bundlemanagement/bundlemanagement.module.ts
var BundlemanagementModule = class _BundlemanagementModule {
  static {
    this.\u0275fac = function BundlemanagementModule_Factory(t) {
      return new (t || _BundlemanagementModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _BundlemanagementModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [
      { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      BundlemanageService,
      IndexingService,
      PaginationService,
      BatchfileService
    ], imports: [
      CommonModule,
      BundlemanagementRoutingModule,
      HttpClientModule,
      MatDialogModule
    ] });
  }
};
export {
  BundlemanagementModule
};
//# sourceMappingURL=chunk-S5ZAXECP.js.map
