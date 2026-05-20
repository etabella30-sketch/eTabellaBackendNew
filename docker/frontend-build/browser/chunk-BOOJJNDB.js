import {
  CommonModule,
  NgForOf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  EventEmitter,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/color-slider/color-slider.component.ts
var _c0 = ["canvas"];
var _c1 = (a0, a1) => ({ "top": a0, "background": a1 });
var ColorSliderComponent = class _ColorSliderComponent {
  constructor() {
    this.color = new EventEmitter();
    this.mousedown = false;
  }
  ngAfterViewInit() {
    this.draw();
    var mdl = { "offsetX": 7, "offsetY": 13 };
    this.onMouseDown(mdl);
    this.onMouseMove(mdl);
    this.mousedown = false;
  }
  draw() {
    if (this.canvas) {
      if (!this.ctx) {
        this.ctx = this.canvas.nativeElement.getContext("2d");
      }
      const width = this.canvas.nativeElement.width;
      const height = this.canvas.nativeElement.height;
      this.ctx.clearRect(0, 0, width, height);
      const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(255, 0, 0, 1)");
      gradient.addColorStop(0.17, "rgba(255, 255, 0, 1)");
      gradient.addColorStop(0.34, "rgba(0, 255, 0, 1)");
      gradient.addColorStop(0.51, "rgba(0, 255, 255, 1)");
      gradient.addColorStop(0.68, "rgba(0, 0, 255, 1)");
      gradient.addColorStop(0.85, "rgba(255, 0, 255, 1)");
      gradient.addColorStop(1, "rgba(255, 0, 0, 1)");
      this.ctx.beginPath();
      this.ctx.rect(0, 0, width, height);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      this.ctx.closePath();
      if (this.selectedHeight) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "transparent";
        this.ctx.lineWidth = 0;
        this.ctx.fillStyle = "red";
        this.ctx.rect(0, this.selectedHeight - 5, width, 10);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.shadowColor = "#0000006b";
        this.ctx.shadowBlur = 9.40318;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 2.82096;
      }
    }
  }
  onMouseUp(evt) {
    this.mousedown = false;
  }
  onMouseDown(evt) {
    this.mousedown = true;
    this.selectedHeight = evt.offsetY;
    this.draw();
    this.client_x = evt.offsetX;
    this.client_y = evt.offsetY;
    this.emitColor(evt.offsetX, evt.offsetY);
  }
  onMouseMove(evt) {
    if (this.mousedown) {
      this.selectedHeight = evt.offsetY;
      this.draw();
      this.client_x = evt.offsetX;
      this.client_y = evt.offsetY;
      this.emitColor(evt.offsetX, evt.offsetY);
    }
  }
  emitColor(x, y) {
    const rgbaColor = this.getColorAtPosition(x, y);
    this.crclr = rgbaColor;
    this.color.emit(rgbaColor);
  }
  getColorAtPosition(x, y) {
    const imageData = this.ctx.getImageData(x, y, 1, 1).data;
    return "rgba(" + imageData[0] + "," + imageData[1] + "," + imageData[2] + ",1)";
  }
  onbarselect() {
    var mdl = { offsetX: this.client_x, offsetY: this.client_y };
    this.onMouseDown(mdl);
  }
  getPositionFromColor(ctx, color) {
    var w = ctx.canvas.width, h = ctx.canvas.height, data = ctx.getImageData(0, 0, w, h), buffer = data.data, len = buffer.length, x, y = 0, p, px;
    for (; y < h; y++) {
      p = y * 4 * w;
      for (x = 0; x < w; x++) {
        px = p + x * 4;
        if (buffer[px] === color[0]) {
          if (buffer[px + 1] === color[1] && buffer[px + 2] === color[2]) {
            return [x, y];
          }
        }
      }
    }
    return null;
  }
  static {
    this.\u0275fac = function ColorSliderComponent_Factory(t) {
      return new (t || _ColorSliderComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ColorSliderComponent, selectors: [["color-slider"]], viewQuery: function ColorSliderComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.canvas = _t.first);
      }
    }, hostBindings: function ColorSliderComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("mouseup", function ColorSliderComponent_mouseup_HostBindingHandler($event) {
          return ctx.onMouseUp($event);
        }, false, \u0275\u0275resolveWindow);
      }
    }, outputs: { color: "color" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 5, vars: 4, consts: [["canvas", ""], [1, "relative", "rounded-2xl", "w-5", "max-w-5", "h-full"], [1, "background-wraper", "rounded-full", "overflow-hidden", "shadow-[0px_2px_9px_#94949440]", "border-2", "border-white", "cursor-grab"], ["width", "22", "height", "270", 1, "color-slider", "blur-[8px]", 3, "mousedown", "mousemove"], [1, "h-3", "w-8", "block", "absolute", "shadow-[0px_2px_9px_#94949440]", "border-2", "border-white", "-mt-1.5", "rounded-lg", "-ml-1.5", "cursor-grab", "active:cursor-grabbing", 3, "mousedown", "ngStyle"]], template: function ColorSliderComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "canvas", 3, 0);
        \u0275\u0275listener("mousedown", function ColorSliderComponent_Template_canvas_mousedown_2_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseDown($event));
        })("mousemove", function ColorSliderComponent_Template_canvas_mousemove_2_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseMove($event));
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "span", 4);
        \u0275\u0275listener("mousedown", function ColorSliderComponent_Template_span_mousedown_4_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onbarselect());
        });
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(4);
        \u0275\u0275property("ngStyle", \u0275\u0275pureFunction2(1, _c1, ctx.client_y + "px", ctx.crclr));
      }
    }, dependencies: [CommonModule, NgStyle], styles: ['\n\n.color-palette[_ngcontent-%COMP%]:hover {\n  cursor: pointer;\n}\n.overlay[_ngcontent-%COMP%] {\n  content: "";\n  background:\n    linear-gradient(\n      268deg,\n      white,\n      transparent);\n  width: 100%;\n  height: 100%;\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n}\n/*# sourceMappingURL=color-slider.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ColorSliderComponent, { className: "ColorSliderComponent", filePath: "src\\app\\shared\\components\\color-slider\\color-slider.component.ts", lineNumber: 11 });
})();

