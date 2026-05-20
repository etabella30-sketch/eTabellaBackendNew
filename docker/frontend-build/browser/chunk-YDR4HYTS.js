import {
  PaginationService
} from "./chunk-3FBNC3RN.js";
import {
  BundlemanageService
} from "./chunk-TR5DVTEU.js";
import {
  MYFILES_TOOL_EVENTS,
  SharewithteamComponent
} from "./chunk-UPZPMN2N.js";
import {
  ColorpickerComponent
} from "./chunk-BOOJJNDB.js";
import {
  NgScrollbar,
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import {
  SkeletonComponent
} from "./chunk-KEJC4ZXM.js";
import {
  HyperLinkFolderComponent,
  TruncateTooltipDirective
} from "./chunk-QRO7O7ZW.js";
import {
  TabletruncComponent
} from "./chunk-QZORCCWS.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  MatSlideToggle,
  MatSlideToggleModule
} from "./chunk-43QUFIPG.js";
import {
  MatRadioButton,
  MatRadioGroup,
  MatRadioModule
} from "./chunk-ILBZODYX.js";
import {
  MyfileService
} from "./chunk-M4TJ3SSY.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
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
  InputComponent
} from "./chunk-FEMUAMTL.js";
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
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
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
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  MYFILES_CHANGEFOLDER_EVENTS,
  MYFILES_CS_EVENTS,
  MYFILES_CS_TYPES,
  MYFILES_CUT_COPY_TYPES,
  MYFILES_FOLDER_TYPE_GROUPS,
  SKELETON_ARRAYS
} from "./chunk-6RMJH3FI.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ScrollingModule
} from "./chunk-MESCMVD2.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  AsyncPipe,
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  BehaviorSubject,
  ChangeDetectorRef,
  EventEmitter,
  __async,
  __spreadProps,
  __spreadValues,
  firstValueFrom,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpropertyInterpolate,
  ɵɵpropertyInterpolate1,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction5,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
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
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/bundlemanagement/section-creation/section-creation.component.ts
var SectionCreationComponent = class _SectionCreationComponent {
  constructor(dialogRef, data, bundleS) {
    this.dialogRef = dialogRef;
    this.data = data;
    this.bundleS = bundleS;
    this.cFolder = "";
    this.permission = "N";
    this.nCaseid = data["nCaseid"];
    this.nSectionid = data["nSectionid"];
    this.cFoldertype = data["cFoldertype"] ? data["cFoldertype"] : null;
    this.cFolder = data["cFolder"] ? data["cFolder"] : null;
    if (this.nSectionid) {
      this.permission = "E";
    }
  }
  onSubmit() {
    return __async(this, null, function* () {
      if (this.cFolder.trim() != "") {
        let res;
        if (this.cFoldertype == "CF") {
          var mdl = { nCaseid: this.nCaseid, nSectionid: this.nSectionid ? this.nSectionid : null, cFolder: this.cFolder, permission: this.permission, cFoldertype: this.cFoldertype };
          res = yield this.bundleS.usersectionBuilder(mdl);
        } else {
          var mdl1 = { nCaseid: this.nCaseid, nSectionid: this.nSectionid ? this.nSectionid : null, cFolder: this.cFolder, cFoldertype: this.cFoldertype, permission: this.permission };
          res = yield this.bundleS.sectionBuilder(mdl1);
        }
        if (res) {
          this.dialogRef.close({ isSave: true });
        }
      }
    });
  }
  close() {
    this.dialogRef.close();
  }
  static {
    this.\u0275fac = function SectionCreationComponent_Factory(t) {
      return new (t || _SectionCreationComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA), \u0275\u0275directiveInject(BundlemanageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SectionCreationComponent, selectors: [["app-section-creation"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 10, vars: 6, consts: [[1, "p-10"], [1, "text-lg", "font-semibold", "mb-2"], [1, "flex", "items-end", "gap-2", "mb-6"], ["placeholder", "Enter Section Name", 1, "block", "w-full", 3, "valueChange", "isrequired", "showlabel", "value"], [1, "flex", "gap-2"], [3, "click"], [3, "click", "mode"]], template: function SectionCreationComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
        \u0275\u0275text(2, "Bundle Name");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(3, "div", 2)(4, "inpt", 3);
        \u0275\u0275listener("valueChange", function SectionCreationComponent_Template_inpt_valueChange_4_listener($event) {
          return ctx.cFolder = $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(5, "div", 4)(6, "btn", 5);
        \u0275\u0275listener("click", function SectionCreationComponent_Template_btn_click_6_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275text(7);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(8, "btn", 6);
        \u0275\u0275listener("click", function SectionCreationComponent_Template_btn_click_8_listener() {
          return ctx.close();
        });
        \u0275\u0275text(9, "Cancel");
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275property("isrequired", true)("showlabel", false)("value", ctx.cFolder);
        \u0275\u0275advance(2);
        \u0275\u0275attribute("isdisabled", !ctx.cFolder || (ctx.cFolder == null ? null : ctx.cFolder.trim()) == "");
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" ", ctx.permission == "N" ? "Create" : "Update", "");
        \u0275\u0275advance();
        \u0275\u0275property("mode", "white");
      }
    }, dependencies: [CommonModule, InputComponent, ButtonComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SectionCreationComponent, { className: "SectionCreationComponent", filePath: "src\\app\\adminpanel\\components\\bundlemanagement\\section-creation\\section-creation.component.ts", lineNumber: 17 });
})();

// src/app/shared/components/myfiles/convert-folder/convert-folder.component.ts
function ConvertFolderComponent_For_19_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 18)(1, "div", 9)(2, "mat-checkbox", 10);
    \u0275\u0275twoWayListener("ngModelChange", function ConvertFolderComponent_For_19_Conditional_0_Template_mat_checkbox_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r1);
      const item_r2 = \u0275\u0275nextContext().$implicit;
      \u0275\u0275twoWayBindingSet(item_r2.isConvert, $event) || (item_r2.isConvert = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function ConvertFolderComponent_For_19_Conditional_0_Template_mat_checkbox_change_2_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.select());
    });
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("checked", item_r2.isConvert);
    \u0275\u0275twoWayProperty("ngModel", item_r2.isConvert);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r2.type);
  }
}
function ConvertFolderComponent_For_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ConvertFolderComponent_For_19_Conditional_0_Template, 4, 3, "mat-option", 18);
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    \u0275\u0275conditional(0, item_r2.type != "PDF" ? 0 : -1);
  }
}
function ConvertFolderComponent_Conditional_20_For_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "span", 20);
    \u0275\u0275listener("click", function ConvertFolderComponent_Conditional_20_For_2_Conditional_0_Template_span_click_2_listener() {
      \u0275\u0275restoreView(_r4);
      const item_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      item_r5.isConvert = false;
      return \u0275\u0275resetView(ctx_r2.select());
    });
    \u0275\u0275element(3, "icon", 21);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" .", item_r5.type, " to PDF ");
  }
}
function ConvertFolderComponent_Conditional_20_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ConvertFolderComponent_Conditional_20_For_2_Conditional_0_Template, 4, 1, "div", 19);
  }
  if (rf & 2) {
    const item_r5 = ctx.$implicit;
    \u0275\u0275conditional(0, item_r5.isConvert ? 0 : -1);
  }
}
function ConvertFolderComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11);
    \u0275\u0275repeaterCreate(1, ConvertFolderComponent_Conditional_20_For_2_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.filetypes);
  }
}
var ConvertFolderComponent = class _ConvertFolderComponent {
  constructor(dialogRef, data, cd, mfs) {
    this.dialogRef = dialogRef;
    this.data = data;
    this.cd = cd;
    this.mfs = mfs;
    this.cBundletag = "";
    this.cName = "";
    this.isAuto = 1;
    this.filetypes = [];
    this.convertType = "B";
    this.isAllconvert = false;
    this.bMetadata = true;
    this.selectedtype = "ALL";
    this.jBids = [];
    this.jBDids = [];
    this.cFiletype = "ALL";
    this.selectedtypes = [];
    debugger;
    this.cName = data["cName"] ? data["cName"] : null;
    this.nBundleid = data["nBundleid"] ? data["nBundleid"] : null;
    this.nSectionid = data["nSectionid"] ? data["nSectionid"] : null;
    this.jBids = data["jBids"] ? data["jBids"] : [];
    this.jBDids = data["jBDids"] ? data["jBDids"] : [];
    this.cFiletype = data["cFiletype"] ? data["cFiletype"] : "ALL";
  }
  ngOnInit() {
    debugger;
    if (this.jBids && this.jBids.length || this.jBDids && this.jBDids.length) {
      this.getFrtpes();
    } else if (this.nBundleid) {
      this.jBids = [this.nBundleid];
      this.getFrtpes();
    }
  }
  getFrtpes() {
    return __async(this, null, function* () {
      let jBids = `{${this.jBids.map((e) => e).toString()}}`;
      let jBDids = `{${this.jBDids.map((e) => e).toString()}}`;
      let data = yield this.mfs.getFileTypes(jBids, jBDids, this.nSectionid);
      data.map((a) => a["isConvert"] = true);
      this.filetypes = data;
      this.select();
    });
  }
  allConvertChange(event) {
    this.filetypes.map((a) => a.isConvert = event.checked);
    this.cd.detectChanges();
    return;
  }
  onSubmit() {
    return __async(this, null, function* () {
      const jFtypes = this.filetypes.filter((a) => a.isConvert).map((e) => e.type);
      let jBids = `{${this.jBids.map((e) => e).toString()}}`;
      let jBDids = `{${this.jBDids.map((e) => e).toString()}}`;
      this.dialogRef.close({ isSave: true, jBids, jBDids, jFtypes, cConvertType: this.convertType, bMetadata: this.bMetadata });
    });
  }
  close() {
    this.dialogRef.close();
  }
  select() {
    if (this.filetypes.filter((a) => a.isConvert).length == this.filetypes.length) {
      this.isAllconvert = true;
    } else {
      this.isAllconvert = false;
    }
  }
  checklength() {
    if (this.filetypes.length && this.filetypes.filter((e) => e.isConvert).length) {
      return false;
    }
    return true;
  }
  static {
    this.\u0275fac = function ConvertFolderComponent_Factory(t) {
      return new (t || _ConvertFolderComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(MyfileService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ConvertFolderComponent, selectors: [["app-convert-folder"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 32, vars: 10, consts: [[1, "p-5"], [1, "text-base", "flex", "justify-between", "font-semibold", "mb-7"], ["name", "close", 1, "text-xs", "ms-auto", "cursor-pointer", "hover:text-blue-500", 3, "click"], [1, "h-full", "flex", "gap-0", "flex-col"], [1, "text-xs", "mb-2", "flex", "items-center", "justify-between", 3, "click"], [1, "w-full"], ["disableOptionCentering", "", "panelClass", "", "placeholder", "All", "panelClass", "min-w-fit", 1, "border-solid", "border", "border-white/40", "mx-auto", "min-w-40", "rounded-base", 3, "ngModelChange", "ngModel"], [1, "flex", "items-center", "gap-2", "text-xs"], [1, "group", "!p-1", "py.2", 3, "value"], [1, "flex", "items-center", "gap-2.5"], [3, "ngModelChange", "change", "checked", "ngModel"], [1, "mt-2", "bg-reply", "p-2.5", "flex", "gap-2.5", "flex-wrap"], [1, "gap-5", "flex", "mt-6"], [1, "radiocheckbox", 3, "click", "checked"], [1, "my-6"], [1, "flex", "items-center", "justify-between"], [3, "ngModelChange", "checked", "ngModel"], [3, "click", "disabled"], [1, "mt-1.5", "py-2"], [1, "p-2", "w-fit", "shadow-sm", "bg-white", "flex", "rounded-md", "items-center", "gap-2.5", "justify-between", "text-xs"], [3, "click"], ["name", "backspace", "type", "extra", 1, "text-lg", "cursor-pointer"]], template: function ConvertFolderComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
        \u0275\u0275text(2);
        \u0275\u0275elementStart(3, "icon", 2);
        \u0275\u0275listener("click", function ConvertFolderComponent_Template_icon_click_3_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "div")(5, "div", 3)(6, "div")(7, "div", 4);
        \u0275\u0275listener("click", function ConvertFolderComponent_Template_div_click_7_listener() {
          ctx.convertType != "C" ? ctx.allConvertChange({ checked: true }) : null;
          ctx.convertType = "C";
          return ctx.isAllconvert = true;
        });
        \u0275\u0275text(8, " Choose File Types ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "mat-form-field", 5)(10, "mat-select", 6);
        \u0275\u0275twoWayListener("ngModelChange", function ConvertFolderComponent_Template_mat_select_ngModelChange_10_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.selectedtypes, $event) || (ctx.selectedtypes = $event);
          return $event;
        });
        \u0275\u0275elementStart(11, "mat-select-trigger")(12, "div", 7);
        \u0275\u0275text(13, " Select Type ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(14, "mat-option", 8)(15, "div", 9)(16, "mat-checkbox", 10);
        \u0275\u0275twoWayListener("ngModelChange", function ConvertFolderComponent_Template_mat_checkbox_ngModelChange_16_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.isAllconvert, $event) || (ctx.isAllconvert = $event);
          return $event;
        });
        \u0275\u0275listener("change", function ConvertFolderComponent_Template_mat_checkbox_change_16_listener($event) {
          return ctx.allConvertChange($event);
        });
        \u0275\u0275text(17, "All");
        \u0275\u0275elementEnd()()();
        \u0275\u0275repeaterCreate(18, ConvertFolderComponent_For_19_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(20, ConvertFolderComponent_Conditional_20_Template, 3, 0, "div", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(21, "div", 12)(22, "mat-checkbox", 13);
        \u0275\u0275listener("click", function ConvertFolderComponent_Template_mat_checkbox_click_22_listener() {
          return ctx.convertType = "B";
        });
        \u0275\u0275text(23, "Keep Both");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(24, "mat-checkbox", 13);
        \u0275\u0275listener("click", function ConvertFolderComponent_Template_mat_checkbox_click_24_listener() {
          return ctx.convertType = "C";
        });
        \u0275\u0275text(25, "Keep Convert");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275element(26, "hr", 14);
        \u0275\u0275elementStart(27, "div", 15)(28, "mat-checkbox", 16);
        \u0275\u0275twoWayListener("ngModelChange", function ConvertFolderComponent_Template_mat_checkbox_ngModelChange_28_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.bMetadata, $event) || (ctx.bMetadata = $event);
          return $event;
        });
        \u0275\u0275text(29, "Copy All Metadata");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(30, "btn", 17);
        \u0275\u0275listener("click", function ConvertFolderComponent_Template_btn_click_30_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275text(31, " Convert");
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1("Convert ", ctx.cName && ctx.cName != "" ? ctx.cName : "Bundle", " ");
        \u0275\u0275advance(8);
        \u0275\u0275twoWayProperty("ngModel", ctx.selectedtypes);
        \u0275\u0275advance(6);
        \u0275\u0275property("checked", ctx.isAllconvert);
        \u0275\u0275twoWayProperty("ngModel", ctx.isAllconvert);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.filetypes);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(20, ctx.filetypes.length ? 20 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275property("checked", ctx.convertType == "B");
        \u0275\u0275advance(2);
        \u0275\u0275property("checked", ctx.convertType == "C");
        \u0275\u0275advance(4);
        \u0275\u0275property("checked", ctx.bMetadata);
        \u0275\u0275twoWayProperty("ngModel", ctx.bMetadata);
        \u0275\u0275advance(2);
        \u0275\u0275property("disabled", ctx.checklength());
      }
    }, dependencies: [FormsModule, NgControlStatus, NgModel, IconComponent, ButtonComponent, MatCheckboxModule, MatCheckbox, MatRadioModule, MatMenuModule, MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ConvertFolderComponent, { className: "ConvertFolderComponent", filePath: "src\\app\\shared\\components\\myfiles\\convert-folder\\convert-folder.component.ts", lineNumber: 21 });
})();

// src/app/adminpanel/services/hyperlink/hyperlink.service.ts
var HyperlinkService = class _HyperlinkService {
  constructor(http, tost) {
    this.http = http;
    this.tost = tost;
    this.hyperlinkList = [];
  }
  getHyperLinks(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(
          `${environment.hyperlinkservice}/hyperlinks`,
          //${environment.cloudUrl}
          { params }
        ));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  startHyperlink(nCaseid, nSectionid, nBundleid, nBundledetailid, cType, isIndex, cKeeptype, isDeep) {
    return __async(this, null, function* () {
      const res = yield this.hyperLinkMethod({ nCaseid, nSectionid, nBundleid, nBundledetailid, cType, cKeeptype: cKeeptype ? cKeeptype : "R", isDeepscan: isDeep || false }, isIndex);
      if (res) {
        if (res.msg == 1) {
          if (res.data) {
            this.hyperlinkList.push(res.data);
            this.clearUnWanted();
          }
        }
      } else {
        this.tost.error("hyperlink failed");
      }
    });
  }
  clearUnWanted() {
    this.hyperlinkList = this.hyperlinkList.filter((a) => a.nTotal && a.nTotal > 0);
  }
  hyperLinkMethod(mdl, isIndex) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(
          this.http.post(`${environment.hyperlinkservice}/${isIndex ? "indexhyperlink" : "starthyperlink"}`, mdl)
          //${environment.cloudUrl}
        );
        if (res && res.msg == 1) {
          this.tost.success(res.value);
          return res;
        } else {
          this.tost.error(res.value);
          return res;
        }
      } catch (err) {
        this.tost.error(`hyperlink failed ${err}`);
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  static {
    this.\u0275fac = function HyperlinkService_Factory(t) {
      return new (t || _HyperlinkService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _HyperlinkService, factory: _HyperlinkService.\u0275fac, providedIn: "root" });
  }
};

// src/app/shared/components/myfiles/permission/permission.component.ts
function PermissionComponent_div_5_div_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275listener("click", function PermissionComponent_div_5_div_6_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275element(1, "avtr", 11);
    \u0275\u0275elementStart(2, "div")(3, "span", 12);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 13);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "mat-slide-toggle", 14);
    \u0275\u0275twoWayListener("ngModelChange", function PermissionComponent_div_5_div_6_Template_mat_slide_toggle_ngModelChange_7_listener($event) {
      const usr_r5 = \u0275\u0275restoreView(_r4).$implicit;
      \u0275\u0275twoWayBindingSet(usr_r5.isCheck, $event) || (usr_r5.isCheck = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function PermissionComponent_div_5_div_6_Template_mat_slide_toggle_change_7_listener() {
      const usr_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.checkuser(usr_r5));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const usr_r5 = ctx.$implicit;
    const tm_r2 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("detail", usr_r5);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2(" ", usr_r5.cFname, "\xA0", usr_r5.cLname, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", usr_r5.cRole, " ");
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", usr_r5.isCheck);
    \u0275\u0275property("disabled", !ctx_r2.userDetail.isAdmin && tm_r2.nTeamid !== ctx_r2.nTeamid);
  }
}
function PermissionComponent_div_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "div", 5)(2, "h6", 6);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-slide-toggle", 7);
    \u0275\u0275twoWayListener("ngModelChange", function PermissionComponent_div_5_Template_mat_slide_toggle_ngModelChange_4_listener($event) {
      const tm_r2 = \u0275\u0275restoreView(_r1).$implicit;
      \u0275\u0275twoWayBindingSet(tm_r2.isCheck, $event) || (tm_r2.isCheck = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function PermissionComponent_div_5_Template_mat_slide_toggle_change_4_listener() {
      const tm_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.checkall(tm_r2));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div", 8);
    \u0275\u0275template(6, PermissionComponent_div_5_div_6_Template, 8, 6, "div", 9);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const tm_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", tm_r2.cTeamname, " ");
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !ctx_r2.userDetail.isAdmin && tm_r2.nTeamid !== ctx_r2.nTeamid);
    \u0275\u0275twoWayProperty("ngModel", tm_r2.isCheck);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", tm_r2.users);
  }
}
var PermissionComponent = class _PermissionComponent {
  constructor(myfileS, data, dialog, ss) {
    this.myfileS = myfileS;
    this.data = data;
    this.dialog = dialog;
    this.ss = ss;
    this.teamlist = [];
    this.users = [];
    this.userDetail = {};
    this.nCaseid = data["nCaseid"];
    this.nBundleid = data["nBundleid"];
    this.nBundledetailid = data["nBundledetailid"];
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userDetail = yield this.ss.getUserInfo();
      this.getTeamList();
    });
  }
  getTeamList() {
    return __async(this, null, function* () {
      var res = yield this.myfileS.teamuserList(this.nCaseid);
      this.teamlist = res;
      for (let team of this.teamlist) {
        if (team.users.length && team.users.find((e) => e.nUserid == this.userDetail.nUserid)) {
          this.nTeamid = team.nTeamid;
          break;
        }
      }
      this.getUserlist();
    });
  }
  getUserlist() {
    return __async(this, null, function* () {
      var mdl = { nBundleid: this.nBundleid, nBundledetailid: this.nBundledetailid };
      var res = yield this.myfileS.bundlesPermission(mdl);
      this.users = res;
      const userIdSet = new Set(this.users.map((user) => user.nUserid));
      this.teamlist = this.teamlist.map((team) => {
        const updatedUsers = team.users.map((user) => __spreadProps(__spreadValues({}, user), {
          isCheck: !userIdSet.has(user.nUserid)
          // Set isCheck based on absence in userIdSet
        }));
        const isAllUsersChecked = updatedUsers.every((user) => user.isCheck);
        return __spreadProps(__spreadValues({}, team), {
          users: updatedUsers,
          isCheck: isAllUsersChecked
          // Set the team's check status based on all users' check status
        });
      });
    });
  }
  checkall(x) {
    x.users.map((a) => a.isCheck = x.isCheck);
    this.update_permission(x);
  }
  checkuser(x) {
    this.update_permission(x);
  }
  update_permission(mn) {
    var mdl = { nCaseid: this.nCaseid, nBundleid: this.nBundleid, nBundledetailid: this.nBundledetailid, nUserid: mn.nUserid ? mn.nUserid : 0, nTeamid: mn.nTeamid ? mn.nTeamid : 0, bPermit: mn.isCheck };
    this.myfileS.setPermission(mdl).then((res) => {
      if (res) {
      }
    });
  }
  close() {
    this.dialog.closeAll();
  }
  static {
    this.\u0275fac = function PermissionComponent_Factory(t) {
      return new (t || _PermissionComponent)(\u0275\u0275directiveInject(MyfileService), \u0275\u0275directiveInject(MAT_DIALOG_DATA), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PermissionComponent, selectors: [["app-permission"]], standalone: true, features: [\u0275\u0275ProvidersFeature([MyfileService]), \u0275\u0275StandaloneFeature], decls: 6, vars: 1, consts: [[1, "bg-gray-100", "h-full", "flex", "flex-col"], [1, "text-base", "py-2.5", "px-5", "flex", "items-center", "justify-between", "font-semibold"], ["name", "close", 1, "text-xxs", "hover:text-blue-on", 3, "click"], [1, "h-full", "overflow-auto"], [4, "ngFor", "ngForOf"], [1, "flex", "items-center", "mb-2", "py-2.5", "bg-white", "px-5", "border-b"], [1, "text-xs", "font-semibold"], ["hideIcon", "", 1, "ms-auto", "permission", 3, "ngModelChange", "change", "disabled", "ngModel"], [1, "px-5"], ["class", "flex gap-2.5 mb-2.5", 3, "click", 4, "ngFor", "ngForOf"], [1, "flex", "gap-2.5", "mb-2.5", 3, "click"], [3, "detail"], [1, "text-xs"], [1, "text-xxs"], ["hideIcon", "", 1, "ms-auto", "permission", 3, "ngModelChange", "change", "ngModel", "disabled"]], template: function PermissionComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275text(2, " Permission ");
        \u0275\u0275elementStart(3, "icon", 2);
        \u0275\u0275listener("click", function PermissionComponent_Template_icon_click_3_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "div", 3);
        \u0275\u0275template(5, PermissionComponent_div_5_Template, 7, 4, "div", 4);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(5);
        \u0275\u0275property("ngForOf", ctx.teamlist);
      }
    }, dependencies: [CommonModule, NgForOf, FormsModule, NgControlStatus, NgModel, AvatarComponent, MatSlideToggleModule, MatSlideToggle, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PermissionComponent, { className: "PermissionComponent", filePath: "src\\app\\shared\\components\\myfiles\\permission\\permission.component.ts", lineNumber: 19 });
})();

