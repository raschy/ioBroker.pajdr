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
  /**
   *
   * @param adapter The ioBroker adapter instance.
   * @description Initializes the ApiManager with the adapter and token manager.
   * @throws Will throw an error if the adapter is not provided.
   * @throws Will throw an error if the token manager is not provided.
   * @description The ioBroker adapter instance.
   * @param tokenManager any
   */
  constructor(adapter, tokenManager) {
    this.adapter = adapter;
    this.baseUrl = "https://connect.paj-gps.de/api/v1/";
    this.tokenManager = tokenManager;
  }
  /**
   * @description Get Customer Data
   * @returns CustomerData
   */
  async getCustomer() {
    const url = `${this.baseUrl}customer`;
    this.adapter.log.silly(`[getCustomer] URL: ${url}`);
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
      const customerId = dataSuccess.id;
      this.adapter.log.info(`[getCustomer] Customer ID: ${customerId}`);
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        this.adapter.log.error(`[getCustomer] Error: ${error.message}`);
        throw error;
      } else {
        const errMsg = typeof error === "object" && error !== null && "stack" in error ? `[getCustomer] Unknown error: ${error.stack}` : `[getCustomer] Unknown error: ${String(error)}`;
        this.adapter.log.error(errMsg);
        throw new Error("Unknown error occurred");
      }
    }
  }
  /**
   * @returns DeviceData[]
   * @description Get Device Data
   */
  async getDevice() {
    const url = `${this.baseUrl}device`;
    this.adapter.log.silly(`[getDevice] URL: ${url}`);
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
      if (raw.number_of_records === 0) {
        this.adapter.log.warn("[getDevice] No devices found");
        return [];
      }
      this.adapter.log.info(`[getDevice] Number of devices: ${raw.number_of_records}`);
      const deviceData = raw.success;
      return deviceData;
    } catch (error) {
      if (error instanceof Error) {
        this.adapter.log.error("[getDevice] Error: " + error.message);
        throw error;
      } else {
        this.adapter.log.error("[getDevice] Unknown error: " + String(error));
        throw new Error("Unknown error occurred");
      }
    }
  }
  /**
   * @returns CarData[]
   * @description Get Car Device Data
   */
  async getCarDeviceData() {
    const url = `${this.baseUrl}sdevice/car`;
    this.adapter.log.silly(`[getCarDeviceData] URL: ${url}`);
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
  async getTrackerdata() {
    const url = `${this.baseUrl}trackerdata/1312315/last_minutes?lastMinutes=240`;
    this.adapter.log.silly(`[getTrackerdata] URL: ${url}`);
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
      this.adapter.log.info(`[getCustomer] Customer ID: ${data.number_of_correct_markers}`);
      return data.number_of_correct_markers;
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
  async getAllLastPositions(deviceIDs, fromLastPoint = false) {
    const url = `${this.baseUrl}trackerdata/getalllastpositions`;
    this.adapter.log.silly(`[getAllLastPositions] URL: ${url}`);
    const token = await this.tokenManager.getAccessToken();
    try {
      const payload = { deviceIDs, fromLastPoint };
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`[getAllLastPositions] Failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      this.adapter.log.info(`[getAllLastPositions] Number of records: ${data.number_of_records}`);
      return data.success;
    } catch (err) {
      this.adapter.log.error(`[getAllLastPositions] Error: ${err.message}`);
      throw err;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiManager
});
//# sourceMappingURL=apiManager.js.map
