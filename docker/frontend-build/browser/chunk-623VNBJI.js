import {
  ContactFormComponent
} from "./chunk-KKQSQEUN.js";
import {
  ContactdetailComponent
} from "./chunk-RJFRBMYK.js";
import {
  ContactService
} from "./chunk-5HHWKW4L.js";
import {
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatDialog
} from "./chunk-UVEQGFJV.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
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
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/contacts/selected-contact/selected-contact.component.ts
var _forTrack0 = ($index, $item) => $item.nContactid;
var _c0 = (a0) => ({ "shadow-base hover:shadow-[0px_2px_9px_#94949440]": a0 });
var _c1 = (a0, a1) => ({ cFname: a0, cLname: a1, cProfile: "" });
var _c2 = (a0) => ({ "!ms-0": a0 });
function SelectedContactComponent_For_1_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 4);
  }
}
function SelectedContactComponent_For_1_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r2.cRole);
  }
}
function SelectedContactComponent_For_1_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r2.cCompany);
  }
}
function SelectedContactComponent_For_1_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r2.cEmail);
  }
}
function SelectedContactComponent_For_1_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 9);
    \u0275\u0275listener("click", function SelectedContactComponent_For_1_Conditional_9_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.editContact(x_r2));
    });
    \u0275\u0275element(1, "icon", 10);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("square", true);
  }
}
function SelectedContactComponent_For_1_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 11);
    \u0275\u0275listener("click", function SelectedContactComponent_For_1_Conditional_10_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r5 = \u0275\u0275nextContext();
      const x_r2 = ctx_r5.$implicit;
      const $index_r7 = ctx_r5.$index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.deleteContact(x_r2, $index_r7));
    });
    \u0275\u0275element(1, "icon", 12);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(2, _c2, ctx_r2.canEdit))("square", true);
  }
}
function SelectedContactComponent_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275element(1, "avtr", 1);
    \u0275\u0275elementStart(2, "div", 2)(3, "span", 3);
    \u0275\u0275listener("click", function SelectedContactComponent_For_1_Template_span_click_3_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.contactDetail(x_r2));
    });
    \u0275\u0275text(4);
    \u0275\u0275template(5, SelectedContactComponent_For_1_Conditional_5_Template, 1, 0, "icon", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, SelectedContactComponent_For_1_Conditional_6_Template, 2, 1, "span", 5)(7, SelectedContactComponent_For_1_Conditional_7_Template, 2, 1, "span", 5)(8, SelectedContactComponent_For_1_Conditional_8_Template, 2, 1, "span", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275template(9, SelectedContactComponent_For_1_Conditional_9_Template, 2, 1, "btn", 7)(10, SelectedContactComponent_For_1_Conditional_10_Template, 2, 4, "btn", 8);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(10, _c0, ctx_r2.hasshadow));
    \u0275\u0275advance();
    \u0275\u0275property("detail", \u0275\u0275pureFunction2(12, _c1, x_r2.cFname, x_r2.cLname));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", x_r2.cFname, " ", x_r2.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(5, ctx_r2.showinfo ? 5 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(6, x_r2.cRole ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(7, x_r2.cCompany ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(8, (x_r2 == null ? null : x_r2.cEmail) ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(9, ctx_r2.canEdit ? 9 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(10, ctx_r2.canDelete ? 10 : -1);
  }
}
var SelectedContactComponent = class _SelectedContactComponent {
  constructor(cdr, dialog, CService) {
    this.cdr = cdr;
    this.dialog = dialog;
    this.CService = CService;
    this.deletebtn = false;
    this.showinfo = false;
    this.largeView = false;
    this.canDelete = false;
    this.hasshadow = false;
    this.canEdit = false;
    this.ismyfiles = false;
    this.hasBackdrop = false;
    this.OnEvent = new EventEmitter();
  }
  deleteContact(x, index) {
    this.selectedContacts.splice(index, 1);
    this.OnEvent.emit({ event: "DELETE", data: { nContactid: x.nContactid } });
  }
  ngOnChanges(changes) {
    if (changes["selectedContacts"]) {
      this.cdr.detectChanges();
    }
  }
  edit(x) {
    this.OnEvent.emit({ event: "EDIT", data: { nContactid: x.nContactid } });
  }
  editContact(x) {
    return __async(this, null, function* () {
      if (this.dialogRef)
        return;
      let edit_detail = yield this.CService.getContactDetail(x.nContactid);
      this.dialogRef = this.dialog.open(ContactFormComponent, {
        width: !this.ismyfiles ? "440px" : "436px",
        height: !this.ismyfiles ? "calc(100vh - 56px)" : "calc(100% - 220px)",
        position: !this.ismyfiles ? { right: "0vh", top: "56px" } : { right: "24px", top: "200px" },
        hasBackdrop: this.hasBackdrop ? this.hasBackdrop : false,
        panelClass: this.hasBackdrop ? "noroundedandshadow" : "noshadow"
        // data: {nCaseid:this.nCaseid}
      });
      this.dialogRef.componentInstance.nCaseid = this.nCaseid;
      this.dialogRef.componentInstance.editable_list = edit_detail;
      this.dialogRef.afterClosed().subscribe((result) => {
        this.dialogRef = null;
        if (result) {
          this.OnEvent.emit({ event: "RELOAD", data: { nContactid: x.nContactid } });
        }
      });
    });
  }
  contactDetail(x) {
    return __async(this, null, function* () {
      if (this.dialogRef)
        return;
      let edit_detail;
      edit_detail = yield this.CService.getContactDetail(x.nContactid);
      this.dialogRef = this.dialog.open(ContactdetailComponent, {
        width: !this.ismyfiles ? "440px" : "436px",
        height: !this.ismyfiles ? "calc(100vh - 56px)" : "calc(100% - 220px)",
        position: !this.ismyfiles ? { right: "0vh", top: "56px" } : { right: "24px", top: "200px" },
        hasBackdrop: this.hasBackdrop ? this.hasBackdrop : false,
        panelClass: this.hasBackdrop ? "noroundedandshadow" : "noshadow"
        // data: {nCaseid:this.nCaseid}
      });
      this.dialogRef.componentInstance.nCaseid = this.nCaseid;
      this.dialogRef.componentInstance.detail = edit_detail;
      this.dialogRef.afterClosed().subscribe((result) => {
        this.dialogRef = null;
        if (result) {
          result == "EDIT" ? this.editContact(x) : "";
        }
      });
    });
  }
  static {
    this.\u0275fac = function SelectedContactComponent_Factory(t) {
      return new (t || _SelectedContactComponent)(\u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(ContactService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SelectedContactComponent, selectors: [["selected-contact"]], inputs: { deletebtn: "deletebtn", showinfo: "showinfo", largeView: "largeView", selectedContacts: "selectedContacts", canDelete: "canDelete", hasshadow: "hasshadow", canEdit: "canEdit", nCaseid: "nCaseid", ismyfiles: "ismyfiles", hasBackdrop: "hasBackdrop" }, outputs: { OnEvent: "OnEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 0, consts: [[1, "flex", "items-center", "gap-2", "border", "border-white", "hover:bg-white", "px-5", "py-2.5", "rounded-base", "group", "mb-2", 3, "ngClass"], ["size", "xl", 3, "detail"], [1, "gap-0.5", "flex", "flex-col"], [1, "text-xs", "font-semibold", 3, "click"], ["name", "info"], [1, "text-xxs"], [1, "underline", "text-xxs", "truncate"], ["mode", "outlined", 1, "w-fit", "ms-auto", "opacity-0", "group-hover:opacity-100", 3, "square"], ["mode", "outlined", 1, "w-fit", "ms-auto", "opacity-0", "group-hover:opacity-100", 3, "ngClass", "square"], ["mode", "outlined", 1, "w-fit", "ms-auto", "opacity-0", "group-hover:opacity-100", 3, "click", "square"], ["name", "edit"], ["mode", "outlined", 1, "w-fit", "ms-auto", "opacity-0", "group-hover:opacity-100", 3, "click", "ngClass", "square"], ["name", "removefill"]], template: function SelectedContactComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275repeaterCreate(0, SelectedContactComponent_For_1_Template, 11, 15, "div", 0, _forTrack0);
      }
      if (rf & 2) {
        \u0275\u0275repeater(ctx.selectedContacts);
      }
    }, dependencies: [AvatarComponent, ButtonComponent, IconComponent, MatTooltipModule, CommonModule, NgClass] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SelectedContactComponent, { className: "SelectedContactComponent", filePath: "src\\app\\shared\\components\\contacts\\selected-contact\\selected-contact.component.ts", lineNumber: 23 });
})();

export {
  SelectedContactComponent
};
//# sourceMappingURL=chunk-623VNBJI.js.map
