import {
  PermissionService
} from "./chunk-6UNV36RS.js";
import {
  MatSlideToggle,
  MatSlideToggleModule
} from "./chunk-43QUFIPG.js";
import {
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import "./chunk-42T75ZKA.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
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
  Location,
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
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/casebuilder/permission/editpermissions/editpermissions.component.ts
var _c0 = () => [1, 2, 3, 4, 4];
var _c1 = () => [1, 2, 3, 4, 5];
function EditpermissionsComponent_div_25_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "div", 16)(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "div", 17)(5, "span");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 18)(8, "mat-slide-toggle", 19);
    \u0275\u0275listener("change", function EditpermissionsComponent_div_25_Template_mat_slide_toggle_change_8_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updatePermission(x_r2));
    });
    \u0275\u0275twoWayListener("ngModelChange", function EditpermissionsComponent_div_25_Template_mat_slide_toggle_ngModelChange_8_listener($event) {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      \u0275\u0275twoWayBindingSet(x_r2.bValue, $event) || (x_r2.bValue = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r2.cModule, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r2.bValue ? "Enabled" : "Disabled", " ");
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", x_r2.bValue);
  }
}
function EditpermissionsComponent_div_26_div_1_div_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15)(1, "div", 16)(2, "span");
    \u0275\u0275text(3, " Workspace ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "div", 17)(5, "span");
    \u0275\u0275text(6, " Disabled ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 18);
    \u0275\u0275element(8, "mat-slide-toggle", 23);
    \u0275\u0275elementEnd()();
  }
}
function EditpermissionsComponent_div_26_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 21)(1, "h6", 22);
    \u0275\u0275text(2, "Respondent");
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, EditpermissionsComponent_div_26_div_1_div_3_Template, 9, 0, "div", 13);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction0(1, _c1));
  }
}
function EditpermissionsComponent_div_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12);
    \u0275\u0275template(1, EditpermissionsComponent_div_26_div_1_Template, 4, 2, "div", 20);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction0(1, _c0));
  }
}
var EditpermissionsComponent = class _EditpermissionsComponent {
  constructor(location, route, permissionS, userPermissions) {
    this.location = location;
    this.route = route;
    this.permissionS = permissionS;
    this.userPermissions = userPermissions;
    this.isloading = false;
    var params = this.route.snapshot.params;
    params = JSON.parse(decodeURIComponent(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : 0;
    this.nRoleid = params && params["role"] ? params["role"] : 0;
    this.cRole = params && params["rnm"] ? params["rnm"] : "";
    this.nUserid = params && params["user"] ? params["user"] : 0;
    this.cFname = params && params["fnm"] ? params["fnm"] : "";
    this.cLname = params && params["lnm"] ? params["lnm"] : "";
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngOnInit() {
    return __async(this, null, function* () {
      if (this.nRoleid) {
        this.getRoleModule();
      }
      if (this.nUserid) {
        this.getUserModule();
      }
    });
  }
  ResetDefaultPermission() {
    return __async(this, null, function* () {
      yield this.permissionS.resetRoleModule(this.nCaseid, this.nRoleid, this.nUserid);
      this.ngOnInit();
    });
  }
  getRoleModule() {
    return __async(this, null, function* () {
      this.isloading = true;
      this.moduleList = yield this.permissionS.permissionRoleModule({ nCaseid: this.nCaseid, nRoleid: this.nRoleid });
      this.isloading = false;
    });
  }
  getUserModule() {
    return __async(this, null, function* () {
      this.isloading = true;
      this.moduleList = yield this.permissionS.permissionUserModule({ nCaseid: this.nCaseid, nUserid: this.nUserid });
      this.isloading = false;
    });
  }
  back() {
    this.location.back();
  }
  updatePermission(x) {
    var mdl = {
      nCaseid: this.nCaseid,
      nRoleid: this.nRoleid,
      nUserid: this.nUserid,
      bValue: x.bValue,
      nPMid: x.nPMid
    };
    this.permissionS.updatePermission(mdl);
  }
  static {
    this.\u0275fac = function EditpermissionsComponent_Factory(t) {
      return new (t || _EditpermissionsComponent)(\u0275\u0275directiveInject(Location), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(PermissionService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EditpermissionsComponent, selectors: [["app-editpermissions"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 27, vars: 6, consts: [[1, "p-10", "flex", "flex-col", "h-full"], [1, "h-fit"], [1, "mb-2"], [1, "text-4xl", "flex", "justify-between", "items-center", "mb-7", "gap-3"], [1, "font-bold", 3, "click"], ["mode", "outlined", "addcls", "!text-blue-500 border-blue-500", 1, "ms-auto", "flex", 3, "click"], ["name", "close", 1, "text-base", "cursor-pointer", "hover:text-blue-500", 3, "click"], [1, "flex", "flex-col", "h-full", "overflow-hidden"], [1, "flex", "px-5", "py-2.5", "gap-5", "border", "rounded-full", "[&_div]:text-base", "[&_div]:font-semibold", "mb-6"], [1, "w-1/5"], [1, "w-2/5"], [1, "w-2/5", "text-end"], [1, "px-6", "h-full", "overflow-auto"], ["class", "tabbody flex gap-0 py-1.5 rounded-full relative ", 4, "ngFor", "ngForOf"], ["class", "px-6 h-full overflow-auto", 4, "ngIf"], [1, "tabbody", "flex", "gap-0", "py-1.5", "rounded-full", "relative"], [1, "text-sm", "flex", "items-center", "w-1/5"], [1, "text-sm", "w-2/5", "flex", "items-center"], [1, "w-2/5", "flex"], ["hideIcon", "", 1, "permission", "ms-auto", "me-4", 3, "change", "ngModelChange", "ngModel"], ["class", "last:border-b-0 last:pb-0 last:mb-0 border-b pb-5 mb-5", 4, "ngFor", "ngForOf"], [1, "last:border-b-0", "last:pb-0", "last:mb-0", "border-b", "pb-5", "mb-5"], [1, "text-sm", "font-bold", "mb-3"], ["hideIcon", "", 1, "permission", "ms-auto", "me-4"]], template: function EditpermissionsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "header", 1)(2, "h6", 2);
        \u0275\u0275text(3, "Control panel");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "h6", 3)(5, "span", 4);
        \u0275\u0275listener("click", function EditpermissionsComponent_Template_span_click_5_listener() {
          return ctx.back();
        });
        \u0275\u0275text(6);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "span");
        \u0275\u0275text(8, ">");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "span");
        \u0275\u0275text(10);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "span");
        \u0275\u0275text(12);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "btn", 5);
        \u0275\u0275listener("click", function EditpermissionsComponent_Template_btn_click_13_listener() {
          return ctx.ResetDefaultPermission();
        });
        \u0275\u0275text(14, " Reset to default ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "icon", 6);
        \u0275\u0275listener("click", function EditpermissionsComponent_Template_icon_click_15_listener() {
          return ctx.back();
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(16, "div", 7)(17, "div", 8)(18, "div", 9);
        \u0275\u0275text(19, "Module");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(20, "div", 10);
        \u0275\u0275text(21, "Status");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(22, "div", 11);
        \u0275\u0275text(23, "Permission");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(24, "div", 12);
        \u0275\u0275template(25, EditpermissionsComponent_div_25_Template, 9, 3, "div", 13);
        \u0275\u0275elementEnd();
        \u0275\u0275template(26, EditpermissionsComponent_div_26_Template, 2, 2, "div", 14);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(6);
        \u0275\u0275textInterpolate1(" ", ctx.nRoleid ? "Role Permission" : "User Permission", " ");
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(ctx.cRole);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate2(" ", ctx.cFname, " ", ctx.cLname, "");
        \u0275\u0275advance(13);
        \u0275\u0275property("ngForOf", ctx.moduleList);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", false);
      }
    }, dependencies: [CommonModule, NgForOf, NgIf, IconComponent, MatSelectModule, ButtonComponent, MatSlideToggleModule, MatSlideToggle, FormsModule, NgControlStatus, NgModel] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EditpermissionsComponent, { className: "EditpermissionsComponent", filePath: "src\\app\\adminpanel\\components\\casebuilder\\permission\\editpermissions\\editpermissions.component.ts", lineNumber: 19 });
})();
export {
  EditpermissionsComponent
};
//# sourceMappingURL=chunk-HTYPDPN7.js.map
