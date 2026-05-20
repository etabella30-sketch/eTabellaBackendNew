import {
  PdfSharedModule
} from "./chunk-VPMOHRXF.js";
import {
  PdfEvents
} from "./chunk-JX6C2RXC.js";
import {
  HyperlinkService
} from "./chunk-KLFZXJVK.js";
import {
  SharewithteamComponent
} from "./chunk-UPZPMN2N.js";
import {
  NgxTippyDirective,
  NgxTippyModule,
  ToolboxComponent
} from "./chunk-OUNBNFKW.js";
import {
  SelectionActionsControlComponent
} from "./chunk-GLL6MQHU.js";
import {
  SelectionActionsService
} from "./chunk-FW6JNL2T.js";
import {
  PdfFirstPageComponent,
  PdfLastPageComponent,
  PdfNextPageComponent,
  PdfPreviousPageComponent,
  PdfZoomInComponent
} from "./chunk-QI7CLXWT.js";
import {
  PdfDataService
} from "./chunk-F3YHE7Z5.js";
import {
  ChooseIssueComponent
} from "./chunk-3JV3GCVK.js";
import {
  NgOptionTemplateDirective,
  NgSelectComponent,
  NgSelectModule
} from "./chunk-E3GVDGCY.js";
import {
  MatSlider,
  MatSliderModule,
  MatSliderThumb
} from "./chunk-RQT3Q2FS.js";
import {
  NgScrollbar,
  NgScrollbarModule,
  takeUntilDestroyed
} from "./chunk-WZNPCXMG.js";
import {
  AdvanceSearchService
} from "./chunk-JQOS4SOR.js";
import {
  IndividualService
} from "./chunk-GNZXOHZW.js";
import {
  MatSlideToggle,
  MatSlideToggleModule
} from "./chunk-43QUFIPG.js";
import {
  MatRadioModule
} from "./chunk-ILBZODYX.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
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
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  MatDialog
} from "./chunk-UVEQGFJV.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel,
  NumberValueAccessor
} from "./chunk-CIO7JDBK.js";
import {
  MatButton,
  MatButtonModule
} from "./chunk-W3IEBGJA.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  animate,
  style,
  transition,
  trigger
} from "./chunk-AIKHFB75.js";
import {
  Dir
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  Subject,
  __async,
  effect,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵInheritDefinitionFeature,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
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
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵpureFunction4,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtextInterpolate3,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/pdf/components/search/search.component.ts
var _c0 = ["searchInput"];
var _c1 = (a0) => ({ "flex-wrap  w-full items-center gap-2.5": a0 });
function SearchComponent_icon_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 12);
    \u0275\u0275listener("click", function SearchComponent_icon_3_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.clearSearch());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("hidden", !ctx_r2.cSearch || ctx_r2.cSearch === "");
  }
}
function SearchComponent_input_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 13, 1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_input_4_Template_input_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.cSearch, $event) || (ctx_r2.cSearch = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function SearchComponent_input_4_Template_input_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.find());
    })("keyup", function SearchComponent_input_4_Template_input_keyup_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      ctx_r2.cSearch === "" ? ctx_r2.find() : null;
      return \u0275\u0275resetView(ctx_r2.isSearching = false);
    })("keyup", function SearchComponent_input_4_Template_input_keyup_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.OnKeyUp($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.cSearch);
    \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(2, 2, "PDF.SEARCH.SEARCH_HERE"));
  }
}
function SearchComponent_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-checkbox", 14);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_ng_container_5_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.matchCase, $event) || (ctx_r2.matchCase = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function SearchComponent_ng_container_5_Template_mat_checkbox_change_1_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      ctx_r2.searching_value = null;
      return \u0275\u0275resetView(ctx_r2.find());
    });
    \u0275\u0275elementStart(2, "span", 15);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "mat-checkbox", 14);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_ng_container_5_Template_mat_checkbox_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.wholeWords, $event) || (ctx_r2.wholeWords = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function SearchComponent_ng_container_5_Template_mat_checkbox_change_5_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      ctx_r2.searching_value = null;
      return \u0275\u0275resetView(ctx_r2.find());
    });
    \u0275\u0275elementStart(6, "span", 15);
    \u0275\u0275text(7);
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.matchCase);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 4, "PDF.SEARCH.MATCH_CASE"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.wholeWords);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(8, 6, "PDF.SEARCH.WHOLE_WORDS"), " ");
  }
}
function SearchComponent_ng_template_6_div_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 27);
    \u0275\u0275listener("click", function SearchComponent_ng_template_6_div_19_Template_div_click_0_listener() {
      const ctx_r7 = \u0275\u0275restoreView(_r7);
      const x_r9 = ctx_r7.$implicit;
      const i_r10 = ctx_r7.index;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.goToPage(x_r9, i_r10));
    });
    \u0275\u0275elementStart(1, "div", 28);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 29);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r9 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", \u0275\u0275pipeBind1(3, 3, "PDF.SEARCH.PAGE"), " ", x_r9.page, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r9.matches, " ");
  }
}
function SearchComponent_ng_template_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 16)(1, "span", 15);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "input", 17);
    \u0275\u0275listener("keydown", function SearchComponent_ng_template_6_Template_input_keydown_4_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onKeydown($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 15);
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "translate");
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "btn", 18);
    \u0275\u0275listener("click", function SearchComponent_ng_template_6_Template_btn_click_9_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.redirectPage(-1));
    });
    \u0275\u0275element(10, "icon", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "btn", 20);
    \u0275\u0275listener("click", function SearchComponent_ng_template_6_Template_btn_click_11_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.redirectPage(1));
    });
    \u0275\u0275element(12, "icon", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "span", 22, 2);
    \u0275\u0275element(15, "icon", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "mat-menu", 24, 3)(18, "div", 25);
    \u0275\u0275template(19, SearchComponent_ng_template_6_div_19_Template, 6, 5, "div", 26);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const p_r11 = \u0275\u0275reference(14);
    const menu_r12 = \u0275\u0275reference(17);
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", ctx_r2.totalElasticMaches || 0, " ", \u0275\u0275pipeBind1(3, 14, "PDF.SEARCH.MATCHES_FOUND_ON"), "");
    \u0275\u0275advance(2);
    \u0275\u0275property("value", ctx_r2.searchPageIndex + 1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate3(" ", \u0275\u0275pipeBind1(7, 16, "PDF.SEARCH.OF"), " ", ctx_r2.elasticPages == null ? null : ctx_r2.elasticPages.length, " ", \u0275\u0275pipeBind1(8, 18, "PDF.SEARCH.PAGES"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("square", true);
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(p_r11.menuOpen ? "bg-blue-[#E0EDFF]" : "");
    \u0275\u0275property("matMenuTriggerFor", menu_r12);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(p_r11.menuOpen ? "text-blue-on rotate-180" : "");
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx_r2.elasticPages);
  }
}
function SearchComponent_div_8_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 36)(2, "path", 37);
    \u0275\u0275element(3, "animateTransform", 38);
    \u0275\u0275elementEnd()()();
  }
}
function SearchComponent_div_8_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "h6", 39);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate3("", ctx_r2.currentSearch, " ", \u0275\u0275pipeBind1(3, 3, "PDF.SEARCH.OF"), " ", ctx_r2.totalSearch, " Matches");
  }
}
function SearchComponent_div_8_ng_template_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 39);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, "PDF.SEARCH.NO_MATCHES"));
  }
}
function SearchComponent_div_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 30);
    \u0275\u0275listener("keydown.escape", function SearchComponent_div_8_Template_div_keydown_escape_0_listener($event) {
      \u0275\u0275restoreView(_r13);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "div", 31);
    \u0275\u0275template(2, SearchComponent_div_8_div_2_Template, 4, 0, "div", 32)(3, SearchComponent_div_8_ng_container_3_Template, 4, 5, "ng-container", 10)(4, SearchComponent_div_8_ng_template_4_Template, 3, 3, "ng-template", null, 4, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementStart(6, "btn", 33);
    \u0275\u0275listener("click", function SearchComponent_div_8_Template_btn_click_6_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.findPrevious());
    });
    \u0275\u0275element(7, "icon", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "btn", 34);
    \u0275\u0275listener("click", function SearchComponent_div_8_Template_btn_click_8_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.findNext());
    });
    \u0275\u0275element(9, "icon", 21);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const noMatches_r14 = \u0275\u0275reference(5);
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.isSearching);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.totalSearch)("ngIfElse", noMatches_r14);
    \u0275\u0275advance(3);
    \u0275\u0275property("square", true)("disabled", !ctx_r2.totalSearch || ctx_r2.currentSearch == 1);
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true)("disabled", !ctx_r2.totalSearch || ctx_r2.currentSearch == ctx_r2.totalSearch);
  }
}
var SearchComponent = class _SearchComponent {
  constructor(cdr, advancesearchService, cs) {
    this.cdr = cdr;
    this.advancesearchService = advancesearchService;
    this.cs = cs;
    this.cSearch = "";
    this.matchCase = false;
    this.wholeWords = false;
    this.totalSearch = 0;
    this.totalElasticMaches = 0;
    this.currentSearch = 0;
    this.isSearching = false;
    this.isfullmode = false;
    this.searchEvents = new EventEmitter();
    this.ValueUpdate = new EventEmitter();
    this.searching_value = "";
    this.jFilter = null;
    this.jFilterChange = new EventEmitter();
    this.isElasticSearched = false;
    this.isElasticSearchedChange = new EventEmitter();
    this.elasticPages = [];
    this.searchPageIndex = 0;
    this.pdfLoaded = false;
    this.cs.functionCalled$.pipe(takeUntilDestroyed()).subscribe((data) => __async(this, null, function* () {
      if (data === "CLEAR-PDF-SEARCH") {
        this.clearSearch();
      }
    }));
  }
  find() {
    this.OnKeyUp(null);
    this.cSearchChange?.emit(this.cSearch);
    if (this.searching_value == this.cSearch) {
      this.findNext();
      return;
    }
    this.searching_value = this.cSearch;
    this.cdr.markForCheck();
    this.searchEvents.next({ event: "SEARCH", data: { cSearch: this.cSearch, options: { matchCase: this.matchCase, wholeWords: this.wholeWords, highlightAll: true } } });
  }
  findPrevious() {
    this.searchEvents.next({ event: "SEARCH_PREVIOUS", data: { cSearch: this.cSearch, options: { matchCase: this.matchCase, wholeWords: this.wholeWords, highlightAll: true } } });
  }
  findNext() {
    this.searchEvents.next({ event: "SEARCH_NEXT", data: { cSearch: this.cSearch, options: { matchCase: this.matchCase, wholeWords: this.wholeWords, highlightAll: true } } });
  }
  OnKeyUp(e) {
    if (e) {
      this.removeElasticSearch();
    }
    this.ValueUpdate.next({ event: "VALUE_UPDATE", data: { cSearch: this.cSearch, options: { matchCase: this.matchCase, wholeWords: this.wholeWords, highlightAll: true } } });
  }
  ngOnInit() {
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
    if (this.cSearch) {
      if (this.pdfLoaded) {
        this.find();
      }
    }
  }
  ngOnChanges(changes) {
    if (changes["totalSearch"]) {
      this.cdr.markForCheck();
    }
    if (changes["isSearching"]) {
      this.cdr.markForCheck();
    }
    if (changes["pdfLoaded"]) {
      this.pdfLoaded = changes["pdfLoaded"].currentValue;
      if (this.pdfLoaded) {
        this.find();
      }
      this.cdr.markForCheck();
    }
  }
  clearSearch() {
    this.cSearch = "";
    this.find();
    this.isSearching = false;
    this.searching_value = "";
    this.totalSearch = 0;
    this.currentSearch = 0;
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
    this.cdr.markForCheck();
  }
  close() {
    let close = { event: "close", data: null };
    this.searchEvents.next(close);
  }
  goToPage(x, i) {
    this.searchPageIndex = i;
    this.searchEvents.next({ event: "SEARCH-PAGE-REDIRECT", data: { page: Number(x.page) } });
    this.cdr.markForCheck();
  }
  redirectPage(val) {
    const newPg = this.elasticPages[this.searchPageIndex + val];
    if (newPg) {
      this.goToPage(newPg, this.searchPageIndex + val);
    }
  }
  onKeydown(e) {
    if (e.key === "Enter") {
      const target = e.target;
      this.searchPageIndex = (Number(target.value) || 1) - 1;
      const onj = this.elasticPages[this.searchPageIndex];
      if (onj) {
        const enteredValue = Number(onj?.page);
        const closestPage = this.elasticPages.reduce((prev, curr) => {
          return Math.abs(curr.page - enteredValue) < Math.abs(prev.page - enteredValue) ? curr : prev;
        });
        this.goToPage(closestPage, this.searchPageIndex);
      }
    }
  }
  removeElasticSearch() {
    this.jFilter = null;
    this.isElasticSearched = false;
    this.elasticPages = [];
    this.searchPageIndex = 0;
    this.isElasticSearchedChange.emit(this.isElasticSearched);
    this.jFilterChange.emit(this.jFilter);
    this.cdr.markForCheck();
  }
  static {
    this.\u0275fac = function SearchComponent_Factory(t) {
      return new (t || _SearchComponent)(\u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(AdvanceSearchService), \u0275\u0275directiveInject(CommunicationService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SearchComponent, selectors: [["pdfsearch"]], viewQuery: function SearchComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.searchInput = _t.first);
      }
    }, inputs: { cSearch: "cSearch", cSearchChange: "cSearchChange", matchCase: "matchCase", wholeWords: "wholeWords", totalSearch: "totalSearch", totalElasticMaches: "totalElasticMaches", currentSearch: "currentSearch", isSearching: "isSearching", isfullmode: "isfullmode", jFilter: "jFilter", isElasticSearched: "isElasticSearched", elasticPages: "elasticPages", searchPageIndex: "searchPageIndex", pdfLoaded: "pdfLoaded" }, outputs: { searchEvents: "searchEvents", ValueUpdate: "ValueUpdate", jFilterChange: "jFilterChange", isElasticSearchedChange: "isElasticSearchedChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 9, vars: 8, consts: [["elasticSearchBlock", ""], ["searchInput", ""], ["p", "matMenuTrigger"], ["menu", "matMenu"], ["noMatches", ""], [1, "flex", "bg-blue-deactivate", "p-2.5", 3, "keydown.escape", "ngClass"], [1, "flex", "gap-2.5", "w-full", 3, "keydown.escape"], [1, "relative", "w-40"], ["name", "close", "class", "absolute top-1/2 -translate-y-1/2 right-3 text-xxs", 3, "hidden", "click", 4, "ngIf"], ["type", "text", "class", "px-3.5 py-2 pe-9 rounded-base placeholder-shown:bg-white bg-faint block w-full focus:shadow-[0px_0px_6px_#0066FF] border shadow-sm focus:outline-none text-xs", 3, "ngModel", "placeholder", "ngModelChange", "keyup.enter", "keyup", 4, "ngIf"], [4, "ngIf", "ngIfElse"], ["class", "px-3 ms-auto flex items-center", 3, "keydown.escape", 4, "ngIf"], ["name", "close", 1, "absolute", "top-1/2", "-translate-y-1/2", "right-3", "text-xxs", 3, "click", "hidden"], ["type", "text", 1, "px-3.5", "py-2", "pe-9", "rounded-base", "placeholder-shown:bg-white", "bg-faint", "block", "w-full", "focus:shadow-[0px_0px_6px_#0066FF]", "border", "shadow-sm", "focus:outline-none", "text-xs", 3, "ngModelChange", "keyup.enter", "keyup", "ngModel", "placeholder"], [1, "ms-2", "my-auto", 3, "ngModelChange", "change", "ngModel"], [1, "whitespace-nowrap"], [1, "flex", "items-center", "text-xs", "gap-2.5", "font-semibold"], ["type", "text", 1, "w-12", "h-[22px]", "rounded-md", "text-center", "!shadow-none", "text-blue-on", "font-semibold", 3, "keydown", "value"], ["mode", "outlined", 1, "ms-auto", 3, "click", "square"], ["name", "chvy"], ["mode", "outlined", 3, "click", "square"], ["name", "chvy", 1, "rotate-180"], [1, "size-6", "flex", "items-center", "justify-center", "cursor-pointer", 3, "matMenuTriggerFor"], ["name", "chvx", 1, "text-xxs"], ["xPosition", "before", 1, "p-5", "w-[227px]", "mt-6", "max-h-[calc(100vh_-_140px)]"], [1, "flex", "flex-col", "gap-2"], ["class", "flex items-center gap-2 h-6 hover:bg-blue-deactivate rounded-base px-2.5", 3, "click", 4, "ngFor", "ngForOf"], [1, "flex", "items-center", "gap-2", "h-6", "hover:bg-blue-deactivate", "rounded-base", "px-2.5", 3, "click"], [1, "text-xs", "w-1/2"], [1, "text-xs", "w-1/2", "text-semibold", "text-blue-on", "text-end"], [1, "px-3", "ms-auto", "flex", "items-center", 3, "keydown.escape"], [1, "flex", "items-center", "gap-2.5"], ["class", "flex gap-2 items-center", 4, "ngIf"], ["mode", "outlined", 1, "ms-auto", 3, "click", "square", "disabled"], ["mode", "outlined", 3, "click", "square", "disabled"], [1, "flex", "gap-2", "items-center"], ["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 100 100", 0, "xml", "space", "preserve", 2, "height", "20px", "width", "20px"], ["fill", "#000", "d", "M73 50c0-12.7-10.3-23-23-23S27 37.3 27 50m3.9 0c0-10.5 8.5-19.1 19.1-19.1S69.1 39.5 69.1 50"], ["attributeName", "transform", "attributeType", "XML", "type", "rotate", "dur", "1s", "from", "0 50 50", "to", "360 50 50", "repeatCount", "indefinite"], [1, "text-xs", "whitespace-nowrap"]], template: function SearchComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 5);
        \u0275\u0275listener("keydown.escape", function SearchComponent_Template_div_keydown_escape_0_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        });
        \u0275\u0275elementStart(1, "div", 6);
        \u0275\u0275listener("keydown.escape", function SearchComponent_Template_div_keydown_escape_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        });
        \u0275\u0275elementStart(2, "div", 7);
        \u0275\u0275template(3, SearchComponent_icon_3_Template, 1, 1, "icon", 8)(4, SearchComponent_input_4_Template, 3, 4, "input", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275template(5, SearchComponent_ng_container_5_Template, 9, 8, "ng-container", 10)(6, SearchComponent_ng_template_6_Template, 20, 20, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
        \u0275\u0275elementEnd();
        \u0275\u0275template(8, SearchComponent_div_8_Template, 10, 7, "div", 11);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        const elasticSearchBlock_r15 = \u0275\u0275reference(7);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(6, _c1, !ctx.isfullmode));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", !ctx.isElasticSearched);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.isElasticSearched || ctx.isElasticSearched && ctx.isfullmode);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.isElasticSearched)("ngIfElse", elasticSearchBlock_r15);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.cSearch && !ctx.isElasticSearched);
      }
    }, dependencies: [PdfSharedModule, TranslatePipe, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, ButtonComponent, MatCheckboxModule, MatCheckbox, IconComponent, CommonModule, NgClass, NgForOf, NgIf, MatMenuModule, MatMenu, MatMenuTrigger], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SearchComponent, { className: "SearchComponent", filePath: "src\\app\\pdf\\components\\search\\search.component.ts", lineNumber: 23 });
})();

