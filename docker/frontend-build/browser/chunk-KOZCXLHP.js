import {
  MatPaginator,
  MatPaginatorModule,
  MatSort,
  MatSortHeader,
  MatSortModule
} from "./chunk-GRHDLVDW.js";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
  MatTableModule
} from "./chunk-ZLL363WY.js";
import {
  BytesPipe
} from "./chunk-PJGEM4T6.js";
import {
  CheckDuplicacyService,
  UploadManagementService
} from "./chunk-AGZ7TUOA.js";
import "./chunk-MQ6OVKEO.js";
import {
  UploadService
} from "./chunk-ZP7PHFH3.js";
import "./chunk-3B3MCZKM.js";
import {
  MatInputModule
} from "./chunk-XTSEIZ7V.js";
import "./chunk-DVMGXG6V.js";
import "./chunk-55ITPE7H.js";
import "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
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
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import "./chunk-4BFWRZ22.js";
import {
  SelectionModel
} from "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  DatePipe,
  DecimalPipe,
  NgClass,
  NgIf,
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
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpropertyInterpolate1,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/upload/uploadtable/uploadtable.component.ts
var _c0 = ["fileuploader"];
var _c1 = (a0) => ({ "width": a0 });
var _c2 = (a0) => ({ "opacity-0": a0 });
var _c3 = () => [10, 25, 100];
function UploadtableComponent_Conditional_3_th_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 25);
    \u0275\u0275twoWayListener("ngModelChange", function UploadtableComponent_Conditional_3_th_3_Conditional_1_Template_mat_checkbox_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r2.allSelected, $event) || (ctx_r2.allSelected = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function UploadtableComponent_Conditional_3_th_3_Conditional_1_Template_mat_checkbox_change_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.OnAllChange());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.allSelected);
  }
}
function UploadtableComponent_Conditional_3_th_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 23);
    \u0275\u0275template(1, UploadtableComponent_Conditional_3_th_3_Conditional_1_Template, 1, 1, "mat-checkbox", 24);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275styleProp("width", "50px");
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r2.isReport ? 1 : -1);
  }
}
function UploadtableComponent_Conditional_3_td_4_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 25);
    \u0275\u0275twoWayListener("ngModelChange", function UploadtableComponent_Conditional_3_td_4_Conditional_1_Template_mat_checkbox_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const row_r5 = \u0275\u0275nextContext().$implicit;
      \u0275\u0275twoWayBindingSet(row_r5.isChecked, $event) || (row_r5.isChecked = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function UploadtableComponent_Conditional_3_td_4_Conditional_1_Template_mat_checkbox_change_0_listener() {
      \u0275\u0275restoreView(_r4);
      const row_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onSelect(row_r5));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275twoWayProperty("ngModel", row_r5.isChecked);
  }
}
function UploadtableComponent_Conditional_3_td_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 26);
    \u0275\u0275template(1, UploadtableComponent_Conditional_3_td_4_Conditional_1_Template, 1, 1, "mat-checkbox", 24);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275styleProp("width", "50px");
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r2.isReport ? 1 : -1);
  }
}
function UploadtableComponent_Conditional_3_th_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 27);
    \u0275\u0275text(1, " Name ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275styleProp("width", "25%");
  }
}
function UploadtableComponent_Conditional_3_td_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 26)(1, "span")(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const row_r6 = ctx.$implicit;
    \u0275\u0275styleProp("width", "25%");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", row_r6.cFilename, " ");
  }
}
function UploadtableComponent_Conditional_3_th_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 28);
    \u0275\u0275text(1, " Status ");
    \u0275\u0275elementEnd();
  }
}
function UploadtableComponent_Conditional_3_td_10_Conditional_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const row_r7 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275textInterpolate2(" ", row_r7.nComplete, "/ ", row_r7.nTotal, " ");
  }
}
function UploadtableComponent_Conditional_3_td_10_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 29)(1, "span", 32);
    \u0275\u0275text(2);
    \u0275\u0275template(3, UploadtableComponent_Conditional_3_td_10_Conditional_1_Conditional_3_Template, 1, 2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const row_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", "Zip detail..", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(3, row_r7.cStatus == "ZR" ? 3 : -1);
  }
}
function UploadtableComponent_Conditional_3_td_10_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 29)(1, "span", 32);
    \u0275\u0275text(2, "Initiating upload...");
    \u0275\u0275elementEnd()();
  }
}
function UploadtableComponent_Conditional_3_td_10_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 29)(1, "span", 32);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const row_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", row_r7.cStatus == "VC" ? "Verifying successfully" : "Verifying detail...", " ");
  }
}
function UploadtableComponent_Conditional_3_td_10_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 29)(1, "span", 32);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "number");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const row_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", row_r7.nProgress === 100 || row_r7.cStatus == "CS" ? "Conversion completed" : "Converting file... ", " ", \u0275\u0275pipeBind2(3, 2, row_r7.nProgress, "1.0-0") + "%", " ");
  }
}
function UploadtableComponent_Conditional_3_td_10_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 29)(1, "span", 32);
    \u0275\u0275text(2, "Unziping...");
    \u0275\u0275elementEnd()();
  }
}
function UploadtableComponent_Conditional_3_td_10_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 29);
    \u0275\u0275element(1, "div", 33);
    \u0275\u0275elementStart(2, "span", 32);
    \u0275\u0275text(3);
    \u0275\u0275elementStart(4, "span");
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "number");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const row_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(6, _c1, row_r7.nProgress + "%"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", row_r7.cStatus == "PSD" ? "Paused" : "uploading...", " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(6, 3, row_r7.nProgress, "1.0-0"), " %");
  }
}
function UploadtableComponent_Conditional_3_td_10_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 30);
    \u0275\u0275text(1, " Upload Completed ");
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 34);
    \u0275\u0275element(3, "path", 35);
    \u0275\u0275elementEnd()();
  }
}
function UploadtableComponent_Conditional_3_td_10_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 31)(1, "span", 32);
    \u0275\u0275text(2, "Failed");
    \u0275\u0275elementEnd()();
  }
}
function UploadtableComponent_Conditional_3_td_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 26);
    \u0275\u0275template(1, UploadtableComponent_Conditional_3_td_10_Conditional_1_Template, 4, 2, "div", 29)(2, UploadtableComponent_Conditional_3_td_10_Conditional_2_Template, 3, 0, "div", 29)(3, UploadtableComponent_Conditional_3_td_10_Conditional_3_Template, 3, 1, "div", 29)(4, UploadtableComponent_Conditional_3_td_10_Conditional_4_Template, 4, 5, "div", 29)(5, UploadtableComponent_Conditional_3_td_10_Conditional_5_Template, 3, 0, "div", 29)(6, UploadtableComponent_Conditional_3_td_10_Conditional_6_Template, 7, 8, "div", 29)(7, UploadtableComponent_Conditional_3_td_10_Conditional_7_Template, 4, 0, "div", 30)(8, UploadtableComponent_Conditional_3_td_10_Conditional_8_Template, 3, 0, "div", 31);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r7 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275conditional(1, row_r7.cStatus == "ZR" || row_r7.cStatus == "ZD" || row_r7.cStatus == "ZR" || row_r7.cStatus == "ZB" ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, row_r7.cStatus == "P" ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, row_r7.cStatus == "V" || row_r7.cStatus == "VC" ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(4, row_r7.cStatus == "CP" || row_r7.cStatus == "CS" ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(5, row_r7.cStatus == "Z" ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(6, row_r7.cStatus == "I" || row_r7.cStatus == "PSD" ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(7, row_r7.cStatus == "C" ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(8, row_r7.cStatus == "F" || row_r7.cStatus == "ZF" || row_r7.cStatus == "CF" ? 8 : -1);
  }
}
function UploadtableComponent_Conditional_3_th_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 27);
    \u0275\u0275text(1, " OCR progress ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275styleProp("width", "20%");
  }
}
function UploadtableComponent_Conditional_3_td_13_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 37);
    \u0275\u0275element(1, "icon", 47);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r8 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275propertyInterpolate1("matTooltip", "Total files : ", (row_r8 == null ? null : row_r8.nFiles) ? row_r8 == null ? null : row_r8.nFiles : (row_r8 == null ? null : row_r8.nOCRFiles) || 0, " including all extensions");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", (row_r8 == null ? null : row_r8.nFiles) ? row_r8 == null ? null : row_r8.nFiles : (row_r8 == null ? null : row_r8.nOCRFiles) || 0, " ");
  }
}
function UploadtableComponent_Conditional_3_td_13_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " - ");
  }
}
function UploadtableComponent_Conditional_3_td_13_Conditional_4_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 54);
    \u0275\u0275listener("click", function UploadtableComponent_Conditional_3_td_13_Conditional_4_Conditional_5_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r10);
      const row_r8 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.getOCRFiles(row_r8));
    });
    \u0275\u0275element(1, "span", 55);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r8 = \u0275\u0275nextContext(2).$implicit;
    const ocrlist_r11 = \u0275\u0275reference(6);
    \u0275\u0275property("matMenuTriggerFor", ocrlist_r11);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r8.nOProgress || 0);
  }
}
function UploadtableComponent_Conditional_3_td_13_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 48);
    \u0275\u0275text(1, "|");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 49)(3, "span", 50);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, UploadtableComponent_Conditional_3_td_13_Conditional_4_Conditional_5_Template, 3, 2, "span", 51);
    \u0275\u0275elementStart(6, "span", 52);
    \u0275\u0275listener("click", function UploadtableComponent_Conditional_3_td_13_Conditional_4_Template_span_click_6_listener() {
      \u0275\u0275restoreView(_r9);
      const row_r8 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.getOCRFiles(row_r8));
    });
    \u0275\u0275element(7, "img", 53);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const row_r8 = \u0275\u0275nextContext().$implicit;
    const ocrlist_r11 = \u0275\u0275reference(6);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275property("matTooltip", row_r8.nOCRFiles + " files are send to OCR from " + row_r8.nFiles + " Files");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", row_r8.nOCRFiles, " in OCR :");
    \u0275\u0275advance();
    \u0275\u0275conditional(5, row_r8.nOProgress > 0 || ctx_r2.parseToInt(row_r8.nCompleted || 0) + ctx_r2.parseToInt(row_r8.nFailed || 0) < ctx_r2.parseToInt(row_r8.nOCRFiles) ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("matMenuTriggerFor", ocrlist_r11);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r8.nCompleted);
  }
}
function UploadtableComponent_Conditional_3_td_13_For_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 46)(1, "td", 56)(2, "p", 57);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "td", 58)(5, "p", 59);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "td", 58)(8, "p", 59);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "td", 58)(12, "a", 60);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r12 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", item_r12.cFilename, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", item_r12.message ? item_r12.message : item_r12.cStatus == "P" ? "Pending" : item_r12.cStatus == "OCR" ? "In Process" : item_r12.cStatus == "F" ? "Failed" : "Completed", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(10, 4, item_r12.dStartDt, "dd MMM yyyy hh:m:ss"), " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.getTime(item_r12));
  }
}
function UploadtableComponent_Conditional_3_td_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 26)(1, "div", 36);
    \u0275\u0275template(2, UploadtableComponent_Conditional_3_td_13_Conditional_2_Template, 3, 3, "span", 37)(3, UploadtableComponent_Conditional_3_td_13_Conditional_3_Template, 1, 0)(4, UploadtableComponent_Conditional_3_td_13_Conditional_4_Template, 9, 5);
    \u0275\u0275elementStart(5, "mat-menu", 38, 2)(7, "div", 39)(8, "div", 40)(9, "table", 41)(10, "thead")(11, "tr")(12, "th", 42)(13, "p", 43);
    \u0275\u0275text(14, " File Name ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "th", 42)(16, "p", 44);
    \u0275\u0275text(17, " Status ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "th", 45)(19, "p", 44);
    \u0275\u0275text(20, " Started ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(21, "th", 45)(22, "p", 44);
    \u0275\u0275text(23, " Time Elapsed ");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(24, "tbody");
    \u0275\u0275repeaterCreate(25, UploadtableComponent_Conditional_3_td_13_For_26_Template, 14, 7, "tr", 46, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()()()()()();
  }
  if (rf & 2) {
    const row_r8 = ctx.$implicit;
    \u0275\u0275styleProp("width", "20%");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, (row_r8 == null ? null : row_r8.nFiles) > 0 && (row_r8 == null ? null : row_r8.nOCRFiles) > 0 ? 2 : 3);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(4, (row_r8 == null ? null : row_r8.nFiles) && (row_r8 == null ? null : row_r8.nOCRFiles) > 0 ? 4 : -1);
    \u0275\u0275advance(21);
    \u0275\u0275repeater(row_r8.ocrFiles);
  }
}
function UploadtableComponent_Conditional_3_th_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 27);
    \u0275\u0275text(1, " Size ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275styleProp("width", "100px");
  }
}
function UploadtableComponent_Conditional_3_td_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 26)(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "bytes");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const row_r13 = ctx.$implicit;
    \u0275\u0275styleProp("width", "100px");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 3, row_r13.filesize));
  }
}
function UploadtableComponent_Conditional_3_th_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 27);
    \u0275\u0275text(1, " kind ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275styleProp("width", "100px");
  }
}
function UploadtableComponent_Conditional_3_td_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "td", 26)(1, "img", 61);
    \u0275\u0275listener("error", function UploadtableComponent_Conditional_3_td_19_Template_img_error_1_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.handleError($event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const row_r15 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275styleProp("width", "100px");
    \u0275\u0275advance();
    \u0275\u0275property("src", ctx_r2.bindIcon(row_r15), \u0275\u0275sanitizeUrl);
  }
}
function UploadtableComponent_Conditional_3_Conditional_20_th_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 27);
    \u0275\u0275text(1, " Action ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275styleProp("width", "150px");
  }
}
function UploadtableComponent_Conditional_3_Conditional_20_td_2_button_1_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 66);
  }
  if (rf & 2) {
    \u0275\u0275property("src", "assets/icons/loaderblue.svg", \u0275\u0275sanitizeUrl);
  }
}
function UploadtableComponent_Conditional_3_Conditional_20_td_2_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 63);
    \u0275\u0275listener("click", function UploadtableComponent_Conditional_3_Conditional_20_td_2_button_1_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r16);
      const row_r17 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.replceFile(row_r17));
    });
    \u0275\u0275elementStart(1, "span", 64);
    \u0275\u0275element(2, "icon", 65);
    \u0275\u0275text(3, " Replace ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, UploadtableComponent_Conditional_3_Conditional_20_td_2_button_1_Conditional_4_Template, 1, 1, "img", 66);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r17 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(2, _c2, row_r17.isReplacing));
    \u0275\u0275advance(3);
    \u0275\u0275conditional(4, row_r17.isReplacing ? 4 : -1);
  }
}
function UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_button_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 69);
    \u0275\u0275listener("click", function UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_button_0_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r18);
      const row_r17 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.pauseUploading(row_r17));
    });
    \u0275\u0275element(1, "icon", 70);
    \u0275\u0275text(2, " Pause ");
    \u0275\u0275elementEnd();
  }
}
function UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 69);
    \u0275\u0275listener("click", function UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_button_1_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r19);
      const row_r17 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.resumeUploading(row_r17));
    });
    \u0275\u0275element(1, "icon", 71);
    \u0275\u0275text(2, " Resume ");
    \u0275\u0275elementEnd();
  }
}
function UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_button_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 72);
    \u0275\u0275listener("click", function UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_button_2_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r20);
      const row_r17 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.retryUpload(row_r17));
    });
    \u0275\u0275element(1, "icon", 73);
    \u0275\u0275text(2, " Retry ");
    \u0275\u0275elementEnd();
  }
}
function UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_button_0_Template, 3, 0, "button", 67)(1, UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_button_1_Template, 3, 0, "button", 67)(2, UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_button_2_Template, 3, 0, "button", 68);
  }
  if (rf & 2) {
    const row_r17 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngIf", row_r17.cStatus == "I");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", row_r17.cStatus == "PSD");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", row_r17.cStatus == "F" || row_r17.cStatus == "ZF");
  }
}
function UploadtableComponent_Conditional_3_Conditional_20_td_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 26);
    \u0275\u0275template(1, UploadtableComponent_Conditional_3_Conditional_20_td_2_button_1_Template, 5, 4, "button", 62)(2, UploadtableComponent_Conditional_3_Conditional_20_td_2_Conditional_2_Template, 3, 3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const row_r17 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275styleProp("width", "150px");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", row_r17.cStatus == "C");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ctx_r2.job.isLive ? 2 : -1);
  }
}
function UploadtableComponent_Conditional_3_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0, 19);
    \u0275\u0275template(1, UploadtableComponent_Conditional_3_Conditional_20_th_1_Template, 2, 2, "th", 12)(2, UploadtableComponent_Conditional_3_Conditional_20_td_2_Template, 3, 4, "td", 10);
    \u0275\u0275elementContainerEnd();
  }
}
function UploadtableComponent_Conditional_3_tr_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "tr", 74);
  }
}
function UploadtableComponent_Conditional_3_tr_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "tr", 75);
  }
}
function UploadtableComponent_Conditional_3_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "mat-paginator", 22);
  }
  if (rf & 2) {
    \u0275\u0275property("pageSizeOptions", \u0275\u0275pureFunction0(1, _c3));
  }
}
function UploadtableComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5)(1, "table", 7);
    \u0275\u0275elementContainerStart(2, 8);
    \u0275\u0275template(3, UploadtableComponent_Conditional_3_th_3_Template, 2, 3, "th", 9)(4, UploadtableComponent_Conditional_3_td_4_Template, 2, 3, "td", 10);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(5, 11);
    \u0275\u0275template(6, UploadtableComponent_Conditional_3_th_6_Template, 2, 2, "th", 12)(7, UploadtableComponent_Conditional_3_td_7_Template, 4, 3, "td", 10);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(8, 13);
    \u0275\u0275template(9, UploadtableComponent_Conditional_3_th_9_Template, 2, 0, "th", 14)(10, UploadtableComponent_Conditional_3_td_10_Template, 9, 8, "td", 15);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(11, 16);
    \u0275\u0275template(12, UploadtableComponent_Conditional_3_th_12_Template, 2, 2, "th", 12)(13, UploadtableComponent_Conditional_3_td_13_Template, 27, 4, "td", 10);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(14, 17);
    \u0275\u0275template(15, UploadtableComponent_Conditional_3_th_15_Template, 2, 2, "th", 12)(16, UploadtableComponent_Conditional_3_td_16_Template, 4, 5, "td", 10);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(17, 18);
    \u0275\u0275template(18, UploadtableComponent_Conditional_3_th_18_Template, 2, 2, "th", 12)(19, UploadtableComponent_Conditional_3_td_19_Template, 2, 3, "td", 10);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275template(20, UploadtableComponent_Conditional_3_Conditional_20_Template, 3, 0, "ng-container", 19)(21, UploadtableComponent_Conditional_3_tr_21_Template, 1, 0, "tr", 20)(22, UploadtableComponent_Conditional_3_tr_22_Template, 1, 0, "tr", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275template(23, UploadtableComponent_Conditional_3_Conditional_23_Template, 1, 2, "mat-paginator", 22);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("dataSource", ctx_r2.dataSource);
    \u0275\u0275advance(19);
    \u0275\u0275conditional(20, !ctx_r2.isReport ? 20 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("matHeaderRowDef", ctx_r2.displayedColumns);
    \u0275\u0275advance();
    \u0275\u0275property("matRowDefColumns", ctx_r2.displayedColumns);
    \u0275\u0275advance();
    \u0275\u0275conditional(23, (ctx_r2.dataSource == null ? null : ctx_r2.dataSource.data == null ? null : ctx_r2.dataSource.data.length) > 10 ? 23 : -1);
  }
}
var UploadtableComponent = class _UploadtableComponent {
  constructor(uploadManage, check, upld, tst, cdr) {
    this.uploadManage = uploadManage;
    this.check = check;
    this.upld = upld;
    this.tst = tst;
    this.cdr = cdr;
    this.isReport = false;
    this.displayedColumns = ["select", "cFilename", "cStatus", "total", "filetype", "filesize"];
    this.data = [];
    this.docIconPath = environment.iconpath_doc;
    this.selection = new SelectionModel(true, []);
    this.dataRecieved = new EventEmitter();
    this.onFilter = new EventEmitter();
    this.allSelected = false;
    this.onSelection = new EventEmitter();
    this.isTableloaded = false;
    this.sortDirection = {
      name: "asc",
      age: "asc"
    };
  }
  ngAfterViewChecked() {
    if (this.dataSource && this.dataSource.data.length > 0 && this.job.isLoading) {
      this.job.isLoading = false;
      this.applyFilter({ currentValue: this.filterdata });
      this.cdr.detectChanges();
    }
  }
  applyFilter(filtes) {
    this.dataSource.filter = filtes;
    this.emitFilteredDataCount();
  }
  ngOnChanges(changes) {
    if (changes["filterdata"] && !changes["filterdata"].firstChange) {
      this.applyFilter(changes["filterdata"]);
    }
    if (changes["data"] && !changes["data"].firstChange) {
      if (this.isTableloaded) {
        this.dataSource.data = changes["data"].currentValue;
      } else {
        this.initTable();
      }
    }
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.cdr.detectChanges();
  }
  ngOnInit() {
    if (!this.isReport) {
      this.displayedColumns.push("action");
    }
    this.initTable();
  }
  initTable() {
    this.isTableloaded = true;
    this.dataSource = new MatTableDataSource(this.data);
    this.dataSource.filterPredicate = (data, filter) => {
      try {
        const { cAction, cStatus, cFormat, cSearch } = filter["currentValue"];
        if (cAction?.value && data.cStatus !== cAction.value) {
          return false;
        }
        if (cStatus?.value && data.cStatus !== cStatus.value) {
          return false;
        }
        if (cFormat?.value && !cFormat.value.includes(data.filetype)) {
          return false;
        }
        if (cSearch && data.cFilename.toLowerCase().indexOf(cSearch.toLowerCase()) === -1) {
          return false;
        }
      } catch (error) {
        console.error(error);
      }
      return true;
    };
    this.emitFilteredDataCount();
  }
  istextTruncated(el) {
    return el.scrollWidth > el.clientWidth;
  }
  emitFilteredDataCount() {
    const filteredCount = this.dataSource.filteredData.length;
    this.onFilter.emit(filteredCount);
  }
  bindIcon(node) {
    try {
      const fileType = node.filetype.toLowerCase();
      return `${this.docIconPath}${fileType}.svg`;
    } catch (error) {
      return `${this.docIconPath}other.svg`;
    }
  }
  pauseUploading(x) {
    x.cStatus = "PSD";
    this.uploadManage.pauseUpload(x);
  }
  resumeUploading(x) {
    x.cStatus = "I";
    this.uploadManage.resumeUpload(x);
  }
  replceFile(x) {
    this.replaceableFile = x;
    this.fileuploader.nativeElement.click();
  }
  retryUpload(x) {
    return __async(this, null, function* () {
      if (x.file) {
        let upldFile = yield this.check.createStructure(x.file, x.nBundledetailid, x.nUDid, x.nUPid);
        Object.assign(x, upldFile);
        x.cStatus = "I";
        x.nProgress = 0;
        yield this.uploadManage.replaceFile([upldFile], this.job.nSectionid, this.job.nUPid);
      } else {
        this.tst.openSnackBar("Failed to retry", "E");
      }
    });
  }
  changeFile(e) {
    return __async(this, null, function* () {
      let file = e.target.files[0];
      this.replaceableFile.isReplacing = true;
      try {
        if (file) {
          let mdl = {
            nUDid: this.replaceableFile.nUDid,
            cName: file.name + " (copy)",
            cType: this.check.getFileType(file.name),
            cSize: file.size.toString()
          };
          let resOfReplace = yield this.upld.replacefile(mdl);
          if (resOfReplace) {
            let upldFile = yield this.check.createStructure(file, this.replaceableFile.nBundledetailid, this.replaceableFile.nUDid, this.replaceableFile.nUPid);
            Object.assign(this.replaceableFile, upldFile);
            this.replaceableFile.cStatus = "I";
            this.replaceableFile.nProgress = 0;
            yield this.uploadManage.replaceFile([upldFile], this.job.nSectionid, this.job.nUPid);
          } else {
            this.tst.openSnackBar("Faild to replace", "E");
          }
        }
      } catch (error) {
        this.tst.openSnackBar("Faild to replace", "E");
      }
      delete this.replaceableFile.isReplacing;
    });
  }
  OnAllChange() {
    this.data.map((a) => a.isChecked = this.allSelected);
    let values = this.data.map(({ isChecked, nUDid }) => [nUDid, isChecked]);
    this.onSelection.emit(values);
  }
  onSelect(row) {
    if (this.data.findIndex((a) => !a.isChecked) > -1) {
      this.allSelected = false;
    } else {
      this.allSelected = true;
    }
    this.onSelection.emit([[row.nUDid, row.isChecked]]);
  }
  handleError(event) {
    event.target.src = "assets/icons/doc-icons/other.svg";
  }
  sortData(column) {
    const data = this.dataSource.data.slice();
    const direction = this.sortDirection[column];
    data.sort((a, b) => {
      const isAsc = direction === "asc";
      switch (column) {
        case "name":
          return this.compare(a.cFilename, b.cFilename, isAsc);
        case "status":
          return this.compare(a.cStatus, b.cStatus, isAsc);
        default:
          return 0;
      }
    });
  }
  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
  tempData() {
    try {
      return JSON.stringify(this.dataSource.data[0]);
    } catch (error) {
      return "";
    }
  }
  getOCRFiles(row) {
    this.upld.getFileData(row.nUDid, row);
  }
  getTime(row) {
    const now = row.dStartDt ? new Date(row.dStartDt) : null;
    if (!now) {
      return "";
    } else {
      let endDt = row.dEndDt;
      if (row.nCompleted != row.nOCRFiles) {
        endDt = /* @__PURE__ */ new Date();
      }
      const oneDayAgo = endDt ? new Date(endDt) : /* @__PURE__ */ new Date();
      const diffMilliseconds = oneDayAgo - now;
      const diffSeconds = Math.floor(diffMilliseconds / 1e3);
      const totalMinutes = Math.floor(diffSeconds / 60);
      const totalSeconds = diffSeconds % 60;
      return `${totalMinutes} minute ${totalSeconds} second`;
    }
  }
  parseToInt(value) {
    try {
      return parseInt(value) || 0;
    } catch (error) {
      return 0;
    }
  }
  static {
    this.\u0275fac = function UploadtableComponent_Factory(t) {
      return new (t || _UploadtableComponent)(\u0275\u0275directiveInject(UploadManagementService), \u0275\u0275directiveInject(CheckDuplicacyService), \u0275\u0275directiveInject(UploadService), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UploadtableComponent, selectors: [["uploadtable"]], viewQuery: function UploadtableComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(MatTable, 5);
        \u0275\u0275viewQuery(_c0, 7);
        \u0275\u0275viewQuery(MatPaginator, 5);
        \u0275\u0275viewQuery(MatSort, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.table = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.fileuploader = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.paginator = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.sort = _t.first);
      }
    }, inputs: { filterdata: "filterdata", isReport: "isReport", data: "data", job: "job" }, outputs: { dataRecieved: "dataRecieved", onFilter: "onFilter", onSelection: "onSelection" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 6, vars: 1, consts: [["fileswrapper", ""], ["fileuploader", ""], ["ocrlist", "matMenu"], [1, "min-h-32", "h-full", "w-full", "bg-white"], [1, "files-wrapper", "h-full", "flex", "flex-col"], [1, "upload-table"], ["type", "file", 1, "hidden", 3, "change"], ["mat-table", "", "matSort", "", 3, "dataSource"], ["matColumnDef", "select"], ["mat-header-cell", "", 3, "width", 4, "matHeaderCellDef"], ["mat-cell", "", 3, "width", 4, "matCellDef"], ["matColumnDef", "cFilename"], ["mat-header-cell", "", "mat-sort-header", "", 3, "width", 4, "matHeaderCellDef"], ["matColumnDef", "cStatus"], ["width", "25%", "mat-header-cell", "", "mat-sort-header", "", 4, "matHeaderCellDef"], ["mat-cell", "", 4, "matCellDef"], ["matColumnDef", "total"], ["matColumnDef", "filesize"], ["matColumnDef", "filetype"], ["matColumnDef", "action"], ["class", "!bg-blue-hover", "mat-header-row", "", 4, "matHeaderRowDef"], ["mat-row", "", 4, "matRowDef", "matRowDefColumns"], ["hidePageSize", "", "showFirstLastButtons", "", "aria-label", "Select page of users", 3, "pageSizeOptions"], ["mat-header-cell", ""], [3, "ngModel"], [3, "ngModelChange", "change", "ngModel"], ["mat-cell", ""], ["mat-header-cell", "", "mat-sort-header", ""], ["width", "25%", "mat-header-cell", "", "mat-sort-header", ""], [1, "bg-blue-on/75", "overflow-hidden", "flex", "relative", "items-center", "p-1.5", "w-full", "rounded-lg", "justify-between", "realtive"], [1, "flex", "items-center", "text-sgreen", "gap-2", "whitespace-nowrap"], [1, "bg-red-500/75", "overflow-hidden", "flex", "relative", "items-center", "p-1.5", "w-full", "rounded-lg", "justify-between", "realtive"], [1, "text-white", "relative", "z-20"], [1, "divprogress", "absolute", "z-10", "bg-blue-on", "left-0", "h-full", "w-1/2", 3, "ngStyle"], ["width", "16", "height", "16", "viewBox", "0 0 16 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M8 0C6.41775 0 4.87103 0.469192 3.55544 1.34824C2.23985 2.22729 1.21447 3.47672 0.608967 4.93853C0.00346627 6.40034 -0.15496 8.00887 0.153721 9.56072C0.462403 11.1126 1.22433 12.538 2.34315 13.6569C3.46197 14.7757 4.88743 15.5376 6.43928 15.8463C7.99113 16.155 9.59966 15.9965 11.0615 15.391C12.5233 14.7855 13.7727 13.7602 14.6518 12.4446C15.5308 11.129 16 9.58225 16 8C16 6.94942 15.7931 5.90914 15.391 4.93853C14.989 3.96793 14.3997 3.08601 13.6569 2.34315C12.914 1.60028 12.0321 1.011 11.0615 0.608964C10.0909 0.206926 9.05058 0 8 0ZM11.44 6.088L7.784 10.888C7.70948 10.9848 7.61377 11.0633 7.50421 11.1173C7.39466 11.1714 7.27418 11.1997 7.152 11.2C7.03049 11.2007 6.91042 11.1736 6.80091 11.1209C6.69141 11.0683 6.59534 10.9913 6.52 10.896L4.568 8.408C4.50339 8.325 4.45576 8.23009 4.42783 8.12869C4.3999 8.02729 4.39221 7.92138 4.40521 7.817C4.41821 7.71263 4.45164 7.61184 4.5036 7.52039C4.55555 7.42893 4.62501 7.34861 4.708 7.284C4.87562 7.15351 5.08821 7.09495 5.299 7.12121C5.40337 7.13421 5.50416 7.16764 5.59561 7.21959C5.68707 7.27155 5.76739 7.341 5.832 7.424L7.136 9.088L10.16 5.088C10.2241 5.00395 10.3041 4.93335 10.3955 4.88023C10.4868 4.8271 10.5878 4.7925 10.6925 4.77838C10.7973 4.76427 10.9038 4.77092 11.0059 4.79797C11.1081 4.82501 11.204 4.87191 11.288 4.936C11.372 5.00008 11.4426 5.0801 11.4958 5.17147C11.5489 5.26284 11.5835 5.36377 11.5976 5.46852C11.6117 5.57326 11.6051 5.67976 11.578 5.78193C11.551 5.88411 11.5041 5.97995 11.44 6.064V6.088Z", "fill", "#00B89C"], [1, "flex", "text-xs", "font-semibold", "text-grey"], [1, "text-grey", "font-semibold", "whitespace-nowrap", 3, "matTooltip"], [1, "w-[800px]", "!min-w-[800px]", "!max-w-[800px]", "mt-5", "-ml-[350px]"], [1, "w-full"], [1, "relative", "flex", "flex-col", "w-full", "h-full", "overflow-scroll", "text-gray-700", "bg-white", "shadow-md", "bg-clip-border", "rounded-xl"], [1, "w-full", "text-left", "table-auto", "min-w-max"], [1, "p-2", "border-b", "border-blue-gray-100", "bg-blue-gray-50"], [1, "block", "font-sans", "text-xs", "antialiased", "font-normal", "leading-none", "opacity-70", "w-[200px]"], [1, "block", "font-sans", "text-xs", "antialiased", "font-normal", "leading-none", "opacity-70"], [1, "p-2", "border-b", "border-blue-gray-100", "bg-blue-gray-50", "w-36"], [1, "even:bg-blue-gray-50/50"], ["name", "file"], [1, "mx-1", "opacity-40"], [1, "flex", "items-center", "gap-3", "whitespace-nowrap"], [3, "matTooltip"], [1, "flex", "items-center", "gap-1", "cursor-pointer", "text-blue-on", "hover:underline", 3, "matMenuTriggerFor"], [1, "flex", "items-center", "gap-1", "font-normal", 3, "click", "matMenuTriggerFor"], ["src", "assets/icons/checkgreen.svg"], [1, "flex", "items-center", "gap-1", "cursor-pointer", "text-blue-on", "hover:underline", 3, "click", "matMenuTriggerFor"], [1, "loader"], [1, "p-2", "w-[200px]"], [1, "block", "font-sans", "text-xs", "antialiased", "font-normal", "leading-normal", "max-w-[200px]", "truncate"], [1, "p-2"], [1, "block", "font-sans", "text-xs", "antialiased", "font-normal", "leading-normal"], ["href", "#", 1, "block", "font-sans", "text-xs", "antialiased", "font-medium", "leading-normal"], ["width", "16px", 3, "error", "src"], ["class", "h-6 px-3 items-center relative justify-center gap-2 rounded-base flex item-center border hover:border-blue-on hover:text-blue-on", 3, "click", 4, "ngIf"], [1, "h-6", "px-3", "items-center", "relative", "justify-center", "gap-2", "rounded-base", "flex", "item-center", "border", "hover:border-blue-on", "hover:text-blue-on", 3, "click"], [1, "flex", "gap-1", "items-center", 3, "ngClass"], ["name", "replace", "type", "extra"], ["width", "16", 1, "animate-spin", "absolute", "left-1/2", "top-1/2", "-translate-x-1/2", "-translate-y-1/2", 3, "src"], ["class", "h-6 px-3 items-center justify-center gap-2 rounded-base flex item-center border hover:border-blue-on hover:text-blue-on", 3, "click", 4, "ngIf"], ["class", "flex items-center gap-2 h-6 px-3.5 rounded-lg bg-red-100 text-red-500 !border border-solid border-red-500", 3, "click", 4, "ngIf"], [1, "h-6", "px-3", "items-center", "justify-center", "gap-2", "rounded-base", "flex", "item-center", "border", "hover:border-blue-on", "hover:text-blue-on", 3, "click"], ["name", "pause", "type", "extra"], ["name", "resume", "type", "extra"], [1, "flex", "items-center", "gap-2", "h-6", "px-3.5", "rounded-lg", "bg-red-100", "text-red-500", "!border", "border-solid", "border-red-500", 3, "click"], ["name", "retry", "type", "extra"], ["mat-header-row", "", 1, "!bg-blue-hover"], ["mat-row", ""]], template: function UploadtableComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 3);
        \u0275\u0275element(1, "div", 4, 0);
        \u0275\u0275template(3, UploadtableComponent_Conditional_3_Template, 24, 5, "div", 5);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "input", 6, 1);
        \u0275\u0275listener("change", function UploadtableComponent_Template_input_change_4_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.changeFile($event));
        });
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275conditional(3, (ctx.data == null ? null : ctx.data.length) ? 3 : -1);
      }
    }, dependencies: [CommonModule, NgClass, NgIf, NgStyle, DecimalPipe, DatePipe, MatTooltipModule, MatTooltip, IconComponent, MatCheckboxModule, MatCheckbox, FormsModule, NgControlStatus, NgModel, BytesPipe, MatInputModule, MatTableModule, MatTable, MatHeaderCellDef, MatHeaderRowDef, MatColumnDef, MatCellDef, MatRowDef, MatHeaderCell, MatCell, MatHeaderRow, MatRow, MatSortModule, MatSort, MatSortHeader, MatPaginatorModule, MatPaginator, MatMenuModule, MatMenu, MatMenuTrigger], styles: ['\n\n.files-wrapper[_ngcontent-%COMP%] {\n  --drag: 0px;\n  --order: 0px;\n  --checkbox: 30px;\n  --bundle: 0px;\n  --tab: 44px;\n  --links: 0px;\n  --impact: 0px;\n  --relevence: 0px;\n  --pagination: 255px;\n  --exhibit: 75px;\n  --kind: 85px;\n  --doi: 130px;\n  --extra: 20px;\n  --name: (var(--tab) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit));\n  --desc: (var(--drag) + var(--order) + var(--checkbox) + var(--bundle) + var(--tab) + var(--links) + var(--impact) + var(--relevence) + var(--pagination) + var(--kind) + var(--doi) + var(--exhibit) + var(--extra));\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%] {\n  display: inline-flex;\n  font-size: 10px;\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .drag[_ngcontent-%COMP%] {\n  width: var(--drag);\n  min-width: var(--drag);\n  max-width: var(--drag);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%] {\n  width: var(--order);\n  min-width: var(--order);\n  max-width: var(--order);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .input[_ngcontent-%COMP%] {\n  width: var(--checkbox);\n  min-width: var(--checkbox);\n  max-width: var(--checkbox);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .bundle[_ngcontent-%COMP%] {\n  width: var(--bundle);\n  min-width: var(--bundle);\n  max-width: var(--bundle);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .tab[_ngcontent-%COMP%] {\n  width: var(--tab);\n  min-width: var(--tab);\n  max-width: var(--tab);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .links[_ngcontent-%COMP%] {\n  width: var(--links);\n  min-width: var(--links);\n  max-width: var(--links);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .impact[_ngcontent-%COMP%] {\n  width: var(--impact);\n  min-width: var(--impact);\n  max-width: var(--impact);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .relevence[_ngcontent-%COMP%] {\n  width: var(--relevence);\n  min-width: var(--relevence);\n  max-width: var(--relevence);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .page[_ngcontent-%COMP%] {\n  width: var(--pagination);\n  min-width: var(--pagination);\n  max-width: var(--pagination);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .exhibit[_ngcontent-%COMP%] {\n  width: var(--exhibit);\n  min-width: var(--exhibit);\n  max-width: var(--exhibit);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .kind[_ngcontent-%COMP%] {\n  width: var(--kind);\n  min-width: var(--kind);\n  max-width: var(--kind);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .doi[_ngcontent-%COMP%] {\n  width: var(--doi);\n  min-width: var(--doi);\n  max-width: var(--doi);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .extra[_ngcontent-%COMP%] {\n  width: var(--extra);\n  min-width: var(--extra);\n  max-width: var(--extra);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .name[_ngcontent-%COMP%] {\n  width: calc(100% - var(--name));\n  max-width: 100%;\n  max-width: var(--tab)var(--pagination)var(--kind)var(--doi)var(--exhibit);\n}\n.files-wrapper[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%], .files-wrapper[_ngcontent-%COMP%]   .body[_ngcontent-%COMP%]   .desc[_ngcontent-%COMP%] {\n  width: calc((100% - var(--desc)) / 2);\n  max-width: 100%;\n}\ntable[_ngcontent-%COMP%] {\n  --mat-table-header-container-height: 44px;\n  --mat-table-header-headline-size: 12px;\n  --mat-table-row-item-container-height: 44px;\n  --mat-table-row-item-label-text-size: 12px;\n}\nmat-paginator[_ngcontent-%COMP%] {\n  --mat-paginator-container-size: 44px;\n}\n.loader[_ngcontent-%COMP%] {\n  width: 14px;\n  height: 14px;\n  border: 1px solid #003cff;\n  border-bottom-color: transparent;\n  border-radius: 50%;\n  display: inline-block;\n  box-sizing: border-box;\n  animation: _ngcontent-%COMP%_rotation 1s linear infinite;\n}\n@keyframes _ngcontent-%COMP%_rotation {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.ocrloader[_ngcontent-%COMP%] {\n  display: block;\n  position: relative;\n  height: 16px;\n  border: 1px solid #dfdfdf;\n  width: 17px;\n  background: #fafafa;\n  box-sizing: border-box;\n  font-size: 6px;\n  text-align: center;\n  font-weight: bold;\n}\n.ocrloader[_ngcontent-%COMP%]:before {\n  content: "";\n  position: absolute;\n  left: 0;\n  bottom: -2px;\n  width: 2px;\n  height: 20px;\n  background: #002f64;\n  animation: _ngcontent-%COMP%_ballbns 1s ease-in-out infinite alternate;\n}\n@keyframes _ngcontent-%COMP%_ballbns {\n  0% {\n    left: -10%;\n    transform: translateX(0%);\n  }\n  100% {\n    left: 110%;\n    transform: translateX(-100%);\n  }\n}\n/*# sourceMappingURL=uploadtable.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UploadtableComponent, { className: "UploadtableComponent", filePath: "src\\app\\adminpanel\\components\\upload\\uploadtable\\uploadtable.component.ts", lineNumber: 39 });
})();
export {
  UploadtableComponent
};
//# sourceMappingURL=chunk-KOZCXLHP.js.map
