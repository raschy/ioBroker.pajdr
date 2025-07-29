interface TokenResponse {
	success: {
		token: string;
		refresh_token: string;
		expires_in: number;
		super_user: number;
		userID: number;
		routeIcon: string;
		reset: number;
		appMode: string;
	};
}

interface TokenData {
	accessToken: string;
	refreshToken: string;
	userId: number;
	expiresAt: number;
}

/**
 * @file tokenManager.ts
 * @description This file contains the TokenManager class which handles token management for the Paj GPS service.
 * It includes methods to get access tokens, refresh tokens, and store token data.
 */
export class TokenManager {
	private tokenData: TokenData | null = null;
	private refreshingTokenPromise: Promise<string> | null = null;
	private tokenPromise: Promise<TokenData> | null = null;
	private refreshLock: Promise<void> | null = null;
	private releaseRefreshLock: (() => void) | null = null;
	private baseUrl: string = 'https://connect.paj-gps.de/api/v1/';

	/**
	 * @description Initializes the TokenManager with the adapter, email, and password.
	 * @param adapter The ioBroker adapter instance.
	 * @param email The email address for authentication.
	 * @param password The password for authentication.
	 */
	constructor(
		private readonly adapter: ioBroker.Adapter,
		private readonly email: string,
		private readonly password: string,
	) {
		if (!email || !password) {
			throw new Error('Email and password must be provided');
		}
		this.email = email;
		this.password = password;
		//this.tokenPromise = this.initTokenData();
	}

	/**
	 *
	 * @returns The access token if available and valid, otherwise refreshes the token.
	 * @throws {Error} If the token cannot be retrieved or refreshed.
	 */
	async getAccessToken(): Promise<string> {
		this.adapter.log.debug('[getAccessToken#]');

		// Token aus Storage holen
		this.tokenData = await this.getStoredTokenData();
		this.adapter.log.debug(
			`[getAccessToken] Loaded token (expires at: ${this.tokenData ? this.showTimeStamp(this.tokenData.expiresAt) : 'N/A'})`,
		);

		// Token noch gültig?
		if (this.tokenData && Date.now() < this.tokenData.expiresAt - 60000) {
			this.adapter.log.debug('[getAccessToken] Token valid, returning.');
			return this.tokenData.accessToken;
		}

		// Wenn Sperre aktiv: warten
		if (this.refreshLock) {
			this.adapter.log.debug('[getAccessToken] Refresh in progress, waiting...');
			await this.refreshLock;

			// Nach Warten: gültiger Token?
			if (this.tokenData && Date.now() < this.tokenData.expiresAt - 60000) {
				this.adapter.log.debug('[getAccessToken] Got refreshed token after wait.');
				return this.tokenData.accessToken;
			}
			this.adapter.log.error('[getAccessToken] No valid token even after waiting!');
			throw new Error('Token refresh failed or timed out');
		}

		// Jetzt exklusiv Sperre setzen
		this.adapter.log.debug('[getAccessToken] Starting exclusive token refresh...');
		this.refreshLock = new Promise<void>(resolve => {
			this.releaseRefreshLock = resolve;
		});

		try {
			// Versuche Refresh mit Refresh-Token
			try {
				this.adapter.log.info('[getAccessToken] Refreshing token via refresh_token...');
				this.tokenData = await this.getTokenWithRefreshtoken();
			} catch (error: unknown) {
				this.adapter.log.warn(
					`[getAccessToken] Refresh failed, doing full login...${error instanceof Error ? error.message : ''}`,
				);
				this.tokenData = await this.getTokenWithLogin();
			}

			if (!this.tokenData) {
				throw new Error('Token refresh/login returned no data.');
			}

			await this.storeToken();
			this.adapter.log.info('[getAccessToken] Token obtained successfully.');
			return this.tokenData.accessToken;
		} finally {
			// Sperre aufheben
			const release = this.releaseRefreshLock;
			this.refreshLock = null;
			this.releaseRefreshLock = null;
			if (release) {
				release();
			}
		}
	}

