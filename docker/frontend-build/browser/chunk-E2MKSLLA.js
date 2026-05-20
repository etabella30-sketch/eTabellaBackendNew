import {
  TextareaComponent
} from "./chunk-KAW5EGN7.js";
import "./chunk-2VIGWAD6.js";
import "./chunk-XTSEIZ7V.js";
import "./chunk-WZNPCXMG.js";
import "./chunk-DVMGXG6V.js";
import {
  CaseBuilderService
} from "./chunk-46GVS2PE.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import {
  InputComponent
} from "./chunk-FEMUAMTL.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
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
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  ActivatedRoute,
  Router
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
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
  ɵɵpureFunction1,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/casebuilder/casecreation/casecreation.component.ts
var _c0 = (a0) => ({ "!hidden": a0 });
var _c1 = (a0) => ({ "pointer-events-none": a0 });
function CasecreationComponent_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "inpt", 28);
    \u0275\u0275listener("focusOut", function CasecreationComponent_ng_container_10_Template_inpt_focusOut_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.focusOut($event));
    })("valueChange", function CasecreationComponent_ng_container_10_Template_inpt_valueChange_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.caseForm.controls["cCasename"].setValue($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("value", ctx_r1.caseForm.value["cCasename"])("focus", true);
  }
}
function CasecreationComponent_Conditional_54_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 29);
    \u0275\u0275listener("click", function CasecreationComponent_Conditional_54_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.goToteam());
    });
    \u0275\u0275text(1, " Skip ");
    \u0275\u0275elementEnd();
  }
}
var CasecreationComponent = class _CasecreationComponent {
  constructor(formBuilder, caseS, router, route, cf, hs, cdr, cs, userPermissions) {
    this.formBuilder = formBuilder;
    this.caseS = caseS;
    this.router = router;
    this.route = route;
    this.cf = cf;
    this.hs = hs;
    this.cdr = cdr;
    this.cs = cs;
    this.userPermissions = userPermissions;
    this.showinput = false;
    this.isLoading = false;
    this.getYear = (/* @__PURE__ */ new Date()).getFullYear();
    this.checkEventSub();
  }
  checkEventSub() {
    return __async(this, null, function* () {
      this.evsubscription = this.cs.functionCalled$.subscribe((data) => __async(this, null, function* () {
        if (data == "DELETE-CASE") {
          let rs = yield this.caseS.caseDelete(this.nCaseid);
          if (rs) {
            this.cf.goto("/admin/dashboard");
          }
        } else if (data == "VIEW-TICKETS") {
          this.cf.goto("/admin/tickets", { id: this.nCaseid });
        }
      }));
    });
  }
  ngOnInit() {
    var params = this.route.snapshot.params;
    params = JSON.parse(atob(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : 0;
    this.userPermissions.userPermissionList(this.nCaseid);
    this.caseForm = this.formBuilder.group({
      nCaseid: [0],
      cCasename: ["", [Validators.required]],
      cCaseno: ["", [Validators.required]],
      cDesc: ["", [Validators.required]],
      cIndexheader: [""],
      cClaimant: [""],
      cRespondent: [""],
      cTClaimant: [""],
      cTRespondent: [""],
      permission: [this.nCaseid ? "E" : "N", [Validators.required]]
    });
  }
  getCaseDetail(nCaseid) {
    return __async(this, null, function* () {
      let res = yield this.caseS.getCaseDetail(nCaseid);
      this.hs.Casedetail = res;
      this.caseForm.patchValue({
        nCaseid: res.nCaseid,
        cCasename: res.cCasename,
        cCaseno: res.cCaseno,
        cDesc: res.cDesc,
        cIndexheader: res.cIndexheader,
        cClaimant: res.cClaimant,
        cRespondent: res.cRespondent,
        cTClaimant: res.cTClaimant ? res.cTClaimant : "",
        cTRespondent: res.cTRespondent ? res.cTRespondent : "",
        permission: "E"
      });
    });
  }
  ngAfterViewInit() {
    this.hs.updatePath("case detail");
    if (this.nCaseid) {
      this.hs.updateisCase(true);
      this.getCaseDetail(this.nCaseid);
    } else {
      this.hs.updateisCase(false);
    }
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    this.evsubscription.unsubscribe();
  }
  onSubmit() {
    return __async(this, null, function* () {
      this.isLoading = true;
      if (this.caseForm.valid) {
        let res = yield this.caseS.caseBuilder(this.caseForm.value);
        this.isLoading = false;
        if (res.msg == 1) {
          var params = { id: res.nCaseid };
          this.replaceCurrentUrlWithNewUrl(params);
        }
      }
    });
  }
  replaceCurrentUrlWithNewUrl(params) {
    var url = btoa(JSON.stringify(params));
    this.router.navigate(["/casebuilder/casecreation", url], { replaceUrl: true });
    setTimeout(() => {
      this.cf.goto("/casebuilder/teamsetup", params);
    }, 20);
  }
  goToteam() {
    this.cf.goto("/casebuilder/teamsetup", { id: this.nCaseid });
  }
  focusOut(ev) {
    console.log(ev);
    if (ev == "out")
      this.showinput = false;
  }
  static {
    this.\u0275fac = function CasecreationComponent_Factory(t) {
      return new (t || _CasecreationComponent)(\u0275\u0275directiveInject(FormBuilder), \u0275\u0275directiveInject(CaseBuilderService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CasecreationComponent, selectors: [["app-casecreation"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 55, vars: 22, consts: [[1, "bg-dark-blue", "h-full", "w-full", "p-10", "overflow-auto"], [3, "formGroup"], [1, "position-relative", "w-[824px]", "ng-star-inserted"], [1, "input-wrap", "w-100", "mb-6"], [1, "flex", "gap-3", "w-full", "pb-6"], [1, "w-1/2", "ng-star-inserted"], [1, "flex", "gap-2", "text-white", "items-center", "h-8.5", 3, "ngClass"], [1, "text-lg", "font-semibold"], ["name", "edit", 1, "text-xs", "text-blue-400", "cursor-pointer", 3, "click"], [4, "ngIf"], [1, "w-1/2"], ["labelclas", "text-white", "type", "text", "placeholder", "", "formcontrolname", "cCaseno", 3, "valueChange", "showlabel", "isrequired", "value"], [1, "w-full"], ["for", "inputcasedesc", 1, "text-xs", "text-white", "font-semibold", "block"], [1, "text-red-500"], [1, "text-white/70", "text-xs", "block", "mb-2"], ["formcontrolname", "cDesc", 3, "valueChange", "value", "maxlength"], ["for", "inputcasename", 1, "text-xs", "text-white", "font-semibold", "mb-2", "block"], ["placeholder", "Name of Claimant", "formcontrolname", "cClaimant", 3, "valueChange", "value"], ["placeholder", "Name of Respondent", "formcontrolname", "cRespondent", 3, "valueChange", "value"], ["placeholder", "Name of Claimant Transcript", "formcontrolname", "cTClaimant", "maxlenght", "20", 3, "valueChange", "value"], ["placeholder", "Name of Respondent Transcript", "formcontrolname", "cTRespondent", 3, "valueChange", "value"], [1, "flex", "gap-3", "w-full"], ["formcontrolname", "cIndexheader", "placeholder", "This the title which appears in the index page", 3, "valueChange", "value"], [1, "row", "mt-6"], [1, "col-lg-3", "flex", "gap-3"], ["type", "submit", "mode", "gradient", "addcls", "rounded-full px-5", 3, "click", "isloading", "disabled", "ngClass"], ["type", "submit", "mode", "dark", "addcls", "rounded-full bg-white text-blue-on px-4"], ["id", "casename", "type", "text", "formcontrolname", "cCasename", "placeholder", "Case Name", 3, "focusOut", "valueChange", "value", "focus"], ["type", "submit", "mode", "dark", "addcls", "rounded-full bg-white text-blue-on px-4", 3, "click"]], template: function CasecreationComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "form", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4)(5, "div", 5)(6, "div", 6)(7, "span", 7);
        \u0275\u0275text(8);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "icon", 8);
        \u0275\u0275listener("click", function CasecreationComponent_Template_icon_click_9_listener() {
          return ctx.showinput = true;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275template(10, CasecreationComponent_ng_container_10_Template, 2, 2, "ng-container", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275element(11, "div", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "div", 4)(13, "div", 10)(14, "inpt", 11);
        \u0275\u0275listener("valueChange", function CasecreationComponent_Template_inpt_valueChange_14_listener($event) {
          return ctx.caseForm.controls["cCaseno"].setValue($event);
        });
        \u0275\u0275text(15, " Case No. ");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(16, "div", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(17, "div", 4)(18, "div", 12)(19, "label", 13);
        \u0275\u0275text(20, " Case Description");
        \u0275\u0275elementStart(21, "span", 14);
        \u0275\u0275text(22, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(23, "span", 15);
        \u0275\u0275text(24, "Max 150 words");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(25, "txtarea", 16);
        \u0275\u0275listener("valueChange", function CasecreationComponent_Template_txtarea_valueChange_25_listener($event) {
          return ctx.caseForm.controls["cDesc"].setValue($event);
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(26, "div", 4)(27, "div", 10)(28, "label", 17);
        \u0275\u0275text(29, "Claimant");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(30, "txtarea", 18);
        \u0275\u0275listener("valueChange", function CasecreationComponent_Template_txtarea_valueChange_30_listener($event) {
          return ctx.caseForm.controls["cClaimant"].setValue($event);
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(31, "div", 10)(32, "label", 17);
        \u0275\u0275text(33, "Respondent");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(34, "txtarea", 19);
        \u0275\u0275listener("valueChange", function CasecreationComponent_Template_txtarea_valueChange_34_listener($event) {
          return ctx.caseForm.controls["cRespondent"].setValue($event);
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(35, "div", 4)(36, "div", 10)(37, "label", 17);
        \u0275\u0275text(38, "Claimant for Transcript");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(39, "txtarea", 20);
        \u0275\u0275listener("valueChange", function CasecreationComponent_Template_txtarea_valueChange_39_listener($event) {
          return ctx.caseForm.controls["cTClaimant"].setValue($event);
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(40, "div", 10)(41, "label", 17);
        \u0275\u0275text(42, "Respondent for Transcript");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(43, "txtarea", 21);
        \u0275\u0275listener("valueChange", function CasecreationComponent_Template_txtarea_valueChange_43_listener($event) {
          return ctx.caseForm.controls["cTRespondent"].setValue($event);
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(44, "div", 22)(45, "div", 10)(46, "label", 17);
        \u0275\u0275text(47, "Index Title");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(48, "txtarea", 23);
        \u0275\u0275listener("valueChange", function CasecreationComponent_Template_txtarea_valueChange_48_listener($event) {
          return ctx.caseForm.controls["cIndexheader"].setValue($event);
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275element(49, "div", 10);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(50, "div", 24)(51, "div", 25)(52, "btn", 26);
        \u0275\u0275listener("click", function CasecreationComponent_Template_btn_click_52_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275text(53, " Save and go to Team ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(54, CasecreationComponent_Conditional_54_Template, 2, 0, "btn", 27);
        \u0275\u0275elementEnd()()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("formGroup", ctx.caseForm);
        \u0275\u0275advance(5);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(18, _c0, ctx.caseForm.value["permission"] != "E" || ctx.showinput));
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(ctx.caseForm.value["cCasename"]);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.caseForm.value["permission"] == "N" || ctx.showinput);
        \u0275\u0275advance(4);
        \u0275\u0275property("showlabel", true)("isrequired", true)("value", ctx.caseForm.value["cCaseno"]);
        \u0275\u0275advance(11);
        \u0275\u0275property("value", ctx.caseForm.value["cDesc"])("maxlength", 150);
        \u0275\u0275advance(5);
        \u0275\u0275property("value", ctx.caseForm.value["cClaimant"]);
        \u0275\u0275advance(4);
        \u0275\u0275property("value", ctx.caseForm.value["cRespondent"]);
        \u0275\u0275advance(5);
        \u0275\u0275property("value", ctx.caseForm.value["cTClaimant"]);
        \u0275\u0275advance(4);
        \u0275\u0275property("value", ctx.caseForm.value["cTRespondent"]);
        \u0275\u0275advance(5);
        \u0275\u0275property("value", ctx.caseForm.value["cIndexheader"]);
        \u0275\u0275advance(4);
        \u0275\u0275property("isloading", ctx.isLoading)("disabled", ctx.caseForm.invalid)("ngClass", \u0275\u0275pureFunction1(20, _c1, ctx.caseForm.invalid || ctx.isLoading));
        \u0275\u0275advance(2);
        \u0275\u0275conditional(54, ctx.nCaseid ? 54 : -1);
      }
    }, dependencies: [
      CommonModule,
      NgClass,
      NgIf,
      InputComponent,
      TextareaComponent,
      ButtonComponent,
      ReactiveFormsModule,
      \u0275NgNoValidate,
      NgControlStatusGroup,
      FormGroupDirective,
      IconComponent
    ] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CasecreationComponent, { className: "CasecreationComponent", filePath: "src\\app\\adminpanel\\components\\casebuilder\\casecreation\\casecreation.component.ts", lineNumber: 34 });
})();
export {
  CasecreationComponent
};
//# sourceMappingURL=chunk-E2MKSLLA.js.map
