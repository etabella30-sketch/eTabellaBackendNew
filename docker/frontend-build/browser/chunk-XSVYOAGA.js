import {
  CommonModule,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵproperty,
  ɵɵstyleProp
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/progress/progress.component.ts
var ProgressComponent = class _ProgressComponent {
  constructor() {
    this.progress = 50;
    this.bgclass = "bg-gray-300";
    this.color = "bg-blue-on";
    this.percent = "I";
    this.height = 10;
  }
  static {
    this.\u0275fac = function ProgressComponent_Factory(t) {
      return new (t || _ProgressComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ProgressComponent, selectors: [["progress-bar"]], inputs: { progress: "progress", bgclass: "bgclass", color: "color", percent: "percent", height: "height" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 2, vars: 6, consts: [[1, "w-full", "rounded-full", "overflow-hidden", 3, "ngClass"], [1, "h-full", 3, "ngClass"]], template: function ProgressComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275element(1, "div", 1);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275styleProp("height", ctx.height, "px");
        \u0275\u0275property("ngClass", ctx.bgclass);
        \u0275\u0275advance();
        \u0275\u0275styleProp("width", ctx.progress + "%");
        \u0275\u0275property("ngClass", ctx.color);
      }
    }, dependencies: [CommonModule, NgClass] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ProgressComponent, { className: "ProgressComponent", filePath: "src\\app\\shared\\components\\progress\\progress.component.ts", lineNumber: 11 });
})();

export {
  ProgressComponent
};
//# sourceMappingURL=chunk-XSVYOAGA.js.map
