import React from "react";
import { Users, Map as MapIcon, Globe, RefreshCw } from "lucide-react";

interface ServerHeroProps {
  server: any;
  info: any; // null = Conectando...bject = datos, object con .error = fallo
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
  const statusLabel = isOnline ? 'EN LÍNEA' : isError ? 'SIN CONEXIÓN' : 'Conectando...';

  // Tactial color for population bar
  const popColor = playerPercent > 90 ? '#ef4444' : playerPercent > 50 ? '#eab308' : 'var(--primary)';

  return (
    <div
      className="server-header-bg animate-fade-in"
      style={{ backgroundImage: `url(https://files.facepunch.com/lewis/1b2911b1/rust-header.jpg)`, borderBottom: '2px solid var(--border)' }}
    >
      <div className="server-header-overlay" style={{ backdropFilter: 'none', background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 100%)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', background: statusColor }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: statusColor, fontFamily: 'var(--font-barlow)' }}>
              {statusLabel}
            </span>
            {useProxy && isOnline && (
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', border: '1px solid #3b82f6', color: '#3b82f6', fontWeight: 900, fontFamily: 'var(--font-barlow)' }}>
                Proxy Activo
              </span>
            )}
            {isConnecting && <RefreshCw size={12} className="animate-spin" color={statusColor} />}
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1, fontFamily: 'var(--font-barlow)', letterSpacing: '0.02em' }}>
            {isOnline ? (info?.name || server.name) : server.name}
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', opacity: 0.8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 900, color: '#aaa' }}>
              <Globe size={14} /> {server.ip}:{server.port}
            </span>
            {isOnline && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 900, color: '#aaa' }}>
                <MapIcon size={14} /> {info?.map || info?.levelUrl || 'Procedural Map'}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: '220px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-barlow)', color: '#aaa' }}>
              <Users size={14} /> POBLACIÓN
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow)' }}>
              {isOnline ? `${info.players} / ${info.maxPlayers}` : '--- / ---'}
            </span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div
              style={{
                width: `${playerPercent}%`,
                height: '100%',
                background: popColor,
                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
          {isOnline && (info?.queued || info?.queuedPlayers) > 0 && (
            <div style={{ fontSize: '0.9rem', color: '#f97316', marginTop: '0.5rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-barlow)' }}>
              Cola: {info.queued || info.queuedPlayers} Jugadores
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
