import {
  SearchComponent
} from "./chunk-GRRJDIU4.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import {
  MatMenuModule
} from "./chunk-4QNWYMPA.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  Router
} from "./chunk-FNSUDMGC.js";
import {
  AsyncPipe,
  CommonModule,
  Location,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  ɵsetClassDebugInfo,
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
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/user-notification/user-notification.component.ts
function UserNotificationComponent_Conditional_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275element(1, "div", 2);
    \u0275\u0275elementStart(2, "div", 4)(3, "div", 5)(4, "div")(5, "h6", 6);
    \u0275\u0275text(6, " You've been invited to a presentation ");
    \u0275\u0275elementEnd()();
    \u0275\u0275element(7, "div");
    \u0275\u0275elementStart(8, "div", 7)(9, "btn", 8);
    \u0275\u0275listener("click", function UserNotificationComponent_Conditional_0_Conditional_3_Template_btn_click_9_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.GoToPresentation());
    });
    \u0275\u0275text(10, "Join");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "btn", 9);
    \u0275\u0275listener("click", function UserNotificationComponent_Conditional_0_Conditional_3_Template_btn_click_11_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.Close());
    });
    \u0275\u0275text(12, "Reject");
    \u0275\u0275elementEnd()()()()();
  }
}
function UserNotificationComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275element(1, "div", 2);
    \u0275\u0275elementStart(2, "div", 3);
    \u0275\u0275template(3, UserNotificationComponent_Conditional_0_Conditional_3_Template, 13, 0, "div", 0);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275conditional(3, ctx_r1.cStatus == "PRESENT-START" || ctx_r1.cStatus == "PRESENT-USER-ADDED" ? 3 : -1);
  }
}
function UserNotificationComponent_Conditional_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275element(1, "div", 2);
    \u0275\u0275elementStart(2, "div", 10)(3, "div", 11)(4, "div", 12);
    \u0275\u0275text(5, " Live ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 13);
    \u0275\u0275text(7, " Presentation started ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "h1", 14)(9, "span", 15);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275text(11, " has started presenting ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "p", 16);
    \u0275\u0275text(13, " Would you like to follow along? Your view will sync to the presenter's document and page. You can leave any time. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "div", 17)(15, "btn", 8);
    \u0275\u0275listener("click", function UserNotificationComponent_Conditional_1_Conditional_0_Template_btn_click_15_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.GoToPresentation());
    });
    \u0275\u0275text(16, " Join now ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "btn", 9);
    \u0275\u0275listener("click", function UserNotificationComponent_Conditional_1_Conditional_0_Template_btn_click_17_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.Close());
    });
    \u0275\u0275text(18, " Not now ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(10);
    \u0275\u0275textInterpolate((ctx_r1.notificationObj == null ? null : ctx_r1.notificationObj.cTitle) || "Alec Emerson");
  }
}
function UserNotificationComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, UserNotificationComponent_Conditional_1_Conditional_0_Template, 19, 1, "div", 0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, (ctx_r1.cStatus == "PRESENT-START" || ctx_r1.cStatus == "PRESENT-USER-ADDED") && ctx_r1.userNotificationVisible ? 0 : -1);
  }
}
function UserNotificationComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "div", 18);
    \u0275\u0275element(2, "div", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 20);
    \u0275\u0275text(4, "Presentation ongoing");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "btn", 21);
    \u0275\u0275listener("click", function UserNotificationComponent_Conditional_2_Template_btn_click_5_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.GoToPresentation());
    });
    \u0275\u0275text(6, "Join");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(5);
    \u0275\u0275property("issmall", true);
  }
}
var UserNotificationComponent = class _UserNotificationComponent {
  constructor(ss, cdr, router, CMS, hs) {
    this.ss = ss;
    this.cdr = cdr;
    this.router = router;
    this.CMS = CMS;
    this.hs = hs;
    this.userNotificationVisible = false;
    this.userNotificationVisibleChange = new EventEmitter();
    this.emitEvent = new EventEmitter();
    this.notificationObj = {};
    this.ngOnDestroy();
    this.userNotificationSubscribe = this.ss.getUserNotifications().subscribe((res) => {
      try {
        debugger;
        if (res?.nCaseid && hs.Casedetail?.nCaseid == res?.nCaseid) {
          console.warn("USER NOTIFICATION", res);
          if (res?.cType == "PRESENT-USER-ADDED") {
            this.cStatus = res?.cType;
            this.notificationObj = res;
            this.userNotificationVisible = true;
            this.emitEvent.emit({ event: "NOTIFICATION", data: { userNotificationVisible: this.userNotificationVisible } });
          } else if (res?.cType == "PRESENT-START") {
            this.cStatus = res?.cType;
            this.notificationObj = res;
            this.userNotificationVisible = true;
            this.emitEvent.emit({ event: "NOTIFICATION", data: { userNotificationVisible: this.userNotificationVisible } });
          } else if (["LS", "FS", "DS", "WS", "TASK-SHARE", "CS", "TR"].includes(res?.cType)) {
            this.CMS.callFunction({ event: "NOTIFICATION", data: res });
          }
        }
      } catch (error) {
        console.error(error);
      }
      this.cdr.detectChanges();
    });
    this.ss.getPresentationTools().subscribe((res) => {
      if (["LIVE", "USER-MANAGE", "END"].includes(res?.event)) {
        if ((res?.event == "USER-MANAGE" && res?.data?.cStatus == "A" && res?.data?.cPermission == "D" || res?.event == "END") && (res?.data?.nPresentid == this.hs.Casedetail?.nPresentid || this.notificationObj?.nPresentid == res?.data?.nPresentid)) {
          this.cStatus = null;
          this.cdr.detectChanges();
        }
      }
    });
  }
  ngOnDestroy() {
    try {
      if (this.userNotificationSubscribe) {
        this.userNotificationSubscribe.unsubscribe();
      }
    } catch (error) {
    }
  }
  Close() {
    this.userNotificationVisible = false;
    this.emitEvent.emit({ event: "NOTIFICATION", data: { userNotificationVisible: this.userNotificationVisible } });
    this.cdr.detectChanges();
  }
  GoToPresentation() {
    if (this.userNotificationVisible == false && !this.notificationObj?.nPresentid) {
      this.notificationObj.nCaseid = this.hs.Casedetail?.nCaseid;
      this.notificationObj.nPresentid = this.hs.Casedetail?.nPresentid;
    }
    this.router.navigateByUrl(`/individual/doc/${encodeURIComponent(JSON.stringify([[], this.notificationObj.nCaseid, this.notificationObj.nPresentid]))}`);
    this.Close();
  }
  static {
    this.\u0275fac = function UserNotificationComponent_Factory(t) {
      return new (t || _UserNotificationComponent)(\u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(HeaderService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UserNotificationComponent, selectors: [["user-notification"]], inputs: { userNotificationVisible: "userNotificationVisible", cStatus: "cStatus", notificationObj: "notificationObj" }, outputs: { userNotificationVisibleChange: "userNotificationVisibleChange", emitEvent: "emitEvent" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 3, vars: 3, consts: [[1, "fixed", "top-0", "left-0", "z-[99999]", "h-full", "w-full", "grid", "place-items-center"], [1, "reminder", "flex", "items-center", "gap-2", "bg-white", "px-2.5", "py-1", "rounded-base", "ms-2", "border"], [1, "absolute", "top-0", "left-0", "z-[10]", "h-full", "w-full", "bg-black/50"], [1, "z-20", "relative", "block", "w-[500px]", "bg-[#f6fbff]", "p-10", "rounded-base"], [1, "z-20", "relative", "block", "w-[500px]", "bg-white", "p-10", "rounded-base"], [1, "p-2.5"], [1, "text-lg", "whitespace-nowrap", "font-semibold", "mb-2.5"], [1, "flex", "mt-5", "items-center", "gap-2.5"], [3, "click"], ["mode", "white", 3, "click"], [1, "bg-white", "rounded-2xl", "p-6", "shadow-2xl", "border", "border-gray-100", "animate-in", "slide-in-from-bottom-2", "duration-200", "z-[999]", "w-[500px]"], [1, "flex", "items-center", "gap-3", "mb-3"], [1, "px-2", "py-0.5", "text-xs", "font-medium", "rounded-full", "bg-green-100", "text-green-700", "border", "border-green-500"], [1, "text-lg", "font-semibold", "text-gray-900"], [1, "text-base", "font-semibold", "text-gray-900", "mb-2"], [1, "font-semibold"], [1, "text-grey", "text-xs", "mb-6"], [1, "flex", "gap-3", "flex-wrap"], ["aria-hidden", "true", 1, "size-2.5", "rounded-full", "flex", "items-center", "justify-center", "bg-green-100", "border", "border-green-600", "shadow-[0px_0px_6px_#16a34a]"], [1, "block", "min-w-2.5", "min-h-2.5", "max-w-2.5", "max-h-2.5", "rounded-full", "bg-green-600", "animate-ping"], [1, "text-xs"], ["addcls", "!h-7 ", 3, "click", "issmall"]], template: function UserNotificationComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, UserNotificationComponent_Conditional_0_Template, 4, 1, "div", 0)(1, UserNotificationComponent_Conditional_1_Template, 1, 1)(2, UserNotificationComponent_Conditional_2_Template, 7, 1, "div", 1);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, false ? 0 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.cStatus ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, (ctx.cStatus == "PRESENT-START" || ctx.cStatus == "PRESENT-USER-ADDED") && !ctx.userNotificationVisible ? 2 : -1);
      }
    }, dependencies: [ButtonComponent], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UserNotificationComponent, { className: "UserNotificationComponent", filePath: "src\\app\\shared\\components\\user-notification\\user-notification.component.ts", lineNumber: 19 });
})();

