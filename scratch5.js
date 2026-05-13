const https = require('https');

https.get('https://api.battlemetrics.com/servers?filter[address]=131.196.198.91', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const serverId = json.data[0].id;
    console.log('Server ID:', serverId);

    https.get('https://api.battlemetrics.com/players?filter[servers]=' + serverId + '&filter[search]=olivia', (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => { data2 += chunk; });
      res2.on('end', () => {
        const json2 = JSON.parse(data2);
        console.log('Players matching olivia:');
        console.log(json2.data.map(p => p.attributes.name));
      });
    });
  });
});