// src/app/shared/components/myfiles/update-bundletag/update-bundletag.component.ts
var UpdateBundletagComponent = class _UpdateBundletagComponent {
  constructor(dialogRef, data) {
    this.dialogRef = dialogRef;
    this.data = data;
    this.cBundletag = "";
    this.cName = "";
    this.isAuto = 1;
    this.cBundletag = data["cBundletag"] ? data["cBundletag"] : null;
    this.cName = data["cName"] ? data["cName"] : null;
  }
  onSubmit() {
    return __async(this, null, function* () {
      if (this.cBundletag.trim() != "") {
        this.dialogRef.close({ isSave: true, "cBundletag": this.cBundletag, isAuto: this.isAuto == 1 ? true : false });
      }
    });
  }
  close() {
    this.dialogRef.close();
  }
  static {
    this.\u0275fac = function UpdateBundletagComponent_Factory(t) {
      return new (t || _UpdateBundletagComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UpdateBundletagComponent, selectors: [["app-update-bundletag"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 16, vars: 8, consts: [[1, "p-5"], [1, "text-base", "flex", "justify-between", "font-semibold", "mb-7"], ["name", "close", 1, "text-xs", "ms-auto", "cursor-pointer", "hover:text-blue-500", 3, "click"], [1, "flex", "items-end"], ["placeholder", "Enter Section Name", 1, "block", "w-full", 3, "valueChange", "isrequired", "showlabel", "value"], [1, "gap-2", "mb-6"], [3, "ngModelChange", "ngModel"], [1, "flex", "gap-2", "self-start", "mt-5"], [3, "value"], [3, "click"]], template: function UpdateBundletagComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
        \u0275\u0275text(2, "Update Bundle tab ");
        \u0275\u0275elementStart(3, "icon", 2);
        \u0275\u0275listener("click", function UpdateBundletagComponent_Template_icon_click_3_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "div", 3)(5, "inpt", 4);
        \u0275\u0275listener("valueChange", function UpdateBundletagComponent_Template_inpt_valueChange_5_listener($event) {
          return ctx.cBundletag = $event;
        });
        \u0275\u0275text(6);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "div", 5)(8, "mat-radio-group", 6);
        \u0275\u0275twoWayListener("ngModelChange", function UpdateBundletagComponent_Template_mat_radio_group_ngModelChange_8_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.isAuto, $event) || (ctx.isAuto = $event);
          return $event;
        });
        \u0275\u0275elementStart(9, "div", 7)(10, "mat-radio-button", 8);
        \u0275\u0275text(11, "Auto");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "mat-radio-button", 8);
        \u0275\u0275text(13, "Manuel");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(14, "btn", 9);
        \u0275\u0275listener("click", function UpdateBundletagComponent_Template_btn_click_14_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275text(15, " Update");
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(5);
        \u0275\u0275property("isrequired", true)("showlabel", true)("value", ctx.cBundletag);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1("", ctx.cName && ctx.cName != "" ? ctx.cName : "Bundle", " ");
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.isAuto);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 1);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(2);
        \u0275\u0275attribute("isdisabled", !ctx.cBundletag || (ctx.cBundletag == null ? null : ctx.cBundletag.trim()) == "");
      }
    }, dependencies: [FormsModule, NgControlStatus, NgModel, IconComponent, ButtonComponent, InputComponent, MatRadioModule, MatRadioGroup, MatRadioButton] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UpdateBundletagComponent, { className: "UpdateBundletagComponent", filePath: "src\\app\\shared\\components\\myfiles\\update-bundletag\\update-bundletag.component.ts", lineNumber: 16 });
})();

// src/app/adminpanel/components/bundlemanagement/pagination/pagination.component.ts
var _c0 = ["preveref"];
var _c1 = (a0) => ({ "shadow-[0_4px_4px_#00000089]": a0 });
var _c2 = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
function PaginationComponent_For_59_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275propertyInterpolate("value", x_r2.name);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r2.text);
  }
}
function PaginationComponent_Conditional_62_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Bottom Right");
    \u0275\u0275elementEnd();
  }
}
function PaginationComponent_Conditional_63_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Bottom Left");
    \u0275\u0275elementEnd();
  }
}
function PaginationComponent_Conditional_64_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Top Right");
    \u0275\u0275elementEnd();
  }
}
function PaginationComponent_Conditional_65_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Top Left");
    \u0275\u0275elementEnd();
  }
}
function PaginationComponent_For_111_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 62);
  }
}
var PaginationComponent = class _PaginationComponent {
  // nUserid: number = parseInt(window.localStorage.getItem('nUserid'));
  constructor(paginationS, dialogRef, data, cf) {
    this.paginationS = paginationS;
    this.dialogRef = dialogRef;
    this.data = data;
    this.cf = cf;
    this.colorslist = [{ cClr: "#ff0000" }, { cClr: "#00ff00" }, { cClr: "#0000ff" }];
    this.fonts = [
      { name: "arial", text: "Arial" },
      { name: "verdana", text: "Verdana" },
      { name: "times", text: "Times new roman" },
      { name: "georgia", text: "Georgia" }
    ];
    this.jPagination = { "fs": "16", "ft": "arial", "fc": "#000", "bc": "#fff", "cb": "#ffffff00", "position": "BR", "isHide": false };
    this.nType = 1;
    this.nStartpage = 0;
    this.nEndpage = 0;
    this.bPlacedefault = false;
    this.bPagedefault = false;
    this.cFontclr = "#ff0000";
    this.cBorderclr = "#ff0000";
    this.cBgclr = "#ff0000";
    this.bApplyall = false;
    this.nSectionid = 0;
    this.nBundledetailid = 0;
    this.nBundleid = 0;
    if (data) {
      this.nSectionid = data["nSectionid"];
      this.nBundledetailid = data["nBundledetailid"];
      this.nBundleid = data["nBundleid"];
      if (this.nBundledetailid) {
        this.getPagination(data["nBundledetailid"]);
      } else {
        this.nType = 2;
        this.nStartpage = 1;
        this.nEndpage = 1;
      }
    }
  }
  getPagination(nBundledetailid) {
    return __async(this, null, function* () {
      let res = yield this.paginationS.getPagination(nBundledetailid);
      this.detail = res;
      this.jPagination = this.detail.jPagination ? this.detail.jPagination : this.jPagination;
      this.jPagination.ft = this.jPagination.ft ? this.jPagination.ft.toLowerCase() : "arial";
      if (this.detail && this.detail.cRefpage) {
        this.nType = 2;
        this.nStartpage = this.detail.cRefpage.split("-")[0];
        this.nEndpage = this.detail.cRefpage.split("-")[1];
      }
    });
  }
  close() {
    this.dialogRef.close(false);
  }
  getStyles() {
    let styles = {
      // 'fontFamily': `${this.jPagination.ft}, sans-serif`,
      "fontSize": `${this.jPagination.fs}px`,
      "color": this.jPagination.fc,
      "backgroundColor": this.jPagination.bc,
      "border": `1px solid ${this.jPagination.cb}`,
      "bottom": this.jPagination.position.includes("B") ? "5px" : "auto",
      "top": this.jPagination.position.includes("T") ? "10px" : "auto",
      "right": this.jPagination.position.includes("R") ? "10px" : "auto",
      "left": this.jPagination.position.includes("L") ? "10px" : "auto"
    };
    return styles;
  }
  ngModelChange(event) {
    console.log("Font size changed to:", this.jPagination.fs);
    console.log("Event data:", event);
  }
  dPlacement(flag) {
    if (flag) {
      this.jPagination = { "fs": "16", "ft": "arial", "fc": "#000", "bc": "#fff", "cb": "#ffffff00", "position": "BR", "isHide": false };
    }
  }
  dPagination(flag) {
    if (flag) {
      this.nStartpage = 1;
      this.changeStart();
    }
  }
  changeStart() {
    if (this.detail && this.detail.cPage) {
      const splitPages = this.detail.cPage.split("-");
      if (splitPages.length > 1) {
        const diff = parseInt(splitPages[1]) - parseInt(splitPages[0]);
        this.nEndpage = parseInt(this.nStartpage) + diff;
      }
    } else {
      this.nEndpage = this.nStartpage;
    }
  }
  submitPagination() {
    return __async(this, null, function* () {
      if (!this.nType) {
        return;
      }
      if (this.nType == 2 && (parseInt(this.nStartpage) < 1 || parseInt(this.nEndpage) < 1 || parseInt(this.nStartpage) > parseInt(this.nEndpage))) {
        return;
      }
      if (this.nType == 1) {
        this.detail.cRefpage = null;
      }
      let paginationData = { isSave: true };
      if (this.bApplyall) {
        if (this.cf.isPagination == true) {
          return;
        }
        paginationData = {
          isSave: true,
          cRefpage: this.nType == 2 ? this.nStartpage + "-" + this.nEndpage : null,
          jPagination: this.jPagination,
          cCreattype: this.nType,
          bPagedefault: this.bPagedefault,
          bApplyall: this.bApplyall
        };
      } else {
        if (this.cf.isPagination == true) {
          return;
        }
      }
      var model = {
        nBundledetailid: this.nBundledetailid ? this.nBundledetailid : null,
        nBundleid: this.nBundleid,
        nSectionid: this.nSectionid,
        cRefpage: this.bPagedefault ? this.detail && this.detail.cPage ? this.detail.cPage : this.nStartpage + "-" + this.nEndpage : this.nType == 2 ? this.nStartpage + "-" + this.nEndpage : null,
        jPagination: this.jPagination,
        bApplyall: this.bApplyall,
        bPagedefault: this.bPagedefault,
        bIslater: false
      };
      let res = yield this.paginationS.submitPagination(model);
      if (res) {
        this.dialogRef.close(paginationData);
      }
    });
  }
  static {
    this.\u0275fac = function PaginationComponent_Factory(t) {
      return new (t || _PaginationComponent)(\u0275\u0275directiveInject(PaginationService), \u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA), \u0275\u0275directiveInject(CommonfunctionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PaginationComponent, selectors: [["app-pagination"]], viewQuery: function PaginationComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.preveref = _t.first);
      }
    }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 127, vars: 50, consts: [["color", "matMenu"], ["bcolor", "matMenu"], [1, "p-10", "rounded-xl", "bg-neutral-50"], [3, "ngModelChange", "ngModel"], [1, "text-lg", "font-semibold", "tracking-tight", "text-neutral-600"], [1, "flex", "gap-2", "self-start", "mt-5"], [3, "value"], [1, "mt-8", "h-px", "bg-stone-300"], [1, "flex", "gap-2", "text-xs", "mt-8"], [1, "flex", "gap-5"], [1, "w-fit"], [1, "grow", "items-start"], [1, "flex", "gap-2.5", "mt-1.5", "text-xs"], ["for", "paginationInput", 1, "my-auto", "text-neutral-600"], [1, "flex", "gap-1", "text-zinc-400"], ["placeholder", "First Page #", 1, "w-24", 3, "valueChange", "disabled", "showlabel", "value", "focus"], [1, "my-auto", "font-semibold", "text-neutral-600"], ["placeholder", "Last Page #", 1, "w-24", 3, "valueChange", "disabled", "showlabel", "value", "focus"], [1, "flex", "gap-2.5", "mt-1.5"], [1, "my-auto", "text-xs", "font-semibold", "text-neutral-600"], [1, "flex", "gap-2"], [3, "change", "ngModelChange", "ngModel"], [1, "flex", "gap-5", "justify-between", "items-end", "mt-2.5"], [1, "text-xs", "w-24"], ["for", "fontSizeInput", 1, "block", "mb-2"], [1, "w-full", "bg-white"], ["placeholder", "Select..", 3, "ngModelChange", "ngModel"], ["value", "16"], [1, "d-flex", "align-items-center", "gap-2", "flex-row"], ["value", "20"], ["value", "24"], ["value", "28"], [1, "text-xs", "whitespace-nowrap", "w-24"], ["for", "typefaceInput", 1, "mb-2", "block"], ["for", "bottomRightIconInput", 1, "text-xs", "text-neutral-600"], [1, "flex", "gap-3", "items-center", "mt-2"], [1, "flex", "justify-center", "items-center", "p-1", "border", "cursor-pointer", 3, "click"], ["loading", "lazy", "src", "assets/icons/pagination/p1.svg", "alt", "bottom right icon 1", "width", "19"], ["loading", "lazy", "src", "assets/icons/pagination/p3.svg", "alt", "bottom right icon 2", "width", "19"], ["loading", "lazy", "src", "assets/icons/pagination/p2.svg", "alt", "bottom right icon 3", "width", "19"], ["loading", "lazy", "src", "assets/icons/pagination/p4.svg", "alt", "bottom right icon 4", "width", "19"], [1, "flex", "gap-6", "mt-2.5"], [1, ""], ["for", "fontColorInput", 1, "text-xs", "text-neutral-600"], [1, "flex", "gap-2.5", "px-2.5", "py-2", "mt-2.5", "bg-neutral-400"], [1, "bg-black", "rounded-[4px]", "border", "border-white", "border-solid", "size-5", "cursor-pointer", 3, "click", "ngClass"], [1, "size-5", "rounded-[4px]", "border", "border-white", "border-solid", "bg-zinc-300", "cursor-pointer", 3, "click", "ngClass"], [1, "size-5", "rounded-[4px]", "border", "border-white", "border-solid", "bg-zinc-300", "flex", "items-center", "justify-center", "cursor-pointer", 3, "menuClosed", "ngClass", "matMenuTriggerFor"], ["width", "12", "src", "assets/icons/pagination/picker.svg", "alt", ""], [1, "!min-w-[366px]"], [3, "myColorChange", "myColor", "colorslist"], ["for", "backgroundColorInput", 1, "text-xs", "text-neutral-600"], [1, "size-5", "bg-white", "cursor-pointer", 3, "click"], [1, "size-5", "bg-zinc-300", "cursor-pointer", 3, "click"], [1, "relative", "size-5", "bg-white", "cursor-pointer", 3, "click"], [1, "absolute", "bg-red-500", "h-full", "w-px", "rotate-45", "top-0", "left-2.5"], [1, "bg-black", "rounded-[4px]", "border", "border-white", "border-solid", "size-5", "cursor-pointer", 3, "click"], [1, "size-5", "rounded-[4px]", "border", "border-white", "border-solid", "bg-zinc-300", "cursor-pointer", 3, "click"], [1, "size-5", "rounded-[4px]", "border", "border-white", "border-solid", "bg-zinc-300", "flex", "items-center", "justify-center", "cursor-pointer", 3, "menuClosed", "matMenuTriggerFor"], [1, "relative", "w-48", "gap-2.5", "self-stretch", "flex", "flex-col"], [1, "text-base"], [1, "flex", "flex-col", "gap-3.5", "border", "h-full", "relative"], [1, "w-11/12", "h-0.5", "bg-gray-200", "first:mt-3.5"], [1, "px-1", "absolute", 3, "ngStyle"], [1, "flex", "gap-2.5", "items-center", "mt-8"], [1, "flex", "gap-2.5", "text-xs", "whitespace-nowrap"], [3, "click", "disabled"], ["mode", "white", 3, "click"], [1, "flex", "gap-2", "my-auto", "text-xs"], [1, "flex", "gap-2", "my-auto"]], template: function PaginationComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 2)(1, "mat-radio-group", 3);
        \u0275\u0275twoWayListener("ngModelChange", function PaginationComponent_Template_mat_radio_group_ngModelChange_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.nType, $event) || (ctx.nType = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275elementStart(2, "header", 4);
        \u0275\u0275text(3, " Pagination Set Up ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "div", 5)(5, "mat-radio-button", 6);
        \u0275\u0275text(6, "Use Orignal");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(7, "hr", 7);
        \u0275\u0275elementStart(8, "div", 8)(9, "mat-radio-button", 6);
        \u0275\u0275text(10, "Generate New");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(11, "div")(12, "section", 9)(13, "section", 10)(14, "article", 11)(15, "div", 12)(16, "label", 13);
        \u0275\u0275text(17, " Specify pagination (## - ##) : ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(18, "div", 14)(19, "inpt", 15);
        \u0275\u0275listener("valueChange", function PaginationComponent_Template_inpt_valueChange_19_listener($event) {
          \u0275\u0275restoreView(_r1);
          ctx.nStartpage = $event;
          return \u0275\u0275resetView(ctx.changeStart());
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(20, "span", 16);
        \u0275\u0275text(21, "-");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(22, "inpt", 17);
        \u0275\u0275listener("valueChange", function PaginationComponent_Template_inpt_valueChange_22_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.nEndpage = $event);
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(23, "div", 18)(24, "p", 19);
        \u0275\u0275text(25, " Placement : ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(26, "div", 20)(27, "mat-checkbox", 21);
        \u0275\u0275listener("change", function PaginationComponent_Template_mat_checkbox_change_27_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.dPlacement(ctx.bPlacedefault));
        });
        \u0275\u0275twoWayListener("ngModelChange", function PaginationComponent_Template_mat_checkbox_ngModelChange_27_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.bPlacedefault, $event) || (ctx.bPlacedefault = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275text(28, "Use Default");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(29, "div", 18)(30, "p", 19);
        \u0275\u0275text(31, " Pagination : ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(32, "div", 20)(33, "mat-checkbox", 21);
        \u0275\u0275listener("change", function PaginationComponent_Template_mat_checkbox_change_33_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.dPagination(ctx.bPagedefault));
        });
        \u0275\u0275twoWayListener("ngModelChange", function PaginationComponent_Template_mat_checkbox_ngModelChange_33_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.bPagedefault, $event) || (ctx.bPagedefault = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275text(34, "Use by Default");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(35, "div", 22)(36, "section", 23)(37, "label", 24);
        \u0275\u0275text(38, " Font size ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(39, "mat-form-field", 25)(40, "mat-select", 26);
        \u0275\u0275twoWayListener("ngModelChange", function PaginationComponent_Template_mat_select_ngModelChange_40_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.jPagination.fs, $event) || (ctx.jPagination.fs = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275elementStart(41, "mat-option", 27)(42, "div", 28);
        \u0275\u0275text(43, " 16 ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(44, "mat-option", 29)(45, "div", 28);
        \u0275\u0275text(46, " 20 ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(47, "mat-option", 30)(48, "div", 28);
        \u0275\u0275text(49, " 24 ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(50, "mat-option", 31)(51, "div", 28);
        \u0275\u0275text(52, " 28 ");
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(53, "section", 32)(54, "label", 33);
        \u0275\u0275text(55, " Typeface ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(56, "mat-form-field", 25)(57, "mat-select", 3);
        \u0275\u0275twoWayListener("ngModelChange", function PaginationComponent_Template_mat_select_ngModelChange_57_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.jPagination.ft, $event) || (ctx.jPagination.ft = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275repeaterCreate(58, PaginationComponent_For_59_Template, 2, 2, "mat-option", 6, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(60, "section")(61, "label", 34);
        \u0275\u0275template(62, PaginationComponent_Conditional_62_Template, 2, 0, "span")(63, PaginationComponent_Conditional_63_Template, 2, 0)(64, PaginationComponent_Conditional_64_Template, 2, 0)(65, PaginationComponent_Conditional_65_Template, 2, 0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(66, "div", 35)(67, "div", 36);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_67_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.position = "BR");
        });
        \u0275\u0275element(68, "img", 37);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(69, "div", 36);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_69_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.position = "BL");
        });
        \u0275\u0275element(70, "img", 38);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(71, "div", 36);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_71_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.position = "TR");
        });
        \u0275\u0275element(72, "img", 39);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(73, "div", 36);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_73_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.position = "TL");
        });
        \u0275\u0275element(74, "img", 40);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(75, "section", 41)(76, "section", 42)(77, "label", 43);
        \u0275\u0275text(78, " Font Color ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(79, "div", 44)(80, "div", 45);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_80_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.fc = "#000");
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(81, "div", 46);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_81_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.fc = "#fff");
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(82, "div", 47);
        \u0275\u0275listener("menuClosed", function PaginationComponent_Template_div_menuClosed_82_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.fc = ctx.cFontclr);
        });
        \u0275\u0275element(83, "img", 48);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(84, "mat-menu", 49, 0)(86, "app-colorpicker", 50);
        \u0275\u0275twoWayListener("myColorChange", function PaginationComponent_Template_app_colorpicker_myColorChange_86_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.cFontclr, $event) || (ctx.cFontclr = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(87, "section", 42)(88, "label", 51);
        \u0275\u0275text(89, " Background color ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(90, "div", 44)(91, "div", 52);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_91_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.bc = "#fff");
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(92, "div", 53);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_92_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.bc = "#D9D9D9");
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(93, "div", 54);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_93_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.bc = "#ffffff00");
        });
        \u0275\u0275element(94, "span", 55);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(95, "section", 42)(96, "label", 43);
        \u0275\u0275text(97, " Border Color ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(98, "div", 44)(99, "div", 56);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_99_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.cb = "#000");
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(100, "div", 57);
        \u0275\u0275listener("click", function PaginationComponent_Template_div_click_100_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.cb = "#fff");
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(101, "div", 58);
        \u0275\u0275listener("menuClosed", function PaginationComponent_Template_div_menuClosed_101_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.jPagination.cb = ctx.cBorderclr);
        });
        \u0275\u0275element(102, "img", 48);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(103, "mat-menu", 49, 1)(105, "app-colorpicker", 50);
        \u0275\u0275twoWayListener("myColorChange", function PaginationComponent_Template_app_colorpicker_myColorChange_105_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.cBorderclr, $event) || (ctx.cBorderclr = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275elementEnd()()()()()()();
        \u0275\u0275elementStart(106, "div", 59)(107, "h6", 60);
        \u0275\u0275text(108, "Preview");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(109, "div", 61);
        \u0275\u0275repeaterCreate(110, PaginationComponent_For_111_Template, 1, 0, "span", 62, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementStart(112, "span", 63);
        \u0275\u0275text(113, "00");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275element(114, "hr", 7);
        \u0275\u0275elementStart(115, "div", 64)(116, "section", 65)(117, "btn", 66);
        \u0275\u0275listener("click", function PaginationComponent_Template_btn_click_117_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.submitPagination());
        });
        \u0275\u0275text(118, "Apply ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(119, "btn", 67);
        \u0275\u0275listener("click", function PaginationComponent_Template_btn_click_119_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.close());
        });
        \u0275\u0275text(120, " Cancel");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(121, "section", 68)(122, "mat-checkbox", 3);
        \u0275\u0275twoWayListener("ngModelChange", function PaginationComponent_Template_mat_checkbox_ngModelChange_122_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.bApplyall, $event) || (ctx.bApplyall = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275text(123, "Apply to all files inside this folder");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(124, "section", 69)(125, "mat-checkbox", 3);
        \u0275\u0275twoWayListener("ngModelChange", function PaginationComponent_Template_mat_checkbox_ngModelChange_125_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.jPagination.isHide, $event) || (ctx.jPagination.isHide = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275text(126, "Hide generated pagination");
        \u0275\u0275elementEnd()()()()();
      }
      if (rf & 2) {
        const color_r3 = \u0275\u0275reference(85);
        const bcolor_r4 = \u0275\u0275reference(104);
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.nType);
        \u0275\u0275advance(4);
        \u0275\u0275property("value", 1);
        \u0275\u0275advance(4);
        \u0275\u0275property("value", 2);
        \u0275\u0275advance(10);
        \u0275\u0275property("disabled", ctx.bPagedefault)("showlabel", false)("value", ctx.nStartpage)("focus", true);
        \u0275\u0275advance(3);
        \u0275\u0275property("disabled", true)("showlabel", false)("value", ctx.nEndpage)("focus", true);
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.bPlacedefault);
        \u0275\u0275advance(6);
        \u0275\u0275twoWayProperty("ngModel", ctx.bPagedefault);
        \u0275\u0275advance(7);
        \u0275\u0275twoWayProperty("ngModel", ctx.jPagination.fs);
        \u0275\u0275advance(17);
        \u0275\u0275twoWayProperty("ngModel", ctx.jPagination.ft);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.fonts);
        \u0275\u0275advance(4);
        \u0275\u0275conditional(62, ctx.jPagination.position == "BR" ? 62 : ctx.jPagination.position == "BL" ? 63 : ctx.jPagination.position == "TR" ? 64 : ctx.jPagination.position == "TL" ? 65 : -1);
        \u0275\u0275advance(5);
        \u0275\u0275classProp("border-grey", ctx.jPagination.position == "BR");
        \u0275\u0275advance(2);
        \u0275\u0275classProp("border-grey", ctx.jPagination.position == "BL");
        \u0275\u0275advance(2);
        \u0275\u0275classProp("border-grey", ctx.jPagination.position == "TR");
        \u0275\u0275advance(2);
        \u0275\u0275classProp("border-grey", ctx.jPagination.position == "TL");
        \u0275\u0275advance(7);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(43, _c1, ctx.jPagination.fc == "#000"));
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(45, _c1, ctx.jPagination.fc == "#fff"));
        \u0275\u0275advance();
        \u0275\u0275styleProp("background", ctx.cFontclr);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(47, _c1, ctx.jPagination.fc != "#000" && ctx.jPagination.fc != "#fff"))("matMenuTriggerFor", color_r3);
        \u0275\u0275advance(4);
        \u0275\u0275twoWayProperty("myColor", ctx.cFontclr);
        \u0275\u0275property("colorslist", ctx.colorslist);
        \u0275\u0275advance(15);
        \u0275\u0275styleProp("background", ctx.cBorderclr);
        \u0275\u0275property("matMenuTriggerFor", bcolor_r4);
        \u0275\u0275advance(4);
        \u0275\u0275twoWayProperty("myColor", ctx.cBorderclr);
        \u0275\u0275property("colorslist", ctx.colorslist);
        \u0275\u0275advance(5);
        \u0275\u0275repeater(\u0275\u0275pureFunction0(49, _c2));
        \u0275\u0275advance(2);
        \u0275\u0275styleMap("font-family:" + ctx.jPagination.ft + ", sans-serif !important;");
        \u0275\u0275property("ngStyle", ctx.getStyles());
        \u0275\u0275advance(5);
        \u0275\u0275property("disabled", ctx.nType == 2 && !ctx.nStartpage);
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.bApplyall);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.jPagination.isHide);
      }
    }, dependencies: [ButtonComponent, MatRadioModule, MatRadioGroup, MatRadioButton, InputComponent, MatCheckboxModule, MatCheckbox, MatSelectModule, MatFormField, MatSelect, MatOption, ColorpickerComponent, MatMenuModule, MatMenu, MatMenuTrigger, FormsModule, NgControlStatus, NgModel, CommonModule, NgClass, NgStyle] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PaginationComponent, { className: "PaginationComponent", filePath: "src\\app\\adminpanel\\components\\bundlemanagement\\pagination\\pagination.component.ts", lineNumber: 22 });
})();

