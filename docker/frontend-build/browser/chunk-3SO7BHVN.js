import {
  VariablesService
} from "./chunk-D2JKPWBT.js";
import {
  CommonModule,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/badge/badge.component.ts
var _c0 = ["*"];
var BadgeComponent = class _BadgeComponent {
  constructor(vs) {
    this.vs = vs;
    this.type = "solid";
    this.disabled = false;
    this.square = false;
    this.addcls = "";
  }
  get buttonClasses() {
    return `${this.addcls} ${this.vs.badgevarnt[this.type] || ""}`;
  }
  static {
    this.\u0275fac = function BadgeComponent_Factory(t) {
      return new (t || _BadgeComponent)(\u0275\u0275directiveInject(VariablesService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _BadgeComponent, selectors: [["badge"]], inputs: { type: "type", disabled: "disabled", square: "square", addcls: "addcls" }, standalone: true, features: [\u0275\u0275StandaloneFeature], ngContentSelectors: _c0, decls: 2, vars: 1, consts: [[1, "inline-flex", "items-center", "justify-center", "gap-x-1.5", "py-1.5", "px-3", "rounded-full", "text-xxs", "font-medium", 3, "ngClass"]], template: function BadgeComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275projectionDef();
        \u0275\u0275elementStart(0, "span", 0);
        \u0275\u0275projection(1);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", ctx.buttonClasses + (ctx.square ? " min-h-4 min-w-4 max-h-4  !px-0" : ""));
      }
    }, dependencies: [CommonModule, NgClass] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(BadgeComponent, { className: "BadgeComponent", filePath: "src\\app\\shared\\components\\badge\\badge.component.ts", lineNumber: 12 });
})();

export {
  BadgeComponent
};
//# sourceMappingURL=chunk-3SO7BHVN.js.map
