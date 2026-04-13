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
      gap: '1.25rem',
      borderLeft: '4px solid var(--primary)',
      background: 'rgba(5, 5, 5, 0.6)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.03, pointerEvents: 'none' }}>
          <Server size={120} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '2px' }}>
          <Server color="white" size={18} />
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.6rem', color: '#22c55e', fontWeight: 800, fontFamily: 'var(--font-barlow)', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             <Activity size={10} /> Sistema Activo
           </div>
           <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700, fontFamily: 'var(--font-roboto)' }}>ID: {server.id.split('-')[0].toUpperCase()}</div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-barlow)', marginBottom: '0.4rem', letterSpacing: '0.01em', color: '#fff' }}>
          {server.name}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Globe size={10} /> {server.ip}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: server.useProxy ? 'var(--primary)' : 'inherit' }}><Shield size={10} /> Proxy: {server.useProxy ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link href={`/war-room/${server.id}`} className="btn-primary" style={{ 
            width: '100%', 
            justifyContent: 'center', 
            fontSize: '0.75rem', 
            padding: '0.8rem',
            background: 'rgba(206, 66, 43, 0.1)',
            border: '1px solid rgba(206, 66, 43, 0.2)',
            color: 'var(--primary)',
            fontWeight: 800
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--primary)', e.currentTarget.style.color = 'white')}
        onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(206, 66, 43, 0.1)', e.currentTarget.style.color = 'var(--primary)')}
        >
          ACCEDER AL PANEL <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
