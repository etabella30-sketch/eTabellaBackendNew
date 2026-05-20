import {
  FoldersComponent,
  SectionComponent
} from "./chunk-YDR4HYTS.js";
import {
  PaginationService
} from "./chunk-3FBNC3RN.js";
import "./chunk-TR5DVTEU.js";
import "./chunk-UPZPMN2N.js";
import "./chunk-BOOJJNDB.js";
import "./chunk-DHVW7RW5.js";
import {
  NgScrollbar,
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import "./chunk-KEJC4ZXM.js";
import {
  TruncateTooltipDirective
} from "./chunk-QRO7O7ZW.js";
import "./chunk-QZORCCWS.js";
import "./chunk-PNJCYNRI.js";
import "./chunk-43QUFIPG.js";
import "./chunk-ILBZODYX.js";
import "./chunk-M4TJ3SSY.js";
import "./chunk-6XJ2ENW3.js";
import "./chunk-KCDHWQ5X.js";
import {
  MatSelect,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField
} from "./chunk-Y2GGPNYR.js";
import "./chunk-FEMUAMTL.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import "./chunk-DWVFAK3Q.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import {
  MatDialog
} from "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
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
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
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
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  CommonModule,
  DatePipe,
  Location,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  firstValueFrom,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtextInterpolate4,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/caseactivity/caseactivity.service.ts
var CaseactivityService = class _CaseactivityService {
  constructor(sStore, http) {
    this.sStore = sStore;
    this.http = http;
  }
  getCaseLS() {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/getcasels`));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getUserLS(nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/getuserls`, { params: { nCaseid } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getSession(nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/getsessionls`, { params: { nCaseid } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getUserLog(nCaseid, nUserid, cType = "L", pageNo, daterange) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/getuserlog`, { params: { nCaseid, nUserid, cType, pageNumber: pageNo, startDt: daterange.start.toISOString(), endDt: daterange.end.toISOString() } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getConnection(nCaseid, nSesid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/getConnections`, { params: { nCaseid, nSesid } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getBundleDetail(nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/getBundledata`, { params: { nCaseid } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  geteScandata(nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/getScandata`, { params: { nCaseid } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  geteStoragedata(nCaseid) {
    return __async(this, null, function* () {
      debugger;
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/getStoragedata`, { params: { nCaseid } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  scanPaginateData(nCaseid, nSectionid, jBundles) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/scan_paginate`, { params: { nCaseid, nSectionid, jBundles } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  downloadScanDetail(nCaseid, nSectionid, jBundles) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/downlaodscan_paginate`, { params: { nCaseid, nSectionid, jBundles } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  downloadURI(uri, name) {
    const fileName = uri;
    this.downloadFile(fileName).subscribe((blob) => {
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = name;
      a.click();
      URL.revokeObjectURL(objectUrl);
    }, (error) => {
      console.error("Download error:", error);
    });
  }
  downloadFile(cPath) {
    let params = new HttpParams();
    params = params.set("cPath", cPath);
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return this.http.get(`${environment.cloudUrl}${environment.coreservice}/caseactivity/download`, {
      params,
      headers,
      responseType: "blob"
      // Important to specify blob as the response type
    });
  }
  static {
    this.\u0275fac = function CaseactivityService_Factory(t) {
      return new (t || _CaseactivityService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CaseactivityService, factory: _CaseactivityService.\u0275fac, providedIn: "root" });
  }
};

// src/app/adminpanel/components/activity-log/scan-pagination/scan-pagination.component.ts
var _c0 = ["folderCom"];
var _c1 = (a0) => ({ "me-auto": a0 });
var _c2 = (a0) => ({ "!text-blue-on font-bold": a0 });
var _c3 = (a0) => ({ nUPid: null, isadmin: a0, isChooser: false });
var _c4 = (a0) => ({ "truncate max-w-40": a0 });
function ScanPaginationComponent_Conditional_1_span_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275text(1, "/");
    \u0275\u0275elementEnd();
  }
}
function ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_1_span_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275text(1, "/");
    \u0275\u0275elementEnd();
  }
}
function ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 23);
    \u0275\u0275text(1, "...");
    \u0275\u0275elementEnd();
    \u0275\u0275template(2, ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_1_span_2_Template, 2, 0, "span", 18);
    \u0275\u0275elementStart(3, "a", 24);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.nBundleid && ctx_r1.brdcrumb.length);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c4, ctx_r1.brdcrumb.length > 3));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.brdcrumb[ctx_r1.brdcrumb.length - 1].cBundlename, " ");
  }
}
function ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_2_For_1_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275text(1, "/");
    \u0275\u0275elementEnd();
  }
}
function ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_2_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "li", 25);
    \u0275\u0275listener("click", function ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_2_For_1_Template_li_click_0_listener() {
      const ctx_r3 = \u0275\u0275restoreView(_r3);
      const x_r5 = ctx_r3.$implicit;
      const $index_r6 = ctx_r3.$index;
      const ctx_r1 = \u0275\u0275nextContext(4);
      ctx_r1.nBundleid = x_r5.nBundleid;
      return \u0275\u0275resetView(ctx_r1.changeBrdcrumb($index_r6));
    });
    \u0275\u0275elementStart(1, "a", 26);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_2_For_1_span_3_Template, 2, 0, "span", 18);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    const $index_r6 = ctx.$index;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("tooltipText", x_r5.cBundlename)("ngClass", \u0275\u0275pureFunction1(5, _c4, ctx_r1.brdcrumb.length > 3))("ngClass", \u0275\u0275pureFunction1(7, _c2, $index_r6 == ctx_r1.brdcrumb.length - 1));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r5.cBundlename, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", $index_r6 != ctx_r1.brdcrumb.length - 1);
  }
}
function ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_2_For_1_Template, 4, 9, "li", 23, \u0275\u0275repeaterTrackByIndex);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275repeater(ctx_r1.brdcrumb);
  }
}
function ScanPaginationComponent_Conditional_1_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 19);
    \u0275\u0275template(1, ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_1_Template, 5, 5)(2, ScanPaginationComponent_Conditional_1_Conditional_6_Conditional_2_Template, 2, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r1.brdcrumb.length > 1 ? 1 : 2);
  }
}
function ScanPaginationComponent_Conditional_1_app_section_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-section", 27);
    \u0275\u0275listener("changeSection", function ScanPaginationComponent_Conditional_1_app_section_7_Template_app_section_changeSection_0_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.changeSection($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("nCaseid", ctx_r1.nCaseid)("activeSection", ctx_r1.activeSection);
  }
}
function ScanPaginationComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "div", 15)(2, "li", 16);
    \u0275\u0275listener("click", function ScanPaginationComponent_Conditional_1_Template_li_click_2_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      ctx_r1.nBundleid = null;
      return \u0275\u0275resetView(ctx_r1.brdcrumb = []);
    });
    \u0275\u0275elementStart(3, "a", 17);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, ScanPaginationComponent_Conditional_1_span_5_Template, 2, 0, "span", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, ScanPaginationComponent_Conditional_1_Conditional_6_Template, 3, 1, "div", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, ScanPaginationComponent_Conditional_1_app_section_7_Template, 1, 2, "app-section", 20);
    \u0275\u0275elementStart(8, "folders", 21, 0);
    \u0275\u0275listener("changeFolder", function ScanPaginationComponent_Conditional_1_Template_folders_changeFolder_8_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.changeFolder($event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(12, _c1, !ctx_r1.nBundleid));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(14, _c2, !ctx_r1.brdcrumb.length));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.activeSection == null ? null : ctx_r1.activeSection.cFolder, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.nBundleid && ctx_r1.brdcrumb.length);
    \u0275\u0275advance();
    \u0275\u0275conditional(6, ctx_r1.nBundleid ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.isadmin);
    \u0275\u0275advance();
    \u0275\u0275property("detail", \u0275\u0275pureFunction1(16, _c3, ctx_r1.isadmin))("cFoldertype", ctx_r1.cFoldertype)("nSectionid", (ctx_r1.activeSection == null ? null : ctx_r1.activeSection.nSectionid) ? ctx_r1.activeSection == null ? null : ctx_r1.activeSection.nSectionid : null)("nCaseid", ctx_r1.nCaseid)("nBundleid", ctx_r1.nBundleid ? ctx_r1.nBundleid : null)("nSelectedFolderid", ctx_r1.nSelectedFolderid);
  }
}
function ScanPaginationComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 7);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("hidden", ctx_r1.isWholeCase);
  }
}
function ScanPaginationComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 8);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("hidden", !ctx_r1.isWholeCase);
  }
}
function ScanPaginationComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 28);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "span", 29);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", (ctx_r1.scanResult == null ? null : ctx_r1.scanResult.pagenatedfiles) ? ctx_r1.scanResult == null ? null : ctx_r1.scanResult.pagenatedfiles : 0, " Paginated files found ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", (ctx_r1.scanResult == null ? null : ctx_r1.scanResult.notpagenatedfiles) ? ctx_r1.scanResult == null ? null : ctx_r1.scanResult.notpagenatedfiles : 0, " Not Paginated files found ");
  }
}
function ScanPaginationComponent_Conditional_13_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 44);
    \u0275\u0275listener("click", function ScanPaginationComponent_Conditional_13_Conditional_14_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.scan());
    });
    \u0275\u0275text(1, " Scan");
    \u0275\u0275elementEnd();
  }
}
function ScanPaginationComponent_Conditional_13_Conditional_15_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 45);
    \u0275\u0275text(1, "Paginating");
    \u0275\u0275elementEnd();
  }
}
function ScanPaginationComponent_Conditional_13_Conditional_15_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 45);
    \u0275\u0275text(1, "Scanning");
    \u0275\u0275elementEnd();
  }
}
function ScanPaginationComponent_Conditional_13_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 43);
    \u0275\u0275template(1, ScanPaginationComponent_Conditional_13_Conditional_15_Conditional_1_Template, 2, 0, "h6", 45)(2, ScanPaginationComponent_Conditional_13_Conditional_15_Conditional_2_Template, 2, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r1.paginating ? 1 : 2);
  }
}
function ScanPaginationComponent_Conditional_13_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 43)(1, "h6", 45);
    \u0275\u0275text(2, "Completed ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "h6", 46);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1("", ctx_r1.progress, "%");
  }
}
function ScanPaginationComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12);
    \u0275\u0275element(1, "div", 30);
    \u0275\u0275elementStart(2, "div", 31)(3, "div", 32)(4, "div", 33)(5, "div", 34);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 35)(7, "defs")(8, "mask", 36);
    \u0275\u0275element(9, "circle", 37);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "g", 38);
    \u0275\u0275element(11, "circle", 39)(12, "circle", 40);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(13, "div", 41);
    \u0275\u0275template(14, ScanPaginationComponent_Conditional_13_Conditional_14_Template, 2, 0, "btn", 42)(15, ScanPaginationComponent_Conditional_13_Conditional_15_Template, 3, 1, "div", 43)(16, ScanPaginationComponent_Conditional_13_Conditional_16_Template, 5, 1, "div", 43);
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.sStatus == "R" ? "after:block" : "after:hidden");
    \u0275\u0275advance(3);
    \u0275\u0275classMap(ctx_r1.sStatus == "C" ? "border-green-500" : "border-white");
    \u0275\u0275advance(8);
    \u0275\u0275attribute("stroke-dasharray", ctx_r1.progress * 10 + " 1000");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(14, ctx_r1.sStatus == "S" && !ctx_r1.paginating ? 14 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(15, ctx_r1.sStatus == "R" || ctx_r1.paginating ? 15 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(16, ctx_r1.sStatus == "C" && !ctx_r1.paginating ? 16 : -1);
  }
}
function ScanPaginationComponent_Conditional_14_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 43)(1, "h6", 45);
    \u0275\u0275text(2, "Paginating");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "h6", 46);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1("", ctx_r1.progress, "%");
  }
}
function ScanPaginationComponent_Conditional_14_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 43)(1, "h6", 45);
    \u0275\u0275text(2, "Completed ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "h6", 46);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1("", ctx_r1.progress, "%");
  }
}
function ScanPaginationComponent_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12);
    \u0275\u0275element(1, "div", 30);
    \u0275\u0275elementStart(2, "div", 31)(3, "div", 32)(4, "div", 33)(5, "div", 34);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 35)(7, "defs")(8, "mask", 36);
    \u0275\u0275element(9, "circle", 37);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "g", 38);
    \u0275\u0275element(11, "circle", 39)(12, "circle", 40);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(13, "div", 41);
    \u0275\u0275template(14, ScanPaginationComponent_Conditional_14_Conditional_14_Template, 5, 1, "div", 43)(15, ScanPaginationComponent_Conditional_14_Conditional_15_Template, 5, 1, "div", 43);
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.pStatus == "R" ? "after:block" : "after:hidden");
    \u0275\u0275advance(3);
    \u0275\u0275classMap(ctx_r1.pStatus == "C" ? "border-green-500" : "border-white");
    \u0275\u0275advance(8);
    \u0275\u0275attribute("stroke-dasharray", ctx_r1.progress * 10 + " 1000");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(14, ctx_r1.pStatus == "R" || ctx_r1.paginating ? 14 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(15, ctx_r1.pStatus == "C" && !ctx_r1.paginating ? 15 : -1);
  }
}
function ScanPaginationComponent_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 13);
    \u0275\u0275listener("click", function ScanPaginationComponent_Conditional_18_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.PaginateNonPaginatedFiles());
    });
    \u0275\u0275text(1, " Apply Pagination ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("isloading", ctx_r1.paginating);
  }
}
var ScanPaginationComponent = class _ScanPaginationComponent {
  constructor(dialog, cdr, caseactivityService, cf, ss, paginationS) {
    this.dialog = dialog;
    this.cdr = cdr;
    this.caseactivityService = caseactivityService;
    this.cf = cf;
    this.ss = ss;
    this.paginationS = paginationS;
    this.sStatus = "S";
    this.pStatus = "S";
    this.progress = 0;
    this.nSelectedFolderid = [];
    this.brdcrumb = [];
    this.isWholeCase = false;
    this.scanning = false;
    this.downloading = false;
    this.scanResult = {};
    this.paginating = false;
    this.socketSubscription = this.ss.getPagination().subscribe((res) => {
      const data = res?.data?.data || [];
      if (data && data.nCaseid == this.nCaseid) {
        console.log("pagination data", data);
        if (data.cStatus == "P") {
          this.cf.paginationdata = data;
          this.progress = Number(this.calcCompPprogres(cf.paginationdata.comp_progres, cf.paginationdata.total_prog));
          if (!this.cf.isPagination) {
            this.cf.isPagination = true;
          }
        }
        if (data.cStatus == "C") {
          this.progress = 100;
          this.paginating = false;
          this.pStatus = "S";
          this.cf.isPagination = false;
          this.cf.paginationdata = {};
        }
        if (data.cStatus == "S") {
          this.progress = 100;
          this.paginating = false;
          this.pStatus = "S";
          this.cf.isPagination = false;
          this.cf.paginationdata = {};
        }
      }
    });
  }
  ngOnInit() {
  }
  scan() {
    if (this.scanning)
      return;
    this.sStatus = "R";
    this.getScanData();
    this.updateProg();
  }
  updateProg() {
    this.progress = 0;
    const startTime = Date.now();
    const duration = 5e3;
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressValue = Math.min(elapsed / duration, 1);
      this.progress = Math.floor(progressValue * 100);
      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      } else {
        if (!this.scanning) {
          this.progress = 100;
          this.sStatus = "C";
        } else {
          this.progress = 0;
          updateProgress();
        }
      }
    };
    requestAnimationFrame(updateProgress);
  }
  getScanData() {
    return __async(this, null, function* () {
      this.scanning = true;
      let jBundles = "{}";
      debugger;
      if (this.nSelectedFolderid.length > 0) {
        jBundles = `{${this.nSelectedFolderid.map((x) => x.id)}}`;
      }
      const res = yield this.caseactivityService.scanPaginateData(this.nCaseid, this.activeSection?.nSectionid ? this.activeSection?.nSectionid : null, jBundles);
      this.scanning = false;
      this.scanResult = res[0];
    });
  }
  close() {
    this.dialog.closeAll();
  }
  changeFolder(event) {
    console.log("CHANGE FOLDER", event);
    if (event["brdcrumb"]) {
      if (event["brdcrumb"].length) {
        this.brdcrumb = event["brdcrumb"];
        this.nBundleid = this.brdcrumb.length ? this.brdcrumb[this.brdcrumb.length - 1]["nBundleid"] : 0;
      } else {
        this.brdcrumb = [];
        this.nBundleid = null;
      }
      return;
    }
    if (event == "SELECTED") {
      this.updateSelectedFiles();
    }
  }
  getsection() {
  }
  changeSection(x) {
    return __async(this, null, function* () {
      this.activeSection = x;
      this.activeSection = x;
      this.cFoldertype = x.cFoldertype;
      this.cdr.detectChanges();
    });
  }
  changeBrdcrumb(index) {
    this.brdcrumb = this.brdcrumb.filter((e, i) => i <= index);
    this.nBundleid = this.brdcrumb.length ? this.brdcrumb[this.brdcrumb.length - 1]["nBundleid"] : 0;
  }
  updateSelectedFiles() {
    return __async(this, null, function* () {
      let selectedFIds = [];
      let removeFids = [];
      try {
        selectedFIds = this.folderCom.TREE_DATA.filter((e) => e["cIscheck"] && selectedFIds.length ? selectedFIds.some((i) => i.id == e.nBundleid) : e["cIscheck"]).map(({ nBundleid, nParentBundleid }) => ({ id: nBundleid, pid: nParentBundleid }));
        this.nSelectedFolderid = [...this.nSelectedFolderid, ...selectedFIds];
        removeFids = this.folderCom.TREE_DATA.filter((e) => !e["cIscheck"]).map((e) => e.nBundleid);
        this.nSelectedFolderid = this.nSelectedFolderid.filter((x) => !removeFids.includes(x.id));
        const validBundleIds = this.folderCom.TREE_DATA.map((e) => e.nBundleid);
        this.nSelectedFolderid = this.nSelectedFolderid.filter((folder) => {
          if (folder.pid && this.nSelectedFolderid.some((f) => f.id === folder.pid)) {
            return validBundleIds.includes(folder.id);
          }
          return true;
        });
        this.nSelectedFolderid = this.nSelectedFolderid.filter((value, index, self) => index === self.findIndex((t) => t.id === value.id && t.pid === value.pid));
        this.cdr.detectChanges();
        return true;
      } catch (error) {
        console.error("File selection error", error);
        return false;
      }
    });
  }
  downLoadScandetail() {
    return __async(this, null, function* () {
      if (this.downloading) {
        this.downloading;
      }
      this.downloading = true;
      let jBundles = "{}";
      debugger;
      if (this.nSelectedFolderid.length > 0) {
        jBundles = `{${this.nSelectedFolderid.map((x) => x.id)}}`;
      }
      let res = yield this.caseactivityService.downloadScanDetail(this.nCaseid, this.activeSection?.nSectionid ? this.activeSection?.nSectionid : null, jBundles);
      this.downloading = false;
      if (res.msg == 1) {
        let filename = this.replaceSpecialChars(`Paginated_file_${this.casename}`);
        this.caseactivityService.downloadURI(res.cPath, `${filename}.xlsx`);
      }
    });
  }
  replaceSpecialChars(str) {
    return str.replace(/[^a-zA-Z0-9]/g, "_");
  }
  PaginateNonPaginatedFiles() {
    return __async(this, null, function* () {
      var model = {
        nSectionid: this.activeSection?.nSectionid ? this.activeSection?.nSectionid : null,
        nCaseid: this.nCaseid
      };
      let res = yield this.paginationS.paginateNonPaginated(model);
      if (res) {
        this.pStatus = "R";
        this.updatePaginationProg();
      } else {
        this.pStatus = "S";
        this.paginating = false;
      }
    });
  }
  updatePaginationProg() {
    return __async(this, null, function* () {
      this.progress = 0;
      const startTime = Date.now();
      const duration = 5e3;
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        if (this.pStatus == "R") {
          requestAnimationFrame(updateProgress);
        } else {
          if (!this.paginating) {
            this.progress = 0;
            this.pStatus = "S";
            this.scan();
          } else {
            this.progress = 0;
            updateProgress();
          }
        }
      };
      requestAnimationFrame(updateProgress);
    });
  }
  calcCompPprogres(completedFiles, totalFiles) {
    if (totalFiles === 0) {
      return 0;
    }
    return (completedFiles / totalFiles * 100).toFixed();
  }
  static {
    this.\u0275fac = function ScanPaginationComponent_Factory(t) {
      return new (t || _ScanPaginationComponent)(\u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CaseactivityService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(PaginationService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ScanPaginationComponent, selectors: [["app-scan-pagination"]], viewQuery: function ScanPaginationComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.folderCom = _t.first);
      }
    }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 19, vars: 10, consts: [["folderCom", ""], [1, "flex", "h-full", "bg-neutral-800/50", "backdrop-blur-md", "ps-10"], [1, "w-[372px]", "flex", "flex-col", "bg-neutral-100", "rounded-base", "h-[calc(100%_-_80px)]", "p-5", "mt-10"], [1, "flex", "flex-col", "items-center", "h-full"], [1, "bg-dark-blue", "w-[258px]", "flex", "items-center", "justify-center", "gap-4", "rounded-b-base", "h-24"], [1, "text-white", "text-3xl"], [1, "bg-grey", "rounded-full", "p-2", "h-8.5", "w-8.5", "flex", "items-center", "justify-center", "border", "border-white", 3, "click"], ["name", "chvx", 1, "text-white", "text-xs", 3, "hidden"], ["name", "chvx", 1, "text-white", "text-xs", "rotate-180", 3, "hidden"], ["name", "close", 1, "text-white", "text-xs", "absolute", "top-8", "right-8", 3, "click"], [1, "flex", "items-center", "justify-center", "gap-2.5", "h-fit", "my-auto"], [1, "flex", "items-center", "w-[372px]", "h-[372px]", "rounded-full", "bg-[#676c72]", "p-5"], [1, "flex", "items-center", "justify-center", "h-full", "w-full", "rounded-full", "bg-black/45", "p-3", "relative", "overflow-hidden"], ["mode", "darkwhite", 1, "mb-3", 3, "click", "isloading"], ["mode", "darkwhite", 1, "mb-3", 3, "isloading"], [1, "flex", "items-center", "whitespace-nowrap", "justify-end", "mb-3"], [1, "inline-flex", "items-center", "cursor-pointer", "me-auto", 3, "click", "ngClass"], [1, "flex", "items-center", "text-sm", "text-gray-500", "hover:text-blue-600", "focus:outline-none", "focus:text-blue-600", 3, "ngClass"], ["class", "mx-2", 4, "ngIf"], [1, "flex", "me-auto"], [3, "nCaseid", "activeSection", "changeSection", 4, "ngIf"], [1, "block", "h-full", "w-full", "[&>.folderscroll]:!h-full", 3, "changeFolder", "detail", "cFoldertype", "nSectionid", "nCaseid", "nBundleid", "nSelectedFolderid"], [1, "mx-2"], [1, "inline-flex", "items-center", "cursor-pointer"], [1, "items-center", "block", "max-w-44", "truncate", "text-sm", "text-blue-600", "focus:outline-none", "font-semibold", 3, "ngClass"], [1, "inline-flex", "items-center", "cursor-pointer", 3, "click"], ["truncateTooltip", "", 1, "items-center", "block", "max-w-48", "truncate", "text-sm", "text-gray-500", "hover:text-blue-600", "focus:outline-none", "focus:text-blue-600", 3, "tooltipText", "ngClass"], [3, "changeSection", "nCaseid", "activeSection"], [1, "mt-auto", "text-white", "text-3xl"], [1, "mt-5", "text-white", "text-xl"], [1, "absolute", "flex", "items-center", "h-[93%]", "w-[93%]", "left-1/2", "top-1/2", "origin-center", "rounded-full", "bg-[#2e2828]", "before:bg-[#2e2828]", "p-3", "overflow-hidden", "binker"], [1, "flex", "items-center", "h-full", "w-full", "rounded-full", "bg-[#2B2524]", "p-3"], [1, "flex", "items-center", "justify-center", "h-full", "w-full", "p-1.5", "bg-[#393b3f]", "rounded-full", "relative", "overflow-hidden", "z-20"], [1, "flex", "items-center", "h-full", "w-full", "border-[11px]", "rounded-full", "bg-[#7c7d80]", "shadow-[inset_1px_1px_7px_#000000]", "p-1", "relative", "overflow-hidden"], [1, "w-full", "h-full", "flex", "items-center", "justify-center", "p-3"], ["viewBox", "0 0 100 100", "width", "285", "xmlns", "http://www.w3.org/2000/svg", 1, "absolute"], ["id", "mask01"], ["id", "c1", "cx", "50", "cy", "50", "r", "40", "fill", "none", "stroke", "#ffffff", "stroke-width", "3.5", "stroke-dasharray", "3 5", "pathLength", "1000"], ["transform", "rotate(-90 50 50)"], ["mask", "url(#mask01)", "cx", "50", "opacity", "0.5", "cy", "50", "r", "40", "fill", "none", "stroke", "Gainsboro", "stroke-width", "10"], ["id", "c2", "mask", "url(#mask01)", "cx", "50", "cy", "50", "r", "40", "fill", "none", "stroke", "#fff", "stroke-width", "3.5", "pathLength", "1000"], [1, "flex", "items-center", "h-full", "w-full", "rounded-full", "p-3", "bg-gradient-to-b", "from-[#002f647e]", "to-[#005eca80]"], ["mode", "gradient", "addcls", "rounded-full px-5", 1, "mx-auto"], [1, "text-center", "w-full"], ["mode", "gradient", "addcls", "rounded-full px-5", 1, "mx-auto", 3, "click"], [1, "uppercase", "text-white", "text-2xl"], [1, "uppercase", "text-white", "text-xs", "mt-2"]], template: function ScanPaginationComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275template(1, ScanPaginationComponent_Conditional_1_Template, 10, 18, "div", 2);
        \u0275\u0275elementStart(2, "div", 3)(3, "div", 4)(4, "h6", 5);
        \u0275\u0275text(5, "Whole Case");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(6, "span", 6);
        \u0275\u0275listener("click", function ScanPaginationComponent_Template_span_click_6_listener() {
          return ctx.isWholeCase = !ctx.isWholeCase;
        });
        \u0275\u0275template(7, ScanPaginationComponent_Conditional_7_Template, 1, 1, "icon", 7)(8, ScanPaginationComponent_Conditional_8_Template, 1, 1, "icon", 8);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(9, "icon", 9);
        \u0275\u0275listener("click", function ScanPaginationComponent_Template_icon_click_9_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275template(10, ScanPaginationComponent_Conditional_10_Template, 4, 2);
        \u0275\u0275elementStart(11, "div", 10)(12, "div", 11);
        \u0275\u0275template(13, ScanPaginationComponent_Conditional_13_Template, 17, 8, "div", 12)(14, ScanPaginationComponent_Conditional_14_Template, 16, 7, "div", 12);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(15, "div", 10)(16, "btn", 13);
        \u0275\u0275listener("click", function ScanPaginationComponent_Template_btn_click_16_listener() {
          return ctx.downLoadScandetail();
        });
        \u0275\u0275text(17, "Download scan detail ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(18, ScanPaginationComponent_Conditional_18_Template, 2, 1, "btn", 14);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.isWholeCase ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.isWholeCase ? "w-[calc(100%_-_372px)]" : "w-full");
        \u0275\u0275advance(5);
        \u0275\u0275conditional(7, !ctx.isWholeCase ? 7 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(8, ctx.isWholeCase ? 8 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(10, ctx.sStatus == "C" ? 10 : -1);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(13, ctx.pStatus == "S" ? 13 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(14, ctx.pStatus != "S" ? 14 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275property("isloading", ctx.downloading);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(18, (ctx.scanResult == null ? null : ctx.scanResult.notpagenatedfiles) > 0 && ctx.sStatus == "C" ? 18 : -1);
      }
    }, dependencies: [CommonModule, NgClass, NgIf, ButtonComponent, IconComponent, FoldersComponent, SectionComponent, MatTooltipModule, TruncateTooltipDirective], styles: [`

.dashed[_ngcontent-%COMP%] {
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='500' ry='500' stroke='%234f4f4f' stroke-width='25' stroke-dasharray='3' stroke-dashoffset='0' stroke-linecap='butt'/%3e%3c/svg%3e");
  border-radius: 500px;
}
#dashed-circle-progress[_ngcontent-%COMP%] {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
.progress-radial[_ngcontent-%COMP%] {
  stroke-linecap: round;
}
.progress-radial-track[_ngcontent-%COMP%] {
  stroke: #333333;
  stroke-width: 9;
}
.progress-radial-bar[_ngcontent-%COMP%] {
  fill: #66cdc3;
}
.binker[_ngcontent-%COMP%] {
  transform: rotate(0deg) translate(-50%, -50%);
  animation-name: _ngcontent-%COMP%_spineer;
  animation-duration: 1000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  transform-origin: 0 0;
}
.binker[_ngcontent-%COMP%]::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 20px;
  height: 60px;
  background-color: #ff3d00;
  border-radius: 50%;
  filter: blur(10px);
}
.binker[_ngcontent-%COMP%]::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 26px);
  height: calc(100% - 26px);
  z-index: 10;
  border-radius: 50%;
}
@keyframes _ngcontent-%COMP%_spineer {
  0% {
    transform: rotate(0deg) translate(-50%, -50%);
  }
  100% {
    transform: rotate(360deg) translate(-50%, -50%);
  }
}
/*# sourceMappingURL=scan-pagination.component.css.map */`] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ScanPaginationComponent, { className: "ScanPaginationComponent", filePath: "src\\app\\adminpanel\\components\\activity-log\\scan-pagination\\scan-pagination.component.ts", lineNumber: 26 });
})();

// src/app/adminpanel/components/activity-log/case-activity/case-activity.component.ts
function CaseActivityComponent_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275property("value", x_r2.nCaseid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r2.cCasename, " ");
  }
}
function CaseActivityComponent_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Display all services");
    \u0275\u0275elementEnd();
  }
}
function CaseActivityComponent_Conditional_15_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 52);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r3);
  }
}
function CaseActivityComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, CaseActivityComponent_Conditional_15_For_1_Template, 2, 1, "span", 52, \u0275\u0275repeaterTrackByIndex);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275repeater(ctx_r3.selectedview);
  }
}
function CaseActivityComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 15);
  }
}
function CaseActivityComponent_For_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 56);
    \u0275\u0275listener("click", function CaseActivityComponent_For_22_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      \u0275\u0275nextContext();
      const bundle_r6 = \u0275\u0275reference(12);
      return \u0275\u0275resetView(bundle_r6.close());
    });
    \u0275\u0275elementStart(1, "div", 57)(2, "span", 58);
    \u0275\u0275element(3, "icon", 59)(4, "icon", 60);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r7 = ctx.$implicit;
    \u0275\u0275property("value", x_r7.name);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", x_r7.name, " ");
  }
}
function CaseActivityComponent_For_53_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "avtr", 61);
    \u0275\u0275listener("click", function CaseActivityComponent_For_53_Template_avtr_click_0_listener() {
      const x_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.selectUser(x_r9));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r9 = ctx.$implicit;
    \u0275\u0275classMap(x_r9.isSelected ? "" : "hover:scale-125");
    \u0275\u0275property("detail", x_r9)("size", x_r9.isSelected ? "lg" : "sm");
  }
}
function CaseActivityComponent_For_66_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r10 = ctx.$implicit;
    \u0275\u0275property("value", x_r10.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r10.key, " ");
  }
}
function CaseActivityComponent_Conditional_68_tr_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 67)(1, "td", 68);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "td", 69);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "td", 69);
    \u0275\u0275text(7);
    \u0275\u0275pipe(8, "date");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r12 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(3, 3, x_r12.dCreateDt, "dd-MMM-yyyy"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r12.cCategory, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(8, 6, x_r12.dCreateDt, "H:mm"), " ");
  }
}
function CaseActivityComponent_Conditional_68_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "cdk-virtual-scroll-viewport", 62, 1);
    \u0275\u0275listener("scroll", function CaseActivityComponent_Conditional_68_Template_cdk_virtual_scroll_viewport_scroll_0_listener($event) {
      \u0275\u0275restoreView(_r11);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.scrolled($event));
    });
    \u0275\u0275elementStart(2, "table", 63)(3, "thead", 64)(4, "tr")(5, "th", 65);
    \u0275\u0275text(6, " Date ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "th", 65);
    \u0275\u0275text(8, " Action ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "th", 65);
    \u0275\u0275text(10, " Time ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "tbody");
    \u0275\u0275template(12, CaseActivityComponent_Conditional_68_tr_12_Template, 9, 9, "tr", 66);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(12);
    \u0275\u0275property("cdkVirtualForOf", ctx_r3.userLoglist)("cdkVirtualForTrack", ctx_r3.x);
  }
}
function CaseActivityComponent_Conditional_69_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 70)(1, "h6", 71);
    \u0275\u0275text(2, "No data found");
    \u0275\u0275elementEnd()();
  }
}
function CaseActivityComponent_Conditional_79_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "circle", 50);
    \u0275\u0275element(1, "animateTransform", 72);
    \u0275\u0275elementEnd();
  }
}
function CaseActivityComponent_Conditional_80_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275element(0, "circle", 73);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275attribute("stroke-dashoffset", 440 - 440 * ctx_r3.usedpercentage / 100);
  }
}
function CaseActivityComponent_Conditional_91_Conditional_5_For_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r15 = ctx.$implicit;
    \u0275\u0275property("value", x_r15);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r15.cName, " ");
  }
}
function CaseActivityComponent_Conditional_91_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "h6", 84);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "mat-form-field", 7)(4, "mat-select", 8);
    \u0275\u0275twoWayListener("ngModelChange", function CaseActivityComponent_Conditional_91_Conditional_5_Template_mat_select_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.activeSession, $event) || (ctx_r3.activeSession = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("selectionChange", function CaseActivityComponent_Conditional_91_Conditional_5_Template_mat_select_selectionChange_4_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.getConnection());
    });
    \u0275\u0275elementStart(5, "mat-select-trigger", 12)(6, "div", 85);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 86);
    \u0275\u0275element(8, "path", 87)(9, "path", 88)(10, "path", 89)(11, "path", 90);
    \u0275\u0275elementEnd();
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()();
    \u0275\u0275repeaterCreate(13, CaseActivityComponent_Conditional_91_Conditional_5_For_14_Template, 2, 2, "mat-option", 9, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(2, 3, ctx_r3.activeSession.dStartDt, "dd MMM, yyyy"));
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("ngModel", ctx_r3.activeSession);
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate1(" ", ctx_r3.activeSession.cName, " ");
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r3.sessionlist);
  }
}
function CaseActivityComponent_Conditional_91_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 70)(1, "h6", 71);
    \u0275\u0275text(2, "No data found");
    \u0275\u0275elementEnd()();
  }
}
function CaseActivityComponent_Conditional_91_For_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r16 = ctx.$implicit;
    \u0275\u0275property("value", x_r16.nTeamid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r16.cTeamname, " ");
  }
}
function CaseActivityComponent_Conditional_91_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 74)(1, "span", 75);
    \u0275\u0275text(2, "RT");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "div", 76)(4, "div", 77);
    \u0275\u0275template(5, CaseActivityComponent_Conditional_91_Conditional_5_Template, 15, 6)(6, CaseActivityComponent_Conditional_91_Conditional_6_Template, 3, 0);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 78)(8, "h6", 79);
    \u0275\u0275text(9, "Connections");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "mat-form-field", 80)(11, "mat-select", 39);
    \u0275\u0275twoWayListener("ngModelChange", function CaseActivityComponent_Conditional_91_Template_mat_select_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r3 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r3.nTeamid, $event) || (ctx_r3.nTeamid = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("selectionChange", function CaseActivityComponent_Conditional_91_Template_mat_select_selectionChange_11_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.getTeamConnection());
    });
    \u0275\u0275repeaterCreate(12, CaseActivityComponent_Conditional_91_For_13_Template, 2, 2, "mat-option", 9, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "div", 81)(15, "div", 82);
    \u0275\u0275text(16);
    \u0275\u0275elementStart(17, "span", 52);
    \u0275\u0275text(18, "onsite");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "div", 82);
    \u0275\u0275text(20);
    \u0275\u0275elementStart(21, "span", 52);
    \u0275\u0275text(22, "Remote");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(23, "div", 83);
    \u0275\u0275listener("click", function CaseActivityComponent_Conditional_91_Template_div_click_23_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.goToRealtimeLog());
    });
    \u0275\u0275text(24, " View RT Log ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap(false ? "" : "back4 border-none");
    \u0275\u0275advance(4);
    \u0275\u0275conditional(5, ctx_r3.sessionlist.length ? 5 : 6);
    \u0275\u0275advance(6);
    \u0275\u0275twoWayProperty("ngModel", ctx_r3.nTeamid);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r3.connectionTeam);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", (ctx_r3.connectionDetail == null ? null : ctx_r3.connectionDetail.nLUser) || 0, " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", (ctx_r3.connectionDetail == null ? null : ctx_r3.connectionDetail.nOUser) || 0, " ");
  }
}
function CaseActivityComponent_Conditional_92_For_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 96)(1, "span", 111);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r18 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r18.nTotal);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r18.cType, " ");
  }
}
function CaseActivityComponent_Conditional_92_Conditional_44_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "date");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Last scanned ", \u0275\u0275pipeBind2(2, 1, ctx_r3.scanData == null ? null : ctx_r3.scanData.lastscan, "dd-MMM-yyyy"), "");
  }
}
function CaseActivityComponent_Conditional_92_Conditional_48_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 112);
    \u0275\u0275listener("click", function CaseActivityComponent_Conditional_92_Conditional_48_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r19);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.DownloadExcel());
    });
    \u0275\u0275text(1, " Excel ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275property("isloading", ctx_r3.downloading);
  }
}
function CaseActivityComponent_Conditional_92_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "h6", 44);
    \u0275\u0275text(2, "eBundle Workspace Setup");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "div", 91)(4, "div", 92)(5, "div", 93)(6, "h6", 94);
    \u0275\u0275text(7, "Uploaded ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "ng-scrollbar", 33)(9, "div", 95);
    \u0275\u0275repeaterCreate(10, CaseActivityComponent_Conditional_92_For_11_Template, 4, 2, "div", 96, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(12, "div", 97)(13, "div", 81)(14, "div", 98)(15, "span");
    \u0275\u0275text(16);
    \u0275\u0275elementEnd();
    \u0275\u0275element(17, "icon", 99);
    \u0275\u0275elementStart(18, "span", 52);
    \u0275\u0275text(19, "Total Files");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(20, "div", 98)(21, "span");
    \u0275\u0275text(22);
    \u0275\u0275elementEnd();
    \u0275\u0275element(23, "icon", 100);
    \u0275\u0275elementStart(24, "span", 52);
    \u0275\u0275text(25, "Total Folders");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(26, "div", 101)(27, "div", 102)(28, "div", 103)(29, "h6", 27);
    \u0275\u0275text(30, "Rename");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(31, "h6", 104);
    \u0275\u0275text(32);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(33, "div", 105)(34, "h6", 27);
    \u0275\u0275text(35, "Conversion");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(36, "h6", 104);
    \u0275\u0275text(37);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(38, "div", 106)(39, "div", 107)(40, "h6", 27);
    \u0275\u0275text(41, "Pagination");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(42, "h6", 104);
    \u0275\u0275text(43);
    \u0275\u0275elementEnd();
    \u0275\u0275template(44, CaseActivityComponent_Conditional_92_Conditional_44_Template, 3, 4, "span", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(45, "div", 108)(46, "btn", 109);
    \u0275\u0275listener("click", function CaseActivityComponent_Conditional_92_Template_btn_click_46_listener() {
      \u0275\u0275restoreView(_r17);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.scan());
    });
    \u0275\u0275text(47, "Scan");
    \u0275\u0275elementEnd();
    \u0275\u0275template(48, CaseActivityComponent_Conditional_92_Conditional_48_Template, 2, 1, "btn", 110);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(8);
    \u0275\u0275property("visibility", "hover")("appearance", "compact");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r3.fileTypes);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate((ctx_r3.bundleData == null ? null : ctx_r3.bundleData.nBDids) ? ctx_r3.bundleData == null ? null : ctx_r3.bundleData.nBDids : 0);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate((ctx_r3.bundleData == null ? null : ctx_r3.bundleData.nBids) ? ctx_r3.bundleData == null ? null : ctx_r3.bundleData.nBids : 0);
    \u0275\u0275advance(10);
    \u0275\u0275textInterpolate((ctx_r3.scanData == null ? null : ctx_r3.scanData.renameCount) ? ctx_r3.scanData == null ? null : ctx_r3.scanData.renameCount : 0);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r3.scanData == null ? null : ctx_r3.scanData.nConverts);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1("", ctx_r3.scanData == null ? null : ctx_r3.scanData.nPaginates, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(44, (ctx_r3.scanData == null ? null : ctx_r3.scanData.lastscan) ? 44 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275conditional(48, (ctx_r3.scanData == null ? null : ctx_r3.scanData.lastscan) ? 48 : -1);
  }
}
var CaseActivityComponent = class _CaseActivityComponent {
  constructor(route, caseactivityService, dialog, localtion, cm, userPermissions) {
    this.route = route;
    this.caseactivityService = caseactivityService;
    this.dialog = dialog;
    this.localtion = localtion;
    this.cm = cm;
    this.userPermissions = userPermissions;
    this.loading = false;
    this.limit = 30;
    this.Lpageno = 0;
    this.selectedview = [];
    this.categories = [
      { name: "RT/Presentation Connection", value: "C" },
      { name: "eBundle Workspace Setup", value: "W" }
    ];
    this.dateCategory = [
      { value: "N", key: "Today" },
      { value: "W", key: "This Week" },
      { value: "M", key: "This Month" }
    ];
    this.userList = [];
    this.nCaseid = null;
    this.caselist = [];
    this.userlist = [];
    this.userLoglist = [];
    this.sessionlist = [];
    this.nUserid = null;
    this.nSesid = 0;
    this.cLogtype = "L";
    this.datetype = "N";
    this.daterange = { start: /* @__PURE__ */ new Date(), end: /* @__PURE__ */ new Date() };
    this.activeSession = {};
    this.connectionTeam = [];
    this.connectionData = [];
    this.connectionDetail = {};
    this.nTeamid = 0;
    this.fileTypes = [];
    this.bundleData = {};
    this.scanData = {};
    this.assignStorage = 214748364800;
    this.storagesize = { value: 0, sizes: "Bytes" };
    this.usedpercentage = 0;
    this.selecteduser = {};
    this.downloading = false;
    this.loadingstorage = false;
    var params = this.route.snapshot.params;
    params = JSON.parse(atob(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : 0;
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngOnInit() {
    this.storagesize = this.formatBytes(this.assignStorage);
    this.getCaselist();
    if (this.nCaseid) {
      this.getUserlist();
      this.getsessionlist();
      this.geteBundleData();
      this.geteScandata();
      this.geteStoragedata();
    }
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.selectedview = ["RT/Presentation Connection", "eBundle Workspace Setup"];
    });
  }
  goBack() {
    this.localtion.back();
  }
  getCaselist() {
    return __async(this, null, function* () {
      const res = yield this.caseactivityService.getCaseLS();
      if (res && res.length) {
        this.caselist = res;
        if (this.nCaseid)
          this.casename = this.caselist.find((e) => e.nCaseid == this.nCaseid)?.cCasename;
      }
    });
  }
  selectAll() {
    this.selectedview = this.categories.map((e) => e.name);
  }
  changeCase() {
    this.getUserlist();
    this.getsessionlist();
    this.geteBundleData();
    this.geteScandata();
    this.geteStoragedata();
  }
  getUserlist() {
    return __async(this, null, function* () {
      this.userList = [];
      this.userLoglist = [];
      const res = yield this.caseactivityService.getUserLS(this.nCaseid);
      if (res && res.length) {
        this.userList = res;
        this.userList[0]["isSelected"] = true;
        this.selectUser(this.userList[0]);
      } else {
        this.userList = [];
        this.userLoglist = [];
      }
    });
  }
  selectUser(x) {
    this.userList.forEach((e) => {
      if (e.nUserid != x.nUserid) {
        e.isSelected = false;
      }
    });
    if (x.nUserid != this.nUserid) {
      x.isSelected = true;
      this.selecteduser = x;
      this.nUserid = x.nUserid;
      this.getUserLog(1);
    }
  }
  getUserLog(pageno = 1) {
    return __async(this, null, function* () {
      this.Lpageno = pageno;
      const res = yield this.caseactivityService.getUserLog(this.nCaseid, this.nUserid, this.cLogtype, pageno, this.daterange);
      this.userLoglist = res;
    });
  }
  changeDateType() {
    const currentDate = /* @__PURE__ */ new Date();
    if (this.datetype == "N") {
      this.daterange = { start: currentDate, end: currentDate };
    } else if (this.datetype == "W") {
      this.daterange = { start: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - (currentDate.getDay() + 2)), end: currentDate };
    } else if (this.datetype == "M") {
      this.daterange = { start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), end: currentDate };
    }
  }
  scrolled(ev) {
    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();
    if (this.loading) {
      return;
    }
    if (end === total) {
      var pageno = total / this.limit + 1;
      if (pageno % 1 || pageno < this.userLoglist.length / this.limit) {
        return;
      }
      if (this.Lpageno == pageno) {
        return;
      }
      ;
      this.getUserLog(pageno);
    }
  }
  scan() {
    const dialogRef = this.dialog.open(ScanPaginationComponent, {
      width: "100%",
      height: "100%",
      panelClass: ["noroundedandshadow", "nobackground"]
    });
    dialogRef.componentInstance.nCaseid = this.nCaseid;
    dialogRef.componentInstance.casename = this.casename;
    dialogRef.afterClosed().subscribe(() => {
      this.geteScandata();
    });
  }
  trackById(index, item) {
    return item;
  }
  getsessionlist() {
    return __async(this, null, function* () {
      this.sessionlist = [];
      this.connectionTeam = [];
      this.connectionData = [];
      this.nTeamid = null;
      this.connectionDetail = {};
      const res = yield this.caseactivityService.getSession(this.nCaseid);
      if (res && res.length) {
        this.sessionlist = res;
        this.activeSession = this.sessionlist[0];
        this.getConnection();
      } else {
        this.sessionlist = [];
      }
    });
  }
  getConnection() {
    return __async(this, null, function* () {
      this.connectionTeam = [];
      this.connectionData = [];
      this.nTeamid = null;
      this.connectionDetail = {};
      const res = yield this.caseactivityService.getConnection(this.nCaseid, this.activeSession.nSesid);
      if (res && res.length) {
        this.connectionTeam = res[0];
        this.connectionData = res[1];
        this.nTeamid = this.connectionTeam && this.connectionTeam.length ? this.connectionTeam[0].nTeamid : [];
        this.getTeamConnection();
      }
    });
  }
  getTeamConnection() {
    const ind = this.connectionData.findIndex((e) => e.nTeamid == this.nTeamid);
    if (ind > -1) {
      this.connectionDetail = this.connectionData[ind];
    } else {
      this.connectionDetail = {};
    }
  }
  goToRealtimeLog() {
    this.cm.goto("realtimelog", { id: this.nCaseid });
  }
  geteBundleData() {
    return __async(this, null, function* () {
      this.fileTypes = [];
      this.bundleData = {};
      const res = yield this.caseactivityService.getBundleDetail(this.nCaseid);
      if (res && res.length) {
        this.fileTypes = res[0];
        this.bundleData = res[1] && res[1].length ? res[1][0] : {};
      } else {
        this.fileTypes = [];
        this.bundleData = {};
      }
    });
  }
  geteScandata() {
    return __async(this, null, function* () {
      this.usedpercentage = 0;
      this.scanData = [];
      const res = yield this.caseactivityService.geteScandata(this.nCaseid);
      if (res && res.length) {
        this.scanData = res[0];
        this.scanData["dDays"] = this.getDifferenceInDays(this.scanData?.dCaseCreateDt ? this.scanData?.dCaseCreateDt : /* @__PURE__ */ new Date());
      } else {
        this.scanData = [];
      }
    });
  }
  geteStoragedata() {
    return __async(this, null, function* () {
      this.loadingstorage = true;
      this.usedpercentage = 0;
      this.fileSize = this.formatBytes(0);
      const res = yield this.caseactivityService.geteStoragedata(this.nCaseid);
      this.loadingstorage = false;
      if (res && res?.msg == 1) {
        this.fileSize = this.formatBytes(res.totalSize);
        this.usedpercentage = this.calculateStorageUsage(res.totalSize, this.assignStorage);
      } else {
      }
    });
  }
  formatBytes(bytes) {
    if (bytes === 0)
      return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return { value: value.toFixed(2), sizes: sizes[i] };
  }
  calculateStorageUsage(usedSize, totalSize) {
    if (totalSize === 0) {
      return "Total size cannot be zero";
    }
    const percentage = usedSize / totalSize * 100;
    return percentage.toFixed(2);
  }
  DownloadExcel() {
    return __async(this, null, function* () {
      this.downloading = true;
      const res = yield this.caseactivityService.downloadScanDetail(this.nCaseid, null, "{}");
      debugger;
      this.downloading = false;
      if (res && res.msg == 1) {
        let filename = this.replaceSpecialChars(`Paginated_file_${this.casename}`);
        this.caseactivityService.downloadURI(res.cPath, `${filename}.xlsx`);
      }
    });
  }
  getDifferenceInDays(dateString) {
    const givenDate = new Date(dateString);
    const currentDate = /* @__PURE__ */ new Date();
    const diffTime = currentDate.getTime() - givenDate.getTime();
    return Math.floor(diffTime / (1e3 * 60 * 60 * 24));
  }
  replaceSpecialChars(str) {
    return str.replace(/[^a-zA-Z0-9]/g, "_");
  }
  static {
    this.\u0275fac = function CaseActivityComponent_Factory(t) {
      return new (t || _CaseActivityComponent)(\u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(CaseactivityService), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(Location), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CaseActivityComponent, selectors: [["app-case-activity"]], viewQuery: function CaseActivityComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(CdkVirtualScrollViewport, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.viewport = _t.first);
      }
    }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 93, vars: 31, consts: [["bundle", ""], ["scrollViewport", ""], [1, "h-[100px]", "px-10", "flex", "items-center"], [1, "text-lg", "font-bold", "flex", "items-center", "h-full", 3, "click"], ["name", "chvy", 1, "text-bse", "me-3"], [1, "h-[calc(100%_-_100px)]", "bg-dark-blue", "!p-10", "flex", "flex-col", "overflow-auto"], [1, "flex", "gap-2.5", "mb-11"], [1, "bg-white", "w-full"], ["placeholder", "Select...", 3, "ngModelChange", "selectionChange", "ngModel"], [3, "value"], [1, "bg-white", "w-[320px]"], ["placeholder", "Select...", "multiple", "", "name", "item", "panelClass", "!p-0", 3, "ngModelChange", "ngModel"], [1, "py-0"], ["disabled", "", 1, "nocheck", "group", "my-0.5", "[&>span]:!opacity-100", "[&>.mat-pseudo-checkbox-disabled]:!opacity-100", "!pointer-events-auto", "!cursor-pointer", 3, "click", "value"], [1, "flex", "items-center", "gap-2", "px-4", "w-full"], ["name", "check", 1, "text-xs", "ms-auto"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "flex", "gap-x-6", "h-full"], [1, "grid", "grid-cols-6", "gap-2.5", "h-full", "w-[35%]", "content-baseline"], [1, "col-span-6"], [1, "text-blue-hover", "font-semibold"], [1, "p-5", "back1", "h-fit", "col-span-3", "rounded-base", "text-white", "relative", "cursor-pointer"], [1, "font-semibold", "w-full", "flex", "items-center", "whitespace-nowrap"], [1, "text-xxs", "p-1", "bg-blue-on"], [1, "px-2", "py-1", "rounded-full", "bg-sgreen", "text-xxs", "font-semibold", "ms-auto"], [1, "text-5xl", "font-semibold", "mt-3"], [1, "p-5", "h-fit", "back2", "col-span-3", "rounded-base", "text-white", "relative"], [1, "font-semibold", "text-sm"], [1, "p-5", "h-full", "back3", "col-span-6", "rounded-base", "text-white", "relative"], [1, "font-semibold", "text-sm", "mb-2.5"], [1, "flex", "gap-6", "items-center", "bg-[#E64100]", "px-2.5", "rounded-base", "h-15"], [1, "text-5xl"], [1, "h-auto", "my-2", "self-stretch", "w-px", "bg-white/50"], [3, "visibility", "appearance"], [1, "flex", "gap-2.5", "items-center", "overflow-auto", "py-2.5"], [1, "cursor-pointer", "transition-all", 3, "detail", "size", "class"], [1, "flex", "gap-2.5", "mt-2.5"], [1, "whitespace-nowrap"], [1, "w-32", "!border-white/50", "ms-auto"], ["placeholder", "Select...", 1, "!flex", 2, "--mat-select-enabled-trigger-text-color", "white", "--mat-select-placeholder-text-color", "white", "--mat-mdc-select-trigger-height", "20px", "--caretclr", "white", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "w-24", "!border-white/50"], [1, "relative", "overflow-x-auto", "mt-3.5", "h-52"], ["itemSize", "32", 1, "example-viewport", "foldervitual", "h-full"], [1, "w-[15%]", "min-h-[518px]", "max-h-[calc(100vh_-_280px)]"], [1, "text-blue-hover", "font-semibold", "mb-2.5"], [1, "h-full", "rounded-base", "border", "text-white", "border-blue-deactivate/20", "flex", "flex-col", "items-center", "justify-center"], [1, "text-[#315C95]", "text-3xl", "font-semibold"], [1, "relative"], ["width", "200", "height", "200", "viewBox", "-20 -20 200 200", "version", "1.1", "xmlns", "http://www.w3.org/2000/svg", 1, "text-blue-hover", 2, "transform", "rotate(-90deg)"], ["r", "70", "cx", "80", "cy", "80", "fill", "transparent", "stroke", "#315C95", "stroke-width", "18"], ["r", "70", "cx", "80", "cy", "80", "stroke", "currentColor", "stroke-width", "18", "stroke-dashoffset", "380", "fill", "transparent", "stroke-dasharray", "440"], [1, "absolute", "top-1/2", "left-1/2", "flex", "flex-col", "gap-0.5", "-translate-x-1/2", "-translate-y-1/2", "text-center", "text-white"], [1, "text-xs"], [1, "text-3xl", "font-semibold"], [1, "text-xs", "mb-5"], [1, "w-[50%]"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-3", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "absolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "absolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "cursor-pointer", "transition-all", 3, "click", "detail", "size"], ["itemSize", "32", 1, "example-viewport", "foldervitual", "h-full", 3, "scroll"], [1, "w-full", "text-sm", "text-left", "rtl:text-right", "text-gray-500"], [1, "text-xs", "bg-[#E64100]", "text-white", "uppercase"], ["scope", "col", 1, "px-3", "py-2", "text-xs", "font-normal"], ["class", "text-white", 4, "cdkVirtualFor", "cdkVirtualForOf", "cdkVirtualForTrack"], [1, "text-white"], ["scope", "row", 1, "px-3", "py-2", "whitespace-nowrap", "text-xs"], [1, "px-3", "py-2", "text-xs"], [1, "flex", "items-center", "justify-center", "h-full", "bg-white/10", "rounded-base", "p-5", "border", "border-white/50", "border-dashed"], [1, "text-white", "text-xl"], ["attributeName", "transform", "type", "rotate", "from", "0 80 80", "to", "360 80 80", "dur", "1s", "repeatCount", "indefinite"], ["r", "70", "cx", "80", "cy", "80", "stroke", "currentColor", "stroke-width", "18", "fill", "transparent", "stroke-dasharray", "440"], [1, "flex", "gap-2.5", "items-center", "mb-2.5", "text-xxs", "font-semibold"], [1, "py-1", "px-2", "border", "border-white", "h-5", "flex", "cursor-pointer", "items-center", "bg-white/10", "rounded-full", "text-white"], [1, "grid", "grid-cols-7", "gap-2.5", "mb-6"], [1, "p-5", "w-full", "back4", "col-span-3", "rounded-base", "text-white", "relative"], [1, "p-5", "w-full", "back4", "col-span-4", "rounded-base", "text-white", "relative"], [1, "font-semibold"], [1, "w-full", "!border-white/50", "my-2"], [1, "flex", "items-baseline", "whitespace-nowrap", "gap-2.5"], [1, "w-1/3", "text-3xl", "font-semibold"], [1, "w-1/3", "underline", "text-xs", "text-end", 3, "click"], [1, "text-3xl", "font-semibold", "mb-2.5"], [1, "flex", "items-center", "gap-2"], ["width", "14", "height", "14", "viewBox", "0 0 14 14", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M9.95995 2.61914H3.23999C2.00288 2.61914 1 3.62202 1 4.85913V10.4591C1 11.6962 2.00288 12.6991 3.23999 12.6991H9.95995C11.1971 12.6991 12.1999 11.6962 12.1999 10.4591V4.85913C12.1999 3.62202 11.1971 2.61914 9.95995 2.61914Z", "stroke", "#4F4F4F", "stroke-width", "1.67999", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M4.35938 1.5V3.73999", "stroke", "#4F4F4F", "stroke-width", "1.67999", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M8.84082 1.5V3.73999", "stroke", "#4F4F4F", "stroke-width", "1.67999", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M1 5.98047H12.1999", "stroke", "#4F4F4F", "stroke-width", "1.67999", "stroke-linecap", "round", "stroke-linejoin", "round"], [1, "grid", "grid-cols-12", "gap-2.5"], [1, "p-5", "w-full", "back5", "col-span-12", "rounded-base", "text-white", "relative"], [1, "flex", "items-center", "gap-2.5", "mb-2.5"], [1, "text-xs", "font-semibold"], [1, "flex", "gap-2.5", "overflow-x-auto", "py-2.5"], [1, "py-1.5", "px-1.5", "border", "border-white", "h-5", "flex", "cursor-pointer", "items-center", "gap-1", "bg-white", "rounded-full", "text-grey", "text-xxs", "font-bold"], [1, "pt-4"], [1, "w-1/2", "text-3xl", "font-semibold"], ["name", "file", 1, "mx-2"], ["name", "folder", 1, "mx-2"], [1, "grid", "grid-cols-7", "col-span-12", "gap-2.5"], [1, "w-full", "flex", "gap-2.5", "col-span-3", "rounded-base", "text-white", "relative"], [1, "back5", "p-5", "w-1/2", "rounded-base", "min-h-[175px]"], [1, "text-3xl", "font-semibold", "mt-0.5"], [1, "back5", "p-5", "w-1/2", "rounded-base"], [1, "p-5", "flex", "w-full", "back5", "col-span-4", "rounded-base", "text-white", "relative"], [1, "w-1/2"], [1, "w-1/2", "flex", "self-baseline", "pt-9"], ["mode", "gradient", "addcls", "rounded-full", 1, "ms-auto", "w-fit", "font-normal", 3, "click"], ["mode", "darkwhite", "addcls", "rounded-full", 1, "ms-2.5", "w-fit", 3, "isloading"], [1, "rounded-full", "px-1", "bg-gray-400", "text-white"], ["mode", "darkwhite", "addcls", "rounded-full", 1, "ms-2.5", "w-fit", 3, "click", "isloading"]], template: function CaseActivityComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 2)(1, "h6", 3);
        \u0275\u0275listener("click", function CaseActivityComponent_Template_h6_click_1_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.goBack());
        });
        \u0275\u0275element(2, "icon", 4);
        \u0275\u0275text(3, " Case Activity Log ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "div", 5)(5, "div", 6)(6, "mat-form-field", 7)(7, "mat-select", 8);
        \u0275\u0275twoWayListener("ngModelChange", function CaseActivityComponent_Template_mat_select_ngModelChange_7_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.nCaseid, $event) || (ctx.nCaseid = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function CaseActivityComponent_Template_mat_select_selectionChange_7_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.changeCase());
        });
        \u0275\u0275repeaterCreate(8, CaseActivityComponent_For_9_Template, 2, 2, "mat-option", 9, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "mat-form-field", 10)(11, "mat-select", 11, 0);
        \u0275\u0275twoWayListener("ngModelChange", function CaseActivityComponent_Template_mat_select_ngModelChange_11_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selectedview, $event) || (ctx.selectedview = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275elementStart(13, "mat-select-trigger", 12);
        \u0275\u0275template(14, CaseActivityComponent_Conditional_14_Template, 2, 0, "span")(15, CaseActivityComponent_Conditional_15_Template, 2, 0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "mat-option", 13);
        \u0275\u0275listener("click", function CaseActivityComponent_Template_mat_option_click_16_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.selectAll());
        });
        \u0275\u0275elementStart(17, "div", 14)(18, "span");
        \u0275\u0275text(19, "Display all services ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(20, CaseActivityComponent_Conditional_20_Template, 1, 0, "icon", 15);
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(21, CaseActivityComponent_For_22_Template, 6, 2, "mat-option", 16, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(23, "div", 17)(24, "div", 18)(25, "div", 19)(26, "h6", 20);
        \u0275\u0275text(27, "Subscription");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(28, "div", 21)(29, "h6", 22)(30, "span", 23);
        \u0275\u0275text(31);
        \u0275\u0275pipe(32, "date");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(33, "span", 24);
        \u0275\u0275text(34, "Active");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(35, "h6", 25);
        \u0275\u0275text(36);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(37, "div", 26)(38, "h6", 27);
        \u0275\u0275text(39, "Manual Hyperlinking");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(40, "h6", 25);
        \u0275\u0275text(41);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(42, "div", 28)(43, "h6", 29);
        \u0275\u0275text(44, "Users");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(45, "div")(46, "div", 30)(47, "h6", 31);
        \u0275\u0275text(48);
        \u0275\u0275elementEnd();
        \u0275\u0275element(49, "div", 32);
        \u0275\u0275elementStart(50, "ng-scrollbar", 33)(51, "div", 34);
        \u0275\u0275repeaterCreate(52, CaseActivityComponent_For_53_Template, 1, 4, "avtr", 35, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(54, "div", 36)(55, "h6", 37);
        \u0275\u0275text(56);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(57, "mat-form-field", 38)(58, "mat-select", 39);
        \u0275\u0275twoWayListener("ngModelChange", function CaseActivityComponent_Template_mat_select_ngModelChange_58_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.cLogtype, $event) || (ctx.cLogtype = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function CaseActivityComponent_Template_mat_select_selectionChange_58_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.getUserLog());
        });
        \u0275\u0275elementStart(59, "mat-option", 9);
        \u0275\u0275text(60, " Login Detail ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(61, "mat-option", 9);
        \u0275\u0275text(62, " File Activities ");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(63, "mat-form-field", 40)(64, "mat-select", 39);
        \u0275\u0275twoWayListener("ngModelChange", function CaseActivityComponent_Template_mat_select_ngModelChange_64_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.datetype, $event) || (ctx.datetype = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function CaseActivityComponent_Template_mat_select_selectionChange_64_listener() {
          \u0275\u0275restoreView(_r1);
          ctx.changeDateType();
          return \u0275\u0275resetView(ctx.getUserLog());
        });
        \u0275\u0275repeaterCreate(65, CaseActivityComponent_For_66_Template, 2, 2, "mat-option", 9, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(67, "div", 41);
        \u0275\u0275template(68, CaseActivityComponent_Conditional_68_Template, 13, 2, "cdk-virtual-scroll-viewport", 42)(69, CaseActivityComponent_Conditional_69_Template, 3, 0);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(70, "div", 43)(71, "h6", 44);
        \u0275\u0275text(72, "Hosting Data");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(73, "div", 45)(74, "h5", 46);
        \u0275\u0275text(75);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(76, "div", 47);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(77, "svg", 48);
        \u0275\u0275element(78, "circle", 49);
        \u0275\u0275template(79, CaseActivityComponent_Conditional_79_Template, 2, 0, ":svg:circle", 50)(80, CaseActivityComponent_Conditional_80_Template, 1, 1);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(81, "div", 51)(82, "h6", 52);
        \u0275\u0275text(83, "Hosting Data ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(84, "h6", 53);
        \u0275\u0275text(85);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(86, "h6", 52);
        \u0275\u0275text(87);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(88, "h6", 54);
        \u0275\u0275text(89);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(90, "div", 55);
        \u0275\u0275template(91, CaseActivityComponent_Conditional_91_Template, 25, 6)(92, CaseActivityComponent_Conditional_92_Template, 49, 9);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(7);
        \u0275\u0275twoWayProperty("ngModel", ctx.nCaseid);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.caselist);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.selectedview);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(14, ctx.selectedview.length == 2 ? 14 : 15);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", "Display all services");
        \u0275\u0275advance(4);
        \u0275\u0275conditional(20, ctx.selectedview.length == 2 ? 20 : -1);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.categories);
        \u0275\u0275advance(10);
        \u0275\u0275textInterpolate1("Started on (", \u0275\u0275pipeBind2(32, 28, ctx.scanData == null ? null : ctx.scanData.dCaseCreateDt, "dd-MMM-yyyy"), ")");
        \u0275\u0275advance(5);
        \u0275\u0275textInterpolate(ctx.scanData == null ? null : ctx.scanData.dDays);
        \u0275\u0275advance(5);
        \u0275\u0275textInterpolate((ctx.scanData == null ? null : ctx.scanData.nHyperlinks) ? ctx.scanData == null ? null : ctx.scanData.nHyperlinks : 0);
        \u0275\u0275advance(7);
        \u0275\u0275textInterpolate(ctx.userList.length);
        \u0275\u0275advance(2);
        \u0275\u0275property("visibility", "hover")("appearance", "compact");
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.userList);
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate2("", ctx.selecteduser.cFname, " ", ctx.selecteduser.cLname, "");
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.cLogtype);
        \u0275\u0275advance();
        \u0275\u0275property("value", "L");
        \u0275\u0275advance(2);
        \u0275\u0275property("value", "A");
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.datetype);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.dateCategory);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(68, ctx.userLoglist.length ? 68 : 69);
        \u0275\u0275advance(7);
        \u0275\u0275textInterpolate1("", ctx.usedpercentage, "%");
        \u0275\u0275advance(4);
        \u0275\u0275conditional(79, ctx.loadingstorage ? 79 : 80);
        \u0275\u0275advance(6);
        \u0275\u0275textInterpolate(ctx.fileSize == null ? null : ctx.fileSize.value);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(ctx.fileSize == null ? null : ctx.fileSize.sizes);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate4("", ctx.fileSize == null ? null : ctx.fileSize.value, "", ctx.fileSize == null ? null : ctx.fileSize.sizes, " of ", ctx.storagesize == null ? null : ctx.storagesize.value, "", ctx.storagesize == null ? null : ctx.storagesize.sizes, " used");
        \u0275\u0275advance(2);
        \u0275\u0275conditional(91, ctx.selectedview.includes("RT/Presentation Connection") ? 91 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(92, ctx.selectedview.includes("eBundle Workspace Setup") ? 92 : -1);
      }
    }, dependencies: [
      CommonModule,
      DatePipe,
      IconComponent,
      MatSelectModule,
      MatFormField,
      MatSelect,
      MatSelectTrigger,
      MatOption,
      FormsModule,
      NgControlStatus,
      NgModel,
      AvatarComponent,
      ButtonComponent,
      ScrollingModule,
      CdkFixedSizeVirtualScroll,
      CdkVirtualForOf,
      CdkVirtualScrollViewport,
      NgScrollbarModule,
      NgScrollbar
    ], styles: ["\n\n.back1[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      149deg,\n      #0058ff,\n      #5ca8ff);\n}\n.back2[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      131deg,\n      #05853a,\n      #1e808d);\n}\n.back3[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      150deg,\n      #ff3d00,\n      #ff7a00);\n}\n.back4[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      146deg,\n      #670099,\n      #b74eff);\n}\n.back5[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      176deg,\n      #003D99,\n      #496B93);\n}\n.cdk-drag-preview[_ngcontent-%COMP%] {\n  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);\n  background-color: white;\n  z-index: 1000;\n  width: 100%;\n  border-radius: 10px;\n  box-sizing: border-box;\n  height: 48px;\n  min-height: 48px;\n  overflow: hidden;\n}\n.cdk-drag-placeholder[_ngcontent-%COMP%] {\n  opacity: 0.5;\n  width: 100%;\n  box-sizing: border-box;\n  min-height: 32px;\n}\n/*# sourceMappingURL=case-activity.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CaseActivityComponent, { className: "CaseActivityComponent", filePath: "src\\app\\adminpanel\\components\\activity-log\\case-activity\\case-activity.component.ts", lineNumber: 27 });
})();
export {
  CaseActivityComponent
};
//# sourceMappingURL=chunk-4OZYXOOD.js.map
