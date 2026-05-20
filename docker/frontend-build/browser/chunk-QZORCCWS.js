import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  CommonModule,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  AfterRenderPhase,
  afterNextRender,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵloadQuery,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/myfiles/tabletrunc/tabletrunc.component.ts
var _c0 = ["flname"];
var _c1 = (a0) => ({ "!pe-0": a0 });
var TabletruncComponent = class _TabletruncComponent {
  constructor() {
    this.noPadding = false;
    this.addcls = "";
    this.isTruncated = false;
    this.callcatched = false;
    afterNextRender(() => {
      this.checkTruncate();
    }, { phase: AfterRenderPhase.MixedReadWrite });
  }
  ngAfterViewInit() {
  }
  ngOnChanges(changes) {
    if (changes["callcatched"]) {
      this.checkTruncate();
    }
  }
  checkTruncate() {
    if (!this.flname)
      return;
    const elm = this.flname.nativeElement;
    const clone = elm.cloneNode(true);
    clone.style.width = "fit-content";
    clone.style.position = "absolute";
    clone.style.visibility = "hidden";
    clone.style.whiteSpace = "nowrap";
    elm.parentElement.appendChild(clone);
    this.isTruncated = clone.clientWidth > elm.parentElement.clientWidth;
    clone.remove();
  }
  static {
    this.\u0275fac = function TabletruncComponent_Factory(t) {
      return new (t || _TabletruncComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TabletruncComponent, selectors: [["app-tabletrunc"]], viewQuery: function TabletruncComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.flname = _t.first);
      }
    }, inputs: { value: "value", noPadding: "noPadding", addcls: "addcls", callcatched: "callcatched" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 7, consts: [["flname", ""], ["matTooltipShowDelay", "200", 1, "h-4", "overflow-hidden", "break-all", "pe-3", "whitespace-nowrap", "w-full", "truncate", "absolute", 3, "matTooltip", "ngClass"]], template: function TabletruncComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1, 0);
        \u0275\u0275text(2);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275classMap(ctx.addcls);
        \u0275\u0275property("matTooltip", ctx.isTruncated ? ctx.value : "")("ngClass", \u0275\u0275pureFunction1(5, _c1, ctx.noPadding));
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", ctx.value, "\n");
      }
    }, dependencies: [CommonModule, NgClass, MatTooltipModule, MatTooltip], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TabletruncComponent, { className: "TabletruncComponent", filePath: "src\\app\\shared\\components\\myfiles\\tabletrunc\\tabletrunc.component.ts", lineNumber: 12 });
})();

export {
  TabletruncComponent
};
//# sourceMappingURL=chunk-QZORCCWS.js.map
