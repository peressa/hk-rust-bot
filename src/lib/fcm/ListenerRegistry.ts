/**
 * ListenerRegistry.ts
 * Singleton to manage active FCM listeners across the application.
 */
export class ListenerRegistry {
  private static instance: ListenerRegistry;
  private listeners: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ListenerRegistry {
    const globalStore = global as any;
    if (!globalStore._listenerRegistry) {
      globalStore._listenerRegistry = new ListenerRegistry();
    }
    return globalStore._listenerRegistry;
  }

  isListening(steamId: string): boolean {
    return this.listeners.has(steamId);
  }

  setListener(steamId: string, client: any) {
    // If already listening, destroy old one
    if (this.listeners.has(steamId)) {
      try {
        this.listeners.get(steamId).destroy();
      } catch (e) {
        console.error(`[Registry] Error destroying old listener for ${steamId}:`, e);
      }
    }
    this.listeners.set(steamId, client);
    console.log(`[Registry] Listener registered for ${steamId}. Total active: ${this.listeners.size}`);
  }

  removeListener(steamId: string) {
    if (this.listeners.has(steamId)) {
      try {
        this.listeners.get(steamId).destroy();
      } catch (e) {}
      this.listeners.delete(steamId);
      console.log(`[Registry] Listener removed for ${steamId}. Total active: ${this.listeners.size}`);
    }
  }

  getActiveSteamIds(): string[] {
    return Array.from(this.listeners.keys());
  }
}

export const listenerRegistry = ListenerRegistry.getInstance();
