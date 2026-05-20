import {
  PresentToolService
} from "./chunk-DTW5ASI5.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
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
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
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
  ɵɵpureFunction3,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/individual/present-tool/present-tool.component.ts
var PresentToolComponent_Conditional_19_Defer_1_DepsFn = () => [import("./chunk-E3XQFIFA.js").then((m) => m.PresentUserControllerComponent)];
var PresentToolComponent_Conditional_20_Conditional_0_Defer_1_DepsFn = () => [import("./chunk-N7NVS5YX.js").then((m) => m.ScreenShareComponent)];
var PresentToolComponent_Conditional_20_Conditional_1_Defer_1_DepsFn = () => [import("./chunk-7FNPDHCH.js").then((m) => m.ScreenViewerComponent)];
var _c0 = (a0, a1, a2) => ({ "bg-blue-on": a0, "hover:bg-blue-on": a1, "flex": a2 });
function PresentToolComponent_Conditional_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 15);
    \u0275\u0275listener("click", function PresentToolComponent_Conditional_2_Conditional_0_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.managePresentStatus(ctx_r1.cStatus == "L" ? "P" : "L"));
    });
    \u0275\u0275element(1, "icon", 16);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.cStatus == "I" ? "Click to Go Live" : "Live", " ");
  }
}
function PresentToolComponent_Conditional_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 17)(1, "span", 18);
    \u0275\u0275listener("click", function PresentToolComponent_Conditional_2_Conditional_1_Template_span_click_1_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.managePresentStatus("L"));
    });
    \u0275\u0275element(2, "icon", 16);
    \u0275\u0275text(3, " Click to go live ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 19);
    \u0275\u0275listener("click", function PresentToolComponent_Conditional_2_Conditional_1_Template_span_click_4_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.managePresentStatus("L"));
    });
    \u0275\u0275element(5, "icon", 20);
    \u0275\u0275text(6, " Pause ");
    \u0275\u0275elementEnd()();
  }
}
function PresentToolComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentToolComponent_Conditional_2_Conditional_0_Template, 3, 1, "button", 14)(1, PresentToolComponent_Conditional_2_Conditional_1_Template, 7, 0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, ctx_r1.cStatus == "L" || ctx_r1.cStatus == "I" ? 0 : 1);
  }
}
function PresentToolComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "avtr", 5);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("detail", ctx_r1.presentDetail)("matTooltip", ctx_r1.presentDetail.cFname + " " + ctx_r1.presentDetail.cLname);
  }
}
function PresentToolComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 8);
  }
}
function PresentToolComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", (ctx_r1.presentDetail == null ? null : ctx_r1.presentDetail.totalusers) || 0, " ");
  }
}
function PresentToolComponent_Conditional_15_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 24);
    \u0275\u0275listener("click", function PresentToolComponent_Conditional_15_Conditional_0_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.StartScreenSharing(false));
    });
    \u0275\u0275text(1, "Stop Screen sharing ");
    \u0275\u0275elementEnd();
  }
}
function PresentToolComponent_Conditional_15_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 24);
    \u0275\u0275listener("click", function PresentToolComponent_Conditional_15_Conditional_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.StartScreenSharing(true));
    });
    \u0275\u0275text(1, "Start Screen sharing ");
    \u0275\u0275elementEnd();
  }
}
function PresentToolComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275template(0, PresentToolComponent_Conditional_15_Conditional_0_Template, 2, 0, "btn", 22)(1, PresentToolComponent_Conditional_15_Conditional_1_Template, 2, 0);
    \u0275\u0275elementStart(2, "btn", 23);
    \u0275\u0275listener("click", function PresentToolComponent_Conditional_15_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.endPresentation());
    });
    \u0275\u0275text(3, "End Presentation ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "btn", 23);
    \u0275\u0275listener("click", function PresentToolComponent_Conditional_15_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.hideControles = !ctx_r1.hideControles);
    });
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, ctx_r1.isScreenSharing ? 0 : 1);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("", ctx_r1.hideControles ? "Show Controles" : "Hide Controles", " ");
  }
}
function PresentToolComponent_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 22);
    \u0275\u0275text(1, "Ask for assistance ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "btn", 23);
    \u0275\u0275listener("click", function PresentToolComponent_Conditional_16_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.pausePresent());
    });
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.isPaused ? "Resume" : "Pause");
  }
}
function PresentToolComponent_Conditional_19_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "present-user-controller", 25);
    \u0275\u0275twoWayListener("active_teamsChange", function PresentToolComponent_Conditional_19_Defer_0_Template_present_user_controller_active_teamsChange_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.active_teams, $event) || (ctx_r1.active_teams = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("active_teamsChange", function PresentToolComponent_Conditional_19_Defer_0_Template_present_user_controller_active_teamsChange_0_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.checkForReq());
    });
    \u0275\u0275twoWayListener("global_teamsChange", function PresentToolComponent_Conditional_19_Defer_0_Template_present_user_controller_global_teamsChange_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.global_teams, $event) || (ctx_r1.global_teams = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("onEvent", function PresentToolComponent_Conditional_19_Defer_0_Template_present_user_controller_onEvent_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.OnUserControll($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    const z_r9 = \u0275\u0275reference(6);
    \u0275\u0275property("nPresentid", ctx_r1.nPresentid);
    \u0275\u0275twoWayProperty("active_teams", ctx_r1.active_teams)("global_teams", ctx_r1.global_teams);
    \u0275\u0275property("menuOpen", z_r9.menuOpen);
  }
}
function PresentToolComponent_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentToolComponent_Conditional_19_Defer_0_Template, 1, 4);
    \u0275\u0275defer(1, 0, PresentToolComponent_Conditional_19_Defer_1_DepsFn);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275deferWhen(ctx_r1.isHost);
  }
}
function PresentToolComponent_Conditional_20_Conditional_0_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "screen-share", 26);
    \u0275\u0275twoWayListener("isScreenSharingChange", function PresentToolComponent_Conditional_20_Conditional_0_Defer_0_Template_screen_share_isScreenSharingChange_0_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r1.isScreenSharing, $event) || (ctx_r1.isScreenSharing = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("presentDetail", ctx_r1.presentDetail);
    \u0275\u0275twoWayProperty("isScreenSharing", ctx_r1.isScreenSharing);
  }
}
function PresentToolComponent_Conditional_20_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentToolComponent_Conditional_20_Conditional_0_Defer_0_Template, 1, 2);
    \u0275\u0275defer(1, 0, PresentToolComponent_Conditional_20_Conditional_0_Defer_1_DepsFn);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275deferWhen(ctx_r1.isHost);
  }
}
function PresentToolComponent_Conditional_20_Conditional_1_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "screen-viewer", 27);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("presentDetail", ctx_r1.presentDetail);
  }
}
function PresentToolComponent_Conditional_20_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentToolComponent_Conditional_20_Conditional_1_Defer_0_Template, 1, 1);
    \u0275\u0275defer(1, 0, PresentToolComponent_Conditional_20_Conditional_1_Defer_1_DepsFn);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275deferWhen(!ctx_r1.isHost);
  }
}
function PresentToolComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentToolComponent_Conditional_20_Conditional_0_Template, 3, 1)(1, PresentToolComponent_Conditional_20_Conditional_1_Template, 3, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, ctx_r1.isHost ? 0 : 1);
  }
}
var PresentToolComponent = class _PresentToolComponent {
  constructor(presentToolService, cdr, socket, tost) {
    this.presentToolService = presentToolService;
    this.cdr = cdr;
    this.socket = socket;
    this.tost = tost;
    this.isPausedChange = new EventEmitter();
    this.presentEvents = new EventEmitter();
    this.cStatus = "I";
    this.cStatusChange = new EventEmitter();
    this.documentList = [];
    this.presentDetail = {};
    this.active_teams = [];
    this.global_teams = [];
    this.isEndPresentation = false;
    this.isEndPresentationChange = new EventEmitter();
    this.isScreenSharing = false;
    this.isScreenSharingChange = new EventEmitter();
    this.isLoaded = false;
    this.isHaveRequest = false;
    this.hideControles = false;
    this.presentSubscribe = this.socket.getPresentationTools().subscribe((res) => {
      const data = res?.data;
      if (res.event == "ASK-REQ") {
        const team = this.active_teams.find((a) => a.users.find((b) => b.nUserid == data.nAskby));
        if (team) {
          const usr = team.users.find((a) => a.nUserid == data.nAskby);
          usr.cAStatus = "RQ";
        }
        this.active_teams = [...this.active_teams];
        this.checkForReq();
        this.cdr.detectChanges();
      } else if (res.event == "USER-COUNT-UPDATED") {
        if (res.data.nTotal) {
          this.presentDetail.totalusers = res.data.nTotal;
          this.cdr.detectChanges();
        }
      }
    });
    this.presentPositionSubscribe = this.socket.getPresentationPosition().subscribe((data) => {
      if (this.isHost || this.isPaused)
        return;
      this.presentEvents.emit({ event: "PRESENT-POSITION", data });
    });
    this.presentTabSubscribe = this.socket.getPresentationTab().subscribe((data) => {
      if (this.isHost || this.isPaused)
        return;
      this.presentEvents.emit({ event: "PRESENT-TAB-CHANGE", data });
    });
    this.presentHighlightSubscribe = this.socket.getPresentHighlights().subscribe((e) => {
      if (this.isHost || this.isPaused)
        return;
      this.presentEvents.emit(e);
    });
    this.presentationSubscribe = this.socket.getPresentations().subscribe((res) => {
      const data = res?.data;
      if (res.event == "USER-JOINED" || res.event == "USER-LEFT") {
        const team = this.active_teams.find((a) => a.users.find((b) => b.nUserid == data.nUserid));
        if (team) {
          const usr = team.users.find((a) => a.nUserid == data.nUserid);
          usr.isLive = res.event == "USER-JOINED";
        }
        this.active_teams = [...this.active_teams];
        this.cdr.detectChanges();
      }
    });
    this.presentCompareSubscribe = this.socket.getPresentCompare().subscribe((data) => {
      if (this.isHost || this.isPaused)
        return;
      this.presentEvents.emit({ event: "PRESENT-COMPARE", data });
    });
    this.presentCompareDataSubscribe = this.socket.getPresentCompareData().subscribe((data) => {
      if (this.isHost || this.isPaused)
        return;
      this.presentEvents.emit({ event: "PRESENT-COMPARE-DATA", data });
    });
    this.socket.getPresentCallout().subscribe((data) => {
      if (this.isHost || this.isPaused)
        return;
      this.presentEvents.emit({ event: "PRESENT-CALLOUT", data });
    });
    this.socket.getPresentCalloutDismiss().subscribe((data) => {
      if (this.isHost || this.isPaused)
        return;
      this.presentEvents.emit({ event: "PRESENT-CALLOUT-DISMISS", data });
    });
    this.socket.getPresentCalloutHighlight().subscribe((data) => {
      if (this.isHost || this.isPaused)
        return;
      this.presentEvents.emit({ event: "PRESENT-CALLOUT-HIGHLIGHT", data });
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.presentDetail = yield this.presentToolService.getPresentInfo(this.nPresentid);
      this.cStatus = this.presentDetail.cStatus;
      this.cStatusChange.emit(this.cStatus);
      this.isLoaded = true;
      this.cdr.detectChanges();
    });
  }
  managePresentStatus(Status) {
    return __async(this, null, function* () {
      if (!this.documentList?.length) {
        this.tost.error("No document selected");
        return;
      }
      const res = yield this.presentToolService.managePresentStatus(this.nPresentid, Status);
      if (res.msg == 1) {
        this.cStatus = Status;
        this.cStatusChange.emit(this.cStatus);
      } else {
        this.tost.error(res["value"]);
      }
      this.cdr.detectChanges();
    });
  }
  pausePresent() {
    this.isPaused = !this.isPaused;
    this.isPausedChange.emit(this.isPaused);
    if (!this.isPaused) {
      this.presentEvents.emit({ event: "UNPAUSED", data: {} });
    } else {
      this.presentEvents.emit({ event: "PAUSED", data: {} });
    }
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    try {
      if (this.presentSubscribe) {
        this.presentSubscribe.unsubscribe();
      }
      if (this.presentPositionSubscribe) {
        this.presentPositionSubscribe.unsubscribe();
      }
      if (this.presentTabSubscribe) {
        this.presentTabSubscribe.unsubscribe();
      }
      if (this.presentHighlightSubscribe) {
        this.presentHighlightSubscribe.unsubscribe();
      }
      if (this.presentationSubscribe) {
        this.presentHighlightSubscribe.unsubscribe();
      }
      if (this.presentCompareSubscribe) {
        this.presentCompareSubscribe.unsubscribe();
      }
      if (this.presentCompareDataSubscribe) {
        this.presentCompareDataSubscribe.unsubscribe();
      }
    } catch (error) {
    }
  }
  endPresentation() {
    this.isEndPresentation = true;
    this.isEndPresentationChange.emit(this.isEndPresentation);
    this.cdr.detectChanges();
  }
  StartScreenSharing(val) {
    this.isScreenSharing = val;
    this.isScreenSharingChange.emit(this.isScreenSharing);
    this.cdr.detectChanges();
  }
  OnUserControll(e) {
    if (e.event == "USER-UPDATED") {
      this.ngOnInit();
    }
  }
  checkForReq() {
    this.isHaveRequest = false;
    try {
      const team = this.active_teams.find((a) => a.users.find((b) => b.cAStatus == "RQ"));
      this.isHaveRequest = team ? true : false;
    } catch (error) {
    }
    this.cdr.detectChanges();
  }
  static {
    this.\u0275fac = function PresentToolComponent_Factory(t) {
      return new (t || _PresentToolComponent)(\u0275\u0275directiveInject(PresentToolService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PresentToolComponent, selectors: [["present-tool"]], inputs: { nPresentid: "nPresentid", isHost: "isHost", nIndexid: "nIndexid", isPaused: "isPaused", cStatus: "cStatus", documentList: "documentList", isEndPresentation: "isEndPresentation", isScreenSharing: "isScreenSharing" }, outputs: { isPausedChange: "isPausedChange", presentEvents: "presentEvents", cStatusChange: "cStatusChange", isEndPresentationChange: "isEndPresentationChange", isScreenSharingChange: "isScreenSharingChange" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 21, vars: 16, consts: [["z", "matMenuTrigger"], ["options", "matMenu"], ["menu", "matMenu"], [1, "flex", "items-center"], [1, "flex", "items-center", "bg-dark-blue", "h-[50px]", "pe-5", "gap-2.5", "rounded-bl-base", "overflow-hidden"], ["size", "sm", 1, "flex", 3, "detail", "matTooltip"], [1, "px-2.5", "items-center", "gap-2", "h-8.5", "rounded-base", "text-white", 3, "matMenuTriggerFor", "hidden", "ngClass"], ["name", "user", 1, "text-base"], ["width", "20px", "src", "../../../../../assets/icon/bellanimation.gif", 1, "-mx-1"], ["mode", "darkwhite", "square", "", 3, "matMenuTriggerFor"], ["name", "menu"], [1, "!bg-dark-blue", "p-3", "rounded-base", "mt-4", "max-h-fit", "!overflow-visible"], [1, "flex", "flex-col", "gap-2.5"], ["xPosition", "before", 1, "!bg-transparent", "!shadow-none", "mt-3.5", "-me-2", "max-h-fit", "!overflow-visible"], [1, "rounded-base", "text-lg", "h-8.5", "bg-[#4CB864]", "border", "border-white", "px-3", "text-white", "relative", "z-10", "translate-x-3", "flex", "items-center", "gap-2"], [1, "rounded-base", "text-lg", "h-8.5", "bg-[#4CB864]", "border", "border-white", "px-3", "text-white", "relative", "z-10", "translate-x-3", "flex", "items-center", "gap-2", 3, "click"], ["name", "play", "type", "real_icn", 1, "text-lg"], [1, "rounded-base", "text-lg", "h-8.5", "group", "gap-2", "border", "border-white", "px-3", "text-white", "relative", "z-10", "translate-x-3", "bg-blue-on", "hover:bg-[#4CB864]"], [1, "group-hover:flex", "hidden", "items-center", "gap-3", 3, "click"], [1, "group-hover:hidden", "flex", "items-center", "gap-2", 3, "click"], ["name", "pause", "type", "real_icn", 1, "text-lg"], [1, "size-5", "flex", "items-center", "justify-center", "rounded-full", "text-xxs", "bg-tab", "text-dark-blue"], ["mode", "gradient", "addcls", "rounded-full w-[170px]"], ["mode", "white", "addcls", "!text-blue-on hover:!bg-white rounded-full w-[170px]", 3, "click"], ["mode", "gradient", "addcls", "rounded-full w-[170px]", 3, "click"], [3, "active_teamsChange", "global_teamsChange", "onEvent", "nPresentid", "active_teams", "global_teams", "menuOpen"], [3, "isScreenSharingChange", "presentDetail", "isScreenSharing"], [3, "presentDetail"]], template: function PresentToolComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div")(1, "div", 3);
        \u0275\u0275template(2, PresentToolComponent_Conditional_2_Template, 2, 1);
        \u0275\u0275elementStart(3, "div", 4);
        \u0275\u0275template(4, PresentToolComponent_Conditional_4_Template, 1, 2, "avtr", 5);
        \u0275\u0275elementStart(5, "div", 6, 0);
        \u0275\u0275element(7, "icon", 7);
        \u0275\u0275template(8, PresentToolComponent_Conditional_8_Template, 1, 0, "img", 8)(9, PresentToolComponent_Conditional_9_Template, 2, 1);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(10, "btn", 9);
        \u0275\u0275element(11, "icon", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "mat-menu", 11, 1)(14, "div", 12);
        \u0275\u0275template(15, PresentToolComponent_Conditional_15_Template, 6, 2)(16, PresentToolComponent_Conditional_16_Template, 4, 1);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(17, "mat-menu", 13, 2);
        \u0275\u0275template(19, PresentToolComponent_Conditional_19_Template, 3, 1);
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(20, PresentToolComponent_Conditional_20_Template, 2, 1);
      }
      if (rf & 2) {
        const z_r9 = \u0275\u0275reference(6);
        const options_r11 = \u0275\u0275reference(13);
        const menu_r12 = \u0275\u0275reference(18);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(2, ctx.isHost && !ctx.nIndexid && !ctx.hideControles ? 2 : -1);
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.isHost ? "ps-7" : "ps-5");
        \u0275\u0275advance();
        \u0275\u0275conditional(4, !ctx.hideControles ? 4 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("matMenuTriggerFor", ctx.isHost ? menu_r12 : null)("hidden", ctx.hideControles)("ngClass", \u0275\u0275pureFunction3(12, _c0, z_r9.menuOpen, ctx.isHost, !ctx.hideControles));
        \u0275\u0275advance(3);
        \u0275\u0275conditional(8, ctx.isHaveRequest ? 8 : 9);
        \u0275\u0275advance(2);
        \u0275\u0275property("matMenuTriggerFor", options_r11);
        \u0275\u0275advance(5);
        \u0275\u0275conditional(15, ctx.isHost ? 15 : 16);
        \u0275\u0275advance(4);
        \u0275\u0275conditional(19, ctx.isHost ? 19 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(20, ctx.isLoaded ? 20 : -1);
      }
    }, dependencies: [AvatarComponent, IconComponent, ButtonComponent, MatMenuModule, MatMenu, MatMenuTrigger, MatTooltipModule, MatTooltip, NgClass], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PresentToolComponent, { className: "PresentToolComponent", filePath: "src\\app\\presentation\\components\\individual\\present-tool\\present-tool.component.ts", lineNumber: 27 });
})();
export {
  PresentToolComponent
};
//# sourceMappingURL=chunk-4KIS6IZO.js.map
