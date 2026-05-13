"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Beaker, ShieldAlert, MessageSquare, Bell, RefreshCw } from "lucide-react";

export default function DebugPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/servers")
      .then(res => res.json())
      .then(data => {
        setServers(data);
        if (data.length > 0) setSelectedServer(data[0].id);
      });
  }, []);

  const runTest = async (type: string) => {
    if (!selectedServer) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/debug/test?serverId=${selectedServer}&type=${type}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-barlow)', fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Beaker size={40} color="var(--primary)" /> LABORATORIO DE PRUEBAS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Prueba las integraciones tácticas y notificaciones del sistema.</p>
        </header>

        <div className="premium-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Seleccionar Servidor para el Test
            </label>
            <select 
              value={selectedServer} 
              onChange={(e) => setSelectedServer(e.target.value)}
              style={{ width: '100%', padding: '1rem', background: '#0a0a0a', border: '1px solid var(--border)', color: 'white', fontWeight: 700 }}
            >
              <option value="">Selecciona un servidor...</option>
              {servers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.ip})</option>)}
            </select>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <TestButton 
              title="Test Discord" 
              desc="Envía una alerta de prueba al Webhook/Canal." 
              icon={<Bell />} 
              onClick={() => runTest('discord')} 
              loading={loading}
            />
            <TestButton 
              title="Test Rust+" 
              desc="Envía un mensaje al Team Chat del juego." 
              icon={<MessageSquare />} 
              onClick={() => runTest('rust')} 
              loading={loading}
            />
            <TestButton 
              title="Simular Ban" 
              desc="Simula un reporte de baneo EAC/Global." 
              icon={<ShieldAlert />} 
              onClick={() => runTest('ban')} 
              loading={loading}
            />
          </div>

          {result && (
            <div style={{ 
              padding: '1.5rem', 
              background: result.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
              border: `1px solid ${result.error ? '#ef4444' : '#22c55e'}`,
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function TestButton({ title, desc, icon, onClick, loading }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      style={{ 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid var(--border)', 
        padding: '1.5rem', 
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'var(--transition)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
      {loading && <RefreshCw size={14} className="animate-spin" />}
    </button>
  );
}
