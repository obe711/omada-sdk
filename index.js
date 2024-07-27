const Omada = require("./src/Omada");

const omada = new Omada({
  url: process.env.CONTROLLER_URL,
  omadacId: process.env.OMADACID,
  clientId: process.env.OMADA_CLIENT_ID,
  clientSecret: process.env.OMADA_CLIENT_SECRET,
})

omada.on("error", (error) => {
  console.log("error", error);
});

omada.on("message", (msg) => {
  console.log("message", msg);
})

setTimeout(() => {
  omada.getSiteList().then(res => {
    console.log(res);
    omada.siteSetting
      .setSiteId(res.data[0].siteId)
      .wirelessNetwork.getWlanGroupList()
      .then(res => {
        console.log("wlan", res[0].wlanId)
        omada.siteSetting.wirelessNetwork.setWlanId(res[0].wlanId)
          .getSsidList().then(res => console.log(res))
      })

  });
}, 10000)