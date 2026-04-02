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
  RefreshCw
} from "lucide-react";

export default function DashboardPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fcmStatus, setFcmStatus] = useState("Inactivo");

  // Fetch servers from DB on mount
  useEffect(() => {
    fetchServers();
    startFcmListener();
  }, []);

  const startFcmListener = async () => {
    try {
      await fetch("/api/fcm/start", { method: "POST" });
      setFcmStatus("Escuchando...");
    } catch (err) {
      setFcmStatus("Error");
    }
  };

  // Fetch entities when a server is selected
  useEffect(() => {
    if (selectedServer) {
      fetchEntities(selectedServer.id);
    }
  }, [selectedServer]);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      setServers(data);
      if (data.length > 0) setSelectedServer(data[0]);
    } catch (err) {
      console.error("Failed to fetch servers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async (serverId: string) => {
    try {
      const res = await fetch(`/api/entities?serverId=${serverId}`);
      const data = await res.json();
      setEntities(data);
    } catch (err) {
      console.error("Failed to fetch entities:", err);
    }
  };

  const toggleEntity = async (entityId: string, currentValue: boolean) => {
    if (!selectedServer) return;
    
    try {
      const res = await fetch("/api/rustplus/command", {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer.id,
          entityId: entityId,
          value: !currentValue
        })
      });
      
      if (res.ok) {
        // Optimistic UI update or re-fetch
        fetchEntities(selectedServer.id);
      }
    } catch (err) {
      console.error("Failed to toggle entity:", err);
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Mando Central</h1>
            <p style={{ color: 'var(--text-muted)' }}>Bienvenido de nuevo, Comandante.</p>
          </div>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={20} /> Vincular Servidor
          </button>
        </header>

        {servers.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '4rem' }}>
            <Server size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>No hay servidores vinculados</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Usa el botón de "Vincular Servidor" para añadir tu primer servidor de Rust.
            </p>
            <button className="btn-primary">Empezar Ahora</button>
          </div>
        ) : (
          <>
            {/* Server Selector */}
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem' }}>
              {servers.map(server => (
                <div 
                  key={server.id} 
                  onClick={() => setSelectedServer(server)}
                  className={`premium-card ${selectedServer?.id === server.id ? 'active-card' : ''}`}
                  style={{ 
                    minWidth: '200px', 
                    cursor: 'pointer', 
                    border: selectedServer?.id === server.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Server size={20} color={selectedServer?.id === server.id ? "var(--primary)" : "white"} />
                    <Activity size={16} color="#22c55e" />
                  </div>
                  <h3 style={{ marginTop: '1rem', fontSize: '1rem' }}>{server.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{server.ip}:{server.port}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
              {/* Device Control Grid */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} /> Dispositivos Inteligentes
                  </h2>
                  <button onClick={() => fetchEntities(selectedServer.id)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                    <RefreshCw size={18} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  {entities.length === 0 ? (
                    <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.5 }}>
                      Cargando dispositivos... Pulsa "Pair" en el juego para verlos aquí.
                    </div>
                  ) : (
                    entities.map(device => (
                      <div key={device.entityId} className="premium-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '10px', 
                            background: 'rgba(205, 65, 43, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Power size={20} color="var(--primary)" />
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
                        <h4 style={{ marginTop: '1rem', fontWeight: 600 }}>{device.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ID: {device.entityId}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Status Sidebar */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="premium-card" style={{ background: 'linear-gradient(135deg, rgba(205, 65, 43, 0.2), transparent)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1rem' }}>
                    <Shield size={18} color="var(--primary)" /> Estado de Base
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <StatusLine label="Torretas" value="Activas" color="#22c55e" />
                    <StatusLine label="SAM Site" value="Munición Baja" color="#eab308" />
                    <StatusLine label="Muros" value="100% Salud" color="#22c55e" />
                  </div>
                </div>

                <div className="premium-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1rem' }}>
                    <AlertTriangle size={18} color="#ef4444" /> Alertas Recientes
                  </h3>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ opacity: 0.8 }}>Sin eventos hostiles detectados en las últimas 2 horas.</p>
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

function StatusLine({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
