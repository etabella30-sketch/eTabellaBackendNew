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

// src/app/shared/services/task/task.service.ts
var TaskService = class _TaskService {
  constructor(http, tost) {
    this.http = http;
    this.tost = tost;
  }
  getTaskList(nCaseid, cTasktype) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("cTasktype", cTasktype);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/task/gettask`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  taskBuilder(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/task/taskBuilder`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Task creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  deleteTask(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/task/taskdelete`, { nTaskid: mdl.nTaskid }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  getTaskDetail(nTaskid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nTaskid", nTaskid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/task/gettaskdetail`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  get_sidenavIssue(nCaseid, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/sidenav/facts/issues`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  get_sidenavTask(nCaseid, jFilter) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("jFilter", JSON.stringify(jFilter || []));
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/sidenav/file/tasks`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  get_sidenavTaskByissue(nCaseid, nIssueid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("nIssueid", nIssueid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/sidenav/tasksbyissue`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  deleteFactTask(mdl) {
    return __async(this, null, function* () {
      let res = [];
      try {
        res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/task/facttaskdelete`, { nTaskid: mdl.nTaskid, nFSid: mdl.nFSid }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  updateTaskProgress(body) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/task/updateTaskProgress`, body));
        if (res && res[0]?.msg == 1) {
          return true;
        }
        return false;
      } catch (err) {
        this.tost.error(`Task Progrss Update failed ${err}`);
        return false;
      }
    });
  }
  taskBuilder_v2(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/task/taskBuilder/v2`, mdl));
        if (res && res.msg == 1) {
          this.tost.openSnackBar(res.value, "");
          return res;
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res;
        }
      } catch (err) {
        this.tost.openSnackBar(`Task creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  getTaskDetailV2(nTaskid) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nTaskid", nTaskid);
      let res = [];
      try {
        res = yield firstValueFrom(this.http.get(`${environment.cloudUrl}${environment.coreservice}/task/gettaskdetail/v2`, { params }));
      } catch (error) {
        console.error(error);
        res = [];
      }
      return res;
    });
  }
  taskUpdateStatus(mdl) {
    return __async(this, null, function* () {
      try {
        const res = yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.coreservice}/task/taskBuilder/updatestatus`, mdl));
        if (res && res[0].msg == 1) {
          this.tost.openSnackBar(res.value || "Updated", "");
          return res[0];
        } else {
          this.tost.openSnackBar(res.value, "E");
          return res[0];
        }
      } catch (err) {
        this.tost.openSnackBar(`Task creation failed ${err}`, "E");
        return { msg: -1, error: err, value: "" };
      }
    });
  }
  static {
    this.\u0275fac = function TaskService_Factory(t) {
      return new (t || _TaskService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(TostbarService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TaskService, factory: _TaskService.\u0275fac, providedIn: "root" });
  }
};

export {
  TaskService
};
//# sourceMappingURL=chunk-PDZ7367Z.js.map
