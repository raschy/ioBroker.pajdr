"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var apiManager_exports = {};
__export(apiManager_exports, {
  ApiManager: () => ApiManager
});
module.exports = __toCommonJS(apiManager_exports);
class ApiManager {
  constructor(adapter, tokenManager) {
    this.adapter = adapter;
    this.tokenManager = tokenManager;
  }
  tokenManager;
  baseUrl = "https://connect.paj-gps.de/api/v1/";
  /**
   * @description Get Customer Data (explicit User-ID)
   * @returns {Promise<number>} The User-ID of the customer
   */
  async getCustomer() {
    const url = `${this.baseUrl}customer`;
    this.adapter.log.debug(`[getCustomer] URL: ${url}`);
    const token = await this.tokenManager.getAccessToken();
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getCustomer] Failed to retrieve data: ${response.statusText}`);
      }
      const raw = await response.json();
      const dataSuccess = raw.success;
      const userId = dataSuccess.id;
      this.adapter.log.info(`[getCustomer] User ID: ${userId}`);
      return userId;
    } catch (error) {
      if (error instanceof Error) {
        this.adapter.log.error("[getCustomer] Error: " + error.message);
        throw error;
      } else {
        this.adapter.log.error("[getCustomer] Unknown error: " + error);
        throw new Error("Unknown error occurred");
      }
    }
  }
  async getDevice() {
    const url = `${this.baseUrl}device`;
    this.adapter.log.debug(`[getDevice] URL: ${url}`);
    const token = await this.tokenManager.getAccessToken();
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getDevice] Failed to retrieve data: ${response.statusText}`);
      }
      const raw = await response.json();
      if (!raw.success || !Array.isArray(raw.success)) {
        throw new Error("[getDevice] Invalid response format: success is not an array");
      }
      console.log("[getDevice] Count: ", raw.number_of_records);
      if (raw.number_of_records === 0) {
        this.adapter.log.warn("[getDevice] No devices found");
        return [];
      }
      const deviceData = raw.success;
      return deviceData;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getDevice] Error:", error.message);
        throw error;
      } else {
        console.error("[getDevice] Unknown error:", error);
        throw new Error("Unknown error occurred");
      }
    }
  }
  async getCarDeviceData() {
    const url = `${this.baseUrl}sdevice/car`;
    this.adapter.log.debug(`[getCarDeviceData] URL: ${url}`);
    const token = await this.tokenManager.getAccessToken();
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getCarDeviceData] Failed to retrieve data: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.success;
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getCarDeviceData] Error:", error.message);
        throw error;
      } else {
        console.error("[getCarDeviceData] Unknown error:", error);
        throw new Error("Unknown error occurred");
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiManager
});
//# sourceMappingURL=apiManager.js.map
