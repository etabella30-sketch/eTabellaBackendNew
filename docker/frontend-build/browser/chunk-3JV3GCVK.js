import {
  CreateissueComponent
} from "./chunk-2SQPIY4Q.js";
import {
  IssueService
} from "./chunk-ZD7ZVGXK.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  MatSelect,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField,
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  MatDialog
} from "./chunk-UVEQGFJV.js";
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
  ɵɵNgOnChangesFeature,
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
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/issues/choose-issue/choose-issue.component.ts
var _c0 = (a0, a1) => ({ "max-h-[300px]": a0, "max-h-[180px]": a1 });
var _c1 = (a0, a1) => ({ "p-2.5": a0, "p-0": a1 });
var _c2 = () => [1, 2, 3, 4, 5, 6, 7];
var _c3 = (a0) => ({ "background": a0 });
var _c4 = (a0) => ({ "--textwodth": a0 });
var _c5 = (a0, a1) => ({ "bg-gray-100": a0, "underline": a1 });
var _c6 = (a0, a1) => ({ "bg-faint px-2.5": a0, "bg-reply": a1 });
function ChooseIssueComponent_Conditional_1_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275element(1, "span", 5)(2, "span", 6)(3, "span", 7);
    \u0275\u0275elementEnd();
  }
}
function ChooseIssueComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, ChooseIssueComponent_Conditional_1_For_1_Template, 4, 0, "div", 4, \u0275\u0275repeaterTrackByIndex);
  }
  if (rf & 2) {
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c2));
  }
}
function ChooseIssueComponent_For_4_Conditional_10_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 16);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", ctx_r2.getCKey(x_r2.nRelid, "R"), " ");
  }
}
function ChooseIssueComponent_For_4_Conditional_10_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 17);
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275property("src", "assets/icons/impact/" + x_r2.nImpactid + ".png", \u0275\u0275sanitizeUrl);
  }
}
function ChooseIssueComponent_For_4_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275template(1, ChooseIssueComponent_For_4_Conditional_10_Conditional_1_Template, 2, 1, "span", 16)(2, ChooseIssueComponent_For_4_Conditional_10_Conditional_2_Template, 1, 1, "img", 17);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275conditional(1, x_r2.nRelid ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, x_r2.nImpactid ? 2 : -1);
  }
}
function ChooseIssueComponent_For_4_Conditional_11_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 20);
  }
}
function ChooseIssueComponent_For_4_Conditional_11_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275listener("click", function ChooseIssueComponent_For_4_Conditional_11_Conditional_0_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const x_r2 = \u0275\u0275nextContext(2).$implicit;
      return \u0275\u0275resetView(x_r2.isExpanded = !x_r2.isExpanded);
    });
    \u0275\u0275text(1, "Advance ");
    \u0275\u0275template(2, ChooseIssueComponent_For_4_Conditional_11_Conditional_0_Conditional_2_Template, 1, 0, "icon", 20);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(2, _c5, x_r2.isExpanded, !x_r2.isExpanded));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, x_r2.isExpanded ? 2 : -1);
  }
}
function ChooseIssueComponent_For_4_Conditional_11_Conditional_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 22);
    \u0275\u0275listener("click", function ChooseIssueComponent_For_4_Conditional_11_Conditional_1_Conditional_0_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.advance());
    });
    \u0275\u0275elementEnd();
  }
}
function ChooseIssueComponent_For_4_Conditional_11_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ChooseIssueComponent_For_4_Conditional_11_Conditional_1_Conditional_0_Template, 1, 0, "icon", 21);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275conditional(0, !ctx_r2.isfilter ? 0 : -1);
  }
}
function ChooseIssueComponent_For_4_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ChooseIssueComponent_For_4_Conditional_11_Conditional_0_Template, 3, 5, "span", 18)(1, ChooseIssueComponent_For_4_Conditional_11_Conditional_1_Template, 1, 1);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, !ctx_r2.intoolbar ? 0 : 1);
  }
}
function ChooseIssueComponent_For_4_Conditional_12_For_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 27);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r7 = ctx.$implicit;
    \u0275\u0275property("value", item_r7.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", item_r7.cKey, " ");
  }
}
function ChooseIssueComponent_For_4_Conditional_12_For_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 27)(1, "div", 30);
    \u0275\u0275element(2, "img", 17);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r8 = ctx.$implicit;
    \u0275\u0275property("value", item_r8.nValue);
    \u0275\u0275advance(2);
    \u0275\u0275property("src", "assets/icons/impact/" + item_r8.nValue + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", item_r8.cKey, " ");
  }
}
function ChooseIssueComponent_For_4_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "div", 23)(2, "h6", 24);
    \u0275\u0275text(3, "Relevance");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-form-field", 25)(5, "mat-select", 26);
    \u0275\u0275twoWayListener("valueChange", function ChooseIssueComponent_For_4_Conditional_12_Template_mat_select_valueChange_5_listener($event) {
      \u0275\u0275restoreView(_r6);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      \u0275\u0275twoWayBindingSet(x_r2.nRelid, $event) || (x_r2.nRelid = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("selectionChange", function ChooseIssueComponent_For_4_Conditional_12_Template_mat_select_selectionChange_5_listener() {
      \u0275\u0275restoreView(_r6);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.UpdateRelavance(x_r2));
    });
    \u0275\u0275elementStart(6, "mat-select-trigger");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "mat-option");
    \u0275\u0275text(9, "Select...");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(10, ChooseIssueComponent_For_4_Conditional_12_For_11_Template, 2, 2, "mat-option", 27, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(12, "div", 23)(13, "h6", 24);
    \u0275\u0275text(14, "Impact");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "mat-form-field", 25)(16, "mat-select", 28);
    \u0275\u0275twoWayListener("valueChange", function ChooseIssueComponent_For_4_Conditional_12_Template_mat_select_valueChange_16_listener($event) {
      \u0275\u0275restoreView(_r6);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      \u0275\u0275twoWayBindingSet(x_r2.nImpactid, $event) || (x_r2.nImpactid = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("selectionChange", function ChooseIssueComponent_For_4_Conditional_12_Template_mat_select_selectionChange_16_listener() {
      \u0275\u0275restoreView(_r6);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.UpdateImpace(x_r2));
    });
    \u0275\u0275elementStart(17, "mat-select-trigger")(18, "div", 29);
    \u0275\u0275element(19, "img", 17);
    \u0275\u0275text(20);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(21, "mat-option");
    \u0275\u0275text(22, "Select...");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(23, ChooseIssueComponent_For_4_Conditional_12_For_24_Template, 4, 3, "mat-option", 27, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("value", x_r2.nRelid);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r2.getCKey(x_r2.nRelid, "R"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r2.relevences);
    \u0275\u0275advance(6);
    \u0275\u0275twoWayProperty("value", x_r2.nImpactid);
    \u0275\u0275advance(3);
    \u0275\u0275property("src", "assets/icons/impact/" + x_r2.nImpactid + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.getCKey(x_r2.nImpactid, "I"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r2.impacts);
  }
}
function ChooseIssueComponent_For_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "div", 8)(2, "mat-checkbox", 9);
    \u0275\u0275twoWayListener("ngModelChange", function ChooseIssueComponent_For_4_Template_mat_checkbox_ngModelChange_2_listener($event) {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      \u0275\u0275twoWayBindingSet(x_r2.isChecked, $event) || (x_r2.isChecked = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function ChooseIssueComponent_For_4_Template_mat_checkbox_change_2_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onIssueChecked(x_r2));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 10);
    \u0275\u0275element(4, "span", 11);
    \u0275\u0275elementStart(5, "div", 12);
    \u0275\u0275text(6);
    \u0275\u0275elementStart(7, "span");
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 13);
    \u0275\u0275template(10, ChooseIssueComponent_For_4_Conditional_10_Template, 3, 2, "div", 14)(11, ChooseIssueComponent_For_4_Conditional_11_Template, 2, 1);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(12, ChooseIssueComponent_For_4_Conditional_12_Template, 25, 5, "div", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    const $index_r9 = ctx.$index;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("hidden", !ctx_r2.expandIssue && $index_r9 > 3);
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", x_r2.isChecked);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(10, _c3, "#" + x_r2.cColor));
    \u0275\u0275advance();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(12, _c4, ctx_r2.checkwidth(x_r2)));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r2.cIName, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("(", x_r2.cCategory, ")");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(10, x_r2.nRelid || x_r2.nImpactid ? 10 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(11, x_r2.isChecked ? 11 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(12, x_r2.isExpanded ? 12 : -1);
  }
}
function ChooseIssueComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 3)(1, "button", 31);
    \u0275\u0275listener("click", function ChooseIssueComponent_Conditional_5_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.createIssue());
    });
    \u0275\u0275element(2, "icon", 32);
    \u0275\u0275text(3, " New issue ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(1, _c6, ctx_r2.intoolbar, !ctx_r2.intoolbar));
  }
}
var ChooseIssueComponent = class _ChooseIssueComponent {
  constructor(issueService, commonService, cdr, cf, dialog) {
    this.issueService = issueService;
    this.commonService = commonService;
    this.cdr = cdr;
    this.cf = cf;
    this.dialog = dialog;
    this.selectedIssues = [];
    this.expandIssue = true;
    this.intoolbar = false;
    this.isfilter = false;
    this.OnDataRec = new EventEmitter();
    this.Onevent = new EventEmitter();
    this.issueList = [];
    this.isLoading = true;
    this.relevences = [];
    this.impacts = [];
  }
  ngOnChanges(changes) {
    if (changes["selectedIssues"]) {
      this.handleSelectedIssues();
    }
  }
  ngAfterViewInit() {
    if (!this.nCaseid)
      return;
    this.issueService.fetchIssueList(this.nCaseid).then((res) => {
      this.issueList = res;
      if (this.selectedIssues != null) {
        this.handleSelectedIssues();
      }
      this.isLoading = false;
      this.cdr.detectChanges();
      this.initList();
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
    });
  }
  initList() {
    return __async(this, null, function* () {
      this.relevences = yield this.commonService.getCode(4);
      this.impacts = yield this.commonService.getCode(5);
      try {
        this.OnDataRec.emit({ issueList: this.issueList, relevences: this.relevences, impacts: this.impacts });
      } catch (error) {
      }
      this.cdr.detectChanges();
    });
  }
  getCKey(nRelid, type) {
    if (type == "R") {
      const relevance = this.relevences.find((item) => item.nValue == nRelid);
      return relevance ? relevance.cKey : "Select...";
    } else {
      const impact = this.impacts.find((item) => item.nValue == nRelid);
      return impact ? impact.cKey : "Select...";
    }
  }
  saveIssue() {
  }
  findMaxValue(array, key) {
    try {
      if (!array || array.length === 0) {
        return 0;
      }
      const filteredArray = array.filter((item) => key in item && typeof item[key] === "number");
      if (filteredArray.length === 0) {
        return 0;
      }
      return filteredArray.reduce((max, item) => Math.max(max, item[key]), -Infinity);
    } catch (error) {
      return 0;
    }
  }
  onIssueChecked(x) {
    debugger;
    const maxid = this.findMaxValue(this.selectedIssues, "nSerial");
    const ind = this.selectedIssues.findIndex((a) => (a.nIid || a.nIssueid) == x.nIid);
    if (ind == -1) {
      if (x.isChecked) {
        this.selectedIssues.push({ cColor: x.cColor, cIName: x.cIName, nIid: x.nIid, nImpactid: x.nImpactid, nRelid: x.nRelid || x.nRelevanceid, dt: this.cf.getCurrentTime(), nSerial: maxid + 1 });
      }
    } else {
      if (!x.isChecked) {
        this.selectedIssues.splice(ind, 1);
      }
    }
    this.Onevent.emit({ event: "ISSUE_CHNAGE", data: this.selectedIssues });
    this.cdr.detectChanges();
  }
  UpdateRelavance(x) {
    const ind = this.selectedIssues.findIndex((a) => (a.nIid || a.nIssueid) == x.nIid);
    if (ind != -1)
      this.selectedIssues[ind].nRelid = x.nRelid;
    this.Onevent.emit({ event: "ISSUE_CHNAGE", data: this.selectedIssues });
    this.cdr.detectChanges();
  }
  UpdateImpace(x) {
    const ind = this.selectedIssues.findIndex((a) => (a.nIid || a.nIssueid) == x.nIid);
    if (ind != -1)
      this.selectedIssues[ind].nImpactid = x.nImpactid;
    this.Onevent.emit({ event: "ISSUE_CHNAGE", data: this.selectedIssues });
    this.cdr.detectChanges();
  }
  createIssue() {
    const dialog = this.dialog.open(CreateissueComponent, {
      width: "440px",
      height: "calc(100% - 50px)",
      hasBackdrop: this.intoolbar ? true : false,
      backdropClass: this.intoolbar ? ["top-[50px]", "bg-black/50"] : "",
      panelClass: ["noshadow", "norounded"],
      position: {
        top: `50px`,
        right: `0px`
      },
      data: { type: null, value: null, current_session: { nCaseid: this.nCaseid } }
    });
    dialog.afterClosed().subscribe((result) => {
      this.ngAfterViewInit();
      this.cdr.detectChanges();
    });
  }
  advance() {
    this.Onevent.emit({ event: "ADVANCE", data: this.selectedIssues });
  }
  checkwidth(x) {
    let wth;
    if (this.intoolbar) {
      wth = "28px";
      if (x.isChecked) {
        wth = "48px";
      }
      if (x.nImpactid) {
        wth = "78px";
      }
      if (x.nRelid) {
        wth = "120px";
      }
    } else {
      if (x.nRelid) {
        wth = "180px";
      }
    }
    return wth;
  }
  handleSelectedIssues() {
    if (this.selectedIssues == null || this.selectedIssues?.length == 0) {
      this.issueList.forEach((item) => {
        item.isChecked = false;
      });
      return;
    }
    this.issueList.forEach((item) => {
      const Obj = this.selectedIssues?.find((a) => (a.nIid || a.nIssueid) == item.nIid);
      if (Obj) {
        item.isChecked = true;
        item.nImpactid = Obj.nImpactid || 0;
        item.nRelid = Obj.nRelid || Obj.nRelevanceid || 0;
        item.nSerial = Obj.nSerial;
      } else {
        item.isChecked = false;
        item.nImpactid = 0;
        item.nRelid = 0;
      }
    });
    this.cdr.detectChanges();
  }
  static {
    this.\u0275fac = function ChooseIssueComponent_Factory(t) {
      return new (t || _ChooseIssueComponent)(\u0275\u0275directiveInject(IssueService), \u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(MatDialog));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ChooseIssueComponent, selectors: [["choose-issue"]], inputs: { nCaseid: "nCaseid", selectedIssues: "selectedIssues", expandIssue: "expandIssue", intoolbar: "intoolbar", isfilter: "isfilter" }, outputs: { OnDataRec: "OnDataRec", Onevent: "Onevent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 6, vars: 10, consts: [[3, "ngClass"], [1, "flex", "flex-col", "gap-2", 3, "ngClass"], [3, "hidden"], [1, "pb-3", "pt-1.5", "sticky", "bottom-0", "bg-faint", 3, "ngClass"], [1, "flex", "gap-2.5", "group", "items-center", "px-2.5", "py-1.5", "bg-gray-100", "rounded-xl", "mt-2.5", "animate-pulse"], [1, "size-4", "bg-gray-300", "rounded-sm"], [1, "w-1", "h-4", "rounded-sm", "bg-gray-300"], [1, "w-28", "h-3", "rounded-sm", "bg-gray-300"], [1, "flex", "gap-2.5", "group", "h-[38px]", "items-center", "bg-transparent", "border", "px-2", "py-1", "bg-white", "border-white", "py-", "rounded-xl", "max-md:flex-wrap", "hover:shadow-[0px_4px_4px_#00000025]"], [3, "ngModelChange", "change", "ngModel"], [1, "w-[calc(100%_-_24px)]", "flex", "gap-1", "items-center", "my-auto", "text-xs", "font-extrabold", "leading-4"], [1, "rounded-base", "h-3.5", "w-1", "bg-red-400", 3, "ngStyle"], [1, "justify-center", "whitespace-nowrap", "truncate", "w-full", "text-w", 3, "ngStyle"], [1, "flex", "items-center", "ms-auto", "w-fit"], [1, "flex", "gap-2.5", "items-center", "me-2.5"], [1, "bg-white", "p-2.5", "rounded-base", "flex", "items-center", "gap-2.5", "my-2.5"], [1, "flex", "items-center", "gap-2.5", "text-xxs", "bg-reply", "font-bold", "px-2", "py-1", "rounded-base", "ms-auto"], [3, "src"], [1, "flex", "items-center", "gap-2.5", "text-xs", "bg-gray-100", "px-2", "py-1.5", "rounded-base", "ms-auto", "cursor-pointer", 3, "ngClass"], [1, "flex", "items-center", "gap-2.5", "text-xs", "bg-gray-100", "px-2", "py-1.5", "rounded-base", "ms-auto", "cursor-pointer", 3, "click", "ngClass"], ["name", "chvx"], ["name", "menu"], ["name", "menu", 3, "click"], [1, "w-1/2"], [1, "text-xs", "font-semibold", "mb-2.5"], [1, "w-full"], ["placeholder", "Select..", 3, "valueChange", "selectionChange", "value"], [3, "value"], ["placeholder", "Select...", 3, "valueChange", "selectionChange", "value"], [1, "flex", "gap-2.5", "items-center"], [1, "flex", "items-center", "gap-2.5"], ["mode", "white", 1, "!text-blue-on", "hover:bg-white", "px-2.5", "flex", "items-center", "gap-2", "shadow-none", "text-start", "active:bg-white", "w-full", "text-xs", "bg-white", "h-8.5", "rounded-base", "border", "border-blue-deactivate", 3, "click"], ["name", "addcircle", 1, "text-sm"]], template: function ChooseIssueComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275template(1, ChooseIssueComponent_Conditional_1_Template, 2, 1);
        \u0275\u0275elementStart(2, "div", 1);
        \u0275\u0275repeaterCreate(3, ChooseIssueComponent_For_4_Template, 13, 14, "div", 2, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd();
        \u0275\u0275template(5, ChooseIssueComponent_Conditional_5_Template, 4, 4, "div", 3);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(4, _c0, ctx.intoolbar && !ctx.isfilter, ctx.isfilter));
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.isLoading ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(7, _c1, ctx.intoolbar && !ctx.isfilter, ctx.isfilter));
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.issueList);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(5, !ctx.isfilter ? 5 : -1);
      }
    }, dependencies: [CommonModule, NgClass, NgStyle, MatFormFieldModule, MatFormField, MatSelectModule, MatSelect, MatSelectTrigger, MatOption, MatCheckboxModule, MatCheckbox, FormsModule, NgControlStatus, NgModel, IconComponent], styles: ["\n\n.text-w[_ngcontent-%COMP%] {\n  --textwodth: 0px;\n  width: calc(100% - var(--textwodth));\n}\n/*# sourceMappingURL=choose-issue.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ChooseIssueComponent, { className: "ChooseIssueComponent", filePath: "src\\app\\shared\\components\\issues\\choose-issue\\choose-issue.component.ts", lineNumber: 24 });
})();

export {
  ChooseIssueComponent
};
//# sourceMappingURL=chunk-3JV3GCVK.js.map
