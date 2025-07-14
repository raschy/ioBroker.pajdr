
export class ApiManager {
	private tokenManager: any;
	private baseUrl: string = 'https://connect.paj-gps.de/api/v1/';

	constructor(
		private readonly adapter: ioBroker.Adapter,
		tokenManager: any
	) {
		this.tokenManager = tokenManager;
	}

	/**
	 * @description Get Customer Data (explicit User-ID)
	 * @returns {Promise<number>} The User-ID of the customer
	 */
	async getCustomer(): Promise<number> {
		const url: string = `${this.baseUrl}customer`;
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
			const userId: number = dataSuccess.id;
			this.adapter.log.info(`[getCustomer] User ID: ${userId}`);
			return userId;
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.adapter.log.error('[getCustomer] Error: ' + error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				this.adapter.log.error('[getCustomer] Unknown error: ' + error);
				throw new Error('Unknown error occurred');
			}
		}
	}

	async getDevice(): Promise<DeviceData[]> {
		const url: string = `${this.baseUrl}device`;
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

			const raw = await response.json() as DeviceRaw;
			//console.log('[getDevice] Raw: ', raw);
			if (!raw.success || !Array.isArray(raw.success)) {
				throw new Error('[getDevice] Invalid response format: success is not an array');
			}
			console.log('[getDevice] Count: ', raw.number_of_records);
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

	async getCarDeviceData(): Promise<CarData[]> {
		const url: string = `${this.baseUrl}sdevice/car`;
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

}	