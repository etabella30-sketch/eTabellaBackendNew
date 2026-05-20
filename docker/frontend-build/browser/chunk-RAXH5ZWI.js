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
import "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
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
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/subtype/subtype.component.ts
function SubtypeComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5);
    \u0275\u0275listener("click", function SubtypeComponent_For_7_Template_div_click_0_listener() {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.setup(item_r2));
    });
    \u0275\u0275element(1, "icon", 6);
    \u0275\u0275elementStart(2, "span", 7);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 8)(5, "span", 9);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("name", (item_r2.jOther == null ? null : item_r2.jOther.type) == "F" ? "myfiles" : (item_r2.jOther == null ? null : item_r2.jOther.type) == "W" ? "witness" : "corefile")("type", (item_r2.jOther == null ? null : item_r2.jOther.type) == "F" ? "extra" : "present");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", item_r2.cKey, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(item_r2.jOther == null ? null : item_r2.jOther.title);
  }
}
var SubtypeComponent = class _SubtypeComponent {
  constructor(PSservice, cm, route, cdr, location, hs, userPermissions) {
    this.PSservice = PSservice;
    this.cm = cm;
    this.route = route;
    this.cdr = cdr;
    this.location = location;
    this.hs = hs;
    this.userPermissions = userPermissions;
    this.subTypes = [];
    this.presentSession = {};
    var params = this.route.snapshot.params;
    params = JSON.parse(decodeURIComponent(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : "";
    hs.nCaseid = this.nCaseid;
    history.pushState(null, null, window.location.href);
    this.location.onPopState(() => {
      history.pushState(null, null, window.location.href);
    });
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngOnInit() {
    return __async(this, null, function* () {
      if (!this.nCaseid) {
        this.cm.gotoUrl("/user/dashboard");
      }
      this.presentSession = yield this.PSservice.getRvalue(this.nCaseid);
      this.subTypes = yield this.PSservice.getSTypes(this.nCaseid);
      this.cdr.detectChanges();
    });
  }
  setup(item) {
    return __async(this, null, function* () {
      this.PSservice.setRvalue({
        nCaseid: this.presentSession.nCaseid,
        nSTypeid: item.nValue,
        cSType: item?.jOther?.type
      });
      if (item?.jOther?.type == "F" || item?.jOther?.type == "W" && !item?.bIsHaveSchedules || item?.jOther?.type == "C" && !item?.nPresentid) {
        this.cm.gotoUrl("/present/setup", { id: this.nCaseid, type: item?.jOther?.type });
      } else if (item?.jOther?.type == "W") {
        this.cm.gotoUrl(`${item?.bIsHaveSchedules ? "/present/schedule-list" : "/present/createWitness"}`, { id: this.nCaseid });
      } else if (item?.jOther?.type == "C") {
        if (item.nPresentid) {
          this.cm.gotoUrl("/present/core-case", {
            id: this.nCaseid,
            nPid: item.nPresentid
          });
        } else {
          this.cm.gotoUrl("/present/core-case", { id: this.nCaseid });
        }
      }
    });
  }
  static {
    this.\u0275fac = function SubtypeComponent_Factory(t) {
      return new (t || _SubtypeComponent)(\u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(LocationStrategy), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SubtypeComponent, selectors: [["app-subtype"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 8, vars: 0, consts: [[1, "h-full", "bg-blue-deactivate", "flex", "flex-col", "overflow-hidden"], [1, "text-3xl", "font-bold", "text-dark-blue", "whitespace-nowrap", "py-10", "flex", "flex-col", "justify-center", "items-center", "gap-6", "px-24", "shadow-[0px_22px_60px_#002d5b2b]"], ["src", "assets/present/public.png", 1, "w-20"], [1, "flex", "h-[calc(100%_-_208px)]", "justify-center", "items-center", "gap-10"], [1, "bg-white", "flex", "cursor-pointer", "justify-center", "items-center", "flex-col", "h-fit", "rounded-base", "w-64", "p-10", "hover:bg-dark-blue", "group", "transition-all", "duration-200"], [1, "bg-white", "flex", "cursor-pointer", "justify-center", "items-center", "flex-col", "h-fit", "rounded-base", "w-64", "p-10", "hover:bg-dark-blue", "group", "transition-all", "duration-200", 3, "click"], [1, "text-2xl", "text-dark-blue", "group-hover:text-blue-hover", "mb-3", 3, "name", "type"], [1, "text-lg", "text-dark-blue", "font-semibold", "group-hover:text-blue-hover", "whitespace-nowrap"], [1, "border-t", "w-full", "duration-300", "border-transparent", "text-center", "text-xs", "group-hover:border-grey", "mt-0", "group-hover:pt-6", "pt-0", "max-h-0", "overflow-hidden", "group-hover:max-h-14", "group-hover:mt-6", "transition-all"], [1, "group-hover:text-white"]], template: function SubtypeComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275element(2, "img", 2);
        \u0275\u0275elementStart(3, "h6");
        \u0275\u0275text(4, " Set up a type of public presentation below ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(5, "div", 3);
        \u0275\u0275repeaterCreate(6, SubtypeComponent_For_7_Template, 7, 4, "div", 4, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(6);
        \u0275\u0275repeater(ctx.subTypes);
      }
    }, dependencies: [IconComponent], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SubtypeComponent, { className: "SubtypeComponent", filePath: "src\\app\\presentation\\components\\subtype\\subtype.component.ts", lineNumber: 23 });
})();
export {
  SubtypeComponent
};
//# sourceMappingURL=chunk-RAXH5ZWI.js.map
