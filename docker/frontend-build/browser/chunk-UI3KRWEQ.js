import {
  SelectionActionsControlComponent
} from "./chunk-GLL6MQHU.js";
import {
  SelectionActionsService
} from "./chunk-FW6JNL2T.js";
import {
  CdkDrag
} from "./chunk-EZOJOG5D.js";
import {
  ToolbarService
} from "./chunk-62ZTKIF6.js";
import {
  AnnotsService,
  FeedDisplayService
} from "./chunk-SD32Y426.js";
import {
  MatSlideToggleModule
} from "./chunk-43QUFIPG.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField
} from "./chunk-Y2GGPNYR.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslatePipe,
  TranslateService
} from "./chunk-DWVFAK3Q.js";
import {
  MatMenu,
  MatMenuItem,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  CheckboxControlValueAccessor,
  DefaultValueAccessor,
  FormsModule,
  MaxLengthValidator,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  DomSanitizer
} from "./chunk-FNSUDMGC.js";
import {
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  BehaviorSubject,
  ChangeDetectorRef,
  ElementRef,
  EventEmitter,
  InputFlags,
  Subject,
  __async,
  effect,
  inject,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefinePipe,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBindV,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction6,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/rt/search/search.service.ts
var SearchService = class _SearchService {
  constructor() {
    this.searchTerm = "";
    this.indexTerm = "";
    this.matches = [];
    this.currentMatchIndex = 0;
    this.curMatch = null;
    this.matches$ = new BehaviorSubject([]);
    this.currentMatch$ = new BehaviorSubject(0);
    this.searchingData = false;
    this.iswholeWord = false;
  }
  /**
   * Escape user input to be used in a literal RegExp.
   */
  escapeRegExp(s) {
    return s.replace(/[\\^$*+?.()|[\]{}-]/g, "\\$&");
  }
  /**
   * Build a Unicode-aware regex based on options.
   * - wholeWord: only applied if term is a single "word" (letters/numbers/_).
   * - matchCase: adds 'i' if false.
   */
  buildRegex(term, wholeWord, matchCase) {
    const trimmed = term?.trim();
    if (!trimmed)
      return null;
    const escaped = this.escapeRegExp(trimmed);
    const flags = `gu${matchCase ? "" : "i"}`;
    const isWord = /^[\p{L}\p{N}_]+$/u.test(trimmed);
    const pattern = wholeWord && isWord ? `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])` : escaped;
    return new RegExp(pattern, flags);
  }
  /**
   * Run the search over your pagewise data.
   * @param term      The query string.
   * @param data      Array of pages (feeds[]).
   * @param wholeWord Whole word toggle.
   * @param matchCase Case sensitive toggle.
   */
  search(term, data, wholeWord, matchCase) {
    this.iswholeWord = wholeWord;
    this.searchingData = true;
    const regex = this.buildRegex(term, wholeWord, matchCase);
    this.searchTerm = term ?? "";
    if (!regex || !Array.isArray(data) || data.length == 0) {
      this.matches = [];
      this.matches$.next(this.matches);
      this.currentMatchIndex = 0;
      this.currentMatch$.next(this.currentMatchIndex);
      this.curMatch = null;
      this.searchingData = false;
      return;
    }
    const out = [];
    for (let pageIndex = 0; pageIndex < data.length; pageIndex++) {
      const page = data[pageIndex];
      const lines = page?.data ?? [];
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const joined = (lines[lineIndex].lines ?? []).join(" ");
        if (!joined)
          continue;
        regex.lastIndex = 0;
        let m;
        while ((m = regex.exec(joined)) !== null) {
          const start = m.index;
          const len = m[0]?.length ?? 0;
          if (len == 0) {
            regex.lastIndex = start + 1;
            continue;
          }
          out.push({ page: pageIndex, line: lineIndex, start, end: start + len, lineText: joined });
        }
      }
    }
    this.matches = out;
    this.matches$.next(this.matches);
    this.currentMatchIndex = 0;
    this.curMatch = this.matches[0] ?? null;
    this.currentMatch$.next(this.currentMatchIndex);
    this.searchingData = false;
  }
  nextMatch() {
    if (!this.matches.length)
      return;
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
    this.curMatch = this.matches[this.currentMatchIndex];
    this.currentMatch$.next(this.currentMatchIndex);
  }
  toMatch(index) {
    if (!this.matches.length)
      return;
    this.currentMatchIndex = index % this.matches.length;
    this.curMatch = this.matches[this.currentMatchIndex];
    this.currentMatch$.next(this.currentMatchIndex);
  }
  previousMatch() {
    if (!this.matches.length)
      return;
    this.currentMatchIndex = (this.currentMatchIndex - 1 + this.matches.length) % this.matches.length;
    this.curMatch = this.matches[this.currentMatchIndex];
    this.currentMatch$.next(this.currentMatchIndex);
  }
  getCurrentMatch() {
    if (!this.matches.length)
      return null;
    return this.matches[this.currentMatchIndex] ?? null;
  }
  isCurrentMatch(lineIndex, pageIndex) {
    const m = this.getCurrentMatch();
    if (m && m.page == pageIndex - 1 && m.line == lineIndex - 1)
      return m;
    return false;
  }
  getCurrentMatchPosition() {
    const m = this.getCurrentMatch();
    return m ? m.start : -1;
  }
  getCurrentMatchLength() {
    const m = this.getCurrentMatch();
    return m ? m.end - m.start : 0;
  }
  get highlightTerm() {
    return this.searchTerm || this.indexTerm;
  }
  indexSearch(term, data, wholeWord, matchCase) {
    this.indexTerm = term ?? "";
    const savedSearchTerm = this.searchTerm;
    this.search(term, data, wholeWord, matchCase);
    this.searchTerm = savedSearchTerm;
  }
  clearIndex() {
    this.indexTerm = "";
    this.matches = [];
    this.curMatch = null;
    this.currentMatchIndex = 0;
    this.matches$.next([]);
    this.currentMatch$.next(0);
  }
  clear() {
    this.searchTerm = "";
    this.indexTerm = "";
    this.matches = [];
    this.curMatch = null;
    this.currentMatchIndex = 0;
    this.matches$.next([]);
    this.currentMatch$.next(0);
  }
  static {
    this.\u0275fac = function SearchService_Factory(t) {
      return new (t || _SearchService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SearchService, factory: _SearchService.\u0275fac });
  }
};

