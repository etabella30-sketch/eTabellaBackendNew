import {
  MatChipGrid,
  MatChipInput,
  MatChipsModule
} from "./chunk-C74BWBQ3.js";
import {
  MatAutocomplete,
  MatAutocompleteModule,
  MatAutocompleteTrigger
} from "./chunk-JASM6CRZ.js";
import {
  ColorpickerComponent
} from "./chunk-4GXCDIYV.js";
import {
  MatFormField,
  MatFormFieldModule
} from "./chunk-Y2GGPNYR.js";
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
  MatDialog,
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  DefaultValueAccessor,
  FormBuilder,
  FormControl,
  FormControlName,
  FormGroupDirective,
  FormsModule,
  MaxLengthValidator,
  NgControlStatus,
  NgControlStatusGroup,
  ReactiveFormsModule,
  Validators,
  ɵNgNoValidate
} from "./chunk-CIO7JDBK.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  LiveAnnouncer,
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  HttpClient,
  HttpClientModule,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgClass
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  firstValueFrom,
  inject,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
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
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/realtime/services/issue/issue.service.ts
var IssueService = class _IssueService {
  // constructor(private http: HttpClient, private annotationService: AnnotationService) {
  constructor(http) {
    this.http = http;
  }
  fetchIssueList(mdl) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", mdl.nCaseid);
      params = params.set("nSessionid", mdl.nSessionid);
      params = params.set("nUserid", mdl.nUserid);
      params = params.set("nIDid", mdl.nIDid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/issuelist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  fetchIssueAllDetail(mdl) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nIid", mdl.nIid);
      params = params.set("nCaseid", mdl.nCaseid);
      params = params.set("nUserid", mdl.nUserid);
      params = params.set("nSessionid", mdl.nSessionid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/getIssueDetailbyissueid`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  fetchIssueDetail(nIDid) {
    return __async(this, null, function* () {
      let res = {};
      let params = new HttpParams().set("nIDid", nIDid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/getissuedetailbyid`, { params }));
        if (!res?.length) {
          return {};
          ;
        }
        res = res[0];
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  fetchAnnotations(mdl) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", mdl.nCaseid);
      params = params.set("nSessionid", mdl.nSessionid);
      params = params.set("nUserid", mdl.nUserid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/getissueannotationlist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  fetchHyperlinks(mdl) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", mdl.nCaseid);
      params = params.set("nSessionid", mdl.nSessionid);
      params = params.set("nUserid", mdl.nUserid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/gethighlightlist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  insertIssueDetail(frm) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/insertIssueDetail`, frm));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  updateHighlightIssueIds(frm) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/updateHighlightIssueIds`, frm));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  updateIssueDetail(frm) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.put(`${environment.cloudUrl2}${environment.realtimeserive}/issue/updateIssueDetail`, frm));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  deleteIssueDetail(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.delete(`${environment.cloudUrl2}${environment.realtimeserive}/issue/deleteIssueDetail`, { body: { nIDid: mdl.nIDid } }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  insertHyperlink(frm) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/inserthighlights`, frm));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  deleteHyperlink(nHid, cTrans) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.delete(`${environment.cloudUrl2}${environment.realtimeserive}/issue/deletehighlights`, { body: { nHid, cTranscript: cTrans } }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  //////////////////////////////////
  fetchSession(nSesid, nUserid, caseid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nSesid", nSesid && !Number.isNaN(nSesid) ? nSesid : 0);
      params = params.set("nUserid", nUserid);
      params = params.set("nCaseid", caseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(
          `${environment.cloudUrl2}${environment.realtimeserive}/session/sessiondatav2`,
          // `http://192.168.1.9:5005/session/sessiondatav2`,
          { params }
        ));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  issueCreation(frm) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/insertIssue`, frm));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  removeHighlights(frm) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/removemultihighlights`, frm));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  categoryCreation(frm) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/insertCategory`, frm));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getPreviousSessions(nCaseid, nUserid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("nUserid", nUserid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/session/getsessionsbycaseid`, { params }));
        if (!res.length) {
          res = [];
        }
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getLiveSessionByCaseid(nCaseid, nUserid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("nUserid", nUserid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/session/getlivesessionbycaseid`, { params }));
        if (!res.length) {
          res = [];
        }
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getCategory(nCaseid, nUserid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("nUserid", nUserid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/getissuecategorylist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  issueUpdate(frm) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.put(`${environment.cloudUrl2}${environment.realtimeserive}/issue/updateIssue`, frm));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  issueDelete(nIid) {
    return __async(this, null, function* () {
      const url = `${environment.cloudUrl2}${environment.realtimeserive}/issue/deleteIssue`;
      let res = [];
      try {
        res = yield firstValueFrom(this.http.request("delete", url, {
          headers: {
            "Content-Type": "application/json",
            "Accept": "*/*"
          },
          body: {
            nIid
          }
        }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getRealtimeDataBySessionId(nSesid, nUserid, nCaseid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nSesid", nSesid);
      params = params.set("nUserid", nUserid);
      params = params.set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/session/realtimedatabysesid`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  fetchSessionObj(id, userid, caseid) {
    return __async(this, null, function* () {
      return new Promise((resolve, reject) => __async(this, null, function* () {
        let obj = {};
        try {
          let data = yield this.fetchSession(id, userid, caseid);
          if (data && data.length) {
            obj = {
              cCasename: String(data[0].cCasename),
              cName: String(data[0].cName),
              cStatus: String(data[0].cStatus),
              maxNumber: Number(data[0].maxNumber),
              lastPage: 0,
              pageRes: data[0]["pageRes"],
              lastLineNumber: 0,
              nSesid: data[0].nSesid,
              nCaseid: data[0].nCaseid,
              totaIssues: data[0].totaIssues,
              settings: {
                lineNumber: data[0].nLines,
                startPage: data[0].nPageno
              },
              isTrans: data[0].isTrans,
              nDemoid: data[0].nDemoid,
              cProtocol: data[0].cProtocol
            };
            console.log("session data", data[0]);
            try {
            } catch (error) {
            }
            try {
            } catch (error) {
              console.error(error);
            }
          }
        } catch (error) {
        }
        resolve(obj);
      }));
    });
  }
  deleteDemoIssues(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/deletedemoissuedetail`, mdl));
        if (res && res.length) {
          res = res;
        }
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getDynamicCombo(nCategoryid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCategoryid", nCategoryid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/dynamiccombo`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getLastIssue(data) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("jIids", JSON.stringify(data));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/getLastIssue`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  exportAnnotIssueHighlight(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/transcript/annothighlightexport`, mdl));
        if (res && res.length) {
          console.log("annothighlightexport", res);
          res = res;
        }
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  // downloadFile(cPath: string): Observable<Blob> {
  //   let params = new HttpParams()
  //   params = params.set('cPath', cPath);
  //   const headers = new HttpHeaders().set('Content-Type', 'application/json');
  //   return this.http.get(`${environment.cloudUrl}${environment.realtimeserive}/issue/download`, {
  //     params: params,
  //     headers: headers,
  //     responseType: 'blob' // Important to specify blob as the response type
  //   });
  // }
  downloadFile(filePath) {
    return this.http.get(filePath, { responseType: "blob" });
  }
  setDefault(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/setdefault`, mdl));
      } catch (error) {
        console.error(error);
        res = { msg: -1 };
      }
      return res;
    });
  }
  insertLog(nSesid, nUserid, cStatus) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/session/log/join`, { nUserid, nSesid, cStatus }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  fetchRTSession(nCaseid, dStartDt, dEndDt) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("dStartDt", dStartDt);
      params = params.set("dEndDt", dEndDt);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/session/rt/logs/session`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  fetchRTSessionusers(nSesid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nSesid", nSesid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/session/rt/logs/session/users`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  fetchRTLogs(nSesid, nUserid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nSesid", nSesid);
      params = params.set("nUserid", nUserid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/session/rt/logs`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  exportData(nCaseid, dStartDt, dEndDt) {
    return __async(this, null, function* () {
      let res = {};
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/session/rt/logs/export`, { nCaseid, dStartDt, dEndDt }));
      } catch (error) {
        console.error(error);
        res = { msg: -1 };
      }
      return res;
    });
  }
  updateIssueNote(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/update/issuedetail/note`, mdl));
        if (res && res.length) {
          res = res;
        }
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getIssueDetailAnots(nSessionid, nUserid, nCaseid, cTranscript) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nSessionid", nSessionid || 0);
      params = params.set("nUserid", nUserid || 0);
      params = params.set("nCaseid", nCaseid || 0);
      params = params.set("cTranscript", cTranscript || "N");
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/issuedetail/annotations`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function IssueService_Factory(t) {
      return new (t || _IssueService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _IssueService, factory: _IssueService.\u0275fac, providedIn: "root" });
  }
};

