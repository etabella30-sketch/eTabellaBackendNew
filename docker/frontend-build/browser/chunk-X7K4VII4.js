import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  InputFlags,
  __async,
  booleanAttribute,
  ɵsetClassDebugInfo,
  ɵɵInputTransformsFeature,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵpureFunction4,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/source-card/source-card.component.ts
var _c0 = (a0, a1, a2, a3) => ({ "bg-faint": a0, "bg-[#313131]": a1, "bg-white": a2, "h-full": a3 });
var _c1 = (a0, a1, a2) => ({ "gap-6": a0, "gap-2": a1, "flex-col !gap-1": a2 });
var _c2 = (a0) => ({ "!w-full": a0 });
var _c3 = (a0, a1, a2) => ({ "brak-word truncate": a0, "line-clamp-2": a1, "text-white": a2 });
var _c4 = (a0) => ({ "text-white": a0 });
var _c5 = (a0) => ({ "text-whte": a0 });
var _c6 = (a0, a1) => ({ "text-lg": a0, "text-base": a1 });
function SourceCardComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 1);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(2, _c5, ctx_r0.mode == "dark"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.cardheading, " ");
  }
}
function SourceCardComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "span", 14);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "btn", 15);
    \u0275\u0275listener("click", function SourceCardComponent_Conditional_2_Template_btn_click_3_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r0.openCompareMode());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(4, "svg", 16)(5, "mask", 17);
    \u0275\u0275element(6, "rect", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275element(7, "rect", 19)(8, "rect", 19)(9, "rect", 19);
    \u0275\u0275elementStart(10, "mask", 20);
    \u0275\u0275element(11, "rect", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275element(12, "rect", 22)(13, "rect", 22)(14, "rect", 22);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r0.compareheading, " ");
    \u0275\u0275advance();
    \u0275\u0275property("square", true);
  }
}
function SourceCardComponent_Conditional_4_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 27);
    \u0275\u0275listener("click", function SourceCardComponent_Conditional_4_Conditional_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.openPreview());
    });
    \u0275\u0275element(1, "icon", 28);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("square", true)("active", ctx_r0.isSelected);
    \u0275\u0275advance();
    \u0275\u0275property("name", "factOut");
  }
}
function SourceCardComponent_Conditional_4_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 27);
    \u0275\u0275listener("click", function SourceCardComponent_Conditional_4_Conditional_2_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.ViewThis());
    });
    \u0275\u0275element(1, "icon", 29);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("square", true)("active", ctx_r0.isSelected);
  }
}
function SourceCardComponent_Conditional_4_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 30);
    \u0275\u0275listener("click", function SourceCardComponent_Conditional_4_Conditional_3_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.deleteThis());
    });
    \u0275\u0275element(1, "icon", 31);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("square", true);
  }
}
function SourceCardComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23);
    \u0275\u0275template(1, SourceCardComponent_Conditional_4_Conditional_1_Template, 2, 3, "btn", 24)(2, SourceCardComponent_Conditional_4_Conditional_2_Template, 2, 2, "btn", 24)(3, SourceCardComponent_Conditional_4_Conditional_3_Template, 2, 1, "btn", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "div", 26);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r0.previewBtn ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ctx_r0.linkbtn ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r0.deletebtn ? 3 : -1);
  }
}
function SourceCardComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 32);
    \u0275\u0275twoWayListener("ngModelChange", function SourceCardComponent_Conditional_5_Template_mat_checkbox_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r0.detail.isChecked, $event) || (ctx_r0.detail.isChecked = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function SourceCardComponent_Conditional_5_Template_mat_checkbox_change_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.OnSelect());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.detail.isChecked);
  }
}
function SourceCardComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 5);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(1, _c6, ctx_r0.iconS == "M", ctx_r0.iconS == "S"));
  }
}
function SourceCardComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 6);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(1, _c6, ctx_r0.iconS == "M", ctx_r0.iconS == "S"));
  }
}
function SourceCardComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 7);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(1, _c6, ctx_r0.iconS == "M", ctx_r0.iconS == "S"));
  }
}
function SourceCardComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" ", ctx_r0.detail == null ? null : ctx_r0.detail.nPage, " ");
  }
}
function SourceCardComponent_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" ", ctx_r0.pages, " ");
  }
}
function SourceCardComponent_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate2(" ", ctx_r0.jLinktype == null ? null : ctx_r0.jLinktype.start, " - ", ctx_r0.jLinktype == null ? null : ctx_r0.jLinktype.end, " ");
  }
}
function SourceCardComponent_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(2, _c4, ctx_r0.mode == "dark"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Exhibit No ", ctx_r0.exhibit, "");
  }
}
function SourceCardComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 11)(1, "btn", 33);
    \u0275\u0275listener("click", function SourceCardComponent_Conditional_20_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.deleteThis());
    });
    \u0275\u0275element(2, "icon", 31);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("square", true);
  }
}
function SourceCardComponent_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 12)(1, "btn", 34);
    \u0275\u0275listener("click", function SourceCardComponent_Conditional_21_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.view());
    });
    \u0275\u0275text(2, " View ");
    \u0275\u0275elementEnd()();
  }
}
function SourceCardComponent_Conditional_22_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 37);
    \u0275\u0275listener("click", function SourceCardComponent_Conditional_22_Conditional_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.viewsource());
    });
    \u0275\u0275element(1, "icon", 38);
    \u0275\u0275elementEnd();
  }
}
function SourceCardComponent_Conditional_22_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 39);
    \u0275\u0275listener("click", function SourceCardComponent_Conditional_22_Conditional_2_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.OnExternalFactSheet());
    });
    \u0275\u0275element(1, "icon", 40);
    \u0275\u0275elementEnd();
  }
}
function SourceCardComponent_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13);
    \u0275\u0275template(1, SourceCardComponent_Conditional_22_Conditional_1_Template, 2, 0, "btn", 35)(2, SourceCardComponent_Conditional_22_Conditional_2_Template, 2, 0, "btn", 36);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r0.viewsourcebtn ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ctx_r0.launchbtn ? 2 : -1);
  }
}
var SourceCardComponent = class _SourceCardComponent {
  constructor(cdr, scureStorage) {
    this.cdr = cdr;
    this.scureStorage = scureStorage;
    this.launchbtn = false;
    this.viewsourcebtn = false;
    this.isveritical = false;
    this.iconEnd = false;
    this.heading = false;
    this.isFactL = false;
    this.hfull = false;
    this.deletebtn = false;
    this.linkbtn = false;
    this.isSelected = false;
    this.deletebtnend = false;
    this.viewbtn = false;
    this.isnavigate = false;
    this.mode = "";
    this.addcls = "";
    this.gap = "M";
    this.iconS = "M";
    this.type = "F";
    this.isCheckbox = false;
    this.truncate = true;
    this.isAllChecked = true;
    this.linktype = null;
    this.cardevent = new EventEmitter();
    this.onView = new EventEmitter();
    this.OnEvent = new EventEmitter();
    this.cardheading = "Source File";
    this.previewBtn = false;
    this.filename = "";
    this.tab = "";
    this.bundle = "";
    this.page = "";
    this.exhibit = "";
    this.jLinktype = {};
    this.compareheading = "";
  }
  OnSelect() {
    this.cardevent.emit({ "type": "C", data: "" });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.nOwnid = yield this.scureStorage.getUserId();
      this.filename = this.detail.cName || this.detail.cFilename || "";
      this.tab = this.detail.cTab || "\u2212";
      this.bundle = this.detail.cBundletag || "\u2212";
      this.exhibit = this.detail.cExhibitno || "";
      this.linkData();
      if (this.isnavigate && this.cardheading == "") {
        this.cardheading = "Current Location";
      }
    });
  }
  linkData() {
    this.jLinktype = this.linktype || this.detail.jLinktype || {};
    try {
      if (this.jLinktype?.pages && this.jLinktype?.pages?.length) {
        this.pages = this.jLinktype.pages.join(",");
      }
    } catch (error) {
    }
    this.cdr.detectChanges();
  }
  ngOnChanges(changes) {
    if (changes["linktype"] && !changes["linktype"].firstChange) {
      this.linkData();
    }
    this.cdr.detectChanges();
  }
  deleteThis() {
    this.cardevent.emit({ "type": "D" });
  }
  // ViewThis() {
  //   this.cardevent.emit({ 'type': 'V' });
  // }
  ViewThis() {
    this.cardevent.emit({ "type": "OPEN-DOC-LINK" });
  }
  view() {
    this.onView.emit(true);
  }
  OnExternalFactSheet() {
    debugger;
    let page = 1;
    if (this.detail?.nPage) {
      page = this.detail?.nPage;
    } else if (this.detail?.jLinktype?.pages && this.detail?.jLinktype?.pages.length) {
      page = this.detail?.jLinktype?.pages[0];
    } else if (this.detail?.jLinktype?.start) {
      page = this.detail?.jLinktype?.start;
    }
    this.OnEvent.emit({ event: "EXTERNAL-FACT-SHEET", data: { nFSid: this.detail.nFSid, nBundledetailid: this.detail.nBundledetailid, nPage: page } });
  }
  viewsource() {
    this.OnEvent.emit({ event: "VIEW-SOURCE", data: this.detail });
  }
  OnSourceCardClick() {
    this.cardevent.emit({ type: "OPEN-IN-QUICK-VIEW" });
  }
  openPreview() {
    this.cardevent.emit({ "type": "OPEN-PREVIEW", data: this.detail });
  }
  openCompareMode() {
    this.cardevent.emit({ event: "OPEN-COMPARE-MODE", data: { nDocid: this.detail.nDocid, nBundledetailid: this.detail.nBundledetailid } });
  }
  static {
    this.\u0275fac = function SourceCardComponent_Factory(t) {
      return new (t || _SourceCardComponent)(\u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SourceCardComponent, selectors: [["source-card"]], inputs: { launchbtn: [InputFlags.HasDecoratorInputTransform, "launchbtn", "launchbtn", booleanAttribute], viewsourcebtn: [InputFlags.HasDecoratorInputTransform, "viewsourcebtn", "viewsourcebtn", booleanAttribute], isveritical: [InputFlags.HasDecoratorInputTransform, "isveritical", "isveritical", booleanAttribute], iconEnd: [InputFlags.HasDecoratorInputTransform, "iconEnd", "iconEnd", booleanAttribute], detail: "detail", heading: "heading", isFactL: "isFactL", hfull: "hfull", deletebtn: "deletebtn", linkbtn: "linkbtn", isSelected: "isSelected", deletebtnend: "deletebtnend", viewbtn: "viewbtn", isnavigate: "isnavigate", mode: "mode", nUserid: "nUserid", addcls: "addcls", gap: "gap", iconS: "iconS", type: "type", isCheckbox: "isCheckbox", truncate: "truncate", isAllChecked: "isAllChecked", linktype: "linktype", cardheading: "cardheading", previewBtn: "previewBtn", compareheading: "compareheading" }, outputs: { cardevent: "cardevent", onView: "onView", OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275InputTransformsFeature, \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 23, vars: 43, consts: [[1, "p-2.5", "rounded-base", "group", "relative", "overflow-hidden", 3, "click", "ngClass"], [1, "text-xs", "font-semibold", "mb-2.5", 3, "ngClass"], [1, "flex", "items-center", "justify-between", "gap-2", "mb-2.5"], [1, "w-full", "flex", "gap-6", "rounded-base", "cursor-pointer", 3, "dblclick", "ngClass"], [1, "me-2", 3, "ngModel"], ["name", "textF", "type", "indicn", 3, "ngClass"], ["name", "pageF", "type", "indicn", 3, "ngClass"], ["name", "file", "type", "indicn", 3, "ngClass"], [1, "top", "w-[calc(100%_-_54px)]", 3, "ngClass"], [1, "text-xs", "font-semibold", "w-full", 3, "ngClass"], [1, "text-xxs", "mt-1", "leading-none", 3, "ngClass"], [1, "h-auto", "flex", "items-start", "flex-col", "gap-2", "ms-auto"], [1, "h-auto", "flex", "items-start", "flex-col", "gap-2", "ms-auto", "opacity-0", "group-hover:opacity-100"], [1, "absolute", "inset-0", "z-20", "hidden", "items-center", "justify-center", "gap-2", "bg-grey/80", "group-hover:flex"], [1, "text-xs", "font-semibold", "px-2.5", "py-1", "bg-tab", "text-black", "rounded-full"], ["mode", "clear", "matTooltip", "Open in Compare Mode", "addcls", "hover:!text-blue-on hover:!bg-blue-deactivate", 1, "text-white", 3, "click", "square"], ["width", "18", "height", "16", "viewBox", "0 0 18 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["id", "path-1-inside-1_13059_54008", "fill", "currentColor"], ["x", "0.875", "y", "2.92188", "width", "6.25", "height", "10.1562", "rx", "1"], ["x", "0.875", "y", "2.92188", "width", "6.25", "height", "10.1562", "rx", "1", "stroke", "currentColor", "stroke-width", "4", "mask", "url(#path-1-inside-1_13059_54008)"], ["id", "path-2-inside-2_13059_54008", "fill", "currentColor"], ["x", "10.875", "y", "2.92188", "width", "6.25", "height", "10.1562", "rx", "1"], ["x", "10.875", "y", "2.92188", "width", "6.25", "height", "10.1562", "rx", "1", "stroke", "currentColor", "stroke-width", "4", "mask", "url(#path-2-inside-2_13059_54008)"], [1, "h-auto", "flex", "items-start", "flex-col", "gap-2"], ["mode", "outlined", 3, "square", "active"], ["mode", "outlined", 3, "square"], [1, "w-px", "h-auto", "bg-grey/30", "mx-3"], ["mode", "outlined", 3, "click", "square", "active"], ["type", "indicn", 1, "text-base", 3, "name"], ["name", "docOut", "type", "indicn"], ["mode", "outlined", 3, "click", "square"], ["name", "removefill"], [1, "me-2", 3, "ngModelChange", "change", "ngModel"], ["mode", "outlined", "addcls", "border-none", 3, "click", "square"], ["mode", "darkwhite", 3, "click"], ["square", "", "mode", "outlined", "addcls", "hover:bg-white active:bg-white", "matTooltip", "View Source"], ["square", "", "mode", "outlined", "addcls", "hover:bg-white active:bg-white", "matTooltip", "Launch Factsheet"], ["square", "", "mode", "outlined", "addcls", "hover:bg-white active:bg-white", "matTooltip", "View Source", 3, "click"], ["name", "factOut", "type", "indicn", 1, "text-sm"], ["square", "", "mode", "outlined", "addcls", "hover:bg-white active:bg-white", "matTooltip", "Launch Factsheet", 3, "click"], ["name", "factD", "type", "indicn", 1, "text-sm"]], template: function SourceCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275listener("click", function SourceCardComponent_Template_div_click_0_listener() {
          return ctx.isnavigate ? ctx.OnSourceCardClick() : null;
        });
        \u0275\u0275template(1, SourceCardComponent_Conditional_1_Template, 2, 4, "h6", 1)(2, SourceCardComponent_Conditional_2_Template, 15, 2, "div", 2);
        \u0275\u0275elementStart(3, "div", 3);
        \u0275\u0275listener("dblclick", function SourceCardComponent_Template_div_dblclick_3_listener() {
          return ctx.viewsource();
        });
        \u0275\u0275template(4, SourceCardComponent_Conditional_4_Template, 5, 3)(5, SourceCardComponent_Conditional_5_Template, 1, 1, "mat-checkbox", 4);
        \u0275\u0275elementStart(6, "div");
        \u0275\u0275template(7, SourceCardComponent_Conditional_7_Template, 1, 4, "icon", 5)(8, SourceCardComponent_Conditional_8_Template, 1, 4, "icon", 6)(9, SourceCardComponent_Conditional_9_Template, 1, 4, "icon", 7);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(10, "div", 8)(11, "h6", 9);
        \u0275\u0275text(12);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "h6", 10);
        \u0275\u0275text(14);
        \u0275\u0275template(15, SourceCardComponent_Conditional_15_Template, 1, 1)(16, SourceCardComponent_Conditional_16_Template, 1, 1)(17, SourceCardComponent_Conditional_17_Template, 1, 2);
        \u0275\u0275text(18, " ] ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(19, SourceCardComponent_Conditional_19_Template, 2, 4, "h6", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275template(20, SourceCardComponent_Conditional_20_Template, 3, 1, "div", 11)(21, SourceCardComponent_Conditional_21_Template, 3, 0, "div", 12);
        \u0275\u0275elementEnd();
        \u0275\u0275template(22, SourceCardComponent_Conditional_22_Template, 3, 2, "div", 13);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275classMap(ctx.addcls);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction4(26, _c0, ctx.mode == "light", ctx.mode == "dark", ctx.mode != "dark" && ctx.mode != "light", ctx.hfull));
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.heading ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.compareheading ? 2 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction3(31, _c1, ctx.gap == "M", ctx.gap == "S", ctx.isveritical));
        \u0275\u0275advance();
        \u0275\u0275conditional(4, ctx.linkbtn || ctx.deletebtn || ctx.previewBtn ? 4 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(5, ctx.isCheckbox ? 5 : -1);
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.iconEnd ? "order-2" : "");
        \u0275\u0275advance();
        \u0275\u0275conditional(7, (ctx.jLinktype == null ? null : ctx.jLinktype.type) == "H" ? 7 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(8, (ctx.jLinktype == null ? null : ctx.jLinktype.type) == "P" || (ctx.jLinktype == null ? null : ctx.jLinktype.type) == "C" ? 8 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(9, (ctx.jLinktype == null ? null : ctx.jLinktype.type) == "F" || (ctx.jLinktype == null ? null : ctx.jLinktype.type) == "D" ? 9 : -1);
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.isFactL ? "" : "");
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(35, _c2, ctx.isveritical));
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction3(37, _c3, ctx.truncate, !ctx.truncate, ctx.mode == "dark"));
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" ", ctx.filename, " ");
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(41, _c4, ctx.mode == "dark"));
        \u0275\u0275advance();
        \u0275\u0275textInterpolate2("[ ", ctx.bundle, " | ", ctx.tab, " | ");
        \u0275\u0275advance();
        \u0275\u0275conditional(15, (ctx.detail == null ? null : ctx.detail.nPage) ? 15 : ctx.pages ? 16 : 17);
        \u0275\u0275advance(4);
        \u0275\u0275conditional(19, ctx.exhibit ? 19 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(20, ctx.deletebtnend ? 20 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(21, ctx.viewbtn ? 21 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(22, ctx.launchbtn || ctx.viewsourcebtn ? 22 : -1);
      }
    }, dependencies: [MatCheckboxModule, MatCheckbox, FormsModule, NgControlStatus, NgModel, IconComponent, CommonModule, NgClass, ButtonComponent, MatTooltipModule, MatTooltip], styles: ['@charset "UTF-8";\n\n\n\n.top[_ngcontent-%COMP%] {\n  max-width: 100%;\n  overflow: hidden;\n}\n.top[_ngcontent-%COMP%]   h6[_ngcontent-%COMP%] {\n  display: block;\n  max-width: 8.5rem;\n  width: 100%;\n}\n.top[_ngcontent-%COMP%]   h6.truncate[_ngcontent-%COMP%] {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n/*# sourceMappingURL=source-card.component.css.map */'], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SourceCardComponent, { className: "SourceCardComponent", filePath: "src\\app\\shared\\components\\source-card\\source-card.component.ts", lineNumber: 20 });
})();

export {
  SourceCardComponent
};
//# sourceMappingURL=chunk-X7K4VII4.js.map
