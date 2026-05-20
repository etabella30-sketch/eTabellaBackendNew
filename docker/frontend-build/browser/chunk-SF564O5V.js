import {
  TicketService
} from "./chunk-WQBUN4X6.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule
} from "./chunk-UVEQGFJV.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  ActivatedRoute
} from "./chunk-FNSUDMGC.js";
import {
  CommonModule,
  DatePipe,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
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
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/imageviewer/imageviewer.component.ts
var ImageviewerComponent = class _ImageviewerComponent {
  constructor(data) {
    this.data = data;
    this.cPath = this.data.cPath;
  }
  static {
    this.\u0275fac = function ImageviewerComponent_Factory(t) {
      return new (t || _ImageviewerComponent)(\u0275\u0275directiveInject(MAT_DIALOG_DATA));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ImageviewerComponent, selectors: [["app-imageviewer"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 4, vars: 1, consts: [[1, "p-5"], [1, "text-lg", "font-semibold", "mb-3"], ["width", "100%", "height", "90%", 1, "object-contain", "max-h-[90vh]", "shadow-lg", "block", "m-auto", 3, "src"]], template: function ImageviewerComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
        \u0275\u0275text(2, "Ticket image");
        \u0275\u0275elementEnd();
        \u0275\u0275element(3, "img", 2);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275property("src", ctx.cPath, \u0275\u0275sanitizeUrl);
      }
    } });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ImageviewerComponent, { className: "ImageviewerComponent", filePath: "src\\app\\shared\\components\\imageviewer\\imageviewer.component.ts", lineNumber: 11 });
})();

