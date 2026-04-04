"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Zap, Battery, BatteryLow, Power, Lightbulb, ShieldAlert, RefreshCw, Layers } from "lucide-react";

export default function EnergyPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
        fetchEntities(selectedServer.id);
    }
  }, [selectedServer?.id]);

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      setServers(data);
      if (data.length > 0 && !selectedServer) setSelectedServer(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async (serverId: string, sync = false) => {
    if (sync) setSyncing(true);
    try {
      const res = await fetch(`/api/entities?serverId=${serverId}${sync ? '&sync=true' : ''}`);
      const data = await res.json();
      setEntities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const toggleEntity = async (entityId: string, currentValue: boolean) => {
    if (!selectedServer) return;
    try {
      await fetch("/api/rustplus/command", {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer.id,
          entityId: entityId,
          value: !currentValue
        })
      });
      fetchEntities(selectedServer.id);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGroup = async (type: string, value: boolean) => {
    if (!selectedServer) return;
    const targetIds = entities
        .filter(e => {
            const name = e.name?.toLowerCase() || "";
            if (type === "luces") return name.includes("luz") || name.includes("light");
            if (type === "defensa") return name.includes("torreta") || name.includes("turret") || name.includes("sam");
            return false;
        })
        .map(e => e.entityId);

    if (targetIds.length === 0) return;

    setSyncing(true);
    try {
        await Promise.all(targetIds.map(id => 
            fetch("/api/rustplus/command", {
                method: "POST",
                body: JSON.stringify({ serverId: selectedServer.id, entityId: id, value })
            })
        ));
        fetchEntities(selectedServer.id);
    } finally {
        setSyncing(false);
    }
  };

  const batteries = entities.filter(e => e.hasCapacity || (e.name?.toLowerCase().includes("bateri") || e.name?.toLowerCase().includes("battery")));
  const switches = entities.filter(e => (e.name?.toLowerCase().includes("switch") || e.name?.toLowerCase().includes("interp")) && !batteries.some(b => b.entityId === e.entityId));
  
  const totalCapacity = batteries.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
  const avgCharge = batteries.length > 0 ? (totalCapacity / batteries.length) : 0;

  if (loading) return <DashboardLayout><div style={{ display: 'grid', placeItems: 'center', height: '80vh' }}><RefreshCw className="animate-spin" size={40} color="var(--primary)" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Zap color="var(--primary)" className="glow" /> Red Eléctrica
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Sincronización de carga y automatización en tiempo real.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,180,0,0.05)', borderRadius: '8px', border: '1px solid rgba(255,180,0,0.1)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Battery color="#fbbf24" size={14} />
               <span style={{ color: '#fbbf24', fontWeight: 700 }}>RESERVA: {Math.round(avgCharge)}%</span>
            </div>
            <select 
              value={selectedServer?.id} 
              onChange={(e) => setSelectedServer(servers.find(s => s.id === e.target.value))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white' }}
            >
              {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="btn-secondary" onClick={() => selectedServer && fetchEntities(selectedServer.id, true)} disabled={syncing}>
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} /> Sincronizar
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="premium-card" style={{ background: 'linear-gradient(135deg, rgba(205,65,43,0.1), transparent)', borderTop: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Capacidad de Red</h3>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>
                    {Math.round(avgCharge)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>% DISPONIBLE</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${avgCharge}%`, height: '100%', background: avgCharge > 20 ? 'var(--primary)' : '#ef4444', boxShadow: `0 0 15px ${avgCharge > 20 ? 'var(--primary)' : '#ef4444'}` }}></div>
                </div>
            </div>

            <div className="premium-card" style={{ borderTop: '4px solid #22c55e' }}>
                <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={16} color="#22c55e" /> Operaciones Maestras
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => toggleGroup("luces", true)} className="btn-secondary">ENCENDER LUCES</button>
                    <button onClick={() => toggleGroup("luces", false)} className="btn-secondary" style={{ opacity: 0.6 }}>APAGAR LUCES</button>
                    <button onClick={() => toggleGroup("defensa", true)} className="btn-primary">ACTIVAR DEFENSAS</button>
                    <button onClick={() => toggleGroup("defensa", false)} className="btn-secondary" style={{ color: '#ef4444' }}>DEFENSAS OFF</button>
                </div>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '2rem' }}>
            <section>
                <h2 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Bancos de Almacenamiento</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {batteries.map(bat => (
                        <div key={bat.entityId} className="premium-card" style={{ padding: '1.5rem', border: bat.capacity < 15 ? '1px solid #ef4444' : '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h4 style={{ fontWeight: 700 }}>{bat.name}</h4>
                                <span style={{ fontWeight: 800, color: bat.capacity < 20 ? '#ef4444' : 'white' }}>{Math.round(bat.capacity || 0)}%</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                <div style={{ width: `${bat.capacity || 0}%`, height: '100%', background: bat.capacity < 20 ? '#ef4444' : 'var(--primary)' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            <aside>
                <h2 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Matriz de Interruptores</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {switches.map(sw => (
                        <div key={sw.entityId} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.15rem 1.5rem', borderLeft: sw.value ? '4px solid var(--primary)' : '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{sw.name}</span>
                            <label className="switch">
                                <input type="checkbox" checked={sw.value} onChange={() => toggleEntity(sw.entityId, sw.value)} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    ))}
                </div>
            </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
