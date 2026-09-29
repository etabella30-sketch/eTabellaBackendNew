import {
  DoccardComponent
} from "./chunk-YQJXVIAQ.js";
import {
  MyfileService
} from "./chunk-M4TJ3SSY.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ScrollingModule
} from "./chunk-MESCMVD2.js";
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
  ElementRef,
  EventEmitter,
  __async,
  __spreadValues,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunctionV,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/myfiles/filehader/filehader.component.ts
var _c0 = ["fileheader"];
var _c1 = (a0) => ({ "me-5": a0 });
var _c2 = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) => ({ "--hasdesc": a0, "--hasname": a1, "--bundle": a2, "--tab": a3, "--links": a4, "--link": a5, "--relevence": a6, "--impact": a7, "--pagination": a8, "--page": a9, "--exhibit": a10, "--kind": a11, "--doi": a12, "--extra": a13 });
var _c3 = (a0) => ({ "": a0 });
var _c4 = (a0) => ({ "--checkbox": a0 });
var _c5 = (a0) => ({ "--drag": a0 });
var _c6 = (a0) => ({ "--order": a0 });
var _c7 = (a0) => ({ "order": a0 });
var _c8 = (a0, a1) => ({ "--extra": a0, "order": a1 });
function FilehaderComponent_dl_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "dl", 13);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(1, _c5, (ctx_r0.reqcols == null ? null : ctx_r0.reqcols.drag == null ? null : ctx_r0.reqcols.drag.view) ? "" : "0px"));
  }
}
function FilehaderComponent_dl_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "dl", 14);
    \u0275\u0275text(1, " Order");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(1, _c6, (ctx_r0.reqcols == null ? null : ctx_r0.reqcols.order) ? "" : "0px"));
  }
}
function FilehaderComponent_dl_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "dl", 15);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.SType == "W" ? "ES" : ctx_r0.SType == "C" ? "CS" : "Sr", " No. ");
  }
}
function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 20);
    \u0275\u0275element(2, "icon", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "mat-menu", 22, 3)(5, "button", 23);
    \u0275\u0275listener("click", function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_container_1_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r2);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.editCol(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3], "A"));
    })("keydown.enter", function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_container_1_Template_button_keydown_enter_5_listener() {
      \u0275\u0275restoreView(_r2);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.editCol(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3], "A"));
    })("keydown.space", function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_container_1_Template_button_keydown_space_5_listener($event) {
      \u0275\u0275restoreView(_r2);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r0.editCol(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3], "A"));
    });
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 24);
    \u0275\u0275text(8, " | ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 23);
    \u0275\u0275listener("click", function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_container_1_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r2);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.editCol(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3], "M"));
    })("keydown.enter", function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_container_1_Template_button_keydown_enter_9_listener() {
      \u0275\u0275restoreView(_r2);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.editCol(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3], "M"));
    })("keydown.space", function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_container_1_Template_button_keydown_space_9_listener($event) {
      \u0275\u0275restoreView(_r2);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r0.editCol(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3], "M"));
    });
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const menu_r4 = \u0275\u0275reference(4);
    \u0275\u0275advance();
    \u0275\u0275property("matMenuTriggerFor", menu_r4);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", "Auto", " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", "Manual", " ");
  }
}
function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 25);
    \u0275\u0275listener("click", function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_template_2_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.editCol(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3], "M"));
    })("keydown.enter", function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_template_2_Template_button_keydown_enter_0_listener() {
      \u0275\u0275restoreView(_r5);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.editCol(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3], "M"));
    })("keydown.space", function FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_template_2_Template_button_keydown_space_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r0.editCol(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3], "M"));
    });
    \u0275\u0275element(1, "icon", 21);
    \u0275\u0275elementEnd();
  }
}
function FilehaderComponent_ng_container_8_dl_1_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_container_1_Template, 11, 3, "ng-container", 19)(2, FilehaderComponent_ng_container_8_dl_1_ng_container_3_ng_template_2_Template, 2, 0, "ng-template", null, 2, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const manualEdit_r6 = \u0275\u0275reference(3);
    const column_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].name) == "Tab")("ngIfElse", manualEdit_r6);
  }
}
function FilehaderComponent_ng_container_8_dl_1_ng_template_4_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 27);
    \u0275\u0275listener("click", function FilehaderComponent_ng_container_8_dl_1_ng_template_4_ng_container_0_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r7);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.sort_array(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].sortKey, "flag1"));
    })("keydown.enter", function FilehaderComponent_ng_container_8_dl_1_ng_template_4_ng_container_0_Template_button_keydown_enter_1_listener() {
      \u0275\u0275restoreView(_r7);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.sort_array(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].sortKey, "flag1"));
    })("keydown.space", function FilehaderComponent_ng_container_8_dl_1_ng_template_4_ng_container_0_Template_button_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const column_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r0.sort_array(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].sortKey, "flag1"));
    });
    \u0275\u0275element(2, "icon", 28);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
}
function FilehaderComponent_ng_container_8_dl_1_ng_template_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FilehaderComponent_ng_container_8_dl_1_ng_template_4_ng_container_0_Template, 3, 0, "ng-container", 26);
  }
  if (rf & 2) {
    const column_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngIf", ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].sortKey);
  }
}
function FilehaderComponent_ng_container_8_dl_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "dl", 17)(1, "span", 18);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, FilehaderComponent_ng_container_8_dl_1_ng_container_3_Template, 4, 2, "ng-container", 19)(4, FilehaderComponent_ng_container_8_dl_1_ng_template_4_Template, 1, 1, "ng-template", null, 1, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const sortableColumn_r8 = \u0275\u0275reference(5);
    const column_r3 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classProp("last", ctx_r0.getVisibleColumns(ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].order) && !ctx_r0.isadmin);
    \u0275\u0275property("ngClass", ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].class)("ngStyle", \u0275\u0275pureFunction1(7, _c7, ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].order));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].name, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.isadmin && (ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].isEdit))("ngIfElse", sortableColumn_r8);
  }
}
function FilehaderComponent_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FilehaderComponent_ng_container_8_dl_1_Template, 6, 9, "dl", 16);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const column_r3 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].view) && (ctx_r0.reqcols == null ? null : ctx_r0.reqcols[column_r3] == null ? null : ctx_r0.reqcols[column_r3].name));
  }
}
function FilehaderComponent_dl_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "dl", 29);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction2(1, _c8, (ctx_r0.reqcols == null ? null : ctx_r0.reqcols.extra == null ? null : ctx_r0.reqcols.extra.view) ? "20px" : "0px", ctx_r0.reqcols == null ? null : ctx_r0.reqcols.extra == null ? null : ctx_r0.reqcols.extra.order));
  }
}
var FilehaderComponent = class _FilehaderComponent {
  constructor(crd) {
    this.crd = crd;
    this.sort = new EventEmitter();
    this.edit = new EventEmitter();
    this.checkoutside = false;
    this.isadmin = false;
    this.reqcolKeys = [];
  }
  ngOnInit() {
    this.reqcolKeys = Object.keys(this.reqcols ?? {});
  }
  ngOnChanges(changes) {
    this.reqcolKeys = this.customSort(this.reqcols);
  }
  sort_array(key, flag) {
    this.sort.emit({ key, flag });
  }
  editCol(e, flag) {
    this.edit.emit([e, flag]);
    this.crd.detectChanges();
  }
  customSort(obj) {
    if (!obj) {
      return [];
    }
    const entries = Object.entries(obj).map(([key, value]) => __spreadValues({
      key
    }, typeof value === "object" && value !== null ? value : {}));
    entries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return entries.map((e) => e.key);
  }
  getVisibleColumns(index) {
    const visibleColumns = this.reqcolKeys.filter((key) => this.reqcols?.[key]?.view && this.reqcols?.[key]?.name).map((key) => ({
      order: this.reqcols[key].order || 0,
      index: this.reqcolKeys.indexOf(key)
    }));
    const maxOrder = Math.max(...visibleColumns.map((col) => col.order));
    return maxOrder == index;
  }
  static {
    this.\u0275fac = function FilehaderComponent_Factory(t) {
      return new (t || _FilehaderComponent)(\u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FilehaderComponent, selectors: [["app-filehader"]], viewQuery: function FilehaderComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5, ElementRef);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.fileHeader = _t.first);
      }
    }, inputs: { checkoutside: "checkoutside", isadmin: "isadmin", SType: "SType", reqcols: "reqcols", presentDocType: "presentDocType" }, outputs: { sort: "sort", edit: "edit" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 10, vars: 32, consts: [["fileheader", ""], ["sortableColumn", ""], ["manualEdit", ""], ["menu", "matMenu"], ["id", "tableparent", 1, "files-wrapper", "pe-2", "relative", "min-w-fit", 3, "ngClass", "ngStyle"], [1, "header", "sortheader", "w-full", "rounded-full", "text-white", "px-3", "[&>dl]:bg-grey", "[&>dl]:py-0.5", "[&>dl]:text-xxs", 3, "ngClass"], [1, "gap-col", "!bg-transparent"], ["class", "drag !bg-transparent", 3, "ngStyle", 4, "ngIf"], ["class", "order", 3, "ngStyle", 4, "ngIf"], [1, "input", "rounded-s-full", "justify-center", 3, "ngStyle"], ["class", "kind relative group flex items-center cursor-pointer", 4, "ngIf"], [4, "ngFor", "ngForOf"], ["class", "extra rounded-e-full", 3, "ngStyle", 4, "ngIf"], [1, "drag", "!bg-transparent", 3, "ngStyle"], [1, "order", 3, "ngStyle"], [1, "kind", "relative", "group", "flex", "items-center", "cursor-pointer"], ["class", "relative group flex items-center cursor-pointer", 3, "last", "ngClass", "ngStyle", 4, "ngIf"], [1, "relative", "group", "flex", "items-center", "cursor-pointer", 3, "ngClass", "ngStyle"], [1, "relative", "z-10", "pointer-events-none"], [4, "ngIf", "ngIfElse"], ["type", "button", "aria-label", "Edit column", 1, "bg-white", "z-20", "text-blue-on", "rounded-base", "flex", "items-center", "justify-center", "h-4/5", "w-4/5", "m-auto", "absolute", "opacity-0", "group-hover:opacity-100", "cursor-pointer", 3, "matMenuTriggerFor"], ["name", "add", 1, "text-[8px]"], [1, "p-2.5"], ["type", "button", 1, "text-xs", "select-none", 3, "click", "keydown.enter", "keydown.space"], ["aria-hidden", "true"], ["type", "button", "aria-label", "Edit column", 1, "bg-white", "z-20", "text-blue-on", "rounded-base", "flex", "items-center", "justify-center", "h-4/5", "w-4/5", "m-auto", "absolute", "opacity-0", "group-hover:opacity-100", "cursor-pointer", 3, "click", "keydown.enter", "keydown.space"], [4, "ngIf"], ["type", "button", "aria-label", "Sort", 1, "bg-black", "items-center", "h-5/6", "pe-2", "absolute", "rounded-full", "w-full", "z-0", "me-2", "-translate-x-2", "hidden", "group-hover:flex", 3, "click", "keydown.enter", "keydown.space"], ["name", "sort", "type", "extra", 1, "text-[8px]", "ms-auto"], [1, "extra", "rounded-e-full", 3, "ngStyle"]], template: function FilehaderComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 4, 0)(2, "header", 5);
        \u0275\u0275element(3, "dl", 6);
        \u0275\u0275template(4, FilehaderComponent_dl_4_Template, 1, 3, "dl", 7)(5, FilehaderComponent_dl_5_Template, 2, 3, "dl", 8);
        \u0275\u0275element(6, "dl", 9);
        \u0275\u0275template(7, FilehaderComponent_dl_7_Template, 2, 1, "dl", 10)(8, FilehaderComponent_ng_container_8_Template, 2, 1, "ng-container", 11)(9, FilehaderComponent_dl_9_Template, 1, 4, "dl", 12);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(11, _c1, ctx.presentDocType == "CF" || ctx.presentDocType == "C"))("ngStyle", \u0275\u0275pureFunctionV(13, _c2, [(ctx.reqcols == null ? null : ctx.reqcols.desc == null ? null : ctx.reqcols.desc.view) ? "2" : "1", (ctx.reqcols == null ? null : ctx.reqcols.name == null ? null : ctx.reqcols.name.view) ? "2" : "1", (ctx.reqcols == null ? null : ctx.reqcols.bundle == null ? null : ctx.reqcols.bundle.view) ? "65px" : "0px", (ctx.reqcols == null ? null : ctx.reqcols.tab == null ? null : ctx.reqcols.tab.view) ? "70px" : "0px", (ctx.reqcols.link == null ? null : ctx.reqcols.link.view) ? "100px" : "0px", (ctx.reqcols.link == null ? null : ctx.reqcols.link.view) ? "100px" : "0px", (ctx.reqcols == null ? null : ctx.reqcols.relevence == null ? null : ctx.reqcols.relevence.view) ? "65px" : "0px", (ctx.reqcols == null ? null : ctx.reqcols.impact == null ? null : ctx.reqcols.impact.view) ? "55px" : "0px", (ctx.reqcols == null ? null : ctx.reqcols.page == null ? null : ctx.reqcols.page.view) ? "55px" : "0px", (ctx.reqcols == null ? null : ctx.reqcols.page == null ? null : ctx.reqcols.page.view) ? "55px" : "0px", (ctx.reqcols == null ? null : ctx.reqcols.exhibit == null ? null : ctx.reqcols.exhibit.view) ? "120px" : "0px", (ctx.reqcols == null ? null : ctx.reqcols.kind == null ? null : ctx.reqcols.kind.view) ? "55px" : "0px", (ctx.reqcols == null ? null : ctx.reqcols.date == null ? null : ctx.reqcols.date.view) ? "100px" : "0px", (ctx.reqcols == null ? null : ctx.reqcols.extra == null ? null : ctx.reqcols.extra.view) ? "20px" : "0px"]));
        \u0275\u0275advance(2);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(28, _c3, !(ctx.reqcols == null ? null : ctx.reqcols.extra == null ? null : ctx.reqcols.extra.view)));
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.checkoutside ? "!w-11 !min-w-11" : "!w-8 !min-w-8");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.reqcols == null ? null : ctx.reqcols.drag == null ? null : ctx.reqcols.drag.view);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.reqcols == null ? null : ctx.reqcols.order);
        \u0275\u0275advance();
        \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(30, _c4, (ctx.reqcols == null ? null : ctx.reqcols.check) ? ctx.isadmin ? "40px" : "10px" : ctx.isadmin ? "40px" : "10px"));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.reqcols == null ? null : ctx.reqcols.index == null ? null : ctx.reqcols.index.view);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.reqcolKeys);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.reqcols == null ? null : ctx.reqcols.extra == null ? null : ctx.reqcols.extra.view);
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, NgStyle, IconComponent, MatMenuModule, MatMenu, MatMenuTrigger], styles: ['\n\n.files-wrapper[_ngcontent-%COMP%] {\n  --drag: 0px;\n  --order: 0px;\n  --checkbox: 30px;\n  --bundle: 65px;\n  --tab: 70px;\n  --links: 0px;\n  --impact: 0px;\n  --relevence: 0px;\n  --pagination: 55px;\n  --exhibit: 120px;\n  --kind: 55px;\n  --doi: 100px;\n  --extra: 20px;\n  --name: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --desc: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --hasname: 2;\n  --hasdesc: 2;\n  --nameShare: calc((var(--hasdesc) - 1) * 0.66 + (2 - var(--hasdesc)) * 1);\n  --descShare: calc((var(--hasname) - 1) * 0.34 + (2 - var(--hasname)) * 1);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%] {\n  display: inline-flex;\n  font-size: 10px;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]:not(header):hover::after, .files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]:not(header).active::after, .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]:not(header):hover::after, .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]:not(header).active::after {\n  content: "";\n  position: absolute;\n  background: rgb(255, 255, 255);\n  width: calc(100% - 40px);\n  border-radius: 12px;\n  height: 100%;\n  right: 0;\n  z-index: 10;\n  box-shadow: 0px 0px 5px 1px rgba(0, 64, 255, 0.501);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%] {\n  width: var(--drag);\n  min-width: var(--drag);\n  max-width: var(--drag);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%] {\n  width: var(--order);\n  min-width: var(--order);\n  max-width: var(--order);\n  border-radius: 10px 0 0 10px;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%] {\n  width: var(--checkbox);\n  min-width: var(--checkbox);\n  max-width: var(--checkbox);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%] {\n  width: var(--bundle);\n  min-width: var(--bundle);\n  max-width: var(--bundle);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%] {\n  width: var(--tab);\n  min-width: var(--tab);\n  max-width: var(--tab);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%] {\n  width: var(--links);\n  min-width: var(--links);\n  max-width: var(--links);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%] {\n  width: var(--impact);\n  min-width: var(--impact);\n  max-width: var(--impact);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%] {\n  width: var(--relevence);\n  min-width: var(--relevence);\n  max-width: var(--relevence);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%] {\n  width: var(--pagination);\n  min-width: var(--pagination);\n  max-width: var(--pagination);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%] {\n  width: var(--exhibit);\n  min-width: var(--exhibit);\n  max-width: var(--exhibit);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {\n  width: var(--kind);\n  min-width: var(--kind);\n  max-width: var(--kind);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%] {\n  width: var(--doi);\n  min-width: var(--doi);\n  max-width: var(--doi);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {\n  width: var(--extra);\n  min-width: var(--extra);\n  max-width: var(--extra);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {\n  max-width: calc((100% - var(--name)) * var(--nameShare));\n  min-width: 240px;\n  flex: 2 1 0;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%] {\n  flex: 1 1 0;\n  max-width: calc((100% - var(--desc)) * var(--descShare));\n  min-width: 180px;\n}\n.sortheader[_ngcontent-%COMP%]   dl.last[_ngcontent-%COMP%] {\n  border-bottom-right-radius: 10px !important;\n  border-top-right-radius: 10px !important;\n}\n/*# sourceMappingURL=filehader.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FilehaderComponent, { className: "FilehaderComponent", filePath: "src\\app\\shared\\components\\myfiles\\filehader\\filehader.component.ts", lineNumber: 25 });
})();

