import {
  NG_SCROLLBAR
} from "./chunk-WZNPCXMG.js";
import {
  isPlatformBrowser
} from "./chunk-YBHDQMOW.js";
import {
  Directive,
  EventEmitter,
  Injector,
  Input,
  InputFlags,
  NgZone,
  Output,
  PLATFORM_ID,
  Renderer2,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
  runInInjectionContext,
  setClassMetadata,
  ɵɵInheritDefinitionFeature,
  ɵɵInputTransformsFeature,
  ɵɵdefineDirective,
  ɵɵgetInheritedFactory
} from "./chunk-OLJKHPOW.js";

// node_modules/ngx-scrollbar/fesm2022/ngx-scrollbar-reached-event.mjs
var ReachedDroppedBase = class _ReachedDroppedBase {
  constructor() {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    this.zone = inject(NgZone);
    this.renderer = inject(Renderer2);
    this.injector = inject(Injector);
    this.scrollbar = inject(NG_SCROLLBAR);
    this.triggerElements = [];
    this.subscribedEvents = [];
    this.eventActions = {
      top: {
        emit: () => this.scrollbar.isVerticallyScrollable() ? this.top.emit() : null
      },
      bottom: {
        emit: () => this.scrollbar.isVerticallyScrollable() ? this.bottom.emit() : null
      },
      start: {
        emit: () => this.scrollbar.isHorizontallyScrollable() ? this.start.emit() : null
      },
      end: {
        emit: () => this.scrollbar.isHorizontallyScrollable() ? this.end.emit() : null
      }
    };
  }
  onAction(trigger) {
    if (trigger) {
      this.eventActions[trigger]?.emit();
    }
  }
  setCssVariable(property, value) {
    if (value) {
      this.scrollbar.nativeElement.style.setProperty(property, `${value}px`);
    }
  }
  activate() {
    this.zone.runOutsideAngular(() => {
      this.triggerElementsWrapper = this.renderer.createElement("div");
      this.renderer.addClass(this.triggerElementsWrapper, this.triggerElementsWrapperClass);
      this.renderer.appendChild(this.scrollbar.viewport.contentWrapperElement, this.triggerElementsWrapper);
      this.subscribedEvents.forEach((event) => {
        const triggerElement = this.renderer.createElement("div");
        this.renderer.addClass(triggerElement, this.triggerElementClass);
        this.renderer.setAttribute(triggerElement, "trigger", event);
        this.renderer.appendChild(this.triggerElementsWrapper, triggerElement);
        this.triggerElements.push(triggerElement);
      });
      let intersectionObserverInit = false;
      this.intersectionObserver = new IntersectionObserver((entries) => {
        if (intersectionObserverInit) {
          entries.forEach((entry) => {
            if (this.isTriggered(entry)) {
              this.zone.run(() => this.onAction(entry.target.getAttribute("trigger")));
            }
          });
        } else {
          intersectionObserverInit = true;
        }
      }, {
        root: this.scrollbar.viewport.nativeElement
      });
      this.triggerElements.forEach((el) => this.intersectionObserver.observe(el));
    });
  }
  deactivate() {
    this.intersectionObserver?.disconnect();
    this.triggerElementsWrapper?.remove();
    this.triggerElements = [];
  }
  ngOnInit() {
    if (this.top.observed) {
      this.subscribedEvents.push("top");
    }
    if (this.bottom.observed) {
      this.subscribedEvents.push("bottom");
    }
    if (this.start.observed) {
      this.subscribedEvents.push("start");
    }
    if (this.end.observed) {
      this.subscribedEvents.push("end");
    }
    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (this.disabled()) {
          this.deactivate();
        } else {
          if (this.isBrowser) {
            this.activate();
          }
        }
      });
    });
  }
  ngOnDestroy() {
    this.deactivate();
  }
  static {
    this.\u0275fac = function ReachedDroppedBase_Factory(t) {
      return new (t || _ReachedDroppedBase)();
    };
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
      type: _ReachedDroppedBase
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ReachedDroppedBase, [{
    type: Directive
  }], null, null);
})();
var NgScrollReached = class _NgScrollReached extends ReachedDroppedBase {
  constructor() {
    super(...arguments);
    this.disabled = input(false, {
      alias: "disableReached",
      transform: booleanAttribute
    });
    this.top = new EventEmitter();
    this.bottom = new EventEmitter();
    this.start = new EventEmitter();
    this.end = new EventEmitter();
    this.triggerElementsWrapperClass = "ng-scroll-reached-wrapper";
    this.triggerElementClass = "scroll-reached-trigger-element";
  }
  /** Reached offset value in px */
  set offsetSetter(value) {
    this.setCssVariable("--reached-offset", value);
  }
  set offsetTopSetter(value) {
    this.setCssVariable("--reached-offset-top", value);
  }
  set offsetBottomSetter(value) {
    this.setCssVariable("--reached-offset-bottom", value);
  }
  set offsetStartSetter(value) {
    this.setCssVariable("--reached-offset-start", value);
  }
  set offsetEndSetter(value) {
    this.setCssVariable("--reached-offset-end", value);
  }
  isTriggered(entry) {
    return entry.isIntersecting;
  }
  static {
    this.\u0275fac = /* @__PURE__ */ (() => {
      let \u0275NgScrollReached_BaseFactory;
      return function NgScrollReached_Factory(t) {
        return (\u0275NgScrollReached_BaseFactory || (\u0275NgScrollReached_BaseFactory = \u0275\u0275getInheritedFactory(_NgScrollReached)))(t || _NgScrollReached);
      };
    })();
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
      type: _NgScrollReached,
      selectors: [["ng-scrollbar", "reachedTop", ""], ["ng-scrollbar", "reachedBottom", ""], ["ng-scrollbar", "reachedStart", ""], ["ng-scrollbar", "reachedEnd", ""]],
      inputs: {
        offsetSetter: [InputFlags.HasDecoratorInputTransform, "reachedOffset", "offsetSetter", numberAttribute],
        offsetTopSetter: [InputFlags.HasDecoratorInputTransform, "reachedTopOffset", "offsetTopSetter", numberAttribute],
        offsetBottomSetter: [InputFlags.HasDecoratorInputTransform, "reachedBottomOffset", "offsetBottomSetter", numberAttribute],
        offsetStartSetter: [InputFlags.HasDecoratorInputTransform, "reachedStartOffset", "offsetStartSetter", numberAttribute],
        offsetEndSetter: [InputFlags.HasDecoratorInputTransform, "reachedEndOffset", "offsetEndSetter", numberAttribute],
        disabled: [InputFlags.SignalBased, "disableReached", "disabled"]
      },
      outputs: {
        top: "reachedTop",
        bottom: "reachedBottom",
        start: "reachedStart",
        end: "reachedEnd"
      },
      standalone: true,
      features: [\u0275\u0275InputTransformsFeature, \u0275\u0275InheritDefinitionFeature]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgScrollReached, [{
    type: Directive,
    args: [{
      selector: "ng-scrollbar[reachedTop], ng-scrollbar[reachedBottom], ng-scrollbar[reachedStart], ng-scrollbar[reachedEnd]",
      standalone: true
    }]
  }], null, {
    offsetSetter: [{
      type: Input,
      args: [{
        alias: "reachedOffset",
        transform: numberAttribute
      }]
    }],
    offsetTopSetter: [{
      type: Input,
      args: [{
        alias: "reachedTopOffset",
        transform: numberAttribute
      }]
    }],
    offsetBottomSetter: [{
      type: Input,
      args: [{
        alias: "reachedBottomOffset",
        transform: numberAttribute
      }]
    }],
    offsetStartSetter: [{
      type: Input,
      args: [{
        alias: "reachedStartOffset",
        transform: numberAttribute
      }]
    }],
    offsetEndSetter: [{
      type: Input,
      args: [{
        alias: "reachedEndOffset",
        transform: numberAttribute
      }]
    }],
    top: [{
      type: Output,
      args: ["reachedTop"]
    }],
    bottom: [{
      type: Output,
      args: ["reachedBottom"]
    }],
    start: [{
      type: Output,
      args: ["reachedStart"]
    }],
    end: [{
      type: Output,
      args: ["reachedEnd"]
    }]
  });
})();
var NgScrollDropped = class _NgScrollDropped extends ReachedDroppedBase {
  constructor() {
    super(...arguments);
    this.disabled = input(false, {
      alias: "disableDropped",
      transform: booleanAttribute
    });
    this.top = new EventEmitter();
    this.bottom = new EventEmitter();
    this.start = new EventEmitter();
    this.end = new EventEmitter();
    this.triggerElementsWrapperClass = "ng-scroll-dropped-wrapper";
    this.triggerElementClass = "scroll-dropped-trigger-element";
  }
  /** Dropped offset value in px */
  set offsetSetter(value) {
    this.setCssVariable("--dropped-offset", value);
  }
  set offsetTopSetter(value) {
    this.setCssVariable("--dropped-offset-top", value);
  }
  set offsetBottomSetter(value) {
    this.setCssVariable("--dropped-offset-bottom", value);
  }
  set offsetStartSetter(value) {
    this.setCssVariable("--dropped-offset-start", value);
  }
  set offsetEndSetter(value) {
    this.setCssVariable("--dropped-offset-end", value);
  }
  isTriggered(entry) {
    return !entry.isIntersecting;
  }
  static {
    this.\u0275fac = /* @__PURE__ */ (() => {
      let \u0275NgScrollDropped_BaseFactory;
      return function NgScrollDropped_Factory(t) {
        return (\u0275NgScrollDropped_BaseFactory || (\u0275NgScrollDropped_BaseFactory = \u0275\u0275getInheritedFactory(_NgScrollDropped)))(t || _NgScrollDropped);
      };
    })();
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
      type: _NgScrollDropped,
      selectors: [["ng-scrollbar", "droppedTop", ""], ["ng-scrollbar", "droppedBottom", ""], ["ng-scrollbar", "droppedStart", ""], ["ng-scrollbar", "droppedEnd", ""]],
      inputs: {
        offsetSetter: [InputFlags.HasDecoratorInputTransform, "droppedOffset", "offsetSetter", numberAttribute],
        offsetTopSetter: [InputFlags.HasDecoratorInputTransform, "droppedTopOffset", "offsetTopSetter", numberAttribute],
        offsetBottomSetter: [InputFlags.HasDecoratorInputTransform, "droppedBottomOffset", "offsetBottomSetter", numberAttribute],
        offsetStartSetter: [InputFlags.HasDecoratorInputTransform, "droppedStartOffset", "offsetStartSetter", numberAttribute],
        offsetEndSetter: [InputFlags.HasDecoratorInputTransform, "droppedEndOffset", "offsetEndSetter", numberAttribute],
        disabled: [InputFlags.SignalBased, "disableDropped", "disabled"]
      },
      outputs: {
        top: "droppedTop",
        bottom: "droppedBottom",
        start: "droppedStart",
        end: "droppedEnd"
      },
      standalone: true,
      features: [\u0275\u0275InputTransformsFeature, \u0275\u0275InheritDefinitionFeature]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgScrollDropped, [{
    type: Directive,
    args: [{
      selector: "ng-scrollbar[droppedTop], ng-scrollbar[droppedBottom], ng-scrollbar[droppedStart], ng-scrollbar[droppedEnd]",
      standalone: true
    }]
  }], null, {
    offsetSetter: [{
      type: Input,
      args: [{
        alias: "droppedOffset",
        transform: numberAttribute
      }]
    }],
    offsetTopSetter: [{
      type: Input,
      args: [{
        alias: "droppedTopOffset",
        transform: numberAttribute
      }]
    }],
    offsetBottomSetter: [{
      type: Input,
      args: [{
        alias: "droppedBottomOffset",
        transform: numberAttribute
      }]
    }],
    offsetStartSetter: [{
      type: Input,
      args: [{
        alias: "droppedStartOffset",
        transform: numberAttribute
      }]
    }],
    offsetEndSetter: [{
      type: Input,
      args: [{
        alias: "droppedEndOffset",
        transform: numberAttribute
      }]
    }],
    top: [{
      type: Output,
      args: ["droppedTop"]
    }],
    bottom: [{
      type: Output,
      args: ["droppedBottom"]
    }],
    start: [{
      type: Output,
      args: ["droppedStart"]
    }],
    end: [{
      type: Output,
      args: ["droppedEnd"]
    }]
  });
})();

export {
  NgScrollReached
};
//# sourceMappingURL=chunk-WCB6QNSW.js.map
