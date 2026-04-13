import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { 
  Shield, 
  Zap, 
  Map, 
  MessageSquare, 
  Activity, 
  Cctv, 
  Bell, 
  Lock,
  ChevronRight,
  Monitor,
  Smartphone,
  Server
} from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(getAuthOptions());

  // Si el usuario ya está logueado, mandarlo al dashboard directamente
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div style={{ background: 'var(--background)', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Navigation */}
      <nav style={{ 
        padding: '1.5rem 2rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 11, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield color="var(--primary)" size={32} />
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.05em' }}>HK SENTINEL</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Funciones</a>
          <a href="#pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Precios</a>
          <a href="/api/auth/signin" className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
            Acceso Clientes
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ 
        padding: '12rem 2rem 8rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 30%, rgba(205, 65, 43, 0.15) 0%, transparent 70%)'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: -1, 
          opacity: 0.4,
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}>
          <Image 
            src="/hero.png" 
            alt="Rust Sentinel Tactical Background" 
            fill 
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 1rem', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '50px',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--primary)'
        }}>
          <Zap size={14} fill="var(--primary)" /> LA ÚLTIMA VENTAJA TÁCTICA PARA RUST
        </div>

        <h1 style={{ 
          fontSize: 'clamp(3rem, 8vw, 5rem)', 
          lineHeight: 1, 
          fontWeight: 900, 
          maxWidth: '900px',
          margin: '0 auto 1.5rem',
          letterSpacing: '-0.04em'
        }}>
          Domina el <span style={{ color: 'var(--primary)' }}>Wipe</span> con Inteligencia Real
        </h1>

        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1.25rem', 
          maxWidth: '700px', 
          lineHeight: 1.6,
          marginBottom: '3rem'
        }}>
          HK Sentinel conecta tus servidores de Rust directamente con tu equipo. Radar estratégico, notificaciones de bajas y control de base unificado en una sola plataforma web.
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/api/auth/signin" className="btn-primary" style={{ padding: '1.2rem 2.5rem', fontSize: '1.1rem' }}>
            Empezar ahora <ChevronRight size={20} />
          </a>
          <a href="#features" className="btn-secondary" style={{ padding: '1.2rem 2.5rem', fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', textDecoration: 'none' }}>
            Ver Funciones
          </a>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" style={{ padding: '8rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Diseñado para Clanes <span style={{ color: 'var(--primary)' }}>Dominantes</span></h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>Todas las herramientas que necesitas para mantener la superioridad en el servidor sin estar conectado al juego.</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem'
        }}>
          <FeatureCard 
            icon={<Map size={32} color="var(--primary)" />}
            title="Mapa Táctico Web"
            desc="Visualiza la posición de tu equipo, monumentos y puntos de interés en tiempo real desde cualquier dispositivo."
          />
          <FeatureCard 
            icon={<MessageSquare size={32} color="var(--primary)" />}
            title="Notificaciones de Bajas"
            desc="Recibe alertas instantáneas en Discord cuando tú o miembros de tu clan sean derrotados, con coordenadas exactas."
          />
          <FeatureCard 
            icon={<Activity size={32} color="var(--primary)" />}
            title="Radar de Eventos"
            desc="Sé el primero en saber cuándo aparece el Barco, el Heli de Patrulla o el Chinook en el mapa."
          />
          <FeatureCard 
            icon={<Cctv size={32} color="var(--primary)" />}
            title="Seguridad CCTV"
            desc="Vigila tus cámaras y controla torretas de forma remota para defender tu base incluso estando offline."
          />
          <FeatureCard 
            icon={<Bell size={32} color="var(--primary)" />}
            title="Alarmas Inteligentes"
            desc="Configura alertas que notifican directamente a tu equipo en Discord ante cualquier intrusión detectada."
          />
          <FeatureCard 
            icon={<Lock size={32} color="var(--primary)" />}
            title="Centralizado y Seguro"
            desc="Una sola cuenta de Sentinel gestiona todos tus servidores. Seguridad por SteamID y Whitelist."
          />
        </div>
      </section>

      {/* Stats / Proof */}
      <section style={{ padding: '6rem 2rem', background: 'rgba(205, 65, 43, 0.03)', borderY: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'center' }}>
          <StatItem value="100ms" label="Latencia de Respuesta" />
          <StatItem value="24/7" label="Disponibilidad Bot" />
          <StatItem value="100%" label="Seguridad por Steam" />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '4rem' }}>Planes Sencillos</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start' }}>
          {/* Plan Pro */}
          <div className="premium-card" style={{ maxWidth: '380px', padding: '3rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Plan Táctico</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>$9.99 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ mes</span></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
              <li>✓ Radar de Eventos Globales</li>
              <li>✓ Notificaciones de Bajas</li>
              <li>✓ Mapa Tactico en Tiempo Real</li>
              <li>✓ Control CCTV y Switches</li>
              <li>✓ Soporte Discord Estándar</li>
            </ul>
            <a href="/api/auth/signin" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
              Comprar Ahora
            </a>
          </div>

          {/* Plan Lifetime */}
          <div className="premium-card" style={{ 
            maxWidth: '380px', 
            padding: '3rem', 
            textAlign: 'left', 
            border: '2px solid var(--primary)',
            transform: 'scale(1.05)',
            background: 'linear-gradient(165deg, rgba(205,65,43,0.05) 0%, transparent 100%)'
          }}>
            <div style={{ background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '0.7rem', padding: '0.2rem 1rem', borderRadius: '50px', display: 'inline-block', marginBottom: '1.5rem' }}>VALOR MÁXIMO</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Sentinel Vitalicio</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>$49.99 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>pago único</span></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li>✓ Todas las funciones incluidas</li>
              <li>✓ Acceso a futuras actualizaciones</li>
              <li>✓ Sin cuotas mensuales nunca</li>
              <li>✓ Rol VIP en Discord</li>
              <li>✓ Prioridad en la cola del Bot</li>
            </ul>
            <a href="/api/auth/signin" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
              Acceso Vitalicio
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '6rem 2rem 3rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <Shield color="var(--primary)" size={32} />
          <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>HK SENTINEL</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '3rem' }}>
          <Monitor color="var(--text-muted)" />
          <Smartphone color="var(--text-muted)" />
          <Server color="var(--text-muted)" />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          &copy; 2026 HK Sentinel - No afiliado oficialmente con Facepunch Studios.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="premium-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>{icon}</div>
      <h3 style={{ fontSize: '1.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', fontWeight: 900, color: 'white' }}>{value}</div>
      <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    </div>
  );
}
