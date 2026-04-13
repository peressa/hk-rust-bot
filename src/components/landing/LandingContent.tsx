"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldAlert, 
  Terminal, 
  Map as MapIcon, 
  Crosshair, 
  Radio, 
  Activity, 
  ChevronRight,
  Monitor,
  Globe
} from "lucide-react";
import { dictionaries, Language } from "@/lib/i18n/dictionaries";

export default function LandingContent() {
  const [lang, setLang] = useState<Language>('en');
  const t = dictionaries[lang];

  // Intentar detectar idioma o cargar de localStorage (opcional)
  useEffect(() => {
    const savedLang = localStorage.getItem('hk-ops-lang') as Language;
    if (savedLang && ['en', 'es', 'pt'].includes(savedLang)) {
      setLang(savedLang);
    }
  }, []);

  const changeLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('hk-ops-lang', l);
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Facepunch Style Sticky Nav */}
      <nav style={{ 
        padding: '0.75rem 4rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '24px', height: '24px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={16} color="white" />
            </div>
            RUST<span style={{ color: 'var(--primary)' }}>OPS</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginLeft: '2rem' }}>
            <NavLink label={t.nav.ops} href="#news" />
            <NavLink label={t.nav.intel} href="/dashboard" />
            <NavLink label={t.nav.comms} href="https://discord.gg/yourserver" />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* Language Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderRight: '1px solid #333', paddingRight: '1.5rem' }}>
            <FlagBtn active={lang === 'en'} onClick={() => changeLang('en')} label="EN" />
            <FlagBtn active={lang === 'es'} onClick={() => changeLang('es')} label="ES" />
            <FlagBtn active={lang === 'pt'} onClick={() => changeLang('pt')} label="PT" />
          </div>
          
          <Link href="/auth/signin" className="btn-primary" style={{ padding: '0.6rem 2rem', fontSize: '0.8rem' }}>
            {t.nav.login}
          </Link>
        </div>
      </nav>

      {/* Hero with EXACT Official Video Background */}
      <section style={{ 
        height: '100vh', 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        background: '#000'
      }}>
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          key="hero-video"
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: 0.5,
            zIndex: 0
          }}
        >
          <source src="https://files.facepunch.com/paddy/20210324/rust_site2021_hero_v002.mp4" type="video/mp4" />
        </video>
        
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, #000 0%, transparent 60%, rgba(0,0,0,0.6) 100%)',
          zIndex: 1
        }}></div>

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', padding: '0 2rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.3em', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            {t.hero.suite}
          </div>
          <h1 style={{ fontSize: '12vw', lineHeight: 0.8, marginBottom: '2.5rem', letterSpacing: '-0.04em' }}>
            RUST <br/> OPS
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#888', maxWidth: '600px', margin: '0 auto 3.5rem', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1.5 }}>
            {t.hero.subtitle}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/auth/signin" className="btn-primary" style={{ padding: '1.5rem 3rem' }}>
              {t.hero.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid - Clean Industrial */}
      <section id="news" style={{ padding: '10rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 className="section-title">{t.modules.title}</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '2.5rem',
          alignItems: 'stretch' // Asegurar que todas las cajas tengan la misma altura
        }}>
          <RustGridItem 
            title={t.modules.radar.title}
            desc={t.modules.radar.desc}
            icon={<MapIcon size={32} />}
          />
          <RustGridItem 
            title={t.modules.kia.title}
            desc={t.modules.kia.desc}
            icon={<ShieldAlert size={32} />}
          />
          <RustGridItem 
            title={t.modules.raid.title}
            desc={t.modules.raid.desc}
            icon={<Activity size={32} />}
          />
          <RustGridItem 
            title={t.modules.smart.title}
            desc={t.modules.smart.desc}
            icon={<Monitor size={32} />}
          />
        </div>
      </section>

      {/* Pricing - Facepunch Style */}
      <section style={{ padding: '10rem 4rem', background: '#0a0a0a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 className="section-title">{t.pricing.title}</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '4rem',
            alignItems: 'stretch' // Estabilizar altura de planes
          }}>
            
            {/* Monthly */}
            <div style={{ borderLeft: '4px solid #333', paddingLeft: '3rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.8rem', marginBottom: '1rem', height: '1rem' }}>{t.pricing.monthly.type}</div>
              <h3 style={{ fontSize: '3rem', marginBottom: '1.5rem', minHeight: '3.5rem', display: 'flex', alignItems: 'center' }}>{t.pricing.monthly.title}</h3>
              <p style={{ color: '#888', marginBottom: '3rem', fontSize: '1.1rem', minHeight: '4.5rem' }}>{t.pricing.monthly.desc}</p>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '4rem', marginBottom: '3rem' }}>{t.pricing.monthly.price} <span style={{ fontSize: '1rem', color: '#555' }}>{t.pricing.monthly.price_sub}</span></div>
                <Link href="/auth/signin" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  {t.pricing.monthly.cta} <ChevronRight size={18} />
                </Link>
              </div>
            </div>

            {/* Annual */}
            <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '3rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.8rem', marginBottom: '1rem', height: '1rem' }}>{t.pricing.annual.type}</div>
              <h3 style={{ fontSize: '3rem', marginBottom: '1.5rem', minHeight: '3.5rem', display: 'flex', alignItems: 'center' }}>{t.pricing.annual.title}</h3>
              <p style={{ color: '#888', marginBottom: '3rem', fontSize: '1.1rem', minHeight: '4.5rem' }}>{t.pricing.annual.desc}</p>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '4rem', marginBottom: '3rem' }}>{t.pricing.annual.price} <span style={{ fontSize: '1rem', color: '#555' }}>{t.pricing.annual.price_sub}</span></div>
                <Link href="/auth/signin" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {t.pricing.annual.cta} <ChevronRight size={18} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Minimalist */}
      <footer style={{ padding: '8rem 4rem', borderTop: '1px solid #111', color: '#444', fontSize: '0.75rem', fontWeight: 700 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#888', marginBottom: '1rem' }}>RUST OPS</div>
            <p>&copy; 2026. ALL RIGHTS RESERVED.</p>
            <p style={{ marginTop: '0.5rem', minHeight: '1rem' }}>{t.footer.restrictions}</p>
            <p style={{ marginTop: '1.5rem', color: 'var(--primary)', fontWeight: 900, fontSize: '0.8rem' }}>
              <a href="https://peressa.dev" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>
                {t.footer.dev}
              </a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4rem' }}>
            <FooterList title="SOCIAL" items={["Discord"]} />
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ label, href }: { label: string, href: string }) {
  return (
    <a href={href} style={{ 
      color: '#888', 
      textDecoration: 'none', 
      fontSize: '0.8rem', 
      fontWeight: 900, 
      transition: 'var(--transition)',
      minWidth: '100px',
      textAlign: 'center'
    }}>
      {label}
    </a>
  );
}

function RustGridItem({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>{icon}</div>
      <h3 style={{ fontSize: '2rem', marginBottom: '1rem', minHeight: '2.5rem', display: 'flex', alignItems: 'center' }}>{title}</h3>
      <p style={{ color: '#888', lineHeight: 1.4, fontSize: '1.1rem', flex: 1 }}>{desc}</p>
    </div>
  );
}

function FooterList({ title, items }: { title: string, items: string[] }) {
  return (
    <div>
      <div style={{ color: '#888', marginBottom: '1rem' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map(item => <div key={item}>{item}</div>)}
      </div>
    </div>
  );
}

function FlagBtn({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        background: 'transparent',
        border: 'none',
        color: active ? '#fff' : '#444',
        fontWeight: 900,
        fontSize: '0.7rem',
        cursor: 'pointer',
        padding: '0.2rem 0.5rem',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );
}
