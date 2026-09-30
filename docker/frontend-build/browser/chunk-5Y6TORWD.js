import {
  TaskFormComponent
} from "./chunk-JMA5RSND.js";
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
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  DatePipe,
  NgClass,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  InputFlags,
  booleanAttribute,
  ɵsetClassDebugInfo,
  ɵɵInputTransformsFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
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
  ɵɵpipeBind2,
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
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/tasks/selected-tasks/selected-tasks.component.ts
var _forTrack0 = ($index, $item) => $item.nContactid;
var _c0 = (a0) => ({ "shadow-base": a0 });
var _c1 = (a0, a1, a2, a3) => ({ "text-red-500": a0, "text-yellow-400": a1, "text-gray-400": a2, "text-green-400": a3 });
var _c2 = (a0) => ({ "width": a0 });
var _c3 = (a0) => ({ "!-me-3": a0 });
var _c4 = (a0) => ({ "ms-auto": a0 });
function SelectedTasksComponent_For_2_Conditional_2_Conditional_2_For_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "avtr", 21);
  }
  if (rf & 2) {
    const y_r1 = \u0275\u0275nextContext().$implicit;
    const x_r2 = \u0275\u0275nextContext(3).$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c3, (x_r2 == null ? null : x_r2.teamlist == null ? null : x_r2.teamlist.length) > 3))("detail", y_r1)("matTooltip", y_r1.cFname + " " + y_r1.cLname);
  }
}
function SelectedTasksComponent_For_2_Conditional_2_Conditional_2_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, SelectedTasksComponent_For_2_Conditional_2_Conditional_2_For_2_Conditional_0_Template, 1, 5, "avtr", 21);
  }
  if (rf & 2) {
    const $index_r3 = ctx.$index;
    \u0275\u0275conditional(0, $index_r3 < 3 ? 0 : -1);
  }
}
function SelectedTasksComponent_For_2_Conditional_2_Conditional_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 20);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext(3).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" +", (x_r2.teamlist == null ? null : x_r2.teamlist.length) - 4, " ");
  }
}
function SelectedTasksComponent_For_2_Conditional_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 19);
    \u0275\u0275repeaterCreate(1, SelectedTasksComponent_For_2_Conditional_2_Conditional_2_For_2_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(3, SelectedTasksComponent_For_2_Conditional_2_Conditional_2_Conditional_3_Template, 2, 1, "div", 20);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275repeater(x_r2.teamlist);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, (x_r2.teamlist == null ? null : x_r2.teamlist.length) > 4 ? 3 : -1);
  }
}
function SelectedTasksComponent_For_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275template(2, SelectedTasksComponent_For_2_Conditional_2_Conditional_2_Template, 4, 1, "div", 19);
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r2.cSubject);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, (x_r2 == null ? null : x_r2.teamlist == null ? null : x_r2.teamlist.length) ? 2 : -1);
  }
}
function SelectedTasksComponent_For_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 22);
    \u0275\u0275listener("click", function SelectedTasksComponent_For_2_Conditional_3_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      return \u0275\u0275resetView(x_r2.editask = true);
    });
    \u0275\u0275element(1, "icon", 23);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("square", true)("ngClass", \u0275\u0275pureFunction1(2, _c4, !(x_r2 == null ? null : x_r2.teamlist == null ? null : x_r2.teamlist.length)));
  }
}
function SelectedTasksComponent_For_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 24);
    \u0275\u0275listener("click", function SelectedTasksComponent_For_2_Conditional_4_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r5 = \u0275\u0275nextContext();
      const x_r2 = ctx_r5.$implicit;
      const $index_r7 = ctx_r5.$index;
      const ctx_r7 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r7.removeTask(x_r2, $index_r7));
    });
    \u0275\u0275element(1, "icon", 25);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(2, _c4, !(x_r2 == null ? null : x_r2.teamlist == null ? null : x_r2.teamlist.length)))("square", true);
  }
}
function SelectedTasksComponent_For_2_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "btn", 26);
    \u0275\u0275listener("click", function SelectedTasksComponent_For_2_Conditional_5_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r5 = \u0275\u0275nextContext();
      const x_r2 = ctx_r5.$implicit;
      const $index_r7 = ctx_r5.$index;
      const ctx_r7 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r7.removeTask(x_r2, $index_r7));
    });
    \u0275\u0275element(2, "icon", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "btn", 26);
    \u0275\u0275listener("click", function SelectedTasksComponent_For_2_Conditional_5_Template_btn_click_3_listener() {
      \u0275\u0275restoreView(_r9);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r7 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r7.edit(x_r2));
    });
    \u0275\u0275element(4, "icon", 27);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "icon", 28);
    \u0275\u0275listener("click", function SelectedTasksComponent_For_2_Conditional_5_Template_icon_click_5_listener() {
      \u0275\u0275restoreView(_r9);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      return \u0275\u0275resetView(x_r2.editask = false);
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("square", true);
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true);
  }
}
function SelectedTasksComponent_For_2_Conditional_31_Conditional_3_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 30);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r10 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", r_r10.value, " ", r_r10.nm == "D" ? "Day" : r_r10.nm == "W" ? "Week" : "", " ");
  }
}
function SelectedTasksComponent_For_2_Conditional_31_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, SelectedTasksComponent_For_2_Conditional_31_Conditional_3_For_1_Template, 2, 2, "span", 30, \u0275\u0275repeaterTrackByIndex);
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275repeater(x_r2.jReminders);
  }
}
function SelectedTasksComponent_For_2_Conditional_31_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 31);
    \u0275\u0275text(1, "No Reminders");
    \u0275\u0275elementEnd();
  }
}
function SelectedTasksComponent_For_2_Conditional_31_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16)(1, "span", 29);
    \u0275\u0275text(2, "Reminder");
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, SelectedTasksComponent_For_2_Conditional_31_Conditional_3_Template, 2, 0)(4, SelectedTasksComponent_For_2_Conditional_31_Conditional_4_Template, 2, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275conditional(3, (x_r2.jReminders == null ? null : x_r2.jReminders.length) ? 3 : 4);
  }
}
function SelectedTasksComponent_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
    \u0275\u0275template(2, SelectedTasksComponent_For_2_Conditional_2_Template, 3, 2)(3, SelectedTasksComponent_For_2_Conditional_3_Template, 2, 4, "btn", 2)(4, SelectedTasksComponent_For_2_Conditional_4_Template, 2, 4, "btn", 3)(5, SelectedTasksComponent_For_2_Conditional_5_Template, 6, 2, "div", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 5)(7, "div", 6)(8, "h6");
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "div", 7)(11, "div", 8)(12, "span", 9);
    \u0275\u0275text(13, "Priority");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "div", 10);
    \u0275\u0275text(15);
    \u0275\u0275element(16, "icon", 11);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(17, "div", 12)(18, "span", 9);
    \u0275\u0275text(19, "Progress");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "h5", 13)(21, "b", 14);
    \u0275\u0275element(22, "span", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275text(23);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(24, "div", 16)(25, "span", 9);
    \u0275\u0275text(26, "Timeline");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "h5", 17);
    \u0275\u0275text(28);
    \u0275\u0275pipe(29, "date");
    \u0275\u0275pipe(30, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(31, SelectedTasksComponent_For_2_Conditional_31_Template, 5, 1, "div", 16);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    const ctx_r7 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(19, _c0, ctx_r7.hasshadow));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, !x_r2.editask ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r7.canedit && !x_r2.editask ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(4, ctx_r7.canDelete ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(5, x_r2.editask ? 5 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(x_r2.cDesc);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" ", x_r2.cPriority, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction4(21, _c1, x_r2.nPriority == 1, x_r2.nPriority == 2, x_r2.nPriority == 4, x_r2.nPriority == 3));
    \u0275\u0275advance(6);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(26, _c2, x_r2.nProgress + "%"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r2.nProgress, "% ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate2(" ", \u0275\u0275pipeBind2(29, 13, (x_r2.jTimeline == null ? null : x_r2.jTimeline.dStartDt) || (x_r2 == null ? null : x_r2.dStartDt), "dd/MM/yyyy"), " - ", \u0275\u0275pipeBind2(30, 16, (x_r2.jTimeline == null ? null : x_r2.jTimeline.dEndDt) || (x_r2 == null ? null : x_r2.dEndDt), "dd/MM/yyyy"), "");
    \u0275\u0275advance(3);
    \u0275\u0275conditional(31, ctx_r7.showreminder ? 31 : -1);
  }
}
var SelectedTasksComponent = class _SelectedTasksComponent {
  constructor(dialog) {
    this.dialog = dialog;
    this.canedit = false;
    this.showreminder = false;
    this.hasshadow = false;
    this.ismyfiles = false;
    this.canDelete = false;
    this.editask = false;
    this.OnEvent = new EventEmitter();
    this.isGrid = false;
  }
  ngOnInit() {
    console.log(this.selectedTasks);
  }
  removeTask(x, ind) {
    this.selectedTasks.splice(ind, 1);
    this.OnEvent.emit({ event: "DELETE", data: { nTaskid: x.nTaskid } });
  }
  edit(x) {
    this.dialogRef = this.dialog.open(TaskFormComponent, {
      width: !this.ismyfiles ? "420px" : "436px",
      height: !this.ismyfiles ? "calc(100vh - 56px)" : "calc(100% - 220px)",
      position: !this.ismyfiles ? { right: "0vh", top: "56px" } : { right: "24px", top: "200px" },
      hasBackdrop: false,
      panelClass: "noshadow"
      // data: {nCaseid:this.nCaseid}
    });
    this.dialogRef.componentInstance.nCaseid = this.nCaseid;
    this.dialogRef.componentInstance.editable_list = x;
    this.dialogRef.afterClosed().subscribe((result) => {
      this.dialogRef = null;
      if (result) {
        this.OnEvent.emit({ event: "RELOAD", data: { nTaskid: x.nTaskid } });
      }
    });
  }
  static {
    this.\u0275fac = function SelectedTasksComponent_Factory(t) {
      return new (t || _SelectedTasksComponent)(\u0275\u0275directiveInject(MatDialog));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SelectedTasksComponent, selectors: [["selected-tasks"]], inputs: { selectedTasks: "selectedTasks", canedit: "canedit", showreminder: [InputFlags.HasDecoratorInputTransform, "showreminder", "showreminder", booleanAttribute], hasshadow: "hasshadow", nCaseid: "nCaseid", ismyfiles: "ismyfiles", canDelete: "canDelete", isGrid: "isGrid" }, outputs: { OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275InputTransformsFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 2, consts: [[1, "height-fit", "rounded-base", "overflow-hidden", "mb-3", 3, "ngClass"], [1, "flex", "text-xs", "bg-grey", "text-white", "px-2.5", "h-[45px]", "items-center", "whitespace-nowrap", "mt-0", "group"], ["mode", "outlined", "addcls", "hidden group-hover:flex hover:bg-white", 1, "ms-2", 3, "square", "ngClass"], ["mode", "outlined", "addcls", "!bg-transparent !text-white !border-white", 1, "hidden", "group-hover:flex", "ms-2", 3, "ngClass", "square"], [1, "flex", "items-center", "gap-3", "w-full", "justify-end"], [1, "p-2.5", "bg-white"], [1, "text-xs", "border", "rounded-base", "p-2", "mb-3"], [1, "flex", "items-baseline", "p-2.5", "justify-between", "bg-faint", "rounded-base", "gap-2.5", "text-xs"], [1, "left", "flex", "flex-col", "gap-1"], [1, "font-semibold"], [1, "flex", "gap-2", "items-center"], ["name", "temp", "type", "extra", 1, "text-sm", 3, "ngClass"], [1, "midleft"], [1, "mt-2", "text-xxs", "font-semibold", "flex", "items-center", "flex-col"], [1, "min-h-2", "flex", "w-full", "bg-tab", "rounded-lg"], [1, "bg-blue-on", "h-[8px]", "rounded-full", 3, "ngStyle"], [1, "midright"], [1, "mt-2", "px-1.5", "py-0.5", "rounded-full", "bg-grey", "text-white", "text-xxs"], [1, "line-clamp", 2, "--line-clamp", "1"], [1, "scont", "small", "ms-auto", "flex", "gap-1", "flex-row"], [1, "grid", "place-items-center", "rounded-full", "size-6", "bg-white", "text-gray-500"], ["size", "sm", 1, "block", "cursor-pointer", "last:!me-0", 3, "ngClass", "detail", "matTooltip"], ["mode", "outlined", "addcls", "hidden group-hover:flex hover:bg-white", 1, "ms-2", 3, "click", "square", "ngClass"], ["name", "menu"], ["mode", "outlined", "addcls", "!bg-transparent !text-white !border-white", 1, "hidden", "group-hover:flex", "ms-2", 3, "click", "ngClass", "square"], ["name", "removefill"], ["mode", "outlined", "addcls", "!bg-transparent !text-white !border-white", 3, "click", "square"], ["name", "edit"], ["name", "close", 1, "text-xs", "mx-2", 3, "click"], [1, "font-semibold", "mb-2"], [1, "block", "text-xxs", "mb-0.5"], [1, "block", "text-xxs", "my-1"]], template: function SelectedTasksComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div");
        \u0275\u0275repeaterCreate(1, SelectedTasksComponent_For_2_Template, 32, 28, "div", 0, _forTrack0);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275classMap(ctx.isGrid ? "grid grid-cols-2 gap-2.5" : "");
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.selectedTasks);
      }
    }, dependencies: [AvatarComponent, MatTooltipModule, MatTooltip, CommonModule, NgClass, NgStyle, DatePipe, ButtonComponent, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SelectedTasksComponent, { className: "SelectedTasksComponent", filePath: "src\\app\\shared\\components\\tasks\\selected-tasks\\selected-tasks.component.ts", lineNumber: 19 });
})();

export {
  SelectedTasksComponent
};
//# sourceMappingURL=chunk-5Y6TORWD.js.map
