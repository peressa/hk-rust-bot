import React from "react";
import { Server, Users, Map as MapIcon, Globe } from "lucide-react";

interface ServerHeroProps {
  server: any;
  info: any;
}

export default function ServerHero({ server, info }: ServerHeroProps) {
  if (!server) return null;

  const playerPercent = info ? (info.players / info.maxPlayers) * 100 : 0;
  const headerImg = info?.headerImage || "https://files.facepunch.com/lewis/1b2911b1/rust-header.jpg";

  return (
    <div 
      className="server-header-bg animate-fade-in" 
      style={{ backgroundImage: `url(${headerImg})` }}
    >
      <div className="server-header-overlay">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="status-online"></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22c55e' }}>
              En Línea
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1 }}>
            {server.name}
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', opacity: 0.8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
              <Globe size={14} /> {server.ip}:{server.port}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
              <MapIcon size={14} /> {info?.map || "Procedural Map"}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={14} /> Población
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>
              {info?.players || 0} / {info?.maxPlayers || 0}
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${playerPercent}%`, 
                height: '100%', 
                background: 'var(--primary)',
                boxShadow: '0 0 10px var(--primary)',
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }} 
            />
          </div>
          {info?.queuedPlayers > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.4rem', fontWeight: 600 }}>
              Cola: {info.queuedPlayers} jugadores
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
