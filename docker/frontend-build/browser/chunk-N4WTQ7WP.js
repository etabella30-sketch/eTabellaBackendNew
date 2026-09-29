import {
  TranslateService
} from "./chunk-DWVFAK3Q.js";
import {
  inject,
  signal,
  ɵɵdefineInjectable
} from "./chunk-OLJKHPOW.js";

// src/app/core/services/language/language.service.ts
var LanguageService = class _LanguageService {
  getTranslation(arg0) {
    throw new Error("Method not implemented.");
  }
  constructor() {
    this.translate = inject(TranslateService);
    this.currentLang = signal("en");
    this.initLanguage();
  }
  initLanguage() {
    const savedLang = localStorage.getItem("app-language") || "en";
    this.translate.addLangs(["en", "es"]);
    this.translate.setDefaultLang("en");
    this.translate.use(savedLang);
    this.currentLang.set(savedLang);
  }
  changeLanguage(lang) {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem("app-language", lang);
  }
  static {
    this.\u0275fac = function LanguageService_Factory(t) {
      return new (t || _LanguageService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LanguageService, factory: _LanguageService.\u0275fac, providedIn: "root" });
  }
};

export {
  LanguageService
};
//# sourceMappingURL=chunk-N4WTQ7WP.js.map
