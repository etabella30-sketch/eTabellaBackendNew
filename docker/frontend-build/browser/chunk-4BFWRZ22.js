import {
  VariablesService
} from "./chunk-D2JKPWBT.js";
import {
  CommonModule,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  InputFlags,
  booleanAttribute,
  ɵsetClassDebugInfo,
  ɵɵInputTransformsFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵtemplate
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/button/button.component.ts
var _c0 = ["*"];
var _c1 = (a0) => ({ "opacity-0": a0 });
var _c2 = (a0) => ({ "!border-brand": a0 });
function ButtonComponent_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 3);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(\u0275\u0275pureFunction1(2, _c2, ctx_r0.mode == "outlined" || ctx_r0.loader == "dark"));
  }
}
var ButtonComponent = class _ButtonComponent {
  get isDisabledClass() {
    return this.disabled;
  }
  constructor(vs) {
    this.vs = vs;
    this.mode = "solid";
    this.text = "";
    this.disabled = false;
    this.square = false;
    this.addcls = "";
    this.isloading = false;
    this.loader = "";
    this.issmall = false;
    this.active = false;
    this.noborder = false;
  }
  get buttonClasses() {
    const variants = this.vs.btnvarnt;
    const modeClass = variants[this.mode] ?? "";
    const activeClass = this.active ? variants["active"] ?? "" : "";
    const noBorderClass = this.noborder ? variants["noborder"] ?? "" : "";
    return `${this.addcls} ${activeClass} ${noBorderClass} ${modeClass}`.trim();
  }
  static {
    this.\u0275fac = function ButtonComponent_Factory(t) {
      return new (t || _ButtonComponent)(\u0275\u0275directiveInject(VariablesService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ButtonComponent, selectors: [["btn"]], hostVars: 2, hostBindings: function ButtonComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275classProp("disabledbtn", ctx.isDisabledClass);
      }
    }, inputs: { mode: "mode", text: "text", disabled: "disabled", square: [InputFlags.HasDecoratorInputTransform, "square", "square", booleanAttribute], addcls: "addcls", isloading: "isloading", loader: "loader", issmall: [InputFlags.HasDecoratorInputTransform, "issmall", "issmall", booleanAttribute], active: [InputFlags.HasDecoratorInputTransform, "active", "active", booleanAttribute], noborder: [InputFlags.HasDecoratorInputTransform, "noborder", "noborder", booleanAttribute] }, standalone: true, features: [\u0275\u0275InputTransformsFeature, \u0275\u0275StandaloneFeature], ngContentSelectors: _c0, decls: 4, vars: 6, consts: [["type", "button", 1, "px-3", "py-2", "inline-flex", "items-center", "justify-center", "gap-x-2", "text-xs", "rounded-base", "whitespace-nowrap", "relative", 3, "ngClass", "disabled"], [1, "flex", "items-center", "justify-center", "w-full", "gap-2", 3, "ngClass"], ["class", "loader absolute", 3, "class", 4, "ngIf"], [1, "loader", "absolute"]], template: function ButtonComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275projectionDef();
        \u0275\u0275elementStart(0, "button", 0)(1, "span", 1);
        \u0275\u0275projection(2);
        \u0275\u0275elementEnd();
        \u0275\u0275template(3, ButtonComponent_span_3_Template, 1, 4, "span", 2);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", ctx.buttonClasses + (ctx.square ? ctx.issmall ? " min-h-6 min-w-6 max-h-6 max-w-6 !p-0 h-6 w-6 rounded-lg " : " min-h-8.5 min-w-8.5 max-h-8.5 max-w-8.5 !px-0 text-xs " : ""))("disabled", ctx.disabled || ctx.isloading);
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(4, _c1, ctx.isloading));
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.isloading);
      }
    }, dependencies: [CommonModule, NgClass, NgIf], styles: ["\n\n.loader[_ngcontent-%COMP%] {\n  width: 18px;\n  height: 18px;\n  border: 2.5px solid #FFF;\n  border-bottom-color: transparent;\n  border-radius: 50%;\n  display: inline-block;\n  box-sizing: border-box;\n  animation: _ngcontent-%COMP%_rotation 1s linear infinite;\n}\n@keyframes _ngcontent-%COMP%_rotation {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.disabledbtn[_nghost-%COMP%] {\n  pointer-events: none;\n  opacity: 0.8;\n}\n/*# sourceMappingURL=button.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ButtonComponent, { className: "ButtonComponent", filePath: "src\\app\\shared\\components\\button\\button.component.ts", lineNumber: 12 });
})();

export {
  ButtonComponent
};
//# sourceMappingURL=chunk-4BFWRZ22.js.map
