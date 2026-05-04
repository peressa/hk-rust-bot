"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings, ShieldCheck, Cpu, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import ManualPairingInput from "@/components/dashboard/ManualPairingInput";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [authToken, setAuthToken] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const discordId = (session?.user as any)?.discordId;

  const handleLinkDiscord = () => {
    signIn('discord', { callbackUrl: '/dashboard/settings' });
  };

  const handleSyncDiscord = async () => {
    if (!discordId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/link", {
        method: "POST",
        body: JSON.stringify({ discordId })
      });
      if (res.ok) {
        alert("✅ Sincronización exitosa. El bot ya debería reconocerte.");
      } else {
        alert("❌ Error al sincronizar. Revisa los logs del servidor.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
                    <ExternalLink size={20} /> Vinculación Manual
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 700 }}>
                    Si el bot no detecta automáticamente tu servidor, pega el enlace de Rust+ aquí.
                    </p>
                    <ManualPairingInput onPaired={() => {}} />
                </section>

                {/* Registration Section */}
                <section className="premium-card">
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-barlow)', fontSize: '1.5rem' }}>
                    <Cpu size={20} /> Identidad Virtual (FCM)
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
                            href="https://companion-rust.facepunch.com/login" 
                            target="_blank" 
                            style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                        >
                            ¿Dónde consigo el token? <ExternalLink size={10} />
                        </a>
                    </div>
                </section>

                {/* Discord Integration Section */}
                <section className="premium-card" style={{ borderTop: '1px solid rgba(88, 101, 242, 0.3)' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-barlow)', fontSize: '1.5rem', color: '#5865F2' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    Integración de Discord
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 700 }}>
                    Vincula el bot a tu servidor para recibir alertas de raid, muertes y controlar dispositivos mediante comandos slash.
                    </p>
                    
                    <div style={{ background: 'rgba(88, 101, 242, 0.1)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(88, 101, 242, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#5865F2', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Cuenta de Discord</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {discordId ? (
                                        <>
                                            <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
                                            ID: {discordId}
                                            <button 
                                                onClick={handleSyncDiscord}
                                                style={{ marginLeft: '1rem', fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-barlow)', fontWeight: 800 }}
                                            >
                                                Sincronizar DB
                                            </button>
                                        </>
                                    ) : (
                                        "No vinculada"
                                    )}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {!discordId && (
                                    <button 
                                        onClick={handleLinkDiscord}
                                        className="btn-primary"
                                        style={{ background: '#5865F2', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        Vincular Mi Cuenta
                                    </button>
                                )}
                                <a 
                                    href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=2147862528&scope=bot+applications.commands&integration_type=0`}
                                    target="_blank"
                                    className="btn-primary"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <ExternalLink size={16} /> Invitar Bot al Servidor
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Status Section */}
                <div className="premium-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-barlow)', color: '#aaa' }}>
                    <ShieldCheck size={20} /> Estado de Conexión
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <StatusLine label="Escucha de Señales" value={status?.listening ? "Activo" : "Inactivo"} color={status?.listening ? "#22c55e" : "#ef4444"} />
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
