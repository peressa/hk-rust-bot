"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RustMap from "@/components/map/RustMap";
import { Map as MapIcon, RefreshCw, Layers, Users, MapPin } from "lucide-react";

export default function MapPage() {
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchMapData(selectedServer.id);
    }
  }, [selectedServer]);

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

  const fetchMapData = async (serverId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rustplus/map?serverId=${serverId}`);
      const data = await res.json();
      setMapData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapIcon color="var(--primary)" /> Mapa Táctico en Tiempo Real
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Visualiza monumentos, equipo y eventos activos.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
              value={selectedServer?.id} 
              onChange={(e) => setSelectedServer(servers.find(s => s.id === e.target.value))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px' }}
            >
              {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => selectedServer && fetchMapData(selectedServer.id)} className="btn-secondary" style={{ padding: '0.5rem' }}>
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          <div className="premium-card" style={{ padding: '0', height: '700px', border: '1px solid var(--border)' }}>
            {mapData ? (
              <RustMap 
                mapJpg={mapData.map?.jpgImage} 
                mapSize={mapData.map?.width} 
                markers={mapData.markers} 
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.5 }}>
                <MapIcon size={48} />
                <p>{loading ? "Cargando datos del servidor..." : "Selecciona un servidor para ver el mapa"}</p>
              </div>
            )}
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="premium-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="var(--primary)" /> Capas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <LayerToggle label="Monumentos" active />
                <LayerToggle label="Jugadores" active />
                <LayerToggle label="Eventos (Helicóptero/Barco)" active />
                <LayerToggle label="Bases del Equipo" active />
              </div>
            </div>

            <div className="premium-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> Equipo Online
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mapData?.markers?.filter((m: any) => m.type === "Player").map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem' }}>{p.name || "Jugador"}</span>
                    <MapPin size={14} color="#22c55e" />
                  </div>
                )) || <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>No hay compañeros detectados.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function LayerToggle({ label, active }: { label: string, active: boolean }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: '0.9rem', color: active ? 'white' : 'var(--text-muted)' }}>{label}</span>
      <input type="checkbox" checked={active} readOnly style={{ accentColor: 'var(--primary)' }} />
    </label>
  );
}
