import {
  NotificationsService
} from "./chunk-JM5IFOX7.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
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
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefinePipe,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction3,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate3
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/pips/notification.pip.ts
var NotificationPipe = class _NotificationPipe {
  constructor() {
  }
  transform(value, x) {
    if (x.cType == "FS") {
      return x.cMsg.replace("fact", '<span id="n-link" class="text-blue-on underline cursor-pointer"> fact </span>');
    } else if (x.cType == "DS") {
      return x.cMsg.replace("doclink", '<span id="n-link" class="text-blue-on underline cursor-pointer"> doclink </span>');
    } else if (x.cType == "WS") {
      return x.cMsg.replace("weblink", '<span id="n-link" class="text-blue-on underline cursor-pointer"> weblink </span>');
    } else if (x.cType == "LS") {
      return x.cMsg.replace("document", '<span id="n-link" class="text-blue-on underline cursor-pointer"> document </span>');
    } else if (x.cType == "") {
      return x.cMsg.replace("uploaded", '<span id="n-link" class="text-blue-on underline cursor-pointer"> uploaded </span>');
    } else if (x.cType == "") {
      return x.cMsg.replace("extract", '<span id="n-link" class="text-blue-on underline cursor-pointer"> extract </span>');
    }
    return value;
  }
  static {
    this.\u0275fac = function NotificationPipe_Factory(t) {
      return new (t || _NotificationPipe)();
    };
  }
  static {
    this.\u0275pipe = /* @__PURE__ */ \u0275\u0275definePipe({ name: "notification", type: _NotificationPipe, pure: true, standalone: true });
  }
};

