import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import {
  RolepermitService
} from "./chunk-TECZMXLZ.js";
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
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  BUTTON_ACTIONS,
  CASECARD_ACTIONS,
  CASECARD_ROUTES,
  CASE_STATUS_CONDITIONS,
  NOTIFICATION_TYPES,
  PRESENTATION_EVENTS,
  PRESENTATION_STATUS_TYPES
} from "./chunk-6RMJH3FI.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
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
  Router
} from "./chunk-FNSUDMGC.js";
import {
  CommonModule,
  DatePipe,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  Subject,
  __async,
  computed,
  takeUntil,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/casecard/casecard.component.ts
var _c0 = (a0, a1) => ({ "mt-5 group-hover:mb-5": a0, "my-5": a1 });
function CasecardComponent_span_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 11);
    \u0275\u0275listener("click", function CasecardComponent_span_1_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewTicket());
    })("keydown", function CasecardComponent_span_1_Template_span_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onTicketKeyDown($event));
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275element(3, "icon", 12);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r1.ticketOpen ? "bg-blue-on" : "bg-black");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2("", ctx_r1.ticketCount, " ", \u0275\u0275pipeBind1(2, 6, "CASECARD.TICKETS"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r1.ticketOpen ? "rotate-180" : "");
  }
}
function CasecardComponent_b_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("(", ctx_r1.detail.nCaseid, ")");
  }
}
function CasecardComponent_div_15_avtr_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "avtr", 17);
  }
  if (rf & 2) {
    const user_r3 = ctx.$implicit;
    \u0275\u0275property("detail", user_r3)("matTooltip", (user_r3 == null ? null : user_r3.cFname) + " " + (user_r3 == null ? null : user_r3.cLname));
  }
}
function CasecardComponent_div_15_img_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 18);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    \u0275\u0275property("alt", \u0275\u0275pipeBind1(1, 1, "CASECARD.NO_TEAM_MEMBERS"));
  }
}
function CasecardComponent_div_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "span", 13);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 14);
    \u0275\u0275template(4, CasecardComponent_div_15_avtr_4_Template, 1, 2, "avtr", 15)(5, CasecardComponent_div_15_img_5_Template, 2, 3, "img", 16);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const team_r4 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(team_r4.cTeamname);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", team_r4.users)("ngForTrackBy", ctx_r1.trackByUser);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !team_r4.users.length);
  }
}
function CasecardComponent_ng_container_16_btn_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 22);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function CasecardComponent_ng_container_16_btn_2_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.goToCase());
    })("keydown", function CasecardComponent_ng_container_16_btn_2_Template_btn_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "goToCase"));
    });
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(1, 2, "CASECARD.HEARING_HUB_TOOLTIP"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 4, "CASECARD.HEARING_HUB"));
  }
}
function CasecardComponent_ng_container_16_btn_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 23);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function CasecardComponent_ng_container_16_btn_3_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.goToAdmin());
    })("keydown", function CasecardComponent_ng_container_16_btn_3_Template_btn_keydown_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "goToAdmin"));
    });
    \u0275\u0275element(2, "icon", 24);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(1, 2, "CASECARD.CASE_MANAGER_TOOLTIP"))("square", true);
  }
}
function CasecardComponent_ng_container_16_div_4_span_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 28);
  }
}
function CasecardComponent_ng_container_16_div_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "btn", 25);
    \u0275\u0275listener("click", function CasecardComponent_ng_container_16_div_4_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.goToPresentation());
    })("keydown", function CasecardComponent_ng_container_16_div_4_Template_btn_keydown_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "goToPresentation"));
    });
    \u0275\u0275text(2, " Team Presentation ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "btn", 26);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275listener("click", function CasecardComponent_ng_container_16_div_4_Template_btn_click_3_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.goToPresentation());
    })("keydown", function CasecardComponent_ng_container_16_div_4_Template_btn_keydown_3_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "goToPresentation"));
    });
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275template(7, CasecardComponent_ng_container_16_div_4_span_7_Template, 1, 0, "span", 27);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("square", true);
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(4, 5, "CASECARD.EPE_TOOLTIP"))("square", true);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(6, 7, "CASECARD.EPE"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.presentationStatus);
  }
}
function CasecardComponent_ng_container_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 19);
    \u0275\u0275template(2, CasecardComponent_ng_container_16_btn_2_Template, 4, 6, "btn", 20)(3, CasecardComponent_ng_container_16_btn_3_Template, 3, 4, "btn", 21)(4, CasecardComponent_ng_container_16_div_4_Template, 8, 9, "div", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.isCanView);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isCaseAdmin);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isCanPresent);
  }
}
function CasecardComponent_ng_container_17_icon_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 46);
  }
}
function CasecardComponent_ng_container_17_icon_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 47);
  }
}
function CasecardComponent_ng_container_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 29)(2, "btn", 30);
    \u0275\u0275listener("click", function CasecardComponent_ng_container_17_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.editCase());
    })("keydown", function CasecardComponent_ng_container_17_Template_btn_keydown_2_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "editCase"));
    });
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "btn", 31);
    \u0275\u0275listener("click", function CasecardComponent_ng_container_17_Template_btn_click_5_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.goToBundleManage());
    })("keydown", function CasecardComponent_ng_container_17_Template_btn_keydown_5_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "goToBundleManage"));
    });
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "btn", 32);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275listener("click", function CasecardComponent_ng_container_17_Template_btn_click_8_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.goToRealtimeLog());
    })("keydown", function CasecardComponent_ng_container_17_Template_btn_keydown_8_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "goToRealtimeLog"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(10, "svg", 33);
    \u0275\u0275element(11, "path", 34)(12, "path", 35)(13, "path", 36)(14, "path", 37);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(15, "btn", 38, 0);
    \u0275\u0275pipe(17, "translate");
    \u0275\u0275pipe(18, "translate");
    \u0275\u0275listener("keydown", function CasecardComponent_ng_container_17_Template_btn_keydown_15_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "toggleArchiveMenu"));
    });
    \u0275\u0275template(19, CasecardComponent_ng_container_17_icon_19_Template, 1, 0, "icon", 39)(20, CasecardComponent_ng_container_17_icon_20_Template, 1, 0, "icon", 40);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "mat-menu", 41, 1)(23, "div")(24, "h6", 42);
    \u0275\u0275text(25);
    \u0275\u0275pipe(26, "translate");
    \u0275\u0275pipe(27, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "div", 43)(29, "btn", 44);
    \u0275\u0275listener("click", function CasecardComponent_ng_container_17_Template_btn_click_29_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.updateArchiveStatus());
    })("keydown", function CasecardComponent_ng_container_17_Template_btn_keydown_29_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "updateArchiveStatus"));
    });
    \u0275\u0275text(30);
    \u0275\u0275pipe(31, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(32, "btn", 45);
    \u0275\u0275listener("keydown", function CasecardComponent_ng_container_17_Template_btn_keydown_32_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onButtonKeyDown($event, "closeMenu"));
    });
    \u0275\u0275text(33);
    \u0275\u0275pipe(34, "translate");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const delete_r9 = \u0275\u0275reference(22);
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(4, 12, "CASECARD.EDIT"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(7, 14, "CASECARD.GO_TO_CASE_FILES"), "");
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true)("matTooltip", \u0275\u0275pipeBind1(9, 16, "CASECARD.REALTIME_LOG_TOOLTIP"));
    \u0275\u0275advance(7);
    \u0275\u0275property("square", true)("matTooltip", ctx_r1.isArchive ? \u0275\u0275pipeBind1(17, 18, "CASECARD.UNARCHIVE_CASE") : \u0275\u0275pipeBind1(18, 20, "CASECARD.ARCHIVE_CASE"))("matMenuTriggerFor", delete_r9);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", !ctx_r1.isArchive);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isArchive);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.isArchive ? \u0275\u0275pipeBind1(26, 22, "CASECARD.CONFIRM_UNARCHIVE") : \u0275\u0275pipeBind1(27, 24, "CASECARD.CONFIRM_ARCHIVE"));
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(31, 26, "CASECARD.ARCHIVE"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(34, 28, "CASECARD.CANCEL"));
  }
}
var CasecardComponent = class _CasecardComponent {
  constructor(rolePermit, secureStorage, commonFunction, changeDetector, router, userPermission, socket) {
    this.rolePermit = rolePermit;
    this.secureStorage = secureStorage;
    this.commonFunction = commonFunction;
    this.changeDetector = changeDetector;
    this.router = router;
    this.userPermission = userPermission;
    this.socket = socket;
    this.presentationStatusTypes = PRESENTATION_STATUS_TYPES;
    this.notificationTypes = NOTIFICATION_TYPES;
    this.presentationEvents = PRESENTATION_EVENTS;
    this.caseCardActions = CASECARD_ACTIONS;
    this.buttonActions = BUTTON_ACTIONS;
    this.caseCardRoutes = CASECARD_ROUTES;
    this.ticketOpen = false;
    this.isAdmin = false;
    this.ticketCount = 0;
    this.sessionId = null;
    this.caseChange = new EventEmitter();
    this.myRoleId = 0;
    this.isCaseAdmin = false;
    this.isCanPresent = false;
    this.isCanRealtime = false;
    this.isCanView = false;
    this.presentationStatus = false;
    this.destroy$ = new Subject();
    this.formattedUpdateDate = computed(() => {
      if (!this.detail?.dUpdateDt) {
        return "";
      }
      return new DatePipe("en-US").transform(this.detail.dUpdateDt, "dd/MM/yyyy") || "";
    });
    this.setupSocketSubscriptions();
  }
  setupSocketSubscriptions() {
    this.socket.getUserNotifications().pipe(takeUntil(this.destroy$)).subscribe((res) => this.handleUserNotification(res));
    this.socket.getPresentationTools().pipe(takeUntil(this.destroy$)).subscribe((res) => this.handlePresentationEvent(res));
  }
  handleUserNotification(res) {
    try {
      if (!res?.nCaseid || this.detail?.nCaseid !== res.nCaseid) {
        return;
      }
      if (this.presentationStatusTypes.includes(res.cType)) {
        this.presentationStatus = true;
      } else if (!this.notificationTypes.includes(res.cType)) {
        return;
      }
      this.changeDetector.detectChanges();
    } catch (error) {
      throw new Error(`Error handling user notification: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  handlePresentationEvent(res) {
    if (!this.presentationEvents.includes(res?.event)) {
      return;
    }
    const shouldClearStatus = res.event === CASE_STATUS_CONDITIONS.EVENT_USER_MANAGE && res?.data?.cStatus === CASE_STATUS_CONDITIONS.STATUS_ACTIVE && res?.data?.cPermission === CASE_STATUS_CONDITIONS.PERMISSION_DENY || res.event === CASE_STATUS_CONDITIONS.EVENT_END;
    if (shouldClearStatus) {
      this.presentationStatus = false;
      this.changeDetector.detectChanges();
    }
  }
  ngAfterViewInit() {
    this.initializeComponent();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  initializeComponent() {
    return __async(this, null, function* () {
      try {
        this.userDetail = yield this.secureStorage.getUserInfo();
        yield this.initializePermissions();
        this.changeDetector.detectChanges();
      } catch (error) {
        throw new Error(`Error initializing casecard component: ${ErrorHandlerUtil.getErrorMessage(error)}`);
      }
    });
  }
  initializePermissions() {
    return __async(this, null, function* () {
      if (!this.isAdmin) {
        this.userId = yield this.secureStorage.getUserId();
        this.myRoleId = yield this.commonFunction.fetchRoleid(this.detail.teams, this.userId);
        this.isCaseAdmin = this.rolePermit.isAdmin(this.myRoleId);
      }
      const isAdmin = this.userDetail?.isAdmin || false;
      this.isCanPresent = isAdmin || this.rolePermit.isCanPresent(this.myRoleId, this.detail.jPermission);
      this.isCanRealtime = isAdmin || this.rolePermit.isHaveRealtime(this.detail.jPermission);
      this.isCanView = isAdmin || this.rolePermit.isHaveView(this.detail.jPermission);
    });
  }
  // Keyboard event handlers
  onTicketKeyDown(event) {
    if (this.isKeyboardTrigger(event)) {
      event.preventDefault();
      this.viewTicket();
    }
  }
  onButtonKeyDown(event, action) {
    if (this.isKeyboardTrigger(event)) {
      event.preventDefault();
      this.executeButtonAction(action, event);
    }
  }
  // Navigation and emission methods
  viewTicket() {
    this.caseChange.emit(CASECARD_ACTIONS.VIEW_TICKET);
  }
  editCase() {
    this.caseChange.emit(CASECARD_ACTIONS.EDIT);
  }
  goToCase() {
    this.navigateToCase();
  }
  goToAdmin() {
    try {
      if (!this.detail?.nCaseid) {
        throw new Error("Case ID is not available");
      }
      this.commonFunction.goto(CASECARD_ROUTES.CASE_BUILDER, { id: this.detail.nCaseid });
    } catch (error) {
      throw new Error(`Error navigating to admin: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  goToPresentation() {
    this.openPresentationWindow();
  }
  goToBundleManage() {
    try {
      if (!this.detail?.nCaseid) {
        throw new Error("Case ID is not available");
      }
      this.commonFunction.goto(CASECARD_ROUTES.BUNDLE_MANAGEMENT, { id: this.detail.nCaseid });
    } catch (error) {
      throw new Error(`Error navigating to bundle management: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  goToRealtimeLog() {
    try {
      if (!this.detail?.nCaseid) {
        throw new Error("Case ID is not available");
      }
      this.commonFunction.goto(CASECARD_ROUTES.REALTIME_LOG, { id: this.detail.nCaseid });
    } catch (error) {
      throw new Error(`Error navigating to realtime log: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  updateArchiveStatus() {
    try {
      const archiveAction = this.isArchive ? CASECARD_ACTIONS.ARCHIVE_FALSE : CASECARD_ACTIONS.ARCHIVE_TRUE;
      this.caseChange.emit(archiveAction);
    } catch (error) {
      throw new Error(`Error updating archive status: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  // Helper methods
  isKeyboardTrigger(event) {
    return event.key === "Enter" || event.key === " ";
  }
  executeButtonAction(action, event) {
    try {
      const actionMap = {
        [BUTTON_ACTIONS.GO_TO_CASE]: () => this.goToCase(),
        [BUTTON_ACTIONS.GO_TO_ADMIN]: () => this.goToAdmin(),
        [BUTTON_ACTIONS.GO_TO_PRESENTATION]: () => this.goToPresentation(),
        [BUTTON_ACTIONS.EDIT_CASE]: () => this.editCase(),
        [BUTTON_ACTIONS.GO_TO_BUNDLE_MANAGE]: () => this.goToBundleManage(),
        [BUTTON_ACTIONS.GO_TO_REALTIME_LOG]: () => this.goToRealtimeLog(),
        [BUTTON_ACTIONS.TOGGLE_ARCHIVE_MENU]: () => this.handleArchiveMenuToggle(event),
        [BUTTON_ACTIONS.UPDATE_ARCHIVE_STATUS]: () => this.updateArchiveStatus(),
        [BUTTON_ACTIONS.CLOSE_MENU]: () => this.handleCloseMenu(event)
      };
      const handler = actionMap[action];
      if (!handler) {
        throw new Error(`Unknown action: ${action}`);
      }
      handler();
    } catch (error) {
      throw new Error(`Error executing button action '${action}': ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  navigateToCase() {
    this.performNavigation();
  }
  performNavigation() {
    return __async(this, null, function* () {
      try {
        yield this.userPermission.userPermissionList(this.detail.nCaseid);
        this.commonFunction.goto(CASECARD_ROUTES.MY_FILES, { id: this.detail.nCaseid });
      } catch (error) {
        throw new Error(`Error navigating to case: ${ErrorHandlerUtil.getErrorMessage(error)}`);
      }
    });
  }
  openPresentationWindow() {
    try {
      const presentData = { id: this.detail.nCaseid };
      const url = this.router.serializeUrl(this.router.createUrlTree([CASECARD_ROUTES.PRESENTATION, JSON.stringify(presentData)]));
      globalThis.open(url, "_blank");
    } catch (error) {
      throw new Error(`Error opening presentation window: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  handleArchiveMenuToggle(event) {
    const menuTrigger = event.target.closest("[matMenuTriggerFor]");
    if (menuTrigger) {
      menuTrigger.click();
    }
  }
  handleCloseMenu(event) {
    const menu = event.target.closest("mat-menu");
    if (menu) {
      menu.closed.emit();
    }
  }
  // Track by functions
  trackByTeam(index, team) {
    return team.nTeamid;
  }
  trackByUser(index, user) {
    return user.nUserid;
  }
  static {
    this.\u0275fac = function CasecardComponent_Factory(t) {
      return new (t || _CasecardComponent)(\u0275\u0275directiveInject(RolepermitService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(UserPermissionService), \u0275\u0275directiveInject(SocketService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CasecardComponent, selectors: [["casecard"]], inputs: { ticketOpen: "ticketOpen", detail: "detail", isAdmin: "isAdmin", ticketCount: "ticketCount", sessionId: "sessionId", isArchive: "isArchive" }, outputs: { caseChange: "caseChange" }, standalone: true, features: [\u0275\u0275ProvidersFeature([DatePipe]), \u0275\u0275StandaloneFeature], decls: 18, vars: 19, consts: [["t", "matMenuTrigger"], ["delete", "matMenu"], [1, "p-5", "group", "rounded-base", "border", "relative", "border-white", "w-80", "flex-col", "h-[357px]", "hover:bg-transparent", "bg-white", "hover:text-white", "text-grey", "flex", "justify-center-center"], ["class", "absolute top-0 right-5 -translate-y-1/2 px-3 py-1 flex items-center justify-center text-xs text-white gap-3 cursor-pointer border w-fit rounded-full border-white", 3, "class", "click", "keydown", 4, "ngIf"], [1, "text-lg", "font-semibold", "block"], [1, "text-xxs"], [2, "user-select", "all"], [4, "ngIf"], [1, "card-scroll-area", "overflow-y-auto", "h-full", 3, "ngClass"], [1, "flex", "flex-col", "gap-2.5"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "absolute", "top-0", "right-5", "-translate-y-1/2", "px-3", "py-1", "flex", "items-center", "justify-center", "text-xs", "text-white", "gap-3", "cursor-pointer", "border", "w-fit", "rounded-full", "border-white", 3, "click", "keydown"], ["name", "chvx", 1, "text-[10px]"], [1, "text-sm", "font-semibold", "mb-2.5", "block"], [1, "flex", "gap-2.5", "flex-wrap"], ["size", "lg", 3, "detail", "matTooltip", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["width", "35px", "class", "opacity-50", "src", "assets/nouser.svg", 3, "alt", 4, "ngIf"], ["size", "lg", 3, "detail", "matTooltip"], ["width", "35px", "src", "assets/nouser.svg", 1, "opacity-50", 3, "alt"], [1, "flex", "justify-end", "gap-2", "mt-auto"], ["mode", "solid", "class", "me-auto", 3, "matTooltip", "click", "keydown", 4, "ngIf"], ["mode", "outlined", "addcls", "hover:bg-white border-none", 3, "matTooltip", "square", "click", "keydown", 4, "ngIf"], ["mode", "solid", 1, "me-auto", 3, "click", "keydown", "matTooltip"], ["mode", "outlined", "addcls", "hover:bg-white border-none", 3, "click", "keydown", "matTooltip", "square"], ["name", "setting", 1, "text-base"], ["mode", "outlined", "hidden", "", "matTooltip", "Present evidence electronically", "addcls", "hover:bg-white", 3, "click", "keydown", "square"], ["mode", "outlined", "addcls", "hover:bg-white", 3, "click", "keydown", "matTooltip", "square"], ["class", "size-2.5 rounded-full bg-brand block absolute -top-[3px] -right-[3px]", 4, "ngIf"], [1, "size-2.5", "rounded-full", "bg-brand", "block", "absolute", "-top-[3px]", "-right-[3px]"], [1, "hidden", "justify-end", "gap-2", "group-hover:flex", "mt-auto"], ["mode", "dark", "addcls", "[&:not(:hover)]:bg-white [&:not(:hover)]:text-blue-on", 3, "click", "keydown"], ["mode", "dark", "addcls", "[&:not(:hover)]:bg-white [&:not(:hover)]:text-blue-on", 1, "me-auto", 3, "click", "keydown"], ["mode", "dark", 3, "click", "keydown", "square", "matTooltip"], ["xmlns", "http://www.w3.org/2000/svg", "width", "20", "height", "20", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "1.25", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "lucide", "lucide-list-video"], ["d", "M12 12H3"], ["d", "M16 6H3"], ["d", "M12 18H3"], ["d", "m16 12 5 3-5 3v-6Z"], ["mode", "dark", 3, "keydown", "square", "matTooltip", "matMenuTriggerFor"], ["name", "archive", "type", "adminicn", "class", "text-lg", 4, "ngIf"], ["name", "upload", "type", "adminicn", "class", "text-lg", 4, "ngIf"], [1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click", "keydown"], ["mode", "dark", 3, "keydown"], ["name", "archive", "type", "adminicn", 1, "text-lg"], ["name", "upload", "type", "adminicn", 1, "text-lg"]], template: function CasecardComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 2);
        \u0275\u0275template(1, CasecardComponent_span_1_Template, 4, 8, "span", 3);
        \u0275\u0275elementStart(2, "span", 4);
        \u0275\u0275text(3);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "span", 5);
        \u0275\u0275text(5);
        \u0275\u0275pipe(6, "translate");
        \u0275\u0275elementStart(7, "span", 6);
        \u0275\u0275text(8);
        \u0275\u0275template(9, CasecardComponent_b_9_Template, 2, 1, "b", 7);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "span", 5);
        \u0275\u0275text(11);
        \u0275\u0275pipe(12, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "div", 8)(14, "div", 9);
        \u0275\u0275template(15, CasecardComponent_div_15_Template, 6, 4, "div", 10);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(16, CasecardComponent_ng_container_16_Template, 5, 3, "ng-container", 7)(17, CasecardComponent_ng_container_17_Template, 35, 30, "ng-container", 7);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.ticketCount);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(ctx.detail.cCasename);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(6, 12, "CASECARD.CASE_NO"), " ");
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1("", ctx.detail.cCaseno, " ");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.isAdmin);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate2("", \u0275\u0275pipeBind1(12, 14, "CASECARD.LAST_UPLOADED"), "", ctx.formattedUpdateDate(), "");
        \u0275\u0275advance(2);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(16, _c0, ctx.isAdmin, !ctx.isAdmin));
        \u0275\u0275advance(2);
        \u0275\u0275property("ngForOf", ctx.detail.teams)("ngForTrackBy", ctx.trackByTeam);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.isAdmin);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.isAdmin);
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, AvatarComponent, ButtonComponent, MatTooltipModule, MatTooltip, ScrollingModule, IconComponent, MatMenuModule, MatMenu, MatMenuTrigger, TranslateModule, TranslatePipe], styles: ["\n\n.card-scroll-area[_ngcontent-%COMP%] {\n  scrollbar-width: thin;\n  scrollbar-color: transparent transparent;\n}\n.card-scroll-area[_ngcontent-%COMP%]:hover {\n  scrollbar-color: rgba(255, 255, 255, 0.3137254902) transparent;\n}\n.card-scroll-area[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 4px;\n}\n.card-scroll-area[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: transparent;\n}\n.card-scroll-area[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background-color: transparent;\n  border-radius: 4px;\n}\n.card-scroll-area[_ngcontent-%COMP%]:hover::-webkit-scrollbar-thumb {\n  background-color: rgba(255, 255, 255, 0.3137254902);\n}\n.card-scroll-area[_ngcontent-%COMP%]:hover::-webkit-scrollbar-thumb:hover {\n  background-color: rgba(255, 255, 255, 0.4392156863);\n}\n/*# sourceMappingURL=casecard.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CasecardComponent, { className: "CasecardComponent", filePath: "src\\app\\shared\\components\\casecard\\casecard.component.ts", lineNumber: 34 });
})();

export {
  CasecardComponent
};
//# sourceMappingURL=chunk-6EXNCTOQ.js.map
