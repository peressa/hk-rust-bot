import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TeamChat from "@/components/chat/TeamChat";
import { MessageSquare, Users, History } from "lucide-react";

export default function ChatPage() {
  const mockMessages = [
    { user: "Dimitri", text: "Cargo spawneando en 5 mins!", me: false },
    { user: "Ivan", text: "Voy para allá con el heli.", me: false },
    { user: "Admin", text: "Entendido, estoy cubriendo desde el techo.", me: true }
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare color="var(--primary)" /> Comunicación
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Chat de equipo seguro y cifrado.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ textAlign: 'right', marginRight: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Miembros Online</div>
              <div style={{ fontSize: '1.25rem', color: '#22c55e' }}>8 / 12</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem', display: 'flex', alignItems: 'center' }}>
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
                <History size={18} /> Historial
              </button>
            </div>
          </div>
        </header>

        <TeamChat messages={mockMessages} />

        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div>
            <div>Dimitri (Online)</div>
          </div>
          <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div>
            <div>Ivan (Online)</div>
          </div>
          <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.5 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
            <div>Pavel (Offline)</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
