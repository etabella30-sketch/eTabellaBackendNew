import {
  require_moment
} from "./chunk-BXSF7XA6.js";
import {
  EventEmitter,
  __toESM,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵdefer,
  ɵɵdeferOnIdle,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/datetime/datetime.component.ts
var import_moment = __toESM(require_moment());
var DatetimeComponent_Defer_2_DepsFn = () => [import("./chunk-ZQORQA3V.js").then((m) => m.DatepickerComponent)];
var DatetimeComponent_Defer_5_DepsFn = () => [import("./chunk-J54FHKN3.js").then((m) => m.TimepickerComponent)];
function DatetimeComponent_Defer_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "datepicker", 1);
    \u0275\u0275listener("dateChange", function DatetimeComponent_Defer_1_Template_datepicker_dateChange_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnDateChange($event, "dt1"));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("date", ctx_r1.dt)("disabled", ctx_r1.disabled)("type", ctx_r1.type);
  }
}
function DatetimeComponent_Defer_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "timepicker", 2);
    \u0275\u0275listener("timeChange", function DatetimeComponent_Defer_4_Template_timepicker_timeChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnTimeChange($event, "tm1"));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("time", ctx_r1.tm)("disabled", ctx_r1.disabled);
  }
}
var DatetimeComponent = class _DatetimeComponent {
  constructor() {
    this.date = (0, import_moment.default)().format("YYYY-MM-DD hh:mm A");
    this.type = "T";
    this.dateChange = new EventEmitter();
    this.disabled = false;
  }
  ngOnInit() {
    if (isNaN(new Date(this.date).getTime())) {
      this.date = (0, import_moment.default)().format("YYYY-MM-DD hh:mm A");
    }
    this.dt = (0, import_moment.default)(new Date(this.date)).format("YYYY-MM-DD");
    this.tm = (0, import_moment.default)(new Date(this.date)).format("hh:mm A");
    this.bindDT();
  }
  OnDateChange(e, column) {
    this.dt = (0, import_moment.default)(new Date(e)).format("YYYY-MM-DD");
    this.bindDT();
  }
  OnTimeChange(e, column) {
    this.tm = e;
    this.bindDT();
  }
  bindDT() {
    this.date = `${this.dt} ${this.tm}`;
    this.dateChange.emit(this.date);
  }
  static {
    this.\u0275fac = function DatetimeComponent_Factory(t) {
      return new (t || _DatetimeComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DatetimeComponent, selectors: [["datetime"]], inputs: { date: "date", type: "type", disabled: "disabled" }, outputs: { dateChange: "dateChange" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 7, vars: 0, consts: [[1, "flex", "gap-2"], [3, "dateChange", "date", "disabled", "type"], [3, "timeChange", "time", "disabled"]], template: function DatetimeComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275template(1, DatetimeComponent_Defer_1_Template, 1, 3);
        \u0275\u0275defer(2, 1, DatetimeComponent_Defer_2_DepsFn);
        \u0275\u0275deferOnIdle();
        \u0275\u0275template(4, DatetimeComponent_Defer_4_Template, 1, 2);
        \u0275\u0275defer(5, 4, DatetimeComponent_Defer_5_DepsFn);
        \u0275\u0275deferOnIdle();
        \u0275\u0275elementEnd();
      }
    }, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DatetimeComponent, { className: "DatetimeComponent", filePath: "src\\app\\shared\\components\\datetime\\datetime.component.ts", lineNumber: 14 });
})();

export {
  DatetimeComponent
};
//# sourceMappingURL=chunk-RG2H6CLM.js.map
