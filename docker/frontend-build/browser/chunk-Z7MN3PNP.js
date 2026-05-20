import {
  PageRangeToolComponent
} from "./chunk-XZDZSNSM.js";
import {
  PdfEvents
} from "./chunk-JX6C2RXC.js";
import {
  PdfDataService
} from "./chunk-F3YHE7Z5.js";
import {
  IndividualService
} from "./chunk-GNZXOHZW.js";
import {
  MatRadioButton,
  MatRadioGroup,
  MatRadioModule
} from "./chunk-ILBZODYX.js";
import {
  MyfileService
} from "./chunk-M4TJ3SSY.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  BroadcastingService
} from "./chunk-6RMJH3FI.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  __spreadProps,
  __spreadValues,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassProp,
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
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpropertyInterpolate,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵsanitizeResourceUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/myfiles/preview-page-range/preview-page-range.component.ts
function PreviewPageRangeComponent_Conditional_0_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "div", 3)(3, "div", 4)(4, "div", 5)(5, "span", 6);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "icon", 7)(8, "i", 8);
    \u0275\u0275element(9, "span", 9);
    \u0275\u0275elementEnd()()()()()()();
    \u0275\u0275element(10, "iframe", 10, 0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", ctx_r0.activeFile == null ? null : ctx_r0.activeFile.cFilename, "");
    \u0275\u0275advance(4);
    \u0275\u0275property("src", ctx_r0.cPath, \u0275\u0275sanitizeResourceUrl);
  }
}
function PreviewPageRangeComponent_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "div", 12);
    \u0275\u0275element(2, "img", 13);
    \u0275\u0275elementStart(3, "h6", 14);
    \u0275\u0275text(4, "File not found");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "h6", 15);
    \u0275\u0275text(6, "please close this pdf & load again");
    \u0275\u0275elementEnd()()();
  }
}
function PreviewPageRangeComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PreviewPageRangeComponent_Conditional_0_Conditional_0_Template, 12, 2)(1, PreviewPageRangeComponent_Conditional_0_Conditional_1_Template, 7, 0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, ctx_r0.cPath ? 0 : 1);
  }
}
function PreviewPageRangeComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
var PreviewPageRangeComponent = class _PreviewPageRangeComponent {
  constructor(cf) {
    this.cf = cf;
    this.isLoaded = false;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.updatePath();
    });
  }
  closePreview() {
  }
  updatePath() {
    if (this.activeFile) {
      const path = this.cf.senitizeUrl(this.activeFile.cPath, this.activeFile.nBundledetailid, this.nCaseid, true, this.hightlightMode, 1, null, null, null, null, null, null, null, null, false, null, this.nSectionid, null, null, null);
      if (path != this.cPath) {
        this.cPath = path;
      }
    }
    if (this.cPath) {
      this.isLoaded = true;
    }
  }
  static {
    this.\u0275fac = function PreviewPageRangeComponent_Factory(t) {
      return new (t || _PreviewPageRangeComponent)(\u0275\u0275directiveInject(CommonfunctionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PreviewPageRangeComponent, selectors: [["preview-page-range"]], inputs: { activeFile: "activeFile", nCaseid: "nCaseid", nSectionid: "nSectionid", hightlightMode: "hightlightMode" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [["embeddedIframe", ""], [1, "flex", "items-center", "w-screen", "h-[50px]", "overflow-hidden", "bg-gradient-to-br", "from-[#263244]", "to-[#7DBAFF]", "ps-2.5"], [1, "max-w-[calc(100%_-_148px)]", "h-full", "flex", "items-end"], [1, "w-full", "h-full"], [1, "flex", "gap-[5px]", "h-10", "items-end", "me-3", "overflow-auto", "mt-4"], [1, "flex", "p-3", "rounded-tr-lg", "bg-white", "items-center", "justify-between", "min-w-36", "w-72", "cursor-pointer"], [1, "text-xs", "truncate", "whitespace-nowrap", "block", "pe-2"], ["name", "close", 1, "text-xxs"], [1, "isIcon", "cursor-pointer", 2, "--fontfam", "comnicn"], [1, "sr-only"], ["id", "embedded", 2, "height", "100%", "width", "100%", 3, "src"], [1, "h-full", "bg-white", "grid", "place-items-center", "transition-all", "ms-auto", "w-[50%]"], [1, "flex", "flex-col", "items-center", "justify-center"], ["width", "25px", "src", "../../../../assets/icons/failed.svg", 1, "mb-2.5"], [1, "text-sred", "text-base", "font-semibold", "opacity-50", "mb-0.5"], [1, "text-xs", "opacity-50", "text-sred"]], template: function PreviewPageRangeComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, PreviewPageRangeComponent_Conditional_0_Template, 2, 1)(1, PreviewPageRangeComponent_Conditional_1_Template, 1, 0);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.isLoaded ? 0 : 1);
      }
    }, dependencies: [IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PreviewPageRangeComponent, { className: "PreviewPageRangeComponent", filePath: "src\\app\\shared\\components\\myfiles\\preview-page-range\\preview-page-range.component.ts", lineNumber: 14 });
})();

