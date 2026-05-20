import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  MatSlideToggleModule
} from "./chunk-43QUFIPG.js";
import {
  UserService
} from "./chunk-E4U5AV5T.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField,
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
import {
  InputComponent
} from "./chunk-FEMUAMTL.js";
import {
  RolepermitService
} from "./chunk-TECZMXLZ.js";
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
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  CheckboxControlValueAccessor,
  FormBuilder,
  FormControlName,
  FormGroupDirective,
  NgControlStatus,
  NgControlStatusGroup,
  ReactiveFormsModule,
  RequiredValidator,
  Validators,
  ɵNgNoValidate
} from "./chunk-CIO7JDBK.js";
import {
  environment
} from "./chunk-UA722RUW.js";
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
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/casebuilder/usercreation/usercreation.component.ts
var _c0 = () => ({ name: "lock", "dir": "L" });
function UsercreationComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 5);
    \u0275\u0275element(2, "path", 6);
    \u0275\u0275elementEnd()();
  }
}
function UsercreationComponent_Conditional_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " My Account ");
  }
}
function UsercreationComponent_Conditional_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.nUserid != null ? "Edit" : "Add", " User ");
  }
}
function UsercreationComponent_Conditional_2_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "img", 18);
    \u0275\u0275listener("error", function UsercreationComponent_Conditional_2_Conditional_9_Template_img_error_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPathError());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("src", ctx_r1.path, \u0275\u0275sanitizeUrl);
  }
}
function UsercreationComponent_Conditional_2_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2("", ctx_r1.initials == null ? null : ctx_r1.initials.Fn, "", ctx_r1.initials == null ? null : ctx_r1.initials.Ln, "");
  }
}
function UsercreationComponent_Conditional_2_btn_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 20);
    \u0275\u0275listener("click", function UsercreationComponent_Conditional_2_btn_11_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.getFile());
    });
    \u0275\u0275element(1, "icon", 21);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275property("issmall", true)("square", true);
  }
}
function UsercreationComponent_Conditional_2_btn_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 22);
    \u0275\u0275listener("click", function UsercreationComponent_Conditional_2_btn_12_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.getFile());
    });
    \u0275\u0275text(1, "Upload");
    \u0275\u0275elementEnd();
  }
}
function UsercreationComponent_Conditional_2_Conditional_14_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 28);
    \u0275\u0275listener("click", function UsercreationComponent_Conditional_2_Conditional_14_Conditional_6_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.iseditenabled = true);
    });
    \u0275\u0275text(1, " Edit ");
    \u0275\u0275elementEnd();
  }
}
function UsercreationComponent_Conditional_2_Conditional_14_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 27);
    \u0275\u0275text(1, "System notification preferences are set individually within each case. ");
    \u0275\u0275elementEnd();
  }
}
function UsercreationComponent_Conditional_2_Conditional_14_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 29)(1, "div", 30)(2, "h6", 31);
    \u0275\u0275text(3, "Email:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p");
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 32)(7, "h6", 31);
    \u0275\u0275text(8, "Role:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p");
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 32)(12, "h6", 31);
    \u0275\u0275text(13, "Team:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "p");
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(16, "div", 33)(17, "h6", 31);
    \u0275\u0275text(18, "Timezone:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "p");
    \u0275\u0275text(20);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(21, "hr", 34);
    \u0275\u0275elementStart(22, "div", 25)(23, "h6", 35);
    \u0275\u0275text(24, "System Notification Preferences:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "div", 36)(26, "h6");
    \u0275\u0275text(27, "How would you like to be notified?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "mat-checkbox", 37);
    \u0275\u0275text(29, "While online etabella ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(30, "div", 38)(31, "div", 39)(32, "h6");
    \u0275\u0275text(33, "Default notification");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "mat-checkbox", 37);
    \u0275\u0275text(35, "Turn on all");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(36, "h6", 40);
    \u0275\u0275text(37, "Shares");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(38, "div", 41)(39, "mat-checkbox", 37);
    \u0275\u0275text(40, "Issue");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(41, "mat-checkbox", 37);
    \u0275\u0275text(42, "Doc Link");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(43, "mat-checkbox", 37);
    \u0275\u0275text(44, "Fact");
    \u0275\u0275elementEnd();
    \u0275\u0275element(45, "div");
    \u0275\u0275elementStart(46, "mat-checkbox", 37);
    \u0275\u0275text(47, "Task");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(48, "mat-checkbox", 42);
    \u0275\u0275text(49, "Presentation invitation request");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cEmail);
    \u0275\u0275advance();
    \u0275\u0275property("hidden", !ctx_r1.nCaseid);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate2("", ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cRole, " ", ctx_r1.getrolenamebyid(ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.nRoleid), " ");
    \u0275\u0275advance();
    \u0275\u0275property("hidden", !ctx_r1.nCaseid);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate2("", ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cTeamname, " ", ctx_r1.getteamnamebyid(ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.nTeamid), " ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("", ctx_r1.gettimezonebyid(ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.nTZid), " ");
  }
}
function UsercreationComponent_Conditional_2_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17)(1, "div", 23)(2, "h6", 24);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 25);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, UsercreationComponent_Conditional_2_Conditional_14_Conditional_6_Template, 2, 0, "btn", 26);
    \u0275\u0275elementEnd();
    \u0275\u0275element(7, "hr");
    \u0275\u0275template(8, UsercreationComponent_Conditional_2_Conditional_14_Conditional_8_Template, 2, 0, "h6", 27)(9, UsercreationComponent_Conditional_2_Conditional_14_Conditional_9_Template, 50, 8);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275classProp("flex-col", ctx_r1.ismyfiles)("items-center", !ctx_r1.ismyfiles)("gap-2", !ctx_r1.ismyfiles);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cFname, " ", ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cLname, "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cEmail);
    \u0275\u0275advance();
    \u0275\u0275conditional(6, !ctx_r1.iseditenabled && ctx_r1.isEditPermission && !ctx_r1.ismyfiles ? 6 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(8, ctx_r1.ismyfiles ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(9, !ctx_r1.ismyfiles ? 9 : -1);
  }
}
function UsercreationComponent_Conditional_2_Conditional_15_mat_option_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 62);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const team_r8 = ctx.$implicit;
    \u0275\u0275property("value", team_r8.nTeamid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", team_r8.cTeamname, " ");
  }
}
function UsercreationComponent_Conditional_2_Conditional_15_span_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 58);
    \u0275\u0275text(1, "*");
    \u0275\u0275elementEnd();
  }
}
function UsercreationComponent_Conditional_2_Conditional_15_mat_option_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 63);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const role_r9 = ctx.$implicit;
    \u0275\u0275property("disabled", role_r9["disabled"])("value", role_r9.nRoleid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", role_r9.cRole, " ");
  }
}
function UsercreationComponent_Conditional_2_Conditional_15_mat_option_31_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 62);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const zone_r10 = ctx.$implicit;
    \u0275\u0275property("value", zone_r10.nValue);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", zone_r10.cKey, " ");
  }
}
function UsercreationComponent_Conditional_2_Conditional_15_Conditional_34_label_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "label", 61);
    \u0275\u0275element(1, "input", 65)(2, "icon", 66);
    \u0275\u0275text(3, " Change Password ");
    \u0275\u0275elementEnd();
  }
}
function UsercreationComponent_Conditional_2_Conditional_15_Conditional_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, UsercreationComponent_Conditional_2_Conditional_15_Conditional_34_label_0_Template, 4, 0, "label", 64);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("ngIf", ctx_r1.nUserid && ctx_r1.iseditenabled);
  }
}
function UsercreationComponent_Conditional_2_Conditional_15_Conditional_35_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "h6", 50);
    \u0275\u0275text(2);
    \u0275\u0275elementStart(3, "span", 67)(4, "span", 68);
    \u0275\u0275text(5, "*");
    \u0275\u0275elementEnd();
    \u0275\u0275text(6, " ( min 8 characters,at least 1 special character and 1 digit)");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 69)(8, "inpt", 70);
    \u0275\u0275listener("valueChange", function UsercreationComponent_Conditional_2_Conditional_15_Conditional_35_Template_inpt_valueChange_8_listener($event) {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.userForm.controls["cPassword"].setValue($event));
    });
    \u0275\u0275text(9, " Enter a new password ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "inpt", 71);
    \u0275\u0275listener("valueChange", function UsercreationComponent_Conditional_2_Conditional_15_Conditional_35_Template_inpt_valueChange_10_listener($event) {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.userForm.controls["cConfirmpassword"].setValue($event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Enter ", ctx_r1.nUserid ? "a new" : "", " password ");
    \u0275\u0275advance(6);
    \u0275\u0275property("autofilloff", true)("icon", \u0275\u0275pureFunction0(11, _c0))("isrequired", ctx_r1.userForm.value["permission"] == "N" || ctx_r1.nUserid && !ctx_r1.userForm.value["isChangePass"])("showlabel", false)("value", ctx_r1.userForm.value["cPassword"]);
    \u0275\u0275advance(2);
    \u0275\u0275property("autofilloff", true)("icon", \u0275\u0275pureFunction0(12, _c0))("isrequired", ctx_r1.userForm.value["permission"] == "N" || ctx_r1.nUserid && !ctx_r1.userForm.value["isChangePass"])("showlabel", false)("value", ctx_r1.userForm.value["cConfirmpassword"]);
  }
}
function UsercreationComponent_Conditional_2_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 43)(1, "div", 44)(2, "inpt", 45);
    \u0275\u0275listener("valueChange", function UsercreationComponent_Conditional_2_Conditional_15_Template_inpt_valueChange_2_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      ctx_r1.userForm == null ? null : ctx_r1.userForm.controls["cFname"].setValue($event);
      return \u0275\u0275resetView(ctx_r1.intiialsProfile());
    });
    \u0275\u0275text(3, " First Name ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "inpt", 46);
    \u0275\u0275listener("valueChange", function UsercreationComponent_Conditional_2_Conditional_15_Template_inpt_valueChange_4_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      ctx_r1.userForm == null ? null : ctx_r1.userForm.controls["cLname"].setValue($event);
      return \u0275\u0275resetView(ctx_r1.intiialsProfile());
    });
    \u0275\u0275text(5, " Last Name ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 36)(7, "inpt", 47);
    \u0275\u0275listener("valueChange", function UsercreationComponent_Conditional_2_Conditional_15_Template_inpt_valueChange_7_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.userForm == null ? null : ctx_r1.userForm.controls["cEmail"].setValue($event));
    })("focusOut", function UsercreationComponent_Conditional_2_Conditional_15_Template_inpt_focusOut_7_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.checkEmail());
    });
    \u0275\u0275text(8, " Email ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 48)(10, "div", 49)(11, "h6", 50);
    \u0275\u0275text(12, "Team ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "mat-form-field", 51)(14, "mat-select", 52);
    \u0275\u0275listener("selectionChange", function UsercreationComponent_Conditional_2_Conditional_15_Template_mat_select_selectionChange_14_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.changeTeam($event));
    });
    \u0275\u0275template(15, UsercreationComponent_Conditional_2_Conditional_15_mat_option_15_Template, 2, 2, "mat-option", 53);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(16, "div", 49)(17, "h6", 50);
    \u0275\u0275text(18, "Role ");
    \u0275\u0275template(19, UsercreationComponent_Conditional_2_Conditional_15_span_19_Template, 2, 0, "span", 54);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "mat-form-field", 51)(21, "mat-select", 55);
    \u0275\u0275template(22, UsercreationComponent_Conditional_2_Conditional_15_mat_option_22_Template, 2, 3, "mat-option", 56);
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(23, "div", 57)(24, "div", 51)(25, "h6", 50);
    \u0275\u0275text(26, "Timezone");
    \u0275\u0275elementStart(27, "span", 58);
    \u0275\u0275text(28, "*");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(29, "mat-form-field", 51)(30, "mat-select", 59);
    \u0275\u0275template(31, UsercreationComponent_Conditional_2_Conditional_15_mat_option_31_Template, 2, 2, "mat-option", 53);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(32, "btn", 60);
    \u0275\u0275listener("click", function UsercreationComponent_Conditional_2_Conditional_15_Template_btn_click_32_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.chngtmzone = !ctx_r1.chngtmzone);
    });
    \u0275\u0275text(33);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(34, UsercreationComponent_Conditional_2_Conditional_15_Conditional_34_Template, 1, 1, "label", 61)(35, UsercreationComponent_Conditional_2_Conditional_15_Conditional_35_Template, 11, 13, "div");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("autofilloff", true)("isrequired", true)("showlabel", true)("value", ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cFname)("focus", true)("disabled", ctx_r1.nUserid && !ctx_r1.iseditenabled);
    \u0275\u0275advance(2);
    \u0275\u0275property("autofilloff", true)("isrequired", true)("showlabel", true)("value", ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cLname)("disabled", ctx_r1.nUserid && !ctx_r1.iseditenabled);
    \u0275\u0275advance(3);
    \u0275\u0275property("autofilloff", true)("isrequired", true)("showlabel", true)("value", ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cEmail)("disabled", ctx_r1.nUserid && !ctx_r1.iseditenabled);
    \u0275\u0275advance(6);
    \u0275\u0275classProp("isdisabled", ctx_r1.nUserid && !ctx_r1.iseditenabled || !ctx_r1.userInfo.isAdmin && ctx_r1.userForm.value.nTeamid || ctx_r1.ismyfiles);
    \u0275\u0275advance();
    \u0275\u0275classProp("isdisabled", (ctx_r1.userInfo == null ? null : ctx_r1.userInfo.isAdmin) && (!ctx_r1.nUTeamid || ctx_r1.userForm.value.nTeamid != ctx_r1.nUTeamid));
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.teamCombo);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", ctx_r1.userForm.value.nTeamid);
    \u0275\u0275advance();
    \u0275\u0275classProp("isdisabled", !ctx_r1.userForm.value["nTeamid"] || ctx_r1.userForm.value["nTeamid"] == "" || ctx_r1.nUserid && !ctx_r1.iseditenabled || ctx_r1.ismyfiles);
    \u0275\u0275advance();
    \u0275\u0275property("required", ctx_r1.userForm.value["nTeamid"]);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.rolelist);
    \u0275\u0275advance(7);
    \u0275\u0275classProp("isdisabled", !ctx_r1.chngtmzone);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.usrtmzone);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r1.nUserid && !ctx_r1.iseditenabled);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.chngtmzone ? "Disable" : "Enable", " User timezone");
    \u0275\u0275advance();
    \u0275\u0275conditional(34, ctx_r1.nUserid && !ctx_r1.userForm.value["isChangePass"] && !(ctx_r1.userData == null ? null : ctx_r1.userData.nUserid) ? 34 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(35, ctx_r1.permission == "N" || ctx_r1.userForm.value["isChangePass"] ? 35 : -1);
  }
}
function UsercreationComponent_Conditional_2_Conditional_16_Template(rf, ctx) {
}
function UsercreationComponent_Conditional_2_Conditional_17_Conditional_1_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "h6", 77);
    \u0275\u0275text(2, "Confirm Delete ?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 36)(4, "btn", 78);
    \u0275\u0275listener("click", function UsercreationComponent_Conditional_2_Conditional_17_Conditional_1_Conditional_7_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.deleteUser());
    });
    \u0275\u0275text(5, "Delete");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "btn", 79);
    \u0275\u0275text(7, "cancel");
    \u0275\u0275elementEnd()()();
  }
}
function UsercreationComponent_Conditional_2_Conditional_17_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 74);
    \u0275\u0275listener("click", function UsercreationComponent_Conditional_2_Conditional_17_Conditional_1_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(!(ctx_r1.userInfo == null ? null : ctx_r1.userInfo.isAdmin) && (!ctx_r1.nUTeamid || ctx_r1.userForm.value.nTeamid != ctx_r1.nUTeamid) ? null : ctx_r1.iseditenabled = true);
    });
    \u0275\u0275text(1, " Edit User Detail ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "btn", 75, 0);
    \u0275\u0275text(4, " Delete User ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "mat-menu", 76, 1);
    \u0275\u0275template(7, UsercreationComponent_Conditional_2_Conditional_17_Conditional_1_Conditional_7_Template, 8, 0, "div");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const delete_r14 = \u0275\u0275reference(6);
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("disabled", !(ctx_r1.userInfo == null ? null : ctx_r1.userInfo.isAdmin) && (!ctx_r1.nUTeamid || ctx_r1.userForm.value.nTeamid != ctx_r1.nUTeamid));
    \u0275\u0275advance(2);
    \u0275\u0275property("matMenuTriggerFor", (ctx_r1.userInfo == null ? null : ctx_r1.userInfo.isAdmin) || ctx_r1.nUTeamid && ctx_r1.userForm.value.nTeamid == ctx_r1.nUTeamid ? delete_r14 : null)("disabled", !(ctx_r1.userInfo == null ? null : ctx_r1.userInfo.isAdmin) && (!ctx_r1.nUTeamid || ctx_r1.userForm.value.nTeamid != ctx_r1.nUTeamid));
    \u0275\u0275advance(5);
    \u0275\u0275conditional(7, (ctx_r1.userInfo == null ? null : ctx_r1.userInfo.isAdmin) || ctx_r1.nUTeamid && ctx_r1.userForm.value.nTeamid == ctx_r1.nUTeamid ? 7 : -1);
  }
}
function UsercreationComponent_Conditional_2_Conditional_17_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 80);
    \u0275\u0275listener("click", function UsercreationComponent_Conditional_2_Conditional_17_Conditional_2_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.onSubmit());
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("disabled", ctx_r1.userForm.invalid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.nUserid != null ? (ctx_r1.userData == null ? null : ctx_r1.userData.nUserid) != null ? "Add User" : "Save Update" : "Create", " ");
  }
}
function UsercreationComponent_Conditional_2_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 72);
    \u0275\u0275template(1, UsercreationComponent_Conditional_2_Conditional_17_Conditional_1_Template, 8, 4)(2, UsercreationComponent_Conditional_2_Conditional_17_Conditional_2_Template, 2, 2, "btn", 73);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r1.nUserid != null && !ctx_r1.iseditenabled ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, !ctx_r1.nUserid || ctx_r1.iseditenabled ? 2 : -1);
  }
}
function UsercreationComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "form", 4)(1, "h6", 7);
    \u0275\u0275template(2, UsercreationComponent_Conditional_2_Conditional_2_Template, 1, 0)(3, UsercreationComponent_Conditional_2_Conditional_3_Template, 1, 1);
    \u0275\u0275elementStart(4, "icon", 8);
    \u0275\u0275listener("click", function UsercreationComponent_Conditional_2_Template_icon_click_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.close());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div", 9)(6, "div", 10)(7, "div", 11)(8, "span", 12);
    \u0275\u0275template(9, UsercreationComponent_Conditional_2_Conditional_9_Template, 1, 1, "img", 13)(10, UsercreationComponent_Conditional_2_Conditional_10_Template, 2, 2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(11, UsercreationComponent_Conditional_2_btn_11_Template, 2, 2, "btn", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275template(12, UsercreationComponent_Conditional_2_btn_12_Template, 2, 0, "btn", 15);
    \u0275\u0275elementStart(13, "input", 16);
    \u0275\u0275listener("change", function UsercreationComponent_Conditional_2_Template_input_change_13_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onFileChange($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(14, UsercreationComponent_Conditional_2_Conditional_14_Template, 10, 12, "div", 17)(15, UsercreationComponent_Conditional_2_Conditional_15_Template, 36, 33);
    \u0275\u0275elementEnd();
    \u0275\u0275template(16, UsercreationComponent_Conditional_2_Conditional_16_Template, 0, 0)(17, UsercreationComponent_Conditional_2_Conditional_17_Template, 3, 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("formGroup", ctx_r1.userForm);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, ctx_r1.ismyfiles ? 2 : 3);
    \u0275\u0275advance(6);
    \u0275\u0275classMap(ctx_r1.initials == null ? null : ctx_r1.initials.bg);
    \u0275\u0275advance();
    \u0275\u0275conditional(9, (ctx_r1.userForm == null ? null : ctx_r1.userForm.value == null ? null : ctx_r1.userForm.value.cProfile) != "" ? 9 : 10);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r1.nUserid && ctx_r1.iseditenabled || ctx_r1.ismyfiles);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r1.nUserid);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(14, ctx_r1.ismyfiles && !ctx_r1.iseditenabled ? 14 : 15);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(16, ctx_r1.ismyfiles && !ctx_r1.iseditenabled ? 16 : 17);
  }
}
var UsercreationComponent = class _UsercreationComponent {
  constructor(formBuilder, userS, ss, cdr, dialogRef, cf, data, rp, hs) {
    this.formBuilder = formBuilder;
    this.userS = userS;
    this.ss = ss;
    this.cdr = cdr;
    this.dialogRef = dialogRef;
    this.cf = cf;
    this.data = data;
    this.rp = rp;
    this.hs = hs;
    this.formsubmit = false;
    this.iseditenabled = false;
    this.isChangePass = false;
    this.chngtmzone = true;
    this.profileUrl = `${environment.documentStorage}${environment.userProfilePath}users/`;
    this.path = "assets/colorlogo.svg";
    this.isEditPermission = true;
    this.ismyfiles = false;
    this.nUserid = null;
    this.closeEvent = new EventEmitter();
    this.updateEvent = new EventEmitter();
    if (data) {
      this.nUserid = data["nUserid"];
      this.nCaseid = data["nCaseid"];
      this.nTeamid = data["nTeamid"];
      this.nUTeamid = data["nUTeamid"];
      this.ismyfiles = data["ismyfiles"];
      if (data["nUserid"]) {
        this.permission = "E";
      } else {
        this.permission = "N";
      }
    }
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userInfo = yield this.ss.getUserInfo();
      this.userForm = this.formBuilder.group({
        nUserid: [],
        nCaseid: [this.nCaseid],
        cProfile: [""],
        cFname: ["", [Validators.required]],
        cLname: ["", [Validators.required]],
        nRoleid: [null],
        cEmail: ["", [
          Validators.required,
          Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,30}$")
          //  //^([A-Z][a-z]*((\\s[A-Za-z])?[a-z]*)*)$
        ]],
        nTeamid: [this.nTeamid ? this.nTeamid : this.nUTeamid ? this.nUTeamid : null],
        nTZid: [null, [Validators.required]],
        isChangePass: [false],
        // cTwoway_auth: ['', [Validators.required]],
        cPassword: ["", Validators.pattern("^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$")],
        cConfirmpassword: ["", Validators.pattern("^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$")],
        permission: ["N", [Validators.required]]
      }, { validator: passwordMatchValidator });
      if (this.nCaseid) {
        this.getTeamCombo();
        this.getRoleCombo();
      }
      this.gettimezone();
      if (this.nUserid) {
        this.getUserdetail();
        this.verifyPermission();
      } else {
        this.updatePasswordValidation();
      }
    });
  }
  afterViewInit() {
    this.data.ismyfiles = this.ismyfiles;
    this.data.nUserid = this.nUserid;
  }
  updatePasswordValidation() {
    const passwordValidators = [
      Validators.pattern("^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$")
    ];
    if (!this.nUserid || this.userForm.value.cPermission == "E" && this.userForm.value.isChangePass) {
      passwordValidators.push(Validators.required);
    }
    this.userForm.get("cPassword").setValidators(passwordValidators);
    this.userForm.get("cConfirmpassword").setValidators(passwordValidators);
  }
  close() {
    if (this.ismyfiles) {
      this.closeEvent.emit();
    } else {
      this.dialogRef.close();
    }
  }
  getTeamCombo() {
    this.userS.teamCombo(this.nCaseid).then((res) => {
      this.teamCombo = res;
    });
  }
  getRoleCombo() {
    this.userS.roleCombo().then((res) => {
      this.rolelist = res;
      if (this.userForm.value.nTeamid) {
        this.changeTeam({ value: this.userForm.value.nTeamid });
      }
    });
  }
  gettimezone() {
    return __async(this, null, function* () {
      this.usrtmzone = yield this.userS.timezoneCombo();
      var ind = this.usrtmzone.findIndex((a) => a.jOther.includes(Intl.DateTimeFormat().resolvedOptions().timeZone));
      if (ind && ind >= 0) {
        var obj = this.usrtmzone[ind];
        this.chngtmzone = false;
        this.userForm.patchValue({
          nTZid: obj.nValue
        });
      }
    });
  }
  getUserdetail() {
    return __async(this, null, function* () {
      var mdl = { nCaseid: this.nCaseid, nUserid: this.nUserid };
      var res = yield this.userS.userDetail(mdl);
      if (res) {
        this.userForm.patchValue({
          nUserid: res["nUserid"],
          nCaseid: this.nCaseid,
          cProfile: res["cProfile"] ? res["cProfile"] : "",
          cFname: res["cFname"],
          nTZid: res["nTZid"],
          cLname: res["cLname"],
          nRoleid: res["nRoleid"],
          cEmail: res["cEmail"],
          nTeamid: this.nTeamid ? this.nTeamid : res["nTeamid"] ? res["nTeamid"] : this.nUTeamid ? this.nUTeamid : null,
          permission: "E"
        });
        this.intiialsProfile();
        if (res["cProfile"]) {
          this.path = this.profileUrl + res["cProfile"];
        }
      }
      this.cdr.detectChanges();
    });
  }
  onSubmit() {
    return __async(this, null, function* () {
      if (this.userForm.valid) {
        var mdl = this.userForm.value;
        if (mdl.permission == "E" && !mdl["isChangePass"]) {
          mdl["cPassword"] = "";
        }
        delete mdl["cConfirmpassword"];
        delete mdl["isChangePass"];
        mdl = this.clean(mdl);
        let res = yield this.userS.userBuilder(mdl);
        if (res) {
          this.dialogRef.close({ isSave: true, t: mdl.nTeamid, r: mdl.nTeamid, cProfile: this.path, cFname: mdl.cFname, cLname: mdl.cLname });
        } else {
          this.userForm.patchValue({
            "cConfirmpassword": mdl.cPassword
          });
        }
      }
    });
  }
  clean(obj) {
    for (var propName in obj) {
      if (obj[propName] === null || obj[propName] === void 0) {
        delete obj[propName];
      }
    }
    return obj;
  }
  deleteUser() {
    return __async(this, null, function* () {
      let res = yield this.userS.userDelete({ nUserid: this.nUserid, permission: "D" });
      if (res) {
        this.dialogRef.close({ isSave: true, delete: true });
      }
    });
  }
  intiialsProfile() {
    return __async(this, null, function* () {
      this.initials = yield this.cf.get_userinit({ "cFname": this.userForm.value["cFname"], "cLname": this.userForm.value["cLname"] });
    });
  }
  changeTeam(event) {
    var team = this.teamCombo.find((e) => e.nTeamid == event.value);
    if (team.cFlag && team.cFlag == "W" && ![this.rp.roles["3"], this.rp.roles["4"]].includes(this.userForm.value.nRoleid)) {
      this.userForm.patchValue({ nRoleid: null });
    }
    if (team.cFlag && team.cFlag != "W" && team.cFlag != "" && ![this.rp.roles["1"], this.rp.roles["2"], this.rp.roles["5"]].includes(this.userForm.value.nRoleid)) {
      this.userForm.patchValue({ nRoleid: null });
      this.rolelist.forEach((role) => {
        if (team.cFlag && team.cFlag == "W") {
          role["disabled"] = ![this.rp.roles["3"], this.rp.roles["4"]].includes(role["nRoleid"]) ? true : false;
        }
      });
    }
    this.setRole(team);
    if (this.userForm.value.nTeamid) {
      this.userForm.get("nRoleid").setValidators([Validators.required]);
    } else {
      this.userForm.get("nRoleid").setValidators([]);
    }
  }
  setRole(team) {
    this.rolelist.forEach((role) => {
      if (team.cFlag && team.cFlag == "W") {
        role["disabled"] = ![this.rp.roles["3"], this.rp.roles["4"]].includes(role["nRoleid"]) ? true : false;
      } else if (team.cFlag && team.cFlag != "W" && team.cFlag != "") {
        role["disabled"] = ![this.rp.roles["1"], this.rp.roles["2"], this.rp.roles["5"]].includes(role["nRoleid"]) ? true : false;
        if (!this.userInfo.isAdmin && this.rp.roles["1"].includes(role["nRoleid"])) {
          role["disabled"] = true;
        }
      } else {
        role["disabled"] = false;
      }
    });
  }
  checkEmail() {
    return __async(this, null, function* () {
      if (this.userForm.value.permission == "N" || this.userForm.value.permission == "E" && this.userData && this.userData.nUserid) {
        if (this.userForm.value.cEmail && this.userForm.controls["cEmail"].valid) {
          this.userData = yield this.userS.checkEmailexists(this.userForm.value.cEmail, this.nCaseid);
          this.updateUser();
        }
      }
    });
  }
  updateUser() {
    if (this.userData && this.userData?.cEmail) {
      this.removeRequired("cPassword");
      this.removeRequired("cConfirmpassword");
      this.userForm.patchValue({
        nUserid: this.userData.nUserid,
        cFname: this.userData.cFname,
        cLname: this.userData.cLname,
        nRoleid: this.userData["nRoleid"],
        nTeamid: this.userData["nTeamid"] ? this.userData["nTeamid"] : this.nUTeamid,
        nTZid: this.userData["nTZid"],
        permission: "E",
        cPassword: "",
        cConfirmpassword: ""
      });
      this.nUserid = this.userData.nUserid;
      if (this.userInfo?.isAdmin || this.userForm.value.nTeamid == this.nUTeamid) {
        this.iseditenabled = true;
      }
      if (!this.userInfo?.isAdmin && this.iseditenabled) {
        if (this.userForm.value.nRoleid && this.userForm.value.nRoleid === this.rp.roles["1"]) {
          this.userForm.get("nRoleid")?.disable();
        } else {
          this.userForm.get("nRoleid")?.enable();
        }
      }
      this.changeTeam({ value: this.userForm.value.nTeamid });
    } else {
      this.updatePasswordValidation();
      this.userData = null;
      this.nUserid = null;
      this.userForm.patchValue({
        nUserid: null,
        isChangePass: true,
        permission: "N"
      });
    }
  }
  removeRequired(key) {
    const control = this.userForm.controls[key];
    control?.clearValidators();
    control?.updateValueAndValidity();
  }
  getFile() {
    const fileInput = document.querySelector("#userprofile");
    fileInput.click();
  }
  onFileChange(e) {
    return __async(this, null, function* () {
      this.hs.userdetail = yield this.ss.getUserInfo();
      if (!e.target.files[0])
        return;
      const formData = new FormData();
      formData.append("rootPath", "users");
      formData.append("file", e.target.files[0]);
      const res = yield this.userS.userProfileUpload(formData);
      console.log("onFileChange", res);
      if (res?.msg == 1) {
        this.userForm.patchValue({
          cProfile: res.value
        });
        this.path = this.profileUrl + res.value;
        if (this.ismyfiles) {
          this.onSubmit();
          this.hs.userdetail.cProfile = res.value;
          yield this.ss.setUserInfo(this.hs.userdetail, 1);
          this.updateEvent.emit();
          this.cdr.detectChanges();
        }
      }
    });
  }
  getrolenamebyid(nRoleid) {
    return this.rolelist?.find((e) => e.nRoleid == nRoleid)?.cRole;
  }
  getteamnamebyid(nTeamid) {
    return this.teamCombo?.find((e) => e.nTeamid == nTeamid)?.cTeamname;
  }
  gettimezonebyid(nTZid) {
    return this.usrtmzone?.find((e) => e.nValue == nTZid)?.jOther;
  }
  onPathError() {
    this.path = "assets/colorlogo.svg";
    this.cdr.detectChanges();
  }
  verifyPermission() {
    this.isEditPermission = this.rp.verifyPermission("EP");
  }
  static {
    this.\u0275fac = function UsercreationComponent_Factory(t) {
      return new (t || _UsercreationComponent)(\u0275\u0275directiveInject(FormBuilder), \u0275\u0275directiveInject(UserService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(MatDialogRef, 8), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(MAT_DIALOG_DATA, 8), \u0275\u0275directiveInject(RolepermitService), \u0275\u0275directiveInject(HeaderService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UsercreationComponent, selectors: [["app-usercreation"]], inputs: { ismyfiles: "ismyfiles", nUserid: "nUserid" }, outputs: { closeEvent: "closeEvent", updateEvent: "updateEvent" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 3, vars: 4, consts: [["t", "matMenuTrigger"], ["delete", "matMenu"], [1, "h-fit", "w-full", "p-5"], [1, "absolute", "-top-4", "right-8"], [1, "h-fit", "flex", "flex-col", 3, "formGroup"], ["width", "22", "height", "19", "viewBox", "0 0 22 19", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "overflow-visible"], ["d", "M10.134 0.499999C10.5189 -0.166668 11.4811 -0.166667 11.866 0.5L21.3923 17C21.7772 17.6667 21.2961 18.5 20.5263 18.5L1.47372 18.5C0.703919 18.5 0.222795 17.6667 0.607695 17L10.134 0.499999Z", "fill", "#FAFAFA", 2, "filter", "drop-shadow(0px -3px 2px #0000001f)"], [1, "text-lg", "flex", "justify-between", "font-semibold", "mb-5"], ["name", "close", 1, "text-xs", "ms-auto", "cursor-pointer", "hover:text-blue-500", 3, "click"], [1, "flex", "gap-9"], [1, "w-28", "flex", "flex-col", "items-center"], [1, "relative"], [1, "inline-flex", "overflow-hidden", "items-center", "justify-center", "size-[76px]", "rounded-full", "font-semibold", "text-white", "leading-none", "border", "border-[#DAE2EA]"], [1, "object-cover", "w-full", "h-full", 3, "src"], ["mode", "outlined", "addcls", "!rounded-full hover:bg-white hover:border-blue-on", "class", "absolute right-0 bottom-0", 3, "issmall", "square", "click", 4, "ngIf"], ["mode", "white", "class", "mt-6", 3, "click", 4, "ngIf"], ["accept", "image/*", "type", "file", "id", "userprofile", "hidden", "", 3, "change"], [1, "w-full", "flex", "flex-col", "gap-2"], [1, "object-cover", "w-full", "h-full", 3, "error", "src"], [1, "text-3xl", "uppercase", "tracking-wider"], ["mode", "outlined", "addcls", "!rounded-full hover:bg-white hover:border-blue-on", 1, "absolute", "right-0", "bottom-0", 3, "click", "issmall", "square"], ["name", "edit", 1, "text-xxs"], ["mode", "white", 1, "mt-6", 3, "click"], [1, "flex", "w-full"], [1, "text-sm", "font-bold"], [1, "text-xs"], [1, "ms-auto"], [1, "text-xxs", "text-grey", "font-normal"], [1, "ms-auto", 3, "click"], [1, "flex", "gap-2", "text-xs"], [1, "w-1/3"], [1, "font-semibold", "mb-1"], [1, "w-1/3", 3, "hidden"], [1, "w-full", "text-xs", "mt-3"], [1, "my-2.5"], [1, "font-semibold", "mb-6"], [1, "flex", "gap-2"], ["checked", "", "disabled", "", 2, "--mdc-checkbox-disabled-selected-icon-color", "#ff600057"], ["hidden", ""], [1, "flex", "gap-2", "mt-6"], [1, "mt-3"], [1, "gap-2", "mt-3", "grid", "grid-cols-5"], ["checked", "", "disabled", "", 1, "col-span-3", 2, "--mdc-checkbox-disabled-selected-icon-color", "#ff600057"], [1, "position-relative", "flex", "gap-6", "flex-col", "w-full"], [1, "flex", "gap-2", "w-full"], ["id", "firstname", "type", "text", "placeholder", "First Name", 1, "w-full", 3, "valueChange", "autofilloff", "isrequired", "showlabel", "value", "focus", "disabled"], ["type", "text", "placeholder", "Last Name", 1, "w-full", 3, "valueChange", "autofilloff", "isrequired", "showlabel", "value", "disabled"], ["type", "text", "placeholder", "Enter your email", 1, "w-1/2", 3, "valueChange", "focusOut", "autofilloff", "isrequired", "showlabel", "value", "disabled"], [1, "w-1/2", "flex", "items-center", "gap-2"], [1, "w-1/2"], [1, "text-xs", "mb-2", "font-semibold"], [1, "w-full"], ["formControlName", "nTeamid", "placeholder", "Select..", 3, "selectionChange"], [3, "value", 4, "ngFor", "ngForOf"], ["class", "text-red-500", 4, "ngIf"], ["formControlName", "nRoleid", "placeholder", "Select..", 3, "required"], [3, "disabled", "value", 4, "ngFor", "ngForOf"], [1, "flex", "gap-2", "items-end"], [1, "text-red-500"], ["formControlName", "nTZid", "placeholder", "Select.."], ["mode", "white", 3, "click", "disabled"], ["for", "password", 1, "relative", "w-fit", "px-3", "py-2", "rounded-base", "text-xs", "border", "block", "hover:border-blue-400", "hover:text-blue-500", "cursor-pointer"], [3, "value"], [3, "disabled", "value"], ["for", "password", "class", "relative w-fit px-3 py-2 rounded-base text-xs border  block hover:border-blue-400 hover:text-blue-500 cursor-pointer", 4, "ngIf"], ["autocomplete", "new-password", "type", "checkbox", "name", "password", "id", "password", "formControlName", "isChangePass", 1, "size-0", "p-0"], ["name", "lock", 1, "me-2"], [1, "text-xxs", "font-normal"], [1, "text-red-600"], [1, "flex", "gap-3", "w-full", "pb-6"], ["type", "password", "placeholder", "Password", 1, "w-full", 3, "valueChange", "autofilloff", "icon", "isrequired", "showlabel", "value"], ["type", "password", "placeholder", "Re-type Password", 1, "w-full", 3, "valueChange", "autofilloff", "icon", "isrequired", "showlabel", "value"], [1, "flex", "items-center", "gap-2", "justify-end", "mt-6"], [1, "mt-auto", 3, "disabled"], [1, "ms-auto", "mt-auto", 3, "click", "disabled"], ["mode", "outlined", 1, "mt-auto", 3, "matMenuTriggerFor", "disabled"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [3, "click"], ["mode", "dark"], [1, "mt-auto", 3, "click", "disabled"]], template: function UsercreationComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 2);
        \u0275\u0275template(1, UsercreationComponent_Conditional_1_Template, 3, 0, "div", 3)(2, UsercreationComponent_Conditional_2_Template, 18, 9, "form", 4);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275classProp("overflow-visible", ctx.ismyfiles);
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.ismyfiles ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.userForm ? 2 : -1);
      }
    }, dependencies: [CommonModule, NgForOf, NgIf, ButtonComponent, InputComponent, ReactiveFormsModule, \u0275NgNoValidate, CheckboxControlValueAccessor, NgControlStatus, NgControlStatusGroup, RequiredValidator, FormGroupDirective, FormControlName, MatSelectModule, MatFormField, MatSelect, MatOption, IconComponent, MatFormFieldModule, MatSlideToggleModule, MatMenuModule, MatMenu, MatMenuTrigger, MatCheckboxModule, MatCheckbox] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UsercreationComponent, { className: "UsercreationComponent", filePath: "src\\app\\adminpanel\\components\\casebuilder\\usercreation\\usercreation.component.ts", lineNumber: 35 });
})();
var passwordMatchValidator = (control) => {
  const formGroup = control;
  const password = formGroup.get("cPassword");
  const confirmPassword = formGroup.get("cConfirmpassword");
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    confirmPassword?.setErrors(null);
    return null;
  }
};

export {
  UsercreationComponent
};
//# sourceMappingURL=chunk-3A6FZELH.js.map
