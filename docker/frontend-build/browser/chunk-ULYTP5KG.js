import {
  NgxFileDropComponent,
  NgxFileDropContentTemplateDirective,
  NgxFileDropModule
} from "./chunk-KG2CXROO.js";
import {
  FileSelectionService
} from "./chunk-LQXMUOGJ.js";
import {
  FileStorageService
} from "./chunk-MQ6OVKEO.js";
import {
  UploadService
} from "./chunk-ZP7PHFH3.js";
import "./chunk-3B3MCZKM.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-EVEACXQX.js";
import "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/upload/uploadfile/uploadfile.component.ts
function uploadfileComponent_ng_template_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "label", 3);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 4)(2, "g", 5)(3, "g", 6);
    \u0275\u0275element(4, "circle", 7);
    \u0275\u0275elementStart(5, "path", 8);
    \u0275\u0275element(6, "animateTransform", 9);
    \u0275\u0275elementEnd()()()()();
  }
}
function uploadfileComponent_ng_template_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "label", 3);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 10);
    \u0275\u0275element(2, "path", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "div", 12);
    \u0275\u0275text(4, " Upload file ");
    \u0275\u0275elementStart(5, "p", 13);
    \u0275\u0275text(6, "Drag & drop file here from your system ");
    \u0275\u0275elementEnd()()();
  }
}
function uploadfileComponent_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2);
    \u0275\u0275listener("click", function uploadfileComponent_ng_template_1_Template_div_click_0_listener() {
      const openFileSelector_r2 = \u0275\u0275restoreView(_r1).openFileSelector;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(!ctx_r2.isDragging ? openFileSelector_r2() : null);
    });
    \u0275\u0275template(1, uploadfileComponent_ng_template_1_Conditional_1_Template, 7, 0, "label", 3)(2, uploadfileComponent_ng_template_1_Conditional_2_Template, 7, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r2.isDragging ? 1 : 2);
  }
}
var uploadfileComponent = class _uploadfileComponent {
  constructor(us, selection, store) {
    this.us = us;
    this.selection = selection;
    this.store = store;
    this.isDragging = false;
    this.dataRecieved = new EventEmitter();
  }
  ngOnInit() {
  }
  onFileDrop(event) {
    return __async(this, null, function* () {
      this.isDragging = true;
      let listData = yield this.selection.fetchFiles(event);
      this.isDragging = false;
      if (listData.length) {
        this.store.setSelectedFileStorage(listData);
        this.dataRecieved.emit("DATA-RECIEVED");
      }
    });
  }
  DragTo(e) {
  }
  static {
    this.\u0275fac = function uploadfileComponent_Factory(t) {
      return new (t || _uploadfileComponent)(\u0275\u0275directiveInject(UploadService), \u0275\u0275directiveInject(FileSelectionService), \u0275\u0275directiveInject(FileStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _uploadfileComponent, selectors: [["uploadfile"]], outputs: { dataRecieved: "dataRecieved" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 2, vars: 2, consts: [[1, "draging-overlay", "w-full", "block", "h-[60vh]", "bg-dark-blue", 3, "onFileDrop", "multiple", "disabled"], ["ngx-file-drop-content-tmp", "", 1, "draging-overlay", "h-full"], [1, "!p-2.5", "w-full", "h-full", "bg-dark-blue", 3, "click"], ["for", "uploadFile1", 1, "bg-white/20", "w-full", "text-white", "text-base", "rounded-base", "h-full", "flex", "items-center", "justify-center", "cursor-pointer", "border-2", "border-stone-300/50", "border-dashed", "mx-auto", "font-[sans-serif]"], ["xmlns", "http://www.w3.org/2000/svg", "width", "38", "height", "38", "viewBox", "0 0 38 38", "stroke", "#fff"], ["fill", "none", "fill-rule", "evenodd"], ["transform", "translate(1 1)", "stroke-width", "2"], ["stroke-opacity", ".5", "cx", "18", "cy", "18", "r", "18"], ["d", "M36 18c0-9.94-8.06-18-18-18"], ["attributeName", "transform", "type", "rotate", "from", "0 18 18", "to", "360 18 18", "dur", "1s", "repeatCount", "indefinite"], ["width", "48", "height", "41", "viewBox", "0 0 48 41", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M21 21.4193H27V10.7526H36L24 0.0859375L12 10.7526H21V21.4193ZM30 15.4193V19.5313L43.737 24.0859L24 30.6273L4.263 24.0859L18 19.5313V15.4193L0 21.4193V32.0859L24 40.0859L48 32.0859V21.4193L30 15.4193Z", "fill", "white"], [1, "text-sm", "font-semibold", "ms-6"], [1, "text-xs", "font-normal", "mt-1", "mb-2"]], template: function uploadfileComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "ngx-file-drop", 0);
        \u0275\u0275listener("onFileDrop", function uploadfileComponent_Template_ngx_file_drop_onFileDrop_0_listener($event) {
          return ctx.onFileDrop($event);
        });
        \u0275\u0275template(1, uploadfileComponent_ng_template_1_Template, 3, 1, "ng-template", 1);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275property("multiple", true)("disabled", ctx.isDragging);
      }
    }, dependencies: [NgxFileDropModule, NgxFileDropComponent, NgxFileDropContentTemplateDirective] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(uploadfileComponent, { className: "uploadfileComponent", filePath: "src\\app\\adminpanel\\components\\upload\\uploadfile\\uploadfile.component.ts", lineNumber: 16 });
})();
export {
  uploadfileComponent
};
//# sourceMappingURL=chunk-ULYTP5KG.js.map
