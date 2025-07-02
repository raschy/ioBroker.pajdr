"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var utils = __toESM(require("@iobroker/adapter-core"));
var import_ApiManager = require("./ApiManager");
class Pajdr extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "pajdr"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  dataUpdateInterval;
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    const user_name = this.config.email;
    const user_pass = this.config.password;
    const executionInterval = 360;
    const dataDir = utils.getAbsoluteDefaultDataDir();
    console.log(`DIR ${dataDir}`);
    await this.callData(user_name, user_pass);
    this.dataUpdateInterval = setTimeout(() => this.callData(user_name, user_pass), executionInterval * 1e3);
  }
  async callData(user_name, user_pass) {
    this.log.debug("#####  callData!  #####");
    try {
      const client = new import_ApiManager.ApiManager(user_name, user_pass);
      await client.loadToken();
      const userId = await client.getCustomer();
      console.log("[Customer] UserId:", userId);
      const device = await client.getDevice();
      const deviceId = device[0].carDevice_id;
      console.log("[Device]: ID", deviceId);
      const carData = await client.getCarDeviceData();
      console.log("[CarDeviceData] Anzahl Datens\xE4tze :", carData.length);
      const carCount = carData.length;
      console.log("[CarDeviceData]: Anzahl Fahrzeuge", carCount);
      const plateId = carData[0].plate_id;
      console.log("[CarDeviceData]: Kfz", plateId);
      const carDeviceId = carData[0].id;
      console.log("[CarDeviceData]: CarDeviceId", carDeviceId);
      const idCustomer = carData[0].customer_id;
      console.log("[CarDeviceData]: Customer ID", idCustomer);
      const idDevice = carData[0].iddevice;
      console.log("[CarDeviceData]: ID-Device", idDevice);
      await this.storeData("CustomerID", idCustomer);
      const mileage = parseFloat(carData[0].optimized_mileage);
      console.log("[SingleCarDeviceData] km-Stand: ", mileage);
      const geo = await client.getGeofences();
      console.log("[Geofence] Anzahl Fences: ", geo.length);
      geo.forEach((fence) => console.log(fence.name));
      const abfrageDatum = "2025-02-18";
      const today_ts = client.datestringToTimestamp(abfrageDatum);
      console.log(today_ts);
      const tracks = await client.getTrackerData(idDevice, today_ts);
      console.log("[TrackerData] Anzahl Tracks: ", tracks.length);
      const tracksLast = await client.getTrackerDataLast(idDevice, 5);
      const battery = parseInt(String(tracksLast[0].battery), 16);
      console.log("[SingleCarDeviceData] Batterie-Stand: ", battery);
    } catch (error) {
      console.error("Fehler:", error);
    }
  }
  /**
   * Is called when a subscribed state changes.
   * storeData is called when a state changes.
   *
   * @param customerId The ID of the state that changed
   * @param value The state object
   */
  async storeData(customerId, value) {
    console.log(`[storeData] CustomerID: ${customerId}, Value: ${value}`);
    const dp_CustomerId = this.removeInvalidCharacters(customerId);
    this.log.info(`[storeData] Customer "${dp_CustomerId}" with value: "${value}"`);
    const dp_customerValue = this.removeInvalidCharacters(String(value));
    await this.setObjectNotExistsAsync(dp_customerValue, {
      type: "device",
      common: {
        name: dp_CustomerId
      },
      native: {}
    });
    await this.extendObject(dp_customerValue, {
      common: {
        name: dp_CustomerId
      }
    });
    const dp_State = `${dp_customerValue}.${dp_CustomerId}`;
    await this.setObjectNotExistsAsync(dp_State, {
      type: "state",
      common: {
        name: {
          en: "Customer ID",
          de: "Kunden-ID",
          ru: "\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u043A\u043B\u0438\u0435\u043D\u0442\u0430",
          pt: "ID do cliente",
          nl: "Klant-ID",
          fr: "ID client",
          it: "ID cliente",
          es: "ID del cliente",
          pl: "ID klienta",
          uk: "\u0406\u0434\u0435\u043D\u0442\u0438\u0444\u0456\u043A\u0430\u0442\u043E\u0440 \u043A\u043B\u0456\u0454\u043D\u0442\u0430",
          "zh-cn": "\u5BA2\u6237ID"
        },
        type: "number",
        role: "value",
        unit: "",
        read: true,
        write: false
      },
      native: {}
    });
    this.log.info(`[storeData] State: ${dp_State}" with value: "${value}"`);
    await this.setStateChangedAsync(`${dp_State}`, { val: value, ack: true });
  }
  //	#### Helper ####
  //
  /**
   * removes illegal characters
   *
   * @param inputString Designated name for an object/data point
   * @returns Cleaned name for an object/data point
   */
  removeInvalidCharacters(inputString) {
    const regexPattern = "[^a-zA-Z0-9]+";
    const regex = new RegExp(regexPattern, "gu");
    return inputString.replace(regex, "_");
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   *
   * @param callback Callback
   */
  onUnload(callback) {
    try {
      if (this.dataUpdateInterval) {
        clearTimeout(this.dataUpdateInterval);
      }
      callback();
    } catch (e) {
      this.log.debug(`[onUnload] ${JSON.stringify(e)}`);
      callback();
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Pajdr(options);
} else {
  (() => new Pajdr())();
}
//# sourceMappingURL=main.js.map
