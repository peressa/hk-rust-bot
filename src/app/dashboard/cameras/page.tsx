import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Video, Camera, Layout as LayoutIcon, Play, Square } from "lucide-react";

export default function CamerasPage() {
  const cameras = [
    { id: "c1", name: "Entrada Principal", idName: "ENTRADA1", active: true },
    { id: "c2", name: "Patio Trasero", idName: "BACKPATIO", active: false },
    { id: "c3", name: "Techo Snipers", idName: "ROOF_TOP", active: false }
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Video color="var(--primary)" /> Vigilancia CCTV
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Monitorea tu base en tiempo real con frames de alta calidad.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ 
              background: 'var(--secondary)', 
              border: '1px solid var(--border)', 
              color: 'white', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <LayoutIcon size={18} /> Mosaico
            </button>
            <button className="btn-primary">
              <Camera size={18} /> Añadir Cámara
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
          {cameras.map(cam => (
            <div key={cam.id} className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Camera Stream Placeholder */}
              <div style={{ 
                height: '250px', 
                background: '#000', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, #050505 10px, #050505 20px)'
              }}>
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cam.active ? '#ef4444' : 'var(--text-muted)', animation: cam.active ? 'pulse 2s infinite' : 'none' }}></div>
                  REC {cam.idName}
                </div>
                {cam.active ? (
                   <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Conectando al stream...</span>
                ) : (
                  <button style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <Play size={18} /> Iniciar Vista
                  </button>
                )}
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 600 }}>{cam.name}</h3>
                  <code style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>ID: {cam.idName}</code>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'white' }}>PTZ</button>
                  <button style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'white' }}>Filtro</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </DashboardLayout>
  );
}
