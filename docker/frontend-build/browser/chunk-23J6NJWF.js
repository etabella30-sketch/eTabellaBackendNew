import {
  HelpcenterService
} from "./chunk-A6WEQJAW.js";
import {
  NativeElementInjectorDirective,
  NgxIntlTelInputModule
} from "./chunk-4WAWQBKW.js";
import {
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  DefaultValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  MaxLengthValidator,
  NgControlStatus,
  NgControlStatusGroup,
  ReactiveFormsModule,
  Validators,
  ɵNgNoValidate
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/helpcenter/moduleform/moduleform.component.ts
function ModuleformComponent_div_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 18);
    \u0275\u0275text(1, " Title is required ");
    \u0275\u0275elementEnd();
  }
}
function ModuleformComponent_div_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 18);
    \u0275\u0275text(1, " Link is required ");
    \u0275\u0275elementEnd();
  }
}
function ModuleformComponent_Conditional_32_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "icon", 20);
    \u0275\u0275listener("click", function ModuleformComponent_Conditional_32_For_2_Template_icon_click_2_listener() {
      const x_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.removetag(x_r3));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r3, " ");
  }
}
function ModuleformComponent_Conditional_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16);
    \u0275\u0275repeaterCreate(1, ModuleformComponent_Conditional_32_For_2_Template, 3, 1, "div", 19, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r3.tags);
  }
}
var ModuleformComponent = class _ModuleformComponent {
  constructor(helpcenterService, toastr) {
    this.helpcenterService = helpcenterService;
    this.toastr = toastr;
    this.curruntmodule = false;
    this.moduleupdated = new EventEmitter();
    this.permission = "N";
    this.tags = [];
    this.formsubmit = false;
    this.active_forms = "";
    this.profileUrl = "";
    this.issubmodule = false;
    this.validation_messages = {
      "nChid": [
        { type: "required", message: "Chapter is required" }
      ]
    };
  }
  ngOnInit() {
    this.frm = new FormGroup({
      cTitle: new FormControl("", Validators.required),
      cDescription: new FormControl(""),
      cLink: new FormControl("")
    });
  }
  ngOnChanges(changes) {
    if (changes["selectedmodule"]) {
      debugger;
      if (this.selectedmodule) {
        this.helpcenterService.getsubmodule_detail(this.selectedmodule).then((res) => {
          this.frm.patchValue(res);
          this.curruntsubmodule = res;
          this.permission = "E";
          this.tags = res.jTags;
        });
      } else {
        this.frm.reset();
        this.permission = "N";
        this.tags = [];
      }
    }
  }
  onsubmit() {
    debugger;
    this.formsubmit = true;
    if (this.frm.invalid) {
      return;
    }
    let mdl = {};
    mdl.nSMid = this.selectedmodule || 0;
    mdl.nMainid = this.curruntmodule || 0;
    mdl.cTitle = this.frm.value.cTitle;
    mdl.cLink = this.frm.value.cLink;
    mdl.cDescription = this.frm.value.cDescription || "no description";
    mdl.jTags = this.tags;
    mdl.cPermission = this.permission == "E" ? "U" : "I";
    this.helpcenterService.sub_module_iu(mdl).then((res) => {
      if (res.msg == -1) {
        this.toastr.error(res.msg);
        return;
      }
      this.frm.reset();
      this.permission = "N";
      this.tags = [];
      this.formsubmit = false;
      this.toastr.success(`Module ${this.permission == "E" ? "Updated" : "Added"} successfully`);
      this.moduleupdated.emit(res);
    });
  }
  addtag(event) {
    if (event.key === "Enter") {
      this.tags.push(event.target.value);
      event.target.value = "";
    }
  }
  removetag(tag) {
    this.tags = this.tags.filter((t) => t !== tag);
  }
  static {
    this.\u0275fac = function ModuleformComponent_Factory(t) {
      return new (t || _ModuleformComponent)(\u0275\u0275directiveInject(HelpcenterService), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ModuleformComponent, selectors: [["moduleform"]], inputs: { curruntmodule: "curruntmodule", selectedmodule: "selectedmodule", issubmodule: "issubmodule" }, outputs: { moduleupdated: "moduleupdated" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 35, vars: 10, consts: [["header", ""], [1, "relative", "block", "h-full", "w-[500px]"], [1, "addnewcontact", "py-5", "flex", "flex-col", "h-full", "overflow-auto", 3, "formGroup"], [1, "text-lg", "font-semibold", "items-center", "gap-2", "flex", "mb-6", "px-5"], [1, "px-5"], ["for", "frstname"], [1, "text-xs", "mb-2", "font-semibold"], [1, "valid-star"], ["formControlName", "cTitle", "type", "text", "id", "frstname", 1, "main-input"], ["class", "validators-required validation-required validation", 4, "ngIf"], ["for", "lstname"], ["formControlName", "cLink", "type", "text", "id", "lstname", 1, "main-input"], ["for", "note", 1, "selects"], [1, "text-xs", "font-semibold", "mb-2"], ["rows", "3", "type", "text", "id", "note", "formControlName", "cDescription", "maxlength", "250", 1, "style"], ["placeholder", "Type and press enter to add tag", "type", "text", "id", "lstname", 1, "main-input", 3, "keypress"], [1, "flex", "flex-wrap", "gap-2"], ["addcls", "w-full", 1, "w-full", "mt-5", 3, "click"], [1, "validators-required", "validation-required", "validation"], [1, "flex", "items-center", "gap-2", "text-xs", "border", "py-1.5", "px-2", "rounded-base"], ["name", "backspace", "type", "extra", 1, "text-xs", 3, "click"]], template: function ModuleformComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1)(1, "form", 2)(2, "div", 3, 0);
        \u0275\u0275text(4);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "div", 4)(6, "label", 5)(7, "h6", 6);
        \u0275\u0275text(8, "Title ");
        \u0275\u0275elementStart(9, "span", 7);
        \u0275\u0275text(10, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(11, "input", 8);
        \u0275\u0275elementContainerStart(12);
        \u0275\u0275template(13, ModuleformComponent_div_13_Template, 2, 0, "div", 9);
        \u0275\u0275elementContainerEnd();
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "label", 10)(15, "h6", 6);
        \u0275\u0275text(16, "Link ");
        \u0275\u0275elementStart(17, "span", 7);
        \u0275\u0275text(18, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(19, "input", 11);
        \u0275\u0275elementContainerStart(20);
        \u0275\u0275template(21, ModuleformComponent_div_21_Template, 2, 0, "div", 9);
        \u0275\u0275elementContainerEnd();
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(22, "label", 12)(23, "h6", 13);
        \u0275\u0275text(24, "Desciption");
        \u0275\u0275elementEnd();
        \u0275\u0275element(25, "textarea", 14);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(26, "label", 10)(27, "h6", 6);
        \u0275\u0275text(28, "Tags ");
        \u0275\u0275elementStart(29, "span", 7);
        \u0275\u0275text(30, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(31, "input", 15);
        \u0275\u0275listener("keypress", function ModuleformComponent_Template_input_keypress_31_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.addtag($event));
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275template(32, ModuleformComponent_Conditional_32_Template, 3, 0, "div", 16);
        \u0275\u0275elementStart(33, "btn", 17);
        \u0275\u0275listener("click", function ModuleformComponent_Template_btn_click_33_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onsubmit());
        });
        \u0275\u0275text(34);
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("formGroup", ctx.frm);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1(" ", ctx.permission == "N" ? "Add " : "Edit ", " Module ");
        \u0275\u0275advance(7);
        \u0275\u0275classProp("error", ctx.frm.get("cTitle").invalid && ctx.formsubmit);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.frm.get("cTitle").hasError("required") && ctx.formsubmit);
        \u0275\u0275advance(6);
        \u0275\u0275classProp("error", ctx.frm.get("cLink").invalid && ctx.formsubmit);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.frm.get("cLink").hasError("required") && ctx.formsubmit);
        \u0275\u0275advance(11);
        \u0275\u0275conditional(32, ctx.tags.length > 0 ? 32 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", ctx.permission == "N" ? "Add" : "Update", " ");
      }
    }, dependencies: [CommonModule, NgIf, IconComponent, NgxIntlTelInputModule, NativeElementInjectorDirective, FormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, MaxLengthValidator, ReactiveFormsModule, FormGroupDirective, FormControlName, MatFormFieldModule, MatSelectModule, ButtonComponent], styles: ["\n\n.valid-star[_ngcontent-%COMP%], .validators-required[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: red;\n}\nlabel[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 12px;\n}\n/*# sourceMappingURL=moduleform.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ModuleformComponent, { className: "ModuleformComponent", filePath: "src\\app\\adminpanel\\components\\helpcenter\\moduleform\\moduleform.component.ts", lineNumber: 20 });
})();
export {
  ModuleformComponent
};
//# sourceMappingURL=chunk-23J6NJWF.js.map
