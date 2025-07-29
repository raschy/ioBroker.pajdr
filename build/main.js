"use strict";
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
  customerId;
  //
  /**
   * This method is called when the adapter starts.
   * It initializes the token manager and API manager, retrieves the access token,
   * and sets up the initial state of the adapter.
   */
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
      this.customerId = await this.tokenManager.getCustomerId();
      if (this.customerId === void 0) {
        this.log.error("Customer ID could not be retrieved");
      } else {
        this.log.debug(`Got access token successfully`);
        this.log.info(`customerId: ${this.customerId}`);
        await this.createCustomerFolder(this.customerId);
        await this.setupStart();
      }
    } catch (err) {
      this.log.error(`Authentication failed: ${err.message}`);
    }
    this.log.info("Adapter is initialized.");
  }
  onStateChange(id, state) {
    if (state) {
      this.log.silly(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
      this.log.info("################################");
      this.queryData();
    }
  }
  queryData() {
    this.log.debug("(queryData#)");
    this.apiManager.getCustomer().then((customerId) => {
      this.log.info(`Queried Customer ID: ${customerId}`);
    }).catch((error) => {
      this.log.error(`Error querying customer data: ${error.message}`);
    });
    this.queryGetDevice();
    this.queryGetCarDeviceData();
  }
  async queryGetDevice() {
    this.log.debug("(queryGetDevice#)");
    try {
      const device = await this.apiManager.getDevice();
      await this.makeManualLinks(device);
      for (const dev of device) {
        this.log.debug(`Device ID: ${dev.id}, Name: ${dev.name}`);
      }
    } catch (error) {
      this.log.error(`Error querying device data: ${error.message}`);
    }
  }
  async makeManualLinks(device) {
    this.log.debug("[makeManualLinks#]");
    const device_models = device[0].device_models;
    if (device_models && device_models.length > 0) {
      let manual_link = null;
      if (typeof device_models[0].manual_link === "string") {
        manual_link = JSON.parse(device_models[0].manual_link);
      } else if (typeof device_models[0].manual_link === "object" && device_models[0].manual_link !== null) {
        manual_link = device_models[0].manual_link;
      }
      if (manual_link) {
        if (this.customerId !== void 0) {
          await this.storeDataToState(this.customerId, "manualLink", manual_link.de);
        } else {
          this.log.warn("[makeManualLinks] customerId is undefined, cannot store manual link");
        }
      } else {
        this.log.warn("[makeManualLinks] No manual link available");
      }
    } else {
      this.log.warn("[makeManualLinks] No device models found");
    }
  }
  queryGetCarDeviceData() {
    this.log.debug("(queryGetCarDeviceData#)");
    this.apiManager.getCarDeviceData().then(async (carData) => {
      for (const car of carData) {
        this.log.debug(`Car ID: ${car.id}, Name: ${car.car_name}`);
        if (this.customerId !== void 0) {
          await this.storeDataToState(this.customerId, "CarName", car.car_name, {
            channelId: String(car.id)
          });
          await this.storeDataToState(this.customerId, "LicensePlate", car.license_plate, {
            channelId: String(car.id)
          });
          await this.storeDataToState(this.customerId, "Mileage", car.optimized_mileage, {
            channelId: String(car.id)
          });
          await this.storeDataToState(this.customerId, "CreatedAt", car.created_at, {
            channelId: String(car.id)
          });
        } else {
          this.log.warn("customerId is undefined, cannot create structured state for car");
        }
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
  async createCustomerFolder(customerId) {
    if (!customerId) {
      this.log.warn("[createCustomerFolder] Invalid customerId");
      return;
    }
    const dp_customerId = this.removeInvalidCharacters(customerId);
    this.log.debug(`[createCustomerFolder] Customer "${dp_customerId}"`);
    await this.setObjectNotExistsAsync(dp_customerId, {
      type: "device",
      common: {
        name: dp_customerId
      },
      native: {}
    });
    await this.extendObject(dp_customerId, {
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
  async storeDataToState(deviceId, stateId, value, options) {
    var _a, _b;
    const devicePath = deviceId;
    const channelId = options == null ? void 0 : options.channelId;
    const statePath = channelId ? `${deviceId}.${channelId}.${stateId}` : `${deviceId}.${stateId}`;
    const detectedType = typeof value;
    if (!["number", "string", "boolean"].includes(detectedType)) {
      throw new Error(`Unsupported state value type: ${detectedType}`);
    }
    let role;
    if (options == null ? void 0 : options.role) {
      role = options.role;
    } else {
      switch (detectedType) {
        case "number":
          role = "value";
          break;
        case "boolean":
          role = "indicator";
          break;
        case "string":
          role = "text";
          break;
        default:
          role = "state";
      }
    }
    const stateCommon = {
      name: (options == null ? void 0 : options.name) || stateId,
      type: detectedType,
      role,
      read: (_a = options == null ? void 0 : options.read) != null ? _a : true,
      write: (_b = options == null ? void 0 : options.write) != null ? _b : false
    };
    const existingDevice = await this.getObjectAsync(devicePath);
    if (!existingDevice) {
      await this.setObjectNotExistsAsync(devicePath, {
        type: "device",
        common: { name: deviceId },
        native: {}
      });
    } else if (existingDevice.type !== "device") {
      this.log.warn(
        `[createStructuredState] '${devicePath}' exists but is type '${existingDevice.type}', expected 'device'`
      );
    }
    if (channelId) {
      const parts = channelId.split(".");
      let path = devicePath;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        path = `${path}.${part}`;
        const isLast = i === parts.length - 1;
        const expectedType = isLast ? "channel" : "folder";
        const existing = await this.getObjectAsync(path);
        if (!existing) {
          await this.setObjectNotExistsAsync(path, {
            type: expectedType,
            common: { name: part },
            native: {}
          });
        } else if (existing.type !== expectedType) {
          this.log.warn(
            `[createStructuredState] '${path}' exists but is type '${existing.type}', expected '${expectedType}'`
          );
        }
      }
    }
    const existingObj = await this.getObjectAsync(statePath);
    if (existingObj && existingObj.type !== "state") {
      this.log.warn(
        `[createStructuredState] Cannot create state at '${statePath}', object of type '${existingObj.type}' already exists there.`
      );
      return;
    }
    await this.setObjectNotExistsAsync(statePath, {
      type: "state",
      common: stateCommon,
      native: {}
    });
    await this.setState(statePath, { val: value, ack: true });
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
