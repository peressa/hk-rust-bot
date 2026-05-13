import { rustPlusManager } from "./RustPlusManager";
import { 
  getServers, 
  addTrackedPlayer,
  getTrackedPlayers,
  removeTrackedPlayer,
  addToBanWatchlist, 
  removeFromBanWatchlist, 
  getBanWatchlist 
} from "../db";
import { SteamQueryManager } from "../intel/SteamQueryManager";
import { BattleMetricsManager } from "../intel/BattleMetricsManager";

export class CommandRouter {
  static async handle(steamId: string, ip: string, cmd: string) {
    const rawCommand = cmd.trim();
    const splitCmd = rawCommand.toLowerCase().split(" ");
    const baseCommand = splitCmd[0];
    const args = rawCommand.split(" ").slice(1).join(" ");
    
    console.log(`[Command Router] Operación: "${baseCommand}" | Origen: ${steamId} | Nodo: ${ip}`);
    
    try {
      switch (baseCommand) {
        case "!time":
        case "!hora":
          return await this.cmdTime(steamId, ip);
        case "!pop":
        case "!jugadores":
          return await this.cmdPop(steamId, ip);
        case "!wipe":
          return await this.cmdWipe(steamId, ip);
        case "!eventos":
        case "!events":
          return await this.cmdEvents(steamId, ip);
        case "!team":
        case "!equipo":
          return await this.cmdTeam(steamId, ip);
        case "!mapa":
        case "!seed":
          return await this.cmdMap(steamId, ip);
        case "!upkeep":
        case "!tc":
          return await this.cmdUpkeep(steamId, ip);
        case "!lider":
        case "!leader":
          return await this.cmdLeader(steamId, ip, args);
        case "!help":
        case "!ayuda":
          return await this.cmdHelp(steamId, ip);
        case "!track":
          return await this.cmdTrack(steamId, ip, args);
        case "!untrack":
          return await this.cmdUntrack(steamId, ip, args);
        case "!targets":
        case "!objetivos":
          return await this.cmdTargets(steamId, ip);
        case "!status":
          return await this.cmdStatus(steamId, ip);
        case "!wb":
          return await this.cmdWatchBan(steamId, ip, args);
        case "!uwb":
          return await this.cmdUnwatchBan(steamId, ip, args);
        default:
          return;
      }
    } catch (err) {
      console.error("[Command Router Error]:", err);
    }
  }

  /**
   * !track <nombre> - Inteligencia de búsqueda y fijado de objetivos.
   */
  private static async cmdTrack(steamId: string, ip: string, args: string) {
    if (!args) {
        this.sendResponse(steamId, ip, "Uso: !track <nombre_o_id>");
        return;
    }

    const server = getServers(steamId).find(s => s.ip === ip);
    if (!server) return;

    this.sendResponse(steamId, ip, `Iniciando búsqueda táctica de '${args}'...`);

    try {
        // 1. MODO HORUS: Intento de localización local con múltiples puertos
        const gamePort = parseInt(server.port);
        const portsToTry = [gamePort + 1, gamePort + 215, gamePort, 28016, 28015, 27015];
        let players: any[] = [];
        let successPort = 0;

        for (const port of portsToTry) {
            try {
                console.log(`[Track] Probando puerto de consulta: ${port}...`);
                const result = await Promise.race([
                    SteamQueryManager.getPlayers(server.ip, port),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
                ]) as any[];
                
                if (result && result.length > 0) {
                    players = result;
                    successPort = port;
                    break;
                }
            } catch (e) {}
        }

        if (players.length > 0) {
            // BUSQUEDA DIFUSA (Fuzzy Match)
            // Prioridad 1: Coincidencia exacta (ignorando mayúsculas)
            // Prioridad 2: Empieza por el texto
            // Prioridad 3: Contiene el texto
            const search = args.toLowerCase();
            const match = players.find(p => p.name.toLowerCase() === search) ||
                          players.find(p => p.name.toLowerCase().startsWith(search)) ||
                          players.find(p => p.name.toLowerCase().includes(search));

            if (match) {
                addTrackedPlayer({ 
                    id: null,
                    name: match.name, 
                    targetServerIp: `${server.ip}:${server.port}` 
                });
                this.sendResponse(steamId, ip, `¡OBJETIVO FIJADO! '${match.name}' detectado en puerto ${successPort}. Vigilancia Horus activada.`);
                return;
            }
        }

        // 2. MODO GLOBAL: BattleMetrics
        console.log(`[Track] No detectado localmente. Consultando red global para '${args}'...`);
        const bmMatch = await BattleMetricsManager.searchPlayer(args).catch(() => null);
        
        if (bmMatch?.data?.length > 0) {
            // También aplicamos fuzzy match a los resultados de BM
            const bmPlayers = bmMatch.data;
            const search = args.toLowerCase();
            const p = bmPlayers.find((item: any) => item.attributes.name.toLowerCase() === search) ||
                      bmPlayers.find((item: any) => item.attributes.name.toLowerCase().startsWith(search)) ||
                      bmPlayers[0];

            addTrackedPlayer({ id: p.id, name: p.attributes.name });
            this.sendResponse(steamId, ip, `Objetivo '${p.attributes.name}' localizado en red global. Vigilancia 24/7 iniciada.`);
            return;
        }

        // 3. Fallback: Vigilancia ciega (por si entra más tarde)
        addTrackedPlayer({ id: null, name: args, targetServerIp: `${server.ip}:${server.port}` });
        this.sendResponse(steamId, ip, `Sujeto '${args}' no localizado online. Se ha activado la vigilancia reactiva (avisaré si asoma por el servidor).`);

    } catch (err) {
        console.error("[Track Command] Fallo:", err);
        this.sendResponse(steamId, ip, "Error en el sistema de búsqueda. Vigilancia reactiva activada por seguridad.");
    }
  }

