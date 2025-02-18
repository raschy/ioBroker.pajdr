/*
 * Created with @iobroker/create-adapter v2.6.3
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { promises as fs } from 'fs';
import { ApiManager } from './ApiManager';
//import { writeLog } from './lib/filelogger';
//const fileHandle = { path: '/home/raschy/ioBroker.pajdr', file: 'logs1.txt' };

// Load your modules here, e.g.:

class Pajdr extends utils.Adapter {
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: 'pajdr',
		});
		this.on('ready', this.onReady.bind(this));
		// this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}
	private dataUpdateInterval: NodeJS.Timeout | undefined;

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		const user_name: string = this.config.email;
		const user_pass: string = this.config.password;
		//let updateInterval: number = 10; //this.config.updateIntervall;
		//
		const executionInterval: number = 360;
		//
		const dataDir: string = utils.getAbsoluteDefaultDataDir();
		console.log(`DIR ${dataDir}`);
		//
		await this.callData(user_name, user_pass);

		// ####### LOOP #######
		//if (this.internDataReady) {
		// timed data request
		this.dataUpdateInterval = setTimeout(() => this.callData(user_name, user_pass), executionInterval * 1000);
		//}
	}
	async callData(user_name: string, user_pass: string): Promise<void> {
		this.log.debug('#####  callData  #####');
		try {
			const client = new ApiManager(user_name, user_pass);

			// Token abrufen
			//const token = await client.getToken();

			// Token speichern
			//await client.saveToken(token);
			//console.log('Token gespeichert:', token);

			// Token laden und verwenden
			await client.loadToken();
			//#const storedToken: string = await client.loadToken();
			//#console.log('Gespeicherter Token:', storedToken);

			// API-Anfrage für Customer
			const userId = await client.getCustomer();
			console.log('[Customer] UserId:', userId);
			//
			// API-Anfrage für Device
			const device: CarData[] = await client.getDevice();
			//console.log('[Device] Abgerufene Daten: ', device);
			const deviceId = device[0].carDevice_id;
			console.log('[Device]: ID', deviceId);
			//
			// API-Anfrage für CarDeviceData
			const carData = await client.getCarDeviceData();
			console.log('[CarDeviceData] Anzahl Datensätze :', carData.length);
			//console.log('[CarDeviceData] Abgerufene Daten :', carData);
			const carCount = carData.length;
			console.log('[CarDeviceData]: Anzahl Fahrzeuge', carCount);
			const plateId = carData[0].plate_id;
			console.log('[CarDeviceData]: Kfz', plateId);
			const carDeviceId = carData[0].id;
			console.log('[CarDeviceData]: CarDeviceId', carDeviceId);
			const idCustomer = carData[0].customer_id;
			console.log('[CarDeviceData]: Customer ID', idCustomer);
			const idDevice = carData[0].iddevice;
			console.log('[CarDeviceData]: ID-Device', idDevice);
			const mileage: number = parseFloat(carData[0].optimized_mileage);
			console.log('[SingleCarDeviceData] km-Stand: ', mileage);
			//
			// API-Anfrage für SingleCarDeviceData
			//const singleData = await client.getSingleCarDeviceData(carDeviceId);
			//console.log('[SingleCarDeviceData] Abgerufene Daten :', singleData);
			//
			// API-Anfrage für GeoFence
			const geo = await client.getGeofences();
			//console.log('[Geofence] Abgerufene Daten: ', geo);
			console.log('[Geofence] Anzahl Fences: ', geo.length);
			geo.forEach((fence) => console.log(fence.name));
			//fs.writeFile('pajGeoFences.txt', Buffer.from(geo));
			//
			// API-Anfrage für AllRoutes
			//const routes = await client.getAllRoutes(idDevice);
			//console.log('[AllRoutes] Abgerufene Daten: ', routes);
			//
			//let innerData;
			//let nArray = 0;
			//const anzRoutes: number = Object.keys(routes).length;
			//console.log('Anzahl Routen: ', anzRoutes);
			/*
			for (let j: number = 0; j < anzRoutes; j++) {
				const tripStartDate = Object.keys(routes)[j];
				console.log(j, tripStartDate); // Access the first element
				for (const element in routes) {
					const route: any = routes[element];
					//console.log('inner: ', innerData[0]);
					for (const element in route) {
						//console.log('element: ', element);
						const routeId = route[element].id;
						console.log('Route ID: ', routeId);
						const routeStartLat = route[element].start_lat;
						console.log('  Start Lat: ', routeStartLat);
						const routeStartOrt = route[element].start_address;
						console.log('  Start Ort: ', routeStartOrt);
					}
				}
			}
			*/
			//
			// API-Anfrage für TrackerData
			const abfrageDatum = '2024-11-18';
			const today_ts: number = client.datestringToTimestamp(abfrageDatum);
			console.log(today_ts);
			const tracks = await client.getTrackerData(idDevice, today_ts);
			//console.log('[TrackerData] Abgerufene Daten: ', tracks);
			console.log('[TrackerData] Anzahl Tracks: ', tracks.length);
			//
			const tracksLast = await client.getTrackerDataLast(idDevice, 5);
			console.log('[TrackerDataLast] Abgerufene Daten: ', tracksLast);
			console.log('[TrackerDataLast] Anzahl Tracks: ', tracksLast.length);
			//
			// API-Anfrage für Notifications
			//const notfs3 = await client.getNotifications(idDevice, 3); // Radiusalarm
			//console.log('[Notifications] Abgerufene Daten: ', notfs3);
			//const notfs5 = await client.getNotifications(idDevice, 5); // Speedalarm
			//console.log('[Notifications] Abgerufene Daten: ', notfs5);

			// API-Anfrage für pdf-Download
			//const pdfBuffer = await client.getPdf_X(idDevice);
			//const pdfBuffer = await client.getPdf(idDevice, today_ts);
			const pdfBuffer = await client.getPdf_new(idDevice);
			fs.writeFile('pajData_03_241118.pdf', Buffer.from(pdfBuffer));
			console.log('[PDF getPdf] Abgerufene Daten: ', pdfBuffer);

			// API-Anfrage für pdf-Download von Routen für einen ausgewählten Tag
			const pdfBufferR = await client.getRoute(idDevice, today_ts);
			fs.writeFile('pajData_03r.pdf', Buffer.from(pdfBufferR));
			//console.log('[PDF getRoute] Abgerufene Daten: ', JSON.stringify(pdfBufferR));

			//
		} catch (error) {
			console.error('Fehler:', error);
		}
	}

	//	#### Helper ####

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			//## this.updateInterval && clearInterval(this.updateInterval);
			// clearTimeout(timeout2);
			if (this.dataUpdateInterval) clearTimeout(this.dataUpdateInterval);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
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
