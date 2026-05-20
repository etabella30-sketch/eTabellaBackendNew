import {
  DatepickerComponent
} from "./chunk-YLWJRUOP.js";
import {
  TaskService
} from "./chunk-PDZ7367Z.js";
import {
  NgOptionTemplateDirective,
  NgSelectComponent,
  NgSelectModule
} from "./chunk-E3GVDGCY.js";
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule
} from "./chunk-X3RSWYEV.js";
import {
  ContactService
} from "./chunk-5HHWKW4L.js";
import {
  MatInput,
  MatInputModule
} from "./chunk-XTSEIZ7V.js";
import {
  IssueService
} from "./chunk-3LLM6WVC.js";
import {
  MatRadioButton,
  MatRadioGroup,
  MatRadioModule
} from "./chunk-ILBZODYX.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  MatSelect,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-BM3TWEH3.js";
import {
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  MatButtonModule
} from "./chunk-W3IEBGJA.js";
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
  InputFlags,
  __async,
  booleanAttribute,
  ɵsetClassDebugInfo,
  ɵɵInheritDefinitionFeature,
  ɵɵInputTransformsFeature,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassMapInterpolate1,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpropertyInterpolate,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/interfaces/mark-nav-filter.interface.ts
var NAV_FILTER = {
  A: "A",
  AL: "AL",
  F: "F",
  QF: "QF",
  L: "L",
  QM: "QM"
};
var FILTER_ITEM = {
  CL: "CL",
  I: "I",
  FD: "FD",
  C: "C",
  T: "T",
  L: "L",
  S: "S",
  QF: "QF",
  QM: "QM"
};
var FILTER_LIST = [
  { name: "Claim", value: FILTER_ITEM.CL, allowedTabs: ["A", "F", "QF", "L"] },
  { name: "Issue", value: FILTER_ITEM.I, allowedTabs: ["A", "F", "QF", "L"] },
  { name: "Fact", value: FILTER_ITEM.FD, allowedTabs: ["A", "F", "L"] },
  { name: "Contact", value: FILTER_ITEM.C, allowedTabs: ["A", "F", "L"] },
  { name: "Task", value: FILTER_ITEM.T, allowedTabs: ["A", "F", "L"] }
];
var QFACT_DATE_TYPE = [
  { nValue: 1, cKey: "Created Date" },
  { nValue: 2, cKey: "Created Between" }
];

// src/app/shared/components/contactselect/contactselect.component.ts
function ContactselectComponent_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 12)(2, "div", 13);
    \u0275\u0275element(3, "avtr", 14);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r1 = ctx.item;
    \u0275\u0275advance(3);
    \u0275\u0275property("detail", item_r1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", item_r1.cFname, " ", item_r1.cLname, " ");
  }
}
function ContactselectComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 15);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", ctx_r1.activeContacts == null ? null : ctx_r1.activeContacts.cFname, " ", ctx_r1.activeContacts == null ? null : ctx_r1.activeContacts.cLname, " ");
  }
}
function ContactselectComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1, " Select a contact... ");
    \u0275\u0275elementContainerEnd();
  }
}
function ContactselectComponent_For_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 11)(1, "div")(2, "div", 12)(3, "div", 16);
    \u0275\u0275element(4, "avtr", 14);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275property("value", x_r3);
    \u0275\u0275advance(4);
    \u0275\u0275property("detail", x_r3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", x_r3.cFname, " ", x_r3.cLname, " ");
  }
}
var ContactselectComponent = class _ContactselectComponent {
  constructor() {
    this.clearOnSelect = false;
    this.activeContactsChange = new EventEmitter();
    this.demoUsers = [
      { cFname: "Alice", cLname: "Johnson" },
      { cFname: "Bob", cLname: "Smith" },
      { cFname: "Charlie", cLname: "Williams" },
      { cFname: "Diana", cLname: "Brown" },
      { cFname: "Ethan", cLname: "Davis" },
      { cFname: "Fiona", cLname: "Miller" },
      { cFname: "George", cLname: "Wilson" }
    ];
    this.userList = [];
  }
  OnValueChnaged(e, flag) {
    this.activeContactsChange.emit(e.value);
    if (this.clearOnSelect) {
      setTimeout(() => {
        this.activeContacts = null;
      }, 0);
    }
  }
  static {
    this.\u0275fac = function ContactselectComponent_Factory(t) {
      return new (t || _ContactselectComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContactselectComponent, selectors: [["contact-select"]], inputs: { activeContacts: "activeContacts", clearOnSelect: [InputFlags.HasDecoratorInputTransform, "clearOnSelect", "clearOnSelect", booleanAttribute], userList: "userList" }, outputs: { activeContactsChange: "activeContactsChange" }, standalone: true, features: [\u0275\u0275InputTransformsFeature, \u0275\u0275StandaloneFeature], decls: 17, vars: 4, consts: [[1, "border-tab", "border", "rounded-base", "bg-white", "min-w-[264px]"], [1, "flex", "gap-2", "items-center", "relative"], ["width", "14", "height", "15", "viewBox", "0 0 14 15", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "absolute", "left-2.5"], ["d", "M8.4308 0.640625C6.99106 0.640625 5.61028 1.21256 4.59223 2.23062C3.57417 3.24867 3.00223 4.62945 3.00223 6.0692C3.00223 7.25891 3.38509 8.35891 4.03366 9.25377L0.395947 12.8915C0.23866 13.0465 0.147259 13.2562 0.140794 13.4769C0.134328 13.6976 0.213298 13.9123 0.361243 14.0763C0.509188 14.2402 0.714691 14.3407 0.934921 14.3569C1.15515 14.373 1.37311 14.3035 1.54338 14.1629L1.60852 14.1041L5.24623 10.4663C6.17185 11.1385 7.28687 11.4996 8.4308 11.4978C9.87055 11.4978 11.2513 10.9258 12.2694 9.90777C13.2874 8.88972 13.8594 7.50894 13.8594 6.0692C13.8594 4.62945 13.2874 3.24867 12.2694 2.23062C11.2513 1.21256 9.87055 0.640625 8.4308 0.640625ZM8.4308 2.35491C9.41589 2.35491 10.3606 2.74624 11.0572 3.4428C11.7538 4.13936 12.1451 5.08411 12.1451 6.0692C12.1451 7.05429 11.7538 7.99903 11.0572 8.69559C10.3606 9.39216 9.41589 9.78348 8.4308 9.78348C7.44571 9.78348 6.50097 9.39216 5.80441 8.69559C5.10784 7.99903 4.71652 7.05429 4.71652 6.0692C4.71652 5.08411 5.10784 4.13936 5.80441 3.4428C6.50097 2.74624 7.44571 2.35491 8.4308 2.35491Z", "fill", "CurrentColor"], ["appendTo", "body", "bindLabel", "cFname", "bindValue", "nUserid", "placeholder", "Type to search by name of my team", 1, "pagerefslct", "autocmpltselect", "w-full", "!pe-0", "!ps-6", "h-8.5", "overflow-hidden", 3, "ngModelChange", "change", "ngModel", "items"], ["ng-option-tmp", ""], [1, "border-t"], ["panelClass", "sortfltrpnl contactnew !p-2.5", "disableOptionCentering", "", "placeholder", "Select a contact...", 1, "sortfilterslct", "addcont", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "bg-white"], [1, "bg-reply", "py-1", "mb-1", "flex", "gap-2.5", "sticky", "top-0", "z-50"], [1, "text-xs", "w-[40%]", "ps-5"], [1, "nocheck", "group", "!p-0", "mb-0.5", "last:mb-0", 2, "--mat-option-padding", "0", 3, "value"], [1, "px-5", "py-1", "hover:bg-blue-deactivate", "rounded-md", "flex", "text-xs", "items-center", "gap-2.5", "group-[.mdc-list-item--selected]:bg-blue-deactivate", "group-[.mdc-list-item--selected]:font-semibold"], [1, "flex", "items-center", "gap-2"], ["size", "sm", 3, "detail"], [1, "flex", "items-center", "justify-between"], [1, "w-[40%]"]], template: function ContactselectComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(2, "svg", 2);
        \u0275\u0275element(3, "path", 3);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(4, "ng-select", 4);
        \u0275\u0275twoWayListener("ngModelChange", function ContactselectComponent_Template_ng_select_ngModelChange_4_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.activeContacts, $event) || (ctx.activeContacts = $event);
          return $event;
        });
        \u0275\u0275listener("change", function ContactselectComponent_Template_ng_select_change_4_listener($event) {
          return ctx.OnValueChnaged({ value: $event }, "C");
        });
        \u0275\u0275template(5, ContactselectComponent_ng_template_5_Template, 5, 3, "ng-template", 5);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 6)(7, "mat-select", 7);
        \u0275\u0275twoWayListener("ngModelChange", function ContactselectComponent_Template_mat_select_ngModelChange_7_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.activeContacts, $event) || (ctx.activeContacts = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function ContactselectComponent_Template_mat_select_selectionChange_7_listener($event) {
          return ctx.OnValueChnaged($event, "C");
        });
        \u0275\u0275elementStart(8, "mat-select-trigger");
        \u0275\u0275template(9, ContactselectComponent_Conditional_9_Template, 3, 2, "ng-container")(10, ContactselectComponent_Conditional_10_Template, 2, 0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "div", 8)(12, "div", 9)(13, "h6", 10);
        \u0275\u0275text(14, "Name");
        \u0275\u0275elementEnd()()();
        \u0275\u0275repeaterCreate(15, ContactselectComponent_For_16_Template, 6, 4, "mat-option", 11, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275twoWayProperty("ngModel", ctx.activeContacts);
        \u0275\u0275property("items", ctx.userList);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.activeContacts);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(9, ctx.activeContacts ? 9 : 10);
        \u0275\u0275advance(6);
        \u0275\u0275repeater(ctx.userList);
      }
    }, dependencies: [MatSelectModule, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, AvatarComponent, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContactselectComponent, { className: "ContactselectComponent", filePath: "src\\app\\shared\\components\\contactselect\\contactselect.component.ts", lineNumber: 17 });
})();

