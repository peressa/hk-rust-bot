export class BattleMetricsManager {
  private static BASE_URL = "https://api.battlemetrics.com";
  private static API_KEY = process.env.BATTLEMETRICS_TOKEN || "";

  /**
   * Obtiene información detallada de un servidor.
   */
  static async getServerInfo(bmId: string) {
    if (!bmId) return null;
    try {
      const headers: any = {};
      if (this.API_KEY) headers["Authorization"] = `Bearer ${this.API_KEY}`;

      const res = await fetch(`${this.BASE_URL}/servers/${bmId}?include=player,session`, { headers });
      if (!res.ok) {
        console.warn(`[BattleMetrics] Error fetching server ${bmId}: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.warn("[BattleMetrics] Failed to fetch server info:", err);
      return null;
    }
  }

  /**
   * Busca un servidor por su dirección IP y puerto.
   */
  static async getServerByIP(ip: string, port?: string) {
    try {
      const headers: any = {};
      if (this.API_KEY) headers["Authorization"] = `Bearer ${this.API_KEY}`;

      let url = `${this.BASE_URL}/servers?filter[address]=${ip}`;
      if (port) url += `&filter[port]=${port}`;

      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data?.[0] || null;
    } catch (err) {
      console.error("[BattleMetrics] Error searching server by IP:", err);
      return null;
    }
  }

  /**
   * Busca jugadores por nombre.
   */
  static async searchPlayer(name: string) {
    if (!name) return [];
    try {
      const headers: any = {};
      if (this.API_KEY) headers["Authorization"] = `Bearer ${this.API_KEY}`;

      const res = await fetch(`${this.BASE_URL}/players?filter[search]=${encodeURIComponent(name)}&include=server`, { headers });
      if (!res.ok) {
        console.warn(`[BattleMetrics] Player search error: ${res.status}`);
        return [];
      }
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("[BattleMetrics] Failed to search player:", err);
      return [];
    }
  }

  /**
   * Obtiene las sesiones activas de un jugador por su ID de BattleMetrics.
   */
  static async getPlayerSessions(playerId: string) {
    try {
      const headers: any = {};
      if (this.API_KEY) headers["Authorization"] = `Bearer ${this.API_KEY}`;

      const res = await fetch(`${this.BASE_URL}/players/${playerId}/relationships/sessions`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      return [];
    }
  }

  static async getPopulationHistory(bmId: string) {
    return this.getServerInfo(bmId);
  }

  static async getPlayerStatus(serverId: string, steamId: string) {
    if (!serverId || !steamId) return null;
    try {
      // We search for the player on the specific server
      // Note: This often requires an API key for full accuracy, but we can try 
      // the public search if available or filter from server info.
      const res = await fetch(`${this.BASE_URL}/players?filter[servers]=${serverId}&filter[search]=${steamId}`);
      if (!res.ok) return null;
      const data = await res.json();
      
      const player = data.data?.[0];
      if (!player) return { isOnline: false };

      // Check if the player is currently in a session on this server
      const isOnline = player.relationships?.session?.data !== null;
      return {
        id: player.id,
        isOnline,
        name: player.attributes?.name,
        lastSeen: player.attributes?.updatedAt
      };
    } catch (err) {
      console.warn("[BattleMetrics] Error checking player status:", err);
      return null;
    }
  }

  /**
   * Fetches the list of all currently online players for a server.
   * This is much more efficient than checking players one by one.
   */
  static async getOnlinePlayers(bmServerId: string) {
    if (!bmServerId) return [];
    try {
      // BattleMetrics /servers/:id?include=player returns the first page of players.
      // For large servers, we might need to use the /players endpoint with filter[servers].
      const res = await fetch(`${this.BASE_URL}/players?filter[servers]=${bmServerId}&filter[online]=true&page[size]=100`);
      if (!res.ok) return [];
      const data = await res.json();
      
      return (data.data || []).map((p: any) => ({
        steamId: p.attributes?.id, // Note: This might be BM ID, we need to find the SteamID in identifiers
        name: p.attributes?.name,
        // BattleMetrics identifiers are usually in relationships or can be fetched separately.
        // Public API sometimes limits identifier access.
        id: p.id 
      }));
    } catch (err) {
      console.warn("[BattleMetrics] Error fetching online players:", err);
      return [];
    }
  }

  /**
   * Busca jugadores por nombre filtrando por un servidor específico de BattleMetrics.
   */
  static async searchPlayerInServer(name: string, bmServerId: string) {
    try {
      const headers: any = {};
      if (this.API_KEY) headers["Authorization"] = `Bearer ${this.API_KEY}`;
      const res = await fetch(`${this.BASE_URL}/players?filter[search]=${encodeURIComponent(name)}&filter[servers]=${bmServerId}&page[size]=5`, { headers });
      if (!res.ok) return { data: [] };
      return await res.json();
    } catch (err) {
      return { data: [] };
    }
  }

  /**
   * Fetches full player details including identifiers (SteamID) if available.
   */
  static async getPlayerDetails(bmPlayerId: string) {
    try {
      const res = await fetch(`${this.BASE_URL}/players/${bmPlayerId}?include=identifier`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  }
}