// src/app/shared/components/color-palette/color-palette.component.ts
var _c02 = ["canvas"];
var ColorPaletteComponent = class _ColorPaletteComponent {
  constructor() {
    this.color = new EventEmitter(true);
    this.mousedown = false;
  }
  ngAfterViewInit() {
    this.draw();
    var mdl = { "offsetX": 242, "offsetY": 4 };
    this.onMouseDown(mdl);
    this.onMouseMove(mdl);
    this.mousedown = false;
  }
  draw() {
    if (this.canvas) {
      if (!this.ctx) {
        this.ctx = this.canvas.nativeElement.getContext("2d");
      }
      const width = this.canvas.nativeElement.width;
      const height = this.canvas.nativeElement.height;
      this.ctx.fillStyle = this.hue || "rgba(255,255,255,1)";
      this.ctx.fillRect(0, 0, width, height);
      const whiteGrad = this.ctx.createLinearGradient(80, -160, width + 100, 0);
      whiteGrad.addColorStop(0, "rgba(255,255,255,1)");
      whiteGrad.addColorStop(1, "rgba(255,255,255,0)");
      this.ctx.fillStyle = whiteGrad;
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.filter;
      if (this.selectedPosition) {
        this.ctx.strokeStyle = "white";
        this.ctx.fillStyle = "white";
        this.ctx.shadowColor = "#0000006b";
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.beginPath();
        this.ctx.arc(this.selectedPosition.x, this.selectedPosition.y, 8, 0, 2 * Math.PI);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    }
  }
  ngOnChanges(changes) {
    if (changes["hue"]) {
      this.draw();
      const pos = this.selectedPosition;
      if (pos) {
        this.color.emit(this.getColorAtPosition(pos.x, pos.y));
      }
    }
  }
  onMouseUp(evt) {
    this.mousedown = false;
  }
  onMouseDown(evt) {
    const width = this.canvas.nativeElement.width;
    const height = this.canvas.nativeElement.height;
    const x = Math.max(0, Math.min(width - 1, evt.offsetX));
    const y = Math.max(0, Math.min(height - 1, evt.offsetY));
    this.mousedown = true;
    this.selectedPosition = { x, y };
    this.draw();
    if (y > 295 || x > 295) {
      return;
    }
    this.color.emit(this.getColorAtPosition(x, y));
  }
  onMouseMove(evt) {
    if (this.mousedown) {
      const width = this.canvas.nativeElement.width;
      const height = this.canvas.nativeElement.height;
      const x = Math.max(0, Math.min(width - 1, evt.offsetX));
      const y = Math.max(0, Math.min(height - 1, evt.offsetY));
      this.selectedPosition = { x, y };
      this.draw();
      if (y > 295 || x > 295) {
        return;
      }
      this.emitColor(x, y);
    }
  }
  emitColor(x, y) {
    const rgbaColor = this.getColorAtPosition(x, y);
    this.color.emit(rgbaColor);
  }
  getColorAtPosition(x, y) {
    const width = this.canvas.nativeElement.width;
    const height = this.canvas.nativeElement.height;
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    const imageData = this.ctx.getImageData(x, y, 1, 1).data;
    return "rgba(" + imageData[0] + "," + imageData[1] + "," + imageData[2] + ",1)";
  }
  hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace(/#/g, "").substring(0, 6));
    return result ? {
      // s: (parseInt(result[0], 16) / 255),
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  getPositionFromColor(ctx, color) {
    var w = ctx.canvas.width, h = ctx.canvas.height, data = ctx.getImageData(0, 0, w, h), buffer = data.data, len = buffer.length, x, y = 0, p, px;
    for (; y < h; y++) {
      p = y * 4 * w;
      for (x = 0; x < w; x++) {
        px = p + x * 4;
        if (buffer[px] === color[1] && buffer[px] === color[2]) {
          return [x, y];
        }
      }
    }
    return null;
  }
  static {
    this.\u0275fac = function ColorPaletteComponent_Factory(t) {
      return new (t || _ColorPaletteComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ColorPaletteComponent, selectors: [["color-palette"]], viewQuery: function ColorPaletteComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c02, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.canvas = _t.first);
      }
    }, hostBindings: function ColorPaletteComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("mouseup", function ColorPaletteComponent_mouseup_HostBindingHandler($event) {
          return ctx.onMouseUp($event);
        }, false, \u0275\u0275resolveWindow);
      }
    }, inputs: { hue: "hue" }, outputs: { color: "color" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 2, vars: 0, consts: [["canvas", ""], ["height", "265", 1, "color-palette", 3, "mousedown", "mousemove"]], template: function ColorPaletteComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "canvas", 1, 0);
        \u0275\u0275listener("mousedown", function ColorPaletteComponent_Template_canvas_mousedown_0_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseDown($event));
        })("mousemove", function ColorPaletteComponent_Template_canvas_mousemove_0_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseMove($event));
        });
        \u0275\u0275elementEnd();
      }
    }, dependencies: [CommonModule], styles: ["\n\n.color-palette[_ngcontent-%COMP%]:hover {\n  cursor: pointer;\n}\n[_nghost-%COMP%] {\n  width: 100%;\n  height: 100%;\n  display: block;\n}\ncanvas[_ngcontent-%COMP%] {\n  width: 100%;\n  cursor: default;\n}\ncanvas[_ngcontent-%COMP%]:active {\n  cursor: none !important;\n}\n/*# sourceMappingURL=color-palette.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ColorPaletteComponent, { className: "ColorPaletteComponent", filePath: "src\\app\\shared\\components\\color-palette\\color-palette.component.ts", lineNumber: 22 });
})();

