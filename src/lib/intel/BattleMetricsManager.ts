export class BattleMetricsManager {
  private static BASE_URL = "https://api.battlemetrics.com";

  static async getServerInfo(bmId: string) {
    if (!bmId) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/servers/${bmId}?include=player,session`);
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

  static async getPopulationHistory(bmId: string) {
    // BattleMetrics public specific endpoint for population
    // Note: real history often requires an API key, but we can get the current 
    // data which includes "rank" and "status".
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
