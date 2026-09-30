import {
  AuthValidationService
} from "./chunk-ZDDERD6Z.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  Router
} from "./chunk-FNSUDMGC.js";
import {
  Injector,
  TimeoutError,
  catchError,
  throwError,
  timeout,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/core/interceptor/auth.interceptor.ts
var DEFAULT_TIMEOUT_MS = 3e4;
var LONG_RUNNING_PATHS = [
  "/upload",
  "/uploadapi",
  "/export",
  "/transcript/publish",
  "/transcript/html-file-to-doc-stream",
  "/batchfile",
  "/hyperlink",
  "/pagination",
  "/ocr",
  "/download"
];
var AuthInterceptor = class _AuthInterceptor {
  constructor(router, storageService, injector) {
    this.router = router;
    this.storageService = storageService;
    this.injector = injector;
    this.authValidation = null;
  }
  getAuthValidation() {
    if (!this.authValidation) {
      this.authValidation = this.injector.get(AuthValidationService);
    }
    return this.authValidation;
  }
  intercept(request, next) {
    const isAuthRequest = request.url.includes("/auth/signin") || request.url.includes("/auth/forgotpassword");
    const token = this.storageService.getStorage("token");
    if (token && !isAuthRequest) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    const isValidateRequest = request.url.includes("/auth/validate");
    const isFormData = typeof FormData !== "undefined" && request.body instanceof FormData;
    const isLongRunning = LONG_RUNNING_PATHS.some((p) => request.url.includes(p));
    const shouldTimeout = !isFormData && !isLongRunning;
    const stream$ = next.handle(request);
    const guarded$ = shouldTimeout ? stream$.pipe(timeout(DEFAULT_TIMEOUT_MS)) : stream$;
    return guarded$.pipe(catchError((error) => {
      if (error instanceof TimeoutError) {
        console.warn(`AuthInterceptor: request timed out after ${DEFAULT_TIMEOUT_MS}ms \u2014 ${request.method} ${request.url}`);
        return throwError(() => ({
          status: 0,
          statusText: "Request Timeout",
          url: request.url,
          error: { code: "REQUEST_TIMEOUT", message: `Request timed out after ${DEFAULT_TIMEOUT_MS / 1e3}s` }
        }));
      }
      if (error.status === 401) {
        const isSignoutRequest = request.url.includes("/auth/signout");
        if (!isValidateRequest && !isSignoutRequest) {
          this.storageService.logOut();
          this.router.navigate(["/auth/login"]).then((success) => {
            if (!success) {
              window.location.href = "/auth/login";
            }
          });
        }
      } else if (error.status === 403) {
        const isRealtimeRoute = this.router.url.includes("/realtime") || this.router.url.includes("/rt-realtime") || this.router.url.includes("/viewer");
        if (!isRealtimeRoute) {
          this.router.navigate(["/user/dashboard"]);
        }
      }
      return throwError(error);
    }));
  }
  static {
    this.\u0275fac = function AuthInterceptor_Factory(t) {
      return new (t || _AuthInterceptor)(\u0275\u0275inject(Router), \u0275\u0275inject(SecureStorageService), \u0275\u0275inject(Injector));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AuthInterceptor, factory: _AuthInterceptor.\u0275fac });
  }
};

export {
  AuthInterceptor
};
//# sourceMappingURL=chunk-A3PZ3JQ2.js.map
