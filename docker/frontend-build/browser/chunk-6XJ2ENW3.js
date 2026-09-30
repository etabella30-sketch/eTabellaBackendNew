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
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/services/download/download.service.ts
var DownloadService = class _DownloadService {
  constructor(http, tost) {
    this.http = http;
    this.tost = tost;
    this.urlApi = `${environment.downloadapiservice}`;
    this.url = `${environment.downloadservice}`;
  }
  getDownloadJobs(nCaseid, PageNumber, cSortBy, nDPid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid).set("PageNumber", PageNumber.toString()).set("cSortBy", cSortBy);
      try {
        if (nDPid) {
          params = params.set("nDPid", nDPid);
        }
        return yield firstValueFrom(this.http.get(`${this.urlApi}/getdownload`, { params }));
      } catch (error) {
        console.error("Error fetching download information:", error);
        this.tost.error("Error fetching download information");
        return [];
      }
    });
  }
  getDonwloadURL(nDPid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nDPid", nDPid);
      try {
        const { cUrl } = yield firstValueFrom(this.http.get(`${this.urlApi}/get/url`, { params }));
        return cUrl;
      } catch (error) {
        console.error("Error fetching presigned URL:", error);
        this.tost.error("Error fetching presigned URL");
        return null;
      }
    });
  }
  downloadFiles(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.urlApi}/startdownload`, mdl));
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
  retryJob(nDPid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.urlApi}/retryjob`, { nDPid }));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.error("Error retry");
        return { msg: 0, value: "Error Retry" };
      }
    });
  }
  deleteJob(nDPid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.urlApi}/delete`, { nDPid }));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.error("Error retry");
        return { msg: 0, value: "Error Delete" };
      }
    });
  }
  // async getApproximateUrl(mdl: { nCaseid: string, nSectionid: string, jFolders: string, jFiles: string,nMasterid:string }): Promise<{ msg: 1 | -1, cFinalSize: number, isValidForStream: boolean }> {
  //   const params = new HttpParams().set('nCaseid', mdl.nCaseid).set('nSectionid', mdl.nSectionid).set('jFolders', mdl.jFolders).set('jFiles', mdl.jFiles).set('nMasterid',mdl.nMasterid);
  getApproximateUrl(mdl) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCaseid", mdl.nCaseid).set("nSectionid", mdl.nSectionid).set("jFolders", mdl.jFolders).set("jFiles", mdl.jFiles).set("nMasterid", mdl.nMasterid).set("bIshyperlink", mdl.isHyperlink);
      try {
        const res = yield firstValueFrom(this.http.get(`${this.url}/download/approximate/size`, { params }));
        return res;
      } catch (error) {
        console.error("Error fetching approximate size:", error);
        this.tost.error("Error fetching approximate size");
        return null;
      }
    });
  }
  static {
    this.\u0275fac = function DownloadService_Factory(t) {
      return new (t || _DownloadService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DownloadService, factory: _DownloadService.\u0275fac, providedIn: "root" });
  }
};

export {
  DownloadService
};
//# sourceMappingURL=chunk-6XJ2ENW3.js.map
