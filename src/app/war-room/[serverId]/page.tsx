"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
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
  Shield,
  MessageSquare,
  X,
  Plus,
  LogOut,
  ExternalLink
} from "lucide-react";
import dynamic from "next/dynamic";
import { getItemName, getItemIcon } from "@/lib/data/items";

// CARGA DINÁMICA TOTAL (SSR: FALSE)
// Obligatorio para evitar errores de "window is not defined" y RangeError de fechas desincronizadas.
const RustMap = dynamic(() => import("@/components/map/RustMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#050505] flex items-center justify-center opacity-20">Cargando Mapa...</div>
});

const CommsModule = dynamic(() => import("@/components/war-room/CommsModule"), { 
  ssr: false,
  loading: () => <div className="p-8 opacity-10">Sincronizando Radio...</div>
});

const InviteManager = dynamic(() => import("@/components/war-room/InviteManager"), { ssr: false });
type MissionModule = "RADAR" | "CCTV" | "ECONOMY" | "ENERGY" | "COMMS";

export default function WarRoomPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;

  const [activeModule, setActiveModule] = useState<MissionModule>("RADAR");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !serverId) return;
    fetchInitialData();
    const interval = setInterval(refreshTacticalData, 5000);
    return () => clearInterval(interval);
  }, [serverId, mounted]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sRes, mRes] = await Promise.all([
        fetch(`/api/servers`),
        fetch(`/api/rustplus/map?serverId=${serverId}`)
      ]);
      
      const servers = await sRes.json();
      if (Array.isArray(servers)) {
        // Buscar por ID exacto de la URL (SteamID-IP) o fallback a IP pura por si es un registro antiguo
        const ipFromId = serverId.includes('-') ? serverId.split('-')[1] : serverId;
        const current = servers.find((s: any) => s.id === serverId || s.ip === serverId || s.ip === ipFromId);
        setServerInfo(current || null);
      } else {
        setServerInfo(null);
      }
      
      const mData = await mRes.json();
      
      // Saneamiento de datos de mapa
      if (mData && !mData.error) {
        setMapData(mData);
      } else {
        console.warn("Map data is invalid or contains error:", mData?.error);
        setMapData(null);
      }
      
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
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      
      if (data && !data.error) {
        // Fusionar marcadores de mapa normales con muertes del equipo
        const rawMarkers = Array.isArray(data.markers) ? data.markers : [];
        const deathMarkers = (Array.isArray(data.deaths) ? data.deaths : []).map((d: any) => ({ ...d, type: 'Death' }));
        
        setMarkers([...rawMarkers, ...deathMarkers]);
        setTeam(Array.isArray(data.team) ? data.team.filter(Boolean) : []);
        setIntel(Array.isArray(data.intel) ? data.intel.filter(Boolean) : []);

        // Extraer vending machines de forma segura
        const vms = rawMarkers.filter((m: any) => m && m.type === 3);
        const offers: any[] = [];

        vms.forEach((vm: any) => {
          if (!vm) return;
          const orders = vm.sellOrders || vm.sell_orders || vm.SellOrders || [];
          if (Array.isArray(orders)) {
            orders.forEach((order: any) => {
              if (!order) return;
              offers.push({
                machineName: vm.name || "Vending Desconocido",
                itemToSell: order.itemId || 0,
                amountToSell: order.quantity || 0,
                currencyReq: order.currencyId || 0,
                costPerItem: order.costPerItem || 0,
                amountInStock: order.amountInStock || 0,
                x: vm.x || 0,
                y: vm.y || 0
              });
            });
          }
        });
        setAllOffers(offers);
      }
    } catch (err) {
      console.error("Fallo crítico en pulso táctico:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredOffers = allOffers.filter(o => 
    getItemName(o.itemToSell).toLowerCase().includes(vendingQuery.toLowerCase()) ||
    o.machineName.toLowerCase().includes(vendingQuery.toLowerCase())
  ).sort((a, b) => a.costPerItem - b.costPerItem);

  if (!mounted || loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem' }}>
         <div className="premium-loader" style={{ fontFamily: 'var(--font-roboto)', fontWeight: 300, color: 'var(--primary)', fontSize: '1.2rem', letterSpacing: '0.1rem' }}>
            {!mounted ? "INICIALIZANDO BINARIOS..." : "ESTABLECIENDO CONEXIÓN SEGURA..."}
         </div>
         <RefreshCw size={32} className="animate-spin" color="var(--primary)" style={{ opacity: 0.5 }} />
      </div>
    );
  }

  if (!serverInfo) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '2rem', textAlign: 'center' }}>
         <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '2rem', borderRadius: '1rem', maxWidth: '400px' }}>
            <X size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>SERVIDOR NO ENCONTRADO</h1>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              No hemos podido localizar los registros tácticos de este servidor. Asegúrate de que el IP y el puerto sean correctos o re-vincula el bot.
            </p>
            <button 
              onClick={() => router.push('/dashboard')}
              style={{ background: '#1a1a1c', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
            >
              Volver al Dashboard
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="war-room-root" style={{ height: '100vh', width: '100vw', background: '#050505', color: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* TACTICAL TOP BAR - COMMAND CENTER STYLE */}
      <header style={{ 
        height: '70px',
        width: '100%',
        background: 'rgba(10, 10, 12, 0.95)',
        borderBottom: '1px solid rgba(232, 0, 28, 0.15)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
        zIndex: 1000,
        position: 'absolute',
        top: 0,
        left: 0,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => router.push('/dashboard')} className="icon-btn-simple" title="Abortar Misión">
            <ChevronLeft size={22} color="var(--primary)" />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.2em', marginBottom: '-2px' }}>TACTICAL COMMAND</span>
             <span style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', color: '#fff', textTransform: 'uppercase' }}>{serverInfo?.name}</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <NavBtn active={activeModule === "RADAR"} icon={<MapIcon size={18} />} label="RADAR INTEL" onClick={() => setActiveModule("RADAR")} />
          <NavBtn active={activeModule === "COMMS"} icon={<MessageSquare size={18} />} label="VHF COMMS" onClick={() => setActiveModule("COMMS")} />
          <NavBtn active={activeModule === "ECONOMY"} icon={<ShoppingCart size={18} />} label="QUARTERMASTER" onClick={() => setActiveModule("ECONOMY")} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="status-blink" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></div>
             <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 900, letterSpacing: '0.1em' }}>UPLINK ESTABLISHED</span>
          </div>
          
          <IconButton icon={<Share2 size={18} />} title="Gestión de Enlaces" onClick={() => setShowInviteModal(true)} highlight />
          
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            style={{ 
                background: 'transparent', 
                border: '1px solid rgba(239, 68, 68, 0.4)', 
                color: '#ef4444',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: '0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={16} /> DISCONNECT
          </button>
        </div>
      </header>


      <main style={{ width: '100%', height: '100%', display: 'flex' }}>
              {/* LEFT PANEL: ROSTER & ACTIVITY */}
        {activeModule === "RADAR" && (
          <aside style={{ 
            width: '350px', 
            borderRight: '1px solid rgba(232, 0, 28, 0.1)', 
            background: 'rgba(10, 10, 12, 0.98)', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            overflow: 'hidden',
            paddingTop: '70px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ padding: '2rem 1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h3 className="premium-title" style={{ fontSize: '1.1rem', color: '#fff' }}>FIELD OPERATIVES</h3>
                      <span className="text-tech" style={{ color: 'var(--primary)', fontWeight: 800 }}>SQUAD STATUS // ACTIVE</span>
                    </div>
                    <div style={{ background: 'rgba(232, 0, 28, 0.1)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(232, 0, 28, 0.2)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 900 }}>{team.length}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Array.isArray(team) && team.length > 0 ? team.map((m, idx) => (
                      m && m.steamId ? <MemberCard key={String(m.steamId)} member={m} /> : null
                    )) : (
                      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.1, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.2em' }}>SCANNING FOR SIGNALS...</div>
                    )}
                </div>
                </section>

                <section style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                      <Activity size={16} color="var(--primary)" />
                      <h3 className="premium-title" style={{ fontSize: '0.85rem', opacity: 0.8 }}>TACTICAL LOGS</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {!Array.isArray(intel) || intel.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.1, fontSize: '0.7rem', fontWeight: 900 }}>NO SIGNAL DETECTED</div>
                        ) : (
                        intel.map((log, i) => (
                           log ? <IntelItem key={log.id || `intel-${i}`} log={log} /> : null
                        ))
                        )}
                    </div>
                </section>
            </div>
          </aside>
        )}

        {/* CONTENT AREA */}
        <div style={{ flex: 1, position: 'relative' }}>
          
          {activeModule === "RADAR" && (
            <RustMap 
              mapJpg={mapData?.jpgImage} 
              mapSize={mapData?.mapSize || 4000} 
              width={mapData?.width}
              height={mapData?.height}
              oceanMargin={mapData?.margin ?? mapData?.oceanMargin ?? 0}
              monuments={mapData?.monuments}
              markers={markers}
              team={team}
              serverId={serverId}
            />
          )}

          {activeModule === "COMMS" && <CommsModule serverId={serverId} />}
          
          {activeModule === "ECONOMY" && (
            <div style={{ height: '100%', padding: '110px 3rem 3rem', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at top right, rgba(232, 0, 28, 0.03), transparent)' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1.5rem' }}>
                   <div>
                      <h2 style={{ fontSize: '2.8rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', margin: 0, letterSpacing: '-0.03em', color: 'var(--primary)' }}>QUARTERMASTER</h2>
                      <div className="text-tech" style={{ marginTop: '0.25rem' }}>SUPPLY CHAIN INTELLIGENCE // LIVE FEED</div>
                   </div>
                   <div style={{ position: 'relative' }}>
                      <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3, color: 'var(--primary)' }} />
                      <input 
                        type="text" 
                        placeholder="FILTER BY ITEM OR MERCHANT..." 
                        value={vendingQuery}
                        onChange={(e) => setVendingQuery(e.target.value)}
                        style={{ 
                          background: 'rgba(0,0,0,0.3)', 
                          border: '1px solid rgba(232, 0, 28, 0.2)', 
                          padding: '1rem 1.5rem 1rem 3.2rem', 
                          width: '400px', 
                          fontSize: '0.85rem', 
                          color: 'white', 
                          fontFamily: 'var(--font-mono)', 
                          borderRadius: '4px',
                          outline: 'none'
                        }}
                        className="search-input-premium"
                      />
                   </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(10, 10, 12, 0.5)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(5px)' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-barlow)' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#0a0a0b', zIndex: 5, borderBottom: '1px solid var(--primary)' }}>
                        <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                          <th style={{ padding: '1.25rem 2rem' }}>Unit Cost</th>
                          <th style={{ padding: '1.25rem 2rem' }}>Resource / Item</th>
                          <th style={{ padding: '1.25rem 2rem' }}>Availability</th>
                          <th style={{ padding: '1.25rem 2rem' }}>Merchant Identity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(filteredOffers) && filteredOffers.length > 0 ? (
                          filteredOffers.map((o, idx) => (
                            <tr key={`${o.itemToSell}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: '0.1s' }} className="table-row-premium">
                                  <td style={{ padding: '1.5rem 2rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                          <img src={getItemIcon(o.currencyReq)} style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt="" />
                                          <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{o.costPerItem}</span>
                                          <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 700 }}>{getItemName(o.currencyReq).toUpperCase()}</span>
                                      </div>
                                  </td>
                                  <td style={{ padding: '1.5rem 2rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                          <div style={{ position: 'relative' }}>
                                            <img src={getItemIcon(o.itemToSell)} style={{ width: '28px', height: '28px', objectFit: 'contain', zIndex: 2, position: 'relative' }} alt="" />
                                            <div style={{ position: 'absolute', inset: -5, background: 'rgba(232, 0, 28, 0.1)', filter: 'blur(8px)', borderRadius: '50%' }}></div>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{o.amountToSell}x {getItemName(o.itemToSell)}</span>
                                            <span style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 800 }}>ID: {o.itemToSell}</span>
                                          </div>
                                      </div>
                                  </td>
                                  <td style={{ padding: '1.5rem 2rem' }}>
                                      <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                      }}>
                                          <div style={{ height: '4px', width: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ 
                                              height: '100%', 
                                              width: `${Math.min(100, (o.amountInStock / 1000) * 100)}%`, 
                                              background: o.amountInStock === 0 ? 'var(--error)' : (o.amountInStock < 100 ? 'var(--warn)' : 'var(--accent)')
                                            }}></div>
                                          </div>
                                          <span style={{ 
                                            color: o.amountInStock === 0 ? 'var(--error)' : (o.amountInStock < 100 ? 'var(--warn)' : 'var(--accent)'),
                                            fontSize: '0.8rem',
                                            fontWeight: 900,
                                            fontFamily: 'var(--font-mono)'
                                          }}>
                                            {o.amountInStock === 0 ? "OUT OF STOCK" : `${o.amountInStock} UNITS`}
                                          </span>
                                      </div>
                                  </td>
                                  <td style={{ padding: '1.5rem 2rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em' }}>{(o.machineName || "UNKNOWN MERCHANT").toUpperCase()}</span>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>LOC: {o.x.toFixed(0)}, {o.y.toFixed(0)}</span>
                                    </div>
                                  </td>
                              </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ padding: '5rem', textAlign: 'center', opacity: 0.2, fontWeight: 900, letterSpacing: '0.5em', fontSize: '1.2rem' }}>
                              NO INTEL FOUND
                            </td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                </div>
            </div>
          )}


          {(activeModule === "CCTV") && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.2 }}>
               <Shield size={80} color="var(--primary)" style={{ marginBottom: '2rem' }} />
               <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Módulo en Desarrollo</h2>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {showInviteModal && (
        <div className="modal-backdrop">
           <div className="premium-modal">
              <button onClick={() => setShowInviteModal(false)} className="close-btn"><X size={24} /></button>
              <InviteManager serverId={serverId} />
           </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="modal-backdrop">
           <div className="premium-modal-sm">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>¿Cerrar Sesión?</h3>
              <p style={{ opacity: 0.5, marginBottom: '2rem' }}>Perderás el acceso inmediato al Radar Táctico de {serverInfo?.name}.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} className="btn-confirm-primary">Sí, Cerrar Sesión</button>
                  <button onClick={() => setShowLogoutConfirm(false)} className="btn-cancel">Cancelar</button>
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800&family=Roboto:wght@300;400;500;700&display=swap');

        .premium-title { font-family: var(--font-barlow), sans-serif; font-weight: 800; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .icon-btn-simple { background: transparent; border: none; color: #555; cursor: pointer; padding: 6px; transition: 0.1s; border-radius: 4px; }
        .icon-btn-simple:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .nav-btn { background: transparent; border: none; color: #666; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 1rem; border-radius: 6px; transition: 0.2s; font-weight: 600; font-size: 0.9rem; font-family: var(--font-barlow), sans-serif; }
        .nav-btn:hover { color: #aaa; background: rgba(255,255,255,0.03); }
        .nav-btn.active { color: #fff; background: rgba(255,255,255,0.1); }
        .icon-btn { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); color: #666; padding: 0.6rem; cursor: pointer; transition: 0.2s; border-radius: 8px; }
        .icon-btn:hover { color: #fff; border-color: rgba(255,255,255,0.2); background: rgba(0,0,0,0.8); }
        .icon-btn.highlight { color: var(--primary); border-color: rgba(232, 0, 28, 0.2); }
        
        .modal-backdrop { 
          position: fixed; 
          inset: 0; 
          z-index: 10000; 
          background: rgba(0,0,0,0.8); 
          backdrop-filter: blur(8px); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          padding: 2rem; 
        }
        .premium-modal { width: 100%; max-width: 900px; background: #050505; border: 1px solid rgba(255,255,255,0.1); position: relative; padding: 1rem; border-radius: 12px; }
        .premium-modal-sm { width: 100%; max-width: 400px; background: #080808; border: 1px solid rgba(255,255,255,0.1); position: relative; padding: 2rem; border-radius: 16px; text-align: center; }
        .close-btn { position: absolute; top: 1.5rem; right: 1.5rem; background: transparent; border: none; color: #444; cursor: pointer; transition: 0.2s; }
        .close-btn:hover { color: #fff; }

        .btn-confirm-primary { flex: 1; background: var(--primary); color: white; border: none; padding: 1rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .btn-cancel { flex: 1; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
        
        .table-row-premium:hover { background: rgba(255,255,255,0.02); }
        .premium-btn-action:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(88, 101, 242, 0.4); }
        
        .search-input-premium:focus { outline: none; border-color: var(--primary); background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}

function NavBtn({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`nav-btn ${active ? 'active' : ''}`}>
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
      background: isOnline ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', 
      padding: '1rem', 
      borderRadius: '4px',
      border: `1px solid ${isOnline ? (isAlive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)') : 'rgba(255,255,255,0.02)'}`,
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      opacity: isOnline ? 1 : 0.4,
      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    }} className="member-card-premium">
      {/* Indicador de vida/muerte lateral */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: isOnline ? (isAlive ? '#22c55e' : '#ef4444') : '#333' }}></div>
      
      <div style={{ 
        width: '42px', 
        height: '42px', 
        borderRadius: '4px', 
        background: '#000', 
        display: 'grid', 
        placeItems: 'center', 
        fontWeight: 900, 
        border: `1px solid ${isOnline ? (isAlive ? '#22c55e44' : '#ef444444') : '#222'}`,
        color: isOnline ? '#fff' : '#444',
        fontSize: '1.2rem',
        fontFamily: 'var(--font-barlow)'
      }}>
         {member.name?.charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
         <div style={{ fontSize: '0.95rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isOnline ? '#fff' : '#666', fontFamily: 'var(--font-barlow)' }}>
            {member.name}
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? (isAlive ? '#22c55e' : '#ef4444') : '#444', boxShadow: isOnline ? `0 0 8px ${isAlive ? '#22c55e' : '#ef4444'}` : 'none' }}></div>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: isOnline ? (isAlive ? '#22c55e' : '#ef4444') : '#555', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                {isOnline ? (isAlive ? "OPERATIONAL" : "K.I.A.") : "OFFLINE"}
            </span>
         </div>
      </div>
      
      {isOnline && isAlive && (
        <div className="text-tech" style={{ fontSize: '0.55rem', position: 'absolute', right: '0.5rem', top: '0.5rem', color: 'var(--primary)', opacity: 0.4 }}>
          TRK-7{Math.floor(Math.random() * 9)}
        </div>
      )}
    </div>
  );
}

function IntelItem({ log }: { log: any }) {
  const isDeath = log.type === 'DEATH' || log.type === 'RAID';
  const isEvent = log.type === 'EVENT';
  
  const formatTime = (ts: number) => {
    if (!ts) return "--:--";
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? "--:--" : d.toLocaleTimeString();
    } catch (e) { return "--:--"; }
  };

  return (
    <div style={{ 
      padding: '0.75rem 1rem', 
      background: 'rgba(255,255,255,0.01)',
      borderLeft: `2px solid ${isDeath ? '#ef4444' : (isEvent ? '#fbbf24' : '#333')}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      marginBottom: '2px'
    }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>[{formatTime(log.timestamp)}]</span>
          <span style={{ fontSize: '0.55rem', opacity: 0.3, fontWeight: 800 }}>TYPE: {log.type}</span>
       </div>
       <div style={{ 
          fontSize: '0.8rem', 
          color: isDeath ? '#ef4444' : (isEvent ? '#fbbf24' : '#aaa'), 
          fontWeight: isDeath || isEvent ? 700 : 400, 
          lineHeight: 1.4,
          fontFamily: isDeath ? 'var(--font-barlow)' : 'var(--font-main)'
       }}>
          {log.message?.toUpperCase()}
       </div>
    </div>
  );
}
