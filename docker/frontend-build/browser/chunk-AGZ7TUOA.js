import {
  FileStorageService
} from "./chunk-MQ6OVKEO.js";
import {
  UploadService
} from "./chunk-ZP7PHFH3.js";
import {
  index
} from "./chunk-55ITPE7H.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  __async,
  __spreadProps,
  __spreadValues,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/upload/check-duplicacy/check-duplicacy.service.ts
var CheckDuplicacyService = class _CheckDuplicacyService {
  constructor(upld, store, userStore) {
    this.upld = upld;
    this.store = store;
    this.userStore = userStore;
  }
  checkDuplicacy() {
    return __async(this, null, function* () {
      this.nCaseid = yield this.store.getCaseId();
      this.sectionDetail = yield this.store.getSectionDetail();
      this.bundle = yield this.store.getBundleDetail();
      if (this.nCaseid) {
        const fileDetail = { nCaseid: this.nCaseid, nSectionid: this.sectionDetail.nSectionid, nBundleid: this.bundle.nBundleid, d: "[]", nUPid: null };
        const files = yield this.store.getSelectedFileStorage();
        if (files.length) {
          let bachJobs = this.chunkArray(files, 200);
          let finalData = [];
          let cUnicid = "";
          let nUPid = null;
          try {
            const newObj = __spreadValues({}, fileDetail);
            newObj.nTotal = files?.length || 0;
            yield this.upld.uploadLog(newObj);
            for (let [index2, x] of bachJobs.entries()) {
              const d = x.filter((a) => a.isFolder || !a.isFolder && a.file).map((e) => {
                return [e.id, e.parentId, e.name, e.isFolder, e.parentId == 0 ? this.bundle.nBundleid ? this.bundle.nBundleid : null : 0, e.nParentBundleid, !e.isFolder ? e.file.size.toString() : null, !e.isFolder ? this.getFileType(e.file.name) : null];
              });
              fileDetail.d = JSON.stringify(d);
              let res = yield this.upld.checkDuplicacyBatch(fileDetail);
              if (res.msg == 1) {
                if (index2 == 0) {
                  cUnicid = res.cUnicid;
                  nUPid = res.nUPid;
                }
                const result = res.jResult ? res.jResult : [];
                fileDetail.nUPid = res.nUPid ? res.nUPid : null;
                if (result.length) {
                  finalData = finalData.concat(result);
                  result.forEach((e) => {
                    files.filter((a) => a.parentId == e[0]).map((a) => {
                      a.nParentBundleid = e[1];
                      return a;
                    });
                  });
                } else {
                  return false;
                }
              } else {
                return false;
              }
            }
            return { finalData, cUnicid, nUPid };
          } catch (error) {
            console.log("Error:", error);
            return false;
          }
        }
      }
    });
  }
  isFileDuplicated(name, nSectionid, nBundleid) {
    return __async(this, null, function* () {
      this.nCaseid = yield this.store.getCaseId();
      if (this.nCaseid) {
        const fileDetail = { nCaseid: this.nCaseid, nSectionid: nSectionid ? nSectionid : null, nBundleid: nBundleid ? nBundleid : null, d: "[]", nUPid: null };
        fileDetail.d = JSON.stringify([1, 0, name, false]);
        let res = yield this.upld.checkDuplicacy(fileDetail);
        return res && res.msg == 1 ? res.jResult : false;
      }
    });
  }
  isDuplicated(res) {
    return __async(this, null, function* () {
      let duplicated = res.filter((a) => a.length > 3);
      return duplicated;
    });
  }
  getRandomFile() {
    return `file_${Math.floor(Math.random() * (/* @__PURE__ */ new Date()).getTime())}`;
  }
  getFileType(filename) {
    try {
      return filename.split(".").pop().toUpperCase();
    } catch (error) {
      return "unknown";
    }
  }
  mergeresult(res, flag, nUPid) {
    return __async(this, null, function* () {
      const nUserid = yield this.userStore.getUserId();
      let files = [];
      let selectedFiles = yield this.store.getSelectedFileStorage();
      selectedFiles.map((e) => {
        if (!e.isFolder && e.file) {
          let file = res.find((a) => a[0] == e.id);
          if (file && (flag == "I" && !file[3] || flag != "I")) {
            files.push({ nUPid, nUDid: file[2], identifier: this.store.generateRandomId(e.file, nUserid), name: this.getRandomFile(), filetype: this.getFileType(e.file.name), filesize: e.file.size, cFilename: e.name, file: e.file, nBundleid: file[1], nBundledetailid: flag == "U" ? 0 : file[3], totalChunks: Math.ceil(e.file.size / this.store.maxChunkSize), cStatus: "P" });
          }
        }
      });
      return files;
    });
  }
  createStructure(file, nBundledetailid, nUDid, nUPid) {
    return __async(this, null, function* () {
      const nUserid = yield this.userStore.getUserId();
      return { nUPid, nUDid, identifier: this.store.generateRandomId(file, nUserid), name: this.getRandomFile(), filetype: this.getFileType(file.name), filesize: file.size, cFilename: file.name, file, nBundleid: null, nBundledetailid: nBundledetailid ? nBundledetailid : null, totalChunks: Math.ceil(file.size / this.store.maxChunkSize), cStatus: "P" };
    });
  }
  chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
  static {
    this.\u0275fac = function CheckDuplicacyService_Factory(t) {
      return new (t || _CheckDuplicacyService)(\u0275\u0275inject(UploadService), \u0275\u0275inject(FileStorageService), \u0275\u0275inject(SecureStorageService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CheckDuplicacyService, factory: _CheckDuplicacyService.\u0275fac, providedIn: "root" });
  }
};

// src/app/adminpanel/services/upload/upload-management/upload-management.service.ts
var UploadManagementService = class _UploadManagementService {
  constructor(store, upld, checkDuplicacy, ss) {
    this.store = store;
    this.upld = upld;
    this.checkDuplicacy = checkDuplicacy;
    this.ss = ss;
    this.files = [];
    this.globalQueueArray = /* @__PURE__ */ new Map();
    this.uploadingFiles = [];
    this.cancelledIds = /* @__PURE__ */ new Set();
    this.uploadQueue = index.queue(this.processUpload.bind(this), this.store.queueConcurrency);
    this.uploadQueueBatch = index.queue(this.processUpload.bind(this), this.store.queueConcurrency);
    this.uploadQueue.drain((task, err) => {
      this.onJobComplete();
      this.uploadingFiles = [];
      console.warn("All tasks have been processed", task, err);
    });
    this.uploadQueue.error((error, task) => {
      console.error("Error executing task:", error, task);
      try {
        let index2 = this.uploadingFiles.findIndex((x) => x.identifier == task.identifier);
        if (index2 !== -1) {
          this.uploadingFiles.splice(index2, 1);
        }
      } catch (error2) {
      }
    });
    this.initSocketResponse();
  }
  onJobComplete() {
    const ids = [...new Set(this.uploadingFiles.map((a) => a.nUPid))];
    const jUPids = [];
    ids.forEach((e) => {
      const total = this.uploadingFiles.filter((a) => a.nUPid == e).length;
      const failed = this.uploadingFiles.filter((a) => a.nUPid == e && a.cStatus == "F").length;
      jUPids.push({ nUPid: e, nTotal: total, nComplete: total - failed, nFailed: failed });
    });
    this.upld.uploadJobComplete({ jUPids });
  }
  initSocketResponse() {
    return __async(this, null, function* () {
      try {
        if (this.socketSubscription) {
          this.socketSubscription.unsubscribe();
        }
      } catch (error) {
      }
      this.socketSubscription = this.ss.getUploades().subscribe((res) => __async(this, null, function* () {
        if (res && res.event) {
          this.store.updateStoreData(res);
        }
      }));
      this.ss.getOcr().subscribe((res) => __async(this, null, function* () {
        if (res && res.event) {
          this.store.updateStoreData(res);
        }
      }));
    });
  }
  startUpload(files, nUPid, cUnicid) {
    return __async(this, null, function* () {
      let session = yield this.store.getSectionDetail();
      let bundle = yield this.store.getBundleDetail();
      this.setUploadingModel(files, session, bundle, nUPid, cUnicid);
      this.store.uploading = true;
      try {
        yield this.upld.updateStatus({ nUPid, nTotal: files?.length });
      } catch (error) {
        console.error(error);
      }
      let generatedTasls = this.generateTasks(files, nUPid);
      return new Promise((resolve, reject) => {
        if (generatedTasls.length) {
          this.uploadQueue.push(generatedTasls);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
  startUploadBatch(doc, cb) {
    return __async(this, null, function* () {
      const files = yield this.checkDuplicacy.createStructure(doc, null, null, null);
      let generatedTasls = this.generateTasks([files], null);
      this.setUploadingModel([files], {}, {}, null, "cUnicid");
      cb(this.uploadingFiles);
      return new Promise((resolve, reject) => {
        if (generatedTasls.length) {
          this.uploadQueueBatch.push(generatedTasls);
          this.uploadQueueBatch.drain((task, err) => {
            this.uploadingFiles = [];
            resolve(true);
          });
          this.uploadQueueBatch.error((error, task) => {
            console.error("Error executing task:", error, task);
            try {
              let ind = this.uploadingFiles.findIndex((x) => x.identifier == task.identifier);
              this.uploadingFiles.splice(ind, 1);
            } catch (error2) {
            }
            resolve(false);
          });
        } else {
          resolve(false);
        }
      });
    });
  }
  replaceFile(files, nSectionid, nUPid) {
    return __async(this, null, function* () {
      let session = yield this.store.getSectionDetail(nSectionid);
      let generatedTasls = this.generateTasks(files, nUPid);
      return new Promise((resolve, reject) => {
        if (generatedTasls.length) {
          this.uploadQueue.push(generatedTasls);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
  generateTasks(files, nUPid) {
    this.uploadingFiles.push(...files);
    const uplods = this.store.getUpload();
    const tasks = files.map(({ identifier }) => ({ id: identifier, nUPid }));
    return tasks;
  }
  getChunk(file, totalChunks, chunkNumber) {
    const fileSize = file.size;
    const chunkSize = Math.ceil(fileSize / totalChunks);
    const start = chunkNumber * chunkSize;
    const end = Math.min(start + chunkSize, fileSize);
    return file.slice(start, end);
  }
  processUpload(fileQueueTask, callback) {
    return __async(this, null, function* () {
      try {
        if (this.cancelledIds.has(fileQueueTask.id)) {
          this.cancelledIds.delete(fileQueueTask.id);
          return callback();
        }
      } catch (error) {
      }
      try {
        const task = this.uploadingFiles.find((x) => x.identifier == fileQueueTask.id);
        if (task) {
          let statusRes = yield this.upld.checkStatus(task.identifier, fileQueueTask.nUPid, this.store.nCaseid, `doc/case${this.store.nCaseid}/${task.name}.${task.filetype}`, String(task.totalChunks));
          if (statusRes.msg == 1) {
            let uploadRes = yield this.uploadDocument(task, statusRes.max, fileQueueTask.nUPid, fileQueueTask, callback);
            if (uploadRes) {
              let completeObj = {
                nUDid: task.nUDid,
                identifier: task.identifier,
                totalChunks: task.totalChunks,
                nCaseid: this.store.nCaseid,
                filetype: task.filetype,
                filesize: task.file.size,
                name: task.name,
                nSectionid: this.store.nSectionid,
                nBundleid: task.nBundleid ? task.nBundleid : null,
                // Add missing property
                nBundledetailid: task.nBundledetailid ? task.nBundledetailid : null,
                // Add missing property
                cFilename: task.cFilename,
                // Add missing property
                bIsconvert: task.bIsconvert,
                // Add missing property
                converttype: task.converttype,
                // Add missing property            
                bIsocr: task.bIsocr,
                nOcrtype: task.nOcrtype,
                nUPid: fileQueueTask.nUPid
              };
              let mergeReq = yield this.upld.completUpload(completeObj);
              if (mergeReq) {
                callback(null, uploadRes);
              } else {
                callback(false);
              }
            } else {
              console.error("UPLOAD FAILED", task);
              callback(false);
            }
          } else {
            callback(false);
          }
        } else {
          callback(false);
        }
      } catch (error) {
        console.log("ERROR in processUpload", error);
        if (callback) {
          callback(false);
        }
      }
    });
  }
  uploadDocument(Filetask, startChunk, nUPid, fileQueueTask, mainCallBack) {
    return __async(this, null, function* () {
      return new Promise((resolve, reject) => __async(this, null, function* () {
        let Queue;
        const totalTasks = Filetask.totalChunks;
        let completedTasks = 0;
        try {
          Queue = index.queue((task, callback) => __async(this, null, function* () {
            try {
              if (this.cancelledIds.has(fileQueueTask.id)) {
                this.cancelledIds.delete(fileQueueTask.id);
                return mainCallBack();
              }
            } catch (error) {
            }
            try {
              const fileTask = __spreadProps(__spreadValues({}, Filetask), { chunkNumber: task.i });
              yield this.chunkUpload(fileTask, nUPid, callback);
              completedTasks++;
              const progress = completedTasks * 100 / totalTasks;
              Filetask.nProgress = progress;
              console.log("file uploaded");
              if (Filetask.cStatus != "F" && Filetask.cStatus != "PSD")
                Filetask.cStatus = progress >= 100 ? "V" : "I";
            } catch (error) {
              console.error("Error processing tasks at uploadDocument queue:", error);
              callback(error);
            }
          }), this.store.chunkConcurrency);
          const myAllQueuelist = yield this.store.generateChunkTasks(Filetask, startChunk);
          Queue.push(myAllQueuelist);
          Queue.drain(() => {
            this.clearGloabalQueue(Filetask);
            resolve(true);
          });
          Queue.error((error) => {
            Filetask.cStatus = "F";
            console.error("Error executing task:", error, Filetask);
            reject(false);
            Queue.kill();
          });
        } catch (error) {
          console.error("Error processing tasks at uploadDocument:", error);
          reject(false);
        }
        this.globalQueueArray.set(Filetask.identifier, Queue);
      }));
    });
  }
  clearGloabalQueue(task) {
    this.globalQueueArray.delete(task.identifier);
  }
  chunkUpload(task, nUPid, callback) {
    return __async(this, null, function* () {
      try {
        let mdl = {
          identifier: task.identifier,
          chunkNumber: task.chunkNumber,
          file: this.getChunk(task.file, task.totalChunks, task.chunkNumber),
          nUPid
        };
        let res = yield this.upld.uploadChunk(mdl);
        if (res) {
          callback(null, res);
        } else {
          callback(false);
        }
      } catch (error) {
        callback(false);
      }
    });
  }
  pauseUpload(x) {
    this.globalQueueArray.get(x.identifier).pause();
  }
  resumeUpload(x) {
    this.globalQueueArray.get(x.identifier).resume();
  }
  setUploadingModel(files, session, bundle, nUPid, cUnicid) {
    let mdl = {};
    mdl.nUPid = nUPid;
    mdl.cUnicid = cUnicid;
    mdl.files = files;
    mdl.nSectionid = session.nSectionid;
    mdl.cFolder = session.cFolder;
    mdl.nBundleid = bundle.nBundleid;
    mdl.cBundlename = bundle.cBundlename;
    mdl.totalfiles = files.length;
    mdl.completed = 0;
    mdl.failed = 0;
    mdl.isLive = true;
    mdl.isExpanded = true;
    this.store.setUpload(mdl, true);
  }
  removeFileUpload(selectedFiles) {
    debugger;
    this.uploadingFiles;
    this.globalQueueArray;
    for (const nUDid of selectedFiles) {
      const idx = this.uploadingFiles.findIndex((f) => f.nUDid === nUDid);
      if (idx === -1)
        continue;
      const { identifier } = this.uploadingFiles[idx];
      this.cancelledIds.add(identifier);
      this.uploadQueue.remove(({ data }) => data.id === identifier);
      this.uploadQueueBatch.remove(({ data }) => data.id === identifier);
      this.uploadingFiles.splice(idx, 1);
      this.globalQueueArray.delete(identifier);
    }
    this.uploadQueue.resume();
    this.uploadQueueBatch.resume();
  }
  static {
    this.\u0275fac = function UploadManagementService_Factory(t) {
      return new (t || _UploadManagementService)(\u0275\u0275inject(FileStorageService), \u0275\u0275inject(UploadService), \u0275\u0275inject(CheckDuplicacyService), \u0275\u0275inject(SocketService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _UploadManagementService, factory: _UploadManagementService.\u0275fac, providedIn: "root" });
  }
};

export {
  CheckDuplicacyService,
  UploadManagementService
};
//# sourceMappingURL=chunk-AGZ7TUOA.js.map
