import {
  NgxExtendedPdfViewerComponent,
  NgxExtendedPdfViewerModule,
  PdfFirstPageComponent,
  PdfLastPageComponent,
  PdfNextPageComponent,
  PdfPageNumberComponent,
  PdfPreviousPageComponent,
  PdfZoomToolbarComponent
} from "./chunk-QI7CLXWT.js";
import "./chunk-CIO7JDBK.js";
import "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  ActivatedRoute
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵproperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/userguide/userguide.component.ts
var UserguideComponent = class _UserguideComponent {
  constructor(route) {
    this.route = route;
    this.pdfSrc = "";
    var params = this.route.snapshot.params;
    this.id = params && params["id"] ? params["id"] : 0;
  }
  ngOnInit() {
    debugger;
    if (this.id == "MQ==") {
      this.pdfSrc = "docs/pdf/eTabella_ebundle_guide.pdf";
      console.log("pdfSrc", this.pdfSrc);
    } else {
      this.pdfSrc = "docs/pdf/eTabella_rt_guide.pdf";
      console.log("pdfSrc", this.pdfSrc);
    }
  }
  static {
    this.\u0275fac = function UserguideComponent_Factory(t) {
      return new (t || _UserguideComponent)(\u0275\u0275directiveInject(ActivatedRoute));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UserguideComponent, selectors: [["app-userguide"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 13, vars: 4, consts: [["pdfViewer", ""], [1, "relative", "overflow-visible", "flex", "flex-col"], [1, "guide-toolbars", "flex", "items-center", "p-2.5", "justify-center", "bg-white", "relative", "z-20", "shadow-sm"], ["src", "assets/colorlogo.svg", 1, "w-7", "absolute", "left-4"], [1, "pdf-toolbars", "gap-x-2", "flex", "items-center", "me-2"], [1, "flex", "items-center", "bg-reply", "px-2", "h-8.5", "rounded-base", "w-full", "justify-between", "text-xs"], [1, "flex"], [1, "block", 3, "src", "showToolbar", "activeSidebarView", "showBorders"]], template: function UserguideComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275element(0, "div", 1);
        \u0275\u0275elementStart(1, "div", 2);
        \u0275\u0275element(2, "img", 3);
        \u0275\u0275elementStart(3, "div", 4)(4, "div", 5);
        \u0275\u0275element(5, "pdf-first-page", 6)(6, "pdf-previous-page", 6)(7, "pdf-page-number", 6)(8, "pdf-next-page", 6)(9, "pdf-last-page", 6);
        \u0275\u0275elementEnd();
        \u0275\u0275element(10, "pdf-zoom-toolbar");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(11, "ngx-extended-pdf-viewer", 7, 0);
      }
      if (rf & 2) {
        \u0275\u0275advance(11);
        \u0275\u0275property("src", ctx.pdfSrc)("showToolbar", false)("activeSidebarView", 1)("showBorders", false);
      }
    }, dependencies: [NgxExtendedPdfViewerModule, NgxExtendedPdfViewerComponent, PdfFirstPageComponent, PdfLastPageComponent, PdfNextPageComponent, PdfPageNumberComponent, PdfPreviousPageComponent, PdfZoomToolbarComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UserguideComponent, { className: "UserguideComponent", filePath: "src\\app\\shared\\components\\userguide\\userguide.component.ts", lineNumber: 15 });
})();
export {
  UserguideComponent
};
//# sourceMappingURL=chunk-FV6QI7CX.js.map
