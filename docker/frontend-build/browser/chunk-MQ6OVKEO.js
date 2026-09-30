import {
  UploadService
} from "./chunk-ZP7PHFH3.js";
import {
  v4_default
} from "./chunk-3B3MCZKM.js";
import {
  __async,
  __spreadProps,
  __spreadValues,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/upload/file-storage/file-storage.service.ts
var FileStorageService = class _FileStorageService {
  constructor(upld) {
    this.upld = upld;
    this.maxFiles = 1e3;
    this.maxChunkSize = 1024 * 1024 * 2;
    this.queueConcurrency = 2;
    this.chunkConcurrency = 5;
    this.fileList = [];
    this.nBundleid = null;
    this.nSectionid = null;
    this.selectedFiles = [];
    this.uploading = false;
    this.filetypes = [];
    this.documentsMaster = [];
    this.row_sessions = [];
    this.selectedFiles = window.localStorage.getItem("selectedFiles") ? JSON.parse(window.localStorage.getItem("selectedFiles")) : [];
  }
  setCateId(nCaseid, isFetchdetail, nSectionid, isUser) {
    debugger;
    this.nCaseid = nCaseid;
    const filter = { nSectionid: null, cAction: { key: "Action - All", value: null }, cDate: { key: "Date - All", value: null }, cStatus: { key: "Status - All", value: null }, cFormat: { key: "Format - All", value: null }, cSearch: "" };
    if (isUser) {
      filter.nSectionid = nSectionid;
    }
    if (!isFetchdetail) {
      this.fetchHistory(filter);
    }
  }
  //  getTest(){
  //   return this.testVariable;
  // }
  getCaseDetail(nCaseid, nSectionid, isUser) {
    return __async(this, null, function* () {
      if (!this.nCaseid) {
        this.setCateId(nCaseid, false, nSectionid, isUser);
      }
      this.nCaseid = nCaseid ? nCaseid : this.nCaseid;
      if (this.caseDetail)
        return this.caseDetail;
      else
        this.caseDetail = yield this.upld.fetchCaseDetail(nCaseid);
      return this.caseDetail;
    });
  }
  getCaseId() {
    return __async(this, null, function* () {
      return this.nCaseid ? this.nCaseid : null;
    });
  }
  generateRandomId(file, nUserid) {
    return `${file.name}_${v4_default()}`;
  }
  getSectionDetail(nSectionid) {
    return __async(this, null, function* () {
      if (nSectionid && nSectionid != this.nSectionid) {
        this.nSectionid = null;
        this.sectionDetail = null;
        this.nBundleid = null;
        this.bundle = null;
      }
      nSectionid = nSectionid ? nSectionid : this.nSectionid;
      if (this.sectionDetail)
        return this.sectionDetail;
      else
        this.sectionDetail = yield this.upld.fetchSectionDetail(nSectionid);
      this.nSectionid = this.sectionDetail.nSectionid;
      return this.sectionDetail;
    });
  }
  getBundleDetail(nBundleid) {
    return __async(this, null, function* () {
      if (nBundleid && nBundleid != this.nBundleid) {
        this.nBundleid = null;
        this.bundle = null;
      }
      nBundleid = nBundleid ? nBundleid : this.nBundleid;
      if (this.bundle)
        return this.bundle;
      else
        this.bundle = yield this.upld.fetchBundleDetail(nBundleid);
      this.nBundleid = this.bundle.nBundleid;
      return this.bundle;
    });
  }
  setSelectedFileStorage(files) {
    return __async(this, null, function* () {
      this.selectedFiles = files;
      this.selectedFiles.map((a) => a.isExpanded = false);
      this.filetypes = [...new Set(this.selectedFiles.filter((e) => this.getFileType(e.file?.name) != "unknown").map((a) => {
        return { type: this.getFileType(a.file?.name) };
      }))];
      this.filetypes = this.filetypes.filter((obj, index, self) => index === self.findIndex((t) => t.type === obj.type));
      this.filetypes = this.filetypes.map((a) => {
        return __spreadProps(__spreadValues({}, a), { isDisabled: this.isNotConvertallow(a.type), isConvert: !this.isNotConvertallow(a.type) });
      });
    });
  }
  getSelectedFileStorage() {
    return __async(this, null, function* () {
      return this.selectedFiles || [];
    });
  }
  getSelectedFileStorageByLevel(id) {
    return __async(this, null, function* () {
      return this.selectedFiles.filter((file) => file.parentId == id) || [];
    });
  }
  /*
    generateChunkTasks(mdl, startChunk: number): Promise<chunkUploadMDL[]> {
      const tasks: chunkUploadMDL[] = [];
      const totalChunks = mdl.totalChunks;  // Assume mdl includes the total number of chunks already defined
      let chunkNumber = (startChunk && startChunk > 0 && totalChunks >= startChunk) ? (startChunk - 1) : 0;
      for (chunkNumber; chunkNumber < totalChunks; chunkNumber++) {
        // Clone the mdl object and add the chunkIndex to it for each task
        const task = {
          ...mdl,  // Spread operator to copy properties from mdl
          chunkNumber: chunkNumber  // Adding chunkIndex to indicate which chunk this task is handling
        };
  
        // Push the task into the tasks array
        tasks.push(task);
      }
  
      return Promise.resolve(tasks);
    }*/
  generateChunkTasks(mdl, startChunk) {
    const tasks = [];
    const totalChunks = mdl.totalChunks;
    let chunkNumber = startChunk && startChunk > 0 && totalChunks >= startChunk ? startChunk - 1 : 0;
    for (chunkNumber; chunkNumber < totalChunks; chunkNumber++) {
      const task = {
        i: chunkNumber
        // Adding chunkIndex to indicate which chunk this task is handling
      };
      tasks.push(task);
    }
    return Promise.resolve(tasks);
  }
  getStatus(event) {
    let obj;
    console.log("event", event);
    switch (event) {
      case "FILE-MERGED":
        obj = { cStatus: "V" };
        break;
      case "ZIP-PROCESS":
        obj = { cStatus: "Z" };
        break;
      case "ZIP-FAILED":
        obj = { cStatus: "ZF" };
        break;
      case "VERIFY-CPOMPLETE":
        obj = { cStatus: "VC" };
        break;
      case "FILE-INSERT-COMPLETE":
        obj = { cStatus: "C" };
        break;
      case "FILE-INSERT-FAILED":
        obj = { cStatus: "F" };
        break;
      case "MERGING-FAILED":
        obj = { cStatus: "F" };
        break;
      case "ZIP-REPORT":
        obj = { cStatus: "ZR" };
        break;
      case "ZIP-DETAIL":
        obj = { cStatus: "ZD" };
        break;
      case "ZIP-OPEN-FAILED":
        obj = { cStatus: "ZF" };
        break;
      case "ZIP-READ-SUCCESS":
        obj = { cStatus: "ZR" };
        break;
      case "ZIP-FORMATE-SUCCESS":
        obj = { cStatus: "ZR" };
        break;
      case "ZIP-NO-FORMATES":
        obj = { cStatus: "ZF" };
        break;
      case "ZIP-BUNDLE-SAVE-FAILED":
        obj = { cStatus: "ZF" };
        break;
      case "ZIP-BUNDLE-SAVE":
        obj = { cStatus: "ZB" };
        break;
      case "ZIP-COMPLETE":
        obj = { cStatus: "C" };
        break;
      case "CONVERTING-START":
        obj = { cStatus: "CP" };
        break;
      case "CONVERTING-PROGRESS":
        obj = { cStatus: "CP" };
        break;
      case "CONVERTING-SUCCESS":
        obj = { cStatus: "CS" };
        break;
      case "CONVERTING-FAILED":
        obj = { cStatus: "CF" };
        break;
      case "OCR-START":
        obj = { cStatus: "OI" };
        break;
      case "OCR-PROGRESS":
        obj = { cStatus: "OP" };
        break;
      case "OCR-ERROR":
        obj = { cStatus: "OF" };
        break;
      case "OCR-SUCCESS":
        obj = { cStatus: "OS" };
        break;
      case "OCR-JOB":
        obj = { cStatus: "OJ" };
        break;
      default:
        obj = { cStatus: "P" };
        break;
    }
    return obj;
  }
  ///////////////UPLOAD MANAGEMENT////////////////////
  setUpload(value, top) {
    if (this.documentsMaster.findIndex((a) => a.nUPid == value.nUPid) == -1) {
      if (top)
        this.documentsMaster.unshift(value);
      else
        this.documentsMaster.push(value);
    }
  }
  updateReportCombo() {
    return __async(this, null, function* () {
      this.row_sessions.splice(0, this.row_sessions.length);
      this.row_sessions.push(...this.documentsMaster.map(({ nUPid, cUnicid }) => ({ nUPid, cUnicid })));
    });
  }
  getRowSessions() {
    return this.row_sessions;
  }
  getUpload() {
    return this.documentsMaster;
  }
  updateProgress(identifier, nProgress) {
    return __async(this, null, function* () {
      let obj = this.documentsMaster.find((a) => a.files.find((b) => b.identifier == identifier));
      if (obj) {
        let file = obj.files.find((b) => b.identifier == identifier);
        if (file && file.cStatus != "PSD") {
          file.nProgress = nProgress;
          file.cStatus = nProgress >= 100 ? "V" : "I";
        }
      }
    });
  }
  updateStoreData(res) {
    return __async(this, null, function* () {
      let statusObj = this.getStatus(res.event);
      let obj = this.documentsMaster.find((a) => a.files.find((b) => b.identifier ? b.identifier == res.data.identifier : b.nUDid == res.data.nUDid));
      if (obj && statusObj) {
        let file = obj.files.find((b) => b.identifier ? b.identifier == res.data.identifier : b.nUDid == res.data.nUDid);
        if (file) {
          if (!["OS", "OF", "OP", "OI", "OJ"].includes(statusObj.cStatus)) {
            file.cStatus = statusObj.cStatus;
          }
          if (file.cStatus == "ZR") {
            file.nTotal = res.data.totalTasks;
            file.nComplete = res.data.completedTasks;
          }
          if (file.cStatus == "CP") {
            file.nProgress = res.data && res.data.nProgress ? res.data.nProgress : 0;
            file.tempfname = res.data.filename ? res.data.filename : null;
          }
          if (statusObj.cStatus == "OP") {
            if (file && file.ocrFiles && file.ocrFiles.length > 0) {
              file.ocrFiles.map((a) => {
                if (a.id == parseInt(res.data.id)) {
                  console.log("message", res.data.message);
                  a.message = res.data.message ? res.data.message : null;
                }
              });
            }
          }
          if (statusObj.cStatus == "OS" || statusObj.cStatus == "OF" || statusObj.cStatus == "OI") {
            if (file && file.ocrFiles && file.ocrFiles.length > 0) {
              file.ocrFiles.map((a) => {
                if (a.id == res.data.id) {
                  a.cStatus = statusObj.cStatus == "OI" ? "P" : statusObj.cStatus == "OS" ? "C" : "F";
                  a.message = null;
                  if (statusObj.cStatus == "OS") {
                    file.nCompleted++;
                    file.nOProgress--;
                  }
                  if (statusObj.cStatus == "OI") {
                    file.nOProgress++;
                  }
                  if (statusObj.cStatus == "OF") {
                    file.nFailed++;
                    file.nOProgress--;
                  }
                }
              });
            }
          }
          if (["OJ", "OS", "OI", "OF"].includes(statusObj.cStatus)) {
            yield this.upld.getFileData(res.data.nUDid, file);
          }
          if (file.cStatus == "C" || file.cStatus == "CS") {
            file.cStatus = "C";
          }
          try {
            obj.completed = obj.files.filter((a) => a.cStatus == "C").length;
            obj.failed = obj.files.filter((a) => a.cStatus == "F").length;
          } catch (error) {
          }
          if (res.data.nBundledetailid) {
            file.nBundledetailid = res.data.nBundledetailid;
          }
        }
      }
    });
  }
  fetchHistory(filters) {
    return __async(this, null, function* () {
      try {
        let data = [];
        data = yield this.upld.fetchReportSummary(this.nCaseid, filters ? filters : {});
        data.forEach((a) => {
          this.setUpload(a);
        });
        this.updateReportCombo();
      } catch (error) {
      }
    });
  }
  clearAllDeletedFiles(files) {
    return __async(this, null, function* () {
      new Promise((resolve, reject) => {
        try {
          this.documentsMaster.forEach((job) => {
            if (job.isExpanded) {
              job.files = job.files.filter((file) => !files.includes(file.nUDid));
            }
          });
          for (let i = this.documentsMaster.length - 1; i >= 0; i--) {
            if (this.documentsMaster[i].isExpanded && !this.documentsMaster[i].files.length) {
              this.documentsMaster.splice(i, 1);
            } else {
              this.documentsMaster[i]["totalfiles"] = this.documentsMaster[i].files.length;
              this.documentsMaster[i]["completed"] = this.documentsMaster[i].files.filter((m) => m.cStatus == "C").length;
              this.documentsMaster[i]["failed"] = this.documentsMaster[i]["totalfiles"] - this.documentsMaster[i]["completed"];
            }
          }
        } catch (error) {
        }
        resolve(true);
      });
    });
  }
  getFileType(filename) {
    try {
      return filename.split(".").pop().toUpperCase();
    } catch (error) {
      return "unknown";
    }
  }
  isNotConvertallow(type) {
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "zip", "msg"].includes(type.toLowerCase())) {
      return false;
    }
    return true;
  }
  static {
    this.\u0275fac = function FileStorageService_Factory(t) {
      return new (t || _FileStorageService)(\u0275\u0275inject(UploadService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FileStorageService, factory: _FileStorageService.\u0275fac, providedIn: "root" });
  }
};

export {
  FileStorageService
};
//# sourceMappingURL=chunk-MQ6OVKEO.js.map