// src/app/shared/components/recentfile/recentfile.component.ts
var RecentfileComponent_Conditional_1_Defer_2_DepsFn = () => [import("./chunk-X4EFFCO3.js").then((m) => m.EmptyComponent)];
var RecentfileComponent_Conditional_2_Defer_2_DepsFn = () => [NgIf, import("./chunk-X4EFFCO3.js").then((m) => m.EmptyComponent), import("./chunk-BWXTNXLU.js").then((m) => m.IconComponent)];
function RecentfileComponent_div_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 10, 1);
    \u0275\u0275text(2, "Clear History");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "mat-menu", 11, 2)(5, "div")(6, "h6", 12);
    \u0275\u0275text(7, "Confirm Delete ?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 13)(9, "btn", 14);
    \u0275\u0275listener("click", function RecentfileComponent_div_0_Conditional_4_Template_btn_click_9_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.clearRecentFile());
    });
    \u0275\u0275text(10, "Clear");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "btn", 15);
    \u0275\u0275text(12, "Cancel");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const delete_r3 = \u0275\u0275reference(4);
    \u0275\u0275property("matMenuTriggerFor", delete_r3);
  }
}
function RecentfileComponent_div_0_doccard_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "doccard", 16);
    \u0275\u0275listener("click", function RecentfileComponent_div_0_doccard_8_Template_doccard_click_0_listener() {
      const x_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.changeFile(x_r5));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275property("detail", x_r5);
  }
}
function RecentfileComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "h4", 6);
    \u0275\u0275text(3, "Recently Viewed");
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, RecentfileComponent_div_0_Conditional_4_Template, 13, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "cdk-virtual-scroll-viewport", 7, 0)(7, "div", 8);
    \u0275\u0275template(8, RecentfileComponent_div_0_doccard_8_Template, 1, 1, "doccard", 9);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275conditional(4, ctx_r1.recent_list.length ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("itemSize", 120);
    \u0275\u0275advance(3);
    \u0275\u0275property("cdkVirtualForOf", ctx_r1.recent_list);
  }
}
function RecentfileComponent_Conditional_1_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17)(1, "h6", 6);
    \u0275\u0275text(2, "Preview panel");
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "empty", 18);
    \u0275\u0275elementEnd();
  }
}
function RecentfileComponent_Conditional_1_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function RecentfileComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, RecentfileComponent_Conditional_1_Defer_0_Template, 4, 0)(1, RecentfileComponent_Conditional_1_DeferPlaceholder_1_Template, 1, 0);
    \u0275\u0275defer(2, 0, RecentfileComponent_Conditional_1_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(!(ctx_r1.recent_list == null ? null : ctx_r1.recent_list.length) && !ctx_r1.ForLinkview);
  }
}
function RecentfileComponent_Conditional_2_Defer_0_empty_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "empty", 20)(1, "div", 21)(2, "h6", 22);
    \u0275\u0275text(3, "Adding a link");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 23)(5, "span");
    \u0275\u0275text(6, "1. Choose a file");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span");
    \u0275\u0275text(8, "2. Click on the ");
    \u0275\u0275element(9, "icon", 24);
    \u0275\u0275text(10, " iconto add file/doc level link. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "span");
    \u0275\u0275text(12, "\xA0\xA0\xA0 Simply begin highlighting any text to create text level link. ");
    \u0275\u0275elementEnd();
    \u0275\u0275element(13, "img", 25);
    \u0275\u0275elementEnd()()();
  }
}
function RecentfileComponent_Conditional_2_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, RecentfileComponent_Conditional_2_Defer_0_empty_0_Template, 14, 0, "empty", 19);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngIf", !(ctx_r1.recent_list == null ? null : ctx_r1.recent_list.length));
  }
}
function RecentfileComponent_Conditional_2_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function RecentfileComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, RecentfileComponent_Conditional_2_Defer_0_Template, 1, 1)(1, RecentfileComponent_Conditional_2_DeferPlaceholder_1_Template, 1, 0);
    \u0275\u0275defer(2, 0, RecentfileComponent_Conditional_2_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(!(ctx_r1.recent_list == null ? null : ctx_r1.recent_list.length) && !ctx_r1.ForLinkview);
  }
}
var RecentfileComponent = class _RecentfileComponent {
  constructor(myfileS, cdr) {
    this.myfileS = myfileS;
    this.cdr = cdr;
    this.changeRecent = new EventEmitter();
    this.ForLinkview = false;
    this.isPresent = false;
    this.recent_list = [];
  }
  ngOnInit() {
  }
  ngOnChanges(changes) {
  }
  activeFiledata() {
    return __async(this, null, function* () {
      var mdl = { nCaseid: this.nCaseid, nSectionid: this.nSectionid, cType: this.isPresent ? "P" : "M" };
      console.log(mdl);
      const res = yield this.myfileS.getrecentfile(mdl);
      this.recent_list = [...res];
      this.cdr.detectChanges();
    });
  }
  clearRecentFile() {
    return __async(this, null, function* () {
      var mdl = { nCaseid: this.nCaseid, nSectionid: this.nSectionid, cType: this.isPresent ? "P" : "M" };
      const res = yield this.myfileS.clearRecent(mdl);
      if (res)
        this.recent_list = [];
      this.cdr.detectChanges();
    });
  }
  changeFile(x) {
    this.changeRecent.emit({ event: "VIEW", data: x });
  }
  static {
    this.\u0275fac = function RecentfileComponent_Factory(t) {
      return new (t || _RecentfileComponent)(\u0275\u0275directiveInject(MyfileService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RecentfileComponent, selectors: [["recentfiles"]], inputs: { nCaseid: "nCaseid", ForLinkview: "ForLinkview", nSectionid: "nSectionid", isPresent: "isPresent" }, outputs: { changeRecent: "changeRecent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 3, consts: [["recviewport", ""], ["t", "matMenuTrigger"], ["delete", "matMenu"], ["class", "h-full w-full bg-white rounded-base flex flex-col", 4, "ngIf"], [1, "h-full", "w-full", "bg-white", "rounded-base", "flex", "flex-col"], [1, "heading", "flex", "items-center", "gap-2.5", "content-between", "p-5"], [1, "text-lg", "font-semibold"], [1, "h-full", 3, "itemSize"], [1, "h-full", "flex", "flex-wrap", "px-5", "gap-2.5"], ["class", "block mb-3 w-[370px] max-w-[calc(50%_-_10px)] min-w-[370px] flex-auto ", 3, "detail", "click", 4, "cdkVirtualFor", "cdkVirtualForOf"], ["mode", "white", 1, "ms-auto", 3, "matMenuTriggerFor"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click"], ["mode", "dark"], [1, "block", "mb-3", "w-[370px]", "max-w-[calc(50%_-_10px)]", "min-w-[370px]", "flex-auto", 3, "click", "detail"], [1, "flex", "flex-col", "gap-2.5", "p-5", "h-full", "bg-white", "rounded-base"], ["head", "No file selected", 1, "block", "h-full"], ["class", "block h-full ", 4, "ngIf"], [1, "block", "h-full"], [1, "text-xs", "p-5"], [1, "text-lg", "text-blue-hover", "mb-3"], [1, "flex", "flex-col", "gap-0.5"], ["name", "addfill", "type", "comnicn"], ["src", "../../../../assets/icons/linkhint.png", 1, "mt-3"]], template: function RecentfileComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, RecentfileComponent_div_0_Template, 9, 3, "div", 3)(1, RecentfileComponent_Conditional_1_Template, 4, 1)(2, RecentfileComponent_Conditional_2_Template, 4, 1);
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", ctx.recent_list == null ? null : ctx.recent_list.length);
        \u0275\u0275advance();
        \u0275\u0275conditional(1, !(ctx.recent_list == null ? null : ctx.recent_list.length) && !ctx.ForLinkview ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, !(ctx.recent_list == null ? null : ctx.recent_list.length) && ctx.ForLinkview ? 2 : -1);
      }
    }, dependencies: [CommonModule, NgIf, ScrollingModule, CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport, ButtonComponent, DoccardComponent, MatMenuModule, MatMenu, MatMenuTrigger], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RecentfileComponent, { className: "RecentfileComponent", filePath: "src\\app\\shared\\components\\recentfile\\recentfile.component.ts", lineNumber: 23 });
})();

export {
  FilehaderComponent,
  RecentfileComponent
};
//# sourceMappingURL=chunk-LLILOXWW.js.map
