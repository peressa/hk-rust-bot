"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Map as MapIcon, 
  Video, 
  Zap, 
  ShoppingCart, 
  Users, 
  Activity, 
  ChevronLeft,
  Settings,
  Share2,
  RefreshCw,
  Search,
  ShieldCheck,
  MessageSquare,
  X
} from "lucide-react";
import RustMap from "@/components/map/RustMap";
import CommsModule from "@/components/war-room/CommsModule";
import InviteManager from "@/components/war-room/InviteManager";
import { getItemName } from "@/lib/data/items";

type MissionModule = "RADAR" | "CCTV" | "ECONOMY" | "ENERGY" | "COMMS";

export default function WarRoomPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;

  const [activeModule, setActiveModule] = useState<MissionModule>("RADAR");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [intel, setIntel] = useState<any[]>([]);
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Vending Logic
  const [vendingQuery, setVendingQuery] = useState("");
  const [allOffers, setAllOffers] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(refreshTacticalData, 5000);
    return () => clearInterval(interval);
  }, [serverId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sRes, mRes] = await Promise.all([
        fetch(`/api/servers`),
        fetch(`/api/rustplus/map?serverId=${serverId}`)
      ]);
      
      const servers = await sRes.json();
      const current = servers.find((s: any) => s.id === serverId);
      setServerInfo(current);
      
      const mData = await mRes.json();
      setMapData(mData);
      
      await refreshTacticalData();
    } catch (err) {
      console.error("War room initialization failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshTacticalData = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/rustplus/markers?serverId=${serverId}`);
      const data = await res.json();
      
      setMarkers(data.markers || []);
      setTeam(data.team || []);
      setIntel(data.intel || []);

      const vms = (data.markers || []).filter((m: any) => m.type === 3 && (m.sellOrders || m.sell_orders));
      const offers: any[] = [];
      vms.forEach((vm: any) => {
        const orders = vm.sellOrders || vm.sell_orders || [];
        orders.forEach((order: any) => {
          offers.push({
            machineName: vm.name || "Vending Desconocido",
            itemToSell: order.itemId,
            amountToSell: order.quantity,
            currencyReq: order.currencyId,
            costPerItem: order.costPerItem,
            amountInStock: order.amountInStock,
            x: vm.x,
            y: vm.y
          });
        });
      });
      setAllOffers(offers);
    } catch (err) {
      console.error("Tactical pulse failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredOffers = allOffers.filter(o => 
    getItemName(o.itemToSell).toLowerCase().includes(vendingQuery.toLowerCase()) ||
    o.machineName.toLowerCase().includes(vendingQuery.toLowerCase())
  ).sort((a, b) => a.costPerItem - b.costPerItem);

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem' }}>
         <div className="terminal-loader" style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.2rem', color: 'var(--primary)', fontSize: '1.5rem' }}>
            CONECTANDO_A_TERMINAL_BATTLE_STATION...
         </div>
         <RefreshCw size={40} className="animate-spin" color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="war-room-root" style={{ height: '100vh', width: '100vw', background: '#050505', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      
      {/* TACTICAL FLOATING HEADER */}
      <header style={{ 
        position: 'absolute', 
        top: '1.5rem', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(5, 5, 5, 0.95)',
        padding: '0.5rem',
        border: '1px solid var(--border)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
      }}>
        <button onClick={() => router.push('/dashboard')} className="icon-btn-simple">
          <ChevronLeft size={18} />
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
        
        <NavBtn active={activeModule === "RADAR"} icon={<MapIcon size={18} />} label="RADAR" onClick={() => setActiveModule("RADAR")} />
        <NavBtn active={activeModule === "COMMS"} icon={<MessageSquare size={18} />} label="COMMS" onClick={() => setActiveModule("COMMS")} />
        <NavBtn active={activeModule === "ECONOMY"} icon={<ShoppingCart size={18} />} label="LOGIST" onClick={() => setActiveModule("ECONOMY")} />
        <NavBtn active={activeModule === "CCTV"} icon={<Video size={18} />} label="SURV" onClick={() => setActiveModule("CCTV")} />
        
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
        
        <div style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <span style={{ fontSize: '0.75rem', fontFamily: 'Bebas Neue', color: 'var(--primary)', letterSpacing: '0.1em' }}>{serverInfo?.name?.toUpperCase()}</span>
           <div className="status-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
        </div>
      </header>

      {/* QUICK COMMANDS - RIGHT */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <IconButton icon={<Share2 size={20} />} title="Gestión de Invitados" onClick={() => setShowInviteModal(true)} highlight />
        <IconButton icon={<RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />} title="Forzar Sincronización" onClick={refreshTacticalData} />
      </div>

      <main style={{ width: '100%', height: '100%', display: 'flex' }}>
        
        {/* LEFT PANEL: ROSTER & INTEL */}
        {activeModule === "RADAR" && (
          <aside style={{ width: '380px', borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', padding: '1.5rem', paddingTop: '6rem', overflow: 'hidden' }}>
            <section style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                <h3 className="section-title"><Users size={16} /> TEAM_ROSTER</h3>
                <span style={{ fontSize: '0.6rem', color: '#444' }}>{team.length}_OPERATIVES</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {team.map((m) => (
                  <MemberCard key={m.steamId} member={m} />
                ))}
              </div>
            </section>

            <section style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
              <h3 className="section-title" style={{ color: '#555' }}><Activity size={16} /> TACTICAL_FEED</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {intel.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.2, fontSize: '0.7rem' }}>NO_INTELLIGENCE_REPORTED</div>
                ) : (
                  intel.map((log, i) => <IntelItem key={i} log={log} />)
                )}
              </div>
            </section>
          </aside>
        )}

        {/* WORKSPACE AREA */}
        <div style={{ flex: 1, position: 'relative' }}>
          
          {activeModule === "RADAR" && (
            <RustMap 
              mapJpg={mapData?.jpgImage} 
              mapSize={mapData?.width} 
              oceanMargin={mapData?.oceanMargin}
              monuments={mapData?.monuments}
              markers={markers}
              serverId={serverId}
            />
          )}

          {activeModule === "COMMS" && <CommsModule serverId={serverId} />}
          
          {activeModule === "ECONOMY" && (
            <div style={{ height: '100%', padding: '8rem 4rem 4rem', display: 'flex', flexDirection: 'column' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                   <div>
                      <h2 style={{ fontSize: '4rem', fontFamily: 'Bebas Neue', lineHeight: 1 }}>ANALIZADOR_BIENES</h2>
                      <div style={{ color: 'var(--primary)', letterSpacing: '0.3rem', fontSize: '0.75rem' }}>ECONOMÍA_DE_GUERRA_V3</div>
                   </div>
                   <div style={{ position: 'relative' }}>
                      <Search size={22} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                      <input 
                        type="text" 
                        placeholder="BUSCAR ÍTEM O TIENDA..." 
                        value={vendingQuery}
                        onChange={(e) => setVendingQuery(e.target.value)}
                        style={{ background: '#080808', border: '1px solid var(--border)', padding: '1.25rem 1.25rem 1.25rem 3.5rem', width: '450px', fontSize: '1.2rem', fontFamily: 'Bebas Neue', color: 'white' }}
                      />
                   </div>
                </header>

                <div className="premium-card" style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.5)', padding: 0 }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#050505', zIndex: 5, borderBottom: '2px solid var(--border)' }}>
                        <tr style={{ textAlign: 'left', fontSize: '0.8rem', opacity: 0.6, fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}>
                          <th style={{ padding: '1.5rem' }}>PRECIO_VENTA</th>
                          <th style={{ padding: '1.5rem' }}>ARTÍCULO</th>
                          <th style={{ padding: '1.5rem' }}>SUMINISTRO</th>
                          <th style={{ padding: '1.5rem' }}>IDENTIFICADOR_VENDEDOR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOffers.map((o, idx) => (
                           <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: '0.1s' }}>
                              <td style={{ padding: '1.25rem' }}>
                                 <span style={{ color: '#eab308', fontWeight: 900 }}>{o.costPerItem}x</span> {getItemName(o.currencyReq)}
                              </td>
                              <td style={{ padding: '1.25rem' }}>
                                 <span style={{ color: '#3b82f6', fontWeight: 900 }}>{o.amountToSell}x</span> {getItemName(o.itemToSell)}
                              </td>
                              <td style={{ padding: '1.25rem' }}>
                                 <div style={{ 
                                   background: o.amountInStock === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                   color: o.amountInStock === 0 ? '#ef4444' : '#22c55e',
                                   padding: '4px 10px',
                                   display: 'inline-block',
                                   fontFamily: 'Bebas Neue'
                                 }}>
                                    {o.amountInStock} PCS
                                 </div>
                              </td>
                              <td style={{ padding: '1.25rem', opacity: 0.4, fontSize: '0.75rem' }}>{o.machineName?.toUpperCase()}</td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
            </div>
          )}

          {(activeModule === "CCTV" || activeModule === "ENERGY") && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
               <ShieldCheck size={80} color="var(--primary)" style={{ opacity: 0.1, marginBottom: '2rem' }} />
               <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '3rem', opacity: 0.1 }}>MÓDULO_OFFLINE</h2>
            </div>
          )}
        </div>
      </main>

      {/* INVITE MANAGER MODAL */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
           <div style={{ width: '100%', maxWidth: '900px', background: '#050505', border: '1px solid var(--border)', position: 'relative' }}>
              <button 
                onClick={() => setShowInviteModal(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}
              >
                <X size={32} />
              </button>
              <InviteManager serverId={serverId} />
           </div>
        </div>
      )}

      <style jsx global>{`
        .section-title { font-family: 'Bebas Neue'; letter-spacing: 0.2em; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; margin: 0; }
        .icon-btn-simple { background: transparent; border: none; color: #555; cursor: pointer; padding: 4px; transition: 0.1s; }
        .icon-btn-simple:hover { color: #fff; }
        .nav-btn { background: transparent; border: none; color: #444; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 1rem; border-radius: 4px; transition: 0.1s; }
        .nav-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .nav-btn.active { color: #fff; background: var(--primary); }
        .icon-btn { background: rgba(5,5,5,0.8); border: 1px solid var(--border); color: #444; padding: 0.75rem; cursor: pointer; transition: 0.1s; }
        .icon-btn:hover { color: #fff; border-color: #fff; }
        .icon-btn.highlight { color: var(--primary); border-color: var(--primary); }
      `}</style>
    </div>
  );
}

function NavBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`nav-btn ${active ? 'active' : ''}`} style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em', fontSize: '1rem' }}>
      {icon} {label}
    </button>
  );
}

function IconButton({ icon, title, onClick, highlight = false }: any) {
  return (
    <button onClick={onClick} title={title} className={`icon-btn ${highlight ? 'highlight' : ''}`}>
      {icon}
    </button>
  );
}

function MemberCard({ member }: { member: any }) {
  const isOnline = member.isOnline;
  const isAlive = member.isAlive;
  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      padding: '0.8rem', 
      borderLeft: `3px solid ${isOnline ? (isAlive ? '#22c55e' : '#ef4444') : '#222'}`,
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      opacity: isOnline ? 1 : 0.4
    }}>
      <div style={{ width: '32px', height: '32px', background: '#111', fontSize: '0.8rem', display: 'grid', placeItems: 'center', fontWeight: 900 }}>
         {member.name?.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
         <div style={{ fontSize: '0.85rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name?.toUpperCase()}</div>
         <div style={{ fontSize: '0.6rem', fontWeight: 900, color: isOnline ? (isAlive ? '#22c55e' : '#ef4444') : '#444' }}>
            {isOnline ? (isAlive ? "OPERATIVO_ESTABLE" : "OPERATIVO_K.I.A") : "FUERA_DE_RED"}
         </div>
      </div>
    </div>
  );
}

function IntelItem({ log }: { log: any }) {
  const isDeath = log.type === 'DEATH';
  const isEvent = log.type === 'EVENT';
  return (
    <div style={{ borderLeft: `1px solid ${isDeath ? '#ef4444' : (isEvent ? '#eab308' : '#222')}`, paddingLeft: '1rem', paddingBottom: '0.2rem' }}>
       <div style={{ fontSize: '0.6rem', color: '#444', marginBottom: '0.2rem' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</div>
       <div style={{ fontSize: '0.75rem', color: isDeath ? '#ef4444' : (isEvent ? '#eab308' : '#aaa'), fontWeight: isDeath || isEvent ? 900 : 400 }}>
          {log.message?.toUpperCase()}
       </div>
    </div>
  );
}
