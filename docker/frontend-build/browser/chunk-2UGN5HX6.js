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
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/indexing/indexing.service.ts
var IndexingService = class _IndexingService {
  constructor(sStore, http, tost) {
    this.sStore = sStore;
    this.http = http;
    this.tost = tost;
  }
  generateIndexing(nCaseid, cFilename, nSectionid, cHyperlinktype, isCoverpg, isIndexpg, column) {
    return __async(this, null, function* () {
      try {
        const params = { nCaseid, nSectionid, cFilename, cHyperlinktype, column, bCoverpg: isCoverpg, bIndexpg: isIndexpg };
        let res = yield firstValueFrom(this.http.post(`${environment.indexservice}/generateindex/indexdata`, params));
        if (res && res.msg == 1) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        console.error(err);
        return false;
      }
    });
  }
  static {
    this.\u0275fac = function IndexingService_Factory(t) {
      return new (t || _IndexingService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _IndexingService, factory: _IndexingService.\u0275fac, providedIn: "root" });
  }
};

export {
  IndexingService
};
//# sourceMappingURL=chunk-2UGN5HX6.js.map
