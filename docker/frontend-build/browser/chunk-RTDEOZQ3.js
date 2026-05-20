import {
  QFactIssuePanelComponent
} from "./chunk-WL54I2US.js";
import {
  PresentService
} from "./chunk-DRZF5GH5.js";
import {
  v4_default
} from "./chunk-3B3MCZKM.js";
import {
  ExportFormComponent
} from "./chunk-DUJPAHR2.js";
import {
  QFactRapidPopupComponent
} from "./chunk-AD3YPIDF.js";
import {
  PdfSharedModule
} from "./chunk-VPMOHRXF.js";
import {
  LINK_EVENT_TYPES,
  PRESENT_EVENT_TYPES,
  PdfEvents,
  TOOLBAR_PDF_NAV_TYPES,
  TOOLBOX_EVENT_TYPES
} from "./chunk-JX6C2RXC.js";
import {
  FactService
} from "./chunk-IMS2LHRB.js";
import {
  SelectionActionsService
} from "./chunk-FW6JNL2T.js";
import {
  LinkTarget,
  NgxExtendedPdfViewerComponent,
  NgxExtendedPdfViewerService,
  PdfSidebarContentComponent,
  PdfSidebarView,
  ScrollModeType,
  pdfDefaultOptions
} from "./chunk-QI7CLXWT.js";
import {
  PdfDataService
} from "./chunk-F3YHE7Z5.js";
import {
  TeamshareComponent
} from "./chunk-6CVBO52M.js";
import {
  SourceCardComponent
} from "./chunk-X7K4VII4.js";
import {
  NgScrollbarModule,
  takeUntilDestroyed
} from "./chunk-WZNPCXMG.js";
import {
  SkeletonComponent
} from "./chunk-KEJC4ZXM.js";
import {
  CacheService
} from "./chunk-ZLDLJ4OJ.js";
import {
  IndividualService
} from "./chunk-GNZXOHZW.js";
import {
  AnnotsService,
  FeedDisplayService,
  annotTrasnferService
} from "./chunk-SD32Y426.js";
import {
  IssueService
} from "./chunk-3LLM6WVC.js";
import {
  MatSlideToggle,
  MatSlideToggleModule
} from "./chunk-43QUFIPG.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  RolepermitService
} from "./chunk-TECZMXLZ.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslatePipe,
  TranslateService
} from "./chunk-DWVFAK3Q.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  DialogueComponent
} from "./chunk-TNIBXRF4.js";
import {
  MatDialog
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
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  DatePipe,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Renderer2,
  Subject,
  __async,
  __spreadProps,
  __spreadValues,
  debounceTime,
  effect,
  inject,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵpureFunction4,
  ɵɵpureFunction5,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/pdf/interfaces/doc-viewer.interface.ts
var DOC_VIEWER_EVENTS = {
  OPEN_INDIVIDUAL: "OPEN-INDIVIDUAL",
  OPEN_ATTACHMENT: "OPEN-ATTACHMENT",
  CLOSE_REALTIME: "CLOSE_REALTIME",
  DOWNLOAD: "DOWNLOAD",
  LINK_ADDED_DOC: "LINK-ADDED-DOC"
};

// src/app/pdf/components/hyperlink-box/hyperlink-box.component.ts
var _forTrack0 = ($index, $item) => $item.nBundledetailid;
function HyperlinkBoxComponent_Conditional_0_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "source-card", 2);
    \u0275\u0275listener("click", function HyperlinkBoxComponent_Conditional_0_For_2_Template_source_card_click_0_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.OpenFile(x_r2));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275property("truncate", false)("detail", x_r2);
  }
}
function HyperlinkBoxComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275repeaterCreate(1, HyperlinkBoxComponent_Conditional_0_For_2_Template, 1, 2, "source-card", 1, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.hyperlinkList);
  }
}
function HyperlinkBoxComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275element(1, "div", 4);
    \u0275\u0275elementEnd();
  }
}
var HyperlinkBoxComponent = class _HyperlinkBoxComponent {
  constructor(pdfData, cdr) {
    this.pdfData = pdfData;
    this.cdr = cdr;
    this.hyperlinkOption = {};
    this.inProcess = true;
    this.hyperlinkList = [];
    this.onHyperlinkEvent = new EventEmitter();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.inProcess = true;
      this.hyperlinkList = [];
      this.cdr.detectChanges();
      if (this.hyperlinkOption.nBundledetailid && this.hyperlinkOption.isOpen) {
        this.onHyperlinkEvent.emit({ event: "OPEN-HYPERLINK-FILE", data: __spreadValues({}, this.hyperlinkOption) });
        return;
      }
      if (this.hyperlinkOption?.nBundledetailid || this.hyperlinkOption.nDocid) {
        const res = yield this.pdfData.getHyperLinkFile(this.hyperlinkOption.nBundledetailid, this.hyperlinkOption.nDocid || null);
        this.inProcess = false;
        if (res && res.length) {
          this.hyperlinkList = res;
        }
        this.cdr.detectChanges();
      }
    });
  }
  ngOnChanges(changes) {
    if (!changes["hyperlinkOption"].firstChange && changes["hyperlinkOption"].currentValue?.nBundledetailid != changes["hyperlinkOption"].previousValue?.nBundledetailid) {
      console.warn("CANGES", changes["hyperlinkOption"].currentValue);
      this.ngOnInit();
    }
  }
  OpenFile(x) {
    this.onHyperlinkEvent.emit({ event: "OPEN-HYPERLINK-FILE", data: __spreadValues(__spreadValues({}, this.hyperlinkOption), x) });
  }
  static {
    this.\u0275fac = function HyperlinkBoxComponent_Factory(t) {
      return new (t || _HyperlinkBoxComponent)(\u0275\u0275directiveInject(PdfDataService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HyperlinkBoxComponent, selectors: [["hyperlink-box"]], inputs: { hyperlinkOption: "hyperlinkOption" }, outputs: { onHyperlinkEvent: "onHyperlinkEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [[1, "bg-white", "p-2", "rounded-base", "max-h-[300px]", "overflow-auto", "shadow-base"], ["gap", "S", "mode", "light", "type", "T", 3, "truncate", "detail"], ["gap", "S", "mode", "light", "type", "T", 3, "click", "truncate", "detail"], [1, "bg-white", "p-2", "rounded-base", "shadow-base"], [1, "w-[300px]", "h-15", "bg-faint", "rounded-base", "animate-pulse"]], template: function HyperlinkBoxComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, HyperlinkBoxComponent_Conditional_0_Template, 3, 0, "div", 0)(1, HyperlinkBoxComponent_Conditional_1_Template, 2, 0);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, !ctx.inProcess ? 0 : 1);
      }
    }, dependencies: [SourceCardComponent], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HyperlinkBoxComponent, { className: "HyperlinkBoxComponent", filePath: "src\\app\\pdf\\components\\hyperlink-box\\hyperlink-box.component.ts", lineNumber: 14 });
})();

// src/app/pdf/components/fabbutton/fabbutton.component.ts
var _c0 = (a0) => ({ "-translate-y-[5px]": a0 });
function FabbuttonComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 5);
  }
}
function FabbuttonComponent_button_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 6);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275listener("click", function FabbuttonComponent_button_2_Template_button_click_0_listener() {
      const button_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onButtonClick(button_r2));
    });
    \u0275\u0275element(3, "icon", 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const button_r2 = ctx.$implicit;
    const i_r4 = ctx.index;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275styleMap(button_r2.position);
    \u0275\u0275classMap(button_r2.active ? "border-4 border-blue-hover" : "");
    \u0275\u0275styleProp("width", ctx_r2.currentConfig.buttonSize, "px")("height", ctx_r2.currentConfig.buttonSize, "px")("transition-duration", ctx_r2.currentConfig.animationDuration + "ms")("transition-delay", ctx_r2.isOpen ? i_r4 * ctx_r2.currentConfig.animationDelay + "ms" : "0ms");
    \u0275\u0275classProp("scale-0", !ctx_r2.isOpen)("scale-100", ctx_r2.isOpen);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(1, 20, button_r2.label));
    \u0275\u0275attribute("aria-label", \u0275\u0275pipeBind1(2, 22, button_r2.label));
    \u0275\u0275advance(3);
    \u0275\u0275property("name", button_r2.icon)("type", button_r2.type ? button_r2.type : "indicn");
  }
}
var FabbuttonComponent = class _FabbuttonComponent {
  constructor(elementRef) {
    this.elementRef = elementRef;
    this.buttonClick = new EventEmitter();
    this.threeButtonConfig = {
      radius: 70,
      buttonSize: 35,
      mainButtonSize: 45,
      animationDuration: 300,
      animationDelay: 50,
      buttonGap: 20,
      buttons: [
        { icon: "fact", label: "FABBUTTON.FACT", value: "F", active: true },
        { icon: "doclink", label: "FABBUTTON.DOC_LINK", active: true, value: "D" },
        { icon: "weblink", label: "FABBUTTON.WEB_LINK", active: true, value: "W" }
      ]
    };
    this.fourButtonConfig = {
      radius: 70,
      buttonSize: 35,
      mainButtonSize: 45,
      animationDuration: 300,
      animationDelay: 50,
      buttonGap: 20,
      buttons: [
        { icon: "fact", label: "FABBUTTON.FACT", value: "F", active: true },
        { icon: "doclink", label: "FABBUTTON.DOC_LINK", active: true, value: "D" },
        { icon: "weblink", label: "FABBUTTON.WEB_LINK", active: true, value: "W" },
        { icon: "share", type: "extra", label: "FABBUTTON.SHARED_MARKING", active: true, value: "S" }
      ]
    };
    this.currentConfig = this.threeButtonConfig;
    this.isOpen = false;
    this.fabIcons = ["F", "D", "W", "S"];
    this.fabIconsChange = new EventEmitter();
  }
  ngOnInit() {
    this.currentConfig = this.isHost ? this.threeButtonConfig : this.fourButtonConfig;
    this.calculateButtonPositions();
  }
  ngOnChanges() {
    this.calculateButtonPositions();
  }
  getAngleConfig(buttonCount) {
    const degToRad = (deg) => deg * (Math.PI / 180);
    switch (buttonCount) {
      case 3:
        return {
          startAngle: degToRad(-45),
          // 30 degrees from top
          endAngle: degToRad(53)
          // 145 degrees towards bottom
        };
      case 4:
        return {
          startAngle: degToRad(-90),
          // -60 degrees from top
          endAngle: degToRad(90)
          // 160 degrees towards bottom
        };
      default:
        return {
          startAngle: degToRad(-90),
          // Default to full 180 spread
          endAngle: degToRad(90)
        };
    }
  }
  calculateButtonPositions() {
    const totalButtons = this.currentConfig.buttons.length;
    if (totalButtons <= 1)
      return;
    const anglecurrentConfig = this.getAngleConfig(totalButtons);
    const angleSpread = anglecurrentConfig.endAngle - anglecurrentConfig.startAngle;
    const angleStep = angleSpread / (totalButtons - 1);
    this.currentConfig.buttons = this.currentConfig.buttons.map((button, index) => {
      const angle = anglecurrentConfig.startAngle + index * angleStep;
      const x = this.currentConfig.radius * Math.cos(angle);
      const y = this.currentConfig.radius * Math.sin(angle);
      return __spreadProps(__spreadValues({}, button), {
        position: {
          left: `${x}px`,
          top: `${y}px`
        }
      });
    });
  }
  onDocumentClick(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }
  onEscapePress() {
    this.closeMenu();
  }
  toggleMenu(event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }
  closeMenu() {
    if (this.isOpen) {
      this.isOpen = false;
    }
  }
  onButtonClick(button) {
    button.active = !button.active;
    if (button.active) {
      if (!this.fabIcons.includes(button.value)) {
        this.fabIcons.push(button.value);
      }
    } else {
      this.fabIcons = this.fabIcons.filter((icon) => icon != button.value);
    }
    this.fabIconsChange.emit(this.fabIcons);
    this.buttonClick.emit({ event: `TOGGLE-ANNOT`, data: this.fabIcons });
  }
  static {
    this.\u0275fac = function FabbuttonComponent_Factory(t) {
      return new (t || _FabbuttonComponent)(\u0275\u0275directiveInject(ElementRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FabbuttonComponent, selectors: [["fabbutton"]], hostBindings: function FabbuttonComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("click", function FabbuttonComponent_click_HostBindingHandler($event) {
          return ctx.onDocumentClick($event);
        }, false, \u0275\u0275resolveDocument)("keydown.escape", function FabbuttonComponent_keydown_escape_HostBindingHandler() {
          return ctx.onEscapePress();
        }, false, \u0275\u0275resolveDocument);
      }
    }, inputs: { isHost: "isHost", fabIcons: "fabIcons" }, outputs: { buttonClick: "buttonClick", fabIconsChange: "fabIconsChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 7, vars: 19, consts: [[1, "relative"], ["class", "backdrop -top-24 h-52 block  w-28 z-20  absolute", 4, "ngIf"], ["matTooltipPosition", "right", "class", "absolute z-30 bottom-0 left-0 shadow-lg rounded-full grid place-items-center bg-white hover:bg-blue-deactivate hover:text-blue-on hover:shadow-none \n                 transition-all ease-in-out", 3, "style", "width", "matTooltip", "class", "height", "transition-duration", "transition-delay", "scale-0", "scale-100", "click", 4, "ngFor", "ngForOf"], ["matTooltipPosition", "right", 1, "shadow-lg", "-translate-x-1", "rounded-full", "grid", "place-items-center", "bg-white", "relative", "z-40", "hover:bg-blue-deactivate", "text-blue-on", "hover:shadow-none", "transition-all", 3, "click", "ngClass", "matTooltip"], ["name", "view", "type", "present", 1, "text-xl"], [1, "backdrop", "-top-24", "h-52", "block", "w-28", "z-20", "absolute"], ["matTooltipPosition", "right", 1, "absolute", "z-30", "bottom-0", "left-0", "shadow-lg", "rounded-full", "grid", "place-items-center", "bg-white", "hover:bg-blue-deactivate", "hover:text-blue-on", "hover:shadow-none", "transition-all", "ease-in-out", 3, "click", "matTooltip"], [3, "name", "type"]], template: function FabbuttonComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275template(1, FabbuttonComponent_div_1_Template, 1, 0, "div", 1)(2, FabbuttonComponent_button_2_Template, 4, 24, "button", 2);
        \u0275\u0275elementStart(3, "button", 3);
        \u0275\u0275pipe(4, "translate");
        \u0275\u0275pipe(5, "translate");
        \u0275\u0275listener("click", function FabbuttonComponent_Template_button_click_3_listener($event) {
          return ctx.toggleMenu($event);
        });
        \u0275\u0275element(6, "icon", 4);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.isHost);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.currentConfig.buttons);
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.isOpen ? "border-4 border-blue-hover" : "");
        \u0275\u0275styleProp("width", ctx.currentConfig.mainButtonSize, "px")("height", ctx.currentConfig.mainButtonSize, "px")("transition-duration", ctx.currentConfig.animationDuration + "ms");
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(17, _c0, !ctx.isHost))("matTooltip", \u0275\u0275pipeBind1(4, 13, "FABBUTTON.VIEW"));
        \u0275\u0275attribute("aria-label", \u0275\u0275pipeBind1(5, 15, "FABBUTTON.TOGGLE_MENU"));
      }
    }, dependencies: [IconComponent, CommonModule, NgClass, NgForOf, NgIf, MatTooltipModule, MatTooltip, TranslateModule, TranslatePipe], styles: ["\n\nbutton[_ngcontent-%COMP%] {\n  transition: transform 0.3s ease, scale 0.3s ease;\n}\n/*# sourceMappingURL=fabbutton.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FabbuttonComponent, { className: "FabbuttonComponent", filePath: "src\\app\\pdf\\components\\fabbutton\\fabbutton.component.ts", lineNumber: 19 });
})();

// src/app/rt/interfaces/feed-display.interface.ts
var FEED_EVENT_TYPES = {
  FEED_FAILED: "FEED-FAILED",
  SCROLL_TO_LAST: "SCROLL-TO-LAST",
  FEED_SUBJECT_REINITILIZE: "FEED-SUBJECT-REINITILIZE",
  ANNOT_DETAILS: "ANNOT-DETAILS",
  SCROLL_TO_PAGE: "SCROLL-TO-PAGE",
  ANNOT_RENDERED: "ANNOT-RENDERED",
  QMARK_CREATED: "QMARK-CREATED",
  QMARK_DELETED: "QMARK-DELETED",
  SCROLL_TO_LINE: "SCROLL-TO-LINE",
  VIEW_DOC_LINK: "VIEW-DOC-LINK",
  QUICK_FACT_ADDED: "QUICK-FACT-ADDED",
  QUICK_FACT_UPDATED: "QUICK-FACT-UPDATED",
  FACT_ADDED: "FACT-ADDED",
  DOC_ADDED: "DOC-ADDED",
  CLOSE: "CLOSE",
  DELETE_ANNOTATION: "DELETE-ANNOTATION",
  EDIT: "EDIT",
  OPEN_COMPARE_MODE: "OPEN-COMPARE-MODE",
  FEED_PAUSED: "FEED-PAUSED",
  FEED_RESUMED: "FEED-RESUMED",
  FEED_UPDATED: "FEED-UPDATED",
  FILTER_ANNOTATION: "FILTER-ANNOTATION"
};

// src/app/pdf/components/document-share/document-share.component.ts
var _c02 = (a0) => ({ expiryDays: a0 });
function DocumentShareComponent_ng_container_21_mat_option_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 41);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r3 = ctx.$implicit;
    \u0275\u0275property("value", option_r3.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 2, option_r3.label), " ");
  }
}
function DocumentShareComponent_ng_container_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 15)(2, "div", 16)(3, "div", 17)(4, "div", 18)(5, "span", 19);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "btn", 20);
    \u0275\u0275listener("click", function DocumentShareComponent_ng_container_21_Template_btn_click_7_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.copyToClipboard());
    });
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 21)(12, "mat-checkbox", 22);
    \u0275\u0275listener("change", function DocumentShareComponent_ng_container_21_Template_mat_checkbox_change_12_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onCheckboxChange($event.checked));
    });
    \u0275\u0275text(13);
    \u0275\u0275pipe(14, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "div", 23)(16, "div", 16)(17, "div", 16)(18, "div", 17)(19, "div", 24)(20, "span", 25);
    \u0275\u0275text(21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "span", 25);
    \u0275\u0275text(23);
    \u0275\u0275elementEnd()()()()()()();
    \u0275\u0275elementStart(24, "div", 26)(25, "div", 27)(26, "span", 28);
    \u0275\u0275text(27);
    \u0275\u0275pipe(28, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(29, "mat-select", 29);
    \u0275\u0275listener("selectionChange", function DocumentShareComponent_ng_container_21_Template_mat_select_selectionChange_29_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onExpiryChange($event.value));
    });
    \u0275\u0275template(30, DocumentShareComponent_ng_container_21_mat_option_30_Template, 3, 4, "mat-option", 30);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(31, "span", 31);
    \u0275\u0275text(32);
    \u0275\u0275pipe(33, "translate");
    \u0275\u0275pipe(34, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(35, "div", 32)(36, "h3", 28);
    \u0275\u0275text(37);
    \u0275\u0275pipe(38, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(39, "div", 33)(40, "div", 1)(41, "p", 34);
    \u0275\u0275text(42);
    \u0275\u0275pipe(43, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(44, "div", 35)(45, "div", 17)(46, "div", 36);
    \u0275\u0275element(47, "icon", 37);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(48, "div", 24)(49, "span", 34);
    \u0275\u0275text(50);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(51, "span", 34);
    \u0275\u0275text(52);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(53, "div", 38)(54, "span", 39);
    \u0275\u0275text(55);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(56, "p", 40);
    \u0275\u0275text(57);
    \u0275\u0275pipe(58, "translate");
    \u0275\u0275element(59, "br");
    \u0275\u0275text(60);
    \u0275\u0275pipe(61, "translate");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275classMap(ctx_r1.isCopied ? "w-[calc(100%-70px)]" : "w-[calc(100%-60px)]");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.documentUrl);
    \u0275\u0275advance();
    \u0275\u0275property("addcls", "border hover:border-white/50 border-white/50  text-white text-xs  " + (ctx_r1.isCopied ? " bg-brand" : " bg-white/10 hover:!bg-white/20"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.isCopied ? \u0275\u0275pipeBind1(9, 21, "DOCUMENT_SHARE.COPIED") : \u0275\u0275pipeBind1(10, 23, "DOCUMENT_SHARE.COPY"), " ");
    \u0275\u0275advance(4);
    \u0275\u0275property("checked", ctx_r1.includeDocName);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(14, 25, "DOCUMENT_SHARE.INCLUDE_DOC_NAME"), " ");
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx_r1.documentName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.bundleReference);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(28, 27, "DOCUMENT_SHARE.EXPIRY"));
    \u0275\u0275advance(2);
    \u0275\u0275property("value", ctx_r1.expiryDays);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.expiryOptions);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", \u0275\u0275pipeBind1(33, 29, "DOCUMENT_SHARE.EXPIRES_ON"), " ", \u0275\u0275pipeBind2(34, 31, ctx_r1.expiryDate, "dd MM YYYY"), "");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(38, 34, "DOCUMENT_SHARE.PREVIEW_MESSAGE_TITLE"), " ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(43, 36, "DOCUMENT_SHARE.PREVIEW_MESSAGE_BODY"), " ");
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx_r1.documentName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.bundleReference);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.documentUrl);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(58, 38, "DOCUMENT_SHARE.EXPIRY_NOTE", \u0275\u0275pureFunction1(43, _c02, ctx_r1.expiryDays)), "");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(61, 41, "DOCUMENT_SHARE.REQUEST_NEW_LINK"), " ");
  }
}
function DocumentShareComponent_ng_container_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 15)(2, "div")(3, "h3", 42);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275element(6, "teamshare", 43);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div")(8, "h3", 28);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "h3", 44);
    \u0275\u0275text(12);
    \u0275\u0275pipe(13, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "btn", 45);
    \u0275\u0275listener("click", function DocumentShareComponent_ng_container_22_Template_btn_click_14_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.sendInvitation());
    });
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(5, 6, "DOCUMENT_SHARE.SELECT_TEAM"));
    \u0275\u0275advance(2);
    \u0275\u0275property("title", null)("userList", ctx_r1.userList);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(10, 8, "DOCUMENT_SHARE.RECIPIENTS_NOTE"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(13, 10, "DOCUMENT_SHARE.ACTIVE_LINK_NOTE"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(16, 12, "DOCUMENT_SHARE.SEND_INVITATION"));
  }
}
var DocumentShareComponent = class _DocumentShareComponent {
  constructor(individualS, cdr, common, tost, translate) {
    this.individualS = individualS;
    this.cdr = cdr;
    this.common = common;
    this.tost = tost;
    this.translate = translate;
    this.docInfo = {};
    this.Dialogtype = "DS";
    this.DialogtypeChange = new EventEmitter();
    this.selectedShareType = "E";
    this.includeDocName = true;
    this.expiryDays = 7;
    this.expiryDate = new Date(Date.now() + this.expiryDays * 24 * 60 * 60 * 1e3);
    this.documentUrl = "https://etabella.tech/individual/doc/%5B%5B%5B%22c70a07ea-084f-...";
    this.documentName = "First Defendant's Supporting Document Addendum - Amended";
    this.bundleReference = "[ B | 2A | 43-44 ]";
    this.expiryOptions = [
      { value: 1, label: "DOCUMENT_SHARE.EXPIRY_OPTIONS.24_HOURS" },
      { value: 7, label: "DOCUMENT_SHARE.EXPIRY_OPTIONS.7_DAYS" },
      { value: 30, label: "DOCUMENT_SHARE.EXPIRY_OPTIONS.30_DAYS" }
    ];
    this.nId = null;
    this.isLocationShared = false;
    this.nCaseid = null;
    this.type = "";
    this.userList = [];
    this.isCopied = false;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      const nFSid = this.nId;
      if (this.isLocationShared || this.type == "F" && nFSid) {
        const users = (yield this.individualS.sharedusers(this.docInfo.nBundledetailid)) || [];
        if (this.docInfo) {
          this.documentUrl = `${location.origin}/individual/doc/${encodeURIComponent(JSON.stringify([[[this.docInfo.nBundledetailid, 1, 0, nFSid || null]], this.nCaseid]))}`;
          this.documentName = this.docInfo.cFilename;
          this.bundleReference = `[ ${this.docInfo?.["cBundletag"]} | ${this.docInfo?.cTab} | ${this.docInfo?.cRefpage || this.docInfo?.cPage} ]`;
        }
        this.cdr.detectChanges();
      }
      this.getMyTeamUsers();
    });
  }
  copyToClipboard() {
    if (this.isCopied) {
      return;
    }
    navigator.clipboard.writeText(this.documentUrl).then(() => {
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
        this.cdr.detectChanges();
      }, 2e3);
      this.cdr.detectChanges();
    });
  }
  onShareTypeChange(type) {
    this.selectedShareType = type;
  }
  onCheckboxChange(checked) {
    this.includeDocName = checked;
  }
  onExpiryChange(value) {
    this.expiryDays = value;
    this.expiryDate = new Date(Date.now() + this.expiryDays * 24 * 60 * 60 * 1e3);
  }
  getMyTeamUsers() {
    return __async(this, null, function* () {
      this.userList = yield this.common.getMyTeamUsers(this.nCaseid);
      if (this.userList?.length) {
        this.userList = this.userList.filter((x) => x.nUserid != this.nUserid);
      }
    });
  }
  sendInvitation() {
    return __async(this, null, function* () {
      const mdl = {
        nBundledetailid: this.docInfo.nBundledetailid,
        jUsers: JSON.stringify(this.userList.filter((f) => f.isSelected).map((m) => m.nUserid))
      };
      const res = yield this.individualS.shared_to_users(mdl);
      if (res) {
        this.DialogtypeChange.emit(null);
        this.tost.openSnackBar(this.translate.instant("DOCUMENT_SHARE.INVITATION_SENT"), "");
      }
      this.cdr.detectChanges();
    });
  }
  static {
    this.\u0275fac = function DocumentShareComponent_Factory(t) {
      return new (t || _DocumentShareComponent)(\u0275\u0275directiveInject(IndividualService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(TranslateService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DocumentShareComponent, selectors: [["app-document-share"]], inputs: { docInfo: "docInfo", Dialogtype: "Dialogtype", nId: "nId", isLocationShared: "isLocationShared", nCaseid: "nCaseid", nUserid: "nUserid", type: "type" }, outputs: { DialogtypeChange: "DialogtypeChange" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 23, vars: 15, consts: [[1, "bg-grey", "rounded-base", "p-0", "pb-5", "flex", "flex-col", "gap-5", "w-[500px]", "m-auto", "max-h-[85vh]", "overflow-y-auto"], [1, "flex", "flex-col", "gap-2.5"], [1, "flex", "items-center", "gap-2.5", "pt-2.5", "pl-5"], [1, "text-white", "font-semibold", "text-lg"], [1, "flex", "flex-col", "self-stretch"], [1, "flex", "items-end", "w-full", "h-full", "relative"], [1, "w-[114px]"], [1, "flex", "justify-center", "h-8", "items-center", "self-stretch", "gap-2.5", "px-2.5", "py-0", "w-full1", "bg-[#434343]", 3, "click"], [1, "text-[#9EC5FF]", "font-semibold", "text-xs"], [1, "w-full", "h-[2px]"], [1, "w-4", "h-8", "bg-[#434343]", "absolute", "top-0", "left-[100px]", "order-2", "shadow-[4px_0px_8.8px_-6px_rgba(255,255,255,1)]"], [1, "w-[158px]", "order-3"], [1, "flex", "justify-center", "h-8", "items-center", "self-stretch", "bg-[#434343]", 3, "click"], [1, "text-[#E0EDFF]", "font-semibold", "text-xs"], [4, "ngIf"], [1, "flex", "flex-col", "gap-5", "px-5"], [1, "flex", "flex-col", "gap-1"], [1, "flex", "gap-1"], [1, "flex", "gap-2.5", "p-2.5", "bg-black", "rounded-base"], [1, "text-white", "font-normal", "text-xxs", "flex-1", "url-display", "whitespace-nowrap", "truncate"], ["mode", "solid", 3, "click", "addcls"], [1, "flex", "items-center", "gap-1"], ["color", "warn", 1, "text-white", "text-xs", 3, "change", "checked"], [1, "bg-[#434343]", "flex", "flex-col", "gap-1", "p-1"], [1, "flex", "flex-col", "justify-center", "gap-1"], [1, "text-white", "font-normal", "text-xs"], [1, "flex", "gap-2.5", "items-center", "border-y", "border-tab", "py-2.5"], [1, "flex", "items-center", "gap-2.5"], [1, "text-white", "font-semibold", "text-xs"], [1, "bg-white", "rounded-base", "text-xs", "expiry-select", "min-w-[115px]", "items-center", 3, "selectionChange", "value"], [3, "value", 4, "ngFor", "ngForOf"], [1, "text-tab", "font-normal", "text-xxs", "block"], [1, "flex", "flex-col", "justify-center", "gap-2.5"], [1, "bg-[#434343]", "border", "border-tab", "rounded-base", "flex", "flex-col", "justify-end", "gap-2.5", "p-2.5"], [1, "text-tab", "font-normal", "text-xs"], [1, "flex", "flex-col", "gap-1", "pt-2.5"], [1, "w-5", "h-5", "text-tab", "document-icon"], ["name", "file", "type", "indicn"], [1, "flex", "items-center", "gap-2.5", "py-2.5"], [1, "text-tab", "font-normal", "text-xs", "url-display", "whitespace-nowrap", "truncate"], [1, "text-tab", "font-normal", "text-xxs"], [3, "value"], [1, "text-white", "font-semibold", "text-xs", "mb-2"], ["disableEdit", "", 3, "title", "userList"], [1, "text-tab", "font-semibold", "text-xxs", "italic"], ["mode", "darkwhite", "addcls", "bg-white/10", 3, "click"]], template: function DocumentShareComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "h2", 3);
        \u0275\u0275text(4);
        \u0275\u0275pipe(5, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 4)(7, "div", 5)(8, "div", 6)(9, "div", 7);
        \u0275\u0275listener("click", function DocumentShareComponent_Template_div_click_9_listener() {
          return ctx.onShareTypeChange("E");
        });
        \u0275\u0275elementStart(10, "span", 8);
        \u0275\u0275text(11);
        \u0275\u0275pipe(12, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(13, "div", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275element(14, "div", 10);
        \u0275\u0275elementStart(15, "div", 11)(16, "div", 12);
        \u0275\u0275listener("click", function DocumentShareComponent_Template_div_click_16_listener() {
          return ctx.onShareTypeChange("Q");
        });
        \u0275\u0275elementStart(17, "span", 13);
        \u0275\u0275text(18);
        \u0275\u0275pipe(19, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(20, "div", 9);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(21, DocumentShareComponent_ng_container_21_Template, 62, 45, "ng-container", 14)(22, DocumentShareComponent_ng_container_22_Template, 17, 14, "ng-container", 14);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(5, 9, "DOCUMENT_SHARE.TITLE"));
        \u0275\u0275advance(7);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(12, 11, "DOCUMENT_SHARE.EXTERNAL_LINK"));
        \u0275\u0275advance(2);
        \u0275\u0275classMap(ctx.selectedShareType == "E" ? "bg-[#9EC5FF]" : "bg-transparent");
        \u0275\u0275advance(5);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(19, 13, "DOCUMENT_SHARE.QUICK_VIEW_INVITATION"));
        \u0275\u0275advance(2);
        \u0275\u0275classMap(ctx.selectedShareType == "Q" ? "bg-[#9EC5FF]" : "bg-transparent");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.selectedShareType == "E");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.selectedShareType == "Q");
      }
    }, dependencies: [
      FormsModule,
      MatCheckboxModule,
      MatCheckbox,
      MatSelectModule,
      MatSelect,
      MatOption,
      MatFormFieldModule,
      ButtonComponent,
      IconComponent,
      TeamshareComponent,
      DatePipe,
      TranslateModule,
      TranslatePipe,
      CommonModule,
      NgForOf,
      NgIf
    ], styles: ['\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n  max-width: 500px;\n}\n  .mat-mdc-checkbox .mdc-checkbox .mdc-checkbox__background {\n  border-color: #ff3d00 !important;\n}\n  .mat-mdc-checkbox .mdc-checkbox .mdc-checkbox__ripple {\n  background-color: rgba(255, 61, 0, 0.12);\n}\n  .mat-mdc-checkbox .mdc-checkbox--selected .mdc-checkbox__background {\n  background-color: #ff3d00 !important;\n  border-color: #ff3d00 !important;\n}\n  .mat-mdc-checkbox .mdc-checkbox--disabled .mdc-checkbox__background {\n  border-color: rgba(255, 61, 0, 0.38) !important;\n}\n  .mat-mdc-checkbox .mdc-form-field > label {\n  color: white !important;\n  font-size: 12px !important;\n  font-weight: 400 !important;\n  line-height: 1.33 !important;\n}\n.document-icon[_ngcontent-%COMP%] {\n  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));\n}\n.url-display[_ngcontent-%COMP%] {\n  word-break: break-all;\n  font-family: "Courier New", monospace;\n}\n.share-type-option[_ngcontent-%COMP%] {\n  transition: all 0.2s ease-in-out;\n  cursor: pointer;\n}\n.share-type-option[_ngcontent-%COMP%]:hover {\n  opacity: 0.8;\n}\n.copy-button[_ngcontent-%COMP%] {\n  transition: all 0.2s ease-in-out;\n}\n.copy-button[_ngcontent-%COMP%]:hover {\n  background-color: rgba(255, 255, 255, 0.2) !important;\n  transform: translateY(-1px);\n}\n.copy-button[_ngcontent-%COMP%]:active {\n  transform: translateY(0);\n}\n  .expiry-select .mat-mdc-form-field .mat-mdc-form-field-flex {\n  background-color: white !important;\n  border: 1px solid #c2c2c2 !important;\n  border-radius: 10px !important;\n  padding: 8px 0 8px 15px !important;\n  min-height: 40px !important;\n}\n  .expiry-select .mat-mdc-form-field .mat-mdc-form-field-underline {\n  display: none !important;\n}\n  .expiry-select .mat-mdc-form-field .mat-mdc-form-field-subscript-wrapper {\n  display: none !important;\n}\n  .expiry-select .mat-mdc-form-field .mat-mdc-form-field-infix {\n  padding: 0 !important;\n  min-height: auto !important;\n}\n  .expiry-select .mat-mdc-form-field .mat-mdc-select {\n  color: #4f4f4f !important;\n  font-size: 12px !important;\n  font-weight: 400 !important;\n  line-height: 1.33 !important;\n}\n  .expiry-select .mat-mdc-form-field .mat-mdc-select-arrow {\n  color: #4f4f4f !important;\n}\n  .expiry-select .mat-mdc-form-field-wrapper {\n  padding: 0 !important;\n  margin: 0 !important;\n}\n/*# sourceMappingURL=document-share.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DocumentShareComponent, { className: "DocumentShareComponent", filePath: "src\\app\\pdf\\components\\document-share\\document-share.component.ts", lineNumber: 32 });
})();

