/**
 * @file ApiManager.ts
 * @description This file contains the ApiManager class which handles API requests to the Paj GPS service.
 * It includes methods to get customer data, device data, and car device data.
 */
export class ApiManager {
	private tokenManager: any;
	private baseUrl: string = 'https://connect.paj-gps.de/api/v1/';

	/**
	 *
	 * @param adapter The ioBroker adapter instance.
	 * @description Initializes the ApiManager with the adapter and token manager.
	 * @throws Will throw an error if the adapter is not provided.
	 * @throws Will throw an error if the token manager is not provided.
	 * @description The ioBroker adapter instance.
	 * @param tokenManager any
	 */
	constructor(
		private readonly adapter: ioBroker.Adapter,
		tokenManager: any,
	) {
		this.tokenManager = tokenManager;
	}

	/**
	 * @description Get Customer Data (explicit User-ID)
	 * @returns The User-ID of the customer
	 */
	async getCustomer(): Promise<number> {
		const url = `${this.baseUrl}customer`;
		this.adapter.log.debug(`[getCustomer] URL: ${url}`);
		const token: string = await this.tokenManager.getAccessToken();

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});
			//console.log('RESPONSE: ', response);
			//console.log('Status: ', response.status);

			if (!response.ok) {
				throw new Error(`[getCustomer] Failed to retrieve data: ${response.statusText}`);
			}

			const raw: CustomerRaw = (await response.json()) as CustomerRaw;
			//console.log('DATA getCustomer: ', raw);
			const dataSuccess: CustomerData = raw.success;
			//console.log('SUCCESS', dataSuccess);
			const customerId: number = dataSuccess.id;
			this.adapter.log.info(`[getCustomer] Customer ID: ${customerId}`);
			return customerId;
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.adapter.log.error(`[getCustomer] Error: ${error.message}`);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				const errMsg =
					typeof error === 'object' && error !== null && 'stack' in error
						? `[getCustomer] Unknown error: ${(error as { stack?: string }).stack}`
						: `[getCustomer] Unknown error: ${String(error)}`;
				this.adapter.log.error(errMsg);
				throw new Error('Unknown error occurred');
			}
		}
	}

	/**
	 * @returns DeviceData[]
	 * @description Get Device Data
	 */
	async getDevice(): Promise<DeviceData[]> {
		const url = `${this.baseUrl}device`;
		this.adapter.log.debug(`[getDevice] URL: ${url}`);
		const token: string = await this.tokenManager.getAccessToken();

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});
			//console.log('RESPONSE: ', response);

			if (!response.ok) {
				throw new Error(`[getDevice] Failed to retrieve data: ${response.statusText}`);
			}

			const raw = (await response.json()) as DeviceRaw;
			//console.log('[getDevice] Raw: ', raw);
			if (!raw.success || !Array.isArray(raw.success)) {
				throw new Error('[getDevice] Invalid response format: success is not an array');
			}
			//console.log('[getDevice] Count: ', raw.number_of_records);
			//
			if (raw.number_of_records === 0) {
				this.adapter.log.warn('[getDevice] No devices found');
				return [];
			}
			//
			const deviceData: DeviceData[] = raw.success;
			return deviceData;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getDevice] Error:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getDevice] Unknown error:', error);
				throw new Error('Unknown error occurred');
			}
		}
	}

	/**
	 * @returns CarData[]
	 * @description Get Car Device Data
	 */
	async getCarDeviceData(): Promise<CarData[]> {
		const url = `${this.baseUrl}sdevice/car`;
		this.adapter.log.debug(`[getCarDeviceData] URL: ${url}`);
		const token: string = await this.tokenManager.getAccessToken();

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`[getCarDeviceData] Failed to retrieve data: ${response.statusText}`);
			}

			const data: CarDataRaw = (await response.json()) as CarDataRaw;
			//console.log('RAW', data);
			const dataSuccess: CarData[] = data.success;
			//console.log('SUCCESS', dataSuccess);
			return dataSuccess;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getCarDeviceData] Error:', error.message);
				throw error; // Rethrow error to inform caller
			} else {
				console.error('[getCarDeviceData] Unknown error:', error);
				throw new Error('Unknown error occurred');
			}
		}
	}

	async getAllLastPositions(deviceIDs: number[], fromLastPoint = false): Promise<Position[]> {
    	const url = `${this.baseUrl}trackerdata/getalllastpositions`;
    	this.adapter.log.debug(`[getAllLastPositions] URL: ${url}`);

    	const token: string = await this.tokenManager.getAccessToken();

    	try {
        	const payload = { deviceIDs, fromLastPoint };

        	const response = await fetch(url, {
            	method: "POST",
            	headers: {
                	Authorization: `Bearer ${token}`,
                	"Content-Type": "application/json",
            	},
            	body: JSON.stringify(payload),
        	});

			this.adapter.log.debug(`[getAllLastPositions] PayLoad: ${JSON.stringify(payload)}`);
			this.adapter.log.debug(`[getAllLastPositions] Response: ${JSON.stringify(response)}`);
			//this.adapter.log.debug(`[getAllLastPositions] Response Body: ${JSON.stringify(await response.json())}`);

        	if (!response.ok) {
            	throw new Error(`[getAllLastPositions] Failed: ${response.status} ${response.statusText}`);
        	}

        	const data = (await response.json()) as GetAllLastPositionsResponse;

        	console.log(`[getAllLastPositions] DatA: ${JSON.stringify(data)}`);

        	// Logs der Positionen
        	for (const pos of data.success) {
            	this.adapter.log.info(
                	`Position ID: ${pos.id}, Latitude: ${pos.lat}, Longitude: ${pos.lng}`
            	);
        	}

        	return data.success;
    	} catch (err: any) {
        	this.adapter.log.error(`[getAllLastPositions] Error: ${err.message}`);
        	throw err;
    	}
	}

}