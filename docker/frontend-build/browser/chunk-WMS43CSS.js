import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient
} from "./chunk-EVEACXQX.js";
import {
  __async,
  __spreadProps,
  __spreadValues,
  firstValueFrom,
  map,
  switchMap,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/core/services/login/login.service.ts
var LoginService = class _LoginService {
  constructor(http, secureStorage, tost) {
    this.http = http;
    this.secureStorage = secureStorage;
    this.tost = tost;
    this.isinvalid = false;
    this.broweserid = "";
    this.initBroweserid();
  }
  initBroweserid() {
    this.broweserid = this.secureStorage.getStorage("browserid");
    if (!this.broweserid) {
      this.broweserid = this.secureStorage.getOrCreateBrowserUniqueId();
      this.secureStorage.setStorage("browserid", this.broweserid);
    }
  }
  login(mdl, keepMeLogin) {
    return __async(this, null, function* () {
      this.isinvalid = false;
      this.initBroweserid();
      try {
        mdl.cBroweserid = this.broweserid;
        mdl.cToken = yield this.secureStorage.getFCMToken();
        mdl.bKeepMeLogin = keepMeLogin;
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.authservice}/auth/signin`, mdl));
        if (res && res.msg == 1) {
          if (res.token) {
            this.secureStorage.setEncryptedStorage("temp_socket_token", res.token);
          }
          localStorage.removeItem("force_logout");
          this.secureStorage.setUserInfo(res.userDetail, keepMeLogin ? res.expir_limit : 0);
          yield this.secureStorage.setJWTToken(res.token, keepMeLogin ? res.expir_limit : 0);
          return true;
        } else {
          this.isinvalid = true;
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Login failed ${err && err["message"] ? err["message"] : JSON.stringify(err)}`, "E", 1e4);
        return false;
      }
    });
  }
  getNetworkInfo() {
    try {
      return {
        userAgent: navigator.userAgent,
        // Browser and OS details
        platform: navigator.platform,
        // Platform (Win32, Linux, etc.)
        language: navigator.language,
        // User's preferred language
        online: navigator.onLine
        // Online status
      };
    } catch (error) {
      return {};
    }
  }
  getIPAddress() {
    return this.http.get("https://api64.ipify.org?format=json").pipe(map((response) => response.ip));
  }
  login2(user) {
    const networkInfo = this.getNetworkInfo();
    return this.getIPAddress().pipe(
      map((ipAddress) => __spreadValues(__spreadProps(__spreadValues({}, user), {
        ipAddress
      }), networkInfo)),
      switchMap((loginData) => this.http.post("/api/login", loginData))
      // Replace with your API endpoint
    );
  }
  static {
    this.\u0275fac = function LoginService_Factory(t) {
      return new (t || _LoginService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(SecureStorageService), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LoginService, factory: _LoginService.\u0275fac });
  }
};

export {
  LoginService
};
//# sourceMappingURL=chunk-WMS43CSS.js.map
