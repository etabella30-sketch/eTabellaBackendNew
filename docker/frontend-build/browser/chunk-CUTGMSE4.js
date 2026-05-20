import {
  BundlemanageService
} from "./chunk-TR5DVTEU.js";
import {
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import {
  TruncateTooltipDirective
} from "./chunk-QRO7O7ZW.js";
import {
  DragDropModule
} from "./chunk-EZOJOG5D.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import {
  MyfileService
} from "./chunk-M4TJ3SSY.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  TranslateModule,
  TranslatePipe
} from "./chunk-DWVFAK3Q.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import {
  MYFILES_CS_EVENTS,
  MYFILES_CS_TYPES
} from "./chunk-6RMJH3FI.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ScrollingModule
} from "./chunk-MESCMVD2.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  NgModule,
  NgZone,
  Output,
  Renderer2,
  __async,
  forwardRef,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction5,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate3,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// node_modules/ngx-drag-drop/fesm2022/ngx-drag-drop.mjs
var DROP_EFFECTS = ["move", "copy", "link"];
var CUSTOM_MIME_TYPE = "application/x-dnd";
var JSON_MIME_TYPE = "application/json";
var MSIE_MIME_TYPE = "Text";
function mimeTypeIsCustom(mimeType) {
  return mimeType.substr(0, CUSTOM_MIME_TYPE.length) === CUSTOM_MIME_TYPE;
}
function getWellKnownMimeType(event) {
  if (event.dataTransfer) {
    const types = event.dataTransfer.types;
    if (!types) {
      return MSIE_MIME_TYPE;
    }
    for (let i = 0; i < types.length; i++) {
      if (types[i] === MSIE_MIME_TYPE || types[i] === JSON_MIME_TYPE || mimeTypeIsCustom(types[i])) {
        return types[i];
      }
    }
  }
  return null;
}
function setDragData(event, data, effectAllowed) {
  const mimeType = CUSTOM_MIME_TYPE + (data.type ? "-" + data.type : "");
  const dataString = JSON.stringify(data);
  try {
    event.dataTransfer?.setData(mimeType, dataString);
  } catch (e) {
    try {
      event.dataTransfer?.setData(JSON_MIME_TYPE, dataString);
    } catch (e2) {
      const effectsAllowed = filterEffects(DROP_EFFECTS, effectAllowed);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = effectsAllowed[0];
      }
      event.dataTransfer?.setData(MSIE_MIME_TYPE, dataString);
    }
  }
}
function getDropData(event, dragIsExternal) {
  const mimeType = getWellKnownMimeType(event);
  if (dragIsExternal === true) {
    if (mimeType !== null && mimeTypeIsCustom(mimeType)) {
      return JSON.parse(event.dataTransfer?.getData(mimeType) ?? "{}");
    }
    return {};
  }
  if (mimeType !== null) {
    return JSON.parse(event.dataTransfer?.getData(mimeType) ?? "{}");
  }
  return {};
}
function filterEffects(effects, allowed) {
  if (allowed === "all" || allowed === "uninitialized") {
    return effects;
  }
  return effects.filter(function(effect) {
    return allowed.toLowerCase().indexOf(effect) !== -1;
  });
}
function getDirectChildElement(parentElement, childElement) {
  let directChild = childElement;
  while (directChild.parentNode !== parentElement) {
    if (!directChild.parentNode) {
      return null;
    }
    directChild = directChild.parentNode;
  }
  return directChild;
}
function shouldPositionPlaceholderBeforeElement(event, element, horizontal) {
  const bounds = element.getBoundingClientRect();
  if (horizontal) {
    return event.clientX < bounds.left + bounds.width / 2;
  }
  return event.clientY < bounds.top + bounds.height / 2;
}
function calculateDragImageOffset(event, dragImage) {
  const dragImageComputedStyle = window.getComputedStyle(dragImage);
  const paddingTop = parseFloat(dragImageComputedStyle.paddingTop) || 0;
  const paddingLeft = parseFloat(dragImageComputedStyle.paddingLeft) || 0;
  const borderTop = parseFloat(dragImageComputedStyle.borderTopWidth) || 0;
  const borderLeft = parseFloat(dragImageComputedStyle.borderLeftWidth) || 0;
  return {
    x: event.offsetX + paddingLeft + borderLeft,
    y: event.offsetY + paddingTop + borderTop
  };
}
function setDragImage(event, dragImage, offsetFunction) {
  const offset = offsetFunction(event, dragImage) || {
    x: 0,
    y: 0
  };
  event.dataTransfer.setDragImage(dragImage, offset.x, offset.y);
}
var _dndState = {
  isDragging: false,
  dropEffect: "none",
  effectAllowed: "all",
  type: void 0
};
function startDrag(event, effectAllowed, type) {
  _dndState.isDragging = true;
  _dndState.dropEffect = "none";
  _dndState.effectAllowed = effectAllowed;
  _dndState.type = type;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = effectAllowed;
  }
}
function endDrag() {
  _dndState.isDragging = false;
  _dndState.dropEffect = void 0;
  _dndState.effectAllowed = void 0;
  _dndState.type = void 0;
}
function setDropEffect(event, dropEffect) {
  if (_dndState.isDragging === true) {
    _dndState.dropEffect = dropEffect;
  }
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = dropEffect;
  }
}
function getDropEffect(event, effectAllowed) {
  const dataTransferEffectAllowed = event.dataTransfer ? event.dataTransfer.effectAllowed : "uninitialized";
  let effects = filterEffects(DROP_EFFECTS, dataTransferEffectAllowed);
  if (_dndState.isDragging === true) {
    effects = filterEffects(effects, _dndState.effectAllowed);
  }
  if (effectAllowed) {
    effects = filterEffects(effects, effectAllowed);
  }
  if (effects.length === 0) {
    return "none";
  }
  if (event.ctrlKey && effects.indexOf("copy") !== -1) {
    return "copy";
  }
  if (event.altKey && effects.indexOf("link") !== -1) {
    return "link";
  }
  return effects[0];
}
function getDndType(event) {
  if (_dndState.isDragging === true) {
    return _dndState.type;
  }
  const mimeType = getWellKnownMimeType(event);
  if (mimeType === null) {
    return void 0;
  }
  if (mimeType === MSIE_MIME_TYPE || mimeType === JSON_MIME_TYPE) {
    return void 0;
  }
  return mimeType.substr(CUSTOM_MIME_TYPE.length + 1) || void 0;
}
function isExternalDrag() {
  return _dndState.isDragging === false;
}
var dndState = _dndState;
var DndDragImageRefDirective = class _DndDragImageRefDirective {
  dndDraggableDirective = inject(forwardRef(() => DndDraggableDirective));
  elementRef = inject(ElementRef);
  ngOnInit() {
    this.dndDraggableDirective.registerDragImage(this.elementRef);
  }
  static \u0275fac = function DndDragImageRefDirective_Factory(t) {
    return new (t || _DndDragImageRefDirective)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _DndDragImageRefDirective,
    selectors: [["", "dndDragImageRef", ""]],
    standalone: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DndDragImageRefDirective, [{
    type: Directive,
    args: [{
      selector: "[dndDragImageRef]",
      standalone: true
    }]
  }], null, null);
})();
var DndDraggableDirective = class _DndDraggableDirective {
  dndDraggable;
  dndEffectAllowed = "copy";
  dndType;
  dndDraggingClass = "dndDragging";
  dndDraggingSourceClass = "dndDraggingSource";
  dndDraggableDisabledClass = "dndDraggableDisabled";
  dndDragImageOffsetFunction = calculateDragImageOffset;
  dndStart = new EventEmitter();
  dndDrag = new EventEmitter();
  dndEnd = new EventEmitter();
  dndMoved = new EventEmitter();
  dndCopied = new EventEmitter();
  dndLinked = new EventEmitter();
  dndCanceled = new EventEmitter();
  draggable = true;
  dndHandle;
  dndDragImageElementRef;
  dragImage;
  isDragStarted = false;
  elementRef = inject(ElementRef);
  renderer = inject(Renderer2);
  ngZone = inject(NgZone);
  set dndDisableIf(value) {
    this.draggable = !value;
    if (this.draggable) {
      this.renderer.removeClass(this.elementRef.nativeElement, this.dndDraggableDisabledClass);
    } else {
      this.renderer.addClass(this.elementRef.nativeElement, this.dndDraggableDisabledClass);
    }
  }
  set dndDisableDragIf(value) {
    this.dndDisableIf = value;
  }
  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.addEventListener("drag", this.dragEventHandler);
    });
  }
  ngOnDestroy() {
    this.elementRef.nativeElement.removeEventListener("drag", this.dragEventHandler);
    if (this.isDragStarted) {
      endDrag();
    }
  }
  onDragStart(event) {
    if (!this.draggable) {
      return false;
    }
    if (this.dndHandle != null && event._dndUsingHandle == null) {
      event.stopPropagation();
      return false;
    }
    startDrag(event, this.dndEffectAllowed, this.dndType);
    this.isDragStarted = true;
    setDragData(event, {
      data: this.dndDraggable,
      type: this.dndType
    }, dndState.effectAllowed);
    this.dragImage = this.determineDragImage();
    this.renderer.addClass(this.dragImage, this.dndDraggingClass);
    if (this.dndDragImageElementRef != null || event._dndUsingHandle != null) {
      setDragImage(event, this.dragImage, this.dndDragImageOffsetFunction);
    }
    const unregister = this.renderer.listen(this.elementRef.nativeElement, "drag", () => {
      this.renderer.addClass(this.elementRef.nativeElement, this.dndDraggingSourceClass);
      unregister();
    });
    this.dndStart.emit(event);
    event.stopPropagation();
    setTimeout(() => {
      if (this.isDragStarted) {
        this.renderer.setStyle(this.dragImage, "pointer-events", "none");
      }
    }, 100);
    return true;
  }
  onDrag(event) {
    this.dndDrag.emit(event);
  }
  onDragEnd(event) {
    if (!this.draggable || !this.isDragStarted) {
      return;
    }
    const dropEffect = dndState.dropEffect;
    this.renderer.setStyle(this.dragImage, "pointer-events", "unset");
    let dropEffectEmitter;
    switch (dropEffect) {
      case "copy":
        dropEffectEmitter = this.dndCopied;
        break;
      case "link":
        dropEffectEmitter = this.dndLinked;
        break;
      case "move":
        dropEffectEmitter = this.dndMoved;
        break;
      default:
        dropEffectEmitter = this.dndCanceled;
        break;
    }
    dropEffectEmitter.emit(event);
    this.dndEnd.emit(event);
    endDrag();
    this.isDragStarted = false;
    this.renderer.removeClass(this.dragImage, this.dndDraggingClass);
    window.setTimeout(() => {
      this.renderer.removeClass(this.elementRef.nativeElement, this.dndDraggingSourceClass);
    }, 0);
    event.stopPropagation();
  }
  registerDragHandle(handle) {
    this.dndHandle = handle;
  }
  registerDragImage(elementRef) {
    this.dndDragImageElementRef = elementRef;
  }
  dragEventHandler = (event) => this.onDrag(event);
  determineDragImage() {
    if (typeof this.dndDragImageElementRef !== "undefined") {
      return this.dndDragImageElementRef.nativeElement;
    } else {
      return this.elementRef.nativeElement;
    }
  }
  static \u0275fac = function DndDraggableDirective_Factory(t) {
    return new (t || _DndDraggableDirective)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _DndDraggableDirective,
    selectors: [["", "dndDraggable", ""]],
    hostVars: 1,
    hostBindings: function DndDraggableDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("dragstart", function DndDraggableDirective_dragstart_HostBindingHandler($event) {
          return ctx.onDragStart($event);
        })("dragend", function DndDraggableDirective_dragend_HostBindingHandler($event) {
          return ctx.onDragEnd($event);
        });
      }
      if (rf & 2) {
        \u0275\u0275attribute("draggable", ctx.draggable);
      }
    },
    inputs: {
      dndDraggable: "dndDraggable",
      dndEffectAllowed: "dndEffectAllowed",
      dndType: "dndType",
      dndDraggingClass: "dndDraggingClass",
      dndDraggingSourceClass: "dndDraggingSourceClass",
      dndDraggableDisabledClass: "dndDraggableDisabledClass",
      dndDragImageOffsetFunction: "dndDragImageOffsetFunction",
      dndDisableIf: "dndDisableIf",
      dndDisableDragIf: "dndDisableDragIf"
    },
    outputs: {
      dndStart: "dndStart",
      dndDrag: "dndDrag",
      dndEnd: "dndEnd",
      dndMoved: "dndMoved",
      dndCopied: "dndCopied",
      dndLinked: "dndLinked",
      dndCanceled: "dndCanceled"
    },
    standalone: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DndDraggableDirective, [{
    type: Directive,
    args: [{
      selector: "[dndDraggable]",
      standalone: true
    }]
  }], null, {
    dndDraggable: [{
      type: Input
    }],
    dndEffectAllowed: [{
      type: Input
    }],
    dndType: [{
      type: Input
    }],
    dndDraggingClass: [{
      type: Input
    }],
    dndDraggingSourceClass: [{
      type: Input
    }],
    dndDraggableDisabledClass: [{
      type: Input
    }],
    dndDragImageOffsetFunction: [{
      type: Input
    }],
    dndStart: [{
      type: Output
    }],
    dndDrag: [{
      type: Output
    }],
    dndEnd: [{
      type: Output
    }],
    dndMoved: [{
      type: Output
    }],
    dndCopied: [{
      type: Output
    }],
    dndLinked: [{
      type: Output
    }],
    dndCanceled: [{
      type: Output
    }],
    draggable: [{
      type: HostBinding,
      args: ["attr.draggable"]
    }],
    dndDisableIf: [{
      type: Input
    }],
    dndDisableDragIf: [{
      type: Input
    }],
    onDragStart: [{
      type: HostListener,
      args: ["dragstart", ["$event"]]
    }],
    onDragEnd: [{
      type: HostListener,
      args: ["dragend", ["$event"]]
    }]
  });
})();
var DndPlaceholderRefDirective = class _DndPlaceholderRefDirective {
  elementRef;
  constructor(elementRef) {
    this.elementRef = elementRef;
  }
  ngOnInit() {
    this.elementRef.nativeElement.style.pointerEvents = "none";
  }
  static \u0275fac = function DndPlaceholderRefDirective_Factory(t) {
    return new (t || _DndPlaceholderRefDirective)(\u0275\u0275directiveInject(ElementRef));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _DndPlaceholderRefDirective,
    selectors: [["", "dndPlaceholderRef", ""]],
    standalone: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DndPlaceholderRefDirective, [{
    type: Directive,
    args: [{
      selector: "[dndPlaceholderRef]",
      standalone: true
    }]
  }], () => [{
    type: ElementRef
  }], null);
})();
var DndDropzoneDirective = class _DndDropzoneDirective {
  ngZone;
  elementRef;
  renderer;
  dndDropzone = "";
  dndEffectAllowed = "uninitialized";
  dndAllowExternal = false;
  dndHorizontal = false;
  dndDragoverClass = "dndDragover";
  dndDropzoneDisabledClass = "dndDropzoneDisabled";
  dndDragover = new EventEmitter();
  dndDrop = new EventEmitter();
  dndPlaceholderRef;
  placeholder = null;
  disabled = false;
  constructor(ngZone, elementRef, renderer) {
    this.ngZone = ngZone;
    this.elementRef = elementRef;
    this.renderer = renderer;
  }
  set dndDisableIf(value) {
    this.disabled = value;
    if (this.disabled) {
      this.renderer.addClass(this.elementRef.nativeElement, this.dndDropzoneDisabledClass);
    } else {
      this.renderer.removeClass(this.elementRef.nativeElement, this.dndDropzoneDisabledClass);
    }
  }
  set dndDisableDropIf(value) {
    this.dndDisableIf = value;
  }
  ngAfterViewInit() {
    this.placeholder = this.tryGetPlaceholder();
    this.removePlaceholderFromDOM();
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.addEventListener("dragenter", this.dragEnterEventHandler);
      this.elementRef.nativeElement.addEventListener("dragover", this.dragOverEventHandler);
      this.elementRef.nativeElement.addEventListener("dragleave", this.dragLeaveEventHandler);
    });
  }
  ngOnDestroy() {
    this.elementRef.nativeElement.removeEventListener("dragenter", this.dragEnterEventHandler);
    this.elementRef.nativeElement.removeEventListener("dragover", this.dragOverEventHandler);
    this.elementRef.nativeElement.removeEventListener("dragleave", this.dragLeaveEventHandler);
  }
  onDragEnter(event) {
    if (event._dndDropzoneActive === true) {
      this.cleanupDragoverState();
      return;
    }
    if (event._dndDropzoneActive == null) {
      const newTarget = document.elementFromPoint(event.clientX, event.clientY);
      if (this.elementRef.nativeElement.contains(newTarget)) {
        event._dndDropzoneActive = true;
      }
    }
    const type = getDndType(event);
    if (!this.isDropAllowed(type)) {
      return;
    }
    event.preventDefault();
  }
  onDragOver(event) {
    if (event.defaultPrevented) {
      return;
    }
    const type = getDndType(event);
    if (!this.isDropAllowed(type)) {
      return;
    }
    this.checkAndUpdatePlaceholderPosition(event);
    const dropEffect = getDropEffect(event, this.dndEffectAllowed);
    if (dropEffect === "none") {
      this.cleanupDragoverState();
      return;
    }
    event.preventDefault();
    setDropEffect(event, dropEffect);
    this.dndDragover.emit(event);
    this.renderer.addClass(this.elementRef.nativeElement, this.dndDragoverClass);
  }
  onDrop(event) {
    try {
      const type = getDndType(event);
      if (!this.isDropAllowed(type)) {
        return;
      }
      const data = getDropData(event, isExternalDrag());
      if (!this.isDropAllowed(data.type)) {
        return;
      }
      event.preventDefault();
      const dropEffect = getDropEffect(event);
      setDropEffect(event, dropEffect);
      if (dropEffect === "none") {
        return;
      }
      const dropIndex = this.getPlaceholderIndex();
      if (dropIndex === -1) {
        return;
      }
      this.dndDrop.emit({
        event,
        dropEffect,
        isExternal: isExternalDrag(),
        data: data.data,
        index: dropIndex,
        type
      });
      event.stopPropagation();
    } finally {
      this.cleanupDragoverState();
    }
  }
  onDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event._dndDropzoneActive == null) {
      if (this.elementRef.nativeElement.contains(event.relatedTarget)) {
        event._dndDropzoneActive = true;
        return;
      }
    }
    this.cleanupDragoverState();
    setDropEffect(event, "none");
  }
  dragEnterEventHandler = (event) => this.onDragEnter(event);
  dragOverEventHandler = (event) => this.onDragOver(event);
  dragLeaveEventHandler = (event) => this.onDragLeave(event);
  isDropAllowed(type) {
    if (this.disabled) {
      return false;
    }
    if (isExternalDrag() && !this.dndAllowExternal) {
      return false;
    }
    if (!this.dndDropzone) {
      return true;
    }
    if (!type) {
      return true;
    }
    if (!Array.isArray(this.dndDropzone)) {
      throw new Error("dndDropzone: bound value to [dndDropzone] must be an array!");
    }
    return this.dndDropzone.indexOf(type) !== -1;
  }
  tryGetPlaceholder() {
    if (typeof this.dndPlaceholderRef !== "undefined") {
      return this.dndPlaceholderRef.elementRef.nativeElement;
    }
    return this.elementRef.nativeElement.querySelector("[dndPlaceholderRef]");
  }
  removePlaceholderFromDOM() {
    if (this.placeholder !== null && this.placeholder.parentNode !== null) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }
  }
  checkAndUpdatePlaceholderPosition(event) {
    if (this.placeholder === null) {
      return;
    }
    if (this.placeholder.parentNode !== this.elementRef.nativeElement) {
      this.renderer.appendChild(this.elementRef.nativeElement, this.placeholder);
    }
    const directChild = getDirectChildElement(this.elementRef.nativeElement, event.target);
    if (directChild === null || directChild === this.placeholder) {
      return;
    }
    const positionPlaceholderBeforeDirectChild = shouldPositionPlaceholderBeforeElement(event, directChild, this.dndHorizontal);
    if (positionPlaceholderBeforeDirectChild) {
      if (directChild.previousSibling !== this.placeholder) {
        this.renderer.insertBefore(this.elementRef.nativeElement, this.placeholder, directChild);
      }
    } else {
      if (directChild.nextSibling !== this.placeholder) {
        this.renderer.insertBefore(this.elementRef.nativeElement, this.placeholder, directChild.nextSibling);
      }
    }
  }
  getPlaceholderIndex() {
    if (this.placeholder === null) {
      return void 0;
    }
    const element = this.elementRef.nativeElement;
    return Array.prototype.indexOf.call(element.children, this.placeholder);
  }
  cleanupDragoverState() {
    this.renderer.removeClass(this.elementRef.nativeElement, this.dndDragoverClass);
    this.removePlaceholderFromDOM();
  }
  static \u0275fac = function DndDropzoneDirective_Factory(t) {
    return new (t || _DndDropzoneDirective)(\u0275\u0275directiveInject(NgZone), \u0275\u0275directiveInject(ElementRef), \u0275\u0275directiveInject(Renderer2));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _DndDropzoneDirective,
    selectors: [["", "dndDropzone", ""]],
    contentQueries: function DndDropzoneDirective_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        \u0275\u0275contentQuery(dirIndex, DndPlaceholderRefDirective, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.dndPlaceholderRef = _t.first);
      }
    },
    hostBindings: function DndDropzoneDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("drop", function DndDropzoneDirective_drop_HostBindingHandler($event) {
          return ctx.onDrop($event);
        });
      }
    },
    inputs: {
      dndDropzone: "dndDropzone",
      dndEffectAllowed: "dndEffectAllowed",
      dndAllowExternal: "dndAllowExternal",
      dndHorizontal: "dndHorizontal",
      dndDragoverClass: "dndDragoverClass",
      dndDropzoneDisabledClass: "dndDropzoneDisabledClass",
      dndDisableIf: "dndDisableIf",
      dndDisableDropIf: "dndDisableDropIf"
    },
    outputs: {
      dndDragover: "dndDragover",
      dndDrop: "dndDrop"
    },
    standalone: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DndDropzoneDirective, [{
    type: Directive,
    args: [{
      selector: "[dndDropzone]",
      standalone: true
    }]
  }], () => [{
    type: NgZone
  }, {
    type: ElementRef
  }, {
    type: Renderer2
  }], {
    dndDropzone: [{
      type: Input
    }],
    dndEffectAllowed: [{
      type: Input
    }],
    dndAllowExternal: [{
      type: Input
    }],
    dndHorizontal: [{
      type: Input
    }],
    dndDragoverClass: [{
      type: Input
    }],
    dndDropzoneDisabledClass: [{
      type: Input
    }],
    dndDragover: [{
      type: Output
    }],
    dndDrop: [{
      type: Output
    }],
    dndPlaceholderRef: [{
      type: ContentChild,
      args: [DndPlaceholderRefDirective]
    }],
    dndDisableIf: [{
      type: Input
    }],
    dndDisableDropIf: [{
      type: Input
    }],
    onDrop: [{
      type: HostListener,
      args: ["drop", ["$event"]]
    }]
  });
})();
var DndHandleDirective = class _DndHandleDirective {
  draggable = true;
  dndDraggableDirective = inject(DndDraggableDirective);
  ngOnInit() {
    this.dndDraggableDirective.registerDragHandle(this);
  }
  ngOnDestroy() {
    this.dndDraggableDirective.registerDragHandle(void 0);
  }
  onDragEvent(event) {
    event._dndUsingHandle = true;
  }
  static \u0275fac = function DndHandleDirective_Factory(t) {
    return new (t || _DndHandleDirective)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _DndHandleDirective,
    selectors: [["", "dndHandle", ""]],
    hostVars: 1,
    hostBindings: function DndHandleDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("dragstart", function DndHandleDirective_dragstart_HostBindingHandler($event) {
          return ctx.onDragEvent($event);
        })("dragend", function DndHandleDirective_dragend_HostBindingHandler($event) {
          return ctx.onDragEvent($event);
        });
      }
      if (rf & 2) {
        \u0275\u0275attribute("draggable", ctx.draggable);
      }
    },
    standalone: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DndHandleDirective, [{
    type: Directive,
    args: [{
      selector: "[dndHandle]",
      standalone: true
    }]
  }], null, {
    draggable: [{
      type: HostBinding,
      args: ["attr.draggable"]
    }],
    onDragEvent: [{
      type: HostListener,
      args: ["dragstart", ["$event"]]
    }, {
      type: HostListener,
      args: ["dragend", ["$event"]]
    }]
  });
})();
var DndModule = class _DndModule {
  static \u0275fac = function DndModule_Factory(t) {
    return new (t || _DndModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _DndModule
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({});
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DndModule, [{
    type: NgModule,
    args: [{
      exports: [DndDraggableDirective, DndDropzoneDirective, DndHandleDirective, DndPlaceholderRefDirective, DndDragImageRefDirective],
      imports: [DndDragImageRefDirective, DndDropzoneDirective, DndHandleDirective, DndPlaceholderRefDirective, DndDraggableDirective]
    }]
  }], null, null);
})();

