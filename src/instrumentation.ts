export async function register() {
  if (process.env.NEXT_RUNTIME === 'node') {
    const { FcmManager } = await import('@/lib/fcm/FcmManager');
    const db = (await import('@/lib/db')).default;
    
    console.log('[Instrumentation] Initializing Rust+ Bot Persistence...');
    
    try {
      const stmt = db.prepare("SELECT steamId FROM fcm_keys");
      const users = stmt.all() as any[];
      
      console.log(`[Instrumentation] Found ${users.length} registered users. Resuming listeners...`);
      
      for (const user of users) {
        try {
          // FcmManager.listen handles duplicates via the registry we'll update next
          await FcmManager.listen(user.steamId, (data) => {
            console.log(`[Instrumentation] Bot received signal for ${user.steamId}`);
          });
          console.log(`[Instrumentation] Resumed listener for ${user.steamId}`);
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
