import "./chunk-XSVYOAGA.js";
import {
  UploadManagementService
} from "./chunk-AGZ7TUOA.js";
import "./chunk-MQ6OVKEO.js";
import "./chunk-ZP7PHFH3.js";
import "./chunk-3B3MCZKM.js";
import {
  TranscriptViewerComponent
} from "./chunk-W2LTZB4Y.js";
import "./chunk-UI3KRWEQ.js";
import "./chunk-GLL6MQHU.js";
import {
  TranscriptPreviewComponent,
  TranscriptPropertiesComponent
} from "./chunk-R755NOM2.js";
import "./chunk-FW6JNL2T.js";
import {
  NgxExtendedPdfViewerComponent,
  NgxExtendedPdfViewerModule
} from "./chunk-QI7CLXWT.js";
import "./chunk-JASM6CRZ.js";
import "./chunk-YLWJRUOP.js";
import "./chunk-X3RSWYEV.js";
import {
  TranscriptService
} from "./chunk-2VIGWAD6.js";
import "./chunk-XTSEIZ7V.js";
import "./chunk-DHVW7RW5.js";
import "./chunk-WZNPCXMG.js";
import "./chunk-DVMGXG6V.js";
import {
  CdkDrag,
  DragDropModule
} from "./chunk-EZOJOG5D.js";
import "./chunk-62ZTKIF6.js";
import "./chunk-SD32Y426.js";
import "./chunk-55ITPE7H.js";
import "./chunk-43QUFIPG.js";
import "./chunk-ILBZODYX.js";
import "./chunk-GHP524MW.js";
import "./chunk-KCDHWQ5X.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import "./chunk-2HPWN6DG.js";
import "./chunk-DWVFAK3Q.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  DialogueComponent
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
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
import "./chunk-UA722RUW.js";
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
  Router
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  DatePipe
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/transscript/publish/publish.component.ts
var _c0 = ["menuTrigger"];
var _forTrack0 = ($index, $item) => $item.nCaseid;
var _forTrack1 = ($index, $item) => $item.nSesid;
function PublishComponent_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const theme_r2 = ctx.$implicit;
    \u0275\u0275property("value", theme_r2.nCaseid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", theme_r2.cCasename, " ");
  }
}
function PublishComponent_For_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const theme_r3 = ctx.$implicit;
    \u0275\u0275property("value", theme_r3.nSesid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", theme_r3.cName, " ");
  }
}
var PublishComponent = class _PublishComponent {
  constructor(dialogRef, transcriptS, data) {
    this.dialogRef = dialogRef;
    this.transcriptS = transcriptS;
    this.data = data;
    this.isIgnoreErr = false;
    this.isLoading = false;
    this.errorCount = 10;
    this.cases = [
      { name: "case 1" },
      { name: "case 2" },
      { name: "case 3" }
    ];
    this.sessions = [
      { name: "Session 1" },
      { name: "session 2" },
      { name: "session 3" }
    ];
    this.cTransid = data.cTransid;
    this.nCaseid = null;
    this.nSesid = null;
    this.cPath = data.cPath;
  }
  ngOnInit() {
    this.getCaseCombo();
  }
  getCaseCombo() {
    return __async(this, null, function* () {
      this.cases = yield this.transcriptS.getCaseCombo();
    });
  }
  getSessionCombo() {
    return __async(this, null, function* () {
      debugger;
      this.nSesid = null;
      if (this.nCaseid) {
        this.sessions = yield this.transcriptS.getSessionCombo(this.nCaseid);
      } else {
        this.sessions = [];
      }
    });
  }
  close() {
    this.dialogRef.close();
  }
  publish(isIgnoreErr) {
    return __async(this, null, function* () {
      this.isLoading = true;
      const publishRequest = {
        cTransid: this.cTransid,
        nCaseid: this.nCaseid,
        nSesid: this.nSesid,
        cPath: this.cPath,
        isIgnoreErr,
        errorCount: this.errorCount
        // This is a placeholder, replace with actual error count logic if needed
      };
      const res = yield this.transcriptS.publishTranscript(publishRequest);
      this.isLoading = false;
      if (res && res.msg == 1) {
        this.dialogRef.close(res);
      }
      if (res && res.msg == -1 && res.isIgnoreErr) {
        this.menuTrigger.openMenu();
        this.isIgnoreErr = res.isIgnoreErr ? true : false;
      }
    });
  }
  static {
    this.\u0275fac = function PublishComponent_Factory(t) {
      return new (t || _PublishComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(TranscriptService), \u0275\u0275directiveInject(MAT_DIALOG_DATA, 8));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PublishComponent, selectors: [["app-publish"]], viewQuery: function PublishComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.menuTrigger = _t.first);
      }
    }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 34, vars: 5, consts: [["PublishConfirmMenu", "matMenu"], ["menuTrigger", "matMenuTrigger"], [1, "p-10", "bg-[#F4F6F9]"], [1, "text-lg", "font-semibold", "mb-2"], [1, "mb-5"], [1, "flex-1", "mb-2.5"], [1, "font-semibold", "text-xs", "text-grey", "mb-2"], ["placeholder", "Select case name", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base", 3, "ngModelChange", "selectionChange", "ngModel"], [3, "value"], [1, "flex-1"], ["placeholder", "Select session", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base", 3, "ngModelChange", "ngModel"], [1, "flex", "gap-2"], [3, "click", "disabled", "isloading"], ["mode", "white", 3, "click"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [3, "click"], ["mode", "dark"], [2, "display", "none", 3, "matMenuTriggerFor"]], template: function PublishComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 2)(1, "h6", 3);
        \u0275\u0275text(2, "Publish Transcript");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(3, "div", 4)(4, "div", 5)(5, "h6", 6);
        \u0275\u0275text(6, "Case Name");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "mat-select", 7);
        \u0275\u0275twoWayListener("ngModelChange", function PublishComponent_Template_mat_select_ngModelChange_7_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.nCaseid, $event) || (ctx.nCaseid = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function PublishComponent_Template_mat_select_selectionChange_7_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.getSessionCombo());
        });
        \u0275\u0275repeaterCreate(8, PublishComponent_For_9_Template, 2, 2, "mat-option", 8, _forTrack0);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "div", 9)(11, "h6", 6);
        \u0275\u0275text(12, "Session");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "mat-select", 10);
        \u0275\u0275twoWayListener("ngModelChange", function PublishComponent_Template_mat_select_ngModelChange_13_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.nSesid, $event) || (ctx.nSesid = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275repeaterCreate(14, PublishComponent_For_15_Template, 2, 2, "mat-option", 8, _forTrack1);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(16, "div", 11)(17, "btn", 12);
        \u0275\u0275listener("click", function PublishComponent_Template_btn_click_17_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.publish());
        });
        \u0275\u0275text(18, "Publish");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(19, "btn", 13);
        \u0275\u0275listener("click", function PublishComponent_Template_btn_click_19_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.close());
        });
        \u0275\u0275text(20, "Cancel");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(21, "mat-menu", 14, 0)(23, "div");
        \u0275\u0275element(24, "h4", 15);
        \u0275\u0275elementStart(25, "h6", 15);
        \u0275\u0275text(26, "Are you sure you want to publish despite these issues?");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(27, "div", 11)(28, "btn", 16);
        \u0275\u0275listener("click", function PublishComponent_Template_btn_click_28_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.publish(true));
        });
        \u0275\u0275text(29, " Yes, Publish Anyway");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(30, "btn", 17);
        \u0275\u0275text(31, "Cancel");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275element(32, "button", 18, 1);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        const PublishConfirmMenu_r4 = \u0275\u0275reference(22);
        \u0275\u0275advance(7);
        \u0275\u0275twoWayProperty("ngModel", ctx.nCaseid);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.cases);
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.nSesid);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.sessions);
        \u0275\u0275advance(3);
        \u0275\u0275property("disabled", !ctx.cTransid || !ctx.nCaseid || !ctx.nSesid)("isloading", ctx.isLoading);
        \u0275\u0275advance(15);
        \u0275\u0275property("matMenuTriggerFor", PublishConfirmMenu_r4);
      }
    }, dependencies: [ButtonComponent, MatSelectModule, MatSelect, MatOption, FormsModule, NgControlStatus, NgModel, MatMenuModule, MatMenu, MatMenuTrigger] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PublishComponent, { className: "PublishComponent", filePath: "src\\app\\adminpanel\\components\\transscript\\publish\\publish.component.ts", lineNumber: 15 });
})();

