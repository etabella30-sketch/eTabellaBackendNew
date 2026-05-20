import {
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
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
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/components/individual/individual-popup/individual-popup.component.ts
var IndividualPopupComponent = class _IndividualPopupComponent {
  constructor(MatDialogRef2, store) {
    this.MatDialogRef = MatDialogRef2;
    this.store = store;
    this.isIndex = false;
    this.bShowAgain = false;
    this.title = "Exit Evidence";
    this.subTitle = "You will close all currently opened documents.";
  }
  onClose(flag) {
    this.MatDialogRef.close(flag);
    this.store.setStorage("bShowAgainExitEvidence", this.bShowAgain ? "Y" : "N");
  }
  close() {
    this.MatDialogRef.close();
  }
  onChange(event) {
    this.bShowAgain = event.checked;
    this.store.setStorage("bShowAgainExitEvidence", this.bShowAgain ? "Y" : "N");
  }
  ngOnInit() {
    this.bShowAgain = this.store.getStorage("bShowAgainExitEvidence") == "Y";
  }
  static {
    this.\u0275fac = function IndividualPopupComponent_Factory(t) {
      return new (t || _IndividualPopupComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _IndividualPopupComponent, selectors: [["individual-popup"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 20, vars: 3, consts: [[1, "fixed", "top-0", "left-0", "z-[99999]", "h-full", "w-full", "grid", "place-items-center"], [1, "absolute", "top-0", "left-0", "z-[10]", "h-full", "w-full", "bg-black/50", 3, "click"], [1, "z-20", "relative", "block", "w-[500px]", "bg-white", "p-10", "rounded-base"], [1, "p-2.5"], ["width", "20", "height", "20", "viewBox", "0 0 20 20", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "mb-2.5", "mx-auto"], ["d", "M5.85556 0C3.56882 2.28674 0 5.85556 0 5.85556V14.1444L5.85556 20H14.1444L20 14.1444V5.85556L14.1444 0", "fill", "#4B4D52"], ["fill-rule", "evenodd", "clip-rule", "evenodd", "d", "M13.7933 6.72303C14.1839 7.11356 14.1839 7.74672 13.7933 8.13725L11.672 10.2586L13.7933 12.3799C14.1839 12.7704 14.1839 13.4036 13.7933 13.7941C13.4028 14.1846 12.7697 14.1846 12.3791 13.7941L10.2578 11.6728L8.13649 13.7941C7.74597 14.1846 7.1128 14.1846 6.72228 13.7941C6.33175 13.4036 6.33175 12.7704 6.72228 12.3799L8.8436 10.2586L6.72228 8.13725C6.33175 7.74672 6.33176 7.11356 6.72228 6.72303C7.1128 6.33251 7.74597 6.33251 8.13649 6.72303L10.2578 8.84435L12.3791 6.72303C12.7697 6.33251 13.4028 6.33251 13.7933 6.72303Z", "fill", "white"], [1, "text-lg", "whitespace-nowrap", "text-center", "font-semibold", "mb-1"], [1, "text-xs", "whitespace-wrap", "text-center"], [1, "flex", "mt-5", "items-center", "justify-center", "gap-2.5"], ["mode", "white", 3, "click"], [3, "ngModelChange", "change", "ngModel"]], template: function IndividualPopupComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275listener("click", function IndividualPopupComponent_Template_div_click_1_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(2, "div", 0)(3, "div", 1);
        \u0275\u0275listener("click", function IndividualPopupComponent_Template_div_click_3_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "div", 2)(5, "div", 3)(6, "div");
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(7, "svg", 4);
        \u0275\u0275element(8, "path", 5)(9, "path", 6);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(10, "h6", 7);
        \u0275\u0275text(11);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "h6", 8);
        \u0275\u0275text(13);
        \u0275\u0275elementEnd()();
        \u0275\u0275element(14, "div");
        \u0275\u0275elementStart(15, "div", 9)(16, "btn", 10);
        \u0275\u0275listener("click", function IndividualPopupComponent_Template_btn_click_16_listener() {
          return ctx.onClose(true);
        });
        \u0275\u0275text(17, "Confirm exit");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(18, "mat-checkbox", 11);
        \u0275\u0275twoWayListener("ngModelChange", function IndividualPopupComponent_Template_mat_checkbox_ngModelChange_18_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.bShowAgain, $event) || (ctx.bShowAgain = $event);
          return $event;
        });
        \u0275\u0275listener("change", function IndividualPopupComponent_Template_mat_checkbox_change_18_listener($event) {
          return ctx.onChange($event);
        });
        \u0275\u0275text(19, "Don\u2019t show this again.");
        \u0275\u0275elementEnd()()()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(11);
        \u0275\u0275textInterpolate1(" ", ctx.title, " ");
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", ctx.subTitle, " ");
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.bShowAgain);
      }
    }, dependencies: [CommonModule, ButtonComponent, MatCheckboxModule, MatCheckbox, FormsModule, NgControlStatus, NgModel] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(IndividualPopupComponent, { className: "IndividualPopupComponent", filePath: "src\\app\\userpanel\\components\\individual\\individual-popup\\individual-popup.component.ts", lineNumber: 16 });
})();

export {
  IndividualPopupComponent
};
//# sourceMappingURL=chunk-OCJW4LQK.js.map
