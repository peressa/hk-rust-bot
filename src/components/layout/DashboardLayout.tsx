"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Map as MapIcon, 
  Video, 
  Settings, 
  LogOut, 
  Radio, 
  Terminal, 
  ShoppingCart, 
  Calculator, 
  Zap, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import BrandLogo from "./BrandLogo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  // Determinar si estamos en modo "Inmersión Total" (War Room o Share)
  const isImmersive = pathname.startsWith('/war-room/') || pathname.startsWith('/share/');

  if (isImmersive) {
    return (
      <div className="dashboard-container immersive-mode" style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <main style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar - Official Rust Terminal Style */}
      <aside style={{ 
        width: '280px', 
        padding: '2rem 0', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #050505 0%, #0a0a0b 100%)',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '0 2rem', marginBottom: '3rem' }}>
          <BrandLogo size="md" />
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
          
          <div className="nav-group">
            <h4 style={{ 
                fontSize: '0.7rem', 
                color: 'var(--primary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1rem', 
                marginBottom: '1rem', 
                paddingLeft: '0.5rem',
                fontFamily: 'var(--font-barlow)',
                fontWeight: 700,
                opacity: 0.6
            }}>
                Operaciones
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <SidebarItem icon={<LayoutDashboard size={18} />} label="Centro de Mando" href="/dashboard" active={pathname === "/dashboard"} />
            </div>
          </div>

          <div className="nav-group">
            <h4 style={{ 
                fontSize: '0.7rem', 
                color: 'rgba(255,255,255,0.2)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1rem', 
                marginBottom: '1rem', 
                paddingLeft: '0.5rem',
                fontFamily: 'var(--font-barlow)',
                fontWeight: 700
            }}>
                Configuración
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <SidebarItem icon={<Settings size={18} />} label="Ajustes Globales" href="/dashboard/settings" active={pathname === "/dashboard/settings"} />
              <SidebarItem icon={<Terminal size={18} />} label="Debugger" href="/dashboard/debug" active={pathname === "/dashboard/debug"} />
            </div>
          </div>

          {isAdmin && (
            <div className="nav-group">
              <h4 style={{ 
                  fontSize: '0.7rem', 
                  color: '#fbbf24', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1rem', 
                  marginBottom: '1rem', 
                  paddingLeft: '0.5rem',
                  fontFamily: 'var(--font-barlow)',
                  fontWeight: 700
              }}>
                  Administración
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <SidebarItem icon={<ShieldCheck size={18} />} label="Consola de Mando" href="/dashboard/admin" active={pathname === "/dashboard/admin"} />
              </div>
            </div>
          )}
        </nav>

        {/* User Operator ID Card */}
        <div style={{ 
            marginTop: 'auto', 
            padding: '1.5rem', 
            borderTop: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(to bottom, transparent, rgba(206, 66, 43, 0.02))'
        }}>
          <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              padding: '1rem', 
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <div style={{ 
                   width: '36px', 
                   height: '36px', 
                   background: '#111', 
                   border: '1px solid var(--primary)',
                   padding: '2px',
                   boxShadow: '0 0 10px rgba(206, 66, 43, 0.2)'
               }}>
                  {session?.user?.image ? (
                    <img src={session.user.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <ShieldCheck size={18} />
                    </div>
                  )}
               </div>
               <div style={{ flex: 1, minWidth: 0 }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-barlow)', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>
                      {session?.user?.name || "Operador Desconocido"}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '4px', height: '4px', background: '#22c55e', borderRadius: '50%' }}></div>
                      <span style={{ fontSize: '0.6rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05rem' }}>Online</span>
                   </div>
               </div>
            </div>

            <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.5rem', 
                padding: '0.5rem', 
                color: 'rgba(239, 68, 68, 0.6)', 
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                cursor: 'pointer',
                fontSize: '0.65rem',
                fontWeight: 800,
                fontFamily: 'var(--font-barlow)',
                textTransform: 'uppercase',
                width: '100%',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444', e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)', e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)')}
            >
                <LogOut size={12} /> Desconectar Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        padding: '2.5rem', 
        overflowY: 'auto', 
        position: 'relative',
        background: 'radial-gradient(circle at top right, rgba(206, 66, 43, 0.05) 0%, transparent 40%)' 
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
           {children}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, href, active = false }: { icon: React.ReactNode, label: string, href: string, active?: boolean }) {
  return (
    <Link href={href} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.85rem 2rem',
      color: active ? 'white' : 'rgba(255,255,255,0.3)',
      background: active ? 'linear-gradient(to right, rgba(206, 66, 43, 0.08), transparent)' : 'transparent',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      textDecoration: 'none',
      fontSize: '0.85rem',
      fontWeight: active ? 700 : 500,
      fontFamily: 'var(--font-barlow)',
      borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseOver={(e) => !active && (e.currentTarget.style.color = 'rgba(255,255,255,0.7)', e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
    onMouseOut={(e) => !active && (e.currentTarget.style.color = 'rgba(255,255,255,0.3)', e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ 
          color: active ? 'var(--primary)' : 'inherit', 
          display: 'flex',
          filter: active ? 'drop-shadow(0 0 5px rgba(206, 66, 43, 0.5))' : 'none'
      }}>{icon}</span>
      <span style={{ flex: 1, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.75rem' }}>{label}</span>
      {active && <div style={{ width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary)' }}></div>}
    </Link>
  );
}
