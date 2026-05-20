import {
  PresentsetupService
} from "./chunk-WYIU2ETL.js";
import "./chunk-3B3MCZKM.js";
import {
  MatAccordion,
  MatExpansionModule,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "./chunk-IDUSD6JZ.js";
import {
  FilehaderComponent,
  RecentfileComponent
} from "./chunk-LLILOXWW.js";
import "./chunk-YQJXVIAQ.js";
import {
  EmptyComponent
} from "./chunk-DHVW7RW5.js";
import {
  CdkDrag,
  CdkDropList,
  moveItemInArray
} from "./chunk-EZOJOG5D.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  FilecolumnService
} from "./chunk-PMFTFHHF.js";
import "./chunk-M4TJ3SSY.js";
import "./chunk-6XJ2ENW3.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField
} from "./chunk-Y2GGPNYR.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import "./chunk-42T75ZKA.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  ActivatedRoute,
  Router
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  LocationStrategy
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferOnViewport,
  ɵɵdeferWhen,
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
  ɵɵreference,
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

// src/app/presentation/components/core-case/core-case.component.ts
var CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Defer_5_DepsFn = () => [import("./chunk-UUDKBMHQ.js").then((m) => m.TableComponent)];
var CoreCaseComponent_Conditional_1_Conditional_3_Conditional_8_Defer_2_DepsFn = () => [import("./chunk-XLMHTTFD.js").then((m) => m.PreviewComponent)];
function CoreCaseComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2);
    \u0275\u0275element(1, "div", 3);
    \u0275\u0275elementEnd();
  }
}
function CoreCaseComponent_Conditional_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275element(1, "img", 6);
    \u0275\u0275elementStart(2, "h6", 7);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "btn", 8);
    \u0275\u0275listener("click", function CoreCaseComponent_Conditional_1_Conditional_1_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.submit());
    })("keydown.enter", function CoreCaseComponent_Conditional_1_Conditional_1_Template_btn_keydown_enter_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.submit());
    })("keyup.space", function CoreCaseComponent_Conditional_1_Conditional_1_Template_btn_keyup_space_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.submit());
    });
    \u0275\u0275text(5, " Go to presentation ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", (ctx_r1.presentSession == null ? null : ctx_r1.presentSession.cSType) == ctx_r1.PresentType["WITNESS"] ? "Examination Schedule" : (ctx_r1.presentSession == null ? null : ctx_r1.presentSession.cSType) == ctx_r1.PresentType["CORE"] ? "Core case files" : "", " ");
  }
}
function CoreCaseComponent_Conditional_1_Conditional_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 10);
    \u0275\u0275listener("click", function CoreCaseComponent_Conditional_1_Conditional_2_Conditional_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.gotoFile());
    })("keydown.enter", function CoreCaseComponent_Conditional_1_Conditional_2_Conditional_1_Template_btn_keydown_enter_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.gotoFile());
    })("keyup.space", function CoreCaseComponent_Conditional_1_Conditional_2_Conditional_1_Template_btn_keyup_space_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.gotoFile());
    });
    \u0275\u0275text(1, " Add Files ");
    \u0275\u0275elementEnd();
  }
}
function CoreCaseComponent_Conditional_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "empty", 5);
    \u0275\u0275template(1, CoreCaseComponent_Conditional_1_Conditional_2_Conditional_1_Template, 2, 0, "btn", 9);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("head", (ctx_r1.presentSession == null ? null : ctx_r1.presentSession.cSType) == ctx_r1.PresentType["WITNESS"] ? "No Schedule Witness File" : " No Core Case File");
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r1.cSubType ? 1 : -1);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "div", 17);
    \u0275\u0275listener("click", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_2_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.gotoFile());
    })("keydown.enter", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_2_Template_div_keydown_enter_1_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.gotoFile());
    })("keyup.space", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_2_Template_div_keyup_space_1_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.gotoFile());
    });
    \u0275\u0275text(2, "modify Files");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 18)(4, "div", 19, 0);
    \u0275\u0275text(6, " Clear Schedule ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "mat-menu", 20, 1)(9, "div")(10, "h6", 21);
    \u0275\u0275text(11, " Are you sure, you want to remove all files in the scheule ? ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "div", 22)(13, "btn", 23);
    \u0275\u0275listener("click", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_2_Template_btn_click_13_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.clearSchedule());
    })("keydown.enter", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_2_Template_btn_keydown_enter_13_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.clearSchedule());
    })("keyup.space", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_2_Template_btn_keyup_space_13_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.clearSchedule());
    });
    \u0275\u0275text(14, " Delete ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "btn", 24);
    \u0275\u0275text(16, " Cancel ");
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const coreFile_r5 = \u0275\u0275reference(8);
    \u0275\u0275advance(4);
    \u0275\u0275property("matMenuTriggerFor", coreFile_r5);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_3_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 26);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r7 = ctx.$implicit;
    \u0275\u0275property("value", item_r7.nPresentid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r7.cFname + " " + item_r7.cLname);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "mat-form-field")(2, "mat-select", 25);
    \u0275\u0275listener("ngModelChange", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_3_Template_mat_select_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.handleSelect($event));
    });
    \u0275\u0275twoWayListener("ngModelChange", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_3_Template_mat_select_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r1.nPresentid, $event) || (ctx_r1.nPresentid = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275repeaterCreate(3, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_3_For_4_Template, 2, 2, "mat-option", 26, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(5, "div", 13)(6, "div", 18);
    \u0275\u0275text(7, "Advance Search");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.nPresentid);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.scheduleList);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 34);
  }
  if (rf & 2) {
    const item_r9 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("id", item_r9 == null ? null : item_r9.nBundledetailid);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Defer_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-table", 35);
    \u0275\u0275listener("changeTable", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Defer_3_Template_app_table_changeTable_0_listener($event) {
      \u0275\u0275restoreView(_r10);
      const item_r9 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.changeTable($event, item_r9));
    })("emitEvent", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Defer_3_Template_app_table_emitEvent_0_listener($event) {
      \u0275\u0275restoreView(_r10);
      const item_r9 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.tableEvent($event, item_r9));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r10 = \u0275\u0275nextContext();
    const item_r9 = ctx_r10.$implicit;
    const $index_r12 = ctx_r10.$index;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275property("checkoutside", true)("col", ctx_r1.reqcols)("filedetail", item_r9)("isCopy", false)("nCaseid", ctx_r1.nCaseid)("index", $index_r12)("enableFileDrag", ctx_r1.enableFileDrag);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_DeferPlaceholder_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 32)(1, "div", 33);
    \u0275\u0275template(2, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Conditional_2_Template, 1, 1, "icon", 34)(3, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Defer_3_Template, 1, 7)(4, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_DeferPlaceholder_4_Template, 1, 0);
    \u0275\u0275defer(5, 3, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Defer_5_DepsFn, null, 4);
    \u0275\u0275deferOnViewport(0, -1);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, ctx_r1.enableFileDrag ? 2 : -1);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-expansion-panel", 15)(1, "mat-expansion-panel-header", 27)(2, "mat-panel-title");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 28);
    \u0275\u0275element(4, "path", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5, " Core Witness Files ");
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(6, "div", 30)(7, "app-filehader", 31);
    \u0275\u0275listener("sort", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_Template_app_filehader_sort_7_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.sort_array($event, "C"));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(8, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Template, 7, 1, "div", 32, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(7);
    \u0275\u0275property("isadmin", false)("reqcols", ctx_r1.reqcols)("SType", ctx_r1.presentSession == null ? null : ctx_r1.presentSession.cSType);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.coreFiles);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 40);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 41);
  }
  if (rf & 2) {
    const item_r14 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("id", item_r14 == null ? null : item_r14.nBundledetailid);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Defer_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-table", 35);
    \u0275\u0275listener("changeTable", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Defer_4_Template_app_table_changeTable_0_listener($event) {
      \u0275\u0275restoreView(_r15);
      const item_r14 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.changeTable($event, item_r14));
    })("emitEvent", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Defer_4_Template_app_table_emitEvent_0_listener($event) {
      \u0275\u0275restoreView(_r15);
      const item_r14 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.tableEvent($event, item_r14));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r15 = \u0275\u0275nextContext();
    const item_r14 = ctx_r15.$implicit;
    const $index_r17 = ctx_r15.$index;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275property("checkoutside", true)("col", ctx_r1.reqcols)("filedetail", item_r14)("isCopy", false)("nCaseid", ctx_r1.nCaseid)("index", $index_r17)("enableFileDrag", ctx_r1.enableFileDrag);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_DeferPlaceholder_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 39)(1, "div", 33);
    \u0275\u0275template(2, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Conditional_2_Template, 1, 0, "icon", 40)(3, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Conditional_3_Template, 1, 1)(4, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Defer_4_Template, 1, 7)(5, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_DeferPlaceholder_5_Template, 1, 0);
    \u0275\u0275defer(6, 4, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_For_9_Defer_5_DepsFn, null, 5);
    \u0275\u0275deferOnViewport(0, -1);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, !ctx_r1.isChooser ? 2 : ctx_r1.enableFileDrag ? 3 : -1);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275element(0, "hr", 36);
    \u0275\u0275elementStart(1, "mat-expansion-panel", 15)(2, "mat-expansion-panel-header", 27)(3, "mat-panel-title", 37);
    \u0275\u0275text(4, "Scheduled Files");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div", 30)(6, "app-filehader", 31);
    \u0275\u0275listener("sort", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_Template_app_filehader_sort_6_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.sort_array($event, "S"));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 38);
    \u0275\u0275listener("cdkDropListDropped", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_Template_div_cdkDropListDropped_7_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.drop($event));
    });
    \u0275\u0275repeaterCreate(8, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_For_9_Template, 8, 1, "div", 39, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(6);
    \u0275\u0275property("isadmin", false)("reqcols", ctx_r1.reqcols)("SType", ctx_r1.presentSession == null ? null : ctx_r1.presentSession.cSType);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.scheduleFiles);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_8_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "preview", 42);
    \u0275\u0275listener("OnFileSelected", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_8_Defer_0_Template_preview_OnFileSelected_0_listener($event) {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.OnSelected($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275property("isIndividual", true)("viewlist", ctx_r1.viewlist)("nCaseid", ctx_r1.nCaseid)("isadmin", false)("isMyfile", false)("presentSession", ctx_r1.presentSession)("isChooser", true);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_8_DeferPlaceholder_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 43);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_8_Defer_0_Template, 1, 7)(1, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_8_DeferPlaceholder_1_Template, 1, 0);
    \u0275\u0275defer(2, 0, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_8_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r1.viewlist.length);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "recentfiles", 44);
    \u0275\u0275listener("changeRecent", function CoreCaseComponent_Conditional_1_Conditional_3_Conditional_9_Template_recentfiles_changeRecent_0_listener($event) {
      \u0275\u0275restoreView(_r19);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.recentOutput($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("nCaseid", ctx_r1.nCaseid)("nSectionid", null)("isPresent", true);
  }
}
function CoreCaseComponent_Conditional_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "div", 12);
    \u0275\u0275template(2, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_2_Template, 17, 1, "div", 13)(3, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_3_Template, 8, 1);
    \u0275\u0275elementStart(4, "mat-accordion", 14);
    \u0275\u0275template(5, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_5_Template, 10, 3, "mat-expansion-panel", 15)(6, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_6_Template, 10, 3);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 16);
    \u0275\u0275template(8, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_8_Template, 4, 1)(9, CoreCaseComponent_Conditional_1_Conditional_3_Conditional_9_Template, 1, 3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, !ctx_r1.cSubType ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r1.cSubType == ctx_r1.PresentType["WITNESS"] ? 3 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(5, ctx_r1.coreFiles.length ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(6, ctx_r1.scheduleFiles.length ? 6 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(8, ctx_r1.viewlist.length ? 8 : 9);
  }
}
function CoreCaseComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2);
    \u0275\u0275template(1, CoreCaseComponent_Conditional_1_Conditional_1_Template, 6, 1, "div", 4)(2, CoreCaseComponent_Conditional_1_Conditional_2_Template, 2, 2, "empty", 5)(3, CoreCaseComponent_Conditional_1_Conditional_3_Template, 10, 5);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r1.cSubType ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, !(ctx_r1.coreFiles == null ? null : ctx_r1.coreFiles.length) && !(ctx_r1.scheduleFiles == null ? null : ctx_r1.scheduleFiles.length) ? 2 : 3);
  }
}
var PresentSType = {
  WITNESS: "W",
  CORE: "C",
  FILE: "F",
  EMPTY: ""
};
var CoreCaseComponent = class _CoreCaseComponent {
  constructor(PSservice, cm, route, cdr, location, router, hs, fcs, userPermissions) {
    this.PSservice = PSservice;
    this.cm = cm;
    this.route = route;
    this.cdr = cdr;
    this.location = location;
    this.router = router;
    this.hs = hs;
    this.fcs = fcs;
    this.userPermissions = userPermissions;
    this.PresentType = PresentSType;
    this.coreFiles = [];
    this.scheduleFiles = [];
    this.reqcols = {};
    this.viewlist = [];
    this.isLoading = true;
    this.isPreview = false;
    this.scheduleList = [];
    this.OnFileSelected = new EventEmitter();
    this.handleSelectedFileIds = new EventEmitter();
    this.enableFileDrag = false;
    this.isChooser = false;
    this.cLastOtype = "flag2";
    this.reqcols = this.fcs.reqcols;
    const paramsObj = this.route.snapshot.params;
    if (Object.keys(paramsObj).length > 0) {
      const decodedParams = JSON.parse(decodeURIComponent(paramsObj["id"]));
      this.nPresentid = decodedParams?.nPid ?? null;
      this.nCaseid = decodedParams?.id ?? null;
      this.hs.nCaseid = this.nCaseid;
    }
    globalThis.history.pushState(null, null, globalThis.location.href);
    this.location.onPopState(() => {
      globalThis.history.pushState(null, null, globalThis.location.href);
    });
    setTimeout(() => this.userPermissions.userPermissionList(this.nCaseid));
  }
  ngOnInit() {
    this.reqcols["extra"]["view"] = false;
    this.reqcols["index"]["view"] = true;
    if (!this.cSubType) {
      this.reqcols["check"]["view"] = false;
    }
    (() => __async(this, null, function* () {
      if (this.nCaseid) {
        this.presentSession = yield this.PSservice.getRvalue(this.nCaseid);
        if (this.nPresentid) {
          yield this.getFiles();
        }
        if (this.cSubType) {
          yield this.getScheduleList();
        }
      }
      this.isLoading = false;
      this.cdr.detectChanges();
    }))();
  }
  gotoFile() {
    if (!this.nCaseid)
      return;
    let data = { id: this.nCaseid };
    if (this.nPresentid) {
      data["nPid"] = this.nPresentid;
    }
    this.cm.gotoUrl("/present/choose-docs", data);
  }
  getFiles(type) {
    return __async(this, null, function* () {
      const fileList = yield this.PSservice.getFiles(this.nPresentid, this.cSortby, this[this.cLastOtype] ? "DESC" : "ASC");
      if (!fileList.length)
        return;
      const [core, schedule] = fileList.reduce(([coreAcc, scheduleAcc], file) => {
        if (file.cType === "C") {
          coreAcc.push(file);
        } else {
          scheduleAcc.push(file);
        }
        return [coreAcc, scheduleAcc];
      }, [[], []]);
      if (type === "C") {
        this.coreFiles = core;
      } else if (type === "S") {
        this.scheduleFiles = schedule;
      } else {
        this.coreFiles = core;
        this.scheduleFiles = schedule;
      }
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }
  sort_array(event, type) {
    return __async(this, null, function* () {
      const { key, flag } = event;
      this.cLastOtype = flag;
      this[flag] = this[flag] ? !this[flag] : true;
      this.cSortby = key;
      yield this.getFiles(type);
      yield this.update_serial(type);
    });
  }
  changeTable(event, x) {
    if (event == "VIEW") {
      this.viewFile(x);
    }
  }
  handleSelectionEvent() {
    const files1 = this.scheduleFiles.filter((a) => !!a["cIscheck"]).map((e) => e.nBundledetailid);
    const files2 = this.coreFiles.filter((a) => !!a["cIscheck"]).map((e) => e.nBundledetailid);
    const files = [...files1, ...files2];
    this.handleSelectedFileIds.emit(files);
    this.cdr.detectChanges();
  }
  clearSchedule() {
    return __async(this, null, function* () {
      const res = yield this.PSservice.clearSchedule(this.nPresentid);
      if (res.msg == 1) {
        this.coreFiles = [];
        this.scheduleFiles = [];
        this.cdr.detectChanges();
      }
    });
  }
  submit() {
    return __async(this, null, function* () {
      if (!this.nPresentid || !this.coreFiles.length && !this.scheduleFiles.length)
        return;
      const dataObj = {
        cStatus: "I",
        nPresentid: this.nPresentid
      };
      const res = yield this.PSservice.update_status(dataObj);
      if (res?.msg == 1) {
        this.router.navigateByUrl(`/individual/doc/${encodeURIComponent(JSON.stringify([[], this.nCaseid, this.nPresentid]))}`);
      }
    });
  }
  recentOutput(event) {
    if (event.event == "VIEW") {
      this.viewFile(event.data);
    }
  }
  viewFile(x) {
    if (this.isPreview) {
      this.updatePreviewMode(x);
    } else {
      this.isPreview = true;
      this.activateItem(x);
    }
  }
  activateItem(x) {
    if (this.viewlist.length === 0 || this.viewlist[0].nBundledetailid !== x.nBundledetailid) {
      x.active = true;
      this.cm.viewlist = [x];
      this.viewlist = this.cm.viewlist;
      this.cdr.detectChanges();
    }
  }
  updatePreviewMode(x) {
    const index = this.viewlist.findIndex((e) => e.nBundledetailid === x.nBundledetailid);
    if (index > -1) {
      this.viewlist.splice(index, 1);
    } else {
      this.activateItem(x);
      this.viewlist.forEach((item, idx) => item["active"] = idx === 0);
    }
    this.cm.viewlist = this.viewlist;
    this.cdr.detectChanges();
  }
  handleSelect(value) {
    this.nPresentid = value;
    this.cdr.detectChanges();
    this.getFiles();
  }
  getScheduleList() {
    return __async(this, null, function* () {
      this.scheduleList = yield this.PSservice.scheduleList(this.nCaseid);
      this.cdr.detectChanges();
    });
  }
  drop(event) {
    return __async(this, null, function* () {
      if (this.isChooser) {
        return;
      }
      moveItemInArray(this.scheduleFiles, event.previousIndex, event.currentIndex);
      yield this.update_serial();
      this.cSortby = null;
      this.cLastOtype = "flag2";
      this.getFiles();
      this.cdr.detectChanges();
    });
  }
  update_serial(type) {
    return __async(this, null, function* () {
      if (type === "C") {
        this.coreFiles.forEach((file, index) => {
          file.nSerial = index + 1;
        });
        const jFiles = this.coreFiles.map((e) => ({
          nPDid: e.nPDid,
          nSerial: e.nSerial
        }));
        return yield this.PSservice.files_serial_update({
          nPresentid: this.nPresentid,
          jFiles
        });
      } else {
        this.scheduleFiles.forEach((file, index) => {
          file.nSerial = index + 1;
        });
        const jFiles = this.scheduleFiles.map((e) => ({
          nPDid: e.nPDid,
          nSerial: e.nSerial
        }));
        return yield this.PSservice.files_serial_update({
          nPresentid: this.nPresentid,
          jFiles
        });
      }
    });
  }
  OnSelected($event) {
    this.OnFileSelected.emit($event);
  }
  tableEvent(event, x) {
    if (event["event"] == "SELECTED") {
      x["cIscheck"] = event["data"]["cIscheck"];
      this.cdr.detectChanges();
      this.handleSelectionEvent();
    }
  }
  ngOnDestroy() {
    this.reqcols["index"]["view"] = false;
    this.reqcols["check"]["view"] = true;
  }
  static {
    this.\u0275fac = function CoreCaseComponent_Factory(t) {
      return new (t || _CoreCaseComponent)(\u0275\u0275directiveInject(PresentsetupService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(LocationStrategy), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(FilecolumnService), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CoreCaseComponent, selectors: [["app-core-case"]], inputs: { nCaseid: "nCaseid", nPresentid: "nPresentid", cSubType: "cSubType", enableFileDrag: "enableFileDrag", isChooser: "isChooser" }, outputs: { OnFileSelected: "OnFileSelected", handleSelectedFileIds: "handleSelectedFileIds" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 2, vars: 1, consts: [["d", "matMenuTrigger"], ["coreFile", "matMenu"], [1, "h-full", "bg-[#f6f6f6]", "flex", "flex-col", "overflow-hidden"], [1, "min-h-20", "bg-white"], [1, "text-lg", "bg-white", "text-dark-blue", "whitespace-nowrap", "min-h-20", "flex", "items-center", "gap-6", "px-10"], [1, "h-full", "p-3", 3, "head"], ["src", "assets/present/public.png", "alt", "Public Icon", 1, "w-15"], [1, "font-bold"], [1, "ms-auto", 3, "click", "keydown.enter", "keyup.space"], ["mode", "outlined-blue"], ["mode", "outlined-blue", 3, "click", "keydown.enter", "keyup.space"], [1, "w-full", "h-[calc(100%_-_80px)]", "flex", "p-10", "pb-0", "gap-2.5"], [1, "h-full", "flex", "flex-col", "w-full", "pb-2.5"], [1, "underline", "flex", "items-center", "justify-end", "p-2.5", "gap-3", "text-xs"], ["multi", "", 1, "h-full", "overflow-auto"], ["expanded", "", 1, "mat-elevation-z"], [1, "min-w-[420px]", "h-full"], [1, "cursor-pointer", 3, "click", "keydown.enter", "keyup.space"], [1, "cursor-pointer"], [3, "matMenuTriggerFor"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base", "!min-w-52"], [1, "mb-6", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click", "keydown.enter", "keyup.space"], ["mode", "dark"], ["placeholder", "Select User...", 3, "ngModelChange", "ngModel"], [3, "value"], [1, "!bg-dark-blue", "hover:!bg-dark-blue", "!rounded-base"], ["xmlns", "http://www.w3.org/2000/svg", "width", "15", "height", "20", "fill", "none", "viewBox", "0 0 15 20", 1, "me-3"], ["fill", "#fff", "fill-rule", "evenodd", "d", "M11.703 7V2h1c.55 0 1-.45 1-1s-.45-1-1-1h-10c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7h6.03v-2c-1.66 0-3-1.34-3-3Z", "clip-rule", "evenodd"], [1, "my-2", "mx-1", "bg-white", "p-2.5", "rounded-base", "shadow-[1px_1px_11px_#0000001f]", "overflow-auto"], [1, "block", "min-w-fit", "w-full", 3, "sort", "isadmin", "reqcols", "SType"], [1, "min-w-fit", "w-full"], [1, "relative", "group", "min-w-fit", "w-full"], ["name", "drag", "type", "adminicn", 1, "alpha-drag-handler", "text-xs", "text-blue-on", "absolute", "top-1/2", "left-5", "-translate-y-1/2", "opacity-0", "group-hover:opacity-100", "z-[9999]", 3, "id"], [1, "min-w-fit", "w-full", 3, "changeTable", "emitEvent", "checkoutside", "col", "filedetail", "isCopy", "nCaseid", "index", "enableFileDrag"], [1, "my-2.5"], [1, "text-white"], ["cdkDropList", "", 3, "cdkDropListDropped"], ["cdkDrag", "", 1, "min-w-fit", "w-full"], ["name", "drag", "type", "adminicn", 1, "text-xs", "absolute", "text-blue-on", "top-1/2", "-translate-y-1/2", "left-3", "opacity-0", "group-hover:opacity-100", "z-[9999]"], ["name", "drag", "type", "adminicn", 1, "alpha-drag-handler", "text-xs", "absolute", "text-blue-on", "top-1/2", "-translate-y-1/2", "left-3", "opacity-0", "group-hover:opacity-100", "z-[9999]", 3, "id"], [3, "OnFileSelected", "isIndividual", "viewlist", "nCaseid", "isadmin", "isMyfile", "presentSession", "isChooser"], [1, "overflow-hidden", "preview", "h-[calc(100%_-_20px)]", "bg-white", "animate-pulse"], [3, "changeRecent", "nCaseid", "nSectionid", "isPresent"]], template: function CoreCaseComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, CoreCaseComponent_Conditional_0_Template, 2, 0, "div", 2)(1, CoreCaseComponent_Conditional_1_Template, 4, 2);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.isLoading ? 0 : 1);
      }
    }, dependencies: [
      FilehaderComponent,
      ButtonComponent,
      MatMenuModule,
      MatMenu,
      MatMenuTrigger,
      MatExpansionModule,
      MatAccordion,
      MatExpansionPanel,
      MatExpansionPanelHeader,
      MatExpansionPanelTitle,
      RecentfileComponent,
      EmptyComponent,
      MatSelectModule,
      MatFormField,
      MatSelect,
      MatOption,
      FormsModule,
      NgControlStatus,
      NgModel,
      CdkDropList,
      CdkDrag,
      IconComponent
    ], styles: ["\n\nmat-expansion-panel-header[_ngcontent-%COMP%] {\n  --mat-expansion-header-collapsed-state-height: 40px;\n  --mat-expansion-header-expanded-state-height: 40px;\n}\nmat-expansion-panel[_ngcontent-%COMP%] {\n  --mat-expansion-container-background-color: transparent;\n  --mat-expansion-header-hover-state-layer-color: #002f64;\n  --mat-expansion-header-active-state-layer-color: #002f64;\n  --mat-expansion-header-collapsed-state-color: #002f64;\n  --mat-expansion-header-expanded-state-color: #002f64;\n  --mat-expansion-header-focus-state-layer-color: #002f64;\n  --mat-expansion-header-text-color: white;\n  --mat-expansion-header-indicator-color: white;\n  --mat-expansion-container-shape: 10px;\n  --mat-expansion-container-shape: 0px;\n  --mat-expansion-header-text-size: 12px;\n  --mat-expansion-header-indicator-display: inline-block;\n  --mat-expansion-legacy-header-indicator-display: none;\n}\n/*# sourceMappingURL=core-case.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CoreCaseComponent, { className: "CoreCaseComponent", filePath: "src\\app\\presentation\\components\\core-case\\core-case.component.ts", lineNumber: 66 });
})();
export {
  CoreCaseComponent,
  PresentSType
};
//# sourceMappingURL=chunk-PCBRKTOV.js.map
