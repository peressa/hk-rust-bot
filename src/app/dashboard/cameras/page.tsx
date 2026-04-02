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
    return () => {
      // Cleanup all polling intervals on unmount
      intervalRefs.current.forEach(clearInterval);
    };
  }, []);

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

  const addCamera = async () => {
    if (!newCamId.trim() || !selectedServer) return;
    setAdding(true);
    const slot: CameraSlot = {
      id: `${Date.now()}`,
      identifier: newCamId.trim().toUpperCase(),
      name: newCamName.trim() || newCamId.trim().toUpperCase(),
      frameUrl: null,
      loading: true,
      error: null
    };
    setCameras(prev => [...prev, slot]);
    setNewCamId("");
    setNewCamName("");
    setAdding(false);
    startPolling(slot);
  };

  const removeCamera = (id: string) => {
    const t = intervalRefs.current.get(id);
    if (t) { clearInterval(t); intervalRefs.current.delete(id); }
    setCameras(prev => prev.filter(c => c.id !== id));
  };

  const startPolling = (slot: CameraSlot) => {
    fetchFrame(slot.id, slot.identifier);
    const t = setInterval(() => fetchFrame(slot.id, slot.identifier), 3000);
    intervalRefs.current.set(slot.id, t);
  };

  const fetchFrame = async (slotId: string, identifier: string) => {
    if (!selectedServer) return;
    try {
      const res = await fetch(`/api/rustplus/camera?serverId=${selectedServer.id}&identifier=${identifier}`);
      const data = await res.json();
      setCameras(prev => prev.map(c => c.id === slotId ? {
        ...c,
        loading: false,
        error: data.error || null,
        frameUrl: data.frameBase64 ? `data:image/jpeg;base64,${data.frameBase64}` : c.frameUrl
      } : c));
    } catch (err: any) {
      setCameras(prev => prev.map(c => c.id === slotId ? { ...c, loading: false, error: err.message } : c));
    }
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
                  {cam.frameUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cam.frameUrl} alt={cam.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : cam.error ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                      <AlertCircle size={32} color="#ef4444" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.8rem' }}>
                        {cam.error.includes('Camera') || cam.error.includes('camera') || cam.error.includes('identifier')
                          ? `ID "${cam.identifier}" no encontrado en este servidor`
                          : cam.error}
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.8rem' }}>Conectando a {cam.identifier}...</p>
                    </div>
                  )}

                  {/* REC Badge */}
                  <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.7)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cam.frameUrl ? '#ef4444' : '#9ca3af', animation: cam.frameUrl ? 'blink 2s infinite' : 'none' }}></div>
                    REC · {cam.identifier}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeCamera(cam.id)}
                    style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.3rem', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Camera Info */}
                <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{cam.name}</h3>
                    <code style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'rgba(205,65,43,0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                      ID: {cam.identifier}
                    </code>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: cam.loading ? 'var(--text-muted)' : cam.error ? '#ef4444' : '#22c55e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {cam.loading ? <RefreshCw size={12} className="animate-spin" /> : <Camera size={12} />}
                    {cam.loading ? 'Conectando...' : cam.error ? 'Sin señal' : 'En vivo'}
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
