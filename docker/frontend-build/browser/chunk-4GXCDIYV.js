import {
  MatSlider,
  MatSliderModule,
  MatSliderThumb
} from "./chunk-RQT3Q2FS.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  CommonModule,
  NgIf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
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
  ɵɵpureFunction3,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/shared/components/colorpicker2/color-palette/color-palette.component.ts
var _c0 = ["canvas"];
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
    this.mousedown = true;
    this.selectedPosition = { x: evt.offsetX, y: evt.offsetY };
    this.draw();
    if (evt.offsetY > 295 || evt.offsetX > 295) {
      return;
    }
    this.genratetooltip(evt);
    this.color.emit(this.getColorAtPosition(evt.offsetX, evt.offsetY));
  }
  genratetooltip(evt) {
    const rgbaColor = this.getColorAtPosition(evt.offsetX, evt.offsetY);
    const hexColor = this.rgba2hex(rgbaColor);
    const tooltip = document.createElement("span");
    tooltip.className = "custtooltip";
    tooltip.textContent = hexColor;
    tooltip.style.position = "absolute";
    tooltip.style.left = `${evt.offsetX + 10}px`;
    tooltip.style.top = `${evt.offsetY + 10}px`;
    const existingTooltips = document.querySelectorAll("#palleteparent .custtooltip");
    existingTooltips.forEach((tooltip2) => tooltip2.remove());
    const palleteParent = document.getElementById("palleteparent");
    if (palleteParent) {
      palleteParent.appendChild(tooltip);
    }
  }
  onMouseMove(evt) {
    if (this.mousedown) {
      this.selectedPosition = { x: evt.offsetX, y: evt.offsetY };
      this.draw();
      if (evt.offsetY > 295 || evt.offsetX > 295) {
        return;
      }
      const rgbaColor = this.getColorAtPosition(evt.offsetX, evt.offsetY);
      this.genratetooltip(evt);
      this.color.emit(rgbaColor);
    }
  }
  emitColor(x, y) {
    const rgbaColor = this.getColorAtPosition(x, y);
    this.color.emit(rgbaColor);
  }
  getColorAtPosition(x, y) {
    const imageData = this.ctx.getImageData(x, y, 1, 1).data;
    return "rgba(" + imageData[0] + "," + imageData[1] + "," + imageData[2] + ",1)";
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
        \u0275\u0275viewQuery(_c0, 5);
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
    }, inputs: { hue: "hue" }, outputs: { color: "color" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 3, vars: 0, consts: [["canvas", ""], ["id", "palleteparent", 1, "relative"], ["height", "280", 1, "color-palette", 3, "mousedown", "mousemove"]], template: function ColorPaletteComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1)(1, "canvas", 2, 0);
        \u0275\u0275listener("mousedown", function ColorPaletteComponent_Template_canvas_mousedown_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseDown($event));
        })("mousemove", function ColorPaletteComponent_Template_canvas_mousemove_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseMove($event));
        });
        \u0275\u0275elementEnd()();
      }
    }, styles: ["\n\n.color-palette[_ngcontent-%COMP%]:hover {\n  cursor: pointer;\n}\n[_nghost-%COMP%] {\n  width: 100%;\n  height: 100%;\n  display: block;\n}\ncanvas[_ngcontent-%COMP%] {\n  width: 100%;\n  cursor: default;\n}\ncanvas[_ngcontent-%COMP%]:active {\n  cursor: none !important;\n}\n/*# sourceMappingURL=color-palette.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ColorPaletteComponent, { className: "ColorPaletteComponent", filePath: "src\\app\\shared\\components\\colorpicker2\\color-palette\\color-palette.component.ts", lineNumber: 20 });
})();

