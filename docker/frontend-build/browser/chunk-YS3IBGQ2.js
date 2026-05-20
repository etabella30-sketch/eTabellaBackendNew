import {
  PdfDataService
} from "./chunk-F3YHE7Z5.js";
import {
  SourceCardComponent
} from "./chunk-X7K4VII4.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField
} from "./chunk-Y2GGPNYR.js";
import "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslateService
} from "./chunk-DWVFAK3Q.js";
import "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import "./chunk-6RMJH3FI.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
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
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/pdf/components/linkexplorer-tools/linkexplorer-tools.component.ts
function LinkexplorerToolsComponent_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 6);
    \u0275\u0275element(1, "source-card", 11);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r1 = ctx.$implicit;
    \u0275\u0275property("value", x_r1);
    \u0275\u0275advance();
    \u0275\u0275property("truncate", false)("detail", x_r1);
  }
}
var LinkexplorerToolsComponent = class _LinkexplorerToolsComponent {
  constructor(pdfDataService, cdr, translate) {
    this.pdfDataService = pdfDataService;
    this.cdr = cdr;
    this.translate = translate;
    this.docInfo = null;
    this.linkExplorerMode = null;
    this.linkExplorerType = "F";
    this.linkedList = [];
    this.isLoaded = false;
    this.selectedLink = null;
    this.onEvent = new EventEmitter();
  }
  ngOnInit() {
    void this.loadLinks();
  }
  ngOnChanges(changes) {
    if (changes["linkExplorerType"] && !changes["linkExplorerType"].firstChange) {
      this.isLoaded = false;
      void this.loadLinks();
    }
  }
  linkChange(type) {
    this.selectedLink = null;
    this.linkExplorerType = type;
    this.linkedList = [];
    this.isLoaded = false;
    this.onEvent.emit({ event: "LINK-EXPLORER-TYPE", data: this.linkExplorerType });
  }
  ChangeFile(val) {
    const ind = this.selectedLink ? this.linkedList.findIndex((x) => x === this.selectedLink) : -1;
    if (this.linkedList[ind + val]) {
      this.selectedLink = this.linkedList[ind + val];
      this.changeDoc(this.selectedLink);
      this.cdr.detectChanges();
    }
  }
  changeDoc(e) {
    this.onEvent.emit({ event: "LINK-EXPLORER-CHANGEDOC", data: { file: e, mode: this.linkExplorerMode === "I" ? "O" : "I", type: this.linkExplorerType } });
  }
  getPlaceholder() {
    if (this.linkExplorerMode == "I") {
      if (this.linkExplorerType == "F")
        return this.translate.instant("LINKS.EXPLORER.SELECT_INCOMING_FACTLINK");
      return this.translate.instant("LINKS.EXPLORER.SELECT_INCOMING_DOCLINK");
    } else {
      if (this.linkExplorerType == "F")
        return this.translate.instant("LINKS.EXPLORER.SELECT_OUTGOING_FACTLINK");
      return this.translate.instant("LINKS.EXPLORER.SELECT_OUTGOING_DOCLINK");
    }
  }
  loadLinks() {
    return __async(this, null, function* () {
      this.linkedList = [];
      if (!this.docInfo || !this.docInfo.nBundledetailid || !this.linkExplorerMode) {
        this.cdr.detectChanges();
        return;
      }
      try {
        const res = yield this.pdfDataService.getLinks(this.docInfo.nBundledetailid, `${this.linkExplorerMode}${this.linkExplorerType}`);
        if (Array.isArray(res) && res.length > 0) {
          this.linkedList = res;
        }
      } catch (error) {
        const errMsg = ErrorHandlerUtil.getErrorMessage(error);
        throw new Error(errMsg);
      } finally {
        this.cdr.detectChanges();
      }
    });
  }
  static {
    this.\u0275fac = function LinkexplorerToolsComponent_Factory(t) {
      return new (t || _LinkexplorerToolsComponent)(\u0275\u0275directiveInject(PdfDataService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(TranslateService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LinkexplorerToolsComponent, selectors: [["link-explorer"]], inputs: { docInfo: "docInfo", linkExplorerMode: "linkExplorerMode", linkExplorerType: "linkExplorerType" }, outputs: { onEvent: "onEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 15, vars: 6, consts: [[1, "flex", "bg-grey", "items-center", "gap-3", "h-[54px]", "px-5"], [1, "gap-2", "flex", "text-white"], ["square", "", "mode", "outlined", 3, "click", "addcls"], ["type", "indicn", 3, "name"], [1, "bg-white", "ms-auto", "w-52"], ["panelClass", "min-w-72 !p-2", 1, "text-white", 3, "ngModelChange", "selectionChange", "placeholder", "ngModel"], [1, "my-1", "rounded-base", 3, "value"], ["mode", "outlined", "square", "", "addcls", " !bg-transparent border-none hover:!bg-white/25 hover:border hover:!text-white text-white", 3, "click"], ["name", "chvy"], ["mode", "outlined", "square", "", "addcls", "hover:!bg-white/25 !bg-transparent border-none hover:border hover:!text-white text-white", 3, "click"], ["name", "chvy", 1, "rotate-180"], ["gap", "S", "mode", "light", "type", "T", "addcls", "!bg-transparent !p-0", 1, "block", "m-2", 3, "truncate", "detail"]], template: function LinkexplorerToolsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "btn", 2);
        \u0275\u0275listener("click", function LinkexplorerToolsComponent_Template_btn_click_2_listener() {
          return ctx.linkChange("F");
        });
        \u0275\u0275element(3, "icon", 3);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "btn", 2);
        \u0275\u0275listener("click", function LinkexplorerToolsComponent_Template_btn_click_4_listener() {
          return ctx.linkChange("D");
        });
        \u0275\u0275element(5, "icon", 3);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "mat-form-field", 4)(7, "mat-select", 5);
        \u0275\u0275twoWayListener("ngModelChange", function LinkexplorerToolsComponent_Template_mat_select_ngModelChange_7_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.selectedLink, $event) || (ctx.selectedLink = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function LinkexplorerToolsComponent_Template_mat_select_selectionChange_7_listener() {
          return ctx.changeDoc(ctx.selectedLink);
        });
        \u0275\u0275repeaterCreate(8, LinkexplorerToolsComponent_For_9_Template, 2, 3, "mat-option", 6, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "div", 1)(11, "btn", 7);
        \u0275\u0275listener("click", function LinkexplorerToolsComponent_Template_btn_click_11_listener() {
          return ctx.ChangeFile(-1);
        });
        \u0275\u0275element(12, "icon", 8);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "btn", 9);
        \u0275\u0275listener("click", function LinkexplorerToolsComponent_Template_btn_click_13_listener() {
          return ctx.ChangeFile(1);
        });
        \u0275\u0275element(14, "icon", 10);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275property("addcls", ctx.linkExplorerType != "F" ? "!border-none !bg-transparent !text-white hover:!bg-white/25 hover:!text-white" : "!bg-white/25 !text-white");
        \u0275\u0275advance();
        \u0275\u0275property("name", ctx.linkExplorerMode == "I" ? "factIn" : "factOut");
        \u0275\u0275advance();
        \u0275\u0275property("addcls", ctx.linkExplorerType != "D" ? "!border-none !bg-transparent !text-white hover:!bg-white/25 hover:!text-white" : "!bg-white/25 !text-white");
        \u0275\u0275advance();
        \u0275\u0275property("name", ctx.linkExplorerMode == "I" ? "docIn" : "docOut");
        \u0275\u0275advance(2);
        \u0275\u0275property("placeholder", ctx.getPlaceholder());
        \u0275\u0275twoWayProperty("ngModel", ctx.selectedLink);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.linkedList);
      }
    }, dependencies: [MatSelectModule, MatFormField, MatSelect, MatOption, IconComponent, ButtonComponent, FormsModule, NgControlStatus, NgModel, SourceCardComponent, TranslateModule], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LinkexplorerToolsComponent, { className: "LinkexplorerToolsComponent", filePath: "src\\app\\pdf\\components\\linkexplorer-tools\\linkexplorer-tools.component.ts", lineNumber: 20 });
})();
export {
  LinkexplorerToolsComponent
};
//# sourceMappingURL=chunk-YS3IBGQ2.js.map