// src/app/shared/interfaces/actionbar.interface.ts
var ACTIONBAR_EVENTS = {
  OPEN: "ACTION_OPEN",
  CLOSE: "ACTION_CLOSE"
};
var ACTIONBAR_ACTION_TYPES = {
  CB: "CB",
  CO: "CO",
  ASIGN: "ASIGN",
  COPY: "COPY",
  CUT: "CUT",
  DOWNLOAD: "DOWNLOAD",
  PRESENTATION: "PRESENTATION",
  HYPERLINK_DOC: "HYPERLINK-DOC"
};
var ACTIONBAR_ACTIONTYPE_GROUPS = {
  CB_ONLY: [ACTIONBAR_ACTION_TYPES.CB],
  CB_OR_CO: [ACTIONBAR_ACTION_TYPES.CB, ACTIONBAR_ACTION_TYPES.CO],
  DOWNLOAD: [ACTIONBAR_ACTION_TYPES.DOWNLOAD],
  HYPERLINK_DOC: [ACTIONBAR_ACTION_TYPES.HYPERLINK_DOC]
};
var ACTIONBAR_FOLDER_TYPES = {
  CB: "CB",
  CO: "CO",
  MB: "MB"
};
var ACTIONBAR_CLOSE_ACTION_TYPES = ["EXPOERT", "UNDO", "Unassign", "CONV", "PRESENTATION"];
var ACTIONBAR_BUTTONS = {
  COPY: {
    name: "Copy",
    icon: "copy",
    iconSize: "text-lg",
    iconType: "extra",
    mode: "white",
    type: "COPY",
    addcls: "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on"
  },
  CUT: {
    name: "Cut",
    icon: "cut",
    iconSize: "text-lg",
    iconType: "extra",
    mode: "white",
    type: "CUT",
    addcls: "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on"
  },
  DELETE: {
    name: "Delete",
    icon: "delete",
    iconSize: "text-lg",
    iconType: "comnicn",
    mode: "solid",
    type: "D",
    addcls: "active:bg-red-100"
  },
  CONVERT: {
    name: "Convert",
    icon: "convert",
    iconSize: "text-lg",
    iconType: "extra",
    mode: "white",
    type: "CONV",
    addcls: "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on"
  },
  ASSIGN_TO_PRIVATE_BUNDLE: {
    name: "Assign to Private Bundle",
    icon: "folder",
    iconSize: "text-lg",
    iconType: "extra",
    mode: "white",
    type: "CB",
    addcls: "hover:!bg-white !text-blue-on"
  },
  ASSIGN_TO_CORE_BUNDLE: {
    name: "Assign to Core Bundle",
    icon: "corebundle",
    iconSize: "text-lg",
    iconType: "extra",
    mode: "white",
    type: "CO",
    addcls: "hover:!bg-white !text-blue-on"
  },
  UNASSIGN: {
    name: "Unassign",
    icon: "delete",
    iconSize: "text-lg",
    iconType: "comnicn",
    mode: "white",
    type: "Unassign",
    addcls: "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on"
  },
  EXPORT_WITH_ANNOTATION: {
    name: "Export with Annotation",
    icon: "export",
    iconSize: "text-lg",
    iconType: "real_icn",
    mode: "white",
    type: "EXPOERT",
    addcls: "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on"
  },
  DOWNLOAD: {
    name: "Download",
    icon: "download",
    iconSize: "text-lg",
    iconType: "extra",
    mode: "white",
    type: "DOWNLOAD",
    addcls: "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on"
  },
  PRESENTATION: {
    name: "Presentation",
    icon: "",
    iconSize: "text-lg",
    iconType: "extra",
    mode: "white",
    type: "PRESENTATION",
    addcls: "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on"
  },
  DOWNLOAD_WITH_HYPERLINK_DOC: {
    name: "Download With Hyperlink Doc",
    icon: "export",
    iconSize: "text-lg",
    iconType: "real_icn",
    mode: "white",
    type: "HYPERLINK-DOC",
    addcls: "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on"
  }
};