// src/app/shared/components/myfiles/sharedfolder/sharedfolder.component.ts
var _forTrack0 = ($index, $item) => $item.nUserid;
var _c02 = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var _c12 = (a0, a1, a2, a3, a4) => ({ "mt-2": a0, "rounded-b-none": a1, "rounded-base": a2, "!w-[450px]": a3, "!w-[650px]": a4 });
var _c22 = (a0, a1) => ({ "!bg-blue-deactivate": a0, "my-1": a1 });
var _c3 = (a0) => ({ "padding-left": a0 });
var _c4 = (a0) => ({ "text-blue-on": a0 });
var _c5 = (a0) => ({ "rotate-90 !text-blue-on": a0 });
var _c6 = (a0) => ({ "!text-blue-on": a0 });
var _c7 = (a0) => ({ "close": a0 });
var _c8 = () => [1];
function SharedfolderComponent_div_0_ng_container_1_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5);
    \u0275\u0275element(1, "icon", 6)(2, "icon", 7)(3, "sklton", 8);
    \u0275\u0275elementEnd();
  }
}
function SharedfolderComponent_div_0_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div");
    \u0275\u0275template(2, SharedfolderComponent_div_0_ng_container_1_div_2_Template, 4, 0, "div", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction0(1, _c02));
  }
}
function SharedfolderComponent_div_0_div_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275text(1, "\xA0\xA0\xA0\xA0");
    \u0275\u0275elementEnd();
  }
}
function SharedfolderComponent_div_0_div_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function SharedfolderComponent_div_0_div_2_span_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const node_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("tooltipText", node_r2.cBundlename);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", node_r2.cBundlename, " ");
  }
}
function SharedfolderComponent_div_0_div_2_Conditional_13_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23);
    \u0275\u0275element(1, "icon", 6)(2, "icon", 7)(3, "sklton", 8);
    \u0275\u0275elementEnd();
  }
}
function SharedfolderComponent_div_0_div_2_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 20);
    \u0275\u0275template(1, SharedfolderComponent_div_0_div_2_Conditional_13_div_1_Template, 4, 0, "div", 22);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const node_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c3, (node_r2.level > 0 ? node_r2.level * 24 : 0) + "px"));
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction0(4, _c8));
  }
}
function SharedfolderComponent_div_0_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "div", 10)(2, "div", 11);
    \u0275\u0275template(3, SharedfolderComponent_div_0_div_2_Conditional_3_Template, 2, 0, "div")(4, SharedfolderComponent_div_0_div_2_Conditional_4_Template, 1, 0);
    \u0275\u0275elementStart(5, "div", 12);
    \u0275\u0275listener("click", function SharedfolderComponent_div_0_div_2_Template_div_click_5_listener() {
      const node_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(!(node_r2 == null ? null : node_r2.isedit) ? ctx_r2.loadChildren(node_r2, true) : null);
    })("dragstart", function SharedfolderComponent_div_0_div_2_Template_div_dragstart_5_listener($event) {
      const node_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onDragStart($event, node_r2));
    })("dragend", function SharedfolderComponent_div_0_div_2_Template_div_dragend_5_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onDragEnd());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 13);
    \u0275\u0275element(7, "path", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(8, "div", 15);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(9, "svg", 16);
    \u0275\u0275element(10, "path", 17)(11, "path", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275template(12, SharedfolderComponent_div_0_div_2_span_12_Template, 2, 2, "span", 19);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275template(13, SharedfolderComponent_div_0_div_2_Conditional_13_Template, 2, 5, "div", 20);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const node_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction5(13, _c12, !node_r2.level, !node_r2.level && node_r2.isExpanded, !node_r2.level, node_r2.level > 3 && node_r2.level < 12, node_r2.level > 12));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(19, _c22, (node_r2 == null ? null : node_r2.nBundleid) == (ctx_r2.activeBundle == null ? null : ctx_r2.activeBundle.nBundleid), node_r2.level))("ngStyle", \u0275\u0275pureFunction1(22, _c3, (node_r2.level > 0 ? node_r2.level * 24 + 48 : 48 + 10) + "px"));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, !ctx_r2.isIndividual ? 3 : 4);
    \u0275\u0275advance(2);
    \u0275\u0275property("draggable", !(node_r2 == null ? null : node_r2.isedit))("ngClass", \u0275\u0275pureFunction1(24, _c4, (node_r2 == null ? null : node_r2.nBundleid) == (ctx_r2.activeBundle == null ? null : ctx_r2.activeBundle.nBundleid)));
    \u0275\u0275advance();
    \u0275\u0275classProp("!rotate-90", node_r2.isExpanded);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(26, _c5, (node_r2 == null ? null : node_r2.nBundleid) == (ctx_r2.activeBundle == null ? null : ctx_r2.activeBundle.nBundleid)));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(28, _c6, (node_r2 == null ? null : node_r2.nBundleid) == (ctx_r2.activeBundle == null ? null : ctx_r2.activeBundle.nBundleid)));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(30, _c7, (node_r2 == null ? null : node_r2.nBundleid) != (ctx_r2.activeBundle == null ? null : ctx_r2.activeBundle.nBundleid) && !(node_r2 == null ? null : node_r2.isExpanded)));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !node_r2["isedit"]);
    \u0275\u0275advance();
    \u0275\u0275conditional(13, node_r2.islodingchildren ? 13 : -1);
  }
}
function SharedfolderComponent_div_0_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const user_r4 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Shared by ", user_r4.cSharedby, "");
  }
}
function SharedfolderComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275template(1, SharedfolderComponent_div_0_ng_container_1_Template, 3, 2, "ng-container", 2)(2, SharedfolderComponent_div_0_div_2_Template, 14, 32, "div", 3);
    \u0275\u0275repeaterCreate(3, SharedfolderComponent_div_0_For_4_Template, 2, 1, "span", null, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.loading);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.TREE_DATA);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.sharedByuser);
  }
}
var SharedfolderComponent = class _SharedfolderComponent {
  constructor(myfileS, cdr, dialog, cs, cf) {
    this.myfileS = myfileS;
    this.cdr = cdr;
    this.dialog = dialog;
    this.cs = cs;
    this.cf = cf;
    this.isIndividual = false;
    this.selectedIDs = [];
    this.changeFolder = new EventEmitter();
    this.getSelection = new EventEmitter();
    this.loading = true;
    this.TREE_DATA = [];
    this.isCopy = false;
    this.sharedByuser = [];
    this.checkEventSub();
  }
  checkEventSub() {
    return __async(this, null, function* () {
      this.evsubscription = this.cs.functionCalled$.subscribe((data) => __async(this, null, function* () {
        if (data && data.event && data.event == "CB-SECTION") {
          if (data.isSection) {
            this.activeBundle = null;
            var treedata = [...this.TREE_DATA];
            for (let row of treedata.filter((e) => e.nParentBundleid == null)) {
              row.isExpanded = false;
              this.TREE_DATA = this.removeDescendants(this.TREE_DATA, row.nBundleid);
            }
            this.selectedFolder(null);
            this.changeFolder.emit("SELECTED");
          }
        }
      }));
    });
  }
  ngOnDestroy() {
    this.evsubscription.unsubscribe();
  }
  ngOnInit() {
  }
  ngAfterViewInit() {
  }
  ngOnChanges(changes) {
    if (changes["nSectionid"] && this.nSectionid) {
      this.getSharedBundleList(null);
    }
  }
  getSharedBundleList(node) {
    return __async(this, null, function* () {
      try {
        let res1 = yield this.myfileS.getSharedBundles(this.nSectionid, this.nUserid);
        let res = res1 && res1.length ? res1 : [];
        res.map((e) => {
          e["level"] = 0;
          e["expandable"] = false;
        });
        this.TREE_DATA = res;
        if (res.length) {
          this.changeFolder.emit("GET_BUNDLE_LIST");
        }
        this.loading = false;
        this.cdr.detectChanges();
      } catch (error) {
        console.error("Error fetching bundle list:", error);
      }
      this.changeFolder.emit("SELECTED");
    });
  }
  getBundleList(node) {
    return __async(this, null, function* () {
      try {
        var mdl = { nSectionid: this.nSectionid, nBundleid: node && node.nBundleid ? node.nBundleid : null, pageNumber: 1 };
        var res = yield this.myfileS.bundleList(mdl);
        if (mdl.nBundleid && node) {
          var ind = this.TREE_DATA.findIndex((e) => e.nBundleid == mdl.nBundleid);
          res.map((e) => {
            e["level"] = node["level"] + 1;
            e["expandable"] = false, e["cIscheck"] = node["cIscheck"];
          });
          if (!this.TREE_DATA.filter((e) => e.nBundleid && e.nParentBundleid == node.nBundleid).length) {
            var isnew = this.TREE_DATA.filter((e) => !e.nBundleid && e.nParentBundleid == node.nBundleid && e.isNew).length ? true : false;
            const updatedTreeData = [
              ...this.TREE_DATA.slice(0, ind + 1 + (isnew ? 1 : 0)),
              ...res,
              ...this.TREE_DATA.slice(ind + 1 + (isnew ? 1 : 0))
            ];
            this.TREE_DATA = updatedTreeData;
            node.isExpanded = true;
          }
          this.selectedFolder(node);
          node.islodingchildren = false;
        } else {
          res.map((e) => {
            e["level"] = 0;
            e["expandable"] = false;
          });
          this.TREE_DATA = res;
        }
        if (res.length) {
          this.changeFolder.emit("GET_BUNDLE_LIST");
        }
        this.loading = false;
        this.cdr.detectChanges();
      } catch (error) {
        console.error("Error fetching bundle list:", error);
      }
      this.changeFolder.emit("SELECTED");
    });
  }
  loadChildren(node, flag) {
    if (node && node.nBundleid && this.checkCopy() && this.cutCopyType == "Cut") {
      var resultArray = this.getcheckedFolder().map((e) => e.nBundleid);
      if (resultArray.includes(node.nBundleid)) {
        return;
      }
    }
    if (node && node.islodingchildren) {
      return;
    }
    if (node && node.isExpanded) {
      node.islodingchildren = false;
      if (flag && this.activeBundle == node) {
        if (this.activeBundle == node) {
          node.isExpanded = false;
          this.TREE_DATA = this.removeDescendants(this.TREE_DATA, node.nBundleid);
          if (node.level > 0) {
            var parentNode = this.TREE_DATA.find((parent) => node.nParentBundleid === parent.nBundleid);
            this.activeBundle = node;
            this.selectedFolder(parentNode);
          } else {
            this.activeBundle = null;
            this.selectedFolder(null);
          }
        }
        this.cdr.detectChanges();
      } else {
        this.activeBundle = node;
        var treedata = [...this.TREE_DATA];
        for (let row of treedata.filter((e) => e.nParentBundleid == node.nBundleid)) {
          row.isExpanded = false;
          this.TREE_DATA = this.removeDescendants(this.TREE_DATA, row.nBundleid);
        }
        this.selectedFolder(node);
      }
      this.changeFolder.emit("SELECTED");
    } else if (node) {
      node.isExpanded = true;
      node.islodingchildren = true;
      this.activeBundle = node;
      this.getBundleList(node);
    } else {
      this.activeBundle = null;
      var treedata = [...this.TREE_DATA];
      for (let row of treedata.filter((e) => e.nParentBundleid == null)) {
        row.isExpanded = false;
        this.TREE_DATA = this.removeDescendants(this.TREE_DATA, row.nBundleid);
      }
      this.selectedFolder(null);
      this.changeFolder.emit("SELECTED");
    }
  }
  refreshNode(nBundleid) {
    var node = this.TREE_DATA.find((e) => e.nBundleid == nBundleid);
    if (node) {
      if (node["isExpanded"]) {
        this.TREE_DATA = this.removeDescendants(this.TREE_DATA, node.nBundleid);
        this.getBundleList(node);
      }
    } else {
      this.getBundleList(null);
    }
    this.cdr.detectChanges();
  }
  removeDescendants(treeData, nodeId) {
    if (!nodeId)
      return treeData.filter((e) => e.nBundleid);
    const startIndex = treeData.findIndex((node) => node.nParentBundleid === nodeId);
    if (startIndex === -1) {
      return treeData;
    }
    let endIndex = treeData.length;
    for (let i = startIndex + 1; i < treeData.length; i++) {
      if (treeData[i].level < treeData[startIndex].level) {
        endIndex = i;
        break;
      }
    }
    return [...treeData.slice(0, startIndex), ...treeData.slice(endIndex)];
  }
  selectedFolder(node) {
    var brdcrumb = { brdcrumb: node ? this.getNodePath(node).map((e) => {
      return { nBundleid: e.nBundleid, cBundlename: e.cBundlename };
    }) : [] };
    this.changeFolder.emit(brdcrumb);
  }
  getNodePath(node) {
    const path = [node];
    let currentNode = node;
    if (currentNode.nParentBundleid) {
      while (currentNode) {
        const parent = this.TREE_DATA.filter((e) => e.nBundleid).find((parent2) => currentNode.level > parent2.level && currentNode.nParentBundleid === parent2.nBundleid);
        if (parent) {
          path.unshift(parent);
          currentNode = parent;
        } else {
          break;
        }
      }
    }
    return path;
  }
  getParentNode(node) {
    const nodeIndex = this.TREE_DATA.indexOf(node);
    for (let i = nodeIndex - 1; i >= 0; i--) {
      if (this.TREE_DATA[i].level === node.level - 1) {
        return this.TREE_DATA[i];
      }
    }
    return null;
  }
  shouldRender(node) {
    let parent = this.getParentNode(node);
    while (parent) {
      if (!parent.isExpanded) {
        return false;
      }
      parent = this.getParentNode(parent);
    }
    return true;
  }
  onDragStart(event, item) {
    this.myfileS.isfolderdraging = true;
    var path = this.getNodePath(item).map((e) => e.cBundlename);
    var draggedItem = { id: item.nBundleid, path, isactive: "" };
    event.dataTransfer?.setData("text", JSON.stringify(draggedItem));
    console.log(JSON.stringify(draggedItem));
  }
  openfolderuncheck(node, event) {
    this.loadChildren(node, true);
    this.TREE_DATA.map((e) => e["cIstempcheck"] = false);
    node.cIstempcheck = event.checked;
    this.cdr.detectChanges();
  }
  onDragEnd() {
    this.myfileS.isfolderdraging = false;
  }
  checkFolder(node, event) {
    if (event.checked && this.checkCopy()) {
      this.TREE_DATA.map((e) => e["cIscheck"] = false);
      node.cIscheck = event.checked;
      this.changeFolder.emit("SELECTED");
      return;
    }
    node.cIscheck = event.checked;
    this.selectAllChildern(node, event);
    this.changeFolder.emit("SELECTED");
  }
  selectAllChildern(node, event) {
    const startIndex = this.TREE_DATA.findIndex((data) => data.nParentBundleid === node.nBundleid);
    if (startIndex === -1) {
      return;
    }
    let endIndex = this.TREE_DATA.length;
    for (let i = startIndex + 1; i < this.TREE_DATA.length; i++) {
      if (this.TREE_DATA[i].level < this.TREE_DATA[startIndex].level) {
        endIndex = i;
        break;
      }
    }
    for (let i = startIndex; i < endIndex; i++) {
      this.TREE_DATA[i]["cIscheck"] = event.checked;
    }
    return;
  }
  finalizeNode(node) {
    node.isedit = false;
    node.isNew = false;
  }
  removeNodeFromTree(node) {
    const ind = this.TREE_DATA.findIndex((e) => e.nBundleid === node.nBundleid);
    if (ind > -1) {
      this.TREE_DATA = [...this.TREE_DATA.slice(0, ind), ...this.TREE_DATA.slice(ind + 1)];
    }
  }
  refreshTree() {
    this.cdr.detectChanges();
  }
  checkCopy() {
    if (this.cutCopyType) {
      return true;
    }
    return false;
  }
  getcheckedFolder() {
    const expandedNodes = [];
    this.TREE_DATA.forEach((node) => {
      if (node["cIscheck"]) {
        expandedNodes.push(node);
      }
    });
    return expandedNodes;
  }
  closeMenu() {
    return __async(this, null, function* () {
      this.changeFolder.emit("SUBMIT");
      this.menuTrigger.closeMenu();
    });
  }
  static {
    this.\u0275fac = function SharedfolderComponent_Factory(t) {
      return new (t || _SharedfolderComponent)(\u0275\u0275directiveInject(MyfileService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(CommonfunctionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SharedfolderComponent, selectors: [["sharedfolder"]], inputs: { menuTrigger: "menuTrigger", isSepcomponent: "isSepcomponent", nSectionid: "nSectionid", nUserid: "nUserid", cFoldertype: "cFoldertype", nCaseid: "nCaseid", nBundleid: "nBundleid", changeF: "changeF", cutCopyType: "cutCopyType", isIndividual: "isIndividual", selectedIDs: "selectedIDs" }, outputs: { changeFolder: "changeFolder", getSelection: "getSelection" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 1, vars: 1, consts: [["class", "h-[calc(100%_-_50px)] w-full  folderscroll", 4, "ngIf"], [1, "h-[calc(100%_-_50px)]", "w-full", "folderscroll"], [4, "ngIf"], ["class", "relative flex flex-col items-center min-w-full overflow-visible bg-white cursor-pointer mat-tree-node group min-h-10 text-grey w-fit first:mt-0", "style", "flex-grow: 1;", 3, "ngClass", 4, "ngFor", "ngForOf"], ["class", "flex items-center gap-3 mb-2 bg-white rounded-base ps-10", "style", "height:40px;", 4, "ngFor", "ngForOf"], [1, "flex", "items-center", "gap-3", "mb-2", "bg-white", "rounded-base", "ps-10", 2, "height", "40px"], ["name", "chvy", 1, "text-gray-300", "rotate-180", "text-xxs"], ["name", "folder", 1, "text-gray-300"], ["bg", "base", "height", "12px", "width", "130px"], [1, "relative", "flex", "flex-col", "items-center", "min-w-full", "overflow-visible", "bg-white", "cursor-pointer", "mat-tree-node", "group", "min-h-10", "text-grey", "w-fit", "first:mt-0", 2, "flex-grow", "1", 3, "ngClass"], [1, "w-full", "h-full", 3, "ngClass", "ngStyle"], [1, "relative", "z-20", "flex", "items-center", "w-full", "h-full", "gap-5", "px-2", "min-w-44", "min-h-10"], [1, "flex", "items-center", "gap-5", "w-[calc(100%_-_30px)]", "h-full", 3, "click", "dragstart", "dragend", "draggable", "ngClass"], ["xmlns", "http://www.w3.org/2000/svg", "width", "6", "height", "10", "fill", "none", "viewBox", "0 0 6 10", 2, "min-width", "6px", 3, "ngClass"], ["fill", "currentColor", "stroke", "currentColor", "d", "M.57.84.55.83a.2.2 0 0 1 0-.28.18.18 0 0 1 .25 0l3.83 3.91a.2.2 0 0 1 0 .28L.81 8.64a.18.18 0 0 1-.25 0 .2.2 0 0 1 0-.27v-.01l3.15-3.42.31-.34-.31-.34L.57.84Z"], [1, "flex", "items-center", "gap-2", "h-full", "w-[calc(100%_-_30px)]"], ["xmlns", "http://www.w3.org/2000/svg", "width", "18", "height", "14", "fill", "none", "viewBox", "0 0 18 14", 1, "text-grey", 2, "min-width", "18px", 3, "ngClass"], ["fill", "currentColor", "fill-rule", "evenodd", "d", "M6.41 1.878h7.268c.836 0 1.516.68 1.516 1.516.008 3.554-.003 5.546.005 9.1l-.38 1.04a.45.45 0 0 1-.05.101c-.261.38-.57.365-1.091.365H1.548C.71 14 .03 13.32.03 12.485V1.878C.03 1.043.71.363 1.547.363H4.58a.756.756 0 0 1 .536.222L6.41 1.878ZM1.736 12.312V3.69h11.61v8.622H1.736Z", "clip-rule", "evenodd"], ["fill", "currentColor", "d", "M3.619 6.558A.91.91 0 0 1 4.459 6h12.163a.91.91 0 0 1 .838 1.267l-2.555 6.017H2.167a.91.91 0 0 1-.84-1.263l2.292-5.463Z", 1, "foldersvg", 3, "ngClass"], ["truncateTooltip", "", "class", "block text-xs font-semibold truncate whitespace-nowrap foldername", 3, "tooltipText", 4, "ngIf"], [1, "z-20", "flex", "flex-col", "w-full", "bg-white", 3, "ngStyle"], ["truncateTooltip", "", 1, "block", "text-xs", "font-semibold", "truncate", "whitespace-nowrap", "foldername", 3, "tooltipText"], ["class", "flex items-center gap-3 bg-white rounded-base ps-11", "style", "height:40px;", 4, "ngFor", "ngForOf"], [1, "flex", "items-center", "gap-3", "bg-white", "rounded-base", "ps-11", 2, "height", "40px"]], template: function SharedfolderComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, SharedfolderComponent_div_0_Template, 5, 2, "div", 0);
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", ctx.TREE_DATA == null ? null : ctx.TREE_DATA.length);
      }
    }, dependencies: [
      CommonModule,
      NgClass,
      NgForOf,
      NgIf,
      NgStyle,
      ScrollingModule,
      NgScrollbarModule,
      IconComponent,
      MatCheckboxModule,
      SkeletonComponent,
      MatTooltipModule,
      MatFormFieldModule,
      MatMenuModule,
      FormsModule,
      TruncateTooltipDirective
    ], styles: ['\n\n.foldersvg.close[_ngcontent-%COMP%] {\n  d: path("M.875 3.812a.91.91 0 0 1 .91-.911H13.93a.91.91 0 0 1 .91.91v8.38a.91.91 0 0 1-.91.91H1.786a.91.91 0 0 1-.911-.91v-8.38Z");\n}\n/*# sourceMappingURL=sharedfolder.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SharedfolderComponent, { className: "SharedfolderComponent", filePath: "src\\app\\shared\\components\\myfiles\\sharedfolder\\sharedfolder.component.ts", lineNumber: 43 });
})();

// src/app/shared/interfaces/section.interface.ts
var SECTION_FOLDER_TYPES = {
  MASTER_BUNDLE: "MB",
  CORE_BUNDLE: "CB",
  CORE_ASSIGNED: "CO",
  TRANSCRIPT: "TS",
  GENERIC: "M",
  USER_FILES: "CF",
  ALL: "ALL"
};
var SECTION_APPROVED_EXCLUDE_TYPES = [
  SECTION_FOLDER_TYPES.CORE_BUNDLE,
  SECTION_FOLDER_TYPES.TRANSCRIPT,
  SECTION_FOLDER_TYPES.CORE_ASSIGNED,
  SECTION_FOLDER_TYPES.GENERIC
];
var SECTION_TEMPLATE_LIST = [
  {
    cFoldertype: SECTION_FOLDER_TYPES.CORE_ASSIGNED,
    cFolder: "Core Bundle",
    cMsg: "Create a Core Bundle section to assign files inside",
    isActive: true
  },
  {
    cFoldertype: SECTION_FOLDER_TYPES.TRANSCRIPT,
    cFolder: "Transcript",
    cMsg: "Add this section to upload transcript",
    isActive: true
  },
  {
    cFoldertype: SECTION_FOLDER_TYPES.GENERIC,
    cFolder: "Generic Section",
    cMsg: "Add files outside of Master Bundle",
    isActive: true
  }
];
var SECTION_EVENTS = {
  RELOAD_SECTION: "RELOAD-SECTION",
  ACTIVE_SECTION: "ACTIVE-SECTION",
  CHANGE_SECTION: "CHANGE-SECTION"
};
var SECTION_DIALOG = {
  SHARE_WIDTH: "400px",
  SHARE_HEIGHT: "80vh",
  CREATE_WIDTH: "485px",
  DEFAULT_DIMENSION: "fit-content",
  MAX_HEIGHT: "99vh"
};
var SECTION_PANEL_CLASS = ["addusermodal", "rounded-10", "overflow-hidden"];

// src/app/shared/components/myfiles/folders/folders.component.ts
var _c03 = ["shareteam"];
var _c13 = (a0) => ({ "close": a0 });
var _c23 = (a0) => ({ "!bg-blue-deactivate": a0 });
var _c32 = (a0, a1, a2, a3, a4) => ({ "mt-2": a0, "rounded-b-none": a1, "rounded-base": a2, "!w-[450px]": a3, "!w-[650px]": a4 });
var _c42 = (a0, a1) => ({ "!bg-blue-deactivate": a0, "my-1": a1 });
var _c52 = (a0) => ({ "padding-left": a0 });
var _c62 = (a0) => ({ "text-blue-on": a0 });
var _c72 = (a0) => ({ "rotate-90 !text-blue-on": a0 });
var _c82 = (a0) => ({ "!text-blue-on": a0 });
var _c9 = (a0, a1) => ({ "!opacity-100": a0, "!opacity-0": a1 });
var _c10 = (a0, a1) => ({ "!opacity-100": a0, "!opacity-0 pointer-events-none": a1 });
var _c11 = (a0) => ({ "group-hover:!pe-14": a0 });
var _c122 = () => [1];
var _c132 = (a0) => ({ "bg-reply": a0 });
var _c14 = (a0) => ({ "opacity-50": a0 });
function FoldersComponent_div_0_ng_container_2_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16);
    \u0275\u0275element(1, "icon", 17)(2, "icon", 18)(3, "sklton", 19);
    \u0275\u0275elementEnd();
  }
}
function FoldersComponent_div_0_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div");
    \u0275\u0275template(2, FoldersComponent_div_0_ng_container_2_div_2_Template, 4, 0, "div", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r0.loadingSkeletonRows);
  }
}
function FoldersComponent_div_0_ng_container_4_ng_container_15_ng_container_1_ng_container_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "sharedfolder", 33, 0);
    \u0275\u0275listener("click", function FoldersComponent_div_0_ng_container_4_ng_container_15_ng_container_1_ng_container_13_Template_sharedfolder_click_1_listener() {
      \u0275\u0275restoreView(_r5);
      const user_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.activeCBSection(user_r4));
    })("keydown.enter", function FoldersComponent_div_0_ng_container_4_ng_container_15_ng_container_1_ng_container_13_Template_sharedfolder_keydown_enter_1_listener() {
      \u0275\u0275restoreView(_r5);
      const user_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.activeCBSection(user_r4));
    })("keydown.space", function FoldersComponent_div_0_ng_container_4_ng_container_15_ng_container_1_ng_container_13_Template_sharedfolder_keydown_space_1_listener() {
      \u0275\u0275restoreView(_r5);
      const user_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.activeCBSection(user_r4));
    })("changeFolder", function FoldersComponent_div_0_ng_container_4_ng_container_15_ng_container_1_ng_container_13_Template_sharedfolder_changeFolder_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r0.changeSharebundle($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const user_r4 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("isIndividual", ctx_r0.isIndividual)("nSectionid", user_r4.nSectionid)("nUserid", user_r4.nUserid)("nCaseid", ctx_r0.nCaseid)("nBundleid", ctx_r0.nBundleid ? ctx_r0.nBundleid : null)("changeF", ctx_r0.changeF);
  }
}
function FoldersComponent_div_0_ng_container_4_ng_container_15_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 31);
    \u0275\u0275listener("click", function FoldersComponent_div_0_ng_container_4_ng_container_15_ng_container_1_Template_button_click_1_listener() {
      const user_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.activeCBSection(user_r4, true, true));
    });
    \u0275\u0275elementStart(2, "div", 32);
    \u0275\u0275element(3, "mat-checkbox", 22);
    \u0275\u0275elementStart(4, "div", 23);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 24);
    \u0275\u0275element(6, "path", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "div", 26);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(8, "svg", 27);
    \u0275\u0275element(9, "path", 28)(10, "path", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(11, "span", 30);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275template(13, FoldersComponent_div_0_ng_container_4_ng_container_15_ng_container_1_ng_container_13_Template, 3, 6, "ng-container", 7);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const user_r4 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(12, _c23, (user_r4 == null ? null : user_r4.nSectionid) == (ctx_r0.viewSection == null ? null : ctx_r0.viewSection.nSectionid) && !ctx_r0.nBundleid));
    \u0275\u0275advance(4);
    \u0275\u0275classMap((user_r4 == null ? null : user_r4.nSectionid) == (ctx_r0.viewSection == null ? null : ctx_r0.viewSection.nSectionid) && !ctx_r0.nBundleid ? "!text-blue-on" : "");
    \u0275\u0275classProp("!rotate-90", user_r4.expanded);
    \u0275\u0275advance(3);
    \u0275\u0275classMap((user_r4 == null ? null : user_r4.nSectionid) == (ctx_r0.viewSection == null ? null : ctx_r0.viewSection.nSectionid) && !ctx_r0.nBundleid ? "!text-blue-on" : "");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(14, _c13, !user_r4.expanded));
    \u0275\u0275advance();
    \u0275\u0275classMap((user_r4 == null ? null : user_r4.nSectionid) == (ctx_r0.viewSection == null ? null : ctx_r0.viewSection.nSectionid) && !ctx_r0.nBundleid ? "!text-blue-on" : "");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", user_r4.cSharedby, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", user_r4.expanded);
  }
}
function FoldersComponent_div_0_ng_container_4_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FoldersComponent_div_0_ng_container_4_ng_container_15_ng_container_1_Template, 14, 16, "ng-container", 13);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r0.sharedByuser);
  }
}
function FoldersComponent_div_0_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div")(2, "button", 20);
    \u0275\u0275listener("click", function FoldersComponent_div_0_ng_container_4_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.shareexpand = !ctx_r0.shareexpand);
    });
    \u0275\u0275elementStart(3, "div", 21);
    \u0275\u0275element(4, "mat-checkbox", 22);
    \u0275\u0275elementStart(5, "div", 23);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 24);
    \u0275\u0275element(7, "path", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(8, "div", 26);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(9, "svg", 27);
    \u0275\u0275element(10, "path", 28)(11, "path", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(12, "span", 30);
    \u0275\u0275text(13);
    \u0275\u0275pipe(14, "translate");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275template(15, FoldersComponent_div_0_ng_container_4_ng_container_15_Template, 2, 1, "ng-container", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r0.shareexpand && !ctx_r0.viewSection ? "!bg-blue-deactivate" : "");
    \u0275\u0275attribute("aria-expanded", ctx_r0.shareexpand);
    \u0275\u0275advance(4);
    \u0275\u0275classMap(ctx_r0.shareexpand && !ctx_r0.viewSection ? "text-blue-on" : "");
    \u0275\u0275classProp("!rotate-90", ctx_r0.shareexpand);
    \u0275\u0275advance(3);
    \u0275\u0275classMap(ctx_r0.shareexpand && !ctx_r0.viewSection ? "!text-blue-on" : "");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(16, _c13, !ctx_r0.shareexpand));
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r0.shareexpand && !ctx_r0.viewSection ? "text-blue-on" : "");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(14, 14, "MYFILES.FOLDERS.SHARED_WITH_ME"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r0.shareexpand);
  }
}
function FoldersComponent_div_0_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 34);
    \u0275\u0275listener("click", function FoldersComponent_div_0_ng_container_6_Template_button_click_1_listener() {
      const item_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.viewFileDB(item_r7));
    });
    \u0275\u0275element(2, "img", 35)(3, "app-tabletrunc", 36);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const item_r7 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275propertyInterpolate1("src", "../../../../../assets/img/doctype/", item_r7.cFiletype, ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275attribute("alt", (item_r7 == null ? null : item_r7.cFiletype) ? item_r7.cFiletype + " file type" : "file type");
    \u0275\u0275advance();
    \u0275\u0275property("value", item_r7.cName);
  }
}
function FoldersComponent_div_0_div_7_ng_container_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-checkbox", 44);
    \u0275\u0275twoWayListener("ngModelChange", function FoldersComponent_div_0_div_7_ng_container_3_ng_container_1_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      \u0275\u0275twoWayBindingSet(node_r10.cIstempcheck, $event) || (node_r10.cIstempcheck = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function FoldersComponent_div_0_div_7_ng_container_3_ng_container_1_Template_mat_checkbox_change_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.openfolderuncheck(node_r10, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const node_r10 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", (node_r10 == null ? null : node_r10.isNew) || ctx_r0.isCopy)("ngClass", \u0275\u0275pureFunction2(3, _c9, node_r10.cIstempcheck, node_r10.isedit));
    \u0275\u0275twoWayProperty("ngModel", node_r10.cIstempcheck);
  }
}
function FoldersComponent_div_0_div_7_ng_container_3_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 45);
    \u0275\u0275listener("change", function FoldersComponent_div_0_div_7_ng_container_3_ng_template_2_Template_mat_checkbox_change_0_listener($event) {
      \u0275\u0275restoreView(_r11);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.checkFolder(node_r10, $event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const node_r10 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("disabled", (node_r10 == null ? null : node_r10.isNew) || ctx_r0.isCopy)("ngClass", \u0275\u0275pureFunction2(3, _c10, node_r10.cIscheck, node_r10.isedit || ctx_r0.presentDocType == "C" || ctx_r0.cFoldertype === ctx_r0.FOLDER_TYPES.ALL))("checked", node_r10.cIscheck);
  }
}
function FoldersComponent_div_0_div_7_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FoldersComponent_div_0_div_7_ng_container_3_ng_container_1_Template, 2, 6, "ng-container", 39)(2, FoldersComponent_div_0_div_7_ng_container_3_ng_template_2_Template, 1, 6, "ng-template", null, 2, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const normalFolderCheckbox_r12 = \u0275\u0275reference(3);
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.cutCopyType == "Private Bundle Quick Assign")("ngIfElse", normalFolderCheckbox_r12);
  }
}
function FoldersComponent_div_0_div_7_ng_template_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function FoldersComponent_div_0_div_7_span_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 46);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const node_r10 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("tooltipText", node_r10.cBundlename)("ngClass", \u0275\u0275pureFunction1(3, _c11, ctx_r0.isadmin && !node_r10.isedit && !ctx_r0.isSepcomponent || ctx_r0.cFoldertype === ctx_r0.FOLDER_TYPES.CORE_BUNDLE || ctx_r0.cFoldertype === ctx_r0.FOLDER_TYPES.USER_FILES));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", node_r10.cBundlename, " ");
  }
}
function FoldersComponent_div_0_div_7_ng_container_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "inpt", 47);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275listener("keyup.enter", function FoldersComponent_div_0_div_7_ng_container_14_Template_inpt_keyup_enter_1_listener($event) {
      \u0275\u0275restoreView(_r13);
      const node_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.createNewFolder(node_r10, $event.target));
    })("focusout", function FoldersComponent_div_0_div_7_ng_container_14_Template_inpt_focusout_1_listener($event) {
      \u0275\u0275restoreView(_r13);
      const node_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.createNewFolder(node_r10, $event.target));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const node_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(2, 5, "MYFILES.FOLDERS.PLACEHOLDER_NEW_FOLDER"))("focus", true)("showlabel", false)("inlinemode", true)("value", node_r10["cBundlename"]);
  }
}
function FoldersComponent_div_0_div_7_ng_container_15_ng_container_10_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "share-with-team", 55);
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_10_ng_container_1_Template_share_with_team_click_1_listener($event) {
      \u0275\u0275restoreView(_r15);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_10_ng_container_1_Template_share_with_team_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r15);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_10_ng_container_1_Template_share_with_team_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r15);
      return \u0275\u0275resetView($event.stopPropagation());
    })("checkevent", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_10_ng_container_1_Template_share_with_team_checkevent_1_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r0 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r0.checkdusers($event));
    })("shareEvent", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_10_ng_container_1_Template_share_with_team_shareEvent_1_listener($event) {
      \u0275\u0275restoreView(_r15);
      const node_r10 = \u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.shareEvent($event, node_r10.nBundleid));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const node_r10 = \u0275\u0275nextContext(3).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("activeuser", true)("nCaseid", ctx_r0.nCaseid)("nSectionid", ctx_r0.nSectionid)("nBundleid", node_r10.nBundleid);
  }
}
function FoldersComponent_div_0_div_7_ng_container_15_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FoldersComponent_div_0_div_7_ng_container_15_ng_container_10_ng_container_1_Template, 2, 4, "ng-container", 7);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const o_r16 = \u0275\u0275reference(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", o_r16.menuOpen);
  }
}
function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "icon", 56);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_click_1_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.getPermission(node_r10.nBundleid));
    })("keydown.enter", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_keydown_enter_1_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.getPermission(node_r10.nBundleid));
    })("keydown.space", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_keydown_space_1_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.getPermission(node_r10.nBundleid));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "icon", 57);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_click_3_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.edittag(node_r10));
    })("keydown.enter", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_keydown_enter_3_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.edittag(node_r10));
    })("keydown.space", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_keydown_space_3_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.edittag(node_r10));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "icon", 58);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_click_5_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.hyperlink(node_r10));
    })("keydown.enter", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_keydown_enter_5_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.hyperlink(node_r10));
    })("keydown.space", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_keydown_space_5_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.hyperlink(node_r10));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 59);
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_svg_click_7_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.pagination(node_r10));
    })("keydown.enter", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_svg_keydown_enter_7_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.pagination(node_r10));
    })("keydown.space", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_svg_keydown_space_7_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.pagination(node_r10));
    });
    \u0275\u0275element(9, "path", 60)(10, "path", 61)(11, "rect", 62)(12, "path", 63)(13, "path", 64);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(14, "icon", 65);
    \u0275\u0275pipe(15, "translate");
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_click_14_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.convert(node_r10));
    })("keydown.enter", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_keydown_enter_14_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.convert(node_r10));
    })("keydown.space", function FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template_icon_keydown_space_14_listener() {
      \u0275\u0275restoreView(_r17);
      const node_r10 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.convert(node_r10));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(2, 5, "MYFILES.FOLDERS.TOOLTIP_PERMISSION"));
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(4, 7, "MYFILES.FOLDERS.TOOLTIP_BUNDLE_REFERANCE"));
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(6, 9, "MYFILES.FOLDERS.TOOLTIP_HYPERLINK"));
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(8, 11, "MYFILES.FOLDERS.TOOLTIP_PAGINATION"));
    \u0275\u0275advance(7);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(15, 13, "MYFILES.FOLDERS.TOOLTIP_CONVERT"));
  }
}
function FoldersComponent_div_0_div_7_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 48)(2, "span", 49)(3, "icon", 50, 3);
    \u0275\u0275listener("menuOpened", function FoldersComponent_div_0_div_7_ng_container_15_Template_icon_menuOpened_3_listener() {
      \u0275\u0275restoreView(_r14);
      const node_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.handleMenuOpened(node_r10, true));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "mat-menu", 51, 4)(7, "div", 52)(8, "icon", 53);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_ng_container_15_Template_icon_click_8_listener($event) {
      \u0275\u0275restoreView(_r14);
      const node_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addBundleEdit(node_r10, $event));
    })("keydown.enter", function FoldersComponent_div_0_div_7_ng_container_15_Template_icon_keydown_enter_8_listener($event) {
      \u0275\u0275restoreView(_r14);
      const node_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addBundleEdit(node_r10, $event));
    })("keydown.space", function FoldersComponent_div_0_div_7_ng_container_15_Template_icon_keydown_space_8_listener($event) {
      \u0275\u0275restoreView(_r14);
      const node_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addBundleEdit(node_r10, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, FoldersComponent_div_0_div_7_ng_container_15_ng_container_10_Template, 2, 1, "ng-container", 7);
    \u0275\u0275elementStart(11, "icon", 54);
    \u0275\u0275pipe(12, "translate");
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_ng_container_15_Template_icon_click_11_listener() {
      \u0275\u0275restoreView(_r14);
      const node_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addNewBundle(node_r10));
    })("keydown.enter", function FoldersComponent_div_0_div_7_ng_container_15_Template_icon_keydown_enter_11_listener() {
      \u0275\u0275restoreView(_r14);
      const node_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addNewBundle(node_r10));
    })("keydown.space", function FoldersComponent_div_0_div_7_ng_container_15_Template_icon_keydown_space_11_listener() {
      \u0275\u0275restoreView(_r14);
      const node_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addNewBundle(node_r10));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(13, FoldersComponent_div_0_div_7_ng_container_15_ng_container_13_Template, 16, 15, "ng-container", 7);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const menu_r18 = \u0275\u0275reference(6);
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275property("matMenuTriggerFor", menu_r18);
    \u0275\u0275advance(5);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(9, 5, "MYFILES.FOLDERS.TOOLTIP_RENAME"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r0.cFoldertype === ctx_r0.FOLDER_TYPES.CORE_BUNDLE);
    \u0275\u0275advance();
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(12, 7, "MYFILES.FOLDERS.TOOLTIP_ADD_FOLDER"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r0.isadmin);
  }
}
function FoldersComponent_div_0_div_7_ng_container_16_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 68);
    \u0275\u0275element(1, "icon", 17)(2, "icon", 18)(3, "sklton", 19);
    \u0275\u0275elementEnd();
  }
}
function FoldersComponent_div_0_div_7_ng_container_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 66);
    \u0275\u0275template(2, FoldersComponent_div_0_div_7_ng_container_16_div_2_Template, 4, 0, "div", 67);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const node_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c52, (node_r10.level > 0 ? node_r10.level * 24 : 0) + "px"));
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", \u0275\u0275pureFunction0(4, _c122));
  }
}
function FoldersComponent_div_0_div_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 37);
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.viewSection = null);
    })("keydown.enter", function FoldersComponent_div_0_div_7_Template_div_keydown_enter_0_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.viewSection = null);
    })("keydown.space", function FoldersComponent_div_0_div_7_Template_div_keydown_space_0_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.viewSection = null);
    });
    \u0275\u0275elementStart(1, "div", 38)(2, "div", 32);
    \u0275\u0275template(3, FoldersComponent_div_0_div_7_ng_container_3_Template, 4, 2, "ng-container", 39)(4, FoldersComponent_div_0_div_7_ng_template_4_Template, 1, 0, "ng-template", null, 1, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementStart(6, "button", 40);
    \u0275\u0275listener("click", function FoldersComponent_div_0_div_7_Template_button_click_6_listener() {
      const node_r10 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(!(node_r10 == null ? null : node_r10.isedit) ? ctx_r0.loadChildren(node_r10, true) : null);
    })("dragstart", function FoldersComponent_div_0_div_7_Template_button_dragstart_6_listener($event) {
      const node_r10 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onDragStart($event, node_r10));
    })("dragend", function FoldersComponent_div_0_div_7_Template_button_dragend_6_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onDragEnd());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(7, "svg", 41);
    \u0275\u0275element(8, "path", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "div", 26);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(10, "svg", 42);
    \u0275\u0275element(11, "path", 28)(12, "path", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275template(13, FoldersComponent_div_0_div_7_span_13_Template, 2, 5, "span", 43)(14, FoldersComponent_div_0_div_7_ng_container_14_Template, 3, 7, "ng-container", 7);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(15, FoldersComponent_div_0_div_7_ng_container_15_Template, 14, 9, "ng-container", 7);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(16, FoldersComponent_div_0_div_7_ng_container_16_Template, 3, 5, "ng-container", 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const node_r10 = ctx.$implicit;
    const isIndividualPlaceholder_r19 = \u0275\u0275reference(5);
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction5(16, _c32, !node_r10.level, !node_r10.level && node_r10.isExpanded, !node_r10.level, node_r10.level > 3 && node_r10.level < 12, node_r10.level > 12));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(22, _c42, (node_r10 == null ? null : node_r10.nBundleid) == (ctx_r0.activeBundle == null ? null : ctx_r0.activeBundle.nBundleid), node_r10.level))("ngStyle", \u0275\u0275pureFunction1(25, _c52, (node_r10.level > 0 ? node_r10.level * 24 : 0) + "px"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r0.isIndividual)("ngIfElse", isIndividualPlaceholder_r19);
    \u0275\u0275advance(3);
    \u0275\u0275property("draggable", !(node_r10 == null ? null : node_r10.isedit))("ngClass", \u0275\u0275pureFunction1(27, _c62, (node_r10 == null ? null : node_r10.nBundleid) == (ctx_r0.activeBundle == null ? null : ctx_r0.activeBundle.nBundleid)));
    \u0275\u0275advance();
    \u0275\u0275classProp("!rotate-90", node_r10.isExpanded);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(29, _c72, (node_r10 == null ? null : node_r10.nBundleid) == (ctx_r0.activeBundle == null ? null : ctx_r0.activeBundle.nBundleid)));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(31, _c82, (node_r10 == null ? null : node_r10.nBundleid) == (ctx_r0.activeBundle == null ? null : ctx_r0.activeBundle.nBundleid)));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(33, _c13, (node_r10 == null ? null : node_r10.nBundleid) != (ctx_r0.activeBundle == null ? null : ctx_r0.activeBundle.nBundleid) && !(node_r10 == null ? null : node_r10.isExpanded)));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !node_r10["isedit"]);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r0.isadmin || ctx_r0.cFoldertype === ctx_r0.FOLDER_TYPES.CORE_BUNDLE || ctx_r0.cFoldertype === ctx_r0.FOLDER_TYPES.USER_FILES) && node_r10.isedit);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.isadmin && !node_r10.isedit && !ctx_r0.isSepcomponent || (ctx_r0.cFoldertype === ctx_r0.FOLDER_TYPES.CORE_BUNDLE || ctx_r0.cFoldertype === ctx_r0.FOLDER_TYPES.USER_FILES) && !node_r10.isedit);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", node_r10.islodingchildren);
  }
}
function FoldersComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9)(1, "cdk-virtual-scroll-viewport", 10);
    \u0275\u0275template(2, FoldersComponent_div_0_ng_container_2_Template, 3, 1, "ng-container", 7);
    \u0275\u0275elementStart(3, "div", 11);
    \u0275\u0275template(4, FoldersComponent_div_0_ng_container_4_Template, 16, 18, "ng-container", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 12);
    \u0275\u0275template(6, FoldersComponent_div_0_ng_container_6_Template, 4, 4, "ng-container", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, FoldersComponent_div_0_div_7_Template, 17, 35, "div", 14);
    \u0275\u0275pipe(8, "async");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", !ctx_r0.OnlyFolders ? "h-[calc(100%_-_50px)]" : "h-full");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r0.loading);
    \u0275\u0275advance();
    \u0275\u0275property("hidden", ctx_r0.assignPopup);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.cFoldertype === ctx_r0.FOLDER_TYPES.CORE_BUNDLE && ctx_r0.sharedByuser.length);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r0.fileList);
    \u0275\u0275advance();
    \u0275\u0275property("cdkVirtualForOf", \u0275\u0275pipeBind1(8, 6, ctx_r0.dataSource));
  }
}
function FoldersComponent_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 69);
    \u0275\u0275listener("click", function FoldersComponent_ng_container_2_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r20);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.closeMenu());
    })("keydown.enter", function FoldersComponent_ng_container_2_Template_btn_keydown_enter_1_listener() {
      \u0275\u0275restoreView(_r20);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.closeMenu());
    })("keydown.space", function FoldersComponent_ng_container_2_Template_btn_keydown_space_1_listener() {
      \u0275\u0275restoreView(_r20);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.closeMenu());
    });
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !ctx_r0.getcheckedFolder().length);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 2, "MYFILES.FOLDERS.CHOOSE_SELECTED"));
  }
}
function FoldersComponent_div_3_ng_container_1_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16);
    \u0275\u0275element(1, "icon", 17)(2, "icon", 18)(3, "sklton", 19);
    \u0275\u0275elementEnd();
  }
}
function FoldersComponent_div_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div");
    \u0275\u0275template(2, FoldersComponent_div_3_ng_container_1_div_2_Template, 4, 0, "div", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r0.loadingSkeletonRows);
  }
}
function FoldersComponent_div_3_div_2_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 79);
    \u0275\u0275elementContainerEnd();
  }
}
function FoldersComponent_div_3_div_2_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 80);
    \u0275\u0275elementContainerEnd();
  }
}
function FoldersComponent_div_3_div_2_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 81);
    \u0275\u0275elementContainerEnd();
  }
}
function FoldersComponent_div_3_div_2_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 82);
    \u0275\u0275elementContainerEnd();
  }
}
function FoldersComponent_div_3_div_2_ng_container_12_btn_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 84);
    \u0275\u0275listener("click", function FoldersComponent_div_3_div_2_ng_container_12_btn_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r23);
      const x_r22 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addSection(x_r22));
    })("keydown.enter", function FoldersComponent_div_3_div_2_ng_container_12_btn_1_Template_btn_keydown_enter_0_listener() {
      \u0275\u0275restoreView(_r23);
      const x_r22 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addSection(x_r22));
    })("keydown.space", function FoldersComponent_div_3_div_2_ng_container_12_btn_1_Template_btn_keydown_space_0_listener() {
      \u0275\u0275restoreView(_r23);
      const x_r22 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addSection(x_r22));
    });
    \u0275\u0275element(1, "icon", 85);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("square", true);
  }
}
function FoldersComponent_div_3_div_2_ng_container_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FoldersComponent_div_3_div_2_ng_container_12_btn_1_Template, 2, 1, "btn", 83);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r22 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !x_r22.isActive);
  }
}
function FoldersComponent_div_3_div_2_div_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r24 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 86)(1, "btn", 87);
    \u0275\u0275listener("click", function FoldersComponent_div_3_div_2_div_13_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r24);
      const x_r22 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addSection(x_r22));
    })("keydown.enter", function FoldersComponent_div_3_div_2_div_13_Template_btn_keydown_enter_1_listener() {
      \u0275\u0275restoreView(_r24);
      const x_r22 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addSection(x_r22));
    })("keydown.space", function FoldersComponent_div_3_div_2_div_13_Template_btn_keydown_space_1_listener() {
      \u0275\u0275restoreView(_r24);
      const x_r22 = \u0275\u0275nextContext().$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addSection(x_r22));
    });
    \u0275\u0275element(2, "icon", 88);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("square", true);
  }
}
function FoldersComponent_div_3_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 72)(1, "div", 73)(2, "div", 32)(3, "button", 74);
    \u0275\u0275listener("click", function FoldersComponent_div_3_div_2_Template_button_click_3_listener() {
      const x_r22 = \u0275\u0275restoreView(_r21).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.changeSection(x_r22));
    });
    \u0275\u0275elementStart(4, "div", 75)(5, "div", 76);
    \u0275\u0275template(6, FoldersComponent_div_3_div_2_ng_container_6_Template, 2, 0, "ng-container", 7)(7, FoldersComponent_div_3_div_2_ng_container_7_Template, 2, 0, "ng-container", 7)(8, FoldersComponent_div_3_div_2_ng_container_8_Template, 2, 0, "ng-container", 7)(9, FoldersComponent_div_3_div_2_ng_container_9_Template, 2, 0, "ng-container", 7);
    \u0275\u0275elementStart(10, "span", 77);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(12, FoldersComponent_div_3_div_2_ng_container_12_Template, 2, 1, "ng-container", 7)(13, FoldersComponent_div_3_div_2_div_13_Template, 3, 1, "div", 78);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const x_r22 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(11, _c132, x_r22.isActive));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(13, _c23, x_r22.nSectionid == ctx_r0.nSectionid && x_r22.isActive != false));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(15, _c62, (x_r22 == null ? null : x_r22.nSectionid) == ctx_r0.nSectionid && x_r22.isActive != false));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", !ctx_r0.folderTypeGroups.ADD_SECTION_TYPES.includes(x_r22.cFoldertype));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r22.cFoldertype === ctx_r0.FOLDER_TYPES.CORE_BUNDLE);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r22.cFoldertype === ctx_r0.FOLDER_TYPES.TRANSCRIPT);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r22.cFoldertype === ctx_r0.FOLDER_TYPES.USER_FILES);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(17, _c14, x_r22.isActive == false));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r22.cFolder);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.folderTypeGroups.ADD_SECTION_TYPES.includes(x_r22.cFoldertype));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r22.cFoldertype === ctx_r0.FOLDER_TYPES.USER_FILES && x_r22.isActive);
  }
}
function FoldersComponent_div_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 70);
    \u0275\u0275template(1, FoldersComponent_div_3_ng_container_1_Template, 3, 1, "ng-container", 7)(2, FoldersComponent_div_3_div_2_Template, 14, 19, "div", 71);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.loading);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r0.Allsectionlist);
  }
}
var FoldersComponent = class _FoldersComponent {
  constructor(myfileS, cdr, dialog, cs, cf, paginationS, hyperlinkService, hs) {
    this.myfileS = myfileS;
    this.cdr = cdr;
    this.dialog = dialog;
    this.cs = cs;
    this.cf = cf;
    this.paginationS = paginationS;
    this.hyperlinkService = hyperlinkService;
    this.hs = hs;
    this.FOLDER_TYPES = SECTION_FOLDER_TYPES;
    this.OnlyFolders = false;
    this.cutCopyType = "";
    this.Allsectionlist = [];
    this.isIndividual = false;
    this.selectedIDs = [];
    this.isLink = null;
    this.jfileFilter = [];
    this.changeFolder = new EventEmitter();
    this.changeSectionAll = new EventEmitter();
    this.getSelection = new EventEmitter();
    this.isEmptyevent = new EventEmitter();
    this.loading = true;
    this.loadingSkeletonRows = SKELETON_ARRAYS.FOLDERS_LOADING_SKELETON;
    this.folderTypeGroups = MYFILES_FOLDER_TYPE_GROUPS;
    this.checkedusers = 0;
    this.shareexpand = false;
    this.userAdmin = false;
    this.isMeexpand = false;
    this.TREE_DATA = [];
    this.TREE_DATAChange = new EventEmitter();
    this.LAST_TREE_DATA_STAT = [];
    this.LAST_TREE_DATA_STATChange = new EventEmitter();
    this.dataSource = new BehaviorSubject(this.TREE_DATA);
    this.isCopy = false;
    this.sharedByuser = [];
    this.selectedBundles = [];
    this.nSelectedFolderid = [];
    this.searchedBundlesChange = new EventEmitter();
    this.isFolderLoading = false;
    this.isFolderLoadingChange = new EventEmitter();
    this.isPreview = false;
    this.isPreviewChange = new EventEmitter();
    this.allSectionViewPort = false;
    this.currentSearchToken = 0;
    this.fileList = [];
    this.lastFileFilterKey = "";
  }
  ngOnInit() {
    this.checkEventSub();
    this.isadmin = this.detail?.isadmin;
    if (this.onFileEvent) {
      this.onFileEvent.subscribe((e) => {
        if (e.event === MYFILES_TOOL_EVENTS.FILTER) {
          const newKey = JSON.stringify(e.data || []);
          if (this.lastFileFilterKey === newKey)
            return;
          this.lastFileFilterKey = newKey;
          this.jfileFilter = e.data;
          if (this.hs.isGlobalSearch && this.hs.jFilter.cWithin != "I") {
            this.getMetaBundles(this.hs.jFilter);
          }
        }
      });
    }
    if (this.allSectionEvent) {
      if (this.AllSectionSubscription) {
        this.AllSectionSubscription.unsubscribe();
      }
      this.AllSectionSubscription = this.allSectionEvent.subscribe((data) => {
        this.loadChildren(data.data, data.flag);
      });
    }
  }
  bundleSelection() {
    if (this.presentDocType) {
      this.TREE_DATA.forEach((node) => {
        if (this.selectedBundles.includes(node.nBundleid)) {
          node["cIscheck"] = true;
        }
      });
      this.treeDataChange();
    }
    this.cdr.detectChanges();
  }
  checkEventSub() {
    this.evsubscription = this.cs.functionCalled$.subscribe((data) => {
      if (data?.event === MYFILES_CS_EVENTS.SHOW_FOLDER) {
        const bundleId = data?.nBundleid ?? null;
        const node = this.getBundleNode(bundleId);
        if (node) {
          this.loadChildren(node);
        }
        this.getBundlePath(bundleId);
      }
      if (data?.type === MYFILES_CS_TYPES.VIEW_SHARE) {
        this.shareexpand = true;
        const user = this.sharedByuser.find((e) => e.nUserid == data.nUserid);
        this.activeCBSection(user, true, true);
        this.cdr.detectChanges();
      }
      if (data?.type === MYFILES_CS_TYPES.CUT_COPY_EVENT) {
        this.isCopy = data.isCopy;
        this.cdr.detectChanges();
      } else if (data?.type === MYFILES_CS_TYPES.SEARCH_BUNDLES) {
        this.searchedBundles = data?.searchedBundles || [];
        this.getBundleList(null);
        this.cdr.detectChanges();
      } else if (data?.event === MYFILES_CS_EVENTS.FETCH_META_BUNDLES) {
        this.getMetaBundles(data?.jFilter);
      } else if (data?.type === MYFILES_CS_TYPES.SEARCH_BUNDLES_CLEAR) {
        this.clearSearchBundle();
      } else if (data?.event === MYFILES_CS_EVENTS.CHANGE_SEARCH_SECTION) {
        if (this.hs.jFilter?.cSearch && data?.jFilter) {
          this.getMetaBundles(data?.jFilter);
          this.getBundleList(null);
        }
      }
      if (data?.event === MYFILES_TOOL_EVENTS.SEARCH_CLEAR) {
        this.handleSearchClear();
      }
    });
  }
  handleSearchClear() {
    if (!this.hs.isGlobalSearch)
      return;
    this.TREE_DATA = [];
    this.treeDataChange();
    this.isEmptyevent.emit(this.TREE_DATA.length);
    this.cdr.detectChanges();
  }
  clearSearchBundle() {
    this.nBundleid = null;
    this.activeBundle = null;
    this.searchedBundles = [];
    try {
      this.selectedFolder(null);
      this.collapseChildrenForParentBundleId(this.nBundleid);
      this.applySelectedFolderChecks();
      this.treeDataChange();
      this.dataSource.next(this.TREE_DATA);
      this.cdr.detectChanges();
    } catch (error) {
      throw new Error(`clearSearchBundle failed: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  ngOnDestroy() {
    if (this.evsubscription) {
      this.evsubscription.unsubscribe();
    }
    if (this.AllSectionSubscription) {
      this.AllSectionSubscription.unsubscribe();
    }
  }
  ngOnChanges(changes) {
    if (changes["TREE_DATA"] && !changes["TREE_DATA"].firstChange) {
      this.onTreeDataChanged();
    }
    if (changes["nSectionid"] && this.nSectionid) {
      this.onSectionIdChanged();
    }
    if (changes["cFoldertype"]) {
      this.onFolderTypeChanged();
    }
    if (changes["nBundleid"] && this.nSectionid) {
      this.onBundleIdChanged();
    }
    if (changes["changeF"]) {
      this.dataSource.next([...this.TREE_DATA]);
      this.cdr.detectChanges();
    }
    if (this.isSepcomponent) {
      this.syncSepComponentSelection();
    }
    if (this.detail?.nUPid) {
      this.getUploadDetail();
    }
    if (changes["isPreview"]) {
      this.viewport?.checkViewportSize();
    }
    if (changes["allSectionViewPort"]) {
      this.handleAllSectionViewportChange();
    }
  }
  onTreeDataChanged() {
    if (this.TREE_DATA?.length) {
      this.dataSource.next(this.TREE_DATA);
    }
  }
  onSectionIdChanged() {
    this.sharedByuser = [];
    this.fileList = [];
    if (this.hs.isGlobalSearch && this.cFoldertype === "MB" && this.LAST_TREE_DATA_STAT?.length) {
      this.TREE_DATA = [...this.LAST_TREE_DATA_STAT];
      this.treeDataChange();
      this.dataSource.next(this.TREE_DATA);
      this.LAST_TREE_DATA_STAT = [];
      this.getFileList(1, null, false);
      this.LAST_TREE_DATA_STATChange.emit(this.LAST_TREE_DATA_STAT);
      return;
    }
    if (this.cFoldertype === "MB") {
      this.getFileList(1, null, false);
    }
    this.getBundleList(null);
  }
  onFolderTypeChanged() {
    if (this.cFoldertype === "CB") {
      this.getSharedBundles();
    }
  }
  onBundleIdChanged() {
    const activeBundleId = this.activeBundle?.nBundleid ?? null;
    const currentBundleId = this.nBundleid ?? null;
    const shouldSyncBundle = currentBundleId ? activeBundleId !== currentBundleId : activeBundleId !== null;
    if (!shouldSyncBundle)
      return;
    if (currentBundleId) {
      const node = this.TREE_DATA.find((e) => e.nBundleid == currentBundleId);
      if (node) {
        this.loadChildren(node);
      }
      return;
    }
    this.selectedFolder(null);
    this.activeBundle = null;
    this.nBundleid = null;
    this.collapseChildrenForParentBundleId(this.nBundleid);
    this.applySelectedFolderChecks();
    this.treeDataChange();
    this.dataSource.next(this.TREE_DATA);
  }
  syncSepComponentSelection() {
    this.getcheckedFolder().forEach((node) => node.cIscheck = false);
    if (this.selectedIDs?.length) {
      for (const id of this.selectedIDs) {
        const node = this.getBundleNode(id);
        node.cIscheck = true;
      }
    }
  }
  handleAllSectionViewportChange() {
    setTimeout(() => {
      if (this.viewport) {
        this.viewport.checkViewportSize();
        return;
      }
      setTimeout(() => {
        this.viewport?.checkViewportSize();
      }, 500);
    }, 500);
  }
  collapseChildrenForParentBundleId(parentBundleId) {
    const treedata = [...this.TREE_DATA];
    for (const row of treedata.filter((e) => e.nParentBundleid == parentBundleId)) {
      row.isExpanded = false;
      this.TREE_DATA = this.removeDescendants(this.TREE_DATA, row.nBundleid);
    }
  }
  applySelectedFolderChecks() {
    if (!this.nSelectedFolderid?.length)
      return;
    this.TREE_DATA.forEach((node) => {
      if (this.nSelectedFolderid.some((i) => i.id == node.nBundleid)) {
        node["cIscheck"] = true;
      }
    });
  }
  changeSection(x) {
    const isActive = x?.isActive ?? true;
    if (!isActive)
      return;
    this.nSectionid = x.nSectionid;
    this.changeSectionAll.emit(x);
    this.cdr.detectChanges();
  }
  activeCBSection(x, flag, isShared) {
    if (flag) {
      x.expanded = !x.expanded;
      this.viewSection = x.expanded ? x : null;
      this.cs.callFunction({ event: MYFILES_CS_EVENTS.CB_SECTION, nSectionid: x.nSectionid, isSection: flag, isShared });
    } else {
      this.viewSection = x;
      this.cs.callFunction({ event: MYFILES_CS_EVENTS.CB_SECTION, nSectionid: x.nSectionid, isSection: flag, isShared });
    }
  }
  getBundleList(node) {
    return __async(this, null, function* () {
      try {
        const mdl = this.buildBundleListRequest(node);
        const res = yield this.fetchBundleList(mdl);
        this.applyBundleListResult(node, mdl, res);
        this.afterBundleListLoaded(res);
        this.cdr.detectChanges();
      } catch (error) {
        throw new Error(`Error fetching bundle list: ${ErrorHandlerUtil.getErrorMessage(error)}`);
      } finally {
        this.treeDataChange();
        this.viewport?.checkViewportSize();
        this.changeFolder.emit({ event: MYFILES_CHANGEFOLDER_EVENTS.SELECTED, data: {} });
      }
    });
  }
  buildBundleListRequest(node) {
    if (!this.hs.isGlobalSearch) {
      this.hs.jFilter.cSearch = "";
    }
    const mdl = {
      nSectionid: this.nSectionid,
      nBundleid: node?.nBundleid ?? null,
      pageNumber: 1
    };
    if (this.hs.isGlobalSearch && !["CB", "CO"].includes(this.cFoldertype) && !this.assignPopup && ["I", "M"].includes(this.hs.jFilter?.cWithin)) {
      mdl.jElasticBundles = JSON.stringify(this.searchedBundles || []);
    }
    return mdl;
  }
  fetchBundleList(mdl) {
    return __async(this, null, function* () {
      this.folderLoader(true);
      try {
        return yield this.myfileS.bundleList(mdl);
      } finally {
        this.folderLoader(false);
      }
    });
  }
  applyBundleListResult(node, mdl, res) {
    if (mdl.nBundleid && node) {
      this.applyChildBundleList(node, mdl, res);
      return;
    }
    this.applyRootBundleList(node, res);
  }
  applyChildBundleList(node, mdl, res) {
    const ind = this.TREE_DATA.findIndex((e) => e.nBundleid == mdl.nBundleid);
    const nextLevel = Number.parseInt(String(node["level"]), 10) + 1;
    res.forEach((e) => {
      e["level"] = nextLevel;
      e["expandable"] = false;
      e["cIscheck"] = node["cIscheck"];
    });
    const hasExistingChildren = this.TREE_DATA.some((e) => e.nBundleid && e.nParentBundleid == node.nBundleid);
    if (!hasExistingChildren) {
      const isNewRowPresent = this.TREE_DATA.some((e) => !e.nBundleid && e.nParentBundleid == node.nBundleid && e.isNew);
      const insertOffset = isNewRowPresent ? 1 : 0;
      this.TREE_DATA = [
        ...this.TREE_DATA.slice(0, ind + 1 + insertOffset),
        ...res,
        ...this.TREE_DATA.slice(ind + 1 + insertOffset)
      ];
      this.treeDataChange();
      node.isExpanded = true;
      this.applySelectedFolderChecks();
      this.dataSource.next(this.TREE_DATA);
    }
    this.selectedFolder(node);
    node.islodingchildren = false;
  }
  applyRootBundleList(node, res) {
    res.forEach((e) => {
      e["level"] = 0;
      e["expandable"] = false;
    });
    this.TREE_DATA = res;
    if (!node) {
      this.isEmptyevent.emit(this.TREE_DATA.length || this.sharedByuser.length ? 1 : 0);
    }
    this.applySelectedFolderChecks();
    this.dataSource.next([...this.TREE_DATA]);
  }
  afterBundleListLoaded(res) {
    this.bundleSelection();
    if (res.length) {
      this.changeFolder.emit({ event: MYFILES_CHANGEFOLDER_EVENTS.GET_BUNDLE_LIST, data: {} });
    }
    this.loading = false;
    this.viewport?.checkViewportSize();
  }
  loadChildren(node, flag) {
    this.cs.callFunction({ event: MYFILES_CS_EVENTS.UPDATE_SECTION, nSectionid: this.nSectionid });
    if (this.isCutCopyBlocked(node))
      return;
    if (node?.islodingchildren)
      return;
    this.collapseSiblingNodes(node);
    if (node?.isExpanded) {
      node.islodingchildren = false;
      if (flag && this.activeBundle == node) {
        this.closeExpandedNode(node);
        this.cdr.detectChanges();
      } else {
        this.activeBundle = node;
        this.collapseChildrenForParentBundleId(node.nBundleid);
        this.treeDataChange();
        this.dataSource.next([...this.TREE_DATA]);
        this.selectedFolder(node);
      }
      this.changeFolder.emit({ event: MYFILES_CHANGEFOLDER_EVENTS.SELECTED, data: { node }, action: "open" });
      this.viewport?.checkViewportSize();
      return;
    }
    if (node) {
      node.isExpanded = true;
      node.islodingchildren = true;
      this.activeBundle = node;
      this.getBundleList(node);
      this.viewport?.checkViewportSize();
      return;
    }
    this.activeBundle = null;
    this.collapseChildrenForParentBundleId(null);
    this.treeDataChange();
    this.dataSource.next([...this.TREE_DATA]);
    this.selectedFolder(null);
    this.changeFolder.emit({ event: MYFILES_CHANGEFOLDER_EVENTS.SELECTED, data: { node }, action: "open" });
    this.viewport?.checkViewportSize();
  }
  isCutCopyBlocked(node) {
    if (!node?.nBundleid)
      return false;
    if (!this.checkCopy() || this.cutCopyType !== "Cut")
      return false;
    const selectedIds = this.nSelectedFolderid.map((e) => e.id);
    return selectedIds.includes(node.nBundleid);
  }
  collapseSiblingNodes(node) {
    const parentIds = Array.isArray(node?.nParentBundleid) ? node?.nParentBundleid : [node?.nParentBundleid];
    const siblings = this.TREE_DATA.filter((e) => e.nBundleid !== node?.nBundleid && parentIds.includes(e.nParentBundleid));
    siblings.forEach((e) => e.isExpanded = false);
    siblings.forEach((e) => {
      this.TREE_DATA = this.removeDescendants(this.TREE_DATA, e.nBundleid);
    });
  }
  closeExpandedNode(node) {
    node.isExpanded = false;
    this.TREE_DATA = this.removeDescendants(this.TREE_DATA, node.nBundleid);
    this.treeDataChange();
    this.dataSource.next(this.TREE_DATA);
    if (node.level > 0) {
      const parentNode = this.TREE_DATA.find((parent) => node.nParentBundleid === parent.nBundleid);
      this.activeBundle = node;
      this.selectedFolder(parentNode);
      return;
    }
    this.activeBundle = null;
    this.selectedFolder(null);
  }
  refreshNode(nBundleid) {
    const node = this.TREE_DATA.find((e) => e.nBundleid == nBundleid);
    if (node) {
      if (node["isExpanded"]) {
        this.TREE_DATA = this.removeDescendants(this.TREE_DATA, node.nBundleid);
        this.treeDataChange();
        this.dataSource.next([...this.TREE_DATA]);
        this.getBundleList(node);
      }
    } else {
      this.getBundleList(null);
    }
    this.cdr.detectChanges();
  }
  removeDescendants(treeData, nodeId) {
    if (!nodeId)
      return treeData.filter((e) => e.nBundleid);
    const startIndex = treeData.findIndex((node) => node.nParentBundleid === nodeId);
    if (startIndex === -1) {
      return treeData;
    }
    let endIndex = treeData.length;
    for (let i = startIndex + 1; i < treeData.length; i++) {
      if (treeData[i].level < treeData[startIndex].level) {
        endIndex = i;
        break;
      }
    }
    return [...treeData.slice(0, startIndex), ...treeData.slice(endIndex)];
  }
  selectedFolder(node) {
    const brdcrumb = {
      brdcrumb: node ? this.getNodePath(node).map((e) => ({ nBundleid: e.nBundleid, cBundlename: e.cBundlename })) : []
    };
    this.changeFolder.emit(brdcrumb);
  }
  getNodePath(node) {
    const path = [node];
    let currentNode = node;
    if (currentNode.nParentBundleid) {
      while (currentNode) {
        const parent = this.TREE_DATA.filter((e) => e.nBundleid).find((parent2) => currentNode.level > parent2.level && currentNode.nParentBundleid === parent2.nBundleid);
        if (parent) {
          path.unshift(parent);
          currentNode = parent;
        } else {
          break;
        }
      }
    }
    return path;
  }
  getParentNode(node) {
    const nodeIndex = this.TREE_DATA.indexOf(node);
    for (let i = nodeIndex - 1; i >= 0; i--) {
      if (this.TREE_DATA[i].level === node.level - 1) {
        return this.TREE_DATA[i];
      }
    }
    return null;
  }
  shouldRender(node) {
    let parent = this.getParentNode(node);
    while (parent) {
      if (!parent.isExpanded) {
        return false;
      }
      parent = this.getParentNode(parent);
    }
    return true;
  }
  onDragStart(event, item) {
    this.myfileS.isfolderdraging = true;
    const path = this.getNodePath(item).map((e) => e.cBundlename);
    const draggedItem = { id: item.nBundleid, path, isactive: "" };
    event.dataTransfer?.setData("text", JSON.stringify(draggedItem));
  }
  openfolderuncheck(node, event) {
    this.loadChildren(node, true);
    this.TREE_DATA.forEach((e) => e["cIstempcheck"] = false);
    this.treeDataChange();
    node.cIstempcheck = event.checked;
    this.cdr.detectChanges();
  }
  onDragEnd() {
    this.myfileS.isfolderdraging = false;
  }
  checkFolder(node, event) {
    if (!event.checked && this.selectedBundles?.includes(node.nBundleid)) {
      this.selectedBundles.splice(this.selectedBundles.indexOf(node.nBundleid), 1);
    }
    if (!event.checked && this.nSelectedFolderid?.some((e) => e.id == node.nBundleid)) {
      this.nSelectedFolderid.splice(this.nSelectedFolderid.findIndex((e) => e.id == node.nBundleid), 1);
    }
    if (event.checked && this.checkCopy()) {
      this.TREE_DATA.forEach((e) => e["cIscheck"] = false);
      this.treeDataChange();
      node.cIscheck = event.checked;
      this.changeFolder.emit({ event: MYFILES_CHANGEFOLDER_EVENTS.SELECTED, data: node, action: "check" });
      return;
    }
    node.cIscheck = event.checked;
    this.selectAllChildern(node, event);
    this.changeFolder.emit({ event: MYFILES_CHANGEFOLDER_EVENTS.SELECTED, data: node, action: "check" });
    if (node.nParentBundleid && !event.checked) {
      const parentNode = this.TREE_DATA.find((e) => e.nBundleid == node.nParentBundleid);
      if (parentNode) {
        parentNode["cIscheck"] = false;
      }
    }
  }
  selectAllChildern(node, event) {
    const startIndex = this.TREE_DATA.findIndex((data) => data.nParentBundleid === node.nBundleid);
    if (startIndex === -1) {
      return;
    }
    let endIndex = this.TREE_DATA.length;
    for (let i = startIndex + 1; i < this.TREE_DATA.length; i++) {
      if (this.TREE_DATA[i].level < this.TREE_DATA[startIndex].level) {
        endIndex = i;
        break;
      }
    }
    for (let i = startIndex; i < endIndex; i++) {
      this.TREE_DATA[i]["cIscheck"] = event.checked;
    }
    this.treeDataChange();
  }
  addBundleEdit(node, event) {
    node.isedit = !node.isedit;
  }
  addNewBundle(node) {
    return __async(this, null, function* () {
      const newnode = {
        nBundleid: null,
        nParentBundleid: node ? node.nBundleid : null,
        cBundlename: "New Folder",
        cBundletag: "",
        level: node ? Number.parseInt(String(node.level), 10) + 1 : 0,
        isExpanded: false,
        isedit: true,
        isNew: true
      };
      if (this.TREE_DATA.length === 0) {
        this.isEmptyevent.emit(1);
      }
      if (node) {
        const hasDraftChild = this.TREE_DATA.some((e) => e.nParentBundleid == node.nBundleid && e.nBundleid == null);
        if (hasDraftChild) {
          return;
        }
      } else {
        const hasRootDraft = this.TREE_DATA.some((e) => e.nBundleid == null);
        if (hasRootDraft) {
          return;
        }
      }
      if (node) {
        const ind = this.TREE_DATA.findIndex((e) => e.nBundleid == node.nBundleid);
        const updatedTreeData = [
          ...this.TREE_DATA.slice(0, ind + 1),
          newnode,
          ...this.TREE_DATA.slice(ind + 1)
        ];
        node.isExpanded = true;
        this.TREE_DATA = updatedTreeData;
        this.treeDataChange();
        this.dataSource.next(updatedTreeData);
        this.activeBundle = node;
        this.getBundleList(node);
      } else {
        const updatedTreeData = [newnode, ...this.TREE_DATA];
        this.TREE_DATA = updatedTreeData;
        this.treeDataChange();
        this.dataSource.next(updatedTreeData);
      }
      this.cdr.detectChanges();
    });
  }
  createNewFolder(node, event) {
    return __async(this, null, function* () {
      if (node.submit)
        return;
      node.submit = true;
      const trimmedName = String(event?.value ?? "").trim();
      const hasName = trimmedName.length > 0;
      const cBundlename = hasName ? trimmedName : "New folder";
      if (node.isNew && hasName === false) {
        this.removeNodeFromTree(node);
        node.submit = false;
        this.refreshTree();
        return;
      }
      if (hasName === false) {
        node.isedit = false;
        node.submit = false;
        return;
      }
      const mdl = {
        nBundleid: node.isNew ? 0 : node.nBundleid,
        nParentBundleid: node.nParentBundleid || null,
        nCaseid: this.nCaseid,
        nSectionid: this.nSectionid || null,
        cBundlename,
        permission: node.isNew ? "N" : "E"
      };
      if (node.isNew) {
        const res2 = yield this.myfileS.bundleBuilder(mdl);
        if (res2.msg == 1) {
          this.updateNode(node, trimmedName, res2.nBundleid);
        }
        node.submit = false;
        this.refreshTree();
        return;
      }
      const existingName = String(node.cBundlename ?? "").trim();
      if (cBundlename === existingName) {
        this.finalizeNode(node);
        node.submit = false;
        this.refreshTree();
        return;
      }
      const res = yield this.myfileS.bundleBuilder(mdl);
      if (res.msg == 1) {
        this.updateNode(node, trimmedName, node.nBundleid);
      }
      node.submit = false;
      this.refreshTree();
    });
  }
  edittag(node) {
    const dialogRef = this.dialog.open(UpdateBundletagComponent, {
      width: "400px",
      height: "240px",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: {
        cBundletag: node.cBundletag,
        cName: node.cBundlename
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.createBundleRef(node, { value: result.cBundletag }, result.isAuto);
      }
    });
  }
  pagination(node) {
    const dialogRef = this.dialog.open(PaginationComponent, {
      width: "fit-content",
      height: "fit-content",
      maxHeight: "99vh",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: { nBundleid: node.nBundleid, nSectionid: this.nSectionid }
    });
    dialogRef.afterClosed().subscribe((result) => __async(this, null, function* () {
      if (result) {
        setTimeout(() => __async(this, null, function* () {
          let res = yield this.paginationS.getPaginationData(this.nCaseid);
          if (res?.[0]?.["msg"] == 1) {
            this.cf.paginationdata = res[0];
            if (this.cf.paginationdata.total_prog > this.cf.paginationdata.comp_progres) {
              this.cf.isPagination = true;
              this.cf.paginationIDs = this.cf.paginationdata.jIds;
            }
          }
        }), 500);
      }
    }));
  }
  createBundleRef(node, event, bisAutoassign) {
    return __async(this, null, function* () {
      if (node.submit)
        return;
      node.submit = true;
      const trimmedName = event.value.trim();
      const cBundletag = trimmedName || "New folder";
      if (!trimmedName) {
        node.submit = false;
        return;
      }
      const mdl = {
        nBundleid: node.nBundleid,
        cBundletag,
        bisAutoassign
      };
      const res = yield this.myfileS.updateTag(mdl);
      if (res) {
        node.cBundletag = cBundletag;
        this.cs.callFunction({ type: MYFILES_CS_TYPES.UPDATE_BUNDLETAG, nBundleid: node.nBundleid, cBundlename: node.cBundletag });
        this.finalizeNode(node);
      }
      node.submit = false;
      this.refreshTree();
    });
  }
  updateNode(node, newName, bundleId) {
    node.cBundlename = newName;
    node.nBundleid = bundleId;
    this.cs.callFunction({ type: MYFILES_CS_TYPES.UPDATE_FOLDER, nBundleid: bundleId, cBundlename: newName });
    this.finalizeNode(node);
  }
  finalizeNode(node) {
    node.isedit = false;
    node.isNew = false;
  }
  removeNodeFromTree(node) {
    const ind = this.TREE_DATA.findIndex((e) => e.nBundleid === node.nBundleid);
    if (ind > -1) {
      this.TREE_DATA = [...this.TREE_DATA.slice(0, ind), ...this.TREE_DATA.slice(ind + 1)];
      this.treeDataChange();
    }
  }
  refreshTree() {
    this.dataSource.next(this.TREE_DATA);
    this.cdr.detectChanges();
  }
  getBundleNode(nBundleid) {
    const resnode = this.dataSource["_value"].find((node) => node.nBundleid == nBundleid);
    return resnode || null;
  }
  checkCopy() {
    if (this.cutCopyType && this.cutCopyType.toLocaleUpperCase() != MYFILES_CUT_COPY_TYPES.DOWNLOAD) {
      return true;
    }
    return false;
  }
  getcheckedFolder() {
    const expandedNodes = [];
    this.TREE_DATA.forEach((node) => {
      if (node["cIscheck"]) {
        expandedNodes.push(node);
      }
    });
    this.treeDataChange();
    return expandedNodes;
  }
  addSection(x) {
    return __async(this, null, function* () {
      if (!this.isadmin) {
        x["type"] = "ACTIVE-SECTION";
        this.cs.callFunction(x);
      }
    });
  }
  closeMenu() {
    return __async(this, null, function* () {
      this.changeFolder.emit(MYFILES_CHANGEFOLDER_EVENTS.SUBMIT);
      this.menuTrigger.closeMenu();
    });
  }
  changeSharebundle(event) {
    this.changeFolder.emit(event);
  }
  getPermission(nBundleid) {
    const dialogRef = this.dialog.open(PermissionComponent, {
      width: "400px",
      height: "80vh",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: {
        nBundleid,
        nBundledetailid: null,
        nCaseid: this.nCaseid
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }
  getShare(nBundleid) {
    const dialogRef = this.dialog.open(SharewithteamComponent, {
      width: "400px",
      height: "fit-content",
      maxHeight: "80vh",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: {
        nBundleid,
        nBundledetailid: null,
        nCaseid: this.nCaseid,
        nSectionid: this.nSectionid
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.shareteam.getUserlist();
    });
  }
  getBundlePath(nBundleid) {
    return __async(this, null, function* () {
      const res = yield this.myfileS.getBundleparentIds(nBundleid ?? null, this.nSectionid, this.detail?.nUPid ?? null);
      this.detail.nUPid = null;
      if (nBundleid > 0) {
        this.loadTree(nBundleid, res, 0);
      } else {
        this.loadChildren(null, true);
      }
      if (res?.[0]?.["nBundledetailids"]?.length) {
        this.cs.callFunction({ event: MYFILES_CS_EVENTS.SELECT_FILE, nBundledetailids: res[0]["nBundledetailids"] });
      }
    });
  }
  loadTree(nBundleid, res, bind) {
    if (res.length) {
      const ind = this.TREE_DATA.findIndex((e) => e.nBundleid == res[bind].nBundleid);
      if (!this.TREE_DATA.filter((e) => e.nBundleid && e.nParentBundleid == res[bind].nBundleid).length) {
        res.forEach((e) => e.isExpanded = true);
        const isnew = this.TREE_DATA.some((e) => !e.nBundleid && e.nParentBundleid == res[bind].nBundleid && e.isNew);
        const res1 = res.filter((element, index) => index > bind);
        const updatedTreeData = [
          ...this.TREE_DATA.slice(0, ind + 1 + (isnew ? 1 : 0)),
          ...res1,
          ...this.TREE_DATA.slice(ind + 1 + (isnew ? 1 : 0))
        ];
        this.TREE_DATA = updatedTreeData;
        this.treeDataChange();
        this.dataSource.next(updatedTreeData);
        this.viewport?.checkViewportSize();
      } else if (res.length != bind - 1) {
        this.TREE_DATA[ind].isExpanded = true;
        this.treeDataChange();
        this.loadTree(nBundleid, res, bind + 1);
        this.viewport?.checkViewportSize();
        return;
      }
      let node = this.getBundleNode(nBundleid);
      this.selectedFolder(node);
      node.islodingchildren = false;
    }
  }
  getUploadDetail() {
    return __async(this, null, function* () {
      const res = yield this.myfileS.fetchUploadDetail(this.detail.nUPid, this.nCaseid);
      if (res?.length) {
        const bundleId = res?.[0]?.nBundleid ?? null;
        const node = this.getBundleNode(bundleId);
        if (node) {
          this.loadChildren(node);
        }
        this.getBundlePath(bundleId);
      }
    });
  }
  getSharedBundles() {
    return __async(this, null, function* () {
      const res = yield this.myfileS.getSharedBundlesUsers(this.nSectionid);
      this.sharedByuser = res ?? [];
      this.isEmptyevent.emit(this.TREE_DATA.length || this.sharedByuser.length ? 1 : 0);
      this.cdr.detectChanges();
    });
  }
  checkdusers(ev) {
    this.checkedusers = ev;
    this.cdr.detectChanges();
  }
  getusers() {
    if (this.shareteam) {
      this.shareteam.getUserlist();
    }
  }
  shareEvent(ev, id) {
    if (ev.event === MYFILES_TOOL_EVENTS.ICON_CLICK) {
      this.getShare(id);
    }
  }
  convert(node) {
    const dialogRef = this.dialog.open(ConvertFolderComponent, {
      width: "400px",
      height: "fit-content",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: {
        nBundleid: node.nBundleid,
        cName: node.cBundlename,
        nSectionid: this.nSectionid
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.isSave) {
        this.convertFiles(result);
      }
    });
  }
  convertFiles(result) {
    return __async(this, null, function* () {
      const mdl = { jBids: result.jBids, jBDids: result.jBDids, jFtypes: result.jFtypes, nCaseid: this.nCaseid, nSectionid: this.nSectionid, bMetadata: result.bMetadata, cConvertType: result.cConvertType };
      yield this.myfileS.convertFile_multi(mdl);
    });
  }
  hyperlink(node) {
    const dialogRef = this.dialog.open(HyperLinkFolderComponent, {
      width: "596px",
      height: "fit-content",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: {
        cName: node.cBundlename
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.hyperlinkService.startHyperlink(this.nCaseid, this.nSectionid, node.nBundleid, null, result?.linkType, false, result?.type, result.isDeep);
      }
    });
  }
  handleMenuOpened(node, flag) {
    if (this.activeBundle?.nBundleid != node.nBundleid) {
      this.loadChildren(node, flag);
    }
    this.getusers();
  }
  folderLoader(val) {
    this.isFolderLoading = val;
    this.isFolderLoadingChange?.emit(val);
  }
  getMetaBundles(jFilter) {
    return __async(this, null, function* () {
      try {
        this.clearSearchBundle();
        this.searchedBundles = [];
        this.searchedBundlesChange?.emit(this.searchedBundles);
        jFilter = Object.assign(jFilter, { fileFilter: this.jfileFilter || [] });
        const mdl = {
          nSectionid: this.nSectionid,
          nBundleid: jFilter.nOBundleid,
          //jFilter?.cLocation == 'A' && this.hs.isGlobalSearch && (jFilter?.cSearch).trim() != '' ? 0 : (this.nBundleid ? this.nBundleid : 0),
          nCaseid: this.nCaseid,
          cSearch: jFilter?.cSearch,
          searchName: jFilter?.cMatchCase,
          contentType: jFilter?.contentType,
          jFilter: JSON.stringify(jFilter)
          //{ ...jFilter, nBundleid: jFilter?.nOBundleid }
        };
        const res = yield this.myfileS.searchedBundles(mdl);
        if (res?.length) {
          this.searchedBundles = res.map((a) => a.nBundleid);
          this.searchedBundlesChange?.emit(this.searchedBundles);
        }
        this.getBundleList(null);
        this.cdr.detectChanges();
      } catch (error) {
        throw new Error(`getMetaBundles failed: ${ErrorHandlerUtil.getErrorMessage(error)}`);
      }
    });
  }
  treeDataChange() {
    this.TREE_DATAChange?.emit(this.TREE_DATA);
  }
  getFileList(pageNumber, cFiletype, isForcely) {
    return __async(this, null, function* () {
      try {
        const requestToken = ++this.currentSearchToken;
        const mdl = {
          nSectionid: this.nSectionid,
          nBundleid: null,
          pageNumber,
          cSearch: "",
          cFiletype: cFiletype ?? "ALL",
          cSortby: "cTab",
          cSorttype: "ASC"
        };
        if (!pageNumber || pageNumber === 1)
          this.fileList = [];
        const res = yield this.myfileS.bundleDetailList(mdl);
        if (requestToken !== this.currentSearchToken) {
          throw new Error("Ignoring outdated response");
        }
        if (pageNumber === 1) {
          this.fileList = res;
        } else {
          this.fileList = [...this.fileList, ...res];
        }
        this.cdr.detectChanges();
      } catch (error) {
        this.loading = false;
        this.viewport?.checkViewportSize();
        this.isEmptyevent.emit(this.fileList.length);
        throw new Error(`getFileList failed: ${ErrorHandlerUtil.getErrorMessage(error)}`);
      }
    });
  }
  viewFileDB(item) {
    if (this.isLink) {
      return;
    }
    const firstPageToken = item?.cPageRange?.split("-")?.[0];
    const parsedPage = Number.parseInt(firstPageToken ?? "1", 10);
    const nPage = Number.isFinite(parsedPage) ? parsedPage : 1;
    if (this.presentDocType) {
      this.changeFolder.emit({ event: MYFILES_CHANGEFOLDER_EVENTS.OPEN_FILE, data: { item, nPage } });
      return;
    }
    this.cf.openHyperLinkFile(item.nBundledetailid, this.nCaseid, null, null, item.cIsindex, nPage);
  }
  static {
    this.\u0275fac = function FoldersComponent_Factory(t) {
      return new (t || _FoldersComponent)(\u0275\u0275directiveInject(MyfileService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(PaginationService), \u0275\u0275directiveInject(HyperlinkService), \u0275\u0275directiveInject(HeaderService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FoldersComponent, selectors: [["folders"]], viewQuery: function FoldersComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(CdkVirtualScrollViewport, 5);
        \u0275\u0275viewQuery(_c03, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.viewport = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.shareteam = _t.first);
      }
    }, inputs: { menuTrigger: "menuTrigger", isSepcomponent: "isSepcomponent", OnlyFolders: "OnlyFolders", assignPopup: "assignPopup", nSectionid: "nSectionid", cFoldertype: "cFoldertype", nCaseid: "nCaseid", isadmin: "isadmin", nBundleid: "nBundleid", changeF: "changeF", cutCopyType: "cutCopyType", Allsectionlist: "Allsectionlist", isIndividual: "isIndividual", selectedIDs: "selectedIDs", detail: "detail", onFileEvent: "onFileEvent", isLink: "isLink", userAdmin: "userAdmin", isMeexpand: "isMeexpand", TREE_DATA: "TREE_DATA", LAST_TREE_DATA_STAT: "LAST_TREE_DATA_STAT", selectedBundles: "selectedBundles", nSelectedFolderid: "nSelectedFolderid", presentDocType: "presentDocType", searchedBundles: "searchedBundles", isFolderLoading: "isFolderLoading", isPreview: "isPreview", allSectionViewPort: "allSectionViewPort", allSectionEvent: "allSectionEvent", activeSection: "activeSection" }, outputs: { changeFolder: "changeFolder", changeSectionAll: "changeSectionAll", getSelection: "getSelection", isEmptyevent: "isEmptyevent", TREE_DATAChange: "TREE_DATAChange", LAST_TREE_DATA_STATChange: "LAST_TREE_DATA_STATChange", searchedBundlesChange: "searchedBundlesChange", isFolderLoadingChange: "isFolderLoadingChange", isPreviewChange: "isPreviewChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 4, vars: 3, consts: [["folderCom", ""], ["isIndividualPlaceholder", ""], ["normalFolderCheckbox", ""], ["o", "matMenuTrigger"], ["menu", "matMenu"], ["class", "w-full folderscroll", 3, "ngClass", 4, "ngIf"], [1, "px-3", "my-3"], [4, "ngIf"], ["class", "h-[calc(100%_-_50px)] w-full folderscroll overflow-auto", 4, "ngIf"], [1, "w-full", "folderscroll", 3, "ngClass"], ["itemSize", "48", 1, "h-[99%]", "w-[calc(100%_+_14px)]"], [3, "hidden"], [1, "flex", "gap-2.5"], [4, "ngFor", "ngForOf"], ["class", "relative flex flex-col items-center min-w-full overflow-visible bg-white cursor-pointer mat-tree-node group min-h-10 text-grey w-fit first:mt-0", "style", "flex-grow: 1;", 3, "ngClass", "click", "keydown.enter", "keydown.space", 4, "cdkVirtualFor", "cdkVirtualForOf"], ["class", "flex items-center gap-3 mb-2 bg-white rounded-base ps-10", "style", "height:40px;", 4, "ngFor", "ngForOf"], [1, "flex", "items-center", "gap-3", "mb-2", "bg-white", "rounded-base", "ps-10", 2, "height", "40px"], ["name", "chvy", 1, "text-gray-300", "rotate-180", "text-xxs"], ["name", "folder", 1, "text-gray-300"], ["bg", "base", "height", "12px", "width", "130px"], ["type", "button", 1, "w-full", "h-full", "bg-white", "rounded-md", "mt-2.5", "p-0", "border-0", "text-left", 3, "click"], [1, "relative", "z-20", "flex", "items-center", "w-full", "h-full", "gap-5", "px-2", "min-w-44", "min-h-10", "cursor-pointer"], ["disabled", "", 1, "invisible"], [1, "flex", "items-center", "gap-5", "w-[calc(100%_-_30px)]", "h-full"], ["xmlns", "http://www.w3.org/2000/svg", "width", "6", "height", "10", "fill", "none", "viewBox", "0 0 6 10", 2, "min-width", "6px"], ["fill", "currentColor", "stroke", "currentColor", "d", "M.57.84.55.83a.2.2 0 0 1 0-.28.18.18 0 0 1 .25 0l3.83 3.91a.2.2 0 0 1 0 .28L.81 8.64a.18.18 0 0 1-.25 0 .2.2 0 0 1 0-.27v-.01l3.15-3.42.31-.34-.31-.34L.57.84Z"], [1, "flex", "items-center", "gap-2", "h-full", "w-[calc(100%_-_30px)]"], ["xmlns", "http://www.w3.org/2000/svg", "width", "18", "height", "14", "fill", "none", "viewBox", "0 0 18 14", 1, "text-grey", 2, "min-width", "18px"], ["fill", "currentColor", "fill-rule", "evenodd", "d", "M6.41 1.878h7.268c.836 0 1.516.68 1.516 1.516.008 3.554-.003 5.546.005 9.1l-.38 1.04a.45.45 0 0 1-.05.101c-.261.38-.57.365-1.091.365H1.548C.71 14 .03 13.32.03 12.485V1.878C.03 1.043.71.363 1.547.363H4.58a.756.756 0 0 1 .536.222L6.41 1.878ZM1.736 12.312V3.69h11.61v8.622H1.736Z", "clip-rule", "evenodd"], ["fill", "currentColor", "d", "M3.619 6.558A.91.91 0 0 1 4.459 6h12.163a.91.91 0 0 1 .838 1.267l-2.555 6.017H2.167a.91.91 0 0 1-.84-1.263l2.292-5.463Z", 1, "foldersvg", 3, "ngClass"], [1, "block", "text-xs", "font-semibold", "truncate", "mat-mdc-tooltip-trigger", "whitespace-nowrap", "foldername", "ng-star-inserted"], ["type", "button", 1, "w-full", "h-full", "bg-white", "rounded-md", "text-left", "border-0", 2, "padding-left", "28px", 3, "click", "ngClass"], [1, "relative", "z-20", "flex", "items-center", "w-full", "h-full", "gap-5", "px-2", "min-w-44", "min-h-10"], [3, "click", "keydown.enter", "keydown.space", "changeFolder", "isIndividual", "nSectionid", "nUserid", "nCaseid", "nBundleid", "changeF"], ["type", "button", 1, "w-full", "h-10", "min-w-40", "rounded-base", "bg-white", "flex", "px-2.5", "text-xs", "items-center", "gap-2.5", "ps-12", "font-semibold", "cursor-pointer", "text-left", "border-0", 3, "click"], ["width", "16", 1, "object-contain", 3, "src"], [1, "block", "w-full", "h-4", "relative", 3, "value"], [1, "relative", "flex", "flex-col", "items-center", "min-w-full", "overflow-visible", "bg-white", "cursor-pointer", "mat-tree-node", "group", "min-h-10", "text-grey", "w-fit", "first:mt-0", 2, "flex-grow", "1", 3, "click", "keydown.enter", "keydown.space", "ngClass"], [1, "w-full", "h-full", 3, "ngClass", "ngStyle"], [4, "ngIf", "ngIfElse"], ["type", "button", 1, "flex", "items-center", "gap-5", "w-[calc(100%_-_30px)]", "h-full", "bg-transparent", "text-left", "border-0", 3, "click", "dragstart", "dragend", "draggable", "ngClass"], ["xmlns", "http://www.w3.org/2000/svg", "width", "6", "height", "10", "fill", "none", "viewBox", "0 0 6 10", 2, "min-width", "6px", 3, "ngClass"], ["xmlns", "http://www.w3.org/2000/svg", "width", "18", "height", "14", "fill", "none", "viewBox", "0 0 18 14", 1, "text-grey", 2, "min-width", "18px", 3, "ngClass"], ["truncateTooltip", "", "class", "block text-xs font-semibold truncate whitespace-nowrap foldername", 3, "tooltipText", "ngClass", 4, "ngIf"], [1, "opacity-0", "group-hover:opacity-100", "[.mat-mdc-checkbox-checked]:!opacity-100", 3, "ngModelChange", "change", "disabled", "ngClass", "ngModel"], [1, "opacity-0", "group-hover:opacity-100", "[.mat-mdc-checkbox-checked]:!opacity-100", 3, "change", "disabled", "ngClass", "checked"], ["truncateTooltip", "", 1, "block", "text-xs", "font-semibold", "truncate", "whitespace-nowrap", "foldername", 3, "tooltipText", "ngClass"], [1, "block", "w-full", 3, "keyup.enter", "focusout", "placeholder", "focus", "showlabel", "inlinemode", "value"], [1, "ms-auto", "gap-3", "mx-2.5", "absolute", "right-1", "hidden", "group-hover:flex", "items-center"], [1, "px-2", "py-0", "rotate-90", "cursor-pointer", "group/icon"], ["name", "menu", 1, "text-xs", "group-hover/icon:text-blue-on", 3, "menuOpened", "matMenuTriggerFor"], [1, "flex", "px-4", "!rounded-base", "!w-fit", "-mt-6", "!bg-dark-blue", "h-[50px]", "items-center"], [1, "flex", "items-center", "gap-5", "py-1", "min-w-fit"], ["name", "edit", "type", "comnicn", 1, "text-xs", "text-white", "cursor-pointer", "hover:text-blue-on", 3, "click", "keydown.enter", "keydown.space", "matTooltip"], ["name", "addfolder", "type", "adminicn", 1, "text-white", "cursor-pointer", "hover:text-blue-on", 3, "click", "keydown.enter", "keydown.space", "matTooltip"], [3, "click", "keydown.enter", "keydown.space", "checkevent", "shareEvent", "activeuser", "nCaseid", "nSectionid", "nBundleid"], ["name", "userfill", 1, "text-white", "cursor-pointer", "hover:text-blue-on", 3, "click", "keydown.enter", "keydown.space", "matTooltip"], ["name", "bundle", 1, "text-xs", "text-white", "cursor-pointer", "hover:text-blue-on", 3, "click", "keydown.enter", "keydown.space", "matTooltip"], ["name", "hyperlink", "type", "adminicn", 1, "text-xs", "text-white", "cursor-pointer", "hover:text-blue-on", 3, "click", "keydown.enter", "keydown.space", "matTooltip"], ["xmlns", "http://www.w3.org/2000/svg", "width", "14", "height", "14", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "1.3", "stroke-linecap", "round", "stroke-linejoin", "round", 1, "text-xs", "text-white", "cursor-pointer", "hover:text-blue-on", 3, "click", "keydown.enter", "keydown.space", "matTooltip"], ["d", "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"], ["d", "M14 2v4a2 2 0 0 0 2 2h4"], ["width", "4", "height", "6", "x", "2", "y", "12", "rx", "2"], ["d", "M10 12h2v6"], ["d", "M10 18h4"], ["name", "convert", "type", "extra", 1, "text-white", "cursor-pointer", "hover:text-blue-on", 3, "click", "keydown.enter", "keydown.space", "matTooltip"], [1, "z-20", "flex", "flex-col", "w-full", "bg-white", 3, "ngStyle"], ["class", "flex items-center gap-3 bg-white rounded-base ps-11", "style", "height:40px;", 4, "ngFor", "ngForOf"], [1, "flex", "items-center", "gap-3", "bg-white", "rounded-base", "ps-11", 2, "height", "40px"], [1, "ms-auto", "w-fit", 3, "click", "keydown.enter", "keydown.space", "disabled"], [1, "h-[calc(100%_-_50px)]", "w-full", "folderscroll", "overflow-auto"], ["class", "relative flex flex-col items-center min-w-full mb-2 overflow-visible bg-white cursor-pointer mat-tree-node group min-h-10 text-grey w-fit first:mt-0 rounded-base", "style", "flex-grow: 1;", 3, "ngClass", 4, "ngFor", "ngForOf"], [1, "relative", "flex", "flex-col", "items-center", "min-w-full", "mb-2", "overflow-visible", "bg-white", "cursor-pointer", "mat-tree-node", "group", "min-h-10", "text-grey", "w-fit", "first:mt-0", "rounded-base", 2, "flex-grow", "1", 3, "ngClass"], [1, "w-full", "h-full", 3, "ngClass"], ["type", "button", 1, "flex", "items-center", "w-full", "h-full", "gap-5", "bg-transparent", "text-left", "border-0", 3, "click", "ngClass"], [1, "flex", "items-center", "w-full", "h-full", "gap-2"], [1, "flex", "items-center", "gap-2.5", "px-3", "w-full", "py-1.5"], [1, "text-xs", 3, "ngClass"], ["class", "d-flex button onhover end-0 me-1 position-absolute", 4, "ngIf"], ["name", "bundle"], ["name", "custombundle", "type", "myfileicn"], ["name", "transcript", "type", "myfileicn"], ["name", "userfiles", "type", "myfileicn"], ["mode", "outlined", 3, "square", "click", "keydown.enter", "keydown.space", 4, "ngIf"], ["mode", "outlined", 3, "click", "keydown.enter", "keydown.space", "square"], ["name", "addcircle", 1, "text-base"], [1, "d-flex", "button", "onhover", "end-0", "me-1", "position-absolute"], ["mode", "outlined", 2, "min-width", "16px", 3, "click", "keydown.enter", "keydown.space", "square"], ["name", "edit"]], template: function FoldersComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, FoldersComponent_div_0_Template, 9, 8, "div", 5);
        \u0275\u0275elementStart(1, "div", 6);
        \u0275\u0275template(2, FoldersComponent_ng_container_2_Template, 4, 4, "ng-container", 7);
        \u0275\u0275elementEnd();
        \u0275\u0275template(3, FoldersComponent_div_3_Template, 3, 2, "div", 8);
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", (ctx.TREE_DATA == null ? null : ctx.TREE_DATA.length) || ctx.sharedByuser.length);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.isSepcomponent);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.Allsectionlist == null ? null : ctx.Allsectionlist.length) && ctx.cFoldertype === ctx.FOLDER_TYPES.ALL);
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, NgStyle, AsyncPipe, ScrollingModule, CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport, NgScrollbarModule, IconComponent, InputComponent, MatCheckboxModule, MatCheckbox, SkeletonComponent, MatTooltipModule, MatTooltip, MatFormFieldModule, ButtonComponent, MatMenuModule, MatMenu, MatMenuTrigger, FormsModule, NgControlStatus, NgModel, SharedfolderComponent, SharewithteamComponent, TabletruncComponent, TranslateModule, TranslatePipe, TruncateTooltipDirective], styles: ['\n\n.mat-tree[_ngcontent-%COMP%] {\n  background: transparent !important;\n  padding: 0;\n  --mat-tree-node-min-height: fit-content;\n}\n@supports (-webkit-appearance: none) or (-moz-appearance: none) {\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%] {\n    --active: #ff3d00;\n    --active-inner: #fff;\n    --focus: 1px #ff3d00;\n    --border: #BBC1E1;\n    --border-hover: #ff3d00;\n    --background: #fff;\n    --disabled: #F6F8FF;\n    --disabled-inner: #E1E6F9;\n    -webkit-appearance: none;\n    -moz-appearance: none;\n    height: 16px;\n    width: 16px;\n    outline: none;\n    display: inline-block;\n    vertical-align: top;\n    position: relative;\n    margin: 0;\n    cursor: pointer;\n    border: 1px solid var(--bc, var(--border));\n    background: var(--b, var(--background));\n    transition:\n      background 0.3s,\n      border-color 0.3s,\n      box-shadow 0.2s;\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:after {\n    content: "";\n    display: block;\n    left: 0;\n    top: 0;\n    position: absolute;\n    transition: transform var(--d-t, 0.3s) var(--d-t-e, ease), opacity var(--d-o, 0.2s);\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:checked {\n    --b: var(--active);\n    --bc: var(--active);\n    --d-o: .3s;\n    --d-t: .6s;\n    --d-t-e: cubic-bezier(.2, .85, .32, 1.2);\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:disabled {\n    --b: var(--disabled);\n    cursor: not-allowed;\n    opacity: 0.9;\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:disabled:checked {\n    --b: var(--disabled-inner);\n    --bc: var(--border);\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:disabled    + label[_ngcontent-%COMP%] {\n    cursor: not-allowed;\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:hover:not(:checked):not(:disabled) {\n    --bc: var(--border-hover);\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:focus {\n    box-shadow: 0 0 0 var(--focus);\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:not(.switch) {\n    width: 16px;\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:not(.switch):after {\n    opacity: var(--o, 0);\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:not(.switch):checked {\n    --o: 1;\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]    + label[_ngcontent-%COMP%] {\n    display: inline-block;\n    vertical-align: middle;\n    cursor: pointer;\n    margin-left: 4px;\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:not(.switch) {\n    border-radius: 4px;\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:not(.switch):after {\n    width: 5px;\n    height: 9px;\n    border: 2px solid var(--active-inner);\n    border-top: 0;\n    border-left: 0;\n    left: 4px;\n    top: 2px;\n    transform: rotate(var(--r, 20deg)) translateX(0%) translateY(-10%);\n  }\n  .checkbox-wrapper-13[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:not(.switch):checked {\n    --r: 43deg;\n  }\n}\n.checkbox-wrapper-13[_ngcontent-%COMP%]   *[_ngcontent-%COMP%] {\n  box-sizing: inherit;\n}\n.checkbox-wrapper-13[_ngcontent-%COMP%]   *[_ngcontent-%COMP%]:before, .checkbox-wrapper-13[_ngcontent-%COMP%]   *[_ngcontent-%COMP%]:after {\n  box-sizing: inherit;\n}\n.foldersvg.close[_ngcontent-%COMP%] {\n  d: path("M.875 3.812a.91.91 0 0 1 .91-.911H13.93a.91.91 0 0 1 .91.91v8.38a.91.91 0 0 1-.91.91H1.786a.91.91 0 0 1-.911-.91v-8.38Z");\n}\n.foldername[_ngcontent-%COMP%] {\n  width: calc(var(--folderswidth) - var(--resetwidth));\n}\n/*# sourceMappingURL=folders.component.css.map */'], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FoldersComponent, { className: "FoldersComponent", filePath: "src\\app\\shared\\components\\myfiles\\folders\\folders.component.ts", lineNumber: 56 });
})();

// src/app/shared/components/myfiles/section/section.component.ts
var _c04 = (a0) => ({ "--mat-option-padding": a0 });
var _c15 = (a0) => ({ "pointer-events-auto": a0 });
var _c24 = (a0) => ({ "bg-reply": a0 });
var _c33 = (a0) => ({ "hover:me-10": a0 });
var _c43 = (a0) => ({ "nSectionid": 0, "cFolder": "", "cFoldertype": a0 });
function SectionComponent_btn_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "btn", 16);
    \u0275\u0275text(1);
    \u0275\u0275element(2, "icon", 17);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    const options_r3 = \u0275\u0275reference(2);
    \u0275\u0275property("matMenuTriggerFor", options_r3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", ctx_r1.activeSection == null ? null : ctx_r1.activeSection.cFolder, " ");
  }
}
function SectionComponent_ng_container_9_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 18);
    \u0275\u0275listener("click", function SectionComponent_ng_container_9_ng_container_1_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r4);
      const sec_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r5));
    })("keydown.enter", function SectionComponent_ng_container_9_ng_container_1_Template_div_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const sec_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r5));
    })("keydown.space", function SectionComponent_ng_container_9_ng_container_1_Template_div_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const sec_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r5));
    });
    \u0275\u0275element(2, "icon", 19);
    \u0275\u0275elementStart(3, "span", 20);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const sec_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(sec_r5.cFolder);
  }
}
function SectionComponent_ng_container_9_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 18);
    \u0275\u0275listener("click", function SectionComponent_ng_container_9_ng_container_2_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r6);
      const sec_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r5));
    })("keydown.enter", function SectionComponent_ng_container_9_ng_container_2_Template_div_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const sec_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r5));
    })("keydown.space", function SectionComponent_ng_container_9_ng_container_2_Template_div_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const sec_r5 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r5));
    });
    \u0275\u0275element(2, "icon", 19);
    \u0275\u0275elementStart(3, "span", 20);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const sec_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(sec_r5.cFolder);
  }
}
function SectionComponent_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, SectionComponent_ng_container_9_ng_container_1_Template, 5, 1, "ng-container", 11)(2, SectionComponent_ng_container_9_ng_container_2_Template, 5, 1, "ng-container", 11);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const sec_r5 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", sec_r5.cFoldertype == "MB");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.isadmin && sec_r5.cFoldertype == "TS");
  }
}
function SectionComponent_ng_container_10_ng_container_6_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 38);
    \u0275\u0275listener("click", function SectionComponent_ng_container_10_ng_container_6_ng_container_7_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r10);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_ng_container_10_ng_container_6_ng_container_7_Template_div_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r10);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_ng_container_10_ng_container_6_ng_container_7_Template_div_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r10);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275elementStart(2, "btn", 39);
    \u0275\u0275element(3, "icon", 40);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_ng_container_10_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 23)(2, "div", 24);
    \u0275\u0275listener("click", function SectionComponent_ng_container_10_ng_container_6_Template_div_click_2_listener() {
      const sec_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r9));
    })("keydown.enter", function SectionComponent_ng_container_10_ng_container_6_Template_div_keydown_enter_2_listener($event) {
      const sec_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r9));
    })("keydown.space", function SectionComponent_ng_container_10_ng_container_6_Template_div_keydown_space_2_listener($event) {
      const sec_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r9));
    });
    \u0275\u0275elementStart(3, "div", 25);
    \u0275\u0275element(4, "icon", 26);
    \u0275\u0275elementStart(5, "span", 27);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(7, SectionComponent_ng_container_10_ng_container_6_ng_container_7_Template, 4, 0, "ng-container", 11);
    \u0275\u0275elementStart(8, "div", 28);
    \u0275\u0275listener("click", function SectionComponent_ng_container_10_ng_container_6_Template_div_click_8_listener($event) {
      \u0275\u0275restoreView(_r8);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_ng_container_10_ng_container_6_Template_div_keydown_enter_8_listener($event) {
      \u0275\u0275restoreView(_r8);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_ng_container_10_ng_container_6_Template_div_keydown_space_8_listener($event) {
      \u0275\u0275restoreView(_r8);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275elementStart(9, "btn", 29, 1);
    \u0275\u0275element(11, "icon", 30);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "mat-menu", 31, 2)(14, "div")(15, "h6", 32);
    \u0275\u0275text(16);
    \u0275\u0275pipe(17, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "div", 33)(19, "btn", 34);
    \u0275\u0275listener("click", function SectionComponent_ng_container_10_ng_container_6_Template_btn_click_19_listener() {
      const sec_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.deleteSection(sec_r9));
    })("keydown.enter", function SectionComponent_ng_container_10_ng_container_6_Template_btn_keydown_enter_19_listener($event) {
      const sec_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.deleteSection(sec_r9));
    })("keydown.space", function SectionComponent_ng_container_10_ng_container_6_Template_btn_keydown_space_19_listener($event) {
      const sec_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.deleteSection(sec_r9));
    });
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "btn", 35);
    \u0275\u0275text(23);
    \u0275\u0275pipe(24, "translate");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(25, "div", 28);
    \u0275\u0275listener("click", function SectionComponent_ng_container_10_ng_container_6_Template_div_click_25_listener($event) {
      \u0275\u0275restoreView(_r8);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_ng_container_10_ng_container_6_Template_div_keydown_enter_25_listener($event) {
      \u0275\u0275restoreView(_r8);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_ng_container_10_ng_container_6_Template_div_keydown_space_25_listener($event) {
      \u0275\u0275restoreView(_r8);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275elementStart(26, "btn", 36);
    \u0275\u0275listener("click", function SectionComponent_ng_container_10_ng_container_6_Template_btn_click_26_listener() {
      const sec_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.createSection(sec_r9));
    })("keydown.enter", function SectionComponent_ng_container_10_ng_container_6_Template_btn_keydown_enter_26_listener($event) {
      const sec_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.createSection(sec_r9));
    })("keydown.space", function SectionComponent_ng_container_10_ng_container_6_Template_btn_keydown_space_26_listener($event) {
      const sec_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.createSection(sec_r9));
    });
    \u0275\u0275element(27, "icon", 37);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const sec_r9 = ctx.$implicit;
    const dlt_r11 = \u0275\u0275reference(10);
    const delete_r12 = \u0275\u0275reference(13);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275classMap(dlt_r11.menuOpen ? "!w-[130px]" : "");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", sec_r9.cFolder, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.activeSection.nSectionid == sec_r9.nSectionid && !dlt_r11.menuOpen);
    \u0275\u0275advance();
    \u0275\u0275classMap(dlt_r11.menuOpen ? "!block" : "");
    \u0275\u0275advance();
    \u0275\u0275property("matMenuTriggerFor", delete_r12);
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate1("Confirm ", \u0275\u0275pipeBind1(17, 12, "ACTIONBAR.CONFIRM_DELETE"), "");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(21, 14, "ACTIONBAR.DELETE"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(24, 16, "CASECARD.CANCEL"));
    \u0275\u0275advance(2);
    \u0275\u0275classMap(dlt_r11.menuOpen ? "!block" : "");
  }
}
function SectionComponent_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "hr", 12);
    \u0275\u0275elementStart(2, "div", 21);
    \u0275\u0275listener("click", function SectionComponent_ng_container_10_Template_div_click_2_listener($event) {
      \u0275\u0275restoreView(_r7);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_ng_container_10_Template_div_keydown_enter_2_listener($event) {
      \u0275\u0275restoreView(_r7);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_ng_container_10_Template_div_keydown_space_2_listener($event) {
      \u0275\u0275restoreView(_r7);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 22);
    \u0275\u0275template(6, SectionComponent_ng_container_10_ng_container_6_Template, 28, 18, "ng-container", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 2, "MYFILES.SECTION.ASSIGNED_FILES"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.corebundle);
  }
}
function SectionComponent_ng_container_11_ng_container_5_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 38);
    \u0275\u0275listener("click", function SectionComponent_ng_container_11_ng_container_5_ng_container_7_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r16);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_ng_container_11_ng_container_5_ng_container_7_Template_div_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r16);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_ng_container_11_ng_container_5_ng_container_7_Template_div_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r16);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275elementStart(2, "btn", 39);
    \u0275\u0275element(3, "icon", 40);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_ng_container_11_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 42);
    \u0275\u0275listener("click", function SectionComponent_ng_container_11_ng_container_5_Template_div_click_1_listener() {
      const sec_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r15));
    })("keydown.enter", function SectionComponent_ng_container_11_ng_container_5_Template_div_keydown_enter_1_listener($event) {
      const sec_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r15));
    })("keydown.space", function SectionComponent_ng_container_11_ng_container_5_Template_div_keydown_space_1_listener($event) {
      const sec_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.sectionChange(sec_r15));
    });
    \u0275\u0275elementStart(2, "div", 43)(3, "div", 44);
    \u0275\u0275element(4, "icon", 45);
    \u0275\u0275elementStart(5, "span", 27);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(7, SectionComponent_ng_container_11_ng_container_5_ng_container_7_Template, 4, 0, "ng-container", 11);
    \u0275\u0275elementStart(8, "div", 28);
    \u0275\u0275listener("click", function SectionComponent_ng_container_11_ng_container_5_Template_div_click_8_listener($event) {
      \u0275\u0275restoreView(_r14);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_ng_container_11_ng_container_5_Template_div_keydown_enter_8_listener($event) {
      \u0275\u0275restoreView(_r14);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_ng_container_11_ng_container_5_Template_div_keydown_space_8_listener($event) {
      \u0275\u0275restoreView(_r14);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275elementStart(9, "btn", 36);
    \u0275\u0275listener("click", function SectionComponent_ng_container_11_ng_container_5_Template_btn_click_9_listener() {
      const sec_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.createSection(sec_r15));
    })("keydown.enter", function SectionComponent_ng_container_11_ng_container_5_Template_btn_keydown_enter_9_listener($event) {
      const sec_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.createSection(sec_r15));
    })("keydown.space", function SectionComponent_ng_container_11_ng_container_5_Template_btn_keydown_space_9_listener($event) {
      const sec_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.createSection(sec_r15));
    });
    \u0275\u0275element(10, "icon", 37);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const sec_r15 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1("", sec_r15.cFolder, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.activeSection == null ? null : ctx_r1.activeSection.nSectionid) == sec_r15.nSectionid);
  }
}
function SectionComponent_ng_container_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "hr", 12);
    \u0275\u0275elementStart(2, "div", 41);
    \u0275\u0275listener("click", function SectionComponent_ng_container_11_Template_div_click_2_listener($event) {
      \u0275\u0275restoreView(_r13);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_ng_container_11_Template_div_keydown_enter_2_listener($event) {
      \u0275\u0275restoreView(_r13);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_ng_container_11_Template_div_keydown_space_2_listener($event) {
      \u0275\u0275restoreView(_r13);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, SectionComponent_ng_container_11_ng_container_5_Template, 11, 2, "ng-container", 10);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 2, "MYFILES.SECTION.GENERIC_SECTION"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.Generic);
  }
}
function SectionComponent_mat_option_17_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 26);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_option_17_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 56);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_option_17_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 57);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_option_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 46)(1, "div", 47)(2, "div", 48);
    \u0275\u0275template(3, SectionComponent_mat_option_17_ng_container_3_Template, 2, 0, "ng-container", 11)(4, SectionComponent_mat_option_17_ng_container_4_Template, 2, 0, "ng-container", 11)(5, SectionComponent_mat_option_17_ng_container_5_Template, 2, 0, "ng-container", 11);
    \u0275\u0275elementStart(6, "span");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "icon", 49);
    \u0275\u0275listener("click", function SectionComponent_mat_option_17_Template_icon_click_8_listener($event) {
      \u0275\u0275restoreView(_r17);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_mat_option_17_Template_icon_keydown_enter_8_listener($event) {
      \u0275\u0275restoreView(_r17);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_mat_option_17_Template_icon_keydown_space_8_listener($event) {
      \u0275\u0275restoreView(_r17);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "mat-menu", 50, 3);
    \u0275\u0275elementContainerStart(11);
    \u0275\u0275elementStart(12, "div", 51)(13, "span", 52);
    \u0275\u0275text(14);
    \u0275\u0275elementEnd();
    \u0275\u0275element(15, "icon", 53);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "btn", 54);
    \u0275\u0275listener("click", function SectionComponent_mat_option_17_Template_btn_click_16_listener() {
      const x_r18 = \u0275\u0275restoreView(_r17).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.createSection(x_r18));
    })("keydown.enter", function SectionComponent_mat_option_17_Template_btn_keydown_enter_16_listener($event) {
      const x_r18 = \u0275\u0275restoreView(_r17).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.createSection(x_r18));
    })("keydown.space", function SectionComponent_mat_option_17_Template_btn_keydown_space_16_listener($event) {
      const x_r18 = \u0275\u0275restoreView(_r17).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.createSection(x_r18));
    });
    \u0275\u0275element(17, "icon", 55);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r18 = ctx.$implicit;
    const bundleinfo_r19 = \u0275\u0275reference(10);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(13, _c04, !x_r18.isActive ? "5px 0px " : "0px 0px "))("ngClass", \u0275\u0275pureFunction1(15, _c15, !x_r18.isActive))("disabled", !x_r18.isActive)("value", x_r18);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(17, _c24, !x_r18.isActive))("ngClass", \u0275\u0275pureFunction1(19, _c33, x_r18.cFoldertype == "CF" && x_r18.isActive));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r18.cFoldertype == "CO");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r18.cFoldertype == "TS");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r18.cFoldertype == "M");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", x_r18.cFolder, " ");
    \u0275\u0275advance();
    \u0275\u0275property("matMenuTriggerFor", bundleinfo_r19);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(x_r18.cMsg);
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true);
  }
}
function SectionComponent_mat_form_field_18_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 19);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_form_field_18_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 69);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_form_field_18_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 70);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_form_field_18_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 45);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_form_field_18_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 71);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_form_field_18_ng_container_27_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-option", 72)(2, "div", 73);
    \u0275\u0275element(3, "icon", 19);
    \u0275\u0275elementStart(4, "span");
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r21 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("value", x_r21);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(x_r21.cFolder);
  }
}
function SectionComponent_mat_form_field_18_ng_container_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, SectionComponent_mat_form_field_18_ng_container_27_ng_container_1_Template, 6, 2, "ng-container", 11);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r21 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.APPROVED_EXCLUDE_TYPES.includes(x_r21.cFoldertype));
  }
}
function SectionComponent_mat_form_field_18_ng_container_28_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-option", 72)(2, "div", 73);
    \u0275\u0275element(3, "icon", 19);
    \u0275\u0275elementStart(4, "span");
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const sec_r23 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("value", sec_r23);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(sec_r23.cFolder);
  }
}
function SectionComponent_mat_form_field_18_ng_container_28_Template(rf, ctx) {
  if (rf & 1) {
    const _r22 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "hr", 12);
    \u0275\u0275elementStart(2, "div", 8);
    \u0275\u0275listener("click", function SectionComponent_mat_form_field_18_ng_container_28_Template_div_click_2_listener($event) {
      \u0275\u0275restoreView(_r22);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_mat_form_field_18_ng_container_28_Template_div_keydown_enter_2_listener($event) {
      \u0275\u0275restoreView(_r22);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_mat_form_field_18_ng_container_28_Template_div_keydown_space_2_listener($event) {
      \u0275\u0275restoreView(_r22);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, SectionComponent_mat_form_field_18_ng_container_28_ng_container_5_Template, 6, 2, "ng-container", 10);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 2, "MYFILES.SECTION.ASSIGNED_FILES"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.corebundle);
  }
}
function SectionComponent_mat_form_field_18_ng_container_29_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-option", 72)(2, "div", 73);
    \u0275\u0275element(3, "icon", 19);
    \u0275\u0275elementStart(4, "span", 27);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const sec_r25 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("value", sec_r25);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(sec_r25.cFolder);
  }
}
function SectionComponent_mat_form_field_18_ng_container_29_Template(rf, ctx) {
  if (rf & 1) {
    const _r24 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "hr", 12);
    \u0275\u0275elementStart(2, "div", 8);
    \u0275\u0275listener("click", function SectionComponent_mat_form_field_18_ng_container_29_Template_div_click_2_listener($event) {
      \u0275\u0275restoreView(_r24);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_mat_form_field_18_ng_container_29_Template_div_keydown_enter_2_listener($event) {
      \u0275\u0275restoreView(_r24);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_mat_form_field_18_ng_container_29_Template_div_keydown_space_2_listener($event) {
      \u0275\u0275restoreView(_r24);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, SectionComponent_mat_form_field_18_ng_container_29_ng_container_5_Template, 6, 2, "ng-container", 10);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 2, "MYFILES.SECTION.GENERIC_SECTION"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.Generic);
  }
}
function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 69);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 70);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 45);
    \u0275\u0275elementContainerEnd();
  }
}
function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_icon_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 65);
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const bundleinfo_r26 = \u0275\u0275reference(10);
    \u0275\u0275property("matMenuTriggerFor", bundleinfo_r26);
  }
}
function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_btn_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r27 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 54);
    \u0275\u0275listener("click", function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_btn_16_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r27);
      const x_r28 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.addSection(x_r28));
    })("keydown.enter", function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_btn_16_Template_btn_keydown_enter_0_listener($event) {
      \u0275\u0275restoreView(_r27);
      const x_r28 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.addSection(x_r28));
    })("keydown.space", function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_btn_16_Template_btn_keydown_space_0_listener($event) {
      \u0275\u0275restoreView(_r27);
      const x_r28 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.addSection(x_r28));
    });
    \u0275\u0275element(1, "icon", 55);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r28 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275classMap(x_r28.isActive ? "" : "");
    \u0275\u0275property("square", true);
  }
}
function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_div_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r29 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 83);
    \u0275\u0275listener("click", function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_div_17_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r29);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.enter", function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_div_17_Template_div_keydown_enter_0_listener($event) {
      \u0275\u0275restoreView(_r29);
      return \u0275\u0275resetView($event.stopPropagation());
    })("keydown.space", function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_div_17_Template_div_keydown_space_0_listener($event) {
      \u0275\u0275restoreView(_r29);
      $event.stopPropagation();
      return \u0275\u0275resetView($event.preventDefault());
    });
    \u0275\u0275elementStart(1, "btn", 84);
    \u0275\u0275listener("click", function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_div_17_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r29);
      const x_r28 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.addSection(x_r28));
    })("keydown.enter", function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_div_17_Template_btn_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r29);
      const x_r28 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.addSection(x_r28));
    })("keydown.space", function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_div_17_Template_btn_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r29);
      const x_r28 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.addSection(x_r28));
    });
    \u0275\u0275element(2, "icon", 37);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("square", true);
  }
}
function SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 76)(1, "div", 77)(2, "div", 78);
    \u0275\u0275template(3, SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_ng_container_3_Template, 2, 0, "ng-container", 11)(4, SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_ng_container_4_Template, 2, 0, "ng-container", 11)(5, SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_ng_container_5_Template, 2, 0, "ng-container", 11);
    \u0275\u0275elementStart(6, "span", 27);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275template(8, SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_icon_8_Template, 1, 1, "icon", 79);
    \u0275\u0275elementStart(9, "mat-menu", 80, 3);
    \u0275\u0275elementContainerStart(11);
    \u0275\u0275elementStart(12, "div", 67)(13, "span", 52);
    \u0275\u0275text(14);
    \u0275\u0275elementEnd();
    \u0275\u0275element(15, "icon", 68);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementEnd()();
    \u0275\u0275template(16, SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_btn_16_Template, 2, 3, "btn", 81)(17, SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_div_17_Template, 3, 1, "div", 82);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r28 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(14, _c04, !x_r28.isActive ? "5px 0px " : "0px 0px "))("ngClass", \u0275\u0275pureFunction1(16, _c15, !x_r28.isActive))("disabled", !x_r28.isActive)("value", x_r28);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(18, _c24, !x_r28.isActive))("ngClass", \u0275\u0275pureFunction1(20, _c33, x_r28.cFoldertype == ctx_r1.FOLDER_TYPES.USER_FILES && x_r28.isActive));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r28.cFoldertype == ctx_r1.FOLDER_TYPES.CORE_BUNDLE);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r28.cFoldertype == ctx_r1.FOLDER_TYPES.TRANSCRIPT);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r28.cFoldertype == ctx_r1.FOLDER_TYPES.USER_FILES);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", x_r28.cFolder, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !x_r28.isActive);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(x_r28.cMsg);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !x_r28.isActive);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r28.cFoldertype == ctx_r1.FOLDER_TYPES.USER_FILES && x_r28.isActive);
  }
}
function SectionComponent_mat_form_field_18_ng_container_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "hr", 74);
    \u0275\u0275template(2, SectionComponent_mat_form_field_18_ng_container_30_mat_option_2_Template, 18, 22, "mat-option", 75);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.sectionlist2);
  }
}
function SectionComponent_mat_form_field_18_ng_container_31_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "hr", 74);
    \u0275\u0275elementStart(2, "mat-option", 85)(3, "div", 60);
    \u0275\u0275element(4, "icon", 71);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("value", \u0275\u0275pureFunction1(4, _c43, ctx_r1.FOLDER_TYPES.ALL));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(6, 2, "MYFILES.SECTION.ALL_SECTION"), " ");
  }
}
function SectionComponent_mat_form_field_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-form-field", 58)(1, "mat-select", 59);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275listener("selectionChange", function SectionComponent_mat_form_field_18_Template_mat_select_selectionChange_1_listener($event) {
      \u0275\u0275restoreView(_r20);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.sectionChange($event.value));
    });
    \u0275\u0275twoWayListener("ngModelChange", function SectionComponent_mat_form_field_18_Template_mat_select_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r20);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.activeSection, $event) || (ctx_r1.activeSection = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(3, "mat-select-trigger")(4, "div", 60);
    \u0275\u0275template(5, SectionComponent_mat_form_field_18_ng_container_5_Template, 2, 0, "ng-container", 11)(6, SectionComponent_mat_form_field_18_ng_container_6_Template, 2, 0, "ng-container", 11)(7, SectionComponent_mat_form_field_18_ng_container_7_Template, 2, 0, "ng-container", 11)(8, SectionComponent_mat_form_field_18_ng_container_8_Template, 2, 0, "ng-container", 11)(9, SectionComponent_mat_form_field_18_ng_container_9_Template, 2, 0, "ng-container", 11);
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "ng-scrollbar", 61)(13, "div", 62)(14, "mat-option", 63)(15, "div", 64);
    \u0275\u0275text(16);
    \u0275\u0275pipe(17, "translate");
    \u0275\u0275element(18, "icon", 65);
    \u0275\u0275elementStart(19, "mat-menu", 66, 0);
    \u0275\u0275elementContainerStart(21);
    \u0275\u0275elementStart(22, "div", 67)(23, "span", 52);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275element(26, "icon", 68);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(27, SectionComponent_mat_form_field_18_ng_container_27_Template, 2, 1, "ng-container", 10)(28, SectionComponent_mat_form_field_18_ng_container_28_Template, 6, 4, "ng-container", 11)(29, SectionComponent_mat_form_field_18_ng_container_29_Template, 6, 4, "ng-container", 11)(30, SectionComponent_mat_form_field_18_ng_container_30_Template, 3, 1, "ng-container", 11)(31, SectionComponent_mat_form_field_18_ng_container_31_Template, 7, 6, "ng-container", 11);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const options_r30 = \u0275\u0275reference(20);
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("placeholder", \u0275\u0275pipeBind1(2, 19, "MYFILES.SECTION.SELECT_PLACEHOLDER"));
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.activeSection);
    \u0275\u0275property("disabled", ctx_r1.disabled);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", (ctx_r1.activeSection == null ? null : ctx_r1.activeSection.cFoldertype) == "MB");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.activeSection == null ? null : ctx_r1.activeSection.cFoldertype) == ctx_r1.FOLDER_TYPES.CORE_BUNDLE);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.activeSection == null ? null : ctx_r1.activeSection.cFoldertype) == ctx_r1.FOLDER_TYPES.TRANSCRIPT);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.activeSection == null ? null : ctx_r1.activeSection.cFoldertype) == ctx_r1.FOLDER_TYPES.USER_FILES);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.activeSection == null ? null : ctx_r1.activeSection.cFoldertype) == ctx_r1.FOLDER_TYPES.ALL);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", (ctx_r1.activeSection == null ? null : ctx_r1.activeSection.cFoldertype) === ctx_r1.FOLDER_TYPES.ALL ? \u0275\u0275pipeBind1(11, 21, "MYFILES.SECTION.ALL_SECTION") : ctx_r1.activeSection == null ? null : ctx_r1.activeSection.cFolder, " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("visibility", "hover")("appearance", "compact");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(17, 23, "MYFILES.SECTION.APPROVED_CASE_FILES"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("matMenuTriggerFor", options_r30);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(25, 25, "MYFILES.SECTION.APPROVED_CASE_FILES_DESC"));
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.sectionlist);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.corebundle && ctx_r1.corebundle.length);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.Generic && ctx_r1.Generic.length);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.nPresentid && !ctx_r1.presentDocType);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.nPresentid && !ctx_r1.presentDocType);
  }
}
var SectionComponent = class _SectionComponent {
  constructor(bundleS, dialog, cdr, cs, hs) {
    this.bundleS = bundleS;
    this.dialog = dialog;
    this.cdr = cdr;
    this.cs = cs;
    this.hs = hs;
    this.FOLDER_TYPES = SECTION_FOLDER_TYPES;
    this.APPROVED_EXCLUDE_TYPES = SECTION_APPROVED_EXCLUDE_TYPES;
    this.changeSection = new EventEmitter();
    this.allSection = new EventEmitter();
    this.disabled = false;
    this.isDownload = false;
    this.sectionlist2D = SECTION_TEMPLATE_LIST;
    this.corebundle = [];
    this.Generic = [];
    this.isChooser = false;
    this.isUser = false;
  }
  ngOnInit() {
    this.getSections();
    this.checkEventSub();
  }
  checkEventSub() {
    this.evsubscription = this.cs.functionCalled$.subscribe((data) => {
      if (data === SECTION_EVENTS.RELOAD_SECTION) {
        this.getSections(true);
        return;
      }
      if (data?.type === SECTION_EVENTS.ACTIVE_SECTION) {
        this.addSection(data);
        return;
      }
      if (data?.type !== SECTION_EVENTS.CHANGE_SECTION)
        return;
      const byId = data?.nSectionid ? this.sectionlist?.find((e) => e.nSectionid == data.nSectionid) : void 0;
      if (byId) {
        this.sectionChange(byId);
        return;
      }
      const folderType = data?.cFoldertype;
      if (!folderType)
        return;
      const isCoreBundle = folderType === SECTION_FOLDER_TYPES.CORE_BUNDLE;
      const findInBoth = () => {
        const fromMain = (this.sectionlist ?? []).find((e) => e.cFoldertype == folderType);
        if (fromMain)
          return fromMain;
        return (this.sectionlist2 ?? []).find((e) => e.cFoldertype == folderType);
      };
      const hasActive = () => {
        const match = findInBoth();
        return !!match && !!match.isActive;
      };
      if (isCoreBundle && !hasActive()) {
        const sectionToAdd = (this.sectionlist2 ?? []).find((e) => e.cFoldertype == folderType);
        if (sectionToAdd)
          this.addSection(sectionToAdd);
        const intervalId2 = setInterval(() => {
          const section = findInBoth();
          if (!section)
            return;
          this.sectionChange(section);
          clearInterval(intervalId2);
        }, 200);
        return;
      }
      const existing = findInBoth();
      if (existing) {
        this.sectionChange(existing);
        return;
      }
      let attempts = 0;
      const intervalId = setInterval(() => {
        attempts++;
        const section = findInBoth();
        if (section) {
          this.sectionChange(section);
          clearInterval(intervalId);
          return;
        }
        if (attempts >= 15)
          clearInterval(intervalId);
      }, 200);
    });
  }
  ngOnChanges(changes) {
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    this.evsubscription?.unsubscribe();
  }
  getSections(isChange = false) {
    if (this.isadmin) {
      this.loadAdminSections();
      return;
    }
    this.loadUserSections(isChange);
  }
  loadUserSections(isChange) {
    const method = this.isDownload ? "getUploadSections" : "getUserSections";
    this.bundleS[method](this.nCaseid).then((res) => {
      this.sectionlist = res[0] ?? [];
      this.sectionlist2 = res[1] ?? [];
      this.corebundle = this.sectionlist.filter((e) => e.cFoldertype == SECTION_FOLDER_TYPES.CORE_ASSIGNED);
      this.Generic = this.sectionlist.filter((e) => e.cFoldertype == SECTION_FOLDER_TYPES.GENERIC);
      const mb = this.sectionlist.filter((e) => e.cFoldertype == SECTION_FOLDER_TYPES.MASTER_BUNDLE);
      const allSectionList = [mb, this.corebundle, this.Generic, this.sectionlist2];
      this.allSection.emit(allSectionList);
      const allFlatSections = [...mb, ...this.corebundle, ...this.Generic, ...this.sectionlist2];
      if (this.isUser && this.nSectionid) {
        const section = this.sectionlist2.find((e) => e.nSectionid == this.nSectionid);
        if (section?.nSectionid)
          this.sectionChange(section);
        return;
      }
      if (!isChange) {
        const mbSection = this.sectionlist.find((e) => e.cFoldertype == SECTION_FOLDER_TYPES.MASTER_BUNDLE);
        if (mbSection) {
          this.sectionChange(mbSection);
        } else if (this.sectionlist?.length) {
          this.sectionChange(allSectionList[0]);
        }
        return;
      }
      if (this.activeSection?.cFoldertype === SECTION_FOLDER_TYPES.ALL)
        return;
      const currentId = this.activeSection?.nSectionid;
      if (currentId) {
        const match = allFlatSections.find((e) => e.nSectionid == currentId);
        if (match)
          this.sectionChange(match);
      }
      this.cdr.detectChanges();
    });
  }
  loadAdminSections() {
    this.bundleS.getSections(this.nCaseid).then((res) => {
      this.sectionlist = res ?? [];
      this.corebundle = this.sectionlist.filter((e) => e.cFoldertype == SECTION_FOLDER_TYPES.CORE_ASSIGNED);
      this.Generic = this.sectionlist.filter((e) => e.cFoldertype == SECTION_FOLDER_TYPES.GENERIC);
      const mbSection = this.sectionlist.find((e) => e.cFoldertype == SECTION_FOLDER_TYPES.MASTER_BUNDLE);
      if (mbSection)
        this.sectionChange(mbSection);
      this.allSection.emit(this.sectionlist);
    });
  }
  getShare(nSectionid) {
    const dialogRef = this.dialog.open(SharewithteamComponent, {
      width: SECTION_DIALOG.SHARE_WIDTH,
      height: SECTION_DIALOG.SHARE_HEIGHT,
      panelClass: [...SECTION_PANEL_CLASS],
      data: {
        nBundleid: null,
        nBundledetailid: null,
        nCaseid: this.nCaseid,
        nSectionid
      }
    });
    dialogRef.afterClosed().subscribe();
  }
  sectionChange(e) {
    this.activeSection = e;
    this.changeSection.emit(e);
    if (this.hs.isGlobalSearch) {
      setTimeout(() => {
        this.cs.callFunction({ event: "SEARCH_FILES_EXISTING_FILTER" });
      });
    }
  }
  addSection(x) {
    return __async(this, null, function* () {
      if (this.isadmin)
        return;
      if (x.cFoldertype == SECTION_FOLDER_TYPES.USER_FILES) {
        this.createSection(x);
        return;
      }
      if (x.isActive)
        return;
      const mdl = {
        nCaseid: this.nCaseid,
        nSectionid: x?.nSectionid ?? null,
        cFolder: x.cFolder,
        permission: "N",
        cFoldertype: x.cFoldertype
      };
      const res = yield this.bundleS.usersectionBuilder(mdl);
      if (res)
        this.getSections();
    });
  }
  createSection(x) {
    const data = {
      nCaseid: this.nCaseid,
      nSectionid: x?.nSectionid ?? null,
      cFolder: x?.cFolder ?? null,
      cFoldertype: x?.cFoldertype ?? null
    };
    this.openModle(SectionCreationComponent, data, SECTION_DIALOG.CREATE_WIDTH);
  }
  openModle(component, data, width, height) {
    const dialogRef = this.dialog.open(component, {
      width: width ?? SECTION_DIALOG.DEFAULT_DIMENSION,
      height: height ?? SECTION_DIALOG.DEFAULT_DIMENSION,
      maxHeight: SECTION_DIALOG.MAX_HEIGHT,
      panelClass: [...SECTION_PANEL_CLASS],
      data
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.handleDialogClose(result, component, data);
    });
  }
  handleDialogClose(result, component, data) {
    if (!result?.isSave)
      return;
    if (component !== SectionCreationComponent)
      return;
    const sectionId = data["nSectionid"];
    if (sectionId) {
      if (this.activeSection?.nSectionid == sectionId) {
        this.activeSection.cFolder = data["cFolder"] ?? this.activeSection.cFolder;
      }
      this.getSections(!this.isadmin);
      this.cdr.detectChanges();
      return;
    }
    this.getSections();
    this.cdr.detectChanges();
  }
  deleteSection(x) {
    return __async(this, null, function* () {
      const mdl = {
        nCaseid: this.nCaseid,
        nSectionid: x.nSectionid ? x.nSectionid : null,
        cFolder: x.cFolder,
        cFoldertype: x.cFoldertype,
        permission: "D"
      };
      const res = yield this.bundleS.sectionBuilder(mdl);
      if (res) {
        this.bundleS.getSections(this.nCaseid).then((res2) => {
          this.getSections();
          const mbSection = res2?.find((e) => e.cFoldertype == SECTION_FOLDER_TYPES.MASTER_BUNDLE);
          if (mbSection)
            this.sectionChange(mbSection);
        });
      }
    });
  }
  static {
    this.\u0275fac = function SectionComponent_Factory(t) {
      return new (t || _SectionComponent)(\u0275\u0275directiveInject(BundlemanageService), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(HeaderService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SectionComponent, selectors: [["app-section"]], inputs: { nCaseid: "nCaseid", isadmin: "isadmin", activeSection: "activeSection", disabled: "disabled", isDownload: "isDownload", isChooser: "isChooser", nPresentid: "nPresentid", presentDocType: "presentDocType", isUser: "isUser", nSectionid: "nSectionid" }, outputs: { changeSection: "changeSection", allSection: "allSection" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 19, vars: 13, consts: [["options", "matMenu"], ["dlt", "matMenuTrigger"], ["delete", "matMenu"], ["bundleinfo", "matMenu"], ["mode", "darkwhite", 3, "matMenuTriggerFor", 4, "ngIf"], [1, "mt-2", "w-60", "bg-faint", "!rounded-base", "h-fit", "py-2.5"], [1, "section-scroll", 2, "max-height", "420px", 3, "visibility"], [1, "h-fit", "px-2.5"], [1, "flex", "text-xs", "items-center", "gap-2.5", "font-semibold", "h-9", "px-2.5", "mb-2", 3, "click", "keydown.enter", "keydown.space"], [1, "flex", "flex-col", "gap-2"], [4, "ngFor", "ngForOf"], [4, "ngIf"], [1, "my-2.5"], [1, "flex", "text-xs", "items-center", "gap-2.5", "font-semibold", "h-9", "px-2.5", "pt-2", 3, "click", "keydown.enter", "keydown.space"], ["class", "", "style", "\n                            --mat-option-hover-state-layer-color:white", 3, "ngStyle", "ngClass", "disabled", "value", 4, "ngFor", "ngForOf"], ["class", "w-full bg-white mb-2.5 !shadow-none", 4, "ngIf"], ["mode", "darkwhite", 3, "matMenuTriggerFor"], ["name", "chvx"], [1, "p-3", "rounded-base", "hover:bg-reply", "flex", "gap-2.5", "items-center", "h-9", 3, "click", "keydown.enter", "keydown.space"], ["name", "bundle"], [1, "text-xs", "font-semibold"], [1, "flex", "text-xs", "items-center", "gap-2.5", "font-semibold", "h-9", "px-2.5", "mb-2", "mt-2", 3, "click", "keydown.enter", "keydown.space"], [1, "flex", "flex-col", "gap-2.5"], [1, "text-xs", "whitespace-nowrap", "h-8.5", "w-full", "group"], [1, "flex", "items-center", "w-full", "gap-2", "h-full", 3, "click", "keydown.enter", "keydown.space"], [1, "flex", "items-center", "gap-2", "px-3", "rounded-base", "h-full", "group-hover:bg-reply", "group-hover:w-[130px]", "w-[170px]"], ["name", "corebundle", "type", "extra", 1, "text-base"], [1, "truncate"], [1, "group-hover:block", "hidden", 3, "click", "keydown.enter", "keydown.space"], ["square", "", "mode", "outlined", "addcls", "hover:bg-[#d7e7ff]", 2, "min-width", "16px", 3, "matMenuTriggerFor"], ["name", "delete"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click", "keydown.enter", "keydown.space"], ["mode", "dark"], ["square", "", "mode", "outlined", "addcls", "hover:bg-[#d7e7ff]", 2, "min-width", "16px", 3, "click", "keydown.enter", "keydown.space"], ["name", "edit"], [1, "group-hover:hidden", "block", 3, "click", "keydown.enter", "keydown.space"], ["square", "", "mode", "plain", "addcls", "hover:bg-[#d7e7ff]"], ["name", "check"], [1, "flex", "text-xs", "items-center", "gap-2.5", "font-semibold", "h-9", "px-2.5", "mb-2", "pt-2", 3, "click", "keydown.enter", "keydown.space"], [1, "text-xs", "whitespace-nowrap", "h-8.5", 3, "click", "keydown.enter", "keydown.space"], [1, "flex", "items-center", "w-full", "gap-2", "h-full", "group"], [1, "flex", "items-center", "gap-2", "px-3", "w-full", "rounded-base", "h-full", "group-hover:bg-reply", "group-hover:w-[calc(100%_-_44px)]"], ["name", "userfiles", "type", "myfileicn"], [1, "", 2, "--mat-option-hover-state-layer-color", "white", 3, "ngStyle", "ngClass", "disabled", "value"], [1, "flex", "items-center", "w-full", "gap-2", "group"], [1, "flex", "items-center", "gap-2.5", "px-3", "w-full", "rounded-base", "py-1.5", "bg-reply", 3, "ngClass"], ["name", "info-outline", "type", "extra", 3, "click", "keydown.enter", "keydown.space", "matMenuTriggerFor"], [1, "!rounded-none", "!bg-[#4B4D52]", "!min-w-[300px]"], [1, "!p-3", "flex", "justify-between", "gap-4", "items-center"], [1, "text-xs", "font-medium", "text-white"], ["name", "close", 1, "text-xs", "ms-2", "me-2", "text-white/70"], ["mode", "outlined", 3, "click", "keydown.enter", "keydown.space", "square"], ["name", "addcircle", 1, "text-base"], ["name", "transcript", "type", "myfileicn", 1, "text-base"], ["name", "userfiles", "type", "myfileicn", 1, "text-base"], [1, "w-full", "bg-white", "mb-2.5", "!shadow-none"], ["panelClass", "!p-0", 1, "select-section", 3, "selectionChange", "ngModelChange", "placeholder", "ngModel", "disabled"], [1, "flex", "gap-2.5", "items-center", "font-semibold", "[&>icon]:text-base", "text-grey"], ["matSelectViewport", "", 1, "section-scroll", 3, "visibility", "appearance"], [1, "p-2.5"], ["disabled", "", 1, "pointer-events-auto"], [1, "flex", "items-center", "gap-2.5", "font-semibold"], ["name", "info-outline", "type", "extra", 3, "matMenuTriggerFor"], [1, "!rounded-none", "w-fit", "!bg-[#4b4d52]"], [1, "!p-3", "flex", "justify-between", "gap-10", "items-center"], ["name", "close", 1, "text-xs", "me-2", "text-white/70"], ["name", "custombundle", "type", "myfileicn"], ["name", "transcript", "type", "myfileicn"], ["name", "allsection", "type", "extra"], [1, "rounded-base", 3, "value"], [1, "flex", "items-center", "gap-2.5", "w-full", "rounded-base"], [1, "my-1.5"], ["class", "group/option select-section-option hide-checkbox", "style", "\n                                --mat-option-hover-state-layer-color:white", 3, "ngStyle", "ngClass", "disabled", "value", 4, "ngFor", "ngForOf"], [1, "group/option", "select-section-option", "hide-checkbox", 2, "--mat-option-hover-state-layer-color", "white", 3, "ngStyle", "ngClass", "disabled", "value"], [1, "flex", "items-center", "justify-start", "w-full", "gap-2", "group/item"], [1, "flex", "items-center", "gap-2.5", "px-3", "hover:!m-0", "w-full", "rounded-base", "py-1.5", "group-hover/item:bg-reply", "group-hover/item:!w-[calc(100%_-_42px)]", 3, "ngClass"], ["name", "info-outline", "type", "extra", 3, "matMenuTriggerFor", 4, "ngIf"], [1, "!rounded-none", "!bg-[#4B4D52]", "!min-w-[322px]"], ["mode", "outlined", 3, "class", "square", "click", "keydown.enter", "keydown.space", 4, "ngIf"], ["class", "group-hover/item:!block hidden ", 3, "click", "keydown.enter", "keydown.space", 4, "ngIf"], [1, "group-hover/item:!block", "hidden", 3, "click", "keydown.enter", "keydown.space"], ["mode", "outlined", "addcls", "hover:bg-white hover:!border-blue-hover", 2, "min-width", "16px", 3, "click", "keydown.enter", "keydown.space", "square"], [3, "value"]], template: function SectionComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275template(0, SectionComponent_btn_0_Template, 3, 2, "btn", 4);
        \u0275\u0275elementStart(1, "mat-menu", 5, 0)(3, "ng-scrollbar", 6)(4, "div", 7)(5, "div", 8);
        \u0275\u0275listener("click", function SectionComponent_Template_div_click_5_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        })("keydown.enter", function SectionComponent_Template_div_keydown_enter_5_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        })("keydown.space", function SectionComponent_Template_div_keydown_space_5_listener($event) {
          \u0275\u0275restoreView(_r1);
          $event.stopPropagation();
          return \u0275\u0275resetView($event.preventDefault());
        });
        \u0275\u0275text(6);
        \u0275\u0275pipe(7, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(8, "div", 9);
        \u0275\u0275template(9, SectionComponent_ng_container_9_Template, 3, 2, "ng-container", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275template(10, SectionComponent_ng_container_10_Template, 7, 4, "ng-container", 11)(11, SectionComponent_ng_container_11_Template, 6, 4, "ng-container", 11);
        \u0275\u0275element(12, "hr", 12);
        \u0275\u0275elementStart(13, "div", 13);
        \u0275\u0275listener("click", function SectionComponent_Template_div_click_13_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        })("keydown.enter", function SectionComponent_Template_div_keydown_enter_13_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        })("keydown.space", function SectionComponent_Template_div_keydown_space_13_listener($event) {
          \u0275\u0275restoreView(_r1);
          $event.stopPropagation();
          return \u0275\u0275resetView($event.preventDefault());
        });
        \u0275\u0275text(14);
        \u0275\u0275pipe(15, "translate");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "div");
        \u0275\u0275template(17, SectionComponent_mat_option_17_Template, 18, 21, "mat-option", 14);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(18, SectionComponent_mat_form_field_18_Template, 32, 27, "mat-form-field", 15);
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", ctx.isadmin);
        \u0275\u0275advance(3);
        \u0275\u0275property("visibility", "hover");
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(7, 9, "MYFILES.SECTION.APPROVED_CASE_FILES"), " ");
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.sectionlist);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.corebundle && ctx.corebundle.length);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.Generic && ctx.Generic.length);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(15, 11, "MYFILES.SECTION.TYPES_OF_NEW_SECTION"), " ");
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.sectionlist2D);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.isadmin);
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, NgStyle, MatMenuModule, MatMenu, MatMenuTrigger, ButtonComponent, IconComponent, MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, MatFormFieldModule, FormsModule, NgControlStatus, NgModel, MatDialogModule, NgScrollbarModule, NgScrollbar, TranslateModule, TranslatePipe], styles: ["\n\n.mat-option.disabled[_ngcontent-%COMP%]   .btn-wrapper[_ngcontent-%COMP%]   btn[_ngcontent-%COMP%] {\n  pointer-events: auto;\n}\n/*# sourceMappingURL=section.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SectionComponent, { className: "SectionComponent", filePath: "src\\app\\shared\\components\\myfiles\\section\\section.component.ts", lineNumber: 36 });
})();

export {
  SectionCreationComponent,
  PermissionComponent,
  PaginationComponent,
  ConvertFolderComponent,
  SECTION_FOLDER_TYPES,
  HyperlinkService,
  FoldersComponent,
  SectionComponent
};
//# sourceMappingURL=chunk-YDR4HYTS.js.map
