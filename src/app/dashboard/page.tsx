import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Server, Users, Clock, ShieldCheck, Activity, Power, Wifi } from "lucide-react";

export default function DashboardPage() {
  // Mock data for initial preview
  const servers = [
    { id: "1", name: "HK Official 10x", ip: "127.0.0.1", players: "150/200", uptime: "4d 12h", status: "online" },
    { id: "2", name: "Rustoria Main", ip: "192.168.1.1", players: "400/400", uptime: "1d 5h", status: "online" }
  ];

  const entities = [
    { id: "e1", name: "Luz del Techo", type: "Switch", state: true },
    { id: "e2", name: "Torretas Main", type: "Switch", state: false },
    { id: "e3", name: "Alarma Silenciosa", type: "Alarm", state: false }
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Bienvenido de nuevo, Operador. Tu base está segura.</p>
          </div>
          <button className="btn-primary">
            <Wifi size={18} />
            Escanear Servidores
          </button>
        </header>

        {/* Servers Grid */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Server color="var(--primary)" /> Servidores Conectados
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {servers.map(server => (
              <div key={server.id} className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>{server.name}</h3>
                  <div style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    background: 'rgba(34, 197, 94, 0.1)', 
                    color: '#22c55e', 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    Conectado
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <Users size={16} /> {server.players}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <Clock size={16} /> {server.uptime}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', flex: 1 }}>Ver Detalles</button>
                  <button style={{ 
                    background: 'var(--secondary)', 
                    border: '1px solid var(--border)', 
                    color: 'white', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}>Desconectar</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Entities Grid */}
        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity color="var(--primary)" /> Dispositivos Inteligentes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {entities.map(entity => (
              <div key={entity.id} className="premium-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderLeft: `4px solid ${entity.state ? 'var(--primary)' : 'var(--secondary)'}`
              }}>
                <div>
                  <h4 style={{ fontWeight: 600 }}>{entity.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entity.type}</span>
                </div>
                <button style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: entity.state ? 'var(--primary)' : 'var(--secondary)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition)'
                }}>
                  <Power size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
