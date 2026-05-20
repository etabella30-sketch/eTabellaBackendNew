import {
  index
} from "./chunk-55ITPE7H.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  BehaviorSubject,
  InjectionToken,
  Subject,
  __async,
  __spreadProps,
  __spreadValues,
  catchError,
  concatMap,
  finalize,
  firstValueFrom,
  from,
  map,
  retry,
  takeUntil,
  throwError,
  timeout,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/rt/services/marknav/marknav.service.ts
var MarknavService = class _MarknavService {
  constructor(http, toast) {
    this.http = http;
    this.toast = toast;
  }
  getAll(nSesid, nUserid, cSorttype, cSortby, nPageNumber, jFilter, nBundledetailid, historyEnabled, bIsTranscipt) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nUserid", nUserid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("bIsTranscipt", bIsTranscipt);
      if (jFilter) {
        params = params.set("jFilter", JSON.stringify(jFilter));
      }
      if (historyEnabled) {
        params = params.set("historyEnabled", historyEnabled);
      }
      if (nSesid) {
        params = params.set("nSesid", nSesid);
      } else {
        params = params.set("nBundledetailid", nBundledetailid);
      }
      let apiAlias = `${environment.cloudUrl2}${environment.realtimeserive}`;
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${apiAlias}/marknav/all`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFactlist(nSesid, nUserid, cSorttype, cSortby, nPageNumber, jFilter, historyEnabled, bIsTranscipt, cType, nBundledetailid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nUserid", nUserid);
        params = params.set("cSorttype", cSorttype);
        params = params.set("cSortby", cSortby);
        params = params.set("nPageNumber", nPageNumber);
        params = params.set("cFType", cType);
        params = params.set("bIsTranscipt", bIsTranscipt);
        if (jFilter) {
          params = params.set("jFilter", JSON.stringify(jFilter));
        }
        if (historyEnabled) {
          params = params.set("historyEnabled", historyEnabled);
        }
        if (nSesid) {
          params = params.set("nSesid", nSesid);
        } else {
          params = params.set("nBundledetailid", nBundledetailid);
        }
        let apiAlias = `${environment.cloudUrl2}${environment.realtimeserive}`;
        let res = [];
        try {
          res = yield firstValueFrom(this.http.get(`${apiAlias}/marknav/factlist`, { params }));
          return res;
        } catch (error) {
          console.error(error);
          res = [];
        }
      } catch (error) {
        console.error(error);
        return { msg: -1, error };
      }
    });
  }
  getCompanylist(nSesid, nUserid, nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nUserid", nUserid);
      if (nSesid) {
        params = params.set("nSesid", nSesid);
      } else {
        params = params.set("nBundledetailid", nBundledetailid);
      }
      let apiAlias = `${environment.cloudUrl2}${environment.realtimeserive}`;
      if (nBundledetailid) {
        apiAlias = `${environment.cloudUrl}${environment.coreservice}`;
      }
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${apiAlias}/marknav/factcompanylist`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        return [];
      }
    });
  }
  getCompanyFactlist(nCompanyid, nSesid, nUserid, cSortby, jFilter, historyEnabled, bIsTranscipt, nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nUserid", nUserid);
      params = params.set("nCompanyid", nCompanyid);
      params = params.set("cSortby", cSortby);
      params = params.set("bIsTranscipt", bIsTranscipt);
      if (jFilter) {
        params = params.set("jFilter", JSON.stringify(jFilter));
      }
      if (historyEnabled) {
        params = params.set("historyEnabled", historyEnabled);
      }
      if (nSesid) {
        params = params.set("nSesid", nSesid);
      } else {
        params = params.set("nBundledetailid", nBundledetailid);
      }
      let apiAlias = `${environment.cloudUrl2}${environment.realtimeserive}`;
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${apiAlias}/marknav/factbycompany`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        res = [];
      }
    });
  }
  getFactlinklist(nSesid, nUserid, cSortby, nPageNumber, jFilter, historyEnabled, bIsTranscipt, nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nUserid", nUserid);
      params = params.set("cSortby", cSortby);
      params = params.set("bIsTranscipt", bIsTranscipt);
      if (jFilter) {
        params = params.set("jFilter", JSON.stringify(jFilter));
      }
      if (historyEnabled) {
        params = params.set("historyEnabled", historyEnabled);
      }
      if (nSesid) {
        params = params.set("nSesid", nSesid);
      } else {
        params = params.set("nBundledetailid", nBundledetailid);
      }
      let apiAlias = `${environment.cloudUrl2}${environment.realtimeserive}`;
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${apiAlias}/marknav/factlinklist`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        return [];
      }
    });
  }
  getQuickMarks(nSesid, nUserid, bIsTranscipt, cSorttype, cSortby, nPageNumber, jFilter, historyEnabled, nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nUserid", nUserid);
      params = params.set("cSorttype", cSorttype);
      params = params.set("cSortby", cSortby);
      params = params.set("nPageNumber", nPageNumber);
      params = params.set("bIsTranscipt", bIsTranscipt);
      if (jFilter) {
        params = params.set("jFilter", JSON.stringify(jFilter));
      }
      if (historyEnabled) {
        params = params.set("historyEnabled", historyEnabled);
      }
      if (nSesid) {
        params = params.set("nSesid", nSesid);
      } else {
        params = params.set("nBundledetailid", nBundledetailid);
      }
      let apiAlias = `${environment.cloudUrl2}${environment.realtimeserive}`;
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${apiAlias}/marknav/quickmarklist`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        return [];
      }
    });
  }
  getDocLinkList(nSesid, nUserid, cSortby, jFilter, historyEnabled, bIsTranscipt, nBundledetailid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nUserid", nUserid);
      params = params.set("cSortby", cSortby);
      params = params.set("bIsTranscipt", bIsTranscipt);
      if (jFilter) {
        params = params.set("jFilter", JSON.stringify(jFilter));
      }
      if (historyEnabled) {
        params = params.set("historyEnabled", historyEnabled);
      }
      if (nSesid) {
        params = params.set("nSesid", nSesid);
      } else {
        params = params.set("nBundledetailid", nBundledetailid);
      }
      let apiAlias = `${environment.cloudUrl2}${environment.realtimeserive}`;
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${apiAlias}/marknav/doclinks`, { params }));
        return res[0];
      } catch (error) {
        console.error(error);
        return [];
      }
    });
  }
  historyInsert(history) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/marknav/history/insert`, history));
        if (res.msg != 1) {
          return { msg: -1, error: res.error };
        }
        return res;
      } catch (error) {
        console.error("error", error);
        return { msg: -1, error: error.message };
      }
    });
  }
  historyDelete(history) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nUserid", history.nUserid).set("cType", history.cType).set("cTimeFrame", history.cTimeFrame);
        if (history.nSesid) {
          params = params.set("nSesid", history.nSesid);
        } else {
          params = params.set("nBundledetailid", history.nBundledetailid);
        }
        const res = yield firstValueFrom(this.http.delete(`${environment.cloudUrl2}${environment.realtimeserive}/marknav/history/delete`, { params }));
        if (res.msg != 1) {
          return { msg: -1, error: res.error };
        }
        this.toast.success("History deleted successfully");
        return res;
      } catch (error) {
        console.error("error", error);
        return { msg: -1, error: error.message };
      }
    });
  }
  historyExist(history) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nUserid", history.nUserid).set("cType", history.cType);
        if (history.nSesid) {
          params = params.set("nSesid", history.nSesid);
        } else {
          params = params.set("nBundledetailid", history.nBundledetailid);
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/marknav/history/exist`, { params }));
        if (res.msg != 1) {
          return { msg: -1, error: res.error };
        }
        return res;
      } catch (error) {
        console.error("error", error);
        return { msg: -1, error: error.message };
      }
    });
  }
  getMarknavTeamUsers(nUserid, nBundledetailid, nSesid, cType) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("cType", cType).set("nUserid", nUserid);
      if (nBundledetailid)
        params = params.set("nBundledetailid", nBundledetailid);
      if (nSesid)
        params = params.set("nSesid", nSesid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/marknav/marknavteamusers`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function MarknavService_Factory(t) {
      return new (t || _MarknavService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _MarknavService, factory: _MarknavService.\u0275fac, providedIn: "root" });
  }
};

// src/app/rt/services/annots/annots.service.ts
var AnnotsService = class _AnnotsService {
  applyAnnoptations() {
    const originalCount = this.annotations.length;
    if (originalCount > 0) {
      const sample = this.annotations[0];
      console.log("[AnnotDebug] First raw annotation:", sample);
      console.log("[AnnotDebug] Has jCordinates?", !!sample.jCordinates);
      console.log("[AnnotDebug] jCordinates length:", sample.jCordinates?.length);
    }
    this.annotations = this.annotations.filter((a) => a.jCordinates?.length);
    this.annotations = [...this.annotations];
    console.log(`AnnotsService: applied annotations. Count: ${this.annotations.length} (Original: ${originalCount})`);
  }
  applyqMarks() {
    this.qMarks = [...this.qMarks];
  }
  constructor(http, tost, markNav) {
    this.http = http;
    this.tost = tost;
    this.markNav = markNav;
    this.annotations = [];
    this.annotBox = null;
    this.qMarks = [];
  }
  set(annot) {
    const existsIndex = this.annotations.findIndex((a) => a.id === annot.id);
    if (existsIndex === -1) {
      this.annotations.push(annot);
    } else {
      this.annotations[existsIndex] = annot;
    }
    this.applyAnnoptations();
  }
  setAll(annot) {
    this.annotations = annot;
    this.applyAnnoptations();
  }
  getAll() {
    return this.annotations;
  }
  getTemp() {
    return this.annotations.filter((a) => a.isTemp);
  }
  isHaveTempAnnot() {
    return this.annotations.some((a) => a.isTemp);
  }
  delete(id) {
    this.annotations = this.annotations.filter((a) => a.id !== id);
    this.applyAnnoptations();
  }
  removeTemp() {
    this.annotations = this.annotations.filter((a) => !a.isTemp);
    this.applyAnnoptations();
  }
  clearAll() {
    this.annotations = [];
    this.annotBox = null;
    this.qMarks = [];
    this.applyAnnoptations();
    this.applyqMarks();
  }
  enableAnnotBox(position) {
    try {
      position.y = position.y - 150;
    } catch (error) {
      console.error(error);
    }
    this.annotBox = position;
  }
  setqMark(qMark) {
    const existsIndex = this.qMarks.findIndex((a) => a.nHid === qMark.nHid);
    if (existsIndex === -1) {
      this.qMarks.push(qMark);
    } else {
      this.qMarks[existsIndex] = qMark;
    }
    this.applyqMarks();
  }
  setqMarkAll(qMarks) {
    this.qMarks = qMarks;
    this.applyqMarks();
  }
  getqMarkAll() {
    return this.qMarks;
  }
  deleteqMark(nHid) {
    this.qMarks = this.qMarks.filter((a) => a.nHid !== nHid);
    this.applyqMarks();
  }
  disableAnnotBox() {
    this.annotBox = null;
  }
  isBoxEnabled() {
    return this.annotBox !== null;
  }
  fetchAnnotations(nSesid, nUserid, isTrans) {
    return __async(this, null, function* () {
      try {
        console.log("[AnnotDebug] fetchAnnotations called with:", { nSesid, nUserid, isTrans });
        const params = new HttpParams().set("nSessionid", nSesid).set("nUserid", nUserid).set("bTranscript", String(isTrans));
        const [res, doclinks] = yield Promise.all([
          firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/feed/annotations`, { params })),
          this.markNav.getDocLinkList(nSesid, nUserid, "P", null, false, isTrans).catch(() => [])
        ]);
        const annots = [];
        console.log("fetchAnnotations: Response from server:", res);
        if (res[0]?.length) {
          console.log("[AnnotDebug] Fact coord summary:", res[0].map((a) => ({
            id: a.id?.slice(0, 8),
            cType: a.cType,
            color: a.color,
            firstL: a.jCordinates?.[0]?.l,
            firstP: a.jCordinates?.[0]?.p,
            firstT: a.jCordinates?.[0]?.t,
            lastL: a.jCordinates?.[a.jCordinates.length - 1]?.l,
            lastP: a.jCordinates?.[a.jCordinates.length - 1]?.p
          })));
          annots.push(...res[0]);
        }
        if (res[1]?.length) {
          this.setqMarkAll(res[1]);
        }
        if (res[2]?.length) {
          annots.push(...res[2]);
        } else if (doclinks?.length) {
          const mapped = doclinks.filter((d) => d?.jCordinates?.length).map((d) => ({
            id: d.nDocid,
            cType: "D",
            jCordinates: d.jCordinates,
            color: d.color || d.cColor,
            nLine: d.nLine,
            nPage: d.nPage,
            nColorid: d.nColorid
          }));
          if (mapped.length)
            annots.push(...mapped);
        }
        if (annots.length) {
          this.setAll(annots);
        }
      } catch (error) {
        const msg = ErrorHandlerUtil.getErrorMessage(error);
        this.tost.error(msg && msg !== "Unknown error" ? msg : "Failed to fetch annotations");
      }
    });
  }
  static {
    this.\u0275fac = function AnnotsService_Factory(t) {
      return new (t || _AnnotsService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService), \u0275\u0275inject(MarknavService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AnnotsService, factory: _AnnotsService.\u0275fac });
  }
};

