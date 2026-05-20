import {
  ClaimsComponent,
  FILTER_ITEM,
  FILTER_LIST,
  FactcontactfilterComponent,
  FactdetailfilterComponent,
  FacttaskfilterComponent,
  IssuesComponent
} from "./chunk-T3YYYCBS.js";
import {
  DatepickerComponent
} from "./chunk-YLWJRUOP.js";
import {
  SourceCardComponent
} from "./chunk-X7K4VII4.js";
import {
  ContactService
} from "./chunk-5HHWKW4L.js";
import {
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  MatSelect,
  MatSelectModule,
  MatSelectTrigger
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
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  require_moment
} from "./chunk-BXSF7XA6.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  __spreadValues,
  __toESM,
  firstValueFrom,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/interfaces/filter.interface.ts
var FILTER_TYPE = {
  CLAIM: "CLAIM",
  ISSUE: "ISSUE",
  TYPE: "TYPE",
  RELEVANCE: "RELEVANCE",
  IMPACT: "IMPACT",
  STATUS: "STATUS",
  CONTACT: "CONTACT",
  LINK: "LINK",
  DATE: "DATE",
  TASK: "TASK",
  INCOMMING: "INCOMMING",
  OUTGOING: "OUTGOING",
  DESTINATION: "DESTINATION",
  DOCTITLE: "DOCTITLE",
  EXHIBITNO: "EXHIBITNO",
  REF: "REF",
  TITLE: "TITLE",
  DESCRIPTION: "DESCRIPTION",
  URL: "URL",
  ASSIGNEE: "ASSIGNEE",
  CREATOR: "CREATOR"
};
var FILTER_KEYS = {
  CLAIM: "CLAIM",
  ISSUE: "ISSUE",
  RELEVANCE: "RELEVANCE",
  IMPACT: "IMPACT",
  ISNOTE: "ISNOTE",
  ISFACTLINK: "ISFACTLINK",
  ISCOMMENT: "ISCOMMENT",
  DATE: "DATE",
  FILETYPE: "FILETYPE",
  STATUS: "STATUS",
  CREATEDATE: "CREATEDATE",
  CREATOR: "CREATOR",
  CTYPE: "CTYPE",
  CONTACT: "CONTACT",
  CROLE: "CROLE",
  CPARTY: "CPARTY",
  CCOMPANY: "CCOMPANY",
  ISCONTACTNOTE: "ISCONTACTNOTE",
  TASK: "TASK",
  ISTASKDESC: "ISTASKDESC",
  TSHARED: "TSHARED",
  TSTATUS: "TSTATUS",
  TPRIORITY: "TPRIORITY",
  TDATE: "TDATE"
};

