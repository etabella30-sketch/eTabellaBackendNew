// src/app/userpanel/utility/error-handler.util.ts
var ErrorHandlerUtil = class {
  /**
   * Extracts a readable error message from various error types
   * @param error - The error object to extract message from
   * @returns A readable error message string
   */
  static getErrorMessage(error) {
    if (error instanceof Error) {
      return error.message ?? "Unknown error";
    }
    if (typeof error === "string") {
      return error;
    }
    if (error && typeof error === "object" && "message" in error) {
      const message = error["message"];
      if (typeof message === "string") {
        return message;
      }
      if (message === null || message === void 0) {
        return "Unknown error";
      }
      if (typeof message === "number" || typeof message === "boolean" || typeof message === "bigint") {
        return String(message);
      }
      try {
        return JSON.stringify(message);
      } catch {
        return "Unknown error";
      }
    }
    return "Unknown error";
  }
};

export {
  ErrorHandlerUtil
};
//# sourceMappingURL=chunk-DXEI33EW.js.map
