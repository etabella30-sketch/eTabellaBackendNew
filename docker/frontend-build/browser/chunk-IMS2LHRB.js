import {
  CommonService
} from "./chunk-GHP524MW.js";
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

// src/app/shared/services/fact/fact.service.ts
var FactService = class _FactService {
  constructor(http, tost, common) {
    this.http = http;
    this.tost = tost;
    this.common = common;
  }
  saveFact(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/fact/insertfact`, mdl));
        if (res && res.msg == 1) {
          return res;
        } else {
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Fact creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  saveQuickFact(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/fact/insertquickfact`, mdl));
        if (res && res.msg == 1) {
          return res;
        } else {
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Fact creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  getFactDetails(fsids) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("jFSids", JSON.stringify(fsids));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/fact/factdetail`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getfiles_bytask(nTaskid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nTaskid", nTaskid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/sidenav/filetask/files`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  updateTaskStatus(nTaskid, cStatus) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/sidenav/task/status/update`, { nTaskid, cStatus }));
      } catch (error) {
        console.error(error);
        res = [{}];
      }
      return res[0];
    });
  }
  getFactIssuesAndLinks(fsids) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("jFSids", JSON.stringify(fsids));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/fact/factissuelinks`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFactContact(nFSid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nFSid", nFSid);
      let res = [];
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
      const params = new HttpParams().set("nFSid", nFSid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/fact/facttask`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFactShare(nFSid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nFSid", nFSid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/fact/factshared`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getFactPermissions(nFSid, nUserid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nFSid", nFSid).set("nMasterid", nUserid);
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/factsheet/permissions`, { params }));
      } catch (error) {
      }
      return res;
    });
  }
  deleteFact(nFSid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl2}${environment.realtimeserive}/factsheet/delete`, { nFSid }));
        return res;
      } catch (err) {
        this.tost.error(`Fact delete failed ${err}`);
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  updateFacts(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/fact/factupdate`, mdl));
        return res[0];
      } catch (err) {
        this.tost.error(`Fact delete failed ${err}`);
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  updateQuickFacts(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/fact/quickfactupdate`, mdl));
        return res[0];
      } catch (err) {
        this.tost.error(`Fact delete failed ${err}`);
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  convertFact(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/fact/convertfact`, mdl));
        return res[0];
      } catch (err) {
        this.tost.error(`Fact convert failed ${err}`);
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  // QUICK FACT ADD
  lastID(selectedIssues) {
    return __async(this, null, function* () {
      if (!selectedIssues?.length)
        return 0;
      selectedIssues.map((a) => a.nIid = a.nIid || a.nIssueid);
      return selectedIssues[selectedIssues.length - 1]?.nIid || 0;
    });
  }
  submitQuickFact(selectedIssues, docInfo, jTexts, tempAnnots, isNoteEdited, jLinktype, jContacts) {
    return __async(this, null, function* () {
      const colorid = yield this.lastID(selectedIssues);
      const finalMDL = {
        nBDid: docInfo.nBundledetailid,
        jAn: JSON.stringify(tempAnnots.map((a) => a.annots)),
        nColorid: colorid,
        jT: JSON.stringify(jTexts.filter((a) => a)),
        jOT: JSON.stringify(tempAnnots.map((a) => a.text).filter((a) => a)),
        jIssues: JSON.stringify(selectedIssues.map((a) => [
          a.nIid,
          a.nImpactid ? a.nImpactid : 0,
          a.nRelid ? a.nRelid : 0
        ])),
        jLinktype,
        cFtype: "QF",
        cIsNote: isNoteEdited ? "Y" : "N"
      };
      if (jContacts?.length) {
        finalMDL["jContacts"] = jContacts;
      }
      const res = yield this.saveQuickFact(finalMDL);
      return { res, colorid };
    });
  }
  updateFactNote(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/fact/update/factnote`, mdl));
        if (res && res.msg == 1) {
          return res;
        } else {
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Fact creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  // async getFactContactV2(nFSid: string, nUserid: string): Promise<selectedContactList[]> {
  //   const params = new HttpParams().set('nFSid', nFSid).set('nUserid', nUserid);
  //   let res: any = [];
  //   try {
  //     res = await firstValueFrom(
  //       this.http.get<selectedContactList[]>(
  //         `${environment.cloudUrl2}${environment.realtimeserive}/fact/factcontact`, { params: params }
  //       )
  //     );
  //   } catch (error) {
  //     console.error(error)
  //     res = [];
  //   }
  //   return res;
  // }
  // async getFactShareV2(nFSid: string, nUserid: string): Promise<myTeamUsersV2[]> {
  //   const params = new HttpParams().set('nFSid', nFSid).set('nUserid', nUserid);
  //   let res: any = [];
  //   try {
  //     res = await firstValueFrom(
  //       this.http.get<myTeamUsersV2[]>(
  //         `${environment.cloudUrl2}${environment.realtimeserive}/fact/factshared`, { params: params }
  //       )
  //     );
  //   } catch (error) {
  //     console.error(error)
  //     res = [];
  //   }
  //   return res;
  // }
  // async updatePermissions(
  //   nFSid: string,
  //   selectedUsers: UserPermission[]
  // ): Promise<{ msg: number; value?: any; error?: any }> {
  //   try {
  //     const res: any = await firstValueFrom(
  //       this.http.post<any>(
  //         `${environment.cloudUrl2}${environment.realtimeserive}/fact/update/permissions`,
  //         { nFSid, selectedUsers }
  //       )
  //     );
  //     if (res && res.msg === 1) {
  //       this.tost.openSnackBar('Permissions updated successfully', 'S');
  //       return res;
  //     } else {
  //       this.tost.openSnackBar(
  //         res?.value || 'Failed to update permissions',
  //         'E'
  //       );
  //       return res;
  //     }
  //   } catch (err) {
  //     this.tost.openSnackBar(`Permission update failed: ${err}`, 'E');
  //     return { msg: -1, error: err, value: '' };
  //   }
  // }
  getPermissions(nFactid, userIds) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/fact/permissions/${nFactid}`, { params: { userIds: userIds.join(",") } }));
        if (res && res.msg === 1) {
          return res.value;
        } else {
          this.tost.openSnackBar(res?.value || "Failed to fetch permissions", "E");
          return [];
        }
      } catch (err) {
        this.tost.openSnackBar(`Permission fetch failed: ${err}`, "E");
        return [];
      }
    });
  }
  static {
    this.\u0275fac = function FactService_Factory(t) {
      return new (t || _FactService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService), \u0275\u0275inject(CommonService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FactService, factory: _FactService.\u0275fac, providedIn: "root" });
  }
};

export {
  FactService
};
//# sourceMappingURL=chunk-IMS2LHRB.js.map
