"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings, ShieldCheck, Cpu, ExternalLink, RefreshCw, CheckCircle2, MessageSquare } from "lucide-react";
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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary)', paddingLeft: '2rem' }}>
          <div>
            <div className="text-tech" style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>TACTICAL LINK TERMINAL // SYSTEM SETTINGS</div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', letterSpacing: '-0.03em', lineHeight: 0.9, color: '#fff' }}>
              SYSTEM <span style={{ color: 'var(--primary)' }}>CONFIG</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.75rem', fontWeight: 500, maxWidth: '500px', lineHeight: 1.5 }}>
              Asegure los canales de comunicación y configure su identidad digital para el despliegue de señales.
            </p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* STEP 1: DISCORD VIRTUAL IDENTITY */}
            <section className="premium-card" style={{ borderLeft: `2px solid ${discordId ? 'var(--accent)' : 'var(--primary)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div>
                    <span className="text-tech" style={{ color: discordId ? 'var(--accent)' : 'var(--primary)' }}>STEP 01 // COMMS UPLINK</span>
                    <h3 style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>DISCORD INTEGRATION</h3>
                  </div>
                  {discordId && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900 }}>CONNECTED</div>}
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ background: 'rgba(88, 101, 242, 0.1)', padding: '1.5rem', borderRadius: '50%', color: '#5865F2' }}>
                      <MessageSquare size={40} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: 900, marginBottom: '0.5rem' }}>IDENTITY STATUS</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-barlow)' }}>
                        {discordId ? `ID: ${discordId}` : "IDENTITY NOT FOUND"}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {!discordId ? (
                        <button onClick={handleLinkDiscord} className="btn-primary" style={{ background: '#5865F2', border: 'none', padding: '0.8rem 1.5rem', fontSize: '0.8rem' }}>LINK ACCOUNT</button>
                      ) : (
                        <button disabled className="btn-secondary" style={{ opacity: 0.5, fontSize: '0.8rem' }}>LINKED</button>
                      )}
                      <a href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`} target="_blank" className="btn-secondary" style={{ padding: '0.8rem 1.5rem', fontSize: '0.8rem', borderColor: 'rgba(255,255,255,0.1)' }}>INVITE BOT</a>
                    </div>
                </div>
            </section>

            {/* STEP 2: FCM IDENTITY */}
            <section className="premium-card" style={{ borderLeft: `2px solid ${status?.listening ? 'var(--accent)' : 'var(--warn)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div>
                    <span className="text-tech" style={{ color: status?.listening ? 'var(--accent)' : 'var(--warn)' }}>STEP 02 // VIRTUAL TERMINAL</span>
                    <h3 style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>FCM IDENTITY</h3>
                  </div>
                  {status?.listening && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900 }}>ACTIVE_LISTEN</div>}
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 500, lineHeight: 1.5 }}>
                  Este terminal requiere una identidad virtual para interceptar señales de Rust+. Ingrese su Auth Token de Facepunch para establecer el vínculo.
                </p>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                        type="password" 
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder="ENTER AUTH_TOKEN_SIGMA..." 
                        style={{ flex: 1, background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', fontFamily: 'var(--font-mono)' }}
                    />
                    <button 
                        className="btn-primary" 
                        disabled={loading || !authToken}
                        onClick={handleRegister}
                        style={{ padding: '0 2.5rem' }}
                    >
                        {loading ? <RefreshCw size={18} className="animate-spin" /> : "VINCULAR"}
                    </button>
                </div>
                <div style={{ marginTop: '1.25rem' }}>
                  <a href="https://companion-rust.facepunch.com/login" target="_blank" className="text-tech" style={{ color: 'var(--primary)', textDecoration: 'none', borderBottom: '1px solid rgba(232, 0, 28, 0.2)' }}>
                    OBTENER TOKEN DESDE COMPANION.RUST <ExternalLink size={10} />
                  </a>
                </div>
            </section>

            {/* STEP 3: MANUAL OVERRIDE */}
            <section className="premium-card">
                <span className="text-tech">STEP 03 // MANUAL OVERRIDE</span>
                <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>MANUAL PAIRING</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 500 }}>
                  Enlace manual para servidores con protección de firewall o proxies tácticos.
                </p>
                <ManualPairingInput onPaired={() => {}} />
            </section>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="premium-card" style={{ background: 'rgba(232, 0, 28, 0.02)', border: '1px solid rgba(232, 0, 28, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                  <ShieldCheck size={18} color="var(--primary)" />
                  <h4 style={{ fontSize: '0.85rem', opacity: 0.8 }}>DIAGNOSTICS</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <StatusLine label="ENLACE DE SEÑAL" value={status?.listening ? "ONLINE" : "OFFLINE"} color={status?.listening ? "var(--accent)" : "var(--primary)"} />
                    <StatusLine label="CRYPT_KEYS" value={status?.hasKeys ? "NOMINAL" : "PENDING"} color={status?.hasKeys ? "var(--accent)" : "var(--warn)"} />
                </div>
                
                {status?.hasKeys && (
                  <button 
                      onClick={handleReset}
                      style={{ 
                        marginTop: '2.5rem', 
                        fontSize: '0.65rem', 
                        color: 'rgba(255,255,255,0.2)', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        padding: '0.6rem',
                        width: '100%',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}
                  >
                      RESET SYSTEM IDENTITY
                  </button>
                )}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                <span className="text-tech" style={{ color: 'var(--primary)', fontWeight: 900 }}>TACTICAL ADVICE</span>
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.75rem', lineHeight: 1.5 }}>
                  Si experimenta latencia o pérdida de paquetes en el radar, reinicie su identidad virtual para forzar una nueva clave de cifrado.
                </p>
            </div>
          </aside>
        </div>
      </div>
>
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
