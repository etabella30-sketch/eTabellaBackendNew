import {
  CacheService
} from "./chunk-ZLDLJ4OJ.js";
import {
  RealtimeFacade
} from "./chunk-2BPOYM2X.js";
import {
  CasedetailService
} from "./chunk-XYPEOTVH.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  UserdashboardService
} from "./chunk-RXCKHUOJ.js";
import {
  MyfileService
} from "./chunk-M4TJ3SSY.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import {
  AuthValidationService
} from "./chunk-ZDDERD6Z.js";
import {
  CommonfunctionService,
  MULTI_DEVICE_EXEMPT_CASE_ID,
  MULTI_DEVICE_SESSION_KEY
} from "./chunk-TNIBXRF4.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  ErrorHandlerUtil
} from "./chunk-DXEI33EW.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient
} from "./chunk-EVEACXQX.js";
import {
  __async,
  __spreadProps,
  __spreadValues,
  computed,
  firstValueFrom,
  inject,
  signal,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/userpanel/services/user-dashboard/user-dashboard.facade.ts
var UserDashboardFacade = class _UserDashboardFacade {
  constructor() {
    this.api = inject(UserdashboardService);
    this.storage = inject(SecureStorageService);
    this.socket = inject(SocketService);
    this.state = signal({
      cases: [],
      sessions: [],
      tickets: [],
      loading: true,
      page: 1,
      hasMore: true,
      userProfile: null,
      error: null
    });
    this.cases = computed(() => this.state().cases);
    this.loading = computed(() => this.state().loading);
    this.hasMore = computed(() => this.state().hasMore);
    this.userProfile = computed(() => this.state().userProfile);
    this.error = computed(() => this.state().error);
    this.isRealtimeUser = computed(() => this.state().cases.some((c) => !c.jPermission?.includes("RT")));
    this.setupSocketListeners();
  }
  // Actions
  initDashboard() {
    return __async(this, null, function* () {
      this.updateState({ loading: true, error: null });
      try {
        console.log("\u{1F504} Initializing dashboard...");
        const userProfile = yield this.storage.getUserInfo();
        console.log("\u{1F464} User profile loaded:", userProfile);
        this.updateState({ userProfile });
        yield this.loadPage(1, true);
        console.log("\u2705 Dashboard loaded successfully");
        this.loadDashboardInfo();
      } catch (error) {
        console.error("\u274C Dashboard initialization error:", error);
        this.handleError(error, "Error initializing dashboard");
      } finally {
        this.updateState({ loading: false });
      }
    });
  }
  loadMore() {
    return __async(this, null, function* () {
      const currentState = this.state();
      console.log("\u{1F4DC} loadMore triggered. Page:", currentState.page, "Loading:", currentState.loading, "HasMore:", currentState.hasMore);
      if (currentState.loading || !currentState.hasMore)
        return;
      this.updateState({ loading: true });
      try {
        console.log("\u{1F504} Loading page:", currentState.page + 1);
        yield this.loadPage(currentState.page + 1, false);
      } catch (error) {
        this.handleError(error, "Error loading more cases");
      } finally {
        this.updateState({ loading: false });
      }
    });
  }
  loadPage(page, reset) {
    return __async(this, null, function* () {
      const newCases = yield this.api.getDashboardlist(page);
      console.log(`\u2705 Page ${page} loaded. Items:`, newCases.length);
      this.updateState((state) => ({
        cases: reset ? newCases : [...state.cases, ...newCases],
        page,
        hasMore: newCases.length > 0
        // Re-apply internal updates if needed (tickets/sessions mapping logic moved here)
      }));
      const allCases = reset ? newCases : [...this.state().cases];
      if (allCases.some((c) => c.nCaseid === MULTI_DEVICE_EXEMPT_CASE_ID)) {
        localStorage.setItem(MULTI_DEVICE_SESSION_KEY, "true");
      }
      this.mapSessionsToCases();
      this.mapTicketsToCases();
    });
  }
  loadDashboardInfo() {
    return __async(this, null, function* () {
      try {
        const dashInfo = yield this.api.getDashInfo();
        if (dashInfo?.length) {
          const sessions = dashInfo[1] ?? [];
          this.updateState({ sessions });
          this.mapSessionsToCases();
        }
      } catch (error) {
        console.error("Error loading dashboard info", error);
      }
    });
  }
  // Business Logic Helpers
  mapSessionsToCases() {
    const { cases, sessions } = this.state();
    if (!sessions.length)
      return;
    const updatedCases = cases.map((c) => {
      const session = sessions.find((s) => s.nCaseid === c.nCaseid);
      return session ? __spreadProps(__spreadValues({}, c), { nSesid: session.nSesid }) : c;
    });
    this.updateState({ cases: updatedCases });
  }
  mapTicketsToCases() {
    const { cases, tickets } = this.state();
    if (!tickets.length)
      return;
    const updatedCases = cases.map((c) => {
      const ticket = tickets.find((t) => t.nCaseid === c.nCaseid);
      return ticket ? __spreadProps(__spreadValues({}, c), { ticketCount: ticket.totaltickets }) : c;
    });
    this.updateState({ cases: updatedCases });
  }
  // Socket Handling
  setupSocketListeners() {
    this.socket.getNotification().subscribe(() => {
      this.initDashboard();
    });
  }
  // Updates
  updateTicketCount(caseId, count) {
    const { tickets } = this.state();
    const existingIndex = tickets.findIndex((t) => t.nCaseid === caseId);
    let newTickets = [...tickets];
    if (existingIndex > -1) {
      newTickets[existingIndex] = __spreadProps(__spreadValues({}, newTickets[existingIndex]), { totaltickets: count });
    } else {
      newTickets.push({ nCaseid: caseId, totaltickets: count });
    }
    this.updateState({ tickets: newTickets });
    this.mapTicketsToCases();
  }
  resetState() {
    this.state.set({
      cases: [],
      sessions: [],
      tickets: [],
      loading: true,
      page: 1,
      hasMore: true,
      userProfile: null,
      error: null
    });
  }
  // Utility
  updateState(partialState) {
    this.state.update((current) => {
      const updates = typeof partialState === "function" ? partialState(current) : partialState;
      return __spreadValues(__spreadValues({}, current), updates);
    });
  }
  handleError(error, context) {
    const msg = `${context}: ${ErrorHandlerUtil.getErrorMessage(error)}`;
    this.updateState({ error: msg });
    console.error(msg);
  }
  static {
    this.\u0275fac = function UserDashboardFacade_Factory(t) {
      return new (t || _UserDashboardFacade)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _UserDashboardFacade, factory: _UserDashboardFacade.\u0275fac, providedIn: "root" });
  }
};

