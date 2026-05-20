import {
  WebRTCService
} from "./chunk-EICOARUT.js";
import {
  PresentService
} from "./chunk-DRZF5GH5.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/screenshare/screen-viewer/screen-viewer.component.ts
var _c0 = ["remoteVideo"];
function ScreenViewerComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 3)(1, "h3");
    \u0275\u0275text(2, "Debug Information");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "pre");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 5);
    \u0275\u0275listener("click", function ScreenViewerComponent_Conditional_3_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.tryReconnect());
    });
    \u0275\u0275text(6, " Retry Connection ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.debugInfo);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r1.isReconnecting);
  }
}
function ScreenViewerComponent_Conditional_4_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 11);
    \u0275\u0275element(1, "circle", 15);
    \u0275\u0275elementStart(2, "circle", 16);
    \u0275\u0275element(3, "animateTransform", 17);
    \u0275\u0275elementEnd()();
  }
}
function ScreenViewerComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275element(1, "div", 6);
    \u0275\u0275elementStart(2, "div", 7)(3, "div")(4, "div", 8)(5, "div")(6, "h6", 9);
    \u0275\u0275text(7, " Ready to join ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "h6", 10);
    \u0275\u0275text(9, " Would you like to join the live screen sharing? ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, ScreenViewerComponent_Conditional_4_Conditional_10_Template, 4, 0, ":svg:svg", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 12)(12, "btn", 13);
    \u0275\u0275listener("click", function ScreenViewerComponent_Conditional_4_Template_btn_click_12_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.askForScreenShare());
    });
    \u0275\u0275text(13, "Join");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "btn", 14);
    \u0275\u0275listener("click", function ScreenViewerComponent_Conditional_4_Template_btn_click_14_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closePopUp());
    });
    \u0275\u0275text(15, "Close");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(10);
    \u0275\u0275conditional(10, ctx_r1.isAsked ? 10 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r1.isAsked);
  }
}
var ScreenViewerComponent = class _ScreenViewerComponent {
  constructor(socket, webRTCService, store, cdr, presentService) {
    this.socket = socket;
    this.webRTCService = webRTCService;
    this.store = store;
    this.cdr = cdr;
    this.presentService = presentService;
    this.presentDetail = {};
    this.trackSubscriptions = [];
    this.isStarted = false;
    this.isVideoPlaying = false;
    this.showPopUpForRunningScreenShare = false;
    this.isAsked = false;
    this.debugInfo = "";
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = 5;
    this.isReconnecting = false;
    this.sfuConfig = {
      producerId: "",
      rtpCapabilities: {}
    };
    this.reconnectionSubscription = this.webRTCService.reconnectionEvents$.subscribe((event) => {
      console.log("Reconnection event:", event);
      this.cdr.detectChanges();
    });
    this.webRTCSubscription = this.socket.getWebRTCEvents().subscribe((res) => __async(this, null, function* () {
      console.log("webRTC user", res);
      const data = res.data;
      if (res.event == "SCREEN-SHARE-STOP") {
        this.stopScreenShare();
      } else if (res.event == "SCREEN-SHARE-START") {
        console.log("Screen share start event received");
        this.sfuConfig = data.sfuConfig;
        this.showPopUpForRunningScreenShare = true;
        this.cdr.detectChanges();
      } else if (res.event == "EXISTS-SCREEN-SHARE") {
        console.log("Existing screen share detected");
        this.sfuConfig = data.sfuConfig;
        this.showPopUpForRunningScreenShare = true;
        this.cdr.detectChanges();
      } else if (res.event == "RECONNECTION-FAILED") {
        console.log("Reconnection failed event received");
        this.sfuConfig = data.sfuConfig;
        this.stopScreenShare();
        this.showPopUpForRunningScreenShare = true;
        this.cdr.detectChanges();
      }
    }));
  }
  ngOnDestroy() {
    try {
      if (this.webRTCSubscription) {
        this.webRTCSubscription.unsubscribe();
      }
      if (this.reconnectionSubscription) {
        this.reconnectionSubscription.unsubscribe();
      }
      this.trackSubscriptions.forEach((sub) => {
        if (sub)
          sub.unsubscribe();
      });
      this.trackSubscriptions = [];
      if (this.reconnectionTimer) {
        clearTimeout(this.reconnectionTimer);
      }
      this.stopScreenShare();
    } catch (error) {
      console.error("Error in ngOnDestroy:", error);
    }
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.nUserid = yield this.store.getUserId();
      console.log("Screen viewer initialized for user:", this.nUserid);
      try {
        this.socket.emitWebRTCEvents({
          event: "CHECK-HAVE-SCREEN-SHARE",
          data: {
            nUserid: this.nUserid,
            nPresentid: this.presentDetail.nPresentid
          },
          nToUserId: this.presentDetail.nPresenterid
        });
      } catch (error) {
        console.error("Error checking for existing screen share:", error);
      }
    });
  }
  closePopUp() {
    this.isAsked = false;
    this.showPopUpForRunningScreenShare = false;
    this.cdr.detectChanges();
  }
  askForScreenShare() {
    this.isAsked = true;
    this.isStarted = true;
    this.closePopUp();
    this.startConsuming();
    this.cdr.detectChanges();
  }
  error(error) {
    console.error("Screen viewer error:", error);
    this.debugInfo = JSON.stringify(error, null, 2);
    this.onExists();
  }
  onExists() {
    this.isStarted = false;
    this.cdr.detectChanges();
  }
  stopScreenShare() {
    try {
      this.isVideoPlaying = false;
      const video = this.remoteVideo.nativeElement;
      if (video) {
        if (video.srcObject) {
          const mediaStream = video.srcObject;
          mediaStream.getTracks().forEach((track) => {
            track.stop();
            console.log(`Track ${track.id} stopped`);
          });
        }
        video.srcObject = null;
      }
      this.webRTCService.ngOnDestroy();
      this.isAsked = false;
      this.showPopUpForRunningScreenShare = false;
      this.reconnectionAttempts = 0;
      this.isReconnecting = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error("Error while stopping screen sharing:", error);
    }
    this.isStarted = false;
    this.cdr.detectChanges();
  }
  tryReconnect() {
    return __async(this, null, function* () {
      if (this.isReconnecting || this.reconnectionAttempts >= this.maxReconnectionAttempts) {
        console.log("Max reconnection attempts reached or already reconnecting");
        return;
      }
      this.isReconnecting = true;
      this.reconnectionAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectionAttempts}/${this.maxReconnectionAttempts})`);
      try {
        yield this.startConsuming();
      } catch (error) {
        console.error("Reconnection attempt failed:", error);
        if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
          const delay = Math.min(2e3 * Math.pow(1.5, this.reconnectionAttempts - 1), 1e4);
          console.log(`Scheduling next reconnection attempt in ${delay}ms`);
          this.reconnectionTimer = setTimeout(() => {
            this.isReconnecting = false;
            this.tryReconnect();
          }, delay);
        } else {
          console.error("Failed to reconnect after maximum attempts");
          this.isReconnecting = false;
          this.stopScreenShare();
        }
      }
    });
  }
  // Function to monitor media track to detect issues
  monitorTrack(track) {
    console.log(`Monitoring track: ${track.id}, kind: ${track.kind}, readyState: ${track.readyState}`);
    console.log(`Track settings:`, track.getSettings());
    console.log(`Track constraints:`, track.getConstraints());
    const handleTrackEnded = () => {
      console.log(`Track ${track.id} ended`);
      if (this.isStarted && !this.isReconnecting) {
        console.log("Track ended unexpectedly, attempting to reconnect");
        this.tryReconnect();
      }
    };
    const handleTrackMute = () => {
      console.log(`Track ${track.id} muted`);
      track.enabled = true;
      if (this.isStarted && !this.isReconnecting) {
        console.log("Track muted, attempting to reconnect in 2 seconds");
        setTimeout(() => {
          this.tryReconnect();
        }, 2e3);
      }
    };
    const handleTrackUnmute = () => {
      console.log(`Track ${track.id} unmuted`);
      track.enabled = true;
    };
    track.addEventListener("ended", handleTrackEnded);
    track.addEventListener("mute", handleTrackMute);
    track.addEventListener("unmute", handleTrackUnmute);
    const enableInterval = setInterval(() => {
      if (track && track.readyState !== "ended") {
        track.enabled = true;
      } else {
        clearInterval(enableInterval);
      }
    }, 1e3);
    this.trackSubscriptions.push({
      unsubscribe: () => {
        clearInterval(enableInterval);
      }
    });
    this.trackSubscriptions.push({
      unsubscribe: () => {
        track.removeEventListener("ended", handleTrackEnded);
        track.removeEventListener("mute", handleTrackMute);
        track.removeEventListener("unmute", handleTrackUnmute);
      }
    });
  }
  startConsuming() {
    return __async(this, null, function* () {
      try {
        console.log("Starting consumption process");
        const { msg, stream } = yield this.webRTCService.joinViewer(this.presentDetail.nPresentid);
        this.remoteVideo.nativeElement.srcObject = stream;
        this.remoteVideo.nativeElement.play();
        return;
      } catch (error) {
        console.error("Error while starting consumption:", error);
        this.debugInfo = `Consumption error: ${error instanceof Error ? error.message : String(error)}`;
        this.isStarted = true;
        this.isVideoPlaying = false;
        this.cdr.detectChanges();
        if (!this.isReconnecting) {
          throw error;
        }
      }
    });
  }
  static {
    this.\u0275fac = function ScreenViewerComponent_Factory(t) {
      return new (t || _ScreenViewerComponent)(\u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(WebRTCService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(PresentService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ScreenViewerComponent, selectors: [["screen-viewer"]], viewQuery: function ScreenViewerComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.remoteVideo = _t.first);
      }
    }, inputs: { presentDetail: "presentDetail" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 5, vars: 3, consts: [["remoteVideo", ""], [1, "video-container", 3, "hidden"], ["autoplay", "", "playsinline", "", 1, "h-full", "w-full", "fixed", "left-0", "top-0", "bg-black"], [1, "debug-info"], [1, "fixed", "top-0", "left-0", "z-[99999]", "h-full", "w-full", "grid", "place-items-center"], [1, "retry-btn", 3, "click", "disabled"], [1, "absolute", "top-0", "left-0", "z-[10]", "h-full", "w-full", "bg-black/50"], [1, "z-20", "relative", "block", "w-[500px]", "bg-[#f6fbff]", "p-10", "rounded-base"], [1, "flex", "p-2.5"], [1, "text-lg", "whitespace-nowrap", "font-semibold", "mb-2.5"], [1, "text-xs", "whitespace-nowrap"], ["viewBox", "0 0 50 50", 1, "w-[50px]", "ms-auto"], [1, "flex", "items-center", "gap-2.5", "mt-4"], [3, "click", "disabled"], ["mode", "white", 3, "click"], ["cx", "25", "cy", "25", "r", "20", "fill", "none", "stroke", "black", "stroke-width", "2.5", 1, "path"], ["cx", "25", "cy", "25", "r", "20", "fill", "none", "stroke", "#ff3d00", "stroke-width", "3", "stroke-dasharray", "90, 150", "stroke-dashoffset", "-35", 1, "path"], ["attributeName", "transform", "type", "rotate", "values", "0 25 25;360 25 25", "dur", "0.75s", "repeatCount", "indefinite"]], template: function ScreenViewerComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275element(1, "video", 2, 0);
        \u0275\u0275template(3, ScreenViewerComponent_Conditional_3_Template, 7, 2, "div", 3);
        \u0275\u0275elementEnd();
        \u0275\u0275template(4, ScreenViewerComponent_Conditional_4_Template, 16, 2, "div", 4);
      }
      if (rf & 2) {
        \u0275\u0275property("hidden", !ctx.isStarted);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(3, ctx.debugInfo && ctx.isStarted && !ctx.isVideoPlaying ? 3 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(4, ctx.showPopUpForRunningScreenShare ? 4 : -1);
      }
    }, dependencies: [ButtonComponent], styles: ["\n\n/*# sourceMappingURL=screen-viewer.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ScreenViewerComponent, { className: "ScreenViewerComponent", filePath: "src\\app\\presentation\\components\\screenshare\\screen-viewer\\screen-viewer.component.ts", lineNumber: 20 });
})();
export {
  ScreenViewerComponent
};
//# sourceMappingURL=chunk-7FNPDHCH.js.map
