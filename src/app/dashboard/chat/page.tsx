"use client";

import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Shield, 
  RefreshCw,
  Clock
} from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      setMessages([]); // Reset al cambiar de servidor
      setError(null);
      fetchChat(selectedServer.id);
      fetchTeam(selectedServer.id);
      const interval = setInterval(() => {
        fetchChat(selectedServer.id);
        fetchTeam(selectedServer.id);
      }, 5000); 
      return () => clearInterval(interval);
    }
  }, [selectedServer?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      setServers(data);
      if (data.length > 0) setSelectedServer(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async (serverId: string) => {
    try {
      const res = await fetch(`/api/rustplus/chat?serverId=${serverId}`);
      const data = await res.json();
      if (data.error) {
        if (data.error.includes("timeout")) {
          setError("Error de conexión al servidor (Timeout). Reintenta enviando un mensaje.");
        }
      } else {
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeam = async (serverId: string) => {
    try {
      const res = await fetch(`/api/rustplus/team?serverId=${serverId}`);
      const data = await res.json();
      setTeam(data.members || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedServer || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/rustplus/chat", {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer.id,
          message: newMessage
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`Error al enviar: ${data.error || "Servidor no responde"}`);
      } else {
        setNewMessage("");
        fetchChat(selectedServer.id);
      }
    } catch (err) {
      setError("Error crítico de red al contactar con el bot.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '80vh' }}><RefreshCw size={40} className="animate-spin" color="var(--primary)" /></div>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare color="var(--primary)" className="glow" /> Chat de Equipo
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Frecuencia de radio segura habilitada.</p>
          </div>
          
          <select 
            value={selectedServer?.id} 
            onChange={(e) => setSelectedServer(servers.find(s => s.id === e.target.value))}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white' }}
          >
            {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </header>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', flex: 1, minHeight: 0 }}>
          {/* Chat Window */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div 
              ref={scrollRef}
              style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.3, marginTop: '20%' }}>
                  <MessageSquare size={48} style={{ marginBottom: '1rem' }} />
                  <p>No hay mensajes recientes en esta frecuencia.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Los mensajes empezarán a aparecer en cuanto el bot esté conectado y reciba una señal del servidor.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(205, 65, 43, 0.1)', display: 'grid', placeItems: 'center', fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', border: '1px solid rgba(205, 65, 43, 0.2)' }}>
                      {msg.name?.charAt(0) || "R"}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{msg.name}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ color: '#d1d1d1', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input area */}
            <form onSubmit={handleSend} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enviar mensaje al clan..."
                  style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}
                />
                <button type="submit" className="btn-primary" disabled={sending || !newMessage.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}>
                  {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </form>
          </div>

          {/* Members Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="premium-card">
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                <Users size={16} /> Equipo ({team.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {team.map((m, i) => {
                  const isAlive = m.isAlive;
                  const isOnline = m.isOnline;
                  let statusLabel = isOnline ? "En servicio" : "Fuera de línea";
                  let statusColor = isOnline ? "#22c55e" : "#374151";
                  let subLabel = isOnline ? "En el campo" : "Desconectado";

                  if (isOnline) {
                    if (!isAlive) {
                      statusLabel = "MUERTO";
                      statusColor = "#ef4444";
                      const deathDate = new Date(m.deathTime * 1000);
                      subLabel = `Murió hace ${Math.floor((Date.now() - deathDate.getTime()) / 60000)}m`;
                    } else {
                      statusLabel = "VIVO";
                      statusColor = "#22c55e";
                      subLabel = "Posición Estable";
                    }
                  }

                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: isOnline ? 1 : 0.5 }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: isAlive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          display: 'grid', 
                          placeItems: 'center', 
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          border: `1px solid ${isAlive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                          color: isAlive ? '#22c55e' : '#ef4444'
                        }}>
                          {m.name?.charAt(0)}
                        </div>
                        <div style={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          right: 0, 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: statusColor, 
                          border: '2px solid var(--surface)',
                          animation: !isAlive && isOnline ? 'blink 1s infinite' : 'none'
                        }}></div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isOnline ? 'white' : 'var(--text-muted)' }}>{m.name}</span>
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: statusColor }}>{statusLabel}</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{subLabel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="premium-card" style={{ background: 'linear-gradient(135deg, rgba(205, 65, 43, 0.05), transparent)' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Shield size={16} /> Cifrado Clan
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Todos los mensajes están cifrados mediante la API oficial de Facepunch.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
