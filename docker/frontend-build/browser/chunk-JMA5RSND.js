import {
  TeamshareComponent
} from "./chunk-6CVBO52M.js";
import {
  TaskService
} from "./chunk-PDZ7367Z.js";
import {
  MatSlider,
  MatSliderModule,
  MatSliderThumb
} from "./chunk-RQT3Q2FS.js";
import {
  NativeElementInjectorDirective,
  NgxIntlTelInputModule
} from "./chunk-4WAWQBKW.js";
import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepickerModule,
  MatDatepickerToggle,
  MatEndDate,
  MatStartDate
} from "./chunk-X3RSWYEV.js";
import {
  DatetimeComponent
} from "./chunk-RG2H6CLM.js";
import {
  MatInputModule
} from "./chunk-XTSEIZ7V.js";
import {
  MatRadioModule
} from "./chunk-ILBZODYX.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatError,
  MatFormFieldModule,
  MatSuffix
} from "./chunk-Y2GGPNYR.js";
import {
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  require_moment
} from "./chunk-BXSF7XA6.js";
import {
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
  FormControl,
  FormControlName,
  FormGroup,
  FormGroupDirective,
  FormGroupName,
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
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  MatNativeDateModule,
  MatOption,
  provideNativeDateAdapter
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
  __spreadValues,
  __toESM,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
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
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction4,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/tasks/task-form/task-form.component.ts
var import_moment = __toESM(require_moment());
var _c0 = ["dateRnage"];
var _c1 = (a0) => ({ "h-full": a0 });
var _c2 = (a0) => ({ "h-1/3": a0 });
var _c3 = (a0) => ({ "h-2/3": a0 });
var _c4 = () => ({ standalone: true });
var _c5 = (a0, a1, a2, a3) => ({ "!text-red-500": a0, "!text-yellow-200": a1, "!text-gray-400": a2, "!text-green-400": a3 });
function TaskFormComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275element(1, "div", 5);
    \u0275\u0275elementEnd();
  }
}
function TaskFormComponent_Conditional_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7)(1, "icon", 53);
    \u0275\u0275listener("click", function TaskFormComponent_Conditional_1_Conditional_1_Template_icon_click_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.back());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r2.isFiletask ? "File" : "Fact", " Task ");
  }
}
function TaskFormComponent_Conditional_1_ng_container_11_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 55);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const validation_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", validation_r4.message, " ");
  }
}
function TaskFormComponent_Conditional_1_ng_container_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TaskFormComponent_Conditional_1_ng_container_11_div_1_Template, 2, 1, "div", 54);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const validation_r4 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.frm.get("cSubject").hasError(validation_r4.type) && ctx_r2.formsubmit);
  }
}
function TaskFormComponent_Conditional_1_ng_container_15_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 55);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const validation_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", validation_r5.message, " ");
  }
}
function TaskFormComponent_Conditional_1_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, TaskFormComponent_Conditional_1_ng_container_15_div_1_Template, 2, 1, "div", 54);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const validation_r5 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.frm.get("cDesc").hasError(validation_r5.type) && ctx_r2.formsubmit);
  }
}
function TaskFormComponent_Conditional_1_For_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22)(1, "div", 56);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r6 = ctx.$implicit;
    \u0275\u0275property("value", item_r6.nValue);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", item_r6.cKey, " ");
  }
}
function TaskFormComponent_Conditional_1_mat_option_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22)(1, "div", 56);
    \u0275\u0275element(2, "icon", 57);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const y_r7 = ctx.$implicit;
    \u0275\u0275property("value", y_r7.nValue);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction4(4, _c5, y_r7.nValue == 1, y_r7.nValue == 2, y_r7.nValue == 4, y_r7.nValue == 3));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2("", y_r7.nPriority, " ", y_r7.cKey, " ");
  }
}
function TaskFormComponent_Conditional_1_Conditional_60_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-error");
    \u0275\u0275text(1, "Invalid start date");
    \u0275\u0275elementEnd();
  }
}
function TaskFormComponent_Conditional_1_Conditional_61_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-error");
    \u0275\u0275text(1, "Invalid end date");
    \u0275\u0275elementEnd();
  }
}
function TaskFormComponent_Conditional_1_Conditional_65_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "datetime", 58);
    \u0275\u0275listener("dateChange", function TaskFormComponent_Conditional_1_Conditional_65_Template_datetime_dateChange_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onDateChange($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("date", ctx_r2.dReminderDt);
  }
}
function TaskFormComponent_Conditional_1_Conditional_77_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275element(1, "div", 5);
    \u0275\u0275elementEnd();
  }
}
function TaskFormComponent_Conditional_1_Conditional_78_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 60);
    \u0275\u0275listener("click", function TaskFormComponent_Conditional_1_Conditional_78_Conditional_0_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.onsubmit());
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275property("disabled", ctx_r2.frm.invalid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Add ", ctx_r2.isFiletask ? "File" : "Fact", " Task ");
  }
}
function TaskFormComponent_Conditional_1_Conditional_78_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 61);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "mat-menu", 62, 2)(4, "div")(5, "h6", 63);
    \u0275\u0275text(6, " Any change made to this task will apply to files that assigned to. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 64)(8, "btn", 65);
    \u0275\u0275listener("click", function TaskFormComponent_Conditional_1_Conditional_78_Conditional_1_Template_btn_click_8_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.onsubmit());
    });
    \u0275\u0275text(9, "Confirm");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "btn", 66);
    \u0275\u0275text(11, "Review task");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(12, "btn", 67);
    \u0275\u0275text(13, " Delete ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "mat-menu", 62, 3)(16, "div")(17, "h6", 63);
    \u0275\u0275text(18, " If you delete this task, it will apply to files that assigned to. ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "div", 64)(20, "btn", 65);
    \u0275\u0275listener("click", function TaskFormComponent_Conditional_1_Conditional_78_Conditional_1_Template_btn_click_20_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.delete());
    });
    \u0275\u0275text(21, "Delete");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "btn", 66);
    \u0275\u0275text(23, "cancel");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const update_r11 = \u0275\u0275reference(3);
    const end_r12 = \u0275\u0275reference(15);
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275property("matMenuTriggerFor", update_r11)("disabled", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && ctx_r2.can_edit_all && ctx_r2.isFrmChanged ? ctx_r2.frm.invalid : true);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Update ", ctx_r2.isFiletask ? "File" : "Fact", " Task ");
    \u0275\u0275advance(11);
    \u0275\u0275classProp("dsbl", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && !ctx_r2.can_edit_all);
    \u0275\u0275property("matMenuTriggerFor", end_r12);
  }
}
function TaskFormComponent_Conditional_1_Conditional_78_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TaskFormComponent_Conditional_1_Conditional_78_Conditional_0_Template, 2, 2, "btn", 59)(1, TaskFormComponent_Conditional_1_Conditional_78_Conditional_1_Template, 24, 6);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, ctx_r2.frm.value.permission == "N" ? 0 : 1);
  }
}
function TaskFormComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "form", 6);
    \u0275\u0275template(1, TaskFormComponent_Conditional_1_Conditional_1_Template, 3, 1, "div", 7);
    \u0275\u0275elementStart(2, "div", 8)(3, "div", 9)(4, "label", 10)(5, "h6", 11);
    \u0275\u0275text(6, "Subject ");
    \u0275\u0275elementStart(7, "span", 12);
    \u0275\u0275text(8, "*");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "textarea", 13);
    \u0275\u0275text(10, "                ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(11, TaskFormComponent_Conditional_1_ng_container_11_Template, 2, 1, "ng-container", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "label", 15)(13, "textarea", 16);
    \u0275\u0275text(14, "                ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(15, TaskFormComponent_Conditional_1_ng_container_15_Template, 2, 1, "ng-container", 14);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "div", 17)(17, "teamshare", 18);
    \u0275\u0275listener("userListChange", function TaskFormComponent_Conditional_1_Template_teamshare_userListChange_17_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.isFrmChanged = true);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "div", 19)(19, "label", 20)(20, "h6", 11);
    \u0275\u0275text(21, "Status ");
    \u0275\u0275elementStart(22, "span", 12);
    \u0275\u0275text(23, "*");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(24, "mat-select", 21);
    \u0275\u0275repeaterCreate(25, TaskFormComponent_Conditional_1_For_26_Template, 3, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(27, "label", 23)(28, "h6", 11);
    \u0275\u0275text(29, "Priority ");
    \u0275\u0275elementStart(30, "span", 12);
    \u0275\u0275text(31, "*");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(32, "mat-select", 24);
    \u0275\u0275template(33, TaskFormComponent_Conditional_1_mat_option_33_Template, 4, 9, "mat-option", 25);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(34, "label", 26)(35, "h6", 11);
    \u0275\u0275text(36, "Progress ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(37, "div", 27)(38, "mat-slider", 28);
    \u0275\u0275element(39, "input", 29, 0);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(41, "span", 30);
    \u0275\u0275text(42);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(43, "div", 31)(44, "h6", 32);
    \u0275\u0275text(45, "Date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(46, "div", 33)(47, "div", 34)(48, "div", 35)(49, "span", 36);
    \u0275\u0275text(50, "Start");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(51, "mat-date-range-input", 37);
    \u0275\u0275element(52, "input", 38)(53, "input", 39);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(54, "span", 40);
    \u0275\u0275text(55, "End");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(56, "btn", 41);
    \u0275\u0275element(57, "mat-datepicker-toggle", 42);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(58, "mat-date-range-picker", 43, 1);
    \u0275\u0275listener("closed", function TaskFormComponent_Conditional_1_Template_mat_date_range_picker_closed_58_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.ondateRangeClosed());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(60, TaskFormComponent_Conditional_1_Conditional_60_Template, 2, 0, "mat-error")(61, TaskFormComponent_Conditional_1_Conditional_61_Template, 2, 0, "mat-error");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(62, "div", 44)(63, "mat-checkbox", 45);
    \u0275\u0275twoWayListener("ngModelChange", function TaskFormComponent_Conditional_1_Template_mat_checkbox_ngModelChange_63_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.isReminder, $event) || (ctx_r2.isReminder = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TaskFormComponent_Conditional_1_Template_mat_checkbox_ngModelChange_63_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.isFrmChanged = true);
    });
    \u0275\u0275text(64, "Reminder");
    \u0275\u0275elementEnd();
    \u0275\u0275template(65, TaskFormComponent_Conditional_1_Conditional_65_Template, 1, 1, "datetime", 46);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(66, "div", 47)(67, "h6", 11);
    \u0275\u0275text(68, "System Notification Settings: ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(69, "div", 48)(70, "mat-checkbox", 49);
    \u0275\u0275text(71, "Task is Assigned");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(72, "mat-checkbox", 50);
    \u0275\u0275text(73, "Reminder is Due");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(74, "mat-checkbox", 51);
    \u0275\u0275text(75, "Task Status Changes");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(76, "div", 52);
    \u0275\u0275template(77, TaskFormComponent_Conditional_1_Conditional_77_Template, 2, 0, "div", 4)(78, TaskFormComponent_Conditional_1_Conditional_78_Template, 2, 1);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_34_0;
    let tmp_35_0;
    const picker_r13 = \u0275\u0275reference(59);
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("formGroup", ctx_r2.frm)("hidden", ctx_r2.active_forms != "");
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r2.isfullview ? 1 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(47, _c1, ctx_r2.isfullview));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(49, _c2, ctx_r2.isfullview));
    \u0275\u0275advance(5);
    \u0275\u0275classProp("error", ctx_r2.frm.get("cSubject").invalid && ctx_r2.formsubmit)("dsbl", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && !ctx_r2.can_edit_all);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(51, _c1, ctx_r2.isfullview));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r2.validation_messages.cSubject);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(53, _c3, ctx_r2.isfullview));
    \u0275\u0275advance();
    \u0275\u0275classProp("error", ctx_r2.frm.get("cDesc").invalid && ctx_r2.formsubmit)("dsbl", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && !ctx_r2.can_edit_all);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(55, _c1, ctx_r2.isfullview));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r2.validation_messages.cDesc);
    \u0275\u0275advance();
    \u0275\u0275classProp("dsbl", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && !ctx_r2.can_edit_all);
    \u0275\u0275advance();
    \u0275\u0275property("nCaseid", ctx_r2.nCaseid)("userList", ctx_r2.userList)("disablePermissions", true)("adminPDisabled", true);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("dsbl", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && !ctx_r2.can_edit_all && !ctx_r2.can_edit_status);
    \u0275\u0275advance(6);
    \u0275\u0275repeater(ctx_r2.taskStatus);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("dsbl", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && !ctx_r2.can_edit_all);
    \u0275\u0275advance(6);
    \u0275\u0275property("ngForOf", ctx_r2.priority);
    \u0275\u0275advance();
    \u0275\u0275classProp("dsbl", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && !ctx_r2.can_edit_all && !ctx_r2.can_edit_status);
    \u0275\u0275advance(4);
    \u0275\u0275property("disableRipple", true)("max", 100);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1("", ctx_r2.frm.value.nProgress, "%");
    \u0275\u0275advance();
    \u0275\u0275classProp("dsbl", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && !ctx_r2.can_edit_all);
    \u0275\u0275advance(8);
    \u0275\u0275property("rangePicker", picker_r13)("min", ctx_r2.today);
    \u0275\u0275advance(6);
    \u0275\u0275property("for", picker_r13);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(60, ((tmp_34_0 = ctx_r2.frm.get("jTimeline.dStartDt")) == null ? null : tmp_34_0.hasError("matStartDateInvalid")) ? 60 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(61, ((tmp_35_0 = ctx_r2.frm.get("jTimeline.dEndDt")) == null ? null : tmp_35_0.hasError("matEndDateInvalid")) ? 61 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.isReminder);
    \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(57, _c4));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(65, ctx_r2.isReminder ? 65 : -1);
    \u0275\u0275advance();
    \u0275\u0275classProp("dsbl", (ctx_r2.frm == null ? null : ctx_r2.frm.value == null ? null : ctx_r2.frm.value.permission) == "E" && !ctx_r2.can_edit_all);
    \u0275\u0275advance(11);
    \u0275\u0275conditional(77, ctx_r2.isLoading && ctx_r2.formsubmit ? 77 : 78);
  }
}
var TaskFormComponent = class _TaskFormComponent {
  constructor(common, commonF, dialogRef, tost, task, cdr, store) {
    this.common = common;
    this.commonF = commonF;
    this.dialogRef = dialogRef;
    this.tost = tost;
    this.task = task;
    this.cdr = cdr;
    this.store = store;
    this.taskForm = new EventEmitter();
    this.isfullview = false;
    this.cPermission = "N";
    this.isFiletask = false;
    this.OnEvent = new EventEmitter();
    this.range = new FormGroup({
      start: new FormControl(null),
      end: new FormControl(null)
    });
    this.userList = [];
    this.priority = [];
    this.taskStatus = [];
    this.reminders_list = [];
    this.isReminder = false;
    this.formsubmit = false;
    this.active_forms = "";
    this.timezone = [];
    this.ismyfiles = false;
    this.jReminder = {
      dDate: "",
      dTime: ""
    };
    this.isLoading = false;
    this.can_edit_all = false;
    this.can_edit_status = false;
    this.today = /* @__PURE__ */ new Date();
    this.isFrmChanged = false;
    this.validation_messages = {
      "nChid": [
        { type: "required", message: "Chapter is required" }
      ]
    };
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.nUserid = yield this.store.getUserId();
      this.initLists();
      this.frm = new FormGroup({
        nTaskid: new FormControl(null),
        permission: new FormControl("N"),
        cSubject: new FormControl("", Validators.required),
        cDesc: new FormControl("", Validators.required),
        jEmailnotify: new FormGroup({
          cAssign: new FormControl(false),
          cRemind: new FormControl(false),
          cStatusChange: new FormControl(false)
        }),
        nPriority: new FormControl(null, Validators.required),
        nStatus: new FormControl(null, Validators.required),
        nProgress: new FormControl(0),
        jTimeline: new FormGroup({
          dStartDt: new FormControl(/* @__PURE__ */ new Date()),
          dEndDt: new FormControl(/* @__PURE__ */ new Date()),
          time_prges: new FormControl(0),
          show_tm: new FormControl(""),
          days: new FormControl(0)
        }),
        cTasktype: new FormControl(this.isFiletask ? "F" : "FT"),
        // jReminder: new FormControl(''),
        jUsers: new FormControl(""),
        nCaseid: new FormControl("")
      });
    });
  }
  initLists() {
    return __async(this, null, function* () {
      this.can_edit_all = false;
      this.can_edit_status = false;
      this.isLoading = true;
      this.userList = yield this.common.getMyTeamUsers(this.nCaseid);
      if (this.userList?.length) {
        this.userList = this.userList.filter((x) => x.nUserid != this.nUserid);
        this.userList = this.userList.map((x) => {
          if (x.isAdmin) {
            x.isSelected = true;
            x.bCanEdit = true;
            x.bCanCopy = true;
            x.bCanReshare = true;
            x.bCanComment = true;
          }
          return x;
        });
      }
      this.priority = yield this.common.getCode(17);
      this.taskStatus = yield this.common.getCode(25);
      if (this.editable_list) {
        yield this.fillDetail();
        this.markSelectedUsers(this.userList, this.frm.value.jUsers);
      } else {
        this.frm.patchValue({
          permission: "N"
        });
      }
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }
  fillDetail() {
    return __async(this, null, function* () {
      try {
        const res = yield this.task.getTaskDetailV2(this.editable_list.nTaskid);
        this.editable_list = res[0][0];
        this.can_edit_all = this.editable_list?.can_edit_all;
        this.can_edit_status = this.editable_list?.can_edit_status;
        if (this.dateRnage) {
          this.dateRnage.selectedStartDate = this.editable_list.jTimeline.dStartDt;
          this.dateRnage.selectedEndDate = this.editable_list.jTimeline.dEndDt;
        }
        this.userList.filter((a) => (res[1] || []).findIndex((m) => m.nUserid == a.nUserid) > -1).map((a) => a.isSelected = true);
        const users = this.userList.filter((a) => a.isSelected);
        debugger;
        this.frm.patchValue({
          permission: "E",
          nTaskid: this.editable_list.nTaskid,
          cSubject: this.editable_list.cSubject,
          cDesc: this.editable_list.cDesc,
          jEmailnotify: {
            cAssign: this.editable_list.cAssign ?? false,
            cRemind: this.editable_list.cRemind ?? false,
            cStatusChange: this.editable_list.cStatusChange ?? false
          },
          nPriority: this.editable_list.nPriority,
          nStatus: this.editable_list.nStatus,
          nProgress: this.editable_list.nProgress,
          // jTimeline: this.editable_list.jTimeline,
          jTimeline: {
            dStartDt: this.editable_list.dStartDt ? (0, import_moment.default)(this.editable_list.dStartDt).format("YYYY-MM-DD") : (0, import_moment.default)(/* @__PURE__ */ new Date()).format("YYYY-MM-DD"),
            dEndDt: this.editable_list.dEndDt ? (0, import_moment.default)(this.editable_list.dEndDt).format("YYYY-MM-DD") : (0, import_moment.default)(/* @__PURE__ */ new Date()).format("YYYY-MM-DD")
          },
          cTasktype: this.editable_list.cTasktype,
          jUsers: users
        });
        if (res[2].length) {
          this.isReminder = true;
          this.dReminderDt = res[2][0].dReminderDt;
        }
        this.frm.valueChanges.subscribe((formValues) => {
          console.log("Form changed:", formValues);
          this.isFrmChanged = true;
        });
      } catch (error) {
      }
      this.cdr.detectChanges();
    });
  }
  onTimeChange(e, column) {
    this.frm.get("jDate").patchValue({ [column]: e });
  }
  removeRm(index) {
    this.reminders_list.splice(index, 1);
  }
  onsubmit() {
    return __async(this, null, function* () {
      try {
        this.formsubmit = true;
        this.isLoading = true;
        if (this.frm?.value?.permission == "E" && !this.can_edit_all && this.can_edit_status) {
          this.updateStatus();
          return;
        }
        if (this.frm.invalid) {
          this.isLoading = false;
          return;
        }
        var model = {};
        model = __spreadValues({}, this.frm.value);
        console.log("model1", model);
        model.nCaseid = this.nCaseid;
        model.jUsers = this.convToStr(this.userList.filter((e) => e.isSelected).map((a) => {
          return {
            nUserid: a.nUserid,
            bCanComment: a.bCanComment,
            bCanCopy: a.bCanCopy,
            bCanEdit: a.bCanEdit,
            bCanReshare: a.bCanReshare
          };
        }));
        model.jEmailnotify = this.convToStr(model.jEmailnotify);
        model.jTimeline = this.convToStr(model.jTimeline);
        if (this.isReminder) {
          model.dReminderDt = this.dReminderDt;
        }
        let res = yield this.task.taskBuilder_v2(model);
        this.isLoading = false;
        if (res["msg"] == 1) {
          res["isNew"] = true;
          if (this.dialogRef) {
            this.dialogRef.close(res["nTaskid"]);
          } else {
            this.taskForm.emit({ event: "SUBMIT", data: res });
          }
        } else {
          this.tost.openSnackBar(res["value1"], "E");
        }
      } catch (error) {
        this.isLoading = false;
        this.tost.openSnackBar(error.message, "E");
      }
    });
  }
  convToStr(val) {
    return JSON.stringify(val);
  }
  updateStatus() {
    return __async(this, null, function* () {
      var model = {};
      model.nTaskid = this.frm.value.nTaskid;
      model.nStatus = this.frm.value.nStatus;
      model.nProgress = this.frm.value.nProgress;
      const res = yield this.task.taskUpdateStatus(model);
      this.isLoading = false;
      if (res["msg"] == 1) {
        if (this.dialogRef) {
          this.dialogRef.close(res["nTaskid"]);
        } else {
          this.taskForm.emit({ event: "SUBMIT", data: res });
        }
      } else {
        this.tost.openSnackBar(res["value1"], "E");
      }
    });
  }
  back() {
    if (this.dialogRef) {
      this.dialogRef.close(true);
    } else {
      this.OnEvent.emit({ event: "CLOSE", data: null });
    }
  }
  delete() {
    this.task.deleteTask({ nTaskid: this.frm.value.nTaskid }).then((res) => {
      if (res[0]["msg"] == 1) {
        this.back();
        this.taskForm.emit({ event: "DELETE", data: this.frm.value.nTaskid });
        this.tost.openSnackBar(res[0]["value"], "");
      } else {
        this.tost.openSnackBar(res[0]["value"], "E");
      }
    });
  }
  manage_reminder(flag, ind) {
    if (!this.frm.value.jTimeline.dStart || this.frm.value.jTimeline.dStart == "" || !this.frm.value.jTimeline.dEnd || this.frm.value.jTimeline.dEnd == "") {
      return;
    }
    this.getDateDiff();
    try {
      if (flag == "A") {
        var id = this.get_maxid(this.reminders_list, "id");
        var d = /* @__PURE__ */ new Date();
        var hour = d.getHours() > 12 ? "0" + d.getHours() % 12 : d.getHours();
        var ampm = d.getHours() >= 12 ? "PM" : "AM";
        console.log(hour, d.getHours());
        this.reminders_list.push({
          id,
          nm: "T",
          value: 1,
          time: d.getHours() + ":" + (d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes()),
          tType: ampm
        });
        this.reminderExists(this.reminders_list[this.reminders_list.length - 1]);
      } else {
        this.reminders_list.splice(ind, 1);
      }
    } catch (error) {
    }
  }
  getDateDiff() {
    var d1 = new Date(this.frm.value.jTimeline.dStartDt);
    var d2 = new Date(this.frm.value.jTimeline.dEndDt);
    var diff = d2.getTime() - d1.getTime();
    this.dayDiff = diff / (1e3 * 60 * 60 * 24);
    this.dayDiff = parseInt(this.dayDiff);
  }
  reminderExists(rm) {
    var list = [];
    this.reminders_list.map((e) => e.error = false);
    if (rm.nm == "day" || rm.nm == "week") {
      list = this.reminders_list.filter((e) => rm.nm == e.nm && rm.value == e.value);
    }
    if (rm.nm == "time") {
      list = this.reminders_list.filter((e) => rm.nm == e.nm && rm.time == e.time && rm.tType == e.tType);
    }
    this.reminders_list.map((e) => {
      if (e.nm == "week" && parseInt(e.value) > this.dayDiff / 7) {
        e.error = true;
      }
      ;
      if (e.nm == "day" && parseInt(e.value) > this.dayDiff) {
        e.error = true;
      }
    });
    if (list.length > 1) {
      list.map((e, index) => {
        if (index > 0) {
          e.error = true;
        }
      });
    }
  }
  get_maxid(array, tg) {
    try {
      var mx_id = 0;
      if (array && array.length) {
        for (var i = 0; array.length > i; i++) {
          if (array[i][tg] > mx_id) {
            mx_id = array[i][tg];
          }
        }
      }
    } catch (error) {
    }
    return mx_id + 1;
  }
  getDaysBetweenDates(date1, date2) {
    const startDate = new Date(date1);
    const endDate = new Date(date2);
    const timeDifference = endDate.getTime() - startDate.getTime();
    const daysDifference = timeDifference / (1e3 * 3600 * 24);
    return daysDifference;
  }
  selectedDate(range) {
    try {
      if (!range || !range[1] || range.length < 2) {
        throw new Error("Invalid date range");
      }
      const startDate = new Date(range[0]);
      const endDate = new Date(range[1]);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date values");
      }
      const mn1 = startDate.toLocaleString("default", { month: "short" });
      const mn2 = endDate.toLocaleString("default", { month: "short" });
      const dt1 = startDate.getDate();
      const dt2 = endDate.getDate();
      const val = `${mn1} ${dt1} - ${mn1 !== mn2 ? mn2 + " " : ""}${dt2}`;
      const pg = this.common.get_dts(startDate, endDate);
      const dayes = this.getDaysBetweenDates(startDate, endDate);
      const jTimelineGroup = this.frm.get("jTimeline");
      jTimelineGroup.patchValue({
        dStartDt: startDate,
        dEndDt: endDate,
        time_prges: pg,
        show_tm: val,
        days: dayes || 0
      });
      console.log("Selected Date Range:", val);
      this.getDateDiff();
      if (this.reminders_list.length) {
        this.reminders_list.forEach((e) => {
          this.reminderExists(e);
        });
      }
    } catch (error) {
      console.error("Error in selectedDate:", error);
    }
  }
  ondateRangeClosed() {
    try {
      const jTimelineGroup = this.frm.get("jTimeline");
      if (!jTimelineGroup)
        return;
      const startDate = jTimelineGroup.value?.dStartDt;
      const endDate = jTimelineGroup.value?.dEndDt;
      if (!startDate || !endDate) {
        throw new Error("Invalid date range");
      }
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date values");
      }
      jTimelineGroup.patchValue({
        dStartDt: (0, import_moment.default)(startDate).format("YYYY-MM-DD"),
        dEndDt: (0, import_moment.default)(endDate).format("YYYY-MM-DD")
      });
      this.getDateDiff();
      if (this.reminders_list.length) {
        this.reminders_list.forEach((e) => {
          this.reminderExists(e);
        });
      }
      this.isFrmChanged = true;
      console.log("jTimeline changed values:", this.frm.value.jTimeline);
    } catch (error) {
      console.error("Error in selectedDate:", error);
    }
  }
  onDateChange(ev) {
    try {
      this.dReminderDt = ev;
    } catch (error) {
    }
  }
  markSelectedUsers(users, selectedUsers) {
    users.forEach((user) => {
      const matched = selectedUsers?.find((sel) => sel.nUserid === user.nUserid);
      if (matched) {
        user.isSelected = true;
        user.bCanComment = matched.bCanComment;
        user.bCanCopy = matched.bCanCopy;
        user.bCanEdit = matched.bCanEdit;
        user.bCanReshare = matched.bCanReshare;
      } else {
        user.isSelected = false;
      }
    });
    this.userList = [...users];
  }
  static {
    this.\u0275fac = function TaskFormComponent_Factory(t) {
      return new (t || _TaskFormComponent)(\u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(MatDialogRef, 8), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(TaskService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TaskFormComponent, selectors: [["task-form"]], viewQuery: function TaskFormComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.dateRnage = _t.first);
      }
    }, inputs: { isfullview: "isfullview", nCaseid: "nCaseid", cPermission: "cPermission", editable_list: "editable_list", isFiletask: "isFiletask" }, outputs: { taskForm: "taskForm", OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275ProvidersFeature([provideNativeDateAdapter()]), \u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [["slider", ""], ["picker", ""], ["update", "matMenu"], ["end", "matMenu"], [1, "flex", "items-center", "justify-center"], [1, "animate-spin", "rounded-full", "h-5", "w-5", "border-t-2", "border-b-2", "border-blue-500"], [1, "addnewcontact", "flex", "flex-col", "error", "p-5", "h-full", 3, "formGroup", "hidden"], [1, "text-lg", "font-semibold", "items-center", "gap-2", "flex", "mb-2.5", "min-h-8.5"], [1, "inputs", "min-h-fit", "h-full", "flex", "flex-col"], [1, "w-full", "flex", "flex-col", "gap-2", 3, "ngClass"], ["for", "subject", 3, "ngClass"], [1, "text-xs", "mb-2", "font-semibold"], [1, "valid-star"], ["rows", "1", "formControlName", "cSubject", "type", "text", "id", "subject", "placeholder", "Max. 500 words", "maxlength", "100", 1, "style", "resize-none", 3, "ngClass"], [4, "ngFor", "ngForOf"], ["for", "cDesc", 3, "ngClass"], ["formControlName", "cDesc", "type", "text", "id", "cDesc", "placeholder", "Write a description for this task", "maxlength", "500", 1, "style", "resize-none", 3, "ngClass"], [1, "mt-2.5"], ["title", "Assignee", "required", "", "count", "", 3, "userListChange", "nCaseid", "userList", "disablePermissions", "adminPDisabled"], [1, "flex", "items-start", "gap-2", "mt-2.5"], ["for", "nStatus", 1, "col-span-4", "!mb-0", "w-1/3"], ["formControlName", "nStatus", "id", "nStatus", "placeholder", "Select..", 1, "w-full", "!border", "!rounded-base"], [3, "value"], ["for", "nPriority", 1, "col-span-4", "!mb-0", "w-1/3"], ["formControlName", "nPriority", "id", "nPriority", "placeholder", "Select..", 1, "w-full", "!border", "!rounded-base"], [3, "value", 4, "ngFor", "ngForOf"], ["for", "", 1, "col-span-4", "!mb-0", "w-1/3"], [1, "flex", "flex-col", "gap-1"], [1, "w-full", "progressslider", 2, "--mdc-slider-inactive-track-height", "5px", "--mdc-slider-active-track-height", "5px", 3, "disableRipple", "max"], ["matSliderThumb", "", "formControlName", "nProgress"], [1, "text-xs", "block", "mx-auto"], [1, "p-2", "bg-reply", "mt-2.5"], [1, "text-xs", "font-semibold", "mb-1"], ["formGroupName", "jTimeline", "for", "jTimeline", 1, "col-span-4", "!mb-0", "w-full"], [1, "relative", "flex", "gap-2.5", "cust-daterangepicker", "w-full"], [1, "flex", "relative", "w-full"], [1, "absolute", "left-3", "text-xs", "top-1/2", "-translate-y-1/2", "z-10", "mt-px"], [3, "rangePicker", "min"], ["matStartDate", "", "formControlName", "dStartDt", "placeholder", " Type/pick date", 1, "main-input", "focus:shadow-none"], ["matEndDate", "", "formControlName", "dEndDt", "placeholder", " Type/pick date", 1, "main-input", "focus:shadow-none"], [1, "absolute", "left-1/2", "translate-x-6", "text-xs", "top-1/2", "-translate-y-1/2", "z-10", "mt-px"], ["square", "", "mode", "outlined"], ["matIconSuffix", "", 3, "for"], [3, "closed"], [1, "flex", "items-center", "gap-2.5", "mt-2.5"], [3, "ngModelChange", "ngModel", "ngModelOptions"], [3, "date"], [1, "my-2.5"], ["formGroupName", "jEmailnotify", 1, "flex", "items-center", "gap-3"], ["formControlName", "cAssign", 1, "text-xs"], ["formControlName", "cRemind", 1, "text-xs"], ["formControlName", "cStatusChange", 1, "text-xs"], [1, "flex", "gap-3", "mt-auto", "mb-3"], ["name", "chvy", 1, "mt-px", "text-xs", "me-2", 3, "click"], ["class", "validators-required validation-required validation", 4, "ngIf"], [1, "validators-required", "validation-required", "validation"], [1, "flex", "gap-2", "items-center"], ["name", "temp", "type", "extra", 3, "ngClass"], [3, "dateChange", "date"], ["addcls", "w-full", 1, "w-full", 3, "disabled"], ["addcls", "w-full", 1, "w-full", 3, "click", "disabled"], ["addcls", "w-full", 1, "w-full", 3, "matMenuTriggerFor", "disabled"], ["xPosition", "after", 1, "!bg-black", "p-5", "mb-1.5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click"], ["mode", "dark"], ["addcls", "w-full", "mode", "outlined", 1, "w-full", 3, "matMenuTriggerFor"]], template: function TaskFormComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, TaskFormComponent_Conditional_0_Template, 2, 0, "div", 4)(1, TaskFormComponent_Conditional_1_Template, 79, 58);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.isLoading ? 0 : 1);
      }
    }, dependencies: [
      CommonModule,
      NgClass,
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
      FormGroupName,
      MatFormFieldModule,
      MatError,
      MatSuffix,
      MatSelectModule,
      MatSelect,
      MatOption,
      ButtonComponent,
      MatCheckboxModule,
      MatCheckbox,
      MatSliderModule,
      MatSlider,
      MatSliderThumb,
      MatRadioModule,
      MatNativeDateModule,
      MatDatepickerModule,
      MatDatepickerToggle,
      MatDateRangeInput,
      MatStartDate,
      MatEndDate,
      MatDateRangePicker,
      MatInputModule,
      MatMenuModule,
      MatMenu,
      MatMenuTrigger,
      MatTooltipModule,
      TeamshareComponent,
      DatetimeComponent
    ], styles: ["\n\n.valid-star[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: red;\n}\nlabel[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 24px;\n}\n.dsbl[_ngcontent-%COMP%] {\n  opacity: 0.5 !important;\n  pointer-events: none !important;\n}\n/*# sourceMappingURL=task-form.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TaskFormComponent, { className: "TaskFormComponent", filePath: "src\\app\\shared\\components\\tasks\\task-form\\task-form.component.ts", lineNumber: 45 });
})();

export {
  TaskFormComponent
};
//# sourceMappingURL=chunk-JMA5RSND.js.map
