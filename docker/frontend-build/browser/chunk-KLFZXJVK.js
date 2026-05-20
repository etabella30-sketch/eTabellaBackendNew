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

// src/app/shared/services/hyperlink/hyperlink.service.ts
var HyperlinkService = class _HyperlinkService {
  constructor(http, tost, sStore, downloadService) {
    this.http = http;
    this.tost = tost;
    this.sStore = sStore;
    this.downloadService = downloadService;
    this.url = `${environment.downloadapiservice}`;
  }
  downloadFiles(mdl) {
    return __async(this, null, function* () {
      let nUserid = yield this.sStore.getUserId();
      const sizeDetail = yield this.downloadService.getApproximateUrl({ nCaseid: mdl.nCaseid, nSectionid: mdl.nSectionid, jFiles: mdl.jFiles, jFolders: mdl.jFolders, nMasterid: nUserid, isHyperlink: true });
      if (sizeDetail.isValidForStream || environment.name == "localdocker") {
        var link = document.createElement("a");
        link.href = `${environment.downloadservice}/download/hyperlink/downloadfile?nCaseid=${mdl.nCaseid}&nSectionid=${mdl.nSectionid}&jFiles=${mdl.jFiles}&jFolders=${mdl.jFolders}&nMasterid=${nUserid}`;
        link.setAttribute("download", "folder");
        link.addEventListener("load", function() {
          console.log("Download started");
        });
        link.addEventListener("error", function() {
          console.error("Error downloading file");
        });
        link.addEventListener("click", function() {
          console.log("Download link clicked");
        });
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const res = yield this.downloadBatchFiles({ nCaseid: mdl.nCaseid, nSectionid: mdl.nSectionid, jFolders: mdl.jFolders, jFiles: mdl.jFiles, isHyperlink: true });
        return res?.msg == 1 ? 2 : 0;
      }
    });
  }
  downloadBatchFiles(mdl) {
    return __async(this, null, function* () {
      debugger;
      try {
        const res = yield firstValueFrom(this.http.post(`${this.url}/startdownloadhyperlink`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.error(err["error"]?.message || "Error downloading files");
        return { nDPid: "", msg: 0, value: "Error download file" };
      }
    });
  }
  static {
    this.\u0275fac = function HyperlinkService_Factory(t) {
      return new (t || _HyperlinkService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService), \u0275\u0275inject(SecureStorageService), \u0275\u0275inject(DownloadService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _HyperlinkService, factory: _HyperlinkService.\u0275fac, providedIn: "root" });
  }
};

export {
  HyperlinkService
};
//# sourceMappingURL=chunk-KLFZXJVK.js.map
