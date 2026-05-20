import {
  FileStorageService
} from "./chunk-MQ6OVKEO.js";
import {
  UploadService
} from "./chunk-ZP7PHFH3.js";
import "./chunk-3B3MCZKM.js";
import {
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
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
  ActivatedRoute,
  Title
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  DatePipe,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferOnViewport,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/upload/uploadmanager/uploadmanager.component.ts
var _forTrack0 = ($index, $item) => $item.nUPid;
var UploadmanagerComponent_Defer_20_DepsFn = () => [import("./chunk-FC2I2LG3.js").then((m) => m.uploadhistoryComponent)];
var UploadmanagerComponent_Conditional_16_Defer_2_DepsFn = () => [import("./chunk-ULYTP5KG.js").then((m) => m.uploadfileComponent)];
var UploadmanagerComponent_Conditional_17_Defer_2_DepsFn = () => [import("./chunk-VTRGOOIL.js").then((m) => m.ChoosenfilesComponent)];
function UploadmanagerComponent_span_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" | Team: ", ctx_r0.caseDetail == null ? null : ctx_r0.caseDetail.cTeamname, "");
  }
}
function UploadmanagerComponent_button_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "button", 11);
    \u0275\u0275element(1, "icon", 12);
    \u0275\u0275text(2, " Choose upload report ");
    \u0275\u0275element(3, "icon", 13);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const menu_r2 = \u0275\u0275reference(12);
    \u0275\u0275property("matMenuTriggerFor", menu_r2);
  }
}
function UploadmanagerComponent_For_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275listener("click", function UploadmanagerComponent_For_15_Template_div_click_0_listener() {
      const x_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.goToreport(x_r4));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r4.cUnicid, " ");
  }
}
function UploadmanagerComponent_Conditional_16_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "uploadfile", 15);
    \u0275\u0275listener("dataRecieved", function UploadmanagerComponent_Conditional_16_Defer_0_Template_uploadfile_dataRecieved_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.UploadEvent($event));
    });
    \u0275\u0275elementEnd();
  }
}
function UploadmanagerComponent_Conditional_16_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 16);
  }
}
function UploadmanagerComponent_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, UploadmanagerComponent_Conditional_16_Defer_0_Template, 1, 0)(1, UploadmanagerComponent_Conditional_16_DeferPlaceholder_1_Template, 1, 0);
    \u0275\u0275defer(2, 0, UploadmanagerComponent_Conditional_16_Defer_2_DepsFn, null, 1);
    \u0275\u0275deferOnViewport(0, -1);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r0.currentStep == "S");
  }
}
function UploadmanagerComponent_Conditional_17_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "choosenfiles", 17);
    \u0275\u0275listener("dataRecieved", function UploadmanagerComponent_Conditional_17_Defer_0_Template_choosenfiles_dataRecieved_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.FilesEvent($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("isUser", ctx_r0.isUser)("nSectionid", ctx_r0.nSectionid);
  }
}
function UploadmanagerComponent_Conditional_17_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 16);
  }
}
function UploadmanagerComponent_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, UploadmanagerComponent_Conditional_17_Defer_0_Template, 1, 2)(1, UploadmanagerComponent_Conditional_17_DeferPlaceholder_1_Template, 1, 0);
    \u0275\u0275defer(2, 0, UploadmanagerComponent_Conditional_17_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r0.currentStep == "L");
  }
}
function UploadmanagerComponent_Defer_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "uploadhistory", 18);
    \u0275\u0275listener("dataRecieved", function UploadmanagerComponent_Defer_18_Template_uploadhistory_dataRecieved_0_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onHistroyData($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("row_sessions", ctx_r0.row_sessions)("isUser", ctx_r0.isUser)("nSectionid", ctx_r0.nSectionid);
  }
}
function UploadmanagerComponent_DeferPlaceholder_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 19);
  }
}
var UploadmanagerComponent = class _UploadmanagerComponent {
  constructor(us, route, store, cfs, titleService, userPermissions) {
    this.us = us;
    this.route = route;
    this.store = store;
    this.cfs = cfs;
    this.titleService = titleService;
    this.userPermissions = userPermissions;
    this.report1 = 1;
    this.currentStep = "S";
    this.isUser = false;
    this.nSectionid = null;
    this.row_sessions = [];
    let params = this.route.snapshot.params;
    params = JSON.parse(atob(params["id"]));
    this.initList(params);
    this.row_sessions = this.store.getRowSessions();
  }
  initList(params) {
    return __async(this, null, function* () {
      this.nCaseid = params.c;
      this.store.getSectionDetail(params.s);
      this.store.getBundleDetail(params.b);
      this.nSectionid = params.s;
      this.isUser = params?.type == "user" ? true : false;
      this.store.getCaseDetail(params.c, this.nSectionid, this.isUser).then((res) => {
        this.caseDetail = res;
      });
      this.userPermissions.userPermissionList(this.nCaseid);
    });
  }
  UploadEvent(e) {
    if (e == "DATA-RECIEVED") {
      this.currentStep = "L";
    }
  }
  ngOnInit() {
    this.titleService.setTitle("Caseload");
  }
  FilesEvent(e) {
    if (e == "RESET-UI") {
      this.currentStep = "S";
    }
  }
  UploadingEvent(e) {
  }
  ngOnDestroy() {
  }
  onHistroyData(e) {
    if (e.event == "GO-TO-REPORT") {
      this.goToreport(e.data);
    }
  }
  goToreport(x) {
    this.cfs.goto("/upload/uploadreport", { nUPid: x.nUPid, nCaseid: this.nCaseid });
  }
  static {
    this.\u0275fac = function UploadmanagerComponent_Factory(t) {
      return new (t || _UploadmanagerComponent)(\u0275\u0275directiveInject(UploadService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(FileStorageService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(Title), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UploadmanagerComponent, selectors: [["app-uploadmanager"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 22, vars: 9, consts: [["menu", "matMenu"], [1, "flex", "flex-col", "h-full", "bg-white"], [1, "bg-blue-deactivate", "h-full", "p-10", "flex", "gap-2.5", "flex-col", "overflow-auto"], [1, "bg-dark-blue", "flex", "items-center", "py-2.5", "!px-5", "rounded-xl", "text-white"], [1, "text-[18px]"], [1, "text-xs", "block", "!mt-1"], [4, "ngIf"], ["class", "bg-white gap-2.5 text-grey text-xs rounded-base w-64 flex items-center px-3 h-8.5 ms-auto", 3, "matMenuTriggerFor", 4, "ngIf"], [1, "!min-w-64", "whitemenu", "nopadding", "mt-1", "max-h-[400px]"], [1, "p-2.5"], [1, "p-2.5", "text-xs", "hover:bg-zinc-100", "mb-2", "flex", "items-center", "justify-between", "cursor-pointer"], [1, "bg-white", "gap-2.5", "text-grey", "text-xs", "rounded-base", "w-64", "flex", "items-center", "px-3", "h-8.5", "ms-auto", 3, "matMenuTriggerFor"], ["name", "report", "type", "extra", 1, "text-base"], ["name", "chvx", 1, "-rotate-90", "text-xxs", "ms-auto"], [1, "p-2.5", "text-xs", "hover:bg-zinc-100", "mb-2", "flex", "items-center", "justify-between", "cursor-pointer", 3, "click"], [1, "h-full", 3, "dataRecieved"], [1, "h-full", "animate-pulse", "bg-dark-blue", "rounded-base"], [1, "h-full", 3, "dataRecieved", "isUser", "nSectionid"], [3, "dataRecieved", "row_sessions", "isUser", "nSectionid"], [1, "h-32", "animate-pulse", "bg-dark-blue", "rounded-base"]], template: function UploadmanagerComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "div", 3)(3, "div")(4, "span", 4);
        \u0275\u0275text(5);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(6, "span", 5);
        \u0275\u0275text(7);
        \u0275\u0275pipe(8, "date");
        \u0275\u0275template(9, UploadmanagerComponent_span_9_Template, 2, 1, "span", 6);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(10, UploadmanagerComponent_button_10_Template, 4, 1, "button", 7);
        \u0275\u0275elementStart(11, "mat-menu", 8, 0)(13, "div", 9);
        \u0275\u0275repeaterCreate(14, UploadmanagerComponent_For_15_Template, 2, 1, "div", 10, _forTrack0);
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(16, UploadmanagerComponent_Conditional_16_Template, 4, 1)(17, UploadmanagerComponent_Conditional_17_Template, 4, 1)(18, UploadmanagerComponent_Defer_18_Template, 1, 3)(19, UploadmanagerComponent_DeferPlaceholder_19_Template, 1, 0);
        \u0275\u0275defer(20, 18, UploadmanagerComponent_Defer_20_DepsFn, null, 19);
        \u0275\u0275deferOnViewport(0, -1);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(5);
        \u0275\u0275textInterpolate(ctx.caseDetail == null ? null : ctx.caseDetail.cCasename);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1("Last uploaded: ", \u0275\u0275pipeBind2(8, 6, ctx.caseDetail == null ? null : ctx.caseDetail.dUpdateDt, "dd/MM/yyyy"), " ");
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.caseDetail == null ? null : ctx.caseDetail.cTeamname);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.row_sessions == null ? null : ctx.row_sessions.length);
        \u0275\u0275advance(4);
        \u0275\u0275repeater(ctx.row_sessions);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(16, ctx.currentStep == "S" ? 16 : ctx.currentStep == "L" ? 17 : -1);
        \u0275\u0275advance(4);
        \u0275\u0275deferWhen(ctx.nCaseid);
      }
    }, dependencies: [MatSelectModule, CommonModule, NgIf, DatePipe, MatMenuModule, MatMenu, MatMenuTrigger, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UploadmanagerComponent, { className: "UploadmanagerComponent", filePath: "src\\app\\adminpanel\\components\\upload\\uploadmanager\\uploadmanager.component.ts", lineNumber: 26 });
})();
export {
  UploadmanagerComponent
};
//# sourceMappingURL=chunk-PKJGBSAF.js.map
