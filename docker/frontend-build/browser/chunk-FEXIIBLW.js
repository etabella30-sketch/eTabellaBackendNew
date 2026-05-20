import {
  BytesPipe
} from "./chunk-PJGEM4T6.js";
import {
  ProgressComponent
} from "./chunk-XSVYOAGA.js";
import {
  MatIconModule
} from "./chunk-SUYASFF3.js";
import {
  EmptyComponent
} from "./chunk-DHVW7RW5.js";
import {
  NgScrollReached
} from "./chunk-WCB6QNSW.js";
import {
  NgScrollbar,
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import {
  SkeletonComponent
} from "./chunk-KEJC4ZXM.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  DownloadService
} from "./chunk-6XJ2ENW3.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField,
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  ScrollingModule
} from "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  ActivatedRoute
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  DatePipe,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
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
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/components/myfiles/download-section/status/status.component.ts
var _c0 = () => ["F"];
var _c1 = () => ["Q", "W"];
function StatusComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275element(1, "icon", 2);
    \u0275\u0275text(2, " Completed ");
    \u0275\u0275elementEnd();
  }
}
function StatusComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275element(1, "img", 4);
    \u0275\u0275text(2, " Something went wrong ");
    \u0275\u0275elementEnd();
  }
}
function StatusComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 5);
    \u0275\u0275element(2, "img", 6);
    \u0275\u0275elementStart(3, "h6", 7);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1("", ctx_r0.x.cStatus == "Q" ? "In Queue" : "In Waiting", " ");
  }
}
function StatusComponent_Conditional_4_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.x == null ? null : ctx_r0.x.mergeProgress, "% ");
  }
}
function StatusComponent_Conditional_4_Conditional_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "progress-bar", 11);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275property("height", 8)("progress", ctx_r0.x == null ? null : ctx_r0.x.mergeProgress)("bgclass", "bg-gray-300")("color", "bg-brand");
  }
}
function StatusComponent_Conditional_4_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8)(1, "div", 9);
    \u0275\u0275template(2, StatusComponent_Conditional_4_Conditional_0_Conditional_2_Template, 2, 1, "span", 10);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, StatusComponent_Conditional_4_Conditional_0_Conditional_4_Template, 1, 4, "progress-bar", 11);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, ctx_r0.x.actionStatus ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.x.actionStatus == "FINAL-MEARGING" ? "Preparing final archive" : "Calculating size", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(4, ctx_r0.x.actionStatus ? 4 : -1);
  }
}
function StatusComponent_Conditional_4_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "div", 13)(2, "span", 14);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(4, "progress-bar", 11);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r0.x == null ? null : ctx_r0.x.progress, "% ");
    \u0275\u0275advance();
    \u0275\u0275property("height", 8)("progress", ctx_r0.x == null ? null : ctx_r0.x.progress)("bgclass", "bg-gray-300")("color", "bg-sgreen");
  }
}
function StatusComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, StatusComponent_Conditional_4_Conditional_0_Template, 5, 3, "div", 8)(1, StatusComponent_Conditional_4_Conditional_1_Template, 5, 5);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, ctx_r0.x.actionStatus == "FINAL-MEARGING" || ctx_r0.x.actionStatus == "SIZE-UPDATING" ? 0 : 1);
  }
}
function StatusComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15);
    \u0275\u0275text(1, " Expired ");
    \u0275\u0275elementEnd();
  }
}
function StatusComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275text(1, " Retrying... ");
    \u0275\u0275elementEnd();
  }
}
var StatusComponent = class _StatusComponent {
  static {
    this.\u0275fac = function StatusComponent_Factory(t) {
      return new (t || _StatusComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _StatusComponent, selectors: [["download-status"]], inputs: { x: "x" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 7, vars: 3, consts: [[1, "me-auto"], [1, "flex", "items-center", "gap-2", "text-sgreen", "font-semibold"], ["name", "check", 1, "text-xs"], [1, "flex", "items-center", "gap-2", "text-red-600", "font-semibold"], ["width", "20px", "src", "../.././../../../../assets/icons/warningred.svg"], [1, "flex", "items-center", "gap-2"], ["src", "../../../../../assets/icons/loaderorange.svg", "alt", "", 1, "w-4", "h-4", "animate-spin"], [1, "text-xs", "text-gray-500"], [1, "flex", "flex-col", "items-center", "gap-2", "text-brand", "font-semibold"], [1, "flex", "gap-2"], [1, "text-[13px]", "font-bold", "text-brand"], [1, "w-56", 3, "height", "progress", "bgclass", "color"], [1, "flex", "flex-col", "items-center", "gap-1", "text-sm", "whitespace-nowrap"], [1, "flex", "items-center", "gap-2", "justify-between", "w-full"], [1, "text-[13px]", "font-bold", "text-sgreen"], [1, "expiry", "text-red-500", "font-semibold", "whitespace-nowrap"]], template: function StatusComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275template(1, StatusComponent_Conditional_1_Template, 3, 0, "div", 1)(2, StatusComponent_Conditional_2_Template, 3, 0)(3, StatusComponent_Conditional_3_Template, 5, 1)(4, StatusComponent_Conditional_4_Template, 2, 1)(5, StatusComponent_Conditional_5_Template, 2, 0)(6, StatusComponent_Conditional_6_Template, 2, 0);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.x.cStatus == "C" ? 1 : \u0275\u0275pureFunction0(1, _c0).includes(ctx.x.cStatus) ? 2 : \u0275\u0275pureFunction0(2, _c1).includes(ctx.x.cStatus) ? 3 : ctx.x.cStatus == "A" ? 4 : ctx.x.cStatus == "E" ? 5 : ctx.x.cStatus == "R" ? 6 : -1);
      }
    }, dependencies: [MatMenuModule, IconComponent, MatIconModule, ProgressComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(StatusComponent, { className: "StatusComponent", filePath: "src\\app\\userpanel\\components\\myfiles\\download-section\\status\\status.component.ts", lineNumber: 15 });
})();

// src/app/userpanel/components/myfiles/download-section/action/action.component.ts
function ActionComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 4);
    \u0275\u0275listener("click", function ActionComponent_Conditional_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.downloadFile());
    });
    \u0275\u0275element(1, "icon", 5);
    \u0275\u0275text(2, " Download ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("isloading", ctx_r1.isDownloadLoading);
  }
}
function ActionComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 6);
    \u0275\u0275listener("click", function ActionComponent_Conditional_2_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.retryDownload());
    });
    \u0275\u0275text(1, " Retry ");
    \u0275\u0275element(2, "icon", 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("isloading", ctx_r1.isDownloadLoading);
  }
}
function ActionComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 8);
    \u0275\u0275listener("click", function ActionComponent_Conditional_3_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.copy());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 9);
    \u0275\u0275element(2, "rect", 10)(3, "path", 11);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(4, "btn", 12);
    \u0275\u0275element(5, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "mat-menu", 14, 0)(8, "div")(9, "h6", 15);
    \u0275\u0275text(10, "Confirm Delete ?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 16)(12, "btn", 17);
    \u0275\u0275listener("click", function ActionComponent_Conditional_3_Template_btn_click_12_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.deleteFile());
    });
    \u0275\u0275text(13, " Delete");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "btn", 18);
    \u0275\u0275text(15, "cancel");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const deleteconf_r5 = \u0275\u0275reference(7);
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("square", true);
    \u0275\u0275advance(4);
    \u0275\u0275property("matMenuTriggerFor", deleteconf_r5)("square", true)("isloading", ctx_r1.isDeleteLoading);
  }
}
var ActionComponent = class _ActionComponent {
  constructor(downloadService, toast) {
    this.downloadService = downloadService;
    this.toast = toast;
    this.onEvent = new EventEmitter();
    this.isDownloadLoading = false;
    this.isDeleteLoading = false;
  }
  downloadFile() {
    return __async(this, null, function* () {
      debugger;
      this.isDownloadLoading = true;
      const url = yield this.downloadService.getDonwloadURL(this.x.nDPid);
      this.isDownloadLoading = false;
      if (url)
        window.open(url, "_blank");
    });
  }
  copy() {
    return __async(this, null, function* () {
      try {
        const url = yield this.downloadService.getDonwloadURL(this.x.nDPid);
        if (url) {
          yield navigator.clipboard.writeText(url);
          this.toast.success("Download URL copied to clipboard!");
        }
      } catch (error) {
      }
    });
  }
  retryDownload() {
    return __async(this, null, function* () {
      this.x.cStatus = "R";
      this.isDownloadLoading = true;
      yield this.downloadService.retryJob(this.x.nDPid);
      this.isDownloadLoading = false;
    });
  }
  deleteFile() {
    return __async(this, null, function* () {
      this.isDeleteLoading = true;
      try {
        const res = yield this.downloadService.deleteJob(this.x.nDPid);
        if (res?.msg == 1) {
          this.onEvent.emit({ event: "DELETE", data: { nDPid: this.x.nDPid } });
        }
      } catch (error) {
      }
      this.isDeleteLoading = false;
    });
  }
  static {
    this.\u0275fac = function ActionComponent_Factory(t) {
      return new (t || _ActionComponent)(\u0275\u0275directiveInject(DownloadService), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ActionComponent, selectors: [["download-action"]], inputs: { x: "x" }, outputs: { onEvent: "onEvent" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 4, vars: 3, consts: [["deleteconf", "matMenu"], [1, "action", "flex", "items-center", "gap-2"], ["mode", "outlined", 3, "isloading"], ["mode", "outlined", "addcls", "!text-red-500 hover:!bg-red-500 hover:!text-white", 3, "isloading"], ["mode", "outlined", 3, "click", "isloading"], ["type", "extra", "name", "download", 1, "text-lg"], ["mode", "outlined", "addcls", "!text-red-500 hover:!bg-red-500 hover:!text-white", 3, "click", "isloading"], ["name", "retry", "type", "extra"], ["mode", "outlined", 1, "ms-2", 3, "click", "square"], ["xmlns", "http://www.w3.org/2000/svg", "width", "16", "height", "16", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "lucide", "lucide-copy-icon", "lucide-copy"], ["width", "14", "height", "14", "x", "8", "y", "8", "rx", "2", "ry", "2"], ["d", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"], ["mode", "text", 1, "opacity-0", "group-hover:opacity-100", 3, "matMenuTriggerFor", "square", "isloading"], ["name", "delete", 1, "text-lg"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click"], ["mode", "dark"]], template: function ActionComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275template(1, ActionComponent_Conditional_1_Template, 3, 1, "btn", 2)(2, ActionComponent_Conditional_2_Template, 3, 1, "btn", 3)(3, ActionComponent_Conditional_3_Template, 16, 4);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.x.cStatus == "C" ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.x.cStatus == "F" ? 2 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(3, ctx.x.cStatus == "C" || ctx.x.cStatus == "F" ? 3 : -1);
      }
    }, dependencies: [IconComponent, ButtonComponent, MatMenuModule, MatMenu, MatMenuTrigger] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ActionComponent, { className: "ActionComponent", filePath: "src\\app\\userpanel\\components\\myfiles\\download-section\\action\\action.component.ts", lineNumber: 17 });
})();

