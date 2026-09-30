import {
  MatSlideToggleModule
} from "./chunk-43QUFIPG.js";
import {
  MyfileService
} from "./chunk-M4TJ3SSY.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MAT_DIALOG_DATA,
  MatDialog
} from "./chunk-UVEQGFJV.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf
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
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction3,
  ɵɵpureFunction4,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-OLJKHPOW.js";

// src/app/shared/interfaces/myfiles-tool-events.interface.ts
var MYFILES_TOOL_EVENTS = {
  FILTER: "FILTER",
  COUNT: "Count",
  BACK: "BACK",
  SEARCH_CLEAR: "SEARCH_CLEAR",
  ICON_CLICK: "ICON_CLICK"
};

// src/app/shared/components/myfiles/sharewithteam/sharewithteam.component.ts
var _c0 = (a0, a1, a2, a3) => ({ "px-5 border-x border-grey": a0, "bg-dark-blue rounded-base overflow-hidden  ": a1, "outline outline-1 outline-tab -outline-offset-1": a2, "group": a3 });
var _c1 = (a0, a1, a2) => ({ "bg-white px-3": a0, "group-focus-within:me-3": a1, "border border-gray-300": a2 });
var _c2 = (a0, a1, a2) => ({ "px-5 border-x border-grey": a0, "bg-dark-blue rounded-base overflow-hidden  ": a1, "outline outline-1 outline-tab -outline-offset-1": a2 });
var _c3 = (a0, a1, a2) => ({ "bg-white px-3": a0, "me-3": a1, "border border-gray-300": a2 });
function SharewithteamComponent_ng_container_0_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, "MYFILES.SHARE_WITH_TEAM.SHARE"));
  }
}
function SharewithteamComponent_ng_container_0_ng_container_5_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "avtr", 14);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    const x_r5 = ctx_r3.$implicit;
    const i_r6 = ctx_r3.index;
    \u0275\u0275advance();
    \u0275\u0275classMap(i_r6 != 0 ? "hidden" : "flex");
    \u0275\u0275property("detail", x_r5)("matTooltip", (x_r5 == null ? null : x_r5.cFname) + " " + (x_r5 == null ? null : x_r5.cLname));
  }
}
function SharewithteamComponent_ng_container_0_ng_container_5_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, SharewithteamComponent_ng_container_0_ng_container_5_ng_container_2_ng_container_1_Template, 2, 4, "ng-container", 7);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r5.nUserid != ctx_r1.userDetail.nUserid);
  }
}
function SharewithteamComponent_ng_container_0_ng_container_5_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 15);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" +", ctx_r1.checkUserlength - 1, " ");
  }
}
function SharewithteamComponent_ng_container_0_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 8);
    \u0275\u0275template(2, SharewithteamComponent_ng_container_0_ng_container_5_ng_container_2_Template, 2, 1, "ng-container", 9)(3, SharewithteamComponent_ng_container_0_ng_container_5_ng_container_3_Template, 3, 1, "ng-container", 7);
    \u0275\u0275elementStart(4, "button", 10);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275listener("click", function SharewithteamComponent_ng_container_0_ng_container_5_Template_button_click_4_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.iconclick());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 11);
    \u0275\u0275element(7, "circle", 12)(8, "path", 13);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.checkedUsers);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.checkUserlength > 1);
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", \u0275\u0275pipeBind1(5, 3, "MYFILES.SHARE_WITH_TEAM.EDIT_SHARED_USERS"));
  }
}
function SharewithteamComponent_ng_container_0_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 16);
    \u0275\u0275element(2, "icon", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
}
function SharewithteamComponent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 4);
    \u0275\u0275listener("click", function SharewithteamComponent_ng_container_0_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.share());
    });
    \u0275\u0275elementStart(2, "div", 5);
    \u0275\u0275element(3, "icon", 6);
    \u0275\u0275template(4, SharewithteamComponent_ng_container_0_ng_container_4_Template, 3, 3, "ng-container", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, SharewithteamComponent_ng_container_0_ng_container_5_Template, 9, 5, "ng-container", 7)(6, SharewithteamComponent_ng_container_0_ng_container_6_Template, 3, 0, "ng-container", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction4(7, _c0, !ctx_r1.globalshare, ctx_r1.globalshare, ctx_r1.globalshare && !ctx_r1.checkedUsers.length, ctx_r1.globalshare));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction3(12, _c1, ctx_r1.globalshare, ctx_r1.checkedUsers.length, ctx_r1.globalshare && ctx_r1.checkedUsers.length));
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.globalshare ? "" : "text-white");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.globalshare);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.checkedUsers.length);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.globalshare && ctx_r1.checkedUsers.length);
  }
}
function SharewithteamComponent_ng_template_1_ng_container_0_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, "MYFILES.SHARE_WITH_TEAM.SHARE"));
  }
}
function SharewithteamComponent_ng_template_1_ng_container_0_ng_container_5_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "avtr", 14);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r8 = \u0275\u0275nextContext();
    const x_r10 = ctx_r8.$implicit;
    const i_r11 = ctx_r8.index;
    \u0275\u0275advance();
    \u0275\u0275classMap(i_r11 != 0 ? "hidden" : "flex");
    \u0275\u0275property("detail", x_r10)("matTooltip", (x_r10 == null ? null : x_r10.cFname) + " " + (x_r10 == null ? null : x_r10.cLname));
  }
}
function SharewithteamComponent_ng_template_1_ng_container_0_ng_container_5_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, SharewithteamComponent_ng_template_1_ng_container_0_ng_container_5_ng_container_2_ng_container_1_Template, 2, 4, "ng-container", 7);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r10 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r10.nUserid != ctx_r1.userDetail.nUserid);
  }
}
function SharewithteamComponent_ng_template_1_ng_container_0_ng_container_5_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 15);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" +", ctx_r1.checkUserlength - 1, " ");
  }
}
function SharewithteamComponent_ng_template_1_ng_container_0_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 19);
    \u0275\u0275template(2, SharewithteamComponent_ng_template_1_ng_container_0_ng_container_5_ng_container_2_Template, 2, 1, "ng-container", 9)(3, SharewithteamComponent_ng_template_1_ng_container_0_ng_container_5_ng_container_3_Template, 3, 1, "ng-container", 7);
    \u0275\u0275elementStart(4, "button", 10);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275listener("click", function SharewithteamComponent_ng_template_1_ng_container_0_ng_container_5_Template_button_click_4_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(3);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.iconclick());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 11);
    \u0275\u0275element(7, "circle", 12)(8, "path", 13);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.checkedUsers);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.showshare && ctx_r1.checkUserlength > 1);
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", \u0275\u0275pipeBind1(5, 3, "MYFILES.SHARE_WITH_TEAM.EDIT_SHARED_USERS"));
  }
}
function SharewithteamComponent_ng_template_1_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 18);
    \u0275\u0275listener("blur", function SharewithteamComponent_ng_template_1_ng_container_0_Template_button_blur_1_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.showshare = false);
    })("click", function SharewithteamComponent_ng_template_1_ng_container_0_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.share());
    });
    \u0275\u0275elementStart(2, "div", 5);
    \u0275\u0275element(3, "icon", 6);
    \u0275\u0275template(4, SharewithteamComponent_ng_template_1_ng_container_0_ng_container_4_Template, 3, 3, "ng-container", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, SharewithteamComponent_ng_template_1_ng_container_0_ng_container_5_Template, 9, 5, "ng-container", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction3(6, _c2, ctx_r1.showshare && !ctx_r1.globalshare, ctx_r1.globalshare, ctx_r1.globalshare && !ctx_r1.checkedUsers.length));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction3(10, _c3, ctx_r1.globalshare, ctx_r1.showshare && ctx_r1.checkedUsers.length, ctx_r1.globalshare && ctx_r1.checkedUsers.length));
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.globalshare ? "" : "text-white");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.globalshare);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.showshare && ctx_r1.checkedUsers.length);
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_ng_container_11_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "avtr", 29);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r13 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("detail", x_r13)("matTooltip", (x_r13 == null ? null : x_r13.cFname) + " " + (x_r13 == null ? null : x_r13.cLname));
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_ng_container_11_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_ng_container_11_ng_container_1_ng_container_1_Template, 2, 2, "ng-container", 7);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r13 = ctx.$implicit;
    const i_r14 = ctx.index;
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r13.nUserid != ctx_r1.userDetail.nUserid && i_r14 < 9);
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_ng_container_11_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 15);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(5);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" +", ctx_r1.checkUserlength - 8, " ");
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_ng_container_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_ng_container_11_ng_container_1_Template, 2, 1, "ng-container", 9)(2, SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_ng_container_11_ng_container_2_Template, 3, 1, "ng-container", 7);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.checkedUsers);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.checkedUsers.length > 10);
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 20)(2, "div", 21)(3, "h6", 22);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 23)(7, "div", 24)(8, "div")(9, "div")(10, "div", 25);
    \u0275\u0275template(11, SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_ng_container_11_Template, 3, 2, "ng-container", 7);
    \u0275\u0275elementStart(12, "button", 10);
    \u0275\u0275pipe(13, "translate");
    \u0275\u0275listener("click", function SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_Template_button_click_12_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(3);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r1.iconclick());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(14, "svg", 26);
    \u0275\u0275element(15, "circle", 27)(16, "path", 28);
    \u0275\u0275elementEnd()()()()()()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(5, 3, "MYFILES.SHARE_WITH_TEAM.SHARE_WITH"));
    \u0275\u0275advance(7);
    \u0275\u0275property("ngIf", ctx_r1.checkedUsers.length);
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", \u0275\u0275pipeBind1(13, 5, "MYFILES.SHARE_WITH_TEAM.EDIT_SHARED_USERS"));
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_ng_container_3_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "avtr", 41);
    \u0275\u0275listener("click", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_ng_container_3_ng_container_1_ng_container_1_Template_avtr_click_1_listener() {
      \u0275\u0275restoreView(_r16);
      const x_r17 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(6);
      x_r17.isCheck = !x_r17.isCheck;
      return \u0275\u0275resetView(ctx_r1.checkList());
    })("keydown.enter", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_ng_container_3_ng_container_1_ng_container_1_Template_avtr_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r16);
      const x_r17 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(6);
      $event.preventDefault();
      x_r17.isCheck = !x_r17.isCheck;
      return \u0275\u0275resetView(ctx_r1.checkList());
    })("keydown.space", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_ng_container_3_ng_container_1_ng_container_1_Template_avtr_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r16);
      const x_r17 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(6);
      $event.preventDefault();
      x_r17.isCheck = !x_r17.isCheck;
      return \u0275\u0275resetView(ctx_r1.checkList());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r17 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("detail", x_r17)("matTooltip", (x_r17 == null ? null : x_r17.cFname) + " " + (x_r17 == null ? null : x_r17.cLname))("active", x_r17 == null ? null : x_r17.isCheck);
    \u0275\u0275attribute("aria-checked", (x_r17 == null ? null : x_r17.isCheck) ? "true" : "false");
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_ng_container_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_ng_container_3_ng_container_1_ng_container_1_Template, 2, 4, "ng-container", 7);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r17 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r17.nUserid != ctx_r1.userDetail.nUserid);
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_ng_container_3_ng_container_1_Template, 2, 1, "ng-container", 9);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const tm_r18 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", tm_r18.users);
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 39)(1, "div")(2, "div", 40);
    \u0275\u0275template(3, SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_ng_container_3_Template, 2, 1, "ng-container", 7);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const tm_r18 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275property("hidden", ctx_r1.nTeamid != tm_r18.nTeamid);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", tm_r18.users == null ? null : tm_r18.users.length);
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 20)(1, "div", 30)(2, "h6", 22);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div", 23)(6, "div", 31)(7, "h6", 32);
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "translate");
    \u0275\u0275elementStart(10, "mat-checkbox", 33);
    \u0275\u0275listener("change", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_Template_mat_checkbox_change_10_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.checkall(ctx_r1.teamlist[0]));
    });
    \u0275\u0275twoWayListener("ngModelChange", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_Template_mat_checkbox_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r1.teamlist[0].isCheck, $event) || (ctx_r1.teamlist[0].isCheck = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275text(11);
    \u0275\u0275pipe(12, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(13, SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_div_13_Template, 4, 2, "div", 34);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "span", 35)(15, "mat-checkbox", 36);
    \u0275\u0275twoWayListener("ngModelChange", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_Template_mat_checkbox_ngModelChange_15_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r1.bIsannotation, $event) || (ctx_r1.bIsannotation = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(16, "span", 37);
    \u0275\u0275text(17);
    \u0275\u0275pipe(18, "translate");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "mat-checkbox", 36);
    \u0275\u0275twoWayListener("ngModelChange", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_Template_mat_checkbox_ngModelChange_19_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r1.bIsalert, $event) || (ctx_r1.bIsalert = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "btn", 38);
    \u0275\u0275listener("click", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_Template_btn_click_22_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.shareWithuser());
    })("keydown.enter", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_Template_btn_keydown_enter_22_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.shareWithuser());
    })("keydown.space", function SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_Template_btn_keydown_space_22_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r1.shareWithuser());
    });
    \u0275\u0275elementStart(23, "span", 37);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "translate");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 10, "MYFILES.SHARE_WITH_TEAM.SHARE_WITH"));
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(9, 12, "MYFILES.SHARE_WITH_TEAM.MY_TEAM"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.teamlist[0].isCheck);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(12, 14, "MYFILES.SHARE_WITH_TEAM.ALL"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r1.teamlist);
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.bIsannotation);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(18, 16, "MYFILES.SHARE_WITH_TEAM.WITH_ANNOTATION"));
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.bIsalert);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(21, 18, "MYFILES.SHARE_WITH_TEAM.NOTIFICATION"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(25, 20, "ACTIONBAR.CONFIRM"));
  }
}
function SharewithteamComponent_ng_template_1_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, SharewithteamComponent_ng_template_1_ng_template_1_ng_container_0_Template, 17, 7, "ng-container", 3)(1, SharewithteamComponent_ng_template_1_ng_template_1_ng_template_1_Template, 26, 22, "ng-template", null, 2, \u0275\u0275templateRefExtractor);
  }
  if (rf & 2) {
    const defaultBranch_r19 = \u0275\u0275reference(2);
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngIf", ctx_r1.bottomshr)("ngIfElse", defaultBranch_r19);
  }
}
function SharewithteamComponent_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, SharewithteamComponent_ng_template_1_ng_container_0_Template, 6, 14, "ng-container", 3)(1, SharewithteamComponent_ng_template_1_ng_template_1_Template, 3, 2, "ng-template", null, 1, \u0275\u0275templateRefExtractor);
  }
  if (rf & 2) {
    const notActiveUser_r20 = \u0275\u0275reference(2);
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("ngIf", ctx_r1.activeuser)("ngIfElse", notActiveUser_r20);
  }
}
var SharewithteamComponent = class _SharewithteamComponent {
  constructor(myfileS, data, dialog, ss, cdr) {
    this.myfileS = myfileS;
    this.data = data;
    this.dialog = dialog;
    this.ss = ss;
    this.cdr = cdr;
    this.activeuser = false;
    this.globalshare = false;
    this.bottomshr = false;
    this.teamlist = [];
    this.users = [];
    this.userDetail = {};
    this.checkevent = new EventEmitter();
    this.shareEvent = new EventEmitter();
    this.bIsannotation = true;
    this.bIsalert = true;
    this.showshare = false;
    this.nTeamid = 0;
    this.checkUserlength = 0;
    this.checkedUsers = [];
    this.shareids = [];
    if (data) {
      this.nCaseid = data["nCaseid"];
      this.nBundleid = data["nBundleid"];
      this.nBundledetailid = data["nBundledetailid"];
      this.nSectionid = data["nSectionid"];
      this.shareids = data["ids"];
    }
  }
  ngOnInit() {
    void this.init();
  }
  init() {
    return __async(this, null, function* () {
      this.userDetail = yield this.ss.getUserInfo();
      yield this.getTeamList();
      this.showshare = !!this.globalshare;
      this.cdr.detectChanges();
    });
  }
  ngOnChanges(_changes) {
    void this.getUserlist();
    this.cdr.detectChanges();
  }
  getTeamList() {
    return __async(this, null, function* () {
      const res = yield this.myfileS.teamuserList(this.nCaseid);
      this.teamlist = res;
      for (let team of this.teamlist) {
        if (team.users.length && team.users.some((e) => e.nUserid == this.userDetail.nUserid)) {
          this.nTeamid = team.nTeamid;
          break;
        }
      }
      this.teamlist = this.teamlist.filter((team) => this.nTeamid === team.nTeamid);
      void this.getUserlist();
      this.cdr.detectChanges();
    });
  }
  getUserlist() {
    return __async(this, null, function* () {
      const res = yield this.myfileS.getshareduserby_bundleid(this.nSectionid, this.nBundleid, this.nBundledetailid ? this.nBundledetailid : null);
      const firstRow = res?.[0];
      this.users = firstRow?.jUsers ?? firstRow?.users ?? [];
      this.checkevent.emit(0);
      if (!this.users?.length) {
        this.checkUserlength = 0;
        this.checkedUsers = [];
        this.cdr.detectChanges();
        return;
      }
      const userIdSet = new Set(this.users);
      this.teamlist = this.teamlist.map((team) => {
        const updateUsers = team.users.map((user) => __spreadProps(__spreadValues({}, user), {
          isCheck: userIdSet.has(user.nUserid)
          // Set isCheck based on absence in userIdSet
        }));
        const isAllUsersChecked = updateUsers.filter((a) => a.nUserid != this.userDetail.nUserid).every((user) => user.isCheck);
        this.checkUserlength = updateUsers.filter((e) => e.isCheck).length;
        this.checkevent.emit(this.checkUserlength);
        this.checkedUsers = updateUsers.filter((e) => e.isCheck);
        this.cdr.detectChanges();
        return __spreadProps(__spreadValues({}, team), {
          users: updateUsers,
          isCheck: isAllUsersChecked
          // Set the team's check status based on all users' check status
        });
      });
      this.cdr.detectChanges();
    });
  }
  checkall(x) {
    x.users.filter((a) => a.nUserid != this.userDetail.nUserid).forEach((a) => {
      a.isCheck = x.isCheck;
    });
  }
  checkList() {
    if (!this.teamlist?.length) {
      return;
    }
    if (this.teamlist[0].users.some((a) => a.nUserid != this.userDetail.nUserid && !a.isCheck)) {
      this.teamlist[0].isCheck = false;
    } else {
      this.teamlist[0].isCheck = true;
    }
    ;
  }
  shareWithuser() {
    return __async(this, null, function* () {
      let userids = [];
      for (let team of this.teamlist) {
        let ids = team.users.filter((e) => e.isCheck).map((e) => e.nUserid);
        userids = [...userids, ...ids];
      }
      const mdl = {
        nSectionid: this.nSectionid,
        nBundleid: this.nBundleid,
        nBundledetailid: this.nBundledetailid,
        jUsers: userids,
        bIsannotation: this.bIsannotation,
        bIsalert: this.bIsalert,
        jShareids: this.shareids
      };
      let res = yield this.myfileS.sharedFileData(mdl);
      if (res) {
        this.dialog.closeAll();
      }
    });
  }
  close() {
    this.dialog.closeAll();
  }
  toggleShareToAll(tm) {
    const allChecked = tm.users.every((user) => user.isCheck);
    tm.users.forEach((user) => user.isCheck = !allChecked);
  }
  // Check if all users are selected
  isShareToAllActive(tm) {
    return tm.users.every((user) => user.isCheck);
  }
  iconclick() {
    this.shareEvent.emit({ event: MYFILES_TOOL_EVENTS.ICON_CLICK, nBundleid: this.nBundleid, data: this.nBundledetailid });
  }
  share() {
    if (this.checkedUsers.length) {
      this.showshare = !this.showshare;
    } else {
      this.shareEvent.emit({ event: MYFILES_TOOL_EVENTS.ICON_CLICK, nBundleid: this.nBundleid, data: this.nBundledetailid });
    }
  }
  static {
    this.\u0275fac = function SharewithteamComponent_Factory(t) {
      return new (t || _SharewithteamComponent)(\u0275\u0275directiveInject(MyfileService), \u0275\u0275directiveInject(MAT_DIALOG_DATA, 8), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SharewithteamComponent, selectors: [["share-with-team"]], inputs: { activeuser: "activeuser", globalshare: "globalshare", bottomshr: "bottomshr", nCaseid: "nCaseid", nBundleid: "nBundleid", nBundledetailid: "nBundledetailid", isUpdate: "isUpdate", nSectionid: "nSectionid" }, outputs: { checkevent: "checkevent", shareEvent: "shareEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 2, consts: [["notGlobalShare", ""], ["notActiveUser", ""], ["defaultBranch", ""], [4, "ngIf", "ngIfElse"], [1, "flex", "items-center", "focus:outline-none", 3, "click", "ngClass"], [1, "flex", "gap-2", "items-center", "h-9", "text-xs", 3, "ngClass"], ["name", "share", "type", "extra", 1, "text-lg"], [4, "ngIf"], [1, "group-focus-within:flex", "items-center", "gap-3", "bg-dark-blue", "hidden"], [4, "ngFor", "ngForOf"], ["type", "button", 1, "p-0", "bg-transparent", "border-0", 3, "click"], ["width", "25", "height", "25", "viewBox", "0 0 25 25", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["cx", "12.5", "cy", "12.5", "r", "11.5", "stroke", "white", "stroke-width", "2"], ["d", "M12.2202 4C11.1564 4 10.1361 4.42261 9.38385 5.17486C8.6316 5.92712 8.20899 6.94739 8.20899 8.01124C8.20899 9.07509 8.6316 10.0954 9.38385 10.8476C10.1361 11.5999 11.1564 12.0225 12.2202 12.0225C13.2841 12.0225 14.3043 11.5999 15.0566 10.8476C15.8089 10.0954 16.2315 9.07509 16.2315 8.01124C16.2315 6.94739 15.8089 5.92712 15.0566 5.17486C14.3043 4.42261 13.2841 4 12.2202 4ZM12.2202 12.8247C12.6946 12.8258 13.1556 12.8579 13.6033 12.921C13.7538 12.942 13.8953 13.0054 14.0112 13.1037C14.1271 13.2021 14.2127 13.3313 14.2581 13.4764C14.3034 13.6215 14.3065 13.7765 14.2672 13.9233C14.2278 14.0701 14.1475 14.2027 14.0357 14.3057C13.3755 14.9105 12.8699 15.6649 12.5614 16.5055C12.2529 17.3461 12.1505 18.2484 12.2627 19.1368C12.2769 19.251 12.2664 19.3668 12.2318 19.4765C12.1973 19.5862 12.1396 19.6873 12.0626 19.7727C11.9856 19.8581 11.8911 19.926 11.7856 19.9718C11.68 20.0175 11.5659 20.04 11.4509 20.0377C9.83836 20.0056 8.33013 19.8644 7.20377 19.5195C6.6406 19.347 6.10951 19.1047 5.70678 18.7477C5.28079 18.3707 5 17.8628 5 17.2371C5 16.6057 5.2872 16.0153 5.6771 15.5211C6.07341 15.0197 6.62134 14.5584 7.26394 14.1653C8.54995 13.3823 10.2988 12.8247 12.2202 12.8247ZM20.4128 13.6542C20.7888 14.0304 21 14.5404 21 15.0722C21 15.604 20.7888 16.1141 20.4128 16.4902L17.6707 19.2323C17.4867 19.4162 17.248 19.5356 16.9904 19.5724L15.138 19.8372C15.0145 19.8549 14.8887 19.8436 14.7703 19.8042C14.652 19.7648 14.5445 19.6983 14.4563 19.6101C14.3682 19.5219 14.3018 19.4143 14.2625 19.2959C14.2232 19.1776 14.212 19.0517 14.2299 18.9282L14.4946 17.0766C14.5313 16.8188 14.6506 16.5798 14.8348 16.3955L17.5768 13.6534C17.9529 13.2775 18.463 13.0662 18.9948 13.0662C19.5266 13.0662 20.0367 13.2775 20.4128 13.6534V13.6542Z", "fill", "white"], ["size", "sm", 3, "detail", "matTooltip", "hidden"], [1, "text-xs", "bg-reply", "border", "border-light-blue", "text-[#676767]", "w-[25px]", "h-[25px]", "flex", "items-center", "justify-center", "text-center", "rounded-full", "-ml-4"], [1, "flex", "items-center", "justify-center", "h-full", "w-9", "bg-dark-blue"], ["name", "chvy", 1, "block", "text-white", "text-xxs", "group-focus-within:rotate-180"], [1, "flex", "items-center", "focus:outline-none", 3, "blur", "click", "ngClass"], [1, "flex", "items-center", "gap-3", "bg-dark-blue"], [1, "flex", "flex-col", "h-full", "bg-faint"], [1, "flex", "items-center", "justify-between", "px-5", "pt-2.5", "text-base", "font-semibold"], [1, "text-lg", "font-semibold"], [1, "px-5", "my-2.5"], [1, "h-fit", "p-2.5", "px-4", "rounded-base", "bg-white", "border"], [1, "flex", "flex-wrap", "gap-2.5"], ["width", "23", "height", "23", "viewBox", "0 0 25 25", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["cx", "12.5", "cy", "12.5", "r", "11.5", "stroke", "#4f4f4f", "stroke-width", "2"], ["d", "M12.2202 4C11.1564 4 10.1361 4.42261 9.38385 5.17486C8.6316 5.92712 8.20899 6.94739 8.20899 8.01124C8.20899 9.07509 8.6316 10.0954 9.38385 10.8476C10.1361 11.5999 11.1564 12.0225 12.2202 12.0225C13.2841 12.0225 14.3043 11.5999 15.0566 10.8476C15.8089 10.0954 16.2315 9.07509 16.2315 8.01124C16.2315 6.94739 15.8089 5.92712 15.0566 5.17486C14.3043 4.42261 13.2841 4 12.2202 4ZM12.2202 12.8247C12.6946 12.8258 13.1556 12.8579 13.6033 12.921C13.7538 12.942 13.8953 13.0054 14.0112 13.1037C14.1271 13.2021 14.2127 13.3313 14.2581 13.4764C14.3034 13.6215 14.3065 13.7765 14.2672 13.9233C14.2278 14.0701 14.1475 14.2027 14.0357 14.3057C13.3755 14.9105 12.8699 15.6649 12.5614 16.5055C12.2529 17.3461 12.1505 18.2484 12.2627 19.1368C12.2769 19.251 12.2664 19.3668 12.2318 19.4765C12.1973 19.5862 12.1396 19.6873 12.0626 19.7727C11.9856 19.8581 11.8911 19.926 11.7856 19.9718C11.68 20.0175 11.5659 20.04 11.4509 20.0377C9.83836 20.0056 8.33013 19.8644 7.20377 19.5195C6.6406 19.347 6.10951 19.1047 5.70678 18.7477C5.28079 18.3707 5 17.8628 5 17.2371C5 16.6057 5.2872 16.0153 5.6771 15.5211C6.07341 15.0197 6.62134 14.5584 7.26394 14.1653C8.54995 13.3823 10.2988 12.8247 12.2202 12.8247ZM20.4128 13.6542C20.7888 14.0304 21 14.5404 21 15.0722C21 15.604 20.7888 16.1141 20.4128 16.4902L17.6707 19.2323C17.4867 19.4162 17.248 19.5356 16.9904 19.5724L15.138 19.8372C15.0145 19.8549 14.8887 19.8436 14.7703 19.8042C14.652 19.7648 14.5445 19.6983 14.4563 19.6101C14.3682 19.5219 14.3018 19.4143 14.2625 19.2959C14.2232 19.1776 14.212 19.0517 14.2299 18.9282L14.4946 17.0766C14.5313 16.8188 14.6506 16.5798 14.8348 16.3955L17.5768 13.6534C17.9529 13.2775 18.463 13.0662 18.9948 13.0662C19.5266 13.0662 20.0367 13.2775 20.4128 13.6534V13.6542Z", "fill", "#4f4f4f"], ["size", "sm", 1, "cursor-pointer", "flex", 3, "detail", "matTooltip"], [1, "flex", "items-center", "justify-between", "px-5", "pt-5", "text-base", "font-semibold"], [1, "h-fit", "p-2.5", "rounded-base", "bg-white", "border"], [1, "flex", "items-center", "gap-2", "mb-2", "text-xs", "font-semibold"], [3, "change", "ngModelChange", "ngModel"], [3, "hidden", 4, "ngFor", "ngForOf"], [1, "flex", "justify-between", "px-5", "pb-5", "pt-2.5", "items-center"], [3, "ngModelChange", "ngModel"], [1, "font-semibold"], [3, "click", "keydown.enter", "keydown.space"], [3, "hidden"], [1, "flex", "flex-wrap", "gap-2"], ["role", "checkbox", "tabindex", "0", "aria-checked", "false", "size", "lg", 1, "cursor-pointer", 3, "click", "keydown.enter", "keydown.space", "detail", "matTooltip", "active"]], template: function SharewithteamComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, SharewithteamComponent_ng_container_0_Template, 7, 16, "ng-container", 3)(1, SharewithteamComponent_ng_template_1_Template, 3, 2, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
      }
      if (rf & 2) {
        const notGlobalShare_r21 = \u0275\u0275reference(2);
        \u0275\u0275property("ngIf", ctx.globalshare)("ngIfElse", notGlobalShare_r21);
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, FormsModule, NgControlStatus, NgModel, AvatarComponent, MatSlideToggleModule, IconComponent, MatCheckboxModule, MatCheckbox, MatTooltipModule, MatTooltip, ButtonComponent, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SharewithteamComponent, { className: "SharewithteamComponent", filePath: "src\\app\\shared\\components\\myfiles\\sharewithteam\\sharewithteam.component.ts", lineNumber: 34 });
})();

export {
  MYFILES_TOOL_EVENTS,
  SharewithteamComponent
};
//# sourceMappingURL=chunk-UPZPMN2N.js.map
