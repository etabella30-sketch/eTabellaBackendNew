import {
  SearchService,
  ToolbarComponent
} from "./chunk-UI3KRWEQ.js";
import {
  SelectionActionsService
} from "./chunk-FW6JNL2T.js";
import {
  TranscriptService
} from "./chunk-2VIGWAD6.js";
import {
  EmptyComponent
} from "./chunk-DHVW7RW5.js";
import {
  FeedIndexService,
  TranscriptRendererService
} from "./chunk-62ZTKIF6.js";
import {
  AnnotsService,
  FeedDisplayService,
  FeedUtilityService,
  RealtimeService,
  annotTrasnferService
} from "./chunk-SD32Y426.js";
import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel,
  NgSelectOption,
  SelectControlValueAccessor,
  ɵNgSelectMultipleOption
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ScrollingModule
} from "./chunk-MESCMVD2.js";
import {
  DomSanitizer
} from "./chunk-FNSUDMGC.js";
import {
  CommonModule,
  DatePipe
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  __spreadProps,
  __spreadValues,
  effect,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
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
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate3,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/rt/components/transcript-viewer/transcript-toolbar/transcript-toolbar.component.ts
function TranscriptToolbarComponent_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "button", 23);
    \u0275\u0275listener("click", function TranscriptToolbarComponent_Conditional_17_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onZoomIn());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 24);
    \u0275\u0275element(3, "circle", 25)(4, "line", 26)(5, "line", 27)(6, "line", 28);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "button", 29);
    \u0275\u0275listener("click", function TranscriptToolbarComponent_Conditional_17_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onZoomOut());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(8, "svg", 24);
    \u0275\u0275element(9, "circle", 25)(10, "line", 26)(11, "line", 28);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(12, "span", 30);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(13);
    \u0275\u0275textInterpolate1("", ctx_r1.zoomLevel, "%");
  }
}
function TranscriptToolbarComponent_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 31);
    \u0275\u0275listener("click", function TranscriptToolbarComponent_Conditional_18_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleSearch());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 24);
    \u0275\u0275element(2, "circle", 25)(3, "line", 26);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275classProp("bg-blue-50", ctx_r1.searchOpen)("border-blue-300", ctx_r1.searchOpen);
  }
}
function TranscriptToolbarComponent_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "input", 32);
    \u0275\u0275twoWayListener("ngModelChange", function TranscriptToolbarComponent_Conditional_19_Template_input_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.searchTerm, $event) || (ctx_r1.searchTerm = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function TranscriptToolbarComponent_Conditional_19_Template_input_keyup_enter_1_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onSearch());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "button", 33);
    \u0275\u0275listener("click", function TranscriptToolbarComponent_Conditional_19_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onSearch());
    });
    \u0275\u0275text(3, "Find");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "button", 34);
    \u0275\u0275listener("click", function TranscriptToolbarComponent_Conditional_19_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleSearch());
    });
    \u0275\u0275text(5, "Close");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.searchTerm);
  }
}
function TranscriptToolbarComponent_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 35);
    \u0275\u0275listener("click", function TranscriptToolbarComponent_Conditional_21_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onToggleTimestamps());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 36);
    \u0275\u0275element(2, "circle", 37)(3, "polyline", 38);
    \u0275\u0275elementEnd();
    \u0275\u0275text(4, " Timestamps ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275classProp("bg-blue-50", ctx_r1.showTimestamps)("border-blue-300", ctx_r1.showTimestamps);
  }
}
function TranscriptToolbarComponent_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17)(1, "button", 39);
    \u0275\u0275listener("click", function TranscriptToolbarComponent_Conditional_22_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onExportPdf());
    });
    \u0275\u0275text(2, "PDF");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 39);
    \u0275\u0275listener("click", function TranscriptToolbarComponent_Conditional_22_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onExportDocx());
    });
    \u0275\u0275text(4, "DOCX");
    \u0275\u0275elementEnd()();
  }
}
var TOOLBAR_CONFIGS = {
  sidebar: {
    showSearch: true,
    showJumpToPage: true,
    showHighlight: true,
    showCopy: true,
    showExport: false,
    showAnnotations: false,
    showZoom: false,
    showFilter: false,
    showVersionSelector: false,
    showTimestampToggle: true
  },
  full: {
    showSearch: true,
    showJumpToPage: true,
    showHighlight: true,
    showCopy: true,
    showExport: true,
    showAnnotations: true,
    showZoom: true,
    showFilter: true,
    showVersionSelector: true,
    showTimestampToggle: true
  },
  evidence: {
    showSearch: true,
    showJumpToPage: false,
    showHighlight: true,
    showCopy: true,
    showExport: false,
    showAnnotations: false,
    showZoom: false,
    showFilter: false,
    showVersionSelector: false,
    showTimestampToggle: false
  }
};
var TranscriptToolbarComponent = class _TranscriptToolbarComponent {
  constructor() {
    this.mode = "full";
    this.currentPage = 1;
    this.totalPages = 1;
    this.showTimestamps = true;
    this.showLineNumbers = true;
    this.zoomLevel = 100;
    this.toolbarAction = new EventEmitter();
    this.searchTerm = "";
    this.searchOpen = false;
    this.jumpPage = 1;
  }
  get config() {
    return TOOLBAR_CONFIGS[this.mode] || TOOLBAR_CONFIGS["full"];
  }
  onSearch() {
    this.toolbarAction.emit({ action: "search", data: this.searchTerm });
  }
  onJumpToPage() {
    if (this.jumpPage >= 1 && this.jumpPage <= this.totalPages) {
      this.toolbarAction.emit({ action: "jump-to-page", data: this.jumpPage });
    }
  }
  onToggleTimestamps() {
    this.toolbarAction.emit({ action: "toggle-timestamps" });
  }
  onToggleLineNumbers() {
    this.toolbarAction.emit({ action: "toggle-line-numbers" });
  }
  onExportPdf() {
    this.toolbarAction.emit({ action: "export-pdf" });
  }
  onExportDocx() {
    this.toolbarAction.emit({ action: "export-docx" });
  }
  onZoomIn() {
    this.toolbarAction.emit({ action: "zoom-in" });
  }
  onZoomOut() {
    this.toolbarAction.emit({ action: "zoom-out" });
  }
  jumpToFirstPage() {
    this.toolbarAction.emit({ action: "jump-to-page", data: 1 });
  }
  jumpToLastPage() {
    this.toolbarAction.emit({ action: "jump-to-page", data: this.totalPages });
  }
  prevPage() {
    if (this.currentPage > 1) {
      this.toolbarAction.emit({ action: "jump-to-page", data: this.currentPage - 1 });
    }
  }
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.toolbarAction.emit({ action: "jump-to-page", data: this.currentPage + 1 });
    }
  }
  onPageInputChange(event) {
    const input = event.target;
    const page = parseInt(input.value, 10);
    if (page >= 1 && page <= this.totalPages) {
      this.toolbarAction.emit({ action: "jump-to-page", data: page });
    }
  }
  onZoomReset() {
    this.toolbarAction.emit({ action: "zoom-reset" });
  }
  onHighlight() {
    this.toolbarAction.emit({ action: "highlight" });
  }
  onCopy() {
    this.toolbarAction.emit({ action: "copy" });
  }
  onFilter() {
    this.toolbarAction.emit({ action: "filter" });
  }
  onAnnotations() {
    this.toolbarAction.emit({ action: "annotations" });
  }
  toggleSearch() {
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchTerm = "";
      this.onSearch();
    }
  }
  static {
    this.\u0275fac = function TranscriptToolbarComponent_Factory(t) {
      return new (t || _TranscriptToolbarComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TranscriptToolbarComponent, selectors: [["transcript-toolbar"]], inputs: { mode: "mode", currentPage: "currentPage", totalPages: "totalPages", showTimestamps: "showTimestamps", showLineNumbers: "showLineNumbers", zoomLevel: "zoomLevel" }, outputs: { toolbarAction: "toolbarAction" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 28, vars: 6, consts: [[1, "relative", "z-20", "flex", "items-center", "h-[50px]", "bg-white", "px-2.5", "justify-between"], [1, "flex", "items-center", "gap-x-2"], [1, "flex", "items-center", "bg-reply", "px-2", "h-8.5", "rounded-base"], ["title", "First page", 1, "flex", "items-center", "justify-center", "w-6", "h-6", "hover:bg-neutral-200", "rounded", 3, "click"], ["width", "20", "height", "20", "viewBox", "0 0 24 24", 1, "rotate-180"], ["fill", "currentColor", "d", "M5.59,7.41L10.18,12L5.59,16.59L7,18L13,12L7,6L5.59,7.41M16,6H18V18H16V6Z"], ["title", "Previous page", 1, "flex", "items-center", "justify-center", "w-6", "h-6", "hover:bg-neutral-200", "rounded", 3, "click"], ["fill", "currentColor", "d", "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"], ["title", "Next page", 1, "flex", "items-center", "justify-center", "w-6", "h-6", "hover:bg-neutral-200", "rounded", 3, "click"], ["width", "20", "height", "20", "viewBox", "0 0 24 24"], ["title", "Last page", 1, "flex", "items-center", "justify-center", "w-6", "h-6", "hover:bg-neutral-200", "rounded", 3, "click"], [1, "flex", "items-center", "gap-1", "mx-2"], ["type", "text", 1, "w-10", "h-6", "text-center", "text-xs", "border", "border-neutral-300", "rounded", "bg-white", "focus:outline-none", "focus:border-blue-500", 3, "change", "keyup.enter", "value"], [1, "flex", "items-center", "gap-1"], ["title", "Search", 1, "flex", "items-center", "justify-center", "w-7", "h-7", "hover:bg-neutral-100", "rounded", "border", "border-neutral-200", 3, "bg-blue-50", "border-blue-300"], [1, "absolute", "left-1/2", "-translate-x-1/2", "top-full", "z-30", "bg-white", "shadow-lg", "rounded-b-lg", "border", "border-neutral-200", "p-2", "flex", "items-center", "gap-2"], [1, "flex", "items-center", "gap-1.5", "h-8.5", "px-3", "text-xs", "border", "border-neutral-200", "rounded-base", "hover:bg-neutral-50", 3, "bg-blue-50", "border-blue-300"], [1, "flex", "items-center", "border-l", "border-neutral-200", "pl-2", "gap-1"], [1, "flex", "items-center", "justify-center", "w-8.5", "h-8.5", "border", "border-neutral-200", "rounded-base", "hover:bg-neutral-50"], ["width", "16", "height", "16", "viewBox", "0 0 24 24", "fill", "currentColor"], ["cx", "12", "cy", "5", "r", "2"], ["cx", "12", "cy", "12", "r", "2"], ["cx", "12", "cy", "19", "r", "2"], ["title", "Zoom in", 1, "flex", "items-center", "justify-center", "w-7", "h-7", "hover:bg-neutral-100", "rounded", "border", "border-neutral-200", 3, "click"], ["width", "16", "height", "16", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2"], ["cx", "11", "cy", "11", "r", "8"], ["x1", "21", "y1", "21", "x2", "16.65", "y2", "16.65"], ["x1", "11", "y1", "8", "x2", "11", "y2", "14"], ["x1", "8", "y1", "11", "x2", "14", "y2", "11"], ["title", "Zoom out", 1, "flex", "items-center", "justify-center", "w-7", "h-7", "hover:bg-neutral-100", "rounded", "border", "border-neutral-200", 3, "click"], [1, "text-xs", "text-neutral-600", "min-w-[50px]", "text-center"], ["title", "Search", 1, "flex", "items-center", "justify-center", "w-7", "h-7", "hover:bg-neutral-100", "rounded", "border", "border-neutral-200", 3, "click"], ["type", "text", "placeholder", "Search transcript...", "autofocus", "", 1, "px-2", "py-1", "border", "border-neutral-300", "rounded", "text-xs", "w-48", "focus:outline-none", "focus:border-blue-500", 3, "ngModelChange", "keyup.enter", "ngModel"], [1, "text-xs", "px-2", "py-1", "bg-blue-600", "text-white", "rounded", "hover:bg-blue-700", 3, "click"], [1, "text-xs", "px-2", "py-1", "text-neutral-500", "hover:text-neutral-800", 3, "click"], [1, "flex", "items-center", "gap-1.5", "h-8.5", "px-3", "text-xs", "border", "border-neutral-200", "rounded-base", "hover:bg-neutral-50", 3, "click"], ["width", "14", "height", "14", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2"], ["cx", "12", "cy", "12", "r", "10"], ["points", "12 6 12 12 16 14"], [1, "h-8.5", "px-3", "text-xs", "border", "border-neutral-200", "rounded-base", "hover:bg-neutral-50", 3, "click"]], template: function TranscriptToolbarComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "button", 3);
        \u0275\u0275listener("click", function TranscriptToolbarComponent_Template_button_click_3_listener() {
          return ctx.jumpToFirstPage();
        });
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(4, "svg", 4);
        \u0275\u0275element(5, "path", 5);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(6, "button", 6);
        \u0275\u0275listener("click", function TranscriptToolbarComponent_Template_button_click_6_listener() {
          return ctx.prevPage();
        });
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(7, "svg", 4);
        \u0275\u0275element(8, "path", 7);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(9, "button", 8);
        \u0275\u0275listener("click", function TranscriptToolbarComponent_Template_button_click_9_listener() {
          return ctx.nextPage();
        });
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(10, "svg", 9);
        \u0275\u0275element(11, "path", 7);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(12, "button", 10);
        \u0275\u0275listener("click", function TranscriptToolbarComponent_Template_button_click_12_listener() {
          return ctx.jumpToLastPage();
        });
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(13, "svg", 9);
        \u0275\u0275element(14, "path", 5);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(15, "div", 11)(16, "input", 12);
        \u0275\u0275listener("change", function TranscriptToolbarComponent_Template_input_change_16_listener($event) {
          return ctx.onPageInputChange($event);
        })("keyup.enter", function TranscriptToolbarComponent_Template_input_keyup_enter_16_listener($event) {
          return ctx.onPageInputChange($event);
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(17, TranscriptToolbarComponent_Conditional_17_Template, 14, 1, "div", 13)(18, TranscriptToolbarComponent_Conditional_18_Template, 4, 4, "button", 14);
        \u0275\u0275elementEnd();
        \u0275\u0275template(19, TranscriptToolbarComponent_Conditional_19_Template, 6, 1, "div", 15);
        \u0275\u0275elementStart(20, "div", 1);
        \u0275\u0275template(21, TranscriptToolbarComponent_Conditional_21_Template, 5, 4, "button", 16)(22, TranscriptToolbarComponent_Conditional_22_Template, 5, 0, "div", 17);
        \u0275\u0275elementStart(23, "button", 18);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(24, "svg", 19);
        \u0275\u0275element(25, "circle", 20)(26, "circle", 21)(27, "circle", 22);
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(16);
        \u0275\u0275property("value", ctx.currentPage);
        \u0275\u0275advance();
        \u0275\u0275conditional(17, ctx.config.showZoom ? 17 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(18, ctx.config.showSearch ? 18 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(19, ctx.searchOpen ? 19 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(21, ctx.config.showTimestampToggle ? 21 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(22, ctx.config.showExport ? 22 : -1);
      }
    }, dependencies: [CommonModule, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, TranslateModule], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TranscriptToolbarComponent, { className: "TranscriptToolbarComponent", filePath: "src\\app\\rt\\components\\transcript-viewer\\transcript-toolbar\\transcript-toolbar.component.ts", lineNumber: 88 });
})();

// src/app/rt/components/transcript-viewer/transcript-content/transcript-content.component.ts
var _c0 = ["virtualScroll"];
var _c1 = ["scrollContainer"];
function TranscriptContentComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275element(1, "div", 6);
    \u0275\u0275elementEnd();
  }
}
function TranscriptContentComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275element(1, "empty", 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("head", "No Feed data Found")("desc", "Once a session starts or data is shared, it will appear here automatically.")("subcls", "text-black");
  }
}
function TranscriptContentComponent_Conditional_4_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275element(1, "div", 10);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const page_r1 = ctx.$implicit;
    \u0275\u0275attribute("data-page", page_r1.pageNumber);
    \u0275\u0275advance();
    \u0275\u0275property("innerHTML", page_r1.safeHtml, \u0275\u0275sanitizeHtml);
  }
}
function TranscriptContentComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "cdk-virtual-scroll-viewport", 5, 1);
    \u0275\u0275template(2, TranscriptContentComponent_Conditional_4_div_2_Template, 2, 2, "div", 8);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("itemSize", ctx_r1.estimatedPageHeight);
    \u0275\u0275advance(2);
    \u0275\u0275property("cdkVirtualForOf", ctx_r1.htmlPages)("cdkVirtualForTrackBy", ctx_r1.trackByPage);
  }
}
var TranscriptContentComponent = class _TranscriptContentComponent {
  constructor(sanitizer, cdr) {
    this.sanitizer = sanitizer;
    this.cdr = cdr;
    this.htmlContent = "";
    this.mode = "full";
    this.zoomLevel = 100;
    this.showTimestamps = true;
    this.showLineNumbers = true;
    this.searchTerm = "";
    this.loading = false;
    this.pageChange = new EventEmitter();
    this.lineClick = new EventEmitter();
    this.htmlPages = [];
    this.estimatedPageHeight = 800;
    this.baseFontSize = 15;
  }
  ngOnChanges(changes) {
    if (changes["htmlContent"] && this.htmlContent) {
      this.parseHtmlIntoPages();
    }
    if (changes["showTimestamps"] || changes["showLineNumbers"]) {
      this.applyVisibilityToggles();
    }
    if (changes["searchTerm"]) {
      this.applySearchHighlight();
    }
  }
  /**
   * Parses the canonical HTML document string into individual page chunks
   * for virtual scrolling.
   */
  parseHtmlIntoPages() {
    if (!this.htmlContent) {
      this.htmlPages = [];
      return;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.htmlContent, "text/html");
    const pageElements = doc.querySelectorAll(".transcript-page");
    if (pageElements.length === 0) {
      this.htmlPages = [{
        pageNumber: 1,
        html: this.htmlContent,
        safeHtml: this.sanitizer.bypassSecurityTrustHtml(this.htmlContent)
      }];
    } else {
      this.htmlPages = Array.from(pageElements).map((el, index) => {
        const pageNum = parseInt(el.getAttribute("data-page") || `${index + 1}`, 10);
        const html = el.outerHTML;
        return {
          pageNumber: pageNum,
          html,
          safeHtml: this.sanitizer.bypassSecurityTrustHtml(html)
        };
      });
    }
    this.estimatedPageHeight = this.mode === "sidebar" ? 400 : 800;
    this.cdr.markForCheck();
  }
  /**
   * Scrolls to a specific page number
   */
  scrollToPage(pageNumber) {
    const index = this.htmlPages.findIndex((p) => p.pageNumber === pageNumber);
    if (index >= 0 && this.virtualScroll) {
      this.virtualScroll.scrollToIndex(index, "smooth");
    }
  }
  /**
   * Scrolls to a specific line within a page
   */
  scrollToLine(pageNumber, lineNumber) {
    this.scrollToPage(pageNumber);
    setTimeout(() => {
      const lineEl = this.scrollContainer?.nativeElement?.querySelector(`[data-page="${pageNumber}"][data-line="${lineNumber}"]`);
      if (lineEl) {
        lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
        lineEl.classList.add("search-highlight-current");
        setTimeout(() => lineEl.classList.remove("search-highlight-current"), 2e3);
      }
    }, 300);
  }
  /**
   * Apply visibility toggles for timestamps and line numbers
   */
  applyVisibilityToggles() {
    this.cdr.markForCheck();
  }
  /**
   * Apply search term highlighting to the rendered HTML
   */
  applySearchHighlight() {
    if (!this.searchTerm || !this.htmlPages.length) {
      this.htmlPages = this.htmlPages.map((p) => __spreadProps(__spreadValues({}, p), {
        safeHtml: this.sanitizer.bypassSecurityTrustHtml(p.html)
      }));
      this.cdr.markForCheck();
      return;
    }
    const escapedTerm = this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");
    this.htmlPages = this.htmlPages.map((p) => {
      const highlighted = p.html.replace(/(<span class="line-text">)([\s\S]*?)(<\/span>)/g, (match, open, content, close) => {
        return open + content.replace(regex, '<mark class="search-highlight">$1</mark>') + close;
      });
      return __spreadProps(__spreadValues({}, p), {
        safeHtml: this.sanitizer.bypassSecurityTrustHtml(highlighted)
      });
    });
    this.cdr.markForCheck();
  }
  trackByPage(index, page) {
    return page.pageNumber;
  }
  static {
    this.\u0275fac = function TranscriptContentComponent_Factory(t) {
      return new (t || _TranscriptContentComponent)(\u0275\u0275directiveInject(DomSanitizer), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TranscriptContentComponent, selectors: [["transcript-content"]], viewQuery: function TranscriptContentComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
        \u0275\u0275viewQuery(_c1, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.virtualScroll = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.scrollContainer = _t.first);
      }
    }, inputs: { htmlContent: "htmlContent", mode: "mode", zoomLevel: "zoomLevel", showTimestamps: "showTimestamps", showLineNumbers: "showLineNumbers", searchTerm: "searchTerm", loading: "loading" }, outputs: { pageChange: "pageChange", lineClick: "lineClick" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 5, vars: 7, consts: [["scrollContainer", ""], ["virtualScroll", ""], [1, "transcript-content-wrapper", "h-full", "overflow-auto"], [1, "flex", "items-center", "justify-center", "py-12"], [1, "bg-white", "h-full", "p-5", "overflow-auto", "w-full"], [1, "h-full", 3, "itemSize"], [1, "animate-spin", "rounded-full", "h-8", "w-8", "border-b-2", "border-orange-500"], [2, "height", "100%", 3, "head", "desc", "subcls"], ["class", "transcript-virtual-page", 4, "cdkVirtualFor", "cdkVirtualForOf", "cdkVirtualForTrackBy"], [1, "transcript-virtual-page"], [3, "innerHTML"]], template: function TranscriptContentComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 2, 0);
        \u0275\u0275template(2, TranscriptContentComponent_Conditional_2_Template, 2, 0, "div", 3)(3, TranscriptContentComponent_Conditional_3_Template, 2, 3, "div", 4)(4, TranscriptContentComponent_Conditional_4_Template, 3, 3, "cdk-virtual-scroll-viewport", 5);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275styleProp("font-size", ctx.baseFontSize * (ctx.zoomLevel / 100), "px");
        \u0275\u0275classProp("compact", ctx.mode === "sidebar" || ctx.mode === "evidence");
        \u0275\u0275advance(2);
        \u0275\u0275conditional(2, ctx.loading ? 2 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(3, !ctx.loading && !ctx.htmlPages.length ? 3 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(4, !ctx.loading && ctx.htmlPages.length ? 4 : -1);
      }
    }, dependencies: [CommonModule, ScrollingModule, CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport, TranslateModule, EmptyComponent], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  height: 100%;\n}\n.transcript-content-wrapper[_ngcontent-%COMP%] {\n  height: 100%;\n  overflow: auto;\n}\n.hide-timestamps[_nghost-%COMP%]     .timestamp, .hide-timestamps   [_nghost-%COMP%]     .timestamp {\n  display: none !important;\n}\n.hide-line-numbers[_nghost-%COMP%]     .line-number, .hide-line-numbers   [_nghost-%COMP%]     .line-number {\n  display: none !important;\n}\n.transcript-virtual-page[_ngcontent-%COMP%] {\n  padding-bottom: 8px;\n}\n[_nghost-%COMP%]     .search-highlight {\n  background-color: #fbbf24;\n  border-radius: 2px;\n  transition: background-color 0.2s ease;\n}\n[_nghost-%COMP%]     .search-highlight-current {\n  background-color: #f97316 !important;\n  border-radius: 2px;\n}\n/*# sourceMappingURL=transcript-content.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TranscriptContentComponent, { className: "TranscriptContentComponent", filePath: "src\\app\\rt\\components\\transcript-viewer\\transcript-content\\transcript-content.component.ts", lineNumber: 25 });
})();

