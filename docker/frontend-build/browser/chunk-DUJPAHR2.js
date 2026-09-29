import {
  ExportService
} from "./chunk-I73XWCPJ.js";
import {
  IssueService
} from "./chunk-ZD7ZVGXK.js";
import {
  ContactService
} from "./chunk-5HHWKW4L.js";
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
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MAT_DIALOG_DATA,
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
  FormsModule,
  NgControlStatus,
  NgControlStatusGroup,
  ReactiveFormsModule,
  ɵNgNoValidate
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction3,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/components/export-pdf/export-form/export-form.component.ts
var _c0 = (a0) => ({ "!hidden": a0 });
var _c1 = (a0) => ({ "background": a0 });
var _c2 = (a0, a1, a2) => ({ cFname: a0, cLname: a1, cProfile: a2 });
function ExportFormComponent_For_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 47);
    \u0275\u0275listener("click", function ExportFormComponent_For_9_Template_div_click_0_listener() {
      const item_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.selectFile(item_r3));
    });
    \u0275\u0275element(1, "img", 48);
    \u0275\u0275elementStart(2, "h6", 49);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r3 = ctx.$implicit;
    \u0275\u0275classProp("shadow-[0_3px_10px_#94949440]", item_r3.checked);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(item_r3.cFilename);
  }
}
function ExportFormComponent_For_47_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 52)(1, "div", 53)(2, "span", 54);
    \u0275\u0275element(3, "icon", 55)(4, "icon", 56);
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "span", 57);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const y_r8 = ctx.$implicit;
    const x_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(4, _c0, !(x_r7 == null ? null : x_r7.isopen)))("value", y_r8.nIid);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(6, _c1, "#" + y_r8.cColor));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", y_r8.cIName, " ");
  }
}
function ExportFormComponent_For_47_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-optgroup", 35)(1, "div", 50);
    \u0275\u0275listener("click", function ExportFormComponent_For_47_Template_div_click_1_listener() {
      const x_r7 = \u0275\u0275restoreView(_r6).$implicit;
      return \u0275\u0275resetView(x_r7.isopen = !x_r7.isopen);
    });
    \u0275\u0275text(2);
    \u0275\u0275element(3, "icon", 51);
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(4, ExportFormComponent_For_47_For_5_Template, 7, 8, "mat-option", 52, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r7 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r7.cCategory, " ");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(x_r7.sublist);
  }
}
function ExportFormComponent_div_48_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 60)(1, "span", 61);
    \u0275\u0275element(2, "span", 62);
    \u0275\u0275text(3);
    \u0275\u0275elementStart(4, "span", 63)(5, "icon", 64);
    \u0275\u0275listener("click", function ExportFormComponent_div_48_div_1_Template_icon_click_5_listener() {
      const x_r10 = \u0275\u0275restoreView(_r9).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.removels(x_r10, "SelectedFact", "jFIssue", "nIid"));
    });
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r10 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(3, _c1, "#" + x_r10.cColor));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", x_r10.cIName, " (", x_r10.cCategory, ") ");
  }
}
function ExportFormComponent_div_48_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 58);
    \u0275\u0275template(1, ExportFormComponent_div_48_div_1_Template, 6, 5, "div", 59);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r3.SelectedFact);
  }
}
function ExportFormComponent_For_59_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 38);
    \u0275\u0275element(1, "avtr", 65);
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r12 = ctx.$implicit;
    \u0275\u0275property("value", x_r12.nContactid);
    \u0275\u0275advance();
    \u0275\u0275property("matTooltip", x_r12.cFname + x_r12.cLname)("detail", \u0275\u0275pureFunction3(4, _c2, x_r12.cFname, x_r12.cLname, x_r12.cProfile));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r12.cFname + " " + x_r12.cLname);
  }
}
function ExportFormComponent_div_60_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 60)(1, "span", 61);
    \u0275\u0275element(2, "avtr", 65);
    \u0275\u0275elementStart(3, "span", 63)(4, "span");
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "icon", 66);
    \u0275\u0275listener("click", function ExportFormComponent_div_60_div_1_Template_icon_click_6_listener() {
      const x_r14 = \u0275\u0275restoreView(_r13).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.removels(x_r14, "SelectedContact", "jFContact", "nContactid"));
    });
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r14 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", x_r14.cFname + x_r14.cLname)("detail", \u0275\u0275pureFunction3(3, _c2, x_r14.cFname, x_r14.cLname, x_r14.cProfile));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(x_r14.cFname + " " + x_r14.cLname);
  }
}
function ExportFormComponent_div_60_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 58);
    \u0275\u0275template(1, ExportFormComponent_div_60_div_1_Template, 7, 7, "div", 59);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r3.SelectedContact);
  }
}
function ExportFormComponent_For_68_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 67);
    \u0275\u0275listener("click", function ExportFormComponent_For_68_Template_span_click_0_listener() {
      const x_r16 = \u0275\u0275restoreView(_r15).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.changeFont(x_r16.type, "cQFsize"));
    });
    \u0275\u0275element(1, "icon", 68);
    \u0275\u0275elementStart(2, "span", 69);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r16 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", x_r16.type == ctx_r3.frm.value.cQFsize ? "!text-blue-on !bg-blue-100 !border-blue-on border-2 hover:shadow-[inset_0px_0px_4px_0px_#9FCCFF] shadow-[inset_0px_0px_4px_0px_#9FCCFF]" : "!bg-white");
    \u0275\u0275advance();
    \u0275\u0275property("name", "textF");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r16.name);
  }
}
function ExportFormComponent_For_79_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 52)(1, "div", 53)(2, "span", 54);
    \u0275\u0275element(3, "icon", 55)(4, "icon", 56);
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "span", 57);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const y_r20 = ctx.$implicit;
    const x_r19 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(4, _c0, !(x_r19 == null ? null : x_r19.isopen)))("value", y_r20.nIid);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(6, _c1, "#" + y_r20.cColor));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", y_r20.cIName, " ");
  }
}
function ExportFormComponent_For_79_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-optgroup", 35)(1, "div", 50);
    \u0275\u0275listener("click", function ExportFormComponent_For_79_Template_div_click_1_listener() {
      const x_r19 = \u0275\u0275restoreView(_r18).$implicit;
      return \u0275\u0275resetView(x_r19.isopen = !x_r19.isopen);
    });
    \u0275\u0275text(2);
    \u0275\u0275element(3, "icon", 51);
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(4, ExportFormComponent_For_79_For_5_Template, 7, 8, "mat-option", 52, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r19 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r19.cCategory, " ");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(x_r19.sublist);
  }
}
function ExportFormComponent_div_80_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 60)(1, "span", 61);
    \u0275\u0275element(2, "span", 62);
    \u0275\u0275text(3);
    \u0275\u0275elementStart(4, "span", 63)(5, "icon", 64);
    \u0275\u0275listener("click", function ExportFormComponent_div_80_div_1_Template_icon_click_5_listener() {
      const x_r22 = \u0275\u0275restoreView(_r21).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.removels(x_r22, "SelectedQFact", "jQFIssue", "nIid"));
    });
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r22 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(3, _c1, "#" + x_r22.cColor));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", x_r22.cIName, " (", x_r22.cCategory, ") ");
  }
}
function ExportFormComponent_div_80_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 58);
    \u0275\u0275template(1, ExportFormComponent_div_80_div_1_Template, 6, 5, "div", 59);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r3.SelectedQFact);
  }
}
function ExportFormComponent_For_88_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 67);
    \u0275\u0275listener("click", function ExportFormComponent_For_88_Template_span_click_0_listener() {
      const x_r24 = \u0275\u0275restoreView(_r23).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.changeFont(x_r24.type, "cDsize"));
    });
    \u0275\u0275element(1, "icon", 68);
    \u0275\u0275elementStart(2, "span", 69);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r24 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", x_r24.type == ctx_r3.frm.value.cDsize ? "!text-blue-on !bg-blue-100 !border-blue-on border-2 hover:shadow-[inset_0px_0px_4px_0px_#9FCCFF] shadow-[inset_0px_0px_4px_0px_#9FCCFF]" : "!bg-white");
    \u0275\u0275advance();
    \u0275\u0275property("name", "textF");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r24.name);
  }
}
function ExportFormComponent_Conditional_89_Template(rf, ctx) {
  if (rf & 1) {
    const _r25 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 70);
    \u0275\u0275listener("click", function ExportFormComponent_Conditional_89_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r25);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.isAdvanced = !ctx_r3.isAdvanced);
    });
    \u0275\u0275text(1, " Advanced Setup ");
    \u0275\u0275elementEnd();
  }
}
function ExportFormComponent_Conditional_90_Template(rf, ctx) {
  if (rf & 1) {
    const _r26 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 71);
    \u0275\u0275listener("click", function ExportFormComponent_Conditional_90_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r26);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.submit());
    });
    \u0275\u0275elementStart(1, "btn", 72);
    \u0275\u0275text(2, "Export");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("isloading", ctx_r3.isLoading);
  }
}
function ExportFormComponent_Conditional_91_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "input", 85);
  }
  if (rf & 2) {
    \u0275\u0275property("placeholder", "1-10,12");
  }
}
function ExportFormComponent_Conditional_91_Template(rf, ctx) {
  if (rf & 1) {
    const _r27 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "section", 46)(1, "div", 27)(2, "div", 73)(3, "btn", 74);
    \u0275\u0275listener("click", function ExportFormComponent_Conditional_91_Template_btn_click_3_listener() {
      \u0275\u0275restoreView(_r27);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.isAdvanced = !ctx_r3.isAdvanced);
    });
    \u0275\u0275text(4, " Advance Setup ");
    \u0275\u0275elementStart(5, "span", 75);
    \u0275\u0275element(6, "icon", 76);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(7, "label", 77)(8, "mat-checkbox", 78);
    \u0275\u0275text(9, "Cover Page");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "label", 79)(11, "h6", 80);
    \u0275\u0275text(12, "Pages: ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "mat-radio-group", 81)(14, "mat-radio-button", 82);
    \u0275\u0275text(15, "All");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "mat-radio-button", 83)(17, "span", 84);
    \u0275\u0275text(18, " Page Range");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(19, ExportFormComponent_Conditional_91_Conditional_19_Template, 1, 1, "input", 85);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "div", 27)(21, "div", 86)(22, "span", 87);
    \u0275\u0275text(23, "Page Setup");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(24, "label", 77)(25, "h6", 80);
    \u0275\u0275text(26, "Orientation: ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "mat-radio-group", 88)(28, "mat-radio-button", 82);
    \u0275\u0275text(29, "Auto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(30, "mat-radio-button", 89);
    \u0275\u0275text(31, "All Portrait");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(32, "label", 79)(33, "h6", 80);
    \u0275\u0275text(34, "Scale: ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(35, "mat-checkbox", 90)(36, "span", 84);
    \u0275\u0275text(37, "Fit to Page");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(38, "mat-select", 91)(39, "mat-option", 92);
    \u0275\u0275text(40, "A4");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(41, "mat-option", 93);
    \u0275\u0275text(42, "A3");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(43, "mat-option", 94);
    \u0275\u0275text(44, "A2");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(45, "div", 95)(46, "btn", 96);
    \u0275\u0275listener("click", function ExportFormComponent_Conditional_91_Template_btn_click_46_listener() {
      \u0275\u0275restoreView(_r27);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.submit());
    });
    \u0275\u0275text(47, " Export");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(19);
    \u0275\u0275conditional(19, ctx_r3.frm.value.cPages == "R" ? 19 : -1);
    \u0275\u0275advance(27);
    \u0275\u0275property("isloading", ctx_r3.isLoading)("disabled", !ctx_r3.jFiles.length);
  }
}
var ExportFormComponent = class _ExportFormComponent {
  constructor(commonService, issueService, contactService, store, exportserice, cdr, tost, dialogRef, data) {
    this.commonService = commonService;
    this.issueService = issueService;
    this.contactService = contactService;
    this.store = store;
    this.exportserice = exportserice;
    this.cdr = cdr;
    this.tost = tost;
    this.dialogRef = dialogRef;
    this.data = data;
    this.isAdvanced = false;
    this.issueList = [];
    this.contactList = [];
    this.gropuIssueList = [];
    this.SelectedFact = [];
    this.SelectedQFact = [];
    this.SelectedContact = [];
    this.SelectedQContact = [];
    this.SelectedQ = [];
    this.icons = [
      { name: "Small", icon: "textF", type: "S", toolTip: "Highlighter" },
      { name: "Normal", icon: "textF", type: "N", toolTip: "Freehand" },
      { name: "Large", icon: "textF", type: "L", toolTip: "Shape" }
    ];
    this.downloadPath = `${environment.cloudUrl}${environment.downloadpath}realtime-transcripts/exports/`;
    this.isLoading = false;
    this.cTranscript = "N";
    this.filelist = [];
    this.isAllselected = false;
    this.isChecked = false;
    this.nCaseid = data.nCaseid;
    this.jFiles = data.jFiles;
    this.jFolders = data.jFolders;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.fetchIssues();
      this.fetchFiles();
      this.fetchContact();
      this.frm = new FormGroup({
        // nTaskid: new FormControl(null),
        cTranscript: new FormControl(this.cTranscript),
        bPagination: new FormControl(false),
        cPdftype: new FormControl("S"),
        bFact: new FormControl(true),
        cFsize: new FormControl("S"),
        jFIssue: new FormControl([]),
        jFContact: new FormControl([]),
        bQfact: new FormControl(true),
        cQFsize: new FormControl("S"),
        jQFIssue: new FormControl([]),
        jQFContact: new FormControl([]),
        bDoc: new FormControl(true),
        cDsize: new FormControl("S"),
        bAdvanced: new FormControl(false),
        bCoverpg: new FormControl(true),
        cPages: new FormControl("A"),
        cPagerange: new FormControl(""),
        cOrientation: new FormControl("A"),
        bFitpg: new FormControl(true),
        cPgsize: new FormControl("A4")
      });
      this.userdetail = yield this.store.getUserInfo();
    });
  }
  changeFont(type, key) {
    this.frm.controls[key].setValue(type);
    console.log(this.frm.value);
  }
  fetchFiles() {
    return __async(this, null, function* () {
      const res = yield this.exportserice.getFilelist(this.jFiles, this.jFolders);
      this.filelist = res;
      this.filelist.map((item) => item.checked = true);
      this.isAllselected = true;
      this.cdr.detectChanges();
    });
  }
  selectAll() {
    this.isAllselected = !this.isAllselected;
    this.filelist.forEach((item) => item.checked = this.isAllselected);
    this.cdr.detectChanges();
  }
  selectFile(item) {
    item.checked = !item.checked;
    this.isAllselected = this.filelist.every((item2) => item2.checked);
  }
  fetchIssues() {
    return __async(this, null, function* () {
      this.issueList = [];
      this.issueList = yield this.issueService.fetchIssueList(this.nCaseid);
      console.log("issueList", this.issueList);
      const groupedIssueList = Object.values(this.issueList.reduce((acc, item) => {
        const { nICid, cCategory } = item;
        if (!acc[nICid]) {
          acc[nICid] = {
            nICid,
            cCategory,
            sublist: []
          };
        }
        acc[nICid].sublist.push(item);
        return acc;
      }, {}));
      this.gropuIssueList = groupedIssueList;
      this.cdr.detectChanges();
    });
  }
  fetchContact() {
    return __async(this, null, function* () {
      this.contactList = [];
      this.contactList = yield this.contactService.getContactList(this.nCaseid);
      console.log("issueList", this.contactList);
      this.cdr.detectChanges();
    });
  }
  // changeIssue(id, key) {
  //   this.frm.value[key] = [...this.frm.value[key], id];
  // }
  checkAll(key, listnm, key1) {
    this.frm.patchValue({ [key]: this[listnm].map((item) => item[key1]) });
    this.cdr.detectChanges();
  }
  submit() {
    return __async(this, null, function* () {
      try {
        if (!this.filelist.length)
          return;
        const jFiles = this.filelist.filter((item) => item.checked);
        if (!jFiles.length) {
          this.tost.error("Please select pdf files for export");
          return;
        }
        const isAllPdf = this.isAllFilesPDF(jFiles);
        if (!isAllPdf) {
          this.tost.error("Please select only pdf files");
          return;
        }
        let mdl = this.frm.value;
        mdl.nCaseid = this.nCaseid;
        mdl.jPages = [];
        mdl.jQFIssue = Array.isArray(mdl.jQFIssue) ? mdl.jQFIssue.filter((a) => typeof a === "string" && a.trim().length > 0) : [];
        mdl.jFIssue = Array.isArray(mdl.jFIssue) ? mdl.jFIssue.filter((a) => typeof a === "string" && a.trim().length > 0) : [];
        mdl.jQFContact = Array.isArray(mdl.jQFContact) ? mdl.jQFContact.filter((a) => typeof a === "string" && a.trim().length > 0) : [];
        mdl.jFContact = Array.isArray(mdl.jFContact) ? mdl.jFContact.filter((a) => typeof a === "string" && a.trim().length > 0) : [];
        if (mdl.cPages === "R" && mdl.cPagerange) {
          mdl.jPages = this.parsePageRange(this.frm.value.cPagerange);
        }
        mdl.jFiles = jFiles.map((item) => item.nBundledetailid);
        delete mdl.cPagerange;
        delete mdl.cPages;
        delete mdl.bAdvanced;
        if (this.isLoading)
          return;
        this.isLoading = true;
        this.cdr.detectChanges();
        const res = yield this.exportserice.exportFilewithannot(mdl);
        this.isLoading = false;
        this.cdr.detectChanges();
        if (res) {
          if (res.msg == 1) {
            this.dialogRef.close(true);
          }
        }
      } catch (error) {
      }
    });
  }
  changeIssue(list, key, key1, key2) {
    this[key] = this[list].filter((item) => this.frm.value[key1].includes(item[key2]));
    this.cdr.detectChanges();
  }
  removels(x, key, key1, key2) {
    this[key] = this[key].filter((item) => item[key2] !== x[key2]);
    this.frm.patchValue({ [key1]: this[key].map((item) => item[key2]) });
  }
  parsePageRange(pageRange) {
    let result = /* @__PURE__ */ new Set();
    let ranges = pageRange.split(",");
    ranges.forEach((range) => {
      if (range.includes("-")) {
        let [start, end] = range.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            result.add(i);
          }
        }
      } else {
        let num = Number(range);
        if (!isNaN(num)) {
          result.add(num);
        }
      }
    });
    return Array.from(result).sort((a, b) => a - b);
  }
  downloadURI(uri, name) {
    const fileName = `${this.downloadPath}${uri}?id:${Math.random()}`;
    this.commonService.downloadFile(fileName).subscribe((blob) => {
      this.dialogRef.close();
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = name;
      a.click();
      URL.revokeObjectURL(objectUrl);
    }, (error) => {
      console.error("Download error:", error);
      this.tost.error("Failed to download");
    });
  }
  isAllFilesPDF(fileList) {
    return fileList.every((file) => file.cFiletype?.toUpperCase() === "PDF");
  }
  static {
    this.\u0275fac = function ExportFormComponent_Factory(t) {
      return new (t || _ExportFormComponent)(\u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(IssueService), \u0275\u0275directiveInject(ContactService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(ExportService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ExportFormComponent, selectors: [["app-export-form"]], inputs: { nCaseid: "nCaseid" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 92, vars: 29, consts: [["hasselect", ""], ["hascontactselect", ""], ["hasissueselect", ""], [1, "flex", "py-5", "overflow-hidden", 3, "formGroup"], [1, "bg-white", "rounded-xl", "min-w-[450px]", "max-w-[450px]", "overflow-auto", "h-[85vh]"], [1, "flex", "items-center", "w-full", "px-5"], [1, "flex", "items-center", "text-lg", "font-bold", "mb-2", "me-auto"], ["mode", "text", 3, "click"], [1, "flex", "flex-col", "gap-3", "min-h-24", "max-h-52", "py-4", "overflow-auto", "px-5"], [1, "p-5", "w-full", "flex", "gap-6", "bg-white", "rounded-base", "cursor-pointer", "items-center", 3, "shadow-[0_3px_10px_#94949440]"], ["for", "notify", 1, "pt-5", "flex", "flex-col", "gap-2.5", "px-5"], [1, "text-xs", "mb-2", "font-semibold"], [1, "flex", "items-center", "gap-3", "pb-2.5"], ["formControlName", "cPdftype", 1, "flex", "gap-2.5", "w-full", 3, "align"], [1, "w-full", "whitespace-nowrap", "text-xs", "shadow-[0px_2px_7px_#00000024]", "px-2", "py-3", "rounded-base", "border", "border-transparent", "hover:border-orange", "hover:bg-[#ff3d002e]", "group", "!cursor-pointer", 3, "value"], ["width", "20", "height", "20", "viewBox", "0 0 26 27", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "s-ion-icon", "group-hover:!text-orange"], ["d", "M16.1 25.7266H22.7C23.1774 25.7266 23.6352 25.5035 23.9728 25.1063C24.3104 24.7092 24.5 24.1705 24.5 23.6089V7.01927C24.5001 6.90783 24.4815 6.79747 24.4452 6.69451C24.409 6.59155 24.3558 6.49802 24.2888 6.41927L20.5112 1.97504C20.4441 1.89602 20.3644 1.83339 20.2767 1.79075C20.189 1.7481 20.0949 1.72629 20 1.72657H8.3C7.82261 1.72657 7.36477 1.94967 7.02721 2.34681C6.68964 2.74394 6.5 3.28258 6.5 3.84421V14.272", "stroke", "currentColor", "stroke-width", "1.78208", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M19.5908 6.36279V2.20851C19.591 2.11314 19.6165 2.01996 19.6643 1.94072C19.712 1.86149 19.7798 1.79974 19.8591 1.76327C19.9383 1.72679 20.0256 1.71723 20.1097 1.73579C20.1939 1.75435 20.2712 1.8002 20.3319 1.86754L24.3713 6.35734C24.4325 6.4246 24.4743 6.51059 24.4913 6.60436C24.5084 6.69812 24.4999 6.7954 24.467 6.88379C24.4341 6.97218 24.3782 7.04766 24.3065 7.10062C24.2349 7.15357 24.1506 7.18159 24.0646 7.1811H20.327C20.1318 7.1811 19.9445 7.09489 19.8065 6.94143C19.6684 6.78796 19.5908 6.57982 19.5908 6.36279V6.36279Z", "fill", "currentColor", "stroke", "currentColor", "stroke-width", "1.78208", "stroke-linecap", "round", "stroke-linejoin", "round"], ["fill-rule", "evenodd", "clip-rule", "evenodd", "d", "M6.73727 18.3594L13.2716 22.3157L6.73727 26.2721L6.73727 23.2068L1.39104 23.2068C0.898931 23.2068 0.5 22.8078 0.5 22.3157C0.5 21.8236 0.898931 21.4247 1.39104 21.4247L6.73727 21.4247L6.73727 18.3594Z", "fill", "currentColor"], [1, "group-hover:!text-orange", "ms-2"], [1, "w-full", "whitespace-nowrap", "text-xs", "shadow-[0px_2px_7px_#00000024]", "px-2", "py-3", "rounded-base", "border", "border-transparent", "hover:border-orange", "hover:bg-[#ff3d002e]", "group", "!cursor-pointer", 3, "value", "disabled"], ["width", "20", "height", "20", "viewBox", "0 0 27 24", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "s-ion-icon", "group-hover:!text-orange"], ["d", "M10.8716 1.79688H20.859L25.5899 6.52776V19.6691", "stroke", "currentColor", "stroke-width", "1.57696", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M15.0765 22.8234H20.8587C21.2769 22.8234 21.678 22.6573 21.9738 22.3615C22.2695 22.0658 22.4356 21.6647 22.4356 21.2465V8.89253C22.4357 8.80954 22.4194 8.72736 22.3876 8.65069C22.3559 8.57402 22.3093 8.50437 22.2506 8.44572L18.9411 5.1362C18.8823 5.07736 18.8125 5.03072 18.7356 4.99897C18.6588 4.96721 18.5764 4.95097 18.4932 4.95117H8.24298C7.82474 4.95117 7.42364 5.11732 7.1279 5.41306C6.83216 5.70879 6.66602 6.1099 6.66602 6.52814V13.3616", "stroke", "currentColor", "stroke-width", "1.57696", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M18.2305 8.52496V5.32267C18.2306 5.24916 18.2525 5.17734 18.2934 5.11626C18.3343 5.05518 18.3924 5.00758 18.4603 4.97946C18.5282 4.95135 18.6029 4.94398 18.6751 4.95829C18.7472 4.97259 18.8134 5.00793 18.8655 5.05985L22.3264 8.52075C22.3788 8.5726 22.4146 8.63889 22.4292 8.71117C22.4438 8.78344 22.4365 8.85843 22.4083 8.92656C22.3801 8.9947 22.3323 9.05288 22.2709 9.0937C22.2095 9.13452 22.1373 9.15612 22.0635 9.15574H18.8613C18.694 9.15574 18.5335 9.08929 18.4152 8.97099C18.2969 8.85269 18.2305 8.69225 18.2305 8.52496V8.52496Z", "fill", "currentColor", "stroke", "currentColor", "stroke-width", "1.57696", "stroke-linecap", "round", "stroke-linejoin", "round"], ["fill-rule", "evenodd", "clip-rule", "evenodd", "d", "M6.92025 16.5156L12.7024 20.0166L6.92025 23.5176L6.92025 20.8051L2.18936 20.8051C1.75389 20.8051 1.40088 20.4521 1.40088 20.0166C1.40088 19.5811 1.75389 19.2281 2.18936 19.2281L6.92025 19.2281L6.92025 16.5156Z", "fill", "currentColor"], ["formControlName", "bPagination", 1, "text-xs"], [1, "flex", "items-center", "gap-3", "bg-grey", "py-1", "h-[65px]", "px-4"], ["formControlName", "bFact", 1, "text-xs"], [1, "!text-white"], [1, "mt-3"], ["formControlName", "jFIssue", "id", "nPriority", "multiple", "", "placeholder", "Select Issues...", 1, "w-full", "!border", "!rounded-base", 3, "selectionChange", "panelClass"], [1, "nocheck", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "p-2", "rounded-base", "hover:bg-reply", 3, "click"], [1, "mx-3", "my-2"], [1, "issdropgrup"], ["class", "flex bg-grey rounded-xl gap-2.5 p-2.5 max-w-[810px] flex-wrap mt-3", 4, "ngIf"], ["formControlName", "jFContact", "id", "nPriority", "multiple", "", "placeholder", "Select Contact...", 1, "w-full", "!border", "!rounded-base", 3, "selectionChange", "panelClass"], [1, "ps-3", "nocheck", "group", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], ["formControlName", "bQfact", 1, "text-xs"], [1, "flex", "h-12", "items-center", "gap-x-2", "[&>span]:cursor-pointer", "ms-auto"], [1, "flex", "rounded-base", "p-1.5", "hover:text-blue-on", "flex-col", "items-center", "!max-w-[55px]", "!min-w-[55px]", 3, "ngClass"], ["formControlName", "jQFIssue", "id", "nPriority", "multiple", "", "placeholder", "Select Issues...", 1, "w-full", "!border", "!rounded-base", 3, "selectionChange", "panelClass"], ["formControlName", "bDoc", 1, "text-xs"], ["mode", "text", 1, "text-end"], [1, "flex", "items-center", "gap-3", "mt-6", "px-5"], [1, "flex", "flex-col", "px-5", "bg-white", "border-l", "min-w-[450px]", "max-w-[450px]", "pt-9"], [1, "p-5", "w-full", "flex", "gap-6", "bg-white", "rounded-base", "cursor-pointer", "items-center", 3, "click"], ["src", "./assets/icons/doc-icons/pdf.svg", 1, "thumbnail", "size-8"], [1, "text-xs", "font-semibold", "brak-word", "truncate", "w-[calc(100%_-_100px)]"], [1, "flex", "gap-2.5", "text-xs", "font-semibold", "items-center", "cursor-pointer", 3, "click"], ["name", "chvy", 1, "-rotate-90"], [1, "ps-3", "nocheck", "group", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "ngClass", "value"], [1, "flex", "gap-2.5", "rounded-base", "py-1", "items-center", "ps-6", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-on", "hover:bg-blue-deactivate"], [1, "relative", "size-4", "flex", "items-center", "justify-center"], ["name", "addcircle", 1, "opacity-0", "group-hover:opacity-100", "text-base", "abolute", "group-[&.mdc-list-item--selected]:hidden"], ["name", "removecircle", 1, "abolute", "hidden", "text-base", "group-[&.mdc-list-item--selected]:inline-block"], [1, "h-3", "w-1", "rounded-2xl", "block", 3, "ngStyle"], [1, "flex", "bg-grey", "rounded-xl", "gap-2.5", "p-2.5", "max-w-[810px]", "flex-wrap", "mt-3"], ["class", "text-sm font-medium flex items-center p-2 px-3 bg-white rounded-xl gap-3 ", 4, "ngFor", "ngForOf"], [1, "text-sm", "font-medium", "flex", "items-center", "p-2", "px-3", "bg-white", "rounded-xl", "gap-3"], [1, "flex", "items-center", "gap-2", "text-xs"], [1, "rounded-base", "h-3.5", "w-1", "bg-red-400", 3, "ngStyle"], [1, "flex"], ["name", "backspace", "type", "extra", 1, "text-lg", 3, "click"], ["size", "sm", 3, "matTooltip", "detail"], ["name", "backspace", "type", "extra", 1, "text-lg", "ms-2", 3, "click"], [1, "flex", "rounded-base", "p-1.5", "hover:text-blue-on", "flex-col", "items-center", "!max-w-[55px]", "!min-w-[55px]", 3, "click", "ngClass"], ["type", "indicn", 1, "text-xl", "flex", "mx-auto", 3, "name"], [1, "text-xs"], ["mode", "text", 1, "text-end", 3, "click"], [1, "flex", "items-center", "gap-3", "mt-6", "px-5", 3, "click"], ["mode", "solid", 1, "w-full", 3, "isloading"], [1, "flex", "items-center", "gap-2", "ms-auto"], ["mode", "outlined", "addcls", "rounded-full !py-1 !pe-1 font-semibold   !ps-2 !bg-blue-deactivate hover:!bg-blue-deactivate !text-blue-on", 3, "click"], [1, "bg-blue-on", "size-5", "text-white", "rounded-full", "grid", "place-items-center", "rotate-180"], ["name", "chvx", "type", "comnicn", 1, "text-xxs"], ["for", "notify", 1, "py-2", "flex", "items-center", "gap-3", "!pt-3"], ["formControlName", "bCoverpg", 1, "text-xs"], ["for", "notify", 1, "py-2", "flex", "items-center", "gap-3", "!pb-3"], [1, "text-xs", "font-semibold"], ["formControlName", "cPages", 1, "flex", "items-center", "gap-3"], ["value", "A", 1, "text-xs"], ["value", "R", 1, "text-xs"], [1, "whitespace-nowrap"], ["type", "text", "formControlName", "cPagerange", 1, "w-20", 3, "placeholder"], [1, "flex", "items-center", "gap-2", "o"], [1, "text-xs", "text-white"], ["formControlName", "cOrientation", 1, "flex", "items-center", "gap-3"], ["value", "P", 1, "text-xs"], ["formControlName", "bFitpg", 1, "text-xs"], ["formControlName", "cPgsize", "placeholder", "Select issue", 1, "w-full", "!border", "!rounded-base"], ["value", "A4"], ["value", "A3"], ["value", "A2"], [1, "flex", "items-center", "gap-3", "mt-auto"], ["mode", "solid", 1, "w-full", 3, "click", "isloading", "disabled"]], template: function ExportFormComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "form", 3)(1, "section", 4)(2, "div", 5)(3, "h1", 6);
        \u0275\u0275text(4, " Export ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "btn", 7);
        \u0275\u0275listener("click", function ExportFormComponent_Template_btn_click_5_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.selectAll());
        });
        \u0275\u0275text(6);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "div", 8);
        \u0275\u0275repeaterCreate(8, ExportFormComponent_For_9_Template, 4, 3, "div", 9, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(10, "label", 10)(11, "h6", 11);
        \u0275\u0275text(12, "Export as: ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "div", 12)(14, "mat-radio-group", 13)(15, "mat-radio-button", 14);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(16, "svg", 15);
        \u0275\u0275element(17, "path", 16)(18, "path", 17)(19, "path", 18);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(20, "span", 19);
        \u0275\u0275text(21, "Single PDF");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(22, "mat-radio-button", 20);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(23, "svg", 21);
        \u0275\u0275element(24, "path", 22)(25, "path", 23)(26, "path", 24)(27, "path", 25);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(28, "span", 19);
        \u0275\u0275text(29, "Multiple PDF");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(30, "mat-checkbox", 26);
        \u0275\u0275text(31, "Pagination");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(32, "div")(33, "div", 27)(34, "mat-checkbox", 28)(35, "span", 29);
        \u0275\u0275text(36, "Fact:");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(37, "div", 30)(38, "mat-select", 31, 0);
        \u0275\u0275listener("selectionChange", function ExportFormComponent_Template_mat_select_selectionChange_38_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.changeIssue("issueList", "SelectedFact", "jFIssue", "nIid"));
        });
        \u0275\u0275elementStart(40, "mat-select-trigger");
        \u0275\u0275text(41, " Select Issues... ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(42, "mat-option", 32)(43, "div", 33);
        \u0275\u0275listener("click", function ExportFormComponent_Template_div_click_43_listener() {
          \u0275\u0275restoreView(_r1);
          const hasselect_r5 = \u0275\u0275reference(39);
          ctx.checkAll("jFIssue", "issueList", "nIid");
          return \u0275\u0275resetView(hasselect_r5.close());
        });
        \u0275\u0275text(44, " All Issue ");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(45, "hr", 34);
        \u0275\u0275repeaterCreate(46, ExportFormComponent_For_47_Template, 6, 1, "mat-optgroup", 35, \u0275\u0275repeaterTrackByIdentity);
        \u0275\u0275elementEnd();
        \u0275\u0275template(48, ExportFormComponent_div_48_Template, 2, 1, "div", 36);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(49, "div", 30)(50, "mat-select", 37, 1);
        \u0275\u0275listener("selectionChange", function ExportFormComponent_Template_mat_select_selectionChange_50_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.changeIssue("contactList", "SelectedContact", "jFContact", "nContactid"));
        });
        \u0275\u0275elementStart(52, "mat-select-trigger");
        \u0275\u0275text(53);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(54, "mat-option", 32)(55, "div", 33);
        \u0275\u0275listener("click", function ExportFormComponent_Template_div_click_55_listener() {
          \u0275\u0275restoreView(_r1);
          const hascontactselect_r11 = \u0275\u0275reference(51);
          ctx.checkAll("jFContact", "contactList", "nContactid");
          return \u0275\u0275resetView(hascontactselect_r11.close());
        });
        \u0275\u0275text(56, " All Contact ");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(57, "hr", 34);
        \u0275\u0275repeaterCreate(58, ExportFormComponent_For_59_Template, 4, 8, "mat-option", 38, \u0275\u0275repeaterTrackByIdentity);
        \u0275\u0275elementEnd();
        \u0275\u0275template(60, ExportFormComponent_div_60_Template, 2, 1, "div", 36);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(61, "div")(62, "div", 27)(63, "mat-checkbox", 39)(64, "span", 29);
        \u0275\u0275text(65, "qFact:");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(66, "div", 40);
        \u0275\u0275repeaterCreate(67, ExportFormComponent_For_68_Template, 4, 3, "span", 41, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(69, "div", 30)(70, "mat-select", 42, 2);
        \u0275\u0275listener("selectionChange", function ExportFormComponent_Template_mat_select_selectionChange_70_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.changeIssue("issueList", "SelectedQFact", "jQFIssue", "nIid"));
        });
        \u0275\u0275elementStart(72, "mat-select-trigger");
        \u0275\u0275text(73, " Select Issues... ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(74, "mat-option", 32)(75, "div", 33);
        \u0275\u0275listener("click", function ExportFormComponent_Template_div_click_75_listener() {
          \u0275\u0275restoreView(_r1);
          const hasissueselect_r17 = \u0275\u0275reference(71);
          ctx.checkAll("jQFIssue", "issueList", "nIid");
          return \u0275\u0275resetView(hasissueselect_r17.close());
        });
        \u0275\u0275text(76, " All Issue ");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(77, "hr", 34);
        \u0275\u0275repeaterCreate(78, ExportFormComponent_For_79_Template, 6, 1, "mat-optgroup", 35, \u0275\u0275repeaterTrackByIdentity);
        \u0275\u0275elementEnd();
        \u0275\u0275template(80, ExportFormComponent_div_80_Template, 2, 1, "div", 36);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(81, "div")(82, "div", 27)(83, "mat-checkbox", 43)(84, "span", 29);
        \u0275\u0275text(85, "Doc Link:");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(86, "div", 40);
        \u0275\u0275repeaterCreate(87, ExportFormComponent_For_88_Template, 4, 3, "span", 41, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(89, ExportFormComponent_Conditional_89_Template, 2, 0, "btn", 44);
        \u0275\u0275elementEnd();
        \u0275\u0275template(90, ExportFormComponent_Conditional_90_Template, 3, 1, "div", 45);
        \u0275\u0275elementEnd();
        \u0275\u0275template(91, ExportFormComponent_Conditional_91_Template, 48, 3, "section", 46);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275property("formGroup", ctx.frm);
        \u0275\u0275advance(6);
        \u0275\u0275textInterpolate1(" ", ctx.isAllselected ? "Deselect All" : "Select All", "");
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.filelist);
        \u0275\u0275advance(6);
        \u0275\u0275property("align", "start");
        \u0275\u0275advance();
        \u0275\u0275property("value", "S");
        \u0275\u0275advance(7);
        \u0275\u0275property("value", "M")("disabled", ctx.filelist.length < 2);
        \u0275\u0275advance(15);
        \u0275\u0275classProp("!hidden", !ctx.frm.value.bFact);
        \u0275\u0275advance();
        \u0275\u0275property("panelClass", ctx.SelectedFact.length ? "-mt-7" : "");
        \u0275\u0275advance(4);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(4);
        \u0275\u0275repeater(ctx.gropuIssueList);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.SelectedFact.length);
        \u0275\u0275advance();
        \u0275\u0275classProp("!hidden", !ctx.frm.value.bFact);
        \u0275\u0275advance();
        \u0275\u0275property("panelClass", ctx.SelectedContact.length ? "-mt-7" : "");
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1(" Select Contact... ", ctx.SelectedContact.length, " ");
        \u0275\u0275advance();
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(4);
        \u0275\u0275repeater(ctx.contactList);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.SelectedContact.length);
        \u0275\u0275advance(6);
        \u0275\u0275classProp("!hidden", !ctx.frm.value.bQfact);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.icons);
        \u0275\u0275advance(2);
        \u0275\u0275classProp("!hidden", !ctx.frm.value.bQfact);
        \u0275\u0275advance();
        \u0275\u0275property("panelClass", ctx.SelectedFact.length ? "-mt-7" : "");
        \u0275\u0275advance(4);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(4);
        \u0275\u0275repeater(ctx.gropuIssueList);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.SelectedQFact.length);
        \u0275\u0275advance(6);
        \u0275\u0275classProp("!hidden", !ctx.frm.value.bDoc);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.icons);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(89, !ctx.isAdvanced ? 89 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(90, !ctx.isAdvanced ? 90 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(91, ctx.isAdvanced ? 91 : -1);
      }
    }, dependencies: [FormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, CommonModule, NgClass, NgForOf, NgIf, NgStyle, MatCheckboxModule, MatCheckbox, MatSelectModule, MatSelect, MatSelectTrigger, MatOption, MatOptgroup, IconComponent, ButtonComponent, MatRadioModule, MatRadioGroup, MatRadioButton, ReactiveFormsModule, FormGroupDirective, FormControlName, MatFormFieldModule, AvatarComponent, MatTooltipModule, MatTooltip], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ExportFormComponent, { className: "ExportFormComponent", filePath: "src\\app\\userpanel\\components\\export-pdf\\export-form\\export-form.component.ts", lineNumber: 34 });
})();

export {
  ExportFormComponent
};
//# sourceMappingURL=chunk-DUJPAHR2.js.map
