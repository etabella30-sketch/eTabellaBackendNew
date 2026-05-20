import "./chunk-YQJXVIAQ.js";
import {
  SourceCardComponent
} from "./chunk-X7K4VII4.js";
import {
  IndividualService
} from "./chunk-GNZXOHZW.js";
import "./chunk-2HPWN6DG.js";
import {
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import {
  FormsModule
} from "./chunk-CIO7JDBK.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
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
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/myfiles/selected-docs/selected-docs.component.ts
var _forTrack0 = ($index, $item) => $item.nBundledetailid;
function SelectedDocsComponent_For_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "source-card", 9);
    \u0275\u0275listener("cardevent", function SelectedDocsComponent_For_10_Template_source_card_cardevent_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.cardevent($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const detail_r3 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("detail", detail_r3)("isCheckbox", true)("isAllChecked", ctx_r1.isAllChecked);
  }
}
function SelectedDocsComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 10);
    \u0275\u0275listener("click", function SelectedDocsComponent_Conditional_12_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnSubmit());
    });
    \u0275\u0275text(1, "Confirm");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("disabled", !ctx_r1.isSelected);
    \u0275\u0275attribute("isdisabled", !ctx_r1.isSelected);
  }
}
function SelectedDocsComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 11);
    \u0275\u0275listener("click", function SelectedDocsComponent_Conditional_13_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnSubmit());
    });
    \u0275\u0275text(1, "Open");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "btn", 12);
    \u0275\u0275listener("click", function SelectedDocsComponent_Conditional_13_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onClose());
    });
    \u0275\u0275text(3, "Close preview");
    \u0275\u0275elementEnd();
  }
}
var SelectedDocsComponent = class _SelectedDocsComponent {
  constructor(individualService, cdr) {
    this.individualService = individualService;
    this.cdr = cdr;
    this.viewlist = [];
    this.close = new EventEmitter();
    this.OnSave = new EventEmitter();
    this.isSaving = false;
    this.isAllChecked = true;
    this.isSelected = true;
  }
  ngOnInit() {
    this.viewlist.map((item) => item.isChecked = true);
  }
  onClose() {
    this.close.emit();
  }
  checkAll() {
    this.isAllChecked = !this.isAllChecked;
    this.viewlist.map((item) => {
      item.isChecked = this.isAllChecked;
      console.log(`Item ${item.nBundledetailid} checked status: ${item.isChecked}`);
    });
    this.checkSelected();
    this.cdr.detectChanges();
  }
  cardevent(event) {
    if (event.type === "C") {
      this.OnSelect();
    }
  }
  OnSelect() {
    let ind = this.viewlist.findIndex((a) => !a.isChecked);
    if (ind > -1) {
      this.isAllChecked = false;
    } else {
      this.isAllChecked = true;
    }
    this.checkSelected();
  }
  checkSelected() {
    if (this.viewlist.filter((a) => a.isChecked).length > 0) {
      this.isSelected = true;
    } else {
      this.isSelected = false;
    }
  }
  OnSubmit() {
    return __async(this, null, function* () {
      try {
        const selectedFiles = this.viewlist.filter((a) => a.isChecked).map((item) => item.nBundledetailid);
        if (!selectedFiles.length)
          return;
        if (this.isLink) {
          this.OnSave.emit(this.viewlist.filter((a) => a.isChecked));
          return;
        }
        if (this.isSaving)
          return;
        this.isSaving = true;
        const files = yield this.individualService.getTabinfo(selectedFiles);
        if (!files.length) {
          return;
        }
        this.isSaving = false;
        this.OnSave.emit(files);
      } catch (error) {
      }
    });
  }
  static {
    this.\u0275fac = function SelectedDocsComponent_Factory(t) {
      return new (t || _SelectedDocsComponent)(\u0275\u0275directiveInject(IndividualService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SelectedDocsComponent, selectors: [["selected-docs"]], inputs: { viewlist: "viewlist", isLink: "isLink" }, outputs: { close: "close", OnSave: "OnSave" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 14, vars: 2, consts: [[1, "flex", "bg-white", "rounded-base", "flex-col", "max-h-full", "overflow-hidden", "h-fit", "w-full"], [1, "p-5", "flex", "items-center", "gap-2.5", "pb-3"], [1, "text-lg", "font-semibold"], [1, "underline", "text-xs", "block", "ms-auto", "cursor-pointer", "select-none", 3, "click"], ["name", "close", 1, "text-xs", 3, "click"], [1, "h-fit", "overflow-auto", "flex", "flex-col", "gap-4", "w-full", "px-5"], ["addcls", "!p-0 mt-3", "gap", "S", 3, "detail", "isCheckbox", "isAllChecked"], [1, "p-5", "mt-4", "flex", "items-center", "gap-2.5"], ["addcls", "w-full", 1, "w-full", 3, "disabled"], ["addcls", "!p-0 mt-3", "gap", "S", 3, "cardevent", "detail", "isCheckbox", "isAllChecked"], ["addcls", "w-full", 1, "w-full", 3, "click", "disabled"], ["addcls", "w-full", 1, "w-full", 3, "click"], ["mode", "white", "addcls", "w-full", 1, "w-full", 3, "click"]], template: function SelectedDocsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "header", 1)(2, "span", 2);
        \u0275\u0275text(3, "Expand View");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "span", 3);
        \u0275\u0275listener("click", function SelectedDocsComponent_Template_span_click_4_listener() {
          return ctx.checkAll();
        });
        \u0275\u0275text(5);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(6, "icon", 4);
        \u0275\u0275listener("click", function SelectedDocsComponent_Template_icon_click_6_listener() {
          return ctx.onClose();
        });
        \u0275\u0275text(7, "Close");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(8, "div", 5);
        \u0275\u0275repeaterCreate(9, SelectedDocsComponent_For_10_Template, 1, 3, "source-card", 6, _forTrack0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "footer", 7);
        \u0275\u0275template(12, SelectedDocsComponent_Conditional_12_Template, 2, 2, "btn", 8)(13, SelectedDocsComponent_Conditional_13_Template, 4, 0);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(5);
        \u0275\u0275textInterpolate1("", !ctx.isAllChecked ? "Select" : "Deselect", " all");
        \u0275\u0275advance(4);
        \u0275\u0275repeater(ctx.viewlist);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(12, ctx.isLink ? 12 : 13);
      }
    }, dependencies: [FormsModule, MatCheckboxModule, IconComponent, ButtonComponent, SourceCardComponent], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SelectedDocsComponent, { className: "SelectedDocsComponent", filePath: "src\\app\\shared\\components\\myfiles\\selected-docs\\selected-docs.component.ts", lineNumber: 21 });
})();
export {
  SelectedDocsComponent
};
//# sourceMappingURL=chunk-7FI3Q4W2.js.map
