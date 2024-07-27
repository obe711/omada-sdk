
module.exports = class WirelessNetwork {
  constructor(site) {
    this.client = site.client;
    this.site = site;
    this.endpoint = site.endpoint + "/wireless-network"
  }

  setWlanId(wlanId) {
    this.wlanId = wlanId;
    this.endpoint = this.site.endpoint + "/wireless-network"
    console.log(this.wlanId, this.endpoint)
    return this;
  }

  getWlanGroupList() {
    this.endpoint = this.site.endpoint + "/wireless-network"
    return this.client.get(`${this.endpoint}/wlans`)
  }

  getSsidList(params) {
    this.endpoint = this.site.endpoint + "/wireless-network";
    const query = {
      ...params,
      page: params?.page || 1,
      pageSize: params?.pageSize || 5,
    }
    return this.client.get(`${this.endpoint}/wlans/${this.wlanId}/ssids`, query)
  }
}