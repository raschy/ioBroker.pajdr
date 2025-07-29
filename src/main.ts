/*
 * Created with @iobroker/create-adapter v2.6.3
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import type * as utils from '@iobroker/adapter-core';
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
	private customerId: string | undefined;
	//
	/**
	 * This method is called when the adapter starts.
	 * It initializes the token manager and API manager, retrieves the access token,
	 * and sets up the initial state of the adapter.
	 */
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
			this.customerId = await this.tokenManager.getCustomerId();
			if (this.customerId === undefined) {
				this.log.error('Customer ID could not be retrieved');
			} else {
				this.log.debug(`Got access token successfully`);
				this.log.info(`customerId: ${this.customerId}`);
				await this.createCustomerFolder(this.customerId);
				//
				//await this.storeDataToState("device1", "online", true);
				//await this.storeDataToState("device1", "room1", 23.5, { channelId: "temperatures" });
				//await this.storeDataToState("device1", "room2", 21.5, { channelId: "building.floor1", name: "Raumtemperatur EG" });
				//await this.storeDataToState("device1", "room3", -14.1, { channelId: "building.floor1.left" });
				//
				await this.setupStart();
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
			await this.queryData();
			//
			// Hier können Sie weitere API-Aufrufe oder Logik hinzufügen, die auf den Statusänderungen basieren.
			// The state was deleted
			// this.log.info(`state ${id} deleted`);
		}
	}

	private async queryData(): Promise<void> {
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
		await this.queryGetDevice();
		this.queryGetCarDeviceData();
	}

	private async queryGetDevice(): Promise<void> {
		this.log.debug('(queryGetDevice#)');

		try {
			const device = await this.apiManager.getDevice();
			await this.makeManualLinks(device);

			for (const dev of device) {
				this.log.debug(`Device ID: ${dev.id}, Name: ${dev.name}`);
				// await this.storeDataToState(dev.id, 'Name', dev.name);
			}
		} catch (error: any) {
			this.log.error(`Error querying device data: ${error.message}`);
		}
	}

	private async makeManualLinks(device: Device[]): Promise<void> {
		// This method is called to create links for the manuals
		this.log.debug('[makeManualLinks#]');
		// You can add your logic here to create links based on the device data
		const device_models = device[0].device_models;
		if (device_models && device_models.length > 0) {
			let manual_link: ManualLinkMap | null = null;
			if (typeof device_models[0].manual_link === 'string') {
				manual_link = JSON.parse(device_models[0].manual_link) as ManualLinkMap;
			} else if (typeof device_models[0].manual_link === 'object' && device_models[0].manual_link !== null) {
				manual_link = device_models[0].manual_link;
			}
			if (manual_link) {
				//console.log('[getDevice] Manual Link: ', manual_link);
				//console.log('[getDevice] Manual Link DE: ', manual_link.de);
				//this.storeDataToState('manualLink', manual_link.de);
				if (this.customerId !== undefined) {
					await this.storeDataToState(this.customerId, 'manualLink', manual_link.de);
				} else {
					this.log.warn('[makeManualLinks] customerId is undefined, cannot store manual link');
				}
			} else {
				this.log.warn('[makeManualLinks] No manual link available');
			}
		} else {
			this.log.warn('[makeManualLinks] No device models found');
		}
	}

	private queryGetCarDeviceData(): void {
		// This method is called when data should be requested
		this.log.debug('(queryGetCarDeviceData#)');
		// API-Request für CarDeviceData
		this.apiManager
			.getCarDeviceData()
			.then(async carData => {
				// and here you can process the car data
				for (const car of carData) {
					//#console.log(`car: ${JSON.stringify(car)}`);
					this.log.debug(`Car ID: ${car.id}, Name: ${car.car_name}`);
					// Create a folder for each car
					if (this.customerId !== undefined) {
						await this.storeDataToState(this.customerId, 'CarName', car.car_name, {
							channelId: String(car.id),
						});
						await this.storeDataToState(this.customerId, 'LicensePlate', car.license_plate, {
							channelId: String(car.id),
						});
						await this.storeDataToState(this.customerId, 'Mileage', car.optimized_mileage, {
							channelId: String(car.id),
						});
						await this.storeDataToState(this.customerId, 'CreatedAt', car.created_at, {
							channelId: String(car.id),
						});
					} else {
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

	async createCustomerFolder(customerId: string | undefined): Promise<void> {
		if (!customerId) {
			this.log.warn('[createCustomerFolder] Invalid customerId');
			return;
		}
		const dp_customerId = this.removeInvalidCharacters(customerId);
		this.log.debug(`[createCustomerFolder] Customer "${dp_customerId}"`);
		await this.setObjectNotExistsAsync(dp_customerId, {
			type: 'device',
			common: {
				name: dp_customerId,
			},
			native: {},
		});
		//
		await this.extendObject(dp_customerId, {
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

	async storeDataToState(
		deviceId: string,
		stateId: string,
		value: any,
		options?: {
			channelId?: string;
			name?: string;
			role?: string;
			read?: boolean;
			write?: boolean;
		},
	): Promise<void> {
		const devicePath = deviceId;
		const channelId = options?.channelId;
		const statePath = channelId ? `${deviceId}.${channelId}.${stateId}` : `${deviceId}.${stateId}`;

		// Typ automatisch erkennen
		const detectedType: ioBroker.CommonType = typeof value as ioBroker.CommonType;
		if (!['number', 'string', 'boolean'].includes(detectedType)) {
			throw new Error(`Unsupported state value type: ${detectedType}`);
		}

		// Role automatisch zuweisen, falls nicht gesetzt
		let role: string;
		if (options?.role) {
			role = options.role;
		} else {
			switch (detectedType) {
				case 'number':
					role = 'value';
					break;
				case 'boolean':
					role = 'indicator';
					break;
				case 'string':
					role = 'text';
					break;
				default:
					role = 'state';
			}
		}

		const stateCommon: ioBroker.StateCommon = {
			name: options?.name || stateId,
			type: detectedType,
			role,
			read: options?.read ?? true,
			write: options?.write ?? false,
		};

		// 1. Device anlegen
		const existingDevice = await this.getObjectAsync(devicePath);
		if (!existingDevice) {
			await this.setObjectNotExistsAsync(devicePath, {
				type: 'device',
				common: { name: deviceId },
				native: {},
			});
		} else if (existingDevice.type !== 'device') {
			this.log.warn(
				`[createStructuredState] '${devicePath}' exists but is type '${existingDevice.type}', expected 'device'`,
			);
		}

		// 2. Channel-Struktur erzeugen (falls vorhanden)
		if (channelId) {
			const parts = channelId.split('.');
			let path = devicePath;

			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				path = `${path}.${part}`;
				const isLast = i === parts.length - 1;
				const expectedType: ioBroker.ObjectType = isLast ? 'channel' : 'folder';

				const existing = await this.getObjectAsync(path);
				if (!existing) {
					await this.setObjectNotExistsAsync(path, {
						type: expectedType,
						common: { name: part },
						native: {},
					});
				} else if (existing.type !== expectedType) {
					this.log.warn(
						`[createStructuredState] '${path}' exists but is type '${existing.type}', expected '${expectedType}'`,
					);
				}
			}
		}

		// 3. State anlegen (mit Konfliktprüfung)
		const existingObj = await this.getObjectAsync(statePath);
		if (existingObj && existingObj.type !== 'state') {
			this.log.warn(
				`[createStructuredState] Cannot create state at '${statePath}', object of type '${existingObj.type}' already exists there.`,
			);
			return;
		}

		await this.setObjectNotExistsAsync(statePath, {
			type: 'state',
			common: stateCommon,
			native: {},
		});

		// 4. Wert setzen
		await this.setState(statePath, { val: value, ack: true });
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 *
	 * @param callback Callback
	 */
	private onUnload(callback: () => void): void {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			if (this.dataUpdateInterval) {
				clearTimeout(this.dataUpdateInterval);
			}
			// ...
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