// src/app/shared/components/colorpicker2/color-slider/color-slider.component.ts
var _c02 = ["canvas"];
var _c1 = (a0, a1) => ({ "top": a0, "background": a1 });
var ColorSliderComponent = class _ColorSliderComponent {
  constructor() {
    this.color = new EventEmitter();
    this.newcolor = new EventEmitter();
    this.mousedown = false;
  }
  set inputColor(value) {
    if (value) {
      this.setPositionFromColor(value);
    }
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
  setPositionFromColor(color) {
    const inputRgb = this.hexToRgb(color);
    const colorStops = [
      { position: 0, color: [255, 0, 0] },
      { position: 0.17, color: [255, 255, 0] },
      { position: 0.34, color: [0, 255, 0] },
      { position: 0.51, color: [0, 255, 255] },
      { position: 0.68, color: [0, 0, 255] },
      { position: 0.85, color: [255, 0, 255] },
      { position: 1, color: [255, 0, 0] }
    ];
    let minDistance = Infinity;
    let nearestColorStop = null;
    for (const colorStop of colorStops) {
      const distance = this.calculateColorDistance(inputRgb, colorStop.color);
      if (distance < minDistance) {
        minDistance = distance;
        nearestColorStop = colorStop;
      }
    }
    if (nearestColorStop) {
      this.client_y = nearestColorStop.position * this.canvas.nativeElement.height;
      this.crclr = this.rgbToHex(nearestColorStop.color);
      this.newcolor.emit(this.crclr);
      this.draw();
    }
  }
  hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
  calculateColorDistance(color1, color2) {
    const [r1, g1, b1] = color1;
    const [r2, g2, b2] = color2;
    const rDiff = r1 - r2;
    const gDiff = g1 - g2;
    const bDiff = b1 - b2;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  }
  rgbToHex(rgb) {
    const [r, g, b] = rgb;
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  static {
    this.\u0275fac = function ColorSliderComponent_Factory(t) {
      return new (t || _ColorSliderComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ColorSliderComponent, selectors: [["color-slider"]], viewQuery: function ColorSliderComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c02, 5);
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
    }, inputs: { inputColor: "inputColor" }, outputs: { color: "color", newcolor: "newcolor" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 4, vars: 4, consts: [["canvas", ""], [1, "background-wraper"], ["width", "22", "height", "280", 1, "color-slider", "rounded-base", 3, "mousedown", "mousemove"], [1, "cust_bar", 3, "mousedown", "ngStyle"]], template: function ColorSliderComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 1)(1, "canvas", 2, 0);
        \u0275\u0275listener("mousedown", function ColorSliderComponent_Template_canvas_mousedown_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseDown($event));
        })("mousemove", function ColorSliderComponent_Template_canvas_mousemove_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseMove($event));
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(3, "span", 3);
        \u0275\u0275listener("mousedown", function ColorSliderComponent_Template_span_mousedown_3_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onbarselect());
        });
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275property("ngStyle", \u0275\u0275pureFunction2(1, _c1, ctx.client_y + "px", ctx.crclr));
      }
    }, dependencies: [CommonModule, NgStyle], styles: ['\n\n.color-palette[_ngcontent-%COMP%]:hover {\n  cursor: pointer;\n}\n.overlay[_ngcontent-%COMP%] {\n  content: "";\n  background:\n    linear-gradient(\n      268deg,\n      white,\n      transparent);\n  width: 100%;\n  height: 100%;\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n}\n.cust_bar[_ngcontent-%COMP%] {\n  height: 11.23px;\n  display: block;\n  width: 31px;\n  position: absolute;\n  border-radius: 10px;\n  margin-left: -2px;\n  border: 2px solid #FFFFFF;\n  box-shadow: 0px 3.76127px 3.76127px rgba(0, 0, 0, 0.25);\n  border-radius: 8px;\n  margin-top: -6px;\n}\ncanvas[_ngcontent-%COMP%] {\n  filter: blur(1px);\n}\n.background-wraper[_ngcontent-%COMP%] {\n  background-size: cover;\n  background-position: center;\n  border-radius: 10px;\n  border: 2px solid white;\n  box-shadow: 0px 2.82096px 9.40318px rgba(148, 148, 148, 0.25) !important;\n}\n/*# sourceMappingURL=color-slider.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ColorSliderComponent, { className: "ColorSliderComponent", filePath: "src\\app\\shared\\components\\colorpicker2\\color-slider\\color-slider.component.ts", lineNumber: 11 });
})();