	/**
	 * Login to the API and retrieves the access token.
	 *
	 * @returns The token data containing access token, refresh token, and expiration time.
	 * @throws {Error} If the login fails or the response is invalid.
	 */
	private async getTokenWithLogin(): Promise<TokenData> {
		this.adapter.log.debug('[getTokenWithLogin#]');
		const spezUrl = 'login?email=';
		const urlBinder = '&password=';
		const url = [
			this.baseUrl,
			spezUrl,
			encodeURIComponent(this.email),
			urlBinder,
			encodeURIComponent(this.password),
		].join('');

		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		this.adapter.log.info(`[getTokenWithLogin] Response: ${res.status} ${res.statusText}`);
		if (!res.ok) {
			throw new Error(`Login failed: ${res.statusText}`);
		}

		const data = (await res.json()) as TokenResponse;
		//console.log('RAW Login ' + JSON.stringify(data));

		if (
			!data.success ||
			!data.success.token ||
			!data.success.refresh_token ||
			!data.success.expires_in ||
			!data.success.userID
		) {
			throw new Error('Login response is missing required fields');
		}

		const tokenData: TokenData = {
			accessToken: data.success.token,
			refreshToken: data.success.refresh_token,
			userId: data.success.userID,
			//expiresAt: Date.now() + data.success.expires_in * 1000,
			//expiresAt: Date.now() + 900000, // 15 Minuten Puffer
			expiresAt: Date.now() + 86400000, // 24 Stunden
		};

		return tokenData;
	}

	/**
	 *
	 * @returns The token data containing access token, refresh token, and expiration time.
	 * @throws {Error} If the token cannot be refreshed.
	 */
	private async getTokenWithRefreshtoken(): Promise<TokenData> {
		//private async refreshAccessToken(refreshToken: string): Promise<TokenData> {
		this.adapter.log.debug('[getTokenWithRefreshtoken#]');
		const spezUrl = 'updatetoken?email=';
		const urlBinder = '&refresh_token=';

		// Check if refreshToken is available

		if (!this.tokenData || !this.tokenData.refreshToken) {
			//if (!refreshToken) {
			throw new Error('No refresh token available for refreshing access token');
		}

		const url = [
			this.baseUrl,
			spezUrl,
			encodeURIComponent(this.email),
			urlBinder,
			this.tokenData?.refreshToken,
		].join('');
		//const url = [this.baseUrl, spezUrl, encodeURIComponent(this.email), urlBinder, refreshToken].join('');

		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		this.adapter.log.info(`[getTokenWithRefreshtoken] Response: ${res.status} ${res.statusText}`);

		if (!res.ok) {
			throw new Error(`Token refresh failed: ${res.statusText}`);
		}
		const data = (await res.json()) as TokenResponse;
		//console.log('RAW ' + data);
		if (
			!data.success ||
			!data.success.token ||
			!data.success.refresh_token ||
			!data.success.expires_in ||
			!data.success.userID
		) {
			throw new Error('Login response is missing required fields');
		}

		const tokenData: TokenData = {
			accessToken: data.success.token,
			refreshToken: data.success.refresh_token,
			userId: data.success.userID,
			//expiresAt: Date.now() + data.success.expires_in * 1000,
			//expiresAt: Date.now() + 900000, // 15 Minuten Puffer
			expiresAt: Date.now() + 86400000, // 24 Stunden
		};
		return tokenData;
	}

	/**
	 *
	 * @description Initializes the token data by retrieving it from storage or logging in.
	 * If no token data is found, it attempts to log in and store the new token data.
	 * If the login fails, it throws an error.
	 */
	private async storeToken(): Promise<void> {
		this.adapter.log.debug('[storeToken#]');
		// Check if tokenData is available
		if (!this.tokenData || !this.tokenData.accessToken) {
			this.adapter.log.warn('[storeToken] No access token available to store');
			return;
		}
		// Store the token in the adapter's native object
		await this.adapter.extendForeignObject(`system.adapter.${this.adapter.namespace}`, {
			native: {
				activeToken: this.tokenData,
			},
		});
	}

