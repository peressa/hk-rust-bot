"use client";

import React, { useState, useEffect } from "react";
import { Share2, Plus, Trash2, Copy, ShieldCheck, ShieldAlert, Pencil, Link as LinkIcon, Check } from "lucide-react";

interface InviteManagerProps {
  serverId: string;
}

export default function InviteManager({ serverId }: InviteManagerProps) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [pincode, setPincode] = useState("");
  const [canDraw, setCanDraw] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, [serverId]);

  const fetchInvites = async () => {
    try {
      const res = await fetch(`/api/rustplus/invites?serverId=${serverId}`);
      const data = await res.json();
      setInvites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (pincode.length !== 4) return;
    setCreating(true);
    try {
      const res = await fetch("/api/rustplus/invites", {
        method: "POST",
        body: JSON.stringify({ serverId, code: pincode, canDraw })
      });
      if (res.ok) {
        setPincode("");
        setCanDraw(false);
        fetchInvites();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/rustplus/invites?id=${id}`, { method: "DELETE" });
      fetchInvites();
    } catch (e) {}
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', paddingTop: '6rem' }}>
       <h2 style={{ fontSize: '3.5rem', fontFamily: 'Bebas Neue', lineHeight: 1, marginBottom: '0.5rem' }}>PROTOCOLO_INVITADOS</h2>
       <div style={{ color: 'var(--primary)', letterSpacing: '0.4em', fontSize: '0.7rem', marginBottom: '2rem' }}>GESTIÓN_DE_ACCESOS_TÁCTICOS_V3</div>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flex: 1 }}>
          
          {/* Create Section */}
          <section>
             <div className="premium-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em', marginBottom: '1.5rem', color: 'var(--primary)' }}>GENERAR_NUEVA_AUTORIZACIÓN</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#666', marginBottom: '0.5rem' }}>CÓDIGO_PIN_4_DÍGITOS</label>
                      <input 
                        type="text" 
                        maxLength={4}
                        placeholder="EJ: 1234"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        style={{ width: '100%', background: '#000', border: '1px solid var(--border)', padding: '1rem', color: 'white', fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.2em' }}
                      />
                   </div>

                   <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={canDraw} 
                        onChange={(e) => setCanDraw(e.target.checked)} 
                        style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                      />
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '0.8rem', fontWeight: 900, fontFamily: 'Bebas Neue' }}>HABILITAR_DIBUJO_TÁCTICO</div>
                         <div style={{ fontSize: '0.6rem', color: '#555' }}>El invitado podrá realizar trazos en el Radar Global.</div>
                      </div>
                   </label>

                   <button 
                      onClick={handleCreate}
                      disabled={creating || pincode.length !== 4}
                      style={{ 
                        background: pincode.length === 4 ? 'var(--primary)' : '#222', 
                        color: 'white', 
                        border: 'none', 
                        padding: '1.25rem', 
                        fontFamily: 'Bebas Neue', 
                        fontSize: '1.2rem', 
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                   >
                      {creating ? "AUTORIZANDO..." : "CREAR_ACCESO_OPERATIVO"}
                   </button>
                </div>
             </div>

             <div style={{ marginTop: '2rem', opacity: 0.3, fontSize: '0.6rem', letterSpacing: '0.2em', lineHeight: 1.6 }}>
                [INFO]: LAS INVITACIONES SE INVALIDAN AUTOMÁTICAMENTE TRAS UN WIPE DEL SERVIDOR PARA GARANTIZAR LA SEGURIDAD DE LA INTELIGENCIA TÁCTICA.
             </div>
          </section>

          {/* List Section */}
          <section style={{ overflowY: 'auto' }}>
             <h3 style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em', marginBottom: '1.5rem', color: '#666' }}>ACCESOS_ACTIVOS ({invites.length})</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {invites.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed #222', opacity: 0.3 }}>SIN_INVITACIONES_ACTIVAS</div>
                ) : (
                   invites.map((invite) => (
                      <div key={invite.id} className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                         <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem' }}>
                            <LinkIcon size={20} color="var(--primary)" />
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, fontFamily: 'Bebas Neue', color: 'white' }}>LINK_ID: {invite.id}</div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.6rem', color: '#555', marginTop: '0.25rem' }}>
                               <span>PIN: {invite.code}</span>
                               <span>DIBUJO: {invite.canDraw ? "SÍ" : "NO"}</span>
                            </div>
                         </div>
                         <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => copyLink(invite.id)} style={{ background: '#333', border: 'none', padding: '0.5rem', cursor: 'pointer', color: 'white' }}>
                               {copiedId === invite.id ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
                            </button>
                            <button onClick={() => handleDelete(invite.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '0.5rem', cursor: 'pointer', color: '#ef4444' }}>
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </section>
       </div>
    </div>
  );
}
