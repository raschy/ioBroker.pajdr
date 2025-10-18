"use strict";
var import_adapter_core = require("@iobroker/adapter-core");
var import_apiManager = require("./lib/apiManager");
var import_tokenManager = require("./lib/tokenManager");
var import_utils = require("./lib/utils");
class Pajdr extends import_adapter_core.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "pajdr"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  //
  /**
   * This method is called when the adapter starts.
   * It initializes the token manager and API manager, retrieves the access token,
   * and sets up the initial state of the adapter.
   */
  async onReady() {
    this.log.debug("Adapter started");
    if (!this.config.email || !this.config.password) {
      this.log.error("\u274C Email or password not set in configuration");
      return;
    }
    this.tokenManager = new import_tokenManager.TokenManager(this, this.config.email, this.config.password);
    this.apiManager = new import_apiManager.ApiManager(this, this.tokenManager);
    try {
      await this.tokenManager.getAccessToken();
      this.customerId = await this.tokenManager.getCustomerId();
      if (this.customerId === void 0) {
        this.log.error("\u274C Customer ID could not be retrieved");
      } else {
        this.log.debug(`Got access token successfully`);
        this.log.info(`\u2705 Recieved Customer ID: ${this.customerId}`);
        await this.createCustomerFolder(this.customerId);
        this.queryData();
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
      console.log("############   API   ############");
      this.queryData();
    }
  }
  async queryData() {
    this.log.debug("(queryData#)");
    try {
      this.log.info("Requesting Customer Data from API...");
      this.customerId = await this.queryGetCustomer();
      this.log.info(`\u2705 Queried Customer ID: ${this.customerId}`);
    } catch (error) {
      this.log.error(`\u274C Failed to load customer data: ${error.message}`);
    }
    try {
      this.log.info("Requesting tracker IDs from API...");
      this.trackerId = await this.queryGetDevice();
      if (Array.isArray(this.trackerId) && this.trackerId.length > 0) {
        this.log.info(`\u2705 Tracker IDs successfully loaded: ${this.trackerId.join(", ")}`);
      } else {
        this.log.warn("\u26A0\uFE0F No tracker IDs returned from API \u2014 check device configuration or credentials.");
        this.trackerId = [];
      }
    } catch (error) {
      this.log.error(`\u274C Failed to load tracker IDs: ${error.message}`);
      this.trackerId = [];
    }
    try {
      this.log.info("Requesting AllLastPositions from API...");
      const trackerIdsAsNumbers = (this.trackerId || []).map((id) => Number(id)).filter((id) => !isNaN(id));
      this.log.debug(`Converted tracker IDs to numbers: [${trackerIdsAsNumbers.join(", ")}]`);
      if (trackerIdsAsNumbers.length === 0) {
        this.log.warn("No valid tracker IDs available to request positions.");
        return;
      }
      this.queryAllLastPositions(trackerIdsAsNumbers);
    } catch (error) {
      this.log.error(`\u274C Failed to load AllLastPositions: ${error.message}`);
    }
  }
  async queryGetCustomer() {
    this.log.debug("(queryGetCustomer#)");
    try {
      const customer = await this.apiManager.getCustomer();
      this.log.debug(`Customer ID: ${customer.id}, Name: ${customer.name}`);
      if (this.customerId !== void 0) {
        await (0, import_utils.createState)(this, `${this.customerId}`, "Company ID", customer.company_id, {
          name: {
            en: "Company ID",
            de: "Unternehmens-ID",
            nl: "Bedrijfs-ID",
            ru: "\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438",
            pt: "ID da Empresa",
            it: "ID dell'Azienda",
            fr: "ID de l'Entreprise",
            es: "ID de la Empresa",
            pl: "ID Firmy",
            uk: "\u0406\u0434\u0435\u043D\u0442\u0438\u0444\u0456\u043A\u0430\u0442\u043E\u0440 \u043A\u043E\u043C\u043F\u0430\u043D\u0456\u0457",
            "zh-cn": "\u516C\u53F8ID"
          }
        });
        await (0, import_utils.createState)(this, `${this.customerId}`, "User Name", customer.name, {
          name: {
            en: "User Name",
            de: "Benutzername",
            nl: "Gebruikersnaam",
            ru: "\u0418\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F",
            pt: "Nome de Usu\xE1rio",
            it: "Nome Utente",
            fr: "Nom d'Utilisateur",
            es: "Nombre de Usuario",
            pl: "Nazwa U\u017Cytkownika",
            uk: "\u0406\u043C'\u044F \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430",
            "zh-cn": "\u7528\u6237\u540D"
          }
        });
        await (0, import_utils.createState)(this, `${this.customerId}`, "Last Password Change", customer.last_password_change, {
          name: {
            en: "Last Password Change",
            de: "Letzte Passwort\xE4nderung",
            nl: "Laatste Wachtwoordwijziging",
            ru: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043F\u0430\u0440\u043E\u043B\u044F",
            pt: "\xDAltima altera\xE7\xE3o de senha",
            it: "Ultima modifica della password",
            fr: "Derni\xE8re modification du mot de passe",
            es: "\xDAltima modificaci\xF3n de la contrase\xF1a",
            pl: "Ostatnia zmiana has\u0142a",
            uk: "ID \u041F\u0440\u0438\u0441\u0442\u0440\u043E\u044E",
            "zh-cn": "\u8BBE\u5907ID"
          }
        });
        await (0, import_utils.createState)(this, `${this.customerId}`, "User Email", customer.email, {
          name: {
            en: "User Email",
            de: "Benutzer E-Mail",
            nl: "Gebruiker E-mail",
            ru: "\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F",
            pt: "E-mail do usu\xE1rio",
            it: "E-mail dell'utente",
            fr: "E-mail de l'utilisateur",
            es: "Correo electr\xF3nico del usuario",
            pl: "E-mail u\u017Cytkownika",
            uk: "\u0415\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430 \u043F\u043E\u0448\u0442\u0430 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430",
            "zh-cn": "\u7528\u6237\u7535\u5B50\u90AE\u4EF6"
          }
        });
        return String(customer.id);
      } else {
        this.log.warn("\u274C Customer ID is undefined, cannot create structured state for device");
      }
    } catch (error) {
      this.log.error(`Error querying device data: ${error.message}`);
      return void 0;
    }
  }
  async queryGetDevice() {
    this.log.debug("(queryGetDevice#)");
    let trackerId = [];
    try {
      const DeviceData = await this.apiManager.getDevice();
      for (const dev of DeviceData) {
        this.log.debug(`Device ID: ${dev.id}, Name: ${dev.name}`);
        if (this.customerId !== void 0) {
          trackerId.push(String(dev.id));
          await (0, import_utils.createChannel)(this, this.customerId, String(dev.id), {
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
          await (0, import_utils.createState)(this, `${this.customerId}.${String(dev.id)}`, "IMEI", dev.imei, {
            name: {
              en: "Device IMEI",
              de: "Ger\xE4te IMEI",
              nl: "Apparaat IMEI",
              ru: "IMEI \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
              pt: "IMEI do Dispositivo",
              it: "IMEI del Dispositivo",
              fr: `"IMEI de l'Appareil"`,
              es: "IMEI del Dispositivo",
              pl: "IMEI Urz\u0105dzenia",
              uk: "IMEI \u041F\u0440\u0438\u0441\u0442\u0440\u043E\u044E",
              "zh-cn": "\u8BBE\u5907IMEI"
            }
          });
          await (0, import_utils.createState)(this, `${this.customerId}.${String(dev.id)}`, "Car Device ID", dev.carDevice_id, {
            name: {
              en: "Car Device ID",
              de: "Fahrzeug ID",
              nl: "Auto ID",
              ru: "ID \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044F",
              pt: "ID do Dispositivo",
              it: "ID del Dispositivo",
              fr: `"ID de l'Appareil"`,
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
      return trackerId;
    } catch (error) {
      this.log.error(`Error querying device data: ${error.message}`);
      return void 0;
    }
  }
  queryGetCarDeviceData() {
    this.log.debug("(queryGetCarDeviceData#)");
    this.apiManager.getCarDeviceData().then(async (carData) => {
      for (const car of carData) {
        this.log.debug(`Car ID: ${car.id}, Name: ${car.car_name}`);
        if (this.customerId !== void 0) {
          await (0, import_utils.createChannel)(this, this.customerId, String(car.id), {
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
          await (0, import_utils.createState)(
            this,
            `${this.customerId}.${String(car.id)}`,
            "Vehicle Manufacturer",
            car.car_name,
            {
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
            }
          );
          await (0, import_utils.createState)(
            this,
            `${this.customerId}.${String(car.id)}`,
            "License Plate",
            car.license_plate,
            {
              name: {
                en: "License Plate",
                de: "Kennzeichen",
                ru: "\u041D\u043E\u043C\u0435\u0440\u043D\u043E\u0439 \u0437\u043D\u0430\u043A",
                pt: "Placa do ve\xEDculo",
                nl: "Kenteken",
                fr: `"Plaque d'immatriculation"`,
                it: "Targa",
                es: "Matr\xEDcula",
                pl: "Numer rejestracyjny",
                uk: "\u041D\u043E\u043C\u0435\u0440\u043D\u0438\u0439 \u0437\u043D\u0430\u043A",
                "zh-cn": "\u8F66\u724C"
              }
            }
          );
          await (0, import_utils.createState)(
            this,
            `${this.customerId}.${String(car.id)}`,
            "Mileage",
            car.optimized_mileage,
            {
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
            }
          );
          await (0, import_utils.createState)(this, `${this.customerId}.${String(car.id)}`, "Created at", car.created_at, {
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
  queryTrackerdata() {
    this.log.debug("(queryTrackerdata#)");
    this.log.debug(`Calling getTrackerdata from ApiManager with dummy device ID [${this.deviceId}]`);
    this.apiManager.getTrackerdata().then(async (data) => {
      this.log.debug(`Tracker Data: ${JSON.stringify(data)}`);
    }).catch((error) => {
      this.log.error(`Error querying tracker data: ${error.message}`);
    });
  }
  queryAllLastPositions(id) {
    this.log.debug(`Calling getAllLastPositions from ApiManager with device IDs [${id.join(", ")}]`);
    this.apiManager.getAllLastPositions(id).then(async (positions) => {
      for (const position of positions) {
        this.log.debug(`Position ID: ${position.id}, Latitude: ${Math.round(position.lat * 1e4) / 1e4}, Longitude: ${Math.round(position.lng * 1e4) / 1e4}`);
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
      this.log.warn("(createCustomerFolder) Invalid customerId");
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
    this.log.debug(`(createCustomerFolder) Customer "${createdDevice}"`);
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
      this.log.debug(`(onUnload) ${JSON.stringify(e)}`);
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
