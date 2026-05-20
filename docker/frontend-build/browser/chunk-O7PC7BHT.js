import {
  SessionService
} from "./chunk-XIPFTUTL.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  DefaultValueAccessor,
  FormBuilder,
  FormControlName,
  FormGroupDirective,
  FormsModule,
  NgControlStatus,
  NgControlStatusGroup,
  NgModel,
  ReactiveFormsModule,
  Validators,
  ɵNgNoValidate
} from "./chunk-CIO7JDBK.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  HttpClientModule
} from "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  __async,
  __spreadProps,
  __spreadValues,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
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
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/rt/components/assignparticipant/assignparticipant.component.ts
var _forTrack0 = ($index, $item) => $item.nTeamid;
var _forTrack1 = ($index, $item) => $item.nUserid;
function AssignparticipantComponent_btn_30_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 7);
    \u0275\u0275listener("click", function AssignparticipantComponent_btn_30_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.isconfirm = false);
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 1, "rt.assignParticipant.addOthers"), "");
  }
}
function AssignparticipantComponent_input_31_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 19);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275twoWayListener("ngModelChange", function AssignparticipantComponent_input_31_Template_input_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.cSearch, $event) || (ctx_r1.cSearch = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function AssignparticipantComponent_input_31_Template_input_keyup_enter_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.seachUser($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.cSearch);
    \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(1, 2, "rt.assignParticipant.searchPlaceholder"));
  }
}
function AssignparticipantComponent_div_33_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "avtr", 24);
    \u0275\u0275listener("click", function AssignparticipantComponent_div_33_For_7_Template_avtr_click_0_listener() {
      const user_r5 = \u0275\u0275restoreView(_r4).$implicit;
      return \u0275\u0275resetView(user_r5.isSelected = !user_r5.isSelected);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const user_r5 = ctx.$implicit;
    \u0275\u0275property("detail", user_r5)("matTooltip", (user_r5 == null ? null : user_r5.cFname) + " " + (user_r5 == null ? null : user_r5.cLname))("active", user_r5.isSelected);
  }
}
function AssignparticipantComponent_div_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 20)(1, "div")(2, "span", 21);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 22);
    \u0275\u0275repeaterCreate(6, AssignparticipantComponent_div_33_For_7_Template, 1, 3, "avtr", 23, _forTrack1);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 1, "rt.assignParticipant.other"));
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r1.otherUserrs);
  }
}
function AssignparticipantComponent_For_39_Conditional_0_For_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "avtr", 24);
    \u0275\u0275listener("click", function AssignparticipantComponent_For_39_Conditional_0_For_5_Template_avtr_click_0_listener($event) {
      const user_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.toggleUserSelection(user_r7, $event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const user_r7 = ctx.$implicit;
    \u0275\u0275property("detail", user_r7)("matTooltip", (user_r7 == null ? null : user_r7.cFname) + " " + (user_r7 == null ? null : user_r7.cLname))("active", user_r7.isSelected);
  }
}
function AssignparticipantComponent_For_39_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "span", 21);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 22);
    \u0275\u0275repeaterCreate(4, AssignparticipantComponent_For_39_Conditional_0_For_5_Template, 1, 3, "avtr", 23, _forTrack1);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const team_r8 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(team_r8.cTeamname);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(team_r8.userlist);
  }
}
function AssignparticipantComponent_For_39_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, AssignparticipantComponent_For_39_Conditional_0_Template, 6, 1, "div");
  }
  if (rf & 2) {
    const team_r8 = ctx.$implicit;
    \u0275\u0275conditional(0, team_r8.userlist.length ? 0 : -1);
  }
}
function AssignparticipantComponent_div_40_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 25)(1, "span", 26);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-checkbox", 27);
    \u0275\u0275twoWayListener("ngModelChange", function AssignparticipantComponent_div_40_Template_mat_checkbox_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.isOndate, $event) || (ctx_r1.isOndate = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function AssignparticipantComponent_div_40_Template_mat_checkbox_change_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.isOndate ? ctx_r1.isSendNow = false : ctx_r1.isSendNow = ctx_r1.isSendNow);
    });
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "mat-checkbox", 27);
    \u0275\u0275twoWayListener("ngModelChange", function AssignparticipantComponent_div_40_Template_mat_checkbox_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.isSendNow, $event) || (ctx_r1.isSendNow = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function AssignparticipantComponent_div_40_Template_mat_checkbox_change_7_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.isSendNow ? ctx_r1.isOndate = false : ctx_r1.isOndate = ctx_r1.isOndate);
    });
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(3, 5, "rt.assignParticipant.notifyParticipant"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.isOndate);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 7, "rt.assignParticipant.onTheDate"));
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.isSendNow);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(9, 9, "rt.assignParticipant.now"));
  }
}
function AssignparticipantComponent_btn_41_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 28);
    \u0275\u0275listener("click", function AssignparticipantComponent_btn_41_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.isconfirm = !ctx_r1.isconfirm);
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, "rt.assignParticipant.confirmParticipant"));
  }
}
function AssignparticipantComponent_btn_42_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 28);
    \u0275\u0275listener("click", function AssignparticipantComponent_btn_42_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.isconfirm = !ctx_r1.isconfirm);
    })("click", function AssignparticipantComponent_btn_42_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.assignUsersToServer());
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(2, 1, "rt.assignParticipant.assignServer"), " ");
  }
}
var AssignparticipantComponent = class _AssignparticipantComponent {
  constructor(sessionService, dialogRef, data) {
    this.sessionService = sessionService;
    this.dialogRef = dialogRef;
    this.data = data;
    this.isconfirm = false;
    this.allSelected = false;
    this.teams = [];
    this.otherUserrs = [];
    this.cSearch = "";
    this.isOndate = true;
    this.isSendNow = false;
  }
  ngOnInit() {
    this.getTeams();
  }
  getTeams() {
    return __async(this, null, function* () {
      let teams = yield this.sessionService.getTeams(this.data.session.nCaseid);
      if (teams.length > 0) {
        this.teams = teams;
      }
      if (this.data.permission == "E") {
        this.getAssignedUsers();
      } else {
        this.selectAllUsers({ checked: true });
      }
    });
  }
  seachUser(event) {
    return __async(this, null, function* () {
      this.otherUserrs = this.otherUserrs.filter((a) => a.isSelected);
      let data = yield this.sessionService.getSeachedUsers(this.data.session.nCaseid, this.cSearch);
      if (data.length > 0) {
        data = data.filter((a) => !this.otherUserrs.some((b) => b.nUserid == a.nUserid));
        this.otherUserrs = [...this.otherUserrs, ...data];
      }
    });
  }
  changeServer() {
    this.dialogRef.close("CHANGE-SERVER");
  }
  assignUsersToServer() {
    return __async(this, null, function* () {
      let assignUsers = this.otherUserrs.filter((x) => x.isSelected).map((a) => {
        return { u: a.nUserid, t: "O" };
      });
      assignUsers = [...assignUsers, ...this.teams.map((a) => a.userlist.filter((m) => m.isSelected)).flat(2).map((a) => {
        return { u: a.nUserid, t: "T" };
      })];
      let mdl = {
        nCaseid: this.data.session.nCaseid,
        nSesid: this.data.session.nSesid,
        nRTSid: this.data.server.nRTSid,
        cNotifytype: this.isOndate ? "O" : "N",
        jUserid: JSON.stringify(assignUsers)
      };
      let res = yield this.sessionService.assignUser(mdl);
      if (res) {
        this.dialogRef.close(true);
      }
    });
  }
  selectAllUsers(event) {
    const isChecked = event.checked;
    this.teams.forEach((team) => team.userlist.forEach((user) => user.isSelected = isChecked));
    this.updateMasterCheckbox();
  }
  toggleUserSelection(user, event) {
    event.stopPropagation();
    user.isSelected = !user.isSelected;
    this.updateMasterCheckbox();
  }
  updateMasterCheckbox() {
    const allSelected = this.teams.every((team) => team.userlist.every((user) => user.isSelected));
    this.allSelected = allSelected;
  }
  getAssignedUsers() {
    return __async(this, null, function* () {
      let res = yield this.sessionService.getAssigned(this.data.session.nSesid);
      if (res.length > 0) {
        for (let x of res) {
          let user = this.teams.map((a) => a.userlist.find((b) => b.nUserid == x.nUserid)).find(Boolean);
          if (user) {
            user.isSelected = true;
          } else {
            this.otherUserrs.push(x);
          }
        }
      }
    });
  }
  static {
    this.\u0275fac = function AssignparticipantComponent_Factory(t) {
      return new (t || _AssignparticipantComponent)(\u0275\u0275directiveInject(SessionService), \u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AssignparticipantComponent, selectors: [["app-assignparticipant"]], standalone: true, features: [\u0275\u0275ProvidersFeature([SessionService]), \u0275\u0275StandaloneFeature], decls: 43, vars: 31, consts: [[1, "py-2.5", "px-5", "flex", "items-center", "bg-faint"], [1, "text-lg", "font-bold"], [1, "p-5"], [1, "flex", "items-center"], [1, "flex", "flex-col"], [1, "text-base", "font-bold"], [1, "text-sm"], ["mode", "white", 1, "ms-auto", 3, "click"], [1, "my-5"], [1, "text-base", "flex", "items-end", "gap-2", "mb-2"], ["mode", "text", "addcls", "!p-0"], ["mode", "white", "class", "ms-auto", 3, "click", 4, "ngIf"], ["class", "block w-full px-3 py-2 border rounded-base shadow-sm focus:outline-none text-xs border-tab text-gray focus:shadow-[0px_0px_6px_#0066FF] focus:border-blue-deactivate", "type", "text", 3, "ngModel", "placeholder", "ngModelChange", "keyup.enter", 4, "ngIf"], [1, "max-h-[40vh]", "overflow-auto", "mt-6"], ["class", " flex flex-col gap-3 mb-6", 4, "ngIf"], [1, "mb-3", 3, "ngModelChange", "change", "ngModel"], [1, "flex", "flex-col", "gap-3"], ["class", "flex gap-2 mt-6", 4, "ngIf"], ["class", "mt-6", 3, "click", 4, "ngIf"], ["type", "text", 1, "block", "w-full", "px-3", "py-2", "border", "rounded-base", "shadow-sm", "focus:outline-none", "text-xs", "border-tab", "text-gray", "focus:shadow-[0px_0px_6px_#0066FF]", "focus:border-blue-deactivate", 3, "ngModelChange", "keyup.enter", "ngModel", "placeholder"], [1, "flex", "flex-col", "gap-3", "mb-6"], [1, "text-sm", "font-bold", "mb-2.5", "block"], [1, "flex", "gap-2.5", "flex-wrap"], ["size", "lg", 1, "cursor-pointer", 3, "detail", "matTooltip", "active"], ["size", "lg", 1, "cursor-pointer", 3, "click", "detail", "matTooltip", "active"], [1, "flex", "gap-2", "mt-6"], [1, "text-xs"], [1, "example-margin", 3, "ngModelChange", "change", "ngModel"], [1, "mt-6", 3, "click"]], template: function AssignparticipantComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "header", 0)(1, "span", 1);
        \u0275\u0275text(2);
        \u0275\u0275pipe(3, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "div", 2)(5, "div", 3)(6, "h6", 4)(7, "span", 5);
        \u0275\u0275text(8);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "span", 6);
        \u0275\u0275text(10);
        \u0275\u0275pipe(11, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "span", 6);
        \u0275\u0275text(13);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "span", 6);
        \u0275\u0275text(15);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "span", 6);
        \u0275\u0275text(17);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(18, "btn", 7);
        \u0275\u0275listener("click", function AssignparticipantComponent_Template_btn_click_18_listener() {
          return ctx.changeServer();
        });
        \u0275\u0275text(19);
        \u0275\u0275pipe(20, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(21, "hr", 8);
        \u0275\u0275elementStart(22, "h6", 9)(23, "b");
        \u0275\u0275text(24);
        \u0275\u0275pipe(25, "translate");
        \u0275\u0275pipe(26, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(27, "btn", 10);
        \u0275\u0275text(28);
        \u0275\u0275pipe(29, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275template(30, AssignparticipantComponent_btn_30_Template, 3, 3, "btn", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275template(31, AssignparticipantComponent_input_31_Template, 2, 4, "input", 12);
        \u0275\u0275elementStart(32, "div", 13);
        \u0275\u0275template(33, AssignparticipantComponent_div_33_Template, 8, 3, "div", 14);
        \u0275\u0275elementStart(34, "mat-checkbox", 15);
        \u0275\u0275twoWayListener("ngModelChange", function AssignparticipantComponent_Template_mat_checkbox_ngModelChange_34_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.allSelected, $event) || (ctx.allSelected = $event);
          return $event;
        });
        \u0275\u0275listener("change", function AssignparticipantComponent_Template_mat_checkbox_change_34_listener($event) {
          return ctx.selectAllUsers($event);
        });
        \u0275\u0275text(35);
        \u0275\u0275pipe(36, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(37, "div", 16);
        \u0275\u0275repeaterCreate(38, AssignparticipantComponent_For_39_Template, 1, 1, null, null, _forTrack0);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(40, AssignparticipantComponent_div_40_Template, 10, 11, "div", 17)(41, AssignparticipantComponent_btn_41_Template, 3, 3, "btn", 18)(42, AssignparticipantComponent_btn_42_Template, 3, 3, "btn", 18);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 17, "rt.assignParticipant.chosenServer"));
        \u0275\u0275advance(6);
        \u0275\u0275textInterpolate(ctx.data == null ? null : ctx.data.server == null ? null : ctx.data.server.cName);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(11, 19, "rt.assignParticipant.caseName"));
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(ctx.data == null ? null : ctx.data.session == null ? null : ctx.data.session.cCaseno);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(ctx.data == null ? null : ctx.data.server == null ? null : ctx.data.server.cUrl);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(ctx.data == null ? null : ctx.data.server == null ? null : ctx.data.server.nPort);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(20, 21, "rt.assignParticipant.change"), " ");
        \u0275\u0275advance(5);
        \u0275\u0275textInterpolate1(" ", ctx.isconfirm ? \u0275\u0275pipeBind1(25, 23, "rt.assignParticipant.addedParticipant") : \u0275\u0275pipeBind1(26, 25, "rt.assignParticipant.searchParticipant"), " ");
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(29, 27, "rt.assignParticipant.clearAll"), "");
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.isconfirm);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.isconfirm);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.otherUserrs == null ? null : ctx.otherUserrs.length);
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.allSelected);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(36, 29, "rt.assignParticipant.allTeamMembers"));
        \u0275\u0275advance(3);
        \u0275\u0275repeater(ctx.teams);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.isconfirm);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.isconfirm);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.isconfirm);
      }
    }, dependencies: [ButtonComponent, AvatarComponent, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, MatTooltipModule, MatTooltip, MatCheckboxModule, MatCheckbox, CommonModule, NgIf, ReactiveFormsModule, HttpClientModule, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AssignparticipantComponent, { className: "AssignparticipantComponent", filePath: "src\\app\\rt\\components\\assignparticipant\\assignparticipant.component.ts", lineNumber: 21 });
})();

