const EventEmitter = require('node:events');
const pkg = require("../package.json");
const Client = require("./lib/Client");
const SiteSetting = require("./Omada/SiteSettings/SiteSetting");

class Omada extends EventEmitter {
  constructor(options = {}) {
    super();
    this.version = pkg.version;
    this.setOptions(options);

    this.client = new Client(this);
    this.siteSetting = new SiteSetting(this.client);
  }

  setOptions(options) {
    this.url = options.url;
    this.omadacId = options.omadacId;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
  }

  handleMessage(errorCode, msg) {
    if (errorCode === 0) {
      this.emit("message", msg);
      return;
    }

    this.emit("error", msg)
  }

  getSiteList(params) {
    const query = {
      ...params,
      page: params?.page || 1,
      pageSize: params?.pageSize || 5,
    }
    return this.client.get("/sites", query);
  }
}

module.exports = Omada