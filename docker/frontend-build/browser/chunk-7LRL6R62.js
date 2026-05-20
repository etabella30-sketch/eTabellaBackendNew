import {
  PresentService
} from "./chunk-DRZF5GH5.js";
import {
  PresentsetupService
} from "./chunk-WYIU2ETL.js";
import "./chunk-3B3MCZKM.js";
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
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/home/present-list/present-list.component.ts
function PresentListComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275text(1, " Request Rejected. ");
    \u0275\u0275elementEnd();
  }
}
function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_9_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 15, 0);
    \u0275\u0275text(2, " End Presentation ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "mat-menu", 16, 1)(5, "div")(6, "h6", 17);
    \u0275\u0275text(7, " Confirm ? ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 18)(9, "btn", 14);
    \u0275\u0275listener("click", function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_9_Conditional_0_Template_btn_click_9_listener() {
      \u0275\u0275restoreView(_r2);
      const x_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r3.endPresent(x_r3 == null ? null : x_r3.nPresentid));
    });
    \u0275\u0275text(10, " End ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "btn", 19);
    \u0275\u0275text(12, " Cancel ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const deletemenu_r5 = \u0275\u0275reference(4);
    \u0275\u0275property("matMenuTriggerFor", deletemenu_r5);
  }
}
function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275template(0, PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_9_Conditional_0_Template, 13, 1);
    \u0275\u0275elementStart(1, "btn", 14);
    \u0275\u0275listener("click", function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_9_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const x_r3 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r3.goToPresent(x_r3.nPresentid));
    });
    \u0275\u0275text(2, "Go to presentation ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275conditional(0, x_r3.cStatus != "I" ? 0 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(x_r3.cStatus != "I" ? "" : "ms-auto");
  }
}
function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_10_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "btn", 20);
    \u0275\u0275text(1, "Incomming");
    \u0275\u0275elementEnd();
  }
}
function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_10_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 21);
    \u0275\u0275listener("click", function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_10_Conditional_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const x_r3 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r3.goToPresent(x_r3.nPresentid));
    });
    \u0275\u0275text(1, "Join");
    \u0275\u0275elementEnd();
  }
}
function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_10_Conditional_0_Template, 2, 0, "btn", 20)(1, PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_10_Conditional_1_Template, 2, 0);
  }
  if (rf & 2) {
    const x_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275conditional(0, x_r3.cStatus == "I" ? 0 : 1);
  }
}
function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8)(1, "div", 9);
    \u0275\u0275element(2, "avtr", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 11)(4, "span", 12);
    \u0275\u0275text(5);
    \u0275\u0275element(6, "br");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(8, PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_8_Template, 2, 0, "div")(9, PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_9_Template, 3, 3, "btn", 13)(10, PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Conditional_10_Template, 2, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("detail", x_r3);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r3.cName || x_r3.cTeamname, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r3.nCreateid == ctx_r3.nUserid ? "You" : x_r3.cFname + " " + x_r3.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(8, x_r3.cUAStatus == "R" ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(9, x_r3.nCreateid == ctx_r3.nUserid ? 9 : 10);
  }
}
function PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Conditional_0_Template, 11, 5, "div", 8);
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    const item_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275conditional(0, x_r3.type == (item_r7 == null ? null : item_r7.jOther == null ? null : item_r7.jOther.type) ? 0 : -1);
  }
}
function PresentListComponent_Conditional_3_Conditional_0_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 6);
    \u0275\u0275text(1);
    \u0275\u0275element(2, "img", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(3, PresentListComponent_Conditional_3_Conditional_0_For_4_For_4_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
  }
  if (rf & 2) {
    const item_r7 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", item_r7.cKey, " ");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r3.ongoingList);
  }
}
function PresentListComponent_Conditional_3_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h4", 4);
    \u0275\u0275text(1, " Ongoing presentation ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 5);
    \u0275\u0275repeaterCreate(3, PresentListComponent_Conditional_3_Conditional_0_For_4_Template, 5, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r3.presentTypes);
  }
}
function PresentListComponent_Conditional_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 22);
    \u0275\u0275text(1, " No Live Presentation to Join ");
    \u0275\u0275elementEnd();
  }
}
function PresentListComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, PresentListComponent_Conditional_3_Conditional_0_Template, 5, 0)(1, PresentListComponent_Conditional_3_Conditional_1_Template, 2, 0);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, ctx_r3.ongoingList.length > 0 ? 0 : 1);
  }
}
var PresentListComponent = class _PresentListComponent {
  constructor(PSservice, store, cdr, router, presentSerice, socket) {
    this.PSservice = PSservice;
    this.store = store;
    this.cdr = cdr;
    this.router = router;
    this.presentSerice = presentSerice;
    this.socket = socket;
    this.ongoingList = [];
    this.presentTypes = [];
    this.changeHandler = new EventEmitter();
    this.isLoading = true;
    this.presentSubscribe = this.socket.getPresentationTools().subscribe((res) => {
      if (["LIVE", "USER-MANAGE", "END"].includes(res?.event)) {
        this.getOngoingList();
        this.changeHandler.emit("refetch");
      }
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.isLoading = true;
      try {
        this.nUserid = yield this.store.getUserId();
        yield this.getOngoingList();
      } catch (error) {
        console.error(error);
      }
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }
  goToPresent(nPresentid) {
    if (!nPresentid)
      return;
    this.router.navigateByUrl(`/individual/doc/${encodeURIComponent(JSON.stringify([[], this.nCaseid, nPresentid]))}`);
  }
  endPresent(nPresentid) {
    return __async(this, null, function* () {
      const res = yield this.presentSerice.endPresentation(nPresentid);
      if (res?.length && res[0].msg == 1) {
        const idx = this.ongoingList.findIndex((e) => e.nPresentid == nPresentid);
        if (idx > -1) {
          this.ongoingList.splice(idx, 1);
        }
        this.changeHandler.emit("refetch");
        this.cdr.detectChanges();
      }
    });
  }
  getOngoingList() {
    return __async(this, null, function* () {
      this.ongoingList = yield this.PSservice.ongoing(this.nCaseid);
      this.ongoingList = this.ongoingList.filter((e) => e.cStatus != "I");
      this.cdr.detectChanges();
    });
  }
  ngOnDestroy() {
    this.presentSubscribe.unsubscribe();
  }
  static {
    this.\u0275fac = function PresentListComponent_Factory(t) {
      return new (t || _PresentListComponent)(\u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(PresentService), \u0275\u0275directiveInject(SocketService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PresentListComponent, selectors: [["present-list"]], inputs: { presentTypes: "presentTypes", nCaseid: "nCaseid" }, outputs: { changeHandler: "changeHandler" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 4, vars: 5, consts: [["d", "matMenuTrigger"], ["deletemenu", "matMenu"], [1, "bg-dark-blue", "border-[10px]", "rounded-[40px]", "border-white", "h-full", "overflow-hidden"], [1, "pt-[30px]", "flex", "flex-col", "h-full"], [1, "text-lg", "font-semibold", "px-[30px]", "pb-6", "text-blue-hover"], [1, "h-[calc(100%_-_0px)]", "overflow-auto"], [1, "gap-2.5", "items-center", "flex", "text-white", "py-4", "text-xl", "px-[30px]"], ["src", "../../../../../assets/present/Status.svg", 1, "w-5"], [1, "user", "group", "hover:bg-black/20", "flex", "items-center", "w-full", "px-[30px]", "py-4", "gap-3"], [1, "relative"], [3, "detail"], [1, "flex", "flex-col"], [1, "text-sm", "text-white"], [3, "class"], [3, "click"], ["mode", "darkwhite", 1, "ms-auto", 3, "matMenuTriggerFor"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base", "!min-w-52"], [1, "mb-6", "text-white", "text-xs"], [1, "flex", "gap-2"], ["mode", "dark"], ["mode", "darkwhite", 1, "ms-auto"], ["mode", "darkwhite", 1, "ms-auto", 3, "click"], [1, "text-white", "text-xl", "px-[30px]", "flex", "items-center", "justify-center", "absolute", "top-1/2"]], template: function PresentListComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 2)(1, "div", 3);
        \u0275\u0275template(2, PresentListComponent_Conditional_2_Template, 1, 0, "div")(3, PresentListComponent_Conditional_3_Template, 2, 1);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275classMap(ctx.ongoingList.length > 0 ? "border-b-0 rounded-b-none" : "h-4/5");
        \u0275\u0275advance();
        \u0275\u0275classProp("items-center", !(ctx.ongoingList == null ? null : ctx.ongoingList.length));
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.isLoading ? 2 : 3);
      }
    }, dependencies: [AvatarComponent, ButtonComponent, MatMenuModule, MatMenu, MatMenuTrigger], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PresentListComponent, { className: "PresentListComponent", filePath: "src\\app\\presentation\\components\\home\\present-list\\present-list.component.ts", lineNumber: 31 });
})();
export {
  PresentListComponent
};
//# sourceMappingURL=chunk-7LRL6R62.js.map
