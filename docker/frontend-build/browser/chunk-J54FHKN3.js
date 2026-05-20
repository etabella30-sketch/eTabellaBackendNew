import {
  DefaultValueAccessor,
  FormsModule,
  MaxLengthValidator,
  NgControlStatus,
  NgModel,
  PatternValidator
} from "./chunk-CIO7JDBK.js";
import "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵproperty,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/timepicker/timepicker.component.ts
var TimepickerComponent = class _TimepickerComponent {
  constructor() {
    this.time = "00:00 AM";
    this.timeChange = new EventEmitter();
    this.disabled = false;
  }
  ngOnInit() {
    console.log("time", this.time);
    this.timeH = this.getHour(/* @__PURE__ */ new Date(`01-01-2001 ${this.time}`));
    this.timeM = this.getMinutes(/* @__PURE__ */ new Date(`01-01-2001 ${this.time}`));
    this.ttype = this.getAMPM(/* @__PURE__ */ new Date(`01-01-2001 ${this.time}`));
  }
  preventNonNumeric(event) {
    if (![8, 9, 13, 27, 37, 38, 39, 40, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 189].includes(event.keyCode) && !event.ctrlKey && !event.metaKey && !(event.keyCode >= 96 && event.keyCode <= 105)) {
      event.preventDefault();
    }
  }
  handleMinuteInput(event, hourInput) {
    const input = event.target;
    if (event.key === "Backspace" && input.value.length === 0) {
      hourInput.focus();
    }
  }
  validateInput(event, type) {
    let value = event.target.value;
    value = this.onlyNumbers(value);
    event.target.value = value;
    var length = type == "H" ? 12 : 59;
    if (value !== "") {
      let num = parseInt(value, 10);
      if (num > length) {
        event.target.value = length;
      } else if (num < 0) {
        event.target.value = 0;
      }
    }
  }
  onlyNumbers(value) {
    return value.replace(/[^0-9-]/g, "");
  }
  handleHourInput(event, minInput) {
    const input = event.target;
    if (input.value.length === 2) {
      minInput.focus();
    }
  }
  getHour(dt) {
    return ("00" + Math.abs(new Date(dt).getHours() > 12 ? 12 - new Date(dt).getHours() : new Date(dt).getHours())).substr(-2);
  }
  getMinutes(dt) {
    return ("00" + new Date(dt).getMinutes()).substr(-2);
  }
  getAMPM(dt) {
    return new Date(dt).getHours() >= 12 ? "PM" : "AM";
  }
  setAMPM(value) {
    this.ttype = value;
    this.UpdateTime();
  }
  UpdateTime() {
    this.timeChange.emit(`${this.timeH}:${this.timeM} ${this.ttype}`);
  }
  static {
    this.\u0275fac = function TimepickerComponent_Factory(t) {
      return new (t || _TimepickerComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TimepickerComponent, selectors: [["timepicker"]], inputs: { time: "time", disabled: "disabled" }, outputs: { timeChange: "timeChange" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 18, vars: 10, consts: [["hour", ""], ["minut", ""], [1, "px-2", "border", "rounded-base", "h-8.5", "flex", "items-center", "w-fit", "bg-white", "border-[#c2c2c2]"], ["type", "tel", "pattern", "\\d*", "min", "0", "max", "12", "maxlength", "2", "placeholder", "HH", 1, "text-xs", "outline-none", "text-center", "mt-px", "px-0", "!border-none", "min-w-5", "!shadow-none", "!bg-transparent", 2, "max-width", "25px", 3, "keydown", "input", "keyup", "ngModelChange", "change", "ngModel", "disabled"], [1, "px-px"], ["type", "tel", "min", "1", "max", "12", "maxlength", "2", "pattern", "\\d*", "placeholder", "MM", 1, "text-xs", "text-center", "outline-none", "mt-px", "px-0", "!border-none", "min-w-5", "!shadow-none", "!bg-transparent", 2, "max-width", "25px", 3, "keydown", "keyup", "input", "ngModelChange", "change", "ngModel", "disabled"], [1, "flex", "w-fit", "gap-1", "ms-1"], [1, "inline-flex", "items-center", "justify-between", "w-fit", "px-2", "py-1", "text-center", "text-gray-500", "bg-white", "rounded-lg", "cursor-pointer", "hover:text-gray-600", "hover:bg-gray-100", 3, "click", "disabled"], [1, "block"], [1, "w-full", "text-xs", "font-semibold"]], template: function TimepickerComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "label", 2)(1, "input", 3, 0);
        \u0275\u0275listener("keydown", function TimepickerComponent_Template_input_keydown_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.preventNonNumeric($event));
        })("input", function TimepickerComponent_Template_input_input_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.validateInput($event, "H"));
        })("keyup", function TimepickerComponent_Template_input_keyup_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          const minut_r2 = \u0275\u0275reference(6);
          return \u0275\u0275resetView(ctx.handleHourInput($event, minut_r2));
        });
        \u0275\u0275twoWayListener("ngModelChange", function TimepickerComponent_Template_input_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.timeH, $event) || (ctx.timeH = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("change", function TimepickerComponent_Template_input_change_1_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.UpdateTime());
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(3, "span", 4);
        \u0275\u0275text(4, ":");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "input", 5, 1);
        \u0275\u0275listener("keydown", function TimepickerComponent_Template_input_keydown_5_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.preventNonNumeric($event));
        })("keyup", function TimepickerComponent_Template_input_keyup_5_listener($event) {
          \u0275\u0275restoreView(_r1);
          const hour_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(ctx.handleMinuteInput($event, hour_r3));
        })("input", function TimepickerComponent_Template_input_input_5_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.validateInput($event, "M"));
        });
        \u0275\u0275twoWayListener("ngModelChange", function TimepickerComponent_Template_input_ngModelChange_5_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.timeM, $event) || (ctx.timeM = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("change", function TimepickerComponent_Template_input_change_5_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.UpdateTime());
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "ul", 6)(8, "li")(9, "button", 7);
        \u0275\u0275listener("click", function TimepickerComponent_Template_button_click_9_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.setAMPM("AM"));
        });
        \u0275\u0275elementStart(10, "div", 8)(11, "div", 9);
        \u0275\u0275text(12, "AM ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(13, "li")(14, "button", 7);
        \u0275\u0275listener("click", function TimepickerComponent_Template_button_click_14_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.setAMPM("PM"));
        });
        \u0275\u0275elementStart(15, "div", 8)(16, "div", 9);
        \u0275\u0275text(17, "PM");
        \u0275\u0275elementEnd()()()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.timeH);
        \u0275\u0275property("disabled", ctx.disabled);
        \u0275\u0275advance(4);
        \u0275\u0275twoWayProperty("ngModel", ctx.timeM);
        \u0275\u0275property("disabled", ctx.disabled);
        \u0275\u0275advance(4);
        \u0275\u0275classMap(ctx.ttype == "AM" ? "!text-blue-600 !bg-blue-100" : "");
        \u0275\u0275property("disabled", ctx.disabled);
        \u0275\u0275advance(5);
        \u0275\u0275classMap(ctx.ttype == "PM" ? "!text-blue-600 !bg-blue-100" : "");
        \u0275\u0275property("disabled", ctx.disabled);
      }
    }, dependencies: [FormsModule, DefaultValueAccessor, NgControlStatus, MaxLengthValidator, PatternValidator, NgModel], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TimepickerComponent, { className: "TimepickerComponent", filePath: "src\\app\\shared\\components\\timepicker\\timepicker.component.ts", lineNumber: 12 });
})();
export {
  TimepickerComponent
};
//# sourceMappingURL=chunk-J54FHKN3.js.map
