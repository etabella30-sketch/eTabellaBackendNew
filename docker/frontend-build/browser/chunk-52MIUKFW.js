import {
  HelpcenterService
} from "./chunk-A6WEQJAW.js";
import {
  EmptyComponent
} from "./chunk-DHVW7RW5.js";
import {
  InputComponent
} from "./chunk-FEMUAMTL.js";
import {
  MatDialog,
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-EVEACXQX.js";
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
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefer,
  ɵɵdeferWhen,
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
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/components/helpcenter/modulecreation/modulecreation.component.ts
function ModulecreationComponent_span_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275listener("click", function ModulecreationComponent_span_4_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.getFile());
    });
    \u0275\u0275elementStart(1, "div", 13)(2, "h6", 14);
    \u0275\u0275text(3, "Browse image");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 15);
    \u0275\u0275text(5, "Upload a module image to help users identify the module");
    \u0275\u0275elementEnd()()();
  }
}
function ModulecreationComponent_img_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 16);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("src", ctx_r1.helpcenterURL + ctx_r1.cImage, \u0275\u0275sanitizeUrl);
  }
}
function ModulecreationComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "btn", 6)(1, "span");
    \u0275\u0275text(2, "Edit");
    \u0275\u0275elementEnd()();
  }
}
var ModulecreationComponent = class _ModulecreationComponent {
  constructor(dialogRef, helpS, toast, cdr) {
    this.dialogRef = dialogRef;
    this.helpS = helpS;
    this.toast = toast;
    this.cdr = cdr;
    this.cTitle = "";
    this.cImage = "";
    this.permission = "N";
    this.helpcenterURL = `${environment.documentStorage}${environment.helpcenterPath}help/`;
  }
  ngOnInit() {
  }
  onSubmit() {
    return __async(this, null, function* () {
      const data = {
        cTitle: this.cTitle,
        cPermission: "I",
        cImage: this.cImage,
        nMainid: null
      };
      const res = yield this.helpS.module_iu(data);
      if (res.msg == 1) {
        this.dialogRef.close(true);
      } else {
        this.toast.error(res.value);
      }
    });
  }
  close() {
    this.dialogRef.close();
  }
  getFile() {
    const fileInput = document.querySelector("#moduleimage");
    fileInput.click();
  }
  onFileChange(e) {
    return __async(this, null, function* () {
      if (!e.target.files[0])
        return;
      const formData = new FormData();
      formData.append("rootPath", "help");
      formData.append("file", e.target.files[0]);
      const res = yield this.helpS.moduleimageUpload(formData);
      console.log("onFileChange", res);
      if (res?.msg == 1) {
        this.cImage = res.value;
      }
      this.cdr.detectChanges();
    });
  }
  static {
    this.\u0275fac = function ModulecreationComponent_Factory(t) {
      return new (t || _ModulecreationComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(HelpcenterService), \u0275\u0275directiveInject(TostbarService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ModulecreationComponent, selectors: [["app-modulecreation"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 15, vars: 9, consts: [[1, "p-10"], [1, "text-lg", "font-semibold", "mb-2"], [1, "mb-6", "flex", "items-center", "gap-6"], ["class", "flex items-center cursor-pointer justify-center rounded-base text-center  leading-4 text-xs font-medium h-52 w-full bg-blue-50 border border-dashed border-blue-hover text-blue-on", 3, "click", 4, "ngIf"], ["class", "flex items-center justify-center rounded-base text-center leading-4 text-xs font-medium h-52 w-full bg-gray-300", 3, "src", 4, "ngIf"], ["type", "file", "name", "profile", "id", "moduleimage", "accept", "image/png, image/jpg, image/jpeg,image/svg", 1, "!hidden", 3, "change"], ["mode", "outlined"], [1, "flex", "items-end", "gap-2", "mb-6"], ["placeholder", "Enter Module Name", 1, "block", "w-full", 3, "valueChange", "isrequired", "showlabel", "value"], [1, "flex", "gap-2", "justify-end"], [3, "click"], [3, "click", "mode"], [1, "flex", "items-center", "cursor-pointer", "justify-center", "rounded-base", "text-center", "leading-4", "text-xs", "font-medium", "h-52", "w-full", "bg-blue-50", "border", "border-dashed", "border-blue-hover", "text-blue-on", 3, "click"], [1, "text-center"], [1, "text-sm", "font-semibold", "underline"], [1, "text-xs", "text-blue-hover", "mt-0.5"], [1, "flex", "items-center", "justify-center", "rounded-base", "text-center", "leading-4", "text-xs", "font-medium", "h-52", "w-full", "bg-gray-300", 3, "src"]], template: function ModulecreationComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
        \u0275\u0275text(2, "Module Name");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(3, "div", 2);
        \u0275\u0275template(4, ModulecreationComponent_span_4_Template, 6, 0, "span", 3)(5, ModulecreationComponent_img_5_Template, 1, 1, "img", 4);
        \u0275\u0275elementStart(6, "input", 5);
        \u0275\u0275listener("change", function ModulecreationComponent_Template_input_change_6_listener($event) {
          return ctx.onFileChange($event);
        });
        \u0275\u0275elementEnd();
        \u0275\u0275template(7, ModulecreationComponent_Conditional_7_Template, 3, 0, "btn", 6);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(8, "div", 7)(9, "inpt", 8);
        \u0275\u0275listener("valueChange", function ModulecreationComponent_Template_inpt_valueChange_9_listener($event) {
          return ctx.cTitle = $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "div", 9)(11, "btn", 10);
        \u0275\u0275listener("click", function ModulecreationComponent_Template_btn_click_11_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275text(12);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "btn", 11);
        \u0275\u0275listener("click", function ModulecreationComponent_Template_btn_click_13_listener() {
          return ctx.close();
        });
        \u0275\u0275text(14, "Cancel");
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275property("ngIf", !ctx.cImage || ctx.cImage == "");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.cImage && ctx.cImage != "");
        \u0275\u0275advance(2);
        \u0275\u0275conditional(7, ctx.cImage && ctx.cImage != "" ? 7 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275property("isrequired", true)("showlabel", false)("value", ctx.cTitle);
        \u0275\u0275advance(2);
        \u0275\u0275attribute("isdisabled", !ctx.cTitle || (ctx.cTitle == null ? null : ctx.cTitle.trim()) == "");
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" ", ctx.permission == "N" ? "Create" : "Update", "");
        \u0275\u0275advance();
        \u0275\u0275property("mode", "white");
      }
    }, dependencies: [InputComponent, ButtonComponent, CommonModule, NgIf] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ModulecreationComponent, { className: "ModulecreationComponent", filePath: "src\\app\\adminpanel\\components\\helpcenter\\modulecreation\\modulecreation.component.ts", lineNumber: 16 });
})();

// src/app/adminpanel/components/helpcenter/moduleslist/moduleslist.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var _c0 = (a0) => ({ "bg-white flex flex-col  rounded-t-base items-center": a0 });
var _c1 = (a0) => ({ "!text-blue-on": a0 });
var _c2 = (a0) => ({ "!text-blue-on !bg-blue-deactivate": a0 });
function ModuleslistComponent_For_9_Conditional_12_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 18);
    \u0275\u0275listener("click", function ModuleslistComponent_For_9_Conditional_12_For_1_Template_div_click_0_listener() {
      const submodule_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const module_r3 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.selectmodule(submodule_r7, module_r3));
    });
    \u0275\u0275elementStart(1, "div", 19)(2, "div", 20);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 21);
    \u0275\u0275element(4, "path", 13)(5, "path", 22);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(6, "span", 15);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const submodule_r7 = ctx.$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(2, _c2, submodule_r7.isselected));
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate1(" ", submodule_r7.cTitle, " ");
  }
}
function ModuleslistComponent_For_9_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, ModuleslistComponent_For_9_Conditional_12_For_1_Template, 8, 4, "div", 17, _forTrack0);
  }
  if (rf & 2) {
    const module_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275repeater(module_r3.submodules);
  }
}
function ModuleslistComponent_For_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 6)(1, "div", 7);
    \u0275\u0275listener("click", function ModuleslistComponent_For_9_Template_div_click_1_listener() {
      const ctx_r1 = \u0275\u0275restoreView(_r1);
      const module_r3 = ctx_r1.$implicit;
      const $index_r4 = ctx_r1.$index;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.toggleModule(module_r3, $index_r4));
    });
    \u0275\u0275elementStart(2, "div", 8);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(3, "svg", 9);
    \u0275\u0275element(4, "path", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "div", 11);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(6, "svg", 12);
    \u0275\u0275element(7, "path", 13)(8, "path", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(9, "span", 15);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "icon", 16);
    \u0275\u0275listener("click", function ModuleslistComponent_For_9_Template_icon_click_11_listener() {
      const module_r3 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.addsubmodule(module_r3));
    });
    \u0275\u0275elementEnd()()()();
    \u0275\u0275template(12, ModuleslistComponent_For_9_Conditional_12_Template, 2, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const module_r3 = ctx.$implicit;
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(11, _c0, module_r3.isExpanded));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(13, _c1, module_r3.isExpanded));
    \u0275\u0275advance(2);
    \u0275\u0275classProp("rotate-90", module_r3.isExpanded);
    \u0275\u0275advance(3);
    \u0275\u0275classProp("close", module_r3.isExpanded);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(15, _c1, module_r3.isExpanded));
    \u0275\u0275advance(2);
    \u0275\u0275classProp("close", !module_r3.isExpanded);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", module_r3.cTitle, " ");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(12, module_r3.isExpanded ? 12 : -1);
  }
}
var ModuleslistComponent = class _ModuleslistComponent {
  constructor(helpcenterService, matdialog) {
    this.helpcenterService = helpcenterService;
    this.matdialog = matdialog;
    this.modules = [];
    this.selectedmodule = new EventEmitter();
  }
  toggleModule(module, index) {
    module.isExpanded = !module.isExpanded;
  }
  ngOnInit() {
    this.getmodules();
  }
  getmodules() {
    debugger;
    this.helpcenterService.getModuleList().then((res) => {
      this.modules = res;
      this.modules.forEach((module, index) => {
        this.getsubmodules(module.nMainid, index);
      });
    });
  }
  getsubmodules(nMainid, index) {
    this.helpcenterService.getSubModuleList(nMainid).then((res) => {
      debugger;
      console.log(res);
      this.modules[index].submodules = res;
    });
  }
  selectmodule(submodule, module) {
    debugger;
    this.selectedmodule.emit({ type: "SelectedModule", data: { nSMid: submodule.nSMid, nMainid: module.nMainid } });
    this.modules.forEach((module2) => {
      module2.submodules.forEach((submodule2) => {
        submodule2.isselected = false;
      });
    });
    submodule.isselected = true;
  }
  addsubmodule(module) {
    debugger;
    this.selectedmodule.emit({ type: "AddForm", data: module.nMainid });
  }
  //openmatdialog
  createModule() {
    const dialogRef = this.matdialog.open(ModulecreationComponent, {
      width: "500px",
      height: "fit-content"
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getmodules();
      }
    });
  }
  deselectmodule() {
    this.modules.forEach((module) => {
      module.submodules.forEach((submodule) => {
        submodule.isselected = false;
      });
    });
    this.getmodules();
  }
  static {
    this.\u0275fac = function ModuleslistComponent_Factory(t) {
      return new (t || _ModuleslistComponent)(\u0275\u0275directiveInject(HelpcenterService), \u0275\u0275directiveInject(MatDialog));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ModuleslistComponent, selectors: [["moduleslist"]], outputs: { selectedmodule: "selectedmodule" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 10, vars: 0, consts: [[1, "flex", "flex-col", "h-full", "overflow-hidden"], [1, "flex", "items-center", "justify-between", "gap-2.5", "mb-3"], [1, "text-xl", "font-bold"], ["mode", "outlined", 3, "click"], ["name", "add", 1, "text-xs", "inline-flex"], [1, "w-full", "h-full", "overflow-auto"], [1, "mb-2.5", 3, "ngClass"], [1, "relative", "group", "bg-white", "rounded-base", "px-5", "z-20", "flex", "items-center", "w-full", "gap-5", "min-h-10", "cursor-pointer", 3, "click", "ngClass"], [1, "flex", "items-center", "gap-5", "w-full", "h-full"], ["xmlns", "http://www.w3.org/2000/svg", "width", "6", "height", "10", "fill", "none", "viewBox", "0 0 6 10", 2, "min-width", "6px", "transition", "transform 0.2s"], ["fill", "currentColor", "stroke", "currentColor", "d", "M.57.84.55.83a.2.2 0 0 1 0-.28.18.18 0 0 1 .25 0l3.83 3.91a.2.2 0 0 1 0 .28L.81 8.64a.18.18 0 0 1-.25 0 .2.2 0 0 1 0-.27v-.01l3.15-3.42.31-.34-.31-.34L.57.84Z"], [1, "flex", "items-center", "gap-2", "h-full", "w-full"], ["xmlns", "http://www.w3.org/2000/svg", "width", "18", "height", "14", "fill", "none", "viewBox", "0 0 18 14", 1, "text-grey", 2, "min-width", "18px", 3, "ngClass"], ["fill", "currentColor", "fill-rule", "evenodd", "d", "M6.41 1.878h7.268c.836 0 1.516.68 1.516 1.516.008 3.554-.003 5.546.005 9.1l-.38 1.04a.45.45 0 0 1-.05.101c-.261.38-.57.365-1.091.365H1.548C.71 14 .03 13.32.03 12.485V1.878C.03 1.043.71.363 1.547.363H4.58a.756.756 0 0 1 .536.222L6.41 1.878ZM1.736 12.312V3.69h11.61v8.622H1.736Z", "clip-rule", "evenodd"], ["fill", "currentColor", "d", "M3.619 6.558A.91.91 0 0 1 4.459 6h12.163a.91.91 0 0 1 .838 1.267l-2.555 6.017H2.167a.91.91 0 0 1-.84-1.263l2.292-5.463Z", 1, "foldersvg"], [1, "block", "text-xs", "font-semibold", "truncate", "mat-mdc-tooltip-trigger", "whitespace-nowrap", "foldername", "ng-star-inserted"], ["name", "addfolder", "matTooltip", "Add folder", "type", "adminicn", 1, "hidden", "group-hover:block", "cursor-pointer", "text-blue-on", "ms-auto", 3, "click"], [1, "relative", "bg-white", "px-5", "z-20", "flex", "items-center", "w-full", "hover:bg-blue-deactivate", "gap-5", "min-h-10", "mb-2.5", "last:mb-0", "cursor-pointer", 3, "ngClass"], [1, "relative", "bg-white", "px-5", "z-20", "flex", "items-center", "w-full", "hover:bg-blue-deactivate", "gap-5", "min-h-10", "mb-2.5", "last:mb-0", "cursor-pointer", 3, "click", "ngClass"], [1, "flex", "items-center", "gap-5", "w-[calc(100%_-_30px)]", "h-full", "ps-12"], [1, "flex", "items-center", "gap-2", "h-full", "w-[calc(100%_-_30px)]"], ["xmlns", "http://www.w3.org/2000/svg", "width", "18", "height", "14", "fill", "none", "viewBox", "0 0 18 14", 2, "min-width", "18px"], ["fill", "currentColor", "d", "M3.619 6.558A.91.91 0 0 1 4.459 6h12.163a.91.91 0 0 1 .838 1.267l-2.555 6.017H2.167a.91.91 0 0 1-.84-1.263l2.292-5.463Z", 1, "foldersvg", "close"]], template: function ModuleslistComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h6", 2);
        \u0275\u0275text(3, "Modules");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "btn", 3);
        \u0275\u0275listener("click", function ModuleslistComponent_Template_btn_click_4_listener() {
          return ctx.createModule();
        });
        \u0275\u0275element(5, "icon", 4);
        \u0275\u0275text(6, " Add Module ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "div", 5);
        \u0275\u0275repeaterCreate(8, ModuleslistComponent_For_9_Template, 13, 17, "div", 6, _forTrack0);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(8);
        \u0275\u0275repeater(ctx.modules);
      }
    }, dependencies: [IconComponent, ButtonComponent, NgClass], styles: ['\n\n.foldersvg.close[_ngcontent-%COMP%] {\n  d: path("M.875 3.812a.91.91 0 0 1 .91-.911H13.93a.91.91 0 0 1 .91.91v8.38a.91.91 0 0 1-.91.91H1.786a.91.91 0 0 1-.911-.91v-8.38Z");\n}\n/*# sourceMappingURL=moduleslist.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ModuleslistComponent, { className: "ModuleslistComponent", filePath: "src\\app\\adminpanel\\components\\helpcenter\\moduleslist\\moduleslist.component.ts", lineNumber: 15 });
})();

