import {
  MatInput,
  MatInputModule
} from "./chunk-XTSEIZ7V.js";
import {
  CdkTextareaAutosize,
  TextFieldModule
} from "./chunk-DVMGXG6V.js";
import {
  MatFormField,
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  VariablesService
} from "./chunk-D2JKPWBT.js";
import {
  CommonModule,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/textarea/textarea.component.ts
var TextareaComponent = class _TextareaComponent {
  constructor(vs) {
    this.vs = vs;
    this.disabled = false;
    this.error = false;
    this.placeholder = "";
    this.autosize = true;
    this.row = true;
    this.value = "";
    this.minrows = 1;
    this.maxlength = 150;
    this.valueChange = new EventEmitter();
  }
  get inputClasses() {
    if (this.disabled) {
      return `${this.vs.inputvarnts.baseClasses} ${this.vs.inputvarnts.disabledClasses}`;
    } else if (this.error) {
      return `${this.vs.inputvarnts.baseClasses} ${this.vs.inputvarnts.errorClasses}`;
    } else {
      return `${this.vs.inputvarnts.baseClasses} ${this.vs.inputvarnts.normalClasses}`;
    }
  }
  oninput(event) {
    this.valueChange.emit(event.target.value);
  }
  static {
    this.\u0275fac = function TextareaComponent_Factory(t) {
      return new (t || _TextareaComponent)(\u0275\u0275directiveInject(VariablesService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TextareaComponent, selectors: [["txtarea"]], inputs: { disabled: "disabled", error: "error", placeholder: "placeholder", autosize: "autosize", row: "row", value: "value", minrows: "minrows", maxlength: "maxlength" }, outputs: { valueChange: "valueChange" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 3, vars: 6, consts: [["autosize", "cdkTextareaAutosize"], [1, "px-3.5", "py-2", "rounded-base", "min-h-8.5", "bg-white", "w-full", "text-xs"], ["matInput", "", "cdkTextareaAutosize", "", "cdkAutosizeMaxRows", "5", "spacebardisable", "", 1, "text-xs", "!tracking-normal", "hover:!bg-transparent", "placeholder:!text-gray-400", 3, "input", "cdkAutosizeMinRows", "ngClass", "disabled", "placeholder", "value"]], template: function TextareaComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "textarea", 2, 0);
        \u0275\u0275listener("input", function TextareaComponent_Template_textarea_input_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.oninput($event));
        });
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("cdkAutosizeMinRows", ctx.minrows)("ngClass", ctx.inputClasses)("disabled", ctx.disabled)("placeholder", ctx.placeholder)("value", ctx.value);
        \u0275\u0275attribute("maxlength", ctx.maxlength);
      }
    }, dependencies: [CdkTextareaAutosize, TextFieldModule, CommonModule, NgClass, MatFormFieldModule, MatFormField, MatInputModule, MatInput] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TextareaComponent, { className: "TextareaComponent", filePath: "src\\app\\shared\\components\\textarea\\textarea.component.ts", lineNumber: 14 });
})();

export {
  TextareaComponent
};
//# sourceMappingURL=chunk-KAW5EGN7.js.map
