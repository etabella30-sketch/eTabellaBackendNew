import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
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

// src/app/shared/services/ticket/ticket.service.ts
var TicketService = class _TicketService {
  constructor(http, sStore, tost) {
    this.http = http;
    this.sStore = sStore;
    this.tost = tost;
  }
  getTicketList(nCaseid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/ticket/tickets`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getAllTicketList(nCaseid) {
    return __async(this, null, function* () {
      const params = new HttpParams().set("nCaseid", nCaseid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/ticket/casetickets`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  clearAllResolvedTickets(nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/ticket/clearticket`, { nCaseid }));
        if (res && res.msg == 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Failed to clear ${JSON.stringify(err)}`, "E");
        return false;
      }
    });
  }
  clearAllResolvedTicketsAsAdmin(nCaseid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/ticket/adminclearticket`, { nCaseid }));
        if (res && res.msg == 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Failed to clear ${JSON.stringify(err)}`, "E");
        return false;
      }
    });
  }
  resolveTicket(nTicketid) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/ticket/resolved`, { nTicketid }));
        if (res && res.msg == 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Failed to clear ${JSON.stringify(err)}`, "E");
        return false;
      }
    });
  }
  getCaseList() {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/ticket/caselist`));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  moduleimageUpload(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.uploadservice}/helpcenter/upload-image-ticket`, mdl));
        if (res.msg == -1) {
          this.tost.openSnackBar(`Image Upload failed ${res.error}`, "E");
          return { msg: -1, error: res.error, value: "" };
        } else {
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Image Upload failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  submitTicket(nCaseid, cSession, cDesc, cImage, cImagename) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/ticket/ticketbuilder`, { nCaseid, cSession, cDesc, cImage, cImagename }));
        if (res && res.msg == 1) {
          return true;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return false;
        }
      } catch (err) {
        this.tost.openSnackBar(`Ticket Not Submitted ${JSON.stringify(err)}`, "E");
        return false;
      }
    });
  }
  static {
    this.\u0275fac = function TicketService_Factory(t) {
      return new (t || _TicketService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(SecureStorageService), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TicketService, factory: _TicketService.\u0275fac, providedIn: "root" });
  }
};

export {
  TicketService
};
//# sourceMappingURL=chunk-WQBUN4X6.js.map