// src/app/marking/components/fact/date-form/date-form.component.ts
var _forTrack0 = ($index, $item) => $item.nValue;
var _c0 = () => ({ standalone: true });
var _c1 = (a0, a1) => ({ "!w-1/2": a0, "!w-[90px] !min-w-16": a1 });
var _c2 = (a0) => ({ "--mat-datepicker-toggle-icon-color": a0 });
function DateFormComponent_For_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r1 = ctx.$implicit;
    \u0275\u0275property("value", x_r1.jOther == null ? null : x_r1.jOther.type);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r1.cKey, " ");
  }
}
function DateFormComponent_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 10);
    \u0275\u0275text(1, "Start ");
    \u0275\u0275elementEnd();
  }
}
function DateFormComponent_Conditional_22_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "button", 15);
    \u0275\u0275listener("click", function DateFormComponent_Conditional_22_Conditional_0_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r2);
      const iconOnlyDp_r3 = \u0275\u0275reference(9);
      return \u0275\u0275resetView(iconOnlyDp_r3.open());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 16);
    \u0275\u0275element(3, "rect", 17)(4, "line", 18)(5, "line", 19)(6, "line", 20);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "input", 21);
    \u0275\u0275listener("dateChange", function DateFormComponent_Conditional_22_Conditional_0_Template_input_dateChange_7_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.onIconDatePicked($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275element(8, "mat-datepicker", null, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const iconOnlyDp_r3 = \u0275\u0275reference(9);
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275classProp("!border-sred", ctx_r3.showError);
    \u0275\u0275property("disabled", ctx_r3.isDisabled);
    \u0275\u0275advance(6);
    \u0275\u0275property("matDatepicker", iconOnlyDp_r3)("disabled", ctx_r3.isDisabled)("ngModel", ctx_r3.selectedDate)("ngModelOptions", \u0275\u0275pureFunction0(7, _c0));
  }
}
function DateFormComponent_Conditional_22_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "datepicker", 22);
    \u0275\u0275twoWayListener("dateChange", function DateFormComponent_Conditional_22_Conditional_1_Template_datepicker_dateChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.selectedDate, $event) || (ctx_r3.selectedDate = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("dateChange", function DateFormComponent_Conditional_22_Conditional_1_Template_datepicker_dateChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.onDateChange($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(\u0275\u0275pureFunction1(15, _c2, ctx_r3.showError ? "#ff0000" : ""));
    \u0275\u0275classMap((ctx_r3.showError ? "w-8.5" : ctx_r3.selectedDate ? ctx_r3.selectedModule == "BT" ? "w-[280px]" : "w-[96px]" : !ctx_r3.selectedDate ? "w-8.5" : "w-[115px]") + (ctx_r3.showError ? " rounded-base !shadow-[0px_0px_4px_#ff000075] !border-none" : "") + (ctx_r3.selectedModule == "BT" && !ctx_r3.selectedDate ? " !w-8.5 h-8.5 border-tab border  rounded-base bg-white !flex !overflow-hidden !justify-center !items-center" : ""));
    \u0275\u0275property("noIcon", ctx_r3.selectedDate && ctx_r3.selectedModule == "BT")("noPlaceholder", true)("iconOnly", !ctx_r3.selectedDate && ctx_r3.selectedModule == "BT")("addcls", ctx_r3.showError ? " !border-sred !text-sred" : "")("showrangelabel", true)("isRange", ctx_r3.selectedModule == "BT");
    \u0275\u0275twoWayProperty("date", ctx_r3.selectedDate);
    \u0275\u0275property("nolabel", !ctx_r3.selectedDate)("defaultBlank", true)("disabled", ctx_r3.isDisabled)("type", "F");
  }
}
function DateFormComponent_Conditional_22_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 14);
    \u0275\u0275text(1, "Select date");
    \u0275\u0275elementEnd();
  }
}
function DateFormComponent_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, DateFormComponent_Conditional_22_Conditional_0_Template, 10, 8, "div", 13)(1, DateFormComponent_Conditional_22_Conditional_1_Template, 1, 17)(2, DateFormComponent_Conditional_22_Conditional_2_Template, 2, 0, "span", 14);
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, !ctx_r3.selectedDate && ctx_r3.selectedModule != "BT" ? 0 : 1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, ctx_r3.showError && !ctx_r3.selectedDate ? 2 : -1);
  }
}
function DateFormComponent_Conditional_23_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 26);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r7 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r7);
  }
}
function DateFormComponent_Conditional_23_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 25);
    \u0275\u0275text(1, "Type or pick month");
    \u0275\u0275elementEnd();
  }
}
function DateFormComponent_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "ng-select", 23);
    \u0275\u0275twoWayListener("ngModelChange", function DateFormComponent_Conditional_23_Template_ng_select_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r3.selectedMonth1, $event) || (ctx_r3.selectedMonth1 = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function DateFormComponent_Conditional_23_Template_ng_select_change_1_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onSelect());
    });
    \u0275\u0275template(2, DateFormComponent_Conditional_23_ng_template_2_Template, 2, 1, "ng-template", 24);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, DateFormComponent_Conditional_23_Conditional_3_Template, 2, 0, "span", 25);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMapInterpolate1("pagerefslct w-[136px] ", ctx_r3.showError && !ctx_r3.selectedMonth1 ? "!border-red-500 !text-red-500 !shadow-[0px_0px_6px_#ff000059]" : " !border-tab", " !border !border-solid bg-white !px-0 h-8.5 !rounded-base overflow-hidden");
    \u0275\u0275property("items", ctx_r3.months);
    \u0275\u0275twoWayProperty("ngModel", ctx_r3.selectedMonth1);
    \u0275\u0275property("disabled", ctx_r3.isDisabled);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r3.showError && !ctx_r3.selectedMonth1 ? 3 : -1);
  }
}
function DateFormComponent_Conditional_24_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 26);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r9 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r9);
  }
}
function DateFormComponent_Conditional_24_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 25);
    \u0275\u0275text(1, "Select year");
    \u0275\u0275elementEnd();
  }
}
function DateFormComponent_Conditional_24_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "ng-select", 27);
    \u0275\u0275twoWayListener("ngModelChange", function DateFormComponent_Conditional_24_Template_ng_select_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r3.selectedYear1, $event) || (ctx_r3.selectedYear1 = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function DateFormComponent_Conditional_24_Template_ng_select_change_1_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onSelect());
    });
    \u0275\u0275template(2, DateFormComponent_Conditional_24_ng_template_2_Template, 2, 1, "ng-template", 24);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, DateFormComponent_Conditional_24_Conditional_3_Template, 2, 0, "span", 25);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMapInterpolate1("pagerefslct w-[136px] ", ctx_r3.showError && !ctx_r3.selectedYear1 ? "!border-red-500 !text-red-500 !shadow-[0px_0px_6px_#ff000059]" : " !border-tab", " !border !border-solid bg-white !px-0 h-8.5 !rounded-base overflow-hidden");
    \u0275\u0275property("items", ctx_r3.years);
    \u0275\u0275twoWayProperty("ngModel", ctx_r3.selectedYear1);
    \u0275\u0275property("disabled", ctx_r3.isDisabled);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r3.showError && !ctx_r3.selectedYear1 ? 3 : -1);
  }
}
function DateFormComponent_Conditional_25_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 10);
    \u0275\u0275text(1, "End ");
    \u0275\u0275elementEnd();
  }
}
function DateFormComponent_Conditional_25_Conditional_2_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 26);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r11 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r11);
  }
}
function DateFormComponent_Conditional_25_Conditional_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 25);
    \u0275\u0275text(1, "Type or pick month");
    \u0275\u0275elementEnd();
  }
}
function DateFormComponent_Conditional_25_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "ng-select", 23);
    \u0275\u0275twoWayListener("ngModelChange", function DateFormComponent_Conditional_25_Conditional_2_Template_ng_select_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.selectedMonth2, $event) || (ctx_r3.selectedMonth2 = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function DateFormComponent_Conditional_25_Conditional_2_Template_ng_select_change_1_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.onSelect());
    });
    \u0275\u0275template(2, DateFormComponent_Conditional_25_Conditional_2_ng_template_2_Template, 2, 1, "ng-template", 24);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, DateFormComponent_Conditional_25_Conditional_2_Conditional_3_Template, 2, 0, "span", 25);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275classMapInterpolate1("pagerefslct w-[136px] ", ctx_r3.showError && !ctx_r3.selectedMonth2 ? "!border-red-500 !text-red-500 !shadow-[0px_0px_6px_#ff000059]" : " !border-tab", "  !border !border-solid bg-white !px-0 h-8.5 !rounded-base overflow-hidden");
    \u0275\u0275property("items", ctx_r3.months);
    \u0275\u0275twoWayProperty("ngModel", ctx_r3.selectedMonth2);
    \u0275\u0275property("disabled", ctx_r3.isDisabled);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r3.showError && !ctx_r3.selectedMonth2 ? 3 : -1);
  }
}
function DateFormComponent_Conditional_25_Conditional_3_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 26);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r13 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r13);
  }
}
function DateFormComponent_Conditional_25_Conditional_3_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 25);
    \u0275\u0275text(1, "Type or pick year");
    \u0275\u0275elementEnd();
  }
}
function DateFormComponent_Conditional_25_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "ng-select", 27);
    \u0275\u0275twoWayListener("ngModelChange", function DateFormComponent_Conditional_25_Conditional_3_Template_ng_select_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r3 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r3.selectedYear2, $event) || (ctx_r3.selectedYear2 = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function DateFormComponent_Conditional_25_Conditional_3_Template_ng_select_change_1_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.onSelect());
    });
    \u0275\u0275template(2, DateFormComponent_Conditional_25_Conditional_3_ng_template_2_Template, 2, 1, "ng-template", 24);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, DateFormComponent_Conditional_25_Conditional_3_Conditional_3_Template, 2, 0, "span", 25);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275classMapInterpolate1("pagerefslct w-[136px] ", ctx_r3.showError && !ctx_r3.selectedYear2 ? "!border-red-500 !text-red-500 !shadow-[0px_0px_6px_#ff000059]" : " !border-tab", " !border !border-solid bg-white !px-0 h-8.5 !rounded-base overflow-hidden");
    \u0275\u0275property("items", ctx_r3.years);
    \u0275\u0275twoWayProperty("ngModel", ctx_r3.selectedYear2);
    \u0275\u0275property("disabled", ctx_r3.isDisabled);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r3.showError && !ctx_r3.selectedYear2 ? 3 : -1);
  }
}
function DateFormComponent_Conditional_25_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11);
    \u0275\u0275template(1, DateFormComponent_Conditional_25_Conditional_1_Template, 2, 0, "h6", 10)(2, DateFormComponent_Conditional_25_Conditional_2_Template, 4, 7, "div")(3, DateFormComponent_Conditional_25_Conditional_3_Template, 4, 7, "div");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r3.selectedModule == "BT" ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ctx_r3.dateType == "MY" ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r3.dateType == "Y" || ctx_r3.dateType == "MY" ? 3 : -1);
  }
}
function DateFormComponent_Conditional_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r3.selectedModule != "BT" ? "Date is required" : "Start And End Date are required");
  }
}
function DateFormComponent_Conditional_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r3.selectedModule != "BT" ? "Month is required" : "Start And End Month and Year are required");
  }
}
function DateFormComponent_Conditional_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r3.selectedModule != "BT" ? "Year is required" : "Start And End Year is required");
  }
}
var DateFormComponent = class _DateFormComponent {
  buildYears() {
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const startYear = 1930;
    const count = currentYear - startYear + 1;
    return Array.from({ length: count }, (_, i) => currentYear - i);
  }
  constructor(common, cdr) {
    this.common = common;
    this.cdr = cdr;
    this.dateList = [];
    this.isfactsheet = false;
    this.isSubmitted = false;
    this.showError = false;
    this.jDate = null;
    this.jDateChange = new EventEmitter();
    this.editEnabled = false;
    this.dateType = "D";
    this.years = this.buildYears().map(String);
    this.months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    this.isLoaded = false;
    this.isDisabled = false;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      if (!this.jDate)
        this.editEnabled = true;
      this.dateList = yield this.common.getCode(26);
      if (this.dateList?.length)
        this.selectedModule = this.dateList[0].jOther?.type;
      if (this.jDate?.record?.length) {
        this.patchValues();
      }
      this.isLoaded = true;
      this.checkJDate();
      this.emit();
    });
  }
  patchValues() {
    try {
      this.dateType = this.jDate.type || "D";
      try {
        const obj = this.dateList.find((a) => a.nValue == this.jDate.nValue);
        if (obj)
          this.selectedModule = obj.jOther?.type || "ON";
      } catch (error) {
      }
      if (this.dateType == "MY" || this.dateType == "Y") {
        if (this.jDate?.record?.length) {
          const rec1 = this.jDate?.record[0];
          if (rec1) {
            if (this.dateType == "MY")
              this.selectedMonth1 = rec1.month ? rec1.month : null;
            this.selectedYear1 = rec1.year ? rec1.year : null;
          }
          const rec2 = this.jDate?.record[1];
          if (rec2) {
            if (this.dateType == "MY")
              this.selectedMonth2 = rec2.month ? rec2.month : null;
            this.selectedYear2 = rec2.year ? rec2.year : null;
          }
        }
      }
      if (this.dateType == "D") {
        const records = this.jDate.record.filter((a) => a.date).map((a) => a.date);
        this.selectedDate = records.length ? records : null;
      }
    } catch (error) {
    }
  }
  checkJDate() {
    if (!this.jDate) {
      this.jDate = { type: "D", nValue: 0, cValue: "On", record: [] };
    }
  }
  onTypeChange(clearAll = false) {
    debugger;
    if (!clearAll)
      this.checkJDate();
    this.jDate.type = this.dateType;
    const record = this.jDate.record;
    this.jDate.record = [];
    this.selectedMonth1 = null;
    this.selectedMonth2 = null;
    this.selectedDate = null;
    this.selectedYear1 = null;
    this.selectedYear2 = null;
    this.cdr.detectChanges();
    this.emit();
  }
  onDateChange(e) {
    this.checkJDate();
    try {
      if (typeof e == "object") {
        for (let [index, val] of e.entries()) {
          if (!this.jDate.record[index]) {
            this.jDate.record[index] = { date: val };
          }
          this.jDate.record[index].date = val;
        }
      } else {
        if (!this.jDate.record[0]) {
          this.jDate.record[0] = { date: e };
        }
        this.jDate.record[0].date = e;
      }
    } catch (error) {
    }
    this.showError = false;
    this.emit();
  }
  /** Date picked via the inline icon-only button (rendered when no date is
   *  selected and the module isn't a range). MatDatepickerInputEvent.value
   *  is a Date instance — push it into jDate.record[0] in the same shape
   *  the parent <datepicker> would emit, then re-emit to the host so the
   *  fact form picks up the new date. */
  onIconDatePicked(event) {
    const date = event.value;
    if (!date)
      return;
    this.checkJDate();
    this.jDate.record = [{ date: date.toISOString() }];
    this.selectedDate = date;
    this.showError = false;
    this.emit();
    this.cdr.detectChanges();
  }
  onSelect() {
    this.checkJDate();
    if (!this.jDate?.record) {
      this.jDate.record = [];
    }
    if (!this.jDate.record[0]) {
      this.jDate.record[0] = {};
    }
    if (this.selectedMonth1)
      this.jDate.record[0].month = this.selectedMonth1;
    if (this.selectedYear1)
      this.jDate.record[0].year = this.selectedYear1;
    if (this.selectedModule == "BT") {
      if (!this.jDate.record[1]) {
        this.jDate.record[1] = {};
      }
      if (this.selectedMonth2)
        this.jDate.record[1].month = this.selectedMonth2;
      if (this.selectedYear2)
        this.jDate.record[1].year = this.selectedYear2;
    }
    this.emit();
  }
  emit() {
    try {
      this.jDate.type = this.dateType;
      const selectedObj = this.dateList.find((a) => a.jOther?.type == this.selectedModule);
      if (selectedObj) {
        this.jDate.nValue = selectedObj.nValue;
        this.jDate.cValue = selectedObj.cKey;
      }
    } catch (error) {
    }
    if (this.jDate?.record?.length)
      this.jDateChange.emit(this.jDate);
    else
      this.jDateChange.emit(null);
  }
  onModuleChange() {
    this.checkJDate();
    this.onTypeChange(true);
  }
  static {
    this.\u0275fac = function DateFormComponent_Factory(t) {
      return new (t || _DateFormComponent)(\u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DateFormComponent, selectors: [["date-form"]], inputs: { isfactsheet: "isfactsheet", isSubmitted: "isSubmitted", showError: "showError", jDate: "jDate", isDisabled: "isDisabled" }, outputs: { jDateChange: "jDateChange" }, standalone: true, features: [\u0275\u0275ProvidersFeature([
      provideNativeDateAdapter()
    ]), \u0275\u0275StandaloneFeature], decls: 30, vars: 22, consts: [["iconOnlyDp", ""], [1, "mb-2.5"], [1, "text-xs", "flex", "items-center", "font-semibold", "my-3", "focus-visible:outline-none", "focus-visible:border-gray-400"], [1, "text-red-500"], [1, "flex", "gap-2", "ms-2", "items-center", "w-full", 3, "ngModelChange", "change", "ngModel", "ngModelOptions"], [3, "value"], [1, "text-grey"], [1, "flex", "gap-2", "items-start", "w-full"], [1, "rounded-base", "bg-white", "border", "border-tab", 3, "ngModelChange", "selectionChange", "ngClass", "ngModel", "ngModelOptions", "disabled"], [1, "flex", "items-start", "text-xs", "gap-3", "mb-1"], [1, "w-7", "block"], [1, "flex", "items-start", "text-xs", "gap-3"], [1, "text-red-500", "text-xxs", "ml-1"], [1, "relative", "inline-flex"], [1, "text-red-500", "text-xxs", "font-bold", "mt-2"], ["type", "button", 1, "w-8.5", "h-8.5", "flex", "items-center", "justify-center", "border", "border-tab", "rounded-base", "bg-white", "text-grey", "hover:text-blue-on", "hover:border-blue-on", "disabled:opacity-50", "disabled:cursor-not-allowed", "transition", 3, "click", "disabled"], ["width", "16", "height", "16", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round"], ["x", "3", "y", "4", "width", "18", "height", "18", "rx", "2", "ry", "2"], ["x1", "16", "y1", "2", "x2", "16", "y2", "6"], ["x1", "8", "y1", "2", "x2", "8", "y2", "6"], ["x1", "3", "y1", "10", "x2", "21", "y2", "10"], ["matInput", "", "name", "iconOnlyDate", "tabindex", "-1", "aria-hidden", "true", 1, "absolute", "w-0", "h-0", "p-0", "m-0", "border-none", "outline-none", "opacity-0", "pointer-events-none", 3, "dateChange", "matDatepicker", "disabled", "ngModel", "ngModelOptions"], [3, "dateChange", "noIcon", "noPlaceholder", "iconOnly", "addcls", "showrangelabel", "isRange", "date", "nolabel", "defaultBlank", "disabled", "type"], ["appendTo", "body", "bindLabel", "cKey", "bindValue", "cKey", "placeholder", "Type/pick month ", 3, "ngModelChange", "change", "items", "ngModel", "disabled"], ["ng-option-tmp", ""], [1, "text-red-500", "text-xxs", "font-bold"], [1, "text-xs", "font-normal"], ["bindLabel", "cKey", "bindValue", "cKey", "appendTo", "body", "placeholder", "Type/pick Year ", 3, "ngModelChange", "change", "items", "ngModel", "disabled"]], template: function DateFormComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1)(1, "h6", 2);
        \u0275\u0275text(2, " Date ");
        \u0275\u0275elementStart(3, "span", 3);
        \u0275\u0275text(4, "*");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "mat-radio-group", 4);
        \u0275\u0275twoWayListener("ngModelChange", function DateFormComponent_Template_mat_radio_group_ngModelChange_5_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.dateType, $event) || (ctx.dateType = $event);
          return $event;
        });
        \u0275\u0275listener("change", function DateFormComponent_Template_mat_radio_group_change_5_listener() {
          return ctx.onTypeChange();
        });
        \u0275\u0275elementStart(6, "mat-radio-button", 5)(7, "span", 6);
        \u0275\u0275text(8, "Exact Date");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(9, "mat-radio-button", 5)(10, "span", 6);
        \u0275\u0275text(11, "Month + Year");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(12, "mat-radio-button", 5)(13, "span", 6);
        \u0275\u0275text(14, "Year Only");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(15, "div", 7)(16, "mat-select", 8);
        \u0275\u0275twoWayListener("ngModelChange", function DateFormComponent_Template_mat_select_ngModelChange_16_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.selectedModule, $event) || (ctx.selectedModule = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function DateFormComponent_Template_mat_select_selectionChange_16_listener() {
          return ctx.onModuleChange();
        });
        \u0275\u0275repeaterCreate(17, DateFormComponent_For_18_Template, 2, 2, "mat-option", 5, _forTrack0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(19, "div")(20, "div", 9);
        \u0275\u0275template(21, DateFormComponent_Conditional_21_Template, 2, 0, "h6", 10)(22, DateFormComponent_Conditional_22_Template, 3, 2)(23, DateFormComponent_Conditional_23_Template, 4, 7, "div")(24, DateFormComponent_Conditional_24_Template, 4, 7, "div");
        \u0275\u0275elementEnd();
        \u0275\u0275template(25, DateFormComponent_Conditional_25_Template, 4, 3, "div", 11);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(26, "div");
        \u0275\u0275template(27, DateFormComponent_Conditional_27_Template, 2, 1, "span", 12)(28, DateFormComponent_Conditional_28_Template, 2, 1, "span", 12)(29, DateFormComponent_Conditional_29_Template, 2, 1, "span", 12);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.dateType);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(17, _c0));
        \u0275\u0275advance();
        \u0275\u0275property("value", "D");
        \u0275\u0275advance(3);
        \u0275\u0275property("value", "MY");
        \u0275\u0275advance(3);
        \u0275\u0275property("value", "Y");
        \u0275\u0275advance(4);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(18, _c1, ctx.isfactsheet, !ctx.isfactsheet));
        \u0275\u0275twoWayProperty("ngModel", ctx.selectedModule);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(21, _c0))("disabled", ctx.isDisabled);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.dateList);
        \u0275\u0275advance(4);
        \u0275\u0275conditional(21, ctx.dateType != "D" && ctx.selectedModule == "BT" ? 21 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(22, ctx.dateType == "D" && ctx.isLoaded ? 22 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(23, ctx.dateType == "MY" ? 23 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(24, ctx.dateType == "Y" || ctx.dateType == "MY" ? 24 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(25, ctx.selectedModule == "BT" && ctx.dateType != "D" ? 25 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(27, ctx.isSubmitted && !ctx.selectedDate && ctx.dateType == "D" ? 27 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(28, ctx.isSubmitted && !ctx.selectedMonth1 && ctx.dateType == "MY" ? 28 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(29, ctx.isSubmitted && !ctx.selectedYear1 && ctx.dateType == "Y" ? 29 : -1);
      }
    }, dependencies: [MatRadioModule, MatRadioGroup, MatRadioButton, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, MatSelectModule, MatSelect, MatOption, DatepickerComponent, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective, NgClass, MatDatepickerModule, MatDatepicker, MatDatepickerInput, MatNativeDateModule, MatInputModule, MatInput] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DateFormComponent, { className: "DateFormComponent", filePath: "src\\app\\marking\\components\\fact\\date-form\\date-form.component.ts", lineNumber: 49 });
})();

// src/app/shared/components/team-select/team-select.component.ts
function TeamSelectComponent_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 12)(2, "div", 13);
    \u0275\u0275element(3, "avtr", 14);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r1 = ctx.item;
    \u0275\u0275advance(3);
    \u0275\u0275property("detail", item_r1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", item_r1.cFname, " ", item_r1.cLname, " ");
  }
}
function TeamSelectComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 15);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", ctx_r1.activeContacts == null ? null : ctx_r1.activeContacts.cFname, " ", ctx_r1.activeContacts == null ? null : ctx_r1.activeContacts.cLname, " ");
  }
}
function TeamSelectComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1, " Select a contact... ");
    \u0275\u0275elementContainerEnd();
  }
}
function TeamSelectComponent_For_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 11)(1, "div")(2, "div", 12)(3, "div", 16);
    \u0275\u0275element(4, "avtr", 14);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275property("value", x_r3);
    \u0275\u0275advance(4);
    \u0275\u0275property("detail", x_r3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", x_r3.cFname, " ", x_r3.cLname, " ");
  }
}
var TeamSelectComponent = class _TeamSelectComponent {
  constructor() {
    this.clearOnSelect = false;
    this.activeContactsChange = new EventEmitter();
    this.demoUsers = [
      { cFname: "Alice", cLname: "Johnson" },
      { cFname: "Bob", cLname: "Smith" },
      { cFname: "Charlie", cLname: "Williams" },
      { cFname: "Diana", cLname: "Brown" },
      { cFname: "Ethan", cLname: "Davis" },
      { cFname: "Fiona", cLname: "Miller" },
      { cFname: "George", cLname: "Wilson" }
    ];
    this.userList = [];
  }
  OnValueChnaged(e, flag) {
    this.activeContactsChange.emit(e.value);
    if (this.clearOnSelect) {
      setTimeout(() => {
        this.activeContacts = null;
      }, 0);
    }
  }
  static {
    this.\u0275fac = function TeamSelectComponent_Factory(t) {
      return new (t || _TeamSelectComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TeamSelectComponent, selectors: [["team-select"]], inputs: { activeContacts: "activeContacts", clearOnSelect: [InputFlags.HasDecoratorInputTransform, "clearOnSelect", "clearOnSelect", booleanAttribute], userList: "userList" }, outputs: { activeContactsChange: "activeContactsChange" }, standalone: true, features: [\u0275\u0275InputTransformsFeature, \u0275\u0275StandaloneFeature], decls: 17, vars: 4, consts: [[1, "border-tab", "border", "rounded-base", "bg-white", "min-w-[264px]"], [1, "flex", "gap-2", "items-center", "relative"], ["width", "14", "height", "15", "viewBox", "0 0 14 15", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "absolute", "left-2.5"], ["d", "M8.4308 0.640625C6.99106 0.640625 5.61028 1.21256 4.59223 2.23062C3.57417 3.24867 3.00223 4.62945 3.00223 6.0692C3.00223 7.25891 3.38509 8.35891 4.03366 9.25377L0.395947 12.8915C0.23866 13.0465 0.147259 13.2562 0.140794 13.4769C0.134328 13.6976 0.213298 13.9123 0.361243 14.0763C0.509188 14.2402 0.714691 14.3407 0.934921 14.3569C1.15515 14.373 1.37311 14.3035 1.54338 14.1629L1.60852 14.1041L5.24623 10.4663C6.17185 11.1385 7.28687 11.4996 8.4308 11.4978C9.87055 11.4978 11.2513 10.9258 12.2694 9.90777C13.2874 8.88972 13.8594 7.50894 13.8594 6.0692C13.8594 4.62945 13.2874 3.24867 12.2694 2.23062C11.2513 1.21256 9.87055 0.640625 8.4308 0.640625ZM8.4308 2.35491C9.41589 2.35491 10.3606 2.74624 11.0572 3.4428C11.7538 4.13936 12.1451 5.08411 12.1451 6.0692C12.1451 7.05429 11.7538 7.99903 11.0572 8.69559C10.3606 9.39216 9.41589 9.78348 8.4308 9.78348C7.44571 9.78348 6.50097 9.39216 5.80441 8.69559C5.10784 7.99903 4.71652 7.05429 4.71652 6.0692C4.71652 5.08411 5.10784 4.13936 5.80441 3.4428C6.50097 2.74624 7.44571 2.35491 8.4308 2.35491Z", "fill", "CurrentColor"], ["appendTo", "body", "bindLabel", "cFname", "bindValue", "nUserid", "placeholder", "Type to search by name of my team", 1, "pagerefslct", "autocmpltselect", "w-full", "!pe-0", "!ps-6", "h-8.5", "overflow-hidden", 3, "ngModelChange", "change", "ngModel", "items"], ["ng-option-tmp", ""], [1, "border-t"], ["panelClass", "sortfltrpnl contactnew !p-2.5", "disableOptionCentering", "", "placeholder", "Select a team member...", 1, "sortfilterslct", "addcont", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "bg-white"], [1, "bg-reply", "py-1", "mb-1", "flex", "gap-2.5", "sticky", "top-0", "z-50"], [1, "text-xs", "w-[40%]", "ps-5"], [1, "nocheck", "group", "!p-0", "mb-0.5", "last:mb-0", 2, "--mat-option-padding", "0", 3, "value"], [1, "px-5", "py-1", "hover:bg-blue-deactivate", "rounded-md", "flex", "text-xs", "items-center", "gap-2.5", "group-[.mdc-list-item--selected]:bg-blue-deactivate", "group-[.mdc-list-item--selected]:font-semibold"], [1, "flex", "items-center", "gap-2"], ["size", "sm", 3, "detail"], [1, "flex", "items-center", "justify-between"], [1, "w-[40%]"]], template: function TeamSelectComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(2, "svg", 2);
        \u0275\u0275element(3, "path", 3);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(4, "ng-select", 4);
        \u0275\u0275twoWayListener("ngModelChange", function TeamSelectComponent_Template_ng_select_ngModelChange_4_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.activeContacts, $event) || (ctx.activeContacts = $event);
          return $event;
        });
        \u0275\u0275listener("change", function TeamSelectComponent_Template_ng_select_change_4_listener($event) {
          return ctx.OnValueChnaged({ value: $event }, "C");
        });
        \u0275\u0275template(5, TeamSelectComponent_ng_template_5_Template, 5, 3, "ng-template", 5);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 6)(7, "mat-select", 7);
        \u0275\u0275twoWayListener("ngModelChange", function TeamSelectComponent_Template_mat_select_ngModelChange_7_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.activeContacts, $event) || (ctx.activeContacts = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TeamSelectComponent_Template_mat_select_selectionChange_7_listener($event) {
          return ctx.OnValueChnaged($event, "C");
        });
        \u0275\u0275elementStart(8, "mat-select-trigger");
        \u0275\u0275template(9, TeamSelectComponent_Conditional_9_Template, 3, 2, "ng-container")(10, TeamSelectComponent_Conditional_10_Template, 2, 0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "div", 8)(12, "div", 9)(13, "h6", 10);
        \u0275\u0275text(14, "Name");
        \u0275\u0275elementEnd()()();
        \u0275\u0275repeaterCreate(15, TeamSelectComponent_For_16_Template, 6, 4, "mat-option", 11, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275twoWayProperty("ngModel", ctx.activeContacts);
        \u0275\u0275property("items", ctx.userList);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.activeContacts);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(9, ctx.activeContacts ? 9 : 10);
        \u0275\u0275advance(6);
        \u0275\u0275repeater(ctx.userList);
      }
    }, dependencies: [MatSelectModule, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, AvatarComponent, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TeamSelectComponent, { className: "TeamSelectComponent", filePath: "src\\app\\shared\\components\\team-select\\team-select.component.ts", lineNumber: 16 });
})();

