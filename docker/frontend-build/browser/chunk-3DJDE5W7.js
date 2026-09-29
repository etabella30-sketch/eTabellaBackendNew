import {
  ContactFormComponent
} from "./chunk-KKQSQEUN.js";
import {
  TaskFormComponent
} from "./chunk-JMA5RSND.js";
import {
  TaskService
} from "./chunk-PDZ7367Z.js";
import {
  NgOptionTemplateDirective,
  NgSelectComponent,
  NgSelectModule
} from "./chunk-E3GVDGCY.js";
import {
  ContactService
} from "./chunk-5HHWKW4L.js";
import {
  MatSelect,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-BM3TWEH3.js";
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
  DatePipe
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
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
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/marking/components/fact/assign-contact/assign-contact.component.ts
var _forTrack0 = ($index, $item) => $item.nContactid;
function AssignContactComponent_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "icon", 20);
    \u0275\u0275listener("click", function AssignContactComponent_Conditional_0_Conditional_1_Template_icon_click_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.back());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "span", 21);
    \u0275\u0275text(3, " Contact ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "btn", 22);
    \u0275\u0275listener("click", function AssignContactComponent_Conditional_0_Conditional_1_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.ActiveForm = "C");
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 23);
    \u0275\u0275element(6, "path", 24);
    \u0275\u0275elementEnd();
    \u0275\u0275text(7, " New Contact ");
    \u0275\u0275elementEnd()();
  }
}
function AssignContactComponent_Conditional_0_ng_template_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 25)(2, "div", 26);
    \u0275\u0275element(3, "avtr", 27);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r4 = ctx.item;
    \u0275\u0275advance(3);
    \u0275\u0275property("detail", item_r4)("sourcePath", "contacts/");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", item_r4.cFname, " ", item_r4.cLname, " ");
  }
}
function AssignContactComponent_Conditional_0_Conditional_13_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 30);
    \u0275\u0275listener("click", function AssignContactComponent_Conditional_0_Conditional_13_Conditional_3_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.edit());
    });
    \u0275\u0275elementEnd();
  }
}
function AssignContactComponent_Conditional_0_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 28);
    \u0275\u0275text(2);
    \u0275\u0275template(3, AssignContactComponent_Conditional_0_Conditional_13_Conditional_3_Template, 1, 0, "icon", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", ctx_r2.activeContacts == null ? null : ctx_r2.activeContacts.cFname, " ", ctx_r2.activeContacts == null ? null : ctx_r2.activeContacts.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r2.showEditBtn ? 3 : -1);
  }
}
function AssignContactComponent_Conditional_0_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1, " Select a contact in case to assign ");
    \u0275\u0275elementContainerEnd();
  }
}
function AssignContactComponent_Conditional_0_For_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 17)(1, "div")(2, "div", 25)(3, "div", 31);
    \u0275\u0275element(4, "avtr", 27);
    \u0275\u0275elementStart(5, "span", 32);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 33);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 34);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r6 = ctx.$implicit;
    \u0275\u0275property("value", x_r6);
    \u0275\u0275advance(4);
    \u0275\u0275property("detail", x_r6)("sourcePath", "contacts/");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", x_r6.cFname, " ", x_r6.cLname, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r6.cRole || "-", " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r6.cPartyname || "-", " ");
  }
}
function AssignContactComponent_Conditional_0_Conditional_27_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 38);
    \u0275\u0275element(1, "avtr", 27);
    \u0275\u0275elementStart(2, "div")(3, "div", 39);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 40);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 40);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 40);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(11, "svg", 41);
    \u0275\u0275listener("click", function AssignContactComponent_Conditional_0_Conditional_27_For_3_Template_svg_click_11_listener() {
      const ctx_r7 = \u0275\u0275restoreView(_r7);
      const contact_r9 = ctx_r7.$implicit;
      const $index_r10 = ctx_r7.$index;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.removeC(contact_r9, $index_r10));
    });
    \u0275\u0275element(12, "path", 42);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const contact_r9 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275classMap(ctx_r2.factsheetMode ? "!bg-[#EDEDED]" : "");
    \u0275\u0275advance();
    \u0275\u0275property("detail", contact_r9)("sourcePath", "contacts/");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", contact_r9.cFname, " ", contact_r9.cLname, "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((contact_r9 == null ? null : contact_r9.cRole) || "NA");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(contact_r9.cPartyname);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(contact_r9.cCompany);
  }
}
function AssignContactComponent_Conditional_0_Conditional_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 35)(1, "div", 36);
    \u0275\u0275repeaterCreate(2, AssignContactComponent_Conditional_0_Conditional_27_For_3_Template, 13, 9, "div", 37, _forTrack0);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r2.factsheetMode ? "h-fit bg-transparent" : "bg-reply h-full py-5");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.selectedContacts);
  }
}
function AssignContactComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275template(1, AssignContactComponent_Conditional_0_Conditional_1_Template, 8, 0, "div", 2);
    \u0275\u0275elementStart(2, "div", 3)(3, "div")(4, "div", 4)(5, "div", 5);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 6);
    \u0275\u0275element(7, "path", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(8, "ng-select", 8);
    \u0275\u0275listener("change", function AssignContactComponent_Conditional_0_Template_ng_select_change_8_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.activeContacts = $event);
    });
    \u0275\u0275template(9, AssignContactComponent_Conditional_0_ng_template_9_Template, 5, 4, "ng-template", 9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "div", 10)(11, "mat-select", 11);
    \u0275\u0275twoWayListener("ngModelChange", function AssignContactComponent_Conditional_0_Template_mat_select_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.activeContacts, $event) || (ctx_r2.activeContacts = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("selectionChange", function AssignContactComponent_Conditional_0_Template_mat_select_selectionChange_11_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.handleContactChange($event));
    });
    \u0275\u0275elementStart(12, "mat-select-trigger");
    \u0275\u0275template(13, AssignContactComponent_Conditional_0_Conditional_13_Template, 4, 3, "ng-container")(14, AssignContactComponent_Conditional_0_Conditional_14_Template, 2, 0);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "div", 12)(16, "div", 13)(17, "h6", 14);
    \u0275\u0275text(18, "Name");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "h6", 15);
    \u0275\u0275text(20, "Role in case");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "h6", 16);
    \u0275\u0275text(22, "Party");
    \u0275\u0275elementEnd()()();
    \u0275\u0275repeaterCreate(23, AssignContactComponent_Conditional_0_For_24_Template, 11, 7, "mat-option", 17, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(25, "btn", 18);
    \u0275\u0275listener("click", function AssignContactComponent_Conditional_0_Template_btn_click_25_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.addcontact());
    });
    \u0275\u0275text(26, "Add Contact");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(27, AssignContactComponent_Conditional_0_Conditional_27_Template, 4, 2, "div", 19);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r2.factsheetMode ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.factsheetMode ? "px-2" : "px-5");
    \u0275\u0275advance(6);
    \u0275\u0275property("items", ctx_r2.contactList)("searchFn", ctx_r2.customSearch);
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.activeContacts);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(13, ctx_r2.activeContacts ? 13 : 14);
    \u0275\u0275advance(10);
    \u0275\u0275repeater(ctx_r2.contactList);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !ctx_r2.activeContacts);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(27, (ctx_r2.selectedContacts == null ? null : ctx_r2.selectedContacts.length) > 0 ? 27 : -1);
  }
}
function AssignContactComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-contact-form", 43);
    \u0275\u0275listener("OnEvent", function AssignContactComponent_Conditional_1_Template_app_contact_form_OnEvent_0_listener($event) {
      \u0275\u0275restoreView(_r11);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.contactEvent($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("cPermission", ctx_r2.cPermission)("nCaseid", ctx_r2.nCaseid)("editable_list", ctx_r2.contactFormData);
  }
}
var AssignContactComponent = class _AssignContactComponent {
  constructor(contactService, tost) {
    this.contactService = contactService;
    this.tost = tost;
    this.contactList = [];
    this.ActiveForm = "";
    this.OnEvent = new EventEmitter();
    this.permissionChange = new EventEmitter();
    this.cPermission = "N";
    this.contactFormData = null;
    this.nContactidChange = new EventEmitter();
    this.activeFormChange = new EventEmitter();
    this.showEditBtn = false;
    this.customSearch = (term, item) => {
      const fullName = `${item?.cFname} ${item?.cLname}`.toLowerCase();
      const searchTerm = term?.toLowerCase();
      return fullName?.includes(searchTerm) || item?.cFname?.toLowerCase().includes(searchTerm) || item?.cLname?.toLowerCase().includes(searchTerm) || item?.cRole?.toLowerCase().includes(searchTerm);
    };
  }
  ngOnInit() {
    this.getContactlist();
  }
  ngOnChanges(changes) {
    if (changes["cPermission"] || changes["activeForm"]) {
      if (this.activeForm == "CF" && this.cPermission == "N") {
        this.activeContacts = null;
      }
    }
    if (changes["nContactid"]) {
      if (this.activeForm == "C" && this.nContactid) {
        this.getContactlist();
      }
    }
  }
  getContactlist() {
    return __async(this, null, function* () {
      this.contactList = yield this.contactService.getContactList(this.nCaseid);
      if (this.nContactid) {
        this.selectedContact();
      }
      if (this.contactList.length == 0 && !this.ActiveForm && !this.factsheetMode) {
        this.ActiveForm = "C";
      }
    });
  }
  back() {
    this.OnEvent.emit({ event: "CLOSE", data: null });
    this.assignModeChange.emit(null);
  }
  edit() {
    return __async(this, null, function* () {
      if (this.activeContacts) {
        this.contactFormData = yield this.contactService.getContactDetail(this.activeContacts.nContactid);
      }
      this.cPermission = "E";
      this.ActiveForm = "C";
    });
  }
  addcontact() {
    if (!this.activeContacts)
      return;
    const ind = this.selectedContacts.findIndex((a) => a.nContactid == this.activeContacts.nContactid);
    if (ind == -1) {
      this.selectedContacts.unshift(this.activeContacts);
      this.activeContacts = null;
      this.nContactid = null;
      this.nContactidChange.emit(this.nContactid);
      this.OnEvent.emit({ event: "SUBMIT", data: {} });
    } else {
      this.tost.openSnackBar("Contact already added", "E");
    }
  }
  removeC(contact, index) {
    this.selectedContacts.splice(index, 1);
    this.OnEvent.emit({ event: "DELETE", data: { nContactid: contact.nContactid } });
  }
  contactEvent(ev) {
    if (this.contactFormData) {
      this.contactFormData = null;
    }
    this.ActiveForm = "";
    if (ev.event == "CLOSE") {
      if (this.factsheetMode) {
        this.OnEvent.emit({ event: "CLOSE", data: null });
      } else {
        this.cPermission = "N";
      }
    }
    if (ev.event == "NEW_ADDED") {
      if (this.activeContacts) {
        this.activeContacts = null;
      }
      if (this.factsheetMode) {
        this.nContactid = ev.data.nContactid;
        this.nContactidChange.emit(this.nContactid);
        this.activeForm = "C";
        this.activeFormChange.emit(this.activeForm);
      } else {
        this.getContactlist();
      }
    }
  }
  selectedContact() {
    return __async(this, null, function* () {
      this.activeContacts = this.contactList?.find((a) => a.nContactid == this.nContactid);
      if (this.activeForm == "CF" && this.activeContacts?.nContactid) {
        this.contactFormData = yield this.contactService.getContactDetail(this.activeContacts.nContactid);
      }
    });
  }
  handleContactChange(event) {
    this.nContactid = event.value.nContactid;
    this.nContactidChange.emit(this.nContactid);
    console.log("selected contact permission", event.value);
    this.permissionChange.emit({
      canEdit: event.value.permissions.bCanEdit,
      canDelete: event.value.permissions.bCanDelete,
      canView: event.value.permissions.bCanView
    });
  }
  static {
    this.\u0275fac = function AssignContactComponent_Factory(t) {
      return new (t || _AssignContactComponent)(\u0275\u0275directiveInject(ContactService), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AssignContactComponent, selectors: [["assign-contact"]], inputs: { nCaseid: "nCaseid", assignModeChange: "assignModeChange", selectedContacts: "selectedContacts", factsheetMode: "factsheetMode", ActiveForm: "ActiveForm", cPermission: "cPermission", nContactid: "nContactid", activeForm: "activeForm", showEditBtn: "showEditBtn" }, outputs: { OnEvent: "OnEvent", permissionChange: "permissionChange", nContactidChange: "nContactidChange", activeFormChange: "activeFormChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 2, consts: [[1, "flex", "flex-col", "h-full"], [1, "block", "h-full", "overflow-auto", 3, "cPermission", "nCaseid", "editable_list"], [1, "px-5", "pt-5", "pb-3", "flex", "items-center", "gap-2"], [1, "min-h-fit", "flex", "flex-col", "overflow-hidden", "pb-0"], [1, "border-tab", "border", "rounded-base", "bg-white"], [1, "flex", "gap-2", "items-center", "relative"], ["width", "14", "height", "15", "viewBox", "0 0 14 15", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "absolute", "left-5", "top-1/2", "-translate-y-1/2"], ["d", "M8.4308 0.640625C6.99106 0.640625 5.61028 1.21256 4.59223 2.23062C3.57417 3.24867 3.00223 4.62945 3.00223 6.0692C3.00223 7.25891 3.38509 8.35891 4.03366 9.25377L0.395947 12.8915C0.23866 13.0465 0.147259 13.2562 0.140794 13.4769C0.134328 13.6976 0.213298 13.9123 0.361243 14.0763C0.509188 14.2402 0.714691 14.3407 0.934921 14.3569C1.15515 14.373 1.37311 14.3035 1.54338 14.1629L1.60852 14.1041L5.24623 10.4663C6.17185 11.1385 7.28687 11.4996 8.4308 11.4978C9.87055 11.4978 11.2513 10.9258 12.2694 9.90777C13.2874 8.88972 13.8594 7.50894 13.8594 6.0692C13.8594 4.62945 13.2874 3.24867 12.2694 2.23062C11.2513 1.21256 9.87055 0.640625 8.4308 0.640625ZM8.4308 2.35491C9.41589 2.35491 10.3606 2.74624 11.0572 3.4428C11.7538 4.13936 12.1451 5.08411 12.1451 6.0692C12.1451 7.05429 11.7538 7.99903 11.0572 8.69559C10.3606 9.39216 9.41589 9.78348 8.4308 9.78348C7.44571 9.78348 6.50097 9.39216 5.80441 8.69559C5.10784 7.99903 4.71652 7.05429 4.71652 6.0692C4.71652 5.08411 5.10784 4.13936 5.80441 3.4428C6.50097 2.74624 7.44571 2.35491 8.4308 2.35491Z", "fill", "#4F4F4F"], ["appendTo", "body", "bindLabel", "cFname", "bindValue", "cFname", "placeholder", "Type to search by name or role in case ", 1, "pagerefslct", "autocmpltselect", "w-full", "!pe-0", "!ps-9", "h-8.5", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "items", "searchFn"], ["ng-option-tmp", ""], [1, "border-t"], ["panelClass", "sortfltrpnl contactnew !p-2.5", "disableOptionCentering", "", "placeholder", "Select a contact in case to assign", 1, "sortfilterslct", "addcont", 3, "ngModelChange", "selectionChange", "ngModel"], [1, "bg-white"], [1, "bg-reply", "py-1", "mb-1", "flex", "gap-2.5", "sticky", "top-0", "z-50"], [1, "text-xs", "w-[40%]", "ps-5"], [1, "text-xs", "w-[40%]"], [1, "text-xs", "w-[20%]"], [1, "nocheck", "group", "!p-0", "mb-0.5", "last:mb-0", 2, "--mat-option-padding", "0", 3, "value"], ["addcls", "w-full", 1, "mb-2.5", "block", "mt-3", "w-full", 3, "click", "disabled"], [1, "overflow-hidden", "flex", "flex-col", "px-5", 3, "class"], ["name", "chvy", 1, "text-xs", "mt-px", 3, "click"], [1, "font-semibold", "text-lg", "ms-2"], ["mode", "white", 1, "ms-auto", 3, "click"], ["width", "16", "height", "16", "viewBox", "0 0 16 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M0 8C-1.56548e-08 6.94943 0.206926 5.90914 0.608964 4.93853C1.011 3.96793 1.60028 3.08601 2.34315 2.34315C3.08601 1.60028 3.96793 1.011 4.93853 0.608964C5.90914 0.206926 6.94943 0 8 0C9.05058 0 10.0909 0.206926 11.0615 0.608964C12.0321 1.011 12.914 1.60028 13.6569 2.34315C14.3997 3.08601 14.989 3.96793 15.391 4.93853C15.7931 5.90914 16 6.94943 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 3.16163e-08 10.1217 0 8ZM8 4C7.82319 4 7.65362 4.07024 7.5286 4.19526C7.40357 4.32029 7.33333 4.48986 7.33333 4.66667V7.33333H4.66667C4.48986 7.33333 4.32029 7.40357 4.19526 7.5286C4.07024 7.65362 4 7.82319 4 8C4 8.17681 4.07024 8.34638 4.19526 8.47141C4.32029 8.59643 4.48986 8.66667 4.66667 8.66667H7.33333V11.3333C7.33333 11.5101 7.40357 11.6797 7.5286 11.8047C7.65362 11.9298 7.82319 12 8 12C8.17681 12 8.34638 11.9298 8.47141 11.8047C8.59643 11.6797 8.66667 11.5101 8.66667 11.3333V8.66667H11.3333C11.5101 8.66667 11.6797 8.59643 11.8047 8.47141C11.9298 8.34638 12 8.17681 12 8C12 7.82319 11.9298 7.65362 11.8047 7.5286C11.6797 7.40357 11.5101 7.33333 11.3333 7.33333H8.66667V4.66667C8.66667 4.48986 8.59643 4.32029 8.47141 4.19526C8.34638 4.07024 8.17681 4 8 4Z", "fill", "currentColor"], [1, "px-5", "py-1", "hover:bg-blue-deactivate", "rounded-md", "flex", "text-xs", "items-center", "gap-2.5", "group-[.mdc-list-item--selected]:bg-blue-deactivate", "group-[.mdc-list-item--selected]:font-semibold"], [1, "flex", "items-center", "gap-2"], ["size", "sm", 3, "detail", "sourcePath"], [1, "flex", "items-center", "justify-between"], ["name", "edit", 1, "ms-auto", "me-2.5", "text-sm", "text-grey"], ["name", "edit", 1, "ms-auto", "me-2.5", "text-sm", "text-grey", 3, "click"], [1, "w-[40%]", "flex", "items-center", "gap-1"], [1, "truncate", "block", "w-[calc(100%-40px)]"], [1, "w-[40%]"], [1, "w-[20%]"], [1, "overflow-hidden", "flex", "flex-col", "px-5"], [1, "block", "overflow-auto"], [1, "flex", "items-start", "group", "gap-3", "py-3", "bg-transparent", "hover:border-white", "border", "border-transparent", "rounded-base", "p-3", "mb-2", 3, "class"], [1, "flex", "items-start", "group", "gap-3", "py-3", "bg-transparent", "hover:border-white", "border", "border-transparent", "rounded-base", "p-3", "mb-2"], [1, "text-sm", "font-medium"], [1, "text-xs", "text-gray-500"], ["matTooltip", "Unassign", "width", "16", "height", "16", "viewBox", "0 0 16 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "ms-auto", "my-auto", "me-3", "hidden", "group-hover:flex", "cursor-pointer", 3, "click"], ["d", "M8 0C6.41775 0 4.87103 0.469192 3.55544 1.34824C2.23985 2.22729 1.21447 3.47672 0.608967 4.93853C0.00346627 6.40034 -0.15496 8.00887 0.153721 9.56072C0.462403 11.1126 1.22433 12.538 2.34315 13.6569C3.46197 14.7757 4.88743 15.5376 6.43928 15.8463C7.99113 16.155 9.59966 15.9965 11.0615 15.391C12.5233 14.7855 13.7727 13.7602 14.6518 12.4446C15.5308 11.129 16 9.58225 16 8C16 6.94942 15.7931 5.90914 15.391 4.93853C14.989 3.96793 14.3997 3.08601 13.6569 2.34315C12.914 1.60028 12.0321 1.011 11.0615 0.608964C10.0909 0.206926 9.05058 0 8 0ZM10.4 8.8H5.6C5.38783 8.8 5.18435 8.71571 5.03432 8.56568C4.88429 8.41566 4.8 8.21217 4.8 8C4.8 7.78783 4.88429 7.58434 5.03432 7.43431C5.18435 7.28428 5.38783 7.2 5.6 7.2H10.4C10.6122 7.2 10.8157 7.28428 10.9657 7.43431C11.1157 7.58434 11.2 7.78783 11.2 8C11.2 8.21217 11.1157 8.41566 10.9657 8.56568C10.8157 8.71571 10.6122 8.8 10.4 8.8Z", "fill", "CurrentColor"], [1, "block", "h-full", "overflow-auto", 3, "OnEvent", "cPermission", "nCaseid", "editable_list"]], template: function AssignContactComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, AssignContactComponent_Conditional_0_Template, 28, 9, "div", 0)(1, AssignContactComponent_Conditional_1_Template, 1, 3, "app-contact-form", 1);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, !ctx.ActiveForm ? 0 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.ActiveForm == "C" ? 1 : -1);
      }
    }, dependencies: [
      IconComponent,
      ButtonComponent,
      MatSelectModule,
      MatSelect,
      MatSelectTrigger,
      MatOption,
      FormsModule,
      NgControlStatus,
      NgModel,
      AvatarComponent,
      ContactFormComponent,
      NgSelectModule,
      NgSelectComponent,
      NgOptionTemplateDirective
    ] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AssignContactComponent, { className: "AssignContactComponent", filePath: "src\\app\\marking\\components\\fact\\assign-contact\\assign-contact.component.ts", lineNumber: 39 });
})();

// src/app/marking/components/fact/assign-fact-task/assign-fact-task.component.ts
var _forTrack02 = ($index, $item) => $item.nTaskid;
function AssignFactTaskComponent_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "icon", 12);
    \u0275\u0275listener("click", function AssignFactTaskComponent_Conditional_0_Conditional_1_Template_icon_click_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.back());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "span", 13);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "btn", 14);
    \u0275\u0275listener("click", function AssignFactTaskComponent_Conditional_0_Conditional_1_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.addNewTask());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 15);
    \u0275\u0275element(6, "path", 16);
    \u0275\u0275elementEnd();
    \u0275\u0275text(7, " New Task ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r2.isFiletask ? "File" : "Fact", " Task ");
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_5_ng_template_4_For_6_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "avtr", 41);
  }
  if (rf & 2) {
    const x_r5 = \u0275\u0275nextContext().$implicit;
    const item_r6 = \u0275\u0275nextContext().item;
    \u0275\u0275classProp("!-me-3", (item_r6 == null ? null : item_r6.teamlist == null ? null : item_r6.teamlist.length) > 3);
    \u0275\u0275property("detail", x_r5)("matTooltip", x_r5.cFname + " " + x_r5.cLname);
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_5_ng_template_4_For_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, AssignFactTaskComponent_Conditional_0_Conditional_5_ng_template_4_For_6_Conditional_0_Template, 1, 4, "avtr", 40);
  }
  if (rf & 2) {
    const $index_r7 = ctx.$index;
    \u0275\u0275conditional(0, $index_r7 < 3 ? 0 : -1);
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_5_ng_template_4_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 25);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r6 = \u0275\u0275nextContext().item;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" +", (item_r6.teamlist == null ? null : item_r6.teamlist.length) - 4, " ");
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_5_ng_template_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 21)(1, "h6", 22)(2, "span", 23);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 24);
    \u0275\u0275repeaterCreate(5, AssignFactTaskComponent_Conditional_0_Conditional_5_ng_template_4_For_6_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(7, AssignFactTaskComponent_Conditional_0_Conditional_5_ng_template_4_Conditional_7_Template, 2, 1, "div", 25);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "div", 26)(9, "div", 27)(10, "h6");
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "div", 28)(13, "div", 29)(14, "span", 30);
    \u0275\u0275text(15, "Status");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "h6", 31);
    \u0275\u0275text(17);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "div", 32)(19, "span", 33);
    \u0275\u0275text(20, "Priority");
    \u0275\u0275elementEnd();
    \u0275\u0275element(21, "icon", 34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "div", 35)(23, "span", 33);
    \u0275\u0275text(24, "Progress");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "h5", 36)(26, "b", 37);
    \u0275\u0275element(27, "span", 38);
    \u0275\u0275elementEnd();
    \u0275\u0275text(28);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(29, "div", 29)(30, "span", 33);
    \u0275\u0275text(31, "Date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(32, "h6", 39);
    \u0275\u0275text(33);
    \u0275\u0275pipe(34, "date");
    \u0275\u0275pipe(35, "date");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const item_r6 = ctx.item;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(item_r6.cSubject);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(item_r6.teamlist);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(7, (item_r6.teamlist == null ? null : item_r6.teamlist.length) > 4 ? 7 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(item_r6.cDesc);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(item_r6.cStatustext);
    \u0275\u0275advance(4);
    \u0275\u0275classProp("text-red-500", item_r6.nPriority == 1)("text-yellow-400", item_r6.nPriority == 2)("text-gray-400", item_r6.nPriority == 4)("text-green-400", item_r6.nPriority == 3);
    \u0275\u0275advance(6);
    \u0275\u0275styleProp("width", item_r6.nProgress, "%");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", item_r6.nProgress, "% ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate2("", \u0275\u0275pipeBind2(34, 17, item_r6.dStartDt, "dd/MM/yyyy"), " - ", \u0275\u0275pipeBind2(35, 20, item_r6.dEndDt, "dd/MM/yyyy"), "");
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 17);
    \u0275\u0275element(2, "path", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "ng-select", 19);
    \u0275\u0275listener("change", function AssignFactTaskComponent_Conditional_0_Conditional_5_Template_ng_select_change_3_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.choosedtask = $event);
    });
    \u0275\u0275template(4, AssignFactTaskComponent_Conditional_0_Conditional_5_ng_template_4_Template, 36, 23, "ng-template", 20);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275classProp("dsbl", !(ctx_r2.taskList == null ? null : ctx_r2.taskList.length));
    \u0275\u0275property("items", ctx_r2.taskList)("placeholder", (ctx_r2.taskList == null ? null : ctx_r2.taskList.length) ? "Choose task" : "No task found");
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_10_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 43);
    \u0275\u0275listener("click", function AssignFactTaskComponent_Conditional_0_Conditional_10_Conditional_2_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.edit());
    });
    \u0275\u0275elementEnd();
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275text(1);
    \u0275\u0275template(2, AssignFactTaskComponent_Conditional_0_Conditional_10_Conditional_2_Template, 1, 0, "icon", 42);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.choosedtask == null ? null : ctx_r2.choosedtask.cSubject, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ctx_r2.showEditBtn && ((ctx_r2.choosedtask == null ? null : ctx_r2.choosedtask.can_edit_all) || ctx_r2.choosedtask.can_edit_status) ? 2 : -1);
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Select a Fact Task... ");
  }
}
function AssignFactTaskComponent_Conditional_0_For_13_For_7_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "avtr", 41);
  }
  if (rf & 2) {
    const x_r9 = \u0275\u0275nextContext().$implicit;
    const y_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275classProp("!-me-3", (y_r10 == null ? null : y_r10.teamlist == null ? null : y_r10.teamlist.length) > 3);
    \u0275\u0275property("detail", x_r9)("matTooltip", x_r9.cFname + " " + x_r9.cLname);
  }
}
function AssignFactTaskComponent_Conditional_0_For_13_For_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, AssignFactTaskComponent_Conditional_0_For_13_For_7_Conditional_0_Template, 1, 4, "avtr", 40);
  }
  if (rf & 2) {
    const $index_r11 = ctx.$index;
    \u0275\u0275conditional(0, $index_r11 < 3 ? 0 : -1);
  }
}
function AssignFactTaskComponent_Conditional_0_For_13_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 25);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const y_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" +", (y_r10.teamlist == null ? null : y_r10.teamlist.length) - 4, " ");
  }
}
function AssignFactTaskComponent_Conditional_0_For_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 9)(1, "div", 21)(2, "h6", 22)(3, "span", 23);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 24);
    \u0275\u0275repeaterCreate(6, AssignFactTaskComponent_Conditional_0_For_13_For_7_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(8, AssignFactTaskComponent_Conditional_0_For_13_Conditional_8_Template, 2, 1, "div", 25);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 26)(10, "div", 44)(11, "h6");
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "div", 28)(14, "div", 29)(15, "span", 30);
    \u0275\u0275text(16, "Status");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "h6", 31);
    \u0275\u0275text(18);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "div", 32)(20, "span", 33);
    \u0275\u0275text(21, "Priority");
    \u0275\u0275elementEnd();
    \u0275\u0275element(22, "icon", 34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "div", 35)(24, "span", 33);
    \u0275\u0275text(25, "Progress");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "h5", 36)(27, "b", 37);
    \u0275\u0275element(28, "span", 38);
    \u0275\u0275elementEnd();
    \u0275\u0275text(29);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(30, "div", 29)(31, "span", 33);
    \u0275\u0275text(32, "Date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "h6", 39);
    \u0275\u0275text(34);
    \u0275\u0275pipe(35, "date");
    \u0275\u0275pipe(36, "date");
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const y_r10 = ctx.$implicit;
    \u0275\u0275property("value", y_r10);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(y_r10.cSubject);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(y_r10.teamlist);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(8, (y_r10.teamlist == null ? null : y_r10.teamlist.length) > 4 ? 8 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(y_r10.cDesc);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(y_r10.cStatustext);
    \u0275\u0275advance(4);
    \u0275\u0275classProp("text-red-500", y_r10.nPriority == 1)("text-yellow-400", y_r10.nPriority == 2)("text-gray-400", y_r10.nPriority == 4)("text-green-400", y_r10.nPriority == 3);
    \u0275\u0275advance(6);
    \u0275\u0275styleProp("width", y_r10.nProgress, "%");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", y_r10.nProgress, "% ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate2("", \u0275\u0275pipeBind2(35, 18, y_r10.dStartDt, "dd/MM/yyyy"), " - ", \u0275\u0275pipeBind2(36, 21, y_r10.dEndDt, "dd/MM/yyyy"), "");
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_16_For_3_For_7_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "avtr", 41);
  }
  if (rf & 2) {
    const x_r13 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275classProp("!-me-3", (x_r13 == null ? null : x_r13.teamlist == null ? null : x_r13.teamlist.length) > 3);
    \u0275\u0275property("detail", x_r13)("matTooltip", x_r13.cFname + " " + x_r13.cLname);
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_16_For_3_For_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, AssignFactTaskComponent_Conditional_0_Conditional_16_For_3_For_7_Conditional_0_Template, 1, 4, "avtr", 40);
  }
  if (rf & 2) {
    const $index_r14 = ctx.$index;
    \u0275\u0275conditional(0, $index_r14 < 3 ? 0 : -1);
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_16_For_3_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 25);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r15 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" +", (x_r15 == null ? null : x_r15.teamlist == null ? null : x_r15.teamlist.length) - 4, " ");
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_16_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 47)(1, "div", 48)(2, "h6", 49)(3, "span", 23);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 24);
    \u0275\u0275repeaterCreate(6, AssignFactTaskComponent_Conditional_0_Conditional_16_For_3_For_7_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275template(8, AssignFactTaskComponent_Conditional_0_Conditional_16_For_3_Conditional_8_Template, 2, 1, "div", 25);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 26)(10, "div", 27)(11, "h6");
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "div", 50)(14, "div", 29)(15, "span", 30);
    \u0275\u0275text(16, "Status");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "h6", 31);
    \u0275\u0275text(18);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "div", 32)(20, "span", 33);
    \u0275\u0275text(21, "Priority");
    \u0275\u0275elementEnd();
    \u0275\u0275element(22, "icon", 34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "div", 51)(24, "span", 33);
    \u0275\u0275text(25, "Progress");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "h5", 36)(27, "b", 37);
    \u0275\u0275element(28, "span", 38);
    \u0275\u0275elementEnd();
    \u0275\u0275text(29);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(30, "div", 29)(31, "span", 33);
    \u0275\u0275text(32, "Date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "h6", 39);
    \u0275\u0275text(34);
    \u0275\u0275pipe(35, "date");
    \u0275\u0275pipe(36, "date");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(37, "icon", 52);
    \u0275\u0275listener("click", function AssignFactTaskComponent_Conditional_0_Conditional_16_For_3_Template_icon_click_37_listener() {
      const $index_r16 = \u0275\u0275restoreView(_r12).$index;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.remove($index_r16));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r15 = ctx.$implicit;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(x_r15.cSubject);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(x_r15 == null ? null : x_r15.teamlist);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(8, (x_r15 == null ? null : x_r15.teamlist == null ? null : x_r15.teamlist.length) > 4 ? 8 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(x_r15.cDesc);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(x_r15.cStatustext);
    \u0275\u0275advance(4);
    \u0275\u0275classProp("text-red-500", (x_r15 == null ? null : x_r15.nPriority) == 1)("text-yellow-400", (x_r15 == null ? null : x_r15.nPriority) == 2)("text-gray-400", (x_r15 == null ? null : x_r15.nPriority) == 4)("text-green-400", (x_r15 == null ? null : x_r15.nPriority) == 3);
    \u0275\u0275advance(6);
    \u0275\u0275styleProp("width", x_r15 == null ? null : x_r15.nProgress, "%");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r15 == null ? null : x_r15.nProgress, "% ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate2(" ", \u0275\u0275pipeBind2(35, 17, x_r15.dStartDt, "dd/MM/yyyy"), " - ", \u0275\u0275pipeBind2(36, 20, x_r15.dEndDt, "dd/MM/yyyy"), "");
  }
}
function AssignFactTaskComponent_Conditional_0_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 45)(1, "div", 46);
    \u0275\u0275repeaterCreate(2, AssignFactTaskComponent_Conditional_0_Conditional_16_For_3_Template, 38, 23, "div", 47, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r2.factsheetMode ? "h-fit p-0 bg-transparent" : "bg-reply h-full p-5");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.selectedTasks);
  }
}
function AssignFactTaskComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275template(1, AssignFactTaskComponent_Conditional_0_Conditional_1_Template, 8, 1, "div", 2);
    \u0275\u0275elementStart(2, "div", 3)(3, "div")(4, "div", 4);
    \u0275\u0275template(5, AssignFactTaskComponent_Conditional_0_Conditional_5_Template, 5, 4, "div", 5);
    \u0275\u0275elementStart(6, "div", 6)(7, "mat-select", 7);
    \u0275\u0275twoWayListener("ngModelChange", function AssignFactTaskComponent_Conditional_0_Template_mat_select_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.choosedtask, $event) || (ctx_r2.choosedtask = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("selectionChange", function AssignFactTaskComponent_Conditional_0_Template_mat_select_selectionChange_7_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.handleFactTaskChange($event));
    });
    \u0275\u0275elementStart(8, "mat-select-trigger")(9, "div");
    \u0275\u0275template(10, AssignFactTaskComponent_Conditional_0_Conditional_10_Template, 3, 2, "div", 8)(11, AssignFactTaskComponent_Conditional_0_Conditional_11_Template, 1, 0);
    \u0275\u0275elementEnd()();
    \u0275\u0275repeaterCreate(12, AssignFactTaskComponent_Conditional_0_For_13_Template, 37, 24, "mat-option", 9, _forTrack02);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(14, "btn", 10);
    \u0275\u0275listener("click", function AssignFactTaskComponent_Conditional_0_Template_btn_click_14_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.addtask());
    });
    \u0275\u0275text(15, "Add Fact Task ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(16, AssignFactTaskComponent_Conditional_0_Conditional_16_Template, 4, 2, "div", 11);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r2.factsheetMode ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.factsheetMode ? "px-2" : "px-5");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("dsbl", !(ctx_r2.taskList == null ? null : ctx_r2.taskList.length));
    \u0275\u0275advance();
    \u0275\u0275conditional(5, !ctx_r2.factsheetMode ? 5 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !(ctx_r2.taskList == null ? null : ctx_r2.taskList.length));
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.choosedtask);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(10, ctx_r2.choosedtask ? 10 : 11);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.taskList);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !ctx_r2.choosedtask);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(16, (ctx_r2.selectedTasks == null ? null : ctx_r2.selectedTasks.length) > 0 && !ctx_r2.hideResult ? 16 : -1);
  }
}
function AssignFactTaskComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "task-form", 53);
    \u0275\u0275listener("OnEvent", function AssignFactTaskComponent_Conditional_1_Template_task_form_OnEvent_0_listener($event) {
      \u0275\u0275restoreView(_r17);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.taskFormEvent($event));
    })("taskForm", function AssignFactTaskComponent_Conditional_1_Template_task_form_taskForm_0_listener($event) {
      \u0275\u0275restoreView(_r17);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.taskFormEvent($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("cPermission", ctx_r2.cPermission)("nCaseid", ctx_r2.nCaseid)("editable_list", ctx_r2.choosedtask)("isFiletask", ctx_r2.isFiletask);
  }
}
var AssignFactTaskComponent = class _AssignFactTaskComponent {
  constructor(taskS, tost, cdr) {
    this.taskS = taskS;
    this.tost = tost;
    this.cdr = cdr;
    this.ActiveForm = "";
    this.hideResult = false;
    this.hideheader = false;
    this.taskList = [];
    this.nTaskidChange = new EventEmitter();
    this.selectedTasks = [];
    this.cPermission = "N";
    this.OnEvent = new EventEmitter();
    this.activeFormChange = new EventEmitter();
    this.showEditBtn = false;
    this.isFiletask = false;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      yield this.getTaskList();
    });
  }
  ngOnChanges(changes) {
    if (changes["cPermission"] || changes["activeForm"]) {
      if (this.activeForm == "TF" && this.cPermission == "N") {
        this.choosedtask = null;
      }
    }
    if (changes["nTaskid"]) {
      if (this.activeForm == "T" && this.nTaskid) {
        this.getTaskList();
      }
    }
  }
  getTaskList() {
    return __async(this, null, function* () {
      const res = yield this.taskS.getTaskList(this.nCaseid, this.isFiletask ? "F" : "FT");
      if (res?.length > 0) {
        this.taskList = res[0];
        const taskReminder = res[2] || [];
        this.taskList?.map((a) => {
          var user = res[1]?.filter((b) => b.nTaskid == a.nTaskid);
          const reminder = taskReminder.find((b) => a.nTaskid == b.nTaskid);
          a["teamlist"] = user ? user : [];
          if (reminder) {
            a.dReminderDt = reminder.dReminderDt;
          }
        });
      }
      if (this.nTaskid) {
        this.selectedTask();
      }
      this.cdr.detectChanges();
    });
  }
  back() {
    this.OnEvent.emit({ event: "CLOSE", data: null });
    this.assignModeChange.emit(null);
  }
  selectedTask() {
    this.choosedtask = this.taskList?.find((a) => a.nTaskid == this.nTaskid);
    console.log("choosedtask", this.taskList, this.choosedtask);
  }
  addtask() {
    debugger;
    if (!this.choosedtask)
      return;
    const ind = this.selectedTasks.findIndex((a) => a.nTaskid == this.choosedtask.nTaskid);
    if (ind == -1) {
      this.selectedTasks.unshift(this.choosedtask);
      this.choosedtask = null;
      this.nTaskid = null;
      this.nTaskidChange.emit(this.nTaskid);
      this.OnEvent.emit({ event: "SUBMIT", data: {} });
    } else {
      this.tost.openSnackBar("Task already added", "E");
    }
  }
  remove(index) {
    this.OnEvent.emit({ event: "DELETE", data: this.selectedTasks[index] });
    this.selectedTasks.splice(index, 1);
  }
  edit() {
    this.cPermission = "E";
    this.ActiveForm = "T";
  }
  taskFormEvent(ev) {
    return __async(this, null, function* () {
      this.ActiveForm = "";
      if (this.choosedtask) {
        this.choosedtask = null;
      }
      if (ev.event == "CLOSE") {
        if (this.factsheetMode) {
          this.activeForm = null;
          this.activeFormChange.emit(this.activeForm);
        } else {
          this.cPermission = "N";
        }
      } else if (ev.event == "SUBMIT") {
        if (this.factsheetMode) {
          this.nTaskid = ev.data.nTaskid;
          this.nTaskidChange.emit(this.nTaskid);
          this.activeForm = "T";
          this.activeFormChange.emit(this.activeForm);
        } else {
          yield this.getTaskList();
          this.nTaskid = ev.data.nTaskid;
          if (this.nTaskid) {
            this.selectedTask();
          }
        }
      } else if (ev.event == "DELETE") {
        this.taskList = this.taskList.filter((a) => a.nTaskid != ev.data);
        this.selectedTasks = this.selectedTasks.filter((a) => a.nTaskid != ev.data);
        this.nTaskid = null;
        this.nTaskidChange.emit(this.nTaskid);
        this.activeForm = null;
        this.activeFormChange.emit(this.activeForm);
      }
    });
  }
  addNewTask() {
    if (this.nTaskid) {
      this.nTaskid = null;
    }
    if (this.choosedtask) {
      this.choosedtask = null;
    }
    this.ActiveForm = "T";
    this.cPermission = "N";
  }
  handleFactTaskChange(event) {
    this.nTaskid = event.value.nTaskid;
    this.nTaskidChange.emit(this.nTaskid);
  }
  static {
    this.\u0275fac = function AssignFactTaskComponent_Factory(t) {
      return new (t || _AssignFactTaskComponent)(\u0275\u0275directiveInject(TaskService), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AssignFactTaskComponent, selectors: [["assign-fact-task"]], inputs: { nCaseid: "nCaseid", assignModeChange: "assignModeChange", ActiveForm: "ActiveForm", hideResult: "hideResult", hideheader: "hideheader", nTaskid: "nTaskid", selectedTasks: "selectedTasks", cPermission: "cPermission", factsheetMode: "factsheetMode", activeForm: "activeForm", showEditBtn: "showEditBtn", isFiletask: "isFiletask" }, outputs: { nTaskidChange: "nTaskidChange", OnEvent: "OnEvent", activeFormChange: "activeFormChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 2, consts: [[1, "flex", "flex-col", "h-full"], [1, "block", "h-full", "overflow-auto", 3, "cPermission", "nCaseid", "editable_list", "isFiletask"], [1, "px-5", "pt-5", "pb-3", "flex", "items-center", "gap-2"], [1, "min-h-fit", "flex", "flex-col", "overflow-hidden", "pb-0"], [1, "border-tab", "border", "rounded-base", "bg-white"], [1, "flex", "gap-2", "items-center", "relative"], [1, "border-t"], ["placeholder", "Choose task", 1, "!border-none", 3, "ngModelChange", "selectionChange", "disabled", "ngModel"], [1, "flex", "items-center", "justify-between"], [1, "group", "nocheck", "!bg-faint", 2, "--mat-option-focus-state-layer-color", "#ffffff00", "--mat-option-hover-state-layer-color", "#ffffff00", 3, "value"], ["addcls", "w-full", 1, "mb-5", "block", "mt-3", "w-full", 3, "click", "disabled"], [1, "bg-reply", "overflow-hidden", "flex", "flex-col", 3, "class"], ["name", "chvy", 1, "text-xs", "mt-px", 3, "click"], [1, "font-semibold", "text-lg", "ms-2"], ["mode", "white", 1, "ms-auto", 3, "click"], ["width", "16", "height", "16", "viewBox", "0 0 16 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M0 8C-1.56548e-08 6.94943 0.206926 5.90914 0.608964 4.93853C1.011 3.96793 1.60028 3.08601 2.34315 2.34315C3.08601 1.60028 3.96793 1.011 4.93853 0.608964C5.90914 0.206926 6.94943 0 8 0C9.05058 0 10.0909 0.206926 11.0615 0.608964C12.0321 1.011 12.914 1.60028 13.6569 2.34315C14.3997 3.08601 14.989 3.96793 15.391 4.93853C15.7931 5.90914 16 6.94943 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 3.16163e-08 10.1217 0 8ZM8 4C7.82319 4 7.65362 4.07024 7.5286 4.19526C7.40357 4.32029 7.33333 4.48986 7.33333 4.66667V7.33333H4.66667C4.48986 7.33333 4.32029 7.40357 4.19526 7.5286C4.07024 7.65362 4 7.82319 4 8C4 8.17681 4.07024 8.34638 4.19526 8.47141C4.32029 8.59643 4.48986 8.66667 4.66667 8.66667H7.33333V11.3333C7.33333 11.5101 7.40357 11.6797 7.5286 11.8047C7.65362 11.9298 7.82319 12 8 12C8.17681 12 8.34638 11.9298 8.47141 11.8047C8.59643 11.6797 8.66667 11.5101 8.66667 11.3333V8.66667H11.3333C11.5101 8.66667 11.6797 8.59643 11.8047 8.47141C11.9298 8.34638 12 8.17681 12 8C12 7.82319 11.9298 7.65362 11.8047 7.5286C11.6797 7.40357 11.5101 7.33333 11.3333 7.33333H8.66667V4.66667C8.66667 4.48986 8.59643 4.32029 8.47141 4.19526C8.34638 4.07024 8.17681 4 8 4Z", "fill", "CurrentColor"], ["width", "14", "height", "15", "viewBox", "0 0 14 15", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "absolute", "left-5", "top-1/2", "-translate-y-1/2"], ["d", "M8.4308 0.640625C6.99106 0.640625 5.61028 1.21256 4.59223 2.23062C3.57417 3.24867 3.00223 4.62945 3.00223 6.0692C3.00223 7.25891 3.38509 8.35891 4.03366 9.25377L0.395947 12.8915C0.23866 13.0465 0.147259 13.2562 0.140794 13.4769C0.134328 13.6976 0.213298 13.9123 0.361243 14.0763C0.509188 14.2402 0.714691 14.3407 0.934921 14.3569C1.15515 14.373 1.37311 14.3035 1.54338 14.1629L1.60852 14.1041L5.24623 10.4663C6.17185 11.1385 7.28687 11.4996 8.4308 11.4978C9.87055 11.4978 11.2513 10.9258 12.2694 9.90777C13.2874 8.88972 13.8594 7.50894 13.8594 6.0692C13.8594 4.62945 13.2874 3.24867 12.2694 2.23062C11.2513 1.21256 9.87055 0.640625 8.4308 0.640625ZM8.4308 2.35491C9.41589 2.35491 10.3606 2.74624 11.0572 3.4428C11.7538 4.13936 12.1451 5.08411 12.1451 6.0692C12.1451 7.05429 11.7538 7.99903 11.0572 8.69559C10.3606 9.39216 9.41589 9.78348 8.4308 9.78348C7.44571 9.78348 6.50097 9.39216 5.80441 8.69559C5.10784 7.99903 4.71652 7.05429 4.71652 6.0692C4.71652 5.08411 5.10784 4.13936 5.80441 3.4428C6.50097 2.74624 7.44571 2.35491 8.4308 2.35491Z", "fill", "#4F4F4F"], ["appendTo", "body", "bindLabel", "cSubject", "bindValue", "nTaskid", 1, "pagerefslct", "autocmpltselect", "w-full", "!pe-0", "!ps-9", "h-8.5", "overflow-hidden", "novalue-select", "ng-option-nocheck", 3, "change", "items", "placeholder"], ["ng-option-tmp", ""], [1, "height-fit", "w-full", "rounded-t-base", "overflow-hidden"], [1, "flex", "text-xs", "bg-grey", "text-white", "px-2.5", "h-[45px]", "items-center", "whitespace-nowrap", "mt-0"], [1, "line-clamp", 2, "--line-clamp", "1"], [1, "scont", "small", "ms-auto", "flex", "gap-1", "flex-row"], [1, "grid", "place-items-center", "rounded-full", "size-6", "bg-white", "text-gray-500"], [1, "p-2.5", "bg-white", "border", "border-[#aeaeae]/50"], [1, "text-xs", "border-4", "border-tab", "rounded-base", "p-2", "mb-3", "whitespace-pre-wrap", "break-words"], [1, "h-[68px]", "flex", "items-baseline", "p-2.5", "justify-between", "bg-faint", "rounded-base", "gap-2.5", "text-xs"], [1, "midright", "text-center"], [1, "font-semibold", "text-center"], [1, "text-xs", "text-center"], [1, "left", "flex", "flex-col", "gap-1", "items-center"], [1, "font-semibold"], ["name", "temp", "type", "extra", 1, "text-base"], [1, "midleft", "text-center", "!w-1/4"], [1, "mt-2", "text-xxs", "font-semibold", "flex", "items-center", "flex-col"], [1, "min-h-2", "flex", "w-full", "bg-tab", "rounded-lg"], [1, "bg-blue-on", "h-[8px]", "rounded-full"], [1, "text-xs"], ["size", "sm", 1, "block", 3, "!-me-3", "detail", "matTooltip"], ["size", "sm", 1, "block", 3, "detail", "matTooltip"], ["name", "edit", 1, "ms-auto", "me-2.5", "text-sm", "text-grey"], ["name", "edit", 1, "ms-auto", "me-2.5", "text-sm", "text-grey", 3, "click"], [1, "text-xs", "border-4", "border-tab", "rounded-base", "p-2", "mb-3"], [1, "bg-reply", "overflow-hidden", "flex", "flex-col"], [1, "block", "overflow-auto"], [1, "group", "relative"], [1, "height-fit", "rounded-t-base", "overflow-hidden", "mb-3", "relative"], [1, "flex", "text-xs", "bg-grey", "text-white", "px-2.5", "h-[45px]", "items-center", "whitespace-nowrap", "mt-0", "group"], [1, "flex", "items-baseline", "p-2.5", "justify-between", "bg-faint", "rounded-base", "gap-2.5", "text-xs"], [1, "midleft"], ["name", "removefill", 1, "text-xl", "absolute", "right-0", "hidden", "group-hover:flex", "-bottom-2", 3, "click"], [1, "block", "h-full", "overflow-auto", 3, "OnEvent", "taskForm", "cPermission", "nCaseid", "editable_list", "isFiletask"]], template: function AssignFactTaskComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, AssignFactTaskComponent_Conditional_0_Template, 17, 11, "div", 0)(1, AssignFactTaskComponent_Conditional_1_Template, 1, 4, "task-form", 1);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, !ctx.ActiveForm ? 0 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.ActiveForm == "T" ? 1 : -1);
      }
    }, dependencies: [IconComponent, ButtonComponent, MatSelectModule, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, AvatarComponent, MatTooltipModule, MatTooltip, TaskFormComponent, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective, DatePipe], styles: ["\n\n.dsbl[_ngcontent-%COMP%] {\n  opacity: 0.75 !important;\n  filter: grayscale(1);\n  pointer-events: none;\n}\n/*# sourceMappingURL=assign-fact-task.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AssignFactTaskComponent, { className: "AssignFactTaskComponent", filePath: "src\\app\\marking\\components\\fact\\assign-fact-task\\assign-fact-task.component.ts", lineNumber: 23 });
})();

export {
  AssignContactComponent,
  AssignFactTaskComponent
};
//# sourceMappingURL=chunk-3DJDE5W7.js.map
