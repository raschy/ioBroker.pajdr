import fs from 'fs';
import fetch from 'node-fetch'; // Ab Node 18 kannst du dies weglassen
import * as path from 'path';

interface TokenResponse {
	success: {
		token: string;
		expires_in: number;
		userID: number;
	};
}

export class ApiManager {
	private email: string;
	private password: string;
	private tokenFilePath: string = 'token.txt';
	private storedToken: string | null = null;
	private tokenExpiry: number | null = null;

	constructor(email: string, password: string) {
		this.email = email;
		this.password = password;
	}

	async getToken(): Promise<string> {
		//const url = `https://connect.paj-gps.de/api/v1/login?email=${encodeURIComponent(this.email)}&password=${encodeURIComponent(this.password)}`;
		const baseUrl = 'https://connect.paj-gps.de/api/v1/login?email=';
		const urlBinder: string = '&password=';
		const url = [baseUrl, encodeURIComponent(this.email), urlBinder, encodeURIComponent(this.password)].join('');
		console.log(`[getToken] Url: ${url}`);
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error('Login failed: ' + response.statusText);
		}

		const data: TokenResponse = (await response.json()) as TokenResponse;
		this.storedToken = data.success.token;
		this.tokenExpiry = Date.now() + data.success.expires_in * 1000;
		console.log(this.tokenExpiry, this.timestampToDate(this.tokenExpiry));
		return data.success.token;
	}

	async saveToken(token: string): Promise<void> {
		await fs.promises.writeFile(this.tokenFilePath, token, 'utf8');
	}

	async loadToken(): Promise<string> {
		try {
			const token = await fs.promises.readFile(this.tokenFilePath, 'utf8');
			this.storedToken = token;
			return token;
		} catch (error) {
			throw new Error('Token konnte nicht gelesen werden: ' + (error as Error).message);
		}
	}

	async getCustomer(): Promise<number> {
		const url: string = 'https://connect.paj-gps.de/api/v1/customer';
		console.log(`[getCustomer] URL: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.storedToken}`,
					'Content-Type': 'application/json',
				},
			});
			//console.log('RESPONSE: ', response);
			//console.log('Status: ', response.status);

			if (!response.ok) {
				throw new Error('[getCustomer] Datenabruf fehlgeschlagen: ' + response.statusText);
			}

			const data: CustomerRaw = (await response.json()) as CustomerRaw;
			//console.log('DATA: ', data);
			const dataSuccess: Customer = data.success;
			//console.log('SUCCESS', dataSuccess);
			const userId: number = dataSuccess.id;
			return userId;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getCustomer] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getCustomer] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	async getDevice(): Promise<CarData[]> {
		const url: string = 'https://connect.paj-gps.de/api/v1/device';
		console.log(`[getDevice] URL: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.storedToken}`,
					'Content-Type': 'application/json',
				},
			});
			//console.log('RESPONSE: ', response);

			if (!response.ok) {
				throw new Error('[getDevice] Datenabruf fehlgeschlagen: ' + response.statusText);
			}
			const data: CarDataRaw = (await response.json()) as CarDataRaw;
			//console.log('RAW', data);
			const dataSuccess: CarData[] = data.success;
			//console.log('SUCCESS', dataSuccess);
			//console.log(dataSuccess.length); // Access length property
			//console.log(dataSuccess[0]); // Access the first element
			return dataSuccess;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getDevice] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getDevice] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	async getCarDeviceData(): Promise<CarData[]> {
		const url: string = 'https://connect.paj-gps.de/api/v1/sdevice/car';
		console.log(`[getCarDeviceData] URL: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.storedToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('[getCarDeviceData] Datenabruf fehlgeschlagen: ' + response.statusText);
			}

			const data: CarDataRaw = (await response.json()) as CarDataRaw;
			//console.log('RAW', data);
			const dataSuccess: CarData[] = data.success;
			//console.log('SUCCESS', dataSuccess);
			//console.log(dataSuccess.length); // Access length property
			//console.log(dataSuccess[0]); // Access the first element
			return dataSuccess;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getCarDeviceData] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getCarDeviceData] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	async getSingleCarDeviceData(carId: number): Promise<CarData[]> {
		//const url: string = 'https://connect.paj-gps.de/api/v1/sdevice/car/452';
		const baseUrl = 'https://connect.paj-gps.de/api/v1/sdevice/car/';
		const url = [baseUrl, carId].join('');
		console.log(`[getSingleCarDeviceData] URL: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.storedToken}`,
					'Content-Type': 'application/json',
				},
			});
			if (!response.ok) {
				throw new Error('[getSingleCarDeviceData] Datenabruf fehlgeschlagen: ' + response.statusText);
			}
			const data: CarDataRaw = (await response.json()) as CarDataRaw;
			//console.log('RAW', data);
			const dataSuccess: CarData[] = data.success;
			//console.log('SUCCESS', dataSuccess);
			//console.log(dataSuccess.length); // Access length property
			//console.log(dataSuccess[0]); // Access the first element
			return dataSuccess;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getSingleCarDeviceData] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getSingleCarDeviceData] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	async getGeofences(): Promise<GeoFence[]> {
		const url = 'https://connect.paj-gps.de/api/v1/geofences';
		console.log(`[getGeofences] URL: ${url}`);
		//const body = { "deviceIDs": [1312315] };
		//
		//	 "message": "The GET method is not supported for route api/v1/geofences. Supported methods: POST." >> 405
		//	 "message": "Server Error" >> 500
		//
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.storedToken}`,
				},
				body: '{ "deviceIDs": [1312315] }',
			});
			//console.log('RESPONSE', response);

			if (!response.ok) {
				throw new Error('[getGeofences] Datenabruf fehlgeschlagen: ' + response.statusText);
			}

			const data: GeoFencesRaw = (await response.json()) as GeoFencesRaw;
			//console.log('GeoFencesRaw ', data);
			const dataSuccess: GeoFence[] = data.success;

			//console.log('SUCCESS', dataSuccess);
			//console.log(dataSuccess.length); // Access length property
			//console.log(dataSuccess[0]); // Access the first element
			return dataSuccess;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getGeofences] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getGeofences] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	async getRoute(deviceId: number, timestamp: number): Promise<any> {
		const url = 'https://api.paj-gps.com/api/v1/route/export';
		console.log(`[getRoute] URL: ${url}`);
		const deviceArr: number[] = [];
		deviceArr.push(deviceId);
		//
		const body = {
			deviceId: deviceArr,
			dateStart: timestamp / 1000,
			dateEnd: timestamp / 1000 + 86399,
			//lastMinutes: 30,
			//lastPoints: 114,
			rangeType: 'daterange',
			type: 'pdf',
			sort: 'asc',
			translations: {
				wayPoints: 'Wegpunkte',
				signalFrom: 'Signal von',
				showInGoogle: 'Position auf Google Maps anzeigen',
				currentPosition: 'Aktuelle Position',
				id: 'ID',
				lat: 'Breitengrad',
				lng: 'Längengrad',
				dateTime: 'Uhrzeit',
				battery: 'Batterie',
				speed: 'Geschwindigkeit',
				direction: 'Richtung',
				positionLink: 'Link zur Position',
			},
			version: 'V2',
		};
		//console.log(`[getRoute] Body: ${JSON.stringify(body)}`);
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					accept: 'application/pdf',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.storedToken}`,
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error('[getRoute] Datenabruf fehlgeschlagen: ' + response.statusText);
			}
			return response.arrayBuffer();
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getRoute] Fehler:', error.message);
				throw error;
			} else {
				console.error('[getRoute] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	//https://connect.paj-gps.de/api/v1/logbook/getAllRoutes/2937042
	async getAllRoutes(deviceId: number): Promise<any> {
		//
		const baseUrl = 'https://connect.paj-gps.de/api/v1/logbook/getAllRoutes/';
		const url = [baseUrl, deviceId].join('');
		console.log(`[getAllRoutes] URL: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.storedToken}`,
					'Content-Type': 'application/json',
				},
			});
			if (!response.ok) {
				throw new Error('[getAllRoutes] Datenabruf fehlgeschlagen: ' + response.statusText);
			}
			const data: any = (await response.json()) as any;
			//console.log('RAW', data);
			const dataSuccess: CarData[] = data.data;
			//console.log('SUCCESS', dataSuccess);
			//const keyCount = Object.keys(dataSuccess).length;
			//console.log(keyCount); // Access length property
			//console.log(dataSuccess[0]); // Access the first element
			return dataSuccess;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getAllRoutes] Fehler:', error.message);
				throw error;
			} else {
				console.error('[getAllRoutes] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	//https://connect.paj-gps.de/api/v1/trackerdata/1312315/date_range?dateStart=1730970000000&dateEnd=1730970086399&wifi=1&gps=1
	async getTrackerData(deviceId: number, timestamp: number): Promise<Track[]> {
		//
		const baseUrl = 'https://connect.paj-gps.de/api/v1/trackerdata/';
		//nst url = [baseUrl, deviceId, '/date_range?dateStart=1721772000&dateEnd=1722335247'].join('');
		const url = [
			baseUrl,
			deviceId,
			'/date_range?dateStart=',
			timestamp / 1000,
			'&dateEnd=',
			timestamp / 1000 + 86399,
			'&wifi=1&gps=1',
		].join('');
		console.log(`[getTrackerData] URL: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.storedToken}`,
					'Content-Type': 'application/json',
				},
			});
			if (!response.ok) {
				throw new Error('[getTrackerData] Datenabruf fehlgeschlagen: ' + response.statusText);
			}

			const data: any = (await response.json()) as TracksRaw;
			//console.log('RAW', data);
			const dataSuccess: Track[] = data.success;
			return dataSuccess;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getTrackerData] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getTrackerData] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	//https://connect.paj-gps.de/api/v1/trackerdata/1312315/last_points?lastPoints=10&gps=1&wifi=0
	async getTrackerDataLast(deviceId: number, points: number): Promise<Track[]> {
		//
		const baseUrl = 'https://connect.paj-gps.de/api/v1/trackerdata/';
		const url = [
			baseUrl,
			deviceId,
			'/last_points?lastPoints=',
			points,
			'&wifi=0&gps=1'
		].join('');
		console.log(`[getTrackerDataLast] URL: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.storedToken}`,
					'Content-Type': 'application/json',
				},
			});
			if (!response.ok) {
				throw new Error('[getTrackerDataLast] Datenabruf fehlgeschlagen: ' + response.statusText);
			}

			const data: any = (await response.json()) as TracksRaw;
			//console.log('RAW', data);
			const dataSuccess: Track[] = data.success;
			return dataSuccess;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getTrackerDataLast] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getTrackerDataLast] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	//######
	async getNotifications(carId: number, alertType: number): Promise<any> {
		//https://connect.paj-gps.de/api/v1/notifications/1312315?alertType=5&isRead=1
		const baseUrl = 'https://connect.paj-gps.de/api/v1/notifications/';
		const url = [baseUrl, carId, '?alertType=', alertType, '&isRead=0'].join('');
		console.log(`[getNotifications] URL: ${url}`);
		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.storedToken}`,
					'Content-Type': 'application/json',
				},
			});
			if (!response.ok) {
				throw new Error('[getNotifications] Datenabruf fehlgeschlagen: ' + response.statusText);
			}
			const data: CarDataRaw = (await response.json()) as CarDataRaw;
			//console.log('RAW', data);
			const dataSuccess: CarData[] = data.success;
			//console.log('SUCCESS', dataSuccess);
			//console.log(dataSuccess.length); // Access length property
			//console.log(dataSuccess[0]); // Access the first element
			return dataSuccess;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getNotifications] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getNotifications] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	//https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=1312315&startDate=1731715200&endDate=1731801500&dsType=mixTR
	async getPdf_new(deviceId: number): Promise<Buffer> {
		const url =
			'https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=1312315&startDate=1731715200&endDate=1731801500&dsType=mixTR';

		console.log(`[getPdf] URL: ${url} ${deviceId}`);
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Accept: 'application/pdf',
					Authorization: `Bearer ${this.storedToken}`,
				},
			});
			//console.log(response);

			if (!response.ok) {
				throw new Error('[getPdf] Datenabruf fehlgeschlagen: ' + response.statusText);
			}

			//const blob = await response.blob();
			//console.log('Blob', blob);
			//const pdfData = await blob.arrayBuffer();

			// Pfad zur Ausgabedatei erstellen
			const filePath: string = 'pajDemo2.pdf';
			const outputPath = path.resolve(filePath);
			console.log('Output Path', outputPath);

			const pdfBuffer = await response.buffer();

			// Schreiben der PDF-Daten in eine Datei
			fs.promises.writeFile(outputPath, Buffer.from(pdfBuffer));

			return pdfBuffer;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getPdf] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getPdf] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	// https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=1287648&startDate=1721772000&endDate=1721858400&dsType=mixTR
	async getPdf_X(deviceId: number): Promise<Buffer> {
		//
		const baseUrl = 'https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=';
		//const tempUrl = '&startDate=1721772000&endDate=1721858399';
		const tempUrl = '&startDate=1731715200&endDate=1731801599';
		const typeUrl = '&dsType=mixTR';
		const url = [baseUrl, deviceId, tempUrl, typeUrl].join('');
		//const url = 'https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=1312315&startDate=1721800740&endDate=1721854740&dsType=mixTR';

		console.log(`[getPdf] URL: ${url}`);
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Accept: 'application/pdf',
					Authorization: `Bearer ${this.storedToken}`,
				},
			});
			//console.log(response);

			if (!response.ok) {
				throw new Error('[getPdf] Datenabruf fehlgeschlagen: ' + response.statusText);
			}

			//const blob = await response.blob();
			//console.log('Blob', blob);
			//const pdfData = await blob.arrayBuffer();

			// Pfad zur Ausgabedatei erstellen
			const filePath: string = 'pajDemo2.pdf';
			const outputPath = path.resolve(filePath);
			console.log('Output Path', outputPath);

			const pdfBuffer = await response.buffer();

			// Schreiben der PDF-Daten in eine Datei
			fs.promises.writeFile(outputPath, Buffer.from(pdfBuffer));

			return pdfBuffer;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getPdf] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getPdf] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
	}

	async getPdf(deviceId: number, timestamp: number): Promise<ArrayBuffer> {
		const baseUrl = 'https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=';
		//
		const url = [
			baseUrl,
			deviceId,
			'&startDate=',
			timestamp / 1000,
			'&endDate=',
			timestamp / 1000 + 86399,
			'&dsType=mixTR',
		].join('');
		console.log(`[getPdf] URL: ${url}`);
		//console.log('Gespeicherter Token:', this.storedToken);
		//
		//const body = { deviceIDs: [1312315] };
		const body = {
			deviceId: [1312315],
			dateStart: 1721772000,
			dateEnd: 1721858399,
			lastMinutes: 30,
			lastPoints: 114,
			rangeType: 'daterange',
			type: 'pdf',
			sort: 'asc',
			translations: {
				wayPoints: 'Wegpunkte',
				signalFrom: 'Signal von',
				showInGoogle: 'Position auf Google Maps anzeigen',
				currentPosition: 'Aktuelle Position',
				id: 'ID',
				lat: 'Breitengrad',
				lng: 'Längengrad',
				dateTime: 'Uhrzeit',
				battery: 'Batterie',
				speed: 'Geschwindigkeit',
				direction: 'Richtung',
				positionLink: 'Link zur Position',
			},
			version: 'V2',
		};
		body.dateStart = timestamp / 1000;
		body.dateEnd = timestamp / 1000 + 86399;

		//try {
		console.log(body);
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				accept: 'application/pdf',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.storedToken}`,
			},
			//body: JSON.stringify(body),
		});
		//console.log('RESPONSE', response);

		//const errorText = await response.text();
		//console.log('ErrorText', errorText);
		return response.arrayBuffer();

		//const pdfBuffer = await response.buffer();

		if (!response.ok) {
			throw new Error('[getGeofences] Datenabruf fehlgeschlagen: ' + response.statusText);
		}

		/*
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getGeofences] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getGeofences] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
*/
	}

	async getPdf_old(deviceId: number): Promise<ArrayBuffer> {
		const baseUrl = 'https://connect.paj-gps.de/api/v1/customer/dashboard/downloadpdf?deviceId=';
		const tempUrl = '&startDate=1720994400&endDate=1721080800';
		const typeUrl = '&dsType=mixTR';
		const url = [baseUrl, deviceId, tempUrl, typeUrl].join('');
		console.log(`[getPDF] URL: ${url}`);
		//
		const body = {
			deviceId: [1312315],
			dateStart: 1721772000,
			dateEnd: 1721858399,
			lastMinutes: 30,
			lastPoints: 114,
			rangeType: 'daterange',
			type: 'pdf',
			sort: 'asc',
			translations: {
				wayPoints: 'Wegpunkte',
				signalFrom: 'Signal von',
				showInGoogle: 'Position auf Google Maps anzeigen',
				currentPosition: 'Aktuelle Position',
				id: 'ID',
				lat: 'Breitengrad',
				lng: 'Längengrad',
				dateTime: 'Uhrzeit',
				battery: 'Batterie',
				speed: 'Geschwindigkeit',
				direction: 'Richtung',
				positionLink: 'Link zur Position',
			},
			version: 'V2',
		};
		body.dateStart = 1720908000;
		body.dateEnd = 1720994000;

		//try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				accept: 'application/pdf',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.storedToken}`,
			},
			//body: JSON.stringify(body),
		});
		//console.log('RESPONSE', response);

		//const errorText = await response.text();
		//console.log('ErrorText', errorText);
		return response.arrayBuffer();

		//const pdfBuffer = await response.buffer();

		if (!response.ok) {
			throw new Error('[getGeofences] Datenabruf fehlgeschlagen: ' + response.statusText);
		}

		/*
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error('[getGeofences] Fehler:', error.message);
				throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
			} else {
				console.error('[getGeofences] Unbekannter Fehler:', error);
				throw new Error('Unbekannter Fehler aufgetreten');
			}
		}
*/
	}

	// Helper
	timestampToDateDE(unixTimestamp: number): string {
		const date = new Date(unixTimestamp);
		return date.toLocaleString('de-DE');
	}

	timestampToDate(unixTimestamp: number): Date {
		console.log(unixTimestamp);
		return new Date(unixTimestamp);
	}

	todayTimestamp(): number {
		const today = new Date().toISOString().slice(0, -14);
		return new Date(today).getTime();
	}

	datestringToTimestamp(d: string): number {
		const val = d.split('-');
		const _year = parseInt(val[0]);
		const _month = parseInt(val[1]);
		const _date = parseInt(val[2]);
		//console.log(`${_date} ${_month} ${_year} `);
		//
		//const summerOffset = Math.abs(new Date().getTimezoneOffset() / 60);
		//const calculatedDate = new Date(_year, _month - 1, _date, summerOffset, 0, 0, 0);
		const calculatedDate = new Date(_year, _month - 1, _date, 0, 0, 0, 0);
		return calculatedDate.getTime();
	}

	formatDate(d: Date): string {
		const year = d.getFullYear();
		const month = (d.getMonth() + 1).toString().padStart(2, '0');
		const day = d.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
}
