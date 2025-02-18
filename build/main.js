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
var import_fs = require("fs");
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
    this.log.debug("#####  callData  #####");
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
      const mileage = parseFloat(carData[0].optimized_mileage);
      console.log("[SingleCarDeviceData] km-Stand: ", mileage);
      const geo = await client.getGeofences();
      console.log("[Geofence] Anzahl Fences: ", geo.length);
      geo.forEach((fence) => console.log(fence.name));
      const abfrageDatum = "2024-11-18";
      const today_ts = client.datestringToTimestamp(abfrageDatum);
      console.log(today_ts);
      const tracks = await client.getTrackerData(idDevice, today_ts);
      console.log("[TrackerData] Anzahl Tracks: ", tracks.length);
      const tracksLast = await client.getTrackerDataLast(idDevice, 5);
      console.log("[TrackerDataLast] Abgerufene Daten: ", tracksLast);
      console.log("[TrackerDataLast] Anzahl Tracks: ", tracksLast.length);
      const battery = tracksLast[0].battery;
      console.log("[SingleCarDeviceData] Batterie-Stand: ", battery);
      const pdfBuffer = await client.getPdf_new(idDevice);
      import_fs.promises.writeFile("pajData_03_241118.pdf", Buffer.from(pdfBuffer));
      console.log("[PDF getPdf] Abgerufene Daten: ", pdfBuffer);
      const pdfBufferR = await client.getRoute(idDevice, today_ts);
      import_fs.promises.writeFile("pajData_03r.pdf", Buffer.from(pdfBufferR));
    } catch (error) {
      console.error("Fehler:", error);
    }
  }
  //	#### Helper ####
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   *
   * @param callback
   */
  onUnload(callback) {
    try {
      if (this.dataUpdateInterval) {
        clearTimeout(this.dataUpdateInterval);
      }
      callback();
    } catch (e) {
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