// src/app/shared/components/tickets/tickets.component.ts
var _forTrack0 = ($index, $item) => $item.nTicketid;
var _c0 = (a0, a1) => ({ "bg-gray-950": a0, "bg-gray-400": a1 });
function TicketsComponent_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15);
    \u0275\u0275text(1, " Created By ");
    \u0275\u0275elementEnd();
  }
}
function TicketsComponent_For_33_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", x_r3.cFname, "\xA0", x_r3.cLname, " ");
  }
}
function TicketsComponent_For_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 18)(1, "div", 14);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 15);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, TicketsComponent_For_33_Conditional_6_Template, 2, 2, "div", 15);
    \u0275\u0275elementStart(7, "div", 15);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 16);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 17)(12, "span", 19);
    \u0275\u0275listener("click", function TicketsComponent_For_33_Template_span_click_12_listener() {
      const x_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.viewImage(x_r3));
    });
    \u0275\u0275text(13, " View");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "div", 17)(15, "span", 20);
    \u0275\u0275text(16);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "mat-menu", 6, 1)(19, "div")(20, "h6", 21);
    \u0275\u0275text(21, "Resolved ?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "div", 8)(23, "btn", 9);
    \u0275\u0275listener("click", function TicketsComponent_For_33_Template_btn_click_23_listener() {
      const x_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.resolved(x_r3.nTicketid));
    });
    \u0275\u0275text(24, "Yes");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "btn", 10);
    \u0275\u0275text(26, "No");
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    const resolvemenu_r5 = \u0275\u0275reference(18);
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" #", x_r3.nTicketid, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(5, 8, x_r3.dCreateDt, "dd/mm/yyyy"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(6, ctx_r3.isAdmin ? 6 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r3.cSession, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r3.cDesc, " ");
    \u0275\u0275advance(5);
    \u0275\u0275property("matMenuTriggerFor", x_r3.cStatus == "P" && ctx_r3.isAdmin ? resolvemenu_r5 : null)("ngClass", \u0275\u0275pureFunction2(11, _c0, x_r3.cStatus == "P", x_r3.cStatus != "P"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r3.cStatus != "P" ? "Resolved" : "Pending", " ");
  }
}
var TicketsComponent = class _TicketsComponent {
  constructor(dialog, ts, cd, route, cf) {
    this.dialog = dialog;
    this.ts = ts;
    this.cd = cd;
    this.route = route;
    this.cf = cf;
    this.ticketClose = new EventEmitter();
    this.ticketCleard = new EventEmitter();
    this.nTicketCaseId = null;
    this.ticketList = [];
    this.isAdmin = false;
    this.imageURL = `${environment.documentStorage}${environment.ticketPath}`;
  }
  ngOnInit() {
    if (this.onTickets) {
      this.fetchList();
      this.onTickets.subscribe((caseid) => {
        this.ticketList = [];
        this.nTicketCaseId = caseid;
        this.fetchList();
      });
    } else {
      this.isAdmin = true;
      var params = this.route.snapshot.params;
      params = JSON.parse(atob(params["id"]));
      this.nTicketCaseId = params && params["id"] ? params["id"] : 0;
      if (this.nTicketCaseId) {
        this.fetchAllTicketsList();
      }
    }
  }
  fetchAllTicketsList() {
    return __async(this, null, function* () {
      this.ticketList = yield this.ts.getAllTicketList(this.nTicketCaseId);
      this.cd.detectChanges();
    });
  }
  fetchList() {
    return __async(this, null, function* () {
      this.ticketList = yield this.ts.getTicketList(this.nTicketCaseId);
      this.cd.detectChanges();
    });
  }
  resolved(nTicketid) {
    return __async(this, null, function* () {
      let rs = yield this.ts.resolveTicket(nTicketid);
      if (rs) {
        let tkt = this.ticketList.find((a) => a.nTicketid == nTicketid);
        tkt.cStatus = "C";
        this.cd.detectChanges();
      }
    });
  }
  clearAll() {
    return __async(this, null, function* () {
      let rs;
      if (this.isAdmin)
        rs = yield this.ts.clearAllResolvedTicketsAsAdmin(this.nTicketCaseId);
      else
        rs = yield this.ts.clearAllResolvedTickets(this.nTicketCaseId);
      if (rs) {
        this.ticketList = this.ticketList.filter((a) => a.cStatus == "P");
        this.cd.detectChanges();
        this.ticketCleard.emit(this.ticketList.length);
      }
    });
  }
  viewImage(x) {
    const dialogRef = this.dialog.open(ImageviewerComponent, {
      maxHeight: "95vh",
      data: {
        cPath: `${this.imageURL}${x.cImgpath}`
      }
    });
  }
  close() {
    if (this.isAdmin) {
      this.cf.goto("/admin/dashboard");
      return;
    }
    this.ticketClose.emit("CLOSE");
  }
  static {
    this.\u0275fac = function TicketsComponent_Factory(t) {
      return new (t || _TicketsComponent)(\u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(TicketService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(CommonfunctionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TicketsComponent, selectors: [["app-tickets"]], inputs: { onTickets: "onTickets", nTicketCaseId: "nTicketCaseId" }, outputs: { ticketClose: "ticketClose", ticketCleard: "ticketCleard" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 34, vars: 2, consts: [["menu1", "matMenu"], ["resolvemenu", "matMenu"], [1, "p-10"], [1, "flex", "items-center", "mb-6"], [1, "txet-lg"], ["mode", "outlined", "addcls", "text-blue-500", 1, "ms-auto", 3, "matMenuTriggerFor"], [1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click"], ["mode", "dark"], ["name", "close", 1, "ms-3", "hover:text-blue-500", "cursor-pointer", 3, "click"], [1, "table-wrap"], [1, "tabheader", "flex", "border-y", "py-5", "mb-6"], [1, "min-w-80", "text-xs", "font-medium"], [1, "min-w-28", "text-xs", "font-medium"], [1, "w-full", "text-xs", "font-medium"], [1, "min-w-24", "text-xs", "font-medium"], [1, "tabody", "flex", "mb-6"], [1, "underline", "cursor-pointer", "px-1", 3, "click"], [1, "text-xs", "px-3", "py-1.5", "rounded-full", "text-white", "font-semibold", 3, "matMenuTriggerFor", "ngClass"], [1, "mb-6", "text-white", "text-xs"]], template: function TicketsComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 2)(1, "header", 3)(2, "h6", 4);
        \u0275\u0275text(3, "Current Tickets");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "btn", 5);
        \u0275\u0275text(5, "Clear all resolved tickets");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(6, "mat-menu", 6, 0)(8, "div")(9, "h6", 7);
        \u0275\u0275text(10, "Confirm Delete ?");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "div", 8)(12, "btn", 9);
        \u0275\u0275listener("click", function TicketsComponent_Template_btn_click_12_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.clearAll());
        });
        \u0275\u0275text(13, "Delete");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "btn", 10);
        \u0275\u0275text(15, "cancel");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(16, "icon", 11);
        \u0275\u0275listener("click", function TicketsComponent_Template_icon_click_16_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.close());
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(17, "div", 12)(18, "div", 13)(19, "div", 14);
        \u0275\u0275text(20, " Ticket No. ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(21, "div", 15);
        \u0275\u0275text(22, " Date Created ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(23, TicketsComponent_Conditional_23_Template, 2, 0, "div", 15);
        \u0275\u0275elementStart(24, "div", 15);
        \u0275\u0275text(25, " Session ID ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(26, "div", 16);
        \u0275\u0275text(27, " Detail ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(28, "div", 17);
        \u0275\u0275text(29, " Image ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(30, "div", 17);
        \u0275\u0275text(31, "Status");
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(32, TicketsComponent_For_33_Template, 27, 14, "div", 18, _forTrack0);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        const menu1_r6 = \u0275\u0275reference(7);
        \u0275\u0275advance(4);
        \u0275\u0275property("matMenuTriggerFor", menu1_r6);
        \u0275\u0275advance(19);
        \u0275\u0275conditional(23, ctx.isAdmin ? 23 : -1);
        \u0275\u0275advance(9);
        \u0275\u0275repeater(ctx.ticketList);
      }
    }, dependencies: [CommonModule, NgClass, DatePipe, ButtonComponent, IconComponent, MatDialogModule, MatMenuModule, MatMenu, MatMenuTrigger], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TicketsComponent, { className: "TicketsComponent", filePath: "src\\app\\shared\\components\\tickets\\tickets.component.ts", lineNumber: 23 });
})();

export {
  TicketsComponent
};
//# sourceMappingURL=chunk-SF564O5V.js.map