// src/app/shared/components/downloadtable/downloadtable.component.ts
var _c0 = (a0) => ({ "me-auto": a0 });
var _c1 = (a0) => ({ "!text-blue-on font-bold": a0 });
var _c2 = (a0) => ({ "truncate max-w-40": a0 });
function DownloadtableComponent_Conditional_1_span_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1, "/");
    \u0275\u0275elementEnd();
  }
}
function DownloadtableComponent_Conditional_1_For_7_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1, "/");
    \u0275\u0275elementEnd();
  }
}
function DownloadtableComponent_Conditional_1_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "li", 19);
    \u0275\u0275listener("click", function DownloadtableComponent_Conditional_1_For_7_Template_li_click_0_listener() {
      const ctx_r4 = \u0275\u0275restoreView(_r4);
      const x_r6 = ctx_r4.$implicit;
      const $index_r7 = ctx_r4.$index;
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.nBundleid = x_r6.nBundleid;
      return \u0275\u0275resetView(ctx_r2.changeBrdcrumb($index_r7));
    });
    \u0275\u0275elementStart(1, "a", 20);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, DownloadtableComponent_Conditional_1_For_7_span_3_Template, 2, 0, "span", 16);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r6 = ctx.$implicit;
    const $index_r7 = ctx.$index;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("tooltipText", x_r6.cBundlename)("ngClass", \u0275\u0275pureFunction1(5, _c2, ctx_r2.brdcrumb.length > 3))("ngClass", \u0275\u0275pureFunction1(7, _c1, $index_r7 == ctx_r2.brdcrumb.length - 1));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r6.cBundlename, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", $index_r7 != ctx_r2.brdcrumb.length - 1);
  }
}
function DownloadtableComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "div", 13)(2, "li", 14);
    \u0275\u0275listener("click", function DownloadtableComponent_Conditional_1_Template_li_click_2_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      ctx_r2.nBundleid = ctx_r2.nBundleid == 0 ? null : 0;
      ctx_r2.brdcrumb = [];
      return \u0275\u0275resetView(ctx_r2.getDownloadFiles());
    });
    \u0275\u0275elementStart(3, "a", 15);
    \u0275\u0275text(4, " Home ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, DownloadtableComponent_Conditional_1_span_5_Template, 2, 0, "span", 16);
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(6, DownloadtableComponent_Conditional_1_For_7_Template, 4, 9, "li", 17, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c0, !ctx_r2.nBundleid));
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(5, _c1, !ctx_r2.brdcrumb.length));
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.nBundleid && ctx_r2.brdcrumb.length);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.brdcrumb);
  }
}
function DownloadtableComponent_div_17_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "ul", 24)(1, "li", 25);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "li", 25);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "li", 26);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "li", 27);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r9 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((item_r9 == null ? null : item_r9.cTab) || "-");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((item_r9 == null ? null : item_r9.cExhibitno) || "-");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(item_r9 == null ? null : item_r9.cName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((item_r9 == null ? null : item_r9.cFiletype) || "-");
  }
}
function DownloadtableComponent_div_17_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "ul", 28);
    \u0275\u0275listener("click", function DownloadtableComponent_div_17_Conditional_4_Template_ul_click_0_listener() {
      \u0275\u0275restoreView(_r10);
      const item_r9 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.openFolder(item_r9));
    });
    \u0275\u0275element(1, "icon", 29);
    \u0275\u0275elementStart(2, "li", 25);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r9 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(item_r9 == null ? null : item_r9.cName);
  }
}
function DownloadtableComponent_div_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 21);
    \u0275\u0275listener("dragstart", function DownloadtableComponent_div_17_Template_div_dragstart_0_listener($event) {
      const item_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onDragStart($event, item_r9));
    })("dragend", function DownloadtableComponent_div_17_Template_div_dragend_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onDragEnd($event));
    });
    \u0275\u0275elementStart(1, "a", 22);
    \u0275\u0275element(2, "icon", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, DownloadtableComponent_div_17_Conditional_3_Template, 9, 4, "ul", 24)(4, DownloadtableComponent_div_17_Conditional_4_Template, 4, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r9 = ctx.$implicit;
    \u0275\u0275property("dndDraggable", item_r9)("dndType", item_r9.type)("dndEffectAllowed", "move");
    \u0275\u0275advance(3);
    \u0275\u0275conditional(3, (item_r9 == null ? null : item_r9.nBundledetailid) ? 3 : 4);
  }
}
var DownloadtableComponent = class _DownloadtableComponent {
  constructor(mfService, cdr) {
    this.mfService = mfService;
    this.cdr = cdr;
    this.onEvent = new EventEmitter();
    this.brdcrumb = [];
    this.filelist = [];
    this.draggedItem = null;
    this.viewportHeight = 440;
  }
  ngOnInit() {
  }
  ngOnChanges(changes) {
    return __async(this, null, function* () {
      debugger;
      if (!this.nBundleid) {
        this.getDownloadFiles();
      }
    });
  }
  changeBrdcrumb(index) {
    this.brdcrumb = this.brdcrumb.filter((e, i) => i <= index);
    this.nBundleid = this.brdcrumb.length ? this.brdcrumb[this.brdcrumb.length - 1]["nBundleid"] : 0;
    this.getDownloadFiles(this.nBundleid);
  }
  trackByFruit(index, item) {
    return item.nBundleid;
  }
  getDownloadFiles(nBundleid) {
    return __async(this, null, function* () {
      const res = yield this.mfService.getDownloadFiles(this.nDTaskid || null, this.nCaseid, this.nSectionid, this.jFolders, this.jFiles, nBundleid || null);
      this.filelist = res;
      if (this.filelist.length > 8) {
        this.viewportHeight = 440;
      } else {
        this.viewportHeight = this.filelist.length * 54;
      }
      if (res && res.length)
        this.nDTaskid = res[0]["nDTaskid"] || 0;
      setTimeout(() => {
        this.viewport?.checkViewportSize();
      });
      this.onEvent.emit({ event: "nDTaskid", data: { nDTaskid: this.nDTaskid } });
    });
  }
  onDragStart(event, item) {
    this.draggedItem = item;
  }
  onDragEnd(event) {
    this.draggedItem = null;
  }
  onDrop2(event, list) {
    debugger;
    if (!this.draggedItem || !this.viewport)
      return;
    let dropIndex = event.index;
    if (typeof dropIndex === "undefined") {
      dropIndex = list.length;
    } else {
      const firstRenderedIndex = this.viewport.getRenderedRange().start;
      dropIndex += firstRenderedIndex;
    }
    let draggedIndex = 0;
    if (this.draggedItem.nBundledetailid) {
      draggedIndex = list.findIndex((f) => f.nBundledetailid === this.draggedItem.nBundledetailid);
    } else {
      draggedIndex = list.findIndex((f) => f.nBundleid === this.draggedItem.nBundleid);
    }
    if (draggedIndex !== -1) {
      list.splice(draggedIndex, 1);
      if (draggedIndex < dropIndex) {
        dropIndex--;
      }
    }
    list.splice(dropIndex, 0, this.draggedItem);
    console.log(`Moved item ${this.draggedItem.id} to index ${dropIndex}`);
    const scrollPosition = this.viewport.measureScrollOffset();
    this.updateFileSerial(this.draggedItem.nBundleid, this.draggedItem.nBundledetailid, dropIndex);
    this.draggedItem = null;
    this.filelist = [...this.filelist];
    setTimeout(() => {
      this.viewport.checkViewportSize();
      this.viewport.scrollToOffset(scrollPosition);
      this.cdr.detectChanges();
    });
  }
  updateFileSerial(nBundleid, nBundledetailid, nNIndex) {
    return __async(this, null, function* () {
      debugger;
      try {
        yield this.mfService.getDownloadUpdateSerial(this.nDTaskid || null, nBundleid || null, nBundledetailid || null, nNIndex);
      } catch (error) {
      }
    });
  }
  openFolder(item) {
    this.brdcrumb.push({ nBundleid: item.nBundleid, cBundlename: item.cName });
    this.nBundleid = item.nBundleid;
    this.getDownloadFiles(item.nBundleid);
  }
  static {
    this.\u0275fac = function DownloadtableComponent_Factory(t) {
      return new (t || _DownloadtableComponent)(\u0275\u0275directiveInject(MyfileService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DownloadtableComponent, selectors: [["downloadtable"]], viewQuery: function DownloadtableComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(CdkVirtualScrollViewport, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.viewport = _t.first);
      }
    }, inputs: { jFolders: "jFolders", jFiles: "jFiles", nSectionid: "nSectionid", nCaseid: "nCaseid", nDTaskid: "nDTaskid" }, outputs: { onEvent: "onEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 19, vars: 5, consts: [["scrollViewport", ""], [1, "bg-faint", "py-5", "ps-3", "pe-5", "shadow-[1px_5px_12px_#00000026]"], [1, "flex", "gap-2", "items-center", "whitespace-nowrap", "py-2.5", "justify-end"], [1, "flex", "mb-2.5"], [1, "min-w-5"], [1, "flex", "w-full", "items-center", "text-white", "bg-grey", "rounded-s-base", "rounded-e-base", "[&>li]:px-3", "[&>li]:py-px", "[&>li]:whitespace-nowrap", "text-xxs", "py-0.5"], [1, "min-w-24"], [1, "w-auto", 2, "width", "-webkit-fill-available"], [1, "min-w-12"], ["itemSize", "54"], ["dndDropzone", "", "dndEffectAllowed", "move", 1, "dndList", "gap-1", "flex-grow-1", "d-flex", "flex-column", "bg-light", "rounded-1", "shadow-sm", 3, "dndDrop"], ["dndPlaceholderRef", "", 1, "dndPlaceholder", "rounded-1", "bg-danger", "bg-gradient"], ["class", "flex items-center h-11 group mb-2.5", 3, "dndDraggable", "dndType", "dndEffectAllowed", "dragstart", "dragend", 4, "cdkVirtualFor", "cdkVirtualForOf", "cdkVirtualForTrackBy"], [1, "flex", "flex-wrap", "me-auto"], [1, "inline-flex", "items-center", "cursor-pointer", "me-auto", 3, "click", "ngClass"], [1, "flex", "items-center", "text-sm", "text-gray-500", "hover:text-blue-600", "focus:outline-none", "focus:text-blue-600", 3, "ngClass"], ["class", "mx-2", 4, "ngIf"], [1, "inline-flex", "items-center", "cursor-pointer"], [1, "mx-2"], [1, "inline-flex", "items-center", "cursor-pointer", 3, "click"], ["truncateTooltip", "", 1, "items-center", "block", "text-sm", "text-gray-500", "hover:text-blue-600", "focus:outline-none", "focus:text-blue-600", 3, "tooltipText", "ngClass"], [1, "flex", "items-center", "h-11", "group", "mb-2.5", 3, "dragstart", "dragend", "dndDraggable", "dndType", "dndEffectAllowed"], ["dndHandle", "", 1, "min-w-5", "cursor-grab", "active:cursor-grabbing"], ["name", "drag", "type", "adminicn", 1, "text-xs", "text-blue-on", "hidden", "group-hover:block", "pointer-events-none"], [1, "flex", "w-full", "h-full", "items-center", "bg-white", "group-hover:shadow-base", "rounded-base", "[&>li]:px-3", "[&>li]:py-px", "[&>li]:whitespace-nowrap", "text-xxs", "py-0.5"], [1, "min-w-24", "truncate"], [1, "w-auto", "truncate", 2, "width", "-webkit-fill-available"], [1, "min-w-12", "truncate"], [1, "flex", "w-full", "h-full", "items-center", "bg-white", "group-hover:shadow-base", "rounded-base", "[&>li]:px-3", "[&>li]:py-px", "[&>li]:whitespace-nowrap", "text-xxs", "py-0.5", 3, "click"], ["name", "folder", 1, "-mt-px", "text-base", "ps-2"]], template: function DownloadtableComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1);
        \u0275\u0275template(1, DownloadtableComponent_Conditional_1_Template, 8, 7, "div", 2);
        \u0275\u0275elementStart(2, "header", 3);
        \u0275\u0275element(3, "div", 4);
        \u0275\u0275elementStart(4, "ul", 5)(5, "li", 6);
        \u0275\u0275text(6, "Tab");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "li", 6);
        \u0275\u0275text(8, "Exhibit No.");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "li", 7);
        \u0275\u0275text(10, "Doc Title");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "li", 8);
        \u0275\u0275text(12, "Kind");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(13, "cdk-virtual-scroll-viewport", 9, 0)(15, "mat-list", 10);
        \u0275\u0275listener("dndDrop", function DownloadtableComponent_Template_mat_list_dndDrop_15_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onDrop2($event, ctx.filelist));
        });
        \u0275\u0275element(16, "mat-list-item", 11);
        \u0275\u0275template(17, DownloadtableComponent_div_17_Template, 5, 4, "div", 12);
        \u0275\u0275elementEnd()()();
        \u0275\u0275text(18, "`");
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.nBundleid ? 1 : -1);
        \u0275\u0275advance(12);
        \u0275\u0275styleProp("height", ctx.viewportHeight, "px");
        \u0275\u0275advance(4);
        \u0275\u0275property("cdkVirtualForOf", ctx.filelist)("cdkVirtualForTrackBy", ctx.trackByFruit);
      }
    }, dependencies: [
      CommonModule,
      NgClass,
      NgIf,
      IconComponent,
      MatTooltipModule,
      ScrollingModule,
      CdkFixedSizeVirtualScroll,
      CdkVirtualForOf,
      CdkVirtualScrollViewport,
      NgScrollbarModule,
      DndDropzoneDirective,
      DndPlaceholderRefDirective,
      DndDraggableDirective,
      DndHandleDirective,
      DragDropModule,
      TruncateTooltipDirective
    ] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DownloadtableComponent, { className: "DownloadtableComponent", filePath: "src\\app\\shared\\components\\downloadtable\\downloadtable.component.ts", lineNumber: 23 });
})();

