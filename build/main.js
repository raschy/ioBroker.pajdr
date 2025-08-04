"use strict";
var import_adapter_core = require("@iobroker/adapter-core");
var import_apiManager = require("./lib/apiManager");
var import_tokenManager = require("./lib/tokenManager");
var import_utils = require("./lib/utils");
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
  async onStateChange(id, state) {
    if (state) {
      this.log.silly(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
      this.log.info("################################");
      await this.queryData();
    }
  }
  async queryData() {
    this.log.debug("(queryData#)");
    this.apiManager.getCustomer().then((customerId) => {
      this.log.info(`Queried Customer ID: ${customerId}`);
    }).catch((error) => {
      this.log.error(`Error querying customer data: ${error.message}`);
    });
    this.queryGetDevice();
    this.queryGetCarDeviceData();
  }
  queryGetDevice() {
    this.log.debug("(queryGetDevice#)");
    this.apiManager.getDevice().then(async (DeviceData) => {
      var _a, _b;
      const manualLink = this.getLinkForManualLang((_b = (_a = DeviceData[0].device_models) == null ? void 0 : _a[0]) == null ? void 0 : _b.manual_link);
      for (const dev of DeviceData) {
        this.log.debug(`Device ID: ${dev.id}, Name: ${dev.name}`);
        if (this.customerId !== void 0) {
          (0, import_utils.createChannel)(this, this.customerId, String(dev.id), {
            en: "Tracker Number",
            de: "Tracker Nummer",
            ru: "\u0422\u0440\u0435\u043A\u0435\u0440 \u043D\u043E\u043C\u0435\u0440",
            pt: "N\xFAmero do Rastreador",
            nl: "Trackernummer",
            fr: "Num\xE9ro de suivi",
            it: "Numero di Tracker",
            es: "N\xFAmero de rastreador",
            pl: "Numer nadajnika",
            uk: "\u041D\u043E\u043C\u0435\u0440 \u0442\u0440\u0435\u043A\u0435\u0440\u0430",
            "zh-cn": "\u8DDF\u8E2A\u5668\u7F16\u53F7"
          });
          (0, import_utils.createState)(this, this.customerId + "." + String(dev.id), "IMEI", dev.imei, {
            name: {
              en: "Device IMEI",
              de: "Ger\xE4te IMEI",
              nl: "Apparaat IMEI",
              ru: "IMEI \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
              pt: "IMEI do Dispositivo",
              it: "IMEI del Dispositivo",
              fr: "IMEI de l'Appareil",
              es: "IMEI del Dispositivo",
              pl: "IMEI Urz\u0105dzenia",
              uk: "IMEI \u041F\u0440\u0438\u0441\u0442\u0440\u043E\u044E",
              "zh-cn": "\u8BBE\u5907IMEI"
            }
          });
          (0, import_utils.createState)(this, this.customerId + "." + String(dev.id), "Car Device ID", dev.carDevice_id, {
            name: {
              en: "Car Device ID",
              de: "Fahrzeug ID",
              nl: "Auto ID",
              ru: "ID \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044F",
              pt: "ID do Dispositivo",
              it: "ID del Dispositivo",
              fr: "ID de l'Appareil",
              es: "ID del Dispositivo",
              pl: "ID Urz\u0105dzenia",
              uk: "ID \u041F\u0440\u0438\u0441\u0442\u0440\u043E\u044E",
              "zh-cn": "\u8BBE\u5907ID"
            }
          });
        } else {
          this.log.warn("customerId is undefined, cannot create structured state for device");
        }
      }
    }).catch((error) => {
      this.log.error(`Error querying device data: ${error.message}`);
    });
  }
  queryGetCarDeviceData() {
    this.log.debug("(queryGetCarDeviceData#)");
    this.apiManager.getCarDeviceData().then(async (carData) => {
      for (const car of carData) {
        this.log.debug(`Car ID: ${car.id}, Name: ${car.car_name}`);
        if (this.customerId !== void 0) {
          (0, import_utils.createChannel)(this, this.customerId, String(car.id), {
            en: "Vehicle ID",
            de: "Fahrzeug ID",
            ru: "ID \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u043D\u043E\u0433\u043E \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0430",
            pt: "Identifica\xE7\xE3o do ve\xEDculo",
            it: "ID veicolo",
            fr: "Identification du v\xE9hicule",
            es: "Identificaci\xF3n de veh\xEDculos",
            pl: "Identyfikator pojazdu",
            uk: "\u041A\u043E\u0434 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0456\u043B\u044F",
            "zh-cn": "\u8F66\u8F86\u7F16\u53F7"
          });
          (0, import_utils.createState)(this, this.customerId + "." + String(car.id), "Vehicle Manufacturer", car.car_name, {
            name: {
              en: "Vehicle Manufacturer",
              de: "Hersteller des Fahrzeugs",
              ru: "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u043D\u043E\u0433\u043E \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0430",
              pt: "Fabricante do ve\xEDculo",
              nl: "Fabrikant van het voertuig",
              fr: "Fabricant du v\xE9hicule",
              it: "Nome dell'automobile",
              es: "Nombre del coche",
              pl: "Nazwa samochodu",
              uk: "\u041D\u0430\u0437\u0432\u0430 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0456\u043B\u044F",
              "zh-cn": "\u8F66\u540D"
            }
          });
          (0, import_utils.createState)(this, this.customerId + "." + String(car.id), "License Plate", car.license_plate, {
            name: {
              en: "License Plate",
              de: "Kennzeichen",
              ru: "\u041D\u043E\u043C\u0435\u0440\u043D\u043E\u0439 \u0437\u043D\u0430\u043A",
              pt: "Placa do ve\xEDculo",
              nl: "Kenteken",
              fr: "Plaque d'immatriculation",
              it: "Targa",
              es: "Matr\xEDcula",
              pl: "Numer rejestracyjny",
              uk: "\u041D\u043E\u043C\u0435\u0440\u043D\u0438\u0439 \u0437\u043D\u0430\u043A",
              "zh-cn": "\u8F66\u724C"
            }
          });
          (0, import_utils.createState)(this, this.customerId + "." + String(car.id), "Mileage", car.optimized_mileage, {
            name: {
              en: "Mileage",
              de: "Kilometerstand",
              ru: "\u041F\u0440\u043E\u0431\u0435\u0433",
              pt: "Quilometragem",
              nl: "Kilometerstand",
              fr: "Kilom\xE9trage",
              it: "Chilometraggio",
              es: "Kilometraje",
              pl: "Przebieg",
              uk: "\u041F\u0440\u043E\u0431\u0456\u0433",
              "zh-cn": "\u91CC\u7A0B"
            }
          });
          (0, import_utils.createState)(this, this.customerId + "." + String(car.id), "Created at", car.created_at, {
            name: {
              en: "Created At",
              de: "Erstellt am",
              ru: "\u0421\u043E\u0437\u0434\u0430\u043D\u043E",
              pt: "Criado em",
              nl: "Aangemaakt op",
              fr: "Cr\xE9\xE9 le",
              it: "Creato il",
              es: "Creado el",
              pl: "Utworzono",
              uk: "\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043E",
              "zh-cn": "\u521B\u5EFA\u4E8E"
            }
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
  removeInvalidCharacters(inputString) {
    const regexPattern = "[^a-zA-Z0-9]+";
    const regex = new RegExp(regexPattern, "gu");
    return inputString.replace(regex, "_");
  }
  async createCustomerFolder(customerId) {
    if (typeof customerId !== "string" || customerId.trim() === "" || customerId === "undefined" || customerId === "null") {
      this.log.warn("[createCustomerFolder] Invalid customerId");
      return;
    }
    const createdDevice = await (0, import_utils.createDevice)(this, customerId, {
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
    });
    this.log.debug(`[createCustomerFolder] Customer "${createdDevice}"`);
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
  async getLinkForManualLang(raw) {
    var _a, _b;
    if (!raw) {
      this.log.warn("[getLinkForManualLang] No device models in DeviceData found");
      return;
    }
    let parsed;
    try {
      if (typeof raw === "string") {
        parsed = JSON.parse(raw);
      } else if (typeof raw === "object") {
        parsed = raw;
      }
    } catch (err) {
      this.log.warn(`[getLinkForManualLang] JSON parsing failed: ${err}`);
      return;
    }
    if (!parsed || typeof parsed !== "object") return;
    const systemConfig = await this.getForeignObjectAsync("system.config");
    let systemLang;
    if ((_a = systemConfig == null ? void 0 : systemConfig.common) == null ? void 0 : _a.language) {
      systemLang = systemConfig.common.language;
    }
    const userLang = systemLang != null ? systemLang : "en";
    if (parsed[userLang]) {
      this.log.debug(`[getLinkForManualLang] User language: ${userLang}`);
    } else {
      parsed[userLang] = (_b = parsed["en"]) != null ? _b : "";
      this.log.debug(`[getLinkForManualLang] User language: ${userLang} [en]`);
    }
    if (this.customerId !== void 0) {
      if (parsed[userLang]) {
        (0, import_utils.createState)(this, this.customerId, "manualLink", parsed[userLang], {
          name: {
            en: "manualLink",
            de: "Link zum Handbuch",
            nl: "Link naar handleiding",
            ru: "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E",
            pt: "Link para o manual",
            it: "Link al manuale",
            fr: "Lien vers le manuel",
            es: "Link hacia el manual",
            pl: "Link do podr\u0119cznika",
            uk: "\u041F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u043D\u0430 \u043F\u043E\u0441\u0456\u0431\u043D\u0438\u043A",
            "zh-cn": "\u624B\u518C\u94FE\u63A5"
          }
        });
      } else {
        this.log.warn("[getLinkForManualLang] No link to manual available");
      }
    } else {
      this.log.warn("[getLinkForManualLang] customerId is undefined, cannot store manual link");
    }
  }
  async storeDataToState(deviceId, stateId, value, options) {
    const {
      deviceName,
      channelId,
      channelName,
      stateName,
      role = "state",
      type = typeof value,
      unit
    } = options != null ? options : {};
    const devicePath = deviceId;
    const channelPath = channelId ? `${devicePath}.${channelId}` : void 0;
    const statePath = channelPath ? `${channelPath}.${stateId}` : `${devicePath}.${stateId}`;
    await this.setObjectNotExistsAsync(devicePath, {
      type: "device",
      common: {
        name: ensureTranslatedName(deviceName != null ? deviceName : deviceId, deviceId)
      },
      native: {}
    });
    if (channelPath) {
      await this.setObjectNotExistsAsync(channelPath, {
        type: "channel",
        common: {
          name: ensureTranslatedName(channelName != null ? channelName : channelId, channelId)
        },
        native: {}
      });
    }
    await this.setObjectNotExistsAsync(statePath, {
      type: "state",
      common: {
        name: ensureTranslatedName(stateName != null ? stateName : stateId, stateId),
        role,
        type,
        unit,
        read: true,
        write: false
      },
      native: {}
    });
    await this.setState(statePath, { val: value, ack: true });
    function ensureTranslatedName(name, fallback) {
      if (typeof name === "string") {
        return name;
      }
      if (typeof name.en !== "string") {
        return { en: fallback, ...name };
      }
      return name;
    }
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
