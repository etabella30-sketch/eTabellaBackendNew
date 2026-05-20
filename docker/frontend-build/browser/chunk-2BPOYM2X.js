import {
  IndividualService
} from "./chunk-GNZXOHZW.js";
import {
  RealtimeService
} from "./chunk-SD32Y426.js";
import {
  CasedetailService
} from "./chunk-XYPEOTVH.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  TranslateService
} from "./chunk-DWVFAK3Q.js";
import {
  CommonfunctionService,
  MULTI_DEVICE_EXEMPT_CASE_ID,
  MULTI_DEVICE_SESSION_KEY
} from "./chunk-TNIBXRF4.js";
import {
  MatDialog
} from "./chunk-UVEQGFJV.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  HttpErrorResponse
} from "./chunk-EVEACXQX.js";
import {
  __async,
  __spreadProps,
  __spreadValues,
  inject,
  signal,
  ɵɵdefineInjectable
} from "./chunk-OLJKHPOW.js";

// src/app/rt/adapters/rt-error.adapter.ts
var RtErrorAdapter = class _RtErrorAdapter {
  constructor() {
    this.tost = inject(TostbarService);
  }
  handle(error, context) {
    console.error(`RT Error [${context || "Unknown"}]:`, error);
    let message = "An unexpected error occurred.";
    if (error instanceof HttpErrorResponse) {
      message = error.error?.message || error.message || message;
    } else if (typeof error === "string") {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }
    this.tost.error(message);
  }
  static {
    this.\u0275fac = function RtErrorAdapter_Factory(t) {
      return new (t || _RtErrorAdapter)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RtErrorAdapter, factory: _RtErrorAdapter.\u0275fac, providedIn: "root" });
  }
};

