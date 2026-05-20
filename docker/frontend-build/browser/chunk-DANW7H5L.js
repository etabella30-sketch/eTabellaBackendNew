import {
  PresentsetupService
} from "./chunk-WYIU2ETL.js";
import "./chunk-3B3MCZKM.js";
import "./chunk-42T75ZKA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-EVEACXQX.js";
import {
  DatePipe
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/setup/group/group.component.ts
function GroupComponent_For_5_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 9);
    \u0275\u0275listener("click", function GroupComponent_For_5_Conditional_9_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const x_r3 = \u0275\u0275nextContext().$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.fillDetails(x_r3, false));
    });
    \u0275\u0275text(1, "Detail");
    \u0275\u0275elementEnd();
  }
}
function GroupComponent_For_5_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 10);
    \u0275\u0275listener("click", function GroupComponent_For_5_Conditional_12_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const x_r3 = \u0275\u0275nextContext().$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.fillDetails(x_r3, true));
    });
    \u0275\u0275text(1, "Deselect");
    \u0275\u0275elementEnd();
  }
}
function GroupComponent_For_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 3)(1, "h6", 4);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "h6", 5);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "h6", 5);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 6);
    \u0275\u0275template(9, GroupComponent_For_5_Conditional_9_Template, 2, 0, "btn", 7);
    \u0275\u0275elementStart(10, "btn", 8);
    \u0275\u0275listener("click", function GroupComponent_For_5_Template_btn_click_10_listener() {
      const x_r3 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.applyPresetation(x_r3));
    });
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275template(12, GroupComponent_For_5_Conditional_12_Template, 2, 0, "btn");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r3.cName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(5, 9, x_r3.dCreateDt), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("Type : ", x_r3.cType, "");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(9, !x_r3.isSelected ? 9 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(x_r3.isSelected ? "" : "hidden group-hover:inline-block");
    \u0275\u0275property("disabled", x_r3.bIsApplied && x_r3.isSelected);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r3.bIsApplied && x_r3.isSelected ? "Applied" : "Apply", "");
    \u0275\u0275advance();
    \u0275\u0275conditional(12, x_r3.bIsApplied && x_r3.isSelected ? 12 : -1);
  }
}
var GroupComponent = class _GroupComponent {
  constructor(PSservice, cdr) {
    this.PSservice = PSservice;
    this.cdr = cdr;
    this.selectedUser = [];
    this.selectedUserChange = new EventEmitter();
    this.cNameChange = new EventEmitter();
    this.presetationList = [];
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.presetationList = yield this.PSservice.getPresentationList(this.nCaseid, this.presentData.nTypeid);
      this.cdr.detectChanges();
    });
  }
  fillDetails(x, clear) {
    this.resetSelection();
    if (clear) {
      this.selectedUser = [];
      this.cName = "";
      this.cNameChange.emit(this.cName);
      this.selectedUserChange.emit(this.selectedUser);
      return;
    }
    this.cName = x.cName;
    this.cNameChange.emit(this.cName);
    this.selectedUser = [...x.jUsers];
    this.selectedUserChange.emit(this.selectedUser);
    x.isSelected = true;
  }
  applyPresetation(x) {
    this.resetSelection();
    this.cName = x.cName;
    this.cNameChange.emit(this.cName);
    this.selectedUser = [...x.jUsers];
    this.selectedUserChange.emit(this.selectedUser);
    x.isSelected = true;
    x.bIsApplied = true;
  }
  resetSelection() {
    this.presetationList.forEach((item) => {
      item.isSelected = false;
      item.bIsApplied = false;
    });
  }
  static {
    this.\u0275fac = function GroupComponent_Factory(t) {
      return new (t || _GroupComponent)(\u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _GroupComponent, selectors: [["present-group"]], inputs: { nCaseid: "nCaseid", selectedUser: "selectedUser", cName: "cName", presentData: "presentData" }, outputs: { selectedUserChange: "selectedUserChange", cNameChange: "cNameChange" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 6, vars: 0, consts: [[1, "min-w-[420px]", "h-full", "flex", "flex-col", "gap-6"], [1, "text-lg", "font-semibold", "text-dark-blue", "ps-2.5"], [1, "flex", "flex-col", "overflow-auto", "ps-2.5"], [1, "bg-white", "rounded-base", "p-2.5", "hover:shadow-[0px_4px_4px_#00000040]", "duration-300", "mb-6", "group", "transition-all"], [1, "text-sm", "font-bold"], [1, "text-xs", "font-bold"], [1, "flex", "gap-2.5", "mt-2.5"], ["mode", "white"], [3, "click", "disabled"], ["mode", "white", 3, "click"], [3, "click"]], template: function GroupComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
        \u0275\u0275text(2, "Frequently used viewer groups:");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(3, "div", 2);
        \u0275\u0275repeaterCreate(4, GroupComponent_For_5_Template, 13, 11, "div", 3, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275repeater(ctx.presetationList);
      }
    }, dependencies: [ButtonComponent, DatePipe], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(GroupComponent, { className: "GroupComponent", filePath: "src\\app\\presentation\\components\\setup\\group\\group.component.ts", lineNumber: 25 });
})();
export {
  GroupComponent
};
//# sourceMappingURL=chunk-DANW7H5L.js.map
