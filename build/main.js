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
var import_adapter_core = require("@iobroker/adapter-core");
var import_apiManager = require("./lib/apiManager");
var import_tokenManager = require("./lib/tokenManager");
class Pajdr extends import_adapter_core.Adapter {
  tokenManager;
  apiManager;
  constructor(options = {}) {
    super({
      ...options,
      name: "pajdr"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  dataUpdateInterval;
  userId;
  //
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async _onReady() {
    const user_name = this.config.email;
    const user_pass = this.config.password;
    const executionInterval = 360;
    const dataDir = utils.getAbsoluteDefaultDataDir();
    console.log(`DIR ${dataDir}`);
  }
  async onReady() {
    this.log.info("Adapter is ready");
    if (!this.config.email || !this.config.password) {
      this.log.error("Email or password not set in configuration");
      return;
    }
    this.tokenManager = new import_tokenManager.TokenManager(this, this.config.email, this.config.password);
    this.apiManager = new import_apiManager.ApiManager(this, this.tokenManager);
    try {
      await this.tokenManager.getAccessToken();
      this.userId = await this.tokenManager.getUserId();
      if (this.userId === void 0) {
        this.log.error("User ID could not be retrieved");
      } else {
        this.log.debug(`Got access token successfully`);
        this.log.info(`UserId: ${this.userId}`);
        this.createCustomerFolder(this.userId);
        this.setupStart();
      }
    } catch (err) {
      this.log.error(`Authentication failed: ${err.message}`);
    }
    this.log.info("Adapter is initialized.");
  }
  async onStateChange(id, state) {
    if (state) {
      this.log.silly(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
      this.log.info("################################");
      this.queryData();
    }
  }
  queryData() {
    this.log.debug("(queryData#)");
    this.apiManager.getCustomer().then((userId) => {
      this.log.info(`Queried Customer ID: ${userId}`);
    }).catch((error) => {
      this.log.error(`Error querying customer data: ${error.message}`);
    });
    this.queryGetDevice();
    this.queryGetCarDeviceData();
  }
  queryGetDevice() {
    this.log.debug("[queryGetDevice#]");
    this.apiManager.getDevice().then((device) => {
      makeManualLinks.call(this, device);
      for (const dev of device) {
        this.log.debug(`Device ID: ${dev.id}, Name: ${dev.name}`);
        this.storeDataToState("Name", dev.name);
        this.storeDataToState("ModelNr", dev.model_nr);
      }
    }).catch((error) => {
      this.log.error(`Error querying device data: ${error.message}`);
    });
    function makeManualLinks(device) {
      this.log.silly("[makeManualLinks#]");
      const device_models = device[0].device_models;
      if (device_models && device_models.length > 0) {
        let manual_link = null;
        if (typeof device_models[0].manual_link === "string") {
          manual_link = JSON.parse(device_models[0].manual_link);
        } else if (typeof device_models[0].manual_link === "object" && device_models[0].manual_link !== null) {
          manual_link = device_models[0].manual_link;
        }
        if (manual_link) {
          this.storeDataToState("manualLink", manual_link.de);
        } else {
          this.log.warn("[getDevice] No manual link available");
        }
      } else {
        this.log.warn("[getDevice] No device models found");
      }
    }
  }
  queryGetCarDeviceData() {
    this.log.debug("(queryGetCarDeviceData#)");
    this.apiManager.getCarDeviceData().then((carData) => {
      for (const car of carData) {
        this.log.debug(`Car ID: ${car.id}, Name: ${car.car_name}`);
        this.storeDataToState("CarName", car.car_name);
        this.storeDataToState("ModelName", car.model_name);
        this.storeDataToState("LicensePlate", car.license_plate);
        this.storeDataToState("Mileage", car.optimized_mileage);
        this.storeDataToState("CreatedAt", car.created_at);
      }
    }).catch((error) => {
      this.log.error(`Error querying car device data: ${error.message}`);
    });
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
  storeDataToState(id, value) {
    const dp_DeviceId = this.removeInvalidCharacters(String(this.userId)) + "." + this.removeInvalidCharacters(id);
    this.setObjectNotExistsAsync(dp_DeviceId, {
      type: "state",
      common: {
        name: id,
        type: Array.isArray(value) ? "array" : value === null ? "mixed" : typeof value === "boolean" ? "boolean" : typeof value === "number" ? "number" : typeof value === "object" ? "object" : "string",
        role: "state",
        read: true,
        write: false
      },
      native: {}
    }).then(() => {
      this.setState(dp_DeviceId, { val: value, ack: true }).then(() => {
        this.log.debug(`[storeDataToState] State "${dp_DeviceId}" set to "${value}"`);
      }).catch((error) => {
        this.log.error(`[storeDataToState] Error setting state ${dp_DeviceId}: ${error.message}`);
      });
    }).catch((error) => {
      this.log.error(`[storeDataToState] Error creating state ${dp_DeviceId}: ${error.message}`);
    });
  }
  async createCustomerFolder(userId) {
    if (!userId) {
      this.log.warn("[createCustomerFolder] Invalid userId");
      return;
    }
    const dp_UserId = this.removeInvalidCharacters(String(userId));
    this.log.debug(`[createCustomerFolder] User "${dp_UserId}"`);
    await this.setObjectNotExistsAsync(dp_UserId, {
      type: "device",
      common: {
        name: dp_UserId
      },
      native: {}
    });
    await this.extendObject(dp_UserId, {
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
        }
      }
    });
  }
  async setupStart() {
    await this.setObjectNotExistsAsync("Start", {
      type: "state",
      common: {
        name: "Start",
        type: "boolean",
        role: "indicator",
        read: true,
        write: true
      },
      native: {}
    });
    this.subscribeStates("Start");
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