// src/app/rt/components/newserver/newserver.component.ts
var NewserverComponent = class _NewserverComponent {
  constructor(formBuilder, sessionService, dialogRef, data, ss) {
    this.formBuilder = formBuilder;
    this.sessionService = sessionService;
    this.dialogRef = dialogRef;
    this.data = data;
    this.ss = ss;
    this.formsubmit = false;
    this.isLoading = false;
    this.userInfo = {};
    this.frm = this.formBuilder.group({
      nRTSid: [0],
      cUrl: ["", [Validators.required]],
      nPort: ["", [Validators.required]],
      cName: ["", [Validators.required]],
      permission: ["N"]
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userInfo = yield this.ss.getUserInfo();
      this.nUserid = this.userInfo.nUserid;
    });
  }
  submit() {
    this.formsubmit = true;
    if (this.frm.invalid) {
      return;
    }
    this.isLoading = true;
    const mdl = __spreadProps(__spreadValues({}, this.frm.value), { nUserid: this.nUserid });
    this.sessionService.addServer(mdl).then((data) => {
      this.isLoading = false;
      this.dialogRef.close();
    }).catch((err) => {
      this.isLoading = false;
    });
  }
  close() {
    this.dialogRef.close();
  }
  static {
    this.\u0275fac = function NewserverComponent_Factory(t) {
      return new (t || _NewserverComponent)(\u0275\u0275directiveInject(FormBuilder), \u0275\u0275directiveInject(SessionService), \u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA), \u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NewserverComponent, selectors: [["app-newserver"]], standalone: true, features: [\u0275\u0275ProvidersFeature([SessionService]), \u0275\u0275StandaloneFeature], decls: 34, vars: 30, consts: [[1, "py-2.5", "px-5", "flex", "items-center", "bg-faint"], [1, "text-lg", "font-bold"], [1, "p-5", "flex", "flex-col", "gap-6", 3, "formGroup"], [1, "mb-3"], [1, "text-sm", "font-bold", "mb-2", "block"], [1, "text-xxs", "font-normal", "text-gray-500", "ms-2"], ["type", "text", "formControlName", "cName", 1, "block", "w-full", "px-3", "py-2", "border", "rounded-base", "shadow-sm", "focus:outline-none", "text-xs", "border-tab", "text-gray", "focus:shadow-[0px_0px_6px_#0066FF]", "focus:border-blue-deactivate", 3, "placeholder"], ["type", "text", "formControlName", "cUrl", 1, "block", "w-full", "px-3", "py-2", "border", "rounded-base", "shadow-sm", "focus:outline-none", "text-xs", "border-tab", "text-gray", "focus:shadow-[0px_0px_6px_#0066FF]", "focus:border-blue-deactivate", 3, "placeholder"], [1, "w-1/4"], ["type", "text", "formControlName", "nPort", 1, "block", "w-full", "px-3", "py-2", "border", "rounded-base", "shadow-sm", "focus:outline-none", "text-xs", "border-tab", "text-gray", "focus:shadow-[0px_0px_6px_#0066FF]", "focus:border-blue-deactivate", 3, "placeholder"], [1, "flex", "gap-2"], [3, "click", "disabled"], ["mode", "white", 3, "click"]], template: function NewserverComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "header", 0)(1, "span", 1);
        \u0275\u0275text(2);
        \u0275\u0275pipe(3, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "form", 2)(5, "div")(6, "div", 3)(7, "label", 4);
        \u0275\u0275text(8);
        \u0275\u0275pipe(9, "translate");
        \u0275\u0275element(10, "span", 5);
        \u0275\u0275elementEnd();
        \u0275\u0275element(11, "input", 6);
        \u0275\u0275pipe(12, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "div", 3)(14, "label", 4);
        \u0275\u0275text(15);
        \u0275\u0275pipe(16, "translate");
        \u0275\u0275element(17, "span", 5);
        \u0275\u0275elementEnd();
        \u0275\u0275element(18, "input", 7);
        \u0275\u0275pipe(19, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(20, "div", 8)(21, "label", 4);
        \u0275\u0275text(22);
        \u0275\u0275pipe(23, "translate");
        \u0275\u0275element(24, "span", 5);
        \u0275\u0275elementEnd();
        \u0275\u0275element(25, "input", 9);
        \u0275\u0275pipe(26, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(27, "div", 10)(28, "btn", 11);
        \u0275\u0275listener("click", function NewserverComponent_Template_btn_click_28_listener() {
          return ctx.submit();
        });
        \u0275\u0275text(29);
        \u0275\u0275pipe(30, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(31, "btn", 12);
        \u0275\u0275listener("click", function NewserverComponent_Template_btn_click_31_listener() {
          return ctx.close();
        });
        \u0275\u0275text(32);
        \u0275\u0275pipe(33, "translate");
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 12, "rt.newServer.title"));
        \u0275\u0275advance(2);
        \u0275\u0275property("formGroup", ctx.frm);
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(9, 14, "rt.newServer.name"), " ");
        \u0275\u0275advance(3);
        \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(12, 16, "rt.newServer.enterName"));
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(16, 18, "rt.newServer.urlIp"), " ");
        \u0275\u0275advance(3);
        \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(19, 20, "rt.newServer.enterUrlIp"));
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(23, 22, "rt.newServer.port"), " ");
        \u0275\u0275advance(3);
        \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(26, 24, "rt.newServer.port"));
        \u0275\u0275advance(3);
        \u0275\u0275property("disabled", ctx.frm.invalid);
        \u0275\u0275attribute("isdisabled", ctx.frm.invalid);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(30, 26, "rt.newServer.create"));
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(33, 28, "rt.newServer.cancel"));
      }
    }, dependencies: [ButtonComponent, FormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, MatTooltipModule, MatCheckboxModule, CommonModule, ReactiveFormsModule, FormGroupDirective, FormControlName, HttpClientModule, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NewserverComponent, { className: "NewserverComponent", filePath: "src\\app\\rt\\components\\newserver\\newserver.component.ts", lineNumber: 22 });
})();

