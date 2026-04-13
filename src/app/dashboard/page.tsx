"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Server, RefreshCw, PlusCircle, Settings as SettingsIcon, LayoutGrid } from "lucide-react";
import ServerCard from "@/components/dashboard/ServerCard";
import Link from "next/link";

export default function DashboardPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      setServers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <RefreshCw className="animate-spin" size={48} color="var(--primary)" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', letterSpacing: '-0.02em', lineHeight: 1, color: '#fff', textTransform: 'uppercase' }}>
              Central de Mando
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 400 }}>
              Seleccione un servidor para iniciar la monitorización táctica en tiempo real.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/dashboard/settings" className="btn-secondary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600, fontFamily: 'var(--font-barlow)' }}>
              <SettingsIcon size={18} /> configuración
            </Link>
            <Link href="/dashboard/settings" className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, fontFamily: 'var(--font-barlow)' }}>
              <PlusCircle size={18} /> vincular nuevo
            </Link>
          </div>
        </header>

        {servers.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '6rem 2rem', borderStyle: 'dashed' }}>
             <Server size={64} color="var(--primary)" style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
             <h2 style={{ fontFamily: 'var(--font-barlow)', fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>No se detectan señales</h2>
             <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                Aún no has vinculado ningún servidor de Rust. Utiliza el terminal de enlace para comenzar la monitorización.
             </p>
             <Link href="/dashboard/settings" className="btn-primary">IR AL TERMINAL DE ENLACE</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {servers.map(server => (
              <ServerCard key={server.id} server={server} />
            ))}
            
            {/* Blank Card for Adding New */}
            <Link href="/dashboard/settings" style={{ textDecoration: 'none' }}>
              <div className="premium-card" style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '1rem',
                borderStyle: 'dashed',
                opacity: 0.5,
                transition: 'var(--transition)'
              }} onPointerOver={(e) => (e.currentTarget.style.opacity = '1')} onPointerOut={(e) => (e.currentTarget.style.opacity = '0.5')}>
                <PlusCircle size={40} />
                <span style={{ fontFamily: 'var(--font-barlow)', fontSize: '1.25rem', fontWeight: 600 }}>Vincular Servidor</span>
              </div>
            </Link>
          </div>
        )}

        <footer style={{ 
            marginTop: '5rem', 
            borderTop: '1px solid rgba(255,255,255,0.03)', 
            paddingTop: '2rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '0.65rem', 
            fontWeight: 800, 
            color: 'rgba(255,255,255,0.2)', 
            fontFamily: 'var(--font-roboto)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
        }}>
           <div style={{ display: 'flex', gap: '2.5rem' }}>
             <span>SISTEMA: RUST OPS v3.0</span>
             <span style={{ color: 'rgba(255,255,255,0.1)' }}>ENLACES ACTIVOS: {servers.length}</span>
           </div>
           <div>ESTADO DE RED: <span style={{ color: '#22c55e' }}>NOMINAL</span></div>
        </footer>
      </div>
    </DashboardLayout>
  );
}