// src/app/pdf/base/base-pdf-tool.component.ts
var BasePdfToolComponent = class _BasePdfToolComponent {
  constructor(cdr) {
    this.cdr = cdr;
    this.nCaseid = "";
    this.docInfo = null;
    this.destroy$ = new Subject();
  }
  /**
   * Cleanup lifecycle hook.
   * Completes the destroy$ subject.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /**
   * Helper to manually mark component for check.
   * Use when OnPush strategy doesn't auto-detect a change (e.g. async logic).
   */
  markForCheck() {
    this.cdr.markForCheck();
  }
  /**
   * Safe string conversion helper.
   * @param val Any value
   * @returns String representation
   */
  convToStr(val) {
    return val ? JSON.stringify(val) : "";
  }
  static {
    this.\u0275fac = function BasePdfToolComponent_Factory(t) {
      return new (t || _BasePdfToolComponent)(\u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({ type: _BasePdfToolComponent, inputs: { nCaseid: "nCaseid", docInfo: "docInfo" } });
  }
};

// src/app/pdf/interfaces/annot-tools.interface.ts
var DEFAULT_ANNOT_TOOL_MODE = "F";
var DEFAULT_HIGHLIGHT_MODE = "QF";
var TOOL_ICONS = [
  { name: "highlighter", type: "F", toolTip: "ANNOT_TOOLS.TOOL_HIGHLIGHTER", for: "F" },
  { name: "pencil", type: "DR", toolTip: "ANNOT_TOOLS.TOOL_FREEHAND", for: "F" },
  { name: "shape", type: "R", toolTip: "ANNOT_TOOLS.TOOL_SHAPE", for: "F" },
  { name: "doctool", type: "D", toolTip: "ANNOT_TOOLS.TOOL_DOC_LINK", for: "D" },
  { name: "webtool", type: "W", toolTip: "ANNOT_TOOLS.TOOL_WEB_LINK", for: "W" }
];
var NO_ICON = { name: "cursor", type: "", toolTip: "ANNOT_TOOLS.TOOL_CURSOR", for: "F" };
var TOOL_EVENTS = {
  ANNOT_TOOL_CHANGE: "Annot_Tool_Change",
  ADVANCE: "ADVANCE",
  ISSUE_CHANGE: "ISSUE_CHNAGE"
  // preserved original spelling
};

// src/app/pdf/components/annot-tools/annot-tools.component.ts
var _c02 = ["issuesComponent"];
var _c12 = (a0) => ({ "background": a0 });
function AnnotToolsComponent_ng_container_1_ng_container_3_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "span", 17);
    \u0275\u0275text(2);
    \u0275\u0275element(3, "icon", 18);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c12, (ctx_r1.selectedIssues[0] == null ? null : ctx_r1.selectedIssues[0].cColor) ? "#" + ctx_r1.selectedIssues[0].cColor : "transparent"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.selectedIssues[0].cIName, " ");
  }
}
function AnnotToolsComponent_ng_container_1_ng_container_3_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275element(3, "icon", 18);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 1, "ANNOT_TOOLS.MULTIPLE_ISSUES_SELECTED"), " ");
  }
}
function AnnotToolsComponent_ng_container_1_ng_container_3_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275element(3, "icon", 18);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 1, "ANNOT_TOOLS.SELECT_ISSUES"), " ");
  }
}
function AnnotToolsComponent_ng_container_1_ng_container_3_div_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 19)(1, "choose-issue", 20, 2);
    \u0275\u0275listener("Onevent", function AnnotToolsComponent_ng_container_1_ng_container_3_div_9_Template_choose_issue_Onevent_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      \u0275\u0275nextContext();
      const i_r5 = \u0275\u0275reference(2);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onEvent($event, i_r5));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("intoolbar", true)("selectedIssues", ctx_r1.selectedIssues)("nCaseid", ctx_r1.nCaseid);
  }
}
function AnnotToolsComponent_ng_container_1_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 13, 0);
    \u0275\u0275listener("menuOpened", function AnnotToolsComponent_ng_container_1_ng_container_3_Template_button_menuOpened_1_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.loadIssue());
    });
    \u0275\u0275template(3, AnnotToolsComponent_ng_container_1_ng_container_3_ng_container_3_Template, 4, 4, "ng-container", 4)(4, AnnotToolsComponent_ng_container_1_ng_container_3_ng_container_4_Template, 4, 3, "ng-container", 4)(5, AnnotToolsComponent_ng_container_1_ng_container_3_ng_container_5_Template, 4, 3, "ng-container", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "mat-menu", 14, 1)(8, "div", 15);
    \u0275\u0275listener("click", function AnnotToolsComponent_ng_container_1_ng_container_3_Template_div_click_8_listener($event) {
      \u0275\u0275restoreView(_r3);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275template(9, AnnotToolsComponent_ng_container_1_ng_container_3_div_9_Template, 3, 3, "div", 16);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const i_r5 = \u0275\u0275reference(2);
    const issues_r6 = \u0275\u0275reference(7);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("matMenuTriggerFor", issues_r6);
    \u0275\u0275attribute("aria-expanded", i_r5.menuOpen);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", (ctx_r1.selectedIssues == null ? null : ctx_r1.selectedIssues.length) === 1);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.selectedIssues == null ? null : ctx_r1.selectedIssues.length) > 1);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !(ctx_r1.selectedIssues == null ? null : ctx_r1.selectedIssues.length));
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", i_r5.menuOpen);
  }
}
function AnnotToolsComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 11)(2, "toolbox", 12);
    \u0275\u0275listener("OnEvent", function AnnotToolsComponent_ng_container_1_Template_toolbox_OnEvent_2_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onToolboxClick($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, AnnotToolsComponent_ng_container_1_ng_container_3_Template, 10, 6, "ng-container", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("intoolbar", true)("highlightMode", ctx_r1.highlightMode)("annotToolMode", ctx_r1.annotToolMode)("tempAnnots", ctx_r1.tempAnnots)("isChecked", true)("isLink", ctx_r1.highlightMode)("highlightIndex", 0)("nFSid", ctx_r1.nFSid)("docInfo", ctx_r1.docInfo);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.highlightMode === "QF" || ctx_r1.highlightMode === "F");
  }
}
function AnnotToolsComponent_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275text(1, "Chosen annotation style:");
    \u0275\u0275elementEnd();
  }
}
function AnnotToolsComponent_ng_container_4_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 22);
    \u0275\u0275listener("click", function AnnotToolsComponent_ng_container_4_ng_container_1_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r7);
      const x_r8 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.changeType(x_r8.type));
    });
    \u0275\u0275element(2, "icon", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r8 = \u0275\u0275nextContext().$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap(x_r8.type == ctx_r1.annotToolMode ? "hover:bg-white !text-blue-on !bg-blue-hover !border-blue-on hover:shadow-[inset_0px_0px_4px_0px_#9FCCFF] shadow-[inset_0px_0px_4px_0px_#9FCCFF]" : "hover:bg-white active:bg-white");
    \u0275\u0275property("matTooltip", x_r8.toolTip);
    \u0275\u0275attribute("aria-pressed", x_r8.type == ctx_r1.annotToolMode);
    \u0275\u0275advance();
    \u0275\u0275property("name", x_r8.name)("type", x_r8.type == "" && (ctx_r1.docInfo == null ? null : ctx_r1.docInfo.nPresentid) && (ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isHost) ? "extra" : x_r8.type == "F" ? "real_icn" : "toolicn");
  }
}
function AnnotToolsComponent_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, AnnotToolsComponent_ng_container_4_ng_container_1_Template, 3, 6, "ng-container", 4);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.highlightMode.includes(x_r8.for));
  }
}
var AnnotToolsComponent = class _AnnotToolsComponent extends BasePdfToolComponent {
  constructor(cdr) {
    super(cdr);
    this.OnClose = new EventEmitter();
    this.OnModeChange = new EventEmitter();
    this.OnToolBoxEvent = new EventEmitter();
    this.annotToolMode = DEFAULT_ANNOT_TOOL_MODE;
    this.selectedIssues = [];
    this.highlightMode = DEFAULT_HIGHLIGHT_MODE;
    this.tempAnnots = [];
    this.nFSid = null;
    this.icons = TOOL_ICONS;
    this.noIcon = NO_ICON;
  }
  ngOnInit() {
    this.initializeTools();
  }
  /**
   * Initialize tool settings based on document mode.
   */
  initializeTools() {
    if (this.docInfo?.nPresentid) {
      this.icons.unshift(this.noIcon);
    }
  }
  /**
   * Close the annotation toolbar.
   */
  onAnnotClose() {
    this.OnClose.emit();
  }
  /**
   * Switch the active annotation tool type.
   * @param type The new tool type
   */
  changeType(type) {
    this.annotToolMode = type;
    this.OnModeChange.emit(this.annotToolMode);
    this.markForCheck();
  }
  /**
   * Handle events from the sub-toolbox component.
   * @param e Event data
   */
  onToolboxClick(e) {
    if (!e)
      return;
    this.highlightMode = e.mode ?? this.highlightMode;
    this.OnToolBoxEvent.emit({ event: TOOL_EVENTS.ANNOT_TOOL_CHANGE, data: e.mode });
    const newMode = e.mode === "QF" ? "F" : e.mode;
    this.OnModeChange.emit(newMode);
  }
  /**
   * Handle events from the Issue Menu or generic toolbox actions.
   * @param e Event payload
   * @param menu Reference to the MatMenu to close it
   */
  onEvent(e, menu) {
    if (e.event === TOOL_EVENTS.ISSUE_CHANGE) {
      this.selectedIssues = e.data ?? this.selectedIssues;
      this.markForCheck();
    }
    if (e.event === TOOL_EVENTS.ADVANCE) {
      if (menu && typeof menu.closeMenu === "function") {
        menu.closeMenu();
      }
      this.OnToolBoxEvent.emit({ event: TOOL_EVENTS.ADVANCE, data: e.data });
    }
  }
  /**
   * Manually trigger issue component initialization.
   * @deprecated Should use OnChanges or declarative approach in issues component.
   */
  loadIssue() {
    this.issues?.ngOnInit();
  }
  static {
    this.\u0275fac = function AnnotToolsComponent_Factory(t) {
      return new (t || _AnnotToolsComponent)(\u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AnnotToolsComponent, selectors: [["annot-tools"]], viewQuery: function AnnotToolsComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c02, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.issues = _t.first);
      }
    }, inputs: { annotToolMode: "annotToolMode", selectedIssues: "selectedIssues", highlightMode: "highlightMode" }, outputs: { OnClose: "OnClose", OnModeChange: "OnModeChange", OnToolBoxEvent: "OnToolBoxEvent" }, standalone: true, features: [\u0275\u0275InheritDefinitionFeature, \u0275\u0275StandaloneFeature], decls: 8, vars: 5, consts: [["i", "matMenuTrigger"], ["issues", "matMenu"], ["issuesComponent", ""], [1, "px-5", "py-1", "bg-blue-deactivate", "flex", "h-12", "items-center", "gap-x-4", "[&>span]:cursor-pointer", "justify-end"], [4, "ngIf"], [1, "flex", "items-center", "gap-3"], ["class", "text-xs", 4, "ngIf"], [4, "ngFor", "ngForOf"], [1, "h-full", "w-px", "bg-tab"], ["type", "button", "aria-label", "Close annotation", 1, "text-xs", 3, "click"], ["name", "close"], [1, "flex", "me-auto", "bg-white", "rounded-base", "overflow-hidden"], [3, "OnEvent", "intoolbar", "highlightMode", "annotToolMode", "tempAnnots", "isChecked", "isLink", "highlightIndex", "nFSid", "docInfo"], ["type", "button", "mat-button", "", "aria-haspopup", "true", 1, "bg-white", "h-8.5", "px-3", "cursor-pointer", "flex", "items-center", "gap-2", "text-xs", "w-56", "rounded-e-base", 3, "menuOpened", "matMenuTriggerFor"], [1, "!rounded-lg", "mt-1", "w-[380px]", "max-h-[400px]"], [1, "bg-faint", "h-full", 3, "click"], ["class", "h-full overflow-x-hidden", 4, "ngIf"], [1, "w-1", "h-3.5", "rounded-lg", "bg-red-300", "block", 3, "ngStyle"], ["name", "chvx", 1, "ms-auto", "text-xxs"], [1, "h-full", "overflow-x-hidden"], [1, "block", "h-full", 3, "Onevent", "intoolbar", "selectedIssues", "nCaseid"], [1, "text-xs"], ["type", "button", 1, "flex", "rounded-base", "p-1.5", "hover:text-blue-on", 3, "click", "matTooltip"], [1, "text-2xl", 3, "name", "type"]], template: function AnnotToolsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 3);
        \u0275\u0275template(1, AnnotToolsComponent_ng_container_1_Template, 4, 10, "ng-container", 4);
        \u0275\u0275elementStart(2, "div", 5);
        \u0275\u0275template(3, AnnotToolsComponent_span_3_Template, 2, 0, "span", 6)(4, AnnotToolsComponent_ng_container_4_Template, 2, 1, "ng-container", 7);
        \u0275\u0275elementEnd();
        \u0275\u0275element(5, "div", 8);
        \u0275\u0275elementStart(6, "button", 9);
        \u0275\u0275listener("click", function AnnotToolsComponent_Template_button_click_6_listener() {
          return ctx.onAnnotClose();
        });
        \u0275\u0275element(7, "icon", 10);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !(ctx.docInfo == null ? null : ctx.docInfo.nPresentid) || !(ctx.docInfo == null ? null : ctx.docInfo.isHost));
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.docInfo.nPresentid && (ctx.docInfo == null ? null : ctx.docInfo.isHost) ? "me-auto" : "");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !(ctx.docInfo == null ? null : ctx.docInfo.nPresentid) || !(ctx.docInfo == null ? null : ctx.docInfo.isHost));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.icons);
      }
    }, dependencies: [
      CommonModule,
      NgForOf,
      NgIf,
      NgStyle,
      IconComponent,
      MatTooltipModule,
      MatTooltip,
      TranslateModule,
      TranslatePipe,
      MatMenuModule,
      MatMenu,
      MatMenuTrigger,
      MatButtonModule,
      MatButton,
      NgScrollbarModule,
      ToolboxComponent,
      ChooseIssueComponent
    ], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AnnotToolsComponent, { className: "AnnotToolsComponent", filePath: "src\\app\\pdf\\components\\annot-tools\\annot-tools.component.ts", lineNumber: 44 });
})();

