import {
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import {
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  FormsModule
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  VariablesService
} from "./chunk-D2JKPWBT.js";
import {
  DomSanitizer
} from "./chunk-FNSUDMGC.js";
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  __spreadValues,
  firstValueFrom,
  map,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/transcript/transcript.service.ts
var TranscriptService = class _TranscriptService {
  constructor(sStore, http, tost, sanitizer) {
    this.sStore = sStore;
    this.http = http;
    this.tost = tost;
    this.sanitizer = sanitizer;
  }
  saveTheme(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/theme_builder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Theme creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  saveTranscript(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/transcript_builder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Transcripr creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  gettheme() {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/get_theme`));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getTranscriptList() {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/get_transcripts`));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getTranscriptDetail(cTransid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/get_transcript_detail`, { params: { cTransid } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getFieldData(searchstr, column_nm) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/get_field_data`, { params: { searchstr, column_nm } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getThemeDetail(cThemeid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/get_theme_detail`, { params: { cThemeid } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  ConvertTextToJSON(cPath) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/convert_txtfile_to_json`, { cPath }));
        if (res && res.msg == 1) {
          return res;
        } else {
          this.tost.openSnackBar(res.value + (res?.error ? `, ${res?.error}` : ""), "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Transcripr creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  transcriptUpload(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/upload/transcript-file`, mdl));
        if (res.msg == -1) {
          this.tost.openSnackBar(`Upload failed ${res.error.message}`, "E");
          return { msg: -1, error: res.error, value: "" };
        } else {
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Upload failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  getFileSummery(cPath) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/summary`, { params: { cPath } }));
        if (res && res.msg == 1) {
          return res;
        } else {
          this.tost.openSnackBar(res.value + (res?.error ? `, ${res?.error}` : ""), "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Transcripr creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  getFileDetail(cPath) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/filedata`, { params: { cPath } }));
        return res;
      } catch (err) {
        this.tost.openSnackBar(`Transcripr creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  generateIndex(cPath, cTransid) {
    return __async(this, null, function* () {
      let res;
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/generate-file-index`, { cPath, cTransid }, {
          responseType: "blob"
          // Ensure we receive the response as a Blob
        }));
      } catch (error) {
        console.error("Error fetching attachment:", error);
        res = null;
      }
      return res;
    });
  }
  downloadDoc(htmlFilePath, cTransid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/html-file-to-doc-stream`, { filePath: htmlFilePath, cTransid }));
        return res;
      } catch (error) {
        console.error("Download failed:", error);
        return false;
      }
    });
  }
  getCaseCombo() {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/case_combo`));
        if (res.msg == -1) {
          this.tost.openSnackBar(res.value, "E");
        }
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getSessionCombo(nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/session_combo`, { params: { nCaseid } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  getTranscriptHtml(formData) {
    return __async(this, null, function* () {
      const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/html`, { params: formData }).pipe(
        map((res2) => atob(res2.base64))
        // decode base64 to HTML string
      ));
      return this.sanitizer.bypassSecurityTrustHtml(res);
    });
  }
  getTranscriptHtmlFile(cPath, cTransid, type = "FST") {
    return __async(this, null, function* () {
      try {
        const response = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/html-file`, {
          params: { cPath, cTransid, type }
        }));
        if (!response?.base64) {
          return {
            msg: -1,
            error: response.error
          };
        }
        const html = atob(response.base64);
        return {
          msg: 1,
          data: this.sanitizer.bypassSecurityTrustHtml(html)
        };
      } catch (error) {
        debugger;
        return {
          msg: -1,
          error
        };
      }
    });
  }
  printRawHtml(cPath, cTransid, type = "FST") {
    return __async(this, null, function* () {
      const filedata = yield this.getTranscriptHtmlFile(cPath, cTransid, type);
      if (filedata.msg == -1) {
        this.tost.openSnackBar(`Error fetching HTML file: ${filedata.error}`, "E");
        return;
      }
      const htmlString = filedata.data;
      const rawHtml = htmlString.changingThisBreaksApplicationSecurity;
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "absolute";
      printFrame.style.top = "-10000px";
      document.body.appendChild(printFrame);
      printFrame.contentDocument.open();
      printFrame.contentDocument.write(`
    <html>
      <head>
        <title>Print Preview</title>
        <style>
          @media print {
            body {
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>${rawHtml}</body>
    </html>
  `);
      printFrame.contentDocument.close();
      printFrame.onload = function() {
        printFrame.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1e3);
      };
    });
  }
  publishTranscript(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/publish`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        }
        if (res && res.msg == -1 && res?.isIgnoreErr == true) {
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Transcripr publish failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  errorMessage(message) {
    this.tost.openSnackBar(`${message}`, "E");
  }
  downloadFile(cPath) {
    let params = new HttpParams();
    params = params.set("cPath", cPath);
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/download`, {
      params,
      headers,
      responseType: "blob"
      // Important to specify blob as the response type
    });
  }
  deleteTranscript(cTransid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.delete(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/delete`, { body: { cTransid } }));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Transcripr delete failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  // ==========================================
  // Versioning API Methods (HTML-Canonical)
  // ==========================================
  /**
   * Create a new draft version with HTML content
   */
  createVersion(req) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/version/create`, req));
        return res;
      } catch (err) {
        this.tost.openSnackBar(`Version creation failed: ${err}`, "E");
        return { msg: -1, data: null };
      }
    });
  }
  /**
   * Get the latest version (draft or published) for a session
   */
  getLatestVersion(nSesid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/version/latest`, { params: { nSesid } }));
        return res;
      } catch (err) {
        return { msg: -1, data: null };
      }
    });
  }
  /**
   * Get version history list for a session
   */
  getVersionList(nSesid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/version/list`, { params: { nSesid } }));
        return res;
      } catch (err) {
        return { msg: -1, data: [] };
      }
    });
  }
  /**
   * Get a specific version by ID (includes html_content)
   */
  getVersion(nVersionid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/version/${nVersionid}`));
        return res;
      } catch (err) {
        return { msg: -1, data: null };
      }
    });
  }
  /**
   * Publish a version (marks as immutable)
   */
  publishVersion(req) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/version/publish`, req));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value || "Version published successfully", "");
        } else {
          this.tost.openSnackBar(res.value || "Publish failed", "E");
        }
        return res;
      } catch (err) {
        this.tost.openSnackBar(`Publish failed: ${err}`, "E");
        return { msg: -1, error: err };
      }
    });
  }
  /**
   * Reopen a published version as a new draft (creates version N+1)
   */
  reopenVersion(req) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/version/reopen`, req));
        if (res && res.msg == 1) {
          this.tost.openSnackBar("New draft version created", "");
        }
        return res;
      } catch (err) {
        this.tost.openSnackBar(`Reopen failed: ${err}`, "E");
        return { msg: -1, data: null };
      }
    });
  }
  /**
   * Export a version to PDF (server-side Puppeteer rendering)
   */
  exportPdf(_0) {
    return __async(this, arguments, function* (nVersionid, options = {}) {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/export/pdf`, __spreadValues({ nVersionid }, options)));
        return res;
      } catch (err) {
        this.tost.openSnackBar(`PDF export failed: ${err}`, "E");
        return { msg: -1, path: "" };
      }
    });
  }
  /**
   * Check if a cached PDF exists for a version
   */
  checkPdfStatus(nVersionid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/export/pdf/status`, { params: { nVersionid } }));
        return res;
      } catch (err) {
        return { exists: false };
      }
    });
  }
  static {
    this.\u0275fac = function TranscriptService_Factory(t) {
      return new (t || _TranscriptService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService), \u0275\u0275inject(DomSanitizer));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TranscriptService, factory: _TranscriptService.\u0275fac, providedIn: "root" });
  }
};

