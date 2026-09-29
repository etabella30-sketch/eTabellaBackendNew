import {
  BadgeComponent
} from "./chunk-3SO7BHVN.js";
import {
  CommonModule,
  NgForOf,
  NgIf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/issues/selected-issues/selected-issues.component.ts
var _c0 = (a0) => ({ "background": a0 });
function SelectedIssuesComponent_For_2_Conditional_1_Template(rf, ctx) {
}
function SelectedIssuesComponent_For_2_div_2_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "badge", 9);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const s_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("addcls", "!py-px px-1 !font-bold ");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(s_r1.cRelevance);
  }
}
function SelectedIssuesComponent_For_2_div_2_ng_template_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 10);
    \u0275\u0275text(1, "-");
    \u0275\u0275elementEnd();
  }
}
function SelectedIssuesComponent_For_2_div_2_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "img", 11);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const s_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("src", "assets/icons/impact/" + s_r1.nImpactid + ".png", \u0275\u0275sanitizeUrl);
  }
}
function SelectedIssuesComponent_For_2_div_2_ng_template_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1, "-");
    \u0275\u0275elementEnd();
  }
}
function SelectedIssuesComponent_For_2_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 3)(2, "div", 4);
    \u0275\u0275element(3, "span", 5);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 6);
    \u0275\u0275template(6, SelectedIssuesComponent_For_2_div_2_ng_container_6_Template, 3, 2, "ng-container", 7)(7, SelectedIssuesComponent_For_2_div_2_ng_template_7_Template, 2, 0, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 8);
    \u0275\u0275template(10, SelectedIssuesComponent_For_2_div_2_ng_container_10_Template, 2, 1, "ng-container", 7)(11, SelectedIssuesComponent_For_2_div_2_ng_template_11_Template, 2, 0, "ng-template", null, 1, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const s_r1 = ctx.$implicit;
    const noRelevance_r2 = \u0275\u0275reference(8);
    const noImpact_r3 = \u0275\u0275reference(12);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(6, _c0, "#" + s_r1.cColor));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", s_r1.cIName, " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", s_r1.cRelevance)("ngIfElse", noRelevance_r2);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", s_r1.nImpactid > 0)("ngIfElse", noImpact_r3);
  }
}
function SelectedIssuesComponent_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275template(1, SelectedIssuesComponent_For_2_Conditional_1_Template, 0, 0)(2, SelectedIssuesComponent_For_2_div_2_Template, 13, 8, "div", 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r4 = ctx.$implicit;
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r4.viewmode == "F" ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", c_r4.sublist);
  }
}
var SelectedIssuesComponent = class _SelectedIssuesComponent {
  constructor() {
    this.viewmode = "F";
    this.issueList = [];
    this.gropuIssueList = [];
  }
  ngOnChanges(changes) {
    if (changes["issueList"]) {
      this.groupIssues();
    }
  }
  ngOnInit() {
    this.groupIssues();
  }
  groupIssues() {
    if (this.issueList) {
      const groupedIssueList = Object.values(this.issueList.reduce((acc, item) => {
        const { nICid, cCategory } = item;
        if (!acc[nICid]) {
          acc[nICid] = {
            nICid,
            cCategory,
            sublist: []
          };
        }
        acc[nICid].sublist.push(item);
        return acc;
      }, {}));
      this.gropuIssueList = groupedIssueList;
    }
  }
  static {
    this.\u0275fac = function SelectedIssuesComponent_Factory(t) {
      return new (t || _SelectedIssuesComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SelectedIssuesComponent, selectors: [["selected-issues"]], inputs: { viewmode: "viewmode", issueList: "issueList" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 0, consts: [["noRelevance", ""], ["noImpact", ""], [4, "ngFor", "ngForOf"], [1, "grid", "grid-cols-12", "my-2", "last:mb-0", "text-xs"], [1, "col-span-6", "flex", "items-center", "gap-2", "px-1"], [1, "rounded-base", "h-3.5", "w-1", 3, "ngStyle"], [1, "col-span-3", "px-1", "flex"], [4, "ngIf", "ngIfElse"], [1, "col-span-3", "px-1"], ["type", "light", 3, "addcls"], [1, "ps-4"], [3, "src"], [1, "ps-2"]], template: function SelectedIssuesComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div");
        \u0275\u0275repeaterCreate(1, SelectedIssuesComponent_For_2_Template, 3, 2, "div", null, \u0275\u0275repeaterTrackByIdentity);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.gropuIssueList);
      }
    }, dependencies: [CommonModule, NgForOf, NgIf, NgStyle, BadgeComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SelectedIssuesComponent, { className: "SelectedIssuesComponent", filePath: "src\\app\\shared\\components\\issues\\selected-issues\\selected-issues.component.ts", lineNumber: 13 });
})();

export {
  SelectedIssuesComponent
};
//# sourceMappingURL=chunk-MW4HJFH4.js.map
