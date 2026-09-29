import {
  NgOptionTemplateDirective,
  NgSelectComponent,
  NgSelectModule
} from "./chunk-E3GVDGCY.js";
import {
  MatRadioButton,
  MatRadioGroup,
  MatRadioModule
} from "./chunk-ILBZODYX.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/components/individual/page-range-tool/page-range-tool.component.ts
var _c0 = () => ({ inputmode: "numeric", pattern: "[0-9]*" });
function PageRangeToolComponent_Conditional_1_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r3 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r3.output);
  }
}
function PageRangeToolComponent_Conditional_1_ng_template_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r4 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r4.output);
  }
}
function PageRangeToolComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-radio-group", 2);
    \u0275\u0275twoWayListener("ngModelChange", function PageRangeToolComponent_Conditional_1_Template_mat_radio_group_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.linkType, $event) || (ctx_r1.linkType = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(1, "mat-radio-button", 3)(2, "span", 4);
    \u0275\u0275text(3, "Page range");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "ng-select", 5);
    \u0275\u0275twoWayListener("ngModelChange", function PageRangeToolComponent_Conditional_1_Template_ng_select_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.startPg, $event) || (ctx_r1.startPg = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function PageRangeToolComponent_Conditional_1_Template_ng_select_change_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnPageSelected("S"));
    })("keydown", function PageRangeToolComponent_Conditional_1_Template_ng_select_keydown_4_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.restrictToNumbers($event));
    });
    \u0275\u0275template(5, PageRangeToolComponent_Conditional_1_ng_template_5_Template, 2, 1, "ng-template", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "span");
    \u0275\u0275text(7, "to");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "ng-select", 5);
    \u0275\u0275twoWayListener("ngModelChange", function PageRangeToolComponent_Conditional_1_Template_ng_select_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.endPg, $event) || (ctx_r1.endPg = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function PageRangeToolComponent_Conditional_1_Template_ng_select_change_8_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnPageSelected("E"));
    })("keydown", function PageRangeToolComponent_Conditional_1_Template_ng_select_keydown_8_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.restrictToNumbers($event));
    });
    \u0275\u0275template(9, PageRangeToolComponent_Conditional_1_ng_template_9_Template, 2, 1, "ng-template", 6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "btn", 7);
    \u0275\u0275listener("click", function PageRangeToolComponent_Conditional_1_Template_btn_click_10_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.createLink());
    });
    \u0275\u0275text(11, " Create link ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.linkType);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.pageRangeTextSelectionData ? "pointer-events-none opacity-50 grayscale" : "");
    \u0275\u0275advance(3);
    \u0275\u0275classMap(ctx_r1.pageRangeTextSelectionData ? "pointer-events-none opacity-50" : "");
    \u0275\u0275property("items", ctx_r1.pagginationRenge);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.startPg);
    \u0275\u0275property("inputAttrs", \u0275\u0275pureFunction0(18, _c0))("disabled", ctx_r1.pageRangeTextSelectionData ? true : false);
    \u0275\u0275advance(4);
    \u0275\u0275classMap(ctx_r1.pageRangeTextSelectionData ? "pointer-events-none opacity-50" : "");
    \u0275\u0275property("items", ctx_r1.endPageOptions);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.endPg);
    \u0275\u0275property("inputAttrs", \u0275\u0275pureFunction0(19, _c0))("disabled", ctx_r1.pageRangeTextSelectionData ? true : false);
    \u0275\u0275advance(2);
    \u0275\u0275classMap((!ctx_r1.startPg || !ctx_r1.endPg) && !ctx_r1.pageRangeTextSelectionData ? "pointer-events-none grayscale opacity-50" : "");
    \u0275\u0275property("isloading", ctx_r1.loading);
  }
}
function PageRangeToolComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 9);
    \u0275\u0275text(1, "Loading page range...");
    \u0275\u0275elementEnd();
  }
}
var PageRangeToolComponent = class _PageRangeToolComponent {
  constructor() {
    this.linkType = "P";
    this.startPg = null;
    this.endPg = null;
    this.pagginationRenge = [];
    this.isIframe = false;
    this.pageRangeSelectorChange = new EventEmitter();
    this.loading = false;
    this.enablePageRangeChange = new EventEmitter();
    this.onPageRangeToolEvent = new EventEmitter();
    this.endPageOptions = [];
    this.pageRangeTextSelectionDataChange = new EventEmitter();
    this.onEmitEvent = new EventEmitter();
  }
  ngOnInit() {
    const totalPage = Number(this.pageRangeSelector.cPage.split("-")[1] || 1);
    this.pagginationRenge = Array.from({ length: totalPage }, (_, i) => ({
      page: i + 1,
      output: i + 1
    }));
    this.endPageOptions = this.pagginationRenge;
  }
  ngOnDestroy() {
  }
  ngOnChanges(changes) {
    debugger;
  }
  closeChild() {
    this.enablePageRange = false;
    this.pageRangeTextSelectionData = null;
    this.pageRangeTextSelectionDataChange.emit(null);
    this.enablePageRangeChange.emit(this.enablePageRange);
  }
  createLink() {
    if (this.pageRangeTextSelectionData) {
      this.enablePageRange = false;
      this.enablePageRangeChange.emit(this.enablePageRange);
      this.onEmitEvent.emit({ event: "TEXT-SELECTED", data: null });
    } else {
      if (!this.startPg || !this.endPg) {
        console.warn("Please select both start and end pages");
        return;
      }
      if (this.endPg >= this.startPg) {
        const linkData = {
          startPage: this.startPg,
          endPage: this.endPg,
          linkType: this.linkType
        };
        this.enablePageRange = false;
        this.enablePageRangeChange.emit(this.enablePageRange);
        this.onPageRangeToolEvent.emit(linkData);
      }
    }
  }
  // Public methods for template
  OnPageSelected(type) {
    if (type === "S" && this.startPg) {
      this.endPageOptions = this.pagginationRenge.filter((p) => p.page > this.startPg);
      if (this.endPg && this.endPg <= this.startPg) {
        this.endPg = null;
      }
    }
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
  static {
    this.\u0275fac = function PageRangeToolComponent_Factory(t) {
      return new (t || _PageRangeToolComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PageRangeToolComponent, selectors: [["page-range-tool"]], inputs: { pagginationRenge: "pagginationRenge", isIframe: "isIframe", pageRangeSelector: "pageRangeSelector", enablePageRange: "enablePageRange", pageRangeTextSelectionData: "pageRangeTextSelectionData" }, outputs: { pageRangeSelectorChange: "pageRangeSelectorChange", enablePageRangeChange: "enablePageRangeChange", onPageRangeToolEvent: "onPageRangeToolEvent", pageRangeTextSelectionDataChange: "pageRangeTextSelectionDataChange", onEmitEvent: "onEmitEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 5, vars: 3, consts: [[1, "page-range-tool", "flex", "items-center", "gap-1", "w-full", "h-[70px]", "justify-center", "bg-black", "text-white", "px-5", "text-xs", "z-[999]"], [1, "close-btn", "ms-4", 3, "click"], [1, "flex", "items-center", "gap-2", 3, "ngModelChange", "ngModel"], ["value", "P", 1, "flex"], [1, "text-white"], ["appendTo", "body", "bindLabel", "output", "bindValue", "page", "placeholder", "--", 1, "pagerefslct", "bg-white", "!px-0", "h-6", "!rounded-base", "w-fit", "overflow-hidden", "!border", "!border-tab", 2, "border", "1px solid #c2c2c2 !important", 3, "ngModelChange", "change", "keydown", "items", "ngModel", "inputAttrs", "disabled"], ["ng-option-tmp", ""], ["addcls", "bg-brand", 1, "text-blue", "ms-20", 3, "click", "isloading"], [1, "text-xs", "font-normal"], [1, "loading-text"]], template: function PageRangeToolComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275template(1, PageRangeToolComponent_Conditional_1_Template, 12, 20)(2, PageRangeToolComponent_Conditional_2_Template, 2, 0);
        \u0275\u0275elementStart(3, "button", 1);
        \u0275\u0275listener("click", function PageRangeToolComponent_Template_button_click_3_listener() {
          return ctx.closeChild();
        });
        \u0275\u0275text(4, " \u2715 ");
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275classMap(!ctx.isIframe ? "absolute bottom-0" : "");
        \u0275\u0275advance();
        \u0275\u0275conditional(1, (ctx.pagginationRenge == null ? null : ctx.pagginationRenge.length) ? 1 : 2);
      }
    }, dependencies: [CommonModule, FormsModule, NgControlStatus, NgModel, MatRadioModule, MatRadioGroup, MatRadioButton, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective, ButtonComponent], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n}\n.page-range-tool[_ngcontent-%COMP%]   .pagerefslct[_ngcontent-%COMP%] {\n  min-width: 60px;\n}\n.page-range-tool[_ngcontent-%COMP%]   .pagerefslct[_ngcontent-%COMP%]     .ng-select-container {\n  border-radius: 4px;\n  border: 1px solid #c2c2c2;\n  background: white;\n  color: #333;\n}\n.page-range-tool[_ngcontent-%COMP%]   .pagerefslct[_ngcontent-%COMP%]     .ng-select-container .ng-value {\n  color: #333;\n  font-size: 12px;\n}\n.page-range-tool[_ngcontent-%COMP%]   .pagerefslct[_ngcontent-%COMP%]     .ng-select-container .ng-placeholder {\n  color: #999;\n  font-size: 12px;\n}\n.page-range-tool[_ngcontent-%COMP%]   .pagerefslct[_ngcontent-%COMP%]     .ng-dropdown-panel {\n  border: 1px solid #c2c2c2;\n  border-radius: 4px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n}\n.page-range-tool[_ngcontent-%COMP%]   .pagerefslct[_ngcontent-%COMP%]     .ng-dropdown-panel .ng-option {\n  padding: 8px 12px;\n  font-size: 12px;\n}\n.page-range-tool[_ngcontent-%COMP%]   .pagerefslct[_ngcontent-%COMP%]     .ng-dropdown-panel .ng-option.ng-option-selected {\n  background-color: #e3f2fd;\n  color: #1976d2;\n}\n.page-range-tool[_ngcontent-%COMP%]   .pagerefslct[_ngcontent-%COMP%]     .ng-dropdown-panel .ng-option:hover {\n  background-color: #f5f5f5;\n}\n.page-range-tool[_ngcontent-%COMP%]   .mat-radio-button[_ngcontent-%COMP%]     .mat-radio-label {\n  color: white;\n  font-size: 12px;\n}\n.page-range-tool[_ngcontent-%COMP%]   .mat-radio-button[_ngcontent-%COMP%]     .mat-radio-label .mat-radio-outer-circle {\n  border-color: white;\n}\n.page-range-tool[_ngcontent-%COMP%]   .mat-radio-button[_ngcontent-%COMP%]     .mat-radio-label .mat-radio-inner-circle {\n  background-color: white;\n}\n.page-range-tool[_ngcontent-%COMP%]   .mat-radio-button[_ngcontent-%COMP%]     .mat-radio-button.mat-radio-checked .mat-radio-outer-circle {\n  border-color: #0066FF;\n}\n.page-range-tool[_ngcontent-%COMP%]   .mat-radio-button[_ngcontent-%COMP%]     .mat-radio-button.mat-radio-checked .mat-radio-inner-circle {\n  background-color: #0066FF;\n}\n.page-range-tool[_ngcontent-%COMP%]   button.text-blue[_ngcontent-%COMP%] {\n  color: #0066FF;\n  background: transparent;\n  border: 1px solid #0066FF;\n  border-radius: 4px;\n  padding: 6px 12px;\n  font-size: 12px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n.page-range-tool[_ngcontent-%COMP%]   button.text-blue[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: #0066FF;\n  color: white;\n}\n.page-range-tool[_ngcontent-%COMP%]   button.text-blue[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n  border-color: #ccc;\n  color: #ccc;\n}\n.page-range-tool[_ngcontent-%COMP%]   button.close-btn[_ngcontent-%COMP%] {\n  background: transparent;\n  border: none;\n  color: white;\n  font-size: 14px;\n  cursor: pointer;\n  padding: 4px 8px;\n  border-radius: 4px;\n  transition: all 0.2s ease;\n}\n.page-range-tool[_ngcontent-%COMP%]   button.close-btn[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: #f0f0f0;\n}\n.page-range-tool[_ngcontent-%COMP%]   .loading-text[_ngcontent-%COMP%] {\n  color: #999;\n  font-style: italic;\n}\n/*# sourceMappingURL=page-range-tool.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PageRangeToolComponent, { className: "PageRangeToolComponent", filePath: "src\\app\\userpanel\\components\\individual\\page-range-tool\\page-range-tool.component.ts", lineNumber: 33 });
})();

export {
  PageRangeToolComponent
};
//# sourceMappingURL=chunk-XZDZSNSM.js.map
