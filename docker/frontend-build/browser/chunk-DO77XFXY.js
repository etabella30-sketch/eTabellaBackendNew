import {
  LoginService
} from "./chunk-WMS43CSS.js";
import {
  InputComponent
} from "./chunk-FEMUAMTL.js";
import "./chunk-42T75ZKA.js";
import {
  FormBuilder,
  FormGroupDirective,
  NgControlStatusGroup,
  ReactiveFormsModule,
  Validators,
  ɵNgNoValidate
} from "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  __async,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/core/authantication/forgotpassword/forgotpassword.component.ts
var _c0 = () => ({ name: "email", "dir": "L" });
var _c1 = () => ({ name: "lock", "dir": "L" });
function ForgotpasswordComponent_h6_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 15);
    \u0275\u0275text(1, "Enter your email address to reset your password.");
    \u0275\u0275elementEnd();
  }
}
function ForgotpasswordComponent_form_11_h6_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 20);
    \u0275\u0275text(1, "Invalid email address");
    \u0275\u0275elementEnd();
  }
}
function ForgotpasswordComponent_form_11_h6_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 21);
    \u0275\u0275text(1, "A link has been sent to your email.");
    \u0275\u0275elementEnd();
  }
}
function ForgotpasswordComponent_form_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "form", 16)(1, "inpt", 17);
    \u0275\u0275listener("valueChange", function ForgotpasswordComponent_form_11_Template_inpt_valueChange_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.loginForm.controls["cEmail"].setValue($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(2, ForgotpasswordComponent_form_11_h6_2_Template, 2, 0, "h6", 18)(3, ForgotpasswordComponent_form_11_h6_3_Template, 2, 0, "h6", 19);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("formGroup", ctx_r1.loginForm);
    \u0275\u0275advance();
    \u0275\u0275property("icon", \u0275\u0275pureFunction0(5, _c0))("value", ctx_r1.loginForm == null ? null : ctx_r1.loginForm.value == null ? null : ctx_r1.loginForm.value.cEmail);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.logS.isinvalid);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", false);
  }
}
function ForgotpasswordComponent_form_12_h6_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 21);
    \u0275\u0275text(1, "A link has been sent to your email.");
    \u0275\u0275elementEnd();
  }
}
function ForgotpasswordComponent_form_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "form", 16)(1, "inpt", 22);
    \u0275\u0275listener("valueChange", function ForgotpasswordComponent_form_12_Template_inpt_valueChange_1_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.loginForm.controls["password"].setValue($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "inpt", 22);
    \u0275\u0275listener("valueChange", function ForgotpasswordComponent_form_12_Template_inpt_valueChange_2_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.loginForm.controls["password"].setValue($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, ForgotpasswordComponent_form_12_h6_3_Template, 2, 0, "h6", 19);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("formGroup", ctx_r1.resetpass);
    \u0275\u0275advance();
    \u0275\u0275property("error", ctx_r1.logS.isinvalid)("icon", \u0275\u0275pureFunction0(10, _c1))("isoutside", true)("value", ctx_r1.loginForm == null ? null : ctx_r1.loginForm.value == null ? null : ctx_r1.loginForm.value.password);
    \u0275\u0275advance();
    \u0275\u0275property("error", ctx_r1.logS.isinvalid)("icon", \u0275\u0275pureFunction0(11, _c1))("isoutside", true)("value", ctx_r1.loginForm == null ? null : ctx_r1.loginForm.value == null ? null : ctx_r1.loginForm.value.password);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", false);
  }
}
var ForgotpasswordComponent = class _ForgotpasswordComponent {
  constructor(logS, formBuilder) {
    this.logS = logS;
    this.formBuilder = formBuilder;
    this.keepMeLogin = false;
    this.enterpassword = false;
    this.isloading = false;
    this.getYear = (/* @__PURE__ */ new Date()).getFullYear();
  }
  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      cEmail: ["", [Validators.required, Validators.email]]
    });
    this.resetpass = this.formBuilder.group({
      newpassword: ["", [Validators.required, Validators.email]],
      retypepassword: ["", [Validators.required, Validators.email]]
    });
  }
  onSubmit() {
    return __async(this, null, function* () {
      this.isloading = true;
      if (this.loginForm.valid) {
        this.isloading = false;
        this.enterpassword = true;
      }
    });
  }
  static {
    this.\u0275fac = function ForgotpasswordComponent_Factory(t) {
      return new (t || _ForgotpasswordComponent)(\u0275\u0275directiveInject(LoginService), \u0275\u0275directiveInject(FormBuilder));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ForgotpasswordComponent, selectors: [["app-forgotpassword"]], standalone: true, features: [\u0275\u0275ProvidersFeature([LoginService]), \u0275\u0275StandaloneFeature], decls: 25, vars: 8, consts: [[1, "h-screen", "flex", "items-center", "justify-center", "bg-blue-700", "overflow-hidden", "relative"], ["src", "assets/login/background.webp", 1, "absolute", "z-20", "mix-blend-multiply", "w-full", "h-[185vh]", "mt-40", "object-cover"], [1, "bg-gray-50", "shadow-[0px_0px_0px_11px_#ffffff38]", "absolute", "z-10", "w-[971px]", "h-[400px]", "rounded-3xl", "-translate-y-7", "mt-1"], [1, "h-fit", "w-fit", "relative", "z-30"], [1, "flex", "h-[400px]", "rounded-3xl", "overflow-hidden"], [1, "w-[400px]", "flex"], ["src", "assets/logo.svg", 1, "m-auto", "w-28"], [1, "w-[571px]", "h-full", "bg-white", "p-24"], [1, "text-lg", "font-semibold", "mb-5"], ["class", " text-xs mb-3 ", 4, "ngIf"], [3, "formGroup", 4, "ngIf"], ["mode", "solid", "addcls", "w-full mt-5", 3, "click", "disabled", "isloading"], [1, "flex", "text-white", "text-xs", "w-[971px]", "mt-9"], [1, "flex", "text-end", "gap-4", "ms-auto"], [1, "cursor-pointer"], [1, "text-xs", "mb-3"], [3, "formGroup"], ["type", "text", "placeholder", "Enter Email", 1, "block", "mb-5", 3, "valueChange", "icon", "value"], ["class", "text-sred text-xs font-bold", 4, "ngIf"], ["class", "text-blue-on text-xs font-bold", 4, "ngIf"], [1, "text-sred", "text-xs", "font-bold"], [1, "text-blue-on", "text-xs", "font-bold"], ["type", "password", "placeholder", "Enter Password", 1, "block", "mb-2.5", 3, "valueChange", "error", "icon", "isoutside", "value"]], template: function ForgotpasswordComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275element(1, "img", 1)(2, "div", 2);
        \u0275\u0275elementStart(3, "div", 3)(4, "div", 4)(5, "div", 5);
        \u0275\u0275element(6, "img", 6);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "form", 7)(8, "h6", 8);
        \u0275\u0275text(9);
        \u0275\u0275elementEnd();
        \u0275\u0275template(10, ForgotpasswordComponent_h6_10_Template, 2, 0, "h6", 9)(11, ForgotpasswordComponent_form_11_Template, 4, 6, "form", 10)(12, ForgotpasswordComponent_form_12_Template, 4, 12, "form", 10);
        \u0275\u0275elementStart(13, "btn", 11);
        \u0275\u0275listener("click", function ForgotpasswordComponent_Template_btn_click_13_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275text(14, "Reset ");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(15, "div", 12)(16, "span");
        \u0275\u0275text(17);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(18, "span", 13)(19, "span", 14);
        \u0275\u0275text(20, "Terms of Service");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(21, "span", 14);
        \u0275\u0275text(22, "Privacy Policy");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(23, "span", 14);
        \u0275\u0275text(24, "Security");
        \u0275\u0275elementEnd()()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(9);
        \u0275\u0275textInterpolate1(" ", ctx.enterpassword ? "Enter a new password" : "Reset your password", " ");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.enterpassword);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.enterpassword);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.enterpassword);
        \u0275\u0275advance();
        \u0275\u0275property("disabled", ctx.isloading || ctx.loginForm.status == "INVALID")("isloading", ctx.isloading);
        \u0275\u0275attribute("isdisable", ctx.isloading || ctx.loginForm.status == "INVALID");
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate1("\xA9 ", ctx.getYear, " eTabella. All rights reserved. ");
      }
    }, dependencies: [CommonModule, NgIf, InputComponent, ButtonComponent, ReactiveFormsModule, \u0275NgNoValidate, NgControlStatusGroup, FormGroupDirective] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ForgotpasswordComponent, { className: "ForgotpasswordComponent", filePath: "src\\app\\core\\authantication\\forgotpassword\\forgotpassword.component.ts", lineNumber: 16 });
})();
export {
  ForgotpasswordComponent
};
//# sourceMappingURL=chunk-DO77XFXY.js.map
