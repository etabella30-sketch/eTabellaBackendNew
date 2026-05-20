import {
  DateShowComponent
} from "./chunk-YOQ7GVDA.js";
import {
  SourceCardComponent
} from "./chunk-X7K4VII4.js";
import {
  SelectedIssuesComponent
} from "./chunk-MW4HJFH4.js";
import {
  FactboxComponent
} from "./chunk-TCIDVFXD.js";
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
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
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
  InputFlags,
  __async,
  booleanAttribute,
  ɵsetClassDebugInfo,
  ɵɵInputTransformsFeature,
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
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpropertyInterpolate,
  ɵɵpureFunction1,
  ɵɵpureFunction3,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/pdf/components/linkviews/facts/factcard/factcard.component.ts
var _c0 = (a0, a1, a2) => ({ "!shadow-none": a0, "!my-0 !bg-transparent": a1, "!bg-white": a2 });
var _c1 = (a0) => ({ value: a0 });
var _c2 = (a0) => ({ "background": a0 });
var _c3 = (a0) => ({ "!text-xxs !flex-row flex-wrap text-blue-hover": a0 });
function FactcardComponent_span_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 15);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 1, "FACTS.CARD.FACT_LINK"), "");
  }
}
function FactcardComponent_span_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 16);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(2, 1, "FACTS.CARD.SHARED_BY", \u0275\u0275pureFunction1(4, _c1, ctx_r0.data == null ? null : ctx_r0.data.cCreateby)), " ");
  }
}
function FactcardComponent_span_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2("", ctx_r0.data == null ? null : ctx_r0.data.cPageno, "", ctx_r0.cFFrom != "I" && (ctx_r0.data == null ? null : ctx_r0.data.nSequence) ? "." + (ctx_r0.data == null ? null : ctx_r0.data.nSequence) : "", " ");
  }
}
function FactcardComponent_ng_container_15_ng_container_1_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, ",");
    \u0275\u0275elementEnd();
  }
}
function FactcardComponent_ng_container_15_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, FactcardComponent_ng_container_15_ng_container_1_span_3_Template, 2, 0, "span", 9);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    const i_r3 = ctx.index;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r2, "");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", i_r3 != ctx_r0.data.jLinktype.pages.length - 1);
  }
}
function FactcardComponent_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FactcardComponent_ng_container_15_ng_container_1_Template, 4, 2, "ng-container", 17);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r0.data == null ? null : ctx_r0.data.jLinktype == null ? null : ctx_r0.data.jLinktype.pages);
  }
}
function FactcardComponent_ng_container_16_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, " - ");
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate((ctx_r0.data == null ? null : ctx_r0.data.jLinktype == null ? null : ctx_r0.data.jLinktype.end) || 1);
  }
}
function FactcardComponent_ng_container_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, FactcardComponent_ng_container_16_span_3_Template, 4, 1, "span", 9);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((ctx_r0.data == null ? null : ctx_r0.data.jLinktype == null ? null : ctx_r0.data.jLinktype.start) || 1);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.data == null ? null : ctx_r0.data.jLinktype == null ? null : ctx_r0.data.jLinktype.end);
  }
}
function FactcardComponent_div_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 18);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(1, _c2, "#" + (ctx_r0.data == null ? null : ctx_r0.data.cColor)));
  }
}
function FactcardComponent_ng_container_19_ng_container_1_btn_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 22);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function FactcardComponent_ng_container_19_ng_container_1_btn_2_Template_btn_click_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(3);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r0.getDetail("FS"));
    });
    \u0275\u0275element(2, "icon", 23);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275propertyInterpolate("matTooltip", \u0275\u0275pipeBind1(1, 3, "FACTS.CARD.TOOLTIP.OPEN_FACTSHEET"));
    \u0275\u0275property("active", ctx_r0.nFSid == ctx_r0.data.nFSid && ctx_r0.type == "FS")("noborder", true);
  }
}
function FactcardComponent_ng_container_19_ng_container_1_btn_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 22);
    \u0275\u0275pipe(1, "translate");
    \u0275\u0275listener("click", function FactcardComponent_ng_container_19_ng_container_1_btn_3_Template_btn_click_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r0 = \u0275\u0275nextContext(3);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r0.getDetail("ST"));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 24);
    \u0275\u0275element(3, "path", 25)(4, "path", 26)(5, "path", 27)(6, "path", 28);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275propertyInterpolate("matTooltip", \u0275\u0275pipeBind1(1, 4, "FACTS.CARD.TOOLTIP.VIEW_SOURCE"));
    \u0275\u0275property("active", ctx_r0.nFSid == ctx_r0.data.nFSid && ctx_r0.type == "ST")("noborder", true);
    \u0275\u0275attribute("isdisabled", !(ctx_r0.data == null ? null : ctx_r0.data.jOT == null ? null : ctx_r0.data.jOT.length));
  }
}
function FactcardComponent_ng_container_19_ng_container_1_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 22);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275listener("click", function FactcardComponent_ng_container_19_ng_container_1_ng_container_4_Template_btn_click_1_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext(3);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r0.getDetail("C"));
    });
    \u0275\u0275element(3, "icon", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "btn", 30);
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275listener("click", function FactcardComponent_ng_container_19_ng_container_1_ng_container_4_Template_btn_click_4_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext(3);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r0.getDetail("T"));
    });
    \u0275\u0275element(6, "icon", 31);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "btn", 30);
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275listener("click", function FactcardComponent_ng_container_19_ng_container_1_ng_container_4_Template_btn_click_7_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext(3);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r0.getDetail("S"));
    });
    \u0275\u0275element(9, "icon", 32);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "btn", 33);
    \u0275\u0275pipe(11, "translate");
    \u0275\u0275listener("click", function FactcardComponent_ng_container_19_ng_container_1_ng_container_4_Template_btn_click_10_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext(3);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r0.getDetail("M"));
    });
    \u0275\u0275element(12, "icon", 34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275propertyInterpolate("matTooltip", \u0275\u0275pipeBind1(2, 17, "FACTS.CARD.TOOLTIP.CONTACTS"));
    \u0275\u0275property("active", ctx_r0.nFSid == ctx_r0.data.nFSid && ctx_r0.type == "C")("noborder", true);
    \u0275\u0275attribute("isdisabled", 0 >= (ctx_r0.data == null ? null : ctx_r0.data.t_contact));
    \u0275\u0275advance(3);
    \u0275\u0275propertyInterpolate("matTooltip", \u0275\u0275pipeBind1(5, 19, "FACTS.CARD.TOOLTIP.TASKS"));
    \u0275\u0275property("active", ctx_r0.nFSid == ctx_r0.data.nFSid && ctx_r0.type == "T")("noborder", true);
    \u0275\u0275attribute("isdisabled", 0 >= (ctx_r0.data == null ? null : ctx_r0.data.t_tasks));
    \u0275\u0275advance(3);
    \u0275\u0275propertyInterpolate("matTooltip", \u0275\u0275pipeBind1(8, 21, "FACTS.CARD.TOOLTIP.SHARE"));
    \u0275\u0275property("active", ctx_r0.nFSid == ctx_r0.data.nFSid && ctx_r0.type == "S")("noborder", true);
    \u0275\u0275attribute("isdisabled", 0 >= (ctx_r0.data == null ? null : ctx_r0.data.t_shared));
    \u0275\u0275advance(3);
    \u0275\u0275propertyInterpolate("matTooltip", \u0275\u0275pipeBind1(11, 23, "FACTS.CARD.TOOLTIP.DISCUSSION"));
    \u0275\u0275property("active", ctx_r0.nFSid == ctx_r0.data.nFSid && ctx_r0.type == "M")("noborder", true)("addcls", ctx_r0.data.UnreadMsg ? "text-sred !text-base" : "!text-base");
    \u0275\u0275attribute("isdisabled", 0 >= (ctx_r0.data == null ? null : ctx_r0.data.t_comments));
  }
}
function FactcardComponent_ng_container_19_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 19);
    \u0275\u0275template(2, FactcardComponent_ng_container_19_ng_container_1_btn_2_Template, 3, 5, "btn", 20)(3, FactcardComponent_ng_container_19_ng_container_1_btn_3_Template, 7, 6, "btn", 20)(4, FactcardComponent_ng_container_19_ng_container_1_ng_container_4_Template, 13, 25, "ng-container", 9);
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "div", 21);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r0.isFactLink);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r0.data == null ? null : ctx_r0.data.cType) != "M");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.isFactLink);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", !ctx_r0.isnavigate ? "bg-grey/30" : "bg-grey");
  }
}
function FactcardComponent_ng_container_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FactcardComponent_ng_container_19_ng_container_1_Template, 6, 4, "ng-container", 9);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.viewmode != "M");
  }
}
function FactcardComponent_div_21_ng_container_1_div_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "div", 37);
    \u0275\u0275element(2, "avtr", 38);
    \u0275\u0275elementStart(3, "div", 39)(4, "span", 40);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "span");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "span");
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "span");
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275property("detail", ctx_r0.data)("sourcePath", "contacts/");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", ctx_r0.data == null ? null : ctx_r0.data.cFname, " ", ctx_r0.data == null ? null : ctx_r0.data.cLname, "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("@ ", ctx_r0.data.cMentiontag, "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r0.data.cRole, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r0.data.cPartyname, " ");
  }
}
function FactcardComponent_div_21_ng_container_1_ng_container_2_span_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 45);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", \u0275\u0275pipeBind1(2, 2, "FACTS.CARD.TIMEZONE"), " : ", ctx_r0.data == null ? null : ctx_r0.data.cTimezone, " ");
  }
}
function FactcardComponent_div_21_ng_container_1_ng_container_2_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 46);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", \u0275\u0275pipeBind1(2, 2, "FACTS.CARD.TYPE"), " : ", ctx_r0.data == null ? null : ctx_r0.data.cFiletype, " ");
  }
}
function FactcardComponent_div_21_ng_container_1_ng_container_2_span_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 47);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", \u0275\u0275pipeBind1(2, 2, "FACTS.CARD.STATUS"), " : ", ctx_r0.data == null ? null : ctx_r0.data.cStatus, " ");
  }
}
function FactcardComponent_div_21_ng_container_1_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FactcardComponent_div_21_ng_container_1_ng_container_2_span_1_Template, 3, 4, "span", 41);
    \u0275\u0275element(2, "date-show", 42);
    \u0275\u0275template(3, FactcardComponent_div_21_ng_container_1_ng_container_2_span_3_Template, 3, 4, "span", 43)(4, FactcardComponent_div_21_ng_container_1_ng_container_2_span_4_Template, 3, 4, "span", 44);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.isnavigate);
    \u0275\u0275advance();
    \u0275\u0275property("jDate", ctx_r0.data == null ? null : ctx_r0.data.jDate);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.data == null ? null : ctx_r0.data.cFiletype);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.data == null ? null : ctx_r0.data.cStatus);
  }
}
function FactcardComponent_div_21_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FactcardComponent_div_21_ng_container_1_div_1_Template, 12, 7, "div", 36)(2, FactcardComponent_div_21_ng_container_1_ng_container_2_Template, 5, 4, "ng-container", 9);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.iscontact && ctx_r0.viewmode == "F");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", (ctx_r0.data == null ? null : ctx_r0.data.cFType) == "F" || (ctx_r0.data == null ? null : ctx_r0.data.cSource) == "F");
  }
}
function FactcardComponent_div_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 35);
    \u0275\u0275template(1, FactcardComponent_div_21_ng_container_1_Template, 3, 2, "ng-container", 9);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(2, _c3, ctx_r0.isnavigate));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.quickfact);
  }
}
function FactcardComponent_ng_container_22_source_card_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "source-card", 52);
    \u0275\u0275pipe(1, "translate");
  }
  if (rf & 2) {
    const x_r7 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275propertyInterpolate("cardheading", \u0275\u0275pipeBind1(1, 6, "FACTS.CARD.DESTINATION_FILE"));
    \u0275\u0275property("heading", true)("mode", ctx_r0.isnavigate ? "dark" : "")("truncate", false)("isFactL", true)("detail", x_r7);
  }
}
function FactcardComponent_ng_container_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 48)(2, "div", 49);
    \u0275\u0275element(3, "icon", 50);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(4, FactcardComponent_ng_container_22_source_card_4_Template, 2, 8, "source-card", 51);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275property("name", "factIn");
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r0.filelinks);
  }
}
function FactcardComponent_ng_container_24_factbox_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "factbox", 55);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("jTexts", ctx_r0.jTexts)("bIsHighlighted", ctx_r0.data == null ? null : ctx_r0.data.bIsHighlighted)("jOT", ctx_r0.data.jOT)("ishilight", (ctx_r0.data == null ? null : ctx_r0.data.jOT == null ? null : ctx_r0.data.jOT.length) > 0);
  }
}
function FactcardComponent_ng_container_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "div", 53);
    \u0275\u0275template(2, FactcardComponent_ng_container_24_factbox_2_Template, 1, 4, "factbox", 54);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r0.data);
  }
}
function FactcardComponent_ng_container_25_source_card_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "source-card", 59);
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("mode", ctx_r0.isnavigate ? "dark" : "")("truncate", false)("isFactL", true)("detail", x_r8);
  }
}
function FactcardComponent_ng_container_25_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 56)(2, "span", 57);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, FactcardComponent_ng_container_25_source_card_5_Template, 1, 4, "source-card", 58);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(4, 2, "FACTS.CARD.FACT_LINKS"));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r0.filelinks);
  }
}
var FactcardComponent = class _FactcardComponent {
  constructor(cdr, scureStorage) {
    this.cdr = cdr;
    this.scureStorage = scureStorage;
    this.cFFrom = "RT";
    this.isFactLink = false;
    this.viewmode = "M";
    this.data = {};
    this.onCardEvent = new EventEmitter();
    this.jTexts = [];
    this.isLight = false;
    this.quickfact = false;
    this.issueList = [];
    this.filelinks = [];
    this.userList = [];
    this.isnavigate = false;
    this.iscontact = false;
    this.showavatar = false;
    this.nohover = false;
    this.type = "";
    this.OnView = new EventEmitter();
  }
  ngOnChanges(changes) {
    if (changes["filelinks"]) {
      this.filelinks = changes["filelinks"].currentValue;
    }
    if (changes["issueList"] || changes["filelinks"] || changes["data"]) {
      this.cdr.detectChanges();
    }
  }
  ngOnInit() {
    void this.init();
  }
  init() {
    return __async(this, null, function* () {
      try {
        this.nUserid = yield this.scureStorage.getUserId();
        this.jTexts = this.data.jTexts || [];
        if (this.data?.jDate) {
        }
      } catch (error) {
        const errMsg = ErrorHandlerUtil.getErrorMessage(error);
        throw new Error(errMsg);
      } finally {
        this.cdr.detectChanges();
      }
    });
  }
  getDetail(type) {
    this.onCardEvent.emit({ event: "VIEW", data: type });
  }
  deleteTask() {
    this.onCardEvent.emit({ event: "DELETE", data: "" });
  }
  editTask() {
    this.onCardEvent.emit({ event: "EDIT", data: "" });
  }
  OnViewEvent(x) {
    this.OnView.emit(x);
  }
  handleData() {
    try {
      this.jTexts = this.data.jTexts || [];
      if (this.data?.jDate) {
        this.date1 = this.data.jDate.date1 || "";
        this.date2 = this.data.jDate.date2 || "";
      }
    } catch (error) {
      const errMsg = ErrorHandlerUtil.getErrorMessage(error);
      throw new Error(errMsg);
    }
  }
  OpenFactLink(event, filedata) {
    const evtType = event?.type ?? null;
    this.OnView.emit({ event: evtType, data: filedata });
  }
  static {
    this.\u0275fac = function FactcardComponent_Factory(t) {
      return new (t || _FactcardComponent)(\u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FactcardComponent, selectors: [["factcard"]], inputs: { cFFrom: "cFFrom", isFactLink: "isFactLink", viewmode: "viewmode", data: "data", isLight: "isLight", quickfact: "quickfact", issueList: "issueList", filelinks: "filelinks", userList: "userList", isnavigate: [InputFlags.HasDecoratorInputTransform, "isnavigate", "isnavigate", booleanAttribute], iscontact: [InputFlags.HasDecoratorInputTransform, "iscontact", "iscontact", booleanAttribute], showavatar: "showavatar", nohover: "nohover", nFSid: "nFSid", type: "type", selectedMode: "selectedMode" }, outputs: { onCardEvent: "onCardEvent", OnView: "OnView" }, standalone: true, features: [\u0275\u0275InputTransformsFeature, \u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 26, vars: 33, consts: [[1, "relative", "w-full", "my-3", "shadow-[0_3px_10px_#94949440]", "bg-black", "rounded-base", "overflow-hidden", "link-line-box", "pb-2.5", 3, "ngClass"], ["class", "block w-full text-white font-bold text-sm ps-2 pt-2.5", 4, "ngIf"], [1, "flex", "items-center", "gap-2", "w-full", "pe-2", "pb-2.5", "relative"], ["class", "w-full text-white font-semibold text-xxs", 4, "ngIf"], [1, "block", "w-full", "text-white", "font-semibold", "text-xxs"], ["width", "24", "height", "24", "viewBox", "0 0 24 24", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "ms-auto", "me-2"], ["d", "M20.4853 3.51472C19.371 2.40042 18.0481 1.5165 16.5922 0.913446C15.1363 0.310389 13.5759 1.17411e-08 12 0C10.4241 -1.17411e-08 8.86371 0.310389 7.4078 0.913445C5.95189 1.5165 4.62902 2.40042 3.51472 3.51472C2.40042 4.62902 1.5165 5.95189 0.913445 7.4078C0.310389 8.86371 -1.17411e-08 10.4241 0 12C1.17411e-08 13.5759 0.310389 15.1363 0.913446 16.5922C1.5165 18.0481 2.40042 19.371 3.51472 20.4853C4.62902 21.5996 5.95189 22.4835 7.4078 23.0866C8.86371 23.6896 10.4241 24 12 24C13.5759 24 15.1363 23.6896 16.5922 23.0866C18.0481 22.4835 19.371 21.5996 20.4853 20.4853C21.5996 19.371 22.4835 18.0481 23.0866 16.5922C23.6896 15.1363 24 13.5759 24 12C24 10.4241 23.6896 8.86371 23.0866 7.4078C22.4835 5.95189 21.5996 4.62902 20.4853 3.51472ZM8.30774 21.4614V14.7692H15.6923V21.4613C13.3173 22.3845 10.6827 22.3845 8.30774 21.4613V21.4614ZM19.1797 19.1798C18.68 19.6792 18.13 20.1255 17.5384 20.5117V14.7692C17.5378 14.2797 17.3432 13.8105 16.9971 13.4644C16.651 13.1183 16.1817 12.9236 15.6923 12.9231V5.53854C15.6923 5.3812 15.652 5.22647 15.5754 5.08904C15.4988 4.95162 15.3883 4.83606 15.2545 4.75335C15.1206 4.67063 14.9678 4.6235 14.8106 4.61644C14.6535 4.60937 14.4971 4.6426 14.3564 4.71297L8.81796 7.48217C8.66465 7.55883 8.53571 7.67667 8.44559 7.82249C8.35548 7.9683 8.30774 8.13632 8.30774 8.30774V12.9231C7.81828 12.9236 7.34903 13.1183 7.00293 13.4644C6.65683 13.8105 6.46216 14.2797 6.46161 14.7692V20.5117C5.87003 20.1255 5.32 19.6791 4.82028 19.1797C3.40024 17.7597 2.43318 15.9505 2.04139 13.9808C1.64959 12.0112 1.85066 9.96964 2.61917 8.11428C3.38768 6.25892 4.68911 4.67312 6.35888 3.55741C8.02865 2.44169 9.99178 1.84619 12 1.84619C14.0082 1.84619 15.9713 2.44169 17.6411 3.55741C19.3109 4.67312 20.6123 6.25892 21.3808 8.11428C22.1493 9.96964 22.3504 12.0112 21.9586 13.9808C21.5668 15.9505 20.5998 17.7597 19.1797 19.1797V19.1798Z", "fill", "white"], [1, "bg-blue-on", "flex", "items-center", "justify-end", "h-5", "px-2", "text-xs", "text-end", "text-white", "whitespace-nowrap", 3, "click"], [1, "me-1"], [4, "ngIf"], [1, "flex", "gap-2", "pe-2", "w-full"], ["class", "bar absolute  w-2 top-1/2 -translate-y-1/2 h-full left-0", 3, "ngStyle", 4, "ngIf"], [1, "w-full"], ["class", "flex flex-col gap-1 text-xxs mb-2.5", 3, "ngClass", 4, "ngIf"], [1, "text-white", 3, "viewmode", "issueList"], [1, "block", "w-full", "text-white", "font-bold", "text-sm", "ps-2", "pt-2.5"], [1, "w-full", "text-white", "font-semibold", "text-xxs"], [4, "ngFor", "ngForOf"], [1, "bar", "absolute", "w-2", "top-1/2", "-translate-y-1/2", "h-full", "left-0", 3, "ngStyle"], [1, "flex", "flex-col", "gap-5"], ["square", "", "issmall", "", "mode", "clear", "addcls", "!text-base", 3, "matTooltip", "active", "noborder", "click", 4, "ngIf"], [1, "w-px", "h-auto", "me-2", 3, "ngClass"], ["square", "", "issmall", "", "mode", "clear", "addcls", "!text-base", 3, "click", "matTooltip", "active", "noborder"], ["name", "factD", "type", "indicn"], ["width", "14", "height", "15", "viewBox", "0 0 14 15", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M1.05469 1.6C1.05469 1.44087 1.1179 1.28826 1.23042 1.17574C1.34294 1.06321 1.49556 1 1.65469 1L11.5547 1C11.7138 1 11.8664 1.06321 11.979 1.17574C12.0915 1.28826 12.1547 1.44087 12.1547 1.6C12.1547 1.75913 12.0915 1.91174 11.979 2.02426C11.8664 2.13678 11.7138 2.2 11.5547 2.2H1.65469C1.49556 2.2 1.34294 2.13678 1.23042 2.02426C1.1179 1.91174 1.05469 1.75913 1.05469 1.6Z", "fill", "currentColor", "stroke", "currentColor", "stroke-width", "0.5"], ["d", "M1.05469 5.6C1.05469 5.44087 1.1179 5.28826 1.23042 5.17574C1.34294 5.06321 1.49556 5 1.65469 5L11.5547 5C11.7138 5 11.8664 5.06321 11.979 5.17574C12.0915 5.28826 12.1547 5.44087 12.1547 5.6C12.1547 5.75913 12.0915 5.91174 11.979 6.02426C11.8664 6.13678 11.7138 6.2 11.5547 6.2H1.65469C1.49556 6.2 1.34294 6.13678 1.23042 6.02426C1.1179 5.91174 1.05469 5.75913 1.05469 5.6Z", "fill", "currentColor", "stroke", "currentColor", "stroke-width", "0.5"], ["d", "M1.05469 9.6C1.05469 9.44087 1.1179 9.28826 1.23042 9.17574C1.34294 9.06321 1.49556 9 1.65469 9L11.5547 9C11.7138 9 11.8664 9.06321 11.979 9.17574C12.0915 9.28826 12.1547 9.44087 12.1547 9.6C12.1547 9.75913 12.0915 9.91174 11.979 10.0243C11.8664 10.1368 11.7138 10.2 11.5547 10.2H1.65469C1.49556 10.2 1.34294 10.1368 1.23042 10.0243C1.1179 9.91174 1.05469 9.75913 1.05469 9.6Z", "fill", "currentColor", "stroke", "currentColor", "stroke-width", "0.5"], ["d", "M1.05469 13.6C1.05469 13.4409 1.1179 13.2883 1.23042 13.1757C1.34294 13.0632 1.49556 13 1.65469 13L6.55469 13C6.71382 13 6.86643 13.0632 6.97895 13.1757C7.09147 13.2883 7.15469 13.4409 7.15469 13.6C7.15469 13.7591 7.09147 13.9117 6.97895 14.0243C6.86643 14.1368 6.71382 14.2 6.55469 14.2H1.65469C1.49556 14.2 1.34294 14.1368 1.23042 14.0243C1.1179 13.9117 1.05469 13.7591 1.05469 13.6Z", "fill", "currentColor", "stroke", "currentColor", "stroke-width", "0.5"], ["name", "contacts", "type", "myfileicn"], ["issmall", "", "square", "", "mode", "clear", "addcls", "!text-base", 3, "click", "matTooltip", "active", "noborder"], ["name", "tasks", "type", "extra"], ["name", "share", "type", "extra"], ["issmall", "", "square", "", "mode", "clear", 1, "mb-3", 3, "click", "matTooltip", "active", "noborder", "addcls"], ["name", "message", "type", "extra"], [1, "flex", "flex-col", "gap-1", "text-xxs", "mb-2.5", 3, "ngClass"], ["class", "w-full", 4, "ngIf"], [1, "flex", "gap-2", "items-start", "w-full", "mb-3"], [3, "detail", "sourcePath"], [1, "text-xs", "flex", "flex-col", "gap-1", "text-white"], [1, "text-sm", "font-semibold"], ["class", "block w-full", 4, "ngIf"], [3, "jDate"], ["class", "block w-fit min-w-28", 4, "ngIf"], ["class", "block w-fit", 4, "ngIf"], [1, "block", "w-full"], [1, "block", "w-fit", "min-w-28"], [1, "block", "w-fit"], [1, "relative"], [1, "flex", "items-center", "justify-center", "ms-auto", "gap-2", "z-50", "absolute", "size-[45px]", "right-2.5", "top-2.5", "bg-[#222222]", "rounded-full", "border", "border-white"], ["type", "indicn", 3, "name"], ["class", "mb-3 block last:mb-0", "addcls", "!bg-transparent", "gap", "S", "type", "P", 3, "heading", "cardheading", "mode", "truncate", "isFactL", "detail", 4, "ngFor", "ngForOf"], ["addcls", "!bg-transparent", "gap", "S", "type", "P", 1, "mb-3", "block", "last:mb-0", 3, "heading", "cardheading", "mode", "truncate", "isFactL", "detail"], [1, "w-full", "border-t", "border-grey", "my-3"], ["class", "text-white block mt-1", "mode", "light", 3, "jTexts", "bIsHighlighted", "jOT", "ishilight", 4, "ngIf"], ["mode", "light", 1, "text-white", "block", "mt-1", 3, "jTexts", "bIsHighlighted", "jOT", "ishilight"], [1, "py-3", "border-t", "border-grey", "w-full", "mt-3", "mb-5", "text-white"], [1, "font-semibold", "text-xs", "mb-3", "block"], ["iconEnd", "", "class", "mb-3 block last:mb-0", "gap", "S", "type", "P", "addcls", "!px-0 !pb-2 !bg-transparent", 3, "mode", "truncate", "isFactL", "detail", 4, "ngFor", "ngForOf"], ["iconEnd", "", "gap", "S", "type", "P", "addcls", "!px-0 !pb-2 !bg-transparent", 1, "mb-3", "block", "last:mb-0", 3, "mode", "truncate", "isFactL", "detail"]], template: function FactcardComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275template(1, FactcardComponent_span_1_Template, 3, 3, "span", 1);
        \u0275\u0275elementStart(2, "div", 2)(3, "div");
        \u0275\u0275template(4, FactcardComponent_span_4_Template, 3, 6, "span", 3);
        \u0275\u0275elementStart(5, "span", 4);
        \u0275\u0275text(6);
        \u0275\u0275pipe(7, "translate");
        \u0275\u0275pipe(8, "date");
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(9, "svg", 5);
        \u0275\u0275element(10, "path", 6);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(11, "div", 7);
        \u0275\u0275listener("click", function FactcardComponent_Template_div_click_11_listener() {
          return ctx.OnViewEvent(ctx.data);
        });
        \u0275\u0275elementStart(12, "span", 8);
        \u0275\u0275text(13, " P ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(14, FactcardComponent_span_14_Template, 2, 2, "span", 9)(15, FactcardComponent_ng_container_15_Template, 2, 1, "ng-container", 9)(16, FactcardComponent_ng_container_16_Template, 4, 2, "ng-container", 9);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(17, "div", 10);
        \u0275\u0275template(18, FactcardComponent_div_18_Template, 1, 3, "div", 11)(19, FactcardComponent_ng_container_19_Template, 2, 1, "ng-container", 9);
        \u0275\u0275elementStart(20, "div", 12);
        \u0275\u0275template(21, FactcardComponent_div_21_Template, 2, 4, "div", 13)(22, FactcardComponent_ng_container_22_Template, 5, 2, "ng-container", 9);
        \u0275\u0275element(23, "selected-issues", 14);
        \u0275\u0275template(24, FactcardComponent_ng_container_24_Template, 3, 1, "ng-container", 9)(25, FactcardComponent_ng_container_25_Template, 6, 4, "ng-container", 9);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction3(27, _c0, ctx.nohover, ctx.isnavigate, ctx.isLight));
        \u0275\u0275attribute("color", (ctx.data == null ? null : ctx.data.cColor) ? "#" + (ctx.data == null ? null : ctx.data.cColor) : "");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.isFactLink);
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.isFactLink ? "ps-2.5" : "pt-2.5 ps-4");
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.nUserid != (ctx.data == null ? null : ctx.data.nUserid));
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate2(" ", \u0275\u0275pipeBind2(7, 21, "FACTS.CARD.CREATED_BY", \u0275\u0275pureFunction1(31, _c1, ctx.data == null ? null : ctx.data.cCreateby)), " ", \u0275\u0275pipeBind2(8, 24, ctx.data == null ? null : ctx.data.dCreateDt, "dd/MM/yyyy"), " ");
        \u0275\u0275advance(8);
        \u0275\u0275property("ngIf", ctx.data == null ? null : ctx.data.cPageno);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !(ctx.data == null ? null : ctx.data.cPageno) && (ctx.data == null ? null : ctx.data.jLinktype == null ? null : ctx.data.jLinktype.pages == null ? null : ctx.data.jLinktype.pages.length));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !(ctx.data == null ? null : ctx.data.cPageno) && !(ctx.data == null ? null : ctx.data.jLinktype == null ? null : ctx.data.jLinktype.pages == null ? null : ctx.data.jLinktype.pages.length));
        \u0275\u0275advance();
        \u0275\u0275classMap(ctx.isFactLink ? "ps-2.5 pb-2.5" : "ps-4");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.isFactLink);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.quickfact);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", !ctx.isFactLink);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.filelinks == null ? null : ctx.filelinks.length) && ctx.isFactLink);
        \u0275\u0275advance();
        \u0275\u0275property("viewmode", ctx.viewmode)("issueList", ctx.issueList);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.jTexts.length || (ctx.data == null ? null : ctx.data.bIsHighlighted));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.filelinks == null ? null : ctx.filelinks.length) && !ctx.isFactLink && !ctx.quickfact && ctx.viewmode == "F");
      }
    }, dependencies: [SourceCardComponent, SelectedIssuesComponent, ButtonComponent, IconComponent, CommonModule, NgClass, NgForOf, NgIf, NgStyle, DatePipe, AvatarComponent, FactboxComponent, MatTooltipModule, MatTooltip, DateShowComponent, TranslateModule, TranslatePipe], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FactcardComponent, { className: "FactcardComponent", filePath: "src\\app\\pdf\\components\\linkviews\\facts\\factcard\\factcard.component.ts", lineNumber: 26 });
})();

export {
  FactcardComponent
};
//# sourceMappingURL=chunk-7IW6Q36L.js.map
