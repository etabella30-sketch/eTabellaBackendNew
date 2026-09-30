import {
  VariablesService
} from "./chunk-D2JKPWBT.js";
import {
  CommonModule,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵproperty,
  ɵɵpureFunction1
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/icon/icon.component.ts
var _c0 = (a0) => ({ "--fontfam": a0 });
var IconComponent = class _IconComponent {
  constructor(variablesService) {
    this.variablesService = variablesService;
    this.name = "";
    this.type = "comnicn";
    this.iconUnicode = "";
  }
  ngOnChanges(changes) {
    if (changes["name"] || changes["type"]) {
      this.updateIconUnicode();
    }
  }
  ngOnInit() {
    this.updateIconUnicode();
  }
  updateIconUnicode() {
    this.iconUnicode = this.variablesService.getIconUnicode(this.name, this.type);
  }
  static {
    this.\u0275fac = function IconComponent_Factory(t) {
      return new (t || _IconComponent)(\u0275\u0275directiveInject(VariablesService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _IconComponent, selectors: [["icon"]], inputs: { name: "name", type: "type" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 1, vars: 4, consts: [["datr", "", 1, "isIcon", "cursor-pointer", 3, "ngStyle"]], template: function IconComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275element(0, "i", 0);
      }
      if (rf & 2) {
        \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c0, ctx.type));
        \u0275\u0275attribute("data-icon", ctx.iconUnicode);
      }
    }, dependencies: [CommonModule, NgStyle], styles: ["\n\ni[_ngcontent-%COMP%]:before {\n  content: attr(data-icon);\n}\n/*# sourceMappingURL=icon.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(IconComponent, { className: "IconComponent", filePath: "src\\app\\shared\\components\\icon\\icon.component.ts", lineNumber: 12 });
})();

export {
  IconComponent
};
//# sourceMappingURL=chunk-MLRGQ4I6.js.map
