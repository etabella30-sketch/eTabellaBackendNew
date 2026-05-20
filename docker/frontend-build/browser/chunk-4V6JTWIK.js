import {
  PermissionService
} from "./chunk-6UNV36RS.js";
import {
  NgScrollbar,
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import {
  BadgeComponent
} from "./chunk-3SO7BHVN.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
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
import {
  ActivatedRoute
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  DatePipe,
  Location,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
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
  ɵɵpureFunction3,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/casebuilder/permission/rolepermission/rolepermission.component.ts
var _c0 = (a0, a1, a2) => ({ "bg-grey text-white w-72": a0, "w-full bg-zinc-300 text-grey": a1, "bg-grey/50": a2 });
var _c1 = (a0, a1) => ({ "bg-teal-500": a0, "bg-neutral-500": a1 });
var _c2 = (a0, a1) => ({ "cFname": a0, "cLname": a1 });
function RolepermissionComponent_div_17_icon_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 20);
    \u0275\u0275listener("click", function RolepermissionComponent_div_17_icon_7_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      return \u0275\u0275resetView(x_r2.expanded = x_r2.users.length ? true : false);
    });
    \u0275\u0275elementEnd();
  }
}
function RolepermissionComponent_div_17_div_9_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23);
    \u0275\u0275element(1, "avtr", 24);
    \u0275\u0275elementStart(2, "div", 25);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const user_r4 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("detail", \u0275\u0275pureFunction2(3, _c2, user_r4.cFname, user_r4.cLname));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", user_r4.cFname, " ", user_r4.cLname, " ");
  }
}
function RolepermissionComponent_div_17_div_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 21);
    \u0275\u0275template(1, RolepermissionComponent_div_17_div_9_div_1_Template, 4, 6, "div", 22);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", x_r2.users);
  }
}
function RolepermissionComponent_div_17_icon_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 26);
    \u0275\u0275listener("click", function RolepermissionComponent_div_17_icon_10_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      return \u0275\u0275resetView(x_r2.expanded = false);
    });
    \u0275\u0275elementEnd();
  }
}
function RolepermissionComponent_div_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7)(1, "div", 8)(2, "div", 9)(3, "badge", 10);
    \u0275\u0275listener("click", function RolepermissionComponent_div_17_Template_badge_click_3_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      return \u0275\u0275resetView(x_r2.expanded = x_r2.users.length ? true : false);
    });
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 11);
    \u0275\u0275listener("click", function RolepermissionComponent_div_17_Template_div_click_5_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      return \u0275\u0275resetView(x_r2.expanded = x_r2.users.length ? true : false);
    });
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, RolepermissionComponent_div_17_icon_7_Template, 1, 0, "icon", 12);
    \u0275\u0275elementStart(8, "ng-scrollbar", 13);
    \u0275\u0275template(9, RolepermissionComponent_div_17_div_9_Template, 2, 1, "div", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, RolepermissionComponent_div_17_icon_10_Template, 1, 0, "icon", 15);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 8)(12, "span", 16);
    \u0275\u0275listener("click", function RolepermissionComponent_div_17_Template_span_click_12_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.manageRole(x_r2));
    });
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "div", 17)(15, "span", 18);
    \u0275\u0275listener("click", function RolepermissionComponent_div_17_Template_span_click_15_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r5 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r5.editPermission(x_r2));
    });
    \u0275\u0275text(16, " View & Modify ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(17, "div", 19)(18, "span");
    \u0275\u0275text(19);
    \u0275\u0275pipe(20, "date");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction3(16, _c0, !x_r2.expanded, x_r2.expanded, !x_r2.users.length));
    \u0275\u0275advance();
    \u0275\u0275property("type", x_r2.expanded ? "dark" : "solid")("square", true);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", x_r2.users.length, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r2.cRole);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !x_r2.expanded);
    \u0275\u0275advance();
    \u0275\u0275property("visibility", "hover")("appearance", "compact");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r2.expanded);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r2.expanded && x_r2.users.length);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(20, _c1, x_r2.cStatus == "A", x_r2.cStatus != "A"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r2.cStatus == "A" ? "Enabled" : "Disabled", " ");
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" Last modified on ", x_r2.dLastmodified ? \u0275\u0275pipeBind2(20, 13, x_r2.dLastmodified, "MM/dd/YYYY") : "MM/DD/YYYY", "");
  }
}
var RolepermissionComponent = class _RolepermissionComponent {
  constructor(route, permissionS, cf, location, userPermissions) {
    this.route = route;
    this.permissionS = permissionS;
    this.cf = cf;
    this.location = location;
    this.userPermissions = userPermissions;
    this.expanded = false;
    this.isloading = false;
    var params = this.route.snapshot.params;
    params = JSON.parse(atob(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : 0;
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.getPermission();
    });
  }
  getPermission() {
    return __async(this, null, function* () {
      this.isloading = true;
      this.rolePermissionLs = yield this.permissionS.rolePermission(this.nCaseid);
      console.log(this.rolePermissionLs);
      this.isloading = false;
    });
  }
  editPermission(x) {
    this.cf.gotoEncoduri("/permission/editpermission", { id: this.nCaseid, role: x.nRoleid, rnm: x.cRole });
  }
  close() {
    this.location.back();
  }
  manageRole(x) {
    x.cStatus = x.cStatus == "A" ? "I" : "A";
    this.permissionS.manageRole({ nCaseid: this.nCaseid, nRoleid: x.nRoleid, cStatus: x.cStatus });
  }
  static {
    this.\u0275fac = function RolepermissionComponent_Factory(t) {
      return new (t || _RolepermissionComponent)(\u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(PermissionService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(Location), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RolepermissionComponent, selectors: [["app-rolepermission"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 18, vars: 1, consts: [[1, "p-10"], [1, "text-3xl", "flex", "justify-between", "font-semibold", "mb-7"], ["name", "close", 1, "text-lg", "ms-auto", "cursor-pointer", "hover:text-blue-500", 3, "click"], [1, "flex", "px-5", "py-2.5", "border", "rounded-full", "[&_div]:w-1/5", "[&_div]:text-lg", "[&_div]:font-semibold", "mb-6"], [1, "!w-1/4"], [1, ""], ["class", "tabbody flex px-5 py-2.5 rounded-full relative", 4, "ngFor", "ngForOf"], [1, "tabbody", "flex", "px-5", "py-2.5", "rounded-full", "relative"], [1, "w-1/4"], [1, "absolute", "top-1/2", "-translate-y-1/2", "px-5", "rounded-full", "items-center", "flex", "gap-2", "transition-all", 3, "ngClass"], [1, "flex", "cursor-pointer", 3, "click", "type", "square"], [1, "text-sm", "cursor-pointer", "font-semibold", "whitespace-nowrap", "w-60", "py-2", 3, "click"], ["class", "rotate-180 font-light text-xs ms-auto cursor-pointer", "name", "chvy", 3, "click", 4, "ngIf"], [3, "visibility", "appearance"], ["class", "users flex gap-2 w-full overflow-auto scrollthin", 4, "ngIf"], ["class", "font-light text-xs ms-4 cursor-pointer", "name", "close", 3, "click", 4, "ngIf"], [1, "w-36", "block", "cursor-pointer", "py-2", "text-xs", "rounded-full", "text-white", "text-center", 3, "click", "ngClass"], [1, "w-1/5", "flex", "items-center"], [1, "custcls", 3, "click"], [1, "w-1/5", "text-sm", "flex", "items-center"], ["name", "chvy", 1, "rotate-180", "font-light", "text-xs", "ms-auto", "cursor-pointer", 3, "click"], [1, "users", "flex", "gap-2", "w-full", "overflow-auto", "scrollthin"], ["class", "flex gap-2 items-center my-4", 4, "ngFor", "ngForOf"], [1, "flex", "gap-2", "items-center", "my-4"], ["size", "sm", 3, "detail"], [1, "whitespace-nowrap", "text-xs"], ["name", "close", 1, "font-light", "text-xs", "ms-4", "cursor-pointer", 3, "click"]], template: function RolepermissionComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "header")(2, "h6");
        \u0275\u0275text(3, "Control panel");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "h6", 1);
        \u0275\u0275text(5, "Role Permission ");
        \u0275\u0275elementStart(6, "icon", 2);
        \u0275\u0275listener("click", function RolepermissionComponent_Template_icon_click_6_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(7, "div")(8, "div", 3)(9, "div", 4);
        \u0275\u0275text(10, "Name");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "div", 4);
        \u0275\u0275text(12, "Status");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "div", 5);
        \u0275\u0275text(14, "User Level Permission");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "div", 5);
        \u0275\u0275text(16, "Last Updated");
        \u0275\u0275elementEnd()();
        \u0275\u0275template(17, RolepermissionComponent_div_17_Template, 21, 23, "div", 6);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(17);
        \u0275\u0275property("ngForOf", ctx.rolePermissionLs);
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, DatePipe, IconComponent, BadgeComponent, AvatarComponent, NgScrollbarModule, NgScrollbar], styles: ["\n\n.custcls[_ngcontent-%COMP%] {\n  display: block;\n  width: 9rem;\n  cursor: pointer;\n  border-radius: 9999px;\n  border-width: 1px;\n  --tw-border-opacity: 1;\n  border-color: rgb(75 85 99 / var(--tw-border-opacity, 1));\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n  text-align: center;\n  font-size: 0.75rem;\n  line-height: 1rem;\n  --tw-text-opacity: 1;\n  color: rgb(107 114 128 / var(--tw-text-opacity, 1));\n}\n.custcls[_ngcontent-%COMP%]:hover {\n  --tw-bg-opacity: 1;\n  background-color: rgb(115 115 115 / var(--tw-bg-opacity, 1));\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity, 1));\n}\n/*# sourceMappingURL=rolepermission.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RolepermissionComponent, { className: "RolepermissionComponent", filePath: "src\\app\\adminpanel\\components\\casebuilder\\permission\\rolepermission\\rolepermission.component.ts", lineNumber: 21 });
})();
export {
  RolepermissionComponent
};
//# sourceMappingURL=chunk-4V6JTWIK.js.map
