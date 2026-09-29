import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/empty/empty.component.ts
var _c0 = ["*"];
function EmptyComponent_icon_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 4);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("name", ctx_r0.icon.name)("type", ctx_r0.icon.type ? ctx_r0.icon.type : "commonicn");
  }
}
function EmptyComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 2);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.head);
  }
}
function EmptyComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 3);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", ctx_r0.subcls ? ctx_r0.subcls : "text-blue-hover");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.desc);
  }
}
var EmptyComponent = class _EmptyComponent {
  constructor() {
    this.head = "";
    this.desc = "";
    this.addcls = "";
    this.subcls = "";
  }
  get addClasses() {
    return `${this.addcls} || ''}`;
  }
  static {
    this.\u0275fac = function EmptyComponent_Factory(t) {
      return new (t || _EmptyComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EmptyComponent, selectors: [["empty"]], inputs: { icon: "icon", head: "head", desc: "desc", addcls: "addcls", subcls: "subcls" }, standalone: true, features: [\u0275\u0275StandaloneFeature], ngContentSelectors: _c0, decls: 5, vars: 4, consts: [[1, "h-full", "w-full", "bg-light-blue", "border", "border-dashed", "border-blue-hover", "rounded-base", "flex", "flex-col", "items-center", "justify-center", 3, "ngClass"], [3, "name", "type", 4, "ngIf"], [1, "text-lg", "text-blue-hover"], [1, "text-xxs", 3, "ngClass"], [3, "name", "type"]], template: function EmptyComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275projectionDef();
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275template(1, EmptyComponent_icon_1_Template, 1, 2, "icon", 1)(2, EmptyComponent_Conditional_2_Template, 2, 1, "h6", 2)(3, EmptyComponent_Conditional_3_Template, 2, 2, "h6", 3);
        \u0275\u0275projection(4);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", ctx.addClasses);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.icon);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.head ? 2 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(3, ctx.desc ? 3 : -1);
      }
    }, dependencies: [CommonModule, NgClass, NgIf, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EmptyComponent, { className: "EmptyComponent", filePath: "src\\app\\shared\\components\\empty\\empty.component.ts", lineNumber: 12 });
})();

export {
  EmptyComponent
};
//# sourceMappingURL=chunk-DHVW7RW5.js.map
