import {
  FileStorageService
} from "./chunk-MQ6OVKEO.js";
import {
  TostbarService
} from "./chunk-NKPXCEC5.js";
import {
  __async,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/adminpanel/services/upload/file-selection/file-selection.service.ts
var FileSelectionService = class _FileSelectionService {
  constructor(store, tost) {
    this.store = store;
    this.tost = tost;
    this.allfetchingdata = [];
  }
  fetchFiles(files, refObj) {
    return new Promise((resolve, reject) => __async(this, null, function* () {
      this.allfetchingdata = [];
      const existsFiles = yield this.store.getSelectedFileStorage();
      const maxNode = yield this.getMaxNode(existsFiles);
      let allfiles = files.filter((m) => m.fileEntry.isFile);
      if (allfiles.length + existsFiles.length > this.store.maxFiles) {
        this.tost.openSnackBar(`If your upload includes more than ${this.store.maxFiles} documents, please consolidate them into a ZIP file before uploading. This will help you avoid any upload errors due to the file limit.`, "E", 8e3);
        resolve([]);
        return;
      }
      if (!files.length) {
        resolve([]);
        return;
      }
      for (const droppedFile of files) {
        if (droppedFile.fileEntry.isFile) {
          const fileEntry = droppedFile.fileEntry;
          fileEntry.file((file) => {
            this.allfetchingdata.push({ file, fullpath: droppedFile.relativePath });
            this.listienFiles(resolve, existsFiles, maxNode, refObj);
          });
        } else {
          this.allfetchingdata.push({ file: null, fullpath: droppedFile.relativePath });
          this.listienFiles(resolve, existsFiles, maxNode, refObj);
        }
      }
    }));
  }
  listienFiles(resolve, existsFiles, maxNode, refObj) {
    try {
      clearTimeout(this.filelistiner);
    } catch (error) {
    }
    this.filelistiner = setTimeout(() => {
      let idCounter = maxNode ? maxNode.id + 1 : 1;
      const itemsMap = /* @__PURE__ */ new Map();
      let result = existsFiles;
      try {
        this.allfetchingdata.forEach((e) => {
          let path = e.fullpath;
          const components = path.split("/");
          let parentId = refObj ? refObj.id : 0;
          let level = refObj ? refObj.level + 1 : 1;
          components.forEach((component, index) => {
            const isLastComponent = index === components.length - 1;
            const isFolder = !isLastComponent;
            let itemKey = `${parentId}-${component}`;
            if (!itemsMap.has(itemKey)) {
              itemsMap.set(itemKey, idCounter);
              result.push({
                id: idCounter,
                isFolder,
                name: component,
                parentId,
                file: isFolder ? null : e.file,
                level
              });
              idCounter++;
            }
            parentId = itemsMap.get(itemKey);
            level++;
          });
        });
      } catch (error) {
        result = existsFiles || [];
      }
      resolve(result);
    }, 1200);
  }
  getMaxNode(existsFiles) {
    return Promise.resolve(existsFiles.reduce((max, product) => product.id > max.id ? product : max, existsFiles[0]));
  }
  static {
    this.\u0275fac = function FileSelectionService_Factory(t) {
      return new (t || _FileSelectionService)(\u0275\u0275inject(FileStorageService), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FileSelectionService, factory: _FileSelectionService.\u0275fac, providedIn: "root" });
  }
};

export {
  FileSelectionService
};
//# sourceMappingURL=chunk-LQXMUOGJ.js.map
