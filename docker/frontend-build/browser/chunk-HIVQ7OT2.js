import {
  PresentsetupService
} from "./chunk-WYIU2ETL.js";
import "./chunk-3B3MCZKM.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-4SC6BA7R.js";
import "./chunk-EVEACXQX.js";
import "./chunk-YBHDQMOW.js";
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
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/setup/teamuser/teamuser.component.ts
var _forTrack0 = ($index, $item) => $item.nTeamid;
var _forTrack1 = ($index, $item) => $item.nUserid;
function TeamuserComponent_For_2_Conditional_0_Conditional_6_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "mat-checkbox", 7);
    \u0275\u0275twoWayListener("ngModelChange", function TeamuserComponent_For_2_Conditional_0_Conditional_6_For_2_Template_mat_checkbox_ngModelChange_2_listener($event) {
      const y_r5 = \u0275\u0275restoreView(_r4).$implicit;
      \u0275\u0275twoWayBindingSet(y_r5.isChecked, $event) || (y_r5.isChecked = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function TeamuserComponent_For_2_Conditional_0_Conditional_6_For_2_Template_mat_checkbox_change_2_listener() {
      const y_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const x_r2 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onUserSelect(y_r5, x_r2));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const y_r5 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", y_r5.cFname, " ", y_r5.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", y_r5.isChecked);
  }
}
function TeamuserComponent_For_2_Conditional_0_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5);
    \u0275\u0275repeaterCreate(1, TeamuserComponent_For_2_Conditional_0_Conditional_6_For_2_Template, 3, 3, "div", 6, _forTrack1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275repeater(x_r2.users);
  }
}
function TeamuserComponent_For_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "span", 3);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-checkbox", 4);
    \u0275\u0275twoWayListener("ngModelChange", function TeamuserComponent_For_2_Conditional_0_Template_mat_checkbox_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r1);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      \u0275\u0275twoWayBindingSet(x_r2.isChecked, $event) || (x_r2.isChecked = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function TeamuserComponent_For_2_Conditional_0_Template_mat_checkbox_change_4_listener() {
      \u0275\u0275restoreView(_r1);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.checkAll(x_r2));
    });
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, TeamuserComponent_For_2_Conditional_0_Conditional_6_Template, 3, 0, "div", 5);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r2.cTeamname);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", x_r2.isChecked);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r2.isChecked ? "Deselect all" : "Select all");
    \u0275\u0275advance();
    \u0275\u0275conditional(6, (x_r2.users == null ? null : x_r2.users.length) ? 6 : -1);
  }
}
function TeamuserComponent_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TeamuserComponent_For_2_Conditional_0_Template, 7, 4, "div", 1);
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275conditional(0, (x_r2 == null ? null : x_r2.users == null ? null : x_r2.users.length) ? 0 : -1);
  }
}
var TeamuserComponent = class _TeamuserComponent {
  constructor(present, cdr) {
    this.present = present;
    this.cdr = cdr;
    this.selectedUser = [];
    this.selectedUserChange = new EventEmitter();
    this.teamUsersList = [];
  }
  ngOnChanges(changes) {
    if (changes["selectedUser"] && !changes["selectedUser"].firstChange) {
      this.filterSelectedUsers();
      this.checkForDefaultSelected();
    }
  }
  checkForDefaultSelected() {
    try {
      this.teamUsersList.map((a) => {
        a.users?.map((b) => {
          b.isChecked = this.selectedUser.includes(b.nUserid);
        });
      });
      this.teamUsersList.map((a) => {
        a.isChecked = a.users?.every((b) => b.isChecked);
      });
    } catch (error) {
      console.log("error", error);
    }
    this.cdr.detectChanges();
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.teamUsersList = yield this.present.getTeam(this.presentData.cType, this.presentData.nCaseid);
      this.checkForDefaultSelected();
      this.cdr.detectChanges();
    });
  }
  onUserSelect(y, x) {
    if (x.users.findIndex((a) => !a.isChecked) > -1) {
      x.isChecked = false;
    } else {
      x.isChecked = true;
    }
    if (y.isChecked) {
      if (!this.selectedUser.includes(y.nUserid))
        this.selectedUser.push(y.nUserid);
    } else {
      const ind = this.selectedUser.findIndex((a) => a == y.nUserid);
      if (ind > -1)
        this.selectedUser.splice(ind, 1);
    }
    this.selectedUserChange.emit(this.selectedUser);
    this.cdr.detectChanges();
  }
  checkAll(x) {
    x.users.map((a) => {
      a.isChecked = x.isChecked;
      if (x.isChecked) {
        if (!this.selectedUser.includes(a.nUserid)) {
          this.selectedUser.push(a.nUserid);
        }
      } else {
        const ind = this.selectedUser.findIndex((b) => b == a.nUserid);
        if (ind > -1) {
          this.selectedUser.splice(ind, 1);
        }
      }
    });
    this.selectedUserChange.emit(this.selectedUser);
    this.cdr.detectChanges();
  }
  filterSelectedUsers() {
    const allUserIds = this.teamUsersList.flatMap((team) => team.users.map((user) => user.nUserid));
    this.selectedUser = this.selectedUser.filter((userId) => allUserIds.includes(userId));
    this.selectedUserChange.emit(this.selectedUser);
    this.cdr.detectChanges();
  }
  static {
    this.\u0275fac = function TeamuserComponent_Factory(t) {
      return new (t || _TeamuserComponent)(\u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TeamuserComponent, selectors: [["present-teamuser"]], inputs: { presentData: "presentData", selectedUser: "selectedUser" }, outputs: { selectedUserChange: "selectedUserChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 0, consts: [[1, "grid", "grid-cols-2", "gap-2.5", "rounded-base", "h-full", "overflow-auto"], [1, "bg-white", "p-5"], [1, "flex", "justify-between", "border-b", "mb-2.5", "pb-2.5"], [1, "text-sm", "font-semibold"], [3, "ngModelChange", "change", "ngModel"], [1, "flex", "flex-col", "gap-2.5"], [1, "flex", "justify-between", "text-xs", "h-6", "items-center"], ["type", "checkbox", 3, "ngModelChange", "change", "ngModel"]], template: function TeamuserComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275repeaterCreate(1, TeamuserComponent_For_2_Template, 1, 1, null, null, _forTrack0);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.teamUsersList);
      }
    }, dependencies: [FormsModule, NgControlStatus, NgModel, MatCheckboxModule, MatCheckbox], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TeamuserComponent, { className: "TeamuserComponent", filePath: "src\\app\\presentation\\components\\setup\\teamuser\\teamuser.component.ts", lineNumber: 29 });
})();
export {
  TeamuserComponent
};
//# sourceMappingURL=chunk-HIVQ7OT2.js.map
