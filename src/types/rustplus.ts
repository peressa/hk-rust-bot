export interface RustPlusInfo {
  name: string;
  headerImage: string;
  url: string;
  map: string;
  mapSize: number;
  wipeTime: number;
  players: number;
  maxPlayers: number;
  queued: number;
  seed: number;
  salt: number;
  logoImage?: string;
}

export interface RustPlusTime {
  dayLengthMinutes: number;
  timeScale: number;
  sunrise: number;
  sunset: number;
  time: number;
}

export interface RustPlusMember {
  steamId: string;
  name: string;
  x: number;
  y: number;
  isOnline: boolean;
  spawnTime: number;
  isAlive: boolean;
  deathTime: number;
  grid?: string;
  afkSince?: number | null;
  lastAfkAlertMin?: number;
  lastOfflineTime?: number;
  lastOnlineTime?: number;
}

export interface RustPlusTeamInfo {
  leaderSteamId: string;
  members: RustPlusMember[];
}

export interface RustPlusMarker {
  id: number;
  type: number;
  x: number;
  y: number;
  steamId?: string;
  rotation?: number;
  radius?: number;
  name?: string;
  sellOrders?: any[];
}

export interface RustPlusMapMarkers {
  markers: RustPlusMarker[];
}

export interface RustPlusMap {
  width: number;
  height: number;
  jpgImage: any;
  oceanMargin: number;
  monuments: any[];
}

export interface RustPlusResponse {
  seq: number;
  response: {
    info?: RustPlusInfo;
    time?: RustPlusTime;
    map?: RustPlusMap;
    teamInfo?: RustPlusTeamInfo;
    mapMarkers?: RustPlusMapMarkers;
    entityInfo?: any;
    error?: { error: string };
  };
}

export interface RustPlusMessage {
  broadcast?: {
    teamMessage?: {
      message: {
        steamId: string;
        name: string;
        message: string;
        color: string;
        time: number;
      };
    };
    teamChanged?: any;
    entityChanged?: any;
  };
  response?: RustPlusResponse["response"];
}
