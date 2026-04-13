"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Map as MapIcon, Video, Settings, LogOut, Radio, Terminal, ShoppingCart, Calculator, Zap, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ 
        width: '280px', 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '2.5rem',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        position: 'sticky',
        top: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
          <div style={{ background: 'var(--primary)', padding: '2px' }}>
            <Radio color="white" size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Bebas Neue', letterSpacing: '0.05em' }}>RUST <span style={{ color: 'var(--primary)' }}>OPS</span></h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          <section>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--primary)', fontFamily: 'Bebas Neue' }}>SISTEMAS_LECTURA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <SidebarItem icon={<LayoutDashboard size={18} />} label="Mando Central" href="/dashboard" active={pathname === "/dashboard"} />
              <SidebarItem icon={<MapIcon size={18} />} label="Mapa Táctico" href="/dashboard/map" active={pathname === "/dashboard/map"} />
              <SidebarItem icon={<Video size={18} />} label="Vigilancia CCTV" href="/dashboard/cameras" active={pathname === "/dashboard/cameras"} />
            </div>
          </section>

          <section>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--primary)', fontFamily: 'Bebas Neue' }}>LOGÍSTICA_RED</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <SidebarItem icon={<Zap size={18} />} label="Red Eléctrica" href="/dashboard/energy" active={pathname === "/dashboard/energy"} />
              <SidebarItem icon={<ShoppingCart size={18} />} label="Economía Vending" href="/dashboard/vending" active={pathname === "/dashboard/vending"} />
              <SidebarItem icon={<Calculator size={18} />} label="Calculadora Raid" href="/dashboard/tools/raid" active={pathname === "/dashboard/tools/raid"} />
            </div>
          </section>

          <section>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--primary)', fontFamily: 'Bebas Neue' }}>COMUNICACIONES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <SidebarItem icon={<MessageSquare size={18} />} label="Chat de Equipo" href="/dashboard/chat" active={pathname === "/dashboard/chat"} />
            </div>
          </section>

          {isAdmin && (
            <section>
              <div style={{ fontSize: '0.65rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--primary)', fontFamily: 'Bebas Neue' }}>NIVEL_ADMIN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <SidebarItem icon={<ShieldCheck size={18} />} label="Consola de Mando" href="/dashboard/admin" active={pathname === "/dashboard/admin"} />
              </div>
            </section>
          )}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SidebarItem icon={<Settings size={18} />} label="Configuracin" href="/dashboard/settings" active={pathname === "/dashboard/settings"} />
          <SidebarItem icon={<Terminal size={18} />} label="Debugger" href="/dashboard/debug" active={pathname === "/dashboard/debug"} />
          <Link href="/api/auth/signout" className="sidebar-link" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '0.75rem 1rem', 
            color: '#ef4444', 
            textDecoration: 'none', 
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            <LogOut size={16} /> Terminar Sesin
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: 'linear-gradient(rgba(0,0,0,0.2) 0%, transparent 100%)' }}>
        {children}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, href, active = false }: { icon: React.ReactNode, label: string, href: string, active?: boolean }) {
  return (
    <Link href={href} className={active ? "active-card" : ""} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.6rem 1rem',
      color: active ? 'white' : 'var(--text-muted)',
      background: active ? 'rgba(205, 65, 43, 0.1)' : 'transparent',
      transition: 'var(--transition)',
      textDecoration: 'none',
      fontSize: '0.85rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      borderLeft: active ? '2px solid var(--primary)' : '2px solid transparent'
    }}>
      <span style={{ color: active ? 'var(--primary)' : 'inherit' }}>{icon}</span>
      {label}
    </Link>
  );
}
