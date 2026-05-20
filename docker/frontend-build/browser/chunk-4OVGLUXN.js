import {
  PresentService
} from "./chunk-DRZF5GH5.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
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
import "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  Router
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
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
  ɵɵpureFunction0,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/individual/present-popup/present-popup.component.ts
var _c0 = () => ["R", "P", "RQ", "A"];
function PresentPopupComponent_Conditional_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 3)(2, "div")(3, "h6", 4);
    \u0275\u0275text(4, " Please wait ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "h6", 5);
    \u0275\u0275text(6, " The presenter has paused the presentation ");
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 6);
    \u0275\u0275element(8, "circle", 7);
    \u0275\u0275elementStart(9, "circle", 8);
    \u0275\u0275element(10, "animateTransform", 9);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275element(11, "div");
    \u0275\u0275elementEnd()();
  }
}
function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 3)(2, "div")(3, "h6", 4);
    \u0275\u0275text(4, " Please wait ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "h6", 5);
    \u0275\u0275text(6, " Until the presenter accepts your request ");
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 6);
    \u0275\u0275element(8, "circle", 7);
    \u0275\u0275elementStart(9, "circle", 8);
    \u0275\u0275element(10, "animateTransform", 9);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275element(11, "div");
    \u0275\u0275elementEnd()();
  }
}
function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "div")(2, "div")(3, "h6", 4);
    \u0275\u0275text(4, " Do you want to include current presenter's note? ");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(5, "div");
    \u0275\u0275elementStart(6, "div", 10)(7, "btn", 11);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_0_Template_btn_click_7_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.joinPresentation("Y"));
    });
    \u0275\u0275text(8, "Include");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "btn", 12);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_0_Template_btn_click_9_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.joinPresentation("N"));
    });
    \u0275\u0275text(10, "Join without note");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(7);
    \u0275\u0275property("isloading", ctx_r1.isJoining)("disabled", ctx_r1.isJoining);
    \u0275\u0275advance(2);
    \u0275\u0275property("isloading", ctx_r1.isJoining)("disabled", ctx_r1.isJoining);
  }
}
function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "div", 13)(2, "div")(3, "h6", 4);
    \u0275\u0275text(4, " Present denied your request request to rejoin ");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(5, "div");
    \u0275\u0275elementStart(6, "div", 10)(7, "btn", 14);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_1_Template_btn_click_7_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.RequestToReJoin());
    });
    \u0275\u0275text(8, "Request to rejoin");
    \u0275\u0275elementEnd()()()();
  }
}
function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "div", 15)(2, "div")(3, "h6", 4);
    \u0275\u0275text(4, " Presentation paused. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "h6", 5);
    \u0275\u0275text(6, " Your viewer permission is on pause. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 6);
    \u0275\u0275element(8, "circle", 7);
    \u0275\u0275elementStart(9, "circle", 8);
    \u0275\u0275element(10, "animateTransform", 9);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275element(11, "div");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "div", 16)(13, "btn", 17);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_2_Template_btn_click_13_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.gotoHome());
    });
    \u0275\u0275text(14, "OK");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "btn", 14);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_2_Template_btn_click_15_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.RequestToReJoin());
    });
    \u0275\u0275text(16, "Request to rejoin");
    \u0275\u0275elementEnd()()();
  }
}
function PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_0_Template, 11, 4, "div")(1, PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_1_Template, 9, 0)(2, PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Conditional_2_Template, 17, 0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275conditional(0, (ctx_r1.presentDetail == null ? null : ctx_r1.presentDetail.cUAStatus) == "A" ? 0 : (ctx_r1.presentDetail == null ? null : ctx_r1.presentDetail.cUAStatus) == "R" ? 1 : 2);
  }
}
function PresentPopupComponent_Conditional_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentPopupComponent_Conditional_0_Conditional_4_Conditional_0_Template, 12, 0, "div")(1, PresentPopupComponent_Conditional_0_Conditional_4_Conditional_1_Template, 3, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, (ctx_r1.presentDetail == null ? null : ctx_r1.presentDetail.cUAStatus) == "RQ" ? 0 : 1);
  }
}
function PresentPopupComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275element(1, "div", 1);
    \u0275\u0275elementStart(2, "div", 2);
    \u0275\u0275template(3, PresentPopupComponent_Conditional_0_Conditional_3_Template, 12, 0, "div")(4, PresentPopupComponent_Conditional_0_Conditional_4_Template, 2, 1);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275conditional(3, (ctx_r1.presentDetail == null ? null : ctx_r1.presentDetail.cStatus) == "P" ? 3 : 4);
  }
}
function PresentPopupComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275element(1, "div", 1);
    \u0275\u0275elementStart(2, "div", 18)(3, "div", 13)(4, "div")(5, "h6", 4);
    \u0275\u0275text(6, " Would you like to save all presenter\u2019s note? ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "h6", 5);
    \u0275\u0275text(8, " Presenter\u2019s note was auto-saved and shared to all attendees. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(9, "div");
    \u0275\u0275elementStart(10, "div", 10)(11, "btn", 17);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_1_Template_btn_click_11_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onEnd(true));
    });
    \u0275\u0275text(12, "Save notes");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "btn", 14);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_1_Template_btn_click_13_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onEnd(false));
    });
    \u0275\u0275text(14, "Don't save");
    \u0275\u0275elementEnd()()()()();
  }
}
function PresentPopupComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0)(1, "div", 19);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_2_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.close());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 18)(3, "div", 13)(4, "div")(5, "h6", 4);
    \u0275\u0275text(6, " End this presentation ? ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "h6", 5);
    \u0275\u0275text(8, " Presenter\u2019s note was auto-saved and shared to all attendees. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 20)(10, "btn", 17);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_2_Template_btn_click_10_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.endPresentation());
    });
    \u0275\u0275text(11, "End");
    \u0275\u0275elementEnd()()()()();
  }
}
function PresentPopupComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275element(1, "div", 1);
    \u0275\u0275elementStart(2, "div", 18)(3, "div", 13)(4, "div")(5, "h6", 5);
    \u0275\u0275text(6, " Presenter\u2019s note during pause will saved. ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 21)(8, "btn", 17);
    \u0275\u0275listener("click", function PresentPopupComponent_Conditional_3_Template_btn_click_8_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closePausedDialog());
    });
    \u0275\u0275text(9, "Close");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "mat-checkbox", 22);
    \u0275\u0275twoWayListener("ngModelChange", function PresentPopupComponent_Conditional_3_Template_mat_checkbox_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.bShowAgain, $event) || (ctx_r1.bShowAgain = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275text(11, "Do not show again ");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(10);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.bShowAgain);
  }
}
var PresentPopupComponent = class _PresentPopupComponent {
  constructor(presentSerice, cdr, socket, store, tost, router) {
    this.presentSerice = presentSerice;
    this.cdr = cdr;
    this.socket = socket;
    this.store = store;
    this.tost = tost;
    this.router = router;
    this.presentEvents = new EventEmitter();
    this.isEndPresentationChange = new EventEmitter();
    this.isJoining = false;
    this.isPresentationEnded = false;
    this.showPausedDialog = false;
    this.bShowAgain = false;
    this.presentSubscribe = this.socket.getPresentationTools().subscribe((res) => {
      const data = res?.data;
      if (this.isPaused)
        return;
      if (["PAUSED", "LIVE"].includes(res.event)) {
        if (data.cStatus == "L" && this.presentDetail.cStatus == "P" && !this.presentDetail?.isHost) {
          this.presentEvents.emit({ event: "REFRESH-PRESENTATION", data: {} });
        }
        this.presentDetail.cStatus = data.cStatus;
      } else if (res.event == "END") {
        this.isPresentationEnded = true;
        this.cdr.detectChanges();
      } else if (res.event == "USER-MANAGE") {
        if (data.nPresentid != this.nPresentid)
          return;
        if (data.cPermission == "E") {
          this.presentDetail.cUStatus = data.cStatus;
          if (data.cStatus == "A") {
            this.presentEvents.emit({ event: "USER-JOINED", data: {} });
          }
        } else if (data.cPermission == "D") {
          this.presentDetail.cUStatus = null;
          this.presentEvents.emit({ event: "USER-REMOVED", data: {} });
        }
      } else if (res.event == "REQ-MANAGE") {
        if (data.nPresentid != this.nPresentid)
          return;
        this.presentDetail.cUAStatus = data.cStatus;
        if (this.presentDetail.cUStatus == "I" && data.cStatus == "A") {
          this.presentDetail.cUStatus = data.cStatus == "A" ? "A" : "I";
          this.joinPresentation("Y");
          return;
        }
        this.presentDetail.cUStatus = data.cStatus == "A" ? "A" : "I";
        if (data.cStatus == "A") {
          if (!data.isHaveHighlight) {
            this.presentDetail.cUAStatus = "J";
            this.presentEvents.emit({ event: "USER-JOINED", data: {} });
          }
        }
      }
      this.cdr.detectChanges();
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.nUserid = yield this.store.getUserId();
      this.bShowAgain = JSON.parse(this.store.getStorage("bShowAgain")) || false;
      this.cdr.detectChanges();
    });
  }
  RequestToReJoin() {
    this.presentDetail.cUAStatus = "RQ";
    this.presentSerice.requestToJoin(this.nPresentid);
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    try {
      if (this.presentSubscribe) {
        this.presentSubscribe.unsubscribe();
      }
      this.socket.leavePresentation(this.nPresentid, this.nUserid);
    } catch (error) {
    }
  }
  endPresentation() {
    return __async(this, null, function* () {
      yield this.presentSerice.endPresentation(this.nPresentid);
      this.presentEvents.emit({ event: "PRESENTATION-END", data: {} });
    });
  }
  joinPresentation(flag) {
    return __async(this, null, function* () {
      this.isJoining = true;
      this.cdr.detectChanges();
      if (flag == "N") {
        yield this.presentSerice.unsaveHighlights(this.nPresentid);
      }
      const res = yield this.presentSerice.userJoined(this.nPresentid);
      if (res.msg == 1) {
        this.presentDetail.cUAStatus = "J";
        this.presentEvents.emit({ event: "USER-JOINED", data: {} });
      } else {
        this.tost.error(res.msg);
      }
      this.isJoining = false;
      this.cdr.detectChanges();
    });
  }
  onEnd(isSave) {
    return __async(this, null, function* () {
      if (isSave) {
        this.tost.success("Presentation notes saved successfully");
        this.presentEvents.emit({ event: "PRESENTATION-END", data: {} });
      } else {
        yield this.presentSerice.unsaveHighlights(this.nPresentid);
        this.presentEvents.emit({ event: "PRESENTATION-END", data: {} });
      }
    });
  }
  close() {
    this.isEndPresentation = false;
    this.isEndPresentationChange.emit(this.isEndPresentation);
    this.cdr.detectChanges();
  }
  ngOnChanges(changes) {
    if (changes["isPaused"] && !this.bShowAgain) {
      this.showPausedDialog = changes["isPaused"]?.currentValue;
    }
  }
  closePausedDialog() {
    this.showPausedDialog = false;
    this.store.setStorage("bShowAgain", this.bShowAgain);
  }
  gotoHome() {
    this.router.navigate(["/present/home", JSON.stringify({ id: this.nCaseid })]);
  }
  static {
    this.\u0275fac = function PresentPopupComponent_Factory(t) {
      return new (t || _PresentPopupComponent)(\u0275\u0275directiveInject(PresentService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(Router));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PresentPopupComponent, selectors: [["present-popup"]], inputs: { presentDetail: "presentDetail", nPresentid: "nPresentid", isPaused: "isPaused", isEndPresentation: "isEndPresentation", isPresentationEnded: "isPresentationEnded", nCaseid: "nCaseid" }, outputs: { presentEvents: "presentEvents", isEndPresentationChange: "isEndPresentationChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 4, vars: 5, consts: [[1, "fixed", "top-0", "left-0", "z-[99999]", "h-full", "w-full", "grid", "place-items-center"], [1, "absolute", "top-0", "left-0", "z-[10]", "h-full", "w-full", "bg-black/50"], [1, "z-20", "relative", "block", "w-[500px]", "bg-[#f6fbff]", "p-10", "rounded-base"], [1, "flex", "p-2.5"], [1, "text-lg", "whitespace-nowrap", "font-semibold", "mb-2.5"], [1, "text-xs", "whitespace-nowrap"], ["viewBox", "0 0 50 50", 1, "w-[50px]", "ms-auto"], ["cx", "25", "cy", "25", "r", "20", "fill", "none", "stroke", "black", "stroke-width", "2.5", 1, "path"], ["cx", "25", "cy", "25", "r", "20", "fill", "none", "stroke", "#ff3d00", "stroke-width", "3", "stroke-dasharray", "90, 150", "stroke-dashoffset", "-35", 1, "path"], ["attributeName", "transform", "type", "rotate", "values", "0 25 25;360 25 25", "dur", "0.75s", "repeatCount", "indefinite"], [1, "flex", "mt-5", "items-center", "gap-2.5"], [3, "click", "isloading", "disabled"], ["mode", "white", 3, "click", "isloading", "disabled"], [1, "p-2.5"], ["mode", "white", 3, "click"], [1, "flex"], [1, "flex", "items-center", "mt-5", "gap-2.5"], [3, "click"], [1, "z-20", "relative", "block", "w-[500px]", "bg-white", "p-10", "rounded-base"], [1, "absolute", "top-0", "left-0", "z-[10]", "h-full", "w-full", "bg-black/50", 3, "click"], [1, "mt-5", "flex", "items-center", "gap-2.5"], [1, "mt-3", "flex", "items-center", "gap-2.5"], [3, "ngModelChange", "ngModel"]], template: function PresentPopupComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, PresentPopupComponent_Conditional_0_Template, 5, 1, "div", 0)(1, PresentPopupComponent_Conditional_1_Template, 15, 0, "div", 0)(2, PresentPopupComponent_Conditional_2_Template, 12, 0, "div", 0)(3, PresentPopupComponent_Conditional_3_Template, 12, 1, "div", 0);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, (\u0275\u0275pureFunction0(4, _c0).includes(ctx.presentDetail == null ? null : ctx.presentDetail.cUAStatus) || (ctx.presentDetail == null ? null : ctx.presentDetail.cUStatus) == "I" || (ctx.presentDetail == null ? null : ctx.presentDetail.cStatus) == "P") && !(ctx.presentDetail == null ? null : ctx.presentDetail.isHost) && !ctx.isPaused ? 0 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.isPresentationEnded && !(ctx.presentDetail == null ? null : ctx.presentDetail.isHost) ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.isEndPresentation && (ctx.presentDetail == null ? null : ctx.presentDetail.isHost) ? 2 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(3, ctx.showPausedDialog ? 3 : -1);
      }
    }, dependencies: [ButtonComponent, MatCheckboxModule, MatCheckbox, FormsModule, NgControlStatus, NgModel], styles: ['\n\n.spinner[_ngcontent-%COMP%] {\n  width: 50px;\n  height: 50px;\n  min-width: 50px;\n  min-height: 50px;\n  max-width: 50px;\n  max-height: 50px;\n  display: grid;\n  animation: _ngcontent-%COMP%_spinner-plncf9 4s infinite;\n  z-index: 2;\n}\n.spinner-back[_ngcontent-%COMP%] {\n  width: 50px;\n  height: 50px;\n  min-width: 50px;\n  min-height: 50px;\n  max-width: 50px;\n  max-height: 50px;\n  display: grid;\n  z-index: 1;\n}\n.spinner-back[_ngcontent-%COMP%]::after {\n  content: "";\n  grid-area: 1/1;\n  border: 3px solid;\n  border-radius: 50%;\n  outline: 1px solid black;\n  outline-offset: -2px;\n  mix-blend-mode: darken;\n  animation: _ngcontent-%COMP%_spinner-plncf9 1s infinite linear;\n}\n.spinner[_ngcontent-%COMP%]::before {\n  content: "";\n  grid-area: 1/1;\n  border: 3px solid;\n  border-radius: 50%;\n  border-color: #ff3d00 #ff3d00 #ff3d00 rgba(0, 0, 0, 0);\n  mix-blend-mode: darken;\n  animation: _ngcontent-%COMP%_spinner-plncf9 1s infinite linear;\n  z-index: 2;\n}\n@keyframes _ngcontent-%COMP%_spinner-plncf9 {\n  100% {\n    transform: rotate(1turn);\n  }\n}\n/*# sourceMappingURL=present-popup.component.css.map */'], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PresentPopupComponent, { className: "PresentPopupComponent", filePath: "src\\app\\presentation\\components\\individual\\present-popup\\present-popup.component.ts", lineNumber: 23 });
})();
export {
  PresentPopupComponent
};
//# sourceMappingURL=chunk-4OVGLUXN.js.map