// src/app/rt/components/feeds/rt-components/rt-tool-options/rt-tool-options.component.ts
function RtToolOptionsComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "button", 2);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 17);
    \u0275\u0275element(2, "circle", 18)(3, "circle", 19)(4, "circle", 20);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const menu_r2 = \u0275\u0275reference(3);
    \u0275\u0275property("matMenuTriggerFor", menu_r2);
  }
}
function RtToolOptionsComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 21);
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const menu_r2 = \u0275\u0275reference(3);
    \u0275\u0275property("matMenuTriggerFor", menu_r2);
  }
}
function RtToolOptionsComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 22);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function RtToolOptionsComponent_Conditional_5_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.openissuemanager());
    });
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "icon", 8);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(1, 2, "rt.toolOptions.manageClaimsIssuesTooltip"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 4, "rt.toolOptions.manageClaimsIssues"));
  }
}
function RtToolOptionsComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 8);
  }
}
function RtToolOptionsComponent_Conditional_13_For_12_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 34);
  }
}
function RtToolOptionsComponent_Conditional_13_For_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 33);
    \u0275\u0275listener("click", function RtToolOptionsComponent_Conditional_13_For_12_Template_div_click_0_listener() {
      const x_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.changeZoomValue(x_r7.name));
    });
    \u0275\u0275text(1);
    \u0275\u0275template(2, RtToolOptionsComponent_Conditional_13_For_12_Conditional_2_Template, 1, 0, "icon", 34);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r7 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r7.text, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ctx_r3.zoomLevel === x_r7.name ? 2 : -1);
  }
}
function RtToolOptionsComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "div", 23)(2, "icon", 24);
    \u0275\u0275listener("click", function RtToolOptionsComponent_Conditional_13_Template_icon_click_2_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.changeZoom("I"));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "icon", 25);
    \u0275\u0275listener("click", function RtToolOptionsComponent_Conditional_13_Template_icon_click_3_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.changeZoom("O"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "button", 26)(5, "span");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275element(7, "icon", 27);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "mat-menu", 28, 1)(10, "div", 29);
    \u0275\u0275repeaterCreate(11, RtToolOptionsComponent_Conditional_13_For_12_Template, 3, 2, "div", 30, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementStart(13, "div", 31);
    \u0275\u0275listener("click", function RtToolOptionsComponent_Conditional_13_Template_div_click_13_listener($event) {
      \u0275\u0275restoreView(_r5);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(14, "input", 32);
    \u0275\u0275listener("input", function RtToolOptionsComponent_Conditional_13_Template_input_input_14_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onZoomInput($event));
    })("change", function RtToolOptionsComponent_Conditional_13_Template_input_change_14_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.changeZoomValueByInput($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "span");
    \u0275\u0275text(16, "%");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const zoomMenu_r8 = \u0275\u0275reference(9);
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275property("matMenuTriggerFor", zoomMenu_r8);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r3.zoomLable, " ");
    \u0275\u0275advance(5);
    \u0275\u0275repeater(ctx_r3.zoom);
    \u0275\u0275advance(3);
    \u0275\u0275property("value", ctx_r3.zoomLevel * 100);
  }
}
function RtToolOptionsComponent_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function RtToolOptionsComponent_Conditional_23_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.toggleFullViewMode());
    });
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275classProp("opacity-50", ctx_r3.isDisable);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(1, 4, "rt.toolOptions.enterFullScreen"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(3, 6, "rt.toolOptions.fullScreen"), " ");
  }
}
function RtToolOptionsComponent_Conditional_24_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function RtToolOptionsComponent_Conditional_24_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onExportTranscript());
    });
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275classProp("opacity-50", ctx_r3.isDisable);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(1, 4, "rt.toolOptions.exportTooltip"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(3, 6, "rt.toolOptions.exportTranscript"), " ");
  }
}
function RtToolOptionsComponent_Conditional_25_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 36);
    \u0275\u0275listener("click", function RtToolOptionsComponent_Conditional_25_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.runDemo());
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275classProp("opacity-50", ctx_r3.isSessionLive);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 3, "rt.toolOptions.runDemo"), " ");
  }
}
var RtToolOptionsComponent = class _RtToolOptionsComponent {
  constructor(tost, translate) {
    this.tost = tost;
    this.translate = translate;
    this.zoomexpand = false;
    this.zoom = [];
    this.demoToggled = new EventEmitter();
    this.exportTranscript = new EventEmitter();
    this.zoomLable = "Actual";
    this.limitedActions = false;
    this.translate.onLangChange.subscribe(() => {
      this.updateZoomLabels();
    });
    this.updateZoomLabels();
  }
  updateZoomLabels() {
    if (this.zoomLevel === 1.2) {
      this.zoomLable = this.translate.instant("rt.toolOptions.fitHeight");
    } else if (this.zoomLevel === 1) {
      this.zoomLable = this.translate.instant("rt.toolOptions.actual");
    } else {
      this.zoomLable = (this.zoomLevel * 100).toFixed(0) + "%";
    }
    this.zoom = [
      { name: 1, text: this.translate.instant("rt.toolOptions.actual") },
      { name: 1.2, text: this.translate.instant("rt.toolOptions.fitHeight") }
    ];
  }
  openissuemanager() {
    if (this.indexEnabled) {
      this.indexEnabled = false;
      this.indexEnabledChange.emit(this.indexEnabled);
    }
    if (this.visibleMarkNavModel) {
      this.visibleMarkNavModel = false;
      this.visibleMarkNavModelChange.emit(this.visibleMarkNavModel);
    }
    this.visibleIssueModelChange.emit(true);
  }
  ngOnChanges(changes) {
    if (changes["zoomLevel"]) {
      if (this.zoomLevel == 1) {
        this.zoomLable = this.translate.instant("rt.toolOptions.actual");
      } else if (this.zoomLevel == 1.2) {
        this.zoomLable = this.translate.instant("rt.toolOptions.fitHeight");
      } else {
        this.zoomLable = (this.zoomLevel * 100).toFixed(0) + "%";
      }
    }
  }
  handleZoomExpand() {
    if (this.isDisable)
      return;
    this.zoomexpand = !this.zoomexpand;
  }
  toggleTimeStamp() {
    if (this.isDisable)
      return;
    this.showTimestampChange.emit(this.showTimestamp);
  }
  changeZoom(flag) {
    const cr_zoom = Math.round(this.zoomLevel * 10) / 10;
    const val = flag == "I" ? cr_zoom + 0.1 : cr_zoom - 0.1;
    this.changeZoomValue(Math.round(val * 10) / 10);
  }
  changeZoomValue(v) {
    if (0 >= v || v > 1.8)
      return;
    this.zoomLevel = v;
    this.zoomLevelChange.emit(this.zoomLevel);
  }
  changeZoomValueByInput(e) {
    const v = e.target.value;
    if (!v)
      return;
    const num = Number.parseFloat(v);
    if (Number.isNaN(num) || num < 10 || num > 180) {
      return;
    }
    this.changeZoomValue(num / 100);
  }
  toggleFullViewMode() {
    if (this.isDisable)
      return;
    this.fullViewMode = !this.fullViewMode;
    this.fullViewModeChange.emit(this.fullViewMode);
  }
  onZoomInput(event) {
    const input = event.target;
    const value = Number.parseFloat(input.value);
    if (!Number.isNaN(value) && value > 180) {
      input.value = "180";
    }
    if (!Number.isNaN(value) && value < 0) {
      input.value = "10";
    }
  }
  onExportTranscript() {
    if (this.isDisable)
      return;
    this.exportTranscript.emit();
  }
  runDemo() {
    if (this.isSessionLive)
      return;
    this.demoToggled.emit();
  }
  static {
    this.\u0275fac = function RtToolOptionsComponent_Factory(t) {
      return new (t || _RtToolOptionsComponent)(\u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(TranslateService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RtToolOptionsComponent, selectors: [["rt-tool-options"]], inputs: { visibleIssueModelChange: "visibleIssueModelChange", showTimestampChange: "showTimestampChange", isDisable: "isDisable", isSessionLive: "isSessionLive", showTimestamp: "showTimestamp", compareEnabled: "compareEnabled", zoomLevel: "zoomLevel", zoomLevelChange: "zoomLevelChange", fullViewMode: "fullViewMode", fullViewModeChange: "fullViewModeChange", indexEnabled: "indexEnabled", indexEnabledChange: "indexEnabledChange", visibleMarkNavModel: "visibleMarkNavModel", visibleMarkNavModelChange: "visibleMarkNavModelChange", isTranscViewer: "isTranscViewer", limitedActions: "limitedActions" }, outputs: { demoToggled: "demoToggled", exportTranscript: "exportTranscript" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 26, vars: 24, consts: [["menu", "matMenu"], ["zoomMenu", "matMenu"], [1, "flex", "items-center", "justify-center", "size-[34px]", "rounded-lg", "border", "border-neutral-200", "bg-white", "hover:bg-neutral-50", "cursor-pointer", "text-neutral-500", 3, "matMenuTriggerFor"], [1, "mt-5", "!min-w-[223px]", "!max-w-fit"], [1, "flex", "flex-col", "gap-2", "p-2.5"], ["matTooltipPosition", "right", 1, "flex", "items-center", "gap-2", "h-9", "min-w-32", "p-2", "text-xs", "hover:bg-faint", "rounded-base", "w-full", 3, "matTooltip"], ["matTooltipPosition", "right", 1, "flex", "items-center", "gap-2", "h-9", "text-xs", "cursor-pointer", "w-full", 3, "click", "matTooltip"], [1, "flex", "items-center", "gap-2", "h-9", "min-w-32", "p-2", "text-xs", "hover:bg-faint", "rounded-base", "w-full", 3, "click"], ["name", "chvx", 1, "text-xs", "ms-auto", "-rotate-90"], [1, "flex", "items-center", "gap-2", "h-9", "p-2", "text-xs", "hover:bg-faint", "rounded-base", "border", "border-tab"], ["matTooltipPosition", "right", 1, "flex", "items-center", "gap-2", "h-9", "cursor-pointer", "w-full", "hover:bg-blue-50", 3, "click", "matTooltip"], [1, "flex", "w-full", "items-center", "gap-2", "h-9", "p-2", "text-xs", "rounded-base"], [1, "inline-flex", "items-center", "cursor-pointer"], ["type", "checkbox", 1, "sr-only", "peer", 3, "ngModelChange", "change", "ngModel"], [1, "relative", "w-8.5", "h-5", "bg-gray-200", "peer-focus:outline-none", "peer-checked:after:start-[0px]", "rounded-full", "peer", "peer-checked:after:translate-x-full", "rtl:peer-checked:after:-translate-x-full", "peer-checked:after:border-white", "after:content-['']", "after:absolute", "after:top-[2px]", "after:start-[3px]", "after:bg-white", "after:border-gray-300", "after:border", "after:rounded-full", "after:h-4", "after:w-4", "after:transition-all", "peer-checked:bg-blue-600"], ["matTooltipPosition", "right", 1, "flex", "items-center", "gap-2", "h-9", "p-2", "text-xs", "hover:bg-faint", "rounded-base", "cursor-pointer", "w-full", 3, "matTooltip", "opacity-50"], [1, "flex", "items-center", "gap-2", "h-9", "p-2", "text-xs", "hover:bg-faint", "rounded-base", "cursor-pointer", "w-full", 3, "opacity-50"], ["width", "16", "height", "16", "viewBox", "0 0 24 24", "fill", "currentColor"], ["cx", "12", "cy", "5", "r", "2"], ["cx", "12", "cy", "12", "r", "2"], ["cx", "12", "cy", "19", "r", "2"], ["name", "menu", 1, "text-white", "mx-2.5", "text-lg", 3, "matMenuTriggerFor"], ["matTooltipPosition", "right", 1, "flex", "items-center", "gap-2", "h-9", "min-w-32", "p-2", "text-xs", "hover:bg-faint", "rounded-base", "w-full", 3, "click", "matTooltip"], [1, "flex", "bg-white", "items-center", "border-r", "border-tab", "pe-5"], ["name", "addcircle", 1, "text-lg", 3, "click"], ["name", "removecircle", 1, "text-[20px]", "ms-2", 3, "click"], ["mat-button", "", 1, "w-20", "flex", "justify-between", "items-center", "!border-none", "!shadow-none", 3, "matMenuTriggerFor"], ["name", "chvx", 1, "text-xs", "ms-1"], [1, "mt-3"], [1, "flex", "flex-col", "gap-1", "p-2.5"], [1, "text-xs", "p-1.5", "hover:bg-faint", "h-8"], [1, "flex", "items-center", "gap-2", "text-xs", "py-2.5", "px-1", "hover:bg-faint", "h-8", 3, "click"], ["type", "number", "min", "10", "max", "180", 1, "border", "border-gray-300", "rounded-md", "h-6", "px-2", "max-w-10", "text-center", "focus:shadow-[0px_0px_5px_-1px_#0072ff]", 3, "input", "change", "value"], [1, "text-xs", "p-1.5", "hover:bg-faint", "h-8", 3, "click"], ["name", "check", 1, "text-xs", "ms-2"], ["matTooltipPosition", "right", 1, "flex", "items-center", "gap-2", "h-9", "p-2", "text-xs", "hover:bg-faint", "rounded-base", "cursor-pointer", "w-full", 3, "click", "matTooltip"], [1, "flex", "items-center", "gap-2", "h-9", "p-2", "text-xs", "hover:bg-faint", "rounded-base", "cursor-pointer", "w-full", 3, "click"]], template: function RtToolOptionsComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275template(0, RtToolOptionsComponent_Conditional_0_Template, 5, 1, "button", 2)(1, RtToolOptionsComponent_Conditional_1_Template, 1, 1);
        \u0275\u0275elementStart(2, "mat-menu", 3, 0)(4, "div", 4);
        \u0275\u0275template(5, RtToolOptionsComponent_Conditional_5_Template, 6, 6, "div", 5);
        \u0275\u0275elementStart(6, "div", 6);
        \u0275\u0275pipe(7, "translate");
        \u0275\u0275listener("click", function RtToolOptionsComponent_Template_div_click_6_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        });
        \u0275\u0275elementStart(8, "div", 7);
        \u0275\u0275listener("click", function RtToolOptionsComponent_Template_div_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.handleZoomExpand());
        });
        \u0275\u0275elementStart(9, "span");
        \u0275\u0275text(10);
        \u0275\u0275pipe(11, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275template(12, RtToolOptionsComponent_Conditional_12_Template, 1, 0, "icon", 8);
        \u0275\u0275elementEnd();
        \u0275\u0275template(13, RtToolOptionsComponent_Conditional_13_Template, 17, 3, "div", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "label", 10);
        \u0275\u0275pipe(15, "translate");
        \u0275\u0275listener("click", function RtToolOptionsComponent_Template_label_click_14_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        });
        \u0275\u0275elementStart(16, "div", 11)(17, "span");
        \u0275\u0275text(18);
        \u0275\u0275pipe(19, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(20, "span", 12)(21, "input", 13);
        \u0275\u0275twoWayListener("ngModelChange", function RtToolOptionsComponent_Template_input_ngModelChange_21_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.showTimestamp, $event) || (ctx.showTimestamp = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("change", function RtToolOptionsComponent_Template_input_change_21_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.toggleTimeStamp());
        });
        \u0275\u0275elementEnd();
        \u0275\u0275element(22, "div", 14);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(23, RtToolOptionsComponent_Conditional_23_Template, 4, 8, "div", 15)(24, RtToolOptionsComponent_Conditional_24_Template, 4, 8, "div", 15)(25, RtToolOptionsComponent_Conditional_25_Template, 3, 5, "div", 16);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.isTranscViewer ? 0 : 1);
        \u0275\u0275advance(5);
        \u0275\u0275conditional(5, !ctx.limitedActions ? 5 : -1);
        \u0275\u0275advance();
        \u0275\u0275classProp("opacity-50", ctx.isDisable);
        \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(7, 16, "rt.toolOptions.adjustTextSize"));
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(11, 18, "rt.toolOptions.zoom"));
        \u0275\u0275advance(2);
        \u0275\u0275conditional(12, !ctx.zoomexpand ? 12 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(13, ctx.zoomexpand ? 13 : -1);
        \u0275\u0275advance();
        \u0275\u0275classProp("opacity-50", ctx.isDisable);
        \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(15, 20, "rt.toolOptions.showHideTimestamp"));
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(19, 22, "rt.toolOptions.timeStamp"));
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.showTimestamp);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(23, !ctx.limitedActions ? 23 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(24, !ctx.limitedActions ? 24 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(25, !ctx.isTranscViewer ? 25 : -1);
      }
    }, dependencies: [IconComponent, MatMenuModule, MatMenu, MatMenuTrigger, FormsModule, CheckboxControlValueAccessor, NgControlStatus, NgModel, MatSlideToggleModule, MatTooltipModule, MatTooltip, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RtToolOptionsComponent, { className: "RtToolOptionsComponent", filePath: "src\\app\\rt\\components\\feeds\\rt-components\\rt-tool-options\\rt-tool-options.component.ts", lineNumber: 17 });
})();

