"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings, ShieldCheck, Cpu, ExternalLink, RefreshCw } from "lucide-react";
import ManualPairingInput from "@/components/dashboard/ManualPairingInput";

export default function SettingsPage() {
  const [authToken, setAuthToken] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fcm/register", {
        method: "POST",
        body: JSON.stringify({ authToken })
      });
      const data = await res.json();
      if (res.ok) {
        alert("¡Registro exitoso! Identidad UUID generada con éxito.");
        fetchStatus();
      } else {
        alert("Error: " + (data.error || "Fallo en el registro"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("¿Estás seguro? Esto borrará tus credenciales actuales y detendrá la escucha de señales.")) return;
    setLoading(true);
    try {
      await fetch("/api/fcm/unregister", { method: "POST" });
      setAuthToken("");
      fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/fcm/status");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', letterSpacing: '0.05em' }}>
            Ajustes del Sistema
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Configuración de Identidad y Terminal de Enlace
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Manual Pairing Section */}
                <section className="premium-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-barlow)', fontSize: '1.5rem' }}>
                    <ExternalLink size={20} /> VINCULACIÓN MANUAL
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 700 }}>
                    Si el bot no detecta automáticamente tu servidor, pega el enlace de Rust+ aquí.
                    </p>
                    <ManualPairingInput onPaired={() => {}} />
                </section>

                {/* Registration Section */}
                <section className="premium-card">
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-barlow)', fontSize: '1.5rem' }}>
                    <Cpu size={20} /> IDENTIDAD VIRTUAL (FCM)
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 700 }}>
                    Necesitas registrar este navegador para recibir señales de emparejamiento.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                                type="password" 
                                value={authToken}
                                onChange={(e) => setAuthToken(e.target.value)}
                                placeholder="AUTH TOKEN..." 
                                style={{ flex: 1, background: 'rgba(0,0,0,0.4)', color: 'white' }}
                            />
                            <button 
                                className="btn-primary" 
                                disabled={loading || !authToken}
                                onClick={handleRegister}
                            >
                                {loading ? <RefreshCw size={18} className="animate-spin" /> : "Vincular"}
                            </button>
                        </div>
                        <a 
                            href="https://companion-rust.facepunch.com/" 
                            target="_blank" 
                            style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                        >
                            ¿D�nde consigo el token? <ExternalLink size={10} />
                        </a>
                    </div>
                </section>
            </div>

            <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Status Section */}
                <div className="premium-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-barlow)', color: '#aaa' }}>
                    <ShieldCheck size={20} /> Estado de Conexi�n
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <StatusLine label="Escucha de Se�ales" value={status?.listening ? "Activo" : "Inactivo"} color={status?.listening ? "#22c55e" : "#ef4444"} />
                        <StatusLine label="Estado de Cifrado" value={status?.hasKeys ? "Cifrado" : "Pendiente"} color={status?.hasKeys ? "#22c55e" : "#ef4444"} />
                    </div>
                    
                    {status?.hasKeys && (
                    <button 
                        onClick={handleReset}
                        style={{ 
                        marginTop: '2rem', 
                        fontSize: '0.7rem', 
                        color: '#ef4444', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontWeight: 900,
                        textTransform: 'uppercase'
                        }}
                    >
                        Reiniciar Identidad
                    </button>
                    )}
                </div>

                <div className="premium-card" style={{ padding: '1rem', borderStyle: 'dashed' }}>
                    <h4 style={{ fontSize: '0.75rem', fontFamily: 'var(--font-barlow)', marginBottom: '0.5rem' }}>Consejo</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 700 }}>
                        SI EL BOT NO DETECTA TUS SERVIDORES, USA EL BOTON DE RESET Y VUELVE A VINCULARTE PARA GENERAR UNA NUEVA ID.
                    </p>
                </div>
            </aside>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusLine({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 900, marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 900, color, fontFamily: 'var(--font-barlow)' }}>{value}</div>
    </div>
  );
}