// src/app/shared/components/colorpicker/colorpicker.component.ts
var _c03 = (a0) => ({ "background-color": a0 });
var _c12 = (a0) => ({ "background": a0 });
function ColorpickerComponent_span_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 10);
    \u0275\u0275listener("click", function ColorpickerComponent_span_10_Template_span_click_0_listener() {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectClr(x_r2.cClr));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(1, _c12, x_r2.cClr));
  }
}
var ColorpickerComponent = class _ColorpickerComponent {
  constructor() {
    this.myColorChange = new EventEmitter();
    this.onClose = new EventEmitter();
  }
  ngOnInit() {
    this.color = this.myColor;
    this.hue = this.myColor;
  }
  ngAfterViewInit() {
    this.color = this.myColor;
    this.hue = this.myColor;
  }
  onclr(e) {
    this.color = this.rgba2hex(e);
    this.myColor = this.color;
    this.myColorChange.emit(this.myColor);
  }
  rgba2hex(orig) {
    var a, isPercent, rgb = orig.replace(/\s/g, "").match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i), alpha = (rgb && rgb[4] || "").trim(), hex = rgb ? (rgb[1] | 1 << 8).toString(16).slice(1) + (rgb[2] | 1 << 8).toString(16).slice(1) + (rgb[3] | 1 << 8).toString(16).slice(1) : orig;
    if (alpha !== "") {
      a = alpha;
    } else {
      a = 1;
    }
    a = (a * 255 | 1 << 8).toString(16).slice(1);
    hex = hex + a;
    return "#" + hex;
  }
  // Helper to convert hex to RGBA string
  hexToRgba(hex) {
    hex = hex.replace("#", "");
    let r = 0, g = 0, b = 0, a = 1;
    if (hex.length === 8) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      a = parseInt(hex.substring(6, 8), 16) / 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    return `rgba(${r},${g},${b},${a})`;
  }
  ngOnDestroy() {
    this.onClose.emit("CLOSE");
  }
  selectClr(cClr) {
    this.color = cClr;
    this.hue = this.hexToRgba(cClr);
  }
  static {
    this.\u0275fac = function ColorpickerComponent_Factory(t) {
      return new (t || _ColorpickerComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ColorpickerComponent, selectors: [["app-colorpicker"]], inputs: { colorslist: "colorslist", myColor: "myColor" }, outputs: { myColorChange: "myColorChange", onClose: "onClose" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 11, vars: 6, consts: [[1, "p-2.5"], [1, "flex", "h-fit"], [3, "color", "hue"], [2, "margin-left", "16px", 3, "color"], [1, "flex", "mt-4"], [1, "flex", "items-center", "gap-2.5", "w-fit", "bg-white", "border-none", "justify-center", "rounded-lg", "border", "border-white", "p-2", "h-fit"], [1, "rounded-none", "size-8", 3, "ngStyle"], [1, "text-xs"], [1, "flex", "items-center", "flex-wrap", "ml-2.5", "gap-2", "p-2"], ["class", "size-4 block  border-2 border-white", 3, "ngStyle", "click", 4, "ngFor", "ngForOf"], [1, "size-4", "block", "border-2", "border-white", 3, "click", "ngStyle"]], template: function ColorpickerComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "color-palette", 2);
        \u0275\u0275listener("color", function ColorpickerComponent_Template_color_palette_color_2_listener($event) {
          return ctx.onclr($event);
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(3, "color-slider", 3);
        \u0275\u0275listener("color", function ColorpickerComponent_Template_color_slider_color_3_listener($event) {
          return ctx.hue = $event;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "div", 4)(5, "div", 5);
        \u0275\u0275element(6, "div", 6);
        \u0275\u0275elementStart(7, "span", 7);
        \u0275\u0275text(8);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(9, "div", 8);
        \u0275\u0275template(10, ColorpickerComponent_span_10_Template, 1, 3, "span", 9);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275property("hue", ctx.hue);
        \u0275\u0275advance(4);
        \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(4, _c03, ctx.color || "white"));
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1("", ctx.color, " sdf");
        \u0275\u0275advance(2);
        \u0275\u0275property("ngForOf", ctx.colorslist);
      }
    }, dependencies: [CommonModule, NgForOf, NgStyle, ColorSliderComponent, ColorPaletteComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ColorpickerComponent, { className: "ColorpickerComponent", filePath: "src\\app\\shared\\components\\colorpicker\\colorpicker.component.ts", lineNumber: 13 });
})();

export {
  ColorpickerComponent
};
//# sourceMappingURL=chunk-BOOJJNDB.js.map