// src/app/rt/pip/feed-line.pip.ts
var HighlightPipe = class _HighlightPipe {
  constructor(sanitizer) {
    this.sanitizer = sanitizer;
  }
  transform(value, searchTerm, currentMatchPosition, currentMatch, wholeWord = false, links, isDemostream) {
    if (!searchTerm) {
      if (isDemostream) {
        return this.wrapCurlyBracesDemo(value);
      }
      return this.wrapCurlyBraces(value, links);
    }
    const wordBoundary = wholeWord ? "\\b" : "";
    const regex = new RegExp(`${wordBoundary}(${searchTerm})${wordBoundary}`, "gi");
    let result = "";
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(value)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const currentClass = currentMatch && start === currentMatchPosition ? "current" : "";
      result += value.substring(lastIndex, start) + `<span class="highlight ${currentClass}">${value.substring(start, end)}</span>`;
      lastIndex = end;
    }
    result += value.substring(lastIndex);
    if (isDemostream) {
      return this.wrapCurlyBracesDemo(result);
    }
    return this.wrapCurlyBraces(result, links);
  }
  wrapCurlyBracesDemo(text) {
    return text.replace(/\{(.*?)\}/g, '<a  class="clickable-word cursor-pointer">{$1}</a>');
  }
  wrapCurlyBraces(text, links) {
    const linksSet = new Set(links);
    const allowAll = !links || links.length === 0;
    const result = text.replace(/\{(.*?)\}/g, (match, content) => {
      const fullMatch = `{${content}}`;
      if (allowAll || linksSet.has(fullMatch)) {
        return `<a class="clickable-word cursor-pointer">{${content}}</a>`;
      }
      return fullMatch;
    });
    return result.trim() === "" ? "" : result;
  }
  static {
    this.\u0275fac = function HighlightPipe_Factory(t) {
      return new (t || _HighlightPipe)(\u0275\u0275directiveInject(DomSanitizer, 16));
    };
  }
  static {
    this.\u0275pipe = /* @__PURE__ */ \u0275\u0275definePipe({ name: "highlight", type: _HighlightPipe, pure: true, standalone: true });
  }
};

// src/app/rt/components/feeds/rt-components/search-result/search-result.component.ts
var _forTrack0 = ($index, $item) => $item.line;
var _c0 = () => [];
var _c1 = (a0, a1, a2, a3, a4, a5) => [a0, a1, a2, a3, a4, a5, false];
function SearchResultComponent_Conditional_0_For_3_Conditional_5_For_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7);
    \u0275\u0275listener("click", function SearchResultComponent_Conditional_0_For_3_Conditional_5_For_2_Conditional_0_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const line_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.navigateToLine(line_r4.matchIndex));
    });
    \u0275\u0275elementStart(1, "span", 8);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 9)(4, "pre", 10);
    \u0275\u0275pipe(5, "highlight");
    \u0275\u0275text(6, "                        ");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const line_r4 = \u0275\u0275nextContext().$implicit;
    const page_r5 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("id", "search-" + page_r5.pg + "-" + line_r4.line);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", page_r5.pg, ".", line_r4.line + 1, "");
    \u0275\u0275advance(2);
    \u0275\u0275property("innerHTML", \u0275\u0275pipeBindV(5, 4, \u0275\u0275pureFunction6(13, _c1, line_r4.lineText, ctx_r1.search.searchTerm, ctx_r1.search.getCurrentMatchPosition(), ctx_r1.search.isCurrentMatch(line_r4.line + 1, page_r5.pg), ctx_r1.search.iswholeWord, \u0275\u0275pureFunction0(12, _c0))), \u0275\u0275sanitizeHtml);
  }
}
function SearchResultComponent_Conditional_0_For_3_Conditional_5_For_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const line_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(line_r4.line + 1);
  }
}
function SearchResultComponent_Conditional_0_For_3_Conditional_5_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, SearchResultComponent_Conditional_0_For_3_Conditional_5_For_2_Conditional_0_Template, 7, 20, "div", 6)(1, SearchResultComponent_Conditional_0_For_3_Conditional_5_For_2_Conditional_1_Template, 2, 1);
  }
  if (rf & 2) {
    const line_r4 = ctx.$implicit;
    \u0275\u0275conditional(0, line_r4.lineText ? 0 : 1);
  }
}
function SearchResultComponent_Conditional_0_For_3_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5);
    \u0275\u0275repeaterCreate(1, SearchResultComponent_Conditional_0_For_3_Conditional_5_For_2_Template, 2, 1, null, null, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const page_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275repeater(page_r5.lines);
  }
}
function SearchResultComponent_Conditional_0_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2)(1, "div", 3)(2, "span", 4);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(5, SearchResultComponent_Conditional_0_For_3_Conditional_5_Template, 3, 0, "div", 5);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const page_r5 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", \u0275\u0275pipeBind1(4, 3, "rt.searchResult.pagePrefix"), " ", page_r5.pg, "");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(5, page_r5.lines && page_r5.lines.length ? 5 : -1);
  }
}
function SearchResultComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0)(1, "icon", 1);
    \u0275\u0275listener("click", function SearchResultComponent_Conditional_0_Template_icon_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.hideresultr());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(2, SearchResultComponent_Conditional_0_For_3_Template, 6, 5, "div", 2, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.pages);
  }
}
var SearchResultComponent = class _SearchResultComponent {
  constructor(search, fds) {
    this.search = search;
    this.fds = fds;
    this.hideresult = new EventEmitter();
    this.destroy$ = new Subject();
    this.pages = [];
    this.search_subscription = this.search.currentMatch$.subscribe((index) => {
      this.scrollToSearchMatch();
    });
  }
  hideresultr() {
    this.hideresult.emit();
  }
  ngOnInit() {
    this.search.matches$.pipe(takeUntil(this.destroy$)).subscribe((ms) => {
      console.warn("SEARCH RESULT", ms.length);
      this.pages = this.modifySearchResult(ms);
    });
  }
  modifySearchResult(data) {
    data.forEach((a, index) => a.matchIndex = index);
    const dedupMap = data.reduce((map, item) => {
      const key = `${item.page}:${item.line}`;
      const existing = map.get(key);
      if (!existing || item.start < existing.start) {
        map.set(key, item);
      }
      return map;
    }, /* @__PURE__ */ new Map());
    const deduped = Array.from(dedupMap.values());
    const grouped = deduped.reduce((acc, item) => {
      if (!acc[item.page]) {
        acc[item.page] = [];
      }
      acc[item.page].push(item);
      return acc;
    }, {});
    Object.values(grouped).forEach((lines) => {
      lines.sort((a, b) => a.line - b.line || a.start - b.start);
    });
    const pages = Object.keys(grouped).map(Number).sort((a, b) => a - b).map((p) => ({
      title: `Page ${p + 1}`,
      pg: p + 1,
      collapsed: false,
      lines: grouped[p]
    }));
    return pages;
  }
  ngOnDestroy() {
    if (this.search_subscription) {
      this.search_subscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  scrollToSearchMatch() {
    try {
      let curMatch = this.search.getCurrentMatch();
      if (curMatch) {
        const page = curMatch.page;
        const line = curMatch.line;
        const el = document.getElementById(`search-${page}-${line}`);
        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
            // align element to top of viewport
            inline: "nearest"
          });
        }
      }
    } catch (error) {
      console.error("scrollToLastLine1", error);
    }
  }
  navigateToLine(matchIndex) {
    this.search.toMatch(matchIndex);
    this.fds.pauseEvent();
  }
  static {
    this.\u0275fac = function SearchResultComponent_Factory(t) {
      return new (t || _SearchResultComponent)(\u0275\u0275directiveInject(SearchService), \u0275\u0275directiveInject(FeedDisplayService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SearchResultComponent, selectors: [["search-result"]], outputs: { hideresult: "hideresult" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 1, vars: 1, consts: [[1, "text-xxs", "font-light", "bg-white", "px-5", "py-2.5", "h-fit", "max-h-[400px]", "overflow-auto"], ["name", "chvy", 1, "text-xs", "ms-auto", "block", "rotate-90", "absolute", "right-5", 3, "click"], [1, "border-b", "border-gray-300", "pb-2", "mb-4", "last:border-b-0"], [1, "flex", "items-center", "justify-between", "cursor-pointer", "select-none"], [1, "font-bold"], [1, "mt-1", "flex", "flex-col", "gap-1"], [1, "flex", "items-start", "gap-2", "relative", "cursor-pointer", 3, "id"], [1, "flex", "items-start", "gap-2", "relative", "cursor-pointer", 3, "click", "id"], [1, "w-10", "font-bold"], [1, "relative", "z-20"], [3, "innerHTML"], [1, "pl-4", "font-bold"]], template: function SearchResultComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, SearchResultComponent_Conditional_0_Template, 4, 0, "div", 0);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.pages && ctx.pages.length ? 0 : -1);
      }
    }, dependencies: [IconComponent, HighlightPipe, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SearchResultComponent, { className: "SearchResultComponent", filePath: "src\\app\\rt\\components\\feeds\\rt-components\\search-result\\search-result.component.ts", lineNumber: 32 });
})();