// src/app/shared/components/filters/selectedfilter/selectedfilter.component.ts
var _c0 = () => [1, 2, 3, 4, 5, 6, 7, 8];
function SelectedfilterComponent_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 1)(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "icon", 6);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r1 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Filter ", x_r1, "");
  }
}
var SelectedfilterComponent = class _SelectedfilterComponent {
  static {
    this.\u0275fac = function SelectedfilterComponent_Factory(t) {
      return new (t || _SelectedfilterComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SelectedfilterComponent, selectors: [["selectedfilter"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 8, vars: 1, consts: [[1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto"], ["name", "backspace", "type", "extra", 1, "text-sm"]], template: function SelectedfilterComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275repeaterCreate(1, SelectedfilterComponent_For_2_Template, 4, 1, "span", 1, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(3, "div", 2)(4, "span", 3);
        \u0275\u0275element(5, "icon", 4);
        \u0275\u0275text(6, " All Claims selected ");
        \u0275\u0275elementEnd();
        \u0275\u0275element(7, "icon", 5);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c0));
      }
    }, dependencies: [IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SelectedfilterComponent, { className: "SelectedfilterComponent", filePath: "src\\app\\shared\\components\\filters\\selectedfilter\\selectedfilter.component.ts", lineNumber: 11 });
})();

// src/app/shared/components/filters/types/types.component.ts
function TypesComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function TypesComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const types_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(types_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", x_r4.cKey, " ");
  }
}
function TypesComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 14)(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "icon", 16);
    \u0275\u0275listener("click", function TypesComponent_Conditional_11_For_2_Template_icon_click_3_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r8.cKey);
  }
}
function TypesComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "span", 17);
    \u0275\u0275element(2, "icon", 18);
    \u0275\u0275text(3, " All Types selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 19);
    \u0275\u0275listener("click", function TypesComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function TypesComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, TypesComponent_Conditional_11_For_2_Template, 4, 1, "span", 14, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, TypesComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.filetypeList == null ? null : ctx_r6.filetypeList.length) ? 3 : -1);
  }
}
var TypesComponent = class _TypesComponent {
  constructor(common) {
    this.common = common;
    this.filterData = {};
    this.isMessage = true;
    this.filetypeList = [];
    this.OnValueUpdate = new EventEmitter();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.filetypeList = yield this.common.getCode(2);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.filetypeList];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nValue);
    this.OnValueUpdate.emit({ event: "TYPE", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function TypesComponent_Factory(t) {
      return new (t || _TypesComponent)(\u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TypesComponent, selectors: [["types"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["types", ""], [1, "bg-white", "w-full"], ["placeholder", "Types", "multiple", "", "name", "item", "panelClass", "!p-0", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function TypesComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function TypesComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function TypesComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Types");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, TypesComponent_For_7_Template, 6, 2, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6);
        \u0275\u0275listener("click", function TypesComponent_Template_mat_option_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          const types_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(types_r3.close());
        });
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, TypesComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.filetypeList);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TypesComponent, { className: "TypesComponent", filePath: "src\\app\\shared\\components\\filters\\types\\types.component.ts", lineNumber: 17 });
})();

// src/app/shared/components/filters/relavance/relavance.component.ts
function RelavanceComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function RelavanceComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const relevancefltr_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(relevancefltr_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", x_r4.cKey, " ");
  }
}
function RelavanceComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 14)(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "icon", 16);
    \u0275\u0275listener("click", function RelavanceComponent_Conditional_11_For_2_Template_icon_click_3_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r8.cKey);
  }
}
function RelavanceComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "span", 17);
    \u0275\u0275element(2, "icon", 18);
    \u0275\u0275text(3, " All Relevance selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 19);
    \u0275\u0275listener("click", function RelavanceComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function RelavanceComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, RelavanceComponent_Conditional_11_For_2_Template, 4, 1, "span", 14, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, RelavanceComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.relevance == null ? null : ctx_r6.relevance.length) ? 3 : -1);
  }
}
var RelavanceComponent = class _RelavanceComponent {
  constructor(common) {
    this.common = common;
    this.filterData = {};
    this.isMessage = true;
    this.relevance = [];
    this.OnValueUpdate = new EventEmitter();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.relevance = yield this.common.getCode(4);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.relevance];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nValue);
    this.OnValueUpdate.emit({ event: "RELAVANCE", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function RelavanceComponent_Factory(t) {
      return new (t || _RelavanceComponent)(\u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RelavanceComponent, selectors: [["relavance"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["relevancefltr", ""], [1, "bg-white", "w-full"], ["placeholder", "Relevance", "multiple", "", "name", "item", "panelClass", "!p-0", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function RelavanceComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function RelavanceComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function RelavanceComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Relevance");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, RelavanceComponent_For_7_Template, 6, 2, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6);
        \u0275\u0275listener("click", function RelavanceComponent_Template_mat_option_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          const relevancefltr_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(relevancefltr_r3.close());
        });
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, RelavanceComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.relevance);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RelavanceComponent, { className: "RelavanceComponent", filePath: "src\\app\\shared\\components\\filters\\relavance\\relavance.component.ts", lineNumber: 17 });
})();

// src/app/shared/components/filters/impact/impact.component.ts
function ImpactComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function ImpactComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const impactfltr_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(impactfltr_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 14);
    \u0275\u0275element(6, "img", 15);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(6);
    \u0275\u0275property("src", "../../../../../assets/icons/impact/" + x_r4.nValue + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r4.cKey, " ");
  }
}
function ImpactComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 16);
    \u0275\u0275element(1, "img", 15);
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 18);
    \u0275\u0275listener("click", function ImpactComponent_Conditional_11_For_2_Template_icon_click_4_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("src", "../../../../../assets/icons/impact/" + x_r8.nValue + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r8.cKey, "");
  }
}
function ImpactComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17)(1, "span", 19);
    \u0275\u0275element(2, "icon", 20);
    \u0275\u0275text(3, " All Impact selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 21);
    \u0275\u0275listener("click", function ImpactComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function ImpactComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, ImpactComponent_Conditional_11_For_2_Template, 5, 2, "span", 16, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, ImpactComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 17);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.impactlist == null ? null : ctx_r6.impactlist.length) ? 3 : -1);
  }
}
var ImpactComponent = class _ImpactComponent {
  constructor(common) {
    this.common = common;
    this.filterData = {};
    this.isMessage = true;
    this.impactlist = [];
    this.OnValueUpdate = new EventEmitter();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.impactlist = yield this.common.getCode(5);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.impactlist];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nValue);
    this.OnValueUpdate.emit({ event: "IMPACT", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function ImpactComponent_Factory(t) {
      return new (t || _ImpactComponent)(\u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ImpactComponent, selectors: [["impact"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["impactfltr", ""], [1, "bg-white", "w-full"], ["placeholder", "Impact", "multiple", "", "name", "item", "panelClass", "!p-0", 1, "", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "flex", "gap-2", "items-center"], ["alt", "", 3, "src"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function ImpactComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function ImpactComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function ImpactComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Impact");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, ImpactComponent_For_7_Template, 8, 3, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6);
        \u0275\u0275listener("click", function ImpactComponent_Template_mat_option_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          const impactfltr_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(impactfltr_r3.close());
        });
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, ImpactComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.impactlist);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ImpactComponent, { className: "ImpactComponent", filePath: "src\\app\\shared\\components\\filters\\impact\\impact.component.ts", lineNumber: 17 });
})();

// src/app/shared/components/filters/status/status.component.ts
function StatusComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function StatusComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const statusfltr_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(statusfltr_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", x_r4.cKey, " ");
  }
}
function StatusComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 14)(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "icon", 16);
    \u0275\u0275listener("click", function StatusComponent_Conditional_11_For_2_Template_icon_click_3_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r8.cKey, "");
  }
}
function StatusComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "span", 17);
    \u0275\u0275element(2, "icon", 18);
    \u0275\u0275text(3, " All Status selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 19);
    \u0275\u0275listener("click", function StatusComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function StatusComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, StatusComponent_Conditional_11_For_2_Template, 4, 1, "span", 14, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, StatusComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.statuslist == null ? null : ctx_r6.statuslist.length) ? 3 : -1);
  }
}
var StatusComponent = class _StatusComponent {
  constructor(common) {
    this.common = common;
    this.filterData = {};
    this.isMessage = true;
    this.statuslist = [];
    this.OnValueUpdate = new EventEmitter();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.statuslist = yield this.common.getCode(3);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.statuslist];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nValue);
    this.OnValueUpdate.emit({ event: "STATUS", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function StatusComponent_Factory(t) {
      return new (t || _StatusComponent)(\u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _StatusComponent, selectors: [["status"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["statusfltr", ""], [1, "bg-white", "w-full"], ["placeholder", "Status", "multiple", "", "name", "item", "panelClass", "!p-0", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function StatusComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function StatusComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function StatusComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Status");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, StatusComponent_For_7_Template, 6, 2, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6);
        \u0275\u0275listener("click", function StatusComponent_Template_mat_option_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          const statusfltr_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(statusfltr_r3.close());
        });
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, StatusComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.statuslist);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(StatusComponent, { className: "StatusComponent", filePath: "src\\app\\shared\\components\\filters\\status\\status.component.ts", lineNumber: 17 });
})();

// src/app/shared/components/filters/link/link.component.ts
function LinkComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function LinkComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const linkfltr_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(linkfltr_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", x_r4.cKey, " ");
  }
}
function LinkComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 14)(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "icon", 16);
    \u0275\u0275listener("click", function LinkComponent_Conditional_11_For_2_Template_icon_click_3_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r8.cKey, "");
  }
}
function LinkComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "span", 17);
    \u0275\u0275element(2, "icon", 18);
    \u0275\u0275text(3, " All Link selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 19);
    \u0275\u0275listener("click", function LinkComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function LinkComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, LinkComponent_Conditional_11_For_2_Template, 4, 1, "span", 14, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, LinkComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.linktypeList == null ? null : ctx_r6.linktypeList.length) ? 3 : -1);
  }
}
var LinkComponent = class _LinkComponent {
  constructor(common) {
    this.common = common;
    this.filterData = {};
    this.isMessage = true;
    this.linktypeList = [{ cKey: "Incomming", cValue: "I" }, { cKey: "Outgoing", cValue: "O" }];
    this.OnValueUpdate = new EventEmitter();
  }
  ngOnInit() {
    return __async(this, null, function* () {
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.linktypeList];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.cValue);
    this.OnValueUpdate.emit({ event: "CONTACT", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function LinkComponent_Factory(t) {
      return new (t || _LinkComponent)(\u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LinkComponent, selectors: [["links"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["linkfltr", ""], [1, "bg-white", "w-full"], ["placeholder", "Link", "multiple", "", "name", "item", "panelClass", "!p-0", 1, "", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function LinkComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function LinkComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function LinkComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Link");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, LinkComponent_For_7_Template, 6, 2, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6);
        \u0275\u0275listener("click", function LinkComponent_Template_mat_option_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          const linkfltr_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(linkfltr_r3.close());
        });
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, LinkComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.linktypeList);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LinkComponent, { className: "LinkComponent", filePath: "src\\app\\shared\\components\\filters\\link\\link.component.ts", lineNumber: 16 });
})();

// src/app/shared/components/filters/date/date.component.ts
var import_moment = __toESM(require_moment());
function DateComponent_For_6_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 6);
    \u0275\u0275listener("click", function DateComponent_For_6_Conditional_0_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext(2);
      const datefltr_r3 = \u0275\u0275reference(1);
      return \u0275\u0275resetView(datefltr_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 7)(2, "span", 8);
    \u0275\u0275element(3, "icon", 9)(4, "icon", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", x_r4.cKey, " ");
  }
}
function DateComponent_For_6_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 5)(1, "div", 11);
    \u0275\u0275listener("click", function DateComponent_For_6_Conditional_1_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r5 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r5.onOptionClick($event));
    });
    \u0275\u0275elementStart(2, "span", 8);
    \u0275\u0275element(3, "icon", 9)(4, "icon", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div")(6, "span");
    \u0275\u0275text(7, "Custom ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 12)(9, "datepicker", 13);
    \u0275\u0275listener("dateChange", function DateComponent_For_6_Conditional_1_Template_datepicker_dateChange_9_listener($event) {
      \u0275\u0275restoreView(_r5);
      const x_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.OnDateChange($event, x_r4, "dStartdt"));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "datepicker", 13);
    \u0275\u0275listener("dateChange", function DateComponent_For_6_Conditional_1_Template_datepicker_dateChange_10_listener($event) {
      \u0275\u0275restoreView(_r5);
      const x_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.OnDateChange($event, x_r4, "dEnddt"));
    });
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("value", x_r4);
  }
}
function DateComponent_For_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, DateComponent_For_6_Conditional_0_Template, 6, 2, "mat-option", 5)(1, DateComponent_For_6_Conditional_1_Template, 11, 1);
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275conditional(0, x_r4.cKey != "Custom" ? 0 : 1);
  }
}
function DateComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "span", 14)(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 15);
    \u0275\u0275listener("click", function DateComponent_Conditional_7_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.remove());
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r5.selected.cKey, "");
  }
}
var DateComponent = class _DateComponent {
  constructor(common, cf) {
    this.common = common;
    this.cf = cf;
    this.filterData = {};
    this.isMessage = true;
    this.datelist = [
      {
        cKey: "Today",
        dStartdt: this.cf.getDateFormate((0, import_moment.default)().startOf("day").toDate(), "YYYY-MM-DDTHH:mm:ssZ"),
        dEnddt: this.cf.getDateFormate((0, import_moment.default)().endOf("day").toDate(), "YYYY-MM-DDTHH:mm:ssZ")
      },
      {
        cKey: "One week",
        dStartdt: this.cf.getDateFormate((0, import_moment.default)().subtract(1, "week").startOf("day").toDate(), "YYYY-MM-DDTHH:mm:ssZ"),
        dEnddt: this.cf.getDateFormate((0, import_moment.default)().endOf("day").toDate(), "YYYY-MM-DDTHH:mm:ssZ")
      },
      {
        cKey: "One month",
        dStartdt: this.cf.getDateFormate((0, import_moment.default)().subtract(1, "month").startOf("day").toDate(), "YYYY-MM-DDTHH:mm:ssZ"),
        dEnddt: this.cf.getDateFormate((0, import_moment.default)().endOf("day").toDate(), "YYYY-MM-DDTHH:mm:ssZ")
      },
      {
        cKey: "Custom",
        dStartdt: this.cf.getDateFormate((0, import_moment.default)().subtract(1, "month").startOf("day").toDate(), "YYYY-MM-DDTHH:mm:ssZ"),
        dEnddt: this.cf.getDateFormate((0, import_moment.default)().endOf("day").toDate(), "YYYY-MM-DDTHH:mm:ssZ")
      }
    ];
    this.OnValueUpdate = new EventEmitter();
  }
  OnSelect(e) {
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = { startDt: this.selected?.dStartdt, endDt: this.selected?.dEnddt };
    this.OnValueUpdate.emit({ event: "DATE", data: "" });
  }
  remove() {
    this.selected = null;
    this.updateValue();
  }
  OnDateChange(e, x, column) {
    x[column] = (0, import_moment.default)(new Date(e)).format("YYYY-MM-DDTHH:mm:ssZ");
    this.updateValue();
  }
  onOptionClick(event) {
    event.stopPropagation();
    this.selected = this.datelist.find((a) => a.cKey == "Custom");
  }
  static {
    this.\u0275fac = function DateComponent_Factory(t) {
      return new (t || _DateComponent)(\u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(CommonfunctionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DateComponent, selectors: [["date"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 8, vars: 2, consts: [["datefltr", ""], ["placeholder", "Date", "name", "item", "panelClass", "!p-0", 1, "bg-white", "rounded-base", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", 3, "click"], [1, "hidden", "text-base", "group-[&.mdc-list-item--selected]:flex", "gap-2", "pe-2"], [3, "dateChange"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"]], template: function DateComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-select", 1, 0);
        \u0275\u0275twoWayListener("ngModelChange", function DateComponent_Template_mat_select_ngModelChange_0_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function DateComponent_Template_mat_select_selectionChange_0_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(2, "mat-select-trigger", 2)(3, "span", 3);
        \u0275\u0275text(4, "Date");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(5, DateComponent_For_6_Template, 2, 1, null, null, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd();
        \u0275\u0275template(7, DateComponent_Conditional_7_Template, 5, 1, "div", 4);
      }
      if (rf & 2) {
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.datelist);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(7, ctx.selected ? 7 : -1);
      }
    }, dependencies: [MatSelectModule, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent, DatepickerComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DateComponent, { className: "DateComponent", filePath: "src\\app\\shared\\components\\filters\\date\\date.component.ts", lineNumber: 19 });
})();

// src/app/shared/components/filters/task/task.component.ts
var _c02 = (a0) => ({ "!hidden": a0 });
function TaskComponent_For_7_For_5_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 11)(1, "div", 12)(2, "span", 13);
    \u0275\u0275element(3, "icon", 14)(4, "icon", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div")(6, "span");
    \u0275\u0275text(7, "Custom");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 16)(9, "input", 17);
    \u0275\u0275twoWayListener("ngModelChange", function TaskComponent_For_7_For_5_Conditional_0_Template_input_ngModelChange_9_listener($event) {
      \u0275\u0275restoreView(_r4);
      const y_r5 = \u0275\u0275nextContext().$implicit;
      \u0275\u0275twoWayBindingSet(y_r5.cValue, $event) || (y_r5.cValue = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "btn", 18);
    \u0275\u0275listener("click", function TaskComponent_For_7_For_5_Conditional_0_Template_btn_click_10_listener($event) {
      \u0275\u0275restoreView(_r4);
      const y_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r5 = \u0275\u0275nextContext(2);
      ctx_r5.customDay(y_r5);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275text(11, " Done");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const y_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("value", y_r5);
    \u0275\u0275advance(9);
    \u0275\u0275twoWayProperty("ngModel", y_r5.cValue);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !y_r5.cValue || y_r5.cValue == "");
  }
}
function TaskComponent_For_7_For_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 19);
    \u0275\u0275listener("click", function TaskComponent_For_7_For_5_Conditional_1_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r7);
      \u0275\u0275nextContext(3);
      const taskfltr_r8 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(taskfltr_r8.close());
    });
    \u0275\u0275elementStart(1, "div", 12)(2, "span", 13);
    \u0275\u0275element(3, "icon", 14)(4, "icon", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "span", 20);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const y_r5 = \u0275\u0275nextContext().$implicit;
    const x_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c02, !(x_r3 == null ? null : x_r3.isopen)))("value", y_r5);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", y_r5.cKey, " ");
  }
}
function TaskComponent_For_7_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TaskComponent_For_7_For_5_Conditional_0_Template, 12, 3, "mat-option", 11)(1, TaskComponent_For_7_For_5_Conditional_1_Template, 7, 5);
  }
  if (rf & 2) {
    const y_r5 = ctx.$implicit;
    const x_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275conditional(0, x_r3.cCategory == "Timeline" && y_r5.cKey == "Custom" && x_r3.isopen ? 0 : 1);
  }
}
function TaskComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-optgroup", 5)(1, "div", 9);
    \u0275\u0275listener("click", function TaskComponent_For_7_Template_div_click_1_listener() {
      const x_r3 = \u0275\u0275restoreView(_r2).$implicit;
      return \u0275\u0275resetView(x_r3.isopen = !x_r3.isopen);
    });
    \u0275\u0275text(2);
    \u0275\u0275element(3, "icon", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(4, TaskComponent_For_7_For_5_Template, 2, 1, null, null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r3.cCategory, " ");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(x_r3.sublist);
  }
}
function TaskComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 21)(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "icon", 22);
    \u0275\u0275listener("click", function TaskComponent_Conditional_11_For_2_Template_icon_click_3_listener() {
      const $index_r10 = \u0275\u0275restoreView(_r9).$index;
      const ctx_r5 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r5.remove($index_r10));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r11 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r11.cKey, "");
  }
}
function TaskComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, TaskComponent_Conditional_11_For_2_Template, 4, 1, "span", 21, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r5.selected);
  }
}
var TaskComponent = class _TaskComponent {
  constructor(common) {
    this.common = common;
    this.selected = [];
    this.filterData = {};
    this.isMessage = true;
    this.gropuList = [
      {
        cCategory: "Priority",
        sublist: []
      },
      {
        cCategory: "Progress",
        sublist: [
          {
            cKey: "Completed",
            cValue: "C"
          },
          {
            cKey: "In progress",
            cValue: "P"
          },
          {
            cKey: "Not yet started",
            cValue: "N"
          }
        ]
      },
      {
        cCategory: "Timeline",
        sublist: [
          {
            cKey: "One day",
            cValue: "1"
          },
          {
            cKey: "Two days",
            cValue: "2"
          },
          {
            cKey: "Custom",
            cValue: "3"
          }
        ]
      }
    ];
    this.OnValueUpdate = new EventEmitter();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      const priority = yield this.common.getCode(17);
      this.gropuList[0]["sublist"] = priority;
    });
  }
  customDay(y) {
    debugger;
    this.selected = this.selected && this.selected.length ? this.selected : [];
    let ind = this.selected.findIndex((e) => e.cKey == y.cKey);
    if (ind >= -1) {
      if (y.cValue && y.cValue != "") {
        this.selected.push(y);
      }
    } else {
      this.selected[ind].cValue = y.cValue;
      if (!y.cValue || y.cValue == "") {
        this.selected.splice(ind, 1);
      }
    }
    this.updateValue();
  }
  OnSelect(e) {
    debugger;
    if (e.value.includes(0)) {
      this.selected = [...this.gropuList.flatMap((a) => a.sublist)];
    }
    this.updateValue();
  }
  updateValue() {
    let selectedValues = [];
    if (this.selected.length) {
      selectedValues = this.gropuList.map((a) => {
        return { key: a.cCategory, value: a.sublist.filter((e) => this.selected.some((x) => x.cKey === e.cKey)) };
      });
    }
    this.filterData.value = selectedValues.reduce((acc, curr) => {
      const key = curr.key === "Priority" ? "jPriority" : curr.key === "Progress" ? "jProgress" : curr.key;
      acc[key] = curr.value.map((v) => v.nValue || v.cValue);
      return acc;
    }, {});
    this.OnValueUpdate.emit({ event: "DATE", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function TaskComponent_Factory(t) {
      return new (t || _TaskComponent)(\u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TaskComponent, selectors: [["task"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["taskfltr", ""], [1, "bg-white", "w-full"], ["placeholder", "Tasks", "multiple", "", "name", "item", "panelClass", "!p-0", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "issdropgrup"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "flex", "gap-2.5", "text-xs", "font-semibold", "items-center", "cursor-pointer", 3, "click"], ["name", "chvy", 1, "-rotate-90"], ["disabled", "", 1, "nocheck", "group", "my-0.5", "[&>.mdc-list-item__primary-text]:!opacity-100", "pointer-events-auto", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "flex", "text-base", "gap-2", "pe-2", 2, "pointer-events", "all"], [1, "w-12", 3, "ngModelChange", "ngModel"], [3, "click", "disabled"], [1, "ps-3", "nocheck", "group", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "ngClass", "value"], [1, "h-3", "w-1", "rounded-2xl", "block"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"]], template: function TaskComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function TaskComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function TaskComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Tasks");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, TaskComponent_For_7_Template, 6, 1, "mat-optgroup", 5, \u0275\u0275repeaterTrackByIdentity);
        \u0275\u0275elementStart(8, "mat-option", 6);
        \u0275\u0275listener("click", function TaskComponent_Template_mat_option_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          const taskfltr_r8 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(taskfltr_r8.close());
        });
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, TaskComponent_Conditional_11_Template, 3, 0, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.gropuList);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, MatOptgroup, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, IconComponent, CommonModule, NgClass, ButtonComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TaskComponent, { className: "TaskComponent", filePath: "src\\app\\shared\\components\\filters\\task\\task.component.ts", lineNumber: 18 });
})();

// src/app/shared/components/filters/contacts/contacts.component.ts
var _c03 = (a0, a1) => ({ cFname: a0, cLname: a1, cProfile: "" });
function ContactsComponent_For_7_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r4.cRole);
  }
}
function ContactsComponent_For_7_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r4.cCompany);
  }
}
function ContactsComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function ContactsComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const contact_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(contact_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 14);
    \u0275\u0275element(6, "avtr", 15);
    \u0275\u0275elementStart(7, "div", 16)(8, "span", 17);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, ContactsComponent_For_7_Conditional_10_Template, 2, 1, "span", 18)(11, ContactsComponent_For_7_Conditional_11_Template, 2, 1, "span", 18);
    \u0275\u0275elementStart(12, "span", 19);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(6);
    \u0275\u0275property("matTooltip", x_r4.cFname + x_r4.cLname)("detail", \u0275\u0275pureFunction2(8, _c03, x_r4.cFname, x_r4.cLname));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", x_r4.cFname, " ", x_r4.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(10, x_r4.cRole ? 10 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(11, x_r4.cCompany ? 11 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r4.cEmail);
  }
}
function ContactsComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 20)(1, "div", 22);
    \u0275\u0275element(2, "avtr", 23);
    \u0275\u0275elementStart(3, "div", 16)(4, "span", 17);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(6, "icon", 24);
    \u0275\u0275listener("click", function ContactsComponent_Conditional_11_For_2_Template_icon_click_6_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", x_r8.cFname + x_r8.cLname)("detail", \u0275\u0275pureFunction2(4, _c03, x_r8.cFname, x_r8.cLname));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", x_r8.cFname, " ", x_r8.cLname, " ");
  }
}
function ContactsComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 21)(1, "span", 25);
    \u0275\u0275element(2, "icon", 26);
    \u0275\u0275text(3, " All Contacts selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 27);
    \u0275\u0275listener("click", function ContactsComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function ContactsComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, ContactsComponent_Conditional_11_For_2_Template, 7, 7, "span", 20, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, ContactsComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 21);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.contactList == null ? null : ctx_r6.contactList.length) ? 3 : -1);
  }
}
var ContactsComponent = class _ContactsComponent {
  constructor(contactService) {
    this.contactService = contactService;
    this.filterData = {};
    this.isMessage = true;
    this.contactList = [];
    this.OnValueUpdate = new EventEmitter();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.contactList = yield this.contactService.getContactList(this.nCaseid);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.contactList];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nContactid);
    this.OnValueUpdate.emit({ event: "CONTACT", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function ContactsComponent_Factory(t) {
      return new (t || _ContactsComponent)(\u0275\u0275directiveInject(ContactService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContactsComponent, selectors: [["contacts"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["contact", ""], [1, "bg-white", "w-full"], ["placeholder", "Contacts", "multiple", "", "name", "item", "panelClass", "!p-0", 1, "", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "flex", "items-start", "gap-2", "w-full", "px-5", "py-2.5", "rounded-base"], ["size", "lg", 3, "matTooltip", "detail"], [1, "gap-1", "flex", "flex-col"], [1, "text-xs", "font-semibold"], [1, "text-xxs", "leading-none"], [1, "underline", "text-xxs", "leading-none", "truncate"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], [1, "flex", "items-center", "gap-2", "w-fit", "rounded-base"], ["size", "sm", 3, "matTooltip", "detail"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function ContactsComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function ContactsComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function ContactsComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Contacts");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, ContactsComponent_For_7_Template, 14, 11, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6)(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, ContactsComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.contactList);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent, AvatarComponent, MatTooltipModule, MatTooltip] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContactsComponent, { className: "ContactsComponent", filePath: "src\\app\\shared\\components\\filters\\contacts\\contacts.component.ts", lineNumber: 19 });
})();

// src/app/userpanel/services/navigate/navigate.service.ts
var NavigateService = class _NavigateService {
  constructor(http) {
    this.http = http;
  }
  checkNavData(nBundledetailid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/checknavigationdata`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getFactlist(nBundledetailid, cSorttype, cSortby, nPageNumber, jFilter, cType) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      if (cType) {
        params = params.set("cFType", cType);
      }
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/factlist`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getCompanylist(nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/factcompanylist`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getCompanyFactlist(nCompanyid, nBundledetailid, jFilter, cSortby) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("nCompanyid", nCompanyid);
      params = params.set("cSortby", cSortby);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/factbycompany`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getFactlinklist(nBundledetailid, cSorttype, cSortby, nPageNumber, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/factlinklist`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getDocLinkLists(nBundledetailid, cSorttype, cSortby, nPageNumber, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/doclinks`, { params }));
        return res[0];
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getWebLinkLists(nBundledetailid, cSorttype, cSortby, nPageNumber, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/weblinks`, { params }));
        return res[0];
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFactTaskLists(nBundledetailid, cSorttype, cSortby, nPageNumber, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/facttasks`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFileTaskLists(nBundledetailid, cSorttype, cSortby, nPageNumber, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/filetasks`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getIncommingFilters(nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/filter/incomming`, { params }));
        return res[0];
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getOutgoingFilters(nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/filter/outgoing`, { params }));
        return res[0];
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getDestinationFilters(nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/filter/destination`, { params }));
        return res[0];
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getDocInfoFilters(nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/filter/docinfo`, { params }));
        return res[0];
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getWebFilters(nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/filter/webinfo`, { params }));
        return res[0];
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getSharedUsers(nId, cType) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nId", nId);
      params = params.set("cType", cType);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/sharedusers`, { params }));
        return res[0];
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getAll(nBundledetailid, cSorttype, cSortby, nPageNumber, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/all`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getAllLinks(nBundledetailid, cSorttype, cSortby, nPageNumber, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nBundledetailid", nBundledetailid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/navigation/alllinks/list`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function NavigateService_Factory(t) {
      return new (t || _NavigateService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _NavigateService, factory: _NavigateService.\u0275fac, providedIn: "root" });
  }
};

// src/app/shared/components/filters/linktype/linktype.component.ts
function LinktypeComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function LinktypeComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const linktype_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(linktype_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 14);
    \u0275\u0275element(6, "source-card", 15);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(6);
    \u0275\u0275property("truncate", false)("type", "T")("detail", x_r4)("heading", true);
  }
}
function LinktypeComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 16)(1, "div", 14);
    \u0275\u0275element(2, "source-card", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "icon", 18);
    \u0275\u0275listener("click", function LinktypeComponent_Conditional_11_For_2_Template_icon_click_3_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("truncate", false)("type", "T")("detail", x_r8)("heading", true);
  }
}
function LinktypeComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17)(1, "span", 19);
    \u0275\u0275element(2, "icon", 20);
    \u0275\u0275text(3, " All Links selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 21);
    \u0275\u0275listener("click", function LinktypeComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function LinktypeComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, LinktypeComponent_Conditional_11_For_2_Template, 4, 4, "span", 16, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, LinktypeComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 17);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.filelinks == null ? null : ctx_r6.filelinks.length) ? 3 : -1);
  }
}
var LinktypeComponent = class _LinktypeComponent {
  constructor(navService, cdr) {
    this.navService = navService;
    this.cdr = cdr;
    this.filterData = {};
    this.OnValueUpdate = new EventEmitter();
    this.docInfo = {};
    this.isMessage = true;
    this.filelinks = [];
  }
  ngOnInit() {
    return __async(this, null, function* () {
      if (this.type == "I") {
        this.filelinks = yield this.navService.getIncommingFilters(this.docInfo.nBundledetailid);
      } else {
        this.filelinks = yield this.navService.getOutgoingFilters(this.docInfo.nBundledetailid);
      }
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.filelinks];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nDMLids);
    this.OnValueUpdate.emit({ event: this.type == "I" ? "INCOMMING" : "OUTGOING", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function LinktypeComponent_Factory(t) {
      return new (t || _LinktypeComponent)(\u0275\u0275directiveInject(NavigateService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LinktypeComponent, selectors: [["linktype"]], inputs: { filterData: "filterData", docInfo: "docInfo", nCaseid: "nCaseid", type: "type" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 5, consts: [["linktype", ""], [1, "bg-white", "w-full"], ["multiple", "", "name", "item", "panelClass", "!p-0", 1, "", 3, "ngModelChange", "selectionChange", "placeholder", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "flex", "items-start", "gap-2", "w-full", "px-5", "py-2.5", "rounded-base"], ["gap", "S", 3, "truncate", "type", "detail", "heading"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function LinktypeComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function LinktypeComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function LinktypeComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5);
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, LinktypeComponent_For_7_Template, 7, 5, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6);
        \u0275\u0275listener("click", function LinktypeComponent_Template_mat_option_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          const linktype_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(linktype_r3.close());
        });
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, LinktypeComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("placeholder", ctx.type == "I" ? "Incomming" : "Outgoing");
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(ctx.type == "I" ? "Incomming" : "Outgoing");
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.filelinks);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent, MatTooltipModule, SourceCardComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LinktypeComponent, { className: "LinktypeComponent", filePath: "src\\app\\shared\\components\\filters\\linktype\\linktype.component.ts", lineNumber: 19 });
})();

// src/app/shared/components/filters/destination/destination.component.ts
function DestinationComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function DestinationComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const dest_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(dest_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 14);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", x_r4.cFilename, " ");
  }
}
function DestinationComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 15);
    \u0275\u0275element(1, "img", 17);
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 18);
    \u0275\u0275listener("click", function DestinationComponent_Conditional_11_For_2_Template_icon_click_4_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("src", "../../../../../assets/icons/impact/" + x_r8.nValue + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r8.cFilename, "");
  }
}
function DestinationComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 16)(1, "span", 19);
    \u0275\u0275element(2, "icon", 20);
    \u0275\u0275text(3, " All Impact selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 21);
    \u0275\u0275listener("click", function DestinationComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function DestinationComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, DestinationComponent_Conditional_11_For_2_Template, 5, 2, "span", 15, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, DestinationComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 16);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.filelinks == null ? null : ctx_r6.filelinks.length) ? 3 : -1);
  }
}
var DestinationComponent = class _DestinationComponent {
  constructor(navService, cdr) {
    this.navService = navService;
    this.cdr = cdr;
    this.filterData = {};
    this.OnValueUpdate = new EventEmitter();
    this.docInfo = {};
    this.isMessage = true;
    this.filelinks = [];
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.filelinks = yield this.navService.getDestinationFilters(this.docInfo.nBundledetailid);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.filelinks];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nDMLids);
    this.OnValueUpdate.emit({ event: "DESTINATION", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function DestinationComponent_Factory(t) {
      return new (t || _DestinationComponent)(\u0275\u0275directiveInject(NavigateService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DestinationComponent, selectors: [["destination"]], inputs: { filterData: "filterData", docInfo: "docInfo", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["dest", ""], [1, "bg-white", "w-full"], ["placeholder", "Destination", "multiple", "", "name", "item", "panelClass", "!p-0", 1, "", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "flex", "gap-2", "items-center"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], ["alt", "", 3, "src"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function DestinationComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function DestinationComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function DestinationComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Destination");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, DestinationComponent_For_7_Template, 7, 2, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6);
        \u0275\u0275listener("click", function DestinationComponent_Template_mat_option_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          const dest_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(dest_r3.close());
        });
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, DestinationComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.filelinks);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [CommonModule, MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent, MatTooltipModule] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DestinationComponent, { className: "DestinationComponent", filePath: "src\\app\\shared\\components\\filters\\destination\\destination.component.ts", lineNumber: 19 });
})();

// src/app/shared/components/filters/fileinfo/fileinfo.component.ts
function FileinfoComponent_For_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 7);
    \u0275\u0275listener("click", function FileinfoComponent_For_4_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const fileinfo_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(fileinfo_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 8)(2, "span", 9);
    \u0275\u0275element(3, "icon", 10)(4, "icon", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 12);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", ctx_r4.type == "DOCTITLE" ? x_r4.cFilename : ctx_r4.type == "EXHIBITNO" ? x_r4.cExhibitno : x_r4.cTab, " ");
  }
}
function FileinfoComponent_Conditional_8_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 13);
    \u0275\u0275element(1, "img", 15);
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 16);
    \u0275\u0275listener("click", function FileinfoComponent_Conditional_8_For_2_Template_icon_click_4_listener() {
      const $index_r7 = \u0275\u0275restoreView(_r6).$index;
      const ctx_r4 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r4.remove($index_r7));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    const ctx_r4 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("src", "../../../../../assets/icons/impact/" + x_r8.nValue + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r4.type == "DOCTITLE" ? x_r8.cFilename : ctx_r4.type == "EXHIBITNO" ? x_r8.cExhibitno : x_r8.cTab, " ");
  }
}
function FileinfoComponent_Conditional_8_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14)(1, "span", 17);
    \u0275\u0275element(2, "icon", 18);
    \u0275\u0275text(3, " All Impact selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 19);
    \u0275\u0275listener("click", function FileinfoComponent_Conditional_8_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r4 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r4.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function FileinfoComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 6);
    \u0275\u0275repeaterCreate(1, FileinfoComponent_Conditional_8_For_2_Template, 5, 2, "span", 13, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, FileinfoComponent_Conditional_8_Conditional_3_Template, 5, 0, "div", 14);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r4.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r4.isMessage && (ctx_r4.selected == null ? null : ctx_r4.selected.length) && (ctx_r4.selected == null ? null : ctx_r4.selected.length) == (ctx_r4.filelinks == null ? null : ctx_r4.filelinks.length) ? 3 : -1);
  }
}
var FileinfoComponent = class _FileinfoComponent {
  constructor(navService, cdr) {
    this.navService = navService;
    this.cdr = cdr;
    this.filterData = {};
    this.OnValueUpdate = new EventEmitter();
    this.docInfo = {};
    this.isMessage = true;
    this.filelinks = [];
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.filelinks = yield this.navService.getDocInfoFilters(this.docInfo.nBundledetailid);
      this.filelinks = this.filelinks.filter((a) => a[this.type == "DOCTITLE" ? "cFilename" : this.type == "EXHIBITNO" ? "cExhibitno" : "cTab"]);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.filelinks];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nBundledetailid);
    this.OnValueUpdate.emit({ event: "DOCL", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function FileinfoComponent_Factory(t) {
      return new (t || _FileinfoComponent)(\u0275\u0275directiveInject(NavigateService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FileinfoComponent, selectors: [["fileinfo"]], inputs: { filterData: "filterData", docInfo: "docInfo", nCaseid: "nCaseid", type: "type" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 9, vars: 4, consts: [["fileinfo", ""], [1, "bg-white", "w-full"], ["multiple", "", "name", "item", "panelClass", "!p-0", 1, "", 3, "ngModelChange", "selectionChange", "placeholder", "ngModel"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "flex", "gap-2", "items-center"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], ["alt", "", 3, "src"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function FileinfoComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function FileinfoComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function FileinfoComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275repeaterCreate(3, FileinfoComponent_For_4_Template, 7, 2, "mat-option", 3, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(5, "mat-option", 4);
        \u0275\u0275listener("click", function FileinfoComponent_Template_mat_option_click_5_listener() {
          \u0275\u0275restoreView(_r1);
          const fileinfo_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(fileinfo_r3.close());
        });
        \u0275\u0275elementStart(6, "div", 5);
        \u0275\u0275text(7, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(8, FileinfoComponent_Conditional_8_Template, 4, 1, "div", 6);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("placeholder", ctx.type == "DOCTITLE" ? "Doc title" : ctx.type == "EXHIBITNO" ? "Exhibit no" : "Ref");
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.filelinks);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(8, (ctx.selected == null ? null : ctx.selected.length) ? 8 : -1);
      }
    }, dependencies: [CommonModule, MatSelectModule, MatFormField, MatSelect, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent, MatTooltipModule] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FileinfoComponent, { className: "FileinfoComponent", filePath: "src\\app\\shared\\components\\filters\\fileinfo\\fileinfo.component.ts", lineNumber: 19 });
})();

// src/app/shared/components/filters/webfilter/webfilter.component.ts
function WebfilterComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function WebfilterComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const webfltr_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(webfltr_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 14);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", ctx_r4.type == "TITLE" ? x_r4.cTitle : ctx_r4.type == "DESCRIPTION" ? x_r4.cNote : x_r4.cUrl, " ");
  }
}
function WebfilterComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 15);
    \u0275\u0275element(1, "img", 17);
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 18);
    \u0275\u0275listener("click", function WebfilterComponent_Conditional_11_For_2_Template_icon_click_4_listener() {
      const $index_r7 = \u0275\u0275restoreView(_r6).$index;
      const ctx_r4 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r4.remove($index_r7));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    const ctx_r4 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("src", "../../../../../assets/icons/impact/" + x_r8.nValue + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r4.type == "TITLE" ? x_r8.cTitle : ctx_r4.type == "DESCRIPTION" ? x_r8.cNote : x_r8.cUrl, " ");
  }
}
function WebfilterComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 16)(1, "span", 19);
    \u0275\u0275element(2, "icon", 20);
    \u0275\u0275text(3, " All Impact selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 21);
    \u0275\u0275listener("click", function WebfilterComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r4 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r4.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function WebfilterComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, WebfilterComponent_Conditional_11_For_2_Template, 5, 2, "span", 15, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, WebfilterComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 16);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r4.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r4.isMessage && (ctx_r4.selected == null ? null : ctx_r4.selected.length) && (ctx_r4.selected == null ? null : ctx_r4.selected.length) == (ctx_r4.weblinks == null ? null : ctx_r4.weblinks.length) ? 3 : -1);
  }
}
var WebfilterComponent = class _WebfilterComponent {
  constructor(navService, cdr) {
    this.navService = navService;
    this.cdr = cdr;
    this.filterData = {};
    this.OnValueUpdate = new EventEmitter();
    this.docInfo = {};
    this.isMessage = true;
    this.weblinks = [];
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.weblinks = yield this.navService.getWebFilters(this.docInfo.nBundledetailid);
      this.weblinks = this.weblinks.filter((a) => a[this.type == "TITLE" ? "cTitle" : this.type == "DESCRIPTION" ? "cNote" : "cUrl"]);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.weblinks];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nWebid);
    this.OnValueUpdate.emit({ event: "WEB", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function WebfilterComponent_Factory(t) {
      return new (t || _WebfilterComponent)(\u0275\u0275directiveInject(NavigateService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _WebfilterComponent, selectors: [["webfilter"]], inputs: { filterData: "filterData", docInfo: "docInfo", nCaseid: "nCaseid", type: "type" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 5, consts: [["webfltr", ""], [1, "bg-white", "w-full"], ["multiple", "", "name", "item", "panelClass", "!p-0", 3, "ngModelChange", "selectionChange", "placeholder", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "flex", "gap-2", "items-center"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], ["alt", "", 3, "src"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function WebfilterComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function WebfilterComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function WebfilterComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5);
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, WebfilterComponent_For_7_Template, 7, 2, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6);
        \u0275\u0275listener("click", function WebfilterComponent_Template_mat_option_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          const webfltr_r3 = \u0275\u0275reference(2);
          return \u0275\u0275resetView(webfltr_r3.close());
        });
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, WebfilterComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("placeholder", ctx.type == "DOCTITLE" ? "Doc title" : ctx.type == "EXHIBITNO" ? "Exhibit no" : "Ref");
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(ctx.type == "DOCTITLE" ? "Doc title" : ctx.type == "EXHIBITNO" ? "Exhibit no" : "Ref");
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.weblinks);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [CommonModule, MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent, MatTooltipModule] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(WebfilterComponent, { className: "WebfilterComponent", filePath: "src\\app\\shared\\components\\filters\\webfilter\\webfilter.component.ts", lineNumber: 20 });
})();

// src/app/shared/components/filters/creator/creator.component.ts
var _c04 = (a0, a1) => ({ cFname: a0, cLname: a1, cProfile: "" });
function CreatorComponent_For_7_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r4.cRole);
  }
}
function CreatorComponent_For_7_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r4.cCompany);
  }
}
function CreatorComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function CreatorComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const creator_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(creator_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 14);
    \u0275\u0275element(6, "avtr", 15);
    \u0275\u0275elementStart(7, "div", 16)(8, "span", 17);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, CreatorComponent_For_7_Conditional_10_Template, 2, 1, "span", 18)(11, CreatorComponent_For_7_Conditional_11_Template, 2, 1, "span", 18);
    \u0275\u0275elementStart(12, "span", 19);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(6);
    \u0275\u0275property("matTooltip", x_r4.cFname + x_r4.cLname)("detail", \u0275\u0275pureFunction2(8, _c04, x_r4.cFname, x_r4.cLname));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", x_r4.cFname, " ", x_r4.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(10, x_r4.cRole ? 10 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(11, x_r4.cCompany ? 11 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r4.cEmail);
  }
}
function CreatorComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 20)(1, "div", 22);
    \u0275\u0275element(2, "avtr", 23);
    \u0275\u0275elementStart(3, "div", 16)(4, "span", 17);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(6, "icon", 24);
    \u0275\u0275listener("click", function CreatorComponent_Conditional_11_For_2_Template_icon_click_6_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", x_r8.cFname + x_r8.cLname)("detail", \u0275\u0275pureFunction2(4, _c04, x_r8.cFname, x_r8.cLname));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", x_r8.cFname, " ", x_r8.cLname, " ");
  }
}
function CreatorComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 21)(1, "span", 25);
    \u0275\u0275element(2, "icon", 26);
    \u0275\u0275text(3, " All Creators selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 27);
    \u0275\u0275listener("click", function CreatorComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function CreatorComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, CreatorComponent_Conditional_11_For_2_Template, 7, 7, "span", 20, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, CreatorComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 21);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.userList == null ? null : ctx_r6.userList.length) ? 3 : -1);
  }
}
var CreatorComponent = class _CreatorComponent {
  constructor(common) {
    this.common = common;
    this.filterData = {};
    this.OnValueUpdate = new EventEmitter();
    this.userList = [];
    this.isMessage = true;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userList = yield this.common.getMyTeamUsers(this.nCaseid);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.userList];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nUserid);
    this.OnValueUpdate.emit({ event: "CREATOR", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function CreatorComponent_Factory(t) {
      return new (t || _CreatorComponent)(\u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CreatorComponent, selectors: [["creator"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["creator", ""], [1, "bg-white", "w-full"], ["placeholder", "Creator", "multiple", "", "name", "item", "panelClass", "!p-0", 1, "", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "flex", "items-start", "gap-2", "w-full", "px-5", "py-2.5", "rounded-base"], ["size", "lg", 3, "matTooltip", "detail"], [1, "gap-1", "flex", "flex-col"], [1, "text-xs", "font-semibold"], [1, "text-xxs", "leading-none"], [1, "underline", "text-xxs", "leading-none", "truncate"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], [1, "flex", "items-center", "gap-2", "w-fit", "rounded-base"], ["size", "sm", 3, "matTooltip", "detail"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function CreatorComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function CreatorComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function CreatorComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Creator");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, CreatorComponent_For_7_Template, 14, 11, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6)(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, CreatorComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.userList);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent, AvatarComponent, MatTooltipModule, MatTooltip] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CreatorComponent, { className: "CreatorComponent", filePath: "src\\app\\shared\\components\\filters\\creator\\creator.component.ts", lineNumber: 18 });
})();

// src/app/shared/components/filters/assignee/assignee.component.ts
function AssigneeComponent_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 9);
    \u0275\u0275listener("click", function AssigneeComponent_For_7_Template_mat_option_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      \u0275\u0275nextContext();
      const assignee_r3 = \u0275\u0275reference(2);
      return \u0275\u0275resetView(assignee_r3.close());
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 11);
    \u0275\u0275element(3, "icon", 12)(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate2(" ", x_r4.cFname, " ", x_r4.cLname, " ");
  }
}
function AssigneeComponent_Conditional_11_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 14)(1, "div", 16)(2, "div", 17)(3, "span", 18);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(5, "icon", 19);
    \u0275\u0275listener("click", function AssigneeComponent_Conditional_11_For_2_Template_icon_click_5_listener() {
      const $index_r6 = \u0275\u0275restoreView(_r5).$index;
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.remove($index_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate2("", x_r8.cFname, " ", x_r8.cLname, " ");
  }
}
function AssigneeComponent_Conditional_11_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "span", 20);
    \u0275\u0275element(2, "icon", 21);
    \u0275\u0275text(3, " All Assignees selected ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 22);
    \u0275\u0275listener("click", function AssigneeComponent_Conditional_11_Conditional_3_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r6 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r6.isMessage = false);
    });
    \u0275\u0275elementEnd()();
  }
}
function AssigneeComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275repeaterCreate(1, AssigneeComponent_Conditional_11_For_2_Template, 6, 2, "span", 14, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, AssigneeComponent_Conditional_11_Conditional_3_Template, 5, 0, "div", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r6.selected);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r6.isMessage && (ctx_r6.selected == null ? null : ctx_r6.selected.length) && (ctx_r6.selected == null ? null : ctx_r6.selected.length) == (ctx_r6.userList == null ? null : ctx_r6.userList.length) ? 3 : -1);
  }
}
var AssigneeComponent = class _AssigneeComponent {
  constructor(common) {
    this.common = common;
    this.filterData = {};
    this.OnValueUpdate = new EventEmitter();
    this.userList = [];
    this.isMessage = true;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userList = yield this.common.getMyTeamUsers(this.nCaseid);
    });
  }
  OnSelect(e) {
    if (e.value.includes(0)) {
      this.selected = [...this.userList];
    }
    this.updateValue();
  }
  updateValue() {
    this.filterData.value = this.selected.map((a) => a.nUserid);
    this.OnValueUpdate.emit({ event: "ASSIGNEE", data: "" });
  }
  remove(i) {
    this.selected.splice(i, 1);
    this.selected = [...this.selected];
    this.updateValue();
  }
  static {
    this.\u0275fac = function AssigneeComponent_Factory(t) {
      return new (t || _AssigneeComponent)(\u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AssigneeComponent, selectors: [["assignee"]], inputs: { filterData: "filterData", nCaseid: "nCaseid" }, outputs: { OnValueUpdate: "OnValueUpdate" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["assignee", ""], [1, "bg-white", "w-full"], ["placeholder", "Assignee", "multiple", "", "name", "item", "panelClass", "!p-0", 1, "", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "py-0"], [1, "text-xs"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "nocheck", "!sticky", "bottom-0", "h-12", "!bg-white", "overflow-visible", "!py-3", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "flex", "gap-2.5", "shadow-base", "rounded-base", "py-1", "items-center", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate", "justify-center"], [1, "p-2.5", "bg-white", "rounded-base", "flex", "items-center", "flex-wrap", "gap-1", "mt-2"], [1, "nocheck", "group", "my-0.5", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "click", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "bg-white", "shadow-base", "rounded-base", "flex", "items-center", "py-2", "ps-2", "pe-3", "gap-2", "text-xs", "w-fit", "cursor-pointer", "text-grey"], [1, "p-5", "flex", "items-center", "gap-2.5", "bg-grey", "text-sm", "text-white", "mt-2", "w-full"], [1, "flex", "items-center", "gap-2", "w-fit", "rounded-base"], [1, "gap-1", "flex", "flex-col"], [1, "text-xs", "font-semibold"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "flex", "items-center", "gap-2.5"], ["name", "info", 1, "text-base"], ["name", "close", 1, "text-xs", "ms-auto", 3, "click"]], template: function AssigneeComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "mat-form-field", 1)(1, "mat-select", 2, 0);
        \u0275\u0275twoWayListener("ngModelChange", function AssigneeComponent_Template_mat_select_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selected, $event) || (ctx.selected = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function AssigneeComponent_Template_mat_select_selectionChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnSelect($event));
        });
        \u0275\u0275elementStart(3, "mat-select-trigger", 3)(4, "span", 4);
        \u0275\u0275text(5, "Assignee");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(6, AssigneeComponent_For_7_Template, 6, 3, "mat-option", 5, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(8, "mat-option", 6)(9, "div", 7);
        \u0275\u0275text(10, " Select All ");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(11, AssigneeComponent_Conditional_11_Template, 4, 1, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.selected);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.userList);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(11, (ctx.selected == null ? null : ctx.selected.length) ? 11 : -1);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent, MatTooltipModule] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AssigneeComponent, { className: "AssigneeComponent", filePath: "src\\app\\shared\\components\\filters\\assignee\\assignee.component.ts", lineNumber: 18 });
})();

