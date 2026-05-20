import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableModule
} from "./chunk-ZLL363WY.js";
import {
  UploadService
} from "./chunk-ZP7PHFH3.js";
import {
  EmptyComponent
} from "./chunk-DHVW7RW5.js";
import {
  MatSelect,
  MatSelectModule
} from "./chunk-BM3TWEH3.js";
import {
  MatFormField
} from "./chunk-Y2GGPNYR.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  FormsModule
} from "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import {
  animate,
  state,
  style,
  transition,
  trigger
} from "./chunk-AIKHFB75.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-FNSUDMGC.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  CommonModule,
  DatePipe
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  firstValueFrom,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/ocrqueue/ocrqueue.service.ts
var OcrqueueService = class _OcrqueueService {
  constructor(sStore, http) {
    this.sStore = sStore;
    this.http = http;
  }
  get_ocrlist(nCaseid, nUserid) {
    return __async(this, null, function* () {
      try {
        let params = {
          nCaseid,
          nUserid
        };
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/ocrqueue/get_ocrlist`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  get_ocrFilelist(nCaseid, nUserid) {
    return __async(this, null, function* () {
      try {
        let params = {
          nCaseid,
          nUserid
        };
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/ocrqueue/get_ocrfilelist`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  getFileData(nUDid, file) {
    return __async(this, null, function* () {
      console.log("getFileData", nUDid);
      if (nUDid) {
        let res = yield this.fetchOCRDate(nUDid);
        let res1 = res && res.length ? res[0][0] : [];
        let res2 = res && res.length && res.length > 1 ? res[1] : [];
        debugger;
        if (res1) {
          if (res1.nOCRFiles == res1.nCompleted) {
            file.nOProgress = 0;
            file.nCompleted = res1.nCompleted;
          } else {
            if (file.cFiletype != "ZIP") {
              file.nFiles = res1.nOCRFiles;
            }
            file.nOProgress = res1.nOProgress;
            file.nOCRFiles = res1.nOCRFiles;
            file.nCompleted = res1.nCompleted;
            file.nFailed = res1.nFailed;
            file.ocrFiles = res2;
          }
        }
      }
    });
  }
  fetchOCRDate(nUDid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nUDid", nUDid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/upload/ocrdata`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  static {
    this.\u0275fac = function OcrqueueService_Factory(t) {
      return new (t || _OcrqueueService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _OcrqueueService, factory: _OcrqueueService.\u0275fac, providedIn: "root" });
  }
};

// src/app/adminpanel/components/upload/ocrlist/ocrlist.component.ts
var _c0 = () => [1, 2, 3, 4, 6, 7, 8];
var _c1 = () => ["expandedDetail"];
function OcrlistComponent_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r1 = ctx.$implicit;
    \u0275\u0275property("value", x_r1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", x_r1.cFname, " ", x_r1.cLname, " ");
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_1_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 21);
    \u0275\u0275element(1, "div", 24)(2, "div", 25)(3, "div", 26)(4, "div", 27)(5, "div", 27);
    \u0275\u0275elementEnd();
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15)(1, "div", 16);
    \u0275\u0275element(2, "div", 17)(3, "div", 18)(4, "div", 19)(5, "div", 20)(6, "div", 20);
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(7, OcrlistComponent_For_13_Conditional_5_Conditional_1_For_8_Template, 6, 0, "div", 21, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementStart(9, "div", 22);
    \u0275\u0275element(10, "div", 23);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(7);
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c0));
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_th_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 45);
    \u0275\u0275text(1, " Case No. ");
    \u0275\u0275elementEnd();
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 46);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = \u0275\u0275nextContext(3).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r3.cCaseno, " ");
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_th_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 45);
    \u0275\u0275text(1, " User Name ");
    \u0275\u0275elementEnd();
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 46)(1, "span", 47);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const element_r5 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", element_r5.cFname, " ", element_r5.cLname, " ");
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_th_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 48);
    \u0275\u0275text(1, " File Name ");
    \u0275\u0275elementEnd();
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 49)(1, "span", 50);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const element_r6 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", element_r6.cName, " ");
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_th_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 45);
    \u0275\u0275text(1, " Status ");
    \u0275\u0275elementEnd();
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_12_Conditional_2_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 57);
    \u0275\u0275listener("click", function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_12_Conditional_2_Conditional_5_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r7);
      const element_r8 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r3.getOCRFiles(element_r8));
    });
    \u0275\u0275element(1, "span", 58);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const element_r8 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(element_r8.nOProgress);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_12_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 52);
    \u0275\u0275text(1, "|");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 53)(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_12_Conditional_2_Conditional_5_Template, 3, 1, "span", 54);
    \u0275\u0275elementStart(6, "span", 55);
    \u0275\u0275element(7, "img", 56);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const element_r8 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", element_r8.nOCRFiles, " in OCR :");
    \u0275\u0275advance();
    \u0275\u0275conditional(5, element_r8.nOProgress > 0 ? 5 : -1);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(element_r8.nCompleted);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 46)(1, "div", 51);
    \u0275\u0275template(2, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_12_Conditional_2_Template, 9, 3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const element_r8 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, (element_r8 == null ? null : element_r8.nOCRFiles) ? 2 : -1);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_th_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 45);
    \u0275\u0275text(1, " Start At ");
    \u0275\u0275elementEnd();
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 46);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "date");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const element_r9 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(2, 1, element_r9.dStartDt, "dd MMM yyyy hh:m:ss"), " ");
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_th_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 45);
    \u0275\u0275text(1, " Time Elapsed ");
    \u0275\u0275elementEnd();
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 46);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const element_r10 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r3.getTime(element_r10), " ");
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_th_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th", 59);
    \u0275\u0275text(1, "\xA0");
    \u0275\u0275elementEnd();
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_21_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 61);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_21_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "icon", 62);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "td", 46)(1, "button", 60);
    \u0275\u0275listener("click", function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_21_Template_button_click_1_listener($event) {
      const element_r12 = \u0275\u0275restoreView(_r11).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(4);
      ctx_r3.getOCRFiles(element_r12);
      ctx_r3.expandedElement = ctx_r3.expandedElement === element_r12 ? null : element_r12;
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275template(2, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_21_Conditional_2_Template, 1, 0, "icon", 61)(3, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_21_Conditional_3_Template, 1, 0);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const element_r12 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(2, ctx_r3.expandedElement === element_r12 ? 2 : 3);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_23_For_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 68)(1, "td", 69)(2, "p", 70);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "td", 69)(5, "p", 70);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "td", 69)(8, "p", 70);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "td", 69)(12, "a", 71);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r13 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext(5);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", item_r13.cFilename, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", item_r13.message ? item_r13.message : item_r13.cStatus == "P" ? "Pending" : item_r13.cStatus == "OCR" ? "In Process" : item_r13.cStatus == "F" ? "Failed" : "Completed", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(10, 4, item_r13.dStartDt, "dd MMM yyyy hh:m:ss"), " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r3.getTime(item_r13));
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_td_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 46)(1, "div", 63)(2, "table", 64)(3, "thead")(4, "tr", 65)(5, "th", 66)(6, "p", 67);
    \u0275\u0275text(7, " File Name ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "th", 66)(9, "p", 67);
    \u0275\u0275text(10, " Status ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "th", 66)(12, "p", 67);
    \u0275\u0275text(13, " Started ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "th", 66)(15, "p", 67);
    \u0275\u0275text(16, " Time Elapsed ");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(17, "tbody");
    \u0275\u0275repeaterCreate(18, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_23_For_19_Template, 14, 7, "tr", 68, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const element_r14 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext(4);
    \u0275\u0275attribute("colspan", ctx_r3.columnsToDisplayWithExpand.length);
    \u0275\u0275advance();
    \u0275\u0275property("@detailExpand", element_r14 == ctx_r3.expandedElement ? "expanded" : "collapsed");
    \u0275\u0275advance(17);
    \u0275\u0275repeater(element_r14.ocrFiles);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_tr_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "tr", 72);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_tr_25_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr", 73);
    \u0275\u0275listener("click", function OcrlistComponent_For_13_Conditional_5_Conditional_2_tr_25_Template_tr_click_0_listener() {
      const element_r16 = \u0275\u0275restoreView(_r15).$implicit;
      const ctx_r3 = \u0275\u0275nextContext(4);
      ctx_r3.getOCRFiles(element_r16);
      return \u0275\u0275resetView(ctx_r3.expandedElement = ctx_r3.expandedElement === element_r16 ? null : element_r16);
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const element_r16 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext(4);
    \u0275\u0275classProp("example-expanded-row", ctx_r3.expandedElement === element_r16);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_tr_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "tr", 74);
  }
}
function OcrlistComponent_For_13_Conditional_5_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "table", 28);
    \u0275\u0275elementContainerStart(1, 29);
    \u0275\u0275template(2, OcrlistComponent_For_13_Conditional_5_Conditional_2_th_2_Template, 2, 0, "th", 30)(3, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_3_Template, 2, 1, "td", 31);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(4, 32);
    \u0275\u0275template(5, OcrlistComponent_For_13_Conditional_5_Conditional_2_th_5_Template, 2, 0, "th", 30)(6, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_6_Template, 3, 2, "td", 31);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(7, 33);
    \u0275\u0275template(8, OcrlistComponent_For_13_Conditional_5_Conditional_2_th_8_Template, 2, 0, "th", 34)(9, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_9_Template, 3, 1, "td", 35);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(10, 36);
    \u0275\u0275template(11, OcrlistComponent_For_13_Conditional_5_Conditional_2_th_11_Template, 2, 0, "th", 30)(12, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_12_Template, 3, 1, "td", 31);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(13, 37);
    \u0275\u0275template(14, OcrlistComponent_For_13_Conditional_5_Conditional_2_th_14_Template, 2, 0, "th", 30)(15, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_15_Template, 3, 4, "td", 31);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(16, 38);
    \u0275\u0275template(17, OcrlistComponent_For_13_Conditional_5_Conditional_2_th_17_Template, 2, 0, "th", 30)(18, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_18_Template, 2, 1, "td", 31);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(19, 39);
    \u0275\u0275template(20, OcrlistComponent_For_13_Conditional_5_Conditional_2_th_20_Template, 2, 0, "th", 40)(21, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_21_Template, 4, 1, "td", 31);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275elementContainerStart(22, 41);
    \u0275\u0275template(23, OcrlistComponent_For_13_Conditional_5_Conditional_2_td_23_Template, 20, 2, "td", 31);
    \u0275\u0275elementContainerEnd();
    \u0275\u0275template(24, OcrlistComponent_For_13_Conditional_5_Conditional_2_tr_24_Template, 1, 0, "tr", 42)(25, OcrlistComponent_For_13_Conditional_5_Conditional_2_tr_25_Template, 1, 2, "tr", 43)(26, OcrlistComponent_For_13_Conditional_5_Conditional_2_tr_26_Template, 1, 0, "tr", 44);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275property("dataSource", x_r3.filelist);
    \u0275\u0275advance(24);
    \u0275\u0275property("matHeaderRowDef", ctx_r3.columnsToDisplayWithExpand)("matHeaderRowDefSticky", true);
    \u0275\u0275advance();
    \u0275\u0275property("matRowDefColumns", ctx_r3.columnsToDisplayWithExpand);
    \u0275\u0275advance();
    \u0275\u0275property("matRowDefColumns", \u0275\u0275pureFunction0(5, _c1));
  }
}
function OcrlistComponent_For_13_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275template(1, OcrlistComponent_For_13_Conditional_5_Conditional_1_Template, 11, 1, "div", 15)(2, OcrlistComponent_For_13_Conditional_5_Conditional_2_Template, 27, 6);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275conditional(1, x_r3.loading ? 1 : 2);
  }
}
function OcrlistComponent_For_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "div", 12);
    \u0275\u0275listener("click", function OcrlistComponent_For_13_Template_div_click_1_listener() {
      const x_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.getOcrUploadlist(x_r3));
    });
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "icon", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, OcrlistComponent_For_13_Conditional_5_Template, 3, 1, "div", 14);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classMap(x_r3.expand ? "bg-white text-gray-600 rounded-b-none" : "text-white bg-black/25");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", x_r3.cCasename, " ", x_r3.cCaseno, " ");
    \u0275\u0275advance();
    \u0275\u0275classMap(!x_r3.expand ? "-rotate-90" : "rotate-0");
    \u0275\u0275advance();
    \u0275\u0275conditional(5, x_r3.expand ? 5 : -1);
  }
}
function OcrlistComponent_ForEmpty_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "empty", 11);
  }
}
var OcrlistComponent = class _OcrlistComponent {
  constructor(orcqueueS, upld, ss, cdr) {
    this.orcqueueS = orcqueueS;
    this.upld = upld;
    this.ss = ss;
    this.cdr = cdr;
    this.caselist = [];
    this.uselist = [];
    this.columnsToDisplay = ["cn", "un", "fn", "s", "st", "te"];
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay, "expand"];
    this.nUserid = null;
    this.nCaseid = null;
    this.socketSubscription = this.ss.getUploades().subscribe((res) => __async(this, null, function* () {
      let filelist;
      let cStatus = "";
      if (res && res.event && ["OCR-START", "OCR-PROGRESS", "OCR-SUCCESS", "OCR-ERROR"].includes(res.event)) {
        loop1:
          for (let e of this.caselist) {
            for (let f of e.filelist) {
              if (f.nUDid == res.data.nUDid) {
                filelist = f;
                break loop1;
              }
            }
          }
        cStatus = res.event == "OCR-START" ? "OI" : res.event == "OCR-PROGRESS" ? "OP" : res.event == "OCR-SUCCESS" ? "OS" : res.event == "OCR-ERROR" ? "OF" : "";
      }
      if (filelist) {
        if (cStatus == "OS" || cStatus == "OF" || cStatus == "OI") {
          if (filelist && filelist.ocrFiles && filelist.ocrFiles.length > 0) {
            filelist.ocrFiles.map((a) => {
              if (a.id == parseInt(res.data.id)) {
                a.cStatus = cStatus == "OI" ? "P" : cStatus == "OS" ? "C" : "F";
                a.message = null;
                if (cStatus == "OS") {
                  filelist.nCompleted++;
                  filelist.nOProgress--;
                }
                if (cStatus == "OI") {
                  filelist.nOProgress++;
                }
                if (cStatus == "OF") {
                  filelist.nFailed++;
                  filelist.nOProgress--;
                }
              }
            });
          }
        }
        if (cStatus == "OP") {
          if (filelist && filelist.ocrFiles && filelist.ocrFiles.length > 0) {
            filelist.ocrFiles.map((a) => {
              if (a.id == parseInt(res.data.id)) {
                a.message = res.data.message ? res.data.message : null;
              }
            });
          }
        }
      }
    }));
  }
  ngOnInit() {
    this.getOcrList();
  }
  getOcrList() {
    return __async(this, null, function* () {
      let res = yield this.orcqueueS.get_ocrlist(this.nCaseid, this.nUserid);
      if (res.length) {
        this.caselist = res[0];
        this.uselist = res[1];
      }
    });
  }
  getOcrUploadlist(row) {
    return __async(this, null, function* () {
      debugger;
      if (row.expand) {
        row.expand = !row.expand;
        return;
      }
      ;
      row.expand = !row.expand;
      row.loading = true;
      let res = yield this.orcqueueS.get_ocrFilelist(row.nCaseid, this.nUserid);
      row.loading = false;
      if (res.length) {
        row.filelist = res;
      } else {
        row.filelist = [];
      }
    });
  }
  getOCRFiles(element) {
    if (this.expandedElement != element) {
      this.orcqueueS.getFileData(element.nUDid, element);
    }
  }
  getTime(row) {
    const now = row.dStartDt ? new Date(row.dStartDt) : null;
    if (!now) {
      return "";
    } else {
      let endDt = row.dEndDt;
      const oneDayAgo = endDt ? new Date(endDt) : /* @__PURE__ */ new Date();
      const diffMilliseconds = oneDayAgo - now;
      const diffSeconds = Math.floor(diffMilliseconds / 1e3);
      const totalMinutes = Math.floor(diffSeconds / 60);
      const totalSeconds = diffSeconds % 60;
      return `${totalMinutes} minute ${totalSeconds} second`;
    }
  }
  static {
    this.\u0275fac = function OcrlistComponent_Factory(t) {
      return new (t || _OcrlistComponent)(\u0275\u0275directiveInject(OcrqueueService), \u0275\u0275directiveInject(UploadService), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _OcrlistComponent, selectors: [["app-ocrlist"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 15, vars: 1, consts: [[1, "h-full", "p-10", "overflow-auto", "bg-blue-deactivate"], [1, "h-full", "bg-dark-blue", "!p-5", "rounded-xl", "flex", "flex-col"], [1, "flex", "items-center", "text-blue-hover"], [1, "text-[18px]"], [1, "flex", "items-center", "gap-2", "ms-auto"], [1, "w-40", "bg-white"], ["placeholder", "Select.."], [3, "value"], [1, "my-5", "border-gray-400", "opacity-75"], [1, "h-full", "overflow-auto"], [1, "border", "border-white/50", "mb-3", "rounded-lg", "overflow-hidden", "max-h-[400px]", "min-h-11"], ["head", "No OCR in process", "addcls", "bg-white/10", 1, "block", "h-full"], [1, "flex", "items-center", "p-2", "px-3", "text-xs", "cursor-pointer", "min-h-11", 3, "click"], ["name", "chvx", 1, "text-xxs", "ms-auto"], [1, "relative", "flex", "flex-col", "w-full", "max-h-[400px]", "overflow-auto", "text-gray-700", "bg-white", "upload-table"], [1, "bg-white", "h-fit"], [1, "border-b", "flex", "items-center", "h-10", "mb-1", "[&>*]:border-x", "[&>*]:border-white"], [1, "w-16", "bg-gray-200", "animate-pulse", "h-11"], [1, "w-full", "bg-gray-200", "animate-pulse", "h-11"], [1, "w-32", "bg-gray-200", "animate-pulse", "h-11", "ms-auto"], [1, "w-32", "bg-gray-200", "animate-pulse", "h-11"], [1, "flex", "items-center", "h-10", "gap-3", "px-5", "mb-1", "border-b"], [1, "border-b", "flex", "items-center", "h-12", "mb-1", "[&>*]:border-x", "[&>*]:border-white"], [1, "w-full", "h-full", "bg-gray-200", "animate-pulse"], [1, "w-3", "h-3", "bg-gray-200", "animate-pulse"], [1, "h-3", "bg-gray-200", "animate-pulse", "w-52"], [1, "w-32", "h-3", "bg-gray-200", "animate-pulse", "ms-auto"], [1, "w-32", "h-3", "bg-gray-200", "animate-pulse"], ["mat-table", "", "multiTemplateDataRows", "", 1, "mat-elevation-z8", 3, "dataSource"], ["matColumnDef", "cn"], ["mat-header-cell", "", 4, "matHeaderCellDef"], ["mat-cell", "", 4, "matCellDef"], ["matColumnDef", "un"], ["matColumnDef", "fn"], ["width", "15%", "mat-header-cell", "", 4, "matHeaderCellDef"], ["width", "15%", "class", "max-w-[5%]", "style", "max-width: 5%;", "mat-cell", "", 4, "matCellDef"], ["matColumnDef", "s"], ["matColumnDef", "st"], ["matColumnDef", "te"], ["matColumnDef", "expand"], ["mat-header-cell", "", "aria-label", "row actions", 4, "matHeaderCellDef"], ["matColumnDef", "expandedDetail"], ["class", "!bg-blue-hover", "mat-header-row", "", 4, "matHeaderRowDef", "matHeaderRowDefSticky"], ["mat-row", "", "class", "example-element-row", 3, "example-expanded-row", "click", 4, "matRowDef", "matRowDefColumns"], ["mat-row", "", "class", "example-detail-row", 4, "matRowDef", "matRowDefColumns"], ["mat-header-cell", ""], ["mat-cell", ""], [1, "block", "truncate"], ["width", "15%", "mat-header-cell", ""], ["width", "15%", "mat-cell", "", 1, "max-w-[5%]", 2, "max-width", "5%"], [1, "block", "w-full", "truncate", "max-w-[200px]"], [1, "flex", "text-xs", "font-semibold", "text-grey"], [1, "mx-1", "opacity-40"], [1, "flex", "items-center", "gap-3", "whitespace-nowrap"], [1, "flex", "items-center", "gap-1", "cursor-pointer", "text-blue-on", "hover:underline"], [1, "flex", "items-center", "gap-1", "font-normal"], ["src", "assets/icons/checkgreen.svg"], [1, "flex", "items-center", "gap-1", "cursor-pointer", "text-blue-on", "hover:underline", 3, "click"], [1, "loader"], ["mat-header-cell", "", "aria-label", "row actions"], ["mat-icon-button", "", "aria-label", "expand row", 1, "w-full", "text-center", 3, "click"], ["name", "chvx"], ["name", "chvy", 1, "block", "rotate-180"], [1, "example-element-detail", "bg-faint"], [1, "w-full", "text-left", "table-auto", "min-w-max"], [1, "bg-reply"], [1, "p-2", "border-b", "border-blue-gray-100", "bg-blue-gray-50"], [1, "block", "font-sans", "text-xs", "antialiased", "font-normal", "leading-none", "opacity-70"], [1, "border-b", "even:bg-blue-gray-50/50", "last:border-b-0"], [1, "p-2"], [1, "block", "font-sans", "text-xs", "antialiased", "font-normal", "leading-normal"], ["href", "#", 1, "block", "font-sans", "text-xs", "antialiased", "font-medium", "leading-normal"], ["mat-header-row", "", 1, "!bg-blue-hover"], ["mat-row", "", 1, "example-element-row", 3, "click"], ["mat-row", "", 1, "example-detail-row"]], template: function OcrlistComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "span", 3);
        \u0275\u0275text(4, "OCR Progress ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "div", 4)(6, "mat-form-field", 5)(7, "mat-select", 6);
        \u0275\u0275repeaterCreate(8, OcrlistComponent_For_9_Template, 2, 3, "mat-option", 7, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275element(10, "hr", 8);
        \u0275\u0275elementStart(11, "div", 9);
        \u0275\u0275repeaterCreate(12, OcrlistComponent_For_13_Template, 6, 7, "div", 10, \u0275\u0275repeaterTrackByIndex, false, OcrlistComponent_ForEmpty_14_Template, 1, 0, "empty", 11);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(8);
        \u0275\u0275repeater(ctx.uselist);
        \u0275\u0275advance(4);
        \u0275\u0275repeater(ctx.caselist);
      }
    }, dependencies: [CommonModule, DatePipe, IconComponent, MatSelectModule, MatFormField, MatSelect, MatOption, FormsModule, MatTableModule, MatTable, MatHeaderCellDef, MatHeaderRowDef, MatColumnDef, MatCellDef, MatRowDef, MatHeaderCell, MatCell, MatHeaderRow, MatRow, EmptyComponent], styles: ["\n\ntable[_ngcontent-%COMP%] {\n  width: 100%;\n}\ntr.example-detail-row[_ngcontent-%COMP%] {\n  height: 0;\n}\ntr.example-element-row[_ngcontent-%COMP%]:not(.example-expanded-row):hover {\n  background: whitesmoke;\n}\ntr.example-element-row[_ngcontent-%COMP%]:not(.example-expanded-row):active {\n  background: #efefef;\n}\n.example-element-row[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  border-bottom-width: 0;\n}\n.mat-column-expandedDetail[_ngcontent-%COMP%] {\n  padding: 0 !important;\n}\n.example-element-detail[_ngcontent-%COMP%] {\n  overflow: hidden;\n  display: flex;\n}\n.example-element-diagram[_ngcontent-%COMP%] {\n  min-width: 80px;\n  border: 2px solid black;\n  padding: 8px;\n  font-weight: lighter;\n  margin: 8px 0;\n  height: 104px;\n}\n.example-element-symbol[_ngcontent-%COMP%] {\n  font-weight: bold;\n  font-size: 40px;\n  line-height: normal;\n}\n.example-element-description[_ngcontent-%COMP%] {\n  padding: 16px;\n}\n.example-element-description-attribution[_ngcontent-%COMP%] {\n  opacity: 0.5;\n}\ntable[_ngcontent-%COMP%] {\n  --mat-table-header-container-height: 44px;\n  --mat-table-header-headline-size: 12px;\n  --mat-table-row-item-container-height: 44px;\n  --mat-table-row-item-label-text-size: 12px;\n}\nmat-paginator[_ngcontent-%COMP%] {\n  --mat-paginator-container-size: 44px;\n}\n.loader[_ngcontent-%COMP%] {\n  width: 14px;\n  height: 14px;\n  border: 1px solid #ff4800;\n  border-bottom-color: transparent;\n  border-radius: 50%;\n  display: inline-block;\n  box-sizing: border-box;\n  animation: _ngcontent-%COMP%_rotation 1s linear infinite;\n}\n@keyframes _ngcontent-%COMP%_rotation {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n/*# sourceMappingURL=ocrlist.component.css.map */"], data: { animation: [
      trigger("detailExpand", [
        state("collapsed,void", style({ height: "0px", minHeight: "0" })),
        state("expanded", style({ height: "*" })),
        transition("expanded <=> collapsed", animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)"))
      ])
    ] } });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(OcrlistComponent, { className: "OcrlistComponent", filePath: "src\\app\\adminpanel\\components\\upload\\ocrlist\\ocrlist.component.ts", lineNumber: 30 });
})();
export {
  OcrlistComponent
};
//# sourceMappingURL=chunk-RUPQCHOT.js.map
