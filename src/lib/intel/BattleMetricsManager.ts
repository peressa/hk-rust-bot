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
        isOnline,
        name: player.attributes?.name,
        lastSeen: player.attributes?.updatedAt
      };
    } catch (err) {
      console.warn("[BattleMetrics] Error checking player status:", err);
      return null;
    }
  }
}
