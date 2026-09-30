import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  HttpClient
} from "./chunk-EVEACXQX.js";
import {
  __async,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/core/services/auth-validation/auth-validation.service.ts
var CACHE_TTL_MS = 5 * 60 * 1e3;
var AuthValidationService = class _AuthValidationService {
  constructor(http, secureStorage) {
    this.http = http;
    this.secureStorage = secureStorage;
    this.cachedResult = null;
    this.cacheTimestamp = 0;
    this.pendingValidation = null;
  }
  validate() {
    return __async(this, null, function* () {
      if (localStorage.getItem("force_logout")) {
        console.warn("AuthValidationService: Force logout detected. Invalidating session.");
        localStorage.removeItem("force_logout");
        this.clearCache();
        return { isValid: false, userDetail: null };
      }
      const cookieLogin = yield this.secureStorage.checkLogin();
      let userDetail = null;
      if (cookieLogin) {
        userDetail = yield this.secureStorage.getUserInfo();
      }
      return {
        isValid: cookieLogin,
        userDetail
      };
    });
  }
  clearCache() {
    this.cachedResult = null;
    this.cacheTimestamp = 0;
    this.pendingValidation = null;
  }
  static {
    this.\u0275fac = function AuthValidationService_Factory(t) {
      return new (t || _AuthValidationService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(SecureStorageService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AuthValidationService, factory: _AuthValidationService.\u0275fac, providedIn: "root" });
  }
};

export {
  AuthValidationService
};
//# sourceMappingURL=chunk-ZDDERD6Z.js.map