// src/app/pdf/components/markoptions/markoptions.component.ts
function MarkoptionsComponent_div_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "div", 14);
    \u0275\u0275listener("click", function MarkoptionsComponent_div_6_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "div", 15);
    \u0275\u0275listener("click", function MarkoptionsComponent_div_6_Template_div_click_2_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.open("F"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 16);
    \u0275\u0275element(4, "path", 17)(5, "path", 18)(6, "path", 19)(7, "path", 20)(8, "path", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "span");
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "div", 15);
    \u0275\u0275listener("click", function MarkoptionsComponent_div_6_Template_div_click_12_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.open("D"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(13, "svg", 22);
    \u0275\u0275element(14, "path", 23)(15, "path", 24)(16, "path", 25)(17, "path", 26)(18, "path", 27)(19, "path", 28)(20, "path", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(21, "span");
    \u0275\u0275text(22);
    \u0275\u0275pipe(23, "translate");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(10);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(11, 2, "PDF.MARKOPTIONS.FACT"));
    \u0275\u0275advance(12);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(23, 4, "PDF.MARKOPTIONS.DOCLINK"));
  }
}
function MarkoptionsComponent_div_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "div", 14);
    \u0275\u0275listener("click", function MarkoptionsComponent_div_13_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r3);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "div", 15);
    \u0275\u0275listener("click", function MarkoptionsComponent_div_13_Template_div_click_2_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.open("F"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 16);
    \u0275\u0275element(4, "path", 17)(5, "path", 18)(6, "path", 19)(7, "path", 20)(8, "path", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "span");
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "div", 15);
    \u0275\u0275listener("click", function MarkoptionsComponent_div_13_Template_div_click_12_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.open("D"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(13, "svg", 22);
    \u0275\u0275element(14, "path", 23)(15, "path", 24)(16, "path", 25)(17, "path", 26)(18, "path", 27)(19, "path", 28)(20, "path", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(21, "span");
    \u0275\u0275text(22);
    \u0275\u0275pipe(23, "translate");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(10);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(11, 2, "PDF.MARKOPTIONS.FACT"));
    \u0275\u0275advance(12);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(23, 4, "PDF.MARKOPTIONS.DOCLINK"));
  }
}
function MarkoptionsComponent_ng_template_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 30);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r4 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r4.output);
  }
}
function MarkoptionsComponent_ng_template_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 30);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r5 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r5.output);
  }
}
function MarkoptionsComponent_div_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "div", 14);
    \u0275\u0275listener("click", function MarkoptionsComponent_div_23_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "div", 15);
    \u0275\u0275listener("click", function MarkoptionsComponent_div_23_Template_div_click_2_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.open("F"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 16);
    \u0275\u0275element(4, "path", 17)(5, "path", 18)(6, "path", 19)(7, "path", 20)(8, "path", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "span");
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "div", 15);
    \u0275\u0275listener("click", function MarkoptionsComponent_div_23_Template_div_click_12_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.open("D"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(13, "svg", 22);
    \u0275\u0275element(14, "path", 23)(15, "path", 24)(16, "path", 25)(17, "path", 26)(18, "path", 27)(19, "path", 28)(20, "path", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(21, "span");
    \u0275\u0275text(22);
    \u0275\u0275pipe(23, "translate");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(10);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(11, 2, "PDF.MARKOPTIONS.FACT"));
    \u0275\u0275advance(12);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(23, 4, "PDF.MARKOPTIONS.DOCLINK"));
  }
}
var MarkoptionsComponent = class _MarkoptionsComponent {
  constructor() {
    this.startPg = 1;
    this.endPg = 1;
    this.fileMode = "F";
    this.CurruntSelected = "C";
    this.linkEvent = new EventEmitter();
    this.rangeList = [];
    this.endRangeList = [];
  }
  OnPageModeChange(ev) {
  }
  OnPageSelected(flag) {
    if (flag === "S") {
      this.updateEndRangeList();
    }
  }
  updateEndRangeList() {
    if (this.rangeList && this.rangeList.length > 0) {
      this.endRangeList = this.rangeList.filter((item) => item.page > this.startPg);
      if (this.endRangeList.length === 0) {
        this.endPg = this.startPg;
      } else if (this.endPg <= this.startPg) {
        this.endPg = this.endRangeList[this.endRangeList.length - 1].page;
      }
    }
  }
  ngOnInit() {
    this.updateEndRangeList();
  }
  ngOnChanges(changes) {
    if (changes["rangeList"] && this.rangeList) {
      this.updateEndRangeList();
    }
  }
  open(flag) {
    document.activeElement.blur();
    if (this.CurruntSelected == "D") {
      this.startPg = 1;
      this.endPg = this.rangeList.length ? this.rangeList[this.rangeList.length - 1].page : 1;
    }
    this.linkEvent.emit({ event: "LINK-EVENT", data: { mode: this.fileMode, linkMode: flag, selectedMode: this.CurruntSelected, start: this.startPg, end: this.endPg } });
  }
  //  submit(btn) {
  //   (document.activeElement as HTMLElement).blur();
  //   this.linkEvent.emit({ event: 'LINK-EVENT', data: { mode: this.fileMode, linkMode: this.linkMode, start: this.startPg, end: this.endPg } });
  // }
  select(flag) {
    this.CurruntSelected = flag;
  }
  static {
    this.\u0275fac = function MarkoptionsComponent_Factory(t) {
      return new (t || _MarkoptionsComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _MarkoptionsComponent, selectors: [["markoptions"]], viewQuery: function MarkoptionsComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(MatMenuTrigger, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.menuTrigger = _t.first);
      }
    }, inputs: { rangeList: "rangeList" }, outputs: { linkEvent: "linkEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 24, vars: 26, consts: [[1, "flex", "gap-2.5", "items-center"], [1, "flex", "gap-2.5", "ps-2.5", 3, "click"], [1, "!w-[16px]", "!h-[16px]", "rounded-full", "flex", "items-center", "justify-center", "border", "border-tab", "bg-white", "shadow-[0px_0px_0px_1px_#ffffff]"], [1, "text-xs", "whitespace-nowrap"], ["class", "w-[119px] !rounded-none absolute top-full", 4, "ngIf"], [1, "flex", "items-center", "ps-2.5", 3, "click"], [1, "!min-w-[16px]", "!h-[16px]", "rounded-full", "flex", "items-center", "justify-center", "border", "border-tab", "bg-white", "shadow-[0px_0px_0px_1px_#ffffff]"], [1, "text-base", "flex", "items-center", "gap-2"], [1, "text-xs", "ms-1", "text-grey", "whitespace-nowrap"], ["appendTo", "body", "bindLabel", "output", "bindValue", "page", "placeholder", "Select...", 1, "pagerefslct", "bg-white", "!px-0", "h-6", "!rounded-base", "min-w-20", "overflow-hidden", "!border", "!border-tab", 2, "border", "1px solid #c2c2c2 !important", 3, "ngModelChange", "change", "disabled", "items", "ngModel", "hidden"], ["ng-option-tmp", ""], [1, "flex", "gap-2", "ps-2.5", 3, "click"], [1, "text-xs"], [1, "w-[119px]", "!rounded-none", "absolute", "top-full"], [1, "bg-dark-blue", "relative", "overflow-hidden", "shadow-[1px_2px_6px_1px_#00000042]", 3, "click"], [1, "h-10", "flex", "items-center", "px-5", "hover:bg-black", "text-blue-hover", "hover:text-white", "gap-2.5", "text-xs", 3, "click"], ["width", "16", "height", "14", "viewBox", "0 0 16 14", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "w-5"], ["d", "M3.99531 12C3.78314 12 3.57966 12.0843 3.42963 12.2343C3.2796 12.3843 3.19531 12.5878 3.19531 12.8C3.19531 13.0122 3.2796 13.2157 3.42963 13.3657C3.57966 13.5157 3.78314 13.6 3.99531 13.6H15.1953C15.4075 13.6 15.611 13.5157 15.761 13.3657C15.911 13.2157 15.9953 13.0122 15.9953 12.8C15.9953 12.5878 15.911 12.3843 15.761 12.2343C15.611 12.0843 15.4075 12 15.1953 12H3.99531Z", "fill", "currentColor"], ["d", "M8.79688 4.8C8.79688 4.58783 8.88116 4.38434 9.03119 4.23431C9.18122 4.08429 9.3847 4 9.59687 4H15.1969C15.409 4 15.6125 4.08429 15.7626 4.23431C15.9126 4.38434 15.9969 4.58783 15.9969 4.8C15.9969 5.01217 15.9126 5.21566 15.7626 5.36569C15.6125 5.51571 15.409 5.6 15.1969 5.6H9.59687C9.3847 5.6 9.18122 5.51571 9.03119 5.36569C8.88116 5.21566 8.79688 5.01217 8.79688 4.8Z", "fill", "currentColor"], ["d", "M3.19531 0.8C3.19531 0.587827 3.2796 0.384344 3.42963 0.234315C3.57966 0.0842854 3.78314 0 3.99531 0H15.1953C15.4075 0 15.611 0.0842854 15.761 0.234315C15.911 0.384344 15.9953 0.587827 15.9953 0.8C15.9953 1.01217 15.911 1.21566 15.761 1.36569C15.611 1.51571 15.4075 1.6 15.1953 1.6H3.99531C3.78314 1.6 3.57966 1.51571 3.42963 1.36569C3.2796 1.21566 3.19531 1.01217 3.19531 0.8Z", "fill", "currentColor"], ["d", "M8.79688 8.8C8.79688 8.58783 8.88116 8.38434 9.03119 8.23431C9.18122 8.08429 9.3847 8 9.59687 8H15.1969C15.409 8 15.6125 8.08429 15.7626 8.23431C15.9126 8.38434 15.9969 8.58783 15.9969 8.8C15.9969 9.01217 15.9126 9.21566 15.7626 9.36569C15.6125 9.51571 15.409 9.6 15.1969 9.6H9.59687C9.3847 9.6 9.18122 9.51571 9.03119 9.36569C8.88116 9.21566 8.79688 9.01217 8.79688 8.8Z", "fill", "currentColor"], ["d", "M7.2 6.79531C7.2 7.26807 7.10688 7.7362 6.92597 8.17297C6.74505 8.60974 6.47987 9.00661 6.14558 9.3409C5.81129 9.67519 5.41443 9.94036 4.97766 10.1213C4.54089 10.3022 4.07276 10.3953 3.6 10.3953C3.12724 10.3953 2.65911 10.3022 2.22234 10.1213C1.78557 9.94036 1.38871 9.67519 1.05442 9.3409C0.720125 9.00661 0.454951 8.60974 0.274034 8.17297C0.0931168 7.7362 -7.04465e-09 7.26807 0 6.79531C1.42273e-08 5.84053 0.379285 4.92486 1.05442 4.24973C1.72955 3.5746 2.64522 3.19531 3.6 3.19531C4.55478 3.19531 5.47045 3.5746 6.14558 4.24973C6.82071 4.92486 7.2 5.84053 7.2 6.79531ZM4 5.19531C4 5.08923 3.95786 4.98748 3.88284 4.91247C3.80783 4.83745 3.70609 4.79531 3.6 4.79531C3.49391 4.79531 3.39217 4.83745 3.31716 4.91247C3.24214 4.98748 3.2 5.08923 3.2 5.19531V6.39531H2C1.89391 6.39531 1.79217 6.43745 1.71716 6.51247C1.64214 6.58748 1.6 6.68923 1.6 6.79531C1.6 6.9014 1.64214 7.00314 1.71716 7.07816C1.79217 7.15317 1.89391 7.19531 2 7.19531H3.2V8.39531C3.2 8.5014 3.24214 8.60314 3.31716 8.67816C3.39217 8.75317 3.49391 8.79531 3.6 8.79531C3.70609 8.79531 3.80783 8.75317 3.88284 8.67816C3.95786 8.60314 4 8.5014 4 8.39531V7.19531H5.2C5.30609 7.19531 5.40783 7.15317 5.48284 7.07816C5.55786 7.00314 5.6 6.9014 5.6 6.79531C5.6 6.68923 5.55786 6.58748 5.48284 6.51247C5.40783 6.43745 5.30609 6.39531 5.2 6.39531H4V5.19531Z", "fill", "currentColor"], ["width", "15", "height", "15", "viewBox", "0 0 15 15", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "w-5"], ["d", "M0 7.5C0 7.35082 0.0623823 7.20774 0.173424 7.10225C0.284465 6.99676 0.435069 6.9375 0.592105 6.9375H1.77632C1.93335 6.9375 2.08396 6.99676 2.195 7.10225C2.30604 7.20774 2.36842 7.35082 2.36842 7.5C2.36842 7.64918 2.30604 7.79226 2.195 7.89775C2.08396 8.00324 1.93335 8.0625 1.77632 8.0625H0.592105C0.435069 8.0625 0.284465 8.00324 0.173424 7.89775C0.0623823 7.79226 0 7.64918 0 7.5Z", "fill", "currentColor"], ["d", "M3.15625 7.5C3.15625 7.35082 3.21863 7.20774 3.32967 7.10225C3.44071 6.99676 3.59132 6.9375 3.74836 6.9375H4.93257C5.0896 6.9375 5.24021 6.99676 5.35125 7.10225C5.46229 7.20774 5.52467 7.35082 5.52467 7.5C5.52467 7.64918 5.46229 7.79226 5.35125 7.89775C5.24021 8.00324 5.0896 8.0625 4.93257 8.0625H3.74836C3.59132 8.0625 3.44071 8.00324 3.32967 7.89775C3.21863 7.79226 3.15625 7.64918 3.15625 7.5Z", "fill", "currentColor"], ["d", "M6.3125 7.5C6.3125 7.35082 6.37488 7.20774 6.48592 7.10225C6.59697 6.99676 6.74757 6.9375 6.90461 6.9375H8.08882C8.24585 6.9375 8.39646 6.99676 8.5075 7.10225C8.61854 7.20774 8.68092 7.35082 8.68092 7.5C8.68092 7.64918 8.61854 7.79226 8.5075 7.89775C8.39646 8.00324 8.24585 8.0625 8.08882 8.0625H6.90461C6.74757 8.0625 6.59697 8.00324 6.48592 7.89775C6.37488 7.79226 6.3125 7.64918 6.3125 7.5Z", "fill", "currentColor"], ["d", "M9.46875 7.5C9.46875 7.35082 9.53113 7.20774 9.64217 7.10225C9.75322 6.99676 9.90382 6.9375 10.0609 6.9375H11.2451C11.4021 6.9375 11.5527 6.99676 11.6637 7.10225C11.7748 7.20774 11.8372 7.35082 11.8372 7.5C11.8372 7.64918 11.7748 7.79226 11.6637 7.89775C11.5527 8.00324 11.4021 8.0625 11.2451 8.0625H10.0609C9.90382 8.0625 9.75322 8.00324 9.64217 7.89775C9.53113 7.79226 9.46875 7.64918 9.46875 7.5Z", "fill", "currentColor"], ["d", "M12.6328 7.5C12.6328 7.35082 12.6952 7.20774 12.8062 7.10225C12.9173 6.99676 13.0679 6.9375 13.2249 6.9375H14.4091C14.5662 6.9375 14.7168 6.99676 14.8278 7.10225C14.9389 7.20774 15.0012 7.35082 15.0012 7.5C15.0012 7.64918 14.9389 7.79226 14.8278 7.89775C14.7168 8.00324 14.5662 8.0625 14.4091 8.0625H13.2249C13.0679 8.0625 12.9173 8.00324 12.8062 7.89775C12.6952 7.79226 12.6328 7.64918 12.6328 7.5Z", "fill", "currentColor"], ["d", "M1.96916 0C1.75978 0 1.55897 0.0790176 1.41092 0.21967C1.26286 0.360322 1.17969 0.551088 1.17969 0.75V3.75C1.17969 4.14782 1.34604 4.52936 1.64215 4.81066C1.93826 5.09196 2.33987 5.25 2.75863 5.25H12.2323C12.6511 5.25 13.0527 5.09196 13.3488 4.81066C13.6449 4.52936 13.8113 4.14782 13.8113 3.75V0.75C13.8113 0.551088 13.7281 0.360322 13.58 0.21967C13.432 0.0790176 13.2312 0 13.0218 0H1.96916Z", "fill", "currentColor"], ["d", "M13.0218 15C13.2312 15 13.432 14.921 13.58 14.7803C13.7281 14.6397 13.8113 14.4489 13.8113 14.25V11.25C13.8113 10.8522 13.6449 10.4706 13.3488 10.1893C13.0527 9.90804 12.6511 9.75 12.2323 9.75H2.75863C2.33987 9.75 1.93826 9.90804 1.64215 10.1893C1.34604 10.4706 1.17969 10.8522 1.17969 11.25V14.25C1.17969 14.4489 1.26286 14.6397 1.41092 14.7803C1.55897 14.921 1.75978 15 1.96916 15H13.0218Z", "fill", "currentColor"], [1, "text-xs", "font-normal"]], template: function MarkoptionsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275listener("click", function MarkoptionsComponent_Template_div_click_1_listener() {
          return ctx.select("C");
        });
        \u0275\u0275element(2, "span", 2);
        \u0275\u0275elementStart(3, "span", 3);
        \u0275\u0275text(4);
        \u0275\u0275pipe(5, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275template(6, MarkoptionsComponent_div_6_Template, 24, 6, "div", 4);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "div", 5);
        \u0275\u0275listener("click", function MarkoptionsComponent_Template_div_click_7_listener() {
          return ctx.select("P");
        });
        \u0275\u0275element(8, "span", 6);
        \u0275\u0275elementStart(9, "span", 7)(10, "span", 8);
        \u0275\u0275text(11);
        \u0275\u0275pipe(12, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275template(13, MarkoptionsComponent_div_13_Template, 24, 6, "div", 4);
        \u0275\u0275elementStart(14, "ng-select", 9);
        \u0275\u0275twoWayListener("ngModelChange", function MarkoptionsComponent_Template_ng_select_ngModelChange_14_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.startPg, $event) || (ctx.startPg = $event);
          return $event;
        });
        \u0275\u0275listener("change", function MarkoptionsComponent_Template_ng_select_change_14_listener() {
          return ctx.OnPageSelected("S");
        });
        \u0275\u0275template(15, MarkoptionsComponent_ng_template_15_Template, 2, 1, "ng-template", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "ng-select", 9);
        \u0275\u0275twoWayListener("ngModelChange", function MarkoptionsComponent_Template_ng_select_ngModelChange_16_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.endPg, $event) || (ctx.endPg = $event);
          return $event;
        });
        \u0275\u0275listener("change", function MarkoptionsComponent_Template_ng_select_change_16_listener() {
          return ctx.OnPageSelected("E");
        });
        \u0275\u0275template(17, MarkoptionsComponent_ng_template_17_Template, 2, 1, "ng-template", 10);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(18, "div", 11);
        \u0275\u0275listener("click", function MarkoptionsComponent_Template_div_click_18_listener() {
          return ctx.select("D");
        });
        \u0275\u0275element(19, "span", 6);
        \u0275\u0275elementStart(20, "span", 12);
        \u0275\u0275text(21);
        \u0275\u0275pipe(22, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275template(23, MarkoptionsComponent_div_23_Template, 24, 6, "div", 4);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275classMap(ctx.CurruntSelected == "C" ? "!border-brand border-4" : "");
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(5, 20, "PDF.MARKOPTIONS.CURRENT_PAGE"), " ");
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.CurruntSelected == "C");
        \u0275\u0275advance(2);
        \u0275\u0275classMap(ctx.CurruntSelected == "P" ? "!border-brand border-4" : "");
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(12, 22, "PDF.MARKOPTIONS.PAGE_RANGE"));
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.CurruntSelected == "P");
        \u0275\u0275advance();
        \u0275\u0275property("disabled", !(ctx.rangeList == null ? null : ctx.rangeList.length))("items", ctx.rangeList);
        \u0275\u0275twoWayProperty("ngModel", ctx.startPg);
        \u0275\u0275property("hidden", !(ctx.rangeList == null ? null : ctx.rangeList.length));
        \u0275\u0275advance(2);
        \u0275\u0275property("disabled", !(ctx.endRangeList == null ? null : ctx.endRangeList.length))("items", ctx.endRangeList);
        \u0275\u0275twoWayProperty("ngModel", ctx.endPg);
        \u0275\u0275property("hidden", !(ctx.endRangeList == null ? null : ctx.endRangeList.length));
        \u0275\u0275advance(3);
        \u0275\u0275classMap(ctx.CurruntSelected == "D" ? "!border-brand border-4" : "");
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(22, 24, "PDF.MARKOPTIONS.DOCUMENT"), " ");
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.CurruntSelected == "D");
      }
    }, dependencies: [MatRadioModule, FormsModule, NgControlStatus, NgModel, MatMenuModule, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective, CommonModule, NgIf, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(MarkoptionsComponent, { className: "MarkoptionsComponent", filePath: "src\\app\\pdf\\components\\markoptions\\markoptions.component.ts", lineNumber: 17 });
})();

