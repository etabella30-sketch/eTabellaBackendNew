import {
  NavSharePermissionComponent
} from "./chunk-XD5XS7YM.js";
import {
  IndividualService
} from "./chunk-GNZXOHZW.js";
import {
  RolepermitService
} from "./chunk-TECZMXLZ.js";
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
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass
} from "./chunk-YBHDQMOW.js";
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
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction5,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/shared-view/shared-view.component.ts
var _forTrack0 = ($index, $item) => $item.nUserid;
var _c0 = (a0, a1, a2, a3, a4) => ({ "shadow-[0_3px_10px_#94949440]": a0, "flex items-center gap-2 p-0": a1, "px-2.5 py-1.5": a2, "!flex-wrap": a3, "!bg-neutral-800": a4 });
var _c1 = (a0, a1) => ({ "mb-3": a0, "!bg-neutral-800 text-white": a1 });
var _c2 = (a0) => ({ "flex-wrap": a0 });
var _c3 = (a0) => ({ "text-white": a0 });
function SharedViewComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 4);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("matTooltip", ctx_r0.Info);
  }
}
function SharedViewComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.totalUsers, " ");
  }
}
function SharedViewComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 8);
    \u0275\u0275twoWayListener("ngModelChange", function SharedViewComponent_Conditional_6_Template_mat_checkbox_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r0.allSelected, $event) || (ctx_r0.allSelected = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function SharedViewComponent_Conditional_6_Template_mat_checkbox_change_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.selectAllUsers($event));
    });
    \u0275\u0275elementStart(1, "span", 9);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.allSelected);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c3, ctx_r0.mode == "dark"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", ctx_r0.allSelected ? "Deselect" : "Select", " All");
  }
}
function SharedViewComponent_Conditional_8_For_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "avtr", 11);
    \u0275\u0275listener("click", function SharedViewComponent_Conditional_8_For_1_Conditional_0_Template_avtr_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const x_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.select(x_r4));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("detail", x_r4)("matTooltip", (x_r4 == null ? null : x_r4.cFname) + " " + (x_r4 == null ? null : x_r4.cLname))("active", x_r4.isSelected);
  }
}
function SharedViewComponent_Conditional_8_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, SharedViewComponent_Conditional_8_For_1_Conditional_0_Template, 1, 3, "avtr", 10);
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, x_r4.isSelected && ctx_r0.viewSelected || !ctx_r0.viewSelected || ctx_r0.enabledEdit ? 0 : -1);
  }
}
function SharedViewComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, SharedViewComponent_Conditional_8_For_1_Template, 1, 1, null, null, _forTrack0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275repeater(ctx_r0.userList);
  }
}
function SharedViewComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275element(0, "icon", 12);
    \u0275\u0275elementStart(1, "mat-menu", 13, 0)(3, "nav-share-permission", 14);
    \u0275\u0275listener("click", function SharedViewComponent_Conditional_9_Template_nav_share_permission_click_3_listener($event) {
      \u0275\u0275restoreView(_r5);
      return \u0275\u0275resetView($event == null ? null : $event.stopPropagation());
    })("onEvent", function SharedViewComponent_Conditional_9_Template_nav_share_permission_onEvent_3_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.updateTotalUsers());
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const menu_r6 = \u0275\u0275reference(2);
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("matMenuTriggerFor", menu_r6);
    \u0275\u0275advance(3);
    \u0275\u0275property("isView", false)("userList", ctx_r0.userList)("nUserid", ctx_r0.nUserid)("creator", ctx_r0.creator);
  }
}
var SharedViewComponent = class _SharedViewComponent {
  constructor(individualS, tost, rolepermit, cdr) {
    this.individualS = individualS;
    this.tost = tost;
    this.rolepermit = rolepermit;
    this.cdr = cdr;
    this.title = "";
    this.isSelectAll = true;
    this.canedit = false;
    this.hasshadow = true;
    this.haspadding = true;
    this.hasWrap = false;
    this.wrapavatar = true;
    this.ishorizontal = false;
    this.fromFactSheet = false;
    this.isUpdate = false;
    this.mode = "";
    this.type = "";
    this.nCaseid = null;
    this.nId = null;
    this.onEvent = new EventEmitter();
    this.allSelected = false;
    this.isSharePermission = true;
    this.viewSelected = false;
    this.totalUsers = 0;
    this.enabledEdit = false;
  }
  ngOnChanges(changes) {
    if (changes["userList"] && !changes["userList"].firstChange) {
      this.updateTotalUsers();
    }
    if (this.userList) {
      const selectedLength = this.userList.filter((f) => f.isSelected).length;
      this.allSelected = selectedLength || selectedLength == this.userList.length ? true : false;
    }
  }
  ngOnInit() {
    this.updateTotalUsers();
  }
  select(x) {
    if (this.viewSelected && !this.enabledEdit)
      return;
    x.isSelected = !x.isSelected;
    if (this.userList.filter((f) => f.isSelected).length == this.userList.length) {
      this.allSelected = true;
    } else {
      this.allSelected = false;
    }
    this.updateTotalUsers();
    if (this.fromFactSheet) {
      this.onEvent.emit({ type: "USER-EDIT", data: true });
    }
    if (this.isUpdate) {
      this.updateUesr(x);
      this.onEvent.emit({ type: "UPDATE-USER-COUNT", data: this.userList.filter((f) => f.isSelected).length });
    }
  }
  updateUesr(x) {
    return __async(this, null, function* () {
      const mdl = {
        nId: this.nId,
        jUsers: JSON.stringify(this.userList.filter((f) => f.isSelected).map((m) => m.nUserid)),
        cType: this.type,
        nCaseid: this.nCaseid
      };
      const res = yield this.individualS.update_sharelink(mdl);
      if (res) {
        if (x.isSelected) {
          this.tost.openSnackBar((this.type == "F" ? "Fact " : this.type == "D" ? "Doc " : "Web ") + "has been shared with select team member", "");
        }
      }
      this.updateTotalUsers();
    });
  }
  selectAllUsers(e) {
    if (this.viewSelected)
      return;
    if (e.checked) {
      this.userList.forEach((user) => {
        user.isSelected = true;
      });
    } else {
      this.userList.forEach((user) => {
        user.isSelected = false;
      });
    }
    this.updateUesr(this.userList[0]);
    if (this.fromFactSheet) {
      this.onEvent.emit({ type: "USER-EDIT", data: true });
    }
    this.updateTotalUsers();
  }
  edit() {
    this.onEvent.emit({ type: "OPEN-EDIT", data: true });
  }
  verifyPermission() {
    this.isSharePermission = this.rolepermit.verifyPermission("SH");
  }
  ngAfterViewInit() {
    this.updateTotalUsers();
  }
  updateTotalUsers() {
    this.totalUsers = this.userList.filter((a) => a.isSelected && this.viewSelected || !this.viewSelected)?.length;
    this.cdr.detectChanges();
  }
  static {
    this.\u0275fac = function SharedViewComponent_Factory(t) {
      return new (t || _SharedViewComponent)(\u0275\u0275directiveInject(IndividualService), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(RolepermitService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SharedViewComponent, selectors: [["shared-view"]], inputs: { userList: "userList", title: "title", head: "head", isSelectAll: "isSelectAll", canedit: "canedit", hasshadow: "hasshadow", haspadding: "haspadding", hasWrap: "hasWrap", wrapavatar: "wrapavatar", ishorizontal: "ishorizontal", Info: "Info", fromFactSheet: "fromFactSheet", isUpdate: "isUpdate", mode: "mode", type: "type", nCaseid: "nCaseid", nId: "nId", nUserid: "nUserid", viewSelected: "viewSelected", creator: "creator", enabledEdit: "enabledEdit" }, outputs: { onEvent: "onEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 10, vars: 20, consts: [["menu", "matMenu"], [1, "h-fit", "bg-reply", "rounded-base", 3, "ngClass"], [1, "flex", "items-center", "justify-between", "rounded-base", "gap-1.5", "h-[34px]", "ps-2.5", 3, "ngClass"], [1, "text-xs", "font-semibold", "flex", "items-center", "gap-2", "whitespace-nowrap"], ["name", "info", "type", "comnicn", 3, "matTooltip"], [1, "h-[18px]", "min-w-[18px]", "flex", "items-center", "bg-tab", "text-white", "rounded-full", "justify-center", "w-fit", "text-xxs"], [3, "ngModel"], [1, "flex", "gap-2", 3, "ngClass"], [3, "ngModelChange", "change", "ngModel"], [3, "ngClass"], ["size", "sm", 1, "cursor-pointer", 3, "detail", "matTooltip", "active"], ["size", "sm", 1, "cursor-pointer", 3, "click", "detail", "matTooltip", "active"], ["name", "edit", 1, "me-2.5", 3, "matMenuTriggerFor"], [1, "!rounded-none", "!min-w-[476px]", "mt-3"], [3, "click", "onEvent", "isView", "userList", "nUserid", "creator"]], template: function SharedViewComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "span", 3);
        \u0275\u0275text(3);
        \u0275\u0275template(4, SharedViewComponent_Conditional_4_Template, 1, 1, "icon", 4);
        \u0275\u0275elementEnd();
        \u0275\u0275template(5, SharedViewComponent_Conditional_5_Template, 2, 1, "span", 5)(6, SharedViewComponent_Conditional_6_Template, 3, 5, "mat-checkbox", 6);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "div", 7);
        \u0275\u0275template(8, SharedViewComponent_Conditional_8_Template, 2, 0);
        \u0275\u0275elementEnd();
        \u0275\u0275template(9, SharedViewComponent_Conditional_9_Template, 4, 5);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction5(9, _c0, ctx.hasshadow, ctx.ishorizontal, ctx.haspadding && ctx.totalUsers, ctx.hasWrap, ctx.mode == "dark"));
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(15, _c1, !ctx.ishorizontal, ctx.mode == "dark"));
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", ctx.head ? ctx.head : "Shared with my team", " ");
        \u0275\u0275advance();
        \u0275\u0275conditional(4, ctx.Info ? 4 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(5, ctx.totalUsers ? 5 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(6, ctx.isSelectAll && !ctx.viewSelected ? 6 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(18, _c2, ctx.wrapavatar));
        \u0275\u0275advance();
        \u0275\u0275conditional(8, ctx.userList.length ? 8 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(9, ctx.canedit ? 9 : -1);
      }
    }, dependencies: [AvatarComponent, MatTooltipModule, MatTooltip, MatCheckboxModule, MatCheckbox, CommonModule, NgClass, IconComponent, FormsModule, NgControlStatus, NgModel, MatMenuModule, MatMenu, MatMenuTrigger, NavSharePermissionComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SharedViewComponent, { className: "SharedViewComponent", filePath: "src\\app\\shared\\components\\shared-view\\shared-view.component.ts", lineNumber: 21 });
})();

export {
  SharedViewComponent
};
//# sourceMappingURL=chunk-LDIF3HSE.js.map
