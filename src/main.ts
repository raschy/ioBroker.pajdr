/*
 * Created with @iobroker/create-adapter v2.6.3
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { Adapter } from '@iobroker/adapter-core';
import { ApiManager } from './lib/apiManager';
import { TokenManager } from './lib/tokenManager';
//import { writeLog } from './lib/filelogger';
//const fileHandle = { path: '/home/raschy/ioBroker.pajdr', file: 'logs1.txt' };

// Load your modules here, e.g.:

class Pajdr extends Adapter {
	private tokenManager!: TokenManager;
	private apiManager!: ApiManager;

	constructor(options: Partial<utils.AdapterOptions> = {}) {
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
	private dataUpdateInterval: NodeJS.Timeout | undefined;
	private userId: number | undefined;
	//
	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async _onReady(): Promise<void> {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		const user_name: string = this.config.email;
		const user_pass: string = this.config.password;
		//let updateInterval: number = 10; //this.config.updateIntervall;
		//
		const executionInterval = 360;
		//
		const dataDir: string = utils.getAbsoluteDefaultDataDir();
		console.log(`DIR ${dataDir}`);
		//
		//
		//await this.callData(user_name, user_pass);

		// ####### LOOP #######
		//if (this.internDataReady) {
		// timed data request
		//this.dataUpdateInterval = setTimeout(() => this.callData(user_name, user_pass), executionInterval * 1000);
		//}
	}

	async onReady(): Promise<void> {
		this.log.info('Adapter is ready');

		if (!this.config.email || !this.config.password) {
			this.log.error('Email or password not set in configuration');
			return;
		}

		this.tokenManager = new TokenManager(this, this.config.email, this.config.password);
		this.apiManager = new ApiManager(this, this.tokenManager);

		try {
			await this.tokenManager.getAccessToken();
			//
			this.userId = await this.tokenManager.getUserId();
			if (this.userId === undefined) {
				this.log.error('User ID could not be retrieved');
			} else {
				this.log.debug(`Got access token successfully`);
				this.log.info(`UserId: ${this.userId}`);
				this.createCustomerFolder(this.userId);
				//
				this.setupStart();
			}
		} catch (err: any) {
			this.log.error(`Authentication failed: ${err.message}`);
		}
		this.log.info('Adapter is initialized.');
	}

	private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
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

	private queryData(): void {
		// This method is called when data should be requested
		this.log.debug('(queryData#)');
		// API-Anfrage für Customer
		this.apiManager.getCustomer()
			.then((userId) => {
				this.log.info(`Queried Customer ID: ${userId}`);
				// You can also set the state with the queried data
				//this.setState('customer.userId', { val: userId, ack: true });
			})
			.catch((error) => {
				this.log.error(`Error querying customer data: ${error.message}`);
			});
		// API-Anfrage für Device
		this.queryGetDevice(); // funktioniert
		this.queryGetCarDeviceData();
	}

	private queryGetDevice(): void {
		// This method is called when data should be requested
		this.log.debug('(queryGetDevice#)');
		// API-Request für Device
		this.apiManager.getDevice()
			.then((device) => {
				makeManualLinks.call(this, device);
				// and here you can process the device data
				for (const dev of device) {
					//console.log(`dev: ${JSON.stringify(dev)}`);
					this.log.debug(`Device ID: ${dev.id}, Name: ${dev.name}`);
					// Create a folder for each device
					this.storeDataToState('Name', dev.name);
					this.storeDataToState('ModelNr', dev.model_nr);
				}
			})
			.catch((error) => {
				this.log.error(`Error querying device data: ${error.message}`);
			});
		// 
		function makeManualLinks(this: Pajdr, device: Device[]): void {
			// This method is called to create links for the manuals
			this.log.silly('[makeManualLinks#]');
			// You can add your logic here to create links based on the device data
			const device_models = device[0].device_models;
			if (device_models && device_models.length > 0) {
				let manual_link: ManualLinkMap | null = null;
				if (typeof device_models[0].manual_link === 'string') {
					manual_link = JSON.parse(device_models[0].manual_link as string) as ManualLinkMap;
				} else if (typeof device_models[0].manual_link === 'object' && device_models[0].manual_link !== null) {
					manual_link = device_models[0].manual_link as ManualLinkMap;
				}
				if (manual_link) {
					//console.log('[getDevice] Manual Link: ', manual_link);
					//console.log('[getDevice] Manual Link DE: ', manual_link.de);
					this.storeDataToState('manualLink', manual_link.de);
				} else {
					this.log.warn('[getDevice] No manual link available');
				}
			} else {
				this.log.warn('[getDevice] No device models found');
			}
		}
	}

	private queryGetCarDeviceData(): void {
		// This method is called when data should be requested
		this.log.debug('(queryGetCarDeviceData#)');
		// API-Request für CarDeviceData
		this.apiManager.getCarDeviceData()
			.then((carData) => {
				// and here you can process the car data
				for (const car of carData) {
					//console.log(`car: ${JSON.stringify(car)}`);
					this.log.debug(`Car ID: ${car.id}, Name: ${car.car_name}`);
					// Create a folder for each car
					this.storeDataToState('CarName', car.car_name);
					this.storeDataToState('ModelName', car.model_name);
					this.storeDataToState('LicensePlate', car.license_plate);
					this.storeDataToState('Mileage', car.optimized_mileage);
					this.storeDataToState('CreatedAt', car.created_at);
				}
			})
			.catch((error) => {
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
	removeInvalidCharacters(inputString: string): string {
		const regexPattern = '[^a-zA-Z0-9]+';
		const regex = new RegExp(regexPattern, 'gu');
		return inputString.replace(regex, '_');
	}

	storeDataToState(id: string, value: any): void {
		//this.log.debug(`[storeDataToState] Storing data for User: ${this.userId} ID: ${id}, Value: ${value}`);
		const dp_DeviceId = (this.removeInvalidCharacters(String(this.userId))) + '.' + this.removeInvalidCharacters(id);
		// Create the state if it does not exist
		this.setObjectNotExistsAsync(dp_DeviceId, {
			type: 'state',
			common: {
				name: id,
				type: Array.isArray(value)
					? 'array'
					: value === null
						? 'mixed'
						: typeof value === 'boolean'
							? 'boolean'
							: typeof value === 'number'
								? 'number'
								: typeof value === 'object'
									? 'object'
									: 'string',
				role: 'state',
				read: true,
				write: false,
			},
			native: {},
		})
			.then(() => {
				// Set the value of the state
				this.setState(dp_DeviceId, { val: value, ack: true })
					.then(() => {
						this.log.debug(`[storeDataToState] State "${dp_DeviceId}" set to "${value}"`);
					})
					.catch((error) => {
						this.log.error(`[storeDataToState] Error setting state ${dp_DeviceId}: ${error.message}`);
					});
			})
			.catch((error) => {
				this.log.error(`[storeDataToState] Error creating state ${dp_DeviceId}: ${error.message}`);
			});
	}

	storeDataToState_X(id: string, value: any, folder: string): void {
		//this.log.debug(`[storeDataToState] Storing data for User: ${this.userId} ID: ${id}, Value: ${value}`);
		const dp_DeviceId = (this.removeInvalidCharacters(String(this.userId))) + '.' + this.removeInvalidCharacters(id);
		// Create the state if it does not exist
		this.setObjectNotExistsAsync(dp_DeviceId, {
			type: 'state',
			common: {
				name: id,
				type: Array.isArray(value)
					? 'array'
					: value === null
						? 'mixed'
						: typeof value === 'boolean'
							? 'boolean'
							: typeof value === 'number'
								? 'number'
								: typeof value === 'object'
									? 'object'
									: 'string',
				role: 'state',
				read: true,
				write: false,
			},
			native: {},
		})
			.then(() => {
				// Set the value of the state
				this.setState(dp_DeviceId, { val: value, ack: true })
					.then(() => {
						this.log.debug(`[storeDataToState] State "${dp_DeviceId}" set to "${value}"`);
					})
					.catch((error) => {
						this.log.error(`[storeDataToState] Error setting state ${dp_DeviceId}: ${error.message}`);
					});
			})
			.catch((error) => {
				this.log.error(`[storeDataToState] Error creating state ${dp_DeviceId}: ${error.message}`);
			});
	}

	async createDeviceFolder(userId: number | undefined): Promise<void> {
		if (!userId) {
			this.log.warn('[createCustomerFolder] Invalid userId');
			return;
		}
		const dp_UserId = this.removeInvalidCharacters(String(userId));
		this.log.debug(`[createCustomerFolder] User "${dp_UserId}"`);
		await this.setObjectNotExistsAsync(dp_UserId, {
			type: 'device',
			common: {
				name: dp_UserId,
			},
			native: {},
		});
		//
		await this.extendObject(dp_UserId, {
			common: {
				name: {
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
				},
			},
		});
	}

	async createCustomerFolder(userId: number | undefined): Promise<void> {
		if (!userId) {
			this.log.warn('[createCustomerFolder] Invalid userId');
			return;
		}
		const dp_UserId = this.removeInvalidCharacters(String(userId));
		this.log.debug(`[createCustomerFolder] User "${dp_UserId}"`);
		await this.setObjectNotExistsAsync(dp_UserId, {
			type: 'device',
			common: {
				name: dp_UserId,
			},
			native: {},
		});
		//
		await this.extendObject(dp_UserId, {
			common: {
				name: {
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
				},
			},
		});
	}

	private async setupStart(): Promise<void> {
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
	private onUnload(callback: () => void): void {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			if (this.dataUpdateInterval) {
				clearTimeout(this.dataUpdateInterval);
			}
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			this.log.debug(`[onUnload] ${JSON.stringify(e)}`);
			callback();
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Pajdr(options);
} else {
	// otherwise start the instance directly
	(() => new Pajdr())();
}