// src/app/shared/components/actionbar/actionbar.component.ts
var _c02 = (a0, a1, a2, a3, a4) => ({ "bg-black/80 w-screen": a0, "!h-14": a1, "h-[80px]": a2, "h-[195px]": a3, "!h-[140px]": a4 });
var _c12 = (a0, a1) => ({ "w-[621px]": a0, "w-[600px] h-full  !justify-start rounded-none rounded-bl-base": a1 });
var _c22 = (a0) => ({ folder: a0 });
var _c3 = () => ["P", "F"];
var _c4 = () => ["P"];
function ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_ng_container_11_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 28)(2, "button", 29);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_ng_container_11_ng_container_1_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r5);
      const section_r6 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.changeSection(section_r6));
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_ng_container_11_ng_container_1_Template_button_keydown_enter_2_listener($event) {
      \u0275\u0275restoreView(_r5);
      const section_r6 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.changeSection(section_r6));
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_ng_container_11_ng_container_1_Template_button_keydown_space_2_listener($event) {
      \u0275\u0275restoreView(_r5);
      const section_r6 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.changeSection(section_r6));
    });
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const section_r6 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(section_r6.cFolder);
  }
}
function ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_ng_container_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_ng_container_11_ng_container_1_Template, 5, 1, "ng-container", 17);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const section_r6 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", section_r6.cFoldertype == "CO");
  }
}
function ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "h6", 22);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "btn", 23, 3);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_Template_btn_click_4_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.btnclick(ctx_r2.type, "CO"));
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_Template_btn_keydown_enter_4_listener($event) {
      \u0275\u0275restoreView(_r2);
      const options2Trigger_r4 = \u0275\u0275reference(5);
      const ctx_r2 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      ctx_r2.btnclick(ctx_r2.type, "CO");
      return \u0275\u0275resetView(options2Trigger_r4.openMenu());
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_Template_btn_keydown_space_4_listener($event) {
      \u0275\u0275restoreView(_r2);
      const options2Trigger_r4 = \u0275\u0275reference(5);
      const ctx_r2 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      ctx_r2.btnclick(ctx_r2.type, "CO");
      return \u0275\u0275resetView(options2Trigger_r4.openMenu());
    });
    \u0275\u0275element(6, "icon", 24);
    \u0275\u0275text(7);
    \u0275\u0275element(8, "icon", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "mat-menu", 26, 4);
    \u0275\u0275template(11, ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_ng_container_11_Template, 2, 1, "ng-container", 27);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const options2_r7 = \u0275\u0275reference(10);
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 6, "ACTIONBAR.CHOOSE_LOCATION_INSIDE"));
    \u0275\u0275advance(2);
    \u0275\u0275property("mode", "white")("addcls", "!bg-white/20 !text-white")("matMenuTriggerFor", options2_r7);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r2.type, " ");
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx_r2.sections);
  }
}
function ActionbarComponent_ng_container_1_ng_container_2_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 22);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, "ACTIONBAR.CHOOSE_LOCATION_INSIDE_PRIVATE_BUNDLE"));
  }
}
function ActionbarComponent_ng_container_1_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ActionbarComponent_ng_container_1_ng_container_2_ng_container_1_Template, 12, 8, "ng-container", 16)(2, ActionbarComponent_ng_container_1_ng_container_2_ng_template_2_Template, 3, 3, "ng-template", null, 2, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const privateBundleTpl_r8 = \u0275\u0275reference(3);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.actiontype == "CO")("ngIfElse", privateBundleTpl_r8);
  }
}
function ActionbarComponent_ng_container_1_ng_container_3_ng_container_1_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "button", 31);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_container_3_ng_container_1_ng_container_2_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.showList = !ctx_r2.showList);
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_container_3_ng_container_1_ng_container_2_Template_button_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.showList = !ctx_r2.showList);
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_container_3_ng_container_1_ng_container_2_Template_button_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.showList = !ctx_r2.showList);
    });
    \u0275\u0275element(3, "icon", 32);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275attribute("aria-label", \u0275\u0275pipeBind1(2, 5, "ACTIONBAR.TOGGLE_DOWNLOAD_LIST"));
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r2.showList ? "rotate-180" : "");
    \u0275\u0275property("name", "chvx")("type", "comnicn");
  }
}
function ActionbarComponent_ng_container_1_ng_container_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "h6", 30);
    \u0275\u0275template(2, ActionbarComponent_ng_container_1_ng_container_3_ng_container_1_ng_container_2_Template, 4, 7, "ng-container", 17);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275pipe(6, "translate");
    \u0275\u0275pipe(7, "translate");
    \u0275\u0275pipe(8, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", ctx_r2.ACTIONBAR_ACTIONTYPE_GROUPS.DOWNLOAD.includes(ctx_r2.actiontype) && ctx_r2.isdownload);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate3(" ", ctx_r2.files ? ctx_r2.files + " " + (ctx_r2.files == 1 ? \u0275\u0275pipeBind1(4, 4, "ACTIONBAR.FILE") : \u0275\u0275pipeBind1(5, 6, "ACTIONBAR.FILES")) : "", " ", ctx_r2.folders ? ctx_r2.folders + " " + (ctx_r2.folders == 1 ? \u0275\u0275pipeBind1(6, 8, "ACTIONBAR.FOLDER") : \u0275\u0275pipeBind1(7, 10, "ACTIONBAR.FOLDERS")) : "", " ", ctx_r2.files > 0 || ctx_r2.folders > 0 ? \u0275\u0275pipeBind1(8, 12, "ACTIONBAR.SELECTED") : "", " ");
  }
}
function ActionbarComponent_ng_container_1_ng_container_3_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 33);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, "ACTIONBAR.CHOOSE_FILES_BELOW"));
  }
}
function ActionbarComponent_ng_container_1_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ActionbarComponent_ng_container_1_ng_container_3_ng_container_1_Template, 9, 14, "ng-container", 16)(2, ActionbarComponent_ng_container_1_ng_container_3_ng_template_2_Template, 3, 3, "ng-template", null, 5, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const chooseFilesTpl_r10 = \u0275\u0275reference(3);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.files > 0 || ctx_r2.folders > 0)("ngIfElse", chooseFilesTpl_r10);
  }
}
function ActionbarComponent_ng_container_1_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "h6", 34);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 1, "ACTIONBAR.FILE_PASTED"));
  }
}
function ActionbarComponent_ng_container_1_ng_container_6_ng_container_1_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 35);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_container_6_ng_container_1_ng_container_1_ng_container_1_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r11);
      const x_r12 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.btnclick(x_r12.name, x_r12.type));
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_container_6_ng_container_1_ng_container_1_ng_container_1_Template_btn_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r11);
      const x_r12 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.btnclick(x_r12.name, x_r12.type));
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_container_6_ng_container_1_ng_container_1_ng_container_1_Template_btn_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r11);
      const x_r12 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.btnclick(x_r12.name, x_r12.type));
    });
    \u0275\u0275element(2, "icon", 36);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r12 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.files == 0 && ctx_r2.folders == 0 ? "pointer-events-none" : "");
    \u0275\u0275property("mode", x_r12.mode)("addcls", x_r12.addcls + (ctx_r2.files == 0 && ctx_r2.folders == 0 ? "opacity-50 !text-gray-300 pointer-events-none" : ""));
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.data.iconSize);
    \u0275\u0275property("name", x_r12.icon)("type", x_r12.iconType);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(4, 9, "ACTIONBAR.ASSING_TO", \u0275\u0275pureFunction1(12, _c22, (ctx_r2.defsection == null ? null : ctx_r2.defsection.cFolder) ? ctx_r2.defsection == null ? null : ctx_r2.defsection.cFolder : "")), " ");
  }
}
function ActionbarComponent_ng_container_1_ng_container_6_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ActionbarComponent_ng_container_1_ng_container_6_ng_container_1_ng_container_1_ng_container_1_Template, 5, 14, "ng-container", 17);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r12 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r12.type == "CO");
  }
}
function ActionbarComponent_ng_container_1_ng_container_6_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ActionbarComponent_ng_container_1_ng_container_6_ng_container_1_ng_container_1_Template, 2, 1, "ng-container", 27);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.data.buttons);
  }
}
function ActionbarComponent_ng_container_1_ng_container_6_ng_template_2_ng_container_0_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 25);
    \u0275\u0275elementContainerEnd();
  }
}
function ActionbarComponent_ng_container_1_ng_container_6_ng_template_2_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 37, 8);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_container_6_ng_template_2_ng_container_0_Template_btn_click_1_listener() {
      const x_r14 = \u0275\u0275restoreView(_r13).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.btnclick(x_r14.name, x_r14.type));
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_container_6_ng_template_2_ng_container_0_Template_btn_keydown_enter_1_listener($event) {
      const x_r14 = \u0275\u0275restoreView(_r13).$implicit;
      const optionsTrigger_r15 = \u0275\u0275reference(2);
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      ctx_r2.btnclick(x_r14.name, x_r14.type);
      return \u0275\u0275resetView(x_r14.type == "CO" ? optionsTrigger_r15.openMenu() : null);
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_container_6_ng_template_2_ng_container_0_Template_btn_keydown_space_1_listener($event) {
      const x_r14 = \u0275\u0275restoreView(_r13).$implicit;
      const optionsTrigger_r15 = \u0275\u0275reference(2);
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      ctx_r2.btnclick(x_r14.name, x_r14.type);
      return \u0275\u0275resetView(x_r14.type == "CO" ? optionsTrigger_r15.openMenu() : null);
    });
    \u0275\u0275element(3, "icon", 36);
    \u0275\u0275text(4);
    \u0275\u0275template(5, ActionbarComponent_ng_container_1_ng_container_6_ng_template_2_ng_container_0_ng_container_5_Template, 2, 0, "ng-container", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r14 = ctx.$implicit;
    \u0275\u0275nextContext(2);
    const options_r16 = \u0275\u0275reference(5);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("mode", x_r14.mode)("addcls", x_r14.addcls)("matMenuTriggerFor", x_r14.type == "CO" ? options_r16 : null);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r2.data.iconSize);
    \u0275\u0275property("name", x_r14.icon)("type", x_r14.iconType);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", x_r14.name, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", x_r14.type == "CO");
  }
}
function ActionbarComponent_ng_container_1_ng_container_6_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ActionbarComponent_ng_container_1_ng_container_6_ng_template_2_ng_container_0_Template, 6, 9, "ng-container", 27);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275property("ngForOf", ctx_r2.data.buttons);
  }
}
function ActionbarComponent_ng_container_1_ng_container_6_ng_container_6_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 28)(2, "button", 29);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_container_6_ng_container_6_ng_container_1_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r17);
      const section_r18 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.changeSection(section_r18));
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_container_6_ng_container_6_ng_container_1_Template_button_keydown_enter_2_listener($event) {
      \u0275\u0275restoreView(_r17);
      const section_r18 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.changeSection(section_r18));
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_container_6_ng_container_6_ng_container_1_Template_button_keydown_space_2_listener($event) {
      \u0275\u0275restoreView(_r17);
      const section_r18 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.changeSection(section_r18));
    });
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const section_r18 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(section_r18.cFolder);
  }
}
function ActionbarComponent_ng_container_1_ng_container_6_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ActionbarComponent_ng_container_1_ng_container_6_ng_container_6_ng_container_1_Template, 5, 1, "ng-container", 17);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const section_r18 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", section_r18.cFoldertype == "CO");
  }
}
function ActionbarComponent_ng_container_1_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ActionbarComponent_ng_container_1_ng_container_6_ng_container_1_Template, 2, 1, "ng-container", 16)(2, ActionbarComponent_ng_container_1_ng_container_6_ng_template_2_Template, 1, 1, "ng-template", null, 6, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementStart(4, "mat-menu", 26, 7);
    \u0275\u0275template(6, ActionbarComponent_ng_container_1_ng_container_6_ng_container_6_Template, 2, 1, "ng-container", 27);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const buttonsTpl_r19 = \u0275\u0275reference(3);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isadmin && ctx_r2.assignTodef)("ngIfElse", buttonsTpl_r19);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngForOf", ctx_r2.sections);
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 35);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_template_7_ng_container_0_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r20);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.btnclick("Paste", "P"));
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_template_7_ng_container_0_Template_btn_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r20);
      const ctx_r2 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.btnclick("Paste", "P"));
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_template_7_ng_container_0_Template_btn_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r20);
      const ctx_r2 = \u0275\u0275nextContext(3);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.btnclick("Paste", "P"));
    });
    \u0275\u0275element(2, "icon", 36);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("mode", "white")("addcls", "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on");
    \u0275\u0275advance();
    \u0275\u0275classMap("text-lg");
    \u0275\u0275property("name", "copy")("type", "extra");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", !ctx_r2.progress ? \u0275\u0275pipeBind1(4, 7, "ACTIONBAR.PASTE") : \u0275\u0275pipeBind1(5, 9, "ACTIONBAR.COPYING"), " ");
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_1_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 38);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_1_ng_container_0_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r21);
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.btnclick("Undo", "UNDO"));
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_1_ng_container_0_Template_btn_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r21);
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.btnclick("Undo", "UNDO"));
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_1_ng_container_0_Template_btn_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r21);
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.btnclick("Undo", "UNDO"));
    });
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("mode", "white")("addcls", "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(3, 3, "ACTIONBAR.UNDO"), " ");
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ActionbarComponent_ng_container_1_ng_template_7_ng_template_1_ng_container_0_Template, 4, 5, "ng-container", 16);
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const assignOrDownloadTpl_r22 = \u0275\u0275reference(4);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngIf", ctx_r2.isUndo)("ngIfElse", assignOrDownloadTpl_r22);
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_3_ng_container_0_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "icon", 24);
    \u0275\u0275elementContainerEnd();
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_3_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 35);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_3_ng_container_0_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r23);
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.btnclick("Assign", "ASIGN"));
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_3_ng_container_0_Template_btn_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r23);
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.btnclick("Assign", "ASIGN"));
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_3_ng_container_0_Template_btn_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r23);
      const ctx_r2 = \u0275\u0275nextContext(4);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.btnclick("Assign", "ASIGN"));
    });
    \u0275\u0275template(2, ActionbarComponent_ng_container_1_ng_template_7_ng_template_3_ng_container_0_ng_container_2_Template, 2, 0, "ng-container", 17);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275pipe(5, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("mode", "white")("addcls", ctx_r2.actiontype == "CO" ? "!text-blue-on hover:bg-white" : "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.actiontype == "CO");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", !ctx_r2.progress ? \u0275\u0275pipeBind1(4, 4, "ACTIONBAR.ASSIGN") : \u0275\u0275pipeBind1(5, 6, "ACTIONBAR.ASSIGNING"), " ");
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ActionbarComponent_ng_container_1_ng_template_7_ng_template_3_ng_container_0_Template, 6, 8, "ng-container", 16);
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const downloadTpl_r24 = \u0275\u0275reference(6);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngIf", ctx_r2.ACTIONBAR_ACTIONTYPE_GROUPS.CB_OR_CO.includes(ctx_r2.actiontype) && !ctx_r2.isUndo)("ngIfElse", downloadTpl_r24);
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r26 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 35);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_ng_container_5_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r26);
      const ctx_r2 = \u0275\u0275nextContext(6);
      return \u0275\u0275resetView(ctx_r2.isdownload = true);
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_ng_container_5_Template_btn_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r26);
      const ctx_r2 = \u0275\u0275nextContext(6);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.isdownload = true);
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_ng_container_5_Template_btn_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r26);
      const ctx_r2 = \u0275\u0275nextContext(6);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.isdownload = true);
    });
    \u0275\u0275element(2, "icon", 36);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.files == 0 && ctx_r2.folders == 0 ? "pointer-events-none" : "");
    \u0275\u0275property("mode", "white")("addcls", "bg-white/10 hover:bg-white text-white active:bg-white active:text-blue-on" + (ctx_r2.files == 0 && ctx_r2.folders == 0 ? "opacity-50 !text-gray-300 pointer-events-none" : ""));
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.data.iconSize);
    \u0275\u0275property("name", "addcircle")("type", "comnicn");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(4, 9, "ACTIONBAR.ADD_OTHER_FILES"), " ");
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r25 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 39);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r25);
      const ctx_r2 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r2.downloadFiles());
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_Template_btn_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r25);
      const ctx_r2 = \u0275\u0275nextContext(5);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.downloadFiles());
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_Template_btn_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r25);
      const ctx_r2 = \u0275\u0275nextContext(5);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.downloadFiles());
    });
    \u0275\u0275element(2, "icon", 36);
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_ng_container_5_Template, 5, 11, "ng-container", 17);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.files == 0 && ctx_r2.folders == 0 ? "pointer-events-none" : "");
    \u0275\u0275property("mode", "white")("addcls", " hover:bg-white !text-blue-on active:bg-white active:text-blue-on" + (ctx_r2.files == 0 && ctx_r2.folders == 0 ? "opacity-50 !text-gray-300 pointer-events-none" : ""))("isloading", ctx_r2.downloadLoading)("loader", "dark");
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.data.iconSize);
    \u0275\u0275property("name", "download")("type", "extra");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pureFunction0(14, _c3).includes(ctx_r2.indexStatus) ? ctx_r2.responceMsg : \u0275\u0275pipeBind1(4, 12, "ACTIONBAR.DOWNLOAD"), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", !ctx_r2.isdownload && !\u0275\u0275pureFunction0(15, _c4).includes(ctx_r2.indexStatus));
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r27 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 35);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_template_2_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r27);
      const ctx_r2 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r2.viewDownloading());
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_template_2_Template_btn_keydown_enter_0_listener($event) {
      \u0275\u0275restoreView(_r27);
      const ctx_r2 = \u0275\u0275nextContext(5);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.viewDownloading());
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_template_2_Template_btn_keydown_space_0_listener($event) {
      \u0275\u0275restoreView(_r27);
      const ctx_r2 = \u0275\u0275nextContext(5);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.viewDownloading());
    });
    \u0275\u0275element(1, "icon", 36);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275classMap(ctx_r2.files == 0 && ctx_r2.folders == 0 ? "pointer-events-none" : "");
    \u0275\u0275property("mode", "white")("addcls", " hover:bg-white !text-blue-on active:bg-white active:text-blue-on" + (ctx_r2.files == 0 && ctx_r2.folders == 0 ? "opacity-50 !text-gray-300 pointer-events-none" : ""));
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.data.iconSize);
    \u0275\u0275property("name", "download")("type", "extra");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(3, 9, "ACTIONBAR.VIEW_DOWNLOADING"), " ");
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_container_1_Template, 6, 16, "ng-container", 16)(2, ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_ng_template_2_Template, 4, 11, "ng-template", null, 13, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const viewDownloadingTpl_r28 = \u0275\u0275reference(3);
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r2.isDownloadStarted)("ngIfElse", viewDownloadingTpl_r28);
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_ng_container_0_Template, 4, 2, "ng-container", 16);
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const hyperlinkTpl_r29 = \u0275\u0275reference(8);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngIf", ctx_r2.ACTIONBAR_ACTIONTYPE_GROUPS.DOWNLOAD.includes(ctx_r2.actiontype) && !ctx_r2.isUndo)("ngIfElse", hyperlinkTpl_r29);
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r30 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "btn", 39);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_container_1_Template_btn_click_1_listener() {
      \u0275\u0275restoreView(_r30);
      const ctx_r2 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r2.downloadWithLinkfile());
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_container_1_Template_btn_keydown_enter_1_listener($event) {
      \u0275\u0275restoreView(_r30);
      const ctx_r2 = \u0275\u0275nextContext(5);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.downloadWithLinkfile());
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_container_1_Template_btn_keydown_space_1_listener($event) {
      \u0275\u0275restoreView(_r30);
      const ctx_r2 = \u0275\u0275nextContext(5);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.downloadWithLinkfile());
    });
    \u0275\u0275element(2, "icon", 36);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.files == 0 && ctx_r2.folders == 0 ? "pointer-events-none" : "");
    \u0275\u0275property("mode", "white")("addcls", " hover:bg-white !text-blue-on active:bg-white active:text-blue-on" + (ctx_r2.files == 0 && ctx_r2.folders == 0 ? "opacity-50 !text-gray-300 pointer-events-none" : ""))("isloading", ctx_r2.downloadLoading)("loader", "dark");
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.data.iconSize);
    \u0275\u0275property("name", "export")("type", "real_icn");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.type, " ");
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r31 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "btn", 35);
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_template_2_Template_btn_click_0_listener() {
      \u0275\u0275restoreView(_r31);
      const ctx_r2 = \u0275\u0275nextContext(5);
      return \u0275\u0275resetView(ctx_r2.viewDownloading());
    })("keydown.enter", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_template_2_Template_btn_keydown_enter_0_listener($event) {
      \u0275\u0275restoreView(_r31);
      const ctx_r2 = \u0275\u0275nextContext(5);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.viewDownloading());
    })("keydown.space", function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_template_2_Template_btn_keydown_space_0_listener($event) {
      \u0275\u0275restoreView(_r31);
      const ctx_r2 = \u0275\u0275nextContext(5);
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.viewDownloading());
    });
    \u0275\u0275element(1, "icon", 36);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(5);
    \u0275\u0275classMap(ctx_r2.files == 0 && ctx_r2.folders == 0 ? "pointer-events-none" : "");
    \u0275\u0275property("mode", "white")("addcls", " hover:bg-white !text-blue-on active:bg-white active:text-blue-on" + (ctx_r2.files == 0 && ctx_r2.folders == 0 ? "opacity-50 !text-gray-300 pointer-events-none" : ""));
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.data.iconSize);
    \u0275\u0275property("name", "download")("type", "extra");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(3, 9, "ACTIONBAR.VIEW_DOWNLOADING"), " ");
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_container_1_Template, 4, 11, "ng-container", 16)(2, ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_ng_template_2_Template, 4, 11, "ng-template", null, 14, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const viewDownloading2Tpl_r32 = \u0275\u0275reference(3);
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r2.isDownloadStarted)("ngIfElse", viewDownloading2Tpl_r32);
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_ng_container_0_Template, 4, 2, "ng-container", 17);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275property("ngIf", ctx_r2.ACTIONBAR_ACTIONTYPE_GROUPS.HYPERLINK_DOC.includes(ctx_r2.actiontype) && !ctx_r2.isUndo);
  }
}
function ActionbarComponent_ng_container_1_ng_template_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ActionbarComponent_ng_container_1_ng_template_7_ng_container_0_Template, 6, 11, "ng-container", 16)(1, ActionbarComponent_ng_container_1_ng_template_7_ng_template_1_Template, 1, 2, "ng-template", null, 9, \u0275\u0275templateRefExtractor)(3, ActionbarComponent_ng_container_1_ng_template_7_ng_template_3_Template, 1, 2, "ng-template", null, 10, \u0275\u0275templateRefExtractor)(5, ActionbarComponent_ng_container_1_ng_template_7_ng_template_5_Template, 1, 2, "ng-template", null, 11, \u0275\u0275templateRefExtractor)(7, ActionbarComponent_ng_container_1_ng_template_7_ng_template_7_Template, 1, 1, "ng-template", null, 12, \u0275\u0275templateRefExtractor);
  }
  if (rf & 2) {
    const undoOrOtherTpl_r33 = \u0275\u0275reference(2);
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngIf", "Copy,Cut".includes(ctx_r2.type) && !ctx_r2.isUndo)("ngIfElse", undoOrOtherTpl_r33);
  }
}
function ActionbarComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 18);
    \u0275\u0275template(2, ActionbarComponent_ng_container_1_ng_container_2_Template, 4, 2, "ng-container", 17)(3, ActionbarComponent_ng_container_1_ng_container_3_Template, 4, 2, "ng-container", 17)(4, ActionbarComponent_ng_container_1_ng_container_4_Template, 4, 3, "ng-container", 17);
    \u0275\u0275elementStart(5, "div", 19);
    \u0275\u0275template(6, ActionbarComponent_ng_container_1_ng_container_6_Template, 7, 3, "ng-container", 16)(7, ActionbarComponent_ng_container_1_ng_template_7_Template, 9, 2, "ng-template", null, 1, \u0275\u0275templateRefExtractor);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 20);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275listener("click", function ActionbarComponent_ng_container_1_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.confirmation ? ctx_r2.confirmation = !ctx_r2.confirmation : ctx_r2.close());
    })("keydown.enter", function ActionbarComponent_ng_container_1_Template_button_keydown_enter_9_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.confirmation ? ctx_r2.confirmation = !ctx_r2.confirmation : ctx_r2.close());
    })("keydown.space", function ActionbarComponent_ng_container_1_Template_button_keydown_space_9_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.confirmation ? ctx_r2.confirmation = !ctx_r2.confirmation : ctx_r2.close());
    });
    \u0275\u0275element(11, "icon", 21);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const typeActionsTpl_r34 = \u0275\u0275reference(8);
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(11, _c12, !ctx_r2.isUndo, ctx_r2.isdownload));
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.ACTIONBAR_ACTIONTYPE_GROUPS.CB_OR_CO.includes(ctx_r2.actiontype) && !ctx_r2.isUndo);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r2.isUndo);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isUndo);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.isdownload ? "ms-auto" : "");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r2.type)("ngIfElse", typeActionsTpl_r34);
    \u0275\u0275advance(3);
    \u0275\u0275attribute("aria-label", \u0275\u0275pipeBind1(10, 9, "COMMON.CLOSE"));
  }
}
function ActionbarComponent_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r35 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 40)(1, "h6", 41);
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 19)(5, "btn", 42);
    \u0275\u0275listener("click", function ActionbarComponent_ng_template_2_Template_btn_click_5_listener() {
      \u0275\u0275restoreView(_r35);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.delete());
    })("keydown.enter", function ActionbarComponent_ng_template_2_Template_btn_keydown_enter_5_listener($event) {
      \u0275\u0275restoreView(_r35);
      const ctx_r2 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.delete());
    })("keydown.space", function ActionbarComponent_ng_template_2_Template_btn_keydown_space_5_listener($event) {
      \u0275\u0275restoreView(_r35);
      const ctx_r2 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.delete());
    });
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "translate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "btn", 43);
    \u0275\u0275listener("click", function ActionbarComponent_ng_template_2_Template_btn_click_8_listener() {
      \u0275\u0275restoreView(_r35);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.confirmation = false);
    })("keydown.enter", function ActionbarComponent_ng_template_2_Template_btn_keydown_enter_8_listener($event) {
      \u0275\u0275restoreView(_r35);
      const ctx_r2 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.confirmation = false);
    })("keydown.space", function ActionbarComponent_ng_template_2_Template_btn_keydown_space_8_listener($event) {
      \u0275\u0275restoreView(_r35);
      const ctx_r2 = \u0275\u0275nextContext();
      $event.preventDefault();
      return \u0275\u0275resetView(ctx_r2.confirmation = false);
    });
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "translate");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 3, "ACTIONBAR.CONFIRM_DELETE"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(7, 5, "ACTIONBAR.CONFIRM"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(10, 7, "ACTIONBAR.CANCEL"), " ");
  }
}
function ActionbarComponent_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r36 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "downloadtable", 44);
    \u0275\u0275listener("onEvent", function ActionbarComponent_ng_container_4_Template_downloadtable_onEvent_1_listener($event) {
      \u0275\u0275restoreView(_r36);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.downloadEvent($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("nCaseid", ctx_r2.nCaseid)("nSectionid", ctx_r2.nSectionid)("jFiles", ctx_r2.jFiles)("jFolders", ctx_r2.jFolders)("nDTaskid", ctx_r2.nDTaskid);
  }
}
var ACTIONBAR_EVENTS2 = {
  CHANGE_SECTION: "CHANGE-SECTION"
};
var ACTIONBAR_DIALOG_RESULTS = {
  CLOSE: "Close",
  DELETE: "Delete"
};
var ACTIONBAR_DOWNLOAD_STATUS = {
  IN_PROGRESS: "P",
  FINISHED: "F",
  COMPLETE: "C"
};
var ACTIONBAR_DOWNLOAD_TABLE_EVENTS = {
  TASK_ID: "nDTaskid"
};
var ActionbarComponent = class _ActionbarComponent {
  constructor(dialogRef, data, cs, bmService, ss, cf, hs) {
    this.dialogRef = dialogRef;
    this.data = data;
    this.cs = cs;
    this.bmService = bmService;
    this.ss = ss;
    this.cf = cf;
    this.hs = hs;
    this.ACTIONBAR_ACTIONTYPE_GROUPS = ACTIONBAR_ACTIONTYPE_GROUPS;
    this.files = 0;
    this.folders = 0;
    this.type = null;
    this.actiontype = "";
    this.isUndo = false;
    this.progress = false;
    this.isdownload = false;
    this.isadmin = false;
    this.sections = [];
    this.nCaseid = "";
    this.assignTodef = "";
    this.showList = false;
    this.nSectionid = "";
    this.jFolders = "";
    this.jFiles = "";
    this.nDTaskid = "";
    this.isDownloding = false;
    this.responceMsg = "";
    this.indexStatus = "";
    this.isMeexpand = false;
    this.isDownloadStarted = false;
    this.downloadLoading = false;
    this.confirmation = false;
    this.files = data?.files ?? 0;
    this.folders = data?.folders ?? 0;
    this.isadmin = data?.isadmin ?? false;
    this.nCaseid = data?.nCaseid ?? "";
    this.nSectionid = data?.nSectionid ?? "";
    this.assignTodef = data?.assignTodef ?? "";
    this.jFiles = data?.jFiles ?? "";
    this.jFolders = data?.jFolders ?? "";
    this.socketSubscription = this.ss.getDownload().subscribe((res) => {
      const type = res?.data?.type ?? "";
      this.indexStatus = type;
      if (type !== ACTIONBAR_DOWNLOAD_STATUS.FINISHED && type !== ACTIONBAR_DOWNLOAD_STATUS.COMPLETE) {
        this.responceMsg = res?.data?.message ?? "";
      }
      if (type === ACTIONBAR_DOWNLOAD_STATUS.FINISHED) {
        this.isDownloding = false;
        this.responceMsg = res?.data?.message ?? "";
        this.dialogRef.close();
      }
      if (type === ACTIONBAR_DOWNLOAD_STATUS.COMPLETE) {
        this.isDownloding = false;
        this.dialogRef.close({
          isSave: true,
          nBundledetailid: res?.data?.nBundledetailid,
          cName: res?.data?.cName
        });
      }
    });
  }
  ngOnInit() {
    if (this.isadmin) {
      void this.getSection();
    }
    this.evsubscription = this.cs.functionCalled$.subscribe((data) => {
      if (data?.event === MYFILES_CS_EVENTS.DOWNLOAD_STARTED) {
        this.isDownloadStarted = true;
        this.downloadLoading = false;
      } else if (data?.event === MYFILES_CS_EVENTS.DOWNLOAD_FAILED) {
        this.isDownloadStarted = false;
        this.downloadLoading = false;
      }
    });
  }
  ngOnDestroy() {
    this.isDownloadStarted = false;
    this.cs.callFunction({ type: MYFILES_CS_TYPES.CUT_COPY_EVENT, isCopy: false });
    this.socketSubscription.unsubscribe();
    this.evsubscription?.unsubscribe();
  }
  close() {
    if (this.actiontype === ACTIONBAR_ACTION_TYPES.CB && this.hs.isGlobalSearch) {
      this.cs.callFunction({ type: ACTIONBAR_EVENTS2.CHANGE_SECTION, cFoldertype: ACTIONBAR_FOLDER_TYPES.MB });
    }
    this.type = null;
    this.dialogRef.close(ACTIONBAR_DIALOG_RESULTS.CLOSE);
  }
  delete() {
    this.dialogRef.close(ACTIONBAR_DIALOG_RESULTS.DELETE);
  }
  changeSection(x) {
    if (x?.nSectionid) {
      this.actiontype = ACTIONBAR_ACTION_TYPES.CO;
      this.type = x.cFolder ?? null;
    }
    this.cs.callFunction({
      type: ACTIONBAR_EVENTS2.CHANGE_SECTION,
      nSectionid: x?.nSectionid,
      cFoldertype: x?.cFoldertype
    });
  }
  getSection() {
    return __async(this, null, function* () {
      if (!this.sections.length) {
        const res = yield this.bmService.getSections(this.nCaseid);
        this.sections = res ?? [];
        if (this.assignTodef) {
          this.defsection = this.sections.find((e) => e.nSectionid === this.assignTodef);
        }
      }
    });
  }
  btnclick(type, actiontype) {
    if (this.shouldFetchSectionsForCore(actiontype)) {
      void this.getSection();
      return;
    }
    this.applyDefaultSectionIfNeeded();
    this.actiontype = actiontype;
    if (type === "Delete") {
      this.confirmation = true;
      return;
    }
    if (type === "Paste") {
      this.handlePaste();
      return;
    }
    if (this.shouldCloseDialogForAction(actiontype)) {
      this.dialogRef.close(actiontype);
      return;
    }
    if (actiontype === ACTIONBAR_ACTION_TYPES.ASIGN) {
      this.handleAssign();
      return;
    }
    this.setTypeAndMaybeResetPath(type);
    if (actiontype === ACTIONBAR_ACTION_TYPES.COPY || actiontype === ACTIONBAR_ACTION_TYPES.CUT) {
      this.cs.callFunction({ type: MYFILES_CS_TYPES.CUT_COPY_EVENT, isCopy: true });
    }
    if (actiontype === ACTIONBAR_ACTION_TYPES.HYPERLINK_DOC) {
      this.downloadWithLinkfile();
    }
  }
  shouldFetchSectionsForCore(actiontype) {
    return actiontype === ACTIONBAR_ACTION_TYPES.CO && !this.assignTodef;
  }
  applyDefaultSectionIfNeeded() {
    if (this.assignTodef && this.defsection) {
      this.changeSection(this.defsection);
    }
  }
  shouldCloseDialogForAction(actiontype) {
    return ACTIONBAR_CLOSE_ACTION_TYPES.includes(actiontype);
  }
  handlePaste() {
    if (typeof this.data.pasteFiles !== "function") {
      return;
    }
    if (this.progress) {
      return;
    }
    this.progress = true;
    this.data.pasteFiles(this.type);
  }
  handleAssign() {
    if (typeof this.data.assignFiles !== "function") {
      return;
    }
    if (this.progress) {
      return;
    }
    this.progress = true;
    this.data.assignFiles(this.type);
  }
  setTypeAndMaybeResetPath(type) {
    this.type = type;
    if (this.actiontype === ACTIONBAR_ACTION_TYPES.CB) {
      this.data.resetpath?.();
      this.changeSection({ cFoldertype: ACTIONBAR_FOLDER_TYPES.CB });
    }
  }
  downloadWithLinkfile() {
    this.downloadLoading = true;
    this.cs.callFunction(MYFILES_CS_EVENTS.HYPERLINK_DOC);
  }
  downloadFiles() {
    if (this.indexStatus === ACTIONBAR_DOWNLOAD_STATUS.IN_PROGRESS) {
      return;
    }
    this.downloadLoading = true;
    this.cs.callFunction(MYFILES_CS_EVENTS.DOWNLOAD_FILE);
  }
  getSelectedFolder() {
    return !(this.data.getSelectedFolder?.()?.length ?? 0);
  }
  goback() {
    if (this.confirmation) {
      this.confirmation = false;
      return;
    }
    this.close();
  }
  downloadEvent(e) {
    if (e?.event === ACTIONBAR_DOWNLOAD_TABLE_EVENTS.TASK_ID) {
      this.nDTaskid = e?.data?.nDTaskid ?? "";
    }
  }
  viewDownloading() {
    this.cf.goto("myfiles/download", { id: this.nCaseid });
  }
  static {
    this.\u0275fac = function ActionbarComponent_Factory(t) {
      return new (t || _ActionbarComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(BundlemanageService), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(HeaderService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ActionbarComponent, selectors: [["app-actionbar"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 5, vars: 10, consts: [["confirmationTpl", ""], ["typeActionsTpl", ""], ["privateBundleTpl", ""], ["options2Trigger", "matMenuTrigger"], ["options2", "matMenu"], ["chooseFilesTpl", ""], ["buttonsTpl", ""], ["options", "matMenu"], ["optionsTrigger", "matMenuTrigger"], ["undoOrOtherTpl", ""], ["assignOrDownloadTpl", ""], ["downloadTpl", ""], ["hyperlinkTpl", ""], ["viewDownloadingTpl", ""], ["viewDownloading2Tpl", ""], [1, "flex", "items-center", "justify-center", 3, "ngClass"], [4, "ngIf", "ngIfElse"], [4, "ngIf"], [1, "flex", "items-center", "justify-between", "gap-4", "bg-blue-on", "rounded-full", "px-8", "py-2.5", "min-w-fit", 3, "ngClass"], [1, "flex", "items-center", "gap-2"], ["type", "button", 1, "ms-4", 3, "click", "keydown.enter", "keydown.space"], ["name", "close", "type", "comnicn", 1, "text-xs", "text-white"], [1, "w-full", "text-xs", "font-medium", "text-white"], [1, "me-12", 3, "click", "keydown.enter", "keydown.space", "mode", "addcls", "matMenuTriggerFor"], ["name", "corebundle", "type", "extra", 1, "text-lg"], ["name", "chvx"], [1, "mt-2", "w-60", "bg-faint", "!rounded-base", "p-2.5", "max-h-[420px]"], [4, "ngFor", "ngForOf"], [1, "flex", "items-center", "w-full", "gap-2", "group", "h-8.5"], ["type", "button", 1, "flex", "text-xs", "items-center", "gap-2", "px-3", "w-full", "rounded-base", "h-full", "group-hover:bg-reply", "text-left", 3, "click", "keydown.enter", "keydown.space"], [1, "text-xs", "text-white", "whitespace-nowrap", "flex", "gap-2.5", "items-center"], ["type", "button", 1, "cursor-pointer", "min-h-8.5", "min-w-8.5", "rounded-base", "flex", "items-center", "justify-center", "bg-white", "text-blue-on", "text-xs", 3, "click", "keydown.enter", "keydown.space"], [3, "name", "type"], [1, "text-xs", "text-white", "whitespace-nowrap"], [1, "w-24", "text-xs", "text-white"], [3, "click", "keydown.enter", "keydown.space", "mode", "addcls"], [1, "text-base", 3, "name", "type"], [3, "click", "keydown.enter", "keydown.space", "mode", "addcls", "matMenuTriggerFor"], [1, "me-8", 3, "click", "keydown.enter", "keydown.space", "mode", "addcls"], [3, "click", "keydown.enter", "keydown.space", "mode", "addcls", "isloading", "loader"], [1, "flex", "items-center", "gap-7", "w-fit"], [1, "text-xs", "text-white"], [3, "click", "keydown.enter", "keydown.space"], ["mode", "white", "addcls", "bg-white/10 hover:bg-white text-white", 3, "click", "keydown.enter", "keydown.space"], [3, "onEvent", "nCaseid", "nSectionid", "jFiles", "jFolders", "nDTaskid"]], template: function ActionbarComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 15);
        \u0275\u0275template(1, ActionbarComponent_ng_container_1_Template, 12, 14, "ng-container", 16)(2, ActionbarComponent_ng_template_2_Template, 11, 9, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
        \u0275\u0275elementEnd();
        \u0275\u0275template(4, ActionbarComponent_ng_container_4_Template, 2, 5, "ng-container", 17);
      }
      if (rf & 2) {
        const confirmationTpl_r37 = \u0275\u0275reference(3);
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction5(4, _c02, !ctx.isdownload, ctx.isdownload, ctx.isadmin, !ctx.isadmin, ctx.ACTIONBAR_ACTIONTYPE_GROUPS.CB_ONLY.includes(ctx.actiontype)));
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", !ctx.confirmation)("ngIfElse", confirmationTpl_r37);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.isdownload && ctx.showList);
      }
    }, dependencies: [ButtonComponent, IconComponent, CommonModule, NgClass, NgForOf, NgIf, MatMenuModule, MatMenu, MatMenuTrigger, DownloadtableComponent, TranslateModule, TranslatePipe] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ActionbarComponent, { className: "ActionbarComponent", filePath: "src\\app\\shared\\components\\actionbar\\actionbar.component.ts", lineNumber: 85 });
})();

export {
  DndDraggableDirective,
  DndPlaceholderRefDirective,
  DndDropzoneDirective,
  DndHandleDirective,
  ACTIONBAR_EVENTS,
  ACTIONBAR_ACTION_TYPES,
  ACTIONBAR_BUTTONS,
  ActionbarComponent
};
//# sourceMappingURL=chunk-CUTGMSE4.js.map
