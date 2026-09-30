import {
  ContactFormComponent
} from "./chunk-KKQSQEUN.js";
import {
  ContactService
} from "./chunk-5HHWKW4L.js";
import {
  MatSelect,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField
} from "./chunk-Y2GGPNYR.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
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
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferOnViewport,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction3,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/contacts/choose-contact/choose-contact.component.ts
var _forTrack0 = ($index, $item) => $item.nContactid;
var ChooseContactComponent_Defer_20_DepsFn = () => [IconComponent, ButtonComponent];
var _c0 = (a0) => ({ "!p-0": a0 });
var _c1 = (a0, a1, a2) => ({ cFname: a0, cLname: a1, cProfile: a2 });
function ChooseContactComponent_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate2(" ", ctx_r0.choosedContact == null ? null : ctx_r0.choosedContact.cFname, " ", ctx_r0.choosedContact == null ? null : ctx_r0.choosedContact.cLname, " ");
  }
}
function ChooseContactComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Choose Contact ");
  }
}
function ChooseContactComponent_For_17_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r2.cRole);
  }
}
function ChooseContactComponent_For_17_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r2.cCompany);
  }
}
function ChooseContactComponent_For_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 10)(1, "div", 13);
    \u0275\u0275element(2, "avtr", 14);
    \u0275\u0275elementStart(3, "div", 15)(4, "span", 16);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, ChooseContactComponent_For_17_Conditional_6_Template, 2, 1, "span", 17)(7, ChooseContactComponent_For_17_Conditional_7_Template, 2, 1, "span", 17);
    \u0275\u0275elementStart(8, "span", 18);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275property("value", x_r2.nContactid);
    \u0275\u0275advance(2);
    \u0275\u0275property("matTooltip", x_r2.cFname + x_r2.cLname)("detail", \u0275\u0275pureFunction3(9, _c1, x_r2.cFname, x_r2.cLname, x_r2.cProfile))("sourcePath", "contacts/");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", x_r2.cFname, " ", x_r2.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(6, x_r2.cRole ? 6 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(7, x_r2.cCompany ? 7 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r2.cEmail);
  }
}
function ChooseContactComponent_Defer_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 19);
    \u0275\u0275listener("click", function ChooseContactComponent_Defer_18_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.addContact(ctx_r0.choosedContact, "E"));
    });
    \u0275\u0275element(1, "icon", 20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "btn", 19);
    \u0275\u0275listener("click", function ChooseContactComponent_Defer_18_Template_btn_click_2_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.addContact());
    });
    \u0275\u0275element(3, "icon", 21);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("square", true);
    \u0275\u0275attribute("isdisabled", !ctx_r0.nContactid);
    \u0275\u0275advance(2);
    \u0275\u0275property("square", true);
  }
}
function ChooseContactComponent_DeferPlaceholder_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div");
  }
}
function ChooseContactComponent_app_contact_form_24_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-contact-form", 22);
    \u0275\u0275listener("OnEvent", function ChooseContactComponent_app_contact_form_24_Template_app_contact_form_OnEvent_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onContactFormEvent($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("nCaseid", ctx_r0.nCaseid)("editable_list", ctx_r0.contactFormData)("iscomponent", true);
  }
}
var ChooseContactComponent = class _ChooseContactComponent {
  constructor(contactService, cdr, tost) {
    this.contactService = contactService;
    this.cdr = cdr;
    this.tost = tost;
    this.OnEvent = new EventEmitter();
    this.changeContact = new EventEmitter();
    this.contactList = [];
    this.isLoading = true;
    this.ismyfiles = false;
    this.showContactForm = false;
    this.contactFormData = null;
    this.contactFormMode = "add";
    this.nopadding = false;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.contactList = yield this.contactService.getContactList(this.nCaseid);
      this.handleSeletedContact();
      if (this.nContactid) {
        this.selectedContact();
        if (this.selectedContacts && this.selectedContacts.length > 0) {
          const ind = this.selectedContacts.findIndex((a) => a.nContactid == this.choosedContact.nContactid);
          this.selectedContacts.splice(ind, 1);
          this.selectedContacts.unshift(this.choosedContact);
        }
      }
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }
  selectedContact() {
    this.choosedContact = this.contactList.find((a) => a.nContactid == this.nContactid);
    this.cdr.detectChanges();
  }
  addContact(x, permission) {
    return __async(this, null, function* () {
      if (this.showContactForm)
        return;
      if (permission && permission == "E" && !x) {
        return;
      }
      let edit_detail;
      if (x) {
        edit_detail = yield this.contactService.getContactDetail(x.nContactid);
      }
      this.contactFormData = x ? edit_detail : null;
      this.contactFormMode = x ? "edit" : "add";
      this.showContactForm = true;
      this.cdr.detectChanges();
    });
  }
  onContactFormEvent(event) {
    if (event.event === "CLOSE") {
      this.showContactForm = false;
      this.contactFormData = null;
      this.cdr.detectChanges();
    } else if (event.event === "NEW_ADDED") {
      this.nContactid = event.data.nContactid;
      this.isLoading = true;
      this.showContactForm = false;
      this.contactFormData = null;
      this.ngOnInit();
    }
  }
  SaveContact() {
    if (!this.choosedContact)
      return;
    const ind = this.selectedContacts.findIndex((a) => a.nContactid == this.choosedContact.nContactid);
    if (ind == -1) {
      this.selectedContacts.unshift(this.choosedContact);
      this.choosedContact = null;
      this.nContactid = null;
    } else {
      this.tost.openSnackBar("Contact already added", "E");
    }
    this.cdr.detectChanges();
    this.OnEvent.emit({ event: "SUBMIT", data: {} });
  }
  view() {
    this.OnEvent.emit({ event: "VIEW", data: {} });
  }
  handleSeletedContact() {
    if (this.selectedContacts.length && this.contactList.length) {
      for (let index = 0; index < this.selectedContacts.length; index++) {
        const found = this.contactList.find((a) => a.nContactid == this.selectedContacts[index].nContactid);
        if (found) {
          this.selectedContacts[index] = found;
        }
      }
    }
  }
  back() {
    this.OnEvent.emit({ event: "BACK", data: {} });
  }
  static {
    this.\u0275fac = function ChooseContactComponent_Factory(t) {
      return new (t || _ChooseContactComponent)(\u0275\u0275directiveInject(ContactService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ChooseContactComponent, selectors: [["choose-contact"]], inputs: { selectedContacts: "selectedContacts", nCaseid: "nCaseid", ismyfiles: "ismyfiles", nopadding: "nopadding" }, outputs: { OnEvent: "OnEvent", changeContact: "changeContact" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 25, vars: 8, consts: [[1, "px-5", "pt-5", "pb-3", "flex", "items-center", "gap-2"], ["name", "chvy", 1, "text-xs", "mt-px", 3, "click"], [1, "font-semibold", "text-lg", "ms-2"], ["mode", "white", 1, "ms-auto", 3, "click"], ["width", "16", "height", "16", "viewBox", "0 0 16 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M0 8C-1.56548e-08 6.94943 0.206926 5.90914 0.608964 4.93853C1.011 3.96793 1.60028 3.08601 2.34315 2.34315C3.08601 1.60028 3.96793 1.011 4.93853 0.608964C5.90914 0.206926 6.94943 0 8 0C9.05058 0 10.0909 0.206926 11.0615 0.608964C12.0321 1.011 12.914 1.60028 13.6569 2.34315C14.3997 3.08601 14.989 3.96793 15.391 4.93853C15.7931 5.90914 16 6.94943 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 3.16163e-08 10.1217 0 8ZM8 4C7.82319 4 7.65362 4.07024 7.5286 4.19526C7.40357 4.32029 7.33333 4.48986 7.33333 4.66667V7.33333H4.66667C4.48986 7.33333 4.32029 7.40357 4.19526 7.5286C4.07024 7.65362 4 7.82319 4 8C4 8.17681 4.07024 8.34638 4.19526 8.47141C4.32029 8.59643 4.48986 8.66667 4.66667 8.66667H7.33333V11.3333C7.33333 11.5101 7.40357 11.6797 7.5286 11.8047C7.65362 11.9298 7.82319 12 8 12C8.17681 12 8.34638 11.9298 8.47141 11.8047C8.59643 11.6797 8.66667 11.5101 8.66667 11.3333V8.66667H11.3333C11.5101 8.66667 11.6797 8.59643 11.8047 8.47141C11.9298 8.34638 12 8.17681 12 8C12 7.82319 11.9298 7.65362 11.8047 7.5286C11.6797 7.40357 11.5101 7.33333 11.3333 7.33333H8.66667V4.66667C8.66667 4.48986 8.59643 4.32029 8.47141 4.19526C8.34638 4.07024 8.17681 4 8 4Z", "fill", "currentColor"], [1, "p-5", 3, "ngClass"], [1, "flex", "gap-2", "w-full"], [1, "w-full"], ["placeholder", "Choose contact", 1, "!border-none", 3, "ngModelChange", "selectionChange", "disabled", "ngModel"], [1, "group", "nocheck", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], [1, "w-full", "mt-6", 3, "click"], ["style", "position:absolute; top:0; left:0; width:100%; height:100%; background:white; z-index:1000; display:flex; align-items:center; justify-content:center;", 3, "nCaseid", "editable_list", "iscomponent", "OnEvent", 4, "ngIf"], [1, "flex", "items-start", "gap-2", "bg-white", "px-5", "py-2.5", "rounded-base", "group-[&.mdc-list-item--selected]:text-white", "group-[&.mdc-list-item--selected]:bg-blue-500", "group-hover:bg-blue-50"], ["size", "lg", 3, "matTooltip", "detail", "sourcePath"], [1, "gap-1", "flex", "flex-col"], [1, "text-xs", "font-semibold"], [1, "text-xxs", "leading-none"], [1, "underline", "text-xxs", "leading-none", "truncate"], ["mode", "outlined", 3, "click", "square"], ["name", "edit"], ["name", "addfill"], [2, "position", "absolute", "top", "0", "left", "0", "width", "100%", "height", "100%", "background", "white", "z-index", "1000", "display", "flex", "align-items", "center", "justify-content", "center", 3, "OnEvent", "nCaseid", "editable_list", "iscomponent"]], template: function ChooseContactComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "icon", 1);
        \u0275\u0275listener("click", function ChooseContactComponent_Template_icon_click_1_listener() {
          return ctx.back();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(2, "span", 2);
        \u0275\u0275text(3, "Choose Contact");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "btn", 3);
        \u0275\u0275listener("click", function ChooseContactComponent_Template_btn_click_4_listener() {
          return ctx.addContact();
        });
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(5, "svg", 4);
        \u0275\u0275element(6, "path", 5);
        \u0275\u0275elementEnd();
        \u0275\u0275text(7, " New Contact ");
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(8, "div", 6)(9, "div", 7)(10, "mat-form-field", 8)(11, "mat-select", 9);
        \u0275\u0275twoWayListener("ngModelChange", function ChooseContactComponent_Template_mat_select_ngModelChange_11_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.nContactid, $event) || (ctx.nContactid = $event);
          return $event;
        });
        \u0275\u0275listener("selectionChange", function ChooseContactComponent_Template_mat_select_selectionChange_11_listener() {
          return ctx.selectedContact();
        });
        \u0275\u0275elementStart(12, "mat-select-trigger")(13, "div");
        \u0275\u0275template(14, ChooseContactComponent_Conditional_14_Template, 1, 2)(15, ChooseContactComponent_Conditional_15_Template, 1, 0);
        \u0275\u0275elementEnd()();
        \u0275\u0275repeaterCreate(16, ChooseContactComponent_For_17_Template, 10, 13, "mat-option", 10, _forTrack0);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(18, ChooseContactComponent_Defer_18_Template, 4, 3)(19, ChooseContactComponent_DeferPlaceholder_19_Template, 1, 0);
        \u0275\u0275defer(20, 18, ChooseContactComponent_Defer_20_DepsFn, null, 19);
        \u0275\u0275deferOnViewport(0, -1);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(22, "btn", 11);
        \u0275\u0275listener("click", function ChooseContactComponent_Template_btn_click_22_listener() {
          return ctx.SaveContact();
        });
        \u0275\u0275text(23, " Done ");
        \u0275\u0275elementEnd()();
        \u0275\u0275template(24, ChooseContactComponent_app_contact_form_24_Template, 1, 3, "app-contact-form", 12);
      }
      if (rf & 2) {
        \u0275\u0275advance(8);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(6, _c0, ctx.nopadding));
        \u0275\u0275advance(3);
        \u0275\u0275property("disabled", !(ctx.contactList == null ? null : ctx.contactList.length));
        \u0275\u0275twoWayProperty("ngModel", ctx.nContactid);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(14, ctx.choosedContact ? 14 : 15);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.contactList);
        \u0275\u0275advance(6);
        \u0275\u0275attribute("isdisabled", !ctx.nContactid);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.showContactForm);
      }
    }, dependencies: [AvatarComponent, MatTooltipModule, MatTooltip, MatSelectModule, MatFormField, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, IconComponent, ButtonComponent, CommonModule, NgClass, NgIf, ContactFormComponent], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ChooseContactComponent, { className: "ChooseContactComponent", filePath: "src\\app\\shared\\components\\contacts\\choose-contact\\choose-contact.component.ts", lineNumber: 24 });
})();

export {
  ChooseContactComponent
};
//# sourceMappingURL=chunk-SB56HXZD.js.map
