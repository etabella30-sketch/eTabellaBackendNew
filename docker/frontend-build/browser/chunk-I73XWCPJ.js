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

// src/app/userpanel/services/export/export.service.ts
var ExportService = class _ExportService {
  constructor(http, tost) {
    this.http = http;
    this.tost = tost;
  }
  getFilelist(jFiles, jFolders) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("jFiles", jFiles);
      params = params.set("jFolders", jFolders);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/export/getfiledata`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getExportlist(nCaseid, nEDid, nExportid, cSortby) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("nEDid", nEDid);
      params = params.set("nExportid", nExportid);
      params = params.set("cSortby", cSortby);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/export/getexportdata`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  clearallExport(nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/export/clearall`, { nCaseid }));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value);
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (error) {
        this.tost.openSnackBar("Failed to clear all exports", "E");
        console.error(error);
        return false;
      }
    });
  }
  deleteExport(nCaseid, nEDid, nExportid, cType) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/export/deleteexport`, { nCaseid, nEDid, nExportid, cType }));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value);
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (error) {
        console.error(error);
        this.tost.openSnackBar("Failed to delete export", "E");
        return false;
      }
    });
  }
  exportFilewithannot(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.exportservice}/export-file/exportwithannot`, mdl));
        console.log("exportwithannot", res);
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value);
          return res;
        } else {
          this.tost.openSnackBar(`Export Failed`, "E");
          return res;
        }
      } catch (error) {
        console.error(error);
        this.tost.openSnackBar(`Export Failed ${error}`, "E");
        return { msg: -1, value: "Export Failed", error };
      }
    });
  }
  createGroupFileName(fileNames) {
    const fileList = fileNames.split(",").map((f) => f.trim());
    if (fileList.length === 1) {
      return fileList[0];
    }
    const firstFileName = fileList[0].split(".")[0];
    const extension = fileList[0].split(".").pop();
    const otherFilesCount = fileList.length - 1;
    let groupName = `${firstFileName} and ${otherFilesCount} other${otherFilesCount > 1 ? "s" : ""}`;
    return `${groupName}.${extension}`;
  }
  // sanitizeFileName(fileName: string): string {
  //   // Remove or replace characters that might cause issues
  //   return fileName.replace(/[<>:"/\\|?*]/g, '_');
  // }
  sanitizeFileName(fileName) {
    return fileName.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[<>:"/\\|?*]/g, "_").trim();
  }
  downloadFile(cPath, filenames) {
    return __async(this, null, function* () {
      try {
        const groupFileName = this.createGroupFileName(filenames);
        const sanitizedFileName = this.sanitizeFileName(groupFileName);
        const shortenedFileName = this.shortenFileName(sanitizedFileName, 100, cPath);
        const downloadUrl = `${environment.exportservice}/download?cPath=${encodeURIComponent(cPath)}&cFilename=${encodeURIComponent(shortenedFileName)}`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.addEventListener("load", () => {
          console.log("Download started");
        });
        link.addEventListener("error", () => {
          console.error("Error downloading file");
        });
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error initiating download:", error);
      }
    });
  }
  shortenFileName(fileName, maxLength = 50, cPath) {
    let extension = fileName.split(".").pop();
    const pathExtension = cPath.split(".").pop();
    if (extension.toUpperCase() != pathExtension.toUpperCase()) {
      if (pathExtension) {
        extension = pathExtension;
        fileName += `.${extension}`;
      }
    } else if (fileName.split(".").length > 2) {
      const parts = fileName.split(".");
      extension = parts.pop();
      fileName = parts.join(".") + "." + extension;
    } else {
      extension = extension || "";
    }
    const name = fileName.substring(0, fileName.length - extension.length - 1);
    if (name.length + extension.length + 1 <= maxLength) {
      return fileName;
    }
    const halfMax = Math.floor((maxLength - extension.length - 4) / 2);
    const firstHalf = name.slice(0, halfMax);
    const secondHalf = name.slice(-halfMax);
    return `${firstHalf}...${secondHalf}.${extension}`;
  }
  retryExport(nExportid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nExportid", nExportid.toString());
        const res = yield firstValueFrom(this.http.post(`${environment.exportservice}/export-file/retryexport`, params));
        if (res.msg != 1) {
          throw new Error(res.value || "Failed to retry export");
        }
        this.tost.success(res.value || "Export retried successfully");
        return true;
      } catch (error) {
        this.tost.openSnackBar(error.message || "Failed to retry exports", "E");
        console.error(error);
        return false;
      }
    });
  }
  static {
    this.\u0275fac = function ExportService_Factory(t) {
      return new (t || _ExportService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ExportService, factory: _ExportService.\u0275fac, providedIn: "root" });
  }
};

export {
  ExportService
};
//# sourceMappingURL=chunk-I73XWCPJ.js.map