// src/app/rt/components/transcript-viewer/version-selector/version-selector.component.ts
var _forTrack0 = ($index, $item) => $item.nVersionid;
function VersionSelectorComponent_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 2);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "date");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const version_r1 = ctx.$implicit;
    \u0275\u0275property("value", version_r1.nVersionid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate3(" v", version_r1.nVersion, " ", version_r1.is_published ? "(Published)" : "(Draft)", " - ", \u0275\u0275pipeBind2(2, 4, version_r1.dCreatedt, "short"), " ");
  }
}
function VersionSelectorComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 4);
    \u0275\u0275listener("click", function VersionSelectorComponent_Conditional_4_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onReopen());
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 1, "transcript.reopenAsDraft"), " ");
  }
}
var VersionSelectorComponent = class _VersionSelectorComponent {
  get canReopen() {
    const selected = this.versions.find((v) => v.nVersionid === this.selectedVersionId);
    return selected?.is_published === true;
  }
  constructor(transcriptService) {
    this.transcriptService = transcriptService;
    this.versionSelected = new EventEmitter();
    this.reopenRequested = new EventEmitter();
    this.versions = [];
    this.selectedVersionId = "";
  }
  ngOnInit() {
    return __async(this, null, function* () {
      yield this.loadVersions();
    });
  }
  loadVersions() {
    return __async(this, null, function* () {
      if (!this.nSesid)
        return;
      const res = yield this.transcriptService.getVersionList(this.nSesid);
      if (res.msg === 1 && res.data?.length) {
        this.versions = res.data;
        this.selectedVersionId = this.versions[0].nVersionid;
      }
    });
  }
  onVersionChange(nVersionid) {
    return __async(this, null, function* () {
      const res = yield this.transcriptService.getVersion(nVersionid);
      if (res.msg === 1 && res.data) {
        this.versionSelected.emit(res.data);
      }
    });
  }
  onReopen() {
    this.reopenRequested.emit(this.selectedVersionId);
  }
  static {
    this.\u0275fac = function VersionSelectorComponent_Factory(t) {
      return new (t || _VersionSelectorComponent)(\u0275\u0275directiveInject(TranscriptService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _VersionSelectorComponent, selectors: [["version-selector"]], inputs: { nSesid: "nSesid" }, outputs: { versionSelected: "versionSelected", reopenRequested: "reopenRequested" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 5, vars: 2, consts: [[1, "flex", "items-center", "gap-2"], [1, "px-2", "py-1", "border", "border-neutral-300", "rounded", "text-sm", "focus:outline-none", "focus:border-blue-500", "bg-white", 3, "ngModelChange", "ngModel"], [3, "value"], ["title", "Create new draft from this published version", 1, "text-xs", "px-2", "py-1", "border", "border-neutral-300", "rounded", "hover:bg-neutral-50", "text-neutral-600"], ["title", "Create new draft from this published version", 1, "text-xs", "px-2", "py-1", "border", "border-neutral-300", "rounded", "hover:bg-neutral-50", "text-neutral-600", 3, "click"]], template: function VersionSelectorComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "select", 1);
        \u0275\u0275twoWayListener("ngModelChange", function VersionSelectorComponent_Template_select_ngModelChange_1_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.selectedVersionId, $event) || (ctx.selectedVersionId = $event);
          return $event;
        });
        \u0275\u0275listener("ngModelChange", function VersionSelectorComponent_Template_select_ngModelChange_1_listener($event) {
          return ctx.onVersionChange($event);
        });
        \u0275\u0275repeaterCreate(2, VersionSelectorComponent_For_3_Template, 3, 7, "option", 2, _forTrack0);
        \u0275\u0275elementEnd();
        \u0275\u0275template(4, VersionSelectorComponent_Conditional_4_Template, 3, 3, "button", 3);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selectedVersionId);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.versions);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(4, ctx.canReopen ? 4 : -1);
      }
    }, dependencies: [CommonModule, DatePipe, FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, SelectControlValueAccessor, NgControlStatus, NgModel, TranslateModule, TranslatePipe], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(VersionSelectorComponent, { className: "VersionSelectorComponent", filePath: "src\\app\\rt\\components\\transcript-viewer\\version-selector\\version-selector.component.ts", lineNumber: 39 });
})();

