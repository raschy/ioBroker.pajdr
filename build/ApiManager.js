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
   *
   */
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }
  /**
   *
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
   *
   */
  async saveToken(token) {
    await import_fs.default.promises.writeFile(this.tokenFilePath, token, "utf8");
  }
  /**
   *
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
   *
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
   *
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
   *
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
   *
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
   *
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
   *
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
  //https://connect.paj-gps.de/api/v1/logbook/getAllRoutes/2937042
  /**
   *
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
  //https://connect.paj-gps.de/api/v1/trackerdata/1312315/date_range?dateStart=1730970000000&dateEnd=1730970086399&wifi=1&gps=1
  /**
   *
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
  //https://connect.paj-gps.de/api/v1/trackerdata/1312315/last_points?lastPoints=10&gps=1&wifi=0
  /**
   *
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
  //######
  /**
   *
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
  //https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=1312315&startDate=1731715200&endDate=1731801500&dsType=mixTR
  /**
   *
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
      import_fs.default.promises.writeFile(outputPath, Buffer.from(pdfBuffer));
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
   *
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
      import_fs.default.promises.writeFile(outputPath, Buffer.from(pdfBuffer));
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
   *
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
  /**
   *
   */
  async getPdf_old(deviceId) {
    const baseUrl = "https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=";
    const tempUrl = "&startDate=1720994400&endDate=1721080800";
    const typeUrl = "&dsType=mixTR";
    const url = [baseUrl, deviceId, tempUrl, typeUrl].join("");
    console.log(`[getPDF] URL: ${url}`);
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
    body.dateStart = 1720908e3;
    body.dateEnd = 1720994e3;
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
   *
   */
  timestampToDateDE(unixTimestamp) {
    const date = new Date(unixTimestamp);
    return date.toLocaleString("de-DE");
  }
  /**
   *
   */
  timestampToDate(unixTimestamp) {
    console.log(unixTimestamp);
    return new Date(unixTimestamp);
  }
  /**
   *
   */
  todayTimestamp() {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, -14);
    return new Date(today).getTime();
  }
  /**
   *
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
   *
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