// src/app/adminpanel/components/transscript/printpreview/printpreview.component.ts
function PrintpreviewComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1)(1, "h6");
    \u0275\u0275text(2, "Print preview");
    \u0275\u0275elementEnd()();
  }
}
var PrintpreviewComponent = class _PrintpreviewComponent {
  constructor() {
    this.pdfSrc = "https://etabella.sgp1.cdn.digitaloceanspaces.com/doc/case1131/file_583043242028.PDF";
    this.mainpreview = false;
  }
  static {
    this.\u0275fac = function PrintpreviewComponent_Factory(t) {
      return new (t || _PrintpreviewComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PrintpreviewComponent, selectors: [["printpreview"]], inputs: { mainpreview: "mainpreview" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 4, vars: 7, consts: [["pdfViewer", ""], [1, "h-8", "flex", "items-center", "px-5"], [1, "flex", "flex-col", "gap-2", "h-full"], [1, "block", "h-full", 3, "src", "showToolbar", "activeSidebarView", "showBorders"]], template: function PrintpreviewComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, PrintpreviewComponent_Conditional_0_Template, 3, 0, "div", 1);
        \u0275\u0275elementStart(1, "div", 2);
        \u0275\u0275element(2, "ngx-extended-pdf-viewer", 3, 0);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, !ctx.mainpreview ? 0 : -1);
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.mainpreview ? "" : "p-5 bg-[#8A8A8A]");
        \u0275\u0275advance();
        \u0275\u0275property("src", ctx.pdfSrc)("showToolbar", false)("activeSidebarView", 1)("showBorders", false);
      }
    }, dependencies: [NgxExtendedPdfViewerModule, NgxExtendedPdfViewerComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PrintpreviewComponent, { className: "PrintpreviewComponent", filePath: "src\\app\\adminpanel\\components\\transscript\\printpreview\\printpreview.component.ts", lineNumber: 11 });
})();