// src/app/pdf/components/toolbar/toolbar.component.ts
var _c03 = ["zoomIn"];
var _c13 = ["zoomOut"];
var _c2 = ["zoomInput"];
var _c3 = ["listItem"];
var _c4 = (a0) => ({ "!rounded-b-none pointer-events-none": a0 });
var _c5 = (a0) => ({ "rotate-180": a0 });
var _c6 = (a0, a1, a2, a3) => ({ "h-[59px] !bg-blue-on ps-3 !gap-x-1 !w-full": a0, "h-[50px] px-2.5": a1, "justify-between": a2, "!bg-[#002f64]": a3 });
var _c7 = (a0, a1) => ({ "!gap-x-0": a0, "w-full": a1 });
var _c8 = (a0) => ({ "me-auto !w-fit": a0 });
var _c9 = (a0, a1, a2) => ({ "-right-[15px]": a0, "right-0 !left-auto": a1, "!min-w-[420px] !max-w-[420px] -right-[15px]": a2 });
var _c10 = (a0) => ({ "w-full": a0 });
var _c11 = () => ({ arrow: false, placement: "bottom" });
var _c122 = () => ({ inputmode: "numeric", pattern: "[0-9]*" });
var _c132 = (a0, a1) => ({ "bg-white": a0, "!bg-reply": a1 });
function ToolbarComponent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 22);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_0_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.showhidetoolbar = !ctx_r1.showhidetoolbar);
    });
    \u0275\u0275element(2, "icon", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(2, _c4, ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(4, _c5, ctx_r1.showhidetoolbar));
  }
}
function ToolbarComponent_ng_container_1_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 59);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_5_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.changeThumbnailMode());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 60);
    \u0275\u0275element(3, "rect", 61)(4, "rect", 62)(5, "rect", 63)(6, "rect", 64);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("active", ctx_r1.thumbnailMode);
  }
}
function ToolbarComponent_ng_container_1_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 65);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_7_Template_svg_click_1_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("firstpage"));
    });
    \u0275\u0275element(2, "path", 66);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "svg", 65);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_7_Template_svg_click_3_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("previouspage"));
    });
    \u0275\u0275element(4, "path", 67);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_template_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "pdf-first-page", 68);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_template_8_Template_pdf_first_page_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("firstpage"));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "pdf-previous-page", 68);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_template_8_Template_pdf_previous_page_click_2_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("previouspage"));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("ngxTippy", \u0275\u0275pipeBind1(1, 4, "PDF.TOOLBAR.FIRST_PAGE"))("tippyProps", \u0275\u0275pureFunction0(8, _c11));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngxTippy", \u0275\u0275pipeBind1(3, 6, "PDF.TOOLBAR.PREVIOUS_PAGE"))("tippyProps", \u0275\u0275pureFunction0(9, _c11));
  }
}
function ToolbarComponent_ng_container_1_ng_container_10_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 71);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r8 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r8.output);
  }
}
function ToolbarComponent_ng_container_1_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "ng-select", 69);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275twoWayListener("ngModelChange", function ToolbarComponent_ng_container_1_ng_container_10_Template_ng_select_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.currentPage, $event) || (ctx_r1.currentPage = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function ToolbarComponent_ng_container_1_ng_container_10_Template_ng_select_change_1_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPageSelected());
    })("search", function ToolbarComponent_ng_container_1_ng_container_10_Template_ng_select_search_1_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPageSerch());
    })("keydown", function ToolbarComponent_ng_container_1_ng_container_10_Template_ng_select_keydown_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.restrictToNumbers($event));
    });
    \u0275\u0275template(3, ToolbarComponent_ng_container_1_ng_container_10_ng_template_3_Template, 2, 1, "ng-template", 70);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.isLink ? "min-w-[70px] max-w-[70px]" : "min-w-[93px] max-w-[93px]");
    \u0275\u0275property("disabled", !(ctx_r1.rangeList == null ? null : ctx_r1.rangeList.length))("items", ctx_r1.rangeList);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.currentPage);
    \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(2, 8, "PDF.TOOLBAR.SELECT"))("inputAttrs", \u0275\u0275pureFunction0(10, _c122))("hidden", !(ctx_r1.rangeList == null ? null : ctx_r1.rangeList.length));
  }
}
function ToolbarComponent_ng_container_1_ng_template_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 72);
    \u0275\u0275twoWayListener("ngModelChange", function ToolbarComponent_ng_container_1_ng_template_11_Template_input_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.currentPage, $event) || (ctx_r1.currentPage = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function ToolbarComponent_ng_container_1_ng_template_11_Template_input_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPage());
    })("keyup", function ToolbarComponent_ng_container_1_ng_template_11_Template_input_keyup_0_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.checkForMax($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.currentPage);
  }
}
function ToolbarComponent_ng_container_1_ng_container_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 73);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_13_Template_svg_click_1_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("nextpage"));
    });
    \u0275\u0275element(2, "path", 67);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "svg", 73);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_13_Template_svg_click_3_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("lastpage"));
    });
    \u0275\u0275element(4, "path", 66);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_template_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "pdf-next-page", 68);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_template_14_Template_pdf_next_page_click_0_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("nextpage"));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "pdf-last-page", 68);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_template_14_Template_pdf_last_page_click_2_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("lastpage"));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("ngxTippy", \u0275\u0275pipeBind1(1, 4, "PDF.TOOLBAR.NEXT_PAGE"))("tippyProps", \u0275\u0275pureFunction0(8, _c11));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngxTippy", \u0275\u0275pipeBind1(3, 6, "PDF.TOOLBAR.LAST_PAGE"))("tippyProps", \u0275\u0275pureFunction0(9, _c11));
  }
}
function ToolbarComponent_ng_container_1_ng_container_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 74)(2, "icon", 75);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_16_Template_icon_click_2_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openInIndividual());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(3, 1, "PDF.TOOLBAR.INDIVIDUAL"));
  }
}
function ToolbarComponent_ng_container_1_ng_container_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-checkbox", 76);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275twoWayListener("ngModelChange", function ToolbarComponent_ng_container_1_ng_container_22_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.isCheckedRotation, $event) || (ctx_r1.isCheckedRotation = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function ToolbarComponent_ng_container_1_ng_container_22_Template_mat_checkbox_change_1_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onRotationUpdate($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(2, 2, "PDF.TOOLBAR.KEEP_CHANGE"));
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.isCheckedRotation);
  }
}
function ToolbarComponent_ng_container_1_ng_container_23_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span", 85);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_23_ng_container_2_Template_span_click_1_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("zoomin"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 86);
    \u0275\u0275element(3, "path", 87);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(4, "span", 85);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_23_ng_container_2_Template_span_click_4_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("zoomout"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 86);
    \u0275\u0275element(6, "path", 88);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_23_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 89);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_23_ng_template_3_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r16);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("zoomin"));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(1, "icon", 90);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_23_ng_template_3_Template_icon_click_1_listener() {
      \u0275\u0275restoreView(_r16);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.OnPdfNavEvent("zoomout"));
    });
    \u0275\u0275elementEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_23_span_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 91);
    \u0275\u0275text(1, "%");
    \u0275\u0275elementEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_23_ng_container_18_ng_container_3_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 96);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_23_ng_container_18_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 95);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_23_ng_container_18_ng_container_3_Template_div_click_1_listener() {
      const level_r19 = \u0275\u0275restoreView(_r18).$implicit;
      \u0275\u0275nextContext(2);
      const z_r17 = \u0275\u0275reference(7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      ctx_r1.selectZoomLevel(level_r19);
      return \u0275\u0275resetView(z_r17.closeMenu());
    });
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275template(4, ToolbarComponent_ng_container_1_ng_container_23_ng_container_18_ng_container_3_ng_container_4_Template, 2, 0, "ng-container", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const level_r19 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(3, 2, level_r19.key), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", level_r19.value === ctx_r1.zoom);
  }
}
function ToolbarComponent_ng_container_1_ng_container_23_ng_container_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 92)(2, "div", 93);
    \u0275\u0275template(3, ToolbarComponent_ng_container_1_ng_container_23_ng_container_18_ng_container_3_Template, 5, 4, "ng-container", 94);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.filteredZoomLevels);
  }
}
function ToolbarComponent_ng_container_1_ng_container_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 77);
    \u0275\u0275template(2, ToolbarComponent_ng_container_1_ng_container_23_ng_container_2_Template, 7, 0, "ng-container", 29)(3, ToolbarComponent_ng_container_1_ng_container_23_ng_template_3_Template, 2, 0, "ng-template", null, 9, \u0275\u0275templateRefExtractor);
    \u0275\u0275element(5, "hr", 78);
    \u0275\u0275elementStart(6, "btn", 79, 10);
    \u0275\u0275listener("menuOpened", function ToolbarComponent_ng_container_1_ng_container_23_Template_btn_menuOpened_6_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onZoomMenuOpened());
    })("menuClosed", function ToolbarComponent_ng_container_1_ng_container_23_Template_btn_menuClosed_6_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onZoomMenuClosed());
    })("click", function ToolbarComponent_ng_container_1_ng_container_23_Template_btn_click_6_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onZoomButtonClick($event));
    });
    \u0275\u0275elementStart(8, "div", 46)(9, "div", 80)(10, "div", 81, 11);
    \u0275\u0275listener("input", function ToolbarComponent_ng_container_1_ng_container_23_Template_div_input_10_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onZoomInputChange($event));
    })("keydown", function ToolbarComponent_ng_container_1_ng_container_23_Template_div_keydown_10_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onZoomKeyDown($event));
    })("keyup.enter", function ToolbarComponent_ng_container_1_ng_container_23_Template_div_keyup_enter_10_listener() {
      \u0275\u0275restoreView(_r14);
      const z_r17 = \u0275\u0275reference(7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      ctx_r1.applyCustomZoom();
      return \u0275\u0275resetView(z_r17.closeMenu());
    })("blur", function ToolbarComponent_ng_container_1_ng_container_23_Template_div_blur_10_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onZoomBlur());
    })("click", function ToolbarComponent_ng_container_1_ng_container_23_Template_div_click_10_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onZoomInputClick($event));
    });
    \u0275\u0275text(12);
    \u0275\u0275pipe(13, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(14, ToolbarComponent_ng_container_1_ng_container_23_span_14_Template, 2, 0, "span", 82);
    \u0275\u0275elementEnd();
    \u0275\u0275element(15, "icon", 83);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "mat-menu", 84, 12);
    \u0275\u0275template(18, ToolbarComponent_ng_container_1_ng_container_23_ng_container_18_Template, 4, 1, "ng-container", 21);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const defaultZoom_r20 = \u0275\u0275reference(4);
    const zoomMenu_r21 = \u0275\u0275reference(17);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(13, _c132, ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime, ctx_r1.source == "RT"));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.compareMode)("ngIfElse", defaultZoom_r20);
    \u0275\u0275advance(4);
    \u0275\u0275property("addcls", (ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime) ? "!bg-white !px-0" : "!shadow-none !px-0")("matMenuTriggerFor", zoomMenu_r21);
    \u0275\u0275advance(4);
    \u0275\u0275classProp("empty", !ctx_r1.zoomInputValue);
    \u0275\u0275attribute("contenteditable", ctx_r1.isZoomMenuOpen ? "true" : "false");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(13, 11, ctx_r1.getZoomValue()), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.shouldShowPercentage());
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", ctx_r1.filteredZoomLevels.length);
  }
}
function ToolbarComponent_ng_container_1_ng_template_24_Template(rf, ctx) {
  if (rf & 1) {
    const _r22 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 97, 10);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275element(3, "icon", 98);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-menu", 99, 13)(6, "div", 100)(7, "div", 101)(8, "div", 102)(9, "mat-slider", 103);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_template_24_Template_mat_slider_click_9_listener($event) {
      \u0275\u0275restoreView(_r22);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(10, "input", 104);
    \u0275\u0275twoWayListener("ngModelChange", function ToolbarComponent_ng_container_1_ng_template_24_Template_input_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r22);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.slidervalue, $event) || (ctx_r1.slidervalue = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ToolbarComponent_ng_container_1_ng_template_24_Template_input_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r22);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.sliderzoom($event));
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "div", 105)(12, "icon", 106);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_template_24_Template_icon_click_12_listener() {
      \u0275\u0275restoreView(_r22);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.resetzoom());
    });
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const z_r23 = \u0275\u0275reference(1);
    const menu_r24 = \u0275\u0275reference(5);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("square", true)("active", z_r23.menuOpen)("matTooltip", \u0275\u0275pipeBind1(2, 7, "PDF.TOOLBAR.ZOOM"))("addcls", (ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime) ? "!bg-white" : "!shadow-none")("matMenuTriggerFor", menu_r24);
    \u0275\u0275advance(9);
    \u0275\u0275property("displayWith", ctx_r1.formatLabel);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.slidervalue);
  }
}
function ToolbarComponent_ng_container_1_ng_container_26_Template(rf, ctx) {
  if (rf & 1) {
    const _r25 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 107);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_26_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r25);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.share());
    });
    \u0275\u0275element(3, "icon", 108)(4, "icon", 109);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("addcls", ctx_r1.showshare ? "shadow-none group !text-blue-on" : "shadow-none group")("matTooltip", \u0275\u0275pipeBind1(2, 5, "PDF.TOOLBAR.SHARE_FILE"))("active", ctx_r1.handTool);
    \u0275\u0275advance(3);
    \u0275\u0275classMap(ctx_r1.showshare ? "rotate-90 !inline-block" : "");
  }
}
function ToolbarComponent_ng_container_1_ng_container_27_Template(rf, ctx) {
  if (rf & 1) {
    const _r26 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 110);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_27_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r26);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.hand());
    });
    \u0275\u0275element(3, "icon", 111);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("mode", ctx_r1.fullMode && !(ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime) ? "outlined" : "white")("addcls", (ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime) ? "!bg-white" : ctx_r1.fullMode ? "" : "shadow-none")("square", true)("matTooltip", \u0275\u0275pipeBind1(2, 5, "PDF.TOOLBAR.GRAB_MOVE"))("active", ctx_r1.handTool);
  }
}
function ToolbarComponent_ng_container_1_ng_container_28_Template(rf, ctx) {
  if (rf & 1) {
    const _r27 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 112);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_28_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r27);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.changeCompareMode());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 113)(4, "mask", 114);
    \u0275\u0275element(5, "path", 115);
    \u0275\u0275elementEnd();
    \u0275\u0275element(6, "path", 116);
    \u0275\u0275elementStart(7, "mask", 117);
    \u0275\u0275element(8, "path", 118);
    \u0275\u0275elementEnd();
    \u0275\u0275element(9, "path", 119);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("square", true)("matTooltip", \u0275\u0275pipeBind1(2, 3, "PDF.TOOLBAR.COMPARE_DOCS"))("active", ctx_r1.compareMode);
  }
}
function ToolbarComponent_ng_container_1_ng_container_38_Template(rf, ctx) {
  if (rf & 1) {
    const _r29 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "pdfsearch", 120);
    \u0275\u0275twoWayListener("jFilterChange", function ToolbarComponent_ng_container_1_ng_container_38_Template_pdfsearch_jFilterChange_1_listener($event) {
      \u0275\u0275restoreView(_r29);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.jFilter, $event) || (ctx_r1.jFilter = $event);
      return \u0275\u0275resetView($event);
    })("isElasticSearchedChange", function ToolbarComponent_ng_container_1_ng_container_38_Template_pdfsearch_isElasticSearchedChange_1_listener($event) {
      \u0275\u0275restoreView(_r29);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.isElasticSearched, $event) || (ctx_r1.isElasticSearched = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("searchEvents", function ToolbarComponent_ng_container_1_ng_container_38_Template_pdfsearch_searchEvents_1_listener($event) {
      \u0275\u0275restoreView(_r29);
      \u0275\u0275nextContext();
      const SM_r28 = \u0275\u0275reference(31);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onSeach($event, SM_r28));
    })("ValueUpdate", function ToolbarComponent_ng_container_1_ng_container_38_Template_pdfsearch_ValueUpdate_1_listener($event) {
      \u0275\u0275restoreView(_r29);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnValueUpdate($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("totalSearch", ctx_r1.totalSearch)("pdfLoaded", ctx_r1.pdfLoaded)("currentSearch", ctx_r1.currentSearch)("isSearching", ctx_r1.isSearching)("cSearch", ctx_r1.cSearch)("matchCase", ctx_r1.matchCase)("wholeWords", ctx_r1.wholeWords)("isfullmode", ctx_r1.fullMode);
    \u0275\u0275twoWayProperty("jFilter", ctx_r1.jFilter)("isElasticSearched", ctx_r1.isElasticSearched);
    \u0275\u0275property("totalElasticMaches", ctx_r1.totalElasticMaches)("cSearchChange", ctx_r1.cSearchChange)("elasticPages", ctx_r1.elasticPages);
  }
}
function ToolbarComponent_ng_container_1_ng_container_39_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 131);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_39_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 132);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_39_ng_container_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 133);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_39_ng_container_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 133);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_39_Template(rf, ctx) {
  if (rf & 1) {
    const _r30 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 121)(2, "span", 122);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_39_Template_span_click_2_listener() {
      \u0275\u0275restoreView(_r30);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.ToolgeCanvas());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementStart(5, "div", 123, 14);
    \u0275\u0275template(7, ToolbarComponent_ng_container_1_ng_container_39_ng_container_7_Template, 2, 0, "ng-container", 21)(8, ToolbarComponent_ng_container_1_ng_container_39_ng_container_8_Template, 2, 0, "ng-container", 21);
    \u0275\u0275elementStart(9, "span", 124);
    \u0275\u0275element(10, "icon", 125);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "mat-menu", 126, 15)(13, "div", 127)(14, "div", 128);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_39_Template_div_click_14_listener() {
      \u0275\u0275restoreView(_r30);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.canvasChange("DR"));
    });
    \u0275\u0275element(15, "icon", 129);
    \u0275\u0275text(16);
    \u0275\u0275pipe(17, "translate");
    \u0275\u0275template(18, ToolbarComponent_ng_container_1_ng_container_39_ng_container_18_Template, 2, 0, "ng-container", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "div", 128);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_39_Template_div_click_19_listener() {
      \u0275\u0275restoreView(_r30);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.canvasChange("R"));
    });
    \u0275\u0275element(20, "icon", 130);
    \u0275\u0275text(21);
    \u0275\u0275pipe(22, "translate");
    \u0275\u0275template(23, ToolbarComponent_ng_container_1_ng_container_39_ng_container_23_Template, 2, 0, "ng-container", 21);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const cm_r31 = \u0275\u0275reference(6);
    const canvasMenu_r32 = \u0275\u0275reference(12);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r1.isCanvasActive ? "border-[5px] !border-brand" : "");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 14, "PDF.TOOLBAR.CANVAS"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("matMenuTriggerFor", canvasMenu_r32);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.annoticontype == "DR" || ctx_r1.annoticontype == "F");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.annoticontype == "R");
    \u0275\u0275advance();
    \u0275\u0275classMap(cm_r31.menuOpen ? "bg-blue-deactivate text-blue-on" : "");
    \u0275\u0275advance();
    \u0275\u0275classProp("rotate-180", cm_r31.menuOpen);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(17, 16, "PDF.TOOLBAR.PEN"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.annoticontype == "DR");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(22, 18, "PDF.TOOLBAR.SHAPE"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.annoticontype == "R");
  }
}
function ToolbarComponent_ng_container_1_ng_container_40_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 137);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_40_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 131);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_40_ng_container_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 133);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_40_ng_container_25_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 133);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_40_Template(rf, ctx) {
  if (rf & 1) {
    const _r33 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 134)(2, "span", 122);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_40_Template_span_click_2_listener() {
      \u0275\u0275restoreView(_r33);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.togglePresenterHighlight());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementStart(5, "div", 123, 16);
    \u0275\u0275template(7, ToolbarComponent_ng_container_1_ng_container_40_ng_container_7_Template, 2, 0, "ng-container", 21)(8, ToolbarComponent_ng_container_1_ng_container_40_ng_container_8_Template, 2, 0, "ng-container", 21);
    \u0275\u0275elementStart(9, "span", 124);
    \u0275\u0275element(10, "icon", 125);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "mat-menu", 126, 17)(13, "div", 127)(14, "div", 128);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_40_Template_div_click_14_listener() {
      \u0275\u0275restoreView(_r33);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.presenterHighlightChange("text"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(15, "svg", 135)(16, "text", 136);
    \u0275\u0275text(17, "T");
    \u0275\u0275elementEnd()();
    \u0275\u0275text(18);
    \u0275\u0275pipe(19, "translate");
    \u0275\u0275template(20, ToolbarComponent_ng_container_1_ng_container_40_ng_container_20_Template, 2, 0, "ng-container", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(21, "div", 128);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_40_Template_div_click_21_listener() {
      \u0275\u0275restoreView(_r33);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.presenterHighlightChange("pen"));
    });
    \u0275\u0275element(22, "icon", 129);
    \u0275\u0275text(23);
    \u0275\u0275pipe(24, "translate");
    \u0275\u0275template(25, ToolbarComponent_ng_container_1_ng_container_40_ng_container_25_Template, 2, 0, "ng-container", 21);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const hm_r34 = \u0275\u0275reference(6);
    const highlightMenu_r35 = \u0275\u0275reference(12);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.isPresenterHighlightActive ? "bg-blue-on text-white" : "text-grey bg-white");
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.isPresenterHighlightActive ? "border-[5px] !border-brand" : "");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 16, "PDF.TOOLBAR.HIGHLIGHT"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("matMenuTriggerFor", highlightMenu_r35);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.presenterHighlightMode === "text");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.presenterHighlightMode === "pen");
    \u0275\u0275advance();
    \u0275\u0275classMap(hm_r34.menuOpen ? "bg-blue-deactivate text-blue-on" : "");
    \u0275\u0275advance();
    \u0275\u0275classProp("rotate-180", hm_r34.menuOpen);
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(19, 18, "PDF.TOOLBAR.TEXT_HIGHLIGHT"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.presenterHighlightMode === "text");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(24, 20, "PDF.TOOLBAR.PEN_HIGHLIGHT"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.presenterHighlightMode === "pen");
  }
}
function ToolbarComponent_ng_container_1_ng_container_41_Template(rf, ctx) {
  if (rf & 1) {
    const _r36 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 138)(2, "icon", 139);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_41_Template_icon_click_2_listener() {
      \u0275\u0275restoreView(_r36);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.closeRealtimePdf());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(3, 1, "PDF.TOOLBAR.CLOSE_PREVIEW"));
  }
}
function ToolbarComponent_ng_container_1_ng_container_43_Template(rf, ctx) {
  if (rf & 1) {
    const _r37 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 140, 18);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 141)(4, "g", 142);
    \u0275\u0275element(5, "path", 143);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "defs")(7, "clipPath", 144);
    \u0275\u0275element(8, "rect", 145);
    \u0275\u0275elementEnd()()();
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(11, "mat-menu", 146, 19)(13, "markoptions", 147);
    \u0275\u0275listener("linkEvent", function ToolbarComponent_ng_container_1_ng_container_43_Template_markoptions_linkEvent_13_listener($event) {
      \u0275\u0275restoreView(_r37);
      const mm_r38 = \u0275\u0275reference(2);
      const ctx_r1 = \u0275\u0275nextContext(2);
      ctx_r1.OnLinkEvents($event);
      return \u0275\u0275resetView(mm_r38.closeMenu());
    })("click", function ToolbarComponent_ng_container_1_ng_container_43_Template_markoptions_click_13_listener($event) {
      \u0275\u0275restoreView(_r37);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const mm_r38 = \u0275\u0275reference(2);
    const mark_r39 = \u0275\u0275reference(12);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("matMenuTriggerFor", mark_r39)("active", mm_r38.menuOpen);
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(10, 4, "PDF.TOOLBAR.MARK"), " ");
    \u0275\u0275advance(4);
    \u0275\u0275property("rangeList", ctx_r1.rangeList.length ? ctx_r1.rangeList : ctx_r1.from_rng);
  }
}
function ToolbarComponent_ng_container_1_ng_container_44_Template(rf, ctx) {
  if (rf & 1) {
    const _r40 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 148, 18);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_44_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r40);
      const mm_r41 = \u0275\u0275reference(2);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.toggleAdjustDoc(mm_r41.menuOpen));
    });
    \u0275\u0275element(4, "icon", 149);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275element(7, "selection-actions-control");
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const mm_r41 = \u0275\u0275reference(2);
    \u0275\u0275nextContext();
    const Adjacent_r42 = \u0275\u0275reference(46);
    \u0275\u0275advance();
    \u0275\u0275property("matMenuTriggerFor", Adjacent_r42)("matTooltip", \u0275\u0275pipeBind1(3, 4, "PDF.TOOLBAR.VIEW_ADJACENT"))("active", mm_r41.menuOpen);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(6, 6, "PDF.TOOLBAR.VIEW_ADJACENT"), " ");
  }
}
function ToolbarComponent_ng_container_1_ng_container_79_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 150);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_84_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 150);
    \u0275\u0275elementContainerEnd();
  }
}
function ToolbarComponent_ng_container_1_ng_container_85_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r44 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 156)(2, "btn", 157);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_ng_container_1_ng_container_1_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r44);
      const ctx_r1 = \u0275\u0275nextContext(4);
      ctx_r1.changeIsAnotTool(false);
      return \u0275\u0275resetView(ctx_r1.navigate());
    });
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r1.isDisabledNavigate)("matTooltip", \u0275\u0275pipeBind1(3, 5, "PDF.TOOLBAR.NAVIGATE_MARKS"))("active", ctx_r1.isnavigate);
    \u0275\u0275attribute("disabled", ctx_r1.isDisabledNavigate);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(5, 7, "PDF.TOOLBAR.MARK_NAV"), " ");
  }
}
function ToolbarComponent_ng_container_1_ng_container_85_ng_container_1_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r45 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 158, 20);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_ng_container_1_ng_container_2_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r45);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.changeIsAnotTool(false));
    });
    \u0275\u0275element(4, "icon", 159);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const tools_r46 = \u0275\u0275reference(2);
    \u0275\u0275nextContext(2);
    const menu_r47 = \u0275\u0275reference(3);
    \u0275\u0275advance();
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(3, 3, "PDF.TOOLBAR.MORE_OPTIONS"))("active", tools_r46.menuOpen)("matMenuTriggerFor", menu_r47);
  }
}
function ToolbarComponent_ng_container_1_ng_container_85_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ToolbarComponent_ng_container_1_ng_container_85_ng_container_1_ng_container_1_Template, 6, 9, "ng-container", 21)(2, ToolbarComponent_ng_container_1_ng_container_85_ng_container_1_ng_container_2_Template, 5, 5, "ng-container", 21);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isHavehighlights);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !(ctx_r1.docInfo == null ? null : ctx_r1.docInfo.nPresentid) || !(ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isHost));
  }
}
function ToolbarComponent_ng_container_1_ng_container_85_ng_container_36_Template(rf, ctx) {
  if (rf & 1) {
    const _r48 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 160)(2, "h6", 161)(3, "span", 44);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "span", 162);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_ng_container_36_Template_span_click_6_listener() {
      \u0275\u0275restoreView(_r48);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.closeRealtimePdf());
    });
    \u0275\u0275text(7);
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "icon", 163);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_ng_container_36_Template_icon_click_9_listener() {
      \u0275\u0275restoreView(_r48);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.closeRealtimePdf());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(5, 2, "PDF.TOOLBAR.COMPARE_MODE"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(8, 4, "PDF.TOOLBAR.EXIT_COMPARE_MODE"));
  }
}
function ToolbarComponent_ng_container_1_ng_container_85_Template(rf, ctx) {
  if (rf & 1) {
    const _r43 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ToolbarComponent_ng_container_1_ng_container_85_ng_container_1_Template, 3, 2, "ng-container", 21);
    \u0275\u0275elementStart(2, "mat-menu", 151, 13)(4, "div", 152);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_Template_div_click_4_listener() {
      \u0275\u0275restoreView(_r43);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.export());
    });
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 152);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_Template_div_click_8_listener() {
      \u0275\u0275restoreView(_r43);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.downloadWithLinkfile());
    });
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "div", 152);
    \u0275\u0275pipe(13, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_Template_div_click_12_listener() {
      \u0275\u0275restoreView(_r43);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.locationshare());
    });
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "div", 152);
    \u0275\u0275pipe(17, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_Template_div_click_16_listener() {
      \u0275\u0275restoreView(_r43);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.issueManager());
    });
    \u0275\u0275text(18);
    \u0275\u0275pipe(19, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "div", 153);
    \u0275\u0275pipe(21, "translate");
    \u0275\u0275text(22);
    \u0275\u0275pipe(23, "translate");
    \u0275\u0275elementStart(24, "mat-slide-toggle", 154);
    \u0275\u0275twoWayListener("ngModelChange", function ToolbarComponent_ng_container_1_ng_container_85_Template_mat_slide_toggle_ngModelChange_24_listener($event) {
      \u0275\u0275restoreView(_r43);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.showAll, $event) || (ctx_r1.showAll = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function ToolbarComponent_ng_container_1_ng_container_85_Template_mat_slide_toggle_change_24_listener() {
      \u0275\u0275restoreView(_r43);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnShowAllChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(25, "div", 152);
    \u0275\u0275pipe(26, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_Template_div_click_25_listener() {
      \u0275\u0275restoreView(_r43);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnShowProperties());
    });
    \u0275\u0275text(27);
    \u0275\u0275pipe(28, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(29, "div", 152);
    \u0275\u0275pipe(30, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_Template_div_click_29_listener() {
      \u0275\u0275restoreView(_r43);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnShowFullScreen());
    });
    \u0275\u0275text(31);
    \u0275\u0275pipe(32, "translate");
    \u0275\u0275pipe(33, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "div", 155);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_ng_container_85_Template_div_click_34_listener() {
      \u0275\u0275restoreView(_r43);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onCalloutSnap());
    });
    \u0275\u0275text(35, " Callout Snap ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(36, ToolbarComponent_ng_container_1_ng_container_85_ng_container_36_Template, 10, 6, "ng-container", 21);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.linkExplorerMode && !ctx_r1.isLinkView && !ctx_r1.isLink && ctx_r1.source != "RT");
    \u0275\u0275advance(3);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(5, 18, "PDF.TOOLBAR.EXPORT_SELECTED"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(7, 20, "PDF.TOOLBAR.EXPORT"));
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(9, 22, "PDF.TOOLBAR.EXPORT_LINKED_BUNDLE"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(11, 24, "PDF.TOOLBAR.EXPORT_LINKED_BUNDLE"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(13, 26, "PDF.TOOLBAR.SHARE_THIS_DOCUMENT"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(15, 28, "PDF.TOOLBAR.SHARE_THIS_DOCUMENT"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(17, 30, "PDF.TOOLBAR.MANAGE_CLAIMS"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(19, 32, "PDF.TOOLBAR.MANAGE_CLAIMS"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(21, 34, "PDF.TOOLBAR.FULL_PAGE_LOCK"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(23, 36, "PDF.TOOLBAR.FULL_PAGE_LOCK"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.showAll);
    \u0275\u0275advance();
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(26, 38, "PDF.TOOLBAR.DOCUMENT_ASSOCIATIONS"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(28, 40, "PDF.TOOLBAR.DOCUMENT_ASSOCIATIONS"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(30, 42, "PDF.TOOLBAR.FULL_SCREEN_MODE"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", ctx_r1.isFullScreen ? \u0275\u0275pipeBind1(32, 44, "PDF.TOOLBAR.EXIT") : "", " ", \u0275\u0275pipeBind1(33, 46, "PDF.TOOLBAR.FULL_SCREEN_MODE"), " ");
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx_r1.source == "RT");
  }
}
function ToolbarComponent_ng_container_1_ng_container_86_Template(rf, ctx) {
  if (rf & 1) {
    const _r49 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "annot-tools", 164);
    \u0275\u0275listener("OnClose", function ToolbarComponent_ng_container_1_ng_container_86_Template_annot_tools_OnClose_1_listener($event) {
      \u0275\u0275restoreView(_r49);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnAnnotToolClose($event));
    })("OnModeChange", function ToolbarComponent_ng_container_1_ng_container_86_Template_annot_tools_OnModeChange_1_listener($event) {
      \u0275\u0275restoreView(_r49);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.modeChange($event));
    })("OnToolBoxEvent", function ToolbarComponent_ng_container_1_ng_container_86_Template_annot_tools_OnToolBoxEvent_1_listener($event) {
      \u0275\u0275restoreView(_r49);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnToolBoxEvent($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("@inOutAnimation", void 0)("annotToolMode", ctx_r1.annotToolMode)("nCaseid", ctx_r1.nCaseid)("highlightMode", ctx_r1.highlightMode)("selectedIssues", ctx_r1.selectedIssues)("docInfo", ctx_r1.docInfo);
  }
}
function ToolbarComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 24)(2, "ng-scrollbar", 25)(3, "div", 26)(4, "div", 27);
    \u0275\u0275template(5, ToolbarComponent_ng_container_1_ng_container_5_Template, 7, 1, "ng-container", 21);
    \u0275\u0275elementStart(6, "div", 28);
    \u0275\u0275template(7, ToolbarComponent_ng_container_1_ng_container_7_Template, 5, 0, "ng-container", 29)(8, ToolbarComponent_ng_container_1_ng_template_8_Template, 4, 10, "ng-template", null, 0, \u0275\u0275templateRefExtractor)(10, ToolbarComponent_ng_container_1_ng_container_10_Template, 4, 11, "ng-container", 29)(11, ToolbarComponent_ng_container_1_ng_template_11_Template, 1, 1, "ng-template", null, 1, \u0275\u0275templateRefExtractor)(13, ToolbarComponent_ng_container_1_ng_container_13_Template, 5, 0, "ng-container", 29)(14, ToolbarComponent_ng_container_1_ng_template_14_Template, 4, 10, "ng-template", null, 2, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275template(16, ToolbarComponent_ng_container_1_ng_container_16_Template, 4, 3, "ng-container", 21);
    \u0275\u0275elementStart(17, "div", 30)(18, "div", 31);
    \u0275\u0275pipe(19, "translate");
    \u0275\u0275elementStart(20, "icon", 32);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_Template_icon_click_20_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.rotate(false));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "icon", 33);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_Template_icon_click_21_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.rotate(true));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(22, ToolbarComponent_ng_container_1_ng_container_22_Template, 3, 4, "ng-container", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275template(23, ToolbarComponent_ng_container_1_ng_container_23_Template, 19, 16, "ng-container", 29)(24, ToolbarComponent_ng_container_1_ng_template_24_Template, 13, 9, "ng-template", null, 3, \u0275\u0275templateRefExtractor)(26, ToolbarComponent_ng_container_1_ng_container_26_Template, 5, 7, "ng-container", 21)(27, ToolbarComponent_ng_container_1_ng_container_27_Template, 4, 7, "ng-container", 21)(28, ToolbarComponent_ng_container_1_ng_container_28_Template, 10, 5, "ng-container", 21);
    \u0275\u0275elementStart(29, "div", 34)(30, "btn", 35, 4);
    \u0275\u0275pipe(32, "translate");
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_Template_btn_click_30_listener($event) {
      \u0275\u0275restoreView(_r3);
      const SM_r28 = \u0275\u0275reference(31);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.pdfsearchBth(ctx_r1.showsearch, SM_r28, $event));
    });
    \u0275\u0275element(33, "icon", 36);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "mat-menu", 37, 5)(36, "div", 38)(37, "div", 39);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_Template_div_click_37_listener($event) {
      \u0275\u0275restoreView(_r3);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275template(38, ToolbarComponent_ng_container_1_ng_container_38_Template, 2, 13, "ng-container", 21);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275template(39, ToolbarComponent_ng_container_1_ng_container_39_Template, 24, 20, "ng-container", 21)(40, ToolbarComponent_ng_container_1_ng_container_40_Template, 26, 22, "ng-container", 21)(41, ToolbarComponent_ng_container_1_ng_container_41_Template, 4, 3, "ng-container", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(42, "div", 40);
    \u0275\u0275template(43, ToolbarComponent_ng_container_1_ng_container_43_Template, 14, 6, "ng-container", 21)(44, ToolbarComponent_ng_container_1_ng_container_44_Template, 8, 8, "ng-container", 21);
    \u0275\u0275elementStart(45, "mat-menu", 41, 6)(47, "div", 42)(48, "div");
    \u0275\u0275element(49, "icon", 43);
    \u0275\u0275elementStart(50, "span", 44);
    \u0275\u0275text(51);
    \u0275\u0275pipe(52, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275text(53);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(54, "div", 45);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_Template_div_click_54_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      ctx_r1.changeDoc("P");
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(55, "span", 46);
    \u0275\u0275element(56, "icon", 47);
    \u0275\u0275text(57);
    \u0275\u0275pipe(58, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275element(59, "div", 48);
    \u0275\u0275elementStart(60, "span", 49);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_Template_span_click_60_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      ctx_r1.changeDoc("N");
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275text(61);
    \u0275\u0275pipe(62, "translate");
    \u0275\u0275element(63, "icon", 50);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(64, "div", 51, 7);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_Template_div_click_64_listener($event) {
      \u0275\u0275restoreView(_r3);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(66, "div", 52)(67, "div", 53);
    \u0275\u0275text(68);
    \u0275\u0275pipe(69, "translate");
    \u0275\u0275pipe(70, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(71, "span", 54);
    \u0275\u0275element(72, "icon", 55);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(73, "mat-menu", 56, 8)(75, "div", 57);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_Template_div_click_75_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      ctx_r1.onNewTabChange(false);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(76, "span");
    \u0275\u0275text(77);
    \u0275\u0275pipe(78, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(79, ToolbarComponent_ng_container_1_ng_container_79_Template, 2, 0, "ng-container", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(80, "div", 58);
    \u0275\u0275listener("click", function ToolbarComponent_ng_container_1_Template_div_click_80_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      ctx_r1.onNewTabChange(true);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(81, "span");
    \u0275\u0275text(82);
    \u0275\u0275pipe(83, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(84, ToolbarComponent_ng_container_1_ng_container_84_Template, 2, 0, "ng-container", 21);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275template(85, ToolbarComponent_ng_container_1_ng_container_85_Template, 37, 48, "ng-container", 21);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(86, ToolbarComponent_ng_container_1_ng_container_86_Template, 2, 6, "ng-container", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const defaultNav_r50 = \u0275\u0275reference(9);
    const simplePageInput_r51 = \u0275\u0275reference(12);
    const defaultNext_r52 = \u0275\u0275reference(15);
    const otherMode_r53 = \u0275\u0275reference(25);
    const SM_r28 = \u0275\u0275reference(31);
    const searchMenu_r54 = \u0275\u0275reference(35);
    const TabMenu_r55 = \u0275\u0275reference(74);
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("visibility", "hover")("appearance", "compact");
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction4(72, _c6, ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime, !(ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime), !(ctx_r1.docInfo == null ? null : ctx_r1.docInfo.nPresentid), ctx_r1.source == "RT"));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(77, _c7, !ctx_r1.fullMode && !(ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime), (ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime) && !ctx_r1.fullMode));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.compareMode);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(80, _c8, ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.compareMode)("ngIfElse", defaultNav_r50);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.pagginationRenge == null ? null : ctx_r1.pagginationRenge.length)("ngIfElse", simplePageInput_r51);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.compareMode)("ngIfElse", defaultNext_r52);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.isLink && !ctx_r1.fullMode ? !(ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime) ? "hover:text-blue-on min-w-8.5 justify-center hover:bg-blue-deactivate" : "hover:text-blue-on min-w-8.5 justify-center bg-white" : !ctx_r1.fullMode ? "bg-white gap-2.5" : "bg-reply gap-2.5");
    \u0275\u0275advance();
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(19, 54, "PDF.TOOLBAR.ROTATE_DOCUMENT"));
    \u0275\u0275advance(2);
    \u0275\u0275classMap(!ctx_r1.fullMode ? "cursor-pointer hover:text-blue-on" : "");
    \u0275\u0275advance();
    \u0275\u0275classMap(!ctx_r1.fullMode ? "cursor-pointer hover:text-blue-on" : "");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.fullMode);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.fullMode)("ngIfElse", otherMode_r53);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", !ctx_r1.fullMode && !ctx_r1.linkExplorerMode && ctx_r1.activesectiontype == "CB");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.activesectiontype != "CB" && !ctx_r1.linkExplorerMode && !ctx_r1.isLinkView);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.fullMode && !ctx_r1.linkExplorerMode && !ctx_r1.isLinkView && !ctx_r1.isLink && ctx_r1.source != "RT");
    \u0275\u0275advance(2);
    \u0275\u0275property("mode", ctx_r1.fullMode && !(ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime) ? "outlined" : "white")("square", true)("matMenuTriggerFor", searchMenu_r54)("matTooltip", \u0275\u0275pipeBind1(32, 56, "PDF.TOOLBAR.WORD_SEARCH"))("active", ctx_r1.showsearch || SM_r28.menuOpen)("addcls", (ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime) ? "!bg-white" : ctx_r1.fullMode ? "" : "shadow-none");
    \u0275\u0275advance(6);
    \u0275\u0275classMap(ctx_r1.fullMode ? "!min-w-fit !max-w-[527px]" : "");
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction3(82, _c9, ctx_r1.linkExplorerMode, ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime, !ctx_r1.fullMode));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", SM_r28.menuOpen);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.fullMode && !ctx_r1.linkExplorerMode && !ctx_r1.isLinkView && ctx_r1.source != "RT");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isPresenter) && ctx_r1.fullMode && !ctx_r1.linkExplorerMode && !ctx_r1.isLinkView && ctx_r1.source != "RT");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.docInfo == null ? null : ctx_r1.docInfo.isRealtime);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(86, _c10, ctx_r1.source == "RT"));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.fullMode && !ctx_r1.linkExplorerMode && !ctx_r1.isLinkView && !ctx_r1.isLink && ctx_r1.source != "RT");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.fullMode && !ctx_r1.linkExplorerMode && !ctx_r1.isLinkView && !ctx_r1.isLink && ctx_r1.source != "RT");
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(52, 58, "PDF.TOOLBAR.DOCUMENT"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" [ ", (ctx_r1.docInfo == null ? null : ctx_r1.docInfo.cTab) || "-", " ] ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(58, 60, "PDF.TOOLBAR.PREVIOUS"), " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(62, 62, "PDF.TOOLBAR.NEXT"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("matMenuTriggerFor", TabMenu_r55);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r1.newTab ? \u0275\u0275pipeBind1(69, 64, "PDF.TOOLBAR.NEW_TAB") : \u0275\u0275pipeBind1(70, 66, "PDF.TOOLBAR.REPLACE_TAB"), " ");
    \u0275\u0275advance(9);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(78, 68, "PDF.TOOLBAR.REPLACE_TAB"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.newTab);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(83, 70, "PDF.TOOLBAR.NEW_TAB"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.newTab);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.fullMode);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isAnnotTool);
  }
}
var ToolbarComponent = class _ToolbarComponent extends BasePdfToolComponent {
  clickFocusedItem(event) {
    event.preventDefault();
    let element = event.target;
    if (element) {
      const focusedElement = element;
      if (focusedElement) {
        focusedElement.click();
      }
    }
  }
  onArrowDown(event) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      this.cdr.detectChanges();
    }
  }
  /** Mutual-exclusion helper for the Alt+C / Alt+H / Alt+T shortcuts.
   *  Deactivates every tool except the one being activated, so only one
   *  is ever on at a time when switching via keyboard. */
  deactivateOtherTools(activating) {
    if (activating !== "h" && this.handTool) {
      this.handTool = false;
      this.toolEvents.emit({ event: PdfEvents.HAND, data: false });
    }
    if (activating !== "c" && this.isCalloutActive) {
      this.toolEvents.emit({ event: PdfEvents.CALLOUT_MODE, data: { enabled: false } });
    }
    if (activating !== "t" && this.isPresenterHighlightActive) {
      this.togglePresenterHighlight();
    }
  }
  constructor(store, cdr, pdfDataService, dialog, hyperLinkService, advanceSearchService, indDocService, cs, translate, selectionActions) {
    super(cdr);
    this.store = store;
    this.cdr = cdr;
    this.pdfDataService = pdfDataService;
    this.dialog = dialog;
    this.hyperLinkService = hyperLinkService;
    this.advanceSearchService = advanceSearchService;
    this.indDocService = indDocService;
    this.cs = cs;
    this.translate = translate;
    this.selectionActions = selectionActions;
    this.isFullScreenChange = new EventEmitter();
    this.showhidetoolbar = true;
    this.onToolShortcut = (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
        return;
      if (e.isComposing || e.keyCode === 229)
        return;
      if (e.repeat)
        return;
      const t = e.target;
      if (t) {
        const tag = t.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable)
          return;
      }
      if (this.dialog.openDialogs.length > 0)
        return;
      const key = e.key.toLowerCase();
      if (key !== "c" && key !== "h" && key !== "t")
        return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (key === "c") {
        if (this.isCalloutActive) {
          this.toolEvents.emit({ event: PdfEvents.CALLOUT_MODE, data: { enabled: false } });
        } else {
          this.deactivateOtherTools("c");
          this.toolEvents.emit({ event: PdfEvents.CALLOUT_MODE, data: { enabled: true } });
        }
      } else if (key === "h") {
        if (this.handTool) {
          this.handTool = false;
          this.toolEvents.emit({ event: PdfEvents.HAND, data: false });
        } else {
          this.deactivateOtherTools("h");
          this.handTool = true;
          this.toolEvents.emit({ event: PdfEvents.HAND, data: true });
        }
      } else if (key === "t") {
        const presenterVisible = this.docInfo?.isPresenter && this.fullMode && !this.linkExplorerMode && this.source !== "RT";
        if (!presenterVisible)
          return;
        if (this.isPresenterHighlightActive) {
          this.togglePresenterHighlight();
        } else {
          this.deactivateOtherTools("t");
          this.presenterHighlightMode = "text";
          this.togglePresenterHighlight();
        }
      }
    };
    this.isHavehighlights = false;
    this.isCalloutActive = false;
    this.isnavigate = false;
    this.isProperties = false;
    this.isIssue = false;
    this.totalSearch = 0;
    this.isConverttopagelevel = false;
    this.cSearch = "";
    this.cSearchChange = new EventEmitter();
    this.matchCase = false;
    this.wholeWords = false;
    this.currentSearch = 0;
    this.isSearching = false;
    this.fullMode = false;
    this.currentPage = 0;
    this.isAnnotToolChange = new EventEmitter();
    this.pagesCount = 0;
    this.linkExplorerMode = null;
    this.pagginationRenge = [];
    this.rangeList = [];
    this.pageSelected = null;
    this.toolEvents = new EventEmitter();
    this.onEvent = new EventEmitter();
    this.zoomlevels = [
      { value: "50%", key: "50%" },
      { value: "100%", key: "100%" },
      { value: "125%", key: "125%" },
      { value: "150%", key: "150%" },
      { value: "200%", key: "200%" },
      { value: "300%", key: "300%" },
      { value: "400%", key: "400%" },
      { value: "page-actual", key: "PDF.TOOLBAR.ACTUAL_SIZE" },
      { value: "page-width", key: "PDF.TOOLBAR.FIT_WIDTH" },
      { value: "page-fit", key: "PDF.TOOLBAR.FIT_HEIGHT" }
    ];
    this.zoomInputValue = "";
    this.showZoomSuggestions = false;
    this.filteredZoomLevels = [];
    this.selectedZoomIndex = -1;
    this.isZoomMenuOpen = false;
    this.zoom_ratio = 0;
    this.dialogRef = 0;
    this.searchBox = false;
    this.newTab = this.store.getStorage("newTab") && this.store.getStorage("newTab") == "true" && true;
    this.showzoom = false;
    this.isCheckedRotation = false;
    this.showsearch = false;
    this.annoticontype = "F";
    this.compareMode = false;
    this.searchValue = null;
    this.isDisabledNavigate = false;
    this.showshare = false;
    this.isElasticSearched = false;
    this.elasticPages = [];
    this.totalElasticMaches = 0;
    this.isLinkView = false;
    this.isAdjustDoc = false;
    this.isAdjustDocChange = new EventEmitter();
    this.from_rng = [];
    this.to_rng = [];
    this.thumbnailMode = false;
    this.isCopytabref = false;
    this.isCopydocname = false;
    this.isCopytoclipboard = false;
    this.isCanvasActive = false;
    this.isPresenterHighlightActive = false;
    this.presenterHighlightMode = "text";
    let firstRun = true;
    effect(() => {
      const state = this.selectionActions.state();
      const isCopy = this.selectionActions.isCopy();
      if (firstRun) {
        firstRun = false;
        return;
      }
      this.isCopytoclipboard = isCopy;
      this.isCopydocname = state.copyDocName;
      this.isCopytabref = state.copyPagination;
      this.toolEvents.emit({
        event: PdfEvents.COPY_TO_CLIP,
        data: { copy: isCopy, showName: state.copyDocName, showTab: state.copyPagination }
      });
      this.cdr.detectChanges();
    });
  }
  checkForMax(e) {
    if (e.target.value > this.pagesCount) {
      this.currentPage = this.pagesCount;
    } else if (e < 1) {
      this.currentPage = 1;
    }
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    document.removeEventListener("keydown", this.onToolShortcut, { capture: true });
    super.ngOnDestroy();
  }
  ngOnChanges(changes) {
    if (changes["pagginationRenge"]) {
      this.rangeList = [...this.pagginationRenge];
      this.initdetail();
    }
    if (changes["currentPage"]) {
      this.updateSelectPage(changes["currentPage"].currentValue);
    } else if (changes["isAnnotTool"]) {
    } else if (changes["pdfLoaded"]) {
      this.pdfLoaded = changes["pdfLoaded"].currentValue;
      if (this.pdfLoaded) {
      }
      this.cdr.detectChanges();
    } else if (changes["zoom"]) {
      this.zoomValue = this.zoom;
      this.updateZoomInputValue();
      setTimeout(() => {
        this.updateContentEditableText(this.zoomInputValue);
      }, 0);
      this.cdr.detectChanges();
    }
    if (changes["cSearch"]) {
      if (this.compareMode) {
      }
    }
    if (changes["isFullScreen"]) {
      this.cdr.detectChanges();
    }
  }
  updateSelectPage(val) {
    const ind = this.rangeList.findIndex((a) => a.page == val);
    if (ind > -1) {
      this.pageSelected = this.rangeList[ind];
      this.cdr.detectChanges();
    }
  }
  ngOnInit() {
    document.addEventListener("keydown", this.onToolShortcut, { capture: true });
    try {
      if (this.docInfo?.nPresentid && this.docInfo?.isHost) {
        this.annoticontype = "";
      }
    } catch (error) {
    }
    this.zoomValue = this.zoom;
    this.updateZoomInputValue();
    this.filteredZoomLevels = [...this.zoomlevels];
    this.showAll = this.pageViewMode != "multiple";
    this.isCheckedRotation = this.pageRotation == this.docInfo?.nRotate;
    this.rangeList = [...this.pagginationRenge];
    try {
      if (this.onPdfEvent) {
        this.onPdfEvent.pipe(takeUntil(this.destroy$)).subscribe((e) => {
          this.pdfZoomIn;
          this.zoomInElement;
          this.zoomInComponent;
          this.zoomOutComponent;
        });
      }
    } catch (error) {
    }
    this.isElasticSearched = false;
    if (this.jFilter?.cSearch) {
      this.cSearch = this.jFilter?.cSearch;
      this.wholeWords = this.jFilter.cMatchCase == "E";
      this.matchCase = false;
      this.showsearch = true;
      this.isElasticSearched = true;
      this.fetchElasticDetail();
      this.changeSearchBox();
      this.cdr.detectChanges();
    }
    setTimeout(() => {
      this.updateContentEditableText(this.zoomInputValue);
    }, 0);
    this.cdr.detectChanges();
  }
  rotate(val) {
    if (val) {
      this.pageRotation = (this.pageRotation + 90) % 360;
    } else {
      this.pageRotation = (this.pageRotation - 90 + 360) % 360;
    }
    this.isCheckedRotation = this.pageRotation == this.docInfo?.nRotate;
    this.cdr.detectChanges();
    this.toolEvents.emit({ event: PdfEvents.ROTATION, data: this.pageRotation });
  }
  OnPage() {
    this.toolEvents.emit({ event: PdfEvents.PAGE, data: this.currentPage });
  }
  hand() {
    this.handTool = !this.handTool;
    this.toolEvents.emit({ event: PdfEvents.HAND, data: this.handTool });
  }
  zoomChange(e) {
    this.zoom = e.value;
    this.toolEvents.emit({ event: PdfEvents.ZOOM, data: this.zoom });
  }
  sliderzoom(ev) {
    this.toolEvents.emit({ event: PdfEvents.ZOOM, data: ev });
  }
  resetzoom() {
    this.toolEvents.emit({ event: PdfEvents.ZOOM, data: "page-width" });
  }
  onCalloutSnap() {
    this.toolEvents.emit({ event: PdfEvents.CALLOUT_MODE, data: { enabled: true } });
  }
  getZoomValue() {
    const zoom = this.zoom;
    try {
      const val = this.zoomlevels.find((a) => a.value == zoom);
      return val?.key || Math.round(parseInt(zoom)) + "%";
    } catch (error) {
      return zoom;
    }
  }
  onSeach(e, SM) {
    if (e.event == "close") {
      SM.closeMenu();
    }
    this.toolEvents.emit(e);
    this.cdr.detectChanges();
  }
  OnShowAllChange() {
    this.zoom = "page-actual";
    this.toolEvents.emit({ event: PdfEvents.ZOOM, data: this.zoom });
    this.toolEvents.emit({ event: PdfEvents.SHOWALL, data: this.showAll ? "single" : "multiple" });
  }
  changeDoc(flag) {
    return __async(this, null, function* () {
      this.toolEvents.emit({ event: PdfEvents.CHANGE_DOC, data: { newTab: this.newTab, cFlag: flag } });
    });
  }
  onNewTabChange(value) {
    this.newTab = value;
    this.store.setStorage("newTab", this.newTab);
  }
  OnAnnotToolClose(e) {
    this.changeIsAnotTool(false);
  }
  changeIsAnotTool(val) {
    this.isAnnotTool = val;
    this.isAnnotToolChange.emit(this.isAnnotTool);
    this.cdr.detectChanges();
    if (this.isCanvasActive) {
      this.isCanvasActive = false;
      this.toolEvents.emit({ event: PdfEvents.H_MODE, data: this.annoticontype });
    }
  }
  modeChange(e) {
    this.toolEvents.emit({ event: PdfEvents.H_MODE, data: e });
    this.annoticontype = e;
    this.cdr.detectChanges();
  }
  OnLinkEvents(e) {
    if (e.event == PdfEvents.LINK_EVENT) {
      this.isCanvasActive = false;
      this.toolEvents.emit(e);
    }
    if (e.event == PdfEvents.LINK_EVENT_SCROLL) {
      this.currentPage = e.data.start ? e.data.start : 1;
      this.OnPage();
    }
    if (e.event == PdfEvents.ADVANCE) {
      this.toolEvents.emit(e);
    }
    if (this.isCanvasActive) {
      this.isCanvasActive = false;
      this.toolEvents.emit({ event: PdfEvents.H_MODE, data: this.annoticontype });
    }
  }
  onRotationUpdate(e) {
    this.docInfo.nRotate = this.pageRotation;
    this.pdfDataService.updateRotation({ nBundledetailid: this.docInfo.nBundledetailid, nRotate: this.pageRotation });
  }
  closeRealtimePdf() {
    this.toolEvents.emit({ event: PdfEvents.CLOSE_REALTIME, data: null });
  }
  formatLabel(value) {
    return `${value}%`;
  }
  locationshare() {
    return __async(this, null, function* () {
      this.toolEvents.emit({ event: PdfEvents.DOC_SHARE, data: "" });
    });
  }
  issueManager() {
    return __async(this, null, function* () {
      this.toolEvents.emit({ event: PdfEvents.ISSUE_MANAGER, data: "" });
    });
  }
  export() {
    return __async(this, null, function* () {
      this.toolEvents.emit({ event: PdfEvents.EXPORT, data: "" });
    });
  }
  navigate() {
    return __async(this, null, function* () {
      if (this.dialogRef) {
        return;
      }
      this.isnavigate = !this.isnavigate;
      this.toolEvents.emit({ event: PdfEvents.OPEN_NAVIGATE, data: "" });
      this.onEvent.emit({ event: PdfEvents.CLOSE, data: "" });
    });
  }
  changeCompareMode() {
    this.toolEvents.emit({ event: PdfEvents.COMPARE_MODE, data: !this.compareMode });
    this.cdr.detectChanges();
  }
  changeThumbnailMode() {
    this.thumbnailMode = !this.thumbnailMode;
    this.toolEvents.emit({ event: PdfEvents.THUMBNAIL_MODE, data: this.thumbnailMode });
    this.cdr.detectChanges();
  }
  linkExplorer() {
    this.toolEvents.emit({ event: PdfEvents.LINK_EXPLORER, data: "" });
  }
  OnPageSelected() {
    this.toolEvents.emit({ event: PdfEvents.PDF_PAGE_CHANGE, data: { page: this.currentPage } });
    this.cdr.detectChanges();
  }
  OnPageSerch() {
    this.cdr.detectChanges();
  }
  restrictToNumbers(event) {
    const allowedControlKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End"
    ];
    const isCtrlCmdCombo = event.ctrlKey || event.metaKey;
    if (isCtrlCmdCombo) {
      return;
    }
    if (allowedControlKeys.includes(event.key)) {
      return;
    }
    const isNumber = /[0-9]/.test(event.key);
    if (!isNumber) {
      event.preventDefault();
    }
  }
  onPageChange() {
    this.toolEvents.emit({ event: PdfEvents.PDF_PAGE_CHANGE, data: this.pageSelected });
  }
  issuelist() {
    this.toolEvents.emit({ event: PdfEvents.OPEN_ISSUEMODEL, data: {} });
  }
  properties(flag) {
    if (flag == "V") {
      this.toolEvents.emit({ event: PdfEvents.VIEW_PROPERTIES, data: {} });
    } else {
      this.toolEvents.emit({ event: PdfEvents.ASSIGN_PROPERTIES, data: {} });
    }
  }
  OnRangeSelect(x) {
    this.pageSelected = x;
    this.onPageChange();
    this.clearSearchInPagination();
    this.cdr.detectChanges();
  }
  seachPages(e) {
    const value = e.target.value;
    this.rangeList = [...this.pagginationRenge.filter((a) => a.output.toUpperCase().includes(value.toUpperCase())).sort()];
    this.cdr.detectChanges();
  }
  OnPageEnter(e) {
    const value = e.target.value;
    const ind = this.pagginationRenge.findIndex((a) => a.output.toUpperCase() == value.toUpperCase());
    if (ind > -1) {
      this.clearSearchInPagination();
      this.OnRangeSelect(this.pagginationRenge[ind]);
    }
  }
  clearSearchInPagination() {
    this.searchValue = null;
    this.rangeList = [...this.pagginationRenge];
  }
  openment(pginput) {
    setTimeout(() => {
      pginput.focus();
    }, 100);
  }
  onKeyDown(event) {
    if (event.key === "ArrowDown") {
      console.log("Down arrow key pressed");
      setTimeout(() => {
        if (this.listItems && this.listItems.first) {
          const firstElement = this.listItems.first["_elementRef"].nativeElement;
          if (firstElement) {
            firstElement.focus();
          } else {
            console.log("Native element not found");
          }
        } else {
          console.log("No list items found");
        }
      });
    }
  }
  OnValueUpdate(e) {
    if (e.data) {
      this.cSearch = e.data.cSearch;
      this.cSearchChange.emit(this.cSearch);
      if (this.jFilter?.cSearch && !this.cSearch) {
        this.showsearch = false;
      }
      this.matchCase = e.data.options.matchCase;
      this.wholeWords = e.data.options.wholeWords;
      this.cdr.detectChanges();
    }
  }
  changeSearchBox() {
    this.searchBox = !this.searchBox;
    if (!this.searchBox) {
      this.toolEvents.next({ event: PdfEvents.SEARCH, data: { cSearch: this.searchBox ? this.cSearch : "", options: { matchCase: this.matchCase, wholeWords: this.wholeWords, highlightAll: true } } });
    }
  }
  OnPdfNavEvent(val) {
    this.toolEvents.emit({ event: PdfEvents.TOOLBAR_PDF_NAV_EVENTS, data: val });
  }
  OnToolBoxEvent(e) {
    this.toolEvents.emit(e);
  }
  getShare(nBundleid) {
    const dialogRef = this.dialog.open(SharewithteamComponent, {
      width: "400px",
      height: "fit-content",
      maxHeight: "80vh",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: {
        nBundleid,
        nBundledetailid: null,
        nCaseid: this.nCaseid,
        nSectionid: 8981
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }
  share() {
    this.showshare = !this.showshare;
    this.toolEvents.emit({ event: PdfEvents.SHARE, data: this.showshare });
  }
  downloadWithLinkfile() {
    this.hyperLinkService.downloadFiles({ nCaseid: this.nCaseid, nSectionid: this.docInfo.nSectionid || null, jFolders: null, jFiles: JSON.stringify([this.docInfo.nBundledetailid]) });
  }
  fetchElasticDetail() {
    return __async(this, null, function* () {
      this.totalElasticMaches = 0;
      this.elasticPages = [];
      const detail = yield this.advanceSearchService.searchDetail(this.cSearch, this.nCaseid, false, false, this.wholeWords, this.docInfo?.nBundledetailid);
      if (detail.msg == 1) {
        this.elasticPages = detail.pages || [];
        this.totalElasticMaches = this.elasticPages.reduce((total, page) => total + page.matches, 0);
      }
      this.cdr.detectChanges();
    });
  }
  showSearchMdl() {
    if (this.isElasticSearched) {
      this.removeElasticSearch();
      return;
    }
    this.showsearch = !this.showsearch;
    this.isAnnotTool = false;
    this.changeSearchBox();
    this.cdr.detectChanges();
  }
  removeElasticSearch() {
    this.cSearch;
    this.jFilter = null;
    this.isElasticSearched = false;
    this.elasticPages = [];
    this.cdr.detectChanges();
  }
  openInIndividual() {
    this.toolEvents.emit({ event: PdfEvents.OPEN_INDIVIDUAL, data: null });
  }
  roundTo10(n) {
    const rounded = Math.round(n / 10) * 10;
    return Math.max(10, rounded);
  }
  Copytoclipboard(flag, ev) {
    try {
      console.log(ev);
      this.isCanvasActive = false;
      this.annoticontype = "F";
      this.toolEvents.emit({ event: PdfEvents.H_MODE, data: this.annoticontype });
      if (flag) {
        if (flag == "N") {
          this.isCopydocname = ev.checked;
        }
        if (flag == "T") {
          this.isCopytabref = ev.checked;
        }
        this.isCopytoclipboard = true;
      } else {
        this.isCopytoclipboard = !this.isCopytoclipboard;
      }
      this.toolEvents.emit({ event: PdfEvents.COPY_TO_CLIP, data: { copy: this.isCopytoclipboard, showName: this.isCopydocname, showTab: this.isCopytabref } });
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    } catch (error) {
      console.error("Error in Copytoclipboard:", error);
    }
  }
  getCurrentZoomPercent() {
    const zoom = this.zoom;
    return this.zoom && this.zoom !== "page-actual" ? Math.round(zoom) : 100;
  }
  onCustomZoomInput(event) {
    let value = parseInt(event.target.value, 10);
    if (isNaN(value))
      return;
    if (value > 300)
      value = 300;
    if (value < 1)
      value = 1;
    this.zoomValue = value / 100;
  }
  onCustomZoomEnter(event) {
    let value = parseInt(event.target.value, 10);
    if (isNaN(value))
      return;
    if (value > 300)
      value = 300;
    if (value < 1)
      value = 1;
    this.zoomValue = value / 100;
    this.zoom = value.toString() + "%";
    this.toolEvents.emit({ event: "ZOOM", data: this.zoom });
  }
  // New zoom input methods
  onZoomInputChange(event) {
    if (!this.isZoomMenuOpen) {
      return;
    }
    const value = event.target.textContent || "";
    this.zoomInputValue = value;
    if (this.zoomInputElement) {
      const element = this.zoomInputElement.nativeElement;
      if (value && value.trim()) {
        element.classList.remove("empty");
      } else {
        element.classList.add("empty");
      }
    }
    if (value.trim() === "") {
      this.filteredZoomLevels = [...this.zoomlevels];
    } else {
      const numericValue = parseInt(value, 10);
      if (!isNaN(numericValue)) {
        this.filteredZoomLevels = this.zoomlevels.filter((level) => {
          const levelValue = parseInt(level.key.replace("%", ""), 10);
          return !isNaN(levelValue) && levelValue.toString().includes(value);
        });
      } else {
        this.filteredZoomLevels = this.zoomlevels.filter((level) => level.key.toLowerCase().includes(value.toLowerCase()));
      }
    }
    this.selectedZoomIndex = -1;
  }
  onZoomKeyDown(event) {
    if (!this.isZoomMenuOpen) {
      event.preventDefault();
      return;
    }
    if (event.key === "Enter") {
      this.applyCustomZoom();
      event.preventDefault();
      return;
    }
    const allowedKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"];
    const isNumeric = event.key >= "0" && event.key <= "9";
    if (!isNumeric && !allowedKeys.includes(event.key)) {
      event.preventDefault();
      return;
    }
    if (isNumeric) {
      const currentValue = this.zoomInputValue.replace(/\D/g, "");
      if (currentValue.length >= 3) {
        event.preventDefault();
        return;
      }
    }
    if (this.filteredZoomLevels.length > 0) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          this.selectedZoomIndex = Math.min(this.selectedZoomIndex + 1, this.filteredZoomLevels.length - 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          this.selectedZoomIndex = Math.max(this.selectedZoomIndex - 1, -1);
          break;
        case "Escape":
          this.selectedZoomIndex = -1;
          break;
      }
    }
  }
  onZoomBlur() {
    if (!this.zoomInputValue || !this.zoomInputValue.trim()) {
      this.updateZoomInputValue();
      setTimeout(() => {
        this.showZoomSuggestions = false;
        this.selectedZoomIndex = -1;
      }, 150);
      return;
    }
    if (this.zoomInputValue.trim()) {
      this.applyCustomZoom();
    }
    setTimeout(() => {
      this.showZoomSuggestions = false;
      this.selectedZoomIndex = -1;
    }, 150);
  }
  onZoomButtonClick(event) {
    event.stopPropagation();
  }
  onZoomInputClick(event) {
    if (!this.isZoomMenuOpen) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    this.zoomInputElement?.nativeElement.focus();
    this.setCursorToEnd();
  }
  onZoomMenuOpened() {
    this.filteredZoomLevels = [...this.zoomlevels];
    this.selectedZoomIndex = -1;
    this.isZoomMenuOpen = true;
    setTimeout(() => {
      const el = this.zoomInputElement?.nativeElement;
      if (!el)
        return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 0);
  }
  onZoomMenuClosed() {
    this.isZoomMenuOpen = false;
  }
  selectZoomLevel(level) {
    if (level.value.includes("page-")) {
      this.zoomInputValue = level.key;
    } else {
      const numericValue = parseInt(level.key.replace("%", ""), 10);
      this.zoomInputValue = !isNaN(numericValue) ? numericValue.toString() : level.key;
    }
    this.zoom = level.value;
    this.selectedZoomIndex = -1;
    this.updateContentEditableText(this.zoomInputValue);
    this.toolEvents.emit({ event: "ZOOM", data: this.zoom });
  }
  applyCustomZoom() {
    const value = this.zoomInputValue.trim();
    if (!value)
      return;
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes("actual") || lowerValue.includes("actual size")) {
      this.zoom = "page-actual";
      this.zoomInputValue = "Actual Size";
      this.updateContentEditableText(this.zoomInputValue);
      this.toolEvents.emit({ event: "ZOOM", data: this.zoom });
      return;
    } else if (lowerValue.includes("width") || lowerValue.includes("fit width")) {
      this.zoom = "page-width";
      this.zoomInputValue = "Fit Width";
      this.updateContentEditableText(this.zoomInputValue);
      this.toolEvents.emit({ event: "ZOOM", data: this.zoom });
      return;
    } else if (lowerValue.includes("fit") || lowerValue.includes("fit height")) {
      this.zoom = "page-fit";
      this.zoomInputValue = "Fit Height";
      this.updateContentEditableText(this.zoomInputValue);
      this.toolEvents.emit({ event: "ZOOM", data: this.zoom });
      return;
    }
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 600) {
      this.zoom = numericValue + "%";
      this.zoomInputValue = numericValue.toString();
      this.updateContentEditableText(this.zoomInputValue);
      this.toolEvents.emit({ event: "ZOOM", data: this.zoom });
      return;
    }
  }
  setCursorToEnd() {
    if (this.zoomInputElement) {
      const element = this.zoomInputElement.nativeElement;
      const range = document.createRange();
      const selection = window.getSelection();
      selection?.removeAllRanges();
      range.selectNodeContents(element);
      range.collapse(false);
      selection?.addRange(range);
      element.focus();
    }
  }
  updateZoomInputValue() {
    if (this.zoom) {
      const zoomLevel = this.zoomlevels.find((level) => level.value === this.zoom);
      if (zoomLevel) {
        if (zoomLevel.value.includes("page-")) {
          this.zoomInputValue = zoomLevel.key;
        } else {
          const numericValue = parseInt(zoomLevel.key.replace("%", ""), 10);
          this.zoomInputValue = !isNaN(numericValue) ? numericValue.toString() : "100";
        }
      } else {
        const numericValue = parseInt(this.getZoomValue().replace("%", ""), 10);
        this.zoomInputValue = !isNaN(numericValue) ? numericValue.toString() : "100";
      }
    } else {
      this.zoomInputValue = "100";
    }
    if (this.zoomInputElement) {
      this.updateContentEditableText(this.zoomInputValue);
    }
  }
  updateContentEditableText(text) {
    if (this.zoomInputElement) {
      const element = this.zoomInputElement.nativeElement;
      element.innerHTML = "";
      const translatedText = text && text.startsWith("PDF.TOOLBAR.") ? this.translate.instant(text) : text;
      element.textContent = translatedText;
      element.style.direction = "ltr";
      element.setAttribute("dir", "ltr");
      if (text && text.trim()) {
        element.classList.remove("empty");
      } else {
        element.classList.add("empty");
      }
      this.setCursorToEnd();
    }
  }
  shouldShowPercentage() {
    if (!this.zoomInputValue)
      return false;
    const specialValues = ["Actual Size", "Fit Width", "Fit Height"];
    if (specialValues.includes(this.zoomInputValue)) {
      return false;
    }
    const numericValue = parseInt(this.zoomInputValue, 10);
    if (!isNaN(numericValue)) {
      return true;
    }
    return false;
  }
  toggleAdjustDoc(flag) {
    this.isAdjustDoc = flag;
    this.isAdjustDocChange.emit(this.isAdjustDoc);
  }
  OnShowFullScreen() {
    this.isFullScreen = !this.isFullScreen;
    this.isFullScreenChange.emit(this.isFullScreen);
  }
  OnShowProperties() {
    this.isProperties = !this.isProperties;
    this.toolEvents.emit({ event: "VIEW_PROPERTIES", data: {} });
  }
  initdetail() {
    this.from_rng = [];
    this.to_rng = [];
    try {
      var y = this.docInfo;
      var pgcnt = 0;
      if (y.cPage && y.cPage != "" && y.cPage.includes("-")) {
        pgcnt = parseInt(y.cPage.split("-")[1]) + 1;
      }
      for (var ar = 1; pgcnt > ar; ar++) {
        this.from_rng.push({ page: ar, output: ar.toString() });
      }
    } catch (error) {
    }
  }
  togglePresenterHighlight() {
    this.isPresenterHighlightActive = !this.isPresenterHighlightActive;
    if (this.isPresenterHighlightActive) {
      this.isCanvasActive = false;
      this.presenterHighlightChange(this.presenterHighlightMode);
    } else {
      this.toolEvents.emit({ event: PdfEvents.H_MODE, data: "" });
    }
    this.toolEvents.emit({ event: PdfEvents.COPY_TO_CLIP, data: { copy: false, showName: false, showTab: false } });
    this.isCopytoclipboard = false;
    this.cdr.detectChanges();
  }
  presenterHighlightChange(mode) {
    this.presenterHighlightMode = mode;
    this.isPresenterHighlightActive = true;
    this.isCanvasActive = false;
    if (mode === "text") {
      this.toolEvents.emit({ event: PdfEvents.H_MODE, data: "PH" });
    } else {
      this.toolEvents.emit({ event: PdfEvents.H_MODE, data: "PH_DR" });
    }
    this.toolEvents.emit({ event: PdfEvents.COPY_TO_CLIP, data: { copy: false, showName: false, showTab: false } });
    this.isCopytoclipboard = false;
    this.cdr.detectChanges();
  }
  ToolgeCanvas() {
    if (!this.isCanvasActive) {
      this.isCanvasActive = true;
      this.annoticontype = "DR";
      this.toolEvents.emit({ event: PdfEvents.H_MODE, data: this.annoticontype });
    } else {
      this.isCanvasActive = false;
      this.annoticontype = "F";
      this.toolEvents.emit({ event: PdfEvents.H_MODE, data: this.annoticontype });
    }
    this.toolEvents.emit({ event: PdfEvents.COPY_TO_CLIP, data: { copy: false, showName: false, showTab: false } });
    this.isCopytoclipboard = false;
    this.cdr.detectChanges();
  }
  canvasChange(e) {
    this.isCanvasActive = true;
    this.annoticontype = e;
    this.toolEvents.emit({ event: PdfEvents.H_MODE, data: e });
    this.toolEvents.emit({ event: PdfEvents.COPY_TO_CLIP, data: { copy: false, showName: false, showTab: false } });
    this.isCopytoclipboard = false;
    this.cdr.detectChanges();
  }
  pdfsearchBth(showsearch, SM, event) {
    if (this.cSearch && this.cSearch.trim() !== "") {
      event.preventDefault();
      event.stopPropagation();
      this.cSearch = "";
      this.cSearchChange.emit(this.cSearch);
      this.cs.callFunction("CLEAR-PDF-SEARCH");
      this.toolEvents.emit({ event: PdfEvents.CLEAR_PDF_SEARCH, data: {} });
      if (!SM.menuOpen) {
        SM.openMenu();
      }
      return;
    }
  }
  static {
    this.\u0275fac = function ToolbarComponent_Factory(t) {
      return new (t || _ToolbarComponent)(\u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(PdfDataService), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(HyperlinkService), \u0275\u0275directiveInject(AdvanceSearchService), \u0275\u0275directiveInject(IndividualService), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(TranslateService), \u0275\u0275directiveInject(SelectionActionsService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ToolbarComponent, selectors: [["pdftool"]], viewQuery: function ToolbarComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c03, 5);
        \u0275\u0275viewQuery(_c13, 5);
        \u0275\u0275viewQuery(_c03, 5);
        \u0275\u0275viewQuery(_c13, 5);
        \u0275\u0275viewQuery(PdfZoomInComponent, 5);
        \u0275\u0275viewQuery(_c2, 5);
        \u0275\u0275viewQuery(MatMenuTrigger, 5);
        \u0275\u0275viewQuery(_c3, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.zoomInElement = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.zoomOutElement = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.zoomInComponent = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.zoomOutComponent = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.pdfZoomIn = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.zoomInputElement = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.menuTrigger = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.listItems = _t);
      }
    }, hostBindings: function ToolbarComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("keydown", function ToolbarComponent_keydown_HostBindingHandler($event) {
          return ctx.onArrowDown($event);
        }, false, \u0275\u0275resolveWindow);
      }
    }, inputs: { showAll: "showAll", onPdfEvent: "onPdfEvent", isFullScreen: "isFullScreen", source: "source", isHavehighlights: "isHavehighlights", pageRotation: "pageRotation", handTool: "handTool", isCalloutActive: "isCalloutActive", isnavigate: "isnavigate", isProperties: "isProperties", isIssue: "isIssue", zoom: "zoom", pdfLoaded: "pdfLoaded", totalSearch: "totalSearch", pageViewMode: "pageViewMode", activesectiontype: "activesectiontype", selectedIssues: "selectedIssues", isConverttopagelevel: "isConverttopagelevel", cSearch: "cSearch", matchCase: "matchCase", wholeWords: "wholeWords", currentSearch: "currentSearch", isSearching: "isSearching", fullMode: "fullMode", currentPage: "currentPage", isAnnotTool: "isAnnotTool", pagesCount: "pagesCount", annotToolMode: "annotToolMode", highlightMode: "highlightMode", isLink: "isLink", linkExplorerMode: "linkExplorerMode", pagginationRenge: "pagginationRenge", showsearch: "showsearch", compareMode: "compareMode", isDisabledNavigate: "isDisabledNavigate", jFilter: "jFilter", isLinkView: "isLinkView", isAdjustDoc: "isAdjustDoc", thumbnailMode: "thumbnailMode" }, outputs: { isFullScreenChange: "isFullScreenChange", cSearchChange: "cSearchChange", isAnnotToolChange: "isAnnotToolChange", toolEvents: "toolEvents", onEvent: "onEvent", isAdjustDocChange: "isAdjustDocChange" }, standalone: true, features: [\u0275\u0275ProvidersFeature([]), \u0275\u0275InheritDefinitionFeature, \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 2, consts: [["defaultNav", ""], ["simplePageInput", ""], ["defaultNext", ""], ["otherMode", ""], ["SM", "matMenuTrigger"], ["searchMenu", "matMenu"], ["Adjacent", "matMenu"], ["pm", "matMenuTrigger"], ["TabMenu", "matMenu"], ["defaultZoom", ""], ["z", "matMenuTrigger"], ["zoomInput", ""], ["zoomMenu", "matMenu"], ["menu", "matMenu"], ["cm", "matMenuTrigger"], ["canvasMenu", "matMenu"], ["hm", "matMenuTrigger"], ["highlightMenu", "matMenu"], ["mm", "matMenuTrigger"], ["mark", "matMenu"], ["tools", "matMenuTrigger"], [4, "ngIf"], [1, "flex", "justify-center", "w-full", "py-1", "text-white", "cursor-pointer", "bg-grey", "rounded-b-md", 3, "click", "ngClass"], ["name", "chvx", 1, "text-xxs", 3, "ngClass"], [1, "relative", "overflow-visible"], [1, "relative", "z-20", 3, "visibility", "appearance"], [1, "relative", "z-20", "flex", "items-center", "bg-white", "pdf-toolbars", 3, "ngClass"], [1, "flex", "items-center", "pdf-toolbars", "gap-x-2", "me-2", 3, "ngClass"], [1, "flex", "items-center", "bg-reply", "px-2", "h-8.5", "rounded-base", "w-full", "justify-between", 3, "ngClass"], [4, "ngIf", "ngIfElse"], [1, "flex", "p-2", "items-center", "rounded-base"], [1, "flex", "items-center", "gap-1", 3, "matTooltip"], ["name", "rotate", "type", "toolicn", 3, "click"], ["name", "rotate", "type", "toolicn", 1, "-scale-x-100", 3, "click"], [1, "relative"], ["mat-icon-button", "", 3, "click", "mode", "square", "matMenuTriggerFor", "matTooltip", "active", "addcls"], ["name", "search"], ["hasBackdrop", "false", 1, "p-0", "!min-w-fit", "w-fit", "!max-w-fit", "mt-2.5", "!rounded-none", "!shadow-[0px_0px_7px_#0000004d]"], [1, "bg-blue-deactivate", 3, "ngClass"], [1, "w-full", 3, "click"], [1, "flex", "items-center", "pdf-toolbars", "gap-x-2", 3, "ngClass"], [1, "!min-w-fit", "p-0", "mt-3"], [1, "flex", "p-2", "gap-2.5", "items-center", "text-xs", "rounded-base"], ["name", "nextfile", "type", "toolicn", 1, "text-lg", "pointer-events-none"], [1, "font-semibold"], [1, "flex", "items-center", "text-xs", 3, "click"], [1, "flex", "items-center"], ["name", "chvy", 1, "text-sm", "mx-3"], [1, "h-3", "w-px", "bg-grey", "mx-5"], [1, "flex", "items-center", 3, "click"], ["name", "chvy", 1, "block", "text-sm", "rotate-180", "mx-3"], [1, "flex", "group", "items-end", "relative", "justify-center", 3, "click", "matMenuTriggerFor"], ["mode", "outlined", 1, "z-20", "hover:bg-white", "h-6", "flex", "items-center", "min-w-[120px]", "justify-center", "border", "border-tab", "rounded-base", "cursor-pointer"], [1, "px-2.5", "max-h-full", "items-center", "w-full", "h-auto", "flex", "self-stretch", "hover:!text-blue-on"], [1, "pe-2.5", "ps-1", "max-h-full", "items-center", "h-auto", "flex", "self-stretch", "hover:!text-blue-on"], ["name", "chvx", 1, "text-xxs"], ["xPosition", "before", 1, "p-2", "mt-2"], [1, "px-3", "py-2", "text-xs", "mb-1", "flex", "items-center", "gap-3", "rounded-lg", "cursor-pointer", "hover:bg-reply", 3, "click"], [1, "px-3", "py-2", "flex", "items-center", "text-xs", "gap-3", "rounded-lg", "cursor-pointer", "hover:bg-reply", 3, "click"], ["mode", "outlined", "square", "", 3, "click", "active"], ["width", "15", "height", "15", "viewBox", "0 0 15 15", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["x", "1", "y", "1", "width", "5", "height", "5", "rx", "1", "stroke", "#4F4F4F", "stroke-width", "1.5"], ["x", "9", "y", "1", "width", "5", "height", "5", "rx", "1", "stroke", "#4F4F4F", "stroke-width", "1.5"], ["x", "1", "y", "9", "width", "5", "height", "5", "rx", "1", "stroke", "#4F4F4F", "stroke-width", "1.5"], ["x", "9", "y", "9", "width", "5", "height", "5", "rx", "1", "stroke", "#4F4F4F", "stroke-width", "1.5"], ["width", "24px", "height", "24px", "viewBox", "0 0 24 24", 1, "rotate-180", 3, "click"], ["fill", "currentColor", "d", "M5.59,7.41L10.18,12L5.59,16.59L7,18L13,12L7,6L5.59,7.41M16,6H18V18H16V6Z"], ["fill", "currentColor", "d", "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"], [1, "flex", 3, "click", "ngxTippy", "tippyProps"], ["appendTo", "body", "bindLabel", "output", "bindValue", "page", 1, "pagerefslct", "bg-white", "mx-2", "!px-0", "h-6", "!rounded-base", 3, "ngModelChange", "change", "search", "keydown", "disabled", "items", "ngModel", "placeholder", "inputAttrs", "hidden"], ["ng-option-tmp", ""], [1, "text-xs", "font-normal"], ["type", "number", 3, "ngModelChange", "keyup.enter", "keyup", "ngModel"], ["width", "24px", "height", "24px", "viewBox", "0 0 24 24", 3, "click"], [1, "flex", "p-2", "items-center", "rounded-base", "bg-reply", "gap-2", "hover:text-blue-on", "min-w-8.5", "justify-center", "hover:bg-blue-deactivate':'hover:text-blue-on", "min-w-8.5", "justify-center", "bg-white"], ["name", "factOut", "type", "indicn", 1, "-scale-x-100", 3, "click", "matTooltip"], [3, "ngModelChange", "change", "matTooltip", "ngModel"], [1, "flex", "rounded-base", "border", "items-center", "gap-2.5", "px-2.5", "h-[34px]", 3, "ngClass"], [1, "h-[18px]", "self-stretch", "w-px", "bg-gray-300", "m-auto"], ["mode", "clear", 3, "menuOpened", "menuClosed", "click", "addcls", "matMenuTriggerFor"], [1, "flex", "items-center", "text-xs"], ["data-placeholder", "00%", "dir", "ltr", 1, "text-xs", "!border-none", "px-1", "inline-flex", "rounded-base", "h-fit", "text-center", "focus:outline-none", "min-w-[20px]", "max-w-[80px]", 3, "input", "keydown", "keyup.enter", "blur", "click"], ["class", "text-grey", 4, "ngIf"], ["name", "chvx", 1, "text-xxs", "ml-4"], [1, "h-fit", "bg-white", "mt-1", "shadow-[0px_0px_7px_#0000004d]", "-ml-3"], [1, "flex", "items-center", "size-[18px]", "rounded-full", "border", "border-grey", 3, "click"], ["width", "24px", "height", "24px", "viewBox", "0 0 24 24"], ["fill", "currentColor", "d", "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"], ["fill", "currentColor", "d", "M19,13H5V11H19V13Z"], ["name", "addcircle", 1, "text-lg", 3, "click"], ["name", "removecircle", 1, "text-[19px]", 3, "click"], [1, "text-grey"], [1, "p-2"], [1, "flex", "flex-col", "items-start", "bg-transparent", "rounded-md"], [4, "ngFor", "ngForOf"], [1, "text-xs", "p-1.5", "h-8", "flex", "items-center", "cursor-pointer", "w-full", "rounded-base", "hover:bg-blue-deactivate", 3, "click"], ["name", "check", 1, "text-xs", "ml-auto"], ["mode", "white", 3, "square", "active", "matTooltip", "addcls", "matMenuTriggerFor"], ["name", "fullview", "type", "extra"], [1, "h-52", "!shadow-none", "!bg-transparent", "-ml-10"], [1, "px-2"], [1, "flex", "flex-col", "items-center", "bg-transparent", "rounded-e-full", "px-2.5", "py-1"], [1, "h-[110px]", "realtive", "w-[24px]", "flex", "items-center", "justify-center", "bg-grey", "pt-5", "pb-5", "rounded-t-full"], ["min", "50", "max", "300", "step", "1", "discrete", "", 1, "vertical-slider", "-rotate-90", "absolute", "bg-grey", "px-2.5", "rounded-e-full", "!h-6", "!flex", "!items-center", "!min-w-[90px]", 3, "click", "displayWith"], ["matSliderThumb", "", 3, "ngModelChange", "ngModel"], [1, "bg-grey", "pb-2.5", "pt-2.5", "text-xs", "rounded-b-full", "text-white", "w-6", "flex", "justify-center", "items-center"], ["name", "undo", "type", "extra", 3, "click"], ["mode", "white", 3, "click", "addcls", "matTooltip", "active"], ["name", "share", "type", "extra", 1, "text-base"], ["name", "chvy", 1, "group-hover:inline-block", "hidden", "text-xxs", "-scale-x-100"], [3, "click", "mode", "addcls", "square", "matTooltip", "active"], ["name", "hand", "type", "extra", 1, "text-base"], ["mode", "outlined", 3, "click", "square", "matTooltip", "active"], ["width", "17", "height", "10", "viewBox", "0 0 17 10", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["id", "path-1-inside-1_11665_1802", "fill", "white"], ["d", "M0.570312 1C0.570312 0.447715 1.01803 0 1.57031 0H5.82031C6.3726 0 6.82031 0.447715 6.82031 1V9C6.82031 9.55228 6.3726 10 5.82031 10H1.57031C1.01803 10 0.570312 9.55229 0.570312 9V1Z"], ["d", "M0.570312 1C0.570312 0.447715 1.01803 0 1.57031 0H5.82031C6.3726 0 6.82031 0.447715 6.82031 1V9C6.82031 9.55228 6.3726 10 5.82031 10H1.57031C1.01803 10 0.570312 9.55229 0.570312 9V1Z", "stroke", "currentColor", "stroke-width", "4", "mask", "url(#path-1-inside-1_11665_1802)"], ["id", "path-2-inside-2_11665_1802", "fill", "white"], ["d", "M10.5703 1C10.5703 0.447715 11.018 0 11.5703 0H15.8203C16.3726 0 16.8203 0.447715 16.8203 1V9C16.8203 9.55228 16.3726 10 15.8203 10H11.5703C11.018 10 10.5703 9.55229 10.5703 9V1Z"], ["d", "M10.5703 1C10.5703 0.447715 11.018 0 11.5703 0H15.8203C16.3726 0 16.8203 0.447715 16.8203 1V9C16.8203 9.55228 16.3726 10 15.8203 10H11.5703C11.018 10 10.5703 9.55229 10.5703 9V1Z", "stroke", "currentColor", "stroke-width", "4", "mask", "url(#path-2-inside-2_11665_1802)"], [3, "jFilterChange", "isElasticSearchedChange", "searchEvents", "ValueUpdate", "totalSearch", "pdfLoaded", "currentSearch", "isSearching", "cSearch", "matchCase", "wholeWords", "isfullmode", "jFilter", "isElasticSearched", "totalElasticMaches", "cSearchChange", "elasticPages"], ["mode", "outlined", 1, "px-2.5", "h-8.5", "inline-flex", "items-center", "justify-center", "text-xs", "rounded-base", "whitespace-nowrap", "relative", "text-grey", "bg-white", "border", "border-tab"], [1, "size-4", "border", "border-tab", "rounded-full", "me-2", 3, "click"], [1, "flex", "items-center", "cursor-pointer", 3, "matMenuTriggerFor"], [1, "size-6", "flex", "items-center", "justify-center", "ms-auto", "rounded-md"], ["name", "chvx", 1, "text-xs"], [1, "!min-w-[150px]", "mt-3", "!overflow-visible", "-ml-[80px]"], [1, "p-2.5", "text-xs", "mb-1", "flex", "items-center", "flex-col", "gap-2", "rounded-lg", "cursor-pointer"], [1, "flex", "items-center", "gap-2.5", "w-full", 3, "click"], ["name", "pencil", "type", "toolicn", 1, "text-xl"], ["name", "shape", "type", "toolicn", 1, "text-xl"], ["name", "pencil", "type", "toolicn", 1, "text-xl", "mx-2"], ["name", "shape", "type", "toolicn", 1, "text-xl", "mx-2"], ["name", "check", 1, "ms-auto"], [1, "px-2.5", "h-8.5", "inline-flex", "items-center", "justify-center", "text-xs", "rounded-base", "whitespace-nowrap", "relative", "cursor-pointer", "border", "border-tab"], ["width", "20", "height", "20", "viewBox", "0 0 24 24", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "flex-shrink-0"], ["x", "12", "y", "18", "text-anchor", "middle", "font-size", "18", "font-weight", "bold", "fill", "currentColor"], ["name", "highlighter", "type", "toolicn", 1, "text-xl", "mx-2"], [1, "flex", "text-white", "ms-3", "me-5"], ["name", "close", "type", "comnicn", 1, "block", "text-sm", 3, "click", "matTooltip"], ["mode", "white", "matTooltip", "Create a Fact, or DocLink at page or document level", 3, "matMenuTriggerFor", "active"], ["width", "15", "height", "16", "viewBox", "0 0 15 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["clip-path", "url(#clip0_11665_1813)"], ["d", "M11.25 3.76937H10.3125C10.0469 3.76937 9.82437 3.67891 9.645 3.49798C9.46562 3.31705 9.37562 3.0934 9.375 2.82703C9.37437 2.56066 9.46437 2.33701 9.645 2.15608C9.82562 1.97515 10.0481 1.88469 10.3125 1.88469H11.25V0.942345C11.25 0.675348 11.34 0.451699 11.52 0.271398C11.7 0.0910964 11.9225 0.000631477 12.1875 3.24945e-06C12.4525 -0.000624979 12.6753 0.08984 12.8559 0.271398C13.0366 0.452956 13.1262 0.676605 13.125 0.942345V1.88469H14.0625C14.3281 1.88469 14.5509 1.97515 14.7309 2.15608C14.9109 2.33701 15.0006 2.56066 15 2.82703C14.9994 3.0934 14.9094 3.31736 14.73 3.49892C14.5506 3.68048 14.3281 3.77063 14.0625 3.76937H13.125V4.71171C13.125 4.97871 13.035 5.20267 12.855 5.3836C12.675 5.56453 12.4525 5.65468 12.1875 5.65406C11.9225 5.65343 11.7 5.56296 11.52 5.38266C11.34 5.20236 11.25 4.97871 11.25 4.71171V3.76937ZM6.5625 14.1351L2.625 15.8313C2 16.0983 1.40625 16.0475 0.84375 15.6787C0.28125 15.3099 0 14.7875 0 14.1116V1.88469C0 1.3664 0.18375 0.92287 0.55125 0.5541C0.91875 0.185331 1.36 0.000631477 1.875 3.24945e-06H7.14844C7.42969 3.24945e-06 7.64062 0.125649 7.78125 0.37694C7.92187 0.628231 7.92969 0.887375 7.80469 1.15437C7.69531 1.42137 7.61719 1.68837 7.57031 1.95536C7.52344 2.22236 7.5 2.51292 7.5 2.82703C7.5 3.95784 7.85562 4.95515 8.56687 5.81897C9.27812 6.68278 10.1725 7.22463 11.25 7.4445C11.4375 7.47592 11.6056 7.49571 11.7544 7.50387C11.9031 7.51204 12.0475 7.51581 12.1875 7.51518C12.4531 7.51518 12.6759 7.59779 12.8559 7.76302C13.0359 7.92824 13.1256 8.13618 13.125 8.38685V14.1116C13.125 14.7869 12.8437 15.3093 12.2812 15.6787C11.7187 16.0481 11.125 16.099 10.5 15.8313L6.5625 14.1351Z", "fill", "currentColor"], ["id", "clip0_11665_1813"], ["width", "15", "height", "16", "fill", "white"], [1, "!min-w-fit", "p-2", "!bg-[#E0EDFF]", "mt-3", "!overflow-visible"], [3, "linkEvent", "click", "rangeList"], ["mode", "white", 3, "click", "matMenuTriggerFor", "matTooltip", "active"], ["name", "nextfile", "type", "toolicn", 1, "text-lg"], ["name", "check"], [1, "p-2", "mt-2"], ["matTooltipPosition", "right", 1, "px-3", "py-2", "text-xs", "rounded-lg", "cursor-pointer", "hover:bg-blue-deactivate", 3, "click", "matTooltip"], ["matTooltipPosition", "right", 1, "px-3", "py-2", "text-xs", "rounded-lg", "flex", "items-center", "gap-2", "justify-between", "cursor-pointer", "hover:bg-blue-deactivate", 3, "matTooltip"], ["hideIcon", "", 1, "blue-toggle", 3, "ngModelChange", "change", "ngModel"], ["matTooltip", "Capture a snapshot of a selected area", "matTooltipPosition", "right", 1, "px-3", "py-2", "text-xs", "rounded-lg", "cursor-pointer", "hover:bg-blue-deactivate", 3, "click"], [1, "flex", "h-full", "gap-2"], ["mode", "white", "addcls", "bg-white py-0 h-8.5", 3, "click", "disabled", "matTooltip", "active"], ["square", "", "mode", "outlined", "addcls", "hover:bg-white hover:!border active:bg-white py-0 h-8.5 ", 3, "click", "matTooltip", "active", "matMenuTriggerFor"], ["name", "menu", 1, "text-xs"], [1, "w-full", "flex", "items-center", "border-dashed", "gap-2.5", "border", "border-blue-deactivate", "h-[34px]", "px-3", "rounded-md"], [1, "text-sm", "text-white"], [1, "text-xs", "text-white", "cursor-pointer", "underline", "ms-auto", 3, "click"], ["name", "close", 1, "text-xs", "text-white", "ms-3", 3, "click"], [1, "z-10", "block", "w-full", "opacity-100", "h-11", 3, "OnClose", "OnModeChange", "OnToolBoxEvent", "annotToolMode", "nCaseid", "highlightMode", "selectedIssues", "docInfo"]], template: function ToolbarComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, ToolbarComponent_ng_container_0_Template, 3, 6, "ng-container", 21)(1, ToolbarComponent_ng_container_1_Template, 87, 88, "ng-container", 21);
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", !ctx.fullMode && !(ctx.docInfo == null ? null : ctx.docInfo.isRealtime));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.showhidetoolbar);
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, PdfSharedModule, PdfFirstPageComponent, PdfLastPageComponent, PdfNextPageComponent, PdfPreviousPageComponent, TranslatePipe, ButtonComponent, IconComponent, MatSelectModule, Dir, FormsModule, DefaultValueAccessor, NumberValueAccessor, NgControlStatus, NgModel, SearchComponent, MatMenuModule, MatMenu, MatMenuTrigger, MatSlideToggleModule, MatSlideToggle, AnnotToolsComponent, MatTooltipModule, MatTooltip, MatCheckboxModule, MatCheckbox, MatSliderModule, MatSlider, MatSliderThumb, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective, NgScrollbarModule, NgScrollbar, NgxTippyModule, NgxTippyDirective, MarkoptionsComponent, TranslateModule, SelectionActionsControlComponent], styles: ["\n\ninput[_ngcontent-%COMP%] {\n  font-size: 12px;\n  width: 43px;\n  padding: 0 5px;\n  height: 22px;\n  border-radius: 5px;\n  border: 1px solid #c2c2c2;\n}\ninput[_ngcontent-%COMP%]:focus {\n  outline: none;\n}\ninput[type=number][_ngcontent-%COMP%]::-webkit-inner-spin-button {\n  -webkit-appearance: none;\n}\ninput[type=number][_ngcontent-%COMP%]::-webkit-inner-spin-button {\n  opacity: 1;\n}\n[contenteditable][_ngcontent-%COMP%] {\n  direction: ltr !important;\n  text-align: center;\n  unicode-bidi: bidi-override;\n  writing-mode: horizontal-tb;\n}\n[contenteditable][_ngcontent-%COMP%]:empty:before {\n  content: attr(data-placeholder);\n  color: #999;\n  pointer-events: none;\n}\n[contenteditable].empty[_ngcontent-%COMP%]:before {\n  content: attr(data-placeholder);\n  color: #999;\n  pointer-events: none;\n}\n[contenteditable][_ngcontent-%COMP%]:focus {\n  outline: none;\n}\n[contenteditable][_ngcontent-%COMP%]   *[_ngcontent-%COMP%] {\n  direction: ltr !important;\n  unicode-bidi: normal;\n}\n[contenteditable][_ngcontent-%COMP%]:not(:focus) {\n  pointer-events: auto;\n}\n/*# sourceMappingURL=toolbar.component.css.map */"], data: { animation: [
      trigger("inOutAnimation", [
        transition(":enter", [
          style({ height: 0 }),
          animate("150ms cubic-bezier(0.65, 0.01, 0.69, 1)", style({ height: 44 }))
        ]),
        transition(":leave", [
          style({ height: 44 }),
          animate("150ms cubic-bezier(0.65, 0.01, 0.69, 1)", style({ height: 0 }))
        ])
      ])
    ] } });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ToolbarComponent, { className: "ToolbarComponent", filePath: "src\\app\\pdf\\components\\toolbar\\toolbar.component.ts", lineNumber: 75 });
})();

export {
  ToolbarComponent
};
//# sourceMappingURL=chunk-FZBLJ5HC.js.map
