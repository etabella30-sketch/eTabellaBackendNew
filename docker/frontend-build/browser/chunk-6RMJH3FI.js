import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
import {
  Subject,
  __spreadProps,
  __spreadValues,
  ɵɵdefineInjectable
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/utility/user-panel-constants.ts
var ScrollState;
(function(ScrollState2) {
  ScrollState2["START"] = "S";
  ScrollState2["END"] = "E";
  ScrollState2["MIDDLE"] = "M";
})(ScrollState || (ScrollState = {}));
var SNACKBAR_TYPES = {
  DEFAULT: "",
  ERROR: "E"
};
var PRESENTATION_STATUS_TYPES = ["PRESENT-USER-ADDED", "PRESENT-START"];
var NOTIFICATION_TYPES = ["LS", "FS", "DS", "WS", "TASK-SHARE", "CS", "TR"];
var PRESENTATION_EVENTS = ["LIVE", "USER-MANAGE", "END"];
var CASE_STATUS_CONDITIONS = {
  EVENT_USER_MANAGE: "USER-MANAGE",
  STATUS_ACTIVE: "A",
  PERMISSION_DENY: "D",
  EVENT_END: "END"
};
var DASHBOARD_ACTIONS = {
  VIEW_TICKET: "VIEW-TICKET",
  REAL_TIME: "REAL-TIME"
};
var CASECARD_ACTIONS = {
  VIEW_TICKET: "VIEW-TICKET",
  EDIT: "EDIT",
  ARCHIVE_TRUE: "ARCHIVE-TRUE",
  ARCHIVE_FALSE: "ARCHIVE-FALSE"
};
var BUTTON_ACTIONS = {
  GO_TO_CASE: "goToCase",
  GO_TO_ADMIN: "goToAdmin",
  GO_TO_PRESENTATION: "goToPresentation",
  EDIT_CASE: "editCase",
  GO_TO_BUNDLE_MANAGE: "goToBundleManage",
  GO_TO_REALTIME_LOG: "goToRealtimeLog",
  TOGGLE_ARCHIVE_MENU: "toggleArchiveMenu",
  UPDATE_ARCHIVE_STATUS: "updateArchiveStatus",
  CLOSE_MENU: "closeMenu"
};
var CASECARD_ROUTES = {
  CASE_BUILDER: "/casebuilder/casecreation",
  BUNDLE_MANAGEMENT: "managefiles/bundlemanagement",
  REALTIME_LOG: "realtimelog",
  MY_FILES: "/myfiles/filesaction",
  PRESENTATION: "/present/home"
};
var USERDASHBOARD_CONFIG = {
  // Scroll settings
  SCROLL_THRESHOLD: 10,
  SCROLL_TIMEOUT: 100,
  SCROLL_TO_POSITION: 500,
  SCROLL_BEHAVIOR: "smooth",
  // Dialog settings
  DIALOG_WIDTH: "678px",
  DIALOG_HEIGHT: "fit-content",
  DIALOG_MAX_HEIGHT: "99vh",
  DIALOG_POSITION_TOP: "58px",
  DIALOG_POSITION_RIGHT: "10px",
  // Routes
  ADMIN_DASHBOARD: "/admin/dashboard",
  REALTIME_FEED: "rt-realtime/feed",
  LOGIN_PAGE: "/auth/login"
};
var SKELETON_ARRAYS = {
  DEFAULT_SKELETON: [1, 2, 3, 4, 5, 6],
  LOADED_SKELETON: [1, 2],
  AVATAR_SKELETON: [1, 2, 4],
  TEAM_SKELETON: [1, 2, 3],
  FOLDERS_LOADING_SKELETON: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
};
var USER_DATA_CONFIG = {
  IS_MY_FILES: true,
  FALLBACK_DASHBOARD_TITLE: "Dashboard"
};
var MYFILES_CS_EVENTS = {
  SHOW_FOLDER: "SHOW-FOLDER",
  FETCH_META_BUNDLES: "FETCH-META-BUNDLES",
  CHANGE_SEARCH_SECTION: "CHANGE-SEARCH-SECTION",
  UPDATE_SECTION: "UPDATE-SECTION",
  SELECT_FILE: "SELECT-FILE",
  CB_SECTION: "CB-SECTION",
  CHANGE_BUNDLE_ID: "CHANGE-BUNDLEID",
  DOWNLOAD_STARTED: "DOWNLOAD-STARTED",
  DOWNLOAD_FAILED: "DOWNLOAD-FAILED",
  SEARCH_FILES_EXISTING_FILTER: "SEARCH_FILES_EXISTING_FILTER",
  SEARCH_FILES: "SEARCH_FILES",
  SEARCHING: "SEARCHING",
  CLEAR_SELECTION: "CLEAR-SELECTION",
  CLEAR_SEARCH_ALL: "CLEAR_SEARCH_ALL",
  UPDATE_SEARCH_URL: "UPDATE-SEARCH-URL",
  SEARCH_BUNDLES_CLEAR: "SEARCH-BUNDLES-CLEAR",
  SHOW_UPLOAD: "SHOW-UPLOAD",
  SEARCH_ELASTIC: "SEARCH_ELASTIC",
  DOWNLOAD_FILE: "DOWNLOAD-FILE",
  HYPERLINK_DOC: "HYPERLINK-DOC"
};
var MYFILES_CS_TYPES = {
  VIEW_SHARE: "VIEW-SHARE",
  CUT_COPY_EVENT: "CUT-COPY-EVENT",
  SEARCH_BUNDLES: "SEARCH-BUNDLES",
  SEARCH_BUNDLES_CLEAR: "SEARCH-BUNDLES-CLEAR",
  UPDATE_BUNDLETAG: "UPDATE-BUNDLETAG",
  UPDATE_FOLDER: "UPDATE-FOLDER"
};
var MYFILES_CHANGEFOLDER_EVENTS = {
  SELECTED: "SELECTED",
  GET_BUNDLE_LIST: "GET_BUNDLE_LIST",
  OPEN_FILE: "OPEN-FILE",
  SUBMIT: "SUBMIT"
};
var MYFILES_CUT_COPY_TYPES = {
  DOWNLOAD: "DOWNLOAD"
};
var MYFILES_FOLDER_TYPE_GROUPS = {
  ADD_SECTION_TYPES: ["CB", "CF", "TS"]
};
var BROADCAST_EVENTS = {
  LOG_IN_ANOTHER_BROWSER: "LOG-IN-ANOTHER-BROWESER",
  LOGIN: "LOGIN",
  LOGGED_OUT: "LOGED-OUT",
  INDIVIDUAL_MULTIPLE_TAB: "INDIVIDUAL-MULTIPLE-TAB",
  INDIVIDUAL_OPEN_TAB: "INDIVIDUAL-OPEN-TAB",
  INDIVIDUAL_OPEN: "INDIVIDUAL-OPEN",
  PRESENTATION_END: "PRESENTATION-END",
  SEARCH_CHANGED: "SEARCH-CHANGED",
  DEACTIVATE_SEARCH: "DEACTIVATE-SEARCH",
  INDIVIDUAL_FACT_SHEET_OPEN: "INDIVIDUAL-FACT-SHEET-OPEN",
  INDIVIDUAL_FACT_SHEET_DELETE: "INDIVIDUAL-FACT-SHEET-DELETE",
  RELOAD_FILE_LIST: "RELOAD-FILE-LIST"
};

// src/app/core/services/broadcasting/broadcasting.service.ts
var BroadcastingService = class _BroadcastingService {
  static {
    this.CHANNEL_NAME = "etabella-mipl";
  }
  constructor() {
    this.authSubject = new Subject();
    this.individualMultipleTabSubject = new Subject();
    this.individualTabOpenSubject = new Subject();
    this.individualOpenExistsSubject = new Subject();
    this.presentationExistsSubject = new Subject();
    this.searchChangesSubject = new Subject();
    this.searchDeactivateSubject = new Subject();
    this.factSheetOpenSubject = new Subject();
    this.factSheetDeleteSubject = new Subject();
    this.fileListReloadSubject = new Subject();
    this.tabId = _BroadcastingService.createTabId();
    if (typeof BroadcastChannel === "undefined") {
      return;
    }
    try {
      this.channel = new BroadcastChannel(_BroadcastingService.CHANNEL_NAME);
      this.channel.onmessage = (e) => {
        const data = e?.data;
        if (!data || data.tabId === this.tabId) {
          return;
        }
        switch (data.event) {
          case BROADCAST_EVENTS.LOG_IN_ANOTHER_BROWSER:
          case BROADCAST_EVENTS.LOGIN:
          case BROADCAST_EVENTS.LOGGED_OUT:
            this.authSubject.next(data);
            break;
          case BROADCAST_EVENTS.INDIVIDUAL_MULTIPLE_TAB:
            this.individualMultipleTabSubject.next(data);
            break;
          case BROADCAST_EVENTS.INDIVIDUAL_OPEN_TAB:
            this.individualTabOpenSubject.next(data);
            break;
          case BROADCAST_EVENTS.INDIVIDUAL_OPEN:
            this.individualOpenExistsSubject.next(data);
            break;
          case BROADCAST_EVENTS.PRESENTATION_END:
            this.presentationExistsSubject.next(data);
            break;
          case BROADCAST_EVENTS.SEARCH_CHANGED:
            this.searchChangesSubject.next(data);
            break;
          case BROADCAST_EVENTS.DEACTIVATE_SEARCH:
            this.searchDeactivateSubject.next(data);
            break;
          case BROADCAST_EVENTS.INDIVIDUAL_FACT_SHEET_OPEN:
            this.factSheetOpenSubject.next(data);
            break;
          case BROADCAST_EVENTS.INDIVIDUAL_FACT_SHEET_DELETE:
            this.factSheetDeleteSubject.next(data);
            break;
          case BROADCAST_EVENTS.RELOAD_FILE_LIST:
            this.fileListReloadSubject.next(data);
            break;
          default:
            break;
        }
      };
    } catch (error) {
      throw new Error(`BroadcastChannel initialization failed: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  authListener() {
    return this.authSubject.asObservable();
  }
  indiMultiTabListener() {
    return this.individualMultipleTabSubject.asObservable();
  }
  indiTabOpenListener() {
    return this.individualTabOpenSubject.asObservable();
  }
  indiOpenExistsListener() {
    return this.individualOpenExistsSubject.asObservable();
  }
  presentationExistsListener() {
    return this.presentationExistsSubject.asObservable();
  }
  onSearchChange() {
    return this.searchChangesSubject.asObservable();
  }
  onSearchDeactivate() {
    return this.searchDeactivateSubject.asObservable();
  }
  factSheetOpenListener() {
    return this.factSheetOpenSubject.asObservable();
  }
  factSheetDeleteListener() {
    return this.factSheetDeleteSubject.asObservable();
  }
  fileListReloadListener() {
    return this.fileListReloadSubject.asObservable();
  }
  // POSTING BROADCASTING
  portMessage(body) {
    if (!this.channel) {
      return;
    }
    try {
      const message = __spreadProps(__spreadValues({}, body), { tabId: this.tabId });
      this.channel.postMessage(message);
    } catch (error) {
      throw new Error(`BroadcastChannel postMessage failed: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  ngOnDestroy() {
    try {
      this.channel?.close();
    } catch (error) {
      throw new Error(`BroadcastChannel close failed: ${ErrorHandlerUtil.getErrorMessage(error)}`);
    }
  }
  static createTabId() {
    const cryptoObj = globalThis.crypto;
    if (cryptoObj?.randomUUID) {
      return cryptoObj.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  static {
    this.\u0275fac = function BroadcastingService_Factory(t) {
      return new (t || _BroadcastingService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _BroadcastingService, factory: _BroadcastingService.\u0275fac, providedIn: "root" });
  }
};

export {
  ScrollState,
  SNACKBAR_TYPES,
  PRESENTATION_STATUS_TYPES,
  NOTIFICATION_TYPES,
  PRESENTATION_EVENTS,
  CASE_STATUS_CONDITIONS,
  DASHBOARD_ACTIONS,
  CASECARD_ACTIONS,
  BUTTON_ACTIONS,
  CASECARD_ROUTES,
  USERDASHBOARD_CONFIG,
  SKELETON_ARRAYS,
  USER_DATA_CONFIG,
  MYFILES_CS_EVENTS,
  MYFILES_CS_TYPES,
  MYFILES_CHANGEFOLDER_EVENTS,
  MYFILES_CUT_COPY_TYPES,
  MYFILES_FOLDER_TYPE_GROUPS,
  BROADCAST_EVENTS,
  BroadcastingService
};
//# sourceMappingURL=chunk-6RMJH3FI.js.map
