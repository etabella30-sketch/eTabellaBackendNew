import {
  NgScrollReached
} from "./chunk-WCB6QNSW.js";
import {
  NgScrollbar,
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import {
  SkeletonComponent
} from "./chunk-KEJC4ZXM.js";
import {
  AdmindashboardService
} from "./chunk-M6VP2S2H.js";
import {
  ProfileComponent
} from "./chunk-X5G7CPYH.js";
import "./chunk-ZC2EPQ66.js";
import "./chunk-ZLDLJ4OJ.js";
import "./chunk-2BPOYM2X.js";
import "./chunk-GNZXOHZW.js";
import "./chunk-XIPFTUTL.js";
import "./chunk-62ZTKIF6.js";
import "./chunk-SD32Y426.js";
import "./chunk-55ITPE7H.js";
import "./chunk-3LLM6WVC.js";
import "./chunk-XYPEOTVH.js";
import "./chunk-3A6FZELH.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import "./chunk-43QUFIPG.js";
import "./chunk-E4U5AV5T.js";
import "./chunk-RXCKHUOJ.js";
import "./chunk-M4TJ3SSY.js";
import "./chunk-6XJ2ENW3.js";
import "./chunk-KCDHWQ5X.js";
import "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import "./chunk-FEMUAMTL.js";
import "./chunk-TECZMXLZ.js";
import "./chunk-2HPWN6DG.js";
import "./chunk-DWVFAK3Q.js";
import "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-H74SWAKT.js";
import {
  MatMenu,
  MatMenuItem,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
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
import "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/admindashboard/admindashboard.component.ts
var _forTrack0 = ($index, $item) => $item.nCaseid;
var AdmindashboardComponent_Defer_33_DepsFn = () => [import("./chunk-CEYRJ3GS.js").then((m) => m.CasecardComponent)];
var _c0 = () => [1, 2];
var _c1 = () => [1, 2, 3, 4, 5, 6];
var _c2 = () => [1, 2, 3];
var _c3 = () => [1, 2, 4];
function AdmindashboardComponent_profile_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "profile", 27);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("isdark", true)("detail", ctx_r1.userdetail);
  }
}
function AdmindashboardComponent_div_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 28);
  }
}
function AdmindashboardComponent_Defer_32_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "casecard", 30);
    \u0275\u0275listener("caseChange", function AdmindashboardComponent_Defer_32_For_1_Template_casecard_caseChange_0_listener($event) {
      const x_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.chieldEmit($event, x_r4));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275property("detail", x_r4)("isAdmin", true)("ticketCount", x_r4.nTotaltickets);
  }
}
function AdmindashboardComponent_Defer_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, AdmindashboardComponent_Defer_32_For_1_Template, 1, 3, "casecard", 29, _forTrack0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275repeater(ctx_r1.caselist);
  }
}
function AdmindashboardComponent_Conditional_35_For_2_For_5_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "sklton", 41);
  }
  if (rf & 2) {
    \u0275\u0275property("isavatar", true);
  }
}
function AdmindashboardComponent_Conditional_35_For_2_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275element(1, "sklton", 39);
    \u0275\u0275elementStart(2, "div", 40);
    \u0275\u0275repeaterCreate(3, AdmindashboardComponent_Conditional_35_For_2_For_5_For_4_Template, 1, 1, "sklton", 41, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(3);
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c3));
  }
}
function AdmindashboardComponent_Conditional_35_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 31);
    \u0275\u0275element(1, "sklton", 32)(2, "sklton", 33);
    \u0275\u0275elementStart(3, "div", 34);
    \u0275\u0275repeaterCreate(4, AdmindashboardComponent_Conditional_35_For_2_For_5_Template, 5, 1, "div", null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 35);
    \u0275\u0275element(7, "sklton", 36)(8, "sklton", 37)(9, "sklton", 38)(10, "sklton", 38);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c2));
  }
}
function AdmindashboardComponent_Conditional_35_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 25);
    \u0275\u0275repeaterCreate(1, AdmindashboardComponent_Conditional_35_For_2_Template, 11, 1, "div", 31, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.caselist.length ? \u0275\u0275pureFunction0(0, _c0) : \u0275\u0275pureFunction0(1, _c1));
  }
}
function AdmindashboardComponent_div_36_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 42);
  }
}
var AdmindashboardComponent = class _AdmindashboardComponent {
  constructor(ss, aDash, cf, cd, hs) {
    this.ss = ss;
    this.aDash = aDash;
    this.cf = cf;
    this.cd = cd;
    this.hs = hs;
    this.caselist = [];
    this.reached = "S";
    this.scrolled = false;
    this.loding = true;
    this.isNoMoreData = false;
    this.nPageNumber = 1;
    this.cSearch = "";
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userdetail = yield this.ss.getUserInfo();
      this.getCaselist();
      this.loding = false;
      this.cd.detectChanges();
    });
  }
  getCaselist() {
    return __async(this, null, function* () {
      debugger;
      if (this.cSearch.length > 0) {
        this.caselist = [];
        this.nPageNumber = 1;
      }
      this.caselist = yield this.aDash.getDashboardlist(this.nPageNumber, this.cSearch);
      this.cd.detectChanges();
    });
  }
  onReachEnd() {
    return __async(this, null, function* () {
      if (this.loding || this.isNoMoreData) {
        return;
      }
      this.loding = true;
      try {
        const nextPageNumber = this.nPageNumber + 1;
        const nextList = yield this.aDash.getDashboardlist(nextPageNumber, this.cSearch);
        if (nextList.length) {
          this.caselist = [...this.caselist, ...nextList];
          this.nPageNumber = nextPageNumber;
        } else {
          this.isNoMoreData = true;
        }
      } catch (error) {
        console.error("Error fetching the next page of the dashboard list", error);
      } finally {
        this.loding = false;
        this.cd.detectChanges();
      }
    });
  }
  chieldEmit(event, x) {
    if (event == "EDIT") {
      var mdl = { id: x.nCaseid };
      this.cf.goto("/casebuilder/casecreation", mdl);
    } else if (event == "VIEW-TICKET") {
      this.cf.goto("/admin/tickets", { id: x.nCaseid });
    } else if (event == "ARCHIVE-TRUE") {
      this.update_archivecase(x.nCaseid, true);
    } else if (event == "ARCHIVE-FALSE") {
      this.update_archivecase(x.nCaseid, false);
    }
  }
  onScroll(flag, ev) {
    const threshold = 10;
    const element = ev.target;
    const scrollTop = element.scrollLeft;
    const scrollHeight = element.scrollWidth;
    const clientHeight = element.clientWidth;
    if (scrollHeight - scrollTop <= clientHeight + threshold) {
      this.reached = "E";
    } else if (scrollTop === 0) {
      this.reached = "S";
    } else {
      this.reached = "M";
    }
  }
  GoToNewCase() {
    this.cf.goto("/casebuilder/casecreation", { id: 0 });
  }
  viewArchive() {
    this.cf.goto("/admin/archivecases");
  }
  goTodashboard() {
    this.cf.goto("/user/dashboard");
  }
  update_archivecase(nCaseid, isArchived) {
    return __async(this, null, function* () {
      var mdl = { nCaseid, bIsarchived: isArchived };
      const res = yield this.aDash.update_archivecase(mdl);
      if (res) {
        var ind = this.caselist.findIndex((x) => x.nCaseid == nCaseid);
        this.caselist.splice(ind, 1);
        this.cd.detectChanges();
      }
    });
  }
  searchCase() {
    return __async(this, null, function* () {
      this.nPageNumber = 1;
      this.caselist = yield this.aDash.getDashboardlist(this.nPageNumber, this.cSearch);
      this.cd.detectChanges();
    });
  }
  viewOCRQueue() {
    this.cf.goto("/ocrlist");
  }
  static {
    this.\u0275fac = function AdmindashboardComponent_Factory(t) {
      return new (t || _AdmindashboardComponent)(\u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(AdmindashboardService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(HeaderService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AdmindashboardComponent, selectors: [["app-admindashboard"]], standalone: true, features: [\u0275\u0275ProvidersFeature([]), \u0275\u0275StandaloneFeature], decls: 37, vars: 9, consts: [["options", "matMenu"], [1, "flex", "h-full", "w-full"], [1, "bg-blue-100", "py-10", "h-full", "w-52", "relative", "overflow-hidden"], ["src", "assets/login/background.webp", 1, "absolute", "z-10", "top-48", "h-[130vh]", "object-cover", "mix-blend-multiply", "object-[-330px_0px]"], ["size", "xl", "class", "mx-auto block relative w-fit z-20", 3, "isdark", "detail", 4, "ngIf"], [1, "bg-dark-blue", "p-10", "w-[calc(100%_-_208px)]"], [1, "flex", "items-center", "justify-between", "mb-4"], [1, "text-lg", "text-blue-hover"], ["src", "assets/colorlogo.svg", 1, "cursor-pointer", 3, "click"], [1, "flex", "items-center"], [1, "flex", "items-center", "gap-3"], [1, "text-3xl", "font-semibold", "text-white"], ["name", "menu", 1, "text-white", "cursor-pointer", 3, "matMenuTriggerFor"], [1, "!rounded-none", "w-fit", "!bg-dark-blue"], ["mat-menu-item", "", 1, "!p-3", "hover:!bg-white/10", 3, "click"], [1, "text-xs", "text-white"], [1, "relative", "flex", "items-center", "cursor-pointer"], ["placeholder", "Search by case name & case no ", "type", "text", 1, "placeholder-shown:size-9", "peer", "cursor-pointer", "focus:cursor-auto", "border-0", "placeholder-shown:z-30", "text-sm", "placeholder:text-sm", "placeholder-shown:bg-transparent", "focus:placeholder:text-blue-hover", "placeholder:text-black/0", "focus:z-10", "rounded-full", "focus:outline-none", "focus:w-96", "w-96", "h-9", "transition-all", "focus:ps-8", "ps-4", "bg-white/100", "focus:bg-white/100", "focus:border-blue-700", "focus:border-4", 3, "ngModelChange", "keyup", "ngModel"], ["name", "search", 1, "absolute", "left-2.5", "z-20", "peer-focus:text-blue-hover", "cursor-pointer", "text-sm", "text-white"], ["mode", "dark", 1, "ms-auto", 3, "click"], ["name", "add", 1, "text-xs", "font-light", "me-1"], [1, "flex"], ["class", "fadestart relative -ml-10 left-10 z-20 h-[400px] w-28 bg-gradient-to-r from-dark-blue to-transparent", 4, "ngIf"], [3, "reachedEnd", "reachedBottom", "scroll", "visibility", "appearance"], [1, "flex", "items-center", "gap-6", "overflow-auto", "pt-5", "w-full"], [1, "flex", "gap-6"], ["class", "fadestart relative -mr-10 -left-10 z-20 h-[400px] w-28 bg-gradient-to-l from-dark-blue to-transparent", 4, "ngIf"], ["size", "xl", 1, "mx-auto", "block", "relative", "w-fit", "z-20", 3, "isdark", "detail"], [1, "fadestart", "relative", "-ml-10", "left-10", "z-20", "h-[400px]", "w-28", "bg-gradient-to-r", "from-dark-blue", "to-transparent"], [3, "detail", "isAdmin", "ticketCount"], [3, "caseChange", "detail", "isAdmin", "ticketCount"], [1, "p-5", "group", "rounded-base", "border", "relative", "border-white", "w-80", "flex-col", "h-[357px]", "bg-white", "text-grey", "flex", "justify-center-center"], ["height", "26px", "width", "200px", "bg", "base", 1, "mb-2"], ["height", "10px", "width", "100px", "bg", "base"], [1, "flex", "flex-col", "gap-2.5", "h-full", "overflow-auto", "mt-5"], [1, "flex", "gap-2"], ["height", "30px", "width", "100px", "bg", "base"], ["height", "30px", "width", "30px", "bg", "base", 1, "ms-auto"], ["height", "30px", "width", "30px", "bg", "base"], ["bg", "base", "height", "10px", "width", "100px", 1, "mb-3"], [1, "flex", "gap-2.5", "flex-wrap", "mt-3"], ["bg", "base", "height", "35px", "width", "35px", 3, "isavatar"], [1, "fadestart", "relative", "-mr-10", "-left-10", "z-20", "h-[400px]", "w-28", "bg-gradient-to-l", "from-dark-blue", "to-transparent"]], template: function AdmindashboardComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2);
        \u0275\u0275element(2, "img", 3);
        \u0275\u0275template(3, AdmindashboardComponent_profile_3_Template, 1, 2, "profile", 4);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "div", 5)(5, "div", 6)(6, "h6", 7);
        \u0275\u0275text(7, "Admin Panel");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(8, "img", 8);
        \u0275\u0275listener("click", function AdmindashboardComponent_Template_img_click_8_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.goTodashboard());
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(9, "div", 9)(10, "div", 10)(11, "span", 11);
        \u0275\u0275text(12, "Active Cases");
        \u0275\u0275elementEnd();
        \u0275\u0275element(13, "icon", 12);
        \u0275\u0275elementStart(14, "mat-menu", 13, 0)(16, "div", 14);
        \u0275\u0275listener("click", function AdmindashboardComponent_Template_div_click_16_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.viewArchive());
        });
        \u0275\u0275elementStart(17, "span", 15);
        \u0275\u0275text(18, "View archived cases");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(19, "div", 14);
        \u0275\u0275listener("click", function AdmindashboardComponent_Template_div_click_19_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.viewOCRQueue());
        });
        \u0275\u0275elementStart(20, "span", 15);
        \u0275\u0275text(21, "OCR Queue");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(22, "div", 16)(23, "input", 17);
        \u0275\u0275twoWayListener("ngModelChange", function AdmindashboardComponent_Template_input_ngModelChange_23_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.cSearch, $event) || (ctx.cSearch = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("keyup", function AdmindashboardComponent_Template_input_keyup_23_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.getCaselist());
        });
        \u0275\u0275elementEnd();
        \u0275\u0275element(24, "icon", 18);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(25, "btn", 19);
        \u0275\u0275listener("click", function AdmindashboardComponent_Template_btn_click_25_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.GoToNewCase());
        });
        \u0275\u0275element(26, "icon", 20);
        \u0275\u0275text(27, " New Case ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(28, "div", 21);
        \u0275\u0275template(29, AdmindashboardComponent_div_29_Template, 1, 0, "div", 22);
        \u0275\u0275elementStart(30, "ng-scrollbar", 23);
        \u0275\u0275listener("reachedEnd", function AdmindashboardComponent_Template_ng_scrollbar_reachedEnd_30_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onReachEnd());
        })("reachedBottom", function AdmindashboardComponent_Template_ng_scrollbar_reachedBottom_30_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onScroll("E", $event));
        })("scroll", function AdmindashboardComponent_Template_ng_scrollbar_scroll_30_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onScroll("", $event));
        });
        \u0275\u0275elementStart(31, "div", 24);
        \u0275\u0275template(32, AdmindashboardComponent_Defer_32_Template, 2, 0);
        \u0275\u0275defer(33, 32, AdmindashboardComponent_Defer_33_DepsFn);
        \u0275\u0275template(35, AdmindashboardComponent_Conditional_35_Template, 3, 2, "div", 25);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(36, AdmindashboardComponent_div_36_Template, 1, 0, "div", 26);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        const options_r5 = \u0275\u0275reference(15);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.userdetail);
        \u0275\u0275advance(10);
        \u0275\u0275property("matMenuTriggerFor", options_r5);
        \u0275\u0275advance(10);
        \u0275\u0275twoWayProperty("ngModel", ctx.cSearch);
        \u0275\u0275advance(6);
        \u0275\u0275property("ngIf", ctx.reached != "S");
        \u0275\u0275advance();
        \u0275\u0275property("visibility", "hover")("appearance", "compact");
        \u0275\u0275advance(3);
        \u0275\u0275deferWhen(ctx.caselist);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(35, ctx.loding ? 35 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.reached != "E" && ctx.caselist.length > 4);
      }
    }, dependencies: [
      CommonModule,
      NgIf,
      FormsModule,
      DefaultValueAccessor,
      NgControlStatus,
      NgModel,
      ProfileComponent,
      IconComponent,
      SkeletonComponent,
      ButtonComponent,
      MatMenuModule,
      MatMenu,
      MatMenuItem,
      MatMenuTrigger,
      NgScrollbarModule,
      NgScrollbar,
      NgScrollReached
    ], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AdmindashboardComponent, { className: "AdmindashboardComponent", filePath: "src\\app\\adminpanel\\components\\admindashboard\\admindashboard.component.ts", lineNumber: 30 });
})();
export {
  AdmindashboardComponent
};
//# sourceMappingURL=chunk-V733UOTZ.js.map