// src/app/shared/components/nav-filters/filter-components/factdetailfilter/factdetailfilter.component.ts
var _c02 = (a0, a1) => [a0, a1];
function FactdetailfilterComponent_ng_template_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r1 = ctx.item;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275classProp("text-gray-400", ctx_r1.isOptionDisabled(item_r1, "T"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r1.cKey);
  }
}
function FactdetailfilterComponent_ng_container_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 18)(2, "span", 19);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 20);
    \u0275\u0275listener("click", function FactdetailfilterComponent_ng_container_13_Template_icon_click_4_listener() {
      const i_r4 = \u0275\u0275restoreView(_r3).index;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.remove(i_r4, "T"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r5.cKey);
  }
}
function FactdetailfilterComponent_ng_container_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 18)(2, "span", 19);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 20);
    \u0275\u0275listener("click", function FactdetailfilterComponent_ng_container_14_Template_icon_click_4_listener() {
      const i_r7 = \u0275\u0275restoreView(_r6).index;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.remove(i_r7, "S"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r8.cKey);
  }
}
function FactdetailfilterComponent_ng_template_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r9 = ctx.item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r9.cKey);
  }
}
var FactdetailfilterComponent = class _FactdetailfilterComponent {
  constructor(common, cdr) {
    this.common = common;
    this.cdr = cdr;
    this.isIndividual = false;
    this.selectedFilters = [];
    this.onClear = new EventEmitter();
    this.jFiltersChange = new EventEmitter();
    this.jLevelsChange = new EventEmitter();
    this.initialized = false;
    this.isFileLevel = false;
    this.isPageLevel = false;
    this.qfactdatetype = QFACT_DATE_TYPE;
    this.selecteddatetype = 1;
    this.filetypeList = [];
    this.statusList = [];
    this.jDate = {};
    this.jDateChange = new EventEmitter();
    this.selectedType = [];
    this.selectedStatus = [];
    this.selectedContact = [];
    this.userList = [];
    this.jFiletypes = [];
    this.jFiletypesChange = new EventEmitter();
    this.jStatus = [];
    this.jStatusChange = new EventEmitter();
    this.createDate = null;
    this.createDateChange = new EventEmitter();
    this.createBy = [];
    this.createByChange = new EventEmitter();
    this.onEmitData = new EventEmitter();
  }
  ngOnInit() {
    this.initData();
    if (this.jFilters && Object.keys(this.jFilters).length > 0) {
      if (this.jFilters.hasOwnProperty("cType")) {
        this.isFileLevel = true;
        this.isPageLevel = false;
      }
    } else {
      this.isFileLevel = false;
      this.isPageLevel = true;
    }
  }
  ngOnChanges(changes) {
    if (changes["jFiletypes"] || changes["jStatus"] || changes["createBy"] || changes["createDate"] || changes["jLevels"]) {
      if (this.filetypeList?.length || this.statusList?.length || this.userList?.length) {
        this.updateSelectedValues();
      }
    }
  }
  updateSelectedValues() {
    if (this.jFiletypes?.length && this.filetypeList?.length) {
      this.selectedType = this.filetypeList.filter((item) => this.jFiletypes.includes(item.nValue));
    } else {
      this.selectedType = [];
    }
    if (this.jStatus?.length && this.statusList?.length) {
      this.selectedStatus = this.statusList.filter((item) => this.jStatus.includes(item.nValue));
    } else {
      this.selectedStatus = [];
    }
    if (this.createBy?.length && this.userList?.length) {
      this.selectedContact = this.userList.filter((user) => this.createBy.includes(user.nUserid));
    } else {
      this.selectedContact = [];
    }
    if (this.jLevels) {
      if (this.jLevels === "M") {
        this.isFileLevel = true;
        this.isPageLevel = false;
      } else if (this.jLevels === "S") {
        this.isFileLevel = false;
        this.isPageLevel = true;
      }
    } else {
      this.isFileLevel = false;
      this.isPageLevel = true;
    }
    this.cdr.markForCheck();
  }
  initData() {
    return __async(this, null, function* () {
      this.statusList = yield this.common.getCode(24);
      this.filetypeList = yield this.common.getCode(23);
      this.userList = yield this.common.getMyTeamUsers(this.nCaseid);
      this.userList = this.userList.filter((user) => user.nUserid != this.nUserid);
      setTimeout(() => {
        this.updateSelectedValues();
        this.initialized = true;
      }, 0);
      if (this.jFilters) {
        if (this.jFilters.hasOwnProperty("selecteddatetype")) {
          this.selecteddatetype = this.jFilters.selecteddatetype;
        }
      } else {
        this.jFilters = {};
      }
      this.cdr.markForCheck();
    });
  }
  handleLevel(e) {
    if (!e.checked) {
      e.source.checked = true;
      return;
    }
    if (e.source.name === "fileLevel") {
      this.isFileLevel = e.checked;
      this.isPageLevel = !e.checked;
    } else {
      this.isPageLevel = e.checked;
      this.isFileLevel = !e.checked;
    }
    this.emitData();
  }
  OnValueChnaged(e, flag) {
    const isdisabled = this.isOptionDisabled(e, flag);
    if (isdisabled)
      return;
    if (flag === "T") {
      const idx = this.selectedType.findIndex((selected) => selected.nValue === e.nValue);
      if (idx === -1)
        this.selectedType.push(e);
    }
    if (flag === "S") {
      const idx = this.selectedStatus.findIndex((selected) => selected.nValue === e.nValue);
      if (idx === -1)
        this.selectedStatus.push(e);
    }
    this.emitData();
    setTimeout(() => {
      this.resetSelect = null;
      this.cdr.markForCheck();
    }, 10);
  }
  onActiveContactsChange(user) {
    const idx = this.selectedContact.findIndex((selected) => selected.nUserid === user.nUserid);
    if (idx == -1) {
      this.selectedContact.push(user);
      this.emitData();
    }
  }
  onRemoveContact(user) {
    const idx = this.selectedContact.findIndex((selected) => selected.nUserid === user.nUserid);
    if (idx != -1) {
      this.selectedContact.splice(idx, 1);
      this.emitData();
    }
  }
  OnDateChange(e) {
    if (e?.record?.length > 0) {
      this.jDate = e;
      this.jDateChange.emit(e);
    } else {
      this.jDate = null;
      this.jDateChange.emit(null);
    }
  }
  isOptionDisabled(item, flag) {
    if (flag === "T") {
      return this.selectedType.some((selected) => selected.nValue === item.nValue);
    }
    if (flag === "S") {
      return this.selectedStatus.some((selected) => selected.nValue === item.nValue);
    }
    return false;
  }
  handleDateChange(e) {
    if (this.selecteddatetype == 1) {
      this.createDate = { start: e, end: e };
    } else {
      const [start, end] = e;
      if (!start || !end)
        return;
      this.createDate = { start, end };
    }
    if (this.initialized) {
      this.emitData();
    } else {
      this.createDateChange.emit(this.createDate);
    }
  }
  removeFilter(flag) {
    this.selectedType = [];
    this.selectedStatus = [];
    this.selectedContact = [];
    this.createDate = null;
    const index = this.selectedFilters.indexOf(flag);
    if (index > -1) {
      this.selectedFilters.splice(index, 1);
    }
    this.emitData();
    this.onClear.emit();
  }
  emitData() {
    this.jFiletypes = this.selectedType.map((selected) => selected.nValue);
    this.jStatus = this.selectedStatus.map((selected) => selected.nValue);
    this.createBy = this.selectedContact.map((selected) => selected.nUserid);
    this.jLevels = this.isFileLevel ? "M" : "S";
    this.jLevelsChange.emit(this.jLevels);
    this.jFiletypesChange.emit(this.jFiletypes);
    this.jFiltersChange.emit(this.jFilters);
    this.jStatusChange.emit(this.jStatus);
    this.createDateChange.emit(this.createDate);
    this.createByChange.emit(this.createBy);
    this.onEmitData.emit();
  }
  remove(index, flag) {
    if (flag === "T")
      this.selectedType.splice(index, 1);
    if (flag === "S")
      this.selectedStatus.splice(index, 1);
    this.emitData();
  }
  trackByIndex(_index, item) {
    return item?.nValue ?? item?.nUserid ?? item?.nCompanyid ?? _index;
  }
  static {
    this.\u0275fac = function FactdetailfilterComponent_Factory(t) {
      return new (t || _FactdetailfilterComponent)(\u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FactdetailfilterComponent, selectors: [["factdetailfilter"]], inputs: { isIndividual: "isIndividual", nCaseid: "nCaseid", nUserid: "nUserid", selectedFilters: "selectedFilters", jFilters: "jFilters", jLevels: "jLevels", jDate: "jDate", jFiletypes: "jFiletypes", jStatus: "jStatus", createDate: "createDate", createBy: "createBy" }, outputs: { onClear: "onClear", jFiltersChange: "jFiltersChange", jLevelsChange: "jLevelsChange", jDateChange: "jDateChange", jFiletypesChange: "jFiletypesChange", jStatusChange: "jStatusChange", createDateChange: "createDateChange", createByChange: "createByChange", onEmitData: "onEmitData" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 27, vars: 28, consts: [[1, "py-2.5"], [1, "flex", "items-center"], [1, "text-xs", "font-bold"], ["name", "close", 1, "text-xs", "mx-3", 3, "click"], [1, "mb-2.5"], [3, "jDateChange", "jDate"], [1, "w-full"], [1, "flex", "flex-wrap", "gap-2", "mt-2"], ["appendTo", "body", "bindLabel", "cKey", "bindValue", "nValue", "placeholder", "Choose file type...", 1, "bg-white", "ng-select-main", "w-[198px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "ngModelChange", "clearable", "items", "ngModel"], ["ng-option-tmp", ""], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "flex", "items-center", "gap-2.5", "my-2"], ["appendTo", "body", "bindLabel", "cKey", "bindValue", "nValue", "placeholder", "Choose date...", 1, "bg-white", "ng-select-main", "w-[198px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", 3, "ngModelChange", "clearable", "ngModel", "items"], [3, "dateChange", "isRange", "defaultBlank", "date"], [1, "flex", "items-center", "gap-2.5", "mt-2", "mb-2"], ["name", "fileLevel", 3, "change", "checked"], ["name", "pageLevel", 3, "change", "checked"], [1, "text-xs", "font-normal"], ["mode", "white"], [1, "text-xs"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"]], template: function FactdetailfilterComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h6", 2);
        \u0275\u0275text(3);
        \u0275\u0275pipe(4, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "icon", 3);
        \u0275\u0275listener("click", function FactdetailfilterComponent_Template_icon_click_5_listener() {
          return ctx.removeFilter("FD");
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 4)(7, "date-form", 5);
        \u0275\u0275listener("jDateChange", function FactdetailfilterComponent_Template_date_form_jDateChange_7_listener($event) {
          return ctx.OnDateChange($event);
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(8, "div")(9, "div", 6)(10, "div", 7)(11, "ng-select", 8);
        \u0275\u0275listener("change", function FactdetailfilterComponent_Template_ng_select_change_11_listener($event) {
          return ctx.OnValueChnaged($event, "T");
        });
        \u0275\u0275twoWayListener("ngModelChange", function FactdetailfilterComponent_Template_ng_select_ngModelChange_11_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.resetSelect, $event) || (ctx.resetSelect = $event);
          return $event;
        });
        \u0275\u0275template(12, FactdetailfilterComponent_ng_template_12_Template, 2, 3, "ng-template", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275template(13, FactdetailfilterComponent_ng_container_13_Template, 5, 1, "ng-container", 10);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(14, FactdetailfilterComponent_ng_container_14_Template, 5, 1, "ng-container", 10);
        \u0275\u0275elementStart(15, "div")(16, "div", 11)(17, "ng-select", 12);
        \u0275\u0275twoWayListener("ngModelChange", function FactdetailfilterComponent_Template_ng_select_ngModelChange_17_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.selecteddatetype, $event) || (ctx.selecteddatetype = $event);
          return $event;
        });
        \u0275\u0275template(18, FactdetailfilterComponent_ng_template_18_Template, 2, 1, "ng-template", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(19, "datepicker", 13);
        \u0275\u0275listener("dateChange", function FactdetailfilterComponent_Template_datepicker_dateChange_19_listener($event) {
          return ctx.handleDateChange($event);
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(20, "div", 14)(21, "mat-checkbox", 15);
        \u0275\u0275listener("change", function FactdetailfilterComponent_Template_mat_checkbox_change_21_listener($event) {
          return ctx.handleLevel($event);
        });
        \u0275\u0275text(22);
        \u0275\u0275pipe(23, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(24, "mat-checkbox", 16);
        \u0275\u0275listener("change", function FactdetailfilterComponent_Template_mat_checkbox_change_24_listener($event) {
          return ctx.handleLevel($event);
        });
        \u0275\u0275text(25);
        \u0275\u0275pipe(26, "translate");
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 19, "FILTERS.FACT"));
        \u0275\u0275advance(4);
        \u0275\u0275property("jDate", ctx.jDate);
        \u0275\u0275advance(4);
        \u0275\u0275property("clearable", false)("items", ctx.filetypeList);
        \u0275\u0275twoWayProperty("ngModel", ctx.resetSelect);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngForOf", ctx.selectedType)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.selectedStatus)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance(3);
        \u0275\u0275property("clearable", false);
        \u0275\u0275twoWayProperty("ngModel", ctx.selecteddatetype);
        \u0275\u0275property("items", ctx.qfactdatetype);
        \u0275\u0275advance(2);
        \u0275\u0275property("isRange", ctx.selecteddatetype == 2)("defaultBlank", true)("date", ctx.createDate ? ctx.selecteddatetype == 2 ? \u0275\u0275pureFunction2(25, _c02, ctx.createDate.start, ctx.createDate.end) : ctx.createDate.start : null);
        \u0275\u0275advance(2);
        \u0275\u0275property("checked", ctx.isFileLevel);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(23, 21, "FILTERS.FILE_LEVEL"));
        \u0275\u0275advance(2);
        \u0275\u0275property("checked", ctx.isPageLevel);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(26, 23, "FILTERS.PAGE_LEVEL"));
      }
    }, dependencies: [
      CommonModule,
      NgForOf,
      MatRadioModule,
      MatSelectModule,
      IconComponent,
      FormsModule,
      NgControlStatus,
      NgModel,
      ButtonComponent,
      DatepickerComponent,
      NgSelectModule,
      NgSelectComponent,
      NgOptionTemplateDirective,
      DateFormComponent,
      TranslateModule,
      TranslatePipe,
      MatCheckboxModule,
      MatCheckbox
    ], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FactdetailfilterComponent, { className: "FactdetailfilterComponent", filePath: "src\\app\\shared\\components\\nav-filters\\filter-components\\factdetailfilter\\factdetailfilter.component.ts", lineNumber: 45 });
})();

// src/app/shared/components/nav-filters/base/base-nav-filter.component.ts
var BaseNavFilterComponent = class _BaseNavFilterComponent {
  constructor(cdr) {
    this.cdr = cdr;
    this.nCaseid = "";
    this.nUserid = "";
    this.selectedFilters = [];
    this.onClear = new EventEmitter();
  }
  /**
   * Helper to mark for check (OnPush)
   */
  markForCheck() {
    this.cdr.markForCheck();
  }
  static {
    this.\u0275fac = function BaseNavFilterComponent_Factory(t) {
      return new (t || _BaseNavFilterComponent)(\u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({ type: _BaseNavFilterComponent, inputs: { nCaseid: "nCaseid", nUserid: "nUserid", selectedFilters: "selectedFilters" }, outputs: { onClear: "onClear" } });
  }
};

// src/app/shared/components/nav-filters/filter-components/factcontactfilter/factcontactfilter.component.ts
function FactcontactfilterComponent_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 14);
    \u0275\u0275element(2, "avtr", 15);
    \u0275\u0275elementStart(3, "span", 16);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "icon", 17);
    \u0275\u0275listener("click", function FactcontactfilterComponent_ng_container_9_Template_icon_click_5_listener() {
      const i_r2 = \u0275\u0275restoreView(_r1).index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.remove(i_r2, "CN"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("detail", x_r4);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", x_r4.cFname, " ", x_r4.cLname, "");
  }
}
function FactcontactfilterComponent_ng_template_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r5 = ctx.item;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("text-gray-400", ctx_r2.isOptionDisabled(item_r5, "R"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r5.cRole);
  }
}
function FactcontactfilterComponent_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 14)(2, "span", 16);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 17);
    \u0275\u0275listener("click", function FactcontactfilterComponent_ng_container_15_Template_icon_click_4_listener() {
      const i_r7 = \u0275\u0275restoreView(_r6).index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.remove(i_r7, "R"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r8.cRole);
  }
}
function FactcontactfilterComponent_ng_template_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r9 = ctx.item;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("text-gray-400", ctx_r2.isOptionDisabled(item_r9, "P"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r9.cKey);
  }
}
function FactcontactfilterComponent_ng_container_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 14)(2, "span", 16);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 17);
    \u0275\u0275listener("click", function FactcontactfilterComponent_ng_container_21_Template_icon_click_4_listener() {
      const i_r11 = \u0275\u0275restoreView(_r10).index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.remove(i_r11, "O"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r12 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r12.cKey);
  }
}
function FactcontactfilterComponent_ng_template_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r13 = ctx.item;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("text-gray-400", ctx_r2.isOptionDisabled(item_r13, "C"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r13.cCompany);
  }
}
function FactcontactfilterComponent_ng_container_27_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 14)(2, "span", 16);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 17);
    \u0275\u0275listener("click", function FactcontactfilterComponent_ng_container_27_Template_icon_click_4_listener() {
      const i_r15 = \u0275\u0275restoreView(_r14).index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.remove(i_r15, "C"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r16 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r16.cCompany);
  }
}
var FactcontactfilterComponent = class _FactcontactfilterComponent extends BaseNavFilterComponent {
  constructor(cdr, common, contactService) {
    super(cdr);
    this.cdr = cdr;
    this.common = common;
    this.contactService = contactService;
    this.contactFilter = {};
    this.jContacts = [];
    this.jContactsChange = new EventEmitter();
    this.jCRoles = [];
    this.jCRolesChange = new EventEmitter();
    this.jCPartys = [];
    this.jCPartysChange = new EventEmitter();
    this.jCCompanies = [];
    this.jCCompaniesChange = new EventEmitter();
    this.IsContactNote = false;
    this.IsContactNoteChange = new EventEmitter();
    this.onEmitData = new EventEmitter();
    this.role_list = [];
    this.party_list = [];
    this.company_list = [];
    this.contactList = [];
    this.selectedroles = [];
    this.selectedContact = [];
    this.selectedParties = [];
    this.selectedCompanies = [];
    this.resetSelect = null;
  }
  ngOnInit() {
    this.initData();
  }
  ngOnChanges(changes) {
    if (changes["jContacts"] || changes["jCRoles"] || changes["jCPartys"] || changes["jCCompanies"]) {
      if (this.contactList?.length || this.role_list?.length || this.party_list?.length || this.company_list?.length) {
        this.updateSelectedValues();
      }
    }
  }
  updateSelectedValues() {
    if (this.jContacts && this.jContacts.length > 0 && this.contactList?.length) {
      this.selectedContact = this.contactList.filter((contact) => this.jContacts.includes(contact.nContactid));
    } else {
      this.selectedContact = [];
    }
    if (this.jCRoles && this.jCRoles.length > 0 && this.role_list?.length) {
      this.selectedroles = this.role_list.filter((role) => this.jCRoles.includes(role.nCRoleid));
    } else {
      this.selectedroles = [];
    }
    if (this.jCPartys && this.jCPartys.length > 0 && this.party_list?.length) {
      this.selectedParties = this.party_list.filter((party) => this.jCPartys.includes(party.nValue));
    } else {
      this.selectedParties = [];
    }
    if (this.jCCompanies && this.jCCompanies.length > 0 && this.company_list?.length) {
      this.selectedCompanies = this.company_list.filter((company) => this.jCCompanies.includes(company.nCompanyid));
    } else {
      this.selectedCompanies = [];
    }
    this.markForCheck();
  }
  initData() {
    return __async(this, null, function* () {
      try {
        const [roleList, partyList, companyList] = yield Promise.all([
          this.contactService.getContactCaserolelist(this.nCaseid),
          this.common.getCode(22),
          this.contactService.getContactCompany(this.nCaseid)
        ]);
        this.role_list = roleList;
        this.party_list = partyList;
        this.company_list = companyList;
        console.log("party list", this.role_list);
        this.contactList = yield this.contactService.getContactList(this.nCaseid, this.contactFilter);
        setTimeout(() => {
          this.updateSelectedValues();
        }, 0);
      } catch (error) {
        console.error("Error initializing fact contact filter data", error);
      }
    });
  }
  OnValueChnaged(e, flag) {
    const isDisabled = this.isOptionDisabled(e, flag);
    if (isDisabled) {
      return;
    }
    if (flag === "R") {
      const role = e;
      const idx = this.selectedroles.findIndex((selected) => selected.nCRoleid === role.nCRoleid);
      if (idx === -1) {
        this.selectedroles.push(role);
      }
    }
    if (flag === "P") {
      const party = e;
      const idx = this.selectedParties.findIndex((selected) => selected.nValue === party.nValue);
      if (idx === -1) {
        this.selectedParties.push(party);
      }
    }
    if (flag === "C") {
      const company = e;
      const idx = this.selectedCompanies.findIndex((selected) => selected.nCompanyid === company.nCompanyid);
      if (idx === -1) {
        this.selectedCompanies.push(company);
      }
    }
    this.emitData();
    setTimeout(() => {
      this.resetSelect = null;
      this.markForCheck();
    }, 10);
  }
  isOptionDisabled(item, flag) {
    if (flag === "R") {
      return this.selectedroles.some((selected) => selected.nCRoleid === item.nCRoleid);
    }
    if (flag === "P") {
      return this.selectedParties.some((selected) => selected.nValue === item.nValue);
    }
    if (flag === "C") {
      return this.selectedCompanies.some((selected) => selected.nCompanyid === item.nCompanyid);
    }
    return false;
  }
  onActiveContactsChange(user) {
    const idx = this.selectedContact.findIndex((selected) => selected.nContactid === user.nContactid);
    if (idx === -1) {
      this.selectedContact.push(user);
      this.emitData();
    }
  }
  remove(index, flag) {
    if (flag === "R") {
      this.selectedroles.splice(index, 1);
    } else if (flag === "O") {
      this.selectedParties.splice(index, 1);
    } else if (flag === "C") {
      this.selectedCompanies.splice(index, 1);
    } else if (flag === "CN") {
      this.selectedContact.splice(index, 1);
    }
    this.emitData();
  }
  trackByIndex(_index, item) {
    return item?.nContactid ?? item?.nCRoleid ?? item?.nValue ?? item?.nCompanyid ?? _index;
  }
  handleChange() {
    this.emitData();
  }
  removeFilter(flag) {
    this.selectedContact = [];
    this.selectedroles = [];
    this.selectedParties = [];
    this.selectedCompanies = [];
    this.IsContactNote = false;
    const index = this.selectedFilters.indexOf(flag);
    if (index > -1) {
      this.selectedFilters.splice(index, 1);
    }
    this.emitData();
    this.onClear.emit();
  }
  emitData() {
    this.jContacts = this.selectedContact.map((selected) => selected.nContactid);
    this.jCRoles = this.selectedroles.map((selected) => selected.nCRoleid);
    this.jCPartys = this.selectedParties.map((selected) => selected.nValue);
    this.jCCompanies = this.selectedCompanies.map((selected) => selected.nCompanyid);
    this.jContactsChange.emit(this.jContacts);
    this.jCRolesChange.emit(this.jCRoles);
    this.jCPartysChange.emit(this.jCPartys);
    this.jCCompaniesChange.emit(this.jCCompanies);
    this.IsContactNoteChange.emit(this.IsContactNote);
    this.onEmitData.emit();
    this.markForCheck();
  }
  static {
    this.\u0275fac = function FactcontactfilterComponent_Factory(t) {
      return new (t || _FactcontactfilterComponent)(\u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(ContactService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FactcontactfilterComponent, selectors: [["factcontactfilter"]], inputs: { contactFilter: "contactFilter", jContacts: "jContacts", jCRoles: "jCRoles", jCPartys: "jCPartys", jCCompanies: "jCCompanies", IsContactNote: "IsContactNote" }, outputs: { jContactsChange: "jContactsChange", jCRolesChange: "jCRolesChange", jCPartysChange: "jCPartysChange", jCCompaniesChange: "jCCompaniesChange", IsContactNoteChange: "IsContactNoteChange", onEmitData: "onEmitData" }, standalone: true, features: [\u0275\u0275InheritDefinitionFeature, \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 32, vars: 34, consts: [[1, "py-2.5"], [1, "flex", "items-center"], [1, "text-xs", "font-bold"], ["name", "close", 1, "text-xs", "mx-3", 3, "click"], [1, "flex", "flex-wrap", "gap-2", "mt-2"], ["clearOnSelect", "", 1, "block", "w-[264px]", 3, "activeContactsChange", "userList"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "w-full"], ["appendTo", "body", "bindLabel", "cRole", "bindValue", "nCRoleid", 1, "bg-white", "ng-select-main", "w-[198px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "ngModelChange", "clearable", "items", "ngModel", "placeholder"], ["ng-option-tmp", ""], ["appendTo", "body", "bindLabel", "cKey", "bindValue", "nValue", 1, "bg-white", "ng-select-main", "w-[198px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "ngModelChange", "clearable", "items", "ngModel", "placeholder"], ["appendTo", "body", "bindLabel", "cCompany", "bindValue", "nCompanyid", 1, "bg-white", "ng-select-main", "w-[198px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "ngModelChange", "clearable", "items", "ngModel", "placeholder"], [1, "mt-2"], [3, "ngModelChange", "ngModel"], ["mode", "white"], ["size", "sm", 3, "detail"], [1, "text-xs"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "text-xs", "font-normal"]], template: function FactcontactfilterComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h6", 2);
        \u0275\u0275text(3);
        \u0275\u0275pipe(4, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "icon", 3);
        \u0275\u0275listener("click", function FactcontactfilterComponent_Template_icon_click_5_listener() {
          return ctx.removeFilter("C");
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div")(7, "div", 4)(8, "contact-select", 5);
        \u0275\u0275listener("activeContactsChange", function FactcontactfilterComponent_Template_contact_select_activeContactsChange_8_listener($event) {
          return ctx.onActiveContactsChange($event);
        });
        \u0275\u0275elementEnd();
        \u0275\u0275template(9, FactcontactfilterComponent_ng_container_9_Template, 6, 3, "ng-container", 6);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(10, "div", 7)(11, "div", 4)(12, "ng-select", 8);
        \u0275\u0275pipe(13, "translate");
        \u0275\u0275listener("change", function FactcontactfilterComponent_Template_ng_select_change_12_listener($event) {
          return ctx.OnValueChnaged($event, "R");
        });
        \u0275\u0275twoWayListener("ngModelChange", function FactcontactfilterComponent_Template_ng_select_ngModelChange_12_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.resetSelect, $event) || (ctx.resetSelect = $event);
          return $event;
        });
        \u0275\u0275template(14, FactcontactfilterComponent_ng_template_14_Template, 2, 3, "ng-template", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275template(15, FactcontactfilterComponent_ng_container_15_Template, 5, 1, "ng-container", 6);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(16, "div", 7)(17, "div", 4)(18, "ng-select", 10);
        \u0275\u0275pipe(19, "translate");
        \u0275\u0275listener("change", function FactcontactfilterComponent_Template_ng_select_change_18_listener($event) {
          return ctx.OnValueChnaged($event, "P");
        });
        \u0275\u0275twoWayListener("ngModelChange", function FactcontactfilterComponent_Template_ng_select_ngModelChange_18_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.resetSelect, $event) || (ctx.resetSelect = $event);
          return $event;
        });
        \u0275\u0275template(20, FactcontactfilterComponent_ng_template_20_Template, 2, 3, "ng-template", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275template(21, FactcontactfilterComponent_ng_container_21_Template, 5, 1, "ng-container", 6);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(22, "div", 7)(23, "div", 4)(24, "ng-select", 11);
        \u0275\u0275pipe(25, "translate");
        \u0275\u0275listener("change", function FactcontactfilterComponent_Template_ng_select_change_24_listener($event) {
          return ctx.OnValueChnaged($event, "C");
        });
        \u0275\u0275twoWayListener("ngModelChange", function FactcontactfilterComponent_Template_ng_select_ngModelChange_24_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.resetSelect, $event) || (ctx.resetSelect = $event);
          return $event;
        });
        \u0275\u0275template(26, FactcontactfilterComponent_ng_template_26_Template, 2, 3, "ng-template", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275template(27, FactcontactfilterComponent_ng_container_27_Template, 5, 1, "ng-container", 6);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(28, "div", 12)(29, "mat-checkbox", 13);
        \u0275\u0275twoWayListener("ngModelChange", function FactcontactfilterComponent_Template_mat_checkbox_ngModelChange_29_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.IsContactNote, $event) || (ctx.IsContactNote = $event);
          return $event;
        });
        \u0275\u0275listener("ngModelChange", function FactcontactfilterComponent_Template_mat_checkbox_ngModelChange_29_listener() {
          return ctx.handleChange();
        });
        \u0275\u0275text(30);
        \u0275\u0275pipe(31, "translate");
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 24, "FILTERS.CONTACT"));
        \u0275\u0275advance(5);
        \u0275\u0275property("userList", ctx.contactList);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.selectedContact)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance(3);
        \u0275\u0275property("clearable", false)("items", ctx.role_list);
        \u0275\u0275twoWayProperty("ngModel", ctx.resetSelect);
        \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(13, 26, "FILTERS.CHOOSE_ROLE_TYPE"));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.selectedroles)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance(3);
        \u0275\u0275property("clearable", false)("items", ctx.party_list);
        \u0275\u0275twoWayProperty("ngModel", ctx.resetSelect);
        \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(19, 28, "FILTERS.CHOOSE_PARTY"));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.selectedParties)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance(3);
        \u0275\u0275property("clearable", false)("items", ctx.company_list);
        \u0275\u0275twoWayProperty("ngModel", ctx.resetSelect);
        \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(25, 30, "FILTERS.CHOOSE_COMPANY"));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.selectedCompanies)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.IsContactNote);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(31, 32, "FILTERS.NOTE"));
      }
    }, dependencies: [
      CommonModule,
      NgForOf,
      MatRadioModule,
      MatSelectModule,
      IconComponent,
      FormsModule,
      NgControlStatus,
      NgModel,
      ButtonComponent,
      NgSelectModule,
      NgSelectComponent,
      NgOptionTemplateDirective,
      ContactselectComponent,
      AvatarComponent,
      MatCheckboxModule,
      MatCheckbox,
      TranslateModule,
      TranslatePipe
    ], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FactcontactfilterComponent, { className: "FactcontactfilterComponent", filePath: "src\\app\\shared\\components\\nav-filters\\filter-components\\factcontactfilter\\factcontactfilter.component.ts", lineNumber: 40 });
})();

