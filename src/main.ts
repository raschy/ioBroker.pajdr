/*
 * Created with @iobroker/create-adapter v2.6.3
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import type * as utils from '@iobroker/adapter-core';
import { Adapter } from '@iobroker/adapter-core';
import { ApiManager } from './lib/apiManager';
import { TokenManager } from './lib/tokenManager';
import { createChannel, createDevice, createState } from './lib/utils';
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
	//private dataUpdateInterval: NodeJS.Timeout | null = null;
	//private dataUpdateInterval: NodeJS.Timeout | undefined;
	private dataUpdateInterval?: ReturnType<typeof this.setInterval>;
	private executionInterval = 5 * 60; // Sekunden, oder später aus config auslesen

	private customerId: string | undefined;
	private deviceId: string | undefined;
	private trackerId: string[] | undefined;
	//
	/**
	 * This method is called when the adapter starts.
	 * It initializes the token manager and API manager, retrieves the access token,
	 * and sets up the initial state of the adapter.
	 */
	async onReady(): Promise<void> {
		this.log.debug('Adapter started');
		//this.log.info(`#####  SERVER <-###-> TEST ${new Date().toISOString()}`);
		//console.log('Adapter startet ...');

		if (!this.config.email || !this.config.password) {
			this.log.error('❌ Email or password not set in configuration');
			return;
		}
		this.tokenManager = new TokenManager(this, this.config.email, this.config.password);
		this.apiManager = new ApiManager(this, this.tokenManager);

		try {
			await this.tokenManager.getAccessToken();
			//
			this.customerId = await this.tokenManager.getCustomerId();
			if (this.customerId === undefined) {
				this.log.error('❌ Customer ID could not be retrieved');
			} else {
				this.log.debug(`Got access token successfully`);
				this.log.info(`✅ Recieved Customer ID: ${this.customerId}`);
				await this.createCustomerFolder(this.customerId);
				//
				//##this.queryData();
				// timed request
				// Ersten Lauf sofort
    			await this.queryData();
    			// Danach zyklisch
    			this.startScheduler();
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
			console.log('############   API   ############');
			this.queryData();
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
		try {
			this.log.info('Requesting Customer Data from API...');
			this.customerId = await this.queryGetCustomer();
			this.log.info(`✅ Queried Customer ID: ${this.customerId}`);

		} catch (error: any) {
			this.log.error(`❌ Failed to load customer data: ${error.message}`);
		}
		//
		// API-Anfrage für Device
		try {
			this.log.info('Requesting tracker IDs from API...');
			this.trackerId = await this.queryGetDevice();

			if (Array.isArray(this.trackerId) && this.trackerId.length > 0) {
				this.log.info(`✅ Tracker IDs successfully loaded: ${this.trackerId.join(', ')}`);
			} else {
				this.log.warn('⚠️ No tracker IDs returned from API — check device configuration or credentials.');
				this.trackerId = []; // fallback to empty array
			}

		} catch (error: any) {
			this.log.error(`❌ Failed to load tracker IDs: ${error.message}`);
			this.trackerId = []; // ensure it’s at least defined
		}

		//
		this.queryGetCarDeviceData();
		//this.queryTrackerdata();
		//
		
		// API-Anfrage für AllLastPositions
		try {
			this.log.info('Requesting AllLastPositions from API...');
			const trackerIdsAsNumbers = (this.trackerId || []).map(id => Number(id)).filter(id => !isNaN(id));
			this.log.debug(`Converted tracker IDs to numbers: [${trackerIdsAsNumbers.join(', ')}]`);
			if (trackerIdsAsNumbers.length === 0) {
				this.log.warn('No valid tracker IDs available to request positions.');
				return;
			}
			this.queryAllLastPositions(trackerIdsAsNumbers);
		} catch (error: any) {
			this.log.error(`❌ Failed to load AllLastPositions: ${error.message}`);
		}
	}

	private async queryGetCustomer(): Promise<string | undefined> {
		this.log.debug('(queryGetCustomer#)');
		try {
			const customer = await this.apiManager.getCustomer();
			this.log.debug(`Customer ID: ${customer.id}, Name: ${customer.name}`);
			if (this.customerId !== undefined) {
				await createState(this, `${this.customerId}`, 'Company ID', customer.company_id, {
						name: {
							en: 'Company ID',
							de: 'Unternehmens-ID',
							nl: 'Bedrijfs-ID',
							ru: 'Идентификатор компании',
							pt: 'ID da Empresa',
							it: 'ID dell\'Azienda',
							fr: 'ID de l\'Entreprise',
							es: 'ID de la Empresa',
							pl: 'ID Firmy',
							uk: 'Ідентифікатор компанії',
							'zh-cn': '公司ID',
						},
				});
				await createState(this, `${this.customerId}`, 'User Name', customer.name, {
						name: {
							en: 'User Name',
							de: 'Benutzername',
							nl: 'Gebruikersnaam',
							ru: 'Имя пользователя',
							pt: 'Nome de Usuário',
							it: 'Nome Utente',
							fr: 'Nom d\'Utilisateur',
							es: 'Nombre de Usuario',
							pl: 'Nazwa Użytkownika',
							uk: 'Ім\'я користувача',
							'zh-cn': '用户名',
						},
					});
				await createState(this, `${this.customerId}`, 'Last Password Change', customer.last_password_change, {
						name: {
							en: 'Last Password Change',
							de: 'Letzte Passwortänderung',
							nl: 'Laatste Wachtwoordwijziging',
							ru: 'Последнее изменение пароля',
							pt: 'Última alteração de senha',
							it: 'Ultima modifica della password',
							fr: 'Dernière modification du mot de passe',
							es: 'Última modificación de la contraseña',
							pl: 'Ostatnia zmiana hasła',
							uk: 'ID Пристрою',
							'zh-cn': '设备ID',
						},
					});
				await createState(this, `${this.customerId}`, 'User Email', customer.email, {
						name: {
							en: 'User Email',
							de: 'Benutzer E-Mail',
							nl: 'Gebruiker E-mail',
							ru: 'Электронная почта пользователя',
							pt: 'E-mail do usuário',
							it: "E-mail dell'utente",
							fr: "E-mail de l'utilisateur",
							es: 'Correo electrónico del usuario',
							pl: 'E-mail użytkownika',
							uk: 'Електронна пошта користувача',
							'zh-cn': '用户电子邮件',
						},
				});					
				return String(customer.id);
			} else {
				this.log.warn('❌ Customer ID is undefined, cannot create structured state for device');
			}
		} catch (error: any) {
			this.log.error(`Error querying device data: ${error.message}`);
			return undefined;
		}
	}

	private async queryGetDevice(): Promise<string[] | undefined> {
		this.log.debug('(queryGetDevice#)');
		let trackerId: string[] = [];
		try {
			const DeviceData = await this.apiManager.getDevice();
			for (const dev of DeviceData) {
				this.log.debug(`Device ID: ${dev.id}, Name: ${dev.name}`);
				if (this.customerId !== undefined) {
					trackerId.push(String(dev.id));
					await createChannel(this, this.customerId, String(dev.id), {
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
					await createState(this, `${this.customerId}.${String(dev.id)}`, 'IMEI', dev.imei, {
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
					await createState(this, `${this.customerId}.${String(dev.id)}`, 'Car Device ID', dev.carDevice_id, {
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
				} else {
					this.log.warn('customerId is undefined, cannot create structured state for device');
				}
			}
			return trackerId;
		} catch (error: any) {
			this.log.error(`Error querying device data: ${error.message}`);
			return undefined;
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
						await createChannel(this, this.customerId, String(car.id), {
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
						await createState(
							this,
							`${this.customerId}.${String(car.id)}`,
							'Vehicle Manufacturer',
							car.car_name,
							{
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
							},
						);
						await createState(
							this,
							`${this.customerId}.${String(car.id)}`,
							'License Plate',
							car.license_plate,
							{
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
							},
						);
						await createState(
							this,
							`${this.customerId}.${String(car.id)}`,
							'Mileage',
							car.optimized_mileage,
							{
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
							},
						);
						await createState(this, `${this.customerId}.${String(car.id)}`, 'Created at', car.created_at, {
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
					} else {
						this.log.warn('customerId is undefined, cannot create structured state for car');
					}
				}
			})
			.catch(error => {
				this.log.error(`Error querying car device data: ${error.message}`);
			});
	}

	private queryTrackerdata(): void {
		// This method is called when data should be requested
		this.log.debug('(queryTrackerdata#)');
		this.log.debug(`Calling getTrackerdata from ApiManager with dummy device ID [${this.deviceId}]`);
		// API-Request für CarDeviceData
		this.apiManager
			.getTrackerdata()
			.then(async data => {
				// and here you can process the car data
				this.log.debug(`Tracker Data: ${JSON.stringify(data)}`);
			})
			.catch(error => {
				this.log.error(`Error querying tracker data: ${error.message}`);
			});
	}

private queryAllLastPositions(id: number[]): void {
	// This method is called when data should be requested
	this.log.debug(`Calling getAllLastPositions from ApiManager with device IDs [${id.join(', ')}]`);
	let lastPosition: Trackerdata | undefined;
	// API-Request für CarDeviceData
	this.apiManager
		.getAllLastPositions(id)
		.then(async positions => {
			// and here you can process the car data
			for (const position of positions) {
				console.log(`[${this.customerId}] Position ID: ${position.id}, Latitude: ${Math.round(position.lat * 10000) / 10000}, Longitude: ${Math.round(position.lng * 10000) / 10000}`);
				this.log.debug(`Position ID: ${position.id}, Latitude: ${Math.round(position.lat * 10000) / 10000}, Longitude: ${Math.round(position.lng * 10000) / 10000}`);
				lastPosition = position;
			}

			if (!lastPosition) {
				this.log.warn('No positions returned from API, skipping position state creation.');
				return;
			}

			await createChannel(this, String(this.customerId), 'Position', {
				en: 'Position',
				de: 'Position',
				ru: 'Позиция',
				pt: 'Posição',
				nl: 'Positie',
				fr: 'Position',
				it: 'Posizione',
				es: 'Posición',
				pl: 'Pozycja',
				uk: 'Позиція',
				'zh-cn': '位置',
			});

			await createState(this, this.customerId+'.position', 'Latitude', lastPosition.lat, {
				name: {
					en: 'Latitude',
					de: 'Breitengrad',
					nl: 'Breedtegraad',
					ru: 'Широта',
					pt: 'Latitude',
					it: 'Latitudine',
					fr: 'Position',
					es: 'Posición',
					pl: 'Pozycja',
					uk: 'Позиція',
					'zh-cn': '位置',
				},
			});
			await createState(this, this.customerId+'.position', 'Longitude', lastPosition.lng, {
				name: {
					en: 'Longitude',
					de: 'Längengrad',
					nl: 'Lengtegraad',
					ru: 'Долгота',
					pt: 'Longitude',
					it: 'Longitudine',
					fr: 'Position',
					es: 'Posición',
					pl: 'Pozycja',
					uk: 'Позиція',
					'zh-cn': '位置',
				},
			});
		})
		.catch(error => {
			this.log.error(`Error querying car device data: ${error.message}`);
		});

}

	
	//	#### Helper ####
	//

	removeInvalidCharacters(inputString: string): string {
		const regexPattern = '[^a-zA-Z0-9]+';
		const regex = new RegExp(regexPattern, 'gu');
		return inputString.replace(regex, '_');
	}

	private async createCustomerFolder(customerId: string | undefined): Promise<void> {
		if (
			typeof customerId !== 'string' ||
			customerId.trim() === '' ||
			customerId === 'undefined' ||
			customerId === 'null'
		) {
			this.log.warn('(createCustomerFolder) Invalid customerId');
			return;
		}

		const createdDevice = await createDevice(this, customerId, {
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
		this.log.debug(`(createCustomerFolder) Customer "${createdDevice}"`);
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

	private startScheduler(): void {
    	if (!this.executionInterval || this.executionInterval <= 0) {
        	this.log.warn("Execution interval is not valid. Using default of 60 seconds.");
       		this.executionInterval = 60;
    	}

    	this.dataUpdateInterval = this.setInterval(async () => {
        	try {
            	await this.queryData();
        	} catch (err: any) {
            	this.log.error(`Error in scheduler: ${err.message}`);
        	}
    	}, this.executionInterval * 1000);

    	this.log.info(`Scheduler started, polling API every ${this.executionInterval} seconds.`);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 *
	 * @param callback Callback
	 */
	private onUnload(callback: () => void): void {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			/*
			if (this.dataUpdateInterval !== null) {
				clearInterval(this.dataUpdateInterval);
				this.dataUpdateInterval = null;
			}
			*/
			if (this.dataUpdateInterval) {
            this.clearInterval(this.dataUpdateInterval);
        	}
			// ...
			callback();
		} catch (e) {
			this.log.debug(`(onUnload) ${JSON.stringify(e)}`);
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
