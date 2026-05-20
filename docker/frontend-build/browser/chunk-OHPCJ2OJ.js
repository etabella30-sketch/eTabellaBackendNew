import {
  PresentsetupService
} from "./chunk-WYIU2ETL.js";
import "./chunk-3B3MCZKM.js";
import {
  HeaderComponent
} from "./chunk-JFSROE7U.js";
import "./chunk-GRRJDIU4.js";
import "./chunk-JQOS4SOR.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import "./chunk-PMFTFHHF.js";
import "./chunk-ILBZODYX.js";
import "./chunk-GHP524MW.js";
import "./chunk-KCDHWQ5X.js";
import "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import "./chunk-CIO7JDBK.js";
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
  LocationStrategy
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
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
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/choose-docs/choose-docs.component.ts
var ChooseDocsComponent_Conditional_9_Defer_2_DepsFn = () => [import("./chunk-E6UWYXOF.js").then((m) => m.FileexplorerComponent)];
function ChooseDocsComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 6);
    \u0275\u0275listener("click", function ChooseDocsComponent_Conditional_2_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.gotoFile());
    });
    \u0275\u0275elementEnd();
  }
}
function ChooseDocsComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 7);
  }
}
function ChooseDocsComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5)(1, "btn", 8);
    \u0275\u0275element(2, "icon", 9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 10);
    \u0275\u0275text(4, "You must check off the previewing files to show in presentation");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "btn", 11);
    \u0275\u0275listener("click", function ChooseDocsComponent_Conditional_6_Template_btn_click_5_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.bIsfilePresent = false);
    });
    \u0275\u0275text(6, "Check them off and present");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "btn", 12);
    \u0275\u0275listener("click", function ChooseDocsComponent_Conditional_6_Template_btn_click_7_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.goToPresent());
    });
    \u0275\u0275text(8, " Do it myself ");
    \u0275\u0275elementEnd()();
  }
}
function ChooseDocsComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 13);
    \u0275\u0275listener("click", function ChooseDocsComponent_Conditional_7_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.submit());
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", (ctx_r1.presentSession == null ? null : ctx_r1.presentSession.cSType) == "C" ? "Review Core Files" : (ctx_r1.presentSession == null ? null : ctx_r1.presentSession.cSType) == "W" ? "Next: File Schedule" : "Go to presentation", " ");
  }
}
function ChooseDocsComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-header");
  }
}
function ChooseDocsComponent_Conditional_9_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "fileexplorer", 14, 0);
    \u0275\u0275listener("OnFileEvent", function ChooseDocsComponent_Conditional_9_Defer_0_Template_fileexplorer_OnFileEvent_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.FileEvent($event));
    })("handleSelection", function ChooseDocsComponent_Conditional_9_Defer_0_Template_fileexplorer_handleSelection_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.handleSelection($event));
    })("presentHistory", function ChooseDocsComponent_Conditional_9_Defer_0_Template_fileexplorer_presentHistory_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.handlePresentHistory($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("nCaseid", ctx_r1.nCaseid)("isadmin", false)("selectedRequired", true)("presentDocType", ctx_r1.presentDocType)("coreFiles", ctx_r1.coreFiles)("selectedBundles", ctx_r1.selectedBundles)("selectedBundleDetails", ctx_r1.selectedBundleDetails)("bShowPresentHistory", ctx_r1.bShowPresentHistory);
  }
}
function ChooseDocsComponent_Conditional_9_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275text(1, "loading");
    \u0275\u0275elementEnd();
  }
}
function ChooseDocsComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ChooseDocsComponent_Conditional_9_Defer_0_Template, 2, 8)(1, ChooseDocsComponent_Conditional_9_DeferPlaceholder_1_Template, 2, 0);
    \u0275\u0275defer(2, 0, ChooseDocsComponent_Conditional_9_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(!ctx_r1.isLoading);
  }
}
var ChooseDocsComponent = class _ChooseDocsComponent {
  constructor(route, hs, PSservice, cdr, cm, router, tost, location2, userPermissions) {
    this.route = route;
    this.hs = hs;
    this.PSservice = PSservice;
    this.cdr = cdr;
    this.cm = cm;
    this.router = router;
    this.tost = tost;
    this.location = location2;
    this.userPermissions = userPermissions;
    this.isLoading = true;
    this.presentSession = null;
    this.choosedDocs = [];
    this.coreFiles = [];
    this.selectedFiles = {};
    this.selectedBundles = [];
    this.selectedBundleDetails = [];
    this.bIsfilePresent = false;
    this.bShowPresentHistory = false;
    var params = this.route.snapshot.params;
    if (Object.keys(params).length > 0) {
      params = JSON.parse(decodeURIComponent(params["id"]));
      this.nCaseid = params && params["id"] ? params["id"] : null;
      hs.nCaseid = this.nCaseid;
      this.nContactid = params && params["cid"] ? params["cid"] : null;
      this.nPresentid = params["nPid"] || null;
      this.nPCid = params["nPCid"] || null;
    }
    hs.currentadminpath.next("my files");
    if (this.nCaseid) {
      hs.nCaseid = this.nCaseid;
    }
    history.pushState(null, null, window.location.href);
    this.location.onPopState(() => {
      history.pushState(null, null, window.location.href);
    });
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngOnChanges(changes) {
    if (changes["coreFiles"]) {
      this.cdr.detectChanges();
    }
  }
  ngOnInit() {
    return __async(this, null, function* () {
      if (this.nCaseid) {
        this.presentSession = yield this.PSservice.getRvalue(this.nCaseid);
        this.presentDocType = this.presentSession?.cSType == "W" ? "CF" : this.presentSession?.cSType == "C" ? "C" : "F";
      }
      this.isLoading = false;
      if (this.nPresentid) {
        this.getDetail();
      }
      this.cdr.detectChanges();
    });
  }
  getDetail() {
    return __async(this, null, function* () {
      try {
        const res = yield this.PSservice.detail(this.nPresentid);
        this.coreFiles = res.filter((a) => a.cType == "C").map((a) => a.nBundledetailid) || [];
        const scheduleFile = res.filter((a) => a.cType != "C");
        this.selectedBundles = scheduleFile.filter((a) => a.nBundleid).map((a) => a.nBundleid);
        this.selectedBundleDetails = scheduleFile.filter((a) => a.nBundledetailid).map((a) => a.nBundledetailid);
        this.selectedFiles = {
          fileids: this.selectedBundleDetails.map((a) => {
            return { id: a, bid: 0 };
          }),
          fldrids: this.selectedBundles.map((a) => {
            return { id: a, bid: 0 };
          })
        };
        this.cdr.detectChanges();
      } catch (error) {
      }
    });
  }
  FileEvent(e) {
    if (e.event == "GO-TO-PRESENT") {
      this.selectedFiles = e.data;
      this.selectedBundleDetails = e.data?.fileids.map((a) => a.id);
      this.submit();
    }
  }
  handleSelection(e) {
    this.selectedFiles = e;
    this.selectedBundleDetails = e?.fileids.map((a) => a.id);
    if (this.bIsfilePresent) {
      this.bIsfilePresent = false;
    }
    this.cdr.detectChanges();
  }
  getSelectedFiles() {
    const cores = this.coreFiles.map((a) => {
      return { nBundledetailid: a, type: "C" };
    });
    let folders = [], files = [];
    if (this.selectedFiles?.fileids?.length) {
      files = this.selectedFiles.fileids.map((a) => {
        return { nBundledetailid: a.id, type: "F" };
      });
    }
    if (this.selectedFiles?.fldrids?.length) {
      folders = this.selectedFiles.fldrids.map((a) => {
        return { nBundleid: a.id, type: "F" };
      });
    }
    return [...cores, ...files, ...folders];
  }
  submit() {
    return __async(this, null, function* () {
      const jFiles = this.getSelectedFiles();
      if (!jFiles?.length) {
        if (this.presentSession?.cSType == "F") {
          this.bIsfilePresent = true;
          return;
        }
        this.tost.openSnackBar("Please select at least one file", "E");
        return;
      }
      yield this.insertPresent(jFiles);
    });
  }
  handleRedirect(nPresentid, nIndexid, jFiles) {
    try {
      if (this.presentSession?.cSType == "F" || this.presentSession?.cType == "P") {
        jFiles.sort((a, b) => a[0] === nIndexid ? -1 : b[0] === nIndexid ? 1 : 0);
        this.router.navigateByUrl(`/individual/doc/${encodeURIComponent(JSON.stringify([jFiles, this.nCaseid, nPresentid, nIndexid]))}`);
      } else if (this.presentSession?.cSType == "C" || this.presentSession?.cSType == "W") {
        this.cm.gotoUrl("/present/core-case", {
          id: this.nCaseid,
          nPid: nPresentid
        });
      }
    } catch (error) {
    }
  }
  openIndexFile(nPresentid, nIndexid) {
    if (!nIndexid)
      return;
    this.cm.openedWindow = window.open(`${location.origin}/individual/doc/${encodeURIComponent(JSON.stringify([[[]], this.nCaseid, nPresentid, 0]))}`, "_blank");
  }
  goToPresent() {
    return __async(this, null, function* () {
      yield this.insertPresent([]);
    });
  }
  insertPresent(jFiles) {
    return __async(this, null, function* () {
      const dataObj = {
        nCaseid: this.presentSession?.nCaseid,
        cStatus: ["W", "C"].includes(this.presentSession?.cSType) ? "B" : "I",
        cName: this.presentSession?.cName,
        nContactid: this.nContactid,
        nTypeid: this.presentSession?.nTypeid,
        nSTypeid: this.presentSession?.nSTypeid,
        jUsers: this.presentSession?.jUsers,
        jFiles,
        nPresentid: this.nPresentid,
        nPCid: this.nPCid
      };
      const res = yield this.PSservice.insert(dataObj);
      if (res.msg == 1) {
        this.tost.openSnackBar("Document have been added successfully.");
        let files = jFiles.map((e) => [e.nBundledetailid]);
        this.handleRedirect(res.nPresentid, res.nBundledetailid, files);
      }
    });
  }
  handlePresentHistory(event) {
    if (event?.event == "PRESENT") {
      this.submit();
    }
    this.bShowPresentHistory = event;
    this.bIsfilePresent = false;
    this.cdr.detectChanges();
  }
  gotoFile() {
    this.handlePresentHistory(false);
  }
  static {
    this.\u0275fac = function ChooseDocsComponent_Factory(t) {
      return new (t || _ChooseDocsComponent)(\u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(LocationStrategy), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ChooseDocsComponent, selectors: [["app-choose-docs"]], standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 10, vars: 5, consts: [["fileExplorer", ""], [1, "h-full", "bg-[#f6f6f6]", "flex", "flex-col", "overflow-hidden"], [1, "text-lg", "bg-white", "text-dark-blue", "whitespace-nowrap", "min-h-20", "flex", "items-center", "gap-6", "px-10"], ["name", "chvy", 1, "flex"], [1, "font-bold"], [1, "flex", "items-center", "gap-2.5", "justify-end", "bg-black", "text-white", "py-2.5", "pe-2.5", "ms-auto", "text-xs"], ["name", "chvy", 1, "flex", 3, "click"], ["src", "assets/present/public.png", 1, "w-15"], ["mode", "plain"], ["name", "info", 1, "text-lg"], [1, "-ms-2.5"], [3, "click"], ["mode", "white", 3, "click"], [1, "ms-auto", 3, "click"], [1, "w-full", "h-full", "overflow-hidden", 3, "OnFileEvent", "handleSelection", "presentHistory", "nCaseid", "isadmin", "selectedRequired", "presentDocType", "coreFiles", "selectedBundles", "selectedBundleDetails", "bShowPresentHistory"]], template: function ChooseDocsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2);
        \u0275\u0275template(2, ChooseDocsComponent_Conditional_2_Template, 1, 0, "icon", 3)(3, ChooseDocsComponent_Conditional_3_Template, 1, 0);
        \u0275\u0275elementStart(4, "h6", 4);
        \u0275\u0275text(5);
        \u0275\u0275elementEnd();
        \u0275\u0275template(6, ChooseDocsComponent_Conditional_6_Template, 9, 0, "div", 5)(7, ChooseDocsComponent_Conditional_7_Template, 2, 1);
        \u0275\u0275elementEnd();
        \u0275\u0275template(8, ChooseDocsComponent_Conditional_8_Template, 1, 0, "app-header")(9, ChooseDocsComponent_Conditional_9_Template, 4, 1);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275conditional(2, ctx.bShowPresentHistory ? 2 : 3);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1(" ", ctx.bShowPresentHistory ? "Recently Presented Files" : "Step 2: Choose File", " ");
        \u0275\u0275advance();
        \u0275\u0275conditional(6, ctx.bIsfilePresent ? 6 : 7);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(8, !ctx.bShowPresentHistory ? 8 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(9, !ctx.isLoading ? 9 : -1);
      }
    }, dependencies: [
      ButtonComponent,
      HeaderComponent,
      IconComponent
    ], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ChooseDocsComponent, { className: "ChooseDocsComponent", filePath: "src\\app\\presentation\\components\\choose-docs\\choose-docs.component.ts", lineNumber: 37 });
})();
export {
  ChooseDocsComponent
};
//# sourceMappingURL=chunk-OHPCJ2OJ.js.map
