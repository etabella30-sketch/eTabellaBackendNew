import {
  NgxExtendedPdfViewerComponent,
  NgxExtendedPdfViewerModule,
  pdfDefaultOptions
} from "./chunk-QI7CLXWT.js";
import {
  PdfDataService
} from "./chunk-F3YHE7Z5.js";
import {
  CdkDrag,
  DragDropModule
} from "./chunk-EZOJOG5D.js";
import {
  NetworkStatusService
} from "./chunk-RUQGLVFQ.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  ActivatedRoute,
  DomSanitizer
} from "./chunk-FNSUDMGC.js";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  __spreadValues,
  firstValueFrom,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpropertyInterpolate,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeResourceUrl,
  ɵɵsanitizeUrl,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/pdf/modules/shared/imageShared.moduls.ts
var ViewerModule = class _ViewerModule {
  static {
    this.\u0275fac = function ViewerModule_Factory(t) {
      return new (t || _ViewerModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({ type: _ViewerModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({});
  }
};

// src/app/pdf/interfaces/doc-viewer.constants.ts
var DOC_VIEWER_STATIC = {
  validExtensions: ["doc", "docx", "jpeg", "jpg", "mp3", "msg", "pdf", "png", "ppt", "pptx", "tiff", "xls", "xlsm", "xlsx"]
};
var DOC_VIEWER_EVENTS = {
  OPEN_INDIVIDUAL: "OPEN-INDIVIDUAL",
  OPEN_ATTACHMENT: "OPEN-ATTACHMENT",
  CLOSE_REALTIME: "CLOSE_REALTIME",
  DOWNLOAD: "DOWNLOAD",
  LINK_ADDED_DOC: "LINK-ADDED-DOC"
};

// src/app/shared/components/img/img.component.ts
var _c0 = ["mainImage"];
function ImgComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "img", 3, 0);
    \u0275\u0275listener("dblclick", function ImgComponent_Conditional_0_Template_img_dblclick_2_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnDoubleClick());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "div", 4)(5, "button", 5);
    \u0275\u0275listener("click", function ImgComponent_Conditional_0_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.zoomIn());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 6);
    \u0275\u0275element(7, "path", 7)(8, "path", 8);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "button", 9);
    \u0275\u0275listener("click", function ImgComponent_Conditional_0_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.zoomOut());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(10, "svg", 10);
    \u0275\u0275element(11, "path", 7);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(12, "button", 9);
    \u0275\u0275listener("click", function ImgComponent_Conditional_0_Template_button_click_12_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.rotateLeft());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(13, "svg", 11);
    \u0275\u0275element(14, "path", 12)(15, "path", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275element(16, "icon", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "button", 9);
    \u0275\u0275listener("click", function ImgComponent_Conditional_0_Template_button_click_17_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.rotateRight());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(18, "svg", 15);
    \u0275\u0275element(19, "path", 16)(20, "path", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275element(21, "icon", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "button", 9);
    \u0275\u0275listener("click", function ImgComponent_Conditional_0_Template_button_click_22_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.resetTransform());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(23, "svg", 18);
    \u0275\u0275element(24, "path", 19)(25, "path", 20)(26, "path", 21)(27, "path", 22);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275styleProp("transform", ctx_r1.getImageTransform());
    \u0275\u0275property("src", ctx_r1.images[ctx_r1.currentIndex].url, \u0275\u0275sanitizeUrl)("alt", ctx_r1.images[ctx_r1.currentIndex].alt);
  }
}
function ImgComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1, "No images to display");
    \u0275\u0275elementEnd();
  }
}
var ImgComponent = class _ImgComponent {
  constructor() {
    this.images = [];
    this.OnEvent = new EventEmitter();
    this.currentIndex = 0;
    this.scale = 1;
    this.rotation = 0;
  }
  ngAfterViewInit() {
    this.resetTransform();
  }
  previousImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.resetTransform();
    }
  }
  nextImage() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.resetTransform();
    }
  }
  setCurrentImage(index) {
    this.currentIndex = index;
    this.resetTransform();
  }
  zoomIn() {
    this.scale += 0.1;
    this.updateTransform();
  }
  zoomOut() {
    if (this.scale > 0.1) {
      this.scale -= 0.1;
      this.updateTransform();
    }
  }
  rotateLeft() {
    this.rotation -= 90;
    this.updateTransform();
  }
  rotateRight() {
    this.rotation += 90;
    this.updateTransform();
  }
  resetTransform() {
    this.scale = 1;
    this.rotation = 0;
    this.updateTransform();
  }
  updateTransform() {
    if (this.mainImageEl) {
      this.mainImageEl.nativeElement.style.transform = this.getImageTransform();
    }
  }
  getImageTransform() {
    return `scale(${this.scale}) rotate(${this.rotation}deg)`;
  }
  OnDoubleClick() {
    this.OnEvent.emit({ event: "OPEN-IMAGE", data: null });
  }
  static {
    this.\u0275fac = function ImgComponent_Factory(t) {
      return new (t || _ImgComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ImgComponent, selectors: [["image"]], viewQuery: function ImgComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.mainImageEl = _t.first);
      }
    }, inputs: { images: "images" }, outputs: { OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [["mainImage", ""], [1, "image-viewer", "bg-[#cccccc]", "overflow-hidden", "h-full"], ["cdkDrag", "", 1, "image-container"], [1, "main-image", 3, "dblclick", "src", "alt"], [1, "controls", "absolute", "right-2.5", "bottom-2", "z-40", "flex", "flex-col", "gap-3"], ["matTooltip", "", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "width", "20", "height", "20", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "lucide", "lucide-plus"], ["d", "M5 12h14"], ["d", "M12 5v14"], [3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "width", "20", "height", "20", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "lucide", "lucide-minus"], ["xmlns", "http://www.w3.org/2000/svg", "width", "20", "height", "20", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "lucide", "lucide-rotate-ccw"], ["d", "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"], ["d", "M3 3v5h5"], ["name", "rotate", "type", "tool"], ["xmlns", "http://www.w3.org/2000/svg", "width", "20", "height", "20", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "lucide", "lucide-rotate-cw"], ["d", "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"], ["d", "M21 3v5h-5"], ["xmlns", "http://www.w3.org/2000/svg", "width", "20", "height", "20", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "lucide", "lucide-repeat"], ["d", "m17 2 4 4-4 4"], ["d", "M3 11v-1a4 4 0 0 1 4-4h14"], ["d", "m7 22-4-4 4-4"], ["d", "M21 13v1a4 4 0 0 1-4 4H3"]], template: function ImgComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, ImgComponent_Conditional_0_Template, 28, 4, "div", 1)(1, ImgComponent_Conditional_1_Template, 2, 0);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.images.length > 0 ? 0 : 1);
      }
    }, dependencies: [CommonModule, DragDropModule, CdkDrag, IconComponent, MatTooltipModule, MatTooltip], styles: ["\n\n.image-viewer[_ngcontent-%COMP%] {\n  max-width: 100%;\n  margin: 0 auto;\n}\n.image-container[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n.main-image[_ngcontent-%COMP%] {\n  max-width: 100%;\n  max-height: 100%;\n  transition: transform 0.3s ease;\n}\n.controls[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  margin: 10px 0;\n}\n.info[_ngcontent-%COMP%] {\n  text-align: center;\n  margin-bottom: 10px;\n}\n.thumbnails[_ngcontent-%COMP%] {\n  display: flex;\n  overflow-x: auto;\n}\n.thumbnail[_ngcontent-%COMP%] {\n  width: 60px;\n  height: 60px;\n  object-fit: cover;\n  margin-right: 5px;\n  cursor: pointer;\n  opacity: 0.6;\n}\n.thumbnail.active[_ngcontent-%COMP%] {\n  opacity: 1;\n}\nbutton[_ngcontent-%COMP%] {\n  width: 40px;\n  height: 40px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: white;\n  border: 1px solid #555;\n  border-radius: 50%;\n  opacity: 0.8;\n}\nbutton[_ngcontent-%COMP%]:hover {\n  opacity: 1;\n}\n/*# sourceMappingURL=img.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ImgComponent, { className: "ImgComponent", filePath: "src\\app\\shared\\components\\img\\img.component.ts", lineNumber: 19 });
})();

