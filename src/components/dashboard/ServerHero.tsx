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
  const useProxy = info?.useProxy || server.useProxy === 1;

  const playerPercent = (isOnline && info.maxPlayers > 0)
    ? Math.min(100, (info.players / info.maxPlayers) * 100)
    : 0;

  const statusColor = isOnline ? '#22c55e' : isError ? '#ef4444' : '#eab308';
  const statusLabel = isOnline ? 'En Línea' : isError ? 'Sin Conexión' : 'Conectando...';

  // Tactial color for population bar
  const popColor = playerPercent > 90 ? '#ef4444' : playerPercent > 50 ? '#eab308' : 'var(--primary)';

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
            {useProxy && isOnline && (
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '4px', fontWeight: 700 }}>
                PROXY ACTIVO
              </span>
            )}
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

        <div style={{ textAlign: 'right', minWidth: '220px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={14} /> Población
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>
              {isOnline ? `${info.players} / ${info.maxPlayers}` : '--- / ---'}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div
              style={{
                width: `${playerPercent}%`,
                height: '100%',
                background: popColor,
                boxShadow: `0 0 10px ${popColor}`,
                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
          {isOnline && (info?.queued || info?.queuedPlayers) > 0 && (
            <div style={{ fontSize: '0.8rem', color: '#f97316', marginTop: '0.5rem', fontWeight: 800, textTransform: 'uppercase' }}>
              COLA: {info.queued || info.queuedPlayers} JUGADORES
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
