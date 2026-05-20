import {
  AdvanceSearchService
} from "./chunk-JQOS4SOR.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  FilecolumnService
} from "./chunk-PMFTFHHF.js";
import {
  MatRadioButton,
  MatRadioGroup,
  MatRadioModule
} from "./chunk-ILBZODYX.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatMenuModule
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  BROADCAST_EVENTS,
  BroadcastingService
} from "./chunk-6RMJH3FI.js";
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
  Router,
  Title
} from "./chunk-FNSUDMGC.js";
import {
  CommonModule,
  Location,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  ElementRef,
  EventEmitter,
  InputFlags,
  __async,
  inject,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/directive/input-mask.directive.ts
var InputMaskDirective = class _InputMaskDirective {
  constructor(el) {
    this.el = el;
    this.mask = "";
  }
  onInput(event) {
    const input = this.el.nativeElement;
    const value = input.value.toUpperCase();
    let formattedValue = "";
    let maskIdx = 0;
    let valueIdx = 0;
    while (maskIdx < this.mask.length && valueIdx < value.length) {
      const maskChar = this.mask[maskIdx];
      const valueChar = value[valueIdx];
      if (maskChar === "0" && /\d/.test(valueChar)) {
        formattedValue += valueChar;
        maskIdx++;
        valueIdx++;
      } else if (maskChar === "A") {
        const potentialMonth = value.substring(valueIdx, valueIdx + 3);
        if (this.isMonth(potentialMonth)) {
          formattedValue += potentialMonth;
          maskIdx += 3;
          valueIdx += 3;
        } else {
          break;
        }
      } else if (maskChar === " " || maskChar === "-") {
        formattedValue += maskChar;
        maskIdx++;
        if (valueChar === maskChar) {
          valueIdx++;
        }
      } else {
        maskIdx++;
      }
    }
    if (this.mask == "") {
      formattedValue = input.value;
    }
    input.value = formattedValue;
    event.preventDefault();
  }
  isMonth(value) {
    const months = ["J", "JA", "JAN", "F", "FE", "FEB", "M", "MA", "MAR", "A", "AP", "APR", "MAY", "JU", "JUN", "JUL", "AU", "AUG", "S", "SE", "SEP", "O", "OC", "OCT", "N", "NO", "NOV", "D", "DE", "DEC"];
    return months.includes(value);
  }
  static {
    this.\u0275fac = function InputMaskDirective_Factory(t) {
      return new (t || _InputMaskDirective)(\u0275\u0275directiveInject(ElementRef));
    };
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({ type: _InputMaskDirective, selectors: [["", "appInputMask", ""]], hostBindings: function InputMaskDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("input", function InputMaskDirective_input_HostBindingHandler($event) {
          return ctx.onInput($event);
        });
      }
    }, inputs: { mask: [InputFlags.None, "appInputMask", "mask"] }, standalone: true });
  }
};

