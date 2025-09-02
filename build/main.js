"use strict";
/*
 * Created with @iobroker/create-adapter v2.6.3
 */
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_core_1 = require("@iobroker/adapter-core");
const apiManager_1 = require("./lib/apiManager");
const tokenManager_1 = require("./lib/tokenManager");
const utils_1 = require("./lib/utils");
//import { writeLog } from './lib/filelogger';
//const fileHandle = { path: '/home/raschy/ioBroker.pajdr', file: 'logs1.txt' };
// Load your modules here, e.g.:
class Pajdr extends adapter_core_1.Adapter {
    tokenManager;
    apiManager;
    constructor(options = {}) {
        super({
            ...options,
            name: 'pajdr',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
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
        this.log.info('Adapter is ready');
        if (!this.config.email || !this.config.password) {
            this.log.error('Email or password not set in configuration');
            return;
        }
        this.tokenManager = new tokenManager_1.TokenManager(this, this.config.email, this.config.password);
        this.apiManager = new apiManager_1.ApiManager(this, this.tokenManager);
        try {
            await this.tokenManager.getAccessToken();
            //
            this.customerId = await this.tokenManager.getCustomerId();
            if (this.customerId === undefined) {
                this.log.error('Customer ID could not be retrieved');
            }
            else {
                this.log.debug(`Got access token successfully`);
                this.log.info(`customerId: ${this.customerId}`);
                await this.createCustomerFolder(this.customerId);
                //
                //
                await this.setupStart();
            }
        }
        catch (err) {
            this.log.error(`Authentication failed: ${err.message}`);
        }
        this.log.info('Adapter is initialized.');
    }
    async onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.silly(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
            //
            // API-Anfrage für Customer
            this.log.info('################################');
            this.queryData();
            //
            // Hier können Sie weitere API-Aufrufe oder Logik hinzufügen, die auf den Statusänderungen basieren.
            // The state was deleted
            // this.log.info(`state ${id} deleted`);
        }
    }
    queryData() {
        // This method is called when data should be requested
        this.log.debug('(queryData#)');
        // API-Anfrage für Customer
        this.apiManager
            .getCustomer()
            .then(customerId => {
            this.log.info(`Queried Customer ID: ${customerId}`);
            // You can also set the state with the queried data
            //this.setState('customer.customerId', { val: customerId, ack: true });
        })
            .catch(error => {
            this.log.error(`Error querying customer data: ${error.message}`);
        });
        // API-Anfrage für Device
        this.queryGetDevice();
        this.queryGetCarDeviceData();
    }
    queryGetDevice() {
        // This method is called when data should be requested
        this.log.debug('(queryGetDevice#)');
        // API-Request für CarDeviceData
        this.apiManager
            .getDevice()
            .then(async (DeviceData) => {
            // and here you can process the car data
            // const manualLink = this.getLinkForManualLang(DeviceData[0].device_models?.[0]?.manual_link);
            // Create a device for each DeviceData
            for (const dev of DeviceData) {
                this.log.debug(`Device ID: ${dev.id}, Name: ${dev.name}`);
                // Create a channel for each car
                if (this.customerId !== undefined) {
                    await (0, utils_1.createChannel)(this, this.customerId, String(dev.id), {
                        en: 'Tracker Number',
                        de: 'Tracker Nummer',
                        ru: 'Трекер номер',
                        pt: 'Número do Rastreador',
                        nl: 'Trackernummer',
                        fr: 'Numéro de suivi',
                        it: 'Numero di Tracker',
                        es: 'Número de rastreador',
                        pl: 'Numer nadajnika',
                        uk: 'Номер трекера',
                        'zh-cn': '跟踪器编号',
                    });
                    await (0, utils_1.createState)(this, `${this.customerId}.${String(dev.id)}`, 'IMEI', dev.imei, {
                        name: {
                            en: 'Device IMEI',
                            de: 'Geräte IMEI',
                            nl: 'Apparaat IMEI',
                            ru: 'IMEI устройства',
                            pt: 'IMEI do Dispositivo',
                            it: 'IMEI del Dispositivo',
                            fr: '"IMEI de l\'Appareil"',
                            es: 'IMEI del Dispositivo',
                            pl: 'IMEI Urządzenia',
                            uk: 'IMEI Пристрою',
                            'zh-cn': '设备IMEI',
                        },
                    });
                    await (0, utils_1.createState)(this, `${this.customerId}.${String(dev.id)}`, 'Car Device ID', dev.carDevice_id, {
                        name: {
                            en: 'Car Device ID',
                            de: 'Fahrzeug ID',
                            nl: 'Auto ID',
                            ru: 'ID автомобиля',
                            pt: 'ID do Dispositivo',
                            it: 'ID del Dispositivo',
                            fr: '"ID de l\'Appareil"',
                            es: 'ID del Dispositivo',
                            pl: 'ID Urządzenia',
                            uk: 'ID Пристрою',
                            'zh-cn': '设备ID',
                        },
                    });
                }
                else {
                    this.log.warn('customerId is undefined, cannot create structured state for device');
                }
            }
        })
            .catch(error => {
            this.log.error(`Error querying device data: ${error.message}`);
        });
    }
    queryGetCarDeviceData() {
        // This method is called when data should be requested
        this.log.debug('(queryGetCarDeviceData#)');
        // API-Request für CarDeviceData
        this.apiManager
            .getCarDeviceData()
            .then(async (carData) => {
            // and here you can process the car data
            for (const car of carData) {
                //#console.log(`car: ${JSON.stringify(car)}`);
                this.log.debug(`Car ID: ${car.id}, Name: ${car.car_name}`);
                // Create a folder for each car
                if (this.customerId !== undefined) {
                    await (0, utils_1.createChannel)(this, this.customerId, String(car.id), {
                        en: 'Vehicle ID',
                        de: 'Fahrzeug ID',
                        ru: 'ID транспортного средства',
                        pt: 'Identificação do veículo',
                        it: 'ID veicolo',
                        fr: 'Identification du véhicule',
                        es: 'Identificación de vehículos',
                        pl: 'Identyfikator pojazdu',
                        uk: 'Код автомобіля',
                        'zh-cn': '车辆编号',
                    });
                    await (0, utils_1.createState)(this, `${this.customerId}.${String(car.id)}`, 'Vehicle Manufacturer', car.car_name, {
                        name: {
                            en: 'Vehicle Manufacturer',
                            de: 'Hersteller des Fahrzeugs',
                            ru: 'Производитель транспортного средства',
                            pt: 'Fabricante do veículo',
                            nl: 'Fabrikant van het voertuig',
                            fr: 'Fabricant du véhicule',
                            it: "Nome dell'automobile",
                            es: 'Nombre del coche',
                            pl: 'Nazwa samochodu',
                            uk: 'Назва автомобіля',
                            'zh-cn': '车名',
                        },
                    });
                    await (0, utils_1.createState)(this, `${this.customerId}.${String(car.id)}`, 'License Plate', car.license_plate, {
                        name: {
                            en: 'License Plate',
                            de: 'Kennzeichen',
                            ru: 'Номерной знак',
                            pt: 'Placa do veículo',
                            nl: 'Kenteken',
                            fr: '"Plaque d\'immatriculation"',
                            it: 'Targa',
                            es: 'Matrícula',
                            pl: 'Numer rejestracyjny',
                            uk: 'Номерний знак',
                            'zh-cn': '车牌',
                        },
                    });
                    await (0, utils_1.createState)(this, `${this.customerId}.${String(car.id)}`, 'Mileage', car.optimized_mileage, {
                        name: {
                            en: 'Mileage',
                            de: 'Kilometerstand',
                            ru: 'Пробег',
                            pt: 'Quilometragem',
                            nl: 'Kilometerstand',
                            fr: 'Kilométrage',
                            it: 'Chilometraggio',
                            es: 'Kilometraje',
                            pl: 'Przebieg',
                            uk: 'Пробіг',
                            'zh-cn': '里程',
                        },
                    });
                    await (0, utils_1.createState)(this, `${this.customerId}.${String(car.id)}`, 'Created at', car.created_at, {
                        name: {
                            en: 'Created At',
                            de: 'Erstellt am',
                            ru: 'Создано',
                            pt: 'Criado em',
                            nl: 'Aangemaakt op',
                            fr: 'Créé le',
                            it: 'Creato il',
                            es: 'Creado el',
                            pl: 'Utworzono',
                            uk: 'Створено',
                            'zh-cn': '创建于',
                        },
                    });
                }
                else {
                    this.log.warn('customerId is undefined, cannot create structured state for car');
                }
            }
        })
            .catch(error => {
            this.log.error(`Error querying car device data: ${error.message}`);
        });
    }
    //	#### Helper ####
    //
    removeInvalidCharacters(inputString) {
        const regexPattern = '[^a-zA-Z0-9]+';
        const regex = new RegExp(regexPattern, 'gu');
        return inputString.replace(regex, '_');
    }
    async createCustomerFolder(customerId) {
        if (typeof customerId !== 'string' ||
            customerId.trim() === '' ||
            customerId === 'undefined' ||
            customerId === 'null') {
            this.log.warn('[createCustomerFolder] Invalid customerId');
            return;
        }
        const createdDevice = await (0, utils_1.createDevice)(this, customerId, {
            en: 'Customer ID',
            de: 'Kunden-ID',
            ru: 'Идентификатор клиента',
            pt: 'ID do cliente',
            nl: 'Klant-ID',
            fr: 'ID client',
            it: 'ID cliente',
            es: 'ID del cliente',
            pl: 'ID klienta',
            uk: 'Ідентифікатор клієнта',
            'zh-cn': '客户ID',
        });
        this.log.debug(`[createCustomerFolder] Customer "${createdDevice}"`);
    }
    async setupStart() {
        // Initialize the token manager
        //this.tokenManager = new TokenManager(this.adapter, this.email, this.password);
        await this.setObjectNotExistsAsync('Start', {
            type: 'state',
            common: {
                name: 'Start',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });
        this.subscribeStates('Start'); // for requesting data
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param callback Callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            if (this.dataUpdateInterval) {
                clearTimeout(this.dataUpdateInterval);
            }
            // ...
            callback();
        }
        catch (e) {
            this.log.debug(`[onUnload] ${JSON.stringify(e)}`);
            callback();
        }
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Pajdr(options);
}
else {
    // otherwise start the instance directly
    (() => new Pajdr())();
}
//# sourceMappingURL=main.js.map