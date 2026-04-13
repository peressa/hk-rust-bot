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
        width: '300px', 
        padding: '2rem 1rem', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '2.5rem',
        background: '#050505',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
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

        {/* User Footer */}
        <div style={{ 
            marginTop: 'auto', 
            background: 'rgba(255,255,255,0.02)', 
            padding: '1.25rem', 
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <div style={{ width: '32px', height: '32px', background: '#222', border: '1px solid var(--border)' }}>
                {session?.user?.image && <img src={session.user.image} style={{ width: '100%', height: '100%' }} />}
             </div>
             <div style={{ flex: 1, minWidth: 0 }}>
                 <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-barlow)', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session?.user?.name || "Invitado"}
                 </div>
                 <div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem' }}>Conectado</div>
             </div>
          </div>

          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.5rem 0.75rem', 
              color: '#ef4444', 
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-barlow)',
              textTransform: 'uppercase'
            }}>
              <LogOut size={16} /> Cerrar Sesión
          </button>
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
      padding: '0.75rem 1rem',
      color: active ? 'white' : 'rgba(255,255,255,0.4)',
      background: active ? 'rgba(206, 66, 43, 0.1)' : 'transparent',
      transition: 'all 0.1s ease-out',
      textDecoration: 'none',
      fontSize: '0.9rem',
      fontWeight: 600,
      fontFamily: 'var(--font-roboto)',
      borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
      position: 'relative'
    }}>
      <span style={{ color: active ? 'var(--primary)' : 'inherit', display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {active && <ChevronRight size={14} color="var(--primary)" />}
    </Link>
  );
}
