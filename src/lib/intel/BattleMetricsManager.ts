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
}
