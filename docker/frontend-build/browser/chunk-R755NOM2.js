import {
  MatAutocomplete,
  MatAutocompleteModule,
  MatAutocompleteTrigger
} from "./chunk-JASM6CRZ.js";
import {
  DatepickerComponent
} from "./chunk-YLWJRUOP.js";
import {
  MatDatepickerModule
} from "./chunk-X3RSWYEV.js";
import {
  ContentEditableComponent,
  TranscriptService
} from "./chunk-2VIGWAD6.js";
import {
  MatInput,
  MatInputModule
} from "./chunk-XTSEIZ7V.js";
import {
  CdkTextareaAutosize,
  TextFieldModule
} from "./chunk-DVMGXG6V.js";
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
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatError,
  MatFormField,
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  DefaultValueAccessor,
  FormBuilder,
  FormControlName,
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
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  ScrollingModule
} from "./chunk-MESCMVD2.js";
import {
  MAT_DATE_FORMATS,
  MatNativeDateModule,
  MatOption,
  provideNativeDateAdapter
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  DomSanitizer
} from "./chunk-FNSUDMGC.js";
import {
  AsyncPipe,
  CommonModule,
  DatePipe,
  NgForOf,
  NgIf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  BehaviorSubject,
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassMapInterpolate1,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵstyleMap,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/transscript/transcript-theme/transcript-theme.component.ts
var _c0 = (a0) => ({ "font-family": a0 });
var _c1 = () => ({ standalone: true });
function TranscriptThemeComponent_div_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 86);
    \u0275\u0275text(1, " Theme Name is required. ");
    \u0275\u0275elementEnd();
  }
}
function TranscriptThemeComponent_mat_option_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const font_r1 = ctx.$implicit;
    \u0275\u0275styleMap(\u0275\u0275pureFunction1(4, _c0, (font_r1.jOther == null ? null : font_r1.jOther.font) + " !important"));
    \u0275\u0275property("value", font_r1.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", font_r1.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_error_25_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-error");
    \u0275\u0275text(1, " Font is required. ");
    \u0275\u0275elementEnd();
  }
}
function TranscriptThemeComponent_mat_option_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const size_r2 = ctx.$implicit;
    \u0275\u0275property("value", size_r2.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", size_r2.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_error_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-error");
    \u0275\u0275text(1, " Font size is required. ");
    \u0275\u0275elementEnd();
  }
}
function TranscriptThemeComponent_mat_option_69_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const font_r3 = ctx.$implicit;
    \u0275\u0275styleMap(\u0275\u0275pureFunction1(4, _c0, (font_r3.jOther == null ? null : font_r3.jOther.font) + " !important"));
    \u0275\u0275property("value", font_r3.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", font_r3.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_73_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const size_r4 = ctx.$implicit;
    \u0275\u0275property("value", size_r4.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", size_r4.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_128_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const font_r5 = ctx.$implicit;
    \u0275\u0275styleMap(\u0275\u0275pureFunction1(4, _c0, (font_r5.jOther == null ? null : font_r5.jOther.font) + " !important"));
    \u0275\u0275property("value", font_r5.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", font_r5.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_131_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const size_r6 = ctx.$implicit;
    \u0275\u0275property("value", size_r6.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", size_r6.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_139_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r7 = ctx.$implicit;
    \u0275\u0275property("value", pos_r7.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r7.name, " ");
  }
}
function TranscriptThemeComponent_mat_option_146_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r8 = ctx.$implicit;
    \u0275\u0275property("value", pos_r8);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r8, " ");
  }
}
function TranscriptThemeComponent_mat_option_149_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r9 = ctx.$implicit;
    \u0275\u0275property("value", pos_r9);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r9, " ");
  }
}
function TranscriptThemeComponent_mat_option_155_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const page_r10 = ctx.$implicit;
    \u0275\u0275property("value", page_r10.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", page_r10.name, " ");
  }
}
function TranscriptThemeComponent_mat_option_168_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const font_r11 = ctx.$implicit;
    \u0275\u0275styleMap(\u0275\u0275pureFunction1(4, _c0, (font_r11.jOther == null ? null : font_r11.jOther.font) + " !important"));
    \u0275\u0275property("value", font_r11.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", font_r11.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_171_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const size_r12 = ctx.$implicit;
    \u0275\u0275property("value", size_r12.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", size_r12.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_183_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const font_r13 = ctx.$implicit;
    \u0275\u0275styleMap(\u0275\u0275pureFunction1(4, _c0, (font_r13.jOther == null ? null : font_r13.jOther.font) + " !important"));
    \u0275\u0275property("value", font_r13.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", font_r13.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_186_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const size_r14 = ctx.$implicit;
    \u0275\u0275property("value", size_r14.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", size_r14.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_205_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const font_r15 = ctx.$implicit;
    \u0275\u0275styleMap(\u0275\u0275pureFunction1(4, _c0, (font_r15.jOther == null ? null : font_r15.jOther.font) + " !important"));
    \u0275\u0275property("value", font_r15.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", font_r15.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_208_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const size_r16 = ctx.$implicit;
    \u0275\u0275property("value", size_r16.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", size_r16.cKey, " ");
  }
}
function TranscriptThemeComponent_mat_option_217_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r17 = ctx.$implicit;
    \u0275\u0275property("value", pos_r17);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r17, " ");
  }
}
function TranscriptThemeComponent_mat_option_220_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r18 = ctx.$implicit;
    \u0275\u0275property("value", pos_r18);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r18, " ");
  }
}
function TranscriptThemeComponent_mat_option_227_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r19 = ctx.$implicit;
    \u0275\u0275property("value", pos_r19);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r19, " ");
  }
}
function TranscriptThemeComponent_mat_option_230_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r20 = ctx.$implicit;
    \u0275\u0275property("value", pos_r20);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r20, " ");
  }
}
function TranscriptThemeComponent_mat_option_236_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r21 = ctx.$implicit;
    \u0275\u0275property("value", pos_r21);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r21, " ");
  }
}
function TranscriptThemeComponent_mat_option_239_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r22 = ctx.$implicit;
    \u0275\u0275property("value", pos_r22);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r22, " ");
  }
}
function TranscriptThemeComponent_mat_option_246_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r23 = ctx.$implicit;
    \u0275\u0275property("value", pos_r23);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r23, " ");
  }
}
function TranscriptThemeComponent_mat_option_249_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pos_r24 = ctx.$implicit;
    \u0275\u0275property("value", pos_r24);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", pos_r24, " ");
  }
}
var TranscriptThemeComponent = class _TranscriptThemeComponent {
  constructor(matDialog, dialogRef, formBuilder, commonS, transcriptS, data) {
    this.matDialog = matDialog;
    this.dialogRef = dialogRef;
    this.formBuilder = formBuilder;
    this.commonS = commonS;
    this.transcriptS = transcriptS;
    this.data = data;
    this.checkboxStates = {
      markAsDefault: false,
      allCapsCase: false,
      boldCaseType: false,
      boldParties: true,
      boldBefore: true,
      boldAppearances: false,
      showLineNumber: true,
      showTimeStamp: true,
      showHeaderFooter: true,
      headerFooterOnCover: false,
      boldQuestion: false,
      boldSpeaker: false
    };
    this.theme = {
      name: "",
      coverPage: {
        font: "courier",
        fontSize: 12
      },
      bodyText: {
        font: "courier",
        fontSize: 12,
        letterSpacing: "Auto",
        lineSpacing: "Auto"
      },
      pageNumber: {
        align: {
          vertical: "Bottom",
          horizontal: "Right"
        },
        position: "B",
        startPage: "pg 2",
        include: false,
        swapSide: false,
        font: "courier",
        fontSize: 12
      },
      lineNumber: {
        font: "courier",
        fontSize: 12
      },
      timeStamp: {
        font: "courier",
        fontSize: 12
      },
      headerFooter: {
        font: "courier",
        fontSize: 12,
        positions: {
          caseName: { vertical: "Top", horizontal: "Left" },
          volumeDate: { vertical: "Top", horizontal: "Right" },
          companyName: { vertical: "Bottom", horizontal: "Left" },
          companyInfo: { vertical: "Bottom", horizontal: "Right" }
        }
      }
    };
    this.fontOptions = [
      {
        nValue: 1,
        cKey: "Calibri",
        jOther: { font: "calibri" }
      },
      {
        nValue: 2,
        cKey: "Georgia",
        jOther: { font: "georgia" }
      },
      {
        nValue: 3,
        cKey: "courier",
        jOther: { font: "courier" }
      },
      {
        nValue: 4,
        cKey: "Times New Roman",
        jOther: { font: "times" }
      },
      {
        nValue: 5,
        cKey: "Open Sans",
        jOther: { font: "Open Sans" }
      },
      {
        nValue: 6,
        cKey: "Arial",
        jOther: { font: "arial" }
      }
    ];
    this.fontSizeOptions = [
      { nValue: 8, cKey: "8pt" },
      { nValue: 10, cKey: "10pt" },
      { nValue: 12, cKey: "12pt" },
      { nValue: 14, cKey: "14pt" }
    ];
    this.verticalPositions = [
      "Top",
      "Bottom"
    ];
    this.horizontalPositions = [
      "Left",
      "Right"
    ];
    this.pageStartOptions = [
      { id: 1, name: "pg 1" },
      { id: 2, name: "pg 2" }
    ];
    this.pageNumberPositions = [
      { name: "Bracket", value: "B" },
      { name: "Line", value: "L" },
      { name: "Page", value: "P" }
    ];
    this.cThemeid = null;
    debugger;
    this.cThemeid = data.cThemeid ? data.cThemeid : null;
  }
  ngOnInit() {
    this.TransForm = this.formBuilder.group({
      cThemeid: [null],
      cName: ["", Validators.required],
      nCFontid: [1],
      nCFontsize: [this.theme.coverPage.fontSize, Validators.required],
      bCIsCaps: [true],
      bLMbrand: [true],
      jCBold: [[]],
      nBFont: [1],
      nBFontsize: [this.theme.bodyText.fontSize, Validators.required],
      nBLetterspacing: [0],
      nBLinespacing: [0],
      jBBold: [[]],
      nPNFont: [1, Validators.required],
      nPNFontsize: [this.theme.pageNumber.fontSize, Validators.required],
      bPInclude: [true],
      cPNPosition: [this.theme.pageNumber.position],
      nPNStart: [1],
      cPNAlignTB: [this.theme.pageNumber.align.vertical],
      cPNAlignRL: [this.theme.pageNumber.align.horizontal],
      bPNSwap: [false],
      bLNShow: [true],
      nLFont: [1, Validators.required],
      nLFontsize: [this.theme.lineNumber.fontSize, Validators.required],
      bTShow: [false],
      nTFont: [1, Validators.required],
      nTFontsize: [this.theme.headerFooter.fontSize, Validators.required],
      nHFont: [1, Validators.required],
      nHFontsize: [this.theme.headerFooter.fontSize, Validators.required],
      bHCover: [false],
      bHShow: [true],
      cPCaseName: [""],
      cPVolumeDate: [""],
      cPCompany: [""],
      cPCompanyInfo: [""],
      // nLHeight: [10],
      // nBTHeight: [10],
      // nBFHeight: [10],
      // nAHeight: [10],
      // bQBold: [false],
      // bSBold: [false],
      bIsdefault: [false],
      permission: ["N", Validators.required]
    });
    debugger;
    if (this.cThemeid) {
      this.get_transcript_detail(this.cThemeid);
    }
  }
  getFonts() {
    return __async(this, null, function* () {
      this.fontOptions = yield this.commonS.getCode(22);
    });
  }
  // Check if a specific checkbox is checked
  isChecked(name) {
    return this.checkboxStates[name];
  }
  // Toggle checkbox state
  toggleCheckbox(checkboxName) {
    const key = checkboxName;
    this.checkboxStates[key] = !this.checkboxStates[key];
  }
  // Form submission
  onSubmit() {
    return __async(this, null, function* () {
      this.TransForm.markAllAsTouched();
      if (this.TransForm.invalid) {
        return;
      }
      const formData = this.TransForm.value;
      if (formData.permission == "N") {
        delete formData.cThemeid;
      }
      formData.jCBold = [];
      if (this.checkboxStates.boldCaseType) {
        formData.jCBold.push("C");
      }
      if (this.checkboxStates.boldParties) {
        formData.jCBold.push("P");
      }
      if (this.checkboxStates.boldBefore) {
        formData.jCBold.push("B");
      }
      if (this.checkboxStates.boldAppearances) {
        formData.jCBold.push("A");
      }
      formData.jBBold = [];
      debugger;
      if (this.checkboxStates.boldQuestion) {
        formData.jBBold.push("Q");
      }
      if (this.checkboxStates.boldSpeaker) {
        formData.jBBold.push("S");
      }
      console.log("Form Data:", formData);
      formData.cPCaseName = this.theme.headerFooter.positions.caseName.vertical.charAt(0) + this.theme.headerFooter.positions.caseName.horizontal.charAt(0);
      formData.cPVolumeDate = this.theme.headerFooter.positions.volumeDate.vertical.charAt(0) + this.theme.headerFooter.positions.volumeDate.horizontal.charAt(0);
      formData.cPCompany = this.theme.headerFooter.positions.companyName.vertical.charAt(0) + this.theme.headerFooter.positions.companyName.horizontal.charAt(0);
      formData.cPCompanyInfo = this.theme.headerFooter.positions.companyInfo.vertical.charAt(0) + this.theme.headerFooter.positions.companyInfo.horizontal.charAt(0);
      const response = yield this.transcriptS.saveTheme(formData);
      if (response.msg == 1) {
        console.log("Theme saved successfully:", response);
        this.dialogRef.close("Save");
      }
      this.dialogRef.close("Save");
    });
  }
  // Cancel form
  onCancel() {
    this.dialogRef.close();
  }
  get_transcript_detail(cThemeid) {
    return __async(this, null, function* () {
      const formData = yield this.transcriptS.getThemeDetail(cThemeid);
      this.editFormat(formData);
    });
  }
  editFormat(formdata) {
    this.TransForm.patchValue({
      cThemeid: formdata.cThemeid,
      cName: formdata.cName,
      nCFontid: formdata.nCFontid,
      nCFontsize: formdata.nCFontsize,
      bCIsCaps: formdata.bCIsCaps,
      jCBold: formdata.jCBold,
      nBFont: formdata.nBFont,
      nBFontsize: formdata.nBFontsize,
      nBLetterspacing: formdata.nBLetterspacing,
      nBLinespacing: formdata?.nBLinespacing,
      jBBold: formdata.jBBold,
      nPNFont: formdata.nPNFont,
      nPNFontsize: formdata.nPNFontsize,
      cPNPosition: formdata.cPNPosition,
      bPInclude: formdata.bPInclude,
      nPNStart: formdata.nPNStart,
      cPNAlignRL: formdata.cPNAlignRL,
      cPNAlignTB: formdata.cPNAlignTB,
      bPNSwap: formdata.bPNSwap,
      bLNShow: formdata.bLNShow,
      nLFont: formdata.nLFont,
      nLFontsize: formdata.nLFontsize,
      bTShow: formdata.bTShow,
      nTFont: formdata.nTFont,
      nTFontsize: formdata.nTFontsize,
      nHFont: formdata.nHFont,
      nHFontsize: formdata.nHFontsize,
      bHCover: formdata.bHCover,
      bHShow: formdata.bHShow,
      cPCaseName: formdata.cPCaseName,
      cPVolumeDate: formdata.cPVolumeDate,
      cPCompany: formdata.cPCompany,
      cPCompanyInfo: formdata.cPCompanyInfo,
      bIsdefault: formdata.bIsdefault ? true : false,
      // nLHeight: formdata.nLHeight,
      // nBTHeight: formdata.nBTHeight,
      // nBFHeight: formdata.nBFHeight,
      // nAHeight: formdata.nAHeight,
      // bQBold: formdata.bQBold,
      // bSBold: formdata.bSBold,
      bLMbrand: formdata.bLMbrand,
      permission: "U"
    });
    this.checkboxStates.boldCaseType = formdata.jCBold.includes("C");
    this.checkboxStates.boldParties = formdata.jCBold.includes("P");
    this.checkboxStates.boldBefore = formdata.jCBold.includes("B");
    this.checkboxStates.boldAppearances = formdata.jCBold.includes("A");
    if (formdata.jBBold.includes("Q")) {
      this.checkboxStates.boldQuestion = true;
    }
    if (formdata.jBBold.includes("S")) {
      this.checkboxStates.boldSpeaker = true;
    }
    this.theme.headerFooter.positions.caseName.vertical = formdata.cPCaseName.charAt(0) == "T" ? "Top" : "Bottom";
    this.theme.headerFooter.positions.caseName.horizontal = formdata.cPCaseName.charAt(1) == "L" ? "Left" : "Right";
    this.theme.headerFooter.positions.volumeDate.vertical = formdata.cPVolumeDate.charAt(0) == "T" ? "Top" : "Bottom";
    this.theme.headerFooter.positions.volumeDate.horizontal = formdata.cPVolumeDate.charAt(1) == "L" ? "Left" : "Right";
    this.theme.headerFooter.positions.companyName.vertical = formdata.cPCompany.charAt(0) == "T" ? "Top" : "Bottom";
    this.theme.headerFooter.positions.companyName.horizontal = formdata.cPCompany.charAt(1) == "L" ? "Left" : "Right";
    this.theme.headerFooter.positions.companyInfo.vertical = formdata.cPCompanyInfo.charAt(0) == "T" ? "Top" : "Bottom";
    this.theme.headerFooter.positions.companyInfo.horizontal = formdata.cPCompanyInfo.charAt(1) == "L" ? "Left" : "Right";
    this.checkboxStates.markAsDefault = formdata.bIsdefault ? true : false;
  }
  changeHeaderFooterPosition(type, position, value) {
    let position1;
    if (position == "caseName") {
      position1 = type == "horizontal" ? "volumeDate" : "companyName";
    } else if (position == "volumeDate") {
      position1 = type == "horizontal" ? "caseName" : "companyInfo";
    } else if (position == "companyName") {
      position1 = type == "horizontal" ? "companyInfo" : "caseName";
    } else if (position == "companyInfo") {
      position1 = type == "horizontal" ? "companyName" : "volumeDate";
    }
    if (type == "horizontal") {
      if (value == "Left") {
        this.theme.headerFooter.positions[position1].horizontal = "Right";
      } else if (value == "Right") {
        this.theme.headerFooter.positions[position1].horizontal = "Left";
      }
    }
    if (type == "vertical") {
      if (value == "Top") {
        this.theme.headerFooter.positions[position1].vertical = "Bottom";
      } else if (value == "Bottom") {
        this.theme.headerFooter.positions.companyName.vertical = "Top";
      }
    }
  }
  static {
    this.\u0275fac = function TranscriptThemeComponent_Factory(t) {
      return new (t || _TranscriptThemeComponent)(\u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(FormBuilder), \u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(TranscriptService), \u0275\u0275directiveInject(MAT_DIALOG_DATA));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TranscriptThemeComponent, selectors: [["app-transcript-theme"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 262, vars: 100, consts: [[1, "bg-[#F4F6F9]", "rounded-base", "p-10", "w-full", "overflow-auto", 3, "formGroup"], [1, "flex", "flex-col", "gap-2.5"], [1, "font-semibold", "text-lg", "text-grey"], [1, "flex", "gap-6", "w-full"], [1, "w-1/2"], [1, "flex", "flex-row", "items-center", "gap-6"], [1, "flex-1"], ["type", "text", "formControlName", "cName", "placeholder", "Theme Name", 1, "w-full", "border", "border-tab", "rounded-base", "px-4", "py-2", "h-8.5", "text-xs", "text-grey", "outline-none"], ["class", "text-red-500 text-xs", 4, "ngIf"], [1, "mt-4"], [1, ""], [1, "font-bold", "text-sm", "text-grey", "mb-2", "flex", "items-center", "gap-2"], [1, "flex", "flex-col", "gap-2"], [1, "flex", "items-center", "gap-0.5"], [1, "relative", "w-5", "h-5"], ["formControlName", "bLMbrand", "color", "primary", 3, "change"], [1, "text-xs", "text-grey"], [1, "flex", "gap-1", "items-center"], [1, "flex", "flex-col", "gap-2", "w-40"], [1, "relative", "w-40"], ["formControlName", "nCFontid", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base", "custfont"], [3, "value", "style", 4, "ngFor", "ngForOf"], [4, "ngIf"], [1, "flex", "flex-col", "gap-2", "w-24"], [1, "relative", "w-24"], ["formControlName", "nCFontsize", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [3, "value", 4, "ngFor", "ngForOf"], [1, "flex", "flex-col", "gap-2", "ms-4"], ["formControlName", "bCIsCaps", "color", "primary", 3, "change"], [1, "mt-4", "flex", "gap-2.5", "items-center"], [1, "font-semibold", "text-xs", "text-grey"], [1, "flex", "gap-2.5"], ["color", "primary", 3, "ngModelChange", "ngModel", "ngModelOptions"], [1, "border-t", "border-tab/50", "my-4"], [1, "font-bold", "text-sm", "text-grey", "-mb-5"], [1, "flex", "gap-1", "items-end"], [1, "relative"], ["formControlName", "nBFont", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base", "custfont"], ["formControlName", "nBFontsize", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], ["formControlName", "nBLetterspacing", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [3, "value"], ["formControlName", "nBLinespacing", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [1, "font-bold", "text-sm", "text-grey", "mb-4", "flex", "items-center", "gap-2"], ["formControlName", "bPNSwap", "color", "primary"], [1, "text-xs", "text-grey", "font-normal", "ms-auto"], [1, "flex", "gap-1", "mt-2", "mb-2.5"], ["formControlName", "nPNFont", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base", "custfont"], ["formControlName", "nPNFontsize", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [1, "flex", "items-center", "gap-0.5", "ms-4"], ["formControlName", "bPInclude", "color", "primary"], [1, "text-xs", "text-grey", "font-semibold", "ms-auto"], ["formControlName", "cPNPosition", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [1, "font-semibold", "w-16", "text-xs"], [1, "flex", "items-center", "gap-2", "text-xs", "text-grey"], ["formControlName", "cPNAlignTB", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], ["formControlName", "cPNAlignRL", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [1, "font-semibold"], ["formControlName", "nPNStart", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [1, "h-auto", "self-stretch", "bg-tab/50", "w-px"], [1, "flex", "items-center", "gap-2"], [1, "font-bold", "text-sm", "text-grey", "mb-2"], ["formControlName", "bLNShow", "color", "primary", 3, "change"], [1, "flex", "gap-6", "mt-2"], ["formControlName", "nLFont", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base", "custfont"], ["formControlName", "nLFontsize", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [1, "font-bold", "text-sm", "text-grey"], ["formControlName", "bTShow", "color", "primary", 3, "change"], ["formControlName", "nTFont", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base", "custfont"], ["formControlName", "nTFontsize", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [1, "h-px", "w-full", "bg-tab/50", "mt-5"], [1, "mt-6", "mb-4"], ["formControlName", "bHShow", "color", "primary", 3, "change"], ["formControlName", "bHCover", "color", "primary", 3, "change"], [1, "flex", "gap-6", "mt-4"], ["formControlName", "nHFont", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], ["formControlName", "nHFontsize", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base"], [1, "border", "border-tab", "bg-white", "p-2.5", "mt-4"], [1, "flex", "justify-between", "mb-4"], [1, "flex", "gap-1"], [1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base", 3, "ngModelChange", "selectionChange", "ngModel", "ngModelOptions"], [1, "text-xs", "text-grey", "text-end"], [1, "flex", "justify-between"], [1, "bg-brand", "text-white", "rounded-base", "px-3", "py-2", "text-xs", "hover:bg-orange-hover", 3, "click"], [1, "text-grey", "rounded-base", "px-3", "py-2", "text-xs", "border", "border-tab", "shadow-base", "hover:bg-[#F5F5F5]", 3, "click"], [1, "relative", "w-fit", "h-5"], ["formControlName", "bIsdefault", "color", "primary", 3, "change"], [1, "text-red-500", "text-xs"]], template: function TranscriptThemeComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "form", 0)(1, "div", 1)(2, "h2", 2);
        \u0275\u0275text(3, "Theme");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "div", 3)(5, "div", 4)(6, "div", 5)(7, "div", 6);
        \u0275\u0275element(8, "input", 7);
        \u0275\u0275template(9, TranscriptThemeComponent_div_9_Template, 2, 0, "div", 8);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "div", 9)(11, "div", 10)(12, "h3", 11);
        \u0275\u0275text(13, "Cover Page ");
        \u0275\u0275elementStart(14, "div", 12)(15, "div", 13)(16, "div", 14)(17, "mat-checkbox", 15);
        \u0275\u0275listener("change", function TranscriptThemeComponent_Template_mat_checkbox_change_17_listener() {
          return ctx.toggleCheckbox("bLMbrand");
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(18, "span", 16);
        \u0275\u0275text(19, "Use LM brand graphic");
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(20, "div", 17)(21, "div", 18)(22, "div", 19)(23, "mat-select", 20);
        \u0275\u0275template(24, TranscriptThemeComponent_mat_option_24_Template, 2, 6, "mat-option", 21);
        \u0275\u0275elementEnd();
        \u0275\u0275template(25, TranscriptThemeComponent_mat_error_25_Template, 2, 0, "mat-error", 22);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(26, "div", 23)(27, "div", 24)(28, "mat-select", 25);
        \u0275\u0275template(29, TranscriptThemeComponent_mat_option_29_Template, 2, 2, "mat-option", 26)(30, TranscriptThemeComponent_mat_error_30_Template, 2, 0, "mat-error", 22);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(31, "div", 27)(32, "div", 13)(33, "div", 14)(34, "mat-checkbox", 28);
        \u0275\u0275listener("change", function TranscriptThemeComponent_Template_mat_checkbox_change_34_listener() {
          return ctx.toggleCheckbox("allCapsCase");
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(35, "span", 16);
        \u0275\u0275text(36, "All caps case type and no.");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(37, "div", 29)(38, "h4", 30);
        \u0275\u0275text(39, "Bold:");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(40, "div", 31)(41, "div", 13)(42, "div", 14)(43, "mat-checkbox", 32);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_checkbox_ngModelChange_43_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.checkboxStates.boldCaseType, $event) || (ctx.checkboxStates.boldCaseType = $event);
          return $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(44, "span", 16);
        \u0275\u0275text(45, "Case type & no.");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(46, "div", 13)(47, "div", 14)(48, "mat-checkbox", 32);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_checkbox_ngModelChange_48_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.checkboxStates.boldParties, $event) || (ctx.checkboxStates.boldParties = $event);
          return $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(49, "span", 16);
        \u0275\u0275text(50, "Parties");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(51, "div", 13)(52, "div", 14)(53, "mat-checkbox", 32);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_checkbox_ngModelChange_53_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.checkboxStates.boldBefore, $event) || (ctx.checkboxStates.boldBefore = $event);
          return $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(54, "span", 16);
        \u0275\u0275text(55, "Before");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(56, "div", 13)(57, "div", 14)(58, "mat-checkbox", 32);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_checkbox_ngModelChange_58_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.checkboxStates.boldAppearances, $event) || (ctx.checkboxStates.boldAppearances = $event);
          return $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(59, "span", 16);
        \u0275\u0275text(60, "Appearances");
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275element(61, "div", 33);
        \u0275\u0275elementStart(62, "div", 9)(63, "h3", 34);
        \u0275\u0275text(64, "Body Text");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(65, "div", 35)(66, "div", 18)(67, "div", 36)(68, "mat-select", 37);
        \u0275\u0275template(69, TranscriptThemeComponent_mat_option_69_Template, 2, 6, "mat-option", 21);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(70, "div", 23)(71, "div", 36)(72, "mat-select", 38);
        \u0275\u0275template(73, TranscriptThemeComponent_mat_option_73_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(74, "div", 23)(75, "span", 30);
        \u0275\u0275text(76, "Letter Spacing");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(77, "div", 36)(78, "mat-select", 39)(79, "mat-option", 40);
        \u0275\u0275text(80, "Auto");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(81, "mat-option", 40);
        \u0275\u0275text(82, "8pt");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(83, "mat-option", 40);
        \u0275\u0275text(84, "10pt");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(85, "mat-option", 40);
        \u0275\u0275text(86, "12pt");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(87, "mat-option", 40);
        \u0275\u0275text(88, "14pt");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(89, "div", 23)(90, "span", 30);
        \u0275\u0275text(91, "Line Spacing");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(92, "div", 36)(93, "mat-select", 41)(94, "mat-option", 40);
        \u0275\u0275text(95, "Auto");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(96, "mat-option", 40);
        \u0275\u0275text(97, "8pt");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(98, "mat-option", 40);
        \u0275\u0275text(99, "10pt");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(100, "mat-option", 40);
        \u0275\u0275text(101, "14pt");
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(102, "div", 29)(103, "h4", 30);
        \u0275\u0275text(104, "Bold:");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(105, "div", 31)(106, "div", 13)(107, "div", 14)(108, "mat-checkbox", 32);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_checkbox_ngModelChange_108_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.checkboxStates.boldQuestion, $event) || (ctx.checkboxStates.boldQuestion = $event);
          return $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(109, "span", 16);
        \u0275\u0275text(110, "Question");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(111, "div", 13)(112, "div", 14)(113, "mat-checkbox", 32);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_checkbox_ngModelChange_113_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.checkboxStates.boldSpeaker, $event) || (ctx.checkboxStates.boldSpeaker = $event);
          return $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(114, "span", 16);
        \u0275\u0275text(115, "Speaker");
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275element(116, "div", 33);
        \u0275\u0275elementStart(117, "div", 9)(118, "h3", 42);
        \u0275\u0275text(119, "Page Number ");
        \u0275\u0275elementStart(120, "div", 13)(121, "div", 14);
        \u0275\u0275element(122, "mat-checkbox", 43);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(123, "span", 44);
        \u0275\u0275text(124, "Swap sides on even no. pages ");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(125, "div", 45)(126, "div", 19)(127, "mat-select", 46);
        \u0275\u0275template(128, TranscriptThemeComponent_mat_option_128_Template, 2, 6, "mat-option", 21);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(129, "div", 24)(130, "mat-select", 47);
        \u0275\u0275template(131, TranscriptThemeComponent_mat_option_131_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(132, "div", 48)(133, "div", 14);
        \u0275\u0275element(134, "mat-checkbox", 49);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(135, "span", 50);
        \u0275\u0275text(136, "Include ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(137, "div", 24)(138, "mat-select", 51);
        \u0275\u0275template(139, TranscriptThemeComponent_mat_option_139_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(140, "div", 12)(141, "h6", 52);
        \u0275\u0275text(142, "Align");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(143, "div", 53)(144, "div", 24)(145, "mat-select", 54);
        \u0275\u0275template(146, TranscriptThemeComponent_mat_option_146_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(147, "div", 24)(148, "mat-select", 55);
        \u0275\u0275template(149, TranscriptThemeComponent_mat_option_149_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(150, "div", 53)(151, "span", 56);
        \u0275\u0275text(152, "Start pg 1 on");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(153, "div", 24)(154, "mat-select", 57);
        \u0275\u0275template(155, TranscriptThemeComponent_mat_option_155_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()()()()()();
        \u0275\u0275element(156, "div", 58);
        \u0275\u0275elementStart(157, "div", 4)(158, "div", 59)(159, "h3", 60);
        \u0275\u0275text(160, "Line Number");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(161, "div", 14)(162, "mat-checkbox", 61);
        \u0275\u0275listener("change", function TranscriptThemeComponent_Template_mat_checkbox_change_162_listener() {
          return ctx.toggleCheckbox("showLineNumber");
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(163, "span", 16);
        \u0275\u0275text(164, "Show");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(165, "div", 62)(166, "div", 19)(167, "mat-select", 63);
        \u0275\u0275template(168, TranscriptThemeComponent_mat_option_168_Template, 2, 6, "mat-option", 21);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(169, "div", 24)(170, "mat-select", 64);
        \u0275\u0275template(171, TranscriptThemeComponent_mat_option_171_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(172, "div", 9)(173, "div", 59)(174, "h3", 65);
        \u0275\u0275text(175, "Time Stamp");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(176, "div", 14)(177, "mat-checkbox", 66);
        \u0275\u0275listener("change", function TranscriptThemeComponent_Template_mat_checkbox_change_177_listener() {
          return ctx.toggleCheckbox("showTimeStamp");
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(178, "span", 16);
        \u0275\u0275text(179, "Show");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(180, "div", 62)(181, "div", 19)(182, "mat-select", 67);
        \u0275\u0275template(183, TranscriptThemeComponent_mat_option_183_Template, 2, 6, "mat-option", 21);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(184, "div", 24)(185, "mat-select", 68);
        \u0275\u0275template(186, TranscriptThemeComponent_mat_option_186_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275element(187, "div", 69);
        \u0275\u0275elementStart(188, "div", 70)(189, "div", 59)(190, "h3", 65);
        \u0275\u0275text(191, "Header & Footer");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(192, "div", 59)(193, "div", 14)(194, "mat-checkbox", 71);
        \u0275\u0275listener("change", function TranscriptThemeComponent_Template_mat_checkbox_change_194_listener() {
          return ctx.toggleCheckbox("showHeaderFooter");
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(195, "span", 16);
        \u0275\u0275text(196, "Show");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(197, "div", 59)(198, "div", 14)(199, "mat-checkbox", 72);
        \u0275\u0275listener("change", function TranscriptThemeComponent_Template_mat_checkbox_change_199_listener() {
          return ctx.toggleCheckbox("headerFooterOnCover");
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(200, "span", 16);
        \u0275\u0275text(201, "Header and footer on coverpage");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(202, "div", 73)(203, "div", 19)(204, "mat-select", 74);
        \u0275\u0275template(205, TranscriptThemeComponent_mat_option_205_Template, 2, 6, "mat-option", 21);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(206, "div", 24)(207, "mat-select", 75);
        \u0275\u0275template(208, TranscriptThemeComponent_mat_option_208_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(209, "div", 76)(210, "div", 77)(211, "div", 12)(212, "span", 16);
        \u0275\u0275text(213, "<Case Name>");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(214, "div", 78)(215, "div", 24)(216, "mat-select", 79);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_select_ngModelChange_216_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.theme.headerFooter.positions.caseName.vertical, $event) || (ctx.theme.headerFooter.positions.caseName.vertical = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TranscriptThemeComponent_Template_mat_select_selectionChange_216_listener() {
          return ctx.changeHeaderFooterPosition("vertical", "caseName", ctx.theme.headerFooter.positions.caseName.vertical);
        });
        \u0275\u0275template(217, TranscriptThemeComponent_mat_option_217_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(218, "div", 24)(219, "mat-select", 79);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_select_ngModelChange_219_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.theme.headerFooter.positions.caseName.horizontal, $event) || (ctx.theme.headerFooter.positions.caseName.horizontal = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TranscriptThemeComponent_Template_mat_select_selectionChange_219_listener() {
          return ctx.changeHeaderFooterPosition("horizontal", "caseName", ctx.theme.headerFooter.positions.caseName.horizontal);
        });
        \u0275\u0275template(220, TranscriptThemeComponent_mat_option_220_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(221, "div", 12)(222, "h6", 80);
        \u0275\u0275text(223, "<Volume & Date>");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(224, "div", 78)(225, "div", 24)(226, "mat-select", 79);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_select_ngModelChange_226_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.theme.headerFooter.positions.volumeDate.vertical, $event) || (ctx.theme.headerFooter.positions.volumeDate.vertical = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TranscriptThemeComponent_Template_mat_select_selectionChange_226_listener() {
          return ctx.changeHeaderFooterPosition("vertical", "volumeDate", ctx.theme.headerFooter.positions.volumeDate.vertical);
        });
        \u0275\u0275template(227, TranscriptThemeComponent_mat_option_227_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(228, "div", 24)(229, "mat-select", 79);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_select_ngModelChange_229_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.theme.headerFooter.positions.volumeDate.horizontal, $event) || (ctx.theme.headerFooter.positions.volumeDate.horizontal = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TranscriptThemeComponent_Template_mat_select_selectionChange_229_listener() {
          return ctx.changeHeaderFooterPosition("horizontal", "volumeDate", ctx.theme.headerFooter.positions.volumeDate.horizontal);
        });
        \u0275\u0275template(230, TranscriptThemeComponent_mat_option_230_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(231, "div", 81)(232, "div", 12)(233, "div", 78)(234, "div", 24)(235, "mat-select", 79);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_select_ngModelChange_235_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.theme.headerFooter.positions.companyName.vertical, $event) || (ctx.theme.headerFooter.positions.companyName.vertical = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TranscriptThemeComponent_Template_mat_select_selectionChange_235_listener() {
          return ctx.changeHeaderFooterPosition("vertical", "companyName", ctx.theme.headerFooter.positions.companyName.vertical);
        });
        \u0275\u0275template(236, TranscriptThemeComponent_mat_option_236_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(237, "div", 24)(238, "mat-select", 79);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_select_ngModelChange_238_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.theme.headerFooter.positions.companyName.horizontal, $event) || (ctx.theme.headerFooter.positions.companyName.horizontal = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TranscriptThemeComponent_Template_mat_select_selectionChange_238_listener() {
          return ctx.changeHeaderFooterPosition("horizontal", "companyName", ctx.theme.headerFooter.positions.companyName.horizontal);
        });
        \u0275\u0275template(239, TranscriptThemeComponent_mat_option_239_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(240, "span", 16);
        \u0275\u0275text(241, "<Company Name>");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(242, "div", 12)(243, "div", 78)(244, "div", 24)(245, "mat-select", 79);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_select_ngModelChange_245_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.theme.headerFooter.positions.companyInfo.vertical, $event) || (ctx.theme.headerFooter.positions.companyInfo.vertical = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TranscriptThemeComponent_Template_mat_select_selectionChange_245_listener() {
          return ctx.changeHeaderFooterPosition("vertical", "companyInfo", ctx.theme.headerFooter.positions.companyInfo.vertical);
        });
        \u0275\u0275template(246, TranscriptThemeComponent_mat_option_246_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(247, "div", 24)(248, "mat-select", 79);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptThemeComponent_Template_mat_select_ngModelChange_248_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.theme.headerFooter.positions.companyInfo.horizontal, $event) || (ctx.theme.headerFooter.positions.companyInfo.horizontal = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TranscriptThemeComponent_Template_mat_select_selectionChange_248_listener() {
          return ctx.changeHeaderFooterPosition("horizontal", "companyInfo", ctx.theme.headerFooter.positions.companyInfo.horizontal);
        });
        \u0275\u0275template(249, TranscriptThemeComponent_mat_option_249_Template, 2, 2, "mat-option", 26);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(250, "h6", 80);
        \u0275\u0275text(251, "<Company Info>");
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(252, "div", 31)(253, "button", 82);
        \u0275\u0275listener("click", function TranscriptThemeComponent_Template_button_click_253_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275text(254);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(255, "button", 83);
        \u0275\u0275listener("click", function TranscriptThemeComponent_Template_button_click_255_listener() {
          return ctx.onCancel();
        });
        \u0275\u0275text(256, "Cancel");
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(257, "div", 13)(258, "div", 84)(259, "mat-checkbox", 85);
        \u0275\u0275listener("change", function TranscriptThemeComponent_Template_mat_checkbox_change_259_listener() {
          return ctx.toggleCheckbox("markAsDefault");
        });
        \u0275\u0275elementStart(260, "span", 16);
        \u0275\u0275text(261, "Mark as default");
        \u0275\u0275elementEnd()()()()();
      }
      if (rf & 2) {
        let tmp_1_0;
        let tmp_4_0;
        let tmp_6_0;
        \u0275\u0275property("formGroup", ctx.TransForm);
        \u0275\u0275advance(9);
        \u0275\u0275property("ngIf", ((tmp_1_0 = ctx.TransForm.get("cName")) == null ? null : tmp_1_0.invalid) && ((tmp_1_0 = ctx.TransForm.get("cName")) == null ? null : tmp_1_0.touched));
        \u0275\u0275advance(14);
        \u0275\u0275styleMap(\u0275\u0275pureFunction1(76, _c0, ctx.theme.coverPage.font + " !important"));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.fontOptions);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ((tmp_4_0 = ctx.TransForm.get("nCFontid")) == null ? null : tmp_4_0.invalid) && ((tmp_4_0 = ctx.TransForm.get("nCFontid")) == null ? null : tmp_4_0.touched));
        \u0275\u0275advance(4);
        \u0275\u0275property("ngForOf", ctx.fontSizeOptions);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ((tmp_6_0 = ctx.TransForm.get("nCFontsize")) == null ? null : tmp_6_0.invalid) && ((tmp_6_0 = ctx.TransForm.get("nCFontsize")) == null ? null : tmp_6_0.touched));
        \u0275\u0275advance(13);
        \u0275\u0275twoWayProperty("ngModel", ctx.checkboxStates.boldCaseType);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(78, _c1));
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.checkboxStates.boldParties);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(79, _c1));
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.checkboxStates.boldBefore);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(80, _c1));
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.checkboxStates.boldAppearances);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(81, _c1));
        \u0275\u0275advance(10);
        \u0275\u0275styleMap(\u0275\u0275pureFunction1(82, _c0, ctx.theme.bodyText.font + " !important"));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.fontOptions);
        \u0275\u0275advance(4);
        \u0275\u0275property("ngForOf", ctx.fontSizeOptions);
        \u0275\u0275advance(6);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 0.5);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 1);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 1.5);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 2);
        \u0275\u0275advance(7);
        \u0275\u0275property("value", 0);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 8);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 10);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 14);
        \u0275\u0275advance(8);
        \u0275\u0275twoWayProperty("ngModel", ctx.checkboxStates.boldQuestion);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(84, _c1));
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.checkboxStates.boldSpeaker);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(85, _c1));
        \u0275\u0275advance(14);
        \u0275\u0275styleMap(\u0275\u0275pureFunction1(86, _c0, ctx.TransForm.value.nPNFont));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.fontOptions);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.fontSizeOptions);
        \u0275\u0275advance(8);
        \u0275\u0275property("ngForOf", ctx.pageNumberPositions);
        \u0275\u0275advance(7);
        \u0275\u0275property("ngForOf", ctx.verticalPositions);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.horizontalPositions);
        \u0275\u0275advance(6);
        \u0275\u0275property("ngForOf", ctx.pageStartOptions);
        \u0275\u0275advance(12);
        \u0275\u0275styleMap(\u0275\u0275pureFunction1(88, _c0, ctx.TransForm.value.nLFont + " !important"));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.fontOptions);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.fontSizeOptions);
        \u0275\u0275advance(11);
        \u0275\u0275styleMap(\u0275\u0275pureFunction1(90, _c0, ctx.TransForm.value.nTFont + " !important"));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.fontOptions);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.fontSizeOptions);
        \u0275\u0275advance(19);
        \u0275\u0275property("ngForOf", ctx.fontOptions);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.fontSizeOptions);
        \u0275\u0275advance(8);
        \u0275\u0275twoWayProperty("ngModel", ctx.theme.headerFooter.positions.caseName.vertical);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(92, _c1));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.verticalPositions);
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.theme.headerFooter.positions.caseName.horizontal);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(93, _c1));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.horizontalPositions);
        \u0275\u0275advance(6);
        \u0275\u0275twoWayProperty("ngModel", ctx.theme.headerFooter.positions.volumeDate.vertical);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(94, _c1));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.verticalPositions);
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.theme.headerFooter.positions.volumeDate.horizontal);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(95, _c1));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.horizontalPositions);
        \u0275\u0275advance(5);
        \u0275\u0275twoWayProperty("ngModel", ctx.theme.headerFooter.positions.companyName.vertical);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(96, _c1));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.verticalPositions);
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.theme.headerFooter.positions.companyName.horizontal);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(97, _c1));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.horizontalPositions);
        \u0275\u0275advance(6);
        \u0275\u0275twoWayProperty("ngModel", ctx.theme.headerFooter.positions.companyInfo.vertical);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(98, _c1));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.verticalPositions);
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.theme.headerFooter.positions.companyInfo.horizontal);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(99, _c1));
        \u0275\u0275advance();
        \u0275\u0275property("ngForOf", ctx.horizontalPositions);
        \u0275\u0275advance(5);
        \u0275\u0275textInterpolate(ctx.TransForm.value.permission == "N" ? "Create" : "Update");
      }
    }, dependencies: [FormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, NgModel, ReactiveFormsModule, FormGroupDirective, FormControlName, CommonModule, NgForOf, NgIf, MatCheckboxModule, MatCheckbox, MatSelectModule, MatError, MatSelect, MatOption, MatFormFieldModule], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TranscriptThemeComponent, { className: "TranscriptThemeComponent", filePath: "src\\app\\adminpanel\\components\\transscript\\transcript-theme\\transcript-theme.component.ts", lineNumber: 24 });
})();