// src/app/pdf/service/email.service.ts
var EmailService = class _EmailService {
  constructor(http) {
    this.http = http;
  }
  getEmailparser(nId, nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.uploadservice}/fileconvert/email_parse`, { "nBundledetailid": nId, nCaseid }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getAttechment(path, id) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("cPath", path).set("nId", id.toString());
      let res;
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/email/getattechment`, {
          params,
          responseType: "blob"
          // Ensure we receive the response as a Blob
        }));
      } catch (error) {
        console.error("Error fetching attachment:", error);
        res = null;
      }
      return res;
    });
  }
  checkFileExists(url) {
    return __async(this, null, function* () {
      try {
        const response = yield this.http.head(url).toPromise();
        return true;
      } catch (error) {
        if (error instanceof HttpErrorResponse) {
          return false;
        }
        throw error;
      }
    });
  }
  getFileUrl(cPath) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.uploadservice}/fileconvert/get-file-url`, {
          params: { cPath }
        }));
        debugger;
        return res;
      } catch (error) {
        if (error instanceof HttpErrorResponse) {
          console.error("File not found:", error);
          return {};
        }
      }
    });
  }
  static {
    this.\u0275fac = function EmailService_Factory(t) {
      return new (t || _EmailService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _EmailService, factory: _EmailService.\u0275fac, providedIn: "root" });
  }
};

// src/app/pdf/components/doc-viewer/doc-viewer.component.ts
var _c02 = ["htmlIframe"];
var _c1 = ["iframeElement"];
var _c2 = (a0) => ({ "w-1/2 ms-auto": a0 });
var _c3 = (a0) => ({ type: a0 });
var _c4 = (a0) => ({ url: a0, alt: "" });
var _c5 = (a0) => [a0];
function DocViewerComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 5)(2, "div", 6)(3, "div", 7)(4, "button", 8);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275listener("click", function DocViewerComponent_ng_container_1_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeRealtimePdf());
    });
    \u0275\u0275element(6, "icon", 9);
    \u0275\u0275pipe(7, "translate");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275attribute("aria-label", \u0275\u0275pipeBind1(5, 2, "PDF_TOOLBAR.CLOSE_PREVIEW"));
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(7, 4, "PDF_TOOLBAR.CLOSE_PREVIEW"));
  }
}
function DocViewerComponent_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 10)(2, "button", 11);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275listener("click", function DocViewerComponent_ng_container_3_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.linkDoc());
    });
    \u0275\u0275element(4, "icon", 12);
    \u0275\u0275elementStart(5, "span", 13);
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "translate");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275attribute("aria-label", \u0275\u0275pipeBind1(3, 2, "DOC_VIEWER.ADD_LINK_ARIA"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(7, 4, "DOC_VIEWER.ADD_TO_LINK", \u0275\u0275pureFunction1(7, _c3, ctx_r1.hightlightMode === "F" ? "Fact" : "Doc")));
  }
}
function DocViewerComponent_ng_container_4_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "iframe", 15);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("title", \u0275\u0275pipeBind1(2, 1, "DOC_VIEWER.DOCUMENT_VIEWER_TITLE"));
  }
}
function DocViewerComponent_ng_container_4_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 16)(1, "div", 17)(2, "div", 18)(3, "div", 19)(4, "h6", 20);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "button", 21);
    \u0275\u0275listener("click", function DocViewerComponent_ng_container_4_ng_template_2_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.downloadURI(ctx_r1.path));
    });
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 2, "DOC_VIEWER.OFFLINE_MESSAGE"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(9, 4, "DOC_VIEWER.DOWNLOAD"));
  }
}
function DocViewerComponent_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, DocViewerComponent_ng_container_4_ng_container_1_Template, 3, 3, "ng-container", 14)(2, DocViewerComponent_ng_container_4_ng_template_2_Template, 10, 6, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const offlineDoc_r5 = \u0275\u0275reference(3);
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isOnline)("ngIfElse", offlineDoc_r5);
  }
}
function DocViewerComponent_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "image", 22);
    \u0275\u0275listener("OnEvent", function DocViewerComponent_ng_container_5_Template_image_OnEvent_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnEventOfImg($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("images", \u0275\u0275pureFunction1(3, _c5, \u0275\u0275pureFunction1(1, _c4, ctx_r1.docUrl)));
  }
}
function DocViewerComponent_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "video", 23);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("src", ctx_r1.docUrl, \u0275\u0275sanitizeUrl);
  }
}
function DocViewerComponent_ng_container_7_ng_container_2_ng_container_17_span_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, ", ");
    \u0275\u0275elementEnd();
  }
}
function DocViewerComponent_ng_container_7_ng_container_2_ng_container_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span")(2, "span", 27);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 28)(5, "div", 29);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "a", 30);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(9, DocViewerComponent_ng_container_7_ng_container_2_ng_container_17_span_9_Template, 2, 0, "span", 3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const recipient_r8 = ctx.$implicit;
    const i_r9 = ctx.index;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(recipient_r8.name);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate((recipient_r8 == null ? null : recipient_r8.email) ? recipient_r8 == null ? null : recipient_r8.email == null ? null : recipient_r8.email.charAt(0) : "");
    \u0275\u0275advance();
    \u0275\u0275property("href", "mailto:" + recipient_r8.email, \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(recipient_r8.email);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", i_r9 !== ctx_r1.email.to.length - 1);
  }
}
function DocViewerComponent_ng_container_7_ng_container_2_ng_container_22_span_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, ", ");
    \u0275\u0275elementEnd();
  }
}
function DocViewerComponent_ng_container_7_ng_container_2_ng_container_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span")(2, "span", 27);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 28)(5, "div", 29);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "a", 30);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(9, DocViewerComponent_ng_container_7_ng_container_2_ng_container_22_span_9_Template, 2, 0, "span", 3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const recipient_r10 = ctx.$implicit;
    const i_r11 = ctx.index;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(recipient_r10.name);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate((recipient_r10 == null ? null : recipient_r10.email) ? recipient_r10 == null ? null : recipient_r10.email == null ? null : recipient_r10.email.charAt(0) : "");
    \u0275\u0275advance();
    \u0275\u0275property("href", "mailto:" + (recipient_r10 == null ? null : recipient_r10.email), \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(recipient_r10 == null ? null : recipient_r10.email);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", i_r11 !== ctx_r1.email.cc.length - 1);
  }
}
function DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_li_6_hr_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "hr");
  }
}
function DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_li_6_div_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 40)(1, "button", 41);
    \u0275\u0275listener("click", function DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_li_6_div_15_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r16);
      const ctx_r16 = \u0275\u0275nextContext();
      const attachment_r14 = ctx_r16.$implicit;
      const ai_r15 = ctx_r16.index;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.newtab(attachment_r14, ai_r15));
    });
    \u0275\u0275element(2, "icon", 44);
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(5, 1, "DOC_VIEWER.VIEW"));
  }
}
function DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_li_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "li")(1, "div", 36);
    \u0275\u0275element(2, "img", 37);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementStart(4, "span");
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275element(6, "icon", 38);
    \u0275\u0275elementStart(7, "div", 39)(8, "div", 40)(9, "button", 41);
    \u0275\u0275listener("click", function DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_li_6_Template_button_click_9_listener() {
      const ctx_r12 = \u0275\u0275restoreView(_r12);
      const attachment_r14 = ctx_r12.$implicit;
      const ai_r15 = ctx_r12.index;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.downloadAttachment(ai_r15, attachment_r14.filename));
    });
    \u0275\u0275element(10, "icon", 42);
    \u0275\u0275elementStart(11, "span");
    \u0275\u0275text(12);
    \u0275\u0275pipe(13, "translate");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(14, DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_li_6_hr_14_Template, 1, 0, "hr", 3)(15, DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_li_6_div_15_Template, 6, 3, "div", 43);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const attachment_r14 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275propertyInterpolate("alt", \u0275\u0275pipeBind1(3, 6, "DOC_VIEWER.ATTACHMENT_ICON_ALT"));
    \u0275\u0275property("src", "assets/img/doctype/" + ctx_r1.getFileExtension(attachment_r14 == null ? null : attachment_r14.filename) + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(attachment_r14 == null ? null : attachment_r14.filename);
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(13, 8, "DOC_VIEWER.DOWNLOAD"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.isMyfile);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.isMyfile && ctx_r1.isShowView(attachment_r14.filename));
  }
}
function DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 34)(2, "h6", 35);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "ul");
    \u0275\u0275template(6, DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_li_6_Template, 16, 10, "li", 31);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 2, "DOC_VIEWER.ATTACHMENTS"));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.email.attachments);
  }
}
function DocViewerComponent_ng_container_7_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 26)(2, "div")(3, "b");
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "span", 27);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 28)(9, "div", 29);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "a", 30);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(13, "div")(14, "b");
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(17, DocViewerComponent_ng_container_7_ng_container_2_ng_container_17_Template, 10, 5, "ng-container", 31);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "div")(19, "b");
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(22, DocViewerComponent_ng_container_7_ng_container_2_ng_container_22_Template, 10, 5, "ng-container", 31);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "div")(24, "b");
    \u0275\u0275text(25);
    \u0275\u0275pipe(26, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "span", 27);
    \u0275\u0275text(28);
    \u0275\u0275elementEnd()()();
    \u0275\u0275element(29, "hr", 32);
    \u0275\u0275template(30, DocViewerComponent_ng_container_7_ng_container_2_ng_container_30_Template, 7, 4, "ng-container", 3);
    \u0275\u0275element(31, "div", 33);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(5, 13, "DOC_VIEWER.FROM"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.email == null ? null : ctx_r1.email.from == null ? null : ctx_r1.email.from.name);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate((ctx_r1.email == null ? null : ctx_r1.email.from == null ? null : ctx_r1.email.from.email) ? ctx_r1.email == null ? null : ctx_r1.email.from == null ? null : ctx_r1.email.from.email.charAt(0) : "");
    \u0275\u0275advance();
    \u0275\u0275property("href", "mailto:" + (ctx_r1.email == null ? null : ctx_r1.email.from == null ? null : ctx_r1.email.from.email), \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.email == null ? null : ctx_r1.email.from == null ? null : ctx_r1.email.from.email);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(16, 15, "DOC_VIEWER.TO"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.email.to);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(21, 17, "DOC_VIEWER.CC"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.email.cc);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(26, 19, "DOC_VIEWER.SUBJECT"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r1.email.subject, "");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.email.attachments == null ? null : ctx_r1.email.attachments.length);
    \u0275\u0275advance();
    \u0275\u0275property("innerHTML", ctx_r1.sanitizedBody, \u0275\u0275sanitizeHtml);
  }
}
function DocViewerComponent_ng_container_7_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 16)(2, "div", 17)(3, "div", 45)(4, "div", 46);
    \u0275\u0275element(5, "img", 47);
    \u0275\u0275elementStart(6, "p", 48);
    \u0275\u0275text(7);
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 49);
    \u0275\u0275listener("click", function DocViewerComponent_ng_container_7_ng_container_3_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.getEmail());
    });
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "translate");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(8, 2, "DOC_VIEWER.UNABLE_TO_LOAD"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(11, 4, "DOC_VIEWER.TRY_AGAIN"));
  }
}
function DocViewerComponent_ng_container_7_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0, 50);
    \u0275\u0275elementStart(1, "iframe", 51, 1);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275listener("load", function DocViewerComponent_ng_container_7_ng_container_4_Template_iframe_load_1_listener() {
      \u0275\u0275restoreView(_r19);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.isLoading = false);
    })("error", function DocViewerComponent_ng_container_7_ng_container_4_Template_iframe_error_1_listener($event) {
      \u0275\u0275restoreView(_r19);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onIframeError($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("src", ctx_r1.safeUrl, \u0275\u0275sanitizeResourceUrl)("hidden", ctx_r1.isLoading || ctx_r1.hasError)("title", \u0275\u0275pipeBind1(3, 3, "DOC_VIEWER.EMAIL_CONTENT_TITLE"));
  }
}
function DocViewerComponent_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 24);
    \u0275\u0275listener("dblclick", function DocViewerComponent_ng_container_7_Template_div_dblclick_1_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.newtab());
    });
    \u0275\u0275template(2, DocViewerComponent_ng_container_7_ng_container_2_Template, 32, 21, "ng-container", 3)(3, DocViewerComponent_ng_container_7_ng_container_3_Template, 12, 6, "ng-container", 3)(4, DocViewerComponent_ng_container_7_ng_container_4_Template, 4, 5, "ng-container", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.email);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.hasError);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.safeUrl);
  }
}
function DocViewerComponent_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 16)(2, "div", 17)(3, "div", 18)(4, "div", 19);
    \u0275\u0275element(5, "img", 52);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(5);
    \u0275\u0275propertyInterpolate("alt", \u0275\u0275pipeBind1(6, 1, "DOC_VIEWER.LOADING_ALT"));
  }
}
var DocViewerComponent = class _DocViewerComponent {
  constructor(pdfDataService, emailservice, sanitizer, networkStatus) {
    this.pdfDataService = pdfDataService;
    this.emailservice = emailservice;
    this.sanitizer = sanitizer;
    this.networkStatus = networkStatus;
    this.sanitizedBody = null;
    this.safeUrl = null;
    this.isSmall_pdf = false;
    this.path = "";
    this.fullMode = false;
    this.nBundledetailid = "";
    this.filetype = "";
    this.isMyfile = false;
    this.nCaseid = "";
    this.bIsconvert = "";
    this.url = environment.nonPdfStorage;
    this.localurl = environment.documentStorage;
    this.downloadpath = "";
    this.docUrl = "";
    this.viewerEvent = new EventEmitter();
    this.isLoading = true;
    this.loadingProgress = 0;
    this.email = null;
    this.retryCount = 0;
    this.hasError = false;
    this.isOnline = true;
    this.lastErrorMessage = null;
  }
  ngOnInit() {
    this.networkStatus.checkNetworkStatus().then((status) => {
      this.isOnline = status;
    });
    this.docUrl = this.url + this.downloadpath + this.path;
    if (this.path.toUpperCase().includes(".MP3")) {
      this.filetype = "M";
      this.isLoading = false;
    } else if (/\.(jpeg|jpg|png|gif|bmp|svg)$/i.test(this.path.toLowerCase())) {
      this.filetype = "I";
      this.isLoading = false;
    } else if (/\.(mp4|avi|mov|wmv|flv)$/i.test(this.path.toLowerCase())) {
      this.filetype = "V";
      this.isLoading = false;
    } else if (/\.(doc|docx|xls|xlsx|ppt|pptx|xlsm)$/i.test(this.path.toLowerCase())) {
      this.filetype = "D";
      setTimeout(() => {
        const iframe = document.getElementById("excel-viewer");
        iframe?.setAttribute("src", "https://view.officeapps.live.com/op/embed.aspx?src=" + this.docUrl);
        this.isLoading = false;
      }, 10);
    } else if (/\.(dwg)$/i.test(this.path.toLowerCase())) {
      this.filetype = "D";
      setTimeout(() => {
        const iframe = document.getElementById("excel-viewer");
        iframe?.setAttribute("src", "//sharecad.org/cadframe/load?url=" + this.docUrl);
        this.isLoading = false;
      }, 10);
    } else if (/\.(msg)$/i.test(this.path.toLowerCase())) {
      this.getEmail();
    }
    globalThis.addEventListener("message", (event) => {
      if (event.data?.event === "dblclick") {
        this.newtab();
      }
    });
  }
  downloadAttachment(id, filename) {
    return __async(this, null, function* () {
      const res = yield this.emailservice.getAttechment(this.path, id);
      const url = globalThis.URL.createObjectURL(res);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      globalThis.URL.revokeObjectURL(url);
    });
  }
  onButtonClick(event) {
    event.stopPropagation?.();
    return true;
  }
  onImageDoubleClick(event) {
    event.preventDefault();
    const target = event.target;
    if (target.tagName.toLowerCase() === "img" || target.tagName.toLowerCase() === "video") {
      const imageUrl = target.getAttribute("src");
      if (imageUrl) {
        globalThis.open(imageUrl, "_blank");
      }
    }
  }
  getFileExtension(fileName) {
    if (!fileName || fileName.lastIndexOf(".") === -1) {
      return "other";
    }
    const extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    return DOC_VIEWER_STATIC.validExtensions.includes(extension) ? extension.toUpperCase() : "other";
  }
  newtab(attachemnt, index) {
    if (!attachemnt) {
      this.viewerEvent.emit({ event: DOC_VIEWER_EVENTS.OPEN_INDIVIDUAL });
    } else {
      this.viewerEvent.emit({ event: DOC_VIEWER_EVENTS.OPEN_ATTACHMENT, data: { nBundledetailid: index == 0 ? -1 : index - 1, cFilename: attachemnt.filename, cPath: attachemnt.cPath } });
    }
  }
  isShowView(path) {
    if (!path)
      return false;
    return /\.(jpeg|jpg|png|gif|bmp|svg|doc|docx|xls|xlsx|xlsm|ppt|pptx|msg|pdf)$/i.test(path.toLowerCase());
  }
  OnEventOfImg(event) {
    this.viewerEvent.emit(event);
  }
  sanitizedEmailbody(htmlContent) {
    this.sanitizedBody = this.sanitizer.bypassSecurityTrustHtml(htmlContent.replaceAll(/\n/g, ""));
  }
  closeRealtimePdf() {
    this.viewerEvent.emit({ event: DOC_VIEWER_EVENTS.CLOSE_REALTIME, data: null });
  }
  getEmail() {
    return __async(this, null, function* () {
      try {
        this.isLoading = true;
        this.filetype = "E";
        const htmlPath = this.getHtmlPath();
        const fileExists = this.bIsconvert != "N";
        if (fileExists) {
          this.loadWithIframe(htmlPath);
        } else {
          yield this.processWithApi();
        }
      } catch (error) {
        this.hasError = true;
        this.lastErrorMessage = ErrorHandlerUtil.getErrorMessage(error);
        yield this.processWithApi();
      } finally {
        this.filetype = "E";
      }
    });
  }
  processWithApi() {
    return __async(this, null, function* () {
      try {
        const res = yield this.emailservice.getEmailparser(this.nBundledetailid, this.nCaseid);
        if (res?.msg === 1) {
          this.bIsconvert = "V";
          const htmlPath = this.getHtmlPath();
          setTimeout(() => {
            this.loadWithIframe(htmlPath);
          }, 500);
        } else {
          this.filetype = "E";
          this.isLoading = false;
          this.hasError = true;
        }
      } catch (error) {
        this.hasError = true;
        this.lastErrorMessage = ErrorHandlerUtil.getErrorMessage(error);
        this.filetype = "E";
        this.isLoading = false;
      } finally {
        this.filetype = "E";
      }
    });
  }
  getHtmlPath() {
    const dirPath = "doc/case" + this.nCaseid;
    const fileName = this.getFileName(this.path).replace(/\.msg$/i, ".html");
    return `${dirPath}/${this.nBundledetailid}/${fileName}`;
  }
  loadWithIframe(path) {
    return __async(this, null, function* () {
      try {
        this.retryCount = 0;
        const response = yield this.emailservice.getFileUrl(path);
        if (typeof response?.url === "string") {
          this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.localurl}${path}`);
        } else {
          this.hasError = true;
          this.isLoading = false;
          this.lastErrorMessage = "File not accessible";
        }
        setTimeout(() => {
          this.loadIframe();
        });
      } catch (error) {
        this.hasError = true;
        this.lastErrorMessage = ErrorHandlerUtil.getErrorMessage(error);
        this.isLoading = false;
      }
    });
  }
  onIframeError(event) {
    this.hasError = true;
    this.isLoading = false;
    this.lastErrorMessage = event?.message ?? "Iframe loading error";
  }
  loadIframe() {
    const iframe = document.querySelector(".html-iframe");
    if (!iframe) {
      this.hasError = true;
      this.lastErrorMessage = "Iframe element not found";
      return;
    }
    iframe.addEventListener("load", () => {
      this.isLoading = false;
      this.retryCount = 0;
    });
    iframe.addEventListener("error", this.handleIframeError.bind(this));
  }
  handleIError() {
    this.handleIframeError();
  }
  handleIframeError() {
    return __async(this, null, function* () {
      let maxRetries = 5;
      this.retryCount++;
      if (this.retryCount <= maxRetries) {
        yield this.retryLoadIframe();
      } else {
        this.isLoading = false;
        this.hasError = true;
        this.lastErrorMessage = `Max retries reached. Failed to load iframe.`;
      }
    });
  }
  retryLoadIframe() {
    return __async(this, null, function* () {
      this.isLoading = true;
      this.hasError = false;
      yield new Promise((resolve) => setTimeout(resolve, 1e3));
      const iframe = document.querySelector(".html-iframe");
      iframe?.setAttribute("src", iframe?.src ?? "");
      return true;
    });
  }
  getDirPath(filePath) {
    return filePath.substring(0, filePath.lastIndexOf("/"));
  }
  getFileName(filePath) {
    const normalizedPath = filePath.replace(/\\/g, "/");
    return normalizedPath.substring(normalizedPath.lastIndexOf("/") + 1);
  }
  downloadURI(uri) {
    this.viewerEvent.emit({
      event: DOC_VIEWER_EVENTS.DOWNLOAD,
      data: { nBundledetailid: this.nBundledetailid, path: this.path }
    });
  }
  linkDoc() {
    document.activeElement?.blur();
    this.viewerEvent.emit({
      event: DOC_VIEWER_EVENTS.LINK_ADDED_DOC,
      data: __spreadValues({}, this.docInfo)
    });
  }
  static {
    this.\u0275fac = function DocViewerComponent_Factory(t) {
      return new (t || _DocViewerComponent)(\u0275\u0275directiveInject(PdfDataService), \u0275\u0275directiveInject(EmailService), \u0275\u0275directiveInject(DomSanitizer), \u0275\u0275directiveInject(NetworkStatusService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DocViewerComponent, selectors: [["doc-viewer"]], viewQuery: function DocViewerComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c02, 5);
        \u0275\u0275viewQuery(_c1, 7);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.iframeRef = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.iframe = _t.first);
      }
    }, inputs: { path: "path", fullMode: "fullMode", isRealtime: "isRealtime", nBundledetailid: "nBundledetailid", filetype: "filetype", isMyfile: "isMyfile", nCaseid: "nCaseid", bIsconvert: "bIsconvert", docInfo: "docInfo", hightlightMode: "hightlightMode" }, outputs: { viewerEvent: "viewerEvent" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 9, vars: 10, consts: [["offlineDoc", ""], ["htmlIframe", ""], [1, "flex", "h-full", "flex-col"], [4, "ngIf"], [1, "h-full", 3, "ngClass"], [1, "pdf-toolbars", "flex", "items-center", "justify-between", "bg-white", "relative", "z-20", "!bg-dark-blue", "px-0", "h-[59px]"], [1, "pdf-toolbars", "gap-x-2", "flex", "items-center", "me-2", "justify-end", "!w-1/2", "!ml-auto", "h-full", "!pl-5", "!bg-blue-on", "!mr-0"], [1, "flex", "text-white", "ms-3", "me-5"], ["type", "button", 1, "text-sm", "block", "bg-transparent", "border-0", 3, "click"], ["name", "close", "type", "comnicn", 1, "text-sm", "block", 3, "matTooltip"], [1, "p-2", "bg-white"], ["mode", "outlined", "type", "button", 1, "group-focus-within:z-30", "w-fit", "relative", "ms-auto", 3, "click"], ["name", "addfill", 1, "text-base", "block", "group-focus-within:text-brand", "transition-all", "duration-500", "slow-ease"], [1, "ml-2"], [4, "ngIf", "ngIfElse"], ["id", "excel-viewer", 1, "excel-viewer", 3, "title"], [1, "flex", "flex-col", "h-full"], [1, "h-full"], [1, "flex", "items-center", "justify-end", "h-full", "gap-2", "p-5", 2, "background", "#c4c4c4"], [1, "flex", "flex-col", "items-center", "justify-center", "w-full", "h-full", "bg-white"], [1, "mb-2", "text-sm", "font-semibold"], ["type", "button", 1, "text-xs", "underline", 3, "click"], [1, "h-full", "block", 3, "OnEvent", "images"], ["controls", "", "autoplay", "", 1, "object-fit", "h-full", "w-full", 3, "src"], [1, "h-full", "overflow-auto", "w-full", "p-3", "bg-[#f1f1f1]", 3, "dblclick"], ["class", "w-full h-full", 4, "ngIf"], [1, "d-flex", "flex-column", "gap-2"], [1, "emailparent"], [1, "emailpop"], [1, "avtr"], [3, "href"], [4, "ngFor", "ngForOf"], [1, "my-4"], [1, "email-body", 3, "innerHTML"], [1, "attachments"], [1, "head", "mb-2"], [1, "attachment-item"], ["width", "20", 3, "src", "alt"], ["name", "chvx", 1, "text-xxs"], [1, "options"], [1, "option"], ["type", "button", 3, "click"], ["name", "download", "type", "extra", 1, "text-base"], ["class", "option", 4, "ngIf"], ["name", "eye", 1, "text-base"], [1, "flex", "items-center", "justify-center", "h-full", "gap-2", "p-5", "bg-gray-100"], [1, "flex", "flex-col", "items-center", "justify-center", "text-center"], ["width", "60", "alt", "error", 1, "mb-3"], [1, "text-gray-700"], ["type", "button", 1, "px-4", "py-2", "mt-3", "text-sm", "text-white", "bg-blue-600", "rounded", "hover:bg-blue-700", 3, "click"], [1, "w-full", "h-full"], ["sandbox", "allow-same-origin allow-scripts", 1, "html-iframe", "w-full", "h-full", 3, "load", "error", "src", "hidden", "title"], ["width", "40", "src", "../../../../assets/icons/loaderorange.svg", 1, "animate-spin", 3, "alt"]], template: function DocViewerComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 2);
        \u0275\u0275template(1, DocViewerComponent_ng_container_1_Template, 8, 6, "ng-container", 3);
        \u0275\u0275elementStart(2, "div", 4);
        \u0275\u0275template(3, DocViewerComponent_ng_container_3_Template, 8, 9, "ng-container", 3)(4, DocViewerComponent_ng_container_4_Template, 4, 2, "ng-container", 3)(5, DocViewerComponent_ng_container_5_Template, 2, 5, "ng-container", 3)(6, DocViewerComponent_ng_container_6_Template, 2, 1, "ng-container", 3)(7, DocViewerComponent_ng_container_7_Template, 5, 3, "ng-container", 3)(8, DocViewerComponent_ng_container_8_Template, 7, 3, "ng-container", 3);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.isRealtime);
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(8, _c2, ctx.isRealtime));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.hightlightMode === "F" || ctx.hightlightMode === "D") && ctx.isOnline && ctx.docUrl);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.docUrl && ctx.filetype === "D");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.docUrl && ctx.filetype === "I");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.docUrl && ctx.filetype === "V");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.docUrl && ctx.filetype === "E");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.isLoading);
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, ViewerModule, IconComponent, ImgComponent, TranslateModule, TranslatePipe, MatTooltipModule, MatTooltip], styles: ['\n\niframe[_ngcontent-%COMP%]::after {\n  content: "";\n  height: 100%;\n  background: red;\n  width: 100%;\n}\n.error-message[_ngcontent-%COMP%] {\n  color: red;\n  font-weight: bold;\n}\n.excel-viewer[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  border: none;\n}\n#ngx-fs-btn[_ngcontent-%COMP%] {\n  bottom: 615px;\n}\n.email-container[_ngcontent-%COMP%] {\n  max-width: 800px;\n  background: white;\n  overflow: visible !important;\n  margin: 0 auto;\n  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.0196078431);\n  height: fit-content !important;\n  padding: 40px;\n  font-size: 12px;\n  white-space: pre-wrap;\n  width: fit-content !important;\n  min-width: 400px;\n}\n.email-container.isfull[_ngcontent-%COMP%] {\n  min-width: 800px !important;\n}\n.attachments[_ngcontent-%COMP%]   .head[_ngcontent-%COMP%] {\n  font-size: 14px;\n  font-weight: 600;\n}\n.attachments[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  padding: 0;\n}\n.attachments[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  font-size: 12px;\n  position: relative;\n  white-space: nowrap;\n  list-style: none;\n  gap: 5px;\n  padding: 8px;\n  background: transparent;\n  border: 1px solid #ccc;\n  font-weight: 600;\n  max-width: 100%;\n  text-overflow: ellipsis;\n}\n.attachments[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n  text-overflow: ellipsis;\n  display: block;\n  overflow: hidden;\n}\n.attachments[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]   ion-icon[_ngcontent-%COMP%] {\n  min-width: 12px;\n}\n.attachments[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:focus {\n  outline: none;\n}\n.attachments[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:focus   .options[_ngcontent-%COMP%] {\n  display: flex !important;\n}\n.attachments[_ngcontent-%COMP%]   .options[_ngcontent-%COMP%] {\n  position: absolute;\n  display: none;\n  flex-direction: column;\n  padding: 5px;\n  right: 0;\n  width: 133px;\n  z-index: 999;\n  top: 100%;\n  background: white;\n  box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.37);\n}\n.attachments[_ngcontent-%COMP%]   .options[_ngcontent-%COMP%]   hr[_ngcontent-%COMP%] {\n  margin: 0px 0;\n  opacity: 0.2;\n}\n.attachments[_ngcontent-%COMP%]   .options[_ngcontent-%COMP%]   .option[_ngcontent-%COMP%] {\n  padding: 5px;\n  font-size: 12px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  gap: 5px;\n}\n.attachments[_ngcontent-%COMP%]   .options[_ngcontent-%COMP%]   .option[_ngcontent-%COMP%]:hover {\n  background: #f5f5f5;\n}\n.emailparent[_ngcontent-%COMP%] {\n  position: relative;\n}\n.emailparent[_ngcontent-%COMP%]:hover   .emailpop[_ngcontent-%COMP%] {\n  display: flex;\n}\n.emailparent[_ngcontent-%COMP%]   .emailpop[_ngcontent-%COMP%] {\n  background: white;\n  display: none;\n  position: absolute;\n  z-index: 100;\n  bottom: 100%;\n  left: 50%;\n  transform: translateX(-50%);\n  padding: 10px;\n  border-radius: 8px;\n  align-items: center;\n  gap: 10px;\n  white-space: nowrap;\n  box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.418);\n}\n.emailparent[_ngcontent-%COMP%]   .emailpop[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n  cursor: pointer !important;\n}\n.emailparent[_ngcontent-%COMP%]   .emailpop[_ngcontent-%COMP%]   .avtr[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  background: gray;\n  text-align: center;\n  color: white;\n  display: grid;\n  place-items: center;\n  border-radius: 50%;\n  overflow: visible;\n  height: 25px;\n  width: 25px;\n}\n/*# sourceMappingURL=doc-viewer.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DocViewerComponent, { className: "DocViewerComponent", filePath: "src\\app\\pdf\\components\\doc-viewer\\doc-viewer.component.ts", lineNumber: 25 });
})();

