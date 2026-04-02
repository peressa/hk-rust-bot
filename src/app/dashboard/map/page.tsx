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
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchMapBase(selectedServer.id);
      fetchLiveMarkers(selectedServer.id);
      const interval = setInterval(() => fetchLiveMarkers(selectedServer.id), 10000); // Live sync every 10s
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
    try {
      const res = await fetch(`/api/rustplus/map?serverId=${serverId}`);
      const data = await res.json();
      setMapInfo(data.response?.map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMarkers = async (serverId: string) => {
    try {
      const res = await fetch(`/api/rustplus/markers?serverId=${serverId}`);
      const data = await res.json();
      setMarkers(data.markers || []);
      setTeam(data.team || []);
    } catch (err) {
      console.error(err);
    }
  };

  const allMarkers = [
    ...markers,
    ...team.map(m => ({
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
            <p style={{ color: 'var(--text-muted)' }}>Sincronización de monumentos y equipo activa.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
              value={selectedServer?.id} 
              onChange={(e) => setSelectedServer(servers.find(s => s.id === e.target.value))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white' }}
            >
              {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => selectedServer && fetchMapBase(selectedServer.id)} className="btn-secondary" style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)' }}>
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          <div className="premium-card" style={{ padding: '0', height: '700px', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
            {mapInfo ? (
              <RustMap 
                mapJpg={mapInfo.jpgImage} 
                mapSize={mapInfo.width} 
                markers={allMarkers} 
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.5 }}>
                <MapIcon size={48} className="animate-pulse" />
                <p>{loading ? "Estableciendo conexión satelital..." : "Selecciona un servidor para ver el mapa"}</p>
              </div>
            )}
            {loading && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000, background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={12} className="animate-spin" /> Actualizando...
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

            <div className="premium-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> Compañeros en Zona
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {team.length > 0 ? team.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.isOnline ? '#22c55e' : '#ef4444' }}></div>
                      <span style={{ fontSize: '0.85rem' }}>{p.name}</span>
                    </div>
                    <MapPin size={14} color="#22c55e" />
                  </div>
                )) : <p style={{ opacity: 0.5, fontSize: '0.85rem', fontStyle: 'italic' }}>Esperando señales del equipo...</p>}
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
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: color }}></div>
        <span style={{ fontSize: '0.85rem', color: active ? 'white' : 'var(--text-muted)' }}>{label}</span>
      </div>
      <input type="checkbox" checked={active} readOnly style={{ accentColor: 'var(--primary)' }} />
    </label>
  );
}
