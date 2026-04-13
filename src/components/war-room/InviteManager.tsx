"use client";

import React, { useState, useEffect } from "react";
import { Share2, Plus, Trash2, Clock, Shield, Key } from "lucide-react";

interface Invite {
  id: string;
  name: string;
  code: string;
  expiresAt: string;
  canDraw: boolean;
  serverId: string;
}

export default function InviteManager({ serverId }: { serverId: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [expires, setExpires] = useState("7d");
  const [canDraw, setCanDraw] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, [serverId]);

  const fetchInvites = async () => {
    try {
      const res = await fetch(`/api/rustplus/invites?serverId=${serverId}`);
      const data = await res.json();
      if (data.invites) setInvites(data.invites);
    } catch (err) { console.error(err); }
  };

  const createInvite = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rustplus/invites`, {
        method: "POST",
        body: JSON.stringify({ serverId, name, expires, canDraw })
      });
      if (res.ok) {
        setName("");
        fetchInvites();
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteInvite = async (id: string) => {
    try {
      await fetch(`/api/rustplus/invites?id=${id}`, { method: "DELETE" });
      fetchInvites();
    } catch (err) { console.error(err); }
  };

  const getShareLink = (id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/share/${id}`;
  };

  return (
    <div className="premium-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '1.5rem', background: '#050505' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-barlow)', fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
          <Share2 size={18} /> Gestión de Accesos
        </h3>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
          Enlaces de Invitado
        </span>
      </div>

      {/* Creation UI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid #111' }}>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del enlace (ej: Clan Aliado)"
          style={{ width: '100%', background: '#000', border: '1px solid #222', padding: '0.6rem', color: 'white', fontSize: '0.8rem' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={expires} 
            onChange={(e) => setExpires(e.target.value)}
            style={{ flex: 1, background: '#000', border: '1px solid #222', padding: '0.6rem', color: 'white', fontSize: '0.8rem' }}
          >
            <option value="12h">Cierra en 12 horas</option>
            <option value="1d">Cierra en 1 día</option>
            <option value="2d">Cierra en 2 días</option>
            <option value="3d">Cierra en 3 días</option>
            <option value="7d">Cierra en 7 días</option>
          </select>
          <button 
            onClick={createInvite}
            disabled={loading || !name.trim()}
            style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 900 }}
          >
            <Plus size={16} /> GENERAR
          </button>
        </div>
      </div>

      {/* Invites List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {invites.map((invite) => (
          <div key={invite.id} style={{ 
            padding: '1rem', 
            background: '#0a0a0b', 
            border: '1px solid #151515',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', fontFamily: 'var(--font-barlow)' }}>{invite.name}</div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem', fontSize: '0.65rem', color: '#666', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={10} /> {new Date(invite.expiresAt).toLocaleDateString()}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Key size={10} /> PIN: {invite.code}</span>
                </div>
              </div>
              <button onClick={() => deleteInvite(invite.id)} style={{ padding: '0.25rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }} onMouseOver={(e) => e.currentTarget.style.opacity = '1'} onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}>
                <Trash2 size={16} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                 readOnly 
                 value={getShareLink(invite.id)} 
                 style={{ flex: 1, background: '#000', border: '1px solid #1a1a1a', padding: '0.4rem', color: '#666', fontSize: '0.65rem', cursor: 'pointer' }}
                 onClick={(e) => {
                   (e.target as HTMLInputElement).select();
                   document.execCommand('copy');
                   alert("Enlace copiado");
                 }} 
              />
            </div>
          </div>
        ))}
        {invites.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, flexDirection: 'column', gap: '1rem' }}>
             <Share2 size={32} />
             <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>SIN ENLACES ACTIVOS</span>
          </div>
        )}
      </div>
    </div>
  );
}