	/**
	 * Initializes the token data.
	 *
	 * @returns The token data containing access token, refresh token, user ID, and expiration time.
	 * @description Initializes the token data by retrieving it from storage or logging in.
	 * If no token data is found, it attempts to log in and store the new token data.
	 * If the login fails, it throws an error.
	 * @throws {Error} If the login fails or the token data cannot be retrieved.
	 */
	async initTokenData(): Promise<TokenData> {
		// Retrieve token Data
		//return (async () => {

		this.adapter.log.debug('[initTokenData#]');
		let tokenData = await this.getStoredTokenData();

		if (!tokenData) {
			try {
				tokenData = await this.getTokenWithLogin();
				await this.storeToken();
				//await this.storeToken(tokenData);
			} catch (error) {
				this.adapter.log.error(
					`[initTokenData] Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				);
				throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}

		this.adapter.log.debug(`initTokenData: Tokendata: ${tokenData.expiresAt}`);
		this.tokenData = tokenData;
		this.tokenPromise = null;
		return tokenData;
		//})();
	}

	/**
	 * Initializes the token data.
	 *
	 * @returns The stored token data if available, otherwise null.
	 * @description Retrieves the stored token data from the adapter's native object.
	 * If the token data is found, it logs the expiration time.
	 * If no token data is found, it logs a debug message and returns null.
	 * @throws {Error} If the token data cannot be retrieved.
	 */
	async getStoredTokenData(): Promise<TokenData | null> {
		//this.adapter.log.debug('[getStoredTokenData#]');
		// Return the stored token data if available
		return await this.adapter.getForeignObjectAsync(`system.adapter.${this.adapter.namespace}`).then(obj => {
			if (obj && obj.native && obj.native.activeToken) {
				//this.adapter.log.debug(`[getStoredTokenData] Loaded token data: ${JSON.stringify(obj.native.activeToken)}`);
				const tokenData = obj.native.activeToken; // nur temporär
				//this.adapter.log.debug(`[getStoredTokenData] Loaded token data:${tokenData.accessToken.substring(0, 30)}`);
				this.adapter.log.debug(
					`[getStoredTokenData] Loaded token data expires at: ${tokenData.expiresAt ? this.showTimeStamp(tokenData.expiresAt) : 'N/A'}`,
				);
				return {
					accessToken: obj.native.activeToken.accessToken,
					refreshToken: obj.native.activeToken.refreshToken,
					userId: obj.native.activeToken.userId,
					expiresAt: obj.native.activeToken.expiresAt,
				};
			}
			this.adapter.log.debug('[getStoredTokenData] No token data found');
			return null;
		});
	}

	/**
	 * Formats a timestamp into a human-readable string.
	 *
	 * @param ts The timestamp to format.
	 * @returns The formatted timestamp string.
	 * @description Formats the given timestamp into a localized time string.
	 */
	private showTimeStamp(ts: number): string {
		const date = new Date(ts);
		//const dateString = date.toISOString();
		const dateString = date.toLocaleTimeString(); //  .toLocaleDateString();
		//console.log(dateString);
		return dateString;
	}

	/**
	 * Retrieves the user ID (=customerId) from the token data.
	 *
	 * @returns The user ID if available, otherwise undefined.
	 * @throws {Error} If the token data is not available.
	 */
	getCustomerId(): Promise<string | undefined> {
		this.adapter.log.debug('[getCustomerId#]');
		const customerId: string | undefined = this.tokenData ? String(this.tokenData.userId) : undefined;
		if (customerId === undefined) {
			this.adapter.log.warn('[getCustomerId] No customer ID available in token data');
			throw new Error('Customer ID is not available in token data');
		}
		this.adapter.log.debug(`[getCustomerId] Customer ID: ${customerId}`);
		// Return the customer ID from the token data
		return Promise.resolve(customerId);
	}
}