  private static async cmdUntrack(steamId: string, ip: string, args: string) {
    if (!args) {
      this.sendResponse(steamId, ip, "Uso: !untrack <nombre>");
      return;
    }

    const tracked = getTrackedPlayers();
    const target = tracked.find(t => t.name.toLowerCase().includes(args.toLowerCase()));
    
    if (target) {
      removeTrackedPlayer(target.id);
      this.sendResponse(steamId, ip, `Vigilancia finalizada para '${target.name}'.`);
    } else {
      this.sendResponse(steamId, ip, `No se encontró a '${args}' en la lista de objetivos.`);
    }
  }

  private static async cmdTargets(steamId: string, ip: string) {
    const targets = getTrackedPlayers();
    if (targets.length === 0) {
      this.sendResponse(steamId, ip, "Sin objetivos activos en seguimiento.");
      return;
    }
    const list = targets.map((t: any) => `${t.name} [${t.status?.toUpperCase() || 'IDLE'}]`).join(", ");
    this.sendResponse(steamId, ip, `Lista de Inteligencia: ${list}`);
  }

  private static async cmdStatus(steamId: string, ip: string) {
    const targets = getTrackedPlayers().length;
    const bans = getBanWatchlist().length;
    const statusMsg = `SISTEMAS OPERATIVOS: [Rastreo: ${targets} objetivos] [Seguridad: ${bans} sospechosos] [Conexión: ESTABLE]`;
    this.sendResponse(steamId, ip, statusMsg);
  }

