"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiManager = void 0;
/**
 * @file ApiManager.ts
 * @description This file contains the ApiManager class which handles API requests to the Paj GPS service.
 * It includes methods to get customer data, device data, and car device data.
 */
class ApiManager {
    adapter;
    tokenManager;
    baseUrl = 'https://connect.paj-gps.de/api/v1/';
    /**
     *
     * @param adapter The ioBroker adapter instance.
     * @description Initializes the ApiManager with the adapter and token manager.
     * @throws Will throw an error if the adapter is not provided.
     * @throws Will throw an error if the token manager is not provided.
     * @description The ioBroker adapter instance.
     * @param tokenManager any
     */
    constructor(adapter, tokenManager) {
        this.adapter = adapter;
        this.tokenManager = tokenManager;
    }
    /**
     * @description Get Customer Data (explicit User-ID)
     * @returns The User-ID of the customer
     */
    async getCustomer() {
        const url = `${this.baseUrl}customer`;
        this.adapter.log.debug(`[getCustomer] URL: ${url}`);
        const token = await this.tokenManager.getAccessToken();
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
            const raw = (await response.json());
            //console.log('DATA getCustomer: ', raw);
            const dataSuccess = raw.success;
            //console.log('SUCCESS', dataSuccess);
            const customerId = dataSuccess.id;
            this.adapter.log.info(`[getCustomer] Customer ID: ${customerId}`);
            return customerId;
        }
        catch (error) {
            if (error instanceof Error) {
                this.adapter.log.error(`[getCustomer] Error: ${error.message}`);
                throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
            }
            else {
                const errMsg = typeof error === 'object' && error !== null && 'stack' in error
                    ? `[getCustomer] Unknown error: ${error.stack}`
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
    async getDevice() {
        const url = `${this.baseUrl}device`;
        this.adapter.log.debug(`[getDevice] URL: ${url}`);
        const token = await this.tokenManager.getAccessToken();
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
            const raw = (await response.json());
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
            const deviceData = raw.success;
            return deviceData;
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('[getDevice] Error:', error.message);
                throw error; // Fehler weiterwerfen, um den Aufrufer zu informieren
            }
            else {
                console.error('[getDevice] Unknown error:', error);
                throw new Error('Unknown error occurred');
            }
        }
    }
    /**
     * @returns CarData[]
     * @description Get Car Device Data
     */
    async getCarDeviceData() {
        const url = `${this.baseUrl}sdevice/car`;
        this.adapter.log.debug(`[getCarDeviceData] URL: ${url}`);
        const token = await this.tokenManager.getAccessToken();
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
            const data = (await response.json());
            //console.log('RAW', data);
            const dataSuccess = data.success;
            //console.log('SUCCESS', dataSuccess);
            return dataSuccess;
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('[getCarDeviceData] Error:', error.message);
                throw error; // Rethrow error to inform caller
            }
            else {
                console.error('[getCarDeviceData] Unknown error:', error);
                throw new Error('Unknown error occurred');
            }
        }
    }
}
exports.ApiManager = ApiManager;
//# sourceMappingURL=apiManager.js.map