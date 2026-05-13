const dgram = require('dgram');

const ip = '131.196.198.91';
const ports = [28015, 28016, 28082, 28083, 28297, 27015, 27016, 28025, 28026];

// Intentar un A2S_INFO en varios puertos
function testPort(port) {
  return new Promise((resolve) => {
    const client = dgram.createSocket('udp4');
    const timer = setTimeout(() => {
      client.close();
      resolve({ port, success: false });
    }, 2000);

    const payload = Buffer.concat([
      Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x54]), 
      Buffer.from('Source Engine Query\0', 'utf-8')
    ]);

    client.send(payload, port, ip);

    client.on('message', (msg) => {
      clearTimeout(timer);
      client.close();
      resolve({ port, success: true, length: msg.length });
    });
  });
}

async function run() {
  console.log('Testing A2S_INFO on ' + ip);
  const results = await Promise.all(ports.map(p => testPort(p)));
  console.log(results.filter(r => r.success));
}

run();