// src/app/core/services/logout/logout.service.ts
var LogoutService = class _LogoutService {
  constructor(http, sStore, authValidation) {
    this.http = http;
    this.sStore = sStore;
    this.authValidation = authValidation;
    this.dashboardService = inject(UserdashboardService);
    this.dashboardFacade = inject(UserDashboardFacade);
    this.headerService = inject(HeaderService);
    this.casedetailService = inject(CasedetailService);
    this.realtimeFacade = inject(RealtimeFacade);
    this.cf = inject(CommonfunctionService);
    this.myfileService = inject(MyfileService);
    this.cacheService = inject(CacheService);
  }
  logout() {
    return __async(this, null, function* () {
      const mdl = { cBroweserid: this.sStore.getStorage("browserid") };
      try {
        yield firstValueFrom(this.http.post(`${environment.cloudUrl}${environment.authservice}/auth/signout`, mdl));
      } catch (err) {
      }
      this.authValidation.clearCache();
      localStorage.removeItem(MULTI_DEVICE_SESSION_KEY);
      this.sStore.logOut();
      this.dashboardService.invalidateCache();
      this.dashboardFacade.resetState();
      this.headerService.resetState();
      this.casedetailService.resetState();
      this.realtimeFacade.resetState();
      this.cf.resetState();
      this.myfileService.resetState();
      this.cacheService.delete();
      return true;
    });
  }
  static {
    this.\u0275fac = function LogoutService_Factory(t) {
      return new (t || _LogoutService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(SecureStorageService), \u0275\u0275inject(AuthValidationService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LogoutService, factory: _LogoutService.\u0275fac, providedIn: "root" });
  }
};

export {
  UserDashboardFacade,
  LogoutService
};
//# sourceMappingURL=chunk-ZC2EPQ66.js.map