// src/app/rt/components/feeds/rt-components/rt-search-box/rt-search-box.component.ts
function RtSearchBoxComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 13);
    \u0275\u0275listener("click", function RtSearchBoxComponent_Conditional_5_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.clearsearch());
    });
    \u0275\u0275elementEnd();
  }
}
function RtSearchBoxComponent_Conditional_13_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 24)(2, "path", 25);
    \u0275\u0275element(3, "animateTransform", 26);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(4, "span", 27);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 1, "rt.searchBox.searching"));
  }
}
function RtSearchBoxComponent_Conditional_13_Conditional_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275textInterpolate2(" ", ctx_r2.currentMatch, " ", \u0275\u0275pipeBind1(1, 2, "rt.searchBox.of"), " ");
  }
}
function RtSearchBoxComponent_Conditional_13_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 17);
    \u0275\u0275template(1, RtSearchBoxComponent_Conditional_13_Conditional_3_Conditional_1_Template, 2, 4);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r2.totalMatches && ctx_r2.currentMatch ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", ctx_r2.totalMatches, " ", \u0275\u0275pipeBind1(3, 3, "rt.searchBox.matches"), "");
  }
}
function RtSearchBoxComponent_Conditional_13_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 28);
    \u0275\u0275listener("click", function RtSearchBoxComponent_Conditional_13_Conditional_10_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.showresult = true);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r2.totalMatches > 0 ? "" : "pointer-events-none opacity-50 ");
  }
}
function RtSearchBoxComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275listener("click", function RtSearchBoxComponent_Conditional_13_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "div", 15);
    \u0275\u0275listener("click", function RtSearchBoxComponent_Conditional_13_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275template(2, RtSearchBoxComponent_Conditional_13_Conditional_2_Template, 7, 3, "div", 16)(3, RtSearchBoxComponent_Conditional_13_Conditional_3_Template, 4, 5, "h6", 17);
    \u0275\u0275elementStart(4, "btn", 18);
    \u0275\u0275listener("click", function RtSearchBoxComponent_Conditional_13_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onPrevious());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 19);
    \u0275\u0275element(6, "path", 20);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "btn", 21);
    \u0275\u0275listener("click", function RtSearchBoxComponent_Conditional_13_Template_btn_click_7_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onNext());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(8, "svg", 19);
    \u0275\u0275element(9, "path", 22);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, RtSearchBoxComponent_Conditional_13_Conditional_10_Template, 1, 2, "icon", 23);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, ctx_r2.isSearching ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r2.totalMatches ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("square", true)("disabled", !ctx_r2.totalMatches || ctx_r2.currentMatch == 1);
    \u0275\u0275advance(3);
    \u0275\u0275property("square", true)("disabled", !ctx_r2.totalMatches || ctx_r2.currentMatch == ctx_r2.totalMatches);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(10, !ctx_r2.showresult ? 10 : -1);
  }
}
var RtSearchBoxComponent = class _RtSearchBoxComponent {
  constructor(searchService, fds) {
    this.searchService = searchService;
    this.fds = fds;
    this.searchTerm = "";
    this.menustate = "O";
    this.wholeWord = false;
    this.isSearching = false;
    this.isInputFocused = false;
    this.showresult = false;
  }
  clearsearch() {
    this.searchTerm = "";
    this.search();
  }
  ngOnInit() {
    if (this.searchService.searchTerm) {
      this.searchTerm = this.searchService.searchTerm;
      this.showresult = true;
    }
  }
  search() {
    if (this.searchTerm == "") {
      this.searchService.searchTerm = null;
      this.searchService.matches$.next([]);
      return;
    }
    const data = this.fds.getActiveFeedData();
    this.isSearching = true;
    this.searchService.search(this.searchTerm, data, this.wholeWord, false);
    this.showresult = true;
    this.isSearching = false;
    this.showresult = true;
    if ((this.fds.sessionDetail?.cStatus === "R" || this.fds.demoStream) && !this.fds.pausedState) {
      this.fds.pauseEvent();
    }
  }
  get totalMatches() {
    return this.searchService.matches$.value.length;
  }
  get currentMatch() {
    return this.searchService.currentMatch$.value + 1;
  }
  get currentPage() {
    const currentMatch = this.searchService.getCurrentMatch();
    return currentMatch ? currentMatch.page + 1 : 1;
  }
  onNext() {
    this.searchService.nextMatch();
    if ((this.fds.sessionDetail?.cStatus === "R" || this.fds.demoStream) && !this.fds.pausedState) {
      this.fds.pauseEvent();
    }
  }
  onPrevious() {
    this.searchService.previousMatch();
    if ((this.fds.sessionDetail?.cStatus === "R" || this.fds.demoStream) && !this.fds.pausedState) {
      this.fds.pauseEvent();
    }
  }
  static {
    this.\u0275fac = function RtSearchBoxComponent_Factory(t) {
      return new (t || _RtSearchBoxComponent)(\u0275\u0275directiveInject(SearchService), \u0275\u0275directiveInject(FeedDisplayService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RtSearchBoxComponent, selectors: [["rt-search-box"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 16, vars: 13, consts: [["srchinpt", ""], [1, "drag-boundary", "h-[calc(100vh-140px)]", "w-screen", "left-0", "absolute", "bg-transparent", "mt-3", "pointer-events-none"], ["cdkDrag", "", "cdkDragBoundary", ".drag-boundary", 1, "absolute", "w-[555px]", "right-0", "top-[0px]", "shadow-[0px_3px_7px_#0000004d]", "z-[999]", "pointer-events-auto", 3, "cdkDragDisabled"], [1, "flex", "bg-blue-deactivate", "p-2.5", "w-full"], [1, "flex", "gap-0"], [1, "relative", "w-40"], ["name", "close", 1, "absolute", "top-1/2", "-translate-y-1/2", "right-3", "text-xxs"], [1, "px-3.5", "py-2", "pe-9", "rounded-base", "placeholder-shown:bg-white", "bg-faint", "block", "w-full", "focus:shadow-[0px_0px_6px_#0066FF]", "border", "shadow-sm", "focus:outline-none", "text-xs", 3, "ngModelChange", "keyup.enter", "focus", "blur", "placeholder", "ngModel"], [1, "ms-2", "my-auto", 3, "ngModelChange", "change", "disabled", "ngModel"], [1, "whitespace-nowrap"], [1, "px-3", "ms-auto"], [1, "search-results", 3, "hidden"], [3, "hideresult"], ["name", "close", 1, "absolute", "top-1/2", "-translate-y-1/2", "right-3", "text-xxs", 3, "click"], [1, "px-3", "ms-auto", 3, "click"], [1, "flex", "items-center", "gap-2.5", 3, "click"], [1, "flex", "gap-2", "items-center"], [1, "text-xs", "whitespace-nowrap"], ["mode", "outlined", 1, "ms-auto", 3, "click", "square", "disabled"], ["width", "10", "height", "12", "viewBox", "0 0 10 12", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M1 0.75C0.818762 0.750008 0.643658 0.815643 0.50707 0.934767C0.370481 1.05389 0.281648 1.21845 0.257 1.398L0.25 1.5V10.5C0.250058 10.69 0.322244 10.8729 0.451972 11.0118C0.581701 11.1506 0.759299 11.2351 0.94888 11.248C1.13846 11.261 1.32589 11.2015 1.4733 11.0816C1.62071 10.9617 1.7171 10.7902 1.743 10.602L1.75 10.5V1.5C1.75 1.30109 1.67098 1.11032 1.53033 0.96967C1.38968 0.829018 1.19891 0.75 1 0.75ZM9.28 0.97C9.15301 0.842982 8.98466 0.765754 8.80555 0.752358C8.62644 0.738961 8.44847 0.790286 8.304 0.897L8.22 0.97L3.72 5.47C3.59298 5.59699 3.51575 5.76534 3.50236 5.94445C3.48896 6.12356 3.54029 6.30153 3.647 6.446L3.72 6.53L8.22 11.03C8.354 11.163 8.53321 11.2405 8.72186 11.2471C8.91051 11.2538 9.09473 11.189 9.23775 11.0658C9.38077 10.9426 9.47207 10.77 9.49344 10.5825C9.5148 10.3949 9.46465 10.2062 9.353 10.054L9.28 9.97L5.31 6L9.28 2.03C9.42045 1.88937 9.49934 1.69875 9.49934 1.5C9.49934 1.30125 9.42045 1.11063 9.28 0.97Z", "fill", "currentColor"], ["mode", "outlined", 3, "click", "square", "disabled"], ["d", "M8.75129 0.75C8.93253 0.750008 9.10763 0.815643 9.24422 0.934767C9.38081 1.05389 9.46964 1.21845 9.49429 1.398L9.50129 1.5V10.5C9.50124 10.69 9.42905 10.8729 9.29932 11.0118C9.16959 11.1506 8.99199 11.2351 8.80241 11.248C8.61283 11.261 8.4254 11.2015 8.27799 11.0816C8.13059 10.9617 8.03419 10.7902 8.00829 10.602L8.00129 10.5V1.5C8.00129 1.30109 8.08031 1.11032 8.22096 0.96967C8.36162 0.829018 8.55238 0.75 8.75129 0.75ZM0.471293 0.97C0.598281 0.842982 0.766636 0.765754 0.945745 0.752358C1.12485 0.738961 1.30282 0.790286 1.44729 0.897L1.53129 0.97L6.03129 5.47C6.15831 5.59699 6.23554 5.76534 6.24894 5.94445C6.26233 6.12356 6.21101 6.30153 6.10429 6.446L6.03129 6.53L1.53129 11.03C1.39729 11.163 1.21808 11.2405 1.02943 11.2471C0.840781 11.2538 0.656562 11.189 0.513542 11.0658C0.370521 10.9426 0.279218 10.77 0.257856 10.5825C0.236493 10.3949 0.286642 10.2062 0.398293 10.054L0.471293 9.97L4.44129 6L0.471293 2.03C0.330843 1.88937 0.251953 1.69875 0.251953 1.5C0.251953 1.30125 0.330843 1.11063 0.471293 0.97Z", "fill", "currentColor"], ["name", "chvy", 1, "text-xs", "ms-auto", "-rotate-90", "block", 3, "class"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 100 100", 0, "xml", "space", "preserve", 2, "height", "20px", "width", "20px"], ["fill", "#000", "d", "M73 50c0-12.7-10.3-23-23-23S27 37.3 27 50m3.9 0c0-10.5 8.5-19.1 19.1-19.1S69.1 39.5 69.1 50"], ["attributeName", "transform", "attributeType", "XML", "type", "rotate", "dur", "1s", "from", "0 50 50", "to", "360 50 50", "repeatCount", "indefinite"], [1, "text-xs"], ["name", "chvy", 1, "text-xs", "ms-auto", "-rotate-90", "block", 3, "click"]], template: function RtSearchBoxComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "div", 3)(3, "div", 4)(4, "div", 5);
        \u0275\u0275template(5, RtSearchBoxComponent_Conditional_5_Template, 1, 0, "icon", 6);
        \u0275\u0275elementStart(6, "input", 7, 0);
        \u0275\u0275pipe(8, "translate");
        \u0275\u0275twoWayListener("ngModelChange", function RtSearchBoxComponent_Template_input_ngModelChange_6_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.searchTerm, $event) || (ctx.searchTerm = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("keyup.enter", function RtSearchBoxComponent_Template_input_keyup_enter_6_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.search());
        })("focus", function RtSearchBoxComponent_Template_input_focus_6_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.isInputFocused = true);
        })("blur", function RtSearchBoxComponent_Template_input_blur_6_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.isInputFocused = false);
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(9, "mat-checkbox", 8);
        \u0275\u0275twoWayListener("ngModelChange", function RtSearchBoxComponent_Template_mat_checkbox_ngModelChange_9_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.wholeWord, $event) || (ctx.wholeWord = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("change", function RtSearchBoxComponent_Template_mat_checkbox_change_9_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.search());
        });
        \u0275\u0275elementStart(10, "span", 9);
        \u0275\u0275text(11);
        \u0275\u0275pipe(12, "translate");
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(13, RtSearchBoxComponent_Conditional_13_Template, 11, 7, "div", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "div", 11)(15, "search-result", 12);
        \u0275\u0275listener("hideresult", function RtSearchBoxComponent_Template_search_result_hideresult_15_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.showresult = false);
        });
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("cdkDragDisabled", ctx.isInputFocused);
        \u0275\u0275advance(4);
        \u0275\u0275conditional(5, ctx.searchTerm ? 5 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(8, 9, "rt.searchBox.placeholder"));
        \u0275\u0275twoWayProperty("ngModel", ctx.searchTerm);
        \u0275\u0275advance(3);
        \u0275\u0275property("disabled", !ctx.searchTerm);
        \u0275\u0275twoWayProperty("ngModel", ctx.wholeWord);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(12, 11, "rt.searchBox.wholeWord"), " ");
        \u0275\u0275advance(2);
        \u0275\u0275conditional(13, ctx.menustate == "O" ? 13 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("hidden", !ctx.showresult);
      }
    }, dependencies: [CdkDrag, IconComponent, MatCheckboxModule, MatCheckbox, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, ButtonComponent, SearchResultComponent, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RtSearchBoxComponent, { className: "RtSearchBoxComponent", filePath: "src\\app\\rt\\components\\feeds\\rt-components\\rt-search-box\\rt-search-box.component.ts", lineNumber: 19 });
})();

