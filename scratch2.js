const dgram = require('dgram');

const ip = '131.196.198.91';
const port = 28016;

const client = dgram.createSocket('udp4');
client.on('message', (msg) => {
  console.log('Got message of length', msg.length);
  console.log('Header:', msg.slice(0, 4).toString('hex'));
  console.log('Type:', msg[4].toString(16));
  if (msg[4] === 0x41) {
    console.log('Got challenge, sending A2S_PLAYER request...');
    const challenge = msg.slice(5);
    const req = Buffer.concat([
      Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x55]),
      challenge
    ]);
    client.send(req, port, ip);
  } else {
    console.log('Data:', msg.toString('hex').substring(0, 100));
    client.close();
  }
});

const req = Buffer.concat([
  Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x55]),
  Buffer.from([0xFF, 0xFF, 0xFF, 0xFF])
]);
client.send(req, port, ip);