// src/app/shared/components/nav-filters/filter-components/facttaskfilter/facttaskfilter.component.ts
function FacttaskfilterComponent_ng_template_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 25)(2, "div", 26);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r2 = ctx.item;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", item_r2.cSubject, " ");
  }
}
function FacttaskfilterComponent_ng_container_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 27);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.activeTaskItem == null ? null : ctx_r2.activeTaskItem.cSubject);
  }
}
function FacttaskfilterComponent_ng_template_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(1, 1, "FILTERS.SELECT_SUBJECT"));
  }
}
function FacttaskfilterComponent_ng_container_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-option", 28)(2, "div")(3, "div", 25)(4, "div", 29);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("value", x_r4);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(x_r4.cSubject);
  }
}
function FacttaskfilterComponent_ng_container_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 30)(2, "span", 31);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 32);
    \u0275\u0275listener("click", function FacttaskfilterComponent_ng_container_23_Template_icon_click_4_listener() {
      const i_r6 = \u0275\u0275restoreView(_r5).index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.remove(i_r6, "T"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r7 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r7.cSubject);
  }
}
function FacttaskfilterComponent_ng_template_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 33);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r8 = ctx.item;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("text-gray-400", ctx_r2.isOptionDisabled(item_r8, "A"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", item_r8.cFname, " ", item_r8.cLname, " ");
  }
}
function FacttaskfilterComponent_ng_container_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 30)(2, "span", 31);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 32);
    \u0275\u0275listener("click", function FacttaskfilterComponent_ng_container_33_Template_icon_click_4_listener() {
      const i_r10 = \u0275\u0275restoreView(_r9).index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.remove(i_r10, "A"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r11 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", x_r11.cFname, " ", x_r11.cLname, "");
  }
}
function FacttaskfilterComponent_ng_template_38_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 33);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r12 = ctx.item;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("text-gray-400", ctx_r2.isOptionDisabled(item_r12, "S"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r12.cKey);
  }
}
function FacttaskfilterComponent_ng_container_39_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 30)(2, "span", 31);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 32);
    \u0275\u0275listener("click", function FacttaskfilterComponent_ng_container_39_Template_icon_click_4_listener() {
      const i_r14 = \u0275\u0275restoreView(_r13).index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.remove(i_r14, "S"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r15 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r15.cKey);
  }
}
function FacttaskfilterComponent_ng_template_50_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 33);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r16 = ctx.item;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("text-gray-400", ctx_r2.isOptionDisabled(item_r16, "P"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r16.cKey);
  }
}
function FacttaskfilterComponent_ng_container_51_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 30)(2, "span", 31);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 32);
    \u0275\u0275listener("click", function FacttaskfilterComponent_ng_container_51_Template_icon_click_4_listener() {
      const i_r18 = \u0275\u0275restoreView(_r17).index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.remove(i_r18, "P"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r19 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r19.cKey);
  }
}
var FacttaskfilterComponent = class _FacttaskfilterComponent extends BaseNavFilterComponent {
  constructor(common, taskS, cdr) {
    super(cdr);
    this.common = common;
    this.taskS = taskS;
    this.assigneelist = [
      { nValue: "john_doe", cKey: "John Doe" },
      { nValue: "jane_smith", cKey: "Jane Smith" },
      { nValue: "alice_jones", cKey: "Alice Jones" },
      { nValue: "bob_brown", cKey: "Bob Brown" }
    ];
    this.selectedassignee = [];
    this.selectedstatus = [];
    this.selectedpriority = [];
    this.taskList = [];
    this.selectedTaskList = [];
    this.userList = [];
    this.statuslist = [];
    this.prioritylist = [];
    this.selectedDate = null;
    this.jTasks = [];
    this.jTasksChange = new EventEmitter();
    this.IsTaskDesc = false;
    this.IsTaskDescChange = new EventEmitter();
    this.jTShared = [];
    this.jTSharedChange = new EventEmitter();
    this.jTStatus = [];
    this.jTStatusChange = new EventEmitter();
    this.jTPriority = [];
    this.jTPriorityChange = new EventEmitter();
    this.dTDate = "";
    this.dTDateChange = new EventEmitter();
    this.onEmitData = new EventEmitter();
  }
  ngOnInit() {
    this.initData();
  }
  ngOnChanges(changes) {
    if (changes["jTasks"] || changes["jTShared"] || changes["jTStatus"] || changes["jTPriority"] || changes["dTDate"]) {
      if (this.taskList?.length || this.userList?.length || this.statuslist?.length || this.prioritylist?.length) {
        this.updateSelectedValues();
      }
    }
  }
  updateSelectedValues() {
    if (this.jTasks?.length && this.taskList?.length) {
      this.selectedTaskList = this.taskList.filter((task) => this.jTasks.includes(task.nTaskid));
    } else {
      this.selectedTaskList = [];
    }
    if (this.jTShared?.length && this.userList?.length) {
      this.selectedassignee = this.userList.filter((user) => this.jTShared.includes(user.nUserid));
    } else {
      this.selectedassignee = [];
    }
    if (this.jTStatus?.length && this.statuslist?.length) {
      this.selectedstatus = this.statuslist.filter((status) => this.jTStatus.includes(status.nValue));
    } else {
      this.selectedstatus = [];
    }
    if (this.jTPriority?.length && this.prioritylist?.length) {
      this.selectedpriority = this.prioritylist.filter((priority) => this.jTPriority.includes(priority.nValue));
    } else {
      this.selectedpriority = [];
    }
    this.selectedDate = this.dTDate ? new Date(this.dTDate) : null;
    this.IsTaskDesc = !!this.IsTaskDesc;
    this.markForCheck();
  }
  initData() {
    return __async(this, null, function* () {
      const res = yield this.taskS.getTaskList(this.nCaseid, "FT");
      this.userList = yield this.common.getMyTeamUsers(this.nCaseid);
      this.prioritylist = yield this.common.getCode(17);
      this.statuslist = yield this.common.getCode(25);
      if (res?.length) {
        this.taskList = res[0];
      }
      if (this.userList?.length) {
        this.userList = this.userList.filter((user) => user.nUserid != this.nUserid);
      }
      setTimeout(() => {
        this.updateSelectedValues();
      }, 0);
    });
  }
  OnValueChnaged(e, flag) {
    const isdisabled = this.isOptionDisabled(e, flag);
    if (isdisabled) {
      return;
    }
    if (flag === "A") {
      const idx = this.selectedassignee.findIndex((a) => a.nUserid == e.nUserid);
      if (idx === -1)
        this.selectedassignee.push(e);
    }
    if (flag === "S") {
      const idx = this.selectedstatus.findIndex((a) => a.nValue == e.nValue);
      if (idx === -1)
        this.selectedstatus.push(e);
    }
    if (flag === "P") {
      const idx = this.selectedpriority.findIndex((a) => a.nValue == e.nValue);
      if (idx === -1)
        this.selectedpriority.push(e);
    }
    if (flag === "T") {
      const idx = this.selectedTaskList.findIndex((a) => a.nTaskid == e.value.nTaskid);
      if (idx === -1)
        this.selectedTaskList.push(e.value);
    }
    this.emitData();
    setTimeout(() => {
      this.resetSelect = null;
      this.markForCheck();
    }, 10);
  }
  isOptionDisabled(item, flag) {
    if (flag === "A") {
      return this.selectedassignee.some((selected) => selected.nUserid === item.nUserid);
    }
    if (flag === "S") {
      return this.selectedstatus.some((selected) => selected.nValue === item.nValue);
    }
    if (flag === "P") {
      return this.selectedpriority.some((selected) => selected.nValue === item.nValue);
    }
    if (flag === "T") {
      return this.selectedTaskList.some((selected) => selected.nTaskid === item.nTaskid);
    }
    return false;
  }
  remove(index, flag) {
    if (flag === "A")
      this.selectedassignee.splice(index, 1);
    if (flag === "S")
      this.selectedstatus.splice(index, 1);
    if (flag === "P")
      this.selectedpriority.splice(index, 1);
    if (flag === "T")
      this.selectedTaskList.splice(index, 1);
    this.emitData();
  }
  onDateChange(event) {
    this.emitData();
  }
  handleChange() {
    this.emitData();
  }
  removeFilter(flag) {
    this.selectedTaskList = [];
    this.selectedassignee = [];
    this.selectedstatus = [];
    this.selectedpriority = [];
    this.selectedDate = null;
    this.IsTaskDesc = false;
    const index = this.selectedFilters.indexOf(flag);
    if (index > -1) {
      this.selectedFilters.splice(index, 1);
    }
    this.emitData();
    this.onClear.emit();
  }
  emitData() {
    this.jTasks = this.selectedTaskList.map((selected) => selected.nTaskid);
    this.jTShared = this.selectedassignee.map((selected) => selected.nUserid);
    this.jTStatus = this.selectedstatus.map((selected) => selected.nValue);
    this.jTPriority = this.selectedpriority.map((selected) => selected.nValue);
    this.dTDate = this.selectedDate ? this.selectedDate.toString() : "";
    this.jTasksChange.emit(this.jTasks);
    this.jTSharedChange.emit(this.jTShared);
    this.jTStatusChange.emit(this.jTStatus);
    this.jTPriorityChange.emit(this.jTPriority);
    this.dTDateChange.emit(this.dTDate);
    this.IsTaskDescChange.emit(this.IsTaskDesc);
    this.onEmitData.emit();
  }
  trackByIndex(index) {
    return index;
  }
  static {
    this.\u0275fac = function FacttaskfilterComponent_Factory(t) {
      return new (t || _FacttaskfilterComponent)(\u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(TaskService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FacttaskfilterComponent, selectors: [["facttaskfilter"]], inputs: { jTasks: "jTasks", IsTaskDesc: "IsTaskDesc", jTShared: "jTShared", jTStatus: "jTStatus", jTPriority: "jTPriority", dTDate: "dTDate" }, outputs: { jTasksChange: "jTasksChange", IsTaskDescChange: "IsTaskDescChange", jTSharedChange: "jTSharedChange", jTStatusChange: "jTStatusChange", jTPriorityChange: "jTPriorityChange", dTDateChange: "dTDateChange", onEmitData: "onEmitData" }, standalone: true, features: [\u0275\u0275ProvidersFeature([provideNativeDateAdapter()]), \u0275\u0275InheritDefinitionFeature, \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 53, vars: 56, consts: [["noActiveTask", ""], [1, "py-2.5"], [1, "flex", "items-center"], [1, "text-xs", "font-bold"], ["name", "close", 1, "text-xs", "mx-3", 3, "click"], [1, "flex", "flex-wrap", "gap-2", "mt-2"], [1, "border-tab", "border", "rounded-base", "bg-white", "min-w-[264px]"], [1, "flex", "gap-2", "items-center", "relative"], ["width", "14", "height", "15", "viewBox", "0 0 14 15", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "absolute", "left-4"], ["d", "M8.4308 0.640625C6.99106 0.640625 5.61028 1.21256 4.59223 2.23062C3.57417 3.24867 3.00223 4.62945 3.00223 6.0692C3.00223 7.25891 3.38509 8.35891 4.03366 9.25377L0.395947 12.8915C0.23866 13.0465 0.147259 13.2562 0.140794 13.4769C0.134328 13.6976 0.213298 13.9123 0.361243 14.0763C0.509188 14.2402 0.714691 14.3407 0.934921 14.3569C1.15515 14.373 1.37311 14.3035 1.54338 14.1629L1.60852 14.1041L5.24623 10.4663C6.17185 11.1385 7.28687 11.4996 8.4308 11.4978C9.87055 11.4978 11.2513 10.9258 12.2694 9.90777C13.2874 8.88972 13.8594 7.50894 13.8594 6.0692C13.8594 4.62945 13.2874 3.24867 12.2694 2.23062C11.2513 1.21256 9.87055 0.640625 8.4308 0.640625ZM8.4308 2.35491C9.41589 2.35491 10.3606 2.74624 11.0572 3.4428C11.7538 4.13936 12.1451 5.08411 12.1451 6.0692C12.1451 7.05429 11.7538 7.99903 11.0572 8.69559C10.3606 9.39216 9.41589 9.78348 8.4308 9.78348C7.44571 9.78348 6.50097 9.39216 5.80441 8.69559C5.10784 7.99903 4.71652 7.05429 4.71652 6.0692C4.71652 5.08411 5.10784 4.13936 5.80441 3.4428C6.50097 2.74624 7.44571 2.35491 8.4308 2.35491Z", "fill", "CurrentColor"], ["appendTo", "body", "bindLabel", "cSubject", "bindValue", "nTaskid", 1, "pagerefslct", "autocmpltselect", "w-full", "!pe-0", "!ps-9", "h-8.5", "overflow-hidden", 3, "change", "items", "placeholder"], ["ng-option-tmp", ""], [1, "border-t"], ["panelClass", "sortfltrpnl contactnew !p-2.5", "disableOptionCentering", "", 1, "sortfilterslct", "addcont", 3, "ngModelChange", "selectionChange", "ngModel", "placeholder"], [4, "ngIf", "ngIfElse"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "mt-2"], [3, "ngModelChange", "ngModel"], [1, "w-full"], ["appendTo", "body", "bindLabel", "cFname", "bindValue", "nUserid", 1, "bg-white", "ng-select-main", "w-[181px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "ngModelChange", "clearable", "items", "ngModel", "placeholder"], ["appendTo", "body", "bindLabel", "cKey", "bindValue", "nValue", 1, "bg-white", "ng-select-main", "w-[147px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "ngModelChange", "clearable", "items", "ngModel", "placeholder"], [1, "flex", "border", "border-tab", "h-8.5", "w-[166px]", "rounded-base", "items-center", "gap-1", "px-3"], [1, "whitespace-nowrap", "text-xs"], [3, "dateChange", "defaultBlank", "noPlaceholder", "iconOnly", "showrangelabel", "date", "isRange"], ["appendTo", "body", "bindLabel", "cKey", "bindValue", "nValue", 1, "bg-white", "ng-select-main", "w-[154px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "ngModelChange", "clearable", "items", "ngModel", "placeholder"], [1, "px-5", "py-1", "hover:bg-blue-deactivate", "rounded-md", "flex", "text-xs", "items-center", "gap-2.5", "group-[.mdc-list-item--selected]:bg-blue-deactivate", "group-[.mdc-list-item--selected]:font-semibold"], [1, "flex", "items-center", "gap-2"], [1, "flex", "items-center", "justify-between"], [1, "nocheck", "group", "!p-0", "mb-0.5", "last:mb-0", 2, "--mat-option-padding", "0", 3, "value"], [1, "w-[40%]"], ["mode", "white"], [1, "text-xs"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"], [1, "text-xs", "font-normal"]], template: function FacttaskfilterComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "h6", 3);
        \u0275\u0275text(3);
        \u0275\u0275pipe(4, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "icon", 4);
        \u0275\u0275listener("click", function FacttaskfilterComponent_Template_icon_click_5_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.removeFilter("T"));
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div")(7, "div", 5)(8, "div", 6)(9, "div", 7);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(10, "svg", 8);
        \u0275\u0275element(11, "path", 9);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(12, "ng-select", 10);
        \u0275\u0275pipe(13, "translate");
        \u0275\u0275listener("change", function FacttaskfilterComponent_Template_ng_select_change_12_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnValueChnaged({ value: $event }, "T"));
        });
        \u0275\u0275template(14, FacttaskfilterComponent_ng_template_14_Template, 4, 1, "ng-template", 11);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(15, "div", 12)(16, "mat-select", 13);
        \u0275\u0275pipe(17, "translate");
        \u0275\u0275twoWayListener("ngModelChange", function FacttaskfilterComponent_Template_mat_select_ngModelChange_16_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.activeTaskItem, $event) || (ctx.activeTaskItem = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function FacttaskfilterComponent_Template_mat_select_selectionChange_16_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnValueChnaged($event, "T"));
        });
        \u0275\u0275elementStart(18, "mat-select-trigger");
        \u0275\u0275template(19, FacttaskfilterComponent_ng_container_19_Template, 3, 1, "ng-container", 14)(20, FacttaskfilterComponent_ng_template_20_Template, 2, 3, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
        \u0275\u0275elementEnd();
        \u0275\u0275template(22, FacttaskfilterComponent_ng_container_22_Template, 6, 2, "ng-container", 15);
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(23, FacttaskfilterComponent_ng_container_23_Template, 5, 1, "ng-container", 15);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(24, "div", 16)(25, "mat-checkbox", 17);
        \u0275\u0275twoWayListener("ngModelChange", function FacttaskfilterComponent_Template_mat_checkbox_ngModelChange_25_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.IsTaskDesc, $event) || (ctx.IsTaskDesc = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("ngModelChange", function FacttaskfilterComponent_Template_mat_checkbox_ngModelChange_25_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.handleChange());
        });
        \u0275\u0275text(26);
        \u0275\u0275pipe(27, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(28, "div", 18)(29, "div", 5)(30, "ng-select", 19);
        \u0275\u0275pipe(31, "translate");
        \u0275\u0275listener("change", function FacttaskfilterComponent_Template_ng_select_change_30_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnValueChnaged($event, "A"));
        });
        \u0275\u0275twoWayListener("ngModelChange", function FacttaskfilterComponent_Template_ng_select_ngModelChange_30_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.resetSelect, $event) || (ctx.resetSelect = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275template(32, FacttaskfilterComponent_ng_template_32_Template, 2, 4, "ng-template", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275template(33, FacttaskfilterComponent_ng_container_33_Template, 5, 2, "ng-container", 15);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(34, "div", 18)(35, "div", 5)(36, "ng-select", 20);
        \u0275\u0275pipe(37, "translate");
        \u0275\u0275listener("change", function FacttaskfilterComponent_Template_ng_select_change_36_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnValueChnaged($event, "S"));
        });
        \u0275\u0275twoWayListener("ngModelChange", function FacttaskfilterComponent_Template_ng_select_ngModelChange_36_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.resetSelect, $event) || (ctx.resetSelect = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275template(38, FacttaskfilterComponent_ng_template_38_Template, 2, 3, "ng-template", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275template(39, FacttaskfilterComponent_ng_container_39_Template, 5, 1, "ng-container", 15);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(40, "div", 5)(41, "div", 21)(42, "span", 22);
        \u0275\u0275text(43);
        \u0275\u0275pipe(44, "translate");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(45, "datepicker", 23);
        \u0275\u0275twoWayListener("dateChange", function FacttaskfilterComponent_Template_datepicker_dateChange_45_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selectedDate, $event) || (ctx.selectedDate = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("dateChange", function FacttaskfilterComponent_Template_datepicker_dateChange_45_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onDateChange($event));
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(46, "div", 18)(47, "div", 5)(48, "ng-select", 24);
        \u0275\u0275pipe(49, "translate");
        \u0275\u0275listener("change", function FacttaskfilterComponent_Template_ng_select_change_48_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.OnValueChnaged($event, "P"));
        });
        \u0275\u0275twoWayListener("ngModelChange", function FacttaskfilterComponent_Template_ng_select_ngModelChange_48_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.resetSelect, $event) || (ctx.resetSelect = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275template(50, FacttaskfilterComponent_ng_template_50_Template, 2, 3, "ng-template", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275template(51, FacttaskfilterComponent_ng_container_51_Template, 5, 1, "ng-container", 15);
        \u0275\u0275elementEnd();
        \u0275\u0275element(52, "div");
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        const noActiveTask_r20 = \u0275\u0275reference(21);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 40, "FILTERS.TASK"));
        \u0275\u0275advance(9);
        \u0275\u0275propertyInterpolate("placeholder", \u0275\u0275pipeBind1(13, 42, "FILTERS.CHOOSE_TYPE_KEYWORD"));
        \u0275\u0275property("items", ctx.taskList);
        \u0275\u0275advance(4);
        \u0275\u0275propertyInterpolate("placeholder", \u0275\u0275pipeBind1(17, 44, "FILTERS.SELECT_SUBJECT"));
        \u0275\u0275twoWayProperty("ngModel", ctx.activeTaskItem);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.activeTaskItem)("ngIfElse", noActiveTask_r20);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.taskList)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.selectedTaskList)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.IsTaskDesc);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(27, 46, "FILTERS.DESCRIPTION"));
        \u0275\u0275advance(4);
        \u0275\u0275propertyInterpolate("placeholder", \u0275\u0275pipeBind1(31, 48, "FILTERS.CHOOSE_ASSIGNEE"));
        \u0275\u0275property("clearable", false)("items", ctx.userList);
        \u0275\u0275twoWayProperty("ngModel", ctx.resetSelect);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.selectedassignee)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance(3);
        \u0275\u0275propertyInterpolate("placeholder", \u0275\u0275pipeBind1(37, 50, "FILTERS.CHOOSE_STATUS"));
        \u0275\u0275property("clearable", false)("items", ctx.statuslist);
        \u0275\u0275twoWayProperty("ngModel", ctx.resetSelect);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.selectedstatus)("ngForTrackBy", ctx.trackByIndex);
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(44, 52, "FILTERS.DUE_DATE"));
        \u0275\u0275advance(2);
        \u0275\u0275classMap(!ctx.selectedDate ? "w-8.5" : "w-[115px]");
        \u0275\u0275property("defaultBlank", true)("noPlaceholder", true)("iconOnly", false)("showrangelabel", true);
        \u0275\u0275twoWayProperty("date", ctx.selectedDate);
        \u0275\u0275property("isRange", false);
        \u0275\u0275advance(3);
        \u0275\u0275propertyInterpolate("placeholder", \u0275\u0275pipeBind1(49, 54, "FILTERS.CHOOSE_PRIORITY"));
        \u0275\u0275property("clearable", false)("items", ctx.prioritylist);
        \u0275\u0275twoWayProperty("ngModel", ctx.resetSelect);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.selectedpriority)("ngForTrackBy", ctx.trackByIndex);
      }
    }, dependencies: [
      MatRadioModule,
      MatSelectModule,
      MatSelect,
      MatSelectTrigger,
      MatOption,
      CommonModule,
      NgForOf,
      NgIf,
      TranslateModule,
      TranslatePipe,
      IconComponent,
      FormsModule,
      NgControlStatus,
      NgModel,
      ButtonComponent,
      NgSelectModule,
      NgSelectComponent,
      NgOptionTemplateDirective,
      MatCheckboxModule,
      MatCheckbox,
      MatFormFieldModule,
      MatInputModule,
      MatDatepickerModule,
      MatButtonModule,
      DatepickerComponent
    ], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FacttaskfilterComponent, { className: "FacttaskfilterComponent", filePath: "src\\app\\shared\\components\\nav-filters\\filter-components\\facttaskfilter\\facttaskfilter.component.ts", lineNumber: 50 });
})();

