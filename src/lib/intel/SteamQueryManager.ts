import dgram from "dgram";

export interface SteamPlayer {
  name: string;
  score: number;
  duration: number;
}

export class SteamQueryManager {
  private static TIMEOUT = 5000;

  /**
   * Obtiene la lista de jugadores directamente desde el servidor usando el protocolo A2S_PLAYER.
   */
  static async getPlayers(ip: string, queryPort: number): Promise<SteamPlayer[]> {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket("udp4");
      const players: SteamPlayer[] = [];
      let challenge: Buffer | null = null;

      const timer = setTimeout(() => {
        client.close();
        reject(new Error("Timeout al consultar el servidor (A2S)"));
      }, this.TIMEOUT);

      const sendRequest = (payload: Buffer) => {
        const header = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
        const packet = Buffer.concat([header, payload]);
        client.send(packet, queryPort, ip);
      };

      // 1. Enviar solicitud inicial para obtener el Challenge Token
      sendRequest(Buffer.concat([Buffer.from([0x55]), Buffer.from([0xFF, 0xFF, 0xFF, 0xFF])]));

      const multiPackets: { [id: number]: { total: number, packets: Buffer[] } } = {};

      const processResponse = (response: Buffer) => {
        const type = response[0];

        if (type === 0x41) { // Challenge Response
          challenge = response.slice(1);
          // 2. Con el challenge recibido, solicitar la lista real de jugadores
          sendRequest(Buffer.concat([Buffer.from([0x55]), challenge]));
        } 
        else if (type === 0x44) { // Player Response
          clearTimeout(timer);
          client.close();
          
          try {
            const playerCount = response[1];
            let offset = 2;

            for (let i = 0; i < playerCount; i++) {
              offset++; // Índice (saltar)
              
              let nameEnd = response.indexOf(0x00, offset);
              if (nameEnd === -1) break;
              const name = response.slice(offset, nameEnd).toString("utf-8");
              offset = nameEnd + 1;

              const score = response.readInt32LE(offset);
              offset += 4;
              const duration = response.readFloatLE(offset);
              offset += 4;

              if (name) players.push({ name, score, duration });
            }
            resolve(players);
          } catch (e) {
            reject(new Error("Error al parsear la respuesta de Horus"));
          }
        }
      };

      client.on("message", (msg) => {
        const header = msg.readInt32LE(0);

        if (header === -1) { 
          // Paquete Único (0xFFFFFFFF)
          processResponse(msg.slice(4));
        } 
        else if (header === -2) { 
          // Multi-Paquete (0xFEFFFFFF) - Común en servidores llenos
          const id = msg.readInt32LE(4);
          const total = msg[8];
          const number = msg[9];
          
          // Verificar si el MSB de ID es 1 (Compresión BZip2). Si es así, es complejo, pero Rust rara vez lo usa.
          const isCompressed = (id & 0x80000000) !== 0;
          if (isCompressed) {
             console.warn("[Horus] Servidor usa compresión BZip2, respuesta omitida.");
             return;
          }

          const payload = msg.slice(12);

          if (!multiPackets[id]) {
            multiPackets[id] = { total, packets: [] };
          }
          multiPackets[id].packets[number] = payload;

          // Comprobar si tenemos todos los fragmentos
          let allReceived = true;
          for (let i = 0; i < total; i++) {
            if (!multiPackets[id].packets[i]) allReceived = false;
          }

          if (allReceived) {
            let fullPayload = Buffer.concat(multiPackets[id].packets);
            // Si el paquete reensamblado comienza con 0xFFFFFFFF (estándar A2S), lo saltamos
            if (fullPayload.length >= 4 && fullPayload.readInt32LE(0) === -1) {
              fullPayload = fullPayload.slice(4);
            }
            processResponse(fullPayload);
          }
        }
      });

      client.on("error", (err) => {
        clearTimeout(timer);
        client.close();
        reject(err);
      });
    });
  }

  /**
   * Verifica si un jugador específico está en un servidor.
   */
  static async isPlayerOnline(ip: string, queryPort: number, targetName: string): Promise<boolean> {
    try {
      const players = await this.getPlayers(ip, queryPort);
      return players.some(p => p.name.toLowerCase().includes(targetName.toLowerCase()));
    } catch (e) {
      return false;
    }
  }
}
