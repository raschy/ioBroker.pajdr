"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tokenManager_exports = {};
__export(tokenManager_exports, {
  TokenManager: () => TokenManager
});
module.exports = __toCommonJS(tokenManager_exports);
class TokenManager {
  constructor(adapter, email, password) {
    this.adapter = adapter;
    this.email = email;
    this.password = password;
    if (!email || !password) {
      throw new Error("Email and password must be provided");
    }
    this.email = email;
    this.password = password;
  }
  tokenData = null;
  refreshingTokenPromise = null;
  tokenPromise = null;
  refreshLock = null;
  releaseRefreshLock = null;
  baseUrl = "https://connect.paj-gps.de/api/v1/";
  //
  async getAccessToken() {
    this.adapter.log.debug("[getAccessToken] Entry");
    this.tokenData = await this.getStoredTokenData();
    this.adapter.log.debug(`[getAccessToken] Loaded token (expires at: ${this.tokenData ? this.showTimeStamp(this.tokenData.expiresAt) : "N/A"})`);
    if (this.tokenData && Date.now() < this.tokenData.expiresAt - 6e4) {
      this.adapter.log.debug("[getAccessToken] Token valid, returning.");
      return this.tokenData.accessToken;
    }
    if (this.refreshLock) {
      this.adapter.log.debug("[getAccessToken] Refresh in progress, waiting...");
      await this.refreshLock;
      if (this.tokenData && Date.now() < this.tokenData.expiresAt - 6e4) {
        this.adapter.log.debug("[getAccessToken] Got refreshed token after wait.");
        return this.tokenData.accessToken;
      } else {
        this.adapter.log.error("[getAccessToken] No valid token even after waiting!");
        throw new Error("Token refresh failed or timed out");
      }
    }
    this.adapter.log.debug("[getAccessToken] Starting exclusive token refresh...");
    this.refreshLock = new Promise((resolve) => {
      this.releaseRefreshLock = resolve;
    });
    try {
      try {
        this.adapter.log.info("[getAccessToken] Refreshing token via refresh_token...");
        this.tokenData = await this.getTokenWithRefreshtoken();
      } catch (e) {
        this.adapter.log.warn("[getAccessToken] Refresh failed, doing full login...");
        this.tokenData = await this.getTokenWithLogin();
      }
      if (!this.tokenData) {
        throw new Error("Token refresh/login returned no data.");
      }
      this.storeToken();
      this.adapter.log.info("[getAccessToken] Token obtained successfully.");
      return this.tokenData.accessToken;
    } finally {
      const release = this.releaseRefreshLock;
      this.refreshLock = null;
      this.releaseRefreshLock = null;
      if (release)
        release();
    }
  }
  /**
   * Login to the API and retrieves the access token.
   * @returns {Promise<TokenData>} The token data containing access token, refresh token, and expiration time.
   * @throws {Error} If the login fails or the response is invalid.
   */
  async getTokenWithLogin() {
    this.adapter.log.debug("[getTokenWithLogin#]");
    const spezUrl = "login?email=";
    const urlBinder = "&password=";
    const url = [this.baseUrl, spezUrl, encodeURIComponent(this.email), urlBinder, encodeURIComponent(this.password)].join("");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    this.adapter.log.info(`[getTokenWithLogin] Response: ${res.status} ${res.statusText}`);
    if (!res.ok) {
      throw new Error(`Login failed: ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.success || !data.success.token || !data.success.refresh_token || !data.success.expires_in || !data.success.userID) {
      throw new Error("Login response is missing required fields");
    }
    const tokenData = {
      accessToken: data.success.token,
      refreshToken: data.success.refresh_token,
      userId: data.success.userID,
      //expiresAt: Date.now() + data.success.expires_in * 1000,
      //expiresAt: Date.now() + 900000, // 15 Minuten Puffer
      expiresAt: Date.now() + 3e5
      // 5 Minuten
    };
    return tokenData;
  }
  async getTokenWithRefreshtoken() {
    var _a;
    this.adapter.log.debug("[getTokenWithRefreshtoken#]");
    const spezUrl = "updatetoken?email=";
    const urlBinder = "&refresh_token=";
    if (!this.tokenData || !this.tokenData.refreshToken) {
      throw new Error("No refresh token available for refreshing access token");
    }
    const url = [this.baseUrl, spezUrl, encodeURIComponent(this.email), urlBinder, (_a = this.tokenData) == null ? void 0 : _a.refreshToken].join("");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    this.adapter.log.info(`[getTokenWithRefreshtoken] Response: ${res.status} ${res.statusText}`);
    if (!res.ok) {
      throw new Error(`Token refresh failed: ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.success || !data.success.token || !data.success.refresh_token || !data.success.expires_in || !data.success.userID) {
      throw new Error("Login response is missing required fields");
    }
    const tokenData = {
      accessToken: data.success.token,
      refreshToken: data.success.refresh_token,
      userId: data.success.userID,
      //expiresAt: Date.now() + data.success.expires_in * 1000,
      //expiresAt: Date.now() + 900000, // 15 Minuten Puffer
      expiresAt: Date.now() + 3e5
      // 5 Minuten Puffer
    };
    return tokenData;
  }
  storeToken() {
    this.adapter.log.debug("[storeToken#]");
    if (!this.tokenData || !this.tokenData.accessToken) {
      this.adapter.log.warn("[storeToken] No access token available to store");
      return;
    }
    this.adapter.extendForeignObject(`system.adapter.${this.adapter.namespace}`, {
      native: {
        activeToken: this.tokenData
        //activeToken: tokenData,
      }
    });
  }
  async initTokenData() {
    this.adapter.log.debug("[initTokenData#]");
    let tokenData = await this.getStoredTokenData();
    if (!tokenData) {
      try {
        tokenData = await this.getTokenWithLogin();
        this.storeToken();
      } catch (error) {
        this.adapter.log.error(`[initTokenData] Login failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw new Error(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    this.adapter.log.debug(`initTokenData: Tokendata: ${tokenData.expiresAt}`);
    this.tokenData = tokenData;
    this.tokenPromise = null;
    return tokenData;
  }
  async getStoredTokenData() {
    return await this.adapter.getForeignObjectAsync(`system.adapter.${this.adapter.namespace}`).then((obj) => {
      if (obj && obj.native && obj.native.activeToken) {
        const tokenData = obj.native.activeToken;
        this.adapter.log.debug(`[getStoredTokenData] Loaded token data expires at: ${tokenData.expiresAt ? this.showTimeStamp(tokenData.expiresAt) : "N/A"}`);
        return {
          accessToken: obj.native.activeToken.accessToken,
          refreshToken: obj.native.activeToken.refreshToken,
          userId: obj.native.activeToken.userId,
          expiresAt: obj.native.activeToken.expiresAt
        };
      }
      this.adapter.log.debug("[getStoredTokenData] No token data found");
      return null;
    });
  }
  showTimeStamp(ts) {
    const date = new Date(ts);
    const dateString = date.toLocaleTimeString();
    return dateString;
  }
  /**
   * Retrieves the user ID from the token data.
   *
   * @returns {Promise<number | undefined>} The user ID if available, otherwise undefined.
   * @throws {Error} If the token data is not available.
   */
  async getUserId() {
    var _a;
    this.adapter.log.debug("[getUserId#]");
    const userId = (_a = await this.tokenData) == null ? void 0 : _a.userId;
    if (userId === void 0) {
      this.adapter.log.warn("[getUserId] No user ID available in token data");
      throw new Error("User ID is not available in token data");
    }
    this.adapter.log.debug(`[getUserId] User ID: ${userId}`);
    return userId;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TokenManager
});
//# sourceMappingURL=tokenManager.js.map