// src/app/rt/components/assignservers/assignservers.component.ts
var _c0 = (a0) => ({ "py-3": a0 });
function AssignserversComponent_div_20_div_10_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 17);
    \u0275\u0275listener("click", function AssignserversComponent_div_20_div_10_Conditional_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const x_r2 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.assignServer(x_r2));
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 1, "rt.assignServers.assignButton"), " ");
  }
}
function AssignserversComponent_div_20_div_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15);
    \u0275\u0275template(1, AssignserversComponent_div_20_div_10_Conditional_1_Template, 3, 3, "btn", 16);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r2.data.nSesid ? 1 : -1);
  }
}
function AssignserversComponent_div_20_div_11_btn_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 17);
    \u0275\u0275listener("click", function AssignserversComponent_div_20_div_11_btn_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const x_r2 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.chooseServer(x_r2));
    });
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 1, "rt.assignServers.chooseButton"), " ");
  }
}
function AssignserversComponent_div_20_div_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15);
    \u0275\u0275template(1, AssignserversComponent_div_20_div_11_btn_1_Template, 3, 3, "btn", 18);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.data != "N");
  }
}
function AssignserversComponent_div_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10)(1, "div", 11)(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "div", 12)(5, "span");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 13)(8, "span");
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, AssignserversComponent_div_20_div_10_Template, 2, 1, "div", 14)(11, AssignserversComponent_div_20_div_11_Template, 2, 1, "div", 14);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(6, _c0, ctx_r2.data == "N"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r2.cName, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r2.cUrl, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r2.nPort, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.permission == "N");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.permission == "E");
  }
}
var AssignserversComponent = class _AssignserversComponent {
  constructor(dialog, sessionService, dialogRefs, data) {
    this.dialog = dialog;
    this.sessionService = sessionService;
    this.dialogRefs = dialogRefs;
    this.data = data;
    this.servers = [];
    this.permission = "N";
  }
  ngOnInit() {
    this.getServers();
  }
  getServers() {
    return __async(this, null, function* () {
      let data = yield this.sessionService.serverList();
      if (data && data.length > 0) {
        this.servers = data;
        if (this.data.permission == "E") {
          this.permission = "E";
        }
      }
    });
  }
  assign(x) {
    const dialogRef = this.dialog.open(AssignparticipantComponent, {
      width: "630px",
      height: "fit-content",
      data: { server: x, session: this.data }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dialogRefs.close(true);
      }
    });
  }
  newservers() {
    const dialogRef = this.dialog.open(NewserverComponent, {
      width: "600px",
      height: "fit-content"
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.getServers();
    });
  }
  chooseServer(x) {
    return __async(this, null, function* () {
      let data = yield this.sessionService.setServer(this.data.nSesid, x.nRTSid);
      if (data.length > 0) {
        this.sessionService.show(data[0]["value"]);
        this.dialogRefs.close(true);
      }
    });
  }
  assignServer(x) {
    return __async(this, null, function* () {
      let mdl = {
        nCaseid: this.data.nCaseid,
        nSesid: this.data.nSesid,
        nRTSid: x.nRTSid,
        cNotifytype: "O",
        //this.isOndate ? 'O' : 'N',
        jUserid: JSON.stringify([])
      };
      let res = yield this.sessionService.assignUser(mdl);
      if (res) {
        this.dialogRefs.close(true);
      }
    });
  }
  trackByFn(index, item) {
    return item.nRTSid;
  }
  static {
    this.\u0275fac = function AssignserversComponent_Factory(t) {
      return new (t || _AssignserversComponent)(\u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(SessionService), \u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AssignserversComponent, selectors: [["app-assignservers"]], standalone: true, features: [\u0275\u0275ProvidersFeature([SessionService]), \u0275\u0275StandaloneFeature], decls: 21, vars: 17, consts: [[1, "py-2.5", "px-5", "flex", "items-center", "bg-faint"], [1, "text-lg", "font-bold"], ["mode", "outlined", 1, "ms-auto", 3, "click"], ["name", "addfill"], [1, "tabhead", "flex", "text-xs", "font-bold", "px-2.5"], [1, "w-1/3", "px-3", "py-3"], [1, "w-2/5", "px-3", "py-3"], [1, "w-20", "px-3", "py-3"], [1, "body"], ["class", "flex rows group px-2.5 text-xs mb-2.5 hover:bg-blue-deactivate", 3, "ngClass", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "flex", "rows", "group", "px-2.5", "text-xs", "mb-2.5", "hover:bg-blue-deactivate", 3, "ngClass"], [1, "w-1/3", "px-3", "flex", "items-center"], [1, "w-2/5", "px-3", "flex", "items-center"], [1, "w-20", "px-3", "gap-3", "flex", "items-center"], ["class", "w-1/3 px-3 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100", 4, "ngIf"], [1, "w-1/3", "px-3", "flex", "items-center", "justify-center", "gap-4", "opacity-0", "group-hover:opacity-100"], [1, "block", "ms-auto"], [1, "block", "ms-auto", 3, "click"], ["class", "block  ms-auto", 3, "click", 4, "ngIf"]], template: function AssignserversComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "header", 0)(1, "span", 1);
        \u0275\u0275text(2);
        \u0275\u0275pipe(3, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "btn", 2);
        \u0275\u0275listener("click", function AssignserversComponent_Template_btn_click_4_listener() {
          return ctx.newservers();
        });
        \u0275\u0275element(5, "icon", 3);
        \u0275\u0275text(6);
        \u0275\u0275pipe(7, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(8, "div", 4)(9, "div", 5);
        \u0275\u0275text(10);
        \u0275\u0275pipe(11, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "div", 6);
        \u0275\u0275text(13);
        \u0275\u0275pipe(14, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "div", 7);
        \u0275\u0275text(16);
        \u0275\u0275pipe(17, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275element(18, "div", 5);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(19, "div", 8);
        \u0275\u0275template(20, AssignserversComponent_div_20_Template, 12, 8, "div", 9);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 7, "rt.assignServers.title"));
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(7, 9, "rt.assignServers.newServer"), " ");
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(11, 11, "rt.assignServers.name"));
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(14, 13, "rt.assignServers.urlIp"), "");
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(17, 15, "rt.assignServers.port"));
        \u0275\u0275advance(4);
        \u0275\u0275property("ngForOf", ctx.servers)("ngForTrackBy", ctx.trackByFn);
      }
    }, dependencies: [ButtonComponent, IconComponent, FormsModule, MatTooltipModule, MatCheckboxModule, CommonModule, NgClass, NgForOf, NgIf, ReactiveFormsModule, HttpClientModule, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AssignserversComponent, { className: "AssignserversComponent", filePath: "src\\app\\rt\\components\\assignservers\\assignservers.component.ts", lineNumber: 23 });
})();

export {
  AssignparticipantComponent,
  AssignserversComponent
};
//# sourceMappingURL=chunk-O7PC7BHT.js.map
