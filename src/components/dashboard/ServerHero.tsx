import React from "react";
import { Users, Map as MapIcon, Globe, RefreshCw } from "lucide-react";

interface ServerHeroProps {
  server: any;
  info: any; // null = conectando, object = datos, object con .error = fallo
}

export default function ServerHero({ server, info }: ServerHeroProps) {
  if (!server) return null;

  const isOnline = !!info && !info.error;
  const isConnecting = info === null;
  const isError = !!info?.error;

  const playerPercent = (isOnline && info.maxPlayers > 0)
    ? Math.min(100, (info.players / info.maxPlayers) * 100)
    : 0;

  const statusColor = isOnline ? '#22c55e' : isError ? '#ef4444' : '#eab308';
  const statusLabel = isOnline ? 'En Línea' : isError ? 'Sin Conexión' : 'Conectando...';

  return (
    <div
      className="server-header-bg animate-fade-in"
      style={{ backgroundImage: `url(https://files.facepunch.com/lewis/1b2911b1/rust-header.jpg)` }}
    >
      <div className="server-header-overlay">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: statusColor }}>
              {statusLabel}
            </span>
            {isConnecting && <RefreshCw size={12} className="animate-spin" color={statusColor} />}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1 }}>
            {isOnline ? (info?.name || server.name) : server.name}
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', opacity: 0.8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
              <Globe size={14} /> {server.ip}:{server.port}
            </span>
            {isOnline && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                <MapIcon size={14} /> {info?.map || info?.levelUrl || 'Procedural Map'}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={14} /> Población
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>
              {isOnline ? `${info.players} / ${info.maxPlayers}` : '--- / ---'}
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
          {isOnline && info?.queuedPlayers > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.4rem', fontWeight: 600 }}>
              Cola: {info.queuedPlayers} jugadores
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