// src/app/shared/components/filters/filters.component.ts
function FiltersComponent_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1, "+ Filter Group");
    \u0275\u0275elementContainerEnd();
  }
}
function FiltersComponent_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(1, 1, "COMMON.CHOOSE_FILTER_GROUP"));
  }
}
function FiltersComponent_ng_container_10_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 12);
    \u0275\u0275elementContainerEnd();
  }
}
function FiltersComponent_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 11);
    \u0275\u0275listener("click", function FiltersComponent_ng_container_10_Template_div_click_1_listener() {
      const x_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.addfilter(x_r3));
    })("keydown", function FiltersComponent_ng_container_10_Template_div_keydown_1_listener($event) {
      const x_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView($event.key === "Enter" && ctx_r3.addfilter(x_r3));
    });
    \u0275\u0275text(2);
    \u0275\u0275template(3, FiltersComponent_ng_container_10_ng_container_3_Template, 2, 0, "ng-container", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r3.name, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r3.selectedFilters.includes(x_r3.value));
  }
}
function FiltersComponent_ng_container_17_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "claims", 14);
    \u0275\u0275twoWayListener("jClaimsChange", function FiltersComponent_ng_container_17_ng_container_2_Template_claims_jClaimsChange_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jClaims, $event) || (ctx_r3.jClaims = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("nCaseid", ctx_r3.nCaseid)("nUserid", ctx_r3.nUserid)("selectedFilters", ctx_r3.selectedFilters);
    \u0275\u0275twoWayProperty("jClaims", ctx_r3.jClaims);
  }
}
function FiltersComponent_ng_container_17_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "issues", 15);
    \u0275\u0275twoWayListener("jIssuesChange", function FiltersComponent_ng_container_17_ng_container_3_Template_issues_jIssuesChange_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jIssues, $event) || (ctx_r3.jIssues = $event);
      return \u0275\u0275resetView($event);
    })("jRelsChange", function FiltersComponent_ng_container_17_ng_container_3_Template_issues_jRelsChange_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jRels, $event) || (ctx_r3.jRels = $event);
      return \u0275\u0275resetView($event);
    })("jImpsChange", function FiltersComponent_ng_container_17_ng_container_3_Template_issues_jImpsChange_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jImps, $event) || (ctx_r3.jImps = $event);
      return \u0275\u0275resetView($event);
    })("IsNoteChange", function FiltersComponent_ng_container_17_ng_container_3_Template_issues_IsNoteChange_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.IsNote, $event) || (ctx_r3.IsNote = $event);
      return \u0275\u0275resetView($event);
    })("IsFactlinkChange", function FiltersComponent_ng_container_17_ng_container_3_Template_issues_IsFactlinkChange_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.IsFactlink, $event) || (ctx_r3.IsFactlink = $event);
      return \u0275\u0275resetView($event);
    })("IsCommentChange", function FiltersComponent_ng_container_17_ng_container_3_Template_issues_IsCommentChange_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.IsComment, $event) || (ctx_r3.IsComment = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("nCaseid", ctx_r3.nCaseid)("nUserid", ctx_r3.nUserid)("selectedFilters", ctx_r3.selectedFilters);
    \u0275\u0275twoWayProperty("jIssues", ctx_r3.jIssues)("jRels", ctx_r3.jRels)("jImps", ctx_r3.jImps)("IsNote", ctx_r3.IsNote)("IsFactlink", ctx_r3.IsFactlink)("IsComment", ctx_r3.IsComment);
    \u0275\u0275property("tab", ctx_r3.tab);
  }
}
function FiltersComponent_ng_container_17_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "factdetailfilter", 16);
    \u0275\u0275twoWayListener("jDateChange", function FiltersComponent_ng_container_17_ng_container_4_Template_factdetailfilter_jDateChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jDate, $event) || (ctx_r3.jDate = $event);
      return \u0275\u0275resetView($event);
    })("jFiletypesChange", function FiltersComponent_ng_container_17_ng_container_4_Template_factdetailfilter_jFiletypesChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jFiletypes, $event) || (ctx_r3.jFiletypes = $event);
      return \u0275\u0275resetView($event);
    })("jLevelsChange", function FiltersComponent_ng_container_17_ng_container_4_Template_factdetailfilter_jLevelsChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jLevels, $event) || (ctx_r3.jLevels = $event);
      return \u0275\u0275resetView($event);
    })("jFiltersChange", function FiltersComponent_ng_container_17_ng_container_4_Template_factdetailfilter_jFiltersChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jFilters, $event) || (ctx_r3.jFilters = $event);
      return \u0275\u0275resetView($event);
    })("jStatusChange", function FiltersComponent_ng_container_17_ng_container_4_Template_factdetailfilter_jStatusChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jStatus, $event) || (ctx_r3.jStatus = $event);
      return \u0275\u0275resetView($event);
    })("createDateChange", function FiltersComponent_ng_container_17_ng_container_4_Template_factdetailfilter_createDateChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.createDate, $event) || (ctx_r3.createDate = $event);
      return \u0275\u0275resetView($event);
    })("createByChange", function FiltersComponent_ng_container_17_ng_container_4_Template_factdetailfilter_createByChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.createBy, $event) || (ctx_r3.createBy = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("nCaseid", ctx_r3.nCaseid)("nUserid", ctx_r3.nUserid)("selectedFilters", ctx_r3.selectedFilters);
    \u0275\u0275twoWayProperty("jDate", ctx_r3.jDate)("jFiletypes", ctx_r3.jFiletypes)("jLevels", ctx_r3.jLevels)("jFilters", ctx_r3.jFilters)("jStatus", ctx_r3.jStatus)("createDate", ctx_r3.createDate)("createBy", ctx_r3.createBy);
  }
}
function FiltersComponent_ng_container_17_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "factcontactfilter", 17);
    \u0275\u0275twoWayListener("jContactsChange", function FiltersComponent_ng_container_17_ng_container_5_Template_factcontactfilter_jContactsChange_1_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jContacts, $event) || (ctx_r3.jContacts = $event);
      return \u0275\u0275resetView($event);
    })("jCRolesChange", function FiltersComponent_ng_container_17_ng_container_5_Template_factcontactfilter_jCRolesChange_1_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jCRoles, $event) || (ctx_r3.jCRoles = $event);
      return \u0275\u0275resetView($event);
    })("jCPartysChange", function FiltersComponent_ng_container_17_ng_container_5_Template_factcontactfilter_jCPartysChange_1_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jCPartys, $event) || (ctx_r3.jCPartys = $event);
      return \u0275\u0275resetView($event);
    })("jCCompaniesChange", function FiltersComponent_ng_container_17_ng_container_5_Template_factcontactfilter_jCCompaniesChange_1_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jCCompanies, $event) || (ctx_r3.jCCompanies = $event);
      return \u0275\u0275resetView($event);
    })("IsContactNoteChange", function FiltersComponent_ng_container_17_ng_container_5_Template_factcontactfilter_IsContactNoteChange_1_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.IsContactNote, $event) || (ctx_r3.IsContactNote = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("nCaseid", ctx_r3.nCaseid)("contactFilter", ctx_r3.contactFilter)("nUserid", ctx_r3.nUserid)("selectedFilters", ctx_r3.selectedFilters);
    \u0275\u0275twoWayProperty("jContacts", ctx_r3.jContacts)("jCRoles", ctx_r3.jCRoles)("jCPartys", ctx_r3.jCPartys)("jCCompanies", ctx_r3.jCCompanies)("IsContactNote", ctx_r3.IsContactNote);
  }
}
function FiltersComponent_ng_container_17_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "facttaskfilter", 18);
    \u0275\u0275twoWayListener("jTasksChange", function FiltersComponent_ng_container_17_ng_container_6_Template_facttaskfilter_jTasksChange_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jTasks, $event) || (ctx_r3.jTasks = $event);
      return \u0275\u0275resetView($event);
    })("IsTaskDescChange", function FiltersComponent_ng_container_17_ng_container_6_Template_facttaskfilter_IsTaskDescChange_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.IsTaskDesc, $event) || (ctx_r3.IsTaskDesc = $event);
      return \u0275\u0275resetView($event);
    })("jTSharedChange", function FiltersComponent_ng_container_17_ng_container_6_Template_facttaskfilter_jTSharedChange_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jTShared, $event) || (ctx_r3.jTShared = $event);
      return \u0275\u0275resetView($event);
    })("jTStatusChange", function FiltersComponent_ng_container_17_ng_container_6_Template_facttaskfilter_jTStatusChange_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jTStatus, $event) || (ctx_r3.jTStatus = $event);
      return \u0275\u0275resetView($event);
    })("jTPriorityChange", function FiltersComponent_ng_container_17_ng_container_6_Template_facttaskfilter_jTPriorityChange_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.jTPriority, $event) || (ctx_r3.jTPriority = $event);
      return \u0275\u0275resetView($event);
    })("dTDateChange", function FiltersComponent_ng_container_17_ng_container_6_Template_facttaskfilter_dTDateChange_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.dTDate, $event) || (ctx_r3.dTDate = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("nCaseid", ctx_r3.nCaseid)("nUserid", ctx_r3.nUserid)("selectedFilters", ctx_r3.selectedFilters);
    \u0275\u0275twoWayProperty("jTasks", ctx_r3.jTasks)("IsTaskDesc", ctx_r3.IsTaskDesc)("jTShared", ctx_r3.jTShared)("jTStatus", ctx_r3.jTStatus)("jTPriority", ctx_r3.jTPriority)("dTDate", ctx_r3.dTDate);
  }
}
function FiltersComponent_ng_container_17_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainer(0);
  }
}
function FiltersComponent_ng_container_17_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainer(0);
  }
}
function FiltersComponent_ng_container_17_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainer(0);
  }
}
function FiltersComponent_ng_container_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 13);
    \u0275\u0275template(2, FiltersComponent_ng_container_17_ng_container_2_Template, 2, 4, "ng-container", 10)(3, FiltersComponent_ng_container_17_ng_container_3_Template, 2, 10, "ng-container", 10)(4, FiltersComponent_ng_container_17_ng_container_4_Template, 2, 10, "ng-container", 10)(5, FiltersComponent_ng_container_17_ng_container_5_Template, 2, 9, "ng-container", 10)(6, FiltersComponent_ng_container_17_ng_container_6_Template, 2, 9, "ng-container", 10)(7, FiltersComponent_ng_container_17_ng_container_7_Template, 1, 0, "ng-container", 10)(8, FiltersComponent_ng_container_17_ng_container_8_Template, 1, 0, "ng-container", 10)(9, FiltersComponent_ng_container_17_ng_container_9_Template, 1, 0, "ng-container", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r3.selectedFilters.includes(ctx_r3.FILTER_ITEM.CL));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r3.selectedFilters.includes(ctx_r3.FILTER_ITEM.I));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r3.selectedFilters.includes(ctx_r3.FILTER_ITEM.FD));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r3.selectedFilters.includes(ctx_r3.FILTER_ITEM.C));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r3.selectedFilters.includes(ctx_r3.FILTER_ITEM.T));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r3.selectedFilters.includes(ctx_r3.FILTER_ITEM.QF));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r3.selectedFilters.includes(ctx_r3.FILTER_ITEM.L));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r3.selectedFilters.includes(ctx_r3.FILTER_ITEM.QM));
  }
}
var FiltersComponent = class _FiltersComponent {
  constructor(secureStorage) {
    this.secureStorage = secureStorage;
    this.FILTER_ITEM = FILTER_ITEM;
    this.originalFilters = null;
    this.claimFilterData = { type: FILTER_TYPE.CLAIM, value: [], consition: "OR" };
    this.OnFilter = new EventEmitter();
    this.filters = FILTER_LIST;
    this.selectedFilters = [];
    this.jClaims = [];
    this.jIssues = [];
    this.jRels = [];
    this.jImps = [];
    this.jDate = null;
    this.jFiletypes = [];
    this.jLevels = null;
    this.jFilters = null;
    this.jStatus = [];
    this.createDate = { start: "", end: "" };
    this.createBy = [];
    this.jContacts = [];
    this.jCRoles = [];
    this.jCPartys = [];
    this.jCCompanies = [];
    this.IsContactNote = false;
    this.jTasks = [];
    this.IsTaskDesc = false;
    this.jTShared = [];
    this.jTStatus = [];
    this.jTPriority = [];
    this.dTDate = null;
    this.IsNote = false;
    this.IsFactlink = false;
    this.IsComment = false;
    if (!this.nUserid) {
      this.nUserid = this.secureStorage.userInfo?.nUserid;
    }
    this.backupCurrentState();
  }
  ngOnChanges(changes) {
    this.backupCurrentState();
  }
  trackByFilterOption(index, item) {
    return item.value;
  }
  addfilter(x) {
    const idx = this.selectedFilters.indexOf(x.value);
    if (idx > -1) {
      this.selectedFilters.splice(idx, 1);
    } else {
      this.selectedFilters.push(x.value);
    }
  }
  emitFilterEvent(event, data = null) {
    this.OnFilter.emit({ event, data });
  }
  saveFilter(apply) {
    const jFilters = this.buildJFilters();
    this.cleanJFilters(jFilters);
    const filterArray = this.buildFilterArray(jFilters);
    this.emitFilterEvent("FILTER", filterArray);
    this.backupCurrentState();
  }
  buildJFilters() {
    const jFilters = {};
    this.addClaimJFilters(jFilters);
    this.addIssueJFilters(jFilters);
    this.addFactJFilters(jFilters);
    this.addQFJFilters(jFilters);
    this.addTypeJFilters(jFilters);
    this.addContactJFilters(jFilters);
    this.addTaskJFilters(jFilters);
    return jFilters;
  }
  addClaimJFilters(jFilters) {
    if (this.jClaims?.length)
      jFilters.jClaims = this.jClaims;
  }
  addIssueJFilters(jFilters) {
    if (this.jIssues?.length)
      jFilters.jIssues = this.jIssues;
    if (this.jRels?.length)
      jFilters.jRels = this.jRels;
    if (this.jImps?.length)
      jFilters.jImps = this.jImps;
    if (this.IsNote)
      jFilters.IsNote = this.IsNote;
    if (this.IsFactlink)
      jFilters.IsFactlink = this.IsFactlink;
    if (this.IsComment)
      jFilters.IsComment = this.IsComment;
  }
  addFactJFilters(jFilters) {
    if (this.jDate)
      jFilters.jDate = this.jDate;
    if (this.jFiletypes?.length)
      jFilters.jFiletypes = this.jFiletypes;
    if (this.jStatus?.length)
      jFilters.jStatus = this.jStatus;
  }
  addQFJFilters(jFilters) {
    if (this.selectedFilters.includes(this.FILTER_ITEM.QF)) {
      if (this.createDate)
        jFilters.createDate = this.createDate;
      if (this.createBy?.length)
        jFilters.createBy = this.createBy;
    }
  }
  addTypeJFilters(jFilters) {
    if (this.jLevels)
      jFilters.cType = this.jLevels;
  }
  addContactJFilters(jFilters) {
    if (this.selectedFilters.includes(this.FILTER_ITEM.C)) {
      if (this.jContacts?.length)
        jFilters.jContacts = this.jContacts;
      if (this.jCRoles?.length)
        jFilters.jCRoles = this.jCRoles;
      if (this.jCPartys?.length)
        jFilters.jCPartys = this.jCPartys;
      if (this.jCCompanies?.length)
        jFilters.jCCompanies = this.jCCompanies;
      if (this.IsContactNote)
        jFilters.IsContactNote = this.IsContactNote;
    }
  }
  addTaskJFilters(jFilters) {
    if (this.selectedFilters.includes(this.FILTER_ITEM.T)) {
      if (this.jTasks?.length)
        jFilters.jTasks = this.jTasks;
      if (this.IsTaskDesc)
        jFilters.IsTaskDesc = this.IsTaskDesc;
      if (this.jTShared?.length)
        jFilters.jTShared = this.jTShared;
      if (this.jTStatus?.length)
        jFilters.jTStatus = this.jTStatus;
      if (this.jTPriority?.length)
        jFilters.jTPriority = this.jTPriority;
      if (this.dTDate)
        jFilters.dTDate = this.dTDate;
    }
  }
  cleanJFilters(jFilters) {
    Object.keys(jFilters).forEach((key) => {
      if (Array.isArray(jFilters[key]) && !jFilters[key].length)
        delete jFilters[key];
      if (jFilters[key] === void 0 || jFilters[key] === null)
        delete jFilters[key];
    });
  }
  buildFilterArray(jFilters) {
    let filterArray = [];
    filterArray = filterArray.concat(this.getClaimFilters(jFilters));
    filterArray = filterArray.concat(this.getIssueFilters(jFilters));
    filterArray = filterArray.concat(this.getFactFilters(jFilters));
    filterArray = filterArray.concat(this.getQFFilters(jFilters));
    filterArray = filterArray.concat(this.getTypeFilters(jFilters));
    filterArray = filterArray.concat(this.getContactFilters(jFilters));
    filterArray = filterArray.concat(this.getTaskFilters(jFilters));
    return filterArray;
  }
  getClaimFilters(jFilters) {
    return jFilters.jClaims?.length ? [{ name: FILTER_KEYS.CLAIM, type: "V", value: jFilters.jClaims }] : [];
  }
  getIssueFilters(jFilters) {
    const arr = [];
    if (jFilters.jIssues?.length)
      arr.push({ name: FILTER_KEYS.ISSUE, type: "V", value: jFilters.jIssues });
    if (jFilters.jRels?.length)
      arr.push({ name: FILTER_KEYS.RELEVANCE, type: "V", value: jFilters.jRels });
    if (jFilters.jImps?.length)
      arr.push({ name: FILTER_KEYS.IMPACT, type: "V", value: jFilters.jImps });
    if (jFilters.IsNote)
      arr.push({ name: FILTER_KEYS.ISNOTE, type: "V", value: jFilters.IsNote });
    if (jFilters.IsFactlink)
      arr.push({ name: FILTER_KEYS.ISFACTLINK, type: "V", value: jFilters.IsFactlink });
    if (jFilters.IsComment)
      arr.push({ name: FILTER_KEYS.ISCOMMENT, type: "V", value: jFilters.IsComment });
    return arr;
  }
  getFactFilters(jFilters) {
    const arr = [];
    if (jFilters.jDate && Object.keys(jFilters.jDate).length)
      arr.push({ name: FILTER_KEYS.DATE, type: "V", value: jFilters.jDate });
    if (jFilters.jFiletypes?.length)
      arr.push({ name: FILTER_KEYS.FILETYPE, type: "V", value: jFilters.jFiletypes });
    if (jFilters.jStatus?.length)
      arr.push({ name: FILTER_KEYS.STATUS, type: "V", value: jFilters.jStatus });
    return arr;
  }
  getQFFilters(jFilters) {
    const arr = [];
    if (jFilters.createDate && Object.keys(jFilters.createDate).length)
      arr.push({ name: FILTER_KEYS.CREATEDATE, type: "V", value: jFilters.createDate });
    if (jFilters.createBy?.length)
      arr.push({ name: FILTER_KEYS.CREATOR, type: "V", value: jFilters.createBy });
    return arr;
  }
  getTypeFilters(jFilters) {
    return jFilters.cType ? [{ name: FILTER_KEYS.CTYPE, type: "V", value: jFilters.cType }] : [];
  }
  getContactFilters(jFilters) {
    const arr = [];
    if (jFilters.jContacts?.length)
      arr.push({ name: FILTER_KEYS.CONTACT, type: "V", value: jFilters.jContacts });
    if (jFilters.jCRoles?.length)
      arr.push({ name: FILTER_KEYS.CROLE, type: "V", value: jFilters.jCRoles });
    if (jFilters.jCPartys?.length)
      arr.push({ name: FILTER_KEYS.CPARTY, type: "V", value: jFilters.jCPartys });
    if (jFilters.jCCompanies?.length)
      arr.push({ name: FILTER_KEYS.CCOMPANY, type: "V", value: jFilters.jCCompanies });
    if (jFilters.IsContactNote)
      arr.push({ name: FILTER_KEYS.ISCONTACTNOTE, type: "V", value: jFilters.IsContactNote });
    return arr;
  }
  getTaskFilters(jFilters) {
    const arr = [];
    if (jFilters.jTasks?.length)
      arr.push({ name: FILTER_KEYS.TASK, type: "V", value: jFilters.jTasks });
    if (jFilters.IsTaskDesc)
      arr.push({ name: FILTER_KEYS.ISTASKDESC, type: "V", value: jFilters.IsTaskDesc });
    if (jFilters.jTShared?.length)
      arr.push({ name: FILTER_KEYS.TSHARED, type: "V", value: jFilters.jTShared });
    if (jFilters.jTStatus?.length)
      arr.push({ name: FILTER_KEYS.TSTATUS, type: "V", value: jFilters.jTStatus });
    if (jFilters.jTPriority?.length)
      arr.push({ name: FILTER_KEYS.TPRIORITY, type: "V", value: jFilters.jTPriority });
    if (jFilters.dTDate)
      arr.push({ name: FILTER_KEYS.TDATE, type: "V", value: jFilters.dTDate });
    return arr;
  }
  addClaimFilters(jFilters) {
    if (this.selectedFilters.includes(this.FILTER_ITEM.CL) && this.jClaims?.length) {
      jFilters.jClaims = this.jClaims;
    }
  }
  addIssueFilters(jFilters) {
    if (this.selectedFilters.includes(this.FILTER_ITEM.I)) {
      if (this.jIssues?.length)
        jFilters.jIssues = this.jIssues;
      if (this.jRels?.length)
        jFilters.jRels = this.jRels;
      if (this.jImps?.length)
        jFilters.jImps = this.jImps;
      if (this.IsNote)
        jFilters.IsNote = this.IsNote;
      if (this.IsFactlink)
        jFilters.IsFactlink = this.IsFactlink;
      if (this.IsComment)
        jFilters.IsComment = this.IsComment;
    }
  }
  cancelFilter() {
    if (this.originalFilters) {
      this.selectedFilters = [...this.originalFilters.selectedFilters];
      this.jClaims = [...this.originalFilters.jClaims];
      this.jIssues = [...this.originalFilters.jIssues];
      this.jRels = [...this.originalFilters.jRels];
      this.jImps = [...this.originalFilters.jImps];
      this.jDate = this.originalFilters.jDate ? __spreadValues({}, this.originalFilters.jDate) : null;
      this.jFiletypes = [...this.originalFilters.jFiletypes];
      this.jLevels = this.originalFilters.jLevels;
      this.jFilters = this.originalFilters.jFilters;
      this.jStatus = [...this.originalFilters.jStatus];
      this.createDate = this.originalFilters.createDate ? __spreadValues({}, this.originalFilters.createDate) : { start: "", end: "" };
      this.createBy = [...this.originalFilters.createBy];
      this.jContacts = [...this.originalFilters.jContacts];
      this.jCRoles = [...this.originalFilters.jCRoles];
      this.jCPartys = [...this.originalFilters.jCPartys];
      this.jCCompanies = [...this.originalFilters.jCCompanies];
      this.IsContactNote = this.originalFilters.IsContactNote;
      this.jTasks = [...this.originalFilters.jTasks];
      this.IsTaskDesc = this.originalFilters.IsTaskDesc;
      this.jTShared = [...this.originalFilters.jTShared];
      this.jTStatus = [...this.originalFilters.jTStatus];
      this.jTPriority = [...this.originalFilters.jTPriority];
      this.dTDate = this.originalFilters.dTDate;
      this.IsNote = this.originalFilters.IsNote;
      this.IsFactlink = this.originalFilters.IsFactlink;
      this.IsComment = this.originalFilters.IsComment;
    } else {
      this._clearAllFilterInternal();
    }
    this.emitFilterEvent("BACK");
  }
  backupCurrentState() {
    this.originalFilters = {
      selectedFilters: [...this.selectedFilters],
      jClaims: [...this.jClaims],
      jIssues: [...this.jIssues],
      jRels: [...this.jRels],
      jImps: [...this.jImps],
      jDate: this.jDate ? __spreadValues({}, this.jDate) : null,
      jFiletypes: [...this.jFiletypes],
      jLevels: this.jLevels,
      jFilters: this.jFilters,
      jStatus: [...this.jStatus],
      createDate: this.createDate ? __spreadValues({}, this.createDate) : { start: "", end: "" },
      createBy: [...this.createBy],
      jContacts: [...this.jContacts],
      jCRoles: [...this.jCRoles],
      jCPartys: [...this.jCPartys],
      jCCompanies: [...this.jCCompanies],
      IsContactNote: this.IsContactNote,
      jTasks: [...this.jTasks],
      IsTaskDesc: this.IsTaskDesc,
      jTShared: [...this.jTShared],
      jTStatus: [...this.jTStatus],
      jTPriority: [...this.jTPriority],
      dTDate: this.dTDate,
      IsNote: this.IsNote,
      IsFactlink: this.IsFactlink,
      IsComment: this.IsComment
    };
  }
  clearAllFilter() {
    this._clearAllFilterInternal();
  }
  _clearAllFilterInternal() {
    this.selectedFilters = [];
    this.jClaims = [];
    this.jIssues = [];
    this.jRels = [];
    this.jImps = [];
    this.jDate = null;
    this.jFiletypes = [];
    this.jLevels = null;
    this.jFilters = null;
    this.jStatus = [];
    this.createDate = { start: "", end: "" };
    this.createBy = [];
    this.jContacts = [];
    this.jCRoles = [];
    this.jCPartys = [];
    this.jCCompanies = [];
    this.IsContactNote = false;
    this.jTasks = [];
    this.IsTaskDesc = false;
    this.jTShared = [];
    this.jTStatus = [];
    this.jTPriority = [];
    this.dTDate = null;
    this.IsNote = false;
    this.IsFactlink = false;
    this.IsComment = false;
    this.emitFilterEvent("FILTER", []);
  }
  static {
    this.\u0275fac = function FiltersComponent_Factory(t) {
      return new (t || _FiltersComponent)(\u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FiltersComponent, selectors: [["filters"]], inputs: { nCaseid: "nCaseid", nUserid: "nUserid", tab: "tab", selectedTab: "selectedTab", contactFilter: "contactFilter", nViewissueid: "nViewissueid", selectedMode: "selectedMode", isAdvance: "isAdvance", docInfo: "docInfo", onNavigateEvent: "onNavigateEvent" }, outputs: { OnFilter: "OnFilter" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 18, vars: 8, consts: [["chooseFilter", ""], ["menu", "matMenu"], [1, "w-full", "h-full", "p-5"], [1, "text-lg", "flex", "gap-3", "items-center", "mb-3", "text-white"], ["mode", "white", "addcls", "hover:!bg-white", 1, "", 3, "matMenuTriggerFor"], [4, "ngIf", "ngIfElse"], [1, "mt-1", "!min-w-[156px]", "!max-w-[156px]", "p-2.5"], [1, "flex", "flex-col", "gap-2f"], [4, "ngFor", "ngForOf", "ngForTrackBy"], ["mode", "white", "addcls", "hover:!bg-white", 1, "", 3, "click", "keydown"], [4, "ngIf"], [1, "hover:bg-reply", "group", "relative", "p-2", "px-5", "text-xs", "flex", "items-center", "cursor-pointer", "rounded-base", 3, "click", "keydown"], ["name", "addfill", 1, "ms-auto", "absolute", "right-5"], [1, "bg-white", "px-2.5", "rounded-base", "flex", "flex-col", "divide-y", "gap-2", "max-h-[calc(100%-40px)]", "overflow-auto", "filter-area"], [3, "jClaimsChange", "nCaseid", "nUserid", "selectedFilters", "jClaims"], [3, "jIssuesChange", "jRelsChange", "jImpsChange", "IsNoteChange", "IsFactlinkChange", "IsCommentChange", "nCaseid", "nUserid", "selectedFilters", "jIssues", "jRels", "jImps", "IsNote", "IsFactlink", "IsComment", "tab"], [3, "jDateChange", "jFiletypesChange", "jLevelsChange", "jFiltersChange", "jStatusChange", "createDateChange", "createByChange", "nCaseid", "nUserid", "selectedFilters", "jDate", "jFiletypes", "jLevels", "jFilters", "jStatus", "createDate", "createBy"], [3, "jContactsChange", "jCRolesChange", "jCPartysChange", "jCCompaniesChange", "IsContactNoteChange", "nCaseid", "contactFilter", "nUserid", "selectedFilters", "jContacts", "jCRoles", "jCPartys", "jCCompanies", "IsContactNote"], [3, "jTasksChange", "IsTaskDescChange", "jTSharedChange", "jTStatusChange", "jTPriorityChange", "dTDateChange", "nCaseid", "nUserid", "selectedFilters", "jTasks", "IsTaskDesc", "jTShared", "jTStatus", "jTPriority", "dTDate"]], template: function FiltersComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 2)(1, "header")(2, "span", 3)(3, "btn", 4);
        \u0275\u0275template(4, FiltersComponent_ng_container_4_Template, 2, 0, "ng-container", 5)(5, FiltersComponent_ng_template_5_Template, 2, 3, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "mat-menu", 6, 1)(9, "div", 7);
        \u0275\u0275template(10, FiltersComponent_ng_container_10_Template, 4, 2, "ng-container", 8);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(11, "btn", 9);
        \u0275\u0275listener("click", function FiltersComponent_Template_btn_click_11_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.cancelFilter());
        })("keydown", function FiltersComponent_Template_btn_keydown_11_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.key === "Enter" && ctx.cancelFilter());
        });
        \u0275\u0275text(12, "Cancel");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "btn", 9);
        \u0275\u0275listener("click", function FiltersComponent_Template_btn_click_13_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.saveFilter(true));
        })("keydown", function FiltersComponent_Template_btn_keydown_13_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.key === "Enter" && ctx.saveFilter(true));
        });
        \u0275\u0275text(14, "Save");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "btn", 9);
        \u0275\u0275listener("click", function FiltersComponent_Template_btn_click_15_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.clearAllFilter());
        })("keydown", function FiltersComponent_Template_btn_keydown_15_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.key === "Enter" && ctx.clearAllFilter());
        });
        \u0275\u0275text(16, "Clear All Filter");
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(17, FiltersComponent_ng_container_17_Template, 10, 8, "ng-container", 10);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        const chooseFilter_r10 = \u0275\u0275reference(6);
        const menu_r11 = \u0275\u0275reference(8);
        \u0275\u0275advance(3);
        \u0275\u0275property("matMenuTriggerFor", menu_r11);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.selectedFilters.length)("ngIfElse", chooseFilter_r10);
        \u0275\u0275advance(6);
        \u0275\u0275property("ngForOf", ctx.filters)("ngForTrackBy", ctx.trackByFilterOption);
        \u0275\u0275advance(5);
        \u0275\u0275classMap(ctx.selectedFilters.length ? "" : "opacity-50 pointer-events-none");
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.nUserid && ctx.selectedFilters.length);
      }
    }, dependencies: [
      IconComponent,
      MatSelectModule,
      FormsModule,
      CommonModule,
      NgForOf,
      NgIf,
      ClaimsComponent,
      IssuesComponent,
      NgScrollbarModule,
      TranslateModule,
      TranslatePipe,
      ButtonComponent,
      MatMenuModule,
      MatMenu,
      MatMenuTrigger,
      FactdetailfilterComponent,
      FactcontactfilterComponent,
      FacttaskfilterComponent
    ], styles: ["\n\n.filter-area[_ngcontent-%COMP%] {\n  margin-top: 16px;\n  margin-bottom: 16px;\n}\n.filter-divider[_ngcontent-%COMP%] {\n  height: 1px;\n  background: #e5e7eb;\n  margin: 16px 0;\n  width: 100%;\n}\n.ng-select[_ngcontent-%COMP%], ng-select[_ngcontent-%COMP%], .mat-mdc-select[_ngcontent-%COMP%] {\n  width: 100% !important;\n  min-width: 0 !important;\n  box-sizing: border-box !important;\n}\n.ng-select[_ngcontent-%COMP%]   .ng-select-container[_ngcontent-%COMP%], .ng-select[_ngcontent-%COMP%]   .ng-value-container[_ngcontent-%COMP%], .mat-mdc-select[_ngcontent-%COMP%]   .mat-mdc-select-trigger[_ngcontent-%COMP%], .mat-mdc-select[_ngcontent-%COMP%]   .mat-mdc-select-value[_ngcontent-%COMP%] {\n  display: flex !important;\n  flex-wrap: wrap !important;\n  gap: 6px !important;\n  align-items: flex-start !important;\n  white-space: normal !important;\n  overflow-x: hidden !important;\n}\n.ng-select[_ngcontent-%COMP%]   .ng-value[_ngcontent-%COMP%], .ng-select[_ngcontent-%COMP%]   .ng-value[_ngcontent-%COMP%]   .ng-value-label[_ngcontent-%COMP%], .mat-mdc-select[_ngcontent-%COMP%]   .mat-mdc-select-value[_ngcontent-%COMP%], .mat-mdc-select[_ngcontent-%COMP%]   .mat-mdc-select-value-text[_ngcontent-%COMP%] {\n  white-space: normal !important;\n  word-break: break-word !important;\n  max-width: 100% !important;\n  overflow-wrap: anywhere !important;\n}\n.cdk-overlay-pane[_ngcontent-%COMP%]   .ng-dropdown-panel[_ngcontent-%COMP%], .cdk-overlay-pane[_ngcontent-%COMP%]   .mat-mdc-select-panel[_ngcontent-%COMP%] {\n  min-width: 260px !important;\n  max-width: calc(100vw - 32px) !important;\n  white-space: normal !important;\n  box-sizing: border-box !important;\n}\n.ng-select[_ngcontent-%COMP%] {\n  min-width: 0 !important;\n  max-width: 100% !important;\n  box-sizing: border-box !important;\n}\n[_nghost-%COMP%]     .filter-area .ng-select {\n  min-width: 0 !important;\n}\n.ng-dropdown-panel[_ngcontent-%COMP%], .cdk-overlay-pane[_ngcontent-%COMP%]   .ng-dropdown-panel[_ngcontent-%COMP%] {\n  min-width: 260px !important;\n  max-width: calc(100vw - 32px) !important;\n  box-sizing: border-box !important;\n}\n.ng-select[_ngcontent-%COMP%]   .ng-value-container[_ngcontent-%COMP%]   .ng-input[_ngcontent-%COMP%] {\n  flex: 1 1 60px !important;\n  min-width: 40px !important;\n  max-width: 100% !important;\n}\n.ng-select[_ngcontent-%COMP%]   .ng-value-container[_ngcontent-%COMP%]   .ng-value[_ngcontent-%COMP%] {\n  display: inline-block !important;\n  white-space: normal !important;\n  word-break: break-word !important;\n  max-width: 100% !important;\n  margin: 2px 4px !important;\n}\n.ng-select[_ngcontent-%COMP%]   .ng-value-container[_ngcontent-%COMP%] {\n  display: flex !important;\n  flex-wrap: wrap !important;\n  align-items: flex-start !important;\n  gap: 6px !important;\n}\n[_nghost-%COMP%]     ng-select.ng-select-main.flex-1 {\n  flex: 1 1 auto !important;\n  min-width: 0 !important;\n  width: 100% !important;\n  max-width: 100% !important;\n  box-sizing: border-box !important;\n  overflow: visible !important;\n}\n[_nghost-%COMP%]     ng-select.ng-select-main.flex-1 .ng-select-container, [_nghost-%COMP%]     ng-select.ng-select-main.flex-1 .ng-value-container {\n  width: 100% !important;\n  max-width: 100% !important;\n  display: flex !important;\n  flex-wrap: wrap !important;\n  align-items: flex-start !important;\n  gap: 6px !important;\n  overflow-x: hidden !important;\n}\n[_nghost-%COMP%]     ng-select.ng-select-main.flex-1 .ng-value {\n  display: inline-block !important;\n  max-width: calc(100% - 36px) !important;\n  white-space: normal !important;\n  word-break: break-word !important;\n  overflow-wrap: anywhere !important;\n}\n[_nghost-%COMP%]     .filter-area .flex.gap-2.mt-2, [_nghost-%COMP%]     .filter-area .flex.gap-2.mt-2.flex-wrap {\n  flex-wrap: wrap !important;\n}\n[_nghost-%COMP%]     .filter-area .p-2\\.5.bg-white {\n  display: flex !important;\n  flex-wrap: wrap !important;\n  gap: 6px !important;\n  align-items: flex-start !important;\n  overflow-x: hidden !important;\n  width: 100% !important;\n  box-sizing: border-box !important;\n}\n[_nghost-%COMP%]     .filter-area .p-2\\.5.bg-white > span {\n  display: inline-flex !important;\n  max-width: calc(100% - 8px) !important;\n  white-space: normal !important;\n  word-break: break-word !important;\n}\n[_nghost-%COMP%]     .filter-area .mat-mdc-select .mat-mdc-select-trigger {\n  display: flex !important;\n  flex-wrap: wrap !important;\n  align-items: flex-start !important;\n  gap: 6px !important;\n  width: 100% !important;\n}\n/*# sourceMappingURL=filters.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FiltersComponent, { className: "FiltersComponent", filePath: "src\\app\\shared\\components\\filters\\filters.component.ts", lineNumber: 47 });
})();

export {
  NavigateService,
  FiltersComponent
};
//# sourceMappingURL=chunk-ZPVMAEW3.js.map
