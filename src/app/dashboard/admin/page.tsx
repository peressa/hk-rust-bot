"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ShieldAlert, 
  Activity, 
  Server, 
  Globe, 
  Clock, 
  RefreshCw,
  Terminal,
  Database
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <DashboardLayout>
       <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <RefreshCw className="animate-spin" size={48} color="var(--primary)" />
       </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ marginBottom: '3rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1.5rem' }}>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', margin: 0 }}>
             CENTRO DE MANDO GLOBAL
           </h1>
           <p style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
             SaaS Administration & Infrastructure Monitor
           </p>
        </header>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
           <StatCard 
             icon={<Activity color="var(--primary)" />} 
             label="CONEXIONES ACTIVAS" 
             value={stats?.activeConnections || 0} 
           />
           <StatCard 
             icon={<Server color="#22c55e" />} 
             label="SERVIDORES VINCULADOS" 
             value={stats?.totalServers || 0} 
           />
           <StatCard 
             icon={<Globe color="#3b82f6" />} 
             label="USUARIOS REGISTRADOS" 
             value={stats?.totalUsers || 0} 
           />
           <StatCard 
             icon={<ShieldAlert color="#f97316" />} 
             label="ALERTAS (ÚLT. 24H)" 
             value={stats?.alertsToday || 0} 
           />
        </div>

        {/* Servers Table */}
        <section className="premium-card" style={{ padding: '2rem' }}>
           <h3 style={{ fontFamily: 'var(--font-barlow)', fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Terminal size={20} color="var(--primary)" /> Servidores Activos en Tiempo Real
           </h3>
           
           <div style={{ overflowX: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                   <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem' }}>SERVIDOR / KEY</th>
                      <th style={{ padding: '1rem' }}>ESTADO</th>
                      <th style={{ padding: '1rem' }}>REINTENTOS</th>
                      <th style={{ padding: '1rem' }}>ÚLT. ACTIVIDAD</th>
                   </tr>
                </thead>
                <tbody>
                   {stats?.servers?.map((server: any) => (
                      <tr key={server.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                         <td style={{ padding: '1rem', fontWeight: 700 }}>
                            {server.key}
                         </td>
                         <td style={{ padding: '1rem' }}>
                            <span style={{ 
                              background: server.ready ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: server.ready ? '#22c55e' : '#ef4444',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              textTransform: 'uppercase'
                            }}>
                               {server.ready ? 'ONLINE' : 'OFFLINE'}
                            </span>
                         </td>
                         <td style={{ padding: '1rem', color: server.reconnectAttempts > 0 ? '#f97316' : 'inherit' }}>
                            {server.reconnectAttempts}
                         </td>
                         <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                            {server.lastActivity ? new Date(server.lastActivity).toLocaleTimeString() : 'Nunca'}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </section>

      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: any }) {
  return (
    <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
       <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
          {icon}
       </div>
       <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
             {label}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-barlow)' }}>
             {value}
          </div>
       </div>
    </div>
  );
}
