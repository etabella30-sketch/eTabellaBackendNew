import {
  SelectionActionsService
} from "./chunk-FW6JNL2T.js";
import {
  MatRadioButton,
  MatRadioGroup,
  MatRadioModule
} from "./chunk-ILBZODYX.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule
} from "./chunk-DWVFAK3Q.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassProp,
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
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/selection-actions/selection-actions-control.component.ts
function SelectionActionsControlComponent_button_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 30);
    \u0275\u0275listener("click", function SelectionActionsControlComponent_button_0_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onSwitcherClick());
    });
    \u0275\u0275elementStart(1, "span", 31);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 32);
    \u0275\u0275element(3, "path", 33)(4, "circle", 34);
    \u0275\u0275elementEnd()()();
  }
}
function SelectionActionsControlComponent_button_1_icon_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 11);
  }
}
function SelectionActionsControlComponent_button_1_icon_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 18);
  }
}
function SelectionActionsControlComponent_button_1_icon_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 19);
  }
}
function SelectionActionsControlComponent_button_1_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 23);
    \u0275\u0275element(2, "rect", 24)(3, "path", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
}
function SelectionActionsControlComponent_button_1__svg_svg_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 47);
    \u0275\u0275element(1, "path", 48)(2, "circle", 49);
    \u0275\u0275elementEnd();
  }
}
function SelectionActionsControlComponent_button_1_span_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 50);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.label);
  }
}
function SelectionActionsControlComponent_button_1_span_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 51);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.detail);
  }
}
function SelectionActionsControlComponent_button_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "button", 35)(1, "span", 36);
    \u0275\u0275elementContainerStart(2, 37);
    \u0275\u0275template(3, SelectionActionsControlComponent_button_1_icon_3_Template, 1, 0, "icon", 38)(4, SelectionActionsControlComponent_button_1_icon_4_Template, 1, 0, "icon", 39)(5, SelectionActionsControlComponent_button_1_icon_5_Template, 1, 0, "icon", 40)(6, SelectionActionsControlComponent_button_1_ng_container_6_Template, 4, 0, "ng-container", 41)(7, SelectionActionsControlComponent_button_1__svg_svg_7_Template, 3, 0, "svg", 42);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementEnd();
    \u0275\u0275template(8, SelectionActionsControlComponent_button_1_span_8_Template, 2, 1, "span", 43)(9, SelectionActionsControlComponent_button_1_span_9_Template, 2, 1, "span", 44);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(10, "svg", 45);
    \u0275\u0275element(11, "path", 46);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    const menu_r4 = \u0275\u0275reference(3);
    \u0275\u0275classProp("compact", ctx_r2.compact)("dark", ctx_r2.dark)("is-copy", ctx_r2.sa.isCopy())("is-single", ctx_r2.sa.isSingle());
    \u0275\u0275property("matMenuTriggerFor", menu_r4)("matTooltip", ctx_r2.sa.isCopy() || ctx_r2.sa.isSingle() ? ctx_r2.sa.summary() : "");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngSwitch", true);
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", ctx_r2.sa.isQFactRapid());
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", ctx_r2.sa.singleKind() === "F");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", ctx_r2.sa.singleKind() === "D");
    \u0275\u0275advance();
    \u0275\u0275property("ngSwitchCase", ctx_r2.sa.isCopy());
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.showLabel);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.showLabel && ctx_r2.detail);
  }
}
function SelectionActionsControlComponent_div_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 52)(1, "mat-checkbox", 53);
    \u0275\u0275listener("change", function SelectionActionsControlComponent_div_18_Template_mat_checkbox_change_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.setQfNote($event.checked));
    });
    \u0275\u0275text(2, "Include note");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "mat-checkbox", 53);
    \u0275\u0275listener("change", function SelectionActionsControlComponent_div_18_Template_mat_checkbox_change_3_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.setQfTextNote($event.checked));
    });
    \u0275\u0275text(4, "Include selected text + note");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("checked", ctx_r2.sa.state().qfIncludeNote);
    \u0275\u0275advance(2);
    \u0275\u0275property("checked", ctx_r2.sa.state().qfIncludeTextPlusNote);
  }
}
function SelectionActionsControlComponent_div_49_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 54)(1, "mat-checkbox", 53);
    \u0275\u0275listener("change", function SelectionActionsControlComponent_div_49_Template_mat_checkbox_change_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.setCopyDocName($event.checked));
    });
    \u0275\u0275text(2, "Include document name");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "mat-checkbox", 53);
    \u0275\u0275listener("change", function SelectionActionsControlComponent_div_49_Template_mat_checkbox_change_3_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.setCopyPagination($event.checked));
    });
    \u0275\u0275text(4, "Include page & line reference");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("checked", ctx_r2.sa.state().copyDocName);
    \u0275\u0275advance(2);
    \u0275\u0275property("checked", ctx_r2.sa.state().copyPagination);
  }
}
function SelectionActionsControlComponent_ng_container_51_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span", 55);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r2.footerLabel, ":");
  }
}
var SelectionActionsControlComponent = class _SelectionActionsControlComponent {
  /** Bound to host so :host.icon-only can switch from inline-flex to a
   *  full-width block — the switcher lives inside the dark popup and must
   *  stretch across, not collapse to its content width. */
  get hostIconOnly() {
    return this.iconOnly;
  }
  constructor(sa) {
    this.sa = sa;
    this.dark = false;
    this.compact = false;
    this.showLabel = true;
    this.iconOnly = false;
  }
  ngAfterViewInit() {
    if (!this.iconOnly) {
      this.openSub = this.sa.openToolbar$.subscribe(() => this.menuTrigger?.openMenu());
    }
  }
  ngOnDestroy() {
    this.openSub?.unsubscribe();
  }
  onSwitcherClick() {
    this.sa.requestOpenToolbar();
  }
  get label() {
    if (this.sa.isCopy())
      return "Copy Mode";
    if (this.sa.isSingle())
      return this.sa.modeLabel();
    return "Actions";
  }
  get detail() {
    if (this.sa.isCopy() || this.sa.isSingle())
      return null;
    return this.sa.activeArr().map((k) => k === "QF" ? "QFact" : k === "F" ? "Fact" : "DocLink").join(" \u2022 ");
  }
  /** Bold prefix in the dropdown footer (e.g. "QFact"). Defaults to "Actions"
   *  in the multi-mode (Fact + DocLink) state so the footer reads
   *  "Actions: Select text, then choose between Fact and DocLink." */
  get footerLabel() {
    if (this.sa.isCopy())
      return "Copy";
    if (this.sa.isQFactRapid())
      return "QFact";
    if (this.sa.singleKind() === "F")
      return "Fact";
    if (this.sa.singleKind() === "D")
      return "DocLink";
    return "Actions";
  }
  /** Contextual help text under the action list. Copy comes from the spec
   *  in chat (2026-04-28); the only reachable multi state is Fact + DocLink
   *  because QFact is exclusive in the radio group. */
  get footerHint() {
    if (this.sa.isCopy())
      return "Text is copied as soon as it is selected.";
    if (this.sa.isQFactRapid())
      return "Pre-select issues or use Unassigned, then capture by selecting text.";
    if (this.sa.singleKind() === "F")
      return "Select text, then add issues and supporting details.";
    if (this.sa.singleKind() === "D")
      return "Select text, then choose the linked document.";
    return "Select text, then choose between Fact and DocLink.";
  }
  /** Current exclusive radio mode — drives the mat-radio-group [value].
   *  Returns 'QF' when QFact is armed, 'COPY' when Copy is armed,
   *  or '' when the user is in additive Fact/DocLink checkbox mode
   *  (no radio selected). */
  get radioMode() {
    if (this.sa.state().qf)
      return "QF";
    if (this.sa.isCopy())
      return "COPY";
    return "";
  }
  onRadioChange(event) {
    if (event.value === "QF")
      this.setQFact();
    else if (event.value === "COPY")
      this.setCopy();
  }
  setQFact() {
    this.sa.setQFact();
  }
  setCopy() {
    this.sa.setCopy();
  }
  toggleAdditive(key) {
    this.sa.toggleAdditive(key);
  }
  setQfNote(checked) {
    this.sa.setQfSubOption("qfIncludeNote", checked);
  }
  setQfTextNote(checked) {
    this.sa.setQfSubOption("qfIncludeTextPlusNote", checked);
  }
  setCopyDocName(checked) {
    this.sa.setCopySubOption("copyDocName", checked);
  }
  setCopyPagination(checked) {
    this.sa.setCopySubOption("copyPagination", checked);
  }
  static {
    this.\u0275fac = function SelectionActionsControlComponent_Factory(t) {
      return new (t || _SelectionActionsControlComponent)(\u0275\u0275directiveInject(SelectionActionsService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SelectionActionsControlComponent, selectors: [["selection-actions-control"]], viewQuery: function SelectionActionsControlComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(MatMenuTrigger, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.menuTrigger = _t.first);
      }
    }, hostVars: 2, hostBindings: function SelectionActionsControlComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275classProp("icon-only", ctx.hostIconOnly);
      }
    }, inputs: { dark: "dark", compact: "compact", showLabel: "showLabel", iconOnly: "iconOnly" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 54, vars: 9, consts: [["menu", "matMenu"], ["type", "button", "title", "Switch selection mode", "class", "sa-switcher", 3, "click", 4, "ngIf"], ["type", "button", "class", "sa-pill", 3, "matMenuTriggerFor", "matTooltip", "compact", "dark", "is-copy", "is-single", 4, "ngIf"], ["xPosition", "before", "yPosition", "below", 1, "sa-menu"], [1, "sa-dropdown", 3, "click"], [1, "sa-dropdown__head"], [1, "sa-dropdown__eyebrow"], [1, "sa-dropdown__body", 3, "change", "value"], [1, "sa-row", "sa-row--radio", 3, "click"], ["value", "QF", "color", "warn"], [1, "sa-row__icon"], ["name", "Qfact", "type", "indicn"], [1, "sa-row__text"], [1, "sa-row__label"], [1, "sa-row__hint"], ["class", "sa-suboptions sa-suboptions--qf", 4, "ngIf"], [1, "sa-row", "sa-row--check", 3, "click"], ["color", "warn", 3, "checked"], ["name", "fact", "type", "indicn"], ["name", "doclink", "type", "indicn"], [1, "sa-divider"], [1, "sa-row", "sa-row--radio", "sa-row--copy", 3, "click"], ["value", "COPY", "color", "warn"], ["width", "14", "height", "14", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round"], ["width", "8", "height", "4", "x", "8", "y", "2", "rx", "1", "ry", "1"], ["d", "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"], ["class", "sa-suboptions sa-suboptions--copy", 4, "ngIf"], [1, "sa-dropdown__foot"], [4, "ngIf"], [1, "sa-foot__hint"], ["type", "button", "title", "Switch selection mode", 1, "sa-switcher", 3, "click"], [1, "sa-switcher__box"], ["width", "12", "height", "12", "viewBox", "0 0 20 20", "fill", "none"], ["d", "M4 2.5L11.2 11L8 11.4L9.9 16.8L8.2 17.4L6.3 12L4 14V2.5Z", "fill", "white"], ["cx", "15.4", "cy", "6.3", "r", "2.1", "fill", "#60a5fa"], ["type", "button", 1, "sa-pill", 3, "matMenuTriggerFor", "matTooltip"], [1, "sa-pill__icon"], [3, "ngSwitch"], ["name", "Qfact", "type", "indicn", 4, "ngSwitchCase"], ["name", "fact", "type", "indicn", 4, "ngSwitchCase"], ["name", "doclink", "type", "indicn", 4, "ngSwitchCase"], [4, "ngSwitchCase"], ["width", "14", "height", "14", "viewBox", "0 0 20 20", "fill", "none", 4, "ngSwitchDefault"], ["class", "sa-pill__label", 4, "ngIf"], ["class", "sa-pill__detail", 4, "ngIf"], ["width", "9", "height", "9", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "3", 1, "sa-pill__chev"], ["d", "M6 9l6 6 6-6"], ["width", "14", "height", "14", "viewBox", "0 0 20 20", "fill", "none"], ["d", "M4 2.5L11.2 11L8 11.4L9.9 16.8L8.2 17.4L6.3 12L4 14V2.5Z", "fill", "currentColor"], ["cx", "15.4", "cy", "6.3", "r", "2.1", "fill", "#0066ff"], [1, "sa-pill__label"], [1, "sa-pill__detail"], [1, "sa-suboptions", "sa-suboptions--qf"], ["color", "warn", 3, "change", "checked"], [1, "sa-suboptions", "sa-suboptions--copy"], [1, "sa-foot__label"]], template: function SelectionActionsControlComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275template(0, SelectionActionsControlComponent_button_0_Template, 5, 0, "button", 1)(1, SelectionActionsControlComponent_button_1_Template, 12, 17, "button", 2);
        \u0275\u0275elementStart(2, "mat-menu", 3, 0)(4, "div", 4);
        \u0275\u0275listener("click", function SelectionActionsControlComponent_Template_div_click_4_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView($event.stopPropagation());
        });
        \u0275\u0275elementStart(5, "div", 5)(6, "div", 6);
        \u0275\u0275text(7, "Text selection actions");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(8, "mat-radio-group", 7);
        \u0275\u0275listener("change", function SelectionActionsControlComponent_Template_mat_radio_group_change_8_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onRadioChange($event));
        });
        \u0275\u0275elementStart(9, "div", 8);
        \u0275\u0275listener("click", function SelectionActionsControlComponent_Template_div_click_9_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.setQFact());
        });
        \u0275\u0275element(10, "mat-radio-button", 9);
        \u0275\u0275elementStart(11, "span", 10);
        \u0275\u0275element(12, "icon", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "span", 12)(14, "span", 13);
        \u0275\u0275text(15, "QFact");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "span", 14);
        \u0275\u0275text(17, "Capture facts quickly from selected text");
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(18, SelectionActionsControlComponent_div_18_Template, 5, 2, "div", 15);
        \u0275\u0275elementStart(19, "div", 16);
        \u0275\u0275listener("click", function SelectionActionsControlComponent_Template_div_click_19_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.toggleAdditive("fact"));
        });
        \u0275\u0275element(20, "mat-checkbox", 17);
        \u0275\u0275elementStart(21, "span", 10);
        \u0275\u0275element(22, "icon", 18);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(23, "span", 12)(24, "span", 13);
        \u0275\u0275text(25, "Fact");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(26, "span", 14);
        \u0275\u0275text(27, "Create a detailed fact record");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(28, "div", 16);
        \u0275\u0275listener("click", function SelectionActionsControlComponent_Template_div_click_28_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.toggleAdditive("doclink"));
        });
        \u0275\u0275element(29, "mat-checkbox", 17);
        \u0275\u0275elementStart(30, "span", 10);
        \u0275\u0275element(31, "icon", 19);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(32, "span", 12)(33, "span", 13);
        \u0275\u0275text(34, "DocLink");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(35, "span", 14);
        \u0275\u0275text(36, "Link selected text to a document");
        \u0275\u0275elementEnd()()();
        \u0275\u0275element(37, "div", 20);
        \u0275\u0275elementStart(38, "div", 21);
        \u0275\u0275listener("click", function SelectionActionsControlComponent_Template_div_click_38_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.setCopy());
        });
        \u0275\u0275element(39, "mat-radio-button", 22);
        \u0275\u0275elementStart(40, "span", 10);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(41, "svg", 23);
        \u0275\u0275element(42, "rect", 24)(43, "path", 25);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(44, "span", 12)(45, "span", 13);
        \u0275\u0275text(46, "Copy");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(47, "span", 14);
        \u0275\u0275text(48, "Copy selected text");
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(49, SelectionActionsControlComponent_div_49_Template, 5, 2, "div", 26);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(50, "div", 27);
        \u0275\u0275template(51, SelectionActionsControlComponent_ng_container_51_Template, 3, 1, "ng-container", 28);
        \u0275\u0275elementStart(52, "span", 29);
        \u0275\u0275text(53);
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", ctx.iconOnly);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.iconOnly);
        \u0275\u0275advance(7);
        \u0275\u0275property("value", ctx.radioMode);
        \u0275\u0275advance(10);
        \u0275\u0275property("ngIf", ctx.sa.state().qf);
        \u0275\u0275advance(2);
        \u0275\u0275property("checked", ctx.sa.state().fact && !ctx.sa.isCopy() && !ctx.sa.state().qf);
        \u0275\u0275advance(9);
        \u0275\u0275property("checked", ctx.sa.state().doclink && !ctx.sa.isCopy() && !ctx.sa.state().qf);
        \u0275\u0275advance(20);
        \u0275\u0275property("ngIf", ctx.sa.isCopy());
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.footerLabel);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate(ctx.footerHint);
      }
    }, dependencies: [CommonModule, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, MatMenuModule, MatMenu, MatMenuTrigger, MatTooltipModule, MatTooltip, MatCheckboxModule, MatCheckbox, MatRadioModule, MatRadioGroup, MatRadioButton, TranslateModule, IconComponent], styles: ['@charset "UTF-8";\n\n\n\n[_nghost-%COMP%] {\n  display: inline-flex;\n}\n.icon-only[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n}\n.sa-switcher[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  width: 100%;\n  padding: 6px 12px;\n  background: #0b457f;\n  border: none;\n  cursor: pointer;\n  transition: background 120ms ease;\n}\n.sa-switcher[_ngcontent-%COMP%]:hover {\n  background: #000000;\n}\n.sa-switcher__box[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 20px;\n  height: 20px;\n  border-radius: 3px;\n  background: rgba(255, 255, 255, 0.15);\n  border: 1px solid rgba(255, 255, 255, 0.2);\n}\n  .annot-box-menu.mat-mdc-menu-panel {\n  background: transparent !important;\n  box-shadow: none !important;\n  border-radius: 6px !important;\n  overflow: visible !important;\n  min-width: 0 !important;\n}\n  .annot-box-menu.mat-mdc-menu-panel .mat-mdc-menu-content {\n  padding: 0 !important;\n}\n.sa-pill[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  height: 34px;\n  padding: 0 12px;\n  border: 1px solid #d7dde6;\n  border-radius: 6px;\n  background: #ffffff;\n  color: #374151;\n  font-size: 12px;\n  line-height: 1;\n  white-space: nowrap;\n  cursor: pointer;\n  transition:\n    background 120ms ease,\n    border-color 120ms ease,\n    box-shadow 120ms ease;\n}\n.sa-pill[_ngcontent-%COMP%]:hover {\n  background: #f4f6fa;\n}\n.sa-pill.compact[_ngcontent-%COMP%] {\n  height: 28px;\n  padding: 0 8px;\n  gap: 6px;\n  font-size: 11px;\n  border-radius: 3px;\n}\n.sa-pill.compact[_ngcontent-%COMP%]   .sa-pill__chev[_ngcontent-%COMP%] {\n  width: 9px;\n  height: 9px;\n}\n.sa-pill.dark[_ngcontent-%COMP%] {\n  border-color: rgba(255, 255, 255, 0.3);\n  background: rgba(255, 255, 255, 0.1);\n  color: #ffffff;\n}\n.sa-pill.dark[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.18);\n}\n.sa-pill.is-single[_ngcontent-%COMP%] {\n  border-color: #0066ff;\n  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.1);\n}\n.sa-pill.is-single.dark[_ngcontent-%COMP%] {\n  border-color: #9bd1ff;\n  box-shadow: none;\n}\n.sa-pill.is-copy[_ngcontent-%COMP%] {\n  border-color: #ff3d00;\n  background: #ffece6;\n  box-shadow: 0 0 0 2px rgba(255, 61, 0, 0.12);\n}\n.sa-pill.is-copy.dark[_ngcontent-%COMP%] {\n  background: rgba(255, 61, 0, 0.18);\n  box-shadow: 0 0 0 2px rgba(255, 61, 0, 0.18);\n}\n.sa-pill__icon[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 16px;\n  height: 16px;\n}\n.sa-pill__icon[_ngcontent-%COMP%]     icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 14px;\n  line-height: 1;\n}\n.sa-pill__label[_ngcontent-%COMP%] {\n  font-weight: 600;\n}\n.sa-pill__detail[_ngcontent-%COMP%] {\n  color: #7a8597;\n  font-weight: 400;\n}\n.sa-pill.dark[_ngcontent-%COMP%]   .sa-pill__detail[_ngcontent-%COMP%] {\n  color: #9bd1ff;\n}\n.sa-pill__chev[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n}\n  .sa-menu.mat-mdc-menu-panel {\n  max-width: none !important;\n  min-width: 320px !important;\n  border-radius: 6px !important;\n  border: 1px solid #d7dde6;\n  box-shadow: 0 10px 30px rgba(0, 47, 100, 0.18) !important;\n  overflow: hidden;\n  margin-top: 6px;\n}\n  .sa-menu.mat-mdc-menu-panel .mat-mdc-menu-content {\n  padding: 0 !important;\n}\n.sa-dropdown[_ngcontent-%COMP%] {\n  width: 320px;\n  background: #ffffff;\n}\n.sa-dropdown__head[_ngcontent-%COMP%] {\n  padding: 8px 12px;\n  background: #f4f6fa;\n  border-bottom: 1px solid rgba(215, 221, 230, 0.6);\n}\n.sa-dropdown__eyebrow[_ngcontent-%COMP%] {\n  font-size: 10px;\n  letter-spacing: 0.06em;\n  text-transform: uppercase;\n  font-weight: 600;\n  color: #7a8597;\n}\n.sa-dropdown__hint[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #7a8597;\n  margin-top: 2px;\n}\n.sa-dropdown__body[_ngcontent-%COMP%] {\n  padding: 4px;\n  display: block;\n}\n.sa-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  gap: 10px;\n  padding: 4px 12px;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: background 120ms ease;\n}\n.sa-row[_ngcontent-%COMP%]     .mat-mdc-radio-button, .sa-row[_ngcontent-%COMP%]     .mat-mdc-checkbox {\n  margin: 0;\n  flex-shrink: 0;\n  pointer-events: none;\n}\n.sa-row[_ngcontent-%COMP%]     .mat-mdc-radio-button .mdc-form-field, .sa-row[_ngcontent-%COMP%]     .mat-mdc-checkbox .mdc-form-field {\n  align-items: center;\n}\n.sa-row[_ngcontent-%COMP%]     .mat-mdc-radio-button .mdc-label, .sa-row[_ngcontent-%COMP%]     .mat-mdc-checkbox .mdc-label {\n  display: none;\n}\n.sa-row[_ngcontent-%COMP%]     .mat-mdc-radio-button .mat-mdc-radio-touch-target, .sa-row[_ngcontent-%COMP%]     .mat-mdc-radio-button .mat-mdc-checkbox-touch-target, .sa-row[_ngcontent-%COMP%]     .mat-mdc-checkbox .mat-mdc-radio-touch-target, .sa-row[_ngcontent-%COMP%]     .mat-mdc-checkbox .mat-mdc-checkbox-touch-target {\n  display: none;\n}\n.sa-row[_ngcontent-%COMP%]     .mat-mdc-radio-button .mdc-radio, .sa-row[_ngcontent-%COMP%]     .mat-mdc-checkbox .mdc-checkbox {\n  padding: 0;\n  width: 18px;\n  height: 18px;\n  flex: 0 0 18px;\n}\n.sa-row[_ngcontent-%COMP%]     .mat-mdc-radio-button .mdc-radio__background, .sa-row[_ngcontent-%COMP%]     .mat-mdc-checkbox .mdc-checkbox__background {\n  width: 16px;\n  height: 16px;\n  top: 1px;\n  left: 1px;\n}\n.sa-row[_ngcontent-%COMP%]:hover {\n  background: #e6f0ff;\n}\n.sa-row.sa-row--copy[_ngcontent-%COMP%]:hover {\n  background: #ffece6;\n}\n.sa-row__icon[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 16px;\n  height: 18px;\n  flex-shrink: 0;\n}\n.sa-row__icon[_ngcontent-%COMP%]     icon {\n  font-size: 14px;\n  line-height: 1;\n}\n.sa-row__text[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n.sa-row__label[_ngcontent-%COMP%] {\n  font-size: 12px;\n  font-weight: 600;\n  color: #374151;\n  line-height: 18px;\n}\n.sa-row__hint[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #7a8597;\n  line-height: 1.4;\n}\n.sa-suboptions[_ngcontent-%COMP%] {\n  margin: 6px 12px 8px 38px;\n  padding: 14px 16px;\n  border-radius: 8px;\n  border: 1px solid #d7dde6;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n.sa-suboptions[_ngcontent-%COMP%]     .mat-mdc-checkbox {\n  margin: 0;\n}\n.sa-suboptions[_ngcontent-%COMP%]     .mat-mdc-checkbox .mdc-form-field {\n  align-items: center;\n}\n.sa-suboptions[_ngcontent-%COMP%]     .mat-mdc-checkbox .mdc-label {\n  font-size: 12px;\n  color: #374151;\n  padding-left: 8px;\n  line-height: 1;\n}\n.sa-suboptions[_ngcontent-%COMP%]     .mat-mdc-checkbox .mdc-checkbox {\n  padding: 0;\n  margin: 0;\n  width: 16px;\n  height: 16px;\n  flex: 0 0 16px;\n}\n.sa-suboptions[_ngcontent-%COMP%]     .mat-mdc-checkbox .mdc-checkbox__background {\n  width: 16px;\n  height: 16px;\n  top: 0;\n  left: 0;\n}\n.sa-suboptions[_ngcontent-%COMP%]     .mat-mdc-checkbox .mat-mdc-checkbox-touch-target {\n  display: none;\n}\n.sa-suboptions--qf[_ngcontent-%COMP%] {\n  background: rgba(230, 240, 255, 0.6);\n  border-color: #cfdfee;\n}\n.sa-suboptions--copy[_ngcontent-%COMP%] {\n  background: rgba(255, 236, 230, 0.6);\n  border-color: #ffd0c2;\n}\n.sa-divider[_ngcontent-%COMP%] {\n  margin: 6px 8px;\n  height: 1px;\n  background: rgba(215, 221, 230, 0.7);\n}\n.sa-dropdown__foot[_ngcontent-%COMP%] {\n  padding: 8px 12px;\n  background: #f4f6fa;\n  border-top: 1px solid rgba(215, 221, 230, 0.6);\n  font-size: 11px;\n  line-height: 1.4;\n  color: #7a8597;\n}\n.sa-foot__label[_ngcontent-%COMP%] {\n  color: #374151;\n  font-weight: 600;\n}\n.sa-foot__hint[_ngcontent-%COMP%] {\n  color: #7a8597;\n}\n/*# sourceMappingURL=selection-actions-control.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SelectionActionsControlComponent, { className: "SelectionActionsControlComponent", filePath: "src\\app\\shared\\components\\selection-actions\\selection-actions-control.component.ts", lineNumber: 19 });
})();

export {
  SelectionActionsControlComponent
};
//# sourceMappingURL=chunk-GLL6MQHU.js.map
