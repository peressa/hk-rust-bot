"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Terminal, RefreshCw, AlertTriangle, Database } from "lucide-react";

export default function DebugPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/debug/fcm");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Terminal color="var(--primary)" /> Consola de Diagnóstico
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Monitorea las señales FCM crudas recibidas desde Facepunch.</p>
          </div>
          <button onClick={fetchLogs} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refrescar
          </button>
        </header>

        <section className="premium-card" style={{ background: '#0a0a0b', border: '1px solid var(--border)', padding: '0' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#22c55e' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div> Escuchando señales...
            </div>
          </div>
          
          <div style={{ height: '500px', overflowY: 'auto', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {logs.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <Database size={48} style={{ marginBottom: '1rem' }} />
                <p>No se han recibido paquetes todavía.</p>
                <p style={{ fontSize: '0.75rem' }}>Intenta pulsar "Pair" en Rust ahora.</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', opacity: 0.6, fontSize: '0.75rem' }}>
                    <span>PAQUETE #{logs.length - i}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#e2e8f0', lineHeight: 1.5 }}>
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </section>

        <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <AlertTriangle color="#eab308" size={24} />
            <div>
              <h4 style={{ color: '#eab308', margin: '0 0 0.5rem 0' }}>¿Cómo usar esta consola?</h4>
              <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
                Deja esta página abierta y pulsa <strong>"Pair with Server"</strong> en Rust. Si el bot recibe la señal, aparecerá aquí instantáneamente. Si no aparece nada, el problema está en la conexión entre Facepunch y el servidor (FCM Keys).
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
