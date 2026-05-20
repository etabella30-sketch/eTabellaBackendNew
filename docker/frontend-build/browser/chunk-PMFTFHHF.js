import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  __async,
  __spreadValues,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/shared/services/filecolumn/filecolumn.service.ts
var FilecolumnService = class _FilecolumnService {
  constructor(sStore) {
    this.sStore = sStore;
    this.collShow = [1, 2, 3, 4, 5, 6, 7];
    this.tablecols = [
      {
        id: 1,
        "name": "Bundle",
        "key": "bundle",
        "isshow": true,
        "class": "bundle",
        "sortKey": "cBundletag",
        "isEdit": true,
        "order": 5
      },
      {
        id: 2,
        "name": "Tab",
        "key": "tab",
        "isshow": true,
        "class": "tab",
        "sortKey": "cTab",
        "isEdit": true,
        "order": 6
      },
      {
        id: 4,
        "name": "Name",
        "key": "name",
        "isshow": true,
        "class": "name",
        "sortKey": "cName",
        "isEdit": false,
        "order": 7
      },
      {
        id: 9,
        "name": "Link",
        "key": "link",
        "isshow": false,
        "class": "links",
        "sortKey": "",
        "isEdit": false,
        "order": 8
      },
      {
        id: 10,
        "name": "Relevence",
        "key": "relevence",
        "isshow": false,
        "class": "relevence",
        "sortKey": "",
        "isEdit": false,
        "order": 9
      },
      {
        id: 11,
        "name": "Impact",
        "key": "impact",
        "isshow": false,
        "class": "impact",
        "sortKey": "",
        "isEdit": false,
        "order": 10
      },
      {
        id: 5,
        "name": "Page",
        "key": "page",
        "isshow": true,
        "class": "page pagination",
        "sortKey": "cPage",
        "isEdit": true,
        "order": 11
      },
      {
        id: 3,
        "name": "Exhibit No.",
        "key": "exhibit",
        "isshow": true,
        "class": "exhibit",
        "sortKey": "cExhibitno",
        "isEdit": true,
        "order": 12
      },
      {
        id: 6,
        "name": "Kind",
        "key": "Kind",
        "isshow": true,
        "class": "kind",
        "sortKey": "cFiletype",
        "isEdit": false,
        "order": 13
      },
      {
        id: 7,
        "name": "Date",
        "key": "date",
        "isshow": true,
        "class": "doi",
        "sortKey": "dIntrestDt",
        "isEdit": true,
        "order": 14
      },
      {
        id: 8,
        "name": "Description",
        "key": "desc",
        "isshow": true,
        "class": "desc",
        "sortKey": "cDescription",
        "isEdit": true,
        "order": 15
      },
      {
        id: 12,
        "name": "Remark",
        "key": "remark",
        "isshow": false,
        "class": "kind",
        "sortKey": "",
        "isEdit": false,
        "order": 16
      },
      {
        id: 13,
        "name": "Author",
        "key": "author",
        "isshow": false,
        "class": "exhibit",
        "sortKey": "cAuthor",
        "isEdit": true,
        "order": 17
      }
    ];
    this.reqcols = {
      "gap": { view: true, edit: false, order: 1 },
      "drag": { view: true, edit: false, order: 2 },
      "check": { view: true, edit: false, order: 3 },
      "order": { view: false, edit: false, order: 4 },
      "bundle": { view: true, edit: false, order: 5 },
      "tab": { view: true, edit: false, order: 6 },
      "name": { view: true, edit: false, order: 7 },
      "link": { view: false, edit: false, order: 8 },
      "relevence": { view: false, edit: false, order: 9 },
      "impact": { view: false, edit: false, order: 10 },
      "page": { view: true, edit: false, order: 11 },
      "exhibit": { view: true, edit: false, order: 12 },
      "kind": { view: true, edit: false, order: 13 },
      "date": { view: true, edit: false, order: 14 },
      "desc": { view: false, edit: false, order: 15 },
      "remark": { view: false, edit: false, order: 16 },
      "extra": { view: true, edit: false, order: 18 },
      "star": { view: false, edit: false, order: 19 },
      "index": { view: false, edit: false, order: 20 },
      "author": { view: false, edit: false, order: 17 }
    };
    this.collShow = this.sStore.getStorage("collShow") ? JSON.parse(this.sStore.getStorage("collShow")) : this.collShow;
    if (!this.sStore.getStorage("collShow")) {
      this.setCols();
    }
    this.tablecols.forEach((element) => {
      element.isshow = this.collShow.includes(element.id);
    });
  }
  setCols() {
    this.sStore.setStorage("collShow", JSON.stringify(this.collShow));
  }
  setColumnCookies(key, data) {
    return __async(this, null, function* () {
      yield this.sStore.setSessionData(key, data);
    });
  }
  getColumnCookies(key) {
    return __async(this, null, function* () {
      return yield this.sStore.getSessionData(key);
    });
  }
  customSort(obj) {
    let entries = Object.entries(obj).map(([key, value]) => __spreadValues({
      key
    }, typeof value === "object" && value !== null ? value : {}));
    entries.sort((a, b) => {
      return a.order - b.order;
    });
    return entries.map((e) => e.key);
  }
  static {
    this.\u0275fac = function FilecolumnService_Factory(t) {
      return new (t || _FilecolumnService)(\u0275\u0275inject(SecureStorageService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FilecolumnService, factory: _FilecolumnService.\u0275fac, providedIn: "root" });
  }
};

export {
  FilecolumnService
};
//# sourceMappingURL=chunk-PMFTFHHF.js.map
