import {
  RouterModule
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/modules/transcript/transcript-routing.module.ts
var routes = [
  { path: "", redirectTo: "transcript", pathMatch: "full" },
  {
    path: "transcript",
    loadComponent: () => import("./chunk-GSVCQEG5.js").then((m) => m.TransscriptComponent)
  }
];
var TranscriptRoutingModule = class _TranscriptRoutingModule {
  static {
    this.\u0275fac = function TranscriptRoutingModule_Factory(t) {
      return new (t || _TranscriptRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _TranscriptRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [RouterModule.forChild(routes), RouterModule] });
  }
};

// src/app/adminpanel/modules/transcript/transcript.module.ts
var TranscriptModule = class _TranscriptModule {
  static {
    this.\u0275fac = function TranscriptModule_Factory(t) {
      return new (t || _TranscriptModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _TranscriptModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({ imports: [
      CommonModule,
      TranscriptRoutingModule
    ] });
  }
};
export {
  TranscriptModule
};
//# sourceMappingURL=chunk-37H5ZQW5.js.map
