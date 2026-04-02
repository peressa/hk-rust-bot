import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RustMap from "@/components/map/RustMap";
import { Search, Filter, Map as MapIcon } from "lucide-react";

export default function MapPage() {
  const mockMarkers = [
    { pos: [0, 0], name: "Base Principal", description: "Nuestra fortaleza." },
    { pos: [10, 20], name: "Vending Machine", description: "Azufre barato!" }
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapIcon color="var(--primary)" /> Mapa Táctico
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Visualiza monumentos, patrullas y puntos de interés.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Buscar monumento..." style={{ paddingLeft: '2.5rem' }} />
            </div>
            <button style={{ 
              background: 'var(--secondary)', 
              border: '1px solid var(--border)', 
              color: 'white', 
              padding: '0 1rem', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Filter size={18} /> Filtros
            </button>
          </div>
        </header>

        <RustMap markers={mockMarkers} />

        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <StatCard label="Monumentos" value="24" />
          <StatCard label="Vending Machines" value="12" />
          <StatCard label="Eventos Activos" value="Cargo / Heli" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="premium-card" style={{ padding: '1.25rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}