// src/app/adminpanel/services/theme-css.service.ts
var ThemeCssService = class _ThemeCssService {
  constructor() {
    this.ROOT_ELEMENT = document.documentElement;
    this.fontOptions = [
      {
        nValue: 1,
        cKey: "Calibri",
        jOther: { font: "calibri" }
      },
      {
        nValue: 2,
        cKey: "Georgia",
        jOther: { font: "georgia" }
      },
      {
        nValue: 3,
        cKey: "courier",
        jOther: { font: "courier" }
      },
      {
        nValue: 4,
        cKey: "Times New Roman",
        jOther: { font: "times" }
      },
      {
        nValue: 5,
        cKey: "Open Sans",
        jOther: { font: "Open Sans" }
      },
      {
        nValue: 6,
        cKey: "Arial",
        jOther: { font: "arial" }
      }
    ];
    this.cssvaribles = [];
  }
  setThemeVariables(theme) {
    this.cssvaribles = [];
    this.setCssVariable("--before-gap", theme?.nBFHeight == 0 ? "10px" : `${theme?.nBFHeight}px`);
    this.setCssVariable("--between-gap", theme?.nBTHeight == 0 ? "10px" : `${theme?.nBTHeight}px`);
    this.setCssVariable("--appear-gap", theme?.nAHeight == 0 ? "10px" : `${theme?.nAHeight}px`);
    this.setCssVariable("--titlepage-header-gap", theme?.nTHHeight == 0 ? "10px" : `${theme?.nTHHeight}px`);
    this.setCssVariable("--casetype-align", theme?.cCAlign == "C" ? "center" : "left");
    this.setCssVariable("--appearances-align", theme?.cBehalfAlign == "C" ? "center" : "left");
    this.setCssVariable("--cover-font-family", theme?.nCFontid ? this.fontOptions.find((f) => f.nValue == theme?.cCFont)?.jOther.font || "Courier Prime" : "Courier Prime");
    this.setCssVariable("--cover-font-size", theme?.nCFontsize ? `${theme?.nCFontsize}px` : "12pt");
    this.setCssVariable("--body-font-family", theme?.nBFont ? this.fontOptions.find((f) => f.nValue == theme?.nBFont)?.jOther.font || "Courier Prime" : "Courier Prime");
    this.setCssVariable("--body-font-size", `${theme?.nBFontsize}px` || "17px");
    this.setCssVariable("--body-letter-spacing", theme?.nBLetterspacing == null ? "0.5px" : `${theme?.nBLetterspacing}px`);
    this.setCssVariable("--body-line-spacing", theme?.nBLinespacing == 0 ? "0px" : `${theme?.nBLinespacing}px`);
    this.setCssVariable("--page-number-font-family", theme?.nPNFont ? this.fontOptions.find((f) => f.nValue == theme?.nPNFont)?.jOther.font || "Courier Prime" : "Courier Prime");
    let pageNumberFontSize = theme?.nPNFontsize == null ? "14px" : `${theme?.nPNFontsize}px`;
    this.setCssVariable("--page-number-font-size", pageNumberFontSize);
    this.setCssVariable("--page-number-vertical-align", theme?.cPNAlignTB ? theme?.cPNAlignTB.toLowerCase() : "bottom");
    this.setCssVariable("--page-number-horizontal-align", theme?.cPNAlignRL ? theme?.cPNAlignRL?.toLowerCase() : "right");
    this.setCssVariable("--line-number-font-family", theme?.nLFont ? this.fontOptions.find((f) => f.nValue == theme?.nLFont)?.jOther.font || "Courier Prime" : "Courier Prime");
    let lineNumberFontSize = theme?.nLFontsize == null ? "14px" : `${theme?.nLFontsize}px`;
    this.setCssVariable("--line-number-font-size", lineNumberFontSize);
    this.setCssVariable("--line-number-display", theme?.bLNShow == null ? "inline" : theme?.bLNShow ? "inline" : "none");
    this.setCssVariable("--timestamp-font-family", theme?.nTFont ? this.fontOptions.find((f) => f.nValue == theme?.nTFont)?.jOther.font || "Courier Prime" : "Courier Prime");
    let timestampFontSize = theme?.nTFontsize == null ? "14px" : `${theme?.nTFontsize}px`;
    this.setCssVariable("--timestamp-font-size", timestampFontSize);
    this.setCssVariable("--timestamp-display", theme?.bTShow == null ? "inline" : theme?.bTShow ? "inline" : "none");
    this.setCssVariable("--header-footer-font-family", theme?.nHFont ? this.fontOptions.find((f) => f.nValue == theme?.nHFont)?.jOther.font || "Courier Prime" : "Courier Prime");
    let headerFooterFontSize = theme?.nHFontsize == null ? "14px" : `${theme?.nHFontsize}px`;
    this.setCssVariable("--header-footer-font-size", headerFooterFontSize);
    this.setCssVariable("--header-footer-display", theme?.bHShow == null ? "table" : theme?.bHShow ? "table" : "none");
    this.setCssVariable("--header-footer-cover-display", theme?.bHCover == null ? "block" : theme?.bHCover ? "block" : "none");
    this.setCssVariable(`--caseName-vertical`, (theme?.cPCaseName).includes("B") ? "bottom" : "top");
    this.setCssVariable(`--caseName-horizontal`, (theme?.cPCaseName).includes("R") ? "right" : "left");
    this.setCssVariable(`--volumeDate-vertical`, (theme?.cPVolumeDate).includes("B") ? "bottom" : "top");
    this.setCssVariable(`--volumeDate-horizontal`, (theme?.cPVolumeDate).includes("R") ? "right" : "left");
    this.setCssVariable(`--volumeDate-vertical`, (theme?.cPCompany).includes("B") ? "bottom" : "top");
    this.setCssVariable(`--volumeDate-horizontal`, (theme?.cPCompany).includes("R") ? "right" : "left");
    this.setCssVariable(`--volumeDate-vertical`, (theme?.cPCompanyInfo).includes("B") ? "bottom" : "top");
    this.setCssVariable(`--volumeDate-horizontal`, (theme?.cPCompanyInfo).includes("R") ? "right" : "left");
    this.setCssVariable("--case-type-bold", (theme?.jCBold).includes("C") ? "700" : "400");
    this.setCssVariable("--parties-bold", (theme?.jCBold).includes("P") ? "700" : "400");
    this.setCssVariable("--before-bold", (theme?.jCBold).includes("B") ? "700" : "400");
    this.setCssVariable("--appearances-bold", (theme?.jCBold).includes("A") ? "700" : "400");
    this.setCssVariable("--question-bold", (theme?.jCBold).includes("Q") ? "700" : "400");
    this.setCssVariable("--speaker-bold", (theme?.jCBold).includes("S") ? "700" : "400");
    return Promise.resolve(true);
  }
  setCssVariable(name, value) {
    this.ROOT_ELEMENT.style.setProperty(name, value);
    this.cssvaribles.push({ name, value });
  }
  static {
    this.\u0275fac = function ThemeCssService_Factory(t) {
      return new (t || _ThemeCssService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ThemeCssService, factory: _ThemeCssService.\u0275fac, providedIn: "root" });
  }
};

