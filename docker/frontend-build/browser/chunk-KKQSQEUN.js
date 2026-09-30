import {
  MatIconModule
} from "./chunk-SUYASFF3.js";
import {
  NativeElementInjectorDirective,
  NgxIntlTelInputModule
} from "./chunk-4WAWQBKW.js";
import {
  ContactService
} from "./chunk-5HHWKW4L.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField,
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import {
  DefaultValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  MaxLengthValidator,
  NgControlStatus,
  NgControlStatusGroup,
  NgModel,
  ReactiveFormsModule,
  Validators,
  ɵNgNoValidate
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  MatButtonModule
} from "./chunk-W3IEBGJA.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
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
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpropertyInterpolate,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/contacts/roles/roles.component.ts
var _c0 = (a0, a1) => ({ "iseditable": a0, "disable": a1 });
function RolesComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 6)(1, "input", 9);
    \u0275\u0275twoWayListener("ngModelChange", function RolesComponent_Conditional_7_Template_input_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.newrole, $event) || (ctx_r1.newrole = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "btn", 10);
    \u0275\u0275listener("click", function RolesComponent_Conditional_7_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.save_role());
    });
    \u0275\u0275text(3, "OK");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.newrole);
  }
}
function RolesComponent_For_10_h6_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(r_r3.cRole);
  }
}
function RolesComponent_For_10_input_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 14);
    \u0275\u0275twoWayListener("ngModelChange", function RolesComponent_For_10_input_2_Template_input_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const r_r3 = \u0275\u0275nextContext().$implicit;
      \u0275\u0275twoWayBindingSet(r_r3.cRole, $event) || (r_r3.cRole = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function RolesComponent_For_10_input_2_Template_input_keyup_enter_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const r_r3 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.save_rolename($event, r_r3));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    const r_r3 = ctx_r4.$implicit;
    const $index_r6 = ctx_r4.$index;
    \u0275\u0275propertyInterpolate("id", "editrole" + $index_r6);
    \u0275\u0275twoWayProperty("ngModel", r_r3.cRole);
  }
}
function RolesComponent_For_10_div_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "btn", 16);
    \u0275\u0275listener("click", function RolesComponent_For_10_div_3_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r7);
      const r_r3 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      r_r3.iseditable = !r_r3.iseditable;
      return \u0275\u0275resetView(ctx_r1.editRole("E"));
    });
    \u0275\u0275element(2, "icon", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "btn", 16);
    \u0275\u0275listener("click", function RolesComponent_For_10_div_3_Template_btn_click_3_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r4 = \u0275\u0275nextContext();
      const r_r3 = ctx_r4.$implicit;
      const $index_r6 = ctx_r4.$index;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.remove_role(r_r3, $index_r6));
    });
    \u0275\u0275element(4, "icon", 18);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("square", true);
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true);
  }
}
function RolesComponent_For_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275template(1, RolesComponent_For_10_h6_1_Template, 2, 1, "h6", 11)(2, RolesComponent_For_10_input_2_Template, 1, 2, "input", 12)(3, RolesComponent_For_10_div_3_Template, 5, 2, "div", 13);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r3 = ctx.$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(4, _c0, r_r3.iseditable, r_r3.cIsdefault == "Y"));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !r_r3.iseditable);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", r_r3.iseditable);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", r_r3.cIsdefault != "Y");
  }
}
var RolesComponent = class _RolesComponent {
  constructor(contactService) {
    this.contactService = contactService;
    this.showroleinput = false;
    this.role_list = [];
    this.newrole = "";
    this.roleparent = new EventEmitter();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      const list = yield this.contactService.getContactRole(this.nCaseid);
      this.role_list.splice(0, this.role_list.length);
      this.role_list.push(...list);
    });
  }
  save_role() {
    return __async(this, null, function* () {
      if (!this.newrole || this.newrole.trim() == "") {
        return;
      }
      var mdl = {};
      mdl.nCaseid = this.nCaseid;
      mdl.cRole = this.newrole;
      mdl.nCRoleid = null;
      mdl.permission = "N";
      console.log(this.newrole);
      const res = yield this.contactService.roleBuilder(mdl);
      this.showroleinput = false;
      this.newrole = "";
      this.ngOnInit();
    });
  }
  back() {
    this.roleparent.emit("");
  }
  editRole(flag) {
    if (flag == "E") {
      this.showroleinput = false;
    } else {
      this.role_list.map((x) => {
        x.iseditable = false;
      });
    }
  }
  save_rolename(ev, x) {
    return __async(this, null, function* () {
      x.iseditable = !x.iseditable;
      if (!x.cRole || x.cRole == "") {
        return;
      }
      var mdl = {};
      mdl.nCaseid = this.nCaseid;
      mdl.cRole = x.cRole;
      mdl.nCRoleid = x.nCRoleid;
      mdl.permission = "E";
      const res = yield this.contactService.roleBuilder(mdl);
      this.ngOnInit();
    });
  }
  remove_role(x, ind) {
    return __async(this, null, function* () {
      var mdl = {};
      mdl.nCaseid = this.nCaseid;
      mdl.cRole = x.cRole;
      mdl.nCRoleid = x.nCRoleid;
      mdl.permission = "D";
      const res = yield this.contactService.roleBuilder(mdl);
      this.ngOnInit();
    });
  }
  addnewrole() {
    this.showroleinput = !this.showroleinput;
    if (this.showroleinput) {
      var input = document.getElementById("roleinput");
      setTimeout(() => {
        input.focus();
      }, 100);
      this.editRole("N");
    }
  }
  static {
    this.\u0275fac = function RolesComponent_Factory(t) {
      return new (t || _RolesComponent)(\u0275\u0275directiveInject(ContactService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RolesComponent, selectors: [["app-roles"]], inputs: { nCaseid: "nCaseid", role_list: "role_list" }, outputs: { roleparent: "roleparent" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 11, vars: 2, consts: [[1, "h-full", "flex", "flex-col", "overflow-hidden"], [1, "text-lg", "font-semibold", "items-center", "gap-2", "flex", "px-5", "py-2.5"], ["name", "chvy", 1, "text-base", 3, "click"], ["mode", "outlined", 1, "w-fit", "ms-auto", 3, "click", "square"], ["name", "addfill", "type", "comnicn"], [1, "overflow-auto", "h-full", "py-1.5", "px-5"], ["for", "frstname", 1, "p-2", "flex", "gap-2", "items-center"], [1, "py-2", "flex", "flex-col", "gap-2"], [1, "bg-white", "text-grey", "rounded-base", "group", "hover:shadow-[1px_1px_8px_#0000001a]", "p-2.5", "text-xs", "group", "flex", "items-center", "justify-between", 3, "ngClass"], ["id", "roleinput", "type", "text", 1, "main-input", 3, "ngModelChange", "ngModel"], [3, "click"], [4, "ngIf"], ["type", "text", "maxlength", "55", "name", "text", "class", "dropnew me-2", 3, "id", "ngModel", "ngModelChange", "keyup.enter", 4, "ngIf"], ["class", "flex opacity-0 gap-2 group-hover:opacity-100", 4, "ngIf"], ["type", "text", "maxlength", "55", "name", "text", 1, "dropnew", "me-2", 3, "ngModelChange", "keyup.enter", "id", "ngModel"], [1, "flex", "opacity-0", "gap-2", "group-hover:opacity-100"], ["mode", "outlined", 3, "click", "square"], ["name", "edit"], ["name", "delete"]], template: function RolesComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "icon", 2);
        \u0275\u0275listener("click", function RolesComponent_Template_icon_click_2_listener() {
          return ctx.back();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275text(3, " Edit Occupation ");
        \u0275\u0275elementStart(4, "btn", 3);
        \u0275\u0275listener("click", function RolesComponent_Template_btn_click_4_listener() {
          return ctx.addnewrole();
        });
        \u0275\u0275element(5, "icon", 4);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 5);
        \u0275\u0275template(7, RolesComponent_Conditional_7_Template, 4, 1, "div", 6);
        \u0275\u0275elementStart(8, "div", 7);
        \u0275\u0275repeaterCreate(9, RolesComponent_For_10_Template, 4, 7, "div", 8, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275property("square", true);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(7, ctx.showroleinput ? 7 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.role_list);
      }
    }, dependencies: [CommonModule, NgClass, NgIf, IconComponent, FormsModule, DefaultValueAccessor, NgControlStatus, MaxLengthValidator, NgModel, ButtonComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RolesComponent, { className: "RolesComponent", filePath: "src\\app\\shared\\components\\contacts\\roles\\roles.component.ts", lineNumber: 16 });
})();

// src/app/shared/components/contacts/company/company.component.ts
var _c02 = (a0) => ({ "iseditable": a0 });
function CompanyComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 6)(1, "input", 9);
    \u0275\u0275twoWayListener("ngModelChange", function CompanyComponent_Conditional_7_Template_input_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.newcomp, $event) || (ctx_r1.newcomp = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "btn", 10);
    \u0275\u0275listener("click", function CompanyComponent_Conditional_7_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.save_comp());
    });
    \u0275\u0275text(3, "OK");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.newcomp);
  }
}
function CompanyComponent_For_10_h6_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(r_r4.cCompany);
  }
}
function CompanyComponent_For_10_input_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 18);
    \u0275\u0275twoWayListener("ngModelChange", function CompanyComponent_For_10_input_2_Template_input_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const r_r4 = \u0275\u0275nextContext().$implicit;
      \u0275\u0275twoWayBindingSet(r_r4.cCompany, $event) || (r_r4.cCompany = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keydown.enter", function CompanyComponent_For_10_input_2_Template_input_keydown_enter_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const r_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.save_rolename($event, r_r4));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r5 = \u0275\u0275nextContext();
    const r_r4 = ctx_r5.$implicit;
    const $index_r7 = ctx_r5.$index;
    \u0275\u0275propertyInterpolate("id", "editrole" + $index_r7);
    \u0275\u0275twoWayProperty("ngModel", r_r4.cCompany);
  }
}
function CompanyComponent_For_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 11);
    \u0275\u0275template(1, CompanyComponent_For_10_h6_1_Template, 2, 1, "h6", 12)(2, CompanyComponent_For_10_input_2_Template, 1, 2, "input", 13);
    \u0275\u0275elementStart(3, "div", 14)(4, "btn", 15);
    \u0275\u0275listener("click", function CompanyComponent_For_10_Template_btn_click_4_listener() {
      const r_r4 = \u0275\u0275restoreView(_r3).$implicit;
      return \u0275\u0275resetView(r_r4.iseditable = !r_r4.iseditable);
    });
    \u0275\u0275element(5, "icon", 16);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "btn", 15);
    \u0275\u0275listener("click", function CompanyComponent_For_10_Template_btn_click_6_listener() {
      const ctx_r7 = \u0275\u0275restoreView(_r3);
      const r_r4 = ctx_r7.$implicit;
      const $index_r7 = ctx_r7.$index;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.remove_comp(r_r4, $index_r7));
    });
    \u0275\u0275element(7, "icon", 17);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const r_r4 = ctx.$implicit;
    \u0275\u0275classProp("iseditable", r_r4.iseditable);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(7, _c02, r_r4.iseditable));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !r_r4.iseditable);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", r_r4.iseditable);
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true);
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true);
  }
}
var CompanyComponent = class _CompanyComponent {
  constructor(contactService, tost) {
    this.contactService = contactService;
    this.tost = tost;
    this.roleparent = new EventEmitter();
    this.showcompinput = false;
    this.newcomp = "";
    this.company_list = [];
  }
  ngOnInit() {
    return __async(this, null, function* () {
      const list = yield this.contactService.getContactCompany(this.nCaseid);
      this.company_list.splice(0, this.company_list.length);
      this.company_list.push(...list);
    });
  }
  back() {
    this.roleparent.emit("");
  }
  save_comp() {
    return __async(this, null, function* () {
      if (!this.newcomp || this.newcomp.trim() == "") {
        return;
      }
      var mdl = {};
      mdl.nCaseid = this.nCaseid;
      mdl.cCompany = this.newcomp;
      mdl.nCompanyid = null;
      mdl.permission = "N";
      const res = yield this.contactService.companyBuilder(mdl);
      this.showcompinput = false;
      this.newcomp = "";
      this.ngOnInit();
    });
  }
  save_rolename(ev, x) {
    return __async(this, null, function* () {
      x.iseditable = !x.iseditable;
      if (!x.cCompany || x.cCompany == "") {
        return;
      }
      var mdl = {};
      mdl.nCaseid = this.nCaseid;
      mdl.cCompany = x.cCompany;
      mdl.nCompanyid = x.nCompanyid;
      mdl.permission = "E";
      const res = yield this.contactService.companyBuilder(mdl);
      this.ngOnInit();
    });
  }
  remove_comp(x, ind) {
    return __async(this, null, function* () {
      var mdl = {};
      mdl.nCaseid = this.nCaseid;
      mdl.nCompanyid = x.nCompanyid;
      mdl.cCompany = x.cCompany;
      mdl.nCompanyid = x.nCompanyid;
      mdl.permission = "D";
      const res = yield this.contactService.companyBuilder(mdl);
      if (res["msg"] == 1) {
        this.company_list.splice(ind, 1);
      } else {
        this.tost.openSnackBar(res[0]["value1"], "E");
      }
    });
  }
  addnewcomp() {
    this.showcompinput = !this.showcompinput;
    if (this.showcompinput) {
      var input = document.getElementById("compinput");
      setTimeout(() => {
        input.focus();
      }, 100);
    }
  }
  static {
    this.\u0275fac = function CompanyComponent_Factory(t) {
      return new (t || _CompanyComponent)(\u0275\u0275directiveInject(ContactService), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CompanyComponent, selectors: [["app-company"]], inputs: { nCaseid: "nCaseid", company_list: "company_list" }, outputs: { roleparent: "roleparent" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 11, vars: 2, consts: [[1, "addnewcontact", "error", "flex", "flex-col", "overflow-hidden", "h-full"], [1, "text-lg", "px-5", "py-2.5", "font-semibold", "items-center", "gap-2", "flex", "sticky", "top-0", "bg-white"], ["name", "chvy", 1, "text-base", 3, "click"], ["mode", "outlined", 1, "w-fit", "ms-auto", 3, "click", "square"], ["name", "addfill", "type", "comnicn"], [1, "px-5", "pt-1.5", "overflow-auto", "h-full"], ["for", "frstname", 1, "p-2", "flex", "gap-2", "items-center"], [1, "py-2", "flex", "flex-col", "gap-2"], [1, "bg-white", "text-grey", "rounded-base", "group", "hover:shadow-[1px_1px_8px_#0000001a]", "p-2.5", "text-xs", "group", "flex", "items-center", "justify-between", 3, "iseditable", "ngClass"], ["type", "text", "id", "compinput", 1, "main-input", 3, "ngModelChange", "ngModel"], [3, "click"], [1, "bg-white", "text-grey", "rounded-base", "group", "hover:shadow-[1px_1px_8px_#0000001a]", "p-2.5", "text-xs", "group", "flex", "items-center", "justify-between", 3, "ngClass"], [4, "ngIf"], ["type", "text", "maxlength", "55", "name", "text", "class", "dropnew", "onInput", "this.parentNode.dataset.replicatedValue = this.value", 3, "id", "ngModel", "ngModelChange", "keydown.enter", 4, "ngIf"], [1, "flex", "opacity-0", "gap-2", "group-hover:opacity-100"], ["mode", "outlined", 3, "click", "square"], ["name", "edit"], ["name", "delete"], ["type", "text", "maxlength", "55", "name", "text", "onInput", "this.parentNode.dataset.replicatedValue = this.value", 1, "dropnew", 3, "ngModelChange", "keydown.enter", "id", "ngModel"]], template: function CompanyComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "icon", 2);
        \u0275\u0275listener("click", function CompanyComponent_Template_icon_click_2_listener() {
          return ctx.back();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275text(3, " Edit Company ");
        \u0275\u0275elementStart(4, "btn", 3);
        \u0275\u0275listener("click", function CompanyComponent_Template_btn_click_4_listener() {
          return ctx.addnewcomp();
        });
        \u0275\u0275element(5, "icon", 4);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 5);
        \u0275\u0275template(7, CompanyComponent_Conditional_7_Template, 4, 1, "div", 6);
        \u0275\u0275elementStart(8, "div", 7);
        \u0275\u0275repeaterCreate(9, CompanyComponent_For_10_Template, 8, 9, "div", 8, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275property("square", true);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(7, ctx.showcompinput ? 7 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.company_list);
      }
    }, dependencies: [CommonModule, NgClass, NgIf, IconComponent, FormsModule, DefaultValueAccessor, NgControlStatus, MaxLengthValidator, NgModel, ButtonComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CompanyComponent, { className: "CompanyComponent", filePath: "src\\app\\shared\\components\\contacts\\company\\company.component.ts", lineNumber: 15 });
})();

// src/app/shared/components/contacts/contact-form/contact-form.component.ts
var _c03 = ["someInput"];
var _c1 = ["header"];
var _forTrack0 = ($index, $item) => $item.nCompanyid;
var _forTrack1 = ($index, $item) => $item.nCRoleid;
var _c2 = () => ({ standalone: true });
function ContactFormComponent_span_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 49);
  }
}
function ContactFormComponent_img_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 50);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("src", ctx_r1.profileUrl + ctx_r1.frm.value.cProfile, \u0275\u0275sanitizeUrl);
  }
}
function ContactFormComponent_span_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Upload");
    \u0275\u0275elementEnd();
  }
}
function ContactFormComponent_span_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Edit");
    \u0275\u0275elementEnd();
  }
}
function ContactFormComponent_ng_container_21_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 52);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const validation_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", validation_r3.message, " ");
  }
}
function ContactFormComponent_ng_container_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ContactFormComponent_ng_container_21_div_1_Template, 2, 1, "div", 51);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const validation_r3 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.frm.get("cFname").hasError(validation_r3.type) && ctx_r1.formsubmit);
  }
}
function ContactFormComponent_ng_container_28_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 52);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const validation_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", validation_r4.message, " ");
  }
}
function ContactFormComponent_ng_container_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ContactFormComponent_ng_container_28_div_1_Template, 2, 1, "div", 51);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const validation_r4 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.frm.get("cLname").hasError(validation_r4.type) && ctx_r1.formsubmit);
  }
}
function ContactFormComponent_ng_container_35_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 52);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const validation_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", validation_r5.message, " ");
  }
}
function ContactFormComponent_ng_container_35_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ContactFormComponent_ng_container_35_div_1_Template, 2, 1, "div", 51);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const validation_r5 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.frm.get("cEmail").hasError(validation_r5.type) && ctx_r1.formsubmit);
  }
}
function ContactFormComponent_For_53_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 56);
    \u0275\u0275listener("click", function ContactFormComponent_For_53_Conditional_0_Conditional_2_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "icon", 57);
    \u0275\u0275listener("click", function ContactFormComponent_For_53_Conditional_0_Conditional_2_Template_icon_click_1_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r8 = \u0275\u0275nextContext(2);
      const company_r7 = ctx_r8.$implicit;
      const $index_r10 = ctx_r8.$index;
      const ctx_r1 = \u0275\u0275nextContext();
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.editcompany(company_r7, $index_r10));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "icon", 58);
    \u0275\u0275listener("click", function ContactFormComponent_For_53_Conditional_0_Conditional_2_Template_icon_click_2_listener($event) {
      \u0275\u0275restoreView(_r8);
      const company_r7 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.deleteCompany(company_r7, $event));
    });
    \u0275\u0275elementEnd()();
  }
}
function ContactFormComponent_For_53_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 54);
    \u0275\u0275listener("click", function ContactFormComponent_For_53_Conditional_0_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const company_r7 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.selectCompany(company_r7));
    });
    \u0275\u0275text(1);
    \u0275\u0275template(2, ContactFormComponent_For_53_Conditional_0_Conditional_2_Template, 3, 0, "div", 55);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_18_0;
    const company_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", company_r7.cCompany, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ((tmp_18_0 = company_r7.canEdit) !== null && tmp_18_0 !== void 0 ? tmp_18_0 : true) ? 2 : -1);
  }
}
function ContactFormComponent_For_53_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 59)(1, "input", 60);
    \u0275\u0275listener("keypress", function ContactFormComponent_For_53_Conditional_1_Template_input_keypress_1_listener($event) {
      \u0275\u0275restoreView(_r11);
      const company_r7 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onCompanyEditKeyPress(company_r7, $event));
    })("click", function ContactFormComponent_For_53_Conditional_1_Template_input_click_1_listener($event) {
      \u0275\u0275restoreView(_r11);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "span", 61);
    \u0275\u0275element(3, "icon", 62);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r8 = \u0275\u0275nextContext();
    const company_r7 = ctx_r8.$implicit;
    const $index_r10 = ctx_r8.$index;
    \u0275\u0275advance();
    \u0275\u0275property("id", "companyeditinput" + $index_r10)("value", company_r7.cCompany);
  }
}
function ContactFormComponent_For_53_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ContactFormComponent_For_53_Conditional_0_Template, 3, 2, "div", 53)(1, ContactFormComponent_For_53_Conditional_1_Template, 4, 2);
  }
  if (rf & 2) {
    const company_r7 = ctx.$implicit;
    \u0275\u0275conditional(0, !company_r7.isEdit ? 0 : 1);
  }
}
function ContactFormComponent_Conditional_55_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 63);
    \u0275\u0275listener("click", function ContactFormComponent_Conditional_55_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext();
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.addnewcompanyfn());
    });
    \u0275\u0275element(1, "icon", 64);
    \u0275\u0275text(2, " Add a new company ");
    \u0275\u0275elementEnd();
  }
}
function ContactFormComponent_Conditional_56_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 65);
    \u0275\u0275listener("click", function ContactFormComponent_Conditional_56_Template_button_click_0_listener($event) {
      \u0275\u0275restoreView(_r13);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "input", 66);
    \u0275\u0275twoWayListener("ngModelChange", function ContactFormComponent_Conditional_56_Template_input_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.CompanyValue, $event) || (ctx_r1.CompanyValue = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keypress", function ContactFormComponent_Conditional_56_Template_input_keypress_1_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onAddCompanyKeyPress($event));
    })("keypress.enter", function ContactFormComponent_Conditional_56_Template_input_keypress_enter_1_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onAddCompanyBlur($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "span", 67);
    \u0275\u0275listener("click", function ContactFormComponent_Conditional_56_Template_span_click_2_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext();
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.onAddCompanyBlur($event));
    });
    \u0275\u0275element(3, "icon", 62);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.CompanyValue);
    \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(2, _c2));
  }
}
function ContactFormComponent_For_81_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 56);
    \u0275\u0275listener("click", function ContactFormComponent_For_81_Conditional_0_Conditional_2_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r16);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "icon", 57);
    \u0275\u0275listener("click", function ContactFormComponent_For_81_Conditional_0_Conditional_2_Template_icon_click_1_listener($event) {
      \u0275\u0275restoreView(_r16);
      const ctx_r16 = \u0275\u0275nextContext(2);
      const role_r15 = ctx_r16.$implicit;
      const $index_r18 = ctx_r16.$index;
      const ctx_r1 = \u0275\u0275nextContext();
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.editrole(role_r15, $index_r18));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "icon", 58);
    \u0275\u0275listener("click", function ContactFormComponent_For_81_Conditional_0_Conditional_2_Template_icon_click_2_listener($event) {
      \u0275\u0275restoreView(_r16);
      const role_r15 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.deleteRole(role_r15, $event));
    });
    \u0275\u0275elementEnd()();
  }
}
function ContactFormComponent_For_81_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 54);
    \u0275\u0275listener("click", function ContactFormComponent_For_81_Conditional_0_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r14);
      const role_r15 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.selectRole(role_r15));
    });
    \u0275\u0275text(1);
    \u0275\u0275template(2, ContactFormComponent_For_81_Conditional_0_Conditional_2_Template, 3, 0, "div", 55);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const role_r15 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", role_r15.cRole, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, role_r15.canEdit ? 2 : -1);
  }
}
function ContactFormComponent_For_81_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 68, 6);
    \u0275\u0275listener("keypress", function ContactFormComponent_For_81_Conditional_1_Template_input_keypress_0_listener($event) {
      \u0275\u0275restoreView(_r19);
      const role_r15 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onRoleEditKeyPress(role_r15, $event));
    })("click", function ContactFormComponent_For_81_Conditional_1_Template_input_click_0_listener($event) {
      \u0275\u0275restoreView(_r19);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r16 = \u0275\u0275nextContext();
    const role_r15 = ctx_r16.$implicit;
    const $index_r18 = ctx_r16.$index;
    \u0275\u0275property("id", "editinput" + $index_r18)("value", role_r15.cRole);
  }
}
function ContactFormComponent_For_81_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ContactFormComponent_For_81_Conditional_0_Template, 3, 2, "div", 53)(1, ContactFormComponent_For_81_Conditional_1_Template, 2, 2);
  }
  if (rf & 2) {
    const role_r15 = ctx.$implicit;
    \u0275\u0275conditional(0, !role_r15.isEdit ? 0 : 1);
  }
}
function ContactFormComponent_Conditional_83_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 63);
    \u0275\u0275listener("click", function ContactFormComponent_Conditional_83_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r20);
      const ctx_r1 = \u0275\u0275nextContext();
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.addnewrolefn());
    });
    \u0275\u0275element(1, "icon", 64);
    \u0275\u0275text(2, " Add a new role ");
    \u0275\u0275elementEnd();
  }
}
function ContactFormComponent_Conditional_84_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 69);
    \u0275\u0275listener("click", function ContactFormComponent_Conditional_84_Template_input_click_0_listener($event) {
      \u0275\u0275restoreView(_r21);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keypress", function ContactFormComponent_Conditional_84_Template_input_keypress_0_listener($event) {
      \u0275\u0275restoreView(_r21);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onAddRoleKeyPress($event));
    })("keypress.enter", function ContactFormComponent_Conditional_84_Template_input_keypress_enter_0_listener($event) {
      \u0275\u0275restoreView(_r21);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onAddRoleBlur($event));
    });
    \u0275\u0275elementEnd();
  }
}
function ContactFormComponent_mat_option_93_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 70);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r22 = ctx.$implicit;
    \u0275\u0275property("value", x_r22.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r22.cKey, " ");
  }
}
var ContactFormComponent = class _ContactFormComponent {
  constructor(contactService, commonService, dialogRef, tost, crd) {
    this.contactService = contactService;
    this.commonService = commonService;
    this.dialogRef = dialogRef;
    this.tost = tost;
    this.crd = crd;
    this.advancecont = false;
    this.formsubmit = false;
    this.addnewrole = false;
    this.active_forms = "";
    this.cPermission = "N";
    this.iscomponent = false;
    this.chngtmzone = false;
    this.currnet_countrycode = "91";
    this.iso = "US";
    this.OnEvent = new EventEmitter();
    this.role_list = [];
    this.company_list = [];
    this.party_list = [];
    this.timezone = [];
    this.isFocus = false;
    this.selectedRoleText = "Select...";
    this.addnewcompany = false;
    this.selectedCompanyText = "Select...";
    this.profileUrl = `${environment.documentStorage}${environment.userProfilePath}contacts/`;
    this.CompanyValue = "";
    this.cContactType = "C";
    this.validation_messages = {
      "cFname": [
        { type: "required", message: "First name is required" }
      ],
      "cLname": [
        { type: "required", message: "Last name is required" }
      ],
      "cMentiontag": [
        { type: "required", message: "Mention tag is required" }
      ],
      "nRoleid": [
        { type: "required", message: "Role in case is required" }
      ],
      "nPartyid": [
        { type: "required", message: "Party is required" }
      ],
      "nCompanyid": [
        { type: "required", message: "Company is required" }
      ]
    };
  }
  ngOnInit() {
    return __async(this, null, function* () {
      console.log("editable_list && permisison", this.editable_list, this.cPermission);
      this.nCaseid = this.editable_list ? this.editable_list.nCaseid : this.nCaseid;
      this.frm = new FormGroup({
        nContactid: new FormControl(0),
        cProfile: new FormControl(""),
        cFname: new FormControl("", Validators.required),
        cLname: new FormControl("", Validators.required),
        // cAlias: new FormControl('', Validators.required),
        // cLinkedin: new FormControl(''),
        cEmail: new FormControl("", {
          validators: [Validators.required, Validators.email]
        }),
        // cMobile: new FormControl(''), // Removed required validator since field is commented out
        // nTZid: new FormControl(''), // Removed required validator since field is commented out
        nRoleid: new FormControl(null, Validators.required),
        nPartyid: new FormControl(null, Validators.required),
        nCompanyid: new FormControl(null, Validators.required),
        cNote: new FormControl(""),
        // cMentiontag: new FormControl('',),
        cOccupation: new FormControl("", Validators.required),
        permission: new FormControl("N")
      });
      this.bindCurrentTimezone();
      yield this.initLists();
      if (this.editable_list) {
        this.prefillFormOnEdit();
      } else {
        this.frm.patchValue({
          permission: "N"
        });
        this.gettimezone();
      }
      if (this.editable_list && (this.editable_list.nRoleid > 0 || this.editable_list.nCompanyid > 0)) {
        this.advancecont = true;
      }
    });
  }
  ngOnChanges(changes) {
    if (changes["editable_list"] && this.cPermission == "E") {
      this.editable_list = changes["editable_list"].currentValue;
      this.prefillFormOnEdit();
    }
  }
  onValueChanged(e) {
    this.mobileValue;
    this.currnet_countrycode = this.mobileValue.countryCode;
    this.frm.patchValue({
      cMobile: this.mobileValue.number
    });
  }
  bindCurrentTimezone() {
    const tmzone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const Tzone = this.timezone.find((m) => m.jOther.includes(tmzone));
    this.usrtmzone = Tzone;
    if (Tzone) {
      this.frm.patchValue({
        nTZid: Tzone.nValue
      });
    }
  }
  initLists() {
    return __async(this, null, function* () {
      this.role_list = yield this.contactService.getContactCaserolelist(this.nCaseid);
      this.party_list = yield this.commonService.getCode(22);
      this.company_list = yield this.contactService.getContactCompany(this.nCaseid);
      if (this.editable_list?.nCompanyid) {
        const c = this.company_list.find((x) => x.nCompanyid === this.editable_list.nCompanyid);
        if (c)
          this.selectedCompanyText = c.cCompany;
      }
      this.crd.detectChanges();
    });
  }
  gettimezone(isUpdate) {
    return __async(this, null, function* () {
      this.timezone = yield this.commonService.getCode(1);
      if (!isUpdate)
        return;
      var tmzone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var idn = this.timezone.findIndex((m) => m.jOther.includes(tmzone));
      if (idn > -1) {
        this.frm.patchValue({
          nTZid: this.timezone[idn].nValue.toString()
        });
      }
      var obj = this.timezone[idn];
      this.usrtmzone = obj;
      this.chngtmzone = false;
    });
  }
  ngOnDestroy() {
    this.editable_list = null;
  }
  onsubmit() {
    return __async(this, null, function* () {
      this.formsubmit = true;
      const currentFname = this.frm.get("cFname")?.value;
      const currentLname = this.frm.get("cLname")?.value;
      if (currentFname) {
        this.frm.patchValue({
          cFname: currentFname.trim()
        });
      }
      if (currentLname) {
        this.frm.patchValue({
          cLname: currentLname.trim()
        });
      }
      if (this.frm.invalid || this.isTagExists) {
        return;
      }
      var model = {};
      model = this.frm.value;
      console.log(model);
      try {
      } catch (error) {
      }
      model.nCaseid = this.nCaseid;
      model.cType = this.cContactType || "C";
      let res = yield this.contactService.caseContactBuilder(model);
      if (res["msg"] == 1) {
        res["isNew"] = true;
        if (this.dialogRef) {
          this.dialogRef.close(res["nContactid"]);
        } else {
          this.OnEvent.emit({ event: "NEW_ADDED", data: { nContactid: res["nContactid"] } });
        }
      } else {
        this.tost.openSnackBar(res["value"], "E");
      }
    });
  }
  choose_form(flag) {
    this.active_forms = flag;
    this.header.nativeElement.scrollTo(0, 0);
    setTimeout(() => {
      this.dialogRef?.updateSize(this.width, this.height);
    }, 0);
  }
  responce_child(val) {
    this.active_forms = val;
  }
  getmobile(e) {
    this.currnet_countrycode = e.dialCode;
    this.iso = e.iso2;
    console.log(e);
  }
  imgpicker() {
    this.someInput.nativeElement.click();
  }
  back() {
    if (this.dialogRef) {
      this.dialogRef.close(true);
    } else {
      this.OnEvent.emit({ event: "CLOSE", data: null });
    }
  }
  onFileChange(e) {
    return __async(this, null, function* () {
      if (!e.target.files[0])
        return;
      const formData = new FormData();
      formData.append("rootPath", "contacts");
      formData.append("file", e.target.files[0]);
      const res = yield this.contactService.userProfileUpload(formData);
      console.log("onFileChange", res);
      if (res?.msg == 1) {
        this.frm.patchValue({
          cProfile: res.value
        });
        this.crd.detectChanges();
      }
    });
  }
  selectRole(role) {
    this.frm.patchValue({
      nRoleid: role.nCRoleid
    });
    this.selectedRoleText = role.cRole;
  }
  editrole(role, index) {
    role.isEdit = true;
    setTimeout(() => {
      let myinput = document.getElementById("editinput" + index);
      if (myinput) {
        myinput.focus();
      }
    }, 100);
  }
  deleteRole(role, event) {
    return __async(this, null, function* () {
      event.stopPropagation();
      const res = yield this.remove_role(role);
      if (res) {
        const index = this.role_list.findIndex((r) => r.nCRoleid === role.nCRoleid);
        if (index > -1) {
          this.role_list.splice(index, 1);
          if (this.frm.get("nRoleid").value === role.nCRoleid) {
            this.frm.patchValue({ nRoleid: null });
            this.selectedRoleText = "Select...";
          }
        }
      }
    });
  }
  // New method to handle role editing on blur
  onRoleEditBlur(role, event) {
    return __async(this, null, function* () {
      const newValue = event.target.value.trim();
      if (newValue && newValue !== role.cRole) {
        var mdl = {};
        mdl.nCaseid = this.nCaseid;
        mdl.cRole = newValue;
        mdl.nCRoleid = role.nCRoleid;
        mdl.permission = "E";
        const res = yield this.contactService.contactRoleBuilder(mdl);
        if (res.msg == 1) {
          role.cRole = newValue;
        }
      }
      role.isEdit = false;
    });
  }
  onRoleEditKeyPress(role, event) {
    if (event.key === "Enter") {
      this.onRoleEditBlur(role, event);
    }
  }
  addnewrolefn() {
    this.addnewrole = true;
    setTimeout(() => {
      let myinput = document.getElementById("maininput");
      if (myinput) {
        myinput.focus();
      }
    }, 100);
  }
  // New method to handle adding new role on blur
  onAddRoleBlur(event) {
    return __async(this, null, function* () {
      const newRoleValue = event.target.value.trim();
      if (!newRoleValue || newRoleValue.trim() == "") {
        this.addnewrole = false;
        return;
      }
      var mdl = {};
      mdl.nCaseid = this.nCaseid;
      mdl.cRole = newRoleValue;
      mdl.nCRoleid = null;
      mdl.permission = "N";
      const res = yield this.contactService.contactRoleBuilder(mdl);
      if (res.msg == 1) {
        const role = {
          nCRoleid: res.nCRoleid,
          cRole: newRoleValue,
          canEdit: true
        };
        this.role_list.push(role);
      }
      this.addnewrole = false;
    });
  }
  onAddRoleKeyPress(event) {
    if (event.key === "Enter") {
      this.onAddRoleBlur(event);
    }
  }
  remove_role(x) {
    return __async(this, null, function* () {
      var mdl = {};
      mdl.nCaseid = this.nCaseid;
      mdl.cRole = x.cRole;
      mdl.nCRoleid = x.nCRoleid;
      mdl.permission = "D";
      const res = yield this.contactService.contactRoleBuilder(mdl);
      if (res.msg == 1) {
        return true;
      } else {
        return false;
      }
    });
  }
  checkMentionExists(event) {
    return __async(this, null, function* () {
      this.isTagExists = false;
      const cMentiontag = event.target.value.trim();
      if (!cMentiontag || cMentiontag.trim() == "") {
        return;
      }
      const params = {
        nCaseid: this.nCaseid,
        cMentiontag,
        cPermission: this.editable_list ? "E" : "N"
      };
      const res = yield this.contactService.checkMentionExists(params);
      if (res.msg == -1) {
        this.isTagExists = true;
      }
      console.log("res", res);
    });
  }
  onMentiontagKeyPress(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }
  prefillFormOnEdit() {
    return __async(this, null, function* () {
      if (this.editable_list) {
        this.frm.patchValue({
          permission: "E",
          nContactid: this.editable_list.nContactid,
          cProfile: this.editable_list.cProfile,
          cFname: this.editable_list.cFname.trim(),
          cLname: this.editable_list.cLname.trim(),
          cEmail: this.editable_list.cEmail,
          cMentiontag: this.editable_list.cMentiontag,
          cOccupation: this.editable_list.cOccupation,
          nRoleid: this.editable_list.nRoleid,
          nPartyid: this.editable_list.nPartyid,
          nCompanyid: this.editable_list.nCompanyid,
          cNote: this.editable_list.cNote
        });
        this.chngtmzone = true;
        this.currnet_countrycode = this.editable_list.cCountrycode;
        this.iso = this.editable_list.cIso ? this.editable_list.cIso : "";
        this.mobileValue = { number: this.editable_list.cMobile, countryCode: this.editable_list.cCountrycode };
        this.gettimezone();
        if (this.editable_list.nRoleid) {
          const selectedRole = this.role_list.find((role) => role.nCRoleid === this.editable_list.nRoleid);
          if (selectedRole) {
            this.selectedRoleText = selectedRole.cRole;
          }
        }
        this.crd.detectChanges();
      }
    });
  }
  editcompany(company, index) {
    return __async(this, null, function* () {
      company.isEdit = true;
      setTimeout(() => document.getElementById("companyeditinput" + index)?.focus(), 100);
    });
  }
  deleteCompany(company, event) {
    return __async(this, null, function* () {
      event.stopPropagation();
      const ok = yield this.remove_company(company);
      if (ok) {
        const idx = this.company_list.findIndex((c) => c.nCompanyid === company.nCompanyid);
        if (idx > -1)
          this.company_list.splice(idx, 1);
        if (this.frm.get("nCompanyid").value === company.nCompanyid) {
          this.frm.patchValue({ nCompanyid: null });
          this.selectedCompanyText = "Select...";
        }
      }
    });
  }
  selectCompany(company) {
    this.frm.patchValue({ nCompanyid: company.nCompanyid });
    this.selectedCompanyText = company.cCompany;
  }
  onCompanyEditBlur(company, event) {
    return __async(this, null, function* () {
      const newValue = (event.target.value || "").trim();
      if (newValue && newValue !== company.cCompany) {
        const mdl = {
          nCaseid: this.nCaseid,
          cCompany: newValue,
          nCompanyid: company.nCompanyid,
          permission: "E"
        };
        const res = yield this.contactService.companyBuilder(mdl);
        if (res?.msg === 1) {
          company.cCompany = newValue;
          if (this.frm.get("nCompanyid").value === company.nCompanyid) {
            this.selectedCompanyText = newValue;
          }
        }
      }
      company.isEdit = false;
    });
  }
  onCompanyEditKeyPress(company, event) {
    if (event.key === "Enter") {
      this.onCompanyEditBlur(company, event);
    }
  }
  addnewcompanyfn() {
    this.addnewcompany = true;
    setTimeout(() => document.getElementById("companymaininput")?.focus(), 100);
  }
  onAddCompanyBlur(event) {
    return __async(this, null, function* () {
      try {
        const newVal = this.CompanyValue.trim();
        if (!newVal) {
          this.addnewcompany = false;
          this.CompanyValue = "";
          return;
        }
        const mdl = {
          nCaseid: this.nCaseid,
          cCompany: newVal,
          nCompanyid: null,
          permission: "N"
        };
        const res = yield this.contactService.companyBuilder(mdl);
        if (res?.msg === 1) {
          const company = {
            nCompanyid: res.nCompanyid,
            // returned by your API (per CompanyComponent)
            cCompany: newVal,
            canEdit: true
          };
          this.company_list.push(company);
          this.CompanyValue = "";
          this.crd.detectChanges();
        }
        this.addnewcompany = false;
      } catch (error) {
        console.error("Error adding company:", error);
        this.addnewcompany = false;
      }
    });
  }
  onAddCompanyKeyPress(event) {
    if (event.key === "Enter") {
      this.onAddCompanyBlur(event);
    }
  }
  remove_company(x) {
    return __async(this, null, function* () {
      const mdl = {
        nCaseid: this.nCaseid,
        cCompany: x.cCompany,
        nCompanyid: x.nCompanyid,
        permission: "D"
      };
      const res = yield this.contactService.companyBuilder(mdl);
      return res?.msg === 1;
    });
  }
  static {
    this.\u0275fac = function ContactFormComponent_Factory(t) {
      return new (t || _ContactFormComponent)(\u0275\u0275directiveInject(ContactService), \u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(MatDialogRef, 8), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContactFormComponent, selectors: [["app-contact-form"]], viewQuery: function ContactFormComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c03, 5);
        \u0275\u0275viewQuery(_c1, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.someInput = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.header = _t.first);
      }
    }, inputs: { cPermission: "cPermission", nCaseid: "nCaseid", iscomponent: "iscomponent", editable_list: "editable_list", cContactType: "cContactType" }, outputs: { OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 98, vars: 38, consts: [["header", ""], ["someInput", ""], ["company", "matMenuTrigger"], ["companyMenu", "matMenu"], ["role", "matMenuTrigger"], ["roleMenu", "matMenu"], ["editinput", ""], [1, "h-full", "max-h-full", "overflow-auto", "relative", "block", "bg-white"], [1, "addnewcontact", "error", "py-5", "flex", "flex-col", "h-fit", 3, "formGroup", "hidden"], [1, "text-lg", "font-semibold", "items-center", "gap-2", "flex", "mb-6", "px-5", "h-8.5"], ["name", "chvy", 1, "text-xs", "me-2", "mt-px", 3, "click"], [1, "inputs", "h-full", "overflow-auto", "px-5"], [1, "mb-6", "flex", "items-center", "gap-6"], ["class", "flex items-center justify-center rounded-full text-center leading-4 text-xs font-medium h-[35px] w-[35px] bg-gray-300", 4, "ngIf"], ["class", "flex items-center justify-center rounded-full text-center leading-4 text-xs font-medium h-[35px] w-[35px] bg-gray-300", 3, "src", 4, "ngIf"], ["type", "file", "name", "profile", "id", "profile", "accept", "image/png, image/jpg, image/jpeg,image/svg", 1, "!hidden", 3, "change"], ["mode", "outlined", 3, "click"], [4, "ngIf"], ["for", "frstname"], [1, "text-xs", "mb-2", "font-semibold"], [1, "valid-star"], ["formControlName", "cFname", "type", "text", "id", "frstname", 1, "main-input"], [4, "ngFor", "ngForOf"], ["for", "lstname"], ["formControlName", "cLname", "type", "text", "id", "lstname", 1, "main-input"], ["for", "Email"], ["formControlName", "cEmail", "type", "text", "id", "Email", 1, "main-input"], [1, "w-full", "flex", "gap-2.5"], [1, "selects", "w-full"], [1, "flex", "gap-2"], [1, "w-full"], ["mat-button", "", 1, "w-full", "h-8.5", "flex", "items-center", "justify-between", "px-3", "border", "border-tab", "rounded-base", "text-left", "bg-white", 3, "menuClosed", "matMenuTriggerFor"], [1, "text-xs"], ["name", "chvx", 1, "text-xxs"], [1, "role-menu", "!min-w-[480px]"], [1, "flex", "gap-1", "flex-col", "p-3", "pb-0", "max-h-[300px]", "overflow-auto"], [1, "sticky", "bottom-0", "p-2.5"], [1, "h-6", "text-xs", "px-2.5", "flex", "items-center", "group", "rounded-lg", "text-blue-on", "bg-blue-deactivate", "gap-2.5"], ["for", "cOccupation", 1, "block", "w-full"], ["formControlName", "cOccupation", "type", "text", "id", "cOccupation", 1, "main-input"], ["mat-button", "", 1, "w-full", "h-8.5", "flex", "items-center", "justify-between", "px-3", "border", "border-tab", "rounded-base", "text-left", "bg-white", 3, "matMenuTriggerFor"], [1, "role-menu", "!min-w-[234px]"], [1, "flex", "gap-1", "flex-col", "p-3", "max-h-[300px]", "overflow-auto"], ["appearance", "fill", 1, "h-8.5", "w-full"], ["panelClass", "sortfltrpnl contactnew", "disableOptionCentering", "", "placeholder", "Select...", "formControlName", "nPartyid", 1, "sortfilterslct", "addcont"], ["class", "sortfltroptn", 3, "value", 4, "ngFor", "ngForOf"], ["for", "note", 1, "selects"], ["rows", "3", "type", "text", "id", "note", "formControlName", "cNote", "maxlength", "250", "placeholder", "Add Note", 1, "style"], ["addcls", "w-full", 1, "w-full", 3, "click", "disabled"], [1, "flex", "items-center", "justify-center", "rounded-full", "text-center", "leading-4", "text-xs", "font-medium", "h-[35px]", "w-[35px]", "bg-gray-300"], [1, "flex", "items-center", "justify-center", "rounded-full", "text-center", "leading-4", "text-xs", "font-medium", "h-[35px]", "w-[35px]", "bg-gray-300", 3, "src"], ["class", "validators-required validation-required validation", 4, "ngIf"], [1, "validators-required", "validation-required", "validation"], [1, "min-h-6", "text-xs", "px-2.5", "flex", "items-center", "group", "rounded-lg", "hover:shadow-[0px_0px_6px_#0051ff]"], [1, "min-h-6", "text-xs", "px-2.5", "flex", "items-center", "group", "rounded-lg", "hover:shadow-[0px_0px_6px_#0051ff]", 3, "click"], [1, "gap-2.5", "hidden", "group-hover:flex", "ms-auto", "items-center"], [1, "gap-2.5", "hidden", "group-hover:flex", "ms-auto", "items-center", 3, "click"], ["name", "edit", "matTooltip", "Edit", 1, "hover:text-blue-on", 3, "click"], ["name", "removefill", "matTooltip", "Delete", 1, "hover:text-blue-on", 3, "click"], [1, "main-input", "focus-within:shadow-[0px_0px_6px_#0051ff]"], ["type", "text", 3, "keypress", "click", "id", "value"], [1, "flex", "size-4", "items-center", "justify-center", "text-xs", "text-gray-300"], ["name", "check", 1, "text-xs"], [1, "h-6", "text-xs", "px-2.5", "flex", "items-center", "group", "rounded-lg", "text-blue-on", "bg-blue-deactivate", "gap-2.5", 3, "click"], ["name", "addcircle"], [1, "flex", "items-center", "gap-2.5", "h-8.5", "px-2.5", "rounded-base", "border", "border-blue-deactivate", "w-full", "focus-within:shadow-[0px_0px_6px_#0051ff]", 3, "click"], ["type", "text", "id", "companymaininput", 1, "!border-none", "!p-0", "!rounded-none", "!shadow-none", "w-full", 3, "ngModelChange", "keypress", "keypress.enter", "ngModel", "ngModelOptions"], [1, "flex", "size-4", "items-center", "justify-center", "text-xs", "text-blue-on", "bg-white", "shadow-sm", 3, "click"], ["type", "text", 1, "main-input", "focus:shadow-[0px_0px_6px_#0051ff]", 3, "keypress", "click", "id", "value"], ["type", "text", "id", "maininput", 1, "main-input", "focus:shadow-[0px_0px_6px_#0051ff]", 3, "click", "keypress", "keypress.enter"], [1, "sortfltroptn", 3, "value"]], template: function ContactFormComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 7)(1, "form", 8)(2, "div", 9, 0)(4, "icon", 10);
        \u0275\u0275listener("click", function ContactFormComponent_Template_icon_click_4_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.back());
        });
        \u0275\u0275elementEnd();
        \u0275\u0275text(5, " Contact ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(6, "div", 11)(7, "div", 12);
        \u0275\u0275template(8, ContactFormComponent_span_8_Template, 1, 0, "span", 13)(9, ContactFormComponent_img_9_Template, 1, 1, "img", 14);
        \u0275\u0275elementStart(10, "input", 15, 1);
        \u0275\u0275listener("change", function ContactFormComponent_Template_input_change_10_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onFileChange($event));
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "btn", 16);
        \u0275\u0275listener("click", function ContactFormComponent_Template_btn_click_12_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.imgpicker());
        });
        \u0275\u0275template(13, ContactFormComponent_span_13_Template, 2, 0, "span", 17)(14, ContactFormComponent_span_14_Template, 2, 0, "span", 17);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(15, "label", 18)(16, "h6", 19);
        \u0275\u0275text(17, "First Name ");
        \u0275\u0275elementStart(18, "span", 20);
        \u0275\u0275text(19, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(20, "input", 21);
        \u0275\u0275template(21, ContactFormComponent_ng_container_21_Template, 2, 1, "ng-container", 22);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(22, "label", 23)(23, "h6", 19);
        \u0275\u0275text(24, "Last Name ");
        \u0275\u0275elementStart(25, "span", 20);
        \u0275\u0275text(26, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(27, "input", 24);
        \u0275\u0275template(28, ContactFormComponent_ng_container_28_Template, 2, 1, "ng-container", 22);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(29, "label", 25)(30, "h6", 19);
        \u0275\u0275text(31, "Email ");
        \u0275\u0275elementStart(32, "span", 20);
        \u0275\u0275text(33, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(34, "input", 26);
        \u0275\u0275template(35, ContactFormComponent_ng_container_35_Template, 2, 1, "ng-container", 22);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(36, "div", 27)(37, "label", 28)(38, "h6", 19);
        \u0275\u0275text(39, "Company ");
        \u0275\u0275elementStart(40, "span", 20);
        \u0275\u0275text(41, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(42, "div", 29)(43, "div", 30)(44, "div", 31, 2);
        \u0275\u0275listener("menuClosed", function ContactFormComponent_Template_div_menuClosed_44_listener() {
          \u0275\u0275restoreView(_r1);
          ctx.CompanyValue = "";
          return \u0275\u0275resetView(ctx.addnewcompany = false);
        });
        \u0275\u0275elementStart(46, "span", 32);
        \u0275\u0275text(47);
        \u0275\u0275elementEnd();
        \u0275\u0275element(48, "icon", 33);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(49, "mat-menu", 34, 3)(51, "div", 35);
        \u0275\u0275repeaterCreate(52, ContactFormComponent_For_53_Template, 2, 1, null, null, _forTrack0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(54, "div", 36);
        \u0275\u0275template(55, ContactFormComponent_Conditional_55_Template, 3, 0, "div", 37)(56, ContactFormComponent_Conditional_56_Template, 4, 3);
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(57, "label", 38)(58, "h6", 19);
        \u0275\u0275text(59, "Occupation ");
        \u0275\u0275elementStart(60, "span", 20);
        \u0275\u0275text(61, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(62, "input", 39)(63, "h6");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(64, "div", 27)(65, "label", 28)(66, "h6", 19);
        \u0275\u0275text(67, "Role in case ");
        \u0275\u0275elementStart(68, "span", 20);
        \u0275\u0275text(69, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(70, "div", 29)(71, "div", 30)(72, "div", 40, 4)(74, "span", 32);
        \u0275\u0275text(75);
        \u0275\u0275elementEnd();
        \u0275\u0275element(76, "icon", 33);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(77, "mat-menu", 41, 5)(79, "div", 42);
        \u0275\u0275repeaterCreate(80, ContactFormComponent_For_81_Template, 2, 1, null, null, _forTrack1);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(82, "div", 36);
        \u0275\u0275template(83, ContactFormComponent_Conditional_83_Template, 3, 0, "div", 37)(84, ContactFormComponent_Conditional_84_Template, 1, 0);
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(85, "label", 28)(86, "h6", 19);
        \u0275\u0275text(87, "Party ");
        \u0275\u0275elementStart(88, "span", 20);
        \u0275\u0275text(89, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(90, "div", 29)(91, "mat-form-field", 43)(92, "mat-select", 44);
        \u0275\u0275template(93, ContactFormComponent_mat_option_93_Template, 2, 2, "mat-option", 45);
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(94, "label", 46);
        \u0275\u0275element(95, "textarea", 47);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(96, "btn", 48);
        \u0275\u0275listener("click", function ContactFormComponent_Template_btn_click_96_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onsubmit());
        });
        \u0275\u0275text(97);
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        const company_r23 = \u0275\u0275reference(45);
        const companyMenu_r24 = \u0275\u0275reference(50);
        const role_r25 = \u0275\u0275reference(73);
        const roleMenu_r26 = \u0275\u0275reference(78);
        \u0275\u0275classMap(ctx.iscomponent ? "h-full" : "h-fit");
        \u0275\u0275advance();
        \u0275\u0275property("formGroup", ctx.frm)("hidden", ctx.active_forms != "");
        \u0275\u0275advance(7);
        \u0275\u0275property("ngIf", !ctx.frm.value.cProfile || ctx.frm.value.cProfile == "");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.frm.value.cProfile && ctx.frm.value.cProfile != "");
        \u0275\u0275advance(4);
        \u0275\u0275property("ngIf", !ctx.frm.value.cProfile || ctx.frm.value.cProfile == "");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.frm.value.cProfile && ctx.frm.value.cProfile != "");
        \u0275\u0275advance(6);
        \u0275\u0275classProp("error", ctx.frm.get("cFname").invalid && ctx.formsubmit);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.validation_messages.cFname);
        \u0275\u0275advance(6);
        \u0275\u0275classProp("error", ctx.frm.get("cLname").invalid && ctx.formsubmit);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.validation_messages.cLname);
        \u0275\u0275advance(6);
        \u0275\u0275classProp("error", ctx.frm.get("cEmail").invalid && ctx.formsubmit);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.validation_messages.cEmail);
        \u0275\u0275advance(9);
        \u0275\u0275classMap(company_r23.menuOpen ? "shadow-[0px_0px_6px_#0051ff]" : "");
        \u0275\u0275classProp("error", ctx.frm.get("nCompanyid").invalid && ctx.formsubmit);
        \u0275\u0275property("matMenuTriggerFor", companyMenu_r24);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(ctx.selectedCompanyText);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.company_list);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(55, !ctx.addnewcompany ? 55 : 56);
        \u0275\u0275advance(7);
        \u0275\u0275classProp("error", ctx.frm.get("cOccupation").invalid && ctx.formsubmit);
        \u0275\u0275advance(10);
        \u0275\u0275classMap(role_r25.menuOpen ? "shadow-[0px_0px_6px_#0051ff]" : "");
        \u0275\u0275classProp("error", ctx.frm.get("nRoleid").invalid && ctx.formsubmit);
        \u0275\u0275property("matMenuTriggerFor", roleMenu_r26);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(ctx.selectedRoleText);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(ctx.role_list);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(83, !ctx.addnewrole ? 83 : 84);
        \u0275\u0275advance(9);
        \u0275\u0275classProp("error", ctx.frm.get("nPartyid").invalid && ctx.formsubmit);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.party_list);
        \u0275\u0275advance(3);
        \u0275\u0275property("disabled", ctx.frm.invalid);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" ", ctx.cPermission === "N" ? "Add" : "Update", " ");
      }
    }, dependencies: [
      CommonModule,
      NgForOf,
      NgIf,
      IconComponent,
      NgxIntlTelInputModule,
      NativeElementInjectorDirective,
      FormsModule,
      \u0275NgNoValidate,
      DefaultValueAccessor,
      NgControlStatus,
      NgControlStatusGroup,
      MaxLengthValidator,
      NgModel,
      ReactiveFormsModule,
      FormGroupDirective,
      FormControlName,
      MatFormFieldModule,
      MatFormField,
      MatSelectModule,
      MatSelect,
      MatOption,
      ButtonComponent,
      MatMenuModule,
      MatMenu,
      MatMenuTrigger,
      MatButtonModule,
      MatIconModule,
      MatTooltipModule,
      MatTooltip
    ], styles: ["\n\n.valid-star[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: red;\n}\nlabel[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 12px;\n}\n.dsbl[_ngcontent-%COMP%] {\n  opacity: 0.5 !important;\n  pointer-events: none !important;\n}\n/*# sourceMappingURL=contact-form.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContactFormComponent, { className: "ContactFormComponent", filePath: "src\\app\\shared\\components\\contacts\\contact-form\\contact-form.component.ts", lineNumber: 35 });
})();

export {
  ContactFormComponent
};
//# sourceMappingURL=chunk-KKQSQEUN.js.map
