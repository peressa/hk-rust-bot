"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Importación dinámica obligatoria para react-leaflet en SSR
const RustMap = dynamic(() => import("@/components/map/RustMap"), { ssr: false, loading: () => <div className="p-8 text-center" style={{color: 'var(--text-muted)'}}>Cargando motor de mapa...</div> });

import { 
  Map as MapIcon, 
  RefreshCw, 
  Layers, 
  Users, 
  MapPin 
} from "lucide-react";

class MapErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Map Crash:", error, errorInfo); }
  render() { 
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#300', color: 'white', height: '100%' }}>
          <h3>⚠️ Error interno detectado en el Mapa</h3>
          <pre style={{ color: '#ffaaaa', textWrap: 'wrap' }}>{String(this.state.error?.message || this.state.error)}</pre>
          <button onClick={() => this.setState({hasError: false})} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'white', color: 'black' }}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function MapPage() {
  const [mapInfo, setMapInfo] = useState<any>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [deaths, setDeaths] = useState<any[]>([]);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      setMapInfo(null);
      setMapError(null);
      fetchMapBase(selectedServer.id);
      fetchServerInfo(selectedServer.id);
      fetchLiveMarkers(selectedServer.id);
      const interval = setInterval(() => fetchLiveMarkers(selectedServer.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedServer?.id]);

  const fetchServerInfo = async (serverId: string) => {
    try {
      const res = await fetch(`/api/rustplus/info?serverId=${serverId}`);
      if (res.ok) setServerInfo(await res.json());
    } catch(err) { console.warn("err", err); }
  };

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      if (res.ok) {
        const data = await res.json();
        setServers(data);
        if (data.length > 0) setSelectedServer(data[0]);
      }
    } catch (err) { console.error(err); }
  };

  const fetchMapBase = async (serverId: string, refresh = false) => {
    setLoading(true);
    if (!refresh) setMapError(null);
    try {
      const res = await fetch(`/api/rustplus/map?serverId=${serverId}${refresh ? '&refresh=true' : ''}`);
      if (!res.ok) throw new Error("Error cargando mapa base");
      const data = await res.json();
      if (data.error) setMapError(data.error);
      else setMapInfo(data);
    } catch (err: any) {
      setMapError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMarkers = async (serverId: string) => {
    try {
      const res = await fetch(`/api/rustplus/markers?serverId=${serverId}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          setMarkers(data.markers || []);
          setTeam(data.team || []);
          setDeaths(data.deaths || []);
        }
      }
    } catch (err) { console.error(err); }
  };

  const allMarkers = [
    ...(markers || []),
    ...(deaths || []).map(d => ({ x: d.x, y: d.y, type: "Death", name: `💀 Muerte: ${d.name}` })),
    ...(team || []).map(m => ({ x: m.x, y: m.y, type: "Player", name: m.name, steamId: m.steamId }))
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
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.75rem', display: 'flex', gap: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }}></div>
                 SEÑAL GPS
               </div>
               <div style={{ color: 'var(--text-muted)' }}>{markers.length} OBJETIVOS</div>
            </div>

            <select 
              value={selectedServer?.id} 
              onChange={(e) => setSelectedServer(servers.find(s => s.id === e.target.value))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white' }}
            >
              <option value="" disabled>Nodo</option>
              {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            
            <button onClick={() => selectedServer && fetchMapBase(selectedServer.id, true)} className="btn-secondary" style={{ padding: '0.5rem' }} disabled={loading}>
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          <div className="premium-card" style={{ padding: '0', height: '780px', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', background: '#0a0a0b' }}>
            {(mapInfo?.jpgImage || (mapError && selectedServer)) ? (
              <MapErrorBoundary>
                <RustMap 
                  mapJpg={mapInfo?.jpgImage} 
                  mapSize={serverInfo?.mapSize || mapInfo?.width || 4000} 
                  oceanMargin={mapInfo?.oceanMargin || 0}
                  monuments={mapInfo?.monuments || []}
                  markers={allMarkers} 
                />
              </MapErrorBoundary>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', textAlign: 'center', padding: '2rem' }}>
                <MapIcon size={64} style={{ opacity: 0.2 }} className={loading ? "animate-pulse" : ""} />
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                  {loading ? "Sincronizando topografía..." : "Selecciona un servidor para iniciar el escaneo."}
                </p>
              </div>
            )}
            
            {loading && mapInfo?.jpgImage && (
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 1000, background: 'rgba(0,0,0,0.8)', border: '1px solid var(--primary)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <RefreshCw size={14} className="animate-spin" color="var(--primary)" /> 
                <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>CALIBRANDO...</span>
              </div>
            )}
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="premium-card" style={{ borderTop: '3px solid var(--primary)' }}>
              <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
                Filtros Tácticos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <LayerToggle label="Monumentos" active color="#eab308" />
                <LayerToggle label="Equipo" active color="#22c55e" />
                <LayerToggle label="Vending" active color="#3b82f6" />
                <LayerToggle label="Muertes" active color="#ef4444" />
              </div>
            </div>

            <div className="premium-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: '3px solid #5865F2' }}>
              <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
                Personal Activo
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                {team.length > 0 ? team.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: p.isOnline ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.isOnline ? '#22c55e' : '#4b5563', boxShadow: p.isOnline ? '0 0 8px #22c55e' : 'none' }}></div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</span>
                    </div>
                  </div>
                )) : <div style={{ opacity: 0.3, textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem' }}>Sin rastro</div>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function LayerToggle({ label, active, color }: { label: string, active: boolean, color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: color }}></div>
        <span style={{ fontSize: '0.85rem', color: active ? 'white' : 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: active ? color : 'transparent', border: `1px solid ${color}` }}></div>
    </div>
  );
}