// src/app/shared/components/content-editable/content-editable.component.ts
var _c0 = ["contentEditable"];
var _c1 = ["matSelect"];
var ContentEditableComponent = class _ContentEditableComponent {
  constructor(vs, transcriptS, cdr) {
    this.vs = vs;
    this.transcriptS = transcriptS;
    this.cdr = cdr;
    this.disabled = false;
    this.error = false;
    this.placeholder = "";
    this.value = "";
    this.minrows = 1;
    this.maxlength = 500;
    this.maxWidth = 0;
    this.minWidth = 200;
    this.suggestions = [];
    this.breakAtLength = 0;
    this.selectedTheme = { nCFontsize: 12 };
    this.valueChange = new EventEmitter();
    this.onFocusOut = new EventEmitter();
    this.selectedValue = "";
    this.filteredSuggestions = [];
  }
  ngAfterViewInit() {
    if (this.value) {
      this.contentEditable.nativeElement.textContent = this.value;
    }
    this.contentEditable.nativeElement.focus();
    this.placeCursorAtEnd(this.contentEditable.nativeElement);
  }
  /**
   * Places the cursor at the end of the text in a contenteditable element
   */
  placeCursorAtEnd(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  getTextWithNewlines(element) {
    let text = "";
    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node;
    while (node = walk.nextNode()) {
      text += node.textContent;
    }
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = element.innerHTML;
    const brs = tempDiv.getElementsByTagName("br");
    for (let i = brs.length - 1; i >= 0; i--) {
      brs[i].replaceWith("\n");
    }
    const divs = tempDiv.getElementsByTagName("div");
    for (let i = divs.length - 1; i >= 0; i--) {
      divs[i].replaceWith("\n" + divs[i].textContent);
    }
    return tempDiv.textContent || "";
  }
  onInput(event) {
    return __async(this, null, function* () {
      const element = event.target;
      let text = this.getTextWithNewlines(element).replace(/[\n\r]/g, "");
      if (text.length > this.maxlength) {
        text = text.slice(0, this.maxlength);
        element.textContent = text;
        this.placeCursorAtEnd(element);
      }
      this.valueChange.emit(text);
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => __async(this, null, function* () {
        try {
          let res = yield this.transcriptS.getFieldData(text, this.formcontrolname);
          this.suggestions = res.length > 0 ? res.map((e) => e?.[this.formcontrolname] ?? "") : [];
          this.filteredSuggestions = this.suggestions;
          this.filteredSuggestions = this.suggestions.filter((suggestion) => suggestion.toLowerCase().includes(text.toLowerCase()));
          console.log("filteredSuggestions", this.matSelect.opened);
          if (this.filteredSuggestions.length === 0) {
            this.matSelect.close();
          } else {
            if (this.matSelect && !this.matSelect.opened) {
              console.log("Opening mat-select with suggestions:", this.filteredSuggestions);
              setTimeout(() => {
                this.matSelect.open();
                this.cdr.detectChanges();
              }, 0);
            }
          }
        } catch (err) {
          console.error("Error fetching suggestions:", err);
        }
      }), 300);
    });
  }
  onBlur(event) {
    const element = this.contentEditable.nativeElement;
    const text = this.getTextWithNewlines(element);
    element.textContent = text.trim();
    this.valueChange.emit(text.trim());
    this.onFocusOut.emit(text.trim());
  }
  onFocus() {
    return __async(this, null, function* () {
      let res = yield this.transcriptS.getFieldData(this.contentEditable.nativeElement.textContent, this.formcontrolname);
      this.suggestions = res.length > 0 ? res.map((e) => e[this.formcontrolname]) : [];
      this.filteredSuggestions = this.suggestions;
      if (this.suggestions.length > 0) {
        const currentText = this.contentEditable.nativeElement.textContent || "";
        this.filteredSuggestions = this.suggestions.filter((suggestion) => suggestion.toLowerCase().includes(currentText.toLowerCase()));
        if (this.filteredSuggestions.length > 0) {
          setTimeout(() => {
            this.matSelect.open();
          });
        }
      }
    });
  }
  selectSuggestion(suggestion) {
    return __async(this, null, function* () {
      console.log("Suggestion selected:", suggestion);
      const element = this.contentEditable.nativeElement;
      element.textContent = suggestion;
      this.valueChange.emit(suggestion);
      element.focus();
      this.placeCursorAtEnd(element);
    });
  }
  static {
    this.\u0275fac = function ContentEditableComponent_Factory(t) {
      return new (t || _ContentEditableComponent)(\u0275\u0275directiveInject(VariablesService), \u0275\u0275directiveInject(TranscriptService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContentEditableComponent, selectors: [["app-content-editable"]], viewQuery: function ContentEditableComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
        \u0275\u0275viewQuery(_c1, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.contentEditable = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.matSelect = _t.first);
      }
    }, inputs: { disabled: "disabled", formcontrolname: "formcontrolname", error: "error", placeholder: "placeholder", value: "value", minrows: "minrows", maxlength: "maxlength", maxWidth: "maxWidth", minWidth: "minWidth", suggestions: "suggestions", breakAtLength: "breakAtLength", selectedTheme: "selectedTheme" }, outputs: { valueChange: "valueChange", onFocusOut: "onFocusOut" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 3, vars: 3, consts: [["contentEditable", ""], [1, "relative"], [1, "font-semibold", "text-xs", "w-fit", "whitespace-nowrap", "text-grey", "border-none", "h-5", "p-0", "!shadow-none", "rounded-none", "bg-blue-100", "px-1", "py-1", 3, "input", "blur", "keyup.enter", "focus", "contentEditable"]], template: function ContentEditableComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2, 0);
        \u0275\u0275listener("input", function ContentEditableComponent_Template_div_input_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onInput($event));
        })("blur", function ContentEditableComponent_Template_div_blur_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onBlur($event));
        })("keyup.enter", function ContentEditableComponent_Template_div_keyup_enter_1_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onFocusOut.emit(ctx.value));
        })("focus", function ContentEditableComponent_Template_div_focus_1_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onFocus());
        });
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("contentEditable", !ctx.disabled);
        \u0275\u0275attribute("placeholder", ctx.placeholder)("maxlength", ctx.maxlength);
      }
    }, dependencies: [CommonModule, MatSelectModule, FormsModule, NgScrollbarModule], styles: ["\n\n[contenteditable][_ngcontent-%COMP%]:empty:before {\n  content: attr(placeholder);\n  color: #9CA3AF;\n}\n[contenteditable][_ngcontent-%COMP%]:focus {\n  outline: none;\n}\n[contenteditable][_ngcontent-%COMP%] {\n  white-space: pre-wrap;\n  word-wrap: break-word;\n  overflow-wrap: break-word;\n}\n.hidden-select[_ngcontent-%COMP%] {\n  position: absolute;\n  opacity: 0;\n  pointer-events: none;\n}\n[_nghost-%COMP%]     .mat-mdc-select-panel {\n  z-index: 1000;\n}\n[_nghost-%COMP%]     .ng-scrollbar {\n  height: 100%;\n}\n[_nghost-%COMP%]     .ng-scrollbar-view {\n  padding: 0;\n}\n/*# sourceMappingURL=content-editable.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContentEditableComponent, { className: "ContentEditableComponent", filePath: "src\\app\\shared\\components\\content-editable\\content-editable.component.ts", lineNumber: 55 });
})();

export {
  TranscriptService,
  ContentEditableComponent
};
//# sourceMappingURL=chunk-2VIGWAD6.js.map
