"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Video, Camera, RefreshCw, Monitor, Plus, Trash2, AlertCircle } from "lucide-react";

interface CameraSlot {
  id: string;
  identifier: string;
  name: string;
  frameUrl: string | null;
  loading: boolean;
  error: string | null;
}

export default function CamerasPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [cameras, setCameras] = useState<CameraSlot[]>([]);
  const [newCamId, setNewCamId] = useState("");
  const [newCamName, setNewCamName] = useState("");
  const [adding, setAdding] = useState(false);
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchCameras(selectedServer.id);
    }
  }, [selectedServer?.id]);

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      setServers(data);
      if (data.length > 0 && !selectedServer) setSelectedServer(data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCameras = async (serverId: string) => {
    try {
      const res = await fetch(`/api/cameras?serverId=${serverId}`);
      const data = await res.json();
      const slots = data.map((c: any) => ({
        ...c,
        frameUrl: `/api/rustplus/camera?serverId=${serverId}&identifier=${c.identifier}&t=${Date.now()}`,
        loading: false,
        error: null
      }));
      setCameras(slots);
    } catch (err) {
      console.error(err);
    }
  };

  const addCamera = async () => {
    if (!newCamId.trim() || !selectedServer) return;
    setAdding(true);
    try {
      await fetch("/api/cameras", {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer.id,
          identifier: newCamId.trim().toUpperCase(),
          name: newCamName.trim() || newCamId.trim().toUpperCase()
        })
      });
      fetchCameras(selectedServer.id);
      setNewCamId("");
      setNewCamName("");
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const removeCamera = async (id: string) => {
    try {
      await fetch(`/api/cameras?id=${id}`, { method: "DELETE" });
      setCameras(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const refreshCamera = (slotId: string) => {
    setCameras(prev => prev.map(c => c.id === slotId ? {
      ...c,
      frameUrl: `/api/rustplus/camera?serverId=${selectedServer.id}&identifier=${c.identifier}&t=${Date.now()}`
    } : c));
  };


  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Video color="var(--primary)" className="glow" /> Vigilancia CCTV
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Ingresa el ID de cámara in-game para conectar.</p>
          </div>
          <select
            value={selectedServer?.id}
            onChange={(e) => setSelectedServer(servers.find(s => s.id === e.target.value))}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white' }}
          >
            {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </header>

        {/* Add Camera Form */}
        <div className="premium-card" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              ID de Cámara (in-game)
            </label>
            <input
              type="text"
              value={newCamId}
              onChange={e => setNewCamId(e.target.value.toUpperCase())}
              placeholder="ENTRADA1"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '8px', color: 'white', width: '100%', fontFamily: 'monospace' }}
              onKeyDown={e => e.key === 'Enter' && addCamera()}
            />
          </div>
          <div style={{ flex: '2', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Nombre descriptivo (opcional)
            </label>
            <input
              type="text"
              value={newCamName}
              onChange={e => setNewCamName(e.target.value)}
              placeholder="Entrada Principal"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '8px', color: 'white', width: '100%' }}
              onKeyDown={e => e.key === 'Enter' && addCamera()}
            />
          </div>
          <button
            onClick={addCamera}
            disabled={!newCamId.trim() || !selectedServer || adding}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}
          >
            <Plus size={18} /> Añadir Cámara
          </button>
        </div>

        {/* Camera Grid */}
        {cameras.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '5rem 2rem', opacity: 0.5, border: '1px dashed var(--border)' }}>
            <Monitor size={48} style={{ marginBottom: '1rem' }} />
            <p>No hay cámaras activas. Añade el ID de una cámara in-game para comenzar.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              En Rust, coloca una cámara de ordenador y dale un ID (ej: ENTRADA1) para usarla aquí.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {cameras.map(cam => (
              <div key={cam.id} className="premium-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* Stream View */}
                <div style={{ height: '250px', background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cam.frameUrl && !cam.error ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={cam.frameUrl} 
                      alt={cam.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={() => {
                        setCameras(prev => prev.map(c => c.id === cam.id ? { ...c, error: "Sin señal / Error de conexión" } : c));
                      }}
                    />
                  ) : cam.error ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                      <AlertCircle size={32} color="#ef4444" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.8rem' }}>{cam.error}</p>
                      <button 
                        onClick={() => {
                          setCameras(prev => prev.map(c => c.id === cam.id ? { ...c, error: null } : c));
                          refreshCamera(cam.id);
                        }}
                        style={{ marginTop: '1rem', background: 'var(--primary)', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.8rem' }}>Conectando a {cam.identifier}...</p>
                    </div>
                  )}

                  {/* REC Badge */}
                  <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.7)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cam.frameUrl && !cam.error ? '#ef4444' : '#9ca3af', animation: cam.frameUrl && !cam.error ? 'blink 2s infinite' : 'none' }}></div>
                    LIVE · {cam.identifier}
                  </div>

                  {/* Overlay Controls */}
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => refreshCamera(cam.id)}
                      title="Refrescar Imagen"
                      style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.3rem', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      onClick={() => removeCamera(cam.id)}
                      title="Eliminar Cámara"
                      style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#ef4444', padding: '0.3rem', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Camera Info */}
                <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{cam.name}</h3>
                    <code style={{ fontSize: '0.65rem', color: 'var(--primary)', background: 'rgba(205,65,43,0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                      ID: {cam.identifier}
                    </code>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: cam.error ? '#ef4444' : '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Camera size={12} />
                    {cam.error ? 'Desconectado' : 'Sincronizado'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </DashboardLayout>
  );
}
