import React from "react";
import Link from "next/link";
import { Server, Activity, ChevronRight, Globe, Shield } from "lucide-react";

interface ServerCardProps {
  server: any;
}

export default function ServerCard({ server }: ServerCardProps) {
  return (
    <div className="premium-card animate-fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.5rem',
      borderLeft: '4px solid var(--primary)',
      background: 'linear-gradient(165deg, rgba(206, 66, 43, 0.03) 0%, transparent 100%)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ background: 'var(--primary)', padding: '0.75rem' }}>
          <Server color="white" size={24} />
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 900, fontFamily: 'Bebas Neue', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
             <Activity size={12} /> SISTEMA_ACTIVO
           </div>
           <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>ID: {server.id.split('-')[0]}</div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1.75rem', fontFamily: 'Bebas Neue', marginBottom: '0.25rem', letterSpacing: '0.02em', lineHeight: 1.1 }}>
          {server.name}
        </h3>
        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Globe size={12} /> {server.ip}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Shield size={12} /> PROXY: {server.useProxy ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <Link href={`/war-room/${server.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem' }}>
          INGRESAR AL MANDO CENTRAL <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  );
}
