"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Search, 
  User, 
  Server, 
  Activity, 
  Shield, 
  Clock, 
  Globe, 
  Terminal,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  Target
} from "lucide-react";

export default function TestTrackingPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"player" | "server">("player");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`/api/test/battlemetrics?q=${encodeURIComponent(query)}&type=${searchType}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error en la búsqueda");
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <header style={{ marginBottom: '3rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1.5rem' }}>
          <div className="text-tech" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>BATTLEMETRICS // EXTRACTION TERMINAL</div>
          <h1 style={{ fontSize: '3rem', lineHeight: 1 }}>TRACKING <span style={{ color: 'var(--primary)' }}>TEST</span></h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Prueba de extracción de datos por IP y Nombre de Usuario.</p>
        </header>

        <div className="premium-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button 
                type="button"
                onClick={() => setSearchType("player")}
                className={searchType === "player" ? "tab-active" : "tab-inactive"}
                style={tabStyle(searchType === "player")}
              >
                <User size={14} /> JUGADOR
              </button>
              <button 
                type="button"
                onClick={() => setSearchType("server")}
                className={searchType === "server" ? "tab-active" : "tab-inactive"}
                style={tabStyle(searchType === "server")}
              >
                <Server size={14} /> SERVIDOR (IP)
              </button>
            </div>

            <div style={{ position: 'relative', display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={18} />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchType === "player" ? "Nombre de usuario (ej: Sniper)" : "IP del servidor (ej: 127.0.0.1)"}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '1rem 1rem 1rem 3rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  padding: '0 2.5rem',
                  fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'BUSCANDO...' : 'EJECUTAR'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="premium-card" style={{ borderColor: 'var(--error)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)', marginBottom: '2rem' }}>
            <AlertCircle />
            <span>{error}</span>
          </div>
        )}

        {results && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={18} color="var(--primary)" /> RESULTADOS DE INTELIGENCIA
            </h3>

            {searchType === "player" ? (
              <PlayerResults data={results} />
            ) : (
              <ServerResults data={results} />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function PlayerResults({ data }: { data: any }) {
  const players = data.data || [];
  const included = data.included || [];

  if (players.length === 0) return <div className="premium-card">No se encontraron jugadores.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {players.map((p: any) => {
        const lastSessionId = p.relationships?.sessions?.data?.[0]?.id;
        const lastSession = included.find((inc: any) => inc.type === "session" && inc.id === lastSessionId);
        const serverId = lastSession?.relationships?.server?.data?.id;
        const server = included.find((inc: any) => inc.type === "server" && inc.id === serverId);

        return (
          <div key={p.id} className="premium-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', width: '64px', height: '64px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                  <User size={32} color="var(--primary)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{p.attributes.name}</h2>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={12} /> {p.attributes.positiveMatch ? 'MATCH' : 'PLAYER'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Target size={12} /> ID: {p.id}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  background: server ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                  color: server ? 'var(--accent)' : '#888',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: server ? 'var(--accent)' : '#888' }} className={server ? 'status-blink' : ''}></div>
                  {server ? 'ONLINE' : 'OFFLINE'}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', opacity: 0.4 }}>ÚLTIMA ACTIVIDAD: {new Date(p.attributes.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>

            {server && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="text-tech" style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>SERVER ACTUAL // DETECTADO</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{server.attributes.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{server.attributes.ip}:{server.attributes.port}</div>
                  </div>
                  <a href={`https://www.battlemetrics.com/servers/rust/${server.id}`} target="_blank" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 900 }}>
                    VER EN BM <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ServerResults({ data }: { data: any }) {
  const s = data;
  if (!s.attributes) return <div className="premium-card">No se encontró el servidor.</div>;

  return (
    <div className="premium-card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div className="text-tech" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>SERVER NODE // {s.id}</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.attributes.name}</h2>
          <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.7 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} /> {s.attributes.ip}:{s.attributes.port}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={14} /> {s.attributes.status.toUpperCase()}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', color: 'var(--primary)' }}>
            {s.attributes.players} <span style={{ fontSize: '1rem', color: '#666' }}>/ {s.attributes.maxPlayers}</span>
          </div>
          <div className="text-tech">POBLACIÓN ACTUAL</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatBox icon={<Activity size={16} />} label="RANGO" value={`#${s.attributes.rank}`} />
        <StatBox icon={<Clock size={16} />} label="TIEMPO" value={s.attributes.details?.rust_headerimage ? 'ACTIVO' : 'N/A'} />
        <StatBox icon={<ChevronRight size={16} />} label="VERSIÓN" value={s.attributes.version || '---'} />
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a href={`https://www.battlemetrics.com/servers/rust/${s.id}`} target="_blank" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.8rem 2rem' }}>
          ABRIR EN BATTLEMETRICS <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: any) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 900, color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const tabStyle = (active: boolean) => ({
  background: active ? 'rgba(232, 0, 28, 0.1)' : 'transparent',
  border: active ? '1px solid var(--primary)' : '1px solid transparent',
  color: active ? '#fff' : '#666',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 900,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: '0.2s'
});
