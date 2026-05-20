import "./chunk-HPWK7LNS.js";
import {
  HelpcenterService
} from "./chunk-A6WEQJAW.js";
import {
  TextareaComponent
} from "./chunk-KAW5EGN7.js";
import "./chunk-XTSEIZ7V.js";
import "./chunk-DVMGXG6V.js";
import {
  ProfileComponent
} from "./chunk-X5G7CPYH.js";
import "./chunk-ZC2EPQ66.js";
import "./chunk-ZLDLJ4OJ.js";
import "./chunk-2BPOYM2X.js";
import "./chunk-GNZXOHZW.js";
import "./chunk-XIPFTUTL.js";
import "./chunk-62ZTKIF6.js";
import "./chunk-SD32Y426.js";
import "./chunk-55ITPE7H.js";
import "./chunk-3LLM6WVC.js";
import "./chunk-XYPEOTVH.js";
import "./chunk-3A6FZELH.js";
import "./chunk-PNJCYNRI.js";
import "./chunk-43QUFIPG.js";
import "./chunk-E4U5AV5T.js";
import "./chunk-RXCKHUOJ.js";
import "./chunk-M4TJ3SSY.js";
import "./chunk-6XJ2ENW3.js";
import "./chunk-KCDHWQ5X.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField
} from "./chunk-Y2GGPNYR.js";
import "./chunk-FEMUAMTL.js";
import "./chunk-TECZMXLZ.js";
import "./chunk-2HPWN6DG.js";
import "./chunk-DWVFAK3Q.js";
import "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-H74SWAKT.js";
import {
  TicketService
} from "./chunk-WQBUN4X6.js";
import "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import {
  MatDialog,
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgControlStatusGroup,
  NgForm,
  NgModel,
  ɵNgNoValidate
} from "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import {
  animate,
  style,
  transition,
  trigger
} from "./chunk-AIKHFB75.js";
import {
  MatOption,
  MatRipple,
  MatRippleModule
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  ActivatedRoute,
  Router
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  NgClass
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
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpropertyInterpolate,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/assistance/assistance.component.ts
function AssistanceComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275text(1, "We received your feedback.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 5);
    \u0275\u0275text(3, "A ticket has been created. View the status of it inside your dashboard.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 6);
    \u0275\u0275text(5, "Respond time is typically within 24 hrs.");
    \u0275\u0275elementEnd();
  }
}
function AssistanceComponent_Conditional_3_For_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275property("value", x_r3.nCaseid);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r3.cCasename, " ");
  }
}
function AssistanceComponent_Conditional_3_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275text(1, "Case is required");
    \u0275\u0275elementEnd();
  }
}
function AssistanceComponent_Conditional_3_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div");
    \u0275\u0275text(1, "Description is required");
    \u0275\u0275elementEnd();
  }
}
function AssistanceComponent_Conditional_3_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 14)(1, "h6", 15);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "icon", 16);
    \u0275\u0275listener("click", function AssistanceComponent_Conditional_3_Conditional_14_Template_icon_click_3_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.uploadlength = 0);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "btn", 17);
    \u0275\u0275listener("click", function AssistanceComponent_Conditional_3_Conditional_14_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.getFile());
    });
    \u0275\u0275text(5, "Replace");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.cImagename);
  }
}
function AssistanceComponent_Conditional_3_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 17);
    \u0275\u0275listener("click", function AssistanceComponent_Conditional_3_Conditional_15_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.getFile());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 18);
    \u0275\u0275element(2, "path", 19)(3, "path", 20)(4, "path", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275text(5, " Attach an image ");
    \u0275\u0275elementEnd();
  }
}
function AssistanceComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275text(1, "Need Assistance?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 7);
    \u0275\u0275text(3, "Our trained staff is here to help");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "mat-form-field", 8)(5, "mat-select", 9);
    \u0275\u0275twoWayListener("ngModelChange", function AssistanceComponent_Conditional_3_Template_mat_select_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.nCaseid, $event) || (ctx_r1.nCaseid = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275repeaterCreate(6, AssistanceComponent_Conditional_3_For_7_Template, 2, 2, "mat-option", 10, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(8, AssistanceComponent_Conditional_3_Conditional_8_Template, 2, 0, "div");
    \u0275\u0275elementStart(9, "txtarea", 11);
    \u0275\u0275listener("valueChange", function AssistanceComponent_Conditional_3_Template_txtarea_valueChange_9_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.cDesc = $event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, AssistanceComponent_Conditional_3_Conditional_10_Template, 2, 0, "div");
    \u0275\u0275elementStart(11, "h6", 12);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "input", 13);
    \u0275\u0275listener("change", function AssistanceComponent_Conditional_3_Template_input_change_13_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onFileChange($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(14, AssistanceComponent_Conditional_3_Conditional_14_Template, 6, 1, "div", 14)(15, AssistanceComponent_Conditional_3_Conditional_15_Template, 6, 0);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.nCaseid);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.caselist);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(8, ctx_r1.isSubmitted && !ctx_r1.nCaseid ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("value", ctx_r1.cDesc)("minrows", 4);
    \u0275\u0275advance();
    \u0275\u0275conditional(10, ctx_r1.isSubmitted && !ctx_r1.nCaseid ? 10 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Session ID: ", ctx_r1.cSessionid, "");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(14, ctx_r1.uploadlength > 0 ? 14 : 15);
  }
}
function AssistanceComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 3);
    \u0275\u0275element(1, "rect", 22)(2, "rect", 23)(3, "path", 24);
    \u0275\u0275elementEnd();
  }
}
function AssistanceComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 25);
    \u0275\u0275listener("click", function AssistanceComponent_Conditional_6_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.submitTicket());
    });
    \u0275\u0275text(1, "Submit");
    \u0275\u0275elementEnd();
  }
}
var AssistanceComponent = class _AssistanceComponent {
  constructor(MatDialogRef2, ticketS, cdr) {
    this.MatDialogRef = MatDialogRef2;
    this.ticketS = ticketS;
    this.cdr = cdr;
    this.success = false;
    this.uploadlength = 0;
    this.cSessionid = "";
    this.caselist = [];
    this.isSubmitted = false;
    this.cDesc = "";
    this.cSessionid = Math.floor(Math.random() * 1e10 + 1).toString();
  }
  ngOnInit() {
    this.getAssignedCase();
  }
  close() {
    this.MatDialogRef.close();
  }
  generateRandomString(length = 12) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  getAssignedCase() {
    return __async(this, null, function* () {
      this.caselist = yield this.ticketS.getCaseList();
    });
  }
  getFile() {
    const fileInput = document.querySelector("#ticketimage");
    fileInput.click();
  }
  onFileChange(e) {
    return __async(this, null, function* () {
      if (!e.target.files[0])
        return;
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      var filename = e.target.files[0].name;
      const res = yield this.ticketS.moduleimageUpload(formData);
      if (res?.msg == 1) {
        this.uploadlength = 1;
        this.cImage = res.value;
        this.cImagename = filename;
      }
      let fileInput = document.getElementById("ticketimage");
      if (fileInput) {
        fileInput.value = "";
      }
      this.cdr.detectChanges();
    });
  }
  submitTicket() {
    debugger;
    if (!this.nCaseid || !this.cDesc || this.cDesc == "") {
      this.isSubmitted = true;
    } else {
      this.isSubmitted = false;
      this.ticketS.submitTicket(this.nCaseid, this.cSessionid, this.cDesc, this.cImage, this.cImagename).then((res) => {
        if (res) {
          this.success = true;
          setTimeout(() => {
            this.MatDialogRef.close();
          }, 3e3);
        }
      });
    }
  }
  static {
    this.\u0275fac = function AssistanceComponent_Factory(t) {
      return new (t || _AssistanceComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(TicketService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AssistanceComponent, selectors: [["app-assistance"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 7, vars: 2, consts: [[1, "p-10", "bg-blue-on", "text-white"], ["name", "close", 1, "absolute", "right-5", "top-5", "text-xs", 3, "click"], [1, "px-10", "py-5", "flex", "justify-end"], ["width", "80", "height", "80", "viewBox", "0 0 80 80", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "-mt-15", "mb-2.5"], [1, "text-5xl", "font-semibold"], [1, "text-lg", "mt-2"], [1, "text-lg", "mt-4", "mb-32"], [1, "text-lg", "mt-4"], [1, "bg-white", "w-full", "mt-5"], ["placeholder", "Select...", 3, "ngModelChange", "ngModel"], [3, "value"], ["placeholder", "Please describe the issue you are having for us.", 1, "block", "mt-3", 3, "valueChange", "value", "minrows"], [1, "text-xs", "my-5"], ["type", "file", "name", "profile", "id", "ticketimage", "accept", "image/png, image/jpg, image/jpeg,image/svg", 1, "!hidden", 3, "change"], [1, "flex", "gap-2.5", "items-center"], [1, "font-semibold", "text-base", "truncate"], ["name", "delete", 1, "ms-auto", 3, "click"], ["mode", "darkwhite", "addcls", "bg-white/10", 3, "click"], ["width", "18", "height", "14", "viewBox", "0 0 18 14", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["fill-rule", "evenodd", "clip-rule", "evenodd", "d", "M15.5 2H2.5C2.36739 2 2.24021 2.05268 2.14645 2.14645C2.05268 2.24021 2 2.36739 2 2.5V11.5C2 11.6326 2.05268 11.7598 2.14645 11.8536C2.24021 11.9473 2.36739 12 2.5 12H15.5C15.6326 12 15.7598 11.9473 15.8536 11.8536C15.9473 11.7598 16 11.6326 16 11.5V2.5C16 2.36739 15.9473 2.24021 15.8536 2.14645C15.7598 2.05268 15.6326 2 15.5 2ZM2.5 1C2.10218 1 1.72064 1.15804 1.43934 1.43934C1.15804 1.72064 1 2.10218 1 2.5L1 11.5C1 11.8978 1.15804 12.2794 1.43934 12.5607C1.72064 12.842 2.10218 13 2.5 13H15.5C15.8978 13 16.2794 12.842 16.5607 12.5607C16.842 12.2794 17 11.8978 17 11.5V2.5C17 2.10218 16.842 1.72064 16.5607 1.43934C16.2794 1.15804 15.8978 1 15.5 1H2.5Z", "fill", "currentColor", "stroke", "currentColor", "stroke-width", "0.4"], ["d", "M11.6478 6.64595C11.7221 6.57189 11.8178 6.52306 11.9213 6.50637C12.0249 6.48968 12.1311 6.50598 12.2248 6.55295L16.0018 8.49995V12H2.00183V11L4.64783 8.64595C4.72956 8.56452 4.83695 8.51385 4.95177 8.50255C5.06659 8.49125 5.18179 8.52001 5.27783 8.58395L7.93783 10.357L11.6478 6.64695V6.64595Z", "fill", "currentColor", "stroke", "currentColor", "stroke-width", "0.4"], ["fill-rule", "evenodd", "clip-rule", "evenodd", "d", "M5.50183 6C5.69881 6 5.89387 5.9612 6.07586 5.88582C6.25784 5.81044 6.4232 5.69995 6.56249 5.56066C6.70178 5.42137 6.81227 5.25601 6.88765 5.07403C6.96303 4.89204 7.00183 4.69698 7.00183 4.5C7.00183 4.30302 6.96303 4.10796 6.88765 3.92597C6.81227 3.74399 6.70178 3.57863 6.56249 3.43934C6.4232 3.30005 6.25784 3.18956 6.07586 3.11418C5.89387 3.0388 5.69881 3 5.50183 3C5.10401 3 4.72248 3.15804 4.44117 3.43934C4.15987 3.72064 4.00183 4.10218 4.00183 4.5C4.00183 4.89782 4.15987 5.27936 4.44117 5.56066C4.72248 5.84196 5.10401 6 5.50183 6Z", "fill", "currentColor", "stroke", "currentColor", "stroke-width", "0.4"], ["x", "4", "y", "4", "width", "72", "height", "72", "rx", "36", "fill", "white"], ["x", "4", "y", "4", "width", "72", "height", "72", "rx", "36", "stroke", "#0066FF", "stroke-width", "8"], ["d", "M34.1445 51.0784L23.5485 40.5419C23.4874 40.4811 23.4389 40.4089 23.4058 40.3293C23.3727 40.2498 23.3557 40.1644 23.3557 40.0782C23.3557 39.9921 23.3727 39.9067 23.4058 39.8272C23.4389 39.7476 23.4874 39.6753 23.5485 39.6146L26.2235 36.9366C26.4791 36.681 26.8923 36.681 27.1479 36.9366L34.1237 43.8708C34.3793 44.1264 34.7954 44.1234 35.051 43.8678L50.465 28.3053C50.7206 28.0467 51.1367 28.0467 51.3953 28.3023L54.0733 30.9803C54.3289 31.2359 54.3289 31.649 54.0762 31.9046L37.2832 48.8493L37.2861 48.8522L35.0718 51.0784C34.8162 51.3341 34.4001 51.3341 34.1445 51.0784Z", "fill", "#0066FF", "stroke", "#0066FF", "stroke-width", "1.78333", "stroke-miterlimit", "10"], [3, "click"]], template: function AssistanceComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "icon", 1);
        \u0275\u0275listener("click", function AssistanceComponent_Template_icon_click_1_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275template(2, AssistanceComponent_Conditional_2_Template, 6, 0)(3, AssistanceComponent_Conditional_3_Template, 16, 7);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "div", 2);
        \u0275\u0275template(5, AssistanceComponent_Conditional_5_Template, 4, 0, ":svg:svg", 3)(6, AssistanceComponent_Conditional_6_Template, 2, 0);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275conditional(2, ctx.success ? 2 : 3);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(5, ctx.success ? 5 : 6);
      }
    }, dependencies: [FormsModule, NgControlStatus, NgModel, MatSelectModule, MatFormField, MatSelect, MatOption, TextareaComponent, ButtonComponent, IconComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AssistanceComponent, { className: "AssistanceComponent", filePath: "src\\app\\shared\\components\\assistance\\assistance.component.ts", lineNumber: 18 });
})();

// src/app/shared/components/helpcenter/helpcenterview/helpcenterview.component.ts
var _c0 = ["parent"];
var _c1 = ["optionRef"];
var _c2 = (a0, a1) => ({ "rounded-2xl  bg-white text-grey": a0, "underline": a1 });
function HelpcenterviewComponent_For_11_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 45);
    \u0275\u0275listener("click", function HelpcenterviewComponent_For_11_Conditional_0_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const item_r3 = \u0275\u0275nextContext().$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.keyWordClick(item_r3));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", item_r3.cTitle, " ");
  }
}
function HelpcenterviewComponent_For_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, HelpcenterviewComponent_For_11_Conditional_0_Template, 2, 1, "button", 44);
  }
  if (rf & 2) {
    const $index_r5 = ctx.$index;
    \u0275\u0275conditional(0, $index_r5 < 3 ? 0 : -1);
  }
}
function HelpcenterviewComponent_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 14);
    \u0275\u0275text(1, "Ask me things like ");
    \u0275\u0275elementStart(2, "span", 46);
    \u0275\u0275text(3, " \u201C");
    \u0275\u0275elementStart(4, "span", 47);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275text(6, "\u201D ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", ctx_r3.typewriterText, " ");
  }
}
function HelpcenterviewComponent_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 48);
    \u0275\u0275listener("click", function HelpcenterviewComponent_Conditional_19_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.clearList());
    });
    \u0275\u0275elementEnd();
  }
}
function HelpcenterviewComponent_Conditional_20_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 52);
    \u0275\u0275listener("click", function HelpcenterviewComponent_Conditional_20_For_3_Template_div_click_0_listener() {
      const x_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.keyWordClick(x_r9));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r9 = ctx.$implicit;
    const $index_r10 = ctx.$index;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("bg-blue-deactivate", ctx_r3.selectedIndex === $index_r10);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r9.cTitle, " ");
  }
}
function HelpcenterviewComponent_Conditional_20_ForEmpty_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 53);
    \u0275\u0275text(1, "No results found");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 54);
    \u0275\u0275text(3, "We cannot find what you searched for. Please try different keywords or go to our ");
    \u0275\u0275elementStart(4, "a", 55);
    \u0275\u0275listener("click", function HelpcenterviewComponent_Conditional_20_ForEmpty_4_Template_a_click_4_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.gotofaq());
    });
    \u0275\u0275text(5, " FAQ section.");
    \u0275\u0275elementEnd()();
  }
}
function HelpcenterviewComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 49);
    \u0275\u0275element(1, "hr", 50);
    \u0275\u0275repeaterCreate(2, HelpcenterviewComponent_Conditional_20_For_3_Template, 2, 3, "div", 51, \u0275\u0275repeaterTrackByIndex, false, HelpcenterviewComponent_Conditional_20_ForEmpty_4_Template, 6, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r3.keyWords.length ? "" : "!bg-[#F6FBFF]");
    \u0275\u0275property("@fadeInOut", void 0);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r3.keyWords);
  }
}
function HelpcenterviewComponent_For_47_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article", 56);
    \u0275\u0275listener("click", function HelpcenterviewComponent_For_47_Template_article_click_0_listener() {
      const x_r12 = \u0275\u0275restoreView(_r11).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.selectmodule(x_r12));
    });
    \u0275\u0275elementStart(1, "div", 57);
    \u0275\u0275element(2, "img", 58);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "h3", 59);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r12 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275classMap((ctx_r3.activemodule == null ? null : ctx_r3.activemodule.id) == x_r12.nMainid ? "bg-[#0D3C8C]" : "");
    \u0275\u0275advance(2);
    \u0275\u0275propertyInterpolate("src", ctx_r3.helpcenterURL + x_r12.cImage, \u0275\u0275sanitizeUrl);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(x_r12.cTitle);
  }
}
function HelpcenterviewComponent_Conditional_48_For_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 66);
    \u0275\u0275listener("click", function HelpcenterviewComponent_Conditional_48_For_8_Template_div_click_0_listener() {
      const x_r15 = \u0275\u0275restoreView(_r14).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.keyWordClick(x_r15));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r15 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r15 == null ? null : x_r15.cTitle, " ");
  }
}
function HelpcenterviewComponent_Conditional_48_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 32);
    \u0275\u0275element(1, "hr", 60);
    \u0275\u0275elementStart(2, "div", 61)(3, "h6", 62);
    \u0275\u0275text(4, "Module User guides");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "icon", 63);
    \u0275\u0275listener("click", function HelpcenterviewComponent_Conditional_48_Template_icon_click_5_listener() {
      \u0275\u0275restoreView(_r13);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.activemodule = null);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 64);
    \u0275\u0275repeaterCreate(7, HelpcenterviewComponent_Conditional_48_For_8_Template, 2, 1, "div", 65, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
    \u0275\u0275element(9, "hr", 60);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance(7);
    \u0275\u0275repeater(ctx_r3.activemodule.submodules);
  }
}
function HelpcenterviewComponent_Conditional_64_For_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, "Q:");
  }
}
function HelpcenterviewComponent_Conditional_64_For_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 70);
  }
}
function HelpcenterviewComponent_Conditional_64_For_2_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 71);
    \u0275\u0275text(1, "A: ");
    \u0275\u0275element(2, "span", 72);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r17 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("innerHTML", x_r17.cAnswer, \u0275\u0275sanitizeHtml);
  }
}
function HelpcenterviewComponent_Conditional_64_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 68)(1, "h6", 69);
    \u0275\u0275listener("click", function HelpcenterviewComponent_Conditional_64_For_2_Template_h6_click_1_listener() {
      const x_r17 = \u0275\u0275restoreView(_r16).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.expand(x_r17));
    });
    \u0275\u0275template(2, HelpcenterviewComponent_Conditional_64_For_2_Conditional_2_Template, 1, 0);
    \u0275\u0275text(3);
    \u0275\u0275template(4, HelpcenterviewComponent_Conditional_64_For_2_Conditional_4_Template, 1, 0, "icon", 70);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, HelpcenterviewComponent_Conditional_64_For_2_Conditional_5_Template, 3, 1, "h6", 71);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r17 = ctx.$implicit;
    \u0275\u0275classMap(x_r17.isexpand ? "py-8 px-4 border-y border-y-white/10" : "");
    \u0275\u0275advance();
    \u0275\u0275classMap(x_r17.isexpand ? "text-blue-hover" : "");
    \u0275\u0275advance();
    \u0275\u0275conditional(2, x_r17.isexpand ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r17.cQuestion, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(4, x_r17.isexpand ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(5, x_r17.isexpand ? 5 : -1);
  }
}
function HelpcenterviewComponent_Conditional_64_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 43);
    \u0275\u0275repeaterCreate(1, HelpcenterviewComponent_Conditional_64_For_2_Template, 6, 8, "div", 67, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r3.faq);
  }
}
var HelpcenterviewComponent = class _HelpcenterviewComponent {
  handleKeyDown(event) {
    if (this.keyWords.length === 0)
      return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.selectedIndex = this.selectedIndex < this.keyWords.length - 1 ? this.selectedIndex + 1 : 0;
        this.scrollToOption();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : this.keyWords.length - 1;
        this.scrollToOption();
        break;
      case "Enter":
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.keyWordClick(this.keyWords[this.selectedIndex]);
        }
        break;
    }
  }
  scrollToOption() {
    requestAnimationFrame(() => {
      const element = this.optionRefs.get(this.selectedIndex)?.nativeElement;
      if (element) {
        element.scrollIntoView({ block: "nearest" });
      }
    });
  }
  constructor(ss, router, dialog, helpcenterService, cdr, cf) {
    this.ss = ss;
    this.router = router;
    this.dialog = dialog;
    this.helpcenterService = helpcenterService;
    this.cdr = cdr;
    this.cf = cf;
    this.selectedsubmodule = new EventEmitter();
    this.selectedIndex = -1;
    this.cQType = "S";
    this.searchterm = "";
    this.activemodule = null;
    this.showfaq = true;
    this.typewriterText = "";
    this.placeholders = [
      "Access and edit case files ?",
      "Comparing ?",
      "navigating?",
      "transcript"
    ];
    this.currentPlaceholderIndex = 0;
    this.commonTopics = [];
    this.moduleList = [];
    this.faq = [];
    this.keyWords = [];
    this.selectedKeywordId = 0;
    this.helpcenterURL = `${environment.documentStorage}${environment.helpcenterPath}help/`;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.apiCall();
      this.userdetail = yield this.ss.getUserInfo();
      this.startTypewriterEffect();
    });
  }
  apiCall() {
    this.getCommonTopics();
    this.getModuleList();
    this.getfaqlist();
  }
  startTypewriterEffect() {
    let currentText = "";
    const placeholder = this.placeholders[this.currentPlaceholderIndex];
    let charIndex = 0;
    const type = () => {
      if (charIndex < placeholder.length) {
        currentText += placeholder[charIndex];
        this.typewriterText = currentText;
        charIndex++;
        setTimeout(type, 100);
      } else {
        setTimeout(this.eraseText.bind(this), 2e3);
      }
    };
    const erase = () => {
      if (currentText.length > 0) {
        currentText = currentText.slice(0, -1);
        this.typewriterText = currentText;
        setTimeout(erase, 25);
      } else {
        this.currentPlaceholderIndex = (this.currentPlaceholderIndex + 1) % this.placeholders.length;
        setTimeout(this.startTypewriterEffect.bind(this), 50);
      }
    };
    this.eraseText = erase;
    type();
  }
  eraseText() {
  }
  goToAdmin() {
    this.router.navigate(["/admin/dashboard"]);
  }
  selectmodule(x) {
    return __async(this, null, function* () {
      if (!this.activemodule) {
        this.activemodule = {};
      }
      if (this.activemodule["id"] == x.nMainid) {
        return;
      }
      this.activemodule["id"] = x.nMainid;
      const res = yield this.helpcenterService.getSubModuleList(x.nMainid);
      this.activemodule["submodules"] = res;
    });
  }
  expand(elm) {
    const isCurrentlyExpanded = elm.isexpand;
    this.faq.forEach((x) => {
      x.isexpand = false;
    });
    if (!isCurrentlyExpanded) {
      elm.isexpand = true;
    }
  }
  assist() {
    const dialog = this.dialog.open(AssistanceComponent, {
      width: "500px",
      height: "fit-content"
    });
    dialog.afterClosed().subscribe((result) => {
    });
  }
  getCommonTopics() {
    return __async(this, null, function* () {
      this.commonTopics = yield this.helpcenterService.getCommonTopics();
      this.cdr.detectChanges();
    });
  }
  getModuleList(nKeyid) {
    return __async(this, null, function* () {
      this.moduleList = yield this.helpcenterService.getModuleList(nKeyid);
      this.activemodule = null;
      if (this.moduleList.length > 0 && nKeyid) {
        this.keyWords = [];
      }
      this.cdr.detectChanges();
    });
  }
  getfaqlist() {
    return __async(this, null, function* () {
      this.faq = yield this.helpcenterService.getfaqlist(this.cQType);
      this.cdr.detectChanges();
    });
  }
  insertFeedback(data) {
    return __async(this, null, function* () {
      yield this.helpcenterService.insertFeedback(data);
    });
  }
  getkeywords(key) {
    return __async(this, null, function* () {
      return yield this.helpcenterService.getkeywords(key);
    });
  }
  search(event) {
    return __async(this, null, function* () {
      if (event.length > 2) {
        this.keyWords = yield this.getkeywords(event);
        this.cdr.detectChanges();
      }
    });
  }
  clearList() {
    this.searchterm = "";
    this.keyWords = [];
  }
  keyWordClick(item) {
    this.openNewTab(item);
    try {
      this.helpcenterService.searchSMid(item.nSMid);
    } catch (error) {
    }
    this.cdr.detectChanges();
  }
  openNewTab(x) {
    const param1 = this.activemodule?.id;
    const param2 = x.nSMid;
    const url = this.router.serializeUrl(this.router.createUrlTree(["/helpcenterdetail", "help"], { queryParams: { id: param1, nSMid: param2 } }));
    window.open(url, "_blank");
  }
  gotofaq() {
    this.showfaq = true;
    const faq = document.getElementById("faq");
    if (faq) {
      let top = faq.offsetTop;
      this.parent.nativeElement.scrollTo({
        top,
        behavior: "smooth"
      });
    }
  }
  static {
    this.\u0275fac = function HelpcenterviewComponent_Factory(t) {
      return new (t || _HelpcenterviewComponent)(\u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(HelpcenterService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommonfunctionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HelpcenterviewComponent, selectors: [["helpcenterview"]], viewQuery: function HelpcenterviewComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
        \u0275\u0275viewQuery(_c1, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.parent = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.optionRefs = _t);
      }
    }, hostBindings: function HelpcenterviewComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("keydown", function HelpcenterviewComponent_keydown_HostBindingHandler($event) {
          return ctx.handleKeyDown($event);
        }, false, \u0275\u0275resolveWindow);
      }
    }, outputs: { selectedsubmodule: "selectedsubmodule" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 65, vars: 16, consts: [["parent", ""], [1, "flex", "relative", "z-10", "flex-col", "items-center", "pt-5", "mb-0", "w-full", "h-full", "overflow-auto"], [1, "flex", "flex-col", "items-center", "max-w-full", "w-[851px]"], [1, "flex", "flex-col", "items-center", "w-full"], [1, "text-[45px]", "font-bold", "tracking-tighter", "text-center", "text-splmntry", "max-md:text-4xl"], [1, "flex", "gap-6", "items-center", "mt-6", "max-w-full", "text-center", "w-[948px]"], [1, "self-stretch", "my-auto", "text-xs", "leading-none", "text-slate-50"], [1, "flex", "flex-1", "shrink", "gap-2.5", "items-center", "self-stretch", "my-auto", "text-xs", "leading-none", "text-splmntry", "basis-0", "min-w-[240px]"], [1, "flex", "flex-col", "justify-center", "p-1", "mt-6", "w-full", "text-sm", "leading-none", "bg-blue-600", "rounded-full", "max-w-[851px]", "text-neutral-600"], [1, "relative", "w-full"], [1, "flex", "px-5", "items-center", "justify-between", "w-full", "bg-white", "rounded-3xl", "z-20", "relative"], ["name", "search", 1, "text-lg", "text-blue-hover"], [1, "gap-2.5", "w-full", "relative", "flex", "items-center"], ["type", "text", "name", "search", "placeholder", "", 1, "border-0", "peer", "text-sm", "placeholder:text-grey", "shadow-none", "text-grey", "w-full", "focus:shadow-none", "relative", "z-30", "px-5", "rounded-base", "bg-transparent", 3, "ngModelChange", "ngModel", "value"], [1, "absolute", "peer-focus-within:opacity-50", "left-5"], ["name", "close", 1, "text-xs", "relative", "z-30"], [1, "bg-white", "px-2.5", "pt-4", "pb-2.5", "top-5", "rounded-b-3xl", "absolute", "w-full", "z-10", "max-h-[calc(100vh_-_280px)]", "overflow-y-auto", "shadow-[0px_0px_1px_4px_#2563eb]", 3, "class"], [1, "my-6"], [1, "flex", "gap-6", "items-center", "self-stretch", "my-auto", "text-xs", "leading-none", "text-splmntry", "basis-0", "min-w-[240px]"], [1, "flex", "cursor-pointer", "flex-col", "text-lg", "font-normal", "pointer-events-none", "opacity-35", "bg-white/10", "justify-center", "items-center", "border-splmntry/25", "border-solid", "border-[0.5px]", "min-h-28", "min-w-[345px]", "rounded-base"], ["width", "20", "height", "21", "viewBox", "0 0 20 21", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "mb-2.5"], ["d", "M14.2747 12.672C14.2747 13.512 14.5137 13.847 15.1387 13.847C16.5317 13.847 17.4187 12.072 17.4187 9.12001C17.4187 4.60801 14.1307 2.44801 10.0257 2.44801C5.8027 2.44801 1.9617 5.28001 1.9617 10.632C1.9617 15.744 5.3217 18.528 10.4817 18.528C12.2337 18.528 13.4097 18.336 15.2087 17.736L15.5947 19.343C13.8187 19.92 11.9207 20.087 10.4577 20.087C3.6897 20.087 0.0646973 16.367 0.0646973 10.631C0.0646973 4.84701 4.2657 0.911011 10.0497 0.911011C16.0737 0.911011 19.2647 4.51101 19.2647 8.92701C19.2647 12.671 18.0897 15.527 14.3937 15.527C12.7127 15.527 11.6097 14.855 11.4657 13.366C11.0337 15.022 9.8817 15.527 8.3207 15.527C6.2327 15.527 4.4807 13.918 4.4807 10.679C4.4807 7.41501 6.0177 5.39901 8.7777 5.39901C10.2417 5.39901 11.1537 5.97501 11.5597 6.88701L12.2567 5.61501H14.2727V12.672H14.2747ZM11.3237 9.50401C11.3237 8.18501 10.3387 7.63201 9.5227 7.63201C8.6347 7.63201 7.6517 8.35101 7.6517 10.464C7.6517 12.144 8.3957 13.08 9.5227 13.08C10.3147 13.08 11.3237 12.576 11.3237 11.184V9.50401Z", "fill", "#EEF6FF"], [1, "block", "text-xs", "font-light"], [1, "flex", "cursor-pointer", "shadow-md", "font-normal", "bg-[#949494]/25", "backdrop-blur-md", "flex-col", "text-lg", "justify-center", "items-center", "min-h-28", "min-w-[345px]", "rounded-base", 3, "click"], ["width", "20", "height", "17", "viewBox", "0 0 20 17", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "mb-2.5"], ["d", "M13 1.5V3.5M13 7.5V9.5M13 13.5V15.5M3 1.5H17C17.5304 1.5 18.0391 1.71071 18.4142 2.08579C18.7893 2.46086 19 2.96957 19 3.5V6.5C18.4696 6.5 17.9609 6.71071 17.5858 7.08579C17.2107 7.46086 17 7.96957 17 8.5C17 9.03043 17.2107 9.53914 17.5858 9.91421C17.9609 10.2893 18.4696 10.5 19 10.5V13.5C19 14.0304 18.7893 14.5391 18.4142 14.9142C18.0391 15.2893 17.5304 15.5 17 15.5H3C2.46957 15.5 1.96086 15.2893 1.58579 14.9142C1.21071 14.5391 1 14.0304 1 13.5V10.5C1.53043 10.5 2.03914 10.2893 2.41421 9.91421C2.78929 9.53914 3 9.03043 3 8.5C3 7.96957 2.78929 7.46086 2.41421 7.08579C2.03914 6.71071 1.53043 6.5 1 6.5V3.5C1 2.96957 1.21071 2.46086 1.58579 2.08579C1.96086 1.71071 2.46957 1.5 3 1.5Z", "stroke", "white", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round"], [1, "flex", "cursor-pointer", "flex-col", "font-normal", "text-lg", "justify-center", "items-center", "pointer-events-none", "opacity-35", "bg-white/10", "border-splmntry/25", "border-solid", "border-[0.5px]", "min-h-28", "min-w-[345px]", "rounded-base"], [1, "flex", "flex-col", "items-center", "px-10", "pt-6", "pb-11", "mt-6", "max-w-full", "rounded-xl", "bg-[#01276F]", "w-[1084px]", "max-md:px-5", "h-fit"], [1, "flex", "flex-col", "max-w-full", "w-[948px]"], [1, "text-xl", "font-semibold", "leading-none", "text-center", "text-slate-50", "max-md:max-w-full"], [1, "flex", "flex-wrap", "gap-6", "items-center", "mt-6", "w-full", "max-md:max-w-full"], ["matRipple", "", 1, "flex", "flex-col", "grow", "shrink", "self-stretch", "my-auto", "p-5", "cursor-pointer", "transition-all", "rounded-base", 3, "class"], [1, "w-full", "mt-6"], ["id", "faq", 1, "flex", "mt-6", "flex-wrap", "py-2", "gap-2.5", "items-center", "pr-2.5", "pl-5", "w-full", "rounded-xl", "max-md:max-w-full", "bg-[#0066FF]/20"], [1, "flex", "flex-wrap", "flex-1", "shrink", "gap-2.5", "items-center", "self-stretch", "my-auto", "basis-0", "min-w-[240px]", "max-md:max-w-full"], ["loading", "lazy", "src", "../../../../assets/icon/faq.svg", "alt", "", 1, "object-contain", "shrink-0", "self-stretch", "my-auto", "aspect-square", "w-[25px]"], [1, "self-stretch", "my-auto", "text-lg", "text-blue-hover"], [1, "self-stretch", "my-auto", "text-xs", "leading-none", "text-white"], [1, "flex", "me-2.5", "items-center", "gap-2.5", "text-xs", "text-white"], [1, "text-blue-hover", "px-2", "py-1", 3, "click", "ngClass"], [1, "w-px", "self-stretch", "h-auto", "bg-white/20", "m-1"], [1, "text-blue-hover", "cursor-pointer", "px-2", "py-1", 3, "click", "ngClass"], ["name", "chvy", 1, "text-white", "me-2.5", 3, "click"], [1, "flex", "flex-col", "w-full", "gap-6", "mt-6", "px-5"], [1, "flex-1", "shrink", "gap-2", "self-stretch", "px-5", "py-2", "my-auto", "border-blue-300", "border-solid", "border-[0.5px]", "min-h-[32px]", "min-w-[240px]", "max-w-[240px]", "truncate", "rounded-[30px]"], [1, "flex-1", "shrink", "gap-2", "self-stretch", "px-5", "py-2", "my-auto", "border-blue-300", "border-solid", "border-[0.5px]", "min-h-[32px]", "min-w-[240px]", "max-w-[240px]", "truncate", "rounded-[30px]", 3, "click"], [1, "font-semibold"], [1, "typewriter-input", "w-fit"], ["name", "close", 1, "text-xs", "relative", "z-30", 3, "click"], [1, "bg-white", "px-2.5", "pt-4", "pb-2.5", "top-5", "rounded-b-3xl", "absolute", "w-full", "z-10", "max-h-[calc(100vh_-_280px)]", "overflow-y-auto", "shadow-[0px_0px_1px_4px_#2563eb]"], [1, "sticky", "top-0"], [1, "flex", "flex-col", "gap-2.5", "p-3", "cursor-pointer", "hover:bg-blue-deactivate", "m-2", "rounded-base", 3, "bg-blue-deactivate"], [1, "flex", "flex-col", "gap-2.5", "p-3", "cursor-pointer", "hover:bg-blue-deactivate", "m-2", "rounded-base", 3, "click"], [1, "text-center", "text-lg", "text-blue-hover", "mt-2.5"], [1, "text-center", "text-xxs", "mb-2.5"], [1, "hover:text-blue-on", "underline", "cursor-pointer", 3, "click"], ["matRipple", "", 1, "flex", "flex-col", "grow", "shrink", "self-stretch", "my-auto", "p-5", "cursor-pointer", "transition-all", "rounded-base", 3, "click"], [1, "flex", "overflow-hidden", "flex-col", "w-full", "bg-white", "rounded-xl"], ["loading", "lazy", 1, "object-cover", "w-[260px]", "h-[195px]", 3, "src"], [1, "mt-[18px]", "text-lg", "text-center", "text-blue-300"], [1, "my-2.5", "opacity-10"], [1, "flex", "mt-6", "items-center", "text-white", "justify-between"], [1, "text-xl"], ["name", "close", 1, "text-xs", 3, "click"], [1, "p-6", "flex", "flex-col", "gap-2.5"], [1, "text-lg", "text-light-blue", "hover:underline", "hover:text-blue-on", "cursor-pointer"], [1, "text-lg", "text-light-blue", "hover:underline", "hover:text-blue-on", "cursor-pointer", 3, "click"], [1, "text-white", 3, "class"], [1, "text-white"], [1, "flex", "items-center", "text-lg", "cursor-pointer", 3, "click"], ["name", "chvy", 1, "block", "rotate-90", "text-white", "w-fit", "ms-auto", "text-xs"], [1, "mt-5", "text-lg", "flex", "gap-2.5"], [1, "[&>ul]:list-disc", "[&>ul]:pl-5", 3, "innerHTML"]], template: function HelpcenterviewComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "section", 1, 0)(2, "div", 2)(3, "div", 3)(4, "h1", 4);
        \u0275\u0275text(5, " How can we help? ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(6, "div", 5)(7, "h2", 6);
        \u0275\u0275text(8, " Common searched topics: ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "div", 7);
        \u0275\u0275repeaterCreate(10, HelpcenterviewComponent_For_11_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(12, "form", 8)(13, "div", 9)(14, "div", 10);
        \u0275\u0275element(15, "icon", 11);
        \u0275\u0275elementStart(16, "div", 12)(17, "input", 13);
        \u0275\u0275twoWayListener("ngModelChange", function HelpcenterviewComponent_Template_input_ngModelChange_17_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.searchterm, $event) || (ctx.searchterm = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("ngModelChange", function HelpcenterviewComponent_Template_input_ngModelChange_17_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.search($event));
        });
        \u0275\u0275elementEnd();
        \u0275\u0275template(18, HelpcenterviewComponent_Conditional_18_Template, 7, 1, "span", 14);
        \u0275\u0275elementEnd();
        \u0275\u0275template(19, HelpcenterviewComponent_Conditional_19_Template, 1, 0, "icon", 15);
        \u0275\u0275elementEnd();
        \u0275\u0275template(20, HelpcenterviewComponent_Conditional_20_Template, 5, 4, "div", 16);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(21, "div", 17)(22, "div", 18)(23, "div", 19);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(24, "svg", 20);
        \u0275\u0275element(25, "path", 21);
        \u0275\u0275elementEnd();
        \u0275\u0275text(26, " General Enquiry ");
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(27, "span", 22);
        \u0275\u0275text(28, "We love to hear from you");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(29, "div", 23);
        \u0275\u0275listener("click", function HelpcenterviewComponent_Template_div_click_29_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.assist());
        });
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(30, "svg", 24);
        \u0275\u0275element(31, "path", 25);
        \u0275\u0275elementEnd();
        \u0275\u0275text(32, " Submit a ticket ");
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(33, "span", 22);
        \u0275\u0275text(34, "Ticket submitted can be found in Dashboard");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(35, "div", 26);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(36, "svg", 24);
        \u0275\u0275element(37, "path", 25);
        \u0275\u0275elementEnd();
        \u0275\u0275text(38, " Sales & Subscription ");
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(39, "span", 22);
        \u0275\u0275text(40, "Enquire about your account with us");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(41, "section", 27)(42, "div", 28)(43, "h2", 29);
        \u0275\u0275text(44, " Explore the user guides on these main modules ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(45, "div", 30);
        \u0275\u0275repeaterCreate(46, HelpcenterviewComponent_For_47_Template, 5, 4, "article", 31, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(48, HelpcenterviewComponent_Conditional_48_Template, 10, 0, "div", 32);
        \u0275\u0275elementStart(49, "button", 33)(50, "div", 34);
        \u0275\u0275element(51, "img", 35);
        \u0275\u0275elementStart(52, "span", 36);
        \u0275\u0275text(53, "FAQ'S");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(54, "span", 37);
        \u0275\u0275text(55, " Most common questions on eTabella ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(56, "div", 38);
        \u0275\u0275text(57, "user type: ");
        \u0275\u0275elementStart(58, "div", 39);
        \u0275\u0275listener("click", function HelpcenterviewComponent_Template_div_click_58_listener() {
          \u0275\u0275restoreView(_r1);
          ctx.cQType = "A";
          return \u0275\u0275resetView(ctx.getfaqlist());
        });
        \u0275\u0275text(59, " Admin");
        \u0275\u0275elementEnd();
        \u0275\u0275element(60, "div", 40);
        \u0275\u0275elementStart(61, "div", 41);
        \u0275\u0275listener("click", function HelpcenterviewComponent_Template_div_click_61_listener() {
          \u0275\u0275restoreView(_r1);
          ctx.cQType = "S";
          return \u0275\u0275resetView(ctx.getfaqlist());
        });
        \u0275\u0275text(62, "Standard ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(63, "icon", 42);
        \u0275\u0275listener("click", function HelpcenterviewComponent_Template_icon_click_63_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.showfaq = !ctx.showfaq);
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275template(64, HelpcenterviewComponent_Conditional_64_Template, 3, 0, "div", 43);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(10);
        \u0275\u0275repeater(ctx.commonTopics);
        \u0275\u0275advance(7);
        \u0275\u0275twoWayProperty("ngModel", ctx.searchterm);
        \u0275\u0275advance();
        \u0275\u0275conditional(18, !ctx.searchterm ? 18 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(19, ctx.searchterm.length ? 19 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(20, ctx.searchterm.length > 2 ? 20 : -1);
        \u0275\u0275advance(26);
        \u0275\u0275repeater(ctx.moduleList);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(48, ctx.activemodule ? 48 : -1);
        \u0275\u0275advance(10);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(10, _c2, ctx.cQType == "A", ctx.cQType != "A"));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(13, _c2, ctx.cQType == "S", ctx.cQType != "S"));
        \u0275\u0275advance(2);
        \u0275\u0275classMap(ctx.showfaq ? "-rotate-90" : "rotate-180");
        \u0275\u0275advance();
        \u0275\u0275conditional(64, ctx.showfaq ? 64 : -1);
      }
    }, dependencies: [IconComponent, MatRippleModule, MatRipple, NgClass, FormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, NgModel, NgForm], data: { animation: [
      trigger("fadeInOut", [
        transition(":enter", [
          style({ opacity: 0, transform: "translateY(-10px)" }),
          animate("300ms ease-out", style({ opacity: 1, transform: "translateY(0)" }))
        ]),
        transition(":leave", [
          animate("300ms ease-in", style({ opacity: 0, transform: "translateY(-10px)" }))
        ])
      ])
    ] } });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HelpcenterviewComponent, { className: "HelpcenterviewComponent", filePath: "src\\app\\shared\\components\\helpcenter\\helpcenterview\\helpcenterview.component.ts", lineNumber: 44 });
})();

// src/app/shared/components/helpcenter/helpcenter.component.ts
var _c02 = (a0, a1) => ({ "text-blue-deactivate/70 hover:text-white  cursor-pointer": a0, "text-white underline": a1 });
function HelpcenterComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " / ");
    \u0275\u0275elementStart(1, "span", 9);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r0.selectedsubmodule.cTitle, " ");
  }
}
var HelpcenterComponent = class _HelpcenterComponent {
  constructor(cf, ss, route, helpcenterService) {
    this.cf = cf;
    this.ss = ss;
    this.route = route;
    this.helpcenterService = helpcenterService;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userdetail = yield this.ss.getUserInfo();
    });
  }
  goToHome() {
    this.cf.goto("user/dashboard");
  }
  selectedsubmoduleEvent(item) {
    this.selectedsubmodule = item;
  }
  static {
    this.\u0275fac = function HelpcenterComponent_Factory(t) {
      return new (t || _HelpcenterComponent)(\u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(HelpcenterService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HelpcenterComponent, selectors: [["app-helpcenter"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 17, vars: 10, consts: [[1, "flex", "flex-col", "main-bg", "overflow-hidden", "h-screen"], ["loading", "lazy", "src", "assets/login/background.webp", 1, "object-cover", "absolute", "inset-0", "size-full", "mix-blend-multiply"], ["loading", "lazy", "src", "assets/img/asset.png", 1, "object-cover", "absolute", "w-[500px]", "-left-1/4", "rotate-45"], ["loading", "lazy", "src", "assets/img/asset.png", 1, "object-cover", "absolute", "w-[500px]", "-right-[20%]", "-rotate-45"], [1, "px-8", "min-h-15", "flex", "bg-dark-blue", "relative", "z-20"], [1, "flex", "items-center", "gap-6", "text-blue-deactivate/70"], ["width", "30px", "src", "assets/colorlogo.svg", 1, "cursor-pointer", 3, "click"], [1, "text-sm", "text-blue-deactivate/70", "cursor-pointer", 3, "click"], [1, "text-sm", "font-semibold", 3, "click", "ngClass"], [1, "text-sm", "font-semibold", "text-white", "underline"], [1, "flex", "items-center", "gap-2", "ms-auto"], ["size", "lg", 3, "userguidebtn", "icon", "detail", "iconwhite"], [1, "block", "h-[calc(100vh_-_50px)]", 3, "selectedsubmodule"]], template: function HelpcenterComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0);
        \u0275\u0275element(1, "img", 1)(2, "img", 2)(3, "img", 3);
        \u0275\u0275elementStart(4, "header", 4)(5, "div", 5)(6, "img", 6);
        \u0275\u0275listener("click", function HelpcenterComponent_Template_img_click_6_listener() {
          return ctx.goToHome();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "div")(8, "span", 7);
        \u0275\u0275listener("click", function HelpcenterComponent_Template_span_click_8_listener() {
          return ctx.goToHome();
        });
        \u0275\u0275text(9, "Dashboard ");
        \u0275\u0275elementEnd();
        \u0275\u0275text(10, "/ ");
        \u0275\u0275elementStart(11, "span", 8);
        \u0275\u0275listener("click", function HelpcenterComponent_Template_span_click_11_listener() {
          return ctx.selectedsubmodule = null;
        });
        \u0275\u0275text(12, " Help Center ");
        \u0275\u0275elementEnd();
        \u0275\u0275template(13, HelpcenterComponent_Conditional_13_Template, 3, 1, "span", 9);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(14, "div", 10);
        \u0275\u0275element(15, "profile", 11);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(16, "helpcenterview", 12);
        \u0275\u0275listener("selectedsubmodule", function HelpcenterComponent_Template_helpcenterview_selectedsubmodule_16_listener($event) {
          return ctx.selectedsubmoduleEvent($event);
        });
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(11);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(7, _c02, ctx.selectedsubmodule, !ctx.selectedsubmodule));
        \u0275\u0275advance(2);
        \u0275\u0275conditional(13, ctx.selectedsubmodule ? 13 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275property("userguidebtn", false)("icon", false)("detail", ctx.userdetail)("icon", true)("iconwhite", true);
      }
    }, dependencies: [HelpcenterviewComponent, ProfileComponent, NgClass], styles: ['\n\n.main-bg[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      1deg,\n      #002a7b,\n      #0075ff);\n}\n.typewriter-input[_ngcontent-%COMP%] {\n  font-family:\n    "Courier New",\n    Courier,\n    monospace;\n  animation: _ngcontent-%COMP%_caret-blink 1s steps(2) infinite;\n}\n@keyframes _ngcontent-%COMP%_caret-blink {\n  0%, 100% {\n    border-right: 2px solid transparent;\n  }\n  50% {\n    border-right: 2px solid #000;\n  }\n}\nspan[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%] {\n  padding-left: 10px !important;\n}\nspan[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  list-style-type: disc !important;\n}\n/*# sourceMappingURL=helpcenter.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HelpcenterComponent, { className: "HelpcenterComponent", filePath: "src\\app\\shared\\components\\helpcenter\\helpcenter.component.ts", lineNumber: 20 });
})();
export {
  HelpcenterComponent
};
//# sourceMappingURL=chunk-2VXCRHRR.js.map
