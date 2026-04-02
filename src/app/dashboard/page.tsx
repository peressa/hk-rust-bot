"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Server, 
  Settings, 
  Power, 
  Activity, 
  Shield, 
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  Clock,
  Users
} from "lucide-react";

export default function DashboardPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [worldTime, setWorldTime] = useState<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fcmStatus, setFcmStatus] = useState("Inactivo");

  // Fetch servers from DB on mount
  useEffect(() => {
    fetchServers();
    startFcmListener();
  }, []);

  // Sync data when server changes
  useEffect(() => {
    if (selectedServer) {
      fetchEntities(selectedServer.id);
      fetchServerData(selectedServer.id);
      const interval = setInterval(() => fetchServerData(selectedServer.id), 10000); // Sync every 10s
      return () => clearInterval(interval);
    }
  }, [selectedServer]);

  const startFcmListener = async () => {
    try {
      await fetch("/api/fcm/start", { method: "POST" });
      setFcmStatus("Escuchando...");
    } catch (err) {
      setFcmStatus("Error");
    }
  };

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      setServers(data);
      if (data.length > 0 && !selectedServer) setSelectedServer(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for servers if empty
  useEffect(() => {
    if (servers.length === 0) {
      const interval = setInterval(fetchServers, 5000);
      return () => clearInterval(interval);
    }
  }, [servers.length]);

  const fetchServerData = async (serverId: string) => {
    try {
      const [infoRes, timeRes] = await Promise.all([
        fetch(`/api/rustplus/info?serverId=${serverId}`),
        fetch(`/api/rustplus/time?serverId=${serverId}`)
      ]);
      setServerInfo(await infoRes.json());
      setWorldTime(await timeRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEntities = async (serverId: string) => {
    try {
      const res = await fetch(`/api/entities?serverId=${serverId}`);
      const data = await res.json();
      setEntities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEntity = async (entityId: string, currentValue: boolean) => {
    if (!selectedServer) return;
    try {
      await fetch("/api/rustplus/command", {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer.id,
          entityId: entityId,
          value: !currentValue
        })
      });
      fetchEntities(selectedServer.id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-spinner" />;

  const formatTime = (time?: number) => {
    if (time === undefined) return "--:--";
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Mando Central</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {selectedServer ? `Conectado a ${selectedServer.name}` : "Bienvenido de nuevo, Comandante."}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>FCM Status</div>
              <div style={{ color: fcmStatus === "Escuchando..." ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{fcmStatus}</div>
            </div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={20} /> Vincular Servidor
            </button>
          </div>
        </header>

        {servers.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '4rem' }}>
            <Server size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>No hay servidores vinculados</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Ve a Configuración para registrar tu dispositivo y ver tus servidores aquí.
            </p>
            <button className="btn-primary">Empezar Ahora</button>
          </div>
        ) : (
          <>
            {/* Quick Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <StatCard icon={<Users size={20} />} label="Jugadores" value={`${serverInfo?.players || 0} / ${serverInfo?.maxPlayers || 0}`} />
              <StatCard icon={<Clock size={20} />} label="Hora Mundo" value={formatTime(worldTime?.time)} />
              <StatCard icon={<Activity size={20} />} label="Uptime" value="Excelente" color="#22c55e" />
              <StatCard icon={<Shield size={20} />} label="Seguridad" value="Protegido" color="#22c55e" />
            </div>

            {/* Server Selector */}
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem' }}>
              {servers.map(server => (
                <div 
                  key={server.id} 
                  onClick={() => setSelectedServer(server)}
                  className={`premium-card ${selectedServer?.id === server.id ? 'active-card' : ''}`}
                  style={{ 
                    minWidth: '220px', 
                    cursor: 'pointer', 
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Server size={20} color={selectedServer?.id === server.id ? "var(--primary)" : "white"} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                  </div>
                  <h3 style={{ marginTop: '1rem', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{server.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{server.ip}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
              {/* Device Control Grid */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} /> Dispositivos Inteligentes
                  </h2>
                  <button onClick={() => fetchEntities(selectedServer.id)} className="btn-secondary" style={{ padding: '0.4rem' }}>
                    <RefreshCw size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {entities.length === 0 ? (
                    <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.5, padding: '3rem' }}>
                      No hay dispositivos emparejados con este servidor aún.
                    </div>
                  ) : (
                    entities.map(device => (
                      <div key={device.entityId} className="premium-card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                            <Power size={18} color={device.value ? "var(--primary)" : "var(--text-muted)"} />
                          </div>
                          <label className="switch">
                            <input 
                              type="checkbox" 
                              checked={device.value} 
                              onChange={() => toggleEntity(device.entityId, device.value)}
                            />
                            <span className="slider round"></span>
                          </label>
                        </div>
                        <h4 style={{ marginTop: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>{device.name}</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>ID: {device.entityId}</div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Status Sidebar */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="premium-card" style={{ background: 'linear-gradient(135deg, rgba(205, 65, 43, 0.1), transparent)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                    <Shield size={18} color="var(--primary)" /> Inventario Base
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <StatusLine label="Interruptores" value={entities.length.toString()} />
                    <StatusLine label="Cámaras" value="Funcional" color="#22c55e" />
                    <StatusLine label="Estado TC" value="12D 4H" color="#22c55e" />
                  </div>
                </div>

                <div className="premium-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                    <AlertTriangle size={18} color="#ef4444" /> Historial Reciente
                  </h3>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderLeft: '2px solid var(--primary)', paddingLeft: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>Servidor Conectado</div>
                      <div style={{ opacity: 0.6 }}>WebSocket establecido con éxito.</div>
                    </div>
                    <div style={{ opacity: 0.5, fontStyle: 'italic' }}>Esperando eventos de intrusión...</div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color = "white" }: { icon: any, label: string, value: string, color?: string }) {
  return (
    <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
      <div style={{ color: 'var(--primary)', opacity: 0.8 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</div>
      </div>
    </div>
  );
}

function StatusLine({ label, value, color = "white" }: { label: string, value: string, color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
