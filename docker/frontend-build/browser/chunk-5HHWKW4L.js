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

// src/app/shared/services/contact/contact.service.ts
var ContactService = class _ContactService {
  constructor(http, tost) {
    this.http = http;
    this.tost = tost;
  }
  getContactList(nCaseid, contactFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      if (Object.keys(contactFilter || {}).length > 0) {
        for (const key in contactFilter) {
          params = params.set(key, contactFilter[key]);
        }
      }
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/contact/getcontactlist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getContactDetail(nContactid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nContactid", nContactid);
      let res;
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/contact/getcontactdetail`, { params }));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getContactFiles(nContactid, nSectionid, cSearch, nCaseid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nContactid", nContactid);
      params = params.set("nSectionid", nSectionid);
      params = params.set("nCaseid", nCaseid);
      if (cSearch) {
        params = params.set("cSearch", cSearch);
      }
      let res;
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/contact/contactfiles`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFileContactlist(nCaseid, jFilter, cSearch) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      if (cSearch) {
        params = params.set("cSearch", cSearch);
      }
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/sidenav/contact/filecontacts`, { params }));
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
  getContactRole(nCaseid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/contact/getcontactrole`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getContactCompany(nCaseid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/contact/getcompanylist`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  roleBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/contact/contactrolebuilder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  companyBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/contact/companybuilder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  contactBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/contact/contactbuilder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  contactDelete(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/contact/contactdelete`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case deletion failed ${JSON.stringify(err)}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  userProfileUpload(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.uploadservice}/profile/upload-image`, mdl));
        if (res.msg == -1) {
          this.tost.openSnackBar(`Profile Upload failed ${res.error}`, "E");
          return { msg: -1, error: res.error, value: "" };
        } else {
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Profile Upload failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  getContactCaserolelist(nCaseid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/contact/getcontact/caseroles`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  contactRoleBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/contact/casecontact/rolebuilder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  caseContactBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/contact/case/contactbuilder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  // async getContactCompanyList(nCaseid: string): Promise<any[]> {
  //   const params = new HttpParams().set('nCaseid', nCaseid);
  //   let res: any = [];
  //   try {
  //     res = await firstValueFrom(
  //       this.http.get<selectedContactList[]>(
  //         `${environment.cloudUrl}${environment.coreservice}/contact/getcontact/companylist`, { params: params }
  //       )
  //     );
  //   } catch (error) {
  //     console.error(error)
  //     res = [];
  //   }
  //   return res;
  // }
  checkMentionExists(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/contact/mentiontag/exists`, {
          params: mdl
        }));
        if (res && res.msg == 1) {
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Case creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  static {
    this.\u0275fac = function ContactService_Factory(t) {
      return new (t || _ContactService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ContactService, factory: _ContactService.\u0275fac, providedIn: "root" });
  }
};

export {
  ContactService
};
//# sourceMappingURL=chunk-5HHWKW4L.js.map