// src/app/userpanel/components/annot-filter/annot-filter.component.ts
var AnnotFilterComponent_Defer_14_DepsFn = () => [import("./chunk-GRJZKMOR.js").then((m) => m.ChooseIssueComponent)];
function AnnotFilterComponent_Defer_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "choose-issue", 19, 0);
    \u0275\u0275listener("Onevent", function AnnotFilterComponent_Defer_12_Template_choose_issue_Onevent_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnIssueEvent($event));
    })("OnDataRec", function AnnotFilterComponent_Defer_12_Template_choose_issue_OnDataRec_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnIssueDataReceive($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("isfilter", true)("intoolbar", true)("expandIssue", true)("selectedIssues", ctx_r1.selectedIssues)("nCaseid", ctx_r1.nCaseid);
  }
}
function AnnotFilterComponent_DeferPlaceholder_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 20);
  }
}
function AnnotFilterComponent_For_25_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 21);
    \u0275\u0275listener("change", function AnnotFilterComponent_For_25_Template_mat_checkbox_change_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnImpactChange());
    });
    \u0275\u0275twoWayListener("ngModelChange", function AnnotFilterComponent_For_25_Template_mat_checkbox_ngModelChange_0_listener($event) {
      const x_r4 = \u0275\u0275restoreView(_r3).$implicit;
      \u0275\u0275twoWayBindingSet(x_r4.isSelected, $event) || (x_r4.isSelected = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(1, "span", 22);
    \u0275\u0275element(2, "img", 23);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", x_r4.isSelected);
    \u0275\u0275property("disabled", !ctx_r1.selectedIssues.length);
    \u0275\u0275advance(2);
    \u0275\u0275property("src", "assets/icons/impact/" + x_r4.nValue + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r4.cKey, " ");
  }
}
function AnnotFilterComponent_For_34_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 21);
    \u0275\u0275listener("change", function AnnotFilterComponent_For_34_Template_mat_checkbox_change_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnRelevanceChange());
    });
    \u0275\u0275twoWayListener("ngModelChange", function AnnotFilterComponent_For_34_Template_mat_checkbox_ngModelChange_0_listener($event) {
      const x_r6 = \u0275\u0275restoreView(_r5).$implicit;
      \u0275\u0275twoWayBindingSet(x_r6.isSelected, $event) || (x_r6.isSelected = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(1, "span", 24);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r6 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", x_r6.isSelected);
    \u0275\u0275property("disabled", !ctx_r1.selectedIssues.length);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r6.cKey, " ");
  }
}
function AnnotFilterComponent_For_43_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 25);
    \u0275\u0275listener("change", function AnnotFilterComponent_For_43_Template_mat_checkbox_change_0_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnMarkUpCHange());
    });
    \u0275\u0275twoWayListener("ngModelChange", function AnnotFilterComponent_For_43_Template_mat_checkbox_ngModelChange_0_listener($event) {
      const x_r8 = \u0275\u0275restoreView(_r7).$implicit;
      \u0275\u0275twoWayBindingSet(x_r8.isSelected, $event) || (x_r8.isSelected = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275twoWayProperty("ngModel", x_r8.isSelected);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r8.cKey);
  }
}
var AnnotFilterComponent = class _AnnotFilterComponent {
  constructor(commonService, cdr, cs) {
    this.commonService = commonService;
    this.cdr = cdr;
    this.cs = cs;
    this.jFilter = { cMatchCase: "S", cSearch: "" };
    this.jFilterChange = new EventEmitter();
    this.nCaseid = null;
    this.Showannotaion = false;
    this.selectedIssues = [];
    this.relevences = [];
    this.impacts = [];
    this.markup = [
      {
        id: 1,
        cKey: "Fact",
        checked: false,
        cValue: "F"
      },
      {
        id: 0,
        cKey: "QFact",
        checked: false,
        cValue: "QF"
      },
      {
        id: 1,
        cKey: "Doc Link",
        checked: false,
        cValue: "D"
      },
      {
        id: 1,
        cKey: "Web Link",
        checked: false,
        cValue: "W"
      }
    ];
    this.issueList = [];
  }
  ngOnChanges(changes) {
  }
  OnIssueDataReceive(e) {
    this.issueList = e.issueList || [];
    this.relevences = e.relevences || [];
    this.impacts = e.impacts || [];
    this.issueFilterApplied();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.searchInputClearSubscription = this.cs.functionCalled$.subscribe((e) => __async(this, null, function* () {
        if (e.event == "SEARCH_CLEAR") {
          this.isAllIssue = false;
          this.isAllimpact = false;
          this.isAllrelevance = false;
          this.isAllmarkup = false;
          this.markup.map((e2) => e2.checked = false);
          this.markup.map((e2) => e2.isSelected = false);
          this.impacts.map((e2) => e2.isSelected = false);
          this.relevences.map((e2) => e2.isSelected = false);
          this.jFilter.jRelevance = [];
          this.jFilter.jImpact = [];
          this.jFilter.jIssues = [];
          this.selectedIssues = [];
          this.jFilter.jMarkup = [];
        }
      }));
      this.cdr.detectChanges();
    });
  }
  OnIssueEvent(e) {
    if (e.event == "ISSUE_CHNAGE") {
      debugger;
      const list = e.data || [];
      const issues = list.map((a) => a.nIid);
      if (issues?.length) {
        this.jFilter.jIssues = issues;
      } else {
        this.impacts.map((a) => a.isSelected = false);
        this.relevences.map((a) => a.isSelected = false);
        this.jFilter.jRelevance = [];
        this.jFilter.jImpact = [];
        this.isAllimpact = false;
        this.isAllrelevance = false;
        delete this.jFilter.jIssues;
      }
      this.jFilterChange.emit(this.jFilter);
      this.isAllIssue = false;
      if (!this.issueList.filter((a) => !this.jFilter.jIssues.includes(a.nIid))?.length) {
        this.isAllIssue = true;
      }
      if (!this.selectedIssues?.length) {
        this.impacts.map((a) => a.isSelected = false);
        this.relevences.map((a) => a.isSelected = false);
        this.jFilter.jRelevance = [];
        this.jFilter.jImpact = [];
      }
    }
  }
  CheckAllIssues(val) {
    this.selectedIssues = !val ? [] : [...this.issueList];
    this.jFilter.jIssues = this.selectedIssues.map((a) => a.nIid);
    if (!this.jFilter.jIssues.length) {
      this.impacts.map((a) => a.isSelected = false);
      this.relevences.map((a) => a.isSelected = false);
      this.jFilter.jRelevance = [];
      this.jFilter.jImpact = [];
      this.isAllimpact = false;
      this.isAllrelevance = false;
    }
    this.jFilterChange.emit(this.jFilter);
  }
  OnImpactChange() {
    debugger;
    this.jFilter.jImpact = this.impacts.filter((a) => a.isSelected).map((a) => a.nValue);
    this.jFilterChange.emit(this.jFilter);
    this.isAllimpact = false;
    if (!this.impacts.filter((a) => !a.isSelected).length) {
      this.isAllimpact = true;
    }
  }
  OnRelevanceChange() {
    this.jFilter.jRelevance = this.relevences.filter((a) => a.isSelected).map((a) => a.nValue);
    this.jFilterChange.emit(this.jFilter);
    this.isAllrelevance = false;
    if (!this.relevences.filter((a) => !a.isSelected).length) {
      this.isAllrelevance = true;
    }
  }
  OnMarkUpCHange() {
    this.jFilter.jMarkup = this.markup.filter((a) => a.isSelected).map((a) => a.cValue);
    this.jFilterChange.emit(this.jFilter);
    this.isAllmarkup = false;
    if (!this.markup.filter((a) => !a.isSelected).length) {
      this.isAllmarkup = true;
    }
  }
  OnAllCheckImpact(val) {
    this.impacts.map((a) => a.isSelected = val);
    this.OnImpactChange();
  }
  OnAllCheckRelevance(val) {
    this.relevences.map((a) => a.isSelected = val);
    this.OnRelevanceChange();
  }
  OnAllCheckMarkup(val) {
    this.markup.map((a) => a.isSelected = val);
    this.OnMarkUpCHange();
  }
  filterapplied() {
    const m = this.markup.find((a) => a.nValue == this.jFilter?.jMarkup);
    if (m) {
      m.isSelected = true;
    }
    const r = this.relevences.find((a) => a.nValue == this.jFilter?.jRelevance);
    if (r) {
      r.isSelected = true;
    }
    const i = this.impacts.find((a) => a.nValue == this.jFilter?.jImpact);
    if (i) {
      i.isSelected = true;
    }
  }
  issueFilterApplied() {
    if (this.jFilter?.jIssues?.length) {
      this.selectedIssues = this.issueList.filter((item) => this.jFilter.jIssues.includes(item.nIid)).map((i) => i);
      this.isAllIssue = false;
      if (!this.issueList.filter((a) => !this.jFilter?.jIssues?.includes(a.nIid))?.length) {
        this.isAllIssue = true;
      }
    }
    if (this.jFilter?.jImpact?.length) {
      this.impacts.forEach((item) => {
        item.isSelected = this.jFilter.jImpact.includes(item.nValue);
      });
      this.isAllimpact = false;
      if (!this.impacts.filter((a) => !this.jFilter?.jImpact?.includes(a.nValue))?.length) {
        this.isAllimpact = true;
      }
    }
    if (this.jFilter?.jRelevance?.length) {
      this.relevences.forEach((item) => {
        item.isSelected = this.jFilter.jRelevance.includes(item.nValue);
      });
      this.isAllrelevance = false;
      if (!this.relevences.filter((a) => !this.jFilter?.jRelevance?.includes(a.nValue))?.length) {
        this.isAllrelevance = true;
      }
    }
    if (this.jFilter?.jMarkup?.length) {
      this.markup.forEach((item) => {
        item.isSelected = this.jFilter.jMarkup.includes(item.cValue);
      });
      this.isAllmarkup = false;
      if (!this.markup.filter((a) => !this.jFilter?.jMarkup?.includes(a.cValue))?.length) {
        this.isAllmarkup = true;
      }
    }
    this.cdr.detectChanges();
  }
  static {
    this.\u0275fac = function AnnotFilterComponent_Factory(t) {
      return new (t || _AnnotFilterComponent)(\u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommunicationService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AnnotFilterComponent, selectors: [["annot-filter"]], inputs: { jFilter: "jFilter", nCaseid: "nCaseid", selectedIssues: "selectedIssues" }, outputs: { jFilterChange: "jFilterChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 44, vars: 17, consts: [["issueListC", ""], [1, "w-full", "h-full", "min-h-fit", "bg-[#E0E0E0]", "p-2.5", "rounded-base", "overflow-hidden"], [1, "flex", "gap-2", "items-center", "text-sm", "font-semibold", 3, "click"], ["name", "chvx", 1, "ms-auto"], [1, "my-2.5"], [1, "flex", "gap-6", "pt-2.5", "h-fit"], [1, "w-1/4", "h-full", "flex", "flex-col", "gap-2", "overflow-hidden"], [1, "text-xs", "font-semibold", "flex", "gap-2", "items-center"], [3, "ngModelChange", "change", "ngModel"], [1, "w-3/4", "h-full"], [1, "mb-6"], [1, "text-xs", "font-semibold", "mb-2.5"], [1, "flex", "flex-wrap", "gap-2.5"], [3, "ngModelChange", "change", "ngModel", "disabled"], [1, "divider", "w-px", "h-4", "bg-grey/50", "mx-2.5"], [3, "ngModel", "disabled"], [1, "flex", "gap-2.5"], [1, "flex", "gap-2"], [3, "ngModel"], [1, "block", "h-full", "overflow-auto", 3, "Onevent", "OnDataRec", "isfilter", "intoolbar", "expandIssue", "selectedIssues", "nCaseid"], [1, "w-full", "block", "h-10", "bg-gray-200", "animate-pulse", "rounded-base"], [3, "change", "ngModelChange", "ngModel", "disabled"], [1, "flex", "items-center", "gap-2", "whitespace-nowrap"], [3, "src"], [1, "flex", "items-center", "gap-2", "whitespace-nowrap", "bg-reply", "px-2", "py-1", "rounded-base", "text-xxs", "font-semibold"], [3, "change", "ngModelChange", "ngModel"]], template: function AnnotFilterComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2);
        \u0275\u0275listener("click", function AnnotFilterComponent_Template_div_click_1_listener() {
          return ctx.Showannotaion = !ctx.Showannotaion;
        });
        \u0275\u0275elementStart(2, "h6");
        \u0275\u0275text(3, " Advanced Search - Annotation");
        \u0275\u0275elementEnd();
        \u0275\u0275element(4, "icon", 3);
        \u0275\u0275elementEnd();
        \u0275\u0275element(5, "hr", 4);
        \u0275\u0275elementStart(6, "div", 5)(7, "div", 6)(8, "h6", 7);
        \u0275\u0275text(9, "Issue: ");
        \u0275\u0275elementStart(10, "mat-checkbox", 8);
        \u0275\u0275twoWayListener("ngModelChange", function AnnotFilterComponent_Template_mat_checkbox_ngModelChange_10_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.isAllIssue, $event) || (ctx.isAllIssue = $event);
          return $event;
        });
        \u0275\u0275listener("change", function AnnotFilterComponent_Template_mat_checkbox_change_10_listener() {
          return ctx.CheckAllIssues(ctx.isAllIssue);
        });
        \u0275\u0275text(11, "All");
        \u0275\u0275elementEnd()();
        \u0275\u0275template(12, AnnotFilterComponent_Defer_12_Template, 2, 5)(13, AnnotFilterComponent_DeferPlaceholder_13_Template, 1, 0);
        \u0275\u0275defer(14, 12, AnnotFilterComponent_Defer_14_DepsFn, null, 13);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "div", 9)(17, "div", 10)(18, "h6", 11);
        \u0275\u0275text(19, "Impact");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(20, "div", 12)(21, "mat-checkbox", 13);
        \u0275\u0275twoWayListener("ngModelChange", function AnnotFilterComponent_Template_mat_checkbox_ngModelChange_21_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.isAllimpact, $event) || (ctx.isAllimpact = $event);
          return $event;
        });
        \u0275\u0275listener("change", function AnnotFilterComponent_Template_mat_checkbox_change_21_listener() {
          return ctx.OnAllCheckImpact(ctx.isAllimpact);
        });
        \u0275\u0275text(22, "All");
        \u0275\u0275elementEnd();
        \u0275\u0275element(23, "div", 14);
        \u0275\u0275repeaterCreate(24, AnnotFilterComponent_For_25_Template, 4, 4, "mat-checkbox", 15, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(26, "div", 10)(27, "h6", 11);
        \u0275\u0275text(28, "Relevance");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(29, "div", 16)(30, "mat-checkbox", 13);
        \u0275\u0275twoWayListener("ngModelChange", function AnnotFilterComponent_Template_mat_checkbox_ngModelChange_30_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.isAllrelevance, $event) || (ctx.isAllrelevance = $event);
          return $event;
        });
        \u0275\u0275listener("change", function AnnotFilterComponent_Template_mat_checkbox_change_30_listener() {
          return ctx.OnAllCheckRelevance(ctx.isAllrelevance);
        });
        \u0275\u0275text(31, "All");
        \u0275\u0275elementEnd();
        \u0275\u0275element(32, "div", 14);
        \u0275\u0275repeaterCreate(33, AnnotFilterComponent_For_34_Template, 3, 3, "mat-checkbox", 15, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(35, "div")(36, "h6", 11);
        \u0275\u0275text(37, "Markup");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(38, "div", 17)(39, "mat-checkbox", 8);
        \u0275\u0275twoWayListener("ngModelChange", function AnnotFilterComponent_Template_mat_checkbox_ngModelChange_39_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.isAllmarkup, $event) || (ctx.isAllmarkup = $event);
          return $event;
        });
        \u0275\u0275listener("change", function AnnotFilterComponent_Template_mat_checkbox_change_39_listener() {
          return ctx.OnAllCheckMarkup(ctx.isAllmarkup);
        });
        \u0275\u0275text(40, "All");
        \u0275\u0275elementEnd();
        \u0275\u0275element(41, "div", 14);
        \u0275\u0275repeaterCreate(42, AnnotFilterComponent_For_43_Template, 2, 2, "mat-checkbox", 18, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()()()();
      }
      if (rf & 2) {
        \u0275\u0275classMap(ctx.Showannotaion ? "p-5" : "!bg-dark-blue");
        \u0275\u0275advance();
        \u0275\u0275classMap(!ctx.Showannotaion ? "text-white" : "");
        \u0275\u0275advance(3);
        \u0275\u0275classMap(ctx.Showannotaion ? "rotate-180" : "");
        \u0275\u0275advance();
        \u0275\u0275classMap(!ctx.Showannotaion ? "!hidden" : "");
        \u0275\u0275advance();
        \u0275\u0275classMap(!ctx.Showannotaion ? "!hidden" : "");
        \u0275\u0275advance(4);
        \u0275\u0275twoWayProperty("ngModel", ctx.isAllIssue);
        \u0275\u0275advance(4);
        \u0275\u0275deferWhen(ctx.nCaseid);
        \u0275\u0275advance(7);
        \u0275\u0275twoWayProperty("ngModel", ctx.isAllimpact);
        \u0275\u0275property("disabled", !ctx.selectedIssues.length);
        \u0275\u0275advance(3);
        \u0275\u0275repeater(ctx.impacts);
        \u0275\u0275advance(6);
        \u0275\u0275twoWayProperty("ngModel", ctx.isAllrelevance);
        \u0275\u0275property("disabled", !ctx.selectedIssues.length);
        \u0275\u0275advance(3);
        \u0275\u0275repeater(ctx.relevences);
        \u0275\u0275advance(6);
        \u0275\u0275twoWayProperty("ngModel", ctx.isAllmarkup);
        \u0275\u0275advance(3);
        \u0275\u0275repeater(ctx.markup);
      }
    }, dependencies: [MatCheckboxModule, MatCheckbox, IconComponent, FormsModule, NgControlStatus, NgModel] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AnnotFilterComponent, { className: "AnnotFilterComponent", filePath: "src\\app\\userpanel\\components\\annot-filter\\annot-filter.component.ts", lineNumber: 18 });
})();

