import {
  ɵɵdefinePipe
} from "./chunk-OLJKHPOW.js";

// src/app/shared/pips/bytes/bytes.pipe.ts
var BytesPipe = class _BytesPipe {
  transform(bytes, precision = 2) {
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes))
      return "-";
    if (bytes === 0)
      return "0 bytes";
    const units = ["bytes", "KB", "MB", "GB", "TB", "PB"];
    let unitIndex = 0;
    while (bytes >= 1024) {
      bytes /= 1024;
      unitIndex++;
    }
    return `${bytes.toFixed(precision)} ${units[unitIndex]}`;
  }
  static {
    this.\u0275fac = function BytesPipe_Factory(t) {
      return new (t || _BytesPipe)();
    };
  }
  static {
    this.\u0275pipe = /* @__PURE__ */ \u0275\u0275definePipe({ name: "bytes", type: _BytesPipe, pure: true, standalone: true });
  }
};

export {
  BytesPipe
};
//# sourceMappingURL=chunk-PJGEM4T6.js.map