// src/app/adminpanel/components/transscript/transcript-table/transcript-table.component.ts
var _c02 = ["deleteMenuTrigger"];
var _c1 = ["menuTrigger"];
var _c2 = (a0) => [a0];
function TranscriptTableComponent_tr_17_For_22_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 24);
  }
}
function TranscriptTableComponent_tr_17_For_22_Conditional_14_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 30)(1, "span", 31);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 31);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "date");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const transcript_r2 = \u0275\u0275nextContext(3).$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Reporter - ", transcript_r2 == null ? null : transcript_r2.cReporter, "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Transcribed on: ", \u0275\u0275pipeBind2(5, 2, transcript_r2 == null ? null : transcript_r2.dTranscribedDate, "dd-MM-YYYY"), "");
  }
}
function TranscriptTableComponent_tr_17_For_22_Conditional_14_Conditional_1_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 34);
    \u0275\u0275listener("click", function TranscriptTableComponent_tr_17_For_22_Conditional_14_Conditional_1_For_2_Template_div_click_0_listener() {
      const x_r8 = \u0275\u0275restoreView(_r7).$implicit;
      const transcript_r2 = \u0275\u0275nextContext(4).$implicit;
      const menu_r9 = \u0275\u0275reference(19);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.clickfunction(x_r8, menu_r9, transcript_r2));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r8 == null ? null : x_r8.name, " ");
  }
}
function TranscriptTableComponent_tr_17_For_22_Conditional_14_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 32);
    \u0275\u0275repeaterCreate(1, TranscriptTableComponent_tr_17_For_22_Conditional_14_Conditional_1_For_2_Template, 2, 1, "div", 33, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const y_r5 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275repeater(y_r5 == null ? null : y_r5.expandmenu);
  }
}
function TranscriptTableComponent_tr_17_For_22_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TranscriptTableComponent_tr_17_For_22_Conditional_14_Conditional_0_Template, 6, 5, "div", 30)(1, TranscriptTableComponent_tr_17_For_22_Conditional_14_Conditional_1_Template, 3, 0);
  }
  if (rf & 2) {
    const y_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275conditional(0, y_r5.type == "FI" ? 0 : 1);
  }
}
function TranscriptTableComponent_tr_17_For_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 23, 2);
    \u0275\u0275listener("click", function TranscriptTableComponent_tr_17_For_22_Template_div_click_0_listener($event) {
      const y_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const transcript_r2 = \u0275\u0275nextContext().$implicit;
      const menuTrigger_r6 = \u0275\u0275reference(14);
      const ctx_r2 = \u0275\u0275nextContext();
      y_r5.type == "PAP" || y_r5.type == "FI" ? $event.stopPropagation() : ctx_r2.clickfunction(y_r5, menuTrigger_r6, transcript_r2);
      return \u0275\u0275resetView(y_r5.expanded = !y_r5.expanded);
    });
    \u0275\u0275text(2);
    \u0275\u0275template(3, TranscriptTableComponent_tr_17_For_22_Conditional_3_Template, 1, 0, "icon", 24);
    \u0275\u0275elementStart(4, "mat-menu", 25, 3)(6, "div")(7, "h6", 26);
    \u0275\u0275text(8, "Confirm Delete ?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 27)(10, "btn", 28);
    \u0275\u0275listener("click", function TranscriptTableComponent_tr_17_For_22_Template_btn_click_10_listener() {
      \u0275\u0275restoreView(_r4);
      const transcript_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.deleteTranscript(transcript_r2));
    });
    \u0275\u0275text(11, " Delete");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "btn", 29);
    \u0275\u0275text(13, "cancel");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275template(14, TranscriptTableComponent_tr_17_For_22_Conditional_14_Template, 2, 1);
  }
  if (rf & 2) {
    const y_r5 = ctx.$implicit;
    const deleteConfirmMenu_r10 = \u0275\u0275reference(5);
    const transcript_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("matMenuTriggerFor", y_r5.type === "DT" ? deleteConfirmMenu_r10 : null);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", (y_r5 == null ? null : y_r5.name) == "Publish" && (transcript_r2 == null ? null : transcript_r2.nSesid) ? "Published" : y_r5 == null ? null : y_r5.name, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(3, (y_r5 == null ? null : y_r5.expandmenu == null ? null : y_r5.expandmenu.length) ? 3 : -1);
    \u0275\u0275advance(11);
    \u0275\u0275conditional(14, (y_r5 == null ? null : y_r5.expanded) && (y_r5 == null ? null : y_r5.expandmenu == null ? null : y_r5.expandmenu.length) > 0 ? 14 : -1);
  }
}
function TranscriptTableComponent_tr_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr", 15);
    \u0275\u0275listener("click", function TranscriptTableComponent_tr_17_Template_tr_click_0_listener() {
      const transcript_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectTranscript(transcript_r2));
    });
    \u0275\u0275elementStart(1, "td", 16);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "td", 16);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "td", 16);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "td", 16);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "td", 16);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "td", 17);
    \u0275\u0275listener("click", function TranscriptTableComponent_tr_17_Template_td_click_12_listener($event) {
      \u0275\u0275restoreView(_r1);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(13, "btn", 18, 0)(15, "span", 19);
    \u0275\u0275text(16, "File");
    \u0275\u0275elementEnd();
    \u0275\u0275element(17, "icon", 20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "mat-menu", 21, 1);
    \u0275\u0275listener("click", function TranscriptTableComponent_tr_17_Template_mat_menu_click_18_listener($event) {
      \u0275\u0275restoreView(_r1);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(20, "div", 22);
    \u0275\u0275listener("click", function TranscriptTableComponent_tr_17_Template_div_click_20_listener($event) {
      \u0275\u0275restoreView(_r1);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275repeaterCreate(21, TranscriptTableComponent_tr_17_For_22_Template, 15, 4, null, null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const transcript_r2 = ctx.$implicit;
    const menuTrigger_r6 = \u0275\u0275reference(14);
    const menu_r9 = \u0275\u0275reference(19);
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classMap((ctx_r2.selectedTranscript == null ? null : ctx_r2.selectedTranscript.cTransid) == transcript_r2.cTransid ? "bg-tab" : "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(3, 13, transcript_r2.dImportDt, "dd-MM-YYYY"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(transcript_r2.nPages);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(transcript_r2.cTitle);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(transcript_r2.dTranscribedDate);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(transcript_r2.cCasename);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(menuTrigger_r6.menuOpen ? "!block" : "");
    \u0275\u0275property("matMenuTriggerFor", menu_r9)("active", menuTrigger_r6.menuOpen)("issmall", true)("addcls", "bg-white shadow-base " + (menuTrigger_r6.menuOpen ? "border !border-blue-400" : ""));
    \u0275\u0275advance(8);
    \u0275\u0275repeater(ctx_r2.menuItems);
  }
}
function TranscriptTableComponent_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275listener("cdkDragMoved", function TranscriptTableComponent_Conditional_18_Template_div_cdkDragMoved_0_listener($event) {
      \u0275\u0275restoreView(_r11);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onDragMoved($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(1, "div", 36);
    \u0275\u0275element(2, "app-transcript-preview", 37);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275styleMap("--dragmove:" + ctx_r2.totalDistance.y + "px");
    \u0275\u0275advance();
    \u0275\u0275property("formData", ctx_r2.selectedTranscript)("cPath", ctx_r2.selectedTranscript.cHtmlpath)("changeTheme", ctx_r2.selectedTheme);
  }
}
function TranscriptTableComponent_Conditional_19_For_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 45);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const msg_r12 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", msg_r12 || "Preparing\u2026", " ");
  }
}
function TranscriptTableComponent_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "div", 38)(2, "div", 39);
    \u0275\u0275element(3, "span", 40);
    \u0275\u0275elementStart(4, "span", 41);
    \u0275\u0275element(5, "icon", 42);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 43)(7, "div", 44);
    \u0275\u0275text(8, " Exporting transcript ");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(9, TranscriptTableComponent_Conditional_19_For_10_Template, 2, 1, "div", 45, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 46);
    \u0275\u0275element(12, "div", 47);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(9);
    \u0275\u0275repeater(\u0275\u0275pureFunction1(0, _c2, ctx_r2.docmessage));
  }
}
function TranscriptTableComponent_Conditional_20_For_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 45);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const msg_r13 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", msg_r13 || "Preparing\u2026", " ");
  }
}
function TranscriptTableComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "div", 38)(2, "div", 39);
    \u0275\u0275element(3, "span", 40);
    \u0275\u0275elementStart(4, "span", 41);
    \u0275\u0275element(5, "icon", 42);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 43)(7, "div", 44);
    \u0275\u0275text(8, " Publishing transcript ");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(9, TranscriptTableComponent_Conditional_20_For_10_Template, 2, 1, "div", 45, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 46);
    \u0275\u0275element(12, "div", 47);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(9);
    \u0275\u0275repeater(\u0275\u0275pureFunction1(0, _c2, ctx_r2.docmessage));
  }
}
function TranscriptTableComponent_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13);
    \u0275\u0275element(1, "img", 48);
    \u0275\u0275elementEnd();
  }
}
function TranscriptTableComponent_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14)(1, "div", 49)(2, "div", 50)(3, "h6", 51);
    \u0275\u0275text(4, "Transcript Viewer");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 52);
    \u0275\u0275listener("click", function TranscriptTableComponent_Conditional_22_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.closeHtmlViewer());
    });
    \u0275\u0275text(6, "\xD7");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 53);
    \u0275\u0275element(8, "transcript-viewer", 54);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(8);
    \u0275\u0275property("nSesid", ctx_r2.htmlViewerSesid)("viewMode", "full");
  }
}
var TranscriptTableComponent = class _TranscriptTableComponent {
  constructor(matDialog, transcriptS, cdr, socketService) {
    this.matDialog = matDialog;
    this.transcriptS = transcriptS;
    this.cdr = cdr;
    this.socketService = socketService;
    this.onEvent = new EventEmitter();
    this.selectedTranscript = null;
    this.willprint = false;
    this.transcripts = [];
    this.menuItems = [
      {
        name: "Publish",
        expanded: false,
        type: "P"
      },
      {
        name: "Full-sized Transcript Preview",
        expanded: false,
        type: "FSP"
      },
      {
        name: "Print as PDF",
        expanded: false,
        type: "PAP",
        expandmenu: [
          {
            name: "Full-sized Transcript",
            type: "FST"
          },
          {
            name: "4-Ups Condensed Transcript",
            type: "4UP"
          },
          {
            name: "Word Index",
            type: "WI"
          }
        ]
      },
      {
        name: "Export Transcript .docx",
        expanded: false,
        type: "ETD"
      },
      {
        name: "Edit Transcript",
        expanded: false,
        type: "ET"
      },
      {
        name: "File info",
        expanded: false,
        type: "FI",
        expandmenu: [
          {
            Reporter: "Nicky Misso",
            Transcribed: "DD/MM/YYYY"
          }
        ]
      },
      {
        name: "Copy Transcript",
        expanded: false,
        type: "CP"
      },
      {
        name: "Delete Transcript",
        expanded: false,
        type: "DT"
      }
    ];
    this.dragDistance = { x: 0, y: 0 };
    this.totalDistance = { x: 0, y: 0 };
    this.isPrint = false;
    this.type = "";
    this.docmessage = "";
    this.itemSize = 40;
    this.isPublishLoading = false;
    this.showHtmlViewer = false;
    this.htmlViewerSesid = "";
    this.isPrintLoading = false;
    this.isIndexexporting = false;
    this.socketSubscription = this.socketService.getTransctipt().subscribe((res) => {
      if (res.event == "DOC-EXPORT") {
        const data = res.data.data;
        if (res.event == "DOC-EXPORT" && data.status == "P") {
          this.isPrintLoading = true;
          console.log("Transcript export in progress", data);
          if (data?.message) {
            this.docmessage = data.message;
          } else {
            this.docmessage = "Transcript export in progress";
          }
        } else if (res.event == "DOC-EXPORT" && data.status == "S") {
          console.log("Transcript export success", data);
          this.isPrintLoading = false;
          this.downloadURI(data.path, "Transcript_Document.docx");
        }
        if (res.event == "DOC-EXPORT" && data.status == "F") {
          console.log("Transcript export failed", data);
          this.isPrintLoading = false;
          this.transcriptS.errorMessage("Transcript export failed");
        }
      }
      if (res.event == "PUBLISH-TRANSCRIPT") {
        const data = res.data.data;
        if (res.event == "PUBLISH-TRANSCRIPT" && data.status == "P") {
          this.isPublishLoading = true;
          console.log("Transcript publish in progress", data);
          if (data?.message) {
            this.docmessage = data.message;
          } else {
            this.docmessage = "Transcript publish in progress";
          }
        } else if (res.event == "PUBLISH-TRANSCRIPT" && data.status == "S") {
          console.log("Transcript publish success", data);
          this.isPublishLoading = false;
        } else if (res.event == "PUBLISH-TRANSCRIPT" && data.status == "F") {
          console.log("Transcript publish Failed", data);
          setTimeout(() => {
            this.isPublishLoading = false;
          }, 1e3);
        }
      }
    });
  }
  ngOnInit() {
    this.getTranscriptList();
  }
  ngOnDestroy() {
    this.socketSubscription.unsubscribe();
  }
  ngOnChanges(changes) {
    if (changes["selectedTheme"] && !changes["selectedTheme"].firstChange) {
      this.getTranscriptList();
    }
  }
  publish(cTransid, cPath) {
    const dialogRef = this.matDialog.open(PublishComponent, {
      width: "591px",
      height: "fit-content",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: { cTransid, cPath }
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }
  /**
   * Re-publish flow for an already-published transcript.
   * Skips the case/session picker (the transcript is already bound to its
   * session), asks for confirmation, then POSTs /transcript/publish directly
   * with the existing nSesid + cTransid + cPath. The backend re-runs
   * annotation transfer (PY_ANNOT_TRANSFER_BY_TRANSCRIPT) with the latest
   * orphan-detection threshold, rewrites transferred coord columns, and
   * emits `realtime-events { type: 'SD' }` so connected clients auto-refresh.
   */
  confirmRepublish(transcript) {
    const dialogRef = this.matDialog.open(DialogueComponent, {
      width: "fit-content",
      minWidth: "500px",
      height: "fit-content",
      data: {
        type: "I",
        heading: "Re-publish transcript?",
        desc: "This will re-run annotation transfer against the current final transcript. Annotations whose source content still matches will re-anchor to the new positions; annotations whose content was removed during editing will be flagged as orphans and hidden from the published view (visible to their owners in Needs Review).",
        button1: "Cancel",
        button2: "Re-publish",
        bt1res: false,
        bt2res: true
      }
    });
    dialogRef.afterClosed().subscribe((result) => __async(this, null, function* () {
      if (result?.res !== true)
        return;
      this.docmessage = "Starting publish\u2026";
      this.isPublishLoading = true;
      this.cdr.detectChanges();
      try {
        yield this.transcriptS.publishTranscript({
          cTransid: transcript.cTransid,
          nSesid: transcript.nSesid,
          nCaseid: null,
          cPath: transcript.cPath,
          isIgnoreErr: true,
          errorCount: 10
        });
      } finally {
        this.isPublishLoading = false;
        this.cdr.detectChanges();
      }
    }));
  }
  printPreview(formdata, type) {
    return __async(this, null, function* () {
      const dialogRef = this.matDialog.open(TranscriptPreviewComponent, {
        width: "calc(194.125mm + 100px)",
        height: "90vh",
        panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
        data: {
          formData: formdata,
          type,
          isFullSize: true
        }
      });
      dialogRef.afterClosed().subscribe((result) => {
      });
    });
  }
  openHtmlViewer(transcript) {
    this.htmlViewerSesid = transcript.nSesid;
    this.showHtmlViewer = true;
    this.cdr.detectChanges();
  }
  closeHtmlViewer() {
    this.showHtmlViewer = false;
    this.htmlViewerSesid = "";
    this.cdr.detectChanges();
  }
  clickfunction(y, menu, transcript) {
    if (y.name == "Publish") {
      if (transcript.nSesid) {
        this.confirmRepublish(transcript);
        return;
      }
      this.publish(transcript.cTransid, transcript.cPath);
    }
    if (y.name == "Full-sized Transcript Preview") {
      if (transcript.nSesid) {
        this.openHtmlViewer(transcript);
      } else {
        this.printPreview(transcript, y.type);
      }
    }
    if (y.name == "4-Ups Condensed Transcript") {
      this.transcriptS.printRawHtml(transcript.cHtmlpath4pg, transcript.cTransid, "4UP");
    }
    if (y.name == "Full-sized Transcript") {
      this.transcriptS.printRawHtml(transcript.cHtmlpath, transcript.cTransid, "FST");
    }
    if (y.name == "Export Transcript .docx") {
      this.downloadDoc(transcript.cHtmlpath, transcript.cTransid);
    }
    if (y.name == "Edit Transcript") {
      this.selectedTranscript = null;
      this.onEvent.emit({ event: "edit", data: transcript });
    }
    if (y.name == "Word Index") {
      this.generateFileIndex(transcript.cPath, transcript.cTransid);
    }
    if (y.name == "File info") {
    }
    if (y.name == "Delete Transcript") {
      setTimeout(() => this.deleteMenuTrigger.openMenu(), 0);
      return;
    }
    if (y.name == "Copy Transcript") {
      this.onEvent.emit({ event: "COPY", data: { cTransid: transcript.cTransid } });
    }
    if (menu && menu.closeMenu) {
      menu.closeMenu();
    }
  }
  selectTranscript(transcript) {
    if (this.selectedTranscript?.cTransid == transcript.cTransid && this.type == "") {
      this.selectedTranscript = null;
      this.isPrintLoading = false;
      this.willprint = false;
    } else {
      this.selectedTranscript = transcript;
      this.cdr.detectChanges();
    }
  }
  onDragMoved(event) {
    this.totalDistance = {
      x: event.distance.x,
      y: event.distance.y
    };
  }
  // onDragEnded(event: CdkDragEnd) {
  //   // Update total distance moved
  //   this.totalDistance = {
  //     x: this.totalDistance.x + event.distance.x,
  //     y: this.totalDistance.y + event.distance.y
  //   };
  //   // Reset current drag distance
  //   this.dragDistance = { x: 0, y: 0 };
  // }
  getTranscriptList() {
    this.transcriptS.getTranscriptList().then((res) => {
      this.transcripts = res;
      if (this.selectedTranscript && this.selectedTranscript.cTransid) {
        this.selectedTranscript = this.transcripts.find((x) => x.cTransid == this.selectedTranscript.cTransid) || null;
      }
    }).catch((err) => {
      console.error("Error fetching transcript list:", err);
      this.transcriptForm = [];
    });
  }
  generateFileIndex(cPath, cTransid) {
    return __async(this, null, function* () {
      this.isIndexexporting = true;
      const res = yield this.transcriptS.generateIndex(cPath, cTransid);
      if (res) {
        this.isIndexexporting = false;
      }
      const url = window.URL.createObjectURL(res);
      const a = document.createElement("a");
      a.href = url;
      a.download = "index.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
  downloadDoc(htmlFilePath, cTransid) {
    return __async(this, null, function* () {
      const res = yield this.transcriptS.downloadDoc(htmlFilePath, cTransid);
      if (res.msg == 1) {
        this.isPrintLoading = true;
      }
    });
  }
  downloadURI(uri, name) {
    const fileName = uri;
    const file = this.transcriptS.downloadFile(fileName).subscribe((blob) => {
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = name;
      a.click();
      URL.revokeObjectURL(objectUrl);
      file.unsubscribe();
    }, (error) => {
      console.error("Download error:", error);
      try {
        file.unsubscribe();
      } catch (error2) {
      }
    });
  }
  deleteTranscript(transcript) {
    return __async(this, null, function* () {
      const res = yield this.transcriptS.deleteTranscript(transcript.cTransid);
      if (res.msg == 1) {
        debugger;
        let ind = this.transcripts.findIndex((x) => x.cTransid == transcript.cTransid);
        if (ind > -1) {
          this.transcripts.splice(ind, 1);
          this.transcripts = [...this.transcripts];
        }
        this.selectedTranscript = null;
        this.cdr.detectChanges();
      } else {
        this.transcriptS.errorMessage("Failed to delete transcript");
      }
    });
  }
  static {
    this.\u0275fac = function TranscriptTableComponent_Factory(t) {
      return new (t || _TranscriptTableComponent)(\u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(TranscriptService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(SocketService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TranscriptTableComponent, selectors: [["transcript-table"]], viewQuery: function TranscriptTableComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c02, 5);
        \u0275\u0275viewQuery(_c1, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.deleteMenuTrigger = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.trigger = _t.first);
      }
    }, inputs: { selectedTheme: "selectedTheme", transcriptForm: "transcriptForm" }, outputs: { onEvent: "onEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 23, vars: 13, consts: [["menuTrigger", "matMenuTrigger"], ["menu", "matMenu"], ["deleteMenuTrigger", "matMenuTrigger"], ["deleteConfirmMenu", "matMenu"], [1, "flex", "flex-col", "boundry", "h-[calc(100vh-157px)]"], [1, "transcript-table", "bg-splmntry/30", "shadow-[inset_0px_0px_14px_0px_rgba(0,0,0,0.1)]", "p-6", "rounded-md", 3, "itemSize", "minBufferPx", "maxBufferPx"], [1, "w-full", 2, "border-spacing", "0px 12px", "border-collapse", "separate"], [1, "border-b", "border-tab", "bg-grey", "text-white"], [1, "font-bold", "text-xs", "py-1.5", "text-left", "px-2.5"], [1, "w-24"], [1, "divide-y", "divide-tab"], ["class", "hover:bg-tab group", 3, "class", "click", 4, "cdkVirtualFor", "cdkVirtualForOf"], ["role", "status", "aria-live", "polite", 1, "progress-banner", "fixed", "bottom-6", "left-1/2", "-translate-x-1/2", "z-50", "w-[440px]", "max-w-[92vw]", "rounded-2xl", "border", "border-white/10", "bg-grey/95", "backdrop-blur-xl", "shadow-2xl", "shadow-black/40", "text-white", "overflow-hidden"], [1, "fixed", "top-0", "left-0", "w-full", "h-full", "bg-black/75", "backdrop-blur-sm", "z-[99999]", "flex", "items-center", "justify-center"], [1, "fixed", "top-0", "left-0", "w-full", "h-full", "bg-black/60", "z-[9999]", "flex", "items-center", "justify-center"], [1, "hover:bg-tab", "group", 3, "click"], [1, "text-xs", "text-grey", "px-2.5", "py-2"], [1, "px-2.5", "py-0", "bg-[#fafcff]", 3, "click"], ["b", "", "mode", "outline", 1, "hidden", "group-hover:!block", 3, "matMenuTriggerFor", "active", "issmall", "addcls"], [1, "text-xs"], ["name", "chvy", "type", "comnicn", 1, "-rotate-90", "text-xxs", "text-grey", "ms-3"], [1, "!rounded-base", "!p-0", "mt-1", "w-[289px]", "!min-w-[289px]", 3, "click"], [1, "p-2.5", "flex", "flex-col", "gap-2", 3, "click"], [1, "text-xs", "text-grey", "h-8", "flex", "items-center", "gap-2", "rounded-base", "px-5", "hover:bg-gray-100", "cursor-pointer", 3, "click", "matMenuTriggerFor"], ["name", "chvx", 1, "ms-auto"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click"], ["mode", "dark"], [1, "text-xs", "text-grey", "flex", "flex-col", "gap-2", "p-2", "ps-5", "py-2.5", "bg-white", "border", "rounded-base", "cursor-pointer"], [1, "block"], [1, "flex", "flex-col", "gap-2"], [1, "text-xs", "text-grey", "h-6", "flex", "items-center", "gap-2", "rounded-md", "p-2", "ps-10", "hover:bg-gray-100", "cursor-pointer"], [1, "text-xs", "text-grey", "h-6", "flex", "items-center", "gap-2", "rounded-md", "p-2", "ps-10", "hover:bg-gray-100", "cursor-pointer", 3, "click"], ["cdkDragBoundary", ".boundry", "cdkDragLockAxis", "y", "cdkDrag", "", 1, "min-h-1", "w-full", "relative", "z-[999]", "!transform-none", "cursor-s-resize", 3, "cdkDragMoved"], [1, "transcript-preview", "overflow-auto"], [3, "formData", "cPath", "changeTheme"], [1, "flex", "items-center", "gap-4", "px-5", "py-4"], [1, "relative", "h-10", "w-10", "shrink-0"], [1, "absolute", "inset-0", "rounded-full", "bg-orange/30", "animate-ping"], [1, "absolute", "inset-1", "rounded-full", "bg-gradient-to-br", "from-orange", "to-orange/70", "flex", "items-center", "justify-center", "shadow-lg", "shadow-orange/30"], ["name", "info"], [1, "min-w-0", "flex-1"], [1, "text-[11px]", "uppercase", "tracking-[0.14em]", "text-white/60", "font-semibold"], [1, "progress-banner__msg", "text-[13px]", "font-medium", "text-sgreen", "truncate"], [1, "relative", "h-[3px]", "w-full", "bg-white/10", "overflow-hidden"], [1, "progress-banner__bar", "absolute", "h-full", "bg-gradient-to-r", "from-transparent", "via-orange", "to-transparent"], ["src", "../../../../assets/icons/loaderorange.svg", "alt", "loading", 1, "w-14", "h-14", "mx-auto", "animate-spin"], [1, "bg-white", "rounded-lg", "shadow-xl", "w-[90vw]", "h-[90vh]", "flex", "flex-col", "overflow-hidden"], [1, "flex", "items-center", "justify-between", "px-4", "py-2", "border-b", "border-neutral-200", "bg-neutral-50"], [1, "text-sm", "font-semibold", "text-gray-800"], [1, "text-neutral-500", "hover:text-neutral-800", "text-lg", "px-2", 3, "click"], [1, "flex-1", "overflow-hidden"], [3, "nSesid", "viewMode"]], template: function TranscriptTableComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 4)(1, "cdk-virtual-scroll-viewport", 5)(2, "table", 6)(3, "thead")(4, "tr", 7)(5, "th", 8);
        \u0275\u0275text(6, "Date imported ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "th", 8);
        \u0275\u0275text(8, "Pages");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "th", 8);
        \u0275\u0275text(10, "Title");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "th", 8);
        \u0275\u0275text(12, "Transcribed on");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "th", 8);
        \u0275\u0275text(14, "Case name");
        \u0275\u0275elementEnd();
        \u0275\u0275element(15, "th", 9);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(16, "tbody", 10);
        \u0275\u0275template(17, TranscriptTableComponent_tr_17_Template, 23, 16, "tr", 11);
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(18, TranscriptTableComponent_Conditional_18_Template, 3, 5);
        \u0275\u0275elementEnd();
        \u0275\u0275template(19, TranscriptTableComponent_Conditional_19_Template, 13, 2, "div", 12)(20, TranscriptTableComponent_Conditional_20_Template, 13, 2, "div", 12)(21, TranscriptTableComponent_Conditional_21_Template, 2, 0, "div", 13)(22, TranscriptTableComponent_Conditional_22_Template, 9, 2, "div", 14);
      }
      if (rf & 2) {
        \u0275\u0275classProp("selected", ctx.selectedTranscript);
        \u0275\u0275advance();
        \u0275\u0275styleMap("--dragmove:" + ctx.totalDistance.y + "px");
        \u0275\u0275property("itemSize", ctx.itemSize)("minBufferPx", 200)("maxBufferPx", 400);
        \u0275\u0275advance(16);
        \u0275\u0275property("cdkVirtualForOf", ctx.transcripts);
        \u0275\u0275advance();
        \u0275\u0275conditional(18, ctx.selectedTranscript ? 18 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(19, ctx.isPrintLoading ? 19 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(20, ctx.isPublishLoading ? 20 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(21, ctx.isIndexexporting ? 21 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(22, ctx.showHtmlViewer && ctx.htmlViewerSesid ? 22 : -1);
      }
    }, dependencies: [CommonModule, DatePipe, ButtonComponent, IconComponent, MatMenuModule, MatMenu, MatMenuTrigger, DragDropModule, CdkDrag, TranscriptPreviewComponent, ScrollingModule, CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport, TranscriptViewerComponent], styles: ["\n\n.selected[_ngcontent-%COMP%]   .transcript-table[_ngcontent-%COMP%] {\n  height: calc(50% + var(--dragmove));\n  min-height: 10px;\n}\ncdk-virtual-scroll-viewport[_ngcontent-%COMP%] {\n  height: 100%;\n  width: 100%;\n}\ncdk-virtual-scroll-viewport.transcript-table[_ngcontent-%COMP%] {\n  display: block;\n  overflow: auto;\n}\n.transcript-preview[_ngcontent-%COMP%] {\n  height: calc(50% - var(--dragmove));\n  min-height: 10px;\n  background: #dddddd;\n}\n.m-0[_ngcontent-%COMP%] {\n  margin: 0 !important;\n}\n.progress-banner[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_progress-banner-in 320ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.progress-banner__bar[_ngcontent-%COMP%] {\n  width: 40%;\n  animation: _ngcontent-%COMP%_progress-banner-bar 1.5s ease-in-out infinite;\n}\n.progress-banner__msg[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_progress-banner-msg 280ms ease-out both;\n}\n@keyframes _ngcontent-%COMP%_progress-banner-in {\n  from {\n    opacity: 0;\n    transform: translate(-50%, 24px);\n  }\n  to {\n    opacity: 1;\n    transform: translate(-50%, 0);\n  }\n}\n@keyframes _ngcontent-%COMP%_progress-banner-bar {\n  0% {\n    transform: translateX(-100%);\n  }\n  100% {\n    transform: translateX(350%);\n  }\n}\n@keyframes _ngcontent-%COMP%_progress-banner-msg {\n  from {\n    opacity: 0;\n    transform: translateY(3px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .progress-banner[_ngcontent-%COMP%], .progress-banner__bar[_ngcontent-%COMP%], .progress-banner__msg[_ngcontent-%COMP%] {\n    animation: none;\n  }\n  .progress-banner[_ngcontent-%COMP%] {\n    transform: translateX(-50%);\n  }\n}\n/*# sourceMappingURL=transcript-table.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TranscriptTableComponent, { className: "TranscriptTableComponent", filePath: "src\\app\\adminpanel\\components\\transscript\\transcript-table\\transcript-table.component.ts", lineNumber: 29 });
})();

// src/app/adminpanel/components/transscript/transcript-import/transcript-import.component.ts
function TranscriptImportComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "section", 2)(1, "div", 3)(2, "p", 4);
    \u0275\u0275text(3, " Select a transcript file ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 5);
    \u0275\u0275text(5, " Drag & drop file here from your system (ASCII file only) ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "btn", 6);
    \u0275\u0275listener("click", function TranscriptImportComponent_Conditional_3_Template_btn_click_6_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.getFile());
    });
    \u0275\u0275text(7, " Browse ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "input", 7);
    \u0275\u0275listener("change", function TranscriptImportComponent_Conditional_3_Template_input_change_8_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onFileChange($event));
    });
    \u0275\u0275elementEnd()()();
  }
}
function TranscriptImportComponent_Conditional_4_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 14);
    \u0275\u0275text(1, "Pending upload completion..");
    \u0275\u0275elementEnd();
  }
}
function TranscriptImportComponent_Conditional_4_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 14);
    \u0275\u0275text(1, "Worng file format or corrupted file");
    \u0275\u0275elementEnd();
  }
}
function TranscriptImportComponent_Conditional_4_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 14);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Uploading failed :", ctx_r1.reason, "");
  }
}
function TranscriptImportComponent_Conditional_4_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 14);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "h6", 14);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Page no ", ctx_r1.nStartpg, " on the second page of this file");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r1.nLines, " lines per page");
  }
}
function TranscriptImportComponent_Conditional_4_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 16)(1, "btn", 6);
    \u0275\u0275listener("click", function TranscriptImportComponent_Conditional_4_Conditional_13_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.closeImport(false));
    });
    \u0275\u0275text(2, " Cancel");
    \u0275\u0275elementEnd()();
  }
}
function TranscriptImportComponent_Conditional_4_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17)(1, "btn", 18);
    \u0275\u0275listener("click", function TranscriptImportComponent_Conditional_4_Conditional_14_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.closeImport(true));
    });
    \u0275\u0275text(2, " Next: Transcript Properties");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "btn", 6);
    \u0275\u0275listener("click", function TranscriptImportComponent_Conditional_4_Conditional_14_Template_btn_click_3_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.closeImport(false));
    });
    \u0275\u0275text(4, " Cancel");
    \u0275\u0275elementEnd()();
  }
}
function TranscriptImportComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 8)(1, "div", 9);
    \u0275\u0275element(2, "icon", 10);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 11);
    \u0275\u0275listener("click", function TranscriptImportComponent_Conditional_4_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeImport(false));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div", 12)(6, "h6", 13);
    \u0275\u0275text(7, "Details:");
    \u0275\u0275elementEnd();
    \u0275\u0275template(8, TranscriptImportComponent_Conditional_4_Conditional_8_Template, 2, 0, "h6", 14)(9, TranscriptImportComponent_Conditional_4_Conditional_9_Template, 2, 0)(10, TranscriptImportComponent_Conditional_4_Conditional_10_Template, 2, 1, "h6", 14)(11, TranscriptImportComponent_Conditional_4_Conditional_11_Template, 4, 2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "div", 15);
    \u0275\u0275template(13, TranscriptImportComponent_Conditional_4_Conditional_13_Template, 3, 0, "div", 16)(14, TranscriptImportComponent_Conditional_4_Conditional_14_Template, 5, 0, "div", 17);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r1.cFilename, " ");
    \u0275\u0275advance(5);
    \u0275\u0275conditional(8, ctx_r1.uploading ? 8 : ctx_r1.uploading && !ctx_r1.isConvert ? 9 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(10, !ctx_r1.uploading && !ctx_r1.isConvert ? 10 : ctx_r1.isImported ? 11 : -1);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(13, !ctx_r1.isImported ? 13 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(14, ctx_r1.isImported ? 14 : -1);
  }
}
var TranscriptImportComponent = class _TranscriptImportComponent {
  constructor(dialogRef, upload, transcriptS) {
    this.dialogRef = dialogRef;
    this.upload = upload;
    this.transcriptS = transcriptS;
    this.isUpload = false;
    this.isImported = false;
    this.cFilename = "";
    this.uploadedPath = "";
    this.uploading = false;
    this.nLines = 22;
    this.nStartpg = 2;
    this.nSecondpg = 3;
    this.nPages = 0;
    this.isConvert = false;
    this.reason = "";
  }
  getFile() {
    const fileInput = document.querySelector('input[type="file"]');
    fileInput.click();
  }
  closeImport(isImported) {
    if (isImported) {
      this.dialogRef.close({
        isImported: true,
        fileData: {
          filePath: this.uploadedPath,
          fileName: this.uploadFile.name,
          fileType: this.uploadFile.type,
          nStartpg: this.nStartpg,
          nSecondpg: this.nSecondpg,
          nLines: this.nLines,
          nPages: this.nPages
        }
      });
    } else {
      this.dialogRef.close();
    }
  }
  onFileChange(e) {
    return __async(this, null, function* () {
      this.uploadFile = e.target.files[0];
      this.cFilename = this.uploadFile.name;
      this.isUpload = true;
      this.uploadTransFile();
    });
  }
  uploadTransFile() {
    return __async(this, null, function* () {
      const formData = new FormData();
      formData.append("rootPath", "users");
      formData.append("filename", ("transcript_" + (/* @__PURE__ */ new Date()).getTime()).toString());
      formData.append("filetype", this.uploadFile.type);
      formData.append("file", this.uploadFile);
      let res = yield this.transcriptS.transcriptUpload(formData);
      this.uploading = true;
      if (res.msg == -1) {
        this.reason = res.error.message;
        this.isImported = false;
      } else {
        this.uploading = false;
        this.isConvert = false;
        this.uploadedPath = `${res.path}`;
        this.convertTextToJSON();
      }
    });
  }
  convertTextToJSON() {
    return __async(this, null, function* () {
      this.isConvert = true;
      let res = yield this.transcriptS.ConvertTextToJSON(this.uploadedPath);
      debugger;
      if (res.msg == -1) {
        this.reason = res.error;
        this.uploading = false;
        this.isConvert = false;
        this.isImported = false;
      } else {
        this.uploading = false;
        this.isConvert = true;
        this.isImported = true;
        this.uploadedPath = `${res.path}`;
        this.getFileSummery();
      }
    });
  }
  getFileSummery() {
    return __async(this, null, function* () {
      let res = yield this.transcriptS.getFileSummery(this.uploadedPath);
      console.log(res);
      if (res.msg == 1) {
        this.nLines = res.maxLineno;
        this.nStartpg = res.firstPageNo;
        this.nPages = res.totalPages;
      } else {
        this.reason = res.error;
        this.uploading = false;
        this.isConvert = false;
        this.isImported = false;
      }
    });
  }
  static {
    this.\u0275fac = function TranscriptImportComponent_Factory(t) {
      return new (t || _TranscriptImportComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(UploadManagementService), \u0275\u0275directiveInject(TranscriptService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TranscriptImportComponent, selectors: [["app-transcript-import"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 5, vars: 2, consts: [[1, "flex", "flex-col", "p-10", "bg-[#F4F6F9]", "rounded-xl", "shadow-sm", "max-w-[940px]", "max-md:px-5"], [1, "text-lg", "font-semibold", "tracking-tight", "text-neutral-600", "max-md:max-w-full", "mb-2.5"], [1, "flex", "justify-center", "items-center", "px-10", "py-10", "mt-2.5", "bg-white", "rounded-xl", "border", "border-dashed", "border-stone-300"], [1, "flex", "flex-col", "items-center", "max-w-full", "w-[309px]"], [1, "self-stretch", "text-base", "font-bold", "text-center", "text-neutral-600"], [1, "self-stretch", "text-xs", "mb-3", "text-center", "text-neutral-600"], ["mode", "white", 3, "click"], ["accept", ".txt", "type", "file", "hidden", "", 3, "change"], [1, "p-5", "bg-reply", "border", "justify-between", "rounded-base", "flex", "items-center", "mb-2.5"], [1, "flex", "gap-2.5", "items-center", "mt-1.5", "text-xs"], ["name", "file"], ["name", "close", 1, "text-xs", 3, "click"], [1, "mt-5"], [1, "text-xs", "font-semibold"], [1, "text-xxs"], [1, "mt-10", "flex", "justify-between", "gap-5"], [1, "flex", "gap-2.5", "mt-1.5", "text-xs"], [1, "flex", "gap-2.5", "mt-1.5", "text-xs", "justify-end"], [3, "click"]], template: function TranscriptImportComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "section", 0)(1, "h1", 1);
        \u0275\u0275text(2, " Import Transcript ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(3, TranscriptImportComponent_Conditional_3_Template, 9, 0, "section", 2)(4, TranscriptImportComponent_Conditional_4_Template, 15, 5);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275conditional(3, !ctx.isUpload ? 3 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(4, ctx.isUpload ? 4 : -1);
      }
    }, dependencies: [FormsModule, ButtonComponent, MatSelectModule, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TranscriptImportComponent, { className: "TranscriptImportComponent", filePath: "src\\app\\adminpanel\\components\\transscript\\transcript-import\\transcript-import.component.ts", lineNumber: 19 });
})();

// src/app/adminpanel/components/transscript/transscript.component.ts
var TransscriptComponent = class _TransscriptComponent {
  constructor(secureStorage, router, dialog, transcriptS) {
    this.secureStorage = secureStorage;
    this.router = router;
    this.dialog = dialog;
    this.transcriptS = transcriptS;
    this.selectedTheme = null;
    this.transcriptForm = null;
    this.fileData = null;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userDetails = yield this.secureStorage.getUserInfo();
    });
  }
  onSignOut() {
    this.secureStorage.logOut();
    this.router.navigate(["/auth/login"]);
  }
  onImportTranscript() {
    console.log("Import transcript clicked");
  }
  importTranscript(cTransid) {
    const dialogRef = this.dialog.open(TranscriptImportComponent, {
      width: "900px",
      height: "fit-content",
      maxHeight: "99vh",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"]
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.isImported) {
          this.fileData = result.fileData;
          this.openTranscriptProperties(cTransid, "COPY");
        }
      }
    });
  }
  openTranscriptProperties(cTransid, action) {
    const dialogRef = this.dialog.open(TranscriptPropertiesComponent, {
      width: "1400px",
      maxWidth: "99vw",
      height: "fit-content",
      maxHeight: "95vh",
      panelClass: ["transcript-properties-dialog", "overflow-hidden"],
      data: {
        fileData: this.fileData,
        cTransid,
        action
        // 'COPY' or 'EDIT'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.selectedTheme = Math.floor(1e5 + Math.random() * 9e5);
    });
  }
  tableEvent(event) {
    if (event.event === "edit") {
      this.openTranscriptProperties(event.data.cTransid);
    } else if (event.event === "COPY") {
      this.importTranscript(event.data.cTransid);
    }
  }
  static {
    this.\u0275fac = function TransscriptComponent_Factory(t) {
      return new (t || _TransscriptComponent)(\u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(TranscriptService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TransscriptComponent, selectors: [["app-transscript"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 16, vars: 5, consts: [[1, "flex", "flex-col", "gap-6", "p-10", "w-full", "h-full"], [1, "flex", "items-center", "justify-between", "pr-10"], [1, "flex", "items-center", "gap-2.5", "pr-5"], ["name", "transcript", "type", "myfileicn", 1, "text-grey", "text-xl"], [1, "text-lg", "font-semibold", "text-grey", "tracking-tighter", "italic"], [1, "flex", "items-center", "gap-2.5"], [3, "size", "detail"], ["mode", "white", "addcls", "shadow-base", 3, "click", "issmall"], [1, "text-xs", "text-grey"], [1, "flex"], ["mode", "solid", "addcls", "bg-brand text-white", 3, "click", "issmall"], [1, "text-xs"], [1, "h-full", 3, "onEvent", "selectedTheme"]], template: function TransscriptComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2);
        \u0275\u0275element(3, "icon", 3);
        \u0275\u0275elementStart(4, "h1", 4);
        \u0275\u0275text(5, "Transcript Import");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 5);
        \u0275\u0275element(7, "avtr", 6);
        \u0275\u0275elementStart(8, "btn", 7);
        \u0275\u0275listener("click", function TransscriptComponent_Template_btn_click_8_listener() {
          return ctx.onSignOut();
        });
        \u0275\u0275elementStart(9, "span", 8);
        \u0275\u0275text(10, "Sign out");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(11, "div", 9)(12, "btn", 10);
        \u0275\u0275listener("click", function TransscriptComponent_Template_btn_click_12_listener() {
          return ctx.importTranscript();
        });
        \u0275\u0275elementStart(13, "span", 11);
        \u0275\u0275text(14, "Import Transcript");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(15, "transcript-table", 12);
        \u0275\u0275listener("onEvent", function TransscriptComponent_Template_transcript_table_onEvent_15_listener($event) {
          return ctx.tableEvent($event);
        });
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(7);
        \u0275\u0275property("size", "sm")("detail", ctx.userDetails);
        \u0275\u0275advance();
        \u0275\u0275property("issmall", true);
        \u0275\u0275advance(4);
        \u0275\u0275property("issmall", true);
        \u0275\u0275advance(3);
        \u0275\u0275property("selectedTheme", ctx.selectedTheme);
      }
    }, dependencies: [
      CommonModule,
      TranscriptTableComponent,
      ButtonComponent,
      IconComponent,
      AvatarComponent
    ] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TransscriptComponent, { className: "TransscriptComponent", filePath: "src\\app\\adminpanel\\components\\transscript\\transscript.component.ts", lineNumber: 28 });
})();
export {
  TransscriptComponent
};
//# sourceMappingURL=chunk-GSVCQEG5.js.map