// src/app/pdf/service/pdf.service.ts
var PdfService = class _PdfService {
  constructor() {
    this.SVG_NS = "http://www.w3.org/2000/svg";
    this.SVG = document.createElementNS(this.SVG_NS, "svg");
    this.G_NODE = document.createElementNS(this.SVG_NS, "g");
    this.RECT_NODE = document.createElementNS(this.SVG_NS, "rect");
    this.LINE_NODE = document.createElementNS(this.SVG_NS, "line");
    this.PATH_NODE = document.createElementNS(this.SVG_NS, "path");
    this.foreignObject_NODE = document.createElementNS(this.SVG_NS, "foreignObject");
    this.UPPER_REGEX = /[A-Z]/g;
    this.REGEX_HASHLESS_HEX = /^([a-f0-9]{6}|[a-f0-9]{3})$/i;
    this.BLACKLIST = ["viewBox"];
    this.isFirefox = /firefox/i.test(navigator.userAgent);
    this.defaultColor = "#FFFF00";
    this.factSvg = "assets/icon/fact.svg";
    this.QfactSvg = "assets/icon/qfact.svg";
    this.docSvg = "assets/icon/doc.svg";
    this.webSvg = "assets/icon/web.svg";
    this.hiltSvg = "assets/img/linktype H.svg";
    this.foreignObjSize = 40;
    this.iconXmargin = 0;
    this._penColor = "#FFFF00";
    this._penSize = 1;
    this.penAnnot = null;
    this.DEFAULT_HEIGHT_HYPERLINK_FOREIGN_OBJ = 15;
    this.convertToSvgRect = (rect, viewport) => {
      let pt1 = [rect.x, rect.y];
      let pt2 = [rect.x + rect.width, rect.y + rect.height];
      pt1 = this.convertToSvgPoint(pt1, viewport);
      pt2 = this.convertToSvgPoint(pt2, viewport);
      return {
        x: Math.min(pt1[0], pt2[0]),
        y: Math.min(pt1[1], pt2[1]),
        width: Math.abs(pt2[0] - pt1[0]),
        height: Math.abs(pt2[1] - pt1[1])
      };
    };
    this.convertToSvgPoint = (pt, viewport) => {
      viewport = viewport;
      let xform = [1, 0, 0, 1, 0, 0];
      xform = this.scale(xform, viewport.scale, viewport.scale);
      xform = this.rotate(xform, viewport.rotation);
      let offset = this.getTranslation(viewport);
      xform = this.translate(xform, offset.x, offset.y);
      return this.applyInverseTransform(pt, xform);
    };
    this.scale = (m, x, y) => {
      return [
        m[0] * x,
        m[1] * x,
        m[2] * y,
        m[3] * y,
        m[4],
        m[5]
      ];
    };
    this.rotate = (m, angle) => {
      angle = angle * Math.PI / 180;
      let cosValue = Math.cos(angle);
      let sinValue = Math.sin(angle);
      return [
        m[0] * cosValue + m[2] * sinValue,
        m[1] * cosValue + m[3] * sinValue,
        m[0] * -sinValue + m[2] * cosValue,
        m[1] * -sinValue + m[3] * cosValue,
        m[4],
        m[5]
      ];
    };
    this.translate = (m, x, y) => {
      return [
        m[0],
        m[1],
        m[2],
        m[3],
        m[0] * x + m[2] * y + m[4],
        m[1] * x + m[3] * y + m[5]
      ];
    };
    this.getSelectionRects = () => {
      try {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
          return null;
        const range0 = selection.getRangeAt(0);
        if (range0.collapsed)
          return null;
        let ancestor = range0.commonAncestorContainer;
        if (ancestor && ancestor.nodeType === Node.TEXT_NODE) {
          ancestor = ancestor.parentElement;
        }
        const pageEl = ancestor?.closest?.(".page") ?? null;
        if (!pageEl)
          return null;
        const pg = parseInt(pageEl.getAttribute("data-page-number") || "");
        if (!pg)
          return null;
        const textLayer = pageEl.querySelector(".textLayer");
        if (!textLayer)
          return null;
        for (let i = 0; i < selection.rangeCount; i++) {
          const range = selection.getRangeAt(i);
          let container = range.commonAncestorContainer;
          if (container && container.nodeType === Node.TEXT_NODE) {
            container = container.parentElement;
          }
          if (!textLayer.contains(container))
            return null;
        }
        const rects = [];
        for (let i = 0; i < selection.rangeCount; i++) {
          const range = selection.getRangeAt(i);
          if (range.collapsed)
            continue;
          for (const r of range.getClientRects()) {
            if (r.width <= 0 || r.height <= 0)
              continue;
            rects.push({ top: r.top, left: r.left, width: r.width, height: r.height });
          }
        }
        if (!rects.length)
          return null;
        return { rects, page: pg, text: selection.toString() };
      } catch {
        return null;
      }
    };
    this.pointIntersectsRect = (x, y, rect) => {
      return y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right;
    };
    this.applyInverseTransform = (p, m) => {
      let d = m[0] * m[3] - m[1] * m[2];
      return [
        (p[0] * m[3] - p[1] * m[2] + m[2] * m[5] - m[4] * m[3]) / d,
        (-p[0] * m[1] + p[1] * m[0] + m[4] * m[1] - m[5] * m[0]) / d
      ];
    };
    this.getIcon = (type, dbIds, uuids, number, color) => {
      let html = `<div data-icon ` + uuids.map((a) => `icon-${a}`).join(" ");
      html = html + ` class="icons ${type == "QF" ? "isQFBubble" : ""}" db-ids="${dbIds ? dbIds.join(",") : ""}" icon-type="${type}"
                        style="box-shadow: rgba(148, 148, 148, 0.25) 0px 3px 10px; background-color: #${color};">
                      <img src="${type == "F" ? this.factSvg : type == "QF" ? this.QfactSvg : type == "D" ? this.docSvg : type == "P" ? this.hiltSvg : this.webSvg}"
                            class="md hydrated">
                      </div>
    `;
      return html;
    };
  }
  getDefaultColor() {
    return this.defaultColor;
  }
  defaultSVG() {
    return this.SVG.cloneNode(true);
  }
  defaultGNode() {
    return this.G_NODE.cloneNode(true);
  }
  defaultRectNode() {
    return this.RECT_NODE.cloneNode(true);
  }
  defaultLineNode() {
    return this.LINE_NODE.cloneNode(true);
  }
  defaultPathNode() {
    return this.PATH_NODE.cloneNode(true);
  }
  defaultForeignObjectNode() {
    return this.foreignObject_NODE.cloneNode(true);
  }
  keyCase(key) {
    if (!this.BLACKLIST.includes(key)) {
      key = key.replace(this.UPPER_REGEX, (match) => "-" + match.toLowerCase());
    }
    return key;
  }
  setPen(penSize = 1, penColor = "#000000") {
    this._penSize = Math.round(parseFloat(penSize) * 100) / 100;
    this._penColor = penColor;
  }
  transform(node, viewport) {
    const trans = this.getTranslation(viewport);
    node.setAttribute("transform", `scale(1) rotate(${viewport.rotation}) translate(${trans.x}, ${trans.y})`);
    return node;
  }
  getAnnotationType(modeltype) {
    if (["QF", "F"].includes(modeltype)) {
      return "highlight";
    }
    return modeltype === "D" ? "strikeout1" : "strikeout";
  }
  getAllSVGAnnots(SVG) {
    return SVG ? SVG.querySelectorAll("[uuid]") : [];
  }
  getBoundingClientRect(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y
    };
  }
  // findSVGAtPoint = (x: number, y: number, svg: SVGAElement | null) => {
  //   const elements: any = this.getAllSVGAnnots(svg);
  //   if (elements && elements.length) {
  //     for (let i = 0, l = elements.length; i < l; i++) {
  //       let el = elements[i];
  //       let rect = el.getBoundingClientRect();
  //       if (this.pointIntersectsRect(x, y, rect)) {
  //         return el;
  //       }
  //       try {
  //         if (el.children && el.children.length) {
  //           for (let m = 0; el.children.length > m; m++) {
  //             let rect = el.children[m].getBoundingClientRect();
  //             if (rect) {
  //               if (this.pointIntersectsRect(x, y, rect)) {
  //                 return el;
  //               }
  //             }
  //           }
  //         }
  //       } catch (error) {
  //       }
  //     }
  //   }
  //   return null;
  // }
  clearSelect() {
    var document2;
    var sel = window.getSelection ? window.getSelection() : document2.selection;
    if (sel) {
      if (sel.removeAllRanges) {
        sel.removeAllRanges();
      } else if (sel.empty) {
        sel.empty();
      }
    }
  }
  getTranslation(viewport) {
    const { rotation, width, height, scale } = viewport;
    const rotations = {
      0: { x: 0, y: 0 },
      90: { x: 0, y: -width / scale },
      180: { x: -width / scale, y: -height / scale },
      270: { x: -height / scale, y: 0 }
    };
    return rotations[rotation % 360];
  }
  setAttributes(node, attributes) {
    try {
      Object.keys(attributes).forEach((key) => {
        if (!Number.isNaN(attributes[key]))
          node.setAttribute(this.keyCase(key), String(attributes[key]));
      });
    } catch (error) {
    }
  }
  normalizeColor(color) {
    return this.REGEX_HASHLESS_HEX.test(color) ? `#${color}` : color;
  }
  /// RENDERING ANNOTATIONS
  createRect(r) {
    const rect = this.defaultRectNode();
    const attributes = __spreadValues(__spreadValues({ x: r.x, y: r.y, width: r.width, height: r.height }, r.index && { index: r.index }), r.fill && { fill: r.fill });
    if (r.rx)
      attributes.rx = r.rx;
    this.setAttributes(rect, attributes);
    return rect;
  }
  renderWavyUnderline(a) {
    return __async(this, null, function* () {
      const path = this.defaultPathNode();
      const d = [];
      const amplitude = 1;
      const frequency = 4;
      if (a.rects?.length) {
        a.rects.forEach((rect) => {
          const { x, y, width } = rect;
          for (let i = 0; i <= width; i += 1) {
            const waveY = y + amplitude * Math.sin(i * frequency * Math.PI / 10);
            d.push(`${i === 0 ? "M" : "L"}${x + i} ${waveY}`);
          }
        });
      }
      this.setAttributes(path, {
        d: d.join(" "),
        uuid: a.uuid,
        type: "DL",
        isTemp: String(a.isTemp || false),
        stroke: this.normalizeColor(a.color || "#000"),
        strokeWidth: a.width || 1,
        fill: "none",
        style: "scale:calc(var(--scale-factor) * 1)"
      });
      return path;
    });
  }
  renderLine(a) {
    return __async(this, null, function* () {
      const group = this.defaultGNode();
      const strokeColor = this.normalizeColor(a.color || this.defaultColor);
      const attributes = a.type === "strikeout" ? { uuid: a.uuid, isTemp: String(a.isTemp || false), stroke: strokeColor, strokeWidth: 1, type: "WL", style: "scale:calc(var(--scale-factor) * 1)" } : { uuid: a.uuid, isTemp: String(a.isTemp || false), stroke: strokeColor, strokeWidth: "1.35", type: "DL", "stroke-dasharray": "1.35", style: "scale:calc(var(--scale-factor) * 1)" };
      this.setAttributes(group, attributes);
      a.rects?.forEach((r) => {
        const line = this.defaultLineNode();
        const cords = { x1: r.x, y1: r.y, x2: r.x + r.width, y2: r.y };
        this.setAttributes(line, cords);
        group.appendChild(line);
        try {
          if (r.bundledetailid)
            this.setAttributes(group, { bundledetailid: r.bundledetailid, hyperlink: "Y" });
          if (r.redirectpage)
            this.setAttributes(group, { redirectpage: r.redirectpage, hyperlink: "Y" });
          if (r.redirectpage2)
            this.setAttributes(group, { redirectpage2: r.redirectpage2, hyperlink: "Y" });
          if (r.redirectline)
            this.setAttributes(group, { redirectline: r.redirectline, hyperlink: "Y" });
          if (r.redirectline2)
            this.setAttributes(group, { redirectline2: r.redirectline2, hyperlink: "Y" });
        } catch (error) {
        }
        if (a.isHyperlink) {
          const foreignObject = this.defaultForeignObjectNode();
          this.setAttributes(foreignObject, { isHyperlink: "Y", uuid: a.uuid, x: r.x, y: r.y - this.DEFAULT_HEIGHT_HYPERLINK_FOREIGN_OBJ, width: r.width, height: this.DEFAULT_HEIGHT_HYPERLINK_FOREIGN_OBJ });
          group.appendChild(foreignObject);
        }
      });
      return group;
    });
  }
  renderPath(a) {
    return __async(this, null, function* () {
      const path = this.defaultPathNode();
      const d = [];
      if (a.lines?.length) {
        d.push(`M${a.lines[0][0]} ${a.lines[0][1]}`);
        for (let i = 1; i < a.lines.length; i++) {
          const p1 = a.lines[i];
          d.push(`L${p1[0]} ${p1[1]}`);
        }
      }
      this.setAttributes(path, {
        d: d.join(" "),
        uuid: a.uuid,
        isTemp: String(a.isTemp || false),
        stroke: this.normalizeColor(a.color || this.defaultColor),
        strokeWidth: a.width || 1,
        strokeMiterlimit: 0,
        fill: "none",
        type: "F",
        strokeDasharray: a?.["stroke-dasharray"] || 0,
        style: "scale:calc(var(--scale-factor) * 1)"
      });
      return path;
    });
  }
  fetchAnnotaitonStructure(annotation, viewport, pageRotation) {
    return __async(this, null, function* () {
      const gNodes = annotation.map((ant) => __async(this, null, function* () {
        let nodeEl = null;
        if (["highlight"].includes(ant.type)) {
          nodeEl = this.transform(yield this.renderRect(ant), viewport);
        } else if (["area"].includes(ant.type)) {
          const updatedViewport = this.updatedViewPort(viewport, pageRotation);
          nodeEl = this.transform(yield this.renderRect(ant), updatedViewport);
        } else if (["strikeout1"].includes(ant.type)) {
          nodeEl = this.transform(yield this.renderLine(ant), viewport);
        } else if (["strikeout", "underline"].includes(ant.type)) {
          nodeEl = this.transform(yield this.renderLine(ant), viewport);
        } else if (ant.type === "drawing") {
          nodeEl = this.transform(yield this.renderPath(ant), viewport);
        }
        return nodeEl;
      }));
      return (yield Promise.all(gNodes)).filter(Boolean);
    });
  }
  generateIcons(icons, viewportOriginal, pageRotation) {
    return __async(this, null, function* () {
      const gNodes = icons.map((icon) => __async(this, null, function* () {
        let nodeEl = null;
        if (icon) {
          const viewport = this.updatedViewPort(viewportOriginal, pageRotation);
          nodeEl = this.transform(yield this.renderForeignObject(icon, viewport), viewport);
        }
        return nodeEl;
      }));
      return (yield Promise.all(gNodes)).filter(Boolean);
    });
  }
  renderRect(a) {
    return __async(this, null, function* () {
      const group = this.defaultGNode();
      let attrs = { uuid: a.uuid, type: a.linktype, isTemp: String(a.isTemp || false), fill: a.type == "area" ? "transparent" : this.normalizeColor(a.color || this.defaultColor), style: "scale: calc(var(--scale-factor) * 1)" };
      if (a.type == "area") {
        attrs["stroke-width"] = "2";
        attrs["stroke"] = this.normalizeColor(a.color || this.defaultColor) || "black";
        a.rects.map((a2) => a2.rx = 15);
      }
      this.setAttributes(group, attrs);
      let rects = a.rects ?? [];
      if (a.type === "highlight" && rects.length >= 5) {
        const heights = rects.map((r) => r.height).slice().sort((x, y) => x - y);
        const widths = rects.map((r) => r.width).slice().sort((x, y) => x - y);
        const medianH = heights[Math.floor(heights.length / 2)];
        const medianW = widths[Math.floor(widths.length / 2)];
        const HEIGHT_FACTOR = 3;
        const WIDTH_FACTOR = 3;
        rects = rects.filter((r) => r.height <= medianH * HEIGHT_FACTOR && r.width <= medianW * WIDTH_FACTOR);
      }
      rects.forEach((r) => group.appendChild(this.createRect(r)));
      return group;
    });
  }
  renderForeignObject(icon, viewport) {
    return __async(this, null, function* () {
      const group = this.defaultForeignObjectNode();
      const groupData = this.groupByLinkType(icon.uuids);
      let height = icon.maxY - icon.minY > groupData.length * this.foreignObjSize ? icon.maxY - icon.minY : groupData.length * this.foreignObjSize;
      let positionY = icon.minY + (icon.maxY - icon.minY) / 2;
      const positionX = viewport.rawDims.pageWidth - this.iconXmargin - 55;
      let classname = "";
      this.setAttributes(group, { style: "scale: calc(var(--scale-factor) * 1)", length: groupData.length, class: classname, x: positionX, min: icon.minY, max: icon.maxY, y: positionY - height / 2, pos: positionY, posmin: height / 2, width: this.foreignObjSize, height });
      group.innerHTML = yield this.GenBubleIcon(groupData, icon.maxY - icon.minY, icon.color);
      return group;
    });
  }
  GenBubleIcon(groupData, height, color) {
    return __async(this, null, function* () {
      let strObj = `<div class="rightfloaticons h-full"  >
          <hr style="height: ${height}px;opacity: 0;" vertical >
          <div class="twobubblewrapper">
      `;
      for (let x of groupData) {
        strObj += this.getIcon(x.linktype, x.ids, x.uuids, x.ids.length, x.color);
      }
      strObj += `</div></div>
   </div>`;
      return String(strObj);
    });
  }
  ////////////////////////////////////////////////////////////////// GROUP BY RECTS
  rangesIntersect(y1, h1, y2, h2) {
    return y1 < y2 + h2 && y2 < y1 + h1;
  }
  getMinY(annotation) {
    const rectYValues = annotation.rects ? annotation.rects.map((rect) => rect.y) : [];
    const lineYValues = annotation.lines ? annotation.lines.map((line) => parseFloat(line[1])) : [];
    return Math.min(...rectYValues, ...lineYValues);
  }
  groupByYIntersections(data) {
    data = data.filter((a) => !a.isTemp && !a.isHyperlink);
    data.sort((a, b) => this.getMinY(a) - this.getMinY(b));
    const groups = [];
    data.forEach((item) => {
      const elements = item.rects && item.rects.length ? item.rects : item.lines?.map((line) => ({ y: parseFloat(line[1]), height: Number(item.width) || 4 }));
      if (!elements)
        return;
      let groupFound = false;
      let minY = Math.min(...elements.map((el) => el.y));
      let maxY = Math.max(...elements.map((el) => el.y + el.height));
      for (const group of groups) {
        for (const member of group.uuids) {
          const memberItem = data.find((d) => d.uuid === member.uuid);
          if (!memberItem)
            continue;
          const memberElements = memberItem.rects || memberItem.lines?.map((line) => ({ y: parseFloat(line[1]), height: Number(memberItem.width) || 4 }));
          if (memberElements?.some((memberElement) => elements.some((element) => this.rangesIntersect(element.y, element.height, memberElement.y, memberElement.height)))) {
            group.uuids.push({ uuid: item.uuid, id: item.id, linktype: item.linktype, color: item.color });
            group.minY = Math.min(group.minY, minY);
            group.maxY = Math.max(group.maxY, maxY);
            groupFound = true;
            break;
          }
        }
        if (groupFound)
          break;
      }
      if (!groupFound) {
        groups.push({ uuids: [{ uuid: item.uuid, id: item.id, linktype: item.linktype, color: item.color }], minY, maxY });
      }
    });
    return groups.map((group) => ({
      uuids: group.uuids,
      minY: group.minY,
      maxY: group.maxY
    }));
  }
  groupByLinkType(data) {
    return data.map((item) => {
      const { uuid, id, linktype, color } = item;
      return { uuids: [uuid], ids: [id], linktype, color };
    });
  }
  generateRandomId() {
    return v4_default();
  }
  saveRect(type, pageNumber, rects, color, viewport, svg, pageRotation, preCapturedBoundingRect) {
    return __async(this, null, function* () {
      if (!svg) {
        return Promise.reject({ msg: "Svg not found" });
      }
      try {
        const boundingRect = preCapturedBoundingRect ?? svg.getBoundingClientRect();
        if (!color) {
          color = type === "strikeout1" ? "#0066ff" : this.defaultColor;
        }
        const rt = viewport.rotation;
        const annotation = {
          isTemp: true,
          id: null,
          linktype: "F",
          type,
          color,
          uuid: this.generateRandomId(),
          page: pageNumber,
          rects: [...rects].map((r) => {
            let offset = 0;
            if (type === "strikeout" || type === "strikeout1") {
              offset = [90, 270].includes(rt) ? r.width : r.height;
            }
            return this.convertToSvgRect({
              y: r.top + (rt == 0 ? offset : 0) - (rt == 180 ? offset : 0) - boundingRect.top,
              x: r.left - boundingRect.left - (rt == 90 ? offset : 0) + (rt == 270 ? offset : 0),
              width: r.width,
              height: r.height
            }, viewport);
          }).filter((r) => r.width > 0 && r.height > 0 && r.x > -1 && r.y > -1)
        };
        if (!annotation.rects || !annotation.rects.length) {
          return Promise.reject({ msg: "0 Reactangles length" });
        }
        const annotElement = yield this.fetchAnnotaitonStructure([annotation], viewport, pageRotation);
        svg.append(...annotElement);
        return Promise.resolve(annotation);
      } catch (error) {
        return Promise.reject({ msg: "Failed to annot", error });
      }
    });
  }
  savePoint(x, y, svg, viewport, pageno, lines, pageRotation) {
    return __async(this, null, function* () {
      if (!svg || !viewport)
        return;
      const rect = svg.getBoundingClientRect();
      let clampedX = Math.max(rect.left, Math.min(x, rect.right));
      let clampedY = Math.max(rect.top, Math.min(y, rect.bottom));
      let point = this.convertToSvgPoint([
        clampedX - rect.left,
        clampedY - rect.top
      ], viewport);
      point[0] = point[0].toFixed(2);
      point[1] = point[1].toFixed(2);
      lines.push(point);
      if (lines.length <= 1)
        return;
      if (this.svgPath)
        svg.removeChild(this.svgPath);
      const annot = {
        isTemp: true,
        id: null,
        linktype: "F",
        uuid: this.generateRandomId(),
        page: pageno,
        type: "drawing",
        color: this._penColor,
        width: this._penSize,
        lines
      };
      this.penAnnot = annot;
      const annotElement = yield this.fetchAnnotaitonStructure([annot], viewport, pageRotation);
      if (annotElement.length) {
        this.svgPath = annotElement[0];
        svg.append(...annotElement);
      }
    });
  }
  getOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.pageYOffset,
      left: rect.left + window.pageXOffset
    };
  }
  findAnnotInSVG(SVG, uuid) {
    return SVG ? SVG.querySelector(`[uuid="${uuid}"]`) : null;
  }
  removeByUUID(SVG, uuid) {
    const annot = this.findAnnotInSVG(SVG, uuid);
    if (annot) {
      SVG.removeChild(annot);
    }
  }
  changeAnnotColor(SVG, color, uuid, type) {
    const annot = this.findAnnotInSVG(SVG, uuid);
    if (annot) {
      if (type == "highlight")
        annot.setAttribute("fill", color);
      else if (type == "area")
        annot.setAttribute("stroke", color);
      else if (type == "drawing")
        annot.setAttribute("stroke", color);
    }
  }
  findTemporaryAnnot(x, y, x2, y2, svg, tempAnnots) {
    if (!svg) {
      return null;
    }
    const elements = this.getAllSVGAnnots(svg);
    const offset = svg.getBoundingClientRect();
    const point = svg.createSVGPoint();
    let findElement = null;
    for (let element of elements) {
      const uuid = element.getAttribute("uuid");
      const rect = this.getBoundingClientRect(element);
      const tempAnnot = tempAnnots.find((a) => a.annots.uuid == uuid);
      if (tempAnnot) {
        const annot = tempAnnot.annots;
        const hType = annot.type;
        if ("drawing" == hType) {
          try {
            const rotate = parseInt(element.getAttribute("transform").match(/rotate\((\d+)/)?.[1] || "0");
            var x_in = x2;
            var y_in = y2;
            if (rotate == 270) {
              x_in = offset.height - y_in;
              y_in = x_in;
            } else if (rotate == 90) {
              x_in = y_in;
              y_in = offset.width - x_in;
            } else if (rotate == 180) {
              x_in = offset.width - x_in;
              y_in = offset.height - y_in;
            }
            let scaleFactor = getComputedStyle(svg).getPropertyValue("--scale-factor");
            point.x = x_in / scaleFactor;
            point.y = y_in / scaleFactor;
            if (element.isPointInStroke(point)) {
              findElement = element;
              break;
            }
          } catch (error) {
            console.error(error);
          }
        } else {
          try {
            if (["strikeout1", "strikeout"].includes(hType)) {
              rect.top = rect.top - 20;
              rect.bottom = rect.bottom + 10;
              rect.height = 20;
            }
          } catch (error) {
            console.error(error);
          }
          const elems = this.pointIntersectsRect(x, y, rect);
          if (elems) {
            findElement = element;
            break;
          }
        }
      }
    }
    return Promise.resolve(findElement);
  }
  findAnnotAtPoint(x, y, x2, y2, svg, globannots, isOnlyHyperlink, isDocLinks, isForpresent) {
    if (!svg) {
      return null;
    }
    const elements = this.getAllSVGAnnots(svg);
    const offset = svg.getBoundingClientRect();
    const point = svg.createSVGPoint();
    let findElement = null;
    for (let element of elements) {
      const uuid = element.getAttribute("uuid");
      const rect = this.getBoundingClientRect(element);
      const annot = globannots.find((a) => a.uuid == uuid && ((isOnlyHyperlink ? a.isHyperlink : false) || (isDocLinks ? a.linktype == "D" : false) || isForpresent));
      if (annot) {
        const hType = annot.type;
        if ("drawing" == hType) {
          try {
            const rotate = parseInt(element.getAttribute("transform").match(/rotate\((\d+)/)?.[1] || "0");
            var x_in = x2;
            var y_in = y2;
            if (rotate == 270) {
              x_in = offset.height - y_in;
              y_in = x_in;
            } else if (rotate == 90) {
              x_in = y_in;
              y_in = offset.width - x_in;
            } else if (rotate == 180) {
              x_in = offset.width - x_in;
              y_in = offset.height - y_in;
            }
            let scaleFactor = getComputedStyle(svg).getPropertyValue("--scale-factor");
            point.x = x_in / scaleFactor;
            point.y = y_in / scaleFactor;
            if (element.isPointInStroke(point)) {
              findElement = element;
              break;
            }
          } catch (error) {
            console.error(error);
          }
        } else {
          try {
            if (["strikeout1", "strikeout"].includes(hType)) {
              rect.top = rect.top - 20;
              rect.bottom = rect.bottom + 10;
              rect.height = 20;
            }
          } catch (error) {
            console.error(error);
          }
          const elems = this.pointIntersectsRect(x, y, rect);
          if (elems) {
            findElement = element;
            break;
          }
        }
      }
    }
    return Promise.resolve(findElement);
  }
  buildSVG(viewport, anotData, nFSid, pageRotation) {
    return __async(this, null, function* () {
      const SVG = this.defaultSVG();
      try {
        if (anotData.length) {
          const gNodes = yield this.fetchAnnotaitonStructure(anotData, viewport, pageRotation);
          if (gNodes.length) {
            if (!nFSid) {
              const iconsAnnot = anotData.filter((a) => a.linktype != "P");
              const matcherd = this.groupByYIntersections(iconsAnnot);
              if (matcherd.length) {
                const icons = yield this.generateIcons(matcherd, viewport, pageRotation);
                gNodes.unshift(...icons);
              }
            }
            gNodes.sort((a, b) => {
              const aY = parseFloat(a.getAttribute("y") || "0");
              const bY = parseFloat(b.getAttribute("y") || "0");
              return aY - bY;
            });
            SVG.append(...gNodes);
          } else {
            console.error("ANNOTATION ARE INVALID HIGHLIGHT", anotData);
          }
        }
      } catch (error) {
      }
      return SVG;
    });
  }
  buildHyperlinkSVG(viewport, anotData, pageRotation) {
    return __async(this, null, function* () {
      const SVGs = [];
      try {
        if (anotData.length) {
          const gNodes = yield this.fetchAnnotaitonStructure(anotData, viewport, pageRotation);
          if (gNodes.length) {
            const SVG = this.defaultSVG();
            this.setAttributes(SVG, { class: "svg-uper" });
            SVG.append(...gNodes);
            SVGs.push(SVG);
          } else {
            console.error("ANNOTATION ARE INVALID HIGHLIGHT", anotData);
          }
        }
      } catch (error) {
      }
      return SVGs;
    });
  }
  elementScroll(element) {
    if (!element)
      return;
    element.scrollIntoView({
      block: "center",
      // aligns the element to the center of the viewport
      inline: "center"
      // aligns the element to the center inline axis (horizontal alignment)
    });
  }
  /*
    findAllAnnotationAtPoint(x, y, x2, y2, svg: any, tempAnnots: temporaryAnnots[]): Promise<any> {
      if (!svg) {
        return null;
      }
      var filterres = [];
  
      // SVGPoint is deprecated according to MDN
      let point = svg.createSVGPoint();
  
      const elements: any = this.getAllSVGAnnots(svg);
  
      let offset = svg.getBoundingClientRect();
  
      for (let element of elements) {
        const uuid = element.getAttribute('uuid');
        // const hType = this.tempA
        var rect = this.getBoundingClientRect(element) //element.getBoundingClientRect();
  
        if (["drawing"].includes(element.getAttribute("data-pdf-annotate-type"))) {
          try {
            var trans = parseInt(element.getAttribute('transform').split(' ')[0].replace(/\D/g, ""));
            var rotate = parseInt(element.getAttribute('transform').split(' ')[1].replace(/\D/g, ""));
            // var bbox = element.getBBox();
            var actualsize = 100; // - 100;
            var x_in = x2;
            var y_in = y2;
            if (rotate == 270) {
              x_in = (offset.height - y_in);
              y_in = x_in
            } else if (rotate == 90) {
              x_in = y_in;
              y_in = (offset.width - x_in);
            } else if (rotate == 180) {
              x_in = (offset.width - x_in);
              y_in = (offset.height - y_in);
            }
            let scaleFactor: any = getComputedStyle(svg).getPropertyValue('--scale-factor');
            point.x = x_in / scaleFactor;
            point.y = y_in / scaleFactor;
            if (element.isPointInStroke(point)) {
              filterres.push(element);
            }
          } catch (error) {
          }
        } else {
          if (["strikeout1", "strikeout"].includes(element.getAttribute("data-pdf-annotate-type"))) {
            rect.top = rect.top - 20;
            rect.bottom = rect.bottom + 10;
            rect.height = 20;
          }
          var el = this.pointIntersectsRect(x, y, rect);
          if (el) {
            filterres.push(element);
          }
        }
      }
      return Promise.all(filterres);
    }*/
  updatedViewPort(viewportOriginal, pageRotation) {
    try {
      const viewport = __spreadProps(__spreadValues({}, viewportOriginal), { rawDims: __spreadValues({}, viewportOriginal.rawDims) });
      const margin = viewport.rotation - pageRotation;
      if (margin && !viewport?.isUpdated) {
        const h = viewport.rawDims.pageHeight;
        const w = viewport.rawDims.pageWidth;
        viewport.rawDims.pageHeight = w;
        viewport.rawDims.pageWidth = h;
        viewport.isUpdated = true;
        viewport.rotation = Math.abs(viewport.rotation - margin);
      }
      return viewport;
    } catch (error) {
      console.error(error);
      return viewportOriginal;
    }
  }
  static {
    this.\u0275fac = function PdfService_Factory(t) {
      return new (t || _PdfService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PdfService, factory: _PdfService.\u0275fac, providedIn: "root" });
  }
};

// src/app/pdf/components/pdf/pdf.component.ts
var _c03 = ["menuTrigger"];
var _c1 = ["noteopener"];
var _c2 = ["pdfViewer"];
var PdfComponent_Defer_10_DepsFn = () => [import("./chunk-2ZIPM7V7.js").then((m) => m.RightPanelComponent), NgClass, import("./chunk-VIIPU6IT.js").then((m) => m.SideModalManagerComponent)];
var PdfComponent_Conditional_1_Defer_3_DepsFn = () => [import("./chunk-DVLFMKWS.js").then((m) => m.ToolbarComponent), NgClass];
var PdfComponent_Conditional_1_Conditional_5_Defer_2_DepsFn = () => [import("./chunk-YS3IBGQ2.js").then((m) => m.LinkexplorerToolsComponent)];
var PdfComponent_Conditional_3_Defer_2_DepsFn = () => [import("./chunk-HNOP56CB.js").then((m) => m.ToolboxComponent)];
var PdfComponent_Conditional_20_Defer_1_DepsFn = () => [import("./chunk-Y7S2OKZA.js").then((m) => m.NoteComponent)];
var PdfComponent_Conditional_21_Defer_1_DepsFn = () => [import("./chunk-WTY7J65W.js").then((m) => m.LinkShareComponent)];
var _c3 = (a0, a1) => ({ "!bg-transparent": a0, "callout-active": a1 });
var _c4 = (a0, a1) => ({ "left": a0, "top": a1 });
var _c5 = (a0, a1, a2) => ({ "svgOverlay": a0, "border-4 border-blue-on": a1, "w-[calc(100%_-_520px)]": a2 });
var _c6 = (a0, a1, a2, a3) => ({ "drawing-rect": a0, "IsIndex": a1, "pdf-Copytoclipboard": a2, "rightpreviewpdf": a3 });
var _c7 = (a0) => ({ "fixed top-14 w-full z-10": a0 });
var _c8 = (a0) => ({ "text-white !bg-blue-on border font-bold border-white": a0 });
var _c9 = (a0, a1, a2, a3) => ({ "shadow-[-6px_-3px_10px_0px_#e8e8eb7a]": a0, "!h-[calc(100%_-_108px)] !top-[108px]": a1, "!top-0 !h-full": a2, "z-20 w-full": a3 });
var _c10 = (a0, a1, a2, a3, a4) => ({ "shadow-[-6px_-3px_10px_0px_#e8e8eb7a]": a0, "bg-white h-[calc(100%-50px)]": a1, "!h-[calc(100%_-_108px)] !top-[108px]": a2, "!top-0 !h-full": a3, "z-20 w-full": a4 });
function PdfComponent_Conditional_1_Defer_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "pdftool", 21);
    \u0275\u0275listener("onEvent", function PdfComponent_Conditional_1_Defer_1_Template_pdftool_onEvent_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.OnEventOfLinks($event));
    });
    \u0275\u0275twoWayListener("isAnnotToolChange", function PdfComponent_Conditional_1_Defer_1_Template_pdftool_isAnnotToolChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.isAnnotTool, $event) || (ctx_r3.isAnnotTool = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("toolEvents", function PdfComponent_Conditional_1_Defer_1_Template_pdftool_toolEvents_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.onToolEvents($event));
    });
    \u0275\u0275twoWayListener("isAdjustDocChange", function PdfComponent_Conditional_1_Defer_1_Template_pdftool_isAdjustDocChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.isAdjustDoc, $event) || (ctx_r3.isAdjustDoc = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("isFullScreenChange", function PdfComponent_Conditional_1_Defer_1_Template_pdftool_isFullScreenChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.onFullScreenChange($event));
    });
    \u0275\u0275twoWayListener("cSearchChange", function PdfComponent_Conditional_1_Defer_1_Template_pdftool_cSearchChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.cSearch, $event) || (ctx_r3.cSearch = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(39, _c7, ctx_r3.compareMode))("pageRotation", ctx_r3.pageRotation)("nCaseid", ctx_r3.nCaseid)("handTool", ctx_r3.handTool)("isCalloutActive", ctx_r3.calloutOverlayActive)("zoom", ctx_r3.zoom)("totalSearch", ctx_r3.totalSearch)("currentSearch", ctx_r3.currentSearch)("isSearching", ctx_r3.isSearching)("pageViewMode", ctx_r3.pageViewMode);
    \u0275\u0275twoWayProperty("isAnnotTool", ctx_r3.isAnnotTool);
    \u0275\u0275property("docInfo", ctx_r3.docInfo)("isLink", ctx_r3.isLink)("currentPage", ctx_r3.currentPage)("pagesCount", ctx_r3.pagesCount)("highlightMode", ctx_r3.highlightMode)("annotToolMode", ctx_r3.annotToolMode)("fullMode", ctx_r3.fullMode)("compareMode", ctx_r3.compareMode)("pdfLoaded", ctx_r3.pdfLoaded)("isnavigate", ctx_r3.visibleMarkNavModel)("isProperties", ctx_r3.modeltype == "VP" || ctx_r3.modeltype == "AP")("isIssue", ctx_r3.modeltype == "IL")("linkExplorerMode", ctx_r3.linkExplorerMode)("pagginationRenge", ctx_r3.pagginationRenge)("isConverttopagelevel", ctx_r3.isConverttopagelevel)("onPdfEvent", ctx_r3.onPdfEvent)("isHavehighlights", ctx_r3.isHavehighlights)("selectedIssues", ctx_r3.selectedIssues)("activesectiontype", ctx_r3.activesectiontype)("jFilter", ctx_r3.jFilter);
    \u0275\u0275twoWayProperty("isAdjustDoc", ctx_r3.isAdjustDoc);
    \u0275\u0275property("isFullScreen", ctx_r3.isFullScreen)("showAll", ctx_r3.showAll);
    \u0275\u0275twoWayProperty("cSearch", ctx_r3.cSearch);
    \u0275\u0275property("matchCase", ctx_r3.matchCase)("wholeWords", ctx_r3.wholeWords)("showsearch", ctx_r3.showsearch)("thumbnailMode", ctx_r3.sideBar);
  }
}
function PdfComponent_Conditional_1_DeferPlaceholder_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 22);
    \u0275\u0275element(1, "sklton", 23)(2, "sklton", 24)(3, "sklton", 25)(4, "sklton", 26)(5, "sklton", 27)(6, "sklton", 27)(7, "sklton", 27);
    \u0275\u0275elementEnd();
  }
}
function PdfComponent_Conditional_1_Conditional_5_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "link-explorer", 28);
    \u0275\u0275listener("onEvent", function PdfComponent_Conditional_1_Conditional_5_Defer_0_Template_link_explorer_onEvent_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r3.OnEventLinkExplorer($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(3);
    \u0275\u0275property("docInfo", ctx_r3.docInfo)("linkExplorerMode", ctx_r3.linkExplorerMode)("linkExplorerType", ctx_r3.linkExplorerType);
  }
}
function PdfComponent_Conditional_1_Conditional_5_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function PdfComponent_Conditional_1_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Conditional_1_Conditional_5_Defer_0_Template, 1, 3)(1, PdfComponent_Conditional_1_Conditional_5_DeferPlaceholder_1_Template, 1, 0);
    \u0275\u0275defer(2, 0, PdfComponent_Conditional_1_Conditional_5_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r3.linkExplorerMode);
  }
}
function PdfComponent_Conditional_1_Conditional_7_Template(rf, ctx) {
}
function PdfComponent_Conditional_1_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17)(1, "div", 29);
    \u0275\u0275listener("click", function PdfComponent_Conditional_1_Conditional_8_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.closeEdit());
    });
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3, "Edit Mode");
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "icon", 30);
    \u0275\u0275elementEnd()();
  }
}
function PdfComponent_Conditional_1_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 18);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 31)(2, "text", 32)(3, "tspan", 33);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "tspan", 34);
    \u0275\u0275text(6, "%");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "tspan", 35);
    \u0275\u0275text(8, "progress");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(9, "circle", 36)(10, "circle", 37);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r3.loadingProgress, " ");
    \u0275\u0275advance(6);
    \u0275\u0275attribute("stroke-dashoffset", 282.743 - ctx_r3.loadingProgress / 100 * 282.743);
  }
}
function PdfComponent_Conditional_1_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 38);
  }
}
function PdfComponent_Conditional_1_Conditional_13_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 42);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(3);
    \u0275\u0275styleProp("left", ctx_r3.calloutRect.x, "px")("top", ctx_r3.calloutRect.y, "px")("width", ctx_r3.calloutRect.w, "px")("height", ctx_r3.calloutRect.h, "px");
  }
}
function PdfComponent_Conditional_1_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 20);
    \u0275\u0275template(1, PdfComponent_Conditional_1_Conditional_13_Conditional_1_Template, 1, 8, "div", 39);
    \u0275\u0275elementStart(2, "div", 40);
    \u0275\u0275text(3, " Draw a rectangle to capture. ");
    \u0275\u0275elementStart(4, "span", 41);
    \u0275\u0275listener("click", function PdfComponent_Conditional_1_Conditional_13_Template_span_click_4_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.exitCalloutMode());
    });
    \u0275\u0275text(5, "\u2715 Close");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r3.calloutRect ? 1 : -1);
  }
}
function PdfComponent_Conditional_1_ng_template_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 43)(1, "div", 44)(2, "div", 45)(3, "div", 46);
    \u0275\u0275listener("click", function PdfComponent_Conditional_1_ng_template_14_Template_div_click_3_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.spredmodeChnage("off"));
    });
    \u0275\u0275text(4, " Single ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 46);
    \u0275\u0275listener("click", function PdfComponent_Conditional_1_ng_template_14_Template_div_click_5_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.spredmodeChnage("odd"));
    });
    \u0275\u0275text(6, " Double ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "button", 47);
    \u0275\u0275listener("click", function PdfComponent_Conditional_1_ng_template_14_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.closeSideBar());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(8, "svg", 48);
    \u0275\u0275element(9, "path", 49);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275element(10, "pdf-sidebar-content")(11, "div", 50);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(2, _c8, ctx_r3.spreadMode == "off"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(4, _c8, ctx_r3.spreadMode == "odd"));
  }
}
function PdfComponent_Conditional_1_Conditional_16_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 51);
    \u0275\u0275element(1, "icon", 52);
    \u0275\u0275elementEnd();
  }
}
function PdfComponent_Conditional_1_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Conditional_1_Conditional_16_Conditional_0_Template, 2, 0, "div", 51);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, (ctx_r3.docInfo == null ? null : ctx_r3.docInfo.isRealtime) ? 0 : -1);
  }
}
function PdfComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275template(1, PdfComponent_Conditional_1_Defer_1_Template, 1, 41)(2, PdfComponent_Conditional_1_DeferPlaceholder_2_Template, 8, 0);
    \u0275\u0275defer(3, 1, PdfComponent_Conditional_1_Defer_3_DepsFn, null, 2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, PdfComponent_Conditional_1_Conditional_5_Template, 4, 1);
    \u0275\u0275elementStart(6, "div", 16);
    \u0275\u0275template(7, PdfComponent_Conditional_1_Conditional_7_Template, 0, 0)(8, PdfComponent_Conditional_1_Conditional_8_Template, 5, 0, "div", 17)(9, PdfComponent_Conditional_1_Conditional_9_Template, 11, 2, "div", 18)(10, PdfComponent_Conditional_1_Conditional_10_Template, 1, 0);
    \u0275\u0275elementStart(11, "ngx-extended-pdf-viewer", 19, 2);
    \u0275\u0275twoWayListener("zoomChange", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_zoomChange_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r3.zoom, $event) || (ctx_r3.zoom = $event);
      return \u0275\u0275resetView($event);
    })("pageChange", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_pageChange_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r3.currentPage, $event) || (ctx_r3.currentPage = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("pageChange", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_pageChange_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onPageChange($event));
    })("pageRendered", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_pageRendered_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onPageRendered($event));
    });
    \u0275\u0275twoWayListener("sidebarVisibleChange", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_sidebarVisibleChange_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r3.sideBar, $event) || (ctx_r3.sideBar = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("pdfLoaded", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_pdfLoaded_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onPdfLoaded($event));
    })("mousedown", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_mousedown_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.OnMouseDown($event));
    })("mouseup", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_mouseup_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.OnMouseUp($event));
    })("contextmenu", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_contextmenu_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onRightClick($event));
    })("mousemove", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_mousemove_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onMouseMove($event));
    })("zoomChange", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_zoomChange_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onZoomChanged($event));
    })("rotationChange", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_rotationChange_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onRotationChange($event));
    })("updateFindMatchesCount", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_updateFindMatchesCount_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onFind($event));
    })("updateFindState", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_updateFindState_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onFindState($event));
    })("progress", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_progress_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onProgress($event));
    })("currentZoomFactor", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_currentZoomFactor_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.OncurrentZoomFactor($event));
    })("pdfLoadingStarts", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_pdfLoadingStarts_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onPdfLoadingStart($event));
    })("pdfLoadingFailed", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_pdfLoadingFailed_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onPdfLoadingFailed($event));
    })("click", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_click_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.DocumentClick($event));
    })("dblclick", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_dblclick_11_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.openInIndividual());
    })("pagesLoaded", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_pagesLoaded_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.OnPageLoad($event));
    })("mouseover", function PdfComponent_Conditional_1_Template_ngx_extended_pdf_viewer_mouseover_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.OnMouseOver($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(13, PdfComponent_Conditional_1_Conditional_13_Template, 6, 1, "div", 20)(14, PdfComponent_Conditional_1_ng_template_14_Template, 12, 6, "ng-template", null, 3, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275template(16, PdfComponent_Conditional_1_Conditional_16_Template, 1, 1);
  }
  if (rf & 2) {
    const fancySidebar_r9 = \u0275\u0275reference(15);
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275classProp("hidden", ctx_r3.compareMode);
    \u0275\u0275advance(3);
    \u0275\u0275deferWhen(!ctx_r3.loading && !ctx_r3.pdfFailed);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(5, ctx_r3.linkExplorerMode ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275classProp("qfact-pdf-shift", ctx_r3.qfactPanelOpen && !ctx_r3.compareMode && ctx_r3.fullMode);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction3(26, _c5, ctx_r3._rectEnabled || ctx_r3._panEnabled, ctx_r3.nFSid, ctx_r3.modeltype && ctx_r3.modeltype != "LS" && !ctx_r3.compareMode || ctx_r3.visibleMarkNavModel || ctx_r3.visibleIssueModel));
    \u0275\u0275advance();
    \u0275\u0275conditional(7, ctx_r3.compareMode ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(8, ctx_r3.nFSid ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(9, !ctx_r3.pdfLoaded ? 9 : ctx_r3.loading ? 10 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction4(30, _c6, ctx_r3.isDrawingRect, ctx_r3.docInfo == null ? null : ctx_r3.docInfo.cIsindex, ctx_r3.Copytoclipboard, !ctx_r3.fullMode && !ctx_r3.isLink))("nameddest", ctx_r3.nameDestination)("src", ctx_r3.pdfSrc + ((ctx_r3.docInfo == null ? null : ctx_r3.docInfo.version) && (ctx_r3.docInfo == null ? null : ctx_r3.docInfo.version) != "" ? "?VersionId=" + (ctx_r3.docInfo == null ? null : ctx_r3.docInfo.version) : ""))("showToolbar", false);
    \u0275\u0275twoWayProperty("zoom", ctx_r3.zoom);
    \u0275\u0275property("rotation", ctx_r3.pageRotation)("pageViewMode", ctx_r3.pageViewMode)("handTool", ctx_r3.handTool)("showBorders", false);
    \u0275\u0275twoWayProperty("page", ctx_r3.currentPage)("sidebarVisible", ctx_r3.sideBar);
    \u0275\u0275property("scrollMode", ctx_r3.scrollMode)("customSidebar", fancySidebar_r9)("spread", ctx_r3.spreadMode);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(13, ctx_r3.calloutOverlayActive ? 13 : -1);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(16, !ctx_r3.pdfLoaded ? 16 : -1);
  }
}
function PdfComponent_Conditional_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 53)(1, "icon", 59);
    \u0275\u0275listener("click", function PdfComponent_Conditional_2_Conditional_0_Template_icon_click_1_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.closeRealtimePdf());
    });
    \u0275\u0275elementEnd()();
  }
}
function PdfComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Conditional_2_Conditional_0_Template, 2, 0, "div", 53);
    \u0275\u0275elementStart(1, "div", 54)(2, "div", 55);
    \u0275\u0275element(3, "img", 56);
    \u0275\u0275elementStart(4, "h6", 57);
    \u0275\u0275text(5, "Failed to load the pdf");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "h6", 58);
    \u0275\u0275text(7, "please close this pdf & load again");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, (ctx_r3.docInfo == null ? null : ctx_r3.docInfo.isRealtime) ? 0 : -1);
  }
}
function PdfComponent_Conditional_3_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "toolbox", 60);
    \u0275\u0275listener("OnEvent", function PdfComponent_Conditional_3_Defer_0_Template_toolbox_OnEvent_0_listener($event) {
      \u0275\u0275restoreView(_r11);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.OnToolBoxEvent($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(\u0275\u0275pureFunction2(12, _c4, ctx_r3.highlightBoxOptions.x + "px", ctx_r3.highlightBoxOptions.y + "px"));
    \u0275\u0275property("highlightMode", ctx_r3.highlightMode)("annotToolMode", ctx_r3.annotToolMode)("tempAnnots", ctx_r3.tempAnnots)("isChecked", ctx_r3.isChecked)("isLink", ctx_r3.isLink)("highlightIndex", ctx_r3.highlightIndex)("docInfo", ctx_r3.docInfo)("nFSid", ctx_r3.nFSid)("cSelectedClr", ctx_r3.cSelectedClr)("visibleMarkNavModel", ctx_r3.visibleMarkNavModel);
  }
}
function PdfComponent_Conditional_3_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function PdfComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Conditional_3_Defer_0_Template, 1, 15)(1, PdfComponent_Conditional_3_DeferPlaceholder_1_Template, 1, 0);
    \u0275\u0275defer(2, 0, PdfComponent_Conditional_3_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r3.highlightBox);
  }
}
function PdfComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "qfact-rapid-popup", 61);
    \u0275\u0275listener("closed", function PdfComponent_Conditional_4_Template_qfact_rapid_popup_closed_0_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onQFactNotePopupClosed());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275property("selectedIssues", ctx_r3.qfactNotePopupIssues)("highlightText", ctx_r3.qfactNotePopupHighlightText)("includeText", ctx_r3.qfactNotePopupIncludeText)("anchor", ctx_r3.qfactNotePopupAnchor)("saveNoteFn", ctx_r3.qfactNotePopupSaveFn);
  }
}
function PdfComponent_Conditional_7_Conditional_0_span_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 70);
    \u0275\u0275text(1, "Single & Double");
    \u0275\u0275elementEnd();
  }
}
function PdfComponent_Conditional_7_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 62)(1, "button", 64);
    \u0275\u0275listener("click", function PdfComponent_Conditional_7_Conditional_0_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.toggleThumbnailsTab());
    });
    \u0275\u0275elementStart(2, "span", 65);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 66);
    \u0275\u0275element(4, "rect", 67)(5, "line", 68);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, PdfComponent_Conditional_7_Conditional_0_span_6_Template, 2, 0, "span", 69);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r3.sideBar ? "pl-1 pr-4 bg-white ring-2 ring-blue-on text-blue-on" : ctx_r3.spreadMode === "off" ? "pl-1 pr-4 bg-white ring-1 ring-black/5 text-dark-blue hover:ring-blue-on/50" : "p-1 bg-white ring-1 ring-black/5 text-dark-blue hover:ring-blue-on/50");
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx_r3.sideBar || ctx_r3.spreadMode === "off");
  }
}
function PdfComponent_Conditional_7_Conditional_1_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 82);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r3.selectedIssues.length, " ");
  }
}
function PdfComponent_Conditional_7_Conditional_1_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 90);
    \u0275\u0275listener("click", function PdfComponent_Conditional_7_Conditional_1_Conditional_19_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r3 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r3.toggleQFactTab());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 91);
    \u0275\u0275element(2, "polyline", 92);
    \u0275\u0275elementEnd()();
  }
}
function PdfComponent_Conditional_7_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 63)(1, "button", 71);
    \u0275\u0275listener("click", function PdfComponent_Conditional_7_Conditional_1_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.toggleThumbnailsTab());
    });
    \u0275\u0275elementStart(2, "span", 72);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 66);
    \u0275\u0275element(4, "rect", 67)(5, "line", 68);
    \u0275\u0275elementEnd()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(6, "div", 73);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 74);
    \u0275\u0275element(8, "path", 75);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "button", 76);
    \u0275\u0275listener("click", function PdfComponent_Conditional_7_Conditional_1_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.toggleQFactTab());
    });
    \u0275\u0275elementStart(10, "span", 77);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(11, "svg", 78);
    \u0275\u0275element(12, "path", 79)(13, "circle", 80);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(14, "span", 81);
    \u0275\u0275text(15, " QFact ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(16, PdfComponent_Conditional_7_Conditional_1_Conditional_16_Template, 2, 1, "span", 82);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "div", 83);
    \u0275\u0275element(18, "div", 84);
    \u0275\u0275template(19, PdfComponent_Conditional_7_Conditional_1_Conditional_19_Template, 3, 0, "div", 85);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "button", 86);
    \u0275\u0275listener("click", function PdfComponent_Conditional_7_Conditional_1_Template_button_click_20_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.openQFactManage());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(21, "svg", 87);
    \u0275\u0275element(22, "circle", 88)(23, "path", 89);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(24, "span", 81);
    \u0275\u0275text(25, "Manage");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r3.sideBar ? "bg-white border-blue-on text-blue-on z-20 rounded-t-xl" : "bg-[#dee1e6] border-tab/40 text-grey hover:bg-white hover:text-blue-on z-10 rounded-tl-xl");
    \u0275\u0275advance(5);
    \u0275\u0275property("ngClass", ctx_r3.qfactPanelOpen ? "border-transparent text-blue-on z-20" : "border-tab/40 text-grey z-10");
    \u0275\u0275advance(10);
    \u0275\u0275conditional(16, (ctx_r3.selectedIssues == null ? null : ctx_r3.selectedIssues.length) ? 16 : -1);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(19, !ctx_r3.qfactPanelOpen ? 19 : -1);
  }
}
function PdfComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Conditional_7_Conditional_0_Template, 7, 2, "div", 62)(1, PdfComponent_Conditional_7_Conditional_1_Template, 26, 4, "div", 63);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, !ctx_r3.selectionActions.state().qf ? 0 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r3.selectionActions.state().qf && ctx_r3.fullMode ? 1 : -1);
  }
}
function PdfComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "qfact-issue-panel", 93);
    \u0275\u0275listener("selectedIssuesChange", function PdfComponent_Conditional_8_Template_qfact_issue_panel_selectedIssuesChange_0_listener($event) {
      \u0275\u0275restoreView(_r16);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.selectedIssues = $event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275classProp("invisible", ctx_r3.compareMode)("pointer-events-none", ctx_r3.compareMode);
    \u0275\u0275property("nCaseid", ctx_r3.nCaseid)("nUserid", ctx_r3.userDetail.nUserid)("nSesid", ctx_r3.nFSid || "null");
  }
}
function PdfComponent_Defer_9_Conditional_0_Conditional_0_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 96);
  }
}
function PdfComponent_Defer_9_Conditional_0_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275template(0, PdfComponent_Defer_9_Conditional_0_Conditional_0_Conditional_0_Template, 1, 0, "div", 96);
    \u0275\u0275elementStart(1, "side-modal-manager", 97);
    \u0275\u0275twoWayListener("hightlightModeChange", function PdfComponent_Defer_9_Conditional_0_Conditional_0_Template_side_modal_manager_hightlightModeChange_1_listener($event) {
      \u0275\u0275restoreView(_r17);
      const ctx_r3 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r3.highlightMode, $event) || (ctx_r3.highlightMode = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("visibleIssueModelChange", function PdfComponent_Defer_9_Conditional_0_Conditional_0_Template_side_modal_manager_visibleIssueModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r17);
      const ctx_r3 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r3.onVisibleIssueModelChange($event));
    })("OnEvent", function PdfComponent_Defer_9_Conditional_0_Conditional_0_Template_side_modal_manager_OnEvent_1_listener($event) {
      \u0275\u0275restoreView(_r17);
      const ctx_r3 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r3.OnEventOfLinks($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(3);
    \u0275\u0275conditional(0, ctx_r3.modeltype || ctx_r3.visibleIssueModel ? 0 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("annotToolMode", ctx_r3.annotToolMode)("isIndividual", true)("ngClass", \u0275\u0275pureFunction4(18, _c9, !ctx_r3.linkExplorerMode, ctx_r3.linkExplorerMode, ctx_r3.compareMode || !ctx_r3.fullMode, !ctx_r3.fullMode))("nCaseid", ctx_r3.nCaseid)("nUserid", ctx_r3.userDetail.nUserid)("nBundledetailid", ctx_r3.docInfo.nBundledetailid);
    \u0275\u0275twoWayProperty("hightlightMode", ctx_r3.highlightMode);
    \u0275\u0275property("currentPage", ctx_r3.currentPage)("cFFrom", "I")("visibleMarkNavModel", ctx_r3.visibleMarkNavModel)("visibleAnnotDetails", ctx_r3.visibleAnnotDetails)("visibleIssueModel", ctx_r3.visibleIssueModel)("initialQFactMode", ctx_r3.qfactManagePending)("annotGlobMode", ctx_r3.annotGlobMode)("selectedlinktype", ctx_r3.selectedlinktype)("onEvent", ctx_r3.onEvent)("jExtraFilters", ctx_r3.jExtraFilters);
  }
}
function PdfComponent_Defer_9_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "right-panel", 98);
    \u0275\u0275listener("OnEvent", function PdfComponent_Defer_9_Conditional_0_Conditional_1_Template_right_panel_OnEvent_0_listener($event) {
      \u0275\u0275restoreView(_r18);
      const ctx_r3 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r3.OnEventOfLinks($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(3);
    \u0275\u0275property("userList", ctx_r3.userList)("nBundledetailid", ctx_r3.docInfo.nBundledetailid)("ngClass", \u0275\u0275pureFunction5(13, _c10, !ctx_r3.linkExplorerMode, ctx_r3.modeltype == "VP", ctx_r3.linkExplorerMode, ctx_r3.compareMode || !ctx_r3.fullMode, !ctx_r3.fullMode))("tempAnnots", ctx_r3.tempAnnots)("selectedlinktype", ctx_r3.selectedlinktype)("annotGlobMode", ctx_r3.annotGlobMode)("selectedIssues", ctx_r3.selectedIssues)("linkIds", ctx_r3.linkIds)("globannots", ctx_r3.globannots)("modeltype", ctx_r3.modeltype)("docInfo", ctx_r3.docInfo)("nCaseid", ctx_r3.nCaseid)("fullMode", ctx_r3.fullMode);
  }
}
function PdfComponent_Defer_9_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Defer_9_Conditional_0_Conditional_0_Template, 2, 23, "side-modal-manager", 94)(1, PdfComponent_Defer_9_Conditional_0_Conditional_1_Template, 1, 19, "right-panel", 95);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, ctx_r3.modeltype == "D" || ctx_r3.modeltype == "F" || ctx_r3.modeltype == "QF" || ctx_r3.modeltype == "IF" || ctx_r3.visibleMarkNavModel || ctx_r3.visibleIssueModel ? 0 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r3.modeltype && ctx_r3.modeltype == "VP" && !ctx_r3.visibleMarkNavModel && !ctx_r3.visibleIssueModel ? 1 : -1);
  }
}
function PdfComponent_Defer_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Defer_9_Conditional_0_Template, 2, 2);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, ctx_r3.modeltype || ctx_r3.visibleMarkNavModel || ctx_r3.visibleIssueModel ? 0 : -1);
  }
}
function PdfComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "div", 99)(2, "div", 100);
    \u0275\u0275element(3, "img", 101);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "h6", 102);
    \u0275\u0275text(5, "Changes made have not been saved, fact sheet has not been updated.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 103)(7, "btn", 104);
    \u0275\u0275listener("click", function PdfComponent_Conditional_12_Template_btn_click_7_listener() {
      \u0275\u0275restoreView(_r19);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.factsheetalert = false);
    });
    \u0275\u0275text(8, "Back to factsheet");
    \u0275\u0275elementEnd()()()();
  }
}
function PdfComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "div", 105)(2, "div", 100);
    \u0275\u0275element(3, "img", 101);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "h6", 102);
    \u0275\u0275text(5, "In edit mode, you can:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div")(7, "ul", 106)(8, "li", 107);
    \u0275\u0275text(9, "Delete");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "li", 107);
    \u0275\u0275text(11, "Drag to alter");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "li", 108);
    \u0275\u0275text(13, "Create new highlight by selecting multiple parts of the file, click the ");
    \u0275\u0275element(14, "img", 109);
    \u0275\u0275text(15, " button to update your factsheet. ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(16, "div", 103)(17, "btn", 104);
    \u0275\u0275listener("click", function PdfComponent_Conditional_13_Template_btn_click_17_listener() {
      \u0275\u0275restoreView(_r20);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.annotaioninstruction = false);
    });
    \u0275\u0275text(18, "Got it, thanks");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "mat-checkbox");
    \u0275\u0275text(20, "Don't show this again");
    \u0275\u0275elementEnd()()()();
  }
}
function PdfComponent_Conditional_14_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 110)(1, "span", 111);
    \u0275\u0275text(2, "Confirm edit ? ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "btn", 112);
    \u0275\u0275listener("click", function PdfComponent_Conditional_14_Conditional_1_Template_btn_click_3_listener() {
      \u0275\u0275restoreView(_r21);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.confirmDelete());
    });
    \u0275\u0275text(4, "Yes");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "btn", 113);
    \u0275\u0275listener("click", function PdfComponent_Conditional_14_Conditional_1_Template_btn_click_5_listener() {
      \u0275\u0275restoreView(_r21);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.undoDelete());
    });
    \u0275\u0275text(6, "undo");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "icon", 114);
    \u0275\u0275listener("click", function PdfComponent_Conditional_14_Conditional_1_Template_icon_click_7_listener() {
      \u0275\u0275restoreView(_r21);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.undoDelete());
    });
    \u0275\u0275elementEnd()();
  }
}
function PdfComponent_Conditional_14_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 110);
    \u0275\u0275element(1, "div", 115);
    \u0275\u0275elementStart(2, "span", 111);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(4, 1, "PDF.UPDATED_FACTSHEET"), " ");
  }
}
function PdfComponent_Conditional_14_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 110)(1, "span", 116);
    \u0275\u0275element(2, "icon", 117);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 111);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(5, 1, "PDF.FACTSHEET_UPDATED"), " ");
  }
}
function PdfComponent_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275template(1, PdfComponent_Conditional_14_Conditional_1_Template, 8, 0, "div", 110)(2, PdfComponent_Conditional_14_Conditional_2_Template, 5, 3)(3, PdfComponent_Conditional_14_Conditional_3_Template, 6, 3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r3.slabMode == "CD" ? 1 : ctx_r3.slabMode == "U" ? 2 : ctx_r3.slabMode == "UC" ? 3 : -1);
  }
}
function PdfComponent_Conditional_20_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "note", 118);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275property("linkIds", ctx_r3.linkIds);
  }
}
function PdfComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Conditional_20_Defer_0_Template, 1, 1);
    \u0275\u0275defer(1, 0, PdfComponent_Conditional_20_Defer_1_DepsFn);
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const menuTrigger_r22 = \u0275\u0275reference(17);
    \u0275\u0275advance();
    \u0275\u0275deferWhen(menuTrigger_r22.menuOpen);
  }
}
function PdfComponent_Conditional_21_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "link-share", 119);
    \u0275\u0275twoWayListener("isRightClickedChange", function PdfComponent_Conditional_21_Defer_0_Template_link_share_isRightClickedChange_0_listener($event) {
      \u0275\u0275restoreView(_r23);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.isRightClicked, $event) || (ctx_r3.isRightClicked = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(\u0275\u0275pureFunction2(7, _c4, ctx_r3.highlightPresentBox.x + "px", ctx_r3.highlightPresentBox.y + "px"));
    \u0275\u0275classProp("hidden", !ctx_r3.isRightClicked);
    \u0275\u0275property("docInfo", ctx_r3.docInfo)("actionLinkAnnot", ctx_r3.actionLinkAnnot);
    \u0275\u0275twoWayProperty("isRightClicked", ctx_r3.isRightClicked);
  }
}
function PdfComponent_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Conditional_21_Defer_0_Template, 1, 10);
    \u0275\u0275defer(1, 0, PdfComponent_Conditional_21_Defer_1_DepsFn);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275deferWhen((ctx_r3.docInfo == null ? null : ctx_r3.docInfo.nPresentid) != null && (ctx_r3.docInfo == null ? null : ctx_r3.docInfo.isHost));
  }
}
function PdfComponent_Conditional_22_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r24 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "fabbutton", 121);
    \u0275\u0275listener("buttonClick", function PdfComponent_Conditional_22_Conditional_0_Template_fabbutton_buttonClick_0_listener($event) {
      \u0275\u0275restoreView(_r24);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.toogleannot($event));
    });
    \u0275\u0275twoWayListener("fabIconsChange", function PdfComponent_Conditional_22_Conditional_0_Template_fabbutton_fabIconsChange_0_listener($event) {
      \u0275\u0275restoreView(_r24);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.fabIcons, $event) || (ctx_r3.fabIcons = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275twoWayProperty("fabIcons", ctx_r3.fabIcons);
    \u0275\u0275property("isHost", ctx_r3.docInfo == null ? null : ctx_r3.docInfo.isHost);
  }
}
function PdfComponent_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PdfComponent_Conditional_22_Conditional_0_Template, 1, 2, "fabbutton", 120);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, (ctx_r3.docInfo == null ? null : ctx_r3.docInfo.nPresentid) != null ? 0 : -1);
  }
}
function PdfComponent_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r25 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "button", 122);
    \u0275\u0275listener("click", function PdfComponent_Conditional_23_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r25);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.Dialogtype = null);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "app-document-share", 123);
    \u0275\u0275twoWayListener("DialogtypeChange", function PdfComponent_Conditional_23_Template_app_document_share_DialogtypeChange_2_listener($event) {
      \u0275\u0275restoreView(_r25);
      const ctx_r3 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r3.Dialogtype, $event) || (ctx_r3.Dialogtype = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("docInfo", ctx_r3.docInfo)("type", ctx_r3.modeltype)("isLocationShared", true)("nCaseid", ctx_r3.nCaseid);
    \u0275\u0275twoWayProperty("Dialogtype", ctx_r3.Dialogtype);
  }
}
function PdfComponent_Conditional_24_Template(rf, ctx) {
  if (rf & 1) {
    const _r26 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14)(1, "div", 124);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementStart(5, "mat-slide-toggle", 125);
    \u0275\u0275twoWayListener("ngModelChange", function PdfComponent_Conditional_24_Template_mat_slide_toggle_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r26);
      const ctx_r3 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r3.showAll, $event) || (ctx_r3.showAll = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function PdfComponent_Conditional_24_Template_mat_slide_toggle_change_5_listener() {
      \u0275\u0275restoreView(_r26);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.OnShowAllChange());
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(2, 3, "PDF_TOOLBAR.FULL_PAGE_LOCK_TOOLTIP"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 5, "PDF_TOOLBAR.FULL_PAGE_LOCK"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r3.showAll);
  }
}
function PdfComponent_Conditional_25_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 127)(1, "g", 128);
    \u0275\u0275element(2, "path", 129);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "defs")(4, "filter", 130);
    \u0275\u0275element(5, "feFlood", 131)(6, "feColorMatrix", 132)(7, "feOffset", 133)(8, "feGaussianBlur", 134)(9, "feColorMatrix", 135)(10, "feBlend", 136)(11, "feBlend", 137);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "clipPath", 138);
    \u0275\u0275element(13, "rect", 139);
    \u0275\u0275elementEnd()()();
  }
}
function PdfComponent_Conditional_25_Template(rf, ctx) {
  if (rf & 1) {
    const _r27 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 126);
    \u0275\u0275listener("click", function PdfComponent_Conditional_25_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r27);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.showGlobalFact());
    });
    \u0275\u0275template(1, PdfComponent_Conditional_25_Conditional_1_Template, 14, 0, ":svg:svg", 127);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r3.globalAnnots.length ? 1 : -1);
  }
}
var PdfComponent = class _PdfComponent {
  get visibleMarkNavModel() {
    return this._visibleMarkNavModel;
  }
  set visibleMarkNavModel(val) {
    this._visibleMarkNavModel = val;
  }
  constructor(pdfExtendedService, pdfService, dialog, cdr, pdfDataService, renderer, tost, common, factService, presentService, rolepermit, annotS, ss, fds, cache, selectionActions, issueService) {
    this.pdfExtendedService = pdfExtendedService;
    this.pdfService = pdfService;
    this.dialog = dialog;
    this.cdr = cdr;
    this.pdfDataService = pdfDataService;
    this.renderer = renderer;
    this.tost = tost;
    this.common = common;
    this.factService = factService;
    this.presentService = presentService;
    this.rolepermit = rolepermit;
    this.annotS = annotS;
    this.ss = ss;
    this.fds = fds;
    this.cache = cache;
    this.selectionActions = selectionActions;
    this.issueService = issueService;
    this.isFullScreen = false;
    this.fallbackUnassignedIssue = null;
    this.fallbackUnassignedLoadPromise = null;
    this.fullMode = false;
    this.path = null;
    this.docInfo = null;
    this.docInfoChange = new EventEmitter();
    this.compareMode = false;
    this.textLayer = false;
    this.compareIndex = 0;
    this.PageMode = "S";
    this.onEvent = new EventEmitter();
    this.rendom = "?V=" + Math.floor(1e3 + Math.random() * 9999);
    this.annotToolMode = "F";
    this.highlightMode = null;
    this.filepath = environment.documentStorage;
    this.demoPdfSrc = `https://192.168.1.4:9000/etabella/doc/case1161/file_295394823024.PDF`;
    this.pageViewMode = "multiple";
    this.pageRotation = 0;
    this.handTool = false;
    this.currentPage = 1;
    this.zoom = "page-actual";
    this.totalSearch = 0;
    this.currentSearch = 0;
    this.isSearching = false;
    this.factsheetalert = false;
    this.annotaioninstruction = false;
    this.Copytoclipboard = false;
    this.sideBar = false;
    this.qfactPanelOpen = false;
    this.showQFactNotePopup = false;
    this.qfactNotePopupAnchor = { x: 0, y: 0 };
    this.qfactNotePopupIncludeText = false;
    this.qfactNotePopupHighlightText = "";
    this.qfactNotePopupIssues = [];
    this.qfactNotePopupFactId = null;
    this.qfactNotePopupSaveFn = (_0) => __async(this, [_0], function* ({ note }) {
      if (!this.qfactNotePopupFactId)
        return { ok: false };
      const trimmed = (note || "").trim();
      if (!trimmed)
        return { ok: false };
      try {
        const res = yield this.factService.updateFactNote({
          nFSid: this.qfactNotePopupFactId,
          jTexts: [trimmed]
        });
        const failed = res?.msg === -1;
        return { ok: !failed };
      } catch {
        return { ok: false };
      }
    });
    this.globannots = [];
    this.linkExplorerMode = null;
    this.linkExplorerType = "F";
    this.nRFSid = null;
    this.nRDocid = null;
    this.nRWebid = null;
    this.tempAnnots = [];
    this.presentTempAnnots = [];
    this.pageViewports = /* @__PURE__ */ new Map();
    this._panEnabled = false;
    this._canDraw = true;
    this.svg = null;
    this.lines = [];
    this.svgPageNumber = 0;
    this.svgViewPort = null;
    this.isAdjustDoc = false;
    this.spreadMode = "off";
    this.isChecked = false;
    this.highlightIndex = 0;
    this.highlightBox = false;
    this.highlightBoxOptions = { x: 0, y: 0, position: 0, page: 0 };
    this.hyperlinkBoxOptions = { x: 0, y: 0, position: 0, page: 0 };
    this.loading = true;
    this.loadingProgress = 0;
    this.pdfLoaded = false;
    this.pdfFailed = false;
    this.linkIds = [];
    this.lastFsTrigger = "unknown";
    this.hyperlinkBox = false;
    this.hyperlinkOption = {};
    this._rectEnabled = false;
    this.isDrawing = false;
    this.isDragging = false;
    this.isResizing = false;
    this.startX = 0;
    this.startY = 0;
    this.resizeDirection = null;
    this.rect = null;
    this.isMovingReact = false;
    this.isMovingDraw = false;
    this.pagesCount = 0;
    this.modeltype = null;
    this.selectedIssues = [];
    this.scale_factor = null;
    this.on_page_change = 0;
    this.selectedlinktype = {};
    this.annotGlobMode = "S";
    this.globalAnnots = [];
    this.nFSid = null;
    this.nFSuuid = null;
    this.current_clicked_annot = null;
    this.isSlab = false;
    this.slabMode = null;
    this.isEditLoading = false;
    this.pagginationRenge = [];
    this.userList = [];
    this.isConverttopagelevel = false;
    this.onPdfEvent = new Subject();
    this.isHavehighlights = false;
    this.hoverUUid = null;
    this.isAnnotTool = false;
    this.scrollPosition = { x: 0, y: 0 };
    this.scrollSubject = new Subject();
    this.highlightPresentBox = { x: 0, y: 0, position: 0, page: 0 };
    this.isRightClicked = false;
    this.jExtraFilters = {};
    this.fabIcons = ["F", "D", "W", "S", "QF", "P"];
    this.scrollMode = ScrollModeType.vertical;
    this.lastValidMouseSvgX = null;
    this.lastValidMouseSvgY = null;
    this.isDrawingRect = false;
    this.isAddMarkingPermission = false;
    this._visibleMarkNavModel = false;
    this.visibleIssueModel = false;
    this.qfactManagePending = false;
    this.destroyRef = inject(DestroyRef);
    this.Dialogtype = null;
    this.showAll = false;
    this.enablePdfEvents = false;
    this.cSearch = "";
    this.matchCase = false;
    this.wholeWords = false;
    this.showsearch = false;
    this.filterAnnots = [];
    this.isCopytabref = false;
    this.isCopydocname = false;
    this._calloutEnabled = false;
    this.calloutOverlayActive = false;
    this.calloutDrawing = false;
    this.calloutStartX = 0;
    this.calloutStartY = 0;
    this.calloutRect = null;
    this.tPageNo = 1;
    this.tLineNo = 1;
    this.lineScrollOptions = { header: 13.571428571428571, line: 2.857142857142857, topMargin: 25 };
    this.initData();
    if (this.selectionActions.state().qf) {
      this.qfactPanelOpen = true;
      this.sideBar = false;
    }
    effect(() => {
      const qfOn = this.selectionActions.state().qf;
      if (qfOn !== this.qfactPanelOpen) {
        this.qfactPanelOpen = qfOn;
        if (qfOn)
          this.sideBar = false;
        this.cdr.detectChanges();
      }
    });
    this.selectionActions.qfactManageRequest$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.nCaseid || !this.userDetail?.nUserid)
        return;
      this.qfactManagePending = true;
      this.visibleIssueModel = true;
      this.modeltype = null;
      this.cdr.detectChanges();
    });
  }
  handleError(error, message, rethrow = false) {
    const msg = ErrorHandlerUtil.getErrorMessage(error);
    if (!environment.production) {
      if (message) {
        console.error(`${message}: ${msg}`);
      } else {
        console.error("PdfComponent error:", msg);
      }
    }
    if (rethrow) {
      throw new Error(message ? `${message}: ${msg}` : msg);
    }
  }
  ngOnChanges(changes) {
    void (() => __async(this, null, function* () {
      if (changes["zoom"] && !changes["zoom"].firstChange) {
        this.cdr.detectChanges();
      }
      if (changes["path"] && !changes["path"].firstChange) {
        yield this.fetchAnnots();
        this.checkForHighlight();
        this.pdfSrc = this.filepath + this.path;
        this.pdfLoaded = false;
        this.pdfFailed = false;
        this.loadingProgress = 0;
        this.currentPage = this.docInfo?.nPageno || this.currentPage;
        this.cdr.detectChanges();
      }
      if (changes["nPageno"] && !changes["nPageno"].firstChange) {
        this.onPage();
      }
      if (changes["nPageno"] && !changes["nPageno"].firstChange) {
        this.onPage();
      }
      if (changes["jFilter"] && this.pdfLoaded) {
        if (this.jFilter?.cSearch) {
          this.onToolEvents({ event: PdfEvents.SEARCH, data: { cSearch: this.jFilter.cSearch, options: { matchCase: false, wholeWords: this.jFilter.cMatchCase === "E", highlightAll: true } } });
        }
      }
    }))();
  }
  onPage() {
    if (this.nPageno) {
      if (!this.pagginationRenge?.length) {
        this.currentPage = this.nPageno;
        this.cdr.detectChanges();
        return;
      }
      const pg = this.pagginationRenge.find((a) => parseInt(a.output.split("-")[1]) == this.nPageno);
      if (pg)
        this.currentPage = pg?.page || 1;
      this.cdr.detectChanges();
    }
  }
  onRotationChange(e) {
    const id = `rotate:${this.docInfo.nBundledetailid}`;
    if (this.pdfLoaded && this.enablePdfEvents)
      this.cache.set(id, e);
    const n = Number(e);
    if (Number.isFinite(n)) {
      this.pageRotation = (Math.round(n) % 360 + 360) % 360;
    }
  }
  onZoomChanged(e) {
    const id = `zoom:${this.docInfo?.nBundledetailid}`;
    if (this.pdfLoaded && this.enablePdfEvents) {
      try {
        this.cache.set(id, e);
      } catch (err) {
        this.handleError(err, "Failed to set zoom cache");
      }
    }
    if (this.docInfo?.nPresentid && this.docInfo.isHost) {
      this.onScrollEnd();
    }
  }
  checkFileSize(actualSizeInBytes, requiredSizeInMB) {
    if (!actualSizeInBytes)
      return true;
    const bytesInOneMB = 1048576;
    const requiredSizeInBytes = requiredSizeInMB * bytesInOneMB;
    return actualSizeInBytes > requiredSizeInBytes;
  }
  ngOnInit() {
    void (() => __async(this, null, function* () {
      this.userDetail = yield this.ss.getUserInfo();
      if (this.fullMode || this.isLink) {
        this.textLayer = true;
      }
      if (this.docInfo?.nBundledetailid) {
        const key = `pdf_selected_text_${this.docInfo.nBundledetailid}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const selectedText = JSON.parse(stored);
            if (selectedText && Array.isArray(selectedText) && selectedText.length) {
              this.onToolEvents({ event: PdfEvents.SEARCH, data: { cSearch: selectedText[0], options: { highlightAll: true } } });
            }
          } catch (e) {
          }
          localStorage.removeItem(key);
        }
      }
      if (this.docInfo?.nPresentid && this.docInfo?.isHost) {
        this.annotToolMode = "";
      }
      pdfDefaultOptions.disableStream = true;
      pdfDefaultOptions.disableAutoFetch = true;
      pdfDefaultOptions.rangeChunkSize = 1024 * 1024 * 2;
      pdfDefaultOptions.removePageBorders = false;
      pdfDefaultOptions.defaultCacheSize = 10;
      pdfDefaultOptions.externalLinkTarget = LinkTarget.BLANK;
      if (this.onViewerEvent) {
        this.onViewerEvent.subscribe((e) => __async(this, null, function* () {
          if (e?.data?.nPresentid) {
            this.handlePresentEvents(e);
            return;
          }
          if (e.event === PdfEvents.EDIT_HIGHLIGHT) {
            this.startEditingHighlight(e.data);
            this.annotaioninstruction = true;
          } else if (e.event === PdfEvents.DELETE_FACT) {
            this.deleteLinksAnnotations(e.data, "nFSid");
          } else if (e.event === PdfEvents.COMPARE_INDEX) {
            this.compareIndex = e.data;
            this.cdr.detectChanges();
          } else if (e.event === PdfEvents.FACT_CONVERT_HIGHLIGHT_TO_FILE) {
            this.convertHighlightToFile(e.data);
          } else if (e.event === PdfEvents.FACT_CONVERT_HIGHLIGHT_TO_PAGERANGE) {
            this.nFSid = e.data.nFSid;
            this.isConverttopagelevel = true;
            this.reloadPdf();
            this.cdr.detectChanges();
          } else if (e.event === PdfEvents.TOOL_CHANGE_EVENTS) {
            this.pdfExtendedService["PDFViewerApplication"].eventBus.dispatch(e.data);
            this.onEvent.emit({ event: PdfEvents.ZOOM, data: { zoom: this.zoom } });
          } else if (e.event === PdfEvents.FETCH_COMPARE_TOOL_DATA) {
            this.sendDataToParent();
          } else if (e.event === PdfEvents.COMPARE_TOOL_CHANGE_EVENT) {
            this.onToolEvents(e.data);
          } else if (e.event === PdfEvents.REDIRECT_TO_PAGE) {
            this.currentPage = e.data.nPage || this.currentPage;
            this.compareMode = e.data.compareMode;
            this.cdr.detectChanges();
          } else if (e.event === PdfEvents.FACT_UPDATED) {
            const annots = this.globannots.filter((a) => a.id == e.data.nFSid && ["F", "QF"].includes(a.linktype));
            annots.forEach((a) => {
              a.color = e.data.color || a.color;
              a.colorid = e.data.colorid || a.colorid;
            });
            this.reloadNewAnnotPages(annots);
            this.cdr.detectChanges();
          } else if (e.event === "QFACT-COMPARE-POPUP-SAVE-NOTE") {
            const requestId = e.data?.requestId;
            let ok = false;
            try {
              const res = yield this.factService.updateFactNote({
                nFSid: e.data?.factId,
                jTexts: [e.data?.note ?? ""]
              });
              ok = res?.msg !== -1;
            } catch {
              ok = false;
            }
            this.onEvent.emit({
              event: "QFACT-COMPARE-POPUP-SAVE-RESULT",
              data: { requestId, ok }
            });
          } else if (e.event === PdfEvents.PRESENT_JOINER_STATUS) {
            if (e.data) {
              this.presentTempAnnots = [...this.tempAnnots];
              this.tempAnnots = [];
            } else {
              this.presentTempAnnots = [];
              this.tempAnnots = yield this.presentService.getPresentHighlights(this.docInfo.nBundledetailid, this.docInfo.nPresentid);
            }
            this.cdr.detectChanges();
          } else if (e.event === PdfEvents.REFRESH_PRESENT_POSITION) {
            this.refreshPresentData();
          } else if (e.event === PdfEvents.CHECK_CURRENT_PAGE) {
            if (this.currentPage != e.data.nPage) {
              this.currentPage = e.data.nPage;
            }
            try {
              this.docInfo.lineNo = e.data?.lineNo;
              if (this.docInfo.lineNo > 1) {
                this.goToLine(this.currentPage, this.docInfo.lineNo);
              }
            } catch (error) {
              this.handleError(error, void 0, true);
            }
            this.cdr.detectChanges();
          } else if (e.event === PdfEvents.CLEAR_PDF_SEARCH) {
            this.showsearch = false;
            this.matchCase = false;
            this.wholeWords = false;
            this.cSearch = "";
            this.totalSearch = 0;
            this.currentSearch = 0;
            this.onToolEvents({ event: PdfEvents.SEARCH, data: { cSearch: this.cSearch, options: { matchCase: this.matchCase, wholeWords: this.wholeWords, highlightAll: true } } });
          }
        }));
      }
      if (!this.fullMode) {
        this.zoom = "page-width";
      }
      if (this.isLink) {
        this.highlightMode = this.isLink;
        this.annotToolMode = this.isLink == "F" ? "F" : "D";
        this.visibleMarkNavModel = false;
        this.visibleIssueModel = false;
      }
      yield this.fetchAnnots();
      this.checkForHighlight();
      this.pdfSrc = this.filepath + this.path;
      this.pageRotation = this.docInfo.nRotate || 0;
      if (this.docInfo.nPageno) {
        this.currentPage = this.docInfo.nPageno || 1;
      }
      this.loading = false;
      try {
        if (this.nRFSid || this.nRDocid || this.nRWebid) {
          const obj = this.globannots.find((a) => a.id == this.nRFSid && a.linktype == "F" || a.id == this.nRDocid && a.linktype == "D" || a.id == this.nRWebid && a.linktype == "W");
          if (obj) {
            if (obj.page) {
              this.currentPage = obj.page;
            }
            ;
          }
        }
      } catch (error) {
      }
      this.verifyPermission();
      this.cdr.detectChanges();
      this.getGlobalAnnots();
      try {
        this.fds.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((e) => {
          const { type, data } = e;
          if (type === FEED_EVENT_TYPES.ANNOT_DETAILS) {
            this.visibleAnnotDetails = __spreadValues({}, data);
            this.visibleMarkNavModel = true;
            this.visibleIssueModel = false;
          } else if (type === FEED_EVENT_TYPES.SCROLL_TO_PAGE) {
            if (data?.page) {
              this.currentPage = data.page || 1;
              const annot = this.globannots.filter((e2) => e2.id == data.id);
              const el = document.querySelector(`[icon-${annot[0]["uuid"]}]`);
              this.selectIcon(el);
              if (annot?.length) {
                const screenheight = window.innerHeight / 2 - 105;
                this.scrollToPageSpot(data.page || 1, { top: (annot[0]?.rects[0]?.y - screenheight) * this.scale_factor, left: annot[0]?.rects[0]?.x * this.scale_factor });
              } else
                this.onEvent.emit({ event: PdfEvents.CURRENT_PAGE, data: { identity: this.docInfo.nBundledetailid, currentPage: this.currentPage } });
            }
          } else if (type === FEED_EVENT_TYPES.QUICK_FACT_ADDED) {
            this.quickfactAdded({ event: FEED_EVENT_TYPES.QUICK_FACT_ADDED, data });
          } else if (type === FEED_EVENT_TYPES.QUICK_FACT_UPDATED) {
            this.tempAnnots = [];
            try {
              const annots = this.globannots.filter((a) => a.id == e.data.nFSid && ["F", "QF"].includes(a.linktype));
              annots.forEach((a) => {
                a.color = e.data.color || a.color;
                a.colorid = e.data.colorid || a.colorid;
              });
              this.reloadNewAnnotPages(annots);
              this.modeltype = null;
              this.highlightMode = null;
              this.cdr.detectChanges();
            } catch (error) {
              console.error("Error in updating quick fact", error);
            }
            this.cdr.detectChanges();
          } else if (type === FEED_EVENT_TYPES.FACT_ADDED) {
            if (this.annotGlobMode == "M") {
              this.getGlobalAnnots();
            }
            if (data.nQFSid) {
              let index = this.globannots.findIndex((a) => a.id == data.nQFSid);
              this.globannots[index].linktype = "F";
              this.globannots[index].color = data.color;
              this.globannots[index].id = data.nFSid;
              const page = this.globannots[index].page;
              this.reloadNewAnnotPages(null, [page]);
              this.cdr.detectChanges();
            } else {
              this.factAdded({ event: type, data });
            }
            this.modeltype = null;
            this.highlightMode = null;
            this.closeAllTempAnnots();
            this.pdfService.clearSelect();
            this.resetPane();
            this.annotToolMode = "F";
            this.visibleMarkNavModel = false;
            this.visibleAnnotDetails = null;
            this.visibleIssueModel = false;
          } else if (type === FEED_EVENT_TYPES.DOC_ADDED) {
            if (this.annotGlobMode == "M") {
              this.getGlobalAnnots();
            }
            this.docAdded(e);
            this.highlightMode = null;
            this.tempAnnots = [];
            this.visibleMarkNavModel = false;
            this.visibleAnnotDetails = null;
            this.visibleIssueModel = false;
          } else if (type === FEED_EVENT_TYPES.CLOSE) {
            if (data.type === FEED_EVENT_TYPES.ANNOT_DETAILS) {
              this.modeltype = data.modeltype || null;
              this.highlightMode = null;
              this.annotToolMode = "F";
              this.visibleAnnotDetails = null;
              this.visibleIssueModel = false;
              this.visibleMarkNavModel = false;
            } else {
              this.visibleAnnotDetails = null;
              this.modeltype = null;
              this.closeAllTempAnnots();
              this.pdfService.clearSelect();
            }
          } else if (type === FEED_EVENT_TYPES.DELETE_ANNOTATION) {
            const toDelete = this.globannots.filter((a) => a.id == data.id);
            if (toDelete.length) {
              const pages = Array.from(new Set(toDelete.map((a) => a.page)));
              this.globannots = this.globannots.filter((a) => a.id != data.id);
              toDelete.forEach((annot) => {
                try {
                  if (!annot?.uuid)
                    return;
                  const svg = this.getSvgElement(annot.page);
                  if (svg)
                    this.pdfService.removeByUUID(svg, annot.uuid);
                } catch (error) {
                  this.handleError(error, void 0, true);
                }
              });
              this.cleanupPresenterHighlightsFor(toDelete);
              this.reloadNewAnnotPages(null, pages);
            }
          } else if (type === FEED_EVENT_TYPES.OPEN_COMPARE_MODE) {
            this.onEvent.emit({ event: type, data });
          } else if (e.type === FEED_EVENT_TYPES.FILTER_ANNOTATION) {
            this.filterAnnots = e.data?.ids || [];
            const nodes = this.pdfViewerElementRef.nativeElement.querySelectorAll('#viewer [data-loaded="true"][data-page-number]');
            const pageNumbers = Array.from(nodes, (el) => Number(el.getAttribute("data-page-number")));
            this.reloadNewAnnotPages(null, pageNumbers);
          }
        });
      } catch (error) {
        this.handleError(error, void 0, true);
      }
    }))();
  }
  scrollOnSearch() {
    const viewerContainer = this.pdfViewerElementRef.nativeElement.querySelector("#viewerContainer");
    if (viewerContainer) {
      viewerContainer.scrollTo({
        top: viewerContainer.scrollTop - 100
        // behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }
  fetchAnnots() {
    return __async(this, null, function* () {
      try {
        this.globannots = yield this.pdfDataService.getAnnotation(this.docInfo.nBundledetailid);
        this.presentTempAnnots = [];
        if (this.docInfo.nPresentid) {
          this.tempAnnots = yield this.presentService.getPresentHighlights(this.docInfo.nBundledetailid, this.docInfo.nPresentid);
          if (!this.docInfo.isHost) {
            const annots = yield this.presentService.getPresentSharedHighlights(this.docInfo.nBundledetailid, this.docInfo.nPresentid);
            if (annots?.length) {
              this.globannots = [...this.globannots, ...annots];
            }
          }
        }
      } catch (error) {
        this.handleError(error, "Failed to fetch annotations", true);
      }
      return null;
    });
  }
  onToolEvents(e) {
    return __async(this, null, function* () {
      if (e.event === PdfEvents.ROTATION) {
        this.pageRotation = e.data;
        this.zoom = "page-fit";
        try {
          if (this.docInfo?.nPresentid)
            this.onScrollEnd();
        } catch (error) {
          this.handleError(error, void 0, true);
        }
      } else if (e.event === PdfEvents.ADJACENT_DOCS) {
        if (!e.data.newTab) {
          this.loading = true;
          this.docInfo = yield this.pdfDataService.fetchDocInfo(e.data.nBundledetailid);
          this.docInfoChange.emit(this.docInfo);
          this.path = this.docInfo.cPath;
          yield this.fetchAnnots();
          this.currentPage = 1;
          this.checkForHighlight();
          this.pdfSrc = this.filepath + this.path;
          this.pageRotation = this.docInfo.nRotate || 0;
          this.getGlobalAnnots();
          this.loading = false;
        }
        this.onEvent.emit(e);
      } else if (e.event === PdfEvents.HAND)
        this.handTool = e.data;
      else if (e.event === PdfEvents.ZOOM) {
        this.zoom = e.data;
      } else if (e.event === PdfEvents.SHARE) {
        this.onEvent.emit(e);
      } else if (e.event === PdfEvents.CALLOUT_MODE) {
        if (e.data?.enabled === false) {
          this.exitCalloutMode();
        } else {
          this.enterCalloutMode();
        }
      } else if (e.event === PdfEvents.SEARCH) {
        this.cSearch = e.data.cSearch;
        this.totalSearch = 0;
        this.pdfExtendedService.find(e.data.cSearch, e.data.options);
      } else if (e.event === PdfEvents.SEARCH_NEXT) {
        this.pdfExtendedService.findNext();
      } else if (e.event === PdfEvents.SEARCH_PREVIOUS)
        this.pdfExtendedService.findPrevious();
      else if (e.event === PdfEvents.SHOWALL) {
        this.scrollMode = e.data == "multiple" ? ScrollModeType.vertical : ScrollModeType.page;
        this.cdr.detectChanges();
        this.showAll = true;
      } else if (e.event === PdfEvents.CHANGE_DOC)
        this.onEvent.emit(e);
      else if (e.event === PdfEvents.PAGE) {
        this.currentPage = e.data;
        this.onEvent.emit({ event: PdfEvents.CURRENT_PAGE, data: { identity: this.docInfo.nBundledetailid, currentPage: this.currentPage } });
      } else if (e.event === PdfEvents.H_MODE) {
        if (!e.data) {
          this.closeAllTempAnnots();
          this.pdfService.clearSelect();
          this.resetPane();
          this.highlightMode = null;
          this.annotToolMode = "F";
          this.modeltype = null;
        } else {
          this.modeChange(e.data);
        }
      } else if (e.event === PdfEvents.LINK_EVENT) {
        if (e.data.selectedMode == "C") {
          this.selectedlinktype.pages = [this.currentPage];
        } else if (e.data.selectedMode != "C") {
          this.selectedlinktype.pages = [];
          this.selectedlinktype.start = e.data.start || 1;
          this.selectedlinktype.end = e.data.end || this.pagesCount;
        }
        this.highlightMode = e.data.linkMode;
        this.visibleAnnotDetails = null;
        const data = e.data;
        data.pages = this.selectedlinktype.pages;
        data.start = this.selectedlinktype.start;
        data.end = this.selectedlinktype.end;
        delete data?.selectedMode;
        this.manageLinkEvent(e.data);
      } else if (e.event === PdfEvents.CLOSE_REALTIME)
        this.onEvent.emit(e);
      else if (e.event === PdfEvents.OPEN_NAVIGATE) {
        this.modeltype = null;
        this.highlightMode = null;
        this.visibleAnnotDetails = null;
        this.visibleIssueModel = false;
        this.visibleMarkNavModel = !this.visibleMarkNavModel;
        this.jExtraFilters = {};
      } else if (e.event === PdfEvents.ADVANCE) {
        this.modeltype = this.modeltype != "IF" ? "IF" : null;
        this.selectedIssues = e.data ? e.data : [];
      } else if (e.event === PdfEvents.ANNOT_TOOL_CHANGE) {
        this.visibleIssueModel = false;
        this.visibleMarkNavModel = false;
        this.annotToolMode = e.data == "QF" ? "F" : e.data;
        this.highlightMode = e.data;
        this.cdr.detectChanges();
      } else if (e.event === PdfEvents.LOCATION_SHARE)
        this.modeltype = this.modeltype != "LS" ? "LS" : null;
      else if (e.event === PdfEvents.DOC_SHARE) {
        this.Dialogtype = "DS";
      } else if (e.event === PdfEvents.ISSUE_MANAGER) {
        this.highlightMode = null;
        this.modeltype = null;
        this.visibleMarkNavModel = false;
        this.tempAnnots = [];
        this.reloadNewAnnotPages(this.globannots);
        this.visibleIssueModel = !this.visibleIssueModel;
      } else if (e.event === PdfEvents.OPEN_ISSUEMODEL)
        this.modeltype = this.modeltype != "IL" ? "IL" : null;
      else if (e.event === PdfEvents.VIEW_PROPERTIES) {
        this.visibleMarkNavModel = false;
        this.visibleIssueModel = false;
        this.modeltype = this.modeltype != "VP" ? "VP" : null;
      } else if (e.event === PdfEvents.ASSIGN_PROPERTIES) {
        this.visibleIssueModel = false;
        this.visibleMarkNavModel = false;
        this.modeltype = this.modeltype != "AP" ? "AP" : null;
      } else if (e.event === PdfEvents.COMPARE_MODE || e.event === PdfEvents.LINK_EXPLORER)
        this.onEvent.emit(e);
      else if (e.event === PdfEvents.TOOLBAR_PDF_NAV_EVENTS) {
        try {
          if (e.data === TOOLBAR_PDF_NAV_TYPES.ZOOM_IN) {
            this.zoom = Math.round((parseFloat(this.currentZoomFactor.toFixed(1)) + 0.1) * 100).toString();
          }
          if (e.data === TOOLBAR_PDF_NAV_TYPES.ZOOM_OUT) {
            this.zoom = Math.round((parseFloat(this.currentZoomFactor.toFixed(1)) - 0.1) * 100).toString();
          }
        } catch (error) {
          this.handleError(error, void 0, true);
        }
      } else if (e.event === PdfEvents.PDF_PAGE_CHANGE) {
        this.currentPage = e.data.page || 1;
        this.onEvent.emit({ event: PdfEvents.CURRENT_PAGE, data: { identity: this.docInfo.nBundledetailid, currentPage: this.currentPage } });
      } else if (e.event === PdfEvents.EXPORT)
        this.exportWithAnnot();
      else if (e.event === PdfEvents.SEARCH_PAGE_REDIRECT) {
        this.currentPage = e.data?.page || 0;
      } else if (e.event === PdfEvents.OPEN_INDIVIDUAL)
        this.openInIndividual();
      else if (e.event === PdfEvents.COPY_TO_CLIP) {
        console.log("doc info", this.docInfo);
        this.pdfService.clearSelect();
        this.disableHighlightBox();
        this.Copytoclipboard = e.data.copy;
        this.isCopydocname = e.data.showName;
        this.isCopytabref = e.data.showTab;
      } else if (e.event === PdfEvents.THUMBNAIL_MODE) {
        this.sideBar = e.data;
      }
      this.cdr.detectChanges();
    });
  }
  exportWithAnnot() {
    let dialog = this.dialog.open(ExportFormComponent, {
      width: "fit-content",
      height: "90vh",
      hasBackdrop: true,
      // position: { right: '0px', top: '0px' },
      panelClass: ["noshadow", "overflow-hidden"],
      data: {
        jFiles: `{${this.docInfo.nBundledetailid}}`,
        jFolders: "{}",
        nCaseid: this.nCaseid
      }
    });
    dialog.afterClosed().subscribe((result) => {
    });
    this.cdr.detectChanges();
  }
  manageLinkEvent(data) {
    if (this.isLink) {
      const hasValidHighlights = data.highlights?.length > 0;
      const hasValidTexts = data.texts?.some((text) => text?.trim() !== "");
      if (this.annotToolMode === "R" || this.annotToolMode === "DR" && hasValidHighlights) {
        this.onEvent.emit({ event: DOC_VIEWER_EVENTS.LINK_ADDED_DOC, data: __spreadValues(__spreadValues({}, this.docInfo), data) });
      } else if (hasValidTexts) {
        this.onEvent.emit({ event: DOC_VIEWER_EVENTS.LINK_ADDED_DOC, data: __spreadValues(__spreadValues({}, this.docInfo), data) });
      } else if (hasValidHighlights) {
        this.onEvent.emit({ event: DOC_VIEWER_EVENTS.LINK_ADDED_DOC, data: __spreadValues(__spreadValues({}, this.docInfo), data) });
      } else {
        this.onEvent.emit({ event: DOC_VIEWER_EVENTS.LINK_ADDED_DOC, data: null });
      }
    } else {
      this.closeAllTempAnnots();
      this.pdfService.clearSelect();
      this.selectedlinktype = data;
      this.annotGlobMode = "M";
      this.modeltype = data.linkMode;
      this.highlightMode = data.linkMode;
      this.cdr.detectChanges();
    }
  }
  initData() {
  }
  factsheetalert1(cb) {
    const dialogRef = this.dialog.open(DialogueComponent, {
      width: "623px",
      height: "fit-content",
      data: {
        "type": "I",
        "heading": "Changes made have not been saved, fact sheet has not been updated.",
        // 'desc': 'To access dashboard, upload and make edits.',
        // 'html': `<ul  class="list-disc ps-5"><li class="text-xs">Delete</li><li  class="text-xs">Drag to alter</li><li  class="text-xs [&>img]:inline">Create new highlight by selecting multiple parts of the file, click the <img   src="assets/icons/add-circle.svg" width="12"/> button to update your factsheet. </li></ul>`,
        "button1": "Back to factsheet",
        "bt1res": true,
        "bt2res": false
      },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((result) => {
      cb(result);
    });
  }
  convertHighlightToFile(data) {
    this.globannots = this.globannots.filter((a) => a.id != data.nFSid && a.linktype == "F");
    this.getGlobalAnnots();
    this.reloadPdf();
    this.checkForHighlight();
    this.cdr.detectChanges();
  }
  getPagginations() {
    this.selectedlinktype = { type: "H", start: 1, end: this.pagesCount, pages: [] };
    this.pagginationRenge = [];
    if (this.docInfo.cRefpage) {
      this.pagesCount;
      const hasSuffix = /[A-Za-z]/.test(this.docInfo.cRefpage.split("-")[0]);
      if (hasSuffix) {
        const startNo = Number(this.docInfo.cPage.split("-")[0] || 0);
        const end = this.pagesCount + startNo - 1;
        const diff = parseInt(this.docInfo.cPage.split("-")[0]) - parseInt(this.docInfo.cPage.split("-")[0]);
        let nStartpage = this.docInfo.cRefpage.split("-")[0];
        if (nStartpage.startsWith(this.docInfo.cPrefix)) {
          nStartpage = nStartpage.slice(this.docInfo?.cPrefix?.length);
        }
        const startIndex = this.suffixToNumber(nStartpage);
        this.pagginationRenge = Array.from({ length: end - startNo + 1 }, (_, i) => ({ page: i + 1, output: `${this.docInfo.cTab ? `${this.docInfo.cTab}-` : ""}${this.docInfo?.cPrefix ? `${this.docInfo?.cPrefix}` : ""}${this.toExcelSuffix(startIndex + i)}` }));
      } else {
        const startNo = Number(this.docInfo.cRefpage.split("-")[0] || 0);
        const end = this.pagesCount + startNo - 1;
        this.pagginationRenge = Array.from({ length: end - startNo + 1 }, (_, i) => ({ page: i + 1, output: `${this.docInfo.cTab ? `${this.docInfo.cTab}-` : ""}${startNo + i}` }));
      }
    }
    ;
    this.cdr.detectChanges();
  }
  getGlobalAnnots() {
    return __async(this, null, function* () {
      this.globalAnnots = yield this.pdfDataService.getGlobalAnnotats(this.docInfo.nBundledetailid);
      this.checkForHighlight();
      this.cdr.detectChanges();
    });
  }
  enableHighlightBox() {
    this.highlightBox = true;
    this.isChecked = false;
  }
  disableHighlightBox() {
    this.highlightBox = false;
    this.isChecked = false;
    this.highlightIndex = 0;
    this.highlightBoxOptions = { x: 0, y: 0, position: 0, page: 0 };
    this.disableHyperlinkBox();
  }
  enableHyperlinkBox() {
    this.hyperlinkBox = true;
  }
  disableHyperlinkBox() {
    this.hyperlinkBox = false;
    this.hoverUUid = null;
    this.hyperlinkOption = {};
    this.hyperlinkBoxOptions = { x: 0, y: 0, position: 0, page: 0 };
    document.body.style.cursor = "";
  }
  OnPageLoad(e) {
    setTimeout(() => {
      this.enablePdfEvents = true;
      this.cdr.detectChanges();
    }, 350);
    try {
      const findController = this.pdfExtendedService["PDFViewerApplication"].findController;
      if (findController) {
        findController.scrollMatchIntoView = (e2) => {
          if (e2.element) {
            e2.element.scrollIntoView({
              block: "center",
              inline: "center"
            });
          }
        };
      }
    } catch (error) {
      console.error(error);
    }
    this.pdfExtendedService;
    this.pdfViewer;
    this.pagesCount = e.pagesCount;
    this.cdr.detectChanges();
    try {
      if (this.compareMode) {
        const rotate = this.cache.get(`rotate:${this.docInfo.nBundledetailid}`);
        if (rotate != null && rotate != void 0) {
          this.pageRotation = rotate || this.pageRotation;
        }
        const zoom = this.cache.get(`zoom:${this.docInfo.nBundledetailid}`);
        if (zoom != null && zoom != void 0) {
          this.zoom = zoom || zoom;
        }
      }
    } catch (error) {
      this.handleError(error, void 0, true);
    }
    this.getPagginations();
    this.onPage();
    if (this.pdfViewer) {
      this.pdfExtendedService;
    }
    this.pdfLoaded = true;
    this.updateCurrentScaleFactor();
    this.fetchUser();
    this.sendDataToParent();
    if (this.docInfo?.nPresentid) {
      this.checkForCurrentPosition();
      return;
    }
    try {
      if (this.nRFSid || this.nRDocid || this.nRWebid) {
        const obj = this.globannots.find((a) => a.id == this.nRFSid && ["F", "QF"].includes(a.linktype) || a.id == this.nRDocid && a.linktype == "D" || a.id == this.nRWebid && a.linktype == "W");
        if (obj.page > 1) {
          this.currentPage = obj.page;
          return;
        }
      }
    } catch (error) {
      this.handleError(error, void 0, true);
    }
    try {
      if (this.docInfo.lineNo > 1) {
        setTimeout(() => {
          this.goToLine(this.currentPage, this.docInfo.lineNo);
        }, 300);
        return;
      }
    } catch (error) {
      this.handleError(error, void 0, true);
    }
    if (this.compareMode) {
      setTimeout(() => {
        const pagePosition = this.cache.get(`page-position:${this.docInfo.nBundledetailid}`);
        if (pagePosition) {
          this.currentPage = pagePosition.page;
          this.scrollToPageSpot(this.currentPage, { top: pagePosition.y * this.scale_factor, left: pagePosition.x * this.scale_factor });
        } else {
          this.currentPage = this.docInfo.nPageno || 1;
        }
      }, 300);
    }
    this.cdr.detectChanges();
    if (this.jFilter?.cSearch) {
      this.onToolEvents({ event: PdfEvents.SEARCH, data: { cSearch: this.jFilter.cSearch, options: { matchCase: false, wholeWords: this.jFilter.cMatchCase === "E", highlightAll: true } } });
    }
  }
  onPdfLoaded(e) {
    this.cdr.detectChanges();
  }
  fetchUser() {
    return __async(this, null, function* () {
      this.userList = yield this.common.getMyTeamUsers(this.nCaseid);
    });
  }
  /** Activate independent callout overlay (no PDF rect dependency) */
  enterCalloutMode() {
    this._calloutEnabled = true;
    this.calloutOverlayActive = true;
    window.getSelection()?.removeAllRanges();
    this.disableHighlightBox();
    this.cdr.detectChanges();
  }
  /** Deactivate callout overlay */
  exitCalloutMode() {
    this._calloutEnabled = false;
    this.calloutOverlayActive = false;
    this.calloutDrawing = false;
    this.calloutRect = null;
    this.onEvent.emit({ event: PdfEvents.CALLOUT_DISMISS, data: {} });
    this.cdr.detectChanges();
  }
  onCalloutMouseDown(e) {
    if (!this.calloutOverlayActive || this.calloutDrawing)
      return;
    this.calloutDrawing = true;
    window.getSelection()?.removeAllRanges();
    this.calloutStartX = e.clientX;
    this.calloutStartY = e.clientY;
    this.calloutRect = { x: e.clientX, y: e.clientY, w: 0, h: 0 };
    this.cdr.detectChanges();
  }
  onCalloutMouseMove(e) {
    if (!this.calloutDrawing)
      return;
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    const x = Math.min(e.clientX, this.calloutStartX);
    const y = Math.min(e.clientY, this.calloutStartY);
    const w = Math.abs(e.clientX - this.calloutStartX);
    const h = Math.abs(e.clientY - this.calloutStartY);
    this.calloutRect = { x, y, w, h };
    this.cdr.detectChanges();
  }
  onCalloutMouseUp(e) {
    return __async(this, null, function* () {
      if (!this.calloutDrawing)
        return;
      this.calloutDrawing = false;
      const rect = this.calloutRect;
      if (!rect || rect.w < 5 || rect.h < 5) {
        this.calloutRect = null;
        this.cdr.detectChanges();
        return;
      }
      try {
        yield this.captureCalloutFromScreen(rect);
      } catch (error) {
        console.error("[Callout] Screen capture failed:", error);
      }
      this.calloutRect = null;
      this.cdr.detectChanges();
    });
  }
  static {
    this.CALLOUT_SUPERSAMPLE_MIN = 3;
  }
  static {
    this.CALLOUT_SUPERSAMPLE_MAX = 6;
  }
  static {
    this.CALLOUT_POPUP_VW = 0.96;
  }
  /** Capture from all page canvases that intersect the selection rectangle */
  captureCalloutFromScreen(selRect) {
    return __async(this, null, function* () {
      const viewerEl = this.pdfViewerElementRef?.nativeElement;
      if (!viewerEl)
        return;
      const pages = Array.from(viewerEl.querySelectorAll(".page[data-page-number]"));
      const canvasParts = [];
      let totalHeight = 0;
      let maxWidth = 0;
      const popupActualPx = window.innerWidth * _PdfComponent.CALLOUT_POPUP_VW * (window.devicePixelRatio || 1);
      const idealSupersample = popupActualPx / Math.max(1, selRect.w);
      const supersample = Math.max(_PdfComponent.CALLOUT_SUPERSAMPLE_MIN, Math.min(_PdfComponent.CALLOUT_SUPERSAMPLE_MAX, idealSupersample));
      for (const pageEl of pages) {
        const displayedCanvas = pageEl.querySelector(".canvasWrapper canvas") || pageEl.querySelector("canvas");
        if (!displayedCanvas)
          continue;
        const canvasRect = displayedCanvas.getBoundingClientRect();
        const overlapLeft = Math.max(selRect.x, canvasRect.left);
        const overlapTop = Math.max(selRect.y, canvasRect.top);
        const overlapRight = Math.min(selRect.x + selRect.w, canvasRect.right);
        const overlapBottom = Math.min(selRect.y + selRect.h, canvasRect.bottom);
        if (overlapLeft >= overlapRight || overlapTop >= overlapBottom)
          continue;
        let sourceCanvas = displayedCanvas;
        const pageNum = parseInt(pageEl.getAttribute("data-page-number") || "0", 10);
        if (pageNum > 0) {
          try {
            const rotation = this.normalizePdfRotation(this.pageRotation);
            const sideways = rotation === 90 || rotation === 270;
            const pageNativeDisplayWidth = sideways ? canvasRect.height : canvasRect.width;
            const targetWidth = Math.round(pageNativeDisplayWidth * supersample);
            let hr = yield this.pdfExtendedService.getPageAsCanvas(pageNum, { width: targetWidth });
            if (hr && hr.width > 0 && hr.height > 0) {
              if (rotation !== 0) {
                hr = this.rotateCanvas(hr, rotation);
              }
              sourceCanvas = hr;
            } else {
              console.warn("[Callout] getPageAsCanvas returned empty canvas for page", pageNum);
            }
          } catch (err) {
            console.warn("[Callout] getPageAsCanvas failed for page", pageNum, "\u2014 using on-screen canvas", err);
          }
        }
        const scaleX = sourceCanvas.width / canvasRect.width;
        const scaleY = sourceCanvas.height / canvasRect.height;
        const sx = (overlapLeft - canvasRect.left) * scaleX;
        const sy = (overlapTop - canvasRect.top) * scaleY;
        const sw = (overlapRight - overlapLeft) * scaleX;
        const sh = (overlapBottom - overlapTop) * scaleY;
        canvasParts.push({ canvas: sourceCanvas, sx, sy, sw, sh, dy: totalHeight });
        totalHeight += sh;
        maxWidth = Math.max(maxWidth, sw);
      }
      if (canvasParts.length === 0) {
        console.warn("[Callout] No page canvas found in selection area");
        return;
      }
      const offscreen = document.createElement("canvas");
      offscreen.width = Math.round(maxWidth);
      offscreen.height = Math.round(totalHeight);
      const ctx = offscreen.getContext("2d");
      if (!ctx)
        return;
      for (const part of canvasParts) {
        ctx.drawImage(part.canvas, Math.round(part.sx), Math.round(part.sy), Math.round(part.sw), Math.round(part.sh), 0, Math.round(part.dy), Math.round(part.sw), Math.round(part.sh));
      }
      const imageDataUrl = offscreen.toDataURL("image/png");
      if (!imageDataUrl || imageDataUrl === "data:,") {
        console.warn("[Callout] Canvas capture produced empty image \u2014 canvas may be tainted by CORS");
        return;
      }
      this.onEvent.emit({
        event: PdfEvents.CALLOUT_CAPTURE,
        data: {
          imageDataUrl,
          page: this.currentPage,
          selectionRect: { x: selRect.x, y: selRect.y, width: selRect.w, height: selRect.h },
          nBundledetailid: this.docInfo?.nBundledetailid
        }
      });
    });
  }
  /** Normalize the component's `pageRotation` (which may arrive as a string,
   *  negative, or > 360) into one of {0, 90, 180, 270}. PDF.js rotations are
   *  always multiples of 90 — anything else falls back to 0. */
  normalizePdfRotation(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n))
      return 0;
    const mod = (Math.round(n) % 360 + 360) % 360;
    if (mod === 90 || mod === 180 || mod === 270)
      return mod;
    return 0;
  }
  /** Rotate a canvas by 90 / 180 / 270 degrees clockwise. Dimensions swap
   *  for 90 / 270 to match the rotated layout. Used by the callout capture
   *  so the high-res page render (which is at native orientation) ends up
   *  matching the on-screen rotated viewer before we crop the selection. */
  rotateCanvas(src, degrees) {
    const sideways = degrees === 90 || degrees === 270;
    const out = document.createElement("canvas");
    out.width = sideways ? src.height : src.width;
    out.height = sideways ? src.width : src.height;
    const ctx = out.getContext("2d");
    if (!ctx)
      return src;
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate(degrees * Math.PI / 180);
    ctx.drawImage(src, -src.width / 2, -src.height / 2);
    return out;
  }
  modeChange(type) {
    const prevHighlightMode = this.highlightMode;
    const isPhSwitch = (type === "PH" || type === "PH_DR") && prevHighlightMode === "PH";
    this.annotToolMode = type;
    this._calloutEnabled = false;
    this.calloutOverlayActive = false;
    if (this.annotToolMode == "DR")
      this._panEnabled = true;
    else
      this._panEnabled = false;
    if (this.annotToolMode == "R")
      this._rectEnabled = true;
    else
      this._rectEnabled = false;
    if (this.annotToolMode === "CO") {
      this.enterCalloutMode();
      this.annotToolMode = null;
      return;
    }
    if (this.annotToolMode) {
      if (this.annotToolMode === "PH") {
        this.highlightMode = "PH";
        this.annotToolMode = "F";
      } else if (this.annotToolMode === "PH_DR") {
        this.highlightMode = "PH";
        this.annotToolMode = "DR";
        this._panEnabled = true;
      } else if (["F", "DR", "R"].includes(this.annotToolMode))
        this.highlightMode = ["QF", "F"].includes(this.highlightMode) ? this.highlightMode : "F";
      else
        this.highlightMode = "D";
      this.visibleMarkNavModel = false;
      this.visibleIssueModel = false;
    }
    if (!isPhSwitch) {
      this.closeAllTempAnnots();
    }
    this.pdfService.clearSelect();
    this.resetPane();
    this.cdr.detectChanges();
  }
  OncurrentZoomFactor(e) {
    this.currentZoomFactor = e;
    this.updateCurrentScaleFactor();
  }
  updateCurrentScaleFactor() {
    try {
      const sclaeF = Number(getComputedStyle(this.pdfViewerElementRef.nativeElement.querySelector(".page")).getPropertyValue("--scale-factor"));
      if (typeof sclaeF == "number" && !Number.isNaN(sclaeF)) {
        this.scale_factor = sclaeF;
      }
      this.cdr.detectChanges();
    } catch (error) {
      this.handleError(error, void 0, true);
    }
  }
  annotationByPage(pageNumber) {
    if (this.nFSid) {
      return this.tempAnnots.filter((a) => a.annots?.page == pageNumber).map((a) => a.annots);
    }
    const tempArray = [...this.tempAnnots, ...this.presentTempAnnots];
    const data = this.globannots.filter((a) => a.page == pageNumber && (!this.docInfo?.nPresentid || this.docInfo?.nPresentid && (this.fabIcons.includes(a.linktype == "P" ? "S" : a.linktype == "QF" ? "F" : a.linktype) || a.linktype == "H")));
    if (tempArray.length && (!this.docInfo?.nPresentid || this.docInfo?.nPresentid && this.fabIcons.includes("S"))) {
      data.push(...tempArray.filter((a) => a.annots?.page == pageNumber).map((a) => a.annots));
    }
    if (this.filterAnnots.length) {
      return data.filter((a) => this.filterAnnots.includes(a.id));
    }
    return data;
  }
  onPageChange(e) {
    this.on_page_change = e;
    this.sendDataToParent();
    this.cdr.detectChanges();
  }
  getPageViewPort(page) {
    return this.pageViewports.get(page);
  }
  onPageRendered(e) {
    return __async(this, null, function* () {
      const pageNumber = e.pageNumber;
      const viewport = e.source.viewport;
      this.pageViewports.set(pageNumber, viewport);
      const anotData = this.annotationByPage(pageNumber);
      if (this.filterAnnots.length) {
        anotData.filter((a) => this.filterAnnots.includes(a.id));
      }
      if (anotData.length || this.fullMode || this.isLink) {
        const highlightData = anotData.filter((a) => !a.isHyperlink);
        const SVG = yield this.pdfService.buildSVG(viewport, highlightData, this.nFSid, this.pageRotation);
        e.source.div.insertBefore(SVG, e.source.div.firstChild);
        const hyperlinkData = anotData.filter((a) => a.isHyperlink);
        if (hyperlinkData) {
          const SVGs = yield this.pdfService.buildHyperlinkSVG(viewport, hyperlinkData, this.pageRotation);
          if (SVGs.length)
            e.source.div.append(...SVGs);
        }
        if (this.nRFSid || this.nRDocid || this.nRWebid) {
          const obj = anotData.find((a) => a.id == this.nRFSid && ["F", "QF"].includes(a.linktype) || a.id == this.nRDocid && a.linktype == "D" || a.id == this.nRWebid && a.linktype == "W");
          if (obj) {
            const element = SVG.querySelector(`[icon-${obj.uuid}]`);
            if (element) {
              this.pdfService.elementScroll(element);
              this.iconClick(element);
            }
          }
        }
      }
      if (this.nFSid) {
        if (anotData.findIndex((a) => a.uuid == this.nFSuuid) > -1) {
          const page = e.source.div;
          const element = page.querySelector(`[uuid="${this.nFSuuid}"]`);
          if (element) {
            const bBox = element.getBBox();
            this.annotClicked(element, page, { clientX: bBox.x, clientY: bBox.y });
          }
        }
      }
    });
  }
  relaodPageAnnots(pageNumber) {
    return __async(this, null, function* () {
      const viewport = this.getPageViewPort(pageNumber);
      this.pageViewports.set(pageNumber, viewport);
      const anotData = this.annotationByPage(pageNumber);
      const highlightData = anotData.filter((a) => !a.isHyperlink);
      const SVG = yield this.pdfService.buildSVG(viewport, highlightData, this.nFSid, this.pageRotation);
      const PAGE = this.pdfViewerElementRef.nativeElement.querySelector(`#viewer [data-page-number="${pageNumber}"][data-loaded="true"]`);
      if (PAGE) {
        try {
          const svgElement = PAGE.querySelector("svg");
          if (svgElement) {
            this.renderer.removeChild(PAGE, svgElement);
          }
        } catch (error) {
          this.handleError(error, void 0, true);
        }
        PAGE.insertBefore(SVG, PAGE.firstChild);
        const hyperlinkData = anotData.filter((a) => a.isHyperlink);
        if (hyperlinkData) {
          const SVGs = yield this.pdfService.buildHyperlinkSVG(viewport, hyperlinkData, this.pageRotation);
          if (SVGs.length)
            PAGE.append(...SVGs);
        }
      }
      return true;
    });
  }
  resetPane() {
    this.lines = [];
    this._canDraw = false;
    this.svg = null;
    this.pdfService.svgPath = null;
    this.pdfService.penAnnot = null;
    this.svgViewPort = null;
    this.isMovingDraw = false;
    this.svgPageNumber = 0;
    this.cdr.detectChanges();
  }
  getSvgElement(pageNumber) {
    return this.pdfViewerElementRef.nativeElement.querySelector(`#viewer [data-page-number="${pageNumber}"] svg`);
  }
  markHighlight(modeltype, color) {
    return __async(this, null, function* () {
      const type = this.pdfService.getAnnotationType(modeltype);
      try {
        const selection = this.pdfService.getSelectionRects();
        if (!selection.rects.length) {
          return Promise.reject({ msg: "Nothing is selected" });
        }
        const viewport = this.getPageViewPort(selection.page);
        if (!viewport) {
          this.tost.error("Page is still rendering \u2014 please re-select");
          return Promise.reject({ msg: "Viewport unavailable" });
        }
        if (typeof this.scale_factor === "number" && !Number.isNaN(this.scale_factor) && Math.abs((viewport.scale ?? 0) - this.scale_factor) > 0.01) {
          this.tost.error("Page is still rendering \u2014 please re-select");
          return Promise.reject({ msg: "Viewport scale stale" });
        }
        const svg = this.getSvgElement(selection.page);
        if (!svg) {
          return Promise.reject({ msg: "SVG not found" });
        }
        const svgBoundingRect = svg.getBoundingClientRect();
        let rects = Array.from(selection.rects).map((r) => ({ top: r.top, left: r.left, width: r.width, height: r.height }));
        let svgHeight = Math.floor(svgBoundingRect.height);
        rects = rects.filter((x) => Math.floor(x.height) != svgHeight);
        let nrects = rects.filter((x) => x.top != 0 && x.left != 0);
        if (nrects.length > 1) {
          const Y_TOL = 4;
          const sorted = [...nrects].sort((a, b) => a.top - b.top || a.left - b.left);
          const merged = [];
          for (const r of sorted) {
            const last = merged[merged.length - 1];
            if (last && Math.abs(last.top - r.top) <= Y_TOL && Math.abs(last.top + last.height - (r.top + r.height)) <= Y_TOL) {
              const newLeft = Math.min(last.left, r.left);
              const newRight = Math.max(last.left + last.width, r.left + r.width);
              const newTop = Math.min(last.top, r.top);
              const newBottom = Math.max(last.top + last.height, r.top + r.height);
              last.left = newLeft;
              last.width = newRight - newLeft;
              last.top = newTop;
              last.height = newBottom - newTop;
            } else {
              merged.push(__spreadValues({}, r));
            }
          }
          nrects = merged;
        }
        const annotation = yield this.pdfService.saveRect(type, selection.page, nrects, color, viewport, svg, this.pageRotation, svgBoundingRect);
        this.pdfService.clearSelect();
        return Promise.resolve({ annots: annotation, text: selection.text });
      } catch (error) {
        return Promise.reject({ msg: "Annotation failed", error });
      }
    });
  }
  OnMouseDown(e) {
    if (this.calloutOverlayActive)
      return;
    if (e.target.closest("#sidebarContainer"))
      return;
    if (this._panEnabled) {
      if (this.isLink) {
        this.lines = [];
        if (this.pdfService.penAnnot) {
          this.pdfService.penAnnot.lines = [];
        }
      }
      const page = e.target.closest("[data-page-number]");
      if (!page)
        return;
      this._canDraw = true;
      this.pdfService.setPen(4, this.highlightMode === "PH" ? "#FFD700" : "#3F99FF");
      this.svgPageNumber = Number(page.getAttribute("data-page-number"));
      this.svgViewPort = this.getPageViewPort(this.svgPageNumber);
      this.svg = this.getSvgElement(this.svgPageNumber);
    } else {
      this.resetPane();
      this._canDraw = false;
    }
    if (this._rectEnabled) {
      this.manageRectBox(e);
    }
  }
  getText(selection) {
    try {
      return selection?.toString().replace(/\s+/g, "");
    } catch (error) {
      this.handleError(error, void 0, true);
      return "";
    }
  }
  annotClicked(element, page, e) {
    return __async(this, null, function* () {
      if (this.isMovingDraw || this.isMovingReact)
        return;
      if (this.highlightMode === "PH")
        return;
      const uuid = element.getAttribute("uuid");
      const index = this.tempAnnots.findIndex((a) => a.annots?.uuid == uuid && !a.isNotSaved);
      if (index > -1) {
        try {
          if (this.docInfo?.nPresentid && this.docInfo?.isHost) {
            this.cSelectedClr = this.tempAnnots[index]["annots"]["color"];
          }
        } catch (error) {
          this.handleError(error, void 0, true);
        }
        this.enableHighlightBox();
        this.isChecked = true;
        this.highlightIndex = index;
        if (this.nFSid) {
          yield this.recolorAllOtherHighlights();
          element.setAttribute("fill", "#1990d9");
        }
        this.current_clicked_annot = element.getAttribute("uuid");
        this.highlightBoxOptions = {
          x: this.nFSid ? this.getEditXposition(page) : e.clientX,
          y: e.clientY,
          position: this.highlightBoxOptions.y - page.getBoundingClientRect().top,
          page: Number(page.getAttribute("data-page-number"))
        };
      }
    });
  }
  docmouseup(e) {
    return __async(this, null, function* () {
      if (this.calloutOverlayActive)
        return;
      if (e.target.closest("#sidebarContainer"))
        return;
      if (!this.isAddMarkingPermission)
        return;
      if (this.Copytoclipboard) {
        const page = e.target.closest("[data-page-number]");
        if (!page)
          return;
        let pageNo = Number(page.getAttribute("data-page-number"));
        this.CopySelection(pageNo);
        return;
      }
      {
        const sa = this.selectionActions.state();
        if (!this.annotToolMode && !sa.qf && !sa.fact && !sa.doclink)
          return;
      }
      if (!this.isMovingReact && this.annotToolMode == "R" && this._rectEnabled) {
        this.resetRectBox();
        return;
      }
      ;
      if (this._rectEnabled) {
        yield this.resetRectBox();
      }
      if (this.isLink) {
        if (this._panEnabled) {
          this._canDraw = false;
          this.isMovingDraw = false;
        }
        this.OnToolBoxEvent({ event: TOOLBOX_EVENT_TYPES.SUBMIT_ANNOT, mode: this.highlightMode });
        return;
      }
      ;
      if (!this.fullMode && !this.isLink || this.linkExplorerMode)
        return;
      try {
        if (!this.docInfo?.nPresentid || this.highlightMode !== "PH") {
          this.disableHighlightBox();
        }
        const selection = window.getSelection();
        if (!(selection?.rangeCount == 1 && selection?.type == "Range" && this.getText(selection)) && !this._panEnabled && this.annotToolMode != "R" || this._panEnabled && this.lines.length <= 1) {
          this.resetPane();
          return;
        }
        const page = e.target.closest("[data-page-number]");
        if (page) {
          if (this.highlightMode === "PH" && !this._panEnabled) {
            yield this.checkMarkEvent({ mode: "PH" });
          } else if (this.highlightMode === "PH" && this._panEnabled) {
          } else if (!this.docInfo?.nPresentid || !this.docInfo?.isHost || this.selectionActions.state().qf || this.selectionActions.state().fact || this.selectionActions.state().doclink) {
            const _singleMode = this.selectionActions.singleKind();
            if (_singleMode && !this.selectionActions.isCopy() && !this.isLink) {
              if (this._panEnabled && this.pdfService.penAnnot) {
                yield this.annotationAdded(this.pdfService.penAnnot);
                this.resetPane();
              }
              yield this.checkMarkEvent({ mode: _singleMode });
              yield this.OnToolBoxEvent({ event: TOOLBOX_EVENT_TYPES.SUBMIT_ANNOT, mode: _singleMode });
              return;
            }
            if (this._panEnabled && this.pdfService.penAnnot) {
              yield this.annotationAdded(this.pdfService.penAnnot);
              this.resetPane();
            }
            this.enableHighlightBox();
            const TOOLBOX_GAP_PX = 16;
            this.highlightBoxOptions = {
              x: this.nFSid ? this.getEditXposition(page) : e.clientX + TOOLBOX_GAP_PX,
              y: e.clientY > window.innerHeight - 120 ? e.clientY - 120 : e.clientY,
              position: this.highlightBoxOptions.y - page.getBoundingClientRect().top,
              page: Number(page.getAttribute("data-page-number"))
            };
          } else {
            if (this.annotToolMode == "F") {
              yield this.checkMarkEvent({ mode: "F" });
            }
          }
        }
        if (this._panEnabled && this.pdfService.penAnnot) {
          if (this.highlightMode === "PH") {
            yield this.annotationAdded(this.pdfService.penAnnot);
            this.resetPane();
          } else {
            yield this.annotationAdded(this.pdfService.penAnnot);
            this.resetPane();
          }
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
      this.cdr.detectChanges();
    });
  }
  OnMouseUp(e) {
    return __async(this, null, function* () {
      clearTimeout(this.mouseupTimeout);
      this.mouseupTimeout = setTimeout(() => __async(this, null, function* () {
        yield this.docmouseup(e);
      }), 20);
    });
  }
  onMouseMove(e) {
    if (this._rectEnabled) {
      if (this.isDrawing) {
        this.updateRectSize(e.offsetX, e.offsetY, e);
      }
      return;
    }
    if (!this._panEnabled)
      return;
    if (!this._canDraw)
      return;
    this.isMovingDraw = true;
    this.pdfService.savePoint(e.clientX, e.clientY, this.svg, this.svgViewPort, this.svgPageNumber, this.lines, this.pageRotation);
  }
  //// RECTBOX
  manageRectBox(e) {
    if (e.target.closest(".twobubblewrapper")) {
      return;
    }
    const page = e.target.closest("[data-page-number]");
    if (!page)
      return;
    this.svgPageNumber = Number(page.getAttribute("data-page-number"));
    const svg = this.getSvgElement(this.svgPageNumber);
    if (!svg)
      return;
    this.isDrawing = true;
    this.isDrawingRect = true;
    this.startX = e.offsetX / this.scale_factor;
    this.startY = e.offsetY / this.scale_factor;
    this.rect = this.pdfService.defaultRectNode();
    this.rect.setAttribute("x", this.startX.toString());
    this.rect.setAttribute("rx", "15");
    this.pdfService.setAttributes(this.rect, { uuid: this.pdfService.generateRandomId(), fill: "transparent", stroke: "#3F99FF", "stroke-width": "2", x: this.startX, y: this.startY, width: 0, height: 0, style: "scale: calc(var(--scale-factor) * 1)" });
    svg.appendChild(this.rect);
    this.cdr.detectChanges();
  }
  updateRectSize(mouseX, mouseY, e) {
    this.isMovingReact = true;
    this.cdr.detectChanges();
    const viewport = this.getPageViewPort(this.svgPageNumber);
    const mouseSvgX = mouseX / this.scale_factor;
    const mouseSvgY = mouseY / this.scale_factor;
    let useX = mouseSvgX;
    let useY = mouseSvgY;
    if (viewport) {
      const inBoundsX = mouseSvgX >= 0 && mouseSvgX <= viewport.width;
      const inBoundsY = mouseSvgY >= 0 && mouseSvgY <= viewport.height;
      if (inBoundsX) {
        this.lastValidMouseSvgX = mouseSvgX;
      } else if (this.lastValidMouseSvgX !== null) {
        useX = this.lastValidMouseSvgX;
      }
      if (inBoundsY) {
        this.lastValidMouseSvgY = mouseSvgY;
      } else if (this.lastValidMouseSvgY !== null) {
        useY = this.lastValidMouseSvgY;
      }
    }
    let width = Math.abs(useX - this.startX);
    let height = Math.abs(useY - this.startY);
    let x = Math.min(useX, this.startX);
    let y = Math.min(useY, this.startY);
    if (this.rect)
      this.pdfService.setAttributes(this.rect, { x, y, width, height, style: "scale: calc(var(--scale-factor) * 1)" });
  }
  resetRectBox() {
    return __async(this, null, function* () {
      this.isDrawing = false;
      this.isDragging = false;
      this.isResizing = false;
      this.resizeDirection = null;
      this.isDrawingRect = false;
      if (this.rect && this.isMovingReact) {
        try {
          const annotation = {
            id: null,
            uuid: String(this.rect.getAttribute("uuid")),
            isTemp: true,
            page: this.svgPageNumber,
            linktype: "F",
            type: "area",
            color: this.pdfService.getDefaultColor(),
            rects: [
              {
                x: Number(this.rect?.getAttribute("x")),
                y: Number(this.rect?.getAttribute("y")),
                width: Number(this.rect?.getAttribute("width")),
                height: Number(this.rect?.getAttribute("height"))
              }
            ]
          };
          yield this.annotationAdded(annotation);
        } catch (error) {
          this.handleError(error, void 0, true);
        }
      }
      this.isMovingReact = false;
      this.isDrawing = false;
      this.rect = null;
      this.svgPageNumber = 0;
      this.cdr.detectChanges();
    });
  }
  onFindState(e) {
    if (e == 0) {
    }
  }
  //// RECT BOX END
  onFind(e) {
    if (e.type == "")
      this.isSearching = true;
    this.currentSearch = e.current;
    this.totalSearch = e.total;
    this.sendDataToParent();
    try {
      clearTimeout(this.searchInterval);
      this.searchInterval = setTimeout(() => {
        this.isSearching = false;
        this.sendDataToParent();
        this.cdr.detectChanges();
      }, 200);
    } catch (error) {
      this.handleError(error, void 0, true);
    }
  }
  onProgress(e) {
    this.loadingProgress = parseInt(e.percent);
    this.cdr.detectChanges();
  }
  onPdfLoadingStart(e) {
    this.pdfLoaded = false;
    this.pdfFailed = false;
    this.startScrollEvent();
    if (this.pdfViewer) {
      this.pdfViewer.activeSidebarView = PdfSidebarView.THUMBS;
    }
    this.cdr.detectChanges();
  }
  onPdfLoadingFailed(e) {
    console.error("PDF Failed", e);
    this.pdfFailed = true;
    this.cdr.detectChanges();
  }
  changeSideBar() {
    this.sideBar = !this.sideBar;
    this.cdr.detectChanges();
  }
  changeDocument() {
    this.onEvent.emit({ event: "SWAP", data: null });
  }
  checkMarkEvent(e) {
    return __async(this, null, function* () {
      try {
        this.isAnnotTool = false;
        this.cdr.detectChanges();
        this.visibleMarkNavModel = false;
        this.visibleIssueModel = false;
        this.highlightMode = e.mode;
        this.isChecked = true;
        if (this._panEnabled || this._rectEnabled) {
          this.tempAnnots.map((a) => a.isNotSaved = false);
          this.tempAnnots = [...this.tempAnnots];
          if (this.tempAnnots.length > 0) {
            this.tempAnnots = this.tempAnnots.map((annot) => {
              if (annot.annots?.lines) {
                annot.annots.lines = annot.annots.lines.map((line) => line.map((coord) => typeof coord === "string" ? parseFloat(coord) : coord));
              }
              return annot;
            });
          }
          this.highlightIndex = this.tempAnnots.length - 1;
          if (this.nFSid && this.tempAnnots?.length) {
            const annots = this.tempAnnots[this.tempAnnots.length - 1];
            this.addEditedHighlight(annots.annots, annots.text);
          }
          let tmpAnnot2 = Object.assign(this.tempAnnots[0].annots, { isTemp: true }, { fullText: this.tempAnnots[0].text }, { jCordinates: this._rectEnabled ? this.tempAnnots[0].annots.rects : this.tempAnnots[0].annots.lines });
          this.annotS.removeTemp();
          this.annotS.set(tmpAnnot2);
          return;
        }
        if (["D", "W"].includes(this.highlightMode)) {
          this.annotToolMode = "D";
          this.cdr.detectChanges();
        } else {
          this.annotToolMode = "F";
          this.cdr.detectChanges();
        }
        const phColor = this.highlightMode === "PH" ? "#FFD700" : void 0;
        const data = yield this.markHighlight(this.annotToolMode, phColor);
        data.annots.rects = data.annots.rects.filter((x) => x.x != 0 && x.y != 0);
        yield this.annotationAdded(data.annots, data.text);
        if (data.annots) {
          this.highlightIndex = this.tempAnnots.length - 1;
        }
        if (this.nFSid) {
          this.addEditedHighlight(data.annots, data.text);
        }
        this.tempAnnots = this.tempAnnots.map((a) => __spreadProps(__spreadValues({}, a), { isTemp: true }));
        let tmpAnnot = Object.assign(this.tempAnnots[0].annots, { isTemp: true }, { fullText: this.tempAnnots[0].text }, { jCordinates: this.tempAnnots[0].annots.rects });
        this.annotS.removeTemp();
        this.annotS.set(tmpAnnot);
      } catch (error) {
        this.handleError(error, void 0, true);
      }
      this.cdr.detectChanges();
      return;
    });
  }
  OnToolBoxEvent(e) {
    return __async(this, null, function* () {
      if (e.event === TOOLBOX_EVENT_TYPES.CHECK_MARK) {
        yield this.checkMarkEvent(e);
      } else if (e.event === TOOLBOX_EVENT_TYPES.CLOSE_WITHOUT_CLEAR) {
        this.disableHighlightBox();
        this.cdr.detectChanges();
      } else if (e.event === TOOLBOX_EVENT_TYPES.CLOSE) {
        this.closeAllTempAnnots();
        this.pdfService.clearSelect();
      } else if (e.event === TOOLBOX_EVENT_TYPES.DELETE_SELECTED) {
        this.deleteSelected(e.index);
      } else if (e.event === TOOLBOX_EVENT_TYPES.SUBMIT_ANNOT) {
        if (!this.isChecked) {
          if (this.isLink) {
            this.closeAllTempAnnots();
          }
          yield this.checkMarkEvent(e);
        }
        if (e.mode === "PH") {
          return;
        }
        if (this.isLink) {
          this.disableHighlightBox();
          if (this._panEnabled) {
            if (this.pdfService.penAnnot.lines.length) {
              this.manageLinkEvent({ mode: "H", start: 1, end: this.pagesCount, highlights: [this.pdfService.penAnnot], texts: null, pages: this.pdfService.penAnnot?.page });
            } else {
              this.manageLinkEvent({ mode: "H", start: 1, end: this.pagesCount, highlights: [], texts: null, pages: this.pdfService.penAnnot?.page });
            }
          } else {
            this.manageLinkEvent({ mode: "H", start: 1, end: this.pagesCount, highlights: this.tempAnnots.map((a) => a.annots), texts: this.tempAnnots.map((a) => a.text), pages: this.tempAnnots.map((a) => a.annots?.page) });
          }
        } else {
          const saState = this.selectionActions.state();
          const wantsNote = saState.qfIncludeNote || saState.qfIncludeTextPlusNote;
          const isQFRapid = this.highlightMode == "QF" || this.selectionActions.isQFactRapid();
          this.selectionActions.refreshQFactSelectedFromStorage();
          const liveSelectedIssues = this.qfactIssuePanel?.effectiveSelectedIssues() ?? null;
          const liveExplicit = liveSelectedIssues?.filter((i) => i.cIName !== "Unassigned") ?? [];
          const directExplicit = !liveExplicit.length ? (this.qfactIssuePanel?.resolvePickedFromRawGroups() ?? []).filter((i) => i.cIName !== "Unassigned") : [];
          let fallbackUnassigned = this.qfactIssuePanel?.caseUnassignedIssue() ?? null;
          const cachedHasPicks = !!this.selectedIssues?.length;
          if (!fallbackUnassigned && isQFRapid && !cachedHasPicks && !liveExplicit.length && !directExplicit.length) {
            fallbackUnassigned = yield this.getOrLoadFallbackUnassigned();
          }
          const issuesToTag = liveExplicit.length ? liveExplicit : directExplicit.length ? directExplicit : cachedHasPicks ? this.selectedIssues : fallbackUnassigned ? [fallbackUnassigned] : [];
          if (isQFRapid && issuesToTag.length && !wantsNote) {
            const link = { mode: "H", start: 1, end: this.pagesCount, pages: this.tempAnnots.map((a) => a.annots?.page) };
            const jLinktype = JSON.stringify(link);
            const jTexts = [""];
            const { res, colorid } = yield this.factService.submitQuickFact(issuesToTag, this.docInfo, jTexts, this.tempAnnots, false, jLinktype);
            if (res["msg"] == 1) {
              this.quickfactAdded({ event: LINK_EVENT_TYPES.QUICK_FACT_ADDED, data: { nFSid: res["nFSid"], color: res["color"], colorid } });
            } else {
              this.tost.error("Q fact creation failed");
            }
            return;
          }
          if (isQFRapid && issuesToTag.length && wantsNote && this.selectionActions.isQFactRapid()) {
            const popupAnchor = this.computeQFactPopupAnchor();
            const popupIncludeText = !!saState.qfIncludeTextPlusNote;
            const popupHighlightText = this.tempAnnots.map((a) => a?.text || "").filter(Boolean).join(" ");
            const link = { mode: "H", start: 1, end: this.pagesCount, pages: this.tempAnnots.map((a) => a.annots?.page) };
            const jLinktype = JSON.stringify(link);
            const tempAnnotsSnap = [...this.tempAnnots];
            const selectedIssuesSnap = [...issuesToTag];
            this.disableHighlightBox();
            this.showQFactNotePopup = false;
            this.qfactNotePopupFactId = null;
            this.qfactNotePopupIssues = [];
            this.cdr.detectChanges();
            try {
              const { res, colorid } = yield this.factService.submitQuickFact(selectedIssuesSnap, this.docInfo, [""], tempAnnotsSnap, false, jLinktype);
              if (res?.["msg"] == 1) {
                this.quickfactAdded({
                  event: LINK_EVENT_TYPES.QUICK_FACT_ADDED,
                  data: { nFSid: res["nFSid"], color: res["color"], colorid }
                });
                if (this.compareMode) {
                  this.onEvent.emit({
                    event: "QFACT-COMPARE-POPUP-OPEN",
                    data: {
                      factId: res["nFSid"],
                      compareIndex: this.compareIndex,
                      includeText: popupIncludeText,
                      highlightText: popupHighlightText,
                      selectedIssues: selectedIssuesSnap,
                      highlightYInIframe: popupAnchor.y
                    }
                  });
                } else {
                  this.qfactNotePopupFactId = res["nFSid"];
                  this.qfactNotePopupAnchor = popupAnchor;
                  this.qfactNotePopupIncludeText = popupIncludeText;
                  this.qfactNotePopupHighlightText = popupHighlightText;
                  this.qfactNotePopupIssues = selectedIssuesSnap;
                  this.showQFactNotePopup = true;
                  this.cdr.detectChanges();
                }
              } else {
                this.tost.error("Q fact creation failed");
              }
            } catch {
              this.tost.error("Q fact creation failed");
            }
            return;
          }
          this.visibleIssueModel = false;
          this.annotGlobMode = "S";
          this.modeltype = this.highlightMode == "QF" ? "QF" : this.highlightMode == "F" ? "F" : this.highlightMode == "D" ? "D" : "W";
          this.cdr.detectChanges();
        }
      } else if (e.event === TOOLBOX_EVENT_TYPES.ON_DELETE) {
        this.pdfService.clearSelect();
        this.deleteEditedHighlight();
        this.disableHighlightBox();
      } else if (e.event === TOOLBOX_EVENT_TYPES.MOVE_TO_INDEX) {
        this.moveBoxToHighlight(e.index);
      } else if (e.event === TOOLBOX_EVENT_TYPES.PRESENT_COLOR_CHANGED) {
        this.presentAnnotColorChange(e);
      }
      this.isDrawingRect = false;
      this.isDrawing = false;
    });
  }
  /** Lazy-load and cache the case's system Unassigned issue (under the
   *  Unassigned claim). Used by the QFact rapid-create back-stop in the
   *  SUBMIT_ANNOT branch when the LEFT QFact panel isn't mounted (so its
   *  computed `caseUnassignedIssue()` isn't reachable).
   *
   *  Concurrency: a single in-flight promise is shared across simultaneous
   *  callers so back-to-back highlights don't trigger N parallel HTTP
   *  fetches. Once resolved the result is cached on `fallbackUnassignedIssue`
   *  for the lifetime of this component (or until nCaseid changes — see
   *  ngOnChanges). Returns null if the lookup fails or the case truly has
   *  no Unassigned (should not happen on a migrated DB). */
  getOrLoadFallbackUnassigned() {
    return __async(this, null, function* () {
      if (this.fallbackUnassignedIssue && this.fallbackUnassignedIssue !== false) {
        return this.fallbackUnassignedIssue;
      }
      if (this.fallbackUnassignedIssue === false) {
        return null;
      }
      if (!this.nCaseid || !this.userDetail?.nUserid)
        return null;
      if (!this.fallbackUnassignedLoadPromise) {
        const nUserid = this.userDetail.nUserid;
        this.fallbackUnassignedLoadPromise = this.issueService.fetchIssueListV2({
          nCaseid: this.nCaseid,
          nSessionid: "null",
          nIDid: "null",
          nUserid
        }).then((res) => {
          const categories = res?.[0] ?? [];
          const issues = res?.[1] ?? [];
          const unassignedCat = categories.find((c) => c.cCategory === "Unassigned");
          if (!unassignedCat) {
            this.fallbackUnassignedIssue = false;
            return null;
          }
          const unassignedIssue = issues.find((i) => i.nICid === unassignedCat.nICid && i.cIName === "Unassigned") ?? issues.find((i) => i.nICid === unassignedCat.nICid) ?? null;
          this.fallbackUnassignedIssue = unassignedIssue ?? false;
          return unassignedIssue;
        }).catch((err) => {
          console.warn("Failed to load fallback Unassigned issue", err);
          this.fallbackUnassignedIssue = null;
          return null;
        }).finally(() => {
          this.fallbackUnassignedLoadPromise = null;
        });
      }
      return this.fallbackUnassignedLoadPromise;
    });
  }
  annotationAdded(annotation, text) {
    return __async(this, null, function* () {
      if (this.highlightMode !== "PH") {
        yield this.clearNotSavedAnnots();
      }
      this.tempAnnots.push({ annots: annotation, text, isNotSaved: (this._panEnabled || this._rectEnabled) && (!this.docInfo?.nPresentid || !this.docInfo?.isHost) });
      this.tempAnnots = [...this.tempAnnots];
      if (this._panEnabled || this._rectEnabled)
        this.highlightIndex = this.tempAnnots.length - 1;
      try {
        if (this.docInfo?.nPresentid && this.docInfo?.isHost) {
          this.presentService.addHighlight(this.tempAnnots[this.tempAnnots.length - 1]?.annots, this.docInfo?.nBundledetailid, this.docInfo.nPresentid);
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
      this.cdr.detectChanges();
      return Promise.resolve(true);
    });
  }
  closeAllTempAnnots() {
    try {
      this.tempAnnots.forEach((a) => {
        if (a.annots) {
          try {
            const svg = this.getSvgElement(a.annots.page);
            this.pdfService.removeByUUID(svg, a.annots.uuid);
          } catch (error) {
            this.handleError(error, void 0, true);
          }
        }
      });
    } catch (error) {
      this.handleError(error, void 0, true);
    }
    this.tempAnnots = [];
    this.disableHighlightBox();
    this.cdr.detectChanges();
  }
  clearNotSavedAnnots() {
    const notSavedAnnotas = this.tempAnnots.filter((a) => a.isNotSaved)?.map((a) => a.annots) || [];
    if (notSavedAnnotas.length) {
      notSavedAnnotas.forEach((annot) => {
        const svg = this.getSvgElement(annot.page);
        this.pdfService.removeByUUID(svg, annot.uuid);
      });
      this.tempAnnots = this.tempAnnots.filter((a) => !a.isNotSaved);
      this.cdr.detectChanges();
    }
    return Promise.resolve(true);
  }
  deleteSelected(index) {
    if (index >= this.tempAnnots.length)
      return;
    const annot = this.tempAnnots[index].annots;
    if (annot) {
      const svg = this.getSvgElement(annot.page);
      try {
        if (this.docInfo?.nPresentid && this.docInfo?.isHost) {
          this.presentService.deleteHighlight(annot.uuid, annot.page, this.docInfo?.nPresentid);
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
      this.pdfService.removeByUUID(svg, annot.uuid);
      this.tempAnnots.splice(index, 1);
      if (this.docInfo?.nPresentid && this.docInfo?.isHost) {
        this.disableHighlightBox();
        return;
      }
      this.moveBoxToHighlight(index - 1 > -1 ? index - 1 : index + 1);
    }
  }
  moveBoxToHighlight(index) {
    if (!this.tempAnnots.length) {
      this.disableHighlightBox();
      return;
    }
    this.highlightIndex = index;
    const annot = this.tempAnnots[index]?.annots || null;
    if (!annot) {
      this.disableHighlightBox();
      return;
    }
    const PAGE = this.pdfViewerElementRef.nativeElement.querySelector(`#viewer [data-page-number="${annot.page}"][data-loaded="true"]`);
    if (PAGE) {
      const element = PAGE.querySelector(`[uuid="${annot.uuid}"]`);
      if (element) {
        this.pdfService.elementScroll(element);
      }
    } else {
      this.currentPage = annot.page;
      this.disableHighlightBox();
    }
    this.cdr.detectChanges();
  }
  annotGlobalClick(element, page, x, y, isOpen) {
    return __async(this, null, function* () {
      if (this.isMovingDraw || this.isMovingReact)
        return;
      const uuid = element.getAttribute("uuid");
      const index = this.globannots.findIndex((a) => a.uuid == uuid);
      if (index > -1) {
        this.enableHyperlinkBox();
        this.current_clicked_annot = element.getAttribute("uuid");
        this.hyperlinkOption = {
          nBundledetailid: element.getAttribute("bundledetailid"),
          redirectpage: Number(element.getAttribute("redirectpage") || 0),
          redirectpage2: Number(element.getAttribute("redirectpage2") || 0),
          redirectline: Number(element.getAttribute("redirectline") || 0),
          redirectline2: Number(element.getAttribute("redirectline2") || 0),
          nDocid: this.globannots[index].nDocid || null,
          isOpen
        };
        this.hyperlinkBoxOptions = {
          x,
          y,
          position: this.hyperlinkBoxOptions.y - page.getBoundingClientRect().top,
          page: Number(page.getAttribute("data-page-number"))
        };
      } else {
        this.hoverUUid = null;
      }
      this.cdr.detectChanges();
    });
  }
  iconClick(icon) {
    if (!this.fullMode) {
      this.tost.openSnackBar("Open the document in Individual view to see annotation details", "", 3e3);
      return;
    }
    try {
      if (!this.visibleMarkNavModel) {
        this.selectIcon(icon);
      }
      const iconType = icon.getAttribute("icon-type");
      if (iconType) {
        this.linkIds = icon.getAttribute("db-ids").split(",").map((a) => a);
        if (!this.linkIds.length)
          return;
        if (iconType != "QFN") {
          const data = {
            id: this.linkIds[0],
            cType: iconType
          };
          this.highlightMode = null;
          this.modeltype = null;
          this.tempAnnots = [];
          this.visibleAnnotDetails = __spreadValues({}, data);
          this.visibleMarkNavModel = !this.visibleMarkNavModel;
          if (!this.visibleMarkNavModel) {
            this.unselectIcons();
            this.cdr.detectChanges();
          }
          this.visibleIssueModel = false;
        } else {
          let position = icon.getBoundingClientRect();
          this.openMenuAtPosition(position.left, position.top);
        }
      }
    } catch (error) {
      this.linkIds = [];
      this.modeltype = null;
      console.error("Error in icon click", error);
    }
    this.cdr.detectChanges();
  }
  unselectIcons() {
    return __async(this, null, function* () {
      const icons = this.pdfViewerElementRef.nativeElement.querySelectorAll("[data-icon]") || [];
      for (let x of Array.from(icons)) {
        x.classList.remove("active-shadow");
      }
      this.cdr.detectChanges();
      return true;
    });
  }
  selectIcon(icon) {
    return __async(this, null, function* () {
      yield this.unselectIcons();
      icon.classList.add("active-shadow");
    });
  }
  getEditXposition(page) {
    return page.getBoundingClientRect().left + page.clientWidth + 20;
  }
  OnEventOfLinks(e) {
    return __async(this, null, function* () {
      if (e.event === LINK_EVENT_TYPES.FACT_ADDED) {
        if (this.annotGlobMode == "M") {
          this.getGlobalAnnots();
        }
        this.factAdded(e);
      }
      if (e.event === LINK_EVENT_TYPES.QUICK_FACT_ADDED) {
        this.quickfactAdded(e);
      } else if (e.event === LINK_EVENT_TYPES.QUICK_FACT_UPDATED) {
        this.tempAnnots = [];
        try {
          const annots = this.globannots.filter((a) => a.id == e.data.nFSid && ["F", "QF"].includes(a.linktype));
          annots.forEach((a) => {
            a.color = e.data.color || a.color;
            a.colorid = e.data.colorid || a.colorid;
          });
          this.reloadNewAnnotPages(annots);
          this.cdr.detectChanges();
        } catch (error) {
          this.handleError(error, void 0, true);
        }
        this.cdr.detectChanges();
      } else if (e.event === LINK_EVENT_TYPES.DOC_ADDED) {
        if (this.annotGlobMode == "M") {
          this.getGlobalAnnots();
        }
        this.docAdded(e);
      } else if (e.event === LINK_EVENT_TYPES.WEB_ADDED) {
        if (this.annotGlobMode == "M") {
          this.getGlobalAnnots();
        }
        this.webAdded(e);
      } else if (e.event === LINK_EVENT_TYPES.ISSUE_SUBMIT) {
        this.selectedIssues = [...this.selectedIssues];
        this.cdr.detectChanges();
      } else if (e.event === TOOLBOX_EVENT_TYPES.CLOSE) {
        this.tempAnnots = [];
        this.modeltype = null;
        this.unselectIcons();
        this.cdr.detectChanges();
      } else if (e.event === PdfEvents.DELETE_FACT) {
        this.deleteLinksAnnotations(e.data, "nFSid");
      } else if (e.event === LINK_EVENT_TYPES.DELETE_DOC) {
        this.deleteLinksAnnotations(e.data, "nDocid");
      } else if (e.event === LINK_EVENT_TYPES.DELETE_WEB) {
        this.deleteLinksAnnotations(e.data, "nWebid");
      } else if (e.event === LINK_EVENT_TYPES.BIG_FACT) {
        this.onEvent.emit(e);
        this.modeltype = null;
        this.unselectIcons();
        this.cdr.detectChanges();
      } else if (e.event === LINK_EVENT_TYPES.VIEW_DETAIL_LINKS) {
        if (e.data.jLinktype) {
          let jLinktype = e.data.jLinktype;
          if (jLinktype?.pages && jLinktype?.pages?.length) {
            this.currentPage = jLinktype?.pages[0] || 1;
          } else {
            this.currentPage = jLinktype?.start || 1;
          }
        } else
          this.openDetailOfLinks(e.data);
      } else if (e.event === LINK_EVENT_TYPES.FILTER_ISSUE_DETAIL) {
        this.modeltype = "N";
        this.cdr.detectChanges();
      } else if (e.event === LINK_EVENT_TYPES.COMPONENT_LOADED) {
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      } else if (e.event === LINK_EVENT_TYPES.ISSUE_DELETED || e.event === LINK_EVENT_TYPES.ISSUE_UPDATED) {
        this.tempAnnots = [];
        this.refreshPresentData();
      } else if (e.event === PdfEvents.OPEN_DOC_LINK || e.event === PdfEvents.OPEN_FACT_LINK) {
        this.onEvent.emit({ event: PdfEvents.OPEN_ATTACHMENT, data: e.data });
      } else if (e.event === LINK_EVENT_TYPES.EDIT) {
        this.visibleMarkNavModel = false;
      }
    });
  }
  /** Mirror Fact / QFact / DocLink / Web link deletes into the
   *  presentation-side `present_highlight` table. Every annotation a
   *  host paints during a live presentation is also persisted there by
   *  `annotationAdded` (line ~2747) so viewers can render it via the
   *  socket / `/present/highlight/list` fetch. But the host's Mark Nav
   *  delete + source-table delete paths never touched that secondary
   *  store — leaving orphan `linktype: "P"` rows that re-appear as
   *  ghost underlines on every viewer rejoin or refresh (the user
   *  confirmed this by inspecting `/present/highlight/list` after a
   *  Mark Nav delete and finding the rows still there). Run this
   *  cleanup whenever the host removes saved annotations from the
   *  source-of-truth tables so the presentation store stays in sync.
   *
   *  Gated on `nPresentid && isHost` because:
   *   - attendees can't delete highlights from the presentation store
   *   - hosts NOT in a live presentation have no `nPresentid` and
   *     `present_highlight` doesn't apply to them.
   *
   *  Fire-and-forget: the local visual + source-table delete have
   *  already succeeded by the time we call this; failure on the
   *  present-highlight side shouldn't break the user-visible flow. */
  cleanupPresenterHighlightsFor(annots) {
    if (!this.docInfo?.nPresentid || !this.docInfo?.isHost)
      return;
    const nPresentid = this.docInfo.nPresentid;
    annots.forEach((annot) => {
      if (!annot?.uuid || annot?.page == null)
        return;
      try {
        this.presentService.deleteHighlight(annot.uuid, annot.page, nPresentid);
      } catch (error) {
        this.handleError(error, void 0, true);
      }
    });
  }
  deleteLinksAnnotations(data, column) {
    return __async(this, null, function* () {
      const DeleteArray = this.globannots.filter((a) => a[column] == data[column]);
      this.globannots = this.globannots.filter((a) => a[column] != data[column]);
      DeleteArray.forEach((annot) => {
        try {
          if (!annot?.uuid)
            return;
          const svg = this.getSvgElement(annot.page);
          if (svg)
            this.pdfService.removeByUUID(svg, annot.uuid);
        } catch (error) {
          this.handleError(error, void 0, true);
        }
      });
      this.cleanupPresenterHighlightsFor(DeleteArray);
      this.reloadNewAnnotPages(DeleteArray);
      if (this.globalAnnots.length) {
        const colType = column == "nFSid" ? "F" : column == "nDocid" ? "D" : "W";
        const Gfact = this.globalAnnots.find((a) => a.type == colType);
        if (Gfact.id.includes(data[column])) {
          Gfact.id = Gfact.id.filter((a) => a != data[column]);
          if (!Gfact.id.length) {
            this.globalAnnots = this.globalAnnots.filter((a) => a.type != colType);
          }
        }
      }
      this.checkForHighlight();
      this.cdr.detectChanges();
    });
  }
  /** Shared post-create cleanup for QFact / Fact / DocLink / Web link
   *  flows. Previously each handler had drifted: docAdded and webAdded
   *  silently ignored the side panel's color picks (a host could choose a
   *  color in the doc-link form and the rendered underline would inherit
   *  whatever markHighlight defaulted to instead), and `highlightMode`
   *  wasn't reset alongside `modeltype` so leftover 'F' / 'D' / 'QF'
   *  state leaked into the next selection — making mode-switching
   *  unpredictable for hosts in presentation mode who rapidly annotate
   *  the same passage in different modes. Centralising the cleanup
   *  ensures the four sibling handlers stay consistent. */
  finalizeAnnotationCreate(linktype, idField, data) {
    const id = data?.[idField];
    this.tempAnnots.forEach((a) => {
      if (!a?.annots)
        return;
      a.annots[idField] = id;
      a.annots.id = id;
      a.annots.color = data.color ? data.color : a.annots.color;
      a.annots.colorid = data.colorid ? data.colorid : a.annots.colorid;
      a.annots.isTemp = false;
      a.annots.linktype = linktype;
      this.globannots.push(__spreadValues({}, a.annots));
    });
    this.reloadNewAnnotPages();
    this.disableHighlightBox();
    this.modeltype = null;
    this.highlightMode = null;
    this.cdr.detectChanges();
  }
  quickfactAdded(e) {
    return __async(this, null, function* () {
      this.finalizeAnnotationCreate("QF", "nFSid", e.data);
    });
  }
  factAdded(e) {
    return __async(this, null, function* () {
      try {
        if (e.data?.nQFSid) {
          this.globannots = this.globannots.filter((a) => a.id != e.data.nQFSid && ["F", "QF"].includes(a.linktype));
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
      this.finalizeAnnotationCreate("F", "nFSid", e.data);
    });
  }
  docAdded(e) {
    return __async(this, null, function* () {
      this.finalizeAnnotationCreate("D", "nDocid", e.data);
    });
  }
  webAdded(e) {
    return __async(this, null, function* () {
      this.finalizeAnnotationCreate("W", "nWebid", e.data);
    });
  }
  reloadNewAnnotPages(reloadAnnots, reloadPage) {
    return __async(this, null, function* () {
      const pages = reloadPage ? reloadPage : [];
      if (!reloadPage) {
        if (reloadAnnots) {
          pages.push(...reloadAnnots.map((a) => a.page).filter((v, i, a) => a.indexOf(v) === i));
        } else {
          pages.push(...this.tempAnnots.map((a) => a.annots?.page).filter((v, i, a) => a.indexOf(v) === i));
        }
      }
      this.tempAnnots = [];
      this.cdr.detectChanges();
      try {
        if (pages?.length) {
          for (let x of pages) {
            yield this.relaodPageAnnots(x);
          }
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
      this.checkForHighlight();
    });
  }
  openDetail(x) {
    if (!this.fullMode)
      return;
    this.linkIds = x.id;
    this.modeltype = x.type == "F" ? "RF" : x.type == "D" ? "RD" : "RW";
    this.cdr.detectChanges();
  }
  openInIndividual() {
    if (this.fullMode)
      return;
    this.onEvent.emit({ event: PdfEvents.OPEN_INDIVIDUAL, data: { jFilter: this.jFilter, nPageno: this.currentPage } });
  }
  closeRealtimePdf() {
    this.onEvent.emit({ event: PdfEvents.CLOSE_REALTIME, data: null });
  }
  startEditingHighlight(e) {
    const annots = this.globannots.filter((a) => a.nFSid == e.nFSid);
    this.tempAnnots = [];
    annots.forEach((a, index) => {
      this.tempAnnots.push({ annots: a, text: "" });
    });
    this.nFSid = e.nFSid;
    try {
      this.nFSuuid = annots[e.index - 1].uuid;
      this.currentPage = annots[e.index - 1].page;
    } catch (error) {
      this.handleError(error, void 0, true);
    }
    this.reloadPdf();
  }
  reloadPdf() {
    this.pdfSrc = `${this.filepath}${this.path}?id=${Math.random()}`;
    this.cdr.detectChanges();
  }
  recolorAllOtherHighlights() {
    this.tempAnnots.forEach((a) => {
      try {
        if (a.annots?.uuid) {
          const svg = this.getSvgElement(a.annots?.page);
          if (svg) {
            const element = svg.querySelector(`[uuid="${a.annots?.uuid}"]`);
            if (element) {
              element.setAttribute("fill", `#${a.annots?.color}`);
            }
          }
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
    });
    return Promise.resolve(true);
  }
  enableSlab(mode) {
    this.isSlab = true;
    this.slabMode = mode;
    if (this.slabMode == "U") {
      clearTimeout(this.msgTimeOut);
      this.msgTimeOut = setTimeout(() => {
        this.slabMode = "UC";
        this.cdr.detectChanges();
        setTimeout(() => {
          this.disableSlab();
        }, 1e3);
      }, 1500);
    }
    this.cdr.detectChanges();
  }
  disableSlab() {
    this.isSlab = false;
    this.slabMode = null;
    this.cdr.detectChanges();
  }
  closeEdit() {
    this.isConverttopagelevel = false;
    this.nFSid = null;
    this.nFSuuid = null;
    this.currentPage = 1;
    this.tempAnnots = [];
    this.pdfSrc = `${this.filepath}${this.path}`;
    this.getGlobalAnnots();
    this.cdr.detectChanges();
  }
  deleteEditedHighlight() {
    if (this.current_clicked_annot) {
      const element = this.pdfViewerElementRef.nativeElement.querySelector(`[uuid="${this.current_clicked_annot}"]`);
      if (element) {
        element.setAttribute("fill", "transparent");
      }
      this.enableSlab("CD");
    }
  }
  undoDelete() {
    if (this.current_clicked_annot) {
      const element = this.pdfViewerElementRef.nativeElement.querySelector(`[uuid="${this.current_clicked_annot}"]`);
      if (element) {
        const color = this.tempAnnots.find((a) => a.annots?.uuid == this.current_clicked_annot)?.annots?.color;
        element.setAttribute("fill", `#${color}`);
      }
      this.cdr.detectChanges();
    }
    this.disableSlab();
    this.disableHighlightBox();
  }
  confirmDelete() {
    return __async(this, null, function* () {
      try {
        const index = this.tempAnnots.findIndex((a) => a.annots?.uuid == this.current_clicked_annot);
        if (index > -1) {
          this.tempAnnots.splice(index, 1);
        }
        const ind = this.globannots.findIndex((a) => a.uuid == this.current_clicked_annot);
        if (ind > -1) {
          this.globannots.splice(ind, 1);
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
      this.removeElementByUUID(this.current_clicked_annot);
      if (this.isEditLoading) {
        return;
      }
      this.isEditLoading = true;
      const res = yield this.pdfDataService.deleteAnnoatation({ nFSid: this.nFSid, uuid: this.current_clicked_annot });
      this.isEditLoading = false;
      if (res.msg == 1) {
        this.enableSlab("U");
        this.disableHighlightBox();
        this.current_clicked_annot = null;
      } else {
        this.tost.error("Failed to delete");
      }
    });
  }
  removeElementByUUID(uuid) {
    const element = this.pdfViewerElementRef.nativeElement.querySelector(`[uuid="${uuid}"]`);
    if (element) {
      element.remove();
    }
  }
  savePresenterHighlight() {
    return __async(this, null, function* () {
      try {
        if (!this.tempAnnots.length)
          return;
        const savedAnnots = [];
        const savedPages = [];
        if (this.docInfo?.nPresentid) {
          for (const ta of this.tempAnnots) {
            if (ta.annots) {
              this.presentService.addHighlight(ta.annots, this.docInfo.nBundledetailid, this.docInfo.nPresentid);
              savedAnnots.push(ta.annots);
              savedPages.push(ta.annots.page);
            }
          }
        } else {
          const pages = this.tempAnnots.map((a) => a.annots?.page);
          const linkType = { type: "PH", start: 1, end: this.pagesCount || 0, pages: [...new Set(pages)] };
          const texts = this.tempAnnots.map((a) => a.text || "");
          for (const ta of this.tempAnnots) {
            if (!ta.annots)
              continue;
            const mdl = {
              nBundledetailid: this.docInfo.nBundledetailid,
              nCaseid: this.nCaseid,
              cText: JSON.stringify(texts),
              uuid: ta.annots.uuid,
              type: ta.annots.type,
              color: ta.annots.color || "FFD700",
              rects: JSON.stringify(ta.annots.rects || []),
              lines: JSON.stringify(ta.annots.lines || []),
              width: ta.annots.width || 0,
              page: ta.annots.page,
              jLinktype: JSON.stringify(linkType)
            };
            const res = yield this.pdfDataService.addAnnotation(mdl);
            if (res?.msg == 1) {
              ta.annots.id = res.nFSid || "";
              ta.annots.linktype = "PH";
              ta.annots.isTemp = false;
              this.globannots.push(ta.annots);
              savedAnnots.push(ta.annots);
              savedPages.push(ta.annots.page);
            }
          }
        }
        if (savedPages.length) {
          this.reloadNewAnnotPages(savedAnnots, [...new Set(savedPages)]);
        }
      } catch (error) {
        this.handleError(error, void 0, true);
        this.tost.error("Failed to save presenter highlight");
      }
      this.disableHighlightBox();
      this.tempAnnots = [];
      this.cdr.detectChanges();
    });
  }
  addEditedHighlight(annot, text) {
    return __async(this, null, function* () {
      this.disableHighlightBox();
      const pages = this.tempAnnots.map((a) => a.annots?.page);
      const linkType = { type: "H", start: 1, end: this.pagesCount || 0, pages: [...new Set(pages)] };
      const mdl = {
        nFSid: this.nFSid,
        cText: JSON.stringify([text]),
        uuid: annot.uuid,
        type: annot.type,
        rects: JSON.stringify(annot.rects || []),
        lines: JSON.stringify(annot.lines || []),
        width: annot.width || 0,
        page: annot.page,
        jLinktype: JSON.stringify(linkType)
      };
      if (this.isEditLoading) {
        return;
      }
      this.isEditLoading = true;
      const res = yield this.pdfDataService.addAnnotation(mdl);
      this.isEditLoading = false;
      if (res.msg == 1) {
        try {
          const element = this.pdfViewerElementRef.nativeElement.querySelector(`[uuid="${annot.uuid}"]`);
          if (element) {
            const color = this.tempAnnots[0]?.annots?.color;
            element.setAttribute("fill", `#${color}`);
            annot.color = color;
          }
        } catch (error) {
          this.handleError(error, void 0, true);
        }
        annot.id = this.nFSid;
        annot.nFSid = this.nFSid;
        annot.linktype = "F";
        this.globannots.push(annot);
        this.enableSlab("U");
        this.disableHighlightBox();
        this.current_clicked_annot = null;
      } else {
        this.tost.error("Failed to add annotation");
      }
    });
  }
  refreshBigFactSheet() {
    this.onEvent.emit({ event: PdfEvents.REFRESH_BIGFACT, data: null });
  }
  openDetailOfLinks(e) {
    this.linkIds = [e.id];
    if (!this.linkIds.length)
      return;
    this.modeltype = e.type == "F" ? "RF" : e.type == "QF" ? "RQF" : e.type == "D" ? "RD" : "RW";
    let annot = this.globannots.find((a) => a.id == e.id && a.linktype == e.type);
    if (annot) {
      this.currentPage = annot.page;
    }
    this.cdr.detectChanges();
  }
  OnEventLinkExplorer(e) {
    this.onEvent.emit(e);
  }
  OnHyperLinkFile(e) {
    this.disableHyperlinkBox();
    this.onEvent.emit(e);
    this.cdr.detectChanges();
  }
  sendDataToParent() {
    if (this.compareMode) {
      const data = {
        pageRotation: this.pageRotation,
        handTool: this.handTool,
        zoom: this.zoom,
        totalSearch: this.totalSearch,
        currentSearch: this.currentSearch,
        isSearching: this.isSearching,
        pageViewMode: this.pageViewMode,
        docInfo: this.docInfo,
        currentPage: this.currentPage || 1,
        pagesCount: this.pagesCount,
        pdfLoaded: this.pdfLoaded,
        pagginationRenge: this.pagginationRenge,
        cSearch: this.cSearch,
        matchCase: this.matchCase,
        wholeWords: this.wholeWords,
        showsearch: this.showsearch
      };
      this.onEvent.emit({ event: PdfEvents.COMPARE_DATA_UPDATE, data });
    } else {
      this.onEvent.emit({ event: PdfEvents.CURRENT_PAGE, data: { identity: this.docInfo.nBundledetailid, currentPage: this.currentPage } });
    }
  }
  checkForHighlight() {
    this.isHavehighlights = false;
    if (this.globalAnnots?.length || this.globannots?.length) {
      this.isHavehighlights = true;
    }
    this.cdr.detectChanges();
  }
  DocumentClick(e) {
    return __async(this, null, function* () {
      this.disableRightAction();
      const page = e.target.closest("[data-page-number]");
      if (!page)
        return;
      const pageNumber = Number(page.getAttribute("data-page-number"));
      const svg = this.getSvgElement(pageNumber);
      const offset = this.pdfService.getOffset(page);
      const x = e.pageX - offset.left;
      const y = e.pageY - offset.top;
      const element = yield this.pdfService.findTemporaryAnnot(e.clientX, e.clientY, x, y, svg, this.tempAnnots);
      if (element) {
        this.annotClicked(element, page, e);
        return;
      } else {
        const icon = e.target.closest("[data-icon]");
        if (icon) {
          this.iconClick(icon);
          return;
        }
      }
      try {
        if (e.target.nodeName == "foreignObject") {
          if (e.target.getAttribute("is-hyperlink") == "Y") {
            const element2 = e.target.closest("g");
            if (!element2)
              return;
            this.disableHyperlinkBox();
            this.cdr.detectChanges();
            const bRect = e.target.getBoundingClientRect();
            const x2 = bRect.x;
            const y2 = bRect.y + bRect.height;
            this.annotGlobalClick(element2, page, x2, y2, true);
          }
        } else if (/#bd_/.test(e.target.getAttribute("href"))) {
          const bundledetailid = e.target.getAttribute("href").split("_")[1];
          const page2 = e.target.closest("[data-page-number]");
          if (!page2)
            return;
          const element2 = e.target.closest("a");
          if (!element2)
            return;
          const bRect = e.target.getBoundingClientRect();
          const x2 = bRect.x;
          const y2 = bRect.y + bRect.height;
          this.getIndexClick(element2, page2, x2, y2, bundledetailid, true);
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
    });
  }
  OnMouseOver(e) {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = setTimeout(() => {
      this.hoverHighlights(e);
    }, 10);
  }
  setGsOpacityByResult(results) {
    results.forEach((item) => {
      if (!item.gEl)
        return;
      item.gEl.style.setProperty("--gopacity", item.isCurrent ? "0.7" : "0.3");
    });
  }
  resetAllSvgGOpacity(svg) {
    const svgEl = svg;
    if (!svgEl)
      return;
    svgEl.querySelectorAll("g").forEach((gEl) => {
      gEl.style.setProperty("--gopacity", "0.7");
    });
  }
  findSiblingIconsAndMatchingGs(iconEl, svg) {
    const foreignObj = iconEl.closest("foreignObject");
    if (!foreignObj)
      return [];
    const svgEl = svg;
    if (!svgEl)
      return [];
    const iconNodes = foreignObj.querySelectorAll(".icons");
    const results = [];
    iconNodes.forEach((node) => {
      const attr = Array.from(node.attributes).find((a) => a.name.startsWith("icon-"));
      if (!attr)
        return;
      const uuid = attr.name.substring(5);
      const gEl = svgEl.querySelector(`g[uuid="${uuid}"]`);
      const isCurrent = node === iconEl;
      results.push({ iconEl: node, uuid, gEl, isCurrent });
    });
    return results;
  }
  hoverHighlights(e) {
    return __async(this, null, function* () {
      const page = e.target.closest("[data-page-number]");
      if (!page)
        return;
      const pageNumber = Number(page.getAttribute("data-page-number"));
      const svg = this.getSvgElement(pageNumber);
      this.resetAllSvgGOpacity(svg);
      const offset = this.pdfService.getOffset(page);
      const x = e.pageX - offset.left;
      const y = e.pageY - offset.top;
      const element = yield this.pdfService.findTemporaryAnnot(e.clientX, e.clientY, x, y, svg, this.tempAnnots);
      if (element) {
        return;
      } else {
        const icon = e.target.closest("[data-icon]");
        if (icon) {
          const results = this.findSiblingIconsAndMatchingGs(icon, svg);
          this.setGsOpacityByResult(results);
          return;
        }
      }
      if (e.target.nodeName == "foreignObject") {
        if (e.target.getAttribute("is-hyperlink") == "Y") {
          const page2 = e.target.closest("[data-page-number]");
          if (!page2)
            return;
          const element2 = e.target.closest("g");
          if (!element2)
            return;
          const uuid = element2.getAttribute("uuid");
          if (!this.hoverUUid || this.hoverUUid != uuid) {
            this.hoverUUid = uuid;
            const bRect = e.target.getBoundingClientRect();
            const x2 = bRect.x;
            const y2 = bRect.y + bRect.height;
            this.annotGlobalClick(element2, page2, x2, y2, false);
          }
        }
      } else if (/#bd_/.test(e.target.getAttribute("href"))) {
        const bundledetailid = e.target.getAttribute("href").split("_")[1];
        const page2 = e.target.closest("[data-page-number]");
        if (!page2)
          return;
        const element2 = e.target.closest("a");
        if (!element2)
          return;
        const bRect = e.target.getBoundingClientRect();
        const x2 = bRect.x;
        const y2 = bRect.y + bRect.height;
        this.getIndexClick(element2, page2, x2, y2, bundledetailid, false);
      } else {
        this.disableHyperlinkBox();
        this.cdr.detectChanges();
      }
    });
  }
  getIndexClick(element, page, x, y, bundledetailid, isOpen) {
    this.hyperlinkOption = {
      nBundledetailid: bundledetailid,
      redirectpage: 0,
      redirectpage2: 0,
      redirectline: 0,
      redirectline2: 0,
      nDocid: null,
      isOpen
    };
    this.hyperlinkBoxOptions = {
      x,
      y,
      position: this.hyperlinkBoxOptions.y - page.getBoundingClientRect().top,
      page: Number(page.getAttribute("data-page-number"))
    };
    if (!isOpen) {
      this.enableHyperlinkBox();
    } else {
      this.OnHyperLinkFile({ event: PdfEvents.OPEN_HYPERLINK_FILE, data: __spreadValues({}, this.hyperlinkOption) });
    }
  }
  openMenuAtPosition(x, y) {
    const xPosition = x;
    const yPosition = y;
    this.noteopener.nativeElement.style.left = `${xPosition}px`;
    this.noteopener.nativeElement.style.top = `${yPosition}px`;
    this.menuTrigger.openMenu();
  }
  //TODO: PRESENTATION 
  startScrollEvent() {
    this.scrollSubject.pipe(
      debounceTime(150)
      // Wait for 150ms of no scrolling before triggering
    ).subscribe((e) => {
      this.onScrollEnd();
    });
    const viewerContainer = this.pdfViewerElementRef.nativeElement.querySelector("#viewerContainer");
    if (viewerContainer) {
      viewerContainer.addEventListener("scroll", (e) => {
        this.scrollSubject.next(e);
      });
    }
  }
  // Modify your onScroll method
  onScrollEnd() {
    const position = this.findCurrentPageSpot();
    try {
      if (this.pdfLoaded && this.enablePdfEvents)
        this.cache.set(`page-position:${this.docInfo.nBundledetailid}`, { x: position.x, y: position.y, page: this.on_page_change, scale_factor: this.scale_factor });
    } catch (error) {
      this.handleError(error, void 0, true);
    }
    if (!this.docInfo?.nPresentid)
      return;
    this.onEvent.emit({ event: "PRESENT-POSITION-CHANGE", data: __spreadProps(__spreadValues({}, position), { nBundledetailid: this.docInfo?.nBundledetailid, nPresentid: this.docInfo?.nPresentid, pageRotation: this.pageRotation, zoom: this.zoom, currentPage: this.currentPage }) });
  }
  scrollToPageSpot(pageNumber, spot) {
    this.pdfExtendedService?.scrollPageIntoView(pageNumber, spot);
  }
  findCurrentPageSpot() {
    try {
      const viewerContainer = this.pdfViewerElementRef.nativeElement.querySelector("#viewerContainer");
      if (!viewerContainer)
        return { x: 0, y: 0 };
      const currentPageNumber = this.currentPage;
      if (!currentPageNumber)
        return { x: 0, y: 0 };
      const pageElement = this.pdfViewerElementRef.nativeElement.querySelector(`.page[data-page-number="${currentPageNumber}"]`);
      if (!pageElement)
        return { x: 0, y: 0 };
      const pageRect = pageElement.getBoundingClientRect();
      const containerRect = viewerContainer.getBoundingClientRect();
      const pageSpot = {
        x: -((pageRect.left - containerRect.left) / this.scale_factor),
        //53.984375
        y: -((pageRect.top - containerRect.top) / this.scale_factor)
      };
      return pageSpot;
    } catch (error) {
      this.handleError(error, void 0, true);
    }
    return { x: 0, y: 0 };
  }
  // Clean up on destroy
  ngOnDestroy() {
    try {
      this.scrollSubject.complete();
      const viewerContainer = this.pdfViewerElementRef.nativeElement.querySelector("#viewerContainer");
      if (viewerContainer) {
        viewerContainer.removeEventListener("scroll", this.scrollSubject.next);
      }
    } catch (error) {
      this.handleError(error, void 0, true);
    }
  }
  handlePresentEvents(e) {
    return __async(this, null, function* () {
      try {
        if (e.event === PRESENT_EVENT_TYPES.PRESENT_POSITION) {
          this.zoom = e.data.zoom;
          this.pageRotation = e.data.pageRotation;
          this.currentPage = e.data.currentPage;
          this.scrollToPageSpot(this.currentPage, { top: e.data.y * this.scale_factor, left: e.data.x * this.scale_factor });
          this.cdr.detectChanges();
        } else if (e.event === PRESENT_EVENT_TYPES.PRESENT_HIGHLIGHT_ADDED) {
          const annotations = e.data;
          this.tempAnnots.push({ annots: annotations, text: "" });
          this.renderAnnotation(annotations);
          this.cdr.detectChanges();
        } else if (e.event === PRESENT_EVENT_TYPES.PRESENT_HIGHLIGHT_DELETED) {
          this.deleteAnnot(e.data);
        } else if (e.event === PRESENT_EVENT_TYPES.PRESENT_HIGHLIGHT_COLOR_CHANGE) {
          const tempAnnot = this.tempAnnots.find((a) => a.annots.uuid == e.data.uuid);
          if (tempAnnot) {
            const svg = this.getSvgElement(tempAnnot?.annots?.page);
            this.pdfService.changeAnnotColor(svg, e.data.cColor, tempAnnot.annots?.uuid, tempAnnot.annots?.type);
            tempAnnot.annots.color = e.data.cColor;
          }
          this.cdr.detectChanges();
        } else if (e.event === PRESENT_EVENT_TYPES.PRESENT_LINK_SHARED) {
          if (e.event === PRESENT_EVENT_TYPES.PRESENT_LINK_SHARED) {
            if (e.data?.cPermission == "N") {
              if (e.data.annot?.nAId) {
                if (this.globannots.findIndex((a) => a.nAId == e.data.nAId) == -1) {
                  this.globannots.push(e.data.annot);
                }
                yield this.relaodPageAnnots(e.data.annot.page);
              }
            } else {
              const ind = this.globannots.findIndex((a) => a.nAId == e.data.nAId);
              if (ind > -1) {
                const page = this.globannots[ind].page;
                this.globannots.splice(ind, 1);
                yield this.relaodPageAnnots(page);
              }
            }
          }
          this.cdr.detectChanges();
        } else if (e.event === PdfEvents.CALLOUT_MODE) {
          if (e.data?.enabled) {
            this.enterCalloutMode();
          } else {
            this.exitCalloutMode();
          }
          this.cdr.detectChanges();
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
    });
  }
  checkForCurrentPosition() {
    return __async(this, null, function* () {
      try {
        if (this.docInfo?.nPresentid) {
          const res = yield this.presentService.getPresentPosition(this.docInfo.nPresentid, this.docInfo?.nBundledetailid);
          if (!res.nBundledetailid)
            return;
          this.zoom = res.zoom;
          this.pageRotation = res.pageRotation;
          this.currentPage = res.currentPage;
          setTimeout(() => {
            this.scrollToPageSpot(this.currentPage, { top: res.y * this.scale_factor, left: res.x * this.scale_factor });
            this.onScrollEnd();
          }, 300);
          this.cdr.detectChanges();
        }
      } catch (error) {
        this.handleError(error, void 0, true);
      }
    });
  }
  renderAnnotation(annot) {
    return __async(this, null, function* () {
      const pageNumber = annot.page;
      const viewport = this.getPageViewPort(pageNumber);
      const anotData = [annot];
      const page = this.pdfViewerElementRef.nativeElement.querySelector(`#viewerContainer [data-page-number="${pageNumber}"][data-loaded="true"]`);
      if (!page)
        return;
      let SVG = this.getSvgElement(annot.page);
      if (!SVG) {
        SVG = yield this.pdfService.buildSVG(viewport, [], null, this.pageRotation);
        page.append(SVG);
      }
      const gNodes = yield this.pdfService.fetchAnnotaitonStructure(anotData, viewport, this.pageRotation);
      SVG.append(...gNodes);
      this.cdr.detectChanges();
    });
  }
  deleteAnnot(data) {
    return __async(this, null, function* () {
      const ind = this.tempAnnots.findIndex((a) => a.annots?.uuid == data.uuid);
      if (ind > -1) {
        this.tempAnnots.splice(ind, 1);
      }
      try {
        const svg = this.getSvgElement(data.page);
        this.pdfService.removeByUUID(svg, data.uuid);
      } catch (error) {
        this.handleError(error, void 0, true);
      }
    });
  }
  presentAnnotColorChange(e) {
    const tempAnnot = this.tempAnnots[e.index];
    if (tempAnnot?.annots) {
      tempAnnot.annots.color = e.color;
      const svg = this.getSvgElement(tempAnnot?.annots?.page);
      this.pdfService.changeAnnotColor(svg, e.color, tempAnnot.annots?.uuid, tempAnnot.annots?.type);
      this.presentService.changeAnnotsColor(tempAnnot.annots.uuid, e.color, this.docInfo.nPresentid);
    }
  }
  onRightClick(e) {
    return __async(this, null, function* () {
      if (!this.docInfo.nPresentid)
        return;
      this.disableRightAction();
      e.preventDefault();
      const page = e.target.closest("[data-page-number]");
      if (!page)
        return;
      const pageNumber = Number(page.getAttribute("data-page-number"));
      const svg = this.getSvgElement(pageNumber);
      const offset = this.pdfService.getOffset(page);
      const x = e.pageX - offset.left;
      const y = e.pageY - offset.top;
      const element = yield this.pdfService.findAnnotAtPoint(e.clientX, e.clientY, x, y, svg, this.globannots, null, null, true);
      if (element) {
        const uuid = element.getAttribute("uuid");
        if (uuid) {
          const obj = this.globannots.find((a) => a.uuid == uuid);
          if (obj) {
            this.actionLinkAnnot = __spreadValues({}, obj);
            if (this.actionLinkAnnot && this.actionLinkAnnot?.nAId) {
              this.enableRightAction(e.clientX, e.clientY);
              this.cdr.detectChanges();
            }
          }
        }
        return;
      }
      this.cdr.detectChanges();
    });
  }
  enableRightAction(x, y) {
    this.isRightClicked = true;
    this.highlightPresentBox.x = x;
    this.highlightPresentBox.y = y;
    this.cdr.detectChanges();
  }
  disableRightAction() {
    try {
      this.isRightClicked = false;
      this.highlightPresentBox.x = 0;
      this.highlightPresentBox.y = 0;
    } catch (error) {
      this.handleError(error, void 0, true);
    }
    this.cdr.detectChanges();
  }
  toogleannot(e) {
    return __async(this, null, function* () {
      if (e.event === PRESENT_EVENT_TYPES.TOGGLE_ANNOT) {
        yield this.reloadCurrentlyActivePage();
      }
    });
  }
  refreshPresentData() {
    return __async(this, null, function* () {
      yield this.fetchAnnots();
      this.cdr.detectChanges();
      yield this.reloadCurrentlyActivePage();
      this.checkForCurrentPosition();
      this.cdr.detectChanges();
    });
  }
  reloadCurrentlyActivePage() {
    return __async(this, null, function* () {
      const pages = this.pdfExtendedService.currentlyRenderedPages();
      for (let x of pages) {
        yield this.relaodPageAnnots(x);
      }
    });
  }
  getViewport() {
    const viewer = this.pdfViewer;
  }
  goToLine(pageNo, lineNo) {
    try {
      this.nameDestination = `line-${pageNo}-${lineNo}`;
    } catch (error) {
      this.handleError(error, void 0, true);
    }
  }
  verifyPermission() {
    return __async(this, null, function* () {
      this.isAddMarkingPermission = this.rolepermit.verifyPermission("AM");
    });
  }
  CopySelection(pageno) {
    try {
      let cFilename = this.docInfo.cFilename;
      let cTab = (this.docInfo.cTab ? this.docInfo.cTab + "-" : "") + pageno;
      let extratext = (this.isCopydocname ? `${cFilename}` : "") + (this.isCopytabref ? `\r
 {${cTab}}` : "");
      const selection = window.getSelection();
      if (selection?.toString()) {
        const selectedText = selection.toString();
        const textToCopy = `${selectedText} \r
 \r
 ${extratext}`;
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(textToCopy);
        }
        this.tost.success("Content copied to clipboard");
        if (window.getSelection) {
          window.getSelection().removeAllRanges();
        }
      }
    } catch (error) {
      this.handleError(error, void 0, true);
    }
  }
  /** Convert 1-based index → Excel-style A…Z, AA… */
  toExcelSuffix(n) {
    let s = "";
    while (n > 0) {
      n--;
      s = String.fromCharCode(65 + n % 26) + s;
      n = Math.floor(n / 26);
    }
    return s;
  }
  /** Convert Excel-style string → 1-based index (A=1, Z=26, AA=27…) */
  suffixToNumber(s) {
    let num = 0;
    for (const ch of s.toUpperCase()) {
      num = num * 26 + (ch.charCodeAt(0) - 64);
    }
    return num;
  }
  onFullScreenChange(event) {
    if (event == true) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
    this.cdr.detectChanges();
  }
  OnShowAllChange() {
    this.zoom = "page-actual";
    this.showAll = false;
    this.scrollMode = ScrollModeType.vertical;
    this.cdr.detectChanges();
  }
  showGlobalFact() {
    this.jExtraFilters = { "cType": "M" };
    this.visibleMarkNavModel = true;
    this.modeltype = null;
    this.visibleIssueModel = false;
    this.cdr.detectChanges();
  }
  spredmodeChnage(mode) {
    this.spreadMode = mode;
    if (mode == "off") {
      this.zoom = "page-actual";
    } else {
      this.zoom = "page-width";
    }
    this.pageViewports.clear();
    this.scale_factor = null;
    requestAnimationFrame(() => {
      this.updateCurrentScaleFactor();
    });
    this.cdr.detectChanges();
  }
  enterFullscreen() {
    return __async(this, null, function* () {
      const root = document.documentElement;
      try {
        const req = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
        if (req)
          yield req.call(root);
      } catch (err) {
        this.onFsError(new Event("fullscreenerror"));
        this.handleError(err, void 0, true);
      }
    });
  }
  exitFullscreen() {
    return __async(this, null, function* () {
      const d = document;
      try {
        const ex = document.exitFullscreen || d.webkitExitFullscreen || d.msExitFullscreen;
        if (ex)
          yield ex.call(document);
      } catch (err) {
        this.onFsError(new Event("fullscreenerror"));
        this.handleError(err, void 0, true);
      }
    });
  }
  onCalloutKeydown(e) {
    if (e.key === "Escape" && this.calloutOverlayActive) {
      e.preventDefault();
      e.stopPropagation();
      this.exitCalloutMode();
    }
  }
  onFsChangeStd() {
    this.handleFsChange();
  }
  onFsChangeWebkit() {
    this.handleFsChange();
  }
  onFsChangeMs() {
    this.handleFsChange();
  }
  handleFsChange() {
    this.isFullScreen = !this.isFullScreen;
    this.lastFsTrigger = "unknown";
  }
  // --- Log errors
  onFsError(e) {
    console.log("[fullscreen]", {
      action: "error",
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      message: e?.message || "fullscreen error"
    });
  }
  toggleSideBar() {
    if (this.compareMode) {
      return;
    }
    this.sideBar = true;
  }
  closeSideBar() {
    this.sideBar = false;
    if (this.selectionActions.state().qf) {
      this.qfactPanelOpen = true;
    }
  }
  /** Tab click for the thumbnails (Single & Double) panel.
   *  Toggle: closes the panel if it's already active; otherwise opens it
   *  and closes any open QFact panel (mutex). */
  toggleThumbnailsTab() {
    if (this.compareMode)
      return;
    if (this.sideBar) {
      this.closeSideBar();
    } else {
      this.sideBar = true;
      this.qfactPanelOpen = false;
    }
  }
  /** Tab click for the QFact issue panel. Mutex with `sideBar`. Activating
   *  the tab also arms QFact in SelectionActionsService so the next text
   *  selection auto-fires a tagged QFact. */
  toggleQFactTab() {
    if (this.qfactPanelOpen) {
      this.qfactPanelOpen = false;
    } else {
      this.qfactPanelOpen = true;
      this.sideBar = false;
      this.selectionActions.setQFact();
    }
  }
  openQFactManage() {
    if (!this.nCaseid || !this.userDetail?.nUserid)
      return;
    this.selectionActions.requestOpenQFactManage();
  }
  /** Mirrors what `[(visibleIssueModel)]` did before — write the value back —
   *  but also clears `qfactManagePending` so the next open of issue-manage
   *  (from a different entry point) doesn't auto-enable QFact mode. */
  onVisibleIssueModelChange(v) {
    this.visibleIssueModel = v;
    if (!v)
      this.qfactManagePending = false;
  }
  /** Compute the QFact popup anchor: parked in the gray margin to the
   *  right of the page, vertically centred on the highlight. Per the UX
   *  brief, the popup should sit next to the selection in the margin —
   *  not on top of the page text. So:
   *    x = page element's right edge (entry into the gray area), + gap
   *    y = vertical centre of the rendered SVG highlight group
   *
   *  Querying the SVG group by uuid gives a multi-line bounding rect —
   *  perfect for finding the highlight's vertical midpoint regardless
   *  of how many lines were selected. Falls back to the highlightBox
   *  click position when neither the page nor the highlight is locatable
   *  (better to land somewhere sensible than fail the whole popup). */
  computeQFactPopupAnchor() {
    const compareForceSide = this.compareMode && this.compareIndex === 2 ? "left" : this.compareMode && this.compareIndex === 1 ? "right" : null;
    const root = this.pdfViewerElementRef?.nativeElement;
    const rootRect = root?.getBoundingClientRect();
    const fallback = compareForceSide === "left" ? {
      x: (rootRect?.left ?? 0) + 12,
      y: this.highlightBoxOptions.y || (rootRect?.top ?? 0) + (rootRect?.height ?? window.innerHeight) / 2,
      side: "left"
    } : {
      x: (rootRect?.right ?? window.innerWidth) - 12,
      y: this.highlightBoxOptions.y || (rootRect?.top ?? 0) + (rootRect?.height ?? window.innerHeight) / 2,
      side: "right"
    };
    try {
      const last = this.tempAnnots[this.tempAnnots.length - 1];
      const uuid = last?.annots?.uuid;
      const pageNum = last?.annots?.page;
      if (!uuid || !pageNum)
        return fallback;
      let pageEl = root?.querySelector(`#viewer [data-page-number="${pageNum}"]`);
      if (!pageEl) {
        const candidates = root ? Array.from(root.querySelectorAll(`[data-page-number="${pageNum}"]`)) : [];
        pageEl = candidates.reduce((best, el) => {
          const w = el.getBoundingClientRect().width;
          if (!best)
            return el;
          return w > best.getBoundingClientRect().width ? el : best;
        }, null);
      }
      if (!pageEl)
        return fallback;
      const pageRect = pageEl.getBoundingClientRect();
      if (pageRect.width < 200)
        return fallback;
      const groupEl = pageEl.querySelector(`[uuid="${uuid}"]`);
      const groupRect = groupEl?.getBoundingClientRect();
      const yMid = groupRect && groupRect.height ? groupRect.top + groupRect.height / 2 : pageRect.top + pageRect.height / 2;
      if (compareForceSide === "left") {
        return { x: pageRect.left - 12, y: yMid, side: "left" };
      }
      if (compareForceSide === "right") {
        return { x: pageRect.right + 12, y: yMid, side: "right" };
      }
      const inSpread = this.spreadMode === "odd" || this.spreadMode === "even";
      const viewerEl = root?.querySelector("#viewer");
      const viewerRect = viewerEl?.getBoundingClientRect();
      if (inSpread && viewerRect) {
        const viewerCenter = (viewerRect.left + viewerRect.right) / 2;
        const pageCenter = (pageRect.left + pageRect.right) / 2;
        if (pageCenter > viewerCenter) {
          return { x: pageRect.left - 12, y: yMid, side: "left" };
        }
      }
      return { x: pageRect.right + 12, y: yMid, side: "right" };
    } catch {
      return fallback;
    }
  }
  /** Popup dismissed (×, Escape, click-outside). The QFact has already
   *  been saved by the auto-create path before the popup mounted, so
   *  this is purely a UI teardown — we drop the popup state and clear
   *  the captured nFSid. We do NOT touch tempAnnots / closeAllTempAnnots
   *  here: those are the painted-and-saved highlight + bubble from the
   *  real QFact, which must remain on the page. */
  onQFactNotePopupClosed() {
    this.showQFactNotePopup = false;
    this.qfactNotePopupFactId = null;
    this.qfactNotePopupIssues = [];
    this.cdr.detectChanges();
  }
  static {
    this.\u0275fac = function PdfComponent_Factory(t) {
      return new (t || _PdfComponent)(\u0275\u0275directiveInject(NgxExtendedPdfViewerService), \u0275\u0275directiveInject(PdfService), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(PdfDataService), \u0275\u0275directiveInject(Renderer2), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(FactService), \u0275\u0275directiveInject(PresentService), \u0275\u0275directiveInject(RolepermitService), \u0275\u0275directiveInject(AnnotsService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(FeedDisplayService), \u0275\u0275directiveInject(CacheService), \u0275\u0275directiveInject(SelectionActionsService), \u0275\u0275directiveInject(IssueService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PdfComponent, selectors: [["pdf"]], viewQuery: function PdfComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(NgxExtendedPdfViewerComponent, 5);
        \u0275\u0275viewQuery(_c03, 5);
        \u0275\u0275viewQuery(_c1, 5);
        \u0275\u0275viewQuery(QFactIssuePanelComponent, 5);
        \u0275\u0275viewQuery(_c2, 7);
        \u0275\u0275viewQuery(_c2, 5, ElementRef);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.pdfViewer = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.menuTrigger = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.noteopener = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.qfactIssuePanel = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.pdfViewerComponent = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.pdfViewerElementRef = _t.first);
      }
    }, hostBindings: function PdfComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("mousedown", function PdfComponent_mousedown_HostBindingHandler($event) {
          return ctx.onCalloutMouseDown($event);
        }, false, \u0275\u0275resolveDocument)("mousemove", function PdfComponent_mousemove_HostBindingHandler($event) {
          return ctx.onCalloutMouseMove($event);
        }, false, \u0275\u0275resolveDocument)("mouseup", function PdfComponent_mouseup_HostBindingHandler($event) {
          return ctx.onCalloutMouseUp($event);
        }, false, \u0275\u0275resolveDocument)("keydown", function PdfComponent_keydown_HostBindingHandler($event) {
          return ctx.onCalloutKeydown($event);
        }, false, \u0275\u0275resolveDocument)("fullscreenchange", function PdfComponent_fullscreenchange_HostBindingHandler() {
          return ctx.onFsChangeStd();
        }, false, \u0275\u0275resolveDocument)("webkitfullscreenchange", function PdfComponent_webkitfullscreenchange_HostBindingHandler() {
          return ctx.onFsChangeWebkit();
        }, false, \u0275\u0275resolveDocument)("msfullscreenchange", function PdfComponent_msfullscreenchange_HostBindingHandler() {
          return ctx.onFsChangeMs();
        }, false, \u0275\u0275resolveDocument)("fullscreenerror", function PdfComponent_fullscreenerror_HostBindingHandler($event) {
          return ctx.onFsError($event);
        }, false, \u0275\u0275resolveDocument)("webkitfullscreenerror", function PdfComponent_webkitfullscreenerror_HostBindingHandler($event) {
          return ctx.onFsError($event);
        }, false, \u0275\u0275resolveDocument)("msfullscreenerror", function PdfComponent_msfullscreenerror_HostBindingHandler($event) {
          return ctx.onFsError($event);
        }, false, \u0275\u0275resolveDocument);
      }
    }, inputs: { jFilter: "jFilter", fullMode: "fullMode", nCaseid: "nCaseid", nSectionid: "nSectionid", activesectiontype: "activesectiontype", path: "path", docInfo: "docInfo", isLink: "isLink", onViewerEvent: "onViewerEvent", compareMode: "compareMode", nPageno: "nPageno", textLayer: "textLayer", compareIndex: "compareIndex", PageMode: "PageMode", linkExplorerMode: "linkExplorerMode", linkExplorerType: "linkExplorerType", nRFSid: "nRFSid", nRDocid: "nRDocid", nRWebid: "nRWebid" }, outputs: { docInfoChange: "docInfoChange", onEvent: "onEvent" }, standalone: true, features: [\u0275\u0275ProvidersFeature([AnnotsService, FeedDisplayService, annotTrasnferService]), \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 26, vars: 28, consts: [["noteopener", "", "menuTrigger", "matMenuTrigger"], ["notemenu", "matMenu"], ["pdfViewer", ""], ["fancySidebar", ""], [1, "h-full", "w-full", "bg-[#e8e8eb]", "flex", "flex-col", 3, "ngClass"], [3, "selectedIssues", "highlightText", "includeText", "anchor", "saveNoteFn"], [3, "hidden"], [1, "absolute", "!z-[99]", "min-w-[300px]", 3, "onHyperlinkEvent", "hyperlinkOption"], [1, "absolute", "left-0", "top-[100px]", "bottom-0", "z-40", 3, "invisible", "pointer-events-none", "nCaseid", "nUserid", "nSesid"], [1, "fixed", "bottom-0", "flex", "items-center", "justify-center", "w-full", "h-full", "bg-black/90"], [1, "fixed", "bottom-0", "flex", "items-center", "justify-center", "w-full", "h-24", "bg-black/90"], ["aria-label", "Open notes menu", 1, "fixed", "opacity-0", "pointer-events-none", "bg-red-500", "w-8.5", "h-8.5", 3, "menuClosed", "matMenuTriggerFor"], ["xPosition", "after", "yPosition", "below", 1, "w-[421px]", "mt-8", "!bg-transparent", "!shadow-none", "!overflow-visible", 3, "hasBackdrop"], [1, "fixed", "flex", "items-center", "justify-center", "right-2.5", "bg-black/50", "w-full", "bottom-0", "h-[calc(100%-50px)]", "z-[9999]"], [1, "bg-white", "p-2.5", "rounded-base", "shadow-[-4px_0px_11px_#0000000f]", "absolute", "top-15", "right-3", "z-[98]"], ["type", "button", "aria-label", "Show global facts", 1, "absolute", "right-5", "overflow-visible", "top-12", "bg-transparent", "rounded-s-md", "flex", "flex-col", "justify-center", "cursor-pointer", "z-10"], [1, "relative", "h-full", "transition-[margin]", "duration-300", "ease-in-out", 3, "ngClass"], [1, ""], [1, "min-h-full", "w-[842px]", "bg-white", "grid", "place-items-center", "transition-all", "origin-center", "mx-auto", "max-w-[100%]", "absolute", "top-0", "left-1/2", "-translate-x-1/2", "z-20"], [1, "cust-pdfviewer", 3, "zoomChange", "pageChange", "pageRendered", "sidebarVisibleChange", "pdfLoaded", "mousedown", "mouseup", "contextmenu", "mousemove", "rotationChange", "updateFindMatchesCount", "updateFindState", "progress", "currentZoomFactor", "pdfLoadingStarts", "pdfLoadingFailed", "click", "dblclick", "pagesLoaded", "mouseover", "ngClass", "nameddest", "src", "showToolbar", "zoom", "rotation", "pageViewMode", "handTool", "showBorders", "page", "sidebarVisible", "scrollMode", "customSidebar", "spread"], [1, "callout-overlay"], [1, "pdftoolbar", 3, "onEvent", "isAnnotToolChange", "toolEvents", "isAdjustDocChange", "isFullScreenChange", "cSearchChange", "ngClass", "pageRotation", "nCaseid", "handTool", "isCalloutActive", "zoom", "totalSearch", "currentSearch", "isSearching", "pageViewMode", "isAnnotTool", "docInfo", "isLink", "currentPage", "pagesCount", "highlightMode", "annotToolMode", "fullMode", "compareMode", "pdfLoaded", "isnavigate", "isProperties", "isIssue", "linkExplorerMode", "pagginationRenge", "isConverttopagelevel", "onPdfEvent", "isHavehighlights", "selectedIssues", "activesectiontype", "jFilter", "isAdjustDoc", "isFullScreen", "showAll", "cSearch", "matchCase", "wholeWords", "showsearch", "thumbnailMode"], [1, "px-2.5", "py-1", "h-14", "flex", "items-center", "gap-2.5", "bg-white"], ["width", "155px", "height", "34px"], ["width", "56px", "height", "34px"], ["width", "201px", "height", "34px"], ["width", "100px", "height", "34px"], ["width", "34px", "height", "34px"], [3, "onEvent", "docInfo", "linkExplorerMode", "linkExplorerType"], [1, "py-1.5", "absolute", "px-4", "font-semibold", "right-0", "rounded-bl-base", "z-10", "bg-blue-on", "text-white", "w-fit", "text-xs", "flex", "items-center", "gap-2", 3, "click"], ["name", "close", "type", "comnicn", 1, "text-xxs"], ["width", "120", "height", "120", "viewBox", "0 0 100 100"], ["alignment-baseline", "baseline", "x", "70", "y", "70", "text-anchor", "middle"], ["x", "50", "y", "57", "dy", "-0.18em", "font-size", "20", "font-weight", "normal", "fill", "#444444"], ["font-size", "10", "font-weight", "normal", "fill", "#444444"], ["x", "50", "y", "57", "dy", "0.82em", "font-size", "10", "font-weight", "normal", "fill", "#A9A9A9"], ["cx", "50", "cy", "50", "r", "45", "stroke", "#e6e6e6", "stroke-width", "5", "fill", "none"], ["cx", "50", "cy", "50", "r", "45", "stroke", "#ff3d00", "stroke-width", "5", "fill", "none", "stroke-dasharray", "282.743", 1, "progress-circle", 2, "transform", "rotate(270deg)", "transform-origin", "center", "stroke-linecap", "round"], [1, "min-h-full", "w-[842px]", "bg-white", "grid", "place-items-center", "transition-all", "origin-center", "mx-auto", "max-w-[90%]", "absolute", "top-0", "left-1/2", "-translate-x-1/2", "z-20"], [1, "callout-selection", 3, "left", "top", "width", "height"], [1, "callout-hint"], [1, "callout-close", 3, "click"], [1, "callout-selection"], ["id", "sidebarContainer"], ["id", "additionalSidebarContainer"], [1, "h-[38px]", "bg-grey", "px-2", "flex", "items-center", "gap-2"], [1, "cursor-pointer", "h-[22px]", "bg-white", "text-xs", "rounded-base", "flex", "items-center", "px-1.5", 3, "click", "ngClass"], ["type", "button", "aria-label", "Close sidebar", 1, "cursor-pointer", "py-1", 3, "click"], ["width", "11", "height", "2", "viewBox", "0 0 11 2", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M0.916669 1.99999C0.656947 1.99999 0.439392 1.90399 0.264003 1.71199C0.0886143 1.51999 0.000614272 1.28266 3.16091e-06 0.999993C-0.00060795 0.717328 0.0873921 0.479997 0.264003 0.287998C0.440614 0.0959994 0.658169 0 0.916669 0H10.0833C10.3431 0 10.5609 0.0959994 10.7369 0.287998C10.9129 0.479997 11.0006 0.717328 11 0.999993C10.9994 1.28266 10.9114 1.52032 10.736 1.71299C10.5606 1.90565 10.3431 2.00132 10.0833 1.99999H0.916669Z", "fill", "white"], ["id", "sidebarResizer", 1, "hidden"], [1, "flex", "text-white", "ms-3"], ["name", "close", "type", "comnicn", 1, "block", "text-lg"], [1, "flex", "items-center", "justify-end", "bg-dark-blue", "h-[59px]", "px-10", "text-white"], [1, "grid", "w-full", "h-full", "transition-all", "bg-white", "place-items-center", "ms-auto"], [1, "flex", "items-center", "justify-center", "flex-col", "ms-auto", "w-full", "min-w-[420px]"], ["width", "25px", "src", "../../../../assets/icons/failed.svg", "alt", "Failed to load PDF", 1, "mb-2.5"], [1, "text-sred", "text-base", "font-semibold", "opacity-50", "mb-0.5"], [1, "text-xs", "opacity-50", "text-sred"], ["name", "close", "type", "comnicn", 1, "block", "text-sm", 3, "click"], [1, "absolute", "!z-[999]", 3, "OnEvent", "highlightMode", "annotToolMode", "tempAnnots", "isChecked", "isLink", "highlightIndex", "docInfo", "nFSid", "cSelectedClr", "visibleMarkNavModel"], [3, "closed", "selectedIssues", "highlightText", "includeText", "anchor", "saveNoteFn"], [1, "absolute", "left-4", "top-16", "z-50", "flex", "items-center", "gap-2"], [1, "absolute", "left-0", "top-16", "z-50", "w-[277px]", "flex", "items-end"], ["type", "button", "aria-label", "Open thumbnails panel", 1, "h-9", "rounded-full", "shadow-md", "flex", "items-center", "gap-2", "text-xs", "transition", 3, "click", "ngClass"], [1, "w-7", "h-7", "rounded-full", "bg-blue-deactivate", "flex", "items-center", "justify-center"], ["width", "14", "height", "14", "viewBox", "0 0 16 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["x", "1.5", "y", "2.5", "width", "13", "height", "11", "rx", "1.5", "stroke", "currentColor", "stroke-width", "1.3"], ["x1", "6.5", "y1", "3", "x2", "6.5", "y2", "13", "stroke", "currentColor", "stroke-width", "1.3"], ["class", "font-medium", 4, "ngIf"], [1, "font-medium"], ["type", "button", "aria-label", "Open thumbnails panel", "matTooltip", "Single & Double Page View", 1, "relative", "h-10", "w-20", "pr-4", "flex", "items-center", "justify-center", "transition", "border", "border-b-0", "shrink-0", 3, "click", "ngClass"], [1, "w-7", "h-7", "rounded-full", "bg-blue-deactivate", "flex", "items-center", "justify-center", "shrink-0"], [1, "relative", "-ml-4", "h-10", "flex-1", "flex", "items-stretch", "text-xs", "transition", "rounded-t-xl", "border", "border-b-0", "bg-white", 3, "ngClass"], ["viewBox", "0 0 17 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "absolute", "bottom-0", "left-[-17px]", "w-[17px]", "h-[16px]", "pointer-events-none"], ["d", "M 16 0 C 16 8, 8 16, 0 16 L 17 16 L 17 0 Z", "fill", "white"], ["type", "button", "aria-label", "Open QFact issue selection", 1, "relative", "flex-1", "flex", "items-center", "gap-2", "px-3", "transition", "hover:text-blue-on", 3, "click"], [1, "w-6", "h-6", "rounded-full", "bg-blue-deactivate", "flex", "items-center", "justify-center", "shrink-0"], ["width", "12", "height", "12", "viewBox", "0 0 20 20", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M4 2.5L11.2 11L8 11.4L9.9 16.8L8.2 17.4L6.3 12L4 14V2.5Z", "fill", "currentColor"], ["cx", "15.4", "cy", "6.3", "r", "2.1", "fill", "#0066ff"], [1, "font-medium", "whitespace-nowrap"], [1, "ml-auto", "w-6", "h-6", "rounded-full", "bg-blue-on", "text-white", "text-[10px]", "font-bold", "flex", "items-center", "justify-center", "shrink-0"], [1, "relative", "flex", "items-center", "self-stretch"], [1, "w-px", "h-full", "bg-tab/40"], [1, "absolute", "-bottom-3", "left-1/2", "-translate-x-1/2", "w-7", "h-7", "bg-white", "rounded-full", "shadow-[0_2px_8px_rgba(0,0,0,0.18)]", "flex", "items-center", "justify-center", "border", "border-gray-100", "text-gray-400", "hover:text-blue-on", "transition", "z-30", "cursor-pointer"], ["type", "button", "aria-label", "Manage QFact issues", 1, "flex", "items-center", "gap-1.5", "px-3", "transition", "hover:text-blue-on", "shrink-0", 3, "click"], ["width", "14", "height", "14", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round"], ["cx", "12", "cy", "12", "r", "3"], ["d", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.05a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.05a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"], [1, "absolute", "-bottom-3", "left-1/2", "-translate-x-1/2", "w-7", "h-7", "bg-white", "rounded-full", "shadow-[0_2px_8px_rgba(0,0,0,0.18)]", "flex", "items-center", "justify-center", "border", "border-gray-100", "text-gray-400", "hover:text-blue-on", "transition", "z-30", "cursor-pointer", 3, "click"], ["viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2.5", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "w-4", "h-4", "mt-0.5"], ["points", "6 9 12 15 18 9"], [1, "absolute", "left-0", "top-[100px]", "bottom-0", "z-40", 3, "selectedIssuesChange", "nCaseid", "nUserid", "nSesid"], [1, "absolute", "top-[50px]", "right-0", "w-full", "h-[calc(100vh_-_50px)]", "z-[99]", 3, "annotToolMode", "isIndividual", "ngClass", "nCaseid", "nUserid", "nBundledetailid", "hightlightMode", "currentPage", "cFFrom", "visibleMarkNavModel", "visibleAnnotDetails", "visibleIssueModel", "initialQFactMode", "annotGlobMode", "selectedlinktype", "onEvent", "jExtraFilters"], [1, "absolute", "top-[50px]", "right-0", "w-[520px]", "z-[99]", 3, "userList", "nBundledetailid", "ngClass", "tempAnnots", "selectedlinktype", "annotGlobMode", "selectedIssues", "linkIds", "globannots", "modeltype", "docInfo", "nCaseid", "fullMode"], [1, "absolute", "top-[50px]", "left-0", "bg-black/50", "w-full", "h-[calc(100vh_-_50px)]"], [1, "absolute", "top-[50px]", "right-0", "w-full", "h-[calc(100vh_-_50px)]", "z-[99]", 3, "hightlightModeChange", "visibleIssueModelChange", "OnEvent", "annotToolMode", "isIndividual", "ngClass", "nCaseid", "nUserid", "nBundledetailid", "hightlightMode", "currentPage", "cFFrom", "visibleMarkNavModel", "visibleAnnotDetails", "visibleIssueModel", "initialQFactMode", "annotGlobMode", "selectedlinktype", "onEvent", "jExtraFilters"], [1, "absolute", "top-[50px]", "right-0", "w-[520px]", "z-[99]", 3, "OnEvent", "userList", "nBundledetailid", "ngClass", "tempAnnots", "selectedlinktype", "annotGlobMode", "selectedIssues", "linkIds", "globannots", "modeltype", "docInfo", "nCaseid", "fullMode"], [1, "bg-white", "p-10", "rounded-base", "w-[623px]"], [1, "[&>img]:w-5"], ["src", "../../../../assets/icons/tip.svg", "alt", "Tip"], [1, "text-lg", "font-semibold", "my-2.5", "leading-snug", "text-sgreen"], [1, "flex", "items-center", "gap-3", "mt-6"], [3, "click"], [1, "bg-white", "p-10", "rounded-base", "w-[523px]"], [1, "list-disc", "ps-5"], [1, "text-xs"], [1, "text-xs", "[&>img]:inline"], ["src", "assets/icons/add-circle.svg", "width", "12", "alt", "", "aria-hidden", "true"], [1, "flex", "items-center", "gap-5"], [1, "text-sm", "font-semibold", "text-white"], [1, "text-xs", 3, "click"], ["mode", "darkwhite", 1, "text-xs", 3, "click"], ["name", "close", 1, "text-xs", "text-white", 3, "click"], ["role", "status", "aria-label", "loading", 1, "animate-spin", "inline-block", "size-4", "border-[3px]", "border-current", "border-t-transparent", "text-brand", "rounded-full", "dark:text-brand"], [1, "flex", "items-center", "justify-center", "bg-white", "rounded-full", "size-6"], ["name", "check", "type", "comnicn", 1, "block", "text-sm", "text-sgreen"], [3, "linkIds"], [1, "absolute", "!z-[99]", 3, "isRightClickedChange", "docInfo", "actionLinkAnnot", "isRightClicked"], [1, "fixed", "top-52", "left-5", 3, "fabIcons", "isHost"], [1, "fixed", "top-52", "left-5", 3, "buttonClick", "fabIconsChange", "fabIcons", "isHost"], ["type", "button", "aria-label", "Close dialog", 1, "fixed", "left-0", "top-0", "w-full", "h-full", "z-10", 3, "click"], [1, "absolute", "block", "m-auto", "w-fit", "h-fit", "bg-transparent", "z-20", 3, "DialogtypeChange", "docInfo", "type", "nId", "isLocationShared", "nCaseid", "Dialogtype"], ["matTooltipPosition", "right", 1, "px-3", "py-2", "text-xs", "rounded-base", "cursor-pointer", "flex", "justify-between", "items-center", "gap-2", "bg-blue-deactivate", 3, "matTooltip"], ["hideIcon", "", 1, "blue-toggle", 3, "ngModelChange", "change", "ngModel"], ["type", "button", "aria-label", "Show global facts", 1, "absolute", "right-5", "overflow-visible", "top-12", "bg-transparent", "rounded-s-md", "flex", "flex-col", "justify-center", "cursor-pointer", "z-10", 3, "click"], ["width", "32", "height", "39", "viewBox", "0 0 32 39", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "!overflow-visible"], ["clip-path", "url(#clip0_11719_66159)", "filter", "url(#filter0_d_11719_66159)"], ["d", "M5.50004 0H26.5C26.8979 0 27.5 0.000139877 28 0.000139877C28 0.50014 28 1.10341 28 1.50167V30.2482C28.0002 30.3825 27.9644 30.5143 27.8964 30.63C27.8284 30.7457 27.7306 30.8411 27.6133 30.9061C27.4959 30.9711 27.3633 31.0034 27.2293 30.9997C27.0952 30.996 26.9646 30.9564 26.851 30.8849L16 24.0718L5.14904 30.8834C5.03559 30.9548 4.90512 30.9944 4.7712 30.9982C4.63727 31.002 4.50477 30.9698 4.38748 30.9049C4.2702 30.8401 4.1724 30.745 4.10427 30.6295C4.03613 30.514 4.00014 30.3824 4.00004 30.2482V1.50167C4.00004 1.10341 4 0.5 4 8.0362e-05C4 8.0362e-05 5.10222 0 5.50004 0Z", "fill", "#0066FF"], ["id", "filter0_d_11719_66159", "x", "-6", "y", "-10", "width", "44", "height", "51", "filterUnits", "userSpaceOnUse", "color-interpolation-filters", "sRGB"], ["flood-opacity", "0", "result", "BackgroundImageFix"], ["in", "SourceAlpha", "type", "matrix", "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0", "result", "hardAlpha"], ["dy", "4"], ["stdDeviation", "2"], ["type", "matrix", "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"], ["mode", "normal", "in2", "BackgroundImageFix", "result", "effect1_dropShadow_11719_66159"], ["mode", "normal", "in", "SourceGraphic", "in2", "effect1_dropShadow_11719_66159", "result", "shape"], ["id", "clip0_11719_66159"], ["width", "24", "height", "31", "fill", "white", "transform", "translate(4)"]], template: function PdfComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 4);
        \u0275\u0275template(1, PdfComponent_Conditional_1_Template, 17, 35)(2, PdfComponent_Conditional_2_Template, 8, 1)(3, PdfComponent_Conditional_3_Template, 4, 1)(4, PdfComponent_Conditional_4_Template, 1, 5, "qfact-rapid-popup", 5);
        \u0275\u0275elementStart(5, "div", 6)(6, "hyperlink-box", 7);
        \u0275\u0275listener("onHyperlinkEvent", function PdfComponent_Template_hyperlink_box_onHyperlinkEvent_6_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnHyperLinkFile($event));
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275template(7, PdfComponent_Conditional_7_Template, 2, 2)(8, PdfComponent_Conditional_8_Template, 1, 7, "qfact-issue-panel", 8)(9, PdfComponent_Defer_9_Template, 1, 1);
        \u0275\u0275defer(10, 9, PdfComponent_Defer_10_DepsFn);
        \u0275\u0275template(12, PdfComponent_Conditional_12_Template, 9, 0, "div", 9)(13, PdfComponent_Conditional_13_Template, 21, 0, "div", 9)(14, PdfComponent_Conditional_14_Template, 4, 1, "div", 10);
        \u0275\u0275elementStart(15, "button", 11, 0);
        \u0275\u0275listener("menuClosed", function PdfComponent_Template_button_menuClosed_15_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.unselectIcons());
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(18, "mat-menu", 12, 1);
        \u0275\u0275template(20, PdfComponent_Conditional_20_Template, 3, 1);
        \u0275\u0275elementEnd();
        \u0275\u0275template(21, PdfComponent_Conditional_21_Template, 3, 1)(22, PdfComponent_Conditional_22_Template, 1, 1)(23, PdfComponent_Conditional_23_Template, 3, 5, "div", 13)(24, PdfComponent_Conditional_24_Template, 6, 7, "div", 14)(25, PdfComponent_Conditional_25_Template, 2, 1, "button", 15);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        const menuTrigger_r22 = \u0275\u0275reference(17);
        const notemenu_r28 = \u0275\u0275reference(19);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(22, _c3, ctx.compareMode, ctx.calloutOverlayActive));
        \u0275\u0275advance();
        \u0275\u0275conditional(1, !ctx.loading && !ctx.pdfFailed ? 1 : ctx.pdfFailed ? 2 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(3, ctx.highlightBox && !ctx.modeltype && !ctx.isLink ? 3 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(4, !ctx.compareMode && ctx.showQFactNotePopup && ctx.nCaseid && (ctx.userDetail == null ? null : ctx.userDetail.nUserid) && (ctx.qfactNotePopupIssues == null ? null : ctx.qfactNotePopupIssues.length) && ctx.qfactNotePopupFactId ? 4 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("hidden", !ctx.hyperlinkBox);
        \u0275\u0275advance();
        \u0275\u0275styleMap(\u0275\u0275pureFunction2(25, _c4, ctx.hyperlinkBoxOptions.x + "px", ctx.hyperlinkBoxOptions.y + "px"));
        \u0275\u0275property("hyperlinkOption", ctx.hyperlinkOption);
        \u0275\u0275advance();
        \u0275\u0275conditional(7, !ctx.compareMode && !ctx.sideBar && ctx.fullMode ? 7 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(8, ctx.qfactPanelOpen && ctx.nCaseid && (ctx.userDetail == null ? null : ctx.userDetail.nUserid) && ctx.fullMode ? 8 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275deferWhen(ctx.modeltype || ctx.visibleMarkNavModel || ctx.visibleIssueModel);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(12, ctx.factsheetalert ? 12 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(13, ctx.annotaioninstruction ? 13 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(14, ctx.isSlab ? 14 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("matMenuTriggerFor", notemenu_r28);
        \u0275\u0275advance(3);
        \u0275\u0275property("hasBackdrop", false);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(20, menuTrigger_r22.menuOpen ? 20 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(21, (ctx.docInfo == null ? null : ctx.docInfo.nPresentid) != null && (ctx.docInfo == null ? null : ctx.docInfo.isHost) ? 21 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(22, !ctx.compareMode ? 22 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(23, ctx.Dialogtype == "DS" ? 23 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(24, ctx.scrollMode == 3 ? 24 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(25, !ctx.modeltype && ctx.pdfLoaded && ctx.globalAnnots.length && ctx.fullMode ? 25 : -1);
      }
    }, dependencies: [
      PdfSharedModule,
      NgxExtendedPdfViewerComponent,
      PdfSidebarContentComponent,
      TranslatePipe,
      IconComponent,
      SkeletonComponent,
      CommonModule,
      NgClass,
      NgIf,
      ButtonComponent,
      MatCheckboxModule,
      MatCheckbox,
      MatTooltipModule,
      MatTooltip,
      HyperlinkBoxComponent,
      MatMenuModule,
      MatMenu,
      MatMenuTrigger,
      NgScrollbarModule,
      FabbuttonComponent,
      FormsModule,
      NgControlStatus,
      NgModel,
      DocumentShareComponent,
      MatSlideToggleModule,
      MatSlideToggle,
      QFactIssuePanelComponent,
      QFactRapidPopupComponent
    ], styles: ["\n\n.pdftoolbar[_ngcontent-%COMP%] {\n  transform: translateY(var(--button-offset));\n  will-change: transform;\n}\n[_nghost-%COMP%]     .callout-active {\n  cursor: crosshair !important;\n  user-select: none !important;\n  -webkit-user-select: none !important;\n}\n[_nghost-%COMP%]     .callout-active * {\n  cursor: crosshair !important;\n  user-select: none !important;\n  -webkit-user-select: none !important;\n}\n.callout-overlay[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  z-index: 9999;\n  pointer-events: none;\n}\n.callout-selection[_ngcontent-%COMP%] {\n  position: fixed;\n  border: 2px dashed #3F99FF;\n  background: rgba(63, 153, 255, 0.1);\n  border-radius: 4px;\n  pointer-events: none;\n}\n.callout-hint[_ngcontent-%COMP%] {\n  position: fixed;\n  bottom: 20px;\n  left: 50%;\n  transform: translateX(-50%);\n  background: rgba(0, 0, 0, 0.75);\n  color: white;\n  padding: 8px 16px;\n  border-radius: 8px;\n  font-size: 13px;\n  pointer-events: auto;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n.callout-close[_ngcontent-%COMP%] {\n  cursor: pointer;\n  padding: 2px 8px;\n  border-radius: 4px;\n  background: rgba(255, 255, 255, 0.2);\n  font-size: 12px;\n}\n.callout-close[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.35);\n}\n.qfact-pdf-shift[_ngcontent-%COMP%] {\n  margin-left: 287px;\n}\n.pdfwrapper[_ngcontent-%COMP%] {\n  padding-left: calc(4px * var(--isactive-pdf));\n  padding-right: calc(4px * var(--isactive-pdf));\n  padding-bottom: calc(4px * var(--isactive-pdf));\n}\n.pdfwrapper[_ngcontent-%COMP%]   .borders[_ngcontent-%COMP%] {\n  opacity: var(--isactive-pdf);\n  pointer-events: none;\n}\n/*# sourceMappingURL=pdf.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PdfComponent, { className: "PdfComponent", filePath: "src\\app\\pdf\\components\\pdf\\pdf.component.ts", lineNumber: 70 });
})();

export {
  PdfComponent
};
//# sourceMappingURL=chunk-RTDEOZQ3.js.map