// src/app/rt/components/feeds/rt-components/rt-search/rt-search.component.ts
function RtSearchComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "rt-search-box");
  }
}
var RtSearchComponent = class _RtSearchComponent {
  constructor(searchService, annot) {
    this.searchService = searchService;
    this.annot = annot;
    this.showSearchBoxChange = new EventEmitter();
    this.disabled = false;
  }
  ngOnInit() {
    if (this.searchService.searchTerm) {
      this.showSearchBox = true;
    }
  }
  handleShowSearchBox() {
    if (this.showSearchBox) {
      this.searchService.clear();
    }
    if (this.visibleMarkNavModel) {
      this.visibleMarkNavModel = false;
      this.visibleMarkNavModelChange.emit(this.visibleMarkNavModel);
    }
    if (this.visibleIssueModel) {
      this.visibleIssueModel = false;
      this.visibleIssueModelChange.emit(this.visibleIssueModel);
    }
    if (this.indexEnabled) {
      this.indexEnabled = false;
      this.searchService.clearIndex();
      this.indexEnabledChange.emit(this.indexEnabled);
    }
    if (this.hightlightMode) {
      this.annot.removeTemp();
      this.hightlightMode = null;
      this.hightlightModeChange.emit(this.hightlightMode);
    }
    this.showSearchBox = !this.showSearchBox;
    this.showSearchBoxChange.emit(this.showSearchBox);
  }
  static {
    this.\u0275fac = function RtSearchComponent_Factory(t) {
      return new (t || _RtSearchComponent)(\u0275\u0275directiveInject(SearchService), \u0275\u0275directiveInject(AnnotsService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RtSearchComponent, selectors: [["rt-search"]], inputs: { showSearchBox: "showSearchBox", disabled: "disabled", visibleMarkNavModel: "visibleMarkNavModel", visibleMarkNavModelChange: "visibleMarkNavModelChange", visibleIssueModel: "visibleIssueModel", visibleIssueModelChange: "visibleIssueModelChange", indexEnabled: "indexEnabled", indexEnabledChange: "indexEnabledChange", hightlightMode: "hightlightMode", hightlightModeChange: "hightlightModeChange" }, outputs: { showSearchBoxChange: "showSearchBoxChange" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 4, vars: 6, consts: [["square", "", "mode", "outlined", "addcls", "hover:bg-white", 3, "click", "matTooltip", "active", "disabled"], ["name", "search", 1, "text-sm"]], template: function RtSearchComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "btn", 0);
        \u0275\u0275pipe(1, "translate");
        \u0275\u0275listener("click", function RtSearchComponent_Template_btn_click_0_listener() {
          return ctx.handleShowSearchBox();
        });
        \u0275\u0275element(2, "icon", 1);
        \u0275\u0275elementEnd();
        \u0275\u0275template(3, RtSearchComponent_Conditional_3_Template, 1, 0, "rt-search-box");
      }
      if (rf & 2) {
        \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(1, 4, "rt.search.tooltip"))("active", ctx.showSearchBox)("disabled", ctx.disabled);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(3, ctx.showSearchBox ? 3 : -1);
      }
    }, dependencies: [ButtonComponent, IconComponent, RtSearchBoxComponent, MatTooltipModule, MatTooltip, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RtSearchComponent, { className: "RtSearchComponent", filePath: "src\\app\\rt\\components\\feeds\\rt-components\\rt-search\\rt-search.component.ts", lineNumber: 18 });
})();

// src/app/rt/components/feeds/rt-components/rt-compare/rt-compare.component.ts
var _forTrack02 = ($index, $item) => $item.nSesid;
function RtCompareComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1)(2, "span", 2);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 3);
    \u0275\u0275listener("click", function RtCompareComponent_Conditional_0_Template_span_click_7_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeCompare());
    });
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "icon", 4);
    \u0275\u0275listener("click", function RtCompareComponent_Conditional_0_Template_icon_click_10_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeCompare());
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 3, "rt.compare.modeTitle"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" \xA0", \u0275\u0275pipeBind1(6, 5, "rt.compare.modeSubtitle"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(9, 7, "rt.compare.exit"));
  }
}
function RtCompareComponent_Conditional_1_For_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 15);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4.nSesid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r4.cName, " ");
  }
}
function RtCompareComponent_Conditional_1_For_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 15);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275property("value", x_r5.nSesid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r5.cName, " ");
  }
}
function RtCompareComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5)(1, "span", 6);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 7)(3, "mask", 8);
    \u0275\u0275element(4, "path", 9);
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "path", 10);
    \u0275\u0275elementStart(6, "mask", 8);
    \u0275\u0275element(7, "path", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275element(8, "path", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(11, "mat-form-field", 13)(12, "mat-select", 14);
    \u0275\u0275pipe(13, "translate");
    \u0275\u0275twoWayListener("ngModelChange", function RtCompareComponent_Conditional_1_Template_mat_select_ngModelChange_12_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.selectedSessionL, $event) || (ctx_r1.selectedSessionL = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275repeaterCreate(14, RtCompareComponent_Conditional_1_For_15_Template, 2, 2, "mat-option", 15, _forTrack02);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "span", 16);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(17, "svg", 17);
    \u0275\u0275element(18, "path", 18)(19, "path", 19);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(20, "mat-form-field", 13)(21, "mat-select", 14);
    \u0275\u0275pipe(22, "translate");
    \u0275\u0275twoWayListener("ngModelChange", function RtCompareComponent_Conditional_1_Template_mat_select_ngModelChange_21_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.selectedSessionR, $event) || (ctx_r1.selectedSessionR = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275repeaterCreate(23, RtCompareComponent_Conditional_1_For_24_Template, 2, 2, "mat-option", 15, _forTrack02);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(25, "btn", 20);
    \u0275\u0275listener("click", function RtCompareComponent_Conditional_1_Template_btn_click_25_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.startcomapre());
    });
    \u0275\u0275text(26);
    \u0275\u0275pipe(27, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "icon", 4);
    \u0275\u0275listener("click", function RtCompareComponent_Conditional_1_Template_icon_click_28_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeCompareTool());
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275attribute("id", "rtc-a-" + ctx_r1.svgIdSuffix);
    \u0275\u0275advance(2);
    \u0275\u0275attribute("mask", "url(#rtc-a-" + ctx_r1.svgIdSuffix + ")");
    \u0275\u0275advance();
    \u0275\u0275attribute("id", "rtc-b-" + ctx_r1.svgIdSuffix);
    \u0275\u0275advance(2);
    \u0275\u0275attribute("mask", "url(#rtc-b-" + ctx_r1.svgIdSuffix + ")");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(10, 11, "rt.compare.label"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(13, 13, "rt.compare.selectTranscript"));
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.selectedSessionL);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.transcriptList);
    \u0275\u0275advance(7);
    \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(22, 15, "rt.compare.selectTranscript"));
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.selectedSessionR);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.transcriptList);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !ctx_r1.selectedSessionL && !ctx_r1.selectedSessionR);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(27, 17, "rt.compare.go"), " ");
  }
}
var RtCompareComponent = class _RtCompareComponent {
  static {
    this.instanceCounter = 0;
  }
  constructor(tost, translate) {
    this.tost = tost;
    this.translate = translate;
    this.transcriptList = [];
    this.compareToolChange = new EventEmitter();
    this.svgIdSuffix = `${++_RtCompareComponent.instanceCounter}`;
  }
  startcomapre() {
    if (!this.selectedSessionL && !this.selectedSessionR) {
      this.tost.error(this.translate.instant("rt.compare.errorSelectSession"));
      return;
    }
    this.realtimeEvent.emit({ type: "COMPARE-MODE-ENABLED", data: { selectedSessionL: this.selectedSessionL, selectedSessionR: this.selectedSessionR } });
  }
  closeCompare() {
    this.realtimeEvent.emit({ type: "COMPARE-MODE-CLOSED", data: { selectedSessionL: this.selectedSessionL, selectedSessionR: this.selectedSessionR } });
  }
  closeCompareTool() {
    this.compareTool = false;
    this.compareToolChange.emit(this.compareTool);
  }
  static {
    this.\u0275fac = function RtCompareComponent_Factory(t) {
      return new (t || _RtCompareComponent)(\u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(TranslateService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RtCompareComponent, selectors: [["rt-compare"]], inputs: { transcriptList: "transcriptList", compareEnabled: "compareEnabled", compareTool: "compareTool", realtimeEvent: "realtimeEvent" }, outputs: { compareToolChange: "compareToolChange" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [[1, "w-full", "flex", "items-center", "border-dashed", "gap-2.5", "border", "border-blue-deactivate", "h-[34px]", "px-3", "rounded-md"], [1, "text-sm", "text-white"], [1, "font-semibold"], [1, "text-xs", "text-white", "cursor-pointer", "underline", "ms-auto", 3, "click"], ["name", "close", 1, "text-xs", "text-white", "ms-3", 3, "click"], [1, "bg-dark-blue", "flex", "items-center", "gap-2.5", "h-fit"], [1, "text-white", "ms-auto", "flex", "items-center", "gap-3", "text-sm", "font-semibold", "me-3"], ["xmlns", "http://www.w3.org/2000/svg", "width", "17", "height", "10", "fill", "none", "viewBox", "0 0 17 10"], ["fill", "#fff"], ["d", "m0 1 1-1h5l1 1v8l-1 1H1L0 9V1Z"], ["stroke", "#ffffff", "stroke-width", "4", "d", "m0 1 1-1h5l1 1v8l-1 1H1L0 9V1Z"], ["d", "m10 1 1-1h5l1 1v8l-1 1h-5l-1-1V1Z"], ["stroke", "#ffffff", "stroke-width", "4", "d", "m10 1 1-1h5l1 1v8l-1 1h-5l-1-1V1Z"], [1, "bg-white", "w-36"], [3, "ngModelChange", "placeholder", "ngModel"], [3, "value"], [1, "text-white", "text-xs"], ["xmlns", "http://www.w3.org/2000/svg", "width", "24", "height", "24", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "lucide", "lucide-plus-icon", "lucide-plus"], ["d", "M5 12h14"], ["d", "M12 5v14"], [3, "click", "disabled"]], template: function RtCompareComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, RtCompareComponent_Conditional_0_Template, 11, 9, "div", 0)(1, RtCompareComponent_Conditional_1_Template, 29, 19);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.compareEnabled ? 0 : 1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatOption, ButtonComponent, IconComponent, FormsModule, NgControlStatus, NgModel, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RtCompareComponent, { className: "RtCompareComponent", filePath: "src\\app\\rt\\components\\feeds\\rt-components\\rt-compare\\rt-compare.component.ts", lineNumber: 18 });
})();

// src/app/shared/directive/only-number.directive.ts
var OnlyNumberDirective = class _OnlyNumberDirective {
  constructor(el) {
    this.el = el;
    this.regex = new RegExp(/^[0-9]*$/);
    this.value = "";
  }
  onInputChange(event) {
    console.log("input change");
    const input = this.el.nativeElement;
    const value = input.value;
    if (!this.regex.test(value)) {
      input.value = value.replace(/[^0-9]/g, "");
    }
  }
  static {
    this.\u0275fac = function OnlyNumberDirective_Factory(t) {
      return new (t || _OnlyNumberDirective)(\u0275\u0275directiveInject(ElementRef));
    };
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({ type: _OnlyNumberDirective, selectors: [["", "appOnlyNumber", ""]], hostBindings: function OnlyNumberDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("input", function OnlyNumberDirective_input_HostBindingHandler($event) {
          return ctx.onInputChange($event);
        });
      }
    }, inputs: { value: [InputFlags.None, "appOnlyNumber", "value"] }, standalone: true });
  }
};

