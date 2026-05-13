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
}
