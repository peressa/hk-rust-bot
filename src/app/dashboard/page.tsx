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
  MessageSquare,
  Save,
  BarChart2,
  Search,
  Trophy,
  Zap,
  ChevronRight
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
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [bmId, setBmId] = useState("");
  const [savingBmId, setSavingBmId] = useState(false);
  const [bmData, setBmData] = useState<any>(null);

  useEffect(() => {
    fetchServers();
    startFcmListener();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      setServerInfo(null);
      setStorageMonitor(null);
      setBmData(null);
      setWebhookUrl(selectedServer.discordWebhook || "");
      setBmId(selectedServer.bmId || "");
      fetchEntities(selectedServer.id);
      fetchServerData(selectedServer.id);
      if (selectedServer.bmId) fetchBattleMetricsData(selectedServer.bmId);
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
      
      const monitor = data.find(e => e.entityType === 3 || e.name?.toLowerCase().includes("monitor") || e.name?.toLowerCase().includes("armario"));
      if (monitor) {
        setStorageMonitor(monitor);
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

  const saveWebhook = async () => {
    if (!selectedServer) return;
    setSavingWebhook(true);
    try {
      await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: selectedServer.id, discordWebhook: webhookUrl })
      });
      fetchServers();
    } catch (err) { console.error(err); } finally { setSavingWebhook(false); }
  };

  const fetchBattleMetricsData = async (id: string) => {
    try {
      const res = await fetch(`/api/intel/battlemetrics?bmId=${id}`);
      const data = await res.json();
      if (!data.error) setBmData(data);
    } catch (err) { console.warn("BM Fetch Error", err); }
  };

  const saveBmId = async () => {
    if (!selectedServer) return;
    setSavingBmId(true);
    try {
      await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: selectedServer.id, bmId: bmId })
      });
      fetchServers();
      fetchBattleMetricsData(bmId);
    } catch (err) { console.error(err); } finally { setSavingBmId(false); }
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
    return days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`;
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
              <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>Buscando señales...</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                No detectamos servidores enlazados. Abre Rust en tu equipo y pulsa 'Pair with Server' para comenzar.
              </p>
              <a href="/dashboard/settings" className="btn-secondary">Configurar Identidad</a>
            </div>
          </div>
        ) : (
          <>
            <ServerHero server={selectedServer} info={serverInfo} />

            {/* Selector de Servidores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              {servers.map(server => (
                <div key={server.id} onClick={() => setSelectedServer(server)} className={`premium-card ${selectedServer?.id === server.id ? 'active-card' : ''}`} style={{ cursor: 'pointer', padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: selectedServer?.id === server.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '10px' }}>
                      <Server size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{server.name}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{server.ip}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
              <section>
                {/* Salute de la Base */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div className="premium-card" style={{ padding: '1rem', background: 'rgba(205,65,43,0.05)', border: '1px solid rgba(205,65,43,0.1)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Salud Energética</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={18} color="var(--primary)" /> 
                      {entities.filter(e => e.hasCapacity).length > 0 
                        ? `${Math.round(entities.filter(e => e.hasCapacity).reduce((acc, curr) => acc + (curr.capacity || 0), 0) / entities.filter(e => e.hasCapacity).length)}%`
                        : "---"}
                    </div>
                  </div>
                  <div className="premium-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sensores Activos</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Shield size={18} color="#22c55e" /> 
                      {entities.filter(e => e.entityType === 1).length} 
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} className="glow" /> Dispositivos en Red
                  </h2>
                  <button onClick={() => fetchEntities(selectedServer.id)} className="btn-secondary" style={{ padding: '0.4rem' }}>
                    <RefreshCw size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <DeviceGroup 
                      title="⚡ Energía" 
                      devices={entities.filter(e => e.hasCapacity || e.name?.toLowerCase().includes("bat"))} 
                      onToggle={toggleEntity}
                    />
                    <DeviceGroup 
                      title="🛡️ Seguridad" 
                      devices={entities.filter(e => e.entityType === 1 || e.name?.toLowerCase().includes("alarm") || e.name?.toLowerCase().includes("sensor"))} 
                      onToggle={toggleEntity}
                    />
                    <DeviceGroup 
                      title="💡 Automatización" 
                      devices={entities.filter(e => 
                        !e.hasCapacity && 
                        e.entityType !== 1 && 
                        !e.name?.toLowerCase().includes("bat") && 
                        !e.name?.toLowerCase().includes("alarm") &&
                        !e.name?.toLowerCase().includes("sensor")
                      )} 
                      onToggle={toggleEntity}
                    />
                </div>
              </section>

              <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Seguridad Sidebar */}
                <div className="premium-card" style={{ background: 'linear-gradient(165deg, rgba(205, 65, 43, 0.08), transparent)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                    <Shield size={18} /> Seguridad de la Base
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <StatusLine label="Dispositivos" value={entities.length.toString()} />
                    <StatusLine 
                      label="Mantenimiento" 
                      value={storageMonitor ? formatUpkeep(storageMonitor.protectionExpireTime) : "Sin Monitor TC"} 
                      color={storageMonitor ? (storageMonitor.protectionExpireTime - Math.floor(Date.now()/1000) > 86400 ? "#22c55e" : "#ef4444") : "#9ca3af"}
                    />
                    <StatusLine 
                      label="Población" 
                      value={serverInfo ? `${serverInfo.players || 0} / ${serverInfo.maxPlayers || 0}` : "---"} 
                      color={serverInfo?.players > 0 ? "#22c55e" : "#9ca3af"}
                    />
                  </div>
                </div>

                {/* Integración Discord */}
                <div className="premium-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1rem' }}>
                    <MessageSquare size={18} color="#5865F2" /> Integración Discord
                  </h3>
                  <input type="text" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="Webhook URL..." style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem' }} />
                  <button onClick={saveWebhook} disabled={savingWebhook} className="btn-primary" style={{ width: '100%', fontSize: '0.75rem' }}>Guardar Webhook</button>
                </div>

                {/* BattleMetrics */}
                <div className="premium-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1rem' }}>
                    <BarChart2 size={18} color="#3b82f6" /> BattleMetrics
                  </h3>
                  <input type="text" value={bmId} onChange={(e) => setBmId(e.target.value)} placeholder="ID de Servidor..." style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem' }} />
                  <button onClick={saveBmId} disabled={savingBmId} className="btn-secondary" style={{ width: '100%', fontSize: '0.75rem' }}>Vincular BM</button>
                  {bmData && <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '0.5rem' }}>Rango: #{bmData.data?.attributes?.rank}</div>}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function DeviceGroup({ title, devices, onToggle }: { title: string, devices: any[], onToggle: any }) {
  if (devices.length === 0) return null;
  return (
    <div>
      <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {title} <ChevronRight size={14} />
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {devices.map(device => (
          <div key={device.entityId} className="premium-card" style={{ padding: '1.25rem', borderLeft: device.value ? '4px solid var(--primary)' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ background: device.value ? 'rgba(205, 65, 43, 0.1)' : 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                <Power size={18} color={device.value ? "var(--primary)" : "var(--text-muted)"} />
              </div>
              <label className="switch">
                <input type="checkbox" checked={device.value} onChange={() => onToggle(device.entityId, device.value)} />
                <span className="slider round"></span>
              </label>
            </div>
            <h4 style={{ marginTop: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>{device.name}</h4>
            {device.hasCapacity && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${device.capacity || 0}%`, height: '100%', background: 'var(--primary)' }}></div>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Carga: {Math.round(device.capacity || 0)}%</div>
              </div>
            )}
          </div>
        ))}
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
