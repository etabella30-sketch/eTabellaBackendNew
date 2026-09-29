import {
  MatRadioButton,
  MatRadioGroup,
  MatRadioModule
} from "./chunk-ILBZODYX.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
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
  ElementRef,
  __async,
  ɵsetClassDebugInfo,
  ɵɵHostDirectivesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/directive/truncate-tooltip.directive.ts
var TruncateTooltipDirective = class _TruncateTooltipDirective {
  constructor(el, tooltip) {
    this.el = el;
    this.tooltip = tooltip;
  }
  ngAfterViewInit() {
    if (this.truncateClass) {
      requestAnimationFrame(() => this.updateTruncateClass());
    }
  }
  onMouseEnter() {
    const element = this.el.nativeElement;
    const isTruncated = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
    if (isTruncated) {
      this.tooltip.message = this.tooltipText || element.textContent?.trim();
      this.tooltip.disabled = false;
    } else {
      this.tooltip.disabled = true;
    }
    if (this.truncateClass) {
      this.updateTruncateClass();
    }
  }
  updateTruncateClass() {
    const element = this.el.nativeElement;
    const isTruncated = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
    if (isTruncated) {
      element.classList.add(this.truncateClass);
    } else {
      element.classList.remove(this.truncateClass);
    }
  }
  static {
    this.\u0275fac = function TruncateTooltipDirective_Factory(t) {
      return new (t || _TruncateTooltipDirective)(\u0275\u0275directiveInject(ElementRef), \u0275\u0275directiveInject(MatTooltip));
    };
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({ type: _TruncateTooltipDirective, selectors: [["", "truncateTooltip", ""]], hostBindings: function TruncateTooltipDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("mouseenter", function TruncateTooltipDirective_mouseenter_HostBindingHandler() {
          return ctx.onMouseEnter();
        });
      }
    }, inputs: { tooltipText: "tooltipText", truncateClass: "truncateClass" }, standalone: true, features: [\u0275\u0275HostDirectivesFeature([{ directive: MatTooltip, inputs: ["matTooltipPosition", "matTooltipPosition", "matTooltipShowDelay", "matTooltipShowDelay", "matTooltipHideDelay", "matTooltipHideDelay"] }])] });
  }
};

// src/app/shared/components/myfiles/hyper-link-folder/hyper-link-folder.component.ts
function HyperLinkFolderComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.cName, " ");
  }
}
var HyperLinkFolderComponent = class _HyperLinkFolderComponent {
  constructor(dialogRef, data) {
    this.dialogRef = dialogRef;
    this.data = data;
    this.cName = "";
    this.linkType = "T";
    this.prevhyp = true;
    this.cName = data["cName"] || "";
  }
  onSubmit(type) {
    return __async(this, null, function* () {
      if (!this.linkType) {
        return;
      }
      const isDeep = this.linkType.includes("W");
      this.dialogRef.close({
        linkType: this.linkType.replace("W", ""),
        type: this.prevhyp ? "K" : "R",
        isDeep
      });
    });
  }
  close() {
    this.dialogRef.close();
  }
  static {
    this.\u0275fac = function HyperLinkFolderComponent_Factory(t) {
      return new (t || _HyperLinkFolderComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HyperLinkFolderComponent, selectors: [["app-hyper-link-folder"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 25, vars: 10, consts: [[1, "p-5"], [1, "text-base", "flex", "justify-between", "font-semibold", "mb-7"], ["name", "close", 1, "text-xs", "ms-auto", "cursor-pointer", "hover:text-blue-500", 3, "click"], [1, "text-xs", "mb-2"], [1, "my-6"], [1, "text-xs", "flex", "justify-between", "font-semibold", "mb-2"], [1, "gap-2"], [3, "ngModelChange", "ngModel"], [1, "flex", "gap-2", "self-start"], [1, "p-2", "border", "rounded-base", "flex", 3, "value"], [1, "flex", "items-center", "gap-2", "justify-between", "mt-6"], ["name", "info-outline", "type", "extra", "matTooltip", "If you uncheck previous hyperlink will be replaced"], [3, "click"]], template: function HyperLinkFolderComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
        \u0275\u0275text(2, " Hyper Link ");
        \u0275\u0275elementStart(3, "icon", 2);
        \u0275\u0275listener("click", function HyperLinkFolderComponent_Template_icon_click_3_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275template(4, HyperLinkFolderComponent_Conditional_4_Template, 2, 1, "div", 3);
        \u0275\u0275element(5, "hr", 4);
        \u0275\u0275elementStart(6, "h6", 5);
        \u0275\u0275text(7, " Hyper Link Options ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(8, "div", 6)(9, "mat-radio-group", 7);
        \u0275\u0275twoWayListener("ngModelChange", function HyperLinkFolderComponent_Template_mat_radio_group_ngModelChange_9_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.linkType, $event) || (ctx.linkType = $event);
          return $event;
        });
        \u0275\u0275elementStart(10, "div", 8)(11, "mat-radio-button", 9);
        \u0275\u0275text(12, "By Tab");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "mat-radio-button", 9);
        \u0275\u0275text(14, "By Exhibit no.");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "mat-radio-button", 9);
        \u0275\u0275text(16);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(17, "mat-radio-button", 9);
        \u0275\u0275text(18);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(19, "div", 10)(20, "mat-checkbox", 7);
        \u0275\u0275twoWayListener("ngModelChange", function HyperLinkFolderComponent_Template_mat_checkbox_ngModelChange_20_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.prevhyp, $event) || (ctx.prevhyp = $event);
          return $event;
        });
        \u0275\u0275text(21, "Keep Previous Hyperlink ");
        \u0275\u0275element(22, "icon", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(23, "btn", 12);
        \u0275\u0275listener("click", function HyperLinkFolderComponent_Template_btn_click_23_listener() {
          return ctx.onSubmit("K");
        });
        \u0275\u0275text(24, " Start Hyperlink ");
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275conditional(4, ctx.cName ? 4 : -1);
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.linkType);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", "T");
        \u0275\u0275advance(2);
        \u0275\u0275property("value", "E");
        \u0275\u0275advance(2);
        \u0275\u0275property("value", "TW");
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" ", "By Tab Without {}", " ");
        \u0275\u0275advance();
        \u0275\u0275property("value", "EW");
        \u0275\u0275advance();
        \u0275\u0275textInterpolate("By Exhibit No. Without {}");
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.prevhyp);
        \u0275\u0275advance(3);
        \u0275\u0275attribute("isdisabled", !ctx.linkType);
      }
    }, dependencies: [FormsModule, NgControlStatus, NgModel, IconComponent, ButtonComponent, MatRadioModule, MatRadioGroup, MatRadioButton, MatCheckboxModule, MatCheckbox, MatTooltipModule, MatTooltip] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HyperLinkFolderComponent, { className: "HyperLinkFolderComponent", filePath: "src\\app\\shared\\components\\myfiles\\hyper-link-folder\\hyper-link-folder.component.ts", lineNumber: 17 });
})();

export {
  TruncateTooltipDirective,
  HyperLinkFolderComponent
};
//# sourceMappingURL=chunk-QRO7O7ZW.js.map
