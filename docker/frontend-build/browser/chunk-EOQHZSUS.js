import {
  NgScrollbar,
  NgScrollbarModule,
  takeUntilDestroyed
} from "./chunk-WZNPCXMG.js";
import {
  SkeletonComponent
} from "./chunk-KEJC4ZXM.js";
import {
  LanguageService
} from "./chunk-N4WTQ7WP.js";
import {
  LogoutService,
  UserDashboardFacade
} from "./chunk-ZC2EPQ66.js";
import "./chunk-ZLDLJ4OJ.js";
import "./chunk-2BPOYM2X.js";
import "./chunk-GNZXOHZW.js";
import "./chunk-XIPFTUTL.js";
import "./chunk-62ZTKIF6.js";
import "./chunk-SD32Y426.js";
import "./chunk-55ITPE7H.js";
import "./chunk-3LLM6WVC.js";
import "./chunk-XYPEOTVH.js";
import {
  UsercreationComponent
} from "./chunk-3A6FZELH.js";
import "./chunk-PNJCYNRI.js";
import "./chunk-43QUFIPG.js";
import "./chunk-E4U5AV5T.js";
import "./chunk-RXCKHUOJ.js";
import "./chunk-M4TJ3SSY.js";
import "./chunk-6XJ2ENW3.js";
import "./chunk-KCDHWQ5X.js";
import "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import "./chunk-FEMUAMTL.js";
import {
  CasecardComponent
} from "./chunk-6EXNCTOQ.js";
import "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslatePipe,
  TranslateService
} from "./chunk-DWVFAK3Q.js";
import "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  TicketsComponent
} from "./chunk-SF564O5V.js";
import "./chunk-WQBUN4X6.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import {
  MatDialog
} from "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import {
  DASHBOARD_ACTIONS,
  SKELETON_ARRAYS,
  ScrollState,
  USERDASHBOARD_CONFIG,
  USER_DATA_CONFIG
} from "./chunk-6RMJH3FI.js";
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
import {
  Router,
  Title
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  DestroyRef,
  Subject,
  __async,
  inject,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/components/userdashboard/userdashboard.component.ts
var _c0 = ["parent"];
var _c1 = (a0) => ({ name: a0 });
function UserdashboardComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5);
    \u0275\u0275element(1, "avtr", 27);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_4_0;
    let tmp_5_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("path", (tmp_4_0 = ctx_r1.facade.userProfile()) == null ? null : tmp_4_0.cProfile)("matTooltip", ((tmp_5_0 = ctx_r1.facade.userProfile()) == null ? null : tmp_5_0.cFname) + " " + ((tmp_5_0 = ctx_r1.facade.userProfile()) == null ? null : tmp_5_0.cLname))("detail", ctx_r1.facade.userProfile())("size", "sm");
  }
}
function UserdashboardComponent_app_usercreation_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-usercreation", 28);
    \u0275\u0275listener("click", function UserdashboardComponent_app_usercreation_18_Template_app_usercreation_click_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keypress", function UserdashboardComponent_app_usercreation_18_Template_app_usercreation_keypress_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      return \u0275\u0275resetView($event.stopPropagation());
    })("updateEvent", function UserdashboardComponent_app_usercreation_18_Template_app_usercreation_updateEvent_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.updateUser());
    })("closeEvent", function UserdashboardComponent_app_usercreation_18_Template_app_usercreation_closeEvent_0_listener() {
      \u0275\u0275restoreView(_r3);
      \u0275\u0275nextContext();
      const pm_r4 = \u0275\u0275reference(13);
      return \u0275\u0275resetView(pm_r4.closeMenu());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_4_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("nUserid", (tmp_4_0 = ctx_r1.facade.userProfile()) == null ? null : tmp_4_0.nUserid)("ismyfiles", true);
  }
}
function UserdashboardComponent_btn_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 29);
    \u0275\u0275listener("click", function UserdashboardComponent_btn_19_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.goToAdmin());
    })("keypress", function UserdashboardComponent_btn_19_Template_btn_keypress_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.goToAdmin());
    });
    \u0275\u0275element(1, "icon", 30);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(3, 1, "DASHBOARD.SUPER_ADMINISTRATOR"), " ");
  }
}
function UserdashboardComponent_div_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 31);
  }
}
function UserdashboardComponent_casecard_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "casecard", 32);
    \u0275\u0275listener("caseChange", function UserdashboardComponent_casecard_33_Template_casecard_caseChange_0_listener($event) {
      const caseItem_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewTicket($event, caseItem_r7));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const caseItem_r7 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("detail", caseItem_r7)("ticketCount", caseItem_r7.ticketCount)("ticketOpen", ctx_r1.selectedTicketCaseId == caseItem_r7.nCaseid)("sessionId", caseItem_r7.nSesid);
  }
}
function UserdashboardComponent_div_34_div_1_div_4_sklton_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "sklton", 47);
  }
  if (rf & 2) {
    \u0275\u0275property("isavatar", true);
  }
}
function UserdashboardComponent_div_34_div_1_div_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275element(1, "sklton", 44);
    \u0275\u0275elementStart(2, "div", 45);
    \u0275\u0275template(3, UserdashboardComponent_div_34_div_1_div_4_sklton_3_Template, 1, 1, "sklton", 46);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.avatarSkeletonArray)("ngForTrackBy", ctx_r1.trackByIndex);
  }
}
function UserdashboardComponent_div_34_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275element(1, "sklton", 36)(2, "sklton", 37);
    \u0275\u0275elementStart(3, "div", 38);
    \u0275\u0275template(4, UserdashboardComponent_div_34_div_1_div_4_Template, 4, 2, "div", 39);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 40);
    \u0275\u0275element(6, "sklton", 41)(7, "sklton", 42)(8, "sklton", 43)(9, "sklton", 43);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx_r1.teamSkeletonArray)("ngForTrackBy", ctx_r1.trackByIndex);
  }
}
function UserdashboardComponent_div_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 33);
    \u0275\u0275template(1, UserdashboardComponent_div_34_div_1_Template, 10, 2, "div", 34);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.skeletonArray)("ngForTrackBy", ctx_r1.trackByIndex);
  }
}
function UserdashboardComponent_div_35_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 48);
  }
}
function UserdashboardComponent_app_tickets_36_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-tickets", 49);
    \u0275\u0275listener("ticketClose", function UserdashboardComponent_app_tickets_36_Template_app_tickets_ticketClose_0_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.selectedTicketCaseId = null);
    })("ticketCleard", function UserdashboardComponent_app_tickets_36_Template_app_tickets_ticketCleard_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onTicketResponse($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("nTicketCaseId", ctx_r1.selectedTicketCaseId)("onTickets", ctx_r1.ticketChange$);
  }
}
var UserdashboardComponent = class _UserdashboardComponent {
  get skeletonArray() {
    return this.facade.cases().length ? SKELETON_ARRAYS.LOADED_SKELETON : SKELETON_ARRAYS.DEFAULT_SKELETON;
  }
  get avatarSkeletonArray() {
    return SKELETON_ARRAYS.AVATAR_SKELETON;
  }
  get teamSkeletonArray() {
    return SKELETON_ARRAYS.TEAM_SKELETON;
  }
  constructor() {
    this.facade = inject(UserDashboardFacade);
    this.dashboardActions = DASHBOARD_ACTIONS;
    this.scrollStateEnum = ScrollState;
    this.title = inject(Title);
    this.translate = inject(TranslateService);
    this.router = inject(Router);
    this.commonFunction = inject(CommonfunctionService);
    this.dialog = inject(MatDialog);
    this.logoutService = inject(LogoutService);
    this.languageService = inject(LanguageService);
    this.destroyRef = inject(DestroyRef);
    this.scrollState = "S";
    this.selectedTicketCaseId = null;
    this.ticketChange$ = new Subject();
    this.scrollRafId = 0;
    this.ticketChange$.pipe(takeUntilDestroyed()).subscribe((caseId) => {
    });
  }
  ngOnInit() {
    this.translate.get("DASHBOARD.TITLE").subscribe((title) => {
      this.title.setTitle(title || USER_DATA_CONFIG.FALLBACK_DASHBOARD_TITLE);
    });
    this.facade.initDashboard();
  }
  // Facade Actions
  onReachEnd() {
    this.facade.loadMore();
  }
  // UI Helper functions
  goToAdmin() {
    this.router.navigate([USERDASHBOARD_CONFIG.ADMIN_DASHBOARD]);
  }
  onScroll(state) {
    this.scrollState = state;
  }
  onScroll2(state, event) {
    if (this.scrollRafId)
      return;
    this.scrollRafId = requestAnimationFrame(() => {
      this.scrollRafId = 0;
      const threshold = 700;
      const element = event.target;
      const scrollLeft = element.scrollLeft;
      const scrollWidth = element.scrollWidth;
      const clientWidth = element.clientWidth;
      if (scrollWidth - scrollLeft <= clientWidth + threshold) {
        this.scrollState = ScrollState.END;
        this.onReachEnd();
      } else if (scrollLeft === 0) {
        this.scrollState = ScrollState.START;
      } else {
        this.scrollState = ScrollState.MIDDLE;
      }
    });
  }
  viewTicket(action, caseItem) {
    if (action === DASHBOARD_ACTIONS.VIEW_TICKET) {
      if (this.selectedTicketCaseId === caseItem.nCaseid) {
        this.selectedTicketCaseId = null;
        return;
      }
      const shouldEmitChange = !!this.selectedTicketCaseId;
      this.selectedTicketCaseId = caseItem.nCaseid;
      setTimeout(() => {
        this.parent.nativeElement.scrollTo({ top: USERDASHBOARD_CONFIG.SCROLL_TO_POSITION, behavior: USERDASHBOARD_CONFIG.SCROLL_BEHAVIOR });
      }, USERDASHBOARD_CONFIG.SCROLL_TIMEOUT);
      if (shouldEmitChange) {
        this.ticketChange$.next(caseItem.nCaseid);
      }
    } else if (action === DASHBOARD_ACTIONS.REAL_TIME) {
      const url = this.router.serializeUrl(this.router.createUrlTree([USERDASHBOARD_CONFIG.REALTIME_FEED, btoa(JSON.stringify({ nSesid: caseItem.nSesid ? caseItem.nSesid : 0, nCaseid: caseItem.nCaseid }))]));
      globalThis.open(url, "_blank");
    }
  }
  onTicketResponse(count) {
    if (this.selectedTicketCaseId) {
      this.facade.updateTicketCount(this.selectedTicketCaseId, count);
    }
  }
  gotoRealtime() {
    this.commonFunction.goto(USERDASHBOARD_CONFIG.REALTIME_FEED);
  }
  accountSetting() {
    const data = {
      nUserid: this.facade.userProfile()?.nUserid,
      ismyfiles: USER_DATA_CONFIG.IS_MY_FILES
    };
    const dialogRef = this.dialog.open(UsercreationComponent, {
      width: USERDASHBOARD_CONFIG.DIALOG_WIDTH,
      height: USERDASHBOARD_CONFIG.DIALOG_HEIGHT,
      maxHeight: USERDASHBOARD_CONFIG.DIALOG_MAX_HEIGHT,
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      backdropClass: "profilebackdrop",
      data,
      position: {
        top: USERDASHBOARD_CONFIG.DIALOG_POSITION_TOP,
        right: USERDASHBOARD_CONFIG.DIALOG_POSITION_RIGHT
      }
    });
    dialogRef.afterClosed().subscribe(() => {
    });
  }
  logOut() {
    return __async(this, null, function* () {
      yield this.logoutService.logout();
      this.commonFunction.goto(USERDASHBOARD_CONFIG.LOGIN_PAGE);
    });
  }
  updateUser() {
  }
  trackByIndex(index) {
    return index;
  }
  trackByNcaseid(index, item) {
    return item.nCaseid;
  }
  static {
    this.\u0275fac = function UserdashboardComponent_Factory(t) {
      return new (t || _UserdashboardComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UserdashboardComponent, selectors: [["app-userdashboard"]], viewQuery: function UserdashboardComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.parent = _t.first);
      }
    }, standalone: true, features: [\u0275\u0275ProvidersFeature([]), \u0275\u0275StandaloneFeature], decls: 37, vars: 29, consts: [["pm", "matMenuTrigger"], ["menu", "matMenu"], ["parent", ""], [1, "flex", "flex-col", "h-full"], [1, "px-8", "h-[100px]", "flex"], [1, "flex", "items-center", "gap-2"], ["src", "assets/colorlogo.svg", "alt", "eTabella Logo"], [1, "text-3xl", "font-semibold"], [1, "flex", "items-center", "gap-2", "ms-auto"], [1, "text-xs"], ["class", "flex items-center gap-2", 4, "ngIf"], ["mode", "white", 3, "active", "matMenuTriggerFor"], [1, "!min-w-[640px]", "mt-5", "!overflow-visible"], [3, "nUserid", "ismyfiles", "click", "keypress", "updateEvent", "closeEvent", 4, "ngIf"], ["mode", "outlined", 3, "click", "keypress", 4, "ngIf"], ["mode", "dark", "addcls", "px-1 !text-blue-on", 3, "click", "keypress"], [1, "h-full", "overflow-auto"], [1, "bg-dark-blue", "p-10"], [1, "text-lg", "font-semibold", "text-white"], [1, "flex"], ["class", "fadestart relative -ml-10 left-10 z-20 h-[378px] w-28 bg-gradient-to-r from-dark-blue to-transparent", 4, "ngIf"], [3, "reachedEnd", "reachedBottom", "reachedStart", "scroll"], [1, "flex", "items-center", "relative", "gap-6", "overflow-auto", "py-5"], [3, "detail", "ticketCount", "ticketOpen", "sessionId", "caseChange", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["class", "flex gap-6", 4, "ngIf"], ["class", "fadestart relative -mr-10 -left-10 z-20 h-[378px] w-28 bg-gradient-to-l from-dark-blue to-transparent", 4, "ngIf"], [3, "nTicketCaseId", "onTickets", "ticketClose", "ticketCleard", 4, "ngIf"], [1, "inline-flex", 3, "path", "matTooltip", "detail", "size"], [3, "click", "keypress", "updateEvent", "closeEvent", "nUserid", "ismyfiles"], ["mode", "outlined", 3, "click", "keypress"], ["name", "setting", 1, "text-lg"], [1, "fadestart", "relative", "-ml-10", "left-10", "z-20", "h-[378px]", "w-28", "bg-gradient-to-r", "from-dark-blue", "to-transparent"], [3, "caseChange", "detail", "ticketCount", "ticketOpen", "sessionId"], [1, "flex", "gap-6"], ["class", "p-5 group rounded-base border relative border-white w-80 flex-col h-[357px] bg-white text-grey flex justify-center-center", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "p-5", "group", "rounded-base", "border", "relative", "border-white", "w-80", "flex-col", "h-[357px]", "bg-white", "text-grey", "flex", "justify-center-center"], ["height", "26px", "width", "200px", "bg", "base", 1, "mb-2"], ["height", "10px", "width", "100px", "bg", "base"], [1, "flex", "flex-col", "gap-2.5", "h-full", "overflow-auto", "mt-5"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "flex", "gap-2"], ["height", "30px", "width", "100px", "bg", "base"], ["height", "30px", "width", "30px", "bg", "base", 1, "ms-auto"], ["height", "30px", "width", "30px", "bg", "base"], ["bg", "base", "height", "10px", "width", "100px", 1, "mb-3"], [1, "flex", "gap-2.5", "flex-wrap", "mt-3"], ["bg", "base", "height", "35px", "width", "35px", 3, "isavatar", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["bg", "base", "height", "35px", "width", "35px", 3, "isavatar"], [1, "fadestart", "relative", "-mr-10", "-left-10", "z-20", "h-[378px]", "w-28", "bg-gradient-to-l", "from-dark-blue", "to-transparent"], [3, "ticketClose", "ticketCleard", "nTicketCaseId", "onTickets"]], template: function UserdashboardComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 3)(1, "header", 4)(2, "div", 5);
        \u0275\u0275element(3, "img", 6);
        \u0275\u0275elementStart(4, "span", 7);
        \u0275\u0275text(5);
        \u0275\u0275pipe(6, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "div", 8)(8, "span", 9);
        \u0275\u0275text(9);
        \u0275\u0275pipe(10, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275template(11, UserdashboardComponent_div_11_Template, 2, 4, "div", 10);
        \u0275\u0275elementStart(12, "btn", 11, 0);
        \u0275\u0275text(14);
        \u0275\u0275pipe(15, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "mat-menu", 12, 1);
        \u0275\u0275template(18, UserdashboardComponent_app_usercreation_18_Template, 1, 2, "app-usercreation", 13);
        \u0275\u0275elementEnd();
        \u0275\u0275template(19, UserdashboardComponent_btn_19_Template, 4, 3, "btn", 14);
        \u0275\u0275elementStart(20, "btn", 15);
        \u0275\u0275listener("click", function UserdashboardComponent_Template_btn_click_20_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.logOut());
        })("keypress", function UserdashboardComponent_Template_btn_keypress_20_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.logOut());
        });
        \u0275\u0275text(21);
        \u0275\u0275pipe(22, "translate");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(23, "div", 16, 2)(25, "div", 17)(26, "h6", 18);
        \u0275\u0275text(27);
        \u0275\u0275pipe(28, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(29, "div", 19);
        \u0275\u0275template(30, UserdashboardComponent_div_30_Template, 1, 0, "div", 20);
        \u0275\u0275elementStart(31, "ng-scrollbar", 21);
        \u0275\u0275listener("reachedEnd", function UserdashboardComponent_Template_ng_scrollbar_reachedEnd_31_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onReachEnd());
        })("reachedBottom", function UserdashboardComponent_Template_ng_scrollbar_reachedBottom_31_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onScroll(ctx.scrollStateEnum.END));
        })("reachedStart", function UserdashboardComponent_Template_ng_scrollbar_reachedStart_31_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onScroll(ctx.scrollStateEnum.START));
        })("scroll", function UserdashboardComponent_Template_ng_scrollbar_scroll_31_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onScroll2("", $event));
        });
        \u0275\u0275elementStart(32, "div", 22);
        \u0275\u0275template(33, UserdashboardComponent_casecard_33_Template, 1, 4, "casecard", 23)(34, UserdashboardComponent_div_34_Template, 2, 2, "div", 24);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(35, UserdashboardComponent_div_35_Template, 1, 0, "div", 25);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(36, UserdashboardComponent_app_tickets_36_Template, 1, 2, "app-tickets", 26);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        let tmp_4_0;
        let tmp_5_0;
        let tmp_9_0;
        let tmp_10_0;
        const pm_r4 = \u0275\u0275reference(13);
        const menu_r9 = \u0275\u0275reference(17);
        \u0275\u0275advance(5);
        \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(6, 16, "DASHBOARD.TITLE"), " ");
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(10, 18, "DASHBOARD.WELCOME", \u0275\u0275pureFunction1(27, _c1, (tmp_4_0 = ctx.facade.userProfile()) == null ? null : tmp_4_0.cFname)));
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", (tmp_5_0 = ctx.facade.userProfile()) == null ? null : tmp_5_0.nUserid);
        \u0275\u0275advance();
        \u0275\u0275property("active", pm_r4.menuOpen)("matMenuTriggerFor", menu_r9);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(15, 21, "DASHBOARD.MY_ACCOUNT"), " ");
        \u0275\u0275advance(4);
        \u0275\u0275property("ngIf", (tmp_9_0 = ctx.facade.userProfile()) == null ? null : tmp_9_0.nUserid);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (tmp_10_0 = ctx.facade.userProfile()) == null ? null : tmp_10_0.isAdmin);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(22, 23, "DASHBOARD.LOG_OUT"), " ");
        \u0275\u0275advance(6);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(28, 25, "DASHBOARD.ACTIVE_CASES"));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.scrollState != ctx.scrollStateEnum.START);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.facade.cases())("ngForTrackBy", ctx.trackByNcaseid);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.facade.loading());
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.scrollState != ctx.scrollStateEnum.END && ctx.facade.cases().length > 4);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.selectedTicketCaseId);
      }
    }, dependencies: [
      CommonModule,
      NgForOf,
      NgIf,
      ButtonComponent,
      CasecardComponent,
      IconComponent,
      SkeletonComponent,
      NgScrollbarModule,
      NgScrollbar,
      MatMenuModule,
      MatMenu,
      MatMenuTrigger,
      TicketsComponent,
      MatTooltipModule,
      MatTooltip,
      UsercreationComponent,
      AvatarComponent,
      TranslateModule,
      TranslatePipe
    ], styles: ['\n\nngx-scrollbar[_ngcontent-%COMP%] {\n  position: relative;\n}\nngx-scrollbar[_ngcontent-%COMP%]  .scroll-view {\n  position: relative;\n}\nngx-scrollbar[_ngcontent-%COMP%]  .scroll-view::after {\n  content: "";\n  position: absolute;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  height: 50px;\n  background:\n    linear-gradient(\n      to bottom,\n      rgba(255, 255, 255, 0),\n      rgb(255, 255, 255));\n}\n/*# sourceMappingURL=userdashboard.component.css.map */'], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UserdashboardComponent, { className: "UserdashboardComponent", filePath: "src\\app\\userpanel\\components\\userdashboard\\userdashboard.component.ts", lineNumber: 35 });
})();
export {
  UserdashboardComponent
};
//# sourceMappingURL=chunk-EOQHZSUS.js.map
