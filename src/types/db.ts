export interface DbServer {
  id: string;
  steamId: string;
  ip: string;
  port: string;
  playerId: string;
  playerToken: string;
  name: string;
  useProxy: number; // SQLite boolean (0/1)
  discordWebhook: string | null;
  discordChannelId: string | null;
  bmId: string | null;
  botPrefix: string;
  botTemplates: string | null; // JSON string
}

export interface DbEntity {
  id: string;
  steamId: string;
  serverId: string;
  entityId: string;
  entityType: number;
  name: string;
  value: number;
  capacity: number;
  hasCapacity: number;
}

export interface DbMapCache {
  serverId: string;
  jpgImage: string;
  width: number;
  height: number;
  mapSize: number;
  oceanMargin: number;
  monuments: string; // JSON string
  updatedAt: string;
}

export interface DbWhitelist {
  steamId: string;
  discordId: string | null;
  name: string;
  role: 'user' | 'admin';
  expiresAt: string | null;
  createdAt: string;
}
