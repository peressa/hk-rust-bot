"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Map as MapIcon, Video, Settings, LogOut, Radio, Terminal, ShoppingCart, Calculator, Zap } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ 
        width: '280px', 
        margin: '1rem', 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
          <Radio color="var(--primary)" size={32} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Rust Plus Web</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          <section>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '1rem' }}>Operativo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <SidebarItem icon={<LayoutDashboard size={20} />} label="Mando Central" href="/dashboard" active={pathname === "/dashboard"} />
              <SidebarItem icon={<MapIcon size={20} />} label="Mapa táctico" href="/dashboard/map" active={pathname === "/dashboard/map"} />
              <SidebarItem icon={<Video size={20} />} label="Vigilancia CCTV" href="/dashboard/cameras" active={pathname === "/dashboard/cameras"} />
            </div>
          </section>

          <section>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '1rem' }}>Logística</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <SidebarItem icon={<Zap size={20} />} label="Red Eléctrica" href="/dashboard/energy" active={pathname === "/dashboard/energy"} />
              <SidebarItem icon={<ShoppingCart size={20} />} label="Economía Vending" href="/dashboard/vending" active={pathname === "/dashboard/vending"} />
              <SidebarItem icon={<Calculator size={20} />} label="Calculadora Raid" href="/dashboard/tools/raid" active={pathname === "/dashboard/tools/raid"} />
            </div>
          </section>

          <section>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '1rem' }}>Comunicaciones</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <SidebarItem icon={<MessageSquare size={20} />} label="Chat de equipo" href="/dashboard/chat" active={pathname === "/dashboard/chat"} />
            </div>
          </section>
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SidebarItem icon={<Settings size={20} />} label="Configuración" href="/dashboard/settings" active={pathname === "/dashboard/settings"} />
          <SidebarItem icon={<Terminal size={20} />} label="Consola Debug" href="/dashboard/debug" active={pathname === "/dashboard/debug"} />
          <Link href="/api/auth/signout" className="sidebar-link" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', color: '#ef4444', textDecoration: 'none', fontSize: '0.9rem' }}>
            <LogOut size={18} /> Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, href, active = false }: { icon: React.ReactNode, label: string, href: string, active?: boolean }) {
  return (
    <Link href={href} className="sidebar-link" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      color: active ? 'white' : 'var(--text-muted)',
      background: active ? 'rgba(205, 65, 43, 0.15)' : 'transparent',
      transition: 'var(--transition)',
      textDecoration: 'none',
      fontWeight: 500
    }}>
      <span style={{ color: active ? 'var(--primary)' : 'inherit' }}>{icon}</span>
      {label}
    </Link>
  );
}