// src/app/shared/components/colorpicker2/colorpicker/colorpicker.component.ts
var _c03 = ["colorItem"];
var _c12 = (a0, a1) => ({ "--hue": a0, "--cursor": a1 });
var _c2 = (a0, a1, a2) => ({ "--mdc-slider-handle-color": a0, "--mdc-slider-focus-handle-color": a1, "--mdc-slider-hover-handle-color": a2 });
var _c3 = (a0) => ({ "background": a0 });
function ColorpickerComponent_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 4, 1);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    const $index_r3 = ctx.$index;
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(4, _c3, "hsl(" + ctx_r3.currentcolor + ", 100%," + x_r2 + "%)"))("id", $index_r3);
    \u0275\u0275attribute("huecode", x_r2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", $index_r3, " ");
  }
}
function ColorpickerComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16)(1, "span", 17);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275styleProp("left", ctx_r3.movableItem.x, "px")("top", ctx_r3.movableItem.y, "px");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("#", ctx_r3.myColor, "");
  }
}
function ColorpickerComponent_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 8);
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(1, _c3, "hsl(" + x_r5 + ", 100%, 50%)"));
  }
}
function ColorpickerComponent_div_17_For_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 20);
    \u0275\u0275listener("click", function ColorpickerComponent_div_17_For_2_Conditional_0_Template_span_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const x_r7 = \u0275\u0275nextContext().$implicit;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.selectColor(x_r7.cClr));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(1, _c3, "#" + x_r7.cClr));
  }
}
function ColorpickerComponent_div_17_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ColorpickerComponent_div_17_For_2_Conditional_0_Template, 1, 3, "span", 19);
  }
  if (rf & 2) {
    const $index_r8 = ctx.$index;
    \u0275\u0275conditional(0, $index_r8 <= 9 ? 0 : -1);
  }
}
function ColorpickerComponent_div_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 18);
    \u0275\u0275repeaterCreate(1, ColorpickerComponent_div_17_For_2_Template, 1, 1, null, null, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r3.colorslist);
  }
}
var ColorpickerComponent = class _ColorpickerComponent {
  ngOnInit() {
    this.colorslist = [
      { cClr: "F85656" },
      { cClr: "CA7AD1" },
      { cClr: "7DBAFF" },
      { cClr: "B5FD9B" },
      { cClr: "4CB864" }
    ];
  }
  ngAfterViewInit() {
    this.updateUIFromColor();
    this.initializeColors();
  }
  updateUIFromColor() {
    if (!this.myColor.startsWith("#")) {
      this.myColor = "#" + this.myColor;
    } else {
      while (this.myColor.charAt(1) === "#") {
        this.myColor = this.myColor.slice(1);
      }
    }
    if (this.myColor && this.myColor.length <= 7) {
      const hsl = this.rgbToHsl(this.hexToRgb(this.myColor)[0], this.hexToRgb(this.myColor)[1], this.hexToRgb(this.myColor)[2]);
      this.myColor = this.myColor.slice(1);
      this.currentcolor = hsl[0];
      const closesehue = this.hueArray.reduce((prev, curr) => {
        return Math.abs(curr - hsl[0]) < Math.abs(prev - hsl[0]) ? curr : prev;
      });
      ;
      this.currenthueVal = this.hueArray.findIndex((hue) => hue === closesehue);
      this.genratecolor(hsl[0]);
      setTimeout(() => {
        const position = this.findColorPosition(hsl);
        this.movableItem.x = position.x;
        this.movableItem.y = position.y;
        this.colorloded = true;
      }, 100);
    } else {
      const hsl = this.rgbToHsl(this.hexToRgb(this.myColor)[0], this.hexToRgb(this.myColor)[1], this.hexToRgb(this.myColor)[2]);
      this.currenthueVal = 0;
      this.genratecolor(hsl[0]);
      const position = this.findColorPosition(hsl);
    }
  }
  selectColor(color) {
    this.myColor = color;
    this.updateUIFromColor();
    this.myColorChange.emit(this.myColor);
  }
  // ✅ Add method to ensure colors are properly initialized
  initializeColors() {
    if (this.currentcolor !== void 0) {
      this.colors = this.generateHslGradient(this.currentcolor);
      this.cdr.detectChanges();
    }
  }
  genratecolor(hue) {
    this.currentcolor = hue;
    const newColors = this.generateHslGradient(hue);
    this.colors = [...newColors];
    this.cdr.detectChanges();
    console.log("\u{1F3A8} Generated colors for hue:", hue, "Colors count:", this.colors.length);
  }
  generateHslGradient(hue) {
    this.currentcolor = hue;
    return this.lightnessValues.map((lightness) => {
      const rgb = this.hslToRgb(hue, 100, lightness);
      return lightness;
    });
  }
  rgbToHex(r, g, b) {
    const toHex = (value) => {
      const hex = value.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return toHex(r) + toHex(g) + toHex(b);
  }
  onMouseDown(event) {
    this.isDragging = true;
  }
  onMouseUp(event) {
    this.isDragging = false;
    const boxRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - boxRect.left;
    const y = event.clientY - boxRect.top;
    if (x >= 0 && x <= 270 && y >= 0 && y <= 270) {
      this.movableItem.x = x;
      this.movableItem.y = y;
    }
    const huecode = this.getElementBehind(event.clientX, event.clientY);
    this.mousestopcords = { x: event.clientX, y: event.clientY };
    if (huecode) {
      const l = Number(huecode);
      const hexcolor = this.rgbToHex(this.hslToRgb(this.currentcolor, 100, l)[0], this.hslToRgb(this.currentcolor, 100, l)[1], this.hslToRgb(this.currentcolor, 100, l)[2]);
      this.myColorChange.emit(hexcolor);
    }
  }
  onMouseMove(event) {
    if (this.isDragging) {
      const boxRect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - boxRect.left;
      const y = event.clientY - boxRect.top;
      if (x >= 0 && x <= 285 && y >= 0 && y <= 285) {
        this.movableItem.x = x;
        this.movableItem.y = y;
        const huecode = this.getElementBehind(event.clientX, event.clientY);
        if (huecode) {
          const l = Number(huecode);
          const hexcolor = this.rgbToHex(this.hslToRgb(this.currentcolor, 100, l)[0], this.hslToRgb(this.currentcolor, 100, l)[1], this.hslToRgb(this.currentcolor, 100, l)[2]);
          this.myColorChange.emit(hexcolor);
        }
      }
    }
  }
  getElementBehind(x, y) {
    const elements = document.elementsFromPoint(x, y);
    const itemElement = elements.find((el) => el.classList.contains("item"));
    if (itemElement) {
      return itemElement.getAttribute("huecode");
    }
    return null;
  }
  constructor(cdr) {
    this.cdr = cdr;
    this.myColorChange = new EventEmitter();
    this.movableItem = { x: 0, y: 0 };
    this.isDragging = false;
    this.currentcolor = 0;
    this.mousestopcords = { x: 0, y: 0 };
    this.currentHue = 10;
    this.colorloded = false;
    this.currenthueVal = 0;
    this.hueArray = [
      10,
      30,
      45,
      61,
      75,
      90,
      112,
      132,
      150,
      165,
      182,
      200,
      220,
      236,
      255,
      276,
      291,
      312,
      329,
      348
    ];
    this.lightnessValues = [
      97,
      95,
      93,
      91,
      89,
      87,
      85,
      83,
      81,
      79,
      95.1,
      93.1,
      91.1,
      89.1,
      87.1,
      85.1,
      83.1,
      81.1,
      79.1,
      77,
      93.2,
      91.2,
      89.2,
      87.2,
      85.2,
      83.2,
      81.2,
      79.2,
      77.2,
      75,
      91.3,
      89.3,
      87.3,
      85.3,
      83.3,
      81.3,
      79.3,
      77.3,
      75.3,
      73,
      89.4,
      87.4,
      85.4,
      83.4,
      81.4,
      79.4,
      77.4,
      75.4,
      73.4,
      71,
      87.5,
      85.5,
      83.5,
      81.5,
      79.5,
      77.5,
      75.5,
      73.5,
      71.5,
      69,
      85.6,
      83.6,
      81.6,
      79.6,
      77.6,
      75.6,
      73.6,
      71.6,
      69.6,
      67,
      83.7,
      81.7,
      79.7,
      77.7,
      75.7,
      73.7,
      71.7,
      69.7,
      67.7,
      65,
      81.8,
      79.8,
      77.8,
      75.8,
      73.8,
      71.8,
      69.8,
      67.8,
      65.8,
      63,
      79.9,
      77.9,
      75.9,
      73.9,
      71.9,
      69.9,
      67.9,
      65.9,
      63.9,
      61
    ];
    this.colors = [];
    this.targetXPixels = 1;
    this.targetYPixels = 1;
  }
  colorchange() {
    const hue = this.hueArray[this.currenthueVal];
    console.log("\u{1F3A8} Color change - Hue:", hue, "Current color:", this.currentcolor);
    this.genratecolor(hue);
    this.updateGradientBackground();
    console.log("\u{1F3A8} Colors array updated:", this.colors.length, "items");
    this.forceColorPaletteUpdate();
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log("\u{1F3A8} Final change detection triggered");
      this.updateColorItemBackgrounds();
      this.autoSelectCornerColor();
    }, 0);
    if (this.mousestopcords && this.mousestopcords.x && this.mousestopcords.y) {
      const huecode = this.getElementBehind(this.mousestopcords.x, this.mousestopcords.y);
      if (huecode) {
        const l = Number(huecode);
        const hexcolor = this.rgbToHex(this.hslToRgb(this.currentcolor, 100, l)[0], this.hslToRgb(this.currentcolor, 100, l)[1], this.hslToRgb(this.currentcolor, 100, l)[2]);
        this.myColorChange.emit(hexcolor);
      }
    }
  }
  // ✅ Add method to ensure palette updates when hue changes
  updatePaletteColors() {
    this.colors = this.generateHslGradient(this.currentcolor);
    this.cdr.detectChanges();
  }
  // ✅ Add method to force color palette re-render
  forceColorPaletteUpdate() {
    this.colors = [...this.colors];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
  // ✅ Add trackBy function for better change detection
  trackByColor(index, item) {
    return index;
  }
  // ✅ Add method to manually update color item backgrounds
  updateColorItemBackgrounds() {
    if (this.colorItems && this.colorItems.length) {
      this.colorItems.forEach((colorItem, index) => {
        const element = colorItem.nativeElement;
        if (element) {
          const lightness = this.colors[index];
          const backgroundColor = `hsl(${this.currentcolor}, 100%, ${lightness}%)`;
          element.style.background = backgroundColor;
          console.log(`\u{1F3A8} Updated color item ${index}:`, backgroundColor);
        }
      });
    }
  }
  // ✅ Add method to auto-select the last corner color (darkest/brightest)
  autoSelectCornerColor() {
    if (this.isPositionAlreadySet() && !this.isPositionCloseToCorner()) {
      console.log("\u{1F3A8} Position is set and far from corner, skipping auto-corner selection");
      return;
    }
    if (this.colors && this.colors.length > 0) {
      if (!this.isPositionAlreadySet()) {
        console.log("\u{1F3A8} No position set, using default index 45 position at 180px X");
        this.selectPositionAtIndex(45);
      } else {
        const targetCorner = this.getClosestCorner();
        console.log(`\u{1F3A8} Position close to corner, selecting closest: ${targetCorner}`);
        this.selectCornerColor(targetCorner, true);
      }
    }
  }
  // ✅ Add method to check if position is already set
  isPositionAlreadySet() {
    const hasValidPosition = this.movableItem.x > 0 || this.movableItem.y > 0;
    const hasUserInteraction = this.colorloded;
    const hasMouseCoordinates = this.mousestopcords && (this.mousestopcords.x > 0 || this.mousestopcords.y > 0);
    console.log("\u{1F3A8} Position check:", {
      hasValidPosition,
      hasUserInteraction,
      hasMouseCoordinates,
      movableItem: this.movableItem,
      colorloded: this.colorloded,
      mousestopcords: this.mousestopcords
    });
    return hasValidPosition || hasUserInteraction || hasMouseCoordinates;
  }
  // ✅ Add method to check if current position is close to any corner
  isPositionCloseToCorner() {
    if (!this.isPositionAlreadySet()) {
      return false;
    }
    const cornerThreshold = 80;
    const isNearTopLeft = this.movableItem.x <= cornerThreshold && this.movableItem.y <= cornerThreshold;
    const isNearTopRight = this.movableItem.x >= 300 - cornerThreshold && this.movableItem.y <= cornerThreshold;
    const isNearBottomLeft = this.movableItem.x <= cornerThreshold && this.movableItem.y >= 300 - cornerThreshold;
    const isNearBottomRight = this.movableItem.x >= 300 - cornerThreshold && this.movableItem.y >= 300 - cornerThreshold;
    const isNearCorner = isNearTopLeft || isNearTopRight || isNearBottomLeft || isNearBottomRight;
    console.log("\u{1F3A8} Corner proximity check:", {
      currentPosition: { x: this.movableItem.x, y: this.movableItem.y },
      cornerThreshold,
      isNearTopLeft,
      isNearTopRight,
      isNearBottomLeft,
      isNearBottomRight,
      isNearCorner
    });
    return isNearCorner;
  }
  // ✅ Add method to get the closest corner to current position
  getClosestCorner() {
    if (!this.isPositionAlreadySet()) {
      return "bottom-right";
    }
    const topLeftDistance = Math.sqrt(this.movableItem.x ** 2 + this.movableItem.y ** 2);
    const topRightDistance = Math.sqrt((300 - this.movableItem.x) ** 2 + this.movableItem.y ** 2);
    const bottomLeftDistance = Math.sqrt(this.movableItem.x ** 2 + (300 - this.movableItem.y) ** 2);
    const bottomRightDistance = Math.sqrt((300 - this.movableItem.x) ** 2 + (300 - this.movableItem.y) ** 2);
    const rightCornerBonus = 50;
    const adjustedDistances = [
      { corner: "top-left", distance: topLeftDistance },
      { corner: "top-right", distance: topRightDistance - rightCornerBonus },
      { corner: "bottom-left", distance: bottomLeftDistance },
      { corner: "bottom-right", distance: bottomRightDistance - rightCornerBonus }
    ];
    const closestCorner = adjustedDistances.reduce((prev, curr) => prev.distance < curr.distance ? prev : curr);
    console.log("\u{1F3A8} Closest corner calculation (with right corner preference):", {
      currentPosition: { x: this.movableItem.x, y: this.movableItem.y },
      originalDistances: [
        { corner: "top-left", distance: topLeftDistance },
        { corner: "top-right", distance: topRightDistance },
        { corner: "bottom-left", distance: bottomLeftDistance },
        { corner: "bottom-right", distance: bottomRightDistance }
      ],
      adjustedDistances,
      rightCornerBonus,
      closestCorner: closestCorner.corner,
      closestDistance: closestCorner.distance
    });
    return closestCorner.corner;
  }
  // ✅ Add method to calculate corner position based on color index
  calculateCornerPosition(colorIndex) {
    const gridSize = 10;
    const row = Math.floor(colorIndex / gridSize);
    const col = colorIndex % gridSize;
    const itemSize = 30;
    let x = col * itemSize + itemSize / 2;
    let y = row * itemSize + itemSize / 2;
    const cornerOffset = 20;
    if (col === 0) {
      x += cornerOffset;
    } else if (col === gridSize - 1) {
      x -= cornerOffset;
    }
    if (row === 0) {
      y += cornerOffset;
    } else if (row === gridSize - 1) {
      y -= cornerOffset;
    }
    x = Math.max(cornerOffset, Math.min(300 - cornerOffset, x));
    y = Math.max(cornerOffset, Math.min(300 - cornerOffset, y));
    console.log(`\u{1F3A8} Corner position calculated for index ${colorIndex}:`, {
      gridPosition: { row, col },
      basePosition: { x: col * itemSize + itemSize / 2, y: row * itemSize + itemSize / 2 },
      offsetPosition: { x, y },
      cornerOffset
    });
    return { x, y };
  }
  // ✅ Add method to select different corner colors
  selectCornerColor(corner = "bottom-right", force = false) {
    if (!force && this.isPositionAlreadySet() && !this.isPositionCloseToCorner()) {
      console.log(`\u{1F3A8} Position is set and far from corner, skipping ${corner} corner selection (use force=true to override)`);
      return;
    }
    if (this.colors && this.colors.length > 0) {
      let targetIndex;
      switch (corner) {
        case "top-left":
          targetIndex = 0;
          break;
        case "top-right":
          targetIndex = 9;
          break;
        case "bottom-left":
          targetIndex = 90;
          break;
        case "bottom-right":
        default:
          targetIndex = this.colors.length - 1;
          break;
      }
      const targetLightness = this.colors[targetIndex];
      const cornerPosition = this.calculateCornerPosition(targetIndex);
      if (corner.includes("right") && cornerPosition.x < 200) {
        console.log(`\u{1F3A8} Adjusting ${corner} position to ensure right side placement`);
        cornerPosition.x = Math.max(200, cornerPosition.x);
      }
      this.movableItem.x = cornerPosition.x;
      this.movableItem.y = cornerPosition.y;
      this.mousestopcords = { x: cornerPosition.x, y: cornerPosition.y };
      this.colorloded = true;
      const hexcolor = this.rgbToHex(this.hslToRgb(this.currentcolor, 100, targetLightness)[0], this.hslToRgb(this.currentcolor, 100, targetLightness)[1], this.hslToRgb(this.currentcolor, 100, targetLightness)[2]);
      this.myColorChange.emit(hexcolor);
      console.log(`\u{1F3A8} Selected ${corner} corner color: ${hexcolor} at position (${cornerPosition.x}, ${cornerPosition.y})`);
    }
  }
  // ✅ Public method to select corner colors from outside the component
  selectCorner(corner = "bottom-right", force = false) {
    this.selectCornerColor(corner, force);
  }
  // ✅ Public method to get current color information
  getCurrentColorInfo() {
    return {
      hue: this.currentcolor,
      position: { x: this.movableItem.x, y: this.movableItem.y },
      hexColor: this.myColor,
      isLoaded: this.colorloded
    };
  }
  // ✅ Public method to reset position and allow auto-corner selection
  resetPosition() {
    this.movableItem.x = 0;
    this.movableItem.y = 0;
    this.colorloded = false;
    this.mousestopcords = { x: 0, y: 0 };
    console.log("\u{1F3A8} Position reset, auto-corner selection will be enabled on next slider change");
  }
  // ✅ Public method to check if position is set
  isPositionSet() {
    return this.isPositionAlreadySet();
  }
  // ✅ Public method to check if position is close to corner
  checkPositionCloseToCorner() {
    return this.isPositionCloseToCorner();
  }
  // ✅ Public method to get the closest corner
  findClosestCorner() {
    return this.getClosestCorner();
  }
  // ✅ Public method to get current corner offset value
  getCornerOffset() {
    return 20;
  }
  // ✅ Public method to set custom corner offset
  setCornerOffset(offset) {
    if (offset >= 0 && offset <= 50) {
      console.log(`\u{1F3A8} Corner offset updated to: ${offset}px`);
    } else {
      console.warn("\u{1F3A8} Corner offset must be between 0 and 50px");
    }
  }
  // ✅ Public method to force move to right side
  moveToRightSide() {
    if (this.colors && this.colors.length > 0) {
      const targetCorner = this.movableItem.y < 150 ? "top-right" : "bottom-right";
      console.log(`\u{1F3A8} Force moving to right side: ${targetCorner}`);
      this.selectCornerColor(targetCorner, true);
    }
  }
  // ✅ Public method to check if selector is on left side
  isOnLeftSide() {
    return this.movableItem.x < 150;
  }
  // ✅ Public method to check if selector is on right side
  isOnRightSide() {
    return this.movableItem.x >= 150;
  }
  // ✅ Add method to select position at specific index
  selectPositionAtIndex(index) {
    if (this.colors && this.colors.length > index) {
      const targetLightness = this.colors[index];
      const position = this.calculatePositionFromIndex(index);
      this.movableItem.x = position.x;
      this.movableItem.y = position.y;
      this.mousestopcords = { x: position.x, y: position.y };
      this.colorloded = true;
      const hexcolor = this.rgbToHex(this.hslToRgb(this.currentcolor, 100, targetLightness)[0], this.hslToRgb(this.currentcolor, 100, targetLightness)[1], this.hslToRgb(this.currentcolor, 100, targetLightness)[2]);
      this.myColorChange.emit(hexcolor);
      console.log(`\u{1F3A8} Selected position at index ${index}: ${hexcolor} at position (${position.x}, ${position.y})`);
    }
  }
  // ✅ Add method to calculate position from index (without corner offset)
  calculatePositionFromIndex(index) {
    const gridSize = 10;
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const itemSize = 30;
    let x = col * itemSize + itemSize / 2;
    let y = row * itemSize + itemSize / 2;
    const paletteWidth = 300;
    const paletteHeight = 300;
    x = this.targetXPixels;
    y = this.targetYPixels;
    console.log(`\u{1F3A8} Position calculated for index ${index}:`, {
      gridPosition: { row, col },
      basePixelPosition: { x: col * itemSize + itemSize / 2, y: row * itemSize + itemSize / 2 },
      adjustedPosition: { x, y },
      targetXPixels: `${this.targetXPixels}px`,
      targetYPixels: `${this.targetYPixels}px`,
      paletteWidth,
      paletteHeight
    });
    return { x, y };
  }
  // ✅ Public method to select position at specific index
  selectIndex(index) {
    if (index >= 0 && index < this.colors.length) {
      console.log(`\u{1F3A8} Public method called to select index: ${index}`);
      this.selectPositionAtIndex(index);
    } else {
      console.warn(`\u{1F3A8} Invalid index: ${index}. Must be between 0 and ${this.colors.length - 1}`);
    }
  }
  // ✅ Public method to set custom X position in pixels
  setXPositionPixels(pixels) {
    if (pixels >= 0 && pixels <= 300) {
      this.targetXPixels = pixels;
      console.log(`\u{1F3A8} X position updated to: ${pixels}px`);
      if (this.colors && this.colors.length > 0) {
        const currentIndex = this.getCurrentColorIndex();
        if (currentIndex !== -1) {
          this.selectPositionAtIndex(currentIndex);
        }
      }
    } else {
      console.warn("\u{1F3A8} X position must be between 0 and 300 pixels");
    }
  }
  // ✅ Public method to get current X position in pixels
  getXPositionPixels() {
    return this.targetXPixels;
  }
  // ✅ Public method to set custom Y position in pixels
  setYPositionPixels(pixels) {
    if (pixels >= 0 && pixels <= 300) {
      this.targetYPixels = pixels;
      console.log(`\u{1F3A8} Y position updated to: ${pixels}px`);
      if (this.colors && this.colors.length > 0) {
        const currentIndex = this.getCurrentColorIndex();
        if (currentIndex !== -1) {
          this.selectPositionAtIndex(currentIndex);
        }
      }
    } else {
      console.warn("\u{1F3A8} Y position must be between 0 and 300 pixels");
    }
  }
  // ✅ Public method to get current Y position in pixels
  getYPositionPixels() {
    return this.targetYPixels;
  }
  // ✅ Public method to set both X and Y positions in pixels at once
  setPositionPixels(xPixels, yPixels) {
    let updated = false;
    if (xPixels >= 0 && xPixels <= 300) {
      this.targetXPixels = xPixels;
      updated = true;
      console.log(`\u{1F3A8} X position updated to: ${xPixels}px`);
    } else {
      console.warn("\u{1F3A8} X position must be between 0 and 300 pixels");
    }
    if (yPixels >= 0 && yPixels <= 300) {
      this.targetYPixels = yPixels;
      updated = true;
      console.log(`\u{1F3A8} Y position updated to: ${yPixels}px`);
    } else {
      console.warn("\u{1F3A8} Y position must be between 0 and 300 pixels");
    }
    if (updated && this.colors && this.colors.length > 0) {
      const currentIndex = this.getCurrentColorIndex();
      if (currentIndex !== -1) {
        this.selectPositionAtIndex(currentIndex);
      }
    }
  }
  // ✅ Public method to get current position in pixels
  getPositionPixels() {
    return {
      x: this.targetXPixels,
      y: this.targetYPixels
    };
  }
  // ✅ Public method to set absolute pixel positions (alias for setPositionPixels)
  setAbsolutePosition(xPixels, yPixels) {
    this.setPositionPixels(xPixels, yPixels);
  }
  // ✅ Public method to get current absolute pixel positions
  getAbsolutePosition() {
    return {
      x: this.targetXPixels,
      y: this.targetYPixels
    };
  }
  // ✅ Public method to reset to default positions
  resetToDefaultPosition() {
    this.targetXPixels = 180;
    this.targetYPixels = 150;
    console.log("\u{1F3A8} Reset to default position: X=180px, Y=150px");
    if (this.colors && this.colors.length > 0) {
      const currentIndex = this.getCurrentColorIndex();
      if (currentIndex !== -1) {
        this.selectPositionAtIndex(currentIndex);
      }
    }
  }
  // ✅ Private method to get current color index based on position
  getCurrentColorIndex() {
    if (this.colors && this.colors.length > 0) {
      const gridSize = 10;
      const itemSize = 30;
      const row = Math.round(this.movableItem.y / itemSize);
      const col = Math.round(this.movableItem.x / itemSize);
      const index = row * gridSize + col;
      return Math.max(0, Math.min(index, this.colors.length - 1));
    }
    return -1;
  }
  // ✅ Add method to update the gradient background CSS custom property
  updateGradientBackground() {
    this.cdr.detectChanges();
  }
  hexToHsl(hex) {
    let r = parseInt(hex.substring(1, 3), 16) / 255;
    let g = parseInt(hex.substring(3, 5), 16) / 255;
    let b = parseInt(hex.substring(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    h = (h + 360) % 360;
    s = Math.min(Math.max(s, 0), 100);
    l = Math.min(Math.max(l, 0), 100);
    return { h, s, l };
  }
  findClosestColor(hsl) {
    const distances = this.colors.map((color) => {
      const [h, s, l] = color.replace(/[^\d,]/g, "").split(",").map(Number);
      const dh = Math.min(Math.abs(hsl.h - h), 360 - Math.abs(hsl.h - h));
      const ds = Math.abs(hsl.s - s);
      const dl = Math.abs(hsl.l - l);
      return Math.sqrt(dh * dh + ds * ds + dl * dl);
    });
    const minDistance = Math.min(...distances);
    const closestColorIndex = distances.indexOf(minDistance);
    return this.colors[closestColorIndex];
  }
  findColorPosition(hsl) {
    const closestLightness = this.lightnessValues.reduce((prev, curr) => {
      return Math.abs(curr - hsl[2]) < Math.abs(prev - hsl[2]) ? curr : prev;
    });
    ;
    const closestLightnessIndex = this.lightnessValues.indexOf(closestLightness);
    return this.findColorPosition2(closestLightnessIndex);
  }
  findColorPosition2(index) {
    if (this.colorItems && this.colorItems.length) {
      const colorItem = this.colorItems.toArray()[index];
      if (colorItem) {
        const rect = colorItem.nativeElement.getBoundingClientRect();
        const parentRect = colorItem.nativeElement.parentElement.getBoundingClientRect();
        const x = rect.left - parentRect.left;
        const y = rect.top - parentRect.top;
        this.mousestopcords = { x: rect.x, y: rect.y };
        return { x, y };
      }
    }
    return { x: 0, y: 0 };
  }
  hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), +(l * 100).toFixed(1)];
  }
  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p2, q2, t) => {
        if (t < 0)
          t += 1;
        if (t > 1)
          t -= 1;
        if (t < 1 / 6)
          return p2 + (q2 - p2) * 6 * t;
        if (t < 1 / 2)
          return q2;
        if (t < 2 / 3)
          return p2 + (q2 - p2) * (2 / 3 - t) * 6;
        return p2;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    let r2 = Math.round(r * 255);
    let g2 = Math.round(g * 255);
    let b2 = Math.round(b * 255);
    var rgbcolor = [r2, g2, b2];
    return rgbcolor;
  }
  static {
    this.\u0275fac = function ColorpickerComponent_Factory(t) {
      return new (t || _ColorpickerComponent)(\u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ColorpickerComponent, selectors: [["app-colorpicker"]], viewQuery: function ColorpickerComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c03, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.colorItems = _t);
      }
    }, inputs: { colorslist: "colorslist", myColor: "myColor" }, outputs: { myColorChange: "myColorChange" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 18, vars: 17, consts: [["slider", ""], ["colorItem", ""], [1, "color-wrapper", "w-full"], ["draggable", "false", 1, "flex", "items-center", "gradient", "box", "w-[300px]", "h-[300px]", "flex-wrap", "relative", 3, "mouseup", "mousedown", "mousemove", "ngStyle"], [1, "size-[30px]", "item", "opacity-0", 3, "ngStyle", "id"], ["class", "size-4 border border-white rounded-full absolute ", 3, "left", "top", 4, "ngIf"], [1, "relative", "w-fit", "h-fit", "flex", "me-auto"], [1, "flex", "items-center", "flex-col", "huegrad", "shadow-[-1px_0px_7px_#0000002e]", "saturate-150", "relative", "ms-2", "w-[16px]", "border-2", "border-white", "overflow-hidden", "rounded-full"], [1, "h-[15px]", "w-full", "opacity-0", 3, "ngStyle"], ["step", "1", 1, "!absolute", "rotate-90", "!w-[300px]", "color-slider", "left-1/2", "top-1/2", "-translate-x-1/2", "-translate-y-1/2", "!ms-3", "!h-8", 3, "max", "ngStyle"], ["matSliderThumb", "", 3, "ngModelChange", "ngModel"], [1, "flex", "flex-col", "rounded-lg", "ps-2.5"], [1, "flex", "items-center", "text-xs", "text-black", "mb-2.5", "gap-2.5", "bg-white", "rounded-lg", "p-2.5"], [1, "size-8", "border-2", "border-white", 3, "ngStyle"], [1, "min-w-12"], ["class", "flex items-center flex-wrap gap-1 min-w-[116px] ", 4, "ngIf"], [1, "size-4", "border", "border-white", "rounded-full", "absolute"], [1, "bg-black", "text-xs", "text-white", "absolute", "custtooltip", "top-full", "mt-3", "left-1/2", "-translate-x-1/2"], [1, "flex", "items-center", "flex-wrap", "gap-1", "min-w-[116px]"], [1, "size-5", "border-2", "border-white", "cursor-pointer", 3, "ngStyle"], [1, "size-5", "border-2", "border-white", "cursor-pointer", 3, "click", "ngStyle"]], template: function ColorpickerComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 2)(1, "div", 3);
        \u0275\u0275listener("mouseup", function ColorpickerComponent_Template_div_mouseup_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseUp($event));
        })("mousedown", function ColorpickerComponent_Template_div_mousedown_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseDown($event));
        })("mousemove", function ColorpickerComponent_Template_div_mousemove_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onMouseMove($event));
        });
        \u0275\u0275repeaterCreate(2, ColorpickerComponent_For_3_Template, 3, 6, "span", 4, ctx.trackByColor, true);
        \u0275\u0275template(4, ColorpickerComponent_div_4_Template, 3, 5, "div", 5);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "div", 6)(6, "div", 7);
        \u0275\u0275repeaterCreate(7, ColorpickerComponent_For_8_Template, 1, 3, "span", 8, \u0275\u0275repeaterTrackByIdentity);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "mat-slider", 9)(10, "input", 10, 0);
        \u0275\u0275twoWayListener("ngModelChange", function ColorpickerComponent_Template_input_ngModelChange_10_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.currenthueVal, $event) || (ctx.currenthueVal = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("ngModelChange", function ColorpickerComponent_Template_input_ngModelChange_10_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.colorchange());
        });
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(12, "div", 11)(13, "div", 12);
        \u0275\u0275element(14, "span", 13);
        \u0275\u0275elementStart(15, "span", 14);
        \u0275\u0275text(16);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(17, ColorpickerComponent_div_17_Template, 3, 0, "div", 15);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("ngStyle", \u0275\u0275pureFunction2(8, _c12, ctx.currentcolor + "deg", ctx.isDragging ? "none" : "default"));
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.colors);
        \u0275\u0275advance(2);
        \u0275\u0275property("ngIf", ctx.colorloded);
        \u0275\u0275advance(3);
        \u0275\u0275repeater(ctx.hueArray);
        \u0275\u0275advance(2);
        \u0275\u0275property("max", 19)("ngStyle", \u0275\u0275pureFunction3(11, _c2, "hsl(" + ctx.currentcolor + ", 100%, 50%)", "hsl(" + ctx.currentcolor + ", 100%, 50%)", "hsl(" + ctx.currentcolor + ", 100%, 50%)"));
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("ngModel", ctx.currenthueVal);
        \u0275\u0275advance(4);
        \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(15, _c3, "#" + ctx.myColor));
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" #", ctx.myColor, " ");
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.colorslist && ctx.colorslist.length);
      }
    }, dependencies: [CommonModule, NgIf, NgStyle, MatSliderModule, MatSlider, MatSliderThumb, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel], styles: ['\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n  padding: 16px;\n}\n.color-wrapper[_ngcontent-%COMP%] {\n  display: flex;\n  height: fit-content;\n}\n.d-flex.wrapcolors[_ngcontent-%COMP%] {\n  margin-top: 16px;\n}\n.input-wrapper[_ngcontent-%COMP%] {\n  display: flex;\n  border-radius: 1px;\n  border: 1px solid rgb(220, 220, 220);\n  padding: 8px;\n  height: 32px;\n  justify-content: center;\n  height: fit-content;\n  width: fit-content;\n  gap: 10px;\n  background: white;\n  border: none;\n}\n.color-div[_ngcontent-%COMP%] {\n  width: 32px;\n  height: 32px;\n  border-radius: 0;\n}\n.text[_ngcontent-%COMP%] {\n  flex: 1;\n  line-height: 32px;\n}\n.recent-colors[_ngcontent-%COMP%] {\n  margin-left: 10px;\n  gap: 10px;\n}\n.recent-colors[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  background: red;\n  width: 16px;\n  display: block;\n  height: 16px;\n  border: 2px solid white;\n}\n.gradient[_ngcontent-%COMP%] {\n  --hue: 0deg;\n  background:\n    linear-gradient(\n      307deg,\n      hsl(var(--hue), 100%, 50%),\n      hsl(var(--hue), 76.74%, 91.57%));\n}\n.color-slider[_ngcontent-%COMP%] {\n  --mdc-slider-handle-shape: 10px;\n  --mdc-slider-handle-width: 11px;\n  --mdc-slider-handle-height: 22px;\n}\n.box[_ngcontent-%COMP%] {\n  --cursor: default;\n  cursor: var(--cursor);\n}\n.huegrad[_ngcontent-%COMP%] {\n  background: url("./media/background.png");\n  background-position: center;\n  background-repeat: no-repeat;\n  background-size: cover;\n}\n/*# sourceMappingURL=colorpicker.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ColorpickerComponent, { className: "ColorpickerComponent", filePath: "src\\app\\shared\\components\\colorpicker2\\colorpicker\\colorpicker.component.ts", lineNumber: 15 });
})();

export {
  ColorpickerComponent
};
//# sourceMappingURL=chunk-4GXCDIYV.js.map
