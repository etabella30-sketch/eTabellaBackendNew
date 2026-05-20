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

// src/app/userpanel/services/user-dashboard/userdashboard.service.ts
var UserdashboardService = class _UserdashboardService {
  constructor(http) {
    this.http = http;
    this.dashboardCache = /* @__PURE__ */ new Map();
    this.cacheTimestamps = /* @__PURE__ */ new Map();
    this.cacheExpiryMs = environment.cacheExpiryMs || 60 * 60 * 1e3;
  }
  getDashboardlist(pageNumber) {
    return __async(this, null, function* () {
      const now = Date.now();
      const cachedTimestamp = this.cacheTimestamps.get(pageNumber);
      if (this.dashboardCache.has(pageNumber) && cachedTimestamp && now - cachedTimestamp < this.cacheExpiryMs) {
        return this.dashboardCache.get(pageNumber) ?? Promise.reject(new Error("Cache entry not found"));
      }
      const params = new HttpParams().set("pageNumber", pageNumber);
      const resultPromise = (() => __async(this, null, function* () {
        try {
          const response = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/user-dashboard/caselist`, { params }));
          return this.arrangeDashboardData(response);
        } catch (error) {
          this.dashboardCache.delete(pageNumber);
          this.cacheTimestamps.delete(pageNumber);
          throw new Error(`Error fetching dashboard list: ${ErrorHandlerUtil.getErrorMessage(error)}`);
        }
      }))();
      this.dashboardCache.set(pageNumber, resultPromise);
      this.cacheTimestamps.set(pageNumber, now);
      return resultPromise;
    });
  }
  invalidateCache() {
    this.dashboardCache.clear();
    this.cacheTimestamps.clear();
  }
  getDashInfo() {
    return __async(this, null, function* () {
      try {
        return yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/user-dashboard/dashinfo`));
      } catch (error) {
        throw new Error(`Error fetching dashboard info: ${ErrorHandlerUtil.getErrorMessage(error)}`);
      }
    });
  }
  arrangeDashboardData(response) {
    if (response?.length !== 3) {
      return [];
    }
    const caseList = response[0];
    for (const team of response[1]) {
      team.users = response[2].filter((user) => user.teams.includes(team.nTeamid));
    }
    for (const caseItem of caseList) {
      caseItem.teams = response[1].filter((team) => team.nCaseid === caseItem.nCaseid);
    }
    return caseList;
  }
  static {
    this.\u0275fac = function UserdashboardService_Factory(t) {
      return new (t || _UserdashboardService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _UserdashboardService, factory: _UserdashboardService.\u0275fac, providedIn: "root" });
  }
};

export {
  UserdashboardService
};
//# sourceMappingURL=chunk-RXCKHUOJ.js.map
