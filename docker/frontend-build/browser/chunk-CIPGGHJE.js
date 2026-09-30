import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  ActivatedRoute
} from "./chunk-FNSUDMGC.js";
import {
  HttpClient
} from "./chunk-EVEACXQX.js";
import {
  DatePipe,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  firstValueFrom,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/realtimeactivity/realtimeactivity.service.ts
var RealtimeactivityService = class _RealtimeactivityService {
  constructor(sStore, http, toast) {
    this.sStore = sStore;
    this.http = http;
    this.toast = toast;
  }
  getsessionsbycaseid(nCaseid) {
    return __async(this, null, function* () {
      try {
        let id = yield this.sStore.getUserId();
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.realtimeserive}/session/getsessionsbycaseid`, { params: { nCaseid, nUserid: 0 } }));
        return res;
      } catch (err) {
        return null;
      }
    });
  }
  upload(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.realtimeserive}/upload`, mdl));
        if (res.msg == -1) {
          this.toast.error(res.value || "Upload Failed");
          return { msg: -1, error: "Upload Failed", value: "" };
        }
        this.toast.openSnackBar("Upload successful");
        return res;
      } catch (err) {
        this.toast.error(err.message || "Upload Failed");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  transsciptUpdate(mdl) {
    return __async(this, null, function* () {
      let id = yield this.sStore.getUserId();
      mdl.nUserid = id;
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.realtimeserive}/session/updatetranscriptstatus`, mdl));
        if (res.msg == 1) {
          return res;
        } else {
          this.toast.error(res.value || "Publish Failed");
          return { msg: -1, error: "Publish Failed", value: "" };
        }
      } catch (err) {
        this.toast.error(err.message || "Publish Failed");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  static {
    this.\u0275fac = function RealtimeactivityService_Factory(t) {
      return new (t || _RealtimeactivityService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RealtimeactivityService, factory: _RealtimeactivityService.\u0275fac, providedIn: "root" });
  }
};

// src/app/adminpanel/components/activity-log/realtimeactivity/realtimeactivity.component.ts
var _c0 = (a0) => ({ "opacity-30 pointer-events-none": a0 });
function RealtimeactivityComponent_For_19_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Uploading...");
    \u0275\u0275elementEnd();
  }
}
function RealtimeactivityComponent_For_19_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Not yet published ");
  }
}
function RealtimeactivityComponent_For_19_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Published ");
  }
}
function RealtimeactivityComponent_For_19_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, "Not yet published");
  }
}
function RealtimeactivityComponent_For_19_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, "Not uploaded");
  }
}
function RealtimeactivityComponent_For_19_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 16);
  }
}
function RealtimeactivityComponent_For_19_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275element(1, "icon", 22);
    \u0275\u0275text(2, " Uploaded ");
    \u0275\u0275elementEnd();
  }
}
function RealtimeactivityComponent_For_19_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 23);
    \u0275\u0275listener("click", function RealtimeactivityComponent_For_19_Conditional_22_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const x_r3 = \u0275\u0275nextContext().$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.updateIds(x_r3));
    });
    \u0275\u0275elementEnd();
  }
}
function RealtimeactivityComponent_For_19_Conditional_25_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 24);
    \u0275\u0275listener("click", function RealtimeactivityComponent_For_19_Conditional_25_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const x_r3 = \u0275\u0275nextContext().$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.updateIds(x_r3));
    });
    \u0275\u0275elementEnd();
  }
}
function RealtimeactivityComponent_For_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 8)(1, "div", 10)(2, "div", 11)(3, "div");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div", 6);
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 6);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 12)(12, "div", 13);
    \u0275\u0275template(13, RealtimeactivityComponent_For_19_Conditional_13_Template, 2, 0, "span")(14, RealtimeactivityComponent_For_19_Conditional_14_Template, 1, 0)(15, RealtimeactivityComponent_For_19_Conditional_15_Template, 1, 0)(16, RealtimeactivityComponent_For_19_Conditional_16_Template, 1, 0)(17, RealtimeactivityComponent_For_19_Conditional_17_Template, 1, 0);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "div", 14)(19, "div", 15);
    \u0275\u0275template(20, RealtimeactivityComponent_For_19_Conditional_20_Template, 1, 0, "div", 16)(21, RealtimeactivityComponent_For_19_Conditional_21_Template, 3, 0)(22, RealtimeactivityComponent_For_19_Conditional_22_Template, 1, 0, "icon", 17);
    \u0275\u0275elementStart(23, "span", 18)(24, "icon", 19);
    \u0275\u0275listener("click", function RealtimeactivityComponent_For_19_Template_icon_click_24_listener() {
      const x_r3 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.publishComplete(x_r3));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(25, RealtimeactivityComponent_For_19_Conditional_25_Template, 1, 0, "icon", 20);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classMap(x_r3.expand ? "bg-white text-gray-600 rounded-b-none" : "text-grey ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2(" ", x_r3.cProtocol, " | ", x_r3.cName, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r3.dStartDt ? \u0275\u0275pipeBind2(7, 12, x_r3.dStartDt, "dd MMM yyyy hh:m:ss") : "-", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", x_r3.dEndDt ? \u0275\u0275pipeBind2(10, 15, x_r3.dEndDt, "dd MMM yyyy hh:m:ss") : "\xA0\xA0\xA0\xA0 \u2014 ", " ");
    \u0275\u0275advance(4);
    \u0275\u0275conditional(13, x_r3.cUploadstatus == "U" ? 13 : x_r3.cUploadstatus == "C" ? 14 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(15, x_r3.isUploaded && x_r3.isTranscript && !x_r3.cUploadstatus ? 15 : x_r3.isUploaded && !x_r3.isTranscript && !x_r3.cUploadstatus ? 16 : !x_r3.isUploaded && !x_r3.isTranscript && !x_r3.cUploadstatus ? 17 : -1);
    \u0275\u0275advance(5);
    \u0275\u0275conditional(20, x_r3.cUploadstatus == "U" ? 20 : x_r3.cUploadstatus == "C" ? 21 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(22, !x_r3.isUploaded && !x_r3.isTranscript && !x_r3.cUploadstatus ? 22 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(18, _c0, !x_r3.isUploaded && !x_r3.isTranscript && !x_r3.cUploadstatus));
    \u0275\u0275advance();
    \u0275\u0275conditional(25, x_r3.isUploaded ? 25 : -1);
  }
}
var RealtimeactivityComponent = class _RealtimeactivityComponent {
  constructor(realtieactivityService, route, cdr, userPermissions) {
    this.realtieactivityService = realtieactivityService;
    this.route = route;
    this.cdr = cdr;
    this.userPermissions = userPermissions;
    this.nCaseid = null;
    this.sessionList = [];
    var params = this.route.snapshot.params;
    params = JSON.parse(atob(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : 0;
    userPermissions.userPermissionList(this.nCaseid);
  }
  back() {
    window.history.back();
  }
  ExportData() {
    return __async(this, null, function* () {
    });
  }
  ngOnInit() {
    this.getsessionsbycaseid();
  }
  uploadComplete() {
    return __async(this, null, function* () {
      this.currentSession["isUploaded"] = true;
      this.currentSession["isTranscript"] = false;
      const obj = {
        nSesid: this.currentSession["nSesid"],
        nCaseid: this.nCaseid,
        cProtocol: this.currentSession["cProtocol"],
        cFlag: "C"
      };
      const data = yield this.realtieactivityService.transsciptUpdate(obj);
      if (data.msg == 1) {
        this.getsessionsbycaseid();
      }
      this.cdr.detectChanges();
    });
  }
  publishComplete(x) {
    return __async(this, null, function* () {
      delete x["cUploadstatus"];
      const obj = {
        nSesid: x.nSesid,
        nCaseid: this.nCaseid,
        cProtocol: x.cProtocol,
        cFlag: "P"
      };
      const res = yield this.realtieactivityService.transsciptUpdate(obj);
      if (res.msg == 1) {
        x["isUploaded"] = true;
        x["isTranscript"] = true;
      }
      this.getsessionsbycaseid();
      this.cdr.detectChanges();
    });
  }
  updateIds(x) {
    this.currentSession = x;
    document.getElementById("uploadFile").click();
    this.cdr.detectChanges();
  }
  onFileChange(e) {
    return __async(this, null, function* () {
      if (!e.target.files[0])
        return;
      const formData = new FormData();
      const filename = `s_${this.currentSession?.nSesid}`;
      formData.append("filename", filename);
      formData.append("caseid", this.nCaseid.toString());
      formData.append("file", e.target.files[0]);
      this.currentSession.cUploadstatus = "U";
      const res = yield this.realtieactivityService.upload(formData);
      if (res == -1) {
        this.currentSession.cUploadstatus = "F";
      } else {
        this.currentSession.cUploadstatus = "C";
        this.currentSession.nProgress = 100;
        this.uploadComplete();
      }
      this.cdr.detectChanges();
    });
  }
  getsessionsbycaseid() {
    return __async(this, null, function* () {
      const res = yield this.realtieactivityService.getsessionsbycaseid(this.nCaseid);
      if (res && res.length) {
        this.sessionList = res;
      }
      this.cdr.detectChanges();
    });
  }
  static {
    this.\u0275fac = function RealtimeactivityComponent_Factory(t) {
      return new (t || _RealtimeactivityComponent)(\u0275\u0275directiveInject(RealtimeactivityService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RealtimeactivityComponent, selectors: [["app-realtimeactivity"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 21, vars: 0, consts: [[1, "py-3", "px-10"], [1, "text-lg", "font-bold"], ["name", "chvy", 1, "text-bse", "me-3", 3, "click"], [1, "bg-blue-deactivate", "h-full", "p-5"], [1, "h-[calc(100%_-_50px)]", "bg-white", "rounded-xl", "flex", "flex-col", "overflow-auto"], [1, "flex", "items-center", "text-xs", "border-b", "py-3", "sticky", "top-0", "bg-white", "px-5", "z-30"], [1, "w-1/4", "px-2"], [1, ""], [1, "border-b", "px-5", "border-gray-100", "py-2.5", "overflow-hidden", "hover:bg-blue-50"], ["accept", ".txt", "type", "file", "id", "uploadFile", "hidden", "", 3, "change"], [1, "flex", "items-center", "text-xs"], [1, "w-1/4", "truncate", "px-2"], [1, "w-1/4", "px-3", "gap-3", "flex", "items-center", "ms-auto"], [1, "gap-3", "flex", "items-center", "px-2", "py-1", "border", "border-white/50", "rounded-full", "w-fit", "text-xxs", "bg-dark-blue/10"], [1, "w-1/4"], [1, "w-full", "px-2", "flex", "items-center", "gap-4", "justify-end"], ["role", "status", "aria-label", "loading", 1, "animate-spin", "inline-block", "size-3", "border-[2px]", "border-current", "border-t-transparent", "text-blue-600", "rounded-full", "dark:text-blue-500"], ["name", "upload", "type", "adminicn", "matTooltip", "upload", 1, "text-sm", "cursor-pointer", "ms-auto"], ["matTooltip", "Publish to admin"], ["name", "setting", 1, "text-lg", "cursor-pointer", "rotate-180", 3, "click", "ngClass"], ["name", "replace", "type", "extra", "matTooltip", "Replace", 1, "text-sm", "cursor-pointer"], [1, "flex", "gap-2", "items-center", "text-sgreen", "font-semibold"], ["name", "check"], ["name", "upload", "type", "adminicn", "matTooltip", "upload", 1, "text-sm", "cursor-pointer", "ms-auto", 3, "click"], ["name", "replace", "type", "extra", "matTooltip", "Replace", 1, "text-sm", "cursor-pointer", 3, "click"]], template: function RealtimeactivityComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1)(2, "icon", 2);
        \u0275\u0275listener("click", function RealtimeactivityComponent_Template_icon_click_2_listener() {
          return ctx.back();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275text(3, " Relatime Activity & Transcript ");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "div", 3)(5, "div", 4)(6, "header", 5)(7, "div", 6);
        \u0275\u0275text(8, " Trasnscript Name ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "div", 6);
        \u0275\u0275text(10, " Started at ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "div", 6);
        \u0275\u0275text(12, " Last Updated ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "div", 6);
        \u0275\u0275text(14, " Status ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "div", 6);
        \u0275\u0275element(16, "span");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(17, "div", 7);
        \u0275\u0275repeaterCreate(18, RealtimeactivityComponent_For_19_Template, 26, 20, "div", 8, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(20, "input", 9);
        \u0275\u0275listener("change", function RealtimeactivityComponent_Template_input_change_20_listener($event) {
          return ctx.onFileChange($event);
        });
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(18);
        \u0275\u0275repeater(ctx.sessionList);
      }
    }, dependencies: [IconComponent, NgClass, MatTooltipModule, MatTooltip, DatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RealtimeactivityComponent, { className: "RealtimeactivityComponent", filePath: "src\\app\\adminpanel\\components\\activity-log\\realtimeactivity\\realtimeactivity.component.ts", lineNumber: 20 });
})();
export {
  RealtimeactivityComponent
};
//# sourceMappingURL=chunk-CIPGGHJE.js.map
