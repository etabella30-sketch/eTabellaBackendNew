import {
  PresentsetupService
} from "./chunk-WYIU2ETL.js";
import "./chunk-3B3MCZKM.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
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
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
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
import {
  ActivatedRoute
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  LocationStrategy
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/setup/form/form.component.ts
var FormComponent_Defer_21_DepsFn = () => [import("./chunk-DANW7H5L.js").then((m) => m.GroupComponent)];
var FormComponent_Conditional_17_Defer_2_DepsFn = () => [import("./chunk-HIVQ7OT2.js").then((m) => m.TeamuserComponent)];
function FormComponent_Conditional_17_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "present-teamuser", 11);
    \u0275\u0275twoWayListener("selectedUserChange", function FormComponent_Conditional_17_Defer_0_Template_present_teamuser_selectedUserChange_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.selectedUser, $event) || (ctx_r1.selectedUser = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("presentData", ctx_r1.presentData);
    \u0275\u0275twoWayProperty("selectedUser", ctx_r1.selectedUser);
  }
}
function FormComponent_Conditional_17_DeferPlaceholder_1_Template(rf, ctx) {
}
function FormComponent_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FormComponent_Conditional_17_Defer_0_Template, 1, 2)(1, FormComponent_Conditional_17_DeferPlaceholder_1_Template, 0, 0);
    \u0275\u0275defer(2, 0, FormComponent_Conditional_17_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r1.presentData == null ? null : ctx_r1.presentData.nCaseid);
  }
}
function FormComponent_Defer_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "present-group", 12);
    \u0275\u0275twoWayListener("cNameChange", function FormComponent_Defer_19_Template_present_group_cNameChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.cName, $event) || (ctx_r1.cName = $event);
      return \u0275\u0275resetView($event);
    })("selectedUserChange", function FormComponent_Defer_19_Template_present_group_selectedUserChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.selectedUser, $event) || (ctx_r1.selectedUser = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("nCaseid", ctx_r1.nCaseid);
    \u0275\u0275twoWayProperty("cName", ctx_r1.cName)("selectedUser", ctx_r1.selectedUser);
    \u0275\u0275property("presentData", ctx_r1.presentData);
  }
}
function FormComponent_DeferPlaceholder_20_Template(rf, ctx) {
}
var FormComponent = class _FormComponent {
  constructor(PSservice, cm, route, cdr, location, hs, userPermissions) {
    this.PSservice = PSservice;
    this.cm = cm;
    this.route = route;
    this.cdr = cdr;
    this.location = location;
    this.hs = hs;
    this.userPermissions = userPermissions;
    this.presetationList = [];
    this.selectedUser = [];
    this.cName = "";
    this.type = "F";
    var params = this.route.snapshot.params;
    params = JSON.parse(decodeURIComponent(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : null;
    this.type = params && params["type"] ? params["type"] : "F";
    hs.nCaseid = this.nCaseid;
    history.pushState(null, null, window.location.href);
    this.location.onPopState(() => {
      history.pushState(null, null, window.location.href);
    });
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.presentData = yield this.PSservice.getRvalue(this.nCaseid);
      try {
        if (this.presentData?.jUsers?.length) {
          this.selectedUser = [...this.presentData.jUsers];
          this.cName = this.presentData.cName;
        }
      } catch (error) {
        console.error(error);
      }
      this.cdr.detectChanges();
    });
  }
  ChooseFile() {
    return __async(this, null, function* () {
      if (!this.selectedUser?.length || !this.cName)
        return;
      yield this.PSservice.setRvalue({
        nCaseid: this.nCaseid,
        jUsers: this.selectedUser,
        cName: this.cName
      });
      if (this.type == "F") {
        this.cm.gotoUrl("/present/choose-docs", { id: this.nCaseid });
      } else if (this.type == "W") {
        this.cm.gotoUrl("/present/createWitness", { id: this.nCaseid });
      } else if (this.type == "C") {
        this.cm.gotoUrl("/present/core-case", { id: this.nCaseid });
      }
    });
  }
  static {
    this.\u0275fac = function FormComponent_Factory(t) {
      return new (t || _FormComponent)(\u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(LocationStrategy), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FormComponent, selectors: [["app-form"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 23, vars: 5, consts: [[1, "h-full", "bg-[#f6f6f6]", "flex", "flex-col", "overflow-hidden"], [1, "text-lg", "bg-white", "text-dark-blue", "whitespace-nowrap", "min-h-20", "flex", "items-center", "gap-6", "px-10"], ["src", "assets/present/public.png", 1, "w-15"], [1, "ms-auto", 3, "click", "disabled"], [1, "flex", "p-10", "h-[calc(100%_-_80px)]", "gap-6"], [1, "w-full", "h-full", "flex", "flex-col", "gap-2.5", "pe-2.5"], [1, "w-1/2"], [1, "text-xs", "font-semibold"], [1, "text-red-500"], ["type", "text", "placeholder", "Name of Presentation", 3, "ngModelChange", "ngModel"], [1, "h-full", "bg-tab", "w-px"], [1, "block", "h-[calc(100%_-_94px)]", 3, "selectedUserChange", "presentData", "selectedUser"], [3, "cNameChange", "selectedUserChange", "nCaseid", "cName", "selectedUser", "presentData"]], template: function FormComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275element(2, "img", 2);
        \u0275\u0275elementStart(3, "h6");
        \u0275\u0275text(4, " Step 1: Presentation Set Up ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "btn", 3);
        \u0275\u0275listener("click", function FormComponent_Template_btn_click_5_listener() {
          return ctx.ChooseFile();
        });
        \u0275\u0275text(6);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "div", 4)(8, "div", 5)(9, "div", 6)(10, "span", 7);
        \u0275\u0275text(11, " Name of Presentation: ");
        \u0275\u0275elementStart(12, "span", 8);
        \u0275\u0275text(13, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(14, "input", 9);
        \u0275\u0275twoWayListener("ngModelChange", function FormComponent_Template_input_ngModelChange_14_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.cName, $event) || (ctx.cName = $event);
          return $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(15, "span", 7);
        \u0275\u0275text(16, " Choose viewer(s): ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(17, FormComponent_Conditional_17_Template, 4, 1);
        \u0275\u0275elementEnd();
        \u0275\u0275element(18, "hr", 10);
        \u0275\u0275template(19, FormComponent_Defer_19_Template, 1, 4)(20, FormComponent_DeferPlaceholder_20_Template, 0, 0);
        \u0275\u0275defer(21, 19, FormComponent_Defer_21_DepsFn, null, 20);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(5);
        \u0275\u0275property("disabled", !(ctx.selectedUser == null ? null : ctx.selectedUser.length) || !ctx.cName);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" Next: Choose ", ctx.type == "W" ? "Witness" : "File", " ");
        \u0275\u0275advance(8);
        \u0275\u0275twoWayProperty("ngModel", ctx.cName);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(17, (ctx.presentData == null ? null : ctx.presentData.nCaseid) ? 17 : -1);
        \u0275\u0275advance(4);
        \u0275\u0275deferWhen(ctx.presentData == null ? null : ctx.presentData.nCaseid);
      }
    }, dependencies: [FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, ButtonComponent], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FormComponent, { className: "FormComponent", filePath: "src\\app\\presentation\\components\\setup\\form\\form.component.ts", lineNumber: 30 });
})();
export {
  FormComponent
};
//# sourceMappingURL=chunk-HZQB2TTD.js.map
