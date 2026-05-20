import {
  FormsModule
} from "./chunk-CIO7JDBK.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  VariablesService
} from "./chunk-D2JKPWBT.js";
import {
  CommonModule,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵpureFunction4,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/interfaces/input.interface.ts
var INPUT_FOCUS_OUT_FLAGS = {
  OUT: "out",
  ENTER: "enter"
};
var INPUT_DEFAULTS = {
  MAX_LENGTH: 80
};

// src/app/shared/components/input/input.component.ts
var _c0 = ["maininput"];
var _c1 = ["*"];
var _c2 = (a0, a1, a2, a3) => ({ "left-4": a0, "right-4": a1, "text-sred": a2, iconclas: a3 });
var _c3 = (a0, a1) => ({ "-right-7": a0, "right-4": a1 });
function InputComponent_ng_container_1_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 6);
    \u0275\u0275text(1, "*");
    \u0275\u0275elementEnd();
  }
}
function InputComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "label", 4);
    \u0275\u0275projection(2);
    \u0275\u0275template(3, InputComponent_ng_container_1_span_3_Template, 2, 0, "span", 5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r1.labelclas);
    \u0275\u0275attribute("for", ctx_r1.ids);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.isrequired);
  }
}
function InputComponent_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 7);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("name", ctx_r1.icon == null ? null : ctx_r1.icon.name)("ngClass", \u0275\u0275pureFunction4(2, _c2, (ctx_r1.icon == null ? null : ctx_r1.icon.dir) == "L", (ctx_r1.icon == null ? null : ctx_r1.icon.dir) == "R", ctx_r1.error, ctx_r1.iconclas));
  }
}
function InputComponent_ng_container_6_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 10);
    \u0275\u0275listener("click", function InputComponent_ng_container_6_button_1_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.showhide = !ctx_r1.showhide);
    });
    \u0275\u0275element(1, "icon", 11);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(1, _c3, ctx_r1.isoutside, !ctx_r1.isoutside));
  }
}
function InputComponent_ng_container_6_button_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 12);
    \u0275\u0275listener("click", function InputComponent_ng_container_6_button_2_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.showhide = !ctx_r1.showhide);
    });
    \u0275\u0275element(1, "icon", 13);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(1, _c3, ctx_r1.isoutside, !ctx_r1.isoutside));
  }
}
function InputComponent_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, InputComponent_ng_container_6_button_1_Template, 2, 4, "button", 8)(2, InputComponent_ng_container_6_button_2_Template, 2, 4, "button", 9);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.showhide);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.showhide);
  }
}
var InputComponent = class _InputComponent {
  constructor(vs) {
    this.vs = vs;
    this.disabled = false;
    this.autofilloff = false;
    this.readonly = false;
    this.error = false;
    this.placeholder = "";
    this.isrequired = false;
    this.showlabel = true;
    this.isoutside = false;
    this.inlinemode = false;
    this.labelclas = "";
    this.inptclas = "";
    this.iconclas = "";
    this.type = "text";
    this.maxlength = INPUT_DEFAULTS.MAX_LENGTH;
    this.value = "";
    this.focus = false;
    this.ids = "";
    this.valueChange = new EventEmitter();
    this.focusOut = new EventEmitter();
    this.INPUT_FOCUS_OUT_FLAGS = INPUT_FOCUS_OUT_FLAGS;
    this.showhide = false;
  }
  ngAfterViewInit() {
    if (this.focus) {
      this.input?.nativeElement?.focus();
    }
  }
  get inputClasses() {
    if (this.disabled) {
      return `${this.inptclas} ${this.vs.inputvarnts.baseClasses} ${this.vs.inputvarnts.disabledClasses}`;
    }
    if (this.error) {
      return `${this.inptclas} ${this.vs.inputvarnts.baseClasses} ${this.vs.inputvarnts.errorClasses}`;
    }
    if (this.inlinemode) {
      return `${this.inptclas} ${this.vs.inputvarnts.baseClasses} ${this.vs.inputvarnts.inlineClasses}`;
    }
    return `${this.inptclas} ${this.vs.inputvarnts.baseClasses} ${this.vs.inputvarnts.normalClasses}`;
  }
  oninput(event) {
    const target = event.target;
    this.valueChange.emit(target?.value ?? "");
  }
  focusOuts(flag) {
    this.focusOut.emit(flag);
  }
  static {
    this.\u0275fac = function InputComponent_Factory(t) {
      return new (t || _InputComponent)(\u0275\u0275directiveInject(VariablesService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _InputComponent, selectors: [["inpt"]], viewQuery: function InputComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.input = _t.first);
      }
    }, inputs: { disabled: "disabled", autofilloff: "autofilloff", readonly: "readonly", error: "error", placeholder: "placeholder", isrequired: "isrequired", showlabel: "showlabel", isoutside: "isoutside", inlinemode: "inlinemode", labelclas: "labelclas", inptclas: "inptclas", iconclas: "iconclas", type: "type", maxlength: "maxlength", icon: "icon", value: "value", focus: "focus", ids: "ids" }, outputs: { valueChange: "valueChange", focusOut: "focusOut" }, standalone: true, features: [\u0275\u0275StandaloneFeature], ngContentSelectors: _c1, decls: 7, vars: 16, consts: [["maininput", ""], [1, "relative", "w-full"], [4, "ngIf"], [1, "px-3.5", "py-2", "rounded-base", "placeholder-shown:bg-white", "bg-faint", 3, "input", "blur", "keyup.enter", "autocomplete", "id", "readOnly", "ngClass", "disabled", "placeholder", "type", "value"], [1, "text-xs", "font-semibold", "mb-2", "block", 3, "ngClass"], ["class", "text-red-500", 4, "ngIf"], [1, "text-red-500"], [1, "absolute", "top-1/2", "-translate-y-1/2", 3, "name", "ngClass"], ["type", "button", "class", "absolute opacity-100 top-1/2 -translate-y-1/2 cursor-pointer text-blue-600", 3, "ngClass", "click", 4, "ngIf"], ["type", "button", "class", "absolute opacity-60 top-1/2 -translate-y-1/2 cursor-pointer", 3, "ngClass", "click", 4, "ngIf"], ["type", "button", 1, "absolute", "opacity-100", "top-1/2", "-translate-y-1/2", "cursor-pointer", "text-blue-600", 3, "click", "ngClass"], ["name", "eye"], ["type", "button", 1, "absolute", "opacity-60", "top-1/2", "-translate-y-1/2", "cursor-pointer", 3, "click", "ngClass"], ["name", "eyeoff"]], template: function InputComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275projectionDef();
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275template(1, InputComponent_ng_container_1_Template, 4, 3, "ng-container", 2);
        \u0275\u0275elementStart(2, "div", 1);
        \u0275\u0275template(3, InputComponent_ng_container_3_Template, 2, 7, "ng-container", 2);
        \u0275\u0275elementStart(4, "input", 3, 0);
        \u0275\u0275listener("input", function InputComponent_Template_input_input_4_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.oninput($event));
        })("blur", function InputComponent_Template_input_blur_4_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.focusOuts(ctx.INPUT_FOCUS_OUT_FLAGS.OUT));
        })("keyup.enter", function InputComponent_Template_input_keyup_enter_4_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.focusOuts(ctx.INPUT_FOCUS_OUT_FLAGS.ENTER));
        });
        \u0275\u0275elementEnd();
        \u0275\u0275template(6, InputComponent_ng_container_6_Template, 3, 2, "ng-container", 2);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.showlabel);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.icon);
        \u0275\u0275advance();
        \u0275\u0275classProp("pr-12", (ctx.icon == null ? null : ctx.icon.dir) == "R" || ctx.type == "password")("pl-12", (ctx.icon == null ? null : ctx.icon.dir) == "L");
        \u0275\u0275property("autocomplete", ctx.autofilloff ? "new-password" : "")("id", ctx.ids)("readOnly", ctx.readonly)("ngClass", ctx.inputClasses)("disabled", ctx.disabled)("placeholder", ctx.placeholder)("type", ctx.showhide ? "text" : ctx.type)("value", ctx.value);
        \u0275\u0275attribute("maxlength", ctx.maxlength);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.type == "password");
      }
    }, dependencies: [CommonModule, NgClass, NgIf, FormsModule, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(InputComponent, { className: "InputComponent", filePath: "src\\app\\shared\\components\\input\\input.component.ts", lineNumber: 15 });
})();

export {
  InputComponent
};
//# sourceMappingURL=chunk-FEMUAMTL.js.map
