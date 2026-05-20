import {
  DownloadService
} from "./chunk-6XJ2ENW3.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  SNACKBAR_TYPES
} from "./chunk-6RMJH3FI.js";
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
  __async,
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/shared/interfaces/fileexplorer.interface.ts
var FILEEXPLORER_RESIZE_DIRECTIONS = {
  LEFT: "L",
  RIGHT: "R"
};
var FILEEXPLORER_EVENTS = {
  DOWNLOAD_FILE: "DOWNLOAD-FILE",
  HYPERLINK_DOC: "HYPERLINK-DOC",
  SHOW_UPLOAD: "SHOW-UPLOAD",
  SEARCH_FILES: "SEARCH_FILES",
  SEARCH_ELASTIC: "SEARCH_ELASTIC",
  SEARCHING: "SEARCHING",
  CB_SECTION: "CB-SECTION",
  ICON_CLICK: "ICON_CLICK",
  OPEN_FILE: "OPEN-FILE",
  SELECTED: "SELECTED",
  GET_BUNDLE_LIST: "GET_BUNDLE_LIST",
  CHECK_UNCHECK_ALL: "CHECK-UNCHECK-ALL",
  UPDATE_BUNDLEID: "UPDATE-BUNDLEID",
  OPEN_DOCUMENT: "OPEN-DOCUMENT",
  EDIT_BUNDLE: "EDIT_BUNDLE",
  RENAME_BUNDLE: "RENAME-BUNDLE",
  CHANGE_P: "CHANGE_P",
  VIEW: "VIEW",
  ASSIGN_VIEW: "ASSIGN_VIEW",
  CLOSE: "CLOSE",
  SHOW: "SHOW",
  CHANGE_SECTION: "CHANGE-SECTION",
  VIEW_LINK_RESULT: "VIEW-LINK-RESULT",
  DOWNLOAD_FAILED: "DOWNLOAD-FAILED",
  DOWNLOAD_STARTED: "DOWNLOAD-STARTED",
  ACTION_CLOSE: "ACTION_CLOSE",
  CLEAR_SELECTION: "CLEAR-SELECTION",
  SEARCH_FILES_EXISTING_FILTER: "SEARCH_FILES_EXISTING_FILTER"
};
var FILEEXPLORER_ACTION_TYPES = {
  DOWNLOAD: "DOWNLOAD",
  TRANS: "TRANS",
  CB: "CB",
  HYPERLINK_DOC: "HYPERLINK-DOC",
  EXPORT: "EXPOERT",
  UNASSIGN: "Unassign",
  DELETE: "D",
  CONV: "CONV",
  UNDO: "UNDO"
};
var FILEEXPLORER_DIALOG_RESULTS = {
  CLOSE: "Close",
  DELETE: "Delete",
  UNDO: "UNDO",
  UNASSIGN: "Unassign",
  EXPORT: "EXPOERT",
  DOWNLOAD: "DOWNLOAD",
  CONV: "CONV"
};
var FILEEXPLORER_DIALOG_TYPES = {
  DOWNLOAD: "DOWNLOAD",
  COPY: "COPY",
  CUT: "CUT"
};
var FILEEXPLORER_FOLDER_TYPES = {
  TF: "TF",
  CF: "CF",
  MB: "MB",
  CB: "CB",
  CO: "CO",
  TS: "TS"
};
var FILEEXPLORER_RESIZE_LIMITS = {
  MIN_LEFT_PANEL_WIDTH: 300,
  MIN_RIGHT_PANEL_WIDTH: 426,
  MAX_LEFT_PANEL_WIDTH_SCREEN_OFFSET: 420,
  MAX_RIGHT_PANEL_WIDTH_SCREEN_OFFSET: 340
};
var FILEEXPLORER_CONFIG = {
  // Panel width constants
  LEFT_PANEL_WIDTH: 300,
  RIGHT_PANEL_WIDTH: 300,
  // Resize constants
  DEFAULT_RESIZE_DIRECTION: FILEEXPLORER_RESIZE_DIRECTIONS.LEFT,
  RESIZE_LIMITS: FILEEXPLORER_RESIZE_LIMITS,
  // Timeout constants
  INITIAL_TIMEOUT: 100,
  // Default values
  DEFAULT_SELECTED_TAB: "M",
  DEFAULT_SECTION_ID: null,
  DEFAULT_PAGE: null,
  DEFAULT_NAVIGATE_MODE: "FL",
  DEFAULT_DISPLAY_TYPE: null,
  // Display resolution default values
  DEFAULT_DISPLAY_RES: {
    isIssue: false,
    isContact: false,
    isTag: false
  },
  // Share IDs default values
  DEFAULT_SHARE_IDS: {
    nBundledetailid: null,
    nBundleid: null,
    nSectionid: null,
    isUpdate: false
  }
};

