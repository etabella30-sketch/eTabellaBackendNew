import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  __async,
  __spreadProps,
  __spreadValues,
  catchError,
  delay,
  firstValueFrom,
  interval,
  retryWhen,
  scan,
  tap,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/upload/upload.service.ts
var UploadService = class _UploadService {
  constructor(http) {
    this.http = http;
    this.uploadstep = 1;
    this.isreport = false;
    this.globalUrl = "";
    this.speed = 0;
    this.uploadedChunks = 0;
  }
  startUploadSpeedInterval() {
    clearInterval(this.intervalSubscription);
    this.intervalSubscription = interval(2e3).subscribe(() => {
      let totalbytesUploaded = this.uploadedChunks * (1024 * 1024 * 2);
      this.speed = totalbytesUploaded / 2;
      console.warn(`Current upload speed: ${(this.speed / 1024 / 1024).toFixed(2)} MB/s`, this.uploadedChunks);
      this.setValueToUploadChunk(0);
    });
  }
  setValueToUploadChunk(val) {
    this.uploadedChunks = val;
  }
  fetchCaseDetail(nCaseid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nCaseid", nCaseid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/upload/casedetail`, { params }));
        return res.length ? res[0] : { nCaseid: null, cCasename: "", cCaseno: "", dUpdateDt: "", cTeamname: "" };
      } catch (err) {
        return { nCaseid: null, cCasename: "", cCaseno: "", dUpdateDt: "", cTeamname: "" };
      }
    });
  }
  fetchSectionDetail(nSectionid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nSectionid", nSectionid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/upload/sectiondetail`, { params }));
        return res.length ? res[0] : { nSectionid: null, cFolder: "" };
      } catch (err) {
        return { nSectionid: null, cFolder: "" };
      }
    });
  }
  fetchBundleDetail(nBundleid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nBundleid", nBundleid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/upload/bundle`, { params }));
        return res.length ? res[0] : { nBundleid: null, cBundlename: "" };
      } catch (err) {
        return { nBundleid: null, cBundlename: "" };
      }
    });
  }
  checkDuplicacy(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/upload/checkduplicacy`, mdl));
        return res;
      } catch (err) {
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  checkDuplicacyBatch(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/upload/checkduplicacy`, mdl).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          // tap(res => {
          //   if (!res || res.msg !== 1) { // Check if the response is not as expected
          //     throw new Error('Invalid response.');
          //   }
          // }),
          catchError((err) => {
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        ))));
        return res ? res : { max: 0, msg: -1 };
      } catch (err) {
        return { max: 0, msg: -1 };
      }
    });
  }
  uploadLog(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/upload/uploadlog`, mdl).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          // tap(res => {
          //   if (!res || res.msg !== 1) { // Check if the response is not as expected
          //     throw new Error('Invalid response.');
          //   }
          // }),
          catchError((err) => {
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        ))));
        return res ? res : { max: 0, msg: -1 };
      } catch (err) {
        return { max: 0, msg: -1 };
      }
    });
  }
  checkStatus(identifier, nUPid, nCaseid, cPath, cTotal) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("identifier", identifier).set("nUPid", nUPid).set("nCaseid", nCaseid).set("cPath", cPath).set("cTotal", cTotal);
        const res = yield firstValueFrom(this.http.get(`${this.globalUrl}${environment.uploadservice}/upload/status`, { params }).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          tap((res2) => {
            if (!res2 || res2.msg !== 1) {
              throw new Error("Invalid response.");
            }
          }),
          catchError((err) => {
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        ))));
        this.setValueToUploadChunk(this.uploadedChunks + 1);
        return res ? res : { max: 0, msg: -1 };
      } catch (err) {
        return { max: 0, msg: -1 };
      }
    });
  }
  uploadChunk(mdl) {
    return __async(this, null, function* () {
      try {
        const formData = new FormData();
        formData.append("identifier", mdl.identifier);
        formData.append("chunkNumber", mdl.chunkNumber.toString());
        formData.append("nUPid", String(mdl.nUPid));
        formData.append("file", mdl.file);
        const res = yield firstValueFrom(this.http.post(`${this.globalUrl}${environment.uploadservice}/upload/upload-chunk`, formData).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          catchError((err) => {
            console.error("ERROR AT CATCH", err);
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        )), tap((res2) => {
          if (!res2 || res2.m !== 1) {
            throw new Error("Invalid response.");
          }
        })));
        this.setValueToUploadChunk(this.uploadedChunks + 1);
        return true;
      } catch (err) {
        console.error("Failed to upload chunk:", err);
        return false;
      }
    });
  }
  completUpload(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.globalUrl}${environment.uploadservice}/upload/complete-upload`, mdl).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          tap((res2) => {
            if (!res2 || res2.msg !== 1) {
              throw new Error("Invalid response.");
            }
          }),
          catchError((err) => {
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        ))));
        return true;
      } catch (err) {
        return false;
      }
    });
  }
  fetchReportSummary(nCaseid, filters, nUPid) {
    return __async(this, null, function* () {
      try {
        let params = new HttpParams().set("nCaseid", nCaseid);
        if (nUPid) {
          params = params.set("nUPid", nUPid);
        }
        try {
          if (filters.cAction.value) {
            params = params.set("cStatus", filters.cStatus.value);
          }
          if (filters.cDate.value) {
            params = params.set("dDate", filters.cDate.value);
          }
          if (filters.cStatus.value) {
            params = params.set("cStatus", filters.cStatus.value);
          }
          if (filters.cFormat.value) {
            params = params.set("cFiletype", filters.cFormat.value);
          }
          if (filters.cSearch) {
            params = params.set("cSearch", filters.cSearch);
          }
          if (filters.nSectionid) {
            params = params.set("nSectionid", filters.nSectionid);
          }
        } catch (error) {
        }
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/upload/uploadsummary`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  fetchReportDetail(nUPid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nUPid", nUPid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/upload/uploaddetail`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  fetchOCRDate(nUDid) {
    return __async(this, null, function* () {
      try {
        const params = new HttpParams().set("nUDid", nUDid);
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/upload/ocrdata`, { params }));
        return res;
      } catch (err) {
        return [];
      }
    });
  }
  getFileData(nUDid, file) {
    return __async(this, null, function* () {
      console.log("getFileData", nUDid);
      if (nUDid) {
        let res = yield this.fetchOCRDate(nUDid);
        let res1 = res && res.length ? res[0][0] : [];
        let res2 = res && res.length && res.length > 1 ? res[1] : [];
        if (res1) {
          if (res1.nOCRFiles == res1.nCompleted) {
            file.nOProgress = 0;
            file.ocrFiles = [];
          } else {
            if (file.cFiletype != "ZIP") {
              file.nFiles = res1.nOCRFiles;
            }
            file.nOProgress = res1.nOProgress;
            file.nOCRFiles = res1.nOCRFiles;
            file.nCompleted = res1.nCompleted;
            file.nFailed = res1.nFailed;
            file.ocrFiles = res2;
          }
        }
      }
    });
  }
  exportDetail(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.globalUrl}${environment.uploadservice}/exports/upload-report`, mdl).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          tap((res2) => {
            if (!res2 || res2.msg !== 1) {
              throw new Error("Invalid response.");
            }
          }),
          catchError((err) => {
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        ))));
        return true;
      } catch (err) {
        return false;
      }
    });
  }
  deleteFiles(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.delete(`${environment.uploadservice}/exports/delete-files`, { body: __spreadProps(__spreadValues({}, mdl), { jFiles: JSON.stringify(mdl.jFiles) }) }));
        return res;
      } catch (err) {
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  replacefile(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.globalUrl}${environment.coreservice}/upload/replacefile`, mdl).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          tap((res2) => {
            if (!res2 || res2.msg !== 1) {
              throw new Error("Invalid response.");
            }
          }),
          catchError((err) => {
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        ))));
        return true;
      } catch (err) {
        return false;
      }
    });
  }
  clearCompletes(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/upload/clear-completed`, mdl).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          tap((res2) => {
            if (!res2 || res2.msg !== 1) {
              throw new Error("Invalid response.");
            }
          }),
          catchError((err) => {
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        ))));
        return true;
      } catch (err) {
        return false;
      }
    });
  }
  updateStatus(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.globalUrl}${environment.uploadservice}/upload/set-upload-status`, mdl).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          tap((res2) => {
            if (!res2 || res2.msg !== 1) {
              throw new Error("Invalid response.");
            }
          }),
          catchError((err) => {
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        ))));
        return true;
      } catch (err) {
        return false;
      }
    });
  }
  uploadJobComplete(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${this.globalUrl}${environment.uploadservice}/upload/upload-job`, mdl).pipe(retryWhen((errors) => errors.pipe(
          scan((acc, error) => {
            if (acc >= 5) {
              throw new Error("Retry limit reached");
            }
            return acc + 1;
          }, 0),
          delay(1500),
          // Delay between retries
          tap((err) => {
            if (err.status === 404) {
              throw new Error("API endpoint not found.");
            }
          }),
          tap((res2) => {
            if (!res2 || res2.msg !== 1) {
              throw new Error("Invalid response.");
            }
          }),
          catchError((err) => {
            throw new Error("Unhandled error: " + err.message);
          })
          // Rethrow with additional error message
        ))));
        return true;
      } catch (err) {
        return false;
      }
    });
  }
  static {
    this.\u0275fac = function UploadService_Factory(t) {
      return new (t || _UploadService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _UploadService, factory: _UploadService.\u0275fac, providedIn: "root" });
  }
};

export {
  UploadService
};
//# sourceMappingURL=chunk-ZP7PHFH3.js.map
