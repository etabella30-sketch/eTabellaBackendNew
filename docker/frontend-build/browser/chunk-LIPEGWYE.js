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
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import "./chunk-4BFWRZ22.js";
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
  __spreadProps,
  __spreadValues,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferOnIdle,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpropertyInterpolate1,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/home/presenthome/presenthome.component.ts
var PresenthomeComponent_Defer_13_DepsFn = () => [import("./chunk-7LRL6R62.js").then((m) => m.PresentListComponent)];
function PresenthomeComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5)(1, "h6", 9);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "h6", 10);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", ctx_r0.caseDetails.cCasename, " - ", ctx_r0.caseDetails.nCaseid, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.caseDetails.cDesc);
  }
}
function PresenthomeComponent_For_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 11);
    \u0275\u0275listener("click", function PresenthomeComponent_For_9_Template_div_click_0_listener() {
      const item_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.setup(item_r3));
    });
    \u0275\u0275elementStart(1, "span", 12);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "img", 13);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r3 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", item_r3.cKey, "");
    \u0275\u0275advance();
    \u0275\u0275propertyInterpolate1("src", "assets/present/", item_r3 == null ? null : item_r3.jOther == null ? null : item_r3.jOther.icon, ".png", \u0275\u0275sanitizeUrl);
  }
}
function PresenthomeComponent_Defer_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "present-list", 14);
    \u0275\u0275listener("changeHandler", function PresenthomeComponent_Defer_11_Template_present_list_changeHandler_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.refetch($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("presentTypes", ctx_r0.presentTypes)("nCaseid", ctx_r0.nCaseid);
  }
}
function PresenthomeComponent_DeferPlaceholder_12_Template(rf, ctx) {
}
var PresenthomeComponent = class _PresenthomeComponent {
  constructor(PSservice, cm, route, cdr, tost, location, hs, userPermissions, ss) {
    this.PSservice = PSservice;
    this.cm = cm;
    this.route = route;
    this.cdr = cdr;
    this.tost = tost;
    this.location = location;
    this.hs = hs;
    this.userPermissions = userPermissions;
    this.ss = ss;
    this.presentTypes = [];
    this.caseDetails = {};
    var params = this.route.snapshot.params;
    params = JSON.parse(decodeURIComponent(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : null;
    hs.nCaseid = this.nCaseid;
    history.pushState(null, null, window.location.href);
    this.location.onPopState(() => {
      history.pushState(null, null, window.location.href);
    });
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngOnInit() {
    this.initilise();
  }
  initilise() {
    return __async(this, null, function* () {
      try {
        this.userdetail = yield this.ss.getUserInfo();
        this.caseDetails = yield this.PSservice.caseDetail(this.nCaseid);
        if (!this.userdetail?.isAdmin && !this.caseDetails?.permisson) {
          this.cm.gotoUrl("/user/dashboard");
          return;
        }
        this.presentTypes = yield this.PSservice.getTypes();
        this.presentSession = yield this.PSservice.getRvalue(this.nCaseid);
        yield this.getPresentDetail();
      } catch (error) {
        console.error("Error initializing presentation home:", error);
      } finally {
        this.cdr.detectChanges();
      }
    });
  }
  setup(item) {
    return __async(this, null, function* () {
      let data = {
        nCaseid: this.nCaseid,
        nTypeid: item.nValue,
        cType: item.jOther.type
      };
      if (this.presentSession?.nTypeid != data.nTypeid) {
        data = __spreadProps(__spreadValues({}, data), { cName: "", cSType: "", jUsers: [], nSTypeid: 0 });
      }
      if (data?.cType == "G" && this.presentDetail?.nPublicid) {
        this.tost.openSnackBar("Global presentation already created can not create new one", "E");
        return;
      } else if (data?.cType == "P" && this.presentDetail?.nPrivateid) {
        this.tost.openSnackBar("Private presentation already created can not create new one", "E");
        return;
      }
      yield this.PSservice.setRvalue(data);
      if (data.cType == "G") {
        this.cm.gotoUrl("/present/subtype", { id: this.nCaseid });
      } else if (data.cType == "P") {
        this.cm.gotoUrl("/present/setup", { id: this.nCaseid });
      }
    });
  }
  getPresentDetail() {
    return __async(this, null, function* () {
      this.presentDetail = yield this.PSservice.getPresentHomeDetail(this.nCaseid);
      this.cdr.detectChanges();
    });
  }
  refetch(e) {
    if (e == "refetch") {
      this.getPresentDetail();
    }
  }
  static {
    this.\u0275fac = function PresenthomeComponent_Factory(t) {
      return new (t || _PresenthomeComponent)(\u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(LocationStrategy), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(UserPermissionService), \u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PresenthomeComponent, selectors: [["presenthome"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 15, vars: 1, consts: [[1, "h-full", "bg-blue-deactivate", "px-24"], [1, "h-28", "bg-gradient-to-b", "-translate-y-6", "from-[#002d5b2b]", "to-transparent", "top-1/2", "absolute", "w-full", "left-0"], [1, "flex", "h-full", "pt-24", "gap-24", "relative", "z-50"], [1, "w-1/2", "h-full", "flex", "flex-col", "items-center", "justify-center"], [1, "text-3xl", "font-bold", "text-dark-blue", "mb-10", "whitespace-nowrap"], [1, "bg-white", "rounded-b-base", "border-[#DAE2EA]", "text-center", "w-full", "flex", "flex-col", "gap-1", "py-3", "shadow-[0px_4px_4px_#00000040]"], [1, "h-[170px]", "mt-11", "flex", "justify-around", "w-full"], [1, "gap-6", "flex", "items-center", "flex-col", "cursor-pointer"], [1, "w-1/2"], [1, "text-dark-blue", "text-xs", "font-semibold"], [1, "text-dark-blue", "text-xxs"], [1, "gap-6", "flex", "items-center", "flex-col", "cursor-pointer", 3, "click"], [1, "text-lg", "text-dark-blue", "font-semibold"], ["draggable", "false", 1, "w-36", 3, "src"], [3, "changeHandler", "presentTypes", "nCaseid"]], template: function PresenthomeComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275element(1, "div", 1);
        \u0275\u0275elementStart(2, "div", 2)(3, "div", 3)(4, "div", 4);
        \u0275\u0275text(5, " Choose a type of presentation to begin ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(6, PresenthomeComponent_Conditional_6_Template, 5, 3, "div", 5);
        \u0275\u0275elementStart(7, "div", 6);
        \u0275\u0275repeaterCreate(8, PresenthomeComponent_For_9_Template, 4, 3, "div", 7, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "div", 8);
        \u0275\u0275template(11, PresenthomeComponent_Defer_11_Template, 1, 2)(12, PresenthomeComponent_DeferPlaceholder_12_Template, 0, 0);
        \u0275\u0275defer(13, 11, PresenthomeComponent_Defer_13_DepsFn, null, 12);
        \u0275\u0275deferOnIdle();
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(6);
        \u0275\u0275conditional(6, ctx.caseDetails.msg == 1 ? 6 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.presentTypes);
      }
    }, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PresenthomeComponent, { className: "PresenthomeComponent", filePath: "src\\app\\presentation\\components\\home\\presenthome\\presenthome.component.ts", lineNumber: 31 });
})();
export {
  PresenthomeComponent
};
//# sourceMappingURL=chunk-LIPEGWYE.js.map
