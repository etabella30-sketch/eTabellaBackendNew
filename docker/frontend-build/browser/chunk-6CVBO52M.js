import {
  NgOptionTemplateDirective,
  NgSelectComponent,
  NgSelectModule
} from "./chunk-E3GVDGCY.js";
import {
  MatSelect,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-BM3TWEH3.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  InputFlags,
  booleanAttribute,
  ɵsetClassDebugInfo,
  ɵɵInputTransformsFeature,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
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
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/marking/components/fact/teamshare/teamshare.component.ts
function TeamshareComponent_Conditional_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 16);
    \u0275\u0275text(1, "*");
    \u0275\u0275elementEnd();
  }
}
function TeamshareComponent_Conditional_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.activeContacts == null ? null : ctx_r0.activeContacts.length, " ");
  }
}
function TeamshareComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 0);
    \u0275\u0275text(1);
    \u0275\u0275template(2, TeamshareComponent_Conditional_1_Conditional_2_Template, 2, 0, "span", 16)(3, TeamshareComponent_Conditional_1_Conditional_3_Template, 2, 1, "span", 17);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", ctx_r0.title, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ctx_r0.required ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r0.required && (ctx_r0.activeContacts == null ? null : ctx_r0.activeContacts.length) ? 3 : -1);
  }
}
function TeamshareComponent_Conditional_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 20);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.activeContacts.length, " ");
  }
}
function TeamshareComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 18);
    \u0275\u0275element(2, "path", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " Private : My Team Only ");
    \u0275\u0275template(4, TeamshareComponent_Conditional_2_Conditional_4_Template, 2, 1, "span", 20);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275conditional(4, (ctx_r0.activeContacts == null ? null : ctx_r0.activeContacts.length) ? 4 : -1);
  }
}
function TeamshareComponent_ng_template_8_Conditional_8_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 27)(1, "div", 28)(2, "mat-checkbox", 29);
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_ng_template_8_Conditional_8_Conditional_0_Template_mat_checkbox_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r4);
      const item_r3 = \u0275\u0275nextContext(2).item;
      \u0275\u0275twoWayBindingSet(item_r3.bCanEdit, $event) || (item_r3.bCanEdit = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TeamshareComponent_ng_template_8_Conditional_8_Conditional_0_Template_mat_checkbox_ngModelChange_2_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.syncHeaderFromRows());
    });
    \u0275\u0275element(3, "span", 30);
    \u0275\u0275elementStart(4, "span", 31);
    \u0275\u0275text(5, " Edit ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(6, "div", 28)(7, "mat-checkbox", 29);
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_ng_template_8_Conditional_8_Conditional_0_Template_mat_checkbox_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r4);
      const item_r3 = \u0275\u0275nextContext(2).item;
      \u0275\u0275twoWayBindingSet(item_r3.bCanReshare, $event) || (item_r3.bCanReshare = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TeamshareComponent_ng_template_8_Conditional_8_Conditional_0_Template_mat_checkbox_ngModelChange_7_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.syncHeaderFromRows());
    });
    \u0275\u0275element(8, "span", 30);
    \u0275\u0275elementStart(9, "span", 31);
    \u0275\u0275text(10, " Re-share ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "div", 28)(12, "mat-checkbox", 29);
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_ng_template_8_Conditional_8_Conditional_0_Template_mat_checkbox_ngModelChange_12_listener($event) {
      \u0275\u0275restoreView(_r4);
      const item_r3 = \u0275\u0275nextContext(2).item;
      \u0275\u0275twoWayBindingSet(item_r3.bCanComment, $event) || (item_r3.bCanComment = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TeamshareComponent_ng_template_8_Conditional_8_Conditional_0_Template_mat_checkbox_ngModelChange_12_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.syncHeaderFromRows());
    });
    \u0275\u0275element(13, "span", 30);
    \u0275\u0275elementStart(14, "span", 31);
    \u0275\u0275text(15, " Comment ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const item_r3 = \u0275\u0275nextContext(2).item;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", item_r3.bCanEdit);
    \u0275\u0275property("disabled", ctx_r0.adminPDisabled && item_r3.isAdmin);
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", item_r3.bCanReshare);
    \u0275\u0275property("disabled", ctx_r0.adminPDisabled && item_r3.isAdmin);
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", item_r3.bCanComment);
    \u0275\u0275property("disabled", ctx_r0.adminPDisabled && item_r3.isAdmin);
  }
}
function TeamshareComponent_ng_template_8_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TeamshareComponent_ng_template_8_Conditional_8_Conditional_0_Template, 16, 6, "div", 27);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, !ctx_r0.isDocLink ? 0 : -1);
  }
}
function TeamshareComponent_ng_template_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "div", 21)(2, "div", 22)(3, "mat-checkbox", 23);
    \u0275\u0275listener("change", function TeamshareComponent_ng_template_8_Template_mat_checkbox_change_3_listener($event) {
      const item_r3 = \u0275\u0275restoreView(_r2).item;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.checkC($event, item_r3));
    });
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_ng_template_8_Template_mat_checkbox_ngModelChange_3_listener($event) {
      const item_r3 = \u0275\u0275restoreView(_r2).item;
      \u0275\u0275twoWayBindingSet(item_r3.isSelected, $event) || (item_r3.isSelected = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 24);
    \u0275\u0275element(5, "avtr", 25);
    \u0275\u0275elementStart(6, "div", 26);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(8, TeamshareComponent_ng_template_8_Conditional_8_Template, 1, 1);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r3 = ctx.item;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("ngModel", item_r3.isSelected);
    \u0275\u0275property("disabled", ctx_r0.adminPDisabled && item_r3.isAdmin);
    \u0275\u0275advance();
    \u0275\u0275classMap(item_r3.isSelected || ctx_r0.checkall ? "w-[45%] min-w-[100px]  max-w-[45%]" : "w-full");
    \u0275\u0275advance();
    \u0275\u0275property("detail", item_r3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", item_r3.cFname, " ", item_r3.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(8, item_r3.isSelected && !ctx_r0.disablePermissions ? 8 : -1);
  }
}
function TeamshareComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.activeContacts.length, " Team Member Selected ");
  }
}
function TeamshareComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.placeholder, " ");
  }
}
function TeamshareComponent_Conditional_20_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 32);
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_Conditional_20_Conditional_0_Template_mat_checkbox_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r0.Editall, $event) || (ctx_r0.Editall = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TeamshareComponent_Conditional_20_Conditional_0_Template_mat_checkbox_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onChangeAll($event, "E"));
    });
    \u0275\u0275elementStart(1, "span", 30);
    \u0275\u0275text(2, " Edit ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "mat-checkbox", 32);
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_Conditional_20_Conditional_0_Template_mat_checkbox_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r0.shareall, $event) || (ctx_r0.shareall = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TeamshareComponent_Conditional_20_Conditional_0_Template_mat_checkbox_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onChangeAll($event, "S"));
    });
    \u0275\u0275elementStart(4, "span", 33);
    \u0275\u0275text(5, "Re-share");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "mat-checkbox", 32);
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_Conditional_20_Conditional_0_Template_mat_checkbox_ngModelChange_6_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r0.Commentall, $event) || (ctx_r0.Commentall = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TeamshareComponent_Conditional_20_Conditional_0_Template_mat_checkbox_ngModelChange_6_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onChangeAll($event, "CM"));
    });
    \u0275\u0275elementStart(7, "span", 30);
    \u0275\u0275text(8, "Comment");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.Editall);
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.shareall);
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.Commentall);
  }
}
function TeamshareComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TeamshareComponent_Conditional_20_Conditional_0_Template, 9, 3);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275conditional(0, !ctx_r0.isDocLink ? 0 : -1);
  }
}
function TeamshareComponent_For_22_Conditional_9_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 27)(1, "div", 28)(2, "mat-checkbox", 29);
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_For_22_Conditional_9_Conditional_0_Template_mat_checkbox_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r8);
      const x_r7 = \u0275\u0275nextContext(2).$implicit;
      \u0275\u0275twoWayBindingSet(x_r7.bCanEdit, $event) || (x_r7.bCanEdit = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TeamshareComponent_For_22_Conditional_9_Conditional_0_Template_mat_checkbox_ngModelChange_2_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.syncHeaderFromRows());
    });
    \u0275\u0275elementStart(3, "span", 31);
    \u0275\u0275text(4, " Edit ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(5, "div", 28)(6, "mat-checkbox", 29);
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_For_22_Conditional_9_Conditional_0_Template_mat_checkbox_ngModelChange_6_listener($event) {
      \u0275\u0275restoreView(_r8);
      const x_r7 = \u0275\u0275nextContext(2).$implicit;
      \u0275\u0275twoWayBindingSet(x_r7.bCanReshare, $event) || (x_r7.bCanReshare = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TeamshareComponent_For_22_Conditional_9_Conditional_0_Template_mat_checkbox_ngModelChange_6_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.syncHeaderFromRows());
    });
    \u0275\u0275elementStart(7, "span", 31);
    \u0275\u0275text(8, " Re-share ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(9, "div", 28)(10, "mat-checkbox", 29);
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_For_22_Conditional_9_Conditional_0_Template_mat_checkbox_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r8);
      const x_r7 = \u0275\u0275nextContext(2).$implicit;
      \u0275\u0275twoWayBindingSet(x_r7.bCanComment, $event) || (x_r7.bCanComment = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function TeamshareComponent_For_22_Conditional_9_Conditional_0_Template_mat_checkbox_ngModelChange_10_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.syncHeaderFromRows());
    });
    \u0275\u0275elementStart(11, "span", 31);
    \u0275\u0275text(12, " Comment ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r7 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", x_r7.bCanEdit);
    \u0275\u0275property("disabled", ctx_r0.adminPDisabled && x_r7.isAdmin);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", x_r7.bCanReshare);
    \u0275\u0275property("disabled", ctx_r0.adminPDisabled && x_r7.isAdmin);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", x_r7.bCanComment);
    \u0275\u0275property("disabled", ctx_r0.adminPDisabled && x_r7.isAdmin);
  }
}
function TeamshareComponent_For_22_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, TeamshareComponent_For_22_Conditional_9_Conditional_0_Template, 13, 6, "div", 27);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(0, !ctx_r0.isDocLink ? 0 : -1);
  }
}
function TeamshareComponent_For_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-option", 15)(1, "div")(2, "div", 21)(3, "div", 22)(4, "mat-checkbox", 23);
    \u0275\u0275listener("change", function TeamshareComponent_For_22_Template_mat_checkbox_change_4_listener($event) {
      const x_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.checkC($event, x_r7));
    });
    \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_For_22_Template_mat_checkbox_ngModelChange_4_listener($event) {
      const x_r7 = \u0275\u0275restoreView(_r6).$implicit;
      \u0275\u0275twoWayBindingSet(x_r7.isSelected, $event) || (x_r7.isSelected = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 24);
    \u0275\u0275element(6, "avtr", 25);
    \u0275\u0275elementStart(7, "div", 26);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(9, TeamshareComponent_For_22_Conditional_9_Template, 1, 1);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r7 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("value", x_r7);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", x_r7.isSelected);
    \u0275\u0275property("disabled", ctx_r0.adminPDisabled && x_r7.isAdmin);
    \u0275\u0275advance();
    \u0275\u0275classMap(x_r7.isSelected || ctx_r0.checkall ? "w-[45%] min-w-[100px]  max-w-[45%]" : "w-full");
    \u0275\u0275advance();
    \u0275\u0275property("detail", x_r7);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", x_r7.cFname, " ", x_r7.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(9, x_r7.isSelected && !ctx_r0.disableEdit && !ctx_r0.disablePermissions ? 9 : -1);
  }
}
var TeamshareComponent = class _TeamshareComponent {
  constructor(cdr) {
    this.cdr = cdr;
    this.title = "Share with my team";
    this.placeholder = "Select a role in case to share";
    this.required = false;
    this.showbadge = false;
    this.disableEdit = false;
    this.adminPDisabled = false;
    this.activeContacts = [];
    this.checkall = false;
    this.Editall = false;
    this.shareall = false;
    this.Commentall = false;
    this.Copyall = false;
    this.isDocLink = false;
    this.userListChange = new EventEmitter();
  }
  // checkallbox(ev) {
  //   if (ev.checked) {
  //     this.demoUsers.forEach(x => {
  //       x.isChecked = true;
  //     });
  //     this.Editall = true;
  //     this.Commentall = true;
  //     this.shareall = true;
  //     this.Copyall = true;
  //   }
  //   else {
  //     this.demoUsers.forEach(x => {
  //       x.isChecked = false;
  //     });
  //   }
  // }
  ngOnInit() {
    if (!this.userList?.length) {
      this.userList = [];
    }
    this.syncActiveContacts();
    this.checkall = this.allSelected();
  }
  ngOnChanges(changes) {
    if (changes["userList"] && !changes["userList"].firstChange && this.userList) {
      for (const u of this.userList) {
        u.isSelected = !!u.isSelected;
        u.bCanEdit = !!u.bCanEdit;
        u.bCanCopy = !!u.bCanCopy;
        u.bCanReshare = !!u.bCanReshare;
        u.bCanComment = !!u.bCanComment;
      }
      this.syncActiveContacts();
      this.checkall = this.allSelected();
      this.syncHeaderFromRows();
    }
  }
  // ---------- Computed helpers ----------
  allSelected() {
    return (this.userList?.length ?? 0) > 0 && this.userList.every((u) => u.isSelected);
  }
  get selectAllIndeterminate() {
    const total = this.userList?.length ?? 0;
    const selected = this.userList?.filter((u) => u.isSelected).length ?? 0;
    return selected > 0 && selected < total;
  }
  // ---------- Core sync helpers ----------
  syncActiveContacts() {
    this.activeContacts = (this.userList ?? []).filter((u) => u.isSelected);
    this.cdr.detectChanges();
  }
  applyBulkPermissionsToSelected(type) {
    for (const u of this.userList ?? []) {
      if (this.adminPDisabled && u.isAdmin) {
        continue;
      }
      if (u.isSelected) {
        if (type == "E")
          u.bCanEdit = this.Editall;
        else if (type == "C")
          u.bCanCopy = this.Copyall;
        else if (type == "S")
          u.bCanReshare = this.shareall;
        else if (type == "CM")
          u.bCanComment = this.Commentall;
      }
    }
  }
  clearPermissions(u) {
    u.bCanEdit = false;
    u.bCanCopy = false;
    u.bCanReshare = false;
    u.bCanComment = false;
  }
  syncHeaderFromRows() {
    const sel = (this.userList ?? []).filter((u) => u.isSelected);
    if (sel.length === 0) {
      this.Editall = this.Copyall = this.shareall = this.Commentall = false;
      return;
    }
    this.Editall = sel.every((u) => !!u.bCanEdit);
    this.Copyall = sel.every((u) => !!u.bCanCopy);
    this.shareall = sel.every((u) => !!u.bCanReshare);
    this.Commentall = sel.every((u) => !!u.bCanComment);
  }
  // ---------- UI event handlers ----------
  checkallbox(ev) {
    const checked = ev.checked;
    this.checkall = checked;
    for (const u of this.userList ?? []) {
      if (this.adminPDisabled && u.isAdmin) {
        continue;
      }
      u.isSelected = checked;
      if (checked) {
        u.bCanEdit = true;
        u.bCanCopy = true;
        u.bCanReshare = true;
        u.bCanComment = true;
      } else {
        this.clearPermissions(u);
      }
    }
    this.userListChange.emit(this.userList);
    this.syncActiveContacts();
    if (checked) {
      this.Editall = this.Copyall = this.shareall = this.Commentall = true;
    } else {
      this.Editall = this.Copyall = this.shareall = this.Commentall = false;
    }
  }
  checkC(ev, x) {
    x.isSelected = ev.checked;
    if (!ev.checked) {
      this.clearPermissions(x);
    } else {
      x.bCanEdit = true;
      x.bCanCopy = true;
      x.bCanReshare = true;
      x.bCanComment = true;
    }
    this.checkall = this.allSelected();
    this.userListChange.emit(this.userList);
    this.syncActiveContacts();
    this.syncHeaderFromRows();
  }
  // Bulk header permissions – apply to currently selected rows
  onChangeAll(val, type) {
    if (type == "E") {
      this.Editall = val;
    } else if (type == "C") {
      this.Copyall = val;
    } else if (type == "S") {
      this.shareall = val;
    } else if (type == "CM") {
      this.Commentall = val;
    }
    this.applyBulkPermissionsToSelected(type);
  }
  static {
    this.\u0275fac = function TeamshareComponent_Factory(t) {
      return new (t || _TeamshareComponent)(\u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TeamshareComponent, selectors: [["teamshare"]], inputs: { title: "title", placeholder: "placeholder", required: [InputFlags.HasDecoratorInputTransform, "required", "required", booleanAttribute], showbadge: [InputFlags.HasDecoratorInputTransform, "showbadge", "showbadge", booleanAttribute], disableEdit: [InputFlags.HasDecoratorInputTransform, "disableEdit", "disableEdit", booleanAttribute], adminPDisabled: [InputFlags.HasDecoratorInputTransform, "adminPDisabled", "adminPDisabled", booleanAttribute], nCaseid: "nCaseid", userList: "userList", disablePermissions: "disablePermissions", isDocLink: "isDocLink" }, outputs: { userListChange: "userListChange" }, standalone: true, features: [\u0275\u0275InputTransformsFeature, \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 23, vars: 11, consts: [[1, "text-xs", "font-semibold", "mb-2", "flex", "gap-px"], [1, "px-2", "py-0.5", "font-semibold", "bg-blue-on", "text-white", "flex", "text-xs", "items-center", "gap-1", "mb-2"], [1, "border-tab", "border", "rounded-base", "bg-white"], [1, "flex", "gap-2", "items-center", "relative"], ["width", "14", "height", "15", "viewBox", "0 0 14 15", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "absolute", "left-5", "top-1/2", "-translate-y-1/2"], ["d", "M8.4308 0.640625C6.99106 0.640625 5.61028 1.21256 4.59223 2.23062C3.57417 3.24867 3.00223 4.62945 3.00223 6.0692C3.00223 7.25891 3.38509 8.35891 4.03366 9.25377L0.395947 12.8915C0.23866 13.0465 0.147259 13.2562 0.140794 13.4769C0.134328 13.6976 0.213298 13.9123 0.361243 14.0763C0.509188 14.2402 0.714691 14.3407 0.934921 14.3569C1.15515 14.373 1.37311 14.3035 1.54338 14.1629L1.60852 14.1041L5.24623 10.4663C6.17185 11.1385 7.28687 11.4996 8.4308 11.4978C9.87055 11.4978 11.2513 10.9258 12.2694 9.90777C13.2874 8.88972 13.8594 7.50894 13.8594 6.0692C13.8594 4.62945 13.2874 3.24867 12.2694 2.23062C11.2513 1.21256 9.87055 0.640625 8.4308 0.640625ZM8.4308 2.35491C9.41589 2.35491 10.3606 2.74624 11.0572 3.4428C11.7538 4.13936 12.1451 5.08411 12.1451 6.0692C12.1451 7.05429 11.7538 7.99903 11.0572 8.69559C10.3606 9.39216 9.41589 9.78348 8.4308 9.78348C7.44571 9.78348 6.50097 9.39216 5.80441 8.69559C5.10784 7.99903 4.71652 7.05429 4.71652 6.0692C4.71652 5.08411 5.10784 4.13936 5.80441 3.4428C6.50097 2.74624 7.44571 2.35491 8.4308 2.35491Z", "fill", "#4F4F4F"], ["appendTo", "body", "bindLabel", "cFname", "bindValue", "cFname", "placeholder", "Type to search by name of team member", 1, "pagerefslct", "autocmpltselect", "w-full", "!pe-0", "!ps-9", "h-8.5", "overflow-hidden", "novalue-select", "ng-option-no-checkmark", 3, "change", "items", "closeOnSelect"], ["ng-option-tmp", ""], [1, "border-t"], ["panelClass", "sortfltrpnl contactnew !p-2.5 px-2", "disableOptionCentering", "", 1, "sortfilterslct", "addcont", 3, "ngModelChange", "ngModel", "multiple", "placeholder"], [1, "bg-white"], [1, "bg-grey", "py-1", "mb-1", "flex", "items-center", "gap-2.5", "sticky", "top-0", "z-50", "px-5", "text-xs"], [3, "ngModelChange", "change", "ngModel", "indeterminate"], [1, "text-white", "w-[45%]", "text-end", "invisible"], [1, "w-full", "flex", "justify-end", "gap-2", "pe-3"], ["disabled", "", 1, "nocheck", "group", "!p-0", "mb-0.5", "last:mb-0", "pointer-events-auto", 2, "--mat-option-padding", "0", 3, "value"], [1, "text-sred"], [1, "h-[18px]", "min-w-[18px]", "max-w-[18px]", "rounded-full", "bg-tab", "flex", "text-xxs", "text-white", "items-center", "justify-center", "ms-1"], ["width", "13", "height", "16", "viewBox", "0 0 13 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M6.5 15.9172C6.40521 15.9172 6.31719 15.9105 6.23594 15.8972C6.15469 15.8839 6.07344 15.8639 5.99219 15.8372C4.16406 15.2372 2.70833 14.1273 1.625 12.5076C0.541667 10.8879 0 9.14439 0 7.27719V3.49719C0 3.16385 0.0983124 2.86385 0.294937 2.59719C0.491562 2.33052 0.745333 2.13719 1.05625 2.01719L5.93125 0.217188C6.12083 0.150521 6.31042 0.117188 6.5 0.117188C6.68958 0.117188 6.87917 0.150521 7.06875 0.217188L11.9437 2.01719C12.2552 2.13719 12.5092 2.33052 12.7059 2.59719C12.9025 2.86385 13.0005 3.16385 13 3.49719V7.27719C13 9.14386 12.4583 10.8873 11.375 12.5076C10.2917 14.1279 8.83594 15.2377 7.00781 15.8372C6.92656 15.8639 6.84531 15.8839 6.76406 15.8972C6.68281 15.9105 6.59479 15.9172 6.5 15.9172Z", "fill", "white"], [1, "h-[18px]", "min-w-[18px]", "max-w-[18px]", "rounded-full", "ms-auto", "bg-white", "flex", "text-xxs", "text-blue-on", "items-center", "justify-center"], [1, "px-5", "py-1", "hover:bg-blue-deactivate", "rounded-md", "flex", "text-xs", "items-center", "gap-2.5", "group-[.mdc-list-item--selected]:bg-blue-deactivate", "group-[.mdc-list-item--selected]:font-semibold"], [1, "flex", "items-center", "gap-2.5", "w-full"], [3, "change", "ngModelChange", "ngModel", "disabled"], [1, "flex", "items-center", "gap-1"], ["size", "sm", 3, "detail"], [1, "block", "truncate"], [1, "flex", "w-full", "gap-2", "pe-3"], [1, "w-2/6"], [3, "ngModelChange", "ngModel", "disabled"], [1, "text-white"], [1, "text-grey"], [1, "w-full", 3, "ngModelChange", "ngModel"], [1, "text-white", "whitespace-nowrap"]], template: function TeamshareComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div");
        \u0275\u0275template(1, TeamshareComponent_Conditional_1_Template, 4, 3, "h6", 0)(2, TeamshareComponent_Conditional_2_Template, 5, 1, "div", 1);
        \u0275\u0275elementStart(3, "div", 2)(4, "div", 3);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(5, "svg", 4);
        \u0275\u0275element(6, "path", 5);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(7, "ng-select", 6);
        \u0275\u0275listener("change", function TeamshareComponent_Template_ng_select_change_7_listener() {
          return ctx.syncActiveContacts();
        });
        \u0275\u0275template(8, TeamshareComponent_ng_template_8_Template, 9, 8, "ng-template", 7);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(9, "div", 8)(10, "mat-select", 9);
        \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_Template_mat_select_ngModelChange_10_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.activeContacts, $event) || (ctx.activeContacts = $event);
          return $event;
        });
        \u0275\u0275elementStart(11, "mat-select-trigger");
        \u0275\u0275template(12, TeamshareComponent_Conditional_12_Template, 2, 1, "ng-container")(13, TeamshareComponent_Conditional_13_Template, 2, 1);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "div", 10)(15, "div", 11)(16, "mat-checkbox", 12);
        \u0275\u0275twoWayListener("ngModelChange", function TeamshareComponent_Template_mat_checkbox_ngModelChange_16_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.checkall, $event) || (ctx.checkall = $event);
          return $event;
        });
        \u0275\u0275listener("change", function TeamshareComponent_Template_mat_checkbox_change_16_listener($event) {
          return ctx.checkallbox($event);
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(17, "div", 13);
        \u0275\u0275text(18, "Action:");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(19, "div", 14);
        \u0275\u0275template(20, TeamshareComponent_Conditional_20_Template, 1, 1);
        \u0275\u0275elementEnd()()();
        \u0275\u0275repeaterCreate(21, TeamshareComponent_For_22_Template, 10, 9, "mat-option", 15, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.title ? 1 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(2, ctx.showbadge ? 2 : -1);
        \u0275\u0275advance(5);
        \u0275\u0275property("items", ctx.userList)("closeOnSelect", false);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("ngModel", ctx.activeContacts);
        \u0275\u0275property("multiple", true)("placeholder", ctx.placeholder);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(12, ctx.activeContacts ? 12 : 13);
        \u0275\u0275advance(4);
        \u0275\u0275twoWayProperty("ngModel", ctx.checkall);
        \u0275\u0275property("indeterminate", ctx.selectAllIndeterminate);
        \u0275\u0275advance(4);
        \u0275\u0275conditional(20, ctx.checkall && !ctx.disableEdit && !ctx.disablePermissions ? 20 : -1);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.userList);
      }
    }, dependencies: [MatSelectModule, MatSelect, MatSelectTrigger, MatOption, FormsModule, NgControlStatus, NgModel, MatCheckboxModule, MatCheckbox, AvatarComponent, NgSelectModule, NgSelectComponent, NgOptionTemplateDirective] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TeamshareComponent, { className: "TeamshareComponent", filePath: "src\\app\\marking\\components\\fact\\teamshare\\teamshare.component.ts", lineNumber: 16 });
})();

export {
  TeamshareComponent
};
//# sourceMappingURL=chunk-6CVBO52M.js.map
