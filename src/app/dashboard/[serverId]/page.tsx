"use client";

import React, { useEffect, useState, use } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  RefreshCw, 
  Map as MapIcon, 
  Users, 
  Radio, 
  Zap, 
  Shield, 
  Power,
  ChevronLeft,
  Settings
} from "lucide-react";
import Link from "next/link";
import TeamRoster from "@/components/dashboard/TeamRoster";
import IntelFeed from "@/components/dashboard/IntelFeed";
import RustMap from "@/components/map/RustMap";
import ServerHero from "@/components/dashboard/ServerHero";

export default function WarRoomPage({ params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = use(params);
  const [intel, setIntel] = useState<any>({ team: [], markers: [], intelLog: [] });
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverData, setServerData] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
    const intelInterval = setInterval(fetchIntel, 5000);
    const infoInterval = setInterval(fetchInfo, 15000);
    return () => {
      clearInterval(intelInterval);
      clearInterval(infoInterval);
    };
  }, [serverId]);

  const fetchInitialData = async () => {
    try {
      // Get server metadata
      const sRes = await fetch("/api/servers");
      const servers = await sRes.json();
      const current = servers.find((s: any) => s.id === serverId);
      setServerData(current);

      await Promise.all([fetchIntel(), fetchInfo(), fetchEntities()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIntel = async () => {
    try {
      const res = await fetch(`/api/rustplus/intel?serverId=${serverId}`);
      const data = await res.json();
      if (!data.error) setIntel(data);
    } catch (err) { console.error("Intel Poll Error", err); }
  };

  const fetchInfo = async () => {
    try {
      const res = await fetch(`/api/rustplus/info?serverId=${serverId}`);
      const data = await res.json();
      setServerInfo(data);
    } catch (err) { console.error("Info Poll Error", err); }
  };

  const fetchEntities = async () => {
    try {
      const res = await fetch(`/api/entities?serverId=${serverId}`);
      const data = await res.json();
      setEntities(data);
    } catch (err) { console.error("Entities Poll Error", err); }
  };

  const toggleEntity = async (entityId: string, currentValue: boolean) => {
    try {
      await fetch("/api/rustplus/command", {
        method: "POST",
        body: JSON.stringify({ serverId, entityId, value: !currentValue })
      });
      fetchEntities();
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
        <RefreshCw className="animate-spin" size={48} color="var(--primary)" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', gap: '1rem' }}>
        
        {/* Top Minimal Info Bar */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: '#050505', 
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
             <Link href="/dashboard" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 900 }}>
                <ChevronLeft size={16} /> VOLVER AL HUB
             </Link>
             <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}></div>
             <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', margin: 0, letterSpacing: '0.05em' }}>
                {serverData?.name} <span style={{ color: 'var(--primary)' }}>// WAR_ROOM</span>
             </h2>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
             <StatusItem label="POBLACIÓN" value={serverInfo ? `${serverInfo.players}/${serverInfo.maxPlayers}` : "---"} />
             <StatusItem label="EQUIPO" value={`${intel.team.filter((m: any) => m.isOnline).length}/${intel.team.length}`} />
             <Link href="/dashboard/settings" style={{ color: 'var(--text-muted)' }}><Settings size={18} /></Link>
          </div>
        </header>

        {/* Main 3-Column Tactical Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '1rem', flex: 1, minHeight: 0 }}>
          
          {/* Col 1: Team Roster */}
          <aside style={{ height: '100%', minHeight: 0 }}>
             <TeamRoster members={intel.team} />
          </aside>

          {/* Col 2: Tactical Map */}
          <main style={{ background: '#000', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
             <RustMap 
               serverId={serverId} 
               markers={[
                 ...intel.markers, 
                 ...intel.team.map((m: any) => ({ ...m, type: 'PLAYER' })),
                 ...(intel.intelLog.filter((l: any) => l.type === 'DEATH').map((l: any) => ({ ...l.data, type: 'DEATH' })))
               ]} 
             />
             
             {/* Map Overlay Info */}
             <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.8)', padding: '0.5rem 1rem', borderLeft: '3px solid var(--primary)', fontSize: '0.7rem', fontWeight: 900 }}>
                COORD_SISTEMA: {intel.team.find((m: any) => m.isOnline)?.grid || "ESTABLE"}
             </div>
          </main>

          {/* Col 3: Intel Feed */}
          <aside style={{ height: '100%', minHeight: 0 }}>
             <IntelFeed log={intel.intelLog} />
          </aside>

        </div>

        {/* Bottom Quick Controls Bar */}
        <footer style={{ 
          background: '#050505', 
          borderTop: '1px solid var(--border)', 
          padding: '0.75rem 1.5rem',
          display: 'flex',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
             Quick_Controls
          </div>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
            {entities.filter(e => e.entityType === 1 || e.name?.toLowerCase().includes("turret") || e.name?.toLowerCase().includes("sam")).map(device => (
               <button 
                 key={device.entityId}
                 onClick={() => toggleEntity(device.entityId, device.value)}
                 style={{ 
                   background: device.value ? 'rgba(206, 66, 43, 0.15)' : 'rgba(255,255,255,0.02)',
                   border: `1px solid ${device.value ? 'var(--primary)' : 'var(--border)'}`,
                   padding: '0.4rem 0.8rem',
                   color: device.value ? 'white' : '#666',
                   fontSize: '0.7rem',
                   fontWeight: 900,
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   cursor: 'pointer',
                   whiteSpace: 'nowrap',
                   transition: 'var(--transition)'
                 }}
               >
                 <Power size={12} color={device.value ? 'var(--primary)' : 'inherit'} />
                 {device.name.toUpperCase()}
               </button>
            ))}
            {entities.length === 0 && <span style={{ fontSize: '0.7rem', color: '#333' }}>SIN DISPOSITIVOS DE MISIÓN VINCULADOS</span>}
          </div>
        </footer>

      </div>
    </DashboardLayout>
  );
}

function StatusItem({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'Bebas Neue' }}>{value}</div>
    </div>
  );
}
