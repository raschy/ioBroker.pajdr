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

export class TokenManager {
	private tokenData: TokenData | null = null;
	private refreshingTokenPromise: Promise<string> | null = null;
	private tokenPromise: Promise<TokenData> | null = null;
	private baseUrl: string = 'https://connect.paj-gps.de/api/v1/';


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

	//
	async getAccessToken_OS(): Promise<string> {
		this.adapter.log.debug('[getAccessToken#]');


		if (!this.tokenData && this.tokenPromise) {
			this.tokenData = await this.tokenPromise;
		}

		// Check if the token is not expired (more than a minute left)
		if (this.tokenData && Date.now() < this.tokenData.expiresAt - 60000) {

			// If the token is still valid, return it
			this.adapter.log.debug(`[getAccessToken] Expires At: ${this.tokenData.expiresAt}`);
			return this.tokenData.accessToken;
		}

		// Return result of pending refresh if one exists
		if (this.tokenPromise) {
			this.adapter.log.debug('[getAccessToken] Pending refresh...');
			const token = (await this.tokenPromise).accessToken;
			this.adapter.log.debug(`[getAccessToken] Token: ${token}`);
			return (await this.tokenPromise).accessToken
		}

		// Refresh tokenData
		this.tokenPromise = (async () => {
			try {
				this.adapter.log.debug('[getAccessToken] using refresh token to retrieve new token data');
				if (!this.tokenData) {
					throw new Error('Token data is not available for refresh');
				}
				this.tokenData = await this.getTokenWithRefreshtoken();
				//this.tokenData = await this.refreshAccessToken(this.tokenData.refreshToken);
				return this.tokenData;
			} catch {
				this.adapter.log.debug('[getAccessToken] refresh with token failed, using login');
				this.tokenData = await this.getTokenWithLogin();
				return this.tokenData;
			} finally {
				this.tokenPromise = null;
			}
		})();

		this.storeToken();

		//this.storeToken(await this.tokenPromise);
		return (await this.tokenPromise).accessToken
	}
	//
	async getAccessToken_(): Promise<string> {
		this.adapter.log.debug('[getAccessToken#]');
		//
		this.tokenData = await this.getStoredTokenData();
		this.adapter.log.debug(`[getAccessToken] Loaded token data expires at: ${this.tokenData ? this.showTimeStamp(this.tokenData.expiresAt) : 'N/A'}`);
		//this.adapter.log.debug(`[getAccessToken] Loaded refresh token ${this.tokenData?.accessToken.substring(0, 30)}`);
		//
		//
		try {
			this.adapter.log.info('Refreshing access token using stored refresh token...');
			this.tokenData = await this.getTokenWithRefreshtoken();
			this.adapter.log.debug('[getAccessToken] Token via refresh');
			// Check if the token is not expired (more than a minute left)
			if (this.tokenData && Date.now() < this.tokenData.expiresAt - 60000) {
				const lease = this.tokenData.expiresAt - 60000 - Date.now();
				this.adapter.log.debug(`[getAccessToken] Expires lease: ${lease}`);
				return this.tokenData.accessToken;
			}
		} catch (e) {
			this.adapter.log.warn('Stored refresh token invalid, performing full login...');
			this.tokenData = await this.getTokenWithLogin();
			this.adapter.log.debug('[getAccessToken] Token via LOGIN');
		}
		this.storeToken();
		return this.tokenData.accessToken;
	}

	async getAccessToken(): Promise<string> {
		this.adapter.log.debug('[getAccessToken#]');

		this.tokenData = await this.getStoredTokenData();
		this.adapter.log.debug(`[getAccessToken] Loaded token data expires at: ${this.tokenData ? this.showTimeStamp(this.tokenData.expiresAt) : 'N/A'}`);

		// Prüfen, ob Token gültig
		if (this.tokenData && Date.now() < this.tokenData.expiresAt - 60000) {
			this.adapter.log.debug('[getAccessToken] Token still valid.');
			return this.tokenData.accessToken;
		}

		// Wenn gerade ein anderer Vorgang den Token aktualisiert: darauf warten
		if (this.refreshingTokenPromise) {
			this.adapter.log.debug('[getAccessToken] Awaiting ongoing token refresh...');
			return this.refreshingTokenPromise;
		}

		// Jetzt exklusiv aktualisieren
		this.refreshingTokenPromise = this.refreshTokenInternal();

		try {
			const token = await this.refreshingTokenPromise;
			return token;
		} finally {
			this.refreshingTokenPromise = null; // Nach Refresh wieder freigeben
		}
	}

	private async refreshTokenInternal(): Promise<string> {
		this.adapter.log.debug('[refreshTokenInternal#]');

		try {
			this.adapter.log.info('Refreshing access token using stored refresh token...');
			this.tokenData = await this.getTokenWithRefreshtoken();

			if (this.tokenData && Date.now() < this.tokenData.expiresAt - 60000) {
				this.storeToken();
				return this.tokenData.accessToken;
			}

			throw new Error('Refreshed token is still expired');
		} catch (e) {
			this.adapter.log.warn('[refreshTokenInternal] Refresh token failed, falling back to full login...');
			this.tokenData = await this.getTokenWithLogin();
			this.storeToken();
			return this.tokenData.accessToken;
		}
	}

