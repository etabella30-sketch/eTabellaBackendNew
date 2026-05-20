import {
  CommonModule,
  NgClass,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵpureFunction4
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/skeleton/skeleton.component.ts
var _c0 = (a0, a1) => ({ "height": a0, "width": a1 });
var _c1 = (a0, a1, a2, a3) => ({ "bg-gray-50": a0, "bg-gray-300": a1, "bg-gray-600": a2, "!rounded-full": a3 });
var SkeletonComponent = class _SkeletonComponent {
  constructor() {
    this.height = "10px";
    this.width = "100px";
    this.bg = "light";
    this.isavatar = false;
  }
  static {
    this.\u0275fac = function SkeletonComponent_Factory(t) {
      return new (t || _SkeletonComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SkeletonComponent, selectors: [["sklton"]], inputs: { height: "height", width: "width", bg: "bg", isavatar: "isavatar" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 1, vars: 10, consts: [[1, "animate-pulse", "rounded-lg", 3, "ngStyle", "ngClass"]], template: function SkeletonComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275element(0, "div", 0);
      }
      if (rf & 2) {
        \u0275\u0275property("ngStyle", \u0275\u0275pureFunction2(2, _c0, ctx.height, ctx.width))("ngClass", \u0275\u0275pureFunction4(5, _c1, ctx.bg == "light", ctx.bg == "base", ctx.bg == "dark", ctx.isavatar));
      }
    }, dependencies: [CommonModule, NgClass, NgStyle] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SkeletonComponent, { className: "SkeletonComponent", filePath: "src\\app\\shared\\components\\skeleton\\skeleton.component.ts", lineNumber: 11 });
})();

export {
  SkeletonComponent
};
//# sourceMappingURL=chunk-KEJC4ZXM.js.map
