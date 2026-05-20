import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  MatSnackBar
} from "./chunk-NKPXCEC5.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  BehaviorSubject,
  __async,
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/rt/services/linkLine/link-line.service.ts
var LinkLineService = class _LinkLineService {
  constructor() {
    this.linkDataSubject = new BehaviorSubject([]);
    this.linkData$ = this.linkDataSubject.asObservable();
  }
  getLinkLineValues() {
    return this.linkDataSubject;
  }
  destroy() {
    this.linkDataSubject.next([]);
  }
  static {
    this.\u0275fac = function LinkLineService_Factory(t) {
      return new (t || _LinkLineService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LinkLineService, factory: _LinkLineService.\u0275fac, providedIn: "root" });
  }
};

// src/app/rt/services/session/session.service.ts
var SessionService = class _SessionService {
  constructor(cs, http, snackBar, socketService) {
    this.cs = cs;
    this.http = http;
    this.snackBar = snackBar;
    this.socketService = socketService;
    this.cUnicuserid = 0;
    this.nUserid = 0;
    this.types = ["Attempt", "Connected", "Disconnected", "Error", "Feed", "Success"];
    this.current_case = {};
    this.casename = "";
    this.cCaseno = "";
    this.cUnicuserid = this.getLocalStorage("cUnicuserid");
    this.nUserid = this.getLocalStorage("nUserid");
  }
  setLocalStorage(key, val) {
    localStorage.setItem(key, val);
  }
  getLocalStorage(key) {
    let val = localStorage.getItem(key);
    return val;
  }
  fetchLocalServer() {
    return __async(this, null, function* () {
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/tcp/getserver`));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  getSessions(nPageNumber, nCaseid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("pageNumber", nPageNumber);
      params = params.set("nCaseid", nCaseid);
      params = params.set("cUnicuserid", this.cUnicuserid);
      let res = [];
      const dDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      params = params.set("dDate", dDate);
      console.log("Fetching sessions with params:", { nPageNumber, nCaseid, dDate });
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/list`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getConnectedServers() {
    return __async(this, null, function* () {
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/servers/connected`));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  // 
  getLogSession() {
    return __async(this, null, function* () {
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/log/sessionid`));
      } catch (error) {
        console.error(error);
        res = { msg: -1 };
      }
      return res;
    });
  }
  fetchSession(id) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nSesid", id);
      params = params.set("cUnicuserid", this.cUnicuserid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/sessiondata`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  reinitSessions() {
    return __async(this, null, function* () {
      yield firstValueFrom(this.http.post(`${environment.realtimelocal}/tcp/reinitsession`, { cUnicuserid: this.cUnicuserid }));
    });
  }
  sessionBuilder(frm) {
    return __async(this, null, function* () {
      frm.cUnicuserid = this.cUnicuserid;
      let res = {};
      try {
        res = yield firstValueFrom(this.http.post(`${environment.realtimelocal}/session/sessionbuilder`, frm));
        try {
          this.reinitSessions();
          this.socketService.sendMessage("reinilize-sockets", { msg: 1, nCaseid: frm.nCaseid });
        } catch (error) {
        }
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  sessionDelete(nSesid, nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.realtimelocal}/session/sessiondelete`, { nSesid }));
        this.reinitSessions();
        this.socketService.sendMessage("reinilize-sockets", { msg: 1, nCaseid });
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  sysCaseUsers(nSesid, nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.realtimelocal}/session/refetchusers`, { nSesid, nCaseid }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  sessionEnd(nSesid, nCaseid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.realtimelocal}/session/sessionend`, { nSesid, nCaseid, permission: "C" }));
        this.reinitSessions();
        this.socketService.sendMessage("reinilize-sockets", { msg: 1, nCaseid });
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  serverList() {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/servers`));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  addServer(frm) {
    return __async(this, null, function* () {
      frm.cUnicuserid = this.cUnicuserid;
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.realtimelocal}/session/serverbuilder`, frm));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  setServer(nSesid, nRTSid) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.realtimelocal}/session/setserver`, { nSesid, nRTSid }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getTeams(nCaseid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/teamsusers`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getSeachedUsers(nCaseid, cSearch) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("cSearch", cSearch);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/searchusers`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  assignUser(param) {
    return __async(this, null, function* () {
      param.cUnicuserid = this.cUnicuserid;
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.realtimelocal}/session/assign`, param));
        this.reinitSessions();
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  saveLocalServer(param) {
    return __async(this, null, function* () {
      param.cUnicuserid = this.cUnicuserid;
      let res = {};
      try {
        res = yield firstValueFrom(this.http.post(`${environment.realtimelocal}/tcp/setserver`, param));
      } catch (error) {
        console.error(error);
        res = {};
      }
      return res;
    });
  }
  // async setLocalUserId(cUnicuserid): Promise<any> {
  //   debugger;
  //   this.cUnicuserid = cUnicuserid;
  //   let res: any = {};
  //   try {
  //     res = await firstValueFrom(
  //       this.http.post<any>(
  //         `${environment.localserver}/tcp/setuserid`,
  //         { cUnicuserid: this.cUnicuserid }
  //       )
  //     );
  //     this.nUserid = res.nUserid;
  //     this.cUnicuserid = res.cUnicuserid;
  //     // this.setLocalStorage('nUserid', res.nUserid);
  //     // this.setLocalStorage('cUnicuserid', res.cUnicuserid);
  //   } catch (error) {
  //     console.error(error)
  //     res = {};
  //   }
  //   return res;
  // }
  show(message, action = "Close") {
    this.snackBar.open(message, action, {
      duration: 3e3
      // Duration the snack-bar will be shown, in milliseconds
    });
  }
  getConLogs(nPage, date, cSearch) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nUserid", this.nUserid);
      params = params.set("nPage", nPage);
      params = params.set("cSearch", cSearch);
      if (date) {
        params = params.set("dDate", date);
      }
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/getConnectivityLog`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getAssigned(nSesid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nSesid", nSesid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/getassigned`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  // async getCaseList(pageNumber: number): Promise<any> {
  //   let params = new HttpParams()
  //   params = params.set('cUnicuserid', this.cUnicuserid);
  //   // params = params.set('pageNumber ', pageNumber);
  //   let res: any = [];
  //   try {
  //     res = await firstValueFrom(
  //       this.http.get<any>(
  //         `${environment.realtimelocal}/session/caselist`,
  //         { params: params }
  //       )
  //     );
  //   } catch (error) {
  //     console.error(error)
  //     res = [];
  //   }
  //   return res;
  // }
  // async getCaseFiles(nCaseid: number): Promise<any> {
  //   let params = new HttpParams()
  //   params = params.set('nCaseid', nCaseid);
  //   let res: any = [];
  //   try {
  //     res = await firstValueFrom(
  //       this.http.get<any>(
  //         `${this.url.realtimeserver}/session/transcriptfiles`,
  //         { params: params }
  //       )
  //     );
  //   } catch (error) {
  //     console.error(error)
  //     res = [];
  //   }
  //   return res;
  // }
  getPreviousSessions(nCaseid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("nUserid", 0);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/getsessionsbycaseid`, { params }));
        if (!res.length) {
          res = [];
        }
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  // async publishFile(nBundledetailid: number, cStatus: string): Promise<any> {
  //   let res: any = [];
  //   try {
  //     res = await firstValueFrom(
  //       this.http.post<any>(
  //         `${this.url.realtimeserver}/session/publishfile`,
  //         { nBundledetailid: nBundledetailid, cStatus: cStatus }
  //       )
  //     );
  //   } catch (error) {
  //     console.error(error)
  //     res = [];
  //   }
  //   return res;
  // }
  // downloadFile(url: string): Observable<Blob> {
  //   // var path = 'D:/apiportal/etabella-nestjs/assets/'
  //   return this.http.get(environment.localserver + '/assets/' + url, {
  //     responseType: 'blob'
  //   });
  // }
  // async transsciptUpdate(nSesid: string, nUserid: string, nCaseid: number, cFlag: string, cProtocol: string): Promise<any> {
  //   let res: any = [];
  //   try {
  //     res = await firstValueFrom(
  //       this.http.post<any>(
  //         `${this.url.realtimeserver}/session/updatetranscriptstatus`,
  //         { nSesid: nSesid, nUserid: nUserid, cFlag: cFlag, nCaseid: nCaseid, cProtocol: cProtocol }
  //       )
  //     );
  //   } catch (error) {
  //     console.error(error)
  //     res = [];
  //   }
  //   return res;
  // }
  // async transcriptSync(x): Promise<any> {
  //   let res;
  //   try {
  //     res = await firstValueFrom(
  //       this.http.post<any>(
  //         `${environment.localcloud}/session/transcriptsync`,
  //         { nSesid: x.nSesid, nUserid: x.nUserid, nCaseid: x.nCaseid }
  //       )
  //     );
  //   } catch (error) {
  //     console.error(error)
  //     res = [];
  //   }
  //   return res;
  // }
  getRefreshType() {
    return __async(this, null, function* () {
      let res = {};
      try {
        res = yield firstValueFrom(this.http.get(`${environment.realtimelocal}/session/getrefreshtype`));
      } catch (error) {
        console.error(error);
        res = { msg: -1 };
      }
      return res;
    });
  }
  // async setRefreshType(cType: string): Promise<any> {
  //   let res;
  //   try {
  //     res = await firstValueFrom(
  //       this.http.post<any>(
  //         `${environment.localcloud}/session/setrefreshtype`,
  //         { cType }
  //       )
  //     );
  //   } catch (error) {
  //     console.error(error)
  //     res = [];
  //   }
  //   return res;
  // }
  setTimeZoneToLocal(cTimezone) {
    return __async(this, null, function* () {
      try {
        yield firstValueFrom(this.http.post(`${environment.realtimelocal}/session/settimezone`, { cTimezone }));
      } catch (error) {
        console.error(error);
      }
    });
  }
  static {
    this.\u0275fac = function SessionService_Factory(t) {
      return new (t || _SessionService)(\u0275\u0275inject(CommonfunctionService), \u0275\u0275inject(HttpClient), \u0275\u0275inject(MatSnackBar), \u0275\u0275inject(SocketService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SessionService, factory: _SessionService.\u0275fac, providedIn: "root" });
  }
};

export {
  LinkLineService,
  SessionService
};
//# sourceMappingURL=chunk-XIPFTUTL.js.map
