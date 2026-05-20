import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __spreadProps,
  __spreadValues,
  ɵsetClassDebugInfo,
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
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeResourceUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/components/quick-preview/quick-preview.component.ts
function QuickPreviewComponent_Conditional_0_Conditional_4_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275element(1, "h6", 9);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("innerHtml", item_r3, \u0275\u0275sanitizeHtml);
  }
}
function QuickPreviewComponent_Conditional_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5)(1, "div", 6)(2, "div", 7);
    \u0275\u0275repeaterCreate(3, QuickPreviewComponent_Conditional_0_Conditional_4_For_4_Template, 2, 1, "div", 8, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r1.jTexts);
  }
}
function QuickPreviewComponent_Conditional_0_Conditional_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "iframe", 11, 0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("id", "iframe")("src", ctx_r1.path, \u0275\u0275sanitizeResourceUrl);
  }
}
function QuickPreviewComponent_Conditional_0_Conditional_5_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "span", 13);
    \u0275\u0275text(2, "No Image");
    \u0275\u0275elementEnd()();
  }
}
function QuickPreviewComponent_Conditional_0_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275template(1, QuickPreviewComponent_Conditional_0_Conditional_5_Conditional_1_Template, 2, 2, "iframe", 11)(2, QuickPreviewComponent_Conditional_0_Conditional_5_Conditional_2_Template, 3, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, (ctx_r1.detail == null ? null : ctx_r1.detail.nBundledetailid) && !ctx_r1.isLoading ? 1 : 2);
  }
}
function QuickPreviewComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2);
    \u0275\u0275listener("dblclick", function QuickPreviewComponent_Conditional_0_Template_div_dblclick_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.previewDoc());
    });
    \u0275\u0275elementStart(1, "header", 3)(2, "span", 4);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(4, QuickPreviewComponent_Conditional_0_Conditional_4_Template, 5, 0, "div", 5)(5, QuickPreviewComponent_Conditional_0_Conditional_5_Template, 3, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", (ctx_r1.detail.jLinktype == null ? null : ctx_r1.detail.jLinktype.type) == "H" ? " Source Text" : "Destination Document Quickview", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(4, (ctx_r1.detail.jLinktype == null ? null : ctx_r1.detail.jLinktype.type) == "H" ? 4 : 5);
  }
}
function QuickPreviewComponent_Conditional_1_Conditional_4_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 19);
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275property("innerHtml", x_r5, \u0275\u0275sanitizeHtml);
  }
}
function QuickPreviewComponent_Conditional_1_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16)(1, "div", 17)(2, "div", 18);
    \u0275\u0275repeaterCreate(3, QuickPreviewComponent_Conditional_1_Conditional_4_For_4_Template, 1, 1, "div", 19, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275classMap(!ctx_r1.fullMode ? "!w-[380px]" : "");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.detail.jOTexts);
  }
}
function QuickPreviewComponent_Conditional_1_Conditional_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "iframe", 11, 0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("id", "iframe")("src", ctx_r1.path, \u0275\u0275sanitizeResourceUrl);
  }
}
function QuickPreviewComponent_Conditional_1_Conditional_5_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "span", 13);
    \u0275\u0275text(2, "No Image");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275classMap(!ctx_r1.fullMode ? "!w-[380px]" : "");
  }
}
function QuickPreviewComponent_Conditional_1_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275template(1, QuickPreviewComponent_Conditional_1_Conditional_5_Conditional_1_Template, 2, 2, "iframe", 11)(2, QuickPreviewComponent_Conditional_1_Conditional_5_Conditional_2_Template, 3, 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, (ctx_r1.detail == null ? null : ctx_r1.detail.nBundledetailid) && !ctx_r1.isLoading ? 1 : 2);
  }
}
function QuickPreviewComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275listener("dblclick", function QuickPreviewComponent_Conditional_1_Template_div_dblclick_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.previewDoc());
    });
    \u0275\u0275elementStart(1, "header", 15)(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(4, QuickPreviewComponent_Conditional_1_Conditional_4_Template, 5, 2, "div", 16)(5, QuickPreviewComponent_Conditional_1_Conditional_5_Template, 3, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", (ctx_r1.detail == null ? null : ctx_r1.detail.jOTexts == null ? null : ctx_r1.detail.jOTexts.length) ? "Source Text" : "Destination Document Quickview", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(4, (ctx_r1.detail == null ? null : ctx_r1.detail.jOTexts == null ? null : ctx_r1.detail.jOTexts.length) ? 4 : 5);
  }
}
var QuickPreviewComponent = class _QuickPreviewComponent {
  constructor(cf, cdr) {
    this.cf = cf;
    this.cdr = cdr;
    this.isSource = false;
    this.jTexts = [];
    this.isOnSameTab = false;
    this.OnEvent = new EventEmitter();
    this.onPage = 1;
    this.isLoading = true;
    this.onPdf = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data.event == "ON-INDIVIDUAL") {
        this.previewDoc();
      }
    };
  }
  ngOnInit() {
    debugger;
    this.detail;
    if (this.detail?.jOTexts?.length || this.detail.jOT.length) {
      this.jTexts = this.detail.jOTexts || this.detail.jOT || [];
    }
    try {
      if (this.detail?.jLinktype?.nPage) {
        this.onPage = this.detail?.jLinktype?.nPage;
      } else if (this.detail?.jLinktype?.pages && this.detail?.jLinktype?.pages?.length) {
        this.onPage = this.detail?.jLinktype?.pages[0];
      } else if (this.detail?.jLinktype?.start > 1) {
        this.onPage = this.detail?.jLinktype?.start;
      }
    } catch (error) {
    }
    if (this.detail.nBundledetailid)
      this.path = this.cf.senitizeQuick(this.detail.nBundledetailid, this.onPage, this.nCaseid);
    this.isLoading = false;
    this.cdr.detectChanges();
  }
  ngOnChanges(changes) {
    if (changes["changes"] && !changes["changes"].firstChange) {
    }
  }
  previewDoc() {
    debugger;
    if (!this.detail?.nBundledetailid)
      return;
    let pg = 1;
    try {
      if (this.detail?.jLinktype?.nPage) {
        pg = this.detail?.jLinktype?.nPage;
      } else if (this.detail?.jLinktype?.pages && this.detail?.jLinktype?.pages?.length) {
        pg = this.detail?.jLinktype?.pages[0];
      } else if (this.detail?.jLinktype?.start > 1) {
        pg = this.detail?.jLinktype?.start;
      }
    } catch (error) {
    }
    if (this.isOnSameTab) {
      this.OnEvent.emit({ event: "OPEN-FILE", data: __spreadProps(__spreadValues({}, this.detail), { pg }) });
    } else {
      this.cf.openHyperLinkFile(this.detail.nBundledetailid, this.nCaseid, null, null, null, pg);
    }
  }
  static {
    this.\u0275fac = function QuickPreviewComponent_Factory(t) {
      return new (t || _QuickPreviewComponent)(\u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _QuickPreviewComponent, selectors: [["quick-preview"]], hostBindings: function QuickPreviewComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("message", function QuickPreviewComponent_message_HostBindingHandler($event) {
          return ctx.onPdf($event);
        }, false, \u0275\u0275resolveWindow);
      }
    }, inputs: { detail: "detail", nCaseid: "nCaseid", fullMode: "fullMode", isSource: "isSource", jTexts: "jTexts", isOnSameTab: "isOnSameTab" }, outputs: { OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [["embeddedIframe", ""], [1, "h-fit", "flex", "flex-col", "w-[800px]", "relative", "z-20", "bg-white", "rounded-base", "mb-14"], [1, "h-fit", "flex", "flex-col", "w-[800px]", "relative", "z-20", "bg-white", "rounded-base", "mb-14", 3, "dblclick"], [1, "flex", "p-5", "py-2.5", "items-center", "text-lg", "cursor-pointer"], [1, "font-semibold"], [1, "h-full", "max-h-[73vh]", "px-5", "pb-5", "overflow-auto"], [1, "w-full"], [1, "border-4", "border-tab", "min-h-28", "max-h-[50vh]", "rounded-base", "text-xs", "px-2.5", "py-2.5", "overflow-auto"], [1, "overflow-auto"], [1, "pb-2", "mb-2", "text-xs", "border-b", "border-neutral-300", "last:border-b-0", "last:mb-0", "last:pb-0", 3, "innerHtml"], [1, "h-[70vh]", "px-2.5", "overflow-auto"], [1, "w-full", "h-full", "bg-transparent", 3, "id", "src"], [1, "h-[70vh]", "flex", "items-center", "bg-faint", "w-[700px]", "px-2.5", "justify-center", "overflow-auto"], [1, "opacity-50"], [1, "h-fit", "flex", "flex-col", "w-fit", "relative", "z-20", "bg-white", "rounded-base", 3, "dblclick"], [1, "flex", "p-2", "items-center", "text-lg", "font-semibold", "cursor-pointer"], [1, "h-full", "max-h-[70vh]", "px-2.5", "overflow-auto"], [1, "p-2", "w-[560px]"], [1, "border-4", "border-tab", "min-h-28", "max-h-[50vh]", "rounded-base", "text-xs", "px-2.5", "overflow-auto"], [1, "overflow-auto", "text-xs", "py-3", "border-t", "first:border-t-0", "border-grey", "focus-visible:!border-none", "focus-visible:!outline-none", "focus:!border-none", "focus:!outline-none", 3, "innerHtml"]], template: function QuickPreviewComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, QuickPreviewComponent_Conditional_0_Template, 6, 2, "div", 1)(1, QuickPreviewComponent_Conditional_1_Template, 6, 2);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.isSource ? 0 : 1);
      }
    } });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(QuickPreviewComponent, { className: "QuickPreviewComponent", filePath: "src\\app\\userpanel\\components\\quick-preview\\quick-preview.component.ts", lineNumber: 12 });
})();

export {
  QuickPreviewComponent
};
//# sourceMappingURL=chunk-OQF4RAWS.js.map
