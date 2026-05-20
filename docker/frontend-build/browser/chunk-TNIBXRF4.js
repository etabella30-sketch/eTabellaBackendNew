import {
  require_moment
} from "./chunk-BXSF7XA6.js";
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
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  BROADCAST_EVENTS,
  BroadcastingService
} from "./chunk-6RMJH3FI.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  DomSanitizer,
  Router
} from "./chunk-FNSUDMGC.js";
import {
  CommonModule,
  DOCUMENT,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  Directive,
  EventEmitter,
  Inject,
  Injectable,
  InjectionToken,
  Input,
  InputFlags,
  NgModule,
  NgZone,
  Optional,
  Output,
  __async,
  __toESM,
  setClassMetadata,
  take,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/dialogue/dialogue.component.ts
var _c0 = (a0, a1) => ({ "text-sred": a0, "text-sgreen": a1 });
function DialogueComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 2);
  }
}
function DialogueComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 3);
  }
}
function DialogueComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 3);
  }
}
function DialogueComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.data == null ? null : ctx_r0.data.desc);
  }
}
function DialogueComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 6);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("innerHTML", ctx_r0.data == null ? null : ctx_r0.data.html, \u0275\u0275sanitizeHtml);
  }
}
function DialogueComponent_btn_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 10);
    \u0275\u0275listener("click", function DialogueComponent_btn_12_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.close(ctx_r0.data == null ? null : ctx_r0.data.bt2res));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.data == null ? null : ctx_r0.data.button2);
  }
}
function DialogueComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-checkbox");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.data == null ? null : ctx_r0.data.checkbox);
  }
}
var DialogueComponent = class _DialogueComponent {
  constructor(data, dialogRef) {
    this.data = data;
    this.dialogRef = dialogRef;
    console.log(data);
  }
  close(res) {
    this.dialogRef.close({ res });
  }
  static {
    this.\u0275fac = function DialogueComponent_Factory(t) {
      return new (t || _DialogueComponent)(\u0275\u0275directiveInject(MAT_DIALOG_DATA), \u0275\u0275directiveInject(MatDialogRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DialogueComponent, selectors: [["app-dialogue"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 14, vars: 13, consts: [[1, "bg-white", "p-10"], [1, "[&>img]:w-5"], ["src", "../../../../assets/icons/tip.svg"], ["src", "../../../../assets/icons/warningred.svg"], [1, "text-lg", "font-semibold", "my-2.5", "leading-snug", 3, "ngClass"], [1, "text-xs"], [3, "innerHTML"], [1, "flex", "gap-3", "mt-6", "items-center"], [3, "click"], ["mode", "white", 3, "click", 4, "ngIf"], ["mode", "white", 3, "click"]], template: function DialogueComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
        \u0275\u0275template(2, DialogueComponent_Conditional_2_Template, 1, 0, "img", 2)(3, DialogueComponent_Conditional_3_Template, 1, 0, "img", 3)(4, DialogueComponent_Conditional_4_Template, 1, 0, "img", 3);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "h6", 4);
        \u0275\u0275text(6);
        \u0275\u0275elementEnd();
        \u0275\u0275template(7, DialogueComponent_Conditional_7_Template, 2, 1, "h6", 5)(8, DialogueComponent_Conditional_8_Template, 1, 1, "div", 6);
        \u0275\u0275elementStart(9, "div", 7)(10, "btn", 8);
        \u0275\u0275listener("click", function DialogueComponent_Template_btn_click_10_listener() {
          return ctx.close(ctx.data == null ? null : ctx.data.bt1res);
        });
        \u0275\u0275text(11);
        \u0275\u0275elementEnd();
        \u0275\u0275template(12, DialogueComponent_btn_12_Template, 2, 1, "btn", 9)(13, DialogueComponent_Conditional_13_Template, 2, 1, "mat-checkbox");
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275conditional(2, (ctx.data == null ? null : ctx.data.type) == "I" ? 2 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(3, (ctx.data == null ? null : ctx.data.type) == "E" ? 3 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(4, (ctx.data == null ? null : ctx.data.type) == "S" ? 4 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(10, _c0, (ctx.data == null ? null : ctx.data.type) == "E", (ctx.data == null ? null : ctx.data.type) == "I"));
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" ", ctx.data == null ? null : ctx.data.heading, "");
        \u0275\u0275advance();
        \u0275\u0275conditional(7, (ctx.data == null ? null : ctx.data.desc) ? 7 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(8, (ctx.data == null ? null : ctx.data.html) ? 8 : -1);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate(ctx.data == null ? null : ctx.data.button1);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.data == null ? null : ctx.data.button2);
        \u0275\u0275advance();
        \u0275\u0275conditional(13, (ctx.data == null ? null : ctx.data.checkbox) ? 13 : -1);
      }
    }, dependencies: [CommonModule, NgClass, NgIf, ButtonComponent, MatCheckboxModule, MatCheckbox] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DialogueComponent, { className: "DialogueComponent", filePath: "src\\app\\shared\\components\\dialogue\\dialogue.component.ts", lineNumber: 14 });
})();

// src/app/core/utility/commonfunction.service.ts
var import_moment = __toESM(require_moment());

// src/app/shared/interfaces/commonfunction.interface.ts
var COLOR_MAP = {
  "bg-slate-500": ["A", "N"],
  "bg-gray-800": ["B", "O"],
  "bg-zinc-600": ["C", "P"],
  "bg-neutral-800": ["D", "Q"],
  "bg-stone-600": ["E", "R"],
  "bg-red-600": ["F", "S"],
  "bg-brand": ["G", "T"],
  "bg-amber-600": ["H", "U"],
  "bg-lime-700": ["I", "V"],
  "bg-green-700": ["J", "W"],
  "bg-emerald-600": ["K", "X"],
  "bg-teal-500": ["L", "Y"],
  "bg-cyan-600": ["M", "Z"]
};
var DEFAULT_SEARCH_FILTER_TEMPLATE = [
  {
    cKey: "Name",
    list: [
      { cKey: "Exact", nValue: "E", select: true },
      { cKey: "Contain", nValue: "C", select: false },
      { cKey: "Start with", nValue: "S", select: false }
    ]
  },
  {
    cKey: "Metadata types",
    list: [
      { cKey: "Documentary", nValue: "D", select: true },
      { cKey: "Email", nValue: "E", select: false },
      { cKey: "Expert opinion", nValue: "T", select: false },
      { cKey: "Record", nValue: "A", select: false }
    ]
  },
  {
    cKey: "Location",
    list: [
      { cKey: "Global", nValue: "A", select: true },
      { cKey: "Current Location", nValue: "T", select: false }
    ]
  },
  {
    cKey: "Date Formats",
    list: [
      { cKey: "DD-MM-YYYY", nValue: "DD-MM-YYYY", select: false },
      { cKey: "DD MON YYYY", nValue: "DD MON YYYY", select: false },
      { cKey: "MM-YYYY", nValue: "MM-YYYY", select: false },
      { cKey: "YYYY", nValue: "YYYY", select: false },
      { cKey: "DD - DD MON YYYY", nValue: "DD - DD MON YYYY", select: false },
      { cKey: "DD - DD MM YYYY", nValue: "DD - DD MM YYYY", select: false },
      { cKey: "MON - MON YYYY", nValue: "MON - MON YYYY", select: false },
      { cKey: "MM - MM YYYY", nValue: "MM - MM YYYY", select: false },
      { cKey: "YYYY - YYYY", nValue: "YYYY - YYYY", select: false }
    ]
  },
  {
    cKey: "File Type",
    list: [
      { cKey: "PDF", nValue: "P", types: ["PDF"], select: false, content: true },
      { cKey: "Image", nValue: "I", types: ["JPG", "PNG", "JPEG", "WEBP", "GIF"], select: false, content: false },
      { cKey: "MS Excel", nValue: "E", types: ["XLSX", "XLS", "XLSM", "XLSB"], select: false, content: false },
      { cKey: "MS Word", nValue: "D", types: ["DOCX", "DOTX", "DOC", "DOCM"], select: false, content: false },
      { cKey: "MS Powerpoint", nValue: "P", types: ["PPTX", "PPT"], select: false, content: false },
      { cKey: "Video", nValue: "V", types: ["MP4", "AVI", "MOV", "WMV", "MKV"], select: false, content: false },
      { cKey: "Folder", nValue: "F", types: ["FOLDER"], select: false, content: false },
      { cKey: "Email", nValue: "EM", types: ["MSG"], select: false, content: false }
    ]
  }
];
function createDefaultSearchFilter() {
  return structuredClone(DEFAULT_SEARCH_FILTER_TEMPLATE);
}

// node_modules/@angular/cdk/fesm2022/clipboard.mjs
var PendingCopy = class {
  constructor(text, _document) {
    this._document = _document;
    const textarea = this._textarea = this._document.createElement("textarea");
    const styles = textarea.style;
    styles.position = "fixed";
    styles.top = styles.opacity = "0";
    styles.left = "-999em";
    textarea.setAttribute("aria-hidden", "true");
    textarea.value = text;
    textarea.readOnly = true;
    (this._document.fullscreenElement || this._document.body).appendChild(textarea);
  }
  /** Finishes copying the text. */
  copy() {
    const textarea = this._textarea;
    let successful = false;
    try {
      if (textarea) {
        const currentFocus = this._document.activeElement;
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        successful = this._document.execCommand("copy");
        if (currentFocus) {
          currentFocus.focus();
        }
      }
    } catch {
    }
    return successful;
  }
  /** Cleans up DOM changes used to perform the copy operation. */
  destroy() {
    const textarea = this._textarea;
    if (textarea) {
      textarea.remove();
      this._textarea = void 0;
    }
  }
};
var Clipboard = class _Clipboard {
  constructor(document) {
    this._document = document;
  }
  /**
   * Copies the provided text into the user's clipboard.
   *
   * @param text The string to copy.
   * @returns Whether the operation was successful.
   */
  copy(text) {
    const pendingCopy = this.beginCopy(text);
    const successful = pendingCopy.copy();
    pendingCopy.destroy();
    return successful;
  }
  /**
   * Prepares a string to be copied later. This is useful for large strings
   * which take too long to successfully render and be copied in the same tick.
   *
   * The caller must call `destroy` on the returned `PendingCopy`.
   *
   * @param text The string to copy.
   * @returns the pending copy operation.
   */
  beginCopy(text) {
    return new PendingCopy(text, this._document);
  }
  static {
    this.\u0275fac = function Clipboard_Factory(t) {
      return new (t || _Clipboard)(\u0275\u0275inject(DOCUMENT));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
      token: _Clipboard,
      factory: _Clipboard.\u0275fac,
      providedIn: "root"
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Clipboard, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], null);
})();
var CDK_COPY_TO_CLIPBOARD_CONFIG = new InjectionToken("CDK_COPY_TO_CLIPBOARD_CONFIG");
var CdkCopyToClipboard = class _CdkCopyToClipboard {
  constructor(_clipboard, _ngZone, config) {
    this._clipboard = _clipboard;
    this._ngZone = _ngZone;
    this.text = "";
    this.attempts = 1;
    this.copied = new EventEmitter();
    this._pending = /* @__PURE__ */ new Set();
    if (config && config.attempts != null) {
      this.attempts = config.attempts;
    }
  }
  /** Copies the current text to the clipboard. */
  copy(attempts = this.attempts) {
    if (attempts > 1) {
      let remainingAttempts = attempts;
      const pending = this._clipboard.beginCopy(this.text);
      this._pending.add(pending);
      const attempt = () => {
        const successful = pending.copy();
        if (!successful && --remainingAttempts && !this._destroyed) {
          this._currentTimeout = this._ngZone.runOutsideAngular(() => setTimeout(attempt, 1));
        } else {
          this._currentTimeout = null;
          this._pending.delete(pending);
          pending.destroy();
          this.copied.emit(successful);
        }
      };
      attempt();
    } else {
      this.copied.emit(this._clipboard.copy(this.text));
    }
  }
  ngOnDestroy() {
    if (this._currentTimeout) {
      clearTimeout(this._currentTimeout);
    }
    this._pending.forEach((copy) => copy.destroy());
    this._pending.clear();
    this._destroyed = true;
  }
  static {
    this.\u0275fac = function CdkCopyToClipboard_Factory(t) {
      return new (t || _CdkCopyToClipboard)(\u0275\u0275directiveInject(Clipboard), \u0275\u0275directiveInject(NgZone), \u0275\u0275directiveInject(CDK_COPY_TO_CLIPBOARD_CONFIG, 8));
    };
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
      type: _CdkCopyToClipboard,
      selectors: [["", "cdkCopyToClipboard", ""]],
      hostBindings: function CdkCopyToClipboard_HostBindings(rf, ctx) {
        if (rf & 1) {
          \u0275\u0275listener("click", function CdkCopyToClipboard_click_HostBindingHandler() {
            return ctx.copy();
          });
        }
      },
      inputs: {
        text: [InputFlags.None, "cdkCopyToClipboard", "text"],
        attempts: [InputFlags.None, "cdkCopyToClipboardAttempts", "attempts"]
      },
      outputs: {
        copied: "cdkCopyToClipboardCopied"
      },
      standalone: true
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkCopyToClipboard, [{
    type: Directive,
    args: [{
      selector: "[cdkCopyToClipboard]",
      host: {
        "(click)": "copy()"
      },
      standalone: true
    }]
  }], () => [{
    type: Clipboard
  }, {
    type: NgZone
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [CDK_COPY_TO_CLIPBOARD_CONFIG]
    }]
  }], {
    text: [{
      type: Input,
      args: ["cdkCopyToClipboard"]
    }],
    attempts: [{
      type: Input,
      args: ["cdkCopyToClipboardAttempts"]
    }],
    copied: [{
      type: Output,
      args: ["cdkCopyToClipboardCopied"]
    }]
  });
})();
var ClipboardModule = class _ClipboardModule {
  static {
    this.\u0275fac = function ClipboardModule_Factory(t) {
      return new (t || _ClipboardModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
      type: _ClipboardModule
    });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({});
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ClipboardModule, [{
    type: NgModule,
    args: [{
      imports: [CdkCopyToClipboard],
      exports: [CdkCopyToClipboard]
    }]
  }], null, null);
})();

