import {
  HelpcenterService
} from "./chunk-A6WEQJAW.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  ActivatedRoute,
  DomSanitizer
} from "./chunk-FNSUDMGC.js";
import {
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵproperty,
  ɵɵsanitizeResourceUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/helpcenter/helpcenterdetail/helpcenterdetail.component.ts
function HelpcenterdetailComponent_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275element(1, "div", 10);
    \u0275\u0275elementEnd();
  }
}
var HelpcenterdetailComponent = class _HelpcenterdetailComponent {
  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['selectedsubmodule']) {
  //     this.link = this.sanitizeUrl(this.selectedsubmodule.cLink);  
  //   }
  // }
  constructor(sanitizer, route, helpcenterService, cf) {
    this.sanitizer = sanitizer;
    this.route = route;
    this.helpcenterService = helpcenterService;
    this.cf = cf;
    this.cTitle = "";
    this.link = "";
    this.isLoaded = false;
    this.route.queryParams.subscribe((params) => {
      this.helpcenterService.getsubmodule_detail(params["nSMid"]).then((res) => {
        this.link = this.sanitizeUrl(res.cLink);
        this.cTitle = res.cTitle;
      });
    });
  }
  sanitizeUrl(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  ngOnInit() {
  }
  goToHome() {
    this.cf.goto("/user/dashboard");
  }
  onLoad() {
    setTimeout(() => {
      this.isLoaded = true;
    }, 1e3);
  }
  static {
    this.\u0275fac = function HelpcenterdetailComponent_Factory(t) {
      return new (t || _HelpcenterdetailComponent)(\u0275\u0275directiveInject(DomSanitizer), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(HelpcenterService), \u0275\u0275directiveInject(CommonfunctionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HelpcenterdetailComponent, selectors: [["helpcenterdetail"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 16, vars: 3, consts: [[1, "h-full", "w-full", "flex", "flex-col"], [1, "px-8", "min-h-15", "flex", "bg-dark-blue", "relative", "z-20"], [1, "flex", "items-center", "gap-6", "text-blue-deactivate/70"], ["width", "30px", "src", "assets/colorlogo.svg"], [1, "text-sm", "text-blue-deactivate/70", "cursor-pointer", 3, "click"], [1, "text-sm", "font-semibold"], [1, "text-sm", "font-semibold", "text-white", "underline"], [1, "h-full", "bg-[#f8fafc]"], [1, "flex", "items-center", "justify-center", "h-full"], ["width", "100%", "height", "100%", "allowfullscreen", "", "frameborder", "0", 3, "load", "src"], [1, "h-[90vh]", "w-[720px]", "bg-[#ecedef]", "animate-pulse", "rounded-base"]], template: function HelpcenterdetailComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "header", 1)(2, "div", 2);
        \u0275\u0275element(3, "img", 3);
        \u0275\u0275elementStart(4, "div")(5, "span", 4);
        \u0275\u0275listener("click", function HelpcenterdetailComponent_Template_span_click_5_listener() {
          return ctx.goToHome();
        });
        \u0275\u0275text(6, "Dashboard ");
        \u0275\u0275elementEnd();
        \u0275\u0275text(7, "/ ");
        \u0275\u0275elementStart(8, "span", 5);
        \u0275\u0275text(9, " Help Center ");
        \u0275\u0275elementEnd();
        \u0275\u0275text(10, " / ");
        \u0275\u0275elementStart(11, "span", 6);
        \u0275\u0275text(12);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(13, "div", 7);
        \u0275\u0275template(14, HelpcenterdetailComponent_Conditional_14_Template, 2, 0, "div", 8);
        \u0275\u0275elementStart(15, "iframe", 9);
        \u0275\u0275listener("load", function HelpcenterdetailComponent_Template_iframe_load_15_listener() {
          return ctx.onLoad();
        });
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(12);
        \u0275\u0275textInterpolate1("", ctx.cTitle, " ");
        \u0275\u0275advance(2);
        \u0275\u0275conditional(14, !ctx.isLoaded ? 14 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("src", ctx.link, \u0275\u0275sanitizeResourceUrl);
      }
    }, styles: ["\n\nbody[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 6px;\n  height: 6px;\n  margin: 10px 0;\n}\nbody[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 6px;\n  height: 6px;\n  margin: 10px 0;\n}\nbody[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  box-shadow: inset 0 0 6px rgba(255, 255, 255, 0);\n}\nbody[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background-color: #c2c2c2;\n  outline: 1px solid rgba(194, 194, 194, 0);\n  border-radius: 50px;\n  border-top: 15px solid rgba(255, 0, 0, 0);\n  position: relative;\n  top: 20px;\n}\n/*# sourceMappingURL=helpcenterdetail.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HelpcenterdetailComponent, { className: "HelpcenterdetailComponent", filePath: "src\\app\\shared\\components\\helpcenter\\helpcenterdetail\\helpcenterdetail.component.ts", lineNumber: 13 });
})();

export {
  HelpcenterdetailComponent
};
//# sourceMappingURL=chunk-HPWK7LNS.js.map