// src/app/core/headercomponents/header/header.component.ts
function HeaderComponent_Conditional_10_search_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "search", 6);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("isAdmin", false)("currentfolder", ctx_r0.hs.currentfolder)("jFilter", ctx_r0.hs.jFilter);
  }
}
function HeaderComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, HeaderComponent_Conditional_10_search_0_Template, 1, 3, "search", 8);
    \u0275\u0275pipe(1, "async");
    \u0275\u0275pipe(2, "async");
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngIf", \u0275\u0275pipeBind1(1, 1, ctx_r0.hs == null ? null : ctx_r0.hs.currentadminpath) == "Admin Panel" || \u0275\u0275pipeBind1(2, 3, ctx_r0.hs == null ? null : ctx_r0.hs.currentadminpath) == "my files");
  }
}
var HeaderComponent = class _HeaderComponent {
  constructor(hs, location, cs, cdr) {
    this.hs = hs;
    this.location = location;
    this.cs = cs;
    this.cdr = cdr;
    this.userNotificationVisible = false;
  }
  ngAfterViewInit() {
    const presentInterval = setInterval(() => {
      if (this?.hs?.Casedetail) {
        if (this.hs.Casedetail?.isPresent) {
          this.cStatus = "PRESENT-USER-ADDED";
        }
        clearInterval(presentInterval);
      }
    }, 1e3);
  }
  goBack() {
    this.location.back();
  }
  gohome() {
    this.hs.goUserHome();
  }
  download() {
    this.cs.callFunction("DOWNLOAD-FILE");
  }
  notificationEvent(event) {
    if (event?.event === "NOTIFICATION") {
      this.userNotificationVisible = event.data.userNotificationVisible;
      this.cdr.detectChanges();
    }
  }
  static {
    this.\u0275fac = function HeaderComponent_Factory(t) {
      return new (t || _HeaderComponent)(\u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(Location), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HeaderComponent, selectors: [["app-header"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 12, vars: 8, consts: [[1, "pt-6", "px-10", "flex", "items-center", "bg-neutral-100"], [1, "text-lg", "font-semibold", "flex", "items-center", "gap-2.5"], [1, "capitalize"], ["mode", "outlined", 3, "click"], ["name", "download", "type", "extra", 1, "text-lg"], [1, "text-xs"], [3, "isAdmin", "currentfolder", "jFilter"], [3, "userNotificationVisible", "cStatus"], [3, "isAdmin", "currentfolder", "jFilter", 4, "ngIf"]], template: function HeaderComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "span", 2);
        \u0275\u0275text(3);
        \u0275\u0275pipe(4, "async");
        \u0275\u0275pipe(5, "async");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(6, "btn", 3);
        \u0275\u0275listener("click", function HeaderComponent_Template_btn_click_6_listener() {
          return ctx.download();
        });
        \u0275\u0275element(7, "icon", 4);
        \u0275\u0275elementStart(8, "span", 5);
        \u0275\u0275text(9, "Download Agreed Files");
        \u0275\u0275elementEnd()();
        \u0275\u0275template(10, HeaderComponent_Conditional_10_Template, 3, 5, "search", 6);
        \u0275\u0275elementEnd();
        \u0275\u0275element(11, "user-notification", 7);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 4, ctx.hs == null ? null : ctx.hs.currentadminpath) == "my files" ? ctx.hs.isGlobalSearch ? ctx.hs.search_within == "I" ? "Content Search" : "Metadata Search" : "Evidence" : \u0275\u0275pipeBind1(5, 6, ctx.hs == null ? null : ctx.hs.currentadminpath));
        \u0275\u0275advance(7);
        \u0275\u0275conditional(10, ctx.hs.nSectionid ? 10 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("userNotificationVisible", ctx.userNotificationVisible)("cStatus", ctx.cStatus);
      }
    }, dependencies: [CommonModule, NgIf, AsyncPipe, IconComponent, SearchComponent, MatMenuModule, ButtonComponent, UserNotificationComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HeaderComponent, { className: "HeaderComponent", filePath: "src\\app\\core\\headercomponents\\header\\header.component.ts", lineNumber: 20 });
})();

export {
  HeaderComponent
};
//# sourceMappingURL=chunk-JFSROE7U.js.map