// src/app/shared/components/notifications/notifications.component.ts
var _c0 = (a0, a1, a2) => ({ cFname: a0, cLname: a1, cProfile: a2 });
var _c1 = () => ["FS", "DS", "WS", "LS"];
function NotificationsComponent_Conditional_0_For_9_Conditional_6_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 16);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275property("matTooltip", x_r4.cFilename);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r4.cFilename, " ");
  }
}
function NotificationsComponent_Conditional_0_For_9_Conditional_6_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate3(" [ ", x_r4.cBundletag || "-", " | ", x_r4.cTab || "-", " | ", x_r4.cPage || x_r4.cPageRange || "-", " ] ");
  }
}
function NotificationsComponent_Conditional_0_For_9_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13);
    \u0275\u0275element(1, "icon", 14);
    \u0275\u0275elementStart(2, "div", 15);
    \u0275\u0275template(3, NotificationsComponent_Conditional_0_For_9_Conditional_6_Conditional_3_Template, 2, 2, "p", 16)(4, NotificationsComponent_Conditional_0_For_9_Conditional_6_Conditional_4_Template, 2, 3, "p", 17);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275conditional(3, x_r4.cFilename ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(4, x_r4.cBundletag || x_r4.cTab || x_r4.cPage || x_r4.cPageRange ? 4 : -1);
  }
}
function NotificationsComponent_Conditional_0_For_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275listener("click", function NotificationsComponent_Conditional_0_For_9_Template_div_click_0_listener($event) {
      const x_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.goto(x_r4, $event));
    });
    \u0275\u0275elementStart(1, "div", 9);
    \u0275\u0275element(2, "avtr", 10)(3, "p", 11);
    \u0275\u0275pipe(4, "notification");
    \u0275\u0275elementStart(5, "icon", 12);
    \u0275\u0275listener("click", function NotificationsComponent_Conditional_0_For_9_Template_icon_click_5_listener() {
      const x_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.remove(x_r4));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, NotificationsComponent_Conditional_0_For_9_Conditional_6_Template, 5, 2, "div", 13);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", (x_r4 == null ? null : x_r4.cFname) + " " + (x_r4 == null ? null : x_r4.cLname))("detail", \u0275\u0275pureFunction3(7, _c0, x_r4.cFname, x_r4.cLname, x_r4.cProfile));
    \u0275\u0275advance();
    \u0275\u0275property("innerHTML", \u0275\u0275pipeBind2(4, 4, x_r4.cMsg, x_r4), \u0275\u0275sanitizeHtml);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(6, \u0275\u0275pureFunction0(11, _c1).includes(x_r4.cType) && (x_r4.cFilename || x_r4.cBundletag || x_r4.cTab || x_r4.cPage || x_r4.cPageRange) ? 6 : -1);
  }
}
function NotificationsComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275listener("click", function NotificationsComponent_Conditional_0_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "header", 2)(2, "span", 3);
    \u0275\u0275text(3, "Notifications");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "btn", 4);
    \u0275\u0275listener("click", function NotificationsComponent_Conditional_0_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.clearAll());
    });
    \u0275\u0275text(5, "Clear All");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "icon", 5);
    \u0275\u0275listener("click", function NotificationsComponent_Conditional_0_Template_icon_click_6_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.close());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 6);
    \u0275\u0275repeaterCreate(8, NotificationsComponent_Conditional_0_For_9_Template, 7, 12, "div", 7, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(8);
    \u0275\u0275repeater(ctx_r1.notificationlist);
  }
}
function NotificationsComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 18);
    \u0275\u0275listener("click", function NotificationsComponent_Conditional_1_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "h6", 19);
    \u0275\u0275text(2, "No Notification");
    \u0275\u0275elementEnd()();
  }
}
var NotificationsComponent = class _NotificationsComponent {
  constructor(NotificationS, cm, CMS, router, tost) {
    this.NotificationS = NotificationS;
    this.cm = cm;
    this.CMS = CMS;
    this.router = router;
    this.tost = tost;
    this.clickevnts = new EventEmitter();
    this.nCaseid = null;
    this.notificationlist = [];
    this.serverList = [];
    this.clientList = [];
    this.checkEventSub();
  }
  checkEventSub() {
    return __async(this, null, function* () {
      this.evsubscription = this.CMS.functionCalled$.subscribe((data) => __async(this, null, function* () {
        if (data && data.event == "NOTIFICATION" && data.data.nCaseid == this.nCaseid) {
          this.NotificationS._isNotification.next(true);
          setTimeout(() => {
            this.ngOnInit();
          }, 500);
        }
      }));
    });
  }
  ngOnDestroy() {
    return __async(this, null, function* () {
      this.evsubscription.unsubscribe();
      this.clientSub?.unsubscribe();
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.serverList = (yield this.getNotification(this.nCaseid)) || [];
      this.clientSub = this.NotificationS.clientNotifications$.subscribe((list) => {
        this.clientList = list || [];
        this.refreshList();
      });
      this.refreshList();
    });
  }
  /** Display list = client (newest, most relevant) on top, then server. */
  refreshList() {
    this.notificationlist = [...this.clientList, ...this.serverList];
  }
  getNotification(nCaseid) {
    return __async(this, null, function* () {
      let res = yield this.NotificationS.getNotifcationList(nCaseid);
      return res || [];
    });
  }
  remove(x) {
    const id = String(x.nNTid ?? "");
    if (id.startsWith("client-")) {
      this.NotificationS.removeClientNotification(id);
      return;
    }
    this.NotificationS.deleteNotification(this.nCaseid, x.nNTid);
    this.serverList = this.serverList.filter((y) => y.nNTid != x.nNTid);
    this.refreshList();
  }
  goto(x, e) {
    try {
      if (x.cType == "TS-PUBLISH") {
        this.cm.goto("/myfiles/filesaction", { id: this.nCaseid });
        this.close();
        return;
      }
      if (x.cType == "PRESENT-START" || x.cType == "PRESENT-USER-ADDED") {
        if (x.nPresentid) {
          if (["I", "B", "C"].includes(x.cPresentStatus)) {
            this.tost.error("Presentation Ended");
            return;
          }
          this.router.navigateByUrl(`/individual/doc/${encodeURIComponent(JSON.stringify([[], this.nCaseid, x.nPresentid]))}`);
        }
      }
      if (["FS", "DS", "WS", "LS"].includes(x.cType)) {
        this.openLinks(x);
      }
      if (["CS"].includes(x.cType)) {
        this.CMS.callFunction({ type: "CHANGE-SECTION", cFoldertype: "CB" });
        setTimeout(() => {
          this.CMS.callFunction({ type: "VIEW-SHARE", nUserid: x.nRefuserid });
        }, 200);
      }
      if (x.nUPid) {
        this.openFolder(x.nUPid);
      }
    } catch (error) {
    }
  }
  openLinks(x) {
    const bundledetailid = x.cType == "LS" ? x.nBundledetailid : x.cType == "FS" ? x.nFBundledetailid : x.cType == "DS" ? x.nDBundledetailid : x.nWBundledetailid;
    if (!bundledetailid)
      return;
    this.cm.openHyperLinkFile(bundledetailid, this.nCaseid, null, null, false, 1, null, x.nFSid || null, x.nDocid || null, x.nWebid || null);
  }
  clearAll() {
    this.NotificationS.deleteNotification(this.nCaseid);
    this.NotificationS.clearClientNotifications();
    this.serverList = [];
    this.refreshList();
  }
  close() {
    this.clickevnts.emit("close");
  }
  openFolder(nUPid) {
    if (window.location.href.includes("/myfiles/filesaction")) {
      this.CMS.callFunction({ event: "SHOW-UPLOAD", nUPid });
    } else {
      this.cm.goto("/myfiles/filesaction", { id: this.nCaseid });
      setTimeout(() => {
        this.CMS.callFunction({ event: "SHOW-UPLOAD", nUPid });
      }, 50);
    }
    this.close();
  }
  static {
    this.\u0275fac = function NotificationsComponent_Factory(t) {
      return new (t || _NotificationsComponent)(\u0275\u0275directiveInject(NotificationsService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NotificationsComponent, selectors: [["notifications"]], inputs: { nCaseid: "nCaseid" }, outputs: { clickevnts: "clickevnts" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [[1, "flex", "flex-col"], [1, "flex", "flex-col", 3, "click"], [1, "px-5", "py-2.5", "flex", "items-center", "gap-2"], [1, "text-lg", "font-semibold"], ["mode", "white", 1, "ms-auto", 3, "click"], ["name", "close", "type", "comnicn", 1, "text-xs", "ms-1", 3, "click"], [1, "px-5", "py-2.5", "overflow-auto", "max-h-[500px]"], [1, "flex", "flex-col", "px-2.5", "py-2", "text-xs", "hover:shadow-[0px_0px_6px_#06f]", "rounded-base", "mb-2.5", "last:mb-0", "text-black", "group", "cursor-pointer", "border", "border-tab/30"], [1, "flex", "flex-col", "px-2.5", "py-2", "text-xs", "hover:shadow-[0px_0px_6px_#06f]", "rounded-base", "mb-2.5", "last:mb-0", "text-black", "group", "cursor-pointer", "border", "border-tab/30", 3, "click"], [1, "flex", "items-start", "gap-2.5"], [1, "shrink-0", 3, "matTooltip", "detail"], [1, "flex-1", "min-w-0", "leading-5", 3, "innerHTML"], ["name", "removefill", 1, "text-sm", "text-grey", "opacity-0", "group-hover:opacity-100", "shrink-0", "cursor-pointer", 3, "click"], [1, "mt-2", "flex", "items-start", "gap-2", "px-2.5", "py-1.5", "border", "border-tab/40", "rounded-base", "bg-white"], ["name", "file", "type", "indicn", 1, "text-base", "text-grey", "shrink-0", "mt-0.5", "[&>i]:cursor-default"], [1, "flex-1", "min-w-0"], [1, "text-xs", "font-medium", "text-black", "truncate", 3, "matTooltip"], [1, "text-[11px]", "text-grey", "mt-0.5"], [1, "flex", "flex-col", "bg-white", "py-3", "rounded-base", 3, "click"], [1, "text-lg", "text-blue-hover", "text-center"]], template: function NotificationsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, NotificationsComponent_Conditional_0_Template, 10, 0, "div", 0)(1, NotificationsComponent_Conditional_1_Template, 3, 0);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, (ctx.notificationlist == null ? null : ctx.notificationlist.length) ? 0 : 1);
      }
    }, dependencies: [IconComponent, ButtonComponent, AvatarComponent, NotificationPipe, MatTooltipModule, MatTooltip] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NotificationsComponent, { className: "NotificationsComponent", filePath: "src\\app\\shared\\components\\notifications\\notifications.component.ts", lineNumber: 24 });
})();

export {
  NotificationsComponent
};
//# sourceMappingURL=chunk-6TXIX45I.js.map
