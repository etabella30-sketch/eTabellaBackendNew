import {
  TaskFormComponent
} from "./chunk-JMA5RSND.js";
import {
  TaskService
} from "./chunk-PDZ7367Z.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  MatSelect,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField
} from "./chunk-Y2GGPNYR.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatDialog
} from "./chunk-UVEQGFJV.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
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
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferOnViewport,
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
  ɵɵpureFunction4,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
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

// src/app/shared/components/tasks/choose-task/choose-task.component.ts
var _forTrack0 = ($index, $item) => $item.nTaskid;
var ChooseTaskComponent_Defer_12_DepsFn = () => [ButtonComponent, IconComponent];
var _c0 = (a0) => ({ "!p-0": a0 });
var _c1 = (a0, a1, a2, a3) => ({ "text-red-500": a0, "text-yellow-400": a1, "text-gray-400": a2, "text-green-400": a3 });
var _c2 = (a0) => ({ "width": a0 });
var _c3 = (a0) => ({ "!-me-3": a0 });
function ChooseTaskComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" ", ctx_r0.choosedtask == null ? null : ctx_r0.choosedtask.cSubject, " ");
  }
}
function ChooseTaskComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Choose Task ");
  }
}
function ChooseTaskComponent_For_9_For_7_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "avtr", 22);
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    const y_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c3, (y_r3 == null ? null : y_r3.teamlist == null ? null : y_r3.teamlist.length) > 3))("detail", x_r2)("matTooltip", x_r2.cFname + " " + x_r2.cLname);
  }
}
function ChooseTaskComponent_For_9_For_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ChooseTaskComponent_For_9_For_7_Conditional_0_Template, 1, 5, "avtr", 22);
  }
  if (rf & 2) {
    const $index_r4 = ctx.$index;
    \u0275\u0275conditional(0, $index_r4 < 3 ? 0 : -1);
  }
}
function ChooseTaskComponent_For_9_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const y_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" +", (y_r3.teamlist == null ? null : y_r3.teamlist.length) - 4, " ");
  }
}
function ChooseTaskComponent_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 4)(1, "div", 6)(2, "h6", 7)(3, "span", 8);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 9);
    \u0275\u0275repeaterCreate(6, ChooseTaskComponent_For_9_For_7_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(8, ChooseTaskComponent_For_9_Conditional_8_Template, 2, 1, "div", 10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 11)(10, "div", 12)(11, "div", 13)(12, "span", 14);
    \u0275\u0275text(13, "Priority");
    \u0275\u0275elementEnd();
    \u0275\u0275element(14, "icon", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "div", 16)(16, "span", 14);
    \u0275\u0275text(17, "Progress");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "h5", 17)(19, "b", 18);
    \u0275\u0275element(20, "span", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275text(21);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(22, "div", 20)(23, "span", 14);
    \u0275\u0275text(24, "Timeline");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "h5", 21);
    \u0275\u0275text(26);
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const y_r3 = ctx.$implicit;
    \u0275\u0275property("value", y_r3.nTaskid);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(y_r3.cSubject);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(y_r3.teamlist);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(8, (y_r3.teamlist == null ? null : y_r3.teamlist.length) > 4 ? 8 : -1);
    \u0275\u0275advance(6);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction4(7, _c1, y_r3.nPriority == 1, y_r3.nPriority == 2, y_r3.nPriority == 4, y_r3.nPriority == 3));
    \u0275\u0275advance(6);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(12, _c2, y_r3.nProgress + "%"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", y_r3.nProgress, "% ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(y_r3.jTimeline == null ? null : y_r3.jTimeline.show_tm);
  }
}
function ChooseTaskComponent_Defer_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 23);
    \u0275\u0275listener("click", function ChooseTaskComponent_Defer_10_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.addTask("E"));
    });
    \u0275\u0275element(1, "icon", 24);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "btn", 25);
    \u0275\u0275listener("click", function ChooseTaskComponent_Defer_10_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.addTask("N"));
    });
    \u0275\u0275element(3, "icon", 26);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("disabled", !ctx_r0.nTaskid)("square", true);
    \u0275\u0275attribute("isdisabled", !ctx_r0.nTaskid);
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true);
  }
}
function ChooseTaskComponent_DeferPlaceholder_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
var ChooseTaskComponent = class _ChooseTaskComponent {
  constructor(taskS, cdr, dialog, tost, common) {
    this.taskS = taskS;
    this.cdr = cdr;
    this.dialog = dialog;
    this.tost = tost;
    this.common = common;
    this.ismyfiles = false;
    this.changeTask = new EventEmitter();
    this.taskList = [];
    this.nTaskid = null;
    this.isLoading = true;
    this.isSuccess = false;
    this.nopadding = false;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.taskList = yield this.taskS.getTaskList(this.nCaseid, this.ismyfiles ? "F" : "FT");
      this.taskList[0].map((a) => {
        var user = this.taskList[1].filter((b) => b.nTaskid == a.nTaskid);
        a["teamlist"] = user ? user : [];
      });
      console.log(this.taskList[0]);
      if (this.nTaskid) {
        this.selectedTask();
        if (this.selectedTasks && this.selectedTasks.length > 0) {
          const ind = this.selectedTasks.findIndex((a) => a.nTaskid == this.choosedtask.nTaskid);
          this.selectedTasks.splice(ind, 1);
          this.selectedTasks.unshift(this.choosedtask);
        }
      }
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }
  selectedTask() {
    this.choosedtask = this.taskList[0].find((a) => a.nTaskid == this.nTaskid);
    console.log(this.choosedtask);
    this.cdr.detectChanges();
  }
  addTask(flag) {
    if (this.dialogRef)
      return;
    this.dialogRef = this.dialog.open(TaskFormComponent, {
      maxWidth: "600px",
      // height: 'calc(100% - 220px)',
      width: !this.ismyfiles ? "440px" : "calc(var(--rightpanelwidth) + 16px)",
      height: !this.ismyfiles ? "calc(100vh - 56px)" : "calc(100% - 220px)",
      position: !this.ismyfiles ? { right: "0vh", top: "56px" } : { right: "24px", top: "200px" },
      hasBackdrop: false,
      panelClass: "noshadow"
      // data: {nCaseid:this.nCaseid}
    });
    this.dialogRef.componentInstance.nCaseid = this.nCaseid;
    this.dialogRef.componentInstance.ismyfiles = this.ismyfiles;
    if (flag == "E") {
      this.dialogRef.componentInstance.editable_list = this.choosedtask;
    }
    this.dialogRef.afterClosed().subscribe((result) => {
      this.dialogRef = null;
      if (result) {
        this.nTaskid = result;
        this.isLoading = true;
        this.ngOnInit();
      }
    });
  }
  SaveTask() {
    if (!this.choosedtask)
      return;
    const ind = this.selectedTasks.findIndex((a) => a.nTaskid == this.choosedtask.nTaskid);
    if (ind == -1) {
      this.selectedTasks.unshift(this.choosedtask);
      this.choosedtask = null;
      this.nTaskid = null;
    } else {
      this.tost.openSnackBar("Task already added", "E");
    }
    this.cdr.detectChanges();
    this.changeTask.emit("SUBMIT");
  }
  view() {
    this.changeTask.emit("VIEW");
  }
  static {
    this.\u0275fac = function ChooseTaskComponent_Factory(t) {
      return new (t || _ChooseTaskComponent)(\u0275\u0275directiveInject(TaskService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(CommonService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ChooseTaskComponent, selectors: [["choose-task"]], inputs: { selectedTasks: "selectedTasks", nCaseid: "nCaseid", ismyfiles: "ismyfiles", isSuccess: "isSuccess", nopadding: "nopadding" }, outputs: { changeTask: "changeTask" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 16, vars: 7, consts: [[1, "p-5", 3, "ngClass"], [1, "flex", "gap-2", "w-full"], [1, "w-full"], ["placeholder", "Choose task", 1, "!border-none", 3, "ngModelChange", "selectionChange", "disabled", "ngModel"], [1, "group", "nocheck", "!bg-faint", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "w-full", "mt-6", 3, "click"], [1, "height-fit", "rounded-base", "overflow-hidden"], [1, "flex", "text-xs", "bg-grey", "text-white", "px-2.5", "h-[45px]", "items-center", "whitespace-nowrap", "mt-0"], [1, "line-clamp", 2, "--line-clamp", "1"], [1, "scont", "small", "ms-auto", "flex", "gap-1", "flex-row"], [1, "grid", "place-items-center", "rounded-full", "size-6", "bg-white", "text-gray-500"], [1, "p-2.5", "bg-white"], [1, "h-[68px]", "flex", "items-baseline", "p-2.5", "justify-between", "bg-faint", "rounded-base", "gap-2.5", "text-xs"], [1, "left", "flex", "flex-col", "gap-1", "items-center"], [1, "font-semibold"], ["name", "temp", "type", "extra", 1, "text-base", 3, "ngClass"], [1, "midleft"], [1, "mt-2", "text-xxs", "font-semibold", "flex", "items-center", "flex-col"], [1, "min-h-2", "flex", "w-full", "bg-tab", "rounded-lg"], [1, "bg-blue-on", "h-[8px]", "rounded-full", 3, "ngStyle"], [1, "midright"], [1, "mt-2", "px-1.5", "py-0.5", "rounded-full", "bg-grey", "text-white", "text-xxs"], ["size", "sm", 1, "block", 3, "ngClass", "detail", "matTooltip"], ["mode", "outlined", 3, "click", "disabled", "square"], ["name", "edit"], ["mode", "outlined", 3, "click", "square"], ["name", "addfill"]], template: function ChooseTaskComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "mat-form-field", 2)(3, "mat-select", 3);
        \u0275\u0275twoWayListener("ngModelChange", function ChooseTaskComponent_Template_mat_select_ngModelChange_3_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.nTaskid, $event) || (ctx.nTaskid = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function ChooseTaskComponent_Template_mat_select_selectionChange_3_listener() {
          return ctx.selectedTask();
        });
        \u0275\u0275elementStart(4, "mat-select-trigger")(5, "div");
        \u0275\u0275template(6, ChooseTaskComponent_Conditional_6_Template, 1, 1)(7, ChooseTaskComponent_Conditional_7_Template, 1, 0);
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(8, ChooseTaskComponent_For_9_Template, 27, 14, "mat-option", 4, _forTrack0);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(10, ChooseTaskComponent_Defer_10_Template, 4, 4)(11, ChooseTaskComponent_DeferPlaceholder_11_Template, 1, 0);
        \u0275\u0275defer(12, 10, ChooseTaskComponent_Defer_12_DepsFn, null, 11);
        \u0275\u0275deferOnViewport(0, -1);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "btn", 5);
        \u0275\u0275listener("click", function ChooseTaskComponent_Template_btn_click_14_listener() {
          return ctx.SaveTask();
        });
        \u0275\u0275text(15, " Done ");
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(5, _c0, ctx.nopadding));
        \u0275\u0275advance(3);
        \u0275\u0275property("disabled", !(ctx.taskList[0] == null ? null : ctx.taskList[0].length));
        \u0275\u0275twoWayProperty("ngModel", ctx.nTaskid);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(6, ctx.choosedtask ? 6 : 7);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.taskList[0]);
        \u0275\u0275advance(6);
        \u0275\u0275attribute("isdisabled", !ctx.nTaskid);
      }
    }, dependencies: [CommonModule, NgClass, NgStyle, ButtonComponent, IconComponent, AvatarComponent, MatTooltipModule, MatTooltip, FormsModule, NgControlStatus, NgModel, MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ChooseTaskComponent, { className: "ChooseTaskComponent", filePath: "src\\app\\shared\\components\\tasks\\choose-task\\choose-task.component.ts", lineNumber: 24 });
})();

export {
  ChooseTaskComponent
};
//# sourceMappingURL=chunk-NWOC2E65.js.map
