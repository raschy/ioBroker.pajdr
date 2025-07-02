"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var ApiManager_exports = {};
__export(ApiManager_exports, {
  ApiManager: () => ApiManager
});
module.exports = __toCommonJS(ApiManager_exports);
var import_fs = __toESM(require("fs"));
var import_node_fetch = __toESM(require("node-fetch"));
var path = __toESM(require("path"));
class ApiManager {
  email;
  password;
  tokenFilePath = "token.txt";
  storedToken = null;
  tokenExpiry = null;
  /**
   * @param email - The email address of the user.
   * @param password - The password of the user.
   * @description Initializes the ApiManager with user credentials and sets the token file path.
   */
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }
  /**
   * @description Retrieves a bearer token from the API.
   * @returns bearer token as a string.
   */
  async getToken() {
    const baseUrl = "https://connect.paj-gps.de/api/v1/login?email=";
    const urlBinder = "&password=";
    const url = [baseUrl, encodeURIComponent(this.email), urlBinder, encodeURIComponent(this.password)].join("");
    console.log(`[getToken] Url: ${url}`);
    const response = await (0, import_node_fetch.default)(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    const data = await response.json();
    this.storedToken = data.success.token;
    this.tokenExpiry = Date.now() + data.success.expires_in * 1e3;
    console.log(this.tokenExpiry, this.timestampToDate(this.tokenExpiry));
    return data.success.token;
  }
  /**
   * @description Saves the token to a file.
   * @param token - The token string to save.
   */
  async saveToken(token) {
    await import_fs.default.promises.writeFile(this.tokenFilePath, token, "utf8");
  }
  /**
   * @description Loads the token from a file.
   */
  async loadToken() {
    try {
      const token = await import_fs.default.promises.readFile(this.tokenFilePath, "utf8");
      this.storedToken = token;
      return token;
    } catch (error) {
      throw new Error(`Token konnte nicht gelesen werden: ${error.message}`);
    }
  }
  /**
   * @description get Customer-Data.
   */
  async getCustomer() {
    const url = "https://connect.paj-gps.de/api/v1/customer";
    console.log(`[getCustomer] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.storedToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getCustomer] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.success;
      const userId = dataSuccess.id;
      return userId;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getCustomer] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getCustomer] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description get Device-Data.
   */
  async getDevice() {
    const url = "https://connect.paj-gps.de/api/v1/device";
    console.log(`[getDevice] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.storedToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getDevice] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.success;
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getDevice] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getDevice] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description Retrieves car device data from the API.
   */
  async getCarDeviceData() {
    const url = "https://connect.paj-gps.de/api/v1/sdevice/car";
    console.log(`[getCarDeviceData] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.storedToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getCarDeviceData] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.success;
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getCarDeviceData] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getCarDeviceData] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description get Single CarDeviceData by carId.
   * @param carId - The ID of the car device to retrieve data for.
   */
  async getSingleCarDeviceData(carId) {
    const baseUrl = "https://connect.paj-gps.de/api/v1/sdevice/car/";
    const url = [baseUrl, carId].join("");
    console.log(`[getSingleCarDeviceData] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.storedToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getSingleCarDeviceData] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.success;
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getSingleCarDeviceData] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getSingleCarDeviceData] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description get Geofences.
   */
  async getGeofences() {
    const url = "https://connect.paj-gps.de/api/v1/geofences";
    console.log(`[getGeofences] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.storedToken}`
        },
        body: '{ "deviceIDs": [1312315] }'
      });
      if (!response.ok) {
        throw new Error(`[getGeofences] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.success;
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getGeofences] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getGeofences] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description get Route-Data.
   * @param deviceId - The ID of the device for which the route data is requested.
   * @param timestamp - The timestamp for the route data, in milliseconds.
   */
  async getRoute(deviceId, timestamp) {
    const url = "https://api.paj-gps.com/api/v1/route/export";
    console.log(`[getRoute] URL: ${url}`);
    const deviceArr = [];
    deviceArr.push(deviceId);
    const body = {
      deviceId: deviceArr,
      dateStart: timestamp / 1e3,
      dateEnd: timestamp / 1e3 + 86399,
      //lastMinutes: 30,
      //lastPoints: 114,
      rangeType: "daterange",
      type: "pdf",
      sort: "asc",
      translations: {
        wayPoints: "Wegpunkte",
        signalFrom: "Signal von",
        showInGoogle: "Position auf Google Maps anzeigen",
        currentPosition: "Aktuelle Position",
        id: "ID",
        lat: "Breitengrad",
        lng: "L\xE4ngengrad",
        dateTime: "Uhrzeit",
        battery: "Batterie",
        speed: "Geschwindigkeit",
        direction: "Richtung",
        positionLink: "Link zur Position"
      },
      version: "V2"
    };
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "POST",
        headers: {
          accept: "application/pdf",
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.storedToken}`
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error(`[getRoute] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      return response.arrayBuffer();
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getRoute] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getRoute] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description Retrieves all routes for a given device ID.
   * @param deviceId - The ID of the device for which all routes are requested.
   */
  async getAllRoutes(deviceId) {
    const baseUrl = "https://connect.paj-gps.de/api/v1/logbook/getAllRoutes/";
    const url = [baseUrl, deviceId].join("");
    console.log(`[getAllRoutes] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.storedToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getAllRoutes] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.data;
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getAllRoutes] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getAllRoutes] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description Retrieves tracker data for a given device ID and timestamp.
   * @param deviceId - The ID of the device for which tracker data is requested.
   * @param timestamp - The timestamp for the tracker data, in milliseconds.
   */
  async getTrackerData(deviceId, timestamp) {
    const baseUrl = "https://connect.paj-gps.de/api/v1/trackerdata/";
    const url = [
      baseUrl,
      deviceId,
      "/date_range?dateStart=",
      timestamp / 1e3,
      "&dateEnd=",
      timestamp / 1e3 + 86399,
      "&wifi=1&gps=1"
    ].join("");
    console.log(`[getTrackerData] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.storedToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getTrackerData] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.success;
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getTrackerData] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getTrackerData] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description Retrieves the last tracker data points for a given device ID.
   * @param deviceId - The ID of the device for which tracker data is requested.
   * @param points - The number of last data points to retrieve.
   */
  async getTrackerDataLast(deviceId, points) {
    const baseUrl = "https://connect.paj-gps.de/api/v1/trackerdata/";
    const url = [baseUrl, deviceId, "/last_points?lastPoints=", points, "&wifi=0&gps=1"].join("");
    console.log(`[getTrackerDataLast] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.storedToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getTrackerDataLast] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.success;
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getTrackerDataLast] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getTrackerDataLast] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description Retrieves notifications for a given car ID and alert type.
   * @param carId - The ID of the car for which notifications are requested.
   * @param alertType - The type of alert for which notifications are requested.
   */
  async getNotifications(carId, alertType) {
    const baseUrl = "https://connect.paj-gps.de/api/v1/notifications/";
    const url = [baseUrl, carId, "?alertType=", alertType, "&isRead=0"].join("");
    console.log(`[getNotifications] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.storedToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`[getNotifications] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      const dataSuccess = data.success;
      return dataSuccess;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getNotifications] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getNotifications] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description Downloads a PDF report for a given device ID and date range.
   * @param deviceId - The ID of the device for which the PDF report is requested.
   */
  async getPdf_new(deviceId) {
    const url = "https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=1312315&startDate=1731715200&endDate=1731801500&dsType=mixTR";
    console.log(`[getPdf] URL: ${url} ${deviceId}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "POST",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${this.storedToken}`
        }
      });
      if (!response.ok) {
        throw new Error(`[getPdf] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const filePath = "pajDemo2.pdf";
      const outputPath = path.resolve(filePath);
      console.log("Output Path", outputPath);
      const pdfBuffer = await response.buffer();
      await import_fs.default.promises.writeFile(outputPath, Buffer.from(pdfBuffer));
      return pdfBuffer;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getPdf] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getPdf] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  // https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=1287648&startDate=1721772000&endDate=1721858400&dsType=mixTR
  /**
   * @description Downloads a PDF report for a given device ID and date range.
   * @param deviceId - The ID of the device for which the PDF report is requested.
   * @returns pdfBuffer - A promise that resolves to a Buffer containing the PDF data.
   */
  async getPdf_X(deviceId) {
    const baseUrl = "https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=";
    const tempUrl = "&startDate=1731715200&endDate=1731801599";
    const typeUrl = "&dsType=mixTR";
    const url = [baseUrl, deviceId, tempUrl, typeUrl].join("");
    console.log(`[getPdf] URL: ${url}`);
    try {
      const response = await (0, import_node_fetch.default)(url, {
        method: "POST",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${this.storedToken}`
        }
      });
      if (!response.ok) {
        throw new Error(`[getPdf] Datenabruf fehlgeschlagen: ${response.statusText}`);
      }
      const filePath = "pajDemo2.pdf";
      const outputPath = path.resolve(filePath);
      console.log("Output Path", outputPath);
      const pdfBuffer = await response.buffer();
      await import_fs.default.promises.writeFile(outputPath, Buffer.from(pdfBuffer));
      return pdfBuffer;
    } catch (error) {
      if (error instanceof Error) {
        console.error("[getPdf] Fehler:", error.message);
        throw error;
      } else {
        console.error("[getPdf] Unbekannter Fehler:", error);
        throw new Error("Unbekannter Fehler aufgetreten");
      }
    }
  }
  /**
   * @description Downloads a PDF report for a given device ID and timestamp.
   * @param deviceId - The ID of the device for which the PDF report is requested.
   * @param timestamp - The timestamp for the report, in milliseconds.
   * @returns response.arrayBuffer() - A promise that resolves to an ArrayBuffer containing the PDF data.
   */
  async getPdf(deviceId, timestamp) {
    const baseUrl = "https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=";
    const url = [
      baseUrl,
      deviceId,
      "&startDate=",
      timestamp / 1e3,
      "&endDate=",
      timestamp / 1e3 + 86399,
      "&dsType=mixTR"
    ].join("");
    console.log(`[getPdf] URL: ${url}`);
    const body = {
      deviceId: [1312315],
      dateStart: 1721772e3,
      dateEnd: 1721858399,
      lastMinutes: 30,
      lastPoints: 114,
      rangeType: "daterange",
      type: "pdf",
      sort: "asc",
      translations: {
        wayPoints: "Wegpunkte",
        signalFrom: "Signal von",
        showInGoogle: "Position auf Google Maps anzeigen",
        currentPosition: "Aktuelle Position",
        id: "ID",
        lat: "Breitengrad",
        lng: "L\xE4ngengrad",
        dateTime: "Uhrzeit",
        battery: "Batterie",
        speed: "Geschwindigkeit",
        direction: "Richtung",
        positionLink: "Link zur Position"
      },
      version: "V2"
    };
    body.dateStart = timestamp / 1e3;
    body.dateEnd = timestamp / 1e3 + 86399;
    console.log(body);
    const response = await (0, import_node_fetch.default)(url, {
      method: "POST",
      headers: {
        accept: "application/pdf",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.storedToken}`
      }
      //body: JSON.stringify(body),
    });
    return response.arrayBuffer();
    if (!response.ok) {
      throw new Error(`[getGeofences] Datenabruf fehlgeschlagen: ${response.statusText}`);
    }
  }
  // Helper
  /**
   * Converts a Unix timestamp to a formatted date string in German locale.
   *
   * @param unixTimestamp - The Unix timestamp to convert.
   * @returns A formatted date string in 'de-DE' locale.
   */
  timestampToDateDE(unixTimestamp) {
    const date = new Date(unixTimestamp);
    return date.toLocaleString("de-DE");
  }
  /**
   * Converts a Unix timestamp to a Date object.
   *
   * @param unixTimestamp - The Unix timestamp to convert.
   * @returns A Date object representing the given timestamp.
   */
  timestampToDate(unixTimestamp) {
    console.log(unixTimestamp);
    return new Date(unixTimestamp);
  }
  /**
   * Returns the current date as a timestamp.
   *
   * @returns A timestamp representing today's date at midnight.
   */
  todayTimestamp() {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, -14);
    return new Date(today).getTime();
  }
  /**
   * Converts a date string in the format 'YYYY-MM-DD' to a timestamp.
   *
   * @param d - The date string to convert.
   * @returns A timestamp representing the given date.
   */
  datestringToTimestamp(d) {
    const val = d.split("-");
    const _year = parseInt(val[0]);
    const _month = parseInt(val[1]);
    const _date = parseInt(val[2]);
    const calculatedDate = new Date(_year, _month - 1, _date, 0, 0, 0, 0);
    return calculatedDate.getTime();
  }
  /**
   * Formats a Date object into a string in the format 'YYYY-MM-DD'.
   *
   * @param d - The Date object to format.
   * @returns A string representing the date in 'YYYY-MM-DD' format.
   */
  formatDate(d) {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiManager
});
//# sourceMappingURL=ApiManager.js.map
