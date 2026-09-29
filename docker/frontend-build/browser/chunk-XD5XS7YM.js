import {
  FactService
} from "./chunk-IMS2LHRB.js";
import {
  CommonService
} from "./chunk-GHP524MW.js";
import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
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
  CommonModule,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  InputFlags,
  booleanAttribute,
  ɵsetClassDebugInfo,
  ɵɵInputTransformsFeature,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
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
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/rt/components/mark-nav/nav-components/nav-share-permission/nav-share-permission.component.ts
function NavSharePermissionComponent_ng_container_0_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 6);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 7);
    \u0275\u0275element(2, "path", 8);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "span", 9);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 2, "NAV.PRIVATE_TEAM_ONLY"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r0.getselectedcount());
  }
}
function NavSharePermissionComponent_ng_container_0_div_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-checkbox", 11);
    \u0275\u0275twoWayListener("ngModelChange", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_1_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r0.checkall, $event) || (ctx_r0.checkall = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_1_Template_mat_checkbox_change_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.toggleSelectAll($event.checked));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.checkall);
  }
}
function NavSharePermissionComponent_ng_container_0_div_3_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 12)(2, "mat-checkbox", 13);
    \u0275\u0275twoWayListener("ngModelChange", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_2_Template_mat_checkbox_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r0.checkall, $event) || (ctx_r0.checkall = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_2_Template_mat_checkbox_change_2_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.toggleSelectAll($event.checked));
    });
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 14);
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "span", 15);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "span", 15);
    \u0275\u0275text(12);
    \u0275\u0275pipe(13, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "span", 15);
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.checkall);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 6, "COMMON.SELECT_ALL"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(7, 8, "NAV.ACTION"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(10, 10, "NAV.EDIT"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(13, 12, "NAV.RESHARE"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(16, 14, "NAV.COMMENT"));
  }
}
function NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "mat-checkbox", 18);
    \u0275\u0275twoWayListener("ngModelChange", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_ng_container_5_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(4);
      \u0275\u0275twoWayBindingSet(ctx_r0.Editall, $event) || (ctx_r0.Editall = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_ng_container_5_Template_mat_checkbox_change_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.toggleEditAll($event.checked));
    });
    \u0275\u0275elementStart(2, "span", 19);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "mat-checkbox", 18);
    \u0275\u0275twoWayListener("ngModelChange", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_ng_container_5_Template_mat_checkbox_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(4);
      \u0275\u0275twoWayBindingSet(ctx_r0.Shareall, $event) || (ctx_r0.Shareall = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_ng_container_5_Template_mat_checkbox_change_5_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.toggleShareAll($event.checked));
    });
    \u0275\u0275elementStart(6, "span", 20);
    \u0275\u0275text(7);
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "mat-checkbox", 18);
    \u0275\u0275twoWayListener("ngModelChange", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_ng_container_5_Template_mat_checkbox_ngModelChange_9_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(4);
      \u0275\u0275twoWayBindingSet(ctx_r0.Commentall, $event) || (ctx_r0.Commentall = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_ng_container_5_Template_mat_checkbox_change_9_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.toggleCommentAll($event.checked));
    });
    \u0275\u0275elementStart(10, "span", 20);
    \u0275\u0275text(11);
    \u0275\u0275pipe(12, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.Editall);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 6, "NAV.EDIT"));
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.Shareall);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(8, 8, "NAV.RESHARE"));
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r0.Commentall);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(12, 10, "NAV.COMMENT"));
  }
}
function NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 16);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 17);
    \u0275\u0275template(5, NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_ng_container_5_Template, 13, 12, "ng-container", 0);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(3, 2, "NAV.ACTION"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", !ctx_r0.isView);
  }
}
function NavSharePermissionComponent_ng_container_0_div_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275template(1, NavSharePermissionComponent_ng_container_0_div_3_ng_container_1_Template, 2, 1, "ng-container", 0)(2, NavSharePermissionComponent_ng_container_0_div_3_ng_container_2_Template, 17, 16, "ng-container", 0)(3, NavSharePermissionComponent_ng_container_0_div_3_ng_container_3_Template, 6, 4, "ng-container", 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.isView);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.isView);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.checkall && !ctx_r0.isView);
  }
}
function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_mat_checkbox_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "mat-checkbox", 11);
    \u0275\u0275twoWayListener("ngModelChange", function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_mat_checkbox_3_Template_mat_checkbox_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const x_r6 = \u0275\u0275nextContext(2).$implicit;
      \u0275\u0275twoWayBindingSet(x_r6.isSelected, $event) || (x_r6.isSelected = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_mat_checkbox_3_Template_mat_checkbox_change_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const x_r6 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.checkC($event, x_r6));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r6 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275twoWayProperty("ngModel", x_r6.isSelected);
  }
}
function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 30)(1, "div", 31)(2, "mat-checkbox", 32);
    \u0275\u0275twoWayListener("ngModelChange", function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_div_1_Template_mat_checkbox_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r7);
      const x_r6 = \u0275\u0275nextContext(3).$implicit;
      \u0275\u0275twoWayBindingSet(x_r6.bCanEdit, $event) || (x_r6.bCanEdit = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_div_1_Template_mat_checkbox_ngModelChange_2_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r0 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r0.syncHeaderFromRows());
    });
    \u0275\u0275elementStart(3, "span", 33);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(6, "div", 31)(7, "mat-checkbox", 32);
    \u0275\u0275twoWayListener("ngModelChange", function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_div_1_Template_mat_checkbox_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r7);
      const x_r6 = \u0275\u0275nextContext(3).$implicit;
      \u0275\u0275twoWayBindingSet(x_r6.bCanReshare, $event) || (x_r6.bCanReshare = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_div_1_Template_mat_checkbox_ngModelChange_7_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r0 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r0.syncHeaderFromRows());
    });
    \u0275\u0275elementStart(8, "span", 33);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(11, "div", 31)(12, "mat-checkbox", 32);
    \u0275\u0275twoWayListener("ngModelChange", function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_div_1_Template_mat_checkbox_ngModelChange_12_listener($event) {
      \u0275\u0275restoreView(_r7);
      const x_r6 = \u0275\u0275nextContext(3).$implicit;
      \u0275\u0275twoWayBindingSet(x_r6.bCanComment, $event) || (x_r6.bCanComment = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_div_1_Template_mat_checkbox_ngModelChange_12_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r0 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r0.syncHeaderFromRows());
    });
    \u0275\u0275elementStart(13, "span", 33);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "translate");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r6 = \u0275\u0275nextContext(3).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("pointer-events-none", ctx_r0.isView)("newcheckdisabled", ctx_r0.isView && x_r6.bCanEdit);
    \u0275\u0275twoWayProperty("ngModel", x_r6.bCanEdit);
    \u0275\u0275property("disabled", ctx_r0.isView && x_r6.bCanEdit);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(5, 21, "NAV.EDIT"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275classProp("pointer-events-none", ctx_r0.isView)("newcheckdisabled", ctx_r0.isView && x_r6.bCanReshare);
    \u0275\u0275twoWayProperty("ngModel", x_r6.bCanReshare);
    \u0275\u0275property("disabled", ctx_r0.isView && x_r6.bCanReshare);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(10, 23, "NAV.RESHARE"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275classProp("pointer-events-none", ctx_r0.isView)("newcheckdisabled", ctx_r0.isView && x_r6.bCanComment);
    \u0275\u0275twoWayProperty("ngModel", x_r6.bCanComment);
    \u0275\u0275property("disabled", ctx_r0.isView && x_r6.bCanComment);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(15, 25, "NAV.COMMENT"), " ");
  }
}
function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_div_1_Template, 16, 27, "div", 29);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.isDocLink);
  }
}
function NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div")(1, "div", 22)(2, "div", 23);
    \u0275\u0275template(3, NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_mat_checkbox_3_Template, 1, 1, "mat-checkbox", 24);
    \u0275\u0275elementStart(4, "div", 25);
    \u0275\u0275element(5, "avtr", 26);
    \u0275\u0275elementStart(6, "div", 27);
    \u0275\u0275text(7);
    \u0275\u0275elementStart(8, "span", 28);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(10, NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_ng_container_10_Template, 2, 1, "ng-container", 0);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("isView", ctx_r0.isView);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", !ctx_r0.isView);
    \u0275\u0275advance();
    \u0275\u0275classMap(x_r6.isSelected || ctx_r0.checkall ? "w-[45%] min-w-[100px]  max-w-[45%]" : "w-full");
    \u0275\u0275advance();
    \u0275\u0275property("detail", x_r6);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r6.cFname, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r6.cLname, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r6.isSelected);
  }
}
function NavSharePermissionComponent_ng_container_0_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, NavSharePermissionComponent_ng_container_0_ng_container_4_div_1_Template, 11, 9, "div", 21);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r6 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r6.nUserid != ctx_r0.nUserid && (x_r6.isSelected && ctx_r0.isView || !ctx_r0.isView));
  }
}
function NavSharePermissionComponent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, NavSharePermissionComponent_ng_container_0_div_1_Template, 7, 4, "div", 2);
    \u0275\u0275elementStart(2, "div", 3);
    \u0275\u0275template(3, NavSharePermissionComponent_ng_container_0_div_3_Template, 4, 3, "div", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, NavSharePermissionComponent_ng_container_0_ng_container_4_Template, 2, 1, "ng-container", 5);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.showBar);
    \u0275\u0275advance();
    \u0275\u0275classProp("isView", ctx_r0.isView);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.isDocLink);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r0.userList);
  }
}
function NavSharePermissionComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 1, "NAV.NO_USERS"), "\n");
  }
}
var NavSharePermissionComponent = class _NavSharePermissionComponent {
  constructor(common, factService) {
    this.common = common;
    this.factService = factService;
    this.showBar = false;
    this.isView = false;
    this.checkall = false;
    this.Editall = false;
    this.Shareall = false;
    this.Commentall = false;
    this.isDocLink = false;
    this.isNoSelectedUser = false;
    this.onEvent = new EventEmitter();
  }
  ngOnChanges(changes) {
    if (changes["userList"]) {
      this.handleSelectedUserPermissions();
      this.syncHeaderFromRows();
    }
  }
  ngOnInit() {
    this.handleSelectedUserPermissions();
    this.syncHeaderFromRows();
    if (this.userList?.length) {
      this.checkall = this.userList.filter((user) => user.nUserid != this.nUserid).every((user) => user.isSelected);
    }
  }
  checkC(ev, x) {
    const selectedUser = this.userList.find((user) => user.nUserid === x.nUserid);
    if (selectedUser && ev.checked) {
      selectedUser.bCanEdit = true;
      selectedUser.bCanCopy = true;
      selectedUser.bCanReshare = true;
      selectedUser.bCanComment = true;
    } else if (selectedUser && !ev.checked) {
      selectedUser.bCanEdit = false;
      selectedUser.bCanCopy = false;
      selectedUser.bCanReshare = false;
      selectedUser.bCanComment = false;
    }
    this.checkall = this.userList.filter((user) => user.nUserid != this.nUserid).every((user) => user.isSelected);
    this.syncHeaderFromRows();
    this.onEvent.emit({ type: "SELECT-ALL", data: null });
  }
  selectAllUsers(e) {
    if (e.checked) {
      this.userList.forEach((user) => {
        user.isSelected = true;
        user.bCanEdit = true;
        user.bCanCopy = true;
        user.bCanReshare = true;
        user.bCanComment = true;
      });
    } else {
      this.userList.forEach((user) => {
        user.isSelected = false;
        user.bCanEdit = false;
        user.bCanCopy = false;
        user.bCanReshare = false;
        user.bCanComment = false;
      });
    }
    if (e.checked) {
      this.Editall = this.Shareall = this.Commentall = true;
    } else {
      this.Editall = this.Shareall = this.Commentall = false;
    }
    this.onEvent.emit({ type: "SELECT-ALL", data: null });
  }
  toggleSelectAll(ev) {
    this.userList.forEach((u) => {
      u.isSelected = ev;
      if (ev) {
        u.bCanEdit = true;
        u.bCanCopy = true;
        u.bCanReshare = true;
        u.bCanComment = true;
      } else {
        u.bCanEdit = false;
        u.bCanCopy = false;
        u.bCanReshare = false;
        u.bCanComment = false;
      }
    });
    this.checkall = ev;
    if (this.checkall) {
      this.Editall = this.Shareall = this.Commentall = true;
    } else {
      this.Editall = this.Shareall = this.Commentall = false;
    }
    this.onEvent.emit({ type: "SELECT-ALL", data: null });
  }
  toggleEditAll(ev) {
    this.userList.forEach((u) => {
      if (u.isSelected) {
        u.bCanEdit = ev;
      }
    });
  }
  toggleShareAll(ev) {
    this.userList.forEach((u) => {
      if (u.isSelected) {
        u.bCanReshare = ev;
      }
    });
  }
  toggleCommentAll(ev) {
    this.userList.forEach((u) => {
      if (u.isSelected) {
        u.bCanComment = ev;
      }
    });
  }
  // async savePermissions() {
  //   console.log('Saving permissions for:', this.nFactid);
  //   const selectedUsers = this.userList
  //     .filter(
  //       (u) => u.isSelected || u.bCanEdit || u.bCanReshare || u.bCanComment
  //     )
  //     .map((u) => ({
  //       nUserid: u.nUserid,
  //       canEdit: u.bCanEdit,
  //       canReshare: u.bCanReshare,
  //       canComment: u.bCanComment,
  //     }));
  //   console.log('Selected users for permission update:', selectedUsers);
  //   if (selectedUsers.length > 0) {
  //     await this.factService.updatePermissions(this.nFactid, selectedUsers);
  //     console.log('Permissions saved:', selectedUsers);
  //   }
  // }
  handleSelectedUserPermissions() {
    this.isNoSelectedUser = false;
    if (!this.isView)
      return;
    this.isNoSelectedUser = this.userList.filter((x) => x.nUserid != this.nUserid && (x.isSelected && this.isView || !this.isView)).length == 0;
  }
  syncHeaderFromRows() {
    const sel = (this.userList ?? []).filter((u) => u.isSelected);
    if (sel.length === 0) {
      this.Editall = this.Shareall = this.Commentall = false;
      return;
    }
    this.Editall = sel.every((u) => !!u.bCanEdit);
    this.Shareall = sel.every((u) => !!u.bCanReshare);
    this.Commentall = sel.every((u) => !!u.bCanComment);
  }
  getselectedcount() {
    return this.userList.filter((x) => x.nUserid != this.nUserid && x.isSelected).length;
  }
  static {
    this.\u0275fac = function NavSharePermissionComponent_Factory(t) {
      return new (t || _NavSharePermissionComponent)(\u0275\u0275directiveInject(CommonService), \u0275\u0275directiveInject(FactService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NavSharePermissionComponent, selectors: [["nav-share-permission"]], inputs: { userList: "userList", nUserid: "nUserid", nCaseid: "nCaseid", nFactid: "nFactid", showBar: "showBar", isView: [InputFlags.HasDecoratorInputTransform, "isView", "isView", booleanAttribute], creator: "creator", isDocLink: "isDocLink" }, outputs: { onEvent: "onEvent" }, standalone: true, features: [\u0275\u0275InputTransformsFeature, \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 2, consts: [[4, "ngIf"], ["class", "flex items-center gap-2 w-full", 4, "ngIf"], ["class", "px-2 py-0.5 font-semibold bg-blue-on text-white flex text-xs items-center gap-1 mb-0.5 ng-star-inserted", 4, "ngIf"], [1, "bg-white"], ["class", "bg-grey py-1 mb-1 flex items-center gap-2.5 sticky top-0 z-50 px-5 text-xs", 4, "ngIf"], [4, "ngFor", "ngForOf"], [1, "px-2", "py-0.5", "font-semibold", "bg-blue-on", "text-white", "flex", "text-xs", "items-center", "gap-1", "mb-0.5", "ng-star-inserted"], ["width", "13", "height", "16", "viewBox", "0 0 13 16", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M6.5 15.9172C6.40521 15.9172 6.31719 15.9105 6.23594 15.8972C6.15469 15.8839 6.07344 15.8639 5.99219 15.8372C4.16406 15.2372 2.70833 14.1273 1.625 12.5076C0.541667 10.8879 0 9.14439 0 7.27719V3.49719C0 3.16385 0.0983124 2.86385 0.294937 2.59719C0.491562 2.33052 0.745333 2.13719 1.05625 2.01719L5.93125 0.217188C6.12083 0.150521 6.31042 0.117188 6.5 0.117188C6.68958 0.117188 6.87917 0.150521 7.06875 0.217188L11.9437 2.01719C12.2552 2.13719 12.5092 2.33052 12.7059 2.59719C12.9025 2.86385 13.0005 3.16385 13 3.49719V7.27719C13 9.14386 12.4583 10.8873 11.375 12.5076C10.2917 14.1279 8.83594 15.2377 7.00781 15.8372C6.92656 15.8639 6.84531 15.8839 6.76406 15.8972C6.68281 15.9105 6.59479 15.9172 6.5 15.9172Z", "fill", "white"], [1, "h-[18px]", "min-w-[18px]", "max-w-[18px]", "rounded-full", "ms-auto", "bg-white", "flex", "text-xxs", "text-blue-on", "items-center", "justify-center"], [1, "bg-grey", "py-1", "mb-1", "flex", "items-center", "gap-2.5", "sticky", "top-0", "z-50", "px-5", "text-xs"], [3, "ngModelChange", "change", "ngModel"], [1, "w-full", "flex", "items-center", "justify-end", "gap-2", "pe-5"], [1, "invisible", "pointer-events-none", 3, "ngModelChange", "change", "ngModel"], [1, "text-white", "w-[65%]", "text-start", "invisible"], [1, "text-white", "w-full", "ps-5"], [1, "text-white", "w-[45%]", "min-w-[100px]", "max-w-[45%]", "text-start", "invisible"], [1, "w-full", "flex", "justify-end", "gap-2", "pe-3"], [1, "w-full", 3, "ngModelChange", "change", "ngModel"], [1, "text-white"], [1, "text-white", "w-full"], [3, "isView", 4, "ngIf"], [1, "px-5", "py-1", "bg-reply", "mb-px", "flex", "text-xs", "items-center", "gap-2.5", "group-[.mdc-list-item--selected]:bg-blue-deactivate", "group-[.mdc-list-item--selected]:font-semibold"], [1, "flex", "items-center", "gap-2", "w-full"], [3, "ngModel", "ngModelChange", "change", 4, "ngIf"], [1, "flex", "items-center", "gap-1"], ["size", "sm", 3, "detail"], [1, "block", "truncate"], [1, "block"], ["class", "flex w-full gap-2 pe-3", 4, "ngIf"], [1, "flex", "w-full", "gap-2", "pe-3"], [1, "w-2/6"], [3, "ngModelChange", "ngModel", "disabled"], [1, "text-grey"]], template: function NavSharePermissionComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, NavSharePermissionComponent_ng_container_0_Template, 5, 5, "ng-container", 0)(1, NavSharePermissionComponent_div_1_Template, 3, 3, "div", 1);
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", !ctx.isNoSelectedUser);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.isNoSelectedUser);
      }
    }, dependencies: [CommonModule, NgForOf, NgIf, TranslateModule, TranslatePipe, MatCheckboxModule, MatCheckbox, AvatarComponent, FormsModule, NgControlStatus, NgModel] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NavSharePermissionComponent, { className: "NavSharePermissionComponent", filePath: "src\\app\\rt\\components\\mark-nav\\nav-components\\nav-share-permission\\nav-share-permission.component.ts", lineNumber: 25 });
})();

export {
  NavSharePermissionComponent
};
//# sourceMappingURL=chunk-XD5XS7YM.js.map
