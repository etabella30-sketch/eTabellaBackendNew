import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
import {
  Router
} from "./chunk-FNSUDMGC.js";
import {
  BehaviorSubject,
  __async,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/core/services/header/header.service.ts
var HeaderService = class _HeaderService {
  constructor(ss, router) {
    this.ss = ss;
    this.router = router;
    this.Casedetail = null;
    this.userdetail = null;
    this.userDetailLoadPromise = null;
    this.currentfolder = {
      nBundleid: null,
      cBundlename: "Master bundle"
    };
    this.isCaseedit = new BehaviorSubject(false);
    this.expandhyper = false;
    this.casedetal = {};
    this.caseName = "";
    this.currentadminpath = new BehaviorSubject("");
    this.nCaseid = null;
    this.nPresentid = null;
    this.isGlobalSearch = false;
    this.jFilter = { cWithin: "M", cMatchCase: "C", cSearch: "", cLocation: "A", contentType: "All", isGlobalSearch: false };
    this.nSectionid = null;
    this.cFoldertype = null;
    this.search_within = null;
  }
  init() {
    this.userDetailLoadPromise ??= this.loadUserDetail();
  }
  loadUserDetail() {
    return __async(this, null, function* () {
      try {
        this.userdetail = yield this.ss.getUserInfo();
      } catch (err) {
        console.error(ErrorHandlerUtil.getErrorMessage(err));
        this.userdetail = null;
      }
    });
  }
  updatePath(newPath) {
    this.currentadminpath.next(newPath);
  }
  updateisCase(val) {
    this.isCaseedit.next(val);
  }
  // async caseDetete(mdl: caseDelReq): Promise<boolean> {
  //   try {
  //     const res: any = await firstValueFrom(
  //       this.http.post<caseDelRes>(`${environment.cloudUrl}${environment.coreservice}/case/casedelete`, mdl)
  //     );
  //     if (res && res.msg == 1) {
  //       this.tost.openSnackBar(res.value, '');
  //       return true;
  //     } else {
  //       this.tost.openSnackBar(res.value, '');
  //       return false;
  //     }
  //   } catch (err) {
  //     this.tost.openSnackBar(`Case deletion failed ${err}`, '');
  //     return false;
  //   }
  // }
  goUserHome() {
    this.router.navigate(["user/dashboard"], { replaceUrl: true });
  }
  goAdminHome() {
    this.router.navigate(["/admin/dashboard"], { replaceUrl: true });
  }
  getCaseid() {
    return this.nCaseid;
  }
  resetState() {
    this.Casedetail = null;
    this.userdetail = null;
    this.currentfolder = { nBundleid: null, cBundlename: "Master bundle" };
    this.isCaseedit.next(false);
    this.expandhyper = false;
    this.casedetal = {};
    this.caseName = "";
    this.currentadminpath.next("");
    this.nCaseid = null;
    this.nPresentid = null;
    this.isGlobalSearch = false;
    this.jFilter = { cWithin: "M", cMatchCase: "C", cSearch: "", cLocation: "A", contentType: "All", isGlobalSearch: false };
    this.nSectionid = null;
    this.cFoldertype = null;
    this.search_within = null;
    this.userDetailLoadPromise = null;
  }
  static {
    this.\u0275fac = function HeaderService_Factory(t) {
      return new (t || _HeaderService)(\u0275\u0275inject(SecureStorageService), \u0275\u0275inject(Router));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _HeaderService, factory: _HeaderService.\u0275fac, providedIn: "root" });
  }
};

export {
  HeaderService
};
//# sourceMappingURL=chunk-PNJCYNRI.js.map
