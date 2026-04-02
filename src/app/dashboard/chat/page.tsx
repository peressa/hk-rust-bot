"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TeamChat from "@/components/chat/TeamChat";
import { MessageSquare, Users, Shield, RefreshCw } from "lucide-react";

export default function ChatPage() {
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      const interval = setInterval(() => {
        fetchChatData(selectedServer.id);
      }, 5000); // Poll team info every 5s for chat updates
      fetchChatData(selectedServer.id);
      return () => clearInterval(interval);
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

  const fetchChatData = async (serverId: string) => {
    try {
      const res = await fetch(`/api/rustplus/chat?serverId=${serverId}`);
      const data = await res.json();
      setTeamInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedServer) return;
    try {
      await fetch("/api/rustplus/chat", {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer.id,
          message: text
        })
      });
      fetchChatData(selectedServer.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare color="var(--primary)" /> Comunicación de Equipo
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Chat encriptado directo con el servidor de Rust.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
              value={selectedServer?.id} 
              onChange={(e) => setSelectedServer(servers.find(s => s.id === e.target.value))}
              className="premium-select"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white' }}
            >
              {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          <TeamChat 
            messages={teamInfo?.messages || []} 
            onSendMessage={handleSendMessage} 
          />

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="premium-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--primary)" /> Miembros del Clan
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {teamInfo?.members?.map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.isOnline ? '#22c55e' : '#6b7280' }}></div>
                    <span style={{ fontSize: '0.9rem', flex: 1 }}>{m.name}</span>
                    {m.isAlive ? <Shield size={14} color="var(--primary)" /> : <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>💀</span>}
                  </div>
                )) || <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>Cargando equipo...</p>}
              </div>
            </div>

            <div className="premium-card" style={{ background: 'rgba(205, 65, 43, 0.05)', border: '1px dashed var(--primary)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Sincronización</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Los mensajes se sincronizan cada 5 segundos para mantener el rendimiento del VPS óptimo.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