// src/app/adminpanel/components/helpcenter/helpcenteradmin/helpcenteradmin.component.ts
var _c02 = ["moduleslist"];
var HelpcenteradminComponent_Conditional_10_Defer_2_DepsFn = () => [import("./chunk-23J6NJWF.js").then((m) => m.ModuleformComponent)];
function HelpcenteradminComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "empty", 8);
  }
}
function HelpcenteradminComponent_Conditional_10_Defer_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "moduleform", 10);
    \u0275\u0275listener("moduleupdated", function HelpcenteradminComponent_Conditional_10_Defer_1_Template_moduleform_moduleupdated_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.moduleupdated($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("selectedmodule", ctx_r2.selectedmodule)("curruntmodule", ctx_r2.curruntmodule);
  }
}
function HelpcenteradminComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275template(1, HelpcenteradminComponent_Conditional_10_Defer_1_Template, 1, 2);
    \u0275\u0275defer(2, 1, HelpcenteradminComponent_Conditional_10_Defer_2_DepsFn);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275deferWhen(ctx_r2.selectedmodule || ctx_r2.addform);
  }
}
var HelpcenteradminComponent = class _HelpcenteradminComponent {
  constructor(helpcenterService) {
    this.helpcenterService = helpcenterService;
    this.addform = false;
  }
  selectedmoduleEvent(event) {
    debugger;
    if (event.type == "SelectedModule") {
      this.selectedmodule = event.data.nSMid;
      this.curruntmodule = event.data.nMainid;
    }
    if (event.type == "AddForm") {
      debugger;
      this.selectedmodule = null;
      this.addform = true;
      this.curruntmodule = event.data;
    }
  }
  moduleupdated(event) {
    if (this.moduleslist) {
      this.moduleslist.deselectmodule();
    }
    debugger;
    this.selectedmodule = null;
    this.addform = false;
    this.curruntmodule = null;
  }
  static {
    this.\u0275fac = function HelpcenteradminComponent_Factory(t) {
      return new (t || _HelpcenteradminComponent)(\u0275\u0275directiveInject(HelpcenterService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HelpcenteradminComponent, selectors: [["app-helpcenteradmin"]], viewQuery: function HelpcenteradminComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c02, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.moduleslist = _t.first);
      }
    }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 11, vars: 1, consts: [["moduleslist", ""], [1, "h-[100px]", "px-10", "flex", "items-center", "bg-dark-blue"], [1, "text-lg", "font-bold", "flex", "items-center", "h-full", "text-white"], ["name", "chvy", 1, "text-sm", "me-3"], [1, "h-[calc(100%_-_100px)]", "bg-[#f5f5f5]", "!px-10", "pt-10", "flex", "overflow-auto", "gap-2.5"], [1, "min-w-[400px]", "h-full"], [3, "selectedmodule"], [1, "h-full", "w-full"], ["head", "No Modules Selected", "desc", "Select Modules from the Modules List", 1, "h-full"], [1, "bg-white", "flex", "flex-col", "items-center"], [3, "moduleupdated", "selectedmodule", "curruntmodule"]], template: function HelpcenteradminComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1)(1, "h6", 2);
        \u0275\u0275element(2, "icon", 3);
        \u0275\u0275text(3, " Help Center Admin ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "div", 4)(5, "div", 5)(6, "moduleslist", 6, 0);
        \u0275\u0275listener("selectedmodule", function HelpcenteradminComponent_Template_moduleslist_selectedmodule_6_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.selectedmoduleEvent($event));
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(8, "div", 7);
        \u0275\u0275template(9, HelpcenteradminComponent_Conditional_9_Template, 1, 0, "empty", 8)(10, HelpcenteradminComponent_Conditional_10_Template, 4, 1);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(9);
        \u0275\u0275conditional(9, !ctx.selectedmodule && !ctx.addform ? 9 : 10);
      }
    }, dependencies: [ModuleslistComponent, IconComponent, EmptyComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HelpcenteradminComponent, { className: "HelpcenteradminComponent", filePath: "src\\app\\adminpanel\\components\\helpcenter\\helpcenteradmin\\helpcenteradmin.component.ts", lineNumber: 14 });
})();
export {
  HelpcenteradminComponent
};
//# sourceMappingURL=chunk-52MIUKFW.js.map
