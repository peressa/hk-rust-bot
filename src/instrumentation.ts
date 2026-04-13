export async function register() {
  // Solo ejecutar en el runtime de Node.js (servidor)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    
    // IMPORTANTE: Evitar ejecución durante la fase de build
    // Esto previene intentos de conexión a Rust+ o FCM mientras Next.js recopila metadatos.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log("[Instrumentation] Saltando bootstrapping durante la fase de BUILD.");
      return;
    }

    try {
      console.log("[Instrumentation] Iniciando servicios tácticos de RUST OPS...");
      const { bootstrap } = await import("./lib/rustplus/RustPlusManager");
      await bootstrap();
    } catch (err) {
      console.error("[Instrumentation] Error crítico durante el arranque:", err);
    }
  }
}
