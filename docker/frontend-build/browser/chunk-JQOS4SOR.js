import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient
} from "./chunk-EVEACXQX.js";
import {
  __async,
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/services/advance-search/advance-search.service.ts
var AdvanceSearchService = class _AdvanceSearchService {
  constructor(http) {
    this.http = http;
    this.url = environment.elasticSearchService;
  }
  searchBundle(searchTerm, nCaseid, isCaseSensitive, isStartWith, isWholeWord, jIssues, jImpact, jRelevance, jMarkup, nBundleid) {
    return __async(this, null, function* () {
      try {
        const obj = {
          nCaseid,
          isCaseSensitive,
          isStartWith,
          isWholeWord,
          searchTerm
        };
        if (jImpact?.length) {
          obj.jImpact = jImpact;
        }
        if (jRelevance?.length) {
          obj.jRelevance = jRelevance;
        }
        if (jIssues?.length) {
          obj.jIssues = jIssues;
        }
        if (jMarkup?.length) {
          obj.jMarkup = jMarkup;
        }
        if (!obj?.jMarkup?.length && (jImpact?.length || jRelevance?.length || jIssues?.length)) {
          obj.jMarkup = ["QF", "F"];
        }
        if (nBundleid) {
          obj.nBundleid = nBundleid;
        }
        const res = yield firstValueFrom(this.http.post(`${this.url}/search/bundles`, obj));
        return res;
      } catch (error) {
        console.error(error);
        return { msg: -1, bundleIds: [], error };
      }
    });
  }
  search(searchTerm, nCaseid, isCaseSensitive, isStartWith, isWholeWord, page, pageSize, jIssues, jImpact, jRelevance, jMarkup, nBundleid, nSectionid, cFolderType) {
    return __async(this, null, function* () {
      try {
        const obj = {
          nCaseid,
          isCaseSensitive,
          isStartWith,
          isWholeWord,
          page,
          pageSize,
          searchTerm
        };
        if (jImpact?.length) {
          obj.jImpact = jImpact;
        }
        if (jRelevance?.length) {
          obj.jRelevance = jRelevance;
        }
        if (jIssues?.length) {
          obj.jIssues = jIssues;
        }
        if (jMarkup?.length) {
          obj.jMarkup = jMarkup;
        }
        if (!obj?.jMarkup?.length && (jImpact?.length || jRelevance?.length || jIssues?.length)) {
          obj.jMarkup = ["QF", "F"];
        }
        if (nBundleid) {
          obj.nBundleid = nBundleid;
        }
        obj.nSectionid = nSectionid;
        obj.cFolderType = cFolderType;
        const res = yield firstValueFrom(this.http.post(`${this.url}/search`, obj));
        return res;
      } catch (error) {
        console.error(error);
        return { msg: -1, data: [], error };
      }
    });
  }
  searchSummary(searchTerm, nCaseid, isCaseSensitive, isStartWith, isWholeWord, jIssues, jImpact, jRelevance, jMarkup, nBundleid, nSectionid, cFolderType) {
    return __async(this, null, function* () {
      try {
        const obj = {
          nCaseid,
          isCaseSensitive,
          isStartWith,
          isWholeWord,
          searchTerm
        };
        if (jImpact?.length) {
          obj.jImpact = jImpact;
        }
        if (jRelevance?.length) {
          obj.jRelevance = jRelevance;
        }
        if (jIssues?.length) {
          obj.jIssues = jIssues;
        }
        if (jMarkup?.length) {
          obj.jMarkup = jMarkup;
        }
        if (!obj?.jMarkup?.length && (jImpact?.length || jRelevance?.length || jIssues?.length)) {
          obj.jMarkup = ["QF", "F"];
        }
        if (nBundleid) {
          obj.nBundleid = nBundleid;
        }
        obj.nSectionid = nSectionid;
        obj.cFolderType = cFolderType;
        const res = yield firstValueFrom(this.http.post(`${this.url}/search/summary`, obj));
        return res;
      } catch (error) {
        console.error(error);
        return { msg: -1, totalBDIDs: 0, error };
      }
    });
  }
  searchDetail(searchTerm, nCaseid, isCaseSensitive, isStartWith, isWholeWord, nBundledetailid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.url}/search/detail`, {
          nCaseid,
          isCaseSensitive,
          isStartWith,
          isWholeWord,
          nBundledetailid,
          searchTerm
        }));
        return res;
      } catch (error) {
        console.error(error);
        return { msg: -1, totalMatches: 0, totalPages: 0, pages: [], error };
      }
    });
  }
  static {
    this.\u0275fac = function AdvanceSearchService_Factory(t) {
      return new (t || _AdvanceSearchService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AdvanceSearchService, factory: _AdvanceSearchService.\u0275fac, providedIn: "root" });
  }
};

export {
  AdvanceSearchService
};
//# sourceMappingURL=chunk-JQOS4SOR.js.map
