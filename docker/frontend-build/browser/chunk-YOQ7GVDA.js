import {
  require_moment
} from "./chunk-BXSF7XA6.js";
import {
  CommonModule,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  __toESM,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/marking/components/fact/date-show/date-show.component.ts
var moment = __toESM(require_moment());
function DateShowComponent_span_0_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.datePrefix, " : ");
  }
}
function DateShowComponent_span_0_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" - ", ctx_r0.dateText2, "");
  }
}
function DateShowComponent_span_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 1);
    \u0275\u0275template(1, DateShowComponent_span_0_ng_container_1_Template, 2, 1, "ng-container", 2);
    \u0275\u0275text(2);
    \u0275\u0275template(3, DateShowComponent_span_0_span_3_Template, 2, 1, "span", 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.showPrefix);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.dateText1, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.isRange);
  }
}
var DateShowComponent = class _DateShowComponent {
  constructor() {
    this.DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
    this.datePrefix = "On";
    this.isRange = false;
    this.dateText1 = "";
    this.dateText2 = "";
    this.showPrefix = true;
  }
  ngOnInit() {
    const display = this.formatJDate(this.jDate);
    this.datePrefix = display.prefix;
    this.isRange = display.isRange;
    this.dateText1 = display.text1;
    this.dateText2 = display.text2 || "";
  }
  formatJDate(jDate) {
    try {
      if (!jDate)
        return { prefix: "On", isRange: false, text1: "", text2: "" };
      const monthNames = moment.monthsShort();
      const safeMonth = (m) => {
        const n = Number(m);
        return isFinite(n) && n >= 1 && n <= 12 ? monthNames[n - 1] : "";
      };
      const fmtFull = (raw) => {
        if (!raw)
          return "";
        if (this.DATE_ONLY_RE.test(raw)) {
          return moment.utc(raw, "YYYY-MM-DD", true).format("M/D/YYYY, h:mm:ss A");
        }
        return moment.parseZone(raw).local().format("M/D/YYYY, h:mm:ss A");
      };
      const toMY = (r) => {
        if (!r)
          return "";
        const y = r.year || "";
        const m = safeMonth(r.month);
        if (m && y)
          return `${m}, ${y}`;
        if (y)
          return y;
        return "";
      };
      const prefixFromCValue = (cv, isRange2) => {
        if (cv === "Between" || isRange2)
          return "From to";
        return cv;
      };
      const rec = (jDate.record || []).slice(0, 2);
      const r1 = rec[0];
      const r2 = rec[1];
      let text1 = "";
      let text2 = "";
      let isRange = false;
      if (jDate.type === "D") {
        const d1 = fmtFull(r1?.date);
        const d2 = fmtFull(r2?.date);
        if (d1 && d2) {
          isRange = d1 !== d2;
          text1 = d1;
          text2 = isRange ? d2 : "";
        } else {
          text1 = d1 || d2 || "";
        }
      } else if (jDate.type === "MY") {
        const m1 = toMY(r1);
        const m2 = toMY(r2);
        if (m1 && m2) {
          isRange = m1 !== m2;
          text1 = m1;
          text2 = isRange ? m2 : "";
        } else {
          text1 = m1 || m2 || "";
        }
      } else if (jDate.type === "Y") {
        const y1 = r1?.year || "";
        const y2 = r2?.year || "";
        if (y1 && y2) {
          isRange = y1 !== y2;
          text1 = y1;
          text2 = isRange ? y2 : "";
        } else {
          text1 = y1 || y2 || "";
        }
      }
      const prefix = prefixFromCValue(jDate.cValue, isRange);
      return { prefix, isRange, text1, text2: isRange ? text2 : void 0 };
    } catch {
      return { prefix: "On", isRange: false, text1: "", text2: "" };
    }
  }
  static {
    this.\u0275fac = function DateShowComponent_Factory(t) {
      return new (t || _DateShowComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DateShowComponent, selectors: [["date-show"]], inputs: { jDate: "jDate", showPrefix: "showPrefix" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 1, vars: 1, consts: [["class", "block w-full", 4, "ngIf"], [1, "block", "w-full"], [4, "ngIf"]], template: function DateShowComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, DateShowComponent_span_0_Template, 4, 3, "span", 0);
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", ctx.dateText1);
      }
    }, dependencies: [CommonModule, NgIf] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DateShowComponent, { className: "DateShowComponent", filePath: "src\\app\\marking\\components\\fact\\date-show\\date-show.component.ts", lineNumber: 13 });
})();

export {
  DateShowComponent
};
//# sourceMappingURL=chunk-YOQ7GVDA.js.map
