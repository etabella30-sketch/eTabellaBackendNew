import {
  isPlatformBrowser
} from "./chunk-YBHDQMOW.js";
import {
  PLATFORM_ID,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/core/services/cache/cache.service.ts
var TAB_CACHE_KEY = "__tab_json_cache__";
var CacheService = class _CacheService {
  constructor(platformId) {
    this.memCache = {};
    this.isBrowser = isPlatformBrowser(platformId);
  }
  readStore() {
    if (!this.isBrowser)
      return this.memCache;
    try {
      const raw = sessionStorage.getItem(TAB_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  writeStore(obj) {
    if (!this.isBrowser) {
      this.memCache = obj;
      return;
    }
    sessionStorage.setItem(TAB_CACHE_KEY, JSON.stringify(obj));
  }
  set(id, data, ttlMs) {
    const store = this.readStore();
    store[id] = {
      data,
      savedAt: Date.now(),
      ttl: typeof ttlMs === "number" ? ttlMs : null
    };
    this.writeStore(store);
  }
  get(id) {
    const store = this.readStore();
    const entry = store[id];
    if (!entry)
      return null;
    if (entry.ttl && Date.now() - entry.savedAt > entry.ttl) {
      delete store[id];
      this.writeStore(store);
      return null;
    }
    return entry.data;
  }
  has(id) {
    return this.get(id) !== null;
  }
  delete(id) {
    if (!id) {
      if (this.isBrowser)
        sessionStorage.removeItem(TAB_CACHE_KEY);
      this.memCache = {};
      return;
    }
    const store = this.readStore();
    delete store[id];
    this.writeStore(store);
  }
  keys() {
    return Object.keys(this.readStore());
  }
  static {
    this.\u0275fac = function CacheService_Factory(t) {
      return new (t || _CacheService)(\u0275\u0275inject(PLATFORM_ID));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CacheService, factory: _CacheService.\u0275fac, providedIn: "root" });
  }
};

export {
  CacheService
};
//# sourceMappingURL=chunk-ZLDLJ4OJ.js.map