// src/app/adminpanel/components/transscript/transcript-preview.component.ts
var _c02 = ["printSection"];
function TranscriptPreviewComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1)(1, "h6", 5);
    \u0275\u0275text(2, "Print preview");
    \u0275\u0275elementEnd()();
  }
}
function TranscriptPreviewComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2)(1, "div", 6)(2, "div", 7)(3, "p", 8);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r0.errorMessage);
  }
}
function TranscriptPreviewComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 3, 0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("innerHTML", ctx_r0.htmlContent, \u0275\u0275sanitizeHtml);
  }
}
function TranscriptPreviewComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275element(1, "img", 9);
    \u0275\u0275elementEnd();
  }
}
function TranscriptPreviewComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2)(1, "div", 10)(2, "table", 11)(3, "tr", 12)(4, "td")(5, "div", 13);
    \u0275\u0275element(6, "div", 14)(7, "div", 15)(8, "div", 16)(9, "div", 17);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(10, "tr", 18)(11, "td")(12, "div", 19)(13, "div", 20)(14, "p");
    \u0275\u0275element(15, "span", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275element(16, "p", 22)(17, "p", 23)(18, "pre", 22)(19, "p", 23)(20, "div", 24)(21, "div", 25)(22, "p", 22)(23, "pre", 23)(24, "p", 22);
    \u0275\u0275elementEnd();
    \u0275\u0275element(25, "div", 17);
    \u0275\u0275elementStart(26, "div", 26);
    \u0275\u0275element(27, "pre", 22)(28, "pre", 23)(29, "pre", 22)(30, "p", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(31, "div", 27);
    \u0275\u0275element(32, "pre", 22)(33, "pre", 23)(34, "p", 22);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(35, "tr")(36, "td")(37, "p", 28);
    \u0275\u0275element(38, "span", 29)(39, "br");
    \u0275\u0275elementEnd()()()()()();
  }
}
var TranscriptPreviewComponent = class _TranscriptPreviewComponent {
  constructor(dialogRef, data, themeCssService, transcriptS, cdr, datePipe) {
    this.dialogRef = dialogRef;
    this.data = data;
    this.themeCssService = themeCssService;
    this.transcriptS = transcriptS;
    this.cdr = cdr;
    this.datePipe = datePipe;
    this.formData = {};
    this.type = "";
    this.typeChange = new EventEmitter();
    this.isPrintLoadingChange = new EventEmitter();
    this.isPrintLoading = false;
    this.willprint = false;
    this.willprintChange = new EventEmitter();
    this.casetypeAlign = "center";
    this.isFileError = false;
    this.errorMessage = "";
    this.themes = [
      {
        "name": "Times + All Bold + Left Aligned",
        "isDefault": true,
        "casetypealign": "left",
        "coverPage": {
          "font": "times",
          "fontSize": "14px",
          "allCapsCase": true,
          "boldCaseType": true,
          "boldParties": true,
          "boldBefore": true,
          "boldAppearances": true
        },
        "bodyText": {
          "font": "times",
          "fontSize": "12px",
          "letterSpacing": "Normal",
          "lineSpacing": "24",
          "boldQuestion": true,
          "boldSpeaker": true
        },
        "pageNumber": {
          "align": {
            "vertical": "Bottom",
            "horizontal": "Center"
          },
          "position": "Bracket",
          "startPage": "pg 1",
          "include": true,
          "swapSide": false,
          "font": "times",
          "fontSize": "12px",
          "showLineNumber": true
        },
        "lineNumber": {
          "show": true,
          "font": "times",
          "fontSize": "12px"
        },
        "timeStamp": {
          "show": true,
          "font": "times",
          "fontSize": "12px"
        },
        "headerFooter": {
          "show": true,
          "showOnCover": true,
          "font": "times",
          "fontSize": "12px",
          "positions": {
            "caseName": {
              "vertical": "Top",
              "horizontal": "Center"
            },
            "volumeDate": {
              "vertical": "Top",
              "horizontal": "Right"
            },
            "companyName": {
              "vertical": "Bottom",
              "horizontal": "Left"
            },
            "companyInfo": {
              "vertical": "Bottom",
              "horizontal": "Right"
            }
          }
        }
      },
      {
        "name": "Georgia + Wide Spacing + No Line Numbers",
        "isDefault": false,
        "casetypealign": "center",
        "coverPage": {
          "font": "georgia",
          "fontSize": "16px",
          "allCapsCase": false,
          "boldCaseType": true,
          "boldParties": true,
          "boldBefore": false,
          "boldAppearances": false
        },
        "bodyText": {
          "font": "georgia",
          "fontSize": "14px",
          "letterSpacing": "Wide",
          "lineSpacing": "28",
          "boldQuestion": true,
          "boldSpeaker": false
        },
        "pageNumber": {
          "align": {
            "vertical": "Bottom",
            "horizontal": "Right"
          },
          "position": "Simple",
          "startPage": "pg 1",
          "include": true,
          "swapSide": false,
          "font": "georgia",
          "fontSize": "12px",
          "showLineNumber": false
        },
        "lineNumber": {
          "show": false,
          "font": "georgia",
          "fontSize": "12px"
        },
        "timeStamp": {
          "show": true,
          "font": "georgia",
          "fontSize": "12px"
        },
        "headerFooter": {
          "show": true,
          "showOnCover": false,
          "font": "georgia",
          "fontSize": "12px",
          "positions": {
            "caseName": {
              "vertical": "Top",
              "horizontal": "Left"
            },
            "volumeDate": {
              "vertical": "Top",
              "horizontal": "Right"
            },
            "companyName": {
              "vertical": "Bottom",
              "horizontal": "Left"
            },
            "companyInfo": {
              "vertical": "Bottom",
              "horizontal": "Right"
            }
          }
        }
      },
      {
        "name": "Courier + Compact + All Numbers",
        "isDefault": false,
        "casetypealign": "center",
        "coverPage": {
          "font": "courier",
          "fontSize": "12px",
          "allCapsCase": false,
          "boldCaseType": true,
          "boldParties": true,
          "boldBefore": true,
          "boldAppearances": false
        },
        "bodyText": {
          "font": "courier",
          "fontSize": "11px",
          "letterSpacing": "Normal",
          "lineSpacing": "18",
          "boldQuestion": false,
          "boldSpeaker": true
        },
        "pageNumber": {
          "align": {
            "vertical": "Bottom",
            "horizontal": "Right"
          },
          "position": "Simple",
          "startPage": "pg 1",
          "include": true,
          "swapSide": false,
          "font": "courier",
          "fontSize": "10px",
          "showLineNumber": true
        },
        "lineNumber": {
          "show": true,
          "font": "courier",
          "fontSize": "10px"
        },
        "timeStamp": {
          "show": true,
          "font": "courier",
          "fontSize": "10px"
        },
        "headerFooter": {
          "show": true,
          "showOnCover": true,
          "font": "courier",
          "fontSize": "10px",
          "positions": {
            "caseName": {
              "vertical": "Top",
              "horizontal": "Left"
            },
            "volumeDate": {
              "vertical": "Top",
              "horizontal": "Right"
            },
            "companyName": {
              "vertical": "Bottom",
              "horizontal": "Left"
            },
            "companyInfo": {
              "vertical": "Bottom",
              "horizontal": "Right"
            }
          }
        }
      },
      {
        "name": "Open Sans + No timestamp + No header/footer ",
        "isDefault": false,
        "casetypealign": "center",
        "coverPage": {
          "font": "Open Sans",
          "fontSize": "12px",
          "allCapsCase": false,
          "boldCaseType": true,
          "boldParties": true,
          "boldBefore": true,
          "boldAppearances": false
        },
        "bodyText": {
          "font": "Open Sans",
          "fontSize": "11px",
          "letterSpacing": "Normal",
          "lineSpacing": "18",
          "boldQuestion": false,
          "boldSpeaker": true
        },
        "pageNumber": {
          "align": {
            "vertical": "Bottom",
            "horizontal": "Right"
          },
          "position": "Simple",
          "startPage": "pg 1",
          "include": true,
          "swapSide": false,
          "font": "Open Sans",
          "fontSize": "10px",
          "showLineNumber": true
        },
        "lineNumber": {
          "show": false,
          "font": "Open Sans",
          "fontSize": "10px"
        },
        "timeStamp": {
          "show": false,
          "font": "Open Sans",
          "fontSize": "10px"
        },
        "headerFooter": {
          "show": false,
          "showOnCover": true,
          "font": "Open Sans",
          "fontSize": "10px",
          "positions": {
            "caseName": {
              "vertical": "Top",
              "horizontal": "Left"
            },
            "volumeDate": {
              "vertical": "Top",
              "horizontal": "Right"
            },
            "companyName": {
              "vertical": "Bottom",
              "horizontal": "Left"
            },
            "companyInfo": {
              "vertical": "Bottom",
              "horizontal": "Right"
            }
          }
        }
      }
    ];
    this.pages = [];
    this.lines = [];
    this.isPrintPreview = false;
    this.isPrint = false;
    this.isFullSize = false;
    this.currentPage = 1;
    this.timestamp = /* @__PURE__ */ new Date();
    this.lineNumbers = Array(25).fill(0).map((_, i) => i + 1);
    this.scale = 0.75;
    this.HFDetails = {
      "TL": {
        value1: "",
        value2: ""
      },
      "TR": {
        value1: "",
        value2: ""
      },
      "BL": {
        value1: "",
        value2: ""
      },
      "BR": {
        value1: "",
        value2: ""
      }
    };
    this.isloading = false;
    if (data && data.formData && data.formData.cTransid) {
      this.type = data.type;
      const cPath = data.formData.cHtmlpath;
      this.isPrintPreview = true;
      this.isFullSize = data.isFullSize;
      this.getHtmlContent(cPath, data.formData.cTransid, "FST");
    }
  }
  getHtmlContent(cPath, cTransid, type) {
    return __async(this, null, function* () {
      this.isFileError = false;
      this.isloading = true;
      const data = yield this.transcriptS.getTranscriptHtmlFile(cPath, cTransid, type);
      this.isloading = false;
      if (data.msg == 1) {
        this.htmlContent = data.data;
      } else {
        this.isFileError = true;
        this.errorMessage = data.error || "File loading error";
      }
    });
  }
  zoomIn() {
    this.scale = Math.min(this.scale + 0.1, 1.5);
    this.updateScale();
  }
  zoomOut() {
    this.scale = Math.max(this.scale - 0.1, 0.5);
    this.updateScale();
  }
  resetZoom() {
    this.scale = 0.75;
    this.updateScale();
  }
  updateScale() {
    document.documentElement.style.setProperty("--preview-scale", this.scale.toString());
  }
  ngOnInit() {
    this.updateScale();
  }
  getSpeakerClass(line) {
    if (line % 5 === 0)
      return "line-SPKR";
    if (line % 5 === 1)
      return "line-SPKR-CONTINUE";
    if (line % 5 === 2)
      return "line-ANS-CONTINUE";
    if (line % 5 === 3)
      return "line-RHT-FLS";
    return "line-PRNTH";
  }
  onThemeChange(event) {
  }
  ngOnChanges(changes) {
    return __async(this, null, function* () {
      if (changes["htmlContent"]) {
        return;
      }
      if ((changes["changeTheme"] || changes["cPath"]) && this.cPath && this.formData.cTransid) {
        this.getHtmlContent(this.cPath, this.formData.cTransid, "FST");
        return;
      }
      if (this.formData && !changes["changeTheme"]?.firstChange) {
        if (this.formData?.cThemeid && this.formData?.cThemeid !== this.selectedTheme?.cThemeid) {
          this.getThemeDetail(this.formData.cThemeid);
          this.detectpostion();
        }
        setTimeout(() => {
          this.updateHtmlContent(this.formData);
        }, 100);
      }
      if (changes["isChangeTheme"] && !changes["isChangeTheme"].firstChange) {
        this.getHtmlContent(this.cPath, this.formData.cTransid, "FST");
      }
    });
  }
  getThemeDetail(themeId) {
    return __async(this, null, function* () {
      this.isloading = true;
      this.selectedTheme = yield this.transcriptS.getThemeDetail(themeId);
      this.detectpostion();
      this.selectedTheme.cCAlign = this.formData.cCAlign || "C";
      this.selectedTheme.cBehalfAlign = this.formData.cBehalfAlign || "C";
      if (this.lines.length && (this.type == "4UP" || this.type == "FST")) {
        if (this.willprint) {
          setTimeout(() => {
            this.printDiv();
          }, 1e3);
        }
      }
      console.log(this.selectedTheme);
      this.isloading = false;
      this.themeCssService.setCssVariable("--cover-font-family", this.selectedTheme?.nCFontid ? this.themeCssService.fontOptions.find((f) => f.nValue == this.selectedTheme?.nCFontid)?.jOther.font || "Courier Prime" : "Courier Prime");
      this.themeCssService.setCssVariable("--cover-font-size", this.selectedTheme?.nCFontsize ? `${this.selectedTheme?.nCFontsize}px` : "12pt");
      this.themeCssService.setCssVariable("--casetype-transform", this.selectedTheme?.bCIsCaps ? `uppercase` : "none");
      this.themeCssService.setCssVariable("--cover-width", this.selectedTheme?.bLMbrand ? `639.69px` : "660.69px");
      return true;
    });
  }
  getFileData() {
    return __async(this, null, function* () {
      this.isloading = true;
      const res = yield this.transcriptS.getFileDetail(this.formData.cPath);
      this.lines = res;
      if (res.length > 0) {
        const noOfPages = this.lines.reduce((max, curr) => Math.max(max, curr.pageno), 0);
        let pages = Array.from({ length: noOfPages }, (_, i) => i + 1);
        if (this.type == "4UP") {
          this.pages = pages.reduce((acc, curr, i) => {
            if (i % 4 === 0) {
              acc.push({
                page: [curr, curr + 1, curr + 2, curr + 3].filter((p) => p <= pages.length)
              });
            }
            return acc;
          }, []);
        } else {
          this.pages = pages.map((page) => ({
            page: [page]
          }));
        }
        console.log(this.pages);
      }
      this.isloading = false;
      return true;
    });
  }
  getLines(lines, page) {
    return lines.filter((line) => line.pageno === page);
  }
  printDiv() {
    this.isPrint = false;
    const printContents = this.printSectionRef.nativeElement.innerHTML;
    const top = Math.abs(window.outerHeight / 2 + window.screenY - 800 / 2);
    const left = window.outerWidth / 2 + window.screenX - 800 / 2;
    const popupWindow = window.open("", "PrintTranscript", `width=700,height=600,top=${top},left=${left},location=no,toolbar=no,menubar=no,status=no,titlebar=no,directories=no`);
    if (popupWindow) {
      this.isPrintLoading = false;
      const variables = this.themeCssService.cssvaribles;
      const cssVariablesText = variables.map((variable) => `${variable.name}: ${variable.value};`).join("\n              ");
      popupWindow.document.open();
      popupWindow.document.write(`
        <html>
          <head>
            <title>Print</title>
            <style>
              /* Inject CSS variables at the :root level */
              :root {
                ${cssVariablesText}
              }
              
  
              
@font-face {
  font-family: 'courier';
  src: url('./assets/fonts/styles/CourierPrime-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'courier';
  src: url('./assets/fonts/styles/CourierPrime-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}



@font-face {
  font-family: 'times';
  font-style: normal;
  font-weight: normal;
  src: local('Times New Roman'), url(./assets/fonts/styles/times.woff) format('woff')
}

@font-face {
  font-family: 'georgia';
  font-style: normal;
  font-weight: normal;
  src: local('Georgia Regular'), url(./assets/fonts/styles/georgia.woff) format('woff');
}


@font-face {
  font-family: 'arial';
  font-style: normal;
  font-weight: normal;
  src: local('Arial Regular'), url(./assets/fonts/styles/ARIAL.woff) format('woff');
}

@font-face {
  font-family: 'verdana';
  font-style: normal;
  font-weight: normal;
  src: local('Verdana'), url(./assets/fonts/styles/Verdana.ttf) format('ttf');
}

@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 700;
  font-stretch: 100%;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4jaVIGxA.woff2) format('woff2');
  unicode-range: U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF;
}

              
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');

* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.page-break {
  page-break-before: always;
}

@page {
  size: A4;
  margin: 30px 30px 20px;
}

.page {
  padding: 30px 0px 0px;
  position: relative;
  min-height: calc(297mm - 60px);
  height: calc(297mm - 60px);
  font-family: var(--cover-font-family, 'Courier Prime');
  font-size: var(--cover-font-size, '12px');
  background-color: #fff;
  width: calc(210mm - 60px);
  margin: 0 auto 0px;
}

.titlepage {
  position: relative;
}

.titlepage .text-1 {
  max-width: 100%;
  height: 64px;
  text-align: center;
  white-space: pre-wrap;
  margin-bottom: 0px;
  min-height: fit-content;
  max-height: fit-content;
  font-family: var(--cover-font-family);
  font-size: var(--cover-font-size);
  font-weight: var(--case-type-bold);
  text-align: var(--casetype-align);
}

.titlepage .text-center {
  text-align: center;
}

.titlepage .parties p,
.titlepage .parties pre,
.titlepage .parties span {
  font-weight: var(--parties-bold);
}

.titlepage .before p,
.titlepage .before pre,
.titlepage .before span {
  font-weight: var(--before-bold);
}

.titlepage .appear p,
.titlepage .appear pre,
.titlepage .appear span {
  font-weight: var(--appearances-bold);
}

.titlepage p,
.titlepage pre {
  font-size: var(--body-font-size, '17px');
  margin-bottom: 20px;
  letter-spacing: var(--body-letter-spacing, '1.2px');
}

.titlepage .text-end {
  text-align: end;
}

.titlepage .text-start {
  text-align: start;
}

.titlepage .divider {
  height: 1px;
  width: 100%;
  background-color: #c2c2c298;
  margin: 20px auto;
}

.titlepage .sidespace {
  padding: 0 50px;
  text-align: center;
}

.titlepage .sidespace>* {
  margin-bottom: 20px;
}

.titlepage .transriptby {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
}

.titlepage .maindivider {
  position: absolute;
  bottom: 60px;
  left: 60px;
  right: 60px;
  height: 1px;
  background-color: #c2c2c2;
  width: 90%;
}

.maindivider {
  height: 1px;
  background-color: #c2c2c2;
  width: 100%;
  margin: 20px 0;
}

.line-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
}

.timestamp {
  background: transparent !important;
  color: #747474;
  padding: 0 5px;
  font-size: var(--timestamp-font-size, '16px');
  text-align: right;
  white-space: nowrap;
  width: min-content;
  font-family: var(--timestamp-font-family);
  display: var(--timestamp-display);
}

.timestamp span:first-child {
  display: inline-block;
  width: 20px;
  margin-right: 5%;
}

.timestamp span:nth-child(2) {
  display: inline-block;
  width: 90px;
  text-align: start;
}

.line-no {
  background: transparent !important;
  color: #747474;
  padding: 0 5px;
  font-size: var(--line-number-font-size, '16px');
  text-align: right;
  white-space: nowrap;
  width: min-content;
  font-family: var(--line-number-font-family);
  display: var(--line-number-display);
}

.line-no span:first-child {
  display: inline-block;
  width: 20px;
  margin-right: 5%;
}

.line-no span:nth-child(2) {
  display: inline-block;
  width: 90px;
  text-align: start;
}

.line-text pre {
  font-size: var(--body-font-size, '17px');
  letter-spacing: var(--body-letter-spacing, '0.8px');
  font-weight: var(--body-font-weight, 400);
  font-family: var(--body-font-family);
  width: 100%;
  white-space: pre-wrap;
}

.line-text {
  color: #2a2929;
  padding: 0px 5px;
  font-size: var(--body-font-size, '17px');
  letter-spacing: var(--body-letter-spacing, '0.8px');
  height: fit-content;
  font-weight: var(--body-font-weight, 400);
  width: 100%;
}

.page-header {
  font-size: var(--header-footer-font-size, '16px');
  font-family: var(--header-footer-font-family);
  display: var(--header-footer-display);
  width: 100%;
}

.page-header td {
  vertical-align: top;
  padding-bottom: 10px;
}

.page-footer {
  font-size: var(--header-footer-font-size, '16px');
  font-family: var(--header-footer-font-family);
  display: var(--header-footer-display);
  width: 100%;
}

.page-footer td {
  vertical-align: top;
  padding-top: 10px;
}

.mainpageno {
  font-size: var(--page-number-font-size, '16px');
  font-family: var(--page-number-font-family);
}

.secondarypageno {
  font-size: var(--page-number-font-size, '16px');
  font-family: var(--page-number-font-family);
}

.head-right p,
.head-left p {
  font-size: var(--header-footer-font-size, '16px');
  font-family: var(--header-footer-font-family);
}

.head-right {
  text-align: right;
}

.data-header {
  padding: 10px 24px;
  background-color: #4f4f4f;
  color: #fff;
  font-size: var(--header-footer-font-size, '16px');
  font-weight: 500;
  margin-bottom: 20px;
  font-family: var(--header-footer-font-family);
}

.data-footer {
  display: var(--header-footer-display);
  width: 100%;
  font-family: var(--header-footer-font-family);
  font-size: var(--header-footer-font-size);
}

.line-SPKR .line-text {
  padding-left: 20px;
}

.line-SPKR .line-text .speaker {
  font-weight: var(--speaker-bold);
}

.line-SPKR+.line-SPKR .line-text {
  padding-left: 80px;
}

.line-SPKR-CONTINUE .line-text {
  padding-left: 120px;
}

.line-SPKR-CONTINUE+.line-SPKR-CONTINUE .line-text {
  padding-left: 80px;
}

.line-PRNTH .line-text {
  width: calc(100% - 68px);
}

.betweeen {
  letter-spacing: 7px !important;
  text-transform: uppercase;
}

p,
span {
  letter-spacing: 0.5px;
  word-spacing: 2px;
}

.text-end {
  text-align: end;
}

.case-type {
  font-weight: var(--case-type-bold);
}

.parties {
  font-weight: var(--parties-bold);
}

.before-section {
  font-weight: var(--before-bold);
}

.appearances {
  font-weight: var(--appearances-bold);
}

.question {
  font-weight: var(--question-bold);
}

.speaker {
  font-weight: var(--speaker-bold);
}

.lines-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--body-line-spacing, 20px);
  height: 100%;
}

.grid-container .lines-wrapper:nth-child(1) {
  border-right: 1px solid #c2c2c2;
}

.grid-container .lines-wrapper:nth-child(3) {
  border-right: 1px solid #c2c2c2;
  border-top: 1px solid #c2c2c2;
}

.grid-container .lines-wrapper:nth-child(4) {
  border-top: 1px solid #c2c2c2;
}

.page-wrapper {
  gap: 10px;
  padding: 10px 0px;
  height: calc(100% - 100px);
}

.grid-container .lines-wrapper {
  gap: 0px !important;
  padding: 10px 0px 10px 10px;
}

.grid-container {
  height: calc(100% - 100px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-content: flex-start;
}

.grid-container .line-text {
  font-size: 9px !important;
  line-height: 1.5;
}

.grid-container .line-text pre {
  font-size: 9px !important;
  line-height: 1.5;
}

.grid-container .line-no {
  font-size: 10px !important;
  line-height: 1.5;
}

.grid-container .secondarypageno {
  font-size: 12px !important;
}
.grid-container .timestamp {
  display: none;
  font-size: 9px !important;
  line-height: 1.5;
}

.whitespace-nowrap {
  white-space: nowrap;
}

.flex {
  display: flex;
}

.px-5 {
  padding-left: 20px;
  padding-right: 20px;
}

.flex-column {
  flex-direction: column;
}

.flex-row {
  flex-direction: row;
}

.justify-end {
  justify-content: flex-end;
}

.justify-start {
  justify-content: flex-start;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.items-start {
  align-items: flex-start;
}

.items-end {
  align-items: flex-end;
}

.items-between {
  align-items: space-between;
}



.swape-page-Left:nth-child(even) {
  .page-number-right {
    display: none;
  }
}

.swape-page-Left:nth-child(odd) {
  .page-number-left {
    display: none;
  }
}

.swape-page-Right:nth-child(even) {
  .page-number-left {
    display: none;
  }
}

.swape-page-Right:nth-child(odd) {
  .page-number-right {
    display: none;
  }
}

.no-margin{
  margin: 0 !important;
}

            </style>
          </head>
          <body onload="window.print()">
            ${printContents}
          </body>
        </html>
      `);
      popupWindow.document.close();
      this.typeChange.emit("");
      this.isPrintLoading = false;
      this.isPrintLoadingChange.emit(false);
      this.willprintChange.emit(false);
    } else {
      this.typeChange.emit("");
      this.isPrintLoading = false;
      this.isPrintLoadingChange.emit(false);
      this.willprintChange.emit(false);
    }
  }
  // Helper method to extract all CSS variables from computed style
  extractCssVariables(computedStyle) {
    const cssVariables = {};
    for (let i = 0; i < computedStyle.length; i++) {
      const prop = computedStyle[i];
      if (prop.startsWith("--")) {
        const key = prop.substring(2);
        const value = computedStyle.getPropertyValue(prop).trim();
        if (value) {
          cssVariables[key] = value;
        }
      }
    }
    return cssVariables;
  }
  // Helper method to generate CSS variables string for injection
  generateCssVariablesString(cssVariables) {
    return Object.entries(cssVariables).map(([key, value]) => `--${key}: ${value};`).join("\n              ");
  }
  deteectlinebreak(linetext) {
    const computedStyle = getComputedStyle(document.body);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontFamily = computedStyle.getPropertyValue("--body-font-family") || "Arial, sans-serif";
    const fontSize = computedStyle.getPropertyValue("--body-font-size") || "16px";
    const letterSpacing = computedStyle.getPropertyValue("--body-letter-spacing") || "0px";
    const fontWeight = "normal";
    ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    const effectiveWidth = 548;
    let textWidth = ctx.measureText(linetext).width;
    if (letterSpacing !== "0px") {
      let letterSpacingPx = parseFloat(letterSpacing);
      if (letterSpacingPx !== 0) {
        const charCount = linetext.length;
        textWidth += (charCount - 1) * letterSpacingPx;
      }
    }
    return textWidth > effectiveWidth;
  }
  detectpostion() {
    const positions = {
      [this.selectedTheme?.cPCaseName]: {
        value1: this.formData?.cTitle || ""
      },
      [this.selectedTheme?.cPVolumeDate]: {
        value1: `${this.formData?.cTVolume || "#"}`,
        value2: this.datePipe.transform(this.formData?.dTDate, "dd MMM yyyy") || ""
      },
      [this.selectedTheme?.cPCompany]: {
        value1: this.formData?.cCompany || ""
      },
      [this.selectedTheme?.cPCompanyInfo]: {
        value1: this.formData?.cCompanyinfo || ""
      }
    };
    ["TL", "TR", "BL", "BR"].forEach((position) => {
      if (positions[position]) {
        this.HFDetails[position].value1 = positions[position].value1;
        this.HFDetails[position].value2 = positions[position].value2 || "";
      }
    });
    console.log("HFDetails", this.HFDetails);
  }
  updateHtmlContent(data) {
    const updateMultipleText = (id, value) => {
      const values = splittext(value);
      const existingElements = previewEl.querySelectorAll(`.${id}`);
      while (existingElements.length > values.length) {
        existingElements[existingElements.length - 1].remove();
      }
      console.log("existingElements", values);
      values.forEach((value2, index) => {
        let element = existingElements[index];
        if (!element) {
          element = document.createElement("pre");
          element.className = id;
          const lastElement = existingElements[existingElements.length - 1];
          if (lastElement) {
            lastElement.after(element);
          } else {
            previewEl.appendChild(element);
          }
        }
        element.textContent = value2 ?? "";
      });
    };
    const splittext = (text) => {
      const lines = text.split("\n");
      if (!lines.length) {
        lines.push(text);
      }
      return lines;
    };
    const previewEl = document.getElementById("printSectio");
    if (!previewEl)
      return;
    const updateText = (id, value) => {
      const el = previewEl.querySelector(`#${id}`);
      if (el)
        el.textContent = value ?? "";
    };
    const removeelement = (id) => {
      const el = previewEl.querySelector(`.${id}`);
      if (el)
        el.remove();
    };
    const addelement = (id, value) => {
      const el = previewEl.querySelector(`#${id}`);
      if (el)
        el.textContent = value ?? "";
    };
    const updatePositionText = (position, type, value) => {
      const el = previewEl.querySelectorAll(`.data-postion${position}-${type}`);
      for (let i = 0; i < el.length; i++) {
        const element = el[i];
        if (element) {
          element.textContent = value ?? "";
        }
      }
      ;
    };
    updateText("cCasetype", data.cCasetype);
    updateText("cCCaseno", data.cCCaseno);
    updateText("cCAlign", data.cCAlign);
    updateText("cClaimentH", "[" + data.cClaimentH + "]");
    updateText("cRespondentH", "[" + data.cRespondentH + "]");
    updateText("cCDay", data.cCDay);
    const dateEl = previewEl.querySelector("#dCDate");
    if (dateEl instanceof HTMLElement) {
      dateEl.textContent = "";
      dateEl.style.display = "none";
    }
    updateText("cBClaimentH", data.cBClaimentH);
    updateText("cBRespondentH", data.cBRespondentH);
    updateText("cReporter", data.cReporter);
    updateText("cTitle", data.cTitle);
    const positions = {
      [this.selectedTheme?.cPCaseName]: {
        value1: this.formData?.cTitle || ""
      },
      [this.selectedTheme?.cPVolumeDate]: {
        value1: `${this.formData?.cTVolume || "#"}`,
        value2: new Date(this.formData?.dTranscribedDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })
        // this.datePipe.transform(this.formData?.dTranscribedDate, 'dd MMM yyyy') || ''
      },
      [this.selectedTheme?.cPCompany]: {
        value1: this.formData?.cCompany || ""
      },
      [this.selectedTheme?.cPCompanyInfo]: {
        value1: this.formData?.cCompanyinfo || ""
      }
    };
    ["TL", "TR", "BL", "BR"].forEach((position) => {
      if (positions[position]) {
        this.HFDetails[position].value1 = positions[position].value1;
        this.HFDetails[position].value2 = positions[position].value2 || "";
      }
    });
    updatePositionText("1", "TL", this.HFDetails.TL.value1);
    updatePositionText("1", "TR", this.HFDetails.TR.value1);
    updatePositionText("1", "BL", this.HFDetails.BL.value1);
    updatePositionText("1", "BR", this.HFDetails.BR.value1);
    updatePositionText("2", "TL", this.HFDetails.TL.value2);
    updatePositionText("2", "TR", this.HFDetails.TR.value2);
    updatePositionText("2", "BL", this.HFDetails.BL.value2);
    updatePositionText("2", "BR", this.HFDetails.BR.value2);
  }
  static {
    this.\u0275fac = function TranscriptPreviewComponent_Factory(t) {
      return new (t || _TranscriptPreviewComponent)(\u0275\u0275directiveInject(MatDialogRef, 8), \u0275\u0275directiveInject(MAT_DIALOG_DATA, 8), \u0275\u0275directiveInject(ThemeCssService), \u0275\u0275directiveInject(TranscriptService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(DatePipe));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TranscriptPreviewComponent, selectors: [["app-transcript-preview"]], viewQuery: function TranscriptPreviewComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c02, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.printSectionRef = _t.first);
      }
    }, inputs: { htmlContent: "htmlContent", formData: "formData", type: "type", isPrintLoading: "isPrintLoading", willprint: "willprint", casetypeAlign: "casetypeAlign", changeTheme: "changeTheme", changeMultitext: "changeMultitext", isPrint: "isPrint", isFullSize: "isFullSize", cPath: "cPath" }, outputs: { typeChange: "typeChange", isPrintLoadingChange: "isPrintLoadingChange", willprintChange: "willprintChange" }, standalone: true, features: [\u0275\u0275ProvidersFeature([DatePipe]), \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 6, vars: 8, consts: [["printSectio", ""], [1, "min-h-8", "flex", "items-center", "!px-5", "bg-faint"], [1, "page-container", "transcript-preview-page", "overflow-auto", "bg-grey"], ["id", "printSectio", 3, "innerHTML"], [1, "fixed", "top-0", "left-0", "w-full", "h-full", "bg-black/75", "backdrop-blur-sm", "z-[999]", "flex", "items-center", "justify-center"], [1, "text-xs", "font-semibold"], [1, "page", "transcript-preview-page", "overflow-auto", "h-[400px]", "p-3", "w-[794px]", "bg-white", "mx-auto"], [1, "flex", "items-center", "justify-center", "h-full", "w-full", "bg-red-50", "border", "border-dashed", "border-red-500", "rounded-md"], [1, "text-red-500"], ["src", "../../../../assets/icons/loaderorange.svg", "alt", "loading", 1, "w-14", "h-14", "mx-auto", "animate-spin"], [1, "titlepage", "page", "page-break", "mb-3", "bg-white"], [2, "width", "100%"], [2, "height", "0"], [1, "sidespace", "gap-2.5"], [1, "maindivider", "opacity-0"], [1, "!p-0", "block", "w-52", "h-4", "bg-slate-200", "rounded-sm", "animate-pulse"], [1, "!p-0", "block", "w-20", "h-4", "bg-slate-200", "rounded-sm", "animate-pulse"], [1, "divider", "opacity-0"], [2, "vertical-align", "top"], [1, "sidespace"], [1, "parties", "gap-2.5"], [1, "h-4", "w-20", "bg-slate-200", "rounded-sm", "animate-pulse"], [1, "h-4", "w-20", "bg-slate-200", "rounded-sm", "animate-pulse", "!mx-auto"], [1, "h-4", "w-52", "bg-slate-200", "rounded-sm", "animate-pulse", "!mx-auto"], [1, "spacer"], [1, "divider"], [1, "before", "gap-2.5"], [1, "appear", "gap-2.5"], [1, "text-center"], [1, "h-4", "w-52", "bg-slate-200", "rounded-sm", "animate-pulse"]], template: function TranscriptPreviewComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, TranscriptPreviewComponent_Conditional_0_Template, 3, 0, "div", 1);
        \u0275\u0275elementStart(1, "div");
        \u0275\u0275template(2, TranscriptPreviewComponent_Conditional_2_Template, 5, 1, "div", 2)(3, TranscriptPreviewComponent_Conditional_3_Template, 2, 1, "div", 3)(4, TranscriptPreviewComponent_Conditional_4_Template, 2, 0, "div", 4)(5, TranscriptPreviewComponent_Conditional_5_Template, 40, 0, "div", 2);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.isFullSize ? 0 : -1);
        \u0275\u0275advance();
        \u0275\u0275classMapInterpolate1(" ", ctx.isFullSize ? "!p-5 bg-grey/60 overflow-auto" : "", "");
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.isFileError ? 2 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(3, !ctx.isloading && !ctx.isFileError ? 3 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(4, ctx.isPrintLoading ? 4 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(5, ctx.isloading ? 5 : -1);
      }
    }, dependencies: [CommonModule, MatSelectModule, FormsModule, ScrollingModule] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TranscriptPreviewComponent, { className: "TranscriptPreviewComponent", filePath: "src\\app\\adminpanel\\components\\transscript\\transcript-preview.component.ts", lineNumber: 21 });
})();

