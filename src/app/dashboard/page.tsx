"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Server, RefreshCw, PlusCircle, Settings as SettingsIcon, LayoutGrid, Plus, ExternalLink, MessageSquare } from "lucide-react";
import ServerCard from "@/components/dashboard/ServerCard";
import Link from "next/link";
import dynamic from "next/dynamic";

const BotConfigModule = dynamic(() => import("@/components/war-room/BotConfigModule"), { ssr: false });

export default function DashboardPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"SERVERS" | "BOT" | "DISCORD">("SERVERS");
  const [selectedBotServer, setSelectedBotServer] = useState<string | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (servers.length > 0 && !selectedBotServer) {
        setSelectedBotServer(servers[0].id);
    }
  }, [servers, selectedBotServer]);

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setServers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <RefreshCw className="animate-spin" size={48} color="var(--primary)" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', letterSpacing: '-0.02em', lineHeight: 1, color: '#fff', textTransform: 'uppercase' }}>
              Central de Mando
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 400 }}>
              Seleccione un servidor para iniciar la monitorización táctica en tiempo real.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/dashboard/settings" className="btn-secondary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600, fontFamily: 'var(--font-barlow)' }}>
              <SettingsIcon size={18} /> configuración
            </Link>
            <Link href="/dashboard/settings" className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, fontFamily: 'var(--font-barlow)' }}>
              <PlusCircle size={18} /> vincular nuevo
            </Link>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
           <button onClick={() => setActiveTab("SERVERS")} style={{ background: 'none', border: 'none', color: activeTab === 'SERVERS' ? '#fff' : '#666', borderBottom: activeTab === 'SERVERS' ? '2px solid var(--primary)' : '2px solid transparent', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-barlow)', fontSize: '1.1rem', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutGrid size={18} /> MIS SERVIDORES
           </button>
           <button onClick={() => setActiveTab("BOT")} style={{ background: 'none', border: 'none', color: activeTab === 'BOT' ? '#fff' : '#666', borderBottom: activeTab === 'BOT' ? '2px solid var(--primary)' : '2px solid transparent', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-barlow)', fontSize: '1.1rem', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SettingsIcon size={18} /> CONFIGURACIÓN BOT
           </button>
           <button onClick={() => setActiveTab("DISCORD")} style={{ background: 'none', border: 'none', color: activeTab === 'DISCORD' ? '#fff' : '#666', borderBottom: activeTab === 'DISCORD' ? '2px solid var(--primary)' : '2px solid transparent', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-barlow)', fontSize: '1.1rem', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} /> ALARMAS DISCORD
           </button>
        </div>

        {activeTab === "SERVERS" && (
          servers.length === 0 ? (
            <div className="premium-card" style={{ textAlign: 'center', padding: '6rem 2rem', borderStyle: 'dashed' }}>
               <Server size={64} color="var(--primary)" style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
               <h2 style={{ fontFamily: 'var(--font-barlow)', fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>No se detectan señales</h2>
               <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                  Aún no has vinculado ningún servidor de Rust. Utiliza el terminal de enlace para comenzar la monitorización.
               </p>
               <Link href="/dashboard/settings" className="btn-primary">IR AL TERMINAL DE ENLACE</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
              {servers.map(server => (
                <ServerCard key={server.id} server={server} />
              ))}
              
              {/* Blank Card for Adding New */}
              <Link href="/dashboard/settings" style={{ textDecoration: 'none' }}>
                <div className="premium-card" style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '1rem',
                  borderStyle: 'dashed',
                  opacity: 0.5,
                  transition: 'var(--transition)'
                }} onPointerOver={(e) => (e.currentTarget.style.opacity = '1')} onPointerOut={(e) => (e.currentTarget.style.opacity = '0.5')}>
                  <PlusCircle size={40} />
                  <span style={{ fontFamily: 'var(--font-barlow)', fontSize: '1.25rem', fontWeight: 600 }}>Vincular Servidor</span>
                </div>
              </Link>
            </div>
          )
        )}

        {activeTab === "BOT" && (
          <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
            {servers.length === 0 ? (
               <div style={{ padding: '4rem', textAlign: 'center', color: '#666' }}>No hay servidores vinculados para configurar.</div>
            ) : (
               <div style={{ display: 'flex', height: '70vh' }}>
                 <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', textTransform: 'uppercase' }}>Selecciona Servidor</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {servers.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => setSelectedBotServer(s.id)}
                          style={{ 
                            background: selectedBotServer === s.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: `1px solid ${selectedBotServer === s.id ? 'var(--primary)' : 'transparent'}`,
                            color: selectedBotServer === s.id ? '#fff' : '#888',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            textAlign: 'left',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                 </div>
                 <div style={{ flex: 1, overflowY: 'auto' }}>
                    {selectedBotServer && (
                      <BotConfigModule 
                        serverId={selectedBotServer} 
                        initialPrefix={servers.find(s => s.id === selectedBotServer)?.botPrefix} 
                        initialTemplates={servers.find(s => s.id === selectedBotServer)?.botTemplates ? 
                          (typeof servers.find(s => s.id === selectedBotServer)?.botTemplates === 'string' ? 
                            JSON.parse(servers.find(s => s.id === selectedBotServer)?.botTemplates) : 
                            servers.find(s => s.id === selectedBotServer)?.botTemplates) : undefined}
                      />
                    )}
                 </div>
               </div>
            )}
          </div>
        )}

        {activeTab === "DISCORD" && (
          <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
            {servers.length === 0 ? (
               <div style={{ padding: '4rem', textAlign: 'center', color: '#666' }}>No hay servidores vinculados para configurar Discord.</div>
            ) : (
               <div style={{ display: 'flex', height: '70vh' }}>
                 <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', textTransform: 'uppercase' }}>Selecciona Servidor</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {servers.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => setSelectedBotServer(s.id)}
                          style={{ 
                            background: selectedBotServer === s.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: `1px solid ${selectedBotServer === s.id ? 'var(--primary)' : 'transparent'}`,
                            color: selectedBotServer === s.id ? '#fff' : '#888',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            textAlign: 'left',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                 </div>
                            <div style={{ flex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '600px', width: '100%' }}>
                        <div style={{ background: 'rgba(88, 101, 242, 0.1)', padding: '2rem', borderRadius: '50%', width: 'fit-content', margin: '0 auto 2rem' }}>
                            <MessageSquare size={64} color="#5865F2" />
                        </div>
                        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Sincronización Total</h2>
                        <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '3rem' }}>Controla tu servidor de Rust directamente desde los comandos de Discord.</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left', marginBottom: '3rem' }}>
                           <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>1. INVITA AL BOT</h3>
                              <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>El bot debe estar en tu servidor para poder enviar alertas y responder comandos.</p>
                              <a 
                                href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`}
                                target="_blank"
                                className="btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
                              >
                                 INVITAR AHORA <ExternalLink size={16} />
                              </a>
                           </div>

                           <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#22c55e' }}>2. VINCULA TU CUENTA</h3>
                              <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>Para que el bot sepa qué servidores controlas, debes vincular tu identidad de Discord.</p>
                              <Link 
                                href="/dashboard/settings"
                                className="btn-secondary"
                                style={{ width: '100%', justifyContent: 'center', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', textDecoration: 'none', display: 'flex' }}
                              >
                                 CONFIGURAR VÍNCULO
                              </Link>
                           </div>
                        </div>

                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                           <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>CANAL DE ALERTAS TÁCTICAS</label>
                           <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>ID del canal donde se enviarán las notificaciones de Raids y Muertes para <strong>{servers.find(s => s.id === selectedBotServer)?.name}</strong>.</p>
                           
                           <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input 
                                type="text" 
                                placeholder="ID del Canal (ej. 123456789012345678)"
                                defaultValue={servers.find(s => s.id === selectedBotServer)?.discordChannelId || ""}
                                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.8rem 1rem', color: '#fff' }}
                                onBlur={async (e) => {
                                  const val = e.target.value;
                                  const body = { serverId: selectedBotServer, discordChannelId: val };
                                  await fetch("/api/servers", { method: "POST", body: JSON.stringify(body) });
                                }}
                              />
                           </div>
                        </div>
                    </div>
                 </div>
               </div>
            )}
          </div>
        )}

        <footer style={{ 
            marginTop: '5rem', 
            borderTop: '1px solid rgba(255,255,255,0.03)', 
            paddingTop: '2rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '0.65rem', 
            fontWeight: 800, 
            color: 'rgba(255,255,255,0.2)', 
            fontFamily: 'var(--font-roboto)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
        }}>
           <div style={{ display: 'flex', gap: '2.5rem' }}>
             <span>SISTEMA: RUST OPS v3.0</span>
             <span style={{ color: 'rgba(255,255,255,0.1)' }}>ENLACES ACTIVOS: {servers.length}</span>
           </div>
           <div>ESTADO DE RED: <span style={{ color: '#22c55e' }}>NOMINAL</span></div>
        </footer>
      </div>
    </DashboardLayout>
  );
}
