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
      background: 'rgba(10, 10, 12, 0.8)',
      padding: '1.75rem',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '4px'
    }}>
      {/* Tactical Corner Markers */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '10px', borderTop: '2px solid var(--primary)', borderLeft: '2px solid var(--primary)' }}></div>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderBottom: '2px solid var(--primary)', borderRight: '2px solid var(--primary)' }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ background: 'rgba(232, 0, 28, 0.1)', padding: '0.6rem', borderRadius: '4px', border: '1px solid rgba(232, 0, 28, 0.2)' }}>
          <Server color="var(--primary)" size={20} />
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 900, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
             LINK_ACTIVE
           </div>
           <div className="text-tech" style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
              SIG_STRENGTH: 98%
           </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', marginBottom: '0.5rem', letterSpacing: '-0.02em', color: '#fff', textTransform: 'uppercase' }}>
          {server.name}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            <Globe size={12} /> {server.ip}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: server.useProxy ? 'var(--primary)' : 'rgba(255,255,255,0.2)', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            <Shield size={12} /> {server.useProxy ? 'PROXY_ENABLED' : 'DIRECT_CONNECTION'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Link href={`/war-room/${server.id}`} className="btn-primary" style={{ 
            width: '100%', 
            justifyContent: 'center', 
            fontSize: '0.8rem', 
            padding: '1rem',
            fontWeight: 900,
            letterSpacing: '0.1em'
        }}>
          DEPLOY WAR ROOM <ChevronRight size={16} />
        </Link>
      </div>

      {/* Decorative Decal */}
      <div style={{ position: 'absolute', bottom: '1.75rem', right: '-1rem', opacity: 0.02, pointerEvents: 'none', transform: 'rotate(-90deg)', fontSize: '2rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
        RUST OPS UNIT
      </div>
    </div>
  );
}
