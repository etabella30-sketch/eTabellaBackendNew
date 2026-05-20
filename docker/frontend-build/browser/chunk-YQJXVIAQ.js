import {
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  CommonModule,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate3
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/doccard/doccard.component.ts
function DoccardComponent_img_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 9);
  }
}
function DoccardComponent_img_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 10);
  }
}
function DoccardComponent_img_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 11);
  }
}
function DoccardComponent_img_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 12);
  }
}
function DoccardComponent_h6_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Exhibit No ", ctx_r0.detail == null ? null : ctx_r0.detail.cExhibitno, "");
  }
}
var DoccardComponent = class _DoccardComponent {
  get buttonClasses() {
    return `${this.addcls} || ''}`;
  }
  static {
    this.\u0275fac = function DoccardComponent_Factory(t) {
      return new (t || _DoccardComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DoccardComponent, selectors: [["doccard"]], inputs: { detail: "detail", addcls: "addcls" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 11, vars: 10, consts: [[1, "p-5", "w-full", "flex", "gap-6", "bg-white", "shadow-[0_3px_10px_#94949440]", "rounded-base", "cursor-pointer", 3, "ngClass"], ["src", "./assets/icons/doc-icons/pdf.svg", "class", "thumbnail size-20", 4, "ngIf"], ["src", "assets/icons/doc-icons/word.svg", "class", "size-20", 4, "ngIf"], ["src", "assets/icons/doc-icons/xlsx.png", "width", "80px", "height", "80px", "class", "size-20", 4, "ngIf"], ["src", "assets/icons/doc-icons/mp3.svg", "class", "size-20", 4, "ngIf"], [1, "w-[calc(100%_-_100px)]"], [1, "text-xs", "font-semibold", "brak-word", "truncate", "w-full"], [1, "text-xxs", "mt-1"], ["class", "text-xxs mt-1", 4, "ngIf"], ["src", "./assets/icons/doc-icons/pdf.svg", 1, "thumbnail", "size-20"], ["src", "assets/icons/doc-icons/word.svg", 1, "size-20"], ["src", "assets/icons/doc-icons/xlsx.png", "width", "80px", "height", "80px", 1, "size-20"], ["src", "assets/icons/doc-icons/mp3.svg", 1, "size-20"]], template: function DoccardComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275template(1, DoccardComponent_img_1_Template, 1, 0, "img", 1)(2, DoccardComponent_img_2_Template, 1, 0, "img", 2)(3, DoccardComponent_img_3_Template, 1, 0, "img", 3)(4, DoccardComponent_img_4_Template, 1, 0, "img", 4);
        \u0275\u0275elementStart(5, "div", 5)(6, "h6", 6);
        \u0275\u0275text(7);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(8, "h6", 7);
        \u0275\u0275text(9);
        \u0275\u0275elementEnd();
        \u0275\u0275template(10, DoccardComponent_h6_10_Template, 2, 1, "h6", 8);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", ctx.buttonClasses);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.detail == null ? null : ctx.detail.cFiletype) == "PDF");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.detail == null ? null : ctx.detail.cFiletype) == "DOCX");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.detail == null ? null : ctx.detail.cFiletype) == "XL");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.detail == null ? null : ctx.detail.cFiletype) == "MP3");
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate((ctx.detail == null ? null : ctx.detail.cName) || (ctx.detail == null ? null : ctx.detail.cFilename) || "");
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate3("[ ", (ctx.detail == null ? null : ctx.detail.cBundletag) ? ctx.detail == null ? null : ctx.detail.cBundletag : "-", " | ", (ctx.detail == null ? null : ctx.detail.cTab) ? ctx.detail == null ? null : ctx.detail.cTab : "-", " |", (ctx.detail == null ? null : ctx.detail.cPage) ? ctx.detail == null ? null : ctx.detail.cPage : "-", " ] ");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.detail == null ? null : ctx.detail.cExhibitno);
      }
    }, dependencies: [CommonModule, NgClass, NgIf, MatCheckboxModule] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DoccardComponent, { className: "DoccardComponent", filePath: "src\\app\\shared\\components\\doccard\\doccard.component.ts", lineNumber: 12 });
})();

export {
  DoccardComponent
};
//# sourceMappingURL=chunk-YQJXVIAQ.js.map