// src/app/realtime/components/issues/createissue/createissue.component.ts
var _c0 = ["fruitInput"];
var _c1 = ["colorPicker"];
var _c2 = (a0) => ({ "!hidden": a0 });
function CreateissueComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "icon", 33);
    \u0275\u0275listener("click", function CreateissueComponent_Conditional_6_Template_icon_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.close());
    });
    \u0275\u0275elementEnd();
  }
}
function CreateissueComponent_Conditional_13_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 34)(1, "app-colorpicker", 35, 4);
    \u0275\u0275twoWayListener("myColorChange", function CreateissueComponent_Conditional_13_Conditional_1_Template_app_colorpicker_myColorChange_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r2.cClr, $event) || (ctx_r2.cClr = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("myColor", ctx_r2.cClr);
    \u0275\u0275property("colorslist", ctx_r2.colorslist);
  }
}
function CreateissueComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275template(1, CreateissueComponent_Conditional_13_Conditional_1_Template, 3, 2, "div", 34);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r2.isLoaded ? 1 : -1);
  }
}
function CreateissueComponent_Conditional_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 22)(1, "div", 36);
    \u0275\u0275element(2, "icon", 37);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("value", ctx_r2.tempitem)("ngClass", \u0275\u0275pureFunction1(3, _c2, !ctx_r2.tempitem));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r2.tempitem, " ");
  }
}
function CreateissueComponent_For_28_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 38);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("value", x_r5);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(x_r5.cCategory);
  }
}
function CreateissueComponent_For_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, CreateissueComponent_For_28_Conditional_0_Template, 2, 2, "mat-option", 38);
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275conditional(0, x_r5.cICtype != "U" ? 0 : -1);
  }
}
function CreateissueComponent_ForEmpty_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 23);
    \u0275\u0275text(1, "Category not found");
    \u0275\u0275elementEnd();
  }
}
function CreateissueComponent_Conditional_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "btn", 26);
    \u0275\u0275text(1, " Delete ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    const end_r6 = \u0275\u0275reference(35);
    \u0275\u0275property("matMenuTriggerFor", end_r6)("isloading", ctx_r2.isDeleting)("disabled", ctx_r2.isDeleting);
  }
}
function CreateissueComponent_Conditional_44_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 34)(1, "app-colorpicker", 35, 4);
    \u0275\u0275twoWayListener("myColorChange", function CreateissueComponent_Conditional_44_Conditional_1_Template_app_colorpicker_myColorChange_1_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r2.cClr, $event) || (ctx_r2.cClr = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("myColor", ctx_r2.cClr);
    \u0275\u0275property("colorslist", ctx_r2.colorslist);
  }
}
function CreateissueComponent_Conditional_44_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 32);
    \u0275\u0275template(1, CreateissueComponent_Conditional_44_Conditional_1_Template, 3, 2, "div", 34);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, !ctx_r2.isLoaded ? 1 : -1);
  }
}
var CreateissueComponent = class _CreateissueComponent {
  constructor(cs, cdr, store, dialog, issue, openDialog, formBuilder, data, tost) {
    this.cs = cs;
    this.cdr = cdr;
    this.store = store;
    this.dialog = dialog;
    this.issue = issue;
    this.openDialog = openDialog;
    this.formBuilder = formBuilder;
    this.data = data;
    this.tost = tost;
    this.cClr = "#ff9163";
    this.selecteditem = "";
    this.isLoading = false;
    this.fruitCtrl = new FormControl("");
    this.categories = [];
    this.tempCat = [];
    this.current_session = {};
    this.announcer = inject(LiveAnnouncer);
    this.isLoaded = true;
    this.isCentered = false;
    this.isSubmitting = false;
    this.isDeleting = false;
    this.issue_frm = this.formBuilder.group({
      nIid: [0],
      cIName: ["", [Validators.required]],
      cCategory: [""],
      nICid: new FormControl(""),
      permission: ["N"],
      cColor: [""]
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.nUserid = yield this.store.getUserId();
      this.colorslist = [
        { cClr: "#ff8f63" }
      ];
      if (this.data) {
        this.current_session = this.data.current_session;
        if (this.data.colorslist) {
          this.colorslist = this.data.colorslist.reverse();
        }
      }
      ;
      this.getCategory();
      if (this.data && this.data.type == "E") {
        this.issue_frm.patchValue({
          cIName: this.data.value.cIName,
          nIid: this.data.value.nIid,
          nICid: this.data.value.nICid,
          permission: "E",
          cColor: this.data.value.cColor
        });
        this.cClr = "#" + this.data.value.cColor;
        this.selecteditem = this.data.value.cCategory;
        this.cdr.detectChanges();
      }
      this.previousIssue = this.cClr;
      this.isLoaded = false;
    });
  }
  getCategory() {
    return __async(this, null, function* () {
      let cat = yield this.issue.getCategory(this.current_session.nCaseid, this.nUserid);
      this.categories = cat;
      this.tempCat = this.categories;
    });
  }
  add(event) {
    const value = event.value;
    if (value) {
      this.selecteditem = value;
    }
  }
  selected(event) {
    if (event.option.value.cCategory) {
      this.selecteditem = event.option.value.cCategory;
      this.issue_frm.patchValue({
        nICid: event.option.value.nICid,
        cCategory: event.option.value.cCategory
      });
    } else {
      this.selecteditem = event.option.value;
    }
    this.tempitem = "";
    if (!this.categories.filter((e) => e.cCategory == this.selecteditem).length) {
      let mdl = {
        nICid: null,
        nCaseid: this.current_session.nCaseid,
        cCategory: this.selecteditem,
        dCreateDt: this.cs.getCurrentTime(),
        nUserid: this.nUserid
      };
      this.issue.categoryCreation(mdl).then((res) => {
        if (res[0]["msg"] == 1) {
          this.isLoading = false;
          this.tost.openSnackBar("Category created successfully", "");
          this.categories.push({
            cCategory: this.selecteditem,
            nICid: res[0]["nICid"]
          });
          this.issue_frm.patchValue({
            nICid: res[0]["nICid"]
          });
        } else {
          this.isLoading = false;
          this.tost.openSnackBar(res[0]["message"], "E");
        }
      });
    }
    setTimeout(() => {
      this.tempCat = this.categories;
    });
  }
  enterHandler(event) {
    if (event.target.value) {
      let mdl = {
        nICid: null,
        nCaseid: this.current_session.nCaseid,
        cCategory: event.target.value,
        dCreateDt: this.cs.getCurrentTime(),
        nUserid: this.nUserid
      };
      this.issue.categoryCreation(mdl).then((res) => {
        if (res[0]["msg"] == 1) {
          this.isLoading = false;
          this.tost.openSnackBar("Category created successfully", "");
          this.categories.push({
            cCategory: event.target.value,
            nICid: res[0]["nICid"]
          });
          this.issue_frm.patchValue({
            nICid: res[0]["nICid"],
            cCategory: event.target.value
          });
          console.log(this.issue_frm.value);
        } else {
          this.isLoading = false;
          this.tost.openSnackBar(res[0]["message"], "E");
        }
      });
    }
  }
  selectExistingCategory(event) {
    console.log(event);
  }
  filterOptions(event) {
    let filterValue = event.target.value.toLowerCase();
    if (filterValue) {
      this.tempCat = this.categories.filter((category) => category.cCategory.toLowerCase().includes(filterValue));
    } else {
      this.tempCat = this.categories;
    }
  }
  _filter(value) {
    const filterValue = value.toLowerCase();
    return this.categories.filter((fruit) => fruit.cCategory.toLowerCase().includes(filterValue));
  }
  tempadd(ev) {
    this.tempitem = ev.target.value;
  }
  checktemp() {
    try {
      return this.categories.filter((e) => e.cCategory == this.tempitem).length ? true : false;
    } catch (error) {
      return false;
    }
  }
  close() {
    this.dialog.close(false);
  }
  removeHash(colorCode) {
    if (colorCode.startsWith("#")) {
      return colorCode.substring(1);
    }
    return colorCode;
  }
  submitForm() {
    return __async(this, null, function* () {
      this.isLoading = true;
      if (this.issue_frm.invalid) {
        this.isLoading = false;
        return;
      }
      if (this.issue_frm.value.nICid && !this.issue_frm.value.cCategory) {
        this.isLoading = false;
        this.tost.openSnackBar("Please add category", "E");
        return;
      }
      const exists = this.categories.some((a) => a.nICid === this.issue_frm.value.nICid && a.cCategory === this.issue_frm.value.cCategory);
      if (!exists) {
        this.isLoading = false;
        this.tost.openSnackBar("Please add category", "E");
        return;
      }
      let x = this.issue_frm.value;
      let nIDcatid = x.nICid;
      if (!nIDcatid) {
        let dts = this.categories.filter((e) => e.cICtype == "U");
        if (dts.length) {
          nIDcatid = dts[0].nICid;
        } else {
          if (this.categories.find((a) => a.cCategory == "Unassigned")) {
            nIDcatid = this.categories.find((a) => a.cCategory == "Unassigned").nICid;
          } else {
            this.tost.openSnackBar("Please create category", "E");
            return;
          }
        }
      }
      this.cClr = this.removeHash(this.cClr);
      let mdl = {
        nIid: x.nIid,
        cIName: x.cIName,
        cColor: this.cClr !== "ff8f63" ? this.cClr : x.cColor ? x.cColor : "ff8f63",
        nICid: nIDcatid,
        nCaseid: this.current_session.nCaseid
      };
      if (x.permission == "N") {
        mdl["dCreatedt"] = this.cs.getCurrentTime();
        mdl["nIid"] = 0;
        mdl["nUserid"] = this.nUserid;
        this.isSubmitting = true;
        this.issue.issueCreation(mdl).then((res) => {
          this.isSubmitting = false;
          if (res[0]["msg"] == 1) {
            this.isLoading = false;
            this.tost.openSnackBar("Issue created successfully", "");
            this.dialog.close({ data: mdl });
          } else {
            this.isLoading = false;
            this.tost.openSnackBar(res[0]["message"], "E");
          }
        });
      } else {
        mdl["dUpdatedt"] = this.cs.getCurrentTime();
        mdl["nUserid"] = this.nUserid;
        this.isSubmitting = true;
        this.issue.issueUpdate(mdl).then((res) => {
          this.isSubmitting = false;
          if (res[0]["msg"] == 1) {
            this.isLoading = false;
            this.tost.openSnackBar("Issue updated successfully", "");
            this.dialog.close({ type: "E", data: mdl, nIid: x.nIid, cColor: this.cClr !== "ff8f63" ? this.cClr : x.cColor ? x.cColor : "ff8f63", previousColor: this.previousIssue });
          } else {
            this.isLoading = false;
            this.tost.openSnackBar(res[0]["message"], "E");
          }
        });
      }
    });
  }
  // issuelist() {
  //   this.openDialog.open(IssueListComponent, {
  //     width: '519px',
  //     height: 'calc(100vh - 181px)',
  //     hasBackdrop: false,
  //     panelClass: ['issuemodel', 'noshadow'],
  //     position: {
  //       top: `151px`,
  //       right: `0px`,
  //     },
  //     data: {
  //       type: 'A',
  //       current_session: this.current_session,
  //     },
  //   });
  // }
  deleteIssue() {
    this.isDeleting = true;
    this.issue.issueDelete(this.data.value.nIid).then((res) => {
      this.isDeleting = false;
      if (res[0]["msg"] == 1) {
        this.tost.openSnackBar("Issue deleted successfully", "");
        this.dialog.close({ isDeleted: true });
      } else {
        this.tost.openSnackBar(res[0]["message"], "E");
      }
    });
  }
  static {
    this.\u0275fac = function CreateissueComponent_Factory(t) {
      return new (t || _CreateissueComponent)(\u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(IssueService), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(FormBuilder), \u0275\u0275directiveInject(MAT_DIALOG_DATA), \u0275\u0275directiveInject(TostbarService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CreateissueComponent, selectors: [["app-createissue"]], viewQuery: function CreateissueComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
        \u0275\u0275viewQuery(_c1, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.fruitInput = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.colorPicker = _t.first);
      }
    }, standalone: true, features: [\u0275\u0275ProvidersFeature([IssueService]), \u0275\u0275StandaloneFeature], decls: 45, vars: 24, consts: [["chipGrid", ""], ["fruitInput", ""], ["auto", "matAutocomplete"], ["end", "matMenu"], ["colorPicker", ""], [1, "shadow-[0px_0px_2px_#0000004f]", "sticky", "top-0", "z-50", "-mt-px", "h-px", "w-full"], [1, "flex", "flex-col", "p-5", "bg-white", "w-full", "h-full", "overflow-auto", "shadow-[inset_0px_1px_4px_#0000004f]"], [3, "formGroup", "ngClass"], [1, "w-full", 3, "ngClass"], [1, "flex", "items-center", "text-lg", "font-bold", "mb-6"], ["name", "close", 1, "text-xs", "ms-auto", "cursor-pointer", "hover:text-blue-on"], [1, "text-xs", "font-bold", "mb-2", "block"], [1, "text-xs", "font-normal", "text-red-500"], ["placeholder", "Enter Issue", "type", "text", "formControlName", "cIName", 1, "block", "w-full", "px-3", "py-2", "border", "rounded-base", "shadow-sm", "focus:outline-none", "text-xs", "border-tab", "text-gray", "focus:shadow-[0px_0px_6px_#0066FF]", "focus:border-blue-deactivate"], [1, "flex", "flex-col", "mt-6", "rounded-xl", "bg-neutral-50"], ["for", "assignClaim", 1, "mt-6", "block", "mb-2.5", "text-xs", "font-bold", "leading-4", "text-neutral-600"], [1, "w-full", "h-8.5", "flex", "items-center"], ["aria-label", "Fruit selection", 1, "!hidden"], [1, "flex", "gap-1", "items-center", "px-2.5"], ["maxlength", "50", "formControlName", "nICid", "placeholder", "Select...", 1, "!text-xs", "!py-2", "focus:shadow-none", 3, "valueChange", "matChipInputTokenEnd", "keydown.enter", "input", "value", "matChipInputFor", "matAutocomplete"], ["name", "chvx", 1, "text-xs"], [3, "optionSelected"], [3, "value", "ngClass"], ["disabled", "true"], [1, "flex", "gap-2", "mt-6"], ["addcls", "w-full", 1, "block", "flex-1", 3, "click", "disabled", "isloading"], ["addcls", "w-full", "mode", "outlined", 1, "matmenu", "flex-1", 3, "matMenuTriggerFor", "isloading", "disabled"], ["xPosition", "before", 1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [1, "flex", "gap-2"], [3, "click", "isloading"], ["mode", "dark"], [1, "flex", "flex-col", "rounded-xl", "bg-neutral-50"], ["name", "close", 1, "text-xs", "ms-auto", "cursor-pointer", "hover:text-blue-on", 3, "click"], [1, "rounded-3"], [1, "mx-auto", 3, "myColorChange", "myColor", "colorslist"], [1, "flex", "items-center", "gap-2"], ["name", "addcircle"], [3, "value"]], template: function CreateissueComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275element(0, "div", 5);
        \u0275\u0275elementStart(1, "section", 6)(2, "form", 7)(3, "div", 8)(4, "h1", 9);
        \u0275\u0275text(5);
        \u0275\u0275template(6, CreateissueComponent_Conditional_6_Template, 1, 0, "icon", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "div")(8, "label", 11);
        \u0275\u0275text(9, " Issue Name ");
        \u0275\u0275elementStart(10, "span", 12);
        \u0275\u0275text(11, "*");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(12, "input", 13);
        \u0275\u0275elementEnd();
        \u0275\u0275template(13, CreateissueComponent_Conditional_13_Template, 2, 1, "div", 14);
        \u0275\u0275elementStart(14, "label", 15);
        \u0275\u0275text(15, "Assign/Create a claim ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "div")(17, "mat-form-field", 16);
        \u0275\u0275element(18, "mat-chip-grid", 17, 0);
        \u0275\u0275elementStart(20, "div", 18)(21, "input", 19, 1);
        \u0275\u0275twoWayListener("valueChange", function CreateissueComponent_Template_input_valueChange_21_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.selecteditem, $event) || (ctx.selecteditem = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("matChipInputTokenEnd", function CreateissueComponent_Template_input_matChipInputTokenEnd_21_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.add($event));
        })("keydown.enter", function CreateissueComponent_Template_input_keydown_enter_21_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.enterHandler($event));
        })("input", function CreateissueComponent_Template_input_input_21_listener($event) {
          \u0275\u0275restoreView(_r1);
          ctx.tempadd($event);
          return \u0275\u0275resetView(ctx.filterOptions($event));
        });
        \u0275\u0275elementEnd();
        \u0275\u0275element(23, "icon", 20);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(24, "mat-autocomplete", 21, 2);
        \u0275\u0275listener("optionSelected", function CreateissueComponent_Template_mat_autocomplete_optionSelected_24_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.selected($event));
        });
        \u0275\u0275template(26, CreateissueComponent_Conditional_26_Template, 4, 5, "mat-option", 22);
        \u0275\u0275repeaterCreate(27, CreateissueComponent_For_28_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIdentity, false, CreateissueComponent_ForEmpty_29_Template, 2, 0, "mat-option", 23);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(30, "div", 24)(31, "btn", 25);
        \u0275\u0275listener("click", function CreateissueComponent_Template_btn_click_31_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.submitForm());
        });
        \u0275\u0275text(32);
        \u0275\u0275elementEnd();
        \u0275\u0275template(33, CreateissueComponent_Conditional_33_Template, 2, 3, "btn", 26);
        \u0275\u0275elementStart(34, "mat-menu", 27, 3)(36, "div")(37, "h6", 28);
        \u0275\u0275text(38, "Any changes made to this issue will apply to the files assigned to it.");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(39, "div", 29)(40, "btn", 30);
        \u0275\u0275listener("click", function CreateissueComponent_Template_btn_click_40_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.deleteIssue());
        });
        \u0275\u0275text(41, "Delete");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(42, "btn", 31);
        \u0275\u0275text(43, "cancel");
        \u0275\u0275elementEnd()()()()()();
        \u0275\u0275template(44, CreateissueComponent_Conditional_44_Template, 2, 1, "div", 32);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        const chipGrid_r8 = \u0275\u0275reference(19);
        const auto_r9 = \u0275\u0275reference(25);
        \u0275\u0275advance();
        \u0275\u0275classProp("max-w-[519px]", !ctx.isCentered);
        \u0275\u0275advance();
        \u0275\u0275property("formGroup", ctx.issue_frm)("ngClass", ctx.isCentered ? "flex gap-4" : "");
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", ctx.isCentered ? "flex flex-col" : "");
        \u0275\u0275advance();
        \u0275\u0275classProp("py-2", !ctx.isCentered);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" ", ctx.issue_frm.value.permission == "N" ? "Create New" : "Update", " Issue ");
        \u0275\u0275advance();
        \u0275\u0275conditional(6, !ctx.isCentered ? 6 : -1);
        \u0275\u0275advance(7);
        \u0275\u0275conditional(13, !ctx.isCentered ? 13 : -1);
        \u0275\u0275advance(8);
        \u0275\u0275twoWayProperty("value", ctx.selecteditem);
        \u0275\u0275property("matChipInputFor", chipGrid_r8)("matAutocomplete", auto_r9);
        \u0275\u0275advance(5);
        \u0275\u0275conditional(26, !ctx.checktemp() ? 26 : -1);
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.tempCat);
        \u0275\u0275advance(3);
        \u0275\u0275classProp("mt-auto", ctx.isCentered);
        \u0275\u0275advance();
        \u0275\u0275property("disabled", ctx.issue_frm.invalid)("isloading", ctx.isSubmitting);
        \u0275\u0275attribute("isdisabled", ctx.issue_frm.invalid);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" ", ctx.issue_frm.value.permission == "N" ? "Done" : "Update", "");
        \u0275\u0275advance();
        \u0275\u0275conditional(33, ctx.issue_frm.value.permission == "E" ? 33 : -1);
        \u0275\u0275advance(7);
        \u0275\u0275property("isloading", ctx.isDeleting);
        \u0275\u0275advance(4);
        \u0275\u0275conditional(44, ctx.isCentered ? 44 : -1);
      }
    }, dependencies: [ColorpickerComponent, IconComponent, MatFormFieldModule, MatFormField, MatChipsModule, MatChipGrid, MatChipInput, MatAutocompleteModule, MatAutocomplete, MatOption, MatAutocompleteTrigger, ReactiveFormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, MaxLengthValidator, FormGroupDirective, FormControlName, FormsModule, CommonModule, NgClass, ButtonComponent, MatMenuModule, MatMenu, MatMenuTrigger, HttpClientModule] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CreateissueComponent, { className: "CreateissueComponent", filePath: "src\\app\\realtime\\components\\issues\\createissue\\createissue.component.ts", lineNumber: 31 });
})();

export {
  IssueService,
  CreateissueComponent
};
//# sourceMappingURL=chunk-2SQPIY4Q.js.map
