import {
  PresentsetupService
} from "./chunk-WYIU2ETL.js";
import "./chunk-3B3MCZKM.js";
import {
  ContactFormComponent
} from "./chunk-KKQSQEUN.js";
import "./chunk-SUYASFF3.js";
import "./chunk-4WAWQBKW.js";
import "./chunk-5HHWKW4L.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import "./chunk-GHP524MW.js";
import "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import "./chunk-2HPWN6DG.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import "./chunk-CIO7JDBK.js";
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
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
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
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/witnessSchedule/create-schedule/create-schedule.component.ts
function CreateScheduleComponent_For_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 12);
    \u0275\u0275listener("click", function CreateScheduleComponent_For_12_Template_div_click_0_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.nContactid = x_r2.nContactid);
    });
    \u0275\u0275element(1, "avtr", 13);
    \u0275\u0275elementStart(2, "h6", 14)(3, "span", 15);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 16);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classMap(x_r2.nContactid == ctx_r2.nContactid ? "!bg-dark-blue text-white" : "");
    \u0275\u0275advance();
    \u0275\u0275property("detail", x_r2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2(" ", x_r2.cFname, " ", x_r2.cLname, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r2.cEmail, " ");
  }
}
function CreateScheduleComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 11)(1, "app-contact-form", 17);
    \u0275\u0275listener("OnEvent", function CreateScheduleComponent_Conditional_15_Template_app_contact_form_OnEvent_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.outputEvent($event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("iscomponent", true)("nCaseid", ctx_r2.nCaseid)("cContactType", "W");
  }
}
var CreateScheduleComponent = class _CreateScheduleComponent {
  constructor(PSservice, cm, route, cdr, location, hs, userPermissions) {
    this.PSservice = PSservice;
    this.cm = cm;
    this.route = route;
    this.cdr = cdr;
    this.location = location;
    this.hs = hs;
    this.userPermissions = userPermissions;
    this.witnessList = [];
    this.isNew = false;
    this.nPresentid = null;
    this.nPCid = null;
    var params = this.route.snapshot.params;
    params = JSON.parse(decodeURIComponent(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : null;
    hs.nCaseid = this.nCaseid;
    this.nContactid = params && params["nCid"] ? params["nCid"] : null;
    this.nPresentid = params["nPid"] || null;
    this.nPCid = params["nPCid"] || null;
    history.pushState(null, null, window.location.href);
    this.location.onPopState(() => {
      history.pushState(null, null, window.location.href);
    });
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngOnInit() {
    this.getContactlist();
  }
  getContactlist() {
    return __async(this, null, function* () {
      this.witnessList = yield this.PSservice.getcontactList(this.nCaseid, "W");
      if (this.witnessList.length == 0) {
        this.isNew = true;
      }
      this.cdr.detectChanges();
    });
  }
  outputEvent(event) {
    if (event.event == "NEW_ADDED") {
      this.isNew = false;
      this.getContactlist();
    }
    if (event.event == "CLOSE") {
      this.isNew = false;
    }
  }
  gotoFile() {
    if (!this.nContactid || !this.nCaseid)
      return;
    let data = {
      id: this.nCaseid,
      cid: this.nContactid
    };
    if (this.nPresentid) {
      data["nPid"] = this.nPresentid;
    }
    if (this.nPCid) {
      data["nPCid"] = this.nPCid;
    }
    this.cm.gotoUrl("/present/choose-docs", data);
  }
  static {
    this.\u0275fac = function CreateScheduleComponent_Factory(t) {
      return new (t || _CreateScheduleComponent)(\u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(LocationStrategy), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CreateScheduleComponent, selectors: [["app-create-schedule"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 16, vars: 3, consts: [[1, "h-full", "bg-[#f6f6f6]", "flex", "flex-col", "overflow-hidden"], [1, "text-lg", "bg-white", "text-dark-blue", "whitespace-nowrap", "min-h-20", "flex", "items-center", "gap-6", "px-10"], ["src", "assets/present/public.png", 1, "w-15"], [1, "font-bold"], [1, "ms-auto", 3, "click", "disabled"], [1, "flex", "px-10", "pt-10", "pb-5", "h-[calc(100%_-_80px)]", "gap-2.5", "overflow-auto"], [1, "col-span-6", "w-[calc(100%_-_440px)]", "h-full", "flex", "flex-col", "gap-2.5", "pe-2.5", "over"], [1, "w-full", "h-full", "flex", "flex-col", "gap-3"], [1, "grid", "grid-cols-2", "mb-3", "gap-2.5", "max-h-full", "h-fit", "overflow-auto", "content-start"], [1, "flex", "items-center", "gap-2.5", "bg-white", "hover:bg-blue-deactivate", "hover:border-white", "p-5", "rounded-base", "border-solid", "border", "cursor-pointer", 3, "class"], ["mode", "outlined-blue", 3, "click", "hidden"], [1, "detail", "bg-white", "h-full", "col-span-4", "min-w-[412px]", "rounded-base"], [1, "flex", "items-center", "gap-2.5", "bg-white", "hover:bg-blue-deactivate", "hover:border-white", "p-5", "rounded-base", "border-solid", "border", "cursor-pointer", 3, "click"], ["size", "xl", 3, "detail"], [1, "flex", "flex-col"], [1, "text-sm", "font-semibold", "truncate"], [1, "text-xs"], [1, "block", "h-full", 3, "OnEvent", "iscomponent", "nCaseid", "cContactType"]], template: function CreateScheduleComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275element(2, "img", 2);
        \u0275\u0275elementStart(3, "h6", 3);
        \u0275\u0275text(4, "3 - Step 1: Choose A Witness ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "btn", 4);
        \u0275\u0275listener("click", function CreateScheduleComponent_Template_btn_click_5_listener() {
          return ctx.gotoFile();
        });
        \u0275\u0275text(6, " Next: Choose File ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "div", 5)(8, "div", 6)(9, "div", 7)(10, "div", 8);
        \u0275\u0275repeaterCreate(11, CreateScheduleComponent_For_12_Template, 7, 6, "div", 9, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "btn", 10);
        \u0275\u0275listener("click", function CreateScheduleComponent_Template_btn_click_13_listener() {
          return ctx.isNew = !ctx.isNew;
        });
        \u0275\u0275text(14, " Create a New Contact ");
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(15, CreateScheduleComponent_Conditional_15_Template, 2, 3, "div", 11);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(5);
        \u0275\u0275property("disabled", !ctx.nContactid);
        \u0275\u0275advance(6);
        \u0275\u0275repeater(ctx.witnessList);
        \u0275\u0275advance(2);
        \u0275\u0275property("hidden", ctx.isNew);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(15, ctx.isNew ? 15 : -1);
      }
    }, dependencies: [ButtonComponent, ContactFormComponent, AvatarComponent], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CreateScheduleComponent, { className: "CreateScheduleComponent", filePath: "src\\app\\presentation\\components\\witnessSchedule\\create-schedule\\create-schedule.component.ts", lineNumber: 25 });
})();
export {
  CreateScheduleComponent
};
//# sourceMappingURL=chunk-SHSKAJ5E.js.map