// src/app/rt/services/feed-display/annot.transfer.service.ts
var annotTrasnferService = class _annotTrasnferService {
  constructor(annotService, secureStore) {
    this.annotService = annotService;
    this.secureStore = secureStore;
  }
  handleAnnotTrasnfer(res) {
    return __async(this, null, function* () {
      try {
        const nUserid = yield this.secureStore.getUserId();
        const { cType, data } = res;
        if (!data || !data?.length) {
          console.error("No data received on refresh", res);
          return;
        }
        if (cType == "H") {
          const highlightRefreshData = data;
          const highlights = this.annotService.getqMarkAll();
          let updateRequired = false;
          for (let x of highlightRefreshData) {
            if (nUserid == x.nUserid) {
              const obj = highlights.find((a) => a.nHid == x.nHid);
              if (obj) {
                updateRequired = true;
                obj.cPageno = Number(x.cPageno);
                obj.cLineno = Number(x.cLineno);
                obj.identity = String(x.identity);
                obj.cTime = x.cTime;
              }
            }
          }
          if (updateRequired) {
            this.annotService.setqMarkAll(highlights);
          }
        } else {
          const annotRefreshData = data;
          const annotations = this.annotService.getAll();
          let updateRequired = false;
          for (let x of annotRefreshData) {
            if (nUserid == x.nUserid) {
              const obj = annotations.find((a) => a.id == x.nId);
              if (obj) {
                updateRequired = true;
                obj.jCordinates = x.jCordinates;
              }
            }
          }
          if (updateRequired) {
            this.annotService.setAll(annotations);
          }
        }
      } catch (error) {
        console.error("Error during Transfer", error, res);
      }
    });
  }
  static {
    this.\u0275fac = function annotTrasnferService_Factory(t) {
      return new (t || _annotTrasnferService)(\u0275\u0275inject(AnnotsService), \u0275\u0275inject(SecureStorageService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _annotTrasnferService, factory: _annotTrasnferService.\u0275fac });
  }
};

// src/app/rt/services/realtime/realtime.service.ts
var RealtimeService = class _RealtimeService {
  constructor(http) {
    this.http = http;
  }
  getActiveSession(nCaseid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/session/activesession`, { params }));
        if (res.msg == 1) {
          return res.nSesid;
        } else {
          return null;
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    });
  }
  getSessionDetail(nSesid, nUserid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nSesid", nSesid).set("nUserid", nUserid);
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/session/activesession/detail`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        return null;
      }
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
  getCaseDetail(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/case/casedetail`, { params }));
        return res;
      } catch (err) {
        console.error(`Failed to get case detail: ${ErrorHandlerUtil.getErrorMessage(err)}`);
        return null;
      }
    });
  }
  static {
    this.\u0275fac = function RealtimeService_Factory(t) {
      return new (t || _RealtimeService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RealtimeService, factory: _RealtimeService.\u0275fac, providedIn: "root" });
  }
};

// src/app/rt/services/feed-display/refresh-handler.ts
var refreshHandler = class {
  constructor(feedUtility) {
    this.feedUtility = feedUtility;
    this.enableRefresh = () => {
      try {
        clearTimeout(this.refreshTimeout);
      } catch (error) {
      }
      this.refreshingEnalbed = true;
    };
    this.disableRefresh = () => {
      try {
        clearTimeout(this.refreshTimeout);
      } catch (error) {
      }
      this.refreshTimeout = setTimeout(() => {
        this.refreshingEnalbed = false;
      }, 400);
    };
  }
  getFeedSubject() {
    return null;
  }
  getActiveFeedSubject() {
    return null;
  }
  getSessionLines() {
    return null;
  }
  appendRefreshFeed(res) {
    return __async(this, null, function* () {
      this.enableRefresh();
      try {
        const lines = this.getSessionLines();
        const { start, end, newLines } = res;
        const feedSubject = this.getFeedSubject();
        const currentArray = feedSubject.getValue();
        const newData = [];
        if (currentArray.length) {
          const flatData = this.feedUtility.sortArray(currentArray.map((a) => a.data).flat());
          newData.push(...this.feedUtility.removeTimestampsInRange(flatData, [start, end]));
        }
        if (newLines?.length) {
          const parsedData = this.feedUtility.parseFeedLineData(newLines);
          if (parsedData?.length) {
            newData.push(...parsedData);
          }
        }
        const finalData = this.feedUtility.sortArray(newData).filter((a) => a?.time);
        const totalPagges = Math.floor(finalData.length / lines) + 1;
        for (let i = 0; totalPagges > i; i++) {
          if (!currentArray[i]) {
            currentArray[i] = this.feedUtility.blankPage(i + 1);
          }
          currentArray[i]["data"] = finalData.slice(i * 25, (i + 1) * 25);
          this.feedUtility.mapBlankLines(currentArray[i]);
        }
        feedSubject.next([...currentArray]);
        yield this.refreshActiveFeed();
      } catch (error) {
        console.error(error);
      }
      this.disableRefresh();
    });
  }
  refreshActiveFeed() {
    return __async(this, null, function* () {
      const activeFeedSubject = this.getActiveFeedSubject();
      const activeData = activeFeedSubject.getValue();
      const totalLines = activeData?.length;
      if (totalLines > 0) {
        const feedDataSubject = this.getFeedSubject();
        const feedData = feedDataSubject.getValue();
        if (feedData?.length) {
          const { page, data } = feedData[feedData.length - 1];
          const lastData = data.slice(-totalLines);
          activeFeedSubject.next(lastData.map((item) => __spreadValues({}, item)));
        }
      }
    });
  }
};

// src/app/rt/services/feed-display/page-fetch.service.ts
var PAGE_BATCH_SIZE = new InjectionToken("PAGE_BATCH_SIZE");
var PageFetchService = class extends refreshHandler {
  emit(type, data) {
    this._events.next({ type, data });
  }
  constructor(http, defaultBatchSize = 5, feedUtility) {
    super(feedUtility);
    this.http = http;
    this.defaultBatchSize = defaultBatchSize;
    this.feedUtility = feedUtility;
    this._isFetching$ = new BehaviorSubject(false);
    this.isFetching$ = this._isFetching$.asObservable();
    this.url = environment.name == "localdocker" ? environment.realtimelocal : `${environment.cloudUrl2}${environment.realtimeserive}`;
    this.stop$ = new Subject();
    this._events = new Subject();
    this.events$ = this._events.asObservable();
  }
  fetchTotalPages(nSesid) {
    return __async(this, null, function* () {
      const res = yield this.fetchTotalPage(nSesid);
      if (res.msg == -1) {
        console.error(res.error || `Failed to fectch total pages of session ${nSesid}`);
      }
      return res?.total || 0;
    });
  }
  startFetching(nSesid, isTrans, totalPages, opts = {}) {
    const batchSize = opts.batchSize ?? this.defaultBatchSize ?? 5;
    const descending = opts.descending ?? true;
    const endpoint = "/feed/pages/data";
    const abortOnError = opts.abortOnError ?? true;
    this.cancel(true);
    const start = isTrans ? 1 : totalPages;
    const end = 1;
    const batches = this.buildBatches(start, end, batchSize, descending);
    this._isFetching$.next(true);
    return from(batches).pipe(takeUntil(this.stop$), concatMap((ids, index2) => this.fetchBatch(nSesid, isTrans, endpoint, ids).pipe(takeUntil(this.stop$), map((batch) => ({
      response: batch,
      isFirst: index2 === 0,
      isLast: index2 === batches.length - 1
    })), catchError((err) => {
      if (abortOnError)
        return throwError(() => err);
      console.warn("Batch failed, continuing:", ids, err);
      return from([{
        response: { total: 0, feed: [] },
        //[] as feedPage[],
        isFirst: index2 === 0,
        isLast: index2 === batches.length - 1
      }]);
    }))), finalize(() => this._isFetching$.next(false)));
  }
  cancel(silent = false) {
    if (!this.stop$.closed) {
      this.stop$.next();
      this.stop$.complete();
    }
    this.stop$ = new Subject();
    if (!silent)
      this._isFetching$.next(false);
  }
  // ---- helpers -------------------------------------------------------------
  fetchBatch(nSesid, isTrans, endpoint, ids) {
    const params = new HttpParams().set("nSesid", nSesid).set("pages", JSON.stringify(ids)).set("bTranscript", isTrans ? "true" : "false");
    const fullUrl = `${this.url}${endpoint}`;
    return this.http.get(fullUrl, { params }).pipe(
      timeout(1e4),
      // Timeout after 10 seconds
      retry({ count: 3, delay: 1e3 }),
      // Retry 3 times with 1s delay
      map((res) => {
        return res;
      }),
      catchError((err) => {
        console.error("API_FETCH: Error", err);
        throw err;
      })
    );
  }
  fetchTotalPage(nSesid, retries = 3) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nSesid", nSesid);
        const res = yield firstValueFrom(this.http.get(`${this.url}/feed/pages/total`, { params }));
        if (res?.msg === -1 && retries > 0) {
          yield new Promise((resolve) => setTimeout(resolve, 500));
          return this.fetchTotalPage(nSesid, retries - 1);
        }
        return res;
      } catch (error) {
        if (retries > 0) {
          yield new Promise((resolve) => setTimeout(resolve, 500));
          return this.fetchTotalPage(nSesid, retries - 1);
        }
        return { msg: -1, total: 0, error };
      }
    });
  }
  buildBatches(start, end, size, descending) {
    if (descending && start < end)
      [start, end] = [end, start];
    if (!descending && start > end)
      [start, end] = [end, start];
    const ids = [];
    if (descending)
      for (let i = start; i >= end; i--)
        ids.push(i);
    else
      for (let i = start; i <= end; i++)
        ids.push(i);
    const out = [];
    for (let i = 0; i < ids.length; i += size)
      out.push(ids.slice(i, i + size));
    return out;
  }
};

// src/app/rt/services/feed-utility/feed-utility.service.ts
var FeedUtilityService = class _FeedUtilityService {
  convertAsciiToVisibleString(asciiArray) {
    try {
      if (!Array.isArray(asciiArray))
        return "";
      return asciiArray.map((code) => {
        try {
          if (code === 17)
            return "&emsp;";
          return String.fromCharCode(code ?? 0);
        } catch {
          return "";
        }
      }).join("");
    } catch {
      return "";
    }
  }
  parseFeedLineData(rowData) {
    try {
      if (!Array.isArray(rowData))
        return [];
      return rowData.filter((e) => e).map((item) => {
        try {
          const asciiArr = Array.isArray(item?.[1]) ? item[1] : [];
          return {
            time: item?.[0] ?? "00:00:00:00",
            // asciiValue: asciiArr,
            lines: [this.convertAsciiToVisibleString(asciiArr)],
            lineIndex: item?.[2] ?? 0,
            formate: item?.[3] ?? "FL",
            oPage: item?.[4] ?? 0,
            oLine: item?.[5] ?? 0,
            unicid: String(item?.[6] ?? "0"),
            links: Array.isArray(item?.[7]) ? item[7] : []
          };
        } catch {
          return this.blankLine();
        }
      }).filter((a) => a.lineIndex > -1);
    } catch {
      return [];
    }
  }
  timeToFram(timestamp, isWithFram) {
    if (!timestamp)
      return "";
    const [hours, minutes, seconds, frames] = timestamp.split(":").map(Number);
    return (hours * 3600 + minutes * 60 + seconds) * 30 + (isWithFram ? frames : 0);
  }
  blankLine() {
    return {
      time: "00:00:00:00",
      // asciiValue: [],
      lines: [""],
      lineIndex: 0,
      formate: "FL",
      oPage: 0,
      oLine: 0,
      unicid: "0",
      links: []
    };
  }
  blankPage(page) {
    return {
      page,
      msg: page,
      data: []
    };
  }
  sortArray(array) {
    return array.sort((a, b) => {
      const frameA = this.timeToFram(a?.time, true);
      const frameB = this.timeToFram(b?.time, true);
      if (frameA !== frameB)
        return frameA - frameB;
      const valA2 = a?.unicid ?? 0;
      const valB2 = b?.unicid ?? 0;
      if (valA2 !== valB2)
        return valA2 - valB2;
      return 0;
    });
  }
  removeTimestampsInRange(timestamps, range) {
    const [startRange, endRange] = range.map((a) => a = this.timeToFram(a, true));
    const sInd = timestamps.findIndex(({ time }) => {
      const currentFrame = this.timeToFram(time, true);
      return currentFrame >= startRange && currentFrame <= endRange;
    });
    const lInd = timestamps.findLastIndex(({ time }) => {
      const currentFrame = this.timeToFram(time, true);
      return currentFrame >= startRange && currentFrame <= endRange;
    });
    return timestamps.filter(({ time }, index2) => {
      const currentFrame = this.timeToFram(time, true);
      let isInRange = currentFrame >= startRange && currentFrame <= endRange;
      if (lInd != sInd && lInd == index2 && currentFrame == endRange) {
        isInRange = false;
      }
      if (lInd - sInd + 1 > 2 && sInd == index2 && currentFrame == startRange) {
        try {
          const nextData = timestamps[index2 + 1];
          if (nextData) {
            const nextTimeRange = this.timeToFram(nextData?.time, true);
            if (nextTimeRange == startRange) {
              isInRange = false;
            }
          }
        } catch (error) {
        }
      }
      return !isInRange;
    });
  }
  mapBlankLines(page) {
    const blankline = this.blankLine();
    page.data = Array.from(page.data, (item, index2) => item === void 0 ? __spreadProps(__spreadValues({}, blankline), {
      lineIndex: index2
    }) : item);
  }
  /* mapBlankLines(page: feeds) {
     page.data = page.data.filter(item => item !== undefined);
   }*/
  /** Consistent screen coordinates for any element */
  getScreenCoords(el) {
    const rect = el.getBoundingClientRect();
    const viewportX = rect.left;
    const viewportY = rect.top;
    const screenX = viewportX + (window.screenX ?? window.screenLeft ?? 0) + (window.visualViewport?.offsetLeft ?? 0);
    const screenY = viewportY + (window.screenY ?? window.screenTop ?? 0) + (window.visualViewport?.offsetTop ?? 0);
    return { x: screenX, y: screenY };
  }
  static {
    this.\u0275fac = function FeedUtilityService_Factory(t) {
      return new (t || _FeedUtilityService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FeedUtilityService, factory: _FeedUtilityService.\u0275fac, providedIn: "root" });
  }
};

// src/app/rt/services/feed-display/feed-display.service.ts
var FeedDisplayService = class _FeedDisplayService extends PageFetchService {
  constructor(http, socketService, feedUtility, tost, annot, annotTransfer, realtimeService, communicationService, store) {
    super(http, 5, feedUtility);
    this.socketService = socketService;
    this.feedUtility = feedUtility;
    this.tost = tost;
    this.annot = annot;
    this.annotTransfer = annotTransfer;
    this.realtimeService = realtimeService;
    this.communicationService = communicationService;
    this.store = store;
    this.feedDataSubject = new BehaviorSubject([]);
    this.feedData$ = this.feedDataSubject.asObservable();
    this.activeFeedSubject = new BehaviorSubject([]);
    this.activeFeedData$ = this.activeFeedSubject.asObservable();
    this.lineHeight = 24;
    this.isBolad = false;
    this.pausedState = false;
    this.demoInterval = null;
    this.demoLineCounter = 0;
    this.demoStopped = false;
    this.TYPING_SPEED_BASE = 30;
    this.TYPING_SPEED_VARIATION = 30;
    this.LINE_PAUSE_DELAY = 200;
    this.isLocal = environment.name == "localdocker";
    this.demoStream = false;
    this.queue = index.queue((task, callback) => __async(this, null, function* () {
      try {
        yield task();
      } catch (error) {
      }
      callback();
    }), 1);
  }
  getFeedSubject() {
    return this.feedDataSubject;
  }
  getActiveFeedSubject() {
    return this.activeFeedSubject;
  }
  getSessionLines() {
    return this.sessionDetail?.nLines || 25;
  }
  joinRoom() {
    if (!this.sessionDetail?.nSesid)
      return;
    this.socketService.joinRealtime(this.sessionDetail.nSesid);
  }
  joinDemoRoom(nDemoid) {
    this.socketService.joinDemoRoom(nDemoid);
  }
  leaveRoom() {
    if (!this.sessionDetail?.nSesid)
      return;
    this.socketService.leaveRealtime(this.sessionDetail.nSesid);
  }
  initiliazeListeners() {
    this.clearAllListeners();
  }
  pauseEvent() {
    if (this.pausedState)
      return;
    this.emit("FEED-SUBJECT-REINITILIZE");
    this.pausedState = true;
    this.emit("FEED-PAUSED");
  }
  resumePause() {
    if (!this.pausedState)
      return;
    this.appendActiveFeedToLive();
    this.pausedState = false;
    this.emit("SCROLL-TO-LAST");
    this.emit("FEED-RESUMED");
  }
  feedListeners() {
    this.subscribe_livefeed = this.socketService.getMessagesR().subscribe((res) => {
      this.queue.push(() => __async(this, null, function* () {
        yield this.appendLiveFeed(res);
      }));
    });
    this.subscribe_refreshfeed = this.socketService.getFeedRefreshData().subscribe((res) => {
      this.queue.push(() => __async(this, null, function* () {
        yield this.appendRefreshFeed(res);
      }));
    });
    this.socketService.getPrevious().subscribe((res) => {
      this.queue.push(() => __async(this, null, function* () {
        yield this.addPreviousFeedData(res);
      }));
    });
    this.subscribe_transferannot = this.socketService.getAnnotsRefreshTransfer().subscribe((res) => {
      this.queue.push(() => __async(this, null, function* () {
        yield this.annotTransfer.handleAnnotTrasnfer(res);
      }));
    });
    this.socketService.getRealtimeEvents().subscribe((res) => {
      if (res.type == "SD") {
        this.communicationService.callFunction({ event: "REFRESH-SESSION-V2" });
      }
    });
    this.subscribe_reconnect = this.socketService.getRealtimeReconnect().subscribe(() => __async(this, null, function* () {
      if (!this.sessionDetail?.nSesid)
        return;
      try {
        const nUserid = yield this.store.getUserId();
        console.log("feed-display: realtime reconnect \u2192 refetching current feed for", this.sessionDetail.nSesid);
        this.loadFeed(nUserid);
      } catch (e) {
        console.error("feed-display: reconnect refetch failed", e);
      }
    }));
  }
  getDataSocket(nUserid) {
    this.sessionDetail && this.sessionDetail.nSesid && this.socketService.sendMessageR("fetch-data", { nSesid: this.sessionDetail.nSesid, nUserid, nCaseid: this.sessionDetail.nCaseid, tab: 1 });
  }
  addPreviousFeedData(res) {
    return __async(this, null, function* () {
      try {
        if (res.nSesid != this.sessionDetail?.nSesid) {
          return false;
        }
        let feeddata = this.feedDataSubject.getValue();
        let parsedData;
        try {
          parsedData = JSON.parse(res.data);
        } catch (error) {
          console.error(error, parsedData, res);
          return false;
        }
        if (!parsedData?.length) {
          if (res.page == feeddata?.length) {
            feeddata.pop();
            this.feedDataSubject.next(feeddata.slice());
          }
          return false;
        }
        let formattedData;
        try {
          formattedData = parsedData.filter((e) => e).map((item) => {
            return {
              time: item[0] || "00:00:00:00",
              asciiValue: item[1] || [],
              lines: [this.feedUtility.convertAsciiToVisibleString(item[1] || [])],
              lineIndex: item[2] || 0,
              formate: item[3] || "FL",
              oPage: item[4] || 0,
              oLine: item[5] || 0,
              unicid: item[6] || 0,
              links: item[7] || []
            };
          });
        } catch (error) {
          console.error(error);
        }
        if (!formattedData || !formattedData.length)
          return false;
        let objs = feeddata.find((e) => e && e?.page == res.page);
        let annots = [], hyperlinks = [];
        let data = {
          msg: res.msg,
          page: res.page,
          data: formattedData,
          annotations: annots,
          hyperlinks,
          hyperlinksicons: []
        };
        if (!objs) {
          if (!feeddata[res.page - 1]) {
            feeddata[res.page - 1] = {};
          }
          feeddata[res.page - 1] = data;
        } else {
          objs.data = formattedData;
          objs.annotations = annots;
          objs.hyperlinks = hyperlinks;
        }
        try {
          feeddata = Array.from(feeddata, (item, index2) => item === void 0 ? {
            annotations: [],
            data: [],
            hyperlinks: [],
            hyperlinksicons: [],
            msg: index2 + 1,
            page: index2 + 1
          } : item);
        } catch (error) {
        }
        feeddata.sort((a, b) => a.page - b.page);
        try {
        } catch (error) {
        }
        this.feedDataSubject.next(feeddata.slice());
        if (this.sessionDetail?.cStatus == "R") {
          this.emit("SCROLL-TO-LAST");
        }
      } catch (error) {
      }
      return true;
    });
  }
  sessionDetailUpdate(sessionDetail) {
    this.sessionDetail = sessionDetail;
  }
  totalPages() {
    try {
      const values = this.feedDataSubject.getValue();
      return values?.length || 0;
    } catch (error) {
      console.error(error);
      return 0;
    }
  }
  getActiveFeedData() {
    return this.feedDataSubject.getValue();
  }
  createBlankPages(maxPage) {
    if (maxPage > 0) {
      const array = [];
      for (let i = 1; maxPage >= i; i++) {
        array.push(this.feedUtility.blankPage(i));
      }
      this.feedDataSubject.next(array);
      this.emit("SCROLL-TO-LAST");
    }
  }
  destroyData() {
    this.clearAllListeners();
    this.canclePagesRequest();
    this.wipeOutFeedData();
    this.leaveRoom();
    this.sessionDetail = null;
  }
  canclePagesRequest() {
    try {
      this.cancel(false);
    } catch (error) {
      console.error(error);
    }
    try {
      this.queue.kill();
    } catch (error) {
      console.error(error);
    }
  }
  wipeOutFeedData() {
    this.feedDataSubject.next([]);
  }
  clearAllListeners() {
    try {
      if (this.previousSubscription) {
        this.previousSubscription.unsubscribe();
      }
      if (this.subscribe_livefeed) {
        this.subscribe_livefeed.unsubscribe();
      }
      if (this.subscribe_refreshfeed) {
        this.subscribe_refreshfeed.unsubscribe();
      }
      if (this.subscribe_transferannot) {
        this.subscribe_transferannot.unsubscribe();
      }
      if (this.subscribe_reconnect) {
        this.subscribe_reconnect.unsubscribe();
      }
    } catch (error) {
    }
  }
  /** Kick off batched loading and stream results into feedData$ */
  loadFeed(nUserid, isLive) {
    return __async(this, null, function* () {
      console.log("LOAD_FEED: Starting...");
      this.previousSubscription?.unsubscribe();
      if (this.demoStream) {
        console.log("LOAD_FEED: Aborted (Demo Stream Active)");
        return;
      }
      if (!this.sessionDetail?.nSesid) {
        console.log("LOAD_FEED: Aborted (No Session ID)");
        return;
      }
      this.populateInitialData();
      const sessionIsLive = isLive !== void 0 ? isLive : this.sessionDetail.cStatus == "R";
      if (sessionIsLive) {
        console.log("LOAD_FEED: Live session detected. Requesting data via Socket...");
        this.getDataSocket(nUserid);
        return;
      }
      console.log("LOAD_FEED: Starting fetch subscription...");
      this.previousSubscription = this.startFetching(this.sessionDetail.nSesid, this.sessionDetail.isTrans, this.sessionDetail.maxNumber, {
        batchSize: this.defaultBatchSize,
        descending: true,
        abortOnError: true
      }).subscribe({
        next: ({ response, isFirst, isLast }) => {
          try {
            console.log("LOAD_FEED: Data received. isFirst:", isFirst, "isLast:", isLast);
            const { feed, total } = response;
            if (this.sessionDetail.isTrans) {
              this.appendRealtimeTranscriptData(feed);
            } else {
              if (isFirst) {
                try {
                  const feeds = this.feedDataSubject.getValue();
                  if (!feeds?.length) {
                    this.createBlankPages(total);
                  }
                } catch (error) {
                  console.error(error);
                }
              }
              this.appendPreviousSessionData(feed);
            }
            if (isLast) {
              console.log("LOAD_FEED: All data fetched.");
              this.onAllDataFetched();
            }
          } catch (error) {
            console.error("LOAD_FEED: Error processing data:", error);
          }
        },
        error: (err) => {
          console.error("Feed load error:", err);
          this.emit("FEED-FAILED");
          throw err || "Error while fecthing feed data";
        }
      });
    });
  }
  populateInitialData() {
    try {
      const pageRes = this.sessionDetail.pageRes;
      if (!pageRes)
        return;
      console.log("LOAD_FEED: Checking pageRes...", typeof pageRes);
      let pageData = [];
      let pageNumber = this.sessionDetail.maxNumber;
      if (pageRes.data && Array.isArray(pageRes.data)) {
        pageData = pageRes.data;
        if (pageRes.page)
          pageNumber = pageRes.page;
      } else if (typeof pageRes === "string") {
        try {
          pageData = JSON.parse(pageRes);
        } catch (e) {
          console.error("Failed to parse pageRes string", e);
        }
      } else if (Array.isArray(pageRes)) {
        pageData = pageRes;
      }
      if (pageData && pageData.length > 0) {
        const firstItem = pageData[0];
        if (Array.isArray(firstItem)) {
          console.log("LOAD_FEED: Using raw pageRes data");
          this.appendPreviousSessionData([{
            page: pageNumber,
            data: pageData
          }]);
        } else if (typeof firstItem === "object" && firstItem !== null) {
          console.log("LOAD_FEED: Using parsed pageRes data");
          const feedActiveData = this.feedDataSubject.getValue();
          for (let i = 0; i < pageNumber; i++) {
            if (!feedActiveData[i])
              feedActiveData[i] = this.feedUtility.blankPage(i + 1);
          }
          feedActiveData[pageNumber - 1] = { page: pageNumber, data: pageData, msg: pageNumber };
          this.feedDataSubject.next([...feedActiveData]);
          this.emit("SCROLL-TO-LAST");
        }
      }
    } catch (e) {
      console.error("Error populating initial data", e);
    }
  }
  onAllDataFetched() {
    if (this.sessionDetail?.cProtocol == "C") {
      this.boldQuestionInFeed();
    }
  }
  appendRealtimeTranscriptData(feedData) {
    console.log("APPEND_RT_DATA: Processing", feedData?.length, "pages");
    const pages = [];
    for (let p = 0; p < feedData.length; p++) {
      const page = feedData[p];
      pages.push({ page: page.page, data: page.data, msg: page.page });
    }
    console.log("APPEND_RT_DATA: Emitting", pages.length, "pages to subject");
    this.feedDataSubject.next(pages);
  }
  appendPreviousSessionData(feedData) {
    const feedActiveData = this.feedDataSubject.getValue();
    for (let { page, data } of feedData) {
      const parsedData = this.feedUtility.parseFeedLineData(data);
      if (!parsedData?.length) {
        this.tost.error(`Page ${page} Data Not Found`);
        continue;
      }
      feedActiveData[page - 1] = { page, data: parsedData, msg: page };
    }
    this.feedDataSubject.next([...feedActiveData]);
  }
  boldQuestionInFeed() {
    const feedData = this.feedDataSubject.getValue();
    let isBold = false;
    feedData.forEach((page) => {
      page.data.forEach((line) => {
        if (!line.lines?.[0])
          return;
        const firstLine = line.lines[0].trim().toLowerCase();
        if (firstLine.startsWith("q.")) {
          isBold = true;
          line.isBold = true;
        } else if (firstLine.startsWith("a.")) {
          isBold = false;
          line.isBold = false;
        } else if (isBold) {
          line.isBold = true;
        }
      });
      page.data = [...page.data];
    });
    this.feedDataSubject.next(feedData);
  }
  appendLiveFeed(res) {
    return __async(this, null, function* () {
      console.warn("appendLiveFeed called with:", res);
      if (!this.demoStream && res.date != this.sessionDetail?.nSesid) {
        console.error("incorrect session", res.date);
        return;
      }
      const receivedData = res.d || [];
      const parsedData = this.feedUtility.parseFeedLineData(receivedData);
      if (!parsedData?.length) {
        console.error("No parsed data in live", res);
        return;
      }
      const lineNo = this.getSessionLines();
      const storeData = this.feedDataSubject.getValue();
      let activeFeed = this.activeFeedSubject.getValue();
      for (let [index2, item] of parsedData.entries()) {
        try {
          const pageIndex = Math.floor(item.lineIndex / lineNo);
          const lineIndex = item.lineIndex % lineNo;
          if (this.pausedState) {
            if (pageIndex != this.activeFeedPage) {
              activeFeed = [];
              this.appendActiveFeedToLive();
            }
            const existIndex = activeFeed.findIndex((a) => a.time == item.time && a.unicid == item.unicid);
            if (existIndex == -1) {
              activeFeed.push(item);
            } else {
              activeFeed[existIndex] = item;
            }
            activeFeed = [...activeFeed];
            this.activeFeedPage = pageIndex;
            this.activeFeedSubject.next(activeFeed);
          }
          this.appendToPage(storeData, pageIndex, lineIndex, item);
        } catch (error) {
          console.error("Error in live feed append", error);
        }
      }
      if (this.pausedState) {
        if (activeFeed.length > 6) {
          const tail = activeFeed.slice(-6);
          activeFeed = [...tail];
        }
        this.activeFeedSubject.next(activeFeed);
      }
      this.feedDataSubject.next([...storeData]);
      if (!this.pausedState) {
        this.emit("SCROLL-TO-LAST");
      }
    });
  }
  appendToPage(storeData, pageIndex, lineIndex, item) {
    if (!storeData[pageIndex]) {
      storeData[pageIndex] = this.feedUtility.blankPage(pageIndex + 1);
    }
    const page = storeData[pageIndex];
    page.data[lineIndex] = item;
    page.data = [...page.data];
    this.feedUtility.mapBlankLines(page);
  }
  appendActiveFeedToLive() {
    this.activeFeedPage = null;
    this.activeFeedSubject.next([]);
    const storeData = this.feedDataSubject.getValue();
    this.feedDataSubject.next([...storeData]);
  }
  initilizeDemoMode() {
    this.deIntilizeDemoMode();
    this.feedDataSubject.next([]);
    console.log("Demo Mode Initialized. Waiting for data...");
    this.onSubscription_democurrent = this.socketService.getDemoMessagesR().subscribe((res) => {
      console.log("Demo Data Received via Socket:", res);
      this.queue.push(() => __async(this, null, function* () {
        yield this.appendLiveFeed(res);
      }));
    });
  }
  deIntilizeDemoMode() {
    try {
      if (this.onSubscription_democurrent)
        this.onSubscription_democurrent.unsubscribe();
    } catch (error) {
      console.error("Error unsubscribing demo subscription:", error);
    }
    this.demoLineCounter = 0;
    this.demoInterval = null;
    this.pausedState = false;
    this.feedDataSubject.next([]);
    this.activeFeedSubject.next([]);
    console.log("Demo mode deinitialized, ready to load original session");
  }
  streamDemoData(nSesid, nUserid, nCaseid, nDemoid) {
    return __async(this, null, function* () {
      console.log("streamDemoData: Starting DEMO MODE from JSON file");
      const FilePath = "assets/demo-stream.json";
      console.log("File path:", FilePath);
      this.demoStopped = false;
      try {
        const recData = yield this.http.get(FilePath, { responseType: "text" }).toPromise();
        if (recData) {
          const allData = JSON.parse(recData);
          if (!allData.length) {
            console.warn("No demo data found in file");
            return;
          }
          console.log(`Loaded ${allData.length} pages of demo data`);
          this.demoLineCounter = 0;
          for (let pageIndex = 0; pageIndex < allData.length; pageIndex++) {
            if (this.demoStopped) {
              console.log("Demo stopped by user");
              break;
            }
            yield this.processPage(allData, pageIndex, String(nSesid));
          }
          console.log("Demo streaming completed");
        }
      } catch (error) {
        console.error("Error fetching demo data from file:", error);
      }
    });
  }
  processPage(allData, pageIndex, nSesid) {
    return __async(this, null, function* () {
      const page = allData[pageIndex];
      if (page && page.data && page.data.length) {
        for (let lineData of page.data) {
          const lineText = lineData.lines[0];
          const lineAscii = lineText.split("").map((c) => c.charCodeAt(0));
          if (lineAscii.length && !this.demoStopped) {
            for (let i = 0; i < lineAscii.length; i++) {
              if (this.demoStopped)
                return;
              const partialAscii = lineAscii.slice(0, i + 1);
              const sendArray = [
                lineData.time,
                // 0: time
                partialAscii,
                // 1: asciiValue
                this.demoLineCounter,
                // 2: lineIndex
                lineData.formate,
                // 3: formate
                page.page,
                // 4: oPage
                this.demoLineCounter + 1,
                // 5: oLine
                lineData.unicid,
                // 6: unicid
                lineData.links || []
                // 7: links
              ];
              this.appendLiveFeed({
                d: [sendArray],
                date: nSesid
              });
              const typingDelay = this.TYPING_SPEED_BASE + Math.random() * this.TYPING_SPEED_VARIATION - this.TYPING_SPEED_VARIATION / 2;
              yield this.delay(typingDelay);
            }
            yield this.delay(this.LINE_PAUSE_DELAY);
            this.demoLineCounter++;
          }
        }
      }
    });
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  StopstreamDemoData() {
    console.log("Stopping demo stream");
    this.demoStopped = true;
    this.demoLineCounter = 0;
  }
  static {
    this.\u0275fac = function FeedDisplayService_Factory(t) {
      return new (t || _FeedDisplayService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(SocketService), \u0275\u0275inject(FeedUtilityService), \u0275\u0275inject(TostbarService), \u0275\u0275inject(AnnotsService), \u0275\u0275inject(annotTrasnferService), \u0275\u0275inject(RealtimeService), \u0275\u0275inject(CommunicationService), \u0275\u0275inject(SecureStorageService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FeedDisplayService, factory: _FeedDisplayService.\u0275fac });
  }
};

export {
  MarknavService,
  AnnotsService,
  annotTrasnferService,
  FeedUtilityService,
  RealtimeService,
  FeedDisplayService
};
//# sourceMappingURL=chunk-SD32Y426.js.map