// src/app/userpanel/components/myfiles/download-section/process-list/process-list.component.ts
var _c02 = () => [1, 2, 3];
function ProcessListComponent_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275text(1, " A1-91666608_1-22 08 11 - Defence.PDF ");
    \u0275\u0275elementEnd();
  }
}
var ProcessListComponent = class _ProcessListComponent {
  static {
    this.\u0275fac = function ProcessListComponent_Factory(t) {
      return new (t || _ProcessListComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ProcessListComponent, selectors: [["download-process-list"]], inputs: { x: "x" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 3, vars: 1, consts: [[1, "flex", "flex-col", "text-xs", "gap-6", "p-14"]], template: function ProcessListComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275repeaterCreate(1, ProcessListComponent_For_2_Template, 2, 0, "div", null, \u0275\u0275repeaterTrackByIdentity);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c02));
      }
    } });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ProcessListComponent, { className: "ProcessListComponent", filePath: "src\\app\\userpanel\\components\\myfiles\\download-section\\process-list\\process-list.component.ts", lineNumber: 11 });
})();

// src/app/userpanel/components/myfiles/download-section/download/download.component.ts
var _forTrack0 = ($index, $item) => $item.nDPid;
var _c03 = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
var _c12 = (a0, a1) => ({ "group-hover:bg-red-50": a0, "group-hover:bg-gray-50": a1 });
var _c2 = () => ["F", "E"];
var _c3 = (a0) => ({ "opacity-40": a0 });
function DownloadComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "empty", 2);
  }
}
function DownloadComponent_Conditional_4_Conditional_35_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 27);
    \u0275\u0275element(1, "sklton", 28)(2, "sklton", 29)(3, "sklton", 30)(4, "sklton", 31)(5, "sklton", 29);
    \u0275\u0275elementEnd();
  }
}
function DownloadComponent_Conditional_4_Conditional_35_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 26);
    \u0275\u0275repeaterCreate(2, DownloadComponent_Conditional_4_Conditional_35_For_3_Template, 6, 0, "div", 27, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(2);
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c03));
  }
}
function DownloadComponent_Conditional_4_For_37_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 25)(1, "div", 32)(2, "div", 33);
    \u0275\u0275element(3, "img", 34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 35)(5, "span", 36);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 37);
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "bytes");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "div", 38);
    \u0275\u0275text(11);
    \u0275\u0275pipe(12, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "div", 39);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "div", 20);
    \u0275\u0275element(17, "download-status", 40);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "download-action", 41);
    \u0275\u0275listener("onEvent", function DownloadComponent_Conditional_4_For_37_Template_download_action_onEvent_18_listener($event) {
      const $index_r4 = \u0275\u0275restoreView(_r3).$index;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.ActionEvent($event, $index_r4));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(20, _c12, x_r5.cStatus == "F", x_r5.cStatus != "F"));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(24, _c3, \u0275\u0275pureFunction0(23, _c2).includes(x_r5.cStatus)));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(27, _c3, \u0275\u0275pureFunction0(26, _c2).includes(x_r5.cStatus)));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r5.cTitle, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(30, _c3, \u0275\u0275pureFunction0(29, _c2).includes(x_r5.cStatus)));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(9, 12, x_r5.totalSize), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(33, _c3, \u0275\u0275pureFunction0(32, _c2).includes(x_r5.cStatus)));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(12, 14, x_r5.dStartDt, "dd/MM | hh:mm a"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(36, _c3, \u0275\u0275pureFunction0(35, _c2).includes(x_r5.cStatus)));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(15, 17, x_r5.dLastUpdateDt, "dd/MM | hh:mm a"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("x", x_r5);
    \u0275\u0275advance();
    \u0275\u0275property("x", x_r5);
  }
}
function DownloadComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 3)(1, "div", 4)(2, "h6", 5);
    \u0275\u0275text(3, "Activity Log");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 6)(5, "label", 7)(6, "span", 8);
    \u0275\u0275text(7, "Sort by:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "mat-form-field")(9, "mat-select", 9);
    \u0275\u0275twoWayListener("ngModelChange", function DownloadComponent_Conditional_4_Template_mat_select_ngModelChange_9_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.cSortBy, $event) || (ctx_r1.cSortBy = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("selectionChange", function DownloadComponent_Conditional_4_Template_mat_select_selectionChange_9_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.filterChanged());
    });
    \u0275\u0275elementStart(10, "mat-option", 10);
    \u0275\u0275text(11, "Newest");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "mat-option", 11);
    \u0275\u0275text(13, "Oldest");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(14, "btn", 12);
    \u0275\u0275listener("click", function DownloadComponent_Conditional_4_Template_btn_click_14_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.filterChanged());
    });
    \u0275\u0275text(15, "Refresh");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(16, "div", 13)(17, "header", 14)(18, "div", 15);
    \u0275\u0275text(19, "Type");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "div", 16);
    \u0275\u0275text(21, "Doc Title");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "div", 17);
    \u0275\u0275text(23, "Size");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "div", 18);
    \u0275\u0275text(25, "Start Time");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "div", 19);
    \u0275\u0275text(27, "Last Update Time");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "div", 20);
    \u0275\u0275text(29, "Status");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(30, "div", 21);
    \u0275\u0275text(31, "Action");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(32, "ng-scrollbar", 22);
    \u0275\u0275listener("reachedBottom", function DownloadComponent_Conditional_4_Template_ng_scrollbar_reachedBottom_32_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onReachEnd());
    });
    \u0275\u0275elementStart(33, "div", 23)(34, "div", 24);
    \u0275\u0275template(35, DownloadComponent_Conditional_4_Conditional_35_Template, 4, 1, "ng-container");
    \u0275\u0275repeaterCreate(36, DownloadComponent_Conditional_4_For_37_Template, 19, 38, "div", 25, _forTrack0);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(9);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.cSortBy);
    \u0275\u0275advance(26);
    \u0275\u0275conditional(35, ctx_r1.loading ? 35 : -1);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.downloadList);
  }
}
var DownloadComponent = class _DownloadComponent {
  constructor(downloadService, socketService, route, hs, userPermissions) {
    this.downloadService = downloadService;
    this.socketService = socketService;
    this.route = route;
    this.hs = hs;
    this.userPermissions = userPermissions;
    this.cSortBy = "N";
    this.loading = false;
    this.downloadList = [];
    this.PageNumber = 1;
    this.isNoMoreData = false;
    this.isInidvidualLoading = false;
    var params = this.route.snapshot.params;
    params = JSON.parse(atob(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : null;
    this.hs.nCaseid = this.nCaseid;
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngAfterViewInit() {
    this.fetchDownloadList();
    this.socketSubscription = this.socketService.downloadMessage().subscribe((msg) => {
      if (["DOWNLOAD-STATUS", "DOWNLOAD-PROGRESS"].includes(msg.event)) {
        const downloadJob = this.downloadList.find((job) => job.nDPid === msg.data?.nDPid);
        if (downloadJob) {
          this.updateDetail(downloadJob, msg.data);
        } else {
          if (msg.data?.nDPid) {
            if (this.isInidvidualLoading)
              return;
            this.fetchIndividualDownload(msg.data?.nDPid);
          }
        }
      }
    });
  }
  ngOnInit() {
  }
  updateDetail(downloadJob, body) {
    if (body?.cStatus)
      downloadJob.cStatus = body.cStatus;
    if (body?.dStartDt)
      downloadJob.dStartDt = body.dStartDt;
    downloadJob.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    if (body?.completedParts) {
      downloadJob.completedParts = body.completedParts;
    }
    if (body?.totalParts) {
      downloadJob.totalParts = body.totalParts;
    }
    if (body?.actionStatus) {
      downloadJob.actionStatus = body.actionStatus;
    }
    downloadJob.progress = this.calculateProgress(downloadJob);
    if (body?.MergeCompletedParts) {
      downloadJob.MergeCompletedParts = body.MergeCompletedParts;
    }
    if (body?.MergeTotalParts) {
      downloadJob.MergeTotalParts = body.MergeTotalParts;
    }
    if (body?.totalSize) {
      downloadJob.totalSize = body.totalSize;
    }
    downloadJob.mergeProgress = this.calculateMergeProgress(downloadJob);
  }
  filterChanged() {
    this.PageNumber = 1;
    this.downloadList = [];
    this.isNoMoreData = false;
    this.fetchDownloadList();
  }
  fetchIndividualDownload(nDPid) {
    return __async(this, null, function* () {
      this.isInidvidualLoading = true;
      const res = yield this.downloadService.getDownloadJobs(this.nCaseid, 1, this.cSortBy, nDPid);
      this.isInidvidualLoading = false;
      if (res?.length) {
        res.map((a) => a.progress = this.calculateProgress(a));
        res.map((a) => a.mergeProgress = this.calculateMergeProgress(a));
        if (nDPid) {
          const existingIndex = this.downloadList.findIndex((x) => x.nDPid == nDPid);
          if (existingIndex == -1) {
            this.downloadList.unshift(res[0]);
          }
        }
      }
    });
  }
  fetchDownloadList() {
    return __async(this, null, function* () {
      this.loading = true;
      const res = yield this.downloadService.getDownloadJobs(this.nCaseid, this.PageNumber, this.cSortBy);
      if (res?.length) {
        res.map((a) => a.progress = this.calculateProgress(a));
        res.map((a) => a.mergeProgress = this.calculateMergeProgress(a));
        this.downloadList.push(...res);
        this.PageNumber++;
        this.isNoMoreData = false;
      } else {
        this.isNoMoreData = true;
      }
      this.loading = false;
    });
  }
  calculateProgress(x) {
    if (x.totalParts == 0)
      return 0;
    if (x.completedParts == 0)
      return 0;
    if (x.completedParts >= x.totalParts)
      return 100;
    return Math.round(x.completedParts / x.totalParts * 100);
  }
  calculateMergeProgress(x) {
    if (x.MergeTotalParts == 0)
      return 0;
    if (x.MergeCompletedParts == 0)
      return 0;
    if (x.MergeCompletedParts >= x.MergeTotalParts)
      return 100;
    return Math.round(x.MergeCompletedParts / x.MergeTotalParts * 100);
  }
  onReachEnd() {
    if (this.isNoMoreData || this.loading)
      return;
    this.fetchDownloadList();
  }
  ngOnDestroy() {
    this.PageNumber = 1;
    this.downloadList = [];
    this.isNoMoreData = false;
    this.socketSubscription?.unsubscribe();
  }
  ActionEvent(event, index) {
    if (event.event == "DELETE") {
      this.downloadList.splice(index, 1);
    }
  }
  static {
    this.\u0275fac = function DownloadComponent_Factory(t) {
      return new (t || _DownloadComponent)(\u0275\u0275directiveInject(DownloadService), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DownloadComponent, selectors: [["app-download"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 5, vars: 1, consts: [[1, "pt-6", "bg-white", "h-[calc(100vh_-_55px)]", "px-7"], [1, "text-lg", "font-semibold", "mb-3"], ["head", "No Download History", 1, "block", "h-[calc(100vh_-_140px)]"], [1, "flex", "flex-col", "bg-white", "shadow-[0px_2px_9px_#94949440]"], [1, "p-6", "flex", "items-center", "justify-between"], [1, "text-sm", "font-bold", "mb-3"], [1, "flex", "items-center", "gap-4"], [1, "flex", "items-center", "gap-2"], [1, "text-xs"], ["placeholder", "Select...", 3, "ngModelChange", "selectionChange", "ngModel"], ["value", "N", 1, "!bg-gray-50", "border-b"], ["value", "O"], ["mode", "white", 3, "click"], [1, "px-6", "tablestructure", "relative", "h-[calc(100vh_-_205px)]", "pb-7", "overflow-hidden"], [1, "header", "w-full", "bg-grey", "rounded-full", "text-white", "*:flex", "*:py-1", "*:px-1", "*:items-center", "px-3", "sticky", "top-0", "z-10"], [1, "kind"], [1, "name"], [1, "size"], [1, "start"], [1, "end"], [1, "status"], [1, "action"], [3, "reachedBottom"], [1, "example-viewport", "foldervitual", "h-full"], [1, "scrollcont"], [1, "py-0", "group", "my-3"], [1, "pt-2", "pe-6", "ms-4"], [1, "flex", "items-center", "mb-3", "gap-3", "rounded-base", 2, "height", "30px"], ["bg", "base", "height", "14px", "width", "14px", 1, "me-4"], ["bg", "base", "height", "14px", "width", "360px"], ["bg", "base", "height", "14px", "width", "58px"], ["bg", "base", "height", "14px", "width", "128px"], [1, "gap-1", "h-14", "body", "px-3", "w-full", "rounded-lg", "text-mgray-600", "*:flex", "*:py-2", "*:items-center", "group-hover:shadow-md", 3, "ngClass"], [1, "kind", 3, "ngClass"], ["src", "../../../../../assets/icon/efile.svg", "alt", ""], [1, "name", "pe-2", "truncate", "w-full", "line-clamp-1", 3, "ngClass"], [1, "flex", "items-center", "gap-3", "truncate", "w-full"], [1, "size", 3, "ngClass"], [1, "start", 3, "ngClass"], [1, "end", 3, "ngClass"], [3, "x"], [3, "onEvent", "x"]], template: function DownloadComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
        \u0275\u0275text(2, "Downloaded Files");
        \u0275\u0275elementEnd();
        \u0275\u0275template(3, DownloadComponent_Conditional_3_Template, 1, 0, "empty", 2)(4, DownloadComponent_Conditional_4_Template, 38, 2);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275conditional(3, !ctx.loading && !(ctx.downloadList == null ? null : ctx.downloadList.length) ? 3 : 4);
      }
    }, dependencies: [
      CommonModule,
      NgClass,
      DatePipe,
      FormsModule,
      NgControlStatus,
      NgModel,
      SkeletonComponent,
      MatSelectModule,
      MatFormField,
      MatSelect,
      MatOption,
      MatFormFieldModule,
      ButtonComponent,
      EmptyComponent,
      ScrollingModule,
      StatusComponent,
      ActionComponent,
      BytesPipe,
      NgScrollbarModule,
      NgScrollbar,
      NgScrollReached
    ], styles: [`

.tablestructure[_ngcontent-%COMP%] {
  --kind: 45px;
  --name: 250px;
  --size: 74px;
  --start: 160px;
  --end: 160px;
  --expiry: 110px;
  --action: 160px;
  --status: calc(100% - 939px);
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%] {
  display: inline-flex;
  font-size: 12px;
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {
  width: var(--kind);
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {
  width: var(--name);
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .size[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .size[_ngcontent-%COMP%] {
  width: var(--size);
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .start[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .start[_ngcontent-%COMP%] {
  width: var(--start);
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .end[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .end[_ngcontent-%COMP%] {
  width: var(--end);
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .expiry[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .expiry[_ngcontent-%COMP%] {
  width: var(--expiry);
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .action[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .action[_ngcontent-%COMP%] {
  width: var(--action);
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .status[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .status[_ngcontent-%COMP%] {
  width: var(--status);
}
.tablestructure[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .tablestructure[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {
  width: var(--extra);
}
.tablestructure[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {
  width: calc(100% - (var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination)));
}
.hoveroptn[_ngcontent-%COMP%] {
  position: absolute;
  left: 0px;
  margin-top: auto;
  margin-bottom: auto;
  display: none;
  height: 0.875rem;
  width: 100%;
  cursor: pointer;
  align-items: center;
  border-radius: 9999px;
}
.group[_ngcontent-%COMP%]:hover   .hoveroptn[_ngcontent-%COMP%] {
  display: flex;
}
mat-option[_ngcontent-%COMP%]:hover, mat-option.mat-selected[_ngcontent-%COMP%] {
  background: transparent !important;
}
mat-option.mat-selected[_ngcontent-%COMP%]   .option[_ngcontent-%COMP%] {
  background: #F3F3F3 !important;
}
mat-option.mat-selected[_ngcontent-%COMP%]   .option[_ngcontent-%COMP%]:after {
  content: "";
  background: url("data:image/svg+xml,%3Csvg width='100%' height='100%' viewBox='0 0 15 11' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.53734 10.1592L1.08109 5.72797C1.05539 5.70241 1.035 5.67203 1.02108 5.63856C1.00716 5.6051 1 5.56921 1 5.53297C1 5.49673 1.00716 5.46084 1.02108 5.42737C1.035 5.39391 1.05539 5.36353 1.08109 5.33797L2.20609 4.21172C2.31359 4.10422 2.48734 4.10422 2.59484 4.21172L5.52859 7.12797C5.63609 7.23547 5.81109 7.23422 5.91859 7.12672L12.4011 0.581719C12.5086 0.472969 12.6836 0.472969 12.7923 0.580469L13.9186 1.70672C14.0261 1.81422 14.0261 1.98797 13.9198 2.09547L6.85734 9.22172L6.85859 9.22297L5.92734 10.1592C5.81984 10.2667 5.64484 10.2667 5.53734 10.1592Z' fill='%234F4F4F' stroke='%234F4F4F' stroke-width='0.75' stroke-miterlimit='10'/%3E%3C/svg%3E%0A");
  background-position: center;
  background-size: 12px;
  background-repeat: no-repeat;
  position: absolute;
  top: 50%;
  right: 5px;
  height: 15px !important;
  width: 12px;
  transform: translate(0, -50%);
}
.files-wrapper[_ngcontent-%COMP%] {
  --drag: 0px;
  --order: 0px;
  --checkbox: 30px;
  --bundle: 65px;
  --tab: 50px;
  --links: 0px;
  --impact: 0px;
  --relevence: 0px;
  --pagination: 55px;
  --exhibit: 75px;
  --kind: 55px;
  --doi: 100px;
  --extra: 20px;
  --name: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));
  --desc: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));
  --hasname: 2;
  --hasdesc: 2;
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%] {
  display: inline-flex;
  font-size: 10px;
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]:not(header):hover::after, .files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]:not(header).active::after, .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]:not(header):hover::after, .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]:not(header).active::after {
  content: "";
  position: absolute;
  background: rgb(255, 255, 255);
  width: calc(100% - 40px);
  border-radius: 12px;
  height: 100%;
  right: 0;
  z-index: 10;
  box-shadow: 0px 0px 5px 1px rgba(0, 64, 255, 0.501);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%] {
  width: var(--drag);
  min-width: var(--drag);
  max-width: var(--drag);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%] {
  width: var(--order);
  min-width: var(--order);
  max-width: var(--order);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%] {
  width: var(--checkbox);
  min-width: var(--checkbox);
  max-width: var(--checkbox);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%] {
  width: var(--bundle);
  min-width: var(--bundle);
  max-width: var(--bundle);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%] {
  width: var(--tab);
  min-width: var(--tab);
  max-width: var(--tab);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%] {
  width: var(--links);
  min-width: var(--links);
  max-width: var(--links);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%] {
  width: var(--impact);
  min-width: var(--impact);
  max-width: var(--impact);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%] {
  width: var(--relevence);
  min-width: var(--relevence);
  max-width: var(--relevence);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%] {
  width: var(--pagination);
  min-width: var(--pagination);
  max-width: var(--pagination);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%] {
  width: var(--exhibit);
  min-width: var(--exhibit);
  max-width: var(--exhibit);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {
  width: var(--kind);
  min-width: var(--kind);
  max-width: var(--kind);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%] {
  width: var(--doi);
  min-width: var(--doi);
  max-width: var(--doi);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {
  width: var(--extra);
  min-width: var(--extra);
  max-width: var(--extra);
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {
  max-width: calc((100% - var(--name)) / var(--hasdesc));
  flex: 1;
}
.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%] {
  flex: 1;
  max-width: calc((100% - var(--desc)) / var(--hasname));
}
/*# sourceMappingURL=download.component.css.map */`] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DownloadComponent, { className: "DownloadComponent", filePath: "src\\app\\userpanel\\components\\myfiles\\download-section\\download\\download.component.ts", lineNumber: 36 });
})();
export {
  DownloadComponent
};
//# sourceMappingURL=chunk-FEXIIBLW.js.map
