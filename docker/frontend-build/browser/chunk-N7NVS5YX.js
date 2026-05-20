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
import "./chunk-4BFWRZ22.js";
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
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵlistener,
  ɵɵresolveWindow
} from "./chunk-OLJKHPOW.js";

// src/app/presentation/components/screenshare/screen-share/screen-share.component.ts
var ScreenShareComponent = class _ScreenShareComponent {
  handleBeforeUnload(event) {
    if (this.isScreenSharing) {
      this.handleScreenShareStop();
    }
  }
  constructor(webRTCService, cdr, presentService, socket, store) {
    this.webRTCService = webRTCService;
    this.cdr = cdr;
    this.presentService = presentService;
    this.socket = socket;
    this.store = store;
    this.presentDetail = {};
    this.isScreenSharingChange = new EventEmitter();
    this.reconnectionAttempts = {};
    this.reconnectionTimers = {};
    this.isStarted = false;
    this.usersList = [];
    this.sfuConfig = {
      producerId: "",
      rtpCapabilities: {}
    };
    this.reconnectionSubscription = this.webRTCService.reconnectionEvents$.subscribe((event) => {
      console.log("Reconnection event:", event);
      this.cdr.detectChanges();
    });
    this.userSubscription = this.socket.getPresentations().subscribe((res) => __async(this, null, function* () {
      const data = res?.data;
      console.log("presentation status", res);
      if (res.event == "USER-JOINED") {
      } else if (res.event == "USER-LEFT") {
        console.log("user", res);
        if (this.localStream && data.nUserid) {
          const ind = this.usersList.findIndex((a) => a == data.nUserid);
          if (ind > -1) {
            this.usersList.splice(ind, 1);
          }
        }
      }
    }));
    this.webRTCSubscription = this.socket.getWebRTCEvents().subscribe((res) => __async(this, null, function* () {
      console.log("webRTC host", res);
      const data = res.data;
      if (res.event == "ASK-TO-JOIN") {
        if (this.localStream && data.nUserid) {
          if (!this.usersList.includes(data.nUserid)) {
            this.usersList.push(String(data.nUserid));
          }
        }
      } else if (res.event == "CHECK-HAVE-SCREEN-SHARE") {
        if (this.isScreenSharing) {
          this.socket.emitWebRTCEvents({
            event: "EXISTS-SCREEN-SHARE",
            data: {
              from: this.nUserid,
              nPresentid: this.presentDetail.nPresentid,
              sfuConfig: this.sfuConfig
            },
            nToUserId: data.nUserid
          });
        }
      }
    }));
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.nUserid = yield this.store.getUserId();
      try {
        const data = yield this.presentService.getRunningScreenShare(this.presentDetail.nPresentid);
        if (data.msg == 1) {
          this.handleScreenShareStop();
          this.cdr.detectChanges();
        }
      } catch (error) {
        console.error("Error checking running screen share:", error);
      }
    });
  }
  ngOnDestroy() {
    try {
      if (this.isScreenSharing) {
        this.handleScreenShareStop();
      }
      if (this.userSubscription) {
        this.userSubscription.unsubscribe();
      }
      if (this.webRTCSubscription) {
        this.webRTCSubscription.unsubscribe();
      }
      if (this.reconnectionSubscription) {
        this.reconnectionSubscription.unsubscribe();
      }
      for (const userId in this.reconnectionTimers) {
        if (this.reconnectionTimers[userId]) {
          clearTimeout(this.reconnectionTimers[userId]);
        }
      }
    } catch (error) {
      console.error("Error in ngOnDestroy:", error);
    }
  }
  ngOnChanges(changes) {
    if (changes["isScreenSharing"] && !changes["isScreenSharing"].firstChange) {
      if (this.isScreenSharing) {
        this.startScreenShare();
      } else {
        this.handleScreenShareStop();
      }
    }
  }
  startScreenShare() {
    return __async(this, null, function* () {
      try {
        const { localStream } = yield this.webRTCService.startPresenter(this.presentDetail.nPresentid);
        this.localStream = localStream;
        this.isStarted = true;
        const videoTrack = this.localStream.getVideoTracks()[0];
        videoTrack.onended = () => {
          console.log("Screen sharing stopped by the user.");
          this.handleScreenShareStop();
        };
        this.startPeeringUsers();
        this.isScreenSharing = true;
        this.cdr.detectChanges();
      } catch (e) {
        this.handleScreenShareStop();
        console.error(e);
      }
    });
  }
  startPeeringUsers() {
    return __async(this, null, function* () {
      this.usersList = yield this.presentService.getOnlineUsers(this.presentDetail.nPresentid);
      if (!this.usersList?.length)
        return;
      this.usersList.forEach((e) => __async(this, null, function* () {
        this.socket.emitWebRTCEvents({
          event: "SCREEN-SHARE-START",
          data: {
            from: this.nUserid,
            nPresentid: this.presentDetail.nPresentid,
            sfuConfig: this.sfuConfig
          },
          nToUserId: e
        });
      }));
    });
  }
  /*createPeerConnection(nUserid: string: RTCPeerConnection | null {
      try {
        console.log(`Creating peer connection for user: ${nUserid}   totalPeerConnections: ${Object.keys(this.peerConnections).length}`);
        const peerConnection: RTCPeerConnection = this.webRTCService.createPeerConnection();
        this.peerConnections[nUserid] = peerConnection;
  
        // Initialize reconnection tracking
        this.reconnectionAttempts[nUserid] = 0;
  
        this.socket.emitWebRTCEvents({
          event: 'SCREEN-SHARE-START',
          data: {
            from: this.nUserid,
            nPresentid: this.presentDetail.nPresentid
          },
          nToUserId: nUserid
        });
  
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.warn('ICE candidate found:', event.candidate);
            // ICE candidate found, send it to the other peer
            this.socket.emitWebRTCEvents({
              event: 'ICE-CANDIDATE',
              data: {
                candidate: event.candidate,
                from: this.nUserid
              },
              nToUserId: nUserid
            });
          }
        };
  
        peerConnection.ontrack = (event) => {
          console.warn('Remote track received:', event);
        };
  
        peerConnection.onnegotiationneeded = async () => {
          console.warn('Negotiation needed for', nUserid);
          this.createOffer(nUserid, peerConnection);
        };
  
        peerConnection.onsignalingstatechange = () => {
          console.warn('Signaling state changed:', peerConnection.signalingState);
        };
  
        peerConnection.onconnectionstatechange = () => {
          console.warn(`Connection state for user ${nUserid}: ${peerConnection.connectionState}`);
  
          switch (peerConnection.connectionState) {
            case "connected":
              // Reset reconnection attempts when successfully connected
              this.reconnectionAttempts[nUserid] = 0;
              this.cleanupReconnectionResources(nUserid);
              break;
  
            case "disconnected":
              console.warn('Connection disconnected:', nUserid);
              // Try reconnection after a short delay (give time for potential auto-recovery)
              setTimeout(() => {
                console.warn('Attempting reconnection after delay:', nUserid);
                if (this.webRTCService.isPeerConnectionDisconnected(peerConnection)) {
                  this.attemptReconnection(nUserid);
                }
              }, 2000);
              break;
  
            case "failed":
              console.error('Connection failed:', nUserid);
              // Immediate reconnection attempt on failure
              this.attemptReconnection(nUserid);
              break;
  
            case "closed":
              console.log('Connection closed:', nUserid);
              this.cleanupReconnectionResources(nUserid);
              break;
          }
        };
  
        peerConnection.oniceconnectionstatechange = () => {
          console.warn(`ICE connection state for user ${nUserid}: ${peerConnection.iceConnectionState}`);
  
          if (peerConnection.iceConnectionState === 'failed' ||
            peerConnection.iceConnectionState === 'disconnected') {
            // Try reconnection if we're not already attempting it
            if (!this.reconnectionTimers[nUserid]) {
              this.attemptReconnection(nUserid);
            }
          }
        };
  
        return peerConnection;
      } catch (error) {
        this.error(error);
        return null;
      }
    }*/
  /**
   * Attempt to reconnect to a specific user by restarting ICE
   */
  /*async attemptReconnection(nUserid: string) {
      console.log(`Attempting reconnection for user ${nUserid}`);
      // Check if we have a peer connection for this user
      const peerConnection = this.peerConnections[nUserid];
      if (!peerConnection) return;
  
      // Initialize or increment reconnection counter
      if (!this.reconnectionAttempts[nUserid]) {
        this.reconnectionAttempts[nUserid] = 0;
      }
  
      this.reconnectionAttempts[nUserid]++;
      const currentAttempt = this.reconnectionAttempts[nUserid];
      const maxAttempts = this.webRTCService.getMaxReconnectionAttempts();
  
      console.warn(`Attempting reconnection ${currentAttempt}/${maxAttempts} for user ${nUserid}`);
  
      // Stop if we've hit the maximum attempts
      if (currentAttempt > maxAttempts) {
        console.error(`Max reconnection attempts reached for user ${nUserid}`);
        this.cleanupReconnectionResources(nUserid);
  
        // Notify the viewer that reconnection failed
        this.socket.emitWebRTCEvents({
          event: 'RECONNECTION-FAILED',
          data: {
            from: this.nUserid,
            nPresentid: this.presentDetail.nPresentid
          },
          nToUserId: nUserid
        });
  
        return;
      }
  
      try {
        // Use the service to create an ICE restart offer
        const offer = await this.webRTCService.attemptReconnection(peerConnection, nUserid, currentAttempt);
  
        if (offer) {
          // Send the reconnection offer to the viewer
          this.socket.emitWebRTCEvents({
            event: 'RECONNECTION-OFFER',
            data: {
              offer,
              from: this.nUserid,
              attempt: currentAttempt
            },
            nToUserId: nUserid
          });
  
          // Set up timeout for next attempt if needed
          this.cleanupReconnectionResources(nUserid);
  
          const delayMs = Math.min(1000 * Math.pow(2, currentAttempt - 1), 10000);
          console.log(`Setting reconnection timer for ${delayMs}ms`);
  
          this.reconnectionTimers[nUserid] = setTimeout(() => {
            console.log('TIMEOUT FOR RECONNECTION', nUserid);
            // Check if connection is still broken
            if (this.webRTCService.isPeerConnectionDisconnected(peerConnection)) {
              this.attemptReconnection(nUserid);
            } else {
              this.cleanupReconnectionResources(nUserid);
            }
          }, delayMs);
        }
      } catch (error) {
        console.error(`Error during reconnection attempt for ${nUserid}:`, error);
  
        // Set up timeout for next attempt
        this.cleanupReconnectionResources(nUserid);
  
        const delayMs = Math.min(1000 * Math.pow(2, currentAttempt - 1), 10000);
        this.reconnectionTimers[nUserid] = setTimeout(() => {
          console.log('TIMEOUT FOR RECONNECTION', nUserid);
          // Check if connection is still broken
          if (currentAttempt < maxAttempts) {
            this.attemptReconnection(nUserid);
          }
        }, delayMs);
      }
    }*/
  /**
   * Clean up reconnection timers and other resources
   */
  /* private cleanupReconnectionResources(nUserid: string) {
     if (this.reconnectionTimers[nUserid]) {
       clearTimeout(this.reconnectionTimers[nUserid]);
       delete this.reconnectionTimers[nUserid];
     }
   }*/
  /**
   * Handle reconnection requests from viewers
   */
  /* async handleReconnectionRequest(data: any) {
      const nUserid = data.nUserid;
      console.log(`Reconnection requested by user ${nUserid}`);
      if (!nUserid || !this.isScreenSharing) return;
  
  
      // Check if we have a peer connection for this user
      const peerConnection = this.peerConnections[nUserid];
      if (peerConnection && this.localStream) {
        this.attemptReconnection(nUserid);
      } else if (this.localStream) {
        // If we don't have a connection but should, create one
        console.log(`Creating new peer connection for user ${nUserid} after reconnection request`);
        if (!this.usersList.includes(nUserid)) {
          this.usersList.push(nUserid);
        }
        await this.createPeerConnection(nUserid);
        this.webRTCService.addLocalStreamToPeerConnection(this.peerConnections[nUserid], this.localStream);
      }
    }*/
  /*async createOffer(nUserid: string, peerConnection: RTCPeerConnection) {
      try {
        const offer = await this.webRTCService.createOffer(peerConnection);
        if (offer) {
          this.socket.emitWebRTCEvents({
            event: 'OFFER',
            data: {
              offer,
              from: this.nUserid
            },
            nToUserId: nUserid
          });
        }
        return offer;
      } catch (error) {
        this.handleScreenShareStop();
        this.error(error);
        return null;
      }
    }
  
    async handleAnswer(data: { answer: RTCSessionDescriptionInit, from: number, attempt?: number }) {
      const peerConnection = this.peerConnections[data.from];
      if (peerConnection) {
        await this.webRTCService.setRemoteDescription(peerConnection, data.answer);
        console.log(`Set remote description for ${data.from}${data.attempt ? ` (reconnection attempt ${data.attempt})` : ''}`);
      } else {
        console.error(`No peer connection found for ${data.from}`);
      }
    }*/
  error(error) {
    console.error(error);
    this.onExists();
  }
  onExists() {
    this.isStarted = false;
    this.cdr.detectChanges();
  }
  handleScreenShareStop() {
    console.log("Screen sharing stopped");
    try {
      this.webRTCService.stopScreenShare();
      this.isScreenSharing = false;
      this.cdr.detectChanges();
    } catch (error) {
    }
    this.isStarted = false;
    try {
      this.localStream?.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    } catch (error) {
      console.error("Error stopping local stream:", error);
    }
    try {
      if (this.usersList?.length) {
        for (let x of this.usersList) {
          this.socket.emitWebRTCEvents({
            event: "SCREEN-SHARE-STOP",
            data: {
              from: this.nUserid,
              nPresentid: this.presentDetail.nPresentid
            },
            nToUserId: x
          });
        }
      }
    } catch (error) {
      console.error("Error notifying users about screen share stop:", error);
    }
    this.isScreenSharing = false;
    this.isScreenSharingChange.emit(this.isScreenSharing);
    this.cdr.detectChanges();
  }
  static {
    this.\u0275fac = function ScreenShareComponent_Factory(t) {
      return new (t || _ScreenShareComponent)(\u0275\u0275directiveInject(WebRTCService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(PresentService), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(SecureStorageService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ScreenShareComponent, selectors: [["screen-share"]], hostBindings: function ScreenShareComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("beforeunload", function ScreenShareComponent_beforeunload_HostBindingHandler($event) {
          return ctx.handleBeforeUnload($event);
        }, false, \u0275\u0275resolveWindow);
      }
    }, inputs: { presentDetail: "presentDetail", isScreenSharing: "isScreenSharing" }, outputs: { isScreenSharingChange: "isScreenSharingChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 0, vars: 0, template: function ScreenShareComponent_Template(rf, ctx) {
    } });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ScreenShareComponent, { className: "ScreenShareComponent", filePath: "src\\app\\presentation\\components\\screenshare\\screen-share\\screen-share.component.ts", lineNumber: 18 });
})();
export {
  ScreenShareComponent
};
//# sourceMappingURL=chunk-N7NVS5YX.js.map
