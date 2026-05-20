import {
  HyperLinkFolderComponent,
  TruncateTooltipDirective
} from "./chunk-QRO7O7ZW.js";
import {
  TabletruncComponent
} from "./chunk-QZORCCWS.js";
import {
  TextFieldModule
} from "./chunk-DVMGXG6V.js";
import {
  DragDropModule
} from "./chunk-EZOJOG5D.js";
import {
  FilecolumnService
} from "./chunk-PMFTFHHF.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  MyfileService
} from "./chunk-M4TJ3SSY.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  InputComponent
} from "./chunk-FEMUAMTL.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  MatDialog
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
  ScrollingModule
} from "./chunk-MESCMVD2.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle,
  NgSwitch,
  NgSwitchCase
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  ElementRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpropertyInterpolate1,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵpureFunctionV,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
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

// src/app/shared/interfaces/myfile.interface.ts
var MYFILES_SOCKET_CONVERTING_EVENTS = {
  PROCESS: "CONVERTING-PROCESS",
  START: "CONVERTING-START",
  FAILED: "CONVERTING-FAILED",
  SUCCESS: "CONVERTING-SUCCESS",
  ERROR: "CONVERTING-ERROR",
  VERIFY_COMPLETE: "VERIFY-CPOMPLETE",
  FILE_INSERT_COMPLETE: "FILE-INSERT-COMPLETE"
};
var MYFILES_SOCKET_CONVERTING_EVENT_LIST = [
  MYFILES_SOCKET_CONVERTING_EVENTS.PROCESS,
  MYFILES_SOCKET_CONVERTING_EVENTS.START,
  MYFILES_SOCKET_CONVERTING_EVENTS.FAILED,
  MYFILES_SOCKET_CONVERTING_EVENTS.SUCCESS,
  MYFILES_SOCKET_CONVERTING_EVENTS.ERROR,
  MYFILES_SOCKET_CONVERTING_EVENTS.VERIFY_COMPLETE,
  MYFILES_SOCKET_CONVERTING_EVENTS.FILE_INSERT_COMPLETE
];
var MYFILES_SOCKET_OCR_EVENTS = {
  START: "OCR-START",
  PROGRESS: "OCR-PROGRESS",
  SUCCESS: "OCR-SUCCESS",
  ERROR: "OCR-ERROR"
};
var MYFILES_CONVERSION_STATUS = {
  PROCESSING: "P",
  INSERTING: "I",
  FAILED: "F",
  SUCCESS: "S",
  VERIFY_SUCCESS: "VS"
};
var MYFILES_CONVERT_TYPE = {
  CONVERT: "C"
};

// src/app/shared/components/myfiles/facttable/facttable.component.ts
var _c0 = ["tableparent"];
var FacttableComponent_For_4_Conditional_12_Defer_1_DepsFn = () => [import("./chunk-FW7U5L66.js").then((m) => m.FactboxComponent)];
var _c1 = (a0) => ({ "background": a0 });
function FacttableComponent_For_4_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 14);
    \u0275\u0275listener("click", function FacttableComponent_For_4_Conditional_2_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.navigateToFactPage(x_r2 == null ? null : x_r2.nPage));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", x_r2 == null ? null : x_r2.nPage, " ");
  }
}
function FacttableComponent_For_4_Conditional_3_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 16);
    \u0275\u0275listener("click", function FacttableComponent_For_4_Conditional_3_For_1_Template_span_click_0_listener() {
      const i_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.navigateToFactPage(i_r5));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const i_r5 = ctx.$implicit;
    const $index_r6 = ctx.$index;
    const x_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", i_r5, " ", $index_r6 < (x_r2.jLinktype == null ? null : x_r2.jLinktype.pages == null ? null : x_r2.jLinktype.pages.length) - 1 ? ", " : "", " ");
  }
}
function FacttableComponent_For_4_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, FacttableComponent_For_4_Conditional_3_For_1_Template, 2, 2, "span", 15, \u0275\u0275repeaterTrackByIndex);
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275repeater(x_r2.jLinktype == null ? null : x_r2.jLinktype.pages);
  }
}
function FacttableComponent_For_4_Conditional_4_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("-", x_r2.jLinktype == null ? null : x_r2.jLinktype.end, "");
  }
}
function FacttableComponent_For_4_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 14);
    \u0275\u0275listener("click", function FacttableComponent_For_4_Conditional_4_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r7);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.navigateToFactPage(x_r2.jLinktype == null ? null : x_r2.jLinktype.start));
    });
    \u0275\u0275text(1);
    \u0275\u0275template(2, FacttableComponent_For_4_Conditional_4_Conditional_2_Template, 2, 1, "span");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", x_r2.jLinktype == null ? null : x_r2.jLinktype.start, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, (x_r2.jLinktype == null ? null : x_r2.jLinktype.start) != (x_r2.jLinktype == null ? null : x_r2.jLinktype.frm) ? 2 : -1);
  }
}
function FacttableComponent_For_4_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 8);
  }
}
function FacttableComponent_For_4_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 9);
  }
}
function FacttableComponent_For_4_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 10);
  }
}
function FacttableComponent_For_4_Conditional_12_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "factbox", 17);
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275property("jTexts", x_r2 == null ? null : x_r2.jTexts)("bIsHighlighted", x_r2 == null ? null : x_r2.bIsHighlighted)("jOT", x_r2 == null ? null : x_r2.jOT)("ishilight", (x_r2 == null ? null : x_r2.jOT == null ? null : x_r2.jOT.length) > 0);
  }
}
function FacttableComponent_For_4_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FacttableComponent_For_4_Conditional_12_Defer_0_Template, 1, 4);
    \u0275\u0275defer(1, 0, FacttableComponent_For_4_Conditional_12_Defer_1_DepsFn);
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275deferWhen(x_r2);
  }
}
function FacttableComponent_For_4_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1, "-");
    \u0275\u0275elementEnd();
  }
}
function FacttableComponent_For_4_For_16_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 24);
  }
  if (rf & 2) {
    const i_r8 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("src", "assets/icons/impact/" + i_r8.nImpactid + ".png", \u0275\u0275sanitizeUrl);
  }
}
function FacttableComponent_For_4_For_16_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " - ");
  }
}
function FacttableComponent_For_4_For_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13)(1, "dl", 19)(2, "div", 20);
    \u0275\u0275element(3, "span", 21);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "dl", 22);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "dl", 23);
    \u0275\u0275template(8, FacttableComponent_For_4_For_16_Conditional_8_Template, 1, 1, "img", 24)(9, FacttableComponent_For_4_For_16_Conditional_9_Template, 1, 0);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const i_r8 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(5, _c1, "#" + i_r8.cColor));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", i_r8.cIName, " (", i_r8.cCategory, ") ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", (i_r8 == null ? null : i_r8.cRel) ? i_r8 == null ? null : i_r8.cRel : "", "");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(8, i_r8.nImpactid ? 8 : 9);
  }
}
function FacttableComponent_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3)(1, "dl", 4);
    \u0275\u0275template(2, FacttableComponent_For_4_Conditional_2_Template, 2, 1, "span", 5)(3, FacttableComponent_For_4_Conditional_3_Template, 2, 0)(4, FacttableComponent_For_4_Conditional_4_Template, 3, 2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "dl", 6)(6, "span", 7);
    \u0275\u0275template(7, FacttableComponent_For_4_Conditional_7_Template, 1, 0, "icon", 8)(8, FacttableComponent_For_4_Conditional_8_Template, 1, 0, "icon", 9)(9, FacttableComponent_For_4_Conditional_9_Template, 1, 0, "icon", 10);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(10, "div", 11);
    \u0275\u0275elementStart(11, "dl", 12);
    \u0275\u0275template(12, FacttableComponent_For_4_Conditional_12_Template, 3, 1)(13, FacttableComponent_For_4_Conditional_13_Template, 2, 0);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "div");
    \u0275\u0275repeaterCreate(15, FacttableComponent_For_4_For_16_Template, 10, 7, "div", 13, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, (x_r2 == null ? null : x_r2.nPage) ? 2 : (x_r2 == null ? null : x_r2.jLinktype == null ? null : x_r2.jLinktype.pages == null ? null : x_r2.jLinktype.pages.length) ? 3 : 4);
    \u0275\u0275advance(5);
    \u0275\u0275conditional(7, (x_r2.jLinktype == null ? null : x_r2.jLinktype.type) == "H" ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(8, (x_r2.jLinktype == null ? null : x_r2.jLinktype.type) == "P" ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(9, (x_r2.jLinktype == null ? null : x_r2.jLinktype.type) == "F" ? 9 : -1);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(12, (x_r2 == null ? null : x_r2.jTexts.length) || (x_r2 == null ? null : x_r2.bIsHighlighted) ? 12 : 13);
    \u0275\u0275advance(3);
    \u0275\u0275repeater(x_r2 == null ? null : x_r2.jIssue);
  }
}
var FacttableComponent = class _FacttableComponent {
  constructor() {
    this.factlist = [];
    this.viewlink = new EventEmitter();
    this.viewFile = new EventEmitter();
    this.componentPosition = { top: 0, height: 0 };
    this.viewportInfo = {};
  }
  ngOnInit() {
    debugger;
    this.factlist;
  }
  ngOnChanges(changes) {
    if (changes["factlist"] && !changes["factlist"].firstChange) {
      this.recalculatePosition();
    }
  }
  gotoPage(x, page) {
    if (page.length > 2 && page.split("-").length > 1) {
      page = page.split("-")[0];
    }
    this.viewlink.emit({ event: "VIEW-LINK-RESULT", data: { nBundledetailid: x.nBundledetailid, page } });
  }
  navigateToFactPage(page) {
    this.viewFile.emit("VIEW_" + page);
  }
  OnDocumentClick() {
  }
  ngAfterViewInit() {
  }
  calculateComponentPosition() {
    if (this.tableParent?.nativeElement) {
      const element = this.tableParent.nativeElement;
      const rect = element.getBoundingClientRect();
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      const offsetHeight = element.offsetHeight;
      this.componentPosition = {
        top: rect.top + window.scrollY,
        height: Math.max(scrollHeight, clientHeight, offsetHeight, rect.height)
      };
      const screenHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const componentBottom = this.componentPosition.top + this.componentPosition.height;
      const componentTop = this.componentPosition.top;
      const isOutOfBottom = componentBottom > screenHeight + scrollY;
      const isOutOfTop = componentTop < scrollY;
      const isOutOfScreen = isOutOfBottom || isOutOfTop;
      const visibleHeight = Math.min(componentBottom, screenHeight + scrollY) - Math.max(componentTop, scrollY);
      this.viewportInfo = {
        screenHeight,
        scrollY,
        componentTop,
        componentBottom,
        isOutOfBottom,
        isOutOfTop,
        isOutOfScreen,
        visibleHeight,
        totalHeight: this.componentPosition.height
      };
      console.log("=== Component Position Calculation ===");
      console.log("Component position:", this.componentPosition);
      console.log("Scroll height:", scrollHeight);
      console.log("Client height:", clientHeight);
      console.log("Offset height:", offsetHeight);
      console.log("Bounding rect height:", rect.height);
      console.log("Screen height:", screenHeight);
      console.log("Component top:", componentTop);
      console.log("Component bottom:", componentBottom);
      console.log("Current scroll Y:", scrollY);
      console.log("Is out of bottom:", isOutOfBottom);
      console.log("Is out of top:", isOutOfTop);
      console.log("Is out of screen:", isOutOfScreen);
      console.log("Visible height:", visibleHeight);
      console.log("=====================================");
      this.setTableParentHeight(visibleHeight);
    }
  }
  // Set the visible height to table parent element
  setTableParentHeight(visibleHeight) {
    if (this.tableParent?.nativeElement) {
      const element = this.tableParent.nativeElement;
      element.style.maxHeight = `${visibleHeight}px`;
      if (visibleHeight < this.componentPosition.height) {
        element.style.overflowY = "auto";
      } else {
        element.style.overflowY = "visible";
      }
      console.log("Table parent height set to:", visibleHeight + "px");
      console.log("Overflow set to:", element.style.overflowY);
    }
  }
  // Method to recalculate position when content changes
  recalculatePosition() {
    setTimeout(() => {
      this.calculateComponentPosition();
    }, 50);
  }
  // Check if component is going out of screen viewport
  isComponentOutOfScreen() {
    return this.viewportInfo.isOutOfScreen;
  }
  // Get detailed viewport information
  getViewportInfo() {
    return this.viewportInfo;
  }
  static {
    this.\u0275fac = function FacttableComponent_Factory(t) {
      return new (t || _FacttableComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FacttableComponent, selectors: [["facttable"]], viewQuery: function FacttableComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.tableParent = _t.first);
      }
    }, inputs: { factlist: "factlist" }, outputs: { viewlink: "viewlink", viewFile: "viewFile" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 5, vars: 0, consts: [["tableparent", ""], [1, "bg-faint", "px-2.5", "pb-2.5"], ["id", "tableparent", 1, "relative", "files-wrapper", "flex", "flex-col", "gap-2.5", "min-w-fit"], [1, "factbody", "w-full", "rounded-full", "text-grey", "px-3", "[&>dl]:text-xxs"], [1, "relative", "flex", "items-start", "cursor-pointer", "bundle", "group"], [1, "relative", "z-10", "underline", "text-brand"], [1, "tab", "relative", "group", "flex", "items-start", "cursor-pointer"], [1, "relative", "z-10", "inline-flex"], ["name", "textF", "type", "indicn", 1, "!cursor-default", "[&>i]:cursor-default"], ["name", "pageF", "type", "indicn", 1, "!cursor-default", "[&>i]:cursor-default"], ["name", "file", "type", "indicn", 1, "!cursor-default", "[&>i]:cursor-default"], [1, "w-px", "h-auto", "mx-5", "bg-grey/20"], [1, "relative", "flex", "items-start", "py-0", "w-full", "cursor-pointer", "group", "pe-3", "min-w-[224px]"], [1, "flex"], [1, "relative", "z-10", "underline", "text-brand", 3, "click"], [1, "relative", "z-10", "underline", "text-brand", "inline-flex", "leading-none"], [1, "relative", "z-10", "underline", "text-brand", "inline-flex", "leading-none", 3, "click"], [3, "jTexts", "bIsHighlighted", "jOT", "ishilight"], [1, "relative", "z-10"], [1, "links"], [1, "flex", "items-end", "gap-1"], [1, "rounded-base", "h-3", "w-1", "bg-red-400", 3, "ngStyle"], [1, "relevence"], [1, "impact"], [3, "src"]], template: function FacttableComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2, 0);
        \u0275\u0275repeaterCreate(3, FacttableComponent_For_4_Template, 17, 5, "div", 3, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275repeater(ctx.factlist);
      }
    }, dependencies: [CommonModule, NgStyle, IconComponent], styles: ["\n\n.files-wrapper[_ngcontent-%COMP%] {\n  --drag: 0px;\n  --order: 0px;\n  --checkbox: 30px;\n  --bundle: 65px;\n  --tab: 50px;\n  --links: 160px;\n  --impact: 60px;\n  --relevence: 100px;\n  --pagination: 55px;\n  --exhibit: 75px;\n  --kind: 55px;\n  --doi: 100px;\n  --extra: 20px;\n  --name: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --desc: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --hasname: 2;\n  --hasdesc: 2;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%] {\n  display: inline-flex;\n  font-size: 10px;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%] {\n  width: var(--drag);\n  min-width: var(--drag);\n  max-width: var(--drag);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%] {\n  width: var(--order);\n  min-width: var(--order);\n  max-width: var(--order);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%] {\n  width: var(--checkbox);\n  min-width: var(--checkbox);\n  max-width: var(--checkbox);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%] {\n  width: var(--bundle);\n  min-width: var(--bundle);\n  max-width: var(--bundle);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%] {\n  width: var(--tab);\n  min-width: var(--tab);\n  max-width: var(--tab);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%] {\n  width: var(--links);\n  min-width: var(--links);\n  max-width: var(--links);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%] {\n  width: var(--impact);\n  min-width: var(--impact);\n  max-width: var(--impact);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%] {\n  width: var(--relevence);\n  min-width: var(--relevence);\n  max-width: var(--relevence);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%] {\n  width: var(--pagination);\n  min-width: var(--pagination);\n  max-width: var(--pagination);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%] {\n  width: var(--exhibit);\n  min-width: var(--exhibit);\n  max-width: var(--exhibit);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {\n  width: var(--kind);\n  min-width: var(--kind);\n  max-width: var(--kind);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%] {\n  width: var(--doi);\n  min-width: var(--doi);\n  max-width: var(--doi);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {\n  width: var(--extra);\n  min-width: var(--extra);\n  max-width: var(--extra);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {\n  max-width: calc(100% - var(--name));\n  min-width: 100px;\n  flex: 1;\n}\n.sortheader[_ngcontent-%COMP%]   dl[_ngcontent-%COMP%]:last-child {\n  border-bottom-right-radius: 10px !important;\n  border-top-right-radius: 10px !important;\n}\n/*# sourceMappingURL=facttable.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FacttableComponent, { className: "FacttableComponent", filePath: "src\\app\\shared\\components\\myfiles\\facttable\\facttable.component.ts", lineNumber: 14 });
})();