// src/app/shared/components/nav-filters/filter-components/claims/claims.component.ts
function ClaimsComponent_ng_template_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r1 = ctx.item;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275classProp("text-gray-400", ctx_r1.isOptionDisabled(item_r1));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r1.cCategory);
  }
}
function ClaimsComponent_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 9)(2, "span", 10);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 11);
    \u0275\u0275listener("click", function ClaimsComponent_ng_container_9_Template_icon_click_4_listener() {
      const i_r4 = \u0275\u0275restoreView(_r3).index;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.remove(i_r4));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r5.cCategory);
  }
}
var ClaimsComponent = class _ClaimsComponent {
  constructor(issue, cdr) {
    this.issue = issue;
    this.cdr = cdr;
    this.selectedFilters = [];
    this.jClaims = [];
    this.jClaimsChange = new EventEmitter();
    this.onClear = new EventEmitter();
    this.claimList = [];
    this.selectedClaims = [];
  }
  ngOnInit() {
    void this.loadClaimList();
  }
  loadClaimList() {
    return __async(this, null, function* () {
      this.claimList = yield this.issue.getCategory(this.nCaseid, this.nUserid);
      setTimeout(() => this.updateSelectedClaims(), 0);
    });
  }
  ngOnChanges(changes) {
    if (changes["jClaims"]) {
      if (this.claimList?.length) {
        this.updateSelectedClaims();
      }
    }
  }
  updateSelectedClaims() {
    if (this.jClaims && this.jClaims.length > 0 && this.claimList?.length) {
      this.selectedClaims = this.claimList.filter((item) => this.jClaims.includes(item.nICid));
    } else {
      this.selectedClaims = [];
    }
    this.cdr.detectChanges();
  }
  isOptionDisabled(item) {
    return this.selectedClaims.some((selected) => selected.nICid === item.nICid);
  }
  removeFilter(flag) {
    this.selectedClaims = [];
    const index = this.selectedFilters.indexOf(flag);
    if (index > -1) {
      this.selectedFilters.splice(index, 1);
    }
    this.emitData();
    this.onClear.emit();
  }
  OnValueChnaged(e) {
    const idx = this.selectedClaims.findIndex((selected) => selected.nICid === e.nICid);
    if (idx === -1) {
      this.selectedClaims.push(e);
      this.emitData();
    }
    setTimeout(() => {
      this.resetSelect = null;
    }, 10);
  }
  remove(index) {
    this.selectedClaims.splice(index, 1);
    this.emitData();
  }
  trackByIndex(_index, item) {
    return item?.nICid ?? _index;
  }
  emitData() {
    this.jClaims = this.selectedClaims.map((item) => item.nICid);
    this.jClaimsChange.emit(this.jClaims);
  }
  static {
    this.\u0275fac = function ClaimsComponent_Factory(t) {
      return new (t || _ClaimsComponent)(\u0275\u0275directiveInject(IssueService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ClaimsComponent, selectors: [["claims"]], inputs: { nCaseid: "nCaseid", nUserid: "nUserid", selectedFilters: "selectedFilters", jClaims: "jClaims" }, outputs: { jClaimsChange: "jClaimsChange", onClear: "onClear" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 10, vars: 8, consts: [[1, "py-2.5"], [1, "flex", "items-center"], [1, "text-xs", "font-bold"], ["name", "close", 1, "text-xs", "mx-3", 3, "click"], [1, "flex", "flex-wrap", "gap-2", "mt-2"], ["appendTo", "body", "bindLabel", "cCategory", "bindValue", "nICid", "placeholder", "Type/choose claim name ", 1, "bg-white", "ng-select-main", "w-[198px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "ngModelChange", "clearable", "items", "ngModel"], ["ng-option-tmp", ""], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "text-xs", "font-normal"], ["mode", "white"], [1, "text-xs"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"]], template: function ClaimsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h6", 2);
        \u0275\u0275text(3);
        \u0275\u0275pipe(4, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "icon", 3);
        \u0275\u0275listener("click", function ClaimsComponent_Template_icon_click_5_listener() {
          return ctx.removeFilter("CL");
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 4)(7, "ng-select", 5);
        \u0275\u0275listener("change", function ClaimsComponent_Template_ng_select_change_7_listener($event) {
          return ctx.OnValueChnaged($event);
        });
        \u0275\u0275twoWayListener("ngModelChange", function ClaimsComponent_Template_ng_select_ngModelChange_7_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.resetSelect, $event) || (ctx.resetSelect = $event);
          return $event;
        });
        \u0275\u0275template(8, ClaimsComponent_ng_template_8_Template, 2, 3, "ng-template", 6);
        \u0275\u0275elementEnd();
        \u0275\u0275template(9, ClaimsComponent_ng_container_9_Template, 5, 1, "ng-container", 7);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 6, "FILTERS.CLAIMS"));
        \u0275\u0275advance(4);
        \u0275\u0275property("clearable", false)("items", ctx.claimList);
        \u0275\u0275twoWayProperty("ngModel", ctx.resetSelect);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngForOf", ctx.selectedClaims)("ngForTrackBy", ctx.trackByIndex);
      }
    }, dependencies: [CommonModule, NgForOf, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective, IconComponent, ButtonComponent, FormsModule, NgControlStatus, NgModel, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ClaimsComponent, { className: "ClaimsComponent", filePath: "src\\app\\shared\\components\\nav-filters\\filter-components\\claims\\claims.component.ts", lineNumber: 18 });
})();

