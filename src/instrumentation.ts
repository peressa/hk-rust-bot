export async function register() {
  if (process.env.NEXT_RUNTIME === 'node') {
    const { FcmManager } = await import('@/lib/fcm/FcmManager');
    const { discordBotManager } = await import('@/lib/discord/DiscordBotManager');
    const db = (await import('@/lib/db')).default;
    
    console.log('[Instrumentation] Initializing Rust+ Bot Persistence...');
    
    // Discord Bot Init
    discordBotManager.init().catch(err => console.error("[Instrumentation] Discord Bot failed to start:", err));
    
    try {
      const { isWhitelisted } = await import('@/lib/db');
      const stmt = db.prepare("SELECT steamId FROM fcm_keys");
      const users = stmt.all() as any[];
      
      console.log(`[Instrumentation] Found ${users.length} registered users. Verifying licenses...`);
      
      for (const user of users) {
        try {
          const whitelistEntry = isWhitelisted(user.steamId);
          if (!whitelistEntry) {
            console.log(`[Instrumentation] Skipping ${user.steamId}: No active license found.`);
            continue;
          }

          await FcmManager.listen(user.steamId, (data) => {
            console.log(`[Instrumentation] Bot received signal for ${user.steamId}`);
          });
          console.log(`[Instrumentation] Resumed listener for ${user.steamId} (${whitelistEntry.role})`);
        } catch (err) {
          console.error(`[Instrumentation] Failed to resume listener for ${user.steamId}:`, err);
        }
      }
      
      console.log('[Instrumentation] Rust+ Bot startup sequence complete.');
    } catch (err) {
      console.error('[Instrumentation] Error accessing database during startup:', err);
    }
  }
}