// src/app/userpanel/components/quickpdf/quickpdf.component.ts
function QuickpdfComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "ngx-extended-pdf-viewer", 2);
    \u0275\u0275listener("progress", function QuickpdfComponent_Conditional_0_Template_ngx_extended_pdf_viewer_progress_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onProgress($event));
    })("pdfLoadingStarts", function QuickpdfComponent_Conditional_0_Template_ngx_extended_pdf_viewer_pdfLoadingStarts_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPdfLoadingStart($event));
    })("pdfLoadingFailed", function QuickpdfComponent_Conditional_0_Template_ngx_extended_pdf_viewer_pdfLoadingFailed_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPdfLoadingFailed($event));
    })("pagesLoaded", function QuickpdfComponent_Conditional_0_Template_ngx_extended_pdf_viewer_pagesLoaded_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnPageLoad($event));
    })("dblclick", function QuickpdfComponent_Conditional_0_Template_ngx_extended_pdf_viewer_dblclick_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onOpen());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("src", ctx_r1.pdfSrc)("zoom", "page-fit")("pageViewMode", "single")("page", ctx_r1.onPage)("showToolbar", false)("textLayer", false)("height", "100%");
  }
}
function QuickpdfComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "doc-viewer", 3);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("path", ctx_r1.docInfo.cPath)("filetype", ctx_r1.filetype)("isMyfile", false)("bIsconvert", ctx_r1.docInfo.bIsconvert)("isRealtime", ctx_r1.docInfo.isRealtime)("nBundledetailid", ctx_r1.docInfo.nBundledetailid)("docInfo", ctx_r1.docInfo)("nCaseid", ctx_r1.nCaseid);
  }
}
function QuickpdfComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 4)(2, "text", 5)(3, "tspan", 6);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "tspan", 7);
    \u0275\u0275text(6, "%");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "tspan", 8);
    \u0275\u0275text(8, "progress");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(9, "circle", 9)(10, "circle", 10);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r1.loadingProgress, " ");
    \u0275\u0275advance(6);
    \u0275\u0275attribute("stroke-dashoffset", 282.743 - ctx_r1.loadingProgress / 100 * 282.743);
  }
}
var QuickpdfComponent = class _QuickpdfComponent {
  constructor(pdfData, cdr, route) {
    this.pdfData = pdfData;
    this.cdr = cdr;
    this.route = route;
    this.filetypes = ["document", "video", "video", "ppt", "pptx", "msg", "pdf"];
    this.filetype = "";
    this.onPage = 1;
    this.docInfo = {};
    this.filepath = environment.documentStorage;
    this.loadingStats = "L";
    this.loadingProgress = 0;
    const params = this.route.snapshot.params;
    if (params) {
      this.nBundledetailid = params["id"];
      this.onPage = this.route.snapshot.queryParams["nPage"] || 1;
      this.nCaseid = this.route.snapshot.queryParams["nCaseid"] || null;
      this.initData();
    }
  }
  initData() {
    return __async(this, null, function* () {
      pdfDefaultOptions.doubleTapZoomsInHandMode = false;
      const data = yield this.pdfData.fetchDocInfo(this.nBundledetailid);
      this.docInfo = Object.assign(this.docInfo, data);
      debugger;
      this.filetype = this.getFileType(this.docInfo.cPath);
      this.pdfSrc = `${this.filepath}${this.docInfo.cPath}${this.docInfo?.version ? "?VersionId=" + this.docInfo?.version : ""}`;
      if (this.filetype != "pdf") {
        this.pdfLoaded = true;
      }
      this.loadingStats = "C";
      this.cdr.detectChanges();
    });
  }
  onProgress(e) {
    this.loadingProgress = parseInt(e.percent);
    this.cdr.detectChanges();
  }
  onPdfLoadingStart(e) {
    this.pdfLoaded = false;
    this.pdfFailed = false;
  }
  onPdfLoadingFailed(e) {
    console.error("PDF Failed", e);
    this.pdfFailed = true;
    this.cdr.detectChanges();
  }
  OnPageLoad(e) {
    this.pdfLoaded = true;
    this.cdr.detectChanges();
  }
  onOpen() {
    const message = { event: "ON-INDIVIDUAL", type: "QUICK-VIEW" };
    window.parent.postMessage(message, window.location.origin);
  }
  getFileType(path) {
    const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv"];
    const pdfExtensions = ["pdf"];
    const imageExtensions = ["jpeg", "jpg", "png", "gif", "bmp", "svg"];
    const documentExtensions = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "dwg", "xlsm"];
    const emailExtensions = ["msg"];
    const ext = path.split(".").pop().toLowerCase();
    if (videoExtensions.includes(ext)) {
      return "video";
    } else if (imageExtensions.includes(ext)) {
      return "image";
    } else if (documentExtensions.includes(ext)) {
      return "document";
    } else if (emailExtensions.includes(ext)) {
      return "msg";
    } else if (pdfExtensions.includes(ext)) {
      return "pdf";
    } else {
      return "unknown";
    }
  }
  static {
    this.\u0275fac = function QuickpdfComponent_Factory(t) {
      return new (t || _QuickpdfComponent)(\u0275\u0275directiveInject(PdfDataService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(ActivatedRoute));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _QuickpdfComponent, selectors: [["quickpdf"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 3, vars: 2, consts: [[1, "h-full", 3, "src", "zoom", "pageViewMode", "page", "showToolbar", "textLayer", "height"], [1, "min-h-full", "w-[842px]", "bg-white", "grid", "place-items-center", "transition-all", "origin-center", "mx-auto", "max-w-[100%]", "absolute", "top-0", "left-1/2", "-translate-x-1/2", "z-20"], [1, "h-full", 3, "progress", "pdfLoadingStarts", "pdfLoadingFailed", "pagesLoaded", "dblclick", "src", "zoom", "pageViewMode", "page", "showToolbar", "textLayer", "height"], [3, "path", "filetype", "isMyfile", "bIsconvert", "isRealtime", "nBundledetailid", "docInfo", "nCaseid"], ["width", "120", "height", "120", "viewBox", "0 0 100 100"], ["alignment-baseline", "baseline", "x", "70", "y", "70", "text-anchor", "middle"], ["x", "50", "y", "57", "dy", "-0.18em", "font-size", "20", "font-weight", "normal", "fill", "#444444"], ["font-size", "10", "font-weight", "normal", "fill", "#444444"], ["x", "50", "y", "57", "dy", "0.82em", "font-size", "10", "font-weight", "normal", "fill", "#A9A9A9"], ["cx", "50", "cy", "50", "r", "45", "stroke", "#e6e6e6", "stroke-width", "5", "fill", "none"], ["cx", "50", "cy", "50", "r", "45", "stroke", "#ff3d00", "stroke-width", "5", "fill", "none", "stroke-dasharray", "282.743", 1, "progress-circle", 2, "transform", "rotate(270deg)", "transform-origin", "center", "stroke-linecap", "round"]], template: function QuickpdfComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, QuickpdfComponent_Conditional_0_Template, 1, 7, "ngx-extended-pdf-viewer", 0)(1, QuickpdfComponent_Conditional_1_Template, 1, 8)(2, QuickpdfComponent_Conditional_2_Template, 11, 2, "div", 1);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.docInfo.cPath && ctx.filetype == "pdf" ? 0 : ctx.docInfo.cPath && (ctx.filetype == "document" || ctx.filetype == "image" || ctx.filetype == "video" || ctx.filetype == "xlsx" || ctx.filetype == "ppt" || ctx.filetype == "pptx" || ctx.filetype == "msg") ? 1 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(2, !ctx.pdfLoaded ? 2 : -1);
      }
    }, dependencies: [NgxExtendedPdfViewerModule, NgxExtendedPdfViewerComponent, DocViewerComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(QuickpdfComponent, { className: "QuickpdfComponent", filePath: "src\\app\\userpanel\\components\\quickpdf\\quickpdf.component.ts", lineNumber: 17 });
})();

export {
  DocViewerComponent,
  QuickpdfComponent
};
//# sourceMappingURL=chunk-C2HLXJ6I.js.map
