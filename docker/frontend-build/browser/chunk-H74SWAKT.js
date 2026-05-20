import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  CommonModule,
  NgClass,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction5,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/avatar/avatar.component.ts
var _c0 = (a0, a1, a2, a3, a4) => ({ "size-[25px] text-[9px]": a0, "size-[35px] text-[13px]": a1, "size-[50px] text-[18px]": a2, "size-[60px] text-[16px]": a3, "border-brand border-[3px]": a4 });
function AvatarComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "img", 2);
    \u0275\u0275listener("error", function AvatarComponent_ng_container_1_Template_img_error_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPathError(ctx_r1.detail));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("src", ctx_r1.path, \u0275\u0275sanitizeUrl);
  }
}
function AvatarComponent_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", ctx_r1.initials.Fn, "", ctx_r1.initials.Ln, "");
  }
}
var AvatarComponent = class _AvatarComponent {
  constructor(cf, cdr) {
    this.cf = cf;
    this.cdr = cdr;
    this.size = "lg";
    this.active = false;
    this.initials = {};
    this.imgPath = `${environment.documentStorage}${environment.userProfilePath}`;
  }
  ngOnChanges(changes) {
    if (changes["detail"] && changes["detail"].currentValue) {
      if (this.detail?.cProfile) {
        this.path = this.imgPath + (this.sourcePath || "users/") + this.detail?.cProfile;
      }
      this.cf.get_userinit(this.detail).then((initials) => {
        this.initials = initials;
        this.cdr.markForCheck();
      });
    }
    if (this.detail?.cProfile) {
      this.path = this.imgPath + (this.sourcePath || "users/") + this.detail?.cProfile;
    }
    this.cdr.detectChanges();
  }
  ngOnInit() {
    this.path = this.imgPath + (this.sourcePath || "users/") + this.detail?.cProfile;
    this.cdr.detectChanges();
  }
  onPathError(detail) {
    this.path = "assets/colorlogo.svg";
    this.cdr.detectChanges();
  }
  static {
    this.\u0275fac = function AvatarComponent_Factory(t) {
      return new (t || _AvatarComponent)(\u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AvatarComponent, selectors: [["avtr"]], inputs: { size: "size", detail: "detail", active: "active", path: "path", sourcePath: "sourcePath" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 11, consts: [[1, "inline-flex", "overflow-hidden", "transition-all", "size-", "items-center", "justify-center", "rounded-full", "font-semibold", "text-white", "leading-none", "border", "border-[#DAE2EA]", 3, "ngClass"], [4, "ngIf"], [1, "object-cover", "w-full", "h-full", 3, "error", "src"]], template: function AvatarComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "span", 0);
        \u0275\u0275template(1, AvatarComponent_ng_container_1_Template, 2, 1, "ng-container", 1)(2, AvatarComponent_ng_container_2_Template, 3, 2, "ng-container", 1);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275classMap(ctx.initials.bg);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction5(5, _c0, ctx.size == "sm", ctx.size == "lg", ctx.size == "xl", ctx.size == "2xl", ctx.active));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.detail == null ? null : ctx.detail.cProfile);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !(ctx.detail == null ? null : ctx.detail.cProfile));
      }
    }, dependencies: [CommonModule, NgClass, NgIf], styles: ["\n\n.size-25[_ngcontent-%COMP%] {\n  height: 25px;\n  width: 25px;\n}\n.size-35[_ngcontent-%COMP%] {\n  height: 35px;\n  width: 35px;\n}\n.size-60[_ngcontent-%COMP%] {\n  height: 60px;\n  width: 60px;\n}\n/*# sourceMappingURL=avatar.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AvatarComponent, { className: "AvatarComponent", filePath: "src\\app\\shared\\components\\avatar\\avatar.component.ts", lineNumber: 14 });
})();

export {
  AvatarComponent
};
//# sourceMappingURL=chunk-H74SWAKT.js.map
