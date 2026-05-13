const dgram = require('dgram');

const ip = '131.196.198.91';
const port = 28016;

const client = dgram.createSocket('udp4');
client.on('message', (msg) => {
  if (msg[4] === 0x41) {
    const challenge = msg.slice(5);
    const req = Buffer.concat([
      Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x55]),
      challenge
    ]);
    client.send(req, port, ip);
  } else if (msg[4] === 0x44) {
    const response = msg.slice(4);
    const playerCount = response[1];
    let offset = 2;
    const players = [];
    for (let i = 0; i < playerCount; i++) {
      offset++;
      let nameEnd = response.indexOf(0x00, offset);
      if (nameEnd === -1) break;
      const name = response.slice(offset, nameEnd).toString("utf-8");
      offset = nameEnd + 1;
      const score = response.readInt32LE(offset);
      offset += 4;
      const duration = response.readFloatLE(offset);
      offset += 4;
      if (name) players.push(name);
    }
    console.log('Players found:', players.slice(0, 20));
    client.close();
  }
});

const req = Buffer.concat([
  Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x55]),
  Buffer.from([0xFF, 0xFF, 0xFF, 0xFF])
]);
client.send(req, port, ip);
