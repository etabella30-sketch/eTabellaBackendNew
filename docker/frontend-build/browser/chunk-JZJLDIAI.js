import {
  FactsheetService
} from "./chunk-BQHPVQEY.js";
import {
  WorkspaceService
} from "./chunk-PR7CQFYY.js";
import {
  SharedViewComponent
} from "./chunk-LDIF3HSE.js";
import {
  SelectedTasksComponent
} from "./chunk-5Y6TORWD.js";
import {
  FactService
} from "./chunk-IMS2LHRB.js";
import {
  DateShowComponent
} from "./chunk-YOQ7GVDA.js";
import {
  SelectedContactComponent
} from "./chunk-623VNBJI.js";
import {
  SourceCardComponent
} from "./chunk-X7K4VII4.js";
import {
  BadgeComponent
} from "./chunk-3SO7BHVN.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  MatMenuModule
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  DomSanitizer
} from "./chunk-FNSUDMGC.js";
import {
  CommonModule,
  DatePipe,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  __spreadProps,
  __spreadValues,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferWhen,
  ɵɵdefineComponent,
  ɵɵdefinePipe,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/interfaces/fact-table.interface.ts
var FACT_TABLE_CONSTANTS = {
  icons: {
    up: "../../../../assets/img/sortup.svg",
    down: "../../../../assets/img/sortdown.svg",
    group: "../../../../assets/img/groupby.svg"
  },
  defaultSortKeys: {
    event: "dCreateDt",
    created: "dCreateDt",
    type: "cFiletype",
    note: "noteSort",
    issues: "issuesSort",
    impact: "topimpact_ind",
    relevance: "toprelevance_ind",
    source: "cFilename"
  },
  headerColumns: [
    {
      id: 1,
      key: "event",
      isshow: true,
      name: "Event Date",
      class: "date",
      sortable: true,
      sortKey: "dCreateDt",
      sortlist: [
        { nm: "Most recent", icon: "../../../../assets/img/sortup.svg", typ: "D", clmn: "dCreateDt" },
        { nm: "Oldest", icon: "../../../../assets/img/sortdown.svg", typ: "A", clmn: "dCreateDt" }
      ]
    },
    {
      id: 2,
      key: "created",
      isshow: true,
      name: "Created",
      class: "created",
      sortable: true,
      sortKey: "dCreateDt",
      sortlist: []
    },
    {
      id: 3,
      key: "type",
      isshow: true,
      name: "Type",
      class: "type",
      sortable: true,
      sortKey: "cFiletype",
      sortlist: []
    },
    {
      id: 4,
      key: "note",
      isshow: true,
      name: "Note",
      class: "fbox",
      sortable: true,
      sortKey: "noteSort",
      sortlist: []
    },
    {
      id: 5,
      key: "issues",
      isshow: true,
      name: "Issues",
      class: "issues",
      sortable: true,
      sortKey: "issuesSort",
      sortlist: []
    },
    {
      id: 6,
      key: "impact",
      isshow: true,
      name: "Impact",
      class: "imp",
      sortable: true,
      sortKey: "topimpact_ind",
      sortlist: [
        { nm: "Most impact", icon: "../../../../assets/img/sortup.svg", typ: "A", clmn: "topimpact_ind" },
        { nm: "Least impact", icon: "../../../../assets/img/sortdown.svg", typ: "D", clmn: "topimpact_ind" },
        { nm: "Group by this column", icon: "../../../../assets/img/groupby.svg", typ: "G", clmn: "I" }
      ]
    },
    {
      id: 7,
      key: "relevance",
      isshow: true,
      name: "Relevance",
      class: "rel",
      sortable: true,
      sortKey: "toprelevance_ind",
      sortlist: [
        { nm: "Most relevance", icon: "../../../../assets/img/sortup.svg", typ: "A", clmn: "toprelevance_ind" },
        { nm: "Least relevance", icon: "../../../../assets/img/sortdown.svg", typ: "D", clmn: "toprelevance_ind" },
        { nm: "Group by this column", icon: "../../../../assets/img/groupby.svg", typ: "G", clmn: "R" }
      ]
    },
    {
      id: 8,
      key: "source",
      isshow: true,
      name: "Source",
      class: "source",
      sortable: true,
      sortKey: "cFilename",
      sortlist: [
        { nm: "A-Z", icon: "../../../../assets/img/sortup.svg", typ: "A", clmn: "cFilename" },
        { nm: "Z-A", icon: "../../../../assets/img/sortdown.svg", typ: "D", clmn: "cFilename" },
        { nm: "Group by this column", icon: "../../../../assets/img/groupby.svg", typ: "G", clmn: "F" }
      ]
    },
    {
      id: 9,
      key: "contacts",
      isshow: true,
      name: "Contacts",
      class: "contacts",
      sortable: false,
      sortKey: null,
      sortlist: []
    },
    {
      id: 10,
      key: "tasks",
      isshow: true,
      name: "Tasks",
      class: "tasks",
      sortable: false,
      sortKey: null,
      sortlist: []
    },
    {
      id: 11,
      key: "doclinks",
      isshow: true,
      name: "Links",
      class: "doclinks",
      sortable: false,
      sortKey: null,
      sortlist: []
    },
    {
      id: 12,
      key: "actions",
      isshow: false,
      name: "Actions",
      class: "actions",
      sortable: false,
      sortKey: null,
      sortlist: []
    }
  ],
  defaultType: "I"
};

// src/app/shared/pipes/highlight.pipe.ts
var HighlightPipe = class _HighlightPipe {
  constructor(sanitizer) {
    this.sanitizer = sanitizer;
  }
  transform(value, searchTerm) {
    if (!searchTerm || !value) {
      return value;
    }
    const safeSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeSearchTerm})`, "gi");
    const highlighted = value.replace(regex, '<span class="bg-yellow-300">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
  static {
    this.\u0275fac = function HighlightPipe_Factory(t) {
      return new (t || _HighlightPipe)(\u0275\u0275directiveInject(DomSanitizer, 16));
    };
  }
  static {
    this.\u0275pipe = /* @__PURE__ */ \u0275\u0275definePipe({ name: "highlight", type: _HighlightPipe, pure: true, standalone: true });
  }
};

// src/app/shared/components/fact-table/fact-table.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_Defer_2_DepsFn = () => [import("./chunk-CHP3BEGB.js").then((m) => m.FactNoteComponent), MatTooltip, TranslatePipe];
var _c0 = (a0) => ({ "isfull": false, "isQfact": a0 });
var _c1 = (a0) => ({ "isQfact": a0 });
var _c2 = (a0) => ({ "mt-1": a0 });
var _c3 = (a0) => ({ "background": a0 });
var _c4 = (a0) => ({ "background-color": a0 });
function FactTableComponent_Conditional_1_For_3_Conditional_0_Conditional_7_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275textInterpolate1(" ", ctx_r2.activeSortDir === "asc" ? "\u25B2" : "\u25BC", " ");
  }
}
function FactTableComponent_Conditional_1_For_3_Conditional_0_Conditional_7_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " \u2195 ");
  }
}
function FactTableComponent_Conditional_1_For_3_Conditional_0_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 8);
    \u0275\u0275template(1, FactTableComponent_Conditional_1_For_3_Conditional_0_Conditional_7_Conditional_1_Template, 1, 1)(2, FactTableComponent_Conditional_1_For_3_Conditional_0_Conditional_7_Conditional_2_Template, 1, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r2.activeSortKey === x_r4.sortKey ? 1 : 2);
  }
}
function FactTableComponent_Conditional_1_For_3_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275listener("dragstart", function FactTableComponent_Conditional_1_For_3_Conditional_0_Template_div_dragstart_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const $index_r2 = \u0275\u0275nextContext().$index;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onHeaderDragStart($event, $index_r2));
    })("dragover", function FactTableComponent_Conditional_1_For_3_Conditional_0_Template_div_dragover_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.onHeaderDragOver($event));
    })("drop", function FactTableComponent_Conditional_1_For_3_Conditional_0_Template_div_drop_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const $index_r2 = \u0275\u0275nextContext().$index;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onHeaderDrop($event, $index_r2));
    })("click", function FactTableComponent_Conditional_1_For_3_Conditional_0_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const x_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r2.onHeaderClick(x_r4));
    })("keydown.enter", function FactTableComponent_Conditional_1_For_3_Conditional_0_Template_div_keydown_enter_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const x_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r2.onHeaderClick(x_r4));
    });
    \u0275\u0275elementStart(1, "h6", 5)(2, "span", 6)(3, "span", 7);
    \u0275\u0275text(4, "\u22EE\u22EE");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, FactTableComponent_Conditional_1_For_3_Conditional_0_Conditional_7_Template, 3, 1, "span", 8);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngClass", x_r4.class);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(x_r4.name);
    \u0275\u0275advance();
    \u0275\u0275conditional(7, x_r4.sortKey || x_r4.sortable ? 7 : -1);
  }
}
function FactTableComponent_Conditional_1_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_1_For_3_Conditional_0_Template, 8, 3, "div", 3);
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    \u0275\u0275conditional(0, x_r4.isshow ? 0 : -1);
  }
}
function FactTableComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "header")(1, "div", 2);
    \u0275\u0275repeaterCreate(2, FactTableComponent_Conditional_1_For_3_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(1, _c0, ctx_r2.isQFact));
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.headercoloumns);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "date-show", 21);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275property("jDate", ctx_r2.fact == null ? null : ctx_r2.fact.jDate)("showPrefix", false);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "date");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(2, 1, ctx_r2.fact == null ? null : ctx_r2.fact.dCreateDt, "M/d/yyyy, h:mm:ss a"));
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 19)(1, "div", 20);
    \u0275\u0275template(2, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_0_Conditional_2_Template, 1, 2, "date-show", 21)(3, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_0_Conditional_3_Template, 3, 4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, (ctx_r2.fact == null ? null : ctx_r2.fact.jDate) ? 2 : 3);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 22)(1, "div", 20)(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "br");
    \u0275\u0275elementStart(6, "span");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(4, 2, ctx_r2.fact == null ? null : ctx_r2.fact.dCreateDt, "M/d/yyyy, h:mm:ss a"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1("By ", (ctx_r2.fact == null ? null : ctx_r2.fact.cCreateby) || "-", "");
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.fact == null ? null : ctx_r2.fact.cFiletype);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, "FACT_TABLE.MISSING"));
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23)(1, "div", 20);
    \u0275\u0275template(2, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_2_Conditional_2_Template, 2, 1, "span")(3, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_2_Conditional_3_Template, 3, 3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, (ctx_r2.fact == null ? null : ctx_r2.fact.cFiletype) ? 2 : 3);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 27);
    \u0275\u0275element(1, "div", 28);
    \u0275\u0275pipe(2, "highlight");
    \u0275\u0275elementStart(3, "button", 29);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_0_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext(6);
      return \u0275\u0275resetView(ctx_r2.startEditNote());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 30);
    \u0275\u0275element(6, "path", 31);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275property("innerHTML", \u0275\u0275pipeBind2(2, 2, (ctx_r2.fact == null ? null : ctx_r2.fact.cFact) || ((ctx_r2.jTexts == null ? null : ctx_r2.jTexts.length) ? ctx_r2.jTexts[0] : ""), ctx_r2.noteSearchText), \u0275\u0275sanitizeHtml);
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(4, 5, "FACT_TABLE.EDIT"));
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_Defer_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 32)(1, "fact-note", 33);
    \u0275\u0275twoWayListener("jTextsChange", function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_Defer_0_Template_fact_note_jTextsChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext(8);
      \u0275\u0275twoWayBindingSet(ctx_r2.jTexts, $event) || (ctx_r2.jTexts = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(2, "div", 34)(3, "button", 35);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_Defer_0_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext(8);
      return \u0275\u0275resetView(ctx_r2.SaveNote({ jTexts: ctx_r2.jTexts, nFSid: ctx_r2.fact.nFSid }));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 30);
    \u0275\u0275element(6, "path", 36);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "button", 37);
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_Defer_0_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext(8);
      return \u0275\u0275resetView(ctx_r2.isEditText = false);
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(9, "svg", 30);
    \u0275\u0275element(10, "path", 38);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(8);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("jTexts", ctx_r2.jTexts);
    \u0275\u0275property("type", "QF")("nCaseid", ctx_r2.nCaseid)("isnotHeader", false);
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(4, 6, "FACT_TABLE.SAVE_NOTE"));
    \u0275\u0275advance(4);
    \u0275\u0275property("matTooltip", \u0275\u0275pipeBind1(8, 8, "FACT_TABLE.CANCEL"));
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_DeferPlaceholder_1_Template(rf, ctx) {
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_Defer_0_Template, 11, 10)(1, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_DeferPlaceholder_1_Template, 0, 0);
    \u0275\u0275defer(2, 0, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_Defer_2_DepsFn, null, 1);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(7);
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r2.jTexts == null ? null : ctx_r2.jTexts.length);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Conditional_0_Template, 4, 1);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(6);
    \u0275\u0275conditional(0, (ctx_r2.jTexts == null ? null : ctx_r2.jTexts.length) ? 0 : -1);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_0_Template, 7, 7, "div", 27)(1, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Conditional_1_Template, 1, 1);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275conditional(0, !ctx_r2.isEditText ? 0 : 1);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_3_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 39)(1, "button", 40);
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_3_Conditional_0_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r2 = \u0275\u0275nextContext(6);
      return \u0275\u0275resetView(ctx_r2.addNote());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 41);
    \u0275\u0275element(3, "path", 42);
    \u0275\u0275elementEnd();
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(5, 1, "FACT_TABLE.ADD_NOTE"), " ");
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_3_Conditional_0_Template, 6, 3, "div", 39);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275conditional(0, !ctx_r2.isEditText ? 0 : -1);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 25)(1, "div", 26);
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275template(2, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_2_Template, 2, 1)(3, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Conditional_3_Template, 1, 1);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, !ctx_r2.isEmpty ? 2 : 3);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_4_Conditional_2_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 46);
    \u0275\u0275element(1, "span", 47);
    \u0275\u0275elementStart(2, "span", 48);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const issue_r9 = ctx.$implicit;
    const $index_r10 = ctx.$index;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(4, _c2, $index_r10 > 0));
    \u0275\u0275advance();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(6, _c3, "#" + issue_r9.cColor));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", issue_r9.cIName, " (", issue_r9.cCategory, ") ");
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_4_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 44)(1, "div", 45);
    \u0275\u0275repeaterCreate(2, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_4_Conditional_2_For_3_Template, 4, 8, "div", 46, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.issue_ls);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_4_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1, "Missing");
    \u0275\u0275elementEnd();
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 43)(1, "div", 20);
    \u0275\u0275template(2, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_4_Conditional_2_Template, 4, 0, "div", 44)(3, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_4_Conditional_3_Template, 2, 0);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, (ctx_r2.issue_ls == null ? null : ctx_r2.issue_ls.length) ? 2 : 3);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_5_ng_container_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span", 53);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const rel_r11 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c4, ctx_r2.getRelevanceColor(rel_r11)));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", rel_r11, " ");
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_5_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_5_ng_container_3_ng_container_1_Template, 3, 4, "ng-container", 52);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.factRelevanceList);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_5_ng_template_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, "FACT_TABLE.MISSING"));
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 49)(1, "div", 20)(2, "div", 50);
    \u0275\u0275template(3, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_5_ng_container_3_Template, 2, 1, "ng-container", 51)(4, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_5_ng_template_4_Template, 3, 3, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const noRelevance_r12 = \u0275\u0275reference(5);
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r2.factRelevanceList.length)("ngIfElse", noRelevance_r12);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_6_Conditional_3_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 55);
    \u0275\u0275element(1, "img", 56);
    \u0275\u0275elementStart(2, "badge", 57);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const impact_r13 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("src", "assets/icons/impact/" + impact_r13.id + ".png", \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(impact_r13.count);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_6_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_6_Conditional_3_For_1_Template, 4, 2, "div", 55, _forTrack0);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275repeater(ctx_r2.factImpactList);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_6_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, "FACT_TABLE.MISSING"));
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 54)(1, "div", 20)(2, "div", 50);
    \u0275\u0275template(3, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_6_Conditional_3_Template, 2, 0)(4, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_6_Conditional_4_Template, 3, 3);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(3, ctx_r2.factImpactList.length ? 3 : 4);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 58)(1, "div", 59);
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_7_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r14);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "source-card", 60);
    \u0275\u0275listener("OnEvent", function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_7_Template_source_card_OnEvent_2_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.OnSourceEvent($event, "F"));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275property("heading", false)("type", "A")("detail", ctx_r2.fact);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 61)(1, "div", 62)(2, "div", 63)(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.getContactsCount());
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 64)(1, "div", 62)(2, "div", 65)(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.getTasksCount());
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 66)(1, "div", 62)(2, "div", 67)(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.getLinksCount());
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_11_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 68)(1, "div", 69)(2, "button", 70);
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_11_Conditional_0_Template_button_click_2_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r2 = \u0275\u0275nextContext(5);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r2.openToQFect());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 71);
    \u0275\u0275element(4, "path", 72)(5, "path", 73)(6, "path", 74)(7, "path", 75)(8, "path", 76)(9, "path", 77)(10, "path", 78)(11, "path", 79);
    \u0275\u0275elementEnd()()()();
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_11_Conditional_0_Template, 12, 0, "div", 68);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275conditional(0, ctx_r2.isQFact ? 0 : -1);
  }
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Case_12_Template(rf, ctx) {
}
function FactTableComponent_Conditional_2_For_4_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_0_Template, 4, 1)(1, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_1_Template, 8, 5)(2, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_2_Template, 4, 1)(3, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_3_Template, 4, 1)(4, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_4_Template, 4, 1)(5, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_5_Template, 6, 2)(6, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_6_Template, 5, 1)(7, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_7_Template, 3, 3)(8, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_8_Template, 5, 1)(9, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_9_Template, 5, 1)(10, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_10_Template, 5, 1)(11, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_11_Template, 1, 1)(12, FactTableComponent_Conditional_2_For_4_Conditional_0_Case_12_Template, 0, 0);
  }
  if (rf & 2) {
    let tmp_12_0;
    const col_r16 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275conditional(0, (tmp_12_0 = col_r16.key) === "event" ? 0 : tmp_12_0 === "created" ? 1 : tmp_12_0 === "type" ? 2 : tmp_12_0 === "note" ? 3 : tmp_12_0 === "issues" ? 4 : tmp_12_0 === "relevance" ? 5 : tmp_12_0 === "impact" ? 6 : tmp_12_0 === "source" ? 7 : tmp_12_0 === "contacts" ? 8 : tmp_12_0 === "tasks" ? 9 : tmp_12_0 === "doclinks" ? 10 : tmp_12_0 === "actions" ? 11 : 12);
  }
}
function FactTableComponent_Conditional_2_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_For_4_Conditional_0_Template, 13, 1);
  }
  if (rf & 2) {
    const col_r16 = ctx.$implicit;
    \u0275\u0275conditional(0, col_r16.isshow ? 0 : -1);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(1, 1, "FACT_TABLE.ISSUES"), " ");
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(1, 1, "FACT_TABLE.CONTACTS"), " ");
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(1, 1, "FACT_TABLE.TASKS"), " ");
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(1, 1, "FACT_TABLE.DOCUMENT_LINKS"), " ");
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_For_2_Conditional_6_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "badge", 93);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const i_r18 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275property("addcls", "!py-px px-1 !font-bold ");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(i_r18.cRelevance);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_For_2_Conditional_6_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 94);
  }
  if (rf & 2) {
    const i_r18 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275property("src", "assets/icons/impact/" + i_r18.nImpactid + ".png", \u0275\u0275sanitizeUrl);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_For_2_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 92);
    \u0275\u0275template(1, FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_For_2_Conditional_6_Conditional_1_Template, 2, 2, "badge", 93)(2, FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_For_2_Conditional_6_Conditional_2_Template, 1, 1, "img", 94);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const i_r18 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275conditional(1, i_r18.cRelevance ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, i_r18.nImpactid ? 2 : -1);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 87)(1, "div", 88)(2, "div", 89);
    \u0275\u0275element(3, "span", 90);
    \u0275\u0275elementStart(4, "span", 91);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_For_2_Conditional_6_Template, 3, 2, "div", 92);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const i_r18 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(4, _c3, "#" + i_r18.cColor));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", i_r18.cIName, " (", i_r18.cCategory, ")");
    \u0275\u0275advance();
    \u0275\u0275conditional(6, i_r18.cRelevance || i_r18.nImpactid ? 6 : -1);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 86);
    \u0275\u0275repeaterCreate(1, FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_For_2_Template, 7, 6, "div", 87, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.issue_ls);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 95)(1, "h6", 96);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 97);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 2, "FACT_TABLE.NO_ISSUES"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 4, "FACT_TABLE.NO_ISSUES_DESC"));
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_0_Template, 3, 0, "div", 86)(1, FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Conditional_1_Template, 7, 6);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275conditional(0, (ctx_r2.issue_ls == null ? null : ctx_r2.issue_ls.length) ? 0 : 1);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_13_Conditional_0_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 99)(1, "div", 100)(2, "div", 101);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 102)(5, "h6", 83);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 103);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 104)(10, "span", 105);
    \u0275\u0275text(11);
    \u0275\u0275pipe(12, "translate");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(13, "div", 106)(14, "span");
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "span");
    \u0275\u0275text(18);
    \u0275\u0275pipe(19, "translate");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const c_r19 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r2.getInitials(c_r19), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", c_r19.cFname, " ", c_r19.cLname, "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(c_r19.cRole);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", c_r19.cPartyname === "Respondent" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", c_r19.cPartyname || \u0275\u0275pipeBind1(12, 10, "FACT_TABLE.PARTY"), " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate2("", \u0275\u0275pipeBind1(16, 12, "FACT_TABLE.COMPANY"), " ", c_r19.cCompany || "-", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", \u0275\u0275pipeBind1(19, 14, "FACT_TABLE.EMAIL"), " ", c_r19.cEmail || "-", " ");
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_13_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 98);
    \u0275\u0275repeaterCreate(1, FactTableComponent_Conditional_2_Conditional_9_Conditional_13_Conditional_0_For_2_Template, 20, 16, "div", 99, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.contact_list);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_13_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 95)(1, "div", 107);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 108);
    \u0275\u0275element(3, "path", 109);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(4, "h6", 96);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 97);
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 2, "FACT_TABLE.NO_CONTACTS"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(9, 4, "FACT_TABLE.NO_CONTACTS_DESC"));
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_Conditional_9_Conditional_13_Conditional_0_Template, 3, 0, "div", 98)(1, FactTableComponent_Conditional_2_Conditional_9_Conditional_13_Conditional_1_Template, 10, 6);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275conditional(0, (ctx_r2.contact_list == null ? null : ctx_r2.contact_list.length) ? 0 : 1);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_14_Conditional_0_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 99)(1, "div", 100)(2, "div", 110);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 111);
    \u0275\u0275element(4, "path", 112);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "div", 102)(6, "h6", 113);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "p", 114);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "div", 104)(11, "span", 105);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(13, "div", 115)(14, "div", 116)(15, "span");
    \u0275\u0275text(16);
    \u0275\u0275pipe(17, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "span", 117);
    \u0275\u0275text(19);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(20, "div", 116)(21, "span");
    \u0275\u0275text(22);
    \u0275\u0275pipe(23, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "span", 117);
    \u0275\u0275text(25);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const t_r20 = ctx.$implicit;
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(t_r20.cSubject);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(t_r20.cDesc);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", t_r20.cStatustext === "Done" ? "bg-green-100 text-green-800" : t_r20.cStatustext === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", t_r20.cStatustext || t_r20.cStatus, " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(17, 8, "FACT_TABLE.STATUS"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(t_r20.cStatustext || t_r20.cStatus || "-");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(23, 10, "FACT_TABLE.DUE_DATE"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(t_r20.dEndDt || "-");
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_14_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 98);
    \u0275\u0275repeaterCreate(1, FactTableComponent_Conditional_2_Conditional_9_Conditional_14_Conditional_0_For_2_Template, 26, 12, "div", 99, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.task_list);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_14_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 95)(1, "div", 107);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 108);
    \u0275\u0275element(3, "path", 112);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(4, "h6", 96);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 97);
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 2, "FACT_TABLE.NO_TASKS"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(9, 4, "FACT_TABLE.NO_TASKS_DESC"));
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_Conditional_9_Conditional_14_Conditional_0_Template, 3, 0, "div", 98)(1, FactTableComponent_Conditional_2_Conditional_9_Conditional_14_Conditional_1_Template, 10, 6);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275conditional(0, (ctx_r2.task_list == null ? null : ctx_r2.task_list.length) ? 0 : 1);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_15_Conditional_0_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 99)(1, "div", 100)(2, "div", 118);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 111);
    \u0275\u0275element(4, "path", 119);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "div", 102)(6, "h6", 113);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "p", 120);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "div", 121)(12, "div", 116)(13, "span", 122);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "span", 123);
    \u0275\u0275text(17);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "div", 116)(19, "span", 122);
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "span", 123);
    \u0275\u0275text(23);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(24, "div", 124)(25, "button", 125);
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_Conditional_9_Conditional_15_Conditional_0_For_2_Template_button_click_25_listener() {
      const l_r22 = \u0275\u0275restoreView(_r21).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r2.openfile(l_r22.nBundledetailid, 1, ctx_r2.fact == null ? null : ctx_r2.fact.nFSid));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(26, "svg", 126);
    \u0275\u0275element(27, "path", 127);
    \u0275\u0275elementEnd();
    \u0275\u0275text(28);
    \u0275\u0275pipe(29, "translate");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const l_r22 = ctx.$implicit;
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(l_r22.cName || l_r22.cFilename);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", \u0275\u0275pipeBind1(10, 8, "FACT_TABLE.REFERENCE"), " ", l_r22.cExhibitno || "-", "");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(15, 10, "FACT_TABLE.TAB"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", l_r22.cTab || "-", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(21, 12, "FACT_TABLE.PAGE"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", l_r22.cPage || "-", " ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(29, 14, "FACT_TABLE.OPEN_DOCUMENT"), " ");
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_15_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 98);
    \u0275\u0275repeaterCreate(1, FactTableComponent_Conditional_2_Conditional_9_Conditional_15_Conditional_0_For_2_Template, 30, 16, "div", 99, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.factLinks);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_15_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 95)(1, "div", 107);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 108);
    \u0275\u0275element(3, "path", 119);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(4, "h6", 96);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 97);
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(6, 2, "FACT_TABLE.NO_DOCUMENT_LINKS"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(9, 4, "FACT_TABLE.NO_DOCUMENT_LINKS_DESC"));
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FactTableComponent_Conditional_2_Conditional_9_Conditional_15_Conditional_0_Template, 3, 0, "div", 98)(1, FactTableComponent_Conditional_2_Conditional_9_Conditional_15_Conditional_1_Template, 10, 6);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275conditional(0, (ctx_r2.factLinks == null ? null : ctx_r2.factLinks.length) ? 0 : 1);
  }
}
function FactTableComponent_Conditional_2_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14)(1, "div", 80);
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_Conditional_9_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r17);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.closePeek());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 81)(3, "header", 82)(4, "h6", 83);
    \u0275\u0275template(5, FactTableComponent_Conditional_2_Conditional_9_Conditional_5_Template, 2, 3)(6, FactTableComponent_Conditional_2_Conditional_9_Conditional_6_Template, 2, 3)(7, FactTableComponent_Conditional_2_Conditional_9_Conditional_7_Template, 2, 3)(8, FactTableComponent_Conditional_2_Conditional_9_Conditional_8_Template, 2, 3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 84);
    \u0275\u0275listener("click", function FactTableComponent_Conditional_2_Conditional_9_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r17);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.closePeek());
    });
    \u0275\u0275text(10, " \u2715 ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 85);
    \u0275\u0275template(12, FactTableComponent_Conditional_2_Conditional_9_Conditional_12_Template, 2, 1)(13, FactTableComponent_Conditional_2_Conditional_9_Conditional_13_Template, 2, 1)(14, FactTableComponent_Conditional_2_Conditional_9_Conditional_14_Template, 2, 1)(15, FactTableComponent_Conditional_2_Conditional_9_Conditional_15_Template, 2, 1);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(5);
    \u0275\u0275conditional(5, ctx_r2.peekField === "issues" ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(6, ctx_r2.peekField === "contacts" ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(7, ctx_r2.peekField === "tasks" ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(8, ctx_r2.peekField === "doclinks" ? 8 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275conditional(12, ctx_r2.peekField === "issues" ? 12 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(13, ctx_r2.peekField === "contacts" ? 13 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(14, ctx_r2.peekField === "tasks" ? 14 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(15, ctx_r2.peekField === "doclinks" ? 15 : -1);
  }
}
function FactTableComponent_Conditional_2_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17);
    \u0275\u0275element(1, "selected-contact", 128);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("selectedContacts", ctx_r2.contact_list);
  }
}
function FactTableComponent_Conditional_2_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 18);
    \u0275\u0275element(1, "selected-tasks", 129);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("selectedTasks", ctx_r2.task_list);
  }
}
function FactTableComponent_Conditional_2_Conditional_14_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "shared-view", 130);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275property("ishorizontal", true)("hasshadow", false)("head", "Share with my team")("userList", ctx_r2.userList)("nId", ctx_r2.fact.nFSid)("type", "F")("isUpdate", true)("nCaseid", ctx_r2.nCaseid)("viewSelected", true)("enabledEdit", false);
  }
}
function FactTableComponent_Conditional_2_Conditional_14_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(1, 1, "COMMON.LOADING"), " ");
  }
}
function FactTableComponent_Conditional_2_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17);
    \u0275\u0275template(1, FactTableComponent_Conditional_2_Conditional_14_Conditional_1_Template, 1, 10, "shared-view", 130)(2, FactTableComponent_Conditional_2_Conditional_14_Conditional_2_Template, 2, 3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r2.isShareLoading ? 1 : 2);
  }
}
function FactTableComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 9)(2, "div", 10);
    \u0275\u0275repeaterCreate(3, FactTableComponent_Conditional_2_For_4_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div")(6, "div", 11)(7, "div", 12)(8, "div", 13);
    \u0275\u0275template(9, FactTableComponent_Conditional_2_Conditional_9_Template, 16, 8, "div", 14);
    \u0275\u0275elementStart(10, "div", 15)(11, "div", 16);
    \u0275\u0275template(12, FactTableComponent_Conditional_2_Conditional_12_Template, 2, 1, "div", 17)(13, FactTableComponent_Conditional_2_Conditional_13_Template, 2, 1, "div", 18)(14, FactTableComponent_Conditional_2_Conditional_14_Template, 3, 1, "div", 17);
    \u0275\u0275elementEnd()()()()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(5, _c1, ctx_r2.isQFact));
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.headercoloumns);
    \u0275\u0275advance(6);
    \u0275\u0275conditional(9, ctx_r2.peekField && !ctx_r2.showsource ? 9 : -1);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(12, ctx_r2.type == "C" ? 12 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(13, ctx_r2.type == "T" ? 13 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(14, ctx_r2.type == "S" ? 14 : -1);
  }
}
var FactTableComponent = class _FactTableComponent {
  constructor(wsService, cdr, cs, factservice, cf, common, factsheetService, storage) {
    this.wsService = wsService;
    this.cdr = cdr;
    this.cs = cs;
    this.factservice = factservice;
    this.cf = cf;
    this.common = common;
    this.factsheetService = factsheetService;
    this.storage = storage;
    this.isHeader = true;
    this.isQFact = false;
    this.noteSearchText = "";
    this.jTexts = [];
    this.type = FACT_TABLE_CONSTANTS.defaultType;
    this.peekField = null;
    this.up_icon = FACT_TABLE_CONSTANTS.icons.up;
    this.down_icon = FACT_TABLE_CONSTANTS.icons.down;
    this.group_icon = FACT_TABLE_CONSTANTS.icons.group;
    this.defaultSortKeys = FACT_TABLE_CONSTANTS.defaultSortKeys;
    this.headercoloumns = FACT_TABLE_CONSTANTS.headerColumns;
    this.issue_ls = [];
    this.OnEvent = new EventEmitter();
    this.userList = [];
    this.selectedUsers = [];
    this.user_list = [];
    this.contact_list = [];
    this.task_list = [];
    this.factLinks = [];
    this._contactCount = 0;
    this._taskCount = 0;
    this._linksCount = 0;
    this.isEditText = false;
    this.isEmpty = false;
    this.activeSortKey = null;
    this.activeSortDir = null;
    this.dragStartIndex = null;
    this.evsubscription = this.cs.functionCalled$.subscribe((data) => __async(this, null, function* () {
      if (data.type === "SHOW-COLS") {
        this.tablecols = data.tablecols;
        if (this.tablecols?.length) {
          this.syncHeaderWithTableCols();
        }
        this.cdr.detectChanges();
      }
    }));
  }
  // Always return an array for relevanceList for template safety
  get factRelevanceList() {
    if (!this.fact)
      return [];
    const relevanceSet = /* @__PURE__ */ new Set();
    if (this.issue_ls && Array.isArray(this.issue_ls)) {
      this.issue_ls.forEach((issue) => {
        if (issue.cRelevance) {
          relevanceSet.add(issue.cRelevance);
        }
      });
    }
    if (relevanceSet.size > 0) {
      return Array.from(relevanceSet);
    }
    if (typeof this.fact.cRelevance === "string" && this.fact.cRelevance) {
      return [this.fact.cRelevance];
    }
    return [];
  }
  // Return array of unique impacts from all issues
  get factImpactList() {
    if (!this.fact)
      return [];
    const impactMap = /* @__PURE__ */ new Map();
    if (this.issue_ls && Array.isArray(this.issue_ls)) {
      this.issue_ls.forEach((issue) => {
        if (issue.nImpactid) {
          const impactId = Number(issue.nImpactid);
          const currentCount = impactMap.get(impactId) || 0;
          impactMap.set(impactId, currentCount + 1);
        }
      });
    }
    if (impactMap.size > 0) {
      return Array.from(impactMap.entries()).map(([id, count]) => ({ id, count }));
    }
    if (this.fact.nImpactid) {
      return [{ id: Number(this.fact.nImpactid), count: Number(this.fact.nImpactcount) || 1 }];
    }
    return [];
  }
  getSidebarPdfUrl() {
    if (!this.showsource)
      return "";
    return this.cf.senitizeUrl(
      this.showsource.cFilepath || this.showsource.cPath,
      this.showsource.nBundledetailid,
      this.nCaseid,
      false,
      // isFullmode
      null,
      // isLink (highlightModeType)
      1,
      // pageNo
      false,
      // isRealtime
      false,
      // compareMode
      0,
      // compareIndex
      "",
      // linkExplorerMode
      "",
      // linkExplorerType
      null,
      // nRFSid
      null,
      // nRDocid
      null,
      // nRWebid
      true,
      // isMyfile
      "MB",
      // activesectiontype
      this.showsource.nSectionid,
      null,
      // nPresentid
      false,
      // isHost
      "",
      // jFilter
      1
      // lineNo
    );
  }
  ngOnInit() {
    this.initializeComponent();
  }
  initializeComponent() {
    return __async(this, null, function* () {
      this.nUserid = yield this.storage.getUserId();
      if (this.fact) {
        this.jTexts = Array.isArray(this.fact.jTexts) ? [...this.fact.jTexts] : [];
        const firstNonEmpty = this.jTexts.find((t) => {
          if (t === null || t === void 0) {
            return false;
          }
          const s = String(t).trim();
          return !!s;
        });
        if (firstNonEmpty !== void 0) {
          this.jTexts[0] = String(firstNonEmpty);
        }
        const hasNonEmpty = firstNonEmpty !== void 0;
        this.isEmpty = !hasNonEmpty;
        this.fact.cName = this.fact.cName ? this.fact.cName : this.fact.cFilename;
        this.initializeCounts();
      }
    });
  }
  ngOnChanges(changes) {
    if (this.tablecols?.length) {
      this.syncHeaderWithTableCols();
    }
    if (changes["fact"]?.currentValue) {
      this.jTexts = Array.isArray(this.fact?.jTexts) ? [...this.fact.jTexts] : [];
      const firstNonEmpty = this.jTexts.find((t) => {
        if (t === null || t === void 0) {
          return false;
        }
        const s = String(t).trim();
        return !!s;
      });
      if (firstNonEmpty !== void 0) {
        this.jTexts[0] = String(firstNonEmpty);
      }
      const hasNonEmpty = firstNonEmpty !== void 0;
      this.isEmpty = !hasNonEmpty;
      this.fact.cName = this.fact.cName ? this.fact.cName : this.fact.cFilename;
      this.initializeCounts();
    }
    if (changes["contactCount"]) {
      this._contactCount = this.contactCount ?? 0;
    }
    if (changes["taskCount"]) {
      this._taskCount = this.taskCount ?? 0;
    }
    if (changes["linksCount"]) {
      this._linksCount = this.linksCount ?? 0;
    }
  }
  ngOnDestroy() {
    this.evsubscription.unsubscribe();
  }
  initializeCounts() {
    if (this.contactCount === void 0) {
      this._contactCount = 0;
    } else {
      this._contactCount = this.contactCount;
    }
    if (this.taskCount === void 0) {
      this._taskCount = 0;
    } else {
      this._taskCount = this.taskCount;
    }
    if (this.linksCount === void 0) {
      this._linksCount = 0;
    } else {
      this._linksCount = this.linksCount;
    }
  }
  getfactContact() {
    return __async(this, null, function* () {
      this.contact_list = yield this.wsService.getFactContact(this.fact.nFSid);
      this._contactCount = this.contact_list ? this.contact_list.length : 0;
    });
  }
  getfactTask() {
    return __async(this, null, function* () {
      const res = yield this.wsService.getFactTask(this.fact.nFSid);
      this._taskCount = 0;
      this.task_list = res[0] || [];
      this.task_list.forEach((a) => {
        let user = [];
        if (res[1]) {
          user = res[1].filter((b) => b.jTaskid.includes(a.nTaskid));
        }
        a["teamlist"] = user || [];
        this.task_list.forEach((a2) => {
          let remiders = [];
          if (res[2]) {
            const row = res[2].filter((b) => b.nTaskid === a2.nTaskid);
            remiders = row.length ? row[0].jReminders : [];
          }
          a2["jReminders"] = remiders || [];
        });
      });
      this._taskCount = this.task_list ? this.task_list.length : 0;
    });
  }
  getFactLinks() {
    return __async(this, null, function* () {
      this._linksCount = 0;
      this.factLinks = [];
      const res = yield this.factsheetService.getFactLinks(this.fact.nFSid);
      if (res && Array.isArray(res.value)) {
        this.factLinks = res.value;
        this._linksCount = this.factLinks.length;
      }
    });
  }
  // Safely derive counts for contacts, tasks, and links for display
  getContactsCount() {
    return this._contactCount || 0;
  }
  getTasksCount() {
    return this._taskCount || 0;
  }
  getLinksCount() {
    return this._linksCount || 0;
  }
  // Open sidebar peek panels from header cells
  openIssuesPeek() {
    this.peekField = "issues";
    this.cdr.detectChanges();
  }
  openContactsPeek() {
    return __async(this, null, function* () {
      yield this.getfactContact();
      this.peekField = "contacts";
      this.cdr.detectChanges();
    });
  }
  openTasksPeek() {
    return __async(this, null, function* () {
      yield this.getfactTask();
      this.peekField = "tasks";
      this.cdr.detectChanges();
    });
  }
  openDocLinksPeek() {
    this.peekField = "doclinks";
    this.cdr.detectChanges();
  }
  getuser_list() {
    return __async(this, null, function* () {
      this.isShareLoading = true;
      if (!this.userList?.length) {
        this.userList = yield this.common.getMyTeamUsers(this.nCaseid);
      }
      this.selectedUsers = yield this.factservice.getFactShare(this.fact.nFSid);
      this.userList.forEach((f) => f.isSelected = this.selectedUsers.some((m) => m.nUserid === f.nUserid));
      this.factPermissions = yield this.factservice.getFactPermissions(this.fact.nFSid, this.nUserid);
      this.isShareLoading = false;
      this.cdr.detectChanges();
    });
  }
  OnSourceEvent(event, flag) {
    if (event.event === "VIEW-SOURCE") {
      this.OnEvent.emit({ event: "OPEN-PDF-SIDEBAR", data: event.data });
      return;
    }
    this.OnEvent.emit(event);
  }
  closePeek() {
    this.peekField = null;
    this.cdr.detectChanges();
  }
  sortList(x, col) {
    this.OnEvent.emit({ event: "SORT", data: { col, typ: x } });
  }
  // Map workspace table column visibility into header column model
  syncHeaderWithTableCols() {
    if (!this.tablecols?.length) {
      return;
    }
    let mapped = this.headercoloumns.map((col) => {
      const matching = this.tablecols.find((t) => t.id === col.id || t.key === col.key);
      col.isshow = matching ? matching.isshow : false;
      col.order = matching?.order === void 0 ? col.order ?? col.id : matching.order;
      return col;
    });
    mapped = mapped.map((col) => {
      if (col.sortable && !col.sortKey && this.defaultSortKeys[col.key]) {
        col.sortKey = this.defaultSortKeys[col.key];
      }
      return col;
    });
    mapped = mapped.sort((a, b) => {
      const ao = a.order ?? a.id;
      const bo = b.order ?? b.id;
      return ao - bo;
    });
    this.headercoloumns = mapped;
    if (this.isQFact) {
      const qfactKeys = /* @__PURE__ */ new Set(["created", "note", "issues", "impact", "relevance", "source", "actions"]);
      this.headercoloumns = this.headercoloumns.map((col) => {
        if (col.key && !qfactKeys.has(col.key)) {
          col.isshow = false;
        }
        return col;
      });
    }
  }
  onHeaderClick(col) {
    if (!col) {
      return;
    }
    if (!col.sortKey && this.defaultSortKeys[col.key]) {
      col.sortKey = this.defaultSortKeys[col.key];
    }
    if (!col.sortKey) {
      return;
    }
    if (this.activeSortKey === col.sortKey) {
      this.activeSortDir = this.activeSortDir === "asc" ? "desc" : "asc";
    } else {
      this.activeSortKey = col.sortKey;
      this.activeSortDir = "asc";
    }
    const sortType = this.activeSortDir === "asc" ? "A" : "D";
    const sortCol = { nm: "", icon: null, typ: sortType, clmn: col.sortKey };
    this.sortList(sortType, sortCol);
  }
  onHeaderDragStart(event, index) {
    if (!this.isHeader || !event.dataTransfer) {
      return;
    }
    this.dragStartIndex = index;
    event.dataTransfer.effectAllowed = "move";
  }
  onHeaderDragOver(event) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }
  onHeaderDrop(event, dropIndex) {
    event.preventDefault();
    if (this.dragStartIndex === null || this.dragStartIndex === dropIndex) {
      return;
    }
    const cols = [...this.headercoloumns];
    const [moved] = cols.splice(this.dragStartIndex, 1);
    cols.splice(dropIndex, 0, moved);
    this.headercoloumns = cols;
    this.dragStartIndex = null;
    this.cdr.detectChanges();
    if (this.tablecols && Array.isArray(this.tablecols) && this.tablecols.length) {
      const orderByKey = {};
      this.headercoloumns.forEach((c, idx) => {
        if (c.key) {
          orderByKey[c.key] = idx;
        }
      });
      this.tablecols = this.tablecols.map((col) => {
        const key = col?.key ?? null;
        if (key && orderByKey.hasOwnProperty(key)) {
          return __spreadProps(__spreadValues({}, col), { order: orderByKey[key] });
        }
        return col;
      });
      this.cs.callFunction({ type: "SHOW-COLS", tablecols: this.tablecols });
    }
  }
  SaveNote(g) {
    return __async(this, null, function* () {
      if (!g.jUpdatedTexts?.length) {
        g.jUpdatedTexts = g.jTexts || [];
      }
      yield this.factservice.updateFactNote({ nFSid: g.nFSid, jTexts: g.jUpdatedTexts });
      this.OnEvent.emit({ event: "SUBMIT-NOTE", data: g });
      this.isEditText = false;
      this.cdr.detectChanges();
    });
  }
  openToQFect() {
    let page = 1;
    if (this.fact?.jLinktype?.pages?.length) {
      page = this.fact.jLinktype.pages[0];
    } else if (this.fact?.jLinktype?.start) {
      page = this.fact?.jLinktype?.start;
    }
    this.openfile(this.fact.nBundledetailid, page, this.fact.nFSid);
  }
  openfile(nBundledetailid, page, nFSid) {
    this.cf.openHyperLinkFile(nBundledetailid, this.nCaseid, null, null, false, page, null, nFSid);
  }
  addNote() {
    this.jTexts = this.jTexts?.length ? this.jTexts : [""];
    this.isEmpty = false;
    this.isEditText = true;
    this.cdr.detectChanges();
  }
  // Enter note edit mode with the current note value pre-populated
  startEditNote() {
    if (!this.jTexts?.length) {
      if (this.fact?.jTexts?.length) {
        this.jTexts = [...this.fact.jTexts];
      } else if (this.fact?.cFact) {
        this.jTexts = [this.fact.cFact];
      } else {
        this.jTexts = [""];
      }
    }
    this.isEditText = true;
    this.cdr.detectChanges();
  }
  getInitials(c) {
    if (!c) {
      return "";
    }
    const first = c.cFname ? c.cFname.charAt(0) : "";
    const last = c.cLname ? c.cLname.charAt(0) : "";
    return (first + last).toUpperCase();
  }
  getRelevanceColor(relevance) {
    if (!relevance) {
      return "#6b7280";
    }
    const v = relevance.toLowerCase();
    if (v === "critical") {
      return "#ef4444";
    }
    if (v === "high") {
      return "#f59e0b";
    }
    if (v === "medium") {
      return "#10b981";
    }
    if (v === "low") {
      return "#60a5fa";
    }
    return "#6b7280";
  }
  static {
    this.\u0275fac = function FactTableComponent_Factory(t) {
      return new (t || _FactTableComponent)(\u0275\u0275directiveInject(WorkspaceService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(FactService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(FactsheetService), \u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FactTableComponent, selectors: [["facttable"]], inputs: { isHeader: "isHeader", isQFact: "isQFact", nCaseid: "nCaseid", fact: "fact", tablecols: "tablecols", noteSearchText: "noteSearchText", sourceData: "sourceData", issue_ls: "issue_ls", userList: "userList", contactCount: "contactCount", taskCount: "taskCount", linksCount: "linksCount" }, outputs: { OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 2, consts: [["noRelevance", ""], [1, "w-full", "bg-white", "shadow-[0_4px_4px_#00000020]", "border-b", "border-[#e6e6e6]"], [1, "flex", "text-white", "column-wrap", "h-10", "bg-grey", 3, "ngClass"], ["draggable", "true", "tabindex", "0", "role", "button", 1, "hover:!bg-black", "bg-grey", "relative", "columns", "flex", "items-center", 3, "ngClass"], ["draggable", "true", "tabindex", "0", "role", "button", 1, "hover:!bg-black", "bg-grey", "relative", "columns", "flex", "items-center", 3, "dragstart", "dragover", "drop", "click", "keydown.enter", "ngClass"], [1, "flex", "items-center", "text-xs", "!font-normal", "px-3", "w-full"], [1, "flex", "items-center", "gap-2"], [1, "cursor-move", "text-sm", "select-none"], [1, "text-[10px]"], [1, "body"], [1, "flex", "text-xs", "column-wrap", 3, "ngClass"], ["colspan", "6"], [1, "w-full"], [1, "flex", "h-fit"], [1, "fixed", "left-0", "z-20", "grid", "w-full", "h-full", "top-14"], ["colspan", "4", 1, "relative", "flex-1", "min-w-0", "pb-3"], [1, "relative", "overflow-hidden"], [1, "flex", "w-full", "gap-2", "text-xs"], [1, "flex", "w-full", "gap-2", "py-3", "text-xs"], [1, "align-top", "columns", "date"], [1, "pt-3", "pr-3", "pl-3", "pb-0"], [3, "jDate", "showPrefix"], [1, "align-top", "columns", "created"], [1, "align-top", "columns", "type"], [1, "missing-chip"], [1, "columns", "fbox"], [1, "pt-3", "pr-3", "pl-3", "pb-0", "relative", "h-full", 3, "click"], [1, "border-tab", "h-15", "mt-1", "rounded-[10px]", "text-xs", "pt-2.5", "pr-2.5", "pl-2.5", "pb-0", "overflow-auto", "border-2", "relative", "group"], [1, "text-xs", "note-text", 3, "innerHTML"], ["type", "button", 1, "absolute", "top-1", "right-1", "p-1", "bg-blue-600", "text-white", "rounded", "opacity-0", "group-hover:opacity-100", "transition-opacity", "z-50", 3, "click", "matTooltip"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-3", "h-3"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"], [1, "border-tab", "h-15", "mt-1", "rounded-[10px]", "text-xs", "pt-2.5", "pr-2.5", "pl-2.5", "pb-0", "overflow-auto", "border-2", "relative", "group", "bg-white"], [3, "jTextsChange", "jTexts", "type", "nCaseid", "isnotHeader"], [1, "flex", "justify-end", "items-center", "mt-2", "w-full", "gap-2"], ["type", "button", 1, "px-2", "py-1", "bg-green-600", "text-white", "text-xs", "rounded", "hover:bg-green-700", "flex", "items-center", 3, "click", "matTooltip"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M5 13l4 4L19 7"], ["type", "button", 1, "px-2", "py-1", "bg-gray-500", "text-white", "text-xs", "rounded", "hover:bg-gray-600", "flex", "items-center", 3, "click", "matTooltip"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M6 18L18 6M6 6l12 12"], [1, "flex", "items-center", "justify-center", "h-full"], ["type", "button", 1, "px-3", "py-2", "bg-green-600", "text-white", "text-xs", "rounded-md", "hover:bg-green-700", "transition-colors", "flex", "items-center", 3, "click"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-3", "h-3", "mr-1"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M12 4v16m8-8H4"], [1, "align-baseline", "columns", "issues"], [1, "inline-flex", "items-center"], [1, "flex", "flex-col", "border", "border-gray-300", "px-2.5", "py-1.5", "rounded-md", "min-w-[80px]", "max-w-full"], [1, "flex", "items-start", 3, "ngClass"], [1, "rounded-md", "h-3.5", "w-1", "mr-2", 3, "ngStyle"], [1, "text-xs", "font-semibold", "whitespace-normal", "leading-snug"], [1, "align-baseline", "columns", "rel"], [1, "flex", "flex-wrap", "gap-1"], [4, "ngIf", "ngIfElse"], [4, "ngFor", "ngForOf"], [1, "inline-flex", "items-center", "px-2", "py-1", "rounded-full", "text-xs", "font-medium", "text-white", "mr-1", 3, "ngStyle"], [1, "align-baseline", "columns", "imp"], [1, "flex", "items-center", "gap-2", "border", "border-gray-300", "rounded-md", "px-2.5", "py-1.5"], ["alt", "impact icon", 1, "w-4", "h-4", 3, "src"], ["type", "darklight", "addcls", "!py-[1px] !px-[6px] "], [1, "align-baseline", "columns", "source"], [1, "p-3", "pb-0", "flex", "items-center", "w-[180px]", "min-w-[180px]", "max-w-[180px]", 3, "click"], ["viewsourcebtn", "", "mode", "light", 1, "w-full", 3, "OnEvent", "heading", "type", "detail"], [1, "align-baseline", "columns", "contacts", "text-center", "w-full"], [1, "p-3", "pb-0", "w-full"], [1, "cursor-pointer", "link", "contacts", "flex", "items-center", "justify-center", "w-full", "h-full", "py-2", "rounded-md", "transition-colors", "hover:bg-gray-100", "border", "border-transparent", "hover:border-gray-300"], [1, "align-baseline", "columns", "tasks", "text-center", "w-full"], [1, "cursor-pointer", "link", "tasks", "flex", "items-center", "justify-center", "w-full", "h-full", "py-2", "rounded-md", "transition-colors", "hover:bg-gray-100", "border", "border-transparent", "hover:border-gray-300"], [1, "align-baseline", "columns", "doclinks", "text-center", "w-full"], [1, "cursor-pointer", "link", "docs", "flex", "items-center", "justify-center", "w-full", "h-full", "py-2", "rounded-md", "transition-colors", "hover:bg-gray-100", "border", "border-transparent", "hover:border-gray-300"], [1, "align-baseline", "columns", "actions", "text-center"], [1, "p-3", "pb-0"], ["type", "button", "title", "Convert to Fact", 1, "p-2", "bg-blue-600", "text-white", "rounded-md", "hover:bg-blue-700", "transition-colors", 3, "click"], ["width", "24", "height", "24", "viewBox", "0 0 24 24", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M12 5H6C5.46957 5 4.96086 5.21071 4.58579 5.58579C4.21071 5.96086 4 6.46957 4 7V10", "stroke", "currentColor", "stroke-width", "1.5", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M9 8L12 5L9 2", "stroke", "currentColor", "stroke-width", "1.5", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M4 14V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V7C20 6.46957 19.7893 5.96086 19.4142 5.58579C19.0391 5.21071 18.5304 5 18 5H16", "stroke", "currentColor", "stroke-width", "1.5", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M8.82118 16.2383C8.66866 16.2383 8.52238 16.2989 8.41453 16.4067C8.30668 16.5146 8.24609 16.6608 8.24609 16.8134C8.24609 16.9659 8.30668 17.1122 8.41453 17.22C8.52238 17.3279 8.66866 17.3885 8.82118 17.3885H16.8724C17.0249 17.3885 17.1712 17.3279 17.279 17.22C17.3869 17.1122 17.4475 16.9659 17.4475 16.8134C17.4475 16.6608 17.3869 16.5146 17.279 16.4067C17.1712 16.2989 17.0249 16.2383 16.8724 16.2383H8.82118Z", "fill", "currentColor"], ["d", "M12.2695 11.0634C12.2695 10.9108 12.3301 10.7646 12.438 10.6567C12.5458 10.5489 12.6921 10.4883 12.8446 10.4883H16.8702C17.0227 10.4883 17.169 10.5489 17.2769 10.6567C17.3847 10.7646 17.4453 10.9108 17.4453 11.0634C17.4453 11.2159 17.3847 11.3622 17.2769 11.47C17.169 11.5779 17.0227 11.6385 16.8702 11.6385H12.8446C12.6921 11.6385 12.5458 11.5779 12.438 11.47C12.3301 11.3622 12.2695 11.2159 12.2695 11.0634Z", "fill", "currentColor"], ["d", "M11.832 8.18837C11.832 8.03585 11.8926 7.88957 12.0005 7.78172C12.1083 7.67387 12.2546 7.61328 12.4071 7.61328H16.8726C17.0251 7.61328 17.1714 7.67387 17.2792 7.78172C17.3871 7.88957 17.4476 8.03585 17.4476 8.18837C17.4476 8.34089 17.3871 8.48717 17.2792 8.59502C17.1714 8.70287 17.0251 8.76345 16.8726 8.76345H12.4071C12.2546 8.76345 12.1083 8.70287 12.0005 8.59502C11.8926 8.48717 11.832 8.34089 11.832 8.18837Z", "fill", "currentColor"], ["d", "M12.2695 13.9384C12.2695 13.7858 12.3301 13.6396 12.438 13.5317C12.5458 13.4239 12.6921 13.3633 12.8446 13.3633H16.8702C17.0227 13.3633 17.169 13.4239 17.2769 13.5317C17.3847 13.6396 17.4453 13.7858 17.4453 13.9384C17.4453 14.0909 17.3847 14.2372 17.2769 14.345C17.169 14.4529 17.0227 14.5135 16.8702 14.5135H12.8446C12.6921 14.5135 12.5458 14.4529 12.438 14.345C12.3301 14.2372 12.2695 14.0909 12.2695 13.9384Z", "fill", "currentColor"], ["d", "M11.1211 12.498C11.1211 12.8379 11.0542 13.1744 10.9241 13.4884C10.794 13.8024 10.6034 14.0877 10.3631 14.328C10.1228 14.5683 9.83752 14.7589 9.52355 14.8889C9.20957 15.019 8.87305 15.0859 8.5332 15.0859C8.19336 15.0859 7.85684 15.019 7.54286 14.8889C7.22888 14.7589 6.9436 14.5683 6.70329 14.328C6.46298 14.0877 6.27236 13.8024 6.1423 13.4884C6.01225 13.1744 5.94531 12.8379 5.94531 12.498C5.94531 11.8117 6.21796 11.1535 6.70329 10.6681C7.18861 10.1828 7.84685 9.91016 8.5332 9.91016C9.21955 9.91016 9.87779 10.1828 10.3631 10.6681C10.8484 11.1535 11.1211 11.8117 11.1211 12.498V12.498ZM8.82075 11.3479C8.82075 11.2716 8.79045 11.1985 8.73653 11.1445C8.6826 11.0906 8.60946 11.0603 8.5332 11.0603C8.45694 11.0603 8.3838 11.0906 8.32988 11.1445C8.27595 11.1985 8.24566 11.2716 8.24566 11.3479V12.2105H7.38303C7.30677 12.2105 7.23363 12.2408 7.17971 12.2947C7.12578 12.3486 7.09549 12.4218 7.09549 12.498C7.09549 12.5743 7.12578 12.6474 7.17971 12.7014C7.23363 12.7553 7.30677 12.7856 7.38303 12.7856H8.24566V13.6482C8.24566 13.7245 8.27595 13.7976 8.32988 13.8515C8.3838 13.9055 8.45694 13.9358 8.5332 13.9358C8.60946 13.9358 8.6826 13.9055 8.73653 13.8515C8.79045 13.7976 8.82075 13.7245 8.82075 13.6482V12.7856H9.68338C9.75964 12.7856 9.83277 12.7553 9.8867 12.7014C9.94062 12.6474 9.97092 12.5743 9.97092 12.498C9.97092 12.4218 9.94062 12.3486 9.8867 12.2947C9.83277 12.2408 9.75964 12.2105 9.68338 12.2105H8.82075V11.3479Z", "fill", "currentColor"], [1, "absolute", "top-0", "left-0", "z-10", "w-full", "h-full", "bg-black/60", 3, "click"], [1, "relative", "z-20", "ml-auto", "mr-0", "mt-6", "h-fit", "max-h-[80vh]", "w-[380px]", "bg-white", "rounded-l-base", "shadow-[0_4px_12px_rgba(0,0,0,0.25)]", "overflow-hidden", "flex", "flex-col"], [1, "flex", "items-center", "justify-between", "px-4", "py-3", "border-b", "border-neutral-200"], [1, "text-sm", "font-semibold", "text-gray-900"], ["type", "button", 1, "text-xs", "text-gray-500", "hover:text-gray-800", 3, "click"], [1, "flex-1", "overflow-auto", "p-4", "space-y-3", "text-xs"], [1, "space-y-2"], [1, "font-semibold", "min-w-20", "max-w-full", "flex", "items-center", "border", "border-tab", "px-2.5", "py-1.5", "rounded-base"], [1, "flex", "gap-2.5", "items-center", "justify-between", "w-full"], [1, "flex", "items-center", "gap-1"], [1, "rounded-base", "h-3.5", "w-1", "bg-red-400", 3, "ngStyle"], [1, "truncate"], [1, "flex", "items-center", "gap-2", "flex-shrink-0"], ["type", "light", 3, "addcls"], [3, "src"], [1, "p-6", "bg-gray-50", "border", "border-gray-200", "rounded-lg", "text-center"], [1, "text-sm", "font-semibold", "text-gray-900", "mb-1"], [1, "text-xs", "text-gray-500"], [1, "space-y-3"], [1, "p-4", "bg-gray-50", "border", "border-gray-200", "rounded-lg", "hover:bg-gray-100", "transition-colors"], [1, "flex", "items-center", "gap-3", "mb-3"], [1, "w-12", "h-12", "rounded-full", "bg-blue-100", "flex", "items-center", "justify-center", "text-sm", "font-semibold", "text-gray-700"], [1, "flex-1"], [1, "text-xs", "text-gray-600"], [1, "text-right"], [1, "inline-flex", "items-center", "px-2", "py-1", "rounded-full", "text-[11px]", "font-medium", 3, "ngClass"], [1, "flex", "items-center", "justify-between", "text-[11px]", "text-gray-600"], [1, "w-16", "h-16", "rounded-full", "bg-gray-200", "flex", "items-center", "justify-center", "mx-auto", "mb-3", "text-gray-400"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-8", "h-8"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"], [1, "w-10", "h-10", "rounded-full", "bg-blue-100", "flex", "items-center", "justify-center", "text-blue-600"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-5", "h-5"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"], [1, "text-sm", "font-semibold", "text-gray-900", "truncate"], [1, "text-[11px]", "text-gray-600", "truncate"], [1, "space-y-1", "text-[11px]", "text-gray-700"], [1, "flex", "items-center", "justify-between"], [1, "font-medium"], [1, "w-10", "h-10", "rounded-full", "bg-purple-100", "flex", "items-center", "justify-center", "text-purple-600"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"], [1, "text-[11px]", "text-gray-600"], [1, "space-y-2", "text-[11px]"], [1, "text-gray-700"], [1, "font-mono", "bg-white", "px-2", "py-1", "rounded", "border", "text-gray-900"], [1, "mt-3", "pt-3", "border-t", "border-gray-200"], ["type", "button", 1, "w-full", "px-3", "py-2", "bg-purple-600", "text-white", "text-xs", "rounded-md", "hover:bg-purple-700", "transition-colors", "flex", "items-center", "justify-center", "gap-2", 3, "click"], ["fill", "none", "stroke", "currentColor", "viewBox", "0 0 24 24", 1, "w-4", "h-4"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"], [1, "relative", "flex", "-left-5", 3, "selectedContacts"], [1, "flex", "flex-col", "w-full", "gap-3", 3, "selectedTasks"], [1, "w-full", 3, "ishorizontal", "hasshadow", "head", "userList", "nId", "type", "isUpdate", "nCaseid", "viewSelected", "enabledEdit"]], template: function FactTableComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275template(1, FactTableComponent_Conditional_1_Template, 4, 3, "header")(2, FactTableComponent_Conditional_2_Template, 15, 7, "div");
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.isHeader ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.fact ? 2 : -1);
      }
    }, dependencies: [
      CommonModule,
      NgClass,
      NgForOf,
      NgIf,
      NgStyle,
      DatePipe,
      BadgeComponent,
      SourceCardComponent,
      SharedViewComponent,
      SelectedContactComponent,
      SelectedTasksComponent,
      MatMenuModule,
      MatTooltipModule,
      MatTooltip,
      DateShowComponent,
      HighlightPipe,
      TranslateModule,
      TranslatePipe
    ], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n  overflow-x: hidden;\n}\nheader[_ngcontent-%COMP%]   .columns[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns[_ngcontent-%COMP%] {\n  box-sizing: border-box;\n  overflow: hidden;\n  flex: 1 0 auto;\n}\nheader[_ngcontent-%COMP%]   .columns.date[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.date[_ngcontent-%COMP%] {\n  width: 100px;\n  flex: 1 0 100px;\n}\nheader[_ngcontent-%COMP%]   .columns.created[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.created[_ngcontent-%COMP%] {\n  width: 100px;\n  flex: 1 0 100px;\n}\nheader[_ngcontent-%COMP%]   .columns.type[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.type[_ngcontent-%COMP%] {\n  width: 120px;\n  flex: 1 0 120px;\n}\nheader[_ngcontent-%COMP%]   .columns.fbox[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.fbox[_ngcontent-%COMP%] {\n  width: 380px;\n  flex: 0 0 380px;\n}\nheader[_ngcontent-%COMP%]   .columns.fbox[_ngcontent-%COMP%]   .border-tab[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.fbox[_ngcontent-%COMP%]   .border-tab[_ngcontent-%COMP%] {\n  border-radius: 10px;\n  width: 100%;\n}\nheader[_ngcontent-%COMP%]   .columns.issues[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.issues[_ngcontent-%COMP%] {\n  width: 190px;\n  flex: 1 0 190px;\n}\nheader[_ngcontent-%COMP%]   .columns.rel[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.rel[_ngcontent-%COMP%] {\n  width: 80px;\n  flex: 1 0 80px;\n}\nheader[_ngcontent-%COMP%]   .columns.imp[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.imp[_ngcontent-%COMP%] {\n  width: 80px;\n  flex: 1 0 80px;\n}\nheader[_ngcontent-%COMP%]   .columns.source[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.source[_ngcontent-%COMP%] {\n  width: 180px;\n  flex: 1 0 180px;\n}\nheader[_ngcontent-%COMP%]   .columns.contacts[_ngcontent-%COMP%], header[_ngcontent-%COMP%]   .columns.tasks[_ngcontent-%COMP%], header[_ngcontent-%COMP%]   .columns.doclinks[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.contacts[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.tasks[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.doclinks[_ngcontent-%COMP%] {\n  width: 80px;\n  flex: 0 0 80px;\n  text-align: center;\n}\nheader[_ngcontent-%COMP%]   .columns.actions[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.actions[_ngcontent-%COMP%] {\n  width: 100px;\n  flex: 0 0 100px;\n}\n.body[_ngcontent-%COMP%]   .columns[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n}\n.body[_ngcontent-%COMP%]   .columns.fbox[_ngcontent-%COMP%] {\n  display: block;\n}\n.body[_ngcontent-%COMP%]   .columns.align-top[_ngcontent-%COMP%], .body[_ngcontent-%COMP%]   .columns.align-baseline[_ngcontent-%COMP%] {\n  align-items: center;\n}\n.column-wrap.isfull[_ngcontent-%COMP%]   .source[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.column-wrap.isfull.contacts[_ngcontent-%COMP%], .column-wrap.isfull.tasks[_ngcontent-%COMP%], .column-wrap.isfull.doclinks[_ngcontent-%COMP%], .column-wrap.isfull.actions[_ngcontent-%COMP%] {\n  min-width: 80px;\n  text-align: center;\n}\n.column-wrap.isfull[_ngcontent-%COMP%]   .rel[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.column-wrap.isfull[_ngcontent-%COMP%]   .imp[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.column-wrap.isfull[_ngcontent-%COMP%]   .type[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.column-wrap.isfull[_ngcontent-%COMP%]   .date[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.fact-links-panel[_ngcontent-%COMP%] {\n  box-sizing: border-box;\n  width: 350px;\n  min-width: 350px;\n  max-width: 350px;\n}\n.missing-chip[_ngcontent-%COMP%] {\n  background-color: #f3f4f6;\n  color: #6b7280;\n  padding: 4px 8px;\n  border-radius: 6px;\n  font-size: 10px;\n  font-weight: 500;\n  border: 1px solid #d1d5db;\n  display: inline-block;\n  text-align: center;\n  min-width: 40px;\n}\n.note-text[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  text-align: justify;\n  text-justify: inter-word;\n}\n/*# sourceMappingURL=fact-table.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FactTableComponent, { className: "FactTableComponent", filePath: "src\\app\\shared\\components\\fact-table\\fact-table.component.ts", lineNumber: 42 });
})();

export {
  FactTableComponent
};
//# sourceMappingURL=chunk-JZJLDIAI.js.map
