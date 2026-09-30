import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/pdf/components/facts/factbox/factbox.component.ts
function FactboxComponent_h6_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "h6", 5)(1, "mat-checkbox", 6);
    \u0275\u0275twoWayListener("ngModelChange", function FactboxComponent_h6_0_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.bIsHighlighted, $event) || (ctx_r1.bIsHighlighted = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(2, "span", 7);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275classMap(!ctx_r1.bIsHighlighted ? "" : "saturate-0 brightness-[3.5]");
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.bIsHighlighted);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(4, 4, "FACTS.BOX.USE_HIGHLIGHTS"), " ");
  }
}
function FactboxComponent_ng_container_3_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 9);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("innerHTML", ctx_r1.jOT, \u0275\u0275sanitizeHtml);
  }
}
function FactboxComponent_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FactboxComponent_ng_container_3_div_1_Template, 1, 1, "div", 8);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.jOT);
  }
}
function FactboxComponent_ng_container_4_hr_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "hr", 12);
  }
}
function FactboxComponent_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "div", 10);
    \u0275\u0275template(2, FactboxComponent_ng_container_4_hr_2_Template, 1, 0, "hr", 11);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    const i_r4 = ctx.index;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("innerHTML", x_r3, \u0275\u0275sanitizeHtml);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", i_r4 != (ctx_r1.jTexts == null ? null : ctx_r1.jTexts.length) - 1);
  }
}
var FactboxComponent = class _FactboxComponent {
  constructor() {
    this.inTable = false;
    this.mode = "dark";
    this.jTexts = [];
    this.classList = "";
    this.jOT = [];
    this.bIsHighlighted = false;
    this.isLarge = false;
    this.ishilight = false;
  }
  static {
    this.\u0275fac = function FactboxComponent_Factory(t) {
      return new (t || _FactboxComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FactboxComponent, selectors: [["factbox"]], inputs: { inTable: "inTable", mode: "mode", jTexts: "jTexts", classList: "classList", jOT: "jOT", bIsHighlighted: "bIsHighlighted", isLarge: "isLarge", ishilight: "ishilight" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 5, vars: 8, consts: [["class", "text-xs text-end font-semibold mb-1 pointer-events-none focus-visible:outline-none focus-visible:border-gray-400", "for", "factBox", 3, "class", 4, "ngIf"], [1, "h-fit", "border-tab", "p-0.5", "rounded-base", 3, "ngClass"], [1, "min-h-5", "max-h-[100px]", "rounded-base", "text-xs", "px-2.5", "overflow-auto"], [4, "ngIf"], [4, "ngFor", "ngForOf"], ["for", "factBox", 1, "text-xs", "text-end", "font-semibold", "mb-1", "pointer-events-none", "focus-visible:outline-none", "focus-visible:border-gray-400"], [3, "ngModelChange", "ngModel"], [1, "brightness-[0.3]", "pointer-events-none"], ["class", " bg-reply rounded-md px-1 text-xs opacity-70 py-2.5 focus-visible:!border-none focus-visible:!outline-none focus:!border-none focus:!outline-none parent", 3, "innerHTML", 4, "ngFor", "ngForOf"], [1, "bg-reply", "rounded-md", "px-1", "text-xs", "opacity-70", "py-2.5", "focus-visible:!border-none", "focus-visible:!outline-none", "focus:!border-none", "focus:!outline-none", "parent", 3, "innerHTML"], [1, "overflow-auto", "text-xs", "py-3", "note-text", "focus-visible:!border-none", "focus-visible:!outline-none", "focus:!border-none", "focus:!outline-none", 3, "innerHTML"], ["class", "mt-2 border-tab", 4, "ngIf"], [1, "mt-2", "border-tab"]], template: function FactboxComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, FactboxComponent_h6_0_Template, 5, 6, "h6", 0);
        \u0275\u0275elementStart(1, "div", 1)(2, "div", 2);
        \u0275\u0275template(3, FactboxComponent_ng_container_3_Template, 2, 1, "ng-container", 3)(4, FactboxComponent_ng_container_4_Template, 3, 2, "ng-container", 4);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", ctx.ishilight && ctx.bIsHighlighted && !ctx.inTable);
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", ctx.mode == "light" ? "bg-white text-grey border-2" : " border-4");
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.classList);
        \u0275\u0275classProp("max-h-36", ctx.isLarge);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.bIsHighlighted);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.jTexts);
      }
    }, dependencies: [MatCheckboxModule, MatCheckbox, FormsModule, NgControlStatus, NgModel, CommonModule, NgClass, NgForOf, NgIf, TranslateModule, TranslatePipe], styles: ["\n\n.note-text[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  text-align: justify;\n  text-justify: inter-word;\n}\n/*# sourceMappingURL=factbox.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FactboxComponent, { className: "FactboxComponent", filePath: "src\\app\\pdf\\components\\facts\\factbox\\factbox.component.ts", lineNumber: 14 });
})();

export {
  FactboxComponent
};
//# sourceMappingURL=chunk-TCIDVFXD.js.map
