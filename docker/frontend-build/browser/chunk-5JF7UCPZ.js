import {
  FileSelectionService
} from "./chunk-LQXMUOGJ.js";
import {
  CheckDuplicacyService,
  UploadManagementService
} from "./chunk-AGZ7TUOA.js";
import {
  FileStorageService
} from "./chunk-MQ6OVKEO.js";
import {
  UploadService
} from "./chunk-ZP7PHFH3.js";
import "./chunk-3B3MCZKM.js";
import "./chunk-55ITPE7H.js";
import {
  AuthInterceptor
} from "./chunk-A3PZ3JQ2.js";
import "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import "./chunk-CIO7JDBK.js";
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

// src/app/adminpanel/modules/uploadmanager/uploadmanager-routing.module.ts
var routes = [
  { path: "", redirectTo: "uploadmanager", pathMatch: "full" },
  { path: "uploadmanager/:id", loadComponent: () => import("./chunk-PKJGBSAF.js").then((m) => m.UploadmanagerComponent) },
  { path: "uploadreport/:id", loadComponent: () => import("./chunk-R3BOFXRU.js").then((m) => m.UploadreportComponent) }
];
var UploadmanagerRoutingModule = class _UploadmanagerRoutingModule {
  static {
    this.\u0275fac = function UploadmanagerRoutingModule_Factory(t) {
      return new (t || _UploadmanagerRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _UploadmanagerRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/adminpanel/modules/uploadmanager/uploadmanager.module.ts
var UploadmanagerModule = class _UploadmanagerModule {
  static {
    this.\u0275fac = function UploadmanagerModule_Factory(t) {
      return new (t || _UploadmanagerModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _UploadmanagerModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, FileStorageService, FileSelectionService, UploadService, CheckDuplicacyService, UploadManagementService], imports: [
      CommonModule,
      UploadmanagerRoutingModule,
      HttpClientModule
    ] });
  }
};
export {
  UploadmanagerModule
};
//# sourceMappingURL=chunk-5JF7UCPZ.js.map