// src/app/core/utility/commonfunction.service.ts
var MULTI_DEVICE_EXEMPT_CASE_ID = "966922a8-1e20-4ea5-8b79-10a395b7fea9";
var MULTI_DEVICE_SESSION_KEY = "multi_device_case_active";
var CommonfunctionService = class _CommonfunctionService {
  static {
    this.VALID_PROTOCOLS = /* @__PURE__ */ new Set(["http:", "https:"]);
  }
  static buildIndividualDocUrl(payload) {
    return `${globalThis.location.origin}/individual/doc/${encodeURIComponent(JSON.stringify(payload))}`;
  }
  constructor(router, dialog, sanitizer, clipboard, broadCastService, tost) {
    this.router = router;
    this.dialog = dialog;
    this.sanitizer = sanitizer;
    this.clipboard = clipboard;
    this.broadCastService = broadCastService;
    this.tost = tost;
    this.colorMap = COLOR_MAP;
    this.searchFilter = createDefaultSearchFilter();
    this.searchText = "";
    this.searchName = "C";
    this.searchdate = "A";
    this.searchin = "M";
    this.isPagination = false;
    this.paginationIDs = [];
    this.displaytype = "";
    this.jFTypes = [];
    this.isConvert = false;
    this.convertData = { queueLength: 0, total_prog: 0 };
    this.viewlist = [];
    this.openedWindow = null;
  }
  resetState() {
    this.searchFilter = createDefaultSearchFilter();
    this.searchText = "";
    this.searchName = "C";
    this.searchdate = "A";
    this.searchin = "M";
    this.isPagination = false;
    this.paginationdata = void 0;
    this.paginationIDs = [];
    this.displaytype = "";
    this.jFTypes = [];
    this.viewlist = [];
  }
  getUserInitials(x) {
    if (!x) {
      return null;
    }
    const firstNameInitial = x?.cFname ? x.cFname.substring(0, 1).toUpperCase() : "";
    const lastNameInitial = x?.cLname ? x.cLname.substring(0, 1).toUpperCase() : "";
    const background = firstNameInitial ? this.initialcolor(firstNameInitial) : this.initialcolor("");
    return { Fn: firstNameInitial.toString(), Ln: lastNameInitial, bg: background };
  }
  get_userinit(x) {
    return __async(this, null, function* () {
      return this.getUserInitials(x);
    });
  }
  get_userinit2(x) {
    return this.getUserInitials(x);
  }
  initialcolor(initial) {
    for (const [color, letters] of Object.entries(this.colorMap)) {
      if (letters.includes(initial.toUpperCase())) {
        return color;
      }
    }
    return "bg-orange-600";
  }
  goto(path, mdl) {
    if (mdl && Object.keys(mdl).length) {
      const url = btoa(JSON.stringify(mdl));
      this.router.navigate([path, url], { relativeTo: null });
    } else {
      this.router.navigate([path], { replaceUrl: true });
    }
  }
  gotoEncoduri(path, mdl) {
    if (mdl && Object.keys(mdl).length) {
      const url = encodeURIComponent(JSON.stringify(mdl));
      this.router.navigate([path, url], { relativeTo: null });
    } else {
      this.router.navigate([path]);
    }
  }
  fetchRoleid(teams, nUserid) {
    return __async(this, null, function* () {
      let nMyroleid = 0;
      try {
        if (nUserid && teams?.length) {
          for (const x of teams) {
            if (x.users?.length) {
              const userObj = x.users.find((a) => a.nUserid == nUserid);
              if (userObj) {
                nMyroleid = userObj.nRoleid;
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetchRoleid", nUserid, error);
        nMyroleid = 0;
      }
      return nMyroleid;
    });
  }
  opendialog(type, head, desc, button1, button2, checkbox) {
    const dialogRef = this.dialog.open(DialogueComponent, {
      width: "fit-content",
      minWidth: "500px",
      height: "fit-content",
      data: {
        "type": type,
        // 'I'
        "heading": head,
        "desc": desc,
        "button1": button1 ?? "",
        "button2": button2 ?? "",
        "checkbox": checkbox ?? ""
      }
    });
    dialogRef.afterClosed().subscribe(() => {
    });
  }
  getCurrentTime() {
    return (0, import_moment.default)().format();
  }
  getDateFormate(dt, formate) {
    return (0, import_moment.default)(dt).format(formate);
  }
  // senitizeUrl(path: string, nBundledetailid: string, nCaseid: string, isFullmode?: boolean, isLink?: highlightModeType, pageNo?: number, isRealtime?: boolean,
  //   compareMode?: boolean, compareIndex?: number, linkExplorerMode?: string, linkExplorerType?: string, nRFSid?: string, nRDocid?: string, nRWebid?: string, isMyfile?: boolean, activesectiontype?: string, nSectionid?: string, nPresentid?: string, isHost?: boolean, jFilter?: string) {
  //   return this.sanitizer.bypassSecurityTrustResourceUrl(`viewer/pdf/${btoa(path)}?nBundledetailid=${nBundledetailid}&nCaseid=${nCaseid}&fullmode=${isFullmode ? 'Y' : 'N'}&isLink=${isLink ? isLink : 'N'}&page=${pageNo ? pageNo : 1}&isRealtime=${isRealtime ? 'Y' : 'N'}&compareMode=${compareMode ? 'Y' : 'N'}&compareIndex=${compareIndex ? compareIndex : 0}&linkExplorerMode=${linkExplorerMode ? linkExplorerMode : ''}&linkExplorerType=${linkExplorerType ? linkExplorerType : ''}&nRFSid=${nRFSid || null}&nRDocid=${nRDocid || null}&nRWebid=${nRWebid || null}&isMyfile=${isMyfile || false}&activesectiontype=${activesectiontype || 'MB'}&nSectionid=${nSectionid}&nPresentid=${nPresentid}&isHost=${isHost ? 'Y' : 'N'}&jFilter=${jFilter}`);
  // }
  static createPdfViewerUrl(path, params) {
    return `viewer/pdf/${btoa(path)}?${params.toString()}`;
  }
  static yes() {
    return "Y";
  }
  static no() {
    return "N";
  }
  senitizeUrl(...args) {
    const [path, nBundledetailid, nCaseid, isFullmode, isLink, pageNo, isRealtime, compareMode, compareIndex, linkExplorerMode, linkExplorerType, nRFSid, nRDocid, nRWebid, isMyfile, activesectiontype, nSectionid, nPresentid, isHost, jFilter, lineNo, isPresenter] = args;
    const params = new URLSearchParams();
    params.set("nBundledetailid", nBundledetailid);
    params.set("nCaseid", nCaseid);
    params.set("fullmode", isFullmode ? _CommonfunctionService.yes() : _CommonfunctionService.no());
    params.set("isLink", isLink ?? "N");
    params.set("page", String(pageNo ?? 1));
    params.set("isRealtime", isRealtime ? _CommonfunctionService.yes() : _CommonfunctionService.no());
    params.set("compareMode", compareMode ? _CommonfunctionService.yes() : _CommonfunctionService.no());
    params.set("compareIndex", String(compareIndex ?? 0));
    params.set("linkExplorerMode", linkExplorerMode ?? "");
    params.set("linkExplorerType", linkExplorerType ?? "");
    if (nRFSid)
      params.set("nRFSid", nRFSid);
    if (nRDocid)
      params.set("nRDocid", nRDocid);
    if (nRWebid)
      params.set("nRWebid", nRWebid);
    params.set("isMyfile", String(isMyfile ?? false));
    params.set("activesectiontype", activesectiontype ?? "MB");
    if (nSectionid)
      params.set("nSectionid", nSectionid);
    if (nPresentid)
      params.set("nPresentid", nPresentid);
    params.set("isHost", isHost ? _CommonfunctionService.yes() : _CommonfunctionService.no());
    params.set("jFilter", jFilter ?? "");
    params.set("lineNo", String(lineNo ?? 1));
    params.set("isPresenter", isPresenter ? _CommonfunctionService.yes() : _CommonfunctionService.no());
    return this.sanitizer.bypassSecurityTrustResourceUrl(_CommonfunctionService.createPdfViewerUrl(path, params));
  }
  senitizeQuick(nBundledetailid, nPage, nCaseid) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`quickview/${nBundledetailid}?nPage=${nPage}&nCaseid=${nCaseid}`);
  }
  notfoundUrl() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`empty?icon=pdf`);
  }
  copyText(text) {
    this.clipboard.copy(text);
  }
  validateUrl(url) {
    const trimmed = url?.trim();
    if (!trimmed) {
      return false;
    }
    try {
      const candidate = /^(https?:)?\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(candidate);
      return _CommonfunctionService.VALID_PROTOCOLS.has(parsed.protocol);
    } catch {
      return false;
    }
  }
  gotoUrl(path, mdl) {
    if (mdl && Object.keys(mdl).length) {
      const data = encodeURIComponent(JSON.stringify(mdl));
      this.router.navigate([path, data], { relativeTo: null });
    } else {
      this.router.navigate([path]);
    }
  }
  openTab(nBundledetailid, nCaseid, nPresentid, cIsindex) {
    return new Promise((resolve, reject) => {
      const timeot = setTimeout(() => {
        reject(new Error("No tab open"));
      }, 200);
      this.broadCastService.indiOpenExistsListener().pipe(take(1)).subscribe((body) => {
        clearTimeout(timeot);
        resolve(true);
      });
      this.broadCastService.portMessage({ event: BROADCAST_EVENTS.INDIVIDUAL_OPEN_TAB, data: { nCaseid, nBundledetailid, nPresentid, cIsindex } });
    });
  }
  openHyperLinkFile(...args) {
    return __async(this, null, function* () {
      const [nBundledetailid, nCaseid, nPresentid, jFilter, cIsindex, nPageno, nFSid, nRFSid, nDocid, nWebid, activesectiontype] = args;
      const url = _CommonfunctionService.buildIndividualDocUrl([[[nBundledetailid, nPageno || 1, nFSid, nRFSid, nDocid, nWebid, jFilter]], nCaseid, nPresentid, null]);
      if (cIsindex) {
        const indexWindow = globalThis.open(url, `doc_${nCaseid}_index`);
        indexWindow?.focus();
        return;
      }
      try {
        yield this.openTab(nBundledetailid, nCaseid, nPresentid, cIsindex);
        this.broadCastService.portMessage({ event: BROADCAST_EVENTS.INDIVIDUAL_MULTIPLE_TAB, data: { nCaseid, bId: nBundledetailid, nPresentid, cIsindex, nPageno, nFSid, nRFSid, nDocid, nWebid, activesectiontype } });
        this.openedWindow = globalThis.open("", `doc_${nCaseid}`);
        this.openedWindow?.focus();
      } catch {
        this.openedWindow = globalThis.open(url, `doc_${nCaseid}`);
        this.openedWindow?.focus();
      }
    });
  }
  navigateToindividual(nBundledetailid, nPageno, nCaseid, nPresentid) {
    return __async(this, null, function* () {
      this.router.navigateByUrl(`/individual/doc/${encodeURIComponent(JSON.stringify([[[nBundledetailid, nPageno]], nCaseid, nPresentid]))}`);
    });
  }
  OpenInNewTab(path, mdl) {
    let urlSegments = [path];
    if (mdl && Object.keys(mdl).length > 0) {
      const encoded = btoa(JSON.stringify(mdl));
      urlSegments.push(encoded);
    }
    const tree = this.router.createUrlTree(urlSegments);
    const fullUrl = this.router.serializeUrl(tree);
    const baseUrl = globalThis.location.origin;
    globalThis.open(baseUrl + fullUrl, "_blank");
  }
  /**
   * Opens a transcript / RT session as a new tab in an existing individual-doc
   * window (keyed by nCaseid), or in a fresh window if none is open. Mirrors
   * openHyperLinkFile's broadcast-then-fallback pattern, but carries nSesid in
   * the payload so the receiver can build a session DocumentTab instead of a
   * PDF DocumentTab.
   */
  openSessionInIndividualDoc(nSesid, nCaseid, nPresentid = null) {
    return __async(this, null, function* () {
      if (!nSesid || !nCaseid)
        return;
      const zeroBundleId = "00000000-0000-0000-0000-000000000000";
      const url = _CommonfunctionService.buildIndividualDocUrl([
        [[zeroBundleId, 1, [], null, null, null, null, null, null, nSesid]],
        nCaseid,
        nPresentid,
        null
      ]);
      try {
        yield this.openTab(zeroBundleId, nCaseid, nPresentid, false);
        this.broadCastService.portMessage({
          event: BROADCAST_EVENTS.INDIVIDUAL_MULTIPLE_TAB,
          data: { nCaseid, nSesid, nPresentid, cIsindex: false }
        });
        this.openedWindow = globalThis.open("", `doc_${nCaseid}`);
        this.openedWindow?.focus();
      } catch {
        this.openedWindow = globalThis.open(url, `doc_${nCaseid}`);
        this.openedWindow?.focus();
      }
    });
  }
  openFactSheetMarkNav(...args) {
    return __async(this, null, function* () {
      const [nBundledetailid, nCaseid, nPresentid, jFilter, cIsindex, nPageno, nFSid, nRFSid, nDocid, nWebid, nSesid] = args;
      const url = _CommonfunctionService.buildIndividualDocUrl([[[nBundledetailid, nPageno || 1, [nFSid], nRFSid, nDocid, nWebid, jFilter, null, null, nSesid]], nCaseid, nPresentid, null]);
      const isFactSheet = nBundledetailid === "00000000-0000-0000-0000-000000000000";
      const eventName = isFactSheet ? BROADCAST_EVENTS.INDIVIDUAL_FACT_SHEET_OPEN : BROADCAST_EVENTS.INDIVIDUAL_MULTIPLE_TAB;
      try {
        yield this.openTab(nBundledetailid, nCaseid, nPresentid, cIsindex);
        this.broadCastService.portMessage({ event: eventName, data: { nCaseid, bId: nBundledetailid, nPresentid, cIsindex, nPageno, nFSid, nRFSid, nDocid, nWebid, nSesid } });
        this.openedWindow = globalThis.open("", `doc_${nCaseid}`);
        this.openedWindow?.focus();
      } catch {
        this.openedWindow = globalThis.open(url, cIsindex ? `doc_${nCaseid}_index` : `doc_${nCaseid}`);
        this.openedWindow?.focus();
      }
    });
  }
  static {
    this.\u0275fac = function CommonfunctionService_Factory(t) {
      return new (t || _CommonfunctionService)(\u0275\u0275inject(Router), \u0275\u0275inject(MatDialog), \u0275\u0275inject(DomSanitizer), \u0275\u0275inject(Clipboard), \u0275\u0275inject(BroadcastingService), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CommonfunctionService, factory: _CommonfunctionService.\u0275fac, providedIn: "root" });
  }
};

export {
  DialogueComponent,
  MULTI_DEVICE_EXEMPT_CASE_ID,
  MULTI_DEVICE_SESSION_KEY,
  CommonfunctionService
};
//# sourceMappingURL=chunk-TNIBXRF4.js.map