// src/app/shared/components/nav-filters/filter-components/issues/issues.component.ts
function IssuesComponent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 2)(2, "b", 3);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 1, "COMMON.LOADING"));
  }
}
function IssuesComponent_ng_template_1_ng_template_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16);
    \u0275\u0275element(1, "span", 17);
    \u0275\u0275elementStart(2, "b", 3);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r3 = ctx.item;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275styleProp("background", "#" + item_r3.cColor);
    \u0275\u0275advance();
    \u0275\u0275classProp("text-gray-400", ctx_r1.isOptionDisabled(item_r3, "I"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r3.cIName);
  }
}
function IssuesComponent_ng_template_1_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 18)(2, "span", 19);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 20);
    \u0275\u0275listener("click", function IssuesComponent_ng_template_1_ng_container_10_Template_icon_click_4_listener() {
      const i_r5 = \u0275\u0275restoreView(_r4).index;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.remove(i_r5, "I"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r6 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r6.cIName);
  }
}
function IssuesComponent_ng_template_1_ng_template_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 3);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r7 = ctx.item;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("text-gray-400", ctx_r1.isOptionDisabled(item_r7, "R"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r7.cKey);
  }
}
function IssuesComponent_ng_template_1_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 18)(2, "span", 19);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 20);
    \u0275\u0275listener("click", function IssuesComponent_ng_template_1_ng_container_15_Template_icon_click_4_listener() {
      const i_r9 = \u0275\u0275restoreView(_r8).index;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.remove(i_r9, "R"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r10 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r10.cKey);
  }
}
function IssuesComponent_ng_template_1_ng_template_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "b", 3);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r11 = ctx.item;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("text-gray-400", ctx_r1.isOptionDisabled(item_r11, "IM"));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r11.cKey);
  }
}
function IssuesComponent_ng_template_1_ng_container_20_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 18)(2, "span", 19);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "icon", 20);
    \u0275\u0275listener("click", function IssuesComponent_ng_template_1_ng_container_20_Template_icon_click_4_listener() {
      const i_r13 = \u0275\u0275restoreView(_r12).index;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.remove(i_r13, "IM"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r14 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r14.cKey);
  }
}
function IssuesComponent_ng_template_1_ng_container_25_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-checkbox", 14);
    \u0275\u0275twoWayListener("ngModelChange", function IssuesComponent_ng_template_1_ng_container_25_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.IsFactlink, $event) || (ctx_r1.IsFactlink = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function IssuesComponent_ng_template_1_ng_container_25_Template_mat_checkbox_ngModelChange_1_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.handleChange());
    });
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-checkbox", 14);
    \u0275\u0275twoWayListener("ngModelChange", function IssuesComponent_ng_template_1_ng_container_25_Template_mat_checkbox_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.IsComment, $event) || (ctx_r1.IsComment = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function IssuesComponent_ng_template_1_ng_container_25_Template_mat_checkbox_ngModelChange_4_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.handleChange());
    });
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.IsFactlink);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 4, "FILTERS.FACT_LINK"));
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.IsComment);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 6, "FILTERS.COMMENT"));
  }
}
function IssuesComponent_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "h6", 6);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "icon", 7);
    \u0275\u0275listener("click", function IssuesComponent_ng_template_1_Template_icon_click_5_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.removeall("I"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 8)(7, "ng-select", 9);
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275listener("change", function IssuesComponent_ng_template_1_Template_ng_select_change_7_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnValueChnaged($event, "I"));
    });
    \u0275\u0275twoWayListener("ngModelChange", function IssuesComponent_ng_template_1_Template_ng_select_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.resetSelect, $event) || (ctx_r1.resetSelect = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275template(9, IssuesComponent_ng_template_1_ng_template_9_Template, 4, 5, "ng-template", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, IssuesComponent_ng_template_1_ng_container_10_Template, 5, 1, "ng-container", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 8)(12, "ng-select", 12);
    \u0275\u0275pipe(13, "translate");
    \u0275\u0275twoWayListener("ngModelChange", function IssuesComponent_ng_template_1_Template_ng_select_ngModelChange_12_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.resetSelect, $event) || (ctx_r1.resetSelect = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function IssuesComponent_ng_template_1_Template_ng_select_change_12_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnValueChnaged($event, "R"));
    });
    \u0275\u0275template(14, IssuesComponent_ng_template_1_ng_template_14_Template, 2, 3, "ng-template", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275template(15, IssuesComponent_ng_template_1_ng_container_15_Template, 5, 1, "ng-container", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "div", 8)(17, "ng-select", 12);
    \u0275\u0275pipe(18, "translate");
    \u0275\u0275twoWayListener("ngModelChange", function IssuesComponent_ng_template_1_Template_ng_select_ngModelChange_17_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.resetSelect, $event) || (ctx_r1.resetSelect = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function IssuesComponent_ng_template_1_Template_ng_select_change_17_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.OnValueChnaged($event, "IM"));
    });
    \u0275\u0275template(19, IssuesComponent_ng_template_1_ng_template_19_Template, 2, 3, "ng-template", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275template(20, IssuesComponent_ng_template_1_ng_container_20_Template, 5, 1, "ng-container", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "div", 13)(22, "mat-checkbox", 14);
    \u0275\u0275twoWayListener("ngModelChange", function IssuesComponent_ng_template_1_Template_mat_checkbox_ngModelChange_22_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.IsNote, $event) || (ctx_r1.IsNote = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function IssuesComponent_ng_template_1_Template_mat_checkbox_ngModelChange_22_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.handleChange());
    });
    \u0275\u0275text(23);
    \u0275\u0275pipe(24, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(25, IssuesComponent_ng_template_1_ng_container_25_Template, 7, 8, "ng-container", 15);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 22, "FILTERS.ISSUE"));
    \u0275\u0275advance(4);
    \u0275\u0275propertyInterpolate("placeholder", \u0275\u0275pipeBind1(8, 24, "NAVFILTERS.CLAIMS_PLACEHOLDER"));
    \u0275\u0275property("clearable", false)("items", ctx_r1.issueList);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.resetSelect);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.selectedIssues)("ngForTrackBy", ctx_r1.trackByIndex);
    \u0275\u0275advance(2);
    \u0275\u0275propertyInterpolate("placeholder", \u0275\u0275pipeBind1(13, 26, "FILTERS.CHOOSE_RELEVANCE"));
    \u0275\u0275property("clearable", false)("items", ctx_r1.relevance);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.resetSelect);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.selectedRelavance)("ngForTrackBy", ctx_r1.trackByIndex);
    \u0275\u0275advance(2);
    \u0275\u0275propertyInterpolate("placeholder", \u0275\u0275pipeBind1(18, 28, "FILTERS.CHOOSE_IMPACT"));
    \u0275\u0275property("clearable", false)("items", ctx_r1.impact);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.resetSelect);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.selectedImpact)("ngForTrackBy", ctx_r1.trackByIndex);
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.IsNote);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(24, 30, "FILTERS.NOTE"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.tab != "QF");
  }
}
var IssuesComponent = class _IssuesComponent {
  ngDoCheck() {
    console.log("[IssuesComponent] jIssues:", this.jIssues, "jRels:", this.jRels, "jImps:", this.jImps, "IsNote:", this.IsNote, "IsFactlink:", this.IsFactlink, "IsComment:", this.IsComment);
  }
  constructor(issue, common, cdr) {
    this.issue = issue;
    this.common = common;
    this.cdr = cdr;
    this.selectedFilters = [];
    this.onClear = new EventEmitter();
    this.issueList = [];
    this.relevance = [];
    this.impact = [];
    this.jIssues = [];
    this.jIssuesChange = new EventEmitter();
    this.jRels = [];
    this.jRelsChange = new EventEmitter();
    this.jImps = [];
    this.jImpsChange = new EventEmitter();
    this.isLoading = true;
    this.IsNoteChange = new EventEmitter();
    this.IsFactlinkChange = new EventEmitter();
    this.IsCommentChange = new EventEmitter();
    this.selectedIssues = [];
    this.selectedRelavance = [];
    this.selectedImpact = [];
    this.onEmitData = new EventEmitter();
  }
  ngOnInit() {
    this.initData();
  }
  ngOnChanges(changes) {
    if (changes["jIssues"] || changes["jRels"] || changes["jImps"] || changes["IsNote"] || changes["IsFactlink"] || changes["IsComment"]) {
      if (this.issueList?.length || this.relevance?.length || this.impact?.length) {
        this.updateSelectedValues();
      }
    }
  }
  updateSelectedValues() {
    if (this.jIssues && this.jIssues.length > 0 && this.issueList?.length) {
      this.selectedIssues = this.issueList.filter((issue) => this.jIssues.includes(issue.nIid));
    } else {
      this.selectedIssues = [];
    }
    if (this.jRels && this.jRels.length > 0 && this.relevance?.length) {
      this.selectedRelavance = this.relevance.filter((rel) => this.jRels.includes(rel.nValue));
    } else {
      this.selectedRelavance = [];
    }
    if (this.jImps && this.jImps.length > 0 && this.impact?.length) {
      this.selectedImpact = this.impact.filter((imp) => this.jImps.includes(imp.nValue));
    } else {
      this.selectedImpact = [];
    }
    this.cdr.detectChanges();
  }
  initData() {
    return __async(this, null, function* () {
      try {
        this.issueList = [];
        this.relevance = [];
        this.impact = [];
        this.issueList = yield this.issue.fetchIssueList({ nCaseid: this.nCaseid, nSessionid: null, nIDid: null, nUserid: this.nUserid });
        this.relevance = yield this.common.getCode(4);
        this.impact = yield this.common.getCode(5);
        setTimeout(() => {
          this.updateSelectedValues();
        }, 0);
        this.isLoading = false;
        this.cdr.detectChanges();
      } catch (error) {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  removeall(flag) {
    this.selectedIssues = [];
    this.selectedRelavance = [];
    this.selectedImpact = [];
    this.IsNote = false;
    this.IsFactlink = false;
    this.IsComment = false;
    const index = this.selectedFilters.indexOf(flag);
    if (index > -1) {
      this.selectedFilters.splice(index, 1);
    }
    this.emitData();
    this.onClear.emit();
  }
  isOptionDisabled(item, flag) {
    if (flag == "I") {
      return this.selectedIssues.some((selected) => selected.nIid === item.nIid);
    }
    if (flag == "R") {
      return this.selectedRelavance.some((selected) => selected.nValue === item.nValue);
    }
    if (flag == "IM") {
      return this.selectedImpact.some((selected) => selected.nValue === item.nValue);
    }
    return false;
  }
  OnValueChnaged(e, flag) {
    if (flag == "R") {
      const idx = this.selectedRelavance.findIndex((selected) => selected.nValue === e.nValue);
      if (idx == -1) {
        this.selectedRelavance.push(e);
      }
    }
    if (flag == "IM") {
      const idx = this.selectedImpact.findIndex((selected) => selected.nValue === e.nValue);
      if (idx == -1) {
        this.selectedImpact.push(e);
      }
    }
    if (flag == "I") {
      const idx = this.selectedIssues.findIndex((selected) => selected.nIid === e.nIid);
      if (idx == -1) {
        this.selectedIssues.push(e);
      }
    }
    this.emitData();
    setTimeout(() => {
      this.resetSelect = null;
    }, 10);
  }
  remove(index, flag) {
    if (flag == "I") {
      this.selectedIssues.splice(index, 1);
    }
    if (flag == "R") {
      this.selectedRelavance.splice(index, 1);
    }
    if (flag == "IM") {
      this.selectedImpact.splice(index, 1);
    }
    this.emitData();
  }
  selectAllIssues() {
    if (this.selectedIssues.length == this.issueList.length) {
      this.selectedIssues = [];
    } else {
      this.selectedIssues = this.issueList;
    }
    this.emitData();
  }
  handleChange() {
    this.emitData();
  }
  emitData() {
    this.jIssues = this.selectedIssues.map((item) => item.nIid);
    this.jRels = this.selectedRelavance.map((item) => item.nValue);
    this.jImps = this.selectedImpact.map((item) => item.nValue);
    this.jIssuesChange.emit(this.jIssues);
    this.jRelsChange.emit(this.jRels);
    this.jImpsChange.emit(this.jImps);
    this.IsNoteChange.emit(this.IsNote);
    this.IsFactlinkChange.emit(this.IsFactlink);
    this.IsCommentChange.emit(this.IsComment);
    this.onEmitData.emit();
  }
  trackByIndex(index) {
    return index;
  }
  static {
    this.\u0275fac = function IssuesComponent_Factory(t) {
      return new (t || _IssuesComponent)(\u0275\u0275directiveInject(IssueService), \u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _IssuesComponent, selectors: [["issues"]], inputs: { nCaseid: "nCaseid", nUserid: "nUserid", selectedFilters: "selectedFilters", jIssues: "jIssues", jRels: "jRels", jImps: "jImps", IsNote: "IsNote", IsFactlink: "IsFactlink", IsComment: "IsComment", tab: "tab" }, outputs: { onClear: "onClear", jIssuesChange: "jIssuesChange", jRelsChange: "jRelsChange", jImpsChange: "jImpsChange", IsNoteChange: "IsNoteChange", IsFactlinkChange: "IsFactlinkChange", IsCommentChange: "IsCommentChange", onEmitData: "onEmitData" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 2, consts: [["loaded", ""], [4, "ngIf", "ngIfElse"], [1, "flex", "items-center", "justify-center", "h-full"], [1, "text-xs", "font-normal"], [1, "py-2.5"], [1, "flex", "items-center"], [1, "text-xs", "font-bold"], ["name", "close", 1, "text-xs", "mx-3", 3, "click"], [1, "flex", "flex-wrap", "gap-2", "mt-2"], ["appendTo", "body", "bindLabel", "cIName", "bindValue", "cIName", 1, "bg-white", "ng-select-main", "w-[198px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "ngModelChange", "clearable", "items", "ngModel", "placeholder"], ["ng-option-tmp", ""], [4, "ngFor", "ngForOf", "ngForTrackBy"], ["appendTo", "body", "bindLabel", "cKey", "bindValue", "cKey", 1, "bg-white", "ng-select-main", "w-[198px]", "!border", "!border-tab", "!rounded-base", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "ngModelChange", "change", "clearable", "items", "ngModel", "placeholder"], [1, "flex", "items-center", "gap-2.5", "mt-2", "mb-2"], [3, "ngModelChange", "ngModel"], [4, "ngIf"], [1, "flex", "items-center", "gap-1"], [1, "rounded-base", "h-3.5", "w-1", "bg-red-400"], ["mode", "white"], [1, "text-xs"], ["name", "backspace", "type", "extra", 1, "text-sm", 3, "click"]], template: function IssuesComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, IssuesComponent_ng_container_0_Template, 5, 3, "ng-container", 1)(1, IssuesComponent_ng_template_1_Template, 26, 32, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
      }
      if (rf & 2) {
        const loaded_r16 = \u0275\u0275reference(2);
        \u0275\u0275property("ngIf", ctx.isLoading)("ngIfElse", loaded_r16);
      }
    }, dependencies: [CommonModule, NgForOf, NgIf, TranslateModule, TranslatePipe, IconComponent, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective, FormsModule, NgControlStatus, NgModel, ButtonComponent, MatCheckboxModule, MatCheckbox] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(IssuesComponent, { className: "IssuesComponent", filePath: "src\\app\\shared\\components\\nav-filters\\filter-components\\issues\\issues.component.ts", lineNumber: 22 });
})();

export {
  DateFormComponent,
  ContactselectComponent,
  NAV_FILTER,
  FILTER_ITEM,
  FILTER_LIST,
  QFACT_DATE_TYPE,
  FactdetailfilterComponent,
  BaseNavFilterComponent,
  FactcontactfilterComponent,
  FacttaskfilterComponent,
  ClaimsComponent,
  IssuesComponent
};
//# sourceMappingURL=chunk-T3YYYCBS.js.map
