import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  __async,
  __spreadValues,
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/rt/services/issue/issue.service.ts
var IssueService = class _IssueService {
  constructor(http, tost) {
    this.http = http;
    this.tost = tost;
  }
  fetchIssueList(mdl) {
    return __async(this, null, function* () {
      let res = [];
      let params = new HttpParams().set("nCaseid", mdl.nCaseid);
      params = params.set("nSessionid", mdl.nSessionid);
      params = params.set("nIDid", mdl.nIDid);
      params = params.set("nUserid", mdl.nUserid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/issuelist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  fetchIssueListV2(mdl) {
    return __async(this, null, function* () {
      let res = [[], []];
      let params = new HttpParams().set("nCaseid", mdl.nCaseid);
      params = params.set("nSessionid", mdl.nSessionid);
      params = params.set("nIDid", mdl.nIDid);
      params = params.set("nUserid", mdl.nUserid);
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/issuelist_V2`, { params }));
      } catch (error) {
        console.error(error);
        res = [[], []];
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
  categoryCreation(frm) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/insertCategory`, frm));
        if (res[0]["msg"] == 1) {
          this.tost.openSnackBar("Category created successfully", "");
        } else {
          this.tost.openSnackBar(res[0]["message"], "E");
        }
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  issueCreation(frm) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/insertIssue`, frm));
        if (res[0]["msg"] == 1) {
          this.tost.openSnackBar("Issue created successfully", "");
          return true;
        } else {
          this.tost.openSnackBar(res[0]["message"], "E");
          return false;
        }
      } catch (error) {
        console.error(error);
        return false;
      }
    });
  }
  issueUpdate(frm) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.put(`${environment.cloudUrl2}${environment.realtimeserive}/issue/updateIssue`, frm));
        if (res[0]["msg"] == 1) {
          this.tost.openSnackBar("Issue updated successfully", "");
          return true;
        } else {
          this.tost.openSnackBar(res[0]["message"], "E");
          return false;
        }
      } catch (error) {
        console.error(error);
        return false;
      }
    });
  }
  issueDelete(nIid) {
    return __async(this, null, function* () {
      const url = `${environment.cloudUrl2}${environment.realtimeserive}/issue/deleteIssue`;
      try {
        const res = yield firstValueFrom(this.http.delete(url, {
          body: { nIid }
        }));
        if (res[0]["msg"] == 1) {
          this.tost.openSnackBar("Issue deleted successfully");
          return true;
        } else {
          this.tost.openSnackBar(res[0]["message"], "E");
          return false;
        }
      } catch (error) {
        console.error(error);
        this.tost.openSnackBar(error.message, "E");
        return false;
      }
    });
  }
  fetchIssueByid(mdl) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", mdl.nCaseid);
      params = params.set("nSessionid", mdl.nSessionid);
      params = params.set("nIid", mdl.nIid);
      params = params.set("nUserid", mdl.nUserid);
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/issue/detail`, { params }));
        return res;
      } catch (error) {
        console.error(error);
        return [];
      }
    });
  }
  deleteMultiIssue(jIids) {
    return __async(this, null, function* () {
      const url = `${environment.cloudUrl2}${environment.realtimeserive}/issue/delete/multi/issue`;
      try {
        const res = yield firstValueFrom(this.http.delete(url, {
          body: {
            jIids
          }
        }));
        if (res[0]["msg"] == 1) {
          this.tost.openSnackBar("Issues deleted successfully");
          return true;
        } else {
          this.tost.openSnackBar(res[0]["message"], "E");
          return false;
        }
      } catch (error) {
        console.error(error);
        this.tost.openSnackBar(error.message, "E");
        return false;
      }
    });
  }
  issueSecquence(nUserid, frm) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/sequence`, __spreadValues({ nUserid }, frm)));
        if (res[0]["msg"] == 1) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error(error);
        return false;
      }
    });
  }
  claimSecquence(nUserid, frm) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/claim/sequence`, __spreadValues({ nUserid }, frm)));
        if (res[0]["msg"] == 1) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error(error);
        return false;
      }
    });
  }
  /** Batch-upserts the user's QFact-only ordering / visibility prefs.
   *  Called once when Manage Claims & Issues' QFact mode is exited (or the
   *  dialog closes) with only the issues whose state has changed since
   *  QFact mode opened. */
  qfactSecquence(nUserid, frm) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/qfact/sequence`, __spreadValues({ nUserid }, frm)));
        return res?.[0]?.["msg"] == 1;
      } catch (error) {
        console.error(error);
        return false;
      }
    });
  }
  /** Sibling of qfactSecquence — same dialog-close batch flushes the user's
   *  QFact claim ordering changes here. Never touches the shared Fact-side
   *  RClaimMaster.nSequence. */
  qfactClaimSecquence(nUserid, frm) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/issue/qfact/claim/sequence`, __spreadValues({ nUserid }, frm)));
        return res?.[0]?.["msg"] == 1;
      } catch (error) {
        console.error(error);
        return false;
      }
    });
  }
  claimUpdate(frm) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.put(`${environment.cloudUrl2}${environment.realtimeserive}/issue/updateClaimDetail`, frm));
        if (res["msg"] == 1) {
          this.tost.openSnackBar("Claim updated successfully", "");
          return true;
        } else {
          this.tost.openSnackBar(res["message"], "E");
          return false;
        }
      } catch (error) {
        console.error(error);
        return false;
      }
    });
  }
  claimDelete(nICid) {
    return __async(this, null, function* () {
      const url = `${environment.cloudUrl2}${environment.realtimeserive}/issue/deleteClaim`;
      try {
        const res = yield firstValueFrom(this.http.delete(url, {
          body: { nICid }
        }));
        if (res[0]["msg"] == 1) {
          this.tost.openSnackBar("Issue deleted successfully");
          return true;
        } else {
          this.tost.openSnackBar(res[0]["message"], "E");
          return false;
        }
      } catch (error) {
        console.error(error);
        this.tost.openSnackBar(error.message, "E");
        return false;
      }
    });
  }
  getPreviousSessions(nCaseid, nUserid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid || 0);
      params = params.set("nUserid", nUserid || 0);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`http://localhost:5000/session/getsessionsbycaseid`, { params }));
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
  downloadFile(filePath) {
    return this.http.get(filePath, { responseType: "blob" });
  }
  static {
    this.\u0275fac = function IssueService_Factory(t) {
      return new (t || _IssueService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _IssueService, factory: _IssueService.\u0275fac, providedIn: "root" });
  }
};

export {
  IssueService
};
//# sourceMappingURL=chunk-3LLM6WVC.js.map