	/**
	 * Login to the API and retrieves the access token.
	 * @returns {Promise<TokenData>} The token data containing access token, refresh token, and expiration time.
	 * @throws {Error} If the login fails or the response is invalid.
	 */
	private async getTokenWithLogin(): Promise<TokenData> {
		this.adapter.log.debug('[getTokenWithLogin#]');
		const spezUrl: string = 'login?email=';
		const urlBinder: string = '&password=';
		const url = [this.baseUrl, spezUrl, encodeURIComponent(this.email), urlBinder, encodeURIComponent(this.password)].join('');

		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		this.adapter.log.info(`[getTokenWithLogin] Response: ${res.status} ${res.statusText}`);
		if (!res.ok) {
			throw new Error(`Login failed: ${res.statusText}`);
		}

		const data = await res.json() as TokenResponse;

		if (!data.success || !data.success.token || !data.success.refresh_token || !data.success.expires_in || !data.success.userID) {
			throw new Error('Login response is missing required fields');
		}

		const tokenData: TokenData = {
			accessToken: data.success.token,
			refreshToken: data.success.refresh_token,
			userId: data.success.userID,
			//expiresAt: Date.now() + data.success.expires_in * 1000,
			//expiresAt: Date.now() + 900000, // 15 Minuten Puffer
			expiresAt: Date.now() + 300000, // 5 Minuten
		}

		return tokenData;
	}

	private async getTokenWithRefreshtoken(): Promise<TokenData> {
		//private async refreshAccessToken(refreshToken: string): Promise<TokenData> {
		this.adapter.log.debug('[getTokenWithRefreshtoken#]');
		const spezUrl: string = 'updatetoken?email=';
		const urlBinder: string = '&refresh_token=';

		// Check if refreshToken is available

		if (!this.tokenData || !this.tokenData.refreshToken) {
			//if (!refreshToken) {
			throw new Error('No refresh token available for refreshing access token');
		}

		const url = [this.baseUrl, spezUrl, encodeURIComponent(this.email), urlBinder, this.tokenData?.refreshToken].join('');
		//const url = [this.baseUrl, spezUrl, encodeURIComponent(this.email), urlBinder, refreshToken].join('');

		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		this.adapter.log.info(`[getTokenWithRefreshtoken] Response: ${res.status} ${res.statusText}`);

		if (!res.ok) {
			throw new Error(`Token refresh failed: ${res.statusText}`);
		}

		const data = await res.json() as TokenResponse;
		if (!data.success || !data.success.token || !data.success.refresh_token || !data.success.expires_in || !data.success.userID) {
			throw new Error('Login response is missing required fields');
		}

		const tokenData: TokenData = {
			accessToken: data.success.token,
			refreshToken: data.success.refresh_token,
			userId: data.success.userID,
			//expiresAt: Date.now() + data.success.expires_in * 1000,
			//expiresAt: Date.now() + 900000, // 15 Minuten Puffer
			expiresAt: Date.now() + 300000, // 5 Minuten Puffer
		}
		return tokenData;
	}

	private storeToken(): void {
		//private async storeToken(tokenData: TokenData): Promise<void> {
		this.adapter.log.debug('[storeToken#]');
		// Check if tokenData is available
		if (!this.tokenData || !this.tokenData.accessToken) {
			this.adapter.log.warn('[storeToken] No access token available to store');
			return;
		}
		// Store the token in the adapter's native object
		this.adapter.extendForeignObject(`system.adapter.${this.adapter.namespace}`, {
			native: {
				activeToken: this.tokenData,
				//activeToken: tokenData,
			},
		});
	}

	async initTokenData(): Promise<TokenData> {
		// Retrieve token Data
		//return (async () => {

		this.adapter.log.debug('[initTokenData#]');
		let tokenData = await this.getStoredTokenData();

		if (!tokenData) {
			try {
				tokenData = await this.getTokenWithLogin();
				this.storeToken();
				//await this.storeToken(tokenData);
			} catch (error) {
				this.adapter.log.error(`[initTokenData] Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
				throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}

		this.adapter.log.debug(`initTokenData: Tokendata: ${tokenData.expiresAt}`);
		this.tokenData = tokenData
		this.tokenPromise = null;
		return tokenData;
		//})();
	}

	async getStoredTokenData(): Promise<TokenData | null> {
		this.adapter.log.debug('[getStoredTokenData#]');
		// Return the stored token data if available
		return await this.adapter.getForeignObjectAsync(`system.adapter.${this.adapter.namespace}`)
			.then(obj => {
				if (obj && obj.native && obj.native.activeToken) {
					//this.adapter.log.debug(`[getStoredTokenData] Loaded token data: ${JSON.stringify(obj.native.activeToken)}`);
					const tokenData = obj.native.activeToken; // nur temporär
					this.adapter.log.debug(`[getStoredTokenData] Loaded token data:${tokenData.accessToken.substring(0, 30)}`);
					//this.adapter.log.debug(`[getStoredTokenData] Loaded token data expires at: ${obj.native.activeToken.expiresAt}`);
					//this.adapter.log.debug(`[getStoredTokenData] Loaded token data expires at: ${this.showTimeStamp(obj.native.activeToken.expiresAt)}`);
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

	private showTimeStamp(ts: number): string {
		const date = new Date(ts);
		const dateString = date.toISOString();
		//console.log(dateString);
		return dateString;
	}

	/**
	 * Retrieves the user ID from the token data.
	 *
	 * @returns {Promise<number | undefined>} The user ID if available, otherwise undefined.
	 * @throws {Error} If the token data is not available.
	 */
	async getUserId(): Promise<number | undefined> {
		this.adapter.log.debug('[getUserId#]');
		const userId = (await this.tokenData)?.userId;
		if (userId === undefined) {
			this.adapter.log.warn('[getUserId] No user ID available in token data');
			throw new Error('User ID is not available in token data');
		}
		this.adapter.log.debug(`[getUserId] User ID: ${userId}`);
		// Return the user ID from the token data
		return userId;
	}
}