// src/app/rt/facades/realtime.facade.ts
var RealtimeFacade = class _RealtimeFacade {
  static {
    this.DOC_RATIO_MIN = 20;
  }
  static {
    this.DOC_RATIO_MAX = 80;
  }
  static {
    this.DOC_RATIO_DEFAULT = 50;
  }
  // `persist` is kept as a no-op for call-site compatibility — the drag
  // handler still passes it. Width is in-memory only, by design.
  setDocViewerRatio(ratio, _persist = true) {
    const clamped = Math.min(_RealtimeFacade.DOC_RATIO_MAX, Math.max(_RealtimeFacade.DOC_RATIO_MIN, ratio));
    this._docViewerRatio.set(clamped);
  }
  persistDocViewerRatio() {
  }
  resetDocViewerRatio() {
    this.setDocViewerRatio(_RealtimeFacade.DOC_RATIO_DEFAULT);
  }
  // UI State Actions
  setSplitScreen(enabled, sessionId = null) {
    this._uiState.update((s) => __spreadProps(__spreadValues({}, s), { isSplitScreen: enabled, splitSessionId: sessionId }));
  }
  setCompareMode(enabled) {
    this._uiState.update((s) => __spreadProps(__spreadValues({}, s), { isCompareMode: enabled }));
  }
  setFeedCompare(enabled) {
    this._uiState.update((s) => __spreadProps(__spreadValues({}, s), { isFeedCompare: enabled }));
  }
  setZoomLevel(level) {
    this._uiState.update((s) => __spreadProps(__spreadValues({}, s), { zoomLevel: level }));
  }
  setPanelWidths(sideNav, feed) {
    this._uiState.update((s) => __spreadProps(__spreadValues({}, s), { sideNavPanelLeft: sideNav, feedPanelLeft: feed }));
  }
  constructor() {
    this.ss = inject(SecureStorageService);
    this.cs = inject(CommunicationService);
    this.hs = inject(HeaderService);
    this.dialog = inject(MatDialog);
    this.realtimeService = inject(RealtimeService);
    this.individualService = inject(IndividualService);
    this.cf = inject(CommonfunctionService);
    this.translate = inject(TranslateService);
    this.errorAdapter = inject(RtErrorAdapter);
    this.casedetailService = inject(CasedetailService);
    this._user = signal(null);
    this._isDemoStarted = signal(false);
    this.currentCase = signal(null);
    this.user = this._user.asReadonly();
    this.isDemoStarted = this._isDemoStarted.asReadonly();
    this.activeSession = signal(null);
    this.sessionDetail = signal(null);
    this._uiState = signal({
      isSplitScreen: false,
      splitSessionId: null,
      // Added splitSessionId
      isCompareMode: false,
      // Document Compare (PDF)
      isFeedCompare: false,
      // Transcript Compare (Feed vs Feed)
      sideNavPanelLeft: 420,
      feedPanelLeft: 420,
      zoomLevel: 1
    });
    this.uiState = this._uiState.asReadonly();
    this._docViewerRatio = signal(_RealtimeFacade.DOC_RATIO_DEFAULT);
    this.docViewerRatio = this._docViewerRatio.asReadonly();
    this._compareState = signal({
      sessionL: null,
      sessionR: null,
      documentList: [],
      demoDocList: [],
      currentIndex: 0
    });
    this.compareState = this._compareState.asReadonly();
    this.loadUser();
  }
  loadUser() {
    return __async(this, null, function* () {
      const user = yield this.ss.getUserInfo();
      this._user.set(user);
    });
  }
  // Realtime Session Management
  initializeSession(nCaseid, nSesid = null) {
    return __async(this, null, function* () {
      if (nCaseid === MULTI_DEVICE_EXEMPT_CASE_ID) {
        localStorage.setItem(MULTI_DEVICE_SESSION_KEY, "true");
      }
      if (nCaseid) {
        try {
          const res = yield this.casedetailService.getCaseInfo(nCaseid);
          if (res) {
            const caseDetail = Array.isArray(res) ? res[0] : res;
            this.currentCase.set(caseDetail);
            this.hs.Casedetail = caseDetail;
          }
        } catch (e) {
          console.error("Failed to load case detail", e);
        }
      }
      let session = nSesid;
      if (!session) {
        session = yield this.realtimeService.getActiveSession(nCaseid);
      }
      this.activeSession.set(session);
      const user = this._user();
      if (session && user) {
        try {
          const detail = yield this.realtimeService.getSessionDetail(session, user.nUserid);
          this.sessionDetail.set(detail);
        } catch (e) {
          console.error("Failed to load session detail", e);
        }
      }
      return session;
    });
  }
  toggleDemo() {
    const currentState = this._isDemoStarted();
    if (currentState) {
      this.cs.callFunction({ event: "STOP-DEMO", flag: true });
    } else {
      this.cs.callFunction({ event: "START-DEMO", flag: true });
    }
    this._isDemoStarted.set(!currentState);
  }
  resetDemoState() {
    this._isDemoStarted.set(false);
  }
  resetState() {
    localStorage.removeItem(MULTI_DEVICE_SESSION_KEY);
    this._user.set(null);
    this._isDemoStarted.set(false);
    this.currentCase.set(null);
    this.activeSession.set(null);
    this.sessionDetail.set(null);
    this._uiState.set({
      isSplitScreen: false,
      splitSessionId: null,
      isCompareMode: false,
      isFeedCompare: false,
      sideNavPanelLeft: 420,
      feedPanelLeft: 420,
      zoomLevel: 1
    });
    this._compareState.set({
      sessionL: null,
      sessionR: null,
      documentList: [],
      demoDocList: [],
      currentIndex: 0
    });
  }
  goUserHome() {
    this.hs.goUserHome();
  }
  exitRealtime() {
    window.close();
  }
  isOnRealtimeDashboard() {
    return location.href.includes("realtime/dashboard");
  }
  // Comparison Actions
  setCompareSessions(left, right) {
    this._compareState.update((s) => __spreadProps(__spreadValues({}, s), { sessionL: left, sessionR: right }));
  }
  updateCompareDocumentList(list) {
    this._compareState.update((s) => __spreadProps(__spreadValues({}, s), { documentList: list }));
  }
  updateDemoDocList(list) {
    this._compareState.update((s) => __spreadProps(__spreadValues({}, s), { demoDocList: list }));
  }
  setCompareIndex(index) {
    this._compareState.update((s) => __spreadProps(__spreadValues({}, s), { currentIndex: index }));
  }
  // Complex Logic moved from Component
  enableFeedCompare(nLid, nRid) {
    this.setSplitScreen(false, null);
    this.setCompareMode(false);
    this.setFeedCompare(true);
    this.setCompareSessions(nLid, nRid);
  }
  disableFeedCompare() {
    this.setFeedCompare(false);
    this.setCompareSessions(null, null);
  }
  enableSwitchMode(nSesid) {
    const sessionToUse = nSesid || this.activeSession();
    this.disableFeedCompare();
    this.setCompareMode(false);
    this.setSplitScreen(true, sessionToUse);
  }
  disableSwitchMode() {
    this.setSplitScreen(false, null);
  }
  // Internal Helper
  senitizeUrl(data, pageNo, index) {
    const nCaseid = this.currentCase()?.nCaseid || "";
    const isCompare = this.uiState().isCompareMode;
    return this.cf.senitizeUrl(data.originalPath, data.nBundledetailid, nCaseid, true, null, pageNo, null, isCompare, index, null, null, data.nRFSid || null, data.nRDocid || null, data.nRWebid || null, null, null, null, null, null, null, 1);
  }
  handleOpenCompareMode(data) {
    return __async(this, null, function* () {
      try {
        this.setCompareIndex(1);
        this.setCompareMode(true);
        this.setFeedCompare(false);
        this.setSplitScreen(false);
        this.updateCompareDocumentList([]);
        this.updateDemoDocList([]);
        const firstDoc = {
          nBundledetailid: "",
          cFilename: this.translate.instant("rt.realtime.realtimeFeed"),
          originalPath: "",
          cPath: null,
          isLoaded: true,
          isChecked: true,
          isActivate: true,
          nSesid: this.activeSession(),
          nRFSid: null,
          nRDocid: null,
          nRWebid: null,
          currentPage: 1,
          onPage: 1
        };
        this.updateCompareDocumentList([firstDoc]);
        yield this.fetchAllDocsForCompare(data.nDocid, data.nBundledetailid);
      } catch (error) {
        this.errorAdapter.handle(error, "Open Compare Mode");
      }
    });
  }
  startCompareWithDocuments(documentsData) {
    if (!documentsData?.length)
      return;
    this.setCompareMode(true);
    this.setFeedCompare(false);
    this.setSplitScreen(false);
    this.setCompareIndex(1);
    const docList = documentsData.map((doc, index) => {
      const onPage = doc.jLinktype?.pages?.[0] || doc.jLinktype?.start || 1;
      const element = {
        nBundledetailid: doc.nBundledetailid,
        cFilename: doc.cFilename,
        originalPath: doc.cPath,
        cPath: index === 0 ? null : this.senitizeUrl({ originalPath: doc.cPath, nBundledetailid: doc.nBundledetailid }, onPage, index + 1),
        isLoaded: true,
        isChecked: true,
        isActivate: index === 0,
        onPage,
        currentPage: onPage,
        nSesid: index === 0 ? this.activeSession() : null,
        nRDocid: doc.nDocid
      };
      return element;
    });
    this.updateCompareDocumentList(docList);
  }
  fetchAllDocsForCompare(docId, nBundledetailid) {
    return __async(this, null, function* () {
      try {
        const ids = [docId];
        const docs = yield this.individualService.fetchAllDocs(ids);
        const currentList = [...this.compareState().documentList];
        if (docs.length > 0) {
          if (docs.length > 2) {
            const selectedDoc = docs[1].find((a) => a.nBundledetailid == nBundledetailid);
            if (selectedDoc) {
              if (selectedDoc?.jLinktype && selectedDoc?.jLinktype?.pages?.length) {
                selectedDoc.onPage = selectedDoc?.jLinktype?.pages[0];
              } else if (selectedDoc?.jLinktype && selectedDoc?.jLinktype?.start) {
                selectedDoc.onPage = parseInt(selectedDoc?.jLinktype?.start);
              }
              selectedDoc.originalPath = selectedDoc.cPath;
              const element = {
                nBundledetailid: selectedDoc.nBundledetailid,
                cFilename: selectedDoc.cFilename,
                originalPath: selectedDoc.cPath,
                cPath: this.senitizeUrl(selectedDoc, selectedDoc.onPage, 2),
                isLoaded: true,
                isChecked: true,
                isActivate: true,
                currentPage: selectedDoc.onPage || 1,
                onPage: selectedDoc.onPage,
                nRFSid: selectedDoc.nRFSid || null,
                nRDocid: selectedDoc.nRDocid || null,
                nRWebid: selectedDoc.nRWebid || null,
                nSesid: null
              };
              currentList.push(element);
            }
            const demoList = [];
            docs[1].map((info) => {
              info.originalPath = info.cPath;
              if (info?.jLinktype && info?.jLinktype?.pages?.length) {
                info.onPage = info?.jLinktype?.pages[0];
              } else if (info?.jLinktype && info?.jLinktype?.start) {
                info.onPage = parseInt(info?.jLinktype?.start);
              }
              const element = {
                nBundledetailid: info.nBundledetailid,
                cFilename: info.cFilename,
                originalPath: info.cPath,
                cPath: this.senitizeUrl(info, info.onPage || 1, 2),
                isLoaded: true,
                isChecked: selectedDoc && selectedDoc.nBundledetailid == info.nBundledetailid,
                isActivate: true,
                currentPage: info.onPage || 1,
                onPage: 1,
                nRFSid: info.nRFSid || null,
                nRDocid: info.nRDocid || null,
                nRWebid: info.nRWebid || null,
                nSesid: null
              };
              demoList.push(element);
            });
            this.updateDemoDocList(demoList);
          } else if (docs.length == 1) {
            const firstDocData = docs[0];
            const element = {
              nBundledetailid: firstDocData.nBundledetailid,
              cFilename: firstDocData.cFilename,
              originalPath: firstDocData.cPath,
              cPath: this.senitizeUrl(firstDocData, firstDocData.currentPage || 1, 2),
              isLoaded: true,
              isChecked: true,
              isActivate: true,
              currentPage: firstDocData.currentPage || 1,
              onPage: firstDocData.onPage || 1,
              nRFSid: firstDocData.nRFSid || null,
              nRDocid: firstDocData.nRDocid || null,
              nRWebid: firstDocData.nRWebid || null,
              nSesid: null
            };
            currentList.push(element);
          }
        }
        this.updateCompareDocumentList(currentList);
      } catch (err) {
        console.error("Error fetching documents for compare:", err);
      }
    });
  }
  disableCompareMode() {
    this.setCompareMode(false);
    this.updateCompareDocumentList([]);
    this.setCompareIndex(0);
  }
  handleDocumentSelectionChange(item, checked) {
    const currentList = [...this.compareState().documentList];
    if (checked) {
      if (currentList.length < 4) {
        const existingIndex = currentList.findIndex((doc) => doc.nBundledetailid === item.nBundledetailid);
        if (existingIndex === -1) {
          const newDoc = __spreadProps(__spreadValues({}, item), {
            isChecked: true,
            cPath: this.senitizeUrl(item, item.onPage || 1, currentList.length + 1)
          });
          currentList.push(newDoc);
          this.updateCompareDocumentList(currentList);
        }
      }
    } else {
      const index = currentList.findIndex((doc) => doc.nBundledetailid === item.nBundledetailid);
      if (index > -1) {
        currentList.splice(index, 1);
        this.updateCompareDocumentList(currentList);
      }
    }
  }
  static {
    this.\u0275fac = function RealtimeFacade_Factory(t) {
      return new (t || _RealtimeFacade)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RealtimeFacade, factory: _RealtimeFacade.\u0275fac, providedIn: "root" });
  }
};

export {
  RealtimeFacade
};
//# sourceMappingURL=chunk-2BPOYM2X.js.map
