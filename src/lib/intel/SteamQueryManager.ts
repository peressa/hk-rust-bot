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

      client.on("message", (msg) => {
        // Ignorar cabecera de 4 bytes (0xFFFFFFFF)
        const response = msg.slice(4);
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
              // Índice (saltar)
              offset++; 
              
              // Nombre (String terminado en nulo)
              let nameEnd = response.indexOf(0x00, offset);
              if (nameEnd === -1) break;
              const name = response.slice(offset, nameEnd).toString("utf-8");
              offset = nameEnd + 1;

              // Puntuación (Long 4 bytes)
              const score = response.readInt32LE(offset);
              offset += 4;

              // Duración (Float 4 bytes)
              const duration = response.readFloatLE(offset);
              offset += 4;

              if (name) {
                players.push({ name, score, duration });
              }
            }
            resolve(players);
          } catch (e) {
            reject(new Error("Error al parsear la respuesta del servidor"));
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
