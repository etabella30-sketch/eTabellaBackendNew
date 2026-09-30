import {
  PresentService
} from "./chunk-DRZF5GH5.js";
import "./chunk-UA722RUW.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-EVEACXQX.js";
import "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpropertyInterpolate,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/individual/link-share/link-share.component.ts
var _forTrack0 = ($index, $item) => $item.nCodeid;
var _c0 = (a0) => ({ "!bg-black/30": a0 });
var _c1 = () => ["F", "QF"];
var _c2 = (a0, a1) => ({ "rotate-180": a0, "rotate-[275deg]": a1 });
function LinkShareComponent_Conditional_3_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 7);
    \u0275\u0275listener("click", function LinkShareComponent_Conditional_3_Conditional_3_Template_icon_click_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.unShareHighlight());
    });
    \u0275\u0275elementEnd();
  }
}
function LinkShareComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 3);
    \u0275\u0275listener("click", function LinkShareComponent_Conditional_3_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(!ctx_r1.isAlreadyShared ? ctx_r1.isColapsed = !ctx_r1.isColapsed : ctx_r1.isColapsed = ctx_r1.isColapsed);
    });
    \u0275\u0275elementStart(1, "span", 4);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, LinkShareComponent_Conditional_3_Conditional_3_Template, 1, 0, "icon", 5);
    \u0275\u0275element(4, "icon", 6);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" Share ", ctx_r1.type, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r1.isAlreadyShared ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(\u0275\u0275pureFunction2(4, _c2, !ctx_r1.isColapsed, ctx_r1.isColapsed));
  }
}
function LinkShareComponent_Conditional_4_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 7);
    \u0275\u0275listener("click", function LinkShareComponent_Conditional_4_Conditional_3_Template_icon_click_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.unShareHighlight());
    });
    \u0275\u0275elementEnd();
  }
}
function LinkShareComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 3);
    \u0275\u0275listener("click", function LinkShareComponent_Conditional_4_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.shareThisLink(false));
    });
    \u0275\u0275elementStart(1, "span", 4);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, LinkShareComponent_Conditional_4_Conditional_3_Template, 1, 0, "icon", 5);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" Share ", ctx_r1.type, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r1.isAlreadyShared ? 3 : -1);
  }
}
function LinkShareComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "div", 8);
    \u0275\u0275listener("click", function LinkShareComponent_Conditional_5_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.shareThisLink(false));
    });
    \u0275\u0275elementStart(2, "span", 9);
    \u0275\u0275text(3, "Highlight only");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "div", 8);
    \u0275\u0275listener("click", function LinkShareComponent_Conditional_5_Template_div_click_4_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.shareThisLink(true));
    });
    \u0275\u0275elementStart(5, "span", 9);
    \u0275\u0275text(6, "Highlight with factsheet");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap(\u0275\u0275pureFunction1(4, _c0, ctx_r1.isColapsed));
    \u0275\u0275advance(3);
    \u0275\u0275classMap(\u0275\u0275pureFunction1(6, _c0, ctx_r1.isColapsed));
  }
}
function LinkShareComponent_Conditional_6_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 11);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275propertyInterpolate("src", "assets/icons/" + ctx_r1.remarkIcon + ".svg", \u0275\u0275sanitizeUrl);
  }
}
function LinkShareComponent_Conditional_6_Conditional_7_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275listener("click", function LinkShareComponent_Conditional_6_Conditional_7_For_2_Template_div_click_0_listener() {
      const x_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.setRemark(x_r9));
    });
    \u0275\u0275element(1, "img", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r9 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275classMap(\u0275\u0275pureFunction1(3, _c0, ctx_r1.isRemarksColapsed));
    \u0275\u0275advance();
    \u0275\u0275propertyInterpolate("src", "assets/icons/" + x_r9.jOther.icon + ".svg", \u0275\u0275sanitizeUrl);
  }
}
function LinkShareComponent_Conditional_6_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12);
    \u0275\u0275repeaterCreate(1, LinkShareComponent_Conditional_6_Conditional_7_For_2_Template, 2, 5, "div", 13, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.remarks);
  }
}
function LinkShareComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 10)(2, "span", 3);
    \u0275\u0275listener("click", function LinkShareComponent_Conditional_6_Template_span_click_2_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.isRemarksColapsed = !ctx_r1.isRemarksColapsed);
    });
    \u0275\u0275elementStart(3, "span", 4);
    \u0275\u0275text(4, " Remark ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, LinkShareComponent_Conditional_6_Conditional_5_Template, 1, 1, "img", 11);
    \u0275\u0275element(6, "icon", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, LinkShareComponent_Conditional_6_Conditional_7_Template, 3, 0, "div", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap(\u0275\u0275pureFunction1(6, _c0, ctx_r1.isRemarksColapsed));
    \u0275\u0275advance(4);
    \u0275\u0275conditional(5, ctx_r1.remarkIcon ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(\u0275\u0275pureFunction2(8, _c2, !ctx_r1.isRemarksColapsed, ctx_r1.isRemarksColapsed));
    \u0275\u0275advance();
    \u0275\u0275conditional(7, ctx_r1.isRemarksColapsed ? 7 : -1);
  }
}
var LinkShareComponent = class _LinkShareComponent {
  constructor(presentService, cdr) {
    this.presentService = presentService;
    this.cdr = cdr;
    this.docInfo = {};
    this.isRightClickedChange = new EventEmitter();
    this.sharedLinks = [];
    this.remarksList = [];
    this.isAlreadyShared = false;
    this.isColapsed = false;
    this.remarks = [];
    this.isRemarksColapsed = false;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      const list = yield this.presentService.getPresentLinksSharedBy(this.docInfo?.nPresentid, this.docInfo?.nBundledetailid);
      this.sharedLinks = list[0] || [];
      this.remarksList = list[1] || [];
      this.remarks = yield this.presentService.getRemarks();
      this.cdr.detectChanges();
    });
  }
  ngOnChanges(changes) {
    if (changes["actionLinkAnnot"] && !changes["actionLinkAnnot"].firstChange) {
      this.initDetail();
    }
  }
  initDetail() {
    try {
      this.type = ["F", "QF"].includes(this.actionLinkAnnot?.linktype) ? "Fact" : this.actionLinkAnnot?.linktype == "D" ? "Doc Link" : "Web link";
      this.isAlreadyShared = false;
      this.isRemarksColapsed = false;
      this.isColapsed = false;
      if (this.sharedLinks.findIndex((a) => a.nAId == this.actionLinkAnnot.nAId) > -1) {
        this.isAlreadyShared = true;
      }
      this.remarkIcon = null;
      const obj = this.remarksList.find((a) => a.nAId == this.actionLinkAnnot.nAId);
      if (obj) {
        this.remarkIcon = this.remarks.find((a) => a.nCodeid == obj.nRemarkid)?.jOther?.icon;
      }
    } catch (error) {
    }
    this.cdr.detectChanges();
  }
  shareThisLink(val) {
    return __async(this, null, function* () {
      const res = yield this.presentService.manageLinkShare(this.docInfo?.nPresentid, this.actionLinkAnnot?.nAId, this.docInfo?.nBundledetailid, val, "N");
      if (res.msg == 1) {
      }
      if (this.sharedLinks.findIndex((a) => a.nAId == this.actionLinkAnnot.nAId) == -1) {
        this.sharedLinks.push({ nAId: this.actionLinkAnnot.nAId, isWithLink: val });
      }
      this.close();
    });
  }
  unShareHighlight() {
    return __async(this, null, function* () {
      const res = yield this.presentService.manageLinkShare(this.docInfo?.nPresentid, this.actionLinkAnnot?.nAId, this.docInfo?.nBundledetailid, false, "D");
      if (res.msg == 1) {
      }
      const ind = this.sharedLinks.findIndex((a) => a.nAId == this.actionLinkAnnot.nAId);
      if (ind > -1) {
        this.sharedLinks.splice(ind, 1);
      }
      this.close();
    });
  }
  close() {
    this.isAlreadyShared = false;
    this.isColapsed = false;
    this.isRightClicked = false;
    this.isRemarksColapsed = false;
    this.isRightClickedChange.emit(this.isRightClicked);
    this.cdr.detectChanges();
  }
  setRemark(x) {
    return __async(this, null, function* () {
      yield this.presentService.setRemarkToLink(this.docInfo.nPresentid, this.actionLinkAnnot.nAId, this.docInfo.nBundledetailid, x.nCodeid);
      this.remarkIcon = x.jOther?.icon;
      const ind = this.remarksList.findIndex((a) => a.nAId == this.actionLinkAnnot.nAId);
      if (ind > -1) {
        this.remarksList[ind].nRemarkid = x.nCodeid;
      } else {
        this.remarksList.push({ nAId: this.actionLinkAnnot.nAId, nRemarkid: x.nCodeid, nPRid: null });
      }
      this.cdr.detectChanges();
    });
  }
  static {
    this.\u0275fac = function LinkShareComponent_Factory(t) {
      return new (t || _LinkShareComponent)(\u0275\u0275directiveInject(PresentService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LinkShareComponent, selectors: [["link-share"]], inputs: { docInfo: "docInfo", actionLinkAnnot: "actionLinkAnnot", isRightClicked: "isRightClicked" }, outputs: { isRightClickedChange: "isRightClickedChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 7, vars: 9, consts: [[1, "!rounded-none", "w-[200px]", "!bg-dark-blue"], [1, "!p-3", "hover:!bg-white/10"], [1, "text-xs", "justify-end", "text-white/60", "flex", "items-center", "gap-2"], [1, "text-xs", "justify-end", "text-white/60", "flex", "items-center", "gap-2", 3, "click"], [1, "me-auto"], ["name", "removefill", 1, "text-white", "text-lg", "me-2"], ["name", "chvy", 1, "block", "text-xs", "transition-all"], ["name", "removefill", 1, "text-white", "text-lg", "me-2", 3, "click"], [1, "!p-3", "hover:!bg-white/10", "!ps-10", 3, "click"], [1, "text-xs", "text-white"], [1, "!p-3", "hover:!bg-white/10", "relative"], [3, "src"], [1, "absolute", "left-full", "top-0", "bg-dark-blue"], [1, "p-3", "hover:!bg-white/10", 3, "class"], [1, "p-3", "hover:!bg-white/10", 3, "click"], [1, "min-w-9", 3, "src"]], template: function LinkShareComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275elementContainerStart(1);
        \u0275\u0275elementStart(2, "div", 1);
        \u0275\u0275template(3, LinkShareComponent_Conditional_3_Template, 5, 7, "span", 2)(4, LinkShareComponent_Conditional_4_Template, 4, 2);
        \u0275\u0275elementEnd();
        \u0275\u0275template(5, LinkShareComponent_Conditional_5_Template, 7, 8, "div");
        \u0275\u0275elementContainerEnd();
        \u0275\u0275template(6, LinkShareComponent_Conditional_6_Template, 8, 11, "ng-container");
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275classMap(\u0275\u0275pureFunction1(5, _c0, ctx.isColapsed));
        \u0275\u0275advance();
        \u0275\u0275conditional(3, \u0275\u0275pureFunction0(7, _c1).includes(ctx.actionLinkAnnot == null ? null : ctx.actionLinkAnnot.linktype) ? 3 : 4);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(5, ctx.isColapsed ? 5 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(6, \u0275\u0275pureFunction0(8, _c1).includes(ctx.actionLinkAnnot == null ? null : ctx.actionLinkAnnot.linktype) ? 6 : -1);
      }
    }, dependencies: [IconComponent], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LinkShareComponent, { className: "LinkShareComponent", filePath: "src\\app\\presentation\\components\\individual\\link-share\\link-share.component.ts", lineNumber: 15 });
})();
export {
  LinkShareComponent
};
//# sourceMappingURL=chunk-WTY7J65W.js.map
