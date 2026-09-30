import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient
} from "./chunk-EVEACXQX.js";
import {
  BehaviorSubject,
  __async,
  catchError,
  firstValueFrom,
  fromEvent,
  interval,
  map,
  merge,
  of,
  startWith,
  switchMap,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/shared/services/network-status/network-status.service.ts
var NetworkStatusService = class _NetworkStatusService {
  constructor(http) {
    this.http = http;
    this.onlineSubject = new BehaviorSubject(true);
    this.init();
  }
  checkInternetConnection() {
    const connectivityCheckUrl = `${environment.connectivityCheckUrl}`;
    return this.http.get(connectivityCheckUrl, { responseType: "text" }).pipe(map(() => true), catchError((error) => {
      console.warn("Connectivity check failed:", error);
      return of(false);
    }));
  }
  checkNetworkStatus() {
    return __async(this, null, function* () {
      const connectivityCheckUrl = `${environment.connectivityCheckUrl}`;
      try {
        const result = yield firstValueFrom(this.http.get(connectivityCheckUrl, { responseType: "text" }).pipe(map(() => true), catchError((error) => {
          console.warn("Connectivity check failed:", error);
          return of(false);
        })));
        return result;
      } catch (error) {
        console.error("Unexpected error during network check:", error);
        return false;
      }
    });
  }
  init() {
    const online$ = fromEvent(window, "online").pipe(map(() => true));
    const offline$ = fromEvent(window, "offline").pipe(map(() => false));
    merge(online$, offline$, interval(1e4).pipe(map(() => navigator.onLine))).pipe(startWith(navigator.onLine), switchMap(() => this.checkInternetConnection())).subscribe((status) => this.onlineSubject.next(status));
  }
  get isOnline$() {
    return this.onlineSubject.asObservable();
  }
  static {
    this.\u0275fac = function NetworkStatusService_Factory(t) {
      return new (t || _NetworkStatusService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _NetworkStatusService, factory: _NetworkStatusService.\u0275fac, providedIn: "root" });
  }
};

export {
  NetworkStatusService
};
//# sourceMappingURL=chunk-RUQGLVFQ.js.map