  private static async cmdTime(steamId: string, ip: string) {
    const timeResp = await rustPlusManager.sendRequest(steamId, ip, { getTime: {} });
    const t = timeResp.response.time;
    const hours = Math.floor(t.time);
    const mins = Math.floor((t.time - hours) * 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    this.sendResponse(steamId, ip, `Hora In-Game: ${formattedTime}`);
  }

  private static async cmdPop(steamId: string, ip: string) {
    const infoResp = await rustPlusManager.sendRequest(steamId, ip, { getInfo: {} });
    const i = infoResp.response.info;
    this.sendResponse(steamId, ip, `Población: ${i.players}/${i.maxPlayers} (Cola: ${i.queued})`);
  }

  private static async cmdWipe(steamId: string, ip: string) {
    const infoResp = await rustPlusManager.sendRequest(steamId, ip, { getInfo: {} });
    const wipeTime = infoResp.response.info.wipeTime;
    const wipeDate = wipeTime ? new Date(wipeTime * 1000).toLocaleString('es-AR') : "Desconocido";
    this.sendResponse(steamId, ip, `Último Wipe detectado: ${wipeDate}`);
  }

  private static async cmdEvents(steamId: string, ip: string) {
    const markersResp = await rustPlusManager.sendRequest(steamId, ip, { getMapMarkers: {} });
    const markers = markersResp.response.mapMarkers.markers || [];
    const eventNames: any = { 5: "Cargo", 8: "Patrol", 4: "Chinook", 6: "Crate", 2: "Explosión" };
    
    const active = markers
        .filter((m: any) => eventNames[m.type])
        .map((m: any) => eventNames[m.type]);

    if (active.length > 0) {
      const counts: any = {};
      active.forEach((e: string) => counts[e] = (counts[e] || 0) + 1);
      const list = Object.entries(counts).map(([k, v]) => v === 1 ? k : `${v}x ${k}`).join(", ");
      this.sendResponse(steamId, ip, `Eventos: ${list}`);
    } else {
      this.sendResponse(steamId, ip, "No hay eventos activos.");
    }
  }

  private static async cmdTeam(steamId: string, ip: string) {
    const teamResp = await rustPlusManager.sendRequest(steamId, ip, { getTeamInfo: {} });
    const members = teamResp.response.teamInfo.members || [];
    const online = members.filter((m: any) => m.isOnline).length;
    this.sendResponse(steamId, ip, `Equipo: ${online}/${members.length} Online.`);
  }

  private static async cmdMap(steamId: string, ip: string) {
    const infoResp = await rustPlusManager.sendRequest(steamId, ip, { getInfo: {} });
    const i = infoResp.response.info;
    this.sendResponse(steamId, ip, `Nodo: ${i.map} | Tamaño: ${i.mapSize} | Seed: ${i.seed}`);
  }

  private static async cmdUpkeep(steamId: string, ip: string) {
    this.sendResponse(steamId, ip, "Consulta el Dashboard para ver el mantenimiento en tiempo real.");
  }

  private static async cmdLeader(steamId: string, ip: string, args: string) {
    if (!args) {
      this.sendResponse(steamId, ip, "Uso: !lider <nombre>");
      return;
    }
    const teamResp = await rustPlusManager.sendRequest(steamId, ip, { getTeamInfo: {} });
    const members = teamResp.response.teamInfo.members || [];
    const target = members.find((m: any) => m.name?.toLowerCase().includes(args.toLowerCase()));

    if (target) {
      await rustPlusManager.sendRequest(steamId, ip, { promoteToLeader: { steamId: target.steamId } });
      this.sendResponse(steamId, ip, `${target.name} ha sido promovido a Líder.`);
    } else {
      this.sendResponse(steamId, ip, `No se encontró a '${args}' en el equipo.`);
    }
  }

  private static async cmdHelp(steamId: string, ip: string) {
    this.sendResponse(steamId, ip, "Comandos: !pop, !time, !wipe, !eventos, !team, !mapa, !lider, !track, !untrack, !targets, !status, !wb");
  }

  private static async cmdWatchBan(steamId: string, ip: string, args: string) {
    const split = args.split(" ");
    if (split.length < 1 || !split[0]) {
      this.sendResponse(steamId, ip, "Uso: !wb <steamId> [nombre]");
      return;
    }
    addToBanWatchlist(split[0], split.slice(1).join(" ") || "Sospechoso");
    this.sendResponse(steamId, ip, `Sujeto añadido a la vigilancia de bloqueos global.`);
  }

  private static async cmdUnwatchBan(steamId: string, ip: string, args: string) {
    if (!args) {
      this.sendResponse(steamId, ip, "Uso: !uwb <steamId>");
      return;
    }
    removeFromBanWatchlist(args);
    this.sendResponse(steamId, ip, `Vigilancia de seguridad retirada para ${args}.`);
  }

  /**
   * Centraliza las respuestas para asegurar el uso del prefijo corporativo.
   */
  private static sendResponse(steamId: string, ip: string, message: string) {
    // @ts-ignore
    const formatted = rustPlusManager.formatMsg(steamId, ip, '', message);
    rustPlusManager.sendTeamMessage(steamId, ip, formatted);
  }
}
