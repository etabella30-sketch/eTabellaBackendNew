import {
  PermissionService
} from "./chunk-6UNV36RS.js";
import "./chunk-3SO7BHVN.js";
import {
  UsercreationComponent
} from "./chunk-3A6FZELH.js";
import "./chunk-PNJCYNRI.js";
import "./chunk-43QUFIPG.js";
import "./chunk-E4U5AV5T.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField,
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import "./chunk-FEMUAMTL.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import "./chunk-H74SWAKT.js";
import "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import {
  MatDialog,
  MatDialogModule
} from "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
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
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
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
  NgClass,
  NgForOf
} from "./chunk-YBHDQMOW.js";
import {
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
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

// src/app/adminpanel/components/casebuilder/permission/userpermission/userpermission.component.ts
var _c0 = (a0, a1) => ({ "bg-teal-500": a0, "bg-neutral-500": a1 });
function UserpermissionComponent_div_21_div_3_For_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 20);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const food_r4 = ctx.$implicit;
    \u0275\u0275property("value", food_r4.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(food_r4.viewValue);
  }
}
function UserpermissionComponent_div_21_div_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 12)(1, "div", 13)(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "div", 14)(5, "span");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 15)(8, "span", 16);
    \u0275\u0275listener("click", function UserpermissionComponent_div_21_div_3_Template_span_click_8_listener() {
      const user_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.manageUser(user_r2));
    });
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "div", 15)(11, "span", 17);
    \u0275\u0275listener("click", function UserpermissionComponent_div_21_div_3_Template_span_click_11_listener() {
      const user_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.editPermission(user_r2));
    });
    \u0275\u0275text(12, " View & Modify ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "div", 15)(14, "mat-form-field", 18)(15, "mat-select", 19);
    \u0275\u0275twoWayListener("ngModelChange", function UserpermissionComponent_div_21_div_3_Template_mat_select_ngModelChange_15_listener($event) {
      const user_r2 = \u0275\u0275restoreView(_r1).$implicit;
      \u0275\u0275twoWayBindingSet(user_r2.nQuota, $event) || (user_r2.nQuota = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("selectionChange", function UserpermissionComponent_div_21_div_3_Template_mat_select_selectionChange_15_listener() {
      const user_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.manageQuota(user_r2));
    });
    \u0275\u0275repeaterCreate(16, UserpermissionComponent_div_21_div_3_For_17_Template, 2, 2, "mat-option", 20, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(18, "div", 15)(19, "btn", 21);
    \u0275\u0275listener("click", function UserpermissionComponent_div_21_div_3_Template_btn_click_19_listener() {
      const user_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.editUser(user_r2));
    });
    \u0275\u0275element(20, "icon", 22);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const user_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2(" ", user_r2.cFname, " ", user_r2.cLname, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", user_r2.cRole, " ");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("disabled", !ctx_r2.userInfo.isAdmin && ctx_r2.userInfo.nUserid == user_r2.nUserid);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(12, _c0, user_r2.cStatus == "A", user_r2.cStatus != "A"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", user_r2.cStatus == "A" ? "Enabled" : "Disabled", " ");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("disabled", !ctx_r2.userInfo.isAdmin && ctx_r2.userInfo.nUserid == user_r2.nUserid);
    \u0275\u0275advance(4);
    \u0275\u0275property("disabled", !ctx_r2.userInfo.isAdmin && ctx_r2.userInfo.nUserid == user_r2.nUserid);
    \u0275\u0275twoWayProperty("ngModel", user_r2.nQuota);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.foods);
    \u0275\u0275advance(3);
    \u0275\u0275property("square", true);
  }
}
function UserpermissionComponent_div_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9)(1, "h6", 10);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, UserpermissionComponent_div_21_div_3_Template, 21, 15, "div", 11);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r5.cTeamname);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", x_r5.users);
  }
}
var UserpermissionComponent = class _UserpermissionComponent {
  constructor(cf, dialog, route, permissionS, location, ss, userPermissions) {
    this.cf = cf;
    this.dialog = dialog;
    this.route = route;
    this.permissionS = permissionS;
    this.location = location;
    this.ss = ss;
    this.userPermissions = userPermissions;
    this.foods = [
      { value: "1000000000000", viewValue: "Unlimited" },
      { value: "100000", viewValue: "100mb" },
      { value: "500000", viewValue: "500mb" },
      { value: "1000000", viewValue: "1gb" },
      { value: "100000000", viewValue: "100gb" }
    ];
    this.isloading = false;
    var params = this.route.snapshot.params;
    params = JSON.parse(atob(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : 0;
    userPermissions.userPermissionList(this.nCaseid);
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userInfo = yield this.ss.getUserInfo();
      this.getTeamList();
    });
  }
  editPermission(x) {
    if (!this.userInfo.isAdmin && this.userInfo.nUserid == x.nUserid) {
      return;
    }
    this.cf.gotoEncoduri("/permission/editpermission", { id: this.nCaseid, user: x.nUserid, fnm: x.cFname, lnm: x.cLname });
  }
  getTeamList() {
    this.isloading = true;
    this.permissionS.userpermissionList(this.nCaseid).then((res) => {
      this.teamlist = res;
      this.isloading = false;
    });
  }
  manageUser(x) {
    if (!this.userInfo.isAdmin && this.userInfo.nUserid == x.nUserid) {
      return;
    }
    x.cStatus = x.cStatus == "A" ? "I" : "A";
    this.permissionS.manageUser({ nCaseid: this.nCaseid, nUserid: x.nUserid, cStatus: x.cStatus });
  }
  manageQuota(x) {
    this.permissionS.manageQuota({ nCaseid: this.nCaseid, nUserid: x.nUserid, nQuota: parseFloat(x.nQuota) });
  }
  close() {
    this.location.back();
  }
  editUser(x) {
    const dialogRef = this.dialog.open(UsercreationComponent, {
      width: "fit-content",
      height: "fit-content",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: {
        nCaseid: this.nCaseid,
        nUserid: x && x.nUserid ? x.nUserid : null
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result["isSave"]) {
        if (result["delete"]) {
          var team = this.teamlist.find((team2) => team2.nTeamid = x.nTeamid);
          var ind = team.users.findIndex((user) => user.nUserid == x.nUserid);
          team.users.splice(ind, 1);
          if (!team.users.length) {
            ind = this.teamlist.findIndex((team2) => team2.nTeamid = x.nTeamid);
            this.teamlist.splice(ind, 1);
          }
          return;
        }
        this.getTeamList();
        var values = dialogRef.componentInstance.userForm.value;
        x.cFname = values.cFname;
        x.cLname = values.cLname;
        if (x.nTeamid != values.nTeamid) {
          x.nTeamid = values.nTeamid;
          var team = this.teamlist.find((team2) => team2.nTeamid = x.nTeamid);
          var ind = team.users.findIndex((user) => user.nUserid == x.nUserid);
          this.teamlist.find((team2) => team2.nTeamid = values.nTeamid).users.push(team.users[ind]);
          team.users.splice(ind, 1);
          if (!team.users.length) {
            ind = this.teamlist.findIndex((team2) => team2.nTeamid = x.nTeamid);
            this.teamlist.splice(ind, 1);
          }
        }
      }
    });
  }
  static {
    this.\u0275fac = function UserpermissionComponent_Factory(t) {
      return new (t || _UserpermissionComponent)(\u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(PermissionService), \u0275\u0275directiveInject(Location), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UserpermissionComponent, selectors: [["app-userpermission"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 22, vars: 1, consts: [[1, "p-10", "flex", "flex-col", "h-full"], [1, "h-fit"], [1, "mb-2"], [1, "text-4xl", "flex", "justify-between", "items-center", "font-bold", "mb-7"], ["name", "close", 1, "text-lg", "ms-auto", "cursor-pointer", "hover:text-blue-500", 3, "click"], [1, "flex", "flex-col", "h-full", "overflow-hidden"], [1, "flex", "px-5", "py-2.5", "gap-5", "border", "rounded-full", "[&_div]:w-1/6", "[&_div]:text-base", "[&_div]:font-semibold", "mb-6"], [1, "px-6", "h-full", "overflow-auto"], ["class", "last:border-b-0 last:pb-0 last:mb-0 border-b pb-5 mb-5", 4, "ngFor", "ngForOf"], [1, "last:border-b-0", "last:pb-0", "last:mb-0", "border-b", "pb-5", "mb-5"], [1, "text-sm", "font-bold", "mb-3"], ["class", "tabbody flex gap-0 py-1.5 rounded-full relative ", 4, "ngFor", "ngForOf"], [1, "tabbody", "flex", "gap-0", "py-1.5", "rounded-full", "relative"], [1, "text-sm", "flex", "items-center", "w-1/6"], [1, "text-sm", "w-1/6", "flex", "items-center"], [1, "w-1/6"], [1, "w-32", "block", "cursor-pointer", "py-2", "text-xs", "rounded-full", "text-white", "text-center", 3, "click", "ngClass"], [1, "cursor-pointer", "px-3", "py-2", "border", "border-gray-600", "hover:bg-neutral-500", "text-gray-500", "text-xs", "rounded-full", "hover:text-white", "text-center", 3, "click"], [1, "w-full"], ["placeholder", "Select...", 1, "w-full", 3, "ngModelChange", "selectionChange", "disabled", "ngModel"], [3, "value"], ["mode", "outlined", "matTooltip", "Edit User", "addcls", "rounded-full", 1, "block", "w-fit", "ml-auto", 3, "click", "square"], ["name", "edit"]], template: function UserpermissionComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "header", 1)(2, "h6", 2);
        \u0275\u0275text(3, "Control panel");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "h6", 3);
        \u0275\u0275text(5, "User Permission ");
        \u0275\u0275elementStart(6, "icon", 4);
        \u0275\u0275listener("click", function UserpermissionComponent_Template_icon_click_6_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(7, "div", 5)(8, "div", 6)(9, "div");
        \u0275\u0275text(10, "Name");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "div");
        \u0275\u0275text(12, "Role");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "div");
        \u0275\u0275text(14, "Status");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "div");
        \u0275\u0275text(16, "Permission");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(17, "div");
        \u0275\u0275text(18, "Quota");
        \u0275\u0275elementEnd();
        \u0275\u0275element(19, "div");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(20, "div", 7);
        \u0275\u0275template(21, UserpermissionComponent_div_21_Template, 4, 2, "div", 8);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(21);
        \u0275\u0275property("ngForOf", ctx.teamlist);
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, IconComponent, ButtonComponent, MatFormFieldModule, MatFormField, MatSelectModule, MatSelect, MatOption, FormsModule, NgControlStatus, NgModel, MatTooltipModule, MatTooltip, MatDialogModule], styles: ["\n\n.disabled[_ngcontent-%COMP%] {\n  background: rgb(192, 190, 190) !important;\n  color: black;\n}\n/*# sourceMappingURL=userpermission.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UserpermissionComponent, { className: "UserpermissionComponent", filePath: "src\\app\\adminpanel\\components\\casebuilder\\permission\\userpermission\\userpermission.component.ts", lineNumber: 31 });
})();
export {
  UserpermissionComponent
};
//# sourceMappingURL=chunk-AURY3EZ4.js.map
