import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  DefaultValueAccessor,
  FormsModule,
  MaxLengthValidator,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/pdf/components/qfact-rapid-popup/qfact-rapid-popup.component.ts
var _c0 = ["popupRoot"];
var _c1 = ["noteInput"];
var _forTrack0 = ($index, $item) => $item.nIid;
function QFactRapidPopupComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 10);
    \u0275\u0275text(1, "\u2714 Saved");
    \u0275\u0275elementEnd();
  }
}
function QFactRapidPopupComponent_Conditional_14_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 17);
    \u0275\u0275element(1, "span", 18);
    \u0275\u0275elementStart(2, "span", 19);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const iss_r2 = ctx.$implicit;
    \u0275\u0275property("matTooltip", iss_r2.cIName);
    \u0275\u0275advance();
    \u0275\u0275styleProp("background-color", "#" + (iss_r2.cColor || "d6dde8"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(iss_r2.cIName);
  }
}
function QFactRapidPopupComponent_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13);
    \u0275\u0275repeaterCreate(1, QFactRapidPopupComponent_Conditional_14_For_2_Template, 4, 4, "span", 17, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.selectedIssues);
  }
}
function QFactRapidPopupComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 20);
    \u0275\u0275text(1, "No issue assigned");
    \u0275\u0275elementEnd();
  }
}
var QFactRapidPopupComponent = class _QFactRapidPopupComponent {
  constructor() {
    this.selectedIssues = [];
    this.highlightText = "";
    this.includeText = false;
    this.anchor = { x: 0, y: 0 };
    this.closed = new EventEmitter();
    this.position = signal({ left: 0, top: 0 });
    this.bUseHighlightedText = false;
    this.cNote = "";
    this.showSavedHint = signal(false);
    this.lastSavedNote = "";
    this.savedHintTimer = null;
    this.inflightSave = null;
    this.isClosing = false;
    this.cdr = inject(ChangeDetectorRef);
  }
  ngOnInit() {
    if (this.includeText) {
      this.bUseHighlightedText = true;
      this.cNote = this.highlightText || "";
    }
    requestAnimationFrame(() => {
      this.placeNearAnchor();
      const ta = this.noteInput?.nativeElement;
      if (ta) {
        ta.focus({ preventScroll: true });
        const len = ta.value?.length ?? 0;
        try {
          ta.setSelectionRange(len, len);
        } catch {
        }
      }
    });
  }
  ngOnDestroy() {
    if (this.savedHintTimer)
      clearTimeout(this.savedHintTimer);
  }
  onUseHighlightedTextChange(checked) {
    this.bUseHighlightedText = checked;
    if (checked) {
      if (!this.cNote?.trim())
        this.cNote = this.highlightText || "";
    } else {
      if ((this.cNote || "") === (this.highlightText || "")) {
        this.cNote = "";
      }
    }
  }
  /** Auto-save on blur — the spec requires no explicit Save button.
   *  Skips the request when the note is empty (per "If user does not
   *  type anything, no note is saved.") or unchanged since the last
   *  successful save. Surfaces the result via the "✔ Saved" hint. */
  onNoteBlur() {
    return __async(this, null, function* () {
      yield this.saveNoteIfDirty();
    });
  }
  /** Shared helper used by both blur and cancel paths. Returns true
   *  when a save was actually issued (so cancel() knows to hold the
   *  popup open briefly for the "✔ Saved" confirmation). Idempotent —
   *  if the value is unchanged or empty, it's a no-op. */
  saveNoteIfDirty() {
    return __async(this, null, function* () {
      const note = (this.cNote || "").trim();
      if (!note)
        return false;
      if (note === this.lastSavedNote)
        return false;
      if (!this.saveNoteFn)
        return false;
      if (this.inflightSave) {
        return this.inflightSave;
      }
      const run = (() => __async(this, null, function* () {
        try {
          const result = yield this.saveNoteFn({
            note,
            useHighlightedText: this.bUseHighlightedText
          });
          if (result?.ok) {
            this.lastSavedNote = note;
            this.flashSavedHint();
            return true;
          }
          return false;
        } catch {
          return false;
        }
      }))();
      this.inflightSave = run;
      try {
        return yield run;
      } finally {
        this.inflightSave = null;
      }
    });
  }
  flashSavedHint() {
    this.showSavedHint.set(true);
    if (this.savedHintTimer)
      clearTimeout(this.savedHintTimer);
    this.savedHintTimer = setTimeout(() => {
      this.showSavedHint.set(false);
      this.savedHintTimer = null;
    }, 2200);
  }
  /** Compute the popup's final {left, top} position from the anchor.
   *  Honours the anchor's `side` flag:
   *    - `side: 'right'` (default) → popup's LEFT edge sits at anchor.x
   *    - `side: 'left'`            → popup's RIGHT edge sits at anchor.x
   *      (so the popup grows leftwards from the anchor, putting it on
   *      the **left** side of the highlight — used when the highlight
   *      is on the right page in double-page mode and we want the
   *      popup in the gap between the two pages).
   *
   *  Vertical: centred on anchor.y with a TOOLBAR_GAP top clamp and a
   *  bottom clamp against the viewport. Horizontal: clamped to the
   *  viewport in both directions so the popup never escapes off-screen
   *  on narrow layouts. */
  placeNearAnchor() {
    const el = this.popupRoot?.nativeElement;
    if (!el)
      return;
    const PAD = 8;
    const TOOLBAR_GAP = 110;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const side = this.anchor.side ?? "right";
    let left = side === "left" ? this.anchor.x - w : this.anchor.x;
    let top = this.anchor.y - h / 2;
    const maxLeft = Math.max(PAD, vw - w - PAD);
    if (left > maxLeft)
      left = maxLeft;
    if (left < PAD)
      left = PAD;
    if (top + h + PAD > vh)
      top = vh - h - PAD;
    if (top < TOOLBAR_GAP)
      top = TOOLBAR_GAP;
    this.position.set({ left, top });
  }
  onWindowResize() {
    this.placeNearAnchor();
  }
  /** Escape closes the popup. The QFact is already saved, so this is
   *  purely a UI dismissal. Click-outside is handled by the backdrop
   *  template — we stop click propagation on the popup itself. */
  onEscape() {
    void this.cancel();
  }
  /** Close sequence:
   *   1. Flush any unsaved note via saveNoteIfDirty(). When the user
   *      clicks the backdrop / Escape, the textarea blur may not fire
   *      first (Escape) or may race the close, so we run the save
   *      explicitly here as well — the helper is idempotent.
   *   2. Show the "✔ Saved" indicator on close if EITHER we just
   *      saved a dirty note now, OR a previous blur in this popup
   *      session already saved one. Without (b), a user who typed a
   *      note → blurred (auto-save fired, hint flashed and faded) →
   *      clicked the backdrop would see the popup close instantly
   *      with no visible confirmation, because saveNoteIfDirty
   *      short-circuits when the textarea value is unchanged.
   *      Per UX brief: "If a note is entered, show subtle ✔ Saved
   *      indicator within the pop-up."
   *   3. Hold the popup open ~900 ms so the hint is visible.
   *   4. Emit `closed` so the host unmounts. */
  cancel() {
    return __async(this, null, function* () {
      if (this.isClosing)
        return;
      this.isClosing = true;
      let didSave = false;
      try {
        didSave = yield this.saveNoteIfDirty();
      } catch {
      }
      const noteWasSaved = didSave || !!(this.lastSavedNote || "").trim();
      if (noteWasSaved) {
        this.flashSavedHint();
        this.cdr.detectChanges();
        yield new Promise((resolve) => setTimeout(resolve, 900));
      }
      this.closed.emit();
    });
  }
  static {
    this.\u0275fac = function QFactRapidPopupComponent_Factory(t) {
      return new (t || _QFactRapidPopupComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _QFactRapidPopupComponent, selectors: [["qfact-rapid-popup"]], viewQuery: function QFactRapidPopupComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 7);
        \u0275\u0275viewQuery(_c1, 7);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.popupRoot = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.noteInput = _t.first);
      }
    }, hostBindings: function QFactRapidPopupComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("resize", function QFactRapidPopupComponent_resize_HostBindingHandler() {
          return ctx.onWindowResize();
        }, false, \u0275\u0275resolveWindow)("keydown.escape", function QFactRapidPopupComponent_keydown_escape_HostBindingHandler() {
          return ctx.onEscape();
        }, false, \u0275\u0275resolveDocument);
      }
    }, inputs: { selectedIssues: "selectedIssues", highlightText: "highlightText", includeText: "includeText", saveNoteFn: "saveNoteFn", anchor: "anchor" }, outputs: { closed: "closed" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 21, vars: 8, consts: [["popupRoot", ""], ["noteInput", ""], [1, "qfact-popup-backdrop", 3, "click"], [1, "qfact-popup", 3, "click"], [1, "qfact-popup__head"], ["aria-hidden", "true", 1, "qfact-popup__icon"], ["width", "14", "height", "14", "viewBox", "0 0 20 20", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M4 2.5L11.2 11L8 11.4L9.9 16.8L8.2 17.4L6.3 12L4 14V2.5Z", "fill", "currentColor"], ["cx", "15.4", "cy", "6.3", "r", "2.1", "fill", "#ffffff"], [1, "qfact-popup__title"], ["aria-live", "polite", 1, "qfact-popup__saved"], [1, "qfact-popup__body"], [1, "qfact-popup__heading"], [1, "qfact-popup__chips"], [1, "qfact-popup__check", 3, "ngModelChange", "ngModel"], [1, "qfact-popup__check-label"], ["rows", "4", "maxlength", "500", "placeholder", "Add a note (optional)", 1, "qfact-popup__note", 3, "ngModelChange", "blur", "ngModel"], ["matTooltipPosition", "above", 1, "qfact-chip", 3, "matTooltip"], [1, "qfact-chip__dot"], [1, "qfact-chip__label"], [1, "qfact-popup__empty"]], template: function QFactRapidPopupComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 2);
        \u0275\u0275listener("click", function QFactRapidPopupComponent_Template_div_click_0_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.cancel());
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(1, "div", 3, 0);
        \u0275\u0275listener("click", function QFactRapidPopupComponent_Template_div_click_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        });
        \u0275\u0275elementStart(3, "header", 4)(4, "span", 5);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(5, "svg", 6);
        \u0275\u0275element(6, "path", 7)(7, "circle", 8);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(8, "h2", 9);
        \u0275\u0275text(9, "qFact");
        \u0275\u0275elementEnd();
        \u0275\u0275template(10, QFactRapidPopupComponent_Conditional_10_Template, 2, 0, "span", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "div", 11)(12, "h6", 12);
        \u0275\u0275text(13, "Assigned Claim & Issue");
        \u0275\u0275elementEnd();
        \u0275\u0275template(14, QFactRapidPopupComponent_Conditional_14_Template, 3, 0, "div", 13)(15, QFactRapidPopupComponent_Conditional_15_Template, 2, 0);
        \u0275\u0275elementStart(16, "mat-checkbox", 14);
        \u0275\u0275twoWayListener("ngModelChange", function QFactRapidPopupComponent_Template_mat_checkbox_ngModelChange_16_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.bUseHighlightedText, $event) || (ctx.bUseHighlightedText = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("ngModelChange", function QFactRapidPopupComponent_Template_mat_checkbox_ngModelChange_16_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onUseHighlightedTextChange($event));
        });
        \u0275\u0275elementStart(17, "span", 15);
        \u0275\u0275text(18, "Use highlighted text in note (editable)");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(19, "textarea", 16, 1);
        \u0275\u0275twoWayListener("ngModelChange", function QFactRapidPopupComponent_Template_textarea_ngModelChange_19_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.cNote, $event) || (ctx.cNote = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("blur", function QFactRapidPopupComponent_Template_textarea_blur_19_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onNoteBlur());
        });
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275styleProp("left", ctx.position().left, "px")("top", ctx.position().top, "px");
        \u0275\u0275advance(9);
        \u0275\u0275conditional(10, ctx.showSavedHint() ? 10 : -1);
        \u0275\u0275advance(4);
        \u0275\u0275conditional(14, (ctx.selectedIssues == null ? null : ctx.selectedIssues.length) ? 14 : 15);
        \u0275\u0275advance(2);
        \u0275\u0275twoWayProperty("ngModel", ctx.bUseHighlightedText);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.cNote);
      }
    }, dependencies: [CommonModule, FormsModule, DefaultValueAccessor, NgControlStatus, MaxLengthValidator, NgModel, MatCheckboxModule, MatCheckbox, MatTooltipModule, MatTooltip], styles: ["\n\n[_nghost-%COMP%] {\n  display: contents;\n}\n.qfact-popup-backdrop[_ngcontent-%COMP%] {\n  position: fixed;\n  inset: 0;\n  background: rgba(0, 0, 0, 0.05);\n  z-index: 998;\n}\n.qfact-popup[_ngcontent-%COMP%] {\n  position: fixed;\n  z-index: 999;\n  width: 360px;\n  background: #ffffff;\n  border-radius: 12px;\n  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.25);\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n}\n.qfact-popup__head[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 10px 12px;\n  background: #0066ff;\n  color: #ffffff;\n}\n.qfact-popup__icon[_ngcontent-%COMP%] {\n  width: 24px;\n  height: 24px;\n  border-radius: 50%;\n  background: rgba(255, 255, 255, 0.18);\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  color: #ffffff;\n  flex-shrink: 0;\n}\n.qfact-popup__title[_ngcontent-%COMP%] {\n  flex: 1;\n  margin: 0;\n  font-size: 14px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n}\n.qfact-popup__saved[_ngcontent-%COMP%] {\n  font-size: 11px;\n  font-weight: 600;\n  color: #b6ffce;\n  background: rgba(255, 255, 255, 0.14);\n  padding: 2px 8px;\n  border-radius: 999px;\n  letter-spacing: 0.02em;\n  animation: _ngcontent-%COMP%_qfact-popup-saved-fade 0.18s ease-out;\n}\n@keyframes _ngcontent-%COMP%_qfact-popup-saved-fade {\n  from {\n    opacity: 0;\n    transform: translateY(-2px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.qfact-popup__close[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  color: #ffffff;\n  font-size: 22px;\n  line-height: 1;\n  cursor: pointer;\n  padding: 0 4px;\n  border-radius: 4px;\n}\n.qfact-popup__close[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.18);\n}\n.qfact-popup__body[_ngcontent-%COMP%] {\n  padding: 12px 14px 14px;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n.qfact-popup__heading[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 12px;\n  font-weight: 700;\n  color: #2b3a55;\n  letter-spacing: 0.02em;\n}\n.qfact-popup__chips[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  max-height: 96px;\n  overflow-y: auto;\n}\n.qfact-chip[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 3px 10px 3px 8px;\n  background: #f1f5fc;\n  border: 1px solid #e1e6ee;\n  border-radius: 999px;\n  font-size: 12px;\n  color: #2b3a55;\n  max-width: 100%;\n  min-width: 0;\n}\n.qfact-chip__dot[_ngcontent-%COMP%] {\n  width: 8px;\n  height: 8px;\n  border-radius: 50%;\n  flex-shrink: 0;\n}\n.qfact-chip__label[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.qfact-popup__empty[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #6b7d99;\n  font-style: italic;\n}\n.qfact-popup__check[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  margin: 4px 0 0;\n}\n.qfact-popup__check[_ngcontent-%COMP%]     .mdc-form-field {\n  font-size: 12px;\n}\n.qfact-popup__check-label[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #2b3a55;\n}\n.qfact-popup__note[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  box-sizing: border-box;\n  border: 1px solid #d6dde8;\n  border-radius: 8px;\n  padding: 10px 12px;\n  font-size: 13px;\n  line-height: 1.45;\n  font-family: inherit;\n  resize: vertical;\n  min-height: 96px;\n  max-height: 220px;\n  color: #2b3a55;\n  background: #fbfdff;\n  transition:\n    border-color 0.15s ease,\n    box-shadow 0.15s ease,\n    background 0.15s ease;\n}\n.qfact-popup__note[_ngcontent-%COMP%]:hover:not(:focus) {\n  border-color: #b8c4d6;\n}\n.qfact-popup__note[_ngcontent-%COMP%]:focus {\n  outline: none;\n  background: #ffffff;\n  border-color: #0066ff;\n  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.18);\n}\n.qfact-popup__note[_ngcontent-%COMP%]::placeholder {\n  color: #9ca7b8;\n  font-style: italic;\n}\n/*# sourceMappingURL=qfact-rapid-popup.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(QFactRapidPopupComponent, { className: "QFactRapidPopupComponent", filePath: "src\\app\\pdf\\components\\qfact-rapid-popup\\qfact-rapid-popup.component.ts", lineNumber: 41 });
})();

export {
  QFactRapidPopupComponent
};
//# sourceMappingURL=chunk-AD3YPIDF.js.map