// src/app/shared/components/myfiles/factlinktable/factlinktable.component.ts
var _c02 = (a0) => ({ "bg-white shadow-[0_0_6px_#06f] rounded-base mb-2  py-2": a0 });
var _c12 = (a0) => ({ "rotate-180": a0 });
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 20);
    \u0275\u0275listener("click", function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_3_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const y_r2 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.navigateToFactPage(y_r2 == null ? null : y_r2.nPage));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const y_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", y_r2 == null ? null : y_r2.nPage, " ");
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_4_For_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " , ");
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_4_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275listener("click", function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_4_For_1_Template_span_click_0_listener() {
      const page_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r2.navigateToFactPage(page_r5));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275template(2, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_4_For_1_Conditional_2_Template, 1, 0);
  }
  if (rf & 2) {
    const page_r5 = ctx.$implicit;
    const y_r2 = \u0275\u0275nextContext(3).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", page_r5, "");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, (y_r2.jLinktype == null ? null : y_r2.jLinktype.pages == null ? null : y_r2.jLinktype.pages.length) > 1 ? 2 : -1);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_4_For_1_Template, 3, 2, null, null, \u0275\u0275repeaterTrackByIdentity);
  }
  if (rf & 2) {
    const y_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275repeater(y_r2.jLinktype == null ? null : y_r2.jLinktype.pages);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_5_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const y_r2 = \u0275\u0275nextContext(3).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("-", y_r2.jLinktype == null ? null : y_r2.jLinktype.end, "");
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275listener("click", function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_5_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const y_r2 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.navigateToFactPage(y_r2.jLinktype == null ? null : y_r2.jLinktype.start));
    });
    \u0275\u0275text(1);
    \u0275\u0275template(2, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_5_Conditional_2_Template, 2, 1, "span");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const y_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", y_r2.jLinktype == null ? null : y_r2.jLinktype.start, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, (y_r2.jLinktype == null ? null : y_r2.jLinktype.end) != (y_r2.jLinktype == null ? null : y_r2.jLinktype.start) ? 2 : -1);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 9);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 10);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 11);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-tabletrunc", 16);
  }
  if (rf & 2) {
    const y_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275property("noPadding", true)("value", y_r2.cTab);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275text(1, "-");
    \u0275\u0275elementEnd();
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_22_For_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " , ");
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_22_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275listener("click", function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_22_For_1_Template_span_click_0_listener() {
      const page_r8 = \u0275\u0275restoreView(_r7).$implicit;
      const y_r2 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.gotoPage(y_r2, page_r8));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275template(2, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_22_For_1_Conditional_2_Template, 1, 0);
  }
  if (rf & 2) {
    const page_r8 = ctx.$implicit;
    const y_r2 = \u0275\u0275nextContext(3).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", page_r8, "");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, (y_r2.jLinktype == null ? null : y_r2.jLinktype.pages == null ? null : y_r2.jLinktype.pages.length) > 1 ? 2 : -1);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_22_For_1_Template, 3, 2, null, null, \u0275\u0275repeaterTrackByIdentity);
  }
  if (rf & 2) {
    const y_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275repeater(y_r2.jLinktype == null ? null : y_r2.jLinktype.pages);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_23_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r10 = \u0275\u0275nextContext(4).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("-", x_r10.jLinktype == null ? null : x_r10.jLinktype.end, "");
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275listener("click", function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_23_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r9);
      const y_r2 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.gotoPage(y_r2, y_r2.jLinktype == null ? null : y_r2.jLinktype.start));
    });
    \u0275\u0275text(1);
    \u0275\u0275template(2, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_23_Conditional_2_Template, 2, 1, "span");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const y_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", y_r2.jLinktype == null ? null : y_r2.jLinktype.start, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, (y_r2.jLinktype == null ? null : y_r2.jLinktype.end) != (y_r2.jLinktype == null ? null : y_r2.jLinktype.start) ? 2 : -1);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_28_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r10 = \u0275\u0275nextContext(4).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r10.sublist.length - 1);
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_28_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 23);
    \u0275\u0275listener("click", function FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_28_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r11);
      const x_r10 = \u0275\u0275nextContext(3).$implicit;
      return \u0275\u0275resetView(x_r10.showmore = !x_r10.showmore);
    });
    \u0275\u0275template(1, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_28_Conditional_1_Template, 2, 1, "span", 24);
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "icon", 25);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r10 = \u0275\u0275nextContext(3).$implicit;
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !x_r10.showmore ? 1 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(!x_r10.showmore ? "More" : "Hide");
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c12, x_r10.showmore));
  }
}
function FactlinktableComponent_For_4_For_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4)(1, "dl", 5)(2, "span", 6);
    \u0275\u0275template(3, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_3_Template, 2, 1, "span")(4, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_4_Template, 2, 0)(5, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_5_Template, 3, 2);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "dl", 7)(7, "span", 8);
    \u0275\u0275template(8, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_8_Template, 1, 0, "icon", 9)(9, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_9_Template, 1, 0, "icon", 10)(10, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_10_Template, 1, 0, "icon", 11);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(11, "div", 12);
    \u0275\u0275elementStart(12, "dl", 13)(13, "div", 14);
    \u0275\u0275text(14, " [ ");
    \u0275\u0275elementStart(15, "span", 15);
    \u0275\u0275text(16);
    \u0275\u0275elementEnd();
    \u0275\u0275text(17, " | ");
    \u0275\u0275template(18, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_18_Template, 1, 2, "app-tabletrunc", 16)(19, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_19_Template, 2, 0);
    \u0275\u0275text(20, " | ");
    \u0275\u0275elementStart(21, "span", 17);
    \u0275\u0275template(22, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_22_Template, 2, 0)(23, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_23_Template, 3, 2);
    \u0275\u0275elementEnd();
    \u0275\u0275text(24, " ] ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(25, "dl", 18)(26, "span");
    \u0275\u0275text(27);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(28, FactlinktableComponent_For_4_For_2_Conditional_0_Conditional_28_Template, 5, 5, "button", 19);
  }
  if (rf & 2) {
    const ctx_r11 = \u0275\u0275nextContext();
    const y_r2 = ctx_r11.$implicit;
    const $index_r13 = ctx_r11.$index;
    const x_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275conditional(3, (y_r2 == null ? null : y_r2.nPage) ? 3 : (y_r2 == null ? null : y_r2.jLinktype == null ? null : y_r2.jLinktype.pages) && (y_r2.jLinktype == null ? null : y_r2.jLinktype.pages == null ? null : y_r2.jLinktype.pages.length) ? 4 : 5);
    \u0275\u0275advance(5);
    \u0275\u0275conditional(8, (y_r2.jLinktype == null ? null : y_r2.jLinktype.type) == "H" ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(9, (y_r2.jLinktype == null ? null : y_r2.jLinktype.type) == "P" ? 9 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(10, (y_r2.jLinktype == null ? null : y_r2.jLinktype.type) == "F" ? 10 : -1);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(y_r2.cBundletag);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(18, y_r2.cTab ? 18 : 19);
    \u0275\u0275advance(4);
    \u0275\u0275conditional(22, (y_r2 == null ? null : y_r2.jLinktype) && (y_r2.jLinktype == null ? null : y_r2.jLinktype.pages) && (y_r2.jLinktype == null ? null : y_r2.jLinktype.pages == null ? null : y_r2.jLinktype.pages.length) ? 22 : 23);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", y_r2.cFilename, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(28, $index_r13 === 0 && x_r10.sublist.length > 1 ? 28 : -1);
  }
}
function FactlinktableComponent_For_4_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactlinktableComponent_For_4_For_2_Conditional_0_Template, 29, 9);
  }
  if (rf & 2) {
    const $index_r13 = ctx.$index;
    const x_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275conditional(0, $index_r13 === 0 || x_r10.showmore ? 0 : -1);
  }
}
function FactlinktableComponent_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275repeaterCreate(1, FactlinktableComponent_For_4_For_2_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r10 = ctx.$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(1, _c02, x_r10.showmore));
    \u0275\u0275advance();
    \u0275\u0275repeater(x_r10.sublist);
  }
}
var FactlinktableComponent = class _FactlinktableComponent {
  constructor() {
    this.dlink = [];
    this.flink = [];
    this.viewlink = new EventEmitter();
    this.viewFile = new EventEmitter();
  }
  ngOnInit() {
  }
  gotoPage(x, page) {
    debugger;
    this.viewlink.emit({ event: "VIEW-LINK-RESULT", data: { nBundledetailid: x.nBundledetailid, page } });
  }
  navigateToFactPage(page) {
    this.viewFile.emit("VIEW_" + page);
  }
  static {
    this.\u0275fac = function FactlinktableComponent_Factory(t) {
      return new (t || _FactlinktableComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FactlinktableComponent, selectors: [["factlink"]], inputs: { linkview: "linkview", dlink: "dlink", flink: "flink" }, outputs: { viewlink: "viewlink", viewFile: "viewFile" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 5, vars: 0, consts: [[1, "bg-faint", "px-2.5", "pb-2.5"], ["id", "tableparent", 1, "files-wrapper", "pe-2", "relative", "min-w-fit"], [1, "flex", "flex-col", "gap-2"], [1, "flex", "flex-col", "gap-2.5", "relative", 3, "ngClass"], [1, "factbody", "w-full", "rounded-full", "text-grey", "px-3", "[&>dl]:py-0.5", "[&>dl]:text-xxs", "relative"], [1, "bundle", "relative", "group", "flex", "items-start", "cursor-pointer"], [1, "relative", "z-10", "text-brand", "underline"], [1, "tab", "relative", "group", "flex", "items-start", "cursor-pointer"], [1, "relative", "z-10"], ["name", "textF", "type", "indicn"], ["name", "pageF", "type", "indicn"], ["name", "file", "type", "indicn"], [1, "w-px", "bg-grey/20", "mx-5", "h-auto"], [1, "links"], [1, "text-xxs", "m-0", "flex", "items-center", "gap-1"], ["title", "B", 1, "gBundle"], ["addcls", "text-center", 1, "block", "gTab", "h-4", "relative", 3, "noPadding", "value"], [1, "text-brand", "underline", "text-nowrap", "w-fit", "gPage"], [1, "w-full", "relative", "flex", "items-start", "cursor-pointer", "group", "pe-3"], [1, "bg-grey/20", "text-xxs", "rounded-full", "absolute", "bottom-2", "right-2", "w-fit", "flex", "items-center", "gap-1", "ps-1", "pe-2", "py-0.5", "z-10"], [3, "click"], [1, "relative", "z-10", "text-brand", "underline", 3, "click"], [1, "gTab"], [1, "bg-grey/20", "text-xxs", "rounded-full", "absolute", "bottom-2", "right-2", "w-fit", "flex", "items-center", "gap-1", "ps-1", "pe-2", "py-0.5", "z-10", 3, "click"], [1, "size-4", "rounded-full", "bg-grey", "text-white", "text-xxs"], ["name", "chvx", 1, "text-xxs", 3, "ngClass"]], template: function FactlinktableComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2);
        \u0275\u0275repeaterCreate(3, FactlinktableComponent_For_4_Template, 3, 3, "div", 3, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275repeater(ctx.linkview == "FL" ? ctx.flink : ctx.dlink);
      }
    }, dependencies: [IconComponent, CommonModule, NgClass, TabletruncComponent], styles: ["\n\n.files-wrapper[_ngcontent-%COMP%] {\n  --drag: 0px;\n  --order: 0px;\n  --checkbox: 30px;\n  --bundle: 65px;\n  --tab: 50px;\n  --links: 160px;\n  --impact: 60px;\n  --relevence: 100px;\n  --pagination: 55px;\n  --exhibit: 75px;\n  --kind: 55px;\n  --doi: 100px;\n  --extra: 20px;\n  --name: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --desc: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --hasname: 2;\n  --hasdesc: 2;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%] {\n  display: inline-flex;\n  font-size: 10px;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%] {\n  width: var(--drag);\n  min-width: var(--drag);\n  max-width: var(--drag);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%] {\n  width: var(--order);\n  min-width: var(--order);\n  max-width: var(--order);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%] {\n  width: var(--checkbox);\n  min-width: var(--checkbox);\n  max-width: var(--checkbox);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%] {\n  width: var(--bundle);\n  min-width: var(--bundle);\n  max-width: var(--bundle);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%] {\n  width: var(--tab);\n  min-width: var(--tab);\n  max-width: var(--tab);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%] {\n  width: var(--links);\n  min-width: var(--links);\n  max-width: var(--links);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%] {\n  width: var(--impact);\n  min-width: var(--impact);\n  max-width: var(--impact);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%] {\n  width: var(--relevence);\n  min-width: var(--relevence);\n  max-width: var(--relevence);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%] {\n  width: var(--pagination);\n  min-width: var(--pagination);\n  max-width: var(--pagination);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%] {\n  width: var(--exhibit);\n  min-width: var(--exhibit);\n  max-width: var(--exhibit);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {\n  width: var(--kind);\n  min-width: var(--kind);\n  max-width: var(--kind);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%] {\n  width: var(--doi);\n  min-width: var(--doi);\n  max-width: var(--doi);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {\n  width: var(--extra);\n  min-width: var(--extra);\n  max-width: var(--extra);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {\n  max-width: calc(100% - var(--name));\n  min-width: 100px;\n  flex: 1;\n}\n.sortheader[_ngcontent-%COMP%]   dl[_ngcontent-%COMP%]:last-child {\n  border-bottom-right-radius: 10px !important;\n  border-top-right-radius: 10px !important;\n}\n.gBundle[_ngcontent-%COMP%] {\n  display: inline-flex;\n  width: 40px;\n  justify-content: center;\n  align-items: center;\n}\n.gTab[_ngcontent-%COMP%], .gPage[_ngcontent-%COMP%] {\n  display: inline-flex;\n  width: 30px;\n  justify-content: center;\n  align-items: center;\n}\n/*# sourceMappingURL=factlinktable.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FactlinktableComponent, { className: "FactlinktableComponent", filePath: "src\\app\\shared\\components\\myfiles\\factlinktable\\factlinktable.component.ts", lineNumber: 16 });
})();

// src/app/shared/components/myfiles/weblinktable/weblinktable.component.ts
function WeblinktableComponent_For_19_Conditional_2_For_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " , ");
  }
}
function WeblinktableComponent_For_19_Conditional_2_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275listener("click", function WeblinktableComponent_For_19_Conditional_2_For_1_Template_span_click_0_listener() {
      const page_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const x_r4 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.gotoPage(x_r4, page_r3));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275template(2, WeblinktableComponent_For_19_Conditional_2_For_1_Conditional_2_Template, 1, 0);
  }
  if (rf & 2) {
    const page_r3 = ctx.$implicit;
    const x_r4 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", page_r3, "");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, (x_r4.jLinktype == null ? null : x_r4.jLinktype.pages.length) > 1 ? 2 : -1);
  }
}
function WeblinktableComponent_For_19_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, WeblinktableComponent_For_19_Conditional_2_For_1_Template, 3, 2, null, null, \u0275\u0275repeaterTrackByIdentity);
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275repeater(x_r4.jLinktype == null ? null : x_r4.jLinktype.pages);
  }
}
function WeblinktableComponent_For_19_Conditional_3_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("-", x_r4.jLinktype == null ? null : x_r4.jLinktype.end, "");
  }
}
function WeblinktableComponent_For_19_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275listener("click", function WeblinktableComponent_For_19_Conditional_3_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const x_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.gotoPage(x_r4, x_r4.jLinktype == null ? null : x_r4.jLinktype.start));
    });
    \u0275\u0275text(1);
    \u0275\u0275template(2, WeblinktableComponent_For_19_Conditional_3_Conditional_2_Template, 2, 1, "span");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r4.jLinktype == null ? null : x_r4.jLinktype.start, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, (x_r4.jLinktype == null ? null : x_r4.jLinktype.end) != (x_r4.jLinktype == null ? null : x_r4.jLinktype.start) ? 2 : -1);
  }
}
function WeblinktableComponent_For_19_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 14);
  }
}
function WeblinktableComponent_For_19_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 15);
  }
}
function WeblinktableComponent_For_19_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 16);
  }
}
function WeblinktableComponent_For_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 11)(1, "dl", 12);
    \u0275\u0275template(2, WeblinktableComponent_For_19_Conditional_2_Template, 2, 0)(3, WeblinktableComponent_For_19_Conditional_3_Template, 3, 2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "dl", 13)(5, "span", 5);
    \u0275\u0275template(6, WeblinktableComponent_For_19_Conditional_6_Template, 1, 0, "icon", 14)(7, WeblinktableComponent_For_19_Conditional_7_Template, 1, 0, "icon", 15)(8, WeblinktableComponent_For_19_Conditional_8_Template, 1, 0, "icon", 16);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(9, "div", 17);
    \u0275\u0275elementStart(10, "dl", 18)(11, "div", 19);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "dl", 20);
    \u0275\u0275listener("click", function WeblinktableComponent_For_19_Template_dl_click_13_listener() {
      const x_r4 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.viewUrl(x_r4));
    });
    \u0275\u0275element(14, "icon", 21);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, (x_r4.jLinktype == null ? null : x_r4.jLinktype.pages) && (x_r4.jLinktype == null ? null : x_r4.jLinktype.pages.length) ? 2 : 3);
    \u0275\u0275advance(4);
    \u0275\u0275conditional(6, (x_r4.jLinktype == null ? null : x_r4.jLinktype.type) == "H" ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(7, (x_r4.jLinktype == null ? null : x_r4.jLinktype.type) == "P" ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(8, (x_r4.jLinktype == null ? null : x_r4.jLinktype.type) == "F" ? 8 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", x_r4.cNote, " ");
  }
}
var WeblinktableComponent = class _WeblinktableComponent {
  constructor() {
    this.wlink = [];
    this.viewlink = new EventEmitter();
  }
  viewUrl(x) {
    const url = x.cUrl;
    window.open(url, "_blank");
  }
  gotoPage(x, page) {
    if (page.length > 2 && page.split("-").length > 1) {
      page = page.split("-")[0];
    }
    this.viewlink.emit({ event: "VIEW-RESULT", data: { nBundledetailid: x.nBundledetailid, page } });
  }
  static {
    this.\u0275fac = function WeblinktableComponent_Factory(t) {
      return new (t || _WeblinktableComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _WeblinktableComponent, selectors: [["weblink"]], inputs: { wlink: "wlink" }, outputs: { viewlink: "viewlink" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 20, vars: 0, consts: [[1, "h-2", "bg-grey"], [1, "bg-reply", "p-2.5"], ["id", "tableparent", 1, "files-wrapper", "pe-2", "relative", "min-w-fit"], [1, "header", "sortheader", "w-full", "rounded-full", "text-grey", "px-3", "bg-white", "[&>dl]:py-0.5", "[&>dl]:text-xxs", "mb-2.5"], [1, "bundle", "relative", "group/head", "flex", "items-center", "cursor-pointer"], [1, "relative", "z-10"], [1, "tab", "relative", "group/head", "flex", "items-center", "cursor-pointer"], [1, "w-px", "bg-grey/25", "mx-5", "my-1", "h-auto"], [1, "w-full", "relative", "flex", "items-center", "cursor-pointer", "group/head"], [1, "impact", "relative", "group/head", "hover:text-white", "text-center"], [1, "relative", "z-10", "text-center"], [1, "factbody", "w-full", "rounded-full", "text-grey", "px-3", "[&>dl]:py-0.5", "[&>dl]:text-xxs", "mb-2.5"], [1, "bundle", "relative", "group", "flex", "items-start", "cursor-pointer"], [1, "tab", "relative", "group", "flex", "items-start", "cursor-pointer"], ["name", "textF", "type", "indicn"], ["name", "pageF", "type", "indicn"], ["name", "file", "type", "indicn"], [1, "w-px", "bg-grey/20", "mx-5", "h-auto"], [1, "w-full", "relative", "flex", "items-start", "cursor-pointer", "group", "pe-3"], [1, "border", "border-tab", "min-h-5", "max-h-28", "rounded-base", "text-xxs", "px-2.5", "overflow-auto", "w-full"], [1, "impact", "text-center", 3, "click"], ["name", "weblink", "type", "indicn", 1, "text-brand", "text-base"], [1, "relative", "z-10", "text-brand", "underline", 3, "click"]], template: function WeblinktableComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275element(1, "div");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(2, "div", 1)(3, "div", 2)(4, "header", 3)(5, "dl", 4)(6, "span", 5);
        \u0275\u0275text(7, "Page");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(8, "dl", 6)(9, "span", 5);
        \u0275\u0275text(10, "Level");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(11, "div", 7);
        \u0275\u0275elementStart(12, "dl", 8)(13, "span", 5);
        \u0275\u0275text(14, " Site Description ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(15, "dl", 9)(16, "span", 10);
        \u0275\u0275text(17, " URL ");
        \u0275\u0275elementEnd()()();
        \u0275\u0275repeaterCreate(18, WeblinktableComponent_For_19_Template, 15, 5, "div", 11, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(18);
        \u0275\u0275repeater(ctx.wlink);
      }
    }, dependencies: [IconComponent], styles: ["\n\n.files-wrapper[_ngcontent-%COMP%] {\n  --drag: 0px;\n  --order: 0px;\n  --checkbox: 30px;\n  --bundle: 65px;\n  --tab: 50px;\n  --links: 180px;\n  --impact: 60px;\n  --relevence: 120px;\n  --pagination: 55px;\n  --exhibit: 75px;\n  --kind: 55px;\n  --doi: 100px;\n  --extra: 20px;\n  --name: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --desc: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --hasname: 2;\n  --hasdesc: 2;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%] {\n  display: inline-flex;\n  font-size: 10px;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%] {\n  width: var(--drag);\n  min-width: var(--drag);\n  max-width: var(--drag);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%] {\n  width: var(--order);\n  min-width: var(--order);\n  max-width: var(--order);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%] {\n  width: var(--checkbox);\n  min-width: var(--checkbox);\n  max-width: var(--checkbox);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%] {\n  width: var(--bundle);\n  min-width: var(--bundle);\n  max-width: var(--bundle);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%] {\n  width: var(--tab);\n  min-width: var(--tab);\n  max-width: var(--tab);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%] {\n  width: var(--links);\n  min-width: var(--links);\n  max-width: var(--links);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%] {\n  width: var(--impact);\n  min-width: var(--impact);\n  max-width: var(--impact);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%] {\n  width: var(--relevence);\n  min-width: var(--relevence);\n  max-width: var(--relevence);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%] {\n  width: var(--pagination);\n  min-width: var(--pagination);\n  max-width: var(--pagination);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%] {\n  width: var(--exhibit);\n  min-width: var(--exhibit);\n  max-width: var(--exhibit);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {\n  width: var(--kind);\n  min-width: var(--kind);\n  max-width: var(--kind);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%] {\n  width: var(--doi);\n  min-width: var(--doi);\n  max-width: var(--doi);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {\n  width: var(--extra);\n  min-width: var(--extra);\n  max-width: var(--extra);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {\n  max-width: calc(100% - var(--name));\n  min-width: 100px;\n  flex: 1;\n}\n.sortheader[_ngcontent-%COMP%]   dl[_ngcontent-%COMP%]:last-child {\n  border-bottom-right-radius: 10px !important;\n  border-top-right-radius: 10px !important;\n}\n/*# sourceMappingURL=weblinktable.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(WeblinktableComponent, { className: "WeblinktableComponent", filePath: "src\\app\\shared\\components\\myfiles\\weblinktable\\weblinktable.component.ts", lineNumber: 12 });
})();

// src/app/shared/directive/overflow-check.directive.ts
var OverflowCheckDirective = class _OverflowCheckDirective {
  constructor(el) {
    this.el = el;
    this.isOverflowing = false;
  }
  ngAfterViewInit() {
    requestAnimationFrame(() => {
      const element = this.el.nativeElement;
      this.isOverflowing = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
    });
  }
  static {
    this.\u0275fac = function OverflowCheckDirective_Factory(t) {
      return new (t || _OverflowCheckDirective)(\u0275\u0275directiveInject(ElementRef));
    };
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({ type: _OverflowCheckDirective, selectors: [["", "overflowCheck", ""]], exportAs: ["overflowCheck"], standalone: true });
  }
};

// src/app/shared/components/myfiles/table/table.component.ts
var _c03 = (a0) => ({ "me-5": a0 });
var _c13 = (a0, a1) => ({ "pointer-events-none opacity-50": a0, "pe-2": a1 });
var _c2 = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) => ({ "--hasdesc": a0, "--hasname": a1, "--bundle": a2, "--tab": a3, "--relevence": a4, "--impact": a5, "--pagination": a6, "--exhibit": a7, "--links": a8, "--link": a9, "--kind": a10, "--reamrk": a11, "--doi": a12, "--extra": a13 });
var _c3 = (a0) => ({ "--activewidth": a0 });
var _c4 = (a0, a1, a2) => ({ "nohover": a0, "active": a1, "ismyfiles": a2 });
var _c5 = (a0) => ({ "--drag": a0 });
var _c6 = (a0) => ({ "--order": a0 });
var _c7 = (a0) => ({ "!opacity-100": a0 });
var _c8 = (a0) => ({ "--checkbox": a0 });
var _c9 = () => ["CB", "CO"];
var _c10 = (a0) => ({ "!absolute left-6": a0 });
var _c11 = (a0, a1) => [a0, a1];
var _c122 = (a0) => ({ "order": a0 });
var _c132 = (a0) => ({ "hover:[&>div]:underline": a0 });
var _c14 = (a0, a1) => ({ cFname: a0, cLname: a1 });
var _c15 = (a0) => ({ "bg-grey text-white": a0 });
var _c16 = (a0, a1) => ({ "--extra": a0, "order": a1 });
var _c17 = (a0, a1) => ({ "!opacity-100": a0, "!absolute left-6": a1 });
var _c18 = (a0) => ({ "--extra": a0 });
function TableComponent_div_1_dl_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "dl", 46);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r1.checkoutside ? "!w-11 !min-w-11" : "!w-8 !min-w-8");
  }
}
function TableComponent_div_1_dl_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "dl", 47);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(1, _c5, ctx_r1.col.drag ? "" : "0px"));
  }
}
function TableComponent_div_1_dl_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "dl", 48);
    \u0275\u0275text(1, "Order ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(1, _c6, ctx_r1.col.drag ? "" : "0px"));
  }
}
function TableComponent_div_1_ng_container_5_dl_1_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-checkbox", 51);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_5_dl_1_ng_container_1_ng_container_1_Template_mat_checkbox_click_1_listener($event) {
      \u0275\u0275restoreView(_r3);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown", function TableComponent_div_1_ng_container_5_dl_1_ng_container_1_ng_container_1_Template_mat_checkbox_keydown_1_listener($event) {
      \u0275\u0275restoreView(_r3);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275twoWayListener("ngModelChange", function TableComponent_div_1_ng_container_5_dl_1_ng_container_1_ng_container_1_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(5);
      \u0275\u0275twoWayBindingSet(ctx_r1.filedetail.cIscheck, $event) || (ctx_r1.filedetail.cIscheck = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function TableComponent_div_1_ng_container_5_dl_1_ng_container_1_ng_container_1_Template_mat_checkbox_change_1_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.checkFile($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c10, ctx_r1.checkoutside))("disabled", ctx_r1.isCopy);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.filedetail.cIscheck);
  }
}
function TableComponent_div_1_ng_container_5_dl_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_5_dl_1_ng_container_1_ng_container_1_Template, 2, 5, "ng-container", 36);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.presentDocType || (ctx_r1.presentDocType == "F" || ctx_r1.presentDocType == "CF"));
  }
}
function TableComponent_div_1_ng_container_5_dl_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "dl", 50);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_5_dl_1_ng_container_1_Template, 2, 1, "ng-container", 36);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275classMap(!ctx_r1.checkoutside ? "pl-5" : "pl-0");
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(5, _c7, ctx_r1.filedetail.cIscheck))("ngStyle", \u0275\u0275pureFunction1(7, _c8, (ctx_r1.col == null ? null : ctx_r1.col.check == null ? null : ctx_r1.col.check.view) ? !ctx_r1.checkoutside ? "40px" : "0px" : !ctx_r1.checkoutside ? "40px" : "0px"));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.isIndividual && !ctx_r1.isChooser && !\u0275\u0275pureFunction0(9, _c9).includes(ctx_r1.cutCopyType) && (ctx_r1.col == null ? null : ctx_r1.col.check["view"]) && ctx_r1.cFoldertype != "ALL");
  }
}
function TableComponent_div_1_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_5_dl_1_Template, 2, 10, "dl", 49);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.col == null ? null : ctx_r1.col.check["view"]);
  }
}
function TableComponent_div_1_dl_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "dl", 52)(1, "button", 53);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_6_Template_button_click_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.starFile(ctx_r1.filedetail));
    });
    \u0275\u0275element(2, "icon", 54);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("name", ctx_r1.filedetail.bIsStar ? "star-fill" : "star-outline");
  }
}
function TableComponent_div_1_dl_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "dl", 55)(1, "span", 56);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.index + 1, " ");
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span", 63);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.filedetail.cBundletag);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_container_2_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 64);
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_container_2_ng_container_1_Template, 3, 1, "ng-container", 62)(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_container_2_ng_template_2_Template, 2, 0, "ng-template", null, 1, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const bundleDash_r5 = \u0275\u0275reference(3);
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.cBundletag)("ngIfElse", bundleDash_r5);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "inpt", 65);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_template_3_Template_inpt_click_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown", function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_template_3_Template_inpt_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      return \u0275\u0275resetView($event.stopPropagation());
    })("valueChange", function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_template_3_Template_inpt_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(5);
      ctx_r1.filedetail.cBundletag = $event;
      return \u0275\u0275resetView(ctx_r1.isChange = true);
    })("keyup.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_template_3_Template_inpt_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.changeBundle(ctx_r1.filedetail.cBundletag));
    })("focusout", function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_template_3_Template_inpt_focusout_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.changeBundle(ctx_r1.filedetail.cBundletag));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("maxlength", 20)("value", ctx_r1.filedetail.cBundletag ? ctx_r1.filedetail.cBundletag : "")("showlabel", false);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 61);
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_container_2_Template, 4, 2, "ng-container", 62)(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_2_ng_template_3_Template, 1, 3, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const bundleEdit_r7 = \u0275\u0275reference(4);
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.col.bundle.edit)("ngIfElse", bundleEdit_r7);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "app-tabletrunc", 66);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275property("value", ctx_r1.filedetail.cTab);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_container_2_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 64);
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_container_2_ng_container_1_Template, 2, 1, "ng-container", 62)(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_container_2_ng_template_2_Template, 2, 0, "ng-template", null, 3, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const tabDash_r8 = \u0275\u0275reference(3);
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.filedetail.cTab)("ngIfElse", tabDash_r8);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "inpt", 65, 4);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_template_3_Template_inpt_click_0_listener($event) {
      \u0275\u0275restoreView(_r9);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown", function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_template_3_Template_inpt_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r9);
      return \u0275\u0275resetView($event.stopPropagation());
    })("valueChange", function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_template_3_Template_inpt_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(5);
      ctx_r1.filedetail.cTab = $event;
      return \u0275\u0275resetView(ctx_r1.isChange = true);
    })("keyup.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_template_3_Template_inpt_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateTabRef(ctx_r1.filedetail));
    })("focusout", function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_template_3_Template_inpt_focusout_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateTabRef(ctx_r1.filedetail));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("maxlength", 50)("value", ctx_r1.filedetail.cTab)("showlabel", false);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 61);
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_container_2_Template, 4, 2, "ng-container", 62)(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_3_ng_template_3_Template, 2, 3, "ng-template", null, 2, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const tabEdit_r10 = \u0275\u0275reference(4);
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.col.tab.edit)("ngIfElse", tabEdit_r10);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 70);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_1_Template_btn_click_0_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(6);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewLink("QF"));
    })("keydown.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_1_Template_btn_keydown_enter_0_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(6);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewLink("QF"));
    })("keydown.space", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_1_Template_btn_keydown_space_0_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(6);
      $event.preventDefault();
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewLink("QF"));
    });
    \u0275\u0275element(1, "icon", 71);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275property("active", ctx_r1.filedetail.linkview == "QF" && ctx_r1.flink.length);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 70);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_2_Template_btn_click_0_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(6);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewLink("F"));
    })("keydown.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_2_Template_btn_keydown_enter_0_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(6);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewLink("F"));
    })("keydown.space", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_2_Template_btn_keydown_space_0_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(6);
      $event.preventDefault();
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewLink("F"));
    });
    \u0275\u0275element(1, "icon", 72);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275property("active", ctx_r1.filedetail.linkview == "F" && ctx_r1.flink.length);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_span_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 73);
    \u0275\u0275text(1, " OCR ");
    \u0275\u0275elementStart(2, "div", 74)(3, "span", 75);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r1.OCRmessage && ctx_r1.OCRmessage != "" ? ctx_r1.OCRmessage : "Processing...", " ");
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_1_Template, 2, 1, "btn", 67)(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_btn_2_Template, 2, 1, "btn", 67);
    \u0275\u0275elementStart(3, "app-tabletrunc", 68);
    \u0275\u0275listener("dblclick", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_Template_app_tabletrunc_dblclick_3_listener($event) {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.viewFileDB($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_span_4_Template, 5, 1, "span", 69);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.filedetail.qfact);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.filedetail.fact);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.filedetail.fact ? "w-[calc(100%-30px)]" : "w-full");
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(7, _c132, !ctx_r1.isChooser))("value", ctx_r1.filedetail.cName);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isOCR);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "inpt", 76, 6);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_template_2_Template_inpt_click_0_listener($event) {
      \u0275\u0275restoreView(_r14);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_template_2_Template_inpt_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r14);
      return \u0275\u0275resetView($event.stopPropagation());
    })("valueChange", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_template_2_Template_inpt_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(5);
      ctx_r1.filedetail.cName = $event;
      return \u0275\u0275resetView(ctx_r1.isChange = true);
    })("keyup.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_template_2_Template_inpt_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r14);
      const name_r15 = \u0275\u0275reference(1);
      const ctx_r1 = \u0275\u0275nextContext(5);
      ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.name, name_r15);
      return \u0275\u0275resetView(ctx_r1.editname = false);
    })("focusout", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_template_2_Template_inpt_focusout_0_listener() {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(5);
      ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.name);
      return \u0275\u0275resetView(ctx_r1.editname = false);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("value", ctx_r1.filedetail.cName ? ctx_r1.filedetail.cName : "")("maxlength", 500)("showlabel", false);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_4_div_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "avtr", 82);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r17 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("detail", \u0275\u0275pureFunction2(2, _c14, x_r17.cFname, x_r17.cLname))("matTooltip", (x_r17 == null ? null : x_r17.cFname) + " " + (x_r17 == null ? null : x_r17.cLname));
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_4_div_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 81);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_4_div_3_ng_container_1_Template, 2, 5, "ng-container", 44);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.sharedUser);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-menu", 77, 7);
    \u0275\u0275template(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_4_div_3_Template, 2, 1, "div", 78);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "btn", 79, 8);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_4_Template_btn_click_4_listener($event) {
      \u0275\u0275restoreView(_r16);
      const sh_r18 = \u0275\u0275reference(5);
      const ctx_r1 = \u0275\u0275nextContext(5);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewSharedUser(sh_r18));
    })("keydown.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_4_Template_btn_keydown_enter_4_listener($event) {
      \u0275\u0275restoreView(_r16);
      const sh_r18 = \u0275\u0275reference(5);
      const ctx_r1 = \u0275\u0275nextContext(5);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewSharedUser(sh_r18));
    })("keydown.space", function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_4_Template_btn_keydown_space_4_listener($event) {
      \u0275\u0275restoreView(_r16);
      const sh_r18 = \u0275\u0275reference(5);
      const ctx_r1 = \u0275\u0275nextContext(5);
      $event.preventDefault();
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewSharedUser(sh_r18));
    });
    \u0275\u0275element(6, "icon", 80);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const share_r19 = \u0275\u0275reference(2);
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.sharedUser.length);
    \u0275\u0275advance();
    \u0275\u0275property("matMenuTriggerFor", share_r19);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_1_Template, 5, 9, "ng-container", 62)(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_template_2_Template, 2, 3, "ng-template", null, 5, \u0275\u0275templateRefExtractor)(4, TableComponent_div_1_ng_container_8_dl_1_ng_container_4_ng_container_4_Template, 7, 2, "ng-container", 36);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const nameEdit_r20 = \u0275\u0275reference(3);
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.editname)("ngIfElse", nameEdit_r20);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.filedetail.share);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_5_span_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 87);
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_5_button_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r22 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 88);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_5_button_4_Template_button_click_0_listener($event) {
      \u0275\u0275restoreView(_r22);
      const ctx_r1 = \u0275\u0275nextContext(5);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewLink("FL"));
    });
    \u0275\u0275element(1, "icon", 89);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(1, _c15, (ctx_r1.filedetail == null ? null : ctx_r1.filedetail.linkview) == "FL"));
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_5_button_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 88);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_5_button_5_Template_button_click_0_listener($event) {
      \u0275\u0275restoreView(_r23);
      const ctx_r1 = \u0275\u0275nextContext(5);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.viewLink("DL"));
    });
    \u0275\u0275element(1, "icon", 90);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(1, _c15, (ctx_r1.filedetail == null ? null : ctx_r1.filedetail.linkview) == "DL"));
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 83);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_5_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r21);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown", function TableComponent_div_1_ng_container_8_dl_1_ng_container_5_Template_div_keydown_1_listener($event) {
      \u0275\u0275restoreView(_r21);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_5_span_2_Template, 2, 0, "span", 84);
    \u0275\u0275elementStart(3, "div", 85);
    \u0275\u0275template(4, TableComponent_div_1_ng_container_8_dl_1_ng_container_5_button_4_Template, 2, 3, "button", 86)(5, TableComponent_div_1_ng_container_8_dl_1_ng_container_5_button_5_Template, 2, 3, "button", 86);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !(ctx_r1.filedetail == null ? null : ctx_r1.filedetail.fact) && !(ctx_r1.filedetail == null ? null : ctx_r1.filedetail.doc) && !(ctx_r1.filedetail == null ? null : ctx_r1.filedetail.web));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.flink);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.doc);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.filedetail.cRelevence ? ctx_r1.filedetail.cRelevence : "-", " ");
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.filedetail.cImpact ? ctx_r1.filedetail.cImpact : "-", " ");
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "app-tabletrunc", 66);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("value", ctx_r1.filedetail.cRefpage && ctx_r1.filedetail.cRefpage != "" ? ctx_r1.filedetail.cRefpage : ctx_r1.filedetail.cPage ? ctx_r1.filedetail.cPage : "");
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span");
    \u0275\u0275element(2, "img", 91);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_ng_template_1_inpt_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r24 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "inpt", 93);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_ng_template_1_inpt_0_Template_inpt_click_0_listener($event) {
      \u0275\u0275restoreView(_r24);
      const ctx_r1 = \u0275\u0275nextContext(7);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.pagination(ctx_r1.filedetail));
    })("keydown", function TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_ng_template_1_inpt_0_Template_inpt_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r24);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(7);
    \u0275\u0275property("readonly", true)("value", ctx_r1.filedetail.cRefpage && ctx_r1.filedetail.cRefpage != "" ? ctx_r1.filedetail.cRefpage : ctx_r1.filedetail.cPage ? ctx_r1.filedetail.cPage : "")("showlabel", false);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_ng_template_1_inpt_0_Template, 1, 3, "inpt", 92);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275property("ngIf", ctx_r1.col.page.edit);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_ng_container_0_Template, 3, 0, "ng-container", 62)(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_ng_template_1_Template, 1, 1, "ng-template", null, 10, \u0275\u0275templateRefExtractor);
  }
  if (rf & 2) {
    const pageEdit_r25 = \u0275\u0275reference(2);
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("ngIf", ctx_r1.filedetail.cIsPaginate)("ngIfElse", pageEdit_r25);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 61);
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_container_2_Template, 2, 1, "ng-container", 62)(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_8_ng_template_3_Template, 3, 2, "ng-template", null, 9, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const pageOther_r26 = \u0275\u0275reference(4);
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.col.page.edit && !ctx_r1.filedetail.cIsPaginate)("ngIfElse", pageOther_r26);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span", 94);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275property("tooltipText", ctx_r1.filedetail.cExhibitno);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.filedetail.cExhibitno, " ");
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_container_2_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 95);
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_container_2_ng_container_1_Template, 3, 2, "ng-container", 62)(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_container_2_ng_template_2_Template, 2, 0, "ng-template", null, 12, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const exhibitDash_r27 = \u0275\u0275reference(3);
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.cExhibitno)("ngIfElse", exhibitDash_r27);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r28 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "inpt", 96, 13);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_template_3_Template_inpt_click_0_listener($event) {
      \u0275\u0275restoreView(_r28);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown", function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_template_3_Template_inpt_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r28);
      return \u0275\u0275resetView($event.stopPropagation());
    })("valueChange", function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_template_3_Template_inpt_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r1 = \u0275\u0275nextContext(5);
      ctx_r1.filedetail.cExhibitno = $event;
      return \u0275\u0275resetView(ctx_r1.isChange = true);
    })("keyup.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_template_3_Template_inpt_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r28);
      const exhibit_r29 = \u0275\u0275reference(1);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.exhibit, exhibit_r29));
    })("focusout", function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_template_3_Template_inpt_focusout_0_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.exhibit));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("value", ctx_r1.filedetail.cExhibitno ? ctx_r1.filedetail.cExhibitno : "")("showlabel", false);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 61);
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_container_2_Template, 4, 2, "ng-container", 62)(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_9_ng_template_3_Template, 2, 2, "ng-template", null, 11, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const exhibitEdit_r30 = \u0275\u0275reference(4);
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.col.exhibit.edit)("ngIfElse", exhibitEdit_r30);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span", 94);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275property("tooltipText", ctx_r1.filedetail.cAuthor);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.filedetail.cAuthor, " ");
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_container_2_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 95);
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_container_2_ng_container_1_Template, 3, 2, "ng-container", 62)(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_container_2_ng_template_2_Template, 2, 0, "ng-template", null, 15, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const authorDash_r31 = \u0275\u0275reference(3);
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.cAuthor)("ngIfElse", authorDash_r31);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r32 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "inpt", 96, 16);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_template_3_Template_inpt_click_0_listener($event) {
      \u0275\u0275restoreView(_r32);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown", function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_template_3_Template_inpt_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r32);
      return \u0275\u0275resetView($event.stopPropagation());
    })("valueChange", function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_template_3_Template_inpt_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r32);
      const ctx_r1 = \u0275\u0275nextContext(5);
      ctx_r1.filedetail.cAuthor = $event;
      return \u0275\u0275resetView(ctx_r1.isChange = true);
    })("keyup.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_template_3_Template_inpt_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r32);
      const author_r33 = \u0275\u0275reference(1);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.author, author_r33));
    })("focusout", function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_template_3_Template_inpt_focusout_0_listener() {
      \u0275\u0275restoreView(_r32);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.author));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("value", ctx_r1.filedetail.cAuthor ? ctx_r1.filedetail.cAuthor : "")("showlabel", false);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 61);
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_container_2_Template, 4, 2, "ng-container", 62)(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_10_ng_template_3_Template, 2, 2, "ng-template", null, 14, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const authorEdit_r34 = \u0275\u0275reference(4);
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.col.author.edit)("ngIfElse", authorEdit_r34);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_11_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.filedetail.cFiletype ? ctx_r1.filedetail.cFiletype : "\u2212", " ");
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_11_ng_template_3_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span");
    \u0275\u0275element(2, "img", 97);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_11_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TableComponent_div_1_ng_container_8_dl_1_ng_container_11_ng_template_3_ng_container_0_Template, 3, 0, "ng-container", 36);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("ngIf", ctx_r1.filedetail.cCStatus == "P" || ctx_r1.filedetail.cCStatus == "V" || ctx_r1.filedetail.cCStatus == "VS" || ctx_r1.filedetail.cCStatus == "I");
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 61);
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_11_ng_container_2_Template, 2, 1, "ng-container", 62)(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_11_ng_template_3_Template, 1, 1, "ng-template", null, 17, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const kindLoading_r35 = \u0275\u0275reference(4);
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.filedetail.cCStatus || ctx_r1.filedetail.cCStatus == "S" || ctx_r1.filedetail.cCStatus == "F")("ngIfElse", kindLoading_r35);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 98)(2, "span");
    \u0275\u0275text(3, "-");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span", 99);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.filedetail.dIntrestDt);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_container_2_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 100);
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_container_2_ng_container_1_Template, 3, 1, "ng-container", 62)(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_container_2_ng_template_2_Template, 2, 0, "ng-template", null, 19, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const dateDash_r36 = \u0275\u0275reference(3);
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.filedetail.dIntrestDt)("ngIfElse", dateDash_r36);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r37 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "inpt", 101, 20);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_template_3_Template_inpt_click_0_listener($event) {
      \u0275\u0275restoreView(_r37);
      return \u0275\u0275resetView($event.stopPropagation());
    })("valueChange", function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_template_3_Template_inpt_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r37);
      const ctx_r1 = \u0275\u0275nextContext(5);
      ctx_r1.filedetail.dIntrestDt = $event;
      return \u0275\u0275resetView(ctx_r1.isChange = true);
    })("keydown.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_template_3_Template_inpt_keydown_enter_0_listener() {
      \u0275\u0275restoreView(_r37);
      const date_r38 = \u0275\u0275reference(1);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.date, date_r38));
    })("keyup.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_template_3_Template_inpt_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r37);
      const date_r38 = \u0275\u0275reference(1);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.date, date_r38));
    })("focusout", function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_template_3_Template_inpt_focusout_0_listener() {
      \u0275\u0275restoreView(_r37);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.date));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("value", ctx_r1.filedetail.dIntrestDt ? ctx_r1.filedetail.dIntrestDt : "")("showlabel", false);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 61);
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_container_2_Template, 4, 2, "ng-container", 62)(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_13_ng_template_3_Template, 2, 2, "ng-template", null, 18, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const dateEdit_r39 = \u0275\u0275reference(4);
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.col.date.edit)("ngIfElse", dateEdit_r39);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_container_2_ng_container_1_span_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 104);
    \u0275\u0275text(1, "...more");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(7);
    \u0275\u0275property("matTooltip", ctx_r1.filedetail.cDescription);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span", 102, 23);
    \u0275\u0275text(3);
    \u0275\u0275template(4, TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_container_2_ng_container_1_span_4_Template, 2, 1, "span", 103);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const overflow_r40 = \u0275\u0275reference(2);
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r1.filedetail.cDescription, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", overflow_r40.isOverflowing);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_container_2_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 95);
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_container_2_ng_container_1_Template, 5, 2, "ng-container", 62)(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_container_2_ng_template_2_Template, 2, 0, "ng-template", null, 22, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const descDash_r41 = \u0275\u0275reference(3);
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.cDescription)("ngIfElse", descDash_r41);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r42 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "inpt", 105, 24);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_template_3_Template_inpt_click_0_listener($event) {
      \u0275\u0275restoreView(_r42);
      return \u0275\u0275resetView($event.stopPropagation());
    })("valueChange", function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_template_3_Template_inpt_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r42);
      const ctx_r1 = \u0275\u0275nextContext(5);
      ctx_r1.filedetail.cDescription = $event;
      return \u0275\u0275resetView(ctx_r1.isChange = true);
    })("keydown.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_template_3_Template_inpt_keydown_enter_0_listener() {
      \u0275\u0275restoreView(_r42);
      const desc_r43 = \u0275\u0275reference(1);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.desc, desc_r43));
    })("keyup.enter", function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_template_3_Template_inpt_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r42);
      const desc_r43 = \u0275\u0275reference(1);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.desc, desc_r43));
    })("focusout", function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_template_3_Template_inpt_focusout_0_listener() {
      \u0275\u0275restoreView(_r42);
      const ctx_r1 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r1.updateFileData(ctx_r1.filedetail, ctx_r1.col.desc));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275property("value", ctx_r1.filedetail.cDescription ? ctx_r1.filedetail.cDescription : "")("maxlength", 500)("showlabel", false);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_ng_container_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 61);
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_container_2_Template, 4, 2, "ng-container", 62)(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_14_ng_template_3_Template, 2, 3, "ng-template", null, 21, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const descEdit_r44 = \u0275\u0275reference(4);
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.col.desc.edit)("ngIfElse", descEdit_r44);
  }
}
function TableComponent_div_1_ng_container_8_dl_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "dl", 58);
    \u0275\u0275elementContainerStart(1, 59);
    \u0275\u0275template(2, TableComponent_div_1_ng_container_8_dl_1_ng_container_2_Template, 5, 2, "ng-container", 60)(3, TableComponent_div_1_ng_container_8_dl_1_ng_container_3_Template, 5, 2, "ng-container", 60)(4, TableComponent_div_1_ng_container_8_dl_1_ng_container_4_Template, 5, 3, "ng-container", 60)(5, TableComponent_div_1_ng_container_8_dl_1_ng_container_5_Template, 6, 3, "ng-container", 60)(6, TableComponent_div_1_ng_container_8_dl_1_ng_container_6_Template, 2, 1, "ng-container", 60)(7, TableComponent_div_1_ng_container_8_dl_1_ng_container_7_Template, 2, 1, "ng-container", 60)(8, TableComponent_div_1_ng_container_8_dl_1_ng_container_8_Template, 5, 2, "ng-container", 60)(9, TableComponent_div_1_ng_container_8_dl_1_ng_container_9_Template, 5, 2, "ng-container", 60)(10, TableComponent_div_1_ng_container_8_dl_1_ng_container_10_Template, 5, 2, "ng-container", 60)(11, TableComponent_div_1_ng_container_8_dl_1_ng_container_11_Template, 5, 2, "ng-container", 60)(12, TableComponent_div_1_ng_container_8_dl_1_ng_container_12_Template, 4, 0, "ng-container", 60)(13, TableComponent_div_1_ng_container_8_dl_1_ng_container_13_Template, 5, 2, "ng-container", 60)(14, TableComponent_div_1_ng_container_8_dl_1_ng_container_14_Template, 5, 2, "ng-container", 60);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const column_r45 = \u0275\u0275nextContext().$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(16, _c11, ctx_r1.col == null ? null : ctx_r1.col[column_r45] == null ? null : ctx_r1.col[column_r45].class, ctx_r1.isUpdate_batchprocess(ctx_r1.col == null ? null : ctx_r1.col[column_r45]) ? "bg-blue-50 text-blue-on" : ""))("ngStyle", \u0275\u0275pureFunction1(19, _c122, ctx_r1.col == null ? null : ctx_r1.col[column_r45] == null ? null : ctx_r1.col[column_r45].order));
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitch", column_r45);
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "bundle");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "tab");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "name");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "link");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "relevence");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "impact");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "page");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "exhibit");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "author");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "kind");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "remark");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "date");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", "desc");
  }
}
function TableComponent_div_1_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_ng_container_8_dl_1_Template, 15, 21, "dl", 57);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const column_r45 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.col == null ? null : ctx_r1.col[column_r45] == null ? null : ctx_r1.col[column_r45].view) && (ctx_r1.col == null ? null : ctx_r1.col[column_r45] == null ? null : ctx_r1.col[column_r45].name));
  }
}
function TableComponent_div_1_dl_9_ng_container_28_span_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 125);
    \u0275\u0275text(1, " OCR ");
    \u0275\u0275elementEnd();
  }
}
function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r47 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 126);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_button_click_0_listener($event) {
      \u0275\u0275restoreView(_r47);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275element(1, "icon", 127);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "mat-menu", 128, 29)(4, "div")(5, "h6", 129);
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 121)(9, "btn", 122);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_btn_click_9_listener() {
      \u0275\u0275restoreView(_r47);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.ocrFileReq(0));
    })("keydown.enter", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_btn_keydown_enter_9_listener() {
      \u0275\u0275restoreView(_r47);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.ocrFileReq(0));
    })("keydown.space", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_btn_keydown_space_9_listener($event) {
      \u0275\u0275restoreView(_r47);
      const ctx_r1 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.ocrFileReq(0));
    });
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "btn", 122);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_btn_click_12_listener() {
      \u0275\u0275restoreView(_r47);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.ocrFileReq(1));
    })("keydown.enter", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_btn_keydown_enter_12_listener() {
      \u0275\u0275restoreView(_r47);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.ocrFileReq(1));
    })("keydown.space", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_btn_keydown_space_12_listener($event) {
      \u0275\u0275restoreView(_r47);
      const ctx_r1 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.ocrFileReq(1));
    });
    \u0275\u0275text(13);
    \u0275\u0275pipe(14, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "btn", 122);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_btn_click_15_listener() {
      \u0275\u0275restoreView(_r47);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.ocrFileReq(2));
    })("keydown.enter", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_btn_keydown_enter_15_listener() {
      \u0275\u0275restoreView(_r47);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.ocrFileReq(2));
    })("keydown.space", function TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template_btn_keydown_space_15_listener($event) {
      \u0275\u0275restoreView(_r47);
      const ctx_r1 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.ocrFileReq(2));
    });
    \u0275\u0275text(16);
    \u0275\u0275pipe(17, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "btn", 130);
    \u0275\u0275text(19);
    \u0275\u0275pipe(20, "translate");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ocrfile_r48 = \u0275\u0275reference(3);
    \u0275\u0275property("matMenuTriggerFor", ocrfile_r48);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(7, 6, "MYFILES.FILEEXPLORER.OCR_TYPE"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(11, 8, "MYFILES.FILEEXPLORER.OCR_NORMAL"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(14, 10, "MYFILES.FILEEXPLORER.OCR_SHARP"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(17, 12, "MYFILES.FILEEXPLORER.OCR_SHARP_WITH_GRAYSCALE"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(20, 14, "CASECARD.CANCEL"));
  }
}
function TableComponent_div_1_dl_9_ng_container_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TableComponent_div_1_dl_9_ng_container_28_span_1_Template, 2, 0, "span", 124)(2, TableComponent_div_1_dl_9_ng_container_28_ng_template_2_Template, 21, 16, "ng-template", null, 28, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ocrAction_r49 = \u0275\u0275reference(3);
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isOCR)("ngIfElse", ocrAction_r49);
  }
}
function TableComponent_div_1_dl_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r46 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "dl", 106)(1, "button", 107);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_Template_button_click_1_listener($event) {
      \u0275\u0275restoreView(_r46);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275element(2, "icon", 108);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "mat-menu", 109, 25)(5, "div", 110)(6, "button", 111);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_Template_button_click_6_listener() {
      \u0275\u0275restoreView(_r46);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.editname = !ctx_r1.editname);
    });
    \u0275\u0275element(7, "icon", 112);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "button", 113);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_Template_button_click_8_listener() {
      \u0275\u0275restoreView(_r46);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.getPermission());
    });
    \u0275\u0275element(9, "icon", 114);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "button", 115);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_Template_button_click_10_listener($event) {
      \u0275\u0275restoreView(_r46);
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.hyperlink(ctx_r1.filedetail));
    });
    \u0275\u0275element(11, "icon", 116);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "button", 117, 26);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_Template_button_click_12_listener($event) {
      \u0275\u0275restoreView(_r46);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275element(14, "icon", 118);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "mat-menu", 119, 27)(17, "div")(18, "h6", 120);
    \u0275\u0275text(19);
    \u0275\u0275pipe(20, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "div", 121)(22, "btn", 122);
    \u0275\u0275listener("click", function TableComponent_div_1_dl_9_Template_btn_click_22_listener() {
      \u0275\u0275restoreView(_r46);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.deleteBundleReq());
    })("keydown.enter", function TableComponent_div_1_dl_9_Template_btn_keydown_enter_22_listener() {
      \u0275\u0275restoreView(_r46);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.deleteBundleReq());
    })("keydown.space", function TableComponent_div_1_dl_9_Template_btn_keydown_space_22_listener($event) {
      \u0275\u0275restoreView(_r46);
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.deleteBundleReq());
    });
    \u0275\u0275text(23);
    \u0275\u0275pipe(24, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "btn", 123);
    \u0275\u0275text(26);
    \u0275\u0275pipe(27, "translate");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275template(28, TableComponent_div_1_dl_9_ng_container_28_Template, 4, 2, "ng-container", 36);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const menu_r50 = \u0275\u0275reference(4);
    const delete_r51 = \u0275\u0275reference(16);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction2(13, _c16, ctx_r1.col.extra ? "20px" : "0px", ctx_r1.col == null ? null : ctx_r1.col.extra == null ? null : ctx_r1.col.extra.order));
    \u0275\u0275advance();
    \u0275\u0275property("matMenuTriggerFor", menu_r50);
    \u0275\u0275advance(11);
    \u0275\u0275property("matMenuTriggerFor", delete_r51);
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(20, 7, "ACTIONBAR.CONFIRM_DELETE"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(24, 9, "ACTIONBAR.DELETE"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(27, 11, "CASECARD.CANCEL"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.filedetail.cFiletype == "PDF");
  }
}
function TableComponent_div_1_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r52 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "dl", 131)(2, "button", 132, 30);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_10_Template_button_click_2_listener($event) {
      \u0275\u0275restoreView(_r52);
      const undo_r53 = \u0275\u0275reference(3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.SelectCore(undo_r53));
    });
    \u0275\u0275element(4, "img", 133);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "mat-menu", 134, 31)(7, "div", 135)(8, "h6", 136);
    \u0275\u0275text(9, "File added as Core File");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "btn", 137);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_10_Template_btn_click_10_listener() {
      \u0275\u0275restoreView(_r52);
      const undo_r53 = \u0275\u0275reference(3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.SelectCore(undo_r53));
    })("keydown.enter", function TableComponent_div_1_ng_container_10_Template_btn_keydown_enter_10_listener() {
      \u0275\u0275restoreView(_r52);
      const undo_r53 = \u0275\u0275reference(3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.SelectCore(undo_r53));
    })("keydown.space", function TableComponent_div_1_ng_container_10_Template_btn_keydown_space_10_listener($event) {
      \u0275\u0275restoreView(_r52);
      const undo_r53 = \u0275\u0275reference(3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.SelectCore(undo_r53));
    });
    \u0275\u0275text(11, "Undo");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "button", 138);
    \u0275\u0275listener("click", function TableComponent_div_1_ng_container_10_Template_button_click_12_listener() {
      \u0275\u0275restoreView(_r52);
      const undo_r53 = \u0275\u0275reference(3);
      return \u0275\u0275resetView(undo_r53.closeMenu());
    });
    \u0275\u0275element(13, "icon", 139);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const coref_r54 = \u0275\u0275reference(6);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("matMenuTriggerFor", coref_r54);
    \u0275\u0275advance(2);
    \u0275\u0275propertyInterpolate1("src", "../../../../../assets/icons/", ctx_r1.isCoreFile ? "pinned" : "pin", ".svg", \u0275\u0275sanitizeUrl);
  }
}
function TableComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 37);
    \u0275\u0275listener("click", function TableComponent_div_1_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewFile($event));
    })("keydown.enter", function TableComponent_div_1_Template_div_keydown_enter_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewFile($event));
    })("keydown.space", function TableComponent_div_1_Template_div_keydown_space_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.viewFile($event));
    });
    \u0275\u0275elementStart(1, "div", 38);
    \u0275\u0275template(2, TableComponent_div_1_dl_2_Template, 1, 2, "dl", 39)(3, TableComponent_div_1_dl_3_Template, 1, 3, "dl", 40)(4, TableComponent_div_1_dl_4_Template, 2, 3, "dl", 41)(5, TableComponent_div_1_ng_container_5_Template, 2, 1, "ng-container", 36)(6, TableComponent_div_1_dl_6_Template, 3, 1, "dl", 42)(7, TableComponent_div_1_dl_7_Template, 3, 1, "dl", 43)(8, TableComponent_div_1_ng_container_8_Template, 2, 1, "ng-container", 44)(9, TableComponent_div_1_dl_9_Template, 29, 16, "dl", 45)(10, TableComponent_div_1_ng_container_10_Template, 14, 3, "ng-container", 36);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275styleProp("position", "relative")("z-index", ctx_r1.enableFileDrag ? "100" : "auto");
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(17, _c13, ctx_r1.isDisabled, !ctx_r1.checkoutside))("ngStyle", \u0275\u0275pureFunctionV(20, _c2, [(ctx_r1.col.desc == null ? null : ctx_r1.col.desc.view) ? "2" : "1", (ctx_r1.col.name == null ? null : ctx_r1.col.name.view) ? "2" : "1", (ctx_r1.col.bundle == null ? null : ctx_r1.col.bundle.view) ? "65px" : "0px", (ctx_r1.col.tab == null ? null : ctx_r1.col.tab.view) ? "70px" : "0px", (ctx_r1.col.relevence == null ? null : ctx_r1.col.relevence.view) ? "65px" : "0px", (ctx_r1.col.impact == null ? null : ctx_r1.col.impact.view) ? "55px" : "0px", (ctx_r1.col.page == null ? null : ctx_r1.col.page.view) ? "55px" : "0px", (ctx_r1.col.exhibit == null ? null : ctx_r1.col.exhibit.view) ? "120px" : "0px", (ctx_r1.col.link == null ? null : ctx_r1.col.link.view) ? "100px" : "0px", (ctx_r1.col.link == null ? null : ctx_r1.col.link.view) ? "100px" : "0px", (ctx_r1.col.kind == null ? null : ctx_r1.col.kind.view) ? "55px" : "0px", (ctx_r1.col == null ? null : ctx_r1.col.remark == null ? null : ctx_r1.col.remark.view) ? "55px" : "0px", (ctx_r1.col.date == null ? null : ctx_r1.col.date.view) ? "100px" : "0px", (ctx_r1.col.extra == null ? null : ctx_r1.col.extra.view) ? "20px" : "0px"]));
    \u0275\u0275advance();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(35, _c3, ctx_r1.checkoutside ? "calc(100% - 66px)" : "calc(100% - 53px)"))("ngClass", \u0275\u0275pureFunction3(37, _c4, ctx_r1.nohover, ctx_r1.isSelected(), ctx_r1.checkoutside));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.col == null ? null : ctx_r1.col.gap == null ? null : ctx_r1.col.gap.view);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.col == null ? null : ctx_r1.col.drag == null ? null : ctx_r1.col.drag.view);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.col.order == null ? null : ctx_r1.col.order.view);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.enableFileDrag);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.col == null ? null : ctx_r1.col.star == null ? null : ctx_r1.col.star.view);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.col.index == null ? null : ctx_r1.col.index.view);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.reqcolKeys);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.col.extra == null ? null : ctx_r1.col.extra.view);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.presentDocType == "C" || ctx_r1.presentDocType == "CF");
  }
}
function TableComponent_div_2_div_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r56 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-checkbox", 149);
    \u0275\u0275listener("click", function TableComponent_div_2_div_2_ng_container_1_Template_mat_checkbox_click_1_listener($event) {
      \u0275\u0275restoreView(_r56);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown", function TableComponent_div_2_div_2_ng_container_1_Template_mat_checkbox_keydown_1_listener($event) {
      \u0275\u0275restoreView(_r56);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275twoWayListener("ngModelChange", function TableComponent_div_2_div_2_ng_container_1_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r56);
      const ctx_r1 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r1.filedetail.cIscheck, $event) || (ctx_r1.filedetail.cIscheck = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function TableComponent_div_2_div_2_ng_container_1_Template_mat_checkbox_change_1_listener($event) {
      \u0275\u0275restoreView(_r56);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.checkFile($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r1.isCopy)("ngClass", \u0275\u0275pureFunction2(3, _c17, ctx_r1.filedetail.cIscheck, ctx_r1.checkoutside));
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.filedetail.cIscheck);
  }
}
function TableComponent_div_2_div_2_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r57 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 150);
    \u0275\u0275listener("click", function TableComponent_div_2_div_2_ng_container_7_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r57);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.openFolder());
    });
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.filedetail.cName, " ");
  }
}
function TableComponent_div_2_div_2_ng_template_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r58 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "inpt", 151, 6);
    \u0275\u0275listener("valueChange", function TableComponent_div_2_div_2_ng_template_8_Template_inpt_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r58);
      const ctx_r1 = \u0275\u0275nextContext(3);
      ctx_r1.filedetail.cName = $event;
      return \u0275\u0275resetView(ctx_r1.isChange = true);
    })("keydown.enter", function TableComponent_div_2_div_2_ng_template_8_Template_inpt_keydown_enter_0_listener() {
      \u0275\u0275restoreView(_r58);
      const ctx_r1 = \u0275\u0275nextContext(3);
      ctx_r1.updateFoldername(ctx_r1.filedetail);
      return \u0275\u0275resetView(ctx_r1.editname = false);
    })("keyup.enter", function TableComponent_div_2_div_2_ng_template_8_Template_inpt_keyup_enter_0_listener() {
      \u0275\u0275restoreView(_r58);
      const ctx_r1 = \u0275\u0275nextContext(3);
      ctx_r1.updateFoldername(ctx_r1.filedetail);
      return \u0275\u0275resetView(ctx_r1.editname = false);
    })("focusout", function TableComponent_div_2_div_2_ng_template_8_Template_inpt_focusout_0_listener() {
      \u0275\u0275restoreView(_r58);
      const ctx_r1 = \u0275\u0275nextContext(3);
      ctx_r1.updateFoldername(ctx_r1.filedetail);
      return \u0275\u0275resetView(ctx_r1.editname = false);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("maxlength", 250)("value", ctx_r1.filedetail.cName ? ctx_r1.filedetail.cName : "")("showlabel", false);
  }
}
function TableComponent_div_2_div_2_dl_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r59 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "dl", 152)(1, "div", 153)(2, "button", 107);
    \u0275\u0275listener("click", function TableComponent_div_2_div_2_dl_10_Template_button_click_2_listener($event) {
      \u0275\u0275restoreView(_r59);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275element(3, "icon", 108);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-menu", 109, 25)(6, "div", 110)(7, "button", 111);
    \u0275\u0275listener("click", function TableComponent_div_2_div_2_dl_10_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r59);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.editname = !ctx_r1.editname);
    });
    \u0275\u0275element(8, "icon", 112);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 113);
    \u0275\u0275listener("click", function TableComponent_div_2_div_2_dl_10_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r59);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.getPermission());
    });
    \u0275\u0275element(10, "icon", 114);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const menu_r60 = \u0275\u0275reference(5);
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c18, ctx_r1.col.extra ? "20px" : ""));
    \u0275\u0275advance(2);
    \u0275\u0275property("matMenuTriggerFor", menu_r60);
  }
}
function TableComponent_div_2_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r55 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 143);
    \u0275\u0275template(1, TableComponent_div_2_div_2_ng_container_1_Template, 2, 6, "ng-container", 36);
    \u0275\u0275elementStart(2, "button", 144);
    \u0275\u0275listener("click", function TableComponent_div_2_div_2_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r55);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openFolder());
    });
    \u0275\u0275element(3, "icon", 145);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 121)(5, "button", 146);
    \u0275\u0275listener("click", function TableComponent_div_2_div_2_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r55);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openFolder());
    });
    \u0275\u0275element(6, "icon", 147);
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, TableComponent_div_2_div_2_ng_container_7_Template, 3, 1, "ng-container", 62)(8, TableComponent_div_2_div_2_ng_template_8_Template, 2, 3, "ng-template", null, 32, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, TableComponent_div_2_div_2_dl_10_Template, 11, 4, "dl", 148);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const folderNameEdit_r61 = \u0275\u0275reference(9);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.isIndividual && ctx_r1.cFoldertype != "ALL");
    \u0275\u0275advance(6);
    \u0275\u0275property("ngIf", !ctx_r1.editname)("ngIfElse", folderNameEdit_r61);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.col.extra["view"]);
  }
}
function TableComponent_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140);
    \u0275\u0275element(1, "div", 141);
    \u0275\u0275template(2, TableComponent_div_2_div_2_Template, 11, 4, "div", 142);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r1.filedetail.nBundledetailid);
  }
}
function TableComponent_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r62 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 154)(2, "header", 155)(3, "dl", 156)(4, "span", 157);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "dl", 158)(8, "span", 157);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(11, "div", 159);
    \u0275\u0275elementStart(12, "dl", 160)(13, "span", 157);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "div", 161)(17, "dl", 162)(18, "span", 157);
    \u0275\u0275text(19);
    \u0275\u0275pipe(20, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "span", 163);
    \u0275\u0275element(22, "icon", 164);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(23, "dl", 165)(24, "span", 157);
    \u0275\u0275text(25);
    \u0275\u0275pipe(26, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "span", 163);
    \u0275\u0275element(28, "icon", 164);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(29, "dl", 166)(30, "span", 157);
    \u0275\u0275text(31);
    \u0275\u0275pipe(32, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "span", 163);
    \u0275\u0275element(34, "icon", 164);
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(35, "div", 167)(36, "facttable", 168);
    \u0275\u0275listener("viewlink", function TableComponent_ng_container_3_Template_facttable_viewlink_36_listener($event) {
      \u0275\u0275restoreView(_r62);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewlinkEvent($event));
    })("viewFile", function TableComponent_ng_container_3_Template_facttable_viewFile_36_listener($event) {
      \u0275\u0275restoreView(_r62);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewFileEvent($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 7, "MYFILES.FILEEXPLORER.LABEL_PAGE"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(10, 9, "MYFILES.FILEEXPLORER.LABEL_LEVEL"));
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(15, 11, "MYFILES.FILEEXPLORER.LABEL_NOTE_BOX"), " ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(20, 13, "MYFILES.FILEEXPLORER.LABEL_ISSUE"), " ");
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(26, 15, "MYFILES.FILEEXPLORER.LABEL_RELEVENCE"), " ");
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(32, 17, "MYFILES.FILEEXPLORER.LABEL_IMPACT"), " ");
    \u0275\u0275advance(5);
    \u0275\u0275property("factlist", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.flinklst);
  }
}
function TableComponent_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r63 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 169)(2, "header", 155)(3, "dl", 156)(4, "span", 157);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "dl", 158)(8, "span", 157);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(11, "div", 159);
    \u0275\u0275elementStart(12, "dl", 160)(13, "span", 157);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "div", 161)(17, "dl", 162)(18, "span", 157);
    \u0275\u0275text(19);
    \u0275\u0275pipe(20, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "span", 163);
    \u0275\u0275element(22, "icon", 164);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(23, "dl", 165)(24, "span", 157);
    \u0275\u0275text(25);
    \u0275\u0275pipe(26, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "span", 163);
    \u0275\u0275element(28, "icon", 164);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(29, "dl", 166)(30, "span", 157);
    \u0275\u0275text(31);
    \u0275\u0275pipe(32, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "span", 163);
    \u0275\u0275element(34, "icon", 164);
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(35, "div", 167)(36, "facttable", 168);
    \u0275\u0275listener("viewlink", function TableComponent_ng_container_4_Template_facttable_viewlink_36_listener($event) {
      \u0275\u0275restoreView(_r63);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewlinkEvent($event));
    })("viewFile", function TableComponent_ng_container_4_Template_facttable_viewFile_36_listener($event) {
      \u0275\u0275restoreView(_r63);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewFileEvent($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 7, "MYFILES.FILEEXPLORER.LABEL_PAGE"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(10, 9, "MYFILES.FILEEXPLORER.LABEL_LEVEL"));
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(15, 11, "MYFILES.FILEEXPLORER.LABEL_NOTE_BOX"), " ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(20, 13, "MYFILES.FILEEXPLORER.LABEL_ISSUE"), " ");
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(26, 15, "MYFILES.FILEEXPLORER.LABEL_RELEVENCE"), " ");
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(32, 17, "MYFILES.FILEEXPLORER.LABEL_IMPACT"), " ");
    \u0275\u0275advance(5);
    \u0275\u0275property("factlist", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.flinklst);
  }
}
function TableComponent_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r64 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 154)(2, "header", 170)(3, "dl", 171)(4, "span", 157);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "dl", 172)(8, "span", 157);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(11, "div", 173);
    \u0275\u0275elementStart(12, "dl", 174)(13, "span", 175);
    \u0275\u0275text(14, " [ ");
    \u0275\u0275elementStart(15, "span", 176);
    \u0275\u0275text(16);
    \u0275\u0275pipe(17, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275text(18, " | ");
    \u0275\u0275elementStart(19, "span", 177);
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275text(22, " | ");
    \u0275\u0275elementStart(23, "span", 178);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275text(26, " ] ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(27, "dl", 179)(28, "span", 157);
    \u0275\u0275text(29);
    \u0275\u0275pipe(30, "translate");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(31, "div", 167)(32, "factlink", 180);
    \u0275\u0275listener("viewlink", function TableComponent_ng_container_5_Template_factlink_viewlink_32_listener($event) {
      \u0275\u0275restoreView(_r64);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewlinkEvent($event));
    })("viewFile", function TableComponent_ng_container_5_Template_factlink_viewFile_32_listener($event) {
      \u0275\u0275restoreView(_r64);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewFileEvent($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 9, "MYFILES.FILEEXPLORER.LABEL_PAGE"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(10, 11, "MYFILES.FILEEXPLORER.LABEL_LEVEL"));
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(17, 13, "MYFILES.FILEEXPLORER.LABEL_BUNDLE"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(21, 15, "MYFILES.FILEEXPLORER.LABEL_TAB"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(25, 17, "MYFILES.FILEEXPLORER.LABEL_PAGE"));
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(30, 19, "MYFILES.FILEEXPLORER.LABEL_DOC_TITLE"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("linkview", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.linkview)("flink", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.flinklst)("dlink", ctx_r1.filedetail == null ? null : ctx_r1.filedetail.dlink);
  }
}
var TableComponent = class _TableComponent {
  static {
    this.TEAM_USERS_MENU_PANEL_CLASS = "team-users-menu-panel";
  }
  static {
    this.SHARE_MENU_OPEN_DELAY_MS = 0;
  }
  static {
    this.SHARE_MENU_CLOSE_DELAY_MS = 80;
  }
  static {
    this.teamUsersCache = /* @__PURE__ */ new Map();
  }
  static {
    this.teamUsersInFlight = /* @__PURE__ */ new Map();
  }
  constructor(myfileS, cdr, dialog, cf, ss, CMS, fcs, common) {
    this.myfileS = myfileS;
    this.cdr = cdr;
    this.dialog = dialog;
    this.cf = cf;
    this.ss = ss;
    this.CMS = CMS;
    this.fcs = fcs;
    this.common = common;
    this.isMyfile = false;
    this.changeTable = new EventEmitter();
    this.emitEvent = new EventEmitter();
    this.viewlink = new EventEmitter();
    this.linkview = "";
    this.nohover = false;
    this.checkoutside = false;
    this.isIndividual = false;
    this.isShared = false;
    this.enableFileDrag = false;
    this.isLink = null;
    this.items = [
      { template: "template1", data: { name: "John Doe" } },
      { template: "template2", data: { age: 30 } }
    ];
    this.isChange = false;
    this.clickfromcheckboc = false;
    this.isDisabled = false;
    this.flink = [];
    this.dlink = [];
    this.wlink = [];
    this.factlst = [];
    this.isOCR = false;
    this.OCRmessage = "";
    this.uploadedids = [];
    this.sharedUser = [];
    this.coreFiles = [];
    this.reqcolKeys = [];
    this.isChooser = false;
    this.socketSubscription = this.ss.getUploades().subscribe((res) => this.handleSocketMessage(res));
  }
  // share icon tooltip related methods removed
  // share icon tooltip: removed onShareMenuPanelMouseEnter and onShareMenuPanelMouseLeave
  ensureTeamUsersLoaded() {
    return __async(this, null, function* () {
      const caseId = this.nCaseid;
      if (!caseId) {
        return;
      }
      const cached = _TableComponent.teamUsersCache.get(caseId);
      if (cached != null) {
        return;
      }
      if (!_TableComponent.teamUsersInFlight.has(caseId)) {
        const request2 = this.common.getMyTeamUsers(caseId).then((list2) => list2 ?? []).catch(() => []);
        _TableComponent.teamUsersInFlight.set(caseId, request2);
      }
      const request = _TableComponent.teamUsersInFlight.get(caseId) ?? Promise.resolve([]);
      const list = yield request;
      _TableComponent.teamUsersCache.set(caseId, list);
      _TableComponent.teamUsersInFlight.delete(caseId);
    });
  }
  handleSocketMessage(res) {
    const event = res?.event;
    if (!event) {
      return;
    }
    if (this.handleConvertingEvents(event, res?.data)) {
      this.cdr.detectChanges();
      return;
    }
    if (this.handleOcrEvents(event, res)) {
      this.cdr.detectChanges();
    }
  }
  handleConvertingEvents(event, data) {
    if (!MYFILES_SOCKET_CONVERTING_EVENT_LIST.includes(event)) {
      return false;
    }
    const id = data?.identifier ?? data?.nBundledetailid;
    if (id == null || id !== this.filedetail?.nBundledetailid) {
      return true;
    }
    if ([
      MYFILES_SOCKET_CONVERTING_EVENTS.PROCESS,
      MYFILES_SOCKET_CONVERTING_EVENTS.START,
      MYFILES_SOCKET_CONVERTING_EVENTS.SUCCESS
    ].includes(event) || data?.cStatus === MYFILES_CONVERSION_STATUS.PROCESSING) {
      this.filedetail.cCStatus = MYFILES_CONVERSION_STATUS.PROCESSING;
      this.filedetail.bIsconvert = true;
      return true;
    }
    if (data?.cStatus === MYFILES_CONVERSION_STATUS.INSERTING) {
      this.filedetail.cCStatus = MYFILES_CONVERSION_STATUS.INSERTING;
      this.filedetail.bIsconvert = true;
      return true;
    }
    if (event === MYFILES_SOCKET_CONVERTING_EVENTS.VERIFY_COMPLETE) {
      this.filedetail.cCStatus = MYFILES_CONVERSION_STATUS.VERIFY_SUCCESS;
      this.filedetail.bIsconvert = true;
      return true;
    }
    if ([MYFILES_SOCKET_CONVERTING_EVENTS.ERROR, MYFILES_SOCKET_CONVERTING_EVENTS.FAILED].includes(event)) {
      this.filedetail.cCStatus = MYFILES_CONVERSION_STATUS.FAILED;
      this.filedetail.bIsconvert = false;
      return true;
    }
    if (event === MYFILES_SOCKET_CONVERTING_EVENTS.FILE_INSERT_COMPLETE) {
      this.filedetail.cCStatus = MYFILES_CONVERSION_STATUS.SUCCESS;
      if (data?.converttype === MYFILES_CONVERT_TYPE.CONVERT) {
        this.filedetail.bIsconvert = false;
        this.filedetail.cFiletype = data?.cFiletype;
        this.filedetail.cName = data?.cFilename;
        this.filedetail.cPage = data?.cPage;
      }
      return true;
    }
    return true;
  }
  handleOcrEvents(event, res) {
    const fileId = this.filedetail?.nBundledetailid;
    if (event === MYFILES_SOCKET_OCR_EVENTS.START) {
      if (res?.id && res?.data?.id === fileId) {
        this.isOCR = true;
        return true;
      }
      return false;
    }
    if (event === MYFILES_SOCKET_OCR_EVENTS.PROGRESS) {
      if (res?.data?.id === fileId) {
        this.isOCR = true;
        this.OCRmessage = res?.data?.message ?? "";
        return true;
      }
      return false;
    }
    if (event === MYFILES_SOCKET_OCR_EVENTS.SUCCESS || event === MYFILES_SOCKET_OCR_EVENTS.ERROR) {
      if (res?.data?.id === fileId) {
        this.isOCR = false;
        this.OCRmessage = "";
        return true;
      }
      return false;
    }
    return false;
  }
  checkForIsCore() {
    if (this.presentDocType === "C" || this.presentDocType === "CF") {
      this.isCoreFile = !!this.coreFiles?.includes(this.filedetail?.nBundledetailid);
    }
    this.cdr.detectChanges();
  }
  ngOnInit() {
    if (this.disabledFiles?.length) {
      this.isDisabled = this.disabledFiles.includes(this.filedetail?.nBundledetailid);
    }
    this.checkForIsCore();
    this.checkEventSub();
    if (!this.reqcolKeys?.length) {
      Object.fromEntries(Object.entries(this.fcs.reqcols).filter(([key]) => {
        let cols = this.fcs.tablecols.find((e) => e.key.toLocaleLowerCase() == key);
        if (cols) {
          this.fcs.reqcols[key]["id"] = cols?.id;
          this.fcs.reqcols[key]["view"] = cols?.isshow;
          this.fcs.reqcols[key]["name"] = cols?.name;
          this.fcs.reqcols[key]["class"] = cols?.class;
          this.fcs.reqcols[key]["sortKey"] = cols?.sortKey;
          this.fcs.reqcols[key]["isEdit"] = cols?.isEdit;
          this.fcs.reqcols[key]["size"] = cols?.size;
        }
      }));
      this.col = Object.fromEntries(Object.entries(this.fcs.reqcols).filter(([key]) => key !== "relevence" && key !== "link" && key !== "impact"));
      this.reqcolKeys = Object.keys(this.col);
      this.reqcolKeys = this.fcs.customSort(this.col);
    }
  }
  ngOnDestroy() {
    this.evsubscription?.unsubscribe();
    this.socketSubscription?.unsubscribe();
  }
  checkEventSub() {
    this.evsubscription = this.CMS.functionCalled$.subscribe((data) => {
      if (data?.event === "SELECT-FILE") {
        this.uploadedids = data.nBundledetailids;
        this.isSelected();
        this.checkForIsCore();
        this.cdr.detectChanges();
      }
    });
  }
  ngOnChanges(changes) {
    if (changes["filedetail"] && !changes["filedetail"].firstChange) {
      if (this.disabledFiles?.length) {
        this.isDisabled = this.disabledFiles.includes(this.filedetail?.nBundledetailid);
      }
    }
    if (changes["changeB"]) {
      this.col["bundle"]["edit"] = false;
    }
    this.isConvertallow();
    this.checkForIsCore();
    this.cdr.detectChanges();
  }
  openFolder() {
    this.emitEvent.emit({ event: "OPEN_FOLDER", data: { nBundleid: this.filedetail.nBundleid, cName: this.filedetail.cName } });
  }
  checkFile(event) {
    this.clickfromcheckboc = true;
    this.filedetail.cIscheck = event.checked;
    this.emitEvent.emit({ event: "SELECTED", data: { cIscheck: this.filedetail.cIscheck } });
    setTimeout(() => {
      this.clickfromcheckboc = false;
    }, 100);
  }
  changeBundle(bundle) {
    this.changeTable.emit("EDIT_BUNDLE_" + bundle);
  }
  updateFileData(x, el, event) {
    return __async(this, null, function* () {
      if (!this.isChange) {
        return;
      }
      ;
      this.isChange = false;
      const mdl = {
        nBundledetailid: x.nBundledetailid,
        cTab: (x.cTab ?? "").trim(),
        cExhibitno: (x.cExhibitno ?? "").trim(),
        cFilename: (x.cName ?? "").trim(),
        cDescription: (x.cDescription ?? "").trim(),
        dIntrestDt: (x.dIntrestDt ?? "").trim(),
        cAuthor: (x.cAuthor ?? "").trim()
      };
      const res = yield this.myfileS.updateBundle(mdl);
      if (res) {
        if (event)
          event.input.nativeElement.blur();
      }
      ;
      this.cdr.detectChanges();
    });
  }
  updateFoldername(x) {
    return __async(this, null, function* () {
      const mdl = {
        nBundleid: x.nBundleid,
        nParentBundleid: x.nParentBundleid || null,
        nCaseid: this.nCaseid,
        nSectionid: this.nSectionid || null,
        cBundlename: x.cName,
        permission: "E"
      };
      let res = yield this.myfileS.bundleBuilder(mdl);
      if (res) {
        this.editname = false;
        this.changeTable.emit("RENAME-BUNDLE");
      }
    });
  }
  updateTabRef(x) {
    return __async(this, null, function* () {
      this.changeTable.emit("EDIT_TAB_" + (x.cTab ? x.cTab : "").trim());
    });
  }
  getPermission() {
    this.changeTable.emit("PERMISSION");
  }
  getShare() {
    this.changeTable.emit("SHARE");
  }
  deleteBundleReq() {
    this.changeTable.emit("DELETE");
  }
  viewFileDB(event) {
    clearTimeout(this.clickTimeout);
    const pageRange = this.filedetail?.cPageRange;
    const startPageText = pageRange?.split("-")?.[0] ?? "";
    const parsed = Number.parseInt(startPageText, 10);
    const nPage = Number.isFinite(parsed) ? parsed : 1;
    if (this.isLink) {
      this.changeTable.emit("VIEW");
      return;
    }
    if (this.isMyfile) {
      this.cf.openHyperLinkFile(this.filedetail.nBundledetailid, this.nCaseid, null, null, this.filedetail.cIsindex, nPage);
      return;
    }
    this.openDocumentInChooser(this.filedetail);
  }
  openDocumentInChooser(x) {
    return __async(this, null, function* () {
      this.emitEvent.emit({ event: "OPEN-DOCUMENT", data: { nBundledetailid: x.nBundledetailid } });
    });
  }
  viewFile(event) {
    clearTimeout(this.clickTimeout);
    this.clickTimeout = setTimeout(() => {
      if (this.uploadedids.length) {
        let indx = this.uploadedids.findIndex((e) => e == this.filedetail.nBundledetailid);
        if (indx > -1) {
          this.uploadedids.splice(indx, 1);
        }
      }
      if (this.clickfromcheckboc)
        return;
      if (this.isDisabled)
        return;
      this.changeTable.emit("VIEW");
    }, 250);
  }
  HyperLinkFile(mode, type, isDeep) {
    this.viewlink.emit({ "event": "HYPERLINK", nBundledetailid: this.filedetail.nBundledetailid, mode, cKeeptype: type, cIsindex: this.filedetail.cIsindex, isDeep });
  }
  dragStarted(event) {
    this.changeTable.emit("DRAG-START");
  }
  pagination(x) {
    this.changeTable.emit("PAGINATION");
  }
  isUpdate_batchprocess(x) {
    return this.filedetail?.updateCols?.includes(x.dbkey) ?? false;
  }
  isSelected() {
    const fileId = this.filedetail?.nBundledetailid;
    return !!(this.cf.viewlist?.some((e) => e.nBundledetailid == fileId) || this.uploadedids?.includes(fileId));
  }
  checkTruncate(parent, child) {
    if (child.offsetWidth > parent.offsetWidth) {
      child.classList.add("truncated");
    } else {
      child.classList.remove("truncated");
    }
  }
  viewLink(flag) {
    return __async(this, null, function* () {
      if (this.filedetail?.linkview == flag) {
        this.filedetail.linkview = "";
        this.emitEvent.emit({ event: "VIEW-LINK", data: { linkview: "" } });
        this.cdr.detectChanges();
        return;
      }
      this.filedetail.linkview = this.filedetail?.linkview == flag ? "" : flag;
      if (flag == "F") {
        this.viewlink.emit({ "event": "VIEWFACT", data: "" });
      } else if (flag == "QF") {
        this.viewlink.emit({ "event": "VIEWQFACT", data: "" });
      }
      const fileId = this.filedetail?.nBundledetailid;
      if (!fileId) {
        return;
      }
      if (["DL", "WL", "FL", "F", "QF"].includes(flag)) {
        const res = yield this.myfileS.getFilelinks(fileId, flag);
        const first = res?.[0];
        if (flag == "DL") {
          this.filedetail.dlink = first;
        } else if (flag == "WL") {
          this.filedetail.wlink = first;
        } else {
          this.filedetail.flinklst = first;
        }
      }
      this.cdr.detectChanges();
    });
  }
  isConvertallow() {
    let type = this.filedetail.cFiletype;
    if (type && ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "bmp", "gif", "tiff", "zip", "msg"]?.includes(type.toLowerCase())) {
      this.filedetail.bIsconvert = true;
      return;
    }
    this.filedetail.bIsconvert = false;
  }
  convertBundleReq(event) {
    this.myfileS.convertFile(this.filedetail.nBundledetailid, this.nCaseid).then((res) => {
      if (res) {
        this.filedetail.bIsconvert = false;
        this.cdr.detectChanges();
      }
    });
  }
  ocrFileReq(nOcrtype) {
    this.isOCR = true;
    this.myfileS.ocrFile(this.filedetail.nBundledetailid, nOcrtype).then((res) => {
      if (res) {
        this.filedetail.bIsconvert = false;
        this.cdr.detectChanges();
      }
    });
  }
  viewSharedUser(sh) {
    if (this.filedetail?.share) {
      if (!this.sharedUser?.length) {
        this.myfileS.getSharedUser(this.filedetail.nBundledetailid).then((res) => {
          if (res) {
            sh.openMenu();
            this.sharedUser = res;
            this.cdr.detectChanges();
          }
        });
        return;
      }
      sh.openMenu();
    }
  }
  SelectCore(menu) {
    this.isCoreFile = !this.isCoreFile;
    if (this.isCoreFile) {
      menu.openMenu();
      setTimeout(() => {
        menu.closeMenu();
      }, 3e3);
      if (!this.coreFiles?.includes(this.filedetail.nBundledetailid)) {
        this.coreFiles.push(this.filedetail.nBundledetailid);
      }
    } else {
      const ind = this.coreFiles.findIndex((e) => e == this.filedetail.nBundledetailid);
      this.coreFiles.splice(ind, 1);
      menu.closeMenu();
    }
    this.cdr.detectChanges();
  }
  viewlinkEvent(event) {
    this.viewlink.emit(event);
  }
  starFile(file) {
    file.bIsStar = !file.bIsStar;
  }
  clicktruncate(elm) {
    let elmclone = elm.cloneNode(true);
    let parent = elm.parentElement;
    elmclone.style.width = "fit-content";
    elmclone.style.position = "absolute";
    elmclone.style.visibility = "hidden";
    elmclone.style.whiteSpace = "nowrap";
    parent.appendChild(elmclone);
    if (elmclone.clientWidth > parent.clientWidth) {
      elmclone.remove();
      return true;
    }
    return false;
  }
  viewFileEvent(event) {
    this.changeTable.emit(event);
  }
  hyperlink(filedetail) {
    const dialogRef = this.dialog.open(HyperLinkFolderComponent, {
      width: "596px",
      height: "fit-content",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: {
        cName: filedetail.cName
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.HyperLinkFile(result.linkType, result.type, result.isDeep);
      }
    });
  }
  static {
    this.\u0275fac = function TableComponent_Factory(t) {
      return new (t || _TableComponent)(\u0275\u0275directiveInject(MyfileService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(FilecolumnService), \u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TableComponent, selectors: [["app-table"]], inputs: { isMyfile: "isMyfile", col: "col", filedetail: "filedetail", changeF: "changeF", changeB: "changeB", disabledFiles: "disabledFiles", isCopy: "isCopy", nCaseid: "nCaseid", nSectionid: "nSectionid", index: "index", nohover: "nohover", checkoutside: "checkoutside", isIndividual: "isIndividual", isShared: "isShared", cutCopyType: "cutCopyType", cFoldertype: "cFoldertype", enableFileDrag: "enableFileDrag", isLink: "isLink", presentDocType: "presentDocType", coreFiles: "coreFiles", bShowPresentHistory: "bShowPresentHistory", reqcolKeys: "reqcolKeys", isChooser: "isChooser" }, outputs: { changeTable: "changeTable", emitEvent: "emitEvent", viewlink: "viewlink" }, standalone: true, features: [\u0275\u0275ProvidersFeature([MyfileService]), \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 6, vars: 8, consts: [["bundleEdit", ""], ["bundleDash", ""], ["tabEdit", ""], ["tabDash", ""], ["tab", ""], ["nameEdit", ""], ["name", ""], ["share", "matMenu"], ["sh", "matMenuTrigger"], ["pageOther", ""], ["pageEdit", ""], ["exhibitEdit", ""], ["exhibitDash", ""], ["exhibit", ""], ["authorEdit", ""], ["authorDash", ""], ["author", ""], ["kindLoading", ""], ["dateEdit", ""], ["dateDash", ""], ["date", ""], ["descEdit", ""], ["descDash", ""], ["overflow", "overflowCheck"], ["desc", ""], ["menu", "matMenu"], ["t", "matMenuTrigger"], ["delete", "matMenu"], ["ocrAction", ""], ["ocrfile", "matMenu"], ["undo", "matMenuTrigger"], ["coref", "matMenu"], ["folderNameEdit", ""], [1, "my-2.5", 3, "ngClass"], ["class", "relative my-2 cursor-pointer files-wrapper  group ", 3, "ngClass", "ngStyle", "position", "z-index", "click", "keydown.enter", "keydown.space", 4, "ngIf"], ["class", "group flex items-center h-8 relative  pe-2.5", 4, "ngIf"], [4, "ngIf"], [1, "relative", "my-2", "cursor-pointer", "files-wrapper", "group", 3, "click", "keydown.enter", "keydown.space", "ngClass", "ngStyle"], [1, "body", "group", "w-full", "pe-5", "[&>dl]:z-20", "[&>dl]:flex", "[&>dl]:h-8", "[&>dl]:items-center", "relative", 3, "ngStyle", "ngClass"], ["class", "gap-col !bg-transparent", 3, "class", 4, "ngIf"], ["class", "drag !bg-transparent absolute left-3 text-blue-on opacity-0 group-hover:opacity-100", 3, "ngStyle", 4, "ngIf"], ["class", "order", 3, "ngStyle", 4, "ngIf"], ["class", "star", 4, "ngIf"], ["class", "relative bundle group", 4, "ngIf"], [4, "ngFor", "ngForOf"], ["class", "extra rounded-e-full", 3, "ngStyle", 4, "ngIf"], [1, "gap-col", "!bg-transparent"], [1, "drag", "!bg-transparent", "absolute", "left-3", "text-blue-on", "opacity-0", "group-hover:opacity-100", 3, "ngStyle"], [1, "order", 3, "ngStyle"], ["class", "justify-center opacity-0 input pe-2.5 group-hover:opacity-100", 3, "class", "ngClass", "ngStyle", 4, "ngIf"], [1, "justify-center", "opacity-0", "input", "pe-2.5", "group-hover:opacity-100", 3, "ngClass", "ngStyle"], [1, "example-margin", 3, "click", "keydown", "ngModelChange", "change", "ngClass", "disabled", "ngModel"], [1, "star"], ["type", "button", "aria-label", "Star", 3, "click"], ["type", "present", 1, "text-lg", 3, "name"], [1, "relative", "bundle", "group"], [1, "px-2", "text-xs"], ["class", "relative group", 3, "ngClass", "ngStyle", 4, "ngIf"], [1, "relative", "group", 3, "ngClass", "ngStyle"], [3, "ngSwitch"], [4, "ngSwitchCase"], [1, "flex", "items-center", "w-full"], [4, "ngIf", "ngIfElse"], [1, "block", "truncate"], [1, "ps-2"], ["inptclas", "!rounded-none !px-1 !py-1 !bg-blue-deactivate border-none", 1, "me-1.5", "my-auto", 3, "click", "keydown", "valueChange", "keyup.enter", "focusout", "maxlength", "value", "showlabel"], [1, "block", "w-full", "h-4", 3, "value"], ["mode", "outlined", "square", "", "issmall", "", "class", "me-2 relative z-50", 3, "active", "click", "keydown.enter", "keydown.space", 4, "ngIf"], [1, "block", "h-4", "relative", 3, "dblclick", "ngClass", "value"], ["class", "relative z-50 ocrloader group/ocr w-fit", 4, "ngIf"], ["mode", "outlined", "square", "", "issmall", "", 1, "me-2", "relative", "z-50", 3, "click", "keydown.enter", "keydown.space", "active"], ["name", "Qfact", "type", "indicn"], ["name", "fact", "type", "indicn"], [1, "relative", "z-50", "ocrloader", "group/ocr", "w-fit"], [1, "absolute", "text-xxs", "w-fit", "whitespace-nowrap", "hidden", "bg-black", "text-white", "p-0.5", "left-5", "-top-0.5", "z-50", "rounded-md", "group-hover/ocr:block"], [1, "p-2"], ["inptclas", "!rounded-none !px-1 !py-1 !bg-blue-deactivate border-none", 1, "me-1.5", "my-auto", "w-full", 3, "click", "keydown", "valueChange", "keyup.enter", "focusout", "value", "maxlength", "showlabel"], [1, "w-fit"], ["class", "p-2 bg-white", 4, "ngIf"], ["mode", "outlined", "square", "", "issmall", "", 1, "me-2", 3, "click", "keydown.enter", "keydown.space", "matMenuTriggerFor"], ["name", "share", "type", "extra"], [1, "p-2", "bg-white"], ["size", "lg", 1, "cursor-pointer", 3, "detail", "matTooltip"], [1, "flex", "items-center", "w-full", 3, "click", "keydown"], ["class", "ms-1.5", 4, "ngIf"], [1, "flex", "items-center", "gap-2"], ["type", "button", "class", "flex items-center justify-center border rounded-full size-5", 3, "ngClass", "click", 4, "ngIf"], [1, "ms-1.5"], ["type", "button", 1, "flex", "items-center", "justify-center", "border", "rounded-full", "size-5", 3, "click", "ngClass"], ["name", "factOut", "type", "indicn", 1, "text-xxs"], ["name", "doclink", "type", "indicn", 1, "text-xxs"], ["width", "16", "src", "assets/icons/loaderdark.svg", "alt", "Loading"], ["class", "me-1.5 my-auto !pointer-events-auto", "inptclas", "!pointer-events-auto", "inptclas", "!px-1 !py-1 ", 3, "readonly", "value", "showlabel", "click", "keydown", 4, "ngIf"], ["inptclas", "!pointer-events-auto", "inptclas", "!px-1 !py-1 ", 1, "me-1.5", "my-auto", "!pointer-events-auto", 3, "click", "keydown", "readonly", "value", "showlabel"], ["truncateTooltip", "", "truncateClass", "truncatedot", "matTooltipShowDelay", "200", 1, "relative", "w-full", "h-4", "overflow-hidden", "break-all", "pe-3", 3, "tooltipText"], [1, "ps-3"], ["inptclas", "!rounded-none !px-1 !py-1 !bg-blue-deactivate border-none", 1, "me-1.5", "my-auto", "w-full", 3, "click", "keydown", "valueChange", "keyup.enter", "focusout", "value", "showlabel"], ["width", "16", "src", "assets/icons/loaderdark.svg", "alt", ""], [1, "flex", "items-center"], [1, "block", "text-center", "truncate", "ps-2"], [1, "block", "truncate", "ps-4"], ["inptclas", "!rounded-none !px-1 !py-1 !bg-blue-deactivate border-none", 1, "me-1.5", "my-auto", "w-full", 3, "click", "valueChange", "keydown.enter", "keyup.enter", "focusout", "value", "showlabel"], ["overflowCheck", "", 1, "text-xxs", "block", "max-h-8", "relative", "overflow-hidden", "w-full", "break-words", "!leading-4"], ["matTooltipShowDelay", "200", "class", "absolute right-0 underline bg-white cursor-pointer bottom-px", 3, "matTooltip", 4, "ngIf"], ["matTooltipShowDelay", "200", 1, "absolute", "right-0", "underline", "bg-white", "cursor-pointer", "bottom-px", 3, "matTooltip"], ["inptclas", "py-1", 1, "w-full", "mx-2", "my-auto", 3, "click", "valueChange", "keydown.enter", "keyup.enter", "focusout", "value", "maxlength", "showlabel"], [1, "extra", "rounded-e-full", 3, "ngStyle"], ["type", "button", 1, "p-2", "rotate-90", "cursor-pointer", "group/icon", 3, "click", "matMenuTriggerFor"], ["name", "menu", 1, "group-hover/icon:text-blue-on"], [1, "flex", "px-4", "!rounded-full", "!w-fit", "-mt-5"], [1, "flex", "items-center", "gap-2", "min-w-fit"], ["type", "button", "matTooltip", "Edit", 1, "p-2", 3, "click"], ["name", "edit", 1, "hover:text-blue-on"], ["type", "button", "matTooltip", "Permission", 1, "p-2", 3, "click"], ["name", "userfill", 1, "hover:text-blue-on"], ["type", "button", "matTooltip", "Hyperlink", 1, "p-2", 3, "click"], ["name", "hyperlink", "type", "adminicn", 1, "hover:text-blue-on"], ["type", "button", "matTooltip", "Delete", 1, "p-2", 3, "click", "matMenuTriggerFor"], ["name", "delete", 1, "hover:text-blue-on"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "text-xs", "text-white", "min-w-64"], [1, "flex", "gap-2"], [3, "click", "keydown.enter", "keydown.space"], ["mode", "dark"], ["class", "relative z-50 leading-4 ocrloader group/ocr w-fit", 4, "ngIf", "ngIfElse"], [1, "relative", "z-50", "leading-4", "ocrloader", "group/ocr", "w-fit"], ["type", "button", "matTooltip", "OCR", 1, "p-2", "cursor-pointer", 3, "click", "matMenuTriggerFor"], ["name", "ocr", "type", "extra"], ["xPosition", "before", 1, "!bg-white", "p-5", "!min-w-[420px]", "rounded-base"], [1, "mb-6", "text-xs", "min-w-64"], ["mode", "outlined"], [1, "group", "absolute", "-right-4"], ["type", "button", 3, "click", "matMenuTriggerFor"], ["alt", "Core file pin", 3, "src"], ["xPosition", "after", "yPosition", "above", "hasBackdrop", "false", 1, "flex", "p-0", "overflow-visible", "!rounded-base", "!w-fit", "!min-w-fit", "!bg-[#F6FBFF]", "ms-10", "me-10", "-mb-10"], [1, "border-l-8", "flex", "items-center", "border-blue-on", "gap-5", "w-[310px]", "h-15", "pe-3"], [1, "text-xs", "text-blue-on", "font-semibold", "mx-auto"], ["mode", "white", "addcls", "!text-blue-on", 3, "click", "keydown.enter", "keydown.space"], ["type", "button", 1, "pe-3", "text-blue-on", "text-xs", 3, "click"], ["name", "close", 1, "text-xs"], [1, "group", "flex", "items-center", "h-8", "relative", "pe-2.5"], [1, "w-[62px]", "flex", "items-center", "justify-center"], ["class", " w-full pe-3 h-full ps-3.5  static titleN bold  rounded-base bg-white gap-1.5 flex items-center cursor-pointer group-hover:shadow-[0px_0px_5px_1px_#0040ff80]", 4, "ngIf"], [1, "w-full", "pe-3", "h-full", "ps-3.5", "static", "titleN", "bold", "rounded-base", "bg-white", "gap-1.5", "flex", "items-center", "cursor-pointer", "group-hover:shadow-[0px_0px_5px_1px_#0040ff80]"], ["type", "button", 1, "rotate-180", "text-[11px]", 3, "click"], ["name", "chvy", 1, "text-[11px]"], ["type", "button", 1, "-mt-px", "text-base", "ps-2", 3, "click"], ["name", "folder", 1, "text-base"], ["class", "flex items-center gap-2 opacity-0 min-w-fit group-hover:opacity-100 ms-auto extra rounded-e-full", 3, "ngStyle", 4, "ngIf"], [1, "opacity-0", "group-hover:opacity-100", 3, "click", "keydown", "ngModelChange", "change", "disabled", "ngClass", "ngModel"], ["type", "button", 1, "text-xs", "text-overflow", "d-block", "text-left", 3, "click"], ["inptclas", "!rounded-none !px-1 !py-1 !bg-blue-deactivate border-none", 1, "me-1.5", "my-auto", "w-full", 3, "valueChange", "keydown.enter", "keyup.enter", "focusout", "maxlength", "value", "showlabel"], [1, "flex", "items-center", "gap-2", "opacity-0", "min-w-fit", "group-hover:opacity-100", "ms-auto", "extra", "rounded-e-full", 3, "ngStyle"], [1, "flex", "items-center", "gap-2", "opacity-0", "min-w-fit", "group-hover:opacity-100", "ms-auto"], [1, "ms-11", "me-5", "sticky", "sort-table-wrapper", "top-8", "z-[99]", "bg-faint", "border-t-4", "border-grey", "py-2", "px-2.5"], [1, "header", "mb-0", "sortheader", "flex", "w-full", "rounded-full", "text-grey", "px-3", "bg-white", "[&>dl]:py-0.5", "[&>dl]:text-xxs", "sticky", "top-0", "z-[99]"], [1, "relative", "flex", "items-center", "cursor-pointer", "bundle", "group/head"], [1, "relative", "z-10"], [1, "relative", "flex", "items-center", "cursor-pointer", "tab", "group/head"], [1, "w-px", "h-auto", "mx-5", "my-1", "bg-grey/25"], [1, "relative", "flex", "items-center", "w-full", "cursor-pointer", "group/head"], [1, "flex"], [1, "relative", "links", "group/head", "hover:text-white"], [1, "bg-black", "top-0.5", "items-center", "h-5/6", "pe-2", "absolute", "rounded-full", "w-full", "z-0", "me-2", "-translate-x-2", "hidden", "group-hover/head:flex"], ["name", "sort", "type", "extra", 1, "text-[8px]", "ms-auto"], [1, "relative", "relevence", "group/head", "hover:text-white"], [1, "relative", "impact", "group/head", "hover:text-white"], [1, "ps-11", "pe-5"], [3, "viewlink", "viewFile", "factlist"], [1, "ms-11", "me-5", "sticky", "sort-table-wrapper", "top-8", "z-[99]", "bg-reply", "border-t-4", "border-grey", "py-2", "px-2.5"], [1, "header", "sortheader", "w-full", "rounded-full", "text-grey", "px-3", "bg-white", "[&>dl]:py-0.5", "[&>dl]:text-xxs"], [1, "bundle", "relative", "group/head", "flex", "items-center", "cursor-pointer"], [1, "tab", "relative", "group/head", "flex", "items-center", "cursor-pointer"], [1, "w-px", "bg-grey/25", "mx-5", "my-1", "h-auto"], [1, "links", "relative", "group/head"], [1, "relative", "z-10", "flex", "items-center", "gap-1"], [1, "gBundle", "inline-flex", "text-center"], [1, "gTab", "inline-flex", "text-center"], [1, "gPage", "inline-flex", "text-center"], [1, "w-full", "relative", "flex", "items-center", "cursor-pointer", "group/head"], [3, "viewlink", "viewFile", "linkview", "flink", "dlink"]], template: function TableComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 33);
        \u0275\u0275template(1, TableComponent_div_1_Template, 11, 41, "div", 34)(2, TableComponent_div_2_Template, 3, 1, "div", 35);
        \u0275\u0275elementEnd();
        \u0275\u0275template(3, TableComponent_ng_container_3_Template, 37, 19, "ng-container", 36)(4, TableComponent_ng_container_4_Template, 37, 19, "ng-container", 36)(5, TableComponent_ng_container_5_Template, 33, 21, "ng-container", 36);
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(6, _c03, ctx.presentDocType == "CF" || ctx.presentDocType == "C"));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.filedetail.nBundledetailid);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.filedetail.nBundledetailid);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.filedetail.linkview == "F" && (ctx.filedetail == null ? null : ctx.filedetail.flinklst == null ? null : ctx.filedetail.flinklst.length));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.filedetail.linkview == "QF" && (ctx.filedetail == null ? null : ctx.filedetail.flinklst == null ? null : ctx.filedetail.flinklst.length));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.filedetail == null ? null : ctx.filedetail.linkview) == "FL" && (ctx.filedetail == null ? null : ctx.filedetail.flinklst == null ? null : ctx.filedetail.flinklst.length) || (ctx.filedetail == null ? null : ctx.filedetail.linkview) == "DL" && (ctx.filedetail == null ? null : ctx.filedetail.dlink.length));
      }
    }, dependencies: [
      ScrollingModule,
      FormsModule,
      NgControlStatus,
      NgModel,
      CommonModule,
      NgClass,
      NgForOf,
      NgIf,
      NgStyle,
      NgSwitch,
      NgSwitchCase,
      IconComponent,
      MatCheckboxModule,
      MatCheckbox,
      DragDropModule,
      InputComponent,
      MatMenuModule,
      MatMenu,
      MatMenuTrigger,
      MatTooltipModule,
      MatTooltip,
      ButtonComponent,
      TextFieldModule,
      FacttableComponent,
      FactlinktableComponent,
      AvatarComponent,
      MatFormFieldModule,
      MatSelectModule,
      TruncateTooltipDirective,
      OverflowCheckDirective,
      TabletruncComponent,
      TranslateModule,
      TranslatePipe
    ], styles: ['\n\n.files-wrapper[_ngcontent-%COMP%] {\n  --drag: 0px;\n  --order: 0px;\n  --checkbox: 0px;\n  --bundle: 65px;\n  --tab: 70px;\n  --links: 0px;\n  --impact: 0px;\n  --relevence: 0px;\n  --pagination: 55px;\n  --exhibit: 120px;\n  --kind: 55px;\n  --reamrk: 55px;\n  --doi: 100px;\n  --extra: 20px;\n  --name: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--reamrk) + var(--doi) + var(--exhibit) + var(--extra));\n  --desc: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--reamrk) + var(--doi) + var(--exhibit) + var(--extra));\n  --hasname: 2;\n  --hasdesc: 2;\n  --nameShare: calc((var(--hasdesc) - 1) * 0.66 + (2 - var(--hasdesc)) * 1);\n  --descShare: calc((var(--hasname) - 1) * 0.34 + (2 - var(--hasname)) * 1);\n  --activewidth: calc(100% - 69px);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%] {\n  display: inline-flex;\n  font-size: 12px;\n  font-weight: 500;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]:not(header, .nohover)[_ngcontent-%COMP%]:hover::after, .files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]:not(header, .nohover).active[_ngcontent-%COMP%]::after, .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]:not(header, .nohover)[_ngcontent-%COMP%]:hover::after, .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]:not(header, .nohover).active[_ngcontent-%COMP%]::after {\n  content: "";\n  position: absolute;\n  background: rgb(255, 255, 255);\n  width: var(--activewidth);\n  border-radius: 12px;\n  height: 100%;\n  margin-right: 10px;\n  right: 0;\n  z-index: 10;\n  pointer-events: none;\n  box-shadow: 0px 0px 5px 1px rgba(0, 64, 255, 0.501);\n}\n.files-wrapper[_ngcontent-%COMP%]   header.ismyfiles[_ngcontent-%COMP%]:not(header, .nohover)[_ngcontent-%COMP%]:hover::after, .files-wrapper[_ngcontent-%COMP%]   header.ismyfiles[_ngcontent-%COMP%]:not(header, .nohover).active[_ngcontent-%COMP%]::after, .files-wrapper[_ngcontent-%COMP%]   .body.ismyfiles[_ngcontent-%COMP%]:not(header, .nohover)[_ngcontent-%COMP%]:hover::after, .files-wrapper[_ngcontent-%COMP%]   .body.ismyfiles[_ngcontent-%COMP%]:not(header, .nohover).active[_ngcontent-%COMP%]::after {\n  margin-right: 20px;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%] {\n  width: var(--drag);\n  min-width: var(--drag);\n  max-width: var(--drag);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%] {\n  width: var(--order);\n  min-width: var(--order);\n  max-width: var(--order);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%] {\n  width: var(--checkbox);\n  min-width: var(--checkbox);\n  max-width: var(--checkbox);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%] {\n  width: var(--bundle);\n  min-width: var(--bundle);\n  max-width: var(--bundle);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%] {\n  width: var(--tab);\n  min-width: var(--tab);\n  max-width: var(--tab);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%] {\n  width: var(--links);\n  min-width: var(--links);\n  max-width: var(--links);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%] {\n  width: var(--impact);\n  min-width: var(--impact);\n  max-width: var(--impact);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%] {\n  width: var(--relevence);\n  min-width: var(--relevence);\n  max-width: var(--relevence);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%] {\n  width: var(--pagination);\n  min-width: var(--pagination);\n  max-width: var(--pagination);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%] {\n  width: var(--exhibit);\n  min-width: var(--exhibit);\n  max-width: var(--exhibit);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {\n  width: var(--kind);\n  min-width: var(--kind);\n  max-width: var(--kind);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%] {\n  width: var(--doi);\n  min-width: var(--doi);\n  max-width: var(--doi);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {\n  width: var(--extra);\n  min-width: var(--extra);\n  max-width: var(--extra);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {\n  max-width: calc((100% - var(--name)) * var(--nameShare));\n  min-width: 240px;\n  flex: 2 1 0;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%] {\n  flex: 1 1 0;\n  max-width: calc((100% - var(--desc)) * var(--descShare));\n  min-width: 180px;\n}\n.truncatedot[_ngcontent-%COMP%]::after {\n  content: "....";\n  position: absolute;\n  right: 0.5rem;\n  top: 0;\n  background: #fff;\n}\n@keyframes _ngcontent-%COMP%_progress {\n  0% {\n    stroke-dasharray: 0 100;\n  }\n}\n#progress-circle[_ngcontent-%COMP%] {\n  --tw-ring-color: #3b82f6;\n  clip: rect(0, auto, auto, 50%);\n  animation: _ngcontent-%COMP%_progress 2s linear forwards;\n}\n.progress[_ngcontent-%COMP%] {\n  stroke-dasharray: calc(var(--progress) * 100) 100;\n}\n.ocrloader1[_ngcontent-%COMP%] {\n  width: 14px;\n  height: 16px;\n  display: inline-block;\n  position: relative;\n  color: #ff6a00;\n  border: 1px solid;\n  box-sizing: border-box;\n  animation: _ngcontent-%COMP%_fill 2s linear infinite alternate;\n}\n.ocrloader1[_ngcontent-%COMP%]::after {\n  content: "OCR";\n  font-size: 5px;\n  position: absolute;\n  color: white;\n  top: 0;\n  left: 1px;\n  line-height: 15px;\n}\n@keyframes _ngcontent-%COMP%_fill {\n  0% {\n    box-shadow: 0 0 inset;\n  }\n  100% {\n    box-shadow: 0 -14px inset;\n  }\n}\n.ocrloader[_ngcontent-%COMP%] {\n  display: block;\n  position: relative;\n  height: 16px;\n  border: 1px solid #dfdfdf;\n  width: 17px;\n  background: #fafafa;\n  box-sizing: border-box;\n  font-size: 6px;\n  text-align: center;\n  font-weight: bold;\n}\n.ocrloader[_ngcontent-%COMP%]:before {\n  content: "";\n  position: absolute;\n  left: 0;\n  bottom: -2px;\n  width: 2px;\n  height: 20px;\n  background: #FF3D00;\n  animation: _ngcontent-%COMP%_ballbns 1s ease-in-out infinite alternate;\n}\n@keyframes _ngcontent-%COMP%_ballbns {\n  0% {\n    left: -10%;\n    transform: translateX(0%);\n  }\n  100% {\n    left: 110%;\n    transform: translateX(-100%);\n  }\n}\n.sort-table-wrapper[_ngcontent-%COMP%] {\n  --drag: 0px;\n  --order: 0px;\n  --checkbox: 30px;\n  --bundle: 65px;\n  --tab: 50px;\n  --links: 160px;\n  --impact: 60px;\n  --relevence: 100px;\n  --pagination: 55px;\n  --exhibit: 75px;\n  --kind: 55px;\n  --doi: 100px;\n  --extra: 20px;\n  --name: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --desc: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n  --hasname: 2;\n  --hasdesc: 2;\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%] {\n  display: inline-flex;\n  font-size: 10px;\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%] {\n  width: var(--drag);\n  min-width: var(--drag);\n  max-width: var(--drag);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%] {\n  width: var(--order);\n  min-width: var(--order);\n  max-width: var(--order);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%] {\n  width: var(--checkbox);\n  min-width: var(--checkbox);\n  max-width: var(--checkbox);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%] {\n  width: var(--bundle);\n  min-width: var(--bundle);\n  max-width: var(--bundle);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%] {\n  width: var(--tab);\n  min-width: var(--tab);\n  max-width: var(--tab);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%] {\n  width: var(--links);\n  min-width: var(--links);\n  max-width: var(--links);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%] {\n  width: var(--impact);\n  min-width: var(--impact);\n  max-width: var(--impact);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%] {\n  width: var(--relevence);\n  min-width: var(--relevence);\n  max-width: var(--relevence);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%] {\n  width: var(--pagination);\n  min-width: var(--pagination);\n  max-width: var(--pagination);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%] {\n  width: var(--exhibit);\n  min-width: var(--exhibit);\n  max-width: var(--exhibit);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {\n  width: var(--kind);\n  min-width: var(--kind);\n  max-width: var(--kind);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%] {\n  width: var(--doi);\n  min-width: var(--doi);\n  max-width: var(--doi);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {\n  width: var(--extra);\n  min-width: var(--extra);\n  max-width: var(--extra);\n}\n.sort-table-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .sort-table-wrapper[_ngcontent-%COMP%]   .factbody[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {\n  max-width: calc(100% - var(--name));\n  min-width: 100px;\n  flex: 1;\n}\n.gBundle[_ngcontent-%COMP%] {\n  width: 40px;\n  justify-content: center;\n  align-items: center;\n}\n.gTab[_ngcontent-%COMP%], .gPage[_ngcontent-%COMP%] {\n  width: 30px;\n  justify-content: center;\n  align-items: center;\n}\n.sortheader[_ngcontent-%COMP%]   dl[_ngcontent-%COMP%]:last-child {\n  border-bottom-right-radius: 10px !important;\n  border-top-right-radius: 10px !important;\n}\n/*# sourceMappingURL=table.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TableComponent, { className: "TableComponent", filePath: "src\\app\\shared\\components\\myfiles\\table\\table.component.ts", lineNumber: 56 });
})();

export {
  TableComponent
};
//# sourceMappingURL=chunk-THUBSABM.js.map