// src/app/rt/components/feeds/rt-components/toolbar/toolbar.component.ts
var _forTrack03 = ($index, $item) => $item.nSesid;
function ToolbarComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "rt-compare", 3);
    \u0275\u0275twoWayListener("compareToolChange", function ToolbarComponent_Conditional_1_Template_rt_compare_compareToolChange_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.compareTool, $event) || (ctx_r1.compareTool = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("compareTool", ctx_r1.compareTool);
    \u0275\u0275property("transcriptList", ctx_r1.transcriptList)("realtimeEvent", ctx_r1.realtimeEvent)("compareEnabled", ctx_r1.compareEnabled);
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(1, 1, "rt.toolbar.loading"), " ");
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "button", 15)(1, "span", 18);
    \u0275\u0275text(2, "...");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const sessionMenu_r5 = \u0275\u0275reference(4);
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("matMenuTriggerFor", sessionMenu_r5);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r1.isTranscViewer ? "text-neutral-600" : "text-white");
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_For_6_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275text(1, "Live");
    \u0275\u0275elementEnd();
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_For_6_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1, "Draft");
    \u0275\u0275elementEnd();
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_For_6_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 23);
    \u0275\u0275element(1, "path", 25);
    \u0275\u0275elementEnd();
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_For_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 19);
    \u0275\u0275listener("click", function ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_For_6_Template_button_click_0_listener() {
      const session_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.changeSession(session_r7));
    });
    \u0275\u0275elementStart(1, "div", 20)(2, "span", 21);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_For_6_Conditional_4_Template, 2, 0, "span", 22)(5, ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_For_6_Conditional_5_Template, 2, 0)(6, ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_For_6_Conditional_6_Template, 2, 0, ":svg:svg", 23);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const session_r7 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275classProp("bg-blue-50", session_r7.nSesid === ctx_r1.nSesid);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(session_r7.cName);
    \u0275\u0275advance();
    \u0275\u0275conditional(4, session_r7.cStatus === "R" ? 4 : session_r7.cStatus !== "P" && !(session_r7.isTranscript && session_r7.isUploaded) ? 5 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(6, session_r7.nSesid === ctx_r1.nSesid ? 6 : -1);
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275template(2, ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_Conditional_2_Template, 3, 2, "button", 15);
    \u0275\u0275elementStart(3, "mat-menu", 16, 0);
    \u0275\u0275repeaterCreate(5, ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_For_6_Template, 7, 5, "button", 17, _forTrack03);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275textInterpolate1(" ", (ctx_r1.sessionDetail == null ? null : ctx_r1.sessionDetail.cName) || \u0275\u0275pipeBind1(1, 2, "rt.toolbar.selectSession"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, !ctx_r1.hideSecondaryActions ? 2 : -1);
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r1.sessionList);
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275element(3, "span", 26);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("ngClass", ctx_r1.isTranscViewer ? "text-neutral-600" : "text-white");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 2, "rt.toolbar.refreshing"), " ");
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 27);
    \u0275\u0275listener("click", function ToolbarComponent_Conditional_2_Conditional_0_Conditional_13_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.handleIndex());
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("disabled", !ctx_r1.nSesid)("active", ctx_r1.indexEnabled);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 3, "rt.toolbar.index"), " ");
  }
}
function ToolbarComponent_Conditional_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 9);
    \u0275\u0275template(1, ToolbarComponent_Conditional_2_Conditional_0_Conditional_1_Template, 2, 3)(2, ToolbarComponent_Conditional_2_Conditional_0_Conditional_2_Template, 7, 4)(3, ToolbarComponent_Conditional_2_Conditional_0_Conditional_3_Template, 4, 4, "div", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 11);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 12)(8, "span", 13);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "input", 14);
    \u0275\u0275pipe(12, "translate");
    \u0275\u0275listener("keyup.enter", function ToolbarComponent_Conditional_2_Conditional_0_Template_input_keyup_enter_11_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPageChange());
    })("blur", function ToolbarComponent_Conditional_2_Conditional_0_Template_input_blur_11_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPageChange());
    });
    \u0275\u0275twoWayListener("ngModelChange", function ToolbarComponent_Conditional_2_Conditional_0_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.pageInputValue, $event) || (ctx_r1.pageInputValue = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(13, ToolbarComponent_Conditional_2_Conditional_0_Conditional_13_Template, 3, 5, "btn", 7);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", ctx_r1.isTranscViewer ? "text-neutral-800" : "text-white");
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r1.isLoading ? 1 : 2);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r1.fds.refreshingEnalbed ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r1.isTranscViewer ? "text-neutral-600" : "text-white");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 14, "rt.toolbar.goTo"));
    \u0275\u0275advance(2);
    \u0275\u0275styleProp("min-width", (ctx_r1.pageInputValue == null ? null : ctx_r1.pageInputValue.length) === 1 || !ctx_r1.pageInputValue ? "70px" : (ctx_r1.pageInputValue == null ? null : ctx_r1.pageInputValue.length) === 2 ? "80px" : (ctx_r1.pageInputValue == null ? null : ctx_r1.pageInputValue.length) === 3 ? "90px" : "70px");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(10, 16, "rt.toolbar.page"));
    \u0275\u0275advance(2);
    \u0275\u0275property("min", 0)("max", 999)("placeholder", \u0275\u0275pipeBind1(12, 18, "rt.toolbar.pagePlaceholder"));
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.pageInputValue);
    \u0275\u0275property("disabled", !ctx_r1.nSesid);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(13, !ctx_r1.splitScreenEnabled ? 13 : -1);
  }
}
function ToolbarComponent_Conditional_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 28);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_Conditional_2_Conditional_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openCompareTool());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 29)(3, "mask", 30);
    \u0275\u0275element(4, "path", 31);
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "path", 32);
    \u0275\u0275elementStart(6, "mask", 30);
    \u0275\u0275element(7, "path", 33);
    \u0275\u0275elementEnd();
    \u0275\u0275element(8, "path", 34);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(1, 6, "rt.toolbar.compare"))("square", true);
    \u0275\u0275advance(3);
    \u0275\u0275attribute("id", "cmp-a-" + ctx_r1.svgIdSuffix);
    \u0275\u0275advance(2);
    \u0275\u0275attribute("mask", "url(#cmp-a-" + ctx_r1.svgIdSuffix + ")");
    \u0275\u0275advance();
    \u0275\u0275attribute("id", "cmp-b-" + ctx_r1.svgIdSuffix);
    \u0275\u0275advance(2);
    \u0275\u0275attribute("mask", "url(#cmp-b-" + ctx_r1.svgIdSuffix + ")");
  }
}
function ToolbarComponent_Conditional_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "selection-actions-control", 6);
  }
  if (rf & 2) {
    \u0275\u0275property("dark", false);
  }
}
function ToolbarComponent_Conditional_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 27);
    \u0275\u0275listener("click", function ToolbarComponent_Conditional_2_Conditional_4_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openMarkNav());
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("disabled", !ctx_r1.nSesid)("active", ctx_r1.visibleMarkNavModel);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 3, "rt.toolbar.markNav"), " ");
  }
}
function ToolbarComponent_Conditional_2_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "rt-tool-options", 35);
    \u0275\u0275listener("demoToggled", function ToolbarComponent_Conditional_2_Conditional_5_Template_rt_tool_options_demoToggled_0_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onDemoToggled());
    })("exportTranscript", function ToolbarComponent_Conditional_2_Conditional_5_Template_rt_tool_options_exportTranscript_0_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.handleExportTranscript());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("visibleIssueModelChange", ctx_r1.visibleIssueModelChange)("showTimestampChange", ctx_r1.showTimestampChange)("showTimestamp", ctx_r1.showTimestamp)("isDisable", !ctx_r1.nSesid)("isSessionLive", ctx_r1.isSessionLive)("zoomLevel", ctx_r1.zoomLevel)("zoomLevelChange", ctx_r1.zoomLevelChange)("fullViewMode", ctx_r1.fullViewMode)("fullViewModeChange", ctx_r1.fullViewModeChange)("compareEnabled", ctx_r1.compareEnabled)("indexEnabled", ctx_r1.indexEnabled)("indexEnabledChange", ctx_r1.indexEnabledChange)("visibleMarkNavModel", ctx_r1.visibleMarkNavModel)("visibleMarkNavModelChange", ctx_r1.visibleMarkNavModelChange)("isTranscViewer", ctx_r1.isTranscViewer)("limitedActions", ctx_r1.limitedActions);
  }
}
function ToolbarComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275template(0, ToolbarComponent_Conditional_2_Conditional_0_Template, 14, 20)(1, ToolbarComponent_Conditional_2_Conditional_1_Template, 9, 8, "btn", 4);
    \u0275\u0275elementStart(2, "rt-search", 5);
    \u0275\u0275twoWayListener("showSearchBoxChange", function ToolbarComponent_Conditional_2_Template_rt_search_showSearchBoxChange_2_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.showSearchBox, $event) || (ctx_r1.showSearchBox = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, ToolbarComponent_Conditional_2_Conditional_3_Template, 1, 1, "selection-actions-control", 6)(4, ToolbarComponent_Conditional_2_Conditional_4_Template, 3, 5, "btn", 7)(5, ToolbarComponent_Conditional_2_Conditional_5_Template, 1, 16, "rt-tool-options", 8);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, !ctx_r1.compareEnabled ? 0 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r1.hideSecondaryActions && !ctx_r1.compareEnabled && !ctx_r1.splitScreenEnabled && !ctx_r1.limitedActions ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !ctx_r1.nSesid);
    \u0275\u0275twoWayProperty("showSearchBox", ctx_r1.showSearchBox);
    \u0275\u0275property("visibleMarkNavModel", ctx_r1.visibleMarkNavModel)("visibleMarkNavModelChange", ctx_r1.visibleMarkNavModelChange)("visibleIssueModel", ctx_r1.visibleIssueModel)("visibleIssueModelChange", ctx_r1.visibleIssueModelChange)("indexEnabled", ctx_r1.indexEnabled)("indexEnabledChange", ctx_r1.indexEnabledChange)("hightlightMode", ctx_r1.hightlightMode)("hightlightModeChange", ctx_r1.hightlightModeChange);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, !ctx_r1.hideSecondaryActions ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(4, !ctx_r1.hideSecondaryActions ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(5, !ctx_r1.hideSecondaryActions ? 5 : -1);
  }
}
var ToolbarComponent = class _ToolbarComponent {
  static {
    this.instanceCounter = 0;
  }
  constructor(toolbarService, fds, searchService, annot, selectionActions, communicationService) {
    this.toolbarService = toolbarService;
    this.fds = fds;
    this.searchService = searchService;
    this.annot = annot;
    this.selectionActions = selectionActions;
    this.communicationService = communicationService;
    this.cdr = inject(ChangeDetectorRef);
    this.fullViewModeChange = new EventEmitter();
    this.visibleIssueModelChange = new EventEmitter();
    this.nSesidChange = new EventEmitter();
    this.sessionList = [];
    this.transcriptList = [];
    this.pageInputValue = "";
    this.toolBarEvents = new EventEmitter();
    this.isLoading = true;
    this.svgIdSuffix = `${++_ToolbarComponent.instanceCounter}`;
    this.showTimestampChange = new EventEmitter();
    this.zoomLevelChange = new EventEmitter();
    this.currentPageChange = new EventEmitter();
    this.visibleMarkNavModelChange = new EventEmitter();
    this.indexEnabledChange = new EventEmitter();
    this.showSearchBox = false;
    this.hightlightModeChange = new EventEmitter();
    this.hideSecondaryActions = false;
    this.limitedActions = false;
    this.isCopyToClipboard = false;
    this.isCopyDocName = false;
    this.isCopyPagination = false;
    this.lastManualPageChangeAt = 0;
    let firstRun = true;
    effect(() => {
      const state = this.selectionActions.state();
      const isCopy = this.selectionActions.isCopy();
      if (firstRun) {
        firstRun = false;
        return;
      }
      this.isCopyToClipboard = isCopy;
      this.isCopyDocName = state.copyDocName;
      this.isCopyPagination = state.copyPagination;
      this.toolBarEvents.emit({
        type: "COPY-TO-CLIP",
        data: {
          copy: isCopy,
          showName: state.copyDocName,
          showPagination: state.copyPagination
        }
      });
      this.cdr.markForCheck();
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      if (this.compareEnabled) {
        this.isLoading = false;
        return;
      }
      this.fillPageNo();
      this.getSessionList();
      this.refreshSessionSub = this.communicationService.functionCalled$.subscribe((data) => {
        if (data?.event === "REFRESH-SESSION-V2") {
          this.getSessionList();
        }
      });
    });
  }
  ngOnDestroy() {
    this.refreshSessionSub?.unsubscribe();
  }
  static {
    this.MANUAL_JUMP_LOCK_MS = 3e3;
  }
  ngOnChanges(changes) {
    if (changes["currentPage"] && !changes["currentPage"].firstChange) {
      const recentlyManual = Date.now() - this.lastManualPageChangeAt < _ToolbarComponent.MANUAL_JUMP_LOCK_MS;
      if (!recentlyManual) {
        this.fillPageNo();
      }
    }
    if (changes["visibleIssueModel"] && !changes["visibleIssueModel"].firstChange && this.visibleIssueModel) {
      this.clearSearchIfVisible();
    }
    if (changes["hightlightMode"] && !changes["hightlightMode"].firstChange && this.hightlightMode) {
      this.clearSearchIfVisible();
    }
  }
  clearSearchIfVisible() {
    if (this.showSearchBox) {
      this.searchService.clear();
      this.showSearchBox = false;
    }
  }
  getSessionList() {
    return __async(this, null, function* () {
      this.sessionList = yield this.toolbarService.getSessionList(this.nCaseid, this.nUserid);
      this.transcriptList = yield this.toolbarService.getSessionList(this.nCaseid, this.nUserid, "true");
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }
  changeSession(x) {
    this.nSesid = x.nSesid;
    console.log(this.nSesid);
    this.nSesidChange.emit(this.nSesid);
  }
  openCompareTool() {
    if (this.showSearchBox) {
      this.searchService.clear();
      this.showSearchBox = false;
    }
    if (this.visibleMarkNavModel) {
      this.visibleMarkNavModel = false;
      this.visibleMarkNavModelChange.emit(this.visibleMarkNavModel);
    }
    if (this.visibleIssueModel) {
      this.visibleIssueModel = false;
      this.visibleIssueModelChange.emit(this.visibleIssueModel);
    }
    if (this.indexEnabled) {
      this.indexEnabled = false;
      this.searchService.clearIndex();
      this.indexEnabledChange.emit(this.indexEnabled);
    }
    if (this.isTranscViewer) {
      this.compareTool = false;
      this.toolBarEvents.emit({ type: "COMPARE_MODE", data: true });
      return;
    }
    this.compareTool = true;
  }
  OnPageChange() {
    if (!this.pageInputValue)
      return;
    const pg = parseInt(this.pageInputValue, 10);
    if (isNaN(pg) || pg < 1)
      return;
    this.lastManualPageChangeAt = Date.now();
    this.currentPage = pg;
    this.pageInputValue = String(pg);
    this.currentPageChange.emit(this.currentPage);
    this.fds.pauseEvent();
  }
  openMarkNav() {
    if (this.showSearchBox) {
      this.searchService.clear();
      this.showSearchBox = false;
    }
    if (this.visibleIssueModel) {
      this.visibleIssueModel = false;
      this.visibleIssueModelChange.emit(this.visibleIssueModel);
    }
    if (this.indexEnabled) {
      this.indexEnabled = false;
      this.searchService.clearIndex();
      this.indexEnabledChange.emit(this.indexEnabled);
    }
    if (this.hightlightMode) {
      this.annot.removeTemp();
      this.hightlightMode = null;
      this.hightlightModeChange.emit(this.hightlightMode);
    }
    this.visibleMarkNavModel = !this.visibleMarkNavModel;
    this.visibleMarkNavModelChange.emit(this.visibleMarkNavModel);
  }
  // ---- Mark / Copy-to-clipboard handlers (mirror pdf toolbar.component.ts:676-709) ----
  toggleCopyToClipboard() {
    this.isCopyToClipboard = !this.isCopyToClipboard;
    this.emitCopyState();
  }
  onCopyOptionChange(flag, ev) {
    if (flag === "N")
      this.isCopyDocName = ev.checked;
    if (flag === "P")
      this.isCopyPagination = ev.checked;
    this.isCopyToClipboard = this.isCopyDocName || this.isCopyPagination;
    this.emitCopyState();
  }
  emitCopyState() {
    this.toolBarEvents.emit({
      type: "COPY-TO-CLIP",
      data: {
        copy: this.isCopyToClipboard,
        showName: this.isCopyDocName,
        showPagination: this.isCopyPagination
      }
    });
  }
  resumePause() {
    this.fds.resumePause();
  }
  pauseEvent() {
    this.fds.pauseEvent();
  }
  handleIndex() {
    if (this.showSearchBox) {
      this.searchService.clear();
      this.showSearchBox = false;
    }
    if (this.visibleMarkNavModel) {
      this.visibleMarkNavModel = false;
      this.visibleMarkNavModelChange.emit(this.visibleMarkNavModel);
    }
    if (this.visibleIssueModel) {
      this.visibleIssueModel = false;
      this.visibleIssueModelChange.emit(this.visibleIssueModel);
    }
    if (this.hightlightMode) {
      this.annot.removeTemp();
      this.hightlightMode = null;
      this.hightlightModeChange.emit(this.hightlightMode);
    }
    this.indexEnabled = !this.indexEnabled;
    if (!this.indexEnabled) {
      this.searchService.clearIndex();
    }
    this.indexEnabledChange.emit(this.indexEnabled);
  }
  fillPageNo() {
    if (this.currentPage) {
      this.pageInputValue = String(Math.floor(this.currentPage));
    } else {
      this.pageInputValue = "";
    }
  }
  onDemoToggled() {
    this.toolBarEvents.emit({ type: "TOGGLE-DEMO", data: null });
  }
  handleExportTranscript() {
    this.toolBarEvents.emit({ type: "EXPORT-TRANSCRIPT", data: null });
  }
  static {
    this.\u0275fac = function ToolbarComponent_Factory(t) {
      return new (t || _ToolbarComponent)(\u0275\u0275directiveInject(ToolbarService), \u0275\u0275directiveInject(FeedDisplayService), \u0275\u0275directiveInject(SearchService), \u0275\u0275directiveInject(AnnotsService), \u0275\u0275directiveInject(SelectionActionsService), \u0275\u0275directiveInject(CommunicationService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ToolbarComponent, selectors: [["rt-toolbar"]], inputs: { nUserid: "nUserid", nCaseid: "nCaseid", compareEnabled: "compareEnabled", fullViewMode: "fullViewMode", visibleIssueModel: "visibleIssueModel", nSesid: "nSesid", sessionDetail: "sessionDetail", realtimeEvent: "realtimeEvent", showTimestamp: "showTimestamp", zoomLevel: "zoomLevel", currentPage: "currentPage", visibleMarkNavModel: "visibleMarkNavModel", splitScreenEnabled: "splitScreenEnabled", isSessionLive: "isSessionLive", indexEnabled: "indexEnabled", hightlightMode: "hightlightMode", isTranscViewer: "isTranscViewer", hideSecondaryActions: "hideSecondaryActions", limitedActions: "limitedActions" }, outputs: { fullViewModeChange: "fullViewModeChange", visibleIssueModelChange: "visibleIssueModelChange", nSesidChange: "nSesidChange", toolBarEvents: "toolBarEvents", showTimestampChange: "showTimestampChange", zoomLevelChange: "zoomLevelChange", currentPageChange: "currentPageChange", visibleMarkNavModelChange: "visibleMarkNavModelChange", indexEnabledChange: "indexEnabledChange", hightlightModeChange: "hightlightModeChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 3, consts: [["sessionMenu", "matMenu"], [1, "ps-10", "pe-5", "justify-end", "py-3", "flex", "items-center", "gap-2.5", "h-fit", "translate-y-0", "transition-all", "duration-300", "ease-in-out", "z-40", 3, "ngClass"], [1, "w-full", 3, "compareTool", "transcriptList", "realtimeEvent", "compareEnabled"], [1, "w-full", 3, "compareToolChange", "compareTool", "transcriptList", "realtimeEvent", "compareEnabled"], ["mode", "outlined", "addcls", "hover:bg-white", 3, "matTooltip", "square"], [3, "showSearchBoxChange", "disabled", "showSearchBox", "visibleMarkNavModel", "visibleMarkNavModelChange", "visibleIssueModel", "visibleIssueModelChange", "indexEnabled", "indexEnabledChange", "hightlightMode", "hightlightModeChange"], [3, "dark"], ["mode", "outlined", "addcls", "hover:bg-white", 3, "disabled", "active"], [3, "visibleIssueModelChange", "showTimestampChange", "showTimestamp", "isDisable", "isSessionLive", "zoomLevel", "zoomLevelChange", "fullViewMode", "fullViewModeChange", "compareEnabled", "indexEnabled", "indexEnabledChange", "visibleMarkNavModel", "visibleMarkNavModelChange", "isTranscViewer", "limitedActions"], [1, "text-sm", "font-semibold", "truncate", "whitespace-nowrap", "me-auto", "flex", "items-center", "gap-2", 3, "ngClass"], [1, "flex", "items-center", "font-medium", "text-xs", 3, "ngClass"], [1, "text-xs", "whitespace-nowrap", 3, "ngClass"], [1, "relative", "w-[70px]", "transition-all"], ["name", "search", 1, "absolute", "top-1/2", "-translate-y-1/2", "left-3", "text-xs"], ["type", "text", "appOnlyNumber", "", "maxlength", "3", 1, "py-2", "ps-11", "!h-[34px]", "!rounded-base", "placeholder-shown:bg-white", "bg-faint", "block", "w-full", "!border", "shadow-sm", "focus:outline-none", "!text-xs", 3, "keyup.enter", "blur", "ngModelChange", "min", "max", "placeholder", "ngModel", "disabled"], [1, "cursor-pointer", "rounded-full", "p-1", "transition-colors", 3, "matMenuTriggerFor"], [1, "custom-mat-menu"], ["mat-menu-item", "", 1, "!h-[35px]", "!line-clamp-1", 3, "bg-blue-50"], [1, "text-lg", "font-bold", "leading-none", "pb-2", "block", 3, "ngClass"], ["mat-menu-item", "", 1, "!h-[35px]", "!line-clamp-1", 3, "click"], [1, "flex", "items-center", "justify-between", "w-full", "gap-2"], [1, "text-sm", "font-semibold", "truncate"], [1, "inline-flex", "items-center", "px-2", "py-0.5", "text-[10px]", "font-semibold", "rounded-full", "bg-green-100", "text-green-700", "border", "border-green-400"], ["width", "12", "height", "12", "viewBox", "0 0 12 12", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], [1, "inline-flex", "items-center", "px-2", "py-0.5", "text-[10px]", "font-semibold", "rounded-full", "bg-amber-100", "text-amber-700", "border", "border-amber-400"], ["d", "M10 3L4.5 8.5L2 6", "stroke", "white", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round"], [1, "loader", "mx-3"], ["mode", "outlined", "addcls", "hover:bg-white", 3, "click", "disabled", "active"], ["mode", "outlined", "addcls", "hover:bg-white", 3, "click", "matTooltip", "square"], ["xmlns", "http://www.w3.org/2000/svg", "width", "17", "height", "10", "fill", "none", "viewBox", "0 0 17 10"], ["fill", "#fff"], ["d", "m0 1 1-1h5l1 1v8l-1 1H1L0 9V1Z"], ["stroke", "#4F4F4F", "stroke-width", "4", "d", "m0 1 1-1h5l1 1v8l-1 1H1L0 9V1Z"], ["d", "m10 1 1-1h5l1 1v8l-1 1h-5l-1-1V1Z"], ["stroke", "#4F4F4F", "stroke-width", "4", "d", "m10 1 1-1h5l1 1v8l-1 1h-5l-1-1V1Z"], [3, "demoToggled", "exportTranscript", "visibleIssueModelChange", "showTimestampChange", "showTimestamp", "isDisable", "isSessionLive", "zoomLevel", "zoomLevelChange", "fullViewMode", "fullViewModeChange", "compareEnabled", "indexEnabled", "indexEnabledChange", "visibleMarkNavModel", "visibleMarkNavModelChange", "isTranscViewer", "limitedActions"]], template: function ToolbarComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275template(1, ToolbarComponent_Conditional_1_Template, 1, 4, "rt-compare", 2)(2, ToolbarComponent_Conditional_2_Template, 6, 15);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", ctx.isTranscViewer ? "bg-white border-b border-neutral-200 !py-2 !h-[50px]" : "bg-dark-blue");
        \u0275\u0275advance();
        \u0275\u0275conditional(1, (ctx.compareTool || ctx.compareEnabled) && !ctx.isTranscViewer ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, !ctx.compareTool || ctx.compareEnabled || ctx.isTranscViewer ? 2 : -1);
      }
    }, dependencies: [MatMenuModule, MatMenu, MatMenuItem, MatMenuTrigger, MatCheckboxModule, ButtonComponent, FormsModule, DefaultValueAccessor, NgControlStatus, MaxLengthValidator, NgModel, RtToolOptionsComponent, RtSearchComponent, RtCompareComponent, OnlyNumberDirective, MatTooltipModule, MatTooltip, TranslateModule, TranslatePipe, NgClass, SelectionActionsControlComponent], styles: ["\n\n.loader[_ngcontent-%COMP%] {\n  display: block;\n  width: 3px;\n  height: 3px;\n  border-radius: 50%;\n  background-color: #fff;\n  box-shadow: 16px 0 #fff, -16px 0 #fff;\n  position: relative;\n  animation: _ngcontent-%COMP%_flash 0.5s ease-out infinite alternate;\n}\n@keyframes _ngcontent-%COMP%_flash {\n  0% {\n    background-color: rgba(255, 255, 255, 0.1333333333);\n    box-shadow: 8px 0 rgba(255, 255, 255, 0.1333333333), -8px 0 #FFF;\n  }\n  50% {\n    background-color: #FFF;\n    box-shadow: 8px 0 rgba(255, 255, 255, 0.1333333333), -8px 0 rgba(255, 255, 255, 0.1333333333);\n  }\n  100% {\n    background-color: rgba(255, 255, 255, 0.1333333333);\n    box-shadow: 8px 0 #FFF, -8px 0 rgba(255, 255, 255, 0.1333333333);\n  }\n}\n.disabled[_ngcontent-%COMP%] {\n  opacity: 0.7;\n}\n  .custom-mat-menu {\n  background-color: #002f64 !important;\n  min-width: 240px !important;\n  max-width: 320px !important;\n  border-radius: 4px !important;\n  padding: 0 !important;\n  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.3) !important;\n}\n  .custom-mat-menu .mat-mdc-menu-content {\n  padding: 0 !important;\n  max-height: 400px;\n  overflow-y: auto;\n}\n  .custom-mat-menu .mat-mdc-menu-item {\n  color: white !important;\n  height: 48px !important;\n  line-height: normal !important;\n  padding: 0 20px !important;\n  font-size: 0.875rem !important;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n  .custom-mat-menu .mat-mdc-menu-item .mat-mdc-menu-item-text {\n  width: 100%;\n}\n  .custom-mat-menu .mat-mdc-menu-item:hover {\n  background-color: rgba(255, 255, 255, 0.1) !important;\n}\n  .custom-mat-menu .mat-mdc-menu-item.bg-blue-50 {\n  background-color: #1e4573 !important;\n}\n  .custom-mat-menu .mat-mdc-menu-item.bg-blue-50:hover {\n  background-color: #1e4573 !important;\n}\n/*# sourceMappingURL=toolbar.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ToolbarComponent, { className: "ToolbarComponent", filePath: "src\\app\\rt\\components\\feeds\\rt-components\\toolbar\\toolbar.component.ts", lineNumber: 33 });
})();

export {
  HighlightPipe,
  SearchService,
  ToolbarComponent
};
//# sourceMappingURL=chunk-UI3KRWEQ.js.map
