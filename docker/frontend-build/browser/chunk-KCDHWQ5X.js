import {
  Subject,
  ɵɵdefineInjectable
} from "./chunk-OLJKHPOW.js";

// src/app/shared/services/communication/communication.service.ts
var CommunicationService = class _CommunicationService {
  constructor() {
    this.functionCallSource = new Subject();
    this.functionCalled$ = this.functionCallSource.asObservable();
  }
  callFunction(data) {
    this.functionCallSource.next(data);
  }
  static {
    this.\u0275fac = function CommunicationService_Factory(t) {
      return new (t || _CommunicationService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CommunicationService, factory: _CommunicationService.\u0275fac, providedIn: "root" });
  }
};

export {
  CommunicationService
};
//# sourceMappingURL=chunk-KCDHWQ5X.js.map
