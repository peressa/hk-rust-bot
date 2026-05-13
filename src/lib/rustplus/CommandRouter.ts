import { rustPlusManager } from "./RustPlusManager";
import { 
  addTrackingTarget, 
  removeTrackingTarget, 
  getTrackingTargets, 
  getServers, 
  addToBanWatchlist, 
  removeFromBanWatchlist, 
  getBanWatchlist 
} from "../db";

export class CommandRouter {
  static async handle(steamId: string, ip: string, cmd: string) {
    const rawCommand = cmd.trim();
    const splitCmd = rawCommand.toLowerCase().split(" ");
    const baseCommand = splitCmd[0];
    const args = rawCommand.split(" ").slice(1).join(" ");
    
    console.log(`[Command Router] Procesando: "${baseCommand}" desde ${steamId} en ${ip}`);
    
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
        case "!evento":
          return await this.cmdEvents(steamId, ip);
        case "!team":
        case "!equipo":
          return await this.cmdTeam(steamId, ip);
        case "!mapa":
        case "!seed":
        case "!map":
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
        case "!wb":
          return await this.cmdWatchBan(steamId, ip, args);
        case "!uwb":
          return await this.cmdUnwatchBan(steamId, ip, args);
        default:
          return; // Comando no reconocido
      }
    } catch (err) {
      console.error("[Command Router Error]:", err);
    }
  }

  private static async cmdTime(steamId: string, ip: string) {
    const timeResp = await rustPlusManager.sendRequest(steamId, ip, { getTime: {} });
    const t = timeResp.response.time;
    const hours = Math.floor(t.time);
    const mins = Math.floor((t.time - hours) * 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    let remainingMsg = "";
    const sunrise = t.sunrise || 8.0;
    const sunset = t.sunset || 20.0;
    const dayLength = t.dayLengthMinutes || 60;
    
    if (t.time >= sunrise && t.time < sunset) {
        const inGameHours = sunset - t.time;
        const realMins = Math.round(inGameHours * (dayLength / 24));
        remainingMsg = `Faltan ${realMins}m para la noche`;
    } else {
        const inGameHours = (t.time >= sunset) ? (24 - t.time) + sunrise : (sunrise - t.time);
        const realMins = Math.round(inGameHours * (dayLength / 24));
        remainingMsg = `Faltan ${realMins}m para el día`;
    }
    
    // @ts-ignore - Acceso a método privado (temporal hasta refactor completo)
    const msg = rustPlusManager.formatMsg(steamId, ip, 'cmd_time', `Hora: {time} ({remaining})`, { time: formattedTime, remaining: remainingMsg });
    rustPlusManager.sendTeamMessage(steamId, ip, msg);
  }

  private static async cmdPop(steamId: string, ip: string) {
    const infoResp = await rustPlusManager.sendRequest(steamId, ip, { getInfo: {} });
    const i = infoResp.response.info;
    const queuedStr = i.queued > 0 ? ` (Cola: ${i.queued})` : "";
    // @ts-ignore
    const msg = rustPlusManager.formatMsg(steamId, ip, 'cmd_pop', `Poblacion: {players}/{maxPlayers}{queued}`, { 
      players: i.players, 
      maxPlayers: i.maxPlayers, 
      queued: queuedStr
    });
    rustPlusManager.sendTeamMessage(steamId, ip, msg);
  }

  private static async cmdWipe(steamId: string, ip: string) {
    const infoResp = await rustPlusManager.sendRequest(steamId, ip, { getInfo: {} });
    const wipeTime = infoResp.response.info.wipeTime;
    if (wipeTime) {
      const wipeDate = new Date(wipeTime * 1000).toLocaleString('es-AR');
      // @ts-ignore
      const msg = rustPlusManager.formatMsg(steamId, ip, 'cmd_wipe', `Último Wipe: {date}`, { date: wipeDate });
      rustPlusManager.sendTeamMessage(steamId, ip, msg);
    } else {
      // @ts-ignore
      rustPlusManager.sendTeamMessage(steamId, ip, rustPlusManager.formatMsg(steamId, ip, 'cmd_wipe_none', `No hay datos del Wipe.`));
    }
  }

  private static async cmdEvents(steamId: string, ip: string) {
    const markersResp = await rustPlusManager.sendRequest(steamId, ip, { getMapMarkers: {} });
    const markers = markersResp.response.mapMarkers.markers || [];
    const activeEvents: string[] = [];
    
    markers.forEach((m: any) => {
      if (m.type === 5) activeEvents.push("Cargo Ship");
      else if (m.type === 8) activeEvents.push("Heli Patrulla");
      else if (m.type === 4) activeEvents.push("Chinook (CH47)");
      else if (m.type === 6) activeEvents.push("Crate");
      else if (m.type === 2) activeEvents.push("Explosión");
    });

    if (activeEvents.length > 0) {
      const counts: any = {};
      activeEvents.forEach((e: string) => counts[e] = (counts[e] || 0) + 1);
      const eventList = Object.entries(counts).map(([k, v]) => v === 1 ? k : `${v}x ${k}`).join(", ");
      // @ts-ignore
      const msg = rustPlusManager.formatMsg(steamId, ip, 'cmd_events', `Eventos Activos: {list}`, { list: eventList });
      rustPlusManager.sendTeamMessage(steamId, ip, msg);
    } else {
      // @ts-ignore
      rustPlusManager.sendTeamMessage(steamId, ip, rustPlusManager.formatMsg(steamId, ip, 'cmd_events_none', `No hay eventos globales activos en este momento.`));
    }
  }

  private static async cmdTeam(steamId: string, ip: string) {
    const teamResp = await rustPlusManager.sendRequest(steamId, ip, { getTeamInfo: {} });
    const members = teamResp.response.teamInfo.members || [];
    let online = 0;
    let dead = 0;
    members.forEach((m: any) => {
      if (m.isOnline) online++;
      if (!m.isAlive) dead++;
    });
    const details = dead > 0 ? `({dead} Muertos)` : `¡Todos Vivos!`;
    // @ts-ignore
    const msg = rustPlusManager.formatMsg(steamId, ip, 'cmd_team', `Equipo: {online}/{total} Online. {details}`, { 
      online, 
      total: members.length, 
      details: dead > 0 ? details.replace('{dead}', String(dead)) : details 
    });
    rustPlusManager.sendTeamMessage(steamId, ip, msg);
  }

  private static async cmdMap(steamId: string, ip: string) {
    const infoResp = await rustPlusManager.sendRequest(steamId, ip, { getInfo: {} });
    const info = infoResp.response.info;
    // @ts-ignore
    const msg = rustPlusManager.formatMsg(steamId, ip, 'cmd_map', `Mapa: {map} (Tamaño: {size} | Seed: {seed})`, { 
      map: info.map, 
      size: info.mapSize, 
      seed: info.seed 
    });
    rustPlusManager.sendTeamMessage(steamId, ip, msg);
  }

  private static async cmdUpkeep(steamId: string, ip: string) {
    // @ts-ignore
    rustPlusManager.sendTeamMessage(steamId, ip, rustPlusManager.formatMsg(steamId, ip, 'cmd_dashboard_reminder', `Utiliza el Dashboard para ver el mapa y cámaras.`));
  }

  private static async cmdLeader(steamId: string, ip: string, args: string) {
    if (!args) {
      rustPlusManager.sendTeamMessage(steamId, ip, `:exclamation: Uso: !lider <nombre del jugador>`);
      return;
    }
    const teamResp = await rustPlusManager.sendRequest(steamId, ip, { getTeamInfo: {} });
    const members = teamResp.response.teamInfo.members || [];
    const target = members.find((m: any) => m.name && m.name.toLowerCase().includes(args.toLowerCase()));

    if (target) {
      await rustPlusManager.sendRequest(steamId, ip, { promoteToLeader: { steamId: target.steamId } });
      rustPlusManager.sendTeamMessage(steamId, ip, `:exclamation: ${target.name} ha sido promovido a líder del equipo.`);
    } else {
      rustPlusManager.sendTeamMessage(steamId, ip, `:exclamation: No se encontró a nadie llamado "${args}" en el equipo.`);
    }
  }

  private static async cmdHelp(steamId: string, ip: string) {
    rustPlusManager.sendTeamMessage(steamId, ip, `:exclamation: Comandos: !pop, !time, !wipe, !eventos, !team, !mapa, !lider, !tc, !track, !untrack, !targets, !wb, !uwb`);
  }

  private static async cmdTrack(steamId: string, ip: string, args: string) {
    const split = args.split(" ");
    if (split.length < 2) {
      rustPlusManager.sendTeamMessage(steamId, ip, `:exclamation: Uso: !track <steamId> <nombre>`);
      return;
    }
    const targetSteamId = split[0];
    const name = split.slice(1).join(" ");
    
    const server = getServers(steamId).find(s => s.ip === ip);
    if (server) {
      addTrackingTarget(server.id, targetSteamId, name);
      rustPlusManager.sendTeamMessage(steamId, ip, `:white_check_mark: Objetivo '${name}' añadido al rastreo.`);
    }
  }

  private static async cmdUntrack(steamId: string, ip: string, args: string) {
    if (!args) {
      rustPlusManager.sendTeamMessage(steamId, ip, `:exclamation: Uso: !untrack <steamId>`);
      return;
    }
    const server = getServers(steamId).find(s => s.ip === ip);
    if (server) {
      removeTrackingTarget(server.id, args);
      rustPlusManager.sendTeamMessage(steamId, ip, `:white_check_mark: Objetivo con SteamID ${args} eliminado.`);
    }
  }

  private static async cmdTargets(steamId: string, ip: string) {
    const server = getServers(steamId).find(s => s.ip === ip);
    if (server) {
      const targets = getTrackingTargets(server.id);
      if (targets.length === 0) {
        rustPlusManager.sendTeamMessage(steamId, ip, `:exclamation: No hay objetivos en seguimiento.`);
        return;
      }
      const list = targets.map(t => `${t.name} (${t.isOnline ? 'ON' : 'OFF'})`).join(", ");
      rustPlusManager.sendTeamMessage(steamId, ip, `:dart: Objetivos: ${list}`);
    }
  }

  private static async cmdWatchBan(steamId: string, ip: string, args: string) {
    const split = args.split(" ");
    if (split.length < 1 || !split[0]) {
      rustPlusManager.sendTeamMessage(steamId, ip, `:exclamation: Uso: !wb <steamId> [nombre]`);
      return;
    }
    const targetSteamId = split[0];
    const name = split.slice(1).join(" ") || "Sospechoso";
    
    addToBanWatchlist(targetSteamId, name);
    rustPlusManager.sendTeamMessage(steamId, ip, `:shield: Objetivo '${name}' (${targetSteamId}) añadido a la vigilancia global.`);
  }

  private static async cmdUnwatchBan(steamId: string, ip: string, args: string) {
    if (!args) {
      rustPlusManager.sendTeamMessage(steamId, ip, `:exclamation: Uso: !uwb <steamId>`);
      return;
    }
    removeFromBanWatchlist(args);
    rustPlusManager.sendTeamMessage(steamId, ip, `:shield: SteamID ${args} eliminado de la vigilancia.`);
  }
}