// src/app/shared/components/search/search.component.ts
var _c0 = ["myInput"];
var _c1 = (a0, a1) => ({ "-mt-10 !max-w-[900px] !min-w-[calc(100vw_-_144px)] left-[105px]  absolute": a0, "w-full": a1 });
var _c2 = (a0, a1) => ({ "grayscale opacity-50": a0, "pointer-events-none": a1 });
var _c3 = () => [5, 6, 7, 9, 10, 11, 12];
var _c4 = (a0) => ({ "opacity-50": a0 });
var _c5 = () => ({ "pointer-events-auto": true });
function SearchComponent_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7);
    \u0275\u0275listener("click", function SearchComponent_div_2_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.issearched ? ctx_r1.showfilter = false : ctx_r1.mainsearch = false);
    });
    \u0275\u0275elementEnd();
  }
}
function SearchComponent_Conditional_3_icon_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 39);
    \u0275\u0275listener("click", function SearchComponent_Conditional_3_icon_7_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      ctx_r1.onsearchInput("");
      return \u0275\u0275resetView(ctx_r1.clearsearch());
    });
    \u0275\u0275elementEnd();
  }
}
function SearchComponent_Conditional_3_mat_radio_button_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-radio-button", 33)(1, "span", 40);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const val_r5 = ctx.$implicit;
    \u0275\u0275property("value", val_r5.nValue)("checked", val_r5.select);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", val_r5.cKey, " ");
  }
}
function SearchComponent_Conditional_3_Conditional_21_Conditional_0_For_8_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-radio-button", 46);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    const val_r8 = ctx_r6.$implicit;
    const $index_r9 = ctx_r6.$index;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275classMap($index_r9 > 4 ? "col-span-2" : "");
    \u0275\u0275property("disabled", ctx_r1.dateType == "B")("value", val_r8.sortKey)("checked", val_r8.select);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", val_r8.name, " ");
  }
}
function SearchComponent_Conditional_3_Conditional_21_Conditional_0_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, SearchComponent_Conditional_3_Conditional_21_Conditional_0_For_8_Conditional_0_Template, 2, 6, "mat-radio-button", 45);
  }
  if (rf & 2) {
    const val_r8 = ctx.$implicit;
    \u0275\u0275conditional(0, val_r8.isshow && !\u0275\u0275pureFunction0(1, _c3).includes(val_r8.id) ? 0 : -1);
  }
}
function SearchComponent_Conditional_3_Conditional_21_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275element(0, "div", 41);
    \u0275\u0275elementStart(1, "mat-radio-group", 42);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_Conditional_3_Conditional_21_Conditional_0_Template_mat_radio_group_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r1.jFilter.contentType, $event) || (ctx_r1.jFilter.contentType = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(2, "div", 21);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 43)(5, "mat-radio-button", 44);
    \u0275\u0275text(6, " All ");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(7, SearchComponent_Conditional_3_Conditional_21_Conditional_0_For_8_Template, 1, 2, null, null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.jFilter.contentType);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.cf.searchFilter[1].cKey, " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("value", "All");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.reqcols);
  }
}
function SearchComponent_Conditional_3_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, SearchComponent_Conditional_3_Conditional_21_Conditional_0_Template, 9, 3);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, ctx_r1.cf.searchin != "I" ? 0 : -1);
  }
}
function SearchComponent_Conditional_3_Conditional_22_For_14_span_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r11 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r11.cKey, " ");
  }
}
function SearchComponent_Conditional_3_Conditional_22_For_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 53);
    \u0275\u0275template(1, SearchComponent_Conditional_3_Conditional_22_For_14_span_1_Template, 2, 1, "span", 54);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r11 = ctx.$implicit;
    \u0275\u0275property("value", x_r11.cKey)("ngClass", \u0275\u0275pureFunction0(3, _c5));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r11.cKey != "date");
  }
}
function SearchComponent_Conditional_3_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275element(0, "div", 25);
    \u0275\u0275elementStart(1, "mat-radio-group", 47);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_Conditional_3_Conditional_22_Template_mat_radio_group_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.dateType, $event) || (ctx_r1.dateType = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(2, "h6", 21);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 22)(5, "mat-radio-button", 48);
    \u0275\u0275listener("change", function SearchComponent_Conditional_3_Conditional_22_Template_mat_radio_button_change_5_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      ctx_r1.formatChanged($event);
      return \u0275\u0275resetView(ctx_r1.cf.searchdate = "A");
    });
    \u0275\u0275text(6, " All formats ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 49)(8, "mat-radio-button", 50);
    \u0275\u0275listener("change", function SearchComponent_Conditional_3_Conditional_22_Template_mat_radio_button_change_8_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.formatChanged($event));
    });
    \u0275\u0275text(9, " Choose format ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "div", 51)(11, "mat-select", 52, 1);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_Conditional_3_Conditional_22_Template_mat_select_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.cf.searchdate, $event) || (ctx_r1.cf.searchdate = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("selectionChange", function SearchComponent_Conditional_3_Conditional_22_Template_mat_select_selectionChange_11_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.formatChanged($event));
    });
    \u0275\u0275repeaterCreate(13, SearchComponent_Conditional_3_Conditional_22_For_14_Template, 2, 4, "mat-option", 53, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.dateType);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.cf.searchFilter[3].cKey, " ");
    \u0275\u0275advance(5);
    \u0275\u0275property("value", "B");
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.cf.searchdate);
    \u0275\u0275property("disabled", ctx_r1.dateType != "B")("ngClass", \u0275\u0275pureFunction1(6, _c4, ctx_r1.dateType != "B"));
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.cf.searchFilter[3].list);
  }
}
function SearchComponent_Conditional_3_For_32_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 55);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_Conditional_3_For_32_Template_mat_checkbox_ngModelChange_0_listener($event) {
      const x_r13 = \u0275\u0275restoreView(_r12).$implicit;
      \u0275\u0275twoWayBindingSet(x_r13.select, $event) || (x_r13.select = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function SearchComponent_Conditional_3_For_32_Template_mat_checkbox_change_0_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.changeTypes($event, ctx_r1.cf.searchFilter[4].list, false));
    });
    \u0275\u0275elementStart(1, "span", 29);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r13 = ctx.$implicit;
    const $index_r14 = ctx.$index;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275twoWayProperty("ngModel", x_r13.select);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(6, _c2, ctx_r1.cf.searchin == "I" && !x_r13.content, ctx_r1.cf.searchin == "I"))("checked", x_r13.select || ctx_r1.cf.searchin == "I" && x_r13.content);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.cf.searchin == "I" && $index_r14 != 0 ? "opacity-50" : "");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r13.cKey, "");
  }
}
function SearchComponent_Conditional_3_For_39_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 56);
    \u0275\u0275text(1, " : ");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 57);
    \u0275\u0275element(3, "path", 58);
    \u0275\u0275elementEnd();
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r1.jFilter == null ? null : ctx_r1.jFilter.cBundlename, " ");
  }
}
function SearchComponent_Conditional_3_For_39_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-radio-button", 33);
    \u0275\u0275text(1);
    \u0275\u0275template(2, SearchComponent_Conditional_3_For_39_Conditional_2_Template, 5, 1, "span", 56);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const val_r15 = ctx.$implicit;
    const $index_r16 = ctx.$index;
    \u0275\u0275property("value", val_r15.nValue)("checked", val_r15.select);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", val_r15.cKey, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, $index_r16 == 1 ? 2 : -1);
  }
}
function SearchComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275listener("closed", function SearchComponent_Conditional_3_Template_div_closed_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.menuClose());
    });
    \u0275\u0275elementStart(1, "div", 9)(2, "div", 10)(3, "div", 11);
    \u0275\u0275element(4, "icon", 12);
    \u0275\u0275elementStart(5, "input", 13, 0);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_Conditional_3_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.jFilter.cSearch, $event) || (ctx_r1.jFilter.cSearch = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("focus", function SearchComponent_Conditional_3_Template_input_focus_5_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      ctx_r1.mainsearch = true;
      return \u0275\u0275resetView(ctx_r1.showfilter = true);
    })("keyup.enter", function SearchComponent_Conditional_3_Template_input_keyup_enter_5_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.searchChange());
    })("ngModelChange", function SearchComponent_Conditional_3_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onsearchInput($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, SearchComponent_Conditional_3_icon_7_Template, 1, 0, "icon", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "mat-radio-group", 15);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_Conditional_3_Template_mat_radio_group_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.cf.searchName, $event) || (ctx_r1.cf.searchName = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function SearchComponent_Conditional_3_Template_mat_radio_group_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onTermCondition($event));
    });
    \u0275\u0275elementStart(9, "div", 16);
    \u0275\u0275template(10, SearchComponent_Conditional_3_mat_radio_button_10_Template, 3, 3, "mat-radio-button", 17);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "div", 18)(12, "div", 19)(13, "mat-radio-group", 20);
    \u0275\u0275listener("change", function SearchComponent_Conditional_3_Template_mat_radio_group_change_13_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.typechange($event));
    });
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_Conditional_3_Template_mat_radio_group_ngModelChange_13_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.cf.searchin, $event) || (ctx_r1.cf.searchin = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(14, "h6", 21);
    \u0275\u0275text(15, " Search within ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "div", 22)(17, "mat-radio-button", 23);
    \u0275\u0275text(18, " Metadata ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "mat-radio-button", 24);
    \u0275\u0275text(20, " Content ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(21, SearchComponent_Conditional_3_Conditional_21_Template, 1, 1)(22, SearchComponent_Conditional_3_Conditional_22_Template, 15, 8);
    \u0275\u0275element(23, "div", 25);
    \u0275\u0275elementStart(24, "div", 26)(25, "h6", 21);
    \u0275\u0275text(26);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "div", 27)(28, "mat-checkbox", 28);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_Conditional_3_Template_mat_checkbox_ngModelChange_28_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.checkalltype, $event) || (ctx_r1.checkalltype = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function SearchComponent_Conditional_3_Template_mat_checkbox_change_28_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.changeTypes($event, ctx_r1.cf.searchFilter[4].list, true));
    });
    \u0275\u0275elementStart(29, "span", 29);
    \u0275\u0275text(30, " All");
    \u0275\u0275elementEnd()();
    \u0275\u0275repeaterCreate(31, SearchComponent_Conditional_3_For_32_Template, 3, 9, "mat-checkbox", 30, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(33, "div", 31);
    \u0275\u0275elementStart(34, "mat-radio-group", 32);
    \u0275\u0275twoWayListener("ngModelChange", function SearchComponent_Conditional_3_Template_mat_radio_group_ngModelChange_34_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.jFilter.cLocation, $event) || (ctx_r1.jFilter.cLocation = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(35, "h6", 21);
    \u0275\u0275text(36);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(37, "div", 22);
    \u0275\u0275repeaterCreate(38, SearchComponent_Conditional_3_For_39_Template, 3, 4, "mat-radio-button", 33, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(40, "div", 34)(41, "annot-filter", 35);
    \u0275\u0275listener("jFilterChange", function SearchComponent_Conditional_3_Template_annot_filter_jFilterChange_41_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.filterchange($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(42, "div", 36)(43, "btn", 37);
    \u0275\u0275listener("click", function SearchComponent_Conditional_3_Template_btn_click_43_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.searchChange());
    });
    \u0275\u0275text(44, " Search ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(45, "a", 38);
    \u0275\u0275listener("click", function SearchComponent_Conditional_3_Template_a_click_45_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      ctx_r1.clearsearch();
      return \u0275\u0275resetView(ctx_r1.onsearchInput(""));
    });
    \u0275\u0275text(46, " CLEAR ");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(31, _c1, !ctx_r1.isadvanced, ctx_r1.isadvanced));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", ctx_r1.headSearvice.isGlobalSearch ? (ctx_r1.headSearvice.jFilter == null ? null : ctx_r1.headSearvice.jFilter.cWithin) == "I" ? "global" : "meta" : "main");
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.jFilter.cSearch);
    \u0275\u0275property("type", ctx_r1.dateType == "A" || ctx_r1.cf.searchdate == "A" ? "text" : "data")("placeholder", ctx_r1.dateType == "A" || ctx_r1.cf.searchdate == "A" ? "Search by file name, bundle, tab, exhibit no." + ctx_r1.mask : ctx_r1.mask)("appInputMask", ctx_r1.mask);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.issearched);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.isAdmin ? "bg-white" : "");
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.cf.searchName);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.cf.searchFilter[0].list);
    \u0275\u0275advance();
    \u0275\u0275classMap(!ctx_r1.issearched || ctx_r1.showfilter ? "" : "!hidden");
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.cf.searchin);
    \u0275\u0275advance(4);
    \u0275\u0275property("disabled", ctx_r1.headSearvice.isGlobalSearch && ctx_r1.jFilter.cWithin == "I");
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r1.headSearvice.isGlobalSearch && ctx_r1.jFilter.cWithin == "M");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(21, !ctx_r1.isPresent ? 21 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(22, ctx_r1.cf.searchin != "I" ? 22 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r1.cf.searchFilter[4].cKey, " ");
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.checkalltype);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(34, _c2, ctx_r1.cf.searchin == "I", ctx_r1.cf.searchin == "I"));
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r1.cf.searchFilter[4].list);
    \u0275\u0275advance(3);
    \u0275\u0275classMap(ctx_r1.cf.searchin == "I" ? "w-1/2" : "w-full");
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.jFilter.cLocation);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.cf.searchFilter[2].cKey, " ");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.cf.searchFilter[2].list);
    \u0275\u0275advance(3);
    \u0275\u0275property("nCaseid", ctx_r1.headSearvice == null ? null : ctx_r1.headSearvice.nCaseid)("jFilter", ctx_r1.jFilter);
    \u0275\u0275advance(2);
    \u0275\u0275property("addcls", "rounded-full " + (!ctx_r1.jFilter.cSearch ? "bg-none !bg-blue-50 !text-blue-hover " : ""))("disabled", !ctx_r1.jFilter.cSearch);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(!ctx_r1.jFilter.cSearch ? "pointer-events-none opacity-50" : "");
  }
}
function SearchComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "span", 59);
    \u0275\u0275listener("click", function SearchComponent_Conditional_4_Template_span_click_2_listener() {
      \u0275\u0275restoreView(_r17);
      const ctx_r1 = \u0275\u0275nextContext();
      ctx_r1.mainsearch = true;
      return \u0275\u0275resetView(ctx_r1.showfilter = true);
    });
    \u0275\u0275text(3, "show search details");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.elasticSummary == null ? null : ctx_r1.elasticSummary.totalBDIDs, " result found ");
  }
}
var SearchComponent = class _SearchComponent {
  constructor(cs, cf, fcs, cdr, headSearvice, advanceSearchService, router, broadCastService, location2) {
    this.cs = cs;
    this.cf = cf;
    this.fcs = fcs;
    this.cdr = cdr;
    this.headSearvice = headSearvice;
    this.advanceSearchService = advanceSearchService;
    this.router = router;
    this.broadCastService = broadCastService;
    this.location = location2;
    this.titleS = inject(Title);
    this.mask = "";
    this.issearched = false;
    this.isPresent = false;
    this.isadvanced = false;
    this.onSearch = new EventEmitter();
    this.OnClear = new EventEmitter();
    this.mainsearch = false;
    this.reqcols = [];
    this.dateType = "A";
    this.isElasticsearch = false;
    this.checkalltype = true;
    this.jFilter = { cWithin: this.cf.searchin, cMatchCase: "C", cSearch: "", cLocation: "A" };
    this.jFilterChange = new EventEmitter();
    this.elasticSummary = { totalBDIDs: 0 };
    this.showfilter = true;
    this.currentfolder = { cBundlename: "Master Bundle", nBundleid: null };
    this.isAlltypes = false;
  }
  ngOnInit() {
    this.jFilter;
    this.broadCastSubscription = this.broadCastService.onSearchChange().subscribe((body) => {
      if (body.event == BROADCAST_EVENTS.SEARCH_CHANGED) {
        if (body.data.jFilter?.cWithin == this.headSearvice?.search_within && body.data.nCaseid == (this.headSearvice.nCaseid || this.headSearvice?.Casedetail?.nCaseid)) {
          this.headSearvice.isGlobalSearch = true;
          this.headSearvice.jFilter = body.data.jFilter;
          this.titleS.setTitle(this.headSearvice.search_within == "I" ? "Content Search" : "Metadata Search");
          this.issearched = true;
          this.jFilter = body.data.jFilter;
          this.cf.jFTypes = this.jFilter.jFTypes;
          if (this.cf.jFTypes.length > 0) {
            this.cf.searchFilter[4].list.map((e) => {
              e.select = e.types.some((type) => this.jFilter.jFTypes.includes(type));
            });
            this.checkalltype = false;
          } else {
            this.cf.searchFilter[4].list.map((e) => e.select = false);
            this.checkalltype = true;
          }
          this.currentfolder.nBundleid = this.jFilter?.nBundleid;
          this.currentfolder.cBundlename = this.jFilter?.cBundlename || "Master Bundle";
          this.checkFilter();
          this.mainsearch = true;
          this.searchChange();
          this.cdr.detectChanges();
        }
      }
    });
    this.broadCastService.onSearchDeactivate().subscribe((body) => {
      if (body.event == BROADCAST_EVENTS.DEACTIVATE_SEARCH && !this.headSearvice.isGlobalSearch) {
        if (body.data.cWithin == "I" && body.data.nCaseid == (this.headSearvice.nCaseid || this.headSearvice?.Casedetail?.nCaseid)) {
          this.window_content = null;
        } else {
          this.window_metadata = null;
        }
      }
    });
    if (this.headSearvice.isGlobalSearch) {
      this.cf.jFTypes = this.jFilter.jFTypes;
      if (this.cf.jFTypes.length > 0) {
        this.cf.searchFilter[4].list.map((e) => {
          e.select = e.types.some((type) => this.jFilter.jFTypes.includes(type));
        });
        this.checkalltype = false;
      } else {
        this.checkalltype = true;
      }
      this.currentfolder.nBundleid = this.jFilter?.nBundleid || null;
      this.currentfolder.cBundlename = this.jFilter?.cBundlename || "Master Bundle";
    }
    this.reqcols = this.fcs.tablecols;
    let ind = this.reqcols.findIndex((e) => e.name == "Tab" && e.isshow);
    this.checkFilter();
    if (this.issearched) {
      this.mainsearch = true;
      this.searchChange();
    }
    this.searchInputClearSubscription = this.cs.functionCalled$.subscribe((e) => __async(this, null, function* () {
      if (e.event == "CLEAR_SEARCH_INPUT") {
        this.jFilter.cSearch = "";
        this.jFilterChange.emit(this.jFilter);
      }
      if (e.event == "CLEAR_SEARCH_ALL") {
        this.clearsearch();
      } else if (e.event == "UPDATE-SEARCH-URL") {
        this.updateUrlWithNewFilter(e.jFilter);
      }
    }));
    this.cdr.detectChanges();
  }
  searchChange() {
    if (!this.jFilter) {
      this.jFilter = { cMatchCase: "E", cSearch: "", cWithin: this.cf.searchin, cLocation: "A", contentType: "All" };
      this.jFilterChange.emit(this.jFilter);
    }
    this.jFilter.jFTypes = this.cf.jFTypes;
    this.jFilter.cWithin = this.cf.searchin;
    if (!this.headSearvice.isGlobalSearch) {
      this.jFilter.isGlobalSearch = true;
      this.jFilter.nOBundleid = this.jFilter.nBundleid;
      this.jFilter.nSectionid = this.headSearvice.nSectionid;
      this.jFilter.nOSectionid = this.headSearvice.nSectionid;
      const wind = this.jFilter.cWithin == "I" ? this.window_content : this.window_metadata;
      if (this.jFilter.cLocation == "A") {
        this.jFilter.nBundleid = null;
      }
      if (wind && !wind.closed) {
        this.broadCastService.portMessage({
          event: "SEARCH-CHANGED",
          data: { jFilter: this.jFilter, nCaseid: this.headSearvice.nCaseid || this.headSearvice?.Casedetail?.nCaseid }
        });
        wind.focus();
      } else {
        const url = this.router.serializeUrl(this.router.createUrlTree([location.href.includes("managefiles/bundlemanagement/") ? "/managefiles/bundlemanagement" : "/myfiles/filesaction", btoa(JSON.stringify({ id: this.headSearvice.nCaseid || this.headSearvice?.Casedetail?.nCaseid, jFilter: this.jFilter }))]));
        const openedWindow = window.open(`${location.origin}${url}`, "_blank");
        this.jFilter.cWithin == "I" ? this.window_content = openedWindow : this.window_metadata = openedWindow;
      }
    } else {
      this.jFilter.nBundleid = this.jFilter?.nBundleid || this.currentfolder?.nBundleid || null;
      this.jFilter.cBundlename = this.jFilter.cLocation == "T" ? this.jFilter.cBundlename || this.currentfolder?.cBundlename || "Master Bundle" : "Master Bundle";
      this.nBundleid = this.currentfolder?.nBundleid || this.jFilter?.nBundleid || null;
      this.isElasticsearch = false;
      this.myInputElementRef?.nativeElement?.blur();
      this.issearched = true;
      this.showfilter = false;
      this.jFilter.nBundleid = this.jFilter?.nOBundleid;
      if (this.cf.searchin == "I") {
        this.emitSearch();
        this.isElasticsearch = true;
      } else {
        this.cs.callFunction({ event: "FETCH-META-BUNDLES", jFilter: this.jFilter });
        this.cs.callFunction({ event: "SEARCH_FILES", jFilter: this.jFilter, type: this.cf.searchin == "I" ? "E" : "N" });
      }
      this.updateUrlWithNewFilter(this.jFilter);
    }
    this.cdr.detectChanges();
  }
  formatChanged(e) {
    this.mask = "";
    switch (e.value) {
      case "DD-MM-YYYY":
        this.mask = "00-00-0000";
        break;
      case "DD MON YYYY":
        this.mask = "00 AAA 0000";
        break;
      case "MM-YYYY":
        this.mask = "00-0000";
        break;
      case "YYYY":
        this.mask = "0000";
        break;
      case "MM - MM YYYY":
        this.mask = "00 - 00 0000";
        break;
      case "DD - DD MON YYYY":
        this.mask = "00 - 00 AAA 0000";
        break;
      case "DD - DD MM YYYY":
        this.mask = "00 - 00 00 0000";
        break;
      case "MON - MON YYYY":
        this.mask = "AAA - AAA 0000";
        break;
      case "YYYY - YYYY":
        this.mask = "0000 - 0000";
        break;
      default:
        this.mask = "";
        break;
    }
  }
  clearinput(menu) {
    if (this.headSearvice.isGlobalSearch) {
      this.updateUrlWithNewFilter(this.jFilter);
      this.cs.callFunction({ event: "SEARCH_CLEAR", jFilter: this.jFilter, type: "N" });
    }
  }
  clearsearch() {
    this.clearFilters();
    this.OnClear.emit(true);
    this.cs.callFunction("RESET_FILES");
    this.cs.callFunction({ event: "CLEAR_SEARCH_ELASTIC", jFilter: this.jFilter });
    this.cs.callFunction({ type: "SEARCH-BUNDLES-CLEAR" });
    if (this.headSearvice.isGlobalSearch) {
      this.updateUrlWithNewFilter(this.jFilter);
    }
    this.cdr.detectChanges();
    setTimeout(() => {
      this.issearched = false;
      this.cdr.detectChanges();
    }, 100);
  }
  clearsearch_old(menu) {
    this.headSearvice.isGlobalSearch = false;
    this.titleS.setTitle("HearingHub");
    this.cf.searchdate = "A";
    this.cf.searchin = "M";
    this.dateType = "A";
    this.mainsearch = false;
    this.jFilter = { cMatchCase: "C", cSearch: "", cLocation: "A", cWithin: this.cf.searchin, contentType: "All", jFTypes: [], nCaseid: this.headSearvice.nCaseid || this.headSearvice?.Casedetail?.nCaseid };
    this.cs.callFunction({ event: "SEARCH_FILES", jFilter: this.jFilter, type: "N" });
    this.OnClear.emit(true);
    this.cs.callFunction("RESET_FILES");
    this.cs.callFunction({ event: "CLEAR_SEARCH_ELASTIC", jFilter: this.jFilter });
    this.cdr.detectChanges();
    setTimeout(() => {
      this.issearched = false;
      this.cdr.detectChanges();
    }, 100);
  }
  menuopened() {
    setTimeout(() => {
      this.myInputElementRef.nativeElement.focus();
    }, 10);
  }
  menuClose() {
    this.cs.callFunction("SEARCH_CLOSE");
  }
  ///// ALPHA
  emitSearch() {
    this.cs.callFunction({ event: "SEARCH_ELASTIC", jFilter: this.jFilter });
    this.issearched = true;
    this.getBundlesOfElasticSearch(this.jFilter);
    this.getSummaryOfElasticSearch(this.jFilter);
    this.cdr.detectChanges();
  }
  getBundlesOfElasticSearch(jFilter) {
    return __async(this, null, function* () {
      const isCaseSensitive = jFilter.cMatchCase == "E";
      const isStartWith = jFilter.cMatchCase == "S";
      const isWholeWord = jFilter.cMatchCase == "E";
      this.cs.callFunction({ type: "SEARCH-BUNDLES-CLEAR" });
      const bundleSearch = yield this.advanceSearchService.searchBundle(jFilter.cSearch, this.headSearvice?.nCaseid, isCaseSensitive, isStartWith, isWholeWord, jFilter?.jIssues, jFilter?.jImpact, jFilter?.jRelevance, jFilter?.jMarkup, jFilter.cLocation == "A" ? null : jFilter.nBundleid);
      this.cs.callFunction({ type: "SEARCH-BUNDLES", searchedBundles: bundleSearch?.bundleIds || [] });
    });
  }
  getSummaryOfElasticSearch(jFilter) {
    return __async(this, null, function* () {
      const isCaseSensitive = jFilter.cMatchCase == "E";
      const isStartWith = jFilter.cMatchCase == "S";
      const isWholeWord = jFilter.cMatchCase == "E";
      this.elasticSummary = yield this.advanceSearchService.searchSummary(jFilter.cSearch, this.headSearvice?.nCaseid, isCaseSensitive, isStartWith, isWholeWord, jFilter?.jIssues, jFilter?.jImpact, jFilter?.jRelevance, jFilter?.jMarkup, jFilter.cLocation == "A" ? null : jFilter.nBundleid, this.headSearvice?.nSectionid, this.headSearvice?.cFoldertype);
      this.cs.callFunction({ event: "SEARCH_SUMMARY", elasticSummary: this.elasticSummary });
      this.cdr.detectChanges();
    });
  }
  onsearchInput(e) {
    this.jFilter.cSearch = e;
  }
  onTermCondition(event) {
    this.jFilter.cMatchCase = event;
    if (this.issearched) {
      this.searchChange();
    }
    this.cdr.detectChanges();
  }
  ngOnChanges(changes) {
    if (changes["jFilter"] && !changes["jFilter"].firstChange) {
      if (this.headSearvice.isGlobalSearch) {
        if (this.jFilter.nBundleid == null) {
          this.jFilter.cLocation = this.jFilter?.cLocation || "A";
          this.checkFilter();
        }
      }
    }
    if (changes["currentfolder"]) {
      if (this.headSearvice.isGlobalSearch && changes["currentfolder"].firstChange) {
        return;
      }
      this.jFilter.nBundleid = this.currentfolder?.nBundleid || null;
      this.jFilter.nBundleid = this.currentfolder?.nBundleid || this.jFilter?.nBundleid || null;
      this.jFilter.cBundlename = this.currentfolder?.cBundlename || "Master Bundle";
      if (!changes["currentfolder"].firstChange && this.headSearvice.isGlobalSearch) {
        if (this.cf.searchin == "I") {
          this.getSummaryOfElasticSearch(this.jFilter);
        }
      }
      this.cdr.detectChanges();
    }
  }
  checkFilter() {
    if (this.jFilter.cSearch) {
      this.cf.searchin = this.jFilter.cWithin;
      this.issearched = true;
      try {
        this.cf.searchName = this.jFilter?.cMatchCase;
      } catch (error) {
      }
      this.cdr.detectChanges();
    }
  }
  filterchange(ev) {
    console.log(ev);
  }
  ngOnDestroy() {
    this.clearsearch();
    try {
      if (this.broadCastSubscription)
        this.broadCastSubscription.unsubscribe();
      if (this.searchInputClearSubscription) {
        this.searchInputClearSubscription.unsubscribe();
      }
    } catch (error) {
    }
  }
  resetSearch() {
    this.jFilter = { cMatchCase: "E", cSearch: "" };
    this.cdr.detectChanges();
  }
  changeTypes(e, list, isAll) {
    debugger;
    if (isAll) {
      this.cf.jFTypes = [];
      for (let x of list)
        x.select = false;
    } else {
      this.cf.jFTypes = [];
      for (let x of list) {
        if (x.select) {
          for (let y of x.types)
            this.cf.jFTypes.push(y);
        }
      }
    }
    const selectedCount = list.filter((e2) => e2.select).length;
    this.checkalltype = selectedCount === list.length || selectedCount === 0;
  }
  typechange(ev) {
    debugger;
    ;
    if (ev.value == "I") {
      this.checkalltype = false;
      this.cf.jFTypes = ["PDF"];
    } else {
      this.cf.jFTypes = [];
      this.checkalltype = true;
    }
    this.jFilter.cWithin = ev.value;
  }
  updateUrlWithNewFilter(newFilter) {
    if (this.headSearvice.isGlobalSearch) {
      const updatedData = {
        id: this.headSearvice.nCaseid || this.headSearvice?.Casedetail?.nCaseid,
        jFilter: newFilter
      };
      const encoded = btoa(JSON.stringify(updatedData));
      const currentBase = this.router.url.split("/").slice(0, -1).join("/");
      const newUrl = `${currentBase}/${encoded}`;
      this.location.replaceState(newUrl);
    }
  }
  clearFilters() {
    this.cf.searchdate = "A";
    this.dateType = "A";
    this.jFilter = {
      cMatchCase: "C",
      cSearch: "",
      cLocation: "A",
      cWithin: this.jFilter.cWithin,
      contentType: "All",
      jFTypes: [],
      nCaseid: this.headSearvice.nCaseid || this.headSearvice?.Casedetail?.nCaseid,
      isGlobalSearch: this.headSearvice.isGlobalSearch
    };
    this.headSearvice.jFilter = this.jFilter;
    this.cs.callFunction({ event: "SEARCH_CLEAR", jFilter: this.jFilter, type: "N" });
  }
  static {
    this.\u0275fac = function SearchComponent_Factory(t) {
      return new (t || _SearchComponent)(\u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(FilecolumnService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(AdvanceSearchService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(BroadcastingService), \u0275\u0275directiveInject(Location));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SearchComponent, selectors: [["search"]], viewQuery: function SearchComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.myInputElementRef = _t.first);
      }
    }, inputs: { isAdmin: "isAdmin", isPresent: "isPresent", isadvanced: "isadvanced", jFilter: "jFilter", nBundleid: "nBundleid", currentfolder: "currentfolder" }, outputs: { onSearch: "onSearch", OnClear: "OnClear", jFilterChange: "jFilterChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 5, vars: 4, consts: [["myInput", ""], ["mySelect", ""], ["mode", "outlined", "matTooltip", "Search", "addcls", "rounded-full", "matTooltipClass", "defaulttooltip no-arrow", "matTooltipPosition", "below", 3, "click", "square"], ["name", "search"], ["class", "backdrop h-full w-full top-0 left-0 fixed bg-transparent z-40", 3, "click", 4, "ngIf"], ["id", "mainsearchm", 1, "!shadow-none", "search", "z-[999]", "!rounded-[23px]", "overflow-hidden", 3, "ngClass"], [1, "text-xs", "text-end", "font-semibold", "py-2.5", "!min-w-[calc(100vw_-_144px)]", "left-[105px]", "absolute", "mt-2.5"], [1, "backdrop", "h-full", "w-full", "top-0", "left-0", "fixed", "bg-transparent", "z-40", 3, "click"], ["id", "mainsearchm", 1, "!shadow-none", "search", "z-[999]", "!rounded-[23px]", "overflow-hidden", 3, "closed", "ngClass"], [1, "w-full"], [1, "flex", "items-center", "ms-auto", "search-input-container", 3, "ngClass"], [1, "items-center", "bg-white", "border-blue-on", "border-4", "flex", "w-full", "mb-3", "justify-center", "px-4", "gap-3", "rounded-full"], ["name", "search", 1, "text-blue-300", "font-thin", "text-sm"], [1, "w-full", "text-xs", "focus:outline-none", "h-10", "!shadow-none", "!border-none", 3, "ngModelChange", "focus", "keyup.enter", "ngModel", "type", "placeholder", "appInputMask"], ["name", "close", "class", "text-xs", 3, "click", 4, "ngIf"], [1, "w-1/4", "mb-3", "ps-2.5", "h-auto", "self-stretch", "flex", "items-center", 3, "ngModelChange", "ngModel"], [1, "flex", "gap-x-2.5"], ["class", "isdark flex", 3, "value", "checked", 4, "ngFor", "ngForOf"], [1, "p-5", "bg-dark-blue/85", "rounded-xl", "max-h-[calc(100vh_-_150px)]", "overflow-y-auto"], [1, "items-stretch", "bg-dark-blue", "flex-wrap", "rounded-2xl", "flex", "gap-3", "mt-2", "ps-3", "pe-5", "py-5", "pb-5"], [1, "ps-3", "pe-5", "w-[10%]", 3, "change", "ngModelChange", "ngModel"], [1, "text-white", "text-xs", "font-semibold"], [1, "grid", "gap-y-2.5", "m-0", "mt-2"], ["value", "M", "checked", "", 1, "isdark", "flex", 3, "disabled"], ["value", "I", 1, "isdark", "flex", 3, "disabled"], [1, "h-auto", "w-px", "bg-white/30"], [1, "ps-3", "pe-5", "w-[30%]"], [1, "flex", "flex-wrap", "gap-y-1.5", "m-0", "mt-2", "grid-cols-3"], ["checked", "", 1, "w-1/3", "mb-2.5", "radiocheckbox", "iswhite", 3, "ngModelChange", "change", "ngModel", "ngClass"], [1, "text-white"], [1, "w-1/3", "mb-2.5", 3, "ngModel", "ngClass", "checked"], [1, "bg-white/30", "w-full", "h-px"], [1, "ps-3", "pe-5", 3, "ngModelChange", "ngModel"], [1, "isdark", "flex", 3, "value", "checked"], [1, "mt-3"], [3, "jFilterChange", "nCaseid", "jFilter"], [1, "flex", "items-center", "pt-2.5", "rounded-none", "gap-6"], ["mode", "gradient", 1, "flex", 3, "click", "addcls", "disabled"], [1, "text-white", "text-xs", "underline", "cursor-pointer", 3, "click"], ["name", "close", 1, "text-xs", 3, "click"], [1, "whitespace-nowrap", "text-dark-blue"], [1, "vr", "bg-white", "h-auto", "w-px", "bg-white/30"], [1, "ps-3", "pe-5", "w-[21%]", 3, "ngModelChange", "ngModel"], [1, "flex", "flex-wrap", "gap-2.5", "m-0", "mt-2"], [1, "isdark", "flex", 3, "value"], [1, "isdark", "flex", 3, "class", "disabled", "value", "checked"], [1, "isdark", "flex", 3, "disabled", "value", "checked"], [1, "ps-3", "pe-5", "w-[30%]", 3, "ngModelChange", "ngModel"], ["value", "A", "checked", "", 1, "isdark", "flex", 3, "change"], [1, "flex"], [1, "isdark", "flex", 3, "change", "value"], [1, "w-40", "bg-white", "rounded-base", "h-8.5", "border", "border-white", "ml-6", "flex", "items-center"], ["placeholder", "Select..", 3, "ngModelChange", "selectionChange", "ngModel", "disabled", "ngClass"], [3, "value", "ngClass"], [4, "ngIf"], [1, "w-1/3", "mb-2.5", 3, "ngModelChange", "change", "ngModel", "ngClass", "checked"], [1, "flex", "items-center", "gap-2.5"], ["width", "16", "height", "13", "viewBox", "0 0 16 13", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M2.66927 12.3333H13.3359C13.6896 12.3333 14.0287 12.1929 14.2787 11.9428C14.5288 11.6928 14.6693 11.3536 14.6693 11V4.33333C14.6693 3.97971 14.5288 3.64057 14.2787 3.39052C14.0287 3.14048 13.6896 3 13.3359 3H8.04927C7.82966 2.99886 7.61373 2.9435 7.42067 2.83883C7.22761 2.73415 7.06339 2.58341 6.9426 2.4L6.39594 1.6C6.27515 1.41659 6.11094 1.26585 5.91787 1.16117C5.72481 1.0565 5.50888 1.00114 5.28927 1H2.66927C2.31565 1 1.97651 1.14048 1.72646 1.39052C1.47641 1.64057 1.33594 1.97971 1.33594 2.33333V11C1.33594 11.7333 1.93594 12.3333 2.66927 12.3333Z", "stroke", "white", "stroke-linecap", "round", "stroke-linejoin", "round"], [1, "underline", "font-normal", "cursor-pointer", 3, "click"]], template: function SearchComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "btn", 2);
        \u0275\u0275listener("click", function SearchComponent_Template_btn_click_0_listener() {
          return ctx.mainsearch = true;
        });
        \u0275\u0275element(1, "icon", 3);
        \u0275\u0275elementEnd();
        \u0275\u0275template(2, SearchComponent_div_2_Template, 1, 0, "div", 4)(3, SearchComponent_Conditional_3_Template, 47, 37, "div", 5)(4, SearchComponent_Conditional_4_Template, 4, 1, "div", 6);
      }
      if (rf & 2) {
        \u0275\u0275property("square", true);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.mainsearch && (!ctx.issearched || ctx.showfilter));
        \u0275\u0275advance();
        \u0275\u0275conditional(3, ctx.mainsearch ? 3 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(4, ctx.issearched && ctx.isElasticsearch ? 4 : -1);
      }
    }, dependencies: [
      CommonModule,
      NgClass,
      NgForOf,
      NgIf,
      MatMenuModule,
      MatRadioModule,
      MatRadioGroup,
      MatRadioButton,
      FormsModule,
      DefaultValueAccessor,
      NgControlStatus,
      NgModel,
      IconComponent,
      ButtonComponent,
      InputMaskDirective,
      MatSelectModule,
      MatSelect,
      MatOption,
      MatCheckboxModule,
      MatCheckbox,
      AnnotFilterComponent
    ], styles: ["\n\n.search-input-container.main[_ngcontent-%COMP%] {\n  width: calc(100% - 280px);\n}\n.search-input-container.meta[_ngcontent-%COMP%] {\n  width: calc(100% - 346px);\n}\n.search-input-container.global[_ngcontent-%COMP%] {\n  width: calc(100% - 336px);\n}\n/*# sourceMappingURL=search.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SearchComponent, { className: "SearchComponent", filePath: "src\\app\\shared\\components\\search\\search.component.ts", lineNumber: 35 });
})();

export {
  SearchComponent
};
//# sourceMappingURL=chunk-GRRJDIU4.js.map
