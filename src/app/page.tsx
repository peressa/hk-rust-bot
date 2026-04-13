import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { 
  ShieldAlert, 
  Terminal, 
  Map as MapIcon, 
  Crosshair, 
  Radio, 
  Activity, 
  Lock,
  ChevronRight,
  Wifi,
  Zap,
  HardDrive
} from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(getAuthOptions());

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Tactical Header */}
      <nav style={{ 
        padding: '1rem 2rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(8, 8, 8, 0.95)',
        borderBottom: '2px solid rgba(255,255,255,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', padding: '4px', display: 'flex' }}>
            <Radio color="white" size={24} />
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 400, fontFamily: 'Bebas Neue', letterSpacing: '0.05em' }}>HK // SENTINEL-PROTOCOL</span>
        </div>
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
          <a href="#system" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Sistema</a>
          <a href="#access" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Licencias</a>
          <Link href="/api/auth/signin" className="btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}>
            INGRESAR AL TERMINAL
          </Link>
        </div>
      </nav>

      {/* Hero: Industrial Command Center */}
      <header style={{ 
        padding: '10rem 2rem 6rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: '90vh',
        justifyContent: 'center'
      }}>
        {/* Background Overlay */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: -1, 
          opacity: 0.5
        }}>
          <Image 
            src="/hero_industrial.png" 
            alt="Rust Sentinel Tactical Background" 
            fill 
            style={{ objectFit: 'cover' }}
            priority
          />
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(to bottom, transparent 0%, var(--background) 95%)' 
          }}></div>
        </div>

        <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
          <div className="text-stamped" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
            ESTADO DEL SISTEMA: OPERATIVO // VERSIN 4.2.0
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(4rem, 10vw, 7rem)', 
            lineHeight: 0.85, 
            marginBottom: '1.5rem',
            color: 'white'
          }}>
            VIGILANCIA <br/> <span style={{ color: 'var(--primary)' }}>TOTAL</span>
          </h1>

          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '1.1rem', 
            maxWidth: '600px', 
            margin: '0 auto 3rem',
            lineHeight: 1.5,
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            La ventaja estratǸgica definitiva para supervivientes. 
            Conecta tu clan a una red de inteligencia en tiempo real.
          </p>

          <div style={{ display: 'flex', gap: '1px', background: 'rgba(255,255,255,0.05)', padding: '1px' }}>
            <Link href="/api/auth/signin" className="btn-primary" style={{ padding: '1.2rem 3rem' }}>
              RECLAMAR ACCESO <ChevronRight size={20} />
            </Link>
            <a href="#system" className="btn-secondary" style={{ padding: '1.2rem 3rem' }}>
              DOCUMENTACIN
            </a>
          </div>
        </div>
      </header>

      {/* Modules Grid */}
      <section id="system" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '2rem', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Mdulos de Inteligencia</h2>
          <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Integracin directa con servidores Facepunch</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '1.5rem'
        }}>
          <SystemModule 
            id="MOD-01"
            icon={<MapIcon size={24} />}
            title="Radar de Posicionamiento"
            desc="Triangulacin de aliados y objetivos en tiempo real sobre cartografa oficial."
          />
          <SystemModule 
            id="MOD-02"
            icon={<ShieldAlert size={24} />}
            title="Protocolo de Bajas"
            desc="Alertas instantǭneas de eliminacin va satǸlite (Discord) con vector de origen."
          />
          <SystemModule 
            id="MOD-03"
            icon={<Terminal size={24} />}
            title="Intel de Eventos"
            desc="Monitoreo automǭtico de activos globales: Barco, Heli y Suministros."
          />
          <SystemModule 
            id="MOD-04"
            icon={<Activity size={24} />}
            title="Monitor de Base"
            desc="Acceso remoto a sistemas CCTV y actuadores elǸctricos (Smart Switches)."
          />
        </div>
      </section>

      {/* Terminal Data Section */}
      <section style={{ padding: '4rem 2rem', background: 'rgba(255, 66, 43, 0.02)', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem' }}>
          <TechData icon={<Wifi size={16}/>} label="LATENCIA" value="0.04 MS" />
          <TechData icon={<HardDrive size={16}/>} label="PERSISTENCIA" value="DB-ENCRYPTED" />
          <TechData icon={<Lock size={16}/>} label="AUTENTICACIN" value="STEAM-V3" />
        </div>
      </section>

      {/* Access Plan Section */}
      <section id="access" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3.5rem', marginBottom: '4rem' }}>Protocolos de Adquisicin</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
          {/* Tactical Plan */}
          <div className="premium-card" style={{ maxWidth: '380px', padding: '0', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>REF: SUBS-30D</div>
              <h3 style={{ fontSize: '1.75rem' }}>Plan de Operaciones</h3>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 400, fontFamily: 'Bebas Neue', marginBottom: '2rem' }}>$9.99 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ MES</span></div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <li>[+] Radar de Eventos Globales</li>
                <li>[+] Alertas de Bajas Intel</li>
                <li>[+] Acceso al Mapa Tǭctico</li>
                <li>[+] Control CCTV Remoto</li>
              </ul>
              <Link href="/api/auth/signin" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                ACTIVAR CONTRATO
              </Link>
            </div>
          </div>

          {/* Lifetime Plan */}
          <div className="premium-card" style={{ 
            maxWidth: '380px', 
            padding: '0', 
            textAlign: 'left', 
            border: '1px solid var(--primary)',
            background: 'rgba(206, 66, 43, 0.05)'
          }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--primary)', background: 'var(--primary)', color: 'white' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem', opacity: 0.8 }}>ALTA PRIORIDAD</div>
              <h3 style={{ fontSize: '1.75rem' }}>Protocolo Vitalicio</h3>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 400, fontFamily: 'Bebas Neue', marginBottom: '2rem' }}>$49.99 <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>PAGO NICO</span></div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <li>[+] Todos los mdulos activos</li>
                <li>[+] Soporte de Prioridad Alfa</li>
                <li>[+] Sin cuotas de mantenimiento</li>
                <li>[+] Rol de Fundador Sentinel</li>
              </ul>
              <Link href="/api/auth/signin" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                ADQUIRIR ACCESO TOTAL
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industrial Footer */}
      <footer style={{ padding: '6rem 2rem 4rem', borderTop: '2px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
          <div style={{ border: '2px solid var(--text-muted)', padding: '4px' }}>
            <Radio color="var(--text-muted)" size={24} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 400, fontFamily: 'Bebas Neue', color: 'var(--text-muted)' }}>SENTINEL // HK-PRODROME</span>
        </div>
        <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', marginBottom: '4rem', opacity: 0.3 }}>
          <Terminal size={20} />
          <Lock size={20} />
          <Zap size={20} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
          RESTRICCIONES: ESTA HERRAMIENTA NO EST AFILIADA CON FACEPUNCH STUDIOS. <br/>
          &copy; 2026 HK SENTINEL PROTOCOL. TODOS LOS DERECHOS RESERVADOS.
        </p>
      </footer>
    </div>
  );
}

function SystemModule({ id, icon, title, desc }: { id: string, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="premium-card" style={{ padding: '2rem' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '1rem' }}>{id}</div>
      <div style={{ marginBottom: '1.5rem', color: 'white' }}>{icon}</div>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'white' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.4 }}>{desc}</p>
    </div>
  );
}

function TechData({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ color: 'var(--primary)' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{value}</div>
      </div>
    </div>
  );
}
