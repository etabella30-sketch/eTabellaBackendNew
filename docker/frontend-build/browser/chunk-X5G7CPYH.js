import {
  LogoutService
} from "./chunk-ZC2EPQ66.js";
import {
  UsercreationComponent
} from "./chunk-3A6FZELH.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
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
  MatDialog,
  MatDialogModule
} from "./chunk-UVEQGFJV.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  Router
} from "./chunk-FNSUDMGC.js";
import {
  HttpClientModule
} from "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  InputFlags,
  __async,
  booleanAttribute,
  ɵsetClassDebugInfo,
  ɵɵInputTransformsFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/profile/profile.component.ts
var _c0 = (a0, a1) => ({ "!gap-3": a0, "cursor-pointer": a1 });
var _c1 = () => ({ "mt-3.5": true });
var _c2 = (a0) => ({ "text-white": a0 });
function ProfileComponent_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 5);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(1, _c2, ctx_r0.iconwhite));
  }
}
function ProfileComponent_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span", 6);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", ctx_r0.detail.cFname, " ", ctx_r0.detail.cLname, " ");
  }
}
function ProfileComponent_Conditional_6_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 7);
    \u0275\u0275text(1, " User Guide ");
    \u0275\u0275elementStart(2, "ul", 10)(3, "li", 11);
    \u0275\u0275listener("click", function ProfileComponent_Conditional_6_Conditional_0_Template_li_click_3_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.openInNewTab("/userguide", "MQ=="));
    });
    \u0275\u0275text(4, "eBundle ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "li", 11);
    \u0275\u0275listener("click", function ProfileComponent_Conditional_6_Conditional_0_Template_li_click_5_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.openInNewTab("/userguide", "Mg=="));
    });
    \u0275\u0275text(6, "Realtime ");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275classMap(ctx_r0.isdark ? "text-white p-3" : " px-2  hover:bg-gray-100 p-1 ");
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r0.isdark ? "text-white p-3" : " px-2  hover:bg-gray-100 p-1 ");
  }
}
function ProfileComponent_Conditional_6_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 7);
    \u0275\u0275text(1, " User Guide ");
    \u0275\u0275elementStart(2, "ul", 10)(3, "li", 11);
    \u0275\u0275listener("click", function ProfileComponent_Conditional_6_Conditional_1_Template_li_click_3_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.openInNewTab("/userguide", "MQ=="));
    });
    \u0275\u0275text(4, "eBundle ");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275classMap(ctx_r0.isdark ? "text-white p-3" : " px-2  hover:bg-gray-100 p-1 ");
  }
}
function ProfileComponent_Conditional_6_Conditional_4_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275listener("click", function ProfileComponent_Conditional_6_Conditional_4_Conditional_2_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.openInNewTab("/helpcenteradmin", ""));
    });
    \u0275\u0275text(1, " Help Center Admin ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275classMap(ctx_r0.isdark ? "text-white p-3" : " px-2  hover:bg-gray-100 p-1 ");
  }
}
function ProfileComponent_Conditional_6_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275listener("click", function ProfileComponent_Conditional_6_Conditional_4_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.openInNewTab("/helpcenter", ""));
    });
    \u0275\u0275text(1, " Help Center ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(2, ProfileComponent_Conditional_6_Conditional_4_Conditional_2_Template, 2, 2, "span", 9);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r0.isdark ? "text-white p-3" : " px-2  hover:bg-gray-100 p-1 ");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, (ctx_r0.detail == null ? null : ctx_r0.detail.isAdmin) ? 2 : -1);
  }
}
function ProfileComponent_Conditional_6_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275listener("click", function ProfileComponent_Conditional_6_Conditional_5_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.transcript());
    });
    \u0275\u0275text(1, " Import Transcript ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r0.isdark ? "text-white p-3" : " px-2  hover:bg-gray-100 p-1 ");
  }
}
function ProfileComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275template(0, ProfileComponent_Conditional_6_Conditional_0_Template, 7, 4, "span", 7)(1, ProfileComponent_Conditional_6_Conditional_1_Template, 5, 2);
    \u0275\u0275elementStart(2, "span", 8);
    \u0275\u0275listener("click", function ProfileComponent_Conditional_6_Template_span_click_2_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.logOut());
    });
    \u0275\u0275text(3, " Logout ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, ProfileComponent_Conditional_6_Conditional_4_Template, 3, 3)(5, ProfileComponent_Conditional_6_Conditional_5_Template, 2, 2, "span", 9);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, ctx_r0.userguidebtn ? 0 : 1);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r0.isdark ? "text-white p-3" : " px-2  hover:bg-gray-100 p-1");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(4, ctx_r0.isLegal ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(5, (ctx_r0.detail == null ? null : ctx_r0.detail.isAdmin) ? 5 : -1);
  }
}
function ProfileComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "span", 14);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "icon", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 16)(5, "span", 17);
    \u0275\u0275listener("click", function ProfileComponent_Conditional_7_Template_span_click_5_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.accountSetting());
    });
    \u0275\u0275text(6, " Account Setting ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 18);
    \u0275\u0275listener("click", function ProfileComponent_Conditional_7_Template_span_click_7_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.logOut());
    });
    \u0275\u0275text(8, " Logout ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.detail == null ? null : ctx_r0.detail.cFname);
    \u0275\u0275advance(3);
    \u0275\u0275classMap(ctx_r0.isdark ? "text-white p-3" : " px-2  hover:bg-gray-100 p-1 ");
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r0.isdark ? "text-white p-3" : " px-2  hover:bg-gray-100 p-1 ");
  }
}
var ProfileComponent = class _ProfileComponent {
  // private uDash: UserdashboardService,
  constructor(ss, hs, cf, logout, dialog, router, cdr) {
    this.ss = ss;
    this.hs = hs;
    this.cf = cf;
    this.logout = logout;
    this.dialog = dialog;
    this.router = router;
    this.cdr = cdr;
    this.isLegal = ["T", "M", "D"].includes(environment.als);
    this.size = "sm";
    this.icon = true;
    this.showname = false;
    this.userguidebtn = true;
    this.iconwhite = false;
    this.isdark = false;
    this.type = "admin";
    this.gap = "";
    this.addcls = "";
  }
  ngOnInit() {
  }
  logOut() {
    return __async(this, null, function* () {
      yield this.logout.logout();
      this.ss.logOut();
      this.cf.goto("/auth/login");
    });
  }
  get addClasses() {
    return `${this.addcls} || ''}`;
  }
  accountSetting() {
    var data = {
      nCaseid: this.hs.Casedetail.nCaseid,
      nUserid: this.detail.nUserid,
      ismyfiles: true
    };
    const dialogRef = this.dialog.open(UsercreationComponent, {
      width: "678px",
      height: "fit-content",
      maxHeight: "99vh",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      backdropClass: "profilebackdrop",
      data,
      position: {
        top: "58px",
        right: "10px"
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.isSave) {
        debugger;
        this.detail.cProfile = result.cProfile || this.detail.cProfile;
        this.detail.cFname = result.cFname || this.detail.cFname;
        this.detail.cLname = result.cLname || this.detail.cLname;
        this.ss.setUserInfo(this.detail, 0);
        this.cdr.detectChanges();
      }
    });
  }
  helpcenter() {
    this.cf.goto("/helpcenter");
  }
  helpcenteradmin() {
    this.cf.goto("/helpcenteradmin");
  }
  openInNewTab(route, param) {
    const url = this.router.serializeUrl(this.router.createUrlTree([route, param]));
    window.open(url, "_blank");
  }
  transcript() {
    this.cf.goto("/transcript");
  }
  static {
    this.\u0275fac = function ProfileComponent_Factory(t) {
      return new (t || _ProfileComponent)(\u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(LogoutService), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ProfileComponent, selectors: [["profile"]], inputs: { size: "size", detail: "detail", icon: [InputFlags.HasDecoratorInputTransform, "icon", "icon", booleanAttribute], showname: [InputFlags.HasDecoratorInputTransform, "showname", "showname", booleanAttribute], userguidebtn: "userguidebtn", iconwhite: "iconwhite", isdark: "isdark", type: "type", gap: "gap", addcls: "addcls" }, standalone: true, features: [\u0275\u0275ProvidersFeature([LogoutService]), \u0275\u0275InputTransformsFeature, \u0275\u0275StandaloneFeature], decls: 8, vars: 17, consts: [["profile", "matMenu"], [1, "flex", "items-center", "gap-2", 3, "matMenuTriggerFor", "ngClass"], [3, "path", "matTooltip", "detail", "size"], [4, "ngIf"], ["xPosition", "before", 1, "!min-w-fit", "mt-3", "-mr-2", 3, "backdropClass", "ngClass"], ["name", "chvx", 1, "text-xs", 3, "ngClass"], [1, "text-xs", "text-white"], [1, "block", "w-32", "text-xs"], [1, "block", "w-32", "text-xs", "cursor-pointer", "rounded-base", 3, "click"], [1, "block", "w-32", "text-xs", "cursor-pointer", "rounded-base", "mt-2.5", 3, "class"], [1, "p-3"], [1, "pl-3", "cursor-pointer", "rounded-base", 3, "click"], [1, "block", "w-32", "text-xs", "cursor-pointer", "rounded-base", "mt-2.5", 3, "click"], [1, "flex", "items-center", "justify-between", "w-64", "p-2"], [1, "text-lg"], ["name", "close", 1, "text-xs"], [1, "p-2"], [1, "text-xs", "cursor-pointer", "block", "rounded-base", "mb-1.5", "py-1.5", 3, "click"], [1, "text-xs", "cursor-pointer", "block", "rounded-base", "py-1.5", 3, "click"]], template: function ProfileComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275element(1, "avtr", 2);
        \u0275\u0275template(2, ProfileComponent_ng_container_2_Template, 2, 3, "ng-container", 3)(3, ProfileComponent_ng_container_3_Template, 3, 2, "ng-container", 3);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "mat-menu", 4, 0);
        \u0275\u0275template(6, ProfileComponent_Conditional_6_Template, 6, 5)(7, ProfileComponent_Conditional_7_Template, 9, 5);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        const profile_r9 = \u0275\u0275reference(5);
        \u0275\u0275property("matMenuTriggerFor", ctx.type == "user" ? null : profile_r9)("ngClass", \u0275\u0275pureFunction2(13, _c0, ctx.gap == "lg", ctx.type != "user"));
        \u0275\u0275advance();
        \u0275\u0275property("path", ctx.detail.cProfile)("matTooltip", (ctx.detail == null ? null : ctx.detail.cFname) + " " + (ctx.detail == null ? null : ctx.detail.cLname))("detail", ctx.detail)("size", ctx.size);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.icon);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.showname);
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.isdark ? "!rounded-none w-fit !bg-dark-blue" : "p-2");
        \u0275\u0275property("backdropClass", ctx.type == "user" ? "profilebackdrop" : "")("ngClass", \u0275\u0275pureFunction0(16, _c1));
        \u0275\u0275advance(2);
        \u0275\u0275conditional(6, ctx.type != "user" ? 6 : 7);
      }
    }, dependencies: [CommonModule, NgClass, NgIf, IconComponent, AvatarComponent, MatMenuModule, MatMenu, MatMenuTrigger, MatTooltipModule, MatTooltip, HttpClientModule, MatDialogModule] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ProfileComponent, { className: "ProfileComponent", filePath: "src\\app\\shared\\components\\profile\\profile.component.ts", lineNumber: 25 });
})();

export {
  ProfileComponent
};
//# sourceMappingURL=chunk-X5G7CPYH.js.map
