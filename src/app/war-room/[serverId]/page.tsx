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
  ShieldCheck,
  MessageSquare,
  X,
  Plus,
  LogOut,
  ExternalLink
} from "lucide-react";
import RustMap from "@/components/map/RustMap";
import CommsModule from "@/components/war-room/CommsModule";
import InviteManager from "@/components/war-room/InviteManager";
import { getItemName, getItemIcon } from "@/lib/data/items";

type MissionModule = "RADAR" | "CCTV" | "ECONOMY" | "ENERGY" | "COMMS" | "DISCORD";

export default function WarRoomPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;

  const [activeModule, setActiveModule] = useState<MissionModule>("RADAR");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
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

      const vms = (data.markers || []).filter((m: any) => m.type === 3);
      const offers: any[] = [];
      vms.forEach((vm: any) => {
        const orders = vm.sellOrders || vm.sell_orders || [];
        orders.forEach((order: any) => {
          offers.push({
            machineName: vm.name || "Vending Desconocido",
            itemToSell: order.itemId || order.item_id,
            amountToSell: order.quantity || order.amount,
            currencyReq: order.currencyId || order.currency_id,
            costPerItem: order.costPerItem || order.cost_per_item,
            amountInStock: order.amountInStock || order.amount_in_stock,
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
      <div style={{ height: '100vh', width: '100vw', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem' }}>
         <div className="premium-loader" style={{ fontFamily: 'var(--font-roboto)', fontWeight: 300, color: 'var(--primary)', fontSize: '1.2rem', letterSpacing: '0.1rem' }}>
            Estableciendo conexión segura...
         </div>
         <RefreshCw size={32} className="animate-spin" color="var(--primary)" style={{ opacity: 0.5 }} />
      </div>
    );
  }

  return (
    <div className="war-room-root" style={{ height: '100vh', width: '100vw', background: '#050505', color: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* TACTICAL TOP BAR - INTEGRATED */}
      <header style={{ 
        height: '64px',
        width: '100%',
        background: '#080808',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        zIndex: 1000,
        position: 'absolute',
        top: 0,
        left: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard')} className="icon-btn-simple" title="Volver al Panel">
            <ChevronLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '0.5rem' }}>
             <span style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{serverInfo?.name}</span>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                <div className="status-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
                <span style={{ fontSize: '0.6rem', color: '#22c55e', fontWeight: 800 }}>LIVE</span>
             </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <NavBtn active={activeModule === "RADAR"} icon={<MapIcon size={16} />} label="Radar" onClick={() => setActiveModule("RADAR")} />
          <NavBtn active={activeModule === "COMMS"} icon={<MessageSquare size={16} />} label="Comunicaciones" onClick={() => setActiveModule("COMMS")} />
          <NavBtn active={activeModule === "ECONOMY"} icon={<ShoppingCart size={16} />} label="Logística" onClick={() => setActiveModule("ECONOMY")} />
          <NavBtn active={activeModule === "DISCORD"} icon={<Plus size={16} />} label="Discord" onClick={() => setActiveModule("DISCORD")} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <IconButton icon={<Share2 size={16} />} title="Invitados" onClick={() => setShowInviteModal(true)} highlight />
          <IconButton icon={<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />} title="Sincronizar" onClick={refreshTacticalData} />
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.05)', margin: '0 0.5rem' }}></div>
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                color: '#ef4444',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}
          >
            <LogOut size={14} /> SALIR
          </button>
        </div>
      </header>


      <main style={{ width: '100%', height: '100%', display: 'flex' }}>
              {/* LEFT PANEL: ROSTER & ACTIVITY */}
        {activeModule === "RADAR" && (
          <aside style={{ 
            width: '320px', 
            borderRight: '1px solid rgba(255,255,255,0.05)', 
            background: '#0a0a0b', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            overflow: 'hidden',
            paddingTop: '64px'
          }}>
            <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                    <h3 className="premium-title" style={{ fontSize: '1rem' }}>Operativos</h3>
                    <span style={{ fontSize: '0.6rem', color: '#444', fontWeight: 800, textTransform: 'uppercase' }}>{team.length} Activos</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {team.map((m) => (
                    <MemberCard key={m.steamId} member={m} />
                    ))}
                </div>
                </section>

                <section style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '1.5rem' }}>
                    <h3 className="premium-title" style={{ opacity: 0.4, fontSize: '0.8rem' }}>Inteligencia en Vivo</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                        {intel.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.1, fontSize: '0.7rem', fontWeight: 700 }}>SIN DATOS REPORTADOS</div>
                        ) : (
                        intel.map((log, i) => <IntelItem key={i} log={log} />)
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
              oceanMargin={mapData?.oceanMargin}
              monuments={mapData?.monuments}
              markers={markers}
              serverId={serverId}
            />
          )}

          {activeModule === "COMMS" && <CommsModule serverId={serverId} />}
          
          {activeModule === "ECONOMY" && (
            <div style={{ height: '100%', padding: '100px 40px 40px', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at top right, rgba(206, 66, 43, 0.05), transparent)' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                   <div>
                      <h2 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', margin: 0, letterSpacing: '-0.02em' }}>Logística de <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>Mercado</em></h2>
                      <div style={{ opacity: 0.3, textTransform: 'uppercase', letterSpacing: '0.15rem', fontSize: '0.6rem', fontWeight: 800, marginTop: '0.25rem' }}>Ecosistema de Economía Táctica v3</div>
                   </div>
                   <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                      <input 
                        type="text" 
                        placeholder="BUSCAR ARTÍCULO O TIENDA..." 
                        value={vendingQuery}
                        onChange={(e) => setVendingQuery(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 1rem 0.75rem 2.8rem', width: '350px', fontSize: '0.8rem', color: 'white', transition: '0.2s', fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
                        className="search-input-premium"
                      />
                   </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                       <thead style={{ position: 'sticky', top: 0, background: '#0a0a0b', zIndex: 5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <tr style={{ textAlign: 'left', fontSize: '0.6rem', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1rem', fontFamily: 'var(--font-barlow)' }}>
                          <th style={{ padding: '1rem 1.5rem' }}>Precio Venta</th>
                          <th style={{ padding: '1rem 1.5rem' }}>Artículo</th>
                          <th style={{ padding: '1rem 1.5rem' }}>Suministro</th>
                          <th style={{ padding: '1rem 1.5rem' }}>Vendedor / Ubicación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOffers.map((o, idx) => (
                           <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-premium">
                              <td style={{ padding: '1.25rem' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <img src={getItemIcon(o.currencyReq)} style={{ width: '20px', height: '20px', objectFit: 'contain' }} alt="" />
                                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>{o.costPerItem}x</span> {getItemName(o.currencyReq)}
                                 </div>
                              </td>
                              <td style={{ padding: '1.25rem' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <img src={getItemIcon(o.itemToSell)} style={{ width: '24px', height: '24px', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(96, 165, 250, 0.4))' }} alt="" />
                                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>{o.amountToSell}x</span> {getItemName(o.itemToSell)}
                                 </div>
                              </td>
                              <td style={{ padding: '1.25rem' }}>
                                 <div style={{ 
                                   background: o.amountInStock === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                   color: o.amountInStock === 0 ? '#ef4444' : '#22c55e',
                                   padding: '4px 12px',
                                   borderRadius: '4px',
                                   display: 'inline-block',
                                   fontSize: '0.75rem',
                                   fontWeight: 700
                                 }}>
                                    {o.amountInStock} UNID
                                 </div>
                              </td>
                               <td style={{ padding: '0.75rem 1.5rem', opacity: 0.3, fontSize: '0.7rem', fontWeight: 600 }}>{o.machineName.toUpperCase()}</td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
            </div>
          )}

          {activeModule === "DISCORD" && (
            <div style={{ height: '100%', padding: '8rem 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px' }}>
                    <div style={{ background: 'rgba(88, 101, 242, 0.1)', padding: '2rem', borderRadius: '50%', width: 'fit-content', margin: '0 auto 2rem' }}>
                        <Plus size={64} color="#5865F2" />
                    </div>
                    <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Integración con Discord</h2>
                    <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '3rem' }}>Conecta RUST OPS con tu servidor de Discord para recibir alertas de muertes, eventos globales y alarmas inteligentes en tiempo real.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Alertas Tácticas</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>Notificaciones de RAID y eventos globales.</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Estado del Clan</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>Logs de muertes y estatus operativo.</div>
                        </div>
                    </div>

                    <a 
                      href="https://discord.com/oauth2/authorize?client_id=1130541740924764261&permissions=8&scope=bot%20applications.commands" 
                      target="_blank"
                      className="premium-btn-action"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', background: '#5865F2', color: 'white', padding: '1.2rem 2.5rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none', transition: '0.2s' }}
                    >
                        Invitar Bot al Servidor <ExternalLink size={20} />
                    </a>
                </div>
            </div>
          )}

          {(activeModule === "CCTV") && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.2 }}>
               <ShieldCheck size={80} color="var(--primary)" style={{ marginBottom: '2rem' }} />
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
        
        .modal-backdrop { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; alignItems: center; justifyContent: center; padding: 2rem; }
        .premium-modal { width: 100%; maxWidth: 900px; background: #050505; border: 1px solid rgba(255,255,255,0.1); position: relative; padding: 1rem; border-radius: 12px; }
        .premium-modal-sm { width: 100%; maxWidth: 400px; background: #080808; border: 1px solid rgba(255,255,255,0.1); position: relative; padding: 2rem; border-radius: 16px; text-align: center; }
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
      background: 'rgba(255,255,255,0.02)', 
      padding: '0.8rem 1rem', 
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.03)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      opacity: isOnline ? 1 : 0.3,
      transition: '0.2s'
    }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isOnline ? 'rgba(255,255,255,0.05)' : '#000', fontSize: '0.9rem', display: 'grid', placeItems: 'center', fontWeight: 600, border: isOnline ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}>
         {member.name?.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
         <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
         <div style={{ fontSize: '0.65rem', fontWeight: 600, color: isOnline ? (isAlive ? '#22c55e' : '#ef4444') : '#555', letterSpacing: '0.05rem', textTransform: 'uppercase' }}>
            {isOnline ? (isAlive ? "Operativo" : "Abatido") : "Desconectado"}
         </div>
      </div>
    </div>
  );
}

function IntelItem({ log }: { log: any }) {
  const isDeath = log.type === 'DEATH';
  const isEvent = log.type === 'EVENT';
  return (
    <div style={{ 
      borderLeft: `2px solid ${isDeath ? '#ef4444' : (isEvent ? '#fbbf24' : '#222')}`, 
      paddingLeft: '1.25rem', 
      background: 'linear-gradient(to right, rgba(255,255,255,0.01), transparent)',
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem'
    }}>
       <div style={{ fontSize: '0.6rem', color: '#555', marginBottom: '0.3rem', fontWeight: 700 }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
       <div style={{ fontSize: '0.85rem', color: isDeath ? '#ef4444' : (isEvent ? '#fbbf24' : '#ccc'), fontWeight: isDeath || isEvent ? 600 : 400, lineHeight: 1.4 }}>
          {log.message}
       </div>
    </div>
  );
}
