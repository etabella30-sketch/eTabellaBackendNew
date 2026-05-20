import {
  FactService
} from "./chunk-IMS2LHRB.js";
import "./chunk-GHP524MW.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-EVEACXQX.js";
import {
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassProp,
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
  ɵɵpureFunction1,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵtemplate,
  ɵɵtext
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/note/note.component.ts
var _forTrack0 = ($index, $item) => $item.nFSid;
var _c0 = (a0) => ({ "shadow-[0px_0px_8px_#0063ffde]": a0 });
function NoteComponent_For_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 9);
    \u0275\u0275listener("click", function NoteComponent_For_3_Conditional_1_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const g_r3 = \u0275\u0275nextContext().$implicit;
      return \u0275\u0275resetView(g_r3.isedit = true);
    });
    \u0275\u0275element(1, "icon", 10);
    \u0275\u0275elementEnd();
  }
}
function NoteComponent_For_3_Conditional_3_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 12, 0);
    \u0275\u0275listener("focus", function NoteComponent_For_3_Conditional_3_For_2_Template_div_focus_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r4 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r4.isFocus = true);
    })("blur", function NoteComponent_For_3_Conditional_3_For_2_Template_div_blur_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r4 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r4.isFocus = false);
    })("input", function NoteComponent_For_3_Conditional_3_For_2_Template_div_input_0_listener($event) {
      const $index_r6 = \u0275\u0275restoreView(_r4).$index;
      const g_r3 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.updateJText($event, g_r3, $index_r6));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r7 = ctx.$implicit;
    \u0275\u0275property("innerHtml", x_r7, \u0275\u0275sanitizeHtml);
  }
}
function NoteComponent_For_3_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7);
    \u0275\u0275repeaterCreate(1, NoteComponent_For_3_Conditional_3_For_2_Template, 2, 1, "div", 11, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const g_r3 = \u0275\u0275nextContext().$implicit;
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(1, _c0, ctx_r4.isFocus));
    \u0275\u0275advance();
    \u0275\u0275repeater(g_r3.jTexts);
  }
}
function NoteComponent_For_3_Conditional_4_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 13);
  }
  if (rf & 2) {
    const y_r8 = ctx.$implicit;
    \u0275\u0275property("innerHTML", y_r8, \u0275\u0275sanitizeHtml);
  }
}
function NoteComponent_For_3_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, NoteComponent_For_3_Conditional_4_For_1_Template, 1, 1, "span", 13, \u0275\u0275repeaterTrackByIdentity);
  }
  if (rf & 2) {
    const g_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275repeater(g_r3.jTexts);
  }
}
function NoteComponent_For_3_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 14);
    \u0275\u0275listener("click", function NoteComponent_For_3_Conditional_5_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r9);
      const g_r3 = \u0275\u0275nextContext().$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.SaveNote(g_r3));
    });
    \u0275\u0275text(1, " Save ");
    \u0275\u0275elementEnd();
  }
}
function NoteComponent_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275listener("click", function NoteComponent_For_3_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275template(1, NoteComponent_For_3_Conditional_1_Template, 2, 0, "span", 5);
    \u0275\u0275elementStart(2, "div", 6);
    \u0275\u0275template(3, NoteComponent_For_3_Conditional_3_Template, 3, 3, "div", 7)(4, NoteComponent_For_3_Conditional_4_Template, 2, 0)(5, NoteComponent_For_3_Conditional_5_Template, 2, 0, "button", 8);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const g_r3 = ctx.$implicit;
    const $index_r10 = ctx.$index;
    \u0275\u0275classProp("mt-3", $index_r10);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !g_r3.isedit ? 1 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, g_r3.isedit ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(4, !g_r3.isedit ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(5, g_r3.isedit ? 5 : -1);
  }
}
var NoteComponent = class _NoteComponent {
  constructor(factService, cdr, tost) {
    this.factService = factService;
    this.cdr = cdr;
    this.tost = tost;
    this.isFocus = false;
    this.isEmpty = false;
    this.OnEvent = new EventEmitter();
    this.linkIds = [];
    this.isLoading = true;
    this.factlist = [];
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.factlist = yield this.factService.getFactDetails(this.linkIds);
      if (!this.factlist.length) {
        this.isLoading = false;
        this.tost.error("No data found");
      }
      this.isLoading = false;
      this.cdr.detectChanges();
      this.factlist.map((a) => a["jUpdatedTexts"] = [...a.jTexts || [""]]);
    });
  }
  updateJText(event, g, index) {
    const target = event.target;
    if (!g.jUpdatedTexts)
      g.jUpdatedTexts = [];
    g.jUpdatedTexts[index] = target.innerHTML;
    this.isEmpty = false;
    if (!target.innerText || target.innerText.trim() == "") {
      this.isEmpty = true;
    }
    this.cdr.detectChanges();
  }
  SaveNote(g) {
    return __async(this, null, function* () {
      debugger;
      this.linkIds;
      if (!g.jUpdatedTexts?.length)
        g.jUpdatedTexts = g.jTexts;
      yield this.factService.updateFactNote({ nFSid: g.nFSid, jTexts: g.jUpdatedTexts || [""] });
      g.jTexts = g.jUpdatedTexts;
      g.isedit = false;
    });
  }
  static {
    this.\u0275fac = function NoteComponent_Factory(t) {
      return new (t || _NoteComponent)(\u0275\u0275directiveInject(FactService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NoteComponent, selectors: [["note"]], inputs: { linkIds: "linkIds" }, outputs: { OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 4, vars: 0, consts: [["editableDiv", ""], [1, "bg-white", "size-8.5", "flex", "items-center", "justify-center", "border", "rounded-full", "absolute", "-right-4", "-top-4", "z-50", "hover:text-blue-on"], ["name", "close", 1, "text-xs"], [1, "relative", 3, "mt-3"], [1, "relative", 3, "click"], [1, "bg-white", "size-8.5", "flex", "items-center", "justify-center", "border", "rounded-full", "absolute", "-right-4", "top-7", "z-50", "hover:text-blue-on"], [1, "p-2", "rounded-base", "bg-white", "relative", "z-10", "shadow-[0px_4px_4px_#00000040]", "max-h-32", "overflow-auto"], [1, "border", "min-h-5", "max-h-28", "rounded-base", "text-xs", "px-2.5", "overflow-auto", "bg-white", 3, "ngClass"], ["mode", "white", 1, "!text-blue-on", "absolute", "bottom-3.5", "right-3.5", "hover:bg-white", "px-2.5", "flex", "items-center", "gap-2", "shadow-none", "active:bg-white", "w-fit", "text-xs", "bg-white", "h-8.5", "rounded-base", "border", "border-blue-deactivate"], [1, "bg-white", "size-8.5", "flex", "items-center", "justify-center", "border", "rounded-full", "absolute", "-right-4", "top-7", "z-50", "hover:text-blue-on", 3, "click"], ["name", "edit", 1, "text-xs"], ["contenteditable", "true", 1, "overflow-auto", "text-xs", "py-3", "border-t", "first:border-t-0", "border-grey", "bg-white", "focus-visible:!border-none", "focus-visible:!outline-none", "focus:!border-none", "focus:!outline-none", 3, "innerHtml"], ["contenteditable", "true", 1, "overflow-auto", "text-xs", "py-3", "border-t", "first:border-t-0", "border-grey", "bg-white", "focus-visible:!border-none", "focus-visible:!outline-none", "focus:!border-none", "focus:!outline-none", 3, "focus", "blur", "input", "innerHtml"], [1, "text-xs", 3, "innerHTML"], ["mode", "white", 1, "!text-blue-on", "absolute", "bottom-3.5", "right-3.5", "hover:bg-white", "px-2.5", "flex", "items-center", "gap-2", "shadow-none", "active:bg-white", "w-fit", "text-xs", "bg-white", "h-8.5", "rounded-base", "border", "border-blue-deactivate", 3, "click"]], template: function NoteComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "span", 1);
        \u0275\u0275element(1, "icon", 2);
        \u0275\u0275elementEnd();
        \u0275\u0275repeaterCreate(2, NoteComponent_For_3_Template, 6, 6, "div", 3, _forTrack0);
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.factlist);
      }
    }, dependencies: [IconComponent, NgClass] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NoteComponent, { className: "NoteComponent", filePath: "src\\app\\shared\\components\\note\\note.component.ts", lineNumber: 17 });
})();
export {
  NoteComponent
};
//# sourceMappingURL=chunk-Y7S2OKZA.js.map
