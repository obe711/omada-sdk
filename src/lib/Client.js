const axios = require("axios");
const https = require("node:https");
const queryString = require('node:querystring');

class Client {
  constructor(omada) {
    this.omada = omada;
    this.accessToken = "";
    this.refreshToken = "";
    this.expires = "";
    this.baseUrl = this.omada.url + "/openapi";
    this.apiVersion = "/v1"
    this.authBody = {
      client_id: this.omada.clientId,
      client_secret: this.omada.clientSecret,
      omadacId: this.omada.omadacId,
    }

    this.http = axios.create({
      withCredentials: false,
      baseURL: this.baseUrl,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    this.authenticate();
    this.createAuthCaller();
  }

  authenticate() {
    const queryParams = queryString.stringify({
      grant_type: "client_credentials",
    });

    this.http.post(`/authorize/token?${queryParams}`, this.authBody)
      .then(this.handleAuthResponse)
  }

  refreshAuthToken = () => {
    this.stopRefreshTokenTimer();

    const queryParams = queryString.stringify({
      refresh_token: this.refreshToken,
      grant_type: "refresh_token",
    })

    this.http.post(`/authorize/token?${queryParams}`, this.authBody)
      .then(this.handleAuthResponse)
  }

  handleAuthResponse = (res) => {
    console.log(res.data)
    const { errorCode, msg } = res.data;

    this.omada.handleMessage(errorCode, msg);
    if (errorCode !== 0) return;
    this.accessToken = res.data.result.accessToken;
    this.refreshToken = res.data.result.refreshToken;
    this.startRefreshTokenTimer(res.data.result.expiresIn);
  }

  handleClientResponse = (res) => {
    const { errorCode, msg } = res.data;
    this.omada.handleMessage(errorCode, msg);
    if (errorCode !== 0) return;
    return res.data.result;
  }

  startRefreshTokenTimer(expiresIn) {
    this.expires = expiresIn * 1000;
    const timeout = this.expires - 60 * 1000;
    this.refreshTokenTimeout = setTimeout(this.refreshAuthToken, timeout);
  }

  stopRefreshTokenTimer() {
    clearTimeout(this.refreshTokenTimeout);
  }

  createAuthCaller = () => {
    const addAuthHeader = (config) => {
      Object.assign(config, {
        withCredentials: false,
        baseURL: `${this.baseUrl}${this.apiVersion}/${this.omada.omadacId}`,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        headers: {
          'Authorization': `AccessToken=${this.accessToken}`
        }
      });
      return config;
    }

    this.authHttp = axios.create({
      withCredentials: false,
      baseURL: `${this.baseUrl}${this.apiVersion}/${this.omada.omadacId}`,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    })

    this.authHttp.interceptors.request.use(function (config) {
      return addAuthHeader(config);
    }, function (error) {
      return Promise.reject(error);
    });

    this.authHttp.interceptors.response.use(function (response) {
      Object.assign(response, { isError: false })
      return response;
    }, async function (error) {
      const { config } = error;
      if (!config) {
        return Promise.reject(error);
      }

      if (error?.response?.status >= 500) {
        return Promise.reject(error);
      }

      const authError = error?.response?.status > 400 && error?.response?.status < 404
      if (!authError) {
        Object.assign(error.response, { isError: true });
        return Promise.resolve(error.response);
      }

      if (authError && !config._retry) {
        try {
          await this.refreshAuthToken();
          config._retry = true;
          return this.authHttp(addAuthHeader(config))

        } catch {
          console.log("Caught", error.config);
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    });
  }

  get = async (url, queryParams) => {
    let params = {};

    for (const key in queryParams) {
      if (Object.hasOwnProperty.call(queryParams, key)) {
        const element = queryParams[key];

        // If array, stringify
        if (typeof element === "object", element.length > 0) {
          params[key] = JSON.stringify(element);
        } else {
          params[key] = element;
        }
      }
    }
    try {
      const res = await this.authHttp.get(url, { params });
      return this.handleClientResponse(res);
    } catch (err) {
      this.omada.emit("error", err.message)
    }
  }

  post = async (url, params = {}) => {
    try {
      const res = await this.authHttp.post(url, params);
      return this.handleClientResponse(res);
    } catch (err) {
      this.omada.emit("error", err.message)
    }
  }

  put = async (url, params = {}) => {
    try {
      const res = await this.authHttp.put(url, params);
      return this.handleClientResponse(res);
    } catch (err) {
      this.omada.emit("error", err.message)
    }
  }

  patch = async (url, params = {}) => {
    try {
      const res = await this.authHttp.patch(url, params);
      return this.handleClientResponse(res);
    } catch (err) {
      this.omada.emit("error", err.message)
    }
  }

  delete = async (url, params = {}) => {
    try {
      const res = await this.authHttp.delete(url, params);
      return this.handleClientResponse(res);
    } catch (err) {
      this.omada.emit("error", err.message)
    }
  }
}

module.exports = Client;