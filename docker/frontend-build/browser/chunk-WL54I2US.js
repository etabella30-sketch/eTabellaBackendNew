import {
  SelectionActionsService
} from "./chunk-FW6JNL2T.js";
import {
  IssueService
} from "./chunk-3LLM6WVC.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  CommonModule
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  __async,
  __spreadProps,
  __spreadValues,
  computed,
  effect,
  signal,
  untracked,
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
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/pdf/components/qfact-issue-panel/qfact-issue-panel.component.ts
var _forTrack0 = ($index, $item) => $item.nIid;
var _forTrack1 = ($index, $item) => $item.nICid;
function QFactIssuePanelComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2)(1, "span", 5);
    \u0275\u0275text(2, "Loading\u2026");
    \u0275\u0275elementEnd()();
  }
}
function QFactIssuePanelComponent_Conditional_3_For_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 11);
    \u0275\u0275element(1, "span", 13);
    \u0275\u0275elementStart(2, "span", 14);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "button", 15);
    \u0275\u0275listener("click", function QFactIssuePanelComponent_Conditional_3_For_8_Template_button_click_4_listener() {
      const iss_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.toggle(iss_r4.nIid));
    });
    \u0275\u0275text(5, "\xD7");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const iss_r4 = ctx.$implicit;
    \u0275\u0275property("matTooltip", iss_r4.cIName);
    \u0275\u0275advance();
    \u0275\u0275styleProp("background-color", "#" + (iss_r4.cColor || "d6dde8"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(iss_r4.cIName);
  }
}
function QFactIssuePanelComponent_Conditional_3_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("matTooltip", ctx_r1.selectedCount() - 5 + " more selected");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("+", ctx_r1.selectedCount() - 5, "");
  }
}
function QFactIssuePanelComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 6)(1, "div", 7)(2, "span", 8);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "button", 9);
    \u0275\u0275listener("click", function QFactIssuePanelComponent_Conditional_3_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.clearAll());
    });
    \u0275\u0275text(5, "Clear all");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 10);
    \u0275\u0275repeaterCreate(7, QFactIssuePanelComponent_Conditional_3_For_8_Template, 6, 4, "span", 11, _forTrack0);
    \u0275\u0275template(9, QFactIssuePanelComponent_Conditional_3_Conditional_9_Template, 2, 2, "span", 12);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", ctx_r1.selectedCount(), " SELECTED");
    \u0275\u0275advance(4);
    \u0275\u0275repeater(ctx_r1.displayedSelected());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(9, ctx_r1.selectedCount() > 6 ? 9 : -1);
  }
}
function QFactIssuePanelComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2)(1, "span", 5);
    \u0275\u0275text(2, "No issue selected \u2014 Select 1 or more");
    \u0275\u0275elementEnd()();
  }
}
function QFactIssuePanelComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275text(1, "Loading\u2026");
    \u0275\u0275elementEnd();
  }
}
function QFactIssuePanelComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275text(1, "No issues yet. Use Manage to create one.");
    \u0275\u0275elementEnd();
  }
}
function QFactIssuePanelComponent_Conditional_8_For_1_For_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 20);
    \u0275\u0275listener("click", function QFactIssuePanelComponent_Conditional_8_For_1_For_4_Template_button_click_0_listener() {
      const iss_r6 = \u0275\u0275restoreView(_r5).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.toggle(iss_r6.nIid));
    });
    \u0275\u0275element(1, "span", 21);
    \u0275\u0275elementStart(2, "span", 22);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const iss_r6 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275classProp("qfact-row--selected", ctx_r1.isSelected(iss_r6.nIid));
    \u0275\u0275advance();
    \u0275\u0275styleProp("background-color", "#" + (iss_r6.cColor || "d6dde8"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(iss_r6.cIName);
  }
}
function QFactIssuePanelComponent_Conditional_8_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 17)(1, "h4", 18);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(3, QFactIssuePanelComponent_Conditional_8_For_1_For_4_Template, 4, 5, "button", 19, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const g_r7 = ctx.$implicit;
    \u0275\u0275classProp("qfact-group--unassigned", g_r7.isUnassigned);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(g_r7.isUnassigned ? "UNASSIGNED" : g_r7.cCategory);
    \u0275\u0275advance();
    \u0275\u0275repeater(g_r7.issues);
  }
}
function QFactIssuePanelComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, QFactIssuePanelComponent_Conditional_8_For_1_Template, 5, 3, "section", 16, _forTrack1);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275repeater(ctx_r1.visibleGroups());
  }
}
var QFactIssuePanelComponent = class _QFactIssuePanelComponent {
  static {
    this.DEFAULT_VISIBLE_PER_CLAIM = 2;
  }
  /** Resolve the user's currently-picked issue IDs (from the service signal)
   *  to full records via the panel's RAW groups, bypassing the visibility
   *  filter that `effectiveSelection` applies. The visibility filter exists
   *  to drop stale Unassigned chips when real issues are added later — but
   *  it also drops legitimate picks while `visibleGroups` is still
   *  recomputing (right after the user toggles a real issue, the
   *  `bQFactVisible` recomputation can race the storage-sync that brings the
   *  pick into the iframe). For the rapid-create submit path the user's
   *  *intent* is what matters: if they picked an issue ID, that's what the
   *  new QFact should tag, regardless of whether the visibility computation
   *  has caught up yet. */
  resolvePickedFromRawGroups() {
    const ids = this.sa.qfactSelected();
    if (!ids.length)
      return [];
    const all = this.groups().flatMap((g) => g.issues);
    return ids.map((id) => all.find((i) => i.nIid === id)).filter((x) => !!x);
  }
  constructor(sa, issueService, tost) {
    this.sa = sa;
    this.issueService = issueService;
    this.tost = tost;
    this.nSesid = "null";
    this.groups = signal([]);
    this.loading = signal(true);
    this.hasRealIssues = computed(() => this.groups().some((g) => !g.isUnassigned && g.issues.length > 0));
    this.visibleGroups = computed(() => {
      const all = this.groups();
      const realExist = this.hasRealIssues();
      const N = _QFactIssuePanelComponent.DEFAULT_VISIBLE_PER_CLAIM;
      return all.filter((g) => !(realExist && g.isUnassigned)).map((g) => {
        const firstN = [...g.issues].sort((a, b) => (a.nSequence ?? 0) - (b.nSequence ?? 0)).slice(0, N);
        const firstNIds = new Set(firstN.map((iss) => iss.nIid));
        const visible = g.issues.filter((iss) => {
          if (g.isUnassigned && iss.cIName === "Unassigned")
            return true;
          if (iss.bQFactVisible === false)
            return false;
          if (iss.bQFactVisible === true)
            return true;
          return firstNIds.has(iss.nIid);
        });
        visible.sort((a, b) => {
          if (g.isUnassigned) {
            const aU = a.cIName === "Unassigned";
            const bU = b.cIName === "Unassigned";
            if (aU !== bU)
              return aU ? -1 : 1;
          }
          const aQ = a.nQFactSequence;
          const bQ = b.nQFactSequence;
          if (aQ != null && bQ != null)
            return aQ - bQ;
          if (aQ != null)
            return -1;
          if (bQ != null)
            return 1;
          return (a.nSequence ?? 0) - (b.nSequence ?? 0);
        });
        return __spreadProps(__spreadValues({}, g), { issues: visible });
      }).filter((g) => g.issues.length > 0);
    });
    this.unassignedIssue = computed(() => {
      if (this.hasRealIssues())
        return null;
      const u = this.groups().find((g) => g.isUnassigned);
      return u?.issues?.[0] ?? null;
    });
    this.caseUnassignedIssue = computed(() => {
      const u = this.groups().find((g) => g.isUnassigned);
      return u?.issues?.find((i) => i.cIName === "Unassigned") ?? u?.issues?.[0] ?? null;
    });
    this.effectiveSelection = computed(() => {
      const visibleIds = new Set(this.visibleGroups().flatMap((g) => g.issues.map((i) => i.nIid)));
      const explicit = this.sa.qfactSelected().filter((id) => visibleIds.has(id));
      if (explicit.length)
        return explicit;
      const u = this.unassignedIssue();
      return u ? [u.nIid] : [];
    });
    this.selectedCount = computed(() => this.effectiveSelection().length);
    this.effectiveSelectedIssues = computed(() => {
      const ids = this.effectiveSelection();
      const all = this.groups().flatMap((g) => g.issues);
      return ids.map((id) => all.find((i) => i.nIid === id)).filter((x) => !!x);
    });
    this.displayedSelected = computed(() => {
      const issues = this.effectiveSelectedIssues();
      return issues.length > 6 ? issues.slice(0, 5) : issues;
    });
    this.selectedIssuesChange = new EventEmitter();
    effect(() => {
      const issues = this.effectiveSelectedIssues();
      untracked(() => this.selectedIssuesChange.emit(issues));
    });
  }
  ngOnInit() {
    if (this.nCaseid && this.nUserid) {
      void this.loadIssues();
    }
    this.refreshSub = this.sa.qfactRefresh$.subscribe(() => {
      if (this.nCaseid && this.nUserid)
        void this.loadIssues();
    });
  }
  ngOnDestroy() {
    this.refreshSub?.unsubscribe();
  }
  ngOnChanges(changes) {
    if (changes["nCaseid"] && !changes["nCaseid"].firstChange || changes["nUserid"] && !changes["nUserid"].firstChange) {
      void this.loadIssues();
    }
  }
  loadIssues() {
    return __async(this, null, function* () {
      this.loading.set(true);
      try {
        const result = yield this.issueService.fetchIssueListV2({
          nCaseid: this.nCaseid,
          nSessionid: this.nSesid || "null",
          nIDid: "null",
          nUserid: this.nUserid
        });
        const categories = result?.[0] ?? [];
        const issues = result?.[1] ?? [];
        const knownICids = /* @__PURE__ */ new Set();
        const groups = categories.map((cat) => {
          knownICids.add(cat.nICid);
          return {
            nICid: cat.nICid,
            cCategory: cat.cCategory,
            isUnassigned: cat.cCategory === "Unassigned",
            issues: issues.filter((iss) => iss.nICid === cat.nICid),
            nSequence: cat.nSequence,
            nQFactSequence: cat.nQFactSequence ?? null
          };
        });
        const orphans = /* @__PURE__ */ new Map();
        for (const iss of issues) {
          if (knownICids.has(iss.nICid))
            continue;
          if (!orphans.has(iss.nICid)) {
            orphans.set(iss.nICid, {
              nICid: iss.nICid,
              cCategory: iss.cCategory,
              isUnassigned: iss.cCategory === "Unassigned",
              issues: []
            });
          }
          orphans.get(iss.nICid).issues.push(iss);
        }
        groups.push(...Array.from(orphans.values()));
        groups.sort((a, b) => {
          if (a.isUnassigned !== b.isUnassigned)
            return a.isUnassigned ? -1 : 1;
          const aQ = a.nQFactSequence;
          const bQ = b.nQFactSequence;
          if (aQ != null && bQ != null)
            return aQ - bQ;
          if (aQ != null)
            return -1;
          if (bQ != null)
            return 1;
          return (a.nSequence ?? 0) - (b.nSequence ?? 0);
        });
        this.groups.set(groups);
      } catch (e) {
        console.error("Failed to load QFact issues", e);
        this.groups.set([]);
      } finally {
        this.loading.set(false);
      }
    });
  }
  isSelected(nIid) {
    return this.effectiveSelection().includes(nIid);
  }
  toggle(nIid) {
    this.sa.toggleQFactIssue(nIid);
  }
  clearAll() {
    this.sa.clearQFactIssues();
  }
  manage() {
    this.sa.requestOpenQFactManage();
  }
  static {
    this.\u0275fac = function QFactIssuePanelComponent_Factory(t) {
      return new (t || _QFactIssuePanelComponent)(\u0275\u0275directiveInject(SelectionActionsService), \u0275\u0275directiveInject(IssueService), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _QFactIssuePanelComponent, selectors: [["qfact-issue-panel"]], inputs: { nCaseid: "nCaseid", nUserid: "nUserid", nSesid: "nSesid" }, outputs: { selectedIssuesChange: "selectedIssuesChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 9, vars: 2, consts: [[1, "qfact-panel"], [1, "qfact-panel__head"], [1, "qfact-panel__status"], [1, "qfact-panel__body"], [1, "qfact-empty"], [1, "muted"], [1, "qfact-selected"], [1, "qfact-selected__head"], [1, "qfact-selected__count"], ["type", "button", 1, "qfact-selected__clear", 3, "click"], [1, "qfact-selected__chips"], ["matTooltipPosition", "above", 1, "qfact-chip", 3, "matTooltip"], ["matTooltipPosition", "above", 1, "qfact-chip__more", 3, "matTooltip"], [1, "qfact-chip__dot"], [1, "qfact-chip__label"], ["type", "button", "aria-label", "Remove", 1, "qfact-chip__close", 3, "click"], [1, "qfact-group", 3, "qfact-group--unassigned"], [1, "qfact-group"], [1, "qfact-group__head"], ["type", "button", 1, "qfact-row", 3, "qfact-row--selected"], ["type", "button", 1, "qfact-row", 3, "click"], [1, "qfact-row__bar"], [1, "qfact-row__label"]], template: function QFactIssuePanelComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "aside", 0)(1, "header", 1);
        \u0275\u0275template(2, QFactIssuePanelComponent_Conditional_2_Template, 3, 0, "div", 2)(3, QFactIssuePanelComponent_Conditional_3_Template, 10, 2)(4, QFactIssuePanelComponent_Conditional_4_Template, 3, 0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "div", 3);
        \u0275\u0275template(6, QFactIssuePanelComponent_Conditional_6_Template, 2, 0, "div", 4)(7, QFactIssuePanelComponent_Conditional_7_Template, 2, 0)(8, QFactIssuePanelComponent_Conditional_8_Template, 2, 0);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275conditional(2, ctx.loading() ? 2 : ctx.selectedCount() ? 3 : 4);
        \u0275\u0275advance(4);
        \u0275\u0275conditional(6, ctx.loading() ? 6 : !ctx.visibleGroups().length ? 7 : 8);
      }
    }, dependencies: [CommonModule, MatTooltipModule, MatTooltip], styles: ["\n\n[_nghost-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  width: 277px;\n  min-width: 277px;\n  background: #fff;\n  min-height: 0;\n}\n.qfact-panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  overflow: hidden;\n  position: relative;\n  box-shadow: 4px 0 10px -2px rgba(60, 76, 102, 0.25);\n}\n.qfact-panel__head[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  padding: 10px 12px;\n  border-bottom: 1px solid #e1e6ee;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n.qfact-panel__status[_ngcontent-%COMP%] {\n  font-size: 12px;\n  font-weight: 600;\n  color: #1a4ed8;\n}\n.qfact-panel__status[_ngcontent-%COMP%]   .muted[_ngcontent-%COMP%] {\n  color: #6b7d99;\n  font-weight: 500;\n}\n.qfact-selected__head[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 6px;\n}\n.qfact-selected__count[_ngcontent-%COMP%] {\n  font-size: 11px;\n  font-weight: 700;\n  color: #1a4ed8;\n  letter-spacing: 0.04em;\n}\n.qfact-selected__clear[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #6b7d99;\n  background: none;\n  border: none;\n  cursor: pointer;\n  padding: 0;\n}\n.qfact-selected__clear[_ngcontent-%COMP%]:hover {\n  color: #1a4ed8;\n  text-decoration: underline;\n}\n.qfact-selected__chips[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 4px;\n}\n.qfact-chip[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 2px 4px 2px 6px;\n  background: #f1f5fc;\n  border: 1px solid #e1e6ee;\n  border-radius: 999px;\n  font-size: 11px;\n  min-width: 0;\n}\n.qfact-chip__dot[_ngcontent-%COMP%] {\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  flex-shrink: 0;\n}\n.qfact-chip__label[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: #2b3a55;\n}\n.qfact-chip__close[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  padding: 0 2px;\n  font-size: 13px;\n  color: #6b7d99;\n  cursor: pointer;\n  line-height: 1;\n}\n.qfact-chip__close[_ngcontent-%COMP%]:hover {\n  color: #1a4ed8;\n}\n.qfact-chip__more[_ngcontent-%COMP%] {\n  font-size: 10px;\n  font-weight: 600;\n  color: #6b7d99;\n  background: #f1f5fc;\n  border: 1px solid #e1e6ee;\n  width: 22px;\n  height: 22px;\n  border-radius: 50%;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  align-self: center;\n  justify-self: start;\n  line-height: 1;\n}\n.qfact-panel__body[_ngcontent-%COMP%] {\n  flex: 1;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  scrollbar-gutter: stable both-edges;\n  padding: 12px;\n  background: #eeeeee;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n.qfact-group[_ngcontent-%COMP%] {\n  background: #fff;\n  border: 1px solid #e1e6ee;\n  border-radius: 10px;\n  padding: 12px 14px;\n  margin: 0;\n}\n.qfact-group__head[_ngcontent-%COMP%] {\n  margin: 0 0 8px 0;\n  font-size: 12px;\n  font-weight: 700;\n  letter-spacing: 0.02em;\n  color: #2b3a55;\n  padding: 0;\n}\n.qfact-group--unassigned[_ngcontent-%COMP%]   .qfact-group__head[_ngcontent-%COMP%] {\n  color: #1a4ed8;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  font-size: 11px;\n}\n.qfact-row[_ngcontent-%COMP%] {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 6px 8px;\n  background: #f6f9fb;\n  border-radius: 6px;\n  border: none;\n  margin-bottom: 4px;\n  cursor: pointer;\n  font-size: 12px;\n  text-align: left;\n  color: #2b3a55;\n  transition: background-color 0.15s ease, box-shadow 0.15s ease;\n}\n.qfact-row[_ngcontent-%COMP%]:last-child {\n  margin-bottom: 0;\n}\n.qfact-row[_ngcontent-%COMP%]:hover {\n  background: #eaf0fd;\n}\n.qfact-row.qfact-row--selected[_ngcontent-%COMP%] {\n  background: #eaf0fd;\n  box-shadow: 0 0 0 1px #1a4ed8 inset;\n}\n.qfact-row__bar[_ngcontent-%COMP%] {\n  width: 16px;\n  height: 18px;\n  border-radius: 2px;\n  flex-shrink: 0;\n}\n.qfact-row__label[_ngcontent-%COMP%] {\n  flex: 1;\n  color: #2b3a55;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.qfact-empty[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 24px 12px;\n  color: #6b7d99;\n  font-size: 12px;\n}\n/*# sourceMappingURL=qfact-issue-panel.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(QFactIssuePanelComponent, { className: "QFactIssuePanelComponent", filePath: "src\\app\\pdf\\components\\qfact-issue-panel\\qfact-issue-panel.component.ts", lineNumber: 31 });
})();

export {
  QFactIssuePanelComponent
};
//# sourceMappingURL=chunk-WL54I2US.js.map
