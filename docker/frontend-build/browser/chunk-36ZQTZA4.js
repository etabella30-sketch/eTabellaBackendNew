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
  HttpClient,
  HttpClientModule
} from "./chunk-EVEACXQX.js";
import {
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/pdf/modules/pdf/pdf-routing.module.ts
var routes = [
  { path: "", redirectTo: "pdf", pathMatch: "full" },
  { path: "pdf/:id", loadComponent: () => import("./chunk-5NXNXPND.js").then((m) => m.ViewerComponent) }
];
var PdfRoutingModule = class _PdfRoutingModule {
  static {
    this.\u0275fac = function PdfRoutingModule_Factory(t) {
      return new (t || _PdfRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _PdfRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/pdf/service/tool.service.ts
var ToolService = class _ToolService {
  constructor(http) {
    this.http = http;
  }
  static {
    this.\u0275fac = function ToolService_Factory(t) {
      return new (t || _ToolService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ToolService, factory: _ToolService.\u0275fac, providedIn: "root" });
  }
};

// src/app/pdf/modules/pdf/pdf.module.ts
var PdfModule = class _PdfModule {
  static {
    this.\u0275fac = function PdfModule_Factory(t) {
      return new (t || _PdfModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _PdfModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, ToolService], imports: [
      CommonModule,
      PdfRoutingModule,
      HttpClientModule
    ] });
  }
};
export {
  PdfModule
};
//# sourceMappingURL=chunk-36ZQTZA4.js.map
