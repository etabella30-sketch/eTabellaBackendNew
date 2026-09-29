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

// src/app/userpanel/services/workspace/workspace.service.ts
var WorkspaceService = class _WorkspaceService {
  constructor(http) {
    this.http = http;
  }
  getFactlist(nCaseid, nContactid, nIssueid, cFacttype, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("nContactid", nContactid ? nContactid : null);
      params = params.set("nIssueid", nIssueid ? nIssueid : null);
      params = params.set("cFacttype", cFacttype ? cFacttype : "ALL");
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res;
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/workspace/facts/list`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFactIssuelist(nCaseid, nContactid, nIssueid, cFacttype, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("cFacttype", cFacttype ? cFacttype : "ALL");
      params = params.set("nContactid", nContactid ? nContactid : null);
      params = params.set("nIssueid", nIssueid ? nIssueid : null);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res;
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/workspace/facts/issues`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFactfilelist(nCaseid, nContactid, nIssueid, cFacttype, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("cFacttype", cFacttype ? cFacttype : "ALL");
      params = params.set("nContactid", nContactid ? nContactid : null);
      params = params.set("nIssueid", nIssueid ? nIssueid : null);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res;
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/workspace/facts/files`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFactContact(nFSid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nFSid", nFSid);
      let res;
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/fact/factcontact`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFactTask(nFSid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nFSid", nFSid);
      let res;
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/fact/facttask`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getContactlist(nCaseid, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/workspace/contacts`, { params }));
        res = this.groupByCompany(res);
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  groupByCompany(res) {
    let companylist = [];
    let company = {};
    res.forEach((element) => {
      if (!element.nCompanyid || element.nCompanyid == 0) {
        company = {
          "nCompanyid": 0,
          "cCompany": "Unassigned",
          "contactls": []
        };
      } else {
        company = {
          "nCompanyid": element.nCompanyid ? element.nCompanyid : 0,
          "cCompany": element.cCompany,
          "contactls": []
        };
      }
      let index = companylist.findIndex((x) => x.nCompanyid == (!company["nCompanyid"] ? 0 : company["nCompanyid"]));
      if (index > -1) {
        companylist[index].contactls.push(element);
      } else {
        company["contactls"].push(element);
        companylist.push(company);
      }
    });
    companylist[0].isopened = true;
    companylist[0].contactls[0].isopened = true;
    return companylist;
  }
  getIssuelist(nCaseid, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/workspace/issues`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getOrganize(nCaseid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/workspace/organize`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  static {
    this.\u0275fac = function WorkspaceService_Factory(t) {
      return new (t || _WorkspaceService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _WorkspaceService, factory: _WorkspaceService.\u0275fac, providedIn: "root" });
  }
};

export {
  WorkspaceService
};
//# sourceMappingURL=chunk-PR7CQFYY.js.map