// src/app/rt/components/transcript-viewer/transcript-viewer.component.ts
var _c02 = ["contentRef"];
var TranscriptViewerComponent_Conditional_4_Defer_1_DepsFn = () => [import("./chunk-VIIPU6IT.js").then((m) => m.SideModalManagerComponent)];
function TranscriptViewerComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "rt-toolbar", 8);
    \u0275\u0275twoWayListener("visibleMarkNavModelChange", function TranscriptViewerComponent_Conditional_1_Template_rt_toolbar_visibleMarkNavModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.visibleMarkNavModel, $event) || (ctx_r2.visibleMarkNavModel = $event);
      return \u0275\u0275resetView($event);
    })("visibleIssueModelChange", function TranscriptViewerComponent_Conditional_1_Template_rt_toolbar_visibleIssueModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.visibleIssueModel, $event) || (ctx_r2.visibleIssueModel = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("nSesidChange", function TranscriptViewerComponent_Conditional_1_Template_rt_toolbar_nSesidChange_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onSessionSwitch($event));
    })("currentPageChange", function TranscriptViewerComponent_Conditional_1_Template_rt_toolbar_currentPageChange_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onPageChange($event));
    })("showTimestampChange", function TranscriptViewerComponent_Conditional_1_Template_rt_toolbar_showTimestampChange_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onTimestampToggle($event));
    })("zoomLevelChange", function TranscriptViewerComponent_Conditional_1_Template_rt_toolbar_zoomLevelChange_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onZoomChange($event));
    })("toolBarEvents", function TranscriptViewerComponent_Conditional_1_Template_rt_toolbar_toolBarEvents_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onRtToolbarEvent($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("isTranscViewer", true)("hideSecondaryActions", ctx_r2.hideSecondaryActions)("nSesid", ctx_r2.nSesid)("nCaseid", ctx_r2.nCaseid)("nUserid", ctx_r2.nUserid)("sessionDetail", ctx_r2.sessionDetail)("currentPage", ctx_r2.currentPage)("showTimestamp", ctx_r2.showTimestamps)("zoomLevel", ctx_r2.zoomLevelRt);
    \u0275\u0275twoWayProperty("visibleMarkNavModel", ctx_r2.visibleMarkNavModel)("visibleIssueModel", ctx_r2.visibleIssueModel);
  }
}
function TranscriptViewerComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "transcript-toolbar", 9);
    \u0275\u0275listener("toolbarAction", function TranscriptViewerComponent_Conditional_2_Template_transcript_toolbar_toolbarAction_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onToolbarAction($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("mode", ctx_r2.viewMode)("currentPage", ctx_r2.currentPage)("totalPages", ctx_r2.totalPages)("showTimestamps", ctx_r2.showTimestamps)("showLineNumbers", ctx_r2.showLineNumbers)("zoomLevel", ctx_r2.zoomLevel);
  }
}
function TranscriptViewerComponent_Conditional_4_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "side-modal-manager", 10);
    \u0275\u0275twoWayListener("visibleMarkNavModelChange", function TranscriptViewerComponent_Conditional_4_Defer_0_Template_side_modal_manager_visibleMarkNavModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r2.visibleMarkNavModel, $event) || (ctx_r2.visibleMarkNavModel = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("visibleIssueModelChange", function TranscriptViewerComponent_Conditional_4_Defer_0_Template_side_modal_manager_visibleIssueModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onVisibleIssueModelChange($event));
    });
    \u0275\u0275twoWayListener("hightlightModeChange", function TranscriptViewerComponent_Conditional_4_Defer_0_Template_side_modal_manager_hightlightModeChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r2.hightlightMode, $event) || (ctx_r2.hightlightMode = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("nCaseid", ctx_r2.nCaseid)("nUserid", ctx_r2.nUserid)("nSesid", ctx_r2.nSesid);
    \u0275\u0275twoWayProperty("visibleMarkNavModel", ctx_r2.visibleMarkNavModel);
    \u0275\u0275property("visibleIssueModel", ctx_r2.visibleIssueModel)("initialQFactMode", ctx_r2.qfactManagePending);
    \u0275\u0275twoWayProperty("hightlightMode", ctx_r2.hightlightMode);
    \u0275\u0275property("currentPage", ctx_r2.currentPage)("zoomLevel", ctx_r2.zoomLevelRt)("bIsTranscipt", true)("isIndividual", true)("cFFrom", "RT");
  }
}
function TranscriptViewerComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TranscriptViewerComponent_Conditional_4_Defer_0_Template, 1, 12);
    \u0275\u0275defer(1, 0, TranscriptViewerComponent_Conditional_4_Defer_1_DepsFn);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275deferWhen(ctx_r2.visibleMarkNavModel || ctx_r2.visibleIssueModel || ctx_r2.hightlightMode);
  }
}
function TranscriptViewerComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7)(1, "div", 11)(2, "div", 12);
    \u0275\u0275text(3, "No transcript data available for this session.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 13);
    \u0275\u0275text(5, "The session may not have any transcript content, or the data is still being prepared.");
    \u0275\u0275elementEnd()()();
  }
}
var TranscriptViewerComponent = class _TranscriptViewerComponent {
  constructor(transcriptService, rendererService, realtimeService, feedUtility, secureStorage, tost, cdr, selectionActions) {
    this.transcriptService = transcriptService;
    this.rendererService = rendererService;
    this.realtimeService = realtimeService;
    this.feedUtility = feedUtility;
    this.secureStorage = secureStorage;
    this.tost = tost;
    this.cdr = cdr;
    this.selectionActions = selectionActions;
    this.viewMode = "full";
    this.hideSecondaryActions = false;
    this.toolBarEvents = new EventEmitter();
    this.htmlContent = "";
    this.loading = false;
    this.hasNoContent = false;
    this.sessionDetail = null;
    this.currentPage = 1;
    this.totalPages = 1;
    this.showTimestamps = true;
    this.showLineNumbers = true;
    this.zoomLevel = 100;
    this.zoomLevelRt = 1;
    this.searchTerm = "";
    this.currentVersion = null;
    this.hasVersions = false;
    this.visibleMarkNavModel = false;
    this.visibleIssueModel = false;
    this.qfactManagePending = false;
    this.hightlightMode = null;
    effect(() => {
      const single = this.selectionActions.singleKind();
      this.hightlightMode = single ?? null;
      this.cdr.markForCheck();
    });
    this._qfactManageSub = this.selectionActions.qfactManageRequest$.subscribe(() => {
      if (!this.nCaseid || !this.nUserid)
        return;
      this.qfactManagePending = true;
      this.visibleIssueModel = true;
      this.cdr.markForCheck();
    });
  }
  /** Reset the pending flag when the panel closes so future re-opens
   *  (from a different entry point) don't auto-enable QFact mode. */
  onVisibleIssueModelChange(v) {
    this.visibleIssueModel = v;
    if (!v)
      this.qfactManagePending = false;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      if (!this.nUserid) {
        this.nUserid = yield this.secureStorage.getUserId();
      }
      yield this.loadContent();
    });
  }
  ngOnChanges(changes) {
    return __async(this, null, function* () {
      if (changes["nSesid"] && !changes["nSesid"].firstChange) {
        yield this.loadContent();
      }
      if (changes["preloadedHtml"] && this.preloadedHtml) {
        this.htmlContent = this.preloadedHtml;
        this.countPages();
        this.cdr.markForCheck();
      }
      if (changes["feedData"] && this.feedData) {
        this.renderFromFeedData(this.feedData);
      }
    });
  }
  /**
   * Main content loading logic:
   * 1. If preloadedHtml is provided, use it directly
   * 2. If feedData is provided, render from structured data
   * 3. Try to fetch a persisted version from the versioning API
   * 4. Fallback: fetch feed data from realtime API (same as RT module) and render
   */
  loadContent() {
    return __async(this, null, function* () {
      if (this.preloadedHtml) {
        this.htmlContent = this.preloadedHtml;
        this.countPages();
        return;
      }
      if (this.feedData?.length) {
        this.renderFromFeedData(this.feedData);
        return;
      }
      if (!this.nSesid)
        return;
      if (!this.nUserid) {
        this.nUserid = yield this.secureStorage.getUserId();
      }
      this.loading = true;
      this.hasNoContent = false;
      this.cdr.markForCheck();
      try {
        this.sessionDetail = yield this.realtimeService.getSessionDetail(this.nSesid, this.nUserid);
        this.cdr.markForCheck();
      } catch (e) {
        console.warn("Could not load session detail for toolbar");
      }
      try {
        try {
          const versionRes = yield this.transcriptService.getLatestVersion(this.nSesid);
          if (versionRes?.msg === 1 && versionRes.data?.html_content) {
            this.currentVersion = versionRes.data;
            this.htmlContent = versionRes.data.html_content;
            this.hasVersions = true;
            this.loading = false;
            this.countPages();
            this.cdr.markForCheck();
            return;
          }
        } catch (versionErr) {
          console.log("Version API not available, falling back to realtime API");
        }
        yield this.loadFromRealtimeApi();
      } catch (err) {
        console.error("Failed to load transcript content:", err);
      } finally {
        this.loading = false;
        this.countPages();
        this.cdr.markForCheck();
      }
    });
  }
  /**
   * Loads transcript data from the realtime API — same data source the RT feed uses.
   * Endpoint: GET /session/realtimedatabysesid
   */
  loadFromRealtimeApi() {
    return __async(this, null, function* () {
      if (!this.nUserid) {
        this.nUserid = yield this.secureStorage.getUserId();
      }
      console.log("[TranscriptViewer] loadFromRealtimeApi \u2014 nSesid:", this.nSesid, "nUserid:", this.nUserid, "nCaseid:", this.nCaseid);
      const detail = yield this.realtimeService.getSessionDetail(this.nSesid, this.nUserid);
      console.log("[TranscriptViewer] sessionDetail:", detail);
      this.sessionDetail = detail;
      if (!detail) {
        console.warn("[TranscriptViewer] Session detail not found for", this.nSesid);
        return;
      }
      const caseid = this.nCaseid || detail.nCaseid;
      const isTrans = detail.isTrans;
      console.log("[TranscriptViewer] caseid:", caseid, "isTrans:", isTrans);
      const feedResRaw = yield this.realtimeService.getRealtimeDataBySessionId(this.nSesid, this.nUserid, caseid);
      const feedRes = Array.isArray(feedResRaw) ? feedResRaw : feedResRaw?.msg === 1 && Array.isArray(feedResRaw.data) ? feedResRaw.data : [];
      console.log("[TranscriptViewer] feedRes:", feedRes?.length, "pages", feedRes?.[0] ? "first page data count:" + feedRes[0]?.data?.length : "no data");
      if (feedRes && feedRes.length) {
        const pages = feedRes.map((page) => {
          let parsedData;
          if (page.data?.length && typeof page.data[0] === "object" && !Array.isArray(page.data[0])) {
            parsedData = page.data;
          } else if (page.data?.length && Array.isArray(page.data[0])) {
            parsedData = this.feedUtility.parseFeedLineData(page.data);
          } else {
            parsedData = page.data || [];
          }
          return { page: page.page, data: parsedData, msg: page.page };
        });
        console.log("[TranscriptViewer] Rendering", pages.length, "pages");
        this.renderFromFeedData(pages);
      } else if (detail.pageRes) {
        console.log("[TranscriptViewer] Using pageRes fallback");
        const pageRes = detail.pageRes;
        if (pageRes.data?.length) {
          let data = pageRes.data;
          if (Array.isArray(data[0])) {
            data = this.feedUtility.parseFeedLineData(data);
          }
          this.renderFromFeedData([{ page: pageRes.page, data, msg: pageRes.msg }]);
        }
      } else {
        console.warn("[TranscriptViewer] No feed data found for session", this.nSesid);
        this.hasNoContent = true;
        this.cdr.markForCheck();
      }
    });
  }
  /**
   * Render HTML from structured feed data using TranscriptRendererService
   */
  renderFromFeedData(data) {
    if (!data?.length)
      return;
    this.htmlContent = this.rendererService.renderToHtml(data, {
      includeTimestamps: this.showTimestamps,
      includeLineNumbers: this.showLineNumbers,
      includePageBreaks: this.viewMode === "full",
      cssMode: "linked"
    });
    this.hasNoContent = false;
    this.countPages();
    this.cdr.markForCheck();
  }
  countPages() {
    if (!this.htmlContent) {
      this.totalPages = 0;
      return;
    }
    const matches = this.htmlContent.match(/class="transcript-page/g);
    this.totalPages = matches ? matches.length : 1;
  }
  onToolbarAction(event) {
    switch (event.action) {
      case "search":
        this.searchTerm = event.data || "";
        break;
      case "jump-to-page":
        this.contentRef?.scrollToPage(event.data);
        break;
      case "toggle-timestamps":
        this.showTimestamps = !this.showTimestamps;
        break;
      case "toggle-line-numbers":
        this.showLineNumbers = !this.showLineNumbers;
        break;
      case "zoom-in":
        this.zoomLevel = Math.min(this.zoomLevel + 10, 200);
        break;
      case "zoom-out":
        this.zoomLevel = Math.max(this.zoomLevel - 10, 50);
        break;
      case "zoom-reset":
        this.zoomLevel = 100;
        break;
      case "export-pdf":
        this.handleExportPdf();
        break;
      case "export-docx":
        this.handleExportDocx();
        break;
      case "copy":
        this.handleCopy();
        break;
    }
    this.cdr.markForCheck();
  }
  /** Handle session switch from RT toolbar */
  onSessionSwitch(nSesid) {
    return __async(this, null, function* () {
      this.nSesid = nSesid;
      yield this.loadContent();
    });
  }
  /** Handle page change from RT toolbar "Go to Page" */
  onPageChange(page) {
    this.currentPage = page;
    this.contentRef?.scrollToPage(page);
    this.cdr.markForCheck();
  }
  /** Handle timestamp toggle from RT toolbar three-dot menu */
  onTimestampToggle(show) {
    this.showTimestamps = show;
    this.cdr.markForCheck();
  }
  /** Handle zoom change from RT toolbar three-dot menu */
  onZoomChange(level) {
    this.zoomLevelRt = level;
    this.zoomLevel = Math.round(level * 100);
    this.cdr.markForCheck();
  }
  /** Handle RT toolbar events (export, toggle-demo, etc.) */
  onRtToolbarEvent(event) {
    if (!event?.type)
      return;
    switch (event.type) {
      case "EXPORT-TRANSCRIPT":
        this.handleExportDocx();
        break;
      case "TOGGLE-DEMO":
        break;
      case "COMPARE_MODE":
        console.log("[COMPARE] transcript-viewer: propagating COMPARE_MODE to parent");
        this.toolBarEvents.emit(event);
        break;
    }
  }
  onVersionSelected(version) {
    this.currentVersion = version;
    if (version.html_content) {
      this.htmlContent = version.html_content;
      this.countPages();
      this.cdr.markForCheck();
    }
  }
  onReopenRequested(nVersionid) {
    return __async(this, null, function* () {
      const res = yield this.transcriptService.reopenVersion({ nVersionid });
      if (res.msg === 1 && res.data?.html_content) {
        this.currentVersion = res.data;
        this.htmlContent = res.data.html_content;
        this.countPages();
        this.cdr.markForCheck();
      }
    });
  }
  handleExportPdf() {
    return __async(this, null, function* () {
      if (!this.currentVersion?.nVersionid && !this.htmlContent) {
        this.tost.openSnackBar("No content to export", "E");
        return;
      }
      if (this.currentVersion?.nVersionid) {
        const res = yield this.transcriptService.exportPdf(this.currentVersion.nVersionid);
        if (res.msg === 1 && res.path) {
          this.downloadFile(res.path);
        }
      }
    });
  }
  handleExportDocx() {
    return __async(this, null, function* () {
      if (!this.nSesid)
        return;
      const res = yield this.transcriptService.downloadDoc("", this.nSesid);
      if (res && res.msg !== -1) {
        this.tost.openSnackBar("Document export started", "");
      }
    });
  }
  handleCopy() {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      navigator.clipboard.writeText(selection.toString()).then(() => {
        this.tost.openSnackBar("Copied to clipboard", "");
      });
    }
  }
  downloadFile(path) {
    const url = `${environment.cloudUrl2}${environment.realtimeserive}/realtime-transcripts/exports/${path}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() || "transcript.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  ngOnDestroy() {
    this._qfactManageSub?.unsubscribe?.();
  }
  static {
    this.\u0275fac = function TranscriptViewerComponent_Factory(t) {
      return new (t || _TranscriptViewerComponent)(\u0275\u0275directiveInject(TranscriptService), \u0275\u0275directiveInject(TranscriptRendererService), \u0275\u0275directiveInject(RealtimeService), \u0275\u0275directiveInject(FeedUtilityService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(SelectionActionsService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TranscriptViewerComponent, selectors: [["transcript-viewer"]], viewQuery: function TranscriptViewerComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c02, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.contentRef = _t.first);
      }
    }, inputs: { nSesid: "nSesid", viewMode: "viewMode", nCaseid: "nCaseid", nUserid: "nUserid", preloadedHtml: "preloadedHtml", feedData: "feedData", hideSecondaryActions: "hideSecondaryActions" }, outputs: { toolBarEvents: "toolBarEvents" }, standalone: true, features: [\u0275\u0275ProvidersFeature([FeedDisplayService, AnnotsService, annotTrasnferService, SearchService, FeedIndexService]), \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 9, vars: 15, consts: [["contentRef", ""], [1, "transcript-viewer", "flex", "flex-col", "h-full", "bg-white", "relative"], [3, "isTranscViewer", "hideSecondaryActions", "nSesid", "nCaseid", "nUserid", "sessionDetail", "currentPage", "showTimestamp", "zoomLevel", "visibleMarkNavModel", "visibleIssueModel"], [3, "mode", "currentPage", "totalPages", "showTimestamps", "showLineNumbers", "zoomLevel"], [1, "flex-1", "overflow-hidden", "relative", "flex"], [1, "flex-1", "overflow-hidden", "relative"], [3, "pageChange", "htmlContent", "mode", "zoomLevel", "showTimestamps", "showLineNumbers", "searchTerm", "loading"], [1, "absolute", "inset-0", "flex", "items-center", "justify-center", "text-gray-500", "pointer-events-none"], [3, "visibleMarkNavModelChange", "visibleIssueModelChange", "nSesidChange", "currentPageChange", "showTimestampChange", "zoomLevelChange", "toolBarEvents", "isTranscViewer", "hideSecondaryActions", "nSesid", "nCaseid", "nUserid", "sessionDetail", "currentPage", "showTimestamp", "zoomLevel", "visibleMarkNavModel", "visibleIssueModel"], [3, "toolbarAction", "mode", "currentPage", "totalPages", "showTimestamps", "showLineNumbers", "zoomLevel"], [1, "block", "h-full", "w-fit", "flex-shrink-0", "shadow-[2px_2px_11px_1px_#00000087]", "z-10", 3, "visibleMarkNavModelChange", "visibleIssueModelChange", "hightlightModeChange", "nCaseid", "nUserid", "nSesid", "visibleMarkNavModel", "visibleIssueModel", "initialQFactMode", "hightlightMode", "currentPage", "zoomLevel", "bIsTranscipt", "isIndividual", "cFFrom"], [1, "text-center"], [1, "text-base", "font-medium"], [1, "text-xs", "mt-1", "opacity-75"]], template: function TranscriptViewerComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275template(1, TranscriptViewerComponent_Conditional_1_Template, 1, 11, "rt-toolbar", 2)(2, TranscriptViewerComponent_Conditional_2_Template, 1, 6, "transcript-toolbar", 3);
        \u0275\u0275elementStart(3, "div", 4);
        \u0275\u0275template(4, TranscriptViewerComponent_Conditional_4_Template, 3, 1);
        \u0275\u0275elementStart(5, "div", 5)(6, "transcript-content", 6, 0);
        \u0275\u0275listener("pageChange", function TranscriptViewerComponent_Template_transcript_content_pageChange_6_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.currentPage = $event);
        });
        \u0275\u0275elementEnd();
        \u0275\u0275template(8, TranscriptViewerComponent_Conditional_8_Template, 6, 0, "div", 7);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275classProp("hide-timestamps", !ctx.showTimestamps)("hide-line-numbers", !ctx.showLineNumbers);
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.viewMode === "full" ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.viewMode !== "full" ? 2 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(4, ctx.viewMode === "full" && (ctx.visibleMarkNavModel || ctx.visibleIssueModel || ctx.hightlightMode) ? 4 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275property("htmlContent", ctx.htmlContent)("mode", ctx.viewMode)("zoomLevel", ctx.zoomLevel)("showTimestamps", ctx.showTimestamps)("showLineNumbers", ctx.showLineNumbers)("searchTerm", ctx.searchTerm)("loading", ctx.loading);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(8, !ctx.loading && !ctx.htmlContent && ctx.hasNoContent ? 8 : -1);
      }
    }, dependencies: [
      CommonModule,
      TranslateModule,
      TranscriptToolbarComponent,
      TranscriptContentComponent,
      ToolbarComponent
    ], styles: ['\n\n.transcript-document[_ngcontent-%COMP%] {\n  font-family:\n    "Courier New",\n    Courier,\n    monospace;\n  font-size: 15px;\n  line-height: 1.5;\n  color: #1a1a1a;\n  background: #fff;\n}\n.transcript-page[_ngcontent-%COMP%] {\n  position: relative;\n  padding: 16px 40px 24px 40px;\n  min-width: 956px;\n  max-width: fit-content;\n  width: fit-content;\n  background: #fff;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.transcript-page-break[_ngcontent-%COMP%] {\n  page-break-after: always;\n  break-after: page;\n}\n.transcript-page-header[_ngcontent-%COMP%] {\n  background: #737373;\n  color: #fff;\n  font-size: 12px;\n  padding: 6px 10px;\n  margin-bottom: 24px;\n  height: 36px;\n  display: flex;\n  align-items: center;\n  border-radius: 0;\n}\n.transcript-line[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  position: relative;\n  font-size: 15px;\n}\n.line-number[_ngcontent-%COMP%] {\n  display: inline-flex;\n  justify-content: flex-end;\n  width: 65px;\n  min-width: 65px;\n  padding: 0 6px;\n  text-align: right;\n  user-select: none;\n  -webkit-user-select: none;\n  letter-spacing: -0.3px;\n  background: #f5f5f5;\n  margin-right: 12px;\n  flex-shrink: 0;\n  pointer-events: none;\n}\n.timestamp[_ngcontent-%COMP%] {\n  white-space: nowrap;\n  padding: 0 6px;\n  width: 75px;\n  min-width: 75px;\n  font-size: 12px;\n  user-select: none;\n  -webkit-user-select: none;\n  overflow: hidden;\n  letter-spacing: -0.3px;\n  flex-shrink: 0;\n}\n.line-text[_ngcontent-%COMP%] {\n  flex: 1;\n  text-align: left;\n  white-space: pre-wrap;\n  word-break: break-word;\n  -webkit-user-select: text;\n  user-select: text;\n  cursor: text;\n  font-size: 15px;\n}\n.question-block[_ngcontent-%COMP%]   .line-text[_ngcontent-%COMP%], .is-bold[_ngcontent-%COMP%]   .line-text[_ngcontent-%COMP%] {\n  font-weight: bold;\n}\n.parenthetical[_ngcontent-%COMP%]   .line-text[_ngcontent-%COMP%] {\n  padding-left: 2em;\n  font-style: italic;\n}\n.first-line[_ngcontent-%COMP%] {\n}\n.speaker[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: #374151;\n}\n.question[_ngcontent-%COMP%] {\n  color: #1e40af;\n}\n.answer[_ngcontent-%COMP%] {\n  color: #1a1a1a;\n}\n.highlighted[_ngcontent-%COMP%] {\n  background-color: var(--highlightcolor, #ffff00);\n}\n.annotation-anchor[_ngcontent-%COMP%] {\n  position: relative;\n}\n.transcript-link[_ngcontent-%COMP%] {\n  color: #2563eb;\n  text-decoration: underline;\n  cursor: pointer;\n}\n.transcript-link[_ngcontent-%COMP%]:hover {\n  color: #1d4ed8;\n}\n.search-highlight[_ngcontent-%COMP%] {\n  background-color: #fbbf24;\n  border-radius: 2px;\n}\n.search-highlight-current[_ngcontent-%COMP%] {\n  background-color: #f97316;\n  border-radius: 2px;\n}\n.highlighter-mode[_ngcontent-%COMP%]   .transcript-line[_ngcontent-%COMP%] {\n  cursor: pointer;\n}\n.highlighter-mode[_ngcontent-%COMP%]   .line-number[_ngcontent-%COMP%] {\n  cursor: pointer;\n  pointer-events: auto;\n}\n.transcript-content-wrapper.compact[_ngcontent-%COMP%]   .transcript-document[_ngcontent-%COMP%] {\n  font-size: 13px;\n}\n.transcript-content-wrapper.compact[_ngcontent-%COMP%]   .transcript-page[_ngcontent-%COMP%] {\n  padding: 8px 12px 12px 12px;\n  min-width: unset;\n  width: 100%;\n  max-width: none;\n  overflow: visible;\n}\n.transcript-content-wrapper.compact[_ngcontent-%COMP%]   .transcript-page-header[_ngcontent-%COMP%] {\n  height: 28px;\n  font-size: 11px;\n  margin-bottom: 12px;\n}\n.transcript-content-wrapper.compact[_ngcontent-%COMP%]   .transcript-line[_ngcontent-%COMP%] {\n  min-height: 24px;\n  align-items: flex-start;\n}\n.transcript-content-wrapper.compact[_ngcontent-%COMP%]   .line-number[_ngcontent-%COMP%] {\n  width: 50px;\n  min-width: 50px;\n  height: 24px;\n  padding: 0 6px;\n  font-size: 13px;\n  line-height: 24px;\n  background: #eeeeee;\n  margin-right: 0;\n}\n.transcript-content-wrapper.compact[_ngcontent-%COMP%]   .timestamp[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 70px;\n  min-width: 70px;\n  height: 24px;\n  padding: 0 6px;\n  font-size: 11px;\n  line-height: 24px;\n  background: #eeeeee;\n}\n.transcript-content-wrapper.compact[_ngcontent-%COMP%]   .line-text[_ngcontent-%COMP%] {\n  font-size: 13px;\n  line-height: 1.5;\n  min-height: 24px;\n  padding-left: 12px;\n}\n.transcript-content-wrapper.compact[_ngcontent-%COMP%]   .parenthetical[_ngcontent-%COMP%]   .line-text[_ngcontent-%COMP%] {\n  padding-left: 24px;\n}\n@media print {\n  .transcript-page[_ngcontent-%COMP%] {\n    padding: 0;\n    min-width: unset;\n    width: 100%;\n  }\n  .transcript-page-header[_ngcontent-%COMP%] {\n    background: #737373 !important;\n    color: #fff !important;\n    -webkit-print-color-adjust: exact;\n    print-color-adjust: exact;\n  }\n  .line-number[_ngcontent-%COMP%] {\n    background: #f5f5f5 !important;\n    -webkit-print-color-adjust: exact;\n    print-color-adjust: exact;\n  }\n  .highlighted[_ngcontent-%COMP%] {\n    -webkit-print-color-adjust: exact;\n    print-color-adjust: exact;\n  }\n}\n\n\n\n[_nghost-%COMP%] {\n  display: block;\n  height: 100%;\n}\n.transcript-viewer[_ngcontent-%COMP%] {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  background: #fff;\n  border: 1px solid #e5e7eb;\n  border-radius: 4px;\n  overflow: hidden;\n}\n[_nghost-%COMP%]     .toolbar-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 4px 6px;\n  border-radius: 4px;\n  cursor: pointer;\n  color: #6b7280;\n  background: transparent;\n  border: none;\n  transition: all 0.15s ease;\n}\n[_nghost-%COMP%]     .toolbar-btn:hover {\n  background: #f3f4f6;\n  color: #374151;\n}\n[_nghost-%COMP%]     .toolbar-btn.active {\n  background: #fff7ed;\n  color: #ea580c;\n}\n.hide-timestamps[_ngcontent-%COMP%]     .timestamp {\n  display: none !important;\n}\n.hide-line-numbers[_ngcontent-%COMP%]     .line-number {\n  display: none !important;\n}\n/*# sourceMappingURL=transcript-viewer.component.css.map */'], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TranscriptViewerComponent, { className: "TranscriptViewerComponent", filePath: "src\\app\\rt\\components\\transcript-viewer\\transcript-viewer.component.ts", lineNumber: 46 });
})();

export {
  TranscriptViewerComponent
};
//# sourceMappingURL=chunk-W2LTZB4Y.js.map