// src/app/shared/components/myfiles/page-link-tool/page-link-tool.component.ts
function PageLinkToolComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-radio-group", 1);
    \u0275\u0275twoWayListener("ngModelChange", function PageLinkToolComponent_Conditional_1_Template_mat_radio_group_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.linkType, $event) || (ctx_r1.linkType = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(1, "mat-radio-button", 2)(2, "span", 3);
    \u0275\u0275text(3, " Current Page");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "mat-radio-button", 4)(5, "span", 3);
    \u0275\u0275text(6, "Page range ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "mat-radio-button", 5)(8, "span", 3);
    \u0275\u0275text(9, "Document");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(10, "btn", 6);
    \u0275\u0275listener("click", function PageLinkToolComponent_Conditional_1_Template_btn_click_10_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.submit());
    });
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.linkType);
    \u0275\u0275advance(11);
    \u0275\u0275textInterpolate(ctx_r1.linkType == "P" ? "Open" : "Apply");
  }
}
function PageLinkToolComponent_Conditional_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "page-range-tool", 10);
    \u0275\u0275twoWayListener("pageRangeSelectorChange", function PageLinkToolComponent_Conditional_2_Conditional_2_Template_page_range_tool_pageRangeSelectorChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.pageRangeSelector, $event) || (ctx_r1.pageRangeSelector = $event);
      return \u0275\u0275resetView($event);
    })("enablePageRangeChange", function PageLinkToolComponent_Conditional_2_Conditional_2_Template_page_range_tool_enablePageRangeChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.enablePageRange, $event) || (ctx_r1.enablePageRange = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("onPageRangeToolEvent", function PageLinkToolComponent_Conditional_2_Conditional_2_Template_page_range_tool_onPageRangeToolEvent_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPageRangeToolEvent($event));
    })("onEmitEvent", function PageLinkToolComponent_Conditional_2_Conditional_2_Template_page_range_tool_onEmitEvent_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onEmitEvent($event));
    });
    \u0275\u0275twoWayListener("pageRangeTextSelectionDataChange", function PageLinkToolComponent_Conditional_2_Conditional_2_Template_page_range_tool_pageRangeTextSelectionDataChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.pageRangeTextSelectionData, $event) || (ctx_r1.pageRangeTextSelectionData = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275twoWayProperty("pageRangeSelector", ctx_r1.pageRangeSelector)("enablePageRange", ctx_r1.enablePageRange);
    \u0275\u0275property("isIframe", true);
    \u0275\u0275twoWayProperty("pageRangeTextSelectionData", ctx_r1.pageRangeTextSelectionData);
  }
}
function PageLinkToolComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "preview-page-range", 7);
    \u0275\u0275elementStart(1, "div", 8);
    \u0275\u0275template(2, PageLinkToolComponent_Conditional_2_Conditional_2_Template, 1, 4, "page-range-tool", 9);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("activeFile", ctx_r1.activeFile)("nCaseid", ctx_r1.nCaseid)("nSectionid", ctx_r1.nSectionid)("hightlightMode", ctx_r1.hightlightMode);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, ctx_r1.pageRangeSelector ? 2 : -1);
  }
}
var PageLinkToolComponent = class _PageLinkToolComponent {
  constructor(cdr) {
    this.cdr = cdr;
    this.linkType = "C";
    this.confirmcancel = false;
    this.pageToolEventEmitter = new EventEmitter();
    this.enablePageRange = false;
    this.pageRangeSelector = null;
  }
  submit() {
    return __async(this, null, function* () {
      if (this.linkType == "P") {
        this.pageRangeSelector = { cPage: this.activeFile?.cPage };
        this.enablePageRange = true;
        this.cdr.detectChanges();
      } else {
        this.pageToolEventEmitter.emit({ event: "DIRECT-LINK", data: { linkType: this.linkType } });
      }
    });
  }
  close() {
    this.pageToolEventEmitter.emit({ event: "CLOSE", data: null });
  }
  onPageRangeToolEvent(event) {
    this.pageToolEventEmitter.emit({ event: "DIRECT-LINK", data: { linkType: event.linkType, start: event.startPage, end: event.endPage } });
  }
  onEmitEvent(e) {
    this.pageToolEventEmitter.emit(e);
  }
  static {
    this.\u0275fac = function PageLinkToolComponent_Factory(t) {
      return new (t || _PageLinkToolComponent)(\u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PageLinkToolComponent, selectors: [["page-link-tool"]], inputs: { activeFile: "activeFile", nCaseid: "nCaseid", nSectionid: "nSectionid", hightlightMode: "hightlightMode", pageRangeTextSelectionData: "pageRangeTextSelectionData" }, outputs: { pageToolEventEmitter: "pageToolEventEmitter" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 3, vars: 2, consts: [[1, "flex", "absolute", "bottom-0", "gap-1", "w-full", "h-[70px]", "items-center", "bg-black", "text-white", "px-5", "text-xs"], [1, "flex", "gap-2", 3, "ngModelChange", "ngModel"], ["value", "C"], [1, "text-white"], ["value", "P"], ["value", "D"], [1, "text-blue", "ms-auto", 3, "click"], [1, "block", "fixed", "top-1/2", "left-1/2", "-translate-x-1/2", "-translate-y-1/2", "w-[calc(90vw+1px)]", "h-[calc(90vh+1px)]", "rounded-base", "overflow-hidden", "z-[998]", 3, "activeFile", "nCaseid", "nSectionid", "hightlightMode"], [1, "inline-block", "h-fit", "fixed", "bottom-[2vw]", "left-1/2", "-translate-x-1/2", "w-[90vw]", "rounded-b-base", "overflow-hidden", "z-[998]"], [3, "pageRangeSelector", "enablePageRange", "isIframe", "pageRangeTextSelectionData"], [3, "pageRangeSelectorChange", "enablePageRangeChange", "onPageRangeToolEvent", "onEmitEvent", "pageRangeTextSelectionDataChange", "pageRangeSelector", "enablePageRange", "isIframe", "pageRangeTextSelectionData"]], template: function PageLinkToolComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275template(1, PageLinkToolComponent_Conditional_1_Template, 12, 2);
        \u0275\u0275elementEnd();
        \u0275\u0275template(2, PageLinkToolComponent_Conditional_2_Template, 3, 5);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275conditional(1, !ctx.confirmcancel ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.enablePageRange ? 2 : -1);
      }
    }, dependencies: [MatRadioModule, MatRadioGroup, MatRadioButton, ButtonComponent, FormsModule, NgControlStatus, NgModel, PreviewPageRangeComponent, PageRangeToolComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PageLinkToolComponent, { className: "PageLinkToolComponent", filePath: "src\\app\\shared\\components\\myfiles\\page-link-tool\\page-link-tool.component.ts", lineNumber: 20 });
})();

// src/app/shared/components/myfiles/preview/preview.component.ts
var _c0 = ["embeddedIframe"];
var PreviewComponent_Conditional_1_Conditional_5_Defer_2_DepsFn = () => [import("./chunk-7FI3Q4W2.js").then((m) => m.SelectedDocsComponent)];
var _c1 = (a0) => ({ "bg-blue-deactivate text-blue-deactivate": a0 });
var _c2 = (a0) => ({ "ms-auto": a0 });
function PreviewComponent_Conditional_0_div_7_iframe_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "iframe", 12);
    \u0275\u0275listener("dblclick", function PreviewComponent_Conditional_0_div_7_iframe_1_Template_iframe_dblclick_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.openPdfInNewTab());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("src", ctx_r1.cPath, \u0275\u0275sanitizeResourceUrl);
  }
}
function PreviewComponent_Conditional_0_div_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275template(1, PreviewComponent_Conditional_0_div_7_iframe_1_Template, 1, 1, "iframe", 11);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.cPath);
  }
}
function PreviewComponent_Conditional_0_div_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13);
    \u0275\u0275element(1, "span", 14);
    \u0275\u0275elementEnd();
  }
}
function PreviewComponent_Conditional_0_div_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15);
    \u0275\u0275text(1, "No PDF available");
    \u0275\u0275elementEnd();
  }
}
function PreviewComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "div", 3)(2, "span", 4);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "button", 5);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_0_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.close());
    });
    \u0275\u0275text(5, "Close");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 6);
    \u0275\u0275template(7, PreviewComponent_Conditional_0_div_7_Template, 2, 1, "div", 7)(8, PreviewComponent_Conditional_0_div_8_Template, 2, 0, "div", 8)(9, PreviewComponent_Conditional_0_div_9_Template, 2, 0, "div", 9);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275propertyInterpolate("title", (ctx_r1.sidebarSingleFile == null ? null : ctx_r1.sidebarSingleFile.cFilename) || (ctx_r1.sidebarSingleFile == null ? null : ctx_r1.sidebarSingleFile.cFileName));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", (ctx_r1.sidebarSingleFile == null ? null : ctx_r1.sidebarSingleFile.cFilename) || (ctx_r1.sidebarSingleFile == null ? null : ctx_r1.sidebarSingleFile.cFileName) || "Source Document", " ");
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", ctx_r1.cPath);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isLoading);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.cPath && !ctx_r1.isLoading && ctx_r1.isLoaded);
  }
}
function PreviewComponent_Conditional_1_Conditional_1_For_3_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 30);
  }
}
function PreviewComponent_Conditional_1_Conditional_1_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 27);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_1_For_3_Template_div_click_0_listener() {
      const ctx_r5 = \u0275\u0275restoreView(_r5);
      const x_r7 = ctx_r5.$implicit;
      const $index_r8 = ctx_r5.$index;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.changeFile($index_r8, x_r7));
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_1_For_3_Template_div_keydown_enter_0_listener() {
      const ctx_r8 = \u0275\u0275restoreView(_r5);
      const x_r7 = ctx_r8.$implicit;
      const $index_r8 = ctx_r8.$index;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.changeFile($index_r8, x_r7));
    });
    \u0275\u0275elementStart(1, "h6", 28)(2, "span", 29);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, PreviewComponent_Conditional_1_Conditional_1_For_3_Conditional_4_Template, 1, 0, "img", 30);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r7 = ctx.$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c1, !x_r7["active"]));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r7.cName ? x_r7.cName : x_r7.cFilename, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(4, x_r7.cFiletype != "PDF" ? 4 : -1);
  }
}
function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_0_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 31);
    \u0275\u0275element(1, "icon", 32);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "mat-menu", 33, 0)(4, "div", 34)(5, "div", 35);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_0_Conditional_0_Template_div_click_5_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.viewSelection = true);
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_0_Conditional_0_Template_div_keydown_enter_5_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.viewSelection = true);
    });
    \u0275\u0275elementStart(6, "span");
    \u0275\u0275text(7, "Expand to view open tabs");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "div", 35);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_0_Conditional_0_Template_div_click_8_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.sharebundles());
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_0_Conditional_0_Template_div_keydown_enter_8_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.sharebundles());
    });
    \u0275\u0275elementStart(9, "span");
    \u0275\u0275text(10, "Share open tabs");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275element(11, "div");
  }
  if (rf & 2) {
    const options_r11 = \u0275\u0275reference(3);
    \u0275\u0275property("square", true)("matMenuTriggerFor", options_r11);
  }
}
function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_0_Conditional_0_Template, 12, 2);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275conditional(0, !ctx_r1.isIndividual ? 0 : -1);
  }
}
function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 37);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_1_Conditional_0_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.openmodal("ASSIGN_PROPERTIES"));
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_1_Conditional_0_Template_btn_keydown_enter_0_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.openmodal("ASSIGN_PROPERTIES"));
    });
    \u0275\u0275element(1, "icon", 38);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("square", true)("ngClass", \u0275\u0275pureFunction1(2, _c2, ctx_r1.viewlist.length == 1));
  }
}
function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_1_Conditional_0_Template, 2, 4, "btn", 36);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275conditional(0, !ctx_r1.isIndividual ? 0 : -1);
  }
}
function PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_0_Template, 1, 1)(1, PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Conditional_1_Template, 1, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275conditional(0, ctx_r1.viewlist.length > 1 ? 0 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r1.isadmin && ctx_r1.isPropertiesPermission ? 1 : -1);
  }
}
function PreviewComponent_Conditional_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17)(1, "div", 22);
    \u0275\u0275repeaterCreate(2, PreviewComponent_Conditional_1_Conditional_1_For_3_Template, 5, 5, "div", 23, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, PreviewComponent_Conditional_1_Conditional_1_Conditional_4_Template, 2, 2);
    \u0275\u0275elementStart(5, "mat-menu", 24, 0)(7, "div", 25)(8, "div", 26);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_1_Template_div_click_8_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openmodal("ASSIGN_VIEW"));
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_1_Template_div_keydown_enter_8_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openmodal("ASSIGN_VIEW"));
    });
    \u0275\u0275elementStart(9, "span");
    \u0275\u0275text(10, "View ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 26);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_1_Template_div_click_11_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openmodal("ASSIGN_PROPERTIES"));
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_1_Template_div_keydown_enter_11_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openmodal("ASSIGN_PROPERTIES"));
    });
    \u0275\u0275elementStart(12, "span");
    \u0275\u0275text(13, "Assign");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.viewlist);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(4, !ctx_r1.previewMode ? 4 : -1);
  }
}
function PreviewComponent_Conditional_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 39);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_2_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.ClsoePreview());
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_2_Template_div_keydown_enter_0_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.ClsoePreview());
    });
    \u0275\u0275element(1, "icon", 40);
    \u0275\u0275elementEnd();
  }
}
function PreviewComponent_Conditional_1_Conditional_3_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "iframe", 42, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275classProp("isLink", ctx_r1.isLink);
    \u0275\u0275property("src", ctx_r1.cPath, \u0275\u0275sanitizeResourceUrl);
  }
}
function PreviewComponent_Conditional_1_Conditional_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 43)(1, "icon", 44);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_3_Conditional_1_Template_icon_click_1_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.closeRealtimePdf());
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_3_Conditional_1_Template_icon_keydown_enter_1_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.closeRealtimePdf());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(2, "div", 45)(3, "div", 46);
    \u0275\u0275element(4, "img", 47);
    \u0275\u0275elementStart(5, "h6", 48);
    \u0275\u0275text(6, "File not found");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "h6", 49);
    \u0275\u0275text(8, "please close this pdf & load again");
    \u0275\u0275elementEnd()()();
  }
}
function PreviewComponent_Conditional_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PreviewComponent_Conditional_1_Conditional_3_Conditional_0_Template, 2, 3, "iframe", 41)(1, PreviewComponent_Conditional_1_Conditional_3_Conditional_1_Template, 9, 0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, ctx_r1.cPath ? 0 : 1);
  }
}
function PreviewComponent_Conditional_1_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function PreviewComponent_Conditional_1_Conditional_5_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 50)(1, "div", 51);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_5_Defer_0_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.viewSelection = false);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 52)(3, "selected-docs", 53);
    \u0275\u0275listener("close", function PreviewComponent_Conditional_1_Conditional_5_Defer_0_Template_selected_docs_close_3_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.viewSelection = false);
    })("OnSave", function PreviewComponent_Conditional_1_Conditional_5_Defer_0_Template_selected_docs_OnSave_3_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.OnSelected($event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275property("viewlist", ctx_r1.viewlist)("isLink", ctx_r1.isLink);
  }
}
function PreviewComponent_Conditional_1_Conditional_5_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " loading... ");
  }
}
function PreviewComponent_Conditional_1_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PreviewComponent_Conditional_1_Conditional_5_Defer_0_Template, 4, 2)(1, PreviewComponent_Conditional_1_Conditional_5_DeferPlaceholder_1_Template, 1, 0);
    \u0275\u0275defer(2, 0, PreviewComponent_Conditional_1_Conditional_5_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r1.viewSelection);
  }
}
function PreviewComponent_Conditional_1_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "page-link-tool", 54);
    \u0275\u0275listener("pageToolEventEmitter", function PreviewComponent_Conditional_1_Conditional_6_Template_page_link_tool_pageToolEventEmitter_0_listener($event) {
      \u0275\u0275restoreView(_r16);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.handlePageToolLinkEvent($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("activeFile", ctx_r1.activeFile)("nCaseid", ctx_r1.nCaseid)("hightlightMode", ctx_r1.isLink)("nSectionid", ctx_r1.nSectionid)("pageRangeTextSelectionData", ctx_r1.pageRangeTextSelectionData);
  }
}
function PreviewComponent_Conditional_1_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 20);
    \u0275\u0275element(1, "img", 55);
    \u0275\u0275elementStart(2, "span", 56);
    \u0275\u0275text(3, " Please convert this file to PDF format to access other features in eTabella ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 57);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_7_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r17);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.hidemsg = true);
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_7_Template_icon_keydown_enter_4_listener() {
      \u0275\u0275restoreView(_r17);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.hidemsg = true);
    });
    \u0275\u0275elementEnd()();
  }
}
function PreviewComponent_Conditional_1_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 21);
    \u0275\u0275element(1, "icon", 58);
    \u0275\u0275elementStart(2, "div")(3, "span", 56);
    \u0275\u0275text(4, " Download the file in native format or open in new tab ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 59)(6, "span", 60);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_8_Template_span_click_6_listener() {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.downloadFile(ctx_r1.activeFile == null ? null : ctx_r1.activeFile.cPath, ctx_r1.currentFiletype.cName ? ctx_r1.currentFiletype.cName : ctx_r1.currentFiletype.cFilename));
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_8_Template_span_keydown_enter_6_listener() {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.downloadFile(ctx_r1.activeFile == null ? null : ctx_r1.activeFile.cPath, ctx_r1.currentFiletype.cName ? ctx_r1.currentFiletype.cName : ctx_r1.currentFiletype.cFilename));
    });
    \u0275\u0275text(7, "Download");
    \u0275\u0275elementEnd();
    \u0275\u0275text(8, "\xA0/\xA0");
    \u0275\u0275elementStart(9, "span", 61);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_8_Template_span_click_9_listener() {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openInOfficeViewer(ctx_r1.activeFile == null ? null : ctx_r1.activeFile.cPath));
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_8_Template_span_keydown_enter_9_listener() {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openInOfficeViewer(ctx_r1.activeFile == null ? null : ctx_r1.activeFile.cPath));
    });
    \u0275\u0275text(10, "Open in new browser tab");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "icon", 57);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_8_Template_icon_click_11_listener() {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.hidemsg = true);
    })("keydown.enter", function PreviewComponent_Conditional_1_Conditional_8_Template_icon_keydown_enter_11_listener() {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.hidemsg = true);
    });
    \u0275\u0275elementEnd()();
  }
}
function PreviewComponent_Conditional_1_Conditional_9_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 62)(1, "div", 63);
    \u0275\u0275listener("click", function PreviewComponent_Conditional_1_Conditional_9_Defer_0_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r19);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.viewChoosen = false);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 64)(3, "selected-docs", 65);
    \u0275\u0275listener("close", function PreviewComponent_Conditional_1_Conditional_9_Defer_0_Template_selected_docs_close_3_listener() {
      \u0275\u0275restoreView(_r19);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.viewChoosen = false);
    })("OnSave", function PreviewComponent_Conditional_1_Conditional_9_Defer_0_Template_selected_docs_OnSave_3_listener($event) {
      \u0275\u0275restoreView(_r19);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.OnSelected($event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275property("viewlist", ctx_r1.selectedDocuments)("isLink", ctx_r1.isLink);
  }
}
function PreviewComponent_Conditional_1_Conditional_9_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function PreviewComponent_Conditional_1_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PreviewComponent_Conditional_1_Conditional_9_Defer_0_Template, 4, 2)(1, PreviewComponent_Conditional_1_Conditional_9_DeferPlaceholder_1_Template, 1, 0);
    \u0275\u0275defer(2, 0, PreviewComponent_Conditional_1_Conditional_5_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r1.viewChoosen);
  }
}
function PreviewComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16);
    \u0275\u0275template(1, PreviewComponent_Conditional_1_Conditional_1_Template, 14, 1, "div", 17)(2, PreviewComponent_Conditional_1_Conditional_2_Template, 2, 0, "div", 18)(3, PreviewComponent_Conditional_1_Conditional_3_Template, 2, 1)(4, PreviewComponent_Conditional_1_Conditional_4_Template, 1, 0)(5, PreviewComponent_Conditional_1_Conditional_5_Template, 4, 1)(6, PreviewComponent_Conditional_1_Conditional_6_Template, 1, 5, "page-link-tool", 19)(7, PreviewComponent_Conditional_1_Conditional_7_Template, 5, 0, "div", 20)(8, PreviewComponent_Conditional_1_Conditional_8_Template, 12, 0, "div", 21)(9, PreviewComponent_Conditional_1_Conditional_9_Template, 4, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r1.isRealtime ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ctx_r1.previewMode ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r1.isLoaded ? 3 : 4);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(5, ctx_r1.viewSelection ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(6, ctx_r1.isLink ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(7, !ctx_r1.isActiveFileSupported() && (ctx_r1.activeFile == null ? null : ctx_r1.activeFile.cFiletype) != "PDF" && !ctx_r1.hidemsg && ctx_r1.isLoaded && ctx_r1.activeFile && !ctx_r1.isRealtime ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(8, ctx_r1.isActiveFileSupported() && (ctx_r1.activeFile == null ? null : ctx_r1.activeFile.cFiletype) != "PDF" && !ctx_r1.hidemsg && ctx_r1.isLoaded && !ctx_r1.isRealtime ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(9, ctx_r1.viewChoosen ? 9 : -1);
  }
}
var PreviewComponent = class _PreviewComponent {
  openPdfInNewTab() {
    const detail = this.sidebarSingleFile || this.activeFile;
    let page = 1;
    let nFSid = detail?.nFSid || detail?.jLinktype?.nFSid || null;
    const selectedText = detail?.jOTexts || detail?.jOT || detail?.jTexts || null;
    if (selectedText && detail?.nBundledetailid) {
      try {
        localStorage.setItem(`pdf_selected_text_${detail.nBundledetailid}`, JSON.stringify(selectedText));
      } catch (e) {
      }
    }
    if (detail?.jLinktype) {
      if (detail.jLinktype?.nPage) {
        page = detail.jLinktype.nPage;
      } else if (detail.jLinktype?.pages?.length) {
        page = detail.jLinktype.pages[0];
      } else if (detail.jLinktype?.start > 1) {
        page = detail.jLinktype.start;
      }
    }
    if (detail?.nBundledetailid && this.nCaseid) {
      this.cf.openHyperLinkFile(detail.nBundledetailid, this.nCaseid, null, null, false, page, null, nFSid);
    }
  }
  constructor(myfileS, individualService, cdr, cf, SSservice, broadCastService, tost, pdfData) {
    this.myfileS = myfileS;
    this.individualService = individualService;
    this.cdr = cdr;
    this.cf = cf;
    this.SSservice = SSservice;
    this.broadCastService = broadCastService;
    this.tost = tost;
    this.pdfData = pdfData;
    this.isMyfile = false;
    this.viewlist = [];
    this.changeP = false;
    this.isLink = null;
    this.selectedDocuments = [];
    this.isChooser = false;
    this.nPage = 1;
    this.previewMode = false;
    this.OnFileSelected = new EventEmitter();
    this.changePreview = new EventEmitter();
    this.OnEvent = new EventEmitter();
    this.isRealtime = false;
    this.tabBox = null;
    this.isadmin = false;
    this.isIndividual = false;
    this.sidebarSingleFile = null;
    this.viewSelection = false;
    this.confirmcancel = false;
    this.nonsupport = false;
    this.hidemsg = false;
    this.isSaving = false;
    this.presentSession = null;
    this.viewChoosen = false;
    this.isLoaded = false;
    this.openedWindow = null;
    this.activePage = 1;
    this.isPropertiesPermission = true;
    this.OnCloseEvent = new EventEmitter();
    this.onPdf = (event) => {
      try {
        if (event.origin !== globalThis.location.origin || !event.data?.identity) {
          return;
        }
        const msgEvent = event.data?.message?.event;
        if (msgEvent === PdfEvents.CLOSE_REALTIME) {
          this.OnEvent.emit(event.data?.message);
          return;
        }
        if (msgEvent === PdfEvents.SHARE) {
          const ind = this.viewlist.findIndex((view) => view.nBundledetailid === this.activeFile?.nBundledetailid);
          if (ind > -1) {
            this.OnEvent.emit({ event: PdfEvents.SHARE, data: this.activeFile.nBundledetailid, nBundleid: this.viewlist[ind].nBundleid });
          }
          return;
        }
        if (this.isRealtime) {
          const data = event.data.message;
          if (data.event === PdfEvents.OPEN_INDIVIDUAL) {
            this.cf.openHyperLinkFile(event.data.identity, this.nCaseid, null, null, null, data?.data?.nPageno || this.nPage || 1, null, null, null, null, this.activesectiontype);
          } else if (data.event === PdfEvents.OPEN_HYPERLINK_FILE) {
            this.cf.openHyperLinkFile(data.data.nBundledetailid, this.nCaseid, null, data?.data?.nPageno || this.nPage || 1);
          }
        }
        const index = this.viewlist.findIndex((a) => a.nBundledetailid === event.data.identity);
        if (index === -1)
          return;
        const x = this.viewlist[index];
        if (x) {
          const data = event.data.message;
          if (data.event === "LINK-ADDED-DOC") {
            if (data.data?.texts?.length && data.data.texts[0] !== "") {
              this.pageRangeTextSelection(data.data);
            } else if (data.data) {
              this.pageRangeTextSelection(data.data);
            } else {
              this.pageRangeTextSelection(null);
            }
          } else if (data.event === PdfEvents.OPEN_INDIVIDUAL) {
            if (this.isMyfile) {
              this.cf.openHyperLinkFile(x.nBundledetailid, this.nCaseid, null, data?.data?.jFilter, x.cIsindex, this.nPage);
            }
            if (this.isChooser && !this.isLink) {
              this.openDocumentInChooser(x);
            }
            if (this.sidebarSingleFile) {
              this.openPdfInNewTab();
            }
          } else if (data.event === PdfEvents.OPEN_HYPERLINK_FILE) {
            this.tost.error("Tip: Open Master Index in full tab to use hyperlinks.");
          }
          if (data.event === PdfEvents.CURRENT_PAGE) {
            this.activePage = data?.data?.currentPage;
          }
        }
      } catch (error) {
        console.error("Error in onPdf handler:", error);
      }
    };
    this.isLoading = false;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.isLoading = true;
      if (this.sidebarSingleFile) {
        this.viewlist = [this.sidebarSingleFile];
        this.viewlist[0]["active"] = true;
        yield this.activeFiledata();
      }
      if (this.isRealtime) {
        if (this.tabBox && this.tabBox.cTab) {
          this.activeFiledata();
        }
      }
      this.updatePath();
      if (this.isLink == "F" || this.isLink == "D") {
        this.hidemsg = true;
      }
    });
  }
  openDocumentInChooser(x) {
    return __async(this, null, function* () {
      const files = yield this.individualService.getTabinfo([x.nBundledetailid]);
      this.OnFileSelected.emit(files);
    });
  }
  ngOnDestroy() {
    this.activeFile = null;
    this.cf.openedWindow = null;
  }
  ngAfterViewInit() {
  }
  changePdfFile(tabBox) {
    return __async(this, null, function* () {
      if (this.tabBox && this.tabBox.cTab) {
        try {
          this.isLoading = true;
          this.cdr.detectChanges();
          this.activeFile = yield this.myfileS.getFiledata({ cTab: this.tabBox.cTab, nCaseid: this.nCaseid, cType: this.presentSession ? "P" : "M" });
          if (this.activeFile) {
            this.activeFile.nPage = this.tabBox.nPageno || 0;
            this.updatePath();
            this.sendMessageToIframe({ event: "REALTIME-CHANGE-PDF", data: this.activeFile });
          }
        } catch (error) {
          console.error("[PREVIEW] changePdfFile failed:", error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }
  ngOnChanges(changes) {
    if (changes["tabBox"]) {
      this.changePdfFile(this.tabBox);
      return;
    }
    if (!changes["viewlist"] && changes["nPage"] && !changes["nPage"].firstChange) {
      this.sendMessageToIframe({ event: "REDIRECT-TO-PAGE", data: { nPage: this.nPage } });
      return;
    }
    this.activeFile = null;
    this.activeFiledata();
  }
  activeFiledata() {
    return __async(this, null, function* () {
      this.isLoading = true;
      let ind = this.viewlist.findIndex((e) => e["active"]);
      if (ind === -1 && this.sidebarSingleFile) {
        ind = 0;
      }
      if (ind > -1) {
        try {
          this.currentFiletype = this.viewlist[ind];
          if (this.tabBox && this.tabBox.cTab) {
            this.activeFile = yield this.myfileS.getFiledata({ cTab: this.tabBox.cTab, nCaseid: this.nCaseid, cType: this.presentSession ? "P" : "M" });
          } else {
            const mdl = { nBundledetailid: this.viewlist[ind].nBundledetailid, cType: this.presentSession ? "P" : "M" };
            const res = yield this.myfileS.getFiledata(mdl);
            res.nBundledetailid = this.viewlist[ind].nBundledetailid;
            this.nPage = this.nPage || this.getPage(this.viewlist[ind].cPageRange);
            this.activeFile = res;
          }
          this.updatePath();
          this.cdr.detectChanges();
        } catch (error) {
          this.isLoading = false;
        }
      }
      this.isLoading = false;
    });
  }
  getPage(pageRange) {
    try {
      const page = Number(pageRange.split("-")[0]);
      return page > 0 ? page : this.nPage;
    } catch (error) {
      return this.nPage;
    }
  }
  changeFile(el, x) {
    const ind = this.viewlist.findIndex((e) => e["active"]);
    if (ind > -1) {
      this.viewlist[ind]["active"] = false;
    }
    this.viewlist[el]["active"] = true;
    this.currentFiletype = x;
    this.nonsupport = this.isActiveFileSupported();
    this.activeFiledata();
    this.hidemsg = true;
  }
  closeView(i) {
    this.viewlist.splice(i, 1);
    this.activeFile = null;
    if (this.viewlist.length) {
      this.activeFile = this.viewlist[0];
      this.viewlist[0]["active"] = true;
      this.currentFiletype = this.viewlist[0];
    }
    this.hidemsg = true;
  }
  ClsoePreview() {
    this.OnEvent.emit({ event: "CLOSE", data: null });
  }
  openmodal(flag) {
    if (flag) {
      this.changePreview.emit(flag);
    }
  }
  OnSelected(e) {
    this.OnFileSelected.emit(e);
    if (this.isMyfile) {
      let ids = e.map((x) => [x["nBundledetailid"], 1]);
      window.open(`${location.origin}/individual/doc/${encodeURIComponent(JSON.stringify([ids, this.nCaseid]))}`);
    }
  }
  updatePath() {
    if (this.activeFile) {
      let page = this.nPage || 1;
      if (this.tabBox) {
        page = this.tabBox.nPageno || 1;
      }
      const filter = this.jFilter?.cSearch && this.jFilter.cWithin == "I" ? JSON.stringify(this.jFilter) : null;
      const path = this.cf.senitizeUrl(this.activeFile.cPath, this.activeFile.nBundledetailid, this.nCaseid, false, null, page, this.isRealtime, null, null, null, null, null, null, null, this.isMyfile, this.activesectiontype, this.nSectionid, null, null, filter);
      if (path != this.cPath) {
        this.cPath = path;
      }
    }
    if (this.cPath) {
      this.isLoaded = true;
      this.isLoading = false;
    }
    this.cdr.detectChanges();
  }
  addDataToSelectedDocs(data) {
    data.jLinktype = { type: data.mode ? data.mode : "F", start: data.start ? data.start : 0, end: data.end ? data.end : 0, pages: data.pages ? [...new Set(data.pages)] : [] };
    const ind = this.selectedDocuments.findIndex((a) => a.nBundledetailid == data.nBundledetailid && (a.mode !== "P" ? a.mode == data.mode : a.mode == data.mode && a.start == data.start && a.end == data.end));
    if (ind == -1) {
      this.selectedDocuments.unshift(data);
    } else {
      this.selectedDocuments[ind] = __spreadValues(__spreadValues({}, this.selectedDocuments[ind]), data);
    }
  }
  closeRealtimePdf() {
    const e = { event: PdfEvents.CLOSE_REALTIME, data: null };
    this.OnEvent.emit(e);
  }
  isActiveFileSupported() {
    if (!this.activeFile?.cFiletype) {
      return false;
    }
    const fileType = this.activeFile.cFiletype.trim().toLowerCase();
    const supportedExtensions = /* @__PURE__ */ new Set([
      "jpeg",
      "jpg",
      "png",
      "gif",
      "bmp",
      "svg",
      "mp4",
      "avi",
      "mov",
      "wmv",
      "flv",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "msg",
      "dwg",
      "xlsm"
    ]);
    const isSupported = supportedExtensions.has(fileType);
    return isSupported;
  }
  downloadFile1(cPath, filename) {
  }
  downloadFile(cPath, filenames) {
    return __async(this, null, function* () {
      try {
        const groupFileName = this.createGroupFileName(filenames);
        const sanitizedFileName = groupFileName.replaceAll(/[<>:"/\\|?*]/g, "_");
        const shortenedFileName = this.shortenFileName(sanitizedFileName, cPath, 50);
        const downloadUrl = `${environment.downloadservice}/download?cPath=${encodeURIComponent(cPath)}&cFilename=${encodeURIComponent(shortenedFileName)}`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.addEventListener("load", () => {
          console.log("Download started");
        });
        link.addEventListener("error", () => {
          console.error("Error downloading file");
        });
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error("Error initiating download:", error);
      }
    });
  }
  createGroupFileName(fileNames) {
    const fileList = fileNames.split(",").map((f) => f.trim());
    if (fileList.length === 1) {
      return fileList[0];
    }
    const firstFileName = fileList[0].split(".")[0];
    const extension = fileList[0].split(".").pop();
    const otherFilesCount = fileList.length - 1;
    let groupName = `${firstFileName} and ${otherFilesCount} other${otherFilesCount > 1 ? "s" : ""}`;
    if (groupName.length > 50) {
      groupName = groupName.substring(0, 47) + "...";
    }
    return `${groupName}.${extension}`;
  }
  sanitizeFileName(fileName) {
    return fileName.replaceAll(/[<>:"/\\|?*]/g, "_");
  }
  ensureFileExtension(path, extension) {
    if (!path.toLocaleUpperCase().endsWith(extension)) {
      return path + extension;
    }
    return path;
  }
  shortenFileName(fileName, cPath, maxLength = 50) {
    let extension = fileName.split(".").pop();
    const pathExtension = cPath.split(".").pop();
    if (extension.toUpperCase() != pathExtension.toUpperCase()) {
      if (pathExtension) {
        extension = pathExtension;
        fileName += `.${extension}`;
      }
    } else if (fileName.split(".").length > 2) {
      const parts = fileName.split(".");
      extension = parts.pop();
      fileName = parts.join(".") + "." + extension;
    } else {
      extension = extension || "";
    }
    const name = fileName.substring(0, fileName.length - extension.length - 1);
    if (name.length + extension.length + 1 <= maxLength) {
      return fileName;
    }
    const halfMax = Math.floor((maxLength - extension.length - 4) / 2);
    const firstHalf = name.slice(0, halfMax);
    const secondHalf = name.slice(-halfMax);
    return `${firstHalf}...${secondHalf}.${extension}`;
  }
  openInOfficeViewer(url) {
    if (/\.(doc|docx|xls|xlsx|ppt|pptx|xlsm)$/i.test(this.activeFile.cPath.toLowerCase())) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${environment.documentStorage}${encodeURIComponent(url)}`;
      window.open(officeViewerUrl, "_blank");
    } else if (/\.(dwg)$/i.test(this.activeFile.cPath.toLowerCase())) {
      this.cf.openHyperLinkFile(this.activeFile.nBundledetailid, this.nCaseid);
    } else if (/\.(msg)$/i.test(this.activeFile.cPath.toLowerCase())) {
      this.cf.openHyperLinkFile(this.activeFile.nBundledetailid, this.nCaseid);
    } else {
      window.open(environment.documentStorage + url, "_blank");
    }
  }
  sendMessageToIframe(data) {
    const iframeElement = this.embeddedIframes.find((iframeRef) => {
      return iframeRef.nativeElement.id === `embedded`;
    });
    if (iframeElement) {
      const iframe = iframeElement.nativeElement;
      iframe.contentWindow.postMessage(data, "*");
    }
  }
  directlink() {
    return __async(this, null, function* () {
      try {
        let selectedFiles = [];
        selectedFiles.push(this.selectedDocuments[0]);
        if (!selectedFiles.length)
          return;
        this.OnFileSelected.emit(selectedFiles);
      } catch (error) {
      }
    });
  }
  sharebundles() {
    return __async(this, null, function* () {
      let shareids = this.viewlist.map((view) => [view.nBundleid, view.nBundledetailid]);
      this.OnEvent.emit({ event: "SHARE", shareids });
    });
  }
  handlePageToolLinkEvent(e) {
    return __async(this, null, function* () {
      if (e.event === PdfEvents.CLOSE) {
        this.close();
      } else if (e.event === PdfEvents.DIRECT_LINK) {
        const res = yield this.pdfData.fetchDocInfo(this.activeFile.nBundledetailid);
        this.activeFile = Object.assign(this.activeFile, res);
        const pages = e.data?.linkType == "C" ? [this.activePage] : e.data?.pages || [];
        try {
          if (e.data?.linkType == "D") {
            if (!e.data)
              e.data = { start: 1, end: 1 };
            if (e.data?.start) {
              e.data.start = 1;
            }
            if (e.data?.end) {
              e.data.end = 1;
            }
            e.data["start"] = res.cPage.split("-")[0];
            e.data["end"] = res.cPage.split("-")[1];
          }
        } catch (error) {
        }
        const data = __spreadProps(__spreadValues({}, this.activeFile), {
          mode: e.data?.linkType,
          start: e.data?.linkType == "C" ? this.activePage : e.data?.start || 1,
          end: e.data?.linkType == "C" ? this.activePage : e.data?.end || 1,
          pages
        });
        this.addDataToSelectedDocs(data);
        this.directlink();
      } else if (e.event === PdfEvents.TEXT_SELECTED) {
        console.log("TEXT-SELECTED", this.pageRangeTextSelectionData);
        const page = this.pageRangeTextSelectionData?.pages[0];
        const data = __spreadProps(__spreadValues({}, this.pageRangeTextSelectionData), {
          mode: this.pageRangeTextSelectionData?.mode,
          start: page,
          end: page
        });
        this.addDataToSelectedDocs(data);
        this.directlink();
      }
    });
  }
  close() {
    this.OnCloseEvent.emit();
  }
  pageRangeTextSelection(data) {
    this.pageRangeTextSelectionData = data;
    this.cdr.detectChanges();
  }
  static {
    this.\u0275fac = function PreviewComponent_Factory(t) {
      return new (t || _PreviewComponent)(\u0275\u0275directiveInject(MyfileService), \u0275\u0275directiveInject(IndividualService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(BroadcastingService), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(PdfDataService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PreviewComponent, selectors: [["preview"]], viewQuery: function PreviewComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.embeddedIframes = _t);
      }
    }, hostBindings: function PreviewComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("message", function PreviewComponent_message_HostBindingHandler($event) {
          return ctx.onPdf($event);
        }, false, \u0275\u0275resolveWindow);
      }
    }, inputs: { isMyfile: "isMyfile", viewlist: "viewlist", changeP: "changeP", nCaseid: "nCaseid", rightpanelwidth: "rightpanelwidth", isLink: "isLink", selectedDocuments: "selectedDocuments", isChooser: "isChooser", nPage: "nPage", nSectionid: "nSectionid", activesectiontype: "activesectiontype", previewMode: "previewMode", isRealtime: "isRealtime", tabBox: "tabBox", isadmin: "isadmin", isIndividual: "isIndividual", sidebarSingleFile: "sidebarSingleFile", jFilter: "jFilter", presentSession: "presentSession", isPropertiesPermission: "isPropertiesPermission" }, outputs: { OnFileSelected: "OnFileSelected", changePreview: "changePreview", OnEvent: "OnEvent", OnCloseEvent: "OnCloseEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [["options", "matMenu"], ["embeddedIframe", ""], [1, "relative", "flex", "flex-col", "h-full", "bg-white", "rounded-base", "w-full"], [1, "flex", "items-center", "justify-between", "px-6", "py-4", "border-b", "border-gray-200"], [1, "font-semibold", "text-lg", "truncate", "max-w-[300px]", 3, "title"], [1, "px-4", "py-1", "bg-gray-200", "text-gray-700", "rounded", "hover:bg-gray-300", "transition", "text-sm", 3, "click"], [1, "flex-1", "overflow-y-auto"], ["class", "pdf-container", "style", "position:relative;width:100%;height:100vh;", 4, "ngIf"], ["class", "flex items-center justify-center h-full", 4, "ngIf"], ["class", "flex items-center justify-center h-full text-gray-400", 4, "ngIf"], [1, "pdf-container", 2, "position", "relative", "width", "100%", "height", "100vh"], ["style", "width:100%;height:100vh;border:0;", "allowfullscreen", "", 3, "src", "dblclick", 4, "ngIf"], ["allowfullscreen", "", 2, "width", "100%", "height", "100vh", "border", "0", 3, "dblclick", "src"], [1, "flex", "items-center", "justify-center", "h-full"], [1, "loader"], [1, "flex", "items-center", "justify-center", "h-full", "text-gray-400"], [1, "relative", "flex", "flex-col", "h-full", "bg-white", "rounded-base"], [1, "flex", "items-center", "gap-2", "pe-2.5", "overflow-hidden"], [1, "absolute", "top-1/4", "flex", "rounded-e-base", "items-center", "justify-end", "bg-blue-on", "h-[46px]", "px-3", "text-white"], [3, "activeFile", "nCaseid", "hightlightMode", "nSectionid", "pageRangeTextSelectionData"], [1, "flex", "absolute", "top-[47px]", "gap-3", "w-full", "h-[70px]", "items-center", "bg-sred", "text-white", "px-5", "text-xs"], [1, "flex", "absolute", "top-[47px]", "gap-3", "w-full", "items-start", "bg-blue-on", "text-white", "px-5", "text-xs", "py-5"], [1, "flex", "items-end", "w-full", "gap-2", "px-2", "overflow-auto"], [1, "w-full", "min-w-32", "py-2.5", "pb-0", "flex", "gap-2", "overflow-visible", "relative", "bg-white", 3, "ngClass"], [1, "!rounded-base", "w-fit"], [1, "flex", "flex-col", "gap-1.5", "px-2", "py-2"], [1, "p-2", "text-xs", "cursor-pointer", "hover:bg-reply", "rounded-base", 3, "click", "keydown.enter"], [1, "w-full", "min-w-32", "py-2.5", "pb-0", "flex", "gap-2", "overflow-visible", "relative", "bg-white", 3, "click", "keydown.enter", "ngClass"], [1, "items-center", "gap-2", "py-3", "px-2.5", "w-full", "flex-1", "flex", "cursor-pointer", "relative", "rounded-tl-base", "shadow-[0_3px_10px_#94949440]"], [1, "block", "w-full", "text-xs", "truncate", "text-truncate"], ["width", "16px", "src", "../../../../../assets/icons/failed.svg", "alt", "Failed icon"], ["mode", "outlined", 1, "ms-auto", 3, "square", "matMenuTriggerFor"], ["name", "menu", 1, "text-lg"], [1, "mt-2", "w-52", "bg-faint", "!rounded-base", "p-2.5"], [1, "w-full", "gap-2", "flex", "flex-col"], [1, "flex", "text-xs", "items-center", "gap-2", "px-3", "w-full", "rounded-base", "h-[30px]", "hover:bg-blue-deactivate", 3, "click", "keydown.enter"], ["mode", "outlined", "matTooltip", "View Metadata and Other Associations", "tabindex", "0", 3, "square", "ngClass"], ["mode", "outlined", "matTooltip", "View Metadata and Other Associations", "tabindex", "0", 3, "click", "keydown.enter", "square", "ngClass"], ["name", "properties", "type", "extra", 1, "text-xl"], [1, "absolute", "top-1/4", "flex", "rounded-e-base", "items-center", "justify-end", "bg-blue-on", "h-[46px]", "px-3", "text-white", 3, "click", "keydown.enter"], ["name", "chvy", 1, "block", "text-xs", "rotate-180"], ["id", "embedded", "title", "PDF Preview", 2, "height", "100%", "width", "100%", 3, "isLink", "src"], ["id", "embedded", "title", "PDF Preview", 2, "height", "100%", "width", "100%", 3, "src"], [1, "flex", "items-center", "justify-end", "bg-dark-blue", "h-[78px]", "px-10", "text-white"], ["name", "close", "tabindex", "0", "type", "comnicn", 1, "block", "text-lg", 3, "click", "keydown.enter"], [1, "h-full", "bg-white", "grid", "place-items-center", "transition-all", "w-full"], [1, "flex", "flex-col", "items-center", "justify-center"], ["width", "25px", "src", "../../../../assets/icons/failed.svg", "alt", "Failed icon", 1, "mb-2.5"], [1, "text-sred", "text-base", "font-semibold", "opacity-50", "mb-0.5"], [1, "text-xs", "opacity-50", "text-sred"], [1, "absolute", "top-0", "grid", "w-full", "h-full", "p-10", "overflow-hidden", "place-items-center"], [1, "absolute", "top-0", "left-0", "z-10", "w-full", "h-full", "backdrop", "bg-black/35", 3, "click"], [1, "relative", "z-20", "w-full", "h-full"], [3, "close", "OnSave", "viewlist", "isLink"], [3, "pageToolEventEmitter", "activeFile", "nCaseid", "hightlightMode", "nSectionid", "pageRangeTextSelectionData"], ["src", "../../../../../assets/icons/failedwhite.svg", "alt", "Failed icon"], [1, "text-sm", "font-semibold"], ["tabindex", "0", "name", "close", 1, "cursor-pointer", "text-xxs", 3, "click", "keydown.enter"], ["name", "info", 1, "text-lg", "text-white"], [1, "mt-2", "text-xs", "text-white"], [1, "text-xs", "text-white", "underline", "cursor-pointer", 3, "click", "keydown.enter"], [1, "text-white", "underline", "cursor-pointer", "titleN", 3, "click", "keydown.enter"], [1, "fixed", "top-0", "left-0", "grid", "w-full", "h-full", "p-10", "overflow-hidden", "place-items-center"], [1, "absolute", "top-0", "left-0", "z-10", "w-full", "h-full", "backdrop", "bg-black/40", 3, "click"], [1, "relative", "z-20", "max-w-[420px]", "min-w-[420px]", "flex", "items-center", "justify-center", "m-auto", "h-full", "w-[420px]"], [1, "w-full", 3, "close", "OnSave", "viewlist", "isLink"]], template: function PreviewComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, PreviewComponent_Conditional_0_Template, 10, 5, "div", 2)(1, PreviewComponent_Conditional_1_Template, 10, 8);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.sidebarSingleFile ? 0 : 1);
      }
    }, dependencies: [CommonModule, NgClass, NgIf, ButtonComponent, IconComponent, MatMenuModule, MatMenu, MatMenuTrigger, MatTooltipModule, MatTooltip, PageLinkToolComponent], styles: ["\n\n.pdf-container[_ngcontent-%COMP%] {\n  position: relative;\n}\n/*# sourceMappingURL=preview.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PreviewComponent, { className: "PreviewComponent", filePath: "src\\app\\shared\\components\\myfiles\\preview\\preview.component.ts", lineNumber: 32 });
})();

export {
  PreviewComponent
};
//# sourceMappingURL=chunk-Z7MN3PNP.js.map
