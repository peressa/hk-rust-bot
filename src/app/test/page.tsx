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
  Target,
  Eye,
  Plus
} from "lucide-react";

export default function TestTrackingPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"player" | "server" | "direct">("direct");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedPlayers, setTrackedPlayers] = useState<any[]>([]);

  const fetchTracked = async () => {
    try {
      const res = await fetch("/api/test/track/list");
      const data = await res.json();
      setTrackedPlayers(data);
    } catch (e) {}
  };

  React.useEffect(() => {
    fetchTracked();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let url = "";
      if (searchType === "direct") {
        url = `/api/test/query?server=${encodeURIComponent(query)}`;
      } else {
        url = `/api/test/battlemetrics?q=${encodeURIComponent(query)}&type=${searchType}`;
      }
      
      const res = await fetch(url);
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
                <User size={14} /> BATTLEMETRICS: JUGADOR
              </button>
              <button 
                type="button"
                onClick={() => setSearchType("server")}
                className={searchType === "server" ? "tab-active" : "tab-inactive"}
                style={tabStyle(searchType === "server")}
              >
                <Server size={14} /> BATTLEMETRICS: SERVIDOR
              </button>
              <button 
                type="button"
                onClick={() => setSearchType("direct")}
                className={searchType === "direct" ? "tab-active" : "tab-inactive"}
                style={{...tabStyle(searchType === "direct"), borderColor: searchType === "direct" ? 'var(--accent)' : 'transparent', color: searchType === 'direct' ? 'var(--accent)' : '#666'}}
              >
                <Activity size={14} /> CONSULTA DIRECTA (MODO HORUS)
              </button>
            </div>

            <div style={{ position: 'relative', display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={18} />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchType === "player" ? "Nombre de usuario (BattleMetrics)" : 
                    searchType === "server" ? "IP del servidor para BM" :
                    "IP:Puerto del servidor (ej: 135.125.189.158:28015)"
                  }
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          <div>
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
                  <PlayerResults data={results} onUpdate={fetchTracked} />
                ) : searchType === "server" ? (
                  <ServerResults data={results} />
                ) : (
                  <DirectQueryResults data={results} onUpdate={fetchTracked} />
                )}
              </div>
            )}
          </div>

          <aside>
             <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
               <Target size={16} color="var(--primary)" /> OBJETIVOS SEGUIDOS
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               {trackedPlayers.length === 0 ? (
                 <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem', fontWeight: 900, background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                    SIN OBJETIVOS ACTIVOS
                 </div>
               ) : (
                 trackedPlayers.map(tp => (
                   <div key={tp.id} className="premium-card" style={{ padding: '1rem', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{tp.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{tp.id}</span>
                        <div style={{ 
                          fontSize: '0.6rem', 
                          fontWeight: 900, 
                          color: tp.status === 'online' ? 'var(--accent)' : '#666',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tp.status === 'online' ? 'var(--accent)' : '#666' }}></div>
                          {tp.status?.toUpperCase() || 'IDLE'}
                        </div>
                      </div>
                      {tp.lastServerName && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800 }}>
                          LOC: {tp.lastServerName.substring(0, 25)}...
                        </div>
                      )}
                   </div>
                 ))
               )}
             </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PlayerResults({ data, onUpdate }: { data: any, onUpdate?: () => void }) {
  const players = data.data || [];
  const included = data.included || [];
  const [trackingId, setTrackingId] = useState<string | null>(null);

  if (players.length === 0) return <div className="premium-card">No se encontraron jugadores.</div>;

  const handleTrack = async (player: any) => {
    setTrackingId(player.id);
    try {
      const res = await fetch("/api/test/track/add", {
        method: "POST",
        body: JSON.stringify({
          id: player.id,
          name: player.attributes.name
        })
      });
      if (res.ok) {
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTrackingId(null);
    }
  };

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
                
                <button 
                  onClick={() => handleTrack(p)}
                  disabled={trackingId === p.id}
                  style={{ 
                    marginTop: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '0.4rem 1rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {trackingId === p.id ? 'PROCESANDO...' : <><Plus size={12} color="var(--primary)" /> SEGUIR OBJETIVO</>}
                </button>
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

function DirectQueryResults({ data, onUpdate }: { data: any, onUpdate?: () => void }) {
    const [trackingName, setTrackingName] = useState<string | null>(null);

    if (!data.players) return <div className="premium-card">No se recibieron datos del servidor.</div>;

    const handleTrackDirect = async (playerName: string) => {
        setTrackingName(playerName);
        try {
            const res = await fetch("/api/test/track/add", {
                method: "POST",
                body: JSON.stringify({
                    name: playerName,
                    targetServerIp: `${data.server.ip}:${data.server.gamePort}`
                })
            });
            if (res.ok && onUpdate) onUpdate();
        } catch (e) {}
        finally { setTrackingName(null); }
    };

    return (
        <div className="premium-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                <div>
                    <div className="text-tech" style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>MODO HORUS // DIRECT QUERY</div>
                    <h2 style={{ fontSize: '1.8rem' }}>{data.server.ip}</h2>
                    <div style={{ display: 'flex', gap: '1rem', opacity: 0.6, fontSize: '0.8rem' }}>
                        <span>PORT: {data.server.gamePort}</span>
                        <span>QUERY: {data.server.queryPort}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>{data.playerCount}</div>
                    <div className="text-tech">JUGADORES DETECTADOS</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.players.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>Servidor vacío o lista de jugadores privada.</div>
                ) : (
                    data.players.map((p: any, idx: number) => (
                        <div key={idx} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.75rem 1rem', 
                            background: 'rgba(255,255,255,0.02)', 
                            borderRadius: '4px',
                            borderLeft: '2px solid var(--accent)'
                        }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>{p.name}</div>
                                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                                    <span style={{ opacity: 0.5 }}>SCORE: {p.score}</span>
                                    <span style={{ color: 'var(--accent)' }}>{Math.floor(p.duration / 60)}m conectado</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleTrackDirect(p.name)}
                                disabled={trackingName === p.name}
                                style={{
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                    color: 'var(--accent)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                    cursor: 'pointer'
                                }}
                            >
                                {trackingName === p.name ? '...' : 'RASTREAR'}
                            </button>
                        </div>
                    ))
                )}
            </div>
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
