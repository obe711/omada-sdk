const WirelessNetwork = require("./WirelessNetwork");


module.exports = class SiteSetting {
  constructor(client) {
    this.client = client;
    this.endpoint = "/sites";
    this.siteId = "";
    this.wirelessNetwork = new WirelessNetwork(this);
  }

  setSiteId(siteId) {
    this.siteId = siteId;
    this.endpoint = `/sites/${siteId}`;
    return this;
  }

  getSiteInfo() {
    return this.client.get(`${this.endpoint}`);
  }
}

