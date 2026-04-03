"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RustMap from "@/components/map/RustMap";
import { 
  Map as MapIcon, 
  RefreshCw, 
  Layers, 
  Users, 
  MapPin 
} from "lucide-react";

export default function MapPage() {
  const [mapInfo, setMapInfo] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      setMapInfo(null);
      setMapError(null);
      fetchMapBase(selectedServer.id);
      fetchLiveMarkers(selectedServer.id);
      const interval = setInterval(() => fetchLiveMarkers(selectedServer.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedServer?.id]);

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      setServers(data);
      if (data.length > 0) setSelectedServer(data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMapBase = async (serverId: string) => {
    setLoading(true);
    setMapError(null);
    try {
      console.log(`[MapPage] Solicitando imagen base para ${serverId}...`);
      const res = await fetch(`/api/rustplus/map?serverId=${serverId}`);
      const data = await res.json();
      
      if (data.error) {
        setMapError(data.error);
        console.warn("[MapPage] Error en API de mapa:", data.error);
      } else {
        setMapInfo(data);
        setMapError(null);
      }
    } catch (err: any) {
      setMapError(err.message || "Error de conexión con el servidor interno");
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMarkers = async (serverId: string) => {
    try {
      const res = await fetch(`/api/rustplus/markers?serverId=${serverId}`);
      const data = await res.json();
      if (!data.error) {
        setMarkers(data.markers || []);
        setTeam(data.team || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const allMarkers = [
    ...(markers || []),
    ...(team || []).map(m => ({
      x: m.x,
      y: m.y,
      type: "Player",
      name: m.name,
      steamId: m.steamId
    }))
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapIcon color="var(--primary)" className="glow" /> Mapa Táctico 
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Sincronización de monumentos y equipo en tiempo real.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
              value={selectedServer?.id} 
              onChange={(e) => setSelectedServer(servers.find(s => s.id === e.target.value))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white' }}
            >
              <option value="" disabled>Seleccionar Servidor</option>
              {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button 
               onClick={() => selectedServer && fetchMapBase(selectedServer.id)} 
               className="btn-secondary" 
               style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
               disabled={loading}
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          <div className="premium-card" style={{ padding: '0', height: '750px', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', background: '#0a0a0b' }}>
            {mapInfo?.jpgImage ? (
              <RustMap 
                mapJpg={mapInfo.jpgImage} 
                mapSize={mapInfo.width || 4000} 
                markers={allMarkers} 
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', textAlign: 'center', padding: '2rem' }}>
                <div style={{ position: 'relative' }}>
                   <MapIcon size={64} style={{ opacity: loading ? 1 : 0.2 }} className={loading ? "animate-pulse" : ""} />
                   {loading && <div style={{ position: 'absolute', inset: -10, border: '2px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>}
                </div>
                
                <div style={{ maxWidth: '400px' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    {loading 
                      ? "Estableciendo conexión satelital..." 
                      : mapError 
                        ? "Fallo en la recepción del mapa" 
                        : selectedServer 
                          ? "Sincronizando con el servidor de Rust..." 
                          : "Selecciona un servidor para iniciar el escaneo"}
                  </p>
                  
                  {mapError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                       <p style={{ color: '#f87171', fontSize: '0.85rem', lineHeight: 1.5 }}>{mapError}</p>
                    </div>
                  )}

                  {(mapError || (!loading && !selectedServer)) && selectedServer && (
                    <button 
                      onClick={() => fetchMapBase(selectedServer.id)}
                      className="btn-primary"
                      style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
                    >
                      Reintentar Conexión
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {loading && mapInfo?.jpgImage && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)' }}>
                <RefreshCw size={14} className="animate-spin" color="var(--primary)" /> 
                <span>Actualizando datos en vivo...</span>
              </div>
            )}
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="premium-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="var(--primary)" /> Capas de Inteligencia
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <LayerToggle label="Monumentos" active color="#eab308" />
                <LayerToggle label="Tu Equipo" active color="#22c55e" />
                <LayerToggle label="Helicóptero / Barco" active color="var(--primary)" />
                <LayerToggle label="Vending Machines" active color="#3b82f6" />
              </div>
            </div>

            <div className="premium-card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> Compañeros en Zona
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                {team.length > 0 ? team.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className={p.isOnline ? "status-online" : ""} style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.isOnline ? '#22c55e' : '#4b5563' }}></div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.name}</span>
                    </div>
                    <MapPin size={14} color={p.isOnline ? "#22c55e" : "#9ca3af"} />
                  </div>
                )) : <p style={{ opacity: 0.5, fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>No hay señales de equipo activas.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
}

function LayerToggle({ label, active, color }: { label: string, active: boolean, color: string }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: color }}></div>
        <span style={{ fontSize: '0.85rem', color: active ? 'white' : 'var(--text-muted)' }}>{label}</span>
      </div>
      <input type="checkbox" checked={active} readOnly style={{ accentColor: 'var(--primary)' }} />
    </label>
  );
}
