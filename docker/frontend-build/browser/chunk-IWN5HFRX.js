import {
  PresentsetupService
} from "./chunk-WYIU2ETL.js";
import "./chunk-3B3MCZKM.js";
import {
  EmptyComponent
} from "./chunk-DHVW7RW5.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
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
  ɵɵpureFunction2,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/witnessSchedule/schedule-list/schedule-list.component.ts
var _c0 = (a0, a1) => ({ cFname: a0, cLname: a1 });
function ScheduleListComponent_For_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 11);
    \u0275\u0275element(1, "avtr", 12);
    \u0275\u0275elementStart(2, "h6", 13)(3, "span", 14);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div", 15)(6, "btn", 16);
    \u0275\u0275listener("click", function ScheduleListComponent_For_17_Template_btn_click_6_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.viewSchedule(x_r2.nPresentid));
    });
    \u0275\u0275text(7, " View Schedule ");
    \u0275\u0275elementEnd();
    \u0275\u0275element(8, "div", 17);
    \u0275\u0275elementStart(9, "btn", 18);
    \u0275\u0275listener("click", function ScheduleListComponent_For_17_Template_btn_click_9_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.editSchedule(x_r2));
    });
    \u0275\u0275element(10, "icon", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "btn", 20, 0);
    \u0275\u0275element(13, "icon", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "mat-menu", 22, 1)(16, "div")(17, "h6", 23);
    \u0275\u0275text(18, " Confirm delete ? ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "div", 24)(20, "btn", 16);
    \u0275\u0275listener("click", function ScheduleListComponent_For_17_Template_btn_click_20_listener() {
      const ctx_r3 = \u0275\u0275restoreView(_r1);
      const x_r2 = ctx_r3.$implicit;
      const $index_r5 = ctx_r3.$index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.deleteSchedule(x_r2.nPCid, $index_r5));
    });
    \u0275\u0275text(21, " Delete ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "btn", 25);
    \u0275\u0275text(23, " Cancel ");
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    const schedulelist_r6 = \u0275\u0275reference(15);
    \u0275\u0275advance();
    \u0275\u0275property("detail", \u0275\u0275pureFunction2(4, _c0, x_r2.cFname, x_r2.cLname));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2(" ", x_r2.cFname, " ", x_r2.cLname, " ");
    \u0275\u0275advance(7);
    \u0275\u0275property("matMenuTriggerFor", schedulelist_r6);
  }
}
var ScheduleListComponent = class _ScheduleListComponent {
  constructor(PSservice, cm, route, cdr, location, hs, userPermissions) {
    this.PSservice = PSservice;
    this.cm = cm;
    this.route = route;
    this.cdr = cdr;
    this.location = location;
    this.hs = hs;
    this.userPermissions = userPermissions;
    this.scheduleList = [];
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
      yield this.getScheduleList();
    });
  }
  getScheduleList() {
    return __async(this, null, function* () {
      this.scheduleList = yield this.PSservice.scheduleList(this.nCaseid);
      if (this.scheduleList.length == 0) {
        this.cm.gotoUrl("/present/createWitness", { id: this.nCaseid });
      }
      this.cdr.detectChanges();
    });
  }
  setup() {
    this.cm.gotoUrl("/present/setup", { id: this.nCaseid, type: "W" });
  }
  deleteSchedule(nPCid, index) {
    return __async(this, null, function* () {
      const res = yield this.PSservice.deleteSchedule(nPCid);
      if (res.msg == 1) {
        this.scheduleList.splice(index, 1);
        this.cdr.detectChanges();
      }
    });
  }
  viewSchedule(nPresentid) {
    this.cm.gotoUrl("/present/core-case", {
      id: this.nCaseid,
      nPid: nPresentid
    });
  }
  editSchedule(x) {
    this.cm.gotoUrl("/present/createWitness", {
      id: this.nCaseid,
      nCid: x.nContactid,
      nPid: x.nPresentid,
      nPCid: x.nPCid
    });
  }
  static {
    this.\u0275fac = function ScheduleListComponent_Factory(t) {
      return new (t || _ScheduleListComponent)(\u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(LocationStrategy), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ScheduleListComponent, selectors: [["app-schedule-list"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 18, vars: 0, consts: [["d", "matMenuTrigger"], ["schedulelist", "matMenu"], [1, "flex", "flex-col", "bg-[#f6f6f6]", "h-full"], [1, "text-lg", "bg-white", "font-bold", "text-dark-blue", "whitespace-nowrap", "min-h-20", "flex", "items-center", "gap-6", "px-10"], ["src", "assets/present/public.png", 1, "w-15"], [1, "h-full", "flex", "flex-col", "overflow-hidden", "w-3/4", "p-10"], [1, "flex", "justify-between", "w-full", "px-12", "h-20", "items-center", "text-blue-hover", "text-lg"], [1, "font-semibold"], [1, "ms-auto", 3, "click"], [1, "text-xs", "font-semibold", "mt-5", "mb-2.5"], [1, "h-full", "overflow-auto", "flex", "flex-col", "gap-3"], [1, "flex", "items-center", "group", "gap-2.5", "bg-white", "border", "border-white", "hover:bg-dark-blue", "hover:text-white", "p-5", "rounded-base", "h-[75px]"], [3, "detail"], [1, "flex", "flex-col", "gap-2.5"], [1, "text-sm", "font-semibold", "truncate"], [1, "ms-auto", "gap-2.5", "hidden", "group-hover:flex"], [3, "click"], [1, "h-8", "bg-tab", "w-px", "mx-2.5"], ["square", "", "mode", "darkwhite", 3, "click"], ["name", "edit"], ["square", "", "mode", "darkwhite", 3, "matMenuTriggerFor"], ["name", "delete"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base", "!min-w-52"], [1, "mb-6", "text-white", "text-xs"], [1, "flex", "gap-2"], ["mode", "dark"]], template: function ScheduleListComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 2)(1, "div", 3);
        \u0275\u0275element(2, "img", 4);
        \u0275\u0275elementStart(3, "h6");
        \u0275\u0275text(4, "1 - Step 1: Presentation Set Up");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(5, "div", 5)(6, "empty")(7, "div", 6)(8, "span", 7);
        \u0275\u0275text(9, " New Witness Schedule ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(10, "div", 8);
        \u0275\u0275listener("click", function ScheduleListComponent_Template_div_click_10_listener() {
          return ctx.setup();
        });
        \u0275\u0275elementStart(11, "btn");
        \u0275\u0275text(12, "Create ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(13, "h6", 9);
        \u0275\u0275text(14, " Saved Presentation: ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "div", 10);
        \u0275\u0275repeaterCreate(16, ScheduleListComponent_For_17_Template, 24, 7, "div", 11, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(16);
        \u0275\u0275repeater(ctx.scheduleList);
      }
    }, dependencies: [
      ButtonComponent,
      MatMenuModule,
      MatMenu,
      MatMenuTrigger,
      EmptyComponent,
      IconComponent,
      AvatarComponent
    ], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ScheduleListComponent, { className: "ScheduleListComponent", filePath: "src\\app\\presentation\\components\\witnessSchedule\\schedule-list\\schedule-list.component.ts", lineNumber: 33 });
})();
export {
  ScheduleListComponent
};
//# sourceMappingURL=chunk-IWN5HFRX.js.map
