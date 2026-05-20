import {
  UploadService
} from "./chunk-ZP7PHFH3.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField
} from "./chunk-Y2GGPNYR.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-TNIBXRF4.js";
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
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
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
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  __async,
  __spreadValues,
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
  ɵɵpureFunction0,
  ɵɵpureFunction1,
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
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/upload/uploadreport/uploadreport.component.ts
var UploadreportComponent_Conditional_45_Defer_1_DepsFn = () => [import("./chunk-KOZCXLHP.js").then((m) => m.UploadtableComponent)];
var _c0 = (a0) => ({ "text-dark-blue": a0 });
var _c1 = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
function UploadreportComponent_For_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r1 = ctx.$implicit;
    \u0275\u0275property("value", x_r1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r1.key, " ");
  }
}
function UploadreportComponent_For_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275property("value", x_r2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r2.key, " ");
  }
}
function UploadreportComponent_For_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275property("value", x_r3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r3.key, " ");
  }
}
function UploadreportComponent_Conditional_30_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "icon", 24);
    \u0275\u0275listener("click", function UploadreportComponent_Conditional_30_Template_icon_click_2_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.clearFilter("cAction"));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r4.appliedFilter.cAction == null ? null : ctx_r4.appliedFilter.cAction.key, " ");
  }
}
function UploadreportComponent_Conditional_31_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "icon", 24);
    \u0275\u0275listener("click", function UploadreportComponent_Conditional_31_Template_icon_click_2_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.clearFilter("cDate"));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r4.appliedFilter.cDate == null ? null : ctx_r4.appliedFilter.cDate.key, " ");
  }
}
function UploadreportComponent_Conditional_32_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "icon", 24);
    \u0275\u0275listener("click", function UploadreportComponent_Conditional_32_Template_icon_click_2_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.clearFilter("cStatus"));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r4.appliedFilter.cStatus == null ? null : ctx_r4.appliedFilter.cStatus.key, " ");
  }
}
function UploadreportComponent_Conditional_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "icon", 24);
    \u0275\u0275listener("click", function UploadreportComponent_Conditional_33_Template_icon_click_2_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.clearFilter("cFormat"));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r4.appliedFilter.cFormat == null ? null : ctx_r4.appliedFilter.cFormat.key, " ");
  }
}
function UploadreportComponent_Conditional_42_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 25);
    \u0275\u0275elementStart(1, "span", 26);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", ctx_r4.historyFile == null ? null : ctx_r4.historyFile.failed, " ", (ctx_r4.historyFile == null ? null : ctx_r4.historyFile.failed) == 1 ? "file" : "files", " fail to upload");
  }
}
function UploadreportComponent_Conditional_42_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 27);
    \u0275\u0275elementStart(1, "span", 28);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext(2);
    \u0275\u0275property("src", "assets/icons/" + ((ctx_r4.historyFile == null ? null : ctx_r4.historyFile.isExpanded) ? "checkblue" : "checkgreen") + ".svg", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c0, ctx_r4.historyFile == null ? null : ctx_r4.historyFile.isExpanded));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", ctx_r4.historyFile == null ? null : ctx_r4.historyFile.completed, " files uploaded successfully ");
  }
}
function UploadreportComponent_Conditional_42_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, UploadreportComponent_Conditional_42_Conditional_0_Template, 3, 2)(1, UploadreportComponent_Conditional_42_Conditional_1_Template, 3, 5);
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, (ctx_r4.historyFile == null ? null : ctx_r4.historyFile.failed) ? 0 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, (ctx_r4.historyFile == null ? null : ctx_r4.historyFile.completed) ? 1 : -1);
  }
}
function UploadreportComponent_Conditional_44_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 34);
    \u0275\u0275element(1, "div", 37)(2, "div", 38)(3, "div", 39)(4, "div", 40)(5, "div", 40);
    \u0275\u0275elementEnd();
  }
}
function UploadreportComponent_Conditional_44_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23)(1, "div", 29);
    \u0275\u0275element(2, "div", 30)(3, "div", 31)(4, "div", 32)(5, "div", 33)(6, "div", 33);
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(7, UploadreportComponent_Conditional_44_For_8_Template, 6, 0, "div", 34, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementStart(9, "div", 35);
    \u0275\u0275element(10, "div", 36);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(7);
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c1));
  }
}
function UploadreportComponent_Conditional_45_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "uploadtable", 41);
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext(2);
    \u0275\u0275property("isReport", true)("job", ctx_r4.historyFile)("data", ctx_r4.historyFile.files)("filterdata", ctx_r4.appliedFilter);
  }
}
function UploadreportComponent_Conditional_45_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, UploadreportComponent_Conditional_45_Defer_0_Template, 1, 4);
    \u0275\u0275defer(1, 0, UploadreportComponent_Conditional_45_Defer_1_DepsFn);
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275deferWhen((ctx_r4.historyFile == null ? null : ctx_r4.historyFile.files == null ? null : ctx_r4.historyFile.files.length) && (ctx_r4.historyFile == null ? null : ctx_r4.historyFile.isExpanded));
  }
}
var UploadreportComponent = class _UploadreportComponent {
  constructor(us, route, ss, tost, userPermissions) {
    this.us = us;
    this.route = route;
    this.ss = ss;
    this.tost = tost;
    this.userPermissions = userPermissions;
    this.action = [{ key: "Action - All", value: null }, { key: "replace", value: "C" }, { key: "pause", value: "PSD" }, { key: "retry", value: "F" }];
    this.date = [{ key: "Date - All", value: null }, { key: "today", value: /* @__PURE__ */ new Date() }, { key: "yesterday", value: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() - 1)) }, { key: "date", value: null }];
    this.status = [{ key: "Status - All", value: null }, { key: "completed", value: "C" }, { key: "processing", value: "P" }, { key: "failed", value: "F" }];
    this.format = [{ key: "Format - All", value: null }, { key: "EXT", value: "EXT" }, { key: "PDF", value: "PDF" }, { key: "DOC", value: "DOC" }, { key: "JPG", value: "JPG" }, { key: "TIFF", value: "TIFF" }, { key: "PNG", value: "PNG" }];
    this.sAction = "Action - All";
    this.sStatus = "Status - All";
    this.sFormat = "Format - All";
    this.sOcrtypes = "OCR & Non OCR- All";
    this.myfilelist = [
      {
        "cFilename": "WhatsApp Image 2023-10-24 at 4.55.32 PM.jpeg",
        "cStatus": "I",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "P"
      },
      {
        "cFilename": "10111.pdf",
        "cStatus": "CO",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "R"
      },
      {
        "cFilename": "ALPHA DEVELOPER (4).xlsx",
        "cStatus": "O",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "NO"
      },
      {
        "cFilename": "ALPHA DEVELOPER (4).xlsx",
        "cStatus": "OF",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "R"
      },
      {
        "cFilename": "ALPHA DEVELOPER (4).xlsx",
        "cStatus": "C",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "P"
      },
      {
        "cFilename": "10111.pdf",
        "cStatus": "CO",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "R"
      },
      {
        "cFilename": "10111.pdf",
        "cStatus": "CO",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "R"
      },
      {
        "cFilename": "10111.pdf",
        "cStatus": "CO",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "R"
      },
      {
        "cFilename": "10111.pdf",
        "cStatus": "CO",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "R"
      },
      {
        "cFilename": "10111.pdf",
        "cStatus": "CO",
        "cSize": "100mb",
        "cKind": "pdf",
        "cAction": "R"
      }
    ];
    this.nUPid = null;
    this.files = [];
    this.appliedFilter = { cAction: this.action[0], cDate: this.date[0], cStatus: this.status[0], cFormat: this.format[0], cSearch: null, nSectionid: null };
    this.nCaseid = null;
    this.isExporting = false;
    this.exportPath = environment.reportDownload + environment.downloadpath;
    let params = this.route.snapshot.params;
    params = JSON.parse(atob(params["id"]));
    this.initList(params);
  }
  ngOnInit() {
    this.socketSubscription = this.ss.getExports().subscribe((res) => __async(this, null, function* () {
      if (res && res.event) {
        if (res.event == "EXPORT-FAILED") {
          this.tost.openSnackBar("Export failed", "E");
        } else if (res.event == "EXPORT-SUCCESS") {
          this.tost.openSnackBar("Upload report excel is ready for download", "", Infinity, "Download", () => {
            console.log("Export URL", this.exportPath + res.data.cPath);
            window.open(this.exportPath + res.data.cPath);
          });
        }
      }
    }));
  }
  ngOnDestroy() {
    this.socketSubscription.unsubscribe();
  }
  initList(params) {
    return __async(this, null, function* () {
      this.nCaseid = params.nCaseid;
      this.nUPid = params.nUPid;
      this.fetchHistory();
      this.userPermissions.userPermissionList(this.nCaseid);
    });
  }
  fetchHistory() {
    return __async(this, null, function* () {
      let res = yield this.us.fetchReportSummary(this.nCaseid, this.appliedFilter, this.nUPid);
      if (res.length) {
        this.historyFile = res[0];
        this.historyFile.isExpanded = true;
        this.historyFile.isLoading = true;
        this.getDetail();
      }
    });
  }
  getDetail() {
    return __async(this, null, function* () {
      this.files = [];
      let res = yield this.us.fetchReportDetail(this.nUPid);
      if (res) {
        this.historyFile.files.push(...res);
      }
    });
  }
  onChange(flag, e) {
    this.appliedFilter[flag] = e.value;
    this.appliedFilter = __spreadValues({}, this.appliedFilter);
  }
  clearFilter(flag) {
    if (flag == "cAction") {
      this.appliedFilter[flag] = this.action[0];
    } else if (flag == "cDate") {
      this.appliedFilter[flag] = this.date[0];
    } else if (flag == "cStatus") {
      this.appliedFilter[flag] = this.status[0];
    } else if (flag == "cFormat") {
      this.appliedFilter[flag] = this.format[0];
    }
    this.appliedFilter = __spreadValues({}, this.appliedFilter);
  }
  checkValueClear(target) {
    if (!target.value) {
      this.onChange("cSearch", { value: null });
    }
  }
  export() {
    return __async(this, null, function* () {
      this.isExporting = true;
      let mdl = { nUPid: this.nUPid, nCaseid: this.nCaseid };
      if (this.appliedFilter.cStatus.value) {
        mdl.cStatus = this.appliedFilter.cStatus.value;
      }
      if (this.appliedFilter.cAction.value) {
        mdl.cStatus = this.appliedFilter.cAction.value;
      }
      if (this.appliedFilter.cSearch) {
        mdl.cStatus = this.appliedFilter.cSearch;
      }
      let res = yield this.us.exportDetail(mdl);
      this.isExporting = false;
    });
  }
  goBack() {
    window.history.back();
  }
  static {
    this.\u0275fac = function UploadreportComponent_Factory(t) {
      return new (t || _UploadreportComponent)(\u0275\u0275directiveInject(UploadService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UploadreportComponent, selectors: [["uploadreport"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 46, vars: 15, consts: [[1, "bg-blue-deactivate", "h-full", "p-10", "overflow-auto"], [1, "h-fit", "bg-dark-blue", "!p-5", "rounded-xl", "flex", "flex-col"], [1, "text-blue-hover", "flex", "items-center"], ["name", "chvy", 1, "text-bse", "me-3", "text-white", 3, "click"], [1, "text-[18px]"], [1, "relative", "flex", "items-center", "ms-2", "cursor-pointer"], ["name", "search", 1, "absolute", "left-2.5", "z-20", "cursor-pointer", "text-sm"], ["placeholder", "Search by file name, bundle, tab, exhibit no. ", "type", "text", 1, "placeholder-shown:size-9", "cursor-pointer", "focus:cursor-auto", "placeholder-shown:z-30", "text-sm", "placeholder:text-sm", "placeholder-shown:bg-transparent", "focus:placeholder:text-blue-hover", "placeholder:text-black/0", "focus:z-10", "border", "border-white/50", "rounded-full", "focus:outline-none", "focus:w-96", "w-96", "h-9", "transition-all", "focus:ps-8", "ps-8", "bg-white/100", "focus:bg-white/100", "focus:border-blue-700", "focus:border-4", 3, "ngModelChange", "keyup.enter", "keyup", "ngModel"], [1, "flex", "items-center", "gap-2", "ms-auto"], [1, "w-40", "bg-white"], ["placeholder", "Select..", 3, "ngModelChange", "selectionChange", "ngModel"], [3, "value"], [1, "opacity-75", "my-5", "border-gray-400"], [1, "flex", "items-center", "mb-4"], ["mode", "dark", "addcls", "bg-white/10", 3, "click", "disabled"], ["name", "export", "type", "real_icn", 1, "text-white", "text-base"], [1, "flex", "items-center", "ms-auto", "gap-2", "text-white", "text-xs"], [1, "p-2", "bg-white", "rounded-lg", "text-xs", "text-grey", "flex", "gap-3", "items-center", "w-fit"], [1, "flex", "flex-col", "h-fit", "overflow-hidden"], [1, "!px-5", "py-2.5", "bg-blue-100", "flex", "items-center", "gap-2", "text-xs", "text-mgray-700", "rounded-t-lg"], ["name", "folder"], [1, "flex", "items-center", "ms-auto", "gap-2"], [1, "max-h-[600px]"], [1, "h-[444px]", "bg-white"], ["name", "backspace", "type", "extra", 1, "text-xl", 3, "click"], ["src", "assets/icons/failed.svg"], [1, "text-xs", "text-red-400"], [3, "src"], [1, "text-xs", "text-[#00B89C]", 3, "ngClass"], [1, "border-b", "flex", "items-center", "h-10", "mb-1", "[&>*]:border-x", "[&>*]:border-white"], [1, "bg-gray-200", "animate-pulse", "h-11", "w-16"], [1, "bg-gray-200", "animate-pulse", "h-11", "w-full"], [1, "bg-gray-200", "animate-pulse", "h-11", "w-32", "ms-auto"], [1, "bg-gray-200", "animate-pulse", "h-11", "w-32"], [1, "border-b", "flex", "gap-3", "items-center", "h-10", "mb-1", "px-5"], [1, "border-b", "flex", "items-center", "h-12", "mb-1", "[&>*]:border-x", "[&>*]:border-white"], [1, "bg-gray-200", "animate-pulse", "h-full", "w-full"], [1, "bg-gray-200", "animate-pulse", "h-3", "w-3"], [1, "bg-gray-200", "animate-pulse", "h-3", "w-52"], [1, "bg-gray-200", "animate-pulse", "h-3", "w-32", "ms-auto"], [1, "bg-gray-200", "animate-pulse", "h-3", "w-32"], [3, "isReport", "job", "data", "filterdata"]], template: function UploadreportComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "icon", 3);
        \u0275\u0275listener("click", function UploadreportComponent_Template_icon_click_3_listener() {
          return ctx.goBack();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "span", 4);
        \u0275\u0275text(5);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(6, "div", 5);
        \u0275\u0275element(7, "icon", 6);
        \u0275\u0275elementStart(8, "input", 7);
        \u0275\u0275twoWayListener("ngModelChange", function UploadreportComponent_Template_input_ngModelChange_8_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.appliedFilter.cSearch, $event) || (ctx.appliedFilter.cSearch = $event);
          return $event;
        });
        \u0275\u0275listener("keyup.enter", function UploadreportComponent_Template_input_keyup_enter_8_listener($event) {
          return ctx.onChange("cSearch", $event.target);
        })("keyup", function UploadreportComponent_Template_input_keyup_8_listener($event) {
          return ctx.checkValueClear($event.target);
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(9, "div", 8)(10, "mat-form-field", 9)(11, "mat-select", 10);
        \u0275\u0275twoWayListener("ngModelChange", function UploadreportComponent_Template_mat_select_ngModelChange_11_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.appliedFilter.cAction, $event) || (ctx.appliedFilter.cAction = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function UploadreportComponent_Template_mat_select_selectionChange_11_listener($event) {
          return ctx.onChange("cAction", $event);
        });
        \u0275\u0275repeaterCreate(12, UploadreportComponent_For_13_Template, 2, 2, "mat-option", 11, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(14, "mat-form-field", 9)(15, "mat-select", 10);
        \u0275\u0275twoWayListener("ngModelChange", function UploadreportComponent_Template_mat_select_ngModelChange_15_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.appliedFilter.cStatus, $event) || (ctx.appliedFilter.cStatus = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function UploadreportComponent_Template_mat_select_selectionChange_15_listener($event) {
          return ctx.onChange("cStatus", $event);
        });
        \u0275\u0275repeaterCreate(16, UploadreportComponent_For_17_Template, 2, 2, "mat-option", 11, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(18, "mat-form-field", 9)(19, "mat-select", 10);
        \u0275\u0275twoWayListener("ngModelChange", function UploadreportComponent_Template_mat_select_ngModelChange_19_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.appliedFilter.cFormat, $event) || (ctx.appliedFilter.cFormat = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function UploadreportComponent_Template_mat_select_selectionChange_19_listener($event) {
          return ctx.onChange("cFormat", $event);
        });
        \u0275\u0275repeaterCreate(20, UploadreportComponent_For_21_Template, 2, 2, "mat-option", 11, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275element(22, "hr", 12);
        \u0275\u0275elementStart(23, "div", 13)(24, "btn", 14);
        \u0275\u0275listener("click", function UploadreportComponent_Template_btn_click_24_listener() {
          return ctx.export();
        });
        \u0275\u0275element(25, "icon", 15);
        \u0275\u0275text(26, " Excel Version ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(27, "div", 16)(28, "span");
        \u0275\u0275text(29, "Applied Filter");
        \u0275\u0275elementEnd();
        \u0275\u0275template(30, UploadreportComponent_Conditional_30_Template, 3, 1, "div", 17)(31, UploadreportComponent_Conditional_31_Template, 3, 1, "div", 17)(32, UploadreportComponent_Conditional_32_Template, 3, 1, "div", 17)(33, UploadreportComponent_Conditional_33_Template, 3, 1, "div", 17);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(34, "div", 18)(35, "div", 19)(36, "b");
        \u0275\u0275text(37);
        \u0275\u0275elementEnd();
        \u0275\u0275element(38, "icon", 20);
        \u0275\u0275elementStart(39, "span");
        \u0275\u0275text(40);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(41, "div", 21);
        \u0275\u0275template(42, UploadreportComponent_Conditional_42_Template, 2, 2);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(43, "div", 22);
        \u0275\u0275template(44, UploadreportComponent_Conditional_44_Template, 11, 1, "div", 23)(45, UploadreportComponent_Conditional_45_Template, 3, 1);
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(5);
        \u0275\u0275textInterpolate1("", ctx.historyFile == null ? null : ctx.historyFile.cUnicid, " ");
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.appliedFilter.cSearch);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.appliedFilter.cAction);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.action);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.appliedFilter.cStatus);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.status);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.appliedFilter.cFormat);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.format);
        \u0275\u0275advance(4);
        \u0275\u0275property("disabled", ctx.isExporting);
        \u0275\u0275advance(6);
        \u0275\u0275conditional(30, ctx.appliedFilter.cAction && (ctx.appliedFilter.cAction == null ? null : ctx.appliedFilter.cAction.value) ? 30 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(31, ctx.appliedFilter.cDate && (ctx.appliedFilter.cDate == null ? null : ctx.appliedFilter.cDate.value) ? 31 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(32, ctx.appliedFilter.cStatus && (ctx.appliedFilter.cStatus == null ? null : ctx.appliedFilter.cStatus.value) ? 32 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(33, ctx.appliedFilter.cFormat && (ctx.appliedFilter.cFormat == null ? null : ctx.appliedFilter.cFormat.value) ? 33 : -1);
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(ctx.historyFile == null ? null : ctx.historyFile.cUnicid);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate((ctx.historyFile == null ? null : ctx.historyFile.cBundlename) ? ctx.historyFile == null ? null : ctx.historyFile.cBundlename : ctx.historyFile == null ? null : ctx.historyFile.cFolder);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(42, (ctx.historyFile == null ? null : ctx.historyFile.totalfiles) == (ctx.historyFile == null ? null : ctx.historyFile.completed) + (ctx.historyFile == null ? null : ctx.historyFile.failed) || !(ctx.historyFile == null ? null : ctx.historyFile.isLive) ? 42 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(44, (ctx.historyFile == null ? null : ctx.historyFile.isLoading) && (ctx.historyFile == null ? null : ctx.historyFile.isExpanded) ? 44 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(45, (ctx.historyFile == null ? null : ctx.historyFile.files == null ? null : ctx.historyFile.files.length) && (ctx.historyFile == null ? null : ctx.historyFile.isExpanded) ? 45 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatOption, IconComponent, CommonModule, NgClass, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, ButtonComponent], styles: ["\n\n.files-wrapper[_ngcontent-%COMP%] {\n  --drag: 0px;\n  --order: 0px;\n  --checkbox: 30px;\n  --bundle: 0px;\n  --tab: 44px;\n  --links: 0px;\n  --impact: 0px;\n  --relevence: 0px;\n  --pagination: 255px;\n  --exhibit: 75px;\n  --kind: 85px;\n  --doi: 130px;\n  --extra: 20px;\n  --name: (var(--tab) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit));\n  --desc: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%] {\n  display: inline-flex;\n  font-size: 10px;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%] {\n  width: var(--drag);\n  min-width: var(--drag);\n  max-width: var(--drag);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%] {\n  width: var(--order);\n  min-width: var(--order);\n  max-width: var(--order);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%] {\n  width: var(--checkbox);\n  min-width: var(--checkbox);\n  max-width: var(--checkbox);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%] {\n  width: var(--bundle);\n  min-width: var(--bundle);\n  max-width: var(--bundle);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%] {\n  width: var(--tab);\n  min-width: var(--tab);\n  max-width: var(--tab);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%] {\n  width: var(--links);\n  min-width: var(--links);\n  max-width: var(--links);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%] {\n  width: var(--impact);\n  min-width: var(--impact);\n  max-width: var(--impact);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%] {\n  width: var(--relevence);\n  min-width: var(--relevence);\n  max-width: var(--relevence);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%] {\n  width: var(--pagination);\n  min-width: var(--pagination);\n  max-width: var(--pagination);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%] {\n  width: var(--exhibit);\n  min-width: var(--exhibit);\n  max-width: var(--exhibit);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {\n  width: var(--kind);\n  min-width: var(--kind);\n  max-width: var(--kind);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%] {\n  width: var(--doi);\n  min-width: var(--doi);\n  max-width: var(--doi);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {\n  width: var(--extra);\n  min-width: var(--extra);\n  max-width: var(--extra);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {\n  width: calc(100% - var(--name));\n  max-width: 100%;\n  max-width: var(--tab)var(--pagination)var(--kind)var(--doi)var(--exhibit);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%] {\n  width: calc((100% - var(--desc)) / 2);\n  max-width: 100%;\n}\n/*# sourceMappingURL=uploadreport.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UploadreportComponent, { className: "UploadreportComponent", filePath: "src\\app\\adminpanel\\components\\upload\\uploadreport\\uploadreport.component.ts", lineNumber: 25 });
})();
export {
  UploadreportComponent
};
//# sourceMappingURL=chunk-R3BOFXRU.js.map
