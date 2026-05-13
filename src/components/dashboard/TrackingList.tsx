"use client";

import React, { useState, useEffect } from "react";
import { Target, UserPlus, Trash2, ExternalLink, Activity } from "lucide-react";

interface TrackingTarget {
  steamId: string;
  name: string;
  isOnline: number;
  lastSeen: number;
}

export default function TrackingList({ serverId }: { serverId: string }) {
  const [targets, setTargets] = useState<TrackingTarget[]>([]);
  const [newSteamId, setNewSteamId] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTargets();
    const interval = setInterval(fetchTargets, 10000);
    return () => clearInterval(interval);
  }, [serverId]);

  const fetchTargets = async () => {
    try {
      const res = await fetch(`/api/intel/tracking?serverId=${serverId}`);
      const data = await res.json();
      if (!data.error) setTargets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSteamId || !newName) return;

    setLoading(true);
    try {
      await fetch("/api/intel/tracking", {
        method: "POST",
        body: JSON.stringify({ serverId, steamId: newSteamId, name: newName })
      });
      setNewSteamId("");
      setNewName("");
      fetchTargets();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (steamId: string) => {
    try {
      await fetch(`/api/intel/tracking?serverId=${serverId}&steamId=${steamId}`, {
        method: "DELETE"
      });
      fetchTargets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="premium-card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ 
        fontFamily: 'var(--font-barlow)', 
        fontSize: '1.1rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        color: 'var(--primary)',
        letterSpacing: '0.05em',
        margin: 0
      }}>
        <Target size={18} /> RASTREO DE OBJETIVOS
      </h3>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input 
          type="text" 
          placeholder="Nombre" 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'white' }}
        />
        <input 
          type="text" 
          placeholder="SteamID" 
          value={newSteamId}
          onChange={(e) => setNewSteamId(e.target.value)}
          style={{ flex: 2, padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'white' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '0.5rem', background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '2px' }}
        >
          <UserPlus size={16} />
        </button>
      </form>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {targets.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem' }}>
            No hay objetivos en seguimiento.
          </div>
        ) : (
          targets.map((t) => (
            <div key={t.steamId} style={{ 
              padding: '0.75rem', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: t.isOnline ? '#22c55e' : '#666',
                    boxShadow: t.isOnline ? '0 0 8px #22c55e' : 'none'
                  }}></span>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{t.name}</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                  {t.steamId}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a 
                  href={`https://www.battlemetrics.com/players?filter[search]=${t.steamId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'var(--text-muted)', hover: { color: 'white' } }}
                >
                  <ExternalLink size={14} />
                </a>
                <button 
                  onClick={() => handleDelete(t.steamId)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
