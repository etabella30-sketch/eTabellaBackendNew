import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  Subject,
  __spreadProps,
  __spreadValues,
  computed,
  signal,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/shared/services/selection-actions/selection-actions.service.ts
var SELECTION_ACTIONS_DEFAULT = {
  qf: false,
  fact: true,
  doclink: true,
  exclusive: null,
  qfIncludeNote: false,
  qfIncludeTextPlusNote: false,
  copyDocName: false,
  copyPagination: false
};
var STORAGE_KEY = "selectionActions";
var STORAGE_KEY_QFSEL = "selectionActions:qfactSelected";
var SelectionActionsService = class _SelectionActionsService {
  requestOpenToolbar() {
    this._openToolbar$.next();
  }
  toggleQFactIssue(nIid) {
    this._qfactSelected.update((prev) => prev.includes(nIid) ? prev.filter((x) => x !== nIid) : [...prev, nIid]);
    this.persistQFactSelected(this._qfactSelected());
  }
  /** Synchronously re-read qfactSelected from localStorage and reconcile the
   *  in-memory signal if they differ. Used by the QFact rapid-create path
   *  in iframe contexts (individual-doc) to bypass cross-window 'storage'
   *  event latency: when the parent updates qfactSelected, the iframe's
   *  signal updates only after the browser dispatches the 'storage' event,
   *  which can lag by tens of milliseconds. A fast highlight that mouse-ups
   *  inside that lag would otherwise read the stale signal and silently
   *  fall back to the Unassigned issue. Calling this at the start of submit
   *  guarantees the signal reflects the parent's latest write. */
  refreshQFactSelectedFromStorage() {
    const fromStorage = this.loadQFactSelected();
    const current = this._qfactSelected();
    const changed = fromStorage.length !== current.length || fromStorage.some((id, i) => id !== current[i]);
    if (changed) {
      this._qfactSelected.set(fromStorage);
    }
    return fromStorage;
  }
  setQFactIssues(nIids) {
    this._qfactSelected.set([...nIids]);
    this.persistQFactSelected(this._qfactSelected());
  }
  clearQFactIssues() {
    this._qfactSelected.set([]);
    this.persistQFactSelected([]);
  }
  /** Reset to defaults: clears the explicit issue picks and restores the
   *  default toolbar mode (qf=false, fact=true, doclink=true). The host
   *  (individual-doc) calls this on ngOnDestroy / beforeunload so that
   *  re-opening a doc starts fresh — the QFact panel doesn't auto-open
   *  in evidence/admin pages just because the previous individual-doc
   *  session left QFact armed. */
  resetToDefaults() {
    this._qfactSelected.set([]);
    this.persistQFactSelected([]);
    this.commit(() => __spreadValues({}, SELECTION_ACTIONS_DEFAULT));
  }
  requestQFactRefresh() {
    this._qfactRefresh$.next();
  }
  requestOpenQFactManage() {
    this._qfactManageRequest$.next();
  }
  constructor(storage) {
    this.storage = storage;
    this._state = signal(this.load());
    this.state = this._state.asReadonly();
    this.activeArr = computed(() => {
      const s = this._state();
      const out = [];
      if (s.qf)
        out.push("QF");
      if (s.fact)
        out.push("F");
      if (s.doclink)
        out.push("D");
      return out;
    });
    this.isCopy = computed(() => this._state().exclusive === "COPY");
    this.isSingle = computed(() => !this.isCopy() && this.activeArr().length === 1);
    this.singleKind = computed(() => this.isSingle() ? this.activeArr()[0] : null);
    this.isQFactRapid = computed(() => this.isSingle() && this.singleKind() === "QF");
    this.modeLabel = computed(() => {
      if (this.isCopy())
        return "Copy Mode";
      if (this.isSingle()) {
        const k = this.singleKind();
        return k === "QF" ? "QFact Mode" : k === "F" ? "Fact Mode" : "DocLink Mode";
      }
      return null;
    });
    this.summary = computed(() => {
      if (this.isCopy()) {
        const parts = [this._state().copyDocName ? "With Doc Name" : "Text only"];
        if (this._state().copyPagination)
          parts.push("Page & Line");
        return parts.join(" + ");
      }
      if (this.isSingle())
        return this.modeLabel();
      return this.activeArr().map((k) => k === "QF" ? "QFact" : k === "F" ? "Fact" : "DocLink").join(" \u2022 ");
    });
    this._openToolbar$ = new Subject();
    this.openToolbar$ = this._openToolbar$.asObservable();
    this._qfactSelected = signal(this.loadQFactSelected());
    this.qfactSelected = this._qfactSelected.asReadonly();
    this.qfactSelectedCount = computed(() => this._qfactSelected().length);
    this._qfactRefresh$ = new Subject();
    this.qfactRefresh$ = this._qfactRefresh$.asObservable();
    this._qfactManageRequest$ = new Subject();
    this.qfactManageRequest$ = this._qfactManageRequest$.asObservable();
    this.onCrossWindowStorage = (e) => {
      if (e.key === null) {
        this._state.set(this.load());
        this._qfactSelected.set(this.loadQFactSelected());
        return;
      }
      if (e.key === STORAGE_KEY) {
        this._state.set(this.load());
      } else if (e.key === STORAGE_KEY_QFSEL) {
        this._qfactSelected.set(this.loadQFactSelected());
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", this.onCrossWindowStorage);
    }
  }
  commit(updater) {
    this._state.update(updater);
    this.persist(this._state());
  }
  setQFact() {
    this.commit((s) => __spreadProps(__spreadValues({}, s), { qf: true, fact: false, doclink: false, exclusive: null }));
  }
  setCopy() {
    this.commit((s) => __spreadProps(__spreadValues({}, s), { qf: false, fact: false, doclink: false, exclusive: "COPY" }));
  }
  toggleAdditive(key) {
    this.commit((prev) => {
      if (prev.qf || prev.exclusive === "COPY") {
        return __spreadProps(__spreadValues({}, prev), { qf: false, exclusive: null, fact: key === "fact", doclink: key === "doclink" });
      }
      const next = __spreadProps(__spreadValues({}, prev), { [key]: !prev[key] });
      if (!next.fact && !next.doclink)
        next[key] = true;
      return next;
    });
  }
  setQfSubOption(key, value) {
    this.commit((s) => __spreadProps(__spreadValues({}, s), { [key]: value }));
  }
  setCopySubOption(key, value) {
    this.commit((s) => __spreadProps(__spreadValues({}, s), { [key]: value }));
  }
  load() {
    try {
      const raw = this.storage?.getStorage(STORAGE_KEY);
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            return __spreadValues(__spreadValues({}, SELECTION_ACTIONS_DEFAULT), parsed);
          }
        } catch {
        }
      }
      return __spreadValues({}, SELECTION_ACTIONS_DEFAULT);
    } catch {
      return __spreadValues({}, SELECTION_ACTIONS_DEFAULT);
    }
  }
  persist(state) {
    try {
      this.storage.setStorage(STORAGE_KEY, JSON.stringify(state));
    } catch {
    }
  }
  /** Stringified array of issue IDs the user has picked. Stored under a
   *  separate key so cross-window sync only fires when picks actually
   *  change (the toolbar mode toggles update much more often). */
  loadQFactSelected() {
    try {
      const raw = this.storage?.getStorage(STORAGE_KEY_QFSEL);
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed))
            return parsed.filter((x) => typeof x === "string");
        } catch {
        }
      }
      return [];
    } catch {
      return [];
    }
  }
  persistQFactSelected(ids) {
    try {
      this.storage.setStorage(STORAGE_KEY_QFSEL, JSON.stringify(ids));
    } catch {
    }
  }
  static {
    this.\u0275fac = function SelectionActionsService_Factory(t) {
      return new (t || _SelectionActionsService)(\u0275\u0275inject(SecureStorageService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SelectionActionsService, factory: _SelectionActionsService.\u0275fac, providedIn: "root" });
  }
};

export {
  SelectionActionsService
};
//# sourceMappingURL=chunk-FW6JNL2T.js.map
