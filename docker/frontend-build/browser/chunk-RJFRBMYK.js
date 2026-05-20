import {
  ContactService
} from "./chunk-5HHWKW4L.js";
import {
  BadgeComponent
} from "./chunk-3SO7BHVN.js";
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
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
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
  ɵɵpureFunction2,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/contacts/contactdetail/contactdetail.component.ts
var _c0 = (a0, a1) => ({ "gap-8.5 mt-8.5": a0, "gap-4": a1 });
function ContactdetailComponent_Conditional_1_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "btn", 13);
    \u0275\u0275element(1, "icon", 20);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const delete_r3 = \u0275\u0275reference(8);
    \u0275\u0275property("square", true)("matMenuTriggerFor", delete_r3);
  }
}
function ContactdetailComponent_Conditional_1_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 21);
    \u0275\u0275listener("click", function ContactdetailComponent_Conditional_1_Conditional_6_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.edit());
    });
    \u0275\u0275element(1, "icon", 22);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("square", true);
  }
}
function ContactdetailComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "span", 10);
    \u0275\u0275listener("click", function ContactdetailComponent_Conditional_1_Template_span_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.close());
    });
    \u0275\u0275element(2, "icon", 11);
    \u0275\u0275text(3, " Detail ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 12);
    \u0275\u0275template(5, ContactdetailComponent_Conditional_1_Conditional_5_Template, 2, 2, "btn", 13)(6, ContactdetailComponent_Conditional_1_Conditional_6_Template, 2, 1, "btn", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "mat-menu", 15, 0)(9, "div")(10, "h6", 16);
    \u0275\u0275text(11, "Confirm Delete ?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "div", 17)(13, "btn", 18);
    \u0275\u0275listener("click", function ContactdetailComponent_Conditional_1_Template_btn_click_13_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.deleteContact());
    });
    \u0275\u0275text(14, "Delete");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "btn", 19);
    \u0275\u0275text(16, "cancel");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275conditional(5, ctx_r1.canDelete ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(6, ctx_r1.canEdit ? 6 : -1);
  }
}
function ContactdetailComponent_Conditional_3_span_5_span_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "|");
    \u0275\u0275elementEnd();
  }
}
function ContactdetailComponent_Conditional_3_span_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 28);
    \u0275\u0275text(1);
    \u0275\u0275template(2, ContactdetailComponent_Conditional_3_span_5_span_2_Template, 2, 0, "span", 7);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.detail == null ? null : ctx_r1.detail.cRole, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.detail == null ? null : ctx_r1.detail.cRole) && (ctx_r1.detail == null ? null : ctx_r1.detail.cCompany));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.detail == null ? null : ctx_r1.detail.cCompany, " ");
  }
}
function ContactdetailComponent_Conditional_3_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 27)(1, "div", 29)(2, "btn", 30);
    \u0275\u0275listener("click", function ContactdetailComponent_Conditional_3_Conditional_6_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.viewfacts());
    });
    \u0275\u0275element(3, "icon", 31);
    \u0275\u0275elementStart(4, "badge", 32);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275property("square", true);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate((ctx_r1.detail == null ? null : ctx_r1.detail.nTotalfacts) ? ctx_r1.detail == null ? null : ctx_r1.detail.nTotalfacts : 0);
  }
}
function ContactdetailComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275element(1, "avtr", 23);
    \u0275\u0275elementStart(2, "div", 24)(3, "span", 25);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, ContactdetailComponent_Conditional_3_span_5_Template, 4, 3, "span", 26)(6, ContactdetailComponent_Conditional_3_Conditional_6_Template, 6, 2, "div", 27);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("detail", ctx_r1.detail)("sourcePath", "contacts/");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", ctx_r1.detail == null ? null : ctx_r1.detail.cKey, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r1.detail == null ? null : ctx_r1.detail.cRole) || (ctx_r1.detail == null ? null : ctx_r1.detail.cCompany));
    \u0275\u0275advance();
    \u0275\u0275conditional(6, (ctx_r1.detail == null ? null : ctx_r1.detail.nTotalfacts) > 0 ? 6 : -1);
  }
}
function ContactdetailComponent_span_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function ContactdetailComponent_span_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.detail == null ? null : ctx_r1.detail.cPartyName);
  }
}
function ContactdetailComponent_span_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.detail == null ? null : ctx_r1.detail.cOccupation);
  }
}
function ContactdetailComponent_span_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function ContactdetailComponent_span_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.detail == null ? null : ctx_r1.detail.cEmail);
  }
}
function ContactdetailComponent_span_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function ContactdetailComponent_Conditional_17_span_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.detail == null ? null : ctx_r1.detail.cCompany);
  }
}
function ContactdetailComponent_Conditional_17_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "\u2212");
    \u0275\u0275elementEnd();
  }
}
function ContactdetailComponent_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 6);
    \u0275\u0275text(1, "Company ");
    \u0275\u0275template(2, ContactdetailComponent_Conditional_17_span_2_Template, 2, 1, "span", 7)(3, ContactdetailComponent_Conditional_17_span_3_Template, 2, 0, "span", 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.detail == null ? null : ctx_r1.detail.cCompany);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !(ctx_r1.detail == null ? null : ctx_r1.detail.cCompany));
  }
}
function ContactdetailComponent_span_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 33);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.detail == null ? null : ctx_r1.detail.cNote, " ");
  }
}
function ContactdetailComponent_span_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, " \u2212 ");
    \u0275\u0275elementEnd();
  }
}
var ContactdetailComponent = class _ContactdetailComponent {
  constructor(dialogRef, dialogData, contactService, cdr, cf) {
    this.dialogRef = dialogRef;
    this.dialogData = dialogData;
    this.contactService = contactService;
    this.cdr = cdr;
    this.cf = cf;
    this.onlydetail = false;
    this.OnEvent = new EventEmitter();
    if (this.dialogData) {
      this.detail = this.dialogData.detail;
      this.onlydetail = this.dialogData.onlydetail || false;
      this.nContactid = this.dialogData.nContactid;
    }
  }
  ngOnInit() {
    console.log("ngOnInit - detail:", this.detail);
    console.log("ngOnInit - onlydetail:", this.onlydetail);
    this.initializeData();
  }
  ngOnChanges(changes) {
    console.log("ngOnChanges - changes:", changes);
    if (changes["detail"]) {
      console.log("detail changed:", this.detail);
      this.initializeData();
    }
  }
  initializeData() {
    if (this.detail) {
      this.nContactid = this.detail.nContactid;
    } else if (this.nContactid) {
      this.getContactDetail();
    }
  }
  getContactDetail() {
    this.contactService.getContactDetail(this.nContactid).then((res) => {
      this.detail = res;
      this.cdr.detectChanges();
    });
  }
  edit() {
    this.OnEvent.emit({ event: "EDIT", data: { nContactid: this.nContactid } });
    if (this.dialogRef) {
      this.dialogRef.close("EDIT");
    }
  }
  viewfacts() {
    if (!this.nCaseid)
      return;
    this.cf.goto("myfiles/workspace", { id: this.nCaseid, tab: "C" });
  }
  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
  deleteContact() {
    this.OnEvent.emit({ event: "DELETE", data: { nContactid: this.nContactid } });
    if (this.dialogRef) {
      this.dialogRef.close("DELETE");
    }
  }
  static {
    this.\u0275fac = function ContactdetailComponent_Factory(t) {
      return new (t || _ContactdetailComponent)(\u0275\u0275directiveInject(MatDialogRef, 8), \u0275\u0275directiveInject(MAT_DIALOG_DATA, 8), \u0275\u0275directiveInject(ContactService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommonfunctionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContactdetailComponent, selectors: [["app-contactdetail"]], inputs: { detail: "detail", onlydetail: "onlydetail", nContactid: "nContactid", nCaseid: "nCaseid", canEdit: "canEdit", canDelete: "canDelete" }, outputs: { OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 22, vars: 15, consts: [["delete", "matMenu"], [1, "flex", "flex-col", "h-full"], [1, "text-lg", "font-semibold", "items-center", "gap-2", "flex", "s", "p-5"], [1, "h-full", "overflow-auto", "px-5", "pb-5"], [1, "rounded-base", "bg-grey", "p-2.5", "text-white", "flex", "items-center", "gap-2.5"], [1, "flex", "flex-col", "[&>h6]:text-xs", "[&>h6]:flex", "[&>h6]:justify-between", "[&>h6]", 3, "ngClass"], [1, "[&>span]:w-4/6", "[&>span]:pb-2", "[&>span]:border-b-grey/50", "[&>span]:border-b"], [4, "ngIf"], [1, "[&>span]:w-4/6", "[&>span]:pb-2", "[&>span]:border-b-grey/50", "[&>span]:border-b", "[&>span]:truncate"], ["class", "brak-word", 4, "ngIf"], [1, "flex", "items-center", "gap-1", 3, "click"], ["name", "chvy", 1, "text-base"], [1, "ms-auto", "flex", "items-center", "gap-2"], ["mode", "outlined", 1, "button", "square", "white", "bord", 3, "square", "matMenuTriggerFor"], ["mode", "outlined", 1, "button", "square", "white", "bord", 3, "square"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click"], ["mode", "dark"], ["name", "delete", 1, "text-base"], ["mode", "outlined", 1, "button", "square", "white", "bord", 3, "click", "square"], ["name", "edit", 1, "text-base"], ["size", "2xl", 3, "detail", "sourcePath"], [1, "flex", "flex-col", "text-xs"], [1, "titleN", "text-white", "bold", "mb-1"], ["class", "titleN text-white ", 4, "ngIf"], [1, "workover", "mb-0", "height-fit"], [1, "titleN", "text-white"], [1, "d-flex", "gap-2"], ["mode", "white", "addcls", "hover:!bg-white hover:text-grey", 1, "button", "white", "c-pointer", "mt-2", 3, "click"], ["name", "fact", "type", "indicn"], ["type", "dark", 3, "square"], [1, "brak-word"]], template: function ContactdetailComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275template(1, ContactdetailComponent_Conditional_1_Template, 17, 2, "div", 2);
        \u0275\u0275elementStart(2, "div", 3);
        \u0275\u0275template(3, ContactdetailComponent_Conditional_3_Template, 7, 5, "div", 4);
        \u0275\u0275elementStart(4, "div", 5)(5, "h6", 6);
        \u0275\u0275text(6, " Party ");
        \u0275\u0275template(7, ContactdetailComponent_span_7_Template, 2, 0, "span", 7)(8, ContactdetailComponent_span_8_Template, 2, 1, "span", 7);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "h6", 8);
        \u0275\u0275text(10, " Occupation ");
        \u0275\u0275template(11, ContactdetailComponent_span_11_Template, 2, 1, "span", 7)(12, ContactdetailComponent_span_12_Template, 2, 0, "span", 7);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "h6", 8);
        \u0275\u0275text(14, " Email ");
        \u0275\u0275template(15, ContactdetailComponent_span_15_Template, 2, 1, "span", 7)(16, ContactdetailComponent_span_16_Template, 2, 0, "span", 7);
        \u0275\u0275elementEnd();
        \u0275\u0275template(17, ContactdetailComponent_Conditional_17_Template, 4, 2, "h6", 6);
        \u0275\u0275elementStart(18, "h6", 6);
        \u0275\u0275text(19, "Note ");
        \u0275\u0275template(20, ContactdetailComponent_span_20_Template, 2, 1, "span", 9)(21, ContactdetailComponent_span_21_Template, 2, 0, "span", 7);
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275conditional(1, !ctx.onlydetail ? 1 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(3, !ctx.onlydetail ? 3 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(12, _c0, !ctx.onlydetail, ctx.onlydetail));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", !(ctx.detail == null ? null : ctx.detail.cPartyName));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.detail == null ? null : ctx.detail.cPartyName);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.detail == null ? null : ctx.detail.cOccupation);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !(ctx.detail == null ? null : ctx.detail.cOccupation));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.detail == null ? null : ctx.detail.cEmail);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !(ctx.detail == null ? null : ctx.detail.cEmail));
        \u0275\u0275advance();
        \u0275\u0275conditional(17, ctx.onlydetail ? 17 : -1);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.detail == null ? null : ctx.detail.cNote);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !(ctx.detail == null ? null : ctx.detail.cNote));
      }
    }, dependencies: [CommonModule, NgClass, NgIf, IconComponent, ButtonComponent, AvatarComponent, BadgeComponent, MatMenuModule, MatMenu, MatMenuTrigger] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContactdetailComponent, { className: "ContactdetailComponent", filePath: "src\\app\\shared\\components\\contacts\\contactdetail\\contactdetail.component.ts", lineNumber: 21 });
})();

export {
  ContactdetailComponent
};
//# sourceMappingURL=chunk-RJFRBMYK.js.map
