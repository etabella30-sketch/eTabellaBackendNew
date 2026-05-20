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
  MatMenuModule
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
import "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import "./chunk-4BFWRZ22.js";
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
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/archivecase/archivecase.component.ts
var _forTrack0 = ($index, $item) => $item.nCaseid;
var ArchivecaseComponent_Defer_19_DepsFn = () => [import("./chunk-CEYRJ3GS.js").then((m) => m.CasecardComponent)];
var _c0 = () => [1, 2];
var _c1 = () => [1, 2, 3, 4, 5, 6];
var _c2 = () => [1, 2, 3];
var _c3 = () => [1, 2, 4];
function ArchivecaseComponent_profile_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "profile", 18);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("isdark", true)("detail", ctx_r0.userdetail);
  }
}
function ArchivecaseComponent_div_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 19);
  }
}
function ArchivecaseComponent_Defer_18_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "casecard", 21);
    \u0275\u0275listener("caseChange", function ArchivecaseComponent_Defer_18_For_1_Template_casecard_caseChange_0_listener($event) {
      const x_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.chieldEmit($event, x_r3));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275property("detail", x_r3)("isAdmin", true)("isArchive", true)("ticketCount", x_r3.nTotaltickets);
  }
}
function ArchivecaseComponent_Defer_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, ArchivecaseComponent_Defer_18_For_1_Template, 1, 4, "casecard", 20, _forTrack0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275repeater(ctx_r0.caselist);
  }
}
function ArchivecaseComponent_Conditional_21_For_2_For_5_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "sklton", 32);
  }
  if (rf & 2) {
    \u0275\u0275property("isavatar", true);
  }
}
function ArchivecaseComponent_Conditional_21_For_2_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275element(1, "sklton", 30);
    \u0275\u0275elementStart(2, "div", 31);
    \u0275\u0275repeaterCreate(3, ArchivecaseComponent_Conditional_21_For_2_For_5_For_4_Template, 1, 1, "sklton", 32, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(3);
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c3));
  }
}
function ArchivecaseComponent_Conditional_21_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 22);
    \u0275\u0275element(1, "sklton", 23)(2, "sklton", 24);
    \u0275\u0275elementStart(3, "div", 25);
    \u0275\u0275repeaterCreate(4, ArchivecaseComponent_Conditional_21_For_2_For_5_Template, 5, 1, "div", null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 26);
    \u0275\u0275element(7, "sklton", 27)(8, "sklton", 28)(9, "sklton", 29)(10, "sklton", 29);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c2));
  }
}
function ArchivecaseComponent_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16);
    \u0275\u0275repeaterCreate(1, ArchivecaseComponent_Conditional_21_For_2_Template, 11, 1, "div", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r0.caselist.length ? \u0275\u0275pureFunction0(0, _c0) : \u0275\u0275pureFunction0(1, _c1));
  }
}
function ArchivecaseComponent_div_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 33);
  }
}
var ArchivecaseComponent = class _ArchivecaseComponent {
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
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userdetail = yield this.ss.getUserInfo();
      this.caselist = yield this.aDash.getArchivelist(this.nPageNumber);
      this.loding = false;
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
        const nextList = yield this.aDash.getArchivelist(nextPageNumber);
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
  goTodashboard() {
    this.cf.goto("/admin/dashboard");
  }
  update_archivecase(nCaseid, bIsarchived) {
    return __async(this, null, function* () {
      var mdl = { nCaseid, bIsarchived };
      const res = yield this.aDash.update_archivecase(mdl);
      if (res) {
        var ind = this.caselist.findIndex((x) => x.nCaseid == nCaseid);
        this.caselist.splice(ind, 1);
      }
    });
  }
  static {
    this.\u0275fac = function ArchivecaseComponent_Factory(t) {
      return new (t || _ArchivecaseComponent)(\u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(AdmindashboardService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(HeaderService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ArchivecaseComponent, selectors: [["app-archivecase"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 23, vars: 7, consts: [[1, "flex", "h-full", "w-full"], [1, "bg-blue-100", "py-10", "h-full", "w-52", "relative", "overflow-hidden"], ["src", "assets/login/background.webp", 1, "absolute", "z-10", "top-48", "h-[130vh]", "object-cover", "mix-blend-multiply", "object-[-330px_0px]"], ["size", "xl", "class", "mx-auto block relative w-fit z-20", 3, "isdark", "detail", 4, "ngIf"], [1, "bg-dark-blue", "p-10", "w-[calc(100%_-_208px)]"], [1, "flex", "items-center", "justify-between", "mb-4"], [1, "text-lg", "text-blue-hover", "flex", "items-center", "gap-3", "cursor-pointer", 3, "click"], ["name", "chvy", 1, "text-sm"], ["src", "assets/colorlogo.svg", 3, "click"], [1, "flex", "items-center"], [1, "flex", "items-center", "gap-3"], [1, "text-3xl", "font-semibold", "text-white"], [1, "flex"], ["class", "fadestart relative -ml-10 left-10 z-20 h-[378px] w-28 bg-gradient-to-r from-dark-blue to-transparent", 4, "ngIf"], [3, "reachedEnd", "reachedBottom", "scroll", "visibility", "appearance"], [1, "flex", "items-center", "gap-6", "overflow-auto", "pt-5", "w-full"], [1, "flex", "gap-6"], ["class", "fadestart relative -mr-10 -left-10 z-20 h-[378px] w-28 bg-gradient-to-l from-dark-blue to-transparent", 4, "ngIf"], ["size", "xl", 1, "mx-auto", "block", "relative", "w-fit", "z-20", 3, "isdark", "detail"], [1, "fadestart", "relative", "-ml-10", "left-10", "z-20", "h-[378px]", "w-28", "bg-gradient-to-r", "from-dark-blue", "to-transparent"], [3, "detail", "isAdmin", "isArchive", "ticketCount"], [3, "caseChange", "detail", "isAdmin", "isArchive", "ticketCount"], [1, "p-5", "group", "rounded-base", "border", "relative", "border-white", "w-80", "flex-col", "h-[357px]", "bg-white", "text-grey", "flex", "justify-center-center"], ["height", "26px", "width", "200px", "bg", "base", 1, "mb-2"], ["height", "10px", "width", "100px", "bg", "base"], [1, "flex", "flex-col", "gap-2.5", "h-full", "overflow-auto", "mt-5"], [1, "flex", "gap-2"], ["height", "30px", "width", "100px", "bg", "base"], ["height", "30px", "width", "30px", "bg", "base", 1, "ms-auto"], ["height", "30px", "width", "30px", "bg", "base"], ["bg", "base", "height", "10px", "width", "100px", 1, "mb-3"], [1, "flex", "gap-2.5", "flex-wrap", "mt-3"], ["bg", "base", "height", "35px", "width", "35px", 3, "isavatar"], [1, "fadestart", "relative", "-mr-10", "-left-10", "z-20", "h-[378px]", "w-28", "bg-gradient-to-l", "from-dark-blue", "to-transparent"]], template: function ArchivecaseComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275element(2, "img", 2);
        \u0275\u0275template(3, ArchivecaseComponent_profile_3_Template, 1, 2, "profile", 3);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "div", 4)(5, "div", 5)(6, "h6", 6);
        \u0275\u0275listener("click", function ArchivecaseComponent_Template_h6_click_6_listener() {
          return ctx.goTodashboard();
        });
        \u0275\u0275element(7, "icon", 7);
        \u0275\u0275text(8, " Back ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "img", 8);
        \u0275\u0275listener("click", function ArchivecaseComponent_Template_img_click_9_listener() {
          return ctx.goTodashboard();
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "div", 9)(11, "div", 10)(12, "span", 11);
        \u0275\u0275text(13, "Archive Cases");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(14, "div", 12);
        \u0275\u0275template(15, ArchivecaseComponent_div_15_Template, 1, 0, "div", 13);
        \u0275\u0275elementStart(16, "ng-scrollbar", 14);
        \u0275\u0275listener("reachedEnd", function ArchivecaseComponent_Template_ng_scrollbar_reachedEnd_16_listener() {
          return ctx.onReachEnd();
        })("reachedBottom", function ArchivecaseComponent_Template_ng_scrollbar_reachedBottom_16_listener($event) {
          return ctx.onScroll("E", $event);
        })("scroll", function ArchivecaseComponent_Template_ng_scrollbar_scroll_16_listener($event) {
          return ctx.onScroll("", $event);
        });
        \u0275\u0275elementStart(17, "div", 15);
        \u0275\u0275template(18, ArchivecaseComponent_Defer_18_Template, 2, 0);
        \u0275\u0275defer(19, 18, ArchivecaseComponent_Defer_19_DepsFn);
        \u0275\u0275template(21, ArchivecaseComponent_Conditional_21_Template, 3, 2, "div", 16);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(22, ArchivecaseComponent_div_22_Template, 1, 0, "div", 17);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.userdetail);
        \u0275\u0275advance(12);
        \u0275\u0275property("ngIf", ctx.reached != "S");
        \u0275\u0275advance();
        \u0275\u0275property("visibility", "hover")("appearance", "compact");
        \u0275\u0275advance(3);
        \u0275\u0275deferWhen(ctx.caselist);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(21, ctx.loding ? 21 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.reached != "E" && ctx.caselist.length > 4);
      }
    }, dependencies: [
      CommonModule,
      NgIf,
      ProfileComponent,
      IconComponent,
      SkeletonComponent,
      MatMenuModule,
      NgScrollbarModule,
      NgScrollbar,
      NgScrollReached
      //NgScrollbarReachedModule
    ] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ArchivecaseComponent, { className: "ArchivecaseComponent", filePath: "src\\app\\adminpanel\\components\\archivecase\\archivecase.component.ts", lineNumber: 27 });
})();
export {
  ArchivecaseComponent
};
//# sourceMappingURL=chunk-262L73L6.js.map
