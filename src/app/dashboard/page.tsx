"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Server, 
  Settings, 
  Power, 
  Activity, 
  Shield, 
  PlusCircle,
  RefreshCw,
} from "lucide-react";

import ServerHero from "@/components/dashboard/ServerHero";
import ManualPairingInput from "@/components/dashboard/ManualPairingInput";

export default function DashboardPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [worldTime, setWorldTime] = useState<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [storageMonitor, setStorageMonitor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fcmStatus, setFcmStatus] = useState("Inactivo");
  const [hasKeys, setHasKeys] = useState(false);

  // Fetch servers from DB on mount
  useEffect(() => {
    fetchServers();
    startFcmListener();
  }, []);

  // Sync data when server changes
  useEffect(() => {
    if (selectedServer) {
      setServerInfo(null);
      setStorageMonitor(null);
      fetchEntities(selectedServer.id);
      fetchServerData(selectedServer.id);
      const interval = setInterval(() => fetchServerData(selectedServer.id), 10000); 
      return () => clearInterval(interval);
    }
  }, [selectedServer?.id]);

  const startFcmListener = async () => {
    try {
      await fetch("/api/fcm/start", { method: "POST" });
      const res = await fetch("/api/fcm/status");
      const data = await res.json();
      setFcmStatus(data.listening ? "Escuchando..." : "Inactivo");
      setHasKeys(data.hasKeys);
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

  const fetchServerData = async (serverId: string) => {
    try {
      const [infoRes, timeRes] = await Promise.all([
        fetch(`/api/rustplus/info?serverId=${serverId}`),
        fetch(`/api/rustplus/time?serverId=${serverId}`)
      ]);
      setServerInfo(await infoRes.json());
      setWorldTime(await timeRes.json());

      // If we have a storage monitor ID, poll its info too
      if (storageMonitor?.entityId) {
        fetchStorageMonitorInfo(serverId, storageMonitor.entityId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStorageMonitorInfo = async (serverId: string, entityId: string) => {
    try {
      const res = await fetch(`/api/rustplus/entity?serverId=${serverId}&entityId=${entityId}`);
      const data = await res.json();
      if (data.response?.entityInfo?.payload) {
        setStorageMonitor((prev: any) => ({ ...prev, ...data.response.entityInfo.payload }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEntities = async (serverId: string) => {
    try {
      const res = await fetch(`/api/entities?serverId=${serverId}`);
      const data: any[] = await res.json();
      setEntities(data);
      
      // Look for Storage Monitor (Type 3)
      const monitor = data.find(e => e.entityType === 3 || e.name?.toLowerCase().includes("monitor") || e.name?.toLowerCase().includes("armario"));
      if (monitor) {
        setStorageMonitor(monitor);
        // Initial fetch handled inside fetchServerData but let's be sure
        fetchStorageMonitorInfo(serverId, monitor.entityId);
      }
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

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '80vh' }}><RefreshCw className="animate-spin" size={40} color="var(--primary)" /></div>;

  const formatTime = (time?: number) => {
    if (time === undefined) return "--:--";
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatUpkeep = (expireTime?: number) => {
    if (!expireTime) return "---";
    const seconds = expireTime - Math.floor(Date.now() / 1000);
    if (seconds <= 0) return "¡SIN MANTENIMIENTO!";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Mando Central</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {selectedServer ? `Sincronización táctica activa.` : "Bienvenido de nuevo, Comandante."}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>Status del Bot</div>
              <div style={{ color: fcmStatus === "Escuchando..." ? "#22c55e" : "#ef4444", fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: fcmStatus === "Escuchando..." ? "#22c55e" : "#ef4444" }}></div>
                {fcmStatus}
              </div>
            </div>
            <a href="/dashboard/settings" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={20} /> Vincular Nuevo
            </a>
          </div>
        </header>

        {servers.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
            <div className="premium-card" style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed var(--border)', maxWidth: '800px', width: '100%' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}>
                <Server size={64} color="var(--primary)" style={{ opacity: 0.2 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                  <Activity size={32} color="var(--primary)" className="animate-pulse" />
                </div>
              </div>
              <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>
                {hasKeys ? "Listo para enlazar" : "Buscando señales..."}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                {hasKeys 
                  ? "Identidad detectada. Pulsa 'Pair with Server' en el juego para sincronizar tu mando táctico."
                  : "No detectamos servidores enlazados. Abre Rust en tu equipo y pulsa 'Pair with Server' para comenzar."}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {!hasKeys && <a href="/dashboard/settings" className="btn-secondary">Configurar Identidad</a>}
              </div>
            </div>

            {/* Manual Pairing Fallback */}
            <div className="premium-card" style={{ maxWidth: '800px', width: '100%', padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={18} color="var(--primary)" /> ¿FCM no responde? Emparejamiento Manual
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Si las notificaciones tardan demasiado, puedes pegar el enlace de emparejamiento (<code>rustplus://...</code>) directamente aquí.
              </p>
              <ManualPairingInput onPaired={fetchServers} />
            </div>
          </div>
        ) : (
          <>
            {/* Server Hero Section */}
            <ServerHero server={selectedServer} info={serverInfo} />

            {/* Server Selector Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              {servers.map(server => (
                <div 
                  key={server.id} 
                  onClick={() => setSelectedServer(server)}
                  className={`premium-card ${selectedServer?.id === server.id ? 'active-card' : ''}`}
                  style={{ cursor: 'pointer', padding: '1rem' }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: selectedServer?.id === server.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '10px', transition: 'var(--transition)' }}>
                      <Server size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{server.name}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{server.ip}</div>
                    </div>
                    {selectedServer?.id === server.id && <div className="status-online"></div>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
              {/* Device Control Grid */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} className="glow" /> Dispositivos Inteligentes
                  </h2>
                  <button onClick={() => fetchEntities(selectedServer.id)} className="btn-secondary" style={{ padding: '0.4rem', background: 'transparent', border: '1px solid var(--border)' }}>
                    <RefreshCw size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {entities.length === 0 ? (
                    <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.5, padding: '3.5rem', border: '1px dashed var(--border)' }}>
                      No hay dispositivos inteligentes emparejados.
                    </div>
                  ) : (
                    entities.map(device => (
                      <div key={device.entityId} className="premium-card" style={{ padding: '1.25rem', borderLeft: device.value ? '3px solid var(--primary)' : '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ background: device.value ? 'rgba(205, 65, 43, 0.1)' : 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', transition: 'var(--transition)' }}>
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
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', opacity: 0.6 }}>UUID: {device.entityId}</div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Status Sidebar */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="premium-card" style={{ background: 'linear-gradient(165deg, rgba(205, 65, 43, 0.08), transparent)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                    <Shield size={18} /> Seguridad de la Base
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <StatusLine label="Interruptores" value={entities.length.toString()} />
                    <StatusLine 
                      label="Torretas" 
                      value={entities.some(e => e.name?.toLowerCase().includes('turret') || e.name?.toLowerCase().includes('torreta')) 
                        ? `${entities.filter(e => e.name?.toLowerCase().includes('turret') || e.name?.toLowerCase().includes('torreta')).length} Activa(s)` 
                        : "Sin emparejar"} 
                      color={entities.some(e => e.name?.toLowerCase().includes('turret') || e.name?.toLowerCase().includes('torreta')) ? "#22c55e" : "#9ca3af"}
                    />
                    <StatusLine 
                      label="Mantenimiento" 
                      value={storageMonitor ? formatUpkeep(storageMonitor.protectionExpireTime) : "Sin Monitor TC"} 
                      color={storageMonitor ? (storageMonitor.protectionExpireTime - Math.floor(Date.now()/1000) > 86400 ? "#22c55e" : "#ef4444") : "#9ca3af"}
                    />
                    {storageMonitor && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          <span>Capacidad TC</span>
                          <span>{Math.round(((storageMonitor.items?.length || 0) / (storageMonitor.capacity || 24)) * 100)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${((storageMonitor.items?.length || 0) / (storageMonitor.capacity || 24)) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                        </div>
                      </div>
                    )}
                    <StatusLine 
                      label="Jugadores" 
                      value={serverInfo ? `${serverInfo.players || 0} / ${serverInfo.maxPlayers || 0}` : "---"} 
                      color={serverInfo?.players > 0 ? "#22c55e" : "#9ca3af"}
                    />
                  </div>
                </div>

                {/* Info real del servidor */}
                <div className="premium-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                    <Activity size={18} color="var(--primary)" /> Info del Servidor
                  </h3>
                  {serverInfo ? (
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <StatusLine label="Nombre" value={serverInfo.name || selectedServer?.name || '---'} />
                      <StatusLine label="Mapa" value={serverInfo.map || serverInfo.levelUrl || '---'} />
                      <StatusLine label="Seed" value={serverInfo.seed !== undefined ? String(serverInfo.seed) : '---'} />
                      <StatusLine label="Tamaño" value={serverInfo.mapSize !== undefined ? `${serverInfo.mapSize}` : '---'} />
                      <StatusLine 
                        label="Hora in-game" 
                        value={worldTime?.time !== undefined ? formatTime(worldTime.time) : '---'} 
                        color="#22c55e" 
                      />
                      <StatusLine 
                        label="Conectado" 
                        value="Sí" 
                        color="#22c55e" 
                      />
                    </div>
                  ) : (
                    <div style={{ opacity: 0.4, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={14} className="animate-spin" /> Conectando al servidor...
                    </div>
                  )}
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