// src/app/shared/services/myfile/myfile.service.ts
var MyfileService = class _MyfileService {
  constructor(sStore, http, tost, downloadService) {
    this.sStore = sStore;
    this.http = http;
    this.tost = tost;
    this.downloadService = downloadService;
    this.isfolderdraging = false;
    this.isDownLoading = false;
    this.teamUsersCache = /* @__PURE__ */ new Map();
    this.filedataCache = /* @__PURE__ */ new Map();
    this.teamUsersInFlight = /* @__PURE__ */ new Map();
    this.prefetchedBinaries = /* @__PURE__ */ new Set();
  }
  getCachedTeamUsers(nCaseid) {
    return __async(this, null, function* () {
      if (!nCaseid)
        return [];
      if (this.teamUsersCache.has(nCaseid)) {
        return this.teamUsersCache.get(nCaseid);
      }
      if (this.teamUsersInFlight.has(nCaseid)) {
        return this.teamUsersInFlight.get(nCaseid);
      }
      const request = this.fetchMyTeamUsers(nCaseid).then((list2) => list2 || []).catch(() => []);
      this.teamUsersInFlight.set(nCaseid, request);
      const list = yield request;
      this.teamUsersCache.set(nCaseid, list);
      this.teamUsersInFlight.delete(nCaseid);
      return list;
    });
  }
  resetState() {
    this.teamUsersCache.clear();
    this.teamUsersInFlight.clear();
  }
  fetchMyTeamUsers(nCaseid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCaseid", nCaseid);
      try {
        return yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/common/myteamusers`, { params }));
      } catch (error) {
        console.error(error);
        return [];
      }
    });
  }
  bundleList(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles/bundle`, mdl));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  bundleDetailList(mdl) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/bundledetail`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  getbundleLink(mdl) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/bundle_links`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  bundleDetailSearch(mdl) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/bundledetail-search`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  bundleTypeList(mdl) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/bundletypes`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  searchedBundles(mdl) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/searched-bundles`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  bundleBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/bundlebuilder`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return res;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Bundle creation failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return { msg: 1, value: "Bundle creation failed" };
      }
    });
  }
  fileRename(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/renamefile`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Rename failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  teamuserList(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/teamsusers`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  bundlesPermission(mdl) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/bundlepermissions`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  setPermission(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/setpermission`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Set permission failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  deleteBundle(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/deletebundles`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Delete failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  undoBundle(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/undobundles`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`UNDO failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  copyBundle(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/copybundles`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return res;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Paste failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return { msg: 1, value: "Paste failed" };
      }
    });
  }
  cutBundle(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/cutbundles`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Paste failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  updateBundle(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/updatebundledetail`, mdl));
        if (res?.msg === 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Update failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  updateTag(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/updatetag`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Update failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  updateTab(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/updatetab`, mdl));
        if (res?.length && res[0]?.msg === 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Update failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  getFiledata(mdl) {
    return __async(this, null, function* () {
      const cacheKey = `${mdl?.nCaseid ?? ""}::${mdl?.cTab ?? ""}`;
      const cached = this.filedataCache.get(cacheKey);
      if (cached)
        return cached;
      const promise = (() => __async(this, null, function* () {
        try {
          let params = new HttpParams();
          for (const key in mdl) {
            if (mdl.hasOwnProperty(key)) {
              params = params.set(key, mdl[key]);
            }
          }
          const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/filedata`, { params }));
          const result = res?.length ? res[0] : null;
          if (result?.cPath)
            this.prefetchPdfBinary(result.cPath);
          return result;
        } catch (err) {
          this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
          this.filedataCache.delete(cacheKey);
          return null;
        }
      }))();
      this.filedataCache.set(cacheKey, promise);
      return promise;
    });
  }
  prefetchPdfBinary(cPath) {
    try {
      if (!cPath || this.prefetchedBinaries.has(cPath))
        return;
      this.prefetchedBinaries.add(cPath);
      fetch(cPath, {
        method: "GET",
        mode: "no-cors",
        credentials: "include",
        cache: "force-cache"
      }).catch(() => {
      });
    } catch {
    }
  }
  getFileIDs(nBundleid, nSectionid, cFiletype) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nBundleid", nBundleid);
        params = params.set("nSectionid", nSectionid);
        params = params.set("cFiletype", cFiletype);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/get_fileids`, { params }));
        return res?.length ? res[0] : { nIDs: [] };
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return { nIDs: [] };
      }
    });
  }
  getrecentfile(mdl) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        for (const key in mdl) {
          if (mdl.hasOwnProperty(key)) {
            params = params.set(key, mdl[key]);
          }
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/recentFile`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  clearRecent(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/clearrecent`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Recent clear failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  getBundletag(nSectionid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nSectionid", nSectionid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/bundletag`, { params }));
        return res;
      } catch (err) {
        this.tost.openSnackBar(`Failed to fetch ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return [];
      }
    });
  }
  getBundletab(nSectionid, nBundleid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        params = params.set("nSectionid", nSectionid);
        params = params.set("nBundleid", nBundleid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/bundletab`, { params }));
        return res;
      } catch (err) {
        this.tost.openSnackBar(`Failed to fetch ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return [];
      }
    });
  }
  assignBundle(mdl) {
    return __async(this, null, function* () {
      console.log("alok", mdl);
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/bundlesassignment`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar("Succesfully " + res.value, SNACKBAR_TYPES.DEFAULT);
          return res;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Assign failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return { msg: 1, value: "Bundle creation failed" };
      }
    });
  }
  assignCustomBundle(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/custombundlesassignment`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return res;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Assign failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return { msg: 1, value: "Bundle creation failed" };
      }
    });
  }
  unassignBundle(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/bundlesunassignment`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Un-assign failed ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  viewCustombundles(nCaseid, jBDids) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        params = params.set("nCaseid", nCaseid);
        params = params.set("jBDids", JSON.stringify(jBDids));
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/assign/viewcustombundle`, { params }));
        return res;
      } catch (err) {
        this.tost.error(`Failed to fetch ${ErrorHandlerUtil.getErrorMessage(err)}`);
        return [];
      }
    });
  }
  viewContact(jBDids) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        params = params.set("jBDids", JSON.stringify(jBDids));
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/assign/viewcontact`, { params }));
        return res;
      } catch (err) {
        this.tost.error(`Failed to fetch ${ErrorHandlerUtil.getErrorMessage(err)}`);
        return [];
      }
    });
  }
  viewTask(jBDids, cTasktype) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        params = params.set("jBDids", JSON.stringify(jBDids));
        params = params.set("cTasktype", cTasktype);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/assign/viewTask`, { params }));
        return res;
      } catch (err) {
        this.tost.error(`Failed to fetch ${ErrorHandlerUtil.getErrorMessage(err)}`);
        return [];
      }
    });
  }
  viewTag(jBDids) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        params = params.set("jBDids", JSON.stringify(jBDids));
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/assign/viewtag`, { params }));
        return res;
      } catch (err) {
        this.tost.error(`Failed to fetch ${ErrorHandlerUtil.getErrorMessage(err)}`);
        return [];
      }
    });
  }
  assignContact(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/assignContact`, mdl));
        if (res?.msg === 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return false;
      }
    });
  }
  assigntag(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/assigntag`, mdl));
        if (res?.msg === 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return false;
      }
    });
  }
  assignTask(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/assignTask`, mdl));
        if (res?.msg === 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return false;
      }
    });
  }
  unassigntag(nTagid, jBDids) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/unassigntag`, { nTagid, jBDids }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return { msg: 1, value: "Fatch failed" };
      }
    });
  }
  unassigntask(nTaskid, jBDids) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/unassigntask`, { nTaskid, jBDids }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return { msg: 1, value: "Fatch failed" };
      }
    });
  }
  unassignContact(nContactid, jBDids) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/unassigncontact`, { nContactid, jBDids }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return { msg: 1, value: "Fatch failed" };
      }
    });
  }
  checkIssuetag(nSectionid, nBundleid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("nBundleid", nBundleid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/checkissuetag`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return FILEEXPLORER_CONFIG.DEFAULT_DISPLAY_RES;
      }
    });
  }
  getContactList(nCaseid, nSectionid, nBundleid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("nCaseid", nCaseid);
        params = params.set("nBundleid", nBundleid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/getdisplaycontact`, { params }));
        return res[0];
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  getTagList(nCaseid, nSectionid, nBundleid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("nCaseid", nCaseid);
        params = params.set("nBundleid", nBundleid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/getdisplaytag`, { params }));
        return res[0];
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  getIssueList(nCaseid, nSectionid, nBundleid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("nCaseid", nCaseid);
        params = params.set("nBundleid", nBundleid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/getdisplayissue`, { params }));
        return res[0];
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  getFileList(nSectionid, nContactid, nIssueid, nTagid, jFilter) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("nContactid", nContactid);
        params = params.set("nIssueid", nIssueid);
        params = params.set("nTagid", nTagid);
        params = params.set("jFilter", JSON.stringify(jFilter || []));
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/getdisplayfiles`, { params }));
        return res[0];
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  checkAssignBundleExists(nSectionid, nBundleid, jFiles) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("nBundleid", nBundleid);
        params = params.set("jFiles", JSON.stringify(jFiles));
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/assign/checkassignbundleexists`, { params }));
        return res[0];
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  downloadFiles(nCaseid, nSectionid, jFiles, jFolders, nDTaskid) {
    return __async(this, null, function* () {
      const nUserid = yield this.sStore.getUserId();
      const sizeDetail = yield this.downloadService.getApproximateUrl({ nCaseid, nSectionid, jFiles, jFolders, nMasterid: nUserid, isHyperlink: false });
      if (sizeDetail.isValidForStream || environment.name === "localdocker") {
        const link = document.createElement("a");
        link.href = `${environment.downloadservice}/download/downloadfile?nCaseid=${nCaseid}&nSectionid=${nSectionid}&jFiles=${jFiles}&jFolders=${jFolders}&nMasterid=${nUserid}&nDTaskid=${nDTaskid || null}`;
        link.setAttribute("download", "folder");
        document.body.appendChild(link);
        link.click();
        link.remove();
        return 1;
      } else {
        const res = yield this.downloadService.downloadFiles({ nCaseid, nSectionid, jFiles, jFolders, isHyperlink: false });
        return res?.msg === 1 ? 2 : 0;
      }
    });
  }
  getFilelinks(nBundledetailid, cFlag) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nBundledetailid", nBundledetailid);
        params = params.set("cFlag", cFlag);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/file_links`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  convertFile(nBundledetailid, nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.uploadservice}/fileconvert/convertfile`, { nBundledetailid, nCaseid }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  convertFile_multi(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.uploadservice}/fileconvert/convertfile_multi`, mdl));
        if (res?.msg === 1) {
          this.tost.success(res.value);
          return res;
        } else {
          this.tost.error(res.value);
        }
      } catch (err) {
        this.tost.error(`Failed to fetch data ${ErrorHandlerUtil.getErrorMessage(err)}`);
      }
    });
  }
  getSharedUser(nBundledetailid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nBundledetailid", nBundledetailid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/locationshare/users`, { params }));
        if (res?.msg === -1) {
          return null;
        }
      } catch (error) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(error));
        res = null;
      }
      return res;
    });
  }
  ocrFile(nBundledetailid, nOcrtype) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.uploadservice}/ocr/ocrfile`, { nBundledetailid, nOcrtype }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  fetchUploadDetail(nUPid, nCaseid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nUPid", nUPid);
        params = params.set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/upload/uploadfilter`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  getBundleparentIds(nBundleid, nSectionid, nUPid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("nBundleid", nBundleid);
        params = params.set("nUPid", nUPid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/getBundleparentIds`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  sharedFileData(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/sharesectionbundle`, mdl));
        if (res?.msg === 1) {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.DEFAULT);
          return true;
        } else {
          this.tost.openSnackBar(res.value, SNACKBAR_TYPES.ERROR);
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Faile to share ${ErrorHandlerUtil.getErrorMessage(err)}`, SNACKBAR_TYPES.ERROR);
        return false;
      }
    });
  }
  getSharedBundlesUsers(nSectionid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/getbundlesharedusers`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  getSharedBundles(nSectionid, nUserid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("nUserid", nUserid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/getbundleshared`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  getshareduserby_bundleid(nSectionid, nBundleid, nBundledetailid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("nBundleid", nBundleid);
        params = params.set("nBundledetailid", nBundledetailid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/getshareduserby_bundleid`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  getFileTypes(jBids, jBDids, nSectionid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid);
        params = params.set("jBids", jBids);
        params = params.set("jBDids", jBDids);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/get_filetypes`, { params }));
        return res;
      } catch (err) {
        this.tost.error(`Failed to fetch data ${ErrorHandlerUtil.getErrorMessage(err)}`);
        return [];
      }
    });
  }
  getDownloadFiles(nDTaskid, nCaseid, nSectionid, jFolders, jFiles, nBundleid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nSectionid", nSectionid).set("nCaseid", nCaseid);
        if (nBundleid) {
          params = params.set("nBundleid", nBundleid);
        }
        if (nDTaskid) {
          params = params.set("nDTaskid", nDTaskid);
        }
        params = params.set("jFolders", jFolders);
        params = params.set("jFiles", jFiles);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/download_selected_files`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  getDownloadUpdateSerial(nDTaskid, nBundleid, nBundledetailid, nNIndex) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nBundledetailid", nBundledetailid || "").set("nBundleid", nBundleid || "").set("nDTaskid", nDTaskid);
        params = params.set("nNIndex", nNIndex);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/bundles/download_update_serial`, { params }));
        return res;
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return [];
      }
    });
  }
  viewFileMetadata(jBDids) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams();
        params = params.set("jBDids", jBDids);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/assign/file_metadata`, { params }));
        return res;
      } catch (err) {
        this.tost.error(`Failed to fetch ${ErrorHandlerUtil.getErrorMessage(err)}`);
        return [];
      }
    });
  }
  insertRecent(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/bundles-creations/insert/recent`, mdl));
        if (res?.msg === 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        this.tost.error(ErrorHandlerUtil.getErrorMessage(err));
        return false;
      }
    });
  }
  fileTransfer(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/assign/bundlestransfer`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar("Succesfully " + res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Assign failed ${err}`, "");
        return { msg: 1, value: "Bundle creation failed" };
      }
    });
  }
  static {
    this.\u0275fac = function MyfileService_Factory(t) {
      return new (t || _MyfileService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService), \u0275\u0275inject(DownloadService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _MyfileService, factory: _MyfileService.\u0275fac, providedIn: "root" });
  }
};

export {
  FILEEXPLORER_EVENTS,
  FILEEXPLORER_ACTION_TYPES,
  FILEEXPLORER_DIALOG_RESULTS,
  FILEEXPLORER_DIALOG_TYPES,
  FILEEXPLORER_FOLDER_TYPES,
  FILEEXPLORER_CONFIG,
  MyfileService
};
//# sourceMappingURL=chunk-M4TJ3SSY.js.map
