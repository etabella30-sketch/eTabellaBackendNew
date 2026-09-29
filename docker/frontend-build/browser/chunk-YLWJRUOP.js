import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepicker,
  MatDatepickerActions,
  MatDatepickerCancel,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle,
  MatEndDate,
  MatStartDate
} from "./chunk-X3RSWYEV.js";
import {
  MatInput,
  MatInputModule
} from "./chunk-XTSEIZ7V.js";
import {
  MatSuffix
} from "./chunk-Y2GGPNYR.js";
import {
  require_moment
} from "./chunk-BXSF7XA6.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  MatNativeDateModule,
  provideNativeDateAdapter
} from "./chunk-4SC6BA7R.js";
import {
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  __toESM,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/datepicker/datepicker.component.ts
var import_moment = __toESM(require_moment());
function DatepickerComponent_Conditional_0_Conditional_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-datepicker-actions")(1, "btn", 8);
    \u0275\u0275listener("click", function DatepickerComponent_Conditional_0_Conditional_0_Conditional_4_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.clearDate());
    });
    \u0275\u0275text(2, "Clear");
    \u0275\u0275elementEnd()();
  }
}
function DatepickerComponent_Conditional_0_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "input", 5);
    \u0275\u0275listener("click", function DatepickerComponent_Conditional_0_Conditional_0_Template_input_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const custdatepicker_r2 = \u0275\u0275reference(3);
      return \u0275\u0275resetView(custdatepicker_r2.open());
    });
    \u0275\u0275twoWayListener("ngModelChange", function DatepickerComponent_Conditional_0_Conditional_0_Template_input_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r2.selectedDate, $event) || (ctx_r2.selectedDate = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("dateChange", function DatepickerComponent_Conditional_0_Conditional_0_Template_input_dateChange_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onDateChange($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "mat-datepicker", 6, 0);
    \u0275\u0275listener("closedStream", function DatepickerComponent_Conditional_0_Conditional_0_Template_mat_datepicker_closedStream_2_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onPickerClosed());
    })("opened", function DatepickerComponent_Conditional_0_Conditional_0_Template_mat_datepicker_opened_2_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onPickerOpened());
    });
    \u0275\u0275template(4, DatepickerComponent_Conditional_0_Conditional_0_Conditional_4_Template, 3, 0, "mat-datepicker-actions");
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "mat-datepicker-toggle", 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const custdatepicker_r2 = \u0275\u0275reference(3);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r2.addcls);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r2.disabled)("matDatepicker", custdatepicker_r2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.selectedDate);
    \u0275\u0275property("min", ctx_r2.minDate)("max", ctx_r2.maxDate);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(4, ctx_r2.enableCustomAction ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.noIcon ? "!hidden" : "");
    \u0275\u0275property("for", custdatepicker_r2);
  }
}
function DatepickerComponent_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "input", 10);
    \u0275\u0275twoWayListener("ngModelChange", function DatepickerComponent_Conditional_0_Conditional_1_Template_input_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r2.selectedDate, $event) || (ctx_r2.selectedDate = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("dateChange", function DatepickerComponent_Conditional_0_Conditional_1_Template_input_dateChange_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onDateChange($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(2, "btn", 11);
    \u0275\u0275element(3, "mat-datepicker-toggle", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-datepicker", null, 1)(6, "mat-datepicker-actions")(7, "button", 13);
    \u0275\u0275listener("click", function DatepickerComponent_Conditional_0_Conditional_1_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.clearDate());
    });
    \u0275\u0275text(8, "Clear");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const datepicker_r6 = \u0275\u0275reference(5);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("matDatepicker", datepicker_r6)("min", ctx_r2.minDate)("max", ctx_r2.maxDate);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.selectedDate);
    \u0275\u0275advance();
    \u0275\u0275property("hidden", ctx_r2.showrangelabel);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.noIcon ? "!hidden" : "");
    \u0275\u0275property("for", datepicker_r6);
  }
}
function DatepickerComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, DatepickerComponent_Conditional_0_Conditional_0_Template, 6, 11, "div", 3)(1, DatepickerComponent_Conditional_0_Conditional_1_Template, 9, 8);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, !ctx_r2.iconOnly ? 0 : 1);
  }
}
function DatepickerComponent_Conditional_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 15);
    \u0275\u0275text(1, "Start");
    \u0275\u0275elementEnd();
  }
}
function DatepickerComponent_Conditional_1_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1, "End");
    \u0275\u0275elementEnd();
  }
}
function DatepickerComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275listener("click", function DatepickerComponent_Conditional_1_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r7);
      const rangePicker_r8 = \u0275\u0275reference(8);
      return \u0275\u0275resetView(rangePicker_r8.open());
    });
    \u0275\u0275template(1, DatepickerComponent_Conditional_1_Conditional_1_Template, 2, 0, "span", 15);
    \u0275\u0275elementStart(2, "mat-date-range-input", 16)(3, "input", 17);
    \u0275\u0275listener("click", function DatepickerComponent_Conditional_1_Template_input_click_3_listener() {
      \u0275\u0275restoreView(_r7);
      const rangePicker_r8 = \u0275\u0275reference(8);
      return \u0275\u0275resetView(rangePicker_r8.open());
    });
    \u0275\u0275twoWayListener("ngModelChange", function DatepickerComponent_Conditional_1_Template_input_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.selectedStartDate, $event) || (ctx_r2.selectedStartDate = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "input", 18);
    \u0275\u0275listener("click", function DatepickerComponent_Conditional_1_Template_input_click_4_listener() {
      \u0275\u0275restoreView(_r7);
      const rangePicker_r8 = \u0275\u0275reference(8);
      return \u0275\u0275resetView(rangePicker_r8.open());
    });
    \u0275\u0275twoWayListener("ngModelChange", function DatepickerComponent_Conditional_1_Template_input_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.selectedEndDate, $event) || (ctx_r2.selectedEndDate = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("dateChange", function DatepickerComponent_Conditional_1_Template_input_dateChange_4_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onRangeChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(5, DatepickerComponent_Conditional_1_Conditional_5_Template, 2, 0, "span", 19);
    \u0275\u0275element(6, "mat-datepicker-toggle", 20)(7, "mat-date-range-picker", null, 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const rangePicker_r8 = \u0275\u0275reference(8);
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r2.addcls);
    \u0275\u0275classProp("px-2", !ctx_r2.showrangelabel)("cust-daterangepicker", ctx_r2.showrangelabel);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r2.showrangelabel && !ctx_r2.iconOnly ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.nolabel ? " -ms-1 invisible !p-0 !max-w-0 !w-0" : "");
    \u0275\u0275property("rangePicker", rangePicker_r8)("min", ctx_r2.minDate)("max", ctx_r2.maxDate);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.selectedStartDate);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.selectedEndDate);
    \u0275\u0275advance();
    \u0275\u0275conditional(5, ctx_r2.showrangelabel && !ctx_r2.iconOnly ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.noIcon ? "!hidden" : "");
    \u0275\u0275property("for", rangePicker_r8);
  }
}
var DatepickerComponent = class _DatepickerComponent {
  get hostBtRange() {
    return !!this.isRange;
  }
  constructor() {
    this.type = "T";
    this.dateChange = new EventEmitter();
    this.isRange = false;
    this.disabled = false;
    this.nolabel = false;
    this.defaultBlank = false;
    this.selectedStartDate = /* @__PURE__ */ new Date();
    this.selectedEndDate = /* @__PURE__ */ new Date();
    this.enableCustomAction = false;
    this.iconOnly = false;
    this.showrangelabel = false;
    this.disabledPrevious = false;
    this.today = /* @__PURE__ */ new Date();
    this.noIcon = false;
    this.noPlaceholder = false;
    this.addcls = "";
    this.minDate = new Date(1930, 0, 1);
    this.maxDate = /* @__PURE__ */ new Date();
  }
  ngOnInit() {
    if (this.type == "F") {
      this.maxDate = /* @__PURE__ */ new Date();
    }
    if (!this.defaultBlank)
      this.selectedDate = /* @__PURE__ */ new Date();
    if (this.date) {
      if (this.isRange && Array.isArray(this.date)) {
        this.setRange(new Date(this.date[0]), new Date(this.date[1]));
      } else {
        this.setDate(new Date(this.date));
      }
    }
  }
  ngOnChanges(changes) {
    if (changes["date"] && !changes["date"].firstChange) {
      this.selectedDate = this.date;
      if (!this.date) {
        this.selectedStartDate = null;
        this.selectedEndDate = null;
      }
    }
    if (changes["disabled"] && !changes["disabled"].firstChange) {
      this.disabled = this.disabled;
    }
    if (changes["noIcon"] && !changes["noIcon"].firstChange) {
      this.noIcon = this.noIcon;
    }
    if (changes["noIcon"]) {
      this.noIcon = this.noIcon;
    }
    if (changes["showrangelabel"]) {
      this.showrangelabel = this.showrangelabel;
    }
    if (changes["addcls"]) {
      this.addcls = this.addcls;
    }
  }
  onDateChange(e) {
    const formattedDate = (0, import_moment.default)(new Date(e.value)).format("YYYY-MM-DD");
    this.dateChange.emit(formattedDate);
  }
  onRangeChange() {
    const start = (0, import_moment.default)(new Date(this.selectedStartDate)).format("YYYY-MM-DD");
    const end = (0, import_moment.default)(new Date(this.selectedEndDate)).format("YYYY-MM-DD");
    this.dateChange.emit([start, end]);
  }
  // Function to update the date programmatically
  setDate(date) {
    this.selectedDate = date;
    this.dateChange.emit(date);
  }
  // Function to update the date range programmatically
  setRange(startDate, endDate) {
    this.selectedStartDate = startDate;
    this.selectedEndDate = endDate;
    this.dateChange.emit([startDate, endDate]);
  }
  clearDate() {
    console.log("Clearing");
    this.setDate(null);
  }
  onPickerClosed() {
    if (this.selectedDate) {
    }
  }
  onPickerOpened() {
    console.log("Datepicker opened");
  }
  static {
    this.\u0275fac = function DatepickerComponent_Factory(t) {
      return new (t || _DatepickerComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DatepickerComponent, selectors: [["datepicker"]], hostVars: 2, hostBindings: function DatepickerComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275classProp("bt-range", ctx.hostBtRange);
      }
    }, inputs: { type: "type", date: "date", isRange: "isRange", disabled: "disabled", nolabel: "nolabel", defaultBlank: "defaultBlank", enableCustomAction: "enableCustomAction", iconOnly: "iconOnly", showrangelabel: "showrangelabel", disabledPrevious: "disabledPrevious", noIcon: "noIcon", noPlaceholder: "noPlaceholder", addcls: "addcls", minDate: "minDate", maxDate: "maxDate" }, outputs: { dateChange: "dateChange" }, standalone: true, features: [\u0275\u0275ProvidersFeature([
      provideNativeDateAdapter()
    ]), \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [["custdatepicker", ""], ["datepicker", ""], ["rangePicker", ""], [1, "flex", "items-center", "relative", "border", "border-[#c2c2c2]", "rounded-base", "min-h-8.5", 3, "class"], [1, "flex", "items-center", "relative", "border", "border-[#c2c2c2]", "rounded-base", "min-h-8.5"], ["placeholder", "Select date", "readonly", "", "matInput", "", 1, "focus:border-none", "outline-none", "placeholder:text-grey", "cursor-pointer", "pe-5", "!border-none", "!shadow-none", "h-full", 3, "click", "ngModelChange", "dateChange", "disabled", "matDatepicker", "ngModel", "min", "max"], [3, "closedStream", "opened"], ["matSuffix", "", 1, "absolute", "top-1/2", "-translate-y-1/2", "right-2", 3, "for"], ["mat-button", "", "matDatepickerCancel", "", "mode", "white", 3, "click"], [1, "px-3", "w-0", "p-0", "h-0", "border-none"], ["placeholder", " Type/pick date", "matInput", "", 1, "p-0", "border-none", "!rounded-none", 3, "ngModelChange", "dateChange", "matDatepicker", "min", "max", "ngModel"], ["square", "", "mode", "outlined", 3, "hidden"], ["matIconSuffix", "", 3, "for"], ["mat-button", "", "matDatepickerCancel", "", 3, "click"], [1, "flex", "items-center", "relative", "border", "rounded-base", "min-h-8.5", "min-w-8.5", "justify-center", 3, "click"], [1, "absolute", "left-3", "text-xs", "top-1/2", "-translate-y-1/2", "z-10", "mt-px"], [1, "focus:border-none", "outline-none", "placeholder:!text-grey", "!cursor-pointer", "!pe-1", "!border-none", "!shadow-none", "!h-full", "!text-xs", 3, "rangePicker", "min", "max"], ["matStartDate", "", "placeholder", "Start date", "matInput", "", 1, "!shadow-none", 3, "click", "ngModelChange", "ngModel"], ["matEndDate", "", "placeholder", "End date", "matInput", "", 1, "!shadow-none", 3, "click", "ngModelChange", "dateChange", "ngModel"], [1, "absolute", "right-1/2", "translate-x-8", "text-xs", "top-1/2", "-translate-y-1/2", "z-10", "mt-px"], ["matSuffix", "", 3, "for"]], template: function DatepickerComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, DatepickerComponent_Conditional_0_Template, 2, 1)(1, DatepickerComponent_Conditional_1_Template, 9, 18);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, !ctx.isRange ? 0 : 1);
      }
    }, dependencies: [CommonModule, MatDatepickerModule, MatDatepicker, MatDatepickerInput, MatDatepickerToggle, MatDateRangeInput, MatStartDate, MatEndDate, MatDateRangePicker, MatDatepickerActions, MatDatepickerCancel, MatInputModule, MatInput, MatSuffix, MatNativeDateModule, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, ButtonComponent], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DatepickerComponent, { className: "DatepickerComponent", filePath: "src\\app\\shared\\components\\datepicker\\datepicker.component.ts", lineNumber: 30 });
})();

export {
  DatepickerComponent
};
//# sourceMappingURL=chunk-YLWJRUOP.js.map