// src/app/adminpanel/components/transscript/transcript-properties/transcript-properties.component.ts
var _c03 = ["matSelect"];
var _forTrack0 = ($index, $item) => $item.cThemeid;
var _c12 = () => ({ standalone: true });
var _c2 = (a0) => ({ "min-width": a0 });
function TranscriptPropertiesComponent_For_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const theme_r1 = ctx.$implicit;
    \u0275\u0275property("value", theme_r1.cThemeid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", theme_r1.cName, " ");
  }
}
function TranscriptPropertiesComponent_Conditional_43_For_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r4 = ctx.$implicit;
    \u0275\u0275property("value", option_r4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r4);
  }
}
function TranscriptPropertiesComponent_Conditional_43_For_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r5 = ctx.$implicit;
    \u0275\u0275property("value", option_r5);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r5);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_36_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-content-editable", 86);
    \u0275\u0275listener("valueChange", function TranscriptPropertiesComponent_Conditional_43_Conditional_36_Template_app_content_editable_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.transcriptForm.controls["cClaimentH"].setValue($event));
    })("onFocusOut", function TranscriptPropertiesComponent_Conditional_43_Conditional_36_Template_app_content_editable_onFocusOut_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.editClaimant = false;
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cClaimentH"));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("suggestions", ctx_r2.caseTypeSuggestions)("value", ctx_r2.transcriptForm.value["cClaimentH"]);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_37_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_12_0;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate((tmp_12_0 = ctx_r2.transcriptForm.get("cClaimentH")) == null ? null : tmp_12_0.value);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_38_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 87);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_43_Conditional_38_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.editClaimant = true);
    });
    \u0275\u0275elementEnd();
  }
}
function TranscriptPropertiesComponent_Conditional_43_For_45_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r8 = ctx.$implicit;
    \u0275\u0275property("value", option_r8);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r8);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_50_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-content-editable", 88);
    \u0275\u0275listener("valueChange", function TranscriptPropertiesComponent_Conditional_43_Conditional_50_Template_app_content_editable_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.transcriptForm.controls["cRespondentH"].setValue($event));
    })("onFocusOut", function TranscriptPropertiesComponent_Conditional_43_Conditional_50_Template_app_content_editable_onFocusOut_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.editRespondent = false;
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cRespondentH"));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("suggestions", ctx_r2.caseTypeSuggestions)("value", ctx_r2.transcriptForm.value["cRespondentH"]);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_51_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_12_0;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate((tmp_12_0 = ctx_r2.transcriptForm.get("cRespondentH")) == null ? null : tmp_12_0.value);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_52_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 87);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_43_Conditional_52_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.editRespondent = true);
    });
    \u0275\u0275elementEnd();
  }
}
function TranscriptPropertiesComponent_Conditional_43_For_59_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r11 = ctx.$implicit;
    \u0275\u0275property("value", option_r11);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r11);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_63_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-content-editable", 89);
    \u0275\u0275listener("valueChange", function TranscriptPropertiesComponent_Conditional_43_Conditional_63_Template_app_content_editable_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.transcriptForm.controls["cArbitratorH"].setValue($event));
    })("onFocusOut", function TranscriptPropertiesComponent_Conditional_43_Conditional_63_Template_app_content_editable_onFocusOut_0_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.editArbitrator = false;
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cArbitratorH"));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("suggestions", ctx_r2.caseTypeSuggestions)("value", ctx_r2.transcriptForm.value["cArbitratorH"]);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_64_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_12_0;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate((tmp_12_0 = ctx_r2.transcriptForm.get("cArbitratorH")) == null ? null : tmp_12_0.value);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_65_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 87);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_43_Conditional_65_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.editArbitrator = true);
    });
    \u0275\u0275elementEnd();
  }
}
function TranscriptPropertiesComponent_Conditional_43_For_75_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r14 = ctx.$implicit;
    \u0275\u0275property("value", option_r14);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r14);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_84_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-content-editable", 90);
    \u0275\u0275listener("valueChange", function TranscriptPropertiesComponent_Conditional_43_Conditional_84_Template_app_content_editable_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.transcriptForm.controls["cBClaimentH"].setValue($event));
    })("onFocusOut", function TranscriptPropertiesComponent_Conditional_43_Conditional_84_Template_app_content_editable_onFocusOut_0_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.editBehalfClaimant = false;
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cBClaimentH"));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("suggestions", ctx_r2.caseTypeSuggestions)("value", ctx_r2.transcriptForm.value["cBClaimentH"]);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_85_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_12_0;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate((tmp_12_0 = ctx_r2.transcriptForm.get("cBClaimentH")) == null ? null : tmp_12_0.value);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_86_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 87);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_43_Conditional_86_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r16);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.editBehalfClaimant = true);
    });
    \u0275\u0275elementEnd();
  }
}
function TranscriptPropertiesComponent_Conditional_43_For_94_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r17 = ctx.$implicit;
    \u0275\u0275property("value", option_r17);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r17);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_99_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-content-editable", 91);
    \u0275\u0275listener("valueChange", function TranscriptPropertiesComponent_Conditional_43_Conditional_99_Template_app_content_editable_valueChange_0_listener($event) {
      \u0275\u0275restoreView(_r18);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.transcriptForm.controls["cBRespondentH"].setValue($event));
    })("onFocusOut", function TranscriptPropertiesComponent_Conditional_43_Conditional_99_Template_app_content_editable_onFocusOut_0_listener() {
      \u0275\u0275restoreView(_r18);
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.editBehalfRespondent = false;
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cBRespondentH"));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("suggestions", ctx_r2.caseTypeSuggestions)("value", ctx_r2.transcriptForm.value["cBRespondentH"]);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_100_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_12_0;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate((tmp_12_0 = ctx_r2.transcriptForm.get("cBRespondentH")) == null ? null : tmp_12_0.value);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Conditional_101_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 87);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_43_Conditional_101_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r19);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.editBehalfRespondent = true);
    });
    \u0275\u0275elementEnd();
  }
}
function TranscriptPropertiesComponent_Conditional_43_For_109_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r20 = ctx.$implicit;
    \u0275\u0275property("value", option_r20);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r20);
  }
}
function TranscriptPropertiesComponent_Conditional_43_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 42)(1, "div", 43)(2, "div", 44)(3, "span", 19);
    \u0275\u0275text(4, "Case Type");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "mat-form-field", 45)(6, "textarea", 46);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_input_6_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cCasetype"));
    })("focusout", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_focusout_6_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cCasetype"));
    });
    \u0275\u0275text(7, "              ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "mat-autocomplete", 47, 0);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_43_Template_mat_autocomplete_optionSelected_8_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cCasetype"));
    });
    \u0275\u0275repeaterCreate(10, TranscriptPropertiesComponent_Conditional_43_For_11_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(12, "async");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(13, "div", 48)(14, "div", 44)(15, "span", 19);
    \u0275\u0275text(16, "Case no.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "mat-form-field", 49)(18, "input", 50);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_43_Template_input_input_18_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cCCaseno"));
    })("ngModelChange", function TranscriptPropertiesComponent_Conditional_43_Template_input_ngModelChange_18_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeCaseNo($event, "cTCaseno"));
    })("focusout", function TranscriptPropertiesComponent_Conditional_43_Template_input_focusout_18_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cCCaseno"));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "mat-autocomplete", 47, 1);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_43_Template_mat_autocomplete_optionSelected_19_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cCCaseno"));
    });
    \u0275\u0275repeaterCreate(21, TranscriptPropertiesComponent_Conditional_43_For_22_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(23, "async");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(24, "div", 51)(25, "btn", 52);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_43_Template_btn_click_25_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.align("C"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(26, "svg", 53);
    \u0275\u0275element(27, "path", 54)(28, "path", 55);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(29, "btn", 52);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_43_Template_btn_click_29_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.align("L"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(30, "svg", 53);
    \u0275\u0275element(31, "path", 56);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(32, "div", 57)(33, "div", 58)(34, "div", 44)(35, "div", 59);
    \u0275\u0275template(36, TranscriptPropertiesComponent_Conditional_43_Conditional_36_Template, 1, 2, "app-content-editable", 60)(37, TranscriptPropertiesComponent_Conditional_43_Conditional_37_Template, 2, 1)(38, TranscriptPropertiesComponent_Conditional_43_Conditional_38_Template, 1, 0, "icon", 61);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(39, "mat-form-field", 62)(40, "textarea", 63);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_input_40_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cClaiment", true));
    })("focusout", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_focusout_40_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cClaiment"));
    });
    \u0275\u0275text(41, "              ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(42, "mat-autocomplete", 47, 2);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_43_Template_mat_autocomplete_optionSelected_42_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cClaiment"));
    });
    \u0275\u0275repeaterCreate(44, TranscriptPropertiesComponent_Conditional_43_For_45_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(46, "async");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(47, "div", 58)(48, "div", 44)(49, "div", 59);
    \u0275\u0275template(50, TranscriptPropertiesComponent_Conditional_43_Conditional_50_Template, 1, 2, "app-content-editable", 64)(51, TranscriptPropertiesComponent_Conditional_43_Conditional_51_Template, 2, 1)(52, TranscriptPropertiesComponent_Conditional_43_Conditional_52_Template, 1, 0, "icon", 61);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(53, "mat-form-field", 62)(54, "textarea", 65);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_input_54_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cRespondent", true));
    })("focusout", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_focusout_54_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cBClaiment"));
    });
    \u0275\u0275text(55, "              ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(56, "mat-autocomplete", 47, 3);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_43_Template_mat_autocomplete_optionSelected_56_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cRespondent"));
    });
    \u0275\u0275repeaterCreate(58, TranscriptPropertiesComponent_Conditional_43_For_59_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(60, "async");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(61, "div", 66)(62, "div", 59);
    \u0275\u0275template(63, TranscriptPropertiesComponent_Conditional_43_Conditional_63_Template, 1, 2, "app-content-editable", 67)(64, TranscriptPropertiesComponent_Conditional_43_Conditional_64_Template, 2, 1)(65, TranscriptPropertiesComponent_Conditional_43_Conditional_65_Template, 1, 0, "icon", 61);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(66, "div", 57)(67, "div", 68)(68, "mat-form-field", 69)(69, "textarea", 70, 4);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_input_69_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cArbitrator"));
    })("focusout", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_focusout_69_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cBClaiment"));
    });
    \u0275\u0275text(71, "              ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(72, "mat-autocomplete", 47, 5);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_43_Template_mat_autocomplete_optionSelected_72_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cArbitrator"));
    });
    \u0275\u0275repeaterCreate(74, TranscriptPropertiesComponent_Conditional_43_For_75_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(76, "async");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(77, "div", 71)(78, "div", 72)(79, "input", 73);
    \u0275\u0275listener("ngModelChange", function TranscriptPropertiesComponent_Conditional_43_Template_input_ngModelChange_79_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeCaseNo($event, "cTVolume"));
    })("focusout", function TranscriptPropertiesComponent_Conditional_43_Template_input_focusout_79_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cCDay"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(80, "datepicker", 74);
    \u0275\u0275listener("dateChange", function TranscriptPropertiesComponent_Conditional_43_Template_datepicker_dateChange_80_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.OnDateChange($event, "dt3"));
    });
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(81, "div", 57)(82, "div", 75)(83, "div", 76);
    \u0275\u0275template(84, TranscriptPropertiesComponent_Conditional_43_Conditional_84_Template, 1, 2, "app-content-editable", 77)(85, TranscriptPropertiesComponent_Conditional_43_Conditional_85_Template, 2, 1)(86, TranscriptPropertiesComponent_Conditional_43_Conditional_86_Template, 1, 0, "icon", 61);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(87, "mat-form-field", 78)(88, "textarea", 79, 4);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_input_88_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cBClaiment", true));
    })("focusout", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_focusout_88_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cBClaiment"));
    });
    \u0275\u0275text(90, "            ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(91, "mat-autocomplete", 47, 6);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_43_Template_mat_autocomplete_optionSelected_91_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cBClaiment"));
    });
    \u0275\u0275repeaterCreate(93, TranscriptPropertiesComponent_Conditional_43_For_94_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(95, "async");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(96, "div", 80)(97, "div", 81)(98, "div", 82);
    \u0275\u0275template(99, TranscriptPropertiesComponent_Conditional_43_Conditional_99_Template, 1, 2, "app-content-editable", 83)(100, TranscriptPropertiesComponent_Conditional_43_Conditional_100_Template, 2, 1)(101, TranscriptPropertiesComponent_Conditional_43_Conditional_101_Template, 1, 0, "icon", 61);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(102, "mat-form-field", 78)(103, "textarea", 84, 4);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_input_103_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cBRespondent", true));
    })("focusout", function TranscriptPropertiesComponent_Conditional_43_Template_textarea_focusout_103_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cBClaiment"));
    });
    \u0275\u0275text(105, "            ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(106, "mat-autocomplete", 47, 7);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_43_Template_mat_autocomplete_optionSelected_106_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cBRespondent"));
    });
    \u0275\u0275repeaterCreate(108, TranscriptPropertiesComponent_Conditional_43_For_109_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(110, "async");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(111, "div", 85)(112, "btn", 52);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_43_Template_btn_click_112_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.Balign("C"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(113, "svg", 53);
    \u0275\u0275element(114, "path", 54)(115, "path", 55);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(116, "btn", 52);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_43_Template_btn_click_116_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.Balign("L"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(117, "svg", 53);
    \u0275\u0275element(118, "path", 56);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    let tmp_18_0;
    let tmp_19_0;
    let tmp_20_0;
    let tmp_21_0;
    let tmp_48_0;
    let tmp_49_0;
    let tmp_50_0;
    let tmp_51_0;
    const autoCasetype_r21 = \u0275\u0275reference(9);
    const autoCCaseno_r22 = \u0275\u0275reference(20);
    const autoClaiment_r23 = \u0275\u0275reference(43);
    const autoRespondent_r24 = \u0275\u0275reference(57);
    const autoArbitrator_r25 = \u0275\u0275reference(73);
    const autoBClaiment_r26 = \u0275\u0275reference(92);
    const autoBRespondent_r27 = \u0275\u0275reference(107);
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(6);
    \u0275\u0275property("matAutocomplete", autoCasetype_r21)("value", ctx_r2.transcriptForm.value["cCasetype"]);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(12, 34, ctx_r2.filteredOptions["cCasetype"]));
    \u0275\u0275advance(8);
    \u0275\u0275property("maxlength", 100)("matAutocomplete", autoCCaseno_r22)("value", ctx_r2.transcriptForm.value["cCCaseno"]);
    \u0275\u0275advance(3);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(23, 36, ctx_r2.filteredOptions["cCCaseno"]));
    \u0275\u0275advance(4);
    \u0275\u0275property("active", ((tmp_18_0 = ctx_r2.transcriptForm.get("cCAlign")) == null ? null : tmp_18_0.value) === "C")("addcls", ((tmp_19_0 = ctx_r2.transcriptForm.get("cCAlign")) == null ? null : tmp_19_0.value) === "C" ? "!bg-blue-200" : "");
    \u0275\u0275advance(4);
    \u0275\u0275property("active", ((tmp_20_0 = ctx_r2.transcriptForm.get("cCAlign")) == null ? null : tmp_20_0.value) === "L")("addcls", ((tmp_21_0 = ctx_r2.transcriptForm.get("cCAlign")) == null ? null : tmp_21_0.value) === "L" ? "!bg-blue-200" : "");
    \u0275\u0275advance(7);
    \u0275\u0275conditional(36, ctx_r2.editClaimant ? 36 : 37);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(38, !ctx_r2.editClaimant ? 38 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("matAutocomplete", autoClaiment_r23)("value", ctx_r2.transcriptForm.value["cClaiment"]);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(46, 38, ctx_r2.filteredOptions["cClaiment"]));
    \u0275\u0275advance(6);
    \u0275\u0275conditional(50, ctx_r2.editRespondent ? 50 : 51);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(52, !ctx_r2.editRespondent ? 52 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("matAutocomplete", autoRespondent_r24)("value", ctx_r2.transcriptForm.value["cRespondent"]);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(60, 40, ctx_r2.filteredOptions["cRespondent"]));
    \u0275\u0275advance(5);
    \u0275\u0275conditional(63, ctx_r2.editArbitrator ? 63 : 64);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(65, !ctx_r2.editArbitrator ? 65 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275property("matAutocomplete", autoArbitrator_r25)("value", ctx_r2.transcriptForm.value["cArbitrator"]);
    \u0275\u0275advance(5);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(76, 42, ctx_r2.filteredOptions["cArbitrator"]));
    \u0275\u0275advance(6);
    \u0275\u0275property("date", ctx_r2.transcriptForm.value.dCDate);
    \u0275\u0275advance(4);
    \u0275\u0275conditional(84, ctx_r2.editBehalfClaimant ? 84 : 85);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(86, !ctx_r2.editBehalfClaimant ? 86 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("matAutocomplete", autoBClaiment_r26)("value", ctx_r2.transcriptForm.value["cBClaiment"]);
    \u0275\u0275advance(5);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(95, 44, ctx_r2.filteredOptions["cBClaiment"]));
    \u0275\u0275advance(6);
    \u0275\u0275conditional(99, ctx_r2.editBehalfRespondent ? 99 : 100);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(101, !ctx_r2.editBehalfRespondent ? 101 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("matAutocomplete", autoBRespondent_r27)("value", ctx_r2.transcriptForm.value["cBRespondent"]);
    \u0275\u0275advance(5);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(110, 46, ctx_r2.filteredOptions["cBRespondent"]));
    \u0275\u0275advance(4);
    \u0275\u0275property("active", ((tmp_48_0 = ctx_r2.transcriptForm.get("cBehalfAlign")) == null ? null : tmp_48_0.value) === "C")("addcls", ((tmp_49_0 = ctx_r2.transcriptForm.get("cBehalfAlign")) == null ? null : tmp_49_0.value) === "C" ? "!bg-blue-200" : "");
    \u0275\u0275advance(4);
    \u0275\u0275property("active", ((tmp_50_0 = ctx_r2.transcriptForm.get("cBehalfAlign")) == null ? null : tmp_50_0.value) === "L")("addcls", ((tmp_51_0 = ctx_r2.transcriptForm.get("cBehalfAlign")) == null ? null : tmp_51_0.value) === "L" ? "!bg-blue-200" : "");
  }
}
function TranscriptPropertiesComponent_Conditional_44_For_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r29 = ctx.$implicit;
    \u0275\u0275property("value", option_r29);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r29);
  }
}
function TranscriptPropertiesComponent_Conditional_44_For_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r30 = ctx.$implicit;
    \u0275\u0275property("value", option_r30);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r30);
  }
}
function TranscriptPropertiesComponent_Conditional_44_For_44_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r31 = ctx.$implicit;
    \u0275\u0275property("value", option_r31);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r31);
  }
}
function TranscriptPropertiesComponent_Conditional_44_For_57_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r32 = ctx.$implicit;
    \u0275\u0275property("value", option_r32);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r32);
  }
}
function TranscriptPropertiesComponent_Conditional_44_For_79_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r33 = ctx.$implicit;
    \u0275\u0275property("value", option_r33);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r33);
  }
}
function TranscriptPropertiesComponent_Conditional_44_For_91_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r34 = ctx.$implicit;
    \u0275\u0275property("value", option_r34);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r34);
  }
}
function TranscriptPropertiesComponent_Conditional_44_Template(rf, ctx) {
  if (rf & 1) {
    const _r28 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 92)(1, "div", 81)(2, "span", 19);
    \u0275\u0275text(3, "Case Name");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-form-field", 93)(5, "textarea", 94);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_input_5_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cCasename", false, true));
    })("keydown", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_keydown_5_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.removeHandleTitleChange("cCasename", 2, $event));
    })("change", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_change_5_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.casenamechange($event));
    })("focusout", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_focusout_5_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cCasename"));
    })("paste", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_paste_5_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.pasteHandleChange("cCasename", 2, 500));
    });
    \u0275\u0275text(6, "            ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "mat-autocomplete", 47, 8);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_44_Template_mat_autocomplete_optionSelected_7_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cCasename"));
    });
    \u0275\u0275repeaterCreate(9, TranscriptPropertiesComponent_Conditional_44_For_10_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(11, "async");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(12, "div", 95)(13, "span", 19);
    \u0275\u0275text(14, "Case No.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "mat-form-field", 49)(16, "input", 96);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_44_Template_input_input_16_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cTCaseno"));
    })("ngModelChange", function TranscriptPropertiesComponent_Conditional_44_Template_input_ngModelChange_16_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeCaseNo($event, "cCCaseno"));
    })("focusout", function TranscriptPropertiesComponent_Conditional_44_Template_input_focusout_16_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cTCaseno"));
    })("paste", function TranscriptPropertiesComponent_Conditional_44_Template_input_paste_16_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.pasteHandleChange("cTCaseno", null, 100));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "mat-autocomplete", 47, 9);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_44_Template_mat_autocomplete_optionSelected_17_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cTCaseno"));
    });
    \u0275\u0275repeaterCreate(19, TranscriptPropertiesComponent_Conditional_44_For_20_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(21, "async");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(22, "div", 92)(23, "div", 44)(24, "span", 19);
    \u0275\u0275text(25, "Date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "datepicker", 97);
    \u0275\u0275listener("dateChange", function TranscriptPropertiesComponent_Conditional_44_Template_datepicker_dateChange_26_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.OnDateChange($event, "dt1"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(27, "div", 44)(28, "span", 19);
    \u0275\u0275text(29, "Time");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(30, "div", 98);
    \u0275\u0275element(31, "input", 99);
    \u0275\u0275elementStart(32, "span");
    \u0275\u0275text(33, ":");
    \u0275\u0275elementEnd();
    \u0275\u0275element(34, "input", 100);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(35, "div", 101)(36, "span", 19);
    \u0275\u0275text(37, "Reporter");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(38, "mat-form-field", 93)(39, "textarea", 102);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_input_39_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cReporter"));
    })("focusout", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_focusout_39_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cReporter"));
    })("paste", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_paste_39_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.pasteHandleChange("cReporter", null, 500));
    });
    \u0275\u0275text(40, "            ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(41, "mat-autocomplete", 47, 10);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_44_Template_mat_autocomplete_optionSelected_41_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cReporter"));
    });
    \u0275\u0275repeaterCreate(43, TranscriptPropertiesComponent_Conditional_44_For_44_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(45, "async");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(46, "div", 92)(47, "div", 75)(48, "span", 19);
    \u0275\u0275text(49, "Title (Header)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(50, "mat-form-field", 103)(51, "textarea", 104, 4);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_input_51_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cTitle", false, true));
    })("blur", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_blur_51_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.handleTitleChange("cTitle"));
    })("keydown", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_keydown_51_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.removeHandleTitleChange("cTitle", 2, $event));
    })("focusout", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_focusout_51_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cTitle"));
    })("paste", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_paste_51_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.pasteHandleChange("cTitle", 2, 500));
    });
    \u0275\u0275text(53, "            ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(54, "mat-autocomplete", 47, 11);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_44_Template_mat_autocomplete_optionSelected_54_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cTitle"));
    });
    \u0275\u0275repeaterCreate(56, TranscriptPropertiesComponent_Conditional_44_For_57_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(58, "async");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(59, "div", 105)(60, "div", 106)(61, "span", 19);
    \u0275\u0275text(62, "Volume");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(63, "input", 107);
    \u0275\u0275listener("ngModelChange", function TranscriptPropertiesComponent_Conditional_44_Template_input_ngModelChange_63_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeCaseNo($event, "cCDay"));
    })("focusout", function TranscriptPropertiesComponent_Conditional_44_Template_input_focusout_63_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cCDay"));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(64, "div", 108)(65, "span", 19);
    \u0275\u0275text(66, "Date Transcribed");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(67, "datepicker", 97);
    \u0275\u0275listener("dateChange", function TranscriptPropertiesComponent_Conditional_44_Template_datepicker_dateChange_67_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.OnDateChange($event, "dt2"));
    });
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(68, "div", 92)(69, "div", 75)(70, "span", 19);
    \u0275\u0275text(71, "Company Name (Footer left):");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(72, "mat-form-field", 103)(73, "textarea", 109, 4);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_input_73_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cCompany"));
    })("focusout", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_focusout_73_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cCompany"));
    })("keydown", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_keydown_73_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.removeHandleTitleChange("cCompany", null, $event));
    })("paste", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_paste_73_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.pasteHandleChange("cCompany", null, 500));
    });
    \u0275\u0275text(75, "            ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(76, "mat-autocomplete", 47, 12);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_44_Template_mat_autocomplete_optionSelected_76_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cCompany"));
    });
    \u0275\u0275repeaterCreate(78, TranscriptPropertiesComponent_Conditional_44_For_79_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(80, "async");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(81, "div", 75)(82, "span", 19);
    \u0275\u0275text(83, "Company Info (Footer right):");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(84, "mat-form-field", 103)(85, "textarea", 110, 4);
    \u0275\u0275listener("input", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_input_85_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInput($event, "cCompanyinfo"));
    })("focusout", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_focusout_85_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.changeMultitext("cCompanyinfo"));
    })("keydown", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_keydown_85_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.removeHandleTitleChange("cCompanyinfo", null, $event));
    })("paste", function TranscriptPropertiesComponent_Conditional_44_Template_textarea_paste_85_listener() {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.pasteHandleChange("cCompanyinfo", null, 500));
    });
    \u0275\u0275text(87, "            ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(88, "mat-autocomplete", 47, 13);
    \u0275\u0275listener("optionSelected", function TranscriptPropertiesComponent_Conditional_44_Template_mat_autocomplete_optionSelected_88_listener($event) {
      \u0275\u0275restoreView(_r28);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAutoCompleteSelect($event, "cCompanyinfo"));
    });
    \u0275\u0275repeaterCreate(90, TranscriptPropertiesComponent_Conditional_44_For_91_Template, 2, 2, "mat-option", 22, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275pipe(92, "async");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const autoCasename_r35 = \u0275\u0275reference(8);
    const autoTCaseno_r36 = \u0275\u0275reference(18);
    const autoReporter_r37 = \u0275\u0275reference(42);
    const autoTitle_r38 = \u0275\u0275reference(55);
    const autoCompany_r39 = \u0275\u0275reference(77);
    const autoCompanyinfo_r40 = \u0275\u0275reference(89);
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("matAutocomplete", autoCasename_r35)("value", ctx_r2.transcriptForm.value["cCasename"]);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(11, 19, ctx_r2.filteredOptions["cCasename"]));
    \u0275\u0275advance(7);
    \u0275\u0275property("maxlength", 100)("matAutocomplete", autoTCaseno_r36)("value", ctx_r2.transcriptForm.value["cTCaseno"]);
    \u0275\u0275advance(3);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(21, 21, ctx_r2.filteredOptions["cTCaseno"]));
    \u0275\u0275advance(7);
    \u0275\u0275property("date", ctx_r2.transcriptForm.value.dTDate)("disabled", ctx_r2.disabled);
    \u0275\u0275advance(13);
    \u0275\u0275property("matAutocomplete", autoReporter_r37)("ngStyle", \u0275\u0275pureFunction1(31, _c2, ctx_r2.calculatemaxwidth(ctx_r2.selectedTheme) / 2 + "px"))("value", ctx_r2.transcriptForm.value["cReporter"]);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(45, 23, ctx_r2.filteredOptions["cReporter"]));
    \u0275\u0275advance(8);
    \u0275\u0275property("matAutocomplete", autoTitle_r38)("ngStyle", \u0275\u0275pureFunction1(33, _c2, ctx_r2.calculatemaxwidth(ctx_r2.selectedTheme) / 2 + "px"))("value", ctx_r2.transcriptForm.value["cTitle"]);
    \u0275\u0275advance(5);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(58, 25, ctx_r2.filteredOptions["cTitle"]));
    \u0275\u0275advance(11);
    \u0275\u0275property("date", ctx_r2.transcriptForm.value.dTranscribedDate)("disabled", ctx_r2.disabled);
    \u0275\u0275advance(6);
    \u0275\u0275property("matAutocomplete", autoCompany_r39)("value", ctx_r2.transcriptForm.value["cCompany"]);
    \u0275\u0275advance(5);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(80, 27, ctx_r2.filteredOptions["cCompany"]));
    \u0275\u0275advance(7);
    \u0275\u0275property("matAutocomplete", autoCompanyinfo_r40)("value", ctx_r2.transcriptForm.value["cCompanyinfo"]);
    \u0275\u0275advance(5);
    \u0275\u0275repeater(\u0275\u0275pipeBind1(92, 29, ctx_r2.filteredOptions["cCompanyinfo"]));
  }
}
function TranscriptPropertiesComponent_Conditional_45_Template(rf, ctx) {
  if (rf & 1) {
    const _r41 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 39)(1, "btn", 111);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_45_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r41);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onSubmit());
    });
    \u0275\u0275elementStart(2, "span", 112);
    \u0275\u0275text(3, "Import as final");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "btn", 113);
    \u0275\u0275listener("click", function TranscriptPropertiesComponent_Conditional_45_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r41);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.closeDilog());
    });
    \u0275\u0275elementStart(5, "span", 114);
    \u0275\u0275text(6, "Cancel");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !ctx_r2.transcriptForm.valid);
  }
}
var MY_DATE_FORMATS = {
  parse: {
    dateInput: "MM/DD/YYYY"
  },
  display: {
    dateInput: "MM/DD/YYYY",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY"
  }
};
var TranscriptPropertiesComponent = class _TranscriptPropertiesComponent {
  constructor(matDialog, dialogRef, fb, cdr, transcriptS, sanitizer, data) {
    this.matDialog = matDialog;
    this.dialogRef = dialogRef;
    this.fb = fb;
    this.cdr = cdr;
    this.transcriptS = transcriptS;
    this.sanitizer = sanitizer;
    this.data = data;
    this.ROOT_ELEMENT = document.documentElement;
    this.dt = /* @__PURE__ */ new Date();
    this.disabled = false;
    this.themeName = "";
    this.editClaimant = false;
    this.editArbitrator = false;
    this.editRespondent = false;
    this.editBehalfClaimant = false;
    this.editBehalfRespondent = false;
    this.trasview = "C";
    this.themes = [];
    this.suggestionsList = [];
    this.caseTypeSuggestions = [
      "Arbitration",
      "Mediation",
      "Commercial Dispute",
      "Labor Dispute",
      "Construction Dispute",
      "International Arbitration"
    ];
    this.arbitratorSuggestions = [
      "John Smith",
      "Jane Doe",
      "Robert Johnson",
      "Sarah Williams",
      "Michael Brown",
      "Emily Davis"
    ];
    this.claimantSuggestions = [
      "ABC Corporation",
      "XYZ Industries",
      "Global Enterprises",
      "United Holdings",
      "Premier Group",
      "Elite Solutions"
    ];
    this.respondentSuggestions = [
      "DEF Corporation",
      "123 Industries",
      "National Enterprises",
      "International Holdings",
      "Standard Group",
      "Advanced Solutions"
    ];
    this.filteredSuggestions = {};
    this.debounceTimers = {};
    this.selectedValue = "";
    this.currentControl = "";
    this.filteredOptions = {};
    this.suggestions = {};
    this.subscriptions = [];
    this.cTransid = data.cTransid || null;
    this.action = data.action;
    this.transcriptForm = this.fb.group({
      cTransid: [null],
      cCasetype: ["", Validators.required],
      cCCaseno: [""],
      cCAlign: ["C", Validators.required],
      cClaimentH: ["Claimant", Validators.required],
      cRespondentH: ["Respondent", Validators.required],
      cClaiment: ["", Validators.required],
      cRespondent: ["", Validators.required],
      cArbitrator: ["", Validators.required],
      cCDay: ["Day 1", Validators.required],
      dCDate: [this.dt, Validators.required],
      cBClaimentH: ["On Behalf of Claimant"],
      cBRespondentH: ["On Behalf of Respondent"],
      cBClaiment: ["", Validators.required],
      cBRespondent: ["", Validators.required],
      cCasename: ["", Validators.required],
      cTCaseno: [""],
      dTDate: [this.dt, Validators.required],
      tTTime: this.fb.group({
        hours: ["00"],
        minutes: ["00"]
      }),
      cReporter: ["sdf", Validators.required],
      cTitle: [""],
      cTVolume: ["Day 1", Validators.required],
      dTranscribedDate: ["", Validators.required],
      cCompany: [""],
      cCompanyinfo: ["", Validators.required],
      cBehalfAlign: ["C", Validators.required],
      cArbitratorH: ["Arbitrator", Validators.required],
      nStartpg: [data.fileData?.nStartpg],
      nSecondpg: [data.fileData?.nSecondpg],
      nLines: [data.fileData?.nLines],
      cPath: [data.fileData?.filePath],
      nPages: [data.fileData?.nPages],
      cThemeid: [],
      nCSpacing: [1],
      permission: ["I"]
    });
    if (data.cTransid) {
      this.get_transcript_detail(data.cTransid);
    }
    const controls = [
      "cCasetype",
      "cClaiment",
      "cRespondent",
      "cArbitrator",
      "cBClaiment",
      "cBRespondent",
      "cCasename",
      "cReporter",
      "cTitle",
      "cCompany",
      "cCompanyinfo",
      "cCCaseno",
      "cTCaseno"
    ];
    controls.forEach((control) => {
      this.filteredOptions[control] = new BehaviorSubject([]);
    });
  }
  ngOnInit() {
    this.getTheme();
  }
  ngAfterViewInit() {
  }
  ngOnDestroy() {
    this.formData = null;
    Object.keys(this.debounceTimers).forEach((key) => {
      if (this.debounceTimers[key]) {
        clearTimeout(this.debounceTimers[key]);
      }
    });
  }
  get_transcript_detail(cTransid) {
    return __async(this, null, function* () {
      let formData = yield this.transcriptS.getTranscriptDetail(cTransid);
      this.cdr.detectChanges();
      this.editFormat(formData);
    });
  }
  editFormat(formData) {
    debugger;
    this.cThemeid = formData.cThemeid;
    this.transcriptForm.patchValue({
      cTransid: this.action && this.action == "COPY" ? null : formData.cTransid,
      cCasetype: formData.cCasetype,
      cCCaseno: formData.cCCaseno,
      cCAlign: formData.cCAlign,
      cClaimentH: formData.cClaimentH,
      cRespondentH: formData.cRespondentH,
      cClaiment: formData.cClaiment,
      cRespondent: formData.cRespondent,
      cArbitrator: formData.cArbitrator,
      cCDay: this.action && this.action == "COPY" && formData.maxDayText && formData.maxDayText != "" ? formData.maxDayText : formData.cCDay,
      dCDate: new Date(formData.dCDate1),
      cBClaimentH: formData.cBClaimentH,
      cBRespondentH: formData.cBRespondentH,
      cBClaiment: formData.cBClaiment,
      cBRespondent: formData.cBRespondent,
      cCasename: formData.cCasename,
      cTCaseno: formData.cTCaseno,
      dTDate: new Date(formData.dTDate1),
      tTTime: formData.tTTime,
      cReporter: formData.cReporter,
      cTitle: formData.cTitle,
      cTVolume: this.action && this.action == "COPY" && formData.maxDayText && formData.maxDayText != "" ? formData.maxDayText : formData.cTVolume,
      dTranscribedDate: new Date(formData.dTranscribedDate1),
      cCompany: formData.cCompany,
      cCompanyinfo: formData.cCompanyinfo,
      cThemeid: formData.cThemeid,
      cBehalfAlign: formData?.cBehalfAlign || "C",
      cArbitratorH: formData?.cArbitratorH || "Arbitrator",
      permission: this.action && this.action == "COPY" ? "I" : "U",
      nCSpacing: formData.nCSpacing || 1
    });
    if (!this.action || this.action != "COPY") {
      this.transcriptForm.patchValue({
        nStartpg: formData.nStartpg,
        nSecondpg: formData.nSecondpg,
        nLines: formData.nLines,
        cPath: formData.cPath,
        nPages: formData.nPages
      });
    }
    this.transcriptForm.patchValue({ cThemeid: this.cThemeid });
    this.formData = this.transcriptForm.value;
    this.align(this.formData.cCAlign);
    this.Balign(this.formData.cBehalfAlign);
    this.getTranscriptHtml();
    this.cdr.detectChanges();
  }
  getTheme() {
    return __async(this, null, function* () {
      this.themes = yield this.transcriptS.gettheme();
      if (!this.cTransid) {
        this.cThemeid = this.themes.find((theme) => theme.bIsdefault === true).cThemeid;
        this.transcriptForm.patchValue({ cThemeid: this.cThemeid });
        this.formData = this.transcriptForm.value;
        this.getTranscriptHtml();
      }
    });
  }
  openTheme(permission) {
    const dialogRef = this.matDialog.open(TranscriptThemeComponent, {
      width: "1076px",
      maxHeight: "calc(100vh - 33px)",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: { cThemeid: permission == "E" ? this.cThemeid : null }
    });
    dialogRef.afterClosed().subscribe((result) => __async(this, null, function* () {
      if (result) {
        this.themes = yield this.transcriptS.gettheme();
        this.getTranscriptHtml();
      }
    }));
  }
  OnDateChange(event, id) {
    if (id === "dt1") {
      this.transcriptForm.patchValue({ dTDate: event });
    } else if (id === "dt2") {
      this.transcriptForm.patchValue({ dTranscribedDate: event });
      this.transcriptForm.patchValue({ dCDate: event });
    } else if (id === "dt3") {
      this.transcriptForm.patchValue({ dCDate: event });
      this.transcriptForm.patchValue({ dTranscribedDate: event });
    }
    this.formData = this.transcriptForm.value;
  }
  onSubmit() {
    return __async(this, null, function* () {
      if (this.transcriptForm.valid) {
        console.log("Form Values:", this.transcriptForm.value);
        let formData = Object.assign({}, this.transcriptForm.value);
        formData.cThemeid = this.cThemeid;
        formData.tTTime = (formData.tTTime.hours || "00") + ":" + (formData.tTTime.minutes || "00");
        if (formData.permission == "N") {
          delete formData.cTransid;
        }
        const response = yield this.transcriptS.saveTranscript(formData);
        if (response.msg == 1) {
          this.dialogRef.close(true);
        }
      } else {
        console.log("Form is invalid");
      }
    });
  }
  align(align) {
    this.transcriptForm.patchValue({ cCAlign: align });
    this.setalign(align);
  }
  Balign(align) {
    this.transcriptForm.patchValue({ cBehalfAlign: align });
    this.setBalign(align);
  }
  onThemeChange(event) {
    console.log("Theme changed:", event);
    this.transcriptForm.patchValue({ cThemeid: this.cThemeid });
    this.getTranscriptHtml();
  }
  closeDilog() {
    this.dialogRef.close();
  }
  onDayChange(event) {
    console.log("Day changed:", event);
    this.transcriptForm.patchValue({ cTVolume: event });
  }
  casenamechange(event) {
    debugger;
    if (event.includes("vs.") || event.includes("vs")) {
      let split = ["", ""];
      if (event.includes("vs.")) {
        split = event.split("vs.");
      }
      if (split[0].length > 45) {
        split[0] = split[0].substring(0, 45) + " et al.";
      }
      if (split[1].length > 45) {
        split[1] = split[1].substring(0, 45) + " et al.";
      }
      if (split[1]) {
        split[1] = split[1].trimStart();
      }
      this.transcriptForm.patchValue({ cTitle: split[0] + "vs.\n" + split[1] });
    } else {
      this.transcriptForm.patchValue({ cTitle: event });
    }
  }
  getTranscriptHtml() {
    return __async(this, null, function* () {
      this.formData = this.transcriptForm.value;
      const content = yield this.transcriptS.getTranscriptHtml(this.formData);
      if (content) {
        console.log("Transcript HTML content:", content);
        this.htmlContent = null;
        this.htmlContent = content;
        this.cdr.detectChanges();
      }
    });
  }
  setalign(align) {
    this.ROOT_ELEMENT.style.setProperty("--casetype-align", align == "C" ? "center" : "left");
  }
  setBalign(align) {
    this.ROOT_ELEMENT.style.setProperty("--appearances-align", align == "C" ? "center" : "left");
  }
  setCaps(align) {
    this.ROOT_ELEMENT.style.setProperty("--casetype-transform", align == "C" ? "center" : "left");
  }
  titlechange(event) {
    let title = event;
    if (event.length > 60) {
      title = event.substring(0, 60) + "\n" + event.substring(60);
    }
    title = this.replacecomma(title);
    if (event.length > 100) {
      title = event.substring(0, 100) + "et al.";
    }
    this.transcriptForm.patchValue({ cTitle: title });
  }
  replacecomma(event) {
    return event.replace(/,/g, ",\n");
  }
  claimantchange(event) {
    this.transcriptForm.patchValue({ cClaiment: event });
  }
  respondentchange(event) {
    this.transcriptForm.patchValue({ cRespondent: event });
  }
  arbitratorchange(event) {
    this.transcriptForm.patchValue({ cArbitrator: event });
  }
  behalfclaimantchange(event) {
    this.transcriptForm.patchValue({ cBClaiment: event });
  }
  behalfrespondentchange(event) {
    this.transcriptForm.patchValue({ cBRespondent: event });
  }
  calculatemaxwidth(fontSize) {
    return 672;
  }
  getWordBreakLength(fontSize) {
    switch (fontSize) {
      case 10:
        return 85;
      case 14:
        return 70;
      case 12:
      default:
        return 60;
    }
  }
  changeCaseNo(event, key) {
    this.transcriptForm.patchValue({ [key]: event });
  }
  onInput(event, controlName, isList = false, isTitle = false) {
    return __async(this, null, function* () {
      const element = event.target;
      let text = element.value;
      this.transcriptForm.patchValue({ [controlName]: text });
      this.cdr.detectChanges();
      if (isList) {
        this.handleListChange(controlName);
      }
      if (isTitle) {
        this.handleTitleChange(controlName);
      }
      if (this.debounceTimers[controlName]) {
        clearTimeout(this.debounceTimers[controlName]);
        this.debounceTimers[controlName] = null;
      }
      this.debounceTimers[controlName] = setTimeout(() => __async(this, null, function* () {
        try {
          let res = yield this.transcriptS.getFieldData(text, controlName);
          this.suggestions[controlName] = res.length > 0 ? res.map((e) => e?.[controlName] ?? "") : [];
          this.filteredSuggestions[controlName] = this.suggestions[controlName];
          this.filteredSuggestions[controlName] = this.suggestions[controlName].filter((suggestion) => suggestion.toLowerCase().includes(text.toLowerCase()));
          this.filteredOptions[controlName].next(this.filteredSuggestions[controlName]);
          const matAutocomplete = this.matAutocompletes.find((auto) => auto.id === `auto${controlName}`);
          if (matAutocomplete) {
            if (this.filteredSuggestions[controlName].length === 0) {
              matAutocomplete.closed.emit();
            } else if (!matAutocomplete.isOpen) {
              setTimeout(() => {
                matAutocomplete.opened.emit();
                this.cdr.detectChanges();
              }, 0);
            }
          }
        } catch (err) {
          console.error("Error fetching suggestions:", err);
        }
      }), 600);
    });
  }
  changeMultitext(controlName) {
    if (controlName === "cBClaiment" || controlName === "cBRespondent" || controlName === "cArbitrator" || controlName === "cRespondent" || controlName === "cClaiment") {
      this.getTranscriptHtml();
    } else {
      this.formData = this.transcriptForm.value;
    }
    if (controlName === "cCasename") {
      this.casenamechange(this.transcriptForm.get("cCasename")?.value);
    }
  }
  onFocus(controlName) {
    return __async(this, null, function* () {
      const control = this.transcriptForm.get(controlName);
      if (!control)
        return;
      const currentValue = control.value || "";
      try {
        let res = yield this.transcriptS.getFieldData(currentValue, controlName);
        this.suggestions[controlName] = res.length > 0 ? res.map((e) => e[controlName]) : [];
        this.filteredSuggestions[controlName] = this.suggestions[controlName];
        if (this.suggestions[controlName].length > 0) {
          this.filteredSuggestions[controlName] = this.suggestions[controlName].filter((suggestion) => suggestion.toLowerCase().includes(currentValue.toLowerCase()));
          this.filteredOptions[controlName].next(this.filteredSuggestions[controlName]);
          const matAutocomplete = this.matAutocompletes.find((auto) => auto.id === `auto${controlName}`);
          if (matAutocomplete && this.filteredSuggestions[controlName].length > 0) {
            setTimeout(() => {
              matAutocomplete.opened.emit();
              this.cdr.detectChanges();
            });
          }
        }
      } catch (err) {
        console.error("Error fetching suggestions on focus:", err);
      }
    });
  }
  handleListChange(controlName) {
  }
  removeHandleTitleChange(controlName, numofEnter, event) {
    const control = this.transcriptForm.get(controlName);
    const value = control?.value || "";
    if (!control)
      return;
    if (event.key === "Enter" && numofEnter) {
      const newlineCount = (value.match(/\n/g) || []).length;
      if (newlineCount > numofEnter) {
        event.preventDefault();
        return;
      }
    }
    if ((event.key === "Backspace" || event.key === "Delete") && value.endsWith(" et al.")) {
      const updatedTitle = value.slice(0, -7);
      this.transcriptForm.patchValue({ [controlName]: updatedTitle });
      if (controlName === "cTitle") {
        this.transcriptForm.patchValue({ cCasename: updatedTitle });
      }
    }
  }
  pasteHandleChange(controlName, numofEnter, maxlength) {
    setTimeout(() => {
      const control = this.transcriptForm.get(controlName);
      if (!control)
        return;
      let value = control.value || "";
      if (numofEnter) {
        const parts = value.split("\n");
        if (parts.length > numofEnter) {
          value = parts.slice(0, 2).join("\n");
        }
        value = value.replace(/\n{2,}/g, "\n");
      }
      if (maxlength && value.length > maxlength) {
        value = value.substring(0, maxlength);
      }
      control.setValue(value);
    }, 0);
  }
  handleTitleChange(controlName) {
    const titleValue = this.transcriptForm.get(controlName)?.value;
    if (titleValue) {
      let title = titleValue;
      const parts = title.split("\n");
      if (parts.length > 2) {
        title = parts.slice(0, 2).join("\n");
      }
      title = title.replace(/\n{2,}/g, "\n");
      if (title.length > 100) {
        title = title.substring(0, 100) + " et al.";
      }
      if (title !== titleValue) {
        this.transcriptForm.patchValue({ [controlName]: title });
      }
      if (controlName === "cCasename") {
        this.transcriptForm.patchValue({ cTitle: title });
      }
    }
  }
  handleCasenameChange() {
  }
  onAutoCompleteSelect(event, controlName) {
    const selectedValue = event.option.value;
    this.transcriptForm.patchValue({ [controlName]: selectedValue });
  }
  static {
    this.\u0275fac = function TranscriptPropertiesComponent_Factory(t) {
      return new (t || _TranscriptPropertiesComponent)(\u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(FormBuilder), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(TranscriptService), \u0275\u0275directiveInject(DomSanitizer), \u0275\u0275directiveInject(MAT_DIALOG_DATA));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TranscriptPropertiesComponent, selectors: [["app-transcript-properties"]], viewQuery: function TranscriptPropertiesComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c03, 5);
        \u0275\u0275viewQuery(MatAutocomplete, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.matSelect = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.matAutocompletes = _t);
      }
    }, standalone: true, features: [\u0275\u0275ProvidersFeature([
      provideNativeDateAdapter(),
      { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
    ]), \u0275\u0275StandaloneFeature], decls: 48, vars: 20, consts: [["autoCasetype", "matAutocomplete"], ["autoCCaseno", "matAutocomplete"], ["autoClaiment", "matAutocomplete"], ["autoRespondent", "matAutocomplete"], ["autosize", "cdkTextareaAutosize"], ["autoArbitrator", "matAutocomplete"], ["autoBClaiment", "matAutocomplete"], ["autoBRespondent", "matAutocomplete"], ["autoCasename", "matAutocomplete"], ["autoTCaseno", "matAutocomplete"], ["autoReporter", "matAutocomplete"], ["autoTitle", "matAutocomplete"], ["autoCompany", "matAutocomplete"], ["autoCompanyinfo", "matAutocomplete"], [1, "bg-[#F4F6F9]", "rounded-base", "p-5", "flex", "gap-6", 3, "formGroup"], [1, "flex", "flex-col", "w-[calc(100%-437px)]", "overflow-hidden", "h-fit", "max-h-[calc(100vh-50px)]"], [1, "flex", "flex-col", "gap-2.5", "h-full", "overflow-y-auto", "py-5", "ps-5", "pe-3"], [1, "font-semibold", "text-lg", "text-grey", "mb-2.5"], [1, "flex", "items-center", "gap-2", "w-full"], [1, "font-semibold", "text-xs", "text-grey"], [1, "flex-1"], ["placeholder", "Select Theme", 1, "w-full", "border", "bg-white", "border-tab", "text-xs", "text-grey", "rounded-base", 3, "ngModelChange", "selectionChange", "ngModel", "ngModelOptions"], [3, "value"], ["mode", "outlined", 3, "click"], ["name", "addcircle", 1, "text-base"], [1, "text-xs"], [1, "flex", "gap-2.5", "my-2.5"], [1, "flex", "relative", "z-20", "w-1/2", 3, "click"], [1, "flex", "items-center", "gap-2.5", "w-full", "rounded-s-[4px]", "bg-grey", "min-h-[30px]", "px-2.5"], [1, "font-semibold", "text-xs", "text-white"], ["xmlns", "http://www.w3.org/2000/svg", "width", "45", "height", "31", "fill", "none", "viewBox", "0 0 45 31", 1, "min-w-[50px]", "h-[35px]", "-ms-2"], ["fill", "currentColor", "d", "M0 27V4c0-2 2-4 4-4h23l3 1 13 11c1 1 2 4 0 6L30 30l-3 1H4c-2 0-4-2-4-4Z"], ["width", "18", "height", "35", "viewBox", "0 0 18 35", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "min-w-10", "-ms-7"], ["d", "M0.521018 0.759766L16.2117 14.0555C17.7971 15.399 17.8696 17.8199 16.3674 19.2559L0.511719 34.4116", "stroke", "#ffffff"], [1, "flex", "realtive", "-translate-x-11", "z-10", "w-[53%]", "-me-8.5"], [1, "flex", "items-center", "gap-2.5", "w-full", "px-2.5", "bg-grey", "min-h-[30px]", "ps-8", 3, "click"], [1, "flex", "items-center", "gap-2", "w-3/5", "self-end"], ["aria-label", "Select an option", "formControlName", "nCSpacing", 1, "flex", "gap-2"], [1, "inline-flex", 3, "value"], [1, "flex", "gap-2.5", "px-5", "pt-6", "pb-5", "bg-[#F4F6F9]"], [1, "flex", "flex-col", "flex-1", "bg-white", "rounded-base", "overflow-auto", "transcript-preview", "h-[646px]", "w-[416px]", "max-h-[calc(100vh-100px)]"], [1, "zoom-50", 3, "formData", "htmlContent", "changeTheme"], [1, "flex", "gap-6", "items-start", "w-full"], [1, "flex-1", "w-full"], [1, "flex", "flex-col", "gap-2"], [1, "w-full", "extra-txetarea", 2, "--extra-txetarea-height", "50px"], ["matInput", "", "placeholder", "Name of Case type", "formcontrolname", "cCasetype", "maxlength", "500", 1, "w-full", "border", "border-tab", "rounded-base", "!p-0", "!bg-white", "text-xs", "text-grey", "outline-none", "h-8.5", "casetype", "cover-textarea", 3, "input", "focusout", "matAutocomplete", "value"], [3, "optionSelected"], [1, "w-36"], [1, "w-full", "extra-input"], ["matInput", "", "type", "text", "formControlName", "cCCaseno", "placeholder", "Case Number", 1, "bg-white", "border", "border-tab", "!px-2.5", "rounded-base", "min-h-[30px]", "!pt-1.5", "!pb-5", "text-xs", "text-grey", "w-full", "outline-none", 3, "input", "ngModelChange", "focusout", "maxlength", "matAutocomplete", "value"], [1, "flex", "flex-col", "gap-1"], ["mode", "outlined", "square", "", 3, "click", "active", "addcls"], ["width", "23", "height", "23", "viewBox", "0 0 23 23", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M3.83301 5.75H19.1663H3.83301ZM7.66634 11.5H15.333H7.66634ZM5.74967 17.25H17.2497H5.74967Z", "fill", "#0066FF"], ["d", "M3.83301 5.75H19.1663M7.66634 11.5H15.333M5.74967 17.25H17.2497", "stroke", "#4F4F4F", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M3.83301 5.75H19.1663M3.83301 11.5H13.4163M3.83301 17.25H17.2497", "stroke", "#4F4F4F", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round"], [1, "flex", "gap-6"], [1, "flex-1", "w-[calc(50%-12px)]"], [1, "flex", "items-center", "gap-2"], ["placeholder", "Name of Case type", "formcontrolname", "cClaimentH", 1, "w-full", 3, "suggestions", "value"], ["name", "edit", 1, "text-grey", "text-xs"], [1, "w-full", "extra-txetarea"], ["matInput", "", "placeholder", "List of Claimant", "formcontrolname", "cClaiment", "cdkTextareaAutosize", "", "cdkAutosizeMaxRows", "50", 1, "w-full", "border", "border-tab", "rounded-base", "!p-0", "!bg-white", "text-xs", "text-grey", "outline-none", "claimant", "cover-textarea", 3, "input", "focusout", "matAutocomplete", "value"], ["placeholder", "Name of Case type", "formcontrolname", "cRespondentH", 1, "w-full", 3, "suggestions", "value"], ["matInput", "", "placeholder", "List of Respondent", "formcontrolname", "cRespondent", 1, "w-full", "border", "border-tab", "rounded-base", "!p-0", "!bg-white", "text-xs", "text-grey", "outline-none", "respondent", "cover-textarea", 3, "input", "focusout", "matAutocomplete", "value"], [1, "w-full", "flex", "flex-col", "gap-2"], ["placeholder", "Name of Case type", "formcontrolname", "cArbitratorH", 1, "w-full", 3, "suggestions", "value"], [1, "flex", "gap-1", "items-center", "w-2/3"], [1, "w-full", "extra-txetarea", 2, "--extra-txetarea-height", "33px", "--padding-top", "5px"], ["matInput", "", "placeholder", "Name of Arbitrator", "formcontrolname", "cArbitrator", "cdkTextareaAutosize", "", "cdkAutosizeMaxRows", "50", 1, "w-full", "border", "border-tab", "rounded-base", "!p-0", "!bg-white", "text-xs", "text-grey", "outline-none", "h-8.5", "arbitrator", "cover-textarea", 3, "input", "focusout", "matAutocomplete", "value"], [1, "flex", "gap-1", "w-2/6"], [1, "w-[40%]"], ["type", "text", "placeholder", "Day #", "formControlName", "cCDay", 1, "border", "border-tab", "rounded-base", "py-2.5", "px-4", "text-xs", "text-light-grey", "w-full", "outline-none", "h-8.5", 3, "ngModelChange", "focusout"], [1, "w-[60%]", 3, "dateChange", "date"], [1, "flex", "flex-col", "gap-2", "w-1/2"], [1, "flex", "items-start", "gap-2"], ["placeholder", "Name of Case type", "formcontrolname", "cBClaimentH", 1, "w-full", 3, "suggestions", "value"], [1, "w-full", "extra-txetarea", 2, "--extra-txetarea-height", "111px"], ["matInput", "", "placeholder", "List of Claimant", "formcontrolname", "cBClaiment", "cdkTextareaAutosize", "", "cdkAutosizeMaxRows", "50", "rows", "3", 1, "w-full", "border", "border-tab", "rounded-base", "!p-0", "!bg-white", "text-xs", "text-grey", "outline-none", "behalf-claimant", "cover-textarea", 3, "input", "focusout", "matAutocomplete", "value"], [1, "flex", "gap-2", "items-start", "w-1/2"], [1, "flex", "flex-col", "gap-2", "w-full"], [1, "flex", "items-center", "gap-1"], ["placeholder", "Name of Case type", "formcontrolname", "cBRespondentH", 1, "w-full", 3, "suggestions", "value"], ["matInput", "", "placeholder", "List of Respondent", "formcontrolname", "cBRespondent", "cdkTextareaAutosize", "", "cdkAutosizeMaxRows", "50", 1, "w-full", "border", "border-tab", "rounded-base", "!p-0", "!bg-white", "text-xs", "text-grey", "outline-none", "behalf-respondent", "cover-textarea", 3, "input", "focusout", "matAutocomplete", "value"], [1, "flex", "flex-col", "gap-1", "mt-6"], ["placeholder", "Name of Case type", "formcontrolname", "cClaimentH", 1, "w-full", 3, "valueChange", "onFocusOut", "suggestions", "value"], ["name", "edit", 1, "text-grey", "text-xs", 3, "click"], ["placeholder", "Name of Case type", "formcontrolname", "cRespondentH", 1, "w-full", 3, "valueChange", "onFocusOut", "suggestions", "value"], ["placeholder", "Name of Case type", "formcontrolname", "cArbitratorH", 1, "w-full", 3, "valueChange", "onFocusOut", "suggestions", "value"], ["placeholder", "Name of Case type", "formcontrolname", "cBClaimentH", 1, "w-full", 3, "valueChange", "onFocusOut", "suggestions", "value"], ["placeholder", "Name of Case type", "formcontrolname", "cBRespondentH", 1, "w-full", 3, "valueChange", "onFocusOut", "suggestions", "value"], [1, "flex", "gap-6", "w-full"], [1, "w-full"], ["matInput", "", "placeholder", "Case Name", "formcontrolname", "cCasename", "rows", "1", 1, "w-full", "border", "border-tab", "rounded-base", "!p-2.5", "!bg-white", "text-xs", "text-grey", "outline-none", "h-8.5", "cover-textarea", 3, "input", "keydown", "change", "focusout", "paste", "matAutocomplete", "value"], [1, "flex", "flex-col", "gap-2", "min-w-36", "flex-1"], ["matInput", "", "type", "text", "formControlName", "cTCaseno", "placeholder", "Case Number", 1, "bg-white", "border", "border-tab", "!px-2.5", "rounded-base", "min-h-8.5", "text-xs", "text-grey", "w-full", "outline-none", 3, "input", "ngModelChange", "focusout", "paste", "maxlength", "matAutocomplete", "value"], [3, "dateChange", "date", "disabled"], ["formGroupName", "tTTime", 1, "flex", "items-center", "gap-1"], ["type", "text", "formControlName", "hours", 1, "flex", "items-center", "w-11", "border", "border-tab", "rounded-base", "py-2.5", "px-1", "text-xs", "text-grey", "outline-none", "appearance-none", "text-center", "h-8.5"], ["type", "text", "formControlName", "minutes", 1, "flex", "items-center", "w-11", "border", "border-tab", "rounded-base", "py-2.5", "px-1", "text-xs", "text-grey", "outline-none", "appearance-none", "text-center", "h-8.5"], [1, "flex", "flex-col", "gap-2", "flex-1"], ["matInput", "", "placeholder", "Name of Reporter", "formcontrolname", "cReporter", "rows", "1", 1, "w-full", "border", "border-tab", "rounded-base", "!p-2.5", "!bg-white", "text-xs", "text-grey", "outline-none", "h-8.5", 3, "input", "focusout", "paste", "matAutocomplete", "ngStyle", "value"], [1, "w-full", "extra-txetarea-2rows"], ["matInput", "", "formcontrolname", "cTitle", "cdkTextareaAutosize", "", "cdkAutosizeMinRows", "2", "cdkAutosizeMaxRows", "50", 1, "w-full", "border", "border-tab", "rounded-base", "!p-0", "!bg-white", "text-xs", "text-grey", "outline-none", "min-w-[316.48px]", "max-w-[316.48px]", "textarea-hf", 3, "input", "blur", "keydown", "focusout", "paste", "matAutocomplete", "ngStyle", "value"], [1, "flex", "gap-1", "w-1/2"], [1, "flex", "flex-col", "gap-2", "w-[73px]"], ["type", "text", "placeholder", "Day #", "formControlName", "cTVolume", "maxlength", "50", 1, "border", "border-tab", "rounded-base", "!p-2.5", "!bg-white", "text-xs", "text-light-grey", "w-full", "outline-none", "h-8.5", 3, "ngModelChange", "focusout"], [1, "flex", "flex-col", "gap-2", "w-36"], ["matInput", "", "placeholder", "Company Name", "formcontrolname", "cCompany", "cdkTextareaAutosize", "", "cdkAutosizeMinRows", "2", "cdkAutosizeMaxRows", "50", "maxlength", "120", "maxlength", "500", 1, "w-full", "border", "border-tab", "rounded-base", "!p-0", "!bg-white", "text-xs", "text-grey", "outline-none", "h-8.5", "min-w-[316.48px]", "max-w-[316.48px]", "textarea-hf", 3, "input", "focusout", "keydown", "paste", "matAutocomplete", "value"], ["matInput", "", "placeholder", "Company Info", "formcontrolname", "cCompanyinfo", "rows", "2", "maxlength", "120", "cdkTextareaAutosize", "", "cdkAutosizeMinRows", "2", "cdkAutosizeMaxRows", "50", "maxlength", "500", 1, "w-full", "border", "border-tab", "rounded-base", "!p-0", "!bg-white", "text-xs", "text-grey", "outline-none", "h-8.5", "min-w-[316.48px]", "max-w-[316.48px]", "textarea-hf", 3, "input", "focusout", "keydown", "paste", "matAutocomplete", "value"], [3, "click", "disabled"], [1, "text-xs", "text-white"], ["mode", "white", 3, "click"], [1, "text-xs", "text-grey"]], template: function TranscriptPropertiesComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "form", 14)(1, "div", 15)(2, "div", 16)(3, "div")(4, "h2", 17);
        \u0275\u0275text(5, "Transcript Properties");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(6, "div", 18)(7, "span", 19);
        \u0275\u0275text(8, "Theme");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "div", 20)(10, "mat-select", 21);
        \u0275\u0275twoWayListener("ngModelChange", function TranscriptPropertiesComponent_Template_mat_select_ngModelChange_10_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.cThemeid, $event) || (ctx.cThemeid = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function TranscriptPropertiesComponent_Template_mat_select_selectionChange_10_listener($event) {
          return ctx.onThemeChange($event);
        });
        \u0275\u0275repeaterCreate(11, TranscriptPropertiesComponent_For_12_Template, 2, 2, "mat-option", 22, _forTrack0);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(13, "btn", 23);
        \u0275\u0275listener("click", function TranscriptPropertiesComponent_Template_btn_click_13_listener() {
          return ctx.openTheme();
        });
        \u0275\u0275element(14, "icon", 24);
        \u0275\u0275elementStart(15, "span", 25);
        \u0275\u0275text(16, "Theme");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(17, "btn", 23);
        \u0275\u0275listener("click", function TranscriptPropertiesComponent_Template_btn_click_17_listener() {
          return ctx.openTheme("E");
        });
        \u0275\u0275elementStart(18, "span", 25);
        \u0275\u0275text(19, "Edit");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(20, "div", 26)(21, "div", 27);
        \u0275\u0275listener("click", function TranscriptPropertiesComponent_Template_div_click_21_listener() {
          return ctx.trasview = "C";
        });
        \u0275\u0275elementStart(22, "div", 28)(23, "span", 29);
        \u0275\u0275text(24, "Cover Properties");
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(25, "svg", 30);
        \u0275\u0275element(26, "path", 31);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(27, "svg", 32);
        \u0275\u0275element(28, "path", 33);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(29, "div", 34)(30, "div", 35);
        \u0275\u0275listener("click", function TranscriptPropertiesComponent_Template_div_click_30_listener() {
          return ctx.trasview = "T";
        });
        \u0275\u0275elementStart(31, "span", 29);
        \u0275\u0275text(32, "Transcript Properties");
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(33, "svg", 30);
        \u0275\u0275element(34, "path", 31);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(35, "div", 36)(36, "span", 19);
        \u0275\u0275text(37, "Spacing");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(38, "mat-radio-group", 37)(39, "mat-radio-button", 38);
        \u0275\u0275text(40, "Single");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(41, "mat-radio-button", 38);
        \u0275\u0275text(42, "Double");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275template(43, TranscriptPropertiesComponent_Conditional_43_Template, 119, 48)(44, TranscriptPropertiesComponent_Conditional_44_Template, 93, 35);
        \u0275\u0275elementEnd();
        \u0275\u0275template(45, TranscriptPropertiesComponent_Conditional_45_Template, 7, 1, "div", 39);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(46, "div", 40);
        \u0275\u0275element(47, "app-transcript-preview", 41);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275property("formGroup", ctx.transcriptForm);
        \u0275\u0275advance(10);
        \u0275\u0275twoWayProperty("ngModel", ctx.cThemeid);
        \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(19, _c12));
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.themes);
        \u0275\u0275advance(11);
        \u0275\u0275classMap(ctx.trasview === "C" ? "!bg-blue-on text-blue-on" : "");
        \u0275\u0275advance(3);
        \u0275\u0275classMap(ctx.trasview === "C" ? "!text-blue-on" : "");
        \u0275\u0275advance(5);
        \u0275\u0275classMap(ctx.trasview === "T" ? "!bg-blue-on text-blue-on" : "");
        \u0275\u0275advance(3);
        \u0275\u0275classMap(ctx.trasview === "T" ? "!text-blue-on" : "");
        \u0275\u0275advance(6);
        \u0275\u0275property("value", 1);
        \u0275\u0275advance(2);
        \u0275\u0275property("value", 2);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(43, ctx.trasview === "C" ? 43 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(44, ctx.trasview === "T" ? 44 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(45, ctx.trasview === "T" ? 45 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275property("formData", ctx.formData)("htmlContent", ctx.htmlContent)("changeTheme", ctx.isChangeTheme);
      }
    }, dependencies: [
      CommonModule,
      NgStyle,
      AsyncPipe,
      IconComponent,
      ButtonComponent,
      DatepickerComponent,
      MatSelectModule,
      MatFormField,
      MatSelect,
      MatOption,
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
      ContentEditableComponent,
      MatNativeDateModule,
      MatDatepickerModule,
      MatInputModule,
      MatInput,
      CdkTextareaAutosize,
      MatFormFieldModule,
      TranscriptPreviewComponent,
      MatAutocompleteModule,
      MatAutocomplete,
      MatAutocompleteTrigger,
      TextFieldModule,
      MatRadioModule,
      MatRadioGroup,
      MatRadioButton
    ], styles: ['\n\n[_nghost-%COMP%] {\n  display: block;\n  height: 100%;\n}\n  .transcript-properties-dialog .mat-dialog-container {\n  padding: 0;\n  overflow: hidden;\n  border-radius: 8px;\n}\n.bg-grey\\/5[_ngcontent-%COMP%] {\n  background-color: rgba(0, 0, 0, 0.05);\n}\n.preview-container[_ngcontent-%COMP%] {\n  background-color: white;\n  overflow-y: auto;\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);\n  border-radius: 8px;\n}\n@media print {\n  .preview-container[_ngcontent-%COMP%] {\n    overflow: visible;\n    height: auto;\n  }\n}\n.page[_ngcontent-%COMP%] {\n  background-color: white;\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n  margin-bottom: 20px;\n}\n@media print {\n  .page[_ngcontent-%COMP%] {\n    box-shadow: none;\n    margin: 0;\n    page-break-after: always;\n  }\n}\n@media print {\n  [_nghost-%COMP%] {\n    height: auto;\n    overflow: visible;\n  }\n  .preview-container[_ngcontent-%COMP%] {\n    height: auto !important;\n  }\n}\n.zoom-50[_ngcontent-%COMP%] {\n  zoom: 49%;\n}\ntextarea[_ngcontent-%COMP%], input[_ngcontent-%COMP%] {\n  font-size: var(--cover-font-size) !important;\n  font-family: var(--cover-font-family) !important;\n  letter-spacing: var(--body-letter-spacing) !important;\n  resize: none;\n}\ntextarea.casetype[_ngcontent-%COMP%], input.casetype[_ngcontent-%COMP%] {\n  font-weight: var(--case-type-bold) !important;\n  text-transform: var(--casetype-transform);\n}\ntextarea.respondent[_ngcontent-%COMP%], input.respondent[_ngcontent-%COMP%] {\n  font-weight: var(--parties-bold) !important;\n}\ntextarea.claimant[_ngcontent-%COMP%], input.claimant[_ngcontent-%COMP%] {\n  font-weight: var(--parties-bold) !important;\n}\ntextarea.arbitrator[_ngcontent-%COMP%], input.arbitrator[_ngcontent-%COMP%] {\n  font-weight: var(--before-bold) !important;\n}\ntextarea.behalf-claimant[_ngcontent-%COMP%], input.behalf-claimant[_ngcontent-%COMP%] {\n  font-weight: var(--appearances-bold) !important;\n}\ntextarea.behalf-respondent[_ngcontent-%COMP%], input.behalf-respondent[_ngcontent-%COMP%] {\n  font-weight: var(--appearances-bold) !important;\n}\n.cover-textarea[_ngcontent-%COMP%] {\n  min-width: var(--cover-width);\n}\n.textarea-hf[_ngcontent-%COMP%] {\n  font-size: var(--header-footer-font-size, "16px") !important;\n  font-family: var(--header-footer-font-family) !important;\n}\n/*# sourceMappingURL=transcript-properties.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TranscriptPropertiesComponent, { className: "TranscriptPropertiesComponent", filePath: "src\\app\\adminpanel\\components\\transscript\\transcript-properties\\transcript-properties.component.ts", lineNumber: 67 });
})();

export {
  TranscriptPreviewComponent,
  MY_DATE_FORMATS,
  TranscriptPropertiesComponent
};
//# sourceMappingURL=chunk-R755NOM2.js.map
